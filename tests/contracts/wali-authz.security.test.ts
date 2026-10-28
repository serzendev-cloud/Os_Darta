// ==============================================================================
// Security Contract Tests: Wali SPP Route Authorization & Anti-Bypass
// Work Package: WP-SPP-01A (Remediasi Keamanan Otorisasi Route Wali)
// Directives: Fail-Closed Server Auth, Anti-Header Bypass, Strict Relationship Authz
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET as getWaliBillsHandler } from '@/app/api/wali/spp/bills/route';
import { POST as applyInstallmentHandler } from '@/app/api/wali/spp/installments/apply/route';
import * as authzModule from '@/lib/authz/authorization-service';
import * as tenantContextModule from '@/lib/tenant/context';
import { sppService } from '@/lib/finance/spp-service';
import * as supabaseServer from '@/lib/supabase/server';

describe('SECURITY CONTRACT: Wali Route Authorization & Anti-Bypass (WP-SPP-01A)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(tenantContextModule, 'getTenantContext').mockResolvedValue({
      id: 'tenant_darululum',
      name: 'Pesantren Darul Ulum',
      slug: 'darululum',
    });

    // Default mock: SPP Service methods succeed
    vi.spyOn(sppService, 'getWaliSppBills').mockResolvedValue([
      {
        id: 'bill_001',
        tenantId: 'tenant_darululum',
        santriId: 'santri_001',
        totalAmount: 500000,
        remainingAmount: 500000,
      } as any,
    ]);

    vi.spyOn(sppService, 'applyInstallmentPlan').mockResolvedValue({
      success: true,
      planId: 'plan_001',
      status: 'PENDING',
      message: 'Proposal cicilan berhasil diajukan',
    } as any);

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'wali_legit_001',
              email: 'wali@darululum.sch.id',
              user_metadata: { full_name: 'Wali Legit' },
            },
          },
          error: null,
        }),
      },
    } as any);
  });

  // ── SCENARIO 1: Unauthenticated Requests Must Return 401 ─────────────────────
  it('SEC-01: Permintaan tanpa sesi autentikasi atau identitas server ditolak 401 Unauthorized', async () => {
    // Mock Supabase getUser to return unauthenticated
    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('No session') }),
      },
    } as any);

    // Call GET bills without identity headers
    const reqBills = new Request('http://localhost:3000/api/wali/spp/bills?santriId=santri_001', {
      method: 'GET',
    });
    const resBills = await getWaliBillsHandler(reqBills);
    expect(resBills.status).toBe(401);
    const jsonBills = await resBills.json();
    expect(jsonBills.code).toBe('UNAUTHENTICATED');

    // Call POST installments without identity headers
    const reqApply = new Request('http://localhost:3000/api/wali/spp/installments/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        billId: 'bill_001',
        santriId: 'santri_001',
        requestedInstallmentsCount: 3,
        requestedAmountPerInstallment: 100000,
      }),
    });
    const resApply = await applyInstallmentHandler(reqApply);
    expect(resApply.status).toBe(401);
    const jsonApply = await resApply.json();
    expect(jsonApply.code).toBe('UNAUTHENTICATED');
  });

  // ── SCENARIO 2: Injected Header x-user-role Cannot Bypass Relationship Check ─
  it('SEC-02: Header palsu x-user-role=wali dan x-wali-id TIDAK BISA melewati pengecekan relasi santri', async () => {
    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'wali_attacker',
              email: 'attacker@example.com',
            },
          },
          error: null,
        }),
      },
    } as any);

    // Mock authorization service to DENY access (simulating attacker requesting non-related santri)
    vi.spyOn(authzModule, 'authorizeWaliSantriAccess').mockResolvedValue({
      authorized: false,
      decision: 'DENIED_RELATIONSHIP_INACTIVE',
      effectivePermissions: new Set(),
      reason: 'Wali user has no active relationship with Santri santri_unauthorized',
    });

    const maliciousHeaders = {
      'x-tenant-id': 'tenant_darululum',
      'x-wali-id': 'wali_attacker',
      'x-user-role': 'wali', // Previously this was isTestBypass!
    };

    // 1. Attacker attempts to read bills of unauthorized santri
    const reqBills = new Request('http://localhost:3000/api/wali/spp/bills?santriId=santri_unauthorized', {
      method: 'GET',
      headers: maliciousHeaders,
    });
    const resBills = await getWaliBillsHandler(reqBills);
    expect(resBills.status).toBe(403);
    const jsonBills = await resBills.json();
    expect(jsonBills.success).toBe(false);
    expect(jsonBills.code).toBe('DENIED_RELATIONSHIP_INACTIVE');
    expect(sppService.getWaliSppBills).not.toHaveBeenCalled();

    // 2. Attacker attempts to apply installment for unauthorized santri
    const reqApply = new Request('http://localhost:3000/api/wali/spp/installments/apply', {
      method: 'POST',
      headers: {
        ...maliciousHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billId: 'bill_001',
        santriId: 'santri_unauthorized',
        requestedInstallmentsCount: 3,
        requestedAmountPerInstallment: 100000,
        reason: 'Pengajuan tidak sah',
      }),
    });
    const resApply = await applyInstallmentHandler(reqApply);
    expect(resApply.status).toBe(403);
    const jsonApply = await resApply.json();
    expect(jsonApply.success).toBe(false);
    expect(jsonApply.code).toBe('DENIED_RELATIONSHIP_INACTIVE');
    expect(sppService.applyInstallmentPlan).not.toHaveBeenCalled();
  });

  // ── SCENARIO 3: Authorized Wali Can Access Their Own Santri ───────────────────
  it('SEC-03: Wali dengan relasi sah diverifikasi berhasil mengakses tagihan & mengajukan cicilan', async () => {
    // Mock authorization service to GRANT access
    vi.spyOn(authzModule, 'authorizeWaliSantriAccess').mockResolvedValue({
      authorized: true,
      decision: 'AUTHORIZED',
      effectivePermissions: new Set(['view_own_data']),
    });

    const validHeaders = {
      'x-tenant-id': 'tenant_darululum',
      'x-wali-id': 'wali_legit_001',
      'x-user-role': 'wali',
    };

    // 1. Read bills of authorized santri
    const reqBills = new Request('http://localhost:3000/api/wali/spp/bills?santriId=santri_legit_001', {
      method: 'GET',
      headers: validHeaders,
    });
    const resBills = await getWaliBillsHandler(reqBills);
    expect(resBills.status).toBe(200);
    const jsonBills = await resBills.json();
    expect(jsonBills.success).toBe(true);
    expect(sppService.getWaliSppBills).toHaveBeenCalledWith('tenant_darululum', 'wali_legit_001', 'santri_legit_001');

    // 2. Apply installment for authorized santri
    const reqApply = new Request('http://localhost:3000/api/wali/spp/installments/apply', {
      method: 'POST',
      headers: {
        ...validHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billId: 'bill_001',
        santriId: 'santri_legit_001',
        requestedInstallmentsCount: 3,
        requestedAmountPerInstallment: 166667,
        reason: 'Pengajuan cicilan resmi wali santri',
      }),
    });
    const resApply = await applyInstallmentHandler(reqApply);
    expect(resApply.status).toBe(201);
    const jsonApply = await resApply.json();
    expect(jsonApply.success).toBe(true);
    expect(sppService.applyInstallmentPlan).toHaveBeenCalled();
  });

  // ── SCENARIO 4: Missing Input Validation Returns 400 ─────────────────────────
  it('SEC-04: Pengajuan cicilan dengan parameter tidak lengkap ditolak 400 Bad Request', async () => {
    vi.spyOn(authzModule, 'authorizeWaliSantriAccess').mockResolvedValue({
      authorized: true,
      decision: 'AUTHORIZED',
      effectivePermissions: new Set(['view_own_data']),
    });

    const headers = {
      'x-tenant-id': 'tenant_darululum',
      'x-wali-id': 'wali_legit_001',
      'Content-Type': 'application/json',
    };

    // Missing santriId
    const req1 = new Request('http://localhost:3000/api/wali/spp/installments/apply', {
      method: 'POST',
      headers,
      body: JSON.stringify({ billId: 'bill_001', requestedInstallmentsCount: 3 }),
    });
    const res1 = await applyInstallmentHandler(req1);
    expect(res1.status).toBe(400);

    // Invalid installment count (< 2)
    const req2 = new Request('http://localhost:3000/api/wali/spp/installments/apply', {
      method: 'POST',
      headers,
      body: JSON.stringify({ billId: 'bill_001', santriId: 'santri_001', requestedInstallmentsCount: 1 }),
    });
    const res2 = await applyInstallmentHandler(req2);
    expect(res2.status).toBe(400);
  });

  // ── SCENARIO 5: Anti-Tenant-Spoofing & Failed Tenant Context Fail-Closed ──────
  it('SEC-05: Header x-tenant-id palsu diabaikan; jika getTenantContext gagal, request ditolak 400 TENANT_NOT_FOUND', async () => {
    // Simulasi kegagalan konteks tenant server
    vi.spyOn(tenantContextModule, 'getTenantContext').mockRejectedValue(
      new tenantContextModule.TenantNotFoundError('tenant-palsu')
    );

    // Klien mencoba mengirimkan header x-tenant-id palsu
    const req = new Request('http://localhost:3000/api/wali/spp/bills?santriId=santri_001', {
      method: 'GET',
      headers: {
        'x-tenant-id': 'tenant_pesantren_lain_ilegal',
        'x-wali-id': 'wali_legit_001',
      },
    });

    const res = await getWaliBillsHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('TENANT_NOT_FOUND');
    // Buktikan service layer TIDAK PERNAH dipanggil dengan tenant palsu
    expect(sppService.getWaliSppBills).not.toHaveBeenCalled();
  });

  // ── SCENARIO 6: Anti-Tenant-Spoofing on Apply Installment ─────────────────────
  it('SEC-06: Pengajuan cicilan dengan tenant palsu ditolak 400 saat konteks server gagal', async () => {
    vi.spyOn(tenantContextModule, 'getTenantContext').mockRejectedValue(
      new tenantContextModule.TenantNotFoundError('tenant-tidak-ada')
    );

    const req = new Request('http://localhost:3000/api/wali/spp/installments/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': 'tenant_injected_header',
        'x-wali-id': 'wali_legit_001',
      },
      body: JSON.stringify({
        tenantId: 'tenant_injected_body',
        billId: 'bill_001',
        santriId: 'santri_001',
        requestedInstallmentsCount: 3,
        requestedAmountPerInstallment: 150000,
      }),
    });

    const res = await applyInstallmentHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('TENANT_NOT_FOUND');
    expect(sppService.applyInstallmentPlan).not.toHaveBeenCalled();
  });

  // ── SCENARIO 7: Database Error Sanitization (Zero Error Leakage) ──────────────
  it('SEC-07: Kegagalan database konteks tenant mengembalikan pesan publik generik tanpa membocorkan internal database error', async () => {
    vi.spyOn(tenantContextModule, 'getTenantContext').mockRejectedValue(
      new tenantContextModule.TenantUnavailableError('FATAL: password authentication failed for user postgres at pg_hba.conf:120')
    );

    const req = new Request('http://localhost:3000/api/wali/spp/bills?santriId=santri_001', {
      method: 'GET',
      headers: {
        'x-wali-id': 'wali_legit_001',
      },
    });

    const res = await getWaliBillsHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('TENANT_NOT_FOUND');
    // Verifikasi TIDAK ADA kebocoran connection string / internal database message ke user
    expect(json.message).toBe('Konteks tenant tidak ditemukan atau tidak valid');
    expect(json.message).not.toContain('FATAL');
    expect(json.message).not.toContain('postgres');
  });

  // ── SCENARIO 8: Cross-Tenant Santri Access (Tenant Mismatch Ditolak 403) ──────
  it('SEC-08: Wali dari Tenant A mencoba mengakses santri milik Tenant B ditolak 403 Forbidden', async () => {
    // getTenantContext mengembalikan Tenant A
    vi.spyOn(tenantContextModule, 'getTenantContext').mockResolvedValue({
      id: 'tenant_pesantren_a',
      name: 'Pesantren A',
      slug: 'pesantren-a',
    });

    // AuthorizeWaliSantriAccess menolak karena santri_cross milik Tenant B
    vi.spyOn(authzModule, 'authorizeWaliSantriAccess').mockResolvedValue({
      authorized: false,
      decision: 'DENIED_RELATIONSHIP_INACTIVE',
      effectivePermissions: new Set(),
      reason: 'Santri santri_cross terdaftar di bawah tenant lain (tenant_pesantren_b)',
    });

    const req = new Request('http://localhost:3000/api/wali/spp/bills?santriId=santri_cross', {
      method: 'GET',
      headers: {
        'x-wali-id': 'wali_001',
      },
    });

    const res = await getWaliBillsHandler(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('DENIED_RELATIONSHIP_INACTIVE');
    expect(sppService.getWaliSppBills).not.toHaveBeenCalled();
  });

  // ── SCENARIO 9: Sensitive Database Error Sanitization on Apply Installment ──
  it('SEC-09: Error buatan berisi string koneksi sensitif pada apply installment tidak bocor ke respons publik', async () => {
    vi.spyOn(authzModule, 'authorizeWaliSantriAccess').mockResolvedValue({
      authorized: true,
      decision: 'AUTHORIZED',
      effectivePermissions: new Set(['view_own_data']),
    });

    // Simulasi database error yang memuat detail koneksi mentah
    vi.spyOn(sppService, 'applyInstallmentPlan').mockRejectedValue(
      new Error('DATABASE_CONNECTION_ERROR: Connection to postgresql://postgres:super_secret_db_pass@db.internal:5432/mahad failed')
    );

    const req = new Request('http://localhost:3000/api/wali/spp/installments/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wali-id': 'wali_legit_001',
      },
      body: JSON.stringify({
        billId: 'bill_001',
        santriId: 'santri_001',
        requestedInstallmentsCount: 3,
        requestedAmountPerInstallment: 150000,
      }),
    });

    const res = await applyInstallmentHandler(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toBe('Gagal memproses pengajuan cicilan SPP');
    expect(json.message).not.toContain('super_secret_db_pass');
    expect(json.message).not.toContain('postgresql://');
    expect(json.message).not.toContain('db.internal');
  });

  // ── SCENARIO 10: Wali Queries All Assigned Santri Bills (No santriId Filter) ──
  it('SEC-10: Permintaan GET /api/wali/spp/bills tanpa parameter santriId memanggil service untuk seluruh santri wali', async () => {
    const validHeaders = {
      'x-tenant-id': 'tenant_darululum',
      'x-wali-id': 'wali_legit_001',
    };

    const req = new Request('http://localhost:3000/api/wali/spp/bills', {
      method: 'GET',
      headers: validHeaders,
    });

    const res = await getWaliBillsHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(sppService.getWaliSppBills).toHaveBeenCalledWith('tenant_darululum', 'wali_legit_001', undefined);
  });

  // ── SCENARIO 11: Empty Tenant ID Context on GET Bills (Fail-Closed) ───────────
  it('SEC-11: Konteks tenant dengan ID kosong ditolak 400 INVALID_TENANT_CONTEXT pada GET bills', async () => {
    vi.spyOn(tenantContextModule, 'getTenantContext').mockResolvedValue({
      id: '',
      name: 'Pesantren Tanpa ID',
      slug: 'tanpa-id',
    } as any);

    const req = new Request('http://localhost:3000/api/wali/spp/bills?santriId=santri_001', {
      method: 'GET',
      headers: {
        'x-wali-id': 'wali_legit_001',
      },
    });

    const res = await getWaliBillsHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('INVALID_TENANT_CONTEXT');
    expect(sppService.getWaliSppBills).not.toHaveBeenCalled();
  });

  // ── SCENARIO 12: Empty Tenant ID Context on Apply Installment (Fail-Closed) ───
  it('SEC-12: Konteks tenant dengan ID kosong ditolak 400 INVALID_TENANT_CONTEXT pada POST apply installment', async () => {
    vi.spyOn(tenantContextModule, 'getTenantContext').mockResolvedValue({
      id: '',
      name: 'Pesantren Tanpa ID',
      slug: 'tanpa-id',
    } as any);

    const req = new Request('http://localhost:3000/api/wali/spp/installments/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wali-id': 'wali_legit_001',
      },
      body: JSON.stringify({
        billId: 'bill_001',
        santriId: 'santri_001',
        requestedInstallmentsCount: 3,
        requestedAmountPerInstallment: 150000,
      }),
    });

    const res = await applyInstallmentHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('INVALID_TENANT_CONTEXT');
    expect(sppService.applyInstallmentPlan).not.toHaveBeenCalled();
  });

  // ── SCENARIO 13: Service Rejection with INVALID_INSTALLMENT_AMOUNT Returns 400 Sanitized ─
  it('SEC-13: Error nominal cicilan tidak valid dari service dikembalikan sebagai 400 dengan pesan generik tersanitasi', async () => {
    vi.spyOn(authzModule, 'authorizeWaliSantriAccess').mockResolvedValue({
      authorized: true,
      decision: 'AUTHORIZED',
      effectivePermissions: new Set(['view_own_data']),
    });

    vi.spyOn(sppService, 'applyInstallmentPlan').mockRejectedValue(
      new Error('INVALID_INSTALLMENT_AMOUNT: Total cicilan (150000 x 3 = 450000) tidak sesuai sisa tagihan 500000')
    );

    const req = new Request('http://localhost:3000/api/wali/spp/installments/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wali-id': 'wali_legit_001',
      },
      body: JSON.stringify({
        billId: 'bill_001',
        santriId: 'santri_001',
        requestedInstallmentsCount: 3,
        requestedAmountPerInstallment: 150000,
      }),
    });

    const res = await applyInstallmentHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toBe('Parameter pengajuan cicilan tidak memenuhi ketentuan nominal atau jumlah angsuran');
    // Verifikasi pesan internal tidak bocor
    expect(json.message).not.toContain('450000');
    expect(json.message).not.toContain('500000');
  });

  // ── SCENARIO 14: Conflict on Existing Pending Plan Returns 409 Sanitized ─────
  it('SEC-14: Penolakan karena proposal cicilan sudah berstatus pending dikembalikan sebagai 409 tanpa membocorkan ID internal', async () => {
    vi.spyOn(authzModule, 'authorizeWaliSantriAccess').mockResolvedValue({
      authorized: true,
      decision: 'AUTHORIZED',
      effectivePermissions: new Set(['view_own_data']),
    });

    vi.spyOn(sppService, 'applyInstallmentPlan').mockRejectedValue(
      new Error('PENDING_PLAN_EXISTS: Plan plan_uuid_secret_999 is currently pending approval')
    );

    const req = new Request('http://localhost:3000/api/wali/spp/installments/apply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-wali-id': 'wali_legit_001',
      },
      body: JSON.stringify({
        billId: 'bill_001',
        santriId: 'santri_001',
        requestedInstallmentsCount: 3,
        requestedAmountPerInstallment: 166667,
      }),
    });

    const res = await applyInstallmentHandler(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toBe('Pengajuan cicilan tidak dapat diproses karena proposal atau tagihan sudah berstatus aktif/lunas');
    // Buktikan ID internal plan tidak bocor
    expect(json.message).not.toContain('plan_uuid_secret_999');
  });
});
