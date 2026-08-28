'use client';

import { useState, useEffect } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  GraduationCap, BookMarked, Plus, Trash2, CheckCircle2, Sparkles, Search, Settings
} from 'lucide-react';
import Link from 'next/link';

import { 
  CurriculumProgram, 
  getStoredCurriculums, 
  saveStoredCurriculums 
} from '@/lib/store/curriculum-store';

export default function MasterCurriculumSettingsPage() {
  const [curriculums, setCurriculums] = useState<CurriculumProgram[]>([]);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');

  // Synchronize state from store on mount
  useEffect(() => {
    setCurriculums(getStoredCurriculums());
  }, []);

  // Modal State for New Curriculum Program
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProgName, setNewProgName] = useState('');
  const [newProgCode, setNewProgCode] = useState('');
  const [newProgCategory, setNewProgCategory] = useState<'formal' | 'pesantren' | 'quran' | 'custom'>('custom');
  const [newProgDesc, setNewProgDesc] = useState('');

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleCreateNewProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgName || !newProgCode) return;

    const templateType = newProgCategory === 'custom' ? 'pesantren' : newProgCategory;
    const isQuran = newProgCategory === 'quran';
    const isFormal = newProgCategory === 'formal';

    const newProgram: CurriculumProgram = {
      id: `prog-custom-${Date.now()}`,
      code: newProgCode.toUpperCase(),
      name: newProgName,
      typeCategory: newProgCategory,
      description: newProgDesc || `Program Kurikulum Khusus ${newProgName}`,
      status: 'active',
      totalJenjang: isQuran ? 2 : isFormal ? 3 : 4,
      totalMapel: isQuran ? 8 : isFormal ? 16 : 24,
      totalGuru: isQuran ? 8 : isFormal ? 12 : 18,
      iconBg: isQuran ? 'bg-emerald-600' : isFormal ? 'bg-blue-600' : 'bg-indigo-600',
      skalaPenilaian: isQuran ? 'predikat_syariah' : 'numeric_100',
      kkmMin: 75,
      formatRaport: isQuran ? 'pdf_tahfidz' : 'pdf_standar',
      penanggungJawab: 'Ust. Ahmad Dahlan, M.Pd.',
      catatanTambahan: `Konfigurasi diawali dari template ${templateType.toUpperCase()}`,
    };

    const updated = [...curriculums, newProgram];
    setCurriculums(updated);
    saveStoredCurriculums(updated);

    showNotification(`Program Kurikulum Baru "${newProgram.name}" BERHASIL DIBUAT!`);

    // Reset Form
    setNewProgName('');
    setNewProgCode('');
    setNewProgDesc('');
    setNewProgCategory('custom');
    setIsAddModalOpen(false);
  };

  const handleDeleteProgram = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin membuang/menghapus Program Kurikulum "${name}" dari sistem?`)) {
      const updated = curriculums.filter(c => c.id !== id);
      setCurriculums(updated);
      saveStoredCurriculums(updated);
      showNotification(`Program Kurikulum "${name}" telah berhasil dihapus dari sistem.`);
    }
  };

  const filteredCurriculums = curriculums.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-700 text-white font-medium text-xs flex items-center justify-between shadow-xl animate-bounce min-h-[44px]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast('')} className="text-white/80 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center">&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <BookMarked className="w-3.5 h-3.5" />
            <span>Academic Configuration Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Pustaka Program Akademik
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-3xl leading-relaxed">
            Kelola dan konfigurasikan <strong className="text-white">Program Akademik Pesantren</strong> (misal: Kitab Kuning, Sorogan, Tahfidz, Formal). Setiap program menyediakan struktur kurikulum, jenjang, mata pelajaran, dan sistem penilaian mandiri.
          </p>
        </div>
      </div>

      {/* Main Section */}
      <PageCard
        title="Pustaka Program Kurikulum Active"
        description="Kelola program kurikulum yang berjalan di pesantren. Klik '+ Buat Program Baru' atau 'Kelola Kurikulum' untuk mengubah pengaturan."
      >
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama program kurikulum, kode..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-h-[44px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Program Baru</span>
          </button>
        </div>

        {/* Curriculum Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCurriculums.map((prog) => (
            <div
              key={prog.id}
              className="p-5 rounded-3xl bg-card border border-border shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              {/* Header Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl ${prog.iconBg} text-white flex items-center justify-center font-bold shadow-md shrink-0`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider block truncate">
                        {prog.code}
                      </span>
                      <h3 className="text-sm font-extrabold text-foreground leading-tight truncate">
                        {prog.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      prog.status === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                    }`}>
                      {prog.status === 'active' ? '🟢 AKTIF' : '🟡 DRAFT'}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {prog.version || 'v1.0 Draft'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {prog.description}
                </p>

                {/* Submenu Features Inherited Banner */}
                <div className="p-3 rounded-2xl bg-muted/60 border border-border text-[11px] space-y-2">
                  <div className="font-bold text-foreground text-[10px] uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Komponen Kurikulum:
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono font-extrabold">
                      Ready
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-background border border-border text-foreground text-[10px] font-semibold">
                      🎓 {prog.totalJenjang} Jenjang
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-background border border-border text-foreground text-[10px] font-semibold">
                      📚 {prog.totalMapel} Mapel
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-background border border-border text-foreground text-[10px] font-semibold">
                      👥 {prog.totalGuru} Guru
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <Link
                  href={`/dashboard/kurikulum/config?id=${prog.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 min-h-[44px] flex-1 sm:flex-none"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Kelola Kurikulum</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleDeleteProgram(prog.id, prog.name)}
                  className="inline-flex items-center justify-center gap-1 px-3.5 py-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white font-bold text-xs border border-red-500/20 transition-all active:scale-95 min-h-[44px]"
                  title="Hapus / Buang Program Kurikulum Ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </PageCard>

      {/* CREATE NEW PROGRAM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-amber-600">
                <Plus className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-foreground">
                  Buat Program Kurikulum Baru
                </h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-muted-foreground hover:text-foreground font-bold text-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateNewProgram} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground uppercase">
                  Nama Program Kurikulum *
                </label>
                <input
                  type="text"
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  placeholder="misal: Program Kitab Kuning Sorogan..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs font-bold text-foreground focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  required
                />
              </div>

              {/* Code */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground uppercase">
                  Kode Unique ID Program *
                </label>
                <input
                  type="text"
                  value={newProgCode}
                  onChange={(e) => setNewProgCode(e.target.value)}
                  placeholder="misal: PROG-KITAB-SOROGAN"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs font-mono font-bold text-foreground focus:ring-2 focus:ring-amber-500 min-h-[44px]"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground uppercase">
                  Deskripsi Singkat Program
                </label>
                <textarea
                  rows={2}
                  value={newProgDesc}
                  onChange={(e) => setNewProgDesc(e.target.value)}
                  placeholder="Deskripsi tujuan program kurikulum..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs font-medium text-foreground focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 min-h-[44px]"
                >
                  🚀 Terbitkan Program Kurikulum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
