'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  Sliders, Sparkles, Building2, CheckCircle2, ShieldCheck, 
  CreditCard, Smartphone, HardDrive, ShoppingCart, Stethoscope, 
  Trophy, ToggleLeft, ToggleRight, Layers, Rocket, Users, Info, Check,
  ChevronDown, Power, XCircle, Search, ExternalLink, HelpCircle
} from 'lucide-react';

interface TenantModulesConfig {
  id: string;
  name: string;
  subdomain: string;
  location: string;
  plan: string;
  modules: Record<string, boolean>;
}

interface ModuleCatalogItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: any;
  isBeta?: boolean;
}

const modulesCatalog: ModuleCatalogItem[] = [
  { id: 'm1', name: 'Kesantrian & Asrama', category: 'Core Operational', description: 'Manajemen data santri, wali santri, kamar asrama, & perizinan keluar/masuk', icon: Users },
  { id: 'm2', name: 'Akademik & E-Rapor', category: 'Core Academic', description: 'Jadwal pelajaran formal & diniyah, presensi kelas, & e-rapor santri', icon: Layers },
  { id: 'm3', name: 'Keuangan & Auto SPP (Flip)', category: 'Finance Gateway', description: 'Invois gabungan SPP & webhook callback pembayaran otomatis via Flip for Business', icon: CreditCard },
  { id: 'm4', name: 'E-Tatib & Point Pelanggaran', category: 'Governance', description: 'Pencatatan kasus disiplin, poin pelanggaran, & sidang dewan pengasuh', icon: ShieldCheck },
  { id: 'm5', name: 'Absensi RFID & Gate Checkpoint', category: 'Hardware/IoT', description: 'Presensi digital tap KTA RFID di gerbang pesantren & pintu asrama', icon: Smartphone },
  { id: 'm6', name: 'POS Kantin Digital & Wallet Santri', category: 'Finance/IoT', description: 'Kasir kantin cashless, top-up saldo RFID, & limit belanja harian santri', icon: ShoppingCart },
  { id: 'm7', name: 'UKS & Rekam Medis Santri', category: 'Health & Care', description: 'Pencatatan santri sakit, rekam medis UKS, & rujukan rumah sakit', icon: Stethoscope },
  { id: 'm8', name: 'Modul Tahfidz & Ziyadah (Beta)', category: 'Special Feature', description: 'Monitoring hafalan Quran, ziyadah, murojaah & setoran harian santri', icon: Trophy, isBeta: true },
];

const mockTenantsModulesData: Record<string, TenantModulesConfig> = {
  t1: {
    id: 't1',
    name: 'Ponpes Daruttahuid (Malang)',
    subdomain: 'daruttahuid.madev.id',
    location: 'Malang, Jawa Timur',
    plan: 'Enterprise SaaS',
    modules: { m1: true, m2: true, m3: true, m4: true, m5: true, m6: true, m7: true, m8: true },
  },
  t2: {
    id: 't2',
    name: 'Ponpes Al-Hikmah (Surabaya)',
    subdomain: 'alhikmah.madev.id',
    location: 'Surabaya, Jawa Timur',
    plan: 'Pro SaaS',
    modules: { m1: true, m2: true, m3: true, m4: true, m5: true, m6: false, m7: true, m8: true },
  },
  t3: {
    id: 't3',
    name: 'Ponpes An-Nisa (Jakarta)',
    subdomain: 'annisa.madev.id',
    location: 'Jakarta Selatan, DKI',
    plan: 'Pro SaaS',
    modules: { m1: true, m2: true, m3: false, m4: true, m5: true, m6: false, m7: true, m8: false },
  },
  t4: {
    id: 't4',
    name: 'Ponpes Ar-Raudah (Bandung)',
    subdomain: 'arraudah.madev.id',
    location: 'Bandung, Jawa Barat',
    plan: 'Starter SaaS',
    modules: { m1: true, m2: true, m3: false, m4: false, m5: false, m6: false, m7: false, m8: false },
  },
  t5: {
    id: 't5',
    name: 'Ponpes Darul Quran (Yogyakarta)',
    subdomain: 'dq.madev.id',
    location: 'Yogyakarta, DIY',
    plan: 'Trial 14 Hari',
    modules: { m1: true, m2: true, m3: false, m4: true, m5: false, m6: false, m7: false, m8: false },
  },
};

