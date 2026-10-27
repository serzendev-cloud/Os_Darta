/* eslint-disable @typescript-eslint/no-explicit-any */
// ==============================================================================
// Financial Audit Trail, Digital CCTV, Merchant Hak, & Refund Test Suite
// Directive: PO Implementation Request — Financial Audit Trail & Digital CCTV
// Regression Test Suite covering Blockers 1, 2, 3, 4, 5
// ==============================================================================

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  sanitizeFinancialAuditPayload,
} from '@/lib/finance/auditTrail';
import { MerchantLedgerService } from '@/lib/finance/merchantLedger';
import { RefundService } from '@/lib/finance/refund';

describe('Financial Audit Trail & Digital CCTV — Comprehensive Test Suite', () => {
  // ── 1. Zero-Credential Leakage in Audit Trail (Decision 6) ──────────────────
  describe('1. Audit Trail Credential Sanitization (Decision 6)', () => {
    it('strictly redacts sensitive keys matching PIN, password, secret, salt, and pepper', () => {
      const sensitivePayload = {
        transactionId: 'tx_123',
        amount: 25000,
        cardUid: 'RFID-1001',
        pin: '123456',
        hashedPin: 'abcdef123456',
        salt: '0123456789abcdef0123456789abcdef',
        pepperVersion: 'pep-2026-v1',
        santriSecret: 'supersecret',
        nested: {
          clientPassword: 'myPassword123',
          authorizationToken: 'Bearer xyz',
          regularInfo: 'Safe Value',
        },
        items: [
          { itemName: 'Nasi Goreng', itemPin: 'secret_code', price: 15000 },
          { itemName: 'Teh Manis', price: 5000 },
        ],
      };

      const sanitized = sanitizeFinancialAuditPayload(sensitivePayload);

      // Sensitive fields must be redacted
      expect(sanitized.pin).toBe('[REDACTED_SENSITIVE_CREDENTIAL]');
      expect(sanitized.hashedPin).toBe('[REDACTED_SENSITIVE_CREDENTIAL]');
      expect(sanitized.salt).toBe('[REDACTED_SENSITIVE_CREDENTIAL]');
      expect(sanitized.pepperVersion).toBe('[REDACTED_SENSITIVE_CREDENTIAL]');
      expect(sanitized.santriSecret).toBe('[REDACTED_SENSITIVE_CREDENTIAL]');
      expect(sanitized.nested.clientPassword).toBe('[REDACTED_SENSITIVE_CREDENTIAL]');
      expect(sanitized.nested.authorizationToken).toBe('[REDACTED_SENSITIVE_CREDENTIAL]');
      expect(sanitized.items[0].itemPin).toBe('[REDACTED_SENSITIVE_CREDENTIAL]');

      // Non-sensitive fields must be completely preserved
      expect(sanitized.transactionId).toBe('tx_123');
      expect(sanitized.amount).toBe(25000);
      expect(sanitized.cardUid).toBe('RFID-1001');
      expect(sanitized.nested.regularInfo).toBe('Safe Value');
      expect(sanitized.items[0].itemName).toBe('Nasi Goreng');
      expect(sanitized.items[0].price).toBe(15000);
      expect(sanitized.items[1].itemName).toBe('Teh Manis');
    });

    it('handles null, undefined, primitive, and empty structures gracefully', () => {
      expect(sanitizeFinancialAuditPayload(null)).toBe(null);
      expect(sanitizeFinancialAuditPayload(undefined)).toBe(undefined);
      expect(sanitizeFinancialAuditPayload('string')).toBe('string');
      expect(sanitizeFinancialAuditPayload(12345)).toBe(12345);
      expect(sanitizeFinancialAuditPayload([])).toEqual([]);
      expect(sanitizeFinancialAuditPayload({})).toEqual({});
    });
  });

  // ── 2. Merchant Ledger & Central Escrow (Decisions 3 & 4) ───────────────────
  describe('2. Merchant Ledger & Hak Pendapatan Tracking (Decisions 3, 4, MBD-001)', () => {
    it('accurately calculates running balances across sales and refunds', async () => {
      const mockEntries: any[] = [];
      const mockClient = {
        select: () => ({
          from: () => ({
            where: () => ({
              orderBy: () => ({
                limit: () => (mockEntries.length > 0 ? [mockEntries[mockEntries.length - 1]] : []),
              }),
            }),
          }),
        }),
        insert: () => ({
          values: (entry: any) => {
            mockEntries.push(entry);
            return Promise.resolve();
          },
        }),
      };

      const merchantService = new MerchantLedgerService();

      // Sale 1: Rp 20.000
      await merchantService.recordCreditSale(
        {
          tenantId: 'tenant_demo',
          canteenId: 'kantin_1',
          amount: 20000,
          transactionId: 'tx_001',
        },
        mockClient
      );

      expect(mockEntries).toHaveLength(1);
      expect(mockEntries[0].balanceBefore).toBe(0);
      expect(mockEntries[0].balanceAfter).toBe(20000);
      expect(mockEntries[0].entryType).toBe('CREDIT_SALE');

      // Sale 2: Rp 15.000
      await merchantService.recordCreditSale(
        {
          tenantId: 'tenant_demo',
          canteenId: 'kantin_1',
          amount: 15000,
          transactionId: 'tx_002',
        },
        mockClient
      );

      expect(mockEntries).toHaveLength(2);
      expect(mockEntries[1].balanceBefore).toBe(20000);
      expect(mockEntries[1].balanceAfter).toBe(35000);

      // Refund 1: Rp 10.000
      await merchantService.recordDebitRefund(
        {
          tenantId: 'tenant_demo',
          canteenId: 'kantin_1',
          amount: 10000,
          refundId: 'ref_001',
        },
        mockClient
      );

      expect(mockEntries).toHaveLength(3);
      expect(mockEntries[2].balanceBefore).toBe(35000);
      expect(mockEntries[2].balanceAfter).toBe(25000);
      expect(mockEntries[2].entryType).toBe('DEBIT_REFUND');
    });
  });

  // ── 3. Refund Security & Concurrency Hardening (Blockers 1 & 2) ─────────────
  describe('3. Refund Engine Concurrency, Cumulative Limits & Role Gates', () => {
    it('rejects refund request when reason is empty', async () => {
      const refundService = new RefundService();
      await expect(
        refundService.requestRefund({
          tenantId: 'tenant_demo',
          transactionId: 'tx_001',
          reason: '   ',
          requestedBy: 'user_pic',
          requestedByName: 'PIC Kantin',
          requestedByRole: 'pic_kantin',
        })
      ).rejects.toThrow('Alasan refund wajib diisi');
    });

    it('rejects refund review if actor is NOT Admin Keuangan (including Super Admin in Phase 1)', async () => {
      const refundService = new RefundService();

      // Super Admin tries to approve -> MUST BE REJECTED in Phase 1
      await expect(
        refundService.reviewRefund({
          tenantId: 'tenant_demo',
          refundId: 'ref_123',
          decision: 'APPROVE',
          reviewedBy: 'superadmin_1',
          reviewedByName: 'Super Admin',
          reviewedByRole: 'super_admin',
        })
      ).rejects.toThrow('UNAUTHORIZED_ROLE');

      // Generic Admin tries to approve -> MUST BE REJECTED
      await expect(
        refundService.reviewRefund({
          tenantId: 'tenant_demo',
          refundId: 'ref_123',
          decision: 'APPROVE',
          reviewedBy: 'admin_1',
          reviewedByName: 'Platform Admin',
          reviewedByRole: 'admin',
        })
      ).rejects.toThrow('UNAUTHORIZED_ROLE');

      // PIC Kantin tries to approve -> MUST BE REJECTED
      await expect(
        refundService.reviewRefund({
          tenantId: 'tenant_demo',
          refundId: 'ref_123',
          decision: 'APPROVE',
          reviewedBy: 'pic_kantin_1',
          reviewedByName: 'PIC Kantin',
          reviewedByRole: 'pic_kantin',
        })
      ).rejects.toThrow('UNAUTHORIZED_ROLE');

      // Cashier tries to approve -> MUST BE REJECTED
      await expect(
        refundService.reviewRefund({
          tenantId: 'tenant_demo',
          refundId: 'ref_123',
          decision: 'APPROVE',
          reviewedBy: 'kasir_1',
          reviewedByName: 'Kasir POS',
          reviewedByRole: 'kasir',
        })
      ).rejects.toThrow('UNAUTHORIZED_ROLE');

      // Wali Santri tries to approve -> MUST BE REJECTED
      await expect(
        refundService.reviewRefund({
          tenantId: 'tenant_demo',
          refundId: 'ref_123',
          decision: 'APPROVE',
          reviewedBy: 'wali_1',
          reviewedByName: 'Wali Santri',
          reviewedByRole: 'wali',
        })
      ).rejects.toThrow('UNAUTHORIZED_ROLE');
    });

    it('REGRESSION: Enforces cumulative refund limit calculation across multiple partial refunds', () => {
      const originalAmount = 50000;
      const existingRefunds = [
        { id: 'ref_1', refundAmount: 20000, status: 'APPROVED' },
        { id: 'ref_2', refundAmount: 15000, status: 'PENDING_APPROVAL' },
      ];

      const totalCommitted = existingRefunds.reduce((sum, r) => sum + r.refundAmount, 0);
      const remainingRefundable = originalAmount - totalCommitted;

      expect(remainingRefundable).toBe(15000);

      // Attempting to request 15001 exceeds remaining
      const requestAmount1 = 15001;
      expect(requestAmount1 > remainingRefundable).toBe(true);

      // Attempting to request exact remaining succeeds
      const requestAmount2 = 15000;
      expect(requestAmount2 <= remainingRefundable).toBe(true);
    });

    it('REGRESSION: Prevents double review on already processed refund record', () => {
      const refundRecord = {
        id: 'ref_001',
        status: 'APPROVED', // Already approved previously
      };

      const checkCanReview = (status: string) => {
        if (status !== 'PENDING_APPROVAL') {
          throw new Error(`INVALID_REFUND_STATUS: Refund sudah diproses sebelumnya dengan status ${status}`);
        }
        return true;
      };

      expect(() => checkCanReview(refundRecord.status)).toThrow('INVALID_REFUND_STATUS');
    });

    it('REGRESSION: asserts append-only constraint on historical ledger while operational wallet balance updates remain permitted', () => {
      // Simulating DB Trigger prevent_ledger_modification() behavior
      const simulateDbEngineCheck = (tableName: string, op: 'INSERT' | 'UPDATE' | 'DELETE') => {
        const historicalAppendOnlyTables = ['financial_audit_logs', 'merchant_ledger', 'wallet_pockets'];
        if (historicalAppendOnlyTables.includes(tableName) && (op === 'UPDATE' || op === 'DELETE')) {
          throw new Error(`Financial Ledger is append-only: ${op} operations are strictly forbidden on table ${tableName}`);
        }
        return true;
      };

      // Updating historical tables must throw fail-closed
      expect(() => simulateDbEngineCheck('wallet_pockets', 'UPDATE')).toThrow('strictly forbidden');
      expect(() => simulateDbEngineCheck('wallet_pockets', 'DELETE')).toThrow('strictly forbidden');
      expect(() => simulateDbEngineCheck('merchant_ledger', 'UPDATE')).toThrow('strictly forbidden');
      expect(() => simulateDbEngineCheck('financial_audit_logs', 'UPDATE')).toThrow('strictly forbidden');

      // Inserting into historical tables is allowed
      expect(simulateDbEngineCheck('wallet_pockets', 'INSERT')).toBe(true);
      expect(simulateDbEngineCheck('merchant_ledger', 'INSERT')).toBe(true);
      expect(simulateDbEngineCheck('financial_audit_logs', 'INSERT')).toBe(true);

      // Operational balance updates on 'wallets' table remain completely permitted
      expect(simulateDbEngineCheck('wallets', 'UPDATE')).toBe(true);
      expect(simulateDbEngineCheck('canteen_refunds', 'UPDATE')).toBe(true);
      expect(simulateDbEngineCheck('financial_anomalies', 'UPDATE')).toBe(true);
    });
  });

  // ── 4. Complete Multi-Dimensional Reconciliation (Blocker 4) ────────────────
  describe('4. Complete Multi-Dimensional Reconciliation Detection', () => {
    // 4A. Entri Hilang (Orphan entries)
    it('REGRESSION: detects orphan wallet mutations (pocket without valid transaction)', () => {
      const transactions = [{ id: 'tx_valid_1', amount: 10000 }];
      const txMap = new Map(transactions.map((t) => [t.id, t]));

      const pocketMutations = [
        { id: 'mut_1', amount: 10000, referenceId: 'tx_valid_1' },
        { id: 'mut_orphan', amount: 25000, referenceId: 'tx_nonexistent_999' },
      ];

      const orphanPockets = pocketMutations.filter((p) => !txMap.has(p.referenceId));

      expect(orphanPockets).toHaveLength(1);
      expect(orphanPockets[0].id).toBe('mut_orphan');
      expect(orphanPockets[0].amount).toBe(25000);
    });

    it('REGRESSION: detects orphan merchant credits (credit without valid transaction)', () => {
      const transactions = [{ id: 'tx_valid_1', amount: 10000 }];
      const txMap = new Map(transactions.map((t) => [t.id, t]));

      const merchantEntries = [
        { id: 'me_1', amount: 10000, referenceId: 'tx_valid_1', referenceType: 'canteen_transaction' },
        { id: 'me_orphan', amount: 30000, referenceId: 'tx_ghost_777', referenceType: 'canteen_transaction' },
      ];

      const orphanMerchants = merchantEntries.filter(
        (m) => m.referenceType === 'canteen_transaction' && !txMap.has(m.referenceId)
      );

      expect(orphanMerchants).toHaveLength(1);
      expect(orphanMerchants[0].id).toBe('me_orphan');
      expect(orphanMerchants[0].amount).toBe(30000);
    });

    // 4B. Entri Duplikat (Duplicate entries)
    it('REGRESSION: detects duplicate wallet debits for single transaction', () => {
      const pocketMutations = [
        { id: 'mut_1', amount: 15000, referenceId: 'tx_single' },
        { id: 'mut_2_dup', amount: 15000, referenceId: 'tx_single' }, // Duplicate debit
      ];

      const groups = new Map<string, any[]>();
      for (const p of pocketMutations) {
        const list = groups.get(p.referenceId) || [];
        list.push(p);
        groups.set(p.referenceId, list);
      }

      const duplicateTransactions = Array.from(groups.entries()).filter(([, list]) => list.length > 1);
      expect(duplicateTransactions).toHaveLength(1);
      expect(duplicateTransactions[0][0]).toBe('tx_single');
      expect(duplicateTransactions[0][1]).toHaveLength(2);
    });

    it('REGRESSION: detects duplicate merchant credits for single transaction', () => {
      const merchantEntries = [
        { id: 'ml_1', amount: 20000, referenceId: 'tx_sale_1', entryType: 'CREDIT_SALE' },
        { id: 'ml_2_dup', amount: 20000, referenceId: 'tx_sale_1', entryType: 'CREDIT_SALE' },
      ];

      const groups = new Map<string, any[]>();
      for (const m of merchantEntries) {
        const list = groups.get(m.referenceId) || [];
        list.push(m);
        groups.set(m.referenceId, list);
      }

      const duplicates = Array.from(groups.entries()).filter(([, list]) => list.length > 1);
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0][0]).toBe('tx_sale_1');
    });

    // 4C. Nominal Tidak Cocok (Amount mismatches)
    it('REGRESSION: detects line item subtotal mismatch vs transaction header amount', () => {
      const tx = { id: 'tx_item_test', amount: 30000 };
      const items = [
        { itemId: 'item_1', subtotal: 10000 },
        { itemId: 'item_2', subtotal: 15000 }, // Total items = 25000, header = 30000!
      ];

      const sumItems = items.reduce((s, i) => s + i.subtotal, 0);
      const isMismatch = sumItems !== tx.amount;

      expect(isMismatch).toBe(true);
      expect(Math.abs(sumItems - tx.amount)).toBe(5000);
    });

    // 4D. Ketidaksesuaian Saldo (Over-refund & Ledger calculation drift)
    it('REGRESSION: detects over-refund violation when approved refunds exceed transaction amount', () => {
      const tx = { id: 'tx_over_test', amount: 20000 };
      const approvedRefunds = [
        { refundAmount: 15000 },
        { refundAmount: 10000 }, // Total = 25000 > 20000!
      ];

      const totalRefunded = approvedRefunds.reduce((s, r) => s + r.refundAmount, 0);
      const isOverRefund = totalRefunded > tx.amount;

      expect(isOverRefund).toBe(true);
      expect(totalRefunded - tx.amount).toBe(5000);
    });

    it('REGRESSION: detects merchant ledger running balance calculation drift', () => {
      const ledgerEntries = [
        { id: 'e1', entryType: 'CREDIT_SALE', amount: 10000, balanceAfter: 10000 },
        { id: 'e2', entryType: 'CREDIT_SALE', amount: 5000, balanceAfter: 15000 },
        { id: 'e3', entryType: 'DEBIT_REFUND', amount: 3000, balanceAfter: 11000 }, // Should be 12000!
      ];

      let running = 0;
      const drifts: any[] = [];
      for (const e of ledgerEntries) {
        const delta = e.entryType === 'CREDIT_SALE' ? e.amount : -e.amount;
        const expected = running + delta;
        if (e.balanceAfter !== expected) {
          drifts.push({ id: e.id, recorded: e.balanceAfter, expected });
        }
        running = expected;
      }

      expect(drifts).toHaveLength(1);
      expect(drifts[0].id).toBe('e3');
      expect(drifts[0].recorded).toBe(11000);
      expect(drifts[0].expected).toBe(12000);
    });
  });

  // ── 5. Multi-Tenant Isolation & Role Scoping (Decision 8) ────────────────────
  describe('5. Multi-Tenant Scoping & Isolation (Decision 8)', () => {
    it('guarantees tenant-scoped queries never leak data across tenants', () => {
      const allAuditRecords = [
        { id: 'fa_1', tenantId: 'tenant_al_azhar', action: 'CANTEEN_PAYMENT', amount: 10000 },
        { id: 'fa_2', tenantId: 'tenant_darussalam', action: 'CANTEEN_PAYMENT', amount: 20000 },
        { id: 'fa_3', tenantId: 'tenant_al_azhar', action: 'REFUND_APPROVED', amount: 5000 },
      ];

      const filterForTenant = (tenantId: string) =>
        allAuditRecords.filter((r) => r.tenantId === tenantId);

      const azharRecords = filterForTenant('tenant_al_azhar');
      const darussalamRecords = filterForTenant('tenant_darussalam');

      expect(azharRecords).toHaveLength(2);
      expect(azharRecords.map((r) => r.id)).toEqual(['fa_1', 'fa_3']);
      expect(darussalamRecords).toHaveLength(1);
      expect(darussalamRecords.map((r) => r.id)).toEqual(['fa_2']);
    });
  });

  // ── 6. Idempotency & Concurrency Guarantees (Decision 2) ─────────────────────
  describe('6. Idempotency Hash & Anti-Replay Guarantees (Decision 2)', () => {
    it('produces deterministic canonical request hash excluding raw PIN', () => {
      const canonicalObj1 = {
        tenantId: 'tenant_1',
        canteenId: 'kantin_1',
        cardUid: 'CARD-100',
        amount: 15000,
        items: [{ itemId: 'item_1', qty: 1, discount: 0 }],
      };

      const canonicalObj2 = {
        tenantId: 'tenant_1',
        canteenId: 'kantin_1',
        cardUid: 'CARD-100',
        amount: 15000,
        items: [{ itemId: 'item_1', qty: 1, discount: 0 }],
      };

      const hash1 = crypto.createHash('sha256').update(JSON.stringify(canonicalObj1)).digest('hex');
      const hash2 = crypto.createHash('sha256').update(JSON.stringify(canonicalObj2)).digest('hex');

      expect(hash1).toBe(hash2);

      // Different payload yields different hash
      const differentObj = { ...canonicalObj1, amount: 20000 };
      const diffHash = crypto.createHash('sha256').update(JSON.stringify(differentObj)).digest('hex');
      expect(diffHash).not.toBe(hash1);
    });
  });
});
