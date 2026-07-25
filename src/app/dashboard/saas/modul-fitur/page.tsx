'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  Sliders, Sparkles, Building2, CheckCircle2, ShieldCheck, 
  CreditCard, Smartphone, HardDrive, ShoppingCart, Stethoscope, 
  Trophy, ToggleLeft, ToggleRight, Layers, Rocket, Users, Info, Check
} from 'lucide-react';

interface ModuleDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'stable' | 'beta' | 'experimental';
  activeTenantsCount: number;
}

const mockModulesList: ModuleDefinition[] = [
  { id: 'm1', name: 'Kesantrian & Asrama', category: 'Core', description: 'Manajemen data santri, wali santri, kamar asrama, & perizinan', status: 'stable', activeTenantsCount: 8 },
  { id: 'm2', name: 'Akademik & Nilai', category: 'Core', description: 'Jadwal pelajaran, mata pelajaran formal & diniyah, serta e-rapor', status: 'stable', activeTenantsCount: 8 },
  { id: 'm3', name: 'Keuangan & Auto SPP (Flip)', category: 'Finance', description: 'Invois gabungan SPP & webhook callback pembayaran otomatis', status: 'stable', activeTenantsCount: 6 },
  { id: 'm4', name: 'E-Tatib & Point Pelanggaran', category: 'Governance', description: 'Pencatatan kasus disiplin, poin pelanggaran, & sidang dewan pengasuh', status: 'stable', activeTenantsCount: 7 },
  { id: 'm5', name: 'Absensi RFID & Gate Checkpoint', category: 'Hardware/IoT', description: 'Presensi digital tap RFID di gerbang pesantren & asrama', status: 'stable', activeTenantsCount: 5 },
  { id: 'm6', name: 'POS Kantin Digital & Wallet Santri', category: 'Finance/IoT', description: 'Kasir kantin cashless, top-up saldo RFID, & limit belanja harian', status: 'stable', activeTenantsCount: 4 },
  { id: 'm7', name: 'UKS & Rekam Medis Santri', category: 'Health', description: 'Pencatatan santri sakit, rekam medis UKS, & rujukan rumah sakit', status: 'stable', activeTenantsCount: 6 },
  { id: 'm8', name: 'Modul Tahfidz & Ziyadah (Beta)', category: 'Academic', description: 'Monitoring hafalan Quran, ziyadah, murojaah & setoran harian santri', status: 'beta', activeTenantsCount: 3 },
];

export default function SaasModulesPage() {
  const [modules, setModules] = useState<ModuleDefinition[]>(mockModulesList);
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('all');
  const [toast, setToast] = useState('');

  const [betaRolloutTenants, setBetaRolloutTenants] = useState<string[]>([
    'Ponpes Daruttahuid (Malang)',
    'Ponpes Al-Hikmah (Surabaya)',
    'Ponpes An-Nisa (Jakarta)',
  ]);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleToggleBetaTenant = (tenantName: string) => {
    if (betaRolloutTenants.includes(tenantName)) {
      setBetaRolloutTenants(betaRolloutTenants.filter(t => t !== tenantName));
      showNotification(`Modul Tahfidz Beta ditutup untuk ${tenantName}`);
    } else {
      setBetaRolloutTenants([...betaRolloutTenants, tenantName]);
      showNotification(`Modul Tahfidz Beta diaktifkan (Rollout) untuk ${tenantName}`);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-700 text-white font-medium text-xs flex items-center justify-between shadow-xl animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast('')} className="text-white/80 hover:text-white">&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Sliders className="w-3.5 h-3.5" />
            <span>Pillar 3 — Feature Flags & Module Distribution</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Manajemen Modul Fitur & Rollout Versi Rilis
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-2xl">
            Kelola ketersediaan modul utama, penentuan feature flags per-paket, dan skenario peluncuran bertahap (Beta Rollout) ke pesantren pilihan.
          </p>
        </div>
      </div>

      {/* Section 1: Daftar Modul Utama & Status Release */}
      <PageCard
        title="Katalog Modul Utama Platform Madev"
        description="Daftar modul fitur inti yang terdistribusi di seluruh ekosistem SaaS"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((m) => (
            <div key={m.id} className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col justify-between space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      {m.category}
                    </span>
                    {m.status === 'beta' && (
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 uppercase tracking-wider animate-pulse flex items-center gap-1">
                        <Rocket className="w-3 h-3" /> BETA ROLLOUT
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white pt-1">{m.name}</h3>
                  <p className="text-xs text-stone-500">{m.description}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                <span className="font-semibold">Digunakan oleh: <strong className="text-emerald-700 dark:text-emerald-400">{m.activeTenantsCount} Pesantren</strong></span>
                <span className="text-[10px] font-mono bg-stone-200 dark:bg-stone-700 px-2 py-0.5 rounded">ID: {m.id}</span>
              </div>
            </div>
          ))}
        </div>
      </PageCard>

      {/* Section 2: Beta Rollout Test System (Peluncuran Bertahap) */}
      <PageCard
        title="Versi Rilis Bertahap (Beta Rollout Tester)"
        description="Uji coba modul fitur baru (misal: Modul Tahfidz & Ziyadah) ke 5 pesantren penguji awal sebelum diluncurkan secara publik"
      >
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 dark:text-white text-sm">Target Beta Tester: Modul Tahfidz Quran Digital</h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Pilih pesantren yang berhak mendapatkan akses awal modul Tahfidz sebelum dibuka untuk seluruh tenant:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {[
              'Ponpes Daruttahuid (Malang)',
              'Ponpes Al-Hikmah (Surabaya)',
              'Ponpes An-Nisa (Jakarta)',
              'Ponpes Ar-Raudah (Bandung)',
              'Ponpes Darul Quran (Yogyakarta)',
            ].map((name) => {
              const isEnabled = betaRolloutTenants.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleToggleBetaTenant(name)}
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                    isEnabled
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]'
                      : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>{name}</span>
                  </div>
                  {isEnabled ? <Check className="w-4 h-4 text-white font-extrabold" /> : <span className="text-[10px] opacity-60">Off</span>}
                </button>
              );
            })}
          </div>
        </div>
      </PageCard>
    </div>
  );
}
