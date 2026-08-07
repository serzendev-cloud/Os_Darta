// ========================================
// Santri Lifecycle State Machine
// Traceability: CIP-WP-003 | AN-003 | BRR-MDS-003
// ========================================

import { InvalidStateTransitionException } from './exceptions';
import { StatusChangeRecord, TransitionType, ActorType } from './value-objects';
import * as events from './events';

export const GRADUATION_SETTLEMENT_TIMEOUT_DAYS = 90;

export enum SantriState {
  DRAFT = 'DRAFT',
  REGISTERED = 'REGISTERED',
  VERIFIED = 'VERIFIED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRANSFERRED = 'TRANSFERRED',
  GRADUATED = 'GRADUATED',
  ALUMNI = 'ALUMNI',
  ARCHIVED = 'ARCHIVED',
}

export interface TransitionEdge {
  from: SantriState;
  to: SantriState;
  transitionType: TransitionType;
}

export const LEGAL_TRANSITIONS: TransitionEdge[] = [
  { from: SantriState.DRAFT, to: SantriState.REGISTERED, transitionType: 'ACTIVATION' }, // submit registration
  { from: SantriState.DRAFT, to: SantriState.ARCHIVED, transitionType: 'ARCHIVE' }, // discard draft
  { from: SantriState.REGISTERED, to: SantriState.VERIFIED, transitionType: 'ACTIVATION' }, // verify identity
  { from: SantriState.REGISTERED, to: SantriState.ARCHIVED, transitionType: 'ARCHIVE' }, // archive abandoned
  { from: SantriState.VERIFIED, to: SantriState.ACTIVE, transitionType: 'ACTIVATION' }, // activate student
  { from: SantriState.VERIFIED, to: SantriState.ARCHIVED, transitionType: 'ARCHIVE' }, // archive verified
  { from: SantriState.ACTIVE, to: SantriState.SUSPENDED, transitionType: 'SUSPENSION_LEAVE' }, // leave suspension
  { from: SantriState.ACTIVE, to: SantriState.SUSPENDED, transitionType: 'SUSPENSION_DISCIPLINARY' }, // disciplinary suspension
  { from: SantriState.ACTIVE, to: SantriState.TRANSFERRED, transitionType: 'TRANSFER' }, // transfer out
  { from: SantriState.ACTIVE, to: SantriState.GRADUATED, transitionType: 'GRADUATION' }, // graduate akademik
  { from: SantriState.ACTIVE, to: SantriState.ALUMNI, transitionType: 'WITHDRAWAL' }, // withdraw/keluar
  { from: SantriState.SUSPENDED, to: SantriState.ACTIVE, transitionType: 'RETURN' }, // return from suspension
  { from: SantriState.SUSPENDED, to: SantriState.ALUMNI, transitionType: 'WITHDRAWAL' }, // expelled while suspended
  { from: SantriState.TRANSFERRED, to: SantriState.ALUMNI, transitionType: 'WITHDRAWAL' }, // finalize transfer
  { from: SantriState.GRADUATED, to: SantriState.ALUMNI, transitionType: 'WITHDRAWAL' }, // financial settlement -> alumni (subtype graduated)
  { from: SantriState.ALUMNI, to: SantriState.ARCHIVED, transitionType: 'ARCHIVE' }, // retention period elapsed
  { from: SantriState.ARCHIVED, to: SantriState.REGISTERED, transitionType: 'RESTORE' }, // restore
];

export interface TransitionContext {
  statusLedgerId: string;
  santriId: string;
  tenantId: string;
  actorType: ActorType;
  actorId: string;
  reason: string;
  effectiveDate: Date;
  metadata?: Record<string, unknown>;
}

export class SantriStateMachine {
  private state: SantriState;

  constructor(initialState: SantriState) {
    this.state = initialState;
  }

  public getCurrentState(): SantriState {
    return this.state;
  }

