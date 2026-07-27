'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  GraduationCap, BookMarked, Settings, CheckCircle2, ArrowLeft, 
  Save, ShieldCheck, Sparkles, Layers, BookOpen, Users, 
  Award, FileText, UserCheck, Palette, AlertCircle
} from 'lucide-react';
import { PageCard } from '@/components/shared/page-header';
import { 
  CurriculumProgram, 
  getStoredCurriculums, 
  saveStoredCurriculums 
} from '@/lib/store/curriculum-store';

export default function DedicatedCurriculumConfigPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const [program, setProgram] = useState<CurriculumProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'metrics' | 'grading' | 'admin'>('general');

  useEffect(() => {
    const list = getStoredCurriculums();
    const found = list.find(p => p.id === programId);
    if (found) {
      setProgram({
        ...found,
        skalaPenilaian: found.skalaPenilaian || 'numeric_100',
        kkmMin: found.kkmMin ?? 75,
        formatRaport: found.formatRaport || (found.typeCategory === 'quran' ? 'pdf_tahfidz' : 'pdf_standar'),
        penanggungJawab: found.penanggungJawab || 'Ust. Ahmad Dahlan, M.Pd.',
        catatanTambahan: found.catatanTambahan || '',
      });
    }
    setLoading(false);
  }, [programId]);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!program) return;

    const list = getStoredCurriculums();
    const index = list.findIndex(p => p.id === program.id);
    let updatedList: CurriculumProgram[];
    if (index !== -1) {
      updatedList = [...list];
      updatedList[index] = program;
    } else {
      updatedList = [...list, program];
    }

    saveStoredCurriculums(updatedList);
    showNotification(`Pengaturan Program "${program.name}" BERHASIL DISIMPAN & DIPERBARUI!`);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-stone-500 font-medium animate-pulse">
        Memuat Konfigurasi Program...
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-8 space-y-4 font-sans text-center">
        <div className="p-6 max-w-md mx-auto rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-rose-500" />
          <h2 className="text-lg font-bold">Program Kurikulum Tidak Ditemukan</h2>
          <p className="text-xs mt-1">ID Program "{programId}" tidak terdaftar dalam pustaka kurikulum active.</p>
          <Link
            href="/dashboard/kurikulum/master"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-stone-900 text-white font-bold text-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Master Madrasah
          </Link>
        </div>
      </div>
    );
  }

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

      {/* Top Navigation & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/kurikulum/master"
            className="p-2.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all shadow-sm"
            title="Kembali ke Master Madrasah"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-semibold">
              <Link href="/dashboard/kurikulum/master" className="hover:underline">Kurikulum Master</Link>
              <span>/</span>
              <span className="text-stone-900 dark:text-white font-bold">Konfigurasi Program</span>
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
              Pengaturan Program: <span className="text-amber-600 dark:text-amber-400">{program.name}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/kurikulum/master"
            className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
          >
            Batal
          </Link>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      {/* Program Summary Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white shadow-xl border border-amber-500/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl ${program.iconBg} text-white flex items-center justify-center font-extrabold text-2xl shadow-lg ring-4 ring-white/10`}>
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold uppercase">
                {program.code}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                program.status === 'active' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {program.status === 'active' ? '🟢 AKTIF (TERBIT DI SIDEBAR)' : '🟡 DRAFT (DISEMBUNYIKAN)'}
              </span>
            </div>
            <h2 className="text-xl font-black mt-1 text-white">{program.name}</h2>
            <p className="text-stone-300 text-xs mt-0.5 max-w-xl line-clamp-1">{program.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
          <div className="text-center px-3 border-r border-white/20">
            <div className="text-[10px] font-semibold text-stone-300 uppercase">Jenjang</div>
            <div className="text-lg font-black text-amber-300">{program.totalJenjang}</div>
          </div>
          <div className="text-center px-3 border-r border-white/20">
            <div className="text-[10px] font-semibold text-stone-300 uppercase">Mapel</div>
            <div className="text-lg font-black text-amber-300">{program.totalMapel}</div>
          </div>
          <div className="text-center px-3">
            <div className="text-[10px] font-semibold text-stone-300 uppercase">Guru</div>
            <div className="text-lg font-black text-amber-300">{program.totalGuru}</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-stone-200 dark:border-stone-800 space-x-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'general'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Informasi Utama & Identitas</span>
        </button>

        <button
          onClick={() => setActiveTab('metrics')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'metrics'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Target Metrik Kontainer</span>
        </button>

        <button
          onClick={() => setActiveTab('grading')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'grading'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Sistem Penilaian & Raport</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs transition-all ${
            activeTab === 'admin'
              ? 'border-amber-600 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/30 rounded-t-xl'
              : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Penanggung Jawab & Catatan</span>
        </button>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <PageCard
            title="Identitas & Visibilitas Program"
            description="Atur nama resmi, kode unik, kategori kurikulum, dan visibilitas di Sidebar."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Nama Program Kurikulum:
                </label>
                <input
                  type="text"
                  value={program.name}
                  onChange={(e) => setProgram({ ...program, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/30"
                  required
                />
                <p className="text-[11px] text-stone-400 mt-1">Nama ini akan menjadi judul menu kontainer utama di Sidebar.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Kode Unique ID Program:
                </label>
                <input
                  type="text"
                  value={program.code}
                  onChange={(e) => setProgram({ ...program, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/30"
                  required
                />
                <p className="text-[11px] text-stone-400 mt-1">Kode unik untuk referensi database & cetak sertifikat/raport.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Kategori Kurikulum:
                </label>
                <select
                  value={program.typeCategory}
                  onChange={(e) => setProgram({ ...program, typeCategory: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="formal">🏫 Akademik Formal (Kemag/Kemenag)</option>
                  <option value="pesantren">🕌 Akademik Diniyah Pesantren (Salaf/Kholaf)</option>
                  <option value="quran">📖 Tahfidz & Akademik Qur'an</option>
                  <option value="custom">✨ Program Khusus / Ekstrakurikuler</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Status Operasional:
                </label>
                <select
                  value={program.status}
                  onChange={(e) => setProgram({ ...program, status: e.target.value as 'active' | 'draft' })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="active">🟢 Aktif (Terbitkan Menu di Sidebar)</option>
                  <option value="draft">🟡 Draft (Sembunyikan dari Sidebar)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Warna Latar Icon Badge:
                </label>
                <select
                  value={program.iconBg}
                  onChange={(e) => setProgram({ ...program, iconBg: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="bg-blue-600">🟦 Biru Formal (bg-blue-600)</option>
                  <option value="bg-amber-600">🟧 Oranye/Amber Pesantren (bg-amber-600)</option>
                  <option value="bg-emerald-600">🟩 Hijau Tahfidz (bg-emerald-600)</option>
                  <option value="bg-purple-600">🟪 Ungu Khusus (bg-purple-600)</option>
                  <option value="bg-rose-600">🟥 Merah (bg-rose-600)</option>
                  <option value="bg-indigo-600">🟫 Nila / Indigo (bg-indigo-600)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Deskripsi & Tujuan Program:
                </label>
                <textarea
                  rows={3}
                  value={program.description}
                  onChange={(e) => setProgram({ ...program, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500/30"
                  placeholder="Jelaskan cakupan dan target pendidikan program kurikulum ini..."
                />
              </div>
            </div>
          </PageCard>
        )}

        {/* TAB 2: METRICS */}
        {activeTab === 'metrics' && (
          <PageCard
            title="Target Metrik & Kuota Kontainer"
            description="Tentukan perkiraan kapasitas jenjang, alokasi mata pelajaran, dan jumlah ustadz/pengajar."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-3">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-extrabold text-xs">
                  <Layers className="w-4 h-4" />
                  <span>Total Jenjang Pendidikan</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={program.totalJenjang}
                  onChange={(e) => setProgram({ ...program, totalJenjang: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 text-lg font-black text-center text-stone-900 dark:text-white"
                />
                <p className="text-[11px] text-stone-500 leading-snug">
                  Jumlah tingkatan jenjang (misal: Ula, Wustho, Ulya atau Kelas 7-9).
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-3">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-extrabold text-xs">
                  <BookOpen className="w-4 h-4" />
                  <span>Total Mata Pelajaran (Mapel)</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={program.totalMapel}
                  onChange={(e) => setProgram({ ...program, totalMapel: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-blue-300 dark:border-blue-700 text-lg font-black text-center text-stone-900 dark:text-white"
                />
                <p className="text-[11px] text-stone-500 leading-snug">
                  Target total kitab/mata pelajaran yang diampu dalam program ini.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                  <Users className="w-4 h-4" />
                  <span>Total Guru / Ustadz Pengajar</span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={program.totalGuru}
                  onChange={(e) => setProgram({ ...program, totalGuru: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-stone-900 border border-emerald-300 dark:border-emerald-700 text-lg font-black text-center text-stone-900 dark:text-white"
                />
                <p className="text-[11px] text-stone-500 leading-snug">
                  Alokasi ustadz & ustazah yang ditugaskan mengajar di program ini.
                </p>
              </div>
            </div>
          </PageCard>
        )}

        {/* TAB 3: GRADING */}
        {activeTab === 'grading' && (
          <PageCard
            title="Sistem Penilaian & Format Raport"
            description="Konfigurasi standar KKM minimum, standar predikat kelulusan, dan format cetak dokumen raport."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Skala Penilaian Pembelajaran:
                </label>
                <select
                  value={program.skalaPenilaian || 'numeric_100'}
                  onChange={(e) => setProgram({ ...program, skalaPenilaian: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white"
                >
                  <option value="numeric_100">🔢 Skala Angka Standar (0 - 100)</option>
                  <option value="predikat_syariah">📜 Predikat Syariah (Mumtaz, Jayyid Jiddan, Jayyid, Maqbul)</option>
                  <option value="letter_af">🔤 Huruf Abjad (A, B, C, D, F)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Nilai KKM (Kriteria Ketuntasan Minimum):
                </label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={program.kkmMin ?? 75}
                  onChange={(e) => setProgram({ ...program, kkmMin: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Format Layout Cetak Raport:
                </label>
                <select
                  value={program.formatRaport || 'pdf_standar'}
                  onChange={(e) => setProgram({ ...program, formatRaport: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white"
                >
                  <option value="pdf_standar">📄 Template Raport Formal / Nasional (Nilai & Deskripsi Capaian)</option>
                  <option value="pdf_tahfidz">📖 Template Raport Tahfidz (Hafalan, Murojaah & Tajwid)</option>
                  <option value="kitab_kuning">📜 Template Raport Diniyah Kitab (Fathul Qorib, Imriti, Alfiyah)</option>
                </select>
              </div>
            </div>
          </PageCard>
        )}

        {/* TAB 4: ADMIN */}
        {activeTab === 'admin' && (
          <PageCard
            title="Penanggung Jawab & Catatan Internal"
            description="Kelola informasi koordinator program dan catatan administratif."
          >
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Nama Ustadz / Mudir / Penanggung Jawab Program:
                </label>
                <input
                  type="text"
                  value={program.penanggungJawab || ''}
                  onChange={(e) => setProgram({ ...program, penanggungJawab: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white"
                  placeholder="misal: Ust. K.H. Ahmad Fauzi, Lc., M.A."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
                  Catatan Internal / Petunjuk Operasional:
                </label>
                <textarea
                  rows={4}
                  value={program.catatanTambahan || ''}
                  onChange={(e) => setProgram({ ...program, catatanTambahan: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white"
                  placeholder="Catatan khusus kurikulum untuk ustadz pengajar..."
                />
              </div>
            </div>
          </PageCard>
        )}

        {/* Bottom Floating Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xl">
          <div className="flex items-center gap-2 text-stone-500 text-xs font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Perubahan tersimpan langsung secara terisolasi untuk pesantren ini.</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/kurikulum/master"
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Program</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
