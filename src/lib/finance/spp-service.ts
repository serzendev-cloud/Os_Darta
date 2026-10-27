// ==============================================================================
// SPP Tuition Billing & Installment Service Engine
// Work Package: APP-MAHAD-SPP-INSTALLMENT-001
// Compliance: Anti-Bypass, Tenant-Isolation, Append-Only Ledger, Strict Approval Gate
// ==============================================================================

import crypto from 'crypto';
import { db } from '@/lib/db';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';
import {
  sppBills,
  sppInstallmentPlans,
  sppInstallmentSchedules,
  sppPayments,
} from '@/lib/db/schema/finance';
import { eq, and, desc, ne } from 'drizzle-orm';
import { financialAuditService } from './auditTrail';

export interface ApplyInstallmentInput {
  tenantId: string;
  billId: string;
  waliId: string;
  santriId: string;
  requestedInstallmentsCount: number;
  requestedAmountPerInstallment: number;
  reason?: string;
  actorId: string;
  actorName: string;
}

export interface ReviewInstallmentInput {
  tenantId: string;
  planId: string;
  decision: 'APPROVE' | 'REJECT';
  reviewedBy: string;
  reviewedByName: string;
  reviewedByRole: string; // Strictly 'admin_keuangan'
  reviewNotes?: string;
  customSchedules?: Array<{
    installmentNumber: number;
    dueDate: string | Date;
    amountDue: number;
  }>;
}

export interface RecordSppPaymentInput {
  tenantId: string;
  billId: string;
  scheduleId?: string | null;
  amount: number;
  paymentMethod?: 'TRANSFER_MANUAL' | 'KASIR_TUNAI' | 'PAYMENT_GATEWAY';
  verifiedBy: string;
  verifiedByName: string;
  idempotencyKey?: string;
  notes?: string;
}

export class SppService {
  /**
   * Retrieves SPP bills for a specific Wali and optional Santri.
   */
  async getWaliSppBills(tenantId: string, waliId: string, santriId?: string) {
    const conditions = [
      eq(sppBills.tenantId, tenantId),
      eq(sppBills.waliId, waliId),
    ];
    if (santriId) {
      conditions.push(eq(sppBills.santriId, santriId));
    }

    const bills = await db
      .select()
      .from(sppBills)
      .where(and(...conditions))
      .orderBy(desc(sppBills.createdAt));

    // Enhance each bill with its active/pending installment plan & schedules
    const enhancedBills = await Promise.all(
      bills.map(async (bill) => {
        const plans = await db
          .select()
          .from(sppInstallmentPlans)
          .where(
            and(
              eq(sppInstallmentPlans.tenantId, tenantId),
              eq(sppInstallmentPlans.billId, bill.id),
              ne(sppInstallmentPlans.status, 'CANCELLED')
            )
          )
          .orderBy(desc(sppInstallmentPlans.createdAt));

        const activeOrPendingPlan = plans.find(
          (p) => p.status === 'PENDING' || p.status === 'ACTIVE' || p.status === 'APPROVED'
        ) || plans[0] || null;

        let schedules: (typeof sppInstallmentSchedules.$inferSelect)[] = [];
        if (activeOrPendingPlan && activeOrPendingPlan.status === 'ACTIVE') {
          schedules = await db
            .select()
            .from(sppInstallmentSchedules)
            .where(
              and(
                eq(sppInstallmentSchedules.tenantId, tenantId),
                eq(sppInstallmentSchedules.planId, activeOrPendingPlan.id)
              )
            )
            .orderBy(sppInstallmentSchedules.installmentNumber);
        }

        return {
          ...bill,
          installmentPlan: activeOrPendingPlan,
          installmentSchedules: schedules,
        };
      })
    );

    return enhancedBills;
  }

