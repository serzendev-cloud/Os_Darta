'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { ShieldAlert, Lock, Unlock, Sliders, Eye, Search, CheckCircle2 } from 'lucide-react';
import { mockSantri } from '@/data/mock';

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
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-border text-sm"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
          </div>
        </div>

        <div className="border border-border/60 rounded-2xl overflow-hidden">
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
                          className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium flex items-center gap-1"
                        >
                          <Sliders className="w-3.5 h-3.5" /> Set Limit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleFreeze(s.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
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

        {/* Modal Set Limit */}
        {showLimitModal && selectedSantri && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl border border-border p-6 max-w-sm w-full space-y-4">
              <h3 className="font-bold text-base">Set Batasan Belanja Harian</h3>
              <p className="text-xs text-muted-foreground">
                Atur limit pembelanjaan harian sentral untuk <strong>{selectedSantri.name}</strong> di seluruh kantin.
              </p>

              <div>
                <label className="block text-xs font-medium mb-1">Limit Harian (Rp)</label>
                <input
                  type="number"
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLimitModal(false)}
                  className="px-4 py-2 rounded-xl bg-muted text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveLimit}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
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
