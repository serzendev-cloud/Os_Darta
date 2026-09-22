import { pgTable, text, boolean, timestamp, date, unique, uniqueIndex, index, check, foreignKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants } from '../schema';

// ── Academic Years Table ──────────────────────────────────────────────────
export const academicYears = pgTable('academic_years', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(), // e.g. "2026/2027"
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: text('status').default('planned').notNull(), // 'planned' | 'active' | 'archived'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Name unique within tenant
  tenantNameUnique: unique('uq_academic_years_tenant_name').on(table.tenantId, table.name),
  // Composite unique key for cross-tenant FK reference
  tenantIdUnique: unique('uq_academic_years_tenant_id').on(table.tenantId, table.id),
  // Status check constraint
  statusCheck: check('chk_academic_years_status', sql`status IN ('planned', 'active', 'archived')`),
  // Date range check constraint
  dateCheck: check('chk_academic_years_date_range', sql`start_date <= end_date`),
  // At most one ACTIVE academic year per tenant
  singleActiveUnique: uniqueIndex('uq_academic_years_tenant_active').on(table.tenantId).where(sql`status = 'active'`),
  // Indexes for high-frequency queries
  tenantStatusIdx: index('idx_academic_years_tenant_status').on(table.tenantId, table.status),
}));

// ── Academic Terms (Semester) Table ───────────────────────────────────────
export const academicTerms = pgTable('academic_terms', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  academicYearId: text('academic_year_id')
    .notNull()
    .references(() => academicYears.id, { onDelete: 'restrict' }),
  name: text('name').notNull(), // e.g. "Semester Ganjil", "Semester Genap"
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  isCurrent: boolean('is_current').default(false).notNull(),
  status: text('status').default('planned').notNull(), // 'planned' | 'active' | 'closed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Term name unique within Academic Year for a tenant
  yearNameUnique: unique('uq_academic_terms_year_name').on(table.tenantId, table.academicYearId, table.name),
  // Composite FK to guarantee term belongs to the same tenant's academic year
  tenantYearFk: foreignKey({
    columns: [table.tenantId, table.academicYearId],
    foreignColumns: [academicYears.tenantId, academicYears.id],
    name: 'fk_academic_terms_tenant_year',
  }).onDelete('restrict'),
  // Status check constraint
  statusCheck: check('chk_academic_terms_status', sql`status IN ('planned', 'active', 'closed')`),
  // Date range check constraint
  dateCheck: check('chk_academic_terms_date_range', sql`start_date <= end_date`),
  // At most one CURRENT term per tenant
  singleCurrentUnique: uniqueIndex('uq_academic_terms_tenant_current').on(table.tenantId).where(sql`is_current = true`),
  // At most one ACTIVE term per tenant
  singleActiveUnique: uniqueIndex('uq_academic_terms_tenant_active').on(table.tenantId).where(sql`status = 'active'`),
  // Indexes
  tenantYearIdx: index('idx_academic_terms_tenant_year').on(table.tenantId, table.academicYearId),
  tenantStatusIdx: index('idx_academic_terms_tenant_status').on(table.tenantId, table.status),
}));

export type AcademicYear = typeof academicYears.$inferSelect;
export type NewAcademicYear = typeof academicYears.$inferInsert;

export type AcademicTerm = typeof academicTerms.$inferSelect;
export type NewAcademicTerm = typeof academicTerms.$inferInsert;

