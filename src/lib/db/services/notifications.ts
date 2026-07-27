import { createTenantService } from './create-tenant-service';
import type { Notification } from '@/types';

const base = createTenantService<Notification>('notifications');

export const notificationsService = {
  ...base,
  async markAsRead(id: string): Promise<void> {
    await base.update(id, { read: true });
  },
};
