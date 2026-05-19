'use client';

import { PageCard } from '@/components/shared/page-header';
import { Link2 } from 'lucide-react';

export default function IntegrasiPage() {
  return (
    <div className="space-y-6">
      <PageCard title="Integrasi" description="Pengaturan integrasi dengan sistem eksternal dan API">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-muted/50">
            <Link2 className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Modul Integrasi — Coming Soon</p>
        </div>
      </PageCard>
    </div>
  );
}
