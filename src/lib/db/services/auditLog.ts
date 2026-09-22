import { demoDb, isDemoMode } from '@/lib/mock-store';
import type { AuditLog, AuditAction, AuditEntityType } from '@/types/audit';
import type { UserRole } from '@/types';

export interface LogAuditOptions {
  tx?: unknown;
  tenantId?: string;
}

export interface AuditLogInput {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityLabel?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole | string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  timestamp?: string | Date;
}

const isBrowser = typeof window !== 'undefined' && process.env.NODE_ENV !== 'test';

async function getAuditRepository() {
  if (isBrowser) {
    return null;
  }
  const { auditRepository } = await import('../repositories/audit-repository');
  return auditRepository;
}

export const auditLogService = {
  /**
   * Records an audit log entry.
   * In production server environment, persists to PostgreSQL public.audit_logs via auditRepository.
   * In demo mode or browser, falls back to demoDb.
   */
  async log(
    entry: AuditLogInput,
    options?: LogAuditOptions
  ): Promise<string> {
    if (isDemoMode() || isBrowser) {
      const timestamp = entry.timestamp
        ? new Date(entry.timestamp).toISOString()
        : new Date().toISOString();
      return demoDb.create('auditLogs', {
        ...entry,
        timestamp,
        tenantId: options?.tenantId || (entry.metadata?.tenantId as string) || 'default',
      });
    }

    const repo = await getAuditRepository();
    if (!repo) {
      return demoDb.create('auditLogs', {
        ...entry,
        tenantId: options?.tenantId || (entry.metadata?.tenantId as string) || 'default',
      });
    }

    return await repo.create(
      {
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityLabel: entry.entityLabel,
        actorId: entry.actorId,
        actorName: entry.actorName,
        actorRole: entry.actorRole,
        changes: entry.changes,
        metadata: entry.metadata,
        tenantId: options?.tenantId || (entry.metadata?.tenantId as string),
        timestamp: entry.timestamp,
      },
      options?.tx
    );
  },

  /**
   * Backward-compatible create method.
   */
  async create(data: Omit<AuditLog, 'id'>, options?: LogAuditOptions): Promise<string> {
    return this.log(data, options);
  },

  /**
   * Retrieves an audit log by ID.
   */
  async get(id: string): Promise<AuditLog | null> {
    if (isDemoMode() || isBrowser) {
      return demoDb.get<AuditLog>('auditLogs', id);
    }
    const repo = await getAuditRepository();
    if (!repo) return demoDb.get<AuditLog>('auditLogs', id);
    return await repo.getById(id);
  },

  /**
   * Lists audit logs matching optional entity and tenant filters.
   */
  async list(
    entityType?: string,
    entityId?: string,
    maxResults = 50,
    tenantId?: string
  ): Promise<AuditLog[]> {
    if (isDemoMode() || isBrowser) {
      const all = demoDb.list<AuditLog>('auditLogs');
      let filtered = all;
      if (entityType) filtered = filtered.filter((e) => e.entityType === entityType);
      if (entityId) filtered = filtered.filter((e) => e.entityId === entityId);
      if (tenantId) filtered = filtered.filter((e) => (e as AuditLog & { tenantId?: string }).tenantId === tenantId);
      return filtered
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxResults);
    }

    const repo = await getAuditRepository();
    if (!repo) return [];

    return await repo.list({
      entityType,
      entityId,
      tenantId,
      maxResults,
    });
  },

  /**
   * Retrieves audit logs for a specific actor.
   */
  async getByActor(actorId: string, maxResults = 30): Promise<AuditLog[]> {
    if (isDemoMode() || isBrowser) {
      const all = demoDb.list<AuditLog>('auditLogs');
      return all
        .filter((e) => e.actorId === actorId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxResults);
    }

    const repo = await getAuditRepository();
    if (!repo) return [];

    return await repo.getByActor(actorId, maxResults);
  },

  /**
   * Audit logs are immutable in production.
   */
  async update(_id: string, _data: Partial<AuditLog>): Promise<void> {
    if (isDemoMode() || isBrowser) {
      return demoDb.update('auditLogs', _id, _data);
    }
    throw new Error('Audit logs are immutable and cannot be updated in production.');
  },

  /**
   * Audit logs are append-only in production.
   */
  async delete(_id: string): Promise<void> {
    if (isDemoMode() || isBrowser) {
      return demoDb.delete('auditLogs', _id);
    }
    throw new Error('Audit logs are append-only and cannot be deleted in production.');
  },

  /**
   * Event listener subscription (demo mode support).
   */
  subscribe(id: string, cb: (data: AuditLog | null) => void): () => void {
    if (isDemoMode() || isBrowser) {
      cb(demoDb.get<AuditLog>('auditLogs', id));
      return demoDb.subscribe((changed) => {
        if (changed === 'auditLogs') {
          cb(demoDb.get<AuditLog>('auditLogs', id));
        }
      });
    }
    return () => {};
  },

  /**
   * Indicates if running in demo mode.
   */
  get isDemo(): boolean {
    return isDemoMode();
  },
};
