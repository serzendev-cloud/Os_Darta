'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useCollection, useIsRole } from '@/hooks';
import type { Santri, Pelanggaran, Quest, Notification } from '@/types';
import { roleLabels, roleColors } from '@/config/theme';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  CreditCard, Wallet, CalendarCheck, Ticket, BookOpen,
  Award, Zap, ShoppingBag, Stethoscope, HeartHandshake,
  Megaphone, ShieldCheck, QrCode, ArrowUpRight, ChevronRight,
  Sparkles, CheckCircle2, AlertTriangle, Shield, Clock, MapPin,
  Calendar, UserCheck, RefreshCw, Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBankingDashboard() {
  const { user } = useAuthStore();
  const isWali = useIsRole('wali');
  const [showQrModal, setShowQrModal] = useState(false);

  // Data collections
  const { data: santriList } = useCollection<Santri>('santri');
  const { data: rawNotifs } = useCollection<Notification>('notifications', [], { realtime: true });

  const notifications = isWali && user?.childSantriId
    ? rawNotifs.filter((n) => n.targetSantriId === user.childSantriId)
    : rawNotifs;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const childSantri = isWali && user?.childSantriId
    ? santriList.find((s) => s.id === user.childSantriId)
    : santriList[0];

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'MA';

  // Mobile Banking Grid Features
  const features = [
    { label: 'Bayar SPP', icon: CreditCard, href: '/dashboard/keuangan/spp', bg: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
    { label: 'Saldo RFID', icon: Wallet, href: '/dashboard/santri/kta-rfid', bg: 'bg-blue-500/15 text-blue-500 border-blue-500/30' },
    { label: 'Absensi', icon: CalendarCheck, href: '/dashboard/gate-checkpoint/log', bg: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' },
    { label: 'Perizinan', icon: Ticket, href: '/dashboard/governance', bg: 'bg-orange-500/15 text-orange-500 border-orange-500/30' },
    { label: 'Tahfizh', icon: BookOpen, href: '/dashboard/tahfidz', bg: 'bg-teal-500/15 text-teal-500 border-teal-500/30' },
    { label: 'Raport & Nilai', icon: Award, href: '/dashboard/raport', bg: 'bg-purple-500/15 text-purple-500 border-purple-500/30' },
    { label: 'Beli Pulsa/PLN', icon: Zap, href: '/wali/ppob', bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30', badge: 'PPOB' },
    { label: 'POS Kantin', icon: ShoppingBag, href: '/dashboard/keuangan/kantin-nfc', bg: 'bg-rose-500/15 text-rose-500 border-rose-500/30' },
    { label: 'UKS Medis', icon: Stethoscope, href: '/dashboard/uks', bg: 'bg-red-500/15 text-red-500 border-red-500/30' },
    { label: 'Gate Pass', icon: ShieldCheck, href: '/dashboard/gate-checkpoint', bg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
    { label: 'Pengumuman', icon: Megaphone, href: '/dashboard/notifikasi', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    { label: 'Donasi/Infak', icon: HeartHandshake, href: '#', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  ];

  return (
    <div className="space-y-5 pb-24 font-sans text-slate-100">

      {/* ── TOP HERO HEADER (BSI Banking Style - Royal Blue Gambar 1) ────────── */}
      <div className="bg-mobile-banking-hero rounded-3xl p-5 md:p-6 shadow-2xl border border-sky-400/20 relative">
        
        {/* Top User Bar */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-sky-400/20 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-11 h-11 border-2 border-amber-400 shadow-md">
                <AvatarFallback className="bg-gradient-to-br from-amber-400 to-orange-500 text-stone-950 font-black text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#001D4A] rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-sky-200 tracking-wide">Assalamu&apos;alaikum,</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {user?.role ? roleLabels[user.role] : 'Wali'}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white tracking-tight truncate max-w-[180px]">
                {user?.name || 'Wali Santri'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowQrModal(true)}
              className="w-9 h-9 rounded-xl bg-white/10 border-sky-300/30 text-amber-300 hover:bg-white/20 hover:text-white backdrop-blur-md transition-all active:scale-95"
            >
              <QrCode className="w-4.5 h-4.5" />
            </Button>

            <Link href="/dashboard/notifikasi">
              <Button
                variant="outline"
                size="icon"
                className="relative w-9 h-9 rounded-xl bg-white/10 border-sky-300/30 text-white hover:bg-white/20 backdrop-blur-md transition-all active:scale-95"
              >
                <Megaphone className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border border-[#001D4A]">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Institution Branding */}
        <div className="pt-3 pb-2 flex items-center justify-between text-xs font-medium text-sky-200/90 relative z-10">
          <span className="inline-flex items-center gap-1.5 font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            MA Daruttauhid Malang
          </span>
          <span className="text-[11px] text-sky-300/80 font-mono">Mobile Portal</span>
        </div>

        {/* ── BSI MAIN CARD (Saldo Wallet & SPP Status) ────────── */}
        <div className="mt-2 bg-gradient-to-br from-[#002554] via-[#0B3C85] to-[#0055B3] rounded-2xl p-4 border border-amber-400/40 shadow-xl relative overflow-hidden">
          
          {/* Subtle Watermark */}
          <div className="absolute right-2 bottom-2 opacity-10 text-white font-extrabold text-7xl select-none pointer-events-none">
            MA
          </div>

          <div className="flex items-center justify-between text-xs text-sky-200">
            <span className="font-semibold text-amber-300 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Dompet RFID Santri
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold">
              Aktif • Cashless
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-white tracking-tight">
                Rp {childSantri?.limitHarian ? (childSantri.limitHarian * 5).toLocaleString('id-ID') : '285.000'}
              </span>
              <p className="text-[11px] text-sky-200 mt-0.5">
                Santri: <span className="font-bold text-white">{childSantri?.name || 'Muhammad Rayhan'}</span> ({childSantri?.kelas || 'XII MA'})
              </p>
            </div>
          </div>

          {/* SPP Status Pill */}
          <div className="mt-3 pt-3 border-t border-sky-300/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sky-200 text-[11px]">SPP Juli 2026:</span>
              <span className="font-extrabold text-amber-300">Rp 450.000</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
              Belum Bayar
            </span>
          </div>

          {/* Quick Action Pill Buttons inside Card */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <Link
              href="/dashboard/keuangan/spp"
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 font-black text-[11px] shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <CreditCard className="w-4 h-4 mb-0.5" />
              <span>Bayar SPP</span>
            </Link>

            <Link
              href="/wali/ppob"
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/15 text-white font-bold text-[11px] border border-white/20 hover:bg-white/25 active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4 mb-0.5 text-amber-300" />
              <span>Pulsa/PLN</span>
            </Link>

            <Link
              href="/dashboard/santri/kta-rfid"
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/15 text-white font-bold text-[11px] border border-white/20 hover:bg-white/25 active:scale-95 transition-all"
            >
              <Wallet className="w-4 h-4 mb-0.5 text-cyan-300" />
              <span>Topup RFID</span>
            </Link>

            <button
              onClick={() => setShowQrModal(true)}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/15 text-white font-bold text-[11px] border border-white/20 hover:bg-white/25 active:scale-95 transition-all"
            >
              <QrCode className="w-4 h-4 mb-0.5 text-emerald-300" />
              <span>Pass KTA</span>
            </button>
          </div>

        </div>
      </div>


      {/* ── BSI FEATURE SERVICES GRID (12 ICONS) ────────────────────────── */}
      <div className="bg-stone-900/60 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl p-4 border border-stone-800 shadow-lg">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Fitur Utama App Mobile
          </h3>
          <span className="text-[10px] font-semibold text-slate-400">12 Layanan</span>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.label}
                href={f.href}
                className="flex flex-col items-center group active:scale-95 transition-transform"
              >
                <div className={cn(
                  'relative w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md transition-all group-hover:scale-110',
                  f.bg
                )}>
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                  {f.badge && (
                    <span className="absolute -top-1 -right-1 text-[8px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-stone-950 px-1 py-0.2 rounded-full border border-stone-900">
                      {f.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-slate-200 mt-1.5 text-center leading-tight line-clamp-1">
                  {f.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>


      {/* ── BANNER 1 (Gambar 1 Poster Nuansa Deep Royal Blue & Gold) ────────── */}
      <div className="bg-gradient-to-r from-[#001D4A] via-[#003366] to-[#0055B3] rounded-3xl p-5 border border-sky-400/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 uppercase tracking-wider">
            Agenda Akbar
          </span>
          <span className="text-[11px] font-bold text-sky-200">MA Daruttauhid Malang</span>
        </div>

        <h3 className="text-base font-black text-white leading-snug tracking-tight">
          PERTEMUAN WALI SANTRI KELAS XII
        </h3>
        <p className="text-xs text-sky-200 mt-1 leading-relaxed">
          Sinergi Madrasah dan Orang Tua dalam Mempersiapkan Kesuksesan Lulusan TP 2026–2027
        </p>

        {/* 3 Pill Badges (from Gambar 1) */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-xs font-semibold text-white">
            <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center text-[10px]">1</div>
            <span>Persiapan Tes Kompetensi Akademik (TKA)</span>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-xs font-semibold text-white">
            <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center text-[10px]">2</div>
            <span>Pendampingan Seleksi Nasional SNBT</span>
          </div>

          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 text-xs font-semibold text-white">
            <div className="w-5 h-5 rounded-full bg-amber-400 text-stone-950 font-bold flex items-center justify-center text-[10px]">3</div>
            <span>Pendampingan Tes Perguruan Tinggi Timur Tengah</span>
          </div>
        </div>

        {/* Info Grid Footer (from Gambar 1) */}
        <div className="mt-4 pt-3 border-t border-sky-300/20 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="bg-white/10 p-2 rounded-xl border border-white/10">
            <Calendar className="w-3.5 h-3.5 mx-auto text-amber-300 mb-1" />
            <span className="font-bold text-white block">Ahad</span>
            <span className="text-[10px] text-sky-200">26 Juli 2026</span>
          </div>

          <div className="bg-white/10 p-2 rounded-xl border border-white/10">
            <Clock className="w-3.5 h-3.5 mx-auto text-amber-300 mb-1" />
            <span className="font-bold text-white block">08:00 WIB</span>
            <span className="text-[10px] text-sky-200">s/d Selesai</span>
          </div>

          <div className="bg-white/10 p-2 rounded-xl border border-white/10">
            <MapPin className="w-3.5 h-3.5 mx-auto text-amber-300 mb-1" />
            <span className="font-bold text-white block truncate">Masjid Ponpes</span>
            <span className="text-[10px] text-sky-200 truncate block">Daruttauhid</span>
          </div>
        </div>
      </div>


      {/* ── BANNER 2 (Gambar 2 Poster Nuansa Emerald Green & Gold Luxury) ────── */}
      <div className="bg-emerald-gold-card rounded-3xl p-5 border border-gold-accent shadow-xl relative overflow-hidden">
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-stone-950 uppercase tracking-wider">
            Podcast Spesial
          </span>
          <span className="text-xs font-extrabold text-gold-gradient">MA DARUTTAUHID</span>
        </div>

        <h3 className="text-lg font-black text-gold-gradient tracking-tight leading-tight">
          DARI DARUTTAUHID MENUJU DUNIA
        </h3>
        <p className="text-xs text-emerald-200/90 mt-0.5">
          Ngobrol Santai Bersama Alumni MA Daruttauhid Malang
        </p>

        {/* Speaker Info Card */}
        <div className="mt-3 bg-stone-950/40 p-3 rounded-2xl border border-amber-500/25 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-black text-sm shrink-0 shadow-md">
            JS
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Narasumber</span>
            <h4 className="text-xs font-extrabold text-white">Ja&apos;far Sodiq Al Idrus</h4>
            <p className="text-[11px] text-emerald-200/80 leading-tight mt-0.5">
              Alumnus S1 & S2 Universitas Al Ahgaff, Yaman • Asisten Dosen Prodi Hadits
            </p>
          </div>
        </div>

        {/* Quote Section (from Gambar 2) */}
        <div className="mt-3 p-3 rounded-2xl bg-emerald-950/60 border border-amber-400/20 italic text-xs text-amber-200/90 text-center leading-relaxed">
          &ldquo;Perjalanan dari Daruttauhid menuju dunia dimulai dari ilmu, ditempa dengan perjuangan, dan dipersembahkan untuk kemaslahatan umat.&rdquo;
        </div>
      </div>


      {/* ── RECENT ACTIVITY FEED ────────────────────────── */}
      <div className="bg-stone-900/60 dark:bg-stone-900/80 backdrop-blur-md rounded-3xl p-4 border border-stone-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Ringkasan Aktivitas Santri
          </h3>
          <span className="text-[11px] font-bold text-amber-400">Hari Ini</span>
        </div>

        <div className="space-y-2.5">
          
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/50 border border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Presensi Kehadiran Kelas</h4>
                <p className="text-[11px] text-slate-400">07:05 WIB • Hadir Tepat Waktu</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Hadir
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/50 border border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Setoran Tahfizh Qur&apos;an</h4>
                <p className="text-[11px] text-slate-400">Surah Yasin Ayat 1-30</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Mumtaz
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-950/50 border border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Pembelian Token PLN (PPOB)</h4>
                <p className="text-[11px] text-slate-400">Token 50rb • Berhasil</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Sukses
            </span>
          </div>

        </div>
      </div>


      {/* ── KTA RFID QR CODE MODAL ────────────────────────── */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-sm bg-stone-950 text-white border-sky-400/30 rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-black text-amber-300 flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" /> Digital Pass KTA Santri
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4 py-3">
            {/* QR Placeholder / Pass */}
            <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-amber-400 flex flex-col items-center">
              <div className="w-48 h-48 bg-stone-950 rounded-xl flex items-center justify-center relative overflow-hidden">
                {/* QR graphic simulation */}
                <QrCode className="w-36 h-36 text-white stroke-[1.5]" />
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/10 to-transparent pointer-events-none" />
              </div>
              <span className="mt-2 text-xs font-mono font-bold text-stone-900">
                RFID ID: {childSantri?.rfidTag || 'CARD-MA-2026-889'}
              </span>
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-sm font-extrabold text-white">{childSantri?.name || 'Muhammad Rayhan'}</h4>
              <p className="text-xs text-sky-200">Kelas: {childSantri?.kelas || 'XII MA'} • NISN: 318294029</p>
              <p className="text-[11px] text-amber-300/80 font-medium">Gunakan QR ini untuk Scan Presensi / POS Kantin</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
