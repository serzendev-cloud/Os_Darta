'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  LogOut, LogIn, Clock, AlertTriangle, CheckCircle2, RefreshCw, 
  UserCheck, ShieldCheck, Users, MapPin, Radio, Key
} from 'lucide-react';

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
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-10">
      <PageCard
        title="Gate Checkpoint RFID — Terminal Presensi Gerbang"
        description="Pusat Otorisasi Presensi Gerbang: Validasi RFID, Keluar/Masuk Santri, & Monitoring Pendamping Medis"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gate Terminal Form */}
          <div className="p-5 sm:p-6 rounded-3xl bg-muted/30 border border-border space-y-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">Terminal Satpam Pos Gerbang</h3>
                    <p className="text-xs text-muted-foreground">Tap chip RFID KTA santri untuk scan keluar/masuk</p>
                  </div>
                </div>

                {/* Mode Toggle Tabs (Touch Target >= 44px) */}
                <div className="flex bg-muted p-1 rounded-2xl border border-border w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => { setMode('out'); handleReset(); }}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                      mode === 'out' 
                        ? 'bg-amber-600 text-white shadow-md' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Scan Keluar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('in'); handleReset(); }}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                      mode === 'in' 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Scan Kedatangan</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleScan} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-emerald-600" />
                    <span>TAP CARD UID RFID SANTRI</span>
                  </label>
                  <input
                    type="text"
                    value={cardUid}
                    onChange={(e) => setCardUid(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-base font-mono font-bold focus:ring-2 focus:ring-primary min-h-[48px]"
                    placeholder="RFID-1001"
                    required
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3.5 h-3.5" /> Quick Test Terminal RFID:
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setCardUid('RFID-1001')}
                      className="px-3 py-2 rounded-xl bg-muted text-xs hover:bg-muted/80 font-mono font-bold border border-border min-h-[44px] active:scale-95 transition-all"
                    >
                      RFID-1001 (Rizki)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardUid('RFID-1002')}
                      className="px-3 py-2 rounded-xl bg-muted text-xs hover:bg-muted/80 font-mono font-bold border border-border min-h-[44px] active:scale-95 transition-all"
                    >
                      RFID-1002 (Firdaus)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-2xl text-white font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-95 disabled:opacity-50 min-h-[52px] ${
                    mode === 'out' 
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {mode === 'out' ? <LogOut className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                      <span>{mode === 'out' ? 'PROSES SCAN KELUAR GERBANG' : 'PROSES SCAN KEDATANGAN TIBA'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="pt-4 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Terminal Mode: {mode === 'out' ? 'GATE EXIT' : 'GATE ENTER'}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">ONLINE</span>
            </div>
          </div>

          {/* Result Display Panel */}
          <div className="p-5 sm:p-6 rounded-3xl bg-muted/20 border border-border flex flex-col justify-between shadow-sm min-h-[380px]">
            <div>
              <h3 className="font-extrabold text-sm text-foreground mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Hasil Otorisasi & Validasi Gerbang</span>
              </h3>

              {errorMsg && (
                <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 font-extrabold text-sm">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <span>Presensi Ditolak / Akses Dibatasi!</span>
                  </div>
                  <p className="text-xs font-medium leading-relaxed">{errorMsg}</p>
                </div>
              )}

              {result && (
                <div className="p-5 rounded-2xl bg-background border border-border space-y-4 shadow-md animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
                    <div className={`flex items-center gap-2 font-extrabold text-sm ${
                      result.isLate ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {result.isLate ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
                      <span>{mode === 'out' ? 'Presensi Keluar Berhasil' : (result.isLate ? 'Kedatangan Terlambat' : 'Kedatangan Tepat Waktu')}</span>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">
                      TERVERIFIKASI
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center font-extrabold text-primary text-base shrink-0 border border-primary/20">
                      {result.santriName ? result.santriName.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : 'ST'}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-foreground">{result.santriName}</h4>
                      <p className="text-xs text-muted-foreground font-medium">
                        Kelas: {result.kelas || 'I' } | Jenis Izin: {result.jenisIzin || 'Izin Keluar'}
                      </p>
                    </div>
                  </div>

                  {/* WP-UI-020E-1B Companion Santri Display */}
                  {(result.companionSantriName || result.supervisorName) && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold space-y-1">
                      <div className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                        <Users className="w-3.5 h-3.5" />
                        <span>Pendamping Medis Terdaftar:</span>
                      </div>
                      <p className="text-sm font-extrabold">{result.companionSantriName || result.supervisorName}</p>
                    </div>
                  )}

                  <div className="space-y-2 pt-3 border-t border-border text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Jam Tap Keluar:
                      </span>
                      <span className="font-mono font-extrabold text-foreground">
                        {new Date(result.checkOutTime).toLocaleTimeString('id-ID')}
                      </span>
                    </div>

                    {result.checkInTime && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" /> Jam Tap Kedatangan:
                        </span>
                        <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          {new Date(result.checkInTime).toLocaleTimeString('id-ID')}
                        </span>
                      </div>
                    )}

                    {result.actualDurationMinutes !== undefined && (
                      <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-border">
                        <span className="text-muted-foreground font-medium">Durasi Riil di Luar:</span>
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                          {result.actualDurationMinutes} Menit
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!errorMsg && !result && (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
                  <div className="p-4 rounded-full bg-muted border border-border">
                    <Clock className="w-10 h-10 opacity-40 text-muted-foreground" />
                  </div>
                  <div className="max-w-xs space-y-1">
                    <p className="text-xs font-extrabold text-foreground">Terminal Siap Menerima Scan</p>
                    <p className="text-[11px] text-muted-foreground">
                      Silakan tap kartu RFID santri untuk mencatat presensi keluar atau waktu kedatangan di pos gerbang.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {(result || errorMsg) && (
              <button
                type="button"
                onClick={handleReset}
                className="mt-6 w-full py-3 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-extrabold text-xs transition-all border border-border min-h-[44px] active:scale-95"
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
