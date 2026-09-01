import { pgTable, text, integer, boolean, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { tenants } from '../schema';

// ── 1. Master Institutions (WP-310) ──────────────────────────────────────────
export const masterInstitutions = pgTable('master_institutions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  name: text('name').notNull(),
  label: text('label'),
  description: text('description'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantCodeUnique: unique('uq_tenant_institution_code').on(table.tenantId, table.code),
  tenantIdx: index('idx_master_institutions_tenant').on(table.tenantId, table.isActive, table.sortOrder),
}));

// ── 2. Violation Severity Levels (WP-311) ───────────────────────────────────
export const violationSeverityLevels = pgTable('violation_severity_levels', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  badgeColor: text('badge_color').default('gray'),
  isActive: boolean('is_active').default(true).notNull(),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).defaultNow().notNull(),
  effectiveUntil: timestamp('effective_until', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantCodeUnique: unique('uq_tenant_severity_code').on(table.tenantId, table.code),
  tenantIdx: index('idx_severity_levels_tenant').on(table.tenantId, table.isActive, table.sortOrder),
}));

// ── 3. Violation Categories (WP-311) ─────────────────────────────────────────
export const violationCategories = pgTable('violation_categories', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0).notNull(),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantCodeUnique: unique('uq_tenant_category_code').on(table.tenantId, table.code),
  tenantIdx: index('idx_violation_categories_tenant').on(table.tenantId, table.status, table.sortOrder),
}));
