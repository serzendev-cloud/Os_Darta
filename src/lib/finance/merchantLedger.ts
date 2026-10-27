// ==============================================================================
// Merchant Ledger Service (Hak Pendapatan Merchant & Central Escrow)
// Work Package: WP-M2-FINANCIAL-AUDIT-TRAIL-AND-DIGITAL-CCTV-001
// Compliance: PO Decisions 3, 4, MBD-001 (Unified Central Escrow)
// ==============================================================================

import crypto from 'crypto';
import { db } from '@/lib/db';
import { merchantLedger } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface RecordMerchantCreditInput {
  tenantId: string;
  canteenId: string;
  amount: number;
  transactionId: string;
  description?: string;
}

export interface RecordMerchantDebitInput {
  tenantId: string;
  canteenId: string;
  amount: number;
  refundId: string;
  description?: string;
}

export class MerchantLedgerService {
  /**
   * Retrieves the current accumulated balance of a merchant from the latest ledger entry.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getLatestBalance(tenantId: string, canteenId: string, txClient?: any): Promise<number> {
    const client = txClient || db;
    const latest = await client
      .select({ balanceAfter: merchantLedger.balanceAfter })
      .from(merchantLedger)
      .where(and(eq(merchantLedger.tenantId, tenantId), eq(merchantLedger.canteenId, canteenId)))
      .orderBy(desc(merchantLedger.createdAt))
      .limit(1);

    return latest[0]?.balanceAfter || 0;
  }

  /**
   * Credits merchant hak pendapatan upon successful canteen sale.
   */
  async recordCreditSale(
    input: RecordMerchantCreditInput,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    txClient?: any
  ): Promise<string> {
    const client = txClient || db;
    const currentBalance = await this.getLatestBalance(input.tenantId, input.canteenId, client);
    const newBalance = currentBalance + input.amount;
    const entryId = `ml_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    await client.insert(merchantLedger).values({
      id: entryId,
      tenantId: input.tenantId,
      canteenId: input.canteenId,
      entryType: 'CREDIT_SALE',
      amount: input.amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      referenceType: 'canteen_transaction',
      referenceId: input.transactionId,
      description: input.description || `Hak pendapatan transaksi ${input.transactionId}`,
      createdAt: new Date(),
    });

    return entryId;
  }

  /**
   * Debits merchant hak pendapatan upon approved refund.
   */
  async recordDebitRefund(
    input: RecordMerchantDebitInput,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    txClient?: any
  ): Promise<string> {
    const client = txClient || db;
    const currentBalance = await this.getLatestBalance(input.tenantId, input.canteenId, client);
    const newBalance = currentBalance - input.amount;
    const entryId = `ml_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    await client.insert(merchantLedger).values({
      id: entryId,
      tenantId: input.tenantId,
      canteenId: input.canteenId,
      entryType: 'DEBIT_REFUND',
      amount: input.amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      referenceType: 'canteen_refund',
      referenceId: input.refundId,
      description: input.description || `Pengurangan hak pendapatan akibat refund ${input.refundId}`,
      createdAt: new Date(),
    });

    return entryId;
  }

  /**
   * Summarizes merchant rights for a tenant across all or specific canteen.
   */
  async getSummary(tenantId: string, canteenId?: string) {
    const extraConditions = [];
    if (canteenId) {
      extraConditions.push(eq(merchantLedger.canteenId, canteenId));
    }

    const entries = await db
      .select()
      .from(merchantLedger)
      .where(and(eq(merchantLedger.tenantId, tenantId), ...extraConditions))
      .orderBy(desc(merchantLedger.createdAt));

    let totalCredits = 0;
    let totalDebits = 0;

    for (const e of entries) {
      if (e.entryType === 'CREDIT_SALE') {
        totalCredits += e.amount;
      } else if (e.entryType === 'DEBIT_REFUND' || e.entryType === 'DEBIT_WITHDRAWAL') {
        totalDebits += e.amount;
      }
    }

    return {
      totalGrossSales: totalCredits,
      totalRefunds: totalDebits,
      netMerchantEntitlement: totalCredits - totalDebits,
      ledgerEntriesCount: entries.length,
      latestEntries: entries.slice(0, 20),
    };
  }
}

export const merchantLedgerService = new MerchantLedgerService();
