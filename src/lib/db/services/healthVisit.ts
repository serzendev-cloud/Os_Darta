import { createTenantService } from './create-tenant-service';
import type { HealthVisit } from '@/types/health';

const baseService = createTenantService<HealthVisit>('healthVisits');

export const healthVisitService = {
  ...baseService,

  async create(data: Omit<HealthVisit, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    return await baseService.create({
      ...data,
      createdAt: now,
      updatedAt: now,
    } as any);
  },

  async complete(id: string, data?: Partial<HealthVisit>): Promise<void> {
    const now = new Date().toISOString();
    await baseService.update(id, {
      ...data,
      status: 'selesai',
      selesaiAt: data?.selesaiAt || now,
      updatedAt: now,
    });
  },
};
