/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRequirePermission = vi.fn();
const mockAuthorizePlatformRole = vi.fn();
const mockGetTenantContext = vi.fn();
const mockDbSelect = vi.fn();
const mockMerchantGetSummary = vi.fn();
let mockAuthUser: any = null;

vi.mock('@/lib/authz/authorization-service', () => ({
  requirePermission: (...args: any[]) => mockRequirePermission(...args),
  authorizePlatformRole: (...args: any[]) => mockAuthorizePlatformRole(...args),
}));

vi.mock('@/lib/tenant/context', () => ({
  DEFAULT_TENANT: { id: 'default' },
  getTenantContext: () => mockGetTenantContext(),
}));

vi.mock('@/lib/finance/merchantLedger', () => ({
  merchantLedgerService: {
    getSummary: (...args: any[]) => mockMerchantGetSummary(...args),
  },
}));

vi.mock('@/lib/db/tenant-transaction', () => ({
  withTenantTransaction: async (_tenantId: string, cb: any) => cb({
    select: () => mockDbSelect(),
  }),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: () => mockDbSelect(),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: vi.fn().mockImplementation(async () => {
        if (!mockAuthUser) {
          return { data: { user: null }, error: new Error('No session') };
        }
        return { data: { user: mockAuthUser }, error: null };
      }),
    },
  })),
}));

import { GET } from '@/app/api/finance/audit-cctv/timeline/route';

describe('Workstream B — Digital CCTV Timeline Authentication & Authorization Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser = null;
    mockAuthorizePlatformRole.mockResolvedValue({ authorized: false });
    mockRequirePermission.mockResolvedValue({ authorized: false });
    mockGetTenantContext.mockResolvedValue({ id: 'tenant-pesantren-a', slug: 'pesantren-a' });
  });

  it('rejects unauthenticated requests with 401 and DOES NOT query database', async () => {
    mockAuthUser = null;
    const req = new Request('http://localhost:3000/api/finance/audit-cctv/timeline');

    const res = await GET(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('UNAUTHENTICATED');

    // Sensitive data query MUST NOT be executed
    expect(mockDbSelect).not.toHaveBeenCalled();
    expect(mockMerchantGetSummary).not.toHaveBeenCalled();
  });

  it('rejects Santri or Wali callers with 403 Forbidden and blocks sensitive student/financial data', async () => {
    mockAuthUser = { id: 'santri_user_1', email: 'santri@pesantren.id' };
    mockRequirePermission.mockResolvedValueOnce({
      authorized: false,
      decision: 'DENIED_PERMISSION_MISSING',
      reason: 'Peran tidak memiliki wewenang untuk mengakses rekaman CCTV dan data transaksi santri',
    });

    const req = new Request('http://localhost:3000/api/finance/audit-cctv/timeline');

    const res = await GET(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('FORBIDDEN');
    expect(json.message).toContain('rekaman CCTV');

    // Sensitive data query MUST NOT be executed
    expect(mockDbSelect).not.toHaveBeenCalled();
    expect(mockMerchantGetSummary).not.toHaveBeenCalled();
  });

  it('rejects unauthorized staff or guru without financial/governance permissions with 403 Forbidden', async () => {
    mockAuthUser = { id: 'guru_user_1', email: 'guru@pesantren.id' };
    mockRequirePermission.mockResolvedValueOnce({
      authorized: false,
      decision: 'DENIED_PERMISSION_MISSING',
      reason: 'Peran tidak memiliki wewenang untuk mengakses rekaman CCTV dan data transaksi santri',
    });

    const req = new Request('http://localhost:3000/api/finance/audit-cctv/timeline');

    const res = await GET(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('FORBIDDEN');
    expect(json.message).toContain('rekaman CCTV');

    expect(mockDbSelect).not.toHaveBeenCalled();
  });

  it('authorizes ADMIN_KEUANGAN and returns scoped events for authorized tenant only', async () => {
    mockAuthUser = { id: 'admin_keuangan_user', email: 'finance@pesantren.id' };
    mockRequirePermission.mockResolvedValueOnce({
      authorized: true,
      decision: 'AUTHORIZED',
    });

    // Mock DB queries for transactions and audit logs
    const mockTxQuery = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          tx: {
            id: 'tx_canteen_1',
            createdAt: new Date().toISOString(),
            amount: 15000,
            status: 'SUCCESS',
            vendorName: 'Kantin Utama',
            canteenId: 'canteen_1',
            itemsDescription: 'Nasi Goreng + Es Teh',
            posCashierId: 'POS-1',
            cardUid: 'CARD-8899',
            santriId: 'santri_123',
            santriName: 'Ahmad Dahlan',
            idempotencyKey: 'idemp_1',
          },
          santriPhoto: 'https://cdn.test/santri_123.jpg',
          santriClass: '7-A',
          santriNis: 'NIS-7001',
        },
      ]),
    };

    const mockAuditQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: 'audit_log_1',
          action: 'CANTEEN_PURCHASE',
          createdAt: new Date().toISOString(),
        },
      ]),
    };

    let queryCount = 0;
    mockDbSelect.mockImplementation(() => {
      queryCount++;
      return queryCount === 1 ? mockTxQuery : mockAuditQuery;
    });

    mockMerchantGetSummary.mockResolvedValueOnce({
      totalGrossSales: 15000,
      totalRefunds: 0,
      netMerchantEntitlement: 15000,
      ledgerEntriesCount: 1,
    });

    const req = new Request('http://localhost:3000/api/finance/audit-cctv/timeline?limit=10');

    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.timelineEvents).toHaveLength(1);
    expect(json.data.timelineEvents[0].santri.name).toBe('Ahmad Dahlan');
    expect(json.data.timelineEvents[0].santri.nis).toBe('NIS-7001');
    expect(json.data.merchantSummary.totalGrossSales).toBe(15000);
    expect(json.data.recentAuditLogs).toHaveLength(1);
    expect(mockMerchantGetSummary).toHaveBeenCalledWith('tenant-pesantren-a');
  });

  it('authorizes Platform SUPER_ADMIN caller with full audit timeline access', async () => {
    mockAuthUser = { id: 'superadmin_1', email: 'superadmin@pesantren.id' };
    mockAuthorizePlatformRole.mockResolvedValueOnce({ authorized: true });

    const mockTxQuery = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    const mockAuditQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    let queryCount = 0;
    mockDbSelect.mockImplementation(() => {
      queryCount++;
      return queryCount === 1 ? mockTxQuery : mockAuditQuery;
    });

    mockMerchantGetSummary.mockResolvedValueOnce({
      totalGrossSales: 0,
      totalRefunds: 0,
      netMerchantEntitlement: 0,
      ledgerEntriesCount: 0,
    });

    const req = new Request('http://localhost:3000/api/finance/audit-cctv/timeline');

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
