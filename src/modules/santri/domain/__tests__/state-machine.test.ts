// ========================================
// Santri State Machine & Precondition Guard Unit Tests
// Traceability: CIP-WP-003 | Rule SMB-221 | Rule SMB-030
// ========================================

import { describe, it, expect } from 'vitest';
import { SantriStateMachine, SantriState, GRADUATION_SETTLEMENT_TIMEOUT_DAYS } from '../state-machine';
import { StatusTransitionGuard, GuardContext } from '../../services/status-transition-guard';
import { InvalidStateTransitionException, PreconditionFailedException } from '../exceptions';

const defaultContext = {
  statusLedgerId: 'ledger-001',
  santriId: 'santri-001',
  tenantId: 'tenant-001',
  actorType: 'USER' as const,
  actorId: 'user-001',
  reason: 'Testing transition',
  effectiveDate: new Date(),
  metadata: {
    name: 'Ahmad',
    gender: 'L',
    joinDate: '2026-08-07',
    destination: 'Pesantren B',
    note: 'Withdrawal note'
  }
};

describe('Santri State Machine - 17 Legal Transitions', () => {
  // Edge 1: DRAFT -> REGISTERED
  it('should transition from DRAFT to REGISTERED', () => {
    const sm = new SantriStateMachine(SantriState.DRAFT);
    const guardContext: GuardContext = { name: 'Ahmad', gender: 'L', joinDate: '2026-08-07' };
    
    expect(sm.canTransitionTo(SantriState.REGISTERED)).toBe(true);
    StatusTransitionGuard.verify(SantriState.DRAFT, SantriState.REGISTERED, guardContext);
    
    const result = sm.transitionTo(SantriState.REGISTERED, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.REGISTERED);
    expect(result.record.fromState).toBe(SantriState.DRAFT);
    expect(result.record.toState).toBe(SantriState.REGISTERED);
    expect(result.event.eventName).toBe('mds.santri.registered.v1');
  });

  // Edge 2: DRAFT -> ARCHIVED
  it('should transition from DRAFT to ARCHIVED', () => {
    const sm = new SantriStateMachine(SantriState.DRAFT);
    expect(sm.canTransitionTo(SantriState.ARCHIVED)).toBe(true);
    
    const result = sm.transitionTo(SantriState.ARCHIVED, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.ARCHIVED);
    expect(result.event.eventName).toBe('mds.santri.archived.v1');
  });

  // Edge 3: REGISTERED -> VERIFIED
  it('should transition from REGISTERED to VERIFIED', () => {
    const sm = new SantriStateMachine(SantriState.REGISTERED);
    const guardContext: GuardContext = { identityDocsSubmitted: true };
    
    expect(sm.canTransitionTo(SantriState.VERIFIED)).toBe(true);
    StatusTransitionGuard.verify(SantriState.REGISTERED, SantriState.VERIFIED, guardContext);
    
    const result = sm.transitionTo(SantriState.VERIFIED, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.VERIFIED);
    expect(result.event.eventName).toBe('mds.identity.verified.v1');
  });

  // Edge 4: REGISTERED -> ARCHIVED
  it('should transition from REGISTERED to ARCHIVED', () => {
    const sm = new SantriStateMachine(SantriState.REGISTERED);
    expect(sm.canTransitionTo(SantriState.ARCHIVED)).toBe(true);
    
    const result = sm.transitionTo(SantriState.ARCHIVED, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.ARCHIVED);
    expect(result.event.eventName).toBe('mds.santri.archived.v1');
  });

  // Edge 5: VERIFIED -> ACTIVE
  it('should transition from VERIFIED to ACTIVE', () => {
    const sm = new SantriStateMachine(SantriState.VERIFIED);
    const guardContext: GuardContext = {
      identityVerified: true,
      guardians: [{ id: 'g-1', isPrimary: true }]
    };
    
    expect(sm.canTransitionTo(SantriState.ACTIVE)).toBe(true);
    StatusTransitionGuard.verify(SantriState.VERIFIED, SantriState.ACTIVE, guardContext);
    
    const result = sm.transitionTo(SantriState.ACTIVE, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.ACTIVE);
    expect(result.event.eventName).toBe('mds.santri.activated.v1');
  });

  // Edge 6: VERIFIED -> ARCHIVED
  it('should transition from VERIFIED to ARCHIVED', () => {
    const sm = new SantriStateMachine(SantriState.VERIFIED);
    expect(sm.canTransitionTo(SantriState.ARCHIVED)).toBe(true);
    
    const result = sm.transitionTo(SantriState.ARCHIVED, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.ARCHIVED);
    expect(result.event.eventName).toBe('mds.santri.archived.v1');
  });

  // Edge 7: ACTIVE -> SUSPENDED (LEAVE)
  it('should transition from ACTIVE to SUSPENDED via leave', () => {
    const sm = new SantriStateMachine(SantriState.ACTIVE);
    const guardContext: GuardContext = { reason: 'Sakit' };
    
    expect(sm.canTransitionTo(SantriState.SUSPENDED)).toBe(true);
    StatusTransitionGuard.verify(SantriState.ACTIVE, SantriState.SUSPENDED, guardContext);
    
    const result = sm.transitionTo(SantriState.SUSPENDED, { ...defaultContext, reason: 'Sakit' });
    expect(sm.getCurrentState()).toBe(SantriState.SUSPENDED);
    expect(result.record.transitionType).toBe('SUSPENSION_LEAVE');
    expect(result.event.eventName).toBe('mds.santri.suspended.v1');
    expect(result.event.payload.suspensionType).toBe('LEAVE');
  });

  // Edge 8: ACTIVE -> SUSPENDED (DISCIPLINARY)
  it('should transition from ACTIVE to SUSPENDED via disciplinary escalation', () => {
    const sm = new SantriStateMachine(SantriState.ACTIVE);
    
    const customContext = {
      ...defaultContext,
      reason: 'disciplinary: SP3 escalation',
    };
    
    const result = sm.transitionTo(SantriState.SUSPENDED, customContext);
    const updatedRecord = { ...result.record, transitionType: 'SUSPENSION_DISCIPLINARY' as const };
    
    expect(sm.getCurrentState()).toBe(SantriState.SUSPENDED);
    expect(updatedRecord.transitionType).toBe('SUSPENSION_DISCIPLINARY');
  });

  // Edge 9: ACTIVE -> TRANSFERRED
  it('should transition from ACTIVE to TRANSFERRED', () => {
    const sm = new SantriStateMachine(SantriState.ACTIVE);
    const guardContext: GuardContext = { transferDestination: 'Madrasah X', reason: 'Pindah Domisili' };
    
    expect(sm.canTransitionTo(SantriState.TRANSFERRED)).toBe(true);
    StatusTransitionGuard.verify(SantriState.ACTIVE, SantriState.TRANSFERRED, guardContext);
    
    const result = sm.transitionTo(SantriState.TRANSFERRED, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.TRANSFERRED);
    expect(result.event.eventName).toBe('mds.santri.transferred.v1');
  });

  // Edge 10: ACTIVE -> GRADUATED
  it('should transition from ACTIVE to GRADUATED', () => {
    const sm = new SantriStateMachine(SantriState.ACTIVE);
    const guardContext: GuardContext = { academicRequirementsMet: true };
    
    expect(sm.canTransitionTo(SantriState.GRADUATED)).toBe(true);
    StatusTransitionGuard.verify(SantriState.ACTIVE, SantriState.GRADUATED, guardContext);
    
    const result = sm.transitionTo(SantriState.GRADUATED, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.GRADUATED);
    expect(result.event.eventName).toBe('mds.santri.graduated.v1');
  });

  // Edge 11: ACTIVE -> ALUMNI (WITHDRAWN)
  it('should transition from ACTIVE to ALUMNI (WITHDRAWN)', () => {
    const sm = new SantriStateMachine(SantriState.ACTIVE);
    const guardContext: GuardContext = { reason: 'Mengundurkan diri', note: 'Pindah kerja ortu' };
    
    expect(sm.canTransitionTo(SantriState.ALUMNI)).toBe(true);
    StatusTransitionGuard.verify(SantriState.ACTIVE, SantriState.ALUMNI, guardContext);
    
    const result = sm.transitionTo(SantriState.ALUMNI, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.ALUMNI);
    expect(result.event.eventName).toBe('mds.santri.withdrawn.v1');
  });

  // Edge 12: SUSPENDED -> ACTIVE
  it('should transition from SUSPENDED to ACTIVE', () => {
    const sm = new SantriStateMachine(SantriState.SUSPENDED);
    expect(sm.canTransitionTo(SantriState.ACTIVE)).toBe(true);
    
    const result = sm.transitionTo(SantriState.ACTIVE, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.ACTIVE);
    expect(result.event.eventName).toBe('mds.santri.returned.v1');
  });

  // Edge 13: SUSPENDED -> ALUMNI
  it('should transition from SUSPENDED to ALUMNI', () => {
    const sm = new SantriStateMachine(SantriState.SUSPENDED);
    expect(sm.canTransitionTo(SantriState.ALUMNI)).toBe(true);
    
    const result = sm.transitionTo(SantriState.ALUMNI, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.ALUMNI);
    expect(result.event.eventName).toBe('mds.santri.withdrawn.v1');
  });

  // Edge 14: TRANSFERRED -> ALUMNI
  it('should transition from TRANSFERRED to ALUMNI', () => {
    const sm = new SantriStateMachine(SantriState.TRANSFERRED);
    expect(sm.canTransitionTo(SantriState.ALUMNI)).toBe(true);
    
    const result = sm.transitionTo(SantriState.ALUMNI, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.ALUMNI);
    expect(result.event.eventName).toBe('mds.santri.alumni_finalized.v1');
  });

  // Edge 15: GRADUATED -> ALUMNI (Gated by Invoices)
  it('should transition from GRADUATED to ALUMNI when settled', () => {
    const sm = new SantriStateMachine(SantriState.GRADUATED);
    const guardContext: GuardContext = {
      invoices: [{ id: 'inv-1', status: 'SUCCESS' }]
    };
    
    expect(sm.canTransitionTo(SantriState.ALUMNI)).toBe(true);
    StatusTransitionGuard.verify(SantriState.GRADUATED, SantriState.ALUMNI, guardContext);
    
    const result = sm.transitionTo(SantriState.ALUMNI, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.ALUMNI);
    expect(result.event.eventName).toBe('mds.santri.alumni_finalized.v1');
  });

  // Edge 16: ALUMNI -> ARCHIVED
  it('should transition from ALUMNI to ARCHIVED', () => {
    const sm = new SantriStateMachine(SantriState.ALUMNI);
    expect(sm.canTransitionTo(SantriState.ARCHIVED)).toBe(true);
    
    const result = sm.transitionTo(SantriState.ARCHIVED, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.ARCHIVED);
    expect(result.event.eventName).toBe('mds.santri.archived.v1');
  });

  // Edge 17: ARCHIVED -> REGISTERED
  it('should transition from ARCHIVED to REGISTERED', () => {
    const sm = new SantriStateMachine(SantriState.ARCHIVED);
    const guardContext: GuardContext = { reason: 'Kesalahan arsip' };
    
    expect(sm.canTransitionTo(SantriState.REGISTERED)).toBe(true);
    StatusTransitionGuard.verify(SantriState.ARCHIVED, SantriState.REGISTERED, guardContext);
    
    const result = sm.transitionTo(SantriState.REGISTERED, defaultContext);
    expect(sm.getCurrentState()).toBe(SantriState.REGISTERED);
    expect(result.event.eventName).toBe('mds.santri.restored.v1');
  });
});

