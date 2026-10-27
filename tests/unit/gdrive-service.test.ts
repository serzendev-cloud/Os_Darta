import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.fn();
const mockPermissionsCreate = vi.fn();
const mockFilesDelete = vi.fn();
const mockFilesGet = vi.fn();

vi.mock('@/lib/gdrive/client', () => ({
  getGoogleDriveClient: vi.fn(() => ({
    files: {
      create: mockCreate,
      delete: mockFilesDelete,
      get: mockFilesGet,
    },
    permissions: {
      create: mockPermissionsCreate,
    },
  })),
}));

import { uploadToDrive, deleteFromDrive, getDriveFileMetadata } from '@/lib/gdrive/service';

describe('Workstream C — Google Drive Zero-Trust Privacy Contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads file with restricted access and NEVER grants public "anyone" permissions', async () => {
    mockCreate.mockResolvedValueOnce({
      data: {
        id: 'gdrive_file_123',
        name: 'surat_kesehatan.pdf',
        webViewLink: 'https://drive.google.com/file/d/gdrive_file_123/view',
        webContentLink: 'https://drive.google.com/uc?id=gdrive_file_123',
      },
    });

    const result = await uploadToDrive({
      fileName: 'surat_kesehatan.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('dummy content'),
      folderId: 'folder_uks_secure',
    });

    // 1. Files.create was called with parent folder and metadata
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const createCallArgs = mockCreate.mock.calls[0][0];
    expect(createCallArgs.requestBody.name).toBe('surat_kesehatan.pdf');
    expect(createCallArgs.requestBody.parents).toEqual(['folder_uks_secure']);

    // 2. CRITICAL SECURITY ASSERTION: drive.permissions.create is NEVER called with 'anyone'
    expect(mockPermissionsCreate).not.toHaveBeenCalled();

    // 3. Result preserves fileId and links for authorized service access
    expect(result.fileId).toBe('gdrive_file_123');
    expect(result.fileName).toBe('surat_kesehatan.pdf');
    expect(result.webViewLink).toBe('https://drive.google.com/file/d/gdrive_file_123/view');
  });

  it('throws an error if Google Drive fails to return a valid file ID', async () => {
    mockCreate.mockResolvedValueOnce({
      data: {}, // Missing ID
    });

    await expect(
      uploadToDrive({
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('data'),
      })
    ).rejects.toThrow('Gagal mendapatkan ID file dari Google Drive.');

    // Ensure permissions were not touched
    expect(mockPermissionsCreate).not.toHaveBeenCalled();
  });

  it('can delete files when requested by authorized service', async () => {
    mockFilesDelete.mockResolvedValueOnce({ data: {} });

    const success = await deleteFromDrive('gdrive_file_123');
    expect(success).toBe(true);
    expect(mockFilesDelete).toHaveBeenCalledWith({ fileId: 'gdrive_file_123' });
  });

  it('can retrieve file metadata correctly', async () => {
    mockFilesGet.mockResolvedValueOnce({
      data: {
        id: 'gdrive_file_123',
        name: 'surat_kesehatan.pdf',
        mimeType: 'application/pdf',
        size: '1024',
      },
    });

    const meta = await getDriveFileMetadata('gdrive_file_123');
    expect(meta.id).toBe('gdrive_file_123');
    expect(meta.size).toBe('1024');
  });
});
