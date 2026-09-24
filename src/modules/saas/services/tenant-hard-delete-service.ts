// =============================================================================
// SaaS Tenant Hard-Delete Lifecycle Engine
// Canonical Multi-Tenant Decommissioning & Orphan Identity Purge Engine
// Traceability: WP-TENANT-HARD-DELETE-LIFECYCLE-ENGINE-001
// =============================================================================

import { eq, and, inArray, sql, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  tenants,
  tenantSettings,
  users,
  tenantRoles,
  tenantRolePermissions,
  userTenantMemberships,
  userPlatformRoles,
  santri,
  asrama,
  kamar,
  kelas,
  mapel,
  madrasah,
  jenjang,
  tingkat,
  rombel,
} from '@/lib/db/schema';
import { academicYears, academicTerms } from '@/lib/db/schema/academic_workspace';
import { createAdminClient } from '@/lib/supabase/admin';
import { auditLogService } from '@/lib/db/services/auditLog';

export interface HardDeleteActorContext {
  userId: string;
  name?: string;
  role?: string;
  isSuperAdmin?: boolean;
}

export interface AffectedUserAnalysis {
  userId: string;
  email: string;
  name: string;
  roleInTenant: string;
  survivingMembershipsCount: number;
  platformRolesCount: number;
  isPlatformUser: boolean;
  isProtectedUser: boolean;
  willBePurged: boolean;
  retentionReason?: string;
}

export interface DependentRecordsSummary {
  memberships: number;
  roles: number;
  santri: number;
  asrama: number;
  kamar: number;
  kelas: number;
  mapel: number;
  academicYears: number;
  academicTerms: number;
  madrasah: number;
  jenjang: number;
  tingkat: number;
  rombel: number;
  settings: number;
}

export interface HardDeletePlanResult {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  tenantSlug: string;
  isEligible: boolean;
  isProtected: boolean;
  protectionReason?: string;
  dependentCounts: DependentRecordsSummary;
  affectedUsers: AffectedUserAnalysis[];
  purgeCandidatesCount: number;
  retainedUsersCount: number;
  confirmationCode: string;
  requiredConfirmationText: string;
  plannedAt: string;
}

export interface HardDeleteExecutionOptions {
  targetTenantId: string;
  confirmationCode: string;
  purgeOrphanedIdentities?: boolean;
}

export interface UserPurgeResult {
  userId: string;
  email: string;
  dbDeleted: boolean;
  authDeleted: boolean;
  error?: string;
}

export interface HardDeleteExecutionResult {
  success: boolean;
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  deletedCounts: {
    tenant: number;
    santri: number;
    asrama: number;
    kamar: number;
    kelas: number;
    mapel: number;
    settings: number;
  };
  purgedUsers: UserPurgeResult[];
  retainedUsers: Array<{
    userId: string;
    email: string;
    reason: string;
  }>;
  auditLogId?: string;
  executedAt: string;
}

/**
 * Hardcoded protected tenant definitions to safeguard production infrastructure (Fail-Closed).
 */
export const PROTECTED_TENANTS = {
  OFFICIAL_FIRST_TENANT_CODE: 'SR2601',
  OFFICIAL_FIRST_TENANT_ID: 't_1790171191747_pyv9n',
  OFFICIAL_FIRST_TENANT_SLUG: 'pp-darunnajah',
  OFFICIAL_FIRST_TENANT_EMAIL: 'abu.thohir.zmr92@gmail.com',
};

/**
 * Validates whether a tenant is protected against hard delete.
 */
