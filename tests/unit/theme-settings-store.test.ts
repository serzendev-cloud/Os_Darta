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
    expect(settings.useBrandColor).toBe(false);

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
      useBrandColor: true,
      brandColor: '#2563EB',
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
    expect(parsed.useBrandColor).toBe(true);
    expect(parsed.brandColor).toBe('#2563EB');

    // BgUrl harus terekstrak dengan benar
    expect(extractBgUrl(serialized)).toBe(bgUrl);
    expect(sanitizePublicBgUrl(serialized)).toBe(bgUrl);
  });

  it('harus kompatibel mundur: payload lama tanpa useBrandColor otomatis bernilai false', () => {
    const legacyPayload = 'theme:{"preset":"sky-emas","goldAccent":true,"neonGlow":false,"ornament":true,"motion":"standard"}';
    const parsed = parseThemeSettings(legacyPayload);

    expect(parsed.preset).toBe('sky-emas');
    expect(parsed.useBrandColor).toBe(false);
    expect(parsed.brandColor).toBeNull();
  });

  it('harus membersihkan / membuang (strip) field tak dikenal demi keamanan', () => {
    const payloadWithUnknown = 'theme:{"preset":"white-label","goldAccent":false,"neonGlow":false,"ornament":true,"motion":"standard","maliciousField":"<script>alert(1)</script>","adminOverride":true}';
    const parsed = parseThemeSettings(payloadWithUnknown);

    expect(parsed.preset).toBe('white-label');
    expect((parsed as unknown as Record<string, unknown>).maliciousField).toBeUndefined();
    expect((parsed as unknown as Record<string, unknown>).adminOverride).toBeUndefined();
  });

  it('harus menolak payload yang melebihi batas 1 KB (1024 bytes) dan fallback ke default', () => {
    const hugePadding = 'A'.repeat(1200);
    const oversizedPayload = `theme:{"preset":"white-label","bgUrl":"${hugePadding}"}`;
    expect(oversizedPayload.length).toBeGreaterThan(1024);

    const parsed = parseThemeSettings(oversizedPayload);
    expect(parsed).toEqual(DEFAULT_THEME_SETTINGS);
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
