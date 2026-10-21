// ========================================
// SaaS Multi-Tenant Domain Configuration
// Single Source of Truth for Tenant Root Domain & Hostname Generation
// Traceability: WP-DOMAIN-TENANT-ROOT-REMEDIATION-001 / Phase A2 Hardening
// ========================================

export const DEFAULT_TENANT_ROOT_DOMAIN = 'serzen-dev.my.id';
export const CANONICAL_PRODUCTION_APP_URL = 'https://www.serzen-dev.my.id';

/**
 * Known legacy platform root domains that must not be treated as active custom domains.
 * If a stored tenant domain ends with any of these, it must be canonicalized to the active root domain.
 */
export const LEGACY_TENANT_ROOT_DOMAINS = ['madev.id'] as const;

/**
 * Strict slug validation for tenant subdomains (RFC 1123 DNS label compliant).
 * Rejects:
 * - Empty, null, undefined, whitespace
 * - Slashes, paths, colons, schemes, userinfo, ports
 * - Underscores or special characters (only lowercase alphanumeric and internal hyphens allowed)
 * - Leading or trailing hyphens (-slug or slug-)
 * - Internal database ID patterns (e.g. t_*, UUIDs)
 * - Length < 2 or > 63 characters
 */
export function isValidTenantSlug(slug?: string | null): boolean {
  if (!slug || typeof slug !== 'string') return false;
  const clean = slug.trim().toLowerCase();
  if (clean.length < 2 || clean.length > 63) return false;

  // Reject internal database IDs (e.g. t_... or UUIDs)
  if (clean.startsWith('t_') || clean.includes('_')) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(clean)) return false;

  // RFC 1123 label: starts and ends with alphanumeric, hyphens allowed in between
  const labelRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  return labelRegex.test(clean);
}

/**
 * Strict RFC 1123 hostname validation.
 * Rejects:
 * - URL schemes (http://, https://, //)
 * - Paths (/...)
 * - Userinfo (user:pass@, user@)
 * - Ports (:3000)
 * - Query strings (?) or fragments (#)
 * - Leading, trailing, or consecutive dots
 * - Underscores, invalid characters, or whitespace
 * - Labels starting or ending with a hyphen
 * - Labels > 63 chars or total length > 253 chars
 * - Single-label strings (must contain at least two labels, e.g. domain.tld)
 */
export function isValidHostname(hostname?: string | null): boolean {
  if (!hostname || typeof hostname !== 'string') return false;
  const clean = hostname.trim().toLowerCase();
  if (!clean || clean.length > 253) return false;

  // Reject URL scheme, userinfo, port, path, query, fragment, whitespace, underscores
  if (
    clean.includes('://') ||
    clean.startsWith('//') ||
    clean.includes('@') ||
    clean.includes(':') ||
    clean.includes('/') ||
    clean.includes('?') ||
    clean.includes('#') ||
    clean.includes(' ') ||
    clean.includes('_')
  ) {
    return false;
  }

  // Reject leading, trailing, or consecutive dots
  if (clean.startsWith('.') || clean.endsWith('.') || clean.includes('..')) {
    return false;
  }

  const labels = clean.split('.');
  // Must have at least two labels (e.g. example.com)
  if (labels.length < 2) return false;

  const labelRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  return labels.every((label) => label.length >= 1 && label.length <= 63 && labelRegex.test(label));
}

/**
 * Canonical check to determine if a hostname belongs to the Production platform domain zone:
 * - 'serzen-dev.my.id' (canonical apex)
 * - 'www.serzen-dev.my.id'
 * - Any subdomain under 'serzen-dev.my.id' (e.g. 'pp-darunnajah.serzen-dev.my.id', 'preview.serzen-dev.my.id')
 *
 * Enforces strict DNS label boundary matching:
 * Matches clean === DEFAULT_TENANT_ROOT_DOMAIN || clean.endsWith(`.${DEFAULT_TENANT_ROOT_DOMAIN}`).
 * Rejects lookalikes (e.g. 'serzen-dev.my.id.attacker.example', 'notserzen-dev.my.id').
 */
export function isProductionPlatformHostname(hostname?: string | null): boolean {
  if (!hostname || typeof hostname !== 'string') return false;
  const clean = hostname.trim().toLowerCase();
  if (!clean || !isValidHostname(clean)) return false;
  return clean === DEFAULT_TENANT_ROOT_DOMAIN || clean.endsWith(`.${DEFAULT_TENANT_ROOT_DOMAIN}`);
}

