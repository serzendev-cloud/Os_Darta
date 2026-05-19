'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { MaintenanceConfig } from '@/types';

interface Props {
  config: MaintenanceConfig;
  /** When true, indicates the user has bypass access */
  isBypass?: boolean;
}

export function MaintenanceBanner({ config, isBypass }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-sm">
      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <span className="flex-1">
        {isBypass ? (
          <>
            <strong>Maintenance Mode aktif</strong> &mdash; Anda melihat ini karena akses bypass.
            {config.message && <> Pesan: {config.message}</>}
          </>
        ) : (
          <>
            <strong>Sistem dalam pemeliharaan.</strong>
            {config.message && <> {config.message}</>}
            {config.estimatedEndAt && (
              <> Perkiraan selesai: {new Date(config.estimatedEndAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</>
            )}
          </>
        )}
      </span>
      <button type="button" onClick={() => setDismissed(true)} className="shrink-0 p-0.5 hover:bg-amber-200 dark:hover:bg-amber-800/50 rounded transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
