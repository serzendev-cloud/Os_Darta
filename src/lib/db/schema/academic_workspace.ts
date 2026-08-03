import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

// ── Academic Years Table ──────────────────────────────────────────────────
export const academicYears = pgTable('academic_years', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').default('default').notNull(),
  name: text('name').notNull(), // e.g. "2026/2027"
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').default('planned').notNull(), // 'planned' | 'active' | 'archived'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Academic Terms (Semester) Table ───────────────────────────────────────
export const academicTerms = pgTable('academic_terms', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').default('default').notNull(),
  academicYearId: text('academic_year_id').notNull(),
  name: text('name').notNull(), // e.g. "Semester Ganjil", "Semester Genap"
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isCurrent: boolean('is_current').default(false).notNull(),
  status: text('status').default('planned').notNull(), // 'planned' | 'active' | 'closed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
