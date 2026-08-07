// ========================================
// Transactional Outbox Background Dispatcher
// Traceability: CIP-WP-005 | ADR-WP005-001
// ========================================

import { db } from '@/lib/db';
import { outboxEvents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { eventBus } from '../../events/event-bus';

export class OutboxDispatcher {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Starts the polling worker to pull and dispatch pending events.
   */
  public start(intervalMs = 1000): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      try {
        await this.processPendingEvents();
      } catch (err) {
        // Top-level recovery strategy: log check failures without halting loop thread
        console.error('OutboxDispatcher error during interval process:', err);
      }
    }, intervalMs);
  }

  /**
   * Stops the background polling loop.
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Processes a batch of pending events.
   */
  public async processPendingEvents(batchSize = 20): Promise<number> {
    const pending = await db
      .select()
      .from(outboxEvents)
      .where(eq(outboxEvents.status, 'PENDING'))
      .limit(batchSize);

    for (const record of pending) {
      try {
        // Dispatch to registered eventBus handlers
        const handlers = eventBus.getHandlers(record.eventType);
        for (const handler of handlers) {
          await handler(record.payload, record.tenantId);
        }

        // Set status to PROCESSED
        await db
          .update(outboxEvents)
          .set({
            status: 'PROCESSED',
            processedAt: new Date(),
          })
          .where(eq(outboxEvents.id, record.id));
      } catch (err) {
        const error = err as Error;
        // Set status to FAILED and record error message
        await db
          .update(outboxEvents)
          .set({
            status: 'FAILED',
            errorMessage: error.message || 'Unknown handler error',
          })
          .where(eq(outboxEvents.id, record.id));
      }
    }

    return pending.length;
  }
}
