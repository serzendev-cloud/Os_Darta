import { Suspense } from 'react';
import { Metadata } from 'next';
import { getTenantContext } from '@/lib/tenant/context';
import ForgotPasswordClient from './forgot-password-client';
import { Loader2 } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantContext();
  const title = tenant.settings?.loginTitle || tenant.name || 'Ponpes Daruttahuid';
  return {
    title: `Lupa Password — ${title} | Ma'had Manager ERP`,
    description: 'Permohonan pemulihan dan pembuatan kata sandi baru akun pengguna portal pesantren.',
  };
}

export default async function ForgotPasswordPage() {
  const tenant = await getTenantContext();

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-medium text-stone-500">Memuat halaman pemulihan...</p>
          </div>
        </div>
      }
    >
      <ForgotPasswordClient
        tenantName={tenant.name}
        loginTitle={tenant.settings?.loginTitle || tenant.name}
        customLogoUrl={tenant.settings?.customLogoUrl || null}
      />
    </Suspense>
  );
}
