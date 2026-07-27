'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/store/sidebar-store';
import { useAuthStore } from '@/store/auth-store';
import { getGroupedMenuForRole } from '@/config/navigation';
import { featureFlags } from '@/config/features';
import { useCollection, useIsRole } from '@/hooks';
import type { Notification } from '@/types';
import {
  LayoutDashboard, Users, Building2, BookOpen, AlertTriangle,
  Gavel, Trophy, Activity, Bell, Settings, ChevronLeft,
  ChevronRight, GraduationCap, X, UsersRound, School, Library,
  Stethoscope, FileText, Upload, Home, ChevronDown, PieChart,
  Megaphone, Archive, Calendar, Radio,
  SlidersHorizontal, Wrench, ScrollText, Link2,
  BookMarked, ClipboardCheck, FileSpreadsheet, FileSearch,
  Shield, Sliders, CreditCard, Key
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Users, Building2, BookOpen, AlertTriangle,
  Gavel, Trophy, Activity, Bell, Settings, UsersRound,
  GraduationCap, School, Library, Stethoscope, FileText, Upload, Home, PieChart,
  Megaphone, Archive, Calendar, Radio,
  SlidersHorizontal, Wrench, ScrollText, Link2,
  BookMarked, ClipboardCheck, FileSpreadsheet, FileSearch,
  Shield, Sliders, CreditCard, Key
};

