// React hook for subscribing to runtime config with loading state.
// Uses subscribeToConfig — auto-unsubscribes on unmount.

import { useState, useEffect, useRef } from 'react';
import { subscribeToConfig } from '@/lib/config/subscription';
import type { ConfigLoadResult } from '@/lib/config/types';

export function useConfig<T>(
  configKey: string,
  defaults: T,
): ConfigLoadResult<T> & { isLoading: boolean } {
  const [result, setResult] = useState<ConfigLoadResult<T>>({
    config: defaults,
    source: 'defaults',
  });
  const [isLoading, setIsLoading] = useState(true);
  const defaultsRef = useRef(defaults);

  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = subscribeToConfig<T>(configKey, defaultsRef.current, (newResult) => {
      setResult(newResult);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [configKey]);

  return { ...result, isLoading };
}
