/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../src/app/api/saas/tenants/route';
import * as provisioningService from '../../src/modules/saas/services/tenant-provisioning-service';
import * as supabaseAdminModule from '../../src/lib/supabase/admin';
import { db } from '../../src/lib/db';
import { auditLogService } from '../../src/lib/db/services/auditLog';

describe('WP-TENANT-PROVISION-002 — Tenant & Admin Provisioning Contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── 1. Super Admin Authorization ──────────────────────────────────────────
  it('1. Rejects unauthenticated request (missing x-user-id)', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Pesantren Al-Hikmah',
        slug: 'al-hikmah',
        ownerName: 'Ustadz Ahmad',
        ownerEmail: 'admin@alhikmah.id',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Forbidden');
  });

  it('2. Rejects non-superadmin authenticated user (x-is-super-admin !== true)', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'normal_user_123',
        'x-is-super-admin': 'false',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Pesantren Al-Hikmah',
        slug: 'al-hikmah',
        ownerName: 'Ustadz Ahmad',
        ownerEmail: 'admin@alhikmah.id',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  // ── 2. CSRF & Origin Mismatch ─────────────────────────────────────────────
  it('3. Rejects request with mismatched origin (CSRF defense)', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'app.madev.id',
        'origin': 'http://attacker-site.com',
      },
      body: JSON.stringify({
        name: 'Pesantren Al-Hikmah',
        slug: 'al-hikmah',
        ownerName: 'Ustadz Ahmad',
        ownerEmail: 'admin@alhikmah.id',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.message).toContain('CSRF');
  });

  // ── 3. Payload Validation ─────────────────────────────────────────────────
  it('4. Rejects payload with invalid slug format or missing required fields', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Al', // Too short (< 3)
        slug: 'INVALID_SLUG_UPPERCASE',
        ownerName: '',
        ownerEmail: 'invalid-email',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('BadRequest');
  });

  // ── 4. Collision / Idempotency ────────────────────────────────────────────
  it('5. Returns 409 Conflict when tenant slug is already taken', async () => {
    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValueOnce({
      available: false,
      conflictField: 'slug',
      message: "Subdomain / Slug 'darunnajah' sudah digunakan oleh pesantren lain.",
    });

    const req = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Pesantren Darunnajah Baru',
        slug: 'darunnajah',
        ownerName: 'Ustadz Fauzi',
        ownerEmail: 'fauzi@darunnajah.id',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Conflict');
    expect(json.message).toContain('sudah digunakan');
  });

  it('6. Returns 409 Conflict when admin email is already registered', async () => {
    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValueOnce({
      available: false,
      conflictField: 'email',
      message: "Email 'admin@darunnajah.sch.id' sudah terdaftar sebagai pengguna di platform.",
    });

    const req = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Pesantren Al-Fath',
        slug: 'al-fath',
        ownerName: 'Ustadz Fauzi',
        ownerEmail: 'admin@darunnajah.sch.id',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Conflict');
  });

  // ── 5. Successful Provisioning & Identity Chain ───────────────────────────
  it('7. Successfully provisions tenant and verifies canonical identity chain', async () => {
    const mockAuthUserId = '11111111-2222-3333-4444-555555555555';
    const mockCreatedUser = {
      id: mockAuthUserId,
      email: 'admin@darussalam.sch.id',
    };

    // Mock Supabase Admin Auth
    const mockAuthCreateUser = vi.fn().mockResolvedValue({
      data: { user: mockCreatedUser },
      error: null,
    });
    const mockAuthDeleteUser = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          createUser: mockAuthCreateUser,
          deleteUser: mockAuthDeleteUser,
        },
      },
    } as any);

    // Mock DB queries
    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValueOnce({ available: true });

    // Track DB inserts to verify identity chain
    const insertedRecords: Record<string, any> = {};

    vi.spyOn(db, 'transaction').mockImplementation(async (callback: any) => {
      const mockTx = {
        execute: vi.fn().mockResolvedValue([]),
        insert: vi.fn().mockImplementation((table: any) => ({
          values: vi.fn().mockImplementation(async (vals: any) => {
            if (table && table.slug) insertedRecords.tenants = vals;
            if (table && table.primaryColor) insertedRecords.tenantSettings = vals;
            if (table && table.email && table.role) insertedRecords.users = vals;
            if (table && table.roleCode) insertedRecords.tenantRoles = vals;
            if (table && table.primaryRoleId) insertedRecords.userTenantMemberships = vals;
            return [];
          }),
        })),
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockImplementation(() => ({
            where: vi.fn().mockImplementation(() => ({
              limit: vi.fn().mockResolvedValue([]), // No existing role, trigger insert
            })),
          })),
        })),
      };
      return await callback(mockTx);
    });

    const auditSpy = vi.spyOn(auditLogService, 'log').mockResolvedValue('audit_log_123');

    const req = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Pesantren Darussalam',
        slug: 'darussalam',
        location: 'Banyuwangi, Jawa Timur',
        ownerName: 'Kyai Ahmad Darussalam',
        ownerEmail: 'admin@darussalam.sch.id',
        ownerPhone: '081234567890',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.data.tenant.name).toBe('Pesantren Darussalam');
    expect(json.data.tenant.slug).toBe('darussalam');
    expect(json.data.admin.userId).toBe(mockAuthUserId);
    expect(json.data.admin.mustChangePassword).toBe(true);
    expect(json.data.admin.temporaryPassword).toMatch(/^Md#[A-Za-z0-9_-]{16}9!$/); // Exactly 21 chars

    // Verify Identity Chain Invariants
    expect(insertedRecords.users.id).toBe(mockAuthUserId);
    expect(insertedRecords.userTenantMemberships.userId).toBe(mockAuthUserId);
    expect(insertedRecords.userTenantMemberships.status).toBe('ACTIVE');

    // Verify Canonical Tenant Role: 'ADMIN'
    expect(insertedRecords.tenantRoles.roleCode).toBe('ADMIN');

    // Verify Audit Log was recorded with canonical 'tenant' and 'provision' WITHOUT sensitive password
    expect(auditSpy).toHaveBeenCalledTimes(1);
    const auditPayload = auditSpy.mock.calls[0][0];
    expect(auditPayload.action).toBe('provision');
    expect(auditPayload.entityType).toBe('tenant');
    expect(auditPayload.metadata?.authUserId).toBe(mockAuthUserId);
    expect(JSON.stringify(auditPayload)).not.toContain(json.data.admin.temporaryPassword);
  });

  // ── 6. Two-Phase Compensation Rollback ────────────────────────────────────
  it('8. Executes compensation rollback (deleteUser) when database mutation fails without leaking SQL error', async () => {
    const mockAuthUserId = 'orphan-auth-user-999';

    const mockAuthCreateUser = vi.fn().mockResolvedValue({
      data: { user: { id: mockAuthUserId, email: 'admin@failed.id' } },
      error: null,
    });
    const mockAuthDeleteUser = vi.fn().mockResolvedValue({ error: null });

    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          createUser: mockAuthCreateUser,
          deleteUser: mockAuthDeleteUser,
        },
      },
    } as any);

    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValueOnce({ available: true });

    // Simulate database crash during transaction
    vi.spyOn(db, 'transaction').mockRejectedValueOnce(new Error('PostgreSQL Connection Terminated: relation "tenants" locked'));

    const req = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Pesantren Crash Test',
        slug: 'crashtest',
        ownerName: 'Ustadz Budi',
        ownerEmail: 'admin@failed.id',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('PROVISIONING_FAILED');

    // Safe Error Disclosure Check: Internal SQL details MUST NOT leak
    expect(json.message).not.toContain('PostgreSQL Connection Terminated');
    expect(json.message).not.toContain('relation "tenants" locked');
    expect(json.message).toContain('Gagal memprovisi tenant ke database');

    // Verify compensation: deleteUser was called for the orphaned Auth user
    expect(mockAuthDeleteUser).toHaveBeenCalledTimes(1);
    expect(mockAuthDeleteUser).toHaveBeenCalledWith(mockAuthUserId);
  });

  // ── 7. Compensation Failure Handling ─────────────────────────────────────
  it('9. Reports PROVISIONING_COMPENSATION_FAILED when both DB and compensation fail without leaking SQL', async () => {
    const mockAuthUserId = 'critical-orphan-000';

    const mockAuthCreateUser = vi.fn().mockResolvedValue({
      data: { user: { id: mockAuthUserId, email: 'admin@critical.id' } },
      error: null,
    });
    // Compensation fails!
    const mockAuthDeleteUser = vi.fn().mockResolvedValue({
      error: { message: 'Network Timeout on Auth Delete' },
    });

    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          createUser: mockAuthCreateUser,
          deleteUser: mockAuthDeleteUser,
        },
      },
    } as any);

    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValueOnce({ available: true });
    vi.spyOn(db, 'transaction').mockRejectedValueOnce(new Error('Deadlock detected on internal table users'));

    const req = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Pesantren Deadlock',
        slug: 'deadlock',
        ownerName: 'Ustadz Kritis',
        ownerEmail: 'admin@critical.id',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('PROVISIONING_COMPENSATION_FAILED');

    // Safe Error Disclosure: Internal error text must NOT leak to client
    expect(json.message).not.toContain('Deadlock detected on internal table users');
    expect(json.message).toContain('proses pembersihan akun otomatis tidak dapat diselesaikan');
  });

  // ── 8. GET /api/saas/tenants Persistence ──────────────────────────────────
  it('10. Allows Super Admin to fetch persistent tenant records via GET without fake plan or modules', async () => {
    vi.spyOn(provisioningService.tenantProvisioningService, 'listActiveTenants').mockResolvedValueOnce([
      {
        id: 't_001',
        name: 'Pesantren Al-Hikmah',
        slug: 'al-hikmah',
        subdomain: 'al-hikmah.madev.id',
        location: 'Malang',
        ownerName: 'Ustadz Ahmad',
        ownerEmail: 'admin@alhikmah.id',
        ownerPhone: '08123456789',
        plan: undefined, // Canonical plan persistence deferred to WP-SAAS-SUB-001
        status: 'aktif',
        santriCount: 0,
        createdAt: '2026-09-11',
        modules: undefined, // Module persistence deferred to WP-SAAS-ADDON-001
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'GET',
      headers: {
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.tenants).toHaveLength(1);
    expect(json.data.tenants[0].name).toBe('Pesantren Al-Hikmah');
    expect(json.data.tenants[0].plan).toBeUndefined();
    expect(json.data.tenants[0].modules).toBeUndefined();
    expect(json.data.total).toBe(1);
  });

  it('11. Denies non-superadmin access to GET /api/saas/tenants', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'GET',
      headers: {
        'x-user-id': 'regular_user_001',
        'x-is-super-admin': 'false',
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  // ── 9. dbInstance Propagation Contract ───────────────────────────────────
  it('12. Propagates injected dbInstance down to withTenantTransaction', async () => {
    const mockAuthUserId = 'injected-db-user-001';
    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: mockAuthUserId, email: 'admin@injected.id' } },
            error: null,
          }),
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    } as any);

    const mockTransactionSpy = vi.fn().mockImplementation(async (callback: any) => {
      const mockTx = {
        execute: vi.fn().mockResolvedValue([]),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: 'role_admin_123' }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue([]),
        }),
      };
      return await callback(mockTx);
    });

    const customDbMock = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
      transaction: mockTransactionSpy,
    } as any;

    const result = await provisioningService.tenantProvisioningService.provisionTenant(
      {
        name: 'Injected DB Tenant',
        slug: 'injected-db',
        ownerName: 'Admin Injected',
        ownerEmail: 'admin@injected.id',
      },
      {
        userId: 'super_admin_001',
        name: 'Super Admin',
        role: 'super_admin',
      },
      customDbMock
    );

    expect(result.success).toBe(true);
    expect(mockTransactionSpy).toHaveBeenCalledTimes(1);
  });
});
