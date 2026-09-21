import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load .env.local if present
if (fs.existsSync(path.resolve(process.cwd(), '.env.local'))) {
  const envConfig = dotenv.parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')));
  for (const k in envConfig) {
    if (!process.env[k]) {
      process.env[k] = envConfig[k];
    }
  }
}

// Global mock state for SSR client
const mockSsrState = {
  callerUser: null as any,
  signInResponse: {
    data: {
      session: {
        access_token: 'mock_preview_jwt',
        refresh_token: 'mock_preview_refresh',
        user: { id: 'prev_user_id', email: 'preview.admin@madev.id' },
      },
    },
    error: null as any,
  },
  verifyOtpResponse: {
    data: { session: { user: { id: 'sa_orig_01', email: 'superadmin@madev.id' } } },
    error: null as any,
  },
};

const mockAdminState = {
  generateLinkError: null as any,
  hashedToken: 'mock_hashed_token_abc',
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        generateLink: vi.fn().mockImplementation(async () => {
          if (mockAdminState.generateLinkError) {
            return { data: {}, error: mockAdminState.generateLinkError };
          }
          return {
            data: {
              properties: {
                hashed_token: mockAdminState.hashedToken,
              },
            },
            error: null,
          };
        }),
      },
    },
  })),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockImplementation(async () => ({
        data: { user: mockSsrState.callerUser },
        error: null,
      })),
      signInWithPassword: vi.fn().mockImplementation(async () => mockSsrState.signInResponse),
      verifyOtp: vi.fn().mockImplementation(async () => mockSsrState.verifyOtpResponse),
    },
  })),
}));

import {
  createOriginTicket,
  validateOriginTicket,
  consumeOriginTicket,
  touchOriginTicket,
  hashOriginTicket,
  FIXED_ORIGIN_TICKET_TTL_MS,
  SharedOriginTicketStorage,
  setOriginTicketStorage,
  getOriginTicketStorage,
  COOKIE_PREVIEW_ORIGIN_TICKET,
} from '@/lib/authz/preview-origin-ticket';
import { POST as handleRolePreview } from '@/app/api/auth/role-preview/route';
import { POST as handleExitPreview } from '@/app/api/auth/role-preview/exit/route';

