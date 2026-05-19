// ========================================
// GOVERNANCE POLICY CONFIGURATION
// Centralized business rules for the governance system.
// Pure config — NO business logic execution.
// All rules are idempotent and read by engines at runtime.
// ========================================

import type { PelanggaranSeverity } from '@/types';

// ─── Restriction by Active Punishment ─────────────────────────────

export interface PunishmentRestriction {
  /** Whether to block quest claiming while punishment is active */
  blockQuestClaim: boolean;
  /** Whether to block new quest assignment while punishment is active */
  blockQuestAssignment: boolean;
  /** Whether to block izin keluar while punishment is active */
  blockExitPermission: boolean;
  /** Whether to block participation in activities */
  blockActivities: boolean;
  /** Severity levels that trigger these restrictions */
  minSeverityForRestriction: PelanggaranSeverity;
  /** Minimum remaining punishment days to trigger */
  minRemainingDays: number;
}

export const DEFAULT_PUNISHMENT_RESTRICTION: PunishmentRestriction = {
  blockQuestClaim: true,
  blockQuestAssignment: false,
  blockExitPermission: true,
  blockActivities: false,
  minSeverityForRestriction: 'sedang',
  minRemainingDays: 3,
};

// ─── Warning Accumulation → SP Escalation ────────────────────────

export interface WarningEscalationRule {
  /** Number of warnings needed to trigger this escalation */
  warningCount: number;
  /** SP level to escalate to */
  escalateToSP: 'SP1' | 'SP2' | 'SP3';
  /** Whether this escalation is automatic or requires manual approval */
  autoEscalate: boolean;
  /** How many days of observation before auto-escalation (0 = immediate) */
  observationDays: number;
}

export const WARNING_ESCALATION_RULES: WarningEscalationRule[] = [
  {
    warningCount: 3,
    escalateToSP: 'SP1',
    autoEscalate: true,
    observationDays: 7,
  },
  {
    warningCount: 5,
    escalateToSP: 'SP2',
    autoEscalate: false, // requires manual approval
    observationDays: 7,
  },
  {
    warningCount: 7,
    escalateToSP: 'SP3',
    autoEscalate: false,
    observationDays: 14,
  },
];

// ─── SP Escalation Rules ─────────────────────────────────────────

export interface SPEscalationRule {
  /** From this SP level */
  fromSP: 'Tidak Ada' | 'SP1' | 'SP2' | 'SP3';
  /** Trigger threshold (total points) to escalate to next level */
  pointsThreshold: number;
  /** Actions taken when this threshold is reached */
  actions: string[];
  /** Whether parent/wali is notified */
  notifyWali: boolean;
  /** Whether santri is notified */
  notifySantri: boolean;
}

export const SP_ESCALATION_RULES: SPEscalationRule[] = [
  {
    fromSP: 'Tidak Ada',
    pointsThreshold: 30,
    actions: ['notify_wali', 'notify_wali_kelas', 'create_warning'],
    notifyWali: true,
    notifySantri: true,
  },
  {
    fromSP: 'SP1',
    pointsThreshold: 50,
    actions: ['notify_wali', 'notify_kepala_kesiswaan', 'restrict_quest'],
    notifyWali: true,
    notifySantri: true,
  },
  {
    fromSP: 'SP2',
    pointsThreshold: 80,
    actions: ['notify_wali', 'notify_admin', 'restrict_activities', 'mandatory_counseling'],
    notifyWali: true,
    notifySantri: true,
  },
  {
    fromSP: 'SP3',
    pointsThreshold: 100,
    actions: ['notify_all', 'suspension_review', 'parent_meeting_required'],
    notifyWali: true,
    notifySantri: true,
  },
];

// ─── Character Assessment Criteria ────────────────────────────────

export interface CharacterCriteria {
  /** Minimum points to be in this tier */
  minPoints: number;
  /** Maximum points to be in this tier (inclusive) */
  maxPoints: number;
  /** Tier label */
  label: string;
  /** Available actions in this tier */
  allowedActions: string[];
  /** Blocked actions in this tier */
  blockedActions: string[];
}

export const CHARACTER_TIERS: CharacterCriteria[] = [
  {
    minPoints: 0,
    maxPoints: 20,
    label: 'Baik',
    allowedActions: ['claim_quest', 'request_exit_permit', 'participate_activities'],
    blockedActions: [],
  },
  {
    minPoints: 21,
    maxPoints: 50,
    label: 'Perlu Perhatian',
    allowedActions: ['claim_quest', 'request_exit_permit'],
    blockedActions: ['represent_school'],
  },
  {
    minPoints: 51,
    maxPoints: 80,
    label: 'Peringatan',
    allowedActions: ['request_exit_permit'],
    blockedActions: ['claim_quest', 'represent_school', 'lead_activities'],
  },
];

// ─── Quest Restriction by Severity ─────────────────────────────────

export interface QuestRestriction {
  /** Severity level */
  severity: PelanggaranSeverity;
  /** Days blocked from quest after this severity violation */
  questCooldownDays: number;
  /** Whether santri can still complete in-progress quests */
  allowCompleteInProgress: boolean;
  /** Whether santri can claim new quests */
  allowClaimNew: boolean;
}

export const QUEST_RESTRICTIONS: QuestRestriction[] = [
  {
    severity: 'ringan',
    questCooldownDays: 7,
    allowCompleteInProgress: true,
    allowClaimNew: true,
  },
  {
    severity: 'sedang',
    questCooldownDays: 14,
    allowCompleteInProgress: true,
    allowClaimNew: false,
  },
  {
    severity: 'berat',
    questCooldownDays: 30,
    allowCompleteInProgress: false,
    allowClaimNew: false,
  },
  {
    severity: 'sangat_berat',
    questCooldownDays: 60,
    allowCompleteInProgress: false,
    allowClaimNew: false,
  },
];

// ─── Compliance Status ────────────────────────────────────────────

export interface ComplianceStatus {
  /** Total SP3 santri count triggers review */
  sp3ReviewTrigger: number;
  /** Percentage of santri with warnings that triggers system alert */
  warningPercentageAlert: number;
  /** Days before a pending governance case is flagged as stale */
  staleCaseDays: number;
  /** Auto-close governance cases older than this (0 = never) */
  autoCloseCaseDays: number;
}

export const COMPLIANCE_CONFIG: ComplianceStatus = {
  sp3ReviewTrigger: 3,
  warningPercentageAlert: 15,
  staleCaseDays: 14,
  autoCloseCaseDays: 90,
};
