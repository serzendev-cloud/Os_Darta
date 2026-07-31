'use client';

import { PageCard } from '@/components/shared/page-header';
import { Activity, ShieldCheck, PlayCircle, Users } from 'lucide-react';

export default function OperasionalAkademikPage() {
  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Command Center KBM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Operasional Akademik & Monitoring KBM
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-3xl leading-relaxed">
            Pusat kendali eksekusi harian KBM, pemicu manual aktivasi hari akademik, presensi pengajar berbasis NFC, dan penetapan Guru Badal.
          </p>
        </div>
      </div>

      <PageCard title="Operasional Akademik" description="Command Center KBM Realtime — Sprint 2 Preparation">
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
            <Activity className="w-12 h-12" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
              Modul Operasional Akademik (Command Center KBM)
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Siap diimplementasikan pada <strong>Sprint 2</strong> (Aktivasi KBM manual, Scan NFC Guru, dan Matriks Guru Badal).
            </p>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
