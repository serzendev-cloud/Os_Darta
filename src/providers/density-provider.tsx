'use client';

import { useEffect, type ReactNode } from 'react';
import { useDensityStore, type DensityMode } from '@/store/density-store';

export function DensityProvider({ children }: { children: ReactNode }) {
  const { setDensity } = useDensityStore();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mahad-ui-density') as DensityMode | null;
      const validModes: DensityMode[] = ['comfortable', 'standard', 'compact'];
      
      if (stored && validModes.includes(stored)) {
        setDensity(stored);
        document.documentElement.setAttribute('data-density', stored);
      } else {
        setDensity('standard');
        document.documentElement.setAttribute('data-density', 'standard');
      }
    } catch (e) {
      console.warn('[DensityProvider] Failed to load density from localStorage, falling back to standard:', e);
      setDensity('standard');
      document.documentElement.setAttribute('data-density', 'standard');
    }
  }, [setDensity]);

  return <>{children}</>;
}
