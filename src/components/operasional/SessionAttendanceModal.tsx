'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Users, 
  BookOpen, 
  School, 
  Save, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { 
  getStudentAttendanceForSession, 
  saveStudentAttendance, 
  StudentAttendanceRecord, 
  StudentAttendanceStatus, 
  TeachingSession 
} from '@/lib/store/academic-operation-store';
import { cn } from '@/lib/utils';

interface SessionAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TeachingSession | null;
  programId?: string;
  onSaved?: () => void;
}

export function SessionAttendanceModal({
  isOpen,
  onClose,
  session,
  programId = 'prog-madin',
  onSaved,
}: SessionAttendanceModalProps) {
  const [records, setRecords] = useState<StudentAttendanceRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session) {
      const existing = getStudentAttendanceForSession(session.id);
      setRecords(existing);
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleToggleStatus = (santriId: string, nextStatus: StudentAttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.santriId === santriId ? { ...r, status: nextStatus } : r))
    );
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      saveStudentAttendance(session.id, records, programId);
      setIsSaving(false);
      onSaved?.();
      onClose();
    }, 300);
  };

  const hadirCount = records.filter((r) => r.status === 'hadir').length;
  const izinCount = records.filter((r) => r.status === 'izin' || r.status === 'izin_pulang').length;
  const sakitCount = records.filter((r) => r.status === 'sakit').length;
  const alpaCount = records.filter((r) => r.status === 'alpa').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>Presensi Santri Kelas</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 text-stone-300 hover:text-white hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">
              {session.kelasName} &bull; {session.mapelName}
            </h2>
            <p className="text-stone-300 text-xs flex items-center gap-2">
              <School className="w-3.5 h-3.5 text-amber-400" /> Jam Ke-{session.periodIndex} ({session.periodTime}) &bull; Pengajar: {session.badalGuruName || session.primaryGuruName}
            </p>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-extrabold">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              🟢 Hadir: {hadirCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🟡 Izin: {izinCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
              🔴 Sakit: {sakitCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-stone-500/20 text-stone-300 border border-stone-500/30">
              ⚫ Alpa: {alpaCount}
            </span>
          </div>
        </div>

        {/* Modal Body - Student Attendance List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider pb-2 border-b border-stone-200 dark:border-stone-800">
            <span>Daftar Santri ({records.length} Santri)</span>
            <span className="text-[10px] text-amber-600 font-normal">
              ⚡ Optimistic Mode: Klik status untuk mengubah
            </span>
          </div>

          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record.santriId}
                className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-stone-900 dark:text-white">
                    {record.santriName}
                  </h4>
                  {record.lastHafalanPos && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-semibold">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Posisi Hafalan Terakhir: <strong>{record.lastHafalanPos}</strong></span>
                    </div>
                  )}
                </div>

                {/* Status Selector Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(record.santriId, 'hadir')}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all',
                      record.status === 'hadir'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-emerald-100'
                    )}
                  >
                    Hadir
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(record.santriId, 'izin')}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all',
                      record.status === 'izin'
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-amber-100'
                    )}
                  >
                    Izin
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(record.santriId, 'sakit')}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all',
                      record.status === 'sakit'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-rose-100'
                    )}
                  >
                    Sakit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(record.santriId, 'alpa')}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl font-bold text-[11px] transition-all',
                      record.status === 'alpa'
                        ? 'bg-stone-900 text-white shadow-md'
                        : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-300'
                    )}
                  >
                    Alpa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 bg-stone-100 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Presensi Santri'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
