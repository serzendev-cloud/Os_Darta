// ========================================
// Tenant Context Helper
// ========================================

import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { tenants, tenantSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  settings?: {
    customLogoUrl?: string | null;
    customBgUrl?: string | null;
    primaryColor?: string | null;
    tagline?: string | null;
    flipSecretKey?: string | null;
    flipValidationToken?: string | null;
    gdriveServiceAccountJson?: string | null;
    waGatewayApiKey?: string | null;
    loginTitle?: string | null;
    loginSubtitle?: string | null;
    loginDescription?: string | null;
  };
}

export const DEFAULT_TENANT: TenantContext = {
  id: 'default',
  name: 'Ma\'had Management Platform',
  slug: 'default',
  domain: null,
  settings: {
    primaryColor: '#0F766E',
    tagline: 'Sistem Informasi Pesantren Terpadu',
  },
};

/**
 * Extract current tenant context from request headers (set by middleware).
 */
export async function getTenantContext(): Promise<TenantContext> {
  try {
    const headerStore = await headers();
    const tenantSlug = headerStore.get('x-tenant-slug');

    if (!tenantSlug || tenantSlug === 'default') {
      return DEFAULT_TENANT;
    }

    const tenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug));

    const tenantDoc = tenantResult[0];
    if (!tenantDoc) return DEFAULT_TENANT;

    const settingsResult = await db
      .select()
      .from(tenantSettings)
      .where(eq(tenantSettings.tenantId, tenantDoc.id));

    const settingsDoc = settingsResult[0];

    return {
      id: tenantDoc.id,
      name: tenantDoc.name,
      slug: tenantDoc.slug,
      domain: tenantDoc.domain,
      settings: settingsDoc
        ? {
            customLogoUrl: settingsDoc.customLogoUrl,
            customBgUrl: settingsDoc.customBgUrl,
            primaryColor: settingsDoc.primaryColor,
            tagline: settingsDoc.tagline,
            flipSecretKey: settingsDoc.flipSecretKey,
            flipValidationToken: settingsDoc.flipValidationToken,
            gdriveServiceAccountJson: settingsDoc.gdriveServiceAccountJson,
            waGatewayApiKey: settingsDoc.waGatewayApiKey,
            loginTitle: settingsDoc.loginTitle,
            loginSubtitle: settingsDoc.loginSubtitle,
            loginDescription: settingsDoc.loginDescription,
          }
        : DEFAULT_TENANT.settings,
    };
  } catch {
    return DEFAULT_TENANT;
  }
}
