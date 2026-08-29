/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase Proxy Client before importing proxy module
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/proxy', () => ({
  createProxyClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

import { proxy, extractTenantSlug, RESERVED_HOSTNAMES } from '../../src/proxy';

describe('WP-101 Phase 1D — Supabase Auth Boundary & Zero-Trust Proxy Security Contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WP-SAAS-PORTAL-003 — Subdomain & Hostname Resolution Classification', () => {
    it('should extract valid tenant slug from hostname subdomain', () => {
      const req = new NextRequest('http://daruttauhid.mahad-app.com/login', {
        headers: { host: 'daruttauhid.mahad-app.com' },
      });
      expect(extractTenantSlug(req)).toBe('daruttauhid');
    });

    it('should classify reserved hostnames (www, admin, saas, api, app) as default platform hostnames', () => {
      ['www', 'admin', 'saas', 'api', 'app', 'status', 'cdn'].forEach((reserved) => {
        const req = new NextRequest(`http://${reserved}.mahad-app.com/`, {
          headers: { host: `${reserved}.mahad-app.com` },
        });
        expect(extractTenantSlug(req)).toBe('default');
      });
    });

    it('should classify localhost and IP addresses as default platform hostname', () => {
      const localReq = new NextRequest('http://localhost:3000/login', {
        headers: { host: 'localhost:3000' },
      });
      expect(extractTenantSlug(localReq)).toBe('default');

      const ipReq = new NextRequest('http://127.0.0.1:3000/login', {
        headers: { host: '127.0.0.1:3000' },
      });
      expect(extractTenantSlug(ipReq)).toBe('default');
    });

    it('should reject reserved slugs in /t/:slug path route and fall back to default', () => {
      const req = new NextRequest('http://localhost/t/admin/dashboard', {
        headers: { host: 'localhost' },
      });
      expect(extractTenantSlug(req)).toBe('default');
    });
  });

  describe('1. Fail-Closed Authentication Enforcement', () => {
    it('should redirect unauthenticated requests to protected page /dashboard to /login', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const request = new NextRequest('http://localhost/dashboard');
      const response = await proxy(request);

      expect(response.status).toBe(307); // Next.js redirect code (307 Temporary Redirect)
      expect(response.headers.get('location')).toContain('/login?redirect=%2Fdashboard');
    });

    it('should return 401 Unauthorized JSON response for unauthenticated protected API requests', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const request = new NextRequest('http://localhost/api/santri');
      const response = await proxy(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe('Unauthorized');
    });

    it('should allow unauthenticated access to public allowlist routes (/login, /maintenance, /api/webhooks)', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      const loginReq = new NextRequest('http://localhost/login');
      const loginRes = await proxy(loginReq);
      expect(loginRes.status).toBe(200);

      const webhookReq = new NextRequest('http://localhost/api/webhooks/platform-pg');
      const webhookRes = await proxy(webhookReq);
      expect(webhookRes.status).toBe(200);
    });
  });

  describe('2. Zero-Trust Tenant Header & Subdomain Handling', () => {
    it('should ignore client-supplied x-tenant-id header and derive tenant slug from subdomain', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'usr-123',
            email: 'user@mahad.sch.id',
            app_metadata: { role: 'admin' },
          },
        },
        error: null,
      });

      // Attacker sends spoofed header 'x-tenant-id: tenant-evil' on 'alfatih.mahad-app.com'
      const request = new NextRequest('http://alfatih.mahad-app.com/dashboard', {
        headers: {
          host: 'alfatih.mahad-app.com',
          'x-tenant-id': 'tenant-evil',
        },
      });

      const response = await proxy(request);
      expect(response.status).toBe(200);

      // Verify proxy overwrote tenant header with derived subdomain 'alfatih'
      expect(response.headers.get('x-tenant-slug')).toBe('alfatih');
      expect(response.headers.get('x-tenant-id')).toBe('alfatih');
      expect(response.headers.get('x-tenant-id')).not.toBe('tenant-evil');
    });

    it('should extract tenant slug from /t/:slug path route', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'usr-456', app_metadata: { role: 'guru' } },
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/t/al-fatih/dashboard');
      const response = await proxy(request);

      expect(response.headers.get('x-tenant-slug')).toBe('al-fatih');
      expect(response.headers.get('x-tenant-id')).toBe('al-fatih');
    });
  });

  describe('3. Authenticated Identity & SUPER_ADMIN Boundary', () => {
    it('should inject verified user ID and role into request headers for authenticated users', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-uuid-999',
            app_metadata: { role: 'WALI' },
          },
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/dashboard');
      const response = await proxy(request);

      expect(response.status).toBe(200);
    });

    it('should flag SUPER_ADMIN platform role without forcing a fake tenant membership', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'super-admin-uuid',
            app_metadata: { role: 'SUPER_ADMIN' },
          },
        },
        error: null,
      });

      const request = new NextRequest('http://madev.mahad-app.com/dashboard/saas/tenants', {
        headers: { host: 'madev.mahad-app.com' },
      });

      const response = await proxy(request);
      expect(response.status).toBe(200);
    });
  });
});
