import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  users,
  tenantRoles,
  userTenantMemberships,
  waliSantriRelationships,
  santri,
} from '@/lib/db/schema';

export interface WaliInput {
  name: string;
  phone: string;
  relationshipType?: string;
  isPrimary?: boolean;
}

/**
 * Normalizes phone numbers to standard digit format.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return `62${digits.substring(1)}`;
  }
  return digits;
}

/**
 * Finds an existing Wali user account by phone number, or creates a new one.
 * Canonical Rule: 1 Wali = 1 Platform User Account (Multi-child).
 */
export async function findOrCreateWaliAccount(
  tenantId: string,
  input: WaliInput,
  dbInstance = db
): Promise<{ waliUserId: string; isNewAccount: boolean }> {
  const phone = normalizePhone(input.phone);

  // 1. Duplicate detection: Search existing user by phone
  const existingUsers = await dbInstance
    .select({ id: users.id, name: users.name, phone: users.phone })
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);

  if (existingUsers.length > 0) {
    const existingWali = existingUsers[0];

    // Ensure tenant membership exists for this tenant
    const existingMemberships = await dbInstance
      .select({ id: userTenantMemberships.id })
      .from(userTenantMemberships)
      .where(
        and(
          eq(userTenantMemberships.userId, existingWali.id),
          eq(userTenantMemberships.tenantId, tenantId)
        )
      )
      .limit(1);

    if (existingMemberships.length === 0) {
      // Find or create default WALI tenant role
      let waliRole = (
        await dbInstance
          .select({ id: tenantRoles.id })
          .from(tenantRoles)
          .where(and(eq(tenantRoles.tenantId, tenantId), eq(tenantRoles.roleCode, 'WALI')))
          .limit(1)
      )[0];

      if (!waliRole) {
        const newRoleId = `role_wali_${tenantId}`;
        await dbInstance.insert(tenantRoles).values({
          id: newRoleId,
          tenantId,
          roleCode: 'WALI',
          name: 'Wali Santri',
          description: 'Orang tua / Wali Santri',
          isCustom: false,
          status: 'ACTIVE',
        });
        waliRole = { id: newRoleId };
      }

      await dbInstance.insert(userTenantMemberships).values({
        id: `utm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: existingWali.id,
        tenantId,
        primaryRoleId: waliRole.id,
        status: 'ACTIVE',
      });
    }

    return { waliUserId: existingWali.id, isNewAccount: false };
  }

  // 2. New Wali Account Provisioning
  const newWaliUserId = `user_wali_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const fakeEmail = `wali.${phone}@mahad.sch.id`;

  await dbInstance.insert(users).values({
    id: newWaliUserId,
    name: input.name,
    email: fakeEmail,
    phone,
    status: 'MUST_CHANGE_PASSWORD',
    tenantId,
    role: 'wali',
  });

  // Find or create WALI tenant role
  let waliRole = (
    await dbInstance
      .select({ id: tenantRoles.id })
      .from(tenantRoles)
      .where(and(eq(tenantRoles.tenantId, tenantId), eq(tenantRoles.roleCode, 'WALI')))
      .limit(1)
  )[0];

  if (!waliRole) {
    const newRoleId = `role_wali_${tenantId}`;
    await dbInstance.insert(tenantRoles).values({
      id: newRoleId,
      tenantId,
      roleCode: 'WALI',
      name: 'Wali Santri',
      description: 'Orang tua / Wali Santri',
      isCustom: false,
      status: 'ACTIVE',
    });
    waliRole = { id: newRoleId };
  }

  await dbInstance.insert(userTenantMemberships).values({
    id: `utm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: newWaliUserId,
    tenantId,
    primaryRoleId: waliRole.id,
    status: 'ACTIVE',
  });

  return { waliUserId: newWaliUserId, isNewAccount: true };
}

/**
 * Links a Wali user account to a Santri entity via wali_santri_relationships.
 */
export async function linkWaliToSantri(
  tenantId: string,
  waliUserId: string,
  santriId: string,
  relationshipType = 'AYAH',
  isPrimary = true,
  dbInstance = db
): Promise<string> {
  const existingRows = await dbInstance
    .select({ id: waliSantriRelationships.id, status: waliSantriRelationships.status })
    .from(waliSantriRelationships)
    .where(
      and(
        eq(waliSantriRelationships.tenantId, tenantId),
        eq(waliSantriRelationships.waliUserId, waliUserId),
        eq(waliSantriRelationships.santriId, santriId)
      )
    )
    .limit(1);

  if (existingRows.length > 0) {
    const existing = existingRows[0];
    if (existing.status !== 'ACTIVE') {
      await dbInstance
        .update(waliSantriRelationships)
        .set({ status: 'ACTIVE', relationshipType, isPrimary, updatedAt: new Date() })
        .where(eq(waliSantriRelationships.id, existing.id));
    }
    return existing.id;
  }

  const relationshipId = `wsr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await dbInstance.insert(waliSantriRelationships).values({
    id: relationshipId,
    tenantId,
    waliUserId,
    santriId,
    relationshipType,
    isPrimary,
    status: 'ACTIVE',
  });

  return relationshipId;
}

/**
 * Retrieves all active children for a Wali user within a target tenant.
 */
export async function getSantriForWali(
  tenantId: string,
  waliUserId: string,
  dbInstance = db
) {
  return await dbInstance
    .select({
      relationshipId: waliSantriRelationships.id,
      relationshipType: waliSantriRelationships.relationshipType,
      isPrimary: waliSantriRelationships.isPrimary,
      santriId: santri.id,
      nis: santri.nis,
      name: santri.name,
      kelas: santri.kelas,
      asrama: santri.asrama,
      status: santri.status,
    })
    .from(waliSantriRelationships)
    .innerJoin(santri, eq(waliSantriRelationships.santriId, santri.id))
    .where(
      and(
        eq(waliSantriRelationships.tenantId, tenantId),
        eq(waliSantriRelationships.waliUserId, waliUserId),
        eq(waliSantriRelationships.status, 'ACTIVE')
      )
    );
}

/**
 * Revokes a Wali-Santri relationship.
 */
export async function revokeWaliSantriRelationship(
  tenantId: string,
  waliUserId: string,
  santriId: string,
  dbInstance = db
): Promise<void> {
  await dbInstance
    .update(waliSantriRelationships)
    .set({ status: 'REVOKED', updatedAt: new Date() })
    .where(
      and(
        eq(waliSantriRelationships.tenantId, tenantId),
        eq(waliSantriRelationships.waliUserId, waliUserId),
        eq(waliSantriRelationships.santriId, santriId)
      )
    );
}
