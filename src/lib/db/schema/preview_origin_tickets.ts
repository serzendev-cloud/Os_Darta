// ============================================================
// EEOS — Platform Role Preview Origin Tickets Schema
// Traceability: WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-001
// Purpose: Persistent, distributed, race-condition proof ticket store
// Security: Server-side only (RLS Enabled with Zero Public Policies)
// ============================================================

import { pgTable, text, varchar, timestamp, unique, index } from 'drizzle-orm/pg-core';

export const previewOriginTickets = pgTable(
  'preview_origin_tickets',
  {
    id: text('id').primaryKey(),
    ticketHash: varchar('ticket_hash', { length: 64 }).notNull(),
    originUserId: text('origin_user_id').notNull(),
    originUserEmail: varchar('origin_user_email', { length: 255 }).notNull(),
    originRole: varchar('origin_role', { length: 50 }).notNull(),
    previewPersona: varchar('preview_persona', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    consumedByIp: varchar('consumed_by_ip', { length: 45 }),
    userAgent: text('user_agent'),
  },
  (table) => ({
    ticketHashUq: unique('uq_preview_origin_tickets_hash').on(table.ticketHash),
    ticketHashIdx: index('idx_preview_origin_tickets_hash').on(table.ticketHash),
    activeIdx: index('idx_preview_origin_tickets_active').on(table.ticketHash, table.expiresAt),
    cleanupIdx: index('idx_preview_origin_tickets_cleanup').on(table.expiresAt, table.consumedAt),
  })
);

export type PreviewOriginTicket = typeof previewOriginTickets.$inferSelect;
export type NewPreviewOriginTicket = typeof previewOriginTickets.$inferInsert;
