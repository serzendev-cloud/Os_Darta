import { hexToRgb, rgbToHex, HEX_COLOR_REGEX } from './contrast';

export interface GradientBuildResult {
  headerGradient: string;
  headerSheen: string;
  stops: [string, string, string, string];
}

/**
 * Deterministically constructs a 4-stop hero gradient and an angular sheen from a primary color.
 * Stop 1: Lighter sky-tinted highlight (25% lighter)
 * Stop 2: Mid-high transition (10% lighter)
 * Stop 3: Core primary color
 * Stop 4: Deep saturated anchor (35% darker)
 */
export function buildGradient(primaryHex: string): GradientBuildResult {
  const DEFAULT_PRIMARY = '#1F6FD1';

  const validHex = (primaryHex && HEX_COLOR_REGEX.test(primaryHex.trim()))
    ? primaryHex.trim()
    : DEFAULT_PRIMARY;

  const rgb = hexToRgb(validHex) || hexToRgb(DEFAULT_PRIMARY)!;

  // Stop 1: Light Sky Accent (tinted with cyan/white)
  const stop1 = rgbToHex({
    r: Math.min(255, Math.round(rgb.r * 0.75 + 255 * 0.25)),
    g: Math.min(255, Math.round(rgb.g * 0.70 + 255 * 0.30)),
    b: Math.min(255, Math.round(rgb.b * 0.65 + 255 * 0.35)),
  });

  // Stop 2: Vibrant Mid-tone
  const stop2 = rgbToHex({
    r: Math.min(255, Math.round(rgb.r * 0.85 + 255 * 0.15)),
    g: Math.min(255, Math.round(rgb.g * 0.85 + 255 * 0.15)),
    b: Math.min(255, Math.round(rgb.b * 0.85 + 255 * 0.15)),
  });

  // Stop 3: Base Primary
  const stop3 = rgbToHex(rgb);

  // Stop 4: Deep Anchor
  const stop4 = rgbToHex({
    r: Math.max(0, Math.round(rgb.r * 0.45)),
    g: Math.max(0, Math.round(rgb.g * 0.45)),
    b: Math.max(0, Math.round(rgb.b * 0.50)),
  });

  const headerGradient = `linear-gradient(135deg, ${stop1} 0%, ${stop2} 28%, ${stop3} 62%, ${stop4} 100%)`;
  const headerSheen = `linear-gradient(115deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0) 42%)`;

  return {
    headerGradient,
    headerSheen,
    stops: [stop1, stop2, stop3, stop4],
  };
}

