/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetTenantContext = vi.fn();
const mockRequirePermission = vi.fn();
const mockWithTenantTransaction = vi.fn();

vi.mock('@/lib/tenant/context', () => ({
  getTenantContext: () => mockGetTenantContext(),
}));

vi.mock('@/lib/authz/authorization-service', () => ({
  requirePermission: (...args: any[]) => mockRequirePermission(...args),
}));

vi.mock('@/lib/db/tenant-transaction', () => ({
  withTenantTransaction: (tenantId: string, cb: any, opts: any) => mockWithTenantTransaction(tenantId, cb, opts),
}));

vi.mock('@/modules/santri/services/santri-server', () => ({
  santriServerService: {
    handleUpdate: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('No cookie') }),
    },
  }),
}));

const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/proxy', () => ({
  createProxyClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

import { GET, POST } from '../../src/app/api/db/query/route';
import { proxy } from '../../src/proxy';

describe('WP-SEC-QUERY-API-001 — Security Hardening Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTenantContext.mockResolvedValue({
      id: 'tenant-test-1',
      name: 'Pesantren Al Fatih',
      slug: 'alfatih',
    });
    mockRequirePermission.mockResolvedValue({
      authorized: true,
      reason: null,
    });
  });

  describe('(a) Strict Rejection of Collections Without tenantId Column', () => {
    const unpartitionedCollections = ['asrama', 'kamar', 'kelas', 'mapel'];

    unpartitionedCollections.forEach((coll) => {
      it(`GET /api/db/query?collection=${coll} MUST return HTTP 400 TABLE_NOT_TENANT_SCOPED`, async () => {
        const req = new NextRequest(`http://localhost/api/db/query?collection=${coll}`, {
          headers: {
            'x-user-id': 'user-admin-1',
          },
        });

        const res = await GET(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.error).toBe('BadRequest');
        expect(json.code).toBe('TABLE_NOT_TENANT_SCOPED');
        expect(json.message).toContain('tidak memiliki kolom isolasi tenantId');
        expect(mockWithTenantTransaction).not.toHaveBeenCalled();
      });

      it(`POST /api/db/query with collection ${coll} MUST return HTTP 400 TABLE_NOT_TENANT_SCOPED`, async () => {
        const req = new NextRequest('http://localhost/api/db/query', {
          method: 'POST',
          headers: {
            'x-user-id': 'user-admin-1',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            collectionName: coll,
            action: 'create',
            data: { name: 'Test' },
          }),
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
        const json = await res.json();
        expect(json.code).toBe('TABLE_NOT_TENANT_SCOPED');
        expect(mockWithTenantTransaction).not.toHaveBeenCalled();
      });
    });
  });

  describe('(b) GET tenantSettings Secret Key Masking & Boolean Flags', () => {
    it('MUST NOT return sensitive integration secrets and MUST replace them with boolean configured indicators', async () => {
      const sensitiveRecord = {
        id: 'settings-1',
        tenantId: 'tenant-test-1',
        customLogoUrl: 'https://cdn.example.com/logo.png',
        primaryColor: '#0F766E',
        tagline: 'Pesantren Unggulan',
        flipSecretKey: 'super_secret_flip_key_99999',
        flipValidationToken: 'validation_token_secret_88888',
        waGatewayApiKey: 'wa_gateway_secret_key_77777',
        gdriveServiceAccountJson: '{"type":"service_account","private_key":"super_secret_pem"}',
      };

      mockWithTenantTransaction.mockImplementation(async (_tenantId, cb) => {
        const mockTx = {
          select: () => ({
            from: () => ({
              where: vi.fn().mockResolvedValue([sensitiveRecord]),
            }),
          }),
        };
        return await cb(mockTx);
      });

      const req = new NextRequest('http://localhost/api/db/query?collection=tenantSettings', {
        headers: {
          'x-user-id': 'user-admin-1',
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toHaveLength(1);

      const returned = json.data[0];

      // Verifikasi kolom rahasia tidak bocor ke client
      expect(returned.flipSecretKey).toBeUndefined();
      expect(returned.flipValidationToken).toBeUndefined();
      expect(returned.waGatewayApiKey).toBeUndefined();
      expect(returned.gdriveServiceAccountJson).toBeUndefined();

      // Verifikasi penanda boolean konfigurasi
      expect(returned.flipSecretKeyConfigured).toBe(true);
      expect(returned.flipValidationTokenConfigured).toBe(true);
      expect(returned.waGatewayApiKeyConfigured).toBe(true);
      expect(returned.gdriveServiceAccountJsonConfigured).toBe(true);

      // Verifikasi atribut umum tetap tersedia
      expect(returned.customLogoUrl).toBe('https://cdn.example.com/logo.png');
      expect(returned.primaryColor).toBe('#0F766E');
      expect(returned.tagline).toBe('Pesantren Unggulan');
    });

    it('sets boolean indicators to false when sensitive keys are null, empty, or whitespace', async () => {
      const emptySecretsRecord = {
        id: 'settings-2',
        tenantId: 'tenant-test-1',
        flipSecretKey: null,
        flipValidationToken: '',
        waGatewayApiKey: '   ',
        gdriveServiceAccountJson: undefined,
      };

      mockWithTenantTransaction.mockImplementation(async (_tenantId, cb) => {
        const mockTx = {
          select: () => ({
            from: () => ({
              where: vi.fn().mockResolvedValue([emptySecretsRecord]),
            }),
          }),
        };
        return await cb(mockTx);
      });

      const req = new NextRequest('http://localhost/api/db/query?collection=tenantSettings', {
        headers: {
          'x-user-id': 'user-admin-1',
        },
      });

      const res = await GET(req);
      const json = await res.json();
      const returned = json.data[0];

      expect(returned.flipSecretKeyConfigured).toBe(false);
      expect(returned.flipValidationTokenConfigured).toBe(false);
      expect(returned.waGatewayApiKeyConfigured).toBe(false);
      expect(returned.gdriveServiceAccountJsonConfigured).toBe(false);
    });
  });

  describe('(c) POST Mutation Whitelisting & Discarding of id and tenantId Overwrite', () => {
    it('MUST strip id and tenantId from update payload and only update whitelisted columns', async () => {
      let capturedSetPayload: any = null;

      mockWithTenantTransaction.mockImplementation(async (_tenantId, cb) => {
        const mockTx = {
          update: () => ({
            set: (payload: any) => {
              capturedSetPayload = payload;
              return {
                where: () => Promise.resolve([{ success: true }]),
              };
            },
          }),
        };
        return await cb(mockTx);
      });

      const req = new NextRequest('http://localhost/api/db/query', {
        method: 'POST',
        headers: {
          'x-user-id': 'user-admin-1',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: 'santri',
          action: 'update',
          id: 'santri-legit-123',
          data: {
            id: 'hacked-id-attempt',
            tenantId: 'hacked-tenant-attempt',
            name: 'Nama Santri Baru',
            status: 'aktif',
            maliciousInjectedField: 'DROP TABLE santri',
          },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);

      expect(capturedSetPayload).toBeDefined();
      // id dan tenantId HARUS dibuang dari update payload
      expect(capturedSetPayload.id).toBeUndefined();
      expect(capturedSetPayload.tenantId).toBeUndefined();
      // Field tidak berizin harus dibuang
      expect(capturedSetPayload.maliciousInjectedField).toBeUndefined();
      // Field berizin harus masuk
      expect(capturedSetPayload.name).toBe('Nama Santri Baru');
      expect(capturedSetPayload.status).toBe('aktif');
      expect(capturedSetPayload.updatedAt).toBeInstanceOf(Date);
    });

    it('MUST return HTTP 400 when update data only contains forbidden/non-whitelisted fields', async () => {
      const req = new NextRequest('http://localhost/api/db/query', {
        method: 'POST',
        headers: {
          'x-user-id': 'user-admin-1',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: 'santri',
          action: 'update',
          id: 'santri-legit-123',
          data: {
            id: 'attempt-only-id',
            tenantId: 'attempt-only-tenant',
            arbitraryField: 'value',
          },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('BadRequest');
      expect(json.message).toContain('Tidak ada kolom valid yang diizinkan');
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();
    });
  });

  describe('(d) Proxy /auth Removal from PUBLIC_PATHS', () => {
    it('MUST NOT treat /auth as a public path and MUST redirect unauthenticated requests to /login', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth session missing'),
      });

      const req = new NextRequest('http://localhost:3000/auth', {
        headers: { host: 'localhost:3000' },
      });

      const res = await proxy(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('http://localhost:3000/login?redirect=%2Fauth');
    });

    it('MUST still allow legitimate public authentication subpaths', async () => {
      const allowedPaths = [
        '/auth/callback',
        '/auth/set-password',
        '/auth/forgot-password',
        '/auth/reset-password',
      ];

      for (const path of allowedPaths) {
        mockGetUser.mockResolvedValue({
          data: { user: null },
          error: new Error('Auth session missing'),
        });

        const req = new NextRequest(`http://localhost:3000${path}`, {
          headers: { host: 'localhost:3000' },
        });

        const res = await proxy(req);
        // Respon publik tidak redirect ke /login (status 200 via rewrite / next)
        expect(res.status).not.toBe(307);
      }
    });
  });
});
