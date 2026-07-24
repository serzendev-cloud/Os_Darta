'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { CreditCard, Key, ShieldCheck, MessageSquare, Save, CheckCircle2 } from 'lucide-react';

export default function TenantIntegrationPage() {
  const [saved, setSaved] = useState(false);
  const [flipSecretKey, setFlipSecretKey] = useState('secret_flip_live_demo_12345');
  const [flipValidationToken, setFlipValidationToken] = useState('token_val_demo_98765');
  const [waGatewayApiKey, setWaGatewayApiKey] = useState('wa_api_key_demo');
  const [gdriveJson, setGdriveJson] = useState('{\n  "type": "service_account",\n  "project_id": "mahad-manager"\n}');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageCard
        title="Pengaturan Integrasi Tenant"
        description="Kelola credential mandiri API Flip for Business, Service Account Google Drive, dan WA Gateway per-pesantren"
      >
        <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
          {/* Flip for Business Section */}
          <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Flip for Business Payment Gateway</h3>
                <p className="text-xs text-muted-foreground">
                  Digunakan untuk membuat invois gabungan (SPP + Top-Up Saldo) & webhook callback otomatis
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Flip Secret Key</label>
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
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Flip Validation Token</label>
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
                <h3 className="font-semibold text-foreground">WhatsApp Gateway Notification</h3>
                <p className="text-xs text-muted-foreground">
                  Notifikasi otomatis ke Wali Santri saat Tap RFID Absensi & Presensi Izin Keluar/Masuk
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted-foreground">API Key WA Gateway</label>
              <input
                type="password"
                value={waGatewayApiKey}
                onChange={(e) => setWaGatewayApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono"
              />
            </div>
          </div>

          {/* GDrive Service Account */}
          <div className="p-5 rounded-2xl bg-muted/40 border border-border/60 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Google Drive Service Account JSON</h3>
                <p className="text-xs text-muted-foreground">
                  Kunci penyimpanan dokumen resmi pesantren (Surat Izin, Dokumen UKS, dll.)
                </p>
              </div>
            </div>

            <div>
              <textarea
                rows={4}
                value={gdriveJson}
                onChange={(e) => setGdriveJson(e.target.value)}
                className="w-full p-3 rounded-xl bg-background border border-border text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Simpan Pengaturan Integrasi
            </button>

            {saved && (
              <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Pengaturan berhasil disimpan!
              </span>
            )}
          </div>
        </form>
      </PageCard>
    </div>
  );
}
