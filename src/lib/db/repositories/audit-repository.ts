// ============================================================
// Canonical PostgreSQL Drizzle Audit Repository
// Traceability: WP-AUDIT-PERSISTENCE-REMEDIATION-001
// Purpose: Persistent, zero-secret audit logging to public.audit_logs
// ============================================================

import { db } from '../index';
import { auditLogs } from '../schema';
import { eq, desc, and } from 'drizzle-orm';
import type { AuditLog, AuditAction, AuditEntityType } from '@/types/audit';
import type { UserRole } from '@/types';

export interface CreateAuditEntryInput {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityLabel?: string;
  actorId?: string;
  actorName?: string;
  actorRole?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  tenantId?: string;
  timestamp?: string | Date;
}

export interface AuditListFilters {
  entityType?: string;
  entityId?: string;
  tenantId?: string;
  maxResults?: number;
}

export type DbClient = {
  insert: typeof db.insert;
  select: typeof db.select;
};

const SENSITIVE_KEYS = new Set([
  'password',
  'temporarypassword',
  'initialpassword',
  'token',
  'refreshtoken',
  'accesstoken',
  'secret',
  'apikey',
  'cookie',
  'servicerolekey',
  'databaseurl',
]);

/**
 * Recursively redacts sensitive keys from metadata/changes before persistence.
 */
export function sanitizeAuditData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeAuditData);

  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    const normalizedKey = k.toLowerCase().replace(/[-_]/g, '');
    const isSensitive =
      SENSITIVE_KEYS.has(normalizedKey) ||
      ['password', 'secret', 'token', 'apikey', 'cookie', 'servicerole'].some((term) =>
        normalizedKey.includes(term)
      );

    if (isSensitive) {
      clean[k] = '[REDACTED]';
    } else if (v && typeof v === 'object') {
      clean[k] = sanitizeAuditData(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

export const auditRepository = {
  /**
   * Persists an audit log entry directly to PostgreSQL public.audit_logs table.
   * Supports optional transaction client (tx) propagation.
   */
  async create(
    entry: CreateAuditEntryInput,
    txClient?: unknown
  ): Promise<string> {
    const recordId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const resolvedTenantId =
      entry.tenantId ||
      (entry.metadata?.tenantId as string) ||
      (entry.entityType === 'tenant' && entry.entityId ? entry.entityId : 'default');

    const detailsPayload: Record<string, unknown> = {};
    if (entry.entityLabel) detailsPayload.entityLabel = entry.entityLabel;
    if (entry.changes) detailsPayload.changes = sanitizeAuditData(entry.changes);
    if (entry.metadata) detailsPayload.metadata = sanitizeAuditData(entry.metadata);

    const detailsStr = Object.keys(detailsPayload).length > 0 ? JSON.stringify(detailsPayload) : null;
    const client = (txClient && typeof (txClient as DbClient).insert === 'function')
      ? (txClient as DbClient)
      : (db as unknown as DbClient);

    await client.insert(auditLogs).values({
      id: recordId,
      tenantId: resolvedTenantId,
      action: entry.action,
      user: entry.actorName || 'System',
      userId: entry.actorId || null,
      userRole: entry.actorRole || null,
      details: detailsStr,
      targetEntity: entry.entityType || null,
      targetId: entry.entityId || null,
      timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
    });

    return recordId;
  },

  /**
   * Lists audit logs from PostgreSQL public.audit_logs.
   */
  async list(filters?: AuditListFilters, client = db): Promise<AuditLog[]> {
    const maxResults = filters?.maxResults || 50;
    const conditions = [];

    if (filters?.entityType) {
      conditions.push(eq(auditLogs.targetEntity, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(auditLogs.targetId, filters.entityId));
    }
    if (filters?.tenantId) {
      conditions.push(eq(auditLogs.tenantId, filters.tenantId));
    }

    const rows = await client
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.timestamp))
      .limit(maxResults);

    return rows.map((row) => {
      let parsedDetails: Record<string, unknown> = {};
      if (row.details) {
        try {
          parsedDetails = JSON.parse(row.details);
        } catch {
          parsedDetails = { raw: row.details };
        }
      }

      return {
        id: row.id,
        action: row.action as AuditAction,
        entityType: (row.targetEntity || 'system') as AuditEntityType,
        entityId: row.targetId || undefined,
        entityLabel: (parsedDetails.entityLabel as string) || undefined,
        actorId: row.userId || '',
        actorName: row.user,
        actorRole: (row.userRole || 'admin') as UserRole,
        changes: parsedDetails.changes as Record<string, { from: unknown; to: unknown }> | undefined,
        metadata: parsedDetails.metadata as Record<string, unknown> | undefined,
        timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
      };
    });
  },

  /**
   * Retrieves audit logs for a specific actor.
   */
  async getByActor(actorId: string, maxResults = 30, client = db): Promise<AuditLog[]> {
    const rows = await client
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, actorId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(maxResults);

    return rows.map((row) => {
      let parsedDetails: Record<string, unknown> = {};
      if (row.details) {
        try {
          parsedDetails = JSON.parse(row.details);
        } catch {
          parsedDetails = { raw: row.details };
        }
      }

      return {
        id: row.id,
        action: row.action as AuditAction,
        entityType: (row.targetEntity || 'system') as AuditEntityType,
        entityId: row.targetId || undefined,
        entityLabel: (parsedDetails.entityLabel as string) || undefined,
        actorId: row.userId || '',
        actorName: row.user,
        actorRole: (row.userRole || 'admin') as UserRole,
        changes: parsedDetails.changes as Record<string, { from: unknown; to: unknown }> | undefined,
        metadata: parsedDetails.metadata as Record<string, unknown> | undefined,
        timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
      };
    });
  },

  /**
   * Retrieves an audit log by ID.
   */
  async getById(id: string, client = db): Promise<AuditLog | null> {
    const rows = await client
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    let parsedDetails: Record<string, unknown> = {};
    if (row.details) {
      try {
        parsedDetails = JSON.parse(row.details);
      } catch {
        parsedDetails = { raw: row.details };
      }
    }

    return {
      id: row.id,
      action: row.action as AuditAction,
      entityType: (row.targetEntity || 'system') as AuditEntityType,
      entityId: row.targetId || undefined,
      entityLabel: (parsedDetails.entityLabel as string) || undefined,
      actorId: row.userId || '',
      actorName: row.user,
      actorRole: (row.userRole || 'admin') as UserRole,
      changes: parsedDetails.changes as Record<string, { from: unknown; to: unknown }> | undefined,
      metadata: parsedDetails.metadata as Record<string, unknown> | undefined,
      timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
    };
  },
};
