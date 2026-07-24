'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks';
import { useCollection } from '@/hooks';
import { StatsCard } from '@/components/shared/stats-card';
import { PageHeader, PageCard } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { AnalyticsCard } from '@/components/shared/analytics-card';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { DashboardShell } from '@/components/shared/dashboard-shell';
import type { Santri, Pelanggaran, Quest, Hukuman, Asrama, Notification } from '@/types';
import type { HealthVisit } from '@/types/health';
import {
  Users, Building2, AlertTriangle, Trophy, Shield,
  Activity, GraduationCap, Star, Clock, CheckCircle,
  ClipboardCheck, School, Briefcase, BookOpen, Stethoscope
} from 'lucide-react';

// ─── ADMIN VIEW ────────────────────────────────────────────────
function AdminDashboard() {
  const { data: santri, loading: loadingSantri, error: errorSantri } = useCollection<Santri>('santri');
  const { data: pelanggaran, loading: loadingPelanggaran, error: errorPelanggaran } = useCollection<Pelanggaran>('pelanggaran');
  const { data: quest, loading: loadingQuest, error: errorQuest } = useCollection<Quest>('quest');
  const { data: asrama, loading: loadingAsrama, error: errorAsrama } = useCollection<Asrama>('asrama');
  const { data: hukuman, loading: loadingHukuman } = useCollection<Hukuman>('hukuman');
  const { data: notifications } = useCollection<Notification>('notifications');
  const { data: healthVisits, loading: loadingHealth } = useCollection<HealthVisit>('healthVisits');

  const loading = loadingSantri || loadingPelanggaran || loadingQuest || loadingAsrama || loadingHukuman || loadingHealth;
  const error = errorSantri || errorPelanggaran || errorQuest || errorAsrama;

  const stats = useMemo(() => ({
    totalSantri: santri.length,
    santriAktif: santri.filter(s => s.status === 'aktif').length,
    totalPelanggaran: pelanggaran.length,
    pelanggaranPending: 0, // Pending now tracked via GovernanceCase collection
    pelanggaranConfirmed: pelanggaran.filter(p => p.status === 'confirmed').length,
    questAktif: quest.filter(q => q.status === 'inProgress' || q.status === 'available').length,
    questSelesai: quest.filter(q => q.status === 'completed').length,
    asramaAktif: asrama.filter(a => a.status === 'aktif').length,
    hukumanAktif: hukuman.filter(h => h.status === 'aktif').length,
    notifUnread: notifications.filter(n => !n.read).length,
    uksHariIni: healthVisits.filter(v => v.masukAt && v.masukAt.startsWith(new Date().toISOString().split('T')[0])).length,
    dalamObservasi: healthVisits.filter(v => v.status === 'observasi' || v.status === 'rawat_sementara').length,
  }), [santri, pelanggaran, quest, asrama, hukuman, notifications, healthVisits]);

  // Compute analytics from real data
  const { severityChart, questChart, santriTopViolations } = useMemo(() => {
    // Severity breakdown from real pelanggaran
    const severities: Record<string, number> = { ringan: 0, sedang: 0, berat: 0, sangat_berat: 0 };
    pelanggaran.forEach(p => { if (p.severity) severities[p.severity] = (severities[p.severity] || 0) + 1; });
    const severityChart = [
      { label: 'Ringan', value: severities.ringan || 0, color: 'bg-amber-500' },
      { label: 'Sedang', value: severities.sedang || 0, color: 'bg-orange-500' },
      { label: 'Berat', value: severities.berat || 0, color: 'bg-red-500' },
      { label: 'Sgt Berat', value: severities.sangat_berat || 0, color: 'bg-red-700' },
    ];

    // Quest status breakdown
    const questCompleted = quest.filter(q => q.status === 'completed').length;
    const questInProgress = quest.filter(q => q.status === 'inProgress').length;
    const questAvailable = quest.filter(q => q.status === 'available').length;
    const questChart = [
      { label: 'Tersedia', value: questAvailable, color: 'bg-blue-500' },
      { label: 'Berjalan', value: questInProgress, color: 'bg-amber-500' },
      { label: 'Selesai', value: questCompleted, color: 'bg-emerald-500' },
    ];

    // Top santri by violation points
    const santriTopViolations = [...santri]
      .sort((a, b) => b.totalPoinPelanggaran - a.totalPoinPelanggaran)
      .slice(0, 5)
      .map(s => ({
        label: s.name.split(' ')[0],
        value: s.totalPoinPelanggaran,
        color: s.totalPoinPelanggaran > 40 ? 'bg-red-500' : s.totalPoinPelanggaran > 20 ? 'bg-amber-500' : 'bg-emerald-500'
      }));

    return { severityChart, questChart, santriTopViolations };
  }, [pelanggaran, quest, santri]);

  // Recent actual activity
  const recentActivity = useMemo(() => {
    const items: { text: string; type: 'success' | 'warning' | 'error' | 'info' }[] = [];
    const recentPelanggaran = [...pelanggaran].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
    const recentQuest = [...quest].filter(q => q.status === 'completed').slice(0, 2);

    recentPelanggaran.forEach(p => {
      items.push({ text: `${p.santriName} — ${p.pelanggaranName} (${p.severity})`, type: 'warning' });
    });
    recentQuest.forEach(q => {
      items.push({ text: `${q.santriName} menyelesaikan "${q.title}"`, type: 'success' });
    });

    const recentUks = [...healthVisits]
      .sort((a, b) => b.masukAt.localeCompare(a.masukAt))
      .slice(0, 3)
      .map(v => ({ text: `${v.santriName} — ${v.keluhan}`, type: 'info' as const }));
    items.push(...recentUks);

    return items.slice(0, 5);
  }, [pelanggaran, quest, healthVisits]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Statistik global pesantren" />
        <LoadingState type="stats" count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Statistik global pesantren" />
        <ErrorState message={error.message} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Statistik global pesantren — data realtime" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Santri" value={stats.totalSantri} icon={Users} trend={{ value: stats.santriAktif, label: 'aktif' }} />
        <StatsCard title="Pelanggaran" value={stats.totalPelanggaran} icon={AlertTriangle} iconClassName="bg-red-500/10" trend={{ value: stats.pelanggaranPending, label: 'pending' }} />
        <StatsCard title="UKS Hari Ini" value={stats.uksHariIni} icon={Stethoscope} iconClassName="bg-emerald-500/10" />
        <StatsCard title="Hukuman Aktif" value={stats.hukumanAktif} icon={Shield} iconClassName="bg-orange-500/10" />
      </div>

      {/* Analytics from real data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnalyticsCard title="Kategori Pelanggaran" data={severityChart} type="bar" />
        <AnalyticsCard title="Status Quest" data={questChart} type="progress" />
        <AnalyticsCard title="Top 5 Poin Pelanggaran" data={santriTopViolations} type="bar" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PageCard title="Aktivitas Terbaru">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Belum ada aktivitas tercatat.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <p className="text-sm text-foreground">{a.text}</p>
                  <StatusBadge status={a.type} />
                </div>
              ))}
            </div>
          )}
        </PageCard>
        <div className="grid grid-cols-2 gap-4">
          <StatsCard title="Asrama Aktif" value={stats.asramaAktif} icon={Building2} iconClassName="bg-blue-500/10" />
          <StatsCard title="Santri Aktif" value={stats.santriAktif} icon={GraduationCap} iconClassName="bg-emerald-500/10" />
          <StatsCard title="Quest Selesai" value={stats.questSelesai} icon={CheckCircle} iconClassName="bg-emerald-500/10" />
          <StatsCard title="Dalam Observasi" value={stats.dalamObservasi} icon={Activity} iconClassName="bg-teal-500/10" />
        </div>
      </div>
    </div>
  );
}

// ─── MUSYRIF VIEW ───────────────────────────────────────────────
function MusyrifDashboard({ name }: { name: string }) {
  const { data: asramaList } = useCollection<Asrama>('asrama');
  const { data: santriList, loading: loadingSantri } = useCollection<Santri>('santri');
  const { data: pelanggaranList } = useCollection<Pelanggaran>('pelanggaran');
  const { data: hukumanList } = useCollection<Hukuman>('hukuman');

  const asrama = asramaList.find((a) => a.musyrif === name);
  const santriAsrama = asrama ? santriList.filter((s) => s.asramaId === asrama.id || s.asrama === asrama.name) : [];
  const pelanggaranAsrama = pelanggaranList.filter((p) =>
    santriAsrama.some((s) => s.id === p.santriId)
  );
  const hukumanAsrama = hukumanList.filter((h) =>
    santriAsrama.some((s) => s.id === h.santriId) && h.status === 'aktif'
  );

  const topPoinChart = [...santriAsrama]
    .sort((a, b) => b.totalPoinPelanggaran - a.totalPoinPelanggaran)
    .slice(0, 5)
    .map(s => ({
      label: s.name.split(' ')[0],
      value: s.totalPoinPelanggaran,
      color: s.totalPoinPelanggaran > 40 ? 'bg-red-500' : s.totalPoinPelanggaran > 20 ? 'bg-amber-500' : 'bg-emerald-500'
    }));

  const karakterCount: Record<string, number> = { 'Baik': 0, 'Perlu Perhatian': 0, 'Peringatan': 0 };
  santriAsrama.forEach(s => { if (s.statusKarakter) karakterCount[s.statusKarakter] = (karakterCount[s.statusKarakter] || 0) + 1; });
  const karakterChart = [
    { label: 'Baik', value: karakterCount['Baik'] || 0, color: 'bg-emerald-500' },
    { label: 'Perlu Perhatian', value: karakterCount['Perlu Perhatian'] || 0, color: 'bg-amber-500' },
    { label: 'Peringatan', value: karakterCount['Peringatan'] || 0, color: 'bg-red-500' },
  ];

  if (loadingSantri) {
    return (
      <div className="space-y-6">
        <PageHeader title={`Asrama ${asrama?.name ?? 'Anda'}`} description="Monitoring santri asrama yang kamu pegang" />
        <LoadingState type="stats" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Asrama ${asrama?.name ?? 'Anda'}`}
        description="Monitoring santri asrama yang kamu pegang"
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Santri" value={santriAsrama.length} icon={Users} />
        <StatsCard title="Santri Aktif" value={santriAsrama.filter(s => s.status === 'aktif').length} icon={GraduationCap} iconClassName="bg-emerald-500/10" />
        <StatsCard title="Pelanggaran" value={pelanggaranAsrama.length} icon={AlertTriangle} iconClassName="bg-red-500/10" />
        <StatsCard title="Hukuman Aktif" value={hukumanAsrama.length} icon={Shield} iconClassName="bg-orange-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard title="Top Poin Pelanggaran" data={topPoinChart} type="bar" />
        <AnalyticsCard title="Status Karakter Santri" data={karakterChart} type="progress" />
      </div>

      <PageCard title="Santri di Asrama" description={asrama?.name ?? 'Daftar santri'}>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">Nama</th>
                <th className="text-left px-4 py-2 font-medium">Kamar</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Poin Pelanggaran</th>
                <th className="text-left px-4 py-2 font-medium">Karakter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {santriAsrama.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.kamar}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">{s.totalPoinPelanggaran}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.statusKarakter} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>
    </div>
  );
}

// ─── WALI VIEW ──────────────────────────────────────────────────
function WaliDashboard() {
  const fbUser = useAuth().user;
  const { data: santriList, loading: loadingSantri } = useCollection<Santri>('santri');
  const { data: questList } = useCollection<Quest>('quest');
  const { data: pelanggaranList } = useCollection<Pelanggaran>('pelanggaran');
  const { data: hukumanList } = useCollection<Hukuman>('hukuman');

  const childSantriId = fbUser?.childSantriId;
  const anak = santriList.find(s => s.id === childSantriId);
  const quests = questList.filter(q => q.santriId === anak?.id);
  const pelanggaranAnak = pelanggaranList.filter(p => p.santriId === anak?.id);
  const hukumanAnak = hukumanList.filter(h => h.santriId === anak?.id && h.status === 'aktif');

  if (loadingSantri) {
    return <LoadingState type="spinner" text="Memuat data anak..." />;
  }

  if (!anak) return <div className="p-8 text-center text-muted-foreground">Data anak tidak ditemukan.</div>;

  const questAktif = quests.filter(q => q.status === 'inProgress' || q.status === 'available').length;
  const questSelesai = quests.filter(q => q.status === 'completed').length;

  return (
    <div className="space-y-6">
      <PageHeader title={`Assalamu'alaikum`} description={`Pantau perkembangan ${anak.name}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Poin Pelanggaran" value={anak.totalPoinPelanggaran} icon={AlertTriangle} iconClassName="bg-red-500/10" />
        <StatsCard title="Poin Prestasi" value={anak.totalPrestasi} icon={Star} iconClassName="bg-emerald-500/10" />
        <StatsCard title="Hukuman Aktif" value={hukumanAnak.length} icon={Shield} iconClassName="bg-orange-500/10" />
        <StatsCard title="Status Karakter" value={anak.statusKarakter} icon={GraduationCap} iconClassName="bg-blue-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatsCard title="Quest Aktif" value={questAktif} icon={Trophy} iconClassName="bg-amber-500/10" />
        <StatsCard title="Quest Selesai" value={questSelesai} icon={CheckCircle} iconClassName="bg-emerald-500/10" />
        <StatsCard title="Total Pelanggaran" value={pelanggaranAnak.length} icon={Activity} iconClassName="bg-purple-500/10" />
      </div>

      {/* Pelanggaran detail */}
      {pelanggaranAnak.length > 0 && (
        <PageCard title="Riwayat Pelanggaran" description={`${pelanggaranAnak.length} pelanggaran tercatat`}>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="text-left px-4 py-2 font-medium">Tanggal</th>
                  <th className="text-left px-4 py-2 font-medium">Pelanggaran</th>
                  <th className="text-left px-4 py-2 font-medium">Poin</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pelanggaranAnak.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 text-muted-foreground text-xs">{p.date}</td>
                    <td className="px-4 py-2 font-medium">{p.pelanggaranName}</td>
                    <td className="px-4 py-2 font-bold text-red-600">{p.points}</td>
                    <td className="px-4 py-2"><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageCard>
      )}
    </div>
  );
}

