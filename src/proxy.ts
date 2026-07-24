// ========================================
// Next.js 16 Proxy - SaaS Multi-Tenant Resolver
// ========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Extract subdomain if available (e.g. alfatih.mahad-app.com -> alfatih)
  let tenantSlug = 'default';

  // Exclude local dev host / localhost port
  if (hostname.includes('.') && !hostname.includes('localhost') && !hostname.startsWith('127.0.0.1')) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      tenantSlug = parts[0];
    }
  }

  // Also support dynamic path route /t/:slug
  if (url.pathname.startsWith('/t/')) {
    const pathParts = url.pathname.split('/');
    if (pathParts[2]) {
      tenantSlug = pathParts[2];
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-tenant-slug', tenantSlug);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'],
};
