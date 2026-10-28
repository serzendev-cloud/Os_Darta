/* eslint-disable @typescript-eslint/no-explicit-any */
// ========================================
// Contract Security Test Suite: Gate & PPOB Fail-Closed Security
// Traceability: WP-SEC-FAILCLOSED-001
// Compliance: Fail-Closed Auth (401), Strict RBAC (403), Isolated Tenancy, Zero Client Trust
// ========================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rfidCards, santri, gatePasses } from '@/lib/db/schema';

// Module-level mock functions hoisted safely
const {
  mockGetTenantContext,
  mockRequirePermission,
  mockAuthorizeWaliSantriAccess,
  mockWithTenantTransaction,
  mockGetUser,
  mockDigiflazz,
  mockSaasPayment,
} = vi.hoisted(() => ({
  mockGetTenantContext: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockAuthorizeWaliSantriAccess: vi.fn(),
  mockWithTenantTransaction: vi.fn(),
  mockGetUser: vi.fn(),
  mockDigiflazz: {
    createTransaction: vi.fn(),
    inquiryCustomer: vi.fn(),
  },
  mockSaasPayment: {
    createInvoice: vi.fn(),
  },
}));

vi.mock('@/lib/tenant/context', () => ({
  DEFAULT_TENANT: { id: 'default', slug: 'default', name: 'Default Tenant' },
  getTenantContext: () => mockGetTenantContext(),
}));

vi.mock('@/lib/authz/authorization-service', () => ({
  requirePermission: (...args: any[]) => mockRequirePermission(...args),
  authorizeWaliSantriAccess: (...args: any[]) => mockAuthorizeWaliSantriAccess(...args),
}));

