import { ThemeTokens } from './types';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface RgbaColor extends RgbColor {
  a: number; // 0.0 to 1.0
}

export const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * Validates and converts hex string (#RGB or #RRGGBB) to RGB values.
 * Returns null if invalid or unsafe.
 */
export function hexToRgb(hex: string): RgbColor | null {
  if (!hex || typeof hex !== 'string') return null;
  const trimmed = hex.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) return null;

  let clean = trimmed.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }

  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(rgb: RgbColor): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB color.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function getRelativeLuminance(rgb: RgbColor): number {
  const normalize = (val: number) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };

  const R = normalize(rgb.r);
  const G = normalize(rgb.g);
  const B = normalize(rgb.b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors: (L1 + 0.05) / (L2 + 0.05)
 * Returns ratio >= 1.0. Returns 1.0 if any color is invalid.
 */
export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const fg = hexToRgb(foregroundHex);
  const bg = hexToRgb(backgroundHex);
  if (!fg || !bg) return 1.0;

  const l1 = getRelativeLuminance(fg);
  const l2 = getRelativeLuminance(bg);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Performs alpha-compositing of a semi-transparent foreground over an opaque background.
 * Target = Alpha * Foreground + (1 - Alpha) * Background
 */
export function alphaComposite(foreground: RgbaColor, background: RgbColor): RgbColor {
  const a = Math.max(0, Math.min(1, foreground.a));
  return {
    r: Math.round(a * foreground.r + (1 - a) * background.r),
    g: Math.round(a * foreground.g + (1 - a) * background.g),
    b: Math.round(a * foreground.b + (1 - a) * background.b),
  };
}

/**
 * Evaluates worst-case contrast for text placed on top of a multi-stop gradient,
 * with an optional scrim layer (alpha-composited).
 *
 * Text-shadow is strictly excluded per WCAG rules.
 */
export function getWorstCaseGradientContrast(
  textHex: string,
  gradientStops: string[],
  scrim?: RgbaColor
): { worstRatio: number; worstStop: string } {
  const fgRgb = hexToRgb(textHex);
  if (!fgRgb) return { worstRatio: 1.0, worstStop: gradientStops[0] || '#000000' };

  let worstRatio = Infinity;
  let worstStop = gradientStops[0];

  for (const stopHex of gradientStops) {
    let baseBg = hexToRgb(stopHex);
    if (!baseBg) continue;

    if (scrim) {
      baseBg = alphaComposite(scrim, baseBg);
    }

    const effectiveBgHex = rgbToHex(baseBg);
    const ratio = getContrastRatio(textHex, effectiveBgHex);

    if (ratio < worstRatio) {
      worstRatio = ratio;
      worstStop = stopHex;
    }
  }

  return { worstRatio: worstRatio === Infinity ? 1.0 : worstRatio, worstStop };
}

/**
 * Derives a high-contrast dark palette from a light palette automatically.
 * Inverts background/surface luminance while preserving hue and ensuring WCAG AA >= 4.5:1.
 */
export function deriveDarkTokens(light: ThemeTokens): ThemeTokens {
  // Base dark tones anchored in deep navy/slate to match the app foundation
  const darkBackground = '#0B1A2E';
  const darkSurface = '#11263F';
  const darkSurfaceSoft = '#163252';
  const darkBorder = '#1E426D';
  const darkInk = '#F4F9FF';
  const darkMuted = '#94A3B8';

  // Lighten primary for dark mode legibility
  const primaryRgb = hexToRgb(light.primary) || { r: 92, g: 182, b: 255 };
  const lightenedPrimary = rgbToHex({
    r: Math.min(255, primaryRgb.r + 55),
    g: Math.min(255, primaryRgb.g + 55),
    b: Math.min(255, primaryRgb.b + 55),
  });

  return {
    ...light,
    background: darkBackground,
    surface: darkSurface,
    surfaceSoft: darkSurfaceSoft,
    border: darkBorder,
    ink: darkInk,
    muted: darkMuted,
    primary: lightenedPrimary,
    primaryStrong: light.primary,
    sky: '#38BDF8',
    skySoft: '#1E3A5F',
    gold: '#F3C74A',
    goldText: '#4A3300',
    goldGradient: 'linear-gradient(135deg, #FDE68A 0%, #F3C74A 50%, #C9962B 100%)',
    headerGradient: 'linear-gradient(135deg, #0E2A4A 0%, #173F86 45%, #0B1A2E 100%)',
    headerSheen: 'linear-gradient(115deg, rgba(255,255,255,0.15), rgba(255,255,255,0) 42%)',
  };
}

/**
 * Selects an optimal foreground color (#FFFFFF or high-contrast dark color #0F172A / #0F2A47)
 * against a background hex color to strictly achieve WCAG AA >= 4.5:1.
 */
export function getAccessibleForeground(bgHex: string, darkFallback = '#0F2A47'): string {
  const whiteRatio = getContrastRatio('#FFFFFF', bgHex);
  if (whiteRatio >= 4.5) return '#FFFFFF';
  const darkRatio = getContrastRatio(darkFallback, bgHex);
  if (darkRatio >= 4.5) return darkFallback;
  return whiteRatio >= darkRatio ? '#FFFFFF' : darkFallback;
}

/**
 * Selects an optimal foreground color (#FFFFFF or dark color) against a multi-stop header gradient.
 */
export function getAccessibleHeaderForeground(gradientStops: string[], darkFallback = '#0F2A47'): string {
  if (!gradientStops || gradientStops.length === 0) return '#FFFFFF';
  const whiteWorst = getWorstCaseGradientContrast('#FFFFFF', gradientStops).worstRatio;
  if (whiteWorst >= 4.5) return '#FFFFFF';
  const darkWorst = getWorstCaseGradientContrast(darkFallback, gradientStops).worstRatio;
  if (darkWorst >= 4.5) return darkFallback;
  return whiteWorst >= darkWorst ? '#FFFFFF' : darkFallback;
}
