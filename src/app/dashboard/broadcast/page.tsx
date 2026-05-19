'use client';

import { PageCard } from '@/components/shared/page-header';
import { Radio } from 'lucide-react';

export default function BroadcastPage() {
  return (
    <div className="space-y-6">
      <PageCard title="Broadcast Informasi" description="Siaran informasi massal ke seluruh warga pesantren">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-muted/50">
            <Radio className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Modul Broadcast — Coming Soon</p>
        </div>
      </PageCard>
    </div>
  );
}
