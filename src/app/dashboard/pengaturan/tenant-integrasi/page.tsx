'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks';
import { PageCard } from '@/components/shared/page-header';
import { 
  CreditCard, Key, ShieldCheck, MessageSquare, Save, CheckCircle2, 
  Building2, HardDrive, Sparkles, Check, Info, Search, X, 
  Eye, EyeOff, AlertCircle, ChevronDown, Lock, Settings2
} from 'lucide-react';

interface TenantCredential {
  id: string;
  name: string;
  subdomain: string;
  location: string;
  flipStatus: 'Connected' | 'Pending Token' | 'Unconfigured';
  flipSecretKey: string;
  flipValidationToken: string;
  waStatus: 'Connected' | 'Unconfigured' | 'Disabled';
  waGatewayApiKey: string;
  driveStatus: 'Connected' | 'Unconfigured';
  gdriveJson: string;
}

const initialTenantsCredentials: Record<string, TenantCredential> = {
  t1: {
    id: 't1',
    name: 'Ponpes Daruttahuid',
    subdomain: 'daruttahuid.madev.id',
    location: 'Malang, Jawa Timur',
    flipStatus: 'Connected',
    flipSecretKey: 'skey_live_daruttahuid_99218',
    flipValidationToken: 'val_tok_daruttahuid_7718',
    waStatus: 'Connected',
    waGatewayApiKey: 'wa_api_key_daruttahuid_081234',
    driveStatus: 'Connected',
    gdriveJson: JSON.stringify({ type: "service_account", project_id: "daruttahuid-gdrive-storage", client_email: "backup@daruttahuid-storage.iam.gserviceaccount.com" }, null, 2),
  },
  t2: {
    id: 't2',
    name: 'Ponpes Al-Hikmah',
    subdomain: 'alhikmah.madev.id',
    location: 'Surabaya, Jawa Timur',
    flipStatus: 'Connected',
    flipSecretKey: 'skey_live_alhikmah_88123',
    flipValidationToken: 'val_tok_alhikmah_6621',
    waStatus: 'Connected',
    waGatewayApiKey: 'wa_api_key_alhikmah_085678',
    driveStatus: 'Connected',
    gdriveJson: JSON.stringify({ type: "service_account", project_id: "alhikmah-storage", client_email: "drive@alhikmah-gserviceaccount.com" }, null, 2),
  },
  t3: {
    id: 't3',
    name: 'Ponpes An-Nisa',
    subdomain: 'annisa.madev.id',
    location: 'Jakarta Selatan, DKI',
    flipStatus: 'Pending Token',
    flipSecretKey: 'skey_live_annisa_77341',
    flipValidationToken: '',
    waStatus: 'Connected',
    waGatewayApiKey: 'wa_api_key_annisa_089012',
    driveStatus: 'Connected',
    gdriveJson: JSON.stringify({ type: "service_account", project_id: "annisa-gdrive", client_email: "docs@annisa-gserviceaccount.com" }, null, 2),
  },
  t4: {
    id: 't4',
    name: 'Ponpes Ar-Raudah',
    subdomain: 'arraudah.madev.id',
    location: 'Bandung, Jawa Barat',
    flipStatus: 'Connected',
    flipSecretKey: 'skey_live_arraudah_11223',
    flipValidationToken: 'val_tok_arraudah_4455',
    waStatus: 'Disabled',
    waGatewayApiKey: '',
    driveStatus: 'Connected',
    gdriveJson: JSON.stringify({ type: "service_account", project_id: "arraudah-gdrive", client_email: "docs@arraudah-gserviceaccount.com" }, null, 2),
  },
  t5: {
    id: 't5',
    name: 'Ponpes Darul Quran',
    subdomain: 'dq.madev.id',
    location: 'Yogyakarta, DIY',
    flipStatus: 'Unconfigured',
    flipSecretKey: '',
    flipValidationToken: '',
    waStatus: 'Unconfigured',
    waGatewayApiKey: '',
    driveStatus: 'Connected',
    gdriveJson: JSON.stringify({ type: "service_account", project_id: "dq-storage", client_email: "drive@dq-gserviceaccount.com" }, null, 2),
  },
};

