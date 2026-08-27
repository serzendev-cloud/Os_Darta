import { create } from 'zustand';

export type DensityMode = 'comfortable' | 'standard' | 'compact';

interface DensityState {
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
}

export const useDensityStore = create<DensityState>((set) => ({
  density: 'standard',
  setDensity: (density) => {
    const validModes: DensityMode[] = ['comfortable', 'standard', 'compact'];
    const safeDensity = validModes.includes(density) ? density : 'standard';

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mahad-ui-density', safeDensity);
        document.documentElement.setAttribute('data-density', safeDensity);
      } catch (e) {
        console.error('[DensityStore] Failed to write to localStorage:', e);
      }
    }
    set({ density: safeDensity });
  },
}));
