import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getTenantContext } from '@/core/lib/tenant/context';

/**
 * Creates a tenant-isolated server-side Supabase client with auto-injected claims headers.
 * Traceability: CIP-WP-002 | AN-002 | RAR-SEC-004 | ESP0-WP-002 | ETP-T1.2
 */
export async function createTenantServerClient() {
  const cookieStore = await cookies();
  const tenantContext = await getTenantContext();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      global: {
        headers: {
          'x-tenant-id': tenantContext.tenantId,
        },
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Invoked from Server Component; ignore safe cookie setter warning
          }
        },
      },
    }
  );
}