describe('WP-LOGIN-PREVIEW-PLATFORM-001 — Security Amendment & Authorization Tests', () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    process.env = { ...originalEnv };
    process.env.ROLE_PREVIEW_ENABLED = 'true';
    (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
    process.env.ROLE_PREVIEW_SECRET = 'TestSecret123!';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-key';

    // Reset fresh shared storage instance
    const freshStore = new SharedOriginTicketStorage(new Map());
    setOriginTicketStorage(freshStore);

    mockSsrState.callerUser = null;
    mockSsrState.signInResponse = {
      data: {
        session: {
          access_token: 'mock_preview_jwt',
          refresh_token: 'mock_preview_refresh',
          user: { id: 'prev_user_id', email: 'preview.admin@madev.id' },
        },
      },
      error: null,
    };
    mockSsrState.verifyOtpResponse = {
      data: { session: { user: { id: 'sa_orig_01', email: 'superadmin@madev.id' } } },
      error: null,
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // OPAQUE ORIGIN TICKET UNIT CONTRACTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('A. Opaque Origin Ticket Invariants & Storage Amendment', () => {
    it('creates an opaque ticket with 64-character random hex string and zero tokens', async () => {
      const ticket = await createOriginTicket('user_123', 'superadmin@madev.id', 'super_admin');
      expect(ticket.ticketId).toHaveLength(64);
      expect(ticket.originUserId).toBe('user_123');
      expect(ticket.originUserEmail).toBe('superadmin@madev.id');
      expect(ticket.consumed).toBe(false);
      expect(ticket.expiresAt).toBeGreaterThan(Date.now());
      // Absolute invariant: NO JWT or credentials
      expect(ticket.ticketId).not.toContain('eyJ');
      expect(ticket.ticketId).not.toContain('Bearer');
    });

    it('stores ONLY SHA-256 hash in storage, never storing raw ticket', async () => {
      const ticket = await createOriginTicket('user_123', 'superadmin@madev.id', 'super_admin');
      const expectedHash = hashOriginTicket(ticket.ticketId);

      expect(ticket.ticketHash).toBe(expectedHash);

      // Verify the storage contains the hash key, not the raw ticket ID
      const storage = getOriginTicketStorage() as SharedOriginTicketStorage;
      const foundByHash = await storage.findValidTicket(expectedHash);
      expect(foundByHash).not.toBeNull();
      expect(foundByHash?.ticketHash).toBe(expectedHash);

      // Raw ticket must NOT be a key in storage
      const foundByRaw = await storage.findValidTicket(ticket.ticketId);
      expect(foundByRaw).toBeNull();
    });

    it('validates active unconsumed ticket and rejects unknown/tampered ticket', async () => {
      const ticket = await createOriginTicket('user_123', 'superadmin@madev.id', 'super_admin');
      const valid = await validateOriginTicket(ticket.ticketId);
      expect(valid).not.toBeNull();
      expect(valid?.originUserId).toBe('user_123');

      // Test 11: Tampered ticket
      const tampered = await validateOriginTicket(ticket.ticketId.slice(0, 60) + 'ffff');
      expect(tampered).toBeNull();
    });

    it('enforces Single-Use consumption (Test 9: Replay origin ticket -> DENY)', async () => {
      const ticket = await createOriginTicket('user_123', 'superadmin@madev.id', 'super_admin');
      // First consumption succeeds
      const consumed = await consumeOriginTicket(ticket.ticketId);
      expect(consumed).not.toBeNull();
      expect(consumed?.consumed).toBe(true);

      // Second consumption (REPLAY ATTACK) fails immediately
      const replay = await consumeOriginTicket(ticket.ticketId);
      expect(replay).toBeNull();

      // Validation also fails
      expect(await validateOriginTicket(ticket.ticketId)).toBeNull();
    });

    it('rejects expired origin tickets (Test 10: Expired origin ticket -> DENY)', async () => {
      // Create ticket with negative TTL (already expired)
      const ticket = await createOriginTicket('user_123', 'superadmin@madev.id', 'super_admin', -1000);
      expect(await validateOriginTicket(ticket.ticketId)).toBeNull();
      expect(await consumeOriginTicket(ticket.ticketId)).toBeNull();
    });

    it('enforces fixed 15-minute TTL without sliding expiration during touch', async () => {
      const startTime = Date.now();
      const ticket = await createOriginTicket('user_123', 'superadmin@madev.id', 'super_admin');
      
      // Expected expiration is exactly 15 minutes from creation
      expect(ticket.expiresAt - startTime).toBeCloseTo(FIXED_ORIGIN_TICKET_TTL_MS, -2);

      // Touching the ticket validates presence but does NOT extend fixed expiration
      const touched = await touchOriginTicket(ticket.ticketId);
      expect(touched).toBe(true);

      const validated = await validateOriginTicket(ticket.ticketId);
      expect(validated?.expiresAt).toBe(ticket.expiresAt);
    });

    it('guarantees distributed cross-instance restoration (Instance A creates, Instance B consumes)', async () => {
      // Shared state representation across instances
      const sharedClusterMemory = new Map();
      const instanceA_Storage = new SharedOriginTicketStorage(sharedClusterMemory);
      const instanceB_Storage = new SharedOriginTicketStorage(sharedClusterMemory);

      // Instance A creates ticket
      setOriginTicketStorage(instanceA_Storage);
      const ticket = await createOriginTicket('user_cross', 'superadmin@madev.id', 'super_admin');

      // Instance B retrieves and consumes ticket
      setOriginTicketStorage(instanceB_Storage);
      const validOnB = await validateOriginTicket(ticket.ticketId);
      expect(validOnB).not.toBeNull();
      expect(validOnB?.originUserId).toBe('user_cross');

      const consumedOnB = await consumeOriginTicket(ticket.ticketId);
      expect(consumedOnB).not.toBeNull();
      expect(consumedOnB?.consumed).toBe(true);

      // Instance A now observes ticket as consumed
      setOriginTicketStorage(instanceA_Storage);
      expect(await validateOriginTicket(ticket.ticketId)).toBeNull();
      expect(await consumeOriginTicket(ticket.ticketId)).toBeNull();
    });

    it('retains ticket state across simulated process restart', async () => {
      const persistentClusterStore = new Map();
      
      // Runtime before restart
      const preRestartStorage = new SharedOriginTicketStorage(persistentClusterStore);
      setOriginTicketStorage(preRestartStorage);
      const ticket = await createOriginTicket('user_persist', 'superadmin@madev.id', 'super_admin');

      // Simulate process restart: new storage instance connected to same persistent backend
      const postRestartStorage = new SharedOriginTicketStorage(persistentClusterStore);
      setOriginTicketStorage(postRestartStorage);

      const restored = await validateOriginTicket(ticket.ticketId);
      expect(restored).not.toBeNull();
      expect(restored?.originUserId).toBe('user_persist');
      expect(restored?.originUserEmail).toBe('superadmin@madev.id');
    });

    it('enforces atomic single-use under concurrent consumption race', async () => {
      const ticket = await createOriginTicket('user_race', 'superadmin@madev.id', 'super_admin');

      // Dispatch 10 concurrent requests to consume the exact same ticket
      const results = await Promise.all([
        consumeOriginTicket(ticket.ticketId),
        consumeOriginTicket(ticket.ticketId),
        consumeOriginTicket(ticket.ticketId),
        consumeOriginTicket(ticket.ticketId),
        consumeOriginTicket(ticket.ticketId),
        consumeOriginTicket(ticket.ticketId),
        consumeOriginTicket(ticket.ticketId),
        consumeOriginTicket(ticket.ticketId),
        consumeOriginTicket(ticket.ticketId),
        consumeOriginTicket(ticket.ticketId),
      ]);

      // Exactly ONE caller succeeds
      const successes = results.filter((res) => res !== null);
      const failures = results.filter((res) => res === null);

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(9);
    });

    it('strictly binds origin identity (originUserId, originUserEmail, originUserRole)', async () => {
      const ticket = await createOriginTicket('super_admin_uuid_456', 'principal@madev.id', 'developer');
      const record = await validateOriginTicket(ticket.ticketId);

      expect(record?.originUserId).toBe('super_admin_uuid_456');
      expect(record?.originUserEmail).toBe('principal@madev.id');
      expect(record?.originUserRole).toBe('developer');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SERVER-SIDE CALLER AUTHORIZATION CONTRACTS
  // ─────────────────────────────────────────────────────────────────────────────
  describe('B. Mandatory Security Tests (Tests 1 to 7)', () => {
    it('Test 1: Anonymous -> POST /api/auth/role-preview -> Expected: 403 Forbidden', async () => {
      mockSsrState.callerUser = null;

      const req = new NextRequest('http://localhost:3000/api/auth/role-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });

      const res = await handleRolePreview(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('UNAUTHORIZED_CALLER');
    });

    it('Test 2: Wali -> POST /api/auth/role-preview -> Expected: 403 Forbidden', async () => {
      mockSsrState.callerUser = {
        id: 'wali_usr_01',
        email: 'wali.test@pondok.id',
        user_metadata: { role: 'wali' },
      };

      const req = new NextRequest('http://localhost:3000/api/auth/role-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'developer' }),
      });

      const res = await handleRolePreview(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('UNAUTHORIZED_CALLER');
    });

    it('Test 3: Santri -> POST /api/auth/role-preview -> Expected: 403 Forbidden', async () => {
      mockSsrState.callerUser = {
        id: 'santri_usr_01',
        email: 'santri.test@pondok.id',
        user_metadata: { role: 'santri' },
      };

      const req = new NextRequest('http://localhost:3000/api/auth/role-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });

      const res = await handleRolePreview(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('UNAUTHORIZED_CALLER');
    });

    it('Test 4: Musyrif -> POST /api/auth/role-preview -> Expected: 403 Forbidden', async () => {
      mockSsrState.callerUser = {
        id: 'musyrif_usr_01',
        email: 'musyrif.test@pondok.id',
        user_metadata: { role: 'musyrif' },
      };

      const req = new NextRequest('http://localhost:3000/api/auth/role-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });

      const res = await handleRolePreview(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('UNAUTHORIZED_CALLER');
    });

    it('Test 5: Admin Pesantren -> POST /api/auth/role-preview -> Expected: 403 Forbidden', async () => {
      mockSsrState.callerUser = {
        id: 'admin_usr_01',
        email: 'admin.pesantren@pondok.id',
        user_metadata: { role: 'admin' },
      };

      const req = new NextRequest('http://localhost:3000/api/auth/role-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'developer' }),
      });

      const res = await handleRolePreview(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('UNAUTHORIZED_CALLER');
    });

    it('Test 6: Super Admin -> POST /api/auth/role-preview -> Expected: 200 OK + Origin Ticket', async () => {
      mockSsrState.callerUser = {
        id: 'sa_usr_01',
        email: 'superadmin@madev.id',
        app_metadata: { role: 'super_admin' },
      };

      const req = new NextRequest('http://localhost:3000/api/auth/role-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });

      const res = await handleRolePreview(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.persona).toBe('admin');

      // Verifies opaque origin ticket cookie was issued
      const ticketCookie = res.cookies.get(COOKIE_PREVIEW_ORIGIN_TICKET);
      expect(ticketCookie).toBeDefined();
      expect(ticketCookie?.value).toHaveLength(64);
      expect(ticketCookie?.httpOnly).toBe(true);
    });

    it('Test 7: Developer -> POST /api/auth/role-preview -> Expected: 200 OK', async () => {
      mockSsrState.callerUser = {
        id: 'dev_usr_01',
        email: 'developer@madev.id',
        app_metadata: { role: 'developer' },
      };

      const req = new NextRequest('http://localhost:3000/api/auth/role-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'santri' }),
      });

      const res = await handleRolePreview(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.persona).toBe('santri');
    });

    it('Test 12: Client tries to inject tenantId -> Server ignores it', async () => {
      mockSsrState.callerUser = {
        id: 'sa_usr_01',
        email: 'superadmin@madev.id',
        app_metadata: { role: 'super_admin' },
      };

      const req = new NextRequest('http://localhost:3000/api/auth/role-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin', tenantId: 'malicious_tenant_bypass' }),
      });

      const res = await handleRolePreview(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('Test 13: Client tries to inject malicious role -> Expected: 400 Bad Request', async () => {
      mockSsrState.callerUser = {
        id: 'sa_usr_01',
        email: 'superadmin@madev.id',
        app_metadata: { role: 'super_admin' },
      };

      const req = new NextRequest('http://localhost:3000/api/auth/role-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'ROOT_SUPERUSER_INJECT' }),
      });

      const res = await handleRolePreview(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('tidak dikenali');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // EXIT PREVIEW & SESSION RESTORATION CONTRACTS (Tests 8 to 14)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('C. Exit Preview & Session Restoration', () => {
    it('Test 8 & 14: Valid Preview -> Exit Preview -> Restores Super Admin Session', async () => {
      // 1. Issue an origin ticket
      const ticket = await createOriginTicket('sa_orig_01', 'superadmin@madev.id', 'super_admin');

      // Create Exit Request carrying the opaque cookie
      const req = new NextRequest('http://localhost:3000/api/auth/role-preview/exit', {
        method: 'POST',
        headers: {
          cookie: `${COOKIE_PREVIEW_ORIGIN_TICKET}=${ticket.ticketId}`,
        },
      });

      const res = await handleExitPreview(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.redirectTo).toBe('/dashboard/saas/preview');
      expect(data.message).toContain('superadmin@madev.id');

      // Cookie ticket must be expired/cleared
      const clearedTicket = res.cookies.get(COOKIE_PREVIEW_ORIGIN_TICKET);
      expect(clearedTicket?.maxAge).toBe(0);
    });

    it('Test 9: Replay Exit Preview with consumed ticket -> Expected: 403 Forbidden', async () => {
      const ticket = await createOriginTicket('sa_orig_01', 'superadmin@madev.id', 'super_admin');
      await consumeOriginTicket(ticket.ticketId); // Already consumed!

      const req = new NextRequest('http://localhost:3000/api/auth/role-preview/exit', {
        method: 'POST',
        headers: {
          cookie: `${COOKIE_PREVIEW_ORIGIN_TICKET}=${ticket.ticketId}`,
        },
      });

      const res = await handleExitPreview(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('INVALID_ORIGIN_TICKET');
    });

    it('Test 10: Exit Preview with expired ticket -> Expected: 403 Forbidden', async () => {
      const ticket = await createOriginTicket('sa_orig_01', 'superadmin@madev.id', 'super_admin', -5000);

      const req = new NextRequest('http://localhost:3000/api/auth/role-preview/exit', {
        method: 'POST',
        headers: {
          cookie: `${COOKIE_PREVIEW_ORIGIN_TICKET}=${ticket.ticketId}`,
        },
      });

      const res = await handleExitPreview(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('INVALID_ORIGIN_TICKET');
    });

    it('Test 11: Exit Preview with missing/tampered ticket -> Expected: 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth/role-preview/exit', {
        method: 'POST',
        headers: {
          cookie: `${COOKIE_PREVIEW_ORIGIN_TICKET}=invalid_fake_opaque_token_12345`,
        },
      });

      const res = await handleExitPreview(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('INVALID_ORIGIN_TICKET');
    });
  });
});
