'use client';

import { useState, useEffect } from 'react';
import { GraduationCap } from 'lucide-react';
import { loadConfig } from '@/lib/config';
import { DEFAULT_MAINTENANCE_CONFIG, isMaintenanceActive, canBypassMaintenance } from '@/lib/maintenance';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import type { MaintenanceConfig } from '@/types';

export default function MaintenancePage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [config, setConfig] = useState<MaintenanceConfig>(DEFAULT_MAINTENANCE_CONFIG);

  useEffect(() => {
    loadConfig<MaintenanceConfig>('maintenance', DEFAULT_MAINTENANCE_CONFIG).then((r) => {
      setConfig(r.config);
    });
  }, []);

  // If user can bypass, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user && canBypassMaintenance(config, user.role)) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, user, config, router]);

  // If maintenance is no longer active, redirect to dashboard
  useEffect(() => {
    if (!isMaintenanceActive(config) && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [config, isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-[0_0_24px_rgba(251,146,60,0.3)]">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Sistem Dalam Pemeliharaan</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {config.message || 'Ma\'had Manager sedang dalam pemeliharaan terjadwal. Silakan kembali beberapa saat lagi.'}
          </p>
        </div>

        {config.estimatedEndAt && (
          <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm text-muted-foreground">
            Perkiraan selesai:{' '}
            <span className="font-medium text-foreground">
              {new Date(config.estimatedEndAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        <p className="text-xs text-muted-foreground/60">
          Admin &mdash; gunakan akun bypass untuk masuk ke sistem.
        </p>
      </div>
    </div>
  );
}
