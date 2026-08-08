// ========================================
// Santri Domain Value Objects / Entities
// Traceability: CIP-WP-003 | AN-003 | BRR-MDS-003
// ========================================

// Polyfill or import UUID generator helper
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Standard RFC4122 v4 UUID generator fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type TransitionType =
  | 'ACTIVATION'
  | 'SUSPENSION_LEAVE'
  | 'SUSPENSION_DISCIPLINARY'
  | 'RETURN'
  | 'TRANSFER'
  | 'GRADUATION'
  | 'WITHDRAWAL'
  | 'ARCHIVE'
  | 'RESTORE';

export type ActorType = 'USER' | 'SYSTEM' | 'EVENT';

export type EntityType = 'SANTRI' | 'GUARDIAN' | 'IDENTITY' | 'RELATIONSHIP' | 'PLACEMENT';

export interface StatusChangeRecordProps {
  id?: string;
  statusLedgerId: string;
  santriId: string;
  fromState: string;
  toState: string;
  transitionType: TransitionType;
  actorType: ActorType;
  actorId: string;
  reason: string;
  effectiveDate: Date;
  recordedAt?: Date;
}

export class StatusChangeRecord {
  public readonly id: string;
  public readonly statusLedgerId: string;
  public readonly santriId: string;
  public readonly fromState: string;
  public readonly toState: string;
  public readonly transitionType: TransitionType;
  public readonly actorType: ActorType;
  public readonly actorId: string;
  public readonly reason: string;
  public readonly effectiveDate: Date;
  public readonly recordedAt: Date;

  constructor(props: StatusChangeRecordProps) {
    // Validate inputs
    if (!props.statusLedgerId) throw new Error('statusLedgerId is required');
    if (!props.santriId) throw new Error('santriId is required');
    if (!props.fromState) throw new Error('fromState is required');
    if (!props.toState) throw new Error('toState is required');
    if (!props.transitionType) throw new Error('transitionType is required');
    if (!props.actorType) throw new Error('actorType is required');
    if (!props.actorId) throw new Error('actorId is required');
    if (!props.reason) throw new Error('reason is required');
    if (!props.effectiveDate) throw new Error('effectiveDate is required');

    this.id = props.id || generateUUID();
    this.statusLedgerId = props.statusLedgerId;
    this.santriId = props.santriId;
    this.fromState = props.fromState;
    this.toState = props.toState;
    this.transitionType = props.transitionType;
    this.actorType = props.actorType;
    this.actorId = props.actorId;
    this.reason = props.reason;
    this.effectiveDate = props.effectiveDate;
    this.recordedAt = props.recordedAt || new Date();

    // Freeze instance to enforce immutability
    Object.freeze(this);
  }
}

export interface FieldChangeRecordProps {
  id?: string;
  historyLedgerId: string;
  tenantId: string;
  entityType: EntityType;
  entityId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string;
  changedBy: string;
  changedAt?: Date;
}

export class FieldChangeRecord {
  public readonly id: string;
  public readonly historyLedgerId: string;
  public readonly tenantId: string;
  public readonly entityType: EntityType;
  public readonly entityId: string;
  public readonly fieldName: string;
  public readonly oldValue: string | null;
  public readonly newValue: string;
  public readonly changedBy: string;
  public readonly changedAt: Date;

  constructor(props: FieldChangeRecordProps) {
    if (!props.historyLedgerId) throw new Error('historyLedgerId is required');
    if (!props.tenantId) throw new Error('tenantId is required');
    if (!props.entityType) throw new Error('entityType is required');
    if (!props.entityId) throw new Error('entityId is required');
    if (!props.fieldName) throw new Error('fieldName is required');
    if (props.newValue === undefined) throw new Error('newValue is required');
    if (!props.changedBy) throw new Error('changedBy is required');

    this.id = props.id || generateUUID();
    this.historyLedgerId = props.historyLedgerId;
    this.tenantId = props.tenantId;
    this.entityType = props.entityType;
    this.entityId = props.entityId;
    this.fieldName = props.fieldName;
    this.oldValue = props.oldValue;
    this.newValue = props.newValue;
    this.changedBy = props.changedBy;
    this.changedAt = props.changedAt || new Date();

    Object.freeze(this);
  }
}
