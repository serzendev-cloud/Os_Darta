import { JenjangGroup, Kelas } from '@/data/mock-kelas';
import type { Instansi } from '@/types';
import { KelasCard } from './KelasCard';
import { getTingkatLabel } from '@/lib/progression-label';
import { cn } from '@/lib/utils';

interface KelasClusterSectionProps {
  jenjangGroups: JenjangGroup[];
  activeInstansi: Instansi;
  onEdit: (kelas: Kelas) => void;
  onDelete: (kelas: Kelas) => void;
}

export function KelasClusterSection({ jenjangGroups, activeInstansi, onEdit, onDelete }: KelasClusterSectionProps) {
  if (jenjangGroups.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm" role="status" aria-live="polite">
        Belum ada data kelas untuk program ini.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {jenjangGroups.map((jenjangGroup) => (
        <div key={`${activeInstansi}-${jenjangGroup.jenjang}`} className="space-y-8 animate-in fade-in duration-300">

          {/* ── Jenjang header ── */}
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 shadow-sm backdrop-blur-md">
              <h2 className="text-xs font-extrabold text-amber-700 dark:text-amber-300 tracking-widest uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Jenjang {jenjangGroup.jenjang}</span>
              </h2>
            </div>
            <div className="flex-1 h-[2px] bg-gradient-to-r from-amber-500/40 via-amber-400/20 to-transparent" />
          </div>

          {/* ── Tingkat groups ── */}
          <div className="space-y-10">
            {jenjangGroup.tingkatGroups.map((tingkatGroup) => {
              const label = getTingkatLabel(jenjangGroup.jenjang, tingkatGroup.tingkat);
              return (
                <div key={tingkatGroup.tingkat} className="space-y-6">
                  {/* Tingkat divider */}
                  <div className="flex items-center gap-4 my-3">
                    <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-stone-300 dark:via-stone-700 to-amber-500/60" />
                    
                    <div className="px-5 py-1.5 rounded-full border border-stone-200/90 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-md shadow-stone-200/50 dark:shadow-none backdrop-blur-md shrink-0 max-w-[80%] text-center transition-all hover:scale-105">
                      <h3 className="text-xs font-black text-stone-800 dark:text-stone-100 tracking-wider flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span>{label}</span>
                      </h3>
                    </div>

                    <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-stone-300 dark:via-stone-700 to-amber-500/60" />
                  </div>

                  {/* Card grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {tingkatGroup.classes.map((kelas) => (
                      <KelasCard
                        key={kelas.id}
                        kelas={kelas}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
