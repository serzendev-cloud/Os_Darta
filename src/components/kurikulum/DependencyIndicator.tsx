'use client';

import { Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DependencyIndicatorProps {
  title: string;
  unmetDependencyNames: string[];
  targetTabKey?: string;
  onNavigateToDependency?: (tabKey: string) => void;
  className?: string;
}

export function DependencyIndicator({
  title,
  unmetDependencyNames,
  targetTabKey = 'mapel',
  onNavigateToDependency,
  className,
}: DependencyIndicatorProps) {
  if (!unmetDependencyNames || unmetDependencyNames.length === 0) return null;

  return (
    <div
      className={cn(
        'p-6 rounded-3xl bg-amber-500/10 dark:bg-amber-950/30 border-2 border-amber-500/40 text-stone-900 dark:text-stone-100 space-y-4 shadow-lg backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
              Urutan Konfigurasi Membutuhkan Tindakan
            </span>
          </div>

          <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
            Fitur &quot;{title}&quot; Belum Dapat Dikonfigurasi
          </h3>

          <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
            Selesaikan modul berikut terlebih dahulu untuk membuka akses pengaturan detail pada domain ini:
          </p>

          <ul className="pt-2 space-y-1">
            {unmetDependencyNames.map((name, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Belum Lengkap: {name}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {onNavigateToDependency && (
        <div className="pt-3 border-t border-amber-500/20 flex items-center justify-end">
          <button
            type="button"
            onClick={() => onNavigateToDependency(targetTabKey)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95"
          >
            <span>Selesaikan &quot;{unmetDependencyNames[0] || 'Prasyarat'}&quot; Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
