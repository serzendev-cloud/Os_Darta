import { describe, it, expect } from 'vitest';
import { generateThemeCssVariables, resolveThemeTokens, DEFAULT_THEME_SETTINGS } from '@/themes/registry';
import { sanitizePublicBgUrl, parseThemeSettings } from '@/lib/theme-settings-store';

describe('WP-UI-001 Theme Security & CSS Injection Defense', () => {
  it('harus memvalidasi nilai warna hex dan menolak injeksi kode CSS jahat', () => {
    const maliciousPrimary = '#000000; } body { display: none; } /*';
    // resolveThemeTokens akan memfilter primaryColor lewat HEX_COLOR_REGEX
    const tokens = resolveThemeTokens('white-label', false, maliciousPrimary);
    const cssVars = generateThemeCssVariables(tokens, DEFAULT_THEME_SETTINGS);
    const cssString = Object.entries(cssVars).map(([k, v]) => `${k}: ${v};`).join('\n');

    // Injeksi tidak boleh lolos ke deklarasi CSS variable
    expect(cssString).not.toContain('body { display: none; }');
    // Jika primaryColor tidak valid regex hex, harus jatuh ke primary preset
    expect(cssVars['--theme-primary']).toBe('#1F6FD1');
  });

  it('harus menolak script tag injection atau HTML closing tag dalam custom color', () => {
    const scriptInjection = '</style><script>alert(1)</script>';
    const tokens = resolveThemeTokens('white-label', false, scriptInjection);
    const cssVars = generateThemeCssVariables(tokens, DEFAULT_THEME_SETTINGS);
    const cssString = Object.entries(cssVars).map(([k, v]) => `${k}: ${v};`).join('\n');

    expect(cssString).not.toContain('</style>');
    expect(cssString).not.toContain('<script>');
    expect(cssVars['--theme-primary']).toBe('#1F6FD1');
  });

  it('harus menolak URL eksternal berbahaya dalam gradient injection', () => {
    const urlInjection = 'url(https://malicious.com/tracker.png)';
    const tokens = resolveThemeTokens('white-label', false, urlInjection);
    const cssVars = generateThemeCssVariables(tokens, DEFAULT_THEME_SETTINGS);
    const cssString = Object.entries(cssVars).map(([k, v]) => `${k}: ${v};`).join('\n');

    expect(cssString).not.toContain('url(');
    expect(cssString).not.toContain('https://malicious.com');
  });

  it('harus membatasi ukuran payload theme-settings maksimal 1 KB', () => {
    const hugePayload = 'a'.repeat(2000);
    const parsed = parseThemeSettings(`theme:{"preset":"white-label","extra":"${hugePayload}"}`);

    // Ukuran melebihi 1024 bytes harus mengembalikan default settings tanpa melempar crash
    expect(parsed).toEqual(expect.objectContaining({
      preset: 'white-label',
      goldAccent: false,
      neonGlow: false,
      ornament: true,
      motion: 'standard',
    }));
  });

  it('harus menolak preset id yang tidak terdaftar di THEME_REGISTRY dan jatuh ke white-label', () => {
    const parsed = parseThemeSettings('theme:{"preset":"preset-palsu-hacker"}');
    expect(parsed.preset).toBe('white-label');
  });

  it('harus membuang field tak dikenal (unknown fields) dari parsing Zod', () => {
    const parsed = parseThemeSettings('theme:{"preset":"zamrud","goldAccent":true,"injectedAdminKey":"SUPER_ADMIN"}');
    expect(parsed.preset).toBe('zamrud');
    expect(parsed.goldAccent).toBe(true);
    expect((parsed as unknown as Record<string, unknown>).injectedAdminKey).toBeUndefined();
  });

  it('memastikan sanitizePublicBgUrl tidak pernah membocorkan string "theme:{...}" ke publik', () => {
    const rawCustomBgUrl = 'theme:{"preset":"sky-emas","goldAccent":true,"bgUrl":"https://cdn.example.com/masjid.jpg"}';
    const publicUrl = sanitizePublicBgUrl(rawCustomBgUrl);

    expect(publicUrl).toBe('https://cdn.example.com/masjid.jpg');
    expect(publicUrl).not.toContain('theme:');

    // Jika tidak ada bgUrl di dalam payload theme
    const noBgCustomUrl = 'theme:{"preset":"sky-emas","goldAccent":true}';
    expect(sanitizePublicBgUrl(noBgCustomUrl)).toBeNull();

    // Jika customBgUrl adalah URL biasa non-theme
    const normalUrl = 'https://cdn.example.com/background.jpg';
    expect(sanitizePublicBgUrl(normalUrl)).toBe(normalUrl);
  });
});