// ─── SANTRI VIEW ────────────────────────────────────────────────
function SantriDashboard({ name }: { name: string }) {
  const { data: santriList, loading } = useCollection<Santri>('santri');
  const { data: questList } = useCollection<Quest>('quest');

  if (loading) return <LoadingState type="spinner" text="Memuat data santri..." />;

  const santri = santriList.find((s) => s.name.toLowerCase().includes(name.split(' ')[0].toLowerCase()));
  if (!santri) return <div className="p-8 text-center text-muted-foreground">Data tidak ditemukan.</div>;

  const quests = questList.filter(q => q.santriId === santri.id);
  const questAktif = quests.filter(q => q.status === 'inProgress' || q.status === 'available').length;
  const questSelesai = quests.filter(q => q.status === 'completed').length;

  return (
    <div className="space-y-6">
      <PageHeader title={`Halo, ${santri.name.split(' ')[0]}`} description="Dashboard pribadi santri" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Poin Pelanggaran" value={santri.totalPoinPelanggaran} icon={AlertTriangle} iconClassName="bg-red-500/10" />
        <StatsCard title="Poin Prestasi" value={santri.totalPrestasi} icon={Star} iconClassName="bg-emerald-500/10" />
        <StatsCard title="Status SP" value={santri.statusSP} icon={Shield} iconClassName="bg-orange-500/10" />
        <StatsCard title="Status Karakter" value={santri.statusKarakter} icon={GraduationCap} iconClassName="bg-blue-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatsCard title="Quest Aktif" value={questAktif} icon={Trophy} iconClassName="bg-amber-500/10" />
        <StatsCard title="Quest Selesai" value={questSelesai} icon={CheckCircle} iconClassName="bg-emerald-500/10" />
      </div>
    </div>
  );
}

