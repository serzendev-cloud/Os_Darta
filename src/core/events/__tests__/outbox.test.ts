/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// ========================================
// Transactional Event Outbox Integration Tests
// Traceability: CIP-WP-005 | Rule SMB-221
// ========================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { EventOutboxWriter } from '@/core/infrastructure/outbox/writer';
import { OutboxDispatcher } from '@/core/infrastructure/outbox/dispatcher';
import { eventBus } from '../event-bus';

// Initialize global storage to bypass Vitest module hoisting isolation
(globalThis as any).__mockOutboxRows = [];

const getMockOutboxRows = (): any[] => (globalThis as any).__mockOutboxRows;
const clearMockOutboxRows = () => {
  (globalThis as any).__mockOutboxRows = [];
};

// Mock Drizzle module
vi.mock('@/lib/db', () => {
  const mockDb = {
    insert: vi.fn().mockImplementation(() => {
      return {
        values: vi.fn().mockImplementation((values) => {
          const records = Array.isArray(values) ? values : [values];
          const mappedRecords = records.map(r => ({
            ...r,
            payload: typeof r.payload === 'string' ? JSON.parse(r.payload) : r.payload
          }));
          (globalThis as any).__mockOutboxRows.push(...mappedRecords);
          return Promise.resolve();
        })
      };
    }),
    select: vi.fn().mockImplementation(() => {
      return {
        from: vi.fn().mockImplementation(() => {
          return {
            where: vi.fn().mockImplementation(() => {
              return {
                limit: vi.fn().mockImplementation((limitSize) => {
                  const pending = (globalThis as any).__mockOutboxRows
                    .filter((r: any) => r.status === 'PENDING')
                    .slice(0, limitSize);
                  return Promise.resolve(pending);
                })
              };
            })
          };
        })
      };
    }),
    update: vi.fn().mockImplementation(() => {
      return {
        set: vi.fn().mockImplementation((updates) => {
          return {
            where: vi.fn().mockImplementation(() => {
              (globalThis as any).__mockOutboxRows.forEach((row: any) => {
                Object.assign(row, updates);
              });
              return Promise.resolve();
            })
          };
        })
      };
    }),
    delete: vi.fn().mockImplementation(() => {
      return {
        where: vi.fn().mockImplementation(() => {
          (globalThis as any).__mockOutboxRows = [];
          return Promise.resolve();
        })
      };
    }),
    transaction: vi.fn().mockImplementation(async (callback) => {
      const backup = JSON.parse(JSON.stringify((globalThis as any).__mockOutboxRows));
      try {
        const res = await callback(mockDb);
        return res;
      } catch (err) {
        (globalThis as any).__mockOutboxRows = backup;
        throw err;
      }
    })
  };

  return { db: mockDb };
});

describe('Transactional Event Outbox Pattern', () => {
  const testTenantId = 'test-tenant-outbox';
  const testEventType = 'test.event.published.v1';
  let dispatcher: OutboxDispatcher;

  beforeEach(() => {
    clearMockOutboxRows();
    eventBus.clear();
    dispatcher = new OutboxDispatcher();
  });

  afterEach(() => {
    clearMockOutboxRows();
  });

  it('should write an event to the outbox when outside a transaction', async () => {
    const payload = { data: 'test-standalone' };
    
    await EventOutboxWriter.write({
      eventName: testEventType,
      aggregateId: 'agg-001',
      tenantId: testTenantId,
      payload,
    });

    const rows = getMockOutboxRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].eventType).toBe(testEventType);
    expect(rows[0].status).toBe('PENDING');
    expect(rows[0].payload).toEqual(payload);
  });

  it('should save the event if the wrapping transaction commits', async () => {
    const payload = { data: 'test-commit' };
    const { db } = await import('@/lib/db');

    await db.transaction(async (tx) => {
      await EventOutboxWriter.write(
        {
          eventName: testEventType,
          aggregateId: 'agg-002',
          tenantId: testTenantId,
          payload,
        },
        tx
      );
    });

    const rows = getMockOutboxRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe('PENDING');
  });

  it('should not save the event if the wrapping transaction rolls back', async () => {
    const payload = { data: 'test-rollback' };
    const { db } = await import('@/lib/db');

    try {
      await db.transaction(async (tx) => {
        await EventOutboxWriter.write(
          {
            eventName: testEventType,
            aggregateId: 'agg-003',
            tenantId: testTenantId,
            payload,
          },
          tx
        );
        throw new Error('Forced transaction rollback');
      });
    } catch (err: any) {
      expect(err.message).toBe('Forced transaction rollback');
    }

    const rows = getMockOutboxRows();
    expect(rows).toHaveLength(0);
  });

  it('should process pending events and trigger subscribers', async () => {
    const payload = { id: 'user-001', name: 'Ahmad' };
    const handler = vi.fn().mockImplementation(async (evtPayload, tenantId) => {
      expect(evtPayload).toEqual(payload);
      expect(tenantId).toBe(testTenantId);
    });

    eventBus.subscribe(testEventType, handler);

    await EventOutboxWriter.write({
      eventName: testEventType,
      aggregateId: 'agg-004',
      tenantId: testTenantId,
      payload,
    });

    const processedCount = await dispatcher.processPendingEvents();
    expect(processedCount).toBe(1);
    expect(handler).toHaveBeenCalledTimes(1);

    const rows = getMockOutboxRows();
    expect(rows[0].status).toBe('PROCESSED');
    expect(rows[0].processedAt).toBeInstanceOf(Date);
  });

  it('should set status to FAILED and record error message if a subscriber fails', async () => {
    const payload = { id: 'user-002' };
    const failingHandler = vi.fn().mockImplementation(async () => {
      throw new Error('Subscriber execution failed');
    });

    eventBus.subscribe(testEventType, failingHandler);

    await EventOutboxWriter.write({
      eventName: testEventType,
      aggregateId: 'agg-005',
      tenantId: testTenantId,
      payload,
    });

    const processedCount = await dispatcher.processPendingEvents();
    expect(processedCount).toBe(1);
    expect(failingHandler).toHaveBeenCalledTimes(1);

    const rows = getMockOutboxRows();
    expect(rows[0].status).toBe('FAILED');
    expect(rows[0].errorMessage).toBe('Subscriber execution failed');
  });
});
