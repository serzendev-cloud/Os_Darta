'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { ShoppingBag, CreditCard, Lock, AlertCircle, CheckCircle2, RefreshCw, UserCheck } from 'lucide-react';

export default function KantinNfcPage() {
  const [cardUid, setCardUid] = useState('RFID-1001');
  const [pin, setPin] = useState('1234');
  const [amount, setAmount] = useState('10000');
  const [items, setItems] = useState('Makan Siang + Es Teh');
  const [vendor, setVendor] = useState('Kantin Utama Pesantren');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setResult(null);

    try {
      const res = await fetch('/api/canteen/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardUid,
          pin,
          amount: Number(amount),
          itemsDescription: items,
          vendorName: vendor,
          posCashierId: 'POS-KANTIN-1',
          tenantId: 'default',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Transaksi ditolak oleh sistem');
      } else {
        setResult(data.data);
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server POS');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setErrorMsg('');
    setAmount('10000');
    setItems('Makan Siang + Es Teh');
  };

  return (
    <div className="space-y-6">
      <PageCard
        title="POS Kantin & Koperasi — Pembayaran RFID"
        description="Terminal Kasir Kantin Pesantren dengan Verifikasi Kode PIN, Pengecekan Freeze Wali Kelas, & Limit Belanja Harian Terpusat"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* POS Input Terminal */}
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/60 space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border/60">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Terminal Kasir POS</h3>
                <p className="text-xs text-muted-foreground">Tap kartu RFID & Verifikasi PIN Santri</p>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Vendor / Stand Kantin</label>
                <select
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-medium"
                >
                  <option value="Kantin Utama Pesantren">Kantin Utama Pesantren</option>
                  <option value="Kantin Asrama Al-Fatih">Kantin Asrama Al-Fatih</option>
                  <option value="Kantin Asrama Al-Farabi">Kantin Asrama Al-Farabi</option>
                  <option value="Koperasi Pesantren">Koperasi Pesantren</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Tap RFID Card UID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={cardUid}
                      onChange={(e) => setCardUid(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono"
                      placeholder="RFID-1001"
                      required
                    />
                    <CreditCard className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Kode PIN / Sandi Santri</label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono text-center tracking-widest"
                      placeholder="****"
                      required
                    />
                    <Lock className="w-4 h-4 text-muted-foreground absolute right-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Item / Catatan Belanja</label>
                <input
                  type="text"
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                  placeholder="Misal: Nasi Goreng + Teh Manis"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Nominal Belanja (Rp)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-emerald-500/40 text-emerald-600 font-bold text-lg"
                  placeholder="10000"
                  required
                />
              </div>

              {/* Demo Quick Presets */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-muted-foreground font-medium">Tes Quick RFID:</span>
                <button
                  type="button"
                  onClick={() => { setCardUid('RFID-1001'); setPin('1234'); }}
                  className="px-2 py-1 rounded-lg bg-muted text-[11px] hover:bg-muted/80 font-mono"
                >
                  RFID-1001 (Rizki)
                </button>
                <button
                  type="button"
                  onClick={() => { setCardUid('RFID-1002'); setPin('1234'); }}
                  className="px-2 py-1 rounded-lg bg-muted text-[11px] hover:bg-muted/80 font-mono"
                >
                  RFID-1002 (Firdaus - Limit Exceeded)
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Proses Pembayaran (Tap & Deduct Virtual Ledger)
                  </>
                )}
              </button>
            </form>
          </div>

          {/* POS Status & Receipt Display */}
          <div className="p-6 rounded-2xl bg-muted/20 border border-border/60 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Layar Struk & Status Transaksi</h3>

              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    Transaksi Ditolak Sistem!
                  </div>
                  <p className="text-xs leading-relaxed">{errorMsg}</p>
                </div>
              )}

              {result && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                      Pembayaran Berhasil
                    </div>
                    <span className="text-xs font-mono opacity-70">
                      {new Date(result.timestamp).toLocaleTimeString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-300 text-lg">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{result.santriName}</h4>
                      <p className="text-xs opacity-75">Kelas: {result.kelas}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-emerald-500/20 text-xs">
                    <div className="flex justify-between">
                      <span className="opacity-75">Nominal Belanja:</span>
                      <span className="font-bold">Rp {result.amountDeducted?.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Sisa Saldo Uang Saku:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Rp {result.remainingBalanceUangSaku?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Total Belanja Hari Ini:</span>
                      <span>Rp {result.totalSpentToday?.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Sisa Limit Harian Sentral:</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        Rp {result.remainingDailyLimit?.toLocaleString('id-ID')} / hari
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!errorMsg && !result && (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-2">
                  <ShoppingBag className="w-12 h-12 opacity-30" />
                  <p className="text-xs">Silakan tap kartu RFID dan masukkan PIN untuk memproses transaksi kasir kantin.</p>
                </div>
              )}
            </div>

            {(result || errorMsg) && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-6 w-full py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs transition-colors"
              >
                Transaksi Selanjutnya (Reset POS)
              </button>
            )}
          </div>
        </div>
      </PageCard>
    </div>
  );
}
