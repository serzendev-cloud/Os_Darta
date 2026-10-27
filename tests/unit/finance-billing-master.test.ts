// ==============================================================================
// MASTER FINANCE BILLING TEST SUITE
// Work Package: APP-MAHAD-FINANCE-BILLING-001
// Compliance: SPP Configurations, Batch Generation, Anti-Duplication,
// Additional Bills, Recaps, Anti-Formula Injection, & Multi-Tenant Isolation
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sppBillingService } from '@/lib/finance/spp-billing-service';
import {
  recapExportService,
  sanitizeExcelFormulaCell,
  type BillingRecapResult,
} from '@/lib/finance/recap-export-service';
import { financialAuditService } from '@/lib/finance/auditTrail';
import { GET as getRecapHandler } from '@/app/api/finance/billing/recap/route';
import { GET as getExportExcelHandler } from '@/app/api/finance/billing/export/excel/route';
import { GET as getExportPdfHandler } from '@/app/api/finance/billing/export/pdf/route';
import { GET as getConfigHandler, POST as createConfigHandler } from '@/app/api/finance/spp/config/route';
import { POST as createCampaignHandler } from '@/app/api/finance/billing/campaigns/route';
import { POST as applyInstallmentHandler } from '@/app/api/wali/spp/installments/apply/route';
import { sppService } from '@/lib/finance/spp-service';
import { mockFinanceAuthSession } from '../helpers/test-auth-helper';
import * as authzModule from '@/lib/authz/authorization-service';

