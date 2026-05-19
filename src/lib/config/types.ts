// Runtime config types — pure types, no logic.

import type { MaintenanceConfig } from '@/types';
import type { PointRecoveryConfig } from '@/config/point-recovery';
import type { ApprovalStep, EscalationTrigger, TimeoutConfig } from '@/config/escalation';
import type { PunishmentRestriction, WarningEscalationRule, ComplianceStatus } from '@/config/governance-policies';

export interface AppConfig {
  maintenance: MaintenanceConfig;
  featureFlags: Record<string, boolean>;
  pointRecovery?: Partial<PointRecoveryConfig>;
  escalation?: {
    chain?: Partial<ApprovalStep>[];
    triggers?: Partial<EscalationTrigger>[];
    timeout?: Partial<TimeoutConfig>;
  };
  governance?: {
    punishmentRestriction?: Partial<PunishmentRestriction>;
    warningEscalation?: Partial<WarningEscalationRule>[];
    compliance?: Partial<ComplianceStatus>;
  };
}

export interface ConfigStore<T> {
  defaults: T;
  overrides: Partial<T> | null;
  merged: T;
}

export type ConfigSource = 'firestore' | 'env' | 'defaults';

export interface ConfigLoadResult<T> {
  config: T;
  source: ConfigSource;
}
