'use client';

import { useEffect, useState, useRef, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/auth-store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const syncUser = useAuthStore((state) => state.syncUser);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    const supabase = createClient();

    // 1. Initial Session Hydration (Fail-Closed)
    async function hydrateSession() {
      try {
        const { data } = await supabase.auth.getUser();
        if (isMountedRef.current) {
          syncUser(data?.user ?? null);
        }
      } catch {
        if (isMountedRef.current) {
          syncUser(null);
        }
      } finally {
        if (isMountedRef.current) {
          setReady(true);
        }
      }
    }

    hydrateSession();

    // 2. Auth State Change Listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMountedRef.current) return;

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED':
          syncUser(session?.user ?? null);
          break;
        case 'SIGNED_OUT':
          syncUser(null);
          break;
        default:
          break;
      }
    });

    // 3. Strict Cleanup on Unmount
    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [syncUser]);

  // Block rendering until initial session state is determined to prevent hydration flicker
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
