/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/webhooks/flip/route';

const { mockDb } = vi.hoisted(() => {
  const dbObj = {
    select: vi.fn(),
    update: vi.fn(),
    insert: vi.fn(),
  };
  return { mockDb: dbObj };
});

vi.mock('@/lib/db', () => ({
  db: mockDb,
}));

describe('WP-SEC-FINAL-001 — Flip Webhook Security Contract Tests', () => {
  const TEST_VALIDATION_TOKEN = 'test_flip_secret_validation_token_12345';
  let mockInvoices: any[];
  let mockWallets: any[];
  let mockTenantSettings: any[];
  let insertedPockets: any[];
  let updatedInvoices: any[];
  let updatedWallets: any[];

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.FLIP_VALIDATION_TOKEN;

    mockInvoices = [
      {
        id: 'inv_001',
        flipBillId: 'BILL_123',
        tenantId: 'tenant_al_fatih',
        santriId: 'santri_001',
        waliId: 'wali_001',
        status: 'PENDING',
        amountUangSaku: 50000,
        amountTabungan: 100000,
        invoiceNumber: 'INV/2026/001',
      },
    ];

    mockWallets = [
      {
        id: 'w_001',
        tenantId: 'tenant_al_fatih',
        santriId: 'santri_001',
        waliId: 'wali_001',
        balanceUangSaku: 20000,
        balanceTabungan: 50000,
      },
    ];

    mockTenantSettings = [
      {
        tenantId: 'tenant_al_fatih',
        flipValidationToken: TEST_VALIDATION_TOKEN,
      },
    ];

    insertedPockets = [];
    updatedInvoices = [];
    updatedWallets = [];

    mockDb.select.mockImplementation((fields?: any) => ({
      from: vi.fn().mockImplementation((table: any) => ({
        where: vi.fn().mockImplementation((condition: any) => {
          // If selecting from tenantSettings
          if (fields && fields.token) {
            return Promise.resolve(mockTenantSettings.map((s) => ({ token: s.flipValidationToken })));
          }
          // If selecting from invoices
          if (table?.flipBillId !== undefined || String(condition).includes('flip_bill_id')) {
            return Promise.resolve(mockInvoices);
          }
          // If selecting from wallets
          return Promise.resolve(mockWallets);
        }),
      })),
    }));

    mockDb.update.mockImplementation((table: any) => ({
      set: vi.fn().mockImplementation((setData: any) => ({
        where: vi.fn().mockImplementation((whereClause: any) => {
          if (setData.status === 'SUCCESS') {
            updatedInvoices.push({ setData, whereClause });
          } else {
            updatedWallets.push({ setData, whereClause });
          }
          return Promise.resolve([]);
        }),
      })),
    }));

    mockDb.insert.mockImplementation((table: any) => ({
      values: vi.fn().mockImplementation((vals: any) => {
        insertedPockets.push(vals);
        return {
          returning: vi.fn().mockResolvedValue([vals]),
        };
      }),
    }));
  });

  it('1. Permintaan tanpa token validasi ditolak HTTP 401 UNAUTHORIZED', async () => {
    process.env.FLIP_VALIDATION_TOKEN = TEST_VALIDATION_TOKEN;

    const req = new Request('http://localhost:3000/api/webhooks/flip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        data: {
          id: 'BILL_123',
          status: 'SUCCESS',
          amount: 150000,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.code).toBe('UNAUTHORIZED');
    expect(json.message).toContain('tidak ditemukan');
    expect(updatedInvoices).toHaveLength(0);
  });

  it('2. Permintaan dengan token salah ditolak HTTP 401 UNAUTHORIZED', async () => {
    process.env.FLIP_VALIDATION_TOKEN = TEST_VALIDATION_TOKEN;

    const req = new Request('http://localhost:3000/api/webhooks/flip', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-flip-token': 'wrong-attacker-token-value',
      },
      body: JSON.stringify({
        data: {
          id: 'BILL_123',
          status: 'SUCCESS',
          amount: 150000,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.code).toBe('UNAUTHORIZED');
    expect(json.message).toContain('tidak cocok');
    expect(updatedInvoices).toHaveLength(0);
  });

  it('3. Fail-Closed: Rahasia verifikasi tidak terkonfigurasi (env dan DB kosong) ditolak 503 SERVICE_UNAVAILABLE', async () => {
    delete process.env.FLIP_VALIDATION_TOKEN;
    mockTenantSettings = [{ tenantId: 'tenant_al_fatih', flipValidationToken: '' }];

    const req = new Request('http://localhost:3000/api/webhooks/flip', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-flip-token': 'any-token',
      },
      body: JSON.stringify({
        data: {
          id: 'BILL_123',
          status: 'SUCCESS',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.code).toBe('SERVICE_UNAVAILABLE');
    expect(updatedInvoices).toHaveLength(0);
  });

  it('4. Token valid via header x-flip-token: Sukses memproses pembayaran dan mengupdate saldo dompet', async () => {
    process.env.FLIP_VALIDATION_TOKEN = TEST_VALIDATION_TOKEN;

    const req = new Request('http://localhost:3000/api/webhooks/flip', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-flip-token': TEST_VALIDATION_TOKEN,
      },
      body: JSON.stringify({
        data: {
          id: 'BILL_123',
          status: 'SUCCESS',
          amount: 150000,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('success');
    expect(updatedInvoices).toHaveLength(1);
    expect(updatedWallets).toHaveLength(1);
    expect(insertedPockets).toHaveLength(2); // uang_saku & tabungan
  });

  it('5. Token valid via payload body: Sukses memverifikasi token dari body JSON', async () => {
    process.env.FLIP_VALIDATION_TOKEN = TEST_VALIDATION_TOKEN;

    const req = new Request('http://localhost:3000/api/webhooks/flip', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        token: TEST_VALIDATION_TOKEN,
        data: {
          id: 'BILL_123',
          status: 'SUCCESS',
          amount: 150000,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('success');
  });

  it('6. Respons error internal tidak membocorkan detail database/stack trace (500)', async () => {
    process.env.FLIP_VALIDATION_TOKEN = TEST_VALIDATION_TOKEN;

    mockDb.update.mockImplementationOnce(() => {
      throw new Error('FATAL: pgbouncer connection terminated unexpectedly');
    });

    const req = new Request('http://localhost:3000/api/webhooks/flip', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-flip-token': TEST_VALIDATION_TOKEN,
      },
      body: JSON.stringify({
        data: {
          id: 'BILL_123',
          status: 'SUCCESS',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.code).toBe('INTERNAL_ERROR');
    expect(json.message).toBe('Gagal memproses webhook pembayaran');
    expect(JSON.stringify(json)).not.toContain('pgbouncer');
  });
});

