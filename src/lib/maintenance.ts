// Maintenance mode utilities — pure functions, no side effects.

import type { MaintenanceConfig, UserRole } from '@/types';

export const DEFAULT_MAINTENANCE_CONFIG: MaintenanceConfig = {
  enabled: false,
  message: '',
  bypassRoles: ['admin'],
  type: 'full',
};

export function isMaintenanceActive(config: MaintenanceConfig): boolean {
  return config.enabled === true;
}

export function canBypassMaintenance(config: MaintenanceConfig, role: UserRole): boolean {
  return config.bypassRoles.includes(role);
}
