/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Use vi.hoisted for top-level mock functions in Vitest
const { mockRequirePermission, mockGetTenantContext, mockWithTenantTransaction } = vi.hoisted(() => ({
  mockRequirePermission: vi.fn(),
  mockGetTenantContext: vi.fn(),
  mockWithTenantTransaction: vi.fn(),
}));

vi.mock('@/lib/authz/authorization-service', () => ({
  requirePermission: mockRequirePermission,
}));

vi.mock('@/lib/tenant/context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/tenant/context')>();
  return {
    ...actual,
    getTenantContext: mockGetTenantContext,
  };
});

vi.mock('@/lib/db/tenant-transaction', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/db/tenant-transaction')>();
  return {
    ...actual,
    withTenantTransaction: mockWithTenantTransaction.mockImplementation(actual.withTenantTransaction),
  };
});

vi.mock('@/lib/db', () => {
  const mockDb = {
    execute: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'santri-1', name: 'Ahmad' }]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue([{ id: 'santri-new' }]),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ success: true }]),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ success: true }]),
    }),
    transaction: vi.fn().mockImplementation(async (cb: (tx: any) => Promise<any>) => cb(mockDb)),
  };
  return { db: mockDb };
});

import { GET, POST } from '../../src/app/api/db/query/route';
import { TenantNotFoundError, TenantUnavailableError } from '@/lib/tenant/context';

describe('WP-101 Phase 1F — Authorization Enforcement Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetTenantContext.mockResolvedValue({
      id: 'tenant-alfatih',
      name: 'Pesantren Al Fatih',
      slug: 'alfatih',
    });
  });

  describe('1. API Route Read Authorization Enforcement (GET /api/db/query)', () => {
    it('should return 403 Forbidden when user is missing required read permission', async () => {
      mockRequirePermission.mockResolvedValue({
        authorized: false,
        decision: 'DENIED_PERMISSION_MISSING',
        reason: 'User missing required permission: view_santri',
      });

      const req = new NextRequest('http://localhost/api/db/query?collection=santri', {
        headers: {
          'x-user-id': 'user-unprivileged',
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
      expect(json.message).toContain('view_santri');
    });

    it('should return 200 OK when user possesses required read permission', async () => {
      mockRequirePermission.mockResolvedValue({
        authorized: true,
        decision: 'AUTHORIZED',
        effectivePermissions: new Set(['view_santri']),
      });

      const req = new NextRequest('http://localhost/api/db/query?collection=santri', {
        headers: {
          'x-user-id': 'user-authorized',
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.tenantId).toBe('tenant-alfatih');
      expect(json.data).toBeDefined();
    });
  });

  describe('2. API Route Mutation Authorization Enforcement (POST /api/db/query)', () => {
    it('should return 403 Forbidden when user attempts mutation without write permission', async () => {
      mockRequirePermission.mockResolvedValue({
        authorized: false,
        decision: 'DENIED_PERMISSION_MISSING',
        reason: 'User missing required permission: manage_santri',
      });

      const req = new NextRequest('http://localhost/api/db/query', {
        method: 'POST',
        headers: {
          'x-user-id': 'user-unprivileged',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: 'santri',
          action: 'create',
          data: { name: 'Santri Baru' },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toBe('Forbidden');
    });

    it('should return 200 OK for authorized mutation when user possesses write permission', async () => {
      mockRequirePermission.mockResolvedValue({
        authorized: true,
        decision: 'AUTHORIZED',
        effectivePermissions: new Set(['manage_santri']),
      });

      const req = new NextRequest('http://localhost/api/db/query', {
        method: 'POST',
        headers: {
          'x-user-id': 'user-authorized',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          collectionName: 'santri',
          action: 'create',
          data: { name: 'Santri Baru' },
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.tenantId).toBe('tenant-alfatih');
    });
  });

  describe('3. Tenant Resolution Failure Isolation (GET /api/db/query)', () => {
    it('should abort without calling requirePermission or withTenantTransaction when tenant is not found', async () => {
      mockGetTenantContext.mockRejectedValue(new TenantNotFoundError('non-existent-tenant'));

      const req = new NextRequest('http://localhost/api/db/query?collection=santri', {
        headers: {
          'x-user-id': 'user-authorized',
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(500);
      expect(mockRequirePermission).not.toHaveBeenCalled();
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();

      const json = await res.json();
      expect(json.tenantId).toBeUndefined();
      expect(json.data).toBeUndefined();
      expect(json.error).toBe('Failed to query database');
    });

    it('should abort without calling requirePermission or withTenantTransaction when tenant query is unavailable', async () => {
      mockGetTenantContext.mockRejectedValue(new TenantUnavailableError('Database query failed'));

      const req = new NextRequest('http://localhost/api/db/query?collection=santri', {
        headers: {
          'x-user-id': 'user-authorized',
        },
      });

      const res = await GET(req);
      expect(res.status).toBe(500);
      expect(mockRequirePermission).not.toHaveBeenCalled();
      expect(mockWithTenantTransaction).not.toHaveBeenCalled();

      const json = await res.json();
      expect(json.tenantId).toBeUndefined();
      expect(json.data).toBeUndefined();
      expect(json.error).toBe('Failed to query database');
    });
  });
});
