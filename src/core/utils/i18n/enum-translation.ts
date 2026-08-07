// ========================================
// Centralized Enum Translation Utilities
// Traceability: CIP-WP-004 | BRR-MDS-007
// ========================================

import { Gender, TenantStatus, GeneralStatus, UserRole } from '../../domain/enums';
import { SantriState } from '@/modules/santri/domain/state-machine';

export interface EnumMapping {
  display: string;
  db: string;
  altDb?: string[];
  altDisplay?: string[];
}

export const translationMap: Record<string, Record<string, EnumMapping>> = {
  Gender: {
    [Gender.MALE]: { display: 'Laki-laki', db: 'L', altDisplay: ['Laki-Laki', 'Putra'] },
    [Gender.FEMALE]: { display: 'Perempuan', db: 'P', altDisplay: ['Putri'] },
  },
  TenantStatus: {
    [TenantStatus.ACTIVE]: { display: 'Aktif', db: 'active' },
    [TenantStatus.SUSPENDED]: { display: 'Ditangguhkan', db: 'suspended' },
    [TenantStatus.TRIAL]: { display: 'Uji Coba', db: 'trial' },
  },
  GeneralStatus: {
    [GeneralStatus.ACTIVE]: { display: 'Aktif', db: 'active', altDb: ['aktif'] },
    [GeneralStatus.INACTIVE]: { display: 'Non-Aktif', db: 'inactive', altDb: ['non-aktif', 'non_aktif'] },
  },
  GeneralStatusIndo: {
    [GeneralStatus.ACTIVE]: { display: 'Aktif', db: 'aktif', altDb: ['active'] },
    [GeneralStatus.INACTIVE]: { display: 'Non-Aktif', db: 'non-aktif', altDb: ['inactive', 'non_aktif'] },
  },
  SantriState: {
    [SantriState.DRAFT]: { display: 'Draft', db: 'draft', altDb: ['DRAFT'] },
    [SantriState.REGISTERED]: { display: 'Terdaftar', db: 'registered', altDb: ['REGISTERED'] },
    [SantriState.VERIFIED]: { display: 'Terverifikasi', db: 'verified', altDb: ['VERIFIED'] },
    [SantriState.ACTIVE]: { display: 'Aktif', db: 'aktif', altDb: ['ACTIVE', 'active'] },
    [SantriState.SUSPENDED]: { display: 'Cuti/Skorsing', db: 'cuti', altDb: ['SUSPENDED', 'suspended', 'skors', 'skorsing'] },
    [SantriState.TRANSFERRED]: { display: 'Mutasi/Pindah', db: 'pindah', altDb: ['TRANSFERRED', 'transferred', 'mutasi'] },
    [SantriState.GRADUATED]: { display: 'Lulus', db: 'lulus', altDb: ['GRADUATED', 'graduated'] },
    [SantriState.ALUMNI]: { display: 'Alumni', db: 'alumni', altDb: ['ALUMNI', 'alumni', 'keluar'] },
    [SantriState.ARCHIVED]: { display: 'Diarsipkan', db: 'archived', altDb: ['ARCHIVED'] },
  },
  UserRole: {
    [UserRole.SUPER_ADMIN]: { display: 'Super Admin', db: 'super_admin' },
    [UserRole.DEVELOPER]: { display: 'Developer', db: 'developer' },
    [UserRole.ADMIN]: { display: 'Admin', db: 'admin' },
    [UserRole.MUSYRIF]: { display: 'Musyrif', db: 'musyrif' },
    [UserRole.WALI]: { display: 'Wali Santri', db: 'wali', altDb: ['orang_tua', 'orangtua'] },
    [UserRole.SANTRI]: { display: 'Santri', db: 'santri' },
    [UserRole.STAFF]: { display: 'Staf', db: 'staff', altDb: ['staf'] },
    [UserRole.KEPALA_KESISWAAN]: { display: 'Kepala Kesiswaan', db: 'kepala_kesiswaan' },
    [UserRole.GURU]: { display: 'Guru', db: 'guru' },
    [UserRole.WALI_KELAS]: { display: 'Wali Kelas', db: 'wali_kelas' },
    [UserRole.ALUMNI]: { display: 'Alumni', db: 'alumni' },
  }
};

/**
 * Translates a canonical enum value to its Indonesian display label.
 */
export function translateEnumToDisplay(enumName: string, canonicalValue: string): string {
  const map = translationMap[enumName];
  if (!map) {
    throw new Error(`Translation map not found for enum: ${enumName}`);
  }
  const config = map[canonicalValue.toUpperCase()];
  if (!config) {
    return canonicalValue;
  }
  return config.display;
}

/**
 * Parses a display label or string (Indonesian or alt label) to the canonical English enum value.
 */
export function parseDisplayToCanonical(enumName: string, displayValue: string): string {
  const map = translationMap[enumName];
  if (!map) {
    throw new Error(`Translation map not found for enum: ${enumName}`);
  }
  const cleanVal = displayValue.trim().toLowerCase();
  for (const [key, config] of Object.entries(map)) {
    if (
      config.display.toLowerCase() === cleanVal ||
      config.altDisplay?.some(alt => alt.toLowerCase() === cleanVal) ||
      key.toLowerCase() === cleanVal
    ) {
      return key;
    }
  }
  throw new Error(`Unable to parse display value "${displayValue}" to canonical enum ${enumName}`);
}

/**
 * Translates a canonical enum value to its corresponding database code representation.
 */
export function translateCanonicalToDb(enumName: string, canonicalValue: string): string {
  const map = translationMap[enumName];
  if (!map) {
    throw new Error(`Translation map not found for enum: ${enumName}`);
  }
  const config = map[canonicalValue.toUpperCase()];
  if (!config) {
    return canonicalValue.toLowerCase();
  }
  return config.db;
}

/**
 * Parses a database code string to the canonical English enum value.
 */
export function parseDbToCanonical(enumName: string, dbValue: string): string {
  const map = translationMap[enumName];
  if (!map) {
    throw new Error(`Translation map not found for enum: ${enumName}`);
  }
  const cleanVal = dbValue.trim().toLowerCase();
  for (const [key, config] of Object.entries(map)) {
    if (
      config.db.toLowerCase() === cleanVal ||
      config.altDb?.some(alt => alt.toLowerCase() === cleanVal) ||
      key.toLowerCase() === cleanVal
    ) {
      return key;
    }
  }
  throw new Error(`Unable to parse db code "${dbValue}" to canonical enum ${enumName}`);
}
