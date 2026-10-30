import { describe, it, expect } from 'vitest';
import { THEME_PRESETS } from '@/themes/registry';
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
