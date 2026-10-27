import { vi } from 'vitest';
import * as serverClientModule from '@/lib/supabase/server';
import * as authzModule from '@/lib/authz/authorization-service';

export interface MockAuthOptions {
  userId?: string | null;
  email?: string;
  fullName?: string;
  tenantId?: string;
  roleCode?: string;
  permissions?: string[];
  authorized?: boolean;
}

/**
 * Test helper for mocking Supabase server session and database authorization
 * for unit and contract tests in Vitest.
 */
export function mockFinanceAuthSession(options: MockAuthOptions = {}) {
  const {
    userId = 'admin-user-01',
    email = 'admin@pesantren.id',
    fullName = 'Admin Keuangan',
    tenantId = 'tenant_test',
    roleCode = 'ADMIN_KEUANGAN',
    permissions = ['finance:export', 'finance:review', 'finance:pay', 'finance:manage'],
    authorized = true,
  } = options;

  if (!userId) {
    // Skenario 1: Anonim / Sesi tidak ada (Unauthenticated)
    vi.spyOn(serverClientModule, 'createClient').mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Auth session missing or invalid'),
        }),
      },
    } as any);

    vi.spyOn(authzModule, 'getEffectivePermissions').mockResolvedValue({
      authorized: false,
      decision: 'DENIED_UNAUTHENTICATED',
      effectivePermissions: new Set(),
      reason: 'No active session found',
    } as any);
    return;
  }

  // Skenario 2: Terautentikasi (Authenticated User)
  vi.spyOn(serverClientModule, 'createClient').mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: userId,
            email,
            user_metadata: { full_name: fullName },
          },
        },
        error: null,
      }),
    },
  } as any);

  // Skenario 3: Evaluasi Izin Berbasis Database & Tenant Target
  vi.spyOn(authzModule, 'getEffectivePermissions').mockImplementation(async (targetUserId, targetTenantId) => {
    // Hanya izinkan jika tenantId target sama persis dengan tenant yang diberi wewenang
    if (authorized && targetTenantId === tenantId) {
      return {
        authorized: true,
        decision: 'AUTHORIZED',
        userId: targetUserId,
        tenantId: targetTenantId,
        primaryRoleCode: roleCode,
        effectivePermissions: new Set(permissions),
      };
    }

    // Penolakan akses lintas tenant atau izin tidak memadai
    return {
      authorized: false,
      decision: 'DENIED_TENANT_MEMBERSHIP_MISSING',
      userId: targetUserId,
      tenantId: targetTenantId,
      effectivePermissions: new Set(),
      reason: `User ${targetUserId} has no active membership in tenant ${targetTenantId}`,
    };
  });
}
