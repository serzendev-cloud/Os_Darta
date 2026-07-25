'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  GraduationCap, BookMarked, BookOpen, Trophy, Plus, Settings, 
  Copy, Edit3, Trash2, CheckCircle2, ChevronRight, Layers, 
  Library, UsersRound, Calendar, FileSpreadsheet, Sparkles, Filter, Search
} from 'lucide-react';
import Link from 'next/link';

export interface CurriculumProgram {
  id: string;
  code: string;
  name: string;
  typeCategory: 'formal' | 'pesantren' | 'quran' | 'custom';
  description: string;
  status: 'active' | 'draft';
  totalJenjang: number;
  totalMapel: number;
  totalGuru: number;
  iconBg: string;
  isTemplateDefault?: boolean;
}

const defaultCurriculumsList: CurriculumProgram[] = [
  {
    id: 'prog-formal',
    code: 'FORMAL-DEPAG',
    name: 'Akademik Formal (Kemenag / Diknas)',
    typeCategory: 'formal',
    description: 'Kurikulum pendidikan formal berijazah negara (MTs, MA, SMA, SMP)',
    status: 'active',
    totalJenjang: 3,
    totalMapel: 16,
    totalGuru: 12,
    iconBg: 'bg-blue-600',
    isTemplateDefault: true,
  },
  {
    id: 'prog-madin',
    code: 'PESANTREN-MADIN',
    name: 'Akademik Pesantren (Madrasah Diniyah)',
    typeCategory: 'pesantren',
    description: 'Kurikulum diniyah pesantren (Jenjang Tamhidi, Ibtida’i, Tsanawiyah, Aliyah)',
    status: 'active',
    totalJenjang: 4,
    totalMapel: 24,
    totalGuru: 18,
    iconBg: 'bg-amber-600',
    isTemplateDefault: true,
  },
  {
    id: 'prog-madqur',
    code: 'TAHFIDZ-MADQUR',
    name: 'Akademik Qur’an (Madrasatul Qur’an)',
    typeCategory: 'quran',
    description: 'Program khusus tahsin, ziyadah hafalan 30 juz, murojaah, & matan tajwid',
    status: 'active',
    totalJenjang: 2,
    totalMapel: 8,
    totalGuru: 8,
    iconBg: 'bg-emerald-600',
    isTemplateDefault: true,
  },
];

export default function MasterCurriculumSettingsPage() {
  const [curriculums, setCurriculums] = useState<CurriculumProgram[]>(defaultCurriculumsList);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');

  // Modal State for New Curriculum Program
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProgName, setNewProgName] = useState('');
  const [newProgCode, setNewProgCode] = useState('');
  const [newProgCategory, setNewProgCategory] = useState<'formal' | 'pesantren' | 'quran' | 'custom'>('custom');
  const [cloneTemplateId, setCloneTemplateId] = useState('prog-madin');
  const [newProgDesc, setNewProgDesc] = useState('');

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleDuplicateProgram = (program: CurriculumProgram) => {
    const duplicated: CurriculumProgram = {
      id: `prog-custom-${Date.now()}`,
      code: `${program.code}-COPY`,
      name: `${program.name} (Salinan)`,
      typeCategory: 'custom',
      description: `Salinan dari template ${program.name}. Siap dikonfigurasi mapel & jenjangnya secara terpisah.`,
      status: 'active',
      totalJenjang: program.totalJenjang,
      totalMapel: program.totalMapel,
      totalGuru: program.totalGuru,
      iconBg: 'bg-purple-600',
    };

    setCurriculums(prev => [...prev, duplicated]);
    showNotification(`Program Kurikulum Baru "${duplicated.name}" BERHASIL DIDUPLIKASI & DITERBITKAN KE MENU SIDEBAR!`);
  };

  const handleCreateNewProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgName || !newProgCode) return;

    const sourceTemplate = curriculums.find(c => c.id === cloneTemplateId);

    const newProgram: CurriculumProgram = {
      id: `prog-custom-${Date.now()}`,
      code: newProgCode.toUpperCase(),
      name: newProgName,
      typeCategory: newProgCategory,
      description: newProgDesc || `Program Kurikulum Khusus ${newProgName}`,
      status: 'active',
      totalJenjang: sourceTemplate ? sourceTemplate.totalJenjang : 1,
      totalMapel: sourceTemplate ? sourceTemplate.totalMapel : 5,
      totalGuru: sourceTemplate ? sourceTemplate.totalGuru : 3,
      iconBg: 'bg-indigo-600',
    };

    setCurriculums(prev => [...prev, newProgram]);
    showNotification(`Program Kurikulum Baru "${newProgram.name}" BERHASIL DIBUAT! Menu Kontainer Baru telah ditambahkan di Sidebar.`);

    // Reset Form
    setNewProgName('');
    setNewProgCode('');
    setNewProgDesc('');
    setIsAddModalOpen(false);
  };

  const handleDeleteProgram = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus Program Kurikulum "${name}"?`)) {
      setCurriculums(prev => prev.filter(c => c.id !== id));
      showNotification(`Program Kurikulum "${name}" telah dihapus.`);
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
            Pengaturan Kurikulum Utama & Penerbitan Menu Kontainer
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-3xl leading-relaxed">
            Buat hingga <strong className="text-white">5+ Program Kurikulum Mandiri</strong> (misal: Kitab Kuning, Sorogan, Bahasa). Setiap program yang dibuat di sini secara otomatis akan <strong className="text-white">menerbitkan Menu Kontainer tersendiri di Sidebar</strong> di bawah judul <em>PROGRAM KURIKULUM</em> dengan template pengaturan mapel & jenjang terpisah.
          </p>
        </div>
      </div>

      {/* Main Section */}
      <PageCard
        title="Pustaka Program Kurikulum Active (Curriculum Program Library)"
        description="Kelola program kurikulum yang berjalan di pesantren. Klik 'Duplikasi Template' untuk membuat program baru secara instan"
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

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                    🟢 AKTIF
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

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDuplicateProgram(prog)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-[11px] font-bold border border-amber-300/60 transition-all active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplikasi</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/dashboard/struktur-akademik?prog=${prog.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all active:scale-95"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Konfigurasi Mapel</span>
                  </Link>

                  {!prog.isTemplateDefault && (
                    <button
                      type="button"
                      onClick={() => handleDeleteProgram(prog.id, prog.name)}
                      className="p-1.5 rounded-xl bg-stone-100 text-stone-400 hover:text-rose-600 dark:bg-stone-800 transition-colors"
                      title="Hapus Program"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
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

              {/* Clone Template Source */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Salin Struktur Dari Template Kurikulum:
                </label>
                <select
                  value={cloneTemplateId}
                  onChange={(e) => setCloneTemplateId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="prog-madin">📖 Template Akademik Pesantren (Madin)</option>
                  <option value="prog-formal">🎓 Template Akademik Formal (Kemenag)</option>
                  <option value="prog-madqur">🏆 Template Akademik Qur’an (Madqur)</option>
                </select>
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
