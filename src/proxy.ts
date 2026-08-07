// ========================================
// Next.js 16 Proxy - SaaS Multi-Tenant Resolver
// Traceability: HOTFIX-001 | CIP-WP-002 | AN-002 | RAR-SEC-004
// ========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. Extract subdomain if available (e.g. alfatih.mahad-app.com -> alfatih)
  let tenantSlug = 'default';

  // Exclude local dev host / localhost port
  if (
    hostname.includes('.') &&
    !hostname.includes('localhost') &&
    !hostname.startsWith('127.0.0.1')
  ) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      tenantSlug = parts[0];
    }
  }

  // 2. Also support dynamic path route /t/:slug
  if (url.pathname.startsWith('/t/')) {
    const pathParts = url.pathname.split('/');
    if (pathParts[2]) {
      tenantSlug = pathParts[2];
    }
  }

  // 3. Resolve tenant ID & header overrides
  const tenantIdHeader = request.headers.get('x-tenant-id');
  const tenantIdQuery = request.nextUrl.searchParams.get('tenant_id');
  const defaultTenantId =
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'default-tenant';

  const resolvedTenantId =
    tenantIdHeader ||
    tenantIdQuery ||
    (tenantSlug !== 'default' ? tenantSlug : defaultTenantId);

  // 4. Decorate request headers for downstream Server Components & Server Actions
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', resolvedTenantId);
  requestHeaders.set('x-tenant-slug', tenantSlug);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 5. Set response headers for client inspection
  response.headers.set('x-tenant-id', resolvedTenantId);
  response.headers.set('x-tenant-slug', tenantSlug);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'],
};
