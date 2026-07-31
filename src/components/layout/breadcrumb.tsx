'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStoredCurriculums } from '@/lib/store/curriculum-store';
import { useEffect, useState } from 'react';

const routeLabels: Record<string, string> = {
  dashboard: 'Administrator',
  santri: 'Data Santri',
  asrama: 'Asrama',
  'master-pelanggaran': 'Master Pelanggaran',
  pelanggaran: 'Pelanggaran',
  hukuman: 'Hukuman',
  quest: 'Quest & Pemutihan',
  monitoring: 'Monitoring',
  notifikasi: 'Notifikasi',
  pengaturan: 'Pengaturan',
  // Academic Configuration Center Enhancements
  kurikulum: 'Program Akademik',
  master: 'Pustaka Program',
  config: 'Kelola Kurikulum',
  'struktur-akademik': 'Struktur Akademik',
  mapel: 'Mata Pelajaran',
  'distribusi-guru': 'Distribusi Guru',
  penilaian: 'Sistem Penilaian',
  'kalender-akademik': 'Kalender Akademik',
  evaluasi: 'Evaluasi',
  raport: 'Raport',
  kelas: 'Rombel Kelas',
  guru: 'Data Guru',
  import: 'Import Batch',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [programName, setProgramName] = useState<string | null>(null);

  useEffect(() => {
    const progId = searchParams?.get('id') || searchParams?.get('prog');
    if (progId) {
      const list = getStoredCurriculums();
      const found = list.find((p) => p.id === progId);
      if (found) {
        setProgramName(found.name);
        return;
      }
    }
    setProgramName(null);
  }, [searchParams, pathname]);

  const segments = pathname?.split('/').filter(Boolean) || [];

  const items = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    let label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

    // If segment is config and we have a specific program, enrich label or append program name
    if (segment === 'config' && programName) {
      label = `Kelola Kurikulum (${programName})`;
    }

    return { label, href: index === segments.length - 1 ? undefined : href };
  });

  if (items.length <= 1) return null;

  return (
    <nav className="flex items-center text-xs text-muted-foreground mb-4 overflow-x-auto py-1" aria-label="Breadcrumb">
      <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1 font-semibold">
        <Home className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span>Administrator</span>
      </Link>

      {items.slice(1).map((item, index) => (
        <div key={index} className="flex items-center whitespace-nowrap">
          <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-stone-400 dark:text-stone-600 shrink-0" />
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground transition-colors font-medium">
              {item.label}
            </Link>
          ) : (
            <span className={cn('text-foreground font-extrabold text-amber-700 dark:text-amber-400')}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