// ─── WALI KELAS VIEW ────────────────────────────────────────────
function WaliKelasDashboard() {
  const { user } = useAuth();
  const { data: santriList, loading } = useCollection<Santri>('santri');
  const { data: pelanggaranList } = useCollection<Pelanggaran>('pelanggaran');
  const { data: questList } = useCollection<Quest>('quest');

  if (loading) return <LoadingState type="spinner" text="Memuat data kelas..." />;

  // Filter santri by wali kelas name matching their kelas field
  const santriKelas = santriList.filter(s => s.kelas && user?.name && s.kelas.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]));

  const pelanggaranKelas = pelanggaranList.filter(p =>
    santriKelas.some(s => s.id === p.santriId)
  );
  const questKelas = questList.filter(q =>
    santriKelas.some(s => s.id === q.santriId)
  );
  const questSelesai = questKelas.filter(q => q.status === 'completed').length;
  const questBerjalan = questKelas.filter(q => q.status === 'inProgress').length;
  const pelanggaranPending = 0; // Pending now tracked via GovernanceCase collection

  const topPelanggaranChart = [...santriKelas]
    .sort((a, b) => b.totalPoinPelanggaran - a.totalPoinPelanggaran)
    .slice(0, 5)
    .map(s => ({
      label: s.name.split(' ')[0],
      value: s.totalPoinPelanggaran,
      color: s.totalPoinPelanggaran > 40 ? 'bg-red-500' : s.totalPoinPelanggaran > 20 ? 'bg-amber-500' : 'bg-emerald-500'
    }));

  const questKelasChart = [
    { label: 'Selesai', value: questSelesai, color: 'bg-emerald-500' },
    { label: 'Berjalan', value: questBerjalan, color: 'bg-amber-500' },
    { label: 'Pending', value: pelanggaranPending, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Wali Kelas" description="Monitoring kedisiplinan dan akademik kelas" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Murid" value={santriKelas.length} icon={Users} />
        <StatsCard title="Santri Aktif" value={santriKelas.filter(s => s.status === 'aktif').length} icon={CheckCircle} iconClassName="bg-emerald-500/10" />
        <StatsCard title="Pelanggaran" value={pelanggaranKelas.length} icon={AlertTriangle} iconClassName="bg-red-500/10" />
        <StatsCard title="Quest Aktif" value={questBerjalan} icon={Trophy} iconClassName="bg-amber-500/10" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard title="Top Poin Pelanggaran" data={topPelanggaranChart} type="bar" />
        <AnalyticsCard title="Aktivitas Kelas" data={questKelasChart} type="progress" />
      </div>
    </div>
  );
}

