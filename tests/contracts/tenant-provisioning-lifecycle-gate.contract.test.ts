// =============================================================================
// WP-TENANT-PROVISIONING-READINESS-REMEDIATION-001
// Lifecycle Access Gate, Zero-Password Ingress & Tenant Source Contract Tests
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEffectivePermissions } from '@/lib/authz/authorization-service';
import { POST as postSaasTenants, GET as getSaasTenants } from '@/app/api/saas/tenants/route';
import { NextRequest } from 'next/server';

function createMockDb(config: {
  userStatus?: string | null;
  tenantStatus?: string;
  membership?: { id: string; primaryRoleId: string; status: string } | null;
  primaryRole?: { id: string; roleCode: string; status: string } | null;
  rolePermissions?: Array<{ code: string; scope: string }>;
}) {
  return {
    select: vi.fn().mockImplementation((_fields: any) => ({
      from: vi.fn().mockImplementation((table: any) => {
        const queryHandler = {
          where: vi.fn().mockImplementation(() => {
            const resultPromise = {
              limit: vi.fn().mockImplementation((_limit: number) => {
                // Users query
                if (table && table.email && table.phone) {
                  if (config.userStatus !== undefined) {
                    return config.userStatus ? [{ id: 'user-invited-1', status: config.userStatus }] : [];
                  }
                  return [{ id: 'user-invited-1', status: 'ACTIVE' }];
                }

                // Tenants query
                if (table && table.id && table.slug) {
                  if (config.tenantStatus !== undefined) {
                    return [{ id: 'tenant-1', status: config.tenantStatus }];
                  }
                  return [{ id: 'tenant-1', status: 'ACTIVE' }];
                }

                // Memberships query
                if (table && table.userId && table.primaryRoleId) {
                  if (config.membership) {
                    return [config.membership];
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

describe('WP-TENANT-PROVISIONING-READINESS-REMEDIATION-001 — Contract Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Critical Blocker: User Lifecycle Access Gate', () => {
    it('MUST fail-closed with DENIED_USER_LIFECYCLE_INACTIVE when user status is INVITED', async () => {
      const mockDb = createMockDb({
        userStatus: 'INVITED',
        tenantStatus: 'ACTIVE',
        membership: { id: 'mem-1', primaryRoleId: 'role-admin', status: 'ACTIVE' },
        primaryRole: { id: 'role-admin', roleCode: 'ADMIN', status: 'ACTIVE' },
        rolePermissions: [{ code: 'santri.read', scope: 'TENANT' }],
      });

      const result = await getEffectivePermissions('user-invited-1', 'tenant-1', mockDb);

      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_USER_LIFECYCLE_INACTIVE');
      expect(result.effectivePermissions.size).toBe(0);
      expect(result.reason).toContain('not ACTIVE');
    });

    it('MUST fail-closed with DENIED_USER_LIFECYCLE_INACTIVE when user status is SUSPENDED or DISABLED', async () => {
      const mockDb = createMockDb({
        userStatus: 'SUSPENDED',
        tenantStatus: 'ACTIVE',
        membership: { id: 'mem-1', primaryRoleId: 'role-admin', status: 'ACTIVE' },
        primaryRole: { id: 'role-admin', roleCode: 'ADMIN', status: 'ACTIVE' },
      });

      const result = await getEffectivePermissions('user-suspended-1', 'tenant-1', mockDb);

      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_USER_LIFECYCLE_INACTIVE');
    });

    it('MUST fail-closed with DENIED_USER_LIFECYCLE_INACTIVE when user does not exist in users table', async () => {
      const mockDb = createMockDb({
        userStatus: null,
        tenantStatus: 'ACTIVE',
        membership: { id: 'mem-1', primaryRoleId: 'role-admin', status: 'ACTIVE' },
        primaryRole: { id: 'role-admin', roleCode: 'ADMIN', status: 'ACTIVE' },
      });

      const result = await getEffectivePermissions('user-ghost-1', 'tenant-1', mockDb);

      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_USER_LIFECYCLE_INACTIVE');
    });

    it('MUST grant authorization when user status is ACTIVE and tenant/membership/role are active', async () => {
      const mockDb = createMockDb({
        userStatus: 'ACTIVE',
        tenantStatus: 'ACTIVE',
        membership: { id: 'mem-1', primaryRoleId: 'role-admin', status: 'ACTIVE' },
        primaryRole: { id: 'role-admin', roleCode: 'ADMIN', status: 'ACTIVE' },
        rolePermissions: [{ code: 'santri.read', scope: 'TENANT' }],
      });

      const result = await getEffectivePermissions('user-active-1', 'tenant-1', mockDb);

      expect(result.authorized).toBe(true);
      expect(result.decision).toBe('AUTHORIZED');
      expect(result.effectivePermissions.has('santri.read')).toBe(true);
    });
  });

  describe('2. Temuan #3: Strict Zero-Password Ingress Enforcement', () => {
    it('MUST reject POST /api/saas/tenants with HTTP 400 when initialPassword is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/saas/tenants', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-id': 'usr-superadmin',
          'x-is-super-admin': 'true',
          'host': 'localhost:3000',
          'origin': 'http://localhost:3000',
        },
        body: JSON.stringify({
          name: 'Ponpes Uji Coba',
          slug: 'ujicoba',
          ownerEmail: 'admin@ujicoba.sch.id',
          ownerName: 'Ustadz Uji',
          initialPassword: 'secret-password-123',
        }),
      });

      const response = await postSaasTenants(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe('BadRequest');
      expect(json.message).toContain('Penyediaan kata sandi awal tidak diperbolehkan');
    });

    it('MUST reject POST /api/saas/tenants with HTTP 400 when password or temporaryPassword is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/saas/tenants', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-id': 'usr-superadmin',
          'x-is-super-admin': 'true',
          'host': 'localhost:3000',
          'origin': 'http://localhost:3000',
        },
        body: JSON.stringify({
          name: 'Ponpes Uji Coba',
          slug: 'ujicoba',
          ownerEmail: 'admin@ujicoba.sch.id',
          ownerName: 'Ustadz Uji',
          password: 'another-secret',
        }),
      });

      const response = await postSaasTenants(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe('BadRequest');
    });
  });

  describe('3. Role Case Normalization & Proxy Super Admin Gate', () => {
    it('MUST authorize GET /api/saas/tenants when x-user-role is lowercase super_admin', async () => {
      const request = new NextRequest('http://localhost:3000/api/saas/tenants', {
        method: 'GET',
        headers: {
          'x-user-id': 'usr-superadmin',
          'x-user-role': 'super_admin', // lowercase role
          'host': 'localhost:3000',
        },
      });

      const response = await getSaasTenants(request);
      // Status should NOT be 403 Forbidden!
      expect(response.status).not.toBe(403);
    });

    it('MUST authorize GET /api/saas/tenants when x-user-role is lowercase developer', async () => {
      const request = new NextRequest('http://localhost:3000/api/saas/tenants', {
        method: 'GET',
        headers: {
          'x-user-id': 'usr-dev',
          'x-user-role': 'developer', // lowercase role
          'host': 'localhost:3000',
        },
      });

      const response = await getSaasTenants(request);
      // Status should NOT be 403 Forbidden!
      expect(response.status).not.toBe(403);
    });

    it('MUST deny GET /api/saas/tenants with HTTP 403 when user is a regular tenant admin or wali', async () => {
      const request = new NextRequest('http://localhost:3000/api/saas/tenants', {
        method: 'GET',
        headers: {
          'x-user-id': 'usr-regular',
          'x-user-role': 'admin',
          'host': 'localhost:3000',
        },
      });

      const response = await getSaasTenants(request);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Forbidden');
    });
  });
});
