'use client';

import React from 'react';
import { 
  Users, 
  DoorOpen, 
  Stethoscope, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Plus, 
  ArrowUpRight, 
  Filter, 
  Calendar,
  Activity,
  Layers,
  Sparkles,
  FileText,
  UserCheck
} from 'lucide-react';
import { GradientHeaderShell } from '@/components/theme/GradientHeaderShell';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ThemeOrnamentType } from '@/themes/types';

export interface TimelineEventItem {
  id: string;
  time: string;
  title: string;
  status: 'completed' | 'ongoing' | 'upcoming';
  category: string;
}

export interface DecisionQueueItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'izin' | 'pelanggaran' | 'uks';
  urgency: 'high' | 'medium' | 'low';
  timeAgo: string;
}

export interface ClassAttendanceItem {
  id: string;
  className: string;
  totalStudents: number;
  presentStudents: number;
  percentage: number;
}

export interface AdminDashboardPresentationProps {
  adminName?: string;
  mahadName?: string;
  todayDateStr?: string;
  hijriDateStr?: string;
  ornamentType?: ThemeOrnamentType;
  showGoldAccent?: boolean;
  showNeonGlow?: boolean;
  stats?: {
    totalSantri: number;
    presentSantri: number;
    activeGatePasses: number;
    uksVisitsToday: number;
    pendingDisciplineCases: number;
  };
  timelineEvents?: TimelineEventItem[];
  decisionQueue?: DecisionQueueItem[];
  classAttendance?: ClassAttendanceItem[];
  onActionClick?: (actionKey: string, payload?: unknown) => void;
}

const DEFAULT_TIMELINE: TimelineEventItem[] = [
  { id: 'ev_1', time: '04:00 - 05:30', title: 'Shalat Subuh & Halaqah Al-Qur\'an', status: 'completed', category: 'Ibadah' },
  { id: 'ev_2', time: '07:00 - 12:00', title: 'KBM Madrasah Pagi & Laboratorium', status: 'ongoing', category: 'Akademik' },
  { id: 'ev_3', time: '12:30 - 13:30', title: 'Shalat Dzuhur & Makan Siang Terpimpin', status: 'upcoming', category: 'Rutinitas' },
  { id: 'ev_4', time: '15:30 - 17:00', title: 'KBM Diniyah Sore & Bahasa Arab', status: 'upcoming', category: 'Diniyah' },
  { id: 'ev_5', time: '18:00 - 20:00', title: 'Maghrib, Isya & Kajian Kitab Kuning', status: 'upcoming', category: 'Karakter' },
];

const DEFAULT_DECISIONS: DecisionQueueItem[] = [
  {
    id: 'dec_1',
    title: 'Ahmad Dahlan (Kelas 9B)',
    subtitle: 'Pengajuan Izin Berobat Rawat Jalan (RSUD)',
    type: 'uks',
    urgency: 'high',
    timeAgo: '15 mnt lalu',
  },
  {
    id: 'dec_2',
    title: 'Muhammad Rayhan (Kelas 8A)',
    subtitle: 'Dispensasi Kepulangan Keluarga Inti',
    type: 'izin',
    urgency: 'medium',
    timeAgo: '42 mnt lalu',
  },
  {
    id: 'dec_3',
    title: 'Laporan Ketidakhadiran Sholat Subuh',
    subtitle: 'Musyrif Asrama Umar melapor 4 santri tanpa kabar',
    type: 'pelanggaran',
    urgency: 'high',
    timeAgo: '1 jam lalu',
  },
];

const DEFAULT_ATTENDANCE: ClassAttendanceItem[] = [
  { id: 'cls_1', className: 'Kelas 7A (Putra)', totalStudents: 32, presentStudents: 32, percentage: 100 },
  { id: 'cls_2', className: 'Kelas 7B (Putri)', totalStudents: 30, presentStudents: 29, percentage: 96.7 },
  { id: 'cls_3', className: 'Kelas 8A (Putra)', totalStudents: 31, presentStudents: 30, percentage: 96.8 },
  { id: 'cls_4', className: 'Kelas 8B (Putri)', totalStudents: 28, presentStudents: 28, percentage: 100 },
  { id: 'cls_5', className: 'Kelas 9A (Putra)', totalStudents: 30, presentStudents: 28, percentage: 93.3 },
  { id: 'cls_6', className: 'Kelas 9B (Putri)', totalStudents: 29, presentStudents: 28, percentage: 96.5 },
];