import { 
  CurriculumProgram, 
  getStoredCurriculums, 
  CURRICULUM_STORE_CHANGE_EVENT 
} from '@/lib/store/curriculum-store';
import { Permission } from '@/config/permissions';

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen } = useSidebarStore();
  const { user } = useAuthStore();
  const flags = Object.fromEntries(featureFlags.map((f) => [f.key, f.enabled]));

  // Dynamic Curriculum Programs State
  const [curriculumPrograms, setCurriculumPrograms] = useState<CurriculumProgram[]>([]);

  useEffect(() => {
    const syncPrograms = () => {
      setCurriculumPrograms(getStoredCurriculums().filter((p) => p.status === 'active'));
    };
    syncPrograms();
    window.addEventListener(CURRICULUM_STORE_CHANGE_EVENT, syncPrograms);
    return () => window.removeEventListener(CURRICULUM_STORE_CHANGE_EVENT, syncPrograms);
  }, []);

  const rawMenuGroups = getGroupedMenuForRole(user?.role ?? 'admin', flags);

  // Dynamically replace items in 'Program Kurikulum' section based on active curriculums store
  const menuGroups = rawMenuGroups.map((group) => {
    if (group.title.toLowerCase() === 'program kurikulum') {
      const dynamicItems = curriculumPrograms.map((prog) => ({
        title: prog.name,
        href: `/dashboard/kurikulum/program/${prog.id}`,
        icon: 'GraduationCap',
        roles: ['admin', 'kepala_kesiswaan', 'staff', 'guru'] as const,
        requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
        children: [
          {
            title: 'Struktur Akademik',
            href: `/dashboard/struktur-akademik?prog=${prog.id}`,
            icon: 'GraduationCap',
            roles: ['admin', 'kepala_kesiswaan'] as const,
            requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
          },
          {
            title: 'Mata Pelajaran',
            href: `/dashboard/mapel?prog=${prog.id}`,
            icon: 'BookOpen',
            roles: ['admin', 'kepala_kesiswaan', 'guru'] as const,
            requiredPermission: Permission.VIEW_MAPEL,
          },
          {
            title: 'Distribusi Guru',
            href: `/dashboard/distribusi-guru?prog=${prog.id}`,
            icon: 'Users',
            roles: ['admin', 'kepala_kesiswaan'] as const,
            requiredPermission: Permission.MANAGE_MAPEL,
          },
          {
            title: 'Evaluasi & Raport',
            href: `/dashboard/raport?prog=${prog.id}`,
            icon: 'FileSpreadsheet',
            roles: ['admin', 'kepala_kesiswaan', 'guru'] as const,
            requiredPermission: Permission.VIEW_RAPORT,
          },
        ],
      }));

      return {
        ...group,
        items: dynamicItems.length > 0 ? (dynamicItems as unknown as typeof group.items) : group.items,
      };
    }
    return group;
  });

  // Helper to normalize path by stripping trailing slashes and query strings
  const normalizePath = (path: string) => {
    if (!path) return '';
    const clean = path.split('?')[0];
    return clean.length > 1 && clean.endsWith('/') ? clean.slice(0, -1) : clean;
  };

  // Safe query param getter with window.location.search fallback for Next.js static export
  const getQueryParam = useCallback((key: string) => {
    const val = searchParams?.get(key);
    if (val) return val;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(key);
    }
    return null;
  }, [searchParams]);

  const normalizeProgId = (prog: string | null) => {
    if (!prog) return 'prog-madin';
    const p = prog.toLowerCase();
    if (p === 'formal' || p === 'prog-formal') return 'prog-formal';
    if (p === 'quran' || p === 'madqur' || p === 'prog-madqur') return 'prog-madqur';
    if (p === 'pesantren' || p === 'madin' || p === 'prog-madin') return 'prog-madin';
    return p;
  };

  // Universal Path active checker for all submenus across Kurikulum & Madrasah
  const isPathActive = useCallback((targetHref: string) => {
    if (!pathname) return false;
    if (!targetHref) return false;

    const currentPath = normalizePath(pathname);
    let targetPath = normalizePath(targetHref);

    // Normalize path aliases for Evaluasi & Raport
    if ((currentPath === '/dashboard/evaluasi' || currentPath === '/dashboard/raport') &&
        (targetPath === '/dashboard/evaluasi' || targetPath === '/dashboard/raport')) {
      targetPath = currentPath;
    }

    if (targetHref.includes('?')) {
      if (currentPath !== targetPath && !currentPath.startsWith(targetPath + '/')) return false;

      const targetQuery = targetHref.split('?')[1] || '';
      const targetParams = new URLSearchParams(targetQuery);
      
      const targetProg = targetParams.get('prog') || targetParams.get('type');
      if (targetProg) {
        const currentProg = getQueryParam('prog') || getQueryParam('type');
        const normCurrent = normalizeProgId(currentProg);
        const normTarget = normalizeProgId(targetProg);
        if (normCurrent !== normTarget) return false;
      }
      return true;
    }

    if (currentPath === targetPath) return true;
    if (targetPath === '/dashboard/pengaturan') {
      return currentPath === '/dashboard/pengaturan';
    }
    return targetPath !== '/dashboard' && currentPath.startsWith(targetPath + '/');
  }, [pathname, getQueryParam]);

  // Accordion: track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Auto-expand group containing active route
  useEffect(() => {
    const activeGroup = menuGroups.find((g) =>
      g.items.some((item) => {
        if (isPathActive(item.href)) return true;
        return item.children?.some((c) => isPathActive(c.href)) ?? false;
      })
    );
    if (activeGroup && !expandedGroups[activeGroup.title]) {
      setExpandedGroups((prev) => ({ ...prev, [activeGroup.title]: true }));
    }
  }, [pathname, searchParams, menuGroups, isPathActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleGroup = useCallback((title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  }, []);

  const isWali = useIsRole('wali');

  // Real-time unread notification count
  const { data: allNotifs } = useCollection<Notification>('notifications', [], { realtime: true });
  const filteredNotifs = isWali && user?.childSantriId
    ? allNotifs.filter((n) => n.targetSantriId === user.childSantriId)
    : allNotifs;
  const unreadCount = filteredNotifs.filter((n) => !n.read).length;

  const isDevOrSuperAdmin = user?.role === 'developer' || user?.role === 'super_admin';

  return (
    <TooltipProvider delay={0}>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full flex flex-col transition-all duration-300 ease-in-out',
        'bg-gradient-to-b from-slate-200 via-stone-200 to-zinc-300 dark:from-slate-900 dark:via-zinc-900 dark:to-stone-900 border-r border-slate-300/80 dark:border-slate-800 shadow-xl',
        isCollapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className={cn('flex items-center h-16 border-b border-sidebar-border px-4 shrink-0', isCollapsed ? 'justify-center' : 'gap-3')}>
          {isDevOrSuperAdmin ? (
            <>
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-600 shrink-0 shadow-[0_0_12px_rgba(225,29,72,0.35)] text-white">
                <Shield className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-extrabold text-sidebar-foreground truncate">SaaS Platform Console</span>
                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 truncate">Serene Zeith Corp • serzen_dev</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary shrink-0 shadow-[0_0_12px_rgba(251,146,60,0.35)] dark:shadow-[0_0_16px_rgba(251,146,60,0.4)]">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-bold text-sidebar-foreground truncate">Ma&apos;had Manager</span>
                  <span className="text-[10px] text-muted-foreground truncate">Sistem Manajemen Pesantren</span>
                </div>
              )}
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3">
          <nav className="px-2 space-y-1">
            {isDevOrSuperAdmin ? (
              /* Flat Menu Items for Developer & Super Admin Console */
              <div className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Menu Utama Platform SaaS
                  </div>
                )}
                {menuGroups.flatMap(g => g.items).map((item) => {
                  const Icon = iconMap[item.icon] || LayoutDashboard;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
                  const itemClasses = cn(
                    'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200',
                    'border border-transparent',
                    isActive
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold shadow-sm'
                      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                    isCollapsed && 'justify-center px-2',
                  );

                  const link = (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={itemClasses}>
                      <Icon className={cn('shrink-0 w-4 h-4 transition-colors', isActive ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground group-hover:text-foreground')} />
                      {!isCollapsed && (
                        <span className="flex-1 truncate">{item.title}</span>
                      )}
                      {!isCollapsed && item.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    );
                  }
                  return link;
                })}
              </div>
            ) : (
              menuGroups.map((group) => {
                return (
                  <div key={group.title} className="space-y-1">
                    {/* Section Header Title with Horizontal Line */}
                    {!isCollapsed && group.title !== 'Beranda' && group.title !== 'SaaS Platform Console' && (
                      <div className="flex items-center gap-2 px-3 pt-3.5 pb-1 text-[10px] font-black uppercase tracking-wider">
                        <span className="shrink-0 text-white bg-stone-900/85 dark:bg-stone-950 px-2 py-0.5 rounded-md shadow-sm border border-white/20 tracking-widest">
                          {group.title}
                        </span>
                        <div className="flex-1 h-[1.5px] bg-white/70 dark:bg-white/50 shadow-sm" />
                      </div>
                    )}

                    {/* Group Items */}
                    {group.items.map((item) => {
                      const itemHasChildren = Boolean(item.children && item.children.length > 0);
                      const isActiveItem = itemHasChildren
                        ? item.children?.some((c) => isPathActive(c.href)) ?? false
                        : isPathActive(item.href);
                      const isExpanded = expandedGroups[item.title] ?? isActiveItem;

                      const ItemIcon = iconMap[item.icon] || LayoutDashboard;

                      if (itemHasChildren) {
                        return (
                          <div key={item.title} className="space-y-1">
                            {/* Metallic Orange Container Button Trigger */}
                            <button
                              type="button"
                              onClick={() => toggleGroup(item.title)}
                              className={cn(
                                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-extrabold',
                                'transition-all duration-300 ease-out shadow-sm active:scale-[0.98]',
                                'border',
                                isActiveItem
                                  ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 text-white border-amber-300/40 shadow-[0_4px_16px_rgba(249,115,22,0.35)]'
                                  : 'bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-600/10 text-stone-800 dark:text-stone-200 border-amber-500/20 hover:from-amber-600/20 hover:to-orange-500/25 hover:border-amber-500/40 hover:shadow-md'
                              )}
                            >
                              <div className={cn(
                                'p-1.5 rounded-xl transition-all duration-300 shrink-0',
                                isActiveItem
                                  ? 'bg-white/20 text-white shadow-inner'
                                  : 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                              )}>
                                <ItemIcon className="w-4 h-4" />
                              </div>
                              {!isCollapsed && <span className="flex-1 text-left truncate">{item.title}</span>}
                              {!isCollapsed && (
                                <ChevronDown className={cn(
                                  'w-4 h-4 shrink-0 transition-transform duration-300',
                                  isActiveItem ? 'text-white' : 'text-orange-500/70',
                                  isExpanded && 'rotate-180'
                                )} />
                              )}
                            </button>

                            {/* Submenu items container with 3D Emboss & Neon Glow */}
                            {!isCollapsed && (
                              <div className={cn(
                                'overflow-hidden transition-all duration-300 ease-in-out mt-1.5 mb-2.5 rounded-2xl',
                                isExpanded 
                                  ? 'max-h-[36rem] opacity-100 bg-white/95 dark:bg-stone-900/95 border-2 border-amber-500/40 dark:border-amber-500/50 p-2.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.08),0_4px_24px_rgba(249,115,22,0.25)] backdrop-blur-md' 
                                  : 'max-h-0 opacity-0'
                              )}>
                                <div className="space-y-1 pl-1.5 border-l-2 border-amber-500/70 dark:border-amber-400/70">
                                  {item.children?.map((child) => {
                                    const ChildIcon = iconMap[child.icon] || LayoutDashboard;
                                    const isChildActive = isPathActive(child.href);
                                    const childClasses = cn(
                                      'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium',
                                      'transition-all duration-200 ease-out border',
                                      isChildActive
                                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold border-amber-400 shadow-md shadow-amber-500/30 scale-[1.01]'
                                        : 'text-stone-700 dark:text-stone-300 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 hover:text-amber-700 dark:hover:text-amber-300 border-transparent',
                                    );
                                    return (
                                      <Link key={child.href} href={child.href} onClick={() => setMobileOpen(false)} className={childClasses}>
                                        <ChildIcon className={cn('shrink-0 w-3.5 h-3.5 transition-colors duration-200', isChildActive ? 'text-white' : 'text-stone-500 dark:text-stone-400 group-hover:text-amber-600')} />
                                        <span className="truncate">{child.title}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Flat single menu link (e.g. User & Role, Dashboard) - UNIFIED METALLIC ORANGE STYLING
                      const flatLinkClasses = cn(
                        'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[13px] font-extrabold',
                        'transition-all duration-300 ease-out shadow-sm active:scale-[0.98]',
                        'border',
                        isActiveItem
                          ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 text-white border-amber-300/40 shadow-[0_4px_16px_rgba(249,115,22,0.35)]'
                          : 'bg-gradient-to-r from-amber-500/10 via-orange-500/15 to-amber-600/10 text-stone-800 dark:text-stone-200 border-amber-500/20 hover:from-amber-600/20 hover:to-orange-500/25 hover:border-amber-500/40 hover:shadow-md',
                        isCollapsed && 'justify-center px-2',
                      );

                      const link = (
                        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={flatLinkClasses}>
                          <div className={cn(
                            'p-1.5 rounded-xl transition-all duration-300 shrink-0',
                            isActiveItem
                              ? 'bg-white/20 text-white shadow-inner'
                              : 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
                          )}>
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          {!isCollapsed && <span className="flex-1 text-left truncate">{item.title}</span>}
                        </Link>
                      );

                      if (isCollapsed) {
                        return (
                          <Tooltip key={item.href}>
                            <TooltipTrigger>{link}</TooltipTrigger>
                            <TooltipContent side="right">{item.title}</TooltipContent>
                          </Tooltip>
                        );
                      }
                      return link;
                    })}
                  </div>
                );
              })
            )}
          </nav>
        </div>

        {/* Collapse Toggle */}
        <div className="hidden lg:flex items-center justify-center border-t border-sidebar-border p-2 shrink-0">
          <Button variant="ghost" size="icon" onClick={toggle} className="w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
