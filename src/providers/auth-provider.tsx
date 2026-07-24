'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { isDemoMode } from '@/lib/firebase/demo-data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // If in demo mode or Firebase unconfigured, mark ready immediately
    if (isDemoMode()) {
      setReady(true);
      return;
    }

    try {
      // Lazy load firebase auth listener if configured
      import('@/lib/firebase/auth').then(({ authService }) => {
        const unsubscribe = authService.onAuthChanged((user, fbUser) => {
          if (user) {
            useAuthStore.setState({
              user,
              firebaseUser: fbUser,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            useAuthStore.setState({
              user: null,
              firebaseUser: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
          setReady(true);
        });
        return () => unsubscribe();
      }).catch(() => {
        setReady(true);
      });
    } catch {
      setReady(true);
    }
  }, []);

  // Block rendering until auth state is determined
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
