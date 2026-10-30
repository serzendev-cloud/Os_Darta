// ========================================
// Centralized Theme Permissions Bridge
// Traceability: WP-DEV-003
// Catatan: Setelah fix/security-hardening digabung, ganti ke TENANT_BRANDING_READ/MANAGE di berkas ini saja.
// ========================================

import { Permission } from '@/config/permissions';

/**
 * Permission to read tenant theme & branding configuration.
 * Maps to Permission.VIEW_PENGATURAN on origin/preview branch.
 */
export const THEME_SETTINGS_READ = Permission.VIEW_PENGATURAN;

/**
 * Permission to update/manage tenant theme & branding configuration.
 * Maps to Permission.MANAGE_PENGATURAN on origin/preview branch.
 */
export const THEME_SETTINGS_MANAGE = Permission.MANAGE_PENGATURAN;

