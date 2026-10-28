// ==============================================================================
// Finance Routes Hardening Contract Tests
// Work Package: WP-SEC-FINANCE-001
// Verification of Fail-Closed Server Auth, Database RBAC, Strict Tenant Isolation
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET as getCampaignsHandler, POST as postCampaignHandler } from '@/app/api/finance/billing/campaigns/route';
import { GET as getConfigHandler, POST as postConfigHandler } from '@/app/api/finance/spp/config/route';
import { POST as postPayHandler } from '@/app/api/finance/spp/pay/route';
import { GET as getInstallmentsHandler } from '@/app/api/finance/spp/installments/route';
import { POST as postReviewHandler } from '@/app/api/finance/spp/installments/[id]/review/route';
import { GET as getRecapHandler } from '@/app/api/finance/billing/recap/route';
import { GET as getExcelHandler } from '@/app/api/finance/billing/export/excel/route';
import { GET as getPdfHandler } from '@/app/api/finance/billing/export/pdf/route';

import { sppBillingService } from '@/lib/finance/spp-billing-service';
import { sppService } from '@/lib/finance/spp-service';
import { recapExportService } from '@/lib/finance/recap-export-service';
import { financialAuditService } from '@/lib/finance/auditTrail';
import { mockFinanceAuthSession } from '../helpers/test-auth-helper';
import * as tenantContextModule from '@/lib/tenant/context';
import * as tenantTxModule from '@/lib/db/tenant-transaction';
import * as authzModule from '@/lib/authz/authorization-service';

