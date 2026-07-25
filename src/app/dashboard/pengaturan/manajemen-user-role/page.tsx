'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  Users, UserCheck, ShieldCheck, UserPlus, Search, Filter, 
  ChevronDown, CheckCircle2, ArrowUpRight, GraduationCap, 
  School, Store, Shield, RefreshCw, Lock, Sparkles, Key, AlertCircle
} from 'lucide-react';

interface UserAccount {
  id: string;
  name: string;
  email: string;
  identityNo: string; // NIP / NISN / NIK
  primaryRole: 'admin' | 'guru' | 'staff' | 'santri' | 'wali';
  subRoleTitle: string; // e.g. "Staf Kantin Cashless", "Ustadz Madin", "Santri Class 12 (Pengurus Asrama)"
  status: 'active' | 'inactive';
  lastLogin: string;
  avatarBg: string;
}

const initialUsersList: UserAccount[] = [
  {
    id: 'u1',
    name: 'K.H. Abdullah Sholeh',
    email: 'pengasuh@daruttahuid.madev.id',
    identityNo: 'NIP. 19780101001',
    primaryRole: 'admin',
    subRoleTitle: 'Pengasuh Utama & Admin Tenant',
    status: 'active',
    lastLogin: '25 Jul 2026, 08:10 WIB',
    avatarBg: 'bg-emerald-600',
  },
  {
    id: 'u2',
    name: 'Ustadz Ahmad Zaki, M.Pd.',
    email: 'zaki@daruttahuid.madev.id',
    identityNo: 'NIP. 19850312004',
    primaryRole: 'guru',
    subRoleTitle: 'Guru Formal & Kepala Madin',
    status: 'active',
    lastLogin: '25 Jul 2026, 07:45 WIB',
    avatarBg: 'bg-blue-600',
  },
  {
    id: 'u3',
    name: 'Ustadzah Nurul Hidayah',
    email: 'nurul@daruttahuid.madev.id',
    identityNo: 'NIP. 19900520011',
    primaryRole: 'guru',
    subRoleTitle: 'Guru Tahfidz & Pengajar Bahasa Arab',
    status: 'active',
    lastLogin: '24 Jul 2026, 19:30 WIB',
    avatarBg: 'bg-blue-600',
  },
  {
    id: 'u4',
    name: 'Budi Santoso',
    email: 'budi.kantin@daruttahuid.madev.id',
    identityNo: 'NIK. 350712890001',
    primaryRole: 'staff',
    subRoleTitle: 'Staf Kantin Utama & Wallet POS RFID',
    status: 'active',
    lastLogin: '25 Jul 2026, 08:05 WIB',
    avatarBg: 'bg-purple-600',
  },
  {
    id: 'u5',
    name: 'Suhardi (Security Gate)',
    email: 'gate.security@daruttahuid.madev.id',
    identityNo: 'NIK. 350712750009',
    primaryRole: 'staff',
    subRoleTitle: 'Staf Keamanan Checkpoint RFID Gate',
    status: 'active',
    lastLogin: '25 Jul 2026, 06:00 WIB',
    avatarBg: 'bg-purple-600',
  },
  {
    id: 'u6',
    name: 'Fauzi Rahmat (Santri Senior Class 12)',
    email: 'fauzi.santri@daruttahuid.madev.id',
    identityNo: 'NISN. 0065432101',
    primaryRole: 'staff', // Promoted Santri to Staff!
    subRoleTitle: 'Santri Pengurus & Staf Piket Asrama (Diangkat)',
    status: 'active',
    lastLogin: '25 Jul 2026, 07:12 WIB',
    avatarBg: 'bg-amber-600',
  },
  {
    id: 'u7',
    name: 'Muhammad Rizky (Santri Class 10)',
    email: 'rizky.santri@daruttahuid.madev.id',
    identityNo: 'NISN. 0081234567',
    primaryRole: 'santri',
    subRoleTitle: 'Santri Reguler Asrama Al-Ghazali',
    status: 'active',
    lastLogin: '24 Jul 2026, 20:15 WIB',
    avatarBg: 'bg-stone-600',
  },
  {
    id: 'u8',
    name: 'H. Bambang Kurniawan (Wali Santri)',
    email: 'bambang.wali@gmail.com',
    identityNo: 'NIK. 350712550003',
    primaryRole: 'wali',
    subRoleTitle: 'Wali Santri (Muhammad Rizky)',
    status: 'active',
    lastLogin: '23 Jul 2026, 14:20 WIB',
    avatarBg: 'bg-teal-600',
  },
];