export const AdminDashboardPresentation: React.FC<AdminDashboardPresentationProps> = ({
  adminName = 'Ustadz Abdullah Faqih',
  mahadName = 'Pondok Pesantren Daruttauhid',
  todayDateStr = 'Sabtu, 31 Oktober 2026',
  hijriDateStr = '20 Rabiul Akhir 1448 H',
  ornamentType = 'abstract',
  showGoldAccent = false,
  showNeonGlow = false,
  stats = {
    totalSantri: 1240,
    presentSantri: 1198,
    activeGatePasses: 18,
    uksVisitsToday: 7,
    pendingDisciplineCases: 3,
  },
  timelineEvents = DEFAULT_TIMELINE,
  decisionQueue = DEFAULT_DECISIONS,
  classAttendance = DEFAULT_ATTENDANCE,
  onActionClick,
}) => {
  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-12 font-sans">
      {/* 1. Header Hero Area dengan Ornamen & Sapaan */}
      <GradientHeaderShell
        ornamentType={ornamentType === 'none' ? 'none' : ornamentType}
        showOrnament={ornamentType !== 'none'}
        goldAccent={showGoldAccent}
        neonGlow={showNeonGlow}
        className="rounded-3xl p-6 md:p-8 text-white shadow-md relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Command Center Ma&apos;had Terpadu</span>
              <span>•</span>
              <span className="font-mono">{hijriDateStr}</span>
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-xs">
              Selamat Datang, {adminName}
            </h1>

            <p className="text-white/85 text-xs md:text-sm leading-relaxed">
              Monitoring operasional santri, kehadiran KBM, perizinan gerbang pos, dan pemantauan disiplin {mahadName} secara real-time.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onActionClick?.('new_gate_pass')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-white/95 active:scale-95 transition-all"
            >
              <DoorOpen className="w-4 h-4 text-sky-600" />
              <span>Input Izin Gerbang</span>
            </button>

            <button
              onClick={() => onActionClick?.('report_infraction')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/40 text-white font-semibold text-xs border border-white/25 backdrop-blur-md active:scale-95 transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              <span>Catat Disiplin</span>
            </button>

            <button
              onClick={() => onActionClick?.('broadcast_announcement')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/40 text-white font-semibold text-xs border border-white/25 backdrop-blur-md active:scale-95 transition-all"
            >
              <FileText className="w-4 h-4 text-emerald-300" />
              <span>Kirim Broadcast</span>
            </button>
          </div>
        </div>
      </GradientHeaderShell>

      {/* 2. Strip 4 Kartu Statistik Cepat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Kehadiran Santri */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">Santri di Pondok</span>
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {stats.presentSantri}
              <span className="text-xs text-muted-foreground font-normal ml-1">/ {stats.totalSantri}</span>
            </div>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>96.6% berada di ma&apos;had</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Perizinan Gerbang */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">Izin Gerbang Aktif</span>
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {stats.activeGatePasses}
              <span className="text-xs text-muted-foreground font-normal ml-1">Santri</span>
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Di luar pos satpam</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <DoorOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Kunjungan UKS */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">Kunjungan UKS Hari Ini</span>
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {stats.uksVisitsToday}
              <span className="text-xs text-muted-foreground font-normal ml-1">Santri</span>
            </div>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
              <Stethoscope className="w-3 h-3" />
              <span>2 dalam observasi kamar</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Stethoscope className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Pembinaan & Kasus */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">Perlu Verifikasi Kasus</span>
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {stats.pendingDisciplineCases}
              <span className="text-xs text-muted-foreground font-normal ml-1">Laporan</span>
            </div>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Menunggu persetujuan</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Hero Section: Denyut Hari Ini (Lini Waktu Harian Ma'had) */}
      <div className="p-5 md:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span>Denyut Hari Ini — Lini Waktu Aktivitas Ma&apos;had</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              Jadwal kegiatan terpusat santri untuk {todayDateStr}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs border-primary/30 text-primary bg-primary/5">
              Live Tracker
            </Badge>
          </div>
        </div>

        {/* Timeline Bar Strip */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {timelineEvents.map((ev, idx) => {
            const isOngoing = ev.status === 'ongoing';
            const isCompleted = ev.status === 'completed';

            return (
              <div
                key={ev.id}
                className={cn(
                  'p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2',
                  isOngoing
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                    : isCompleted
                    ? 'border-border/60 bg-muted/40 text-muted-foreground'
                    : 'border-border bg-card'
                )}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-medium">{ev.time}</span>
                  {isCompleted && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                      ✓ Selesai
                    </span>
                  )}
                  {isOngoing && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                  )}
                </div>

                <div>
                  <h3 className={cn(
                    'text-xs font-bold tracking-tight',
                    isOngoing ? 'text-primary' : 'text-foreground'
                  )}>
                    {ev.title}
                  </h3>
                  <Badge variant="secondary" className="text-[10px] mt-1.5 px-1.5 py-0 font-normal">
                    {ev.category}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Split Grid: Perlu Keputusan (Inbox) & Kehadiran Per Kelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Daftar Perlu Keputusan */}
        <div className="p-5 md:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>Perlu Keputusan ({decisionQueue.length})</span>
              </h2>
              <button 
                onClick={() => onActionClick?.('view_all_decisions')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
              >
                <span>Lihat Antrean</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pengajuan perizinan dan tindak lanjut santri yang memerlukan verifikasi pimpinan.
            </p>
          </div>

          <div className="space-y-2.5">
            {decisionQueue.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-border hover:border-primary/40 bg-background/50 hover:bg-background transition-all flex items-center justify-between gap-3 group"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground truncate">
                      {item.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-1.5 py-0 font-medium shrink-0',
                        item.urgency === 'high' 
                          ? 'border-red-500/30 text-red-700 dark:text-red-300 bg-red-500/10'
                          : 'border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10'
                      )}
                    >
                      {item.urgency === 'high' ? 'Penting' : 'Reguler'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {item.subtitle}
                  </p>
                  <span className="text-[10px] text-muted-foreground/80 block">
                    {item.timeAgo}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onActionClick?.('approve_decision', item.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 shadow-xs transition-transform active:scale-95"
                  >
                    Setujui
                  </button>
                  <button
                    onClick={() => onActionClick?.('review_decision', item.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                  >
                    Tinjau
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
            <span>Standar SLA verifikasi: &lt; 2 jam kerja</span>
            <span className="font-semibold text-primary cursor-pointer hover:underline">
              Buka Riwayat Approval
            </span>
          </div>
        </div>

        {/* Kolom Kanan: Kehadiran Per Kelas */}
        <div className="p-5 md:p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Kehadiran KBM Per Kelas</span>
                </h2>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">
                  Data contoh
                </Badge>
              </div>

              <span className="text-xs text-muted-foreground font-mono">
                Presensi Hari Ini
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Rekapitulasi presensi pembelajaran aktif per rombongan belajar.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {classAttendance.map((cls) => (
              <div key={cls.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-foreground">{cls.className}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-mono text-[11px]">
                      {cls.presentStudents}/{cls.totalStudents} Santri
                    </span>
                    <span className={cn(
                      'font-mono font-bold',
                      cls.percentage >= 98 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    )}>
                      {cls.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      cls.percentage >= 98 ? 'bg-emerald-500' : 'bg-primary'
                    )}
                    style={{ width: `${cls.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
            <span>Rata-rata kehadiran ma&apos;had: 97.2%</span>
            <span className="font-semibold text-primary cursor-pointer hover:underline">
              Cetak Rekap Presensi
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

