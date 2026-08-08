import { pgTable, text, integer, boolean, timestamp, real } from 'drizzle-orm/pg-core';

// ── Academic Ledger Records Table (Nilai per Mapel/Komponen) ───────────────
export const academicLedgerRecords = pgTable('academic_ledger_records', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').default('default').notNull(),
  santriId: text('santri_id').notNull(),
  academicTermId: text('academic_term_id').notNull(),
  mapelId: text('mapel_id').default('all').notNull(),
  sourceGroup: text('source_group').notNull(), // 'office_exam' | 'teacher_assessment' | 'daily_assessment' | etc.
  rawScore: real('raw_score').notNull(), // 0 - 100
  weightedScore: real('weighted_score').notNull(), // Nilai setelah dikali bobot skema
  calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Academic Transcripts Table (Transkrip Rapor Santri) ───────────────────
export const academicTranscripts = pgTable('academic_transcripts', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').default('default').notNull(),
  santriId: text('santri_id').notNull(),
  academicTermId: text('academic_term_id').notNull(),
  finalScore: real('final_score').notNull(), // Nilai Akhir Rapor (0 - 100)
  predicate: text('predicate').notNull(), // 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul' | 'Rasib'
  rankInClass: integer('rank_in_class'),
  isLocked: boolean('is_locked').default(false).notNull(),
  lockedAt: timestamp('locked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
