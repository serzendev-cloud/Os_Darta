// Real-time config subscription. Uses Firestore onSnapshot or demoDb subscribe.
// Auto-invalidates cache on change.

import { appConfigService } from '@/lib/firebase/services/appConfig';
import { mergeDefaults } from './loader';
import { invalidateCache, setCache } from './cache';
import type { AppConfig, ConfigLoadResult } from './types';

/**
 * Subscribe to runtime config changes. Calls onUpdate whenever config changes in Firestore.
 * Returns unsubscribe function. Safe to call multiple times — each gets its own subscription.
 */
export function subscribeToConfig<T>(
  configKey: string,
  defaults: T,
  onUpdate: (result: ConfigLoadResult<T>) => void,
): () => void {
  const handleConfig = (appConfig: AppConfig | null) => {
    const section = appConfig
      ? ((appConfig as unknown as Record<string, unknown>)[configKey] as Partial<T> | undefined)
      : undefined;

    const merged = section ? mergeDefaults(defaults, section) : { ...defaults };

    const result: ConfigLoadResult<T> = {
      config: merged,
      source: section ? 'firestore' : 'defaults',
    };

    setCache(configKey, result);
    onUpdate(result);
  };

  return appConfigService.subscribe((appConfig) => {
    try {
      handleConfig(appConfig);
    } catch (err) {
      console.warn(`[subscribeToConfig] Error handling config update for "${configKey}":`, err);
    }
  });
}

/** Invalidate cached config for a key and re-resolve. */
export function refreshConfig(configKey: string): void {
  invalidateCache(configKey);
}
