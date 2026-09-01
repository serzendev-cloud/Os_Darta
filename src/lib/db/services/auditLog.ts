import { createTenantService } from './create-tenant-service';
import type { AuditLog } from '@/types/audit';

const baseService = createTenantService<AuditLog>('auditLogs');

export const auditLogService = {
  ...baseService,

  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string> {
    const timestamp = new Date().toISOString();
    return await baseService.create({
      ...entry,
      timestamp,
    } as any);
  },

  async list(entityType?: string, entityId?: string, maxResults = 50): Promise<AuditLog[]> {
    const all = await baseService.list();
    let filtered = all;
    if (entityType) filtered = filtered.filter((e) => e.entityType === entityType);
    if (entityId) filtered = filtered.filter((e) => e.entityId === entityId);
    return filtered
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxResults);
  },

  async getByActor(actorId: string, maxResults = 30): Promise<AuditLog[]> {
    const all = await baseService.list();
    return all
      .filter((e) => e.actorId === actorId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxResults);
  },
};
