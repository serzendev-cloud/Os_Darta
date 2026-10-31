'use client';

import React, { useState } from 'react';
import { 
  Wallet, 
  Receipt, 
  FileText, 
  Stethoscope, 
  Star, 
  ShieldAlert, 
  PhoneCall, 
  Calendar,
  ChevronRight,
  ArrowUpRight,
  History,
  Sliders,
  QrCode,
  Home,
  Bell,
  User,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { GradientHeaderShell } from '@/components/theme/GradientHeaderShell';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ThemeOrnamentType } from '@/themes/types';

export interface WaliSantriChildData {
  id: string;
  name: string;
  nis: string;
  kelas: string;
  kamar: string;
  avatarUrl?: string;
  saldoUangSaku: number;
  dailyLimit: number;
}

export interface WaliSantriBillData {
  id: string;
  title: string;
  periode: string;
  amount: number;
  dueDate: string;
  status: 'unpaid' | 'paid';
}

export interface WaliDashboardPresentationProps {
  waliName?: string;
  childrenList?: WaliSantriChildData[];
  selectedChildIndex?: number;
  onSelectChild?: (index: number) => void;
  unpaidBill?: WaliSantriBillData | null;
  ornamentType?: ThemeOrnamentType;
  showGoldAccent?: boolean;
  showNeonGlow?: boolean;
  onActionClick?: (action: string) => void;
}

const DEFAULT_CHILDREN: WaliSantriChildData[] = [
  {
    id: 'ch_1',
    name: 'Muhammad Fatih Robbani',
    nis: 'NIS-2026-0819',
    kelas: 'Kelas 8A - MTs',
    kamar: 'Asrama Al-Farabi / Kamar 04',
    saldoUangSaku: 125000,
    dailyLimit: 30000,
  },
  {
    id: 'ch_2',
    name: 'Aisyah Humaira Robbani',
    nis: 'NIS-2026-0820',
    kelas: 'Kelas 7B - MTs',
    kamar: 'Asrama Khadijah / Kamar 12',
    saldoUangSaku: 95000,
    dailyLimit: 25000,
  },
];

const DEFAULT_BILL: WaliSantriBillData = {
  id: 'bill_2026_11',
  title: 'SPP & Syahriah Pesantren',
  periode: 'November 2026',
  amount: 850000,
  dueDate: '10 November 2026',
  status: 'unpaid',
};

