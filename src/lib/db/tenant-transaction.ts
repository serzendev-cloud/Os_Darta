// ========================================
// Canonical Multi-Tenant Database Transaction Helper
// Defense-in-Depth RLS Context Management
// Traceability: WP-SAAS-SEC-002
// ========================================

import { sql } from 'drizzle-orm';
import { db } from './index';

export interface TenantTransactionOptions {
  isSuperAdmin?: boolean;
  tenantSlug?: string;
}

/**
 * Executes database operations within an isolated transaction where the
 * PostgreSQL session parameters `app.current_tenant_id` and `app.is_super_admin`
 * are strictly set using `SET LOCAL`.
 *
 * `SET LOCAL` ensures that when the transaction completes (COMMIT or ROLLBACK),
 * the session settings are automatically cleared, preventing context leakage
 * across pooled database connections.
 *
 * @param tenantId The verified canonical tenant ID (e.g. from getTenantContext())
 * @param callback The function containing database queries using the scoped transaction client
 * @param options Optional flags such as isSuperAdmin or tenantSlug
 */
export async function withTenantTransaction<T>(
  tenantId: string,
  callback: (tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) => Promise<T>,
  options?: TenantTransactionOptions
): Promise<T> {
  const safeTenantId = (tenantId || '').trim();
  const isSuperAdmin = options?.isSuperAdmin === true;
  const tenantSlug = (options?.tenantSlug || '').trim();

  return await db.transaction(async (tx) => {
    // 1. Set local transaction variables (Fail-Closed)
    if (safeTenantId) {
      await tx.execute(sql.raw(`SET LOCAL app.current_tenant_id = '${safeTenantId.replace(/'/g, "''")}';`));
    }
    
    if (tenantSlug) {
      await tx.execute(sql.raw(`SET LOCAL app.current_tenant_slug = '${tenantSlug.replace(/'/g, "''")}';`));
    }

    if (isSuperAdmin) {
      await tx.execute(sql.raw(`SET LOCAL app.is_super_admin = 'true';`));
    } else {
      await tx.execute(sql.raw(`SET LOCAL app.is_super_admin = 'false';`));
    }

    // 2. Execute the user callback with RLS enforced
    return await callback(tx);
  });
}
