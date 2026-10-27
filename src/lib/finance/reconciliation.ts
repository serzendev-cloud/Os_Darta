// ==============================================================================
// Automated Financial Reconciliation & Multi-Dimensional Anomaly Engine
// Work Package: WP-M2-FINANCIAL-AUDIT-TRAIL-AND-DIGITAL-CCTV-001
// Compliance: PO Decisions 3, 4, 5, 8 (Complete 4-Way Anomaly Detection)
// ==============================================================================

import crypto from 'crypto';
import { db } from '@/lib/db';
import {
  canteenTransactions,
  canteenTransactionItems,
  canteenRefunds,
  walletPockets,
  merchantLedger,
  wallets,
  financialReconciliationRuns,
  financialAnomalies,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { financialAuditService } from './auditTrail';

export interface RunReconciliationInput {
  tenantId: string;
  triggeredBy: string;
  runType?: 'AUTOMATED' | 'MANUAL';
}

export interface ResolveAnomalyInput {
  tenantId: string;
  anomalyId: string;
  resolvedBy: string;
  resolutionNotes: string;
  status?: 'RESOLVED' | 'FALSE_POSITIVE';
}

export interface DetectedAnomalyItem {
  type:
    | 'WALLET_TRANSACTION_MISMATCH'
    | 'MERCHANT_HAK_MISMATCH'
    | 'ORPHAN_WALLET_MUTATION'
    | 'ORPHAN_MERCHANT_CREDIT'
    | 'DUPLICATE_WALLET_DEBIT'
    | 'DUPLICATE_MERCHANT_CREDIT'
    | 'AMOUNT_MISMATCH_WALLET'
    | 'AMOUNT_MISMATCH_MERCHANT'
    | 'ITEMS_CATALOG_MISMATCH'
    | 'NEGATIVE_BALANCE_ATTEMPT'
    | 'OVER_REFUND_DETECTED'
    | 'MERCHANT_LEDGER_DRIFT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  entityType: string;
  entityId: string;
  amount: number;
  description: string;
}

export class ReconciliationEngine {
  /**
   * Executes comprehensive automated reconciliation covering:
   * 1. Entri Hilang (Orphan wallet deductions & orphan merchant credits)
   * 2. Entri Duplikat (Duplicate wallet debits & duplicate merchant credits)
   * 3. Nominal Tidak Cocok (Amount mismatches across wallet, items, & merchant)
   * 4. Ketidaksesuaian Saldo (Negative balance, over-refund, ledger drift)
   */
  async runReconciliation(input: RunReconciliationInput) {
    const { tenantId, triggeredBy, runType = 'AUTOMATED' } = input;
    const runId = `rec_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const startTime = new Date();

    // ── Data Gathering across all 5 ledgers for the tenant ───────────────────
    const transactions = await db
      .select()
      .from(canteenTransactions)
      .where(
        and(
          eq(canteenTransactions.tenantId, tenantId),
          eq(canteenTransactions.status, 'SUCCESS')
        )
      );

    const txItems = await db
      .select()
      .from(canteenTransactionItems)
      .where(eq(canteenTransactionItems.tenantId, tenantId));

    const pocketMutations = await db
      .select()
      .from(walletPockets)
      .where(
        and(
          eq(walletPockets.tenantId, tenantId),
          eq(walletPockets.mutationType, 'canteen_deduct')
        )
      );

    const merchantEntries = await db
      .select()
      .from(merchantLedger)
      .where(
        and(
          eq(merchantLedger.tenantId, tenantId),
          eq(merchantLedger.entryType, 'CREDIT_SALE')
        )
      );

    const approvedRefunds = await db
      .select()
      .from(canteenRefunds)
      .where(
        and(
          eq(canteenRefunds.tenantId, tenantId),
          eq(canteenRefunds.status, 'APPROVED')
        )
      );

    const allWallets = await db
      .select()
      .from(wallets)
      .where(eq(wallets.tenantId, tenantId));

    const detectedAnomalies: DetectedAnomalyItem[] = [];
    let totalAmountChecked = 0;

    // ── Indexing data for fast O(1) multi-directional verification ───────────
    const txMap = new Map<string, typeof canteenTransactions.$inferSelect>();
    for (const tx of transactions) {
      txMap.set(tx.id, tx);
      totalAmountChecked += tx.amount;
    }

    // Map wallet pockets by referenceId (supporting duplicate detection)
    const pocketGroups = new Map<string, Array<typeof walletPockets.$inferSelect>>();
    for (const p of pocketMutations) {
      if (p.referenceId) {
        const list = pocketGroups.get(p.referenceId) || [];
        list.push(p);
        pocketGroups.set(p.referenceId, list);
      }
    }

    // Map merchant ledger by referenceId (supporting duplicate detection)
    const merchantGroups = new Map<string, Array<typeof merchantLedger.$inferSelect>>();
    for (const m of merchantEntries) {
      if (m.referenceId) {
        const list = merchantGroups.get(m.referenceId) || [];
        list.push(m);
        merchantGroups.set(m.referenceId, list);
      }
    }

    // Group items by transactionId
    const itemsGroup = new Map<string, Array<typeof canteenTransactionItems.$inferSelect>>();
    for (const itm of txItems) {
      const list = itemsGroup.get(itm.transactionId) || [];
      list.push(itm);
      itemsGroup.set(itm.transactionId, list);
    }

    // Group approved refunds by transactionId
    const refundGroups = new Map<string, Array<typeof canteenRefunds.$inferSelect>>();
    for (const ref of approvedRefunds) {
      const list = refundGroups.get(ref.transactionId) || [];
      list.push(ref);
      refundGroups.set(ref.transactionId, list);
    }

    // ── 1. Forward Verification: Transactions -> Pockets & Merchant & Items ──
    for (const tx of transactions) {
      // 1A. Check Wallet Pockets Missing or Duplicated
      const pockets = pocketGroups.get(tx.id);
      if (!pockets || pockets.length === 0) {
        detectedAnomalies.push({
          type: 'WALLET_TRANSACTION_MISMATCH',
          severity: 'CRITICAL',
          entityType: 'canteen_transaction',
          entityId: tx.id,
          amount: tx.amount,
          description: `Transaksi ${tx.id} senilai Rp ${tx.amount.toLocaleString('id-ID')} tidak memiliki mutasi pemotongan dompet santri`,
        });
      } else if (pockets.length > 1) {
        // Duplicate debit for a single transaction
        const totalDebited = pockets.reduce((sum, p) => sum + p.amount, 0);
        detectedAnomalies.push({
          type: 'DUPLICATE_WALLET_DEBIT',
          severity: 'CRITICAL',
          entityType: 'canteen_transaction',
          entityId: tx.id,
          amount: totalDebited - tx.amount,
          description: `Terdeteksi ${pockets.length} mutasi pemotongan dompet ganda untuk transaksi tunggal ${tx.id} (Total didebit: Rp ${totalDebited.toLocaleString('id-ID')})`,
        });
      } else {
        // Check amount match
        const singlePocket = pockets[0];
        if (singlePocket.amount !== tx.amount) {
          detectedAnomalies.push({
            type: 'AMOUNT_MISMATCH_WALLET',
            severity: 'HIGH',
            entityType: 'canteen_transaction',
            entityId: tx.id,
            amount: Math.abs(singlePocket.amount - tx.amount),
            description: `Nominal transaksi ${tx.id} (Rp ${tx.amount.toLocaleString('id-ID')}) tidak cocok dengan nominal pemotongan dompet (Rp ${singlePocket.amount.toLocaleString('id-ID')})`,
          });
        }
      }

      // 1B. Check Merchant Ledger Missing or Duplicated
      const merchants = merchantGroups.get(tx.id);
      if (!merchants || merchants.length === 0) {
        detectedAnomalies.push({
          type: 'MERCHANT_HAK_MISMATCH',
          severity: 'HIGH',
          entityType: 'canteen_transaction',
          entityId: tx.id,
          amount: tx.amount,
          description: `Transaksi ${tx.id} senilai Rp ${tx.amount.toLocaleString('id-ID')} belum dicatat ke buku hak pendapatan merchant`,
        });
      } else if (merchants.length > 1) {
        // Duplicate merchant credit
        const totalCredited = merchants.reduce((sum, m) => sum + m.amount, 0);
        detectedAnomalies.push({
          type: 'DUPLICATE_MERCHANT_CREDIT',
          severity: 'HIGH',
          entityType: 'canteen_transaction',
          entityId: tx.id,
          amount: totalCredited - tx.amount,
          description: `Terdeteksi ${merchants.length} kredit hak pendapatan ganda untuk transaksi tunggal ${tx.id}`,
        });
      } else {
        const singleMerchant = merchants[0];
        if (singleMerchant.amount !== tx.amount) {
          detectedAnomalies.push({
            type: 'AMOUNT_MISMATCH_MERCHANT',
            severity: 'HIGH',
            entityType: 'canteen_transaction',
            entityId: tx.id,
            amount: Math.abs(singleMerchant.amount - tx.amount),
            description: `Nominal hak merchant pada transaksi ${tx.id} tidak cocok (Kredit: Rp ${singleMerchant.amount.toLocaleString('id-ID')}, Transaksi: Rp ${tx.amount.toLocaleString('id-ID')})`,
          });
        }
      }

      // 1C. Check Line Items subtotal sum vs Transaction amount
      const items = itemsGroup.get(tx.id);
      if (items && items.length > 0) {
        const itemsTotal = items.reduce((sum, itm) => sum + itm.subtotal, 0);
        if (itemsTotal !== tx.amount) {
          detectedAnomalies.push({
            type: 'ITEMS_CATALOG_MISMATCH',
            severity: 'MEDIUM',
            entityType: 'canteen_transaction',
            entityId: tx.id,
            amount: Math.abs(itemsTotal - tx.amount),
            description: `Total rincian barang transaksi ${tx.id} (Rp ${itemsTotal.toLocaleString('id-ID')}) tidak sesuai nominal header transaksi (Rp ${tx.amount.toLocaleString('id-ID')})`,
          });
        }
      }

      // 1D. Check Over-Refund Detection
      const refunds = refundGroups.get(tx.id);
      if (refunds && refunds.length > 0) {
        const totalRefunded = refunds.reduce((sum, r) => sum + r.refundAmount, 0);
        if (totalRefunded > tx.amount) {
          detectedAnomalies.push({
            type: 'OVER_REFUND_DETECTED',
            severity: 'CRITICAL',
            entityType: 'canteen_transaction',
            entityId: tx.id,
            amount: totalRefunded - tx.amount,
            description: `Total refund disetujui pada transaksi ${tx.id} (Rp ${totalRefunded.toLocaleString('id-ID')}) melebihi nominal transaksi (Rp ${tx.amount.toLocaleString('id-ID')})`,
          });
        }
      }
    }

    // ── 2. Reverse Verification: Orphan Wallet Deductions ────────────────────
    for (const pocket of pocketMutations) {
      if (pocket.referenceId && !txMap.has(pocket.referenceId)) {
        detectedAnomalies.push({
          type: 'ORPHAN_WALLET_MUTATION',
          severity: 'CRITICAL',
          entityType: 'wallet_pocket',
          entityId: pocket.id,
          amount: pocket.amount,
          description: `Mutasi pemotongan dompet ${pocket.id} senilai Rp ${pocket.amount.toLocaleString('id-ID')} tidak memiliki transaksi kantin yang sah (referenceId: ${pocket.referenceId})`,
        });
      }
    }

    // ── 3. Reverse Verification: Orphan Merchant Credits ─────────────────────
    for (const merchantEntry of merchantEntries) {
      if (
        merchantEntry.referenceId &&
        merchantEntry.referenceType === 'canteen_transaction' &&
        !txMap.has(merchantEntry.referenceId)
      ) {
        detectedAnomalies.push({
          type: 'ORPHAN_MERCHANT_CREDIT',
          severity: 'HIGH',
          entityType: 'merchant_ledger',
          entityId: merchantEntry.id,
          amount: merchantEntry.amount,
          description: `Kredit hak pendapatan merchant ${merchantEntry.id} senilai Rp ${merchantEntry.amount.toLocaleString('id-ID')} merujuk transaksi yang tidak ditemukan`,
        });
      }
    }

    // ── 4. Wallet Integrity: Negative Balance Detection ──────────────────────
    for (const w of allWallets) {
      if (w.balanceUangSaku < 0) {
        detectedAnomalies.push({
          type: 'NEGATIVE_BALANCE_ATTEMPT',
          severity: 'CRITICAL',
          entityType: 'wallet',
          entityId: w.id,
          amount: Math.abs(w.balanceUangSaku),
          description: `Dompet santri ${w.santriId} mengalami saldo negatif: Rp ${w.balanceUangSaku.toLocaleString('id-ID')}`,
        });
      }
    }

    // ── 5. Merchant Ledger Drift Verification ────────────────────────────────
    const allMerchantEntries = await db
      .select()
      .from(merchantLedger)
      .where(eq(merchantLedger.tenantId, tenantId))
      .orderBy(merchantLedger.createdAt);

    let runningMerchantBalance = 0;
    for (const me of allMerchantEntries) {
      const delta =
        me.entryType === 'CREDIT_SALE' ? me.amount : -me.amount;
      const expectedBalance = runningMerchantBalance + delta;
      if (me.balanceAfter !== expectedBalance) {
        detectedAnomalies.push({
          type: 'MERCHANT_LEDGER_DRIFT',
          severity: 'HIGH',
          entityType: 'merchant_ledger',
          entityId: me.id,
          amount: Math.abs(me.balanceAfter - expectedBalance),
          description: `Inkonsistensi saldo berjalan pada buku merchant entri ${me.id}: tercatat Rp ${me.balanceAfter.toLocaleString('id-ID')}, kalkulasi seharusnya Rp ${expectedBalance.toLocaleString('id-ID')}`,
        });
      }
      runningMerchantBalance = expectedBalance;
    }

    // ── 6. Persist Anomalies to DB (Preventing Duplicate Open Anomalies) ─────
    for (const anom of detectedAnomalies) {
      const existing = await db
        .select()
        .from(financialAnomalies)
        .where(
          and(
            eq(financialAnomalies.tenantId, tenantId),
            eq(financialAnomalies.relatedEntityId, anom.entityId),
            eq(financialAnomalies.anomalyType, anom.type),
            eq(financialAnomalies.status, 'OPEN')
          )
        );

      if (existing.length === 0) {
        const anomalyId = `anom_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        await db.insert(financialAnomalies).values({
          id: anomalyId,
          tenantId,
          reconciliationRunId: runId,
          anomalyType: anom.type,
          severity: anom.severity,
          status: 'OPEN',
          relatedEntityType: anom.entityType,
          relatedEntityId: anom.entityId,
          discrepancyAmount: anom.amount,
          description: anom.description,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    const runStatus =
      detectedAnomalies.length > 0 ? 'DISCREPANCY_DETECTED' : 'COMPLETED';

    // Persist Reconciliation Run Record
    await db.insert(financialReconciliationRuns).values({
      id: runId,
      tenantId,
      runType,
      triggeredBy,
      status: runStatus,
      totalTransactionsChecked: transactions.length,
      totalAmountChecked,
      discrepanciesCount: detectedAnomalies.length,
      summary: {
        totalTransactions: transactions.length,
        totalPocketMutations: pocketMutations.length,
        totalMerchantEntries: merchantEntries.length,
        anomaliesCount: detectedAnomalies.length,
        breakdownByType: detectedAnomalies.reduce(
          (acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        durationMs: Date.now() - startTime.getTime(),
      },
      startedAt: startTime,
      completedAt: new Date(),
    });

    // Append Immutable Audit Log
    await financialAuditService.log({
      tenantId,
      actorId: triggeredBy,
      actorName:
        triggeredBy === 'system' ? 'Automated Cron Engine' : 'Admin Keuangan',
      actorRole: triggeredBy === 'system' ? 'system' : 'admin_keuangan',
      action: 'RECONCILIATION_RUN',
      targetEntity: 'reconciliation',
      targetId: runId,
      amount: totalAmountChecked,
      status: runStatus === 'COMPLETED' ? 'SUCCESS' : 'FAILED',
      metadata: {
        runType,
        totalTransactionsChecked: transactions.length,
        discrepanciesCount: detectedAnomalies.length,
      },
    });

    return {
      runId,
      status: runStatus,
      totalTransactionsChecked: transactions.length,
      totalAmountChecked,
      discrepanciesCount: detectedAnomalies.length,
      anomalies: detectedAnomalies,
    };
  }

  /**
   * Resolves or closes an anomaly case with audit trail.
   */
  async resolveAnomaly(input: ResolveAnomalyInput) {
    const { tenantId, anomalyId, resolvedBy, resolutionNotes, status = 'RESOLVED' } = input;

    const anomalyList = await db
      .select()
      .from(financialAnomalies)
      .where(and(eq(financialAnomalies.tenantId, tenantId), eq(financialAnomalies.id, anomalyId)));

    const anomaly = anomalyList[0];
    if (!anomaly) {
      throw new Error('ANOMALY_NOT_FOUND: Kasus anomali tidak ditemukan');
    }

    await db
      .update(financialAnomalies)
      .set({
        status,
        resolutionNotes,
        resolvedBy,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(financialAnomalies.tenantId, tenantId), eq(financialAnomalies.id, anomalyId)));

    await financialAuditService.log({
      tenantId,
      actorId: resolvedBy,
      actorName: 'Admin Keuangan',
      actorRole: 'admin_keuangan',
      action: 'ANOMALY_RESOLVED',
      targetEntity: 'reconciliation',
      targetId: anomalyId,
      amount: anomaly.discrepancyAmount,
      stateBefore: { status: anomaly.status },
      stateAfter: { status, resolutionNotes },
      status: 'SUCCESS',
      metadata: { resolutionNotes },
    });

    return { success: true, message: 'Kasus anomali berhasil diselesaikan' };
  }

  /**
   * Lists reconciliation runs and open anomaly cases.
   */
  async getDashboardData(tenantId: string) {
    const runs = await db
      .select()
      .from(financialReconciliationRuns)
      .where(eq(financialReconciliationRuns.tenantId, tenantId))
      .orderBy(desc(financialReconciliationRuns.startedAt))
      .limit(10);

    const anomalies = await db
      .select()
      .from(financialAnomalies)
      .where(eq(financialAnomalies.tenantId, tenantId))
      .orderBy(desc(financialAnomalies.createdAt))
      .limit(50);

    return { runs, anomalies };
  }
}

export const reconciliationEngine = new ReconciliationEngine();
