import { ThemePreset, ThemePresetId, ThemeTokens, ThemeSettings } from './types';
import { whiteLabelPreset } from './tokens/white-label';
import { islamiSkyPreset } from './tokens/islami-sky';
import { skyEmasPreset } from './tokens/sky-emas';
import { skyMetallicPreset } from './tokens/sky-metallic';
import { zamrudPreset } from './tokens/zamrud';
import { zamrudCerahPreset } from './tokens/zamrud-cerah';
import { putihPreset } from './tokens/putih';
import { malamPreset } from './tokens/malam';
import { fajarPreset } from './tokens/fajar';
import { langitPreset } from './tokens/langit';
import { mainPreset } from './tokens/main';
import { buildGradient } from './gradient-builder';
import { HEX_COLOR_REGEX, getAccessibleForeground, getAccessibleHeaderForeground } from './contrast';

export const THEME_REGISTRY: Record<ThemePresetId, ThemePreset> = {
  'white-label': whiteLabelPreset,
  'islami-sky': islamiSkyPreset,
  'sky-emas': skyEmasPreset,
  'sky-metallic': skyMetallicPreset,
  zamrud: zamrudPreset,
  'zamrud-cerah': zamrudCerahPreset,
  putih: putihPreset,
  malam: malamPreset,
  fajar: fajarPreset,
  langit: langitPreset,
  main: mainPreset,
};

export const THEME_PRESETS: ThemePreset[] = Object.values(THEME_REGISTRY);

export const DEFAULT_THEME_PRESET_ID: ThemePresetId = 'white-label';

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  preset: DEFAULT_THEME_PRESET_ID,
  goldAccent: false,
  neonGlow: false,
  ornament: true,
  motion: 'standard',
  bgUrl: null,
};

/**
 * Retrieves a theme preset by ID with safe fallback to White-Label.
 */
export function getThemePreset(id?: string | null): ThemePreset {
  if (id && id in THEME_REGISTRY) {
    return THEME_REGISTRY[id as ThemePresetId];
  }
  return THEME_REGISTRY[DEFAULT_THEME_PRESET_ID];
}

/**
 * Resolves final theme tokens applying:
 * Layer 1: Base preset tokens (Light or Dark)
 * Layer 2: Preset toggles (Gold accent, Neon glow)
 * Layer 3: Tenant brand override (if valid custom primaryColor provided)
 * Auto-calculation: High contrast foregrounds (>= 4.5:1)
 */
export function resolveThemeTokens(
  presetId: ThemePresetId,
  isDark: boolean,
  tenantPrimaryColor?: string | null,
  goldAccent?: boolean,
  neonGlow?: boolean
): ThemeTokens {
  const preset = getThemePreset(presetId);
  const baseTokens = isDark ? preset.dark : preset.light;

  let tokens = { ...baseTokens };

  // Layer 3: Apply Tenant Custom Brand Primary (if valid HEX)
  if (tenantPrimaryColor && HEX_COLOR_REGEX.test(tenantPrimaryColor.trim())) {
    const validPrimary = tenantPrimaryColor.trim();
    const gradient = buildGradient(validPrimary);
    tokens.primary = validPrimary;
    tokens.headerGradient = gradient.headerGradient;
    tokens.headerSheen = gradient.headerSheen;
  }

  // Toggles override
  if (goldAccent || presetId === 'sky-emas') {
    tokens.gold = '#F3C74A';
    tokens.goldText = '#4A3300';
    tokens.goldGradient = 'linear-gradient(135deg, #FDE68A 0%, #F3C74A 50%, #C9962B 100%)';
  }

  if (neonGlow && preset.supportsNeonGlow) {
    tokens.neonGlowColor = '#FFF44F';
  } else if (!preset.supportsNeonGlow) {
    tokens.neonGlowColor = undefined;
  }

  // Auto-calculate accessible foregrounds (WCAG AA >= 4.5:1)
  tokens.primaryForeground = getAccessibleForeground(tokens.primary);
  const stopMatches = tokens.headerGradient.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g);
  tokens.headerForeground = getAccessibleHeaderForeground(stopMatches || [tokens.primary]);

  return tokens;
}

/**
 * Converts resolved tokens and settings into CSS custom properties safely.
 * Strips any hazardous characters; values must strictly be hex colors or validated gradient strings.
 */
export function generateThemeCssVariables(
  tokens: ThemeTokens,
  settings: ThemeSettings
): Record<string, string> {
  const sanitize = (val: string, fallback: string) => {
    if (!val || typeof val !== 'string') return fallback;
    const clean = val.trim();
    if (clean.startsWith('#') && HEX_COLOR_REGEX.test(clean)) return clean;
    if (clean.startsWith('linear-gradient(') && !/[;{}]|<\/style>/i.test(clean)) return clean;
    return fallback;
  };

  const isGoldActive = settings.goldAccent || settings.preset === 'sky-emas';

  return {
    '--theme-bg': sanitize(tokens.background, '#F4F9FF'),
    '--theme-surface': sanitize(tokens.surface, '#FFFFFF'),
    '--theme-surface-soft': sanitize(tokens.surfaceSoft, '#EAF4FE'),
    '--theme-border': sanitize(tokens.border, '#D6E6F7'),
    '--theme-ink': sanitize(tokens.ink, '#0F2A47'),
    '--theme-muted': sanitize(tokens.muted, '#5B7391'),
    '--theme-primary': sanitize(tokens.primary, '#1F6FD1'),
    '--theme-primary-strong': sanitize(tokens.primaryStrong, '#173F86'),
    '--theme-primary-foreground': sanitize(tokens.primaryForeground || '#FFFFFF', '#FFFFFF'),
    '--theme-header-foreground': sanitize(tokens.headerForeground || '#FFFFFF', '#FFFFFF'),
    '--theme-sky': sanitize(tokens.sky, '#38BDF8'),
    '--theme-sky-soft': sanitize(tokens.skySoft, '#E0F2FE'),
    '--theme-gold': '#F3C74A',
    '--theme-gold-text': '#4A3300',
    '--theme-gold-gradient': 'linear-gradient(135deg, #FDE68A 0%, #F3C74A 50%, #C9962B 100%)',
    '--theme-header-gradient': sanitize(tokens.headerGradient, 'linear-gradient(135deg, #7DD3FC 0%, #38A3F0 28%, #2563C7 62%, #173F86 100%)'),
    '--theme-header-sheen': sanitize(tokens.headerSheen, 'linear-gradient(115deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0) 42%)'),
    '--theme-gold-line': isGoldActive ? 'linear-gradient(90deg, #C9962B 0%, #F3C74A 50%, #FDE68A 100%)' : 'transparent',
    '--theme-gold-line-height': isGoldActive ? '4px' : '0px',
    '--theme-neon-glow': (settings.neonGlow && tokens.neonGlowColor) ? '#FFF44F' : 'transparent',
  };
}
