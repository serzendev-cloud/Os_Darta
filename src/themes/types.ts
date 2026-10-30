export type ThemePresetId =
  | 'white-label'
  | 'islami-sky'
  | 'sky-emas'
  | 'sky-metallic'
  | 'zamrud'
  | 'zamrud-cerah'
  | 'putih'
  | 'malam'
  | 'fajar'
  | 'langit'
  | 'main';

export type ThemeCategory = 'Netral' | 'Islami' | 'Berwarna' | 'Gelap';

export type MotionPreference = 'soft' | 'standard' | 'off';

export interface ThemeTokens {
  background: string;       // Page canvas background (#RRGGBB)
  surface: string;          // Cards, modals, containers
  surfaceSoft: string;      // Subtle card background, input wells
  border: string;           // Dividers, card borders
  ink: string;              // Primary text color (high contrast)
  muted: string;            // Secondary / label text color
  primary: string;          // Brand primary accent color
  primaryStrong: string;    // Hover / active brand state
  primaryForeground?: string; // High-contrast text on primary (>= 4.5:1)
  sky: string;              // Sky accent
  skySoft: string;          // Sky tint surface
  gold: string;             // Gold accent (#F3C74A)
  goldText: string;         // Text on gold background (#4A3300)
  goldGradient: string;     // Multi-stop gold metallic sheen
  headerGradient: string;   // 4-stop hero header background
  headerSheen: string;      // Angular light overlay
  headerForeground?: string; // High-contrast text on header gradient (>= 4.5:1)
  neonGlowColor?: string;   // Optional neon highlight (e.g. #FFF44F)
}

export interface ThemePreset {
  id: ThemePresetId;
  name: string;
  category: ThemeCategory;
  description: string;
  light: ThemeTokens;
  dark: ThemeTokens;
  supportsGoldAccent: boolean;
  supportsNeonGlow: boolean;
  supportsMosqueOrnament: boolean;
  hasExplicitDark: boolean;
}

export interface ThemeSettings {
  preset: ThemePresetId;
  goldAccent: boolean;
  neonGlow: boolean;
  ornament: boolean;
  motion: MotionPreference;
  bgUrl?: string | null;
  useBrandColor?: boolean;
  brandColor?: string | null;
}
