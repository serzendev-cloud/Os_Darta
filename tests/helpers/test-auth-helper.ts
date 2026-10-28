import { vi } from 'vitest';
import * as serverClientModule from '@/lib/supabase/server';
import * as authzModule from '@/lib/authz/authorization-service';
import * as tenantContextModule from '@/lib/tenant/context';

export interface MockAuthOptions {
  userId?: string | null;
  email?: string;
  fullName?: string;
  tenantId?: string;
  roleCode?: string;
  permissions?: string[];
  authorized?: boolean;
}

const DEFAULT_CANONICAL_PERMISSIONS = [
  'view_billing_campaigns',
  'manage_billing_campaigns',
  'view_spp_config',
  'manage_spp_config',
  'record_spp_payment',
  'view_spp_installments',
  'review_spp_installments',
  'view_finance_recap',
  'export_finance_recap',
  'finance:export',
  'finance:review',
  'finance:pay',
  'finance:manage',
];

const LEGACY_PERMISSION_MAP: Record<string, string[]> = {
  'finance:manage': ['manage_billing_campaigns', 'manage_spp_config', 'finance:manage'],
  'finance:review': ['view_spp_installments', 'review_spp_installments', 'view_spp_config', 'manage_spp_config', 'finance:review'],
  'finance:pay': ['record_spp_payment', 'finance:pay'],
  'finance:export': ['view_finance_recap', 'export_finance_recap', 'view_billing_campaigns', 'finance:export'],
};

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
    permissions = DEFAULT_CANONICAL_PERMISSIONS,
    authorized = true,
  } = options;

  // Mock getTenantContext to return the active tenant
  vi.spyOn(tenantContextModule, 'getTenantContext').mockResolvedValue({
    id: tenantId,
    name: 'Pesantren Mock',
    slug: tenantId,
    domain: null,
    settings: {},
  });

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

    vi.spyOn(authzModule, 'requirePermission').mockResolvedValue({
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

  // Expand any legacy permission strings to canonical equivalents
  const activePermissions = new Set<string>();
  for (const perm of permissions) {
    activePermissions.add(perm);
    if (LEGACY_PERMISSION_MAP[perm]) {
      for (const canonical of LEGACY_PERMISSION_MAP[perm]) {
        activePermissions.add(canonical);
      }
    }
  }

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
        effectivePermissions: activePermissions,
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

  vi.spyOn(authzModule, 'requirePermission').mockImplementation(async (targetUserId, targetTenantId, permissionCode) => {
    const authz = await authzModule.getEffectivePermissions(targetUserId, targetTenantId);
    if (!authz.authorized) {
      return authz;
    }
    if (!authz.effectivePermissions?.has(permissionCode)) {
      return {
        ...authz,
        authorized: false,
        decision: 'DENIED_PERMISSION_MISSING',
        reason: `User missing required permission: ${permissionCode}`,
      };
    }
    return authz;
  });
}
