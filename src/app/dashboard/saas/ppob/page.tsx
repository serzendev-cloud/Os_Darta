'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import {
  Wallet,
  TrendingUp,
  Settings,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building2,
  Zap,
} from 'lucide-react';

const MOCK_PPOB_LOGS = [
  {
    id: 'PPOB-109283-991',
    tenantName: 'Pesantren Al-Fatih Malang',
    waliName: 'Ahmad Fulan',
    service: 'Token PLN 50.000',
    customerNo: '14029981240',
    amountBase: 50000,
    feeSaas: 1500,
    totalAmount: 51500,
    paymentMethod: 'QRIS_SAAS',
    status: 'SUCCESS',
    sn: '3412-8901-2245-6712-9901',
    date: '2026-07-28 09:12:00',
  },
  {
    id: 'PPOB-109283-992',
    tenantName: 'Pesantren An-Nisa Surabaya',
    waliName: 'Siti Aminah',
    service: 'Telkomsel 25.000',
    customerNo: '081234567890',
    amountBase: 25000,
    feeSaas: 1500,
    totalAmount: 26500,
    paymentMethod: 'SALDO_PPOB',
    status: 'SUCCESS',
    sn: 'SN-20260728-9812401',
    date: '2026-07-28 08:50:11',
  },
  {
    id: 'PPOB-109283-993',
    tenantName: 'Pesantren Daruttauhid Bandung',
    waliName: 'Budi Santoso',
    service: 'Token PLN 100.000',
    customerNo: '53110298124',
    amountBase: 100000,
    feeSaas: 1500,
    totalAmount: 101500,
    paymentMethod: 'QRIS_SAAS',
    status: 'FAILED_REFUNDED',
    sn: '-',
    date: '2026-07-28 07:15:40',
  },
];

export default function SaasOwnerPpobDashboard() {
  const [digiflazzBalance, setDigiflazzBalance] = useState(4850000); // Deposit Rp 4.850.000
  const [adminFeeConfig, setAdminFeeConfig] = useState(1500); // Margin Rp 1.500
  const [savingFee, setSavingFee] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const totalTransactions = MOCK_PPOB_LOGS.length;
  const totalProfitSaas = MOCK_PPOB_LOGS.filter((l) => l.status === 'SUCCESS').reduce(
    (acc, item) => acc + item.feeSaas,
    0
  );

  const handleSaveFee = () => {
    setSavingFee(true);
    setTimeout(() => {
      setSavingFee(false);
      alert('Margin Admin Fee SaaS Owner berhasil diperbarui secara global!');
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeader
        title="Panel Pengawas PPOB & Monetisasi SaaS Owner"
        description="Pusat kelola deposit Digiflazz, pengaturan margin keuntungan (Admin Fee SaaS), dan audit log transaksi token & pulsa seluruh tenant pesantren."
      />

      {/* Top Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Deposit Digiflazz */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
            <span>Deposit Digiflazz SaaS</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            Rp {digiflazzBalance.toLocaleString('id-ID')}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold pt-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Digiflazz Production Active
          </div>
        </div>

        {/* Keuntungan SaaS Owner */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
            <span>Keuntungan Profit SaaS</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
            Rp {totalProfitSaas.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">* Profit murni masuk ke rekening SaaS Owner</p>
        </div>

        {/* Total Transaksi PPOB */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
            <span>Total Transaksi PPOB</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">{totalTransactions} Transaksi</div>
          <p className="text-[11px] text-muted-foreground pt-1">Di seluruh portal Wali Santri</p>
        </div>

        {/* Margin Setting */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
            <span>Setting Admin Fee SaaS</span>
            <Settings className="w-4 h-4 text-stone-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground">Rp</span>
            <input
              type="number"
              value={adminFeeConfig}
              onChange={(e) => setAdminFeeConfig(Number(e.target.value))}
              className="w-full px-2.5 py-1 rounded-lg bg-muted border border-border text-sm font-bold text-foreground"
            />
            <button
              onClick={handleSaveFee}
              disabled={savingFee}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
            >
              {savingFee ? '...' : 'Simpan'}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground pt-1">Markup otomatis per transaksi PPOB</p>
        </div>
      </div>

      {/* Audit Log Transaksi PPOB Cross-Tenant */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground text-base">Audit Transaksi PPOB Seluruh Pesantren</h3>
            <p className="text-xs text-muted-foreground">
              Rekam log real-time transaksi token PLN dan pulsa dari seluruh portal Wali Santri
            </p>
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari pesantren / wali..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/40 border border-border text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                <th className="py-3 px-3">ID Transaksi</th>
                <th className="py-3 px-3">Pesantren / Tenant</th>
                <th className="py-3 px-3">Wali Santri</th>
                <th className="py-3 px-3">Layanan & ID Pelanggan</th>
                <th className="py-3 px-3">Modal Digiflazz</th>
                <th className="py-3 px-3">Profit SaaS</th>
                <th className="py-3 px-3">Total Dibayar</th>
                <th className="py-3 px-3">Metode Bayar</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-medium">
              {MOCK_PPOB_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-foreground">{log.id}</td>
                  <td className="py-3 px-3 flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                    {log.tenantName}
                  </td>
                  <td className="py-3 px-3">{log.waliName}</td>
                  <td className="py-3 px-3">
                    <span className="font-semibold block text-foreground">{log.service}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{log.customerNo}</span>
                  </td>
                  <td className="py-3 px-3 font-mono">Rp {log.amountBase.toLocaleString('id-ID')}</td>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                    +Rp {log.feeSaas.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-foreground">
                    Rp {log.totalAmount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.paymentMethod === 'SALDO_PPOB'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {log.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {log.status === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> SUCCESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded text-[10px] font-bold">
                        <RefreshCw className="w-3 h-3" /> AUTO-REFUNDED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
