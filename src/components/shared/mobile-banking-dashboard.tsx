'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useCollection, useIsRole } from '@/hooks';
import type { Santri, Notification } from '@/types';
import { roleLabels } from '@/config/theme';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CreditCard, Wallet, CalendarCheck, Ticket, BookOpen,
  Award, Zap, ShoppingBag, Stethoscope, HeartHandshake,
  Megaphone, ShieldCheck, QrCode, Sparkles, Clock, MapPin,
  Calendar, UserCheck, Shield
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
  const isPpobAllowed = user?.role === 'wali';

  // Mobile Banking Grid Features - STRICTLY UNIFIED WITH IMAGE 1 GOLDEN ORANGE & ROYAL BLUE PALETTE
  const features = [
    { label: 'Bayar SPP', icon: CreditCard, href: '/dashboard/keuangan/spp' },
    { label: 'Saldo RFID', icon: Wallet, href: '/dashboard/santri/kta-rfid' },
    { label: 'Absensi', icon: CalendarCheck, href: '/dashboard/gate-checkpoint/log' },
    { label: 'Perizinan', icon: Ticket, href: '/dashboard/governance' },
    { label: 'Tahfizh', icon: BookOpen, href: '/dashboard/tahfidz' },
    { label: 'Raport & Nilai', icon: Award, href: '/dashboard/raport' },
    isPpobAllowed
      ? { label: 'Beli Pulsa/PLN', icon: Zap, href: '/wali/ppob', badge: 'PPOB' }
      : { label: 'Informasi', icon: Sparkles, href: '/dashboard/notifikasi' },
    { label: 'POS Kantin', icon: ShoppingBag, href: '/dashboard/keuangan/kantin-nfc' },
    { label: 'UKS Medis', icon: Stethoscope, href: '/dashboard/uks' },
    { label: 'Gate Pass', icon: ShieldCheck, href: '/dashboard/gate-checkpoint' },
    { label: 'Pengumuman', icon: Megaphone, href: '/dashboard/notifikasi' },
    { label: 'Donasi/Infak', icon: HeartHandshake, href: '#' },
  ];

  return (
    <div className="space-y-5 pb-24 font-sans text-slate-100 bg-[#00122E] min-h-screen p-3 -m-4 sm:m-0 sm:p-0 sm:bg-transparent">

      {/* ── HERO HEADER (Gambar 1: Deep Royal Blue #002554, Cyan #00C4DF Glow & Gold Accents) ────────── */}
      <div className="bg-gradient-to-b from-[#001C42] via-[#002B66] to-[#0B3C85] rounded-3xl p-5 md:p-6 shadow-2xl border border-[#00C4DF]/30 relative overflow-hidden">
        
        {/* Cyan Glow Swoosh (from Gambar 1) */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#00C4DF]/25 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#0066C4]/30 to-transparent rounded-full blur-2xl pointer-events-none" />

        {/* Top User Bar */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#00C4DF]/20 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-11 h-11 border-2 border-[#F99D1C] shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-[#F99D1C] to-[#E67E22] text-white font-black text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#001C42] rounded-full" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-cyan-200 tracking-wide">Assalamu&apos;alaikum,</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-[#F99D1C] to-[#E67E22] text-white shadow-sm">
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
              className="w-9 h-9 rounded-xl bg-white/10 border-[#00C4DF]/40 text-[#F99D1C] hover:bg-white/20 hover:text-white backdrop-blur-md transition-all active:scale-95 shadow-md"
            >
              <QrCode className="w-4.5 h-4.5" />
            </Button>

            <Link href="/dashboard/notifikasi">
              <Button
                variant="outline"
                size="icon"
                className="relative w-9 h-9 rounded-xl bg-white/10 border-[#00C4DF]/40 text-white hover:bg-white/20 backdrop-blur-md transition-all active:scale-95 shadow-md"
              >
                <Megaphone className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border border-[#001C42]">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Institution Branding */}
        <div className="pt-3 pb-1 flex items-center justify-between text-xs font-medium text-cyan-100 relative z-10">
          <span className="inline-flex items-center gap-1.5 font-bold text-[#F99D1C]">
            <Sparkles className="w-3.5 h-3.5" />
            MA Daruttauhid Malang
          </span>
          <span className="text-[11px] text-cyan-200/80 font-mono">Mobile App Banking</span>
        </div>

        {/* ── BSI MAIN WALLET CARD (Royal Blue & Gold Accent - Gambar 1 Palette) ────────── */}
        <div className="mt-3 bg-gradient-to-br from-[#002554] via-[#0B3C85] to-[#0055B3] rounded-2xl p-4 border border-[#F99D1C]/50 shadow-xl relative overflow-hidden">
          
          <div className="flex items-center justify-between text-xs text-cyan-100">
            <span className="font-bold text-[#F99D1C] flex items-center gap-1.5">
              <Wallet className="w-4 h-4" /> Dompet RFID Santri
            </span>
            <span className="text-[10px] bg-[#00C4DF]/20 text-cyan-200 px-2 py-0.5 rounded-full border border-[#00C4DF]/40 font-bold">
              Cashless Active
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between">
            <div>
              <span className="text-2.5xl font-black text-white tracking-tight">
                Rp {childSantri?.limitHarian ? (childSantri.limitHarian * 5).toLocaleString('id-ID') : '285.000'}
              </span>
              <p className="text-[11px] text-cyan-100 mt-0.5">
                Santri: <span className="font-bold text-white">{childSantri?.name || 'Muhammad Rayhan'}</span> ({childSantri?.kelas || 'XII MA'})
              </p>
            </div>
          </div>

          {/* SPP Status Bar */}
          <div className="mt-3 pt-3 border-t border-cyan-200/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F99D1C] animate-pulse" />
              <span className="text-cyan-100 text-[11px]">SPP Juli 2026:</span>
              <span className="font-black text-[#F99D1C]">Rp 450.000</span>
            </div>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#F99D1C]/20 text-[#F99D1C] border border-[#F99D1C]/40">
              Belum Bayar
            </span>
          </div>

          {/* Quick Action Pill Buttons inside Card */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            <Link
              href="/dashboard/keuangan/spp"
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-gradient-to-r from-[#F99D1C] to-[#E67E22] text-white font-extrabold text-[11px] shadow-md hover:brightness-110 active:scale-95 transition-all"
            >
              <CreditCard className="w-4 h-4 mb-0.5" />
              <span>Bayar SPP</span>
            </Link>

            <Link
              href="/wali/ppob"
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/15 text-white font-bold text-[11px] border border-white/20 hover:bg-white/25 active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4 mb-0.5 text-[#F99D1C]" />
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
              <QrCode className="w-4 h-4 mb-0.5 text-amber-300" />
              <span>Pass KTA</span>
            </button>
          </div>

        </div>
      </div>


      {/* ── BSI FEATURE SERVICES GRID (12 ICONS — UNIFIED GOLDEN ORANGE & DEEP BLUE) ────────── */}
      <div className="bg-[#001D4A]/90 backdrop-blur-md rounded-3xl p-4 border border-[#00C4DF]/25 shadow-xl">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#F99D1C] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Layanan Utama Mobile App
          </h3>
          <span className="text-[10px] font-semibold text-cyan-200">12 Fitur</span>
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
                {/* Circular Golden-Orange Icon Container matching Gambar 1 */}
                <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#F99D1C] to-[#E67E22] text-white shadow-md border border-amber-300/40 transition-all group-hover:scale-110">
                  <Icon className="w-5.5 h-5.5 stroke-[2.2] text-white drop-shadow-sm" />
                  {f.badge && (
                    <span className="absolute -top-1 -right-1 text-[8px] font-black bg-white text-[#002554] px-1 py-0.2 rounded-full border border-[#F99D1C] shadow-sm">
                      {f.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-white mt-1.5 text-center leading-tight line-clamp-1">
                  {f.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>


      {/* ── BANNER POSTER GAMBAR 1 (Exact Replicating Royal Blue, White Pill Cards & Gold Accent) ────────── */}
      <div className="bg-gradient-to-b from-[#002554] via-[#0B3C85] to-[#0066C4] rounded-3xl p-5 border border-[#00C4DF]/40 shadow-2xl relative overflow-hidden">
        
        {/* Poster Top Banner Header */}
        <div className="text-center space-y-1.5 pb-4 border-b border-cyan-200/20">
          <span className="inline-block text-[10px] font-black px-3 py-0.5 rounded-full bg-gradient-to-r from-[#F99D1C] to-[#E67E22] text-white uppercase tracking-widest shadow">
            Agenda Utama Wali Santri
          </span>
          <h3 className="text-lg font-black text-white tracking-tight leading-tight uppercase">
            PERTEMUAN WALI SANTRI KELAS XII
          </h3>
          <p className="text-xs text-cyan-100 max-w-xs mx-auto leading-normal">
            Sinergi Madrasah dan Orang Tua dalam Mempersiapkan Kesuksesan Lulusan Tahun Pelajaran 2026–2027
          </p>
        </div>

        {/* 3 White Pill Cards with Golden Orange Badges (Direct Replica of Gambar 1) */}
        <div className="mt-4 space-y-2.5">
          
          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-md border border-slate-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F99D1C] to-[#E67E22] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-[#F99D1C] uppercase tracking-wider block">Persiapan</span>
              <h4 className="text-xs font-black text-[#002554]">Tes Kompetensi Akademik (TKA)</h4>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-md border border-slate-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F99D1C] to-[#E67E22] text-white flex items-center justify-center shrink-0 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-[#F99D1C] uppercase tracking-wider block">Pendampingan</span>
              <h4 className="text-xs font-black text-[#002554]">Seleksi Nasional Berdasarkan Tes (SNBT)</h4>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 rounded-2xl shadow-md border border-slate-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F99D1C] to-[#E67E22] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-[#F99D1C] uppercase tracking-wider block">Pendampingan</span>
              <h4 className="text-xs font-black text-[#002554]">Tes Masuk Perguruan Tinggi Timur Tengah</h4>
            </div>
          </div>

        </div>

        {/* Info Grid Container with Golden-Orange Border (Direct Replica of Gambar 1) */}
        <div className="mt-4 bg-white rounded-2xl p-3.5 border-2 border-[#F99D1C] shadow-lg grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#F99D1C]/15 text-[#F99D1C] flex items-center justify-center mb-1">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-black text-[#002554] block">Ahad</span>
            <span className="text-[10px] font-bold text-slate-600">26 Juli 2026</span>
          </div>

          <div className="flex flex-col items-center border-x border-slate-200 px-1">
            <div className="w-8 h-8 rounded-full bg-[#F99D1C]/15 text-[#F99D1C] flex items-center justify-center mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <span className="font-black text-[#002554] block">08:00 WIB</span>
            <span className="text-[10px] font-bold text-slate-600">s/d Selesai</span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-[#F99D1C]/15 text-[#F99D1C] flex items-center justify-center mb-1">
              <MapPin className="w-4 h-4" />
            </div>
            <span className="font-black text-[#002554] block truncate">Masjid Ponpes</span>
            <span className="text-[10px] font-bold text-slate-600 truncate block">Daruttauhid</span>
          </div>
        </div>

        {/* Footer Institution Pill (Direct Replica of Gambar 1) */}
        <div className="mt-4 text-center">
          <div className="inline-block bg-gradient-to-r from-[#F99D1C] to-[#E67E22] text-white px-4 py-1.5 rounded-full text-xs font-black shadow-md border border-white/30">
            Madrasah Aliyah Daruttauhid Malang
          </div>
          <p className="text-[11px] italic text-cyan-100 mt-2 font-medium">
            &ldquo;Bersama Orang Tua, Mengantarkan Generasi Berprestasi Menuju Perguruan Tinggi Negeri dan Universitas Timur Tengah.&rdquo;
          </p>
        </div>

      </div>


      {/* ── RECENT ACTIVITY FEED (Royal Blue Theme) ────────────────────────── */}
      <div className="bg-[#001D4A]/90 backdrop-blur-md rounded-3xl p-4 border border-[#00C4DF]/25 shadow-xl space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#F99D1C]" /> Activity Feed Santri
          </h3>
          <span className="text-[11px] font-black text-[#F99D1C]">Hari Ini</span>
        </div>

        <div className="space-y-2.5">
          
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#001538] border border-cyan-200/15">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F99D1C] to-[#E67E22] text-white flex items-center justify-center shadow">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Presensi Kehadiran Kelas</h4>
                <p className="text-[11px] text-cyan-200/70">07:05 WIB • Hadir Tepat Waktu</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Hadir
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#001538] border border-cyan-200/15">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F99D1C] to-[#E67E22] text-white flex items-center justify-center shadow">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Setoran Tahfizh Qur&apos;an</h4>
                <p className="text-[11px] text-cyan-200/70">Surah Yasin Ayat 1-30</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#F99D1C]/20 text-[#F99D1C] border border-[#F99D1C]/40">
              Mumtaz
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#001538] border border-cyan-200/15">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F99D1C] to-[#E67E22] text-white flex items-center justify-center shadow">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-white">Pembelian Token PLN (PPOB)</h4>
                <p className="text-[11px] text-cyan-200/70">Token 50rb • Berhasil</p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#00C4DF]/20 text-cyan-200 border border-[#00C4DF]/40">
              Sukses
            </span>
          </div>

        </div>
      </div>


      {/* ── KTA RFID QR CODE MODAL (Royal Blue & Gold Accent) ────────────────────────── */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-sm bg-[#001C42] text-white border-[#00C4DF]/40 rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-black text-[#F99D1C] flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" /> Pass KTA Digital Santri
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4 py-3">
            <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-[#F99D1C] flex flex-col items-center">
              <div className="w-48 h-48 bg-[#001C42] rounded-xl flex items-center justify-center relative overflow-hidden">
                <QrCode className="w-36 h-36 text-white stroke-[1.5]" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#F99D1C]/20 to-transparent pointer-events-none" />
              </div>
              <span className="mt-2 text-xs font-mono font-bold text-[#002554]">
                RFID ID: {childSantri?.rfidTag || 'CARD-MA-2026-889'}
              </span>
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-sm font-extrabold text-white">{childSantri?.name || 'Muhammad Rayhan'}</h4>
              <p className="text-xs text-cyan-200">Kelas: {childSantri?.kelas || 'XII MA'} • NISN: 318294029</p>
              <p className="text-[11px] text-[#F99D1C] font-semibold">Gunakan QR ini untuk Scan Presensi / POS Kantin</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
