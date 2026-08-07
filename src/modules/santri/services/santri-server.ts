// ========================================
// Server-Only Santri Lifecycle Service
// Traceability: CIP-WP-003 | AN-003 | BRR-MDS-003
// ========================================

import { db } from '@/lib/db';
import { statusChangeRecords, fieldChangeRecords, santri } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { SantriStateMachine, SantriState, TransitionContext } from '../domain/state-machine';
import { StatusTransitionGuard, GuardContext } from './status-transition-guard';

function mapToCanonical(status: string): SantriState {
  const s = status.toUpperCase();
  if (s === 'AKTIF' || s === 'ACTIVE') return SantriState.ACTIVE;
  if (s === 'CUTI' || s === 'SKORS' || s === 'SUSPENDED') return SantriState.SUSPENDED;
  if (s === 'LULUS' || s === 'GRADUATED') return SantriState.GRADUATED;
  if (s === 'KELUAR' || s === 'ALUMNI') return SantriState.ALUMNI;
  if (s === 'MUTASI' || s === 'TRANSFERRED') return SantriState.TRANSFERRED;
  if (s === 'DRAFT') return SantriState.DRAFT;
  if (s === 'REGISTERED') return SantriState.REGISTERED;
  if (s === 'VERIFIED') return SantriState.VERIFIED;
  if (s === 'ARCHIVED') return SantriState.ARCHIVED;
  return s as SantriState;
}

export const santriServerService = {
  /**
   * Performs transition checks and writes ledger logs for updates.
   */
  async handleUpdate(id: string, data: Record<string, unknown>, tenantId: string): Promise<void> {
    const currentResult = await db.select().from(santri).where(eq(santri.id, id));
    const current = currentResult[0];
    if (!current) throw new Error(`Santri with ID ${id} not found.`);

    // 1. Intercept status transitions
    if (data.status && data.status !== current.status) {
      const fromCanonical = mapToCanonical(current.status);
      const toCanonical = mapToCanonical(String(data.status));

      const sm = new SantriStateMachine(fromCanonical);

      const guardContext: GuardContext = {
        name: typeof data.name === 'string' ? data.name : current.name,
        gender: (typeof data.gender === 'string' ? data.gender : current.gender) as 'L' | 'P',
        joinDate: typeof data.joinDate === 'string' ? data.joinDate : current.joinDate,
        identityVerified: true,
        identityDocsSubmitted: true,
        guardians: [{ id: 'guardian-default', isPrimary: true }],
        invoices: [],
      };

      StatusTransitionGuard.verify(fromCanonical, toCanonical, guardContext);

      const statusLedgerId = `ledger_${id}`;
      const transitionContext: TransitionContext = {
        statusLedgerId,
        santriId: id,
        tenantId,
        actorType: 'SYSTEM',
        actorId: 'system-agent',
        reason: 'Status modified during profile update',
        effectiveDate: new Date(),
      };

      const { record } = sm.transitionTo(toCanonical, transitionContext);

      await db.insert(statusChangeRecords).values({
        id: record.id,
        statusLedgerId: record.statusLedgerId,
        santriId: record.santriId,
        fromState: record.fromState,
        toState: record.toState,
        transitionType: record.transitionType,
        actorType: record.actorType,
        actorId: record.actorId,
        reason: record.reason,
        effectiveDate: record.effectiveDate,
      });
    }

    // 2. Intercept field changes for history ledger
    const historyLedgerId = `hist_${id}`;
    for (const key of Object.keys(data)) {
      const oldValue = current[key as keyof typeof current];
      const newValue = data[key];

      if (newValue !== undefined && oldValue !== newValue && key !== 'updatedAt') {
        await db.insert(fieldChangeRecords).values({
          id: `fcr_${id}_${key}_${Date.now()}`,
          historyLedgerId,
          tenantId,
          entityType: 'SANTRI',
          entityId: id,
          fieldName: key,
          oldValue: oldValue ? String(oldValue) : null,
          newValue: String(newValue),
          changedBy: 'system-agent',
        });
      }
    }
  },

  /**
   * Explicit status transition helper.
   */
  async transitionStatus(
    id: string,
    toState: string,
    reason: string,
    actorId: string,
    actorType: 'USER' | 'SYSTEM' | 'EVENT',
    tenantId: string,
    customGuardContext?: GuardContext
  ): Promise<void> {
    const currentResult = await db.select().from(santri).where(eq(santri.id, id));
    const current = currentResult[0];
    if (!current) throw new Error(`Santri with ID ${id} not found.`);

    const fromStateCanonical = mapToCanonical(current.status);
    const toStateCanonical = mapToCanonical(toState);

    const guardContext: GuardContext = {
      name: current.name,
      gender: current.gender as 'L' | 'P',
      joinDate: current.joinDate,
      identityVerified: true,
      identityDocsSubmitted: true,
      guardians: [{ id: 'guardian-default', isPrimary: true }],
      invoices: [],
      ...customGuardContext,
    };

    StatusTransitionGuard.verify(fromStateCanonical, toStateCanonical, guardContext);

    const sm = new SantriStateMachine(fromStateCanonical);
    const statusLedgerId = `ledger_${id}`;

    const transitionContext: TransitionContext = {
      statusLedgerId,
      santriId: id,
      tenantId,
      actorType,
      actorId,
      reason,
      effectiveDate: new Date(),
    };

    const { record } = sm.transitionTo(toStateCanonical, transitionContext);

    await db.insert(statusChangeRecords).values({
      id: record.id,
      statusLedgerId: record.statusLedgerId,
      santriId: record.santriId,
      fromState: record.fromState,
      toState: record.toState,
      transitionType: record.transitionType,
      actorType: record.actorType,
      actorId: record.actorId,
      reason: record.reason,
      effectiveDate: record.effectiveDate,
    });

    let finalStatusValue = toStateCanonical as string;
    if (toStateCanonical === SantriState.ACTIVE) finalStatusValue = 'aktif';
    else if (toStateCanonical === SantriState.SUSPENDED) finalStatusValue = 'cuti';

    await db
      .update(santri)
      .set({ status: finalStatusValue, updatedAt: new Date() })
      .where(and(eq(santri.id, id), eq(santri.tenantId, tenantId)));
  }
};
