// ========================================
// SaaS Multi-Tenant Domain Configuration
// Single Source of Truth for Tenant Root Domain & Hostname Generation
// Traceability: WP-DOMAIN-TENANT-ROOT-REMEDIATION-001
// ========================================

export const DEFAULT_TENANT_ROOT_DOMAIN = 'serzen-dev.my.id';

/**
 * Returns the configured root domain for tenant subdomains.
 * Reads NEXT_PUBLIC_TENANT_ROOT_DOMAIN with fallback to 'serzen-dev.my.id'.
 */
export function getTenantRootDomain(): string {
  const envDomain = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
  if (envDomain && envDomain.trim() !== '' && envDomain !== 'undefined') {
    return envDomain.trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  }
  return DEFAULT_TENANT_ROOT_DOMAIN;
}

/**
 * Constructs the canonical fully qualified domain name (FQDN) for a tenant slug.
 * e.g. "pp-darululum" -> "pp-darululum.serzen-dev.my.id"
 */
export function getTenantDomain(slug: string): string {
  const cleanSlug = slug.toLowerCase().trim().replace(/^\.+|\.+$/g, '');
  const rootDomain = getTenantRootDomain();
  return `${cleanSlug}.${rootDomain}`;
}
