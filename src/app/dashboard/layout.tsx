'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useSidebarStore } from '@/store/sidebar-store';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { MaintenanceBanner } from '@/components/shared/maintenance-banner';
import { useConfig } from '@/hooks/useConfig';
import { DEFAULT_MAINTENANCE_CONFIG, isMaintenanceActive, canBypassMaintenance } from '@/lib/maintenance';
import { cn } from '@/lib/utils';
import type { MaintenanceConfig } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const { isCollapsed } = useSidebarStore();
  const router = useRouter();

  const { config: maintenanceConfig } = useConfig<MaintenanceConfig>('maintenance', DEFAULT_MAINTENANCE_CONFIG);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) router.push('/');
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Maintenance mode guard — admin always bypasses
  if (isMaintenanceActive(maintenanceConfig)) {
    if (!canBypassMaintenance(maintenanceConfig, user.role)) {
      if (maintenanceConfig.type === 'full') {
        return (
          <main className="min-h-screen bg-background">
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="max-w-md w-full text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
                    <span className="text-primary-foreground text-lg font-bold">M</span>
                  </div>
                </div>
                <h1 className="text-xl font-bold text-foreground">Sistem Dalam Pemeliharaan</h1>
                <p className="text-muted-foreground text-sm">{maintenanceConfig.message || 'Ma\'had Manager sedang dalam pemeliharaan terjadwal. Silakan kembali beberapa saat lagi.'}</p>
                {maintenanceConfig.estimatedEndAt && (
                  <p className="text-xs text-muted-foreground">
                    Perkiraan selesai: {new Date(maintenanceConfig.estimatedEndAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          </main>
        );
      }
      // readonly mode: show banner, children below
      return (
        <div className="min-h-screen bg-background">
          <MaintenanceBanner config={maintenanceConfig} />
          <Sidebar />
          <div className={cn('transition-all duration-300 ease-in-out', isCollapsed ? 'lg:pl-[var(--sidebar-width-collapsed)]' : 'lg:pl-[var(--sidebar-width)]')}>
            <Topbar />
            <main className="p-4 lg:p-6">
              <Breadcrumb />
              {children}
            </main>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-sky-100/80 dark:bg-background">
      {isMaintenanceActive(maintenanceConfig) && (
        <MaintenanceBanner config={maintenanceConfig} isBypass />
      )}
      <Sidebar />
      <div className={cn('transition-all duration-300 ease-in-out bg-sky-100/80 dark:bg-background min-h-screen', isCollapsed ? 'lg:pl-[var(--sidebar-width-collapsed)]' : 'lg:pl-[var(--sidebar-width)]')}>
        <Topbar />
        <main className="p-4 lg:p-6 bg-sky-100/80 dark:bg-background min-h-[calc(100vh-4rem)]">
          <Breadcrumb />
          {children}
        </main>
      </div>
    </div>
  );
}
