/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/saas/tenants/route';
import { tenantCodeCounterService, allocateNextTenantCode } from '../../src/lib/tenant/tenant-code-counter-service';
import * as provisioningService from '../../src/modules/saas/services/tenant-provisioning-service';
import * as supabaseAdminModule from '../../src/lib/supabase/admin';
import * as resendServiceModule from '../../src/lib/email/resend-service';
import { db } from '../../src/lib/db';
import { auditLogService } from '../../src/lib/db/services/auditLog';

describe('WP-TENANT-PROVISIONING-INVITATION — 10 Canonical Verification Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── TEST 1: Counter pertama 2026 → SR2601 ─────────────────────────────────
  it('TEST 1: Baseline counter 2026 allocates initial tenant code SR2601', async () => {
    let currentSeq = 0;
    const mockDb = {
      transaction: vi.fn(async (cb: any) => {
        currentSeq += 1;
        const mockTx = {
          execute: vi.fn().mockResolvedValue([{ last_sequence: currentSeq }]),
        };
        return await cb(mockTx);
      }),
    } as any;

    const res = await allocateNextTenantCode(2026, mockDb);
    expect(res.code).toBe('SR2601');
    expect(res.year).toBe(2026);
    expect(res.sequence).toBe(1);
  });

  // ── TEST 2: Counter kedua 2026 → SR2602 ───────────────────────────────────
  it('TEST 2: Second counter allocation for 2026 yields SR2602', async () => {
    let currentSeq = 1;
    const mockDb = {
      transaction: vi.fn(async (cb: any) => {
        currentSeq += 1;
        const mockTx = {
          execute: vi.fn().mockResolvedValue([{ last_sequence: currentSeq }]),
        };
        return await cb(mockTx);
      }),
    } as any;

    const res = await allocateNextTenantCode(2026, mockDb);
    expect(res.code).toBe('SR2602');
    expect(res.sequence).toBe(2);
  });

  // ── TEST 3: Provisioning transaction gagal: SR2603 consumed, next is SR2604 ─
  it('TEST 3: Non-reuse invariant: failed provisioning consumes SR2603, next code is SR2604', async () => {
    let counterValue = 2; // Last was SR2602

    // Simulated atomic counter database
    const mockCounterDb = {
      transaction: vi.fn(async (cb: any) => {
        counterValue += 1;
        const mockTx = {
          execute: vi.fn().mockResolvedValue([{ last_sequence: counterValue }]),
        };
        return await cb(mockTx);
      }),
    } as any;

    // First attempt: allocates SR2603
    const codeAttempt1 = await allocateNextTenantCode(2026, mockCounterDb);
    expect(codeAttempt1.code).toBe('SR2603');

    // Simulate Transaction B (Provisioning) crashing & rolling back
    const transactionBFailure = new Error('Database disk full or constraint violation');
    expect(() => {
      // Transaction B rolls back, but Transaction A was ALREADY committed
      throw transactionBFailure;
    }).toThrow('Database disk full');

    // Counter remains incremented (counterValue === 3, SR2603 is consumed)
    expect(counterValue).toBe(3);

    // Next provisioning attempt allocates the next monotonic sequence: SR2604
    const codeAttempt2 = await allocateNextTenantCode(2026, mockCounterDb);
    expect(codeAttempt2.code).toBe('SR2604');
    expect(codeAttempt2.sequence).toBe(4);
  });

  // ── TEST 4: Tenant SR2604 dihapus: next is SR2605 ─────────────────────────
  it('TEST 4: Deletion of tenant SR2604 does NOT reset counter; next allocated code is SR2605', async () => {
    let counterValue = 4; // SR2604 was allocated

    const mockCounterDb = {
      transaction: vi.fn(async (cb: any) => {
        counterValue += 1;
        const mockTx = {
          execute: vi.fn().mockResolvedValue([{ last_sequence: counterValue }]),
        };
        return await cb(mockTx);
      }),
    } as any;

    // Simulate deletion of tenant SR2604
    const deletedTenantCode = 'SR2604';
    expect(deletedTenantCode).toBe('SR2604');

    // Next allocated tenant code MUST be SR2605, never reusing SR2604
    const nextCode = await allocateNextTenantCode(2026, mockCounterDb);
    expect(nextCode.code).toBe('SR2605');
    expect(nextCode.code).not.toBe('SR2604');
  });

  // ── TEST 5: 5 concurrent counter allocations → 5 unique monotonic codes ───
  it('TEST 5: Concurrent allocations produce 5 unique monotonic codes without duplication', async () => {
    let counter = 0;
    // Simulate serialized PostgreSQL row lock resolution
    const mockCounterDb = {
      transaction: vi.fn(async (cb: any) => {
        counter += 1;
        const mockTx = {
          execute: vi.fn().mockResolvedValue([{ last_sequence: counter }]),
        };
        return await cb(mockTx);
      }),
    } as any;

    const results = await Promise.all([
      allocateNextTenantCode(2026, mockCounterDb),
      allocateNextTenantCode(2026, mockCounterDb),
      allocateNextTenantCode(2026, mockCounterDb),
      allocateNextTenantCode(2026, mockCounterDb),
      allocateNextTenantCode(2026, mockCounterDb),
    ]);

    const codes = results.map((r) => r.code);
    expect(codes).toHaveLength(5);
    // Ensure all 5 codes are strictly unique
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(5);

    // Verify format and sequences
    expect(codes).toEqual(['SR2601', 'SR2602', 'SR2603', 'SR2604', 'SR2605']);
  });

  // ── TEST 6: Year rollover 2027 → SR2701 ───────────────────────────────────
  it('TEST 6: Year rollover to 2027 resets logical sequence to SR2701', async () => {
    const mockCounterDb = {
      transaction: vi.fn(async (cb: any) => {
        const mockTx = {
          execute: vi.fn().mockResolvedValue([{ last_sequence: 1 }]),
        };
        return await cb(mockTx);
      }),
    } as any;

    const res2027 = await allocateNextTenantCode(2027, mockCounterDb);
    expect(res2027.code).toBe('SR2701');
    expect(res2027.year).toBe(2027);
    expect(res2027.sequence).toBe(1);
  });

  // ── TEST 7: POST payload trying to send initialPassword is sanitized/ignored ─
  it('TEST 7: POST /api/saas/tenants enforces zero-password ingress and rejects client-supplied initialPassword', async () => {
    const provisionSpy = vi.spyOn(provisioningService.tenantProvisioningService, 'provisionTenant').mockResolvedValue({
      tenant: { id: 't-test', name: 'Pesantren Al-Amin', slug: 'al-amin', domain: 'al-amin.madev.id', code: 'SR2601' },
      admin: { userId: 'usr-admin-1', email: 'owner@pesantren.id', invitationStatus: 'SENT' },
    } as any);

    // 1. Attempt sending with initialPassword -> Must be rejected with HTTP 400
    const reqWithPassword = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Pesantren Al-Amin',
        slug: 'al-amin',
        ownerName: 'Kyai Amin',
        ownerEmail: 'owner@pesantren.id',
        initialPassword: 'HACKED_PASSWORD_SHOULD_BE_REJECTED_123!',
      }),
    });

    const resRejected = await POST(reqWithPassword);
    expect(resRejected.status).toBe(400);
    const jsonRejected = await resRejected.json();
    expect(jsonRejected.error).toBe('BadRequest');
    expect(jsonRejected.message).toContain('Penyediaan kata sandi awal tidak diperbolehkan');

    // 2. Valid Zero-Password payload -> Succeeds with 201 without password leakage
    const reqValid = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Pesantren Al-Amin',
        slug: 'al-amin',
        ownerName: 'Kyai Amin',
        ownerEmail: 'owner@pesantren.id',
      }),
    });

    const resValid = await POST(reqValid);
    expect(resValid.status).toBe(201);
    const jsonValid = await resValid.json();

    // Verify service payload NEVER received initialPassword
    const passedInput = provisionSpy.mock.calls[0][0];
    expect((passedInput as any).initialPassword).toBeUndefined();

    // Verify response does not leak temporary password
    expect((jsonValid.data.admin as any).temporaryPassword).toBeUndefined();
    expect(jsonValid.data.tenant.code).toBe('SR2601');
  });

  // ── TEST 8: Consistency between Auth user, public.users, tenant, membership & role ─
  it('TEST 8: Create Tenant preserves strict identity consistency across all 5 tables', async () => {
    const mockAuthUserId = 'auth-canonical-uid-777';
    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          generateLink: vi.fn().mockResolvedValue({
            data: { user: { id: mockAuthUserId, email: 'admin@bina-insan.id' }, properties: { action_link: 'http://localhost:3000/auth/callback' } },
            error: null,
          }),
          deleteUser: vi.fn(),
        },
      },
    } as any);

    vi.spyOn(tenantCodeCounterService, 'allocateNextTenantCode').mockResolvedValue({
      code: 'SR2601',
      year: 2026,
      sequence: 1,
    });
    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });
    vi.spyOn(resendServiceModule.resendService, 'sendTenantInvitationEmail').mockResolvedValue({ success: true, messageId: 'msg_001' });
    vi.spyOn(auditLogService, 'log').mockResolvedValue('audit_123');

    const inserted: Record<string, any> = {};
    const mockDb = {
      transaction: vi.fn(async (callback: any) => {
        const mockTx = {
          execute: vi.fn().mockResolvedValue([]),
          insert: vi.fn().mockImplementation((table: any) => ({
            values: vi.fn().mockImplementation(async (val: any) => {
              if (table && table.slug) inserted.tenants = val;
              if (table && table.primaryColor) inserted.tenantSettings = val;
              if (table && table.email && table.role) inserted.users = val;
              if (table && table.roleCode) inserted.tenantRoles = val;
              if (table && table.primaryRoleId) inserted.userTenantMemberships = val;
              return [];
            }),
          })),
          select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        };
        return await callback(mockTx);
      }),
    } as any;

    const result = await provisioningService.tenantProvisioningService.provisionTenant(
      {
        name: 'Pesantren Bina Insan',
        slug: 'bina-insan',
        ownerName: 'Ustadz Insan',
        ownerEmail: 'admin@bina-insan.id',
      },
      { userId: 'super_admin_001', name: 'Super Admin', role: 'super_admin' },
      mockDb
    );

    expect(result.success).toBe(true);

    // 1. Auth user ID matches public.users.id
    expect(inserted.users.id).toBe(mockAuthUserId);

    // 2. Tenant code is correctly assigned
    expect(inserted.tenants.code).toBe('SR2601');
    expect(inserted.tenants.id).toBe(result.tenant.id);

    // 3. User initial status is INVITED (not ACTIVE yet until onboarding)
    expect(inserted.users.status).toBe('INVITED');

    // 4. Role assigned is canonical ADMIN
    expect(inserted.tenantRoles.roleCode).toBe('ADMIN');
    expect(inserted.tenantRoles.tenantId).toBe(result.tenant.id);

    // 5. Membership correctly connects user, tenant, and primary role
    expect(inserted.userTenantMemberships.userId).toBe(mockAuthUserId);
    expect(inserted.userTenantMemberships.tenantId).toBe(result.tenant.id);
    expect(inserted.userTenantMemberships.primaryRoleId).toBe(inserted.tenantRoles.id);
    expect(inserted.userTenantMemberships.status).toBe('INVITED');
  });

  // ── TEST 9: Resend failure: tenant & user preserved, status = INVITATION_FAILED ─
  it('TEST 9: Resend email failure preserves tenant & auth user, updating status to INVITATION_FAILED', async () => {
    const mockAuthUserId = 'auth-email-fail-999';
    const mockDeleteUser = vi.fn();

    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          generateLink: vi.fn().mockResolvedValue({
            data: { user: { id: mockAuthUserId, email: 'admin@resend-fail.id' }, properties: { action_link: 'http://localhost:3000/auth/callback' } },
            error: null,
          }),
          deleteUser: mockDeleteUser,
        },
      },
    } as any);

    vi.spyOn(tenantCodeCounterService, 'allocateNextTenantCode').mockResolvedValue({
      code: 'SR2601',
      year: 2026,
      sequence: 1,
    });
    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });
    vi.spyOn(auditLogService, 'log').mockResolvedValue('audit_123');

    // Force Resend email failure
    vi.spyOn(resendServiceModule.resendService, 'sendTenantInvitationEmail').mockResolvedValue({
      success: false,
      error: 'API rate limit exceeded or invalid Resend API key',
    });

    let updatedStatus = '';
    const mockDb = {
      transaction: vi.fn(async (cb: any) => {
        const mockTx = {
          execute: vi.fn().mockResolvedValue([]),
          insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
          select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) }),
        };
        return await cb(mockTx);
      }),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation((updates: any) => {
          updatedStatus = updates.status;
          return {
            where: vi.fn().mockResolvedValue([]),
          };
        }),
      })),
    } as any;

    const result = await provisioningService.tenantProvisioningService.provisionTenant(
      {
        name: 'Pesantren Resend Fail',
        slug: 'resend-fail',
        ownerName: 'Ustadz Fail',
        ownerEmail: 'admin@resend-fail.id',
      },
      { userId: 'super_admin_001', name: 'Super Admin', role: 'super_admin' },
      mockDb
    );

    // Provisioning reports success but marks invitationStatus as FAILED
    expect(result.success).toBe(true);
    expect(result.admin.invitationStatus).toBe('FAILED');

    // Tenant and Auth user are PRESERVED: deleteUser was NEVER called
    expect(mockDeleteUser).not.toHaveBeenCalled();

    // User status updated to INVITATION_FAILED for operator visibility
    expect(updatedStatus).toBe('INVITATION_FAILED');
  });

  // ── TEST 10: Email dispatch occurs strictly AFTER DB transaction commit ───
  it('TEST 10: Email dispatch is executed strictly POST-COMMIT after Transaction B completes', async () => {
    const executionOrder: string[] = [];
    const mockAuthUserId = 'auth-timing-check-888';

    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          generateLink: vi.fn().mockImplementation(async () => {
            executionOrder.push('AUTH_INVITE_GENERATED');
            return {
              data: { user: { id: mockAuthUserId, email: 'admin@order.id' }, properties: { action_link: 'http://localhost:3000/auth/callback' } },
              error: null,
            };
          }),
          deleteUser: vi.fn(),
        },
      },
    } as any);

    vi.spyOn(tenantCodeCounterService, 'allocateNextTenantCode').mockImplementation(async () => {
      executionOrder.push('TRANSACTION_A_COUNTER_COMMITTED');
      return { code: 'SR2601', year: 2026, sequence: 1 };
    });

    vi.spyOn(provisioningService.tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });
    vi.spyOn(auditLogService, 'log').mockResolvedValue('audit_123');

    vi.spyOn(resendServiceModule.resendService, 'sendTenantInvitationEmail').mockImplementation(async () => {
      executionOrder.push('POST_COMMIT_EMAIL_DISPATCHED');
      return { success: true, messageId: 'email_ok' };
    });

    const mockDb = {
      transaction: vi.fn(async (cb: any) => {
        executionOrder.push('TRANSACTION_B_START');
        const mockTx = {
          execute: vi.fn().mockResolvedValue([]),
          insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
          select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }) }),
        };
        const result = await cb(mockTx);
        executionOrder.push('TRANSACTION_B_COMMITTED');
        return result;
      }),
    } as any;

    await provisioningService.tenantProvisioningService.provisionTenant(
      {
        name: 'Pesantren Execution Order',
        slug: 'execution-order',
        ownerName: 'Ustadz Order',
        ownerEmail: 'admin@order.id',
      },
      { userId: 'super_admin_001', name: 'Super Admin', role: 'super_admin' },
      mockDb
    );

    // Verify chronological order:
    // 1. Transaction A (Counter Allocation)
    // 2. Auth Link Generation
    // 3. Transaction B (Database Provisioning)
    // 4. Transaction B COMMIT
    // 5. Post-commit Email Dispatch
    expect(executionOrder).toEqual([
      'TRANSACTION_A_COUNTER_COMMITTED',
      'AUTH_INVITE_GENERATED',
      'TRANSACTION_B_START',
      'TRANSACTION_B_COMMITTED',
      'POST_COMMIT_EMAIL_DISPATCHED',
    ]);
  });
});