export default function SaasModulesPage() {
  const [tenantsMap, setTenantsMap] = useState<Record<string, TenantModulesConfig>>(mockTenantsModulesData);
  const [selectedTenantId, setSelectedTenantId] = useState('t1');
  const [toast, setToast] = useState('');

  const currentTenant = tenantsMap[selectedTenantId] || tenantsMap['t1'];

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleToggleModule = (moduleId: string, moduleName: string) => {
    const currentState = currentTenant.modules[moduleId] ?? false;
    const nextState = !currentState;

    setTenantsMap(prev => ({
      ...prev,
      [selectedTenantId]: {
        ...prev[selectedTenantId],
        modules: {
          ...prev[selectedTenantId].modules,
          [moduleId]: nextState
        }
      }
    }));

    showNotification(
      nextState
        ? `Modul "${moduleName}" BERHASIL DIAKTIFKAN untuk ${currentTenant.name}!`
        : `Modul "${moduleName}" DINONAKTIFKAN untuk ${currentTenant.name}.`
    );
  };

  // Calculate active modules count for current tenant
  const activeCount = Object.values(currentTenant.modules).filter(Boolean).length;
  const totalCount = modulesCatalog.length;

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
            <span>Feature Flags Engine & Per-Tenant Control</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Pengaturan & Monitoring Fitur Aktif Per-Pesantren
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-3xl leading-relaxed">
            Pilih pesantren dari dropdown di bawah untuk melihat status <strong className="text-white">AKTIF/NONAKTIF</strong> seluruh modul dan mengaktifkan/menonaktifkan fitur secara langsung dengan sakelar toggle.
          </p>
        </div>
      </div>

      <PageCard
        title="Pusat Kontrol Fitur & Modul Tenant"
        description="Pilih pesantren target di bawah ini untuk mengelola distribusi modul fiturnya"
      >
        {/* Dropdown Selector Pesantren */}
        <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 mb-8 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-stone-900 dark:text-white font-extrabold text-xs uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>1. PILIH PESANTREN TARGET (TARGET TENANT SELECTOR)</span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
              {activeCount} / {totalCount} Modul Aktif
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pt-1">
            <div className="relative flex-1 max-w-md">
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-stone-900 border-2 border-emerald-500/40 text-xs font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-md pr-10 appearance-none"
              >
                {Object.values(tenantsMap).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.plan} ({t.subdomain})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-5 h-5 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none font-bold" />
            </div>

            {/* Tenant Info Pill */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs">
              <div>
                <span className="text-stone-400 text-[10px] uppercase font-semibold">Pesantren Terpilih:</span>
                <div className="font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                  <span>{currentTenant.name}</span>
                  <span className="text-stone-400 font-mono text-[11px]">({currentTenant.subdomain})</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200">
                {currentTenant.plan}
              </span>
            </div>
          </div>
        </div>

        {/* Header Section for Modules Catalog below */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-white">
              Status Fitur & Modul Khusus: <span className="text-emerald-700 dark:text-emerald-400">{currentTenant.name}</span>
            </h3>
            <p className="text-xs text-stone-500">
              Gunakan sakelar saklar di setiap kartu di bawah untuk mengaktifkan atau menonaktifkan fitur bagi pesantren ini.
            </p>
          </div>
        </div>

        {/* Modules Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modulesCatalog.map((m) => {
            const isActive = currentTenant.modules[m.id] ?? false;
            const IconComponent = m.icon;

            return (
              <div
                key={m.id}
                className={`p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  isActive
                    ? 'bg-white dark:bg-stone-900 border-emerald-500/40 shadow-md shadow-emerald-500/5'
                    : 'bg-stone-50/60 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-80'
                }`}
              >
                {/* Top Card Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-2xl ${isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-stone-200 dark:bg-stone-800 text-stone-400'}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          {m.category}
                        </span>
                        <h4 className="text-sm font-extrabold text-stone-900 dark:text-white flex items-center gap-1.5">
                          <span>{m.name}</span>
                          {m.isBeta && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300">
                              BETA
                            </span>
                          )}
                        </h4>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isActive 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300' 
                        : 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400'
                    }`}>
                      {isActive ? '🟢 AKTIF' : '🔴 NONAKTIF'}
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed pl-1">
                    {m.description}
                  </p>
                </div>

                {/* Bottom Toggle Bar inside Card */}
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div className="text-[11px] font-semibold text-stone-500">
                    Status di <strong className="text-stone-800 dark:text-stone-200">{currentTenant.name}</strong>:
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleModule(m.id, m.name)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                      isActive
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-stone-300 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-400'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isActive ? 'Matikan Modul' : 'Aktifkan Modul'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </PageCard>
    </div>
  );
}
