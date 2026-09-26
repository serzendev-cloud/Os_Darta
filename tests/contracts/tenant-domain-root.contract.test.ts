import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { extractTenantSlug } from '@/proxy';
import { getTenantRootDomain, getTenantDomain, DEFAULT_TENANT_ROOT_DOMAIN } from '@/config/tenant';

describe('WP-DOMAIN-TENANT-ROOT-REMEDIATION-001 — Tenant Root Domain Contract Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. ROOT DOMAIN CONFIGURATION ──────────────────────────────────────────
  it('1. getTenantRootDomain returns default "serzen-dev.my.id" when env var is absent', () => {
    const originalEnv = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
    try {
      delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      expect(getTenantRootDomain()).toBe('serzen-dev.my.id');
      expect(DEFAULT_TENANT_ROOT_DOMAIN).toBe('serzen-dev.my.id');
    } finally {
      if (originalEnv === undefined) {
        delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      } else {
        process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = originalEnv;
      }
    }
  });

  it('1b. getTenantRootDomain respects NEXT_PUBLIC_TENANT_ROOT_DOMAIN override', () => {
    const originalEnv = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
    try {
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'custom-domain.ac.id';
      expect(getTenantRootDomain()).toBe('custom-domain.ac.id');
    } finally {
      if (originalEnv === undefined) {
        delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      } else {
        process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = originalEnv;
      }
    }
  });

  // ── 2. TENANT DOMAIN GENERATION ───────────────────────────────────────────
  it('2. getTenantDomain produces canonical FQDN <slug>.serzen-dev.my.id', () => {
    expect(getTenantDomain('pp-darululum')).toBe('pp-darululum.serzen-dev.my.id');
    expect(getTenantDomain('pp-darunnajah')).toBe('pp-darunnajah.serzen-dev.my.id');
    expect(getTenantDomain('PP-BADRUSSALAM')).toBe('pp-badrussalam.serzen-dev.my.id');
  });

  // ── 3. PROXY SUBDOMAIN EXTRACTION ─────────────────────────────────────────
  it('3. Proxy correctly extracts tenant slug from subdomain: pp-darululum.serzen-dev.my.id -> pp-darululum', () => {
    const req = new NextRequest('http://pp-darululum.serzen-dev.my.id/login', {
      headers: { host: 'pp-darululum.serzen-dev.my.id' },
    });
    expect(extractTenantSlug(req)).toBe('pp-darululum');
  });

  it('3b. Proxy extracts tenant slug when port is included: pp-darunnajah.serzen-dev.my.id:3000 -> pp-darunnajah', () => {
    const req = new NextRequest('http://pp-darunnajah.serzen-dev.my.id:3000/dashboard', {
      headers: { host: 'pp-darunnajah.serzen-dev.my.id:3000' },
    });
    expect(extractTenantSlug(req)).toBe('pp-darunnajah');
  });

  // ── 4. APEX DOMAIN RESOLUTION ─────────────────────────────────────────────
  it('4. Proxy resolves apex domain serzen-dev.my.id to default platform context', () => {
    const req = new NextRequest('http://serzen-dev.my.id/', {
      headers: { host: 'serzen-dev.my.id' },
    });
    expect(extractTenantSlug(req)).toBe('default');
  });

  // ── 5. WWW DOMAIN RESOLUTION ──────────────────────────────────────────────
  it('5. Proxy resolves www.serzen-dev.my.id to default platform context', () => {
    const req = new NextRequest('http://www.serzen-dev.my.id/dashboard/saas/tenants', {
      headers: { host: 'www.serzen-dev.my.id' },
    });
    expect(extractTenantSlug(req)).toBe('default');
  });

  // ── 6. CCTLD PROTECTION (ROOT NOT TREATED AS SLUG) ────────────────────────
  it('6. Proxy prevents apex ccTLD "serzen-dev" from being mistaken for a tenant slug', () => {
    const reqApex = new NextRequest('https://serzen-dev.my.id/login', {
      headers: { host: 'serzen-dev.my.id' },
    });
    const slug = extractTenantSlug(reqApex);
    expect(slug).toBe('default');
    expect(slug).not.toBe('serzen-dev');
  });

  // ── 7. NO NEW RUNTIME GENERATOR PRODUCING .madev.id ────────────────────────
  it('7. Provisioning service source strictly uses getTenantDomain without hardcoded madev.id candidateDomain', () => {
    const servicePath = path.resolve(process.cwd(), 'src/modules/saas/services/tenant-provisioning-service.ts');
    const content = fs.readFileSync(servicePath, 'utf8');

    expect(content).toContain('getTenantDomain(cleanSlug)');
    expect(content).not.toMatch(/candidateDomain\s*=\s*`\${cleanSlug}\.madev\.id`/);
    expect(content).not.toMatch(/subdomain:\s*tenantRow\.domain\s*\|\|\s*`\${tenantRow\.slug}\.madev\.id`/);
  });

  // ── 8. PATH ROUTE /t/:slug PRESERVATION ───────────────────────────────────
  it('8. Proxy preserves /t/:slug path extraction behavior', () => {
    const reqValidPath = new NextRequest('http://localhost:3000/t/darululum/login', {
      headers: { host: 'localhost:3000' },
    });
    expect(extractTenantSlug(reqValidPath)).toBe('darululum');

    const reqReservedPath = new NextRequest('http://localhost:3000/t/admin/login', {
      headers: { host: 'localhost:3000' },
    });
    expect(extractTenantSlug(reqReservedPath)).toBe('default');
  });

  // ── 9. ROLE PREVIEW IDENTITIES UNTOUCHED ──────────────────────────────────
  it('9. Role preview synthetic identities remain untouched internal constructs', () => {
    const rolePreviewPath = path.resolve(process.cwd(), 'src/app/api/auth/role-preview/route.ts');
    const content = fs.readFileSync(rolePreviewPath, 'utf8');

    // Synthetic identities are preserved internal constructs
    expect(content).toContain('preview.developer@madev.id');
    expect(content).toContain('preview.superadmin@madev.id');
    expect(content).toContain('preview.admin@madev.id');
  });

  // ── 10. ACTIVATION URL USES NEXT_PUBLIC_APP_URL ───────────────────────────
  it('10. Provisioning activation URL continues to use process.env.NEXT_PUBLIC_APP_URL', () => {
    const servicePath = path.resolve(process.cwd(), 'src/modules/saas/services/tenant-provisioning-service.ts');
    const content = fs.readFileSync(servicePath, 'utf8');

    expect(content).toContain("process.env.NEXT_PUBLIC_APP_URL || 'https://www.serzen-dev.my.id'");
    expect(content).toContain('redirectTo = `${appUrl}/auth/callback`');
  });

  // ── 12. FAIL-CLOSED BOUNDARY: FOREIGN / UNTRUSTED HOSTNAMES ──────────────
  it('12. Proxy strictly fails closed (returns default) for external and untrusted domains', () => {
    const foreignHosts = [
      'foo.example.com',
      'malicious.example.com',
      'random.subdomain.other-domain.com',
      'evil-phishing.org',
      'tenant.another-domain.net',
      'preview-branch-123.vercel.app',
      'localhost:3000',
      '127.0.0.1:3000',
    ];

    for (const host of foreignHosts) {
      const req = new NextRequest(`http://${host}/login`, {
        headers: { host },
      });
      const extracted = extractTenantSlug(req);
      expect(extracted).toBe('default');
    }
  });
});
