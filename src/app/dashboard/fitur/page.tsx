'use client';

import { PageCard } from '@/components/shared/page-header';
import { SlidersHorizontal } from 'lucide-react';

export default function FiturPage() {
  return (
    <div className="space-y-6">
      <PageCard title="Feature Toggle" description="Aktifkan dan nonaktifkan modul aplikasi secara runtime">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-muted/50">
            <SlidersHorizontal className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Modul Feature Toggle — Coming Soon</p>
        </div>
      </PageCard>
    </div>
  );
}
