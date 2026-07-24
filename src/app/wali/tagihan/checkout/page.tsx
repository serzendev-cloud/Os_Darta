'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { CreditCard, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function WaliBundledCheckoutPage() {
  const [includeSpp, setIncludeSpp] = useState(true);
  const [sppAmount] = useState(1000000);
  const [uangSakuAmount, setUangSakuAmount] = useState('300000');
  const [tabunganAmount, setTabunganAmount] = useState('200000');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');

  const total =
    (includeSpp ? sppAmount : 0) +
    (Number(uangSakuAmount) || 0) +
    (Number(tabunganAmount) || 0);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call creating single Flip Bill Invoice
    setTimeout(() => {
      setPaymentUrl('https://bigflip.id/pwf/demo-bill-1500000');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <PageCard
        title="Bundled Checkout Payment — Sekali Transfer (SPP & Top-Up)"
        description="Bayar SPP bulanan sekaligus isi Uang Saku & Kantong Tabungan santri dalam 1 kali transaksi via Flip for Business"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Checkout Form */}
          <form onSubmit={handleCheckout} className="p-6 rounded-2xl bg-muted/30 border border-border/60 space-y-5">
            <h3 className="font-semibold text-foreground pb-2 border-b border-border/60 flex items-center justify-between">
              <span>Pilih Rincian Tagihan & Top-Up</span>
              <span className="text-xs text-emerald-600 font-mono flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Single Payment Invoice
              </span>
            </h3>

            {/* Checkbox SPP */}
            <div className="p-4 rounded-xl bg-background border border-border space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSpp}
                  onChange={(e) => setIncludeSpp(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">SPP Bulan Juli 2026</span>
                    <span className="font-bold text-sm text-foreground">Rp {sppAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Tagihan rutin bulanan pesantren (Muhammad Rizki)</p>
                </div>
              </label>
            </div>

            {/* Top Up Uang Saku */}
            <div className="p-4 rounded-xl bg-background border border-border space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">Top-Up Kantong Uang Saku</label>
                <span className="text-xs text-muted-foreground">Untuk Jajan Santri di Kantin</span>
              </div>
              <input
                type="number"
                value={uangSakuAmount}
                onChange={(e) => setUangSakuAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border text-sm font-bold text-emerald-600"
                placeholder="300000"
              />
            </div>

            {/* Top Up Tabungan */}
            <div className="p-4 rounded-xl bg-background border border-border space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-foreground">Top-Up Kantong Tabungan</label>
                <span className="text-xs text-muted-foreground">Simpanan Cadangan Jangka Panjang</span>
              </div>
              <input
                type="number"
                value={tabunganAmount}
                onChange={(e) => setTabunganAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border text-sm font-bold text-blue-600"
                placeholder="200000"
              />
            </div>

            {/* Total Display */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between items-center">
              <div>
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Total Sekali Transfer</span>
                <p className="text-xs text-muted-foreground">Hemat biaya admin payment gateway</p>
              </div>
              <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                Rp {total.toLocaleString('id-ID')}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || total <= 0}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? 'Mengenerate Invoice Flip...' : 'Buat Kode Bayar Single Transfer (Flip API)'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Payment Link Output */}
          <div className="p-6 rounded-2xl bg-muted/20 border border-border/60 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Instruksi Pembayaran Flip for Business</h3>

              {paymentUrl ? (
                <div className="p-5 rounded-2xl bg-background border border-emerald-500/40 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5" /> Invois Single Payment Berhasil Dibuat
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Tagihan:</span>
                      <span className="font-bold text-sm">Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Metode Bayar:</span>
                      <span>Virtual Account / QRIS via Flip</span>
                    </div>
                  </div>

                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors text-center"
                  >
                    <CreditCard className="w-4 h-4" /> Buka Halaman Bayar Flip
                  </a>

                  <p className="text-[11px] text-muted-foreground text-center">
                    Setelah Anda melakukan pembayaran, Webhook Flip akan otomatis memproses pelunasan SPP dan mengalokasikan saldo uang saku & tabungan santri secara instan.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-2">
                  <ShieldCheck className="w-12 h-12 opacity-30 text-emerald-600" />
                  <p className="text-xs">
                    Pilih nominal SPP, Uang Saku, dan Tabungan lalu klik buat kode bayar untuk mendapatkan 1 link transfer Flip for Business.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
