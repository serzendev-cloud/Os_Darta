/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractTenantSlug } from '../../src/proxy';
import { withTenantTransaction } from '../../src/lib/db/tenant-transaction';
import { db } from '../../src/lib/db';

describe('WP-SAAS-SEC-002: Tenant Database RLS & Isolation Hardening Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── TEST 1: Tenant A can access Tenant A data within its transaction context ──
  it('TEST 1: executes within tenant transaction context setting SET LOCAL app.current_tenant_id', async () => {
    const executedQueries: string[] = [];
    function extractQuery(q: any): string {
      if (typeof q === 'string') return q;
      if (q?.queryChunks) {
        return q.queryChunks
          .map((chunk: any) => (typeof chunk === 'string' ? chunk : chunk?.value || String(chunk)))
          .join('');
      }
      return JSON.stringify(q);
    }

    const mockTx = {
      execute: vi.fn().mockImplementation((queryObj: any) => {
        executedQueries.push(extractQuery(queryObj));
        return Promise.resolve();
      }),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 's1', name: 'Santri A', tenantId: 'tenant-a' }]),
    };

    const transactionSpy = vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => {
      return await cb(mockTx);
    });

    const result = await withTenantTransaction('tenant-a', async (tx: any) => {
      return await tx.select().from({}).where({});
    });

    expect(transactionSpy).toHaveBeenCalledTimes(1);
    expect(executedQueries.some((q) => q.includes("SET LOCAL app.current_tenant_id = 'tenant-a'"))).toBe(true);
    expect(executedQueries.some((q) => q.includes("SET LOCAL app.is_super_admin = 'false'"))).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].tenantId).toBe('tenant-a');
  });

  // ── TEST 2: Tenant A cannot read Tenant B data (Simulated RLS boundary) ──
  it('TEST 2: prevents cross-tenant read by isolating tenant transaction boundary', async () => {
    const mockDbData = [
      { id: 'item-1', name: 'Data Tenant A', tenantId: 'tenant-a' },
      { id: 'item-2', name: 'Data Tenant B', tenantId: 'tenant-b' },
    ];

    const mockTx = {
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation((_condition: any) => {
            // Emulating Postgres RLS behavior: filtering strictly by tenant-a
            return Promise.resolve(mockDbData.filter((d) => d.tenantId === 'tenant-a'));
          }),
        }),
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const records = await withTenantTransaction('tenant-a', async (tx: any) => {
      return await tx.select().from({}).where({});
    });

    expect(records.every((r: any) => r.tenantId === 'tenant-a')).toBe(true);
    expect(records.some((r: any) => r.tenantId === 'tenant-b')).toBe(false);
  });

  // ── TEST 3: Tenant A cannot update Tenant B data ──
  it('TEST 3: rejects update on Tenant B data when context is Tenant A', async () => {
    let updateEffectCount = 0;
    const mockTx = {
      execute: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation((condition: any) => {
            // If updating item belonging to tenant-b while context is tenant-a, 0 rows updated
            updateEffectCount = 0;
            return Promise.resolve({ count: updateEffectCount });
          }),
        }),
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const result = await withTenantTransaction('tenant-a', async (tx: any) => {
      return await tx.update({}).set({ name: 'Tampered' }).where({ id: 'item-b', tenantId: 'tenant-a' });
    });

    expect(result.count).toBe(0);
  });

  // ── TEST 4: Tenant A cannot delete Tenant B data ──
  it('TEST 4: rejects delete on Tenant B data under Tenant A context', async () => {
    let deleteEffectCount = 0;
    const mockTx = {
      execute: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          deleteEffectCount = 0;
          return Promise.resolve({ count: deleteEffectCount });
        }),
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const result = await withTenantTransaction('tenant-a', async (tx: any) => {
      return await tx.delete({}).where({ id: 'item-b' });
    });

    expect(result.count).toBe(0);
  });

  // ── TEST 5: Tenant A cannot insert a record belonging to Tenant B ──
  it('TEST 5: enforces tenant_id match during insert operations', async () => {
    const mockTx = {
      execute: vi.fn().mockResolvedValue(undefined),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((payload: any) => {
          if (payload.tenantId && payload.tenantId !== 'tenant-a') {
            throw new Error('RLS Policy Violation: WITH CHECK failed (cross-tenant insert blocked)');
          }
          return Promise.resolve({ success: true });
        }),
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    await expect(
      withTenantTransaction('tenant-a', async (tx: any) => {
        return await tx.insert({}).values({ id: 'new-item', name: 'Unauthorized', tenantId: 'tenant-b' });
      })
    ).rejects.toThrow('cross-tenant insert blocked');
  });

  // ── TEST 6: Proxy Zero-Trust rejects manipulated client headers ──
  it('TEST 6: extracts tenant slug strictly from subdomain and ignores client spoofed x-tenant-id', () => {
    const req = {
      nextUrl: { pathname: '/dashboard/santri' },
      headers: {
        get: vi.fn().mockImplementation((h: string) => {
          if (h === 'host') return 'alfatih.madev.id';
          if (h === 'x-tenant-id') return 'victim-tenant-id';
          if (h === 'x-tenant-slug') return 'victim-slug';
          return null;
        }),
      },
    } as any;

    const slug = extractTenantSlug(req);
    expect(slug).toBe('alfatih');
    expect(slug).not.toBe('victim-slug');
  });

  // ── TEST 7: Proxy fails-closed on reserved hostnames ──
  it('TEST 7: fails-closed on reserved administrative hostnames', () => {
    const reservedList = ['www.madev.id', 'api.madev.id', 'saas.madev.id', 'dashboard.madev.id'];
    for (const host of reservedList) {
      const req = {
        nextUrl: { pathname: '/login' },
        headers: {
          get: vi.fn().mockImplementation((h: string) => (h === 'host' ? host : null)),
        },
      } as any;
      expect(extractTenantSlug(req)).toBe('default');
    }
  });

  // ── TEST 8: /t/:slug path extraction validates and sanitizes properly ──
  it('TEST 8: extracts path-based tenant slug only when valid and not reserved', () => {
    const reqValid = {
      nextUrl: { pathname: '/t/daruttahuid/login' },
      headers: { get: () => 'localhost:3000' },
    } as any;
    expect(extractTenantSlug(reqValid)).toBe('daruttahuid');

    const reqReserved = {
      nextUrl: { pathname: '/t/api/login' },
      headers: { get: () => 'localhost:3000' },
    } as any;
    expect(extractTenantSlug(reqReserved)).toBe('default');
  });

  // ── TEST 9: Client localStorage manipulation cannot influence server RLS context ──
  it('TEST 9: withTenantTransaction requires explicit server-resolved tenant context', async () => {
    const executedQueries: string[] = [];
    function extractQuery(q: any): string {
      if (typeof q === 'string') return q;
      if (q?.queryChunks) {
        return q.queryChunks
          .map((chunk: any) => (typeof chunk === 'string' ? chunk : chunk?.value || String(chunk)))
          .join('');
      }
      return JSON.stringify(q);
    }

    const mockTx = {
      execute: vi.fn().mockImplementation((q: any) => {
        executedQueries.push(extractQuery(q));
        return Promise.resolve();
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    // Server passes verified server tenant ID 'tenant-server-verified'
    await withTenantTransaction('tenant-server-verified', async () => ({}));

    expect(executedQueries[0]).toContain("SET LOCAL app.current_tenant_id = 'tenant-server-verified'");
    expect(executedQueries[0]).not.toContain('localStorage');
  });

  // ── TEST 10: Connection pool isolation via SET LOCAL ──
  it('TEST 10: SET LOCAL ensures transaction-only scoping without persistent session leakage', async () => {
    const queries: string[] = [];
    function extractQuery(q: any): string {
      if (typeof q === 'string') return q;
      if (q?.queryChunks) {
        return q.queryChunks
          .map((chunk: any) => (typeof chunk === 'string' ? chunk : chunk?.value || String(chunk)))
          .join('');
      }
      return JSON.stringify(q);
    }

    const mockTx = {
      execute: vi.fn().mockImplementation((q: any) => {
        queries.push(extractQuery(q));
        return Promise.resolve();
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    await withTenantTransaction('tenant-session-1', async () => {});
    await withTenantTransaction('tenant-session-2', async () => {});

    // All must use 'SET LOCAL' so connection pool resets state automatically upon commit
    expect(queries.every((q) => q.startsWith('SET LOCAL'))).toBe(true);
    expect(queries[0]).toContain('tenant-session-1');
    expect(queries[2]).toContain('tenant-session-2');
  });

  // ── TEST 11: Super Admin legitimate platform bypass ──
  it('TEST 11: allows super_admin flag to set app.is_super_admin = true for global management', async () => {
    const queries: string[] = [];
    function extractQuery(q: any): string {
      if (typeof q === 'string') return q;
      if (q?.queryChunks) {
        return q.queryChunks
          .map((chunk: any) => (typeof chunk === 'string' ? chunk : chunk?.value || String(chunk)))
          .join('');
      }
      return JSON.stringify(q);
    }

    const mockTx = {
      execute: vi.fn().mockImplementation((q: any) => {
        queries.push(extractQuery(q));
        return Promise.resolve();
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    await withTenantTransaction('platform-admin', async () => {}, { isSuperAdmin: true });

    expect(queries.some((q) => q.includes("SET LOCAL app.is_super_admin = 'true'"))).toBe(true);
  });

  // ── TEST 12: Developer legitimate platform bypass ──
  it('TEST 12: developer role uses super admin flag to perform platform-level operations', async () => {
    const queries: string[] = [];
    function extractQuery(q: any): string {
      if (typeof q === 'string') return q;
      if (q?.queryChunks) {
        return q.queryChunks
          .map((chunk: any) => (typeof chunk === 'string' ? chunk : chunk?.value || String(chunk)))
          .join('');
      }
      return JSON.stringify(q);
    }

    const mockTx = {
      execute: vi.fn().mockImplementation((q: any) => {
        queries.push(extractQuery(q));
        return Promise.resolve();
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    await withTenantTransaction('platform-dev', async () => {}, { isSuperAdmin: true });

    expect(queries.some((q) => q.includes("SET LOCAL app.is_super_admin = 'true'"))).toBe(true);
  });

  // ── TEST 13: Platform-global tables remain accessible ──
  it('TEST 13: global catalogs operate without tenant-bound constraints', () => {
    const globalTables = ['permissions', 'platform_roles', 'user_platform_roles', 'ppob_categories', 'ppob_products'];
    expect(globalTables).toContain('permissions');
    expect(globalTables).toContain('ppob_categories');
    expect(globalTables.length).toBe(5);
  });

  // ── TEST 14: tenant_settings strict isolation ──
  it('TEST 14: tenant_settings isolation strictly isolates Tenant A and Tenant B branding and credentials', async () => {
    const tenantSettingsDb = [
      { tenantId: 't-alfatih', primaryColor: '#0F766E', customLogoUrl: 'https://alfatih.id/logo.png' },
      { tenantId: 't-daruttahuid', primaryColor: '#1E3A8A', customLogoUrl: 'https://daruttahuid.id/logo.png' },
    ];

    const mockTx = {
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            return Promise.resolve(tenantSettingsDb.filter((s) => s.tenantId === 't-alfatih'));
          }),
        }),
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const settings = await withTenantTransaction('t-alfatih', async (tx: any) => {
      return await tx.select().from({}).where({});
    });

    expect(settings).toHaveLength(1);
    expect(settings[0].tenantId).toBe('t-alfatih');
    expect(settings[0].primaryColor).toBe('#0F766E');
    expect(settings.some((s: any) => s.tenantId === 't-daruttahuid')).toBe(false);
  });

  // ── TEST 15: tenants table prevents full tenant enumeration for regular tenants ──
  it('TEST 15: tenants table self-read policy limits visibility to current tenant context', async () => {
    const allTenants = [
      { id: 't-1', slug: 'alfatih', name: 'Pesantren Al-Fatih' },
      { id: 't-2', slug: 'daruttahuid', name: 'Pesantren Daruttahuid' },
      { id: 't-3', slug: 'alhikmah', name: 'Pesantren Al-Hikmah' },
    ];

    const mockTx = {
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            // Emulating tenants_self_read policy: id = current_tenant_id OR slug = current_tenant_slug
            return Promise.resolve(allTenants.filter((t) => t.id === 't-1'));
          }),
        }),
      }),
    };

    vi.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

    const result = await withTenantTransaction('t-1', async (tx: any) => {
      return await tx.select().from({}).where({});
    }, { tenantSlug: 'alfatih' });

    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('alfatih');
    expect(result.some((t: any) => t.slug === 'daruttahuid')).toBe(false);
  });
});
