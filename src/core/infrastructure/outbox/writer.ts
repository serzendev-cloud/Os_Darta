// ========================================
// Transactional Event Outbox Writer
// Traceability: CIP-WP-005 | RAR-INT-003
// ========================================

import { db } from '@/lib/db';
import { outboxEvents } from '@/lib/db/schema';

export interface DomainEventPayload {
  eventName: string;
  aggregateId: string;
  tenantId: string;
  payload: Record<string, unknown>;
}

export class EventOutboxWriter {
  /**
   * Atomically writes a domain event record to the outbox database table.
   * Receives an optional transaction client (`tx`) to execute within the active database transaction scope.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async write(event: DomainEventPayload, tx?: any): Promise<void> {
    const client = tx || db;
    await client.insert(outboxEvents).values({
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId: event.tenantId,
      eventType: event.eventName,
      payload: event.payload,
      status: 'PENDING',
      createdAt: new Date(),
    });
  }
}
