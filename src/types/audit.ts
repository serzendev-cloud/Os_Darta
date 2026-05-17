import type { UserRole } from './index';

// ─── Audit Log ─────────────────────────────────────────────────────
// Centralized audit trail for all governance-significant actions.
// Every create/update/delete/approve/reject MUST write an audit entry.

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'execute'
  | 'cancel'
  | 'login'
  | 'logout'
  | 'export'
  | 'import';

export type AuditEntityType =
  | 'santri'
  | 'guru'
  | 'pelanggaran'
  | 'hukuman'
  | 'quest'
  | 'governance_case'
  | 'health_visit'
  | 'health_permission'
  | 'notification'
  | 'user'
  | 'kelas'
  | 'mapel'
  | 'asrama'
  | 'kamar'
  | 'master_pelanggaran'
  | 'master_hukuman'
  | 'master_tingkat'
  | 'master_jenjang'
  | 'tolerance_policy'
  | 'teacher_assignment'
  | 'import_batch'
  | 'system';

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  entityLabel?: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// Firestore document version
export interface FirestoreAuditLog extends Omit<AuditLog, 'id'> {
  createdAt: import('firebase/firestore').Timestamp;
  updatedAt: import('firebase/firestore').Timestamp;
}
