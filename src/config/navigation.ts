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
        operationalData: true,
        governanceDomain: 'kesiswaan',
      },
      {
        title: 'KTA & RFID Smart Card',
        href: '/dashboard/santri/kta-rfid',
        icon: 'CreditCard',
        roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_SANTRI,
        operationalData: true,
      },
      {
        title: 'Gate Checkpoint RFID',
        href: '/dashboard/gate-checkpoint',
        icon: 'ShieldCheck',
        roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_SANTRI,
        operationalData: true,
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
        title: 'Keuangan & Limit Kelas',
        href: '/dashboard/kelas/monitoring-keuangan',
        icon: 'SlidersHorizontal',
        roles: ['admin', 'wali_kelas', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_KELAS,
        operationalData: true,
      },
      {
        title: 'POS Kantin RFID',
        href: '/dashboard/keuangan/kantin-nfc',
        icon: 'ShoppingBag',
        roles: ['admin', 'staff', 'musyrif'],
        requiredPermission: Permission.VIEW_SANTRI,
        operationalData: true,
      },
    ],
  },

  // ── 3. AKADEMIK FORMAL (Depag) ─────────────────────────────────────────
  {
    title: 'Akademik Formal',
    icon: 'GraduationCap',
    items: [
      {
        title: 'Struktur Akademik',
        href: '/dashboard/struktur-akademik',
        icon: 'GraduationCap',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
        governanceDomain: 'akademik',
        academicDomain: 'formal',
        operationalData: true,
      },
      {
        title: 'Mata Pelajaran',
        href: '/dashboard/mapel',
        icon: 'Library',
        roles: ['admin', 'kepala_kesiswaan', 'staff'],
        requiredPermission: Permission.VIEW_MAPEL,
        governanceDomain: 'akademik',
        academicDomain: 'formal',
        operationalData: true,
      },
      {
        title: 'Distribusi Guru',
        href: '/dashboard/distribusi-guru',
        icon: 'UsersRound',
        roles: ['admin', 'kepala_kesiswaan', 'staff'],
        requiredPermission: Permission.VIEW_DISTRIBUSI_GURU,
        governanceDomain: 'akademik',
        academicDomain: 'formal',
        operationalData: true,
      },
      {
        title: 'Kalender Akademik',
        href: '/dashboard/kalender-akademik',
        icon: 'Calendar',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_KALENDER_AKADEMIK,
        governanceDomain: 'akademik',
        academicDomain: 'formal',
        requiredFeature: 'akademik',
      },
      {
        title: 'Penilaian',
        href: '/dashboard/penilaian',
        icon: 'ClipboardCheck',
        roles: ['admin', 'kepala_kesiswaan', 'guru'],
        requiredPermission: Permission.VIEW_PENILAIAN,
        governanceDomain: 'akademik',
        academicDomain: 'formal',
        requiredFeature: 'akademik',
      },
      {
        title: 'Raport',
        href: '/dashboard/raport',
        icon: 'FileSpreadsheet',
        roles: ['admin', 'kepala_kesiswaan', 'wali_kelas', 'wali'],
        requiredPermission: Permission.VIEW_RAPORT,
        governanceDomain: 'akademik',
        academicDomain: 'formal',
        requiredFeature: 'rapor',
      },
    ],
  },

  // ── 4. AKADEMIK PESANTREN (Madin / MadQur umbrella) ────────────────────
  {
    title: 'Akademik Pesantren',
    icon: 'BookMarked',
    items: [
      {
        title: 'Madin',
        href: '',
        icon: 'BookOpen',
        roles: ['admin', 'kepala_kesiswaan', 'staff'],
        requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
        governanceDomain: 'akademik',
        academicDomain: 'pesantren',
        children: [
          {
            title: 'Struktur Akademik',
            href: '/dashboard/struktur-akademik',
            icon: 'GraduationCap',
            roles: ['admin', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
            governanceDomain: 'akademik',
            academicDomain: 'pesantren',
            operationalData: true,
          },
          {
            title: 'Mata Pelajaran',
            href: '/dashboard/mapel',
            icon: 'Library',
            roles: ['admin', 'kepala_kesiswaan', 'staff'],
            requiredPermission: Permission.VIEW_MAPEL,
            governanceDomain: 'akademik',
            academicDomain: 'pesantren',
            operationalData: true,
          },
          {
            title: 'Distribusi Guru',
            href: '/dashboard/distribusi-guru',
            icon: 'UsersRound',
            roles: ['admin', 'kepala_kesiswaan', 'staff'],
            requiredPermission: Permission.VIEW_DISTRIBUSI_GURU,
            governanceDomain: 'akademik',
            academicDomain: 'pesantren',
            operationalData: true,
          },
          {
            title: 'Kalender Akademik',
            href: '/dashboard/kalender-akademik',
            icon: 'Calendar',
            roles: ['admin', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_KALENDER_AKADEMIK,
            governanceDomain: 'akademik',
            academicDomain: 'pesantren',
            requiredFeature: 'akademik',
          },
          {
            title: 'Evaluasi',
            href: '/dashboard/evaluasi',
            icon: 'FileSearch',
            roles: ['admin', 'kepala_kesiswaan', 'guru'],
            requiredPermission: Permission.VIEW_EVALUASI,
            governanceDomain: 'akademik',
            academicDomain: 'pesantren',
            requiredFeature: 'akademik',
          },
          {
            title: 'Raport',
            href: '/dashboard/raport',
            icon: 'FileSpreadsheet',
            roles: ['admin', 'kepala_kesiswaan', 'wali_kelas', 'wali'],
            requiredPermission: Permission.VIEW_RAPORT,
            governanceDomain: 'akademik',
            academicDomain: 'pesantren',
            requiredFeature: 'rapor',
          },
        ],
      },
      {
        title: 'MadQur',
        href: '',
        icon: 'BookOpen',
        roles: ['admin', 'kepala_kesiswaan', 'staff'],
        requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
        governanceDomain: 'akademik',
        academicDomain: 'pesantren',
        children: [
          {
            title: 'Struktur Akademik',
            href: '/dashboard/struktur-akademik',
            icon: 'GraduationCap',
            roles: ['admin', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_STRUKTUR_AKADEMIK,
            governanceDomain: 'akademik',
            academicDomain: 'pesantren',
            operationalData: true,
          },
          {
            title: 'Mata Pelajaran',
            href: '/dashboard/mapel',
            icon: 'Library',
            roles: ['admin', 'kepala_kesiswaan', 'staff'],
            requiredPermission: Permission.VIEW_MAPEL,
            governanceDomain: 'akademik',
            academicDomain: 'pesantren',
            operationalData: true,
          },
          {
            title: 'Distribusi Guru',
            href: '/dashboard/distribusi-guru',
            icon: 'UsersRound',
            roles: ['admin', 'kepala_kesiswaan', 'staff'],
            requiredPermission: Permission.VIEW_DISTRIBUSI_GURU,
            governanceDomain: 'akademik',
            academicDomain: 'pesantren',
            operationalData: true,
          },
          {
            title: 'Kalender Akademik',
            href: '/dashboard/kalender-akademik',
            icon: 'Calendar',
            roles: ['admin', 'kepala_kesiswaan'],
            requiredPermission: Permission.VIEW_KALENDER_AKADEMIK,
            governanceDomain: 'akademik',
            academicDomain: 'pesantren',
            requiredFeature: 'akademik',
          },
          {
            title: 'Evaluasi',
            href: '/dashboard/evaluasi',
            icon: 'FileSearch',
            roles: ['admin', 'kepala_kesiswaan', 'guru'],
            requiredPermission: Permission.VIEW_EVALUASI,
            governanceDomain: 'akademik',
            academicDomain: 'pesantren',
            requiredFeature: 'akademik',
          },
          {
            title: 'Raport',
            href: '/dashboard/raport',
            icon: 'FileSpreadsheet',
            roles: ['admin', 'kepala_kesiswaan', 'wali_kelas', 'wali'],
            requiredPermission: Permission.VIEW_RAPORT,
            governanceDomain: 'akademik',
            academicDomain: 'pesantren',
            requiredFeature: 'rapor',
          },
        ],
      },
    ],
  },

  // ── 5. KESISWAAN ──────────────────────────────────────────────────────
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
        governanceDomain: 'kesiswaan',
        operationalData: true,
      },
      {
        title: 'Master Pelanggaran',
        href: '/dashboard/master-pelanggaran',
        icon: 'BookOpen',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_MASTER_PELANGGARAN,
        governanceDomain: 'kesiswaan',
        operationalData: true,
      },
      {
        title: 'Pelanggaran',
        href: '/dashboard/pelanggaran',
        icon: 'AlertTriangle',
        roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
        requiredPermission: Permission.VIEW_PELANGGARAN,
        governanceDomain: 'kesiswaan',
        operationalData: true,
      },
      {
        title: 'Hukuman',
        href: '/dashboard/hukuman',
        icon: 'Gavel',
        roles: ['admin', 'musyrif', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_HUKUMAN,
        governanceDomain: 'kesiswaan',
        operationalData: true,
      },
      {
        title: 'Quest & Pemutihan',
        href: '/dashboard/quest',
        icon: 'Trophy',
        roles: ['admin', 'musyrif', 'santri', 'wali', 'kepala_kesiswaan', 'wali_kelas'],
        requiredPermission: Permission.VIEW_QUEST,
        requiredFeature: 'quest',
        governanceDomain: 'kesiswaan',
        operationalData: true,
      },
      {
        title: 'Monitoring',
        href: '/dashboard/monitoring',
        icon: 'Activity',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_MONITORING,
        requiredFeature: 'monitoring',
        governanceDomain: 'kesiswaan',
        generatedData: true,
        analyticsSource: true,
      },
    ],
  },

  // ── 6. ASRAMA ─────────────────────────────────────────────────────────
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
        governanceDomain: 'asrama',
        operationalData: true,
      },
    ],
  },

  // ── 7. KESEHATAN ──────────────────────────────────────────────────────
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
        governanceDomain: 'kesehatan',
        operationalData: true,
      },
      {
        title: 'Izin Berobat',
        href: '/dashboard/uks/izin-berobat',
        icon: 'FileText',
        roles: ['admin', 'musyrif', 'staff', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_IZIN_BEROBAT,
        requiredFeature: 'kesehatan',
        governanceDomain: 'kesehatan',
        operationalData: true,
      },
    ],
  },

  // ── 8. ADMINISTRASI ─────────────────────────────────────────────────────
  // New domain — route placeholders, feature-gated behind 'administrasi' flag
  {
    title: 'Administrasi',
    icon: 'Megaphone',
    items: [
      {
        title: 'Pengumuman',
        href: '/dashboard/pengumuman',
        icon: 'Megaphone',
        roles: ['admin', 'kepala_kesiswaan', 'staff', 'musyrif', 'guru', 'wali_kelas'],
        requiredPermission: Permission.VIEW_PENGUMUMAN,
        requiredFeature: 'administrasi',
        governanceDomain: 'administrasi',
        operationalData: true,
      },
      {
        title: 'Surat',
        href: '/dashboard/surat',
        icon: 'FileText',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_SURAT,
        requiredFeature: 'administrasi',
        governanceDomain: 'administrasi',
        operationalData: true,
      },
      {
        title: 'Arsip',
        href: '/dashboard/arsip',
        icon: 'Archive',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_ARSIP,
        requiredFeature: 'administrasi',
        governanceDomain: 'administrasi',
        operationalData: true,
      },
      {
        title: 'Kalender Kegiatan',
        href: '/dashboard/kalender-kegiatan',
        icon: 'Calendar',
        roles: ['admin', 'kepala_kesiswaan', 'staff', 'musyrif'],
        requiredPermission: Permission.VIEW_KALENDER_KEGIATAN,
        requiredFeature: 'administrasi',
        governanceDomain: 'administrasi',
        operationalData: true,
      },
      {
        title: 'Broadcast Informasi',
        href: '/dashboard/broadcast',
        icon: 'Radio',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_BROADCAST,
        requiredFeature: 'administrasi',
        governanceDomain: 'administrasi',
        operationalData: true,
      },
    ],
  },

  // ── 9. ANALYTICS ──────────────────────────────────────────────────────
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
        generatedData: true,
        analyticsSource: true,
      },
    ],
  },

  // ── 10. SISTEM ─────────────────────────────────────────────────────────
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
        notificationAware: true,
        governanceDomain: 'sistem',
      },
      {
        title: 'Import Data',
        href: '/dashboard/import',
        icon: 'Upload',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.VIEW_IMPORT,
        operationalData: true,
        governanceDomain: 'sistem',
      },
      {
        title: 'Pengaturan',
        href: '/dashboard/pengaturan',
        icon: 'Settings',
        roles: ['admin', 'musyrif', 'wali', 'santri', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas'],
        requiredPermission: Permission.VIEW_PENGATURAN,
        maintenanceAware: true,
        governanceDomain: 'sistem',
      },
      {
        title: 'Integrasi Tenant SaaS',
        href: '/dashboard/pengaturan/tenant-integrasi',
        icon: 'Key',
        roles: ['admin'],
        requiredPermission: Permission.MANAGE_PENGATURAN,
        governanceDomain: 'sistem',
      },
      {
        title: 'Feature Toggle',
        href: '/dashboard/fitur',
        icon: 'SlidersHorizontal',
        roles: ['admin'],
        requiredPermission: Permission.MANAGE_PENGATURAN,
        governanceDomain: 'sistem',
        visualState: 'internal',
      },
      {
        title: 'Governance Settings',
        href: '/dashboard/governance-settings',
        icon: 'Gavel',
        roles: ['admin', 'kepala_kesiswaan'],
        requiredPermission: Permission.MANAGE_GOVERNANCE,
        governanceDomain: 'sistem',
        visualState: 'internal',
      },
      {
        title: 'Maintenance',
        href: '/dashboard/maintenance-settings',
        icon: 'Wrench',
        roles: ['admin'],
        requiredPermission: Permission.MANAGE_PENGATURAN,
        governanceDomain: 'sistem',
        maintenanceAware: true,
        visualState: 'internal',
      },
      {
        title: 'Audit Log',
        href: '/dashboard/audit-log',
        icon: 'ScrollText',
        roles: ['admin'],
        requiredPermission: Permission.MANAGE_PENGATURAN,
        governanceDomain: 'sistem',
        visualState: 'beta',
      },
      {
        title: 'Integrasi',
        href: '/dashboard/integrasi',
        icon: 'Link2',
        roles: ['admin'],
        requiredPermission: Permission.MANAGE_IMPORT,
        governanceDomain: 'sistem',
        visualState: 'beta',
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
