import { Library, BookOpen, Landmark } from 'lucide-react';
import type { Instansi } from '@/types';
import { INSTANSI_ORDER, INSTANSI_LABEL } from '@/types';

const INSTANSI_ICONS: Record<Instansi, typeof Library> = {
  madin: BookOpen,
  madqur: Landmark,
  depag: Library,
};

interface Props {
  activeInstansi: Instansi;
  onTabChange: (instansi: Instansi) => void;
  allowedInstansi?: Instansi[];
}

export function MapelTabs({ activeInstansi, onTabChange, allowedInstansi }: Props) {
  const displayedInstansi = allowedInstansi && allowedInstansi.length > 0
    ? INSTANSI_ORDER.filter((instansi) => allowedInstansi.includes(instansi))
    : INSTANSI_ORDER;

  return (
    <div className="flex p-1 bg-muted/50 border border-border rounded-xl w-full sm:w-fit overflow-x-auto hide-scrollbar">
      <div className="flex min-w-max gap-1">
        {displayedInstansi.map((instansi) => {
          const Icon = INSTANSI_ICONS[instansi];
          const isActive = activeInstansi === instansi;
          return (
            <button
              key={instansi}
              type="button"
              onClick={() => onTabChange(instansi)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all min-h-[44px] ${
                isActive
                  ? 'bg-background shadow-sm text-foreground border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span>{INSTANSI_LABEL[instansi]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
