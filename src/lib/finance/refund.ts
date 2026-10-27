// ==============================================================================
// Canteen Refund Engine (Hardened with Row-Locking, Cumulative Limit & Admin Gate)
// Work Package: WP-M2-FINANCIAL-AUDIT-TRAIL-AND-DIGITAL-CCTV-001
// Compliance: PO Decisions 1, 2, 3, 4, 7, 8
// ==============================================================================

import crypto from 'crypto';
import { db } from '@/lib/db';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';
import {
  canteenRefunds,
  canteenTransactions,
  wallets,
  walletPockets,
} from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { financialAuditService, FinancialActorRole } from './auditTrail';
import { merchantLedgerService } from './merchantLedger';

export interface RequestRefundInput {
  tenantId: string;
  transactionId: string;
  refundAmount?: number; // Optional; if omitted, full remaining refundable
  reason: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string; // 'pic_kantin' | 'kasir' | etc.
}

export interface ReviewRefundInput {
  tenantId: string;
  refundId: string;
  decision: 'APPROVE' | 'REJECT';
  reviewedBy: string;
  reviewedByName: string;
  reviewedByRole: string; // Must be server-authenticated 'admin_keuangan' or 'super_admin'
  reviewNotes?: string;
}

export class RefundService {
  /**
   * Proposes a refund (PIC / Cashier / Staff).
   * Fully protected against concurrent race conditions via transaction row-locking.
   */
  async requestRefund(input: RequestRefundInput) {
    const {
      tenantId,
      transactionId,
      reason,
      requestedBy,
      requestedByName,
      requestedByRole,
    } = input;

    if (!reason || !reason.trim()) {
      throw new Error('Alasan refund wajib diisi');
    }

    // Execute inside atomic tenant transaction with row-locking
    return await withTenantTransaction(tenantId, async (tx) => {
      // 1. Lock original transaction row (FOR UPDATE)
      const txRecords = await tx
        .select()
        .from(canteenTransactions)
        .where(
          and(
            eq(canteenTransactions.tenantId, tenantId),
            eq(canteenTransactions.id, transactionId)
          )
        )
        .for('update');

      const txRecord = txRecords[0];
      if (!txRecord) {
        throw new Error('TRANSACTION_NOT_FOUND: Transaksi kantin tidak ditemukan');
      }

      if (txRecord.status !== 'SUCCESS') {
        throw new Error('INVALID_TRANSACTION_STATUS: Hanya transaksi SUCCESS yang dapat diajukan refund');
      }

      // 2. Lock and retrieve all existing non-rejected refunds for this transaction (FOR UPDATE)
      const existingRefunds = await tx
        .select()
        .from(canteenRefunds)
        .where(
          and(
            eq(canteenRefunds.tenantId, tenantId),
            eq(canteenRefunds.transactionId, transactionId),
            ne(canteenRefunds.status, 'REJECTED')
          )
        )
        .for('update');

      const totalPreviouslyCommitted = existingRefunds.reduce(
        (sum, r) => sum + r.refundAmount,
        0
      );

      const remainingRefundable = txRecord.amount - totalPreviouslyCommitted;
      if (remainingRefundable <= 0) {
        throw new Error('ALREADY_FULLY_REFUNDED: Transaksi ini sudah direfund sepenuhnya atau permohonan telah mencapai limit');
      }

      const targetRefundAmount =
        input.refundAmount !== undefined && input.refundAmount !== null
          ? input.refundAmount
          : remainingRefundable;

      if (
        typeof targetRefundAmount !== 'number' ||
        !Number.isInteger(targetRefundAmount) ||
        targetRefundAmount <= 0
      ) {
        throw new Error('Nominal refund harus berupa integer positif');
      }

      if (targetRefundAmount > remainingRefundable) {
        throw new Error(
          `EXCEEDS_REFUNDABLE_AMOUNT: Maksimal nominal refund untuk transaksi ini adalah Rp ${remainingRefundable.toLocaleString('id-ID')} (sudah diajukan/disetujui: Rp ${totalPreviouslyCommitted.toLocaleString('id-ID')})`
        );
      }

      const refundId = `ref_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      await tx.insert(canteenRefunds).values({
        id: refundId,
        tenantId,
        transactionId,
        canteenId: txRecord.canteenId || 'default',
        santriId: txRecord.santriId,
        originalAmount: txRecord.amount,
        refundAmount: targetRefundAmount,
        reason,
        status: 'PENDING_APPROVAL',
        requestedBy,
        requestedByName,
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Append financial audit log
      await financialAuditService.log(
        {
          tenantId,
          correlationId: txRecord.idempotencyKey || transactionId,
          actorId: requestedBy,
          actorName: requestedByName,
          actorRole: (requestedByRole as FinancialActorRole) || 'pic_kantin',
          action: 'REFUND_REQUEST',
          targetEntity: 'canteen_refund',
          targetId: refundId,
          amount: targetRefundAmount,
          stateBefore: { transactionAmount: txRecord.amount, previouslyRefunded: totalPreviouslyCommitted },
          stateAfter: { refundStatus: 'PENDING_APPROVAL', refundAmount: targetRefundAmount },
          status: 'SUCCESS',
          metadata: { reason, transactionId },
        },
        tx
      );

      return {
        success: true,
        message: 'Pengajuan refund berhasil dibuat dan menunggu persetujuan Admin Keuangan',
        data: {
          refundId,
          transactionId,
          refundAmount: targetRefundAmount,
          status: 'PENDING_APPROVAL',
        },
      };
    });
  }

  /**
   * Reviews and executes refund (Strictly Admin Keuangan / Super Admin).
   * Fully row-locked: immune to double approval and concurrent execution.
   */
  async reviewRefund(input: ReviewRefundInput) {
    const {
      tenantId,
      refundId,
      decision,
      reviewedBy,
      reviewedByName,
      reviewedByRole,
      reviewNotes,
    } = input;

    // Strict Role-Gate: Strictly Admin Keuangan ONLY on Phase 1 (Separation of Duties)
    const isAuthorized = reviewedByRole === 'admin_keuangan';

    if (!isAuthorized) {
      throw new Error(
        'UNAUTHORIZED_ROLE: Hanya Admin Keuangan yang berwenang menyetujui atau menolak refund (Tahap 1)'
      );
    }

    // Wrap the entire review and execution flow inside atomic transaction with row locking
    return await withTenantTransaction(tenantId, async (tx) => {
      // 1. Lock the refund record (FOR UPDATE)
      const refundRecords = await tx
        .select()
        .from(canteenRefunds)
        .where(
          and(
            eq(canteenRefunds.tenantId, tenantId),
            eq(canteenRefunds.id, refundId)
          )
        )
        .for('update');

      const refund = refundRecords[0];
      if (!refund) {
        throw new Error('REFUND_NOT_FOUND: Data pengajuan refund tidak ditemukan');
      }

      // Guard against double review/approval race condition
      if (refund.status !== 'PENDING_APPROVAL') {
        throw new Error(`INVALID_REFUND_STATUS: Refund sudah diproses sebelumnya dengan status ${refund.status}`);
      }

      // ── Handle REJECT ──
      if (decision === 'REJECT') {
        await tx
          .update(canteenRefunds)
          .set({
            status: 'REJECTED',
            reviewedBy,
            reviewedByName,
            reviewedAt: new Date(),
            reviewNotes: reviewNotes || 'Ditolak oleh Admin Keuangan',
            updatedAt: new Date(),
          })
          .where(and(eq(canteenRefunds.tenantId, tenantId), eq(canteenRefunds.id, refundId)));

        await financialAuditService.log(
          {
            tenantId,
            correlationId: refund.transactionId,
            actorId: reviewedBy,
            actorName: reviewedByName,
            actorRole: (reviewedByRole as FinancialActorRole) || 'admin_keuangan',
            action: 'REFUND_REJECTED',
            targetEntity: 'canteen_refund',
            targetId: refundId,
            amount: refund.refundAmount,
            stateBefore: { status: 'PENDING_APPROVAL' },
            stateAfter: { status: 'REJECTED', reviewNotes },
            status: 'SUCCESS',
            metadata: { reviewNotes },
          },
          tx
        );

        return {
          success: true,
          message: 'Pengajuan refund telah DITOLAK oleh Admin Keuangan',
          data: { refundId, status: 'REJECTED' },
        };
      }

      // ── Handle APPROVE ──
      // 2. Lock original transaction row (FOR UPDATE) to verify cumulative limit
      const txList = await tx
        .select()
        .from(canteenTransactions)
        .where(
          and(
            eq(canteenTransactions.tenantId, tenantId),
            eq(canteenTransactions.id, refund.transactionId)
          )
        )
        .for('update');

      const originalTx = txList[0];
      if (!originalTx) {
        throw new Error('TRANSACTION_NOT_FOUND: Transaksi asal tidak ditemukan');
      }

      // Re-verify cumulative approved refunds inside transaction
      const approvedRefunds = await tx
        .select()
        .from(canteenRefunds)
        .where(
          and(
            eq(canteenRefunds.tenantId, tenantId),
            eq(canteenRefunds.transactionId, refund.transactionId),
            eq(canteenRefunds.status, 'APPROVED')
          )
        )
        .for('update');

      const totalApproved = approvedRefunds.reduce((sum, r) => sum + r.refundAmount, 0);
      if (totalApproved + refund.refundAmount > originalTx.amount) {
        throw new Error(
          `CUMULATIVE_LIMIT_EXCEEDED: Total refund yang disetujui (Rp ${(totalApproved + refund.refundAmount).toLocaleString('id-ID')}) melebihi nominal transaksi (Rp ${originalTx.amount.toLocaleString('id-ID')})`
        );
      }

      // 3. Lock santri wallet (FOR UPDATE)
      const walletList = await tx
        .select()
        .from(wallets)
        .where(and(eq(wallets.tenantId, tenantId), eq(wallets.santriId, refund.santriId)))
        .for('update');

      const wallet = walletList[0];
      if (!wallet) {
        throw new Error('WALLET_NOT_FOUND: Dompet digital santri tidak ditemukan');
      }

      // 4. Credit Uang Saku directly (No Cash)
      const newUangSaku = wallet.balanceUangSaku + refund.refundAmount;
      const reversalTxId = `rev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

      await tx
        .update(wallets)
        .set({
          balanceUangSaku: newUangSaku,
          updatedAt: new Date(),
        })
        .where(and(eq(wallets.tenantId, tenantId), eq(wallets.id, wallet.id)));

      // 5. Append-Only Wallet Pockets Mutation Log
      await tx.insert(walletPockets).values({
        id: `mut_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        tenantId,
        walletId: wallet.id,
        pocketType: 'uang_saku',
        mutationType: 'canteen_refund',
        amount: refund.refundAmount,
        balanceBefore: wallet.balanceUangSaku,
        balanceAfter: newUangSaku,
        description: `Refund transaksi kantin: ${reviewNotes || refund.reason}`,
        referenceId: refund.transactionId,
        createdAt: new Date(),
      });

      // 6. Debit Merchant Hak Pendapatan
      await merchantLedgerService.recordDebitRefund(
        {
          tenantId,
          canteenId: refund.canteenId,
          amount: refund.refundAmount,
          refundId,
          description: `Pengurangan hak akibat refund transaksi ${refund.transactionId}`,
        },
        tx
      );

      // 7. Update Refund Status to APPROVED
      await tx
        .update(canteenRefunds)
        .set({
          status: 'APPROVED',
          reviewedBy,
          reviewedByName,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || 'Disetujui oleh Admin Keuangan',
          processedTransactionId: reversalTxId,
          updatedAt: new Date(),
        })
        .where(and(eq(canteenRefunds.tenantId, tenantId), eq(canteenRefunds.id, refundId)));

      // 8. Log Financial Audit Trail
      await financialAuditService.log(
        {
          tenantId,
          correlationId: refund.transactionId,
          actorId: reviewedBy,
          actorName: reviewedByName,
          actorRole: (reviewedByRole as FinancialActorRole) || 'admin_keuangan',
          action: 'REFUND_APPROVED',
          targetEntity: 'canteen_refund',
          targetId: refundId,
          amount: refund.refundAmount,
          stateBefore: {
            walletBalanceBefore: wallet.balanceUangSaku,
            refundStatus: 'PENDING_APPROVAL',
          },
          stateAfter: {
            walletBalanceAfter: newUangSaku,
            refundStatus: 'APPROVED',
            reversalTxId,
          },
          status: 'SUCCESS',
          metadata: {
            santriId: refund.santriId,
            transactionId: refund.transactionId,
            reviewNotes,
          },
        },
        tx
      );

      return {
        success: true,
        message: 'Refund telah DISETUJUI dan saldo uang saku santri berhasil dikembalikan',
        data: {
          refundId,
          status: 'APPROVED',
          refundAmount: refund.refundAmount,
          santriId: refund.santriId,
          newBalanceUangSaku: newUangSaku,
        },
      };
    });
  }

  /**
   * Retrieves refund list for a tenant.
   */
  async listRefunds(params: { tenantId: string; status?: string; canteenId?: string }) {
    const { tenantId, status, canteenId } = params;
    const extraConditions = [];
    if (status) extraConditions.push(eq(canteenRefunds.status, status));
    if (canteenId) extraConditions.push(eq(canteenRefunds.canteenId, canteenId));

    return await db
      .select()
      .from(canteenRefunds)
      .where(and(eq(canteenRefunds.tenantId, tenantId), ...extraConditions))
      .orderBy(eq(canteenRefunds.status, 'PENDING_APPROVAL'));
  }
}

export const refundService = new RefundService();
