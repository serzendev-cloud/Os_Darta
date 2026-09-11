// ========================================
// Server-Only Supabase Admin Client
// Canonical Authority: Supabase Auth Admin API (@supabase/supabase-js)
// Traceability: WP-TENANT-PROVISION-002
// ========================================

import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Strict Server-Only Runtime Boundary
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  throw new Error(
    'CRITICAL SECURITY VIOLATION: src/lib/supabase/admin.ts contains service-role capabilities and must never be imported or executed in client-side code.'
  );
}

let cachedAdminClient: SupabaseClient | undefined;

/**
 * Returns a singleton server-only Supabase Client initialized with the SUPABASE_SERVICE_ROLE_KEY.
 *
 * Security Requirements:
 * - Server-only execution.
 * - Never expose client-side.
 * - Never log or serialize the client instance or service-role key.
 */
export function createAdminClient(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey || serviceRoleKey.trim() === '') {
    // In test environment without active cloud credentials, provide fallback client
    if (process.env.NODE_ENV === 'test') {
      cachedAdminClient = createClient(url, 'placeholder-service-role-key-for-test', {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      return cachedAdminClient;
    }

    throw new Error(
      'Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY. Server admin operations cannot proceed.'
    );
  }

  cachedAdminClient = createClient(url, serviceRoleKey.trim(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedAdminClient;
}
