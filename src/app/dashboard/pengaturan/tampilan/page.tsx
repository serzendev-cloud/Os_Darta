'use client';

import React, { useState, useEffect } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  Sparkles, 
  Check, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Moon, 
  Sun,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { THEME_PRESETS, THEME_REGISTRY } from '@/themes/registry';
import { ThemePresetId, ThemeSettings } from '@/themes/types';
import { useAppTheme } from '@/components/theme/ThemeProvider';
import { MosqueOrnament3D } from '@/components/theme/MosqueOrnament3D';
import { AbstractPattern } from '@/components/theme/AbstractPattern';
import { cn } from '@/lib/utils';

export default function PengaturanTampilanPage() {
  const { themeSettings, updateLocalThemeSettings, isDark } = useAppTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Local editable settings
  const [selectedPreset, setSelectedPreset] = useState<ThemePresetId>(themeSettings.preset);
  const [goldAccent, setGoldAccent] = useState<boolean>(themeSettings.goldAccent);
  const [neonGlow, setNeonGlow] = useState<boolean>(themeSettings.neonGlow);
  const [ornament, setOrnament] = useState<boolean>(themeSettings.ornament);
  const [motion, setMotion] = useState<'soft' | 'standard' | 'off'>(themeSettings.motion);

  // Existing branding fields to preserve on save
  const [brandingBase, setBrandingBase] = useState<{
    loginTitle?: string;
    loginSubtitle?: string;
    loginDescription?: string;
    customLogoUrl?: string;
    customBgUrl?: string;
    primaryColor?: string;
    tagline?: string;
  }>({});

  // Fetch current settings on mount
  useEffect(() => {
    async function fetchBranding() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/tenant/branding');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setBrandingBase({
              loginTitle: json.data.loginTitle,
              loginSubtitle: json.data.loginSubtitle,
              loginDescription: json.data.loginDescription,
              customLogoUrl: json.data.customLogoUrl,
              customBgUrl: json.data.customBgUrl,
              primaryColor: json.data.primaryColor,
              tagline: json.data.tagline,
            });

            if (json.data.themeSettings) {
              const ts = json.data.themeSettings;
              setSelectedPreset(ts.preset);
              setGoldAccent(Boolean(ts.goldAccent));
              setNeonGlow(Boolean(ts.neonGlow));
              setOrnament(Boolean(ts.ornament));
              setMotion(ts.motion || 'soft');
            }
          }
        }
      } catch (err) {
        console.error('Gagal memuat pengaturan tema:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBranding();
  }, []);

  // Sync to live provider whenever local controls change for instantaneous preview
  const handleSelectPreset = (presetId: ThemePresetId) => {
    setSelectedPreset(presetId);
    updateLocalThemeSettings({
      preset: presetId,
      goldAccent,
      neonGlow: presetId === 'islami-sky' ? neonGlow : false,
      ornament,
      motion,
    });
  };

  const handleToggleGoldAccent = (checked: boolean) => {
    setGoldAccent(checked);
    updateLocalThemeSettings({ goldAccent: checked });
  };

  const handleToggleNeonGlow = (checked: boolean) => {
    setNeonGlow(checked);
    updateLocalThemeSettings({ neonGlow: checked });
  };

  const handleToggleOrnament = (checked: boolean) => {
    setOrnament(checked);
    updateLocalThemeSettings({ ornament: checked });
  };

  const handleMotionChange = (val: 'soft' | 'standard' | 'off') => {
    setMotion(val);
    updateLocalThemeSettings({ motion: val });
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setToastMsg('');
    setErrorMsg('');

    try {
      const payload = {
        ...brandingBase,
        themeSettings: {
          preset: selectedPreset,
          goldAccent,
          neonGlow: selectedPreset === 'islami-sky' ? neonGlow : false,
          ornament,
          motion,
        },
      };

      const res = await fetch('/api/tenant/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Gagal menyimpan konfigurasi tema.');
      }

      setToastMsg('Pengaturan tema berhasil disimpan dan diterapkan pada seluruh sistem!');
      setTimeout(() => setToastMsg(''), 5000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group presets
  const neutralPresets = THEME_PRESETS.filter((p) => p.category === 'Netral');
  const islamicPresets = THEME_PRESETS.filter((p) => p.category === 'Islami');
  const coloredPresets = THEME_PRESETS.filter((p) => p.category === 'Berwarna');
  const darkPresets = THEME_PRESETS.filter((p) => p.category === 'Gelap');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Notifications */}
      {toastMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm font-medium">{toastMsg}</p>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Main Header Card */}
      <PageCard
        title="Tema & Tampilan Shell"
        description="Pilih salah satu dari 11 tema kelas satu yang dirancang khusus untuk APP MA'HAD atau sesuaikan aksen visual khas lembaga Anda."
        action={
          <Badge variant="outline" className="gap-1.5 border-primary/40 bg-primary/10 text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            Theme Foundation v2
          </Badge>
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Tema Aktif:</span>
              <Badge variant="secondary" className="font-mono uppercase text-xs">
                {THEME_REGISTRY[selectedPreset]?.name || selectedPreset}
              </Badge>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              {isDark ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
              <span>{isDark ? 'Mode Gelap' : 'Mode Terang'}</span>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isLoading || isSubmitting}
            className="gap-2 font-bold shadow-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Simpan & Terapkan
              </>
            )}
          </Button>
        </div>
      </PageCard>

      {/* Controls & Options Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toggle Gold Accent */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Aksen Emas</span>
              <Badge className="bg-[#F3C74A] text-[#4A3300] hover:bg-[#F3C74A]/90 text-[10px] font-bold">
                Gold #F3C74A
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Garis emas 4px di bawah header, tombol aksi bernuansa emas, dan cincin emas.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between">
            <Label htmlFor="toggle-gold" className="text-xs font-semibold cursor-pointer">
              {goldAccent ? 'Aktif' : 'Nonaktif'}
            </Label>
            <Switch
              id="toggle-gold"
              checked={goldAccent}
              onCheckedChange={handleToggleGoldAccent}
            />
          </div>
        </div>

        {/* Toggle Neon Glow */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Neon Glow Islami</span>
              <Badge variant="outline" className="text-[10px]">
                {selectedPreset === 'islami-sky' ? 'Tersedia' : 'Khusus Islami-Sky'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Efek pendar lembut cyan-emerald pada badge dan kartu (hanya pada tema Islami Sky).
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between">
            <Label htmlFor="toggle-neon" className={cn("text-xs font-semibold cursor-pointer", selectedPreset !== 'islami-sky' && 'opacity-50')}>
              {neonGlow && selectedPreset === 'islami-sky' ? 'Aktif' : 'Nonaktif'}
            </Label>
            <Switch
              id="toggle-neon"
              disabled={selectedPreset !== 'islami-sky'}
              checked={neonGlow && selectedPreset === 'islami-sky'}
              onCheckedChange={handleToggleNeonGlow}
            />
          </div>
        </div>

        {/* Toggle Kubah Ornament */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Ornamen Header</span>
              <Badge variant="outline" className="text-[10px]">
                Adaptif Tema
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Kubah masjid 3D untuk tema Islami, kurva paper-cut bersih untuk tema Netral.
            </p>
          </div>
          <div className="pt-4 flex items-center justify-between">
            <Label htmlFor="toggle-ornament" className="text-xs font-semibold cursor-pointer">
              {ornament ? 'Ditampilkan' : 'Disembunyikan'}
            </Label>
            <Switch
              id="toggle-ornament"
              checked={ornament}
              onCheckedChange={handleToggleOrnament}
            />
          </div>
        </div>

        {/* Motion Preference */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Animasi & Gerak</span>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">
              Mengatur ritme dan kehalusan transisi animasi shell antarmuka.
            </p>
          </div>
          <div className="pt-3 flex gap-1">
            {(['soft', 'standard', 'off'] as const).map((m) => (
              <button
                key={m}
                onClick={() => handleMotionChange(m)}
                className={cn(
                  'flex-1 py-1 px-2 rounded-lg text-xs font-medium capitalize transition-colors',
                  motion === m
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {m === 'soft' ? 'Lembut' : m === 'standard' ? 'Standar' : 'Off'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preset Catalogue Grid */}
      <div className="space-y-8 pt-4">
        {/* 1. Neutral Category */}
        <PresetGroupSection
          title={`Tema Netral & Universal (${neutralPresets.length} Preset)`}
          description="Baseline minimalis modern bernuansa biru langit netral, slate, dan monokromatik bersih tanpa ornamen keagamaan."
          presets={neutralPresets}
          selectedPreset={selectedPreset}
          onSelect={handleSelectPreset}
          goldAccent={goldAccent}
          ornament={ornament}
          isDark={isDark}
        />

        {/* 2. Islami Category */}
        <PresetGroupSection
          title={`Tema Nuansa Islami (${islamicPresets.length} Preset)`}
          description="Palet teal, emerald zamrud, dan aksen emas klasik khas ma'had dengan siluet kubah 3D."
          presets={islamicPresets}
          selectedPreset={selectedPreset}
          onSelect={handleSelectPreset}
          goldAccent={goldAccent}
          ornament={ornament}
          isDark={isDark}
        />

        {/* 3. Colored Category */}
        <PresetGroupSection
          title={`Tema Berwarna & Identitas (${coloredPresets.length} Preset)`}
          description="Pilihan warna hangat fajar, biru langit sejuk, dan penyesuaian warna kustom lembaga."
          presets={coloredPresets}
          selectedPreset={selectedPreset}
          onSelect={handleSelectPreset}
          goldAccent={goldAccent}
          ornament={ornament}
          isDark={isDark}
        />

        {/* 4. Dark Category */}
        <PresetGroupSection
          title={`Tema Gelap & Obsidian (${darkPresets.length} Preset)`}
          description="Tema gelap elegan untuk kenyamanan mata di malam hari dan tampilan futuristik."
          presets={darkPresets}
          selectedPreset={selectedPreset}
          onSelect={handleSelectPreset}
          goldAccent={goldAccent}
          ornament={ornament}
          isDark={isDark}
        />
      </div>
    </div>
  );
}

interface PresetGroupSectionProps {
  title: string;
  description: string;
  presets: typeof THEME_PRESETS;
  selectedPreset: ThemePresetId;
  onSelect: (id: ThemePresetId) => void;
  goldAccent: boolean;
  ornament: boolean;
  isDark: boolean;
}

function PresetGroupSection({
  title,
  description,
  presets,
  selectedPreset,
  onSelect,
  goldAccent,
  ornament,
  isDark,
}: PresetGroupSectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {presets.map((preset) => {
          const isSelected = selectedPreset === preset.id;
          const tokens = isDark ? preset.dark : preset.light;
          const isWhiteTheme = preset.id === 'putih' && !isDark;

          return (
            <div
              key={preset.id}
              onClick={() => onSelect(preset.id)}
              className={cn(
                'group relative rounded-2xl border-2 transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between bg-card hover:shadow-lg',
                isSelected
                  ? 'border-primary shadow-md ring-2 ring-primary/20'
                  : 'border-border hover:border-border/80'
              )}
            >
              {/* Card Header Preview Area */}
              <div
                className="h-28 w-full relative overflow-hidden p-3 flex flex-col justify-between"
                style={{ background: tokens.headerGradient }}
              >
                {/* Contrast dark scrim guarantee for colored headers, omitted on white theme */}
                {!isWhiteTheme && (
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/35 via-black/10 to-transparent pointer-events-none" />
                )}

                {/* Optional Ornament: Mosque for Islamic themes, Paper-cut waves for Neutral */}
                {ornament && preset.supportsMosqueOrnament && (
                  <div className="absolute -bottom-2 -right-2 pointer-events-none opacity-40">
                    <MosqueOrnament3D className="w-20 h-20" />
                  </div>
                )}
                {ornament && !preset.supportsMosqueOrnament && (
                  <div className="absolute inset-0 pointer-events-none opacity-25">
                    <AbstractPattern showLattice={false} />
                  </div>
                )}

                {/* Optional Gold Line */}
                {goldAccent && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F3C74A]" />
                )}

                {/* Top Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className={cn(
                    "text-[11px] font-bold tracking-wider uppercase",
                    isWhiteTheme ? "text-slate-900" : "text-white drop-shadow-sm"
                  )}>
                    {preset.name}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-stone-900 shadow-sm">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Aktif
                    </span>
                  )}
                </div>

                {/* Bottom preview info */}
                <div className={cn(
                  "relative z-10 text-[10px] font-medium",
                  isWhiteTheme ? "text-slate-700" : "text-white/90"
                )}>
                  Header Gradien 4-Stop
                </div>
              </div>

              {/* Card Content & Token Chips */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {preset.description}
                  </p>
                </div>

                {/* Color swatches */}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: tokens.primary }}
                      title={`Primary: ${tokens.primary}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: tokens.primaryStrong }}
                      title={`Primary Strong: ${tokens.primaryStrong}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: tokens.sky }}
                      title={`Sky: ${tokens.sky}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: tokens.surface }}
                      title={`Surface: ${tokens.surface}`}
                    />
                  </div>

                  <span className={cn(
                    'text-xs font-semibold flex items-center gap-1',
                    isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}>
                    {isSelected ? 'Terpilih' : 'Terapkan'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
