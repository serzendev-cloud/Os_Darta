'use client';

import { PageCard } from '@/components/shared/page-header';
import { FileSearch } from 'lucide-react';

export default function EvaluasiPage() {
  return (
    <div className="space-y-6">
      <PageCard title="Evaluasi" description="Evaluasi akademik pesantren — Madin dan MadQur">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-muted/50">
            <FileSearch className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Modul Evaluasi — Coming Soon</p>
        </div>
      </PageCard>
    </div>
  );
}
