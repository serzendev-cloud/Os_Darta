'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { Lock, Unlock, Sliders, CheckCircle2, XCircle, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { walletFreezeService, WalletFreezeState, FreezeDuration } from '@/lib/services/wallet-freeze-service';

export default function WaliDompetPage() {
  const [wallet, setWallet] = useState<WalletFreezeState>({
    santriId: 'santri-001',
    canteenStatus: 'requested_by_walikelas',
    freezeRequestedBy: 'Ustadz Ahmad (Wali Kelas 7A)',
    freezeRequestedAt: new Date().toISOString(),
    freezeReason: 'Santri terlalu sering belanja snack saat jam istirahat pertama',
  });

  const [selectedDuration, setSelectedDuration] = useState<FreezeDuration>('3_days');
  const [rejectReason, setRejectReason] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDirectFreezeModal, setShowDirectFreezeModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleApprove = () => {
    const updated = walletFreezeService.approveFreezeRequest(wallet, 'Bapak Wali Santri', selectedDuration);
    setWallet(updated);
    showToast(`Pengajuan freeze disetujui. Fitur belanja Uang Saku dibekukan (${selectedDuration}).`);
    setShowApproveModal(false);
  };

  const handleReject = () => {
    const updated = walletFreezeService.rejectFreezeRequest(wallet, 'Bapak Wali Santri', rejectReason);
    setWallet(updated);
    showToast('Pengajuan freeze dari Wali Kelas ditolak. Uang Saku tetap aktif.');
    setRejectReason('');
  };

  const handleDirectFreeze = () => {
    const updated = walletFreezeService.directFreezeByWaliSantri(
      wallet,
      'Bapak Wali Santri',
      selectedDuration,
      'Freeze langsung oleh orang tua'
    );
    setWallet(updated);
    showToast(`Uang Saku Santri berhasil dibekukan langsung (${selectedDuration}).`);
    setShowDirectFreezeModal(false);
  };

  const handleUnfreeze = () => {
    const updated = walletFreezeService.unfreezeByWaliSantri(wallet, 'Bapak Wali Santri');
    setWallet(updated);
    showToast('Fitur belanja Uang Saku Santri telah diaktifkan kembali.');
  };

  const isPending = wallet.canteenStatus === 'requested_by_walikelas';
  const isFrozen = wallet.canteenStatus === 'suspended_by_wali' || wallet.canteenStatus === 'suspended_by_walikelas';

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 sm:p-6">
      <PageCard
        title="Kontrol Dompet Uang Saku Santri — Wali Santri"
        description="Hak Otoritas Tertinggi: Atur pembekuan langsung, durasi freeze, dan tanggapi pengajuan dari Wali Kelas"
      >
        {toastMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            {toastMsg}
          </div>
        )}

        {/* Status Header Card */}
        <div className="p-5 rounded-2xl bg-muted/30 border border-border/80 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-base text-foreground">Ahmad Zaky (Santri 7A)</h3>
              <p className="text-xs text-muted-foreground mt-0.5">NIS: 202407001 | Status Uang Saku</p>
            </div>

            {isPending ? (
              <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> Pending Freeze Request
              </span>
            ) : isFrozen ? (
              <span className="px-3 py-1.5 rounded-full bg-red-500/10 text-red-600 text-xs font-bold flex items-center gap-1.5">
                <Lock className="w-4 h-4" /> Uang Saku Dibekukan
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold flex items-center gap-1.5">
                <Unlock className="w-4 h-4" /> Aktif Belanja
              </span>
            )}
          </div>

          {/* Pending Approval Card */}
          {isPending && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Pengajuan Freeze Uang Saku dari Wali Kelas</p>
                  <p className="mt-1">
                    <strong>Pemohon:</strong> {wallet.freezeRequestedBy}
                  </p>
                  <p>
                    <strong>Alasan:</strong> {wallet.freezeReason}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(true)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4" /> Setujui & Pilih Durasi
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <XCircle className="w-4 h-4" /> Tolak Pengajuan
                </button>
              </div>
            </div>
          )}

          {/* Direct Controls */}
          <div className="pt-2 flex items-center gap-3">
            {isFrozen ? (
              <button
                type="button"
                onClick={handleUnfreeze}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Unlock className="w-4 h-4" /> Aktifkan Kembali Uang Saku
              </button>
            ) : !isPending && (
              <button
                type="button"
                onClick={() => setShowDirectFreezeModal(true)}
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center justify-center gap-2 min-h-[44px]"
              >
                <ShieldAlert className="w-4 h-4" /> Freeze Uang Saku Langsung
              </button>
            )}
          </div>
        </div>

        {/* Modal Approval */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl border border-border p-6 max-w-sm w-full space-y-4 shadow-xl">
              <h3 className="font-bold text-base text-foreground">Setujui Pengajuan Freeze</h3>
              <p className="text-xs text-muted-foreground">
                Pilih durasi pembekuan Uang Saku untuk santri. Setelah durasi berakhir, status belanja akan otomatis diaktifkan kembali.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">Durasi Freeze</label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value as FreezeDuration)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-semibold min-h-[44px]"
                >
                  <option value="1_day">1 Hari</option>
                  <option value="3_days">3 Hari</option>
                  <option value="7_days">1 Minggu (7 Hari)</option>
                  <option value="permanent">Permanen (Sampai Diaktifkan Manual)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-muted text-xs font-bold min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold min-h-[44px]"
                >
                  Konfirmasi Setujui
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Direct Freeze */}
        {showDirectFreezeModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl border border-border p-6 max-w-sm w-full space-y-4 shadow-xl">
              <h3 className="font-bold text-base text-foreground">Freeze Uang Saku Langsung</h3>
              <p className="text-xs text-muted-foreground">
                Sebagai Wali Santri (Otoritas Tertinggi), Anda dapat membekukan Uang Saku santri langsung tanpa persetujuan pihak lain.
              </p>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-foreground">Pilih Durasi Freeze</label>
                <select
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value as FreezeDuration)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm font-semibold min-h-[44px]"
                >
                  <option value="1_day">1 Hari</option>
                  <option value="3_days">3 Hari</option>
                  <option value="7_days">1 Minggu (7 Hari)</option>
                  <option value="permanent">Permanen (Sampai Diaktifkan Manual)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDirectFreezeModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-muted text-xs font-bold min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDirectFreeze}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold min-h-[44px]"
                >
                  Bekukan Sekarang
                </button>
              </div>
            </div>
          </div>
        )}
      </PageCard>
    </div>
  );
}
