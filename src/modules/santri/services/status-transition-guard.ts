// ========================================
// Santri Status Transition Guard
// Traceability: CIP-WP-003 | AN-WP003-003 | Rule SMB-176
// ========================================

import { PreconditionFailedException } from '../domain/exceptions';
import { SantriState, GRADUATION_SETTLEMENT_TIMEOUT_DAYS } from '../domain/state-machine';

export interface GuardianInfo {
  id: string;
  isPrimary: boolean;
}

export interface InvoiceInfo {
  id: string;
  status: 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'CANCELLED';
}

export interface GuardContext {
  // Profile fields
  name?: string;
  gender?: string;
  joinDate?: string;
  
  // Verification states
  identityDocsSubmitted?: boolean;
  identityVerified?: boolean;
  
  // Relationships
  guardians?: GuardianInfo[];
  
  // Academic & disciplinary states
  hasActiveSP3?: boolean;
  academicRequirementsMet?: boolean;
  
  // Transition inputs
  transferDestination?: string;
  reason?: string;
  note?: string;
  
  // Financial state (graduation gate)
  invoices?: InvoiceInfo[];
  bypassFinancialSettlement?: boolean;
  graduationDate?: Date;
}

export class StatusTransitionGuard {
  /**
   * Verifies all preconditions for a transition. Throws PreconditionFailedException if checks fail.
   */
  public static verify(
    fromState: SantriState,
    toState: SantriState,
    context: GuardContext
  ): void {
    if (fromState === SantriState.DRAFT && toState === SantriState.REGISTERED) {
      if (!context.name || context.name.trim() === '') {
        throw new PreconditionFailedException('Precondition failed: Santri name is required to submit registration.');
      }
      if (!context.gender || (context.gender !== 'L' && context.gender !== 'P')) {
        throw new PreconditionFailedException("Precondition failed: Gender ('L' or 'P') is required to submit registration.");
      }
      if (!context.joinDate || context.joinDate.trim() === '') {
        throw new PreconditionFailedException('Precondition failed: joinDate is required to submit registration.');
      }
    }

    if (fromState === SantriState.REGISTERED && toState === SantriState.VERIFIED) {
      if (!context.identityDocsSubmitted) {
        throw new PreconditionFailedException('Precondition failed: Identity documents must be submitted before verification.');
      }
    }

    if (fromState === SantriState.VERIFIED && toState === SantriState.ACTIVE) {
      if (!context.identityVerified) {
        throw new PreconditionFailedException('Precondition failed: Identity must be VERIFIED before activation.');
      }
      const hasPrimaryGuardian = context.guardians?.some((g) => g.isPrimary);
      if (!hasPrimaryGuardian) {
        throw new PreconditionFailedException('Precondition failed: At least 1 PRIMARY guardian must be linked before activation.');
      }
    }

    if (fromState === SantriState.ACTIVE && toState === SantriState.SUSPENDED) {
      // If it is disciplinary suspension, SP3 is required
      if (context.hasActiveSP3 === false && context.reason?.includes('disciplinary')) {
        throw new PreconditionFailedException('Precondition failed: Disciplinary suspension requires an active SP3 escalation.');
      }
      if (!context.reason || context.reason.trim() === '') {
        throw new PreconditionFailedException('Precondition failed: Reason must be provided for suspension.');
      }
    }

    if (fromState === SantriState.ACTIVE && toState === SantriState.TRANSFERRED) {
      if (!context.transferDestination || context.transferDestination.trim() === '') {
        throw new PreconditionFailedException('Precondition failed: Transfer destination is required.');
      }
      if (!context.reason || context.reason.trim() === '') {
        throw new PreconditionFailedException('Precondition failed: Transfer reason is required.');
      }
    }

    if (fromState === SantriState.ACTIVE && toState === SantriState.GRADUATED) {
      if (!context.academicRequirementsMet) {
        throw new PreconditionFailedException('Precondition failed: Academic graduation requirements are not met.');
      }
    }

    if (fromState === SantriState.ACTIVE && toState === SantriState.ALUMNI) {
      if (!context.reason || context.reason.trim() === '') {
        throw new PreconditionFailedException('Precondition failed: Withdrawal reason must be provided.');
      }
      if (!context.note || context.note.trim() === '') {
        throw new PreconditionFailedException('Precondition failed: Mandatory withdrawal notes are missing.');
      }
    }

    if (fromState === SantriState.GRADUATED && toState === SantriState.ALUMNI) {
      if (context.bypassFinancialSettlement) {
        return; // Admin manual override bypass
      }

      // Check timeout using the shared constant timeout in days
      if (context.graduationDate) {
        const diffTime = Math.abs(new Date().getTime() - context.graduationDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > GRADUATION_SETTLEMENT_TIMEOUT_DAYS) {
          throw new PreconditionFailedException(
            `Precondition failed: Graduation financial settlement period exceeded ${GRADUATION_SETTLEMENT_TIMEOUT_DAYS} days. Manual administrative escalation is required.`
          );
        }
      }

      // Financial invoices checks
      const hasUnpaidInvoices = context.invoices?.some((inv) => inv.status === 'PENDING');
      if (hasUnpaidInvoices) {
        throw new PreconditionFailedException(
          'Precondition failed: Cannot finalize transition to Alumni. Santri has unpaid invoices.'
        );
      }
    }

    if (fromState === SantriState.ARCHIVED && toState === SantriState.REGISTERED) {
      if (!context.reason || context.reason.trim() === '') {
        throw new PreconditionFailedException('Precondition failed: Reason must be provided to restore archived record.');
      }
    }
  }
}