describe('Santri State Machine - 10 Illegal Transitions Rejection', () => {
  const illegalTestCases: { from: SantriState; to: SantriState }[] = [
    { from: SantriState.DRAFT, to: SantriState.ACTIVE },
    { from: SantriState.DRAFT, to: SantriState.VERIFIED },
    { from: SantriState.REGISTERED, to: SantriState.ACTIVE },
    { from: SantriState.VERIFIED, to: SantriState.ALUMNI },
    { from: SantriState.ACTIVE, to: SantriState.REGISTERED },
    { from: SantriState.SUSPENDED, to: SantriState.GRADUATED },
    { from: SantriState.TRANSFERRED, to: SantriState.ACTIVE },
    { from: SantriState.GRADUATED, to: SantriState.ACTIVE },
    { from: SantriState.ALUMNI, to: SantriState.ACTIVE },
    { from: SantriState.ARCHIVED, to: SantriState.ACTIVE },
  ];

  illegalTestCases.forEach(({ from, to }, index) => {
    it(`[Illegal #${index + 1}] should reject transition from ${from} to ${to} with InvalidStateTransitionException`, () => {
      const sm = new SantriStateMachine(from);
      expect(sm.canTransitionTo(to)).toBe(false);
      expect(() => sm.transitionTo(to, defaultContext)).toThrow(InvalidStateTransitionException);
      expect(() => sm.transitionTo(to, defaultContext)).toThrowError('MDS_4005');
    });
  });
});

