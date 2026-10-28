// ==============================================================================
// Canteen & Reconciliation Routes Security Hardening Contract Tests
// Work Package: WP-SEC-CANTEEN-001
// Verification of Fail-Closed Server Auth, Database RBAC, Strict Tenant Isolation,
// Server-Derived Actor Identity, and Anti-Self-Approval
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as postRefundReviewHandler } from '@/app/api/canteen/refund/review/route';
import { GET as getRefundHandler, POST as postRefundHandler } from '@/app/api/canteen/refund/route';
import { POST as postPayHandler } from '@/app/api/canteen/pay/route';
import { GET as getReconciliationHandler, POST as postReconciliationHandler } from '@/app/api/finance/reconciliation/route';
import { GET as getCctvTimelineHandler } from '@/app/api/finance/audit-cctv/timeline/route';

import { refundService } from '@/lib/finance/refund';
import { reconciliationEngine } from '@/lib/finance/reconciliation';
import { merchantLedgerService } from '@/lib/finance/merchantLedger';
import { financialAuditService } from '@/lib/finance/auditTrail';
import * as pinCryptoModule from '@/lib/security/pinCrypto';
import { mockFinanceAuthSession } from '../helpers/test-auth-helper';
import * as tenantContextModule from '@/lib/tenant/context';
import * as tenantTxModule from '@/lib/db/tenant-transaction';
import * as authzModule from '@/lib/authz/authorization-service';
import { rfidCards, santri, wallets, canteenTransactions, canteenRefunds } from '@/lib/db/schema';

