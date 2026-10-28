/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tenant/branding/route';

const {
  mockGetTenantContext,
  mockRequirePermission,
  mockAuthorizePlatformRole,
  mockWithTenantTransaction,
  mockGetUser,
} = vi.hoisted(() => ({
  mockGetTenantContext: vi.fn(),
  mockRequirePermission: vi.fn(),
  mockAuthorizePlatformRole: vi.fn(),
  mockWithTenantTransaction: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('@/lib/tenant/context', () => ({
  getTenantContext: () => mockGetTenantContext(),
}));

vi.mock('@/lib/authz/authorization-service', () => ({
  requirePermission: (...args: any[]) => mockRequirePermission(...args),
  authorizePlatformRole: (...args: any[]) => mockAuthorizePlatformRole(...args),
}));

vi.mock('@/lib/db/tenant-transaction', () => ({
  withTenantTransaction: (tenantId: string, cb: any, opts: any) => mockWithTenantTransaction(tenantId, cb, opts),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

describe('WP-SEC-FINAL-001 — Tenant Branding Security Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetTenantContext.mockResolvedValue({
      id: 'tenant-al-fatih',
      name: 'Pesantren Al Fatih',
      slug: 'alfatih',
    });

    mockAuthorizePlatformRole.mockResolvedValue({
      authorized: false,
    });

    mockRequirePermission.mockResolvedValue({
      authorized: true,
      decision: 'AUTHORIZED',
    });

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-admin-1',
          email: 'admin@alfatih.sch.id',
        },
      },
      error: null,
    });

    mockWithTenantTransaction.mockImplementation(async (tenantId: string, cb: any) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              {
                id: 'ts_tenant-al-fatih',
                tenantId,
                loginTitle: 'Portal Santri Al Fatih',
                loginSubtitle: 'Malang Jawa Timur',
                loginDescription: 'Sistem Terpadu Pesantren',
                customLogoUrl: 'https://cdn.example.com/logo.png',
                customBgUrl: 'https://cdn.example.com/bg.png',
                primaryColor: '#0F766E',
                tagline: 'Mencetak Generasi Qurani',
                flipSecretKey: 'SECRET_SHOULD_NEVER_LEAK',
                flipValidationToken: 'TOKEN_SHOULD_NEVER_LEAK',
              },
            ]),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue([]),
        }),
      };
      return await cb(tx);
    });
  });

  describe('POST /api/tenant/branding', () => {
    it('1. POST tanpa sesi server ditolak HTTP 401 UNAUTHENTICATED', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('No cookie'),
      });

      const req = new NextRequest('http://localhost/api/tenant/branding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ loginTitle: 'New Title' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('2. POST dengan header x-user-id palsu tanpa sesi server TETAP ditolak 401 (anti-header-spoofing)', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('No cookie'),
      });

      const req = new NextRequest('http://localhost/api/tenant/branding', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-id': 'spoofed-admin-uuid',
        },
        body: JSON.stringify({ loginTitle: 'Malicious Title' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe('UNAUTHENTICATED');
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();
    });

    it('3. POST tanpa izin TENANT_BRANDING_MANAGE ditolak HTTP 403 FORBIDDEN', async () => {
      mockRequirePermission.mockResolvedValueOnce({
        authorized: false,
        reason: 'Missing permission: manage_pengaturan',
      });

      const req = new NextRequest('http://localhost/api/tenant/branding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ loginTitle: 'Unauthorized Edit' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.code).toBe('FORBIDDEN');
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();
    });

    it('4. POST mengabaikan tenantId palsu di body dan tetap memakai tenant server resmi', async () => {
      const req = new NextRequest('http://localhost/api/tenant/branding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'victim-tenant-999',
          loginTitle: 'Updated Legitimate Title',
          primaryColor: '#123456',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      // Pastikan withTenantTransaction dipanggil dengan tenant resmi 'tenant-al-fatih', BUKAN 'victim-tenant-999'
      expect(mockWithTenantTransaction).toHaveBeenCalledWith(
        'tenant-al-fatih',
        expect.any(Function),
        expect.objectContaining({ tenantSlug: 'alfatih' })
      );
    });

    it('5. POST menolak format warna hex yang tidak valid dengan 400', async () => {
      const req = new NextRequest('http://localhost/api/tenant/branding', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          primaryColor: 'not-a-color-injection',
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/tenant/branding', () => {
    it('6. GET tanpa sesi server ditolak HTTP 401 UNAUTHENTICATED', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('No cookie'),
      });

      const req = new NextRequest('http://localhost/api/tenant/branding');
      const res = await GET(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.code).toBe('UNAUTHENTICATED');
    });

    it('7. GET tanpa izin TENANT_BRANDING_READ ditolak HTTP 403 FORBIDDEN', async () => {
      mockRequirePermission.mockResolvedValueOnce({
        authorized: false,
        reason: 'Missing permission: view_pengaturan',
      });

      const req = new NextRequest('http://localhost/api/tenant/branding');
      const res = await GET(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.code).toBe('FORBIDDEN');
    });

    it('8. GET berhasil mengembalikan konfigurasi branding tanpa membocorkan secret/token internal', async () => {
      const req = new NextRequest('http://localhost/api/tenant/branding');
      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.loginTitle).toBe('Portal Santri Al Fatih');
      expect(json.data.primaryColor).toBe('#0F766E');

      // Verifikasi TIDAK ADA kebocoran field sensitif
      expect(json.data.flipSecretKey).toBeUndefined();
      expect(json.data.flipValidationToken).toBeUndefined();
    });

    it('9. GET error internal tidak membocorkan SQL error atau stack trace ke klien (500)', async () => {
      mockWithTenantTransaction.mockRejectedValueOnce(
        new Error('FATAL: connection to postgres failed at pg_pool:44')
      );

      const req = new NextRequest('http://localhost/api/tenant/branding');
      const res = await GET(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.code).toBe('INTERNAL_ERROR');
      expect(json.message).toBe('Gagal memproses permintaan branding');
      expect(JSON.stringify(json)).not.toContain('FATAL');
      expect(JSON.stringify(json)).not.toContain('postgres');
    });
  });
});

