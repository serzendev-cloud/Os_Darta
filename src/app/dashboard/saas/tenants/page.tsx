'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  Building2, Plus, Search, CheckCircle2, Clock, 
  Key, ShieldCheck, CreditCard, Sparkles, ExternalLink, 
  Users, Check, Sliders, Smartphone, HardDrive, ShoppingCart, 
  Stethoscope, Trophy, ToggleLeft, ToggleRight, X, ShieldAlert, Power
} from 'lucide-react';

interface TenantModules {
  paymentGateway: boolean;
  waGateway: boolean;
  rfidGate: boolean;
  posKantin: boolean;
  uksKesehatan: boolean;
  gdriveStorage: boolean;
  questKarakter: boolean;
}

interface ActiveTenant {
  id: string;
  name: string;
  subdomain: string;
  location: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  plan: string;
  status: 'aktif' | 'trial' | 'suspended';
  santriCount: number;
  createdAt: string;
  modules: TenantModules;
}

interface TrialRequest {
  id: string;
  name: string;
  subdomainReq: string;
  location: string;
  applicantName: string;
  applicantRole: string;
  email: string;
  phone: string;
  requestedPlan: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

const defaultModules: TenantModules = {
  paymentGateway: true,
  waGateway: true,
  rfidGate: true,
  posKantin: true,
  uksKesehatan: true,
  gdriveStorage: true,
  questKarakter: true,
};

const mockActiveTenants: ActiveTenant[] = [];
const mockTrialRequests: TrialRequest[] = [];

export default function SaasTenantsPage() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'requests'>('tenants');
  const [tenants, setTenants] = useState<ActiveTenant[]>(mockActiveTenants);
  const [requests, setRequests] = useState<TrialRequest[]>(mockTrialRequests);
  const [search, setSearch] = useState('');
  
  // New Tenant Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newPlan, setNewPlan] = useState('Pro SaaS');

  // Feature Toggle Modal State
  const [editingTenant, setEditingTenant] = useState<ActiveTenant | null>(null);
  const [tempModules, setTempModules] = useState<TenantModules>(defaultModules);
  const [tempStatus, setTempStatus] = useState<'aktif' | 'trial' | 'suspended'>('aktif');

  const [toast, setToast] = useState('');

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleOpenModuleModal = (tenant: ActiveTenant) => {
    setEditingTenant(tenant);
    setTempModules({ ...tenant.modules });
    setTempStatus(tenant.status);
  };

