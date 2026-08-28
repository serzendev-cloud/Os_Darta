import { GripVertical, Users, Edit2, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { Subject } from '@/data/mock-mapel';
import { cn } from '@/lib/utils';

interface Props {
  subjects: Subject[];
  teacherSummaryMap?: Record<string, string>;
  draggedSubject: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onAssign?: (subject: Subject) => void;
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}

const actionBtn = cn(
  'p-2.5 rounded-xl text-muted-foreground/70 min-h-[44px] min-w-[44px] flex items-center justify-center border border-border/50',
  'transition-all duration-200',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
);

export function MapelListView({
  subjects, teacherSummaryMap, draggedSubject,
  onDragStart, onDragOver, onDrop,
  onAssign, onEdit, onDelete,
}: Props) {
  return (
    <div className="space-y-2">
      {subjects.map((subject) => {
        const isDragged = draggedSubject === subject.id;

        return (
          <div
            key={subject.id}
            draggable
            onDragStart={(e) => onDragStart(e, subject.id)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, subject.id)}
            className={cn(
              'group flex flex-col sm:flex-row sm:items-center justify-between p-3.5',
              'bg-card border rounded-2xl shadow-sm',
              'transition-all duration-200',
              isDragged
                ? 'opacity-50 border-primary/50 border-dashed bg-primary/5'
                : 'border-border hover:border-primary/30 hover:bg-muted/40',
            )}
          >
            {/* Left: drag handle + badge + name + code */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'cursor-grab active:cursor-grabbing shrink-0',
                  'p-2 rounded-lg text-muted-foreground/50',
                  'hover:text-muted-foreground hover:bg-muted',
                  'transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center',
                )}
                title="Drag untuk mengubah urutan"
                role="img"
                aria-label="Handle drag reorder"
              >
                <GripVertical className="w-4 h-4" />
              </div>

              <StatusBadge status={subject.status} variant="success" />

              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                <h4 className="font-extrabold text-sm text-foreground line-clamp-1">
                  {subject.name}
                </h4>
                <span className="text-[10px] sm:text-xs text-muted-foreground font-mono bg-muted px-2.5 py-1 rounded-lg border border-border w-fit shrink-0 font-bold">
                  {subject.code}
                </span>
              </div>
            </div>

            {/* Right: teacher count + action buttons */}
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border">
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
                <span>{teacherSummaryMap?.[subject.id] ?? 'Belum ada guru'}</span>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  aria-label={`Edit mata pelajaran ${subject.name}`}
                  title="Edit mata pelajaran"
                  onClick={() => onEdit(subject)}
                  className={cn(actionBtn, 'hover:bg-primary/10 hover:text-primary')}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Hapus mata pelajaran ${subject.name}`}
                  title="Hapus mata pelajaran"
                  onClick={() => onDelete(subject)}
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
      })}
    </div>
  );
}
