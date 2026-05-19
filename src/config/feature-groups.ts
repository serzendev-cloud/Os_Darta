// ========================================
// ADVANCED FEATURE TOGGLE GROUPS
// Submenu-level refinement beyond binary feature flags.
// Default OFF for advanced modules — toggle ON at runtime via appConfig.
// ========================================

export interface FeatureToggleGroup {
  domain: string;
  key: string;
  label: string;
  enabled: boolean;
  subFeatures: string[];
}

export const advancedFeatureGroups: FeatureToggleGroup[] = [
  {
    domain: 'Kesiswaan',
    key: 'pembinaan',
    label: 'Pembinaan & Konseling',
    enabled: false,
    subFeatures: ['/dashboard/pembinaan'],
  },
  {
    domain: 'Kesiswaan',
    key: 'monitoring_disiplin',
    label: 'Monitoring Disiplin Lanjutan',
    enabled: false,
    subFeatures: ['/dashboard/monitoring-disiplin'],
  },
  {
    domain: 'Kesehatan',
    key: 'riwayat_penyakit',
    label: 'Riwayat Penyakit',
    enabled: false,
    subFeatures: [],
  },
  {
    domain: 'Kesehatan',
    key: 'rujukan',
    label: 'Rujukan & Tindakan',
    enabled: false,
    subFeatures: [],
  },
  {
    domain: 'Administrasi',
    key: 'broadcast',
    label: 'Broadcast Informasi',
    enabled: false,
    subFeatures: ['/dashboard/broadcast'],
  },
  {
    domain: 'Administrasi',
    key: 'dokumentasi',
    label: 'Dokumentasi & Arsip',
    enabled: false,
    subFeatures: ['/dashboard/arsip'],
  },
  {
    domain: 'Sistem',
    key: 'developer_mode',
    label: 'Developer Mode',
    enabled: false,
    subFeatures: [],
  },
  {
    domain: 'Sistem',
    key: 'audit_log',
    label: 'Audit Log Viewer',
    enabled: false,
    subFeatures: [],
  },
];

/** Check if a toggle group is enabled by key. */
export function isToggleGroupEnabled(key: string): boolean {
  const group = advancedFeatureGroups.find((g) => g.key === key);
  return group?.enabled ?? false;
}
