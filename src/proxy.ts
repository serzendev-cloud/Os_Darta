// ========================================
// Next.js 16 Proxy - SaaS Multi-Tenant & Supabase Zero-Trust Auth Boundary
// Traceability: HOTFIX-001 | CIP-WP-002 | AN-002 | RAR-SEC-004 | WP-101 Phase 1D
// ========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createProxyClient } from '@/lib/supabase/proxy';
import { getTenantRootDomain } from '@/config/tenant';

/**
 * Public routes that do not require authentication
 */
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/maintenance',
  '/auth',
  '/api/webhooks',
  '/api/saas/register',
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
  'serzen-dev',
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
 * 2. Ignore local dev / loopback (returns 'default')
 * 3. Deterministic hostname resolution against authorized NEXT_PUBLIC_TENANT_ROOT_DOMAIN (e.g. serzen-dev.my.id)
 *    - Apex or www -> 'default'
 *    - <slug>.<rootDomain> -> extracts :slug if valid and not reserved
 * 4. Strict Fail-Closed default: Vercel preview domains and all foreign/unauthorized hostnames return 'default'
 */
export function extractTenantSlug(request: NextRequest): string {
  const url = request.nextUrl;
  const rawHost = request.headers.get('host') || '';
  const hostname = rawHost.split(':')[0].toLowerCase().trim();

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

  // 2. Ignore local dev / loopback
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
    return 'default';
  }

  // 3. Deterministic resolution against configured Tenant Root Domain
  const rootDomain = getTenantRootDomain();

  // Apex platform root or www -> platform default
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return 'default';
  }

  // Subdomain of configured root domain: e.g. <slug>.serzen-dev.my.id
  if (hostname.endsWith(`.${rootDomain}`)) {
    const prefix = hostname.slice(0, -(rootDomain.length + 1));
    const subParts = prefix.split('.');
    const candidateSlug = subParts[0].toLowerCase().trim();
    if (candidateSlug && !RESERVED_HOSTNAMES.has(candidateSlug)) {
      return candidateSlug;
    }
    return 'default';
  }

  // 4. Fail-closed: Vercel preview domains and all foreign/unauthorized hostnames default to platform
  return 'default';
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // 0. Fast-path exemption for public static assets (prevent unwanted redirects)
  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    /\.(png|jpg|jpeg|svg|ico|webp|gif|css|js|woff|woff2)$/i.test(pathname);
  if (isStaticAsset) {
    return NextResponse.next();
  }

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

  // 4b. Fail-Closed Lifecycle Access Gate for Invited Users (Onboarding Incomplete)
  // Server-controlled app_metadata is strictly authoritative over client-modifiable user_metadata.
  const appStatus = (user?.app_metadata?.status as string) || '';
  const userMetaStatus = (user?.user_metadata?.status as string) || '';
  const isInvitedUser =
    appStatus.toUpperCase() === 'INVITED' ||
    (!appStatus && userMetaStatus.toUpperCase() === 'INVITED');

  if (isAuthenticated && isInvitedUser) {
    // Exempt auth onboarding routes and error pages to avoid redirect loops
    const isLoginWithError = pathname === '/login' && url.searchParams.has('error');
    const isAuthRoute =
      pathname.startsWith('/auth') ||
      pathname.startsWith('/api/auth') ||
      isLoginWithError;

    if (!isAuthRoute) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            success: false,
            error: 'UserOnboardingIncomplete',
            message: 'Silakan selesaikan pembuatan kata sandi akun terlebih dahulu sebelum mengakses sistem.',
          },
          { status: 403 }
        );
      }

      // Intercept navigation to dashboard / operational pages and redirect to set-password
      const setPasswordUrl = new URL('/auth/set-password', request.url);
      return NextResponse.redirect(setPasswordUrl);
    }
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

    const normalizedRole = userRole.toUpperCase().replace(/\s+/g, '_');
    if (normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'DEVELOPER') {
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
