'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
};

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen } = useSidebarStore();
  const { user } = useAuthStore();
  const flags = Object.fromEntries(featureFlags.map((f) => [f.key, f.enabled]));
  const menuGroups = getGroupedMenuForRole(user?.role ?? 'admin', flags);

  // Accordion: track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Auto-expand group containing active route
  useEffect(() => {
    const activeGroup = menuGroups.find((g) =>
      g.items.some((item) => {
        const check = (i: typeof item) => pathname === i.href || pathname?.startsWith(i.href + '/');
        if (check(item)) return true;
        return item.children?.some((c) => check(c)) ?? false;
      })
    );
    if (activeGroup && !expandedGroups[activeGroup.title]) {
      setExpandedGroups((prev) => ({ ...prev, [activeGroup.title]: true }));
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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

  return (
    <TooltipProvider delay={0}>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full flex flex-col transition-all duration-300 ease-in-out',
        'bg-sidebar border-r border-sidebar-border dark:backdrop-blur-xl',
        isCollapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className={cn('flex items-center h-16 border-b border-sidebar-border px-4 shrink-0', isCollapsed ? 'justify-center' : 'gap-3')}>
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary shrink-0 shadow-[0_0_12px_rgba(251,146,60,0.35)] dark:shadow-[0_0_16px_rgba(251,146,60,0.4)]">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-sidebar-foreground truncate">Ma&apos;had Manager</span>
              <span className="text-[10px] text-muted-foreground truncate">Sistem Manajemen Pesantren</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="lg:hidden ml-auto text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3">
          <nav className="px-2 space-y-1">
            {menuGroups.map((group) => {
              const GroupIcon = iconMap[group.icon];
              const isExpanded = expandedGroups[group.title] || false;
              const isActiveGroup = group.items.some(
                (item) => {
                  const check = (i: typeof item) => pathname === i.href || pathname?.startsWith(i.href + '/');
                  if (check(item)) return true;
                  return item.children?.some((c) => check(c)) ?? false;
                }
              );

              return (
                <div key={group.title}>
                  {/* Group header — clickable accordion trigger */}
                  {isCollapsed ? (
                    /* Collapsed: show items directly with tooltips, no group header */
                    <div className="space-y-1">
                      {group.items.flatMap((item) => {
                        if (item.children?.length) {
                          return item.children.map((child) => ({ ...child, _parent: item.title }));
                        }
                        return [item];
                      }).map((item) => {
                        const parentLabel = (item as unknown as { _parent?: string })._parent;
                        const Icon = iconMap[item.icon] || LayoutDashboard;
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        const isNotifItem = item.icon === 'Bell';
                        const itemClasses = cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                          'border border-transparent',
                          isActive
                            ? 'bg-primary/5 text-primary border-primary/15 shadow-[0_0_16px_rgba(251,146,60,0.06)]'
                            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:border-primary/10',
                          'justify-center px-2',
                          item.disabled && 'opacity-40 pointer-events-none',
                        );
                        const linkContent = item.disabled ? (
                          <span className={itemClasses}>
                            <div className="relative">
                              <Icon className="shrink-0 transition-colors duration-200 w-5 h-5 text-muted-foreground" />
                              {item.badge && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />}
                            </div>
                          </span>
                        ) : (
                          <Link href={item.href} onClick={() => setMobileOpen(false)} className={itemClasses}>
                            <div className={cn(isNotifItem || item.badge ? 'relative' : '')}>
                              <Icon className={cn('shrink-0 transition-colors duration-200 w-5 h-5', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                              {item.badge && <span className={cn('absolute -top-1 -right-1 w-2 h-2 rounded-full', item.badge === 'Beta' ? 'bg-amber-500' : 'bg-muted-foreground')} />}
                              {isNotifItem && unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-4 text-[9px] font-bold bg-destructive text-destructive-foreground rounded-full px-0.5">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                        return (
                          <Tooltip key={parentLabel ? `${parentLabel}-${item.href}` : item.href}>
                            <TooltipTrigger>
                              {linkContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8}>{parentLabel ? `${parentLabel} › ${item.title}` : item.title}</TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ) : (
                    /* Expanded sidebar: accordion groups */
                    <>
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.title)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold',
                          'transition-all duration-300 ease-out',
                          'border border-transparent',
                          isActiveGroup
                            ? 'bg-primary/5 border-primary/15 text-primary shadow-[0_0_20px_rgba(251,146,60,0.06)]'
                            : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground hover:shadow-[0_2px_12px_rgba(251,146,60,0.04)] hover:border-primary/10'
                        )}
                      >
                        {GroupIcon && <GroupIcon className={cn('w-4 h-4 shrink-0 transition-colors duration-300', isActiveGroup ? 'text-primary' : 'text-muted-foreground')} />}
                        <span className="flex-1 text-left truncate">{group.title}</span>
                        <ChevronDown className={cn(
                          'w-3.5 h-3.5 shrink-0 transition-transform duration-300',
                          isActiveGroup ? 'text-primary/60' : 'text-muted-foreground/40',
                          isExpanded && 'rotate-180'
                        )} />
                      </button>

                      {/* Submenu items */}
                      <div className={cn(
                        'overflow-hidden transition-all duration-200 ease-in-out',
                        isExpanded ? 'max-h-[32rem] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'
                      )}>
                        <div className="space-y-0.5 pt-0.5 pb-1">
                          {group.items.map((item) => {
                            // ── Items with children → sub-header + indented children ──
                            if (item.children && item.children.length > 0) {
                              const ParentIcon = iconMap[item.icon] || LayoutDashboard;
                              return (
                                <div key={item.title} className="space-y-0.5">
                                  <div className="flex items-center gap-2.5 px-3 py-1.5 ml-2.5 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                                    <ParentIcon className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{item.title}</span>
                                  </div>
                                  {item.children.map((child) => {
                                    const Icon = iconMap[child.icon] || LayoutDashboard;
                                    const isActive = pathname === child.href || pathname?.startsWith(child.href + '/');
                                    const childClasses = cn(
                                      'flex items-center gap-3 rounded-lg px-3 py-2 ml-5 text-[13px] font-medium',
                                      'transition-all duration-200 ease-out',
                                      'border border-transparent',
                                      isActive
                                        ? 'bg-primary/8 text-primary border-primary/15 shadow-[0_0_16px_rgba(251,146,60,0.05)]'
                                        : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:border-primary/8',
                                      child.disabled && 'opacity-40 pointer-events-none',
                                    );
                                    return child.disabled ? (
                                      <span key={child.href} className={childClasses}>
                                        <Icon className="shrink-0 w-4 h-4 text-muted-foreground" />
                                        <span className="truncate">{child.title}</span>
                                        {child.badge && (
                                          <span className={cn('ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full', child.badge === 'Beta' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-muted-foreground/15 text-muted-foreground')}>{child.badge}</span>
                                        )}
                                      </span>
                                    ) : (
                                      <Link key={child.href} href={child.href} onClick={() => setMobileOpen(false)} className={childClasses}>
                                        <Icon className={cn('shrink-0 w-4 h-4 transition-colors duration-200', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                                        <span className="truncate">{child.title}</span>
                                        {child.badge && (
                                          <span className={cn('ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full', child.badge === 'Beta' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-muted-foreground/15 text-muted-foreground')}>{child.badge}</span>
                                        )}
                                      </Link>
                                    );
                                  })}
                                </div>
                              );
                            }
                            // ── Regular item (no children) ──
                            const Icon = iconMap[item.icon] || LayoutDashboard;
                            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                            const isNotifItem = item.icon === 'Bell';
                            const itemClasses = cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 ml-2.5 text-[13px] font-medium',
                              'transition-all duration-200 ease-out',
                              'border border-transparent',
                              isActive
                                ? 'bg-primary/8 text-primary border-primary/15 shadow-[0_0_16px_rgba(251,146,60,0.05)]'
                                : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:border-primary/8',
                              item.disabled && 'opacity-40 pointer-events-none',
                            );
                            return item.disabled ? (
                              <span key={item.href} className={itemClasses}>
                                <Icon className="shrink-0 w-4 h-4 text-muted-foreground" />
                                <span className="truncate">{item.title}</span>
                                {item.badge && (
                                  <span className={cn('ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full', item.badge === 'Beta' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-muted-foreground/15 text-muted-foreground')}>{item.badge}</span>
                                )}
                              </span>
                            ) : (
                              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={itemClasses}>
                                <Icon className={cn('shrink-0 w-4 h-4 transition-colors duration-200', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                                <span className="truncate">{item.title}</span>
                                {item.badge && (
                                  <span className={cn('ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full', item.badge === 'Beta' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-muted-foreground/15 text-muted-foreground')}>{item.badge}</span>
                                )}
                                {isNotifItem && unreadCount > 0 && (
                                  <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full px-1.5">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
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
