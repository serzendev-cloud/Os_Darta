/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DB helper for contract testing authorization service
function createMockDb(config: {
  tenantStatus?: string;
  membership?: { id: string; primaryRoleId: string; status: string } | null;
  primaryRole?: { id: string; roleCode: string; status: string } | null;
  rolePermissions?: Array<{ code: string; scope: string }>;
  additionalPermissions?: Array<{ code: string; scope: string }>;
  waliRelationship?: { id: string; status: string } | null;
  platformRole?: string | null;
}) {
  return {
    select: vi.fn().mockImplementation((_fields: any) => ({
      from: vi.fn().mockImplementation((table: any) => {
        const queryHandler = {
          where: vi.fn().mockImplementation(() => {
            const resultPromise = {
              limit: vi.fn().mockImplementation((_limit: number) => {
                // Tenants query
                if (table && table.id && table.slug) {
                  if (config.tenantStatus !== undefined) {
                    return [{ id: 'tenant-a', status: config.tenantStatus }];
                  }
                  return [];
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

                // Wali Santri Relationship query
                if (table && table.waliUserId && table.relationshipType) {
                  if (config.waliRelationship) {
                    return [config.waliRelationship];
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
              // Additional permissions query
              if (table && table.membershipId) {
                return config.additionalPermissions || [];
              }
              // Platform roles query
              if (table && table.userId && table.platformRoleId) {
                if (config.platformRole) {
                  return [{ roleName: config.platformRole }];
                }
                return [];
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

import {
  getEffectivePermissions,
  requirePermission,
  authorizeWaliSantriAccess,
  authorizePlatformRole,
} from '../../src/lib/authz/authorization-service';

describe('WP-101 Phase 1E — RBAC Authorization Engine Security Contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Unauthenticated & Invalid Tenant Inputs', () => {
    it('should deny unauthenticated requests (empty userId) with DENIED_UNAUTHENTICATED', async () => {
      const mockDb = createMockDb({});
      const result = await getEffectivePermissions('', 'tenant-a', mockDb);

      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_UNAUTHENTICATED');
      expect(result.effectivePermissions.size).toBe(0);
    });

    it('should deny requests with missing tenantId with DENIED_TENANT_INACTIVE', async () => {
      const mockDb = createMockDb({});
      const result = await getEffectivePermissions('user-1', '', mockDb);

      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_TENANT_INACTIVE');
    });
  });

  describe('2. Fail-Closed Tenant & Membership Status Enforcement', () => {
    it('should deny authorization when tenant status is INACTIVE', async () => {
      const mockDb = createMockDb({
        tenantStatus: 'inactive',
        membership: { id: 'mem-1', primaryRoleId: 'role-1', status: 'ACTIVE' },
        primaryRole: { id: 'role-1', roleCode: 'ADMIN', status: 'ACTIVE' },
        rolePermissions: [{ code: 'santri.read', scope: 'TENANT' }],
      });

      const result = await getEffectivePermissions('user-1', 'tenant-a', mockDb);
      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_TENANT_INACTIVE');
      expect(result.effectivePermissions.size).toBe(0);
    });

    it('should deny authorization when user has no membership in requested tenant', async () => {
      const mockDb = createMockDb({
        tenantStatus: 'active',
        membership: null, // No membership
      });

      const result = await getEffectivePermissions('user-1', 'tenant-b', mockDb);
      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_TENANT_MEMBERSHIP_MISSING');
    });

    it('should deny authorization when user membership status is SUSPENDED', async () => {
      const mockDb = createMockDb({
        tenantStatus: 'active',
        membership: { id: 'mem-1', primaryRoleId: 'role-1', status: 'SUSPENDED' },
        primaryRole: { id: 'role-1', roleCode: 'ADMIN', status: 'ACTIVE' },
      });

      const result = await getEffectivePermissions('user-1', 'tenant-a', mockDb);
      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_TENANT_MEMBERSHIP_INACTIVE');
    });

    it('should deny authorization when primary role status is INACTIVE', async () => {
      const mockDb = createMockDb({
        tenantStatus: 'active',
        membership: { id: 'mem-1', primaryRoleId: 'role-1', status: 'ACTIVE' },
        primaryRole: { id: 'role-1', roleCode: 'ADMIN', status: 'INACTIVE' },
      });

      const result = await getEffectivePermissions('user-1', 'tenant-a', mockDb);
      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_ROLE_INACTIVE');
    });
  });

  describe('3. Effective Permission Calculation & Scope Isolation', () => {
    it('should calculate union of role permissions and additional permissions correctly', async () => {
      const mockDb = createMockDb({
        tenantStatus: 'active',
        membership: { id: 'mem-1', primaryRoleId: 'role-1', status: 'ACTIVE' },
        primaryRole: { id: 'role-1', roleCode: 'GURU', status: 'ACTIVE' },
        rolePermissions: [
          { code: 'santri.read', scope: 'TENANT' },
          { code: 'academic.read', scope: 'TENANT' },
        ],
        additionalPermissions: [
          { code: 'academic.write', scope: 'TENANT' },
          { code: 'santri.read', scope: 'TENANT' }, // Duplicate permission check
        ],
      });

      const result = await getEffectivePermissions('user-1', 'tenant-a', mockDb);
      expect(result.authorized).toBe(true);
      expect(result.decision).toBe('AUTHORIZED');
      expect(result.effectivePermissions.has('santri.read')).toBe(true);
      expect(result.effectivePermissions.has('academic.read')).toBe(true);
      expect(result.effectivePermissions.has('academic.write')).toBe(true);
      expect(result.effectivePermissions.size).toBe(3); // Deduplicated union
    });

    it('should filter out PLATFORM permissions from tenant effective permissions', async () => {
      const mockDb = createMockDb({
        tenantStatus: 'active',
        membership: { id: 'mem-1', primaryRoleId: 'role-1', status: 'ACTIVE' },
        primaryRole: { id: 'role-1', roleCode: 'ADMIN', status: 'ACTIVE' },
        rolePermissions: [
          { code: 'santri.read', scope: 'TENANT' },
          { code: 'manage_tenants', scope: 'PLATFORM' }, // Platform permission attempt
        ],
      });

      const result = await getEffectivePermissions('user-1', 'tenant-a', mockDb);
      expect(result.effectivePermissions.has('santri.read')).toBe(true);
      expect(result.effectivePermissions.has('manage_tenants')).toBe(false);
    });

    it('should deny requirePermission when permission is missing from effective permissions', async () => {
      const mockDb = createMockDb({
        tenantStatus: 'active',
        membership: { id: 'mem-1', primaryRoleId: 'role-1', status: 'ACTIVE' },
        primaryRole: { id: 'role-1', roleCode: 'WALI', status: 'ACTIVE' },
        rolePermissions: [{ code: 'view_own_data', scope: 'TENANT' }],
      });

      const result = await requirePermission('user-1', 'tenant-a', 'santri.delete', mockDb);
      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_PERMISSION_MISSING');
    });
  });

  describe('4. Wali-Santri Relationship Authorization & Cross-Child IDOR Defense', () => {
    it('should allow Wali access to own child when relationship status is ACTIVE', async () => {
      const mockDb = createMockDb({
        tenantStatus: 'active',
        membership: { id: 'mem-wali', primaryRoleId: 'role-wali', status: 'ACTIVE' },
        primaryRole: { id: 'role-wali', roleCode: 'WALI', status: 'ACTIVE' },
        rolePermissions: [{ code: 'view_own_data', scope: 'TENANT' }],
        waliRelationship: { id: 'wsr-1', status: 'ACTIVE' },
      });

      const result = await authorizeWaliSantriAccess('wali-1', 'tenant-a', 'santri-child-1', 'view_own_data', mockDb);
      expect(result.authorized).toBe(true);
      expect(result.decision).toBe('AUTHORIZED');
    });

    it('should deny Wali access to unrelated child (Cross-child IDOR)', async () => {
      const mockDb = createMockDb({
        tenantStatus: 'active',
        membership: { id: 'mem-wali', primaryRoleId: 'role-wali', status: 'ACTIVE' },
        primaryRole: { id: 'role-wali', roleCode: 'WALI', status: 'ACTIVE' },
        rolePermissions: [{ code: 'view_own_data', scope: 'TENANT' }],
        waliRelationship: null, // No relationship row
      });

      const result = await authorizeWaliSantriAccess('wali-1', 'tenant-a', 'santri-other-child', 'view_own_data', mockDb);
      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_RELATIONSHIP_INACTIVE');
    });

    it('should deny Wali access when relationship is INACTIVE or revoked', async () => {
      const mockDb = createMockDb({
        tenantStatus: 'active',
        membership: { id: 'mem-wali', primaryRoleId: 'role-wali', status: 'ACTIVE' },
        primaryRole: { id: 'role-wali', roleCode: 'WALI', status: 'ACTIVE' },
        rolePermissions: [{ code: 'view_own_data', scope: 'TENANT' }],
        waliRelationship: { id: 'wsr-1', status: 'REVOKED' },
      });

      const result = await authorizeWaliSantriAccess('wali-1', 'tenant-a', 'santri-child-1', 'view_own_data', mockDb);
      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_RELATIONSHIP_INACTIVE');
    });
  });

  describe('5. Platform Role Boundary (SUPER_ADMIN & DEVELOPER)', () => {
    it('should authorize SUPER_ADMIN platform role without requiring fake tenant membership', async () => {
      const mockDb = createMockDb({
        platformRole: 'SUPER_ADMIN',
      });

      const result = await authorizePlatformRole('admin-uuid', 'SUPER_ADMIN', mockDb);
      expect(result.authorized).toBe(true);
      expect(result.decision).toBe('AUTHORIZED');
    });

    it('should deny platform authorization to users without platform role', async () => {
      const mockDb = createMockDb({
        platformRole: null,
      });

      const result = await authorizePlatformRole('user-normal', 'SUPER_ADMIN', mockDb);
      expect(result.authorized).toBe(false);
      expect(result.decision).toBe('DENIED_PLATFORM_SCOPE');
    });
  });
});
