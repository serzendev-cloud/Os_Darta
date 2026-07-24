'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { 
  Building2, Plus, Search, CheckCircle2, XCircle, Clock, 
  Key, ShieldCheck, CreditCard, Sparkles, ExternalLink, Filter, 
  ArrowUpRight, Users, Check, AlertCircle, Edit3
} from 'lucide-react';

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

const mockActiveTenants: ActiveTenant[] = [
  { id: 't1', name: 'Ponpes Daruttahuid', subdomain: 'daruttahuid.madev.id', location: 'Malang, Jawa Timur', ownerName: 'Kyai Ahmad Fauzi', ownerEmail: 'admin@mahad.sch.id', ownerPhone: '081234567890', plan: 'Enterprise SaaS', status: 'aktif', santriCount: 340, createdAt: '2025-01-10' },
  { id: 't2', name: 'Ponpes Al-Hikmah', subdomain: 'alhikmah.madev.id', location: 'Surabaya, Jawa Timur', ownerName: 'Ustadz Mahmud', ownerEmail: 'admin@alhikmah.sch.id', ownerPhone: '081298765432', plan: 'Pro SaaS', status: 'aktif', santriCount: 180, createdAt: '2025-02-01' },
  { id: 't3', name: 'Ponpes An-Nisa', subdomain: 'annisa.madev.id', location: 'Jakarta Selatan, DKI', ownerName: 'Ustadzah Fatimah', ownerEmail: 'admin@annisa.sch.id', ownerPhone: '081311223344', plan: 'Pro SaaS', status: 'aktif', santriCount: 220, createdAt: '2025-02-15' },
  { id: 't4', name: 'Ponpes Ar-Raudah', subdomain: 'arraudah.madev.id', location: 'Bandung, Jawa Barat', ownerName: 'Ustadz Ridwan', ownerEmail: 'admin@arraudah.sch.id', ownerPhone: '081544556677', plan: 'Starter SaaS', status: 'aktif', santriCount: 95, createdAt: '2025-03-01' },
  { id: 't5', name: 'Ponpes Darul Quran', subdomain: 'dq.madev.id', location: 'Yogyakarta, DIY', ownerName: 'Ustadz Syarif', ownerEmail: 'admin@dq.sch.id', ownerPhone: '081788990011', plan: 'Trial 14 Hari', status: 'trial', santriCount: 45, createdAt: '2025-03-10' },
];

const mockTrialRequests: TrialRequest[] = [
  { id: 'tr1', name: 'Ponpes Al-Baqarah', subdomainReq: 'albaqarah.madev.id', location: 'Surakarta, Jawa Tengah', applicantName: 'Kyai H. Mustofa', applicantRole: 'Pimpinan Ponpes', email: 'kyai.mustofa@albaqarah.or.id', phone: '082133445566', requestedPlan: 'Pro SaaS (Trial 14 Hari)', requestDate: '2026-07-24', status: 'pending' },
  { id: 'tr2', name: 'Ponpes Nurul Huda', subdomainReq: 'nurulhuda.madev.id', location: 'Semarang, Jawa Tengah', applicantName: 'Ustadz Zulkifli', applicantRole: 'Kepala IT Pesantren', email: 'zulkifli@nurulhuda.sch.id', phone: '082255667788', requestedPlan: 'Enterprise SaaS', requestDate: '2026-07-23', status: 'pending' },
  { id: 'tr3', name: 'Ponpes Miftahul Ulum', subdomainReq: 'miftahululum.madev.id', location: 'Jember, Jawa Timur', applicantName: 'Ustadz Rahmat', applicantRole: 'Ketua Yayasan', email: 'rahmat@miftahululum.id', phone: '082399001122', requestedPlan: 'Starter SaaS', requestDate: '2026-07-22', status: 'pending' },
];

export default function SaasTenantsPage() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'requests'>('tenants');
  const [tenants, setTenants] = useState<ActiveTenant[]>(mockActiveTenants);
  const [requests, setRequests] = useState<TrialRequest[]>(mockTrialRequests);
  const [search, setSearch] = useState('');
  
  // New Tenant Modal State
  const [showModal, setShowModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPhone, setNewOwnerPhone] = useState('');
  const [newPlan, setNewPlan] = useState('Pro SaaS');

  const [toast, setToast] = useState('');

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleApproveRequest = (reqId: string) => {
    const req = requests.find(r => r.id === reqId);
    if (!req) return;

    // Move to active tenants
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
    };

    setTenants([created, ...tenants]);
    setShowModal(false);
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
              <span>SaaS Tenant Provisioning Engine</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Manajemen Tenant & Pendaftaran SaaS Madev
            </h1>
            <p className="text-stone-300 text-xs md:text-sm max-w-xl">
              Pusat kontrol Developer / SaaS Owner untuk pembuatan tenant baru, persetujuan pendaftaran trial pesantren, pengaturan paket langganan, dan manajemen subdomain.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
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

      {/* TAB 1: TENANT AKTIF */}
      {activeTab === 'tenants' && (
        <PageCard
          title="Daftar Tenant Pesantren Terdaftar"
          description="Monitoring real-time pesantren yang berlangganan dan aktif menggunakan platform Madev"
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
                  <th className="py-3 px-4">Kontak Pemilik / Kyai</th>
                  <th className="py-3 px-4">Paket SaaS</th>
                  <th className="py-3 px-4">Total Santri</th>
                  <th className="py-3 px-4">Tgl Terdaftar</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Developer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200 font-medium">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                        <span>{t.name}</span>
                        <a href={`https://${t.subdomain}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-700">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                      <div className="text-stone-400 text-[11px] font-mono">{t.subdomain} • {t.location}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-800 dark:text-stone-200">{t.ownerName}</div>
                      <div className="text-stone-400 text-[11px]">{t.ownerEmail} • {t.ownerPhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {t.plan}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-700 dark:text-stone-300">{t.santriCount} Santri</td>
                    <td className="py-3.5 px-4 text-stone-500 font-mono text-[11px]">{t.createdAt}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${t.status === 'aktif' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-amber-100 text-amber-800'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href="/dashboard/pengaturan/tenant-integrasi"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800"
                      >
                        <Key className="w-3 h-3" />
                        <span>Integrasi API</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageCard>
      )}

      {/* TAB 2: PENGAJUAN TRIAL & PENDAFTARAN BARU */}
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

      {/* Modal Buat Tenant Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-stone-200 dark:border-stone-800 space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 dark:text-white">Provisi Tenant / Pesantren Baru</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600 text-lg font-bold">&times;</button>
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
                  onClick={() => setShowModal(false)}
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
