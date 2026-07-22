import { db } from '../index';
import { healthVisits, healthPermissions, gdriveDocuments } from '../schema';
import { eq } from 'drizzle-orm';
import { uploadToDrive } from '@/lib/gdrive';

// ── Health Visits ───────────────────────────────────────────────────────────
export async function getHealthVisits() {
  return await db.select().from(healthVisits);
}

export async function createHealthVisit(data: typeof healthVisits.$inferInsert) {
  const inserted = await db.insert(healthVisits).values(data).returning();
  return inserted[0];
}

// ── Health Permissions (Surat Izin Berobat) ─────────────────────────────────
export async function getHealthPermissions() {
  return await db.select().from(healthPermissions);
}

export async function createHealthPermissionWithDoc(
  data: typeof healthPermissions.$inferInsert,
  file?: { fileName: string; mimeType: string; buffer: Buffer }
) {
  let gdriveFileId: string | undefined;

  if (file) {
    const driveResult = await uploadToDrive({
      fileName: file.fileName,
      mimeType: file.mimeType,
      buffer: file.buffer,
    });
    gdriveFileId = driveResult.fileId;

    await db.insert(gdriveDocuments).values({
      id: crypto.randomUUID(),
      fileId: driveResult.fileId,
      fileName: driveResult.fileName,
      mimeType: file.mimeType,
      webViewLink: driveResult.webViewLink,
      category: 'uks_perm',
      relatedEntity: 'health_permissions',
      relatedId: data.id,
      uploadedBy: data.santriName,
    });
  }

  const inserted = await db
    .insert(healthPermissions)
    .values({
      ...data,
      gdriveFileId: gdriveFileId || data.gdriveFileId,
    })
    .returning();

  return inserted[0];
}
