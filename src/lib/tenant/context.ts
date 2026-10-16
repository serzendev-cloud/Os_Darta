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
 * Thrown when a non-default tenant slug is not found in the database.
 */
export class TenantNotFoundError extends Error {
  public readonly slug: string;

  constructor(slug: string, message?: string) {
    super(message || `Tenant not found for slug: "${slug}"`);
    this.name = 'TenantNotFoundError';
    this.slug = slug;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when an underlying database query for tenant or tenant settings fails.
 * Internal details are kept server-side to prevent sensitive credential exposure.
 */
export class TenantUnavailableError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'TenantUnavailableError';
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Extract current tenant context from request headers (set by middleware).
 */
export async function getTenantContext(): Promise<TenantContext> {
  const headerStore = await headers();
  const rawTenantSlug = headerStore.get('x-tenant-slug');
  const tenantSlug = rawTenantSlug ? rawTenantSlug.trim() : null;

  if (!tenantSlug) {
    throw new TenantNotFoundError('', 'Missing tenant context: "x-tenant-slug" header is required');
  }

  if (tenantSlug === 'default') {
    return DEFAULT_TENANT;
  }

  let tenantDoc;
  try {
    const tenantResult = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, tenantSlug));
    tenantDoc = tenantResult[0];
  } catch (error) {
    throw new TenantUnavailableError(
      `Failed to lookup tenant record for slug: "${tenantSlug}"`,
      error
    );
  }

  if (!tenantDoc) {
    throw new TenantNotFoundError(tenantSlug);
  }

  let settingsDoc;
  try {
    const settingsResult = await db
      .select()
      .from(tenantSettings)
      .where(eq(tenantSettings.tenantId, tenantDoc.id));
    settingsDoc = settingsResult[0];
  } catch (error) {
    throw new TenantUnavailableError(
      `Failed to lookup tenant settings for tenant ID: "${tenantDoc.id}"`,
      error
    );
  }

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
}
