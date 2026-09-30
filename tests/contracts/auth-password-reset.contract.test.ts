/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// ── Mocks for Dependencies ───────────────────────────────────────────────────

const mockSend = vi.fn();
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function (this: any) {
    this.emails = {
      send: mockSend,
    };
    return this;
  }),
}));

const mockGenerateLink = vi.fn();
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        generateLink: mockGenerateLink,
      },
    },
  }),
}));

const mockVerifyOtp = vi.fn();
const mockGetUser = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      verifyOtp: mockVerifyOtp,
      getUser: mockGetUser,
    },
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
    },
  }),
}));

// Mock DB
let mockDbUsers: any[] = [];
let mockDbTenants: any[] = [];
let mockDbMemberships: any[] = [];

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn((table: any) => ({
        where: vi.fn((condition: any) => ({
          limit: vi.fn(() => {
            // Check condition or return appropriate mock
            return mockDbUsers;
          }),
        })),
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => mockDbMemberships),
          })),
        })),
      })),
    })),
  },
}));

import { POST as handleForgotPassword } from '@/app/api/auth/forgot-password/route';
import { GET as handleAuthCallback } from '@/app/auth/callback/route';
import { resolveSenderEmail, sendPasswordResetEmail, _resetResendInstanceForTesting } from '@/lib/email/resend-service';
import { extractTenantSlug, proxy } from '@/proxy';

