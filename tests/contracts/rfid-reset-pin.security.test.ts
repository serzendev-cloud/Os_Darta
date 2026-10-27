/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { rfidCards, santri, auditLogs } from '@/lib/db/schema';

const mockGetTenantContext = vi.fn();
const mockRequirePermission = vi.fn();
const mockWithTenantTransaction = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/tenant/context', () => ({
  getTenantContext: () => mockGetTenantContext(),
}));

vi.mock('@/lib/authz/authorization-service', () => ({
  requirePermission: (...args: any[]) => mockRequirePermission(...args),
}));

vi.mock('@/lib/db/tenant-transaction', () => ({
  withTenantTransaction: (tenantId: string, cb: any, opts: any) => mockWithTenantTransaction(tenantId, cb, opts),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

import { POST } from '../../src/app/api/rfid/reset-pin/route';

describe('WP-SEC-RFID-PIN-001 — Security Hardening Contract Tests', () => {
  let mockState: {
    cards: any[];
    santriList: any[];
    cardUpdates: any[];
    auditInserts: any[];
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RFID_PIN_PEPPER_V1 = 'test-environment-pepper-secret-32-bytes-length!';

    mockState = {
      cards: [
        {
          id: 'card-001',
          tenantId: 'tenant-al-fatih',
          cardUid: 'RFID_ALFATIH_001',
          santriId: 'santri-001',
          status: 'blocked',
          pinFailedAttempts: 3,
        },
      ],
      santriList: [
        {
          id: 'santri-001',
          tenantId: 'tenant-al-fatih',
          name: 'Ahmad Santri',
          kelas: 'X-A',
        },
      ],
      cardUpdates: [],
      auditInserts: [],
    };

    mockGetTenantContext.mockResolvedValue({
      id: 'tenant-al-fatih',
      name: 'Pesantren Al Fatih',
      slug: 'alfatih',
    });

    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('No session cookie present'),
    });

    mockRequirePermission.mockResolvedValue({
      authorized: true,
      primaryRoleCode: 'ADMIN',
      effectivePermissions: new Set(['manage_rfid_pin']),
      reason: null,
    });

    mockWithTenantTransaction.mockImplementation(async (tenantId: string, cb: any) => {
      const tx = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation((table) => ({
            where: vi.fn().mockImplementation(() => {
              if (table === rfidCards) {
                return Promise.resolve(mockState.cards.filter((c) => c.tenantId === tenantId));
              }
              if (table === santri) {
                return Promise.resolve(mockState.santriList.filter((s) => s.tenantId === tenantId));
              }
              return Promise.resolve([]);
            }),
          })),
        })),
        update: vi.fn().mockImplementation((table) => ({
          set: vi.fn().mockImplementation((setData) => ({
            where: vi.fn().mockImplementation((whereClause) => {
              mockState.cardUpdates.push({ table, setData, whereClause });
              return Promise.resolve();
            }),
          })),
        })),
        insert: vi.fn().mockImplementation((table) => ({
          values: vi.fn().mockImplementation((valuesData) => {
            mockState.auditInserts.push({ table, valuesData });
            return Promise.resolve();
          }),
        })),
      };

      return await cb(tx);
    });
  });

  it('1. Tanpa login: Mengembalikan HTTP 401 saat tidak ada sesi server maupun test user', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('No session'),
    });

    const req = new NextRequest('http://localhost:3000/api/rfid/reset-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        cardUid: 'RFID_ALFATIH_001',
        newPin: '123456',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('UNAUTHENTICATED');
  });

  it('2. Tanpa izin: Mengembalikan HTTP 403 saat pengguna tidak memiliki izin manage_rfid_pin', async () => {
    mockRequirePermission.mockResolvedValue({
      authorized: false,
      decision: 'DENIED_PERMISSION_MISSING',
      reason: 'User missing required permission: manage_rfid_pin',
      effectivePermissions: new Set(),
    });

    const req = new NextRequest('http://localhost:3000/api/rfid/reset-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'user-unprivileged',
      },
      body: JSON.stringify({
        cardUid: 'RFID_ALFATIH_001',
        newPin: '123456',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('FORBIDDEN');
  });

  it('3. Spoofing body/header diabaikan: Klaim role super_admin dan tenantId di body tidak mengubah tenant atau otorisasi', async () => {
    mockRequirePermission.mockResolvedValue({
      authorized: false,
      decision: 'DENIED_PERMISSION_MISSING',
      reason: 'Unauthorized attacker',
      effectivePermissions: new Set(),
    });

    const req = new NextRequest('http://localhost:3000/api/rfid/reset-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'attacker-id',
        'x-user-role': 'super_admin',
      },
      body: JSON.stringify({
        cardUid: 'RFID_ALFATIH_001',
        newPin: '999999',
        tenantId: 'victim-tenant-999',
        operatorRole: 'super_admin',
        operatorUserId: 'evil-spoofed-admin',
        operatorKelasBinaan: 'ALL',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    // Pastikan requirePermission dipanggil dengan tenant resmi dari getTenantContext, bukan dari body
    expect(mockRequirePermission).toHaveBeenCalledWith('attacker-id', 'tenant-al-fatih', 'manage_rfid_pin');
  });

  it('4. Kartu tenant lain: Mengembalikan HTTP 404 saat kartu bukan milik tenant terautentikasi', async () => {
    // Kartu milik tenant lain
    mockState.cards = [
      {
        id: 'card-other',
        tenantId: 'other-tenant-xyz',
        cardUid: 'RFID_OTHER_001',
        santriId: 'santri-other',
        status: 'active',
      },
    ];

    const req = new NextRequest('http://localhost:3000/api/rfid/reset-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'admin-valid',
      },
      body: JSON.stringify({
        cardUid: 'RFID_OTHER_001',
        newPin: '123456',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.code).toBe('CARD_NOT_FOUND');
  });

  it('5. Sukses dengan izin: Berhasil mereset PIN, unblock kartu (status=active, pinFailedAttempts=0), dan mencatat audit log', async () => {
    const req = new NextRequest('http://localhost:3000/api/rfid/reset-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'operator-bendahara',
      },
      body: JSON.stringify({
        cardUid: 'RFID_ALFATIH_001',
        newPin: '654321',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.code).toBe('PIN_RESET_SUCCESS');
    expect(json.data.status).toBe('active');
    expect(json.data.cardUid).toBe('RFID_ALFATIH_001');

    // Verifikasi bahwa update ke rfidCards atomik dan mengosongkan pinFailedAttempts
    expect(mockState.cardUpdates.length).toBe(1);
    const updatePayload = mockState.cardUpdates[0].setData;
    expect(updatePayload.pinFailedAttempts).toBe(0);
    expect(updatePayload.status).toBe('active');
    expect(updatePayload.lastPinResetBy).toBe('operator-bendahara');
    expect(updatePayload.hashedPin).toBeDefined();

    // Verifikasi audit log tercatat tanpa membocorkan PIN mentah
    expect(mockState.auditInserts.length).toBe(1);
    const auditRecord = mockState.auditInserts[0].valuesData;
    expect(auditRecord.action).toBe('RFID_PIN_RESET');
    expect(auditRecord.targetEntity).toBe('rfid_card');
    expect(auditRecord.targetId).toBe('card-001');
    expect(auditRecord.tenantId).toBe('tenant-al-fatih');
    expect(auditRecord.details).not.toContain('654321');
  });

  it('6. Wali kelas: Mengembalikan HTTP 403 saat diakses oleh wali_kelas', async () => {
    mockRequirePermission.mockResolvedValue({
      authorized: false,
      primaryRoleCode: 'WALI_KELAS',
      reason: 'Wali Kelas tidak memiliki izin manage_rfid_pin',
      effectivePermissions: new Set(),
    });

    const req = new NextRequest('http://localhost:3000/api/rfid/reset-pin', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'guru-wali-kelas-id',
      },
      body: JSON.stringify({
        cardUid: 'RFID_ALFATIH_001',
        newPin: '123456',
        operatorRole: 'wali_kelas',
        operatorKelasBinaan: 'X-A',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);

    const json = await res.json();
    expect(json.success).toBe(false);
  });
});
