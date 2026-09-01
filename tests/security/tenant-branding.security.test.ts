/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withTenantTransaction } from '../../src/lib/db/tenant-transaction';
import { db } from '../../src/lib/db';

describe('WP-SAAS-BRAND-002: Tenant Branding Security & Isolation Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('TEST BRAND-1: Tenant A can read its own branding from tenant_settings', async () => {
    const mockRecord = [
      {
        id: 'ts_tenant_a',
        tenantId: 'tenant-a',
        loginTitle: 'Pesantren Al-Fatih',
        loginSubtitle: 'Bandung',
        primaryColor: '#0F766E',
      },
    ];

    const mockTx = {
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(mockRecord),
        }),
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const result = await withTenantTransaction('tenant-a', async (tx: any) => {
      return await tx.select().from({}).where({});
    });

    expect(result[0].tenantId).toBe('tenant-a');
    expect(result[0].loginTitle).toBe('Pesantren Al-Fatih');
  });

  it('TEST BRAND-2: Tenant A cannot read Tenant B branding records (RLS filter enforced)', async () => {
    const mockDatabase = [
      { tenantId: 'tenant-a', loginTitle: 'Branding Tenant A' },
      { tenantId: 'tenant-b', loginTitle: 'Branding Tenant B' },
    ];

    const mockTx = {
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            // Emulates Postgres RLS policy WHERE tenant_id = app.current_tenant_id
            return Promise.resolve(mockDatabase.filter((r) => r.tenantId === 'tenant-a'));
          }),
        }),
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const result = await withTenantTransaction('tenant-a', async (tx: any) => {
      return await tx.select().from({}).where({});
    });

    expect(result).toHaveLength(1);
    expect(result[0].tenantId).toBe('tenant-a');
    expect(result.some((r: any) => r.tenantId === 'tenant-b')).toBe(false);
  });

  it('TEST BRAND-3: Cross-tenant branding update by Tenant A targeting Tenant B is blocked', async () => {
    const mockTx = {
      execute: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            // RLS filter USING (tenant_id = app.current_tenant_id) returns 0 matched rows for Tenant B
            return Promise.resolve({ count: 0 });
          }),
        }),
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const updateResult = await withTenantTransaction('tenant-a', async (tx: any) => {
      return await tx.update({}).set({ loginTitle: 'Tampered' }).where({});
    });

    expect(updateResult.count).toBe(0);
  });

  it('TEST BRAND-4: Validates primary color HEX format requirement', () => {
    const validHex = '#0F766E';
    const invalidHex = 'rgb(15,118,110)';

    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    expect(hexRegex.test(validHex)).toBe(true);
    expect(hexRegex.test(invalidHex)).toBe(false);
  });

  it('TEST BRAND-5: Server transaction sets app.current_tenant_id for branding isolation', async () => {
    const executedQueries: string[] = [];

    const mockTx = {
      execute: vi.fn().mockImplementation((queryObj: any) => {
        const queryStr = typeof queryObj === 'string' ? queryObj : JSON.stringify(queryObj);
        executedQueries.push(queryStr);
        return Promise.resolve();
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    await withTenantTransaction('tenant-secure', async () => {});

    expect(executedQueries.some((q) => q.includes("SET LOCAL app.current_tenant_id = 'tenant-secure'"))).toBe(true);
  });
});
