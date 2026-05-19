// ========================================
// CENTRALIZED SIDEBAR NAVIGATION BLUEPRINT
// 10-domain target structure. Permission-based visibility via requiredPermission.
// Roles arrays are fallback — set requiredPermission for new items.
// ========================================

import { NavGroup, NavItem, UserRole } from '@/types';
import { Permission, hasPermission } from './permissions';
import type { PermissionType } from './permissions';

export const navigationGroups: NavGroup[] = [
  // ── 1. BERANDA ───────────────────────────────────────────────────────
  {
    title: 'Beranda',
    icon: 'LayoutDashboard',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        roles: ['admin', 'musyrif', 'wali', 'santri', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
        requiredPermission: Permission.VIEW_DASHBOARD,
      },
    ],
  },

  // ── 2. MASTER DATA ────────────────────────────────────────────────────
  {
    title: 'Master Data',
    icon: 'Building2',
    items: [
      {
        title: 'Data Santri',
        href: '/dashboard/santri',
        icon: 'Users',
        roles: ['admin', 'musyrif', 'staff', 'guru', 'wali_kelas', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_SANTRI,
      },
      {
        title: 'Data Guru',
        href: '/dashboard/guru',
        icon: 'UsersRound',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_GURU,
      },
      {
        title: 'Data Kelas',
        href: '/dashboard/kelas',
        icon: 'School',
        roles: ['admin', 'kepala_kesiswaan', 'staff'],
        requiredPermission: Permission.VIEW_KELAS,
      },
    ],
  },

  // ── 3. AKADEMIK ───────────────────────────────────────────────────────
  // Future: split into Akademik Formal (Depag) and Akademik Pesantren (Madin/Madqur)
  {
    title: 'Akademik',
    icon: 'GraduationCap',
    items: [
      {
        title: 'Struktur Akademik',
        href: '/dashboard/struktur-akademik',
        icon: 'GraduationCap',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
      },
      {
        title: 'Mata Pelajaran',
        href: '/dashboard/mapel',
        icon: 'Library',
        roles: ['admin', 'kepala_kesiswaan', 'staff'],
        requiredPermission: Permission.VIEW_MAPEL,
      },
      {
        title: 'Distribusi Guru',
        href: '/dashboard/distribusi-guru',
        icon: 'UsersRound',
        roles: ['admin', 'kepala_kesiswaan', 'staff'],
        requiredPermission: Permission.VIEW_DISTRIBUSI_GURU,
      },
    ],
  },

  // ── 4. KESISWAAN ──────────────────────────────────────────────────────
  {
    title: 'Kesiswaan',
    icon: 'BookOpen',
    items: [
      {
        title: 'Governance Review',
        href: '/dashboard/governance',
        icon: 'Gavel',
        roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
        requiredPermission: Permission.VIEW_GOVERNANCE,
      },
      {
        title: 'Master Pelanggaran',
        href: '/dashboard/master-pelanggaran',
        icon: 'BookOpen',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_MASTER_PELANGGARAN,
      },
      {
        title: 'Pelanggaran',
        href: '/dashboard/pelanggaran',
        icon: 'AlertTriangle',
        roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
        requiredPermission: Permission.VIEW_PELANGGARAN,
      },
      {
        title: 'Hukuman',
        href: '/dashboard/hukuman',
        icon: 'Gavel',
        roles: ['admin', 'musyrif', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_HUKUMAN,
      },
      {
        title: 'Quest & Pemutihan',
        href: '/dashboard/quest',
        icon: 'Trophy',
        roles: ['admin', 'musyrif', 'santri', 'wali', 'kepala_kesiswaan', 'wali_kelas'],
        requiredPermission: Permission.VIEW_QUEST,
        requiredFeature: 'quest',
      },
      {
        title: 'Monitoring',
        href: '/dashboard/monitoring',
        icon: 'Activity',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_MONITORING,
        requiredFeature: 'monitoring',
      },
    ],
  },

  // ── 5. ASRAMA ─────────────────────────────────────────────────────────
  {
    title: 'Asrama',
    icon: 'Home',
    items: [
      {
        title: 'Asrama',
        href: '/dashboard/asrama',
        icon: 'Building2',
        roles: ['admin', 'musyrif', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_ASRAMA,
      },
    ],
  },

  // ── 6. KESEHATAN ──────────────────────────────────────────────────────
  {
    title: 'Kesehatan',
    icon: 'Stethoscope',
    items: [
      {
        title: 'Kunjungan UKS',
        href: '/dashboard/uks',
        icon: 'Stethoscope',
        roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_UKS,
        requiredFeature: 'kesehatan',
      },
      {
        title: 'Izin Berobat',
        href: '/dashboard/uks/izin-berobat',
        icon: 'FileText',
        roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_IZIN_BEROBAT,
        requiredFeature: 'kesehatan',
      },
    ],
  },

  // ── 7. ANALYTICS ──────────────────────────────────────────────────────
  // Generated analytics only — data aggregated from source domains
  {
    title: 'Analytics',
    icon: 'PieChart',
    items: [
      {
        title: 'Monitoring',
        href: '/dashboard/monitoring',
        icon: 'Activity',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_MONITORING,
        requiredFeature: 'monitoring',
      },
    ],
  },

  // ── 8. SISTEM ─────────────────────────────────────────────────────────
  {
    title: 'Sistem',
    icon: 'Settings',
    items: [
      {
        title: 'Notifikasi',
        href: '/dashboard/notifikasi',
        icon: 'Bell',
        roles: ['admin', 'musyrif', 'wali', 'santri', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
        requiredPermission: Permission.VIEW_NOTIFIKASI,
        requiredFeature: 'notifikasi',
      },
      {
        title: 'Import Data',
        href: '/dashboard/import',
        icon: 'Upload',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_IMPORT,
      },
      {
        title: 'Pengaturan',
        href: '/dashboard/pengaturan',
        icon: 'Settings',
        roles: ['admin', 'musyrif', 'wali', 'santri', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
        requiredPermission: Permission.VIEW_PENGATURAN,
      },
    ],
  },
];

// ── Reusable Visibility Helpers ────────────────────────────────────────

/**
 * Check if a nav item is visible for a given role.
 * Priority: requiredPermission > roles array > true (always show).
 */
function isNavItemVisible(item: NavItem, role: UserRole): boolean {
  if (item.requiredPermission) {
    return hasPermission(role, item.requiredPermission as PermissionType);
  }
  if (item.roles.length > 0) {
    return item.roles.includes(role);
  }
  return true;
}

/** Apply role-specific dynamic title overrides. */
function applyDynamicTitle(item: NavItem, role: UserRole): NavItem {
  let dynamicTitle = item.title;

  if (role === 'santri') {
    if (item.title === 'Quest & Pemutihan') dynamicTitle = 'Quest Saya';
    if (item.title === 'Pelanggaran') dynamicTitle = 'Pelanggaran Saya';
    if (item.title === 'Data Santri') dynamicTitle = 'Profil Saya';
  }

  if (role === 'wali') {
    if (item.title === 'Data Santri') dynamicTitle = 'Anak Saya / Progress Anak';
  }

  if (role === 'wali_kelas') {
    if (item.title === 'Data Santri') dynamicTitle = 'Santri Kelas';
  }

  return { ...item, title: dynamicTitle };
}

// ── Main Entry Point ───────────────────────────────────────────────────

/**
 * Returns navigation groups filtered for a specific role.
 *
 * Filtering logic per item:
 * 1. requiredPermission checked via centralized RBAC matrix (preferred)
 * 2. Falls back to roles array (backward compat)
 * 3. Feature flags (requiredFeature) apply on top — disabled items stay visible but greyed out
 */
export function getGroupedMenuForRole(
  role: UserRole,
  flags?: Record<string, boolean>,
): NavGroup[] {
  const flagCheck = flags ?? {};

  return navigationGroups
    .map((group) => {
      const filteredItems = group.items
        .filter((item) => isNavItemVisible(item, role))
        .map((item) => {
          const withTitle = applyDynamicTitle(item, role);
          if (item.requiredFeature && flagCheck[item.requiredFeature] === false) {
            return { ...withTitle, disabled: true };
          }
          return withTitle;
        });

      if (filteredItems.length === 0) return null;

      return { ...group, items: filteredItems };
    })
    .filter((g): g is NavGroup => g !== null);
}

/** @deprecated use getGroupedMenuForRole for grouped sidebar */
export function getMenuForRole(role: UserRole): NavItem[] {
  return getGroupedMenuForRole(role).flatMap((g) => g.items);
}
