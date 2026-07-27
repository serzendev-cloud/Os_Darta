import { createTenantService } from './create-tenant-service';
import type { Pelanggaran } from '@/types';

const base = createTenantService<Pelanggaran>('pelanggaran');

export const pelanggaranService = {
  ...base,
  async createFromReview(data: Omit<Pelanggaran, 'id'>): Promise<string> {
    return base.create(data);
  },
};
