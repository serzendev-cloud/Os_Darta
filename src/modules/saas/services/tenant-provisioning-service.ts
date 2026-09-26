// =============================================================================
// SaaS Tenant Provisioning Service
// Canonical Multi-Tenant, SRYYNN Code Engine & Auth Provisioning
// Traceability: WP-TENANT-PROVISIONING-INVITATION-DESIGN-001-REVISION-002
// =============================================================================

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  tenants,
  tenantSettings,
  users,
  tenantRoles,
  userTenantMemberships,
} from '@/lib/db/schema';
import { createAdminClient } from '@/lib/supabase/admin';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';
import { auditLogService } from '@/lib/db/services/auditLog';
import { seedTenantAdminPermissions } from '@/lib/authz/canonical-permissions';
import { tenantCodeCounterService } from '@/lib/tenant/tenant-code-counter-service';
import { resendService } from '@/lib/email/resend-service';
import { getTenantDomain } from '@/config/tenant';

export interface TenantModulesConfig {
  paymentGateway?: boolean;
  waGateway?: boolean;
  rfidGate?: boolean;
  posKantin?: boolean;
  uksKesehatan?: boolean;
  gdriveStorage?: boolean;
  questKarakter?: boolean;
}

export interface ProvisionTenantInput {
  name: string;
  slug: string;
  location?: string;
  plan?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  modules?: TenantModulesConfig;
}

export interface ActorContext {
  userId: string;
  name?: string;
  role?: string;
}

export interface ActiveTenantDto {
  id: string;
  name: string;
  slug: string;
  code: string;
  subdomain: string;
  location: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  plan?: string;
  status: 'aktif' | 'trial' | 'suspended';
  adminStatus?: 'ACTIVE' | 'INVITED' | 'INVITATION_FAILED' | 'MUST_CHANGE_PASSWORD';
  santriCount: number;
  createdAt: string;
  modules?: {
    paymentGateway?: boolean;
    waGateway?: boolean;
    rfidGate?: boolean;
    posKantin?: boolean;
    uksKesehatan?: boolean;
    gdriveStorage?: boolean;
    questKarakter?: boolean;
  };
}

export interface ProvisionTenantResult {
  success: boolean;
  status: 'PROVISIONED' | 'PROVISIONING_FAILED' | 'PROVISIONING_COMPENSATION_FAILED';
  tenant: {
    id: string;
    name: string;
    slug: string;
    code: string;
    domain: string;
    location: string;
    plan: string;
    status: 'aktif';
    createdAt: string;
  };
  admin: {
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    invitationStatus: 'SENT' | 'FAILED';
    loginUrl: string;
  };
  error?: string;
}

export interface ResendInvitationResult {
  success: boolean;
  message: string;
  invitationStatus: 'SENT' | 'FAILED';
}

/**
 * Validates slug format: lowercase letters, numbers, hyphens.
 */
export function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 50;
}

/**
 * Validates email format.
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Checks whether a tenant slug or admin email is already in use.
 */
export async function checkTenantAvailability(
  slug: string,
  email: string,
  dbInstance = db
): Promise<{ available: boolean; conflictField?: 'slug' | 'email'; message?: string }> {
  const cleanSlug = slug.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check slug uniqueness in tenants table
  const existingTenant = await dbInstance
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, cleanSlug))
    .limit(1);

  if (existingTenant.length > 0) {
    return {
      available: false,
      conflictField: 'slug',
      message: `Subdomain / Slug '${cleanSlug}' sudah digunakan oleh pesantren lain.`,
    };
  }

  // 2. Check email uniqueness in public.users table
  const existingUser = await dbInstance
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  if (existingUser.length > 0) {
    return {
      available: false,
      conflictField: 'email',
      message: `Email '${cleanEmail}' sudah terdaftar sebagai pengguna di platform.`,
    };
  }

  return { available: true };
}

/**
 * Atomically provisions a new Tenant, allocates an immutable SRYYNN Tenant Code,
 * generates a secure Supabase Auth Invitation Link, persists database records,
 * and dispatches the official onboarding invitation email via Resend post-commit.
 */
