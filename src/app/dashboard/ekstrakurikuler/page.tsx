'use client';

import { useState, useEffect } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  Trophy, Plus, Search, Users, UserCheck, Calendar, MapPin, 
  CheckCircle2, Trash2, Edit3, Sparkles, Filter, Shield, Award, Clock
} from 'lucide-react';

export interface EkstrakurikulerItem {
  id: string;
  code: string;
  name: string;
  category: 'wajib' | 'pilihan';
  pembina: string;
  jadwal: string;
  lokasi: string;
  totalSantri: number;
  kuotaMax: number;
  status: 'active' | 'inactive';
  iconBg: string;
  description: string;
}

const defaultEkskulList: EkstrakurikulerItem[] = [
  {
    id: 'ekskul-1',
    code: 'EKS-PANAHAN',
    name: 'Panahan Sunnah',
    category: 'pilihan',
    pembina: 'Ust. Hamzah As-Sidq',
    jadwal: 'Jumat, 15.30 - 17.00 WIB',
    lokasi: 'Lapangan Utama Ma\'had',
    totalSantri: 32,
    kuotaMax: 40,
    status: 'active',
    iconBg: 'bg-amber-600',
    description: 'Pelatihan olahraga sunnah memanah tingkat dasar & mahir dengan pengawasan standar keamanan.',
  },
  {
    id: 'ekskul-2',
    code: 'EKS-HADROH',
    name: 'Seni Hadroh & Sholawat',
    category: 'pilihan',
    pembina: 'Ust. Muhammad Ali',
    jadwal: 'Sabtu, 20.00 - 22.00 WIB',
    lokasi: 'Aula Utama Pesantren',
    totalSantri: 25,
    kuotaMax: 30,
    status: 'active',
    iconBg: 'bg-emerald-600',
    description: 'Pengembangan seni tabuh rebana, vokal sholawat, dan apresiasi seni islami.',
  },
  {
    id: 'ekskul-3',
    code: 'EKS-SILAT',
    name: 'Pencak Silat Pagar Nusa',
    category: 'wajib',
    pembina: 'Ust. Zulkifli, S.Pd.',
    jadwal: 'Ahad, 06.00 - 08.00 WIB',
    lokasi: 'Halaman Kompleks Asrama',
    totalSantri: 120,
    kuotaMax: 150,
    status: 'active',
    iconBg: 'bg-rose-600',
    description: 'Seni bela diri fisik & mental santri untuk ketahanan fisik dan kedisiplinan.',
  },
  {
    id: 'ekskul-4',
    code: 'EKS-QIROAH',
    name: 'Qiro\'ah & Seni Naghom Al-Qur\'an',
    category: 'pilihan',
    pembina: 'Ust. H. Syamsuri, S.Ag.',
    jadwal: 'Selasa, 16.00 - 17.30 WIB',
    lokasi: 'Masjid Jami\' Lantai 2',
    totalSantri: 18,
    kuotaMax: 25,
    status: 'active',
    iconBg: 'bg-indigo-600',
    description: 'Pelatihan irama naghom maqomat Qur\'ani (Bayati, Shoba, Hijaz, Nahawand).',
  },
  {
    id: 'ekskul-5',
    code: 'EKS-BAHASA',
    name: 'Arabic & English Club',
    category: 'wajib',
    pembina: 'Ust. Fahrur Razi, M.A.',
    jadwal: 'Rabu, 16.00 - 17.15 WIB',
    lokasi: 'Gedung Bahasa / Lab Bahasa',
    totalSantri: 85,
    kuotaMax: 100,
    status: 'active',
    iconBg: 'bg-blue-600',
    description: 'Klub pidato, mufrodat, dan debat bahasa Arab-Inggris untuk kecakapan diplomasi santri.',
  },
];

const STORAGE_KEY = 'mahad_ekstrakurikuler_list_v1';