/**
 * Returns the configured root domain for tenant subdomains.
 * Reads NEXT_PUBLIC_TENANT_ROOT_DOMAIN.
 *
 * Rules:
 * 1. If NEXT_PUBLIC_TENANT_ROOT_DOMAIN is explicitly provided:
 *    - Validates that it is a valid RFC 1123 hostname.
 *    - Rejects URL schemes, paths, userinfo, ports, malformed dots, or invalid characters.
 *    - If invalid, returns null (fail-closed).
 * 2. If NEXT_PUBLIC_TENANT_ROOT_DOMAIN is NOT provided:
 *    - In Preview environment (server: VERCEL_ENV === 'preview' or NEXT_PUBLIC_VERCEL_ENV === 'preview';
 *      client: NEXT_PUBLIC_VERCEL_ENV === 'preview'):
 *      - Fails closed and returns null (PREVIEW_ROOT_DOMAIN_UNCONFIGURED).
 *      - Strictly forbids silently falling back to Production root domain on Preview.
 *    - Otherwise (Production or default local development):
 *      - Falls back to DEFAULT_TENANT_ROOT_DOMAIN ('serzen-dev.my.id').
 */
/**
 * Detects whether there is a contradiction in environment configuration flags.
 * E.g., VERCEL_ENV === 'preview' while NEXT_PUBLIC_VERCEL_ENV === 'production',
 * or VERCEL_ENV === 'production' while NEXT_PUBLIC_VERCEL_ENV === 'preview'.
 * Any conflicting environment must fail closed and never fall back to Production.
 */
export function hasConflictingEnvironment(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    const vEnv = process.env.VERCEL_ENV;
    const npvEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    if (vEnv && npvEnv && vEnv.trim().toLowerCase() !== npvEnv.trim().toLowerCase()) {
      return true;
    }
  }
  return false;
}

/**
 * Detects if the current execution context is in the Preview environment.
 * Evaluates both server and client environments safely:
 * - Server: checks VERCEL_ENV === 'preview' or NEXT_PUBLIC_VERCEL_ENV === 'preview'.
 * - Client (browser): checks NEXT_PUBLIC_VERCEL_ENV === 'preview' or window.location.hostname ending with .vercel.app.
 * Does NOT rely on server-only env vars in client context.
 * Strictly returns false if environment flags are conflicting.
 */
export function isPreviewEnvironment(): boolean {
  if (hasConflictingEnvironment()) {
    return false;
  }

  if (typeof process !== 'undefined' && process.env) {
    if (
      process.env.VERCEL_ENV === 'preview' ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'
    ) {
      return true;
    }
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname.toLowerCase();
    if (host.endsWith('.vercel.app') || host.includes('preview')) {
      return true;
    }
  }

  return false;
}

/**
 * Detects if the current execution context is in the Production environment.
 * Evaluates both server and client environments safely:
 * - Server: checks VERCEL_ENV === 'production' or NEXT_PUBLIC_VERCEL_ENV === 'production'.
 * - Client (browser): strictly checks NEXT_PUBLIC_VERCEL_ENV === 'production'.
 *
 * CRITICAL ARCHITECTURAL DIRECTIVES:
 * 1. Must NEVER be true if hasConflictingEnvironment() is true.
 * 2. Must NEVER be true if isPreviewEnvironment() is true.
 * 3. Does NOT check NODE_ENV === 'production' because Next.js automatically sets
 *    NODE_ENV='production' for both Preview and Production builds.
 * 4. Does NOT trust window.location.hostname as proof of Production! A Preview deployment
 *    or unknown environment accessed via a domain alias on serzen-dev.my.id must NEVER
 *    be assumed to be Production, as that would bypass fail-closed safeguards.
 */