export default function TenantIntegrationPage() {
  const { user } = useAuth();
  const isDevOrSuperAdmin = user?.role === 'developer' || user?.role === 'super_admin';

  const [tenantsMap, setTenantsMap] = useState<Record<string, TenantCredential>>(initialTenantsCredentials);
  const [search, setSearch] = useState('');
  const [selectedDropdownId, setSelectedDropdownId] = useState('t1');

  // Modal Panel State for Editing Credential
  const [editingTenant, setEditingTenant] = useState<TenantCredential | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form Fields inside modal
  const [formFlipSecret, setFormFlipSecret] = useState('');
  const [formFlipToken, setFormFlipToken] = useState('');
  const [formWaKey, setFormWaKey] = useState('');
  const [formGdriveJson, setFormGdriveJson] = useState('');

  const handleOpenPanel = (tenant: TenantCredential) => {
    setEditingTenant(tenant);
    setFormFlipSecret(tenant.flipSecretKey);
    setFormFlipToken(tenant.flipValidationToken);
    setFormWaKey(tenant.waGatewayApiKey);
    setFormGdriveJson(tenant.gdriveJson);
  };

  const handleDropdownChange = (id: string) => {
    setSelectedDropdownId(id);
    const target = tenantsMap[id];
    if (target) {
      handleOpenPanel(target);
    }
  };

  const handleSaveCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    const updated: TenantCredential = {
      ...editingTenant,
      flipSecretKey: formFlipSecret,
      flipValidationToken: formFlipToken,
      flipStatus: formFlipSecret && formFlipToken ? 'Connected' : formFlipSecret ? 'Pending Token' : 'Unconfigured',
      waGatewayApiKey: formWaKey,
      waStatus: formWaKey ? 'Connected' : 'Unconfigured',
      gdriveJson: formGdriveJson,
      driveStatus: formGdriveJson ? 'Connected' : 'Unconfigured',
    };

    setTenantsMap(prev => ({ ...prev, [editingTenant.id]: updated }));
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setEditingTenant(null);
    }, 1500);
  };

  const tenantsList = Object.values(tenantsMap).filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subdomain.toLowerCase().includes(search.toLowerCase()) ||
    t.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Ready-to-Integrate Concept Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>SaaS Ready-to-Integrate Engine</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Status & Kredensial Integrasi Mandiri Per-Pesantren
          </h2>
          <p className="text-emerald-100/90 text-xs md:text-sm max-w-3xl leading-relaxed">
            Platform Madev menyediakan sistem yang siap dihubungkan dengan akun <strong className="text-white">Flip Payment Gateway, WhatsApp Gateway, dan Google Drive Cloud Storage</strong> milik masing-masing pesantren.
          </p>
        </div>
      </div>

      <PageCard
        title="Daftar Status Kredensial Integrasi Pesantren"
        description="Pilih pesantren dari dropdown atau tabel di bawah untuk menengok dan memperbarui panel kredensial API"
      >
        {/* Top Control Bar: Dropdown & Search */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-200 dark:border-stone-800">
          
          {/* Dropdown Selector (Efficient Quick Jump) */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Pilih Pesantren Instan (Dropdown)
              </label>
              <div className="relative">
                <select
                  value={selectedDropdownId}
                  onChange={(e) => handleDropdownChange(e.target.value)}
                  className="w-full md:w-80 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer shadow-sm pr-8"
                >
                  {Object.values(tenantsMap).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subdomain})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Search filter */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pesantren, subdomain..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* Credentials Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Pesantren & Subdomain</th>
                <th className="py-3 px-4">Flip Payment Gateway</th>
                <th className="py-3 px-4">WhatsApp Gateway</th>
                <th className="py-3 px-4">Google Drive Storage</th>
                <th className="py-3 px-4 text-right">Aksi Panel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200 font-medium">
              {tenantsList.map((t) => (
                <tr key={t.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="font-bold text-stone-900 dark:text-white text-sm">{t.name}</div>
                    <div className="text-stone-400 text-[11px] font-mono">{t.subdomain} • {t.location}</div>
                  </td>

                  {/* Flip Status */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${t.flipStatus === 'Connected' ? 'bg-emerald-500 animate-pulse' : t.flipStatus === 'Pending Token' ? 'bg-amber-500' : 'bg-red-500'}`} />
                      <span className={`font-semibold ${t.flipStatus === 'Connected' ? 'text-emerald-700 dark:text-emerald-400' : t.flipStatus === 'Pending Token' ? 'text-amber-700 dark:text-amber-400' : 'text-red-600'}`}>
                        {t.flipStatus}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {t.flipSecretKey ? 'Secret Key Configured' : 'Key Belum Diisi'}
                    </div>
                  </td>

                  {/* WA Gateway Status */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${t.waStatus === 'Connected' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                      <span className={`font-semibold ${t.waStatus === 'Connected' ? 'text-blue-700 dark:text-blue-400' : 'text-stone-500'}`}>
                        {t.waStatus}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {t.waGatewayApiKey ? 'Server API Key Active' : 'Nonaktif'}
                    </div>
                  </td>

                  {/* Google Drive Status */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${t.driveStatus === 'Connected' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                      <span className={`font-semibold ${t.driveStatus === 'Connected' ? 'text-teal-700 dark:text-teal-400' : 'text-stone-500'}`}>
                        {t.driveStatus}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5">
                      {t.gdriveJson ? 'Service Account Ready' : 'Unconfigured'}
                    </div>
                  </td>

                  {/* Action Button to Open Panel */}
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => handleOpenPanel(t)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>Kelola Kredensial</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>

      {/* MODAL PANEL EDIT KREDENSIAL */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6 my-8 animate-in fade-in zoom-in-95">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white">Panel Kredensial API Tenant</h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">{editingTenant.name} ({editingTenant.subdomain})</p>
                </div>
              </div>
              <button onClick={() => setEditingTenant(null)} className="text-stone-400 hover:text-stone-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCredential} className="space-y-6">
              {/* Section 1: Flip for Business */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-xs">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>1. Flip for Business Payment Gateway (Mandiri Pesantren)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">Flip Secret Key</label>
                    <div className="relative">
                      <input
                        type={showSecretKey ? 'text' : 'password'}
                        value={formFlipSecret}
                        onChange={(e) => setFormFlipSecret(e.target.value)}
                        placeholder="skey_live_..."
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-mono pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                      >
                        {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">Flip Validation Token</label>
                    <input
                      type="password"
                      value={formFlipToken}
                      onChange={(e) => setFormFlipToken(e.target.value)}
                      placeholder="val_token_..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: WhatsApp Gateway */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-xs">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>2. WhatsApp Gateway Notification (Nomor Server Pesantren)</span>
                </div>
                
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">API Key Server WhatsApp</label>
                  <input
                    type="password"
                    value={formWaKey}
                    onChange={(e) => setFormWaKey(e.target.value)}
                    placeholder="wa_api_key_..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Section 3: Google Drive Storage */}
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-xs">
                  <HardDrive className="w-4 h-4 text-amber-600" />
                  <span>3. Google Drive Service Account JSON (Storage Document)</span>
                </div>
                
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 dark:text-stone-400 mb-1">Service Account JSON Credential</label>
                  <textarea
                    rows={4}
                    value={formGdriveJson}
                    onChange={(e) => setFormGdriveJson(e.target.value)}
                    placeholder="{ ... }"
                    className="w-full p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
                {saved ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 animate-pulse">
                    <CheckCircle2 className="w-4 h-4" /> Kredensial {editingTenant.name} Berhasil Disimpan!
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-400">Kredensial disimpan langsung ke database tenant.</span>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingTenant(null)}
                    className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Kredensial</span>
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
