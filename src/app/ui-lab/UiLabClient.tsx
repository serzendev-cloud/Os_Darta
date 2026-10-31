'use client';

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Moon, 
  Sun, 
  Palette, 
  Sliders, 
  ShieldAlert, 
  Check, 
  Layers,
  Activity,
  Maximize2
} from 'lucide-react';
import { THEME_PRESETS, THEME_REGISTRY, resolveThemeTokens, generateThemeCssVariables, getEffectiveOrnamentType } from '@/themes/registry';
import { ThemePresetId, ThemeSettings, MotionPreference } from '@/themes/types';
import { WaliDashboardPresentation } from '@/components/presentation/WaliDashboardPresentation';
import { AdminDashboardPresentation } from '@/components/presentation/AdminDashboardPresentation';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function UiLabClient() {
  // Client-only Playground State (Zero Database / Zero Session Mutation)
  const [selectedPresetId, setSelectedPresetId] = useState<ThemePresetId>('white-label');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [goldAccent, setGoldAccent] = useState<boolean>(false);
  const [neonGlow, setNeonGlow] = useState<boolean>(false);
  const [ornament, setOrnament] = useState<boolean>(true);
  const [motion, setMotion] = useState<MotionPreference>('standard');
  const [useBrandColor, setUseBrandColor] = useState<boolean>(false);
  const [brandColor, setBrandColor] = useState<string>('#1F6FD1');
  const [activeView, setActiveView] = useState<'both' | 'mobile' | 'desktop'>('both');

  const selectedPreset = THEME_REGISTRY[selectedPresetId] || THEME_REGISTRY['white-label'];

  const themeSettings: ThemeSettings = useMemo(() => ({
    preset: selectedPresetId,
    goldAccent,
    neonGlow: selectedPresetId === 'islami-sky' ? neonGlow : false,
    ornament,
    motion,
    useBrandColor,
    brandColor: useBrandColor ? brandColor : null,
    bgUrl: null,
  }), [selectedPresetId, goldAccent, neonGlow, ornament, motion, useBrandColor, brandColor]);

  // Compute resolved tokens and CSS custom properties dynamically
  const resolvedTokens = useMemo(() => {
    return resolveThemeTokens(
      selectedPresetId,
      isDarkMode,
      null,
      goldAccent,
      neonGlow,
      useBrandColor,
      brandColor
    );
  }, [selectedPresetId, isDarkMode, goldAccent, neonGlow, useBrandColor, brandColor]);

  const cssVariables = useMemo(() => {
    return generateThemeCssVariables(resolvedTokens, themeSettings);
  }, [resolvedTokens, themeSettings]);

  const effectiveOrnament = getEffectiveOrnamentType(selectedPreset, ornament);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Header Banner Keamanan: HANYA UNTUK PRATINJAU */}
      <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-200">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold tracking-wide uppercase">Hanya Untuk Pratinjau (UI Lab Playground)</span>
          <span className="hidden md:inline text-amber-300/80">• Lingkungan Non-Produksi Terisolasi</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] border-amber-400/40 text-amber-300">
            Zero DB / Zero Session
          </Badge>
          <Badge variant="outline" className="text-[10px] border-amber-400/40 text-amber-300 font-mono">
            noindex, nofollow
          </Badge>
        </div>
      </div>

      {/* 2. Interactive Control Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 shadow-xl">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">
                  Design Canvas Preview Engine
                </h1>
                <p className="text-[11px] text-slate-400">
                  Menguji integrasi token CSS dan ornamen pada 11 preset tema
                </p>
              </div>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              <button
                onClick={() => setActiveView('both')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                  activeView === 'both' ? 'bg-primary text-white shadow-xs' : 'text-slate-400 hover:text-white'
                )}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Keduanya</span>
              </button>
              <button
                onClick={() => setActiveView('mobile')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                  activeView === 'mobile' ? 'bg-primary text-white shadow-xs' : 'text-slate-400 hover:text-white'
                )}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>HP 390px</span>
              </button>
              <button
                onClick={() => setActiveView('desktop')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors',
                  activeView === 'desktop' ? 'bg-primary text-white shadow-xs' : 'text-slate-400 hover:text-white'
                )}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop 1440px</span>
              </button>
            </div>
          </div>

          {/* Preset Selector Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Preset:
            </span>
            {THEME_PRESETS.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPresetId(p.id)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0',
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm scale-105'
                      : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  {p.name}
                </button>
              );
            })}
          </div>

          {/* Toggles & Options Strip */}
          <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-slate-300 border-t border-slate-800/80">
            {/* Mode Terang / Gelap */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700/80 transition-colors"
              >
                {isDarkMode ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isDarkMode ? 'Mode Gelap' : 'Mode Terang'}</span>
              </button>
            </div>

            {/* Aksen Emas */}
            <div className="flex items-center gap-2">
              <Switch
                id="ui-gold"
                checked={goldAccent}
                onCheckedChange={setGoldAccent}
              />
              <Label htmlFor="ui-gold" className="cursor-pointer text-xs">
                Aksen Emas
              </Label>
            </div>

            {/* Neon Glow */}
            <div className="flex items-center gap-2">
              <Switch
                id="ui-neon"
                disabled={selectedPresetId !== 'islami-sky'}
                checked={neonGlow && selectedPresetId === 'islami-sky'}
                onCheckedChange={setNeonGlow}
              />
              <Label htmlFor="ui-neon" className={cn("cursor-pointer text-xs", selectedPresetId !== 'islami-sky' && 'opacity-40')}>
                Neon Glow (Islami Sky)
              </Label>
            </div>

            {/* Ornamen */}
            <div className="flex items-center gap-2">
              <Switch
                id="ui-ornament"
                checked={ornament}
                onCheckedChange={setOrnament}
              />
              <Label htmlFor="ui-ornament" className="cursor-pointer text-xs flex items-center gap-1">
                <span>Ornamen Header:</span>
                <span className="font-mono text-primary font-bold">{effectiveOrnament}</span>
              </Label>
            </div>

            {/* Brand Color Override */}
            <div className="flex items-center gap-2">
              <Switch
                id="ui-brand"
                checked={useBrandColor}
                onCheckedChange={setUseBrandColor}
              />
              <Label htmlFor="ui-brand" className="cursor-pointer text-xs">
                Warna Brand:
              </Label>
              {useBrandColor && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-6 h-6 rounded border border-slate-600 bg-transparent cursor-pointer p-0"
                    title="Pilih Warna Brand"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-20 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-mono text-white"
                  />
                </div>
              )}
            </div>

            {/* Motion Preference */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-slate-400">Gerak:</span>
              {(['soft', 'standard', 'off'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMotion(m)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-semibold capitalize',
                    motion === m ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Stage: Render Screen Presentations in Styled Theme Sandbox */}
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div 
          className={cn(
            "transition-all duration-300 p-4 md:p-8 rounded-3xl",
            isDarkMode ? "dark" : ""
          )}
          style={{
            ...cssVariables as React.CSSProperties,
            backgroundColor: resolvedTokens.background,
            color: resolvedTokens.ink,
          }}
          data-theme-preset={selectedPresetId}
          data-theme-category={selectedPreset.category}
          data-theme-ornament={ornament ? 'true' : 'false'}
          data-gold-accent={goldAccent || selectedPresetId === 'sky-emas' ? 'true' : 'false'}
          data-neon-glow={neonGlow ? 'true' : 'false'}
          data-motion={motion}
        >
          {/* Metadata Bar inside Sandbox */}
          <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">Preset Aktif:</span>
              <Badge className="bg-primary text-primary-foreground font-mono">
                {selectedPreset.name} ({selectedPreset.id})
              </Badge>
              <Badge variant="outline" className="font-mono text-[10px]">
                Ornamen: {effectiveOrnament}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>Primary: <code className="text-primary font-bold">{resolvedTokens.primary}</code></span>
              <span>•</span>
              <span>Primary FG: <code className="font-bold">{resolvedTokens.primaryForeground}</code></span>
              <span>•</span>
              <span>Background: <code>{resolvedTokens.background}</code></span>
            </div>
          </div>

          {/* Presentation Views Grid */}
          <div className="max-w-7xl mx-auto">
            {/* View A: Both (Side by Side) */}
            {activeView === 'both' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Mobile Screen Container (Col 1-4) */}
                <div className="xl:col-span-4 flex flex-col items-center">
                  <div className="w-full max-w-[390px] mb-2 flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-primary" />
                      <span>Beranda Wali Santri (390px)</span>
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Mobile Frame
                    </Badge>
                  </div>

                  {/* Device Frame */}
                  <div className="w-full max-w-[390px] rounded-[36px] p-2 bg-slate-900 border-4 border-slate-700 shadow-2xl overflow-hidden">
                    <WaliDashboardPresentation
                      ornamentType={effectiveOrnament}
                      showGoldAccent={goldAccent}
                      showNeonGlow={neonGlow && selectedPresetId === 'islami-sky'}
                    />
                  </div>
                </div>

                {/* Desktop Screen Container (Col 5-12) */}
                <div className="xl:col-span-8 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                    <span className="flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-primary" />
                      <span>Dasbor Admin / Pengurus (Responsif Desktop 1440px)</span>
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Desktop Shell
                    </Badge>
                  </div>

                  <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm overflow-hidden">
                    <AdminDashboardPresentation
                      ornamentType={effectiveOrnament}
                      showGoldAccent={goldAccent}
                      showNeonGlow={neonGlow && selectedPresetId === 'islami-sky'}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* View B: Fokus Mobile (390px) */}
            {activeView === 'mobile' && (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-full max-w-[390px] mb-3 flex items-center justify-between text-xs font-bold text-muted-foreground px-2">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-primary" />
                    <span>Fokus: Beranda Wali Santri (Mobile 390px Frame)</span>
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    390 x 844 px
                  </Badge>
                </div>

                <div className="w-full max-w-[390px] rounded-[40px] p-2.5 bg-slate-900 border-4 border-slate-700 shadow-2xl overflow-hidden">
                  <WaliDashboardPresentation
                    ornamentType={effectiveOrnament}
                    showGoldAccent={goldAccent}
                    showNeonGlow={neonGlow && selectedPresetId === 'islami-sky'}
                  />
                </div>
              </div>
            )}

            {/* View C: Fokus Desktop (1440px) */}
            {activeView === 'desktop' && (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                  <span className="flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-primary" />
                    <span>Fokus: Dasbor Admin / Pengurus (Desktop 1440px Canvas)</span>
                  </span>
                  <Badge variant="secondary" className="text-[10px]">
                    1440px Scalable Container
                  </Badge>
                </div>

                <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-md overflow-hidden">
                  <AdminDashboardPresentation
                    ornamentType={effectiveOrnament}
                    showGoldAccent={goldAccent}
                    showNeonGlow={neonGlow && selectedPresetId === 'islami-sky'}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