// ─── KESISWAAN VIEW ────────────────────────────────────────────
function KesiswaanDashboard() {
  const { data: questList, loading: loadingQuest } = useCollection<Quest>('quest');
  const { data: pelanggaranList, loading: loadingPelanggaran } = useCollection<Pelanggaran>('pelanggaran');
  const { data: santriList, loading: loadingSantri } = useCollection<Santri>('santri');

  const loading = loadingQuest || loadingPelanggaran || loadingSantri;

  if (loading) return <LoadingState type="spinner" text="Memuat data kesiswaan..." />;

  const pendingApproval = questList.filter(q => q.approvalStatus === 'pending').length;
  const totalPembinaan = pelanggaranList.filter(p => p.status === 'confirmed').length;
  const pelanggaranBerat = pelanggaranList.filter(p => p.severity === 'berat' || p.severity === 'sangat_berat').length;
  const totalPrestasi = santriList.reduce((sum, s) => sum + (s.totalPrestasi || 0), 0);

  const approvalChart = [
    { label: 'Disetujui', value: questList.filter(q => q.approvalStatus === 'approved').length, color: 'bg-emerald-500' },
    { label: 'Ditolak', value: questList.filter(q => q.approvalStatus === 'rejected').length, color: 'bg-red-500' },
    { label: 'Menunggu', value: pendingApproval, color: 'bg-amber-500' },
  ];

  const severityChart = [
    { label: 'Ringan', value: pelanggaranList.filter(p => p.severity === 'ringan').length, color: 'bg-amber-500' },
    { label: 'Sedang', value: pelanggaranList.filter(p => p.severity === 'sedang').length, color: 'bg-orange-500' },
    { label: 'Berat', value: pelanggaranList.filter(p => p.severity === 'berat' || p.severity === 'sangat_berat').length, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Kepala Kesiswaan" description="Pusat kontrol dan approval global" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Pending Approval" value={pendingApproval} icon={ClipboardCheck} iconClassName="bg-amber-500/10" />
        <StatsCard title="Total Pembinaan" value={totalPembinaan} icon={Shield} iconClassName="bg-blue-500/10" />
        <StatsCard title="Pelanggaran Berat" value={pelanggaranBerat} icon={AlertTriangle} iconClassName="bg-red-500/10" />
        <StatsCard title="Total Prestasi" value={totalPrestasi} icon={Star} iconClassName="bg-emerald-500/10" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard title="Approval Quest" data={approvalChart} type="progress" />
        <AnalyticsCard title="Severitas Pelanggaran" data={severityChart} type="bar" />
      </div>
    </div>
  );
}

// ─── GURU VIEW ────────────────────────────────────────────────
function GuruDashboard() {
  const { user } = useAuth();
  const { data: mapelList, loading } = useCollection<{ id: string; name: string; status: string }>('mapel');
  const { data: santriList } = useCollection<Santri>('santri');

  if (loading) return <LoadingState type="spinner" text="Memuat data mengajar..." />;

  const mapelAktif = mapelList.filter(m => m.status === 'active').length;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Guru" description="Akses data pengajaran dan presensi santri" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Mapel Aktif" value={mapelAktif} icon={BookOpen} />
        <StatsCard title="Total Santri" value={santriList.length} icon={Users} iconClassName="bg-blue-500/10" />
        <StatsCard title="Santri Aktif" value={santriList.filter(s => s.status === 'aktif').length} icon={GraduationCap} iconClassName="bg-emerald-500/10" />
      </div>
    </div>
  );
}

