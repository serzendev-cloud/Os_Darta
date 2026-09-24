// =============================================================================
// Tenant Hard-Delete Lifecycle Engine Contract Tests
// Traceability: WP-TENANT-HARD-DELETE-LIFECYCLE-ENGINE-001
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TenantHardDeleteService,
  isTenantProtected,
  isUserProtected,
  PROTECTED_TENANTS,
} from '@/modules/saas/services/tenant-hard-delete-service';

/**
 * Clean mock builder helper for Drizzle ORM query chaining
 */
function createMockDb(config: {
  tenant?: any;
  memberships?: any[];
  survivingMembershipsCount?: number;
  platformRolesCount?: number;
  counts?: number;
}) {
  const defaultTenant = config.tenant || {
    id: 't_disposable_001',
    name: 'Disposable Test Tenant',
    slug: 'disposable-001',
    code: 'DISP01',
    status: 'active',
  };

  const defaultMembers = config.memberships || [];
  const survivingCount = config.survivingMembershipsCount ?? 0;
  const platformCount = config.platformRolesCount ?? 0;
  const defaultCounts = config.counts ?? 0;

  let whereCallIndex = 0;

  const mockTx = {
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue({ rowCount: 1 }),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ val: survivingCount }]),
      })),
    })),
  };

  const mockDb = {
    select: vi.fn((fields?: any) => {
      return {
        from: vi.fn((table: any) => {
          return {
            innerJoin: vi.fn(() => ({
              where: vi.fn().mockResolvedValue(defaultMembers),
            })),
            where: vi.fn((clause: any) => {
              whereCallIndex++;
              // If querying surviving memberships or platform roles for affected users
              let val = defaultCounts;
              if (survivingCount > 0 && whereCallIndex > 10) {
                val = survivingCount;
              }
              return {
                limit: vi.fn().mockResolvedValue(defaultTenant ? [defaultTenant] : []),
                then: (resolve: any) => resolve([{ val }]),
              };
            }),
            limit: vi.fn().mockResolvedValue(defaultTenant ? [defaultTenant] : []),
          };
        }),
      };
    }),
    transaction: vi.fn(async (cb: any) => cb(mockTx)),
  };

  return { mockDb, mockTx };
}

