import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a browser-side Supabase client singleton with optional tenant header injection.
 * Traceability: CIP-WP-002 | AN-002 | RAR-SEC-004 | ESP0-WP-002 | ETP-T1.2
 */
export function createTenantBrowserClient(tenantId?: string) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      global: {
        headers: tenantId ? { 'x-tenant-id': tenantId } : {},
      },
    }
  );
}
