'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { Store, Plus, Tag, Edit3, Trash2, CheckCircle2, Clock, MapPin, Sliders } from 'lucide-react';

interface Canteen {
  id: string;
  name: string;
  code: string;
  location: string;
  operatingHours: string;
  receiptFooter: string;
  status: 'active' | 'inactive';
}

interface CanteenItem {
  id: string;
  canteenId: string;
  name: string;
  code: string;
  category: 'makanan' | 'minuman' | 'snack' | 'alat_tulis';
  price: number;
  stock: number;
}

const initialCanteens: Canteen[] = [
  { id: 'cnt-1', name: 'Kantin Utama Pesantren', code: 'KNT-01', location: 'Gedung Utama Lt. 1', operatingHours: '06:00 - 17:00', receiptFooter: 'Terima kasih telah berbelanja di Kantin Utama', status: 'active' },
  { id: 'cnt-2', name: 'Kantin Asrama Putra', code: 'KNT-02', location: 'Kompleks Asrama Putra', operatingHours: '06:00 - 21:00', receiptFooter: 'Selamat menikmati hidangan Asrama Putra', status: 'active' },
  { id: 'cnt-3', name: 'Kantin Asrama Putri', code: 'KNT-03', location: 'Kompleks Asrama Putri', operatingHours: '06:00 - 21:00', receiptFooter: 'Selamat menikmati hidangan Asrama Putri', status: 'active' },
  { id: 'cnt-4', name: 'Koperasi Pesantren', code: 'KOP-01', location: 'Gedung Serbaguna Lt. 1', operatingHours: '07:30 - 16:00', receiptFooter: 'Terima kasih mendukung Koperasi Pesantren', status: 'active' },
];

const initialItems: CanteenItem[] = [
  { id: 'itm-1', canteenId: 'cnt-1', name: 'Nasi Goreng Spesial', code: 'MKN-01', category: 'makanan', price: 12000, stock: 50 },
  { id: 'itm-2', canteenId: 'cnt-1', name: 'Es Teh Manis', code: 'MNM-01', category: 'minuman', price: 3000, stock: 100 },
  { id: 'itm-3', canteenId: 'cnt-1', name: 'Ayam Geprek Nasi', code: 'MKN-02', category: 'makanan', price: 15000, stock: 40 },
  { id: 'itm-4', canteenId: 'cnt-2', name: 'Nasi Rames Asrama', code: 'MKN-03', category: 'makanan', price: 10000, stock: 60 },
  { id: 'itm-5', canteenId: 'cnt-2', name: 'Kopi Susu Warmindo', code: 'MNM-02', category: 'minuman', price: 4000, stock: 80 },
  { id: 'itm-6', canteenId: 'cnt-4', name: 'Buku Tulis 50 Lembar', code: 'ALT-01', category: 'alat_tulis', price: 5000, stock: 200 },
  { id: 'itm-7', canteenId: 'cnt-4', name: 'Pulpen Gel Hitam', code: 'ALT-02', category: 'alat_tulis', price: 3500, stock: 150 },
];

