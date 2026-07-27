'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  GraduationCap, BookMarked, BookOpen, Trophy, Plus, Settings, 
  Trash2, CheckCircle2, ChevronRight, Layers, 
  Library, UsersRound, Calendar, FileSpreadsheet, Sparkles, Filter, Search, Edit3
} from 'lucide-react';
import Link from 'next/link';

import { useEffect } from 'react';
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

    const newProgram: CurriculumProgram = {
      id: `prog-custom-${Date.now()}`,
      code: newProgCode.toUpperCase(),
      name: newProgName,
      typeCategory: newProgCategory,
      description: newProgDesc || `Program Kurikulum Khusus ${newProgName}`,
      status: 'active',
      totalJenjang: 2,
      totalMapel: 10,
      totalGuru: 5,
      iconBg: 'bg-indigo-600',
    };

    const updated = [...curriculums, newProgram];
    setCurriculums(updated);
    saveStoredCurriculums(updated);

    showNotification(`Program Kurikulum Baru "${newProgram.name}" BERHASIL DIBUAT! Menu Kontainer Baru telah ditambahkan di Sidebar.`);

    // Reset Form
    setNewProgName('');
    setNewProgCode('');
    setNewProgDesc('');
    setIsAddModalOpen(false);
  };

  const handleDeleteProgram = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin membuang/menghapus Program Kurikulum "${name}" dari sistem?`)) {
      const updated = curriculums.filter(c => c.id !== id);
      setCurriculums(updated);
      saveStoredCurriculums(updated);
      showNotification(`Program Kurikulum "${name}" telah berhasil dihapus dari sistem & Sidebar.`);
    }
  };

  const filteredCurriculums = curriculums.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

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
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <BookMarked className="w-3.5 h-3.5" />
            <span>Pusat Pengaturan Kurikulum & Template Program</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Master Madrasah & Penerbitan Menu Kontainer
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-3xl leading-relaxed">
            Buat hingga <strong className="text-white">5+ Program Kurikulum Mandiri</strong> (misal: Kitab Kuning, Sorogan, Bahasa). Setiap program yang dibuat di sini secara otomatis akan <strong className="text-white">menerbitkan Menu Kontainer tersendiri di Sidebar</strong> di bawah judul <em>PROGRAM KURIKULUM</em> dengan template pengaturan mapel & jenjang terpisah.
          </p>
        </div>
      </div>

      {/* Main Section */}
      <PageCard
        title="Pustaka Program Kurikulum Active (Curriculum Program Library)"
        description="Kelola program kurikulum yang berjalan di pesantren. Klik '+ Buat Program Kurikulum Baru' atau 'Konfigurasi Program' untuk mengubah pengaturan."
      >
        {/* Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama program kurikulum, kode..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Program Kurikulum Baru</span>
          </button>
        </div>

        {/* Curriculum Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCurriculums.map((prog) => (
            <div
              key={prog.id}
              className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4"
            >
              {/* Header Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${prog.iconBg} text-white flex items-center justify-center font-bold shadow-md`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-wider">
                        {prog.code}
                      </span>
                      <h3 className="text-sm font-extrabold text-stone-900 dark:text-white leading-tight">
                        {prog.name}
                      </h3>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    prog.status === 'active' 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300'
                  }`}>
                    {prog.status === 'active' ? '🟢 AKTIF' : '🟡 DRAFT'}
                  </span>
                </div>

                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                  {prog.description}
                </p>

                {/* Submenu Features Inherited Banner */}
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200/60 dark:border-stone-700 text-[11px] space-y-1.5">
                  <div className="font-bold text-stone-700 dark:text-stone-300 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Fitur Kontainer Sidebar Terbit:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-md bg-stone-200/60 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-semibold">
                      🎓 {prog.totalJenjang} Jenjang
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-200/60 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-semibold">
                      📚 {prog.totalMapel} Mapel
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-200/60 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-semibold">
                      👥 {prog.totalGuru} Guru
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-stone-200/60 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-[10px] font-semibold">
                      📊 Raport & Ujian
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar: Active Konfigurasi Button (Navigates to Dedicated Settings Page) & Trash Delete Button */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                <Link
                  href={`/dashboard/kurikulum/master/${prog.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Konfigurasi Program</span>
                </Link>

                <button
                  type="button"
                  onClick={() => handleDeleteProgram(prog.id, prog.name)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white font-bold text-xs border border-rose-200 dark:border-rose-800 transition-all active:scale-95"
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
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-amber-600">
                <Plus className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                  Buat Program Kurikulum Baru (Auto-Publish Menu)
                </h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateNewProgram} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Nama Program Kurikulum:
                </label>
                <input
                  type="text"
                  value={newProgName}
                  onChange={(e) => setNewProgName(e.target.value)}
                  placeholder="misal: Program Kitab Kuning Sorogan, Program Bahasa Arab..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Kode Unique ID Program:
                </label>
                <input
                  type="text"
                  value={newProgCode}
                  onChange={(e) => setNewProgCode(e.target.value)}
                  placeholder="misal: PROG-KITAB-SOROGAN"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-mono font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Deskripsi Singkat Program:
                </label>
                <textarea
                  rows={2}
                  value={newProgDesc}
                  onChange={(e) => setNewProgDesc(e.target.value)}
                  placeholder="Deskripsi tujuan program kurikulum..."
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  🚀 Terbitkan Program & Tambahkan Ke Sidebar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