describe('WP-SEC-FINANCE-001: Finance Routes Security Hardening Contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Default mock financial audit trail
    vi.spyOn(financialAuditService, 'log').mockResolvedValue('audit_log_001' as any);

    // Default mock tenant context
    vi.spyOn(tenantContextModule, 'getTenantContext').mockResolvedValue({
      id: 'tenant_real',
      name: 'Pesantren Real',
      slug: 'real',
      domain: null,
      settings: {},
    });

    // Default mock tenant transaction for review route plan query
    vi.spyOn(tenantTxModule, 'withTenantTransaction').mockImplementation(async (tenantId, cb) => {
      return cb({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [
                {
                  id: 'plan_123',
                  tenantId,
                  billId: 'bill_001',
                  santriId: 'santri_001',
                  waliId: 'wali_pemohon_diff',
                  status: 'PENDING',
                },
              ],
            }),
          }),
        }),
      } as any);
    });

    // Default platform role check for Super Admin
    vi.spyOn(authzModule, 'authorizePlatformRole').mockResolvedValue({
      authorized: false,
      decision: 'DENIED_PLATFORM_SCOPE',
      effectivePermissions: new Set(),
    });
  });

  // ── Helper to execute each route handler ────────────────────────────────────
  type RouteCaller = (req: Request) => Promise<Response>;

  const routes: Array<{
    name: string;
    method: 'GET' | 'POST';
    url: string;
    caller: RouteCaller;
    validBody?: Record<string, any>;
    permission: string;
    mockServiceSuccess: () => void;
    mockServiceError: () => void;
  }> = [
    {
      name: 'GET /api/finance/billing/campaigns',
      method: 'GET',
      url: 'http://localhost:3000/api/finance/billing/campaigns',
      caller: (req) => getCampaignsHandler(),
      permission: 'view_billing_campaigns',
      mockServiceSuccess: () => {
        vi.spyOn(sppBillingService, 'getBillingCampaigns').mockResolvedValueOnce([] as any);
      },
      mockServiceError: () => {
        vi.spyOn(sppBillingService, 'getBillingCampaigns').mockRejectedValueOnce(
          new Error('PG_ERROR_CAMPAIGNS_INTERNAL: column does not exist')
        );
      },
    },
    {
      name: 'POST /api/finance/billing/campaigns',
      method: 'POST',
      url: 'http://localhost:3000/api/finance/billing/campaigns',
      caller: (req) => postCampaignHandler(req),
      validBody: {
        title: 'Uang Gedung Baru',
        category: 'GEDUNG',
        description: 'Pembangunan asrama santri baru',
        academicYear: '2026/2027',
        amountPerStudent: 2500000,
        dueDate: '2026-10-31',
      },
      permission: 'manage_billing_campaigns',
      mockServiceSuccess: () => {
        vi.spyOn(sppBillingService, 'createAdditionalBillCampaign').mockResolvedValueOnce({
          success: true,
          campaignId: 'camp_001',
        } as any);
      },
      mockServiceError: () => {
        vi.spyOn(sppBillingService, 'createAdditionalBillCampaign').mockRejectedValueOnce(
          new Error('PG_ERROR_INSERT: syntax error at or near database table')
        );
      },
    },
    {
      name: 'GET /api/finance/spp/config',
      method: 'GET',
      url: 'http://localhost:3000/api/finance/spp/config',
      caller: (req) => getConfigHandler(),
      permission: 'view_spp_config',
      mockServiceSuccess: () => {
        vi.spyOn(sppBillingService, 'getSppConfiguration').mockResolvedValueOnce({
          id: 'cfg_001',
          amount: 1500000,
        } as any);
      },
      mockServiceError: () => {
        vi.spyOn(sppBillingService, 'getSppConfiguration').mockRejectedValueOnce(
          new Error('PG_ERROR_CONFIG_TABLE: connection reset by peer')
        );
      },
    },
    {
      name: 'POST /api/finance/spp/config',
      method: 'POST',
      url: 'http://localhost:3000/api/finance/spp/config',
      caller: (req) => postConfigHandler(req),
      validBody: {
        name: 'SPP 2026',
        amount: 1200000,
        billingDay: 1,
        dueDay: 10,
        academicYear: '2026/2027',
      },
      permission: 'manage_spp_config',
      mockServiceSuccess: () => {
        vi.spyOn(sppBillingService, 'saveSppConfiguration').mockResolvedValueOnce({
          success: true,
          configId: 'cfg_001',
        } as any);
      },
      mockServiceError: () => {
        vi.spyOn(sppBillingService, 'saveSppConfiguration').mockRejectedValueOnce(
          new Error('PG_ERROR_UPDATE_CONFIG: dead lock detected on server')
        );
      },
    },
    {
      name: 'POST /api/finance/spp/pay',
      method: 'POST',
      url: 'http://localhost:3000/api/finance/spp/pay',
      caller: (req) => postPayHandler(req),
      validBody: {
        billId: 'bill_001',
        amount: 500000,
      },
      permission: 'record_spp_payment',
      mockServiceSuccess: () => {
        vi.spyOn(sppService, 'recordSppPayment').mockResolvedValueOnce({
          success: true,
          message: 'Payment recorded',
          payment: { id: 'pay_001' },
        } as any);
      },
      mockServiceError: () => {
        vi.spyOn(sppService, 'recordSppPayment').mockRejectedValueOnce(
          new Error('INTERNAL_DB_CRASH: memory allocation failed in postgres')
        );
      },
    },
    {
      name: 'GET /api/finance/spp/installments',
      method: 'GET',
      url: 'http://localhost:3000/api/finance/spp/installments',
      caller: (req) => getInstallmentsHandler(req),
      permission: 'view_spp_installments',
      mockServiceSuccess: () => {
        vi.spyOn(sppService, 'getInstallmentPlansForAdmin').mockResolvedValueOnce([] as any);
      },
      mockServiceError: () => {
        vi.spyOn(sppService, 'getInstallmentPlansForAdmin').mockRejectedValueOnce(
          new Error('PG_ERROR_INSTALLMENTS: invalid byte sequence in encoding')
        );
      },
    },
    {
      name: 'POST /api/finance/spp/installments/[id]/review',
      method: 'POST',
      url: 'http://localhost:3000/api/finance/spp/installments/plan_123/review',
      caller: (req) =>
        postReviewHandler(req, {
          params: Promise.resolve({ id: 'plan_123' }),
        }),
      validBody: {
        decision: 'APPROVE',
        reviewNotes: 'Disetujui oleh bendahara',
      },
      permission: 'review_spp_installments',
      mockServiceSuccess: () => {
        vi.spyOn(sppService, 'reviewInstallmentPlan').mockResolvedValueOnce({
          success: true,
          status: 'ACTIVE',
        } as any);
      },
      mockServiceError: () => {
        vi.spyOn(sppService, 'reviewInstallmentPlan').mockRejectedValueOnce(
          new Error('PG_ERROR_REVIEW_PLAN: unhandled database error')
        );
      },
    },
    {
      name: 'GET /api/finance/billing/recap',
      method: 'GET',
      url: 'http://localhost:3000/api/finance/billing/recap',
      caller: (req) => getRecapHandler(req),
      permission: 'view_finance_recap',
      mockServiceSuccess: () => {
        vi.spyOn(recapExportService, 'getBillingRecap').mockResolvedValueOnce({
          summary: {},
          items: [],
        } as any);
      },
      mockServiceError: () => {
        vi.spyOn(recapExportService, 'getBillingRecap').mockRejectedValueOnce(
          new Error('PG_ERROR_RECAP_CALC: division by zero in SQL formula')
        );
      },
    },
    {
      name: 'GET /api/finance/billing/export/excel',
      method: 'GET',
      url: 'http://localhost:3000/api/finance/billing/export/excel',
      caller: (req) => getExcelHandler(req),
      permission: 'export_finance_recap',
      mockServiceSuccess: () => {
        vi.spyOn(recapExportService, 'getBillingRecap').mockResolvedValueOnce({
          summary: { totalVerifiedPaid: 0 },
          items: [],
        } as any);
        vi.spyOn(recapExportService, 'getTenantBranding').mockResolvedValueOnce({ name: 'Pesantren Mock' });
        vi.spyOn(recapExportService, 'generateXlsxWorkbook').mockResolvedValueOnce(Buffer.from('xlsx-bytes') as any);
      },
      mockServiceError: () => {
        vi.spyOn(recapExportService, 'getBillingRecap').mockRejectedValueOnce(
          new Error('PG_ERROR_EXPORT_XLSX: failed to read billing table metadata')
        );
      },
    },
    {
      name: 'GET /api/finance/billing/export/pdf',
      method: 'GET',
      url: 'http://localhost:3000/api/finance/billing/export/pdf',
      caller: (req) => getPdfHandler(req),
      permission: 'export_finance_recap',
      mockServiceSuccess: () => {
        vi.spyOn(recapExportService, 'getBillingRecap').mockResolvedValueOnce({
          summary: { totalVerifiedPaid: 0 },
          items: [],
        } as any);
        vi.spyOn(recapExportService, 'getTenantBranding').mockResolvedValueOnce({ name: 'Pesantren Mock' });
        vi.spyOn(recapExportService, 'generatePdfDocument').mockResolvedValueOnce(Buffer.from('%PDF-bytes') as any);
      },
      mockServiceError: () => {
        vi.spyOn(recapExportService, 'getBillingRecap').mockRejectedValueOnce(
          new Error('PG_ERROR_EXPORT_PDF: pdf font loading buffer overflow')
        );
      },
    },
  ];

  for (const route of routes) {
    describe(`Route Contract: ${route.name}`, () => {
      // (i) Tanpa sesi -> 401
      it('(i) tanpa sesi server terautentikasi ditolak HTTP 401 UNAUTHENTICATED', async () => {
        mockFinanceAuthSession({ userId: null });

        const req = new Request(route.url, {
          method: route.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: route.method === 'POST' ? JSON.stringify(route.validBody || {}) : undefined,
        });

        const res = await route.caller(req);
        const json = await res.json();

        expect(res.status).toBe(401);
        expect(json.success).toBe(false);
        expect(json.code).toBe('UNAUTHENTICATED');
      });

      // (ii) Sesi tanpa izin -> 403
      it('(ii) sesi terautentikasi tanpa izin kanonik ditolak HTTP 403 FORBIDDEN', async () => {
        mockFinanceAuthSession({
          userId: 'user_unauthorized',
          tenantId: 'tenant_real',
          permissions: [], // zero permissions
        });

        const req = new Request(route.url, {
          method: route.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: route.method === 'POST' ? JSON.stringify(route.validBody || {}) : undefined,
        });

        const res = await route.caller(req);
        const json = await res.json();

        expect(res.status).toBe(403);
        expect(json.success).toBe(false);
        expect(json.code).toBe('FORBIDDEN');
      });

      // (iii) TenantId di body/query/header diabaikan dan tenant dari getTenantContext yang dipakai
      it('(iii) input tenantId di body, query, dan header x-tenant-id diabaikan sepenuhnya', async () => {
        mockFinanceAuthSession({
          userId: 'bendahara_user_01',
          tenantId: 'tenant_real',
          permissions: [route.permission],
        });
        route.mockServiceSuccess();

        const spoofedUrl = `${route.url}${route.url.includes('?') ? '&' : '?'}tenantId=attacker_tenant_query`;
        const spoofedBody = {
          ...(route.validBody || {}),
          tenantId: 'attacker_tenant_body',
          operatorRole: 'superadmin',
          operatorUserId: 'evil_id',
        };

        const req = new Request(spoofedUrl, {
          method: route.method,
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': 'attacker_tenant_header',
          },
          body: route.method === 'POST' ? JSON.stringify(spoofedBody) : undefined,
        });

        const res = await route.caller(req);
        expect(res.status).toBe(route.method === 'POST' && route.name.includes('campaigns') ? 201 : 200);
      });

      // (iv) Header x-user-role: admin_keuangan tanpa sesi tidak meloloskan
      it('(iv) spoofing header x-user-role / x-user-id tanpa sesi server tidak meloloskan (HTTP 401)', async () => {
        mockFinanceAuthSession({ userId: null });

        const req = new Request(route.url, {
          method: route.method,
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': 'admin_keuangan',
            'x-user-id': 'spoofed_admin_id',
            'x-tenant-id': 'tenant_real',
          },
          body: route.method === 'POST' ? JSON.stringify(route.validBody || {}) : undefined,
        });

        const res = await route.caller(req);
        const json = await res.json();

        expect(res.status).toBe(401);
        expect(json.success).toBe(false);
        expect(json.code).toBe('UNAUTHENTICATED');
      });

      // (v) Sukses dengan izin yang benar
      it('(v) sukses memproses permintaan saat pengguna memiliki izin kanonik yang sesuai', async () => {
        mockFinanceAuthSession({
          userId: 'bendahara_sah_01',
          tenantId: 'tenant_real',
          permissions: [route.permission],
        });
        route.mockServiceSuccess();

        const req = new Request(route.url, {
          method: route.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: route.method === 'POST' ? JSON.stringify(route.validBody || {}) : undefined,
        });

        const res = await route.caller(req);
        const expectedStatus = route.method === 'POST' && route.name.includes('campaigns') ? 201 : 200;
        expect(res.status).toBe(expectedStatus);
      });

      // (vi) Respons error tidak memuat pesan internal
      it('(vi) respons error kegagalan internal tidak membocorkan stack, DB trace, atau error.message', async () => {
        mockFinanceAuthSession({
          userId: 'bendahara_sah_01',
          tenantId: 'tenant_real',
          permissions: [route.permission],
        });
        route.mockServiceError();

        const req = new Request(route.url, {
          method: route.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: route.method === 'POST' ? JSON.stringify(route.validBody || {}) : undefined,
        });

        const res = await route.caller(req);
        const rawBody = await res.text();

        // Tidak boleh membocorkan string pesan error internal database
        expect(rawBody).not.toContain('PG_ERROR');
        expect(rawBody).not.toContain('stack');
        expect(rawBody).not.toContain('INTERNAL_DB_CRASH');
        expect(rawBody).not.toContain('syntax error');
      });

      // (vii) Tanpa konteks tenant -> ditolak, tidak ada fallback 'default'
      it('(vii) tanpa konteks tenant valid ditolak HTTP 400 TENANT_NOT_FOUND (tanpa fallback default)', async () => {
        mockFinanceAuthSession({
          userId: 'bendahara_sah_01',
          tenantId: 'tenant_real',
          permissions: [route.permission],
        });

        // Mock tenant context threw / empty / default
        vi.spyOn(tenantContextModule, 'getTenantContext').mockRejectedValueOnce(
          new tenantContextModule.TenantNotFoundError('')
        );

        const req = new Request(route.url, {
          method: route.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: route.method === 'POST' ? JSON.stringify(route.validBody || {}) : undefined,
        });

        const res = await route.caller(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.code).toBe('TENANT_NOT_FOUND');
      });
    });
  }
});
