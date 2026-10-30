'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { ThemeSettings, ThemeTokens } from '@/themes/types';
import { DEFAULT_THEME_SETTINGS, resolveThemeTokens, generateThemeCssVariables, getThemePreset } from '@/themes/registry';

interface ThemeContextValue {
  themeSettings: ThemeSettings;
  resolvedTokens: ThemeTokens;
  isDark: boolean;
  updateLocalThemeSettings: (newSettings: Partial<ThemeSettings>) => void;
}

const ThemeContext = React.createContext<ThemeContextValue>({
  themeSettings: DEFAULT_THEME_SETTINGS,
  resolvedTokens: resolveThemeTokens(DEFAULT_THEME_SETTINGS.preset, false),
  isDark: false,
  updateLocalThemeSettings: () => {},
});

export function useAppTheme() {
  return React.useContext(ThemeContext);
}

export interface AppThemeProviderProps {
  children: React.ReactNode;
  initialSettings?: ThemeSettings;
  tenantPrimaryColor?: string | null;
}

export function AppThemeProvider({
  children,
  initialSettings = DEFAULT_THEME_SETTINGS,
  tenantPrimaryColor,
}: AppThemeProviderProps) {
  const [settings, setSettings] = React.useState<ThemeSettings>(initialSettings);

  const updateLocalThemeSettings = React.useCallback((newSettings: Partial<ThemeSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeSynchronizer
        settings={settings}
        tenantPrimaryColor={tenantPrimaryColor}
        updateLocalThemeSettings={updateLocalThemeSettings}
      >
        {children}
      </ThemeSynchronizer>
    </NextThemesProvider>
  );
}

function ThemeSynchronizer({
  children,
  settings,
  tenantPrimaryColor,
  updateLocalThemeSettings,
}: {
  children: React.ReactNode;
  settings: ThemeSettings;
  tenantPrimaryColor?: string | null;
  updateLocalThemeSettings: (newSettings: Partial<ThemeSettings>) => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __setAppTheme?: typeof updateLocalThemeSettings }).__setAppTheme = updateLocalThemeSettings;
      (window as unknown as { __setThemeMode?: typeof setTheme }).__setThemeMode = setTheme;
    }
  }, [updateLocalThemeSettings, setTheme]);

  const resolvedTokens = React.useMemo(() => {
    return resolveThemeTokens(
      settings.preset,
      isDark,
      tenantPrimaryColor,
      settings.goldAccent,
      settings.neonGlow
    );
  }, [settings.preset, isDark, tenantPrimaryColor, settings.goldAccent, settings.neonGlow]);

  React.useEffect(() => {
    // Generate both :root and .dark rules so dynamic theme changes update immediately
    const lightTokens = resolveThemeTokens(settings.preset, false, tenantPrimaryColor, settings.goldAccent, settings.neonGlow);
    const darkTokens = resolveThemeTokens(settings.preset, true, tenantPrimaryColor, settings.goldAccent, settings.neonGlow);

    const lightVars = generateThemeCssVariables(lightTokens, settings);
    const darkVars = generateThemeCssVariables(darkTokens, settings);

    // Apply or update dynamic <style id="client-theme-tokens">
    let styleEl = document.getElementById('client-theme-tokens') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'client-theme-tokens';
      document.head.appendChild(styleEl);
    }
    const lightRules = Object.entries(lightVars).map(([k, v]) => `${k}:${v};`).join(' ');
    const darkRules = Object.entries(darkVars).map(([k, v]) => `${k}:${v};`).join(' ');
    styleEl.textContent = `:root { ${lightRules} } .dark { ${darkRules} }`;

    // Also update root data attributes
    const root = document.documentElement;
    const currentPreset = getThemePreset(settings.preset);
    root.setAttribute('data-theme-preset', settings.preset);
    root.setAttribute('data-theme-category', currentPreset.category);
    root.setAttribute('data-theme-ornament', settings.ornament ? 'true' : 'false');
    root.setAttribute('data-gold-accent', settings.goldAccent || settings.preset === 'sky-emas' ? 'true' : 'false');
    root.setAttribute('data-neon-glow', settings.neonGlow ? 'true' : 'false');
    root.setAttribute('data-motion', settings.motion);
  }, [settings, tenantPrimaryColor]);

  const contextValue = React.useMemo(
    () => ({
      themeSettings: settings,
      resolvedTokens,
      isDark,
      updateLocalThemeSettings,
    }),
    [settings, resolvedTokens, isDark, updateLocalThemeSettings]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}
