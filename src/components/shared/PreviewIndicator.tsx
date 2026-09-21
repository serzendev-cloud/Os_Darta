'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  LogOut,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Building2,
  Home,
  Users,
  GraduationCap,
  Shield,
  Loader2,
  X,
} from 'lucide-react';

interface PersonaOption {
  role: string;
  label: string;
  scope: string;
  icon: React.ElementType;
}

const ALL_PERSONAS: PersonaOption[] = [
  { role: 'developer', label: 'Developer (Owner SaaS)', scope: 'Platform Scope', icon: Shield },
  { role: 'super_admin', label: 'Super Admin Platform', scope: 'Platform Scope', icon: Sparkles },
  { role: 'admin', label: 'Admin Pesantren', scope: 'Daruttauhid (RTV01)', icon: Building2 },
  { role: 'musyrif', label: 'Musyrif Asrama', scope: 'Daruttauhid (RTV01)', icon: Home },
  { role: 'wali', label: 'Wali Santri', scope: 'Daruttauhid (RTV01)', icon: Users },
  { role: 'santri', label: 'Santri', scope: 'Daruttauhid (RTV01)', icon: GraduationCap },
];

export function PreviewIndicator() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [switchingRole, setSwitchingRole] = useState<string | null>(null);

  if (!user || !user.email || !user.email.startsWith('preview.')) {
    return null;
  }

  const currentPersona = ALL_PERSONAS.find((p) => p.role === user.role) || {
    role: user.role,
    label: user.role.toUpperCase(),
    scope: (user as any).tenantId ? `Tenant: ${(user as any).tenantId}` : 'Platform Scope',
    icon: Shield,
  };

  const handleSwitchPersona = async (targetRole: string) => {
    if (targetRole === user.role) {
      setIsSwitchModalOpen(false);
      return;
    }

    setSwitchingRole(targetRole);
    try {
      const res = await fetch('/api/auth/role-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengganti persona');
      }

      window.location.href = data.redirectTo || '/dashboard';
    } catch (err: any) {
      alert(err.message || 'Gagal mengganti persona.');
      setSwitchingRole(null);
    }
  };

  const handleExitPreview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/role-preview/exit', {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Successfully restored Super Admin session
        window.location.href = data.redirectTo || '/dashboard/saas/preview';
        return;
      }

      // Fallback if origin ticket expired or not found
      await logout();
      router.push('/login');
      router.refresh();
    } catch {
      await logout();
      router.push('/login');
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-950 dark:text-amber-200 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm z-50">
        {/* Left: Persona & Scope Information */}
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold tracking-wider uppercase bg-amber-500/25 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">
              🧪 Mode Preview
            </span>
            <span className="text-stone-700 dark:text-stone-300">
              Melihat sebagai <strong className="font-semibold text-stone-900 dark:text-white">{currentPersona.label}</strong>
            </span>
            <span className="text-stone-400 dark:text-stone-500">|</span>
            <span className="font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded text-[11px]">
              {currentPersona.scope}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Switch Persona Button */}
          <button
            onClick={() => setIsSwitchModalOpen(true)}
            disabled={isLoading || switchingRole !== null}
            className="flex items-center gap-1 px-2.5 py-1 bg-white/80 dark:bg-stone-800/80 hover:bg-white dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-amber-500/30 rounded font-medium text-xs transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Ganti Persona</span>
            <ChevronDown className="w-3 h-3 text-stone-400" />
          </button>

          {/* Exit Preview Button */}
          <button
            onClick={handleExitPreview}
            disabled={isLoading || switchingRole !== null}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded font-medium text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Keluar Preview</span>
          </button>
        </div>
      </div>

      {/* Switch Persona Modal */}
      {isSwitchModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                  Pilih Persona Preview
                </h3>
              </div>
              <button
                onClick={() => setIsSwitchModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500 dark:text-stone-400">
              Pilih persona untuk berpindah peran secara instan tanpa perlu logout. Sesi Super Admin asal tetap tersimpan aman.
            </p>

            <div className="space-y-1.5">
              {ALL_PERSONAS.map((p) => {
                const Icon = p.icon;
                const isCurrent = p.role === user.role;
                const isSwitching = switchingRole === p.role;

                return (
                  <button
                    key={p.role}
                    onClick={() => handleSwitchPersona(p.role)}
                    disabled={isSwitching || switchingRole !== null}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'border-stone-200 dark:border-stone-800 hover:border-emerald-500/30 hover:bg-stone-50 dark:hover:bg-stone-800/50 text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-400">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-medium text-xs text-stone-900 dark:text-white">
                          {p.label}
                        </div>
                        <div className="text-[10px] text-stone-500 dark:text-stone-400">
                          {p.scope}
                        </div>
                      </div>
                    </div>
                    {isSwitching ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    ) : isCurrent ? (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        Aktif
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