export default function MasterEkstrakurikulerPage() {
  const [ekskulList, setEkskulList] = useState<EkstrakurikulerItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'wajib' | 'pilihan'>('all');
  const [toast, setToast] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EkstrakurikulerItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<'wajib' | 'pilihan'>('pilihan');
  const [formPembina, setFormPembina] = useState('');
  const [formJadwal, setFormJadwal] = useState('');
  const [formLokasi, setFormLokasi] = useState('');
  const [formKuota, setFormKuota] = useState(30);
  const [formDesc, setFormDesc] = useState('');
  const [formIconBg, setFormIconBg] = useState('bg-amber-600');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEkskulList(JSON.parse(stored));
      } else {
        setEkskulList(defaultEkskulList);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultEkskulList));
      }
    } catch {
      setEkskulList(defaultEkskulList);
    }
  }, []);

  const saveList = (updated: EkstrakurikulerItem[]) => {
    setEkskulList(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleOpenModal = (item?: EkstrakurikulerItem) => {
    if (item) {
      setEditingItem(item);
      setFormName(item.name);
      setFormCode(item.code);
      setFormCategory(item.category);
      setFormPembina(item.pembina);
      setFormJadwal(item.jadwal);
      setFormLokasi(item.lokasi);
      setFormKuota(item.kuotaMax);
      setFormDesc(item.description);
      setFormIconBg(item.iconBg);
    } else {
      setEditingItem(null);
      setFormName('');
      setFormCode(`EKS-${Date.now().toString().slice(-4)}`);
      setFormCategory('pilihan');
      setFormPembina('Ust. Ahmad Fauzi');
      setFormJadwal('Sabtu, 16.00 WIB');
      setFormLokasi('Aula Pesantren');
      setFormKuota(30);
      setFormDesc('');
      setFormIconBg('bg-amber-600');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCode) return;

    if (editingItem) {
      const updated = ekskulList.map(item => 
        item.id === editingItem.id 
          ? {
              ...item,
              name: formName,
              code: formCode.toUpperCase(),
              category: formCategory,
              pembina: formPembina,
              jadwal: formJadwal,
              lokasi: formLokasi,
              kuotaMax: Number(formKuota),
              description: formDesc,
              iconBg: formIconBg,
            }
          : item
      );
      saveList(updated);
      showNotification(`Ekstrakurikuler "${formName}" BERHASIL DIPERBARUI!`);
    } else {
      const newItem: EkstrakurikulerItem = {
        id: `ekskul-${Date.now()}`,
        code: formCode.toUpperCase(),
        name: formName,
        category: formCategory,
        pembina: formPembina,
        jadwal: formJadwal,
        lokasi: formLokasi,
        totalSantri: 0,
        kuotaMax: Number(formKuota),
        status: 'active',
        iconBg: formIconBg,
        description: formDesc || `Kegiatan ekstrakurikuler ${formName}`,
      };
      const updated = [...ekskulList, newItem];
      saveList(updated);
      showNotification(`Ekstrakurikuler Baru "${formName}" BERHASIL DITAMBAHKAN!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus kegiatan Ekstrakurikuler "${name}"?`)) {
      const updated = ekskulList.filter(item => item.id !== id);
      saveList(updated);
      showNotification(`Ekstrakurikuler "${name}" telah dihapus.`);
    }
  };

  const filteredList = ekskulList.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                        item.code.toLowerCase().includes(search.toLowerCase()) ||
                        item.pembina.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || item.category === filterCategory;
    return matchSearch && matchCat;
  });

  const totalSantriIkut = ekskulList.reduce((acc, curr) => acc + curr.totalSantri, 0);

  return (
    <div className="space-y-6 font-sans pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-700 text-white font-medium text-xs flex items-center justify-between shadow-xl animate-bounce sticky top-4 z-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast('')} className="text-white/80 hover:text-white font-bold">&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Pusat Kegiatan & Bakat Santri</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Master Ekstrakurikuler & Pengembangan Bakat
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-3xl leading-relaxed">
            Kelola kegiatan minat & bakat santri (Panahan, Hadroh, Pencak Silat, Qiro'ah, Bahasa, dll). Atur pembina ustaz pengampu, jadwal latihan mingguan, lokasi, dan kuota keanggotaan santri.
          </p>
        </div>
      </div>

      {/* Metrics Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-white">{ekskulList.length}</div>
            <div className="text-xs font-semibold text-stone-500">Total Kegiatan Ekskul</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-white">{totalSantriIkut}</div>
            <div className="text-xs font-semibold text-stone-500">Santri Terdaftar</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-white">
              {new Set(ekskulList.map(e => e.pembina)).size}
            </div>
            <div className="text-xs font-semibold text-stone-500">Ustaz Pembina</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-white">
              {ekskulList.filter(e => e.category === 'wajib').length}
            </div>
            <div className="text-xs font-semibold text-stone-500">Ekskul Wajib</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <PageCard
        title="Pustaka Ekstrakurikuler Active"
        description="Daftar kegiatan pengembangan minat & bakat santri Ma'had."
      >
        {/* Controls Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ekskul, kode, atau pembina..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterCategory === 'all'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterCategory('wajib')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterCategory === 'wajib'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Wajib
              </button>
              <button
                onClick={() => setFilterCategory('pilihan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterCategory === 'pilihan'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                Pilihan
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Ekstrakurikuler Baru</span>
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${item.iconBg} text-white flex items-center justify-center font-bold shadow-md`}>
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                        {item.code}
                      </span>
                      <h3 className="text-sm font-extrabold text-stone-900 dark:text-white leading-tight">
                        {item.name}
                      </h3>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    item.category === 'wajib'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                  }`}>
                    {item.category === 'wajib' ? '🔴 WAJIB' : '🟢 PILIHAN'}
                  </span>
                </div>

                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                {/* Details Box */}
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700 text-xs space-y-2">
                  <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                      <span>Pembina:</span>
                    </div>
                    <span className="font-bold">{item.pembina}</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>Jadwal:</span>
                    </div>
                    <span className="font-bold text-[11px]">{item.jadwal}</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Lokasi:</span>
                    </div>
                    <span className="font-bold text-[11px]">{item.lokasi}</span>
                  </div>

                  <div className="pt-1.5 border-t border-stone-200/50 dark:border-stone-700 flex items-center justify-between text-stone-700 dark:text-stone-300">
                    <span className="text-[10px] font-bold text-stone-400 uppercase">Kuota Santri:</span>
                    <span className="font-extrabold text-amber-600 dark:text-amber-400">
                      {item.totalSantri} / {item.kuotaMax} Santri
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenModal(item)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(item.id, item.name)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white font-bold text-xs transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </PageCard>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-amber-600">
                <Trophy className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                  {editingItem ? `Edit Ekstrakurikuler: ${editingItem.name}` : 'Tambah Ekstrakurikuler Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Ekstrakurikuler:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="misal: Panahan Sunnah, Hadroh, Silat..."
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Kode ID:
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-mono font-bold text-stone-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Kategori Sifat:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as 'wajib' | 'pilihan')}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white"
                  >
                    <option value="pilihan">🟢 Pilihan (Opsional Minat)</option>
                    <option value="wajib">🔴 Wajib (Seluruh Santri)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Ustaz / Pembina Pengampu:
                  </label>
                  <input
                    type="text"
                    value={formPembina}
                    onChange={(e) => setFormPembina(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Kuota Santri Maksimal:
                  </label>
                  <input
                    type="number"
                    value={formKuota}
                    onChange={(e) => setFormKuota(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Jadwal Latihan Mingguan:
                  </label>
                  <input
                    type="text"
                    value={formJadwal}
                    onChange={(e) => setFormJadwal(e.target.value)}
                    placeholder="Jumat, 15.30 - 17.00 WIB"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                    Lokasi Latihan:
                  </label>
                  <input
                    type="text"
                    value={formLokasi}
                    onChange={(e) => setFormLokasi(e.target.value)}
                    placeholder="Lapangan Utama / Aula"
                    className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Deskripsi Kegiatan:
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white"
                  placeholder="Penjelasan ringkas kegiatan ekstrakurikuler..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  💾 Simpan Data Ekstrakurikuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
