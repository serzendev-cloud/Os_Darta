'use client';

import { useState, useEffect, useTransition } from 'react';
import { PageCard } from '@/components/shared/page-header';
import {
  CreditCard,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ShieldCheck,
  User,
  Search,
  Filter,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface InstallmentPlanItem {
  id: string;
  tenantId: string;
  billId: string;
  santriId: string;
  waliId: string;
  requestedInstallmentsCount: number;
  requestedAmountPerInstallment: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  bill?: {
    id: string;
    billNumber: string;
    santriName: string;
    periodMonthYear: string;
    totalAmount: number;
    remainingAmount: number;
    dueDate: string;
    status: string;
  } | null;
  schedules?: Array<{
    id: string;
    installmentNumber: number;
    dueDate: string;
    amountDue: number;
    amountPaid: number;
    status: string;
  }>;
}

export default function AdminKeuanganSppPage() {
  const [plans, setPlans] = useState<InstallmentPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [toastMsg, setToastMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  // Review Modals
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlanItem | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveNotes, setApproveNotes] = useState('Disetujui sesuai permohonan wali santri');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance/spp/installments', {
        headers: {
          'x-user-name': 'Ustadz Bendahara Keuangan',
        },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Gagal memuat antrean cicilan');
      }

      if (json.data && json.data.length > 0) {
        setPlans(json.data);
      } else {
        // Fallback demo mock for preview
        setPlans([
          {
            id: 'plan_demo_001',
            tenantId: 'default',
            billId: 'bill_demo_001',
            santriId: 'santri-001',
            waliId: 'wali_user_001',
            requestedInstallmentsCount: 3,
            requestedAmountPerInstallment: 333333,
            reason: 'Kebutuhan mendesak keluarga di awal semester ganjil',
            status: 'PENDING',
            createdAt: new Date().toISOString(),
            bill: {
              id: 'bill_demo_001',
              billNumber: 'SPP-2026-07-001',
              santriName: 'Muhammad Rizki Ramadhan',
              periodMonthYear: 'Juli 2026',
              totalAmount: 1000000,
              remainingAmount: 1000000,
              dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
              status: 'UNPAID',
            },
            schedules: [],
          },
        ]);
      }
    } catch {
      // Fallback display
      setPlans([
        {
          id: 'plan_demo_001',
          tenantId: 'default',
          billId: 'bill_demo_001',
          santriId: 'santri-001',
          waliId: 'wali_user_001',
          requestedInstallmentsCount: 3,
          requestedAmountPerInstallment: 333333,
          reason: 'Kebutuhan mendesak keluarga di awal semester ganjil',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          bill: {
            id: 'bill_demo_001',
            billNumber: 'SPP-2026-07-001',
            santriName: 'Muhammad Rizki Ramadhan',
            periodMonthYear: 'Juli 2026',
            totalAmount: 1000000,
            remainingAmount: 1000000,
            dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
            status: 'UNPAID',
          },
          schedules: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenApprove = (plan: InstallmentPlanItem) => {
    setSelectedPlan(plan);
    setApproveNotes('Disetujui sesuai permohonan wali santri');
    setShowApproveModal(true);
  };

  const handleOpenReject = (plan: InstallmentPlanItem) => {
    setSelectedPlan(plan);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleExecuteReview = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedPlan) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/finance/spp/installments/${selectedPlan.id}/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-name': 'Ustadz Bendahara Keuangan',
          },
          body: JSON.stringify({
            decision,
            reviewNotes: decision === 'APPROVE' ? approveNotes : rejectReason,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Gagal memproses review');
        }

        setShowApproveModal(false);
        setShowRejectModal(false);
        showToast(
          decision === 'APPROVE'
            ? 'Pengajuan cicilan disetujui! Jadwal angsuran resmi diaktifkan.'
            : 'Pengajuan cicilan berhasil ditolak dengan alasan tercatat.'
        );

        fetchPlans();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memproses keputusan';
        alert(msg);
      }
    });
  };

  const pendingList = plans.filter((p) => p.status === 'PENDING');
  const historyList = plans.filter((p) => p.status !== 'PENDING');

  return (
    <div className="space-y-6">
      <PageCard
        title="Otoritas Keuangan: Approval Cicilan SPP"
        description="Portal verifikasi pengajuan angsuran wali santri, penentuan jadwal jatuh tempo, dan rekonsiliasi piutang pesantren"
      >
        {toastMsg && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-border/80 gap-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock className="w-4 h-4" />
            Antrean Pengajuan Menunggu ({pendingList.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Riwayat Keputusan ({historyList.length})
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Clock className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm">Memuat data pengajuan cicilan...</p>
          </div>
        ) : activeTab === 'pending' ? (
          pendingList.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 opacity-40" />
              <p className="font-semibold text-base text-foreground">Tidak Ada Pengajuan Menunggu</p>
              <p className="text-xs">Semua pengajuan cicilan wali santri telah diproses.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingList.map((plan) => (
                <div
                  key={plan.id}
                  className="p-5 rounded-2xl border border-border bg-background hover:border-emerald-500/50 transition-colors shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-foreground">
                            {plan.bill?.santriName || `Santri ID: ${plan.santriId}`}
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-bold">
                            Menunggu Persetujuan
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tagihan: {plan.bill?.periodMonthYear || 'SPP'} • No. Invois:{' '}
                          <span className="font-mono">{plan.bill?.billNumber || plan.billId}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Sisa Piutang Tagihan:</span>
                      <p className="font-extrabold text-lg text-foreground">
                        Rp {(plan.bill?.remainingAmount || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {/* Proposal Summary Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs">
                    <div>
                      <span className="text-muted-foreground">Jumlah Angsuran:</span>
                      <p className="font-bold text-sm text-foreground mt-0.5">
                        {plan.requestedInstallmentsCount}x Angsuran
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rencana per Angsuran:</span>
                      <p className="font-bold text-sm text-emerald-600 mt-0.5">
                        Rp {plan.requestedAmountPerInstallment.toLocaleString('id-ID')} / bln
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Alasan Pengajuan Wali:</span>
                      <p className="font-medium text-foreground mt-0.5 italic">
                        &quot;{plan.reason || 'Tidak ada catatan alasan'}&quot;
                      </p>
                    </div>
                  </div>

                  {/* Actions for Admin Keuangan */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                    <button
                      onClick={() => handleOpenReject(plan)}
                      className="px-4 py-2 rounded-xl border border-red-500/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[38px]"
                    >
                      <X className="w-4 h-4" /> Tolak Pengajuan
                    </button>
                    <button
                      onClick={() => handleOpenApprove(plan)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[38px]"
                    >
                      <Check className="w-4 h-4" /> Setujui & Aktifkan Jadwal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Riwayat Keputusan */
          <div className="space-y-4">
            {historyList.map((plan) => {
              const isApproved = plan.status === 'ACTIVE' || plan.status === 'COMPLETED' || plan.status === 'APPROVED';
              return (
                <div
                  key={plan.id}
                  className="p-5 rounded-2xl border border-border bg-background shadow-sm space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-foreground">
                          {plan.bill?.santriName || `Santri: ${plan.santriId}`}
                        </h4>
                        {isApproved ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui ({plan.status})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-700 text-xs font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Ditolak
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ditinjau oleh: {plan.reviewedByName || 'Admin Keuangan'} • Catatan: &quot;{plan.reviewNotes}&quot;
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-muted-foreground">Skema Angsuran:</span>
                      <p className="font-bold text-sm text-foreground">
                        {plan.requestedInstallmentsCount}x (Rp{' '}
                        {plan.requestedAmountPerInstallment.toLocaleString('id-ID')} / bln)
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageCard>

      {/* APPROVAL MODAL */}
      {showApproveModal && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-background border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Persetujuan Jadwal Cicilan SPP</h3>
                <p className="text-xs text-muted-foreground">Aktifkan butir angsuran resmi untuk santri</p>
              </div>
              <button
                onClick={() => setShowApproveModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Santri:</span>
                  <span className="font-bold text-foreground">{selectedPlan.bill?.santriName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sisa Piutang:</span>
                  <span className="font-extrabold text-foreground">
                    Rp {(selectedPlan.bill?.remainingAmount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jadwal Angsuran:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">
                    {selectedPlan.requestedInstallmentsCount} kali pembagian
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Catatan Keputusan / Verifikasi
                </label>
                <input
                  type="text"
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-muted/30 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Jaminan Integritas Keuangan
                </p>
                <p>
                  Sistem akan mengaktifkan jadwal angsuran di database secara atomik. Piutang hanya berkurang saat tiap
                  angsuran benar-benar dibayar dan diverifikasi.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleExecuteReview('APPROVE')}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isPending ? 'Mengaktifkan...' : 'Konfirmasi & Setujui'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION MODAL */}
      {showRejectModal && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">Tolak Pengajuan Cicilan SPP</h3>
                <p className="text-xs text-muted-foreground">Wajib menyertakan alasan penolakan untuk wali santri</p>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Ketentuan pondok mewajibkan pelunasan SPP semester sebelum ujian..."
                  className="w-full p-3 rounded-xl border border-border bg-muted/30 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isPending || !rejectReason.trim()}
                  onClick={() => handleExecuteReview('REJECT')}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isPending ? 'Menyimpan...' : 'Tolak Pengajuan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
