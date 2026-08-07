import { headers } from 'next/headers';

/**
 * TenantContext Interface
 * Traceability: HOTFIX-001 | CIP-WP-002 | AN-002 | RAR-SEC-004 | ESP0-WP-002 | ETP-T1.2
 */
export interface TenantContext {
  tenantId: string;
  tenantSlug?: string;
  userId?: string;
  role?: string;
  pesantrenName?: string;
  isAuthenticated: boolean;
}

/**
 * Reads verified multi-tenant session context from request headers in Server Components & Actions.
 * Traceability: HOTFIX-001 | CIP-WP-002 | AN-002 | RAR-SEC-004 | ESP0-WP-002 | ETP-T1.2
 */
export async function getTenantContext(): Promise<TenantContext> {
  const headerList = await headers();
  const tenantId =
    headerList.get('x-tenant-id') ||
    process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ||
    'default-tenant';
  const tenantSlug = headerList.get('x-tenant-slug') || undefined;
  const userId = headerList.get('x-user-id') || undefined;
  const role = headerList.get('x-user-role') || undefined;
  const pesantrenName = headerList.get('x-pesantren-name') || undefined;
  const isAuthenticated = Boolean(
    userId || headerList.get('x-authenticated') === 'true'
  );

  return {
    tenantId,
    tenantSlug,
    userId,
    role,
    pesantrenName,
    isAuthenticated,
  };
}
