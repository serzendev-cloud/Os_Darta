'use client';

import { useState, useEffect } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { ShoppingBag, CreditCard, Lock, AlertCircle, CheckCircle2, RefreshCw, Plus, Trash2, Store, Tag } from 'lucide-react';
import { 
  CanteenUnit, 
  CanteenCatalogItem, 
  getStoredCanteenUnits, 
  getStoredCanteenItems 
} from '@/lib/store/canteen-store';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export default function KantinNfcPage() {
  const [canteenUnits, setCanteenUnits] = useState<CanteenUnit[]>([]);
  const [canteenItems, setCanteenItems] = useState<CanteenCatalogItem[]>([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string>('cnt-1');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customAmount, setCustomAmount] = useState<string>('');
  
  const [cardUid, setCardUid] = useState('RFID-1001');
  const [pin, setPin] = useState('1234');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Synchronize with Canteen Store on Load
  useEffect(() => {
    const units = getStoredCanteenUnits();
    const items = getStoredCanteenItems();
    setCanteenUnits(units);
    setCanteenItems(items);
    if (units.length > 0) {
      setSelectedCanteenId(units[0].id);
    }
  }, []);

  const activeUnits = canteenUnits.filter(u => u.status === 'active');
  const selectedCanteen = canteenUnits.find(u => u.id === selectedCanteenId) || activeUnits[0] || { id: 'cnt-1', name: 'Kantin Utama Pesantren' };

  // Filter Catalog Items assigned specifically to selected Canteen Unit & Category
  const currentCatalogItems = canteenItems.filter(item => {
    const matchCanteen = item.canteenId === selectedCanteenId;
    const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchCanteen && matchCat;
  });

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
          vendorName: selectedCanteen.name,
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
    <div className="space-y-6 font-sans">
      <PageCard
        title="POS Kantin & Koperasi — Pembayaran RFID & Katalog Harga Per-Kantin"
        description="Terminal Kasir Kantin dengan Pemilihan Katalog Harga Spesifik Kantin, Verifikasi PIN, Gawang Freeze Wali Santri, & Limit Belanja Harian Terpusat"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canteen Selector & Dynamic Catalog Grid */}
          <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-4">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">
                Pilih Unit Kantin Active (Disinkronkan)
              </label>
              <select
                value={selectedCanteenId}
                onChange={(e) => {
                  setSelectedCanteenId(e.target.value);
                  setCart([]);
                }}
                className="w-full px-3.5 py-3 rounded-xl bg-background border-2 border-emerald-500/40 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer min-h-[44px]"
              >
                {activeUnits.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'makanan', label: 'Makanan' },
                { id: 'minuman', label: 'Minuman' },
                { id: 'snack', label: 'Snack' },
                { id: 'alat_tulis', label: 'Alat Tulis' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors min-h-[36px] ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-background hover:bg-muted text-muted-foreground border border-border/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Dynamic Catalog Items Grid */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {currentCatalogItems.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-muted/40 text-muted-foreground text-xs">
                  Belum ada barang di kategori unit ini.<br />
                  <span className="text-[10px] text-muted-foreground/80">Tambahkan barang dari menu Manajemen Multi-Kantin.</span>
                </div>
              ) : (
                currentCatalogItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="p-3.5 rounded-xl bg-background border border-border flex items-center justify-between hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer transition-all active:scale-[0.98] shadow-sm min-h-[44px]"
                  >
                    <div>
                      <div className="font-bold text-xs text-foreground">{item.name}</div>
                      <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Rp {item.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart & Checkout Terminal */}
          <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs flex items-center gap-2 text-foreground">
                <ShoppingBag className="w-4 h-4 text-emerald-600" /> Keranjang & Terminal Pembayaran
              </h3>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-[10px] text-rose-600 font-bold hover:underline py-1 px-2"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-foreground">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        Rp {item.price.toLocaleString('id-ID')} x {item.qty}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        Rp {(item.price * item.qty).toLocaleString('id-ID')}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground hover:text-rose-600 p-1 min-h-[32px] flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Nominal Manual (Jika tanpa katalog)
                </label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Masukkan nominal Rp..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs font-bold text-foreground min-h-[44px]"
                />
              </div>
            )}

            {/* Payment Form */}
            <form onSubmit={handlePayment} className="space-y-3 pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase">Tap RFID Card UID</label>
                  <input
                    type="text"
                    value={cardUid}
                    onChange={(e) => setCardUid(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-xs font-mono font-bold min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase">PIN Santri</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-xs font-mono font-bold text-center min-h-[44px]"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || finalAmount <= 0}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                <span>Bayar Rp {finalAmount.toLocaleString('id-ID')}</span>
              </button>
            </form>
          </div>

          {/* Struk POS Section */}
          <div className="p-4 sm:p-5 rounded-2xl bg-background border border-border shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="font-extrabold text-xs text-foreground pb-2 border-b border-border flex items-center justify-between">
                <span>Struk POS ({selectedCanteen.name})</span>
                <Store className="w-4 h-4 text-emerald-600" />
              </h3>

              {result ? (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Transaksi Berhasil!</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>No. Struk:</span>
                      <span className="font-mono font-bold text-foreground">{result.transactionId || 'TX-1001'}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Santri:</span>
                      <span className="font-bold text-foreground">{result.santriName}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Kantin:</span>
                      <span className="font-bold text-foreground">{result.vendorName}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Items:</span>
                      <span className="font-medium text-foreground max-w-[180px] text-right truncate">{itemsSummary}</span>
                    </div>
                    <div className="pt-2 border-t border-dashed border-border flex justify-between font-extrabold text-sm">
                      <span>Total Belanja:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">Rp {result.amountDeducted?.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-[11px]">
                      <span>Sisa Saldo Wallet:</span>
                      <span>Rp {result.remainingBalanceUangSaku?.toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full py-3 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 min-h-[44px]"
                  >
                    Transaksi Baru
                  </button>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-muted-foreground/60" />
                  <p>Pilih menu dari katalog kantin aktif lalu tap kartu RFID santri untuk transaksi.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