export default function TenantUserRoleManagementPage() {
  const [users, setUsers] = useState<UserAccount[]>(initialUsersList);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  // Modal State for Promoting / Editing Role
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [targetPrimaryRole, setTargetPrimaryRole] = useState<'admin' | 'guru' | 'staff' | 'santri' | 'wali'>('staff');
  const [targetSubRoleTitle, setTargetSubRoleTitle] = useState('');
  const [promotionReason, setPromotionReason] = useState('');

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleOpenPromoteModal = (user: UserAccount) => {
    setEditingUser(user);
    setTargetPrimaryRole(user.primaryRole);
    setTargetSubRoleTitle(user.subRoleTitle);
    setPromotionReason('');
  };

  const handleSavePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setUsers(prev => prev.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          primaryRole: targetPrimaryRole,
          subRoleTitle: targetSubRoleTitle || u.subRoleTitle,
        };
      }
      return u;
    }));

    showNotification(`Role akun ${editingUser.name} BERHASIL DIUBAH menjadi [${targetPrimaryRole.toUpperCase()}: ${targetSubRoleTitle}]!`);
    setEditingUser(null);
  };

  const filteredUsers = users.filter(u => {
    const matchesRole = selectedRoleFilter === 'all' || u.primaryRole === selectedRoleFilter;
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.identityNo.toLowerCase().includes(search.toLowerCase()) ||
                          u.subRoleTitle.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  // Calculate Role Statistics
  const adminCount = users.filter(u => u.primaryRole === 'admin').length;
  const guruCount = users.filter(u => u.primaryRole === 'guru').length;
  const staffCount = users.filter(u => u.primaryRole === 'staff').length;
  const santriCount = users.filter(u => u.primaryRole === 'santri').length;
  const waliCount = users.filter(u => u.primaryRole === 'wali').length;

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
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Multi-Role Management & Access Control</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Manajemen User & Distribusi Role Hak Akses Tenant
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-3xl leading-relaxed">
            Kelola daftar akun pengguna berdasarkan role (<strong className="text-white">Admin, Guru, Staf, Santri, Wali</strong>). Anda dapat mempromosikan user lain atau santri menjadi role <strong className="text-white">Staf Operasional</strong> (Kantin, Security Gate, Musyrif Asrama).
          </p>
        </div>
      </div>

      {/* Role Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div 
          onClick={() => setSelectedRoleFilter('guru')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedRoleFilter === 'guru' ? 'bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-200 ring-2 ring-blue-500/30' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 mb-1">
            <GraduationCap className="w-5 h-5" />
            <span className="text-xs font-bold uppercase">Guru</span>
          </div>
          <div className="text-xl font-extrabold text-stone-900 dark:text-white">{guruCount} User</div>
          <p className="text-[10px] text-stone-400">Pengajar & Wali Kelas</p>
        </div>

        <div 
          onClick={() => setSelectedRoleFilter('staff')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedRoleFilter === 'staff' ? 'bg-purple-500/10 border-purple-500 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/30' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <Store className="w-5 h-5" />
            <span className="text-xs font-bold uppercase">Staf</span>
          </div>
          <div className="text-xl font-extrabold text-stone-900 dark:text-white">{staffCount} User</div>
          <p className="text-[10px] text-stone-400">Kantin, Gate, Asrama</p>
        </div>

        <div 
          onClick={() => setSelectedRoleFilter('admin')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedRoleFilter === 'admin' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase">Admin</span>
          </div>
          <div className="text-xl font-extrabold text-stone-900 dark:text-white">{adminCount} User</div>
          <p className="text-[10px] text-stone-400">Pengasuh & Super Admin</p>
        </div>

        <div 
          onClick={() => setSelectedRoleFilter('santri')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedRoleFilter === 'santri' ? 'bg-amber-500/10 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <Users className="w-5 h-5" />
            <span className="text-xs font-bold uppercase">Santri</span>
          </div>
          <div className="text-xl font-extrabold text-stone-900 dark:text-white">{santriCount} User</div>
          <p className="text-[10px] text-stone-400">Termasuk Santri Pengurus</p>
        </div>

        <div 
          onClick={() => setSelectedRoleFilter('wali')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedRoleFilter === 'wali' ? 'bg-teal-500/10 border-teal-500 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/30' : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between text-teal-600 mb-1">
            <UserCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase">Wali</span>
          </div>
          <div className="text-xl font-extrabold text-stone-900 dark:text-white">{waliCount} User</div>
          <p className="text-[10px] text-stone-400">Orang Tua Santri</p>
        </div>
      </div>

      {/* Main Table Section */}
      <PageCard
        title="Daftar Pengguna & Hak Akses Role Pesantren"
        description="Filter berdasarkan role di atas atau cari nama user. Klik 'Promosikan / Ubah Role' untuk mengangkat user/santri menjadi staf operasional"
      >
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200 dark:border-stone-800">
          {/* Tab Role Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setSelectedRoleFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedRoleFilter === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              Semua User ({users.length})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('guru')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedRoleFilter === 'guru' ? 'bg-blue-600 text-white shadow-md' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              🎓 Role Guru ({guruCount})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('staff')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedRoleFilter === 'staff' ? 'bg-purple-600 text-white shadow-md' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              🏢 Role Staf ({staffCount})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedRoleFilter === 'admin' ? 'bg-emerald-600 text-white shadow-md' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              👑 Role Admin ({adminCount})
            </button>
            <button
              onClick={() => setSelectedRoleFilter('santri')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedRoleFilter === 'santri' ? 'bg-amber-600 text-white shadow-md' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
              }`}
            >
              👦 Santri ({santriCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIP, NISN, email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {/* User Accounts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama & Email User</th>
                <th className="py-3.5 px-3">Role Utama</th>
                <th className="py-3.5 px-3">Jabatan & Sub-Role Khusus</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Login Terakhir</th>
                <th className="py-3.5 px-4 text-right">Aksi Manajemen Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200 font-medium">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${u.avatarBg} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                          <span>{u.name}</span>
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono">{u.email} • {u.identityNo}</div>
                      </div>
                    </div>
                  </td>

                  {/* Primary Role Badge */}
                  <td className="py-4 px-3">
                    {u.primaryRole === 'admin' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                        👑 ADMIN TENANT
                      </span>
                    )}
                    {u.primaryRole === 'guru' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300">
                        🎓 GURU / USTADZ
                      </span>
                    )}
                    {u.primaryRole === 'staff' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300">
                        🏢 STAF OPERASIONAL
                      </span>
                    )}
                    {u.primaryRole === 'santri' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                        👦 SANTRI
                      </span>
                    )}
                    {u.primaryRole === 'wali' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border border-teal-300">
                        👨‍👩‍👧 WALI SANTRI
                      </span>
                    )}
                  </td>

                  {/* Sub Role Title */}
                  <td className="py-4 px-3">
                    <span className="font-bold text-stone-800 dark:text-stone-200">
                      {u.subRoleTitle}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Aktif</span>
                    </span>
                  </td>

                  {/* Last Login */}
                  <td className="py-4 px-3 text-stone-400 font-mono text-[11px]">
                    {u.lastLogin}
                  </td>

                  {/* Action Button: Promote Role */}
                  <td className="py-4 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenPromoteModal(u)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-all active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Promosikan / Ubah Role</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>

      {/* PROMOTION / ROLE ASSIGNMENT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-emerald-600">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                  Angkat / Ubah Role Access User
                </h3>
              </div>
              <button 
                onClick={() => setEditingUser(null)} 
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePromotion} className="space-y-4">
              {/* User Info Box */}
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                <div className="text-[10px] uppercase font-bold text-stone-400">User Terpilih:</div>
                <div className="font-extrabold text-stone-900 dark:text-white text-sm">{editingUser.name}</div>
                <div className="text-xs text-stone-500 font-mono">{editingUser.email} • {editingUser.identityNo}</div>
                <div className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                  Role Saat Ini: {editingUser.primaryRole.toUpperCase()} ({editingUser.subRoleTitle})
                </div>
              </div>

              {/* Primary Role Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Pilih Role Utama Baru (Role Access Level):
                </label>
                <select
                  value={targetPrimaryRole}
                  onChange={(e) => setTargetPrimaryRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="staff">🏢 STAF OPERASIONAL (Kantin, Security Gate, Musyrif Asrama)</option>
                  <option value="guru">🎓 GURU / USTADZ (Pengajar & Wali Kelas)</option>
                  <option value="admin">👑 ADMIN TENANT / PENGASUH (Akses Penuh Management)</option>
                  <option value="santri">👦 SANTRI (Akses Santri Reguler)</option>
                  <option value="wali">👨‍👩‍👧 WALI SANTRI (Akses Orang Tua)</option>
                </select>
              </div>

              {/* Sub-Role / Jabatan Title */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Jabatan / Spesifikasi Role Khusus:
                </label>
                <input
                  type="text"
                  value={targetSubRoleTitle}
                  onChange={(e) => setTargetSubRoleTitle(e.target.value)}
                  placeholder="misal: Staf Kasir Kantin Cashless, Musyrif Asrama, Staf Security Gate..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
                  Alasan / Surat Keputusan Pengangkatan:
                </label>
                <textarea
                  rows={2}
                  value={promotionReason}
                  onChange={(e) => setPromotionReason(e.target.value)}
                  placeholder="misal: Diangkat oleh Pengasuh menjadi Staf Kasir Kantin Shift Siang"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                >
                  🚀 Simpan & Promosikan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
