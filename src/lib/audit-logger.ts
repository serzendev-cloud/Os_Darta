import { auditLogService } from '@/lib/db/services';
import type { AuditAction, AuditEntityType } from '@/types/audit';
import type { UserRole } from '@/types';

interface AuditEntryParams {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityLabel?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget audit logger. Never throws — audit failures must not block user actions.
 */
export async function logAudit(params: AuditEntryParams): Promise<void> {
  try {
    await auditLogService.log(params);
  } catch {
    // Audit failure is non-blocking
    console.warn('[audit-logger] Failed to write audit entry:', params.action, params.entityType);
  }
}

// ─── Convenience helpers ────────────────────────────────────────────

export function auditCreate(
  actorId: string, actorName: string, actorRole: UserRole,
  entityType: AuditEntityType, entityId: string, entityLabel: string,
) {
  return logAudit({ action: 'create', entityType, entityId, entityLabel, actorId, actorName, actorRole });
}

export function auditUpdate(
  actorId: string, actorName: string, actorRole: UserRole,
  entityType: AuditEntityType, entityId: string, entityLabel: string,
  changes: Record<string, { from: unknown; to: unknown }>,
) {
  return logAudit({ action: 'update', entityType, entityId, entityLabel, actorId, actorName, actorRole, changes });
}

export function auditDelete(
  actorId: string, actorName: string, actorRole: UserRole,
  entityType: AuditEntityType, entityId: string, entityLabel: string,
) {
  return logAudit({ action: 'delete', entityType, entityId, entityLabel, actorId, actorName, actorRole });
}

export function auditApprove(
  actorId: string, actorName: string, actorRole: UserRole,
  entityType: AuditEntityType, entityId: string, entityLabel: string,
) {
  return logAudit({ action: 'approve', entityType, entityId, entityLabel, actorId, actorName, actorRole });
}

export function auditReject(
  actorId: string, actorName: string, actorRole: UserRole,
  entityType: AuditEntityType, entityId: string, entityLabel: string,
) {
  return logAudit({ action: 'reject', entityType, entityId, entityLabel, actorId, actorName, actorRole });
}
