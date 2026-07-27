// ========================================
// CENTRALIZED SIDEBAR NAVIGATION BLUEPRINT
// 10-domain target structure. Permission-based visibility via requiredPermission.
// Roles arrays are fallback — set requiredPermission for new items.
// ========================================

import { NavGroup, NavItem, UserRole } from '@/types';
import { Permission, hasPermission } from './permissions';
import type { PermissionType } from './permissions';

export const navigationGroups: NavGroup[] = [
  // ── 0. SAAS PLATFORM CONSOLE (Developer & Super Admin) ─────────────────
  {
    title: 'SaaS Platform Console',
    icon: 'Shield',
    items: [
      {
        title: 'Dasbor Utama (Helicopter View)',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        roles: ['developer', 'super_admin'],
        requiredPermission: Permission.MANAGE_TENANTS,
      },
      {
        title: 'Manajemen Tenant & Impersonation',
        href: '/dashboard/saas/tenants',
        icon: 'Building2',
        roles: ['developer', 'super_admin'],
        requiredPermission: Permission.MANAGE_TENANTS,
        badge: 'Utama',
      },
      {
        title: 'Manajemen Modul & Feature Flags',
        href: '/dashboard/saas/modul-fitur',
        icon: 'Sliders',
        roles: ['developer', 'super_admin'],
        requiredPermission: Permission.MANAGE_TENANTS,
      },
      {
        title: 'Paket & Penagihan (Billing)',
        href: '/dashboard/saas/paket-billing',
        icon: 'CreditCard',
        roles: ['developer', 'super_admin'],
        requiredPermission: Permission.MANAGE_TENANTS,
      },
      {
        title: 'Infrastruktur & Log Pemantauan',
        href: '/dashboard/saas/infrastruktur-log',
        icon: 'Activity',
        roles: ['developer', 'super_admin'],
        requiredPermission: Permission.MANAGE_TENANTS,
      },
      {
        title: 'Pengaturan Global & Broadcast',
        href: '/dashboard/saas/pengaturan-global',
        icon: 'Settings',
        roles: ['developer', 'super_admin'],
        requiredPermission: Permission.MANAGE_TENANTS,
      },
      {
        title: 'Integrasi Gateway Mandiri',
        href: '/dashboard/pengaturan/tenant-integrasi',
        icon: 'Key',
        roles: ['developer', 'super_admin'],
        requiredPermission: Permission.MANAGE_TENANTS,
      },
    ],
  },

  // ── 1. BERANDA ───────────────────────────────────────────────────────
  {
    title: 'Beranda',
    icon: 'LayoutDashboard',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        roles: ['super_admin', 'developer', 'admin', 'musyrif', 'wali', 'santri', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
        requiredPermission: Permission.VIEW_DASHBOARD,
      },
    ],
  },

  // ── 2. ADMIN KANTOR ───────────────────────────────────────────────────
  {
    title: 'Admin Kantor',
    icon: 'Building2',
    items: [
      {
        title: 'Program Madrasah',
        href: '',
        icon: 'BookMarked',
        roles: ['admin', 'kepala_kesiswaan', 'staff'],
        requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
        children: [
          {
            title: 'Master Madrasah',
            href: '/dashboard/kurikulum/master',
            icon: 'Settings',
            roles: ['admin', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
          },
          {
            title: 'Master Ekstrakurikuler',
            href: '/dashboard/ekstrakurikuler',
            icon: 'Trophy',
            roles: ['admin', 'kepala_kesiswaan', 'staff'],
            requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
          },
        ],
      },
      {
        title: 'Master Data',
        href: '',
        icon: 'Building2',
        roles: ['admin', 'musyrif', 'staff', 'guru', 'wali_kelas', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_SANTRI,
        children: [
          {
            title: 'Data Santri',
            href: '/dashboard/santri',
            icon: 'Users',
            roles: ['admin', 'musyrif', 'staff', 'guru', 'wali_kelas', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_SANTRI,
            operationalData: true,
            governanceDomain: 'kesiswaan',
          },
          {
            title: 'Data Guru',
            href: '/dashboard/guru',
            icon: 'UsersRound',
            roles: ['admin', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_GURU,
            operationalData: true,
          },
          {
            title: 'Data Kelas',
            href: '/dashboard/kelas',
            icon: 'School',
            roles: ['admin', 'kepala_kesiswaan', 'staff'],
            requiredPermission: Permission.VIEW_KELAS,
            operationalData: true,
          },
          {
            title: 'KTA & RFID Smart Card',
            href: '/dashboard/santri/kta-rfid',
            icon: 'CreditCard',
            roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_SANTRI,
            operationalData: true,
          },
        ],
      },
    ],
  },

  // ── 3. PROGRAM KURIKULUM ───────────────────────────────────────────────
  {
    title: 'Program Kurikulum',
    icon: 'GraduationCap',
    items: [
      {
        title: 'Akademik Formal',
        href: '',
        icon: 'GraduationCap',
        roles: ['admin', 'kepala_kesiswaan', 'staff', 'guru'],
        requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
        academicDomain: 'formal',
        children: [
          {
            title: 'Struktur Akademik',
            href: '/dashboard/struktur-akademik?type=formal',
            icon: 'GraduationCap',
            roles: ['admin', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
          },
          {
            title: 'Mata Pelajaran',
            href: '/dashboard/mapel?type=formal',
            icon: 'Library',
            roles: ['admin', 'kepala_kesiswaan', 'staff'],
            requiredPermission: Permission.VIEW_MAPEL,
          },
          {
            title: 'Distribusi Guru',
            href: '/dashboard/distribusi-guru?type=formal',
            icon: 'UsersRound',
            roles: ['admin', 'kepala_kesiswaan', 'staff'],
            requiredPermission: Permission.VIEW_DISTRIBUSI_GURU,
          },
          {
            title: 'Kalender Akademik',
            href: '/dashboard/kalender-akademik?type=formal',
            icon: 'Calendar',
            roles: ['admin', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_KALENDER_AKADEMIK,
          },
          {
            title: 'Evaluasi & Raport',
            href: '/dashboard/raport?type=formal',
            icon: 'FileSpreadsheet',
            roles: ['admin', 'kepala_kesiswaan', 'wali_kelas', 'wali'],
            requiredPermission: Permission.VIEW_RAPORT,
          },
        ],
      },
      {
        title: 'Akademik Pesantren',
        href: '',
        icon: 'BookOpen',
        roles: ['admin', 'kepala_kesiswaan', 'staff', 'guru'],
        requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
        academicDomain: 'pesantren',
        children: [
          {
            title: 'Struktur Akademik Madin',
            href: '/dashboard/struktur-akademik?type=madin',
            icon: 'GraduationCap',
            roles: ['admin', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
          },
          {
            title: 'Mata Pelajaran Madin',
            href: '/dashboard/mapel?type=madin',
            icon: 'Library',
            roles: ['admin', 'kepala_kesiswaan', 'staff'],
            requiredPermission: Permission.VIEW_MAPEL,
          },
          {
            title: 'Distribusi Guru Madin',
            href: '/dashboard/distribusi-guru?type=madin',
            icon: 'UsersRound',
            roles: ['admin', 'kepala_kesiswaan', 'staff'],
            requiredPermission: Permission.VIEW_DISTRIBUSI_GURU,
          },
          {
            title: 'Kalender Madin',
            href: '/dashboard/kalender-akademik?type=madin',
            icon: 'Calendar',
            roles: ['admin', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_KALENDER_AKADEMIK,
          },
          {
            title: 'Evaluasi & Raport Madin',
            href: '/dashboard/raport?type=madin',
            icon: 'FileSpreadsheet',
            roles: ['admin', 'kepala_kesiswaan', 'wali_kelas', 'wali'],
            requiredPermission: Permission.VIEW_RAPORT,
          },
        ],
      },
      {
        title: "Akademik Qur'an",
        href: '',
        icon: 'Trophy',
        roles: ['admin', 'kepala_kesiswaan', 'staff', 'guru'],
        requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
        academicDomain: 'quran',
        children: [
          {
            title: 'Monitoring Tahfidz & Ziyadah',
            href: '/dashboard/tahfidz',
            icon: 'Trophy',
            roles: ['admin', 'kepala_kesiswaan', 'guru', 'wali'],
            requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
          },
          {
            title: 'Setoran Harian & Murojaah',
            href: '/dashboard/setoran-quran',
            icon: 'BookOpen',
            roles: ['admin', 'kepala_kesiswaan', 'guru'],
            requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
          },
          {
            title: "Rapor & Ujian Qur'an",
            href: '/dashboard/raport-quran',
            icon: 'FileSpreadsheet',
            roles: ['admin', 'kepala_kesiswaan', 'wali'],
            requiredPermission: Permission.VIEW_RAPORT,
          },
        ],
      },
    ],
  },

  // ── 4. KESISWAAN ──────────────────────────────────────────────────────
  {
    title: 'Kesiswaan',
    icon: 'BookOpen',
    items: [
      {
        title: 'Kesiswaan',
        href: '',
        icon: 'BookOpen',
        roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
        requiredPermission: Permission.VIEW_PELANGGARAN,
        children: [
          {
            title: 'Governance & Kedisiplinan',
            href: '/dashboard/governance',
            icon: 'Gavel',
            roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_GOVERNANCE,
          },
          {
            title: 'E-Tatib & Point Pelanggaran',
            href: '/dashboard/pelanggaran',
            icon: 'AlertTriangle',
            roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
            requiredPermission: Permission.VIEW_PELANGGARAN,
          },
          {
            title: 'Sidang & Hukuman Disiplin',
            href: '/dashboard/hukuman',
            icon: 'Gavel',
            roles: ['admin', 'musyrif', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_HUKUMAN,
          },
          {
            title: 'Quest & Pemutihan Poin',
            href: '/dashboard/quest',
            icon: 'Trophy',
            roles: ['admin', 'musyrif', 'santri', 'wali', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_QUEST,
          },
          {
            title: 'Asrama & Kamar Santri',
            href: '/dashboard/asrama',
            icon: 'Home',
            roles: ['admin', 'musyrif', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_ASRAMA,
          },
        ],
      },
    ],
  },

  // ── 5. KESEHATAN ──────────────────────────────────────────────────────
  {
    title: 'Kesehatan',
    icon: 'Stethoscope',
    items: [
      {
        title: 'Kesehatan',
        href: '',
        icon: 'Stethoscope',
        roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_UKS,
        children: [
          {
            title: 'Kunjungan UKS & Rekam Medis',
            href: '/dashboard/uks',
            icon: 'Stethoscope',
            roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_UKS,
          },
          {
            title: 'Izin Berobat & Rujukan RS',
            href: '/dashboard/uks/izin-berobat',
            icon: 'FileText',
            roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_IZIN_BEROBAT,
          },
        ],
      },
    ],
  },

  // ── 6. KEAMANAN ───────────────────────────────────────────────────────
  {
    title: 'Keamanan',
    icon: 'ShieldCheck',
    items: [
      {
        title: 'Gate Checkpoint RFID',
        href: '',
        icon: 'ShieldCheck',
        roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_SANTRI,
        children: [
          {
            title: 'Terminal Satpam & Pos Gerbang',
            href: '/dashboard/gate-checkpoint',
            icon: 'ShieldCheck',
            roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_SANTRI,
          },
          {
            title: 'Log Presensi & Izin Gerbang',
            href: '/dashboard/gate-checkpoint/log',
            icon: 'FileSearch',
            roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_SANTRI,
          },
        ],
      },
    ],
  },

  // ── 7. KEUANGAN ───────────────────────────────────────────────────────
  {
    title: 'Keuangan',
    icon: 'SlidersHorizontal',
    items: [
      {
        title: 'Keuangan Pesantren',
        href: '',
        icon: 'CreditCard',
        roles: ['admin', 'staff', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_KELAS,
        children: [
          {
            title: 'Tagihan SPP & Flip Payment',
            href: '/dashboard/keuangan/spp',
            icon: 'CreditCard',
            roles: ['admin', 'staff'],
            requiredPermission: Permission.VIEW_KELAS,
          },
          {
            title: 'Invois & Webhook Callback Log',
            href: '/dashboard/keuangan/invois',
            icon: 'FileText',
            roles: ['admin', 'staff'],
            requiredPermission: Permission.VIEW_KELAS,
          },
        ],
      },
      {
        title: 'Keuangan Santri',
        href: '',
        icon: 'SlidersHorizontal',
        roles: ['admin', 'staff', 'wali_kelas'],
        requiredPermission: Permission.VIEW_KELAS,
        children: [
          {
            title: 'Saldo Wallet RFID Santri',
            href: '/dashboard/keuangan/limit-santri',
            icon: 'CreditCard',
            roles: ['admin', 'staff', 'wali_kelas'],
            requiredPermission: Permission.VIEW_KELAS,
          },
          {
            title: 'Limit Belanja Harian Santri',
            href: '/dashboard/kelas/monitoring-keuangan',
            icon: 'SlidersHorizontal',
            roles: ['admin', 'wali_kelas', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_KELAS,
          },
        ],
      },
      {
        title: 'Kantin',
        href: '',
        icon: 'Store',
        roles: ['admin', 'staff', 'musyrif'],
        requiredPermission: Permission.VIEW_SANTRI,
        children: [
          {
            title: 'POS Kantin Cashless RFID',
            href: '/dashboard/keuangan/kantin-nfc',
            icon: 'ShoppingBag',
            roles: ['admin', 'staff', 'musyrif'],
            requiredPermission: Permission.VIEW_SANTRI,
          },
          {
            title: 'Manajemen Multi-Kantin',
            href: '/dashboard/keuangan/kantin-management',
            icon: 'Store',
            roles: ['admin', 'staff'],
            requiredPermission: Permission.VIEW_SANTRI,
          },
        ],
      },
    ],
  },

  // ── 8. SETTING ────────────────────────────────────────────────────────
  {
    title: 'Setting',
    icon: 'Settings',
    items: [
      {
        title: 'Sistem',
        href: '',
        icon: 'Settings',
        roles: ['admin', 'musyrif', 'wali', 'santri', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
        requiredPermission: Permission.VIEW_NOTIFIKASI,
        children: [
          {
            title: 'Notifikasi',
            href: '/dashboard/notifikasi',
            icon: 'Bell',
            roles: ['admin', 'musyrif', 'wali', 'santri', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
            requiredPermission: Permission.VIEW_NOTIFIKASI,
          },
          {
            title: 'Import Data Batch',
            href: '/dashboard/import',
            icon: 'Upload',
            roles: ['admin', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_IMPORT,
          },
          {
            title: 'Pengaturan Global',
            href: '/dashboard/pengaturan',
            icon: 'Settings',
            roles: ['admin', 'musyrif', 'wali', 'santri', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
            requiredPermission: Permission.VIEW_PENGATURAN,
          },
          {
            title: 'Integrasi Payment, WA & Drive',
            href: '/dashboard/pengaturan/tenant-integrasi',
            icon: 'Key',
            roles: ['developer', 'super_admin', 'admin'],
            requiredPermission: Permission.MANAGE_PENGATURAN,
          },
          {
            title: 'Tampilan Login (CMS)',
            href: '/dashboard/pengaturan/tampilan-login',
            icon: 'LayoutTemplate',
            roles: ['developer', 'super_admin', 'admin'],
            requiredPermission: Permission.MANAGE_PENGATURAN,
          },
        ],
      },
      {
        title: 'User & Role',
        href: '/dashboard/pengaturan/manajemen-user-role',
        icon: 'UsersRound',
        roles: ['admin', 'kepala_kesiswaan', 'staff'],
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
  // Developer & Super Admin only see SaaS Platform Console items, not internal tenant operations!
  if (role === 'developer' || role === 'super_admin') {
    const isPlatformItem = 
      item.href === '/dashboard' ||
      item.href.startsWith('/dashboard/saas') ||
      item.href.startsWith('/dashboard/pengaturan/tenant-integrasi') ||
      item.href.startsWith('/dashboard/audit-log');
    return isPlatformItem;
  }

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
 * 1. visualState 'hidden' → excluded entirely
 * 2. requiredPermission checked via centralized RBAC matrix (preferred)
 * 3. Falls back to roles array (backward compat)
 * 4. Feature flags (requiredFeature) → disabled items stay visible but greyed out
 * 5. visualState 'beta'/'internal' → badge applied, link stays active
 */
export function getGroupedMenuForRole(
  role: UserRole,
  flags?: Record<string, boolean>,
): NavGroup[] {
  const flagCheck = flags ?? {};
  const isDevOrSuperAdmin = role === 'developer' || role === 'super_admin';

  const processItem = (item: NavItem): NavItem | null => {
    if (item.visualState === 'hidden') return null;
    if (!isNavItemVisible(item, role)) return null;

    const withTitle = applyDynamicTitle(item, role);
    let processed = withTitle;

    if (item.requiredFeature && flagCheck[item.requiredFeature] === false) {
      processed = { ...processed, disabled: true };
    }
    if (withTitle.visualState === 'disabled') {
      processed = { ...processed, disabled: true };
    }
    if (withTitle.visualState === 'beta') {
      processed = { ...processed, badge: 'Beta' };
    }
    if (withTitle.visualState === 'internal') {
      processed = { ...processed, badge: 'Internal' };
    }

    // Recursively process children
    if (processed.children && processed.children.length > 0) {
      const processedChildren = processed.children
        .map((child) => processItem(child))
        .filter((c): c is NavItem => c !== null);

      if (processedChildren.length === 0) return null;
      processed = { ...processed, children: processedChildren };
    }

    return processed;
  };

  return navigationGroups
    .map((group) => {
      // Developer / Super Admin ONLY get the SaaS Platform Console group!
      if (isDevOrSuperAdmin && group.title !== 'SaaS Platform Console') {
        return null;
      }
      // Tenant roles (admin, musyrif, santri, etc.) NEVER get the SaaS Platform Console group!
      if (!isDevOrSuperAdmin && group.title === 'SaaS Platform Console') {
        return null;
      }

      const filteredItems = group.items
        .map((item) => processItem(item))
        .filter((i): i is NavItem => i !== null);

      if (filteredItems.length === 0) return null;

      return { ...group, items: filteredItems };
    })
    .filter((g): g is NavGroup => g !== null);
}

/** @deprecated use getGroupedMenuForRole for grouped sidebar */
export function getMenuForRole(role: UserRole): NavItem[] {
  return getGroupedMenuForRole(role).flatMap((g) => g.items);
}