export const WaliDashboardPresentation: React.FC<WaliDashboardPresentationProps> = ({
  waliName = 'Ibu Siti Khadijah',
  childrenList = DEFAULT_CHILDREN,
  selectedChildIndex: initialChildIndex = 0,
  onSelectChild,
  unpaidBill = DEFAULT_BILL,
  ornamentType = 'abstract',
  showGoldAccent = false,
  showNeonGlow = false,
  onActionClick,
}) => {
  const [activeChildIndex, setActiveChildIndex] = useState(initialChildIndex);
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'bill' | 'notif' | 'profile'>('home');

  const selectedChild = childrenList[activeChildIndex] || childrenList[0] || DEFAULT_CHILDREN[0];

  const handleSwitchChild = () => {
    const nextIdx = (activeChildIndex + 1) % childrenList.length;
    setActiveChildIndex(nextIdx);
    onSelectChild?.(nextIdx);
  };

  const handleAction = (actionKey: string) => {
    onActionClick?.(actionKey);
  };

  const quickServices = [
    { key: 'uang_saku', label: 'Uang Saku', icon: Wallet, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10' },
    { key: 'tagihan_spp', label: 'Tagihan SPP', icon: Receipt, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { key: 'izin_santri', label: 'Izin Santri', icon: FileText, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    { key: 'rekam_medis', label: 'Kesehatan UKS', icon: Stethoscope, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
    { key: 'poin_prestasi', label: 'Prestasi', icon: Star, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-500/10' },
    { key: 'pelanggaran', label: 'Disiplin', icon: ShieldAlert, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
    { key: 'kontak_asrama', label: 'Kontak Asrama', icon: PhoneCall, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { key: 'kalender_santri', label: 'Kalender', icon: Calendar, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="w-full max-w-md mx-auto bg-background text-foreground min-h-[780px] flex flex-col justify-between relative shadow-lg sm:rounded-3xl border border-border overflow-hidden">
      {/* 1. Header Hero Area dengan Ornamen & Salam */}
      <div className="relative">
        <GradientHeaderShell
          ornamentType={ornamentType === 'none' ? 'none' : ornamentType}
          showOrnament={ornamentType !== 'none'}
          goldAccent={showGoldAccent}
          neonGlow={showNeonGlow}
          className="pt-6 pb-20 px-5 text-white"
        >
          {/* Top greeting bar */}
          <div className="flex items-center justify-between z-10 relative">
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium tracking-wide uppercase opacity-85">
                Portal Wali Santri
              </span>
              <h2 className="text-lg font-bold tracking-tight text-white drop-shadow-xs">
                Assalamu&apos;alaikum, {waliName}
              </h2>
            </div>

            {/* Notification bell badge */}
            <button 
              onClick={() => handleAction('notifications')}
              className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xs border border-white/20 text-white transition-colors"
              aria-label="Lihat Notifikasi"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white/30" />
            </button>
          </div>

          {/* Child Selector Strip */}
          <div className="mt-4 p-2.5 rounded-xl bg-black/20 backdrop-blur-md border border-white/15 flex items-center justify-between z-10 relative">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-sm text-white">
                {selectedChild.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-tight line-clamp-1">
                  {selectedChild.name}
                </p>
                <p className="text-[10px] text-white/80 font-mono">
                  {selectedChild.kelas} • {selectedChild.nis}
                </p>
              </div>
            </div>

            {childrenList.length > 1 && (
              <button
                onClick={handleSwitchChild}
                className="px-2.5 py-1 text-[11px] font-semibold bg-white text-slate-900 rounded-lg hover:bg-white/90 shadow-xs transition-transform active:scale-95 shrink-0"
              >
                Ganti
              </button>
            )}
          </div>
        </GradientHeaderShell>

        {/* 2. Floating Card: Saldo Uang Saku & Quick Actions */}
        <div className="px-4 -mt-14 relative z-20">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-md text-card-foreground">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Saldo Uang Saku Santri</span>
                  <Badge variant="secondary" className="text-[9px] px-1 py-0 font-medium">
                    Data contoh
                  </Badge>
                </div>
                <div className="text-2xl font-extrabold tracking-tight text-foreground mt-0.5">
                  Rp {selectedChild.saldoUangSaku.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block">Batas Harian</span>
                <span className="text-xs font-bold text-foreground">
                  Rp {selectedChild.dailyLimit.toLocaleString('id-ID')}/hari
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-3 gap-2.5 mt-3.5 pt-3 border-t border-border/70">
              <button 
                onClick={() => handleAction('topup')}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold shadow-xs transition-transform active:scale-95"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Top-Up</span>
              </button>
              <button 
                onClick={() => handleAction('history')}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-xs font-semibold transition-colors"
              >
                <History className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Riwayat</span>
              </button>
              <button 
                onClick={() => handleAction('limit')}
                className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-muted text-foreground hover:bg-muted/80 text-xs font-semibold transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Batas</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Scroll Area */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Banner Tagihan SPP */}
        {unpaidBill && (
          <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  {unpaidBill.title}
                </span>
                <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/40 text-amber-700 dark:text-amber-300">
                  Data contoh
                </Badge>
              </div>
              <p className="text-xs font-extrabold text-foreground">
                Rp {unpaidBill.amount.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Jatuh tempo: {unpaidBill.dueDate}
              </p>
            </div>

            <button 
              onClick={() => handleAction('pay_bill')}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 shrink-0"
            >
              Bayar
            </button>
          </div>
        )}

        {/* 4. Grid Layanan 4x2 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Layanan Utama
            </h3>
            <span className="text-[11px] text-primary font-semibold cursor-pointer">
              Semua
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {quickServices.map((srv) => {
              const IconComp = srv.icon;
              return (
                <button
                  key={srv.key}
                  onClick={() => handleAction(srv.key)}
                  className="flex flex-col items-center justify-center p-2 rounded-2xl hover:bg-muted/60 transition-colors group text-center"
                >
                  <div className={cn(
                    'w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs',
                    srv.bg, srv.color
                  )}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-medium text-foreground mt-1.5 line-clamp-1">
                    {srv.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Kartu Informasi Cepat & Berita Pesantren */}
        <div className="p-3.5 rounded-2xl border border-border bg-card space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Info className="w-3.5 h-3.5 text-primary" />
              <span>Maklumat Pesantren</span>
            </div>
            <span className="text-[10px] text-muted-foreground">2 jam lalu</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">
            Pelaksanaan Penilaian Tengah Semester (PTS) Ganjil akan dimulai Senin depan. Mohon pastikan kartu santri aktif.
          </p>
          <div className="pt-1 flex items-center justify-between text-[11px] text-primary font-semibold">
            <span>Baca rincian jadwal</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* 6. Navigasi Bawah Terpadu dengan Tombol Scan Tengah */}
      <div className="border-t border-border bg-card/95 backdrop-blur-md px-3 py-2 z-30 flex items-center justify-around relative">
        <button
          onClick={() => setActiveNavTab('home')}
          className={cn(
            'flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors',
            activeNavTab === 'home' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Home className="w-4 h-4" />
          <span>Beranda</span>
        </button>

        <button
          onClick={() => setActiveNavTab('bill')}
          className={cn(
            'flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors',
            activeNavTab === 'bill' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Receipt className="w-4 h-4" />
          <span>Tagihan</span>
        </button>

        {/* Floating Scan Button */}
        <div className="relative -top-4">
          <button
            onClick={() => handleAction('scan_qr')}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center border-4 border-background hover:scale-105 active:scale-95 transition-transform"
            aria-label="Pindai QR Santri"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => setActiveNavTab('notif')}
          className={cn(
            'flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors',
            activeNavTab === 'notif' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Bell className="w-4 h-4" />
          <span>Pesan</span>
        </button>

        <button
          onClick={() => setActiveNavTab('profile')}
          className={cn(
            'flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors',
            activeNavTab === 'profile' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <User className="w-4 h-4" />
          <span>Akun</span>
        </button>
      </div>
    </div>
  );
};

