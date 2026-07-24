'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { CreditCard, Lock, QrCode, Search, CheckCircle2, ShieldOff } from 'lucide-react';
import { mockSantri } from '@/data/mock';

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
  const [toastMsg, setToastMsg] = useState('');

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

  const filtered = rows.filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) || r.nis.includes(search) || r.cardUid.includes(search)
  );

  return (
    <div className="space-y-6">
      <PageCard
        title="Kartu Identitas KTA & Manajemen RFID Santri"
        description="Pairing UID chip RFID, atur kode PIN keamanan, cetak KTA Smart Card, dan blokir kartu hilang secara instan"
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
              placeholder="Cari santri, NIS, atau RFID UID..."
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
                <th className="px-4 py-3">Chip RFID UID</th>
                <th className="px-4 py-3">Keamanan PIN</th>
                <th className="px-4 py-3">Status Kartu</th>
                <th className="px-4 py-3 text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((r) => (
                <tr key={r.santriId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-semibold text-foreground">{r.name}</div>
                      <div className="text-xs text-muted-foreground">NIS: {r.nis} | Kelas: {r.kelas}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                    {r.cardUid}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[11px] font-medium flex items-center gap-1 w-fit">
                      <Lock className="w-3 h-3" /> PIN Tersimpan
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'blocked' ? (
                      <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-semibold flex items-center gap-1 w-fit">
                        <ShieldOff className="w-3.5 h-3.5" /> Diblokir / Hilang
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => alert(`Cetak KTA Santri — ${r.name} (${r.cardUid})`)}
                        className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-xs font-medium flex items-center gap-1"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Cetak KTA
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleBlockCard(r.santriId)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          r.status === 'blocked'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {r.status === 'blocked' ? 'Aktifkan Kartu' : 'Blokir Kartu Hilang'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  );
}
