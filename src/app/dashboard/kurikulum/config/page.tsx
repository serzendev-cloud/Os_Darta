'use client';

import { CurriculumConfigClient } from '@/components/kurikulum/CurriculumConfigClient';
import { Suspense } from 'react';

export default function DedicatedCurriculumConfigQueryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-8 bg-sky-50/50">
        <div className="p-6 rounded-2xl bg-white shadow-xl border border-amber-500/30 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-4 border-amber-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-bold text-stone-700">Memuat Konfigurasi Program Kurikulum...</p>
        </div>
      </div>
    }>
      <CurriculumConfigClient />
    </Suspense>
  );
}
