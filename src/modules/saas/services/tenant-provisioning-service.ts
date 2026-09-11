// ========================================
// SaaS Tenant Provisioning Service
// Canonical Multi-Tenant & Auth Provisioning Engine
// Traceability: WP-TENANT-PROVISION-002
// ========================================

import crypto from 'crypto';
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
  initialPassword?: string;
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
  subdomain: string;
  location: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  plan?: string; // Optional: Deferred to WP-SAAS-SUB-001 (no canonical schema column)
  status: 'aktif' | 'trial' | 'suspended';
  santriCount: number;
  createdAt: string;
  modules?: { // Optional: Deferred to WP-SAAS-ADDON-001 (no canonical schema column)
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
    temporaryPassword: string; // Returned ONCE for UI handoff
    mustChangePassword: true;
    loginUrl: string;
  };
  error?: string;
}

/**
 * Generates a cryptographically strong, high-entropy temporary password.
 * 
 * Construction details:
 * - Prefix: 'Md#' (3 chars: uppercase, lowercase, special)
 * - Random entropy: 12 bytes encoded via base64url (16 chars: alphanumeric, -, _)
 * - Suffix: '9!' (2 chars: digit, special)
 * Total length: exactly 21 characters.
 * 
 * Satisfies standard enterprise password complexity (uppercase, lowercase, digits, special characters).
 */
