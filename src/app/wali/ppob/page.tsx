'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import {
  Zap,
  PhoneCall,
  Wifi,
  Wallet,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Search,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

// Mock Product Catalog for PLN Tokens & Pulsa
const PLN_TOKENS = [
  { sku: 'pln20', name: 'Token PLN 20.000', priceBase: 20000, fee: 1500, priceSelling: 21500 },
  { sku: 'pln50', name: 'Token PLN 50.000', priceBase: 50000, fee: 1500, priceSelling: 51500 },
  { sku: 'pln100', name: 'Token PLN 100.000', priceBase: 100000, fee: 1500, priceSelling: 101500 },
  { sku: 'pln200', name: 'Token PLN 200.000', priceBase: 200000, fee: 1500, priceSelling: 201500 },
  { sku: 'pln500', name: 'Token PLN 500.000', priceBase: 500000, fee: 1500, priceSelling: 501500 },
  { sku: 'pln1000', name: 'Token PLN 1.000.000', priceBase: 1000000, fee: 1500, priceSelling: 1001500 },
];

const PULSA_PRODUCTS = [
  { sku: 'tlk10', name: 'Telkomsel Rp 10.000', brand: 'Telkomsel', priceSelling: 11500 },
  { sku: 'tlk25', name: 'Telkomsel Rp 25.000', brand: 'Telkomsel', priceSelling: 26500 },
  { sku: 'tlk50', name: 'Telkomsel Rp 50.000', brand: 'Telkomsel', priceSelling: 51500 },
  { sku: 'ind10', name: 'Indosat Rp 10.000', brand: 'Indosat', priceSelling: 11500 },
  { sku: 'ind25', name: 'Indosat Rp 25.000', brand: 'Indosat', priceSelling: 26500 },
  { sku: 'xl25', name: 'XL Axiata Rp 25.000', brand: 'XL', priceSelling: 26500 },
];

