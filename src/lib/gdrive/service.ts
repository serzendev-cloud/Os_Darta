import { Readable } from 'stream';
import { getGoogleDriveClient } from './client';

export interface UploadDriveFileParams {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  folderId?: string;
}

export interface DriveFileResult {
  fileId: string;
  fileName: string;
  webViewLink?: string;
  webContentLink?: string;
}

/**
 * Mengunggah file ke Google Drive (Document DB / File Storage).
 */
export async function uploadToDrive({
  fileName,
  mimeType,
  buffer,
  folderId = process.env.GOOGLE_DRIVE_FOLDER_ID,
}: UploadDriveFileParams): Promise<DriveFileResult> {
  const drive = getGoogleDriveClient();

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const fileMetadata: Record<string, any> = {
    name: fileName,
  };

  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType,
      body: stream,
    },
    fields: 'id, name, webViewLink, webContentLink',
  });

  const data = response.data;
  if (!data.id) {
    throw new Error('Gagal mendapatkan ID file dari Google Drive.');
  }

  // Set file agar dapat dibaca publik via link (opsional sesuai kebutuhan privacy)
  try {
    await drive.permissions.create({
      fileId: data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });
  } catch (err) {
    console.warn('Gagal mengatur permission file Google Drive:', err);
  }

  return {
    fileId: data.id,
    fileName: data.name || fileName,
    webViewLink: data.webViewLink || undefined,
    webContentLink: data.webContentLink || undefined,
  };
}

/**
 * Menghapus file dari Google Drive.
 */
export async function deleteFromDrive(fileId: string): Promise<boolean> {
  const drive = getGoogleDriveClient();
  await drive.files.delete({ fileId });
  return true;
}

/**
 * Mengambil metadata file dari Google Drive.
 */
export async function getDriveFileMetadata(fileId: string) {
  const drive = getGoogleDriveClient();
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime',
  });
  return response.data;
}
