import { type ReactNode } from 'react';
import { AuthProvider } from './auth-provider';
import { DensityProvider } from './density-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DensityProvider>
        {children}
      </DensityProvider>
    </AuthProvider>
  );
}
