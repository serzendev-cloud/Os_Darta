import { getTenantContext } from '@/lib/tenant/context';
import { TenantPortalClient } from '@/components/portal/TenantPortalClient';
import { SaasLandingPage } from '@/components/landing/SaasLandingPage';
import { SAAS_PRODUCT_CONFIG } from '@/config/product';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantContext();

  // SaaS Platform Root Hostname Metadata
  if (!tenant.slug || tenant.slug === 'default') {
    return {
      title: `${SAAS_PRODUCT_CONFIG.name} — ${SAAS_PRODUCT_CONFIG.tagline}`,
      description: SAAS_PRODUCT_CONFIG.description,
      openGraph: {
        title: `${SAAS_PRODUCT_CONFIG.name} — ${SAAS_PRODUCT_CONFIG.tagline}`,
        description: SAAS_PRODUCT_CONFIG.description,
        siteName: SAAS_PRODUCT_CONFIG.name,
        type: 'website',
      },
    };
  }

  // Tenant Public Website Metadata
  const title = tenant.name || 'Portal Pesantren';
  const tagline = tenant.settings?.tagline || 'Sistem Informasi Pesantren Terpadu';
  const description =
    tenant.settings?.loginDescription ||
    'Portal Resmi Pesantren & Lembaga Pendidikan Terpadu — Beranda, Profil, Program Unggulan, Prestasi, dan Informasi Publik.';

  return {
    title: `${title} | Portal Resmi — ${tagline}`,
    description: description,
    openGraph: {
      title: `${title} | Portal Resmi`,
      description: description,
      siteName: title,
      type: 'website',
    },
  };
}

export default async function RootPage() {
  const tenant = await getTenantContext();

  // Architectural Branching:
  // SaaS Root Hostname -> Render SaaS Product Landing Page
  if (!tenant.slug || tenant.slug === 'default') {
    return <SaasLandingPage />;
  }

  // Tenant Subdomain -> Render Tenant Public Website
  return <TenantPortalClient tenant={tenant} />;
}

