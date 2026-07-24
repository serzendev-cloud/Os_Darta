import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

// ── Gate Passes (Perizinan Keluar/Pulang Santri) ─────────────────────────────
export const gatePasses = pgTable('gate_passes', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  santriId: text('santri_id').notNull(),
  santriName: text('santri_name').notNull(),
  jenisIzin: text('jenis_izin').notNull(), // 'berobat' | 'pulang' | 'keluar_komplek' | 'tugas'
  alasan: text('alasan').notNull(),
  approvedBy: text('approved_by').notNull(),
  validUntil: timestamp('valid_until').notNull(), // Target Return Deadline
  checkOutTime: timestamp('check_out_time'), // Actual Tap Out Timestamp
  checkInTime: timestamp('check_in_time'), // Actual Tap In Timestamp
  actualDurationMinutes: integer('actual_duration_minutes'), // Real Duration in Minutes
  status: text('status').default('APPROVED').notNull(), // 'APPROVED' | 'CHECKED_OUT' | 'COMPLETED' | 'LATE'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
