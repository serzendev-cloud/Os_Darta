'use client';

import { useState } from 'react';
import {
  X,
  Printer,
  Award,
  BookOpen,
  Lock,
  CheckCircle2,
  FileText,
  Building2,
  Sparkles,
} from 'lucide-react';
import { FormattedTranscriptData } from '@/lib/presenters/transcript-presenter';
import { PrintReportCardPDF } from './PrintReportCardPDF';
import { cn } from '@/lib/utils';

interface TranscriptViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FormattedTranscriptData | null;
}

export function TranscriptViewModal({
  isOpen,
  onClose,
  data,
}: TranscriptViewModalProps) {
  const [isPrintMode, setIsPrintMode] = useState(false);

  if (!isOpen || !data) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-3xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 text-white flex items-center justify-between border-b border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 text-emerald-300">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    {data.tenantName}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                      data.statusBadgeClass
                    )}
                  >
                    {data.isLocked && <Lock className="w-3 h-3 inline mr-1" />}
                    {data.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Transkrip Nilai Rapor Santri
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Student Info Card */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">
                  Nama Santri
                </span>
                <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  {data.santriName}
                </span>
              </div>
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">
                  NIS
                </span>
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {data.nis}
                </span>
              </div>
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">
                  Kelas
                </span>
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {data.kelas}
                </span>
              </div>
              <div>
                <span className="text-xs text-stone-500 dark:text-stone-400 block font-medium">
                  Tahun Ajaran / Term
                </span>
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {data.academicYearName} ({data.academicTermName})
                </span>
              </div>
            </div>

            {/* Score & Predicate Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Nilai Akhir Rapor
                  </span>
                  <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">
                    {data.formattedFinalScore}
                  </div>
                </div>
                <Sparkles className="w-8 h-8 text-emerald-500/40" />
              </div>

              <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Predikat Hasil Belajar
                  </span>
                  <div className="mt-1">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-xl text-base font-extrabold border',
                        data.predicateBadgeClass
                      )}
                    >
                      {data.predicate}
                    </span>
                  </div>
                </div>
                <Award className="w-8 h-8 text-amber-500/40" />
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Rincian Komponen Ledger Penilaian
                </h4>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  Single Source of Truth (Academic Ledger Engine)
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-stone-200 dark:border-stone-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-100 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 font-semibold border-b border-stone-200 dark:border-stone-800">
                    <tr>
                      <th className="py-3 px-4">Kelompok Sumber Penilaian</th>
                      <th className="py-3 px-4 text-center">Nilai Mentah</th>
                      <th className="py-3 px-4 text-center">Nilai Terbobot</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                    {data.records.length > 0 ? (
                      data.records.map((rec, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-medium">
                            {rec.sourceGroupLabel}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-stone-600 dark:text-stone-400">
                            {rec.formattedRawScore}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                            {rec.formattedWeightedScore}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-6 text-center text-stone-500 dark:text-stone-400 italic"
                        >
                          Belum ada rekaman ledger untuk semester ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <span className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Verified Architecture v1.0 Locked
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPrintMode(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Cetak Rapor (PDF)
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-sm transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print PDF Overlay Component */}
      {isPrintMode && (
        <PrintReportCardPDF
          data={data}
          onClose={() => setIsPrintMode(false)}
        />
      )}
    </>
  );
}
