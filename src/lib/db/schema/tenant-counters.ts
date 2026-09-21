import { pgTable, smallint, integer, timestamp } from 'drizzle-orm/pg-core';

export const tenantCodeCounters = pgTable('tenant_code_counters', {
  year: smallint('year').primaryKey(),
  lastSequence: integer('last_sequence').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
