'use client';

import { PageCard } from '@/components/shared/page-header';
import { Wrench } from 'lucide-react';

export default function MaintenanceSettingsPage() {
  return (
    <div className="space-y-6">
      <PageCard title="Maintenance" description="Mode pemeliharaan sistem dan pengaturan downtime">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-muted/50">
            <Wrench className="w-12 h-12 text-muted-foreground/40" />
          </div>
          <p className="text-sm text-muted-foreground">Modul Maintenance — Coming Soon</p>
        </div>
      </PageCard>
    </div>
  );
}
