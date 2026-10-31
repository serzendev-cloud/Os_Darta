import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { isUiLabAllowed } from '@/lib/ui-lab-guard';
import { THEME_PRESETS, getEffectiveOrnamentType, resolveThemeTokens } from '@/themes/registry';
import { getContrastRatio } from '@/themes/contrast';
import { WaliDashboardPresentation } from '@/components/presentation/WaliDashboardPresentation';
import { AdminDashboardPresentation } from '@/components/presentation/AdminDashboardPresentation';

describe('WP-UI-003b: UI Lab Guard & Presentation Components Suite', () => {
  const originalVercelEnv = process.env.VERCEL_ENV;

  afterEach(() => {
    if (originalVercelEnv !== undefined) {
      process.env.VERCEL_ENV = originalVercelEnv;
    } else {
      delete process.env.VERCEL_ENV;
    }
  });

  describe('(a) /ui-lab Security Guard: Strict VERCEL_ENV Fail-Closed Enforcement', () => {
    it('harus menolak (false / 404) ketika VERCEL_ENV bernilai "production"', () => {
      process.env.VERCEL_ENV = 'production';
      expect(isUiLabAllowed('/ui-lab')).toBe(false);
      expect(isUiLabAllowed('/ui-lab/')).toBe(false);
    });

    it('harus menolak (false / 404) ketika VERCEL_ENV tidak terbaca / undefined (fail-closed)', () => {
      delete process.env.VERCEL_ENV;
      expect(isUiLabAllowed('/ui-lab')).toBe(false);
      expect(isUiLabAllowed('/ui-lab/')).toBe(false);
    });

    it('harus menolak (false / 404) ketika VERCEL_ENV berupa string kosong', () => {
      process.env.VERCEL_ENV = '   ';
      expect(isUiLabAllowed('/ui-lab')).toBe(false);
    });

    it('harus mengizinkan (true / 200) hanya ketika VERCEL_ENV bernilai "preview" atau "development"', () => {
      process.env.VERCEL_ENV = 'preview';
      expect(isUiLabAllowed('/ui-lab')).toBe(true);
      expect(isUiLabAllowed('/ui-lab/')).toBe(true);

      process.env.VERCEL_ENV = 'development';
      expect(isUiLabAllowed('/ui-lab')).toBe(true);
      expect(isUiLabAllowed('/ui-lab/')).toBe(true);
    });
  });

  describe('(b) Jalur lain di proxy tidak boleh bocor atau terpengaruh', () => {
    beforeEach(() => {
      process.env.VERCEL_ENV = 'preview';
    });

    it('jalur terproteksi dan jalur lain tetap ditolak oleh guard /ui-lab', () => {
      const protectedPaths = [
        '/dashboard',
        '/dashboard/santri',
        '/dashboard/gate-checkpoint',
        '/wali',
        '/wali/dompet',
        '/api/db/query',
        '/api/tenant/branding',
        '/ui-lab-secret',
        '/ui-lab/subpath',
      ];

      protectedPaths.forEach((path) => {
        expect(isUiLabAllowed(path)).toBe(false);
      });
    });
  });

  describe('(c) Integritas Arsitektur: Komponen murni bebas panggilan database', () => {
    it('file komponen presentasi tidak boleh mengimpor database atau hook data', async () => {
      const fs = await import('fs');
      const waliContent = fs.readFileSync('src/components/presentation/WaliDashboardPresentation.tsx', 'utf8');
      const adminContent = fs.readFileSync('src/components/presentation/AdminDashboardPresentation.tsx', 'utf8');
      const uiLabClientContent = fs.readFileSync('src/app/ui-lab/UiLabClient.tsx', 'utf8');

      // Pastikan tidak ada impor Drizzle, Supabase client langsung, atau useCollection
      expect(waliContent).not.toMatch(/useCollection/);
      expect(waliContent).not.toMatch(/@\/lib\/db/);
      expect(adminContent).not.toMatch(/useCollection/);
      expect(adminContent).not.toMatch(/@\/lib\/db/);
      expect(uiLabClientContent).not.toMatch(/@\/lib\/db/);
      expect(uiLabClientContent).not.toMatch(/supabase/i);
    });
  });

  describe('(d) Render semua 11 preset tema tanpa galat', () => {
    THEME_PRESETS.forEach((preset) => {
      it(`preset [${preset.id}] harus merender WaliDashboardPresentation dan AdminDashboardPresentation dengan benar`, () => {
        const ornamentOn = getEffectiveOrnamentType(preset, true);
        const ornamentOff = getEffectiveOrnamentType(preset, false);

        // Ornamen harus terdefinisi spesifik per preset
        expect(['mosque', 'abstract']).toContain(ornamentOn);
        expect(ornamentOff).toBe('none');

        // Render Wali
        const { unmount: unmountWali } = render(
          <WaliDashboardPresentation
            ornamentType={ornamentOn}
            showGoldAccent={preset.supportsGoldAccent}
            showNeonGlow={preset.supportsNeonGlow}
          />
        );
        unmountWali();

        // Render Admin
        const { unmount: unmountAdmin } = render(
          <AdminDashboardPresentation
            ornamentType={ornamentOn}
            showGoldAccent={preset.supportsGoldAccent}
            showNeonGlow={preset.supportsNeonGlow}
          />
        );
        unmountAdmin();
      });
    });
  });

  describe('(e) Verifikasi Kontras Teks WCAG AA', () => {
    THEME_PRESETS.forEach((preset) => {
      it(`preset [${preset.id}] teks primer dan foreground memenuhi WCAG AA >= 4.5:1`, () => {
        const lightTokens = resolveThemeTokens(preset.id, false);
        const darkTokens = resolveThemeTokens(preset.id, true);

        // Primary text vs background (mode terang)
        const lightRatio = getContrastRatio(lightTokens.ink, lightTokens.background);
        expect(lightRatio).toBeGreaterThanOrEqual(4.5);

        // Primary text vs background (mode gelap)
        const darkRatio = getContrastRatio(darkTokens.ink, darkTokens.background);
        expect(darkRatio).toBeGreaterThanOrEqual(4.5);

        // Primary foreground vs primary background (tombol/badge primer)
        const primaryForegroundRatio = getContrastRatio(lightTokens.primaryForeground || '#FFFFFF', lightTokens.primary);
        expect(primaryForegroundRatio).toBeGreaterThanOrEqual(4.5);

        // Dark primary foreground vs dark primary background
        const darkPrimaryForegroundRatio = getContrastRatio(darkTokens.primaryForeground || '#FFFFFF', darkTokens.primary);
        expect(darkPrimaryForegroundRatio).toBeGreaterThanOrEqual(4.5);
      });
    });
  });
});

