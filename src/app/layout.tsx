import type { Metadata } from "next";
import { AppThemeProvider } from "@/components/theme/ThemeProvider";
import { AppProviders } from "@/providers";
import { Toaster } from "sonner";
import { getTenantContext } from "@/lib/tenant/context";
import { getThemeSettings } from "@/lib/theme-settings-store";
import { resolveThemeTokens, generateThemeCssVariables, getThemePreset } from "@/themes/registry";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ma'had Manager",
  description: "Sistem Manajemen Pesantren",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let tenant = null;
  try {
    tenant = await getTenantContext();
  } catch {
    tenant = null;
  }

  const themeSettings = getThemeSettings(tenant);
  const tenantPrimaryColor = tenant?.settings?.primaryColor || null;
  const currentPreset = getThemePreset(themeSettings.preset);

  // Pre-generate server CSS variables for 100% Anti-FOUC on first paint (:root and .dark)
  const lightTokens = resolveThemeTokens(
    themeSettings.preset,
    false,
    tenantPrimaryColor,
    themeSettings.goldAccent,
    themeSettings.neonGlow,
    themeSettings.useBrandColor,
    themeSettings.brandColor
  );
  const darkTokens = resolveThemeTokens(
    themeSettings.preset,
    true,
    tenantPrimaryColor,
    themeSettings.goldAccent,
    themeSettings.neonGlow,
    themeSettings.useBrandColor,
    themeSettings.brandColor
  );

  const lightVars = generateThemeCssVariables(lightTokens, themeSettings);
  const darkVars = generateThemeCssVariables(darkTokens, themeSettings);

  const lightCssString = Object.entries(lightVars).map(([k, v]) => `${k}:${v};`).join('');
  const darkCssString = Object.entries(darkVars).map(([k, v]) => `${k}:${v};`).join('');
  const serverCssString = `:root { ${lightCssString} } .dark { ${darkCssString} }`;

  return (
    <html
      lang="id"
      suppressHydrationWarning
      data-theme-preset={themeSettings.preset}
      data-theme-category={currentPreset.category}
      data-theme-ornament={themeSettings.ornament ? 'true' : 'false'}
      data-gold-accent={themeSettings.goldAccent || themeSettings.preset === 'sky-emas' ? 'true' : 'false'}
      data-neon-glow={themeSettings.neonGlow ? 'true' : 'false'}
      data-motion={themeSettings.motion}
    >
      <head>
        {/* Anti-FOUC Server-Side CSS Variable Injection */}
        <style
          id="server-theme-tokens"
          dangerouslySetInnerHTML={{ __html: serverCssString }}
        />
      </head>
      <body className="antialiased bg-theme-bg text-theme-ink min-h-screen">
        <AppThemeProvider
          initialSettings={themeSettings}
          tenantPrimaryColor={tenantPrimaryColor}
        >
          <AppProviders>
            {children}
            <Toaster position="top-right" richColors />
          </AppProviders>
        </AppThemeProvider>
      </body>
    </html>
  );
}