export default function WaliPpobPage() {
  const [activeTab, setActiveTab] = useState<'PLN' | 'PULSA' | 'DATA'>('PLN');
  const [customerNo, setCustomerNo] = useState('');
  const [inquiryData, setInquiryData] = useState<any>(null);
  const [inquiring, setInquiring] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'QRIS_SAAS' | 'SALDO_PPOB'>('QRIS_SAAS');
  
  // Saldo Dompet PPOB Wali (Khusus Platform Level SaaS Owner)
  const [ppobBalance, setPpobBalance] = useState(35000); // Demo saldo refund Rp 35.000
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [copiedSn, setCopiedSn] = useState(false);

  // Mock Inkuiri Pelanggan PLN
  const handleInquirePln = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerNo) return;
    setInquiring(true);
    setInquiryData(null);

    try {
      const res = await fetch('/api/ppob/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerNo, skuCode: 'pln20' }),
      });
      const json = await res.json();
      if (json.success) {
        setInquiryData(json.data);
      } else {
        alert(json.message || 'Nomor Meteran PLN tidak ditemukan');
      }
    } catch (err) {
      // Fallback UI
      setInquiryData({
        customerNo,
        customerName: 'Ahmad Fulan (Demopontren)',
        segmentPower: 'R1M / 900 VA',
      });
    } finally {
      setInquiring(false);
    }
  };

  // Process Checkout
  const handleCheckout = async () => {
    if (!selectedProduct || !customerNo) return;
    setLoadingCheckout(true);
    setCheckoutResult(null);

    try {
      const res = await fetch('/api/ppob/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'pesantren-001',
          waliId: 'wali-001',
          categoryCode: activeTab,
          buyerSkuCode: selectedProduct.sku,
          productName: selectedProduct.name,
          customerNo,
          customerName: inquiryData?.customerName || 'Wali Santri',
          totalAmount: selectedProduct.priceSelling,
          paymentMethod,
          walletBalanceCurrent: ppobBalance,
        }),
      });

      const json = await res.json();
      setCheckoutResult(json);

      if (json.success && json.paymentMethod === 'SALDO_PPOB') {
        if (json.newBalance !== undefined) setPpobBalance(json.newBalance);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memproses pembelian PPOB');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSn(true);
    setTimeout(() => setCopiedSn(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Wallet Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <PageHeader
            title="Layanan Pembelian Token PLN & Pulsa Wali Santri"
            description="Layanan instan pengisian token listrik PLN, pulsa HP, dan paket data santri. Diproses langsung oleh Platform SaaS Server."
          />
        </div>

        {/* Dompet PPOB Wali Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-900 to-stone-900 text-white shadow-lg border border-emerald-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-emerald-300 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-400" /> Dompet PPOB Wali
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40">
                SaaS Owner Direct
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xs text-stone-300">Saldo Refund PPOB Anda:</span>
              <div className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                Rp {ppobBalance.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-stone-300/80 mt-3 pt-2 border-t border-white/10">
            * Saldo ini berasal dari refund pengalihan otomatis jika transaksi provider gagal. Saldo terpisah dari Uang Saku Santri.
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 border-b border-border/60 pb-2 overflow-x-auto hide-scrollbar">
        <button
          type="button"
          onClick={() => {
            setActiveTab('PLN');
            setSelectedProduct(null);
          }}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'PLN'
              ? 'bg-amber-500 text-slate-950 font-bold shadow'
              : 'bg-muted/40 hover:bg-muted text-muted-foreground'
          }`}
        >
          <Zap className="w-4 h-4 fill-amber-950" /> Token Listrik PLN
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('PULSA');
            setSelectedProduct(null);
          }}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'PULSA'
              ? 'bg-blue-600 text-white font-bold shadow'
              : 'bg-muted/40 hover:bg-muted text-muted-foreground'
          }`}
        >
          <PhoneCall className="w-4 h-4" /> Pulsa HP
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('DATA');
            setSelectedProduct(null);
          }}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap min-h-[44px] ${
            activeTab === 'DATA'
              ? 'bg-purple-600 text-white font-bold shadow'
              : 'bg-muted/40 hover:bg-muted text-muted-foreground'
          }`}
        >
          <Wifi className="w-4 h-4" /> Paket Data Internet
        </button>
      </div>

      {/* Content Form & Product Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input No Pelanggan & Products */}
        <div className="lg:col-span-2 space-y-5">
          {/* Inquiry Input Box */}
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <label className="block text-sm font-semibold text-foreground">
              {activeTab === 'PLN' ? 'Masukkan Nomor Meter / ID Pelanggan PLN' : 'Masukkan Nomor Telepon HP'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customerNo}
                  onChange={(e) => setCustomerNo(e.target.value)}
                  placeholder={activeTab === 'PLN' ? 'Contoh: 14029981240' : 'Contoh: 081234567890'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/40 border border-border text-sm font-mono font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3.5" />
              </div>
              {activeTab === 'PLN' && (
                <button
                  onClick={handleInquirePln}
                  disabled={inquiring || !customerNo}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {inquiring ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Cek Pelanggan'}
                </button>
              )}
            </div>

            {/* Inquiry Customer Result Badge */}
            {inquiryData && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex justify-between items-center text-xs">
                <div>
                  <span className="text-muted-foreground">Pelanggan PLN:</span>
                  <p className="font-bold text-sm text-foreground">{inquiryData.customerName}</p>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">Tarif / Daya:</span>
                  <p className="font-semibold text-amber-700 dark:text-amber-300">{inquiryData.segmentPower}</p>
                </div>
              </div>
            )}
          </div>

          {/* Product Grid */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Pilih Nominal {activeTab === 'PLN' ? 'Token Listrik' : 'Pulsa/Data'}
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(activeTab === 'PLN' ? PLN_TOKENS : PULSA_PRODUCTS).map((item) => {
                const isSelected = selectedProduct?.sku === item.sku;
                return (
                  <div
                    key={item.sku}
                    onClick={() => setSelectedProduct(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-card border-border hover:border-emerald-500/50'
                    }`}
                  >
                    <span className="text-xs font-semibold text-muted-foreground">{item.name}</span>
                    <div>
                      <span className="text-base font-extrabold text-foreground">
                        Rp {item.priceSelling.toLocaleString('id-ID')}
                      </span>
                      <p className="text-[10px] text-muted-foreground">Bebas Biaya Admin Tambahan</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Summary & Payment Options */}
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
            <h3 className="font-semibold text-foreground pb-2 border-b border-border flex items-center justify-between">
              <span>Ringkasan Checkout</span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Terverifikasi Server SaaS
              </span>
            </h3>

            {selectedProduct ? (
              <div className="space-y-4 text-xs">
                <div className="space-y-2 p-3.5 rounded-xl bg-muted/40 border border-border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Produk:</span>
                    <span className="font-bold text-foreground">{selectedProduct.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nomor Tujuan:</span>
                    <span className="font-mono font-bold text-foreground">{customerNo || '-'}</span>
                  </div>
                  {inquiryData && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nama Pelanggan:</span>
                      <span className="font-semibold text-emerald-600">{inquiryData.customerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border/60">
                    <span className="text-muted-foreground">Total Tagihan:</span>
                    <span className="font-extrabold text-sm text-emerald-600">
                      Rp {selectedProduct.priceSelling.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Select Payment Method */}
                <div className="space-y-2">
                  <label className="font-semibold text-foreground text-xs">Metode Pembayaran:</label>

                  {/* Option 1: QRIS SaaS PG */}
                  <label
                    onClick={() => setPaymentMethod('QRIS_SAAS')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'QRIS_SAAS'
                        ? 'bg-emerald-500/10 border-emerald-500 font-bold'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="block text-xs font-semibold">Dynamic QRIS (SaaS PG)</span>
                        <span className="text-[10px] text-muted-foreground">BCA, Mandiri, GoPay, OVO, Shopee</span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payMethod"
                      checked={paymentMethod === 'QRIS_SAAS'}
                      onChange={() => setPaymentMethod('QRIS_SAAS')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>

                  {/* Option 2: Dompet PPOB Wali */}
                  <label
                    onClick={() => setPaymentMethod('SALDO_PPOB')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === 'SALDO_PPOB'
                        ? 'bg-emerald-500/10 border-emerald-500 font-bold'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="block text-xs font-semibold">Dompet PPOB Wali</span>
                        <span className="text-[10px] text-muted-foreground">
                          Saldo: Rp {ppobBalance.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="payMethod"
                      checked={paymentMethod === 'SALDO_PPOB'}
                      onChange={() => setPaymentMethod('SALDO_PPOB')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loadingCheckout || !customerNo}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md"
                >
                  {loadingCheckout ? 'Memproses Ke Server SaaS...' : 'Bayar Sekarang'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <Zap className="w-10 h-10 mx-auto text-amber-500 opacity-40" />
                <p className="text-xs">Silakan pilih produk Token PLN atau Pulsa di sebelah kiri untuk melanjutkan checkout.</p>
              </div>
            )}
          </div>

          {/* Checkout Result Popup / Card */}
          {checkoutResult && (
            <div className="p-5 rounded-2xl bg-card border border-emerald-500/50 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" /> Status Transaksi PPOB
              </div>

              {checkoutResult.status === 'SUCCESS' && (
                <div className="space-y-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                    KODE TOKEN LISTRIK 20 DIGIT (SN):
                  </span>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-emerald-500/40 font-mono text-base font-extrabold text-foreground">
                    <span>{checkoutResult.sn || '3412-8901-2245-6712-9901'}</span>
                    <button
                      onClick={() => copyToClipboard(checkoutResult.sn || '3412-8901-2245-6712-9901')}
                      className="p-1.5 rounded bg-muted hover:bg-muted/80 text-foreground transition-colors"
                      title="Salin Kode Token"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  {copiedSn && <p className="text-[10px] text-emerald-600 text-right font-medium">✓ Berhasil disalin!</p>}
                </div>
              )}

              {checkoutResult.status === 'PENDING_PAYMENT' && checkoutResult.qrCodeUrl && (
                <div className="space-y-3 text-center text-xs">
                  <p className="text-muted-foreground">Scan QRIS SaaS PG berikut untuk menyelesaikan pembayaran:</p>
                  <img
                    src={checkoutResult.qrCodeUrl}
                    alt="QRIS SaaS PG"
                    className="w-48 h-48 mx-auto rounded-xl border border-border shadow-md"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Setelah bayar, webhook server SaaS akan otomatis mengisi pulsa/token dan mengirimkan SMS/WA struk.
                  </p>
                </div>
              )}

              {checkoutResult.status === 'FAILED_REFUNDED' && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-red-600 font-bold">
                    <AlertCircle className="w-4 h-4" /> Pasokan Provider Digiflazz Gagal
                  </div>
                  <p className="text-muted-foreground">{checkoutResult.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
