'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { PageHeader, PageCard } from '@/components/shared/page-header';
import { StatsCard } from '@/components/shared/stats-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { useCollection, useIsRole } from '@/hooks';
import { useAuthStore } from '@/store/auth-store';
import { healthPermissionService } from '@/lib/db/services';
import { createGovernanceEvent } from '@/lib/governance-events';
import {
  PERMISSION_STATUS_LABELS,
  HEALTH_SEVERITY_LABELS,
} from '@/lib/health-engine';
import { IzinBerobatModal } from '@/components/uks/IzinBerobatModal';
import { mockSantri } from '@/data/mock';
import type { HealthPermission } from '@/types/health';
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
import {
  FileText,
  Shield,
  MapPin,
  UserCheck,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Plus,
  Search,
  AlertCircle,
  Clock,
  Share2,
  Users,
  Power,
  Sparkles,
} from 'lucide-react';

// ── Severity color mapping ──────────────────────────────────────────────────
const SEVERITY_BADGE: Record<string, string> = {
  ringan:
    'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
  sedang:
    'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
  darurat:
    'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400 dark:border-red-500/30',
};

// ── Status variant mapping for StatusBadge ──────────────────────────────────
const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'error' | 'info' | 'neutral' | 'purple'> = {
  diajukan: 'warning',
  diteruskan_kesiswaan: 'info',
  disetujui: 'success',
  ditolak: 'error',
  dalam_perjalanan: 'purple',
  kembali: 'neutral',
  selesai: 'neutral',
};

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function IzinBerobatPage() {
  const user = useAuthStore((s) => s.user);

  // ── Tenant Feature Toggle ────────────────────────────────────────────────
  const [featureEnabled, setFeatureEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('mahad_feature_izin_berobat');
      if (stored === 'false') {
        setFeatureEnabled(false);
      }
    }
  }, []);

  const toggleFeature = () => {
    const nextState = !featureEnabled;
    setFeatureEnabled(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mahad_feature_izin_berobat', String(nextState));
    }
  };

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [detailItem, setDetailItem] = useState<HealthPermission | null>(null);

  // Companion selection modal state for Kepala Kesiswaan approval
  const [approveItem, setApproveItem] = useState<HealthPermission | null>(null);
  const [selectedCompanionId, setSelectedCompanionId] = useState<string>('');
  const [companionSearch, setCompanionSearch] = useState('');

  // ── Data ───────────────────────────────────────────────────────────────────
  const {
    data: permissions,
    loading,
    error,
  } = useCollection<HealthPermission>('healthPermissions');

  // ── RBAC Authority Matrix ─────────────────────────────────────────────────
  const canCreate = useIsRole(['admin', 'staff']);
  const canForward = useIsRole(['admin', 'wali_kelas']);
  const canApprove = useIsRole(['admin', 'kepala_kesiswaan']);
  const isTenantAdmin = user?.role === 'admin';

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return permissions.filter((p) => {
      const matchSearch =
        p.santriName.toLowerCase().includes(search.toLowerCase()) ||
        p.tujuanBerobat.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === 'all' || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [permissions, search, filterStatus]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pendingWaliKelas = permissions.filter((p) => p.status === 'diajukan').length;
    const pendingKesiswaan = permissions.filter((p) => p.status === 'diteruskan_kesiswaan').length;
    const dalamPerjalanan = permissions.filter((p) => p.status === 'dalam_perjalanan').length;
    const selesai = permissions.filter((p) => p.status === 'selesai' || p.status === 'disetujui').length;
    return { pendingWaliKelas, pendingKesiswaan, dalamPerjalanan, selesai };
  }, [permissions]);

  // ── Wali Kelas Forwarding Handler ──────────────────────────────────────────
  const handleForwardToKesiswaan = useCallback(
    async (perm: HealthPermission) => {
      if (!featureEnabled) return;
      try {
        await healthPermissionService.forwardToKesiswaan(
          perm.id,
          user?.id ?? '',
          user?.name ?? 'Wali Kelas',
        );

        createGovernanceEvent(
          'health:permission_requested',
          perm.santriId,
          perm.santriName,
          {
            permissionId: perm.id,
            forwardedBy: user?.name,
            priority: 'EMERGENCY',
            targetRole: 'kepala_kesiswaan',
          },
        );
      } catch (err) {
        console.error('Failed to forward permission:', err);
      }
    },
    [user, featureEnabled],
  );

  // ── Kepala Kesiswaan Approval (with Mandatory Companion Santri) ────────────
  const handleConfirmApproval = useCallback(async () => {
    if (!approveItem || !selectedCompanionId || !featureEnabled) return;
    const companion = mockSantri.find((s) => s.id === selectedCompanionId);
    if (!companion) return;

    try {
      await healthPermissionService.approve(
        approveItem.id,
        user?.id ?? '',
        user?.name ?? 'Kepala Kesiswaan',
        'Disetujui dengan santri pendamping',
        companion.id,
        companion.name,
      );

      createGovernanceEvent(
        'health:permission_approved',
        approveItem.santriId,
        approveItem.santriName,
        {
          permissionId: approveItem.id,
          companionSantriId: companion.id,
          companionSantriName: companion.name,
          approvedBy: user?.name,
        },
      );

      setApproveItem(null);
      setSelectedCompanionId('');
    } catch (err) {
      console.error('Failed to approve permission:', err);
    }
  }, [approveItem, selectedCompanionId, user, featureEnabled]);

  // ── Rejection Handler ──────────────────────────────────────────────────────
  const handleReject = useCallback(
    async (perm: HealthPermission) => {
      if (!featureEnabled) return;
      try {
        await healthPermissionService.reject(perm.id, user?.id ?? '', user?.name ?? '');

        createGovernanceEvent(
          'health:permission_rejected',
          perm.santriId,
          perm.santriName,
          {
            permissionId: perm.id,
            rejectedBy: user?.name,
          },
        );
      } catch (err) {
        console.error('Failed to reject permission:', err);
      }
    },
    [user, featureEnabled],
  );

  // ── Gate Handlers ──────────────────────────────────────────────────────────
  const handleDepart = useCallback(
    async (perm: HealthPermission) => {
      if (!featureEnabled) return;
      try {
        await healthPermissionService.depart(perm.id);
        createGovernanceEvent('health:permission_departed', perm.santriId, perm.santriName, {
          permissionId: perm.id,
        });
      } catch (err) {
        console.error('Failed to depart:', err);
      }
    },
    [featureEnabled],
  );

  const handleReturn = useCallback(
    async (perm: HealthPermission) => {
      if (!featureEnabled) return;
      try {
        await healthPermissionService.return(perm.id);
        createGovernanceEvent('health:permission_returned', perm.santriId, perm.santriName, {
          permissionId: perm.id,
        });
      } catch (err) {
        console.error('Failed to return:', err);
      }
    },
    [featureEnabled],
  );

  const handleComplete = useCallback(async (perm: HealthPermission) => {
    if (!featureEnabled) return;
    try {
      await healthPermissionService.complete(perm.id);
    } catch (err) {
      console.error('Failed to complete:', err);
    }
  }, [featureEnabled]);

  // Santri list for companion selection (excluding patient)
  const companionOptions = useMemo(() => {
    if (!approveItem) return mockSantri;
    return mockSantri.filter(
      (s) =>
        s.id !== approveItem.santriId &&
        s.name.toLowerCase().includes(companionSearch.toLowerCase()),
    );
  }, [approveItem, companionSearch]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Izin Berobat" description="Alur perizinan medis santri & pendamping" />
        <LoadingState type="stats" count={4} />
        <LoadingState type="table" count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Izin Berobat" description="Alur perizinan medis santri & pendamping" />
        <ErrorState message={error.message} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      {/* Header */}
      <PageHeader
        title="Izin Berobat Santri"
        description="Pusat Kontrol Perizinan Berobat: Staff UKS → Wali Kelas → Kepala Kesiswaan (Santri Pendamping)"
        action={
          canCreate && featureEnabled && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm active:scale-95 min-h-[44px]"
            >
              <Plus aria-hidden="true" className="w-4 h-4" />
              Buat Pengajuan Izin Berobat
            </button>
          )
        }
      />

      {/* Tenant Feature Toggle Banner */}
      {isTenantAdmin && (
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between flex-wrap gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${featureEnabled ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                Fitur Izin Berobat Tenant ({featureEnabled ? 'AKTIF' : 'NONAKTIF'})
              </h4>
              <p className="text-xs text-muted-foreground">
                {featureEnabled
                  ? 'Modul Izin Berobat aktif. Alur Wali Kelas & Kesiswaan dapat digunakan.'
                  : 'Modul Izin Berobat nonaktif untuk tenant ini. Pengajuan & persetujuan dikunci.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleFeature}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[44px] ${
              featureEnabled
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {featureEnabled ? 'Nonaktifkan Modul' : 'Aktifkan Modul'}
          </button>
        </div>
      )}

      {!featureEnabled && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <span>
            <strong>FITUR IZIN BEROBAT TIDAK AKTIF:</strong> Pengajuan dan proses persetujuan izin berobat sedang dinonaktifkan oleh administrator tenant ini.
          </span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Pending Wali Kelas"
          value={stats.pendingWaliKelas}
          icon={Clock}
          iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatsCard
          title="Forward Kesiswaan"
          value={stats.pendingKesiswaan}
          icon={Share2}
          iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <StatsCard
          title="Dalam Perjalanan"
          value={stats.dalamPerjalanan}
          icon={MapPin}
          iconClassName="bg-purple-500/10 text-purple-600 dark:text-purple-400"
        />
        <StatsCard
          title="Disetujui / Selesai"
          value={stats.selesai}
          icon={Shield}
          iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* Main Grid */}
      {permissions.length === 0 ? (
        <PageCard title="Daftar Izin Berobat" description="Belum ada izin berobat tercatat">
          <EmptyState
            icon={AlertCircle}
            title="Belum Ada Izin Berobat"
            description="Belum ada data pengajuan izin berobat di sistem."
            action={
              canCreate && featureEnabled
                ? {
                    label: 'Buat Pengajuan Izin Berobat',
                    onClick: () => setShowModal(true),
                  }
                : undefined
            }
          />
        </PageCard>
      ) : (
        <PageCard title="Daftar Izin Berobat" description={`${filtered.length} izin ditemukan`}>
          <ResponsiveFilterBar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari nama santri atau tujuan berobat..."
            activeFilterCount={filterStatus !== 'all' ? 1 : 0}
            onResetFilters={() => setFilterStatus('all')}
            filterContent={
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none min-h-[44px]"
              >
                <option value="all">Semua Status Workflow</option>
                <option value="diajukan">Pending Wali Kelas (Diajukan)</option>
                <option value="diteruskan_kesiswaan">Diteruskan ke Kesiswaan</option>
                <option value="disetujui">Disetujui Kesiswaan</option>
                <option value="ditolak">Ditolak</option>
                <option value="dalam_perjalanan">Dalam Perjalanan (Gate Scan)</option>
                <option value="kembali">Kembali (Tiba di Pondok)</option>
                <option value="selesai">Selesai</option>
              </select>
            }
          />

          <ResponsiveDataGrid
            data={filtered}
            keyExtractor={(p) => p.id}
            renderDesktop={() => (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground">
                      <th className="text-left px-4 py-3 font-semibold">Santri & Keluhan</th>
                      <th className="text-left px-4 py-3 font-semibold">Tujuan</th>
                      <th className="text-center px-4 py-3 font-semibold">Severity</th>
                      <th className="text-left px-4 py-3 font-semibold">Status Workflow</th>
                      <th className="text-left px-4 py-3 font-semibold">Pendamping Santri</th>
                      <th className="text-left px-4 py-3 font-semibold">Tanggal</th>
                      <th className="text-center px-4 py-3 font-semibold">Aksi Otorisasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((perm) => (
                      <tr key={perm.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => setDetailItem(perm)}
                            className="flex items-center gap-2.5 text-left group"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                              {perm.santriName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {perm.santriName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                {perm.keluhan}
                              </p>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            {perm.tujuanBerobat}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_BADGE[perm.severity] ?? ''}`}>
                            {HEALTH_SEVERITY_LABELS[perm.severity]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={PERMISSION_STATUS_LABELS[perm.status]}
                            variant={STATUS_VARIANT[perm.status]}
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {perm.companionSantriName ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20">
                              <Users className="w-3.5 h-3.5" />
                              {perm.companionSantriName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">Belum Ditentukan</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(perm.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {/* Step 2: Wali Kelas Forwarding */}
                            {perm.status === 'diajukan' && canForward && featureEnabled && (
                              <button
                                type="button"
                                onClick={() => handleForwardToKesiswaan(perm)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all min-h-[38px]"
                                title="Teruskan ke Kesiswaan"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Teruskan ke Kesiswaan</span>
                              </button>
                            )}

                            {/* Step 3: Kepala Kesiswaan Approval & Companion Selection */}
                            {(perm.status === 'diteruskan_kesiswaan' || (perm.status === 'diajukan' && user?.role === 'admin')) && canApprove && featureEnabled && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setApproveItem(perm)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all min-h-[38px]"
                                  title="Setujui & Pilih Pendamping"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Pilih Pendamping</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReject(perm)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-500 transition-all min-h-[38px]"
                                  title="Tolak"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* Gate Actions */}
                            {perm.status === 'disetujui' && featureEnabled && (
                              <button
                                type="button"
                                onClick={() => handleDepart(perm)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-all min-h-[38px]"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                Berangkat
                              </button>
                            )}

                            {perm.status === 'dalam_perjalanan' && featureEnabled && (
                              <button
                                type="button"
                                onClick={() => handleReturn(perm)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-amber-600 text-white rounded-xl hover:bg-amber-500 transition-all min-h-[38px]"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Kembali
                              </button>
                            )}

                            {perm.status === 'kembali' && featureEnabled && (
                              <button
                                type="button"
                                onClick={() => handleComplete(perm)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all min-h-[38px]"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Selesai
                              </button>
                            )}

                            {['selesai', 'ditolak'].includes(perm.status) && (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            renderMobile={(perm) => (
              <MobileCard key={perm.id}>
                <MobileCardHeader>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {perm.santriName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <MobileCardTitle>{perm.santriName}</MobileCardTitle>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${SEVERITY_BADGE[perm.severity] ?? ''}`}>
                    {HEALTH_SEVERITY_LABELS[perm.severity]}
                  </span>
                </MobileCardHeader>
                <MobileCardContent>
                  <div className="space-y-1.5 text-xs pt-1">
                    <p className="font-semibold text-foreground">Keluhan: {perm.keluhan}</p>
                    <p className="text-muted-foreground">Tujuan: {perm.tujuanBerobat}</p>
                    {perm.companionSantriName && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2 text-[11px]">
                        <Users className="w-3.5 h-3.5" />
                        <span>Pendamping: {perm.companionSantriName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-muted-foreground text-[11px] pt-1.5 border-t border-border/40">
                      <span>Ref: {perm.id.slice(0, 8)}</span>
                      <span>{formatDate(perm.createdAt)}</span>
                    </div>
                  </div>
                </MobileCardContent>
                <MobileCardFooter>
                  <StatusBadge
                    status={PERMISSION_STATUS_LABELS[perm.status]}
                    variant={STATUS_VARIANT[perm.status]}
                  />
                  <MobileRowActions
                    primaryAction={{
                      key: 'detail',
                      label: 'Detail',
                      icon: FileText,
                      onClick: () => setDetailItem(perm),
                    }}
                  />
                </MobileCardFooter>
              </MobileCard>
            )}
          />
        </PageCard>
      )}

      {/* Create Modal */}
      {showModal && (
        <IzinBerobatModal open={showModal} onClose={() => setShowModal(false)} />
      )}

      {/* Approval & Mandatory Santri Pendamping Selection Modal */}
      {approveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-border bg-gradient-to-r from-emerald-900/30 to-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground">Setujui Izin Berobat</h3>
                  <p className="text-xs text-muted-foreground">Wajib memilih Santri Pendamping untuk perjalanan medis</p>
                </div>
              </div>
              <button onClick={() => setApproveItem(null)} className="p-1 rounded-lg hover:bg-muted">&times;</button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border space-y-1 text-xs">
                <p className="font-bold text-foreground">Pasien: {approveItem.santriName}</p>
                <p className="text-muted-foreground">Tujuan Berobat: {approveItem.tujuanBerobat}</p>
                <p className="text-muted-foreground">Keluhan: {approveItem.keluhan}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>PILIH SANTRI PENDAMPING (WAJIB) *</span>
                </label>
                
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari santri pendamping..."
                    value={companionSearch}
                    onChange={(e) => setCompanionSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm min-h-[44px]"
                  />
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3.5" />
                </div>

                <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border">
                  {companionOptions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedCompanionId(s.id)}
                      className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        selectedCompanionId === s.id
                          ? 'bg-emerald-500/10 border-l-4 border-emerald-500 font-bold text-emerald-600 dark:text-emerald-400'
                          : 'hover:bg-muted/40 text-foreground'
                      }`}
                    >
                      <div>
                        <p className="font-bold">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground">NIS: {s.nis} | Kelas: {s.kelas}</p>
                      </div>
                      {selectedCompanionId === s.id && <Check className="w-4 h-4 text-emerald-600" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setApproveItem(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted min-h-[44px]"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={!selectedCompanionId}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-all shadow-md min-h-[44px]"
              >
                Konfirmasi Persetujuan & Pendamping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-base">Detail Izin Berobat</h3>
              <button onClick={() => setDetailItem(null)} className="p-1 rounded-lg hover:bg-muted">&times;</button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto text-xs">
              <div className="p-3 rounded-2xl bg-muted/30 border border-border space-y-1">
                <p className="font-bold text-sm text-foreground">{detailItem.santriName}</p>
                <p className="text-muted-foreground">Diajukan oleh: {detailItem.requestedByName}</p>
                {detailItem.forwardedByName && (
                  <p className="text-blue-600 font-semibold">Diteruskan oleh Wali Kelas: {detailItem.forwardedByName}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-0.5">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Tujuan</p>
                  <p className="font-semibold">{detailItem.tujuanBerobat}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/20 border border-border space-y-0.5">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Status Workflow</p>
                  <StatusBadge status={PERMISSION_STATUS_LABELS[detailItem.status]} variant={STATUS_VARIANT[detailItem.status]} />
                </div>
              </div>

              {detailItem.companionSantriName && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold space-y-1">
                  <p className="text-[10px] uppercase tracking-wider">Santri Pendamping Medis</p>
                  <p className="text-sm font-extrabold">{detailItem.companionSantriName}</p>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-muted/20 border border-border space-y-1">
                <p className="text-[10px] text-muted-foreground font-bold uppercase">Keluhan & Alasan</p>
                <p className="text-foreground">{detailItem.keluhan}</p>
                <p className="text-muted-foreground italic">{detailItem.alasan}</p>
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2.5 text-xs font-bold bg-muted hover:bg-muted/80 rounded-xl min-h-[44px]"
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
