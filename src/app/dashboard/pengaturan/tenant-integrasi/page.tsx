'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks';
import { PageCard } from '@/components/shared/page-header';
import { CreditCard, Key, ShieldCheck, MessageSquare, Save, CheckCircle2, Building2, HardDrive, Sparkles, Check, Info } from 'lucide-react';

interface TenantConfig {
  id: string;
  name: string;
  subdomain: string;
  flipSecretKey: string;
  flipValidationToken: string;
  waGatewayApiKey: string;
  gdriveJson: string;
}

const mockTenantsConfig: Record<string, TenantConfig> = {
  t1: {
    id: 't1',
    name: 'Ponpes Daruttahuid (Malang)',
    subdomain: 'daruttahuid.madev.id',
    flipSecretKey: 'skey_live_daruttahuid_99218',
    flipValidationToken: 'val_tok_daruttahuid_7718',
    waGatewayApiKey: 'wa_api_key_daruttahuid_081234',
    gdriveJson: JSON.stringify({ type: "service_account", project_id: "daruttahuid-gdrive-storage", client_email: "backup@daruttahuid-storage.iam.gserviceaccount.com" }, null, 2),
  },
  t2: {
    id: 't2',
    name: 'Ponpes Al-Hikmah (Surabaya)',
    subdomain: 'alhikmah.madev.id',
    flipSecretKey: 'skey_live_alhikmah_88123',
    flipValidationToken: 'val_tok_alhikmah_6621',
    waGatewayApiKey: 'wa_api_key_alhikmah_085678',
    gdriveJson: JSON.stringify({ type: "service_account", project_id: "alhikmah-storage", client_email: "drive@alhikmah-gserviceaccount.com" }, null, 2),
  },
  t3: {
    id: 't3',
    name: 'Ponpes An-Nisa (Jakarta)',
    subdomain: 'annisa.madev.id',
    flipSecretKey: 'skey_live_annisa_77341',
    flipValidationToken: 'val_tok_annisa_5512',
    waGatewayApiKey: 'wa_api_key_annisa_089012',
    gdriveJson: JSON.stringify({ type: "service_account", project_id: "annisa-gdrive", client_email: "docs@annisa-gserviceaccount.com" }, null, 2),
  },
};

export default function TenantIntegrationPage() {
  const { user } = useAuth();
  const isDevOrSuperAdmin = user?.role === 'developer' || user?.role === 'super_admin';

  const [selectedTenantId, setSelectedTenantId] = useState('t1');
  const [saved, setSaved] = useState(false);

  const currentConfig = mockTenantsConfig[selectedTenantId] || mockTenantsConfig['t1'];

  const [flipSecretKey, setFlipSecretKey] = useState(currentConfig.flipSecretKey);
  const [flipValidationToken, setFlipValidationToken] = useState(currentConfig.flipValidationToken);
  const [waGatewayApiKey, setWaGatewayApiKey] = useState(currentConfig.waGatewayApiKey);
  const [gdriveJson, setGdriveJson] = useState(currentConfig.gdriveJson);

  const handleSelectTenant = (id: string) => {
    setSelectedTenantId(id);
    const cfg = mockTenantsConfig[id];
    if (cfg) {
      setFlipSecretKey(cfg.flipSecretKey);
      setFlipValidationToken(cfg.flipValidationToken);
      setWaGatewayApiKey(cfg.waGatewayApiKey);
      setGdriveJson(cfg.gdriveJson);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Ready-to-Integrate Concept Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>SaaS Ready-to-Integrate Engine</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Pengaturan Integrasi Mandiri Per-Tenant (Pesantren)
          </h2>
          <p className="text-emerald-100/90 text-xs md:text-sm max-w-3xl leading-relaxed">
            Platform Madev tidak menyediakan akun Google Drive atau WA Gateway terpusat milik SaaS, melainkan menyediakan <strong className="text-white">mesin sistem yang siap dihubungkan</strong> dengan Google Drive, WA Gateway, dan Payment Gateway mandiri dari masing-masing pesantren.
          </p>
        </div>
      </div>

      <PageCard
        title="Konfigurasi Credential Per-Pesantren"
        description="Pilih pesantren target dan masukkan API Key / Service Account khusus milik lembaga tersebut"
      >
        {/* Tenant Selector Dropdown (visible for Developer / Super Admin) */}
        {isDevOrSuperAdmin && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-8 space-y-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>Mode Developer / Super Admin: Pilih Pesantren Target</span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Sebagai Developer/Super Admin SaaS, Anda dapat memilih pesantren yang ingin dikonfigurasikan kredensialnya:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {Object.values(mockTenantsConfig).map((t) => {
                const isSelected = selectedTenantId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTenant(t.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 hover:border-emerald-400'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    <span>{t.name}</span>
                    <span className="opacity-60 text-[10px]">({t.subdomain})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
          {/* Target Info */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-semibold">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Target Konfigurasi Saat Ini: <strong className="text-emerald-700 dark:text-emerald-400">{currentConfig.name}</strong></span>
            </div>
            <span className="font-mono text-stone-500">{currentConfig.subdomain}</span>
          </div>

          {/* Flip for Business Section */}
          <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Flip for Business Payment Gateway (Mandiri Pesantren)</h3>
                <p className="text-xs text-muted-foreground">
                  Digunakan untuk menerima tagihan SPP & Top-Up Saldo Kantin RFID langsung ke rekening pesantren {currentConfig.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Flip Secret Key Pesantren</label>
                <div className="relative">
                  <input
                    type="password"
                    value={flipSecretKey}
                    onChange={(e) => setFlipSecretKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono"
                    placeholder="skey_live_..."
                  />
                  <Key className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Flip Validation Token Pesantren</label>
                <div className="relative">
                  <input
                    type="password"
                    value={flipValidationToken}
                    onChange={(e) => setFlipValidationToken(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono"
                    placeholder="val_token_..."
                  />
                  <ShieldCheck className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* WhatsApp Gateway */}
          <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">WhatsApp Gateway Notification (Nomor Pesantren)</h3>
                <p className="text-xs text-muted-foreground">
                  API Key server WA milik pesantren {currentConfig.name} untuk pengiriman notifikasi Tap RFID, izin keluar, & pengumuman
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted-foreground">API Key WA Gateway Pesantren</label>
              <input
                type="password"
                value={waGatewayApiKey}
                onChange={(e) => setWaGatewayApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono"
                placeholder="wa_api_key_..."
              />
            </div>
          </div>

          {/* GDrive Service Account */}
          <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Google Drive Service Account JSON (Storage Pesantren)</h3>
                <p className="text-xs text-muted-foreground">
                  Akun penyimpanan Cloud Google Drive milik pesantren {currentConfig.name} untuk arsip surat resmi, foto santri, & berkas UKS
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted-foreground">JSON Credential Key (Google Cloud Console Pesantren)</label>
              <textarea
                rows={5}
                value={gdriveJson}
                onChange={(e) => setGdriveJson(e.target.value)}
                className="w-full p-3 rounded-xl bg-background border border-border text-xs font-mono"
                placeholder="{ ... }"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Save className="w-4 h-4" />
              Simpan Integrasi {currentConfig.name}
            </button>

            {saved && (
              <span className="text-xs text-emerald-600 flex items-center gap-1 font-semibold animate-pulse">
                <CheckCircle2 className="w-4 h-4" /> Kredensial integrasi {currentConfig.name} berhasil disimpan!
              </span>
            )}
          </div>
        </form>
      </PageCard>
    </div>
  );
}
