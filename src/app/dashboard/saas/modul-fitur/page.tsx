'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  Sliders, Sparkles, Building2, CheckCircle2, ShieldCheck, 
  CreditCard, Smartphone, HardDrive, ShoppingCart, Stethoscope, 
  Trophy, ToggleLeft, ToggleRight, Layers, Rocket, Users, Info, Check,
  Search, ChevronDown, Power, Filter, ExternalLink
} from 'lucide-react';

interface TenantFeatureMatrix {
  id: string;
  name: string;
  subdomain: string;
  location: string;
  plan: string;
  modules: {
    kesantrian: boolean;
    akademik: boolean;
    keuangan: boolean;
    eTatib: boolean;
    rfidGate: boolean;
    posKantin: boolean;
    uksKesehatan: boolean;
    tahfidzBeta: boolean;
  };
}

const mockTenantsMatrix: TenantFeatureMatrix[] = [
  {
    id: 't1',
    name: 'Ponpes Daruttahuid',
    subdomain: 'daruttahuid.madev.id',
    location: 'Malang, Jawa Timur',
    plan: 'Enterprise SaaS',
    modules: { kesantrian: true, akademik: true, keuangan: true, eTatib: true, rfidGate: true, posKantin: true, uksKesehatan: true, tahfidzBeta: true },
  },
  {
    id: 't2',
    name: 'Ponpes Al-Hikmah',
    subdomain: 'alhikmah.madev.id',
    location: 'Surabaya, Jawa Timur',
    plan: 'Pro SaaS',
    modules: { kesantrian: true, akademik: true, keuangan: true, eTatib: true, rfidGate: true, posKantin: false, uksKesehatan: true, tahfidzBeta: true },
  },
  {
    id: 't3',
    name: 'Ponpes An-Nisa',
    subdomain: 'annisa.madev.id',
    location: 'Jakarta Selatan, DKI',
    plan: 'Pro SaaS',
    modules: { kesantrian: true, akademik: true, keuangan: false, eTatib: true, rfidGate: true, posKantin: false, uksKesehatan: true, tahfidzBeta: false },
  },
  {
    id: 't4',
    name: 'Ponpes Ar-Raudah',
    subdomain: 'arraudah.madev.id',
    location: 'Bandung, Jawa Barat',
    plan: 'Starter SaaS',
    modules: { kesantrian: true, akademik: true, keuangan: false, eTatib: false, rfidGate: false, posKantin: false, uksKesehatan: false, tahfidzBeta: false },
  },
  {
    id: 't5',
    name: 'Ponpes Darul Quran',
    subdomain: 'dq.madev.id',
    location: 'Yogyakarta, DIY',
    plan: 'Trial 14 Hari',
    modules: { kesantrian: true, akademik: true, keuangan: false, eTatib: true, rfidGate: false, posKantin: false, uksKesehatan: false, tahfidzBeta: false },
  },
];