export function isTenantProtected(tenant: { id: string; code: string; slug: string }): {
  isProtected: boolean;
  reason?: string;
} {
  if (
    tenant.code?.toUpperCase() === PROTECTED_TENANTS.OFFICIAL_FIRST_TENANT_CODE ||
    tenant.id === PROTECTED_TENANTS.OFFICIAL_FIRST_TENANT_ID ||
    tenant.slug?.toLowerCase() === PROTECTED_TENANTS.OFFICIAL_FIRST_TENANT_SLUG
  ) {
    return {
      isProtected: true,
      reason: `Tenant '${tenant.code}' (${tenant.slug}) adalah Tenant Resmi Pertama (Production) yang dilindungi secara permanen dari operasi hard-delete.`,
    };
  }

  return { isProtected: false };
}

/**
 * Validates whether an individual user identity is protected from purge.
 */
export function isUserProtected(user: { id: string; email: string }): {
  isProtected: boolean;
  reason?: string;
} {
  if (user.email?.toLowerCase() === PROTECTED_TENANTS.OFFICIAL_FIRST_TENANT_EMAIL) {
    return {
      isProtected: true,
      reason: `Email '${user.email}' adalah akun pemilik resmi tenant SR2601 yang dilindungi secara permanen.`,
    };
  }

  if (
    user.email?.toLowerCase().startsWith('superadmin@') ||
    user.email?.toLowerCase().includes('preview.superadmin') ||
    user.email?.toLowerCase().includes('preview.developer')
  ) {
    return {
      isProtected: true,
      reason: `Email '${user.email}' adalah akun platform privileged yang dilindungi dari purge.`,
    };
  }

  return { isProtected: false };
}

