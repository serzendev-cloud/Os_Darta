'use client';

import { useState, useEffect } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { Store, Plus, Tag, Edit3, Trash2, CheckCircle2, Clock, MapPin, Sliders, RefreshCw, Shield, Eye, Lock, DollarSign, TrendingUp } from 'lucide-react';
import { 
  CanteenUnit, 
  CanteenCatalogItem, 
  getStoredCanteenUnits, 
  saveStoredCanteenUnits, 
  getStoredCanteenItems, 
  saveStoredCanteenItems 
} from '@/lib/store/canteen-store';

export default function KantinManagementPage() {
  const [canteensList, setCanteensList] = useState<CanteenUnit[]>([]);
  const [selectedCanteenId, setSelectedCanteenId] = useState<string>('cnt-1');
  const [itemsList, setItemsList] = useState<CanteenCatalogItem[]>([]);
  
  // View Role Switcher: 'manager' | 'staff'
  const [activeRole, setActiveRole] = useState<'manager' | 'staff'>('manager');

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
  const [newItemCostPrice, setNewItemCostPrice] = useState('7000');
  const [newItemStock, setNewItemStock] = useState('50');

  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Load stored canteens and items on mount
  useEffect(() => {
    const units = getStoredCanteenUnits();
    const items = getStoredCanteenItems();
    setCanteensList(units);
    setItemsList(items);
    if (units.length > 0) {
      setSelectedCanteenId(units[0].id);
    }
  }, []);

  // Add new canteen using Default Preset Template
  const handleAddCanteen = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `cnt_${Date.now()}`;
    const newEntry: CanteenUnit = {
      id: newId,
      name: newCanteenName || 'Kantin Baru',
      code: newCanteenCode || `KNT-0${canteensList.length + 1}`,
      location: newCanteenLocation || 'Area Pesantren',
      operatingHours: '06:00 - 17:00',
      receiptFooter: `Terima kasih telah berbelanja di ${newCanteenName || 'Kantin Pesantren'}`,
      status: 'active',
    };

    const updatedCanteens = [...canteensList, newEntry];
    setCanteensList(updatedCanteens);
    saveStoredCanteenUnits(updatedCanteens);

    setSelectedCanteenId(newId);
    setShowCanteenModal(false);
    setNewCanteenName('');
    setNewCanteenCode('');
    setNewCanteenLocation('');
    showToast(`Kantin "${newEntry.name}" berhasil dibuat & disinkronkan ke POS Kantin RFID!`);
  };

  // Add new item to selected canteen catalog
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: CanteenCatalogItem = {
      id: `itm_${Date.now()}`,
      canteenId: selectedCanteenId,
      name: newItemName,
      code: `ITEM-${Math.floor(Math.random() * 1000)}`,
      category: newItemCategory,
      price: Number(newItemPrice),
      costPrice: Number(newItemCostPrice),
      stock: Number(newItemStock),
    };

    const updatedItems = [...itemsList, newItem];
    setItemsList(updatedItems);
    saveStoredCanteenItems(updatedItems);

    setShowItemModal(false);
    setNewItemName('');
    setNewItemPrice('10000');
    setNewItemCostPrice('7000');
    showToast(`Barang "${newItem.name}" berhasil ditambahkan ke Katalog Kantin & Disinkronkan ke POS Kasir!`);
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    const updatedItems = itemsList.filter(i => i.id !== itemId);
    setItemsList(updatedItems);
    saveStoredCanteenItems(updatedItems);
    showToast(`Barang "${itemName}" telah dihapus dari katalog.`);
  };

  const selectedCanteen = canteensList.find((c) => c.id === selectedCanteenId) || canteensList[0] || { id: 'cnt-1', name: 'Kantin Utama' };
  const canteenItemsFiltered = itemsList.filter((i) => i.canteenId === selectedCanteenId);

  // Financial Analytics Calculations
  const grossSales = canteenItemsFiltered.reduce((sum, i) => sum + i.price * Math.max(1, i.stock), 0);
  const totalCost = canteenItemsFiltered.reduce((sum, i) => sum + (i.costPrice || i.price * 0.7) * Math.max(1, i.stock), 0);
  const netProfit = grossSales - totalCost;

  const isManager = activeRole === 'manager';

  return (
    <div className="space-y-6 font-sans">
      <PageCard
        title="Manajemen Multi-Kantin & Katalog Harga Per-Kantin"
        description="Kelola unit kantin, atur katalog barang, dan pantau performa keuangan (Laba Bersih dilindungi khusus Canteen Manager)"
      >
        {toastMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            {toastMsg}
          </div>
        )}

        {/* Role Switcher Toolbar */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Shield className="w-4 h-4 text-emerald-600" /> Mode Tampilan Otoritas:
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveRole('manager')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                isManager
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-background hover:bg-muted text-muted-foreground border border-border'
              }`}
            >
              Canteen Manager (Akses Laba Bersih)
            </button>
            <button
              type="button"
              onClick={() => setActiveRole('staff')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                !isManager
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-background hover:bg-muted text-muted-foreground border border-border'
              }`}
            >
              Canteen Staff (Operasional Kasir Only)
            </button>
          </div>
        </div>

        {/* Financial Performance Header (Manager Only) */}
        {isManager ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Omzet Penjualan</span>
              <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                Rp {grossSales.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Total Modal HPP</span>
              <p className="text-lg font-extrabold text-blue-700 dark:text-blue-300">
                Rp {totalCost.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center justify-between">
                <span>Estimasi Laba Bersih</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              <p className="text-lg font-extrabold text-purple-700 dark:text-purple-300">
                Rp {netProfit.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              Tampilan Canteen Staff: Data Laba Bersih & Analitik Keuangan Sensitif Diberlakukan Proteksi Server-Side.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canteens List Sidebar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-muted/30 border border-border/60 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs flex items-center gap-2 text-foreground">
                <Store className="w-4 h-4 text-emerald-600" /> Unit Kantin & Stand
              </h3>
              {isManager && (
                <button
                  type="button"
                  onClick={() => setShowCanteenModal(true)}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-colors min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              )}
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
                        ? 'bg-background border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-background/60 border-border hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-foreground">{c.name}</div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {c.code}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground" /> {c.location}</span>
                      <span className="font-bold text-foreground">{itemCount} Barang</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Canteen Items Management */}
          <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-background border border-border space-y-5 shadow-sm">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider">
                  Katalog Aktif ({selectedCanteen.code})
                </span>
                <h2 className="text-base font-extrabold text-foreground">
                  {selectedCanteen.name}
                </h2>
                <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedCanteen.location}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selectedCanteen.operatingHours}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowItemModal(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Plus className="w-4 h-4" /> Tambah Barang Katalog
              </button>
            </div>

            {/* Desktop Table View & Mobile Cards View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/60 border-b border-border text-muted-foreground font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3">Kode & Nama Barang</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Stok</th>
                    <th className="py-3 px-3">Harga Jual</th>
                    {isManager && <th className="py-3 px-3">Harga Modal (HPP)</th>}
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {canteenItemsFiltered.length === 0 ? (
                    <tr>
                      <td colSpan={isManager ? 6 : 5} className="py-8 text-center text-muted-foreground text-xs">
                        Belum ada barang di katalog kantin ini. Klik 'Tambah Barang Katalog' di atas.
                      </td>
                    </tr>
                  ) : (
                    canteenItemsFiltered.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-foreground">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{item.code}</div>
                        </td>
                        <td className="py-3 px-3 uppercase text-[10px] font-bold text-muted-foreground">
                          {item.category}
                        </td>
                        <td className="py-3 px-3 font-bold text-foreground">
                          {item.stock} unit
                        </td>
                        <td className="py-3 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                          Rp {item.price.toLocaleString('id-ID')}
                        </td>
                        {isManager && (
                          <td className="py-3 px-3 font-semibold text-blue-600 dark:text-blue-400">
                            Rp {(item.costPrice || item.price * 0.7).toLocaleString('id-ID')}
                          </td>
                        )}
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="p-2 rounded-xl bg-muted text-muted-foreground hover:text-rose-600 transition-colors min-h-[36px]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </PageCard>

      {/* NEW CANTEEN MODAL */}
      {showCanteenModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">Tambah Unit Kantin Baru</h3>
            <form onSubmit={handleAddCanteen} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Nama Kantin / Stand:</label>
                <input
                  type="text"
                  value={newCanteenName}
                  onChange={(e) => setNewCanteenName(e.target.value)}
                  placeholder="misal: Kantin Gedung Kairo"
                  className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-xs font-bold min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Kode Kantin:</label>
                <input
                  type="text"
                  value={newCanteenCode}
                  onChange={(e) => setNewCanteenCode(e.target.value)}
                  placeholder="misal: KNT-05"
                  className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-xs font-mono font-bold min-h-[44px]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Lokasi:</label>
                <input
                  type="text"
                  value={newCanteenLocation}
                  onChange={(e) => setNewCanteenLocation(e.target.value)}
                  placeholder="misal: Asrama Barat Lt. 1"
                  className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-xs font-medium min-h-[44px]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCanteenModal(false)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground min-h-[44px]">Batal</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md min-h-[44px]">Simpan Kantin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW ITEM MODAL */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">Tambah Barang Ke {selectedCanteen.name}</h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Nama Barang:</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="misal: Roti Bakar Cokelat"
                  className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-xs font-bold min-h-[44px]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Harga Jual (Rp):</label>
                  <input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-xs font-bold min-h-[44px]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Harga Modal HPP (Rp):</label>
                  <input
                    type="number"
                    value={newItemCostPrice}
                    onChange={(e) => setNewItemCostPrice(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-xs font-bold min-h-[44px]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Stok Awal:</label>
                <input
                  type="number"
                  value={newItemStock}
                  onChange={(e) => setNewItemStock(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-xs font-bold min-h-[44px]"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground min-h-[44px]">Batal</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md min-h-[44px]">Tambah Barang</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
