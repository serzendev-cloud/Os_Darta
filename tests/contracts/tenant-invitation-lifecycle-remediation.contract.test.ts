// =============================================================================
// EEOS WORK PACKAGE
// WP-TENANT-INVITATION-LIFECYCLE-REMEDIATION-IMPLEMENTATION-001
// Comprehensive Lifecycle & Authorization Security Verification Test Suite
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { GET as authCallback } from '@/app/auth/callback/route';
import { getEffectivePermissions, authorizeOperationalApi } from '@/lib/authz/authorization-service';

// Mock Supabase Proxy Client
vi.mock('@/lib/supabase/proxy', () => ({
  createProxyClient: vi.fn(),
}));

import { createProxyClient } from '@/lib/supabase/proxy';

// Mock Supabase SSR Client
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockImplementation((_url, _key, options) => {
    return {
      auth: {
        verifyOtp: vi.fn().mockImplementation(({ token_hash }) => {
          if (!token_hash || token_hash === '') {
            return Promise.resolve({ data: { user: null }, error: new Error('Token expired or invalid') });
          }
          return Promise.resolve({ data: { user: { id: 'usr-1' } }, error: null });
        }),
      },
    };
  }),
}));

function extractStrings(obj: any, visited = new Set()): string[] {
  if (!obj || typeof obj !== 'object' || visited.has(obj)) return [];
  visited.add(obj);
  const result: string[] = [];
  for (const key of Object.keys(obj)) {
    try {
      const val = obj[key];
      if (typeof val === 'string') {
        result.push(val);
      } else if (typeof val === 'object' && val !== null) {
        result.push(...extractStrings(val, visited));
      }
    } catch {}
  }
  return result;
}

function createMockDb(config: {
  userStatus?: string | null;
  tenantStatus?: string;
  memberships?: Array<{ tenantId: string; primaryRoleId: string; status: string }>;
  primaryRole?: { id: string; roleCode: string; status: string } | null;
  rolePermissions?: Array<{ code: string; scope: string }>;
}) {
  return {
    select: vi.fn().mockImplementation((_fields: any) => ({
      from: vi.fn().mockImplementation((table: any) => {
        const queryHandler = {
          where: vi.fn().mockImplementation((condition: any) => {
            const strings = extractStrings(condition);
            let targetTenant: string | null = null;
            if (strings.includes('tenant-A')) targetTenant = 'tenant-A';
            else if (strings.includes('tenant-B')) targetTenant = 'tenant-B';
            else if (strings.includes('tenant-1')) targetTenant = 'tenant-1';

            const resultPromise = {
              limit: vi.fn().mockImplementation((_limit: number) => {
                // Users query
                if (table && table.email && table.phone) {
                  if (config.userStatus !== undefined) {
                    return config.userStatus ? [{ id: 'user-test-1', status: config.userStatus }] : [];
                  }
                  return [{ id: 'user-test-1', status: 'ACTIVE' }];
                }

                // Tenants query
                if (table && table.id && table.slug) {
                  if (config.tenantStatus !== undefined) {
                    return [{ id: targetTenant || 'tenant-1', status: config.tenantStatus }];
                  }
                  return [{ id: targetTenant || 'tenant-1', status: 'ACTIVE' }];
                }

                // Memberships query
                if (table && table.userId && table.primaryRoleId) {
                  if (config.memberships) {
                    if (targetTenant) {
                      const match = config.memberships.find((m) => m.tenantId === targetTenant);
                      return match ? [match] : [];
                    }
                    return config.memberships.slice(0, 1);
                  }
                  return [];
                }

                // Tenant Roles query
                if (table && table.roleCode && table.isCustom) {
                  if (config.primaryRole) {
                    return [config.primaryRole];
                  }
                  return [];
                }

                return [];
              }),
            };
            return resultPromise;
          }),
          innerJoin: vi.fn().mockImplementation((_joinedTable: any, _condition: any) => ({
            where: vi.fn().mockImplementation(() => {
              // Role permissions query
              if (table && table.tenantRoleId) {
                return config.rolePermissions || [];
              }
              return [];
            }),
          })),
        };
        return queryHandler;
      }),
    })),
  } as any;
}

