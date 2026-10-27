import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

// ── RFID Cards Table (KTA Smart Card Santri) ─────────────────────────────────
export const rfidCards = pgTable('rfid_cards', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  santriId: text('santri_id').notNull(),
  cardUid: text('card_uid').notNull().unique(), // Chip serial UID
  hashedPin: text('hashed_pin').notNull(), // Hashed 4-6 digit Security PIN
  status: text('status').default('active').notNull(), // 'active' | 'blocked'
  pairedAt: timestamp('paired_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Hardening fields (M2-WALLET-MASTER-001)
  salt: text('salt'),
  pinFailedAttempts: integer('pin_failed_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  lastPinResetAt: timestamp('last_pin_reset_at'),
  lastPinResetBy: text('last_pin_reset_by'),
  kdfVersion: text('kdf_version').default('pbkdf2-v1').notNull(),
  pepperVersion: text('pepper_version').default('pep-2026-v1').notNull(),
  iterations: integer('iterations').default(100000).notNull(),
});

// ── Attendance Logs (Fast Tap Presensi Sekolah / Asrama / Sholat) ─────────────
export const attendanceLogs = pgTable('attendance_logs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  santriId: text('santri_id').notNull(),
  santriName: text('santri_name').notNull(),
  cardUid: text('card_uid').notNull(),
  locationType: text('location_type').notNull(), // 'sekolah' | 'asrama' | 'masjid' | 'kegiatan'
  locationName: text('location_name').notNull(),
  status: text('status').default('hadir').notNull(), // 'hadir' | 'terlambat' | 'izin'
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
