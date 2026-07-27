import { createTenantService } from './create-tenant-service';
import type { Quest } from '@/types';

const base = createTenantService<Quest>('quests');

export const questService = {
  ...base,
  async approve(id: string, approvedBy: string): Promise<void> {
    await base.update(id, { approvalStatus: 'approved', approvedBy });
  },
  async reject(id: string, approvedBy: string): Promise<void> {
    await base.update(id, { approvalStatus: 'rejected', approvedBy });
  },
  async startQuest(id: string): Promise<void> {
    await base.update(id, { status: 'inProgress' });
  },
  async complete(id: string): Promise<void> {
    await base.update(id, { status: 'completed' });
  },
};
