// ==============================================================================
// Security Contract Tests: SPP Cross-Tenant UPDATE Protection & Defense-in-Depth
// Work Package: WP-SPP-01B.1 (PO Directive - Limited Code Remediation)
// Compliance: Mandatory Verification of Strict Tenant Scoping on All UPDATE Operations
// ==============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sppService } from '@/lib/finance/spp-service';
import { db } from '@/lib/db';

describe('SECURITY CONTRACT: SPP Cross-Tenant UPDATE Protection (WP-SPP-01B.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── TEST 1: Cross-Tenant Installment Approval is Rejected ────────────────────
  it('SEC-UPD-01: reviewInstallmentPlan menolak pengajuan cicilan milik tenant lain (Fail-Closed)', async () => {
    const mockTx = {
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockImplementation(() => {
        // Mengembalikan array kosong karena tenantId tidak cocok dengan data di database
        return Promise.resolve([]);
      }),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => {
      return await cb(mockTx);
    });

    // Tenant B mencoba menyetujui pengajuan cicilan milik Tenant A
    await expect(
      sppService.reviewInstallmentPlan({
        tenantId: 'tenant_b',
        planId: 'plan_tenant_a_001',
        decision: 'APPROVE',
        reviewedBy: 'user_admin_b',
        reviewedByName: 'Admin Pesantren B',
        reviewedByRole: 'admin_keuangan',
      })
    ).rejects.toThrow('PLAN_NOT_FOUND: Pengajuan cicilan tidak ditemukan');

    // Verifikasi bahwa update ke spp_bills maupun spp_installment_plans TIDAK PERNAH terjadi
    expect(mockTx.update).not.toHaveBeenCalled();
  });

  // ── TEST 2: Defense-in-Depth: UPDATE sppBills Gagal Jika Tenant Mismatch ───────
  it('SEC-UPD-02: tx.update(sppBills) melempar error eksplisit jika row tidak cocok dengan tenantId penagih', async () => {
    let selectCallCount = 0;
    const mockTx = {
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      for: vi.fn().mockImplementation(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          // Panggilan 1: select plan berhasil
          return Promise.resolve([
            {
              id: 'plan_001',
              tenantId: 'tenant_a',
              billId: 'bill_001',
              status: 'PENDING',
              requestedInstallmentsCount: 3,
            },
          ]);
        }
        if (selectCallCount === 2) {
          // Panggilan 2: select bill berhasil
          return Promise.resolve([
            {
              id: 'bill_001',
              tenantId: 'tenant_a',
              remainingAmount: 600000,
              dueDate: new Date('2026-08-10'),
              activePlanId: null,
            },
          ]);
        }
        return Promise.resolve([]);
      }),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockImplementation(() => {
        // Simulasi update plan berhasil, tetapi update bill returning 0 rows (mismatch tenantId)
        return Promise.resolve([]);
      }),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(undefined),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => {
      return await cb(mockTx);
    });

    // Eksekusi harus melempar error eksplisit karena update returning 0 rows
    await expect(
      sppService.reviewInstallmentPlan({
        tenantId: 'tenant_a',
        planId: 'plan_001',
        decision: 'APPROVE',
        reviewedBy: 'user_admin_a',
        reviewedByName: 'Admin Pesantren A',
        reviewedByRole: 'admin_keuangan',
      })
    ).rejects.toThrow('PLAN_UPDATE_FAILED: Gagal mengaktifkan pengajuan cicilan atau tenant tidak cocok');
  });

  // ── TEST 3: Cross-Tenant Payment Recording is Rejected ───────────────────────
  it('SEC-UPD-03: recordSppPayment menolak pencatatan pembayaran tagihan milik tenant lain', async () => {
    const mockTx = {
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      for: vi.fn().mockImplementation(() => {
        // Tagihan tidak ditemukan di bawah tenant_b
        return Promise.resolve([]);
      }),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => {
      return await cb(mockTx);
    });

    // Tenant B mencoba mencatat pembayaran pada tagihan milik Tenant A
    await expect(
      sppService.recordSppPayment({
        tenantId: 'tenant_b',
        billId: 'bill_tenant_a_001',
        amount: 500000,
        verifiedBy: 'admin_b',
        verifiedByName: 'Admin B',
      })
    ).rejects.toThrow('BILL_NOT_FOUND: Tagihan SPP tidak ditemukan');

    // Verifikasi bahwa update status tagihan TIDAK PERNAH dieksekusi
    expect(mockTx.update).not.toHaveBeenCalled();
  });
});