describe('StatusTransitionGuard Precondition Tests', () => {
  it('should block DRAFT -> REGISTERED if name is missing', () => {
    const context: GuardContext = { gender: 'L', joinDate: '2026-08-07' };
    expect(() => StatusTransitionGuard.verify(SantriState.DRAFT, SantriState.REGISTERED, context)).toThrow(PreconditionFailedException);
  });

  it('should block VERIFIED -> ACTIVE if no primary guardian is linked', () => {
    const context: GuardContext = {
      identityVerified: true,
      guardians: [{ id: 'g-1', isPrimary: false }]
    };
    expect(() => StatusTransitionGuard.verify(SantriState.VERIFIED, SantriState.ACTIVE, context)).toThrow(PreconditionFailedException);
  });

  it('should block GRADUATED -> ALUMNI if has unpaid invoices', () => {
    const context: GuardContext = {
      invoices: [{ id: 'inv-1', status: 'PENDING' }]
    };
    expect(() => StatusTransitionGuard.verify(SantriState.GRADUATED, SantriState.ALUMNI, context)).toThrow(PreconditionFailedException);
  });

  it('should block GRADUATED -> ALUMNI if graduation date is older than GRADUATION_SETTLEMENT_TIMEOUT_DAYS days (escalation timeout)', () => {
    const ninetyOneDaysAgo = new Date();
    ninetyOneDaysAgo.setDate(ninetyOneDaysAgo.getDate() - (GRADUATION_SETTLEMENT_TIMEOUT_DAYS + 1));
    const context: GuardContext = {
      graduationDate: ninetyOneDaysAgo,
      invoices: [{ id: 'inv-1', status: 'SUCCESS' }]
    };
    expect(() => StatusTransitionGuard.verify(SantriState.GRADUATED, SantriState.ALUMNI, context)).toThrow(PreconditionFailedException);
  });
});
