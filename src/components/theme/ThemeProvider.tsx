'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { ThemeSettings, ThemeTokens } from '@/themes/types';
import { DEFAULT_THEME_SETTINGS, resolveThemeTokens, generateThemeCssVariables } from '@/themes/registry';

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
    // Generate CSS variables and apply to document root
    const root = document.documentElement;
    const cssVars = generateThemeCssVariables(resolvedTokens, settings);

    for (const [key, value] of Object.entries(cssVars)) {
      root.style.setProperty(key, value);
    }

    // Set declarative data attributes for styling hooks
    root.setAttribute('data-theme-preset', settings.preset);
    root.setAttribute('data-gold-accent', settings.goldAccent || settings.preset === 'sky-emas' ? 'true' : 'false');
    root.setAttribute('data-neon-glow', settings.neonGlow ? 'true' : 'false');
    root.setAttribute('data-motion', settings.motion);
  }, [resolvedTokens, settings]);

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

