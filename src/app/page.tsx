import { getTenantContext } from '@/lib/tenant/context';
import { TenantPortalClient } from '@/components/portal/TenantPortalClient';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantContext();
  const title = tenant.name || 'Ponpes Daruttahuid';
  const tagline = tenant.settings?.tagline || 'Sistem Informasi Pesantren Terpadu';
  const description = tenant.settings?.loginDescription || 'Portal Resmi Pesantren & Lembaga Pendidikan Terpadu — Beranda, Profil, Program Unggulan, Prestasi, dan Informasi Publik.';

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

export default async function TenantPublicPortalPage() {
  const tenant = await getTenantContext();

  return (
    <TenantPortalClient tenant={tenant} />
  );
}
