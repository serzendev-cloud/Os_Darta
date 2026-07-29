'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useCollection, useIsRole } from '@/hooks';
import type { Notification, Santri } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Home, Wallet, QrCode, Bell, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isWali = useIsRole('wali');
  const [showQrModal, setShowQrModal] = useState(false);

  // Real-time notifications count
  const { data: rawNotifs } = useCollection<Notification>('notifications', [], { realtime: true });
  const { data: santriList } = useCollection<Santri>('santri');

  const notifications = isWali && user?.childSantriId
    ? rawNotifs.filter((n) => n.targetSantriId === user.childSantriId)
    : rawNotifs;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const childSantri = isWali && user?.childSantriId
    ? santriList.find((s) => s.id === user.childSantriId)
    : santriList[0];

  if (!user) return null;

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#00173D]/95 backdrop-blur-xl border-t border-[#00C4DF]/30 px-3 py-1.5 shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
        <nav className="flex items-center justify-between max-w-md mx-auto relative">
          
          {/* 1. Beranda */}
          <Link
            href="/dashboard"
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-300',
              pathname === '/dashboard' ? 'text-[#F99D1C] font-black' : 'text-cyan-200/70 hover:text-white'
            )}
          >
            {pathname === '/dashboard' && (
              <span className="absolute -top-1.5 w-5 h-1 bg-gradient-to-r from-[#F99D1C] to-[#E67E22] rounded-full shadow-[0_0_10px_rgba(249,157,28,0.8)]" />
            )}
            <Home className={cn('w-5 h-5 transition-transform', pathname === '/dashboard' && 'stroke-[2.5] text-[#F99D1C] drop-shadow-[0_0_8px_rgba(249,157,28,0.6)]')} />
            <span className="text-[10px] mt-1 font-bold tracking-tight">Beranda</span>
          </Link>

          {/* 2. Keuangan */}
          <Link
            href="/dashboard/keuangan/spp"
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-300 mr-2',
              pathname?.startsWith('/dashboard/keuangan') ? 'text-[#F99D1C] font-black' : 'text-cyan-200/70 hover:text-white'
            )}
          >
            {pathname?.startsWith('/dashboard/keuangan') && (
              <span className="absolute -top-1.5 w-5 h-1 bg-gradient-to-r from-[#F99D1C] to-[#E67E22] rounded-full shadow-[0_0_10px_rgba(249,157,28,0.8)]" />
            )}
            <Wallet className={cn('w-5 h-5 transition-transform', pathname?.startsWith('/dashboard/keuangan') && 'stroke-[2.5] text-[#F99D1C] drop-shadow-[0_0_8px_rgba(249,157,28,0.6)]')} />
            <span className="text-[10px] mt-1 font-bold tracking-tight">Keuangan</span>
          </Link>

          {/* ── 3. CENTER RAISED FLOATING CIRCULAR BUTTON (PROMINENT FAB BSI STYLE) ── */}
          <div className="relative -top-6 flex flex-col items-center justify-center z-10">
            <button
              onClick={() => setShowQrModal(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F99D1C] via-[#F5A623] to-[#E67E22] border-4 border-[#00173D] shadow-[0_4px_20px_rgba(249,157,28,0.7)] flex items-center justify-center text-white active:scale-90 hover:scale-105 transition-all duration-200 cursor-pointer"
              title="Pass QR KTA Digital"
            >
              <QrCode className="w-7 h-7 text-white stroke-[2.2] drop-shadow-md" />
            </button>
            <span className="text-[10px] font-black text-[#F99D1C] mt-0.5 tracking-tight drop-shadow">
              Pass QR
            </span>
          </div>

          {/* 4. Notifikasi */}
          <Link
            href="/dashboard/notifikasi"
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-300 ml-2 relative',
              pathname === '/dashboard/notifikasi' ? 'text-[#F99D1C] font-black' : 'text-cyan-200/70 hover:text-white'
            )}
          >
            {pathname === '/dashboard/notifikasi' && (
              <span className="absolute -top-1.5 w-5 h-1 bg-gradient-to-r from-[#F99D1C] to-[#E67E22] rounded-full shadow-[0_0_10px_rgba(249,157,28,0.8)]" />
            )}
            <div className="relative">
              <Bell className={cn('w-5 h-5 transition-transform', pathname === '/dashboard/notifikasi' && 'stroke-[2.5] text-[#F99D1C] drop-shadow-[0_0_8px_rgba(249,157,28,0.6)]')} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-black bg-rose-500 text-white rounded-full border border-[#00173D] shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-bold tracking-tight">Notifikasi</span>
          </Link>

          {/* 5. Profil */}
          <Link
            href="/dashboard/pengaturan/manajemen-user-role"
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all duration-300',
              pathname?.startsWith('/dashboard/pengaturan') ? 'text-[#F99D1C] font-black' : 'text-cyan-200/70 hover:text-white'
            )}
          >
            {pathname?.startsWith('/dashboard/pengaturan') && (
              <span className="absolute -top-1.5 w-5 h-1 bg-gradient-to-r from-[#F99D1C] to-[#E67E22] rounded-full shadow-[0_0_10px_rgba(249,157,28,0.8)]" />
            )}
            <User className={cn('w-5 h-5 transition-transform', pathname?.startsWith('/dashboard/pengaturan') && 'stroke-[2.5] text-[#F99D1C] drop-shadow-[0_0_8px_rgba(249,157,28,0.6)]')} />
            <span className="text-[10px] mt-1 font-bold tracking-tight">Profil</span>
          </Link>

        </nav>
      </div>

      {/* ── KTA RFID QR CODE MODAL FOR CENTER BUTTON ────────────────────────── */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-sm bg-[#001C42] text-white border-[#00C4DF]/40 rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-black text-[#F99D1C] flex items-center justify-center gap-2">
              <QrCode className="w-5 h-5" /> Digital Pass QR KTA Santri
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
              <p className="text-[11px] text-[#F99D1C] font-bold flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Gunakan QR ini untuk Scan Presensi & POS Kantin
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
