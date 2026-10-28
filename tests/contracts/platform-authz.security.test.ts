/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  authorizeOperationalApi,
  authorizePlatformRole,
  authorizeCurrentPlatformRoles,
} from '@/lib/authz/authorization-service';

// Mock Supabase server client
let mockSessionUser: { id: string; email?: string } | null = null;
let mockSessionError: any = null;

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: mockSessionUser },
        error: mockSessionError,
      })),
    },
  })),
}));

function extractStrings(condition: any): string[] {
  const result: string[] = [];
  if (!condition) return result;
  if (typeof condition === 'string') {
    result.push(condition);
    return result;
  }
  if (condition.value !== undefined && typeof condition.value === 'string') {
    result.push(condition.value);
  }
  if (Array.isArray(condition.queryChunks)) {
    for (const chunk of condition.queryChunks) {
      if (chunk && chunk.value !== undefined) {
        result.push(String(chunk.value));
      }
    }
  }
  return result;
}

function createMockDb(config: {
  userStatus?: string | null;
  tenantStatus?: string;
  memberships?: Array<{ tenantId: string; primaryRoleId: string; status: string }>;
  primaryRole?: { id: string; roleCode: string; status: string } | null;
  rolePermissions?: Array<{ code: string; scope: string }>;
  platformRoles?: Array<{ roleId: string; roleName: string }>;
}) {
  return {
    select: vi.fn().mockImplementation((_fields: any) => ({
      from: vi.fn().mockImplementation((table: any) => {
        const queryHandler = {
          where: vi.fn().mockImplementation((condition: any) => {
            const strings = extractStrings(condition);
            let targetTenant: string | null = null;
            if (strings.includes('tenant-test-1')) targetTenant = 'tenant-test-1';

            const resultPromise = {
              limit: vi.fn().mockImplementation((_limit: number) => {
                // Users query
                if (table && table.email && table.phone) {
                  if (config.userStatus !== undefined) {
                    return config.userStatus ? [{ id: 'user-001', status: config.userStatus }] : [];
                  }
                  return [{ id: 'user-001', status: 'ACTIVE' }];
                }

                // Tenants query
                if (table && table.id && table.slug) {
                  if (config.tenantStatus !== undefined) {
                    return [{ id: targetTenant || 'tenant-test-1', status: config.tenantStatus }];
                  }
                  return [{ id: targetTenant || 'tenant-test-1', status: 'ACTIVE' }];
                }

                // Memberships query
                if (table && table.userId && table.primaryRoleId) {
                  if (config.memberships) {
                    return config.memberships;
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
              // Platform roles query
              if (table && table.platformRoleId) {
                return config.platformRoles || [];
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

describe('WP-SEC-PLATFORM-001: Platform Authorization Security Contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionUser = null;
    mockSessionError = null;
  });

  describe('1. authorizeOperationalApi', () => {
    it('1.1. Denies request when x-user-id header is missing (Unauthenticated)', async () => {
      const req = new NextRequest('http://localhost:3000/api/academic/workspace/years', {
        headers: {},
      });
      const mockDb = createMockDb({});

      const result = await authorizeOperationalApi(req, 'tenant-test-1', mockDb);
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(401);
    });

    it('1.2. Denies valid session user who is NOT a tenant member and has NO platform role in DB', async () => {
      const req = new NextRequest('http://localhost:3000/api/academic/workspace/years', {
        headers: {
          'x-user-id': 'regular_user_123',
        },
      });
      // Mock DB: user is active, tenant is active, but zero memberships and zero platform roles
      const mockDb = createMockDb({
        userStatus: 'ACTIVE',
        tenantStatus: 'ACTIVE',
        memberships: [],
        platformRoles: [],
      });

      const result = await authorizeOperationalApi(req, 'tenant-test-1', mockDb);
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(403);
    });

    it('1.3. Denies client presenting spoofed x-is-super-admin: true without platform role in DB', async () => {
      const req = new NextRequest('http://localhost:3000/api/academic/workspace/years', {
        headers: {
          'x-user-id': 'attacker_user_456',
          'x-is-super-admin': 'true',
        },
      });
      // DB: No platform roles
      const mockDb = createMockDb({
        userStatus: 'ACTIVE',
        tenantStatus: 'ACTIVE',
        memberships: [],
        platformRoles: [],
      });

      const result = await authorizeOperationalApi(req, 'tenant-test-1', mockDb);
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(403);
    });

    it('1.4. Allows caller when SUPER_ADMIN platform role exists in DB', async () => {
      const req = new NextRequest('http://localhost:3000/api/academic/workspace/years', {
        headers: {
          'x-user-id': 'super_admin_uuid_1',
        },
      });
      const mockDb = createMockDb({
        userStatus: 'ACTIVE',
        tenantStatus: 'ACTIVE',
        platformRoles: [{ roleId: 'role-super-admin', roleName: 'SUPER_ADMIN' }],
      });

      const result = await authorizeOperationalApi(req, 'tenant-test-1', mockDb);
      expect(result.authorized).toBe(true);
    });

    it('1.5. Allows caller when DEVELOPER platform role exists in DB', async () => {
      const req = new NextRequest('http://localhost:3000/api/academic/workspace/years', {
        headers: {
          'x-user-id': 'dev_uuid_2',
        },
      });
      const mockDb = createMockDb({
        userStatus: 'ACTIVE',
        tenantStatus: 'ACTIVE',
        platformRoles: [{ roleId: 'role-dev', roleName: 'DEVELOPER' }],
      });

      const result = await authorizeOperationalApi(req, 'tenant-test-1', mockDb);
      expect(result.authorized).toBe(true);
    });

    it('1.6. Allows regular active tenant member in DB', async () => {
      const req = new NextRequest('http://localhost:3000/api/academic/workspace/years', {
        headers: {
          'x-user-id': 'member_uuid_3',
        },
      });
      const mockDb = createMockDb({
        userStatus: 'ACTIVE',
        tenantStatus: 'ACTIVE',
        memberships: [{ tenantId: 'tenant-test-1', primaryRoleId: 'role-admin', status: 'ACTIVE' }],
        primaryRole: { id: 'role-admin', roleCode: 'ADMIN', status: 'ACTIVE' },
        rolePermissions: [{ code: 'academic.read', scope: 'GLOBAL' }],
        platformRoles: [],
      });

      const result = await authorizeOperationalApi(req, 'tenant-test-1', mockDb);
      expect(result.authorized).toBe(true);
    });
  });

  describe('2. authorizePlatformRole & authorizeCurrentPlatformRoles', () => {
    it('2.1. authorizePlatformRole returns false when user has no matching platform role in DB', async () => {
      const mockDb = createMockDb({
        platformRoles: [],
      });

      const result = await authorizePlatformRole('normal_user', 'SUPER_ADMIN', mockDb);
      expect(result.authorized).toBe(false);
      expect(result.reason).toContain('does not possess required platform role');
    });

    it('2.2. authorizePlatformRole returns true when user has matching role in DB', async () => {
      const mockDb = createMockDb({
        platformRoles: [{ roleId: 'role-sa', roleName: 'SUPER_ADMIN' }],
      });

      const result = await authorizePlatformRole('super_admin_user', 'SUPER_ADMIN', mockDb);
      expect(result.authorized).toBe(true);
      expect(result.decision).toBe('AUTHORIZED');
      expect(result.effectivePermissions.has('platform.super_admin')).toBe(true);
    });

    it('2.3. authorizeCurrentPlatformRoles returns 401 when Supabase session is absent', async () => {
      mockSessionUser = null;
      const mockDb = createMockDb({});

      const result = await authorizeCurrentPlatformRoles(['SUPER_ADMIN'], mockDb);
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(401);
    });

    it('2.4. authorizeCurrentPlatformRoles returns 403 when session user is SUSPENDED in users table', async () => {
      mockSessionUser = { id: 'suspended_user_01' };
      const mockDb = createMockDb({
        userStatus: 'SUSPENDED',
        platformRoles: [{ roleId: 'role-sa', roleName: 'SUPER_ADMIN' }],
      });

      const result = await authorizeCurrentPlatformRoles(['SUPER_ADMIN'], mockDb);
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(403);
    });

    it('2.5. authorizeCurrentPlatformRoles returns 403 when session user has NO platform roles in DB', async () => {
      mockSessionUser = { id: 'regular_user_01' };
      const mockDb = createMockDb({
        userStatus: 'ACTIVE',
        platformRoles: [],
      });

      const result = await authorizeCurrentPlatformRoles(['SUPER_ADMIN', 'DEVELOPER'], mockDb);
      expect(result.authorized).toBe(false);
      expect(result.status).toBe(403);
    });

    it('2.6. authorizeCurrentPlatformRoles returns authorized when session user has platform role in DB', async () => {
      mockSessionUser = { id: 'super_admin_01' };
      const mockDb = createMockDb({
        userStatus: 'ACTIVE',
        platformRoles: [{ roleId: 'role-sa', roleName: 'SUPER_ADMIN' }],
      });

      const result = await authorizeCurrentPlatformRoles(['SUPER_ADMIN', 'DEVELOPER'], mockDb);
      expect(result.authorized).toBe(true);
      expect((result as any).userId).toBe('super_admin_01');
      expect((result as any).role).toBe('SUPER_ADMIN');
    });
  });

  describe('3. Route Level Security Gates & Sanitized Error Responses', () => {
    it('3.1. Route errors do not leak internal database errors or SQL trace', async () => {
      // Simulate database failure during authorization
      const faultyDb = {
        select: vi.fn().mockImplementation(() => {
          throw new Error('connect ECONNREFUSED 127.0.0.1:5432');
        }),
      } as any;

      mockSessionUser = { id: 'any_user' };
      const authResult = await authorizeCurrentPlatformRoles(['SUPER_ADMIN'], faultyDb);

      // Must fail-closed with 503 and never throw raw SQL error to client
      expect(authResult.authorized).toBe(false);
      expect(authResult.status).toBe(503);
    });
  });
});
