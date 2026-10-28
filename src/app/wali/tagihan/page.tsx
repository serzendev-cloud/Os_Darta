'use client';

import { useState, useEffect, useTransition } from 'react';
import { PageCard } from '@/components/shared/page-header';
import {
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  HelpCircle,
  User,
  XCircle,
} from 'lucide-react';

interface InstallmentSchedule {
  id: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: number;
  amountPaid: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt?: string;
}

interface InstallmentPlan {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  requestedInstallmentsCount: number;
  requestedAmountPerInstallment: number;
  reason?: string;
  reviewNotes?: string;
}

interface SppBill {
  id: string;
  billNumber: string;
  santriId: string;
  santriName: string;
  periodMonthYear: string;
  billType: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  allowInstallments?: boolean;
  installmentPlan?: InstallmentPlan | null;
  installmentSchedules?: InstallmentSchedule[];
}

export default function WaliTagihanPage() {
  const [bills, setBills] = useState<SppBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Modals state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDirectPayModal, setShowDirectPayModal] = useState(false);
  const [showSchedulePayModal, setShowSchedulePayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<SppBill | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<InstallmentSchedule | null>(null);

  // Form state for applying installment
  const [installmentCount, setInstallmentCount] = useState(3);
  const [applyReason, setApplyReason] = useState('');
  const [isSubmitting, startTransition] = useTransition();

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/wali/spp/bills', {
        headers: {
          'x-wali-id': 'wali_user_001',
          'x-tenant-id': 'default',
        },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memuat data tagihan');
      }

      if (json.data && json.data.length > 0) {
        setBills(json.data);
      } else {
        // Fallback demo mock if DB is empty for initial testing
        setBills([
          {
            id: 'bill_demo_001',
            billNumber: 'SPP-2026-07-001',
            santriId: 'santri-001',
            santriName: 'Muhammad Rizki Ramadhan',
            periodMonthYear: 'Juli 2026',
            billType: 'SPP Bulanan & Asrama',
            totalAmount: 1000000,
            paidAmount: 0,
            remainingAmount: 1000000,
            dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
            status: 'UNPAID',
            installmentPlan: null,
            installmentSchedules: [],
          },
        ]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat tagihan SPP';
      setErrorMsg(msg);
      // Fallback display
      setBills([
        {
          id: 'bill_demo_001',
          billNumber: 'SPP-2026-07-001',
          santriId: 'santri-001',
          santriName: 'Muhammad Rizki Ramadhan',
          periodMonthYear: 'Juli 2026',
          billType: 'SPP Bulanan & Asrama',
          totalAmount: 1000000,
          paidAmount: 0,
          remainingAmount: 1000000,
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
          status: 'UNPAID',
          installmentPlan: null,
          installmentSchedules: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleOpenApplyModal = (bill: SppBill) => {
    setSelectedBill(bill);
    setInstallmentCount(3);
    setApplyReason('');
    setShowApplyModal(true);
  };

  const handleOpenDirectPayModal = (bill: SppBill) => {
    setSelectedBill(bill);
    setShowDirectPayModal(true);
  };

  const handleOpenSchedulePayModal = (bill: SppBill, schedule: InstallmentSchedule) => {
    setSelectedBill(bill);
    setSelectedSchedule(schedule);
    setShowSchedulePayModal(true);
  };

  const handleSubmitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    startTransition(async () => {
      try {
        const amountPerMonth = Math.floor(selectedBill.remainingAmount / installmentCount);
        const res = await fetch('/api/wali/spp/installments/apply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-wali-id': 'wali_user_001',
            'x-user-name': 'Ahmad Fauzi (Wali Santri)',
            'x-tenant-id': 'default',
          },
          body: JSON.stringify({
            billId: selectedBill.id,
            santriId: selectedBill.santriId,
            requestedInstallmentsCount: installmentCount,
            requestedAmountPerInstallment: amountPerMonth,
            reason: applyReason,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Gagal mengajukan cicilan');
        }

        setShowApplyModal(false);
        showNotification('Pengajuan cicilan berhasil dikirim! Menunggu persetujuan Admin Keuangan.');
        
        // Optimistic update
        setBills((prev) =>
          prev.map((b) =>
            b.id === selectedBill.id
              ? {
                  ...b,
                  installmentPlan: {
                    id: data.plan?.id || 'plan_new',
                    status: 'PENDING',
                    requestedInstallmentsCount: installmentCount,
                    requestedAmountPerInstallment: amountPerMonth,
                    reason: applyReason,
                  },
                }
              : b
          )
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal mengirim pengajuan';
        alert(msg);
      }
    });
  };

  // Direct / Installment payment confirmation action (admin simulation/gateway)
  const handleConfirmPayment = async (scheduleId?: string, paymentAmount?: number) => {
    if (!selectedBill) return;
    const amount = paymentAmount || selectedBill.remainingAmount;

    startTransition(async () => {
      try {
        const res = await fetch('/api/finance/spp/pay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'admin_keuangan_001',
            'x-user-name': 'Ustadz Bendahara Keuangan',
            'x-tenant-id': 'default',
          },
          body: JSON.stringify({
            billId: selectedBill.id,
            scheduleId: scheduleId || null,
            amount,
            paymentMethod: 'TRANSFER_MANUAL',
            idempotencyKey: `pay_idem_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            notes: 'Pembayaran SPP terverifikasi oleh Admin Keuangan',
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Gagal memproses pembayaran');
        }

        setShowDirectPayModal(false);
        setShowSchedulePayModal(false);
        showNotification(data.message || 'Pembayaran berhasil diverifikasi!');
        fetchBills();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Pembayaran gagal';
        alert(msg);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 pb-24">
      {/* Page Header */}
      <PageCard
        title="Tagihan SPP & Rencana Pembayaran"
        description="Pusat informasi pembayaran uang sekolah, pelunasan langsung, dan pengajuan angsuran dengan approval resmi pondok"
      >
        {successToast && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Clock className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm">Memuat data tagihan SPP santri...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 opacity-60" />
            <p className="font-semibold text-base text-foreground">Tidak Ada Tagihan Aktif</p>
            <p className="text-xs max-w-sm">
              Alhamdulillah, seluruh kewajiban SPP santri telah terpenuhi untuk periode ini.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {bills.map((bill) => {
              const plan = bill.installmentPlan;
              const hasActivePlan = Boolean(plan && plan.status === 'ACTIVE');
              const hasPendingPlan = Boolean(plan && plan.status === 'PENDING');
              const isRejectedPlan = Boolean(plan && plan.status === 'REJECTED');
              const isLunas = bill.status === 'PAID';

              return (
                <div
                  key={bill.id}
                  className="rounded-2xl border border-border/80 bg-background overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Top Card Banner */}
                  <div className="p-4 sm:p-5 bg-muted/40 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-foreground">{bill.santriName}</h3>
                        <p className="text-xs text-muted-foreground">
                          ID: {bill.santriId} • No. Tagihan: <span className="font-mono">{bill.billNumber}</span>
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isLunas ? (
                        <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Lunas Terverifikasi
                        </span>
                      ) : bill.status === 'PARTIALLY_PAID' ? (
                        <span className="px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center gap-1.5">
                          <Clock className="w-4 h-4" /> Sebagian Terbayar
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" /> Belum Lunas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bill Details Grid */}
                  <div className="p-5 sm:p-6 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50">
                        <span className="text-xs text-muted-foreground">Periode & Jenis</span>
                        <p className="font-bold text-sm text-foreground mt-0.5">{bill.periodMonthYear}</p>
                        <span className="text-[11px] text-muted-foreground">{bill.billType}</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50">
                        <span className="text-xs text-muted-foreground">Nominal Tagihan</span>
                        <p className="font-bold text-sm text-foreground mt-0.5">
                          Rp {bill.totalAmount.toLocaleString('id-ID')}
                        </p>
                        <span className="text-[11px] text-muted-foreground">Total kewajiban</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50">
                        <span className="text-xs text-muted-foreground">Telah Diterima</span>
                        <p className="font-bold text-sm text-emerald-600 mt-0.5">
                          Rp {bill.paidAmount.toLocaleString('id-ID')}
                        </p>
                        <span className="text-[11px] text-muted-foreground">Pembayaran sah</span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <span className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                          Sisa Tagihan (Piutang)
                        </span>
                        <p className="font-extrabold text-base text-emerald-700 dark:text-emerald-300 mt-0.5">
                          Rp {bill.remainingAmount.toLocaleString('id-ID')}
                        </p>
                        <span className="text-[11px] text-muted-foreground">
                          Tempo: {new Date(bill.dueDate).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Pending Proposal Banner */}
                    {hasPendingPlan && plan && (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-amber-800 dark:text-amber-300">
                            Pengajuan Cicilan Sedang Menunggu Persetujuan Admin Keuangan
                          </h4>
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            Anda mengajukan rencana angsuran sebanyak {plan.requestedInstallmentsCount}x (Rp{' '}
                            {plan.requestedAmountPerInstallment.toLocaleString('id-ID')} / bulan).
                            Jadwal angsuran belum aktif dan piutang belum berkurang sebelum diverifikasi oleh Admin Keuangan.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Rejected Proposal Banner */}
                    {isRejectedPlan && plan && (
                      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-red-800 dark:text-red-300">
                            Pengajuan Cicilan Ditolak oleh Admin Keuangan
                          </h4>
                          <p className="text-xs text-red-700 dark:text-red-400">
                            Alasan: &quot;{plan.reviewNotes || 'Belum memenuhi kriteria penundaan SPP'}&quot;. Anda dapat
                            melakukan pembayaran langsung atau mengajukan ulang rencana baru.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Active Installment Schedules Card */}
                    {hasActivePlan && bill.installmentSchedules && bill.installmentSchedules.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-border/60">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-600" />
                            Jadwal Angsuran Aktif (Disetujui Admin Keuangan)
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {bill.installmentSchedules.filter((s) => s.status === 'PAID').length} dari{' '}
                            {bill.installmentSchedules.length} angsuran lunas
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {bill.installmentSchedules.map((schedule) => {
                            const isSchedulePaid = schedule.status === 'PAID';
                            return (
                              <div
                                key={schedule.id}
                                className={`p-4 rounded-xl border transition-all ${
                                  isSchedulePaid
                                    ? 'bg-muted/30 border-border/60'
                                    : 'bg-background border-emerald-500/40 shadow-sm'
                                }`}
                              >
                                <div className="flex items-center justify-between text-xs mb-2">
                                  <span className="font-bold text-foreground">
                                    Angsuran #{schedule.installmentNumber}
                                  </span>
                                  {isSchedulePaid ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Lunas
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-bold text-[10px]">
                                      Menunggu Bayar
                                    </span>
                                  )}
                                </div>

                                <p className="font-extrabold text-base text-foreground">
                                  Rp {schedule.amountDue.toLocaleString('id-ID')}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Tempo:{' '}
                                  {new Date(schedule.dueDate).toLocaleDateString('id-ID')}
                                </p>

                                {!isSchedulePaid && (
                                  <button
                                    onClick={() => handleOpenSchedulePayModal(bill, schedule)}
                                    className="mt-3 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 min-h-[38px]"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" /> Bayar Angsuran #{schedule.installmentNumber}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons: Bayar Langsung vs Ajukan Cicilan */}
                    {!isLunas && (
                      <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center gap-3">
                        {/* Option 1: Bayar Langsung */}
                        <button
                          onClick={() => handleOpenDirectPayModal(bill)}
                          className="w-full sm:w-1/2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors min-h-[44px]"
                        >
                          <CreditCard className="w-4 h-4" />
                          Bayar Langsung (Penuh)
                        </button>

                        {/* Option 2: Ajukan Cicilan */}
                        {bill.allowInstallments === false ? (
                          <div className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-muted/40 border border-border/60 text-muted-foreground text-xs text-center flex items-center justify-center gap-1.5 font-medium">
                            <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                            Cicilan Tidak Tersedia Untuk Tagihan Ini
                          </div>
                        ) : (
                          <button
                            disabled={hasPendingPlan || hasActivePlan}
                            onClick={() => handleOpenApplyModal(bill)}
                            className="w-full sm:w-1/2 py-3.5 px-4 rounded-xl border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                          >
                            <FileText className="w-4 h-4" />
                            {hasPendingPlan
                              ? 'Menunggu Persetujuan Cicilan'
                              : hasActivePlan
                              ? 'Jadwal Cicilan Aktif'
                              : 'Ajukan Cicilan SPP'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageCard>

      {/* MODAL 1: Ajukan Cicilan */}
      {showApplyModal && selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-background border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Ajukan Rencana Cicilan SPP</h3>
                <p className="text-xs text-muted-foreground">Wajib mendapatkan verifikasi dan persetujuan Admin Keuangan</p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitApply} className="p-5 space-y-4">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Santri:</span>
                  <span className="font-semibold text-foreground">{selectedBill.santriName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sisa Tagihan yang Dicicil:</span>
                  <span className="font-extrabold text-foreground">
                    Rp {selectedBill.remainingAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Installment Choice */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Pilih Jumlah Kali Angsuran</label>
                <div className="grid grid-cols-3 gap-2">
                  {[2, 3, 4].map((count) => {
                    const estAmount = Math.floor(selectedBill.remainingAmount / count);
                    return (
                      <button
                        type="button"
                        key={count}
                        onClick={() => setInstallmentCount(count)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          installmentCount === count
                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold ring-2 ring-emerald-500/20'
                            : 'border-border hover:bg-muted/30 text-muted-foreground'
                        }`}
                      >
                        <div className="text-sm font-extrabold">{count}x Angsuran</div>
                        <div className="text-[11px] mt-0.5">~Rp {estAmount.toLocaleString('id-ID')}/bln</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Alasan Pengajuan Cicilan <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={applyReason}
                  onChange={(e) => setApplyReason(e.target.value)}
                  placeholder="Contoh: Mengajukan angsuran bulanan karena ada kebutuhan keluarga mendesak..."
                  className="w-full p-3 rounded-xl border border-border bg-muted/30 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Informational Notice */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Ketentuan Pengajuan
                </p>
                <p>
                  Pengajuan cicilan tidak otomatis melunasi tagihan atau mengurangi piutang sampai disetujui secara sah
                  oleh Admin Keuangan.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !applyReason.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan Cicilan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Bayar Langsung */}
      {showDirectPayModal && selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Konfirmasi Pembayaran Langsung</h3>
                <p className="text-xs text-muted-foreground">Pelunasan penuh tagihan SPP santri</p>
              </div>
              <button
                onClick={() => setShowDirectPayModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                <span className="text-xs text-muted-foreground">Total Nominal Pelunasan</span>
                <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  Rp {selectedBill.remainingAmount.toLocaleString('id-ID')}
                </p>
                <span className="text-xs text-muted-foreground">{selectedBill.santriName}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode Bayar:</span>
                  <span className="font-semibold">Transfer Rekening Bendahara Pondok</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status Verifikasi:</span>
                  <span className="font-semibold text-emerald-600">Otomatis / Kasir Verifikasi</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground text-center">
                Tagihan hanya dinyatakan lunas setelah dana terverifikasi masuk ke pembukuan resmi pesantren.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDirectPayModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirmPayment()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi Pelunasan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Bayar Butir Angsuran */}
      {showSchedulePayModal && selectedBill && selectedSchedule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Bayar Angsuran #{selectedSchedule.installmentNumber}
                </h3>
                <p className="text-xs text-muted-foreground">Pembayaran bertahap sesuai jadwal resmi</p>
              </div>
              <button
                onClick={() => setShowSchedulePayModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                <span className="text-xs text-muted-foreground">
                  Nominal Angsuran #{selectedSchedule.installmentNumber}
                </span>
                <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  Rp {selectedSchedule.amountDue.toLocaleString('id-ID')}
                </p>
                <span className="text-xs text-muted-foreground">
                  Jatuh Tempo: {new Date(selectedSchedule.dueDate).toLocaleDateString('id-ID')}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSchedulePayModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirmPayment(selectedSchedule.id, selectedSchedule.amountDue)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isSubmitting ? 'Memproses...' : 'Konfirmasi Bayar Angsuran'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