  const handleToggleModule = (key: keyof TenantModules) => {
    setTempModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveModules = () => {
    if (!editingTenant) return;

    setTenants(prev => prev.map(t => {
      if (t.id === editingTenant.id) {
        return {
          ...t,
          status: tempStatus,
          modules: { ...tempModules }
        };
      }
      return t;
    }));

    showNotification(`Modul Fitur & Status "${editingTenant.name}" Berhasil Diperbarui!`);
    setEditingTenant(null);
  };

  const handleQuickStatusToggle = (tenantId: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const nextStatus = t.status === 'aktif' ? 'suspended' : 'aktif';
        showNotification(`Status ${t.name} diubah menjadi ${nextStatus.toUpperCase()}`);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  const handleApproveRequest = (reqId: string) => {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    const newTenant: ActiveTenant = {
      id: `t_${Date.now()}`,
      name: req.name,
      subdomain: req.subdomainReq,
      location: req.location,
      ownerName: req.applicantName,
      ownerEmail: req.email,
      ownerPhone: req.phone,
      plan: req.requestedPlan,
      status: 'aktif',
      santriCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      modules: { ...defaultModules },
    };

    setTenants([newTenant, ...tenants]);
    setRequests(requests.filter(r => r.id !== reqId));
    showNotification(`Pengajuan ${req.name} BERHASIL DISETUJUI & TENANT DITAMBAHKAN!`);
  };

  const handleRejectRequest = (reqId: string) => {
    setRequests(requests.filter(r => r.id !== reqId));
    showNotification('Pengajuan trial telah ditolak.');
  };

  const handleCreateTenantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newSubdomain || !newOwnerEmail) return;

    const created: ActiveTenant = {
      id: `t_${Date.now()}`,
      name: newTenantName,
      subdomain: newSubdomain.toLowerCase().includes('.madev.id') ? newSubdomain : `${newSubdomain}.madev.id`,
      location: newLocation || 'Indonesia',
      ownerName: newOwnerName || 'Admin Pesantren',
      ownerEmail: newOwnerEmail,
      ownerPhone: newOwnerPhone || '-',
      plan: newPlan,
      status: 'aktif',
      santriCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      modules: { ...defaultModules },
    };

    setTenants([created, ...tenants]);
    setShowCreateModal(false);
    setNewTenantName('');
    setNewSubdomain('');
    setNewLocation('');
    setNewOwnerEmail('');
    setNewOwnerName('');
    setNewOwnerPhone('');
    showNotification(`Tenant Baru "${created.name}" Berhasil Diprovisi!`);
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.subdomain.toLowerCase().includes(search.toLowerCase()) ||
    t.location.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-700 text-white font-medium text-xs flex items-center justify-between shadow-xl animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast('')} className="text-white/80 hover:text-white">&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SaaS Tenant & Feature Toggle Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Manajemen Tenant & Toggler Modul Fitur
            </h1>
            <p className="text-stone-300 text-xs md:text-sm max-w-xl">
              Panel kontrol Developer untuk mengaktifkan/nonaktifkan status pesantren dan memilih modul fitur mana saja yang aktif untuk setiap tenant.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Tenant Pesantren Baru</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-3 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'tenants'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tenant Aktif ({tenants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative ${
            activeTab === 'requests'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pengajuan Trial & Pendaftaran ({requests.length})</span>
          {requests.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1 right-1" />
          )}
        </button>
      </div>

      {/* TAB 1: TENANT AKTIF & TOGGLER FITUR */}
      {activeTab === 'tenants' && (
        <PageCard
          title="Daftar Tenant Pesantren & Pengaktifan Modul"
          description="Atur status aktif/nonaktif dan toggle pengaktifan modul fitur spesifik per-pesantren"
        >
          {/* Search bar */}
          <div className="mb-4 relative max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama pesantren, subdomain, lokasi..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Pesantren & Subdomain</th>
                  <th className="py-3 px-4">Paket SaaS</th>
                  <th className="py-3 px-4">Modul Fitur Aktif</th>
                  <th className="py-3 px-4">Status Tenant</th>
                  <th className="py-3 px-4 text-right">Kelola Modul & Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200 font-medium">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                        <span>{t.name}</span>
                        <a href={`https://${t.subdomain}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-700">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="text-stone-400 text-[11px] font-mono">{t.subdomain} • {t.location}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {t.plan}
                      </span>
                    </td>
                    {/* Modul Badges */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {t.modules.paymentGateway && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">Payment</span>}
                        {t.modules.waGateway && <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded">WA</span>}
                        {t.modules.rfidGate && <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded">RFID</span>}
                        {t.modules.posKantin && <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded">POS Kantin</span>}
                        {t.modules.gdriveStorage && <span className="bg-teal-100 text-teal-800 text-[10px] font-semibold px-2 py-0.5 rounded">Drive</span>}
                        {t.modules.uksKesehatan && <span className="bg-rose-100 text-rose-800 text-[10px] font-semibold px-2 py-0.5 rounded">UKS</span>}
                      </div>
                    </td>
                    {/* Quick Status Toggle Badge */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleQuickStatusToggle(t.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all shadow-sm active:scale-95 ${
                          t.status === 'aktif'
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : t.status === 'trial'
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-rose-600 text-white hover:bg-rose-700'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{t.status}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenModuleModal(t)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 px-3.5 py-1.5 rounded-xl transition-all shadow-md active:scale-95"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Toggle Fitur Modul</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageCard>
      )}

      {/* TAB 2: PENGAJUAN TRIAL */}
      {activeTab === 'requests' && (
        <PageCard
          title="Permintaan Pendaftaran & Trial Pesantren Baru"
          description="Daftar calon pelanggan SaaS yang mengajukan pendaftaran atau permintaan uji coba platform Madev"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Nama Pesantren & Lokasi</th>
                  <th className="py-3 px-4">Pemohon & Jabatan</th>
                  <th className="py-3 px-4">Kontak (Email / WA)</th>
                  <th className="py-3 px-4">Subdomain Request</th>
                  <th className="py-3 px-4">Paket Yang Diminta</th>
                  <th className="py-3 px-4">Tgl Pengajuan</th>
                  <th className="py-3 px-4 text-right">Persetujuan Developer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200 font-medium">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      Belum ada permintaan pendaftaran trial baru.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900 dark:text-white">{r.name}</div>
                        <div className="text-stone-400 text-[11px]">{r.location}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-800 dark:text-stone-200">{r.applicantName}</div>
                        <div className="text-stone-400 text-[11px]">{r.applicantRole}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-stone-700 dark:text-stone-300">{r.email}</div>
                        <div className="text-stone-400 text-[11px] font-mono">{r.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {r.subdomainReq}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {r.requestedPlan}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">{r.requestDate}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApproveRequest(r.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve & Provisi</span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(r.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-[11px] transition-all"
                          >
                            Tolak
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </PageCard>
      )}

      {/* MODAL TOGGLER MODUL FITUR TENANT */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white">Toggler Modul Fitur Tenant</h3>
                  <p className="text-xs text-stone-500">{editingTenant.name} ({editingTenant.subdomain})</p>
                </div>
              </div>
              <button onClick={() => setEditingTenant(null)} className="text-stone-400 hover:text-stone-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status Tenant Radio / Toggle */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Status Akun Tenant (Akses Sistem)
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setTempStatus('aktif')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    tempStatus === 'aktif' ? 'bg-emerald-600 text-white shadow-md' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  🟢 AK TIF (Full Access)
                </button>
                <button
                  type="button"
                  onClick={() => setTempStatus('trial')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    tempStatus === 'trial' ? 'bg-amber-500 text-white shadow-md' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  🟡 TRIAL (14 Hari)
                </button>
                <button
                  type="button"
                  onClick={() => setTempStatus('suspended')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    tempStatus === 'suspended' ? 'bg-rose-600 text-white shadow-md' : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  🔴 SUSPENDED (Nonaktif)
                </button>
              </div>
            </div>

            {/* List of Feature Module Switches */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500">
                Daftar Pengaktifan Modul Fitur:
              </h4>

              {/* 1. Payment Gateway */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">Payment Gateway & Auto SPP (Flip)</div>
                    <div className="text-[11px] text-stone-500">Pembuatan tagihan & otomatisasi callback callback pembayaran SPP</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('paymentGateway')}
                  className={`p-1 rounded-full transition-all ${tempModules.paymentGateway ? 'text-emerald-600' : 'text-stone-300 dark:text-stone-600'}`}
                >
                  {tempModules.paymentGateway ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              {/* 2. WhatsApp Gateway */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">WhatsApp Notification Gateway</div>
                    <div className="text-[11px] text-stone-500">Pengiriman notifikasi presensi RFID & pengumuman ke WhatsApp Wali</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('waGateway')}
                  className={`p-1 rounded-full transition-all ${tempModules.waGateway ? 'text-emerald-600' : 'text-stone-300 dark:text-stone-600'}`}
                >
                  {tempModules.waGateway ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              {/* 3. RFID Gate */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">Absensi RFID & Gate Checkpoint</div>
                    <div className="text-[11px] text-stone-500">Scan KTA RFID untuk perizinan keluar/masuk gerbang pesantren</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('rfidGate')}
                  className={`p-1 rounded-full transition-all ${tempModules.rfidGate ? 'text-emerald-600' : 'text-stone-300 dark:text-stone-600'}`}
                >
                  {tempModules.rfidGate ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              {/* 4. POS Kantin */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">POS Kantin Cashless RFID</div>
                    <div className="text-[11px] text-stone-500">Manajemen dompet digital santri & kasir kantin pesantren</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('posKantin')}
                  className={`p-1 rounded-full transition-all ${tempModules.posKantin ? 'text-emerald-600' : 'text-stone-300 dark:text-stone-600'}`}
                >
                  {tempModules.posKantin ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              {/* 5. UKS Kesehatan */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">Manajemen UKS & Kesehatan</div>
                    <div className="text-[11px] text-stone-500">Pencatatan santri sakit, rekam medis, & rujukan rumah sakit</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('uksKesehatan')}
                  className={`p-1 rounded-full transition-all ${tempModules.uksKesehatan ? 'text-emerald-600' : 'text-stone-300 dark:text-stone-600'}`}
                >
                  {tempModules.uksKesehatan ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              {/* 6. Google Drive Storage */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600">
                    <HardDrive className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">Google Drive Cloud Storage</div>
                    <div className="text-[11px] text-stone-500">Penyimpanan cloud dokumen resmi & lampiran berkas pesantren</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('gdriveStorage')}
                  className={`p-1 rounded-full transition-all ${tempModules.gdriveStorage ? 'text-emerald-600' : 'text-stone-300 dark:text-stone-600'}`}
                >
                  {tempModules.gdriveStorage ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>

              {/* 7. Quest & Character */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/80 dark:border-stone-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 dark:text-white">Quest & Gamifikasi Karakter</div>
                    <div className="text-[11px] text-stone-500">Sistem poin apresiasi kebaikan & pemutihan pelanggaran santri</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleModule('questKarakter')}
                  className={`p-1 rounded-full transition-all ${tempModules.questKarakter ? 'text-emerald-600' : 'text-stone-300 dark:text-stone-600'}`}
                >
                  {tempModules.questKarakter ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setEditingTenant(null)}
                className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveModules}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan Modul</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Tenant Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">Provisi Tenant / Pesantren Baru</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600 text-lg font-bold">&times;</button>
            </div>

            <form onSubmit={handleCreateTenantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Nama Pesantren</label>
                <input
                  type="text"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="Contoh: Ponpes Al-Baqarah"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Subdomain Target (.madev.id)</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={newSubdomain}
                    onChange={(e) => setNewSubdomain(e.target.value)}
                    placeholder="albaqarah"
                    className="w-full px-3.5 py-2.5 rounded-l-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    required
                  />
                  <span className="bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 px-3 py-2.5 rounded-r-xl text-xs font-mono font-semibold">.madev.id</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Lokasi (Kota/Prov)</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Solo, Jawa Tengah"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Paket SaaS</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                  >
                    <option value="Starter SaaS">Starter SaaS</option>
                    <option value="Pro SaaS">Pro SaaS</option>
                    <option value="Enterprise SaaS">Enterprise SaaS</option>
                    <option value="Trial 14 Hari">Trial 14 Hari</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Nama Kyai / Owner Pesantren</label>
                <input
                  type="text"
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="Kyai H. Mustofa"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Email Admin Pesantren</label>
                  <input
                    type="email"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    placeholder="admin@albaqarah.or.id"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">No WhatsApp Owner</label>
                  <input
                    type="text"
                    value={newOwnerPhone}
                    onChange={(e) => setNewOwnerPhone(e.target.value)}
                    placeholder="082133445566"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-100 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  Provisi & Aktifkan Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