export default function KantinManagementPage() {
  const [canteensList, setCanteensList] = useState<Canteen[]>(initialCanteens);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string>('cnt-1');
  const [itemsList, setItemsList] = useState<CanteenItem[]>(initialItems);

  // New Canteen Modal state
  const [showCanteenModal, setShowCanteenModal] = useState(false);
  const [newCanteenName, setNewCanteenName] = useState('');
  const [newCanteenCode, setNewCanteenCode] = useState('');
  const [newCanteenLocation, setNewCanteenLocation] = useState('');

  // New Item Modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'makanan' | 'minuman' | 'snack' | 'alat_tulis'>('makanan');
  const [newItemPrice, setNewItemPrice] = useState('10000');
  const [newItemStock, setNewItemStock] = useState('50');

  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Add new canteen using Default Preset Template
  const handleAddCanteen = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `cnt_${Date.now()}`;
    const newEntry: Canteen = {
      id: newId,
      name: newCanteenName || 'Kantin Baru',
      code: newCanteenCode || `KNT-0${canteensList.length + 1}`,
      location: newCanteenLocation || 'Area Pesantren',
      // Default Preset Settings
      operatingHours: '06:00 - 17:00',
      receiptFooter: `Terima kasih telah berbelanja di ${newCanteenName || 'Kantin Pesantren'}`,
      status: 'active',
    };

    setCanteensList((prev) => [...prev, newEntry]);
    setSelectedCanteenId(newId);
    setShowCanteenModal(false);
    setNewCanteenName('');
    setNewCanteenCode('');
    setNewCanteenLocation('');
    showToast(`Kantin "${newEntry.name}" berhasil dibuat dengan Setelan Default Sistem!`);
  };

  // Add new item to selected canteen catalog
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: CanteenItem = {
      id: `itm_${Date.now()}`,
      canteenId: selectedCanteenId,
      name: newItemName,
      code: `ITEM-${Math.floor(Math.random() * 1000)}`,
      category: newItemCategory,
      price: Number(newItemPrice),
      stock: Number(newItemStock),
    };

    setItemsList((prev) => [...prev, newItem]);
    setShowItemModal(false);
    setNewItemName('');
    setNewItemPrice('10000');
    showToast(`Barang "${newItem.name}" berhasil ditambahkan ke Katalog Kantin dengan Harga Rp ${newItem.price.toLocaleString('id-ID')}.`);
  };

  const selectedCanteen = canteensList.find((c) => c.id === selectedCanteenId) || canteensList[0];
  const canteenItemsFiltered = itemsList.filter((i) => i.canteenId === selectedCanteenId);

  return (
    <div className="space-y-6">
      <PageCard
        title="Manajemen Multi-Kantin & Katalog Harga Per-Kantin"
        description="Kelola unit kantin/koperasi pesantren, buat kantin baru dengan setelan default sistem, dan atur harga barang khusus per-kantin"
      >
        {toastMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            {toastMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canteens List Sidebar */}
          <div className="p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" /> Unit Kantin & Stand Pesantren
              </h3>
              <button
                type="button"
                onClick={() => setShowCanteenModal(true)}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Kantin
              </button>
            </div>

            <div className="space-y-2">
              {canteensList.map((c) => {
                const isSelected = c.id === selectedCanteenId;
                const itemCount = itemsList.filter((i) => i.canteenId === c.id).length;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCanteenId(c.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500/40 font-semibold'
                        : 'bg-background hover:bg-muted/50 border-border/60'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm text-foreground">{c.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {c.location}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                        {c.code}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 mt-2 border-t border-border/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {c.operatingHours}
                      </span>
                      <span className="font-semibold text-emerald-600">{itemCount} Barang Catalog</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Item Price Catalog for Selected Canteen */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-muted/20 border border-border/60 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <h3 className="font-bold text-base text-foreground">{selectedCanteen?.name}</h3>
                <p className="text-xs text-muted-foreground">Katalog Harga Barang Khusus ({selectedCanteen?.code})</p>
              </div>

              <button
                type="button"
                onClick={() => setShowItemModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" /> Tambah Barang Catalog
              </button>
            </div>

            <div className="border border-border/60 rounded-xl overflow-hidden bg-background">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Nama Barang</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Harga Di Kantin Ini (Rp)</th>
                    <th className="px-4 py-3">Stok</th>
                    <th className="px-4 py-3 text-right">Aksi Edit Harga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {canteenItemsFiltered.length > 0 ? (
                    canteenItemsFiltered.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{item.name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{item.code}</div>
                        </td>
                        <td className="px-4 py-3 capitalize text-xs">
                          <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                            {item.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                          Rp {item.price.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{item.stock} unit</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const newP = prompt(`Edit harga ${item.name} di ${selectedCanteen.name}:`, String(item.price));
                              if (newP && !isNaN(Number(newP))) {
                                setItemsList((prev) =>
                                  prev.map((i) => (i.id === item.id ? { ...i, price: Number(newP) } : i))
                                );
                                showToast(`Harga ${item.name} diubah menjadi Rp ${Number(newP).toLocaleString('id-ID')}.`);
                              }
                            }}
                            className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium inline-flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Edit Harga
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        Belum ada barang di katalog kantin ini. Klik "Tambah Barang Catalog" untuk menambahkan menu & harga khusus.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal New Canteen with Default Preset */}
        {showCanteenModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleAddCanteen} className="bg-background rounded-2xl border border-border p-6 max-w-md w-full space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600" /> Buat Kantin Baru (Preset Setelan Default)
              </h3>
              <p className="text-xs text-muted-foreground">
                Kantin baru akan otomatis menggunakan preset jam operasional default, format struk, dan izin POS kasir.
              </p>

              <div>
                <label className="block text-xs font-medium mb-1">Nama Kantin / Stand Baru</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Stand Jajanan Pasar 2"
                  value={newCanteenName}
                  onChange={(e) => setNewCanteenName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Kode Kantin</label>
                  <input
                    type="text"
                    required
                    placeholder="KNT-05"
                    value={newCanteenCode}
                    onChange={(e) => setNewCanteenCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Lokasi</label>
                  <input
                    type="text"
                    required
                    placeholder="Gedung Olahraga"
                    value={newCanteenLocation}
                    onChange={(e) => setNewCanteenLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 text-xs space-y-1 text-muted-foreground">
                <div className="font-semibold text-foreground">Preset Setelan Default Sistem:</div>
                <div>• Jam Operasional: 06:00 - 17:00 WIB</div>
                <div>• Validasi Limit Belanja Harian Sentral: Aktif</div>
                <div>• Verifikasi PIN RFID Santri: Aktif</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCanteenModal(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Buat Kantin
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal New Item */}
        {showItemModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleAddItem} className="bg-background rounded-2xl border border-border p-6 max-w-md w-full space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" /> Tambah Barang di {selectedCanteen?.name}
              </h3>

              <div>
                <label className="block text-xs font-medium mb-1">Nama Barang</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Nasi Ayam Bakar"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Kategori</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm"
                  >
                    <option value="makanan">Makanan</option>
                    <option value="minuman">Minuman</option>
                    <option value="snack">Snack / Jajanan</option>
                    <option value="alat_tulis">Alat Tulis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Harga Khusus Kantin Ini (Rp)</label>
                  <input
                    type="number"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-emerald-500/40 text-sm font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Simpan Barang
                </button>
              </div>
            </form>
          </div>
        )}
      </PageCard>
    </div>
  );
}
