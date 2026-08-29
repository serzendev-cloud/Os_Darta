// ========================================
// Next.js 16 Proxy - SaaS Multi-Tenant & Supabase Zero-Trust Auth Boundary
// Traceability: HOTFIX-001 | CIP-WP-002 | AN-002 | RAR-SEC-004 | WP-101 Phase 1D
// ========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createProxyClient } from '@/lib/supabase/proxy';

/**
 * Public routes that do not require authentication
 */
const PUBLIC_PATHS = [
  '/login',
  '/maintenance',
  '/auth',
  '/api/webhooks',
];

/**
 * Check if the request path is explicitly public
 */
function isPublicPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Reserved SaaS platform hostnames that must not be treated as tenant slugs
 */
export const RESERVED_HOSTNAMES = new Set([
  'www',
  'madev',
  'app',
  'saas',
  'admin',
  'api',
  'dashboard',
  'status',
  'assets',
  'static',
  'cdn',
  'public',
  'platform',
  'mail',
  'smtp',
]);

/**
 * Extract tenant slug safely from hostname or path without trusting raw client headers.
 * Classification logic:
 * 1. Path route /t/:slug -> extracts :slug if valid and not reserved
 * 2. Hostname subdomain -> extracts candidate slug if domain has subdomains and not reserved/localhost
 * 3. Default fallback -> 'default' for platform routes
 */
export function extractTenantSlug(request: NextRequest): string {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. Check path route /t/:slug
  if (url.pathname.startsWith('/t/')) {
    const pathParts = url.pathname.split('/');
    if (pathParts[2] && pathParts[2].trim() !== '') {
      const candidatePathSlug = pathParts[2].toLowerCase().trim();
      if (!RESERVED_HOSTNAMES.has(candidatePathSlug)) {
        return candidatePathSlug;
      }
    }
  }

  // 2. Extract subdomain if hostname contains domain dots and is not localhost/IP
  if (
    hostname.includes('.') &&
    !hostname.includes('localhost') &&
    !hostname.startsWith('127.0.0.1')
  ) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const candidateSlug = parts[0].toLowerCase().trim();
      if (!RESERVED_HOSTNAMES.has(candidateSlug)) {
        return candidateSlug;
      }
    }
  }

  return 'default';
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // 1. Extract tenant slug from hostname/path (Zero-Trust: Client x-tenant-id header is IGNORED)
  const tenantSlug = extractTenantSlug(request);
  const defaultTenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'default-tenant';
  const resolvedTenantId = tenantSlug !== 'default' ? tenantSlug : defaultTenantId;

  // 2. Initialize Edge-safe Supabase Client & Response
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createProxyClient(request, response);

  // 3. Server-side Session Validation (Fail-Closed Auth Boundary)
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    user = null; // Session validation failed, fail closed
  }

  const isAuthenticated = !!user;
  const isPublic = isPublicPath(pathname);

  // 4. Fail-Closed Authentication Enforcement
  if (!isAuthenticated && !isPublic) {
    // API route unauthenticated -> 401 JSON Response
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Autentikasi diperlukan untuk mengakses resource ini' },
        { status: 401 }
      );
    }

    // Protected Page navigation (/dashboard/*, /wali/*, etc.) -> Redirect to /login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Build Verified Downstream Request Headers
  const requestHeaders = new Headers(request.headers);

  // CRITICAL ZERO-TRUST SECURITY: Overwrite client-supplied headers with server-verified claims
  requestHeaders.set('x-tenant-id', resolvedTenantId);
  requestHeaders.set('x-tenant-slug', tenantSlug);

  if (user) {
    requestHeaders.set('x-user-id', user.id);
    const userRole = (user.app_metadata?.role || user.user_metadata?.role || 'user') as string;
    requestHeaders.set('x-user-role', userRole);

    if (userRole === 'SUPER_ADMIN' || userRole === 'DEVELOPER') {
      requestHeaders.set('x-is-super-admin', 'true');
    }
  } else {
    requestHeaders.delete('x-user-id');
    requestHeaders.delete('x-user-role');
    requestHeaders.delete('x-is-super-admin');
  }

  // 6. Return response with decorated headers & refreshed session cookies
  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Copy updated cookies from Supabase client response
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  finalResponse.headers.set('x-tenant-id', resolvedTenantId);
  finalResponse.headers.set('x-tenant-slug', tenantSlug);

  return finalResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