  /**
   * Wali submits an installment proposal.
   * STRICT INTEGRITY:
   * 1. Status starts as PENDING.
   * 2. Does NOT activate schedules.
   * 3. Does NOT reduce piutang (remainingAmount).
   * 4. Does NOT record any payment.
   * 5. Does NOT mark bill as LUNAS.
   */
  async applyInstallmentPlan(input: ApplyInstallmentInput) {
    const {
      tenantId,
      billId,
      waliId,
      santriId,
      requestedInstallmentsCount,
      requestedAmountPerInstallment,
      reason,
      actorId,
      actorName,
    } = input;

    if (!requestedInstallmentsCount || requestedInstallmentsCount < 2) {
      throw new Error('INVALID_INSTALLMENTS_COUNT: Pengajuan cicilan minimal 2 kali angsuran');
    }

    if (!requestedAmountPerInstallment || requestedAmountPerInstallment <= 0) {
      throw new Error('INVALID_INSTALLMENT_AMOUNT: Nominal per angsuran harus lebih dari 0');
    }

    return await withTenantTransaction(tenantId, async (tx) => {
      // 1. Lock bill row (FOR UPDATE)
      const billRows = await tx
        .select()
        .from(sppBills)
        .where(
          and(
            eq(sppBills.tenantId, tenantId),
            eq(sppBills.id, billId),
            eq(sppBills.santriId, santriId)
          )
        )
        .for('update');

      const bill = billRows[0];
      if (!bill) {
        throw new Error('BILL_NOT_FOUND: Tagihan SPP tidak ditemukan atau tidak sesuai santri');
      }

      if (bill.allowInstallments === false) {
        throw new Error('INSTALLMENTS_NOT_ALLOWED: Kebijakan pondok tidak mengizinkan cicilan untuk jenis tagihan ini');
      }

      if (bill.status === 'PAID') {
        throw new Error('BILL_ALREADY_PAID: Tagihan ini sudah lunas, tidak dapat mengajukan cicilan');
      }

      if (bill.status === 'CANCELLED') {
        throw new Error('BILL_CANCELLED: Tagihan ini telah dibatalkan');
      }

      // 2. Check no active or pending plan already exists for this bill
      const existingPlans = await tx
        .select()
        .from(sppInstallmentPlans)
        .where(
          and(
            eq(sppInstallmentPlans.tenantId, tenantId),
            eq(sppInstallmentPlans.billId, billId)
          )
        )
        .for('update');

      const conflictPlan = existingPlans.find(
        (p) => p.status === 'PENDING' || p.status === 'ACTIVE'
      );

      if (conflictPlan) {
        throw new Error(
          conflictPlan.status === 'PENDING'
            ? 'PENDING_PLAN_EXISTS: Tagihan ini sudah memiliki pengajuan cicilan yang sedang menunggu persetujuan Admin Keuangan'
            : 'ACTIVE_PLAN_EXISTS: Tagihan ini sudah memiliki jadwal cicilan yang sedang aktif'
        );
      }

      // 3. Insert new proposal with status PENDING
      const planId = `plan_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      await tx.insert(sppInstallmentPlans).values({
        id: planId,
        tenantId,
        billId,
        santriId,
        waliId,
        requestedInstallmentsCount,
        requestedAmountPerInstallment,
        reason: reason || null,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 4. Log immutable financial audit trail
      await financialAuditService.log(
        {
          tenantId,
          correlationId: planId,
          actorId,
          actorName,
          actorRole: 'wali',
          action: 'SPP_INSTALLMENT_APPLIED',
          targetEntity: 'spp_installment_plan',
          targetId: planId,
          amount: bill.remainingAmount,
          stateBefore: { billRemaining: bill.remainingAmount, billStatus: bill.status },
          stateAfter: {
            planStatus: 'PENDING',
            installmentsCount: requestedInstallmentsCount,
            amountPerInstallment: requestedAmountPerInstallment,
          },
          status: 'SUCCESS',
          metadata: { billId, reason },
        },
        tx
      );

      return {
        success: true,
        message: 'Pengajuan cicilan berhasil dikirim dan menunggu persetujuan Admin Keuangan',
        plan: {
          id: planId,
          billId,
          status: 'PENDING',
          requestedInstallmentsCount,
          requestedAmountPerInstallment,
        },
      };
    });
  }

  /**
   * Retrieves list of installment plans for Admin Keuangan inspection.
   */
  async getInstallmentPlansForAdmin(tenantId: string, status?: string) {
    const conditions = [eq(sppInstallmentPlans.tenantId, tenantId)];
    if (status) {
      conditions.push(eq(sppInstallmentPlans.status, status));
    }

    const plans = await db
      .select()
      .from(sppInstallmentPlans)
      .where(and(...conditions))
      .orderBy(desc(sppInstallmentPlans.createdAt));

    // Join with bill info
    return await Promise.all(
      plans.map(async (plan) => {
        const billRows = await db
          .select()
          .from(sppBills)
          .where(and(eq(sppBills.tenantId, tenantId), eq(sppBills.id, plan.billId)))
          .limit(1);

        const bill = billRows[0] || null;

        const schedules = await db
          .select()
          .from(sppInstallmentSchedules)
          .where(
            and(
              eq(sppInstallmentSchedules.tenantId, tenantId),
              eq(sppInstallmentSchedules.planId, plan.id)
            )
          )
          .orderBy(sppInstallmentSchedules.installmentNumber);

        return {
          ...plan,
          bill,
          schedules,
        };
      })
    );
  }

  /**
   * Admin Keuangan reviews an installment proposal (APPROVE or REJECT).
   * STRICT INTEGRITY:
   * 1. Strictly Admin Keuangan only.
   * 2. Rejection records reason, activates NO schedules.
   * 3. Approval activates schedules, marks plan ACTIVE, binds activePlanId on bill.
   */
  async reviewInstallmentPlan(input: ReviewInstallmentInput) {
    const {
      tenantId,
      planId,
      decision,
      reviewedBy,
      reviewedByName,
      reviewedByRole,
      reviewNotes,
      customSchedules,
    } = input;

    if (reviewedByRole !== 'admin_keuangan') {
      throw new Error(
        'UNAUTHORIZED_ROLE: Hanya Admin Keuangan yang berwenang memproses persetujuan cicilan SPP'
      );
    }

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      throw new Error('INVALID_DECISION: Keputusan harus berupa APPROVE atau REJECT');
    }

    if (decision === 'REJECT' && (!reviewNotes || !reviewNotes.trim())) {
      throw new Error('REJECTION_REASON_REQUIRED: Alasan penolakan cicilan wajib diisi');
    }

    return await withTenantTransaction(tenantId, async (tx) => {
      // 1. Lock installment plan (FOR UPDATE)
      const planRows = await tx
        .select()
        .from(sppInstallmentPlans)
        .where(
          and(
            eq(sppInstallmentPlans.tenantId, tenantId),
            eq(sppInstallmentPlans.id, planId)
          )
        )
        .for('update');

      const plan = planRows[0];
      if (!plan) {
        throw new Error('PLAN_NOT_FOUND: Pengajuan cicilan tidak ditemukan');
      }

      if (plan.status !== 'PENDING') {
        throw new Error(
          `INVALID_PLAN_STATUS: Pengajuan cicilan sudah diproses sebelumnya (Status: ${plan.status})`
        );
      }

      // 2. Lock bill row (FOR UPDATE)
      const billRows = await tx
        .select()
        .from(sppBills)
        .where(and(eq(sppBills.tenantId, tenantId), eq(sppBills.id, plan.billId)))
        .for('update');

      const bill = billRows[0];
      if (!bill) {
        throw new Error('BILL_NOT_FOUND: Tagihan SPP terkait tidak ditemukan');
      }

      // Handle REJECTION
      if (decision === 'REJECT') {
        const updatePlanResult = await tx
          .update(sppInstallmentPlans)
          .set({
            status: 'REJECTED',
            reviewedBy,
            reviewedByName,
            reviewedAt: new Date(),
            reviewNotes: reviewNotes || null,
            updatedAt: new Date(),
          })
          .where(and(eq(sppInstallmentPlans.tenantId, tenantId), eq(sppInstallmentPlans.id, plan.id)))
          .returning({ id: sppInstallmentPlans.id });

        if (updatePlanResult.length === 0) {
          throw new Error('PLAN_UPDATE_FAILED: Gagal memperbarui status pengajuan cicilan atau tenant tidak cocok');
        }

        // Append financial audit log
        await financialAuditService.log(
          {
            tenantId,
            correlationId: plan.id,
            actorId: reviewedBy,
            actorName: reviewedByName,
            actorRole: 'admin_keuangan',
            action: 'SPP_INSTALLMENT_REJECTED',
            targetEntity: 'spp_installment_plan',
            targetId: plan.id,
            amount: bill.remainingAmount,
            stateBefore: { planStatus: 'PENDING' },
            stateAfter: { planStatus: 'REJECTED', reason: reviewNotes },
            status: 'SUCCESS',
            metadata: { billId: bill.id, rejectionReason: reviewNotes },
          },
          tx
        );

        return {
          success: true,
          message: 'Pengajuan cicilan telah ditolak oleh Admin Keuangan',
          status: 'REJECTED',
          reviewNotes,
        };
      }

      // Handle APPROVAL -> ACTIVE
      // 3. Generate confirmed installment schedules
      const totalToInstall = bill.remainingAmount;
      const count = plan.requestedInstallmentsCount;

      interface ScheduleItem {
        installmentNumber: number;
        dueDate: Date;
        amountDue: number;
      }

      const schedulesToInsert: ScheduleItem[] = [];

      if (customSchedules && customSchedules.length > 0) {
        const sumCustom = customSchedules.reduce((sum, s) => sum + s.amountDue, 0);
        if (sumCustom !== totalToInstall) {
          throw new Error(
            `SCHEDULE_SUM_MISMATCH: Total nominal jadwal cicilan (Rp ${sumCustom.toLocaleString('id-ID')}) tidak sama dengan sisa tagihan (Rp ${totalToInstall.toLocaleString('id-ID')})`
          );
        }
        for (const item of customSchedules) {
          schedulesToInsert.push({
            installmentNumber: item.installmentNumber,
            dueDate: new Date(item.dueDate),
            amountDue: item.amountDue,
          });
        }
      } else {
        // Automatic equal distribution with penny adjustment on final installment
        const baseAmount = Math.floor(totalToInstall / count);
        const remainder = totalToInstall - baseAmount * count;

        const baseDueDate = new Date(bill.dueDate);

        for (let i = 1; i <= count; i++) {
          const installmentDueDate = new Date(baseDueDate);
          installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));

          const amountDue = i === count ? baseAmount + remainder : baseAmount;
          schedulesToInsert.push({
            installmentNumber: i,
            dueDate: installmentDueDate,
            amountDue,
          });
        }
      }

      // 4. Update plan to ACTIVE (Explicitly Scoped with tenantId)
      const updatePlanResult = await tx
        .update(sppInstallmentPlans)
        .set({
          status: 'ACTIVE',
          reviewedBy,
          reviewedByName,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || 'Disetujui oleh Admin Keuangan',
          updatedAt: new Date(),
        })
        .where(and(eq(sppInstallmentPlans.tenantId, tenantId), eq(sppInstallmentPlans.id, plan.id)))
        .returning({ id: sppInstallmentPlans.id });

      if (updatePlanResult.length === 0) {
        throw new Error('PLAN_UPDATE_FAILED: Gagal mengaktifkan pengajuan cicilan atau tenant tidak cocok');
      }

      // 5. Insert schedules
      for (const item of schedulesToInsert) {
        const scheduleId = `sched_${Date.now()}_${item.installmentNumber}_${crypto.randomBytes(3).toString('hex')}`;
        await tx.insert(sppInstallmentSchedules).values({
          id: scheduleId,
          tenantId,
          planId: plan.id,
          billId: bill.id,
          installmentNumber: item.installmentNumber,
          dueDate: item.dueDate,
          amountDue: item.amountDue,
          amountPaid: 0,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 6. Bind activePlanId on bill (Explicitly Scoped with tenantId for Defense-in-Depth)
      const updateBillResult = await tx
        .update(sppBills)
        .set({
          activePlanId: plan.id,
          updatedAt: new Date(),
        })
        .where(and(eq(sppBills.tenantId, tenantId), eq(sppBills.id, bill.id)))
        .returning({ id: sppBills.id });

      if (updateBillResult.length === 0) {
        throw new Error('BILL_UPDATE_FAILED: Gagal memperbarui tagihan SPP atau tagihan tidak sesuai dengan tenant');
      }

      // 7. Log immutable audit trail
      await financialAuditService.log(
        {
          tenantId,
          correlationId: plan.id,
          actorId: reviewedBy,
          actorName: reviewedByName,
          actorRole: 'admin_keuangan',
          action: 'SPP_INSTALLMENT_APPROVED',
          targetEntity: 'spp_installment_plan',
          targetId: plan.id,
          amount: totalToInstall,
          stateBefore: { planStatus: 'PENDING', activePlanId: bill.activePlanId },
          stateAfter: { planStatus: 'ACTIVE', schedulesCount: schedulesToInsert.length },
          status: 'SUCCESS',
          metadata: { billId: bill.id, count: schedulesToInsert.length },
        },
        tx
      );

      return {
        success: true,
        message: 'Pengajuan cicilan berhasil disetujui dan jadwal angsuran telah diaktifkan',
        status: 'ACTIVE',
        schedulesCount: schedulesToInsert.length,
      };
    });
  }

  /**
   * Records a verified payment (Direct Full or Installment).
   * STRICT INTEGRITY:
   * 1. Requires verified payment receipt.
   * 2. Atomically decrements remainingAmount.
   * 3. Marks bill PAID only when remainingAmount === 0.
   * 4. Enforces idempotency via idempotencyKey.
   */
  async recordSppPayment(input: RecordSppPaymentInput) {
    const {
      tenantId,
      billId,
      scheduleId,
      amount,
      paymentMethod = 'TRANSFER_MANUAL',
      verifiedBy,
      verifiedByName,
      idempotencyKey,
      notes,
    } = input;

    if (!amount || typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      throw new Error('INVALID_AMOUNT: Nominal pembayaran harus berupa integer lebih dari 0');
    }

    return await withTenantTransaction(tenantId, async (tx) => {
      // 1. Idempotency Check
      if (idempotencyKey) {
        const existingPayment = await tx
          .select()
          .from(sppPayments)
          .where(
            and(
              eq(sppPayments.tenantId, tenantId),
              eq(sppPayments.idempotencyKey, idempotencyKey)
            )
          )
          .limit(1);

        if (existingPayment.length > 0) {
          return {
            success: true,
            isDuplicate: true,
            message: 'Pembayaran sudah pernah diproses sebelumnya (Idempotent)',
            payment: existingPayment[0],
          };
        }
      }

      // 2. Lock bill row (FOR UPDATE)
      const billRows = await tx
        .select()
        .from(sppBills)
        .where(and(eq(sppBills.tenantId, tenantId), eq(sppBills.id, billId)))
        .for('update');

      const bill = billRows[0];
      if (!bill) {
        throw new Error('BILL_NOT_FOUND: Tagihan SPP tidak ditemukan');
      }

      if (bill.status === 'PAID') {
        throw new Error('BILL_ALREADY_PAID: Tagihan ini sudah lunas sepenuhnya');
      }

      if (amount > bill.remainingAmount) {
        throw new Error(
          `EXCEEDS_REMAINING_AMOUNT: Nominal bayar (Rp ${amount.toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${bill.remainingAmount.toLocaleString('id-ID')})`
        );
      }

      const newPaidAmount = bill.paidAmount + amount;
      const newRemainingAmount = bill.remainingAmount - amount;
      const isFullyPaid = newRemainingAmount === 0;
      const newBillStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = isFullyPaid ? 'PAID' : 'PARTIAL';

      // 3. If scheduleId provided, lock and update schedule
      let schedule = null;
      if (scheduleId) {
        const scheduleRows = await tx
          .select()
          .from(sppInstallmentSchedules)
          .where(
            and(
              eq(sppInstallmentSchedules.tenantId, tenantId),
              eq(sppInstallmentSchedules.id, scheduleId),
              eq(sppInstallmentSchedules.billId, billId)
            )
          )
          .for('update');

        schedule = scheduleRows[0];
        if (!schedule) {
          throw new Error('SCHEDULE_NOT_FOUND: Butir jadwal angsuran tidak ditemukan');
        }

        const newSchedulePaid = schedule.amountPaid + amount;
        const isScheduleFulfilled = newSchedulePaid >= schedule.amountDue;

        await tx
          .update(sppInstallmentSchedules)
          .set({
            amountPaid: newSchedulePaid,
            status: isScheduleFulfilled ? 'PAID' : 'PENDING',
            paidAt: isScheduleFulfilled ? new Date() : schedule.paidAt,
            updatedAt: new Date(),
          })
          .where(eq(sppInstallmentSchedules.id, schedule.id));
      }

      // 4. Record payment in spp_payments
      const paymentId = `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const paymentNumber = `PAY-SPP-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      await tx.insert(sppPayments).values({
        id: paymentId,
        tenantId,
        billId,
        scheduleId: scheduleId || null,
        paymentNumber,
        amount,
        paymentMethod,
        verifiedBy,
        verifiedByName,
        verifiedAt: new Date(),
        idempotencyKey: idempotencyKey || null,
        status: 'SUCCESS',
        notes: notes || null,
        createdAt: new Date(),
      });

      // 5. Update Bill balances and status (Explicitly Scoped with tenantId)
      const updateBillResult = await tx
        .update(sppBills)
        .set({
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          status: newBillStatus,
          updatedAt: new Date(),
        })
        .where(and(eq(sppBills.tenantId, tenantId), eq(sppBills.id, bill.id)))
        .returning({ id: sppBills.id });

      if (updateBillResult.length === 0) {
        throw new Error('BILL_UPDATE_FAILED: Gagal memperbarui saldo tagihan SPP atau tagihan tidak sesuai dengan tenant');
      }

      // 6. If bill is fully paid and has an active plan, mark plan COMPLETED (Explicitly Scoped with tenantId)
      if (isFullyPaid && bill.activePlanId) {
        const updatePlanResult = await tx
          .update(sppInstallmentPlans)
          .set({
            status: 'COMPLETED',
            updatedAt: new Date(),
          })
          .where(and(eq(sppInstallmentPlans.tenantId, tenantId), eq(sppInstallmentPlans.id, bill.activePlanId)))
          .returning({ id: sppInstallmentPlans.id });

        if (updatePlanResult.length === 0) {
          throw new Error('PLAN_UPDATE_FAILED: Gagal menyelesaikan status pengajuan cicilan atau tenant tidak cocok');
        }
      }

      // 7. Append financial audit trail
      await financialAuditService.log(
        {
          tenantId,
          correlationId: paymentId,
          actorId: verifiedBy,
          actorName: verifiedByName,
          actorRole: 'admin_keuangan',
          action: scheduleId ? 'SPP_INSTALLMENT_PAYMENT' : 'SPP_DIRECT_PAYMENT',
          targetEntity: 'spp_bill',
          targetId: bill.id,
          amount,
          stateBefore: {
            billPaid: bill.paidAmount,
            billRemaining: bill.remainingAmount,
            billStatus: bill.status,
          },
          stateAfter: {
            billPaid: newPaidAmount,
            billRemaining: newRemainingAmount,
            billStatus: newBillStatus,
          },
          status: 'SUCCESS',
          metadata: { paymentNumber, scheduleId, paymentMethod },
        },
        tx
      );

      return {
        success: true,
        message: isFullyPaid
          ? 'Pembayaran berhasil diverifikasi. Tagihan SPP dinyatakan LUNAS.'
          : 'Pembayaran angsuran berhasil diverifikasi.',
        payment: {
          id: paymentId,
          paymentNumber,
          amount,
          newRemainingAmount,
          billStatus: newBillStatus,
        },
      };
    });
  }
}

export const sppService = new SppService();
