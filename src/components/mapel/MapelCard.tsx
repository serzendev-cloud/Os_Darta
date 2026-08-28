import { MoreVertical, Edit2, Trash2, Users } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { Subject } from '@/data/mock-mapel';
import { getTingkatLabel } from '@/lib/progression-label';
import { cn } from '@/lib/utils';

interface MapelCardProps {
  subject: Subject;
  teacherSummary?: string;
  onAssign?: (subject: Subject) => void;
  onEdit?: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
}

const actionBtn = cn(
  'p-2.5 rounded-xl text-muted-foreground/70 min-h-[44px] min-w-[44px] flex items-center justify-center border border-border/50',
  'transition-all duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
);

export function MapelCard({ subject, teacherSummary, onAssign, onEdit, onDelete }: MapelCardProps) {
  return (
    <div className={cn(
      'group relative flex flex-col justify-between gap-4',
      'bg-card border border-border rounded-2xl p-5 shadow-sm',
      'hover:border-primary/30 hover:shadow-md',
      'transition-all duration-300',
    )}>
      <div className="relative z-10 flex justify-between items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {subject.code && (
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase bg-muted px-2.5 py-1 rounded-lg border border-border">
                {subject.code}
              </span>
            )}
            <span className="text-[10px] font-bold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-lg border border-border">
              {subject.jenjang} / {getTingkatLabel(subject.jenjang, subject.tingkat)}
            </span>
            <StatusBadge status={subject.status} variant="success" />
          </div>
          <h4 className={cn(
            'text-base font-extrabold leading-snug text-foreground',
            'group-hover:text-primary transition-colors duration-200',
            'line-clamp-2',
          )}>
            {subject.name}
          </h4>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between pt-3 border-t border-border gap-2">
        <button
          type="button"
          onClick={() => onAssign?.(subject)}
          disabled={!onAssign}
          className={cn(
            'flex items-center gap-2 text-xs font-bold text-muted-foreground px-3 py-2 rounded-xl bg-muted/60 min-h-[44px]',
            onAssign && 'hover:text-primary hover:bg-primary/10 transition-all',
          )}
          title={onAssign ? 'Atur distribusi guru' : undefined}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span className="truncate">{teacherSummary ?? 'Belum ada guru'}</span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            aria-label={`Edit mata pelajaran ${subject.name}`}
            title="Edit mata pelajaran"
            onClick={() => onEdit?.(subject)}
            disabled={!onEdit}
            className={cn(actionBtn, 'hover:bg-primary/10 hover:text-primary')}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label={`Hapus mata pelajaran ${subject.name}`}
            title="Hapus mata pelajaran"
            onClick={() => onDelete?.(subject)}
            disabled={!onDelete}
            className={cn(
              actionBtn,
              'hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 border-red-500/20',
            )}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
