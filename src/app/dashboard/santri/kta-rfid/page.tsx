'use client';

import { useState, useMemo } from 'react';
import { PageHeader, PageCard } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { 
  CreditCard, Lock, QrCode, Search, CheckCircle2, ShieldOff, 
  Plus, Radio, Key, RefreshCw, X
} from 'lucide-react';
import { mockSantri } from '@/data/mock';
import {
  ResponsiveDataGrid,
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardContent,
  MobileCardFooter,
  ResponsiveFilterBar,
  MobileRowActions,
} from '@/components/ui/responsive-data';

interface RfidRow {
  santriId: string;
  name: string;
  nis: string;
  kelas: string;
  cardUid: string;
  pinSet: boolean;
  status: 'active' | 'blocked';
}

const initialRows: RfidRow[] = mockSantri.slice(0, 6).map((s, idx) => ({
  santriId: s.id,
  name: s.name,
  nis: s.nis,
  kelas: s.kelas,
  cardUid: `RFID-100${idx + 1}`,
  pinSet: true,
  status: idx === 4 ? 'blocked' : 'active',
}));

export default function KtaRfidPage() {
  const [rows, setRows] = useState<RfidRow[]>(initialRows);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toastMsg, setToastMsg] = useState('');
  
  // Pairing Modal state
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [newSantriId, setNewSantriId] = useState(mockSantri[0]?.id || '');
  const [newCardUid, setNewCardUid] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const toggleBlockCard = (santriId: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.santriId === santriId) {
          const nextStatus = r.status === 'active' ? 'blocked' : 'active';
          showToast(
            nextStatus === 'blocked'
              ? `Kartu RFID ${r.name} (${r.cardUid}) berhasil DIBLOKIR / Dilaporkan Hilang.`
              : `Kartu RFID ${r.name} (${r.cardUid}) berhasil diaktifkan kembali.`
          );
          return { ...r, status: nextStatus };
        }
        return r;
      })
    );
  };

  const handlePairingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSantri = mockSantri.find((s) => s.id === newSantriId);
    if (!targetSantri || !newCardUid) return;

    const newRow: RfidRow = {
      santriId: targetSantri.id,
      name: targetSantri.name,
      nis: targetSantri.nis,
      kelas: targetSantri.kelas,
      cardUid: newCardUid.toUpperCase(),
      pinSet: true,
      status: 'active',
    };

    setRows((prev) => [newRow, ...prev.filter((r) => r.santriId !== targetSantri.id)]);
    showToast(`Pairing RFID ${newCardUid} ke santri ${targetSantri.name} BERHASIL.`);
    setShowPairingModal(false);
    setNewCardUid('');
  };

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.nis.includes(search) ||
        r.cardUid.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || r.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [rows, search, filterStatus]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      <PageHeader
        title="KTA RFID Santri"
        description="Pusat Pairing Chip RFID, Manajemen PIN KTA, Cetak Smart Card, & Penguncian Kartu Hilang"
        action={
          <button
            type="button"
            onClick={() => setShowPairingModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Pairing RFID Baru
          </button>
        }
      />

      {toastMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      <PageCard
        title="Daftar Kartu KTA RFID Santri Terdaftar"
        description={`${filtered.length} kartu terdaftar ditemukan`}
      >
        <ResponsiveFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari santri, NIS, atau Chip UID..."
          activeFilterCount={filterStatus !== 'all' ? 1 : 0}
          onResetFilters={() => setFilterStatus('all')}
          filterContent={
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none min-h-[44px]"
            >
              <option value="all">Semua Status Kartu</option>
              <option value="active">Kartu Aktif</option>
              <option value="blocked">Diblokir / Hilang</option>
            </select>
          }
        />

        <ResponsiveDataGrid
          data={filtered}
          keyExtractor={(r) => r.santriId}
          renderDesktop={() => (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Santri</th>
                    <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Chip RFID UID</th>
                    <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Keamanan PIN</th>
                    <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Status Kartu</th>
                    <th className="text-right px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((r) => (
                    <tr key={r.santriId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0 border border-primary/20">
                            {r.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">{r.name}</p>
                            <p className="text-xs text-muted-foreground">NIS: {r.nis} | Kelas: {r.kelas}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-extrabold text-blue-600 dark:text-blue-400">
                        {r.cardUid}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/20">
                          <Lock className="w-3.5 h-3.5" /> PIN Aktif
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge
                          status={r.status === 'blocked' ? 'Diblokir / Hilang' : 'Aktif'}
                          variant={r.status === 'blocked' ? 'error' : 'success'}
                        />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => showToast(`Cetak KTA Smart Card — ${r.name} (${r.cardUid})`)}
                            className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold flex items-center gap-1.5 min-h-[44px] transition-all border border-border"
                          >
                            <QrCode className="w-4 h-4" /> Cetak KTA
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleBlockCard(r.santriId)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 min-h-[44px] ${
                              r.status === 'blocked'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            {r.status === 'blocked' ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" /> Aktifkan Kartu
                              </>
                            ) : (
                              <>
                                <ShieldOff className="w-4 h-4" /> Blokir Kartu Hilang
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          renderMobile={(r) => (
            <MobileCard key={r.santriId}>
              <MobileCardHeader>
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0 border border-primary/20">
                    {r.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <MobileCardTitle>{r.name}</MobileCardTitle>
                </div>
                <StatusBadge
                  status={r.status === 'blocked' ? 'Diblokir' : 'Aktif'}
                  variant={r.status === 'blocked' ? 'error' : 'success'}
                />
              </MobileCardHeader>
              <MobileCardContent>
                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border font-mono font-bold">
                    <span className="text-muted-foreground font-sans">UID Chip:</span>
                    <span className="text-blue-600 dark:text-blue-400">{r.cardUid}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground text-[11px]">
                    <span>NIS: {r.nis}</span>
                    <span>Kelas: {r.kelas}</span>
                  </div>
                </div>
              </MobileCardContent>
              <MobileCardFooter>
                <button
                  type="button"
                  onClick={() => toggleBlockCard(r.santriId)}
                  className={`w-full py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 min-h-[44px] transition-all ${
                    r.status === 'blocked'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {r.status === 'blocked' ? 'Aktifkan Kartu' : 'Blokir Kartu Hilang'}
                </button>
              </MobileCardFooter>
            </MobileCard>
          )}
        />
      </PageCard>

      {/* Pairing RFID Modal */}
      {showPairingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh]">
            <div className="p-5 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-foreground">Pairing RFID Baru</h3>
              </div>
              <button onClick={() => setShowPairingModal(false)} className="p-1 rounded-lg hover:bg-muted">&times;</button>
            </div>

            <form onSubmit={handlePairingSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-foreground">Pilih Santri *</label>
                <select
                  value={newSantriId}
                  onChange={(e) => setNewSantriId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold min-h-[44px]"
                >
                  {mockSantri.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.nis} - Kelas {s.kelas})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-foreground">Tap / Input Chip RFID UID *</label>
                <input
                  type="text"
                  value={newCardUid}
                  onChange={(e) => setNewCardUid(e.target.value)}
                  placeholder="Contoh: RFID-1007"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm font-mono font-bold min-h-[44px]"
                  required
                />
              </div>

              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
                Kartu RFID ini akan secara otomatis terhubung dengan Dompet Canteen POS dan Gate Checkpoint Terminal.
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPairingModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md min-h-[44px]"
                >
                  Simpan Pairing RFID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
