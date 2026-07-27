// ========================================
// Multi-Tenant Service & Tenant Context Resolver
// ========================================

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
}

export const DEFAULT_TENANT_ID = 'default';

/**
 * Client-side & Server-side tenant ID getter.
 * Reads active tenant slug from cookie or localStorage, falling back to 'default'.
 */
export function getActiveTenantId(): string {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('mahad_active_tenant_id');
      if (stored) return stored;
    } catch {
      // ignore
    }
  }
  return DEFAULT_TENANT_ID;
}

/**
 * Set active tenant ID for client session (useful for impersonation or multi-tenant switching).
 */
export function setActiveTenantId(tenantId: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('mahad_active_tenant_id', tenantId);
      window.dispatchEvent(new Event('mahad_tenant_changed'));
    } catch (e) {
      console.error('Failed to set active tenant ID:', e);
    }
  }
}

/**
 * Helper to wrap any payload with the mandatory tenantId field for insertion/mutation.
 */
export function withTenant<T extends Record<string, any>>(data: T, tenantId?: string): T & { tenantId: string } {
  return {
    ...data,
    tenantId: tenantId || getActiveTenantId(),
  };
}