// ─── STAFF VIEW ────────────────────────────────────────────────
function StaffDashboard() {
  const { data: asramaList } = useCollection<Asrama>('asrama');
  const { data: santriList } = useCollection<Santri>('santri');

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Staff" description="Operasional dan administrasi harian" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Santri" value={santriList.length} icon={Users} />
        <StatsCard title="Santri Aktif" value={santriList.filter(s => s.status === 'aktif').length} icon={GraduationCap} iconClassName="bg-emerald-500/10" />
        <StatsCard title="Asrama Aktif" value={asramaList.filter(a => a.status === 'aktif').length} icon={Building2} iconClassName="bg-blue-500/10" />
        <StatsCard title="Total Asrama" value={asramaList.length} icon={School} iconClassName="bg-purple-500/10" />
      </div>
    </div>
  );
}

// ─── DEVELOPER / SAAS OWNER VIEW ──────────────────────────────
function DeveloperDashboard({ name, role }: { name: string; role: string }) {
  const isDev = role === 'developer';

  const mockTenants = [
    { id: 't1', name: 'Ponpes Daruttahuid', location: 'Malang, Jawa Timur', domain: 'daruttahuid.madev.id', plan: 'Enterprise SaaS', status: 'aktif', santriCount: 340, flipStatus: 'Connected', waStatus: 'Connected', driveStatus: 'Connected' },
    { id: 't2', name: 'Ponpes Al-Hikmah', location: 'Surabaya, Jawa Timur', domain: 'alhikmah.madev.id', plan: 'Pro SaaS', status: 'aktif', santriCount: 180, flipStatus: 'Connected', waStatus: 'Connected', driveStatus: 'Connected' },
    { id: 't3', name: 'Ponpes An-Nisa', location: 'Jakarta Selatan, DKI', domain: 'annisa.madev.id', plan: 'Pro SaaS', status: 'aktif', santriCount: 220, flipStatus: 'Pending Token', waStatus: 'Connected', driveStatus: 'Connected' },
    { id: 't4', name: 'Ponpes Ar-Raudah', location: 'Bandung, Jawa Barat', domain: 'arraudah.madev.id', plan: 'Starter SaaS', status: 'aktif', santriCount: 95, flipStatus: 'Connected', waStatus: 'Disabled', driveStatus: 'Connected' },
    { id: 't5', name: 'Ponpes Darul Quran', location: 'Yogyakarta, DIY', domain: 'dq.madev.id', plan: 'Trial 14 Hari', status: 'trial', santriCount: 45, flipStatus: 'Unconfigured', waStatus: 'Unconfigured', driveStatus: 'Connected' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>{isDev ? 'Developer & Owner SaaS Console' : 'Super Admin Platform Control'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Selamat Datang, {name}
            </h1>
            <p className="text-stone-300 text-xs md:text-sm max-w-xl">
              Panel Pengawas Platform Utama Madev — Serene Zeith Corp (serzen_dev). Mengelola provisioning tenant, infrastruktur Drizzle ORM, gateway payment, dan audit keamanan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/dashboard/pengaturan/tenant-integrasi"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
            >
              <Briefcase className="w-4 h-4" />
              <span>Integrasi Gateway & API</span>
            </a>
            <a
              href="/dashboard/audit-log"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/20 transition-all backdrop-blur-md active:scale-95"
            >
              <Activity className="w-4 h-4" />
              <span>Global Audit Log</span>
            </a>
          </div>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Total Tenant (Pesantren)" 
          value="8 Lembaga" 
          icon={Building2} 
          iconClassName="bg-emerald-500/10 text-emerald-600" 
        />
        <StatsCard 
          title="Estimasi MRR (SaaS)" 
          value="Rp 19.500.000" 
          icon={Trophy} 
          iconClassName="bg-amber-500/10 text-amber-600" 
        />
        <StatsCard 
          title="Drizzle ORM & Postgres" 
          value="12ms Latency" 
          icon={Activity} 
          iconClassName="bg-blue-500/10 text-blue-600" 
        />
        <StatsCard 
          title="API Gateway Status" 
          value="100% Operational" 
          icon={CheckCircle} 
          iconClassName="bg-purple-500/10 text-purple-600" 
        />
      </div>

      {/* Tenant List Table */}
      <PageCard 
        title="Daftar Tenant & Status Integrasi Pesantren" 
        description="Monitoring real-time status langganan, subdomain, dan koneksi API per-lembaga"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Pesantren & Subdomain</th>
                <th className="py-3 px-4">Paket Langganan</th>
                <th className="py-3 px-4">Jumlah Santri</th>
                <th className="py-3 px-4">Flip Payment</th>
                <th className="py-3 px-4">WA Gateway</th>
                <th className="py-3 px-4">Google Drive</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800 font-medium">
              {mockTenants.map((t) => (
                <tr key={t.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-stone-900">{t.name}</div>
                    <div className="text-stone-400 text-[11px] font-mono">{t.domain} • {t.location}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {t.plan}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-stone-700">{t.santriCount} Santri</td>
                  <td className="py-3.5 px-4">
                    <StatusBadge variant={t.flipStatus === 'Connected' ? 'success' : 'warning'}>
                      {t.flipStatus}
                    </StatusBadge>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge variant={t.waStatus === 'Connected' ? 'success' : 'secondary'}>
                      {t.waStatus}
                    </StatusBadge>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge variant={t.driveStatus === 'Connected' ? 'success' : 'secondary'}>
                      {t.driveStatus}
                    </StatusBadge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${t.status === 'aktif' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {t.status}
                    </span>
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

// ─── MAIN EXPORT ────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'developer':
    case 'super_admin':
      return <DeveloperDashboard name={user.name} role={user.role} />;
    case 'admin': return <AdminDashboard />;
    case 'musyrif': return <MusyrifDashboard name={user.name} />;
    case 'wali': return <WaliDashboard />;
    case 'santri': return <SantriDashboard name={user.name} />;
    case 'wali_kelas': return <WaliKelasDashboard />;
    case 'kepala_kesiswaan': return <KesiswaanDashboard />;
    case 'guru': return <GuruDashboard />;
    case 'staff': return <StaffDashboard />;
    default: return <div className="p-8 text-center text-muted-foreground">Dashboard belum tersedia untuk role ini.</div>;
  }
}

