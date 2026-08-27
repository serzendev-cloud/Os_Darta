import { useDensityStore } from '@/store/density-store';

export function useDensity() {
  const density = useDensityStore((s) => s.density);
  const setDensity = useDensityStore((s) => s.setDensity);
  return { density, setDensity };
}