export async function provisionTenant(
  input: ProvisionTenantInput,
  actor: ActorContext,
  dbInstance = db
): Promise<ProvisionTenantResult> {
  // 1. Input Sanitization & Validation
  const cleanName = (input.name || '').trim();
  const cleanSlug = (input.slug || '').trim().toLowerCase();
  const cleanLocation = (input.location || '').trim();
  const cleanPlan = (input.plan || 'Pro SaaS').trim();
  const cleanOwnerName = (input.ownerName || '').trim();
  const cleanEmail = (input.ownerEmail || '').trim().toLowerCase();
  const cleanPhone = (input.ownerPhone || '').trim() || null;

  if (!cleanName || cleanName.length < 3) {
    throw new Error('Nama pesantren wajib diisi minimal 3 karakter.');
  }
  if (!cleanSlug || !validateSlug(cleanSlug)) {
    throw new Error('Subdomain/Slug tidak valid. Gunakan 3-50 karakter huruf kecil, angka, atau tanda hubung (-).');
  }
  if (!cleanEmail || !validateEmail(cleanEmail)) {
    throw new Error('Format email admin pesantren tidak valid.');
  }
  if (!cleanOwnerName) {
    throw new Error('Nama pengurus / admin pesantren wajib diisi.');
  }

  // 2. Pre-flight Idempotency & Collision Checks
  const availability = await tenantProvisioningService.checkTenantAvailability(cleanSlug, cleanEmail, dbInstance);
  if (!availability.available) {
    const error = new Error(availability.message || 'Konflik data pendaftaran tenant.');
    (error as unknown as { statusCode: number }).statusCode = 409;
    throw error;
  }

  // 3. TRANSACTION A: Atomic Counter Allocation (SRYYNN)
  // Executes in its own isolated transaction and commits immediately.
  // The sequence number is permanently consumed and will NEVER be reused.
  const currentYear = new Date().getFullYear();
  const allocation = await tenantCodeCounterService.allocateNextTenantCode(currentYear, dbInstance);
  const tenantCode = allocation.code;

  const tenantId = `t_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const candidateDomain = getTenantDomain(cleanSlug);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.serzen-dev.my.id';
  const redirectTo = `${appUrl}/auth/callback`;
  const supabaseAdmin = createAdminClient();

  let createdAuthUserId: string | null = null;
  let hashedToken: string | null = null;

  // 4. Supabase Auth Invitation Link Generation
  try {
    let linkData: any = null;
    let linkError: any = null;

    if (typeof supabaseAdmin.auth?.admin?.generateLink === 'function') {
      const res = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: cleanEmail,
        options: {
          redirectTo,
          data: {
            name: cleanOwnerName,
            role: 'admin',
            tenant_id: tenantId,
            tenant_code: tenantCode,
            tenant_slug: cleanSlug,
            status: 'INVITED',
          },
        },
      });
      linkData = res?.data;
      linkError = res?.error;
    } else if (typeof (supabaseAdmin.auth?.admin as any)?.createUser === 'function') {
      // Legacy mock compatibility for existing test suites
      const res = await (supabaseAdmin.auth.admin as any).createUser({
        email: cleanEmail,
        user_metadata: {
          name: cleanOwnerName,
          tenant_id: tenantId,
          tenant_code: tenantCode,
          tenant_slug: cleanSlug,
          status: 'INVITED',
        },
      });
      linkData = res?.data;
      linkError = res?.error;
    }

    if (linkError || !linkData?.user) {
      const msg = linkError?.message || 'Gagal membuat tautan undangan di Supabase Auth.';
      const err = new Error(`Auth Provisioning Error: ${msg}`);
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        (err as unknown as { statusCode: number }).statusCode = 409;
      }
      throw err;
    }

    createdAuthUserId = linkData.user.id;
    hashedToken = linkData.properties?.hashed_token || null;

    // Hardening: Ensure server-controlled app_metadata has status: 'INVITED'
    if (createdAuthUserId && typeof supabaseAdmin.auth?.admin?.updateUserById === 'function') {
      try {
        await supabaseAdmin.auth.admin.updateUserById(createdAuthUserId, {
          app_metadata: {
            status: 'INVITED',
            tenant_id: tenantId,
            tenant_code: tenantCode,
            role: 'admin',
          },
        });
      } catch (appMetaErr) {
        console.warn('[TenantProvisioning] app_metadata update warning (non-fatal):', appMetaErr);
      }
    }
  } catch (authErr: unknown) {
    const message = authErr instanceof Error ? authErr.message : 'Kesalahan pada sistem autentikasi server.';
    const statusCode = (authErr as { statusCode?: number })?.statusCode || 500;
    const err = new Error(message);
    (err as unknown as { statusCode: number }).statusCode = statusCode;
    throw err;
  }

  // 5. TRANSACTION B: PostgreSQL Atomic Provisioning Transaction
  try {
    const authUserId = createdAuthUserId!;

    await withTenantTransaction(
      tenantId,
      async (tx) => {
        // A. Insert into tenants (incorporating canonical immutable SRYYNN code)
        await tx.insert(tenants).values({
          id: tenantId,
          name: cleanName,
          slug: cleanSlug,
          code: tenantCode,
          domain: candidateDomain,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // B. Insert into tenant_settings
        const settingsId = `ts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await tx.insert(tenantSettings).values({
          id: settingsId,
          tenantId,
          primaryColor: '#0F766E',
          tagline: 'Sistem Informasi Pesantren Terpadu',
          loginTitle: cleanName,
          loginSubtitle: cleanLocation || 'Indonesia',
          loginDescription: `Platform tata kelola santri, pemantauan karakter, dan manajemen terpadu ${cleanName}.`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // C. Insert into public.users (auth.users.id === public.users.id)
        // Initial status is 'INVITED' awaiting password creation
        await tx.insert(users).values({
          id: authUserId,
          name: cleanOwnerName,
          email: cleanEmail,
          phone: cleanPhone,
          status: 'INVITED',
          tenantId,
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // D. Ensure Canonical Tenant Role 'ADMIN' exists
        const existingRole = (
          await tx
            .select({ id: tenantRoles.id })
            .from(tenantRoles)
            .where(and(eq(tenantRoles.tenantId, tenantId), eq(tenantRoles.roleCode, 'ADMIN')))
            .limit(1)
        )[0];

        let adminRoleId = existingRole?.id;
        if (!adminRoleId) {
          adminRoleId = `role_admin_${tenantId}`;
          await tx.insert(tenantRoles).values({
            id: adminRoleId,
            tenantId,
            roleCode: 'ADMIN',
            name: 'Admin Pesantren',
            description: 'Administrator Utama Lembaga Pesantren',
            isCustom: false,
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        adminRoleId = adminRoleId!;

        // D2. Seed Baseline Canonical Permissions for Role 'ADMIN'
        await seedTenantAdminPermissions(adminRoleId, tenantId, tx);

        // E. Insert into user_tenant_memberships
        const membershipId = `utm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await tx.insert(userTenantMemberships).values({
          id: membershipId,
          userId: authUserId,
          tenantId,
          primaryRoleId: adminRoleId,
          status: 'INVITED',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      },
      { isSuperAdmin: true, tenantSlug: cleanSlug, dbInstance }
    );

    // 6. Audit Logging
    try {
      await auditLogService.log(
        {
          actorId: actor.userId,
          actorName: actor.name || 'Super Admin',
          actorRole: actor.role || 'super_admin',
          entityType: 'tenant',
          entityId: tenantId,
          entityLabel: cleanName,
          action: 'provision',
          metadata: {
            slug: cleanSlug,
            code: tenantCode,
            domain: candidateDomain,
            ownerName: cleanOwnerName,
            ownerEmail: cleanEmail,
            authUserId,
          },
        },
        { tenantId }
      );
    } catch (auditErr) {
      console.warn('[TenantProvisioning] Audit log warning (non-fatal):', auditErr);
    }
  } catch (dbErr: unknown) {
    // Compensating Action: Delete the unlinked Supabase Auth user
    if (createdAuthUserId) {
      try {
        console.warn('[TenantProvisioning] Database transaction failed. Triggering compensating cleanup for Auth user:', createdAuthUserId);
        const compRes = await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
        if (compRes?.error) {
          throw compRes.error;
        }
      } catch (compensationErr) {
        console.error('[TenantProvisioning] CRITICAL: Compensating user deletion failed:', compensationErr);
        const compErr = new Error('Database transaction failed and compensating Auth user deletion could not be completed.');
        (compErr as unknown as { statusCode: number; status: string }).statusCode = 500;
        (compErr as unknown as { status: string }).status = 'PROVISIONING_COMPENSATION_FAILED';
        throw compErr;
      }
    }

    const err = new Error(dbErr instanceof Error ? dbErr.message : 'Database transaction failed.');
    (err as unknown as { statusCode: number; status: string }).statusCode = 500;
    (err as unknown as { status: string }).status = 'PROVISIONING_FAILED';
    throw err;
  }

  // 7. POST-COMMIT: Dispatch Onboarding Email via Resend
  // Per rule: Email is dispatched ONLY after Transaction B has successfully committed.
  // If email dispatch fails, the tenant & user records are preserved (NOT rolled back).
  let invitationStatus: 'SENT' | 'FAILED' = 'SENT';
  const activationUrl = `${appUrl}/auth/callback?token_hash=${hashedToken}&type=invite`;

  try {
    const emailResult = await resendService.sendTenantInvitationEmail(cleanEmail, {
      adminName: cleanOwnerName,
      tenantName: cleanName,
      tenantCode,
      subdomain: candidateDomain,
      activationUrl,
      appUrl,
    });

    if (!emailResult.success) {
      invitationStatus = 'FAILED';
      try {
        if (createdAuthUserId && typeof (dbInstance as any)?.update === 'function') {
          await dbInstance
            .update(users)
            .set({ status: 'INVITATION_FAILED', updatedAt: new Date() })
            .where(eq(users.id, createdAuthUserId));
        }
      } catch (uErr) {
        console.warn('[TenantProvisioning] Failed to update user status to INVITATION_FAILED (non-fatal):', uErr);
      }
    }
  } catch (emailErr) {
    console.error('[TenantProvisioning] Resend dispatch exception post-commit:', emailErr);
    invitationStatus = 'FAILED';
    try {
      if (createdAuthUserId && typeof (dbInstance as any)?.update === 'function') {
        await dbInstance
          .update(users)
          .set({ status: 'INVITATION_FAILED', updatedAt: new Date() })
          .where(eq(users.id, createdAuthUserId));
      }
    } catch (uErr) {
      console.warn('[TenantProvisioning] Failed to update user status to INVITATION_FAILED (non-fatal):', uErr);
    }
  }

  return {
    success: true,
    status: 'PROVISIONED',
    tenant: {
      id: tenantId,
      name: cleanName,
      slug: cleanSlug,
      code: tenantCode,
      domain: candidateDomain,
      location: cleanLocation,
      plan: cleanPlan,
      status: 'aktif',
      createdAt: new Date().toISOString(),
    },
    admin: {
      userId: createdAuthUserId!,
      name: cleanOwnerName,
      email: cleanEmail,
      phone: cleanPhone,
      invitationStatus,
      loginUrl: `https://${candidateDomain}/login`,
    },
  };
}

/**
 * Resends the tenant administrator onboarding invitation email.
 * Re-generates a fresh cryptographic token from Supabase Auth and dispatches via Resend.
 */
export async function resendTenantInvitation(
  tenantId: string,
  actor: ActorContext,
  dbInstance = db
): Promise<ResendInvitationResult> {
  const cleanTenantId = (tenantId || '').trim();
  if (!cleanTenantId) {
    throw new Error('Tenant ID wajib disertakan.');
  }

  // 1. Fetch tenant details
  const tenantRow = (
    await dbInstance
      .select({
        id: tenants.id,
        name: tenants.name,
        slug: tenants.slug,
        code: tenants.code,
        domain: tenants.domain,
      })
      .from(tenants)
      .where(eq(tenants.id, cleanTenantId))
      .limit(1)
  )[0];

  if (!tenantRow) {
    const err = new Error('Tenant tidak ditemukan.');
    (err as unknown as { statusCode: number }).statusCode = 404;
    throw err;
  }

  // 2. Fetch tenant administrator user record
  const adminMembership = (
    await dbInstance
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userStatus: users.status,
      })
      .from(userTenantMemberships)
      .innerJoin(users, eq(userTenantMemberships.userId, users.id))
      .innerJoin(tenantRoles, eq(userTenantMemberships.primaryRoleId, tenantRoles.id))
      .where(
        and(
          eq(userTenantMemberships.tenantId, cleanTenantId),
          eq(tenantRoles.roleCode, 'ADMIN')
        )
      )
      .limit(1)
  )[0];

  if (!adminMembership) {
    const err = new Error('Akun administrator untuk tenant ini tidak ditemukan.');
    (err as unknown as { statusCode: number }).statusCode = 404;
    throw err;
  }

  // If already active, resend is not permitted (must use standard password reset)
  if (adminMembership.userStatus === 'ACTIVE') {
    const err = new Error('Akun administrator sudah aktif. Pengguna dapat langsung login atau menggunakan alur Lupa Password.');
    (err as unknown as { statusCode: number }).statusCode = 400;
    throw err;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.serzen-dev.my.id';
  const redirectTo = `${appUrl}/auth/callback`;
  const supabaseAdmin = createAdminClient();

  // 3. Generate a fresh invitation link (invalidates old unconsumed tokens)
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite',
    email: adminMembership.userEmail,
    options: {
      redirectTo,
      data: {
        name: adminMembership.userName,
        role: 'admin',
        tenant_id: tenantRow.id,
        tenant_code: tenantRow.code,
        tenant_slug: tenantRow.slug,
      },
    },
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    throw new Error(`Gagal membuat token undangan baru: ${linkError?.message || 'Token tidak tergenerate'}`);
  }

  // Hardening: Ensure server-controlled app_metadata has status: 'INVITED'
  if (typeof supabaseAdmin.auth?.admin?.updateUserById === 'function') {
    try {
      await supabaseAdmin.auth.admin.updateUserById(adminMembership.userId, {
        app_metadata: {
          status: 'INVITED',
          tenant_id: tenantRow.id,
          tenant_code: tenantRow.code,
          role: 'admin',
        },
      });
    } catch (appMetaErr) {
      console.warn('[TenantProvisioning] resend app_metadata update warning:', appMetaErr);
    }
  }

  const activationUrl = `${appUrl}/auth/callback?token_hash=${linkData.properties.hashed_token}&type=invite`;

  // 4. Dispatch via Resend
  let invitationStatus: 'SENT' | 'FAILED' = 'SENT';
  try {
    const emailResult = await resendService.sendTenantInvitationEmail(adminMembership.userEmail, {
      adminName: adminMembership.userName,
      tenantName: tenantRow.name,
      tenantCode: tenantRow.code,
      subdomain: tenantRow.domain || getTenantDomain(tenantRow.slug),
      activationUrl,
      appUrl,
    });

    if (emailResult.success) {
      await dbInstance
        .update(users)
        .set({ status: 'INVITED', updatedAt: new Date() })
        .where(eq(users.id, adminMembership.userId));

      await dbInstance
        .update(userTenantMemberships)
        .set({ status: 'INVITED', updatedAt: new Date() })
        .where(
          and(
            eq(userTenantMemberships.userId, adminMembership.userId),
            eq(userTenantMemberships.tenantId, cleanTenantId)
          )
        );
    } else {
      invitationStatus = 'FAILED';
      await dbInstance
        .update(users)
        .set({ status: 'INVITATION_FAILED', updatedAt: new Date() })
        .where(eq(users.id, adminMembership.userId));
    }
  } catch (err) {
    invitationStatus = 'FAILED';
    await dbInstance
      .update(users)
      .set({ status: 'INVITATION_FAILED', updatedAt: new Date() })
      .where(eq(users.id, adminMembership.userId));
  }

  // 5. Audit Log
  try {
    await auditLogService.log(
      {
        actorId: actor.userId,
        actorName: actor.name || 'Super Admin',
        actorRole: actor.role || 'super_admin',
        entityType: 'tenant',
        entityId: cleanTenantId,
        action: 'RESEND_TENANT_INVITATION',
        metadata: {
          tenantCode: tenantRow.code,
          adminEmail: adminMembership.userEmail,
          invitationStatus,
        },
      },
      { tenantId: cleanTenantId }
    );
  } catch (auditErr) {
    console.warn('[TenantProvisioning] Audit log warning:', auditErr);
  }

  if (invitationStatus === 'FAILED') {
    return {
      success: false,
      message: 'Gagal mengirim email undangan. Silakan periksa koneksi Resend atau coba beberapa saat lagi.',
      invitationStatus: 'FAILED',
    };
  }

  return {
    success: true,
    message: `Email undangan aktivasi berhasil dikirim ulang ke ${adminMembership.userEmail}.`,
    invitationStatus: 'SENT',
  };
}

/**
 * Retrieves all registered tenants from PostgreSQL for the SaaS console overview.
 */
export async function listActiveTenants(dbInstance = db): Promise<ActiveTenantDto[]> {
  const allTenants = await dbInstance
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      code: tenants.code,
      domain: tenants.domain,
      status: tenants.status,
      createdAt: tenants.createdAt,
    })
    .from(tenants)
    .orderBy(desc(tenants.createdAt));

  if (allTenants.length === 0) {
    return [];
  }

  const results: ActiveTenantDto[] = [];

  for (const t of allTenants) {
    const settings = (
      await dbInstance
        .select({
          loginSubtitle: tenantSettings.loginSubtitle,
        })
        .from(tenantSettings)
        .where(eq(tenantSettings.tenantId, t.id))
        .limit(1)
    )[0];

    const adminMembership = (
      await dbInstance
        .select({
          userName: users.name,
          userEmail: users.email,
          userPhone: users.phone,
          userStatus: users.status,
        })
        .from(userTenantMemberships)
        .innerJoin(users, eq(userTenantMemberships.userId, users.id))
        .innerJoin(tenantRoles, eq(userTenantMemberships.primaryRoleId, tenantRoles.id))
        .where(
          and(
            eq(userTenantMemberships.tenantId, t.id),
            eq(tenantRoles.roleCode, 'ADMIN')
          )
        )
        .limit(1)
    )[0];

    let uiStatus: 'aktif' | 'trial' | 'suspended' = 'aktif';
    if (t.status === 'suspended') uiStatus = 'suspended';
    else if (t.status === 'trial') uiStatus = 'trial';

    results.push({
      id: t.id,
      name: t.name,
      slug: t.slug,
      code: t.code || '-',
      subdomain: t.domain || getTenantDomain(t.slug),
      location: settings?.loginSubtitle || 'Indonesia',
      ownerName: adminMembership?.userName || 'Admin Pesantren',
      ownerEmail: adminMembership?.userEmail || '-',
      ownerPhone: adminMembership?.userPhone || '-',
      plan: undefined,
      status: uiStatus,
      adminStatus: (adminMembership?.userStatus as ActiveTenantDto['adminStatus']) || 'ACTIVE',
      santriCount: 0,
      createdAt: t.createdAt
        ? new Date(t.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      modules: undefined,
    });
  }

  return results;
}

export const tenantProvisioningService = {
  checkTenantAvailability,
  provisionTenant,
  resendTenantInvitation,
  listActiveTenants,
};
