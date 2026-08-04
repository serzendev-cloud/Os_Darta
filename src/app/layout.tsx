import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AppProviders } from "@/providers";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ma'had Manager",
  description: "Sistem Manajemen Pesantren",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProviders>
            {children}
            <Toaster position="top-right" richColors />
          </AppProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
