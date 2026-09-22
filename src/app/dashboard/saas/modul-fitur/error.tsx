'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ModulFiturError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ModulFiturError Boundary Captured]:', error);
  }, [error]);

  return (
    <div className="p-8 max-w-2xl mx-auto my-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-xl text-center space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-bold text-stone-900 dark:text-white">
          Gagal Memuat Konfigurasi Modul Fitur
        </h2>
        <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
          Terjadi kesalahan saat memproses data modul tenant. Dashboard sistem tetap aman dan Anda dapat mencoba memuat ulang halaman ini.
        </p>
        {error.message && (
          <p className="text-[11px] font-mono text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-900/40 inline-block">
            {error.message}
          </p>
        )}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Coba Muat Ulang</span>
        </button>
      </div>
    </div>
  );
}
