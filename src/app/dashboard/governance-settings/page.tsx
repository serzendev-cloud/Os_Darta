'use client';

import { PageCard } from '@/components/shared/page-header';
import { Gavel } from 'lucide-react';

export default function GovernanceSettingsPage() {
  return (
    <div className="space-y-6">
      <PageCard title="Governance Settings" description="Konfigurasi aturan tata tertib, eskalasi, dan kebijakan">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-muted/50">
            <Gavel className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Modul Governance Settings — Coming Soon</p>
        </div>
      </PageCard>
    </div>
  );
}
