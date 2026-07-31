'use client';

import type { ReadinessDomain } from '@/lib/curriculum/readiness';
import { 
  CheckCircle2, 
  Circle, 
  Lock, 
  Clock, 
  ChevronRight, 
  Sparkles,
  Settings,
  GraduationCap,
  BookOpen,
  Target,
  FileText,
  Award,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Settings,
  GraduationCap,
  BookOpen,
  Target,
  FileText,
  Award,
  Calendar,
};

interface CurriculumChecklistProps {
  domains: ReadinessDomain[];
  activeTab?: string;
  onSelectTab?: (tabKey: string) => void;
  className?: string;
}

export function CurriculumChecklist({
  domains,
  activeTab,
  onSelectTab,
  className,
}: CurriculumChecklistProps) {
  return (
    <div
      className={cn(
        'p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-extrabold text-stone-900 dark:text-white">
            Guided Curriculum Checklist
          </h3>
        </div>
        <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-full">
          Panduan Urutan Workflow
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {domains.map((domain, index) => {
          const Icon = iconMap[domain.icon] || Settings;
          const isSelected = activeTab === domain.tabKey;
          const isClickable = Boolean(domain.isAvailable && domain.tabKey && onSelectTab);

          return (
            <button
              key={domain.id}
              type="button"
              disabled={!isClickable}
              onClick={() => domain.tabKey && onSelectTab?.(domain.tabKey)}
              className={cn(
                'p-3 rounded-2xl text-left border transition-all duration-200 flex flex-col justify-between space-y-2 relative overflow-hidden group',
                isSelected
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/80 shadow-sm ring-2 ring-amber-500/20'
                  : domain.isComplete
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900/50 hover:bg-emerald-100/50'
                  : domain.isAvailable
                  ? 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                  : 'bg-stone-100/60 dark:bg-stone-900/40 border-stone-200/60 dark:border-stone-800 opacity-60 cursor-not-allowed'
              )}
            >
              {/* Top Row: Index badge & Status Icon */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-mono font-bold text-stone-400">
                  0{index + 1}
                </span>

                {domain.isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : !domain.isAvailable ? (
                  <span title="Coming Soon"><Clock className="w-3.5 h-3.5 text-stone-400" /></span>
                ) : domain.dependencies.length > 0 && !domain.isComplete ? (
                  <Circle className="w-4 h-4 text-amber-500" />
                ) : (
                  <Circle className="w-4 h-4 text-stone-300 dark:text-stone-600" />
                )}
              </div>

              {/* Icon & Label */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      'w-3.5 h-3.5 shrink-0',
                      domain.isComplete
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : isSelected
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-stone-500'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs font-bold truncate block',
                      domain.isComplete
                        ? 'text-stone-900 dark:text-white'
                        : isSelected
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-stone-700 dark:text-stone-300'
                    )}
                  >
                    {domain.label}
                  </span>
                </div>

                <p className="text-[10px] text-stone-600 dark:text-stone-400 line-clamp-1">
                  {!domain.isAvailable
                    ? 'Coming Soon'
                    : domain.isComplete
                    ? 'Lengkap'
                    : 'Perlu Pengaturan'}
                </p>
              </div>

              {/* Interactive Chevron indicator */}
              {isClickable && (
                <div className="flex items-center justify-end text-stone-400 group-hover:text-amber-600 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