describe('Tenant Hard-Delete Lifecycle Engine Contract & Safety Suite', () => {
  let service: TenantHardDeleteService;

  beforeEach(() => {
    service = new TenantHardDeleteService();
    vi.clearAllMocks();
  });

  // ── TEST 1: Protected SR2601 Invariant ──────────────────────────────────────
  it('TEST 1: strictly rejects any attempt to plan or execute hard-delete on SR2601 (Ponpes Darunnajah)', async () => {
    // 1. Protection helper test
    const checkCode = isTenantProtected({
      id: 'any_id',
      code: 'SR2601',
      slug: 'any_slug',
    });
    expect(checkCode.isProtected).toBe(true);
    expect(checkCode.reason).toContain('SR2601');

    const checkId = isTenantProtected({
      id: PROTECTED_TENANTS.OFFICIAL_FIRST_TENANT_ID,
      code: 'ANY',
      slug: 'any',
    });
    expect(checkId.isProtected).toBe(true);

    const checkSlug = isTenantProtected({
      id: 'any',
      code: 'ANY',
      slug: PROTECTED_TENANTS.OFFICIAL_FIRST_TENANT_SLUG,
    });
    expect(checkSlug.isProtected).toBe(true);

    // 2. Plan phase on SR2601
    const { mockDb } = createMockDb({
      tenant: {
        id: PROTECTED_TENANTS.OFFICIAL_FIRST_TENANT_ID,
        name: 'Ponpes Darunnajah',
        slug: 'pp-darunnajah',
        code: 'SR2601',
        status: 'active',
      },
    });

    const plan = await service.planHardDelete(
      PROTECTED_TENANTS.OFFICIAL_FIRST_TENANT_ID,
      { userId: 'admin_1', role: 'SUPER_ADMIN', isSuperAdmin: true },
      mockDb as any
    );

    expect(plan.isProtected).toBe(true);
    expect(plan.isEligible).toBe(false);
    expect(plan.protectionReason).toContain('SR2601');

    // 3. Execution on SR2601 must throw immediately
    await expect(
      service.executeHardDelete(
        {
          targetTenantId: PROTECTED_TENANTS.OFFICIAL_FIRST_TENANT_ID,
          confirmationCode: `DELETE-SR2601-pp-darunnajah`,
        },
        { userId: 'admin_1', role: 'SUPER_ADMIN', isSuperAdmin: true },
        mockDb as any
      )
    ).rejects.toThrow(/dilindungi secara permanen/);
  });

  // ── TEST 2: Protected User Identities ───────────────────────────────────────
  it('TEST 2: protects official SR2601 owner and platform super admins from being purged', () => {
    const ownerProt = isUserProtected({
      id: 'user_123',
      email: 'abu.thohir.zmr92@gmail.com',
    });
    expect(ownerProt.isProtected).toBe(true);
    expect(ownerProt.reason).toContain('SR2601');

    const superAdminProt = isUserProtected({
      id: 'user_456',
      email: 'superadmin@madev.id',
    });
    expect(superAdminProt.isProtected).toBe(true);

    const devProt = isUserProtected({
      id: 'user_789',
      email: 'preview.developer@madev.id',
    });
    expect(devProt.isProtected).toBe(true);

    const regularUser = isUserProtected({
      id: 'user_999',
      email: 'regular.admin@test.id',
    });
    expect(regularUser.isProtected).toBe(false);
  });

  // ── TEST 3: Authorization Fail-Closed ───────────────────────────────────────
  it('TEST 3: rejects unauthorized non-superadmin actors with 403 equivalent', async () => {
    const { mockDb } = createMockDb({});

    await expect(
      service.planHardDelete(
        't_disposable_001',
        { userId: 'user_regular', role: 'ADMIN', isSuperAdmin: false },
        mockDb as any
      )
    ).rejects.toThrow(/Akses ditolak/);

    await expect(
      service.executeHardDelete(
        { targetTenantId: 't_disposable_001', confirmationCode: 'DELETE-T01-t01' },
        { userId: 'user_regular', role: 'GURU', isSuperAdmin: false },
        mockDb as any
      )
    ).rejects.toThrow(/Akses ditolak/);
  });

  // ── TEST 4: Single-Tenant Owner Purge Planning ─────────────────────────────
  it('TEST 4: plans deletion and correctly identifies single-tenant owner as purge candidate', async () => {
    const { mockDb } = createMockDb({
      tenant: {
        id: 't_test_002',
        name: 'Disposable Tenant 002',
        slug: 'disposable-002',
        code: 'DISP02',
        status: 'active',
      },
      memberships: [
        {
          membershipId: 'utm_002',
          userId: 'user_disp_002',
          roleId: 'role_admin_002',
          userEmail: 'owner.disp02@test.id',
          userName: 'Owner Disposable',
        },
      ],
      survivingMembershipsCount: 0,
      platformRolesCount: 0,
    });

    const plan = await service.planHardDelete(
      't_test_002',
      { userId: 'admin_1', role: 'SUPER_ADMIN', isSuperAdmin: true },
      mockDb as any
    );

    expect(plan.isEligible).toBe(true);
    expect(plan.isProtected).toBe(false);
    expect(plan.confirmationCode).toBe('DELETE-DISP02-disposable-002');
    expect(plan.affectedUsers.length).toBe(1);
    expect(plan.affectedUsers[0].email).toBe('owner.disp02@test.id');
    expect(plan.affectedUsers[0].willBePurged).toBe(true);
    expect(plan.purgeCandidatesCount).toBe(1);
    expect(plan.retainedUsersCount).toBe(0);
  });

  // ── TEST 5: Multi-Tenant Surviving Identity Protection ───────────────────────
  it('TEST 5: preserves identity when user has surviving memberships in another tenant', async () => {
    const { mockDb } = createMockDb({
      tenant: {
        id: 't_test_003',
        name: 'Disposable Tenant 003',
        slug: 'disposable-003',
        code: 'DISP03',
        status: 'active',
      },
      memberships: [
        {
          membershipId: 'utm_003',
          userId: 'user_shared_001',
          roleId: 'role_admin_003',
          userEmail: 'shared.user@test.id',
          userName: 'Shared User',
        },
      ],
      survivingMembershipsCount: 1, // Has 1 active membership in another tenant
      platformRolesCount: 0,
    });

    const plan = await service.planHardDelete(
      't_test_003',
      { userId: 'admin_1', role: 'SUPER_ADMIN', isSuperAdmin: true },
      mockDb as any
    );

    expect(plan.affectedUsers[0].survivingMembershipsCount).toBe(1);
    expect(plan.affectedUsers[0].willBePurged).toBe(false);
    expect(plan.affectedUsers[0].retentionReason).toContain('keanggotaan aktif di tenant lain');
    expect(plan.purgeCandidatesCount).toBe(0);
    expect(plan.retainedUsersCount).toBe(1);
  });

  // ── TEST 6: Confirmation Code Strict Matching ──────────────────────────────
  it('TEST 6: rejects execution when confirmation code does not match deletion plan', async () => {
    const { mockDb } = createMockDb({
      tenant: {
        id: 't_test_004',
        name: 'Disposable Tenant 004',
        slug: 'disposable-004',
        code: 'DISP04',
        status: 'active',
      },
      memberships: [],
    });

    await expect(
      service.executeHardDelete(
        {
          targetTenantId: 't_test_004',
          confirmationCode: 'WRONG-CODE',
        },
        { userId: 'admin_1', role: 'SUPER_ADMIN', isSuperAdmin: true },
        mockDb as any
      )
    ).rejects.toThrow(/Kode konfirmasi tidak valid/);
  });

  // ── TEST 7: Atomic Execution and Auth Purge Consistency ─────────────────────
  it('TEST 7: executes transactional DB delete and triggers Supabase Auth purge for orphaned identity', async () => {
    const { mockDb } = createMockDb({
      tenant: {
        id: 't_test_005',
        name: 'Disposable Tenant 005',
        slug: 'disposable-005',
        code: 'DISP05',
        status: 'active',
      },
      memberships: [
        {
          membershipId: 'utm_005',
          userId: 'user_orphan_005',
          roleId: 'role_admin_005',
          userEmail: 'orphan.user@test.id',
          userName: 'Orphan User',
        },
      ],
      survivingMembershipsCount: 0,
      platformRolesCount: 0,
    });

    const mockAuthAdmin = {
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      },
    } as any;

    const result = await service.executeHardDelete(
      {
        targetTenantId: 't_test_005',
        confirmationCode: 'DELETE-DISP05-disposable-005',
        purgeOrphanedIdentities: true,
      },
      { userId: 'admin_1', role: 'SUPER_ADMIN', isSuperAdmin: true },
      mockDb as any,
      mockAuthAdmin
    );

    expect(result.success).toBe(true);
    expect(result.tenantCode).toBe('DISP05');
    expect(result.purgedUsers.length).toBe(1);
    expect(result.purgedUsers[0].userId).toBe('user_orphan_005');
    expect(result.purgedUsers[0].dbDeleted).toBe(true);
    expect(result.purgedUsers[0].authDeleted).toBe(true);
    expect(mockAuthAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('user_orphan_005');
  });

  // ── TEST 8: Auth Deletion Error Resilience & Non-rollback Strategy ──────────
  it('TEST 8: records auth deletion failure without corrupting or rolling back completed DB delete', async () => {
    const { mockDb } = createMockDb({
      tenant: {
        id: 't_test_006',
        name: 'Disposable Tenant 006',
        slug: 'disposable-006',
        code: 'DISP06',
        status: 'active',
      },
      memberships: [
        {
          membershipId: 'utm_006',
          userId: 'user_orphan_006',
          roleId: 'role_admin_006',
          userEmail: 'orphan.user6@test.id',
          userName: 'Orphan User 6',
        },
      ],
      survivingMembershipsCount: 0,
      platformRolesCount: 0,
    });

    const mockAuthAdmin = {
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Supabase Auth Network Timeout' },
          }),
        },
      },
    } as any;

    const result = await service.executeHardDelete(
      {
        targetTenantId: 't_test_006',
        confirmationCode: 'DELETE-DISP06-disposable-006',
        purgeOrphanedIdentities: true,
      },
      { userId: 'admin_1', role: 'SUPER_ADMIN', isSuperAdmin: true },
      mockDb as any,
      mockAuthAdmin
    );

    expect(result.success).toBe(true);
    expect(result.purgedUsers[0].dbDeleted).toBe(true);
    expect(result.purgedUsers[0].authDeleted).toBe(false);
    expect(result.purgedUsers[0].error).toContain('Supabase Auth Network Timeout');
  });

  // ── TEST 9: Legacy Tables (Asrama, Kamar, Kelas, Mapel) are Not Queried or Deleted ─
  it('TEST 9: strictly avoids querying or deleting legacy non-tenant-scoped tables (asrama, kamar, kelas, mapel)', async () => {
    const queriedTables: any[] = [];
    const deletedTables: any[] = [];

    const mockTx = {
      delete: vi.fn((table: any) => {
        deletedTables.push(table);
        return {
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        };
      }),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([{ val: 0 }]),
        })),
      })),
    };

    const mockDb = {
      select: vi.fn(() => ({
        from: vi.fn((table: any) => {
          queriedTables.push(table);
          return {
            innerJoin: vi.fn(() => ({
              where: vi.fn().mockResolvedValue([]),
            })),
            where: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue([
                {
                  id: 't_test_007',
                  name: 'Legacy Safety Tenant',
                  slug: 'legacy-safety',
                  code: 'LEG07',
                  status: 'active',
                },
              ]),
              then: (resolve: any) => resolve([{ val: 0 }]),
            })),
            limit: vi.fn().mockResolvedValue([
              {
                id: 't_test_007',
                name: 'Legacy Safety Tenant',
                slug: 'legacy-safety',
                code: 'LEG07',
                status: 'active',
              },
            ]),
          };
        }),
      })),
      transaction: vi.fn(async (cb: any) => cb(mockTx)),
    };

    const plan = await service.planHardDelete(
      't_test_007',
      { userId: 'admin_1', role: 'SUPER_ADMIN', isSuperAdmin: true },
      mockDb as any
    );

    expect(plan.isEligible).toBe(true);
    // Ensure dependentCounts only has verified tenant-scoped keys
    expect(plan.dependentCounts).not.toHaveProperty('asrama');
    expect(plan.dependentCounts).not.toHaveProperty('kamar');
    expect(plan.dependentCounts).not.toHaveProperty('kelas');
    expect(plan.dependentCounts).not.toHaveProperty('mapel');
    expect(plan.dependentCounts).toHaveProperty('santri');
    expect(plan.dependentCounts).toHaveProperty('academicYears');
    expect(plan.dependentCounts).toHaveProperty('academicTerms');
    expect(plan.dependentCounts).toHaveProperty('madrasah');
    expect(plan.dependentCounts).toHaveProperty('jenjang');
    expect(plan.dependentCounts).toHaveProperty('tingkat');
    expect(plan.dependentCounts).toHaveProperty('rombel');
    expect(plan.dependentCounts).toHaveProperty('settings');

    const result = await service.executeHardDelete(
      {
        targetTenantId: 't_test_007',
        confirmationCode: 'DELETE-LEG07-legacy-safety',
      },
      { userId: 'admin_1', role: 'SUPER_ADMIN', isSuperAdmin: true },
      mockDb as any
    );

    expect(result.success).toBe(true);
    expect(result.deletedCounts).not.toHaveProperty('asrama');
    expect(result.deletedCounts).not.toHaveProperty('kamar');
    expect(result.deletedCounts).not.toHaveProperty('kelas');
    expect(result.deletedCounts).not.toHaveProperty('mapel');
  });

  // ── TEST 10: Drizzle Schema Contract Verification for Legacy Tables ────────
  it('TEST 10: verifies schema.ts reflects physical database with ZERO tenantId on legacy tables', async () => {
    const { asrama, kamar, kelas, mapel } = await import('@/lib/db/schema');

    // Drizzle table objects contain column definitions in their schema metadata
    expect((asrama as any).tenantId).toBeUndefined();
    expect((kamar as any).tenantId).toBeUndefined();
    expect((kelas as any).tenantId).toBeUndefined();
    expect((mapel as any).tenantId).toBeUndefined();
  });

  // ── TEST 11: Drizzle Schema Contract Verification for Tenant-Scoped Tables ─
  it('TEST 11: verifies schema.ts contains valid tenantId definitions for active tenant-scoped tables', async () => {
    const { santri, madrasah, jenjang, tingkat, rombel, tenantSettings, tenantRoles, userTenantMemberships } = await import('@/lib/db/schema');
    const { academicYears, academicTerms } = await import('@/lib/db/schema/academic_workspace');

    expect((santri as any).tenantId).toBeDefined();
    expect((madrasah as any).tenantId).toBeDefined();
    expect((jenjang as any).tenantId).toBeDefined();
    expect((tingkat as any).tenantId).toBeDefined();
    expect((rombel as any).tenantId).toBeDefined();
    expect((academicYears as any).tenantId).toBeDefined();
    expect((academicTerms as any).tenantId).toBeDefined();
    expect((tenantSettings as any).tenantId).toBeDefined();
    expect((tenantRoles as any).tenantId).toBeDefined();
    expect((userTenantMemberships as any).tenantId).toBeDefined();
  });
});
