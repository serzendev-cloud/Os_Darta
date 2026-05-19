// ========================================
// ESCALATION APPROVAL CONFIGURATION
// Defines approval chains, severity-based routing,
// auto-escalation triggers, and timeout thresholds.
// Config-only — NO business logic execution.
// ========================================

import type { UserRole, PelanggaranSeverity } from '@/types';

// ─── Approval Level ───────────────────────────────────────────────

export type ApprovalLevel = 1 | 2 | 3 | 4;

export interface ApprovalStep {
  level: ApprovalLevel;
  /** Who can approve at this level */
  approverRoles: UserRole[];
  /** Auto-escalation after this many hours without action */
  autoEscalateAfterHours: number | null;
  /** Escalate to this level if auto-escalation triggers */
  escalateToLevel: ApprovalLevel | null;
  /** Minimum severity that requires this approval step */
  minSeverity: PelanggaranSeverity;
}

// ─── Default Escalation Chain ─────────────────────────────────────

export const DEFAULT_ESCALATION_CHAIN: ApprovalStep[] = [
  {
    level: 1,
    approverRoles: ['wali_kelas', 'guru'],
    autoEscalateAfterHours: 48,
    escalateToLevel: 2,
    minSeverity: 'ringan',
  },
  {
    level: 2,
    approverRoles: ['musyrif', 'kepala_kesiswaan'],
    autoEscalateAfterHours: 72,
    escalateToLevel: 3,
    minSeverity: 'sedang',
  },
  {
    level: 3,
    approverRoles: ['kepala_kesiswaan'],
    autoEscalateAfterHours: 48,
    escalateToLevel: 4,
    minSeverity: 'berat',
  },
  {
    level: 4,
    approverRoles: ['admin'],
    autoEscalateAfterHours: null, // final step — never auto-escalates
    escalateToLevel: null,
    minSeverity: 'sangat_berat',
  },
];

// ─── Severity → Minimum Approval Level ────────────────────────────

export const SEVERITY_APPROVAL_LEVEL: Record<PelanggaranSeverity, ApprovalLevel> = {
  ringan: 1,
  sedang: 2,
  berat: 3,
  sangat_berat: 4,
};

// ─── Escalation Triggers ──────────────────────────────────────────

export interface EscalationTrigger {
  /** Trigger name for logging */
  name: string;
  /** Auto-escalate when this many violations accumulate without approval */
  pendingViolationThreshold: number;
  /** Auto-escalate when points exceed this in a single incident */
  pointsThreshold: number;
  /** Target escalation level */
  targetLevel: ApprovalLevel;
}

export const ESCALATION_TRIGGERS: EscalationTrigger[] = [
  {
    name: 'accumulated_minor',
    pendingViolationThreshold: 3,
    pointsThreshold: 15,
    targetLevel: 2,
  },
  {
    name: 'moderate_incident',
    pendingViolationThreshold: 2,
    pointsThreshold: 30,
    targetLevel: 3,
  },
  {
    name: 'severe_incident',
    pendingViolationThreshold: 1,
    pointsThreshold: 50,
    targetLevel: 4,
  },
];

// ─── Timeout Configuration ────────────────────────────────────────

export interface TimeoutConfig {
  /** Global auto-approve timeout in hours (0 = disabled) */
  autoApproveAfterHours: number;
  /** Auto-reject timeout in hours (0 = disabled) */
  autoRejectAfterHours: number;
  /** Reminder notification interval in hours */
  reminderIntervalHours: number;
  /** Maximum reminder count before escalation */
  maxReminders: number;
}

export const DEFAULT_TIMEOUT_CONFIG: TimeoutConfig = {
  autoApproveAfterHours: 0,    // disabled — no auto-approve
  autoRejectAfterHours: 336,    // 14 days — auto-reject stale
  reminderIntervalHours: 24,
  maxReminders: 3,
};

// ─── Approval Route Shortcuts ─────────────────────────────────────

/** Certain roles can bypass the chain entirely. */
export const BYPASS_ROLES: UserRole[] = ['admin'];

/** Admin can skip to any level. Other roles follow the chain. */
export function getApprovalLevelForSeverity(severity: PelanggaranSeverity): ApprovalLevel {
  return SEVERITY_APPROVAL_LEVEL[severity];
}

export function getApproversForLevel(level: ApprovalLevel): UserRole[] {
  const step = DEFAULT_ESCALATION_CHAIN.find((s) => s.level === level);
  return step?.approverRoles ?? ['admin'];
}
