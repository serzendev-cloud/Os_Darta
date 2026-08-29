'use client';

import React from 'react';
import type { TenantContext } from '@/lib/tenant/context';
import { TenantPortalHeader } from './TenantPortalHeader';
import { TenantPortalHero } from './TenantPortalHero';
import { TenantPortalProfile } from './TenantPortalProfile';
import { TenantPortalPrograms } from './TenantPortalPrograms';
import { TenantPortalAchievements } from './TenantPortalAchievements';
import { TenantPortalInfoNews } from './TenantPortalInfoNews';
import { TenantPortalContactFooter } from './TenantPortalContactFooter';

interface TenantPortalClientProps {
  tenant: TenantContext;
}

export function TenantPortalClient({ tenant }: TenantPortalClientProps) {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Header Navigation */}
      <TenantPortalHeader tenant={tenant} />

      {/* Main Public Content Sections */}
      <main>
        <TenantPortalHero tenant={tenant} />
        <TenantPortalProfile tenant={tenant} />
        <TenantPortalPrograms tenant={tenant} />
        <TenantPortalAchievements tenant={tenant} />
        <TenantPortalInfoNews tenant={tenant} />
      </main>

      {/* Footer & Contact */}
      <TenantPortalContactFooter tenant={tenant} />
    </div>
  );
}
