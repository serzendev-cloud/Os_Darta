import { db } from '../index';
import { pelanggaran, gdriveDocuments } from '../schema';
import { eq } from 'drizzle-orm';
import { uploadToDrive, deleteFromDrive } from '@/lib/gdrive';

export async function getPelanggaranList() {
  return await db.select().from(pelanggaran);
}

export async function getPelanggaranBySantri(santriId: string) {
  return await db.select().from(pelanggaran).where(eq(pelanggaran.santriId, santriId));
}

export async function createPelanggaranWithAttachment(
  data: typeof pelanggaran.$inferInsert,
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

    // Catat ke gdrive_documents registry
    await db.insert(gdriveDocuments).values({
      id: crypto.randomUUID(),
      fileId: driveResult.fileId,
      fileName: driveResult.fileName,
      mimeType: file.mimeType,
      webViewLink: driveResult.webViewLink,
      category: 'bukti_hukuman',
      relatedEntity: 'pelanggaran',
      relatedId: data.id,
      uploadedBy: data.reportedBy,
    });
  }

  const inserted = await db
    .insert(pelanggaran)
    .values({
      ...data,
      gdriveFileId: gdriveFileId || data.gdriveFileId,
    })
    .returning();

  return inserted[0];
}

export async function deletePelanggaran(id: string) {
  const item = (await db.select().from(pelanggaran).where(eq(pelanggaran.id, id)))[0];
  if (item?.gdriveFileId) {
    try {
      await deleteFromDrive(item.gdriveFileId);
      await db.delete(gdriveDocuments).where(eq(gdriveDocuments.fileId, item.gdriveFileId));
    } catch (err) {
      console.warn('Gagal menghapus file Google Drive:', err);
    }
  }
  await db.delete(pelanggaran).where(eq(pelanggaran.id, id));
  return true;
}
