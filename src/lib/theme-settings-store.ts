/**
 * TODO: pindahkan ke kolom theme_preset + theme_options pada baseline skema baru.
 *
 * Modul terisolasi untuk membaca dan menyimpan konfigurasi tema per tenant.
 * Menyimpan data sementara di kolom customBgUrl dengan namespace "theme:".
 * Tidak ada modul lain yang boleh membaca atau menulis prefix "theme:" secara langsung.
 */

import { z } from 'zod';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ThemeSettings, ThemePresetId, MotionPreference } from '@/themes/types';
import { DEFAULT_THEME_SETTINGS, THEME_REGISTRY } from '@/themes/registry';

const THEME_PREFIX = 'theme:';
const MAX_PAYLOAD_LENGTH = 1024; // 1 KB payload safety limit

const VALID_PRESET_IDS = Object.keys(THEME_REGISTRY) as [ThemePresetId, ...ThemePresetId[]];

export const themeSettingsSchema = z.object({
  preset: z.enum(VALID_PRESET_IDS).default(DEFAULT_THEME_SETTINGS.preset),
  goldAccent: z.boolean().default(false),
  neonGlow: z.boolean().default(false),
  ornament: z.boolean().default(true),
  motion: z.enum(['soft', 'standard', 'off'] as const).default('standard'),
  bgUrl: z.string().max(500).nullable().optional(),
  useBrandColor: z.boolean().default(false),
  brandColor: z.string().max(30).nullable().optional(),
}).strip(); // Strips any unknown fields strictly

export { DEFAULT_THEME_SETTINGS };

export interface TenantContextLike {
  id?: string;
  settings?: {
    customBgUrl?: string | null;
    [key: string]: unknown;
  } | null;
}

/**
 * Pure function: Parse raw customBgUrl string safely into validated ThemeSettings.
 */
export function parseThemeSettings(rawValue?: string | null): ThemeSettings {
  if (!rawValue || typeof rawValue !== 'string') {
    return { ...DEFAULT_THEME_SETTINGS };
  }

  if (!rawValue.startsWith(THEME_PREFIX)) {
    // If it's a regular background image URL, preserve it in bgUrl
    return {
      ...DEFAULT_THEME_SETTINGS,
      bgUrl: rawValue || null,
    };
  }

  const payload = rawValue.slice(THEME_PREFIX.length).trim();

  // Enforce payload size limit
  if (payload.length > MAX_PAYLOAD_LENGTH) {
    return { ...DEFAULT_THEME_SETTINGS };
  }

  try {
    const parsedJson = JSON.parse(payload);
    const validated = themeSettingsSchema.parse(parsedJson);

    return {
      preset: validated.preset,
      goldAccent: validated.goldAccent,
      neonGlow: validated.preset === 'islami-sky' ? validated.neonGlow : false,
      ornament: validated.ornament,
      motion: validated.motion as MotionPreference,
      bgUrl: validated.bgUrl || null,
      useBrandColor: validated.useBrandColor ?? false,
      brandColor: validated.brandColor || null,
    };
  } catch {
    // Fail-safe: Any parse/validation error falls back to defaults without throwing
    return { ...DEFAULT_THEME_SETTINGS };
  }
}

/**
 * Pure function: Serializes ThemeSettings and an optional background image URL into "theme:{...}".
 */
export function serializeThemeSettings(
  newSettings: Partial<ThemeSettings>,
  bgUrl?: string | null
): string {
  const merged = {
    preset: newSettings.preset || DEFAULT_THEME_SETTINGS.preset,
    goldAccent: typeof newSettings.goldAccent === 'boolean' ? newSettings.goldAccent : false,
    neonGlow: newSettings.preset === 'islami-sky' && typeof newSettings.neonGlow === 'boolean' ? newSettings.neonGlow : false,
    ornament: typeof newSettings.ornament === 'boolean' ? newSettings.ornament : true,
    motion: newSettings.motion || 'standard',
    bgUrl: bgUrl !== undefined ? bgUrl : (newSettings.bgUrl || null),
    useBrandColor: typeof newSettings.useBrandColor === 'boolean' ? newSettings.useBrandColor : false,
    brandColor: newSettings.brandColor !== undefined ? newSettings.brandColor : null,
  };

  const validated = themeSettingsSchema.parse(merged);
  return `${THEME_PREFIX}${JSON.stringify(validated)}`;
}

/**
 * Pure function: Extracts raw background image URL if present.
 */
export function extractBgUrl(rawValue?: string | null): string | null {
  if (!rawValue || typeof rawValue !== 'string') return null;
  if (!rawValue.startsWith(THEME_PREFIX)) return rawValue;

  try {
    const parsed = JSON.parse(rawValue.slice(THEME_PREFIX.length));
    return typeof parsed.bgUrl === 'string' && parsed.bgUrl.length > 0 ? parsed.bgUrl : null;
  } catch {
    return null;
  }
}

/**
 * Extracts and parses theme settings safely from a tenant context.
 * Falls back gracefully to default theme settings if payload is missing, corrupt, or exceeds 1KB.
 */
export function getThemeSettings(tenantCtx?: TenantContextLike | null): ThemeSettings {
  if (!tenantCtx || !tenantCtx.settings || !tenantCtx.settings.customBgUrl) {
    return { ...DEFAULT_THEME_SETTINGS };
  }
  return parseThemeSettings(tenantCtx.settings.customBgUrl);
}

/**
 * Persists theme settings for a tenant into tenant_settings table.
 * Preserves existing custom background image URL (bgUrl) if present.
 * Encodes the payload with the "theme:" namespace.
 */
export async function saveThemeSettings(
  tenantId: string,
  newSettings: Partial<ThemeSettings>,
  existingCustomBgUrl?: string | null
): Promise<void> {
  if (!tenantId) {
    throw new Error('Tenant ID is required to save theme settings');
  }

  const currentBgUrl = extractBgUrl(existingCustomBgUrl);
  const resolvedBgUrl = newSettings.bgUrl !== undefined ? newSettings.bgUrl : currentBgUrl;

  const serialized = serializeThemeSettings(newSettings, resolvedBgUrl);

  if (serialized.length > MAX_PAYLOAD_LENGTH + 20) {
    throw new Error('Theme settings payload exceeds maximum allowed size (1 KB)');
  }

  // Perform database update on tenant_settings
  const existingRecord = await db
    .select({ id: schema.tenantSettings.id })
    .from(schema.tenantSettings)
    .where(eq(schema.tenantSettings.tenantId, tenantId))
    .limit(1);

  if (existingRecord.length > 0) {
    await db
      .update(schema.tenantSettings)
      .set({
        customBgUrl: serialized,
        updatedAt: new Date(),
      })
      .where(eq(schema.tenantSettings.tenantId, tenantId));
  } else {
    await db.insert(schema.tenantSettings).values({
      id: `ts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      customBgUrl: serialized,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

/**
 * Public Sanitizer Helper:
 * Ensures any "theme:{...}" internal payload is NEVER returned as a public image URL.
 * Returns either the clean background image URL or null.
 */
export function sanitizePublicBgUrl(customBgUrl?: string | null): string | null {
  return extractBgUrl(customBgUrl);
}
