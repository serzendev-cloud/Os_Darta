'use client';

import { PageCard } from '@/components/shared/page-header';
import { ScrollText } from 'lucide-react';

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <PageCard title="Audit Log" description="Jejak audit sistem — siapa melakukan apa dan kapan">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-muted/50">
            <ScrollText className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Modul Audit Log — Coming Soon</p>
        </div>
      </PageCard>
    </div>
  );
}
