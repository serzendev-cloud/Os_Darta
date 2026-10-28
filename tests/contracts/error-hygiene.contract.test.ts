/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const {
  mockGetTenantContext,
  mockAuthorizeOperationalApi,
  mockAuthorizeCurrentPlatformRoles,
  mockSupabaseGetUser,
  mockAcademicTranscriptGet,
  mockDigiflazzTransaction,
} = vi.hoisted(() => ({
  mockGetTenantContext: vi.fn(),
  mockAuthorizeOperationalApi: vi.fn(),
  mockAuthorizeCurrentPlatformRoles: vi.fn(),
  mockSupabaseGetUser: vi.fn(),
  mockAcademicTranscriptGet: vi.fn(),
  mockDigiflazzTransaction: vi.fn(),
}));

vi.mock('@/lib/tenant/context', () => ({
  getTenantContext: () => mockGetTenantContext(),
}));

vi.mock('@/lib/authz/authorization-service', () => ({
  authorizeOperationalApi: (...args: any[]) => mockAuthorizeOperationalApi(...args),
  authorizeCurrentPlatformRoles: (...args: any[]) => mockAuthorizeCurrentPlatformRoles(...args),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: mockSupabaseGetUser,
    },
  })),
}));

vi.mock('@/lib/db/services/academic-ledger', () => ({
  academicTranscriptService: {
    get: (...args: any[]) => mockAcademicTranscriptGet(...args),
  },
}));

vi.mock('@/lib/ppob/digiflazz', () => ({
  digiflazzClient: {
    createTransaction: (...args: any[]) => mockDigiflazzTransaction(...args),
  },
}));

vi.mock('@/modules/saas/services/tenant-hard-delete-service', () => ({
  tenantHardDeleteService: {
    planHardDelete: vi.fn().mockRejectedValue(new Error('FATAL_POSTGRES_CATALOG_CORRUPTION_LEAK_TEST')),
    executeHardDelete: vi.fn().mockRejectedValue(new Error('FATAL_DATABASE_FOREIGN_KEY_VIOLATION_LEAK_TEST')),
  },
}));

import { GET as getAcademicLedger } from '@/app/api/academic/ledger/route';
import { POST as postCompleteOnboarding } from '@/app/api/auth/complete-onboarding/route';
import { GET as getHardDelete, POST as postHardDelete } from '@/app/api/saas/tenants/[id]/hard-delete/route';
import { POST as postPlatformPg } from '@/app/api/webhooks/platform-pg/route';

describe('WP-SEC-FINAL-001 — Part D Error Hygiene Contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetTenantContext.mockResolvedValue({
      id: 'tenant-test-1',
      name: 'Pesantren Al Fatih',
      slug: 'alfatih',
    });

    mockAuthorizeOperationalApi.mockResolvedValue({
      authorized: true,
    });

    mockAuthorizeCurrentPlatformRoles.mockResolvedValue({
      authorized: true,
      userId: 'super-admin-uuid-1',
      role: 'SUPER_ADMIN',
    });

    mockSupabaseGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-test-uuid',
          email: 'test@example.com',
          app_metadata: { role: 'ADMIN' },
        },
      },
      error: null,
    });
  });

  it('1. GET /api/academic/ledger: Internal error does not leak database error message to client (500)', async () => {
    mockAcademicTranscriptGet.mockRejectedValueOnce(
      new Error('DrizzleQueryError: select * from transcripts connection reset at pg_pool:123')
    );

    const req = new NextRequest('http://localhost/api/academic/ledger?academicTermId=term-1');
    const res = await getAcademicLedger(req);
    expect(res.status).toBe(500);
    const json = await res.json();

    expect(json.code).toBe('INTERNAL_ERROR');
    expect(json.message).toBe('Gagal mengambil data ledger');
    expect(JSON.stringify(json)).not.toContain('DrizzleQueryError');
    expect(JSON.stringify(json)).not.toContain('pg_pool');
  });

  it('2. POST /api/auth/complete-onboarding: Unexpected error does not leak internal error message to client (500)', async () => {
    mockSupabaseGetUser.mockRejectedValueOnce(
      new Error('FATAL: supabase auth internal worker failed at auth-worker.ts:999')
    );

    const req = new NextRequest('http://localhost/api/auth/complete-onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });
    const res = await postCompleteOnboarding(req);
    expect(res.status).toBe(500);
    const json = await res.json();

    expect(json.error).toBe('InternalServerError');
    expect(json.message).toBe('Gagal menyelesaikan proses onboarding.');
    expect(JSON.stringify(json)).not.toContain('supabase auth internal worker');
  });

  it('3. GET /api/saas/tenants/:id/hard-delete: Failure does not leak internal stack or sensitive error string', async () => {
    const req = new NextRequest('http://localhost/api/saas/tenants/t1/hard-delete');
    const res = await getHardDelete(req, { params: Promise.resolve({ id: 't1' }) });
    expect(res.status).toBe(400);
    const json = await res.json();

    expect(json.message).toBe('Gagal merencanakan hard-delete tenant.');
    expect(JSON.stringify(json)).not.toContain('FATAL_POSTGRES_CATALOG_CORRUPTION');
  });

  it('4. POST /api/saas/tenants/:id/hard-delete: Unexpected execution error does not leak sensitive stack trace', async () => {
    const req = new NextRequest('http://localhost/api/saas/tenants/t1/hard-delete', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost',
      },
      body: JSON.stringify({ confirmationCode: 'DELETE-T01-CONFIRMED' }),
    });
    const res = await postHardDelete(req, { params: Promise.resolve({ id: 't1' }) });
    expect(res.status).toBe(400);
    const json = await res.json();

    expect(json.message).toBe('Gagal mengeksekusi hard-delete tenant.');
    expect(JSON.stringify(json)).not.toContain('FATAL_DATABASE_FOREIGN_KEY_VIOLATION');
  });

  it('5. POST /api/webhooks/platform-pg: Catch block returns generic error message without leaking internal trace', async () => {
    mockDigiflazzTransaction.mockRejectedValueOnce(
      new Error('FATAL: digiflazz upstream connection timeout at net:10.0.0.1')
    );

    const req = new NextRequest('http://localhost/api/webhooks/platform-pg', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        status: 'PAID',
        transactionId: 'TRX-12345',
        buyerSkuCode: 'pln20',
        customerNo: '14029981240',
        totalAmount: 21500,
      }),
    });

    const res = await postPlatformPg(req);
    expect(res.status).toBe(500);
    const json = await res.json();

    expect(json.code).toBe('INTERNAL_ERROR');
    expect(json.message).toBe('Gagal memproses webhook pembayaran platform');
    expect(JSON.stringify(json)).not.toContain('digiflazz upstream connection timeout');
  });
});
