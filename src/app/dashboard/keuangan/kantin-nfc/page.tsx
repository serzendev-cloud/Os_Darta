'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { ShoppingBag, CreditCard, Lock, AlertCircle, CheckCircle2, RefreshCw, UserCheck, Plus, Trash2, Tag, Store } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

const canteenCatalogs: Record<string, { name: string; items: { id: string; name: string; price: number }[] }> = {
  'cnt-1': {
    name: 'Kantin Utama Pesantren',
    items: [
      { id: 'itm-1', name: 'Nasi Goreng Spesial', price: 12000 },
      { id: 'itm-2', name: 'Es Teh Manis', price: 3000 },
      { id: 'itm-3', name: 'Ayam Geprek Nasi', price: 15000 },
      { id: 'itm-4', name: 'Jus Alpukat', price: 8000 },
    ],
  },
  'cnt-2': {
    name: 'Kantin Asrama Putra',
    items: [
      { id: 'itm-5', name: 'Nasi Rames Asrama', price: 10000 },
      { id: 'itm-6', name: 'Kopi Susu Warmindo', price: 4000 },
      { id: 'itm-7', name: 'Indomie Telur Kornet', price: 9000 },
    ],
  },
  'cnt-3': {
    name: 'Kantin Asrama Putri',
    items: [
      { id: 'itm-8', name: 'Seblak Pedas Asrama', price: 10000 },
      { id: 'itm-9', name: 'Boba Milk Tea', price: 8000 },
      { id: 'itm-10', name: 'Nasi Soto Ayam', price: 12000 },
    ],
  },
  'cnt-4': {
    name: 'Koperasi Pesantren',
    items: [
      { id: 'itm-11', name: 'Buku Tulis 50 Lembar', price: 5000 },
      { id: 'itm-12', name: 'Pulpen Gel Hitam', price: 3500 },
      { id: 'itm-13', name: 'Kitab Jurumiyah', price: 15000 },
    ],
  },
};

export default function KantinNfcPage() {
  const [selectedCanteenId, setSelectedCanteenId] = useState<string>('cnt-1');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customAmount, setCustomAmount] = useState<string>('');
  
  const [cardUid, setCardUid] = useState('RFID-1001');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const currentCatalog = canteenCatalogs[selectedCanteenId] || canteenCatalogs['cnt-1'];

  const addToCart = (item: { id: string; name: string; price: number }) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const finalAmount = cart.length > 0 ? cartTotal : Number(customAmount) || 0;
  const itemsSummary = cart.length > 0 ? cart.map((i) => `${i.name} (x${i.qty})`).join(', ') : 'Pembelian Kantin';

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0) {
      setErrorMsg('Pilih barang dari katalog atau masukkan nominal belanja');
      return;
    }

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
          amount: finalAmount,
          canteenId: selectedCanteenId,
          vendorName: currentCatalog.name,
          itemsDescription: itemsSummary,
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
    setCart([]);
    setCustomAmount('');
  };

  return (
    <div className="space-y-6">
      <PageCard
        title="POS Kantin & Koperasi — Pembayaran RFID & Katalog Harga Per-Kantin"
        description="Terminal Kasir Kantin dengan Pemilihan Katalog Harga Spesifik Kantin, Verifikasi Kode PIN, Freeze Wali Kelas, & Limit Belanja Harian Terpusat"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canteen Selector & Catalog */}
          <div className="p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Pilih Unit Kantin Active</label>
              <select
                value={selectedCanteenId}
                onChange={(e) => {
                  setSelectedCanteenId(e.target.value);
                  setCart([]);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-semibold text-foreground"
              >
                {Object.entries(canteenCatalogs).map(([id, c]) => (
                  <option key={id} value={id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-border/60">
              <h4 className="font-semibold text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" /> Katalog Barang & Harga ({currentCatalog.name})
              </h4>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {currentCatalog.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className="w-full p-2.5 rounded-xl bg-background border border-border/60 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-xs font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                        {item.name}
                      </div>
                      <div className="text-[11px] font-bold text-emerald-600">
                        Rp {item.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* POS Payment Form & Cart */}
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/60 space-y-4">
            <h3 className="font-semibold text-foreground pb-2 border-b border-border/60 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" /> Keranjang & Terminal Pembayaran
            </h3>

            {/* Cart Items */}
            {cart.length > 0 ? (
              <div className="space-y-2 p-3 rounded-xl bg-background border border-border/60 text-xs">
                {cart.map((i) => (
                  <div key={i.id} className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">{i.name}</span>
                      <span className="text-muted-foreground ml-1">x{i.qty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Rp {(i.price * i.qty).toLocaleString('id-ID')}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(i.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex justify-between font-bold text-sm text-emerald-600">
                  <span>Total Belanja:</span>
                  <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Nominal Manual (Jika tanpa katalog)</label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-emerald-500/40 text-emerald-600 font-bold text-base"
                  placeholder="10000"
                />
              </div>
            )}

            <form onSubmit={handlePayment} className="space-y-3 pt-2 border-t border-border/60">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Tap RFID Card UID</label>
                  <input
                    type="text"
                    value={cardUid}
                    onChange={(e) => setCardUid(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-mono"
                    placeholder="RFID-1001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">PIN Santri</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-mono text-center tracking-widest"
                    placeholder="****"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || finalAmount <= 0}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Bayar Rp {finalAmount.toLocaleString('id-ID')}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* POS Status & Receipt Display */}
          <div className="p-6 rounded-2xl bg-muted/20 border border-border/60 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Struk POS ({currentCatalog.name})</h3>

              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                    Transaksi Ditolak!
                  </div>
                  <p className="text-xs leading-relaxed">{errorMsg}</p>
                </div>
              )}

              {result && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-400">
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
                      <p className="text-xs opacity-75">Kelas: {result.kelas} | {result.vendorName}</p>
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
                  <p className="text-xs">Pilih menu dari katalog kantin aktif lalu tap kartu RFID santri untuk transaksi.</p>
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
