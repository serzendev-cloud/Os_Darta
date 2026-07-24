'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { LogOut, LogIn, Clock, AlertTriangle, CheckCircle2, RefreshCw, UserCheck, ShieldCheck } from 'lucide-react';

export default function GateCheckpointPage() {
  const [cardUid, setCardUid] = useState('RFID-1001');
  const [mode, setMode] = useState<'out' | 'in'>('out');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setResult(null);

    const endpoint = mode === 'out' ? '/api/gate/scan-out' : '/api/gate/scan-in';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardUid,
          tenantId: 'default',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Presensi gerbang gagal');
      } else {
        setResult(data.data);
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server Gate Checkpoint');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setErrorMsg('');
  };

  return (
    <div className="space-y-6">
      <PageCard
        title="Gate Checkpoint RFID — Terminal Presensi Izin Gerbang"
        description="Presensi Presisi Waktu Keluar, Waktu Kedatangan Tiba, Durasi Riil & Validasi Keterlambatan Izin Santri di Pos Gerbang"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gate Terminal Form */}
          <div className="p-6 rounded-2xl bg-muted/30 border border-border/60 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Terminal Satpam / Pos Gerbang</h3>
                  <p className="text-xs text-muted-foreground">Tap kartu RFID untuk scan keluar / masuk</p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-muted p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setMode('out'); handleReset(); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    mode === 'out' ? 'bg-amber-600 text-white' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" /> Scan Keluar
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('in'); handleReset(); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                    mode === 'in' ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" /> Scan Kedatangan
                </button>
              </div>
            </div>

            <form onSubmit={handleScan} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Tap Card UID RFID</label>
                <input
                  type="text"
                  value={cardUid}
                  onChange={(e) => setCardUid(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm font-mono"
                  placeholder="RFID-1001"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-muted-foreground font-medium">Tes Quick RFID:</span>
                <button
                  type="button"
                  onClick={() => setCardUid('RFID-1001')}
                  className="px-2 py-1 rounded-lg bg-muted text-[11px] hover:bg-muted/80 font-mono"
                >
                  RFID-1001 (Rizki)
                </button>
                <button
                  type="button"
                  onClick={() => setCardUid('RFID-1002')}
                  className="px-2 py-1 rounded-lg bg-muted text-[11px] hover:bg-muted/80 font-mono"
                >
                  RFID-1002 (Firdaus)
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 ${
                  mode === 'out' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {mode === 'out' ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                    {mode === 'out' ? 'Presensi Scan Keluar Gerbang' : 'Presensi Scan Tiba / Kedatangan'}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Result Display */}
          <div className="p-6 rounded-2xl bg-muted/20 border border-border/60 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Hasil Presensi Presisi Gerbang</h3>

              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    Presensi Ditolak!
                  </div>
                  <p className="text-xs leading-relaxed">{errorMsg}</p>
                </div>
              )}

              {result && (
                <div className="p-5 rounded-2xl bg-background border border-border space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className={`flex items-center gap-2 font-bold text-sm ${
                      result.isLate ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {result.isLate ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                      {mode === 'out' ? 'Presensi Keluar Berhasil' : (result.isLate ? 'Kedatangan Terlambat' : 'Kedatangan Tepat Waktu')}
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">
                      Notifikasi WA Sent
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center font-bold text-blue-600 text-lg">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{result.santriName}</h4>
                      <p className="text-xs text-muted-foreground">Kelas: {result.kelas} | Jenis Izin: {result.jenisIzin}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Jam Tap Keluar:
                      </span>
                      <span className="font-mono font-bold">
                        {new Date(result.checkOutTime).toLocaleTimeString('id-ID')}
                      </span>
                    </div>

                    {result.checkInTime && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Jam Tap Kedatangan:
                        </span>
                        <span className="font-mono font-bold text-emerald-600">
                          {new Date(result.checkInTime).toLocaleTimeString('id-ID')}
                        </span>
                      </div>
                    )}

                    {result.actualDurationMinutes !== undefined && (
                      <div className="flex justify-between items-center pt-1 border-t border-dashed border-border">
                        <span className="text-muted-foreground font-medium">Durasi Riil di Luar:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {result.actualDurationMinutes} Menit
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!errorMsg && !result && (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-2">
                  <Clock className="w-12 h-12 opacity-30" />
                  <p className="text-xs">Silakan tap kartu RFID santri untuk mencatat presensi waktu keluar atau waktu kedatangan tiba.</p>
                </div>
              )}
            </div>

            {(result || errorMsg) && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-6 w-full py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-medium text-xs transition-colors"
              >
                Scan Selanjutnya
              </button>
            )}
          </div>
        </div>
      </PageCard>
    </div>
  );
}
