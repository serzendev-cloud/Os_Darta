// ========================================
// In-Process Event Bus & Registry
// Traceability: CIP-WP-005 | ADR-WP005-002
// ========================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandler = (payload: any, tenantId: string) => Promise<void> | void;

const eventHandlers: Record<string, EventHandler[]> = {};

export const eventBus = {
  /**
   * Registers a callback handler for a given event type.
   */
  subscribe(eventType: string, handler: EventHandler): void {
    if (!eventHandlers[eventType]) {
      eventHandlers[eventType] = [];
    }
    eventHandlers[eventType].push(handler);
  },

  /**
   * Unregisters a callback handler for a given event type.
   */
  unsubscribe(eventType: string, handler: EventHandler): void {
    if (!eventHandlers[eventType]) return;
    eventHandlers[eventType] = eventHandlers[eventType].filter((h) => h !== handler);
  },

  /**
   * Internal helper to retrieve all handlers registered to a specific event.
   */
  getHandlers(eventType: string): EventHandler[] {
    return eventHandlers[eventType] || [];
  },

  /**
   * Resets all registered handlers. (Primarily useful in test environments)
   */
  clear(): void {
    for (const key of Object.keys(eventHandlers)) {
      delete eventHandlers[key];
    }
  }
};
