/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted for top-level mock functions in Vitest
const { mockRequirePermission, mockGetTenantContext, mockWithTenantTransaction, mockGetUser } = vi.hoisted(() => ({
  mockRequirePermission: vi.fn(),
  mockGetTenantContext: vi.fn(),
  mockWithTenantTransaction: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

vi.mock('@/lib/authz/authorization-service', () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock('@/lib/tenant/context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/tenant/context')>();
  return {
    ...actual,
    getTenantContext: mockGetTenantContext,
  };
});

vi.mock('@/lib/db/tenant-transaction', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db/tenant-transaction')>();
  return {
    ...actual,
    withTenantTransaction: mockWithTenantTransaction.mockImplementation(actual.withTenantTransaction),
  };
});

vi.mock('@/lib/db', () => {
  const mockDb = {
    execute: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'santri-1', name: 'Ahmad' }]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ id: 'santri-new' }]),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ success: true }]),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ success: true }]),
    }),
    transaction: vi.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(mockDb)),
  };
  return { db: mockDb };
});

import { GET, POST } from '../../src/app/api/db/query/route';
import { TenantNotFoundError, TenantUnavailableError } from '@/lib/tenant/context';

describe('WP-101 Phase 1F — Authorization Enforcement Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('No session'),
    });
    mockGetTenantContext.mockResolvedValue({
      id: 'tenant-alfatih',
      name: 'Pesantren Al Fatih',
      slug: 'alfatih',
    });
  });

  describe('1. API Route Read Authorization Enforcement (GET /api/db/query)', () => {
    it('returns 401 Unauthorized when user identity is completely missing (Fail-Closed)', async () => {
      const req = new NextRequest('http://localhost/api/db/query?collection=santri');

      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
      expect(json.code).toBe('UNAUTHENTICATED');
      expect(mockRequirePermission).not.toHaveBeenCalled();
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();
    });

    it('returns 401 Unauthorized when user identity is empty or whitespace', async () => {
      const req = new NextRequest('http://localhost/api/db/query?collection=santri', {
        headers: {
          'x-user-id': '   ',
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
      expect(json.code).toBe('UNAUTHENTICATED');
      expect(mockRequirePermission).not.toHaveBeenCalled();
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();
    });

    it('should return 403 Forbidden when user is missing required read permission', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-unprivileged' } }, error: null });
      mockRequirePermission.mockResolvedValue({
        authorized: false,
        decision: 'DENIED_PERMISSION_MISSING',
        reason: 'User missing required permission: view_santri',
      });

      const req = new NextRequest('http://localhost/api/db/query?collection=santri', {
        headers: {
          'x-user-id': 'user-unprivileged',
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
      expect(json.message).toContain('view_santri');
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();
    });

    it('should return 200 OK when user possesses required read permission', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-authorized' } }, error: null });
      mockRequirePermission.mockResolvedValue({
        authorized: true,
        decision: 'AUTHORIZED',
        effectivePermissions: new Set(['view_santri']),
      });

      const req = new NextRequest('http://localhost/api/db/query?collection=santri', {
        headers: {
          'x-user-id': 'user-authorized',
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.tenantId).toBe('tenant-alfatih');
      expect(json.data).toBeDefined();
    });
  });

  describe('2. API Route Mutation Authorization Enforcement (POST /api/db/query)', () => {
    it('returns 401 Unauthorized when mutation is attempted without authenticated identity', async () => {
      const req = new NextRequest('http://localhost/api/db/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: 'santri',
          action: 'create',
          data: { name: 'Santri Hacker' },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
      expect(json.code).toBe('UNAUTHENTICATED');
      expect(mockRequirePermission).not.toHaveBeenCalled();
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();
    });

    it('returns 401 Unauthorized when mutation is attempted with empty identity string', async () => {
      const req = new NextRequest('http://localhost/api/db/query', {
        method: 'POST',
        headers: {
          'x-user-id': '',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: 'santri',
          action: 'create',
          data: { name: 'Santri Hacker' },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe('Unauthorized');
      expect(json.code).toBe('UNAUTHENTICATED');
      expect(mockRequirePermission).not.toHaveBeenCalled();
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();
    });

    it('should return 403 Forbidden when user attempts mutation without write permission', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-unprivileged' } }, error: null });
      mockRequirePermission.mockResolvedValue({
        authorized: false,
        decision: 'DENIED_PERMISSION_MISSING',
        reason: 'User missing required permission: manage_santri',
      });

      const req = new NextRequest('http://localhost/api/db/query', {
        method: 'POST',
        headers: {
          'x-user-id': 'user-unprivileged',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: 'santri',
          action: 'create',
          data: { name: 'Santri Baru' },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();
    });

    it('should return 200 OK for authorized mutation when user possesses write permission', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-authorized' } }, error: null });
      mockRequirePermission.mockResolvedValue({
        authorized: true,
        decision: 'AUTHORIZED',
        effectivePermissions: new Set(['manage_santri']),
      });

      const req = new NextRequest('http://localhost/api/db/query', {
        method: 'POST',
        headers: {
          'x-user-id': 'user-authorized',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: 'santri',
          action: 'create',
          data: { name: 'Santri Baru' },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.tenantId).toBe('tenant-alfatih');
    });

    it('strictly overrides client-forged tenantId with server-resolved tenant context on mutation', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-authorized' } }, error: null });
      mockRequirePermission.mockResolvedValue({
        authorized: true,
        decision: 'AUTHORIZED',
        effectivePermissions: new Set(['manage_santri']),
      });

      const req = new NextRequest('http://localhost/api/db/query', {
        method: 'POST',
        headers: {
          'x-user-id': 'user-authorized',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: 'santri',
          action: 'create',
          data: {
            name: 'Santri Infiltrator',
            tenantId: 'spoofed-evil-tenant-id', // Attacker attempts to inject cross-tenant ID
          },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      // The returned tenantId and stored context must strictly be tenant-alfatih, NOT spoofed
      expect(json.tenantId).toBe('tenant-alfatih');
    });
  });

  describe('3. Tenant Resolution Failure Isolation (GET /api/db/query)', () => {
    it('should abort without calling requirePermission or withTenantTransaction when tenant is not found', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-authorized' } }, error: null });
      mockGetTenantContext.mockRejectedValue(new TenantNotFoundError('non-existent-tenant'));

      const req = new NextRequest('http://localhost/api/db/query?collection=santri', {
        headers: {
          'x-user-id': 'user-authorized',
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(500);
      expect(mockRequirePermission).not.toHaveBeenCalled();
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();

      const json = await res.json();
      expect(json.tenantId).toBeUndefined();
      expect(json.data).toBeUndefined();
      expect(json.error).toBe('Failed to query database');
    });

    it('should abort without calling requirePermission or withTenantTransaction when tenant query is unavailable', async () => {
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-authorized' } }, error: null });
      mockGetTenantContext.mockRejectedValue(new TenantUnavailableError('Database query failed'));

      const req = new NextRequest('http://localhost/api/db/query?collection=santri', {
        headers: {
          'x-user-id': 'user-authorized',
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(500);
      expect(mockRequirePermission).not.toHaveBeenCalled();
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();

      const json = await res.json();
      expect(json.tenantId).toBeUndefined();
      expect(json.data).toBeUndefined();
      expect(json.error).toBe('Failed to query database');
    });
  });
});
