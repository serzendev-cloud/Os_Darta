import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { proxy, extractTenantSlug } from '@/proxy';
import * as configModule from '@/config/tenant';
import {
  getTenantRootDomain,
  getTenantDomain,
  DEFAULT_TENANT_ROOT_DOMAIN,
  LEGACY_TENANT_ROOT_DOMAINS,
  isCustomTenantDomain,
  resolveTenantDomain,
  isValidTenantSlug,
  isValidHostname,
  getAppUrl,
  isPreviewEnvironment,
  isProductionEnvironment,
  isLocalDevelopmentEnvironment,
  hasConflictingEnvironment,
  CANONICAL_PRODUCTION_APP_URL,
  extractSlugFromSubdomainInput,
  isProductionPlatformHostname,
} from '@/config/tenant';

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

  // ── 10. ACTIVATION URL USES GETAPPURL WITHOUT PRODUCTION FALLBACK ────────
  it('10. Provisioning activation URL uses getAppUrl() without silent production fallback', () => {
    const servicePath = path.resolve(process.cwd(), 'src/modules/saas/services/tenant-provisioning-service.ts');
    const content = fs.readFileSync(servicePath, 'utf8');

    expect(content).toContain('const appUrl = getAppUrl();');
    expect(content).not.toContain("process.env.NEXT_PUBLIC_APP_URL || 'https://www.serzen-dev.my.id'");
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

  // ── 13. CUSTOM TENANT DOMAIN CLASSIFICATION CONTRACT ─────────────────────
  it('13. isCustomTenantDomain distinguishes intentional custom domains from platform domains and rejects malformed inputs', () => {
    // Legacy platform domains are NOT custom domains
    expect(isCustomTenantDomain('madev.id')).toBe(false);
    expect(isCustomTenantDomain('alhikmah.madev.id')).toBe(false);
    expect(isCustomTenantDomain('sub.darululum.madev.id')).toBe(false);
    expect(LEGACY_TENANT_ROOT_DOMAINS).toContain('madev.id');

    // Active platform root domains are NOT custom domains
    expect(isCustomTenantDomain('serzen-dev.my.id')).toBe(false);
    expect(isCustomTenantDomain('pp-darululum.serzen-dev.my.id')).toBe(false);
    expect(isCustomTenantDomain('default.serzen-dev.my.id')).toBe(false);

    // Empty or invalid values are NOT custom domains
    expect(isCustomTenantDomain(null)).toBe(false);
    expect(isCustomTenantDomain(undefined)).toBe(false);
    expect(isCustomTenantDomain('')).toBe(false);
    expect(isCustomTenantDomain('   ')).toBe(false);

    // Malformed domains (schemes, paths, userinfo, ports, malformed dots) are NOT custom domains
    expect(isCustomTenantDomain('http://custom.com')).toBe(false);
    expect(isCustomTenantDomain('https://custom.com/login')).toBe(false);
    expect(isCustomTenantDomain('custom.com/path')).toBe(false);
    expect(isCustomTenantDomain('custom.com:8080')).toBe(false);
    expect(isCustomTenantDomain('user:pass@custom.com')).toBe(false);
    expect(isCustomTenantDomain('user@custom.com')).toBe(false);
    expect(isCustomTenantDomain('custom..com')).toBe(false);
    expect(isCustomTenantDomain('.custom.com')).toBe(false);
    expect(isCustomTenantDomain('custom.com.')).toBe(false);
    expect(isCustomTenantDomain('custom_domain.org')).toBe(false);

    // Suffix lookalikes ARE distinguished and preserved as external domains
    expect(isCustomTenantDomain('notmadev.id')).toBe(true);
    expect(isCustomTenantDomain('fakemadev.id')).toBe(true);
    expect(isCustomTenantDomain('madev.id.attacker.com')).toBe(true);

    // Intentional valid custom domains ARE recognized and preserved
    expect(isCustomTenantDomain('pesantren.sch.id')).toBe(true);
    expect(isCustomTenantDomain('santri.pesantren.sch.id')).toBe(true);
    expect(isCustomTenantDomain('portal.alhikmah.ac.id')).toBe(true);
    expect(isCustomTenantDomain('my-custom-mahad.org')).toBe(true);
  });

  // ── 14. TENANT DOMAIN RESOLUTION CONTRACT ─────────────────────────────────
  it('14. resolveTenantDomain canonicalizes legacy domains and preserves intentional custom domains', () => {
    // Legacy stored domains must be canonicalized to current platform root
    expect(resolveTenantDomain('darul-ulum', 'darul-ulum.madev.id')).toBe('darul-ulum.serzen-dev.my.id');
    expect(resolveTenantDomain('nurul-huda', 'nurul-huda.madev.id')).toBe('nurul-huda.serzen-dev.my.id');

    // Missing, null, or empty stored domain with valid slug produces canonical FQDN
    expect(resolveTenantDomain('darul-ulum', null)).toBe('darul-ulum.serzen-dev.my.id');
    expect(resolveTenantDomain('darul-ulum', undefined)).toBe('darul-ulum.serzen-dev.my.id');
    expect(resolveTenantDomain('darul-ulum', '')).toBe('darul-ulum.serzen-dev.my.id');

    // Intentional custom domains are strictly preserved
    expect(resolveTenantDomain('darul-ulum', 'santri.pesantren.sch.id')).toBe('santri.pesantren.sch.id');
    expect(resolveTenantDomain('al-hikmah', 'alhikmah.ac.id')).toBe('alhikmah.ac.id');

    // Environment-specific root domain override (Preview / Staging)
    const originalEnv = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
    try {
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'preview-os-darta.vercel.app';
      expect(resolveTenantDomain('darul-ulum', 'darul-ulum.madev.id')).toBe('darul-ulum.preview-os-darta.vercel.app');
      expect(resolveTenantDomain('darul-ulum', null)).toBe('darul-ulum.preview-os-darta.vercel.app');
      // Custom domain still preserved even under preview root domain
      expect(resolveTenantDomain('darul-ulum', 'santri.pesantren.sch.id')).toBe('santri.pesantren.sch.id');
    } finally {
      if (originalEnv === undefined) {
        delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      } else {
        process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = originalEnv;
      }
    }
  });

  // ── 15. PROVISIONING SERVICE RESOLUTION CONTRACT ──────────────────────────
  it('15. Provisioning service source uses resolveTenantDomain in listActiveTenants and resendTenantInvitation', () => {
    const servicePath = path.resolve(process.cwd(), 'src/modules/saas/services/tenant-provisioning-service.ts');
    const content = fs.readFileSync(servicePath, 'utf8');

    expect(content).toContain('resolveTenantDomain(t.slug, t.domain)');
    expect(content).toContain('resolveTenantDomain(tenantRow.slug, tenantRow.domain)');
    // Must not use raw fallback that leaks legacy stored domain
    expect(content).not.toMatch(/subdomain:\s*t\.domain\s*\|\|\s*getTenantDomain/);
    expect(content).not.toMatch(/subdomain:\s*tenantRow\.domain\s*\|\|\s*getTenantDomain/);
  });

  // ── 16. STRICT SLUG VALIDATION CONTRACT ───────────────────────────────────
  it('16. isValidTenantSlug strictly validates slugs and rejects invalid/internal identifiers', () => {
    // Valid slugs
    expect(isValidTenantSlug('darul-ulum')).toBe(true);
    expect(isValidTenantSlug('pp-darunnajah')).toBe(true);
    expect(isValidTenantSlug('pesantren123')).toBe(true);
    expect(isValidTenantSlug('al-hikmah-2')).toBe(true);

    // Empty, whitespace, null, undefined
    expect(isValidTenantSlug('')).toBe(false);
    expect(isValidTenantSlug('   ')).toBe(false);
    expect(isValidTenantSlug(null)).toBe(false);
    expect(isValidTenantSlug(undefined)).toBe(false);

    // Length boundaries (min 2, max 63)
    expect(isValidTenantSlug('a')).toBe(false);
    expect(isValidTenantSlug('ab')).toBe(true);
    expect(isValidTenantSlug('a'.repeat(63))).toBe(true);
    expect(isValidTenantSlug('a'.repeat(64))).toBe(false);

    // Leading or trailing hyphens
    expect(isValidTenantSlug('-darululum')).toBe(false);
    expect(isValidTenantSlug('darululum-')).toBe(false);
    expect(isValidTenantSlug('-darul-ulum-')).toBe(false);

    // Slashes, paths, schemes, userinfo, colons, ports
    expect(isValidTenantSlug('slug/with/slash')).toBe(false);
    expect(isValidTenantSlug('/slug')).toBe(false);
    expect(isValidTenantSlug('http://slug')).toBe(false);
    expect(isValidTenantSlug('user:pass@slug')).toBe(false);
    expect(isValidTenantSlug('user@slug')).toBe(false);
    expect(isValidTenantSlug('slug:3000')).toBe(false);
    expect(isValidTenantSlug('slug?query=1')).toBe(false);
    expect(isValidTenantSlug('slug#fragment')).toBe(false);

    // Internal database IDs must NOT be valid slugs
    expect(isValidTenantSlug('t_1792193548810_5ji1q')).toBe(false);
    expect(isValidTenantSlug('t_mock_123')).toBe(false);
    expect(isValidTenantSlug('550e8400-e29b-41d4-a716-446655440000')).toBe(false);
    expect(isValidTenantSlug('slug_with_underscore')).toBe(false);
  });

  // ── 17. STRICT HOSTNAME VALIDATION CONTRACT ───────────────────────────────
  it('17. isValidHostname strictly validates RFC 1123 hostnames and rejects malformed inputs', () => {
    // Valid hostnames
    expect(isValidHostname('serzen-dev.my.id')).toBe(true);
    expect(isValidHostname('pesantren.sch.id')).toBe(true);
    expect(isValidHostname('santri.darululum.ac.id')).toBe(true);
    expect(isValidHostname('preview.serzen-dev.my.id')).toBe(true);

    // Malformed inputs
    expect(isValidHostname('')).toBe(false);
    expect(isValidHostname(null)).toBe(false);
    expect(isValidHostname(undefined)).toBe(false);
    expect(isValidHostname('singleword')).toBe(false);
    expect(isValidHostname('http://example.com')).toBe(false);
    expect(isValidHostname('https://example.com/path')).toBe(false);
    expect(isValidHostname('example.com/path')).toBe(false);
    expect(isValidHostname('example.com:8080')).toBe(false);
    expect(isValidHostname('user:pass@example.com')).toBe(false);
    expect(isValidHostname('user@example.com')).toBe(false);
    expect(isValidHostname('example..com')).toBe(false);
    expect(isValidHostname('.example.com')).toBe(false);
    expect(isValidHostname('example.com.')).toBe(false);
    expect(isValidHostname('example_domain.com')).toBe(false);
  });

  // ── 18. NO INTERNAL ID FALLBACK FOR URL CONSTRUCTION ──────────────────────
  it('18. resolveTenantDomain strictly returns null when slug is empty or an internal DB ID', () => {
    // Empty or missing slug produces null
    expect(resolveTenantDomain('', null)).toBeNull();
    expect(resolveTenantDomain(null, null)).toBeNull();
    expect(resolveTenantDomain(undefined, null)).toBeNull();
    expect(resolveTenantDomain('   ', null)).toBeNull();

    // Internal database ID produces null (never constructs hostname from DB ID)
    expect(resolveTenantDomain('t_1792193548810_5ji1q', null)).toBeNull();
    expect(resolveTenantDomain('t_mock_123', null)).toBeNull();
    expect(resolveTenantDomain('550e8400-e29b-41d4-a716-446655440000', null)).toBeNull();

    // getTenantDomain also returns null for invalid slug
    expect(getTenantDomain('')).toBeNull();
    expect(getTenantDomain('t_mock_123')).toBeNull();
    expect(getTenantDomain('invalid_slug')).toBeNull();
  });

  // ── 19. PREVIEW ENVIRONMENT FAIL-CLOSED ROOT CONFIGURATION ────────────────
  it('19. Preview environment strictly fails closed when NEXT_PUBLIC_TENANT_ROOT_DOMAIN is absent or malformed', () => {
    const origVercelEnv = process.env.VERCEL_ENV;
    const origTenantRoot = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;

    try {
      // Case A: VERCEL_ENV is preview and NEXT_PUBLIC_TENANT_ROOT_DOMAIN is absent
      process.env.VERCEL_ENV = 'preview';
      delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;

      expect(getTenantRootDomain()).toBeNull();
      expect(getTenantDomain('darul-ulum')).toBeNull();
      expect(resolveTenantDomain('darul-ulum', 'darul-ulum.madev.id')).toBeNull();

      // Case B: NEXT_PUBLIC_TENANT_ROOT_DOMAIN is malformed (e.g. includes scheme or path)
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'http://preview.dev';
      expect(getTenantRootDomain()).toBeNull();
      expect(getTenantDomain('darul-ulum')).toBeNull();

      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'preview..dev';
      expect(getTenantRootDomain()).toBeNull();

      // Case C: Valid non-production preview root configuration succeeds
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'preview.serzen-preview.net';
      expect(getTenantRootDomain()).toBe('preview.serzen-preview.net');
      expect(getTenantDomain('darul-ulum')).toBe('darul-ulum.preview.serzen-preview.net');
    } finally {
      if (origVercelEnv === undefined) {
        delete process.env.VERCEL_ENV;
      } else {
        process.env.VERCEL_ENV = origVercelEnv;
      }
      if (origTenantRoot === undefined) {
        delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      } else {
        process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = origTenantRoot;
      }
    }
  });

  // ── 20. CUSTOM DOMAIN GROUND TRUTH (NO FAKE RUNTIME REGISTRY) ────────────
  it('20. Custom Domain Ground Truth: No fake in-memory exception registry exists and intentional custom domains are classified strictly by syntax', () => {
    // 1. Assert no fake in-memory registry is exported or maintained
    expect((configModule as any).CUSTOM_DOMAIN_EXCEPTIONS).toBeUndefined();

    // 2. Legacy platform domains are NOT custom domains
    expect(isCustomTenantDomain('special-partner.madev.id')).toBe(false);
    expect(isCustomTenantDomain('santri.madev.id')).toBe(false);

    // 3. Current platform domains are NOT custom domains
    expect(isCustomTenantDomain('serzen-dev.my.id')).toBe(false);
    expect(isCustomTenantDomain('darul-ulum.serzen-dev.my.id')).toBe(false);

    // 4. Intentional valid external custom domains are recognized purely by syntax
    expect(isCustomTenantDomain('santri.pesantren.sch.id')).toBe(true);
    expect(isCustomTenantDomain('portal.alhikmah.ac.id')).toBe(true);
    expect(resolveTenantDomain('al-hikmah', 'portal.alhikmah.ac.id')).toBe('portal.alhikmah.ac.id');
  });

  // ── 21. UI SOURCE CODE AUDIT: NO INTERNAL ID FALLBACKS IN CALL SITES ──────
  it('21. UI pages strictly avoid using t.slug || t.id as domain fallback', () => {
    const modulFiturPath = path.resolve(process.cwd(), 'src/app/dashboard/saas/modul-fitur/page.tsx');
    const modulFiturContent = fs.readFileSync(modulFiturPath, 'utf8');
    expect(modulFiturContent).not.toMatch(/resolveTenantDomain\s*\(\s*t\.slug\s*\|\|\s*t\.id/);
    expect(modulFiturContent).not.toMatch(/getTenantDomain\s*\(\s*t\.id\s*\)/);

    const integrasiPath = path.resolve(process.cwd(), 'src/app/dashboard/pengaturan/tenant-integrasi/page.tsx');
    const integrasiContent = fs.readFileSync(integrasiPath, 'utf8');
    expect(integrasiContent).not.toMatch(/resolveTenantDomain\s*\(\s*t\.slug\s*\|\|\s*t\.id/);
    expect(integrasiContent).not.toMatch(/getTenantDomain\s*\(\s*t\.id\s*\)/);
  });

  // ── 22. FAIL-CLOSED PROXY CONTRACT ────────────────────────────────────────
  it('22. Proxy fails closed with HTTP 503 when root domain is unconfigured or malformed', async () => {
    const origVercelEnv = process.env.VERCEL_ENV;
    const origTenantRoot = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;

    try {
      // In Preview without NEXT_PUBLIC_TENANT_ROOT_DOMAIN
      process.env.VERCEL_ENV = 'preview';
      delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;

      expect(getTenantRootDomain()).toBeNull();

      // extractTenantSlug strictly returns null (never 'default', never another tenant)
      const reqSubdomain = new NextRequest('http://darululum.preview-domain.com/dashboard', {
        headers: { host: 'darululum.preview-domain.com' },
      });
      expect(extractTenantSlug(reqSubdomain)).toBeNull();

      // /t/:slug path route also returns null when root domain is unconfigured
      const reqPathRoute = new NextRequest('http://preview-domain.com/t/darululum/login', {
        headers: { host: 'preview-domain.com' },
      });
      expect(extractTenantSlug(reqPathRoute)).toBeNull();

      // proxy returns HTTP 503 for protected/public pages
      const pageRes = await proxy(reqSubdomain);
      expect(pageRes.status).toBe(503);
      const pageText = await pageRes.text();
      expect(pageText).toContain('Service Unavailable');

      // proxy returns HTTP 503 JSON for API routes
      const reqApi = new NextRequest('http://preview-domain.com/api/santri', {
        headers: { host: 'preview-domain.com' },
      });
      const apiRes = await proxy(reqApi);
      expect(apiRes.status).toBe(503);
      const apiJson = await apiRes.json();
      expect(apiJson.success).toBe(false);
      expect(apiJson.error).toBe('ConfigurationUnavailable');

      // When NEXT_PUBLIC_TENANT_ROOT_DOMAIN is malformed
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'invalid..domain';
      expect(getTenantRootDomain()).toBeNull();
      expect(extractTenantSlug(reqSubdomain)).toBeNull();

      const malformedRes = await proxy(reqSubdomain);
      expect(malformedRes.status).toBe(503);
    } finally {
      if (origVercelEnv === undefined) {
        delete process.env.VERCEL_ENV;
      } else {
        process.env.VERCEL_ENV = origVercelEnv;
      }
      if (origTenantRoot === undefined) {
        delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      } else {
        process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = origTenantRoot;
      }
    }
  });

  // ── 23. FAIL-CLOSED APPLICATION URL (GETAPPURL) CONTRACT ──────────────────
  it('23. getAppUrl strictly fails closed in Preview without falling back to Production URL', () => {
    const origVercelEnv = process.env.VERCEL_ENV;
    const origAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    try {
      // In Preview without NEXT_PUBLIC_APP_URL
      process.env.VERCEL_ENV = 'preview';
      delete process.env.NEXT_PUBLIC_APP_URL;

      expect(getAppUrl()).toBeNull();

      // In Preview with malformed URL
      process.env.NEXT_PUBLIC_APP_URL = 'not-a-valid-url';
      expect(getAppUrl()).toBeNull();

      // In Preview with valid URL
      process.env.NEXT_PUBLIC_APP_URL = 'https://os-darta-preview.vercel.app/';
      expect(getAppUrl()).toBe('https://os-darta-preview.vercel.app');

      // In Production with absent NEXT_PUBLIC_APP_URL
      process.env.VERCEL_ENV = 'production';
      delete process.env.NEXT_PUBLIC_APP_URL;
      expect(getAppUrl()).toBe('https://www.serzen-dev.my.id');

      // In local dev without flags
      delete process.env.VERCEL_ENV;
      delete (process.env as Record<string, string | undefined>).NODE_ENV;
      delete process.env.NEXT_PUBLIC_APP_URL;
      expect(getAppUrl()).toBe('http://localhost:3000');
    } finally {
      if (origVercelEnv === undefined) {
        delete process.env.VERCEL_ENV;
      } else {
        process.env.VERCEL_ENV = origVercelEnv;
      }
      if (origAppUrl === undefined) {
        delete process.env.NEXT_PUBLIC_APP_URL;
      } else {
        process.env.NEXT_PUBLIC_APP_URL = origAppUrl;
      }
    }
  });

  // ── 24. SOURCE CODE AUDIT: ZERO SILENT PRODUCTION FALLBACKS ───────────────
  it('24. Audit call graph: forgot-password, provisioning, and resend do not use silent production fallbacks', () => {
    const forgotPasswordPath = path.resolve(process.cwd(), 'src/app/api/auth/forgot-password/route.ts');
    const forgotContent = fs.readFileSync(forgotPasswordPath, 'utf8');
    expect(forgotContent).not.toContain("process.env.NEXT_PUBLIC_APP_URL || 'https://www.serzen-dev.my.id'");
    expect(forgotContent).toContain('const appUrl = getAppUrl();');

    const provisioningPath = path.resolve(process.cwd(), 'src/modules/saas/services/tenant-provisioning-service.ts');
    const provContent = fs.readFileSync(provisioningPath, 'utf8');
    expect(provContent).not.toContain("process.env.NEXT_PUBLIC_APP_URL || 'https://www.serzen-dev.my.id'");
    expect(provContent).toContain('const appUrl = getAppUrl();');
  });

  // ── 25. SERVER VS CLIENT ENVIRONMENT CONFIGURATION CONTRACT (PHASE A2.1 SECTION A) ──
  it('25. Server vs Client Environment Separation: client ignores server-only env and NODE_ENV does not force production', () => {
    const origWindow = globalThis.window;
    const origVercelEnv = process.env.VERCEL_ENV;
    const origNextPublicVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    const origNodeEnv = process.env.NODE_ENV;

    try {
      // 1. Client-side execution simulation (browser environment where server-only VERCEL_ENV is undefined)
      delete process.env.VERCEL_ENV;
      delete process.env.NEXT_PUBLIC_VERCEL_ENV;

      // In browser on Vercel preview deployment hostname:
      (globalThis as any).window = { location: { hostname: 'os-darta-git-preview-xyz.vercel.app' } };
      expect(isPreviewEnvironment()).toBe(true);
      delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      expect(getTenantRootDomain()).toBeNull();

      // In browser on standard localhost (not preview):
      (globalThis as any).window = { location: { hostname: 'localhost' } };
      expect(isPreviewEnvironment()).toBe(false);

      // In browser with NEXT_PUBLIC_VERCEL_ENV='preview' (client-safe env var):
      process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview';
      expect(isPreviewEnvironment()).toBe(true);
      expect(getTenantRootDomain()).toBeNull();

      // 2. Server-side execution simulation (window undefined, VERCEL_ENV='preview')
      (globalThis as any).window = undefined;
      delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      process.env.VERCEL_ENV = 'preview';
      expect(isPreviewEnvironment()).toBe(true);
      expect(getTenantRootDomain()).toBeNull();

      // 3. NODE_ENV='production' (set by Next.js build) does NOT force isProductionEnvironment()
      // in Preview environment
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      process.env.VERCEL_ENV = 'preview';
      delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      expect(isProductionEnvironment()).toBe(false);
      expect(isPreviewEnvironment()).toBe(true);
      // Fails closed instead of falling back to production
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.APP_URL;
      expect(getAppUrl()).toBeNull();
    } finally {
      (globalThis as any).window = origWindow;
      if (origVercelEnv === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = origVercelEnv;
      if (origNextPublicVercelEnv === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      else process.env.NEXT_PUBLIC_VERCEL_ENV = origNextPublicVercelEnv;
      if (origNodeEnv === undefined) delete (process.env as Record<string, string | undefined>).NODE_ENV;
      else (process.env as Record<string, string | undefined>).NODE_ENV = origNodeEnv;
    }
  });

  // ── 26. STRICT MALFORMED ROOT DOMAIN REJECTION (PHASE A2.1 SECTION C) ─────
  it('26. getTenantRootDomain strictly fails closed on malformed values without silent stripping', () => {
    const origTenantRoot = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;

    try {
      // Leading dot: must NOT be silently stripped into valid hostname
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = '.serzen-dev.my.id';
      expect(getTenantRootDomain()).toBeNull();

      // Trailing dot: must NOT be silently stripped into valid hostname
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'serzen-dev.my.id.';
      expect(getTenantRootDomain()).toBeNull();

      // Double dots
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'serzen..dev.my.id';
      expect(getTenantRootDomain()).toBeNull();

      // URL Schemes
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'http://serzen-dev.my.id';
      expect(getTenantRootDomain()).toBeNull();
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'https://serzen-dev.my.id';
      expect(getTenantRootDomain()).toBeNull();

      // Port
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'serzen-dev.my.id:3000';
      expect(getTenantRootDomain()).toBeNull();

      // Internal whitespace
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'serzen dev.my.id';
      expect(getTenantRootDomain()).toBeNull();

      // Valid hostname with whitespace padding: trimmed and accepted
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = '   preview.serzen-preview.net   ';
      expect(getTenantRootDomain()).toBe('preview.serzen-preview.net');

      // Valid clean hostname
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'custom-root.ac.id';
      expect(getTenantRootDomain()).toBe('custom-root.ac.id');
    } finally {
      if (origTenantRoot === undefined) delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      else process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = origTenantRoot;
    }
  });

  // ── 27. SLUG EXTRACTION FROM SUBDOMAIN INPUT WITHOUT RAW REGEX (PHASE A2.1 SECTION D) ──
  it('27. extractSlugFromSubdomainInput safely strips root domain without regex dot wildcards', () => {
    const root = 'serzen-dev.my.id';

    // Full FQDN input: cleanly strips suffix
    expect(extractSlugFromSubdomainInput('darululum.serzen-dev.my.id', root)).toBe('darululum');
    expect(extractSlugFromSubdomainInput('pp-darunnajah.serzen-dev.my.id', root)).toBe('pp-darunnajah');

    // Plain slug input: preserved intact
    expect(extractSlugFromSubdomainInput('darululum', root)).toBe('darululum');

    // Input slug ending with suffix-like text without leading dot: preserved intact
    expect(extractSlugFromSubdomainInput('darululum-serzen-dev.my.id', root)).toBe('darululum-serzen-dev.my.id');

    // Regex wildcard protection: a character replacing a dot in root domain does NOT match
    expect(extractSlugFromSubdomainInput('darululum.serzen-devXmy-id', root)).toBe('darululum.serzen-devxmy-id');

    // Exact match to root domain: returns empty string (which fails validation)
    expect(extractSlugFromSubdomainInput('serzen-dev.my.id', root)).toBe('');

    // Null, empty, or unconfigured root domain
    expect(extractSlugFromSubdomainInput('darululum', null)).toBe('darululum');
    expect(extractSlugFromSubdomainInput('darululum', '')).toBe('darululum');
    expect(extractSlugFromSubdomainInput('', root)).toBe('');
  });

  // ── 28. CUSTOM DOMAIN LINK ROUTING SAFETY (PHASE A2.1 SECTION B) ──────────
  it('28. UI pages disable active clickable links for custom domains pending proxy routing support', () => {
    // Verified: custom domain is recognized
    expect(isCustomTenantDomain('santri.pesantren.sch.id')).toBe(true);
    expect(isCustomTenantDomain('darululum.serzen-dev.my.id')).toBe(false);

    // Verify UI source code does not generate active links for custom domains
    const tenantsPagePath = path.resolve(process.cwd(), 'src/app/dashboard/saas/tenants/page.tsx');
    const content = fs.readFileSync(tenantsPagePath, 'utf8');

    // Must gate external link with !isCustomTenantDomain
    expect(content).toContain('!isCustomTenantDomain(t.subdomain)');
    // Must render badge indicating custom domain routing is not yet active
    expect(content).toContain('Custom domain (routing belum didukung)');
  });

  // ── 29. REGRESSION: PREVIEW ACCESSED VIA PRODUCTION DOMAIN HOSTNAME (PHASE A2.2 TUGAS B) ──
  it('29. Regression: Hostname on production domain alone does NOT bypass fail-closed behavior when preview configuration is absent', () => {
    const origWindow = globalThis.window;
    const origVercelEnv = process.env.VERCEL_ENV;
    const origNextPublicVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    const origTenantRoot = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
    const origAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const origServerAppUrl = process.env.APP_URL;
    const origNodeEnv = process.env.NODE_ENV;

    try {
      // Scenario: Preview deployment accessed via a custom alias on the production root domain
      // e.g., "os-darta.serzen-dev.my.id", but NEXT_PUBLIC_VERCEL_ENV was not configured
      delete process.env.VERCEL_ENV;
      delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.APP_URL;
      // Next.js sets NODE_ENV='production' during build
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';

      // Client accesses via production hostname:
      (globalThis as any).window = { location: { hostname: 'os-darta.serzen-dev.my.id' } };

      // 1. isProductionEnvironment MUST be false (hostname alone is not proof of production!)
      expect(isProductionEnvironment()).toBe(false);

      // 2. Environment is not local development either
      expect(isLocalDevelopmentEnvironment()).toBe(false);

      // 3. Since environment is unverified / unknown, root domain strictly FAILS CLOSED
      expect(getTenantRootDomain()).toBeNull();

      // 4. App URL strictly FAILS CLOSED (never produces https://www.serzen-dev.my.id)
      expect(getAppUrl()).toBeNull();

      // 5. Resolving tenant domain strictly FAILS CLOSED
      expect(getTenantDomain('darululum')).toBeNull();
      expect(resolveTenantDomain('darululum', 'darululum.madev.id')).toBeNull();
    } finally {
      (globalThis as any).window = origWindow;
      if (origVercelEnv === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = origVercelEnv;
      if (origNextPublicVercelEnv === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      else process.env.NEXT_PUBLIC_VERCEL_ENV = origNextPublicVercelEnv;
      if (origTenantRoot === undefined) delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      else process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = origTenantRoot;
      if (origAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = origAppUrl;
      if (origServerAppUrl === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = origServerAppUrl;
      if (origNodeEnv === undefined) delete (process.env as Record<string, string | undefined>).NODE_ENV;
      else (process.env as Record<string, string | undefined>).NODE_ENV = origNodeEnv;
    }
  });

  // ── 30. DEPLOYMENT ENVIRONMENT CLASSIFICATION MATRIX CONTRACT (PHASE A2.2 TUGAS B) ──
  it('30. Explicitly distinguishes known production, known preview, hint hostnames, and unknown environments', () => {
    const origWindow = globalThis.window;
    const origVercelEnv = process.env.VERCEL_ENV;
    const origNextPublicVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    const origTenantRoot = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
    const origAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    try {
      delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.APP_URL;

      // 1. Explicit Production (NEXT_PUBLIC_VERCEL_ENV='production')
      delete process.env.VERCEL_ENV;
      process.env.NEXT_PUBLIC_VERCEL_ENV = 'production';
      (globalThis as any).window = { location: { hostname: 'serzen-dev.my.id' } };
      expect(isProductionEnvironment()).toBe(true);
      expect(isPreviewEnvironment()).toBe(false);
      expect(getTenantRootDomain()).toBe('serzen-dev.my.id');
      expect(getAppUrl()).toBe('https://www.serzen-dev.my.id');

      // 2. Explicit Preview (NEXT_PUBLIC_VERCEL_ENV='preview')
      process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview';
      expect(isPreviewEnvironment()).toBe(true);
      expect(isProductionEnvironment()).toBe(false);
      expect(getTenantRootDomain()).toBeNull();
      expect(getAppUrl()).toBeNull();

      // 3. Preview Hostname Hint (*.vercel.app or contains preview) without env vars
      delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      delete process.env.VERCEL_ENV;
      (globalThis as any).window = { location: { hostname: 'os-darta-git-test.vercel.app' } };
      expect(isPreviewEnvironment()).toBe(true);
      expect(isProductionEnvironment()).toBe(false);
      expect(getTenantRootDomain()).toBeNull();

      // 4. Local Development (localhost without cloud env vars)
      (globalThis as any).window = { location: { hostname: 'localhost' } };
      expect(isLocalDevelopmentEnvironment()).toBe(true);
      expect(isProductionEnvironment()).toBe(false);
      expect(isPreviewEnvironment()).toBe(false);
      expect(getTenantRootDomain()).toBe('serzen-dev.my.id');
      expect(getAppUrl()).toBe('http://localhost:3000');

      // 5. Unknown / Untrusted environment (e.g. unknown external host without cloud config)
      (globalThis as any).window = { location: { hostname: 'untrusted-host.example.org' } };
      expect(isProductionEnvironment()).toBe(false);
      expect(isPreviewEnvironment()).toBe(false);
      expect(isLocalDevelopmentEnvironment()).toBe(false);
      expect(getTenantRootDomain()).toBeNull();
      expect(getAppUrl()).toBeNull();
    } finally {
      (globalThis as any).window = origWindow;
      if (origVercelEnv === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = origVercelEnv;
      if (origNextPublicVercelEnv === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      else process.env.NEXT_PUBLIC_VERCEL_ENV = origNextPublicVercelEnv;
      if (origTenantRoot === undefined) delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      else process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = origTenantRoot;
      if (origAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = origAppUrl;
    }
  });

  // ── 31. PREVIEW ENVIRONMENT ISOLATION FROM PRODUCTION CONFIG (PHASE A2.3 TUGAS A) ──
  it('31. Preview strictly rejects explicit Production root domain and Production app URL (fails closed)', () => {
    const origWindow = globalThis.window;
    const origVercelEnv = process.env.VERCEL_ENV;
    const origNextPublicVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    const origTenantRoot = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
    const origAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const origServerAppUrl = process.env.APP_URL;

    try {
      // Set explicit Preview environment
      process.env.VERCEL_ENV = 'preview';
      delete process.env.NEXT_PUBLIC_VERCEL_ENV;

      // 1. In Preview, explicitly setting Production apex root domain 'serzen-dev.my.id' MUST fail closed
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = DEFAULT_TENANT_ROOT_DOMAIN;
      expect(getTenantRootDomain()).toBeNull();
      expect(getTenantDomain('darululum')).toBeNull();

      // 1b. In Preview, explicitly setting Production tenant subdomain root 'pp-darunnajah.serzen-dev.my.id' MUST fail closed
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'pp-darunnajah.serzen-dev.my.id';
      expect(getTenantRootDomain()).toBeNull();
      expect(getTenantDomain('darululum')).toBeNull();

      // 1c. In Preview, setting any other subdomain under serzen-dev.my.id MUST fail closed
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'preview.serzen-dev.my.id';
      expect(getTenantRootDomain()).toBeNull();
      expect(getTenantDomain('darululum')).toBeNull();

      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'www.serzen-dev.my.id';
      expect(getTenantRootDomain()).toBeNull();
      expect(getTenantDomain('darululum')).toBeNull();

      // 2. In Preview, explicitly setting Production app URL 'https://www.serzen-dev.my.id' MUST fail closed
      process.env.NEXT_PUBLIC_APP_URL = CANONICAL_PRODUCTION_APP_URL;
      expect(getAppUrl()).toBeNull();

      // 2b. In Preview, explicitly setting Production apex app URL 'https://serzen-dev.my.id' MUST fail closed
      process.env.NEXT_PUBLIC_APP_URL = 'https://serzen-dev.my.id';
      expect(getAppUrl()).toBeNull();

      // 2c. In Preview, setting Production tenant subdomain app URL 'https://pp-darunnajah.serzen-dev.my.id' MUST fail closed
      process.env.NEXT_PUBLIC_APP_URL = 'https://pp-darunnajah.serzen-dev.my.id';
      expect(getAppUrl()).toBeNull();

      // 2d. In Preview, setting any subdomain app URL under serzen-dev.my.id MUST fail closed
      process.env.NEXT_PUBLIC_APP_URL = 'https://preview.serzen-dev.my.id';
      expect(getAppUrl()).toBeNull();

      // 3. In Preview, valid non-production preview configuration DOES succeed
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'preview.serzen-preview.net';
      expect(getTenantRootDomain()).toBe('preview.serzen-preview.net');
      expect(getTenantDomain('darululum')).toBe('darululum.preview.serzen-preview.net');

      process.env.NEXT_PUBLIC_APP_URL = 'https://os-darta-preview.vercel.app';
      expect(getAppUrl()).toBe('https://os-darta-preview.vercel.app');
    } finally {
      (globalThis as any).window = origWindow;
      if (origVercelEnv === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = origVercelEnv;
      if (origNextPublicVercelEnv === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      else process.env.NEXT_PUBLIC_VERCEL_ENV = origNextPublicVercelEnv;
      if (origTenantRoot === undefined) delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      else process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = origTenantRoot;
      if (origAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = origAppUrl;
      if (origServerAppUrl === undefined) delete process.env.APP_URL;
      else process.env.APP_URL = origServerAppUrl;
    }
  });

  // ── 32. CONFLICTING ENVIRONMENT SAFETY (PHASE A2.3 TUGAS A) ───────────────
  it('32. Conflicting environment flags strictly fail closed without falling back to Production', () => {
    const origVercelEnv = process.env.VERCEL_ENV;
    const origNextPublicVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    const origTenantRoot = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
    const origAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    try {
      // Contradiction: server says 'preview', but client var says 'production'
      process.env.VERCEL_ENV = 'preview';
      process.env.NEXT_PUBLIC_VERCEL_ENV = 'production';

      expect(hasConflictingEnvironment()).toBe(true);
      expect(isProductionEnvironment()).toBe(false);
      expect(isPreviewEnvironment()).toBe(false);

      // Fails closed for both root domain and app URL
      expect(getTenantRootDomain()).toBeNull();
      expect(getAppUrl()).toBeNull();

      // Contradiction in reverse: server says 'production', but client var says 'preview'
      process.env.VERCEL_ENV = 'production';
      process.env.NEXT_PUBLIC_VERCEL_ENV = 'preview';

      expect(hasConflictingEnvironment()).toBe(true);
      expect(isProductionEnvironment()).toBe(false);
      expect(isPreviewEnvironment()).toBe(false);

      expect(getTenantRootDomain()).toBeNull();
      expect(getAppUrl()).toBeNull();
    } finally {
      if (origVercelEnv === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = origVercelEnv;
      if (origNextPublicVercelEnv === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      else process.env.NEXT_PUBLIC_VERCEL_ENV = origNextPublicVercelEnv;
      if (origTenantRoot === undefined) delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      else process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = origTenantRoot;
      if (origAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = origAppUrl;
    }
  });

  // ── 33. EXPLICIT PRODUCTION ENVIRONMENT INTEGRITY (PHASE A2.3 TUGAS A) ────
  it('33. Explicit Production environment strictly accepts canonical production configuration', () => {
    const origVercelEnv = process.env.VERCEL_ENV;
    const origNextPublicVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    const origTenantRoot = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
    const origAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    try {
      process.env.VERCEL_ENV = 'production';
      process.env.NEXT_PUBLIC_VERCEL_ENV = 'production';

      expect(isProductionEnvironment()).toBe(true);
      expect(isPreviewEnvironment()).toBe(false);

      // 1. With explicit production root domain
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'serzen-dev.my.id';
      expect(getTenantRootDomain()).toBe('serzen-dev.my.id');
      expect(getTenantDomain('darululum')).toBe('darululum.serzen-dev.my.id');

      // 2. With default fallback (when unconfigured in production)
      delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      expect(getTenantRootDomain()).toBe('serzen-dev.my.id');

      // 3. With explicit production app URL
      process.env.NEXT_PUBLIC_APP_URL = 'https://www.serzen-dev.my.id';
      expect(getAppUrl()).toBe('https://www.serzen-dev.my.id');

      // 4. With default fallback (when unconfigured in production)
      delete process.env.NEXT_PUBLIC_APP_URL;
      expect(getAppUrl()).toBe('https://www.serzen-dev.my.id');
    } finally {
      if (origVercelEnv === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = origVercelEnv;
      if (origNextPublicVercelEnv === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      else process.env.NEXT_PUBLIC_VERCEL_ENV = origNextPublicVercelEnv;
      if (origTenantRoot === undefined) delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      else process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = origTenantRoot;
      if (origAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = origAppUrl;
    }
  });

  // ── 34. PRODUCTION HOSTNAME CANONICAL RULE & LOOKALIKE RESISTANCE (PHASE A2.4 TUGAS A & C) ──
  it('34. isProductionPlatformHostname strictly matches apex and subdomains on label boundaries and rejects lookalikes', () => {
    // 1. Production apex
    expect(isProductionPlatformHostname('serzen-dev.my.id')).toBe(true);
    expect(isProductionPlatformHostname('SERZEN-DEV.MY.ID')).toBe(true);

    // 2. Canonical www
    expect(isProductionPlatformHostname('www.serzen-dev.my.id')).toBe(true);

    // 3. Subdomains under production domain
    expect(isProductionPlatformHostname('pp-darunnajah.serzen-dev.my.id')).toBe(true);
    expect(isProductionPlatformHostname('preview.serzen-dev.my.id')).toBe(true);
    expect(isProductionPlatformHostname('sub.tenant.serzen-dev.my.id')).toBe(true);

    // 4. Lookalike domains: NOT production (must return false)
    // Domain with production domain as prefix/subdomain of an external domain
    expect(isProductionPlatformHostname('serzen-dev.my.id.attacker.example')).toBe(false);
    expect(isProductionPlatformHostname('serzen-dev.my.id.evil.com')).toBe(false);
    // Domain without label boundary dot
    expect(isProductionPlatformHostname('notserzen-dev.my.id')).toBe(false);
    expect(isProductionPlatformHostname('fake-serzen-dev.my.id')).toBe(false);
    expect(isProductionPlatformHostname('attacker-serzen-dev.my.id')).toBe(false);
    // Hyphenated suffix
    expect(isProductionPlatformHostname('serzen-dev.my.id-phishing.com')).toBe(false);

    // 5. Non-production legitimate domains
    expect(isProductionPlatformHostname('preview.serzen-preview.net')).toBe(false);
    expect(isProductionPlatformHostname('os-darta-preview.vercel.app')).toBe(false);
    expect(isProductionPlatformHostname('custom-domain.ac.id')).toBe(false);
    expect(isProductionPlatformHostname('madev.id')).toBe(false);
    expect(isProductionPlatformHostname('alhikmah.madev.id')).toBe(false);

    // 6. Non-hostnames / malformed inputs (leading/trailing dots strictly rejected without trimming)
    expect(isProductionPlatformHostname('.serzen-dev.my.id')).toBe(false);
    expect(isProductionPlatformHostname('serzen-dev.my.id.')).toBe(false);
    expect(isProductionPlatformHostname('.serzen-dev.my.id.')).toBe(false);
    expect(isProductionPlatformHostname(null)).toBe(false);
    expect(isProductionPlatformHostname(undefined)).toBe(false);
    expect(isProductionPlatformHostname('')).toBe(false);
    expect(isProductionPlatformHostname('   ')).toBe(false);
    expect(isProductionPlatformHostname('https://serzen-dev.my.id')).toBe(false);
    expect(isProductionPlatformHostname('serzen-dev.my.id/dashboard')).toBe(false);
    expect(isProductionPlatformHostname('serzen-dev.my.id:3000')).toBe(false);
    expect(isProductionPlatformHostname('localhost')).toBe(false);
    expect(isProductionPlatformHostname('127.0.0.1')).toBe(false);
  });

  // ── 35. LOOKALIKE DOMAIN CONFIGURATION IN PREVIEW & UNKNOWN ENVIRONMENTS (PHASE A2.4 TUGAS C) ──
  it('35. Lookalike domains outside production zone are not falsely blocked in Preview, while Unknown environment remains fail-closed', () => {
    const origVercelEnv = process.env.VERCEL_ENV;
    const origNextPublicVercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    const origTenantRoot = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
    const origAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    try {
      // 1. Preview environment: valid domain that contains serzen-dev.my.id as lookalike prefix
      // (e.g. serzen-dev.my.id.attacker.example) is NOT in the production zone
      process.env.VERCEL_ENV = 'preview';
      delete process.env.NEXT_PUBLIC_VERCEL_ENV;

      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'serzen-dev.my.id.attacker.example';
      expect(isProductionPlatformHostname('serzen-dev.my.id.attacker.example')).toBe(false);
      expect(getTenantRootDomain()).toBe('serzen-dev.my.id.attacker.example');

      process.env.NEXT_PUBLIC_APP_URL = 'https://serzen-dev.my.id.attacker.example';
      expect(getAppUrl()).toBe('https://serzen-dev.my.id.attacker.example');

      // 2. Unknown environment: neither production, nor preview, nor local dev
      delete process.env.VERCEL_ENV;
      delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      (globalThis as any).window = { location: { hostname: 'untrusted-host.example.org' } };

      // Unknown environment with Production apex root domain -> strictly fails closed
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = DEFAULT_TENANT_ROOT_DOMAIN;
      expect(getTenantRootDomain()).toBeNull();

      // Unknown environment with Production subdomain root domain -> strictly fails closed
      process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = 'pp-darunnajah.serzen-dev.my.id';
      expect(getTenantRootDomain()).toBeNull();

      // Unknown environment with Production app URL -> strictly fails closed
      process.env.NEXT_PUBLIC_APP_URL = CANONICAL_PRODUCTION_APP_URL;
      expect(getAppUrl()).toBeNull();

      // Unknown environment with Production subdomain app URL -> strictly fails closed
      process.env.NEXT_PUBLIC_APP_URL = 'https://pp-darunnajah.serzen-dev.my.id';
      expect(getAppUrl()).toBeNull();
    } finally {
      if (origVercelEnv === undefined) delete process.env.VERCEL_ENV;
      else process.env.VERCEL_ENV = origVercelEnv;
      if (origNextPublicVercelEnv === undefined) delete process.env.NEXT_PUBLIC_VERCEL_ENV;
      else process.env.NEXT_PUBLIC_VERCEL_ENV = origNextPublicVercelEnv;
      if (origTenantRoot === undefined) delete process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
      else process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN = origTenantRoot;
      if (origAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = origAppUrl;
    }
  });
});
