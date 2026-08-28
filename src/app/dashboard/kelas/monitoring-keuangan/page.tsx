'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { ShieldAlert, Lock, Unlock, Sliders, Search, CheckCircle2, Wallet, AlertCircle } from 'lucide-react';
import { mockSantri } from '@/data/mock';
import {
  ResponsiveDataGrid,
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardContent,
  MobileCardFooter,
} from '@/components/ui/responsive-data';

interface SantriFinancialRow {
  id: string;
  name: string;
  nis: string;
  kelas: string;
  balanceUangSaku: number;
  balanceTabungan: number;
  spentToday: number;
  dailyLimit: number;
  canteenStatus: 'active' | 'suspended_by_walikelas' | 'suspended_by_wali';
}

const initialData: SantriFinancialRow[] = mockSantri.slice(0, 5).map((s, idx) => ({
  id: s.id,
  name: s.name,
  nis: s.nis,
  kelas: s.kelas,
  balanceUangSaku: (idx + 1) * 25000,
  balanceTabungan: (idx + 1) * 100000,
  spentToday: idx === 1 ? 20000 : idx * 5000,
  dailyLimit: 20000,
  canteenStatus: idx === 3 ? 'suspended_by_walikelas' : 'active',
}));

export default function MonitoringKeuanganKelasPage() {
  const [data, setData] = useState<SantriFinancialRow[]>(initialData);
  const [search, setSearch] = useState('');
  const [selectedSantri, setSelectedSantri] = useState<SantriFinancialRow | null>(null);
  const [newLimit, setNewLimit] = useState('20000');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const toggleFreeze = (id: string) => {
    setData((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.canteenStatus === 'active' ? 'suspended_by_walikelas' : 'active';
          showToast(
            nextStatus === 'suspended_by_walikelas'
              ? `Fitur Belanja Kartu RFID ${item.name} berhasil dinonaktifkan sementara.`
              : `Fitur Belanja Kartu RFID ${item.name} diaktifkan kembali.`
          );
          return { ...item, canteenStatus: nextStatus };
        }
        return item;
      })
    );
  };

  const handleSaveLimit = () => {
    if (!selectedSantri) return;
    setData((prev) =>
      prev.map((item) =>
        item.id === selectedSantri.id ? { ...item, dailyLimit: Number(newLimit) } : item
      )
    );
    showToast(`Limit belanja harian ${selectedSantri.name} diubah menjadi Rp ${Number(newLimit).toLocaleString('id-ID')}/hari.`);
    setShowLimitModal(false);
  };

  const filtered = data.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) || item.nis.includes(search)
  );

  return (
    <div className="space-y-6">
      <PageCard
        title="Monitoring Keuangan & Kontrol Kartu Santri — Wali Kelas"
        description="Pantau pengeluaran harian, atur batasan belanja sentral, dan nonaktifkan sementara fitur belanja kartu RFID santri binaan"
      >
        {toastMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            {toastMsg}
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Cari santri..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm min-h-[44px]"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Responsive Data Grid Presentation Adapter */}
        <ResponsiveDataGrid
          data={filtered}
          keyExtractor={(s) => s.id}
          renderDesktop={() => (
            <div className="border border-border/60 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-4 py-3">Santri</th>
                    <th className="px-4 py-3">Saldo Uang Saku</th>
                    <th className="px-4 py-3">Pengeluaran Hari Ini</th>
                    <th className="px-4 py-3">Limit Harian</th>
                    <th className="px-4 py-3">Status Belanja Kartu</th>
                    <th className="px-4 py-3 text-right">Aksi Wali Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((s) => {
                    const isLimitReached = s.spentToday >= s.dailyLimit;
                    const isSuspended = s.canteenStatus !== 'active';

                    return (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-semibold text-foreground">{s.name}</div>
                            <div className="text-xs text-muted-foreground">NIS: {s.nis} | Kelas: {s.kelas}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                          Rp {s.balanceUangSaku.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${isLimitReached ? 'text-red-600 font-bold' : ''}`}>
                            Rp {s.spentToday.toLocaleString('id-ID')}
                          </span>
                          {isLimitReached && (
                            <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-600 font-semibold">
                              Limit Reached
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-amber-600 dark:text-amber-400 font-medium">
                          Rp {s.dailyLimit.toLocaleString('id-ID')}/hari
                        </td>
                        <td className="px-4 py-3">
                          {isSuspended ? (
                            <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-semibold flex items-center gap-1.5 w-fit">
                              <Lock className="w-3.5 h-3.5" /> Dinonaktifkan
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold flex items-center gap-1.5 w-fit">
                              <Unlock className="w-3.5 h-3.5" /> Aktif Belanja
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSantri(s);
                                setNewLimit(String(s.dailyLimit));
                                setShowLimitModal(true);
                              }}
                              className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-semibold flex items-center gap-1 min-h-[36px]"
                            >
                              <Sliders className="w-3.5 h-3.5" /> Set Limit
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleFreeze(s.id)}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors min-h-[36px] ${
                                isSuspended
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                            >
                              {isSuspended ? (
                                <>
                                  <Unlock className="w-3.5 h-3.5" /> Aktifkan Belanja
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="w-3.5 h-3.5" /> Nonaktifkan Belanja
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          renderMobile={(s) => {
            const isLimitReached = s.spentToday >= s.dailyLimit;
            const isSuspended = s.canteenStatus !== 'active';

            return (
              <MobileCard key={s.id} className="p-4 space-y-3.5 border border-border/80">
                <MobileCardHeader className="p-0 flex items-start justify-between">
                  <div>
                    <MobileCardTitle className="text-sm font-bold text-foreground">{s.name}</MobileCardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">NIS: {s.nis} | Kelas: {s.kelas}</p>
                  </div>
                  {isSuspended ? (
                    <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-[11px] font-bold flex items-center gap-1 shrink-0">
                      <Lock className="w-3 h-3" /> Dinonaktifkan
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold flex items-center gap-1 shrink-0">
                      <Unlock className="w-3 h-3" /> Aktif Belanja
                    </span>
                  )}
                </MobileCardHeader>

                <MobileCardContent className="p-3 rounded-xl bg-muted/30 border border-border/60 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Saldo Uang Saku</span>
                    <p className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Rp {s.balanceUangSaku.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Limit Harian</span>
                    <p className="font-bold text-sm text-amber-600 dark:text-amber-400 mt-0.5">
                      Rp {s.dailyLimit.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="col-span-2 pt-2 border-t border-border/40 flex justify-between items-center">
                    <span className="text-muted-foreground">Pengeluaran Hari Ini:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-extrabold ${isLimitReached ? 'text-red-600' : 'text-foreground'}`}>
                        Rp {s.spentToday.toLocaleString('id-ID')}
                      </span>
                      {isLimitReached && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-600 font-bold">
                          Limit Reached
                        </span>
                      )}
                    </div>
                  </div>
                </MobileCardContent>

                <MobileCardFooter className="p-0 pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSantri(s);
                      setNewLimit(String(s.dailyLimit));
                      setShowLimitModal(true);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px] border border-border/60"
                  >
                    <Sliders className="w-4 h-4 text-muted-foreground" /> Set Limit
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFreeze(s.id)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] shadow-sm ${
                      isSuspended
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isSuspended ? (
                      <>
                        <Unlock className="w-4 h-4" /> Aktifkan Belanja
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" /> Nonaktifkan Belanja
                      </>
                    )}
                  </button>
                </MobileCardFooter>
              </MobileCard>
            );
          }}
        />

        {/* Modal Set Limit */}
        {showLimitModal && selectedSantri && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl border border-border p-6 max-w-sm w-full space-y-4 shadow-xl">
              <h3 className="font-bold text-base text-foreground">Set Batasan Belanja Harian</h3>
              <p className="text-xs text-muted-foreground">
                Atur limit pembelanjaan harian sentral untuk <strong>{selectedSantri.name}</strong> di seluruh kantin.
              </p>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-foreground">Limit Harian (Rp)</label>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-bold min-h-[44px] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLimitModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-muted text-xs font-bold min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveLimit}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold min-h-[44px]"
                >
                  Simpan Limit
                </button>
              </div>
            </div>
          </div>
        )}
      </PageCard>
    </div>
  );
}
