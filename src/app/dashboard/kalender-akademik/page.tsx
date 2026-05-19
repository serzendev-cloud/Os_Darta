'use client';

import { PageCard } from '@/components/shared/page-header';
import { Calendar } from 'lucide-react';

export default function KalenderAkademikPage() {
  return (
    <div className="space-y-6">
      <PageCard title="Kalender Akademik" description="Kalender akademik formal — jadwal ujian, tenggat semester, hari libur">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-muted/50">
            <Calendar className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Modul Kalender Akademik — Coming Soon</p>
        </div>
      </PageCard>
    </div>
  );
}
