import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { santri } from '@/lib/db/schema';
import { requirePermission } from '@/lib/authz/authorization-service';
import { findOrCreateWaliAccount, linkWaliToSantri, WaliInput } from '@/modules/wali/services/wali-service';

export interface CreateSantriInput {
  nis: string;
  name: string;
  asrama: string;
  kamar: string;
  kelas: string;
  gender: 'L' | 'P';
  asalKota: string;
  asalProvinsi: string;
  angkatanMasuk: number;
  photoUrl?: string;
}

export async function createSantriWithWali(
  tenantId: string,
  santriData: CreateSantriInput,
  waliData: WaliInput,
  creatorUserId: string,
  dbInstance = db
) {
  // 1. Enforce RBAC Permission (manage_santri)
  const authz = await requirePermission(creatorUserId, tenantId, 'manage_santri', dbInstance);
  if (!authz.authorized) {
    throw new Error(`Permission denied: ${authz.reason}`);
  }

  // 2. Validate NIS uniqueness within tenant
  const existingNis = await dbInstance
    .select({ id: santri.id })
    .from(santri)
    .where(and(eq(santri.tenantId, tenantId), eq(santri.nis, santriData.nis)))
    .limit(1);

  if (existingNis.length > 0) {
    throw new Error(`NIS ${santriData.nis} sudah terdaftar pada lembaga ini.`);
  }

  // 3. Create Santri Entity
  const santriId = `santri_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const joinDate = new Date().toISOString().split('T')[0];

  // 4. Resolve / Reconcile Wali Account (1 Wali = 1 User Account)
  const { waliUserId, isNewAccount } = await findOrCreateWaliAccount(tenantId, waliData, dbInstance);

  await dbInstance.insert(santri).values({
    id: santriId,
    tenantId,
    nis: santriData.nis,
    name: santriData.name,
    asrama: santriData.asrama,
    kamar: santriData.kamar,
    kelas: santriData.kelas,
    gender: santriData.gender,
    status: 'Aktif',
    photoUrl: santriData.photoUrl || null,
    waliId: waliUserId,
    waliName: waliData.name,
    waliPhone: waliData.phone,
    joinDate,
    asalKota: santriData.asalKota,
    asalProvinsi: santriData.asalProvinsi,
    angkatanMasuk: santriData.angkatanMasuk,
  });

  // 5. Establish canonical Wali-Santri Relationship link
  const relationshipId = await linkWaliToSantri(
    tenantId,
    waliUserId,
    santriId,
    waliData.relationshipType || 'AYAH',
    waliData.isPrimary ?? true,
    dbInstance
  );

  return {
    santriId,
    waliUserId,
    relationshipId,
    isNewWaliAccount: isNewAccount,
  };
}

export async function updateSantriProfile(
  tenantId: string,
  santriId: string,
  data: Partial<CreateSantriInput>,
  updaterUserId: string,
  dbInstance = db
) {
  const authz = await requirePermission(updaterUserId, tenantId, 'manage_santri', dbInstance);
  if (!authz.authorized) {
    throw new Error(`Permission denied: ${authz.reason}`);
  }

  await dbInstance
    .update(santri)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(santri.id, santriId), eq(santri.tenantId, tenantId)));

  return { success: true };
}
