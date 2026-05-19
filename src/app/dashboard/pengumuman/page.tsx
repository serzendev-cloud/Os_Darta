'use client';

import { PageCard } from '@/components/shared/page-header';
import { Megaphone } from 'lucide-react';

export default function PengumumanPage() {
  return (
    <div className="space-y-6">
      <PageCard title="Pengumuman" description="Papan pengumuman dan informasi pesantren">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-muted/50">
            <Megaphone className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Modul Pengumuman — Coming Soon</p>
        </div>
      </PageCard>
    </div>
  );
}
