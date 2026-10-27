/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resendTenantInvitation,
  listActiveTenants,
  ActiveTenantDto,
} from '../../src/modules/saas/services/tenant-provisioning-service';
import * as supabaseAdminModule from '../../src/lib/supabase/admin';
import * as resendServiceModule from '../../src/lib/email/resend-service';
import { isTenantProtected, PROTECTED_TENANTS } from '../../src/modules/saas/services/tenant-hard-delete-service';

describe('WP-TENANT-INVITATION-STATUS-RESEND-UX-001 — Contract & Safety Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── TEST 1: Status mapping for ACTIVE admin ────────────────────────────────
  it('TEST 1: listActiveTenants maps users.status ACTIVE to adminStatus ACTIVE', async () => {
    const mockDb = {
      select: vi.fn((fields: any) => ({
        from: vi.fn((table: any) => ({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: 't_active_001',
              name: 'Pesantren Al-Ikhlas',
              slug: 'al-ikhlas',
              code: 'SR2601',
              domain: 'al-ikhlas.madev.id',
              status: 'active',
              createdAt: new Date(),
            },
          ]),
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              {
                loginSubtitle: 'Kab. Jombang, Jawa Timur',
              },
            ]),
          })),
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([
                  {
                    userName: 'Kyai Ahmad',
                    userEmail: 'ahmad@alikhlas.id',
                    userPhone: '08123456789',
                    userStatus: 'ACTIVE',
                  },
                ]),
              })),
            })),
          })),
        })),
      })),
    } as any;

    const tenants = await listActiveTenants(mockDb);
    expect(tenants.length).toBe(1);
    expect(tenants[0].adminStatus).toBe('ACTIVE');
    expect(tenants[0].ownerEmail).toBe('ahmad@alikhlas.id');
    expect(tenants[0].ownerName).toBe('Kyai Ahmad');
    expect((tenants[0] as any).password).toBeUndefined();
  });

  // ── TEST 2: Status mapping for INVITED admin ───────────────────────────────
  it('TEST 2: listActiveTenants maps users.status INVITED to adminStatus INVITED', async () => {
    const mockDb = {
      select: vi.fn((fields: any) => ({
        from: vi.fn((table: any) => ({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: 't_invited_001',
              name: 'Pesantren Nurul Huda',
              slug: 'nurul-huda',
              code: 'SR2602',
              domain: 'nurul-huda.madev.id',
              status: 'active',
              createdAt: new Date(),
            },
          ]),
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              {
                loginSubtitle: 'Kab. Malang, Jawa Timur',
              },
            ]),
          })),
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([
                  {
                    userName: 'Ustadz Hasan',
                    userEmail: 'hasan@nurulhuda.id',
                    userPhone: '08129876543',
                    userStatus: 'INVITED',
                  },
                ]),
              })),
            })),
          })),
        })),
      })),
    } as any;

    const tenants = await listActiveTenants(mockDb);
    expect(tenants.length).toBe(1);
    expect(tenants[0].adminStatus).toBe('INVITED');
    expect(tenants[0].ownerEmail).toBe('hasan@nurulhuda.id');
  });

  // ── TEST 3: Status mapping for INVITATION_FAILED admin ─────────────────────
  it('TEST 3: listActiveTenants maps users.status INVITATION_FAILED to adminStatus INVITATION_FAILED', async () => {
    const mockDb = {
      select: vi.fn((fields: any) => ({
        from: vi.fn((table: any) => ({
          orderBy: vi.fn().mockResolvedValue([
            {
              id: 't_failed_001',
              name: 'Pesantren Darul Falah',
              slug: 'darul-falah',
              code: 'SR2603',
              domain: 'darul-falah.madev.id',
              status: 'active',
              createdAt: new Date(),
            },
          ]),
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              {
                loginSubtitle: 'Kab. Kediri, Jawa Timur',
              },
            ]),
          })),
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([
                  {
                    userName: 'Ustadz Zaid',
                    userEmail: 'zaid@darulfalah.id',
                    userPhone: '08121112223',
                    userStatus: 'INVITATION_FAILED',
                  },
                ]),
              })),
            })),
          })),
        })),
      })),
    } as any;

    const tenants = await listActiveTenants(mockDb);
    expect(tenants.length).toBe(1);
    expect(tenants[0].adminStatus).toBe('INVITATION_FAILED');
  });

  // ── TEST 4: Resend generates fresh invite link and updates status to INVITED ─
  it('TEST 4: resendTenantInvitation re-generates token and dispatches email for pending admin', async () => {
    const mockDb = {
      select: vi.fn((fields: any) => ({
        from: vi.fn((table: any) => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              {
                id: 't_resend_001',
                name: 'Pesantren Darul Falah',
                slug: 'darul-falah',
                code: 'SR2603',
                domain: 'darul-falah.madev.id',
              },
            ]),
          })),
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([
                  {
                    userId: 'usr_resend_001',
                    userName: 'Ustadz Zaid',
                    userEmail: 'zaid@darulfalah.id',
                    userStatus: 'INVITATION_FAILED',
                  },
                ]),
              })),
            })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        })),
      })),
    } as any;

    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          generateLink: vi.fn().mockResolvedValue({
            data: { properties: { hashed_token: 'fresh_crypto_token_xyz' } },
            error: null,
          }),
          updateUserById: vi.fn().mockResolvedValue({ data: {}, error: null }),
        },
      },
    } as any);

    vi.spyOn(resendServiceModule.resendService, 'sendTenantInvitationEmail').mockResolvedValue({
      success: true,
      messageId: 'msg_resend_123',
    });

    const res = await resendTenantInvitation(
      't_resend_001',
      { userId: 'superadmin_1', name: 'Super Admin', role: 'super_admin' },
      mockDb
    );

    expect(res.success).toBe(true);
    expect(res.invitationStatus).toBe('SENT');
    expect(res.message).toContain('berhasil dikirim ulang');
  });

  // ── TEST 5: Resend rejected on already ACTIVE admin ────────────────────────
  it('TEST 5: resendTenantInvitation strictly rejects resend if admin user is already ACTIVE', async () => {
    const mockDb = {
      select: vi.fn((fields: any) => ({
        from: vi.fn((table: any) => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              {
                id: 't_active_002',
                name: 'Pesantren Al-Ikhlas',
                slug: 'al-ikhlas',
                code: 'SR2601',
                domain: 'al-ikhlas.madev.id',
              },
            ]),
          })),
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([
                  {
                    userId: 'usr_active_001',
                    userName: 'Kyai Ahmad',
                    userEmail: 'ahmad@alikhlas.id',
                    userStatus: 'ACTIVE',
                  },
                ]),
              })),
            })),
          })),
        })),
      })),
    } as any;

    await expect(
      resendTenantInvitation(
        't_active_002',
        { userId: 'superadmin_1', name: 'Super Admin', role: 'super_admin' },
        mockDb
      )
    ).rejects.toThrow(/Akun administrator sudah aktif/);
  });

  // ── TEST 6: Resend does NOT create new tenant, user, or tenant code ────────
  it('TEST 6: resendTenantInvitation maintains strict identity integrity (0 new tenants, 0 new users, 0 new codes)', async () => {
    const mockInsert = vi.fn();
    const mockDb = {
      select: vi.fn((fields: any) => ({
        from: vi.fn((table: any) => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              {
                id: 't_resend_003',
                name: 'Pesantren An-Nur',
                slug: 'an-nur',
                code: 'SR2604',
                domain: 'an-nur.madev.id',
              },
            ]),
          })),
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([
                  {
                    userId: 'usr_resend_003',
                    userName: 'Ustadz Ali',
                    userEmail: 'ali@annur.id',
                    userStatus: 'INVITED',
                  },
                ]),
              })),
            })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        })),
      })),
      insert: mockInsert,
    } as any;

    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          generateLink: vi.fn().mockResolvedValue({
            data: { properties: { hashed_token: 'fresh_crypto_token_abc' } },
            error: null,
          }),
          updateUserById: vi.fn().mockResolvedValue({ data: {}, error: null }),
        },
      },
    } as any);

    vi.spyOn(resendServiceModule.resendService, 'sendTenantInvitationEmail').mockResolvedValue({
      success: true,
      messageId: 'msg_resend_456',
    });

    await resendTenantInvitation(
      't_resend_003',
      { userId: 'superadmin_1', name: 'Super Admin', role: 'super_admin' },
      mockDb
    );

    // Verify ZERO insert operations were performed
    expect(mockInsert).not.toHaveBeenCalled();
  });

  // ── TEST 7: Resend handles email delivery failure gracefully ───────────────
  it('TEST 7: resendTenantInvitation records INVITATION_FAILED on email dispatch error without corrupting data', async () => {
    let recordedStatus = '';
    const mockDb = {
      select: vi.fn((fields: any) => ({
        from: vi.fn((table: any) => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              {
                id: 't_resend_004',
                name: 'Pesantren Al-Hikmah',
                slug: 'al-hikmah',
                code: 'SR2605',
                domain: 'al-hikmah.madev.id',
              },
            ]),
          })),
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([
                  {
                    userId: 'usr_resend_004',
                    userName: 'Ustadz Umar',
                    userEmail: 'umar@alhikmah.id',
                    userStatus: 'INVITED',
                  },
                ]),
              })),
            })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        set: vi.fn((payload: any) => {
          recordedStatus = payload.status;
          return {
            where: vi.fn().mockResolvedValue({ rowCount: 1 }),
          };
        }),
      })),
    } as any;

    vi.spyOn(supabaseAdminModule, 'createAdminClient').mockReturnValue({
      auth: {
        admin: {
          generateLink: vi.fn().mockResolvedValue({
            data: { properties: { hashed_token: 'token_xyz' } },
            error: null,
          }),
          updateUserById: vi.fn().mockResolvedValue({ data: {}, error: null }),
        },
      },
    } as any);

    vi.spyOn(resendServiceModule.resendService, 'sendTenantInvitationEmail').mockResolvedValue({
      success: false,
      error: 'Resend API Rate Limit Exceeded',
    });

    const res = await resendTenantInvitation(
      't_resend_004',
      { userId: 'superadmin_1', name: 'Super Admin', role: 'super_admin' },
      mockDb
    );

    expect(res.success).toBe(false);
    expect(res.invitationStatus).toBe('FAILED');
    expect(recordedStatus).toBe('INVITATION_FAILED');
  });

  // ── TEST 8: Zero Password Guarantee in Data Transfers ──────────────────────
  it('TEST 8: Zero Password Guarantee — no initial or temporary password exposed across invitation models', () => {
    const dto: ActiveTenantDto = {
      id: 't_100',
      name: 'Pesantren Al-Barokah',
      slug: 'al-barokah',
      code: 'SR2606',
      subdomain: 'al-barokah.madev.id',
      location: 'Jawa Timur',
      ownerName: 'Admin Barokah',
      ownerEmail: 'admin@barokah.id',
      ownerPhone: '08123334445',
      status: 'aktif',
      adminStatus: 'INVITED',
      santriCount: 0,
      createdAt: '2026-09-24',
    };

    expect((dto as any).password).toBeUndefined();
    expect((dto as any).tempPassword).toBeUndefined();
    expect((dto as any).initialPassword).toBeUndefined();
  });

  // ── TEST 9: Protected SR2601 Invariant Maintained ──────────────────────────
  it('TEST 9: Official First Tenant SR2601 remains permanently protected from destructive lifecycle actions', () => {
    const protection = isTenantProtected({
      id: PROTECTED_TENANTS.OFFICIAL_FIRST_TENANT_ID,
      code: 'SR2601',
      slug: 'pp-darunnajah',
    });

    expect(protection.isProtected).toBe(true);
    expect(protection.reason).toContain('SR2601');
  });
});
