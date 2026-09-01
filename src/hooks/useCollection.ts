'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { isDemoMode, getDemoCollection, demoDb } from '@/lib/mock-store';
import { getActiveTenantId } from '@/lib/db/services/tenant-service';

interface UseCollectionOptions {
  realtime?: boolean;
}

export function useCollection<T>(
  collectionName: string,
  constraints: any[] = [],
  options: UseCollectionOptions = {},
): { data: T[]; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const collectionNameRef = useRef(collectionName);
  collectionNameRef.current = collectionName;

  const fetchDemo = useCallback(() => {
    const mock = getDemoCollection(collectionNameRef.current) as T[];
    const activeTenantId = getActiveTenantId();
    // Filter by tenantId if record has tenantId property
    const filtered = mock.filter((item: any) => !item.tenantId || item.tenantId === activeTenantId || item.tenantId === 'default');
    setData([...filtered]);
    setLoading(false);
  }, []);

  const fetchSupabaseApi = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/db/query?collection=${encodeURIComponent(collectionNameRef.current)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${collectionNameRef.current}: ${res.statusText}`);
      }
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        setData(json.data);
      } else {
        // Fallback to local store if DB yields empty during local dev
        fetchDemo();
      }
    } catch (err: any) {
      console.warn(`[useCollection] API fallback to demo store for ${collectionNameRef.current}:`, err);
      fetchDemo();
    } finally {
      setLoading(false);
    }
  }, [fetchDemo]);

  useEffect(() => {
    if (isDemoMode() || typeof window === 'undefined') {
      fetchDemo();

      if (options.realtime) {
        const unsub = demoDb.subscribe((changed) => {
          if (changed === collectionNameRef.current) {
            fetchDemo();
          }
        });
        return () => { unsub(); };
      }
      return;
    }

    fetchSupabaseApi();

    if (options.realtime) {
      const unsub = demoDb.subscribe((changed) => {
        if (changed === collectionNameRef.current) {
          fetchSupabaseApi();
        }
      });
      return () => { unsub(); };
    }
  }, [collectionName, options.realtime, fetchDemo, fetchSupabaseApi]);

  return { data, loading, error };
}