  /**
   * Evaluates if a transition from current state to target state is legal.
   */
  public canTransitionTo(toState: SantriState): boolean {
    return LEGAL_TRANSITIONS.some(
      (edge) => edge.from === this.state && edge.to === toState
    );
  }

  /**
   * Executes a state transition, generating the status change record and emitting the matching domain event.
   */
  public transitionTo(
    toState: SantriState,
    context: TransitionContext
  ): {
    record: StatusChangeRecord;
    event: events.DomainEvent;
  } {
    const edge = LEGAL_TRANSITIONS.find(
      (e) => e.from === this.state && e.to === toState
    );

    if (!edge) {
      throw new InvalidStateTransitionException(this.state, toState);
    }

    // Determine the corresponding domain event
    let event: events.DomainEvent;
    const aggregateId = context.santriId;
    const tenantId = context.tenantId;

    switch (edge.transitionType) {
      case 'ACTIVATION':
        if (toState === SantriState.REGISTERED) {
          event = new events.SantriRegisteredEvent(aggregateId, tenantId, {
            name: (context.metadata?.name as string) || '',
            gender: (context.metadata?.gender as string) || '',
            joinDate: (context.metadata?.joinDate as string) || new Date().toISOString(),
          });
        } else if (toState === SantriState.VERIFIED) {
          event = new events.IdentityVerifiedEvent(aggregateId, tenantId, {
            verifiedBy: context.actorId,
          });
        } else {
          event = new events.SantriActivatedEvent(aggregateId, tenantId, {
            activatedAt: context.effectiveDate,
          });
        }
        break;

      case 'ARCHIVE':
        event = new events.SantriArchivedEvent(aggregateId, tenantId, {
          reason: context.reason,
        });
        break;

      case 'SUSPENSION_LEAVE':
        event = new events.SantriSuspendedEvent(aggregateId, tenantId, {
          suspensionType: 'LEAVE',
          reason: context.reason,
        });
        break;

      case 'SUSPENSION_DISCIPLINARY':
        event = new events.SantriSuspendedEvent(aggregateId, tenantId, {
          suspensionType: 'DISCIPLINARY',
          reason: context.reason,
        });
        break;

      case 'TRANSFER':
        event = new events.SantriTransferredEvent(aggregateId, tenantId, {
          destination: (context.metadata?.destination as string) || '',
          reason: context.reason,
        });
        break;

      case 'GRADUATION':
        event = new events.SantriGraduatedEvent(aggregateId, tenantId, {
          graduationDate: context.effectiveDate,
        });
        break;

      case 'WITHDRAWAL':
        if (this.state === SantriState.GRADUATED) {
          event = new events.AlumniFinalizedEvent(aggregateId, tenantId, {
            alumniType: 'GRADUATED',
            finalizedAt: context.effectiveDate,
          });
        } else if (this.state === SantriState.TRANSFERRED) {
          event = new events.AlumniFinalizedEvent(aggregateId, tenantId, {
            alumniType: 'GRADUATED', // Transferred finalized is type graduated
            finalizedAt: context.effectiveDate,
          });
        } else {
          event = new events.SantriWithdrawnEvent(aggregateId, tenantId, {
            reason: context.reason,
            note: (context.metadata?.note as string) || '',
          });
        }
        break;

      case 'RETURN':
        event = new events.SantriReturnedEvent(aggregateId, tenantId, {
          returnedAt: context.effectiveDate,
        });
        break;

      case 'RESTORE':
        event = new events.SantriRestoredEvent(aggregateId, tenantId, {
          restoreReason: context.reason,
        });
        break;

      default:
        throw new Error(`Unhandled transition type: ${edge.transitionType}`);
    }

    const record = new StatusChangeRecord({
      statusLedgerId: context.statusLedgerId,
      santriId: context.santriId,
      fromState: this.state,
      toState,
      transitionType: edge.transitionType,
      actorType: context.actorType,
      actorId: context.actorId,
      reason: context.reason,
      effectiveDate: context.effectiveDate,
    });

    this.state = toState;

    return { record, event };
  }
}
