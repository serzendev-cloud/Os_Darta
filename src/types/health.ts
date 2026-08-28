// ========================================
// Health Ecosystem Types
// Health Governance & Santri Care System
// ========================================

// ── Enums ──────────────────────────────────────────────────────

export type HealthVisitCategory =
  | 'pemeriksaan'
  | 'observasi'
  | 'tindakan'
  | 'rujukan'
  | 'izin_berobat';

export type HealthSeverity =
  | 'ringan'
  | 'sedang'
  | 'darurat';

export type HealthVisitStatus =
  | 'observasi'
  | 'istirahat'
  | 'rawat_sementara'
  | 'perlu_berobat_luar'
  | 'selesai'
  | 'dirujuk';

export type HealthPermissionStatus =
  | 'diajukan'
  | 'diteruskan_kesiswaan'
  | 'disetujui'
  | 'ditolak'
  | 'dalam_perjalanan'
  | 'kembali'
  | 'selesai';

// ── App Types ──────────────────────────────────────────────────

/** A single UKS visit record. */
export interface HealthVisit {
  id: string;
  santriId: string;
  santriName: string;
  keluhan: string;
  category: HealthVisitCategory;
  severity: HealthSeverity;
  status: HealthVisitStatus;
  /** Petugas yang menangani */
  petugasId?: string;
  petugasName?: string;
  tindakan?: string;
  catatan?: string;
  masukAt: string;          // ISO
  selesaiAt?: string;       // ISO
  durasiMenit?: number;
  /** FK ke HealthPermission jika dirujuk keluar */
  permissionId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Health permission for berobat keluar pondok. */
export interface HealthPermission {
  id: string;
  santriId: string;
  santriName: string;
  healthVisitId: string;    // FK ke HealthVisit
  keluhan: string;
  severity: HealthSeverity;
  status: HealthPermissionStatus;
  /** Tempat berobat */
  tujuanBerobat: string;
  alasan: string;
  /** Pengawas wajib */
  requiresSupervisor: boolean;
  supervisorId?: string;
  supervisorName?: string;
  /** Santri pendamping wajib dipilih Kepala Kesiswaan saat persetujuan */
  companionSantriId?: string;
  companionSantriName?: string;
  /** Forwarding info by Wali Kelas */
  forwardedById?: string;
  forwardedByName?: string;
  requestedById: string;
  requestedByName: string;
  approvedById?: string;
  approvedByName?: string;
  keluarAt?: string;
  kembaliAt?: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}



// ── Health Timeline Entry (computed, not stored) ───────────────

export interface HealthTimelineEntry {
  time: string;
  label: string;
  type: 'masuk' | 'tindakan' | 'observasi' | 'rujukan' | 'selesai' | 'izin';
  detail?: string;
}
