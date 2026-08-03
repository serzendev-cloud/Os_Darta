'use client';

import { useState, useEffect } from 'react';
import {
  X,
  BarChart3,
  Award,
  Users,
  CheckCircle2,
  PieChart,
  FileSpreadsheet,
} from 'lucide-react';
import { TeachingSession } from '@/lib/store/academic-operation-store';
import {
  getAssessmentEventForSession,
  getSemesterCalculationScheme,
  AssessmentEvent,
  SemesterCalculationScheme,
} from '@/lib/store/assessment-store';
import { cn } from '@/lib/utils';

interface AssessmentSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TeachingSession | null;
  programId?: string;
}

export function AssessmentSummaryModal({
  isOpen,
  onClose,
  session,
  programId = 'prog-madin',
}: AssessmentSummaryModalProps) {
  const [event, setEvent] = useState<AssessmentEvent | null>(null);
  const [scheme, setScheme] = useState<SemesterCalculationScheme | null>(null);

  useEffect(() => {
    if (session) {
      const evt = getAssessmentEventForSession(session.id);
      setEvent(evt);
      const sc = getSemesterCalculationScheme(programId);
      setScheme(sc);
    }
  }, [session, programId]);

  if (!isOpen || !session) return null;

  const summary = event?.summary;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Assessment Summary & Analytics</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 text-stone-300 hover:text-white hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl font-black text-white">
            {session.kelasName} &bull; {session.mapelName}
          </h2>
          <p className="text-stone-300 text-xs">
            Agenda Penilaian: {event?.title || 'Penilaian Sesi Kelas'} &bull; Source: {event?.source || 'daily_assessment'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {summary ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-center">
                  <span className="text-[10px] font-bold text-stone-500 block uppercase">Santri Evaluasi</span>
                  <span className="text-xl font-black text-stone-900 dark:text-white">{summary.evaluatedCount} / {summary.totalSantri}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center text-emerald-900 dark:text-emerald-300">
                  <span className="text-[10px] font-bold block uppercase">Rata-Rata</span>
                  <span className="text-xl font-black">{summary.averageScore}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center text-blue-900 dark:text-blue-300">
                  <span className="text-[10px] font-bold block uppercase">Tertinggi</span>
                  <span className="text-xl font-black">{summary.highestScore}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center text-rose-900 dark:text-rose-300">
                  <span className="text-[10px] font-bold block uppercase">Terendah</span>
                  <span className="text-xl font-black">{summary.lowestScore}</span>
                </div>
              </div>

              {/* Grade Distribution */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <PieChart className="w-4 h-4 text-amber-500" />
                  <span>Distribusi Predikat Santri</span>
                </h4>
                <div className="flex flex-wrap gap-2 text-xs font-extrabold">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                    🟢 Mumtaz (≥90): {summary.gradeDistribution.mumtaz}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/30">
                    🔵 Jayyid Jiddan (80-89): {summary.gradeDistribution.jayyidJiddan}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                    🟡 Jayyid (70-79): {summary.gradeDistribution.jayyid}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-800 dark:text-orange-300 border border-orange-500/30">
                    🟠 Maqbul (60-69): {summary.gradeDistribution.maqbul}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30">
                    🔴 Rasib (&lt;60): {summary.gradeDistribution.rasib}
                  </span>
                </div>
              </div>

              {/* Semester Calculation Scheme Info */}
              {scheme && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-amber-500" />
                      <span>{scheme.schemeName} (Academic Ledger Ready)</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300">
                      KKM: {scheme.passingGrade}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400">
                    Nilai sesi ini akan terintegrasi ke Academic Ledger (Sprint 5) berdasarkan aturan bobot semester yang telah disetujui.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-stone-500 space-y-2">
              <Award className="w-8 h-8 text-stone-400 mx-auto animate-bounce" />
              <p className="text-xs font-bold">Penilaian untuk sesi ini belum diisikan atau belum disahkan.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800/80 border-t border-stone-200 dark:border-stone-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-extrabold text-xs"
          >
            Tutup Ringkasan
          </button>
        </div>
      </div>
    </div>
  );
}
