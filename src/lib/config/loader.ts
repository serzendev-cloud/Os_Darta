// Runtime config loader. Source priority: Firestore → env → defaults.
// No business logic — pure config resolution.

import { appConfigService } from '@/lib/firebase/services/appConfig';
import { getCached, setCache } from './cache';
import type { ConfigLoadResult, ConfigSource } from './types';

/** Deep merge overrides into defaults. Overrides can be partial — missing keys keep defaults. */
export function mergeDefaults<T>(
  defaults: T,
  overrides: Partial<T> | null | undefined,
): T {
  if (!overrides) return { ...defaults };

  const result = { ...defaults } as Record<string, unknown>;

  for (const key of Object.keys(defaults as Record<string, unknown>)) {
    const overrideVal = (overrides as Record<string, unknown>)[key];
    const defaultVal = (defaults as Record<string, unknown>)[key];

    if (overrideVal === undefined) continue;

    if (isPlainObject(defaultVal) && isPlainObject(overrideVal)) {
      result[key] = mergeDefaults(defaultVal, overrideVal);
    } else {
      result[key] = overrideVal;
    }
  }

  return result as T;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

/** Apply environment variable overrides (NEXT_PUBLIC_* prefixed keys only). */
function applyEnvOverrides<T>(config: T): T {
  const result = { ...config } as Record<string, unknown>;

  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    const maintenance = result['maintenance'] as Record<string, unknown> | undefined;
    if (maintenance) {
      maintenance['enabled'] = true;
      if (process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE) {
        maintenance['message'] = process.env.NEXT_PUBLIC_MAINTENANCE_MESSAGE;
      }
    }
  }

  return result as T;
}

/**
 * Load configuration with source priority:
 * 1. Firestore appConfig/settings (if reachable)
 * 2. Environment variable overrides (NEXT_PUBLIC_*)
 * 3. TypeScript defaults (hardcoded fallback)
 *
 * Never throws — returns defaults on any failure.
 */
export async function loadConfig<T>(
  configKey: string,
  defaults: T,
): Promise<ConfigLoadResult<T>> {
  // Check cache first
  const cached = getCached<ConfigLoadResult<T>>(configKey);
  if (cached) return cached;

  let source: ConfigSource = 'defaults';
  let merged = { ...defaults };

  try {
    const firestoreConfig = await appConfigService.get();
    if (firestoreConfig) {
      const raw = firestoreConfig as unknown as Record<string, unknown>;
      const section = raw[configKey] as Partial<T> | undefined;
      if (section) {
        merged = mergeDefaults(defaults, section);
        source = 'firestore';
      }
    }
  } catch {
    // Firestore unreachable — fall through to env/defaults
    console.warn(`[loadConfig] Firestore unreachable for "${configKey}", using defaults`);
  }

  // Apply environment overrides on top (highest priority after Firestore)
  merged = applyEnvOverrides(merged);

  const result: ConfigLoadResult<T> = { config: merged, source };
  setCache(configKey, result);
  return result;
}
