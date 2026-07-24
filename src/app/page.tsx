import { getTenantContext } from '@/lib/tenant/context';
import LoginClient from './client-page';
import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantContext();
  const title = tenant.settings?.loginTitle || tenant.name || 'Ponpes Daruttahuid';
  return {
    title: `${title} - Login`,
    description: tenant.settings?.loginDescription || 'Platform tata kelola santri, pemantauan pelanggaran, pembinaan karakter, dan manajemen asrama — terintegrasi dalam satu sistem.',
  };
}

export default async function LoginPage() {
  const tenant = await getTenantContext();
  
  const loginTitle = tenant.settings?.loginTitle || tenant.name || 'Ponpes Daruttahuid';
  const loginSubtitle = tenant.settings?.loginSubtitle || 'Malang';
  const loginDescription = tenant.settings?.loginDescription || 'Platform tata kelola santri, pemantauan pelanggaran, pembinaan karakter, dan manajemen asrama — terintegrasi dalam satu sistem.';

  return (
    <LoginClient 
      tenantName={tenant.name}
      loginTitle={loginTitle}
      loginSubtitle={loginSubtitle}
      loginDescription={loginDescription}
    />
  );
}