describe('WP-TENANT-INVITATION-LIFECYCLE-REMEDIATION-IMPLEMENTATION-001', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // SECTION 1: PROXY EDGE SECURITY GATES
  // ===========================================================================
  describe('1. Proxy Edge Security Gate & Anti-Bypass', () => {
    it('1. INVITED user + GET /dashboard MUST redirect (307) to /auth/set-password', async () => {
      (createProxyClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'usr-invited-1',
                app_metadata: { status: 'INVITED' },
                user_metadata: { status: 'INVITED' },
              },
            },
          }),
        },
        cookies: { getAll: vi.fn().mockReturnValue([]) },
      });

      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/set-password');
    });

    it('2. INVITED user + GET /dashboard/* MUST redirect (307) to /auth/set-password', async () => {
      (createProxyClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'usr-invited-1',
                app_metadata: { status: 'INVITED' },
              },
            },
          }),
        },
        cookies: { getAll: vi.fn().mockReturnValue([]) },
      });

      const request = new NextRequest('http://localhost:3000/dashboard/santri');
      const response = await proxy(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/set-password');
    });

    it('3. INVITED user + operational API MUST be rejected with HTTP 403 UserOnboardingIncomplete', async () => {
      (createProxyClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'usr-invited-1',
                app_metadata: { status: 'INVITED' },
              },
            },
          }),
        },
        cookies: { getAll: vi.fn().mockReturnValue([]) },
      });

      const request = new NextRequest('http://localhost:3000/api/academic/workspace/years');
      const response = await proxy(request);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('UserOnboardingIncomplete');
    });

    it('4. Client user_metadata tampering MUST NOT bypass lifecycle gate when app_metadata is INVITED', async () => {
      // Simulates client running supabase.auth.updateUser({ data: { status: 'ACTIVE' } })
      (createProxyClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'usr-invited-tampered',
                app_metadata: { status: 'INVITED' }, // Server-controlled
                user_metadata: { status: 'ACTIVE' },  // Client-tampered
              },
            },
          }),
        },
        cookies: { getAll: vi.fn().mockReturnValue([]) },
      });

      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await proxy(request);

      // Must STILL be redirected to /auth/set-password (tampering thwarted)
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/set-password');
    });

    it('5. INVITED user MUST be allowed access to /auth/set-password', async () => {
      (createProxyClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'usr-invited-1',
                app_metadata: { status: 'INVITED' },
              },
            },
          }),
        },
        cookies: { getAll: vi.fn().mockReturnValue([]) },
      });

      const request = new NextRequest('http://localhost:3000/auth/set-password');
      const response = await proxy(request);

      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(403);
    });

    it('6. INVITED user MUST be allowed access to /api/auth/complete-onboarding', async () => {
      (createProxyClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'usr-invited-1',
                app_metadata: { status: 'INVITED' },
              },
            },
          }),
        },
        cookies: { getAll: vi.fn().mockReturnValue([]) },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/complete-onboarding', {
        method: 'POST',
      });
      const response = await proxy(request);

      expect(response.status).not.toBe(403);
    });

    it('7. ACTIVE user MUST be allowed access to /dashboard', async () => {
      (createProxyClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'usr-active-1',
                app_metadata: { status: 'ACTIVE' },
                user_metadata: { status: 'ACTIVE' },
              },
            },
          }),
        },
        cookies: { getAll: vi.fn().mockReturnValue([]) },
      });

      const request = new NextRequest('http://localhost:3000/dashboard');
      const response = await proxy(request);

      expect(response.status).toBe(200);
    });

    it('8. /login with error parameter MUST NOT enter redirect loop for invited user', async () => {
      (createProxyClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'usr-invited-1',
                app_metadata: { status: 'INVITED' },
              },
            },
          }),
        },
        cookies: { getAll: vi.fn().mockReturnValue([]) },
      });

      const request = new NextRequest('http://localhost:3000/login?error=invitation_expired');
      const response = await proxy(request);

      // Must NOT redirect to /auth/set-password
      expect(response.status).toBe(200);
      expect(response.headers.get('location')).toBeNull();
    });

    it('9. Public static root assets (logo.png, favicon.ico) MUST NOT be redirected to set-password', async () => {
      (createProxyClient as any).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: {
              user: {
                id: 'usr-invited-1',
                app_metadata: { status: 'INVITED' },
              },
            },
          }),
        },
        cookies: { getAll: vi.fn().mockReturnValue([]) },
      });

      const logoRequest = new NextRequest('http://localhost:3000/logo.png');
      const logoResponse = await proxy(logoRequest);
      expect(logoResponse.status).toBe(200);

      const faviconRequest = new NextRequest('http://localhost:3000/favicon.ico');
      const faviconResponse = await proxy(faviconRequest);
      expect(faviconResponse.status).toBe(200);
    });
  });

  // ===========================================================================
  // SECTION 2: INVITATION CALLBACK SECURITY
  // ===========================================================================
  describe('2. Invitation Callback Security & Target Enforcement', () => {
    it('11. Invitation callback with type=invite MUST force redirect to /auth/set-password', async () => {
      const request = new NextRequest('http://localhost:3000/auth/callback?token_hash=validhash&type=invite');
      const response = await authCallback(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/set-password');
    });

    it('12. Invitation callback with next=/dashboard MUST ignore next and force /auth/set-password', async () => {
      const request = new NextRequest('http://localhost:3000/auth/callback?token_hash=validhash&type=invite&next=/dashboard');
      const response = await authCallback(request);

      // Invariant: next=/dashboard MUST NOT be respected for invite type
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/auth/set-password');
    });

    it('13. Expired or missing token_hash MUST redirect to /login?error=invitation_expired', async () => {
      const request = new NextRequest('http://localhost:3000/auth/callback?token_hash=&type=invite');
      const response = await authCallback(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login?error=invitation_expired');
    });
  });

  // ===========================================================================
  // SECTION 3: MULTI-TENANT AUTHORIZATION ENGINE & DEFENSE-IN-DEPTH
  // ===========================================================================
  describe('3. Multi-Tenant Authorization Engine & Defense-in-Depth', () => {
    it('19. Multi-Tenant: Tenant A ACTIVE + Tenant B INVITED -> Tenant A ALLOW, Tenant B DENIED_TENANT_MEMBERSHIP_INACTIVE', async () => {
      const mockDb = createMockDb({
        userStatus: 'ACTIVE', // User is active on platform
        tenantStatus: 'ACTIVE',
        memberships: [
          { tenantId: 'tenant-A', primaryRoleId: 'role-admin', status: 'ACTIVE' },
          { tenantId: 'tenant-B', primaryRoleId: 'role-admin', status: 'INVITED' },
        ],
        primaryRole: { id: 'role-admin', roleCode: 'ADMIN', status: 'ACTIVE' },
        rolePermissions: [{ code: 'santri.read', scope: 'TENANT' }],
      });

      // Query Tenant A -> Must be AUTHORIZED
      const authA = await getEffectivePermissions('usr-multi', 'tenant-A', mockDb);
      expect(authA.authorized).toBe(true);
      expect(authA.decision).toBe('AUTHORIZED');

      // Query Tenant B -> Must be DENIED with DENIED_TENANT_MEMBERSHIP_INACTIVE
      const authB = await getEffectivePermissions('usr-multi', 'tenant-B', mockDb);
      expect(authB.authorized).toBe(false);
      expect(authB.decision).toBe('DENIED_TENANT_MEMBERSHIP_INACTIVE');
      expect(authB.reason).toContain('INVITED');
    });

    it('20. Multi-Tenant: Tenant A INVITED + Tenant B ACTIVE -> Tenant A DENIED, Tenant B AUTHORIZED', async () => {
      const mockDb = createMockDb({
        userStatus: 'ACTIVE',
        tenantStatus: 'ACTIVE',
        memberships: [
          { tenantId: 'tenant-A', primaryRoleId: 'role-admin', status: 'INVITED' },
          { tenantId: 'tenant-B', primaryRoleId: 'role-admin', status: 'ACTIVE' },
        ],
        primaryRole: { id: 'role-admin', roleCode: 'ADMIN', status: 'ACTIVE' },
        rolePermissions: [{ code: 'santri.read', scope: 'TENANT' }],
      });

      const authA = await getEffectivePermissions('usr-multi', 'tenant-A', mockDb);
      expect(authA.authorized).toBe(false);
      expect(authA.decision).toBe('DENIED_TENANT_MEMBERSHIP_INACTIVE');

      const authB = await getEffectivePermissions('usr-multi', 'tenant-B', mockDb);
      expect(authB.authorized).toBe(true);
      expect(authB.decision).toBe('AUTHORIZED');
    });

    it('21. Multi-Tenant: Both Tenant A and B ACTIVE -> both AUTHORIZED', async () => {
      const mockDb = createMockDb({
        userStatus: 'ACTIVE',
        tenantStatus: 'ACTIVE',
        memberships: [
          { tenantId: 'tenant-A', primaryRoleId: 'role-admin', status: 'ACTIVE' },
          { tenantId: 'tenant-B', primaryRoleId: 'role-admin', status: 'ACTIVE' },
        ],
        primaryRole: { id: 'role-admin', roleCode: 'ADMIN', status: 'ACTIVE' },
        rolePermissions: [{ code: 'santri.read', scope: 'TENANT' }],
      });

      const authA = await getEffectivePermissions('usr-multi', 'tenant-A', mockDb);
      expect(authA.authorized).toBe(true);

      const authB = await getEffectivePermissions('usr-multi', 'tenant-B', mockDb);
      expect(authB.authorized).toBe(true);
    });

    it('22. Super Admin platform role bypasses tenant membership constraints via authorizeOperationalApi', async () => {
      const superAdminRequest = new NextRequest('http://localhost:3000/api/academic/workspace/years', {
        headers: {
          'x-is-super-admin': 'true',
        },
      });

      const authz = await authorizeOperationalApi(superAdminRequest, 'tenant-1');
      expect(authz.authorized).toBe(true);
    });

    it('23. Regular user with INVITED membership is rejected by authorizeOperationalApi with UserOnboardingIncomplete', async () => {
      const mockDb = createMockDb({
        userStatus: 'ACTIVE',
        tenantStatus: 'ACTIVE',
        memberships: [
          { tenantId: 'tenant-1', primaryRoleId: 'role-admin', status: 'INVITED' },
        ],
        primaryRole: { id: 'role-admin', roleCode: 'ADMIN', status: 'ACTIVE' },
      });

      const userRequest = new NextRequest('http://localhost:3000/api/academic/workspace/years', {
        headers: {
          'x-user-id': 'usr-invited-1',
        },
      });

      const authz = await authorizeOperationalApi(userRequest, 'tenant-1', mockDb);
      expect(authz.authorized).toBe(false);
      expect(authz.status).toBe(403);
      expect(authz.error).toBe('UserOnboardingIncomplete');
    });

    it('24. Unauthenticated request to authorizeOperationalApi returns 401 Unauthorized', async () => {
      const anonRequest = new NextRequest('http://localhost:3000/api/academic/workspace/years');
      const authz = await authorizeOperationalApi(anonRequest, 'tenant-1');

      expect(authz.authorized).toBe(false);
      expect(authz.status).toBe(401);
      expect(authz.error).toBe('Unauthorized');
    });
  });
});
