'use client';

import { PageCard } from '@/components/shared/page-header';
import { ClipboardCheck } from 'lucide-react';

export default function PenilaianPage() {
  return (
    <div className="space-y-6">
      <PageCard title="Penilaian" description="Input nilai, ujian, dan evaluasi akademik formal">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-muted/50">
            <ClipboardCheck className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Modul Penilaian — Coming Soon</p>
        </div>
      </PageCard>
    </div>
  );
}
