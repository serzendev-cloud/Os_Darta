import { pgTable, text, integer, timestamp, unique, index, check, foreignKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants } from '../schema';
import { academicYears } from './academic_workspace';

// ── 1. Madrasah Table ─────────────────────────────────────────────────────
export const madrasah = pgTable('madrasah', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  code: text('code').notNull(),
  name: text('name').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Composite unique key for child FK references
  tenantIdUnique: unique('uq_madrasah_tenant_id').on(table.tenantId, table.id),
  // Code unique within tenant
  tenantCodeUnique: unique('uq_madrasah_tenant_code').on(table.tenantId, table.code),
  // Status lifecycle check
  statusCheck: check('chk_madrasah_status', sql`status IN ('active', 'inactive')`),
  // High-frequency query index
  tenantStatusIdx: index('idx_madrasah_tenant_status').on(table.tenantId, table.status),
}));

// ── 2. Jenjang Table ──────────────────────────────────────────────────────
export const jenjang = pgTable('jenjang', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  madrasahId: text('madrasah_id').notNull(),
  name: text('name').notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Composite unique key for child FK references
  tenantIdUnique: unique('uq_jenjang_tenant_id').on(table.tenantId, table.id),
  // Composite unique key with madrasahId to support strict child madrasah-scoped FKs
  tenantMadrasahIdUnique: unique('uq_jenjang_tenant_madrasah_id').on(table.tenantId, table.madrasahId, table.id),
  // Jenjang name unique within Madrasah for a tenant
  tenantMadrasahNameUnique: unique('uq_jenjang_tenant_madrasah_name').on(table.tenantId, table.madrasahId, table.name),
  // Composite FK to guarantee Jenjang belongs to the same tenant's Madrasah
  tenantMadrasahFk: foreignKey({
    columns: [table.tenantId, table.madrasahId],
    foreignColumns: [madrasah.tenantId, madrasah.id],
    name: 'fk_jenjang_tenant_madrasah',
  }).onDelete('restrict'),
  // Status check constraint
  statusCheck: check('chk_jenjang_status', sql`status IN ('active', 'inactive')`),
  // Ordered retrieval index
  tenantMadrasahIdx: index('idx_jenjang_tenant_madrasah').on(table.tenantId, table.madrasahId, table.orderIndex),
}));

// ── 3. Tingkat Table ──────────────────────────────────────────────────────
export const tingkat = pgTable('tingkat', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  madrasahId: text('madrasah_id').notNull(),
  jenjangId: text('jenjang_id').notNull(),
  sequence: integer('sequence').notNull(),
  uiLabel: text('ui_label').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Composite unique key for child FK references
  tenantIdUnique: unique('uq_tingkat_tenant_id').on(table.tenantId, table.id),
  // Authoritative progression sequence uniqueness within Madrasah for a tenant
  tenantMadrasahSeqUnique: unique('uq_tingkat_tenant_madrasah_sequence').on(table.tenantId, table.madrasahId, table.sequence),
  // Composite FK to Madrasah
  tenantMadrasahFk: foreignKey({
    columns: [table.tenantId, table.madrasahId],
    foreignColumns: [madrasah.tenantId, madrasah.id],
    name: 'fk_tingkat_tenant_madrasah',
  }).onDelete('restrict'),
  // Composite FK to Jenjang, enforcing same tenant AND same Madrasah
  tenantJenjangFk: foreignKey({
    columns: [table.tenantId, table.madrasahId, table.jenjangId],
    foreignColumns: [jenjang.tenantId, jenjang.madrasahId, jenjang.id],
    name: 'fk_tingkat_tenant_madrasah_jenjang',
  }).onDelete('restrict'),
  // Monotonic sequence check constraint
  sequenceCheck: check('chk_tingkat_sequence_positive', sql`sequence > 0`),
  // Status check constraint
  statusCheck: check('chk_tingkat_status', sql`status IN ('active', 'inactive')`),
  // Progression lookup indexes
  tenantMadrasahSeqIdx: index('idx_tingkat_tenant_madrasah_seq').on(table.tenantId, table.madrasahId, table.sequence),
  tenantJenjangIdx: index('idx_tingkat_tenant_jenjang').on(table.tenantId, table.jenjangId),
}));

// ── 4. Rombel Table ───────────────────────────────────────────────────────
export const rombel = pgTable('rombel', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  academicYearId: text('academic_year_id').notNull(),
  tingkatId: text('tingkat_id').notNull(),
  name: text('name').notNull(),
  displayLabel: text('display_label'),
  capacity: integer('capacity').default(30).notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Composite unique key for placement FK references
  tenantIdUnique: unique('uq_rombel_tenant_id').on(table.tenantId, table.id),
  // Rombel name unique within Tingkat for an Academic Year within a tenant
  tenantYearTingkatNameUnique: unique('uq_rombel_tenant_year_tingkat_name').on(table.tenantId, table.academicYearId, table.tingkatId, table.name),
  // Composite FK to Academic Year (year-scoped lifecycle)
  tenantYearFk: foreignKey({
    columns: [table.tenantId, table.academicYearId],
    foreignColumns: [academicYears.tenantId, academicYears.id],
    name: 'fk_rombel_tenant_year',
  }).onDelete('restrict'),
  // Composite FK to Tingkat
  tenantTingkatFk: foreignKey({
    columns: [table.tenantId, table.tingkatId],
    foreignColumns: [tingkat.tenantId, tingkat.id],
    name: 'fk_rombel_tenant_tingkat',
  }).onDelete('restrict'),
  // Capacity check constraint
  capacityCheck: check('chk_rombel_capacity', sql`capacity > 0`),
  // Status check constraint
  statusCheck: check('chk_rombel_status', sql`status IN ('active', 'inactive')`),
  // High-frequency query indexes
  tenantYearIdx: index('idx_rombel_tenant_year').on(table.tenantId, table.academicYearId),
  tenantTingkatIdx: index('idx_rombel_tenant_tingkat').on(table.tenantId, table.tingkatId),
}));

export type Madrasah = typeof madrasah.$inferSelect;
export type NewMadrasah = typeof madrasah.$inferInsert;

export type Jenjang = typeof jenjang.$inferSelect;
export type NewJenjang = typeof jenjang.$inferInsert;

export type Tingkat = typeof tingkat.$inferSelect;
export type NewTingkat = typeof tingkat.$inferInsert;

export type Rombel = typeof rombel.$inferSelect;
export type NewRombel = typeof rombel.$inferInsert;
