import { LayoutGrid, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onCreate: () => void;
}

export function MapelToolbar({ viewMode, onViewModeChange, onCreate }: Props) {
  return (
    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
      <div className="flex bg-muted p-1 rounded-xl border border-border shrink-0">
        <button
          onClick={() => onViewModeChange('grid')}
          title="Tampilan Grid"
          className={`p-2.5 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
            viewMode === 'grid' ? 'bg-background shadow-sm text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          title="Tampilan List"
          className={`p-2.5 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
            viewMode === 'list' ? 'bg-background shadow-sm text-foreground border border-border' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="w-4 h-4" />
        </button>
      </div>
      <Button className="gap-2 flex-1 sm:flex-none min-h-[44px] px-4 font-bold text-xs" onClick={onCreate}>
        <Plus className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Tambah Mapel</span><span className="sm:hidden">Tambah Mapel</span>
      </Button>
    </div>
  );
}