export function generateSecureTemporaryPassword(): string {
  const randomChars = crypto.randomBytes(12).toString('base64url');
  return `Md#${randomChars}9!`;
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
 * Atomically provisions a new Tenant and its primary Administrator.
 *
 * Implements Two-Phase Compensating Orchestration:
 * Phase 1: Create Supabase Auth User via Service Role Admin.
 * Phase 2: Execute PostgreSQL transaction across tenants, tenant_settings, users, tenant_roles, user_tenant_memberships.
 * Compensation: If Phase 2 fails, automatically delete the created Auth user to prevent orphan records.
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

  // 3. Credential Preparation
  const temporaryPassword = input.initialPassword && input.initialPassword.length >= 8
    ? input.initialPassword
    : generateSecureTemporaryPassword();

  const tenantId = `t_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const candidateDomain = `${cleanSlug}.madev.id`;
  const supabaseAdmin = createAdminClient();

  let createdAuthUserId: string | null = null;

  // 4. Phase 1: Supabase Auth User Creation
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: temporaryPassword,
      email_confirm: true, // Mark confirmed for immediate accessibility
      user_metadata: {
        name: cleanOwnerName,
        role: 'admin',
        tenant_id: tenantId,
        tenant_slug: cleanSlug,
      },
      app_metadata: {
        role: 'admin',
        tenant_id: tenantId,
        tenant_slug: cleanSlug,
      },
    });

    if (authError || !authData.user) {
      const msg = authError?.message || 'Gagal mendaftarkan akun di Supabase Auth.';
      const err = new Error(`Auth Provisioning Error: ${msg}`);
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        (err as unknown as { statusCode: number }).statusCode = 409;
      }
      throw err;
    }

    createdAuthUserId = authData.user.id;
  } catch (authErr: unknown) {
    const message = authErr instanceof Error ? authErr.message : 'Kesalahan pada sistem autentikasi server.';
    const statusCode = (authErr as { statusCode?: number })?.statusCode || 500;
    const err = new Error(message);
    (err as unknown as { statusCode: number }).statusCode = statusCode;
    throw err;
  }

  // 5. Phase 2: PostgreSQL Atomic Transaction & Compensation Safeguard
  try {
    const authUserId = createdAuthUserId;

    await withTenantTransaction(
      tenantId,
      async (tx) => {
        // A. Insert into tenants
        await tx.insert(tenants).values({
          id: tenantId,
          name: cleanName,
          slug: cleanSlug,
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
          loginSubtitle: cleanLocation || 'Malang',
          loginDescription: `Platform tata kelola santri, pemantauan karakter, dan manajemen terpadu ${cleanName}.`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // C. Insert into public.users (auth.users.id === public.users.id)
        await tx.insert(users).values({
          id: authUserId,
          name: cleanOwnerName,
          email: cleanEmail,
          phone: cleanPhone,
          status: 'MUST_CHANGE_PASSWORD',
          tenantId, // Legacy compatibility column
          role: 'admin', // Legacy role compatibility column
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

        // E. Insert into user_tenant_memberships
        const membershipId = `utm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await tx.insert(userTenantMemberships).values({
          id: membershipId,
          userId: authUserId,
          tenantId,
          primaryRoleId: adminRoleId,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      },
      { isSuperAdmin: true, tenantSlug: cleanSlug, dbInstance }
    );

    // 6. Audit Logging (Zero-Secret Policy: Password NEVER logged)
    try {
      await auditLogService.log({
        actorId: actor.userId,
        actorName: actor.name || 'Super Admin',
        actorRole: 'super_admin',
        entityType: 'tenant',
        entityId: tenantId,
        action: 'provision',
        metadata: {
          tenantName: cleanName,
          tenantSlug: cleanSlug,
          ownerEmail: cleanEmail,
          plan: cleanPlan,
          authUserId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditError) {
      console.warn('[Tenant Provisioning] Warning: Failed to record audit log:', auditError);
    }

    // 7. Successful Provisioning Response
    const createdAtStr = new Date().toISOString().split('T')[0];
    return {
      success: true,
      status: 'PROVISIONED',
      tenant: {
        id: tenantId,
        name: cleanName,
        slug: cleanSlug,
        domain: candidateDomain,
        location: cleanLocation || 'Indonesia',
        plan: cleanPlan,
        status: 'aktif',
        createdAt: createdAtStr,
      },
      admin: {
        userId: authUserId,
        name: cleanOwnerName,
        email: cleanEmail,
        phone: cleanPhone,
        temporaryPassword,
        mustChangePassword: true,
        loginUrl: `https://${candidateDomain}/login`,
      },
    };
  } catch (dbError: unknown) {
    // COMPENSATION ROLLBACK
    console.error(
      `[Tenant Provisioning] Database transaction failed. Initiating compensation rollback for auth user ${createdAuthUserId}...`,
      dbError
    );

    let compensationSucceeded = false;
    try {
      const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
      if (delError) {
        console.error(`[Tenant Provisioning CRITICAL] Compensation deleteUser failed for ${createdAuthUserId}:`, delError);
      } else {
        compensationSucceeded = true;
        console.info(`[Tenant Provisioning] Compensation rollback successful. Deleted orphan auth user ${createdAuthUserId}.`);
      }
    } catch (compException) {
      console.error(
        `[Tenant Provisioning CRITICAL] Exception during compensation deleteUser for ${createdAuthUserId}:`,
        compException
      );
    }

    const finalStatus = compensationSucceeded ? 'PROVISIONING_FAILED' : 'PROVISIONING_COMPENSATION_FAILED';

    const safeMessage = compensationSucceeded
      ? 'Terjadi kesalahan sistem saat menyimpan data tenant ke database. Akun administrator telah dibersihkan secara otomatis.'
      : 'Terjadi kegagalan sistem kritis saat memprovisi tenant dan proses pembersihan akun administrator otomatis gagal.';

    const compensationErr = new Error(safeMessage);
    (compensationErr as unknown as { status: string; statusCode: number }).status = finalStatus;
    (compensationErr as unknown as { statusCode: number }).statusCode = 500;
    throw compensationErr;
  }
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
      subdomain: t.domain || `${t.slug}.madev.id`,
      location: settings?.loginSubtitle || 'Indonesia',
      ownerName: adminMembership?.userName || 'Admin Pesantren',
      ownerEmail: adminMembership?.userEmail || '-',
      ownerPhone: adminMembership?.userPhone || '-',
      plan: undefined, // Plan persistence is deferred to WP-SAAS-SUB-001 (no canonical schema column)
      status: uiStatus,
      santriCount: 0,
      createdAt: t.createdAt
        ? new Date(t.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      modules: undefined, // Module/feature flags are deferred to WP-SAAS-ADDON-001 (no canonical schema column)
    });
  }

  return results;
}

export const tenantProvisioningService = {
  checkTenantAvailability,
  provisionTenant,
  listActiveTenants,
};