export class TenantHardDeleteService {
  /**
   * PHASE 1 & 2: Plan and analyze a tenant hard-delete operation (Read-Only).
   */
  async planHardDelete(
    tenantId: string,
    actor: HardDeleteActorContext,
    dbInstance = db
  ): Promise<HardDeletePlanResult> {
    // 1. Authorization Pre-check
    const isSuperAdmin = actor.isSuperAdmin || actor.role?.toUpperCase() === 'SUPER_ADMIN' || actor.role?.toUpperCase() === 'DEVELOPER';
    if (!isSuperAdmin) {
      throw new Error('Akses ditolak. Hanya Super Admin / Developer yang memiliki wewenang untuk merencanakan hard-delete tenant.');
    }

    const cleanTenantId = (tenantId || '').trim();
    if (!cleanTenantId) {
      throw new Error('Tenant ID wajib diisi.');
    }

    // 2. Fetch target tenant
    const tenantRows = await dbInstance
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        code: tenants.code,
        status: tenants.status,
      })
      .from(tenants)
      .where(eq(tenants.id, cleanTenantId))
      .limit(1);

    if (tenantRows.length === 0) {
      throw new Error(`Tenant dengan ID '${cleanTenantId}' tidak ditemukan di database.`);
    }

    const tenant = tenantRows[0];

    // 3. Check hardcoded tenant protection
    const protection = isTenantProtected(tenant);

    // 4. Collect Dependent Counts
    const [
      membershipCountRes,
      rolesCountRes,
      santriCountRes,
      asramaCountRes,
      kamarCountRes,
      kelasCountRes,
      mapelCountRes,
      yearsCountRes,
      termsCountRes,
      madrasahCountRes,
      jenjangCountRes,
      tingkatCountRes,
      rombelCountRes,
      settingsCountRes,
    ] = await Promise.all([
      dbInstance.select({ val: count() }).from(userTenantMemberships).where(eq(userTenantMemberships.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(tenantRoles).where(eq(tenantRoles.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(santri).where(eq(santri.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(asrama).where(eq(asrama.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(kamar).where(eq(kamar.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(kelas).where(eq(kelas.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(mapel).where(eq(mapel.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(academicYears).where(eq(academicYears.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(academicTerms).where(eq(academicTerms.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(madrasah).where(eq(madrasah.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(jenjang).where(eq(jenjang.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(tingkat).where(eq(tingkat.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(rombel).where(eq(rombel.tenantId, cleanTenantId)),
      dbInstance.select({ val: count() }).from(tenantSettings).where(eq(tenantSettings.tenantId, cleanTenantId)),
    ]);

    const dependentCounts: DependentRecordsSummary = {
      memberships: Number(membershipCountRes[0]?.val || 0),
      roles: Number(rolesCountRes[0]?.val || 0),
      santri: Number(santriCountRes[0]?.val || 0),
      asrama: Number(asramaCountRes[0]?.val || 0),
      kamar: Number(kamarCountRes[0]?.val || 0),
      kelas: Number(kelasCountRes[0]?.val || 0),
      mapel: Number(mapelCountRes[0]?.val || 0),
      academicYears: Number(yearsCountRes[0]?.val || 0),
      academicTerms: Number(termsCountRes[0]?.val || 0),
      madrasah: Number(madrasahCountRes[0]?.val || 0),
      jenjang: Number(jenjangCountRes[0]?.val || 0),
      tingkat: Number(tingkatCountRes[0]?.val || 0),
      rombel: Number(rombelCountRes[0]?.val || 0),
      settings: Number(settingsCountRes[0]?.val || 0),
    };

    // 5. Fetch Affected Users and analyze surviving relationships
    const memberRows = await dbInstance
      .select({
        membershipId: userTenantMemberships.id,
        userId: userTenantMemberships.userId,
        roleId: userTenantMemberships.primaryRoleId,
        userEmail: users.email,
        userName: users.name,
      })
      .from(userTenantMemberships)
      .innerJoin(users, eq(userTenantMemberships.userId, users.id))
      .where(eq(userTenantMemberships.tenantId, cleanTenantId));

    const affectedUsers: AffectedUserAnalysis[] = [];

    for (const member of memberRows) {
      // Check surviving memberships across other tenants
      const otherMembershipsRes = await dbInstance
        .select({ val: count() })
        .from(userTenantMemberships)
        .where(
          and(
            eq(userTenantMemberships.userId, member.userId),
            sql`${userTenantMemberships.tenantId} != ${cleanTenantId}`
          )
        );
      const survivingMembershipsCount = Number(otherMembershipsRes[0]?.val || 0);

      // Check platform roles
      const platformRolesRes = await dbInstance
        .select({ val: count() })
        .from(userPlatformRoles)
        .where(eq(userPlatformRoles.userId, member.userId));
      const platformRolesCount = Number(platformRolesRes[0]?.val || 0);

      const userProt = isUserProtected({ id: member.userId, email: member.userEmail });

      let willBePurged = false;
      let retentionReason: string | undefined;

      if (userProt.isProtected) {
        willBePurged = false;
        retentionReason = userProt.reason;
      } else if (survivingMembershipsCount > 0) {
        willBePurged = false;
        retentionReason = `Pengguna memiliki ${survivingMembershipsCount} keanggotaan aktif di tenant lain.`;
      } else if (platformRolesCount > 0) {
        willBePurged = false;
        retentionReason = `Pengguna memiliki ${platformRolesCount} platform role (Super Admin / Developer).`;
      } else {
        willBePurged = true;
      }

      affectedUsers.push({
        userId: member.userId,
        email: member.userEmail,
        name: member.userName,
        roleInTenant: member.roleId,
        survivingMembershipsCount,
        platformRolesCount,
        isPlatformUser: platformRolesCount > 0,
        isProtectedUser: userProt.isProtected,
        willBePurged,
        retentionReason,
      });
    }

    const purgeCandidatesCount = affectedUsers.filter((u) => u.willBePurged).length;
    const retainedUsersCount = affectedUsers.filter((u) => !u.willBePurged).length;

    const confirmationCode = `DELETE-${tenant.code.toUpperCase()}-${tenant.slug.toLowerCase()}`;
    const requiredConfirmationText = `HAPUS PERMANEN ${tenant.code}`;

    return {
      tenantId: tenant.id,
      tenantCode: tenant.code,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      isEligible: !protection.isProtected,
      isProtected: protection.isProtected,
      protectionReason: protection.reason,
      dependentCounts,
      affectedUsers,
      purgeCandidatesCount,
      retainedUsersCount,
      confirmationCode,
      requiredConfirmationText,
      plannedAt: new Date().toISOString(),
    };
  }

  /**
   * PHASE 4, 5, 6: Execute permanent hard-delete of tenant and safe purge of orphan identities.
   */
  async executeHardDelete(
    options: HardDeleteExecutionOptions,
    actor: HardDeleteActorContext,
    dbInstance = db,
    supabaseAdminClient = createAdminClient()
  ): Promise<HardDeleteExecutionResult> {
    // 1. Authorization Pre-check
    const isSuperAdmin = actor.isSuperAdmin || actor.role?.toUpperCase() === 'SUPER_ADMIN' || actor.role?.toUpperCase() === 'DEVELOPER';
    if (!isSuperAdmin) {
      throw new Error('Akses ditolak. Hanya Super Admin / Developer yang memiliki wewenang untuk mengeksekusi hard-delete tenant.');
    }

    const cleanTenantId = (options.targetTenantId || '').trim();
    if (!cleanTenantId) {
      throw new Error('Target Tenant ID wajib diisi.');
    }

    // 2. Run Pre-plan to validate and obtain authoritative deletion plan
    const plan = await this.planHardDelete(cleanTenantId, actor, dbInstance);

    if (plan.isProtected) {
      throw new Error(`Operasi dibatalkan: ${plan.protectionReason}`);
    }

    // 3. Confirm confirmation code matching
    const expectedConfirmationCode = plan.confirmationCode;
    if (options.confirmationCode !== expectedConfirmationCode) {
      throw new Error(
        `Kode konfirmasi tidak valid. Diharapkan '${expectedConfirmationCode}', diterima '${options.confirmationCode}'.`
      );
    }

    const shouldPurgeOrphans = options.purgeOrphanedIdentities !== false;

    // 4. Collect affected users from plan
    const purgeCandidates = plan.affectedUsers.filter((u) => u.willBePurged);
    const retainedCandidates = plan.affectedUsers.filter((u) => !u.willBePurged);

    const deletedCounts = {
      tenant: 0,
      santri: 0,
      asrama: 0,
      kamar: 0,
      kelas: 0,
      mapel: 0,
      settings: 0,
    };

    const purgedUsers: UserPurgeResult[] = [];
    const retainedUsers: Array<{ userId: string; email: string; reason: string }> = retainedCandidates.map((u) => ({
      userId: u.userId,
      email: u.email,
      reason: u.retentionReason || 'Protected identity',
    }));

    // 5. ATOMIC DATABASE TRANSACTION (Phase 4 & 5)
    await dbInstance.transaction(async (tx) => {
      // 5.1 Delete unconstrained / restricted operational tables first to avoid RESTRICT violations
      const santriDel = await tx.delete(santri).where(eq(santri.tenantId, cleanTenantId));
      deletedCounts.santri = plan.dependentCounts.santri;

      await tx.delete(asrama).where(eq(asrama.tenantId, cleanTenantId));
      deletedCounts.asrama = plan.dependentCounts.asrama;

      await tx.delete(kamar).where(eq(kamar.tenantId, cleanTenantId));
      deletedCounts.kamar = plan.dependentCounts.kamar;

      await tx.delete(kelas).where(eq(kelas.tenantId, cleanTenantId));
      deletedCounts.kelas = plan.dependentCounts.kelas;

      await tx.delete(mapel).where(eq(mapel.tenantId, cleanTenantId));
      deletedCounts.mapel = plan.dependentCounts.mapel;

      await tx.delete(tenantSettings).where(eq(tenantSettings.tenantId, cleanTenantId));
      deletedCounts.settings = plan.dependentCounts.settings;

      // 5.2 Delete the core Tenant row (Cascades to user_tenant_memberships, tenant_roles, academic_*)
      const tenantDel = await tx.delete(tenants).where(eq(tenants.id, cleanTenantId));
      deletedCounts.tenant = 1;

      // 5.3 Database Purge of Orphaned User Identities (if enabled)
      if (shouldPurgeOrphans && purgeCandidates.length > 0) {
        for (const candidate of purgeCandidates) {
          // Double check within transaction that user has zero surviving memberships
          const survivingCheck = await tx
            .select({ val: count() })
            .from(userTenantMemberships)
            .where(eq(userTenantMemberships.userId, candidate.userId));

          const survivingCount = Number(survivingCheck[0]?.val || 0);

          const platformCheck = await tx
            .select({ val: count() })
            .from(userPlatformRoles)
            .where(eq(userPlatformRoles.userId, candidate.userId));

          const platformCount = Number(platformCheck[0]?.val || 0);

          if (survivingCount === 0 && platformCount === 0 && !candidate.isProtectedUser) {
            // Safe to delete from public.users
            await tx.delete(users).where(eq(users.id, candidate.userId));
            purgedUsers.push({
              userId: candidate.userId,
              email: candidate.email,
              dbDeleted: true,
              authDeleted: false,
            });
          } else {
            retainedUsers.push({
              userId: candidate.userId,
              email: candidate.email,
              reason: 'Surviving relation detected during transactional verification',
            });
          }
        }
      }
    });

    // 6. SUPABASE AUTH DELETION (Post-Commit Finalization)
    if (purgedUsers.length > 0) {
      for (const purged of purgedUsers) {
        try {
          if (supabaseAdminClient?.auth?.admin?.deleteUser) {
            const authRes = await supabaseAdminClient.auth.admin.deleteUser(purged.userId);
            if (authRes.error) {
              purged.authDeleted = false;
              purged.error = authRes.error.message;
              console.warn(
                `[TenantHardDeleteService] Warning: Supabase Auth delete failed for user ${purged.userId} (${purged.email}):`,
                authRes.error
              );
            } else {
              purged.authDeleted = true;
            }
          } else {
            // Mock or offline test mode
            purged.authDeleted = true;
          }
        } catch (authErr: any) {
          purged.authDeleted = false;
          purged.error = authErr?.message || 'Unknown auth deletion error';
          console.warn(
            `[TenantHardDeleteService] Exception during Supabase Auth delete for user ${purged.userId}:`,
            authErr
          );
        }
      }
    }

    // 7. AUDIT LOGGING
    let auditLogId: string | undefined;
    try {
      auditLogId = await auditLogService.log(
        {
          action: 'delete',
          entityType: 'tenant',
          entityId: plan.tenantId,
          entityLabel: `Tenant '${plan.tenantName}' (${plan.tenantCode})`,
          actorId: actor.userId,
          actorName: actor.name || 'Super Admin',
          actorRole: actor.role || 'SUPER_ADMIN',
          metadata: {
            tenantCode: plan.tenantCode,
            tenantSlug: plan.tenantSlug,
            deletedCounts,
            purgedUsersCount: purgedUsers.length,
            purgedUserIds: purgedUsers.map((u) => u.userId),
            retainedUsersCount: retainedUsers.length,
            retainedUserIds: retainedUsers.map((u) => u.userId),
            confirmationCode: options.confirmationCode,
          },
        },
        { tenantId: 'default' }
      );
    } catch (auditErr) {
      console.warn('[TenantHardDeleteService] Non-blocking audit log error:', auditErr);
    }

    return {
      success: true,
      tenantId: plan.tenantId,
      tenantCode: plan.tenantCode,
      tenantName: plan.tenantName,
      deletedCounts,
      purgedUsers,
      retainedUsers,
      auditLogId,
      executedAt: new Date().toISOString(),
    };
  }
}

export const tenantHardDeleteService = new TenantHardDeleteService();
