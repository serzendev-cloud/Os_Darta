'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Shield,
  Building2,
  Home,
  Users,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

interface PersonaCard {
  role: string;
  title: string;
  badge: string;
  badgeColor: string;
  scope: string;
  description: string;
  fixtureInfo: string;
  icon: React.ElementType;
}

const PERSONA_CARDS: PersonaCard[] = [
  {
    role: 'developer',
    title: 'Developer / Owner',
    badge: '👑 Platform Owner',
    badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    scope: 'Platform Scope (Cross-Tenant)',
    description:
      'Akses tertinggi untuk konfigurasi sistem, API gateway, infrastruktur cloud, dan pemantauan arsitektur dasar tanpa restriksi.',
    fixtureInfo: 'Platform Configuration & System Health',
    icon: Shield,
  },
  {
    role: 'super_admin',
    title: 'Super Admin Platform',
    badge: '🛡 Super Admin',
    badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
    scope: 'Platform Scope (Cross-Tenant)',
    description:
      'Konsol pengawasan seluruh pesantren/tenant, penetapan kuota paket billing, approval langganan, dan manajemen audit log global.',
    fixtureInfo: 'Cross-Tenant SaaS Oversight',
    icon: Sparkles,
  },
  {
    role: 'admin',
    title: 'Admin Pesantren',
    badge: '🏫 Tenant Admin',
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30',
    scope: 'Tenant: Daruttauhid (RTV01)',
    description:
      'Operasional lengkap satu pesantren: struktur kurikulum madrasah, data santri, asrama, jadwal guru, dan tagihan keuangan pondok.',
    fixtureInfo: 'Tenant ID: t_1789172137858_9g7lm',
    icon: Building2,
  },
  {
    role: 'musyrif',
    title: 'Musyrif Asrama',
    badge: '🕌 Musyrif',
    badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
    scope: 'Tenant: Daruttauhid (RTV01)',
    description:
      'Pengawasan asrama harian, evaluasi adab santri, pencatatan poin kedisiplinan, izin kepulangan, dan pemantauan kamar santri.',
    fixtureInfo: 'Asrama: Asrama Preview Al-Fatih',
    icon: Home,
  },
  {
    role: 'wali',
    title: 'Wali Santri',
    badge: '👨‍👩‍👧 Wali Santri',
    badgeColor: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/30',
    scope: 'Tenant: Daruttauhid (RTV01)',
    description:
      'Portal terisolasi orang tua: mutabaah perkembangan ibadah santri asuh, saldo dompet santri, izin berobat UKS, dan tagihan SPP.',
    fixtureInfo: 'Santri Asuh: Santri Preview Al-Fatih',
    icon: Users,
  },
  {
    role: 'santri',
    title: 'Santri',
    badge: '🎓 Santri',
    badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30',
    scope: 'Tenant: Daruttauhid (RTV01)',
    description:
      'Portal santri mandiri: jurnal harian tahfidz (hifzh), jadwal pelajaran kelas madrasah, kartu santri digital, dan tugas kurikulum.',
    fixtureInfo: 'NIS: PREV001 (Santri Preview Al-Fatih)',
    icon: GraduationCap,
  },
];

export default function SaasPreviewPlatformPage() {
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuthStore();

  const handleStartPreview = async (role: string) => {
    setError(null);
    setLoadingRole(role);

    try {
      const res = await fetch('/api/auth/role-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal memulai sesi preview.');
      }

      // Hard redirect to dashboard to re-initialize SSR cookies & tenant context
      window.location.href = data.redirectTo || '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memulai preview.');
      setLoadingRole(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-950 to-stone-900 p-6 md:p-8 text-white shadow-xl border border-emerald-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pusat Kendali Pengujian &amp; Evaluasi Persona (Permanent Tooling)</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
            🧪 Preview Platform Control Center
          </h1>
          <p className="text-emerald-100/80 text-sm leading-relaxed">
            Eksplorasi dan verifikasi antarmuka seluruh peran ekosistem pesantren secara langsung dari
            konsol Super Admin. Perpindahan persona menggunakan sesi terkontrol dengan preservasi identitas
            asli Super Admin.
          </p>
        </div>
      </div>

      {/* Security & Context Notice */}
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Tata Kelola Keamanan &amp; Integritas Multi-Tenant (EEOS):</p>
          <ul className="list-disc list-inside space-y-0.5 text-amber-800 dark:text-amber-300">
            <li>Identitas asli Super Admin ({user?.email || 'Aktif'}) tetap terjaga dan tidak dimutasi di database.</li>
            <li>Tiket sesi asal diterbitkan secara aman (Opaque Origin Ticket) untuk pemulihan instan tanpa relogin.</li>
            <li>Data domain preview terisolasi penuh pada tenant verifikasi (Daruttauhid / RTV01) tanpa mengganggu data operasional lain.</li>
          </ul>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of 6 Persona Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PERSONA_CARDS.map((persona) => {
          const Icon = persona.icon;
          const isLoading = loadingRole === persona.role;

          return (
            <div
              key={persona.role}
              className="flex flex-col justify-between rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-sm hover:shadow-md transition-all hover:border-emerald-500/40 relative overflow-hidden group"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300 group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                        {persona.title}
                      </h3>
                      <span className="text-[11px] text-stone-500 dark:text-stone-400">
                        {persona.scope}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${persona.badgeColor}`}
                  >
                    {persona.badge}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                  {persona.description}
                </p>

                {/* Fixture Context */}
                <div className="bg-stone-50 dark:bg-stone-950/60 rounded-lg p-2.5 border border-stone-100 dark:border-stone-800/80">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 block mb-0.5">
                    Fixture Terhubung:
                  </span>
                  <span className="text-xs font-mono font-medium text-stone-700 dark:text-stone-300">
                    {persona.fixtureInfo}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={() => handleStartPreview(persona.role)}
                  disabled={loadingRole !== null}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengaktifkan Sesi...</span>
                    </>
                  ) : (
                    <>
                      <span>Mulai Preview {persona.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
