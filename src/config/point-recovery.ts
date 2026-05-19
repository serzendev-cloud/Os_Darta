// ========================================
// POINT RECOVERY CONFIGURATION
// Centralized config for automatic point reduction over time.
// Feeds into point-engine.ts — NO business logic here.
// ========================================

import type { PelanggaranSeverity } from '@/types';

// ─── Auto-Recovery Master Switch ──────────────────────────────────

export interface PointRecoveryConfig {
  /** Global on/off switch for auto-recovery */
  enabled: boolean;

  /** Number of days between each recovery tick */
  recoveryIntervalDays: number;

  /** Points reduced per recovery tick */
  recoveryPointsPerTick: number;

  /** Points can never drop below this floor (protects serious offenders) */
  minimalRemainingPoints: number;

  /** Severities that are EXCLUDED from auto-recovery */
  excludedSeverities: PelanggaranSeverity[];

  /** How many days after the LAST violation before recovery starts counting */
  cooldownDays: number;

  /** Maximum total points that can be recovered across all ticks (0 = unlimited) */
  maxRecoveryCap: number;
}

// ─── Default Configuration ────────────────────────────────────────

export const DEFAULT_POINT_RECOVERY: PointRecoveryConfig = {
  enabled: true,
  recoveryIntervalDays: 30,
  recoveryPointsPerTick: 5,
  minimalRemainingPoints: 15,
  excludedSeverities: ['sangat_berat', 'berat'],
  cooldownDays: 14,
  maxRecoveryCap: 60,
};

// ─── Per-Jenjang Override ─────────────────────────────────────────

export interface JenjangRecoveryOverride {
  jenjang: string;
  config: Partial<PointRecoveryConfig>;
}

/** Empty by default — fill via Firestore or admin panel in future. */
export const DEFAULT_JENJANG_RECOVERY_OVERRIDES: JenjangRecoveryOverride[] = [];

// ─── Recovery Tier Presets ────────────────────────────────────────

/** Named presets for quick selection in admin UI (future). */
export const RECOVERY_PRESETS = {
  strict: {
    enabled: false,
    recoveryIntervalDays: 90,
    recoveryPointsPerTick: 5,
    minimalRemainingPoints: 50,
    excludedSeverities: ['sangat_berat', 'berat', 'sedang'] as PelanggaranSeverity[],
    cooldownDays: 30,
    maxRecoveryCap: 30,
  },
  moderate: {
    enabled: true,
    recoveryIntervalDays: 30,
    recoveryPointsPerTick: 5,
    minimalRemainingPoints: 15,
    excludedSeverities: ['sangat_berat'] as PelanggaranSeverity[],
    cooldownDays: 14,
    maxRecoveryCap: 60,
  },
  lenient: {
    enabled: true,
    recoveryIntervalDays: 14,
    recoveryPointsPerTick: 10,
    minimalRemainingPoints: 0,
    excludedSeverities: [] as PelanggaranSeverity[],
    cooldownDays: 7,
    maxRecoveryCap: 0, // unlimited
  },
} as const satisfies Record<string, PointRecoveryConfig>;

export type RecoveryPresetName = keyof typeof RECOVERY_PRESETS;