describe('WP-AUTH-PASSWORD-RESET-FLOW-001 — Contract & Security Test Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    _resetResendInstanceForTesting();
    process.env = { ...originalEnv };
    process.env.RESEND_API_KEY = 're_test_key_valid';
    process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'serzen-dev.my.id';
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.serzen-dev.my.id';

    mockDbUsers = [];
    mockDbTenants = [];
    mockDbMemberships = [];
  });

  afterEach(() => {
    process.env = originalEnv;
    _resetResendInstanceForTesting();
  });

  // ── TEST 1: Login page exposes Forgot Password link ─────────────────────────
  it('TEST 1: Login page source code exposes Forgot Password link targeting /auth/forgot-password', () => {
    const loginClientPath = path.resolve(process.cwd(), 'src/app/client-page.tsx');
    const content = fs.readFileSync(loginClientPath, 'utf8');

    expect(content).toContain('/auth/forgot-password');
    expect(content).toMatch(/Lupa\s+Password\?/i);
  });

  // ── TEST 2: Forgot Password route files exist ───────────────────────────────
  it('TEST 2: Forgot Password and Reset Password route files exist in workspace', () => {
    const forgotPagePath = path.resolve(process.cwd(), 'src/app/auth/forgot-password/page.tsx');
    const forgotClientPath = path.resolve(process.cwd(), 'src/app/auth/forgot-password/forgot-password-client.tsx');
    const resetPagePath = path.resolve(process.cwd(), 'src/app/auth/reset-password/page.tsx');
    const apiRoutePath = path.resolve(process.cwd(), 'src/app/api/auth/forgot-password/route.ts');

    expect(fs.existsSync(forgotPagePath)).toBe(true);
    expect(fs.existsSync(forgotClientPath)).toBe(true);
    expect(fs.existsSync(resetPagePath)).toBe(true);
    expect(fs.existsSync(apiRoutePath)).toBe(true);
  });

  // ── TEST 3 & 4: Email Enumeration Protection ────────────────────────────────
  it('TEST 3 & 4: Submitting existing vs nonexistent email produces identical neutral response semantics', async () => {
    // 1. Nonexistent email
    mockDbUsers = [];
    const reqNonexistent = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const resNonexistent = await handleForgotPassword(reqNonexistent);
    const jsonNonexistent = await resNonexistent.json();

    expect(resNonexistent.status).toBe(200);
    expect(jsonNonexistent.success).toBe(true);
    expect(jsonNonexistent.message).toBe(
      'Jika email tersebut terdaftar, instruksi pemulihan password telah dikirim. Silakan periksa email Anda.'
    );
    expect(mockGenerateLink).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();

    // 2. Existing active user email
    mockDbUsers = [
      {
        id: 'usr_active_01',
        name: 'Ustadz Ahmad',
        email: 'ahmad@darunnajah.sch.id',
        status: 'ACTIVE',
      },
    ];

    mockGenerateLink.mockResolvedValueOnce({
      data: {
        properties: {
          hashed_token: 'valid_hashed_token_xyz',
        },
      },
      error: null,
    });

    mockSend.mockResolvedValueOnce({
      data: { id: 'msg_test_reset_123' },
      error: null,
    });

    const reqExisting = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'ahmad@darunnajah.sch.id' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const resExisting = await handleForgotPassword(reqExisting);
    const jsonExisting = await resExisting.json();

    expect(resExisting.status).toBe(200);
    expect(jsonExisting.success).toBe(true);
    // CRITICAL: Neutral response messages MUST BE 100% IDENTICAL
    expect(jsonExisting.message).toBe(jsonNonexistent.message);
    expect(mockGenerateLink).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'recovery',
        email: 'ahmad@darunnajah.sch.id',
      })
    );
    expect(mockSend).toHaveBeenCalled();
  });

  // ── TEST 5: Recovery email sender does not use onboarding@resend.dev ────────
  it('TEST 5: Recovery email sender strictly prohibits onboarding@resend.dev', () => {
    process.env.RESEND_FROM_EMAIL = 'onboarding@resend.dev';
    expect(() => resolveSenderEmail()).toThrow(/PROHIBITED_SENDER_DOMAIN.*resend\.dev/i);
  });

  // ── TEST 6: Recovery email sender uses verified domain architecture ─────────
  it('TEST 6: Recovery email sender resolves to verified production domain: noreply@serzen-dev.my.id', async () => {
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_SENDER_EMAIL;

    mockSend.mockResolvedValueOnce({
      data: { id: 'msg_verified_01' },
      error: null,
    });

    const result = await sendPasswordResetEmail('user@darunnajah.id', {
      userName: 'Kyai Ahmad',
      resetUrl: 'https://pp-darunnajah.serzen-dev.my.id/auth/callback?token_hash=abc&type=recovery',
      tenantName: 'Ponpes Darunnajah',
    });

    expect(result.success).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Ma'had Manager <noreply@serzen-dev.my.id>",
        to: 'user@darunnajah.id',
        subject: expect.stringContaining('Pemulihan Kata Sandi'),
      })
    );
  });

  // ── TEST 7: Reset page requires recovery-authenticated state ────────────────
  it('TEST 7: Reset password component redirects to forgot-password if recovery session is absent', () => {
    const resetPageContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/auth/reset-password/page.tsx'),
      'utf8'
    );

    expect(resetPageContent).toContain('checkRecoverySession');
    expect(resetPageContent).toContain('getUser()');
    expect(resetPageContent).toContain('/auth/forgot-password?error=session_required');
  });

  // ── TEST 8: Password policy enforcement ──────────────────────────────────────
  it('TEST 8: Reset page validates minimum 8 characters and confirmation match', () => {
    const resetPageContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/auth/reset-password/page.tsx'),
      'utf8'
    );

    expect(resetPageContent).toContain('password.length < 8');
    expect(resetPageContent).toContain('Kata sandi minimal harus 8 karakter.');
    expect(resetPageContent).toContain('password !== confirmPassword');
    expect(resetPageContent).toContain('Konfirmasi kata sandi tidak cocok.');
  });

  // ── TEST 9: Password update uses existing Supabase Auth mechanism ────────────
  it('TEST 9: Password update uses supabase.auth.updateUser and invalidates session after update', () => {
    const resetPageContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/auth/reset-password/page.tsx'),
      'utf8'
    );

    expect(resetPageContent).toContain('supabase.auth.updateUser({');
    expect(resetPageContent).toContain('password,');
    expect(resetPageContent).toContain('supabase.auth.signOut()');
  });

  // ── TEST 10 & 11: Invariant preservation (Zero new identities / Zero mutations)
  it('TEST 10 & 11: Password recovery API performs zero INSERTs and zero metadata updates', () => {
    const apiRouteContent = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/api/auth/forgot-password/route.ts'),
      'utf8'
    );

    // Verify it only uses select query, no insert or update
    expect(apiRouteContent).not.toContain('.insert(');
    expect(apiRouteContent).not.toContain('.update(');
    expect(apiRouteContent).not.toContain('.delete(');
  });

  // ── TEST 12: MERGED identity cannot be reactivated through recovery ─────────
  it('TEST 12: MERGED identity is barred from password recovery (zero email sent, neutral response preserved)', async () => {
    mockDbUsers = [
      {
        id: 'usr_retired_student',
        name: 'Santri Ex Merged',
        email: 'santri.alumni@darunnajah.sch.id',
        status: 'MERGED',
      },
    ];

    const reqMerged = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'santri.alumni@darunnajah.sch.id' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const resMerged = await handleForgotPassword(reqMerged);
    const jsonMerged = await resMerged.json();

    expect(resMerged.status).toBe(200);
    expect(jsonMerged.success).toBe(true);
    expect(jsonMerged.message).toContain('Jika email tersebut terdaftar');

    // Security Gate Verification: Generate link and email dispatch MUST NOT be called!
    expect(mockGenerateLink).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  // ── TEST 13: Tenant hostname context remains valid ──────────────────────────
  it('TEST 13: Recovery request on tenant subdomain preserves tenant domain in callback link', async () => {
    mockDbUsers = [
      {
        id: 'usr_pilot_01',
        name: 'Admin Darunnajah',
        email: 'admin@darunnajah.id',
        status: 'ACTIVE',
      },
    ];

    mockGenerateLink.mockResolvedValueOnce({
      data: {
        properties: {
          hashed_token: 'darunnajah_token_777',
        },
      },
      error: null,
    });

    mockSend.mockResolvedValueOnce({
      data: { id: 'msg_darunnajah_123' },
      error: null,
    });

    // Request comes with Host: pp-darunnajah.serzen-dev.my.id
    const reqTenant = new NextRequest('https://pp-darunnajah.serzen-dev.my.id/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@darunnajah.id' }),
      headers: {
        'Content-Type': 'application/json',
        host: 'pp-darunnajah.serzen-dev.my.id',
      },
    });

    const resTenant = await handleForgotPassword(reqTenant);
    expect(resTenant.status).toBe(200);

    // Verify callback URL contains tenant domain
    expect(mockGenerateLink).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('https://pp-darunnajah.serzen-dev.my.id/auth/callback'),
        }),
      })
    );

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('https://pp-darunnajah.serzen-dev.my.id/auth/callback?token_hash='),
      })
    );
  });

  // ── TEST 14: No madev.id hardcoding in password reset code ──────────────────
  it('TEST 14: No hardcoded madev.id in new password recovery components', () => {
    const forgotPage = fs.readFileSync(path.resolve(process.cwd(), 'src/app/auth/forgot-password/page.tsx'), 'utf8');
    const forgotClient = fs.readFileSync(path.resolve(process.cwd(), 'src/app/auth/forgot-password/forgot-password-client.tsx'), 'utf8');
    const resetPage = fs.readFileSync(path.resolve(process.cwd(), 'src/app/auth/reset-password/page.tsx'), 'utf8');
    const apiRoute = fs.readFileSync(path.resolve(process.cwd(), 'src/app/api/auth/forgot-password/route.ts'), 'utf8');
    const emailTemplate = fs.readFileSync(path.resolve(process.cwd(), 'src/lib/email/templates/password-reset.tsx'), 'utf8');

    [forgotPage, forgotClient, resetPage, apiRoute, emailTemplate].forEach((content) => {
      expect(content).not.toMatch(/https?:\/\/[a-z0-9.-]*madev\.id/i);
    });
  });

  // ── TEST 15 & 16: No client secrets ─────────────────────────────────────────
  it('TEST 15 & 16: No service-role key or NEXT_PUBLIC_RESEND_API_KEY in client bundles', () => {
    const clientFiles = [
      'src/app/client-page.tsx',
      'src/app/auth/forgot-password/forgot-password-client.tsx',
      'src/app/auth/reset-password/page.tsx',
    ];

    clientFiles.forEach((file) => {
      const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE');
      expect(content).not.toContain('NEXT_PUBLIC_RESEND_API_KEY');
      expect(content).not.toContain('process.env.RESEND_API_KEY');
    });
  });

  // ── TEST 17: Invitation flow remains distinct and intact ─────────────────────
  it('TEST 17: Auth callback preserves strict separation between invite and recovery flows', async () => {
    // 1. Recovery flow redirects to /auth/reset-password on success
    mockVerifyOtp.mockResolvedValueOnce({ error: null });

    const recoveryReq = new NextRequest(
      'http://localhost:3000/auth/callback?token_hash=token123&type=recovery'
    );
    const recoveryRes = await handleAuthCallback(recoveryReq);
    expect(recoveryRes.status).toBe(307);
    expect(recoveryRes.headers.get('location')).toBe('http://localhost:3000/auth/reset-password');

    // 2. Recovery failure redirects to /auth/forgot-password?error=invalid_or_expired_link
    mockVerifyOtp.mockResolvedValueOnce({ error: { message: 'Token expired' } });
    const recoveryFailReq = new NextRequest(
      'http://localhost:3000/auth/callback?token_hash=expired123&type=recovery'
    );
    const recoveryFailRes = await handleAuthCallback(recoveryFailReq);
    expect(recoveryFailRes.status).toBe(307);
    expect(recoveryFailRes.headers.get('location')).toContain(
      '/auth/forgot-password?error=invalid_or_expired_link'
    );

    // 3. Invitation flow strictly preserves redirect to /auth/set-password
    mockVerifyOtp.mockResolvedValueOnce({ error: null });
    const inviteReq = new NextRequest(
      'http://localhost:3000/auth/callback?token_hash=invite123&type=invite'
    );
    const inviteRes = await handleAuthCallback(inviteReq);
    expect(inviteRes.status).toBe(307);
    expect(inviteRes.headers.get('location')).toBe('http://localhost:3000/auth/set-password');

    // 4. Invitation failure preserves redirect to /login?error=invitation_expired
    mockVerifyOtp.mockResolvedValueOnce({ error: { message: 'Invite expired' } });
    const inviteFailReq = new NextRequest(
      'http://localhost:3000/auth/callback?token_hash=bad123&type=invite'
    );
    const inviteFailRes = await handleAuthCallback(inviteFailReq);
    expect(inviteFailRes.status).toBe(307);
    expect(inviteFailRes.headers.get('location')).toContain('/login?error=invitation_expired');
  });

  // ── TEST 18: Proxy route security and public route narrowness ───────────────
  it('TEST 18: Proxy explicitly permits narrow recovery routes while protecting internal routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    // Public allowed recovery routes
    const forgotReq = new NextRequest('http://localhost:3000/auth/forgot-password');
    const forgotRes = await proxy(forgotReq);
    expect(forgotRes.status).toBe(200);

    const resetReq = new NextRequest('http://localhost:3000/auth/reset-password');
    const resetRes = await proxy(resetReq);
    expect(resetRes.status).toBe(200);

    // Protected operational routes must redirect unauthenticated visitors
    const dashboardReq = new NextRequest('http://localhost:3000/dashboard');
    const dashboardRes = await proxy(dashboardReq);
    expect(dashboardRes.status).toBe(307);
    expect(dashboardRes.headers.get('location')).toContain('/login?redirect=%2Fdashboard');

    const apiProtectedReq = new NextRequest('http://localhost:3000/api/santri');
    const apiProtectedRes = await proxy(apiProtectedReq);
    expect(apiProtectedRes.status).toBe(401);
  });
});