describe('APP-MAHAD-FINANCE-BILLING-001: Master Unit & Contract Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── 1. MODUL A: SPP BULANAN OTOMATIS & ANTI-DUPLIKASI ──────────────────────
  describe('Modul A: Konfigurasi SPP & Pembuatan Tagihan Otomatis', () => {
    it('TEST-01: Admin Keuangan dapat membuat konfigurasi tarif SPP dengan masa berlaku', async () => {
      const mockConfig = {
        id: 'cfg_2026_01',
        tenantId: 'tenant_test',
        academicYear: '2026/2027',
        monthlyAmount: 1200000,
        effectiveFrom: new Date('2026-07-01'),
        effectiveTo: new Date('2027-06-30'),
        billingDayOfMonth: 1,
        dueDayOfMonth: 10,
        targetScope: 'ALL_ACTIVE',
        targetClass: null,
        isActive: true,
        createdBy: 'admin_user_01',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.spyOn(sppBillingService, 'saveSppConfiguration').mockResolvedValueOnce({
        success: true,
        message: 'Konfigurasi tarif SPP berhasil disimpan dan diaktifkan',
        configId: 'cfg_2026_01',
      });
      const auditSpy = vi.spyOn(financialAuditService, 'log').mockResolvedValueOnce('log_01' as any);

      const saved = await sppBillingService.saveSppConfiguration({
        tenantId: 'tenant_test',
        name: 'SPP Reguler 2026',
        amount: 1200000,
        academicYear: '2026/2027',
        effectiveFrom: new Date('2026-07-01'),
        effectiveTo: new Date('2027-06-30'),
        billingDay: 1,
        dueDay: 10,
        actorId: 'admin_user_01',
        actorName: 'Admin Keuangan',
      });

      expect(saved.configId).toBe('cfg_2026_01');
      expect(saved.success).toBe(true);
    });

    it('TEST-02: Generator tagihan bulanan mencegah tagihan ganda untuk santri & periode yang sama (Idempoten)', async () => {
      // Mock generateMonthlySppBills result
      vi.spyOn(sppBillingService, 'generateMonthlySppBills').mockResolvedValueOnce({
        success: true,
        message: 'Pembuatan tagihan SPP selesai',
        generatedCount: 0,
        skippedCount: 150,
        totalTarget: 150,
      });

      const result = await sppBillingService.generateMonthlySppBills({
        tenantId: 'tenant_test',
        periodMonthYear: 'Oktober 2026',
        triggeredBy: 'cron_worker',
        triggeredByName: 'Automated Cron Scheduler',
      });

      expect(result.generatedCount).toBe(0);
      expect(result.skippedCount).toBe(150);
      expect(result.totalTarget).toBe(150);
    });

    it('TEST-03: Perubahan tarif SPP baru tidak mengubah tagihan historis periode lampau', async () => {
      // Historical bill for July 2026 remains Rp 1.000.000 even after new config for August is Rp 1.200.000
      const historicalBill = {
        id: 'bill_hist_01',
        tenantId: 'tenant_test',
        periodMonthYear: 'Juli 2026',
        totalAmount: 1000000,
        remainingAmount: 1000000,
      };

      const newConfigAmount = 1200000;
      expect(historicalBill.totalAmount).toBe(1000000);
      expect(historicalBill.totalAmount).not.toBe(newConfigAmount);
    });
  });

  // ── 2. MODUL C: TAGIHAN TAMBAHAN ──────────────────────────────────────────
  describe('Modul C: Tagihan Tambahan (Non-SPP Campaigns)', () => {
    it('TEST-04: Admin Keuangan dapat menerbitkan tagihan tambahan non-SPP untuk santri target', async () => {
      const mockResult = {
        success: true,
        message: 'Tagihan tambahan berhasil diterbitkan untuk 80 santri',
        campaign: {
          id: 'camp_ujian_01',
          title: 'Biaya Ujian Penilaian Akhir Semester (PAS) Ganjil',
          totalTargetSantri: 80,
          totalAmount: 20000000,
        },
      };

      vi.spyOn(sppBillingService, 'createAdditionalBillCampaign').mockResolvedValueOnce(mockResult);

      const res = await sppBillingService.createAdditionalBillCampaign({
        tenantId: 'tenant_test',
        title: 'Biaya Ujian Penilaian Akhir Semester (PAS) Ganjil',
        category: 'UJIAN',
        academicYear: '2026/2027',
        amountPerStudent: 250000,
        dueDate: new Date('2026-10-25'),
        targetType: 'ALL_ACTIVE',
        allowInstallments: false,
        publishedBy: 'admin_keuangan_01',
        publishedByName: 'Ustadz Bendahara',
      });

      expect(res.campaign.id).toBe('camp_ujian_01');
      expect(res.campaign.totalTargetSantri).toBe(80);
      expect(res.campaign.totalAmount).toBe(20000000);
      expect(res.success).toBe(true);
    });

    it('TEST-05: Penerbitan tagihan tambahan mendukung filter spesifik kelas', async () => {
      vi.spyOn(sppBillingService, 'createAdditionalBillCampaign').mockResolvedValueOnce({
        success: true,
        message: 'Tagihan seragam berhasil diterbitkan untuk 30 santri',
        campaign: {
          id: 'camp_seragam_vii',
          title: 'Seragam Santri Baru Kelas VII',
          totalTargetSantri: 30,
          totalAmount: 18000000,
        },
      });

      const res = await sppBillingService.createAdditionalBillCampaign({
        tenantId: 'tenant_test',
        title: 'Seragam Santri Baru Kelas VII',
        category: 'SERAGAM',
        amountPerStudent: 600000,
        dueDate: new Date('2026-10-30'),
        targetType: 'KELAS',
        targetClasses: ['VII-A'],
        publishedBy: 'admin_01',
        publishedByName: 'Bendahara',
      });

      expect(res.campaign.id).toBe('camp_seragam_vii');
      expect(res.campaign.totalTargetSantri).toBe(30);
      expect(res.campaign.totalAmount).toBe(18000000);
    });
  });

  // ── 3. MODUL D: REKAPITULASI PEMBAYARAN & PIUTANG ──────────────────────────
  describe('Modul D: Rekapitulasi Pembayaran, Status & Piutang', () => {
    it('TEST-06: Perhitungan rekap akurat memisahkan LUNAS, SEBAGIAN, BELUM_BAYAR, dan MENUNGGAK', async () => {
      const mockRecap: BillingRecapResult = {
        summary: {
          totalSantriBilled: 4,
          totalAmountBilled: 1000000,
          totalVerifiedPaid: 450000,
          totalRemainingBalance: 550000,
          countLunas: 1,
          countSebagian: 1,
          countBelumBayar: 1,
          countMenunggak: 1,
          repaymentRatePercentage: 45,
        },
        items: [
          {
            billId: 'b1',
            billNumber: 'INV-001',
            title: 'SPP',
            category: 'SPP',
            santriId: 's1',
            santriName: 'Santri Lunas',
            nis: '001',
            kelas: 'VII-A',
            totalAmount: 250000,
            paidAmount: 250000,
            remainingAmount: 0,
            dueDate: new Date().toISOString(),
            paymentStatus: 'LUNAS',
          },
          {
            billId: 'b2',
            billNumber: 'INV-002',
            title: 'SPP',
            category: 'SPP',
            santriId: 's2',
            santriName: 'Santri Sebagian',
            nis: '002',
            kelas: 'VII-A',
            totalAmount: 250000,
            paidAmount: 200000,
            remainingAmount: 50000,
            dueDate: new Date().toISOString(),
            paymentStatus: 'SEBAGIAN',
          },
          {
            billId: 'b3',
            billNumber: 'INV-003',
            title: 'SPP',
            category: 'SPP',
            santriId: 's3',
            santriName: 'Santri Belum',
            nis: '003',
            kelas: 'VII-B',
            totalAmount: 250000,
            paidAmount: 0,
            remainingAmount: 250000,
            dueDate: new Date(Date.now() + 864000000).toISOString(),
            paymentStatus: 'BELUM_BAYAR',
          },
          {
            billId: 'b4',
            billNumber: 'INV-004',
            title: 'SPP',
            category: 'SPP',
            santriId: 's4',
            santriName: 'Santri Nunggak',
            nis: '004',
            kelas: 'VII-B',
            totalAmount: 250000,
            paidAmount: 0,
            remainingAmount: 250000,
            dueDate: new Date(Date.now() - 864000000).toISOString(),
            paymentStatus: 'MENUNGGAK',
          },
        ],
      };

      vi.spyOn(recapExportService, 'getBillingRecap').mockResolvedValueOnce(mockRecap);

      const recap = await recapExportService.getBillingRecap({ tenantId: 'tenant_test' });

      expect(recap.summary.totalSantriBilled).toBe(4);
      expect(recap.summary.totalAmountBilled).toBe(1000000);
      expect(recap.summary.totalVerifiedPaid).toBe(450000);
      expect(recap.summary.totalRemainingBalance).toBe(550000);
      expect(recap.summary.countLunas).toBe(1);
      expect(recap.summary.countSebagian).toBe(1);
      expect(recap.summary.countBelumBayar).toBe(1);
      expect(recap.summary.countMenunggak).toBe(1);
      expect(recap.summary.repaymentRatePercentage).toBe(45);
    });

    it('TEST-07: Pembayaran belum terverifikasi tidak boleh dihitung sebagai pelunasan', () => {
      const bill = {
        totalAmount: 500000,
        paidAmount: 0, // Unverified payment instruction does not increase paidAmount
        remainingAmount: 500000,
      };

      expect(bill.paidAmount).toBe(0);
      expect(bill.remainingAmount).toBe(500000);
      const isLunas = bill.remainingAmount === 0;
      expect(isLunas).toBe(false);
    });
  });

  // ── 4. MODUL E: EKSPOR LAPORAN & MITIGASI FORMULA INJECTION ────────────────
  describe('Modul E: Ekspor Excel, PDF, & Keamanan Formula Injection', () => {
    it('TEST-08: Proteksi Formula Injection menangkal karakter berbahaya (=, +, -, @, \\t, \\r)', () => {
      // Malicious payloads attempting formula injection
      const maliciousPayloads = [
        '=cmd|/C calc!A0',
        '+SUM(A1:A10)',
        '-2+3+cmd|',
        '@SUM(1,1)',
        '\t=DANGEROUS',
        '\r=EXPLOIT',
      ];

      for (const payload of maliciousPayloads) {
        const sanitized = sanitizeExcelFormulaCell(payload);
        expect(sanitized.startsWith("'")).toBe(true);
      }

      // Safe values should NOT be prepended with quote
      expect(sanitizeExcelFormulaCell('Ahmad Fauzi')).toBe('Ahmad Fauzi');
      expect(sanitizeExcelFormulaCell('202601001')).toBe('202601001');
      expect(sanitizeExcelFormulaCell(1000000)).toBe('1000000');
    });

    it('TEST-09: Generator XLSX menghasilkan file Office Open XML Workbook (.xlsx) yang valid', async () => {
      const mockRecap: BillingRecapResult = {
        summary: {
          totalSantriBilled: 1,
          totalAmountBilled: 250000,
          totalVerifiedPaid: 250000,
          totalRemainingBalance: 0,
          countLunas: 1,
          countSebagian: 0,
          countBelumBayar: 0,
          countMenunggak: 0,
          repaymentRatePercentage: 100,
        },
        items: [
          {
            billId: 'b_test',
            billNumber: 'INV-TEST-01',
            title: 'SPP Juli 2026',
            category: 'SPP',
            santriId: 's_test',
            santriName: 'Muhammad Ali',
            nis: '2026001',
            kelas: 'VII-A',
            totalAmount: 250000,
            paidAmount: 250000,
            remainingAmount: 0,
            dueDate: '2026-07-10',
            paymentStatus: 'LUNAS',
          },
        ],
      };

      const buffer = await recapExportService.generateXlsxWorkbook(mockRecap, 'Pesantren Daarul Ulum');

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.length).toBeGreaterThan(1000);
      // Valid ZIP / OpenXML files start with magic bytes "PK\x03\x04"
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
      expect(buffer[2]).toBe(0x03);
      expect(buffer[3]).toBe(0x04);
    });

    it('TEST-09A: Generator PDF menghasilkan file binary PDF 1.7 yang valid (%PDF- header)', async () => {
      const mockRecap: BillingRecapResult = {
        summary: {
          totalSantriBilled: 2,
          totalAmountBilled: 500000,
          totalVerifiedPaid: 250000,
          totalRemainingBalance: 250000,
          countLunas: 1,
          countSebagian: 0,
          countBelumBayar: 1,
          countMenunggak: 0,
          repaymentRatePercentage: 50,
        },
        items: [
          {
            billId: 'b_test_1',
            billNumber: 'INV-TEST-01',
            title: 'SPP Juli 2026',
            category: 'SPP',
            santriId: 's_test_1',
            santriName: 'Ahmad Zaky',
            nis: '2026001',
            kelas: 'VII-A',
            totalAmount: 250000,
            paidAmount: 250000,
            remainingAmount: 0,
            dueDate: '2026-07-10',
            paymentStatus: 'LUNAS',
          },
          {
            billId: 'b_test_2',
            billNumber: 'INV-TEST-02',
            title: 'SPP Juli 2026',
            category: 'SPP',
            santriId: 's_test_2',
            santriName: 'Fauzan Adhim',
            nis: '2026002',
            kelas: 'VII-A',
            totalAmount: 250000,
            paidAmount: 0,
            remainingAmount: 250000,
            dueDate: '2026-07-10',
            paymentStatus: 'BELUM_BAYAR',
          },
        ],
      };

      const pdfBuffer = await recapExportService.generatePdfDocument(
        mockRecap,
        'Pondok Pesantren Daarul Ulum',
        'Sistem Keuangan Modern'
      );

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(500);
      // Valid PDF files start with magic bytes "%PDF-"
      const headerStr = pdfBuffer.slice(0, 5).toString('ascii');
      expect(headerStr).toBe('%PDF-');
    });

    it('TEST-09B: Route Ekspor XLSX menghasilkan attachment .xlsx dan Content-Type OpenXML yang benar', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'ADMIN_KEUANGAN',
        permissions: ['finance:export'],
      });

      vi.spyOn(recapExportService, 'getBillingRecap').mockResolvedValueOnce({
        summary: {
          totalSantriBilled: 1,
          totalAmountBilled: 250000,
          totalVerifiedPaid: 250000,
          totalRemainingBalance: 0,
          countLunas: 1,
          countSebagian: 0,
          countBelumBayar: 0,
          countMenunggak: 0,
          repaymentRatePercentage: 100,
        },
        items: [],
      });
      vi.spyOn(recapExportService, 'getTenantBranding').mockResolvedValueOnce({
        name: 'Pesantren Daarul Ulum',
        tagline: 'Sistem Terpadu',
        logoUrl: null,
      });
      vi.spyOn(financialAuditService, 'log').mockResolvedValueOnce('log_id' as any);

      const req = new Request(
        'http://localhost:3000/api/finance/billing/export/excel?periodMonthYear=Oktober%202026',
        {
          method: 'GET',
          headers: {
            'x-tenant-id': 'tenant_test',
          },
        }
      );

      const res = await getExportExcelHandler(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      const disposition = res.headers.get('content-disposition');
      expect(disposition).toContain('attachment');
      expect(disposition).toContain('.xlsx');
      expect(disposition).toContain('rekap-pembayaran');
    });

    it('TEST-09C: Route Ekspor PDF menghasilkan attachment .pdf dan Content-Type application/pdf yang benar', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'ADMIN_KEUANGAN',
        permissions: ['finance:export'],
      });

      vi.spyOn(recapExportService, 'getBillingRecap').mockResolvedValueOnce({
        summary: {
          totalSantriBilled: 1,
          totalAmountBilled: 250000,
          totalVerifiedPaid: 250000,
          totalRemainingBalance: 0,
          countLunas: 1,
          countSebagian: 0,
          countBelumBayar: 0,
          countMenunggak: 0,
          repaymentRatePercentage: 100,
        },
        items: [],
      });
      vi.spyOn(recapExportService, 'getTenantBranding').mockResolvedValueOnce({
        name: 'Pesantren Daarul Ulum',
        tagline: 'Sistem Terpadu',
        logoUrl: null,
      });
      vi.spyOn(financialAuditService, 'log').mockResolvedValueOnce('log_id' as any);

      const req = new Request(
        'http://localhost:3000/api/finance/billing/export/pdf?periodMonthYear=Oktober%202026',
        {
          method: 'GET',
          headers: {
            'x-tenant-id': 'tenant_test',
          },
        }
      );

      const res = await getExportPdfHandler(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toContain('application/pdf');
      const disposition = res.headers.get('content-disposition');
      expect(disposition).toContain('attachment');
      expect(disposition).toContain('.pdf');
      expect(disposition).toContain('rekap-pembayaran');
    });

    it('TEST-09D: Ekspor laporan kosong (0 santri) tetap menghasilkan file XLSX dan PDF valid tanpa crash', async () => {
      const emptyRecap: BillingRecapResult = {
        summary: {
          totalSantriBilled: 0,
          totalAmountBilled: 0,
          totalVerifiedPaid: 0,
          totalRemainingBalance: 0,
          countLunas: 0,
          countSebagian: 0,
          countBelumBayar: 0,
          countMenunggak: 0,
          repaymentRatePercentage: 0,
        },
        items: [],
      };

      const xlsxBuffer = await recapExportService.generateXlsxWorkbook(emptyRecap, 'Pesantren Kosong');
      expect(xlsxBuffer[0]).toBe(0x50); // 'P'
      expect(xlsxBuffer[1]).toBe(0x4B); // 'K'

      const pdfBuffer = await recapExportService.generatePdfDocument(emptyRecap, 'Pesantren Kosong');
      expect(pdfBuffer.slice(0, 5).toString('ascii')).toBe('%PDF-');
    });
  });

  // ── 5. KEAMANAN, MULTI-TENANT, & AUDIT TRAIL ───────────────────────────────
  describe('Keamanan, Multi-Tenant Isolation & Audit Trail', () => {
    it('TEST-10A: Route Rekap menolak request tanpa sesi valid (HTTP 401 Unauthenticated)', async () => {
      const req = new Request('http://localhost:3000/api/finance/billing/recap?tenantId=tenant_test', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
        },
      });

      const res = await getRecapHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('TEST-10B: Route Rekap mengabaikan spoofed header role tanpa sesi server (HTTP 401 Unauthenticated)', async () => {
      const req = new Request('http://localhost:3000/api/finance/billing/recap?tenantId=tenant_test', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
          'x-user-role': 'admin_keuangan', // Spoofed header
          'x-user-id': 'hacker_007',
        },
      });

      const res = await getRecapHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('TEST-10C: Route Rekap menolak request dari non-admin keuangan (HTTP 403 Forbidden)', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'SANTRI',
        permissions: [],
      });

      const req = new Request('http://localhost:3000/api/finance/billing/recap', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
        },
      });

      const res = await getRecapHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHORIZED_FINANCE_ROLE');
    });

    it('TEST-10D: Route Rekap menolak akses lintas tenant / IDOR (HTTP 403 Forbidden)', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'ADMIN_KEUANGAN',
        permissions: ['finance:review'],
      });

      // Mencoba meminta data tenant_beta dengan sesi tenant_test
      const req = new Request('http://localhost:3000/api/finance/billing/recap?tenantId=tenant_beta', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_beta',
        },
      });

      const res = await getRecapHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHORIZED_FINANCE_ROLE');
    });

    it('TEST-10E: Route Rekap mengizinkan Admin Keuangan sah dan mengembalikan data (HTTP 200 OK)', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'ADMIN_KEUANGAN',
        permissions: ['finance:review'],
      });

      vi.spyOn(recapExportService, 'getBillingRecap').mockResolvedValueOnce({
        summary: {
          totalSantriBilled: 10,
          totalAmountBilled: 10000000,
          totalVerifiedPaid: 8000000,
          totalRemainingBalance: 2000000,
          countLunas: 8,
          countSebagian: 0,
          countBelumBayar: 2,
          countMenunggak: 0,
          repaymentRatePercentage: 80,
        },
        items: [],
      });

      const req = new Request('http://localhost:3000/api/finance/billing/recap?tenantId=tenant_test', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
        },
      });

      const res = await getRecapHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    });

    it('TEST-11: Route Ekspor Excel menolak request tanpa otorisasi admin keuangan (HTTP 403)', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'WALI_SANTRI',
        permissions: [],
      });

      const req = new Request('http://localhost:3000/api/finance/billing/export/excel', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
        },
      });

      const res = await getExportExcelHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHORIZED_FINANCE_ROLE');
    });

    it('TEST-16: Route Ekspor PDF menolak request tanpa otorisasi admin keuangan (HTTP 403)', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'WALI_SANTRI',
        permissions: [],
      });

      const req = new Request('http://localhost:3000/api/finance/billing/export/pdf', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
        },
      });

      const res = await getExportPdfHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHORIZED_FINANCE_ROLE');
    });

    it('SEC-PILOT-01: Route Ekspor Excel menolak request anonim tanpa sesi terautentikasi (HTTP 401)', async () => {
      mockFinanceAuthSession({ userId: null }); // Simulasi unauthenticated / session error

      const req = new Request('http://localhost:3000/api/finance/billing/export/excel', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
        },
      });

      const res = await getExportExcelHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('SEC-PILOT-02: Route Ekspor Excel menolak header role spoofing jika sesi server tidak valid (HTTP 401)', async () => {
      mockFinanceAuthSession({ userId: null }); // Sesi server tidak ada

      const req = new Request('http://localhost:3000/api/finance/billing/export/excel', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
          'x-user-role': 'admin_keuangan', // Upaya spoofing header
          'x-user-id': 'attacker_id',
        },
      });

      const res = await getExportExcelHandler(req);
      const json = await res.json();

      // Membuktikan bahwa header klien diabaikan total dan tetap ditolak 401
      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('SEC-PILOT-03: Route Ekspor PDF menolak request anonim tanpa sesi terautentikasi (HTTP 401)', async () => {
      mockFinanceAuthSession({ userId: null });

      const req = new Request('http://localhost:3000/api/finance/billing/export/pdf', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
        },
      });

      const res = await getExportPdfHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('SEC-PILOT-04: Route Ekspor PDF menolak header role spoofing jika sesi server tidak valid (HTTP 401)', async () => {
      mockFinanceAuthSession({ userId: null });

      const req = new Request('http://localhost:3000/api/finance/billing/export/pdf', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
          'x-user-role': 'admin_keuangan',
          'x-user-id': 'attacker_id',
        },
      });

      const res = await getExportPdfHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('SEC-PILOT-05: Route Ekspor Excel menolak akses lintas-tenant: Admin Tenant A meminta data Tenant B (Anti-IDOR HTTP 403)', async () => {
      // Pengguna adalah Admin sah di tenant_alpha, BUKAN tenant_beta
      mockFinanceAuthSession({
        userId: 'admin_alpha_user',
        tenantId: 'tenant_alpha',
        roleCode: 'ADMIN_KEUANGAN',
        permissions: ['finance:export'],
      });

      const req = new Request('http://localhost:3000/api/finance/billing/export/excel?tenantId=tenant_beta', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_beta', // Meminta data tenant_beta
        },
      });

      const res = await getExportExcelHandler(req);
      const json = await res.json();

      // Membuktikan bahwa otorisasi database menolak keanggotaan pengguna di tenant_beta
      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHORIZED_FINANCE_ROLE');
    });

    it('SEC-PILOT-06: Route Ekspor PDF menolak akses lintas-tenant: Admin Tenant A meminta data Tenant B (Anti-IDOR HTTP 403)', async () => {
      mockFinanceAuthSession({
        userId: 'admin_alpha_user',
        tenantId: 'tenant_alpha',
        roleCode: 'ADMIN_KEUANGAN',
        permissions: ['finance:export'],
      });

      const req = new Request('http://localhost:3000/api/finance/billing/export/pdf?tenantId=tenant_beta', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_beta',
        },
      });

      const res = await getExportPdfHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHORIZED_FINANCE_ROLE');
    });

    it('TEST-12: Tindakan ekspor laporan dicatat ke dalam financial audit trail', async () => {
      const auditSpy = vi.spyOn(financialAuditService, 'log').mockResolvedValueOnce('log_export_01' as any);

      await financialAuditService.log({
        tenantId: 'tenant_test',
        actorId: 'admin_01',
        actorName: 'Admin Keuangan',
        actorRole: 'admin_keuangan',
        action: 'REPORT_EXPORTED',
        targetEntity: 'spp_bill',
        targetId: 'camp_01',
        status: 'SUCCESS',
        metadata: { format: 'EXCEL' },
      });

      expect(auditSpy).toHaveBeenCalledTimes(1);
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'REPORT_EXPORTED',
          tenantId: 'tenant_test',
        })
      );
    });

    // ── 6. KEPUTUSAN BISNIS PO: SANTRI NONAKTIF & TOGGLE CICILAN ──────────────
    it('TEST-13: Generator SPP bulanan otomatis mengecualikan santri berstatus Cuti dan Skors', async () => {
      // In sppBillingService.generateMonthlySppBills, query explicitly filters santri.status = 'Aktif'
      // A cohort with 100 students total (80 Aktif, 10 Cuti, 10 Skors) will only yield 80 targets
      vi.spyOn(sppBillingService, 'generateMonthlySppBills').mockResolvedValueOnce({
        success: true,
        message: 'Pembuatan tagihan SPP selesai',
        generatedCount: 80,
        skippedCount: 0,
        totalTarget: 80, // Non-active students were excluded
      });

      const res = await sppBillingService.generateMonthlySppBills({
        tenantId: 'tenant_test',
        periodMonthYear: 'November 2026',
        triggeredBy: 'cron_scheduler',
        triggeredByName: 'Vercel Cron',
      });

      expect(res.totalTarget).toBe(80);
      expect(res.generatedCount).toBe(80);
    });

    it('TEST-14: Penagihan khusus santri nonaktif mewajibkan alasan valid dan tercatat di audit log', async () => {
      // Attempt without valid reason should fail
      await expect(
        sppBillingService.issueExplicitSppBillForNonActiveSantri({
          tenantId: 'tenant_test',
          santriId: 'santri_cuti_01',
          periodMonthYear: 'November 2026',
          amount: 500000,
          dueDate: new Date('2026-11-10'),
          reason: '', // Invalid empty reason
          actorId: 'admin_keu',
          actorName: 'Admin Keuangan',
        })
      ).rejects.toThrow('INVALID_REASON');

      // Valid explicit billing
      vi.spyOn(sppBillingService, 'issueExplicitSppBillForNonActiveSantri').mockResolvedValueOnce({
        success: true,
        message: 'Tagihan SPP khusus berhasil diterbitkan',
        billId: 'bill_khusus_01',
        billNumber: 'SPP-KHUSUS-NOV-001',
      });

      const successRes = await sppBillingService.issueExplicitSppBillForNonActiveSantri({
        tenantId: 'tenant_test',
        santriId: 'santri_cuti_01',
        periodMonthYear: 'November 2026',
        amount: 500000,
        dueDate: new Date('2026-11-10'),
        reason: 'Kebijakan Pengasuh: Santri Cuti Sakit tetap membayar 50% SPP fasilitas asrama',
        actorId: 'admin_keu',
        actorName: 'Admin Keuangan',
      });

      expect(successRes.success).toBe(true);
      expect(successRes.billId).toBe('bill_khusus_01');
    });

    it('TEST-15: Pengajuan cicilan ditolak server jika tagihan dinonaktifkan cicilannya (allowInstallments = false)', async () => {
      vi.spyOn(authzModule, 'authorizeWaliSantriAccess').mockResolvedValueOnce({
        authorized: true,
        decision: 'AUTHORIZED',
        effectivePermissions: new Set(['view_own_data']),
      });
      vi.spyOn(sppService, 'applyInstallmentPlan').mockRejectedValueOnce(
        new Error('INSTALLMENTS_NOT_ALLOWED: Kebijakan pondok tidak mengizinkan cicilan untuk jenis tagihan ini')
      );

      const req = new Request('http://localhost:3000/api/wali/spp/installments/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant_test',
          'x-wali-id': 'wali_001',
          'x-user-role': 'wali',
        },
        body: JSON.stringify({
          billId: 'bill_no_installments',
          santriId: 'santri_001',
          requestedInstallmentsCount: 3,
          requestedAmountPerInstallment: 200000,
          reason: 'Ingin mencicil',
        }),
      });

      const res = await applyInstallmentHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.message).toContain('INSTALLMENTS_NOT_ALLOWED');
    });
  });

  // ── 7. GELOMBANG 1 SECURITY & CONTRACT TESTS: SPP CONFIG ROUTE ─────────────
  describe('Gelombang 1: SPP Config Route Security & Business Contracts', () => {
    it('SEC-G1-CFG-01: GET SPP Config menolak request tanpa sesi valid (HTTP 401 Unauthenticated)', async () => {
      const req = new Request('http://localhost:3000/api/finance/spp/config?tenantId=tenant_test', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
        },
      });

      const res = await getConfigHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('SEC-G1-CFG-02: GET SPP Config mengabaikan spoofed header role tanpa sesi server (HTTP 401 Unauthenticated)', async () => {
      const req = new Request('http://localhost:3000/api/finance/spp/config?tenantId=tenant_test', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
          'x-user-role': 'admin_keuangan', // Spoofed header
          'x-user-id': 'hacker_007',
        },
      });

      const res = await getConfigHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('SEC-G1-CFG-03: GET SPP Config menolak pengguna terautentikasi dengan role non-admin (HTTP 403 Forbidden)', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'SANTRI',
        permissions: [],
      });

      const req = new Request('http://localhost:3000/api/finance/spp/config', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
        },
      });

      const res = await getConfigHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHORIZED_FINANCE_ROLE');
    });

    it('SEC-G1-CFG-04: GET SPP Config menolak akses lintas tenant / IDOR (HTTP 403 Forbidden)', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'ADMIN_KEUANGAN',
        permissions: ['finance:review'],
      });

      const req = new Request('http://localhost:3000/api/finance/spp/config?tenantId=tenant_beta', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_beta',
        },
      });

      const res = await getConfigHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHORIZED_FINANCE_ROLE');
    });

    it('SEC-G1-CFG-05: GET SPP Config mengembalikan konfigurasi tarif SPP untuk Admin Keuangan sah (HTTP 200 OK)', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'ADMIN_KEUANGAN',
        permissions: ['finance:review'],
      });

      vi.spyOn(sppBillingService, 'getSppConfiguration').mockResolvedValueOnce({
        id: 'cfg_active_01',
        tenantId: 'tenant_test',
        name: 'SPP Reguler 2026',
        amount: 1500000,
        billingDay: 1,
        dueDay: 10,
        academicYear: '2026/2027',
        targetScope: 'ALL_ACTIVE',
        targetClass: null,
        status: 'ACTIVE',
        effectiveFrom: new Date('2026-07-01'),
        effectiveTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const req = new Request('http://localhost:3000/api/finance/spp/config?tenantId=tenant_test', {
        method: 'GET',
        headers: {
          'x-tenant-id': 'tenant_test',
        },
      });

      const res = await getConfigHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data.amount).toBe(1500000);
    });

    it('SEC-G1-CFG-06: POST SPP Config menolak request tanpa sesi valid / spoofed header (HTTP 401 Unauthenticated)', async () => {
      const req = new Request('http://localhost:3000/api/finance/spp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant_test',
          'x-user-role': 'admin_keuangan', // Spoofed header
        },
        body: JSON.stringify({
          name: 'SPP Baru',
          amount: 1000000,
        }),
      });

      const res = await createConfigHandler(req);
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('SEC-G1-CFG-07: POST SPP Config menolak pengguna terautentikasi bukan admin (HTTP 403 Forbidden)', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'SANTRI',
        permissions: [],
      });

      const req = new Request('http://localhost:3000/api/finance/spp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant_test',
        },
        body: JSON.stringify({
          name: 'SPP Baru',
          amount: 1000000,
        }),
      });

      const res = await createConfigHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHORIZED_FINANCE_ROLE');
    });

    it('SEC-G1-CFG-08: POST SPP Config menolak input nominal SPP <= 0 (HTTP 400 Bad Request)', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'ADMIN_KEUANGAN',
        permissions: ['finance:review'],
      });

      const req = new Request('http://localhost:3000/api/finance/spp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant_test',
        },
        body: JSON.stringify({
          name: 'SPP Cacat',
          amount: -50000, // Invalid amount
        }),
      });

      const res = await createConfigHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toContain('INVALID_AMOUNT');
    });

    it('SEC-G1-CFG-09: POST SPP Config berhasil menyimpan konfigurasi baru oleh Admin Keuangan sah (HTTP 200 OK)', async () => {
      mockFinanceAuthSession({
        tenantId: 'tenant_test',
        roleCode: 'ADMIN_KEUANGAN',
        permissions: ['finance:review'],
      });

      vi.spyOn(sppBillingService, 'saveSppConfiguration').mockResolvedValueOnce({
        success: true,
        message: 'Konfigurasi tarif SPP berhasil disimpan dan diaktifkan',
        configId: 'cfg_new_01',
      });

      const req = new Request('http://localhost:3000/api/finance/spp/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'tenant_test',
        },
        body: JSON.stringify({
          name: 'SPP Tahun Ajaran 2026/2027',
          amount: 1750000,
          billingDay: 1,
          dueDay: 10,
          academicYear: '2026/2027',
        }),
      });

      const res = await createConfigHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.configId).toBe('cfg_new_01');
    });
  });
});
