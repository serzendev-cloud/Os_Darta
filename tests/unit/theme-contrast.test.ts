import { describe, it, expect } from 'vitest';
import { THEME_PRESETS, resolveThemeTokens } from '@/themes/registry';
import { 
  getContrastRatio, 
  getWorstCaseGradientContrast,
  deriveDarkTokens 
} from '@/themes/contrast';

function extractHexColors(gradientString: string): string[] {
  const matches = gradientString.match(/#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3}/g);
  return matches ? Array.from(new Set(matches)) : [];
}

describe('WP-UI-001 Theme Contrast & WCAG AA Verification', () => {
  describe('Mode Terang (Light Mode) 11 Presets', () => {
    THEME_PRESETS.forEach((preset) => {
      it(`preset [${preset.id}] harus memenuhi kontras teks ink di atas surface/background`, () => {
        const tokens = preset.light;

        // Teks utama (ink) di atas surface kartu (WCAG AA normal text >= 4.5:1)
        const bodyContrast = getContrastRatio(tokens.ink, tokens.surface);
        expect(bodyContrast).toBeGreaterThanOrEqual(4.5);

        // Teks sekunder (muted) di atas surface kartu (minimal 3:1 untuk large text / UI muted)
        const mutedContrast = getContrastRatio(tokens.muted, tokens.surface);
        expect(mutedContrast).toBeGreaterThanOrEqual(3.0);
      });

      it(`preset [${preset.id}] header gradient worst-case stop dengan dark scrim harus memenuhi WCAG AA`, () => {
        const tokens = preset.light;
        const stops = extractHexColors(tokens.headerGradient);
        expect(stops.length).toBeGreaterThan(0);

        if (preset.id === 'putih') {
          // Pada tema putih bersih, header bernuansa terang sehingga teks memakai ink gelap
          for (const stop of stops) {
            const contrast = getContrastRatio(tokens.ink, stop);
            expect(contrast).toBeGreaterThanOrEqual(4.5);
          }
        } else {
          // Pada tema header berwarna, teks putih diuji terhadap stop terburuk dengan scrim compositing 45% black
          const result = getWorstCaseGradientContrast('#FFFFFF', stops, {
            r: 0,
            g: 0,
            b: 0,
            a: 0.45,
          });

          // Kontras teks di atas stop terburuk + scrim harus >= 4.5:1 (bebas dari ketergantungan text-shadow)
          expect(result.worstRatio).toBeGreaterThanOrEqual(4.5);
        }
      });
    });
  });

  describe('Mode Gelap (Dark Mode) 11 Presets', () => {
    THEME_PRESETS.forEach((preset) => {
      it(`preset [${preset.id}] mode gelap harus memenuhi WCAG AA >= 4.5:1`, () => {
        const darkTokens = preset.dark;

        // Teks utama (ink) di atas surface gelap
        const darkBodyContrast = getContrastRatio(darkTokens.ink, darkTokens.surface);
        expect(darkBodyContrast).toBeGreaterThanOrEqual(4.5);

        // Teks sekunder (muted) di atas surface gelap (minimal 3:1)
        const darkMutedContrast = getContrastRatio(darkTokens.muted, darkTokens.surface);
        expect(darkMutedContrast).toBeGreaterThanOrEqual(3.0);
      });
    });
  });

  describe('WP-UI-001e: Pasangan Kontras Nyata Shell (Semua 11 Preset, Terang & Gelap)', () => {
    THEME_PRESETS.forEach((preset) => {
      (['light', 'dark'] as const).forEach((mode) => {
        const isDark = mode === 'dark';
        it(`preset [${preset.id}] (${mode}): 5 pasangan shell harus memenuhi WCAG AA >= 4.5:1`, () => {
          const tokens = resolveThemeTokens(preset.id, isDark);

          // 1. primary vs primary-foreground
          const primaryContrast = getContrastRatio(tokens.primaryForeground || '#FFFFFF', tokens.primary);
          expect(primaryContrast, `[${preset.id}-${mode}] primary vs primary-foreground (${tokens.primaryForeground} on ${tokens.primary})`).toBeGreaterThanOrEqual(4.5);

          // 2. foreground (ink) vs background
          const fgBgContrast = getContrastRatio(tokens.ink, tokens.background);
          expect(fgBgContrast, `[${preset.id}-${mode}] foreground vs background (${tokens.ink} on ${tokens.background})`).toBeGreaterThanOrEqual(4.5);

          // 3. card-foreground (ink) vs card (surface)
          const cardContrast = getContrastRatio(tokens.ink, tokens.surface);
          expect(cardContrast, `[${preset.id}-${mode}] card-foreground vs card (${tokens.ink} on ${tokens.surface})`).toBeGreaterThanOrEqual(4.5);

          // 4. sidebar-foreground (ink) vs sidebar (surface)
          const sidebarContrast = getContrastRatio(tokens.ink, tokens.surface);
          expect(sidebarContrast, `[${preset.id}-${mode}] sidebar-foreground vs sidebar (${tokens.ink} on ${tokens.surface})`).toBeGreaterThanOrEqual(4.5);

          // 5. muted-foreground vs muted/surfaceSoft
          const mutedContrast = getContrastRatio(tokens.muted, tokens.surfaceSoft);
          expect(mutedContrast, `[${preset.id}-${mode}] muted-foreground vs muted (${tokens.muted} on ${tokens.surfaceSoft})`).toBeGreaterThanOrEqual(4.5);
        });
      });
    });
  });

  describe('WP-UI-001f: Aturan Prioritas Brand Color vs Preset & Kontras Otomatis', () => {
    it('(a) resolveThemeTokens mengabaikan tenantPrimaryColor bila useBrandColor=false atau undefined', () => {
      // White-label preset primary adalah '#1F6FD1'
      const tokensWithoutFlag = resolveThemeTokens('white-label', false, '#0F766E');
      expect(tokensWithoutFlag.primary).toBe('#1F6FD1');

      const tokensExplicitFalse = resolveThemeTokens('white-label', false, '#0F766E', false, false, false);
      expect(tokensExplicitFalse.primary).toBe('#1F6FD1');
    });

    it('(b) resolveThemeTokens menerapkan warna brand jika useBrandColor=true dan kontras tetap >= 4.5:1', () => {
      // Uji warna gelap (Teal #0F766E)
      const tealTokens = resolveThemeTokens('white-label', false, '#0F766E', false, false, true);
      expect(tealTokens.primary).toBe('#0F766E');
      const tealContrast = getContrastRatio(tealTokens.primaryForeground || '#FFFFFF', tealTokens.primary);
      expect(tealContrast).toBeGreaterThanOrEqual(4.5);

      // Uji warna terang (Kuning #FACC15) -> harus menghasilkan teks gelap
      const yellowTokens = resolveThemeTokens('white-label', false, null, false, false, true, '#FACC15');
      expect(yellowTokens.primary).toBe('#FACC15');
      expect(yellowTokens.primaryForeground).toBe('#0F2A47');
      const yellowContrast = getContrastRatio(yellowTokens.primaryForeground || '#000000', yellowTokens.primary);
      expect(yellowContrast).toBeGreaterThanOrEqual(4.5);
    });

    it('(c) nilai jahat (XSS, script injection, format bukan hex) tetap ditolak dan fallback ke preset', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '#12345; background: red;',
        'rgb(255, 0, 0)',
        'blue',
        'javascript:void(0)',
      ];

      maliciousInputs.forEach((badInput) => {
        const tokens = resolveThemeTokens('white-label', false, badInput, false, false, true);
        expect(tokens.primary).toBe('#1F6FD1');
      });
    });
  });

  describe('Auto-Derived Dark Mode Fallback', () => {
    THEME_PRESETS.forEach((preset) => {
      it(`preset [${preset.id}] deriveDarkTokens harus menghasilkan kontras WCAG AA >= 4.5:1`, () => {
        const derivedDark = deriveDarkTokens(preset.light);

        const bodyContrast = getContrastRatio(derivedDark.ink, derivedDark.surface);
        expect(bodyContrast).toBeGreaterThanOrEqual(4.5);

        const mutedContrast = getContrastRatio(derivedDark.muted, derivedDark.surface);
        expect(mutedContrast).toBeGreaterThanOrEqual(3.0);
      });
    });
  });

  describe('Aksen Emas #F3C74A Kontras', () => {
    it('teks di atas tombol aksi emas harus memakai cokelat tua #4A3300 untuk memenuhi WCAG AA >= 4.5:1', () => {
      const goldBg = '#F3C74A';
      const brownText = '#4A3300';
      const whiteText = '#FFFFFF';

      const validContrast = getContrastRatio(brownText, goldBg);
      const invalidContrast = getContrastRatio(whiteText, goldBg);

      // Cokelat tua di atas emas sangat kontras (>= 4.5:1)
      expect(validContrast).toBeGreaterThanOrEqual(4.5);
      // Teks putih di atas emas GAGAL kontras (< 3:1), membuktikan keharusan memakai #4A3300
      expect(invalidContrast).toBeLessThan(3.0);
    });
  });
});
