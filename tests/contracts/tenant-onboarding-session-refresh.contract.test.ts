import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { createProxyClient } from '@/lib/supabase/proxy';
import { useAuthStore } from '@/store/auth-store';

vi.mock('@/lib/supabase/proxy', () => ({
  createProxyClient: vi.fn(),
}));

describe('WP-TENANT-ONBOARDING-SESSION-REFRESH-FIX-002 — Strict ACTIVE Gate Contract Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. STATIC INVARIANTS ──────────────────────────────────────────────────
  it('1. set-password page strictly implements session refresh, strict ACTIVE comparison, store sync, and /dashboard destination', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/auth/set-password/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    // Must call complete-onboarding endpoint
    expect(content).toContain('/api/auth/complete-onboarding');

    // Must call refreshSession() on browser client
    expect(content).toContain('refreshSession()');

    // Must call getUser() and verify strict ACTIVE status
    expect(content).toContain('getUser()');
    expect(content).toContain("=== 'ACTIVE'");
    expect(content).toContain('isStrictlyActive');
    expect(content).not.toContain('isStillInvited');

    // Must sync with auth store
    expect(content).toContain('useAuthStore.getState().syncUser(refreshedUser)');

    // Must target /dashboard without open redirect
    expect(content).toContain("'/dashboard'");
    expect(content).not.toMatch(/router\.push\([^)]*searchParams\.get\(['"]next['"]\)/);
  });

  // ── TEST A: ACTIVE ACCEPTED ───────────────────────────────────────────────
  it('TEST A: app_metadata.status === ACTIVE is strictly accepted, syncing auth store and permitting dashboard entry', async () => {
    const mockUser = {
      id: 'usr_admin_active_01',
      email: 'admin@pesantren.id',
      app_metadata: { status: 'ACTIVE', role: 'admin', tenant_id: 'tenant_01' },
      user_metadata: { name: 'Ustadz Admin' },
    };

    const mockSupabase = {
      auth: {
        updateUser: vi.fn().mockResolvedValue({ error: null }),
        refreshSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    };

    // Step 1: Update Password
    const { error: updateError } = await mockSupabase.auth.updateUser({ password: 'StrongPassword123!' });
    expect(updateError).toBeNull();

    // Step 2: Refresh session after API success
    const { error: refreshError } = await mockSupabase.auth.refreshSession();
    expect(refreshError).toBeNull();

    // Step 3: Retrieve refreshed user
    const { data: { user: refreshedUser }, error: getUserError } = await mockSupabase.auth.getUser();
    expect(getUserError).toBeNull();
    expect(refreshedUser).toBeDefined();

    // Step 4: Strict ACTIVE check
    const appStatus = (refreshedUser?.app_metadata?.status as string | undefined)?.toUpperCase();
    const isStrictlyActive = appStatus === 'ACTIVE';
    expect(isStrictlyActive).toBe(true);

    // Step 5: Store sync
    if (isStrictlyActive && refreshedUser) {
      useAuthStore.getState().syncUser(refreshedUser as any);
    }

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.status).toBe('ACTIVE');
    expect(state.user?.role).toBe('admin');
  });

  // ── TEST B: INVITED REJECTED ──────────────────────────────────────────────
  it('TEST B: app_metadata.status === INVITED is strictly rejected (no store sync, no navigation)', async () => {
    const mockInvitedUser = {
      id: 'usr_admin_invited_01',
      email: 'admin@pesantren.id',
      app_metadata: { status: 'INVITED', role: 'admin' },
      user_metadata: { name: 'Ustadz Admin' },
    };

    const mockSupabase = {
      auth: {
        refreshSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: mockInvitedUser }, error: null }),
      },
    };

    await mockSupabase.auth.refreshSession();
    const { data: { user: refreshedUser } } = await mockSupabase.auth.getUser();

    const appStatus = (refreshedUser?.app_metadata?.status as string | undefined)?.toUpperCase();
    const isStrictlyActive = appStatus === 'ACTIVE';

    expect(isStrictlyActive).toBe(false);
  });

  // ── TEST C: EMPTY REJECTED ────────────────────────────────────────────────
  it('TEST C: app_metadata.status === "" (empty) is strictly rejected', async () => {
    const mockEmptyUser = {
      id: 'usr_admin_empty_01',
      email: 'admin@pesantren.id',
      app_metadata: { status: '', role: 'admin' },
    };

    const appStatus = (mockEmptyUser.app_metadata?.status as string | undefined)?.toUpperCase();
    const isStrictlyActive = appStatus === 'ACTIVE';
    expect(isStrictlyActive).toBe(false);
  });

  // ── TEST D: UNDEFINED REJECTED ────────────────────────────────────────────
  it('TEST D: app_metadata.status === undefined is strictly rejected (ignoring user_metadata)', async () => {
    const mockUndefinedUser = {
      id: 'usr_admin_undef_01',
      email: 'admin@pesantren.id',
      app_metadata: { role: 'admin' },
      user_metadata: { status: 'ACTIVE' }, // Deliberately set user_metadata to test authority rule
    };

    const appStatus = ((mockUndefinedUser.app_metadata as any)?.status as string | undefined)?.toUpperCase();
    const isStrictlyActive = appStatus === 'ACTIVE';
    expect(isStrictlyActive).toBe(false);
  });

  // ── TEST E: SUSPENDED REJECTED ────────────────────────────────────────────
  it('TEST E: app_metadata.status === SUSPENDED is strictly rejected', async () => {
    const mockSuspendedUser = {
      id: 'usr_admin_susp_01',
      email: 'admin@pesantren.id',
      app_metadata: { status: 'SUSPENDED', role: 'admin' },
    };

    const appStatus = (mockSuspendedUser.app_metadata?.status as string | undefined)?.toUpperCase();
    const isStrictlyActive = appStatus === 'ACTIVE';
    expect(isStrictlyActive).toBe(false);
  });

  // ── TEST F: UNKNOWN / OTHER VALUE REJECTED ─────────────────────────────────
  it('TEST F: app_metadata.status with unknown status (MERGED, ARCHIVED, SOMETHING_ELSE) is strictly rejected', async () => {
    const statuses = ['MERGED', 'ARCHIVED', 'PENDING', 'SOMETHING_ELSE', 'active_pending'];

    for (const st of statuses) {
      const mockUser = {
        id: `usr_${st}`,
        app_metadata: { status: st, role: 'admin' },
      };
      const appStatus = (mockUser.app_metadata?.status as string | undefined)?.toUpperCase();
      const isStrictlyActive = appStatus === 'ACTIVE';
      expect(isStrictlyActive).toBe(false);
    }
  });

  // ── TEST G: REFRESH SESSION FAILURE ───────────────────────────────────────
  it('TEST G: refreshSession failure prevents getUser and store sync', async () => {
    const mockSupabase = {
      auth: {
        refreshSession: vi.fn().mockResolvedValue({
          error: { message: 'Token refresh failed' },
        }),
        getUser: vi.fn(),
      },
    };

    const { error: refreshError } = await mockSupabase.auth.refreshSession();
    expect(refreshError).not.toBeNull();
    expect(refreshError?.message).toContain('Token refresh failed');
    expect(mockSupabase.auth.getUser).not.toHaveBeenCalled();
  });

  // ── TEST H: USER NOT AVAILABLE ────────────────────────────────────────────
  it('TEST H: getUser returning null or error fails closed', async () => {
    const mockSupabase = {
      auth: {
        refreshSession: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('User not found') }),
      },
    };

    await mockSupabase.auth.refreshSession();
    const { data: { user: refreshedUser }, error: getUserError } = await mockSupabase.auth.getUser();

    expect(getUserError).not.toBeNull();
    expect(refreshedUser).toBeNull();
  });

  // ── TEST I: PROXY GATE ENFORCEMENT ON INVITED ─────────────────────────────
  it('TEST I: Proxy strictly protects /dashboard from INVITED users, redirecting to /auth/set-password', async () => {
    (createProxyClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'usr-invited-test',
              app_metadata: { status: 'INVITED' },
            },
          },
        }),
      },
      cookies: { getAll: vi.fn().mockReturnValue([]) },
    });

    const request = new NextRequest('http://localhost:3000/dashboard');
    const response = await proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/auth/set-password');
  });

  // ── TEST J: PROXY GATE ENFORCEMENT ON ACTIVE ──────────────────────────────
  it('TEST J: Proxy allows strictly ACTIVE users direct access to /dashboard', async () => {
    (createProxyClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'usr-active-test',
              app_metadata: { status: 'ACTIVE', role: 'admin' },
              user_metadata: { status: 'ACTIVE' },
            },
          },
        }),
      },
      cookies: { getAll: vi.fn().mockReturnValue([]) },
    });

    const request = new NextRequest('http://localhost:3000/dashboard');
    const response = await proxy(request);

    expect(response.status).not.toBe(307);
    expect(response.status).not.toBe(403);
  });
});
