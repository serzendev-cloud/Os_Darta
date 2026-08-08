'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  CreditCard, DollarSign, Building2, CheckCircle2, AlertCircle, 
  Clock, FileText, Check, ShieldCheck, ArrowUpRight, Plus, Sparkles
} from 'lucide-react';

interface BillingInvoice {
  id: string;
  invoiceNo: string;
  tenantName: string;
  planName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  paymentMethod: string;
}

const mockInvoicesList: BillingInvoice[] = [];

export default function SaasBillingPage() {
  const [invoices, setInvoices] = useState<BillingInvoice[]>(mockInvoicesList);
  const [toast, setToast] = useState('');

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleMarkAsPaid = (invId: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invId) {
        return {
          ...inv,
          status: 'Paid',
          paidDate: new Date().toISOString().split('T')[0],
        };
      }
      return inv;
    }));
    showNotification('Tagihan berhasil ditandai LUNAS!');
  };

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
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pillar 4 — Subscription Tiering & Billing Invoices</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Paket Langganan & Riwayat Billing SaaS
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-2xl">
            Pusat monetisasi platform Madev. Mengatur batas kuota santri per-paket, faktur tagihan otomatis bulanan, dan log konfirmasi payment gateway.
          </p>
        </div>
      </div>

      {/* Tiering Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Starter Plan */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 uppercase">
              Starter Plan
            </span>
            <h3 className="text-xl font-extrabold text-stone-900 dark:text-white pt-1">Rp 1.000.000 <span className="text-xs font-normal text-stone-500">/bulan</span></h3>
            <p className="text-xs text-stone-500">Untuk pesantren berkembang dengan skala santri terbatas.</p>
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2 text-xs text-stone-700 dark:text-stone-300 font-medium">
              <div className="flex items-center gap-2">✓ Max 100 Santri</div>
              <div className="flex items-center gap-2">✓ Modul Kesantrian & Asrama</div>
              <div className="flex items-center gap-2">✓ Modul Akademik Formal</div>
            </div>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="p-6 rounded-3xl bg-emerald-950 text-white border border-emerald-500/40 shadow-xl flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-[10px] font-extrabold bg-emerald-500 text-stone-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            PALING POPULER
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 uppercase">
              Pro Plan
            </span>
            <h3 className="text-xl font-extrabold text-white pt-1">Rp 2.000.000 <span className="text-xs font-normal text-emerald-200/80">/bulan</span></h3>
            <p className="text-xs text-emerald-100/80">Solusi lengkap manajemen pesantren menengah.</p>
            <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-emerald-100 font-medium">
              <div className="flex items-center gap-2">✓ Max 500 Santri</div>
              <div className="flex items-center gap-2">✓ Semua Modul Starter</div>
              <div className="flex items-center gap-2">✓ Payment Gateway Auto SPP (Flip)</div>
              <div className="flex items-center gap-2">✓ WA Gateway Notification</div>
            </div>
          </div>
        </div>

        {/* Enterprise Plan */}
        <div className="p-6 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 uppercase">
              Enterprise Plan
            </span>
            <h3 className="text-xl font-extrabold text-stone-900 dark:text-white pt-1">Rp 3.500.000 <span className="text-xs font-normal text-stone-500">/bulan</span></h3>
            <p className="text-xs text-stone-500">Kapasitas unlimited & dukungan dedicated support.</p>
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 space-y-2 text-xs text-stone-700 dark:text-stone-300 font-medium">
              <div className="flex items-center gap-2">✓ Unlimited Santri</div>
              <div className="flex items-center gap-2">✓ Modul POS Kantin RFID</div>
              <div className="flex items-center gap-2">✓ Absensi RFID & Gate Checkpoint</div>
              <div className="flex items-center gap-2">✓ Dedicated Server Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <PageCard
        title="Riwayat Faktur Tagihan SaaS (Automated Invoices)"
        description="Daftar tagihan otomatis bulanan ke seluruh pesantren berlangganan"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Invoice</th>
                <th className="py-3 px-4">Pesantren & Paket</th>
                <th className="py-3 px-4">Jumlah Tagihan</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200 font-medium">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-stone-900 dark:text-white">
                    {inv.invoiceNo}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-stone-900 dark:text-white">{inv.tenantName}</div>
                    <div className="text-stone-400 text-[11px]">{inv.planName}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    Rp {inv.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-stone-500">{inv.dueDate}</td>
                  <td className="py-3.5 px-4 text-stone-600 dark:text-stone-400">{inv.paymentMethod}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      inv.status === 'Unpaid' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {inv.status !== 'Paid' && (
                      <button
                        onClick={() => handleMarkAsPaid(inv.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] transition-all shadow-sm active:scale-95"
                      >
                        Konfirmasi Lunas
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  );
}