export function isProductionEnvironment(): boolean {
  // If conflicting or in Preview, never consider it Production
  if (hasConflictingEnvironment() || isPreviewEnvironment()) {
    return false;
  }

  if (typeof process !== 'undefined' && process.env) {
    if (
      process.env.VERCEL_ENV === 'production' ||
      process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Detects if the current execution context is in local development or test environment.
 * - On client (browser): checks if hostname is localhost or loopback 127.0.0.1.
 * - On server: checks if NODE_ENV is 'development' or 'test' AND neither VERCEL_ENV
 *   nor NEXT_PUBLIC_VERCEL_ENV is set.
 */
export function isLocalDevelopmentEnvironment(): boolean {
  if (hasConflictingEnvironment() || isPreviewEnvironment() || isProductionEnvironment()) {
    return false;
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const host = window.location.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1';
  }

  if (typeof process !== 'undefined' && process.env) {
    const nodeEnv = process.env.NODE_ENV;
    return (
      (nodeEnv === 'development' || nodeEnv === 'test') &&
      !process.env.VERCEL_ENV &&
      !process.env.NEXT_PUBLIC_VERCEL_ENV
    );
  }

  return false;
}

export function getTenantRootDomain(): string | null {
  // Conflicting environment flags -> strictly fail closed
  if (hasConflictingEnvironment()) {
    return null;
  }

  const envDomain = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
  if (envDomain && envDomain.trim() !== '' && envDomain !== 'undefined') {
    const raw = envDomain.trim().toLowerCase();
    // Fail-closed: reject leading or trailing dots explicitly.
    // Never silently normalize .example.test or example.test. into a valid hostname!
    if (raw.startsWith('.') || raw.endsWith('.')) {
      return null;
    }
    if (!isValidHostname(raw)) {
      return null;
    }

    // CRITICAL SECURITY RULE (Phase A2.4 Tugas B):
    // In Preview: strictly forbid using the Production platform domain or ANY of its subdomains!
    // (e.g. 'serzen-dev.my.id', 'www.serzen-dev.my.id', 'pp-darunnajah.serzen-dev.my.id', 'preview.serzen-dev.my.id')
    // Preview must fail closed (return null) rather than routing traffic to Production.
    if (isPreviewEnvironment()) {
      if (isProductionPlatformHostname(raw)) {
        return null;
      }
    }

    // In Unknown / Untrusted environment (not production, not local dev, not preview):
    // Cannot claim canonical production root domain or subdomains without verified production identity.
    if (!isProductionEnvironment() && !isLocalDevelopmentEnvironment() && !isPreviewEnvironment()) {
      if (isProductionPlatformHostname(raw)) {
        return null;
      }
    }

    return raw;
  }

  // When NEXT_PUBLIC_TENANT_ROOT_DOMAIN is absent:
  // 1. Explicit or hinted Preview environment -> strictly fail closed
  if (isPreviewEnvironment()) {
    return null;
  }

  // 2. Explicitly known Production environment -> default to canonical production root
  if (isProductionEnvironment()) {
    return DEFAULT_TENANT_ROOT_DOMAIN;
  }

  // 3. Local development environment -> default to canonical production root for local testing
  if (isLocalDevelopmentEnvironment()) {
    return DEFAULT_TENANT_ROOT_DOMAIN;
  }

  // 4. Unknown / untrusted environment (e.g. Preview deployment accessed via production domain alias
  // without NEXT_PUBLIC configuration) -> strictly fail closed!
  // Hostname alone must NEVER allow an unknown environment to silently use Production root domain!
  return null;
}

/**
 * Strips the configured root domain suffix from a user-entered subdomain/slug input.
 * Avoids raw regex interpolation of domain strings containing dots or special characters.
 *
 * Examples:
 * - ("darululum.serzen-dev.my.id", "serzen-dev.my.id") -> "darululum"
 * - ("darululum", "serzen-dev.my.id") -> "darululum"
 * - ("darululum-serzen-devamybid", "serzen-dev.my.id") -> "darululum-serzen-devamybid" (not stripped)
 * - ("serzen-dev.my.id", "serzen-dev.my.id") -> ""
 * - ("darululum", null) -> "darululum"
 */
export function extractSlugFromSubdomainInput(input?: string | null, rootDomain?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  const cleanInput = input.trim().toLowerCase();
  if (!cleanInput) return '';

  if (!rootDomain || typeof rootDomain !== 'string') {
    return cleanInput;
  }

  const cleanRoot = rootDomain.trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  if (!cleanRoot) {
    return cleanInput;
  }

  // Exact match to root domain -> empty slug (invalid tenant slug)
  if (cleanInput === cleanRoot) {
    return '';
  }

  // Subdomain format: e.g. "slug.root.domain"
  const suffix = `.${cleanRoot}`;
  if (cleanInput.endsWith(suffix)) {
    return cleanInput.slice(0, -suffix.length).trim();
  }

  return cleanInput;
}

/**
 * Constructs the canonical fully qualified domain name (FQDN) for a tenant slug in the active environment.
 * e.g. "pp-darululum" -> "pp-darululum.serzen-dev.my.id"
 * Returns null if slug is invalid or root domain is not available/invalid.
 */
export function getTenantDomain(slug?: string | null): string | null {
  if (!slug || !isValidTenantSlug(slug)) {
    return null;
  }
  const cleanSlug = slug.trim().toLowerCase();
  const rootDomain = getTenantRootDomain();
  if (!rootDomain) {
    return null;
  }
  return `${cleanSlug}.${rootDomain}`;
}

/**
 * Resolves the base application URL safely without silent fallback to Production.
 * Reads NEXT_PUBLIC_APP_URL.
 *
 * Rules:
 * 1. If NEXT_PUBLIC_APP_URL is explicitly set:
 *    - Must be a valid URL (http:// or https://) with a valid hostname or loopback.
 *    - Strips trailing slashes.
 *    - Returns validated URL string.
 *    - If malformed, returns null (fail-closed).
 * 2. If NEXT_PUBLIC_APP_URL is absent / empty:
 *    - In Preview environment:
 *      - Fails closed and returns null (PREVIEW_APP_URL_UNCONFIGURED).
 *      - Strictly forbids silently falling back to Production URL on Preview.
 *    - In Production:
 *      - Returns 'https://www.serzen-dev.my.id' (canonical production platform URL).
 *    - Otherwise (local development without Preview flags):
 *      - Returns 'http://localhost:3000'.
 */
export function getAppUrl(): string | null {
  // Conflicting environment flags -> strictly fail closed
  if (hasConflictingEnvironment()) {
    return null;
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl && envUrl.trim() !== '' && envUrl !== 'undefined') {
    const clean = envUrl.trim().replace(/\/+$/, '');
    let parsed: URL;
    try {
      parsed = new URL(clean);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
      if (
        !isValidHostname(parsed.hostname) &&
        parsed.hostname !== 'localhost' &&
        parsed.hostname !== '127.0.0.1'
      ) {
        return null;
      }
    } catch {
      return null;
    }

    const isProductionHost = isProductionPlatformHostname(parsed.hostname);

    // CRITICAL SECURITY RULE (Phase A2.4 Tugas B):
    // In Preview: strictly forbid using Production platform app URLs or ANY of its subdomains!
    // (e.g. 'https://serzen-dev.my.id', 'https://www.serzen-dev.my.id', 'https://pp-darunnajah.serzen-dev.my.id')
    // Preview must fail closed (return null) rather than directing users to Production.
    if (isPreviewEnvironment()) {
      if (isProductionHost) {
        return null;
      }
    }

    // In Unknown / Untrusted environment: cannot claim canonical production app URL or subdomains
    if (!isProductionEnvironment() && !isLocalDevelopmentEnvironment() && !isPreviewEnvironment()) {
      if (isProductionHost) {
        return null;
      }
    }

    return clean;
  }

  // When APP_URL is absent:
  // 1. In Preview: strictly fail closed (return null). Never silently produce Production URLs!
  if (isPreviewEnvironment()) {
    return null;
  }

  // 2. Production environment fallback
  if (isProductionEnvironment()) {
    return CANONICAL_PRODUCTION_APP_URL;
  }

  // 3. Local development fallback (localhost / loopback / dev/test without cloud env)
  if (isLocalDevelopmentEnvironment()) {
    return 'http://localhost:3000';
  }

  // 4. Unknown / untrusted environment without explicit APP_URL -> strictly fail closed!
  return null;
}

/**
 * Checks whether a given domain matches the syntax of an intentional custom domain,
 * as opposed to a platform-generated subdomain (legacy or active).
 *
 * NOTE (Phase A2 Architectural Finding):
 * While this helper recognizes valid custom domain syntax and distinguishes it from platform/legacy roots,
 * the application proxy (src/proxy.ts) does NOT currently resolve incoming custom domain hostnames to tenants.
 * Custom domain hostname-to-tenant routing requires automated DNS/CNAME management and database lookup,
 * which is formally deferred under WP-SAAS-DOMAIN-001 (PAUSED).
 */
export function isCustomTenantDomain(domain?: string | null): boolean {
  if (!domain || typeof domain !== 'string') return false;
  const raw = domain.trim().toLowerCase();
  if (!isValidHostname(raw)) return false;

  // 1. Check against legacy platform domains (e.g. *.madev.id)
  for (const legacy of LEGACY_TENANT_ROOT_DOMAINS) {
    if (raw === legacy || raw.endsWith(`.${legacy}`)) {
      return false;
    }
  }

  // 2. Check against current configured root domain (if available)
  const currentRoot = getTenantRootDomain();
  if (currentRoot && (raw === currentRoot || raw.endsWith(`.${currentRoot}`))) {
    return false;
  }

  // 3. Check against canonical production platform domain zone (root & subdomains)
  if (isProductionPlatformHostname(raw)) {
    return false;
  }

  return true;
}

/**
 * Resolves the effective domain for a tenant given its slug and stored domain.
 * - If storedDomain is an intentional valid custom domain (e.g. 'santri.pesantren.sch.id'), it is preserved.
 * - If storedDomain is legacy (e.g. '*.madev.id'), missing, or matches a platform root domain,
 *   it resolves to the canonical domain for the active environment: `${slug}.${getTenantRootDomain()}`.
 * - If slug is missing or invalid, returns null (never produces '.serzen-dev.my.id' or internal ID hostnames).
 * - If root domain is unavailable (e.g. Preview without root config), returns null.
 */
export function resolveTenantDomain(slug?: string | null, storedDomain?: string | null): string | null {
  if (storedDomain && isCustomTenantDomain(storedDomain)) {
    return storedDomain.trim().toLowerCase();
  }

  if (!slug || !isValidTenantSlug(slug)) {
    return null;
  }

  return getTenantDomain(slug);
}
