'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Activity, 
  PlayCircle, 
  UserCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Sparkles, 
  Users, 
  BookOpen, 
  School,
  FileText,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { PageCard } from '@/components/shared/page-header';
import { AcademicContextPanel } from '@/components/kurikulum/AcademicContextPanel';
import { getStoredCurriculums, CurriculumProgram } from '@/lib/store/curriculum-store';
import { 
  getStoredAcademicDay, 
  getStoredTeachingSessions, 
  getStoredAttendanceLogs, 
  activateKbmToday, 
  validateDailyClosing, 
  closeAcademicDay,
  ACADEMIC_OPERATION_EVENT,
  AcademicDay,
  TeachingSession,
  TeacherAttendanceLog
} from '@/lib/store/academic-operation-store';
import { BadalAssignmentDrawer } from '@/components/operasional/BadalAssignmentDrawer';
import { SessionAttendanceModal } from '@/components/operasional/SessionAttendanceModal';
import { SessionJournalModal } from '@/components/operasional/SessionJournalModal';
import { useCollection } from '@/hooks';
import type { Guru } from '@/types';
import { cn } from '@/lib/utils';

export default function OperasionalAkademikPage() {
  const searchParams = useSearchParams();
  const progType = searchParams?.get('type') || 'madin';
  
  // Resolve program from store or type
  const programMap: Record<string, string> = {
    formal: 'prog-formal',
    madin: 'prog-madin',
    pesantren: 'prog-madin',
    quran: 'prog-madqur',
  };
  const programId = programMap[progType] || 'prog-madin';

  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'activation' | 'matrix' | 'sessions' | 'monitoring' | 'closing'>('dashboard');
  const [program, setProgram] = useState<CurriculumProgram | null>(null);
  const [academicDay, setAcademicDay] = useState<AcademicDay | null>(null);
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<TeacherAttendanceLog[]>([]);
  const [toast, setToast] = useState('');
  
  // Modal States for Sprint 3
  const [selectedSessionForBadal, setSelectedSessionForBadal] = useState<TeachingSession | null>(null);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<TeachingSession | null>(null);
  const [selectedSessionForJournal, setSelectedSessionForJournal] = useState<TeachingSession | null>(null);

  const { data: guruList } = useCollection<Guru>('guru', [], { realtime: true });

  const loadData = () => {
    const list = getStoredCurriculums();
    const found = list.find((p) => p.id === programId) || list[0];
    setProgram(found);

    const day = getStoredAcademicDay(programId);
    setAcademicDay(day);

    const sess = getStoredTeachingSessions(programId);
    setSessions(sess);

    const logs = getStoredAttendanceLogs(programId);
    setAttendanceLogs(logs);
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener(ACADEMIC_OPERATION_EVENT, handleUpdate);
    return () => window.removeEventListener(ACADEMIC_OPERATION_EVENT, handleUpdate);
  }, [programId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleActivateKbm = () => {
    const updated = activateKbmToday(programId, 'Admin Akademik');
    setAcademicDay(updated);
    showToast('🚀 HARI AKADEMIK KBM HARI INI BERHASIL DIAKTIFKAN!');
  };

  const handleExecuteDailyClosing = () => {
    const updated = closeAcademicDay(programId, 'Admin Akademik');
    setAcademicDay(updated);
    showToast('🔒 HARI AKADEMIK BERHASIL DI-CLOSING & DIKUNCI PERMANEN!');
  };

  const closingValidation = useMemo(() => {
    return validateDailyClosing(programId);
  }, [programId, sessions, academicDay]);

  if (!program || !academicDay) {
    return (
      <div className="p-12 text-center text-stone-500 font-medium animate-pulse">
        Memuat Command Center KBM...
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans pb-16">
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

      {/* Enterprise Administrator Context Panel */}
      <AcademicContextPanel
        program={program}
        progressPercentage={academicDay.status === 'Running' ? 100 : academicDay.status === 'Closed' ? 100 : 75}
        completedCount={academicDay.status === 'Running' || academicDay.status === 'Closed' ? 4 : 3}
        totalCount={4}
      />

      {/* Command Center Sub-Menu Tabs */}
      <div className="bg-white/90 dark:bg-stone-900/90 p-2 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-lg backdrop-blur-md flex items-center space-x-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('dashboard')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap',
            activeSubTab === 'dashboard'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          )}
        >
          <Activity className="w-4 h-4" />
          <span>Dashboard Hari Ini</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('activation')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap',
            activeSubTab === 'activation'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          )}
        >
          <PlayCircle className="w-4 h-4" />
          <span>Aktivasi KBM</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('matrix')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap',
            activeSubTab === 'matrix'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          )}
        >
          <UserCheck className="w-4 h-4" />
          <span>Guru & Jadwal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sessions')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap',
            activeSubTab === 'sessions'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          )}
        >
          <BookOpen className="w-4 h-4" />
          <span>Teaching Session</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('monitoring')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap',
            activeSubTab === 'monitoring'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Monitoring KBM</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('closing')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap',
            activeSubTab === 'closing'
              ? 'bg-amber-500 text-white shadow-md'
              : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          )}
        >
          <Lock className="w-4 h-4" />
          <span>Daily Closing</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUB-MENU 1: DASHBOARD HARI INI */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Main Trigger Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white border border-amber-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
                  STATUS AKADEMIK HARI INI
                </span>
                <span className={cn(
                  'px-3 py-0.5 rounded-full text-xs font-black border',
                  academicDay.status === 'Running'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : academicDay.status === 'Closed'
                    ? 'bg-stone-500/20 text-stone-300 border-stone-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                )}>
                  {academicDay.status === 'Running' ? '🟢 KBM AKTIF (RUNNING)' : academicDay.status === 'Closed' ? '🔒 TERKUNCI (CLOSED)' : '🟡 READY (MENUNGGU AKTIVASI)'}
                </span>
              </div>

              <h2 className="text-xl font-black text-white">
                Command Center KBM: {academicDay.date}
              </h2>
              <p className="text-stone-300 text-xs max-w-2xl">
                Aktivasi KBM dilakukan secara manual oleh Admin setelah memeriksa kehadiran pengajar via scan NFC pagi.
              </p>
            </div>

            {academicDay.status !== 'Running' && academicDay.status !== 'Closed' && (
              <button
                type="button"
                onClick={handleActivateKbm}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-xl transition-all active:scale-95"
              >
                <PlayCircle className="w-5 h-5" />
                <span>AKTIFKAN KBM HARI INI</span>
              </button>
            )}
          </div>

          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md space-y-2">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
                <span>Pengajar Hadir (NFC)</span>
                <Users className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-stone-900 dark:text-white">
                {academicDay.totalTeachersPresent} <span className="text-xs font-normal text-stone-400">/ {academicDay.totalTeachersTotal} Ust.</span>
              </div>
              <p className="text-[10px] text-emerald-600 font-semibold">
                {Math.round((academicDay.totalTeachersPresent / academicDay.totalTeachersTotal) * 100)}% Kehadiran Pengajar
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md space-y-2">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
                <span>Penugasan Guru Badal</span>
                <UserCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-stone-900 dark:text-white">
                {academicDay.totalBadalAssigned} <span className="text-xs font-normal text-stone-400">Sesi Badal</span>
              </div>
              <p className="text-[10px] text-amber-600 font-semibold">
                Terpenuhi via Badal Drawer
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md space-y-2">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
                <span>Total Sesi KBM</span>
                <BookOpen className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-stone-900 dark:text-white">
                {academicDay.totalSessionsTotal} <span className="text-xs font-normal text-stone-400">Sesi</span>
              </div>
              <p className="text-[10px] text-blue-600 font-semibold">
                Terbagi di 4 Rombel Kelas
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md space-y-2">
              <div className="flex items-center justify-between text-stone-500 dark:text-stone-400 text-xs font-bold">
                <span>Lifecycle Day Status</span>
                <ShieldCheck className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-lg font-extrabold text-stone-900 dark:text-white capitalize">
                {academicDay.status}
              </div>
              <p className="text-[10px] text-stone-400">
                Aggregate Root Bound
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUB-MENU 2: AKTIVASI KBM */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'activation' && (
        <PageCard
          title="Aktivasi Hari Akademik (KBM Trigger)"
          description="Daftar kehadiran pengajar NFC pagi hari ini sebelum pengaktifan portal KBM."
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-stone-900 dark:text-white">
                  Pemicu Aktivasi KBM Harian
                </h4>
                <p className="text-[11px] text-stone-600 dark:text-stone-300">
                  Aktivasi memicu pembuatan Teaching Session dan mengaktifkan Portal Guru & Absensi Santri.
                </p>
              </div>

              {academicDay.status !== 'Running' && academicDay.status !== 'Closed' && (
                <button
                  type="button"
                  onClick={handleActivateKbm}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-all shadow-md"
                >
                  AKTIFKAN KBM SEKARANG
                </button>
              )}
            </div>

            <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold">
                  <tr>
                    <th className="p-3">Nama Pengajar</th>
                    <th className="p-3">Waktu Scan NFC</th>
                    <th className="p-3">Metode Scan</th>
                    <th className="p-3">Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {attendanceLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                      <td className="p-3 font-extrabold text-stone-900 dark:text-white">{log.guruName}</td>
                      <td className="p-3 font-mono text-stone-500">{log.scanTime}</td>
                      <td className="p-3 font-semibold uppercase text-[10px]">{log.method}</td>
                      <td className="p-3">
                        <span className={cn(
                          'px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                          log.status === 'present'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        )}>
                          {log.status === 'present' ? '🟢 HADIR' : '🟡 IZIN / BELUM SCAN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </PageCard>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUB-MENU 3: GURU & JADWAL MATRIX */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'matrix' && (
        <PageCard
          title="Matriks Guru & Slot Jam Pelajaran (Guru Badal Hub)"
          description="Klik pada sel jam berstatus 'IZIN' untuk membuka Badal Drawer dan menugaskan Guru Pengganti secara instan."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold pb-2 border-b border-stone-200 dark:border-stone-800">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                🔴 Mengajar
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                🟡 Badal
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                ⚠️ Izin (Klik untuk Badal)
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                🟢 Available (Kosong)
              </span>
            </div>

            <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-900 text-white font-bold">
                  <tr>
                    <th className="p-3 w-48">Nama Pengajar</th>
                    <th className="p-3 text-center">Jam 1 (07.30)</th>
                    <th className="p-3 text-center">Jam 2 (08.15)</th>
                    <th className="p-3 text-center">Jam 3 (09.00)</th>
                    <th className="p-3 text-center">Jam 4 (10.00)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  {/* Ust. Ahmad Zain */}
                  <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                    <td className="p-3 font-extrabold text-stone-900 dark:text-white">
                      Ust. Ahmad Zain
                      <div className="text-[10px] font-normal text-emerald-600">🟢 Hadir (06.45)</div>
                    </td>
                    <td className="p-2 text-center">
                      <span className="block p-2 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                        🔴 7 Abu Bakar (Fiqih)
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className="block p-2 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                        🔴 7 Abu Bakar (Fiqih)
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className="block p-2 rounded-xl bg-stone-100 text-stone-600 font-medium text-[11px]">
                        🟢 Available
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className="block p-2 rounded-xl bg-stone-100 text-stone-600 font-medium text-[11px]">
                        🟢 Available
                      </span>
                    </td>
                  </tr>

                  {/* Ust. Budi Santoso (IZIN) */}
                  <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                    <td className="p-3 font-extrabold text-stone-900 dark:text-white">
                      Ust. Budi Santoso
                      <div className="text-[10px] font-normal text-rose-500">⚠️ Izin Sakit</div>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSessionForBadal(sessions[1])}
                        className="w-full p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-extrabold text-[11px] border border-amber-400 shadow-sm hover:scale-95 transition-all text-left"
                      >
                        🟡 Badal: Ust. Ali Riza
                        <div className="text-[9px] font-normal text-amber-700 dark:text-amber-300">(7 Umar &bull; Nahwu)</div>
                      </button>
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSessionForBadal(sessions[1])}
                        className="w-full p-2 rounded-xl bg-rose-100 text-rose-900 font-extrabold text-[11px] border border-rose-300 hover:scale-95 transition-all"
                      >
                        ⚠️ IZIN (Tugaskan Badal)
                      </button>
                    </td>
                    <td className="p-2 text-center">
                      <span className="block p-2 rounded-xl bg-stone-100 text-stone-400 font-medium text-[11px]">
                        -
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className="block p-2 rounded-xl bg-stone-100 text-stone-400 font-medium text-[11px]">
                        -
                      </span>
                    </td>
                  </tr>

                  {/* Ust. Ali Riza */}
                  <tr className="hover:bg-stone-50 dark:hover:bg-stone-800/50">
                    <td className="p-3 font-extrabold text-stone-900 dark:text-white">
                      Ust. Ali Riza
                      <div className="text-[10px] font-normal text-emerald-600">🟢 Hadir (06.50)</div>
                    </td>
                    <td className="p-2 text-center">
                      <span className="block p-2 rounded-xl bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                        🟡 Badal (7 Umar)
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className="block p-2 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                        🔴 8 Utsman (Shorof)
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className="block p-2 rounded-xl bg-stone-100 text-stone-600 font-medium text-[11px]">
                        🟢 Available
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span className="block p-2 rounded-xl bg-stone-100 text-stone-600 font-medium text-[11px]">
                        🟢 Available
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </PageCard>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUB-MENU 4: TEACHING SESSIONS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'sessions' && (
        <PageCard
          title="Daftar Sesi KBM Harian (Teaching Sessions)"
          description="Status lifecycle sesi KBM: Pending -> Running -> Completed -> Locked."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                    <span className="text-[10px] font-mono font-bold text-stone-400">
                      JAM KE-{sess.periodIndex} ({sess.periodTime})
                    </span>
                    <span className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border',
                      sess.status === 'running'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : sess.status === 'locked'
                        ? 'bg-stone-100 text-stone-700 border-stone-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    )}>
                      {sess.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-stone-900 dark:text-white">
                      {sess.kelasName} &bull; {sess.mapelName}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Pengajar Utama: <strong>{sess.primaryGuruName}</strong>
                    </p>
                    {sess.badalGuruName && (
                      <p className="text-xs text-amber-600 font-bold">
                        🟡 Guru Badal: {sess.badalGuruName}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500 font-medium">
                      Absensi: <strong className={sess.studentAttendanceCompleted ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{sess.studentAttendanceCompleted ? `✓ (${sess.studentAttendanceCount}/${sess.totalStudents})` : `⚠️ Belum (${sess.studentAttendanceCount}/${sess.totalStudents})`}</strong>
                    </span>
                    <span className={cn('font-bold', sess.journalFilled ? 'text-emerald-600' : 'text-amber-600')}>
                      {sess.journalFilled ? '✓ Jurnal Terisi' : '⚠️ Jurnal Pending'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      disabled={sess.status === 'locked'}
                      onClick={() => setSelectedSessionForAttendance(sess)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all disabled:opacity-40"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{sess.studentAttendanceCompleted ? 'Edit Absensi' : 'Isi Absensi'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={sess.status === 'locked'}
                      onClick={() => setSelectedSessionForJournal(sess)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/50 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all disabled:opacity-40"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                      <span>{sess.journalFilled ? 'Edit Jurnal' : 'Isi Jurnal'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageCard>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUB-MENU 5: MONITORING KBM */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'monitoring' && (
        <PageCard
          title="Monitoring Realtime Operasional KBM"
          description="Pemantauan langsung eksekusi pembelajaran per-jam pelajaran."
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Total Sesi Running
              </div>
              <div className="text-3xl font-black">
                {sessions.filter((s) => s.status === 'running').length} Sesi
              </div>
              <p className="text-xs text-emerald-100">Berlangsung Aktif di Kelas</p>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-100">
                Sesi Berstatus Badal
              </div>
              <div className="text-3xl font-black">
                {sessions.filter((s) => Boolean(s.badalGuruId)).length} Sesi
              </div>
              <p className="text-xs text-amber-100">Didampingi Ustadz Badal</p>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-100">
                Absensi Santri Terisi
              </div>
              <div className="text-3xl font-black">
                88%
              </div>
              <p className="text-xs text-blue-100">Sudah Diisi Pengajar</p>
            </div>
          </div>
        </PageCard>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SUB-MENU 6: DAILY CLOSING */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeSubTab === 'closing' && (
        <PageCard
          title="Daily Closing & Locking Hari Akademik"
          description="Proses penutupan resmi hari akademik setelah seluruh sesi KBM selesai."
        >
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-3">
              <h4 className="text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                Persyaratan Validasi Penutupan Hari Akademik:
              </h4>

              <div className="space-y-2">
                {closingValidation.checks.map((chk, cIdx) => (
                  <div key={cIdx} className="flex items-center justify-between text-xs p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-700">
                    <div className="flex items-center gap-2 font-bold text-stone-800 dark:text-stone-200">
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span>{chk.label}</span>
                    </div>
                    <span className="text-[11px] font-mono text-stone-500">{chk.detail}</span>
                  </div>
                ))}
              </div>
            </div>

            {academicDay.status !== 'Closed' ? (
              <button
                type="button"
                disabled={!closingValidation.canClose}
                onClick={handleExecuteDailyClosing}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-black text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                <span>KUNCI & TUTUP HARI AKADEMIK (DAILY CLOSING)</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-stone-900 text-emerald-400 font-extrabold text-xs text-center border border-emerald-500/40">
                🔒 HARI AKADEMIK {academicDay.date} TELAH TERKUNCI & DICLOSING RESMI oleh {academicDay.closedBy}
              </div>
            )}
          </div>
        </PageCard>
      )}

      {/* Badal Drawer Component Overlay */}
      <BadalAssignmentDrawer
        isOpen={Boolean(selectedSessionForBadal)}
        onClose={() => setSelectedSessionForBadal(null)}
        session={selectedSessionForBadal}
        programId={programId}
        onAssigned={() => {
          showToast('✅ GURU BADAL BERHASIL DITUGASKAN!');
          loadData();
        }}
      />

      {/* Student Attendance Modal Overlay (Sprint 3) */}
      <SessionAttendanceModal
        isOpen={Boolean(selectedSessionForAttendance)}
        onClose={() => setSelectedSessionForAttendance(null)}
        session={selectedSessionForAttendance}
        programId={programId}
        onSaved={() => {
          showToast('✅ PRESENSI SANTRI BERHASIL DISIMPAN!');
          loadData();
        }}
      />

      {/* KBM Journal Modal Overlay (Sprint 3) */}
      <SessionJournalModal
        isOpen={Boolean(selectedSessionForJournal)}
        onClose={() => setSelectedSessionForJournal(null)}
        session={selectedSessionForJournal}
        programId={programId}
        onSaved={() => {
          showToast('✅ JURNAL PEMBELAJARAN KBM BERHASIL DISIMPAN!');
          loadData();
        }}
      />
    </div>
  );
}