export default function SaasModulesPage() {
  const [tenantsMatrix, setTenantsMatrix] = useState<TenantFeatureMatrix[]>(mockTenantsMatrix);
  const [selectedTenantFilter, setSelectedTenantFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleToggleModuleCell = (tenantId: string, moduleKey: keyof TenantFeatureMatrix['modules']) => {
    setTenantsMatrix(prev => prev.map(t => {
      if (t.id === tenantId) {
        const nextState = !t.modules[moduleKey];
        showNotification(`Modul ${moduleKey.toUpperCase()} pada ${t.name} diubah menjadi: ${nextState ? 'AKTIF' : 'NONAKTIF'}`);
        return {
          ...t,
          modules: {
            ...t.modules,
            [moduleKey]: nextState
          }
        };
      }
      return t;
    }));
  };

  const filteredMatrix = tenantsMatrix.filter(t => {
    const matchesTenant = selectedTenantFilter === 'all' || t.id === selectedTenantFilter;
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.subdomain.toLowerCase().includes(search.toLowerCase());
    return matchesTenant && matchesSearch;
  });

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
            <span>Feature Flags & Per-Tenant Module Matrix</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Matriks Pemantauan Modul Fitur Aktif Per-Pesantren
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-3xl leading-relaxed">
            Pantau secara menyeluruh modul mana saja yang sedang <strong className="text-white">AKTIF atau NONAKTIF</strong> di setiap pesantren. Klik langsung pada sakelar di tabel untuk mengaktifkan atau menonaktifkan modul tertentu.
          </p>
        </div>
      </div>

      {/* SECTION 1: MATRIKS FITUR PER-PESANTREN (MAIN HIGHLIGHT) */}
      <PageCard
        title="Matriks Pemantauan Modul Fitur Per-Pesantren (Live Interactive Matrix)"
        description="Filter berdasarkan pesantren dan klik sakelar untuk mengaktifkan/menonaktifkan modul fitur secara spesifik"
      >
        {/* Dropdown & Search Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Filter Pesantren Specific (Dropdown)
              </label>
              <div className="relative">
                <select
                  value={selectedTenantFilter}
                  onChange={(e) => setSelectedTenantFilter(e.target.value)}
                  className="w-full md:w-80 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer shadow-sm pr-8"
                >
                  <option value="all">Semua Pesantren ({tenantsMatrix.length} Lembaga)</option>
                  {tenantsMatrix.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.plan})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pesantren, subdomain..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 min-w-[200px]">Nama Pesantren</th>
                <th className="py-3.5 px-3 text-center">Kesantrian</th>
                <th className="py-3.5 px-3 text-center">Akademik</th>
                <th className="py-3.5 px-3 text-center">SPP (Flip)</th>
                <th className="py-3.5 px-3 text-center">E-Tatib</th>
                <th className="py-3.5 px-3 text-center">RFID Gate</th>
                <th className="py-3.5 px-3 text-center">POS Kantin</th>
                <th className="py-3.5 px-3 text-center">UKS</th>
                <th className="py-3.5 px-3 text-center">Tahfidz (Beta)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200 font-medium">
              {filteredMatrix.map((t) => (
                <tr key={t.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition-colors">
                  <td className="py-4 px-4 border-r border-stone-100 dark:border-stone-800">
                    <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                      <span>{t.name}</span>
                      <a href={`https://${t.subdomain}`} target="_blank" rel="noreferrer" className="text-emerald-600">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-[11px] text-stone-400 font-mono">{t.subdomain}</div>
                    <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {t.plan}
                    </span>
                  </td>

                  {/* 1. Kesantrian */}
                  <td className="py-4 px-3 text-center border-r border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => handleToggleModuleCell(t.id, 'kesantrian')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm active:scale-95 ${
                        t.modules.kesantrian ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {t.modules.kesantrian ? 'ON' : 'OFF'}
                    </button>
                  </td>

                  {/* 2. Akademik */}
                  <td className="py-4 px-3 text-center border-r border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => handleToggleModuleCell(t.id, 'akademik')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm active:scale-95 ${
                        t.modules.akademik ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {t.modules.akademik ? 'ON' : 'OFF'}
                    </button>
                  </td>

                  {/* 3. Keuangan (Flip) */}
                  <td className="py-4 px-3 text-center border-r border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => handleToggleModuleCell(t.id, 'keuangan')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm active:scale-95 ${
                        t.modules.keuangan ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {t.modules.keuangan ? 'ON' : 'OFF'}
                    </button>
                  </td>

                  {/* 4. E-Tatib */}
                  <td className="py-4 px-3 text-center border-r border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => handleToggleModuleCell(t.id, 'eTatib')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm active:scale-95 ${
                        t.modules.eTatib ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {t.modules.eTatib ? 'ON' : 'OFF'}
                    </button>
                  </td>

                  {/* 5. RFID Gate */}
                  <td className="py-4 px-3 text-center border-r border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => handleToggleModuleCell(t.id, 'rfidGate')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm active:scale-95 ${
                        t.modules.rfidGate ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {t.modules.rfidGate ? 'ON' : 'OFF'}
                    </button>
                  </td>

                  {/* 6. POS Kantin */}
                  <td className="py-4 px-3 text-center border-r border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => handleToggleModuleCell(t.id, 'posKantin')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm active:scale-95 ${
                        t.modules.posKantin ? 'bg-amber-500 text-white' : 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {t.modules.posKantin ? 'ON' : 'OFF'}
                    </button>
                  </td>

                  {/* 7. UKS Kesehatan */}
                  <td className="py-4 px-3 text-center border-r border-stone-100 dark:border-stone-800">
                    <button
                      type="button"
                      onClick={() => handleToggleModuleCell(t.id, 'uksKesehatan')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm active:scale-95 ${
                        t.modules.uksKesehatan ? 'bg-rose-500 text-white' : 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {t.modules.uksKesehatan ? 'ON' : 'OFF'}
                    </button>
                  </td>

                  {/* 8. Tahfidz Beta */}
                  <td className="py-4 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleModuleCell(t.id, 'tahfidzBeta')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm active:scale-95 ${
                        t.modules.tahfidzBeta ? 'bg-purple-600 text-white' : 'bg-stone-200 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                      }`}
                    >
                      {t.modules.tahfidzBeta ? 'BETA ON' : 'OFF'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>

      {/* SECTION 2: KATALOG PUSTAKA MODUL GLOBAL */}
      <PageCard
        title="Pustaka Modul Inti Platform Madev"
        description="Ringkasan definisi dan jumlah pesantren yang menggunakan masing-masing modul"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
            <h4 className="font-bold text-stone-900 dark:text-white text-xs">1. Modul Kesantrian & Asrama</h4>
            <p className="text-xs text-stone-500">Manajemen data santri, wali santri, kamar asrama, & perizinan (Digunakan oleh 5/5 Pesantren)</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
            <h4 className="font-bold text-stone-900 dark:text-white text-xs">2. Modul Akademik & E-Rapor</h4>
            <p className="text-xs text-stone-500">Jadwal pelajaran formal & diniyah, presensi kelas, & e-rapor santri (Digunakan oleh 5/5 Pesantren)</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
            <h4 className="font-bold text-stone-900 dark:text-white text-xs">3. Modul Keuangan SPP (Flip Payment)</h4>
            <p className="text-xs text-stone-500">Tagihan otomatis & payment gateway transfer bank/VA (Digunakan oleh 2/5 Pesantren)</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1">
            <h4 className="font-bold text-stone-900 dark:text-white text-xs">4. Modul E-Tatib & Point Pelanggaran</h4>
            <p className="text-xs text-stone-500">Pencatatan pelanggaran, poin kedisiplinan, & sidang pengasuhan (Digunakan oleh 4/5 Pesantren)</p>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