describe('WP-SEC-CANTEEN-001: Canteen & Reconciliation Security Hardening Contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Default mock financial audit trail
    vi.spyOn(financialAuditService, 'log').mockResolvedValue('audit_log_001');

    // Default mock merchant ledger
    vi.spyOn(merchantLedgerService, 'getSummary').mockResolvedValue({
      totalGrossSales: 50000,
      totalRefunds: 0,
      netMerchantEntitlement: 50000,
      ledgerEntriesCount: 2,
      latestEntries: [],
    });
    vi.spyOn(merchantLedgerService, 'recordCreditSale').mockResolvedValue('entry_001');

    // Default mock PIN verification
    vi.spyOn(pinCryptoModule, 'isValidHex32').mockReturnValue(true);
    vi.spyOn(pinCryptoModule, 'isValidHex64').mockReturnValue(true);
    vi.spyOn(pinCryptoModule, 'verifyPinCredential').mockReturnValue({ valid: true });

    // Default mock tenant context
    vi.spyOn(tenantContextModule, 'getTenantContext').mockResolvedValue({
      id: 'tenant_real',
      name: 'Pesantren Real',
      slug: 'real',
      domain: null,
      settings: {},
    });

    // Default mock tenant transaction
    vi.spyOn(tenantTxModule, 'withTenantTransaction').mockImplementation(async (tenantId, cb) => {
      return cb({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: async () => [
                {
                  id: 'ref_123',
                  tenantId,
                  transactionId: 'tx_001',
                  requestedBy: 'different_user_requester',
                  requestedByName: 'Pemohon Lain',
                  refundAmount: 5000,
                  status: 'PENDING_APPROVAL',
                },
              ],
              orderBy: () => ({
                limit: async () => [],
              }),
              for: () => [
                {
                  id: 'wallet_001',
                  tenantId,
                  santriId: 'santri_001',
                  balanceUangSaku: 50000,
                  dailyLimit: 20000,
                  canteenStatus: 'active',
                },
              ],
            }),
            leftJoin: () => ({
              where: () => ({
                orderBy: () => ({
                  limit: async () => [],
                }),
              }),
            }),
          }),
        }),
        update: () => ({
          set: () => ({
            where: async () => [],
          }),
        }),
        insert: () => ({
          values: async () => [],
        }),
      } as unknown as Parameters<Parameters<typeof tenantTxModule.withTenantTransaction>[1]>[0]);
    });

    // Default platform role check for Super Admin
    vi.spyOn(authzModule, 'authorizePlatformRole').mockResolvedValue({
      authorized: false,
      decision: 'DENIED_PLATFORM_SCOPE',
      effectivePermissions: new Set(),
    });
  });

  type RouteCaller = (req: Request) => Promise<Response>;

  const routes: Array<{
    name: string;
    method: 'GET' | 'POST';
    url: string;
    caller: RouteCaller;
    validBody?: Record<string, unknown>;
    permission: string;
    mockServiceSuccess: () => void;
    mockServiceError: () => void;
  }> = [
    {
      name: 'POST /api/canteen/refund/review',
      method: 'POST',
      url: 'http://localhost:3000/api/canteen/refund/review',
      caller: (req) => postRefundReviewHandler(req),
      validBody: {
        refundId: 'ref_123',
        decision: 'APPROVE',
        reviewNotes: 'Disetujui',
      },
      permission: 'review_canteen_refund',
      mockServiceSuccess: () => {
        vi.spyOn(refundService, 'reviewRefund').mockResolvedValueOnce({
          success: true,
          message: 'Refund telah DISETUJUI',
          data: { refundId: 'ref_123', status: 'APPROVED', refundAmount: 5000, santriId: 'santri_001', newBalanceUangSaku: 50000 },
        });
      },
      mockServiceError: () => {
        vi.spyOn(refundService, 'reviewRefund').mockRejectedValueOnce(
          new Error('PG_ERROR_REFUND_INTERNAL: database failure')
        );
      },
    },
    {
      name: 'GET /api/canteen/refund',
      method: 'GET',
      url: 'http://localhost:3000/api/canteen/refund',
      caller: (req) => getRefundHandler(req),
      permission: 'view_canteen_refund',
      mockServiceSuccess: () => {
        vi.spyOn(refundService, 'listRefunds').mockResolvedValueOnce([]);
      },
      mockServiceError: () => {
        vi.spyOn(refundService, 'listRefunds').mockRejectedValueOnce(
          new Error('PG_ERROR_LIST_REFUNDS_INTERNAL')
        );
      },
    },
    {
      name: 'POST /api/canteen/refund',
      method: 'POST',
      url: 'http://localhost:3000/api/canteen/refund',
      caller: (req) => postRefundHandler(req),
      validBody: {
        transactionId: 'tx_001',
        reason: 'Salah menu',
        refundAmount: 5000,
      },
      permission: 'request_canteen_refund',
      mockServiceSuccess: () => {
        vi.spyOn(refundService, 'requestRefund').mockResolvedValueOnce({
          success: true,
          message: 'Pengajuan refund berhasil dibuat',
          data: { refundId: 'ref_123', transactionId: 'tx_001', refundAmount: 5000, status: 'PENDING_APPROVAL' },
        });
      },
      mockServiceError: () => {
        vi.spyOn(refundService, 'requestRefund').mockRejectedValueOnce(
          new Error('PG_ERROR_REQUEST_REFUND_INTERNAL')
        );
      },
    },
    {
      name: 'POST /api/canteen/pay',
      method: 'POST',
      url: 'http://localhost:3000/api/canteen/pay',
      caller: (req) => postPayHandler(req),
      validBody: {
        cardUid: 'CARD_001',
        pin: '123456',
        amount: 10000,
        canteenId: 'canteen_01',
      },
      permission: 'process_canteen_payment',
      mockServiceSuccess: () => {
        vi.spyOn(tenantTxModule, 'withTenantTransaction').mockImplementation(async (tenantId, cb) => {
          const mockCard = {
            id: 'card_001',
            tenantId,
            cardUid: 'CARD_001',
            santriId: 'santri_001',
            status: 'active',
            hashedPin: '1111222233334444555566667777888899990000111122223333444455556666',
            salt: '11112222333344445555666677778888',
            kdfVersion: 1,
            pepperVersion: 1,
            iterations: 1000,
            pinFailedAttempts: 0,
          };
          const mockSantri = {
            id: 'santri_001',
            name: 'Santri Budi',
            photoUrl: null,
            kelas: '7A',
          };
          const mockWallet = {
            id: 'wallet_001',
            tenantId,
            santriId: 'santri_001',
            balanceUangSaku: 50000,
            dailyLimit: 20000,
            canteenStatus: 'active',
          };

          type ChainableMock = unknown[] & {
            for: () => ChainableMock;
            limit: () => Promise<unknown[]>;
            orderBy: () => { limit: () => Promise<unknown[]> };
          };

          const makeQueryResult = (data: unknown[]) => {
            const arr = [...data] as ChainableMock;
            arr.for = () => arr;
            arr.limit = async () => arr;
            arr.orderBy = () => ({ limit: async () => arr });
            return arr;
          };

          return cb({
            select: () => ({
              from: (table: unknown) => {
                return {
                  where: () => {
                    if (table === rfidCards) return makeQueryResult([mockCard]);
                    if (table === santri) return makeQueryResult([mockSantri]);
                    if (table === wallets) return makeQueryResult([mockWallet]);
                    return makeQueryResult([]);
                  },
                  leftJoin: () => ({
                    where: () => makeQueryResult([]),
                  }),
                };
              },
            }),
            update: () => ({
              set: () => ({
                where: async () => [],
              }),
            }),
            insert: () => ({
              values: async () => [],
            }),
          } as unknown as Parameters<Parameters<typeof tenantTxModule.withTenantTransaction>[1]>[0]);
        });
      },
      mockServiceError: () => {
        vi.spyOn(tenantTxModule, 'withTenantTransaction').mockRejectedValueOnce(
          new Error('PG_ERROR_PAY_INTERNAL: dead-lock detected')
        );
      },
    },
    {
      name: 'GET /api/finance/reconciliation',
      method: 'GET',
      url: 'http://localhost:3000/api/finance/reconciliation',
      caller: (req) => getReconciliationHandler(req),
      permission: 'view_finance_reconciliation',
      mockServiceSuccess: () => {
        vi.spyOn(reconciliationEngine, 'getDashboardData').mockResolvedValueOnce({
          runs: [],
          anomalies: [],
        });
      },
      mockServiceError: () => {
        vi.spyOn(reconciliationEngine, 'getDashboardData').mockRejectedValueOnce(
          new Error('PG_ERROR_RECON_GET_INTERNAL')
        );
      },
    },
    {
      name: 'POST /api/finance/reconciliation',
      method: 'POST',
      url: 'http://localhost:3000/api/finance/reconciliation',
      caller: (req) => postReconciliationHandler(req),
      validBody: {
        action: 'run',
        runType: 'MANUAL',
      },
      permission: 'manage_finance_reconciliation',
      mockServiceSuccess: () => {
        vi.spyOn(reconciliationEngine, 'runReconciliation').mockResolvedValueOnce({
          runId: 'rec_001',
          status: 'COMPLETED',
          totalTransactionsChecked: 10,
          totalAmountChecked: 150000,
          discrepanciesCount: 0,
          anomalies: [],
        });
      },
      mockServiceError: () => {
        vi.spyOn(reconciliationEngine, 'runReconciliation').mockRejectedValueOnce(
          new Error('PG_ERROR_RECON_RUN_INTERNAL')
        );
      },
    },
    {
      name: 'GET /api/finance/audit-cctv/timeline',
      method: 'GET',
      url: 'http://localhost:3000/api/finance/audit-cctv/timeline',
      caller: (req) => getCctvTimelineHandler(req),
      permission: 'view_finance_audit_cctv',
      mockServiceSuccess: () => {
        // Default mocks in beforeEach cover success
      },
      mockServiceError: () => {
        vi.spyOn(tenantTxModule, 'withTenantTransaction').mockRejectedValueOnce(
          new Error('PG_ERROR_CCTV_INTERNAL: connection lost')
        );
      },
    },
  ];

  for (const route of routes) {
    describe(`Security Hardening: ${route.name}`, () => {
      // (i) Tanpa sesi -> 401
      it('(i) tanpa sesi server Supabase ditolak HTTP 401 UNAUTHENTICATED', async () => {
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
          permissions: [],
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
        expect(['FORBIDDEN', 'UNAUTHORIZED_REFUND_ROLE']).toContain(json.code);
      });

      // (iii) TenantId di body/query/header diabaikan dan tenant dari getTenantContext yang dipakai
      it('(iii) input tenantId di body, query, dan header x-tenant-id diabaikan sepenuhnya', async () => {
        mockFinanceAuthSession({
          userId: 'operator_user_01',
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
        const expectedStatus = route.method === 'POST' && route.name.includes('/refund') && !route.name.includes('/review') ? 201 : 200;
        expect(res.status).toBe(expectedStatus);
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

      // (v) Field pelaku di body diabaikan dan identitas dari sesi dipakai
      if (route.method === 'POST') {
        it('(v) field pelaku di body diabaikan dan identitas dari sesi server yang dipakai', async () => {
          const verifiedSessionUserId = 'verified_server_user_99';
          mockFinanceAuthSession({
            userId: verifiedSessionUserId,
            fullName: 'Ustadz Kasir Sah',
            tenantId: 'tenant_real',
            permissions: [route.permission],
          });
          route.mockServiceSuccess();

          const spoofedBody = {
            ...(route.validBody || {}),
            requestedBy: 'forged_requester_body',
            requestedByName: 'Forged Name',
            requestedByRole: 'superadmin',
            triggeredBy: 'forged_trigger_body',
            resolvedBy: 'forged_resolver_body',
            posCashierId: 'forged_pos_cashier',
          };

          const req = new Request(route.url, {
            method: route.method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(spoofedBody),
          });

          const res = await route.caller(req);
          const expectedStatus = route.name.includes('/refund') && !route.name.includes('/review') ? 201 : 200;
          expect(res.status).toBe(expectedStatus);

          // Verify that services were invoked with server session user ID, NOT client body ID
          if (route.name.includes('/refund') && !route.name.includes('/review')) {
            expect(refundService.requestRefund).toHaveBeenCalledWith(
              expect.objectContaining({
                requestedBy: verifiedSessionUserId,
              })
            );
          } else if (route.name.includes('/reconciliation')) {
            expect(reconciliationEngine.runReconciliation).toHaveBeenCalledWith(
              expect.objectContaining({
                triggeredBy: verifiedSessionUserId,
              })
            );
          }
        });
      }

      // (vi) Sukses dengan izin yang benar
      it('(vi) sukses memproses permintaan saat pengguna memiliki izin kanonik yang sesuai', async () => {
        mockFinanceAuthSession({
          userId: 'authorized_user_01',
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
        const expectedStatus = route.method === 'POST' && route.name.includes('/refund') && !route.name.includes('/review') ? 201 : 200;
        expect(res.status).toBe(expectedStatus);
      });

      // (vii) Respons error tidak memuat pesan internal
      it('(vii) respons error kegagalan internal tidak membocorkan stack, DB trace, atau error.message', async () => {
        mockFinanceAuthSession({
          userId: 'authorized_user_01',
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

        expect(rawBody).not.toContain('PG_ERROR');
        expect(rawBody).not.toContain('stack');
        expect(rawBody).not.toContain('dead-lock');
        expect(rawBody).not.toContain('column does not exist');
      });

      // (viii) Tanpa konteks tenant -> ditolak, tidak ada fallback 'default'
      it('(viii) tanpa konteks tenant valid ditolak HTTP 400 TENANT_NOT_FOUND (tanpa fallback default)', async () => {
        mockFinanceAuthSession({
          userId: 'authorized_user_01',
          tenantId: 'tenant_real',
          permissions: [route.permission],
        });

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

  // ── (ix) Aturan Khusus: Anti-Self-Approval & Directive 15 pada Refund Review ──
  describe('Aturan Khusus: POST /api/canteen/refund/review', () => {
    it('(ix) anti-self-approval: pengaju refund dilarang menyetujui refund miliknya sendiri (HTTP 403 FORBIDDEN_SELF_APPROVAL)', async () => {
      const sameUserId = 'user_requester_and_reviewer';
      mockFinanceAuthSession({
        userId: sameUserId,
        tenantId: 'tenant_real',
        permissions: ['review_canteen_refund'],
      });

      // Mock database returning that requestedBy equals current user.id
      vi.spyOn(tenantTxModule, 'withTenantTransaction').mockImplementation(async (tenantId, cb) => {
        return cb({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: async () => [
                  {
                    id: 'ref_123',
                    tenantId,
                    transactionId: 'tx_001',
                    requestedBy: sameUserId, // Self-approval attempt!
                    requestedByName: 'Pemohon Sendiri',
                    refundAmount: 5000,
                    status: 'PENDING_APPROVAL',
                  },
                ],
              }),
            }),
          }),
        } as unknown as Parameters<Parameters<typeof tenantTxModule.withTenantTransaction>[1]>[0]);
      });

      const req = new Request('http://localhost:3000/api/canteen/refund/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundId: 'ref_123',
          decision: 'APPROVE',
        }),
      });

      const res = await postRefundReviewHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('FORBIDDEN_SELF_APPROVAL');
      expect(json.message).toContain('dilarang menyetujui');
    });

    it('Directive 15: Super Admin platform ditolak untuk review operasional kasir refund (HTTP 403)', async () => {
      mockFinanceAuthSession({
        userId: 'superadmin_platform_01',
        tenantId: 'tenant_real',
        permissions: ['review_canteen_refund'],
      });

      vi.spyOn(authzModule, 'authorizePlatformRole').mockResolvedValueOnce({
        authorized: true,
        decision: 'AUTHORIZED',
        userId: 'superadmin_platform_01',
        effectivePermissions: new Set(['platform.super_admin']),
      });

      const req = new Request('http://localhost:3000/api/canteen/refund/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundId: 'ref_123',
          decision: 'APPROVE',
        }),
      });

      const res = await postRefundReviewHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHORIZED_REFUND_ROLE');
      expect(json.message).toContain('Super Admin platform tidak memiliki wewenang operasional kasir');
    });
  });
});
