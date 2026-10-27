'use client';

import { useState, useEffect } from 'react';
import {
  Camera,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  CheckCircle2,
  Clock,
  Search,
  Lock,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  timestamp: string;
  amount: number;
  status: string;
  vendorName: string;
  canteenId: string | null;
  itemsDescription: string;
  posCashierId: string;
  cardUid: string;
  santri: {
    id: string;
    name: string;
    nis: string;
    kelas: string;
    photoUrl: string | null;
  };
  audit: {
    correlationId: string;
    hasIdempotencyKey: boolean;
  };
  cctv: {
    isAvailable: boolean;
    cameraChannel: string;
    status: string;
    note: string;
  };
}

interface MerchantSummary {
  totalGrossSales: number;
  totalRefunds: number;
  netMerchantEntitlement: number;
  ledgerEntriesCount: number;
}

interface AuditLogEntry {
  id: string;
  correlationId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  targetId: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface AnomalyEntry {
  id: string;
  anomalyType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE';
  description: string;
  discrepancyAmount: number;
  createdAt: string;
}

interface RefundEntry {
  id: string;
  transactionId: string;
  santriId: string;
  originalAmount: number;
  refundAmount: number;
  reason: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  requestedByName: string;
  requestedAt: string;
}

export default function AuditCctvPage() {
  const [activeTab, setActiveTab] = useState<'cctv' | 'recon' | 'refunds' | 'audit'>('cctv');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [merchantSummary, setMerchantSummary] = useState<MerchantSummary>({
    totalGrossSales: 0,
    totalRefunds: 0,
    netMerchantEntitlement: 0,
    ledgerEntriesCount: 0,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEntry[]>([]);
  const [refunds, setRefunds] = useState<RefundEntry[]>([]);
  const [reconciling, setReconciling] = useState(false);
  const [reconMessage, setReconMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  // Load Timeline & Financial Data
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/audit-cctv/timeline');
      const json = await res.json();
      if (json.success && json.data) {
        setEvents(json.data.timelineEvents || []);
        setMerchantSummary(json.data.merchantSummary || {
          totalGrossSales: 0,
          totalRefunds: 0,
          netMerchantEntitlement: 0,
          ledgerEntriesCount: 0,
        });
        setAuditLogs(json.data.recentAuditLogs || []);
      }

      // Load Anomalies
      const reconRes = await fetch('/api/finance/reconciliation');
      const reconJson = await reconRes.json();
      if (reconJson.success && reconJson.data) {
        setAnomalies(reconJson.data.anomalies || []);
      }

      // Load Pending Refunds
      const refRes = await fetch('/api/canteen/refund');
      const refJson = await refRes.json();
      if (refJson.success && refJson.data) {
        setRefunds(refJson.data || []);
      }
    } catch (err) {
      console.error('Failed to load audit CCTV data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initialLoad = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/finance/audit-cctv/timeline');
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setEvents(json.data.timelineEvents || []);
          setMerchantSummary(json.data.merchantSummary || {
            totalGrossSales: 0,
            totalRefunds: 0,
            netMerchantEntitlement: 0,
            ledgerEntriesCount: 0,
          });
          setAuditLogs(json.data.recentAuditLogs || []);
        }

        const reconRes = await fetch('/api/finance/reconciliation');
        const reconJson = await reconRes.json();
        if (isMounted && reconJson.success && reconJson.data) {
          setAnomalies(reconJson.data.anomalies || []);
        }

        const refRes = await fetch('/api/canteen/refund');
        const refJson = await refRes.json();
        if (isMounted && refJson.success && refJson.data) {
          setRefunds(refJson.data || []);
        }
      } catch (err) {
        console.error('Failed to load audit CCTV data', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initialLoad();
    return () => {
      isMounted = false;
    };
  }, []);

  // Trigger Automated Reconciliation
  const handleRunReconciliation = async () => {
    setReconciling(true);
    setReconMessage(null);
    try {
      const res = await fetch('/api/finance/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', triggeredBy: 'admin_keuangan_ui', runType: 'MANUAL' }),
      });
      const json = await res.json();
      if (json.success) {
        setReconMessage(
          `Rekonsiliasi Selesai: ${json.data.totalTransactionsChecked} transaksi diperiksa. Ditemukan ${json.data.discrepanciesCount} anomali.`
        );
        loadData();
      } else {
        setReconMessage(`Gagal rekonsiliasi: ${json.message}`);
      }
    } catch {
      setReconMessage('Terjadi kesalahan saat memproses rekonsiliasi');
    } finally {
      setReconciling(false);
    }
  };

  // Review Refund (Admin Keuangan Gate)
  const handleReviewRefund = async (refundId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/canteen/refund/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundId,
          decision,
          reviewedByRole: 'admin_keuangan',
          reviewNotes: decision === 'APPROVE' ? 'Disetujui via Dashboard Audit' : 'Ditolak via Dashboard Audit',
        }),
      });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert(json.message);
      }
    } catch {
      alert('Gagal memproses review refund');
    }
  };

  const filteredEvents = events.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.santri.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.vendorName.toLowerCase().includes(q) ||
      e.cardUid.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl border border-indigo-500/20 shadow-xl text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Camera className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Audit Trail Keuangan & Digital CCTV</h1>
          </div>
          <p className="text-sm text-slate-300">
            Pengawasan real-time transaksi RFID, hak pendapatan merchant, verifikasi mutasi, dan jejak audit tamper-proof.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition border border-slate-700 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <button
            onClick={handleRunReconciliation}
            disabled={reconciling}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <ShieldCheck className={`w-4 h-4 ${reconciling ? 'animate-spin' : ''}`} />
            {reconciling ? 'Merekonsiliasi...' : 'Jalankan Rekonsiliasi Otomatis'}
          </button>
        </div>
      </div>

      {reconMessage && (
        <div className="p-4 bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 rounded-xl text-sm flex items-center justify-between">
          <span>{reconMessage}</span>
          <button onClick={() => setReconMessage(null)} className="text-xs text-indigo-400 hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-muted-foreground text-xs uppercase font-semibold">
            <span>Total Omzet Penjualan</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            Rp {merchantSummary.totalGrossSales.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-muted-foreground">Kredit penjualan merchant via RFID</p>
        </div>

        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-muted-foreground text-xs uppercase font-semibold">
            <span>Total Nilai Refund</span>
            <ArrowDownLeft className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            Rp {merchantSummary.totalRefunds.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-muted-foreground">Pengembalian ke saldo uang saku santri</p>
        </div>

        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-muted-foreground text-xs uppercase font-semibold">
            <span>Hak Bersih Merchant (Escrow)</span>
            <ArrowUpRight className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            Rp {merchantSummary.netMerchantEntitlement.toLocaleString('id-ID')}
          </div>
          <p className="text-xs text-muted-foreground">Tersimpan dalam rekening escrow terpusat</p>
        </div>

        <div className="bg-card border rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-muted-foreground text-xs uppercase font-semibold">
            <span>Kasus Anomali Aktif</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {anomalies.filter((a) => a.status === 'OPEN').length}
          </div>
          <p className="text-xs text-muted-foreground">Ketidaksesuaian terdeteksi rekonsiliasi</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('cctv')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === 'cctv'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Camera className="w-4 h-4" />
          Feed Digital CCTV ({events.length})
        </button>
        <button
          onClick={() => setActiveTab('recon')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === 'recon'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Kasus Anomali & Rekonsiliasi ({anomalies.length})
        </button>
        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === 'refunds'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4" />
          Persetujuan Refund ({refunds.filter((r) => r.status === 'PENDING_APPROVAL').length})
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lock className="w-4 h-4" />
          Jejak Audit Keuangan ({auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Digital CCTV Feed */}
      {activeTab === 'cctv' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari santri, transaksi ID, kartu RFID, atau kantin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Event CCTV Monitor Aktif
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="bg-card border rounded-2xl p-5 hover:border-indigo-500/50 hover:shadow-md transition cursor-pointer space-y-3 relative overflow-hidden group"
              >
                {/* Visual CCTV Feed Header */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Camera className="w-3.5 h-3.5 text-indigo-500" />
                    <span>POS CHANNEL #1</span>
                  </div>
                  <span>{new Date(evt.timestamp).toLocaleTimeString('id-ID')}</span>
                </div>

                {/* Santri & Transaction Details */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/20">
                    {evt.santri.name ? evt.santri.name.substring(0, 2).toUpperCase() : 'SN'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{evt.santri.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Kelas: {evt.santri.kelas} • NIS: {evt.santri.nis}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                      RFID: {evt.cardUid}
                    </p>
                  </div>
                </div>

                {/* Purchase Description */}
                <div className="p-3 bg-muted/50 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-medium">
                    <span className="truncate">{evt.itemsDescription}</span>
                    <span className="font-bold text-foreground">
                      Rp {evt.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground text-[11px]">
                    <span>{evt.vendorName}</span>
                    <span>Kasir: {evt.posCashierId}</span>
                  </div>
                </div>

                {/* Audit & Security Badges */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> SUCCESS
                  </span>
                  <span className="text-muted-foreground font-mono text-[10px]">
                    ID: {evt.id.substring(0, 14)}...
                  </span>
                </div>
              </div>
            ))}

            {filteredEvents.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground text-sm">
                Tidak ada rekaman transaksi yang sesuai filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Anomalies & Reconciliation */}
      {activeTab === 'recon' && (
        <div className="space-y-4">
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Kasus Anomali Keuangan
            </h3>
            <p className="text-sm text-muted-foreground">
              Daftar ketidaksesuaian yang terdeteksi antara transaksi RFID, mutasi dompet santri, dan hak pendapatan merchant.
            </p>

            <div className="divide-y border rounded-xl overflow-hidden">
              {anomalies.map((anom) => (
                <div key={anom.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          anom.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-600'
                            : anom.severity === 'HIGH'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-blue-500/10 text-blue-600'
                        }`}
                      >
                        {anom.severity}
                      </span>
                      <span className="font-semibold text-sm">{anom.anomalyType}</span>
                      <span className="text-xs text-muted-foreground">
                        ({new Date(anom.createdAt).toLocaleString('id-ID')})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{anom.description}</p>
                    <p className="text-xs font-mono text-rose-500">
                      Selisih: Rp {anom.discrepancyAmount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        anom.status === 'RESOLVED'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-rose-500/10 text-rose-600'
                      }`}
                    >
                      {anom.status}
                    </span>
                  </div>
                </div>
              ))}

              {anomalies.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  Seluruh saldo, transaksi, dan hak merchant berada dalam kondisi 100% konsisten.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Refund Approvals Queue */}
      {activeTab === 'refunds' && (
        <div className="space-y-4">
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Antrean Persetujuan Refund (Otoritas Admin Keuangan — Tahap 1)
            </h3>
            <p className="text-sm text-muted-foreground">
              PIC dan kasir hanya dapat mengajukan. Seluruh persetujuan refund wajib disetujui Admin Keuangan dan dana dikembalikan langsung ke saldo uang saku santri.
            </p>

            <div className="divide-y border rounded-xl overflow-hidden">
              {refunds.map((ref) => (
                <div key={ref.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">Ref ID: {ref.id}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        (Tx: {ref.transactionId})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Diajukan oleh: <span className="font-medium text-foreground">{ref.requestedByName}</span> • Alasan: {ref.reason}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                      Nilai Refund: Rp {ref.refundAmount.toLocaleString('id-ID')} (dari total Rp {ref.originalAmount.toLocaleString('id-ID')})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {ref.status === 'PENDING_APPROVAL' ? (
                      <>
                        <button
                          onClick={() => handleReviewRefund(ref.id, 'APPROVE')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                          Setujui Refund
                        </button>
                        <button
                          onClick={() => handleReviewRefund(ref.id, 'REJECT')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                          Tolak
                        </button>
                      </>
                    ) : (
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          ref.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}
                      >
                        {ref.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {refunds.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Tidak ada permohonan refund saat ini.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Financial Audit Trail */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-500" />
                  Append-Only Financial Audit Trail
                </h3>
                <p className="text-sm text-muted-foreground">
                  Seluruh perubahan saldo, mutasi, dan aksi keuangan dicatat secara permanen tanpa menyimpan kredensial atau PIN santri.
                </p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Zero-Credential Guarantee
              </span>
            </div>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-semibold border-b">
                  <tr>
                    <th className="p-3">Waktu</th>
                    <th className="p-3">Aktor</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Aksi</th>
                    <th className="p-3">Objek Target</th>
                    <th className="p-3">Nominal</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/40 transition">
                      <td className="p-3 font-mono text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td className="p-3 font-semibold">{log.actorName}</td>
                      <td className="p-3 text-muted-foreground">{log.actorRole}</td>
                      <td className="p-3 font-mono font-medium text-indigo-600 dark:text-indigo-400">
                        {log.action}
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">{log.targetEntity}</td>
                      <td className="p-3 font-semibold">
                        {log.amount > 0 ? `Rp ${log.amount.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-rose-500/10 text-rose-600'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        Belum ada jejak audit finansial tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Event CCTV */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b">
              <h4 className="font-bold text-base flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-500" />
                Detail Transaksi & Bukti Audit
              </h4>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-muted rounded-xl space-y-1 font-mono">
                <div>Transaction ID: {selectedEvent.id}</div>
                <div>Correlation ID: {selectedEvent.audit.correlationId}</div>
                <div>Timestamp: {new Date(selectedEvent.timestamp).toISOString()}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-xl">
                  <span className="text-muted-foreground block mb-1">Data Santri</span>
                  <div className="font-bold text-sm">{selectedEvent.santri.name}</div>
                  <div className="text-muted-foreground">Kelas: {selectedEvent.santri.kelas}</div>
                  <div className="text-muted-foreground font-mono">Card: {selectedEvent.cardUid}</div>
                </div>
                <div className="p-3 border rounded-xl">
                  <span className="text-muted-foreground block mb-1">Kasir & Kantin</span>
                  <div className="font-bold text-sm">{selectedEvent.vendorName}</div>
                  <div className="text-muted-foreground">ID Kasir: {selectedEvent.posCashierId}</div>
                  <div className="text-indigo-600 font-bold mt-1">
                    Rp {selectedEvent.amount.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-1">
                <span className="font-semibold text-indigo-400 block">Status CCTV Fisik:</span>
                <p className="text-muted-foreground text-[11px]">{selectedEvent.cctv.note}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
