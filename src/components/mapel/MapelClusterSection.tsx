import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getTingkatLabel } from '@/lib/progression-label';

interface Props {
  tingkat: number;
  jenjang: string;
  classNames?: string;
  distribusiHref?: string;
  children: ReactNode;
}

export function MapelClusterSection({ tingkat, jenjang, classNames, distribusiHref, children }: Props) {
  const tingkatLabel = getTingkatLabel(jenjang, tingkat);
  const pill = (
    <div className={distribusiHref
      ? 'px-5 py-1.5 rounded-full border border-amber-500/30 bg-amber-50 dark:bg-stone-900 shadow-md shadow-stone-200/50 backdrop-blur-md shrink-0 max-w-[80%] text-center group cursor-pointer hover:bg-amber-100/50 transition-all duration-200'
      : 'px-5 py-1.5 rounded-full border border-stone-200/90 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-md shadow-stone-200/50 dark:shadow-none backdrop-blur-md shrink-0 max-w-[80%] text-center'
    }>
      <h3 className="text-xs font-black text-stone-800 dark:text-stone-100 tracking-wider flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span className="flex items-center gap-1.5">
          <span className="font-semibold">{jenjang}</span>
          <span className="text-stone-400">/</span>
          <span>{tingkatLabel}</span>
        </span>
        {classNames && !distribusiHref && (
          <span className="text-[10px] font-medium text-stone-500 border-l border-stone-200 dark:border-stone-700 pl-2 ml-1 line-clamp-1">
            ({classNames})
          </span>
        )}
        {distribusiHref && (
          <span className="text-[10px] font-semibold text-amber-600 border-l border-amber-200 pl-2 ml-1 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            Distribusi Guru
            <ArrowRight className="w-3 h-3" aria-hidden="true" />
          </span>
        )}
      </h3>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 my-3">
        <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent via-stone-300 dark:via-stone-700 to-amber-500/60" />
        {distribusiHref ? (
          <Link href={distribusiHref} className="shrink-0">
            {pill}
          </Link>
        ) : (
          pill
        )}
        <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent via-stone-300 dark:via-stone-700 to-amber-500/60" />
      </div>
      {children}
    </div>
  );
}
