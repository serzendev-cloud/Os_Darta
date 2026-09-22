/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as provisioningService from '../../src/modules/saas/services/tenant-provisioning-service';
import * as supabaseAdminModule from '../../src/lib/supabase/admin';
import * as canonicalPermsModule from '../../src/lib/authz/canonical-permissions';
import { db } from '../../src/lib/db';
import { auditLogService } from '../../src/lib/db/services/auditLog';
import { requirePermission } from '../../src/lib/authz/authorization-service';
import { CANONICAL_PERMISSIONS } from '../../src/lib/authz/canonical-permissions';
import { tenantCodeCounterService } from '../../src/lib/tenant/tenant-code-counter-service';

describe('WP-TENANT-PROVISION-SEED-PERMISSIONS-001 — Admin Role Permission Seeding Contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(tenantCodeCounterService, 'allocateNextTenantCode').mockResolvedValue({
      code: 'SR2601',
      year: 2026,
      sequence: 1,
    });
  });

  // ── TEST 1: ADMIN role is created for newly provisioned tenant ─────────────
  it('TEST 1: ADMIN role is created for newly provisioned tenant', async () => {
    const mockAuthUserId = 'auth-admin-user-001';
    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({ data: { user: { id: mockAuthUserId, email: 'admin@pesantren-al-fatih.id' } }, error: null }),
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    } as any);

    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });
    vi.spyOn(auditLogService, 'log').mockResolvedValue('audit_123');

    const insertedRoles: any[] = [];
    vi.spyOn(db, 'transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        execute: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockImplementation((table: any) => ({
          values: vi.fn().mockImplementation(async (vals: any) => {
            const valList = Array.isArray(vals) ? vals : [vals];
            if (table && table.roleCode) insertedRoles.push(...valList);
            return [];
          }),
        })),
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => ({
              limit: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      };
      return await callback(mockTx);
    });

    const result = await provisioningService.tenantProvisioningService.provisionTenant(
      {
        name: 'Pesantren Al Fatih',
        slug: 'al-fatih',
        ownerName: 'Ustadz Fatih',
        ownerEmail: 'admin@pesantren-al-fatih.id',
      },
      { userId: 'super_admin_001', name: 'Super Admin', role: 'super_admin' }
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe('PROVISIONED');
    expect(insertedRoles.length).toBe(1);
    const createdRole = insertedRoles[0];
    expect(createdRole.roleCode).toBe('ADMIN');
    expect(createdRole.tenantId).toBe(result.tenant.id);
    expect(createdRole.status).toBe('ACTIVE');
  });

  // ── TEST 2: ADMIN role has permission assignments seeded ───────────────────
  it('TEST 2: ADMIN role has permission assignments seeded upon provisioning', async () => {
    const mockAuthUserId = 'auth-admin-user-001b';
    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({ data: { user: { id: mockAuthUserId, email: 'admin@pesantren-al-fatih.id' } }, error: null }),
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    } as any);

    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });
    vi.spyOn(auditLogService, 'log').mockResolvedValue('audit_123');

    let createdRoleId = '';
    const insertedPermissions: any[] = [];
    vi.spyOn(db, 'transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        execute: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockImplementation((table: any) => ({
          values: vi.fn().mockImplementation(async (vals: any) => {
            const valList = Array.isArray(vals) ? vals : [vals];
            if (table && table.roleCode) createdRoleId = valList[0]?.id;
            if (table && table.tenantRoleId && table.permissionId) insertedPermissions.push(...valList);
            return [];
          }),
        })),
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => ({
              limit: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      };
      return await callback(mockTx);
    });

    await provisioningService.tenantProvisioningService.provisionTenant(
      {
        name: 'Pesantren Al Fatih',
        slug: 'al-fatih',
        ownerName: 'Ustadz Fatih',
        ownerEmail: 'admin@pesantren-al-fatih.id',
      },
      { userId: 'super_admin_001', name: 'Super Admin', role: 'super_admin' }
    );

    expect(insertedPermissions.length).toBeGreaterThan(0);
    for (const trp of insertedPermissions) {
      expect(trp.tenantRoleId).toBe(createdRoleId);
      expect(trp.permissionId).toBeDefined();
    }
  });

  // ── TEST 3: Permissions only target canonical TENANT permission IDs ────────
  it('TEST 3: Permission assignments strictly target canonical TENANT permissions and exclude PLATFORM scope', async () => {
    const mockAuthUserId = 'auth-admin-user-002';
    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({ data: { user: { id: mockAuthUserId, email: 'admin@darul-ulum.id' } }, error: null }),
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    } as any);

    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });
    vi.spyOn(auditLogService, 'log').mockResolvedValue('audit_123');

    const insertedPermissions: any[] = [];
    vi.spyOn(db, 'transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        execute: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockImplementation((table: any) => ({
          values: vi.fn().mockImplementation(async (vals: any) => {
            const valList = Array.isArray(vals) ? vals : [vals];
            if (table && table.tenantRoleId && table.permissionId) insertedPermissions.push(...valList);
            return [];
          }),
        })),
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => ({
              limit: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      };
      return await callback(mockTx);
    });

    await provisioningService.tenantProvisioningService.provisionTenant(
      {
        name: 'Pesantren Darul Ulum',
        slug: 'darul-ulum',
        ownerName: 'Kyai Hasyim',
        ownerEmail: 'admin@darul-ulum.id',
      },
      { userId: 'super_admin_001', name: 'Super Admin', role: 'super_admin' }
    );

    expect(insertedPermissions.length).toBeGreaterThan(0);

    const canonicalMap = new Map(CANONICAL_PERMISSIONS.map((p) => [p.id, p]));
    for (const assignment of insertedPermissions) {
      const canonical = canonicalMap.get(assignment.permissionId);
      expect(canonical).toBeDefined();
      // Scope MUST be TENANT, never PLATFORM
      expect(canonical?.scope).toBe('TENANT');
    }

    // Platform permissions must NOT be assigned to tenant ADMIN
    const platformPermIds = new Set(
      CANONICAL_PERMISSIONS.filter((p) => p.scope === 'PLATFORM').map((p) => p.id)
    );
    for (const assignment of insertedPermissions) {
      expect(platformPermIds.has(assignment.permissionId)).toBe(false);
    }
  });

  // ── TEST 4: Strict Tenant Scoping ──────────────────────────────────────────
  it('TEST 4: Permission assignments are strictly scoped to the newly created tenant ADMIN role', async () => {
    const roleIdTenantA = 'role_admin_tenant_A';
    const insertedForA: any[] = [];

    const mockTxA = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(async (vals: any) => {
          const list = Array.isArray(vals) ? vals : [vals];
          for (const item of list) {
            if (item && 'tenantRoleId' in item) {
              insertedForA.push(item);
            }
          }
          return [];
        }),
      })),
    };

    await canonicalPermsModule.seedTenantAdminPermissions(roleIdTenantA, 'tenant_A', mockTxA);

    expect(insertedForA.length).toBeGreaterThan(0);
    expect(insertedForA.every((p) => p.tenantRoleId === roleIdTenantA)).toBe(true);
  });

  // ── TEST 5: Idempotency (No duplicate permission assignments) ──────────────
  it('TEST 5: Ensures idempotency and avoids duplicate permission assignments', async () => {
    const roleId = 'role_admin_idempotent_test';
    const tenantId = 'tenant_idempotent';

    const existingPermissionId = 'perm_view_dashboard';
    const insertedRecords: any[] = [];

    const mockTx = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockResolvedValue([{ permissionId: existingPermissionId }]),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(async (vals: any) => {
          const list = Array.isArray(vals) ? vals : [vals];
          for (const item of list) {
            if (item && 'tenantRoleId' in item) {
              insertedRecords.push(item);
            }
          }
          return [];
        }),
      })),
    };

    const res = await canonicalPermsModule.seedTenantAdminPermissions(roleId, tenantId, mockTx);

    // Should not insert existingPermissionId again
    const reInserted = insertedRecords.find((r) => r.permissionId === existingPermissionId);
    expect(reInserted).toBeUndefined();

    // Total unique permission assignments in insertedRecords
    const assignedIds = insertedRecords.map((r) => r.permissionId);
    const uniqueAssignedIds = new Set(assignedIds);
    expect(assignedIds.length).toBe(uniqueAssignedIds.size);
    expect(res.seededCount).toBe(assignedIds.length);
  });

  // ── TEST 6: Multi-Tenant Isolation ─────────────────────────────────────────
  it('TEST 6: Tenant A does not receive Tenant B permission assignments', async () => {
    const roleIdTenantA = 'role_admin_tenant_A';
    const roleIdTenantB = 'role_admin_tenant_B';

    const insertedForA: any[] = [];
    const insertedForB: any[] = [];

    const mockTxA = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(async (vals: any) => {
          const list = Array.isArray(vals) ? vals : [vals];
          for (const item of list) {
            if (item && 'tenantRoleId' in item) {
              insertedForA.push(item);
            }
          }
          return [];
        }),
      })),
    };

    const mockTxB = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(async (vals: any) => {
          const list = Array.isArray(vals) ? vals : [vals];
          for (const item of list) {
            if (item && 'tenantRoleId' in item) {
              insertedForB.push(item);
            }
          }
          return [];
        }),
      })),
    };

    await canonicalPermsModule.seedTenantAdminPermissions(roleIdTenantA, 'tenant_A', mockTxA);
    await canonicalPermsModule.seedTenantAdminPermissions(roleIdTenantB, 'tenant_B', mockTxB);

    const aRoleIds = new Set(insertedForA.map((p) => p.tenantRoleId));
    const bRoleIds = new Set(insertedForB.map((p) => p.tenantRoleId));
    expect(aRoleIds.has(roleIdTenantB)).toBe(false);
    expect(bRoleIds.has(roleIdTenantA)).toBe(false);
  });

  // ── TEST 7: Failure during permission seeding causes atomic cascade rollback ──
  it('TEST 7: Triggers atomic rollback and Auth compensation deletion if permission seeding fails', async () => {
    const mockAuthUserId = 'orphan-user-perm-fail-999';
    const mockDeleteUser = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({ data: { user: { id: mockAuthUserId, email: 'fail@pesantren.id' } }, error: null }),
          deleteUser: mockDeleteUser,
        },
      },
    } as any);

    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });

    // Mock db.transaction to execute transaction callback where seedTenantAdminPermissions throws
    vi.spyOn(db, 'transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        execute: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
        select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) }),
      };
      return await callback(mockTx);
    });

    // Mock seedTenantAdminPermissions to throw simulated DB error
    vi.spyOn(canonicalPermsModule, 'seedTenantAdminPermissions').mockRejectedValueOnce(
      new Error('Simulated Database Failure: foreign key violation on tenant_role_permissions')
    );

    await expect(
      provisioningService.tenantProvisioningService.provisionTenant(
        {
          name: 'Pesantren Rollback Test',
          slug: 'rollback-test',
          ownerName: 'Ustadz Test',
          ownerEmail: 'fail@pesantren.id',
        },
        { userId: 'super_admin_001', name: 'Super Admin', role: 'super_admin' }
      )
    ).rejects.toThrow();

    // Verify compensation rollback was triggered
    expect(mockDeleteUser).toHaveBeenCalledWith(mockAuthUserId);
  });

  // ── TEST 8: Existing tenant is untouched by new tenant provisioning ────────
  it('TEST 8: Existing tenant data is untouched during new tenant provisioning', async () => {
    const existingTenantId = 'runtime-verify-001';
    const newTenantSlug = 'new-standalone-tenant';

    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-new-001', email: 'admin@new.id' } }, error: null }),
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    } as any);

    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });
    vi.spyOn(auditLogService, 'log').mockResolvedValue('audit_123');

    const insertedTenants: any[] = [];
    vi.spyOn(db, 'transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        execute: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockImplementation((table: any) => ({
          values: vi.fn().mockImplementation(async (vals: any) => {
            if (table && table.slug) insertedTenants.push(...(Array.isArray(vals) ? vals : [vals]));
            return [];
          }),
        })),
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => ({
              limit: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      };
      return await callback(mockTx);
    });

    const result = await provisioningService.tenantProvisioningService.provisionTenant(
      {
        name: 'New Standalone Tenant',
        slug: newTenantSlug,
        ownerName: 'Admin New',
        ownerEmail: 'admin@new.id',
      },
      { userId: 'super_admin_001', name: 'Super Admin', role: 'super_admin' }
    );

    expect(result.tenant.id).not.toBe(existingTenantId);
    expect(insertedTenants.some((t) => t.id === existingTenantId)).toBe(false);
  });

  // ── TEST 9: Transaction Client Propagation ────────────────────────────────
  it('TEST 9: Propagates the exact transaction client (tx) into permission seeder', async () => {
    let capturedTx: any = null;
    vi.spyOn(canonicalPermsModule, 'seedTenantAdminPermissions').mockImplementation(
      async (_roleId: string, _tenantId: string, tx: any) => {
        capturedTx = tx;
        return { seededCount: 45, assignedPermissionCodes: [] };
      }
    );

    const mockAuthUserId = 'usr-tx-prop-001';
    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({ data: { user: { id: mockAuthUserId, email: 'admin@tx.id' } }, error: null }),
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    } as any);

    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });
    vi.spyOn(auditLogService, 'log').mockResolvedValue('audit_123');

    let transactionClientInstance: any = null;
    vi.spyOn(db, 'transaction').mockImplementation(async (callback: any) => {
      transactionClientInstance = {
        tag: 'canonical-provisioning-tx-client',
        execute: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
          }),
        }),
      };
      return await callback(transactionClientInstance);
    });

    await provisioningService.tenantProvisioningService.provisionTenant(
      {
        name: 'Tx Propagation Tenant',
        slug: 'tx-prop',
        ownerName: 'Admin Tx',
        ownerEmail: 'admin@tx.id',
      },
      { userId: 'super_admin_001', name: 'Super Admin', role: 'super_admin' }
    );

    expect(capturedTx).toBe(transactionClientInstance);
    expect(capturedTx.tag).toBe('canonical-provisioning-tx-client');
  });

  // ── TEST 10: requirePermission recognizes seeded ADMIN permissions ─────────
  it('TEST 10: requirePermission successfully authorizes ADMIN after permission seeding', async () => {
    const tenantId = 't_test_seeded_tenant';
    const userId = 'usr_admin_seeded';
    const roleId = 'role_admin_t_test_seeded_tenant';

    const seededPermissions = CANONICAL_PERMISSIONS.filter((p) => p.scope === 'TENANT').map((p) => ({
      code: p.code,
      scope: p.scope,
    }));

    // Mock DB configured with seeded permissions
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation((table: any) => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              if (table && table.email && table.phone) return [{ id: userId, status: 'ACTIVE' }];
              if (table && table.id && table.slug) return [{ id: tenantId, status: 'active' }];
              if (table && table.userId && table.primaryRoleId) return [{ id: 'utm_1', primaryRoleId: roleId, status: 'ACTIVE' }];
              if (table && table.roleCode && table.isCustom) return [{ id: roleId, roleCode: 'ADMIN', status: 'ACTIVE' }];
              return [];
            }),
          })),
          innerJoin: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => {
              // Return role permissions
              if (table && table.tenantRoleId) {
                return seededPermissions;
              }
              return [];
            }),
          })),
        })),
      })),
    } as any;

    // Test essential admin permissions
    const authz1 = await requirePermission(userId, tenantId, 'view_pengaturan', mockDb);
    expect(authz1.authorized).toBe(true);
    expect(authz1.decision).toBe('AUTHORIZED');

    const authz2 = await requirePermission(userId, tenantId, 'manage_santri', mockDb);
    expect(authz2.authorized).toBe(true);
    expect(authz2.decision).toBe('AUTHORIZED');

    const authz3 = await requirePermission(userId, tenantId, 'manage_pengaturan', mockDb);
    expect(authz3.authorized).toBe(true);
    expect(authz3.decision).toBe('AUTHORIZED');

    // Unseeded / nonexistent permission should be denied
    const authzUnregistered = await requirePermission(userId, tenantId, 'nonexistent_permission', mockDb);
    expect(authzUnregistered.authorized).toBe(false);
    expect(authzUnregistered.decision).toBe('DENIED_PERMISSION_MISSING');
  });
});
