import { createTenantService } from './create-tenant-service';
import type { HealthPermission } from '@/types/health';

const baseService = createTenantService<HealthPermission>('healthPermissions');

export const healthPermissionService = {
  ...baseService,

  async create(data: Omit<HealthPermission, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    return await baseService.create({
      ...data,
      createdAt: now,
      updatedAt: now,
    } as any);
  },

  async forwardToKesiswaan(
    id: string,
    forwardedById: string,
    forwardedByName?: string,
    catatan?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    await baseService.update(id, {
      forwardedById,
      forwardedByName,
      catatan,
      status: 'diteruskan_kesiswaan',
      updatedAt: now,
    });
  },

  async approve(
    id: string,
    approvedById: string,
    approvedByName?: string,
    catatan?: string,
    companionSantriId?: string,
    companionSantriName?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    await baseService.update(id, {
      approvedById,
      approvedByName,
      catatan,
      companionSantriId,
      companionSantriName,
      status: 'disetujui',
      updatedAt: now,
    });
  },

  async reject(
    id: string,
    approvedById: string,
    approvedByName?: string,
    catatan?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    await baseService.update(id, {
      approvedById,
      approvedByName,
      catatan,
      status: 'ditolak',
      updatedAt: now,
    });
  },

  async depart(id: string, keluarAt?: string): Promise<void> {
    const now = new Date().toISOString();
    await baseService.update(id, {
      keluarAt: keluarAt || now,
      status: 'dalam_perjalanan',
      updatedAt: now,
    });
  },

  async return(id: string, kembaliAt?: string, catatan?: string): Promise<void> {
    const now = new Date().toISOString();
    await baseService.update(id, {
      kembaliAt: kembaliAt || now,
      catatan,
      status: 'kembali',
      updatedAt: now,
    });
  },

  async complete(id: string, kembaliAt?: string, catatan?: string): Promise<void> {
    const now = new Date().toISOString();
    await baseService.update(id, {
      kembaliAt: kembaliAt || now,
      catatan,
      status: 'selesai',
      updatedAt: now,
    });
  },
};
