'use client';

import { useState, useEffect } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { appConfigService } from '@/lib/firebase/services/appConfig';
import { useConfig } from '@/hooks/useConfig';
import { DEFAULT_MAINTENANCE_CONFIG } from '@/lib/maintenance';
import type { MaintenanceConfig, UserRole } from '@/types';
import { Save, AlertTriangle, Clock, Shield } from 'lucide-react';

const ALL_ROLES: UserRole[] = ['admin', 'musyrif', 'wali', 'santri', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas', 'alumni'];

export function SystemTab() {
  const { config } = useConfig<MaintenanceConfig>('maintenance', DEFAULT_MAINTENANCE_CONFIG);
  const [maintenance, setMaintenance] = useState<MaintenanceConfig>(DEFAULT_MAINTENANCE_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMaintenance(config);
  }, [config]);

  const toggleBypassRole = (role: UserRole) => {
    setMaintenance((prev) => ({
      ...prev,
      bypassRoles: prev.bypassRoles.includes(role)
        ? prev.bypassRoles.filter((r) => r !== role)
        : [...prev.bypassRoles, role],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await appConfigService.update({ maintenance } as Record<string, unknown> & import('@/lib/config/types').AppConfig);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.warn('[SystemTab] Failed to save maintenance config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Save button */}
      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-xs text-emerald-600 font-medium">Tersimpan!</span>}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg transition-all hover:bg-primary/90 active:scale-95 shadow-sm disabled:opacity-70"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Toggle */}
        <PageCard title="Mode Pemeliharaan" description="Aktifkan untuk menampilkan halaman pemeliharaan ke seluruh pengguna non-admin">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Aktifkan Maintenance Mode</h4>
                  <p className="text-xs text-muted-foreground">
                    {maintenance.enabled ? 'Sedang aktif — hanya admin yang dapat mengakses.' : 'Nonaktif — sistem berjalan normal.'}
                  </p>
                </div>
              </div>
              <div
                className={`relative inline-flex h-5 w-9 items-center rounded-full cursor-pointer transition-colors ${maintenance.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                onClick={() => setMaintenance({ ...maintenance, enabled: !maintenance.enabled })}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${maintenance.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </div>

            {/* Message */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pesan Pemeliharaan</label>
              <textarea
                value={maintenance.message}
                onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
                placeholder="Contoh: Ma'had Manager sedang dalam pemeliharaan terjadwal..."
                rows={3}
                className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            {/* Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipe Pemeliharaan</label>
              <select
                value={maintenance.type}
                onChange={(e) => setMaintenance({ ...maintenance, type: e.target.value as 'full' | 'readonly' })}
                className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="full">Full — blokir semua akses non-bypass</option>
                <option value="readonly">Read-Only — data terlihat, mutasi diblokir</option>
              </select>
            </div>
          </div>
        </PageCard>

        {/* Estimated Completion + Bypass */}
        <div className="space-y-6">
          <PageCard title="Estimasi & Bypass" description="Waktu perkiraan selesai dan role bypass">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Perkiraan Selesai
                </label>
                <input
                  type="datetime-local"
                  value={maintenance.estimatedEndAt ? maintenance.estimatedEndAt.slice(0, 16) : ''}
                  onChange={(e) => setMaintenance({ ...maintenance, estimatedEndAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                  className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Role yang Dapat Bypass
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ROLES.map((role) => {
                    const isChecked = maintenance.bypassRoles.includes(role);
                    return (
                      <label key={role} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleBypassRole(role)}
                          disabled={role === 'admin'}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span className={isChecked ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                          {role.replace(/_/g, ' ')}
                          {role === 'admin' && ' (wajib)'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </PageCard>
        </div>
      </div>
    </div>
  );
}
