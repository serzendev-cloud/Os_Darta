// ========================================
// Santri Domain Events
// Traceability: CIP-WP-003 | AN-003 | BRR-MDS-003
// ========================================

export interface DomainEvent {
  eventName: string;
  aggregateId: string;
  tenantId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
}

export class SantriRegisteredEvent implements DomainEvent {
  public readonly eventName = 'mds.santri.registered.v1';
  public readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly payload: { name: string; gender: string; joinDate: string }
  ) {}
}

export class SantriArchivedEvent implements DomainEvent {
  public readonly eventName = 'mds.santri.archived.v1';
  public readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly payload: { reason?: string }
  ) {}
}

export class IdentityVerifiedEvent implements DomainEvent {
  public readonly eventName = 'mds.identity.verified.v1';
  public readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly payload: { verifiedBy: string }
  ) {}
}

export class SantriActivatedEvent implements DomainEvent {
  public readonly eventName = 'mds.santri.activated.v1';
  public readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly payload: { activatedAt: Date }
  ) {}
}

export class SantriSuspendedEvent implements DomainEvent {
  public readonly eventName = 'mds.santri.suspended.v1';
  public readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly payload: { suspensionType: 'LEAVE' | 'DISCIPLINARY'; reason: string }
  ) {}
}

export class SantriTransferredEvent implements DomainEvent {
  public readonly eventName = 'mds.santri.transferred.v1';
  public readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly payload: { destination: string; reason: string }
  ) {}
}

export class SantriGraduatedEvent implements DomainEvent {
  public readonly eventName = 'mds.santri.graduated.v1';
  public readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly payload: { graduationDate: Date }
  ) {}
}

export class SantriWithdrawnEvent implements DomainEvent {
  public readonly eventName = 'mds.santri.withdrawn.v1';
  public readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly payload: { reason: string; note: string }
  ) {}
}

export class SantriReturnedEvent implements DomainEvent {
  public readonly eventName = 'mds.santri.returned.v1';
  public readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly payload: { returnedAt: Date }
  ) {}
}

export class AlumniFinalizedEvent implements DomainEvent {
  public readonly eventName = 'mds.santri.alumni_finalized.v1';
  public readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly payload: { alumniType: 'GRADUATED' | 'WITHDRAWN'; finalizedAt: Date }
  ) {}
}

export class SantriRestoredEvent implements DomainEvent {
  public readonly eventName = 'mds.santri.restored.v1';
  public readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly tenantId: string,
    public readonly payload: { restoreReason: string }
  ) {}
}
