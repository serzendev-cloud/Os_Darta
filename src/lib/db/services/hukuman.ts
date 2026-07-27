import { createTenantService } from './create-tenant-service';
import type { Hukuman } from '@/types';

const base = createTenantService<Hukuman>('hukuman');

export const hukumanService = {
  ...base,
  async markComplete(id: string): Promise<void> {
    await base.update(id, { status: 'selesai' });
  },
  async cancel(id: string): Promise<void> {
    await base.update(id, { status: 'dibatalkan' });
  },
};
