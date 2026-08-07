import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware for Multi-Tenant Context Resolution & Claim Injection.
 * Traceability: CIP-WP-002 | AN-002 | RAR-SEC-004 | ESP0-WP-002 | ETP-T1.2
 */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  // Extract tenant ID from request headers, query string, or host fallback
  const tenantIdHeader = request.headers.get('x-tenant-id');
  const tenantIdQuery = request.nextUrl.searchParams.get('tenant_id');
  const defaultTenantId =
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || 'default-tenant';

  const resolvedTenantId = tenantIdHeader || tenantIdQuery || defaultTenantId;

  // Decorate request headers for downstream Server Components & Server Actions
  requestHeaders.set('x-tenant-id', resolvedTenantId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Set response header for client inspection
  response.headers.set('x-tenant-id', resolvedTenantId);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files, _next, favicon
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
