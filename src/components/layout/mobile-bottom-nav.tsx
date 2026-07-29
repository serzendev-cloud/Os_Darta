'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useCollection, useIsRole } from '@/hooks';
import type { Notification } from '@/types';
import { Home, Wallet, GraduationCap, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isWali = useIsRole('wali');

  // Load real-time unread count
  const { data: rawNotifs } = useCollection<Notification>('notifications', [], { realtime: true });
  const notifications = isWali && user?.childSantriId
    ? rawNotifs.filter((n) => n.targetSantriId === user.childSantriId)
    : rawNotifs;
  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!user) return null;

  const navItems = [
    {
      label: 'Beranda',
      href: '/dashboard',
      icon: Home,
      exact: true,
    },
    {
      label: 'Keuangan',
      href: '/dashboard/keuangan/spp',
      icon: Wallet,
      exact: false,
    },
    {
      label: 'Santri',
      href: '/dashboard/santri/kta-rfid',
      icon: GraduationCap,
      exact: false,
    },
    {
      label: 'Notifikasi',
      href: '/dashboard/notifikasi',
      icon: Bell,
      exact: false,
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      label: 'Profil',
      href: '/dashboard/pengaturan/manajemen-user-role',
      icon: User,
      exact: false,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#001430]/95 backdrop-blur-xl border-t border-sky-500/20 px-2 py-1.5 shadow-[0_-4px_25px_rgba(0,0,0,0.35)]">
      <nav className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact 
            ? pathname === item.href 
            : pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-300',
                isActive
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-sky-200/70 hover:text-white'
              )}
            >
              {/* Glowing Indicator active Pill */}
              {isActive && (
                <span className="absolute -top-1.5 w-6 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
              )}
              
              <div className="relative">
                <Icon className={cn('w-5 h-5 transition-transform duration-200', isActive && 'stroke-[2.5] text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]')} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-black bg-rose-500 text-white rounded-full border border-[#001430] shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px] mt-1 font-medium tracking-tight', isActive ? 'text-amber-300 font-bold' : 'text-slate-300/80')}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
