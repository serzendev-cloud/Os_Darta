import type { Metadata } from "next";
import { AppThemeProvider } from "@/components/theme/ThemeProvider";
import { AppProviders } from "@/providers";
import { Toaster } from "sonner";
import { getTenantContext } from "@/lib/tenant/context";
import { getThemeSettings } from "@/lib/theme-settings-store";
import { resolveThemeTokens, generateThemeCssVariables } from "@/themes/registry";
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

  // Pre-generate server CSS variables for 100% Anti-FOUC on first paint
  const initialTokens = resolveThemeTokens(
    themeSettings.preset,
    false,
    tenantPrimaryColor,
    themeSettings.goldAccent,
    themeSettings.neonGlow
  );
  const cssVariables = generateThemeCssVariables(initialTokens, themeSettings);
  const serverCssString = Object.entries(cssVariables)
    .map(([key, val]) => `${key}:${val};`)
    .join('');

  return (
    <html
      lang="id"
      suppressHydrationWarning
      data-theme-preset={themeSettings.preset}
      data-gold-accent={themeSettings.goldAccent || themeSettings.preset === 'sky-emas' ? 'true' : 'false'}
      data-neon-glow={themeSettings.neonGlow ? 'true' : 'false'}
      data-motion={themeSettings.motion}
    >
      <head>
        {/* Anti-FOUC Server-Side CSS Variable Injection */}
        <style
          id="server-theme-tokens"
          dangerouslySetInnerHTML={{ __html: `:root { ${serverCssString} }` }}
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
