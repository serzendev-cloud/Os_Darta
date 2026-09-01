'use client';

import { useEffect, useState } from 'react';
import { isDemoMode, getDemoCollection } from '@/lib/mock-store';

export function useDocument<T>(
  collectionName: string,
  id: string | null,
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    const items = getDemoCollection(collectionName) as Array<{ id: string } & T>;
    const found = items.find((item) => item.id === id) || null;
    setData(found as T | null);
    setLoading(false);
  }, [collectionName, id]);

  return { data, loading, error };
}
