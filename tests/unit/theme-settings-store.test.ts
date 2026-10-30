import { describe, it, expect } from 'vitest';
import { 
  parseThemeSettings, 
  serializeThemeSettings, 
  extractBgUrl, 
  sanitizePublicBgUrl,
  DEFAULT_THEME_SETTINGS
} from '@/lib/theme-settings-store';
import { ThemeSettings } from '@/themes/types';

describe('WP-UI-001 Theme Settings Store Module', () => {
  it('harus mengembalikan default settings jika input null, undefined, atau string kosong', () => {
    expect(parseThemeSettings(null)).toEqual(DEFAULT_THEME_SETTINGS);
    expect(parseThemeSettings(undefined)).toEqual(DEFAULT_THEME_SETTINGS);
    expect(parseThemeSettings('')).toEqual(DEFAULT_THEME_SETTINGS);
  });

  it('harus membaca format string lama non-theme sebagai customBg biasa', () => {
    const rawBg = 'https://cdn.ponpes.id/assets/background-pesantren.jpg';
    const settings = parseThemeSettings(rawBg);
    expect(settings.preset).toBe(DEFAULT_THEME_SETTINGS.preset);
    expect(settings.bgUrl).toBe(rawBg);

    // Saat mengekstrak bgUrl, URL aslinya harus terbaca
    expect(extractBgUrl(rawBg)).toBe(rawBg);
    expect(sanitizePublicBgUrl(rawBg)).toBe(rawBg);
  });

  it('harus memvalidasi dan memuat pengaturan tema lengkap dengan bgUrl tersemat', () => {
    const initialSettings: ThemeSettings = {
      preset: 'zamrud',
      goldAccent: true,
      neonGlow: false,
      ornament: true,
      motion: 'standard',
    };
    const bgUrl = 'https://cdn.ponpes.id/bg-santri.png';

    const serialized = serializeThemeSettings(initialSettings, bgUrl);
    expect(serialized.startsWith('theme:')).toBe(true);

    const parsed = parseThemeSettings(serialized);
    expect(parsed.preset).toBe('zamrud');
    expect(parsed.goldAccent).toBe(true);
    expect(parsed.neonGlow).toBe(false);
    expect(parsed.ornament).toBe(true);
    expect(parsed.motion).toBe('standard');

    // BgUrl harus terekstrak dengan benar
    expect(extractBgUrl(serialized)).toBe(bgUrl);
    expect(sanitizePublicBgUrl(serialized)).toBe(bgUrl);
  });

  it('harus mengabaikan opsi neonGlow jika preset bukan islami-sky saat serialisasi/parsing', () => {
    const initialSettings: ThemeSettings = {
      preset: 'putih',
      goldAccent: false,
      neonGlow: true, // Seharusnya dimatikan karena bukan islami-sky
      ornament: false,
      motion: 'soft',
    };

    const serialized = serializeThemeSettings(initialSettings);
    const parsed = parseThemeSettings(serialized);

    expect(parsed.neonGlow).toBe(false);
  });

  it('harus menangani JSON yang korup secara aman (fail-safe)', () => {
    const corruptString = 'theme:{"preset":"zamrud", incomplete json...';
    const parsed = parseThemeSettings(corruptString);

    expect(parsed).toEqual(DEFAULT_THEME_SETTINGS);
    expect(extractBgUrl(corruptString)).toBeNull();
  });
});