vi.mock('@/lib/db/tenant-transaction', () => ({
  withTenantTransaction: (tenantId: string, cb: any, opts?: any) => mockWithTenantTransaction(tenantId, cb, opts),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

vi.mock('@/lib/ppob/digiflazz', () => ({
  digiflazzClient: mockDigiflazz,
}));

vi.mock('@/lib/ppob/saas-payment', () => ({
  saasPaymentClient: mockSaasPayment,
}));

import { POST as postScanIn } from '@/app/api/gate/scan-in/route';
import { POST as postScanOut } from '@/app/api/gate/scan-out/route';
import { POST as postPpobCheckout } from '@/app/api/ppob/checkout/route';
import { POST as postPpobInquiry } from '@/app/api/ppob/inquiry/route';

function extractParams(sqlObj: any): any[] {
  if (!sqlObj) return [];
  const params: any[] = [];
  function walk(node: any) {
    if (!node) return;
    if (node.value !== undefined && (node.constructor?.name === 'Param' || 'encoder' in node)) {
      params.push(node.value);
    } else if (Array.isArray(node.queryChunks)) {
      node.queryChunks.forEach(walk);
    }
  }
  walk(sqlObj);
  return params;
}

describe('WP-SEC-FAILCLOSED-001 — Gate Checkpoint & PPOB Fail-Closed Contracts', () => {
  let mockCards: any[];
  let mockSantri: any[];
  let mockGatePasses: any[];

  beforeEach(() => {
    vi.clearAllMocks();

    mockCards = [
      {
        id: 'card_real_01',
        tenantId: 'tenant_al_fatih',
        cardUid: 'RFID_GATE_001',
        santriId: 'santri_001',
        status: 'active',
      },
      {
        id: 'card_foreign_01',
        tenantId: 'tenant_other_mahad',
        cardUid: 'RFID_FOREIGN_999',
        santriId: 'santri_999',
        status: 'active',
      },
    ];

    mockSantri = [
      {
        id: 'santri_001',
        tenantId: 'tenant_al_fatih',
        name: 'Ahmad Fulan',
        kelas: '7-A',
        photoUrl: 'https://cdn.example.com/santri001.jpg',
      },
    ];

    mockGatePasses = [
      {
        id: 'pass_out_01',
        tenantId: 'tenant_al_fatih',
        santriId: 'santri_001',
        status: 'CHECKED_OUT',
        jenisIzin: 'PULANG',
        checkOutTime: new Date(Date.now() - 60 * 60 * 1000), // 1 jam lalu
        validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 jam ke depan (tepat waktu)
      },
      {
        id: 'pass_appr_01',
        tenantId: 'tenant_al_fatih',
        santriId: 'santri_001',
        status: 'APPROVED',
        jenisIzin: 'PESIAR',
        validUntil: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
    ];

    // Default mock returns
    mockGetTenantContext.mockResolvedValue({
      id: 'tenant_al_fatih',
      name: 'Pesantren Al-Fatih',
      slug: 'al-fatih',
    });

    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user_operator_01', email: 'satpam@alfatih.sch.id' } },
      error: null,
    });

    mockRequirePermission.mockResolvedValue({
      authorized: true,
      decision: 'AUTHORIZED',
      effectivePermissions: new Set(['process_gate_scan', 'process_ppob_checkout']),
    });

    mockAuthorizeWaliSantriAccess.mockResolvedValue({
      authorized: true,
      decision: 'AUTHORIZED',
    });

    mockWithTenantTransaction.mockImplementation(async (tenantId: string, cb: any) => {
      const tx = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table) => ({
            where: vi.fn().mockImplementation((whereClause: any) => {
              const params = extractParams(whereClause);
              if (table === rfidCards) {
                return Promise.resolve(
                  mockCards.filter((c) => c.tenantId === tenantId && (params.length === 0 || params.includes(c.cardUid)))
                );
              }
              if (table === santri) {
                return Promise.resolve(
                  mockSantri.filter((s) => s.tenantId === tenantId && (params.length === 0 || params.includes(s.id)))
                );
              }
              if (table === gatePasses) {
                return Promise.resolve(
                  mockGatePasses.filter(
                    (g) =>
                      g.tenantId === tenantId &&
                      (params.length === 0 || params.includes(g.santriId)) &&
                      (params.includes('CHECKED_OUT')
                        ? g.status === 'CHECKED_OUT'
                        : params.includes('APPROVED')
                        ? g.status === 'APPROVED'
                        : true)
                  )
                );
              }
              return Promise.resolve([]);
            }),
          })),
        })),
        update: vi.fn().mockImplementation((table) => ({
          set: vi.fn().mockImplementation((_setData) => ({
            where: vi.fn().mockImplementation((_whereClause) => {
              return Promise.resolve();
            }),
          })),
        })),
      };

      return await cb(tx);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. GATE SCAN-IN CONTRACTS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Route: POST /api/gate/scan-in', () => {
    it('(i) Tanpa sesi: menolak perangkat/klien tanpa sesi login operator (HTTP 401)', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Missing session') });

      const req = new Request('http://localhost:3000/api/gate/scan-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: 'RFID_GATE_001' }),
      });

      const res = await postScanIn(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('(ii) Sesi tanpa izin: menolak operator tanpa izin process_gate_scan (HTTP 403)', async () => {
      mockRequirePermission.mockResolvedValueOnce({
        authorized: false,
        decision: 'DENIED_PERMISSION_MISSING',
        reason: 'Forbidden: Missing process_gate_scan',
      });

      const req = new Request('http://localhost:3000/api/gate/scan-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: 'RFID_GATE_001' }),
      });

      const res = await postScanIn(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('FORBIDDEN');
    });

    it('(iii) Konteks tenant: tenantId di body diabaikan; tanpa konteks tenant -> ditolak (HTTP 400)', async () => {
      mockGetTenantContext.mockResolvedValueOnce(null);

      const req = new Request('http://localhost:3000/api/gate/scan-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: 'RFID_GATE_001', tenantId: 'attacker_target_tenant' }),
      });

      const res = await postScanIn(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('TENANT_NOT_FOUND');
    });

    it('(iv) Sukses dengan izin: memproses presensi kedatangan tepat waktu (HTTP 200)', async () => {
      const req = new Request('http://localhost:3000/api/gate/scan-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: 'RFID_GATE_001' }),
      });

      const res = await postScanIn(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.code).toBe('SCAN_IN_SUCCESS');
      expect(json.data.santriName).toBe('Ahmad Fulan');
      expect(json.data.status).toBe('COMPLETED');
      expect(json.data.isLate).toBe(false);
    });

    it('(v) Respons error: kegagalan internal database tidak membocorkan SQL error atau stack (HTTP 500)', async () => {
      mockWithTenantTransaction.mockRejectedValueOnce(new Error('FATAL: connection to server at 10.0.0.1 failed'));

      const req = new Request('http://localhost:3000/api/gate/scan-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: 'RFID_GATE_001' }),
      });

      const res = await postScanIn(req);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('INTERNAL_SERVER_ERROR');
      expect(json.message).not.toContain('FATAL');
      expect(json.message).not.toContain('10.0.0.1');
    });

    it('(vii) Isolasi multi-tenant: kartu milik tenant lain ditolak (HTTP 404)', async () => {
      const req = new Request('http://localhost:3000/api/gate/scan-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: 'RFID_FOREIGN_999' }),
      });

      const res = await postScanIn(req);
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('CARD_NOT_FOUND');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. GATE SCAN-OUT CONTRACTS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Route: POST /api/gate/scan-out', () => {
    it('(i) Tanpa sesi: menolak perangkat/klien tanpa sesi login operator (HTTP 401)', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Missing session') });

      const req = new Request('http://localhost:3000/api/gate/scan-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: 'RFID_GATE_001' }),
      });

      const res = await postScanOut(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('(ii) Sesi tanpa izin: menolak operator tanpa izin process_gate_scan (HTTP 403)', async () => {
      mockRequirePermission.mockResolvedValueOnce({
        authorized: false,
        decision: 'DENIED_PERMISSION_MISSING',
      });

      const req = new Request('http://localhost:3000/api/gate/scan-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: 'RFID_GATE_001' }),
      });

      const res = await postScanOut(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('FORBIDDEN');
    });

    it('(iii) Konteks tenant: tenantId di body diabaikan; tanpa konteks tenant -> ditolak (HTTP 400)', async () => {
      mockGetTenantContext.mockResolvedValueOnce(null);

      const req = new Request('http://localhost:3000/api/gate/scan-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: 'RFID_GATE_001', tenantId: 'injected_tenant' }),
      });

      const res = await postScanOut(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('TENANT_NOT_FOUND');
    });

    it('(iv) Sukses dengan izin: memproses presensi keluar gerbang dengan izin APPROVED (HTTP 200)', async () => {
      const req = new Request('http://localhost:3000/api/gate/scan-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: 'RFID_GATE_001' }),
      });

      const res = await postScanOut(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.code).toBe('SCAN_OUT_SUCCESS');
      expect(json.data.santriName).toBe('Ahmad Fulan');
      expect(json.data.passId).toBe('pass_appr_01');
    });

    it('(v) Respons error: kegagalan internal database tidak membocorkan SQL error atau stack (HTTP 500)', async () => {
      mockWithTenantTransaction.mockRejectedValueOnce(new Error('DrizzleQueryError: select timeout'));

      const req = new Request('http://localhost:3000/api/gate/scan-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: 'RFID_GATE_001' }),
      });

      const res = await postScanOut(req);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('INTERNAL_SERVER_ERROR');
      expect(json.message).not.toContain('DrizzleQueryError');
    });

    it('(vii) Isolasi multi-tenant: kartu milik tenant lain ditolak (HTTP 404)', async () => {
      const req = new Request('http://localhost:3000/api/gate/scan-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardUid: 'RFID_FOREIGN_999' }),
      });

      const res = await postScanOut(req);
      expect(res.status).toBe(404);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('CARD_NOT_FOUND');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. PPOB CHECKOUT CONTRACTS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Route: POST /api/ppob/checkout', () => {
    it('(i) Tanpa sesi: menolak request checkout PPOB tanpa sesi login (HTTP 401)', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('No auth cookie') });

      const req = new Request('http://localhost:3000/api/ppob/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerSkuCode: 'PLN_TOKEN_20K',
          customerNo: '1234567890',
          totalAmount: 22000,
        }),
      });

      const res = await postPpobCheckout(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('(ii) Sesi tanpa izin: menolak pengguna tanpa izin process_ppob_checkout (HTTP 403)', async () => {
      mockRequirePermission.mockResolvedValueOnce({
        authorized: false,
        decision: 'DENIED_PERMISSION_MISSING',
      });

      const req = new Request('http://localhost:3000/api/ppob/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerSkuCode: 'PLN_TOKEN_20K',
          customerNo: '1234567890',
          totalAmount: 22000,
        }),
      });

      const res = await postPpobCheckout(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('FORBIDDEN');
    });

    it('(iii) Konteks tenant: tenantId di body diabaikan; tanpa konteks tenant -> ditolak (HTTP 400)', async () => {
      mockGetTenantContext.mockResolvedValueOnce(null);

      const req = new Request('http://localhost:3000/api/ppob/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'unauthorized_target_tenant',
          buyerSkuCode: 'PLN_TOKEN_20K',
          customerNo: '1234567890',
          totalAmount: 22000,
        }),
      });

      const res = await postPpobCheckout(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('TENANT_NOT_FOUND');
    });

    it('Verifikasi hak wali-santri: menolak jika santriId bukan asuhan wali sah (HTTP 403)', async () => {
      mockAuthorizeWaliSantriAccess.mockResolvedValueOnce({
        authorized: false,
        decision: 'DENIED_RELATIONSHIP_INACTIVE',
      });

      const req = new Request('http://localhost:3000/api/ppob/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          santriId: 'santri_bukan_anaknya',
          buyerSkuCode: 'PLN_TOKEN_20K',
          customerNo: '1234567890',
          totalAmount: 22000,
        }),
      });

      const res = await postPpobCheckout(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('FORBIDDEN_WALI_RELATION');
    });

    it('(vi) Fail-Closed & Zero Client Trust: walletBalanceCurrent di body diabaikan, provider eksternal TIDAK dipanggil, return HTTP 503', async () => {
      const req = new Request('http://localhost:3000/api/ppob/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waliId: 'wali-hacker-007',
          tenantId: 'pesantren-fake',
          walletBalanceCurrent: 999999999, // Klaim saldo sepihak diabaikan
          paymentMethod: 'SALDO_PPOB',
          buyerSkuCode: 'PLN_TOKEN_20K',
          customerNo: '1234567890',
          totalAmount: 22000,
        }),
      });

      const res = await postPpobCheckout(req);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('SERVICE_UNAVAILABLE');

      // Provider eksternal MUTLAK tidak boleh dipanggil
      expect(mockDigiflazz.createTransaction).not.toHaveBeenCalled();
      expect(mockDigiflazz.inquiryCustomer).not.toHaveBeenCalled();
      expect(mockSaasPayment.createInvoice).not.toHaveBeenCalled();
    });

    it('(v) Respons error: penanganan error internal aman tanpa bocoran stack atau internal message (HTTP 500)', async () => {
      mockRequirePermission.mockRejectedValueOnce(new Error('PG_ERROR_PPOB_POOL_EXHAUSTED'));

      const req = new Request('http://localhost:3000/api/ppob/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerSkuCode: 'PLN_TOKEN_20K',
          customerNo: '1234567890',
          totalAmount: 22000,
        }),
      });

      const res = await postPpobCheckout(req);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('INTERNAL_SERVER_ERROR');
      expect(json.message).not.toContain('PG_ERROR_PPOB_POOL_EXHAUSTED');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. PPOB INQUIRY CONTRACTS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Route: POST /api/ppob/inquiry', () => {
    it('(i) Tanpa sesi: menolak inkuiri tanpa sesi login (HTTP 401)', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('No session') });

      const req = new Request('http://localhost:3000/api/ppob/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerNo: '5123456789', skuCode: 'pln' }),
      });

      const res = await postPpobInquiry(req);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('(ii) Sesi tanpa izin: menolak pengguna tanpa izin process_ppob_checkout (HTTP 403)', async () => {
      mockRequirePermission.mockResolvedValueOnce({
        authorized: false,
        decision: 'DENIED_PERMISSION_MISSING',
      });

      const req = new Request('http://localhost:3000/api/ppob/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerNo: '5123456789', skuCode: 'pln' }),
      });

      const res = await postPpobInquiry(req);
      expect(res.status).toBe(403);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('FORBIDDEN');
    });

    it('(iii) Konteks tenant: tanpa konteks tenant -> ditolak (HTTP 400)', async () => {
      mockGetTenantContext.mockResolvedValueOnce(null);

      const req = new Request('http://localhost:3000/api/ppob/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerNo: '5123456789', skuCode: 'pln' }),
      });

      const res = await postPpobInquiry(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('TENANT_NOT_FOUND');
    });

    it('(iv) Sukses dengan izin: memanggil provider dan mengembalikan data inkuiri (HTTP 200)', async () => {
      mockDigiflazz.inquiryCustomer.mockResolvedValueOnce({
        status: true,
        customerName: 'Budi Santoso',
        subscriberId: '5123456789',
        segmentPower: 'R1 / 1300 VA',
      });

      const req = new Request('http://localhost:3000/api/ppob/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerNo: '5123456789', skuCode: 'pln' }),
      });

      const res = await postPpobInquiry(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.code).toBe('INQUIRY_SUCCESS');
      expect(json.data.customerName).toBe('Budi Santoso');
      expect(mockDigiflazz.inquiryCustomer).toHaveBeenCalledWith('5123456789', 'pln');
    });

    it('(v) Respons error: kegagalan internal provider atau kode tidak membocorkan stack ke klien (HTTP 500)', async () => {
      mockDigiflazz.inquiryCustomer.mockRejectedValueOnce(new Error('INTERNAL_DIGIFLAZZ_TIMEOUT_SOCKET_ERR'));

      const req = new Request('http://localhost:3000/api/ppob/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerNo: '5123456789', skuCode: 'pln' }),
      });

      const res = await postPpobInquiry(req);
      expect(res.status).toBe(500);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.code).toBe('INTERNAL_SERVER_ERROR');
      expect(json.message).not.toContain('INTERNAL_DIGIFLAZZ_TIMEOUT_SOCKET_ERR');
    });
  });
});

