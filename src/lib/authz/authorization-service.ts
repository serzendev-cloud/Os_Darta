import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  users,
  tenants,
  platformRoles,
  userPlatformRoles,
  tenantRoles,
  userTenantMemberships,
  permissions,
  tenantRolePermissions,
  userAdditionalPermissions,
  waliSantriRelationships,
} from '@/lib/db/schema';

export type AuthorizationDecision =
  | 'AUTHORIZED'
  | 'DENIED_UNAUTHENTICATED'
  | 'DENIED_USER_LIFECYCLE_INACTIVE'
  | 'DENIED_TENANT_INACTIVE'
  | 'DENIED_TENANT_MEMBERSHIP_MISSING'
  | 'DENIED_TENANT_MEMBERSHIP_INACTIVE'
  | 'DENIED_ROLE_INACTIVE'
  | 'DENIED_PERMISSION_MISSING'
  | 'DENIED_RELATIONSHIP_INACTIVE'
  | 'DENIED_PLATFORM_SCOPE';

export interface AuthorizationResult {
  authorized: boolean;
  decision: AuthorizationDecision;
  userId?: string;
  tenantId?: string;
  primaryRoleCode?: string;
  effectivePermissions: Set<string>;
  reason?: string;
}

/**
 * Calculates the canonical effective permissions for a user in a target tenant.
 * Enforces User Lifecycle Status, Tenant Status, Membership Status, and Primary Role Status (Fail-Closed).
 */
export async function getEffectivePermissions(
  userId: string,
  tenantId: string,
  dbInstance = db
): Promise<AuthorizationResult> {
  if (!userId || userId.trim() === '') {
    return {
      authorized: false,
      decision: 'DENIED_UNAUTHENTICATED',
      effectivePermissions: new Set(),
      reason: 'User ID is unauthenticated or missing',
    };
  }

  if (!tenantId || tenantId.trim() === '') {
    return {
      authorized: false,
      decision: 'DENIED_TENANT_INACTIVE',
      effectivePermissions: new Set(),
      reason: 'Target Tenant ID is invalid or missing',
    };
  }

  // 1. Enforce User Lifecycle Status (Fail-Closed)
  const userRows = await dbInstance
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRows.length === 0 || userRows[0].status.toUpperCase() !== 'ACTIVE') {
    return {
      authorized: false,
      decision: 'DENIED_USER_LIFECYCLE_INACTIVE',
      userId,
      tenantId,
      effectivePermissions: new Set(),
      reason: `User ${userId} lifecycle status is not ACTIVE (current: ${userRows[0]?.status ?? 'MISSING'})`,
    };
  }

  // 2. Enforce Tenant Status (Fail-Closed)
  const tenantRows = await dbInstance
    .select({ id: tenants.id, status: tenants.status })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (tenantRows.length === 0 || tenantRows[0].status.toLowerCase() !== 'active') {
    return {
      authorized: false,
      decision: 'DENIED_TENANT_INACTIVE',
      userId,
      tenantId,
      effectivePermissions: new Set(),
      reason: `Tenant ${tenantId} is inactive, suspended, or missing`,
    };
  }

  // 2. Enforce User Tenant Membership Status (Fail-Closed)
  const membershipRows = await dbInstance
    .select({
      id: userTenantMemberships.id,
      primaryRoleId: userTenantMemberships.primaryRoleId,
      status: userTenantMemberships.status,
    })
    .from(userTenantMemberships)
    .where(
      and(
        eq(userTenantMemberships.userId, userId),
        eq(userTenantMemberships.tenantId, tenantId)
      )
    )
    .limit(1);

  if (membershipRows.length === 0) {
    return {
      authorized: false,
      decision: 'DENIED_TENANT_MEMBERSHIP_MISSING',
      userId,
      tenantId,
      effectivePermissions: new Set(),
      reason: `User ${userId} does not have a membership in tenant ${tenantId}`,
    };
  }

  const membership = membershipRows[0];
  if (membership.status.toUpperCase() !== 'ACTIVE') {
    return {
      authorized: false,
      decision: 'DENIED_TENANT_MEMBERSHIP_INACTIVE',
      userId,
      tenantId,
      effectivePermissions: new Set(),
      reason: `User membership in tenant ${tenantId} is ${membership.status} (requires ACTIVE)`,
    };
  }

  // 3. Enforce Primary Role Status (Fail-Closed)
  const roleRows = await dbInstance
    .select({
      id: tenantRoles.id,
      roleCode: tenantRoles.roleCode,
      status: tenantRoles.status,
    })
    .from(tenantRoles)
    .where(eq(tenantRoles.id, membership.primaryRoleId))
    .limit(1);

  if (roleRows.length === 0 || roleRows[0].status.toUpperCase() !== 'ACTIVE') {
    return {
      authorized: false,
      decision: 'DENIED_ROLE_INACTIVE',
      userId,
      tenantId,
      effectivePermissions: new Set(),
      reason: `Primary role for membership in tenant ${tenantId} is inactive or missing`,
    };
  }

  const primaryRole = roleRows[0];

  // 4. Resolve Role Permissions (TENANT scope)
  const rolePermRows = await dbInstance
    .select({
      code: permissions.code,
      scope: permissions.scope,
    })
    .from(tenantRolePermissions)
    .innerJoin(permissions, eq(tenantRolePermissions.permissionId, permissions.id))
    .where(eq(tenantRolePermissions.tenantRoleId, primaryRole.id));

  // 5. Resolve Additional Permissions (TENANT scope)
  const addPermRows = await dbInstance
    .select({
      code: permissions.code,
      scope: permissions.scope,
    })
    .from(userAdditionalPermissions)
    .innerJoin(permissions, eq(userAdditionalPermissions.permissionId, permissions.id))
    .where(eq(userAdditionalPermissions.membershipId, membership.id));

  // 6. Calculate Effective Permissions Set (Union of Role + Additional, filter TENANT scope)
  const effectivePermissions = new Set<string>();

  for (const perm of rolePermRows) {
    if (perm.scope.toUpperCase() === 'TENANT') {
      effectivePermissions.add(perm.code);
    }
  }

  for (const perm of addPermRows) {
    if (perm.scope.toUpperCase() === 'TENANT') {
      effectivePermissions.add(perm.code);
    }
  }

  return {
    authorized: true,
    decision: 'AUTHORIZED',
    userId,
    tenantId,
    primaryRoleCode: primaryRole.roleCode,
    effectivePermissions,
  };
}

/**
 * Requires an exact permission code for a user in a target tenant.
 */
export async function requirePermission(
  userId: string,
  tenantId: string,
  permissionCode: string,
  dbInstance = db
): Promise<AuthorizationResult> {
  const result = await getEffectivePermissions(userId, tenantId, dbInstance);
  if (!result.authorized) {
    return result;
  }

  if (!result.effectivePermissions.has(permissionCode)) {
    return {
      ...result,
      authorized: false,
      decision: 'DENIED_PERMISSION_MISSING',
      reason: `User missing required permission: ${permissionCode}`,
    };
  }

  return result;
}

/**
 * Requires ANY of the specified permission codes for a user in a target tenant.
 */
export async function requireAnyPermission(
  userId: string,
  tenantId: string,
  permissionCodes: string[],
  dbInstance = db
): Promise<AuthorizationResult> {
  const result = await getEffectivePermissions(userId, tenantId, dbInstance);
  if (!result.authorized) {
    return result;
  }

  const hasAny = permissionCodes.some((code) => result.effectivePermissions.has(code));
  if (!hasAny) {
    return {
      ...result,
      authorized: false,
      decision: 'DENIED_PERMISSION_MISSING',
      reason: `User missing any of required permissions: [${permissionCodes.join(', ')}]`,
    };
  }

  return result;
}

/**
 * Requires ALL of the specified permission codes for a user in a target tenant.
 */
export async function requireAllPermissions(
  userId: string,
  tenantId: string,
  permissionCodes: string[],
  dbInstance = db
): Promise<AuthorizationResult> {
  const result = await getEffectivePermissions(userId, tenantId, dbInstance);
  if (!result.authorized) {
    return result;
  }

  const hasAll = permissionCodes.every((code) => result.effectivePermissions.has(code));
  if (!hasAll) {
    return {
      ...result,
      authorized: false,
      decision: 'DENIED_PERMISSION_MISSING',
      reason: `User missing all of required permissions: [${permissionCodes.join(', ')}]`,
    };
  }

  return result;
}

/**
 * Authorizes a Wali user's access to a specific Santri entity within a tenant.
 * Enforces active membership, appropriate permission, and active wali_santri_relationships link.
 */
export async function authorizeWaliSantriAccess(
  userId: string,
  tenantId: string,
  targetSantriId: string,
  requiredPermission = 'view_own_data',
  dbInstance = db
): Promise<AuthorizationResult> {
  // 1. Verify tenant membership & permission
  const tenantAuth = await requirePermission(userId, tenantId, requiredPermission, dbInstance);
  if (!tenantAuth.authorized) {
    return tenantAuth;
  }

  // 2. Query canonical wali_santri_relationships table
  const relRows = await dbInstance
    .select({
      id: waliSantriRelationships.id,
      status: waliSantriRelationships.status,
    })
    .from(waliSantriRelationships)
    .where(
      and(
        eq(waliSantriRelationships.tenantId, tenantId),
        eq(waliSantriRelationships.waliUserId, userId),
        eq(waliSantriRelationships.santriId, targetSantriId)
      )
    )
    .limit(1);

  if (relRows.length === 0 || relRows[0].status.toUpperCase() !== 'ACTIVE') {
    return {
      ...tenantAuth,
      authorized: false,
      decision: 'DENIED_RELATIONSHIP_INACTIVE',
      reason: `Wali user ${userId} has no active relationship with Santri ${targetSantriId} in tenant ${tenantId}`,
    };
  }

  return tenantAuth;
}

/**
 * Authorizes a Platform Role (SUPER_ADMIN or DEVELOPER) for platform-scoped operations.
 * Platform roles operate outside of tenant memberships.
 */
export async function authorizePlatformRole(
  userId: string,
  requiredPlatformRole: 'SUPER_ADMIN' | 'DEVELOPER',
  dbInstance = db
): Promise<AuthorizationResult> {
  if (!userId || userId.trim() === '') {
    return {
      authorized: false,
      decision: 'DENIED_UNAUTHENTICATED',
      effectivePermissions: new Set(),
      reason: 'User ID is unauthenticated or missing',
    };
  }

  const rows = await dbInstance
    .select({
      roleId: platformRoles.id,
      roleName: platformRoles.name,
    })
    .from(userPlatformRoles)
    .innerJoin(platformRoles, eq(userPlatformRoles.platformRoleId, platformRoles.id))
    .where(eq(userPlatformRoles.userId, userId));

  const hasRole = rows.some((row) => {
    if (row.roleId && row.roleId === requiredPlatformRole) return true;
    if (row.roleName) {
      const normalized = row.roleName.toUpperCase().replace(/\s+/g, '_');
      if (normalized === requiredPlatformRole.toUpperCase()) return true;
      if (row.roleName.toUpperCase() === requiredPlatformRole.toUpperCase()) return true;
    }
    return false;
  });

  if (!hasRole) {
    return {
      authorized: false,
      decision: 'DENIED_PLATFORM_SCOPE',
      userId,
      effectivePermissions: new Set(),
      reason: `User ${userId} does not possess required platform role ${requiredPlatformRole}`,
    };
  }

  return {
    authorized: true,
    decision: 'AUTHORIZED',
    userId,
    effectivePermissions: new Set([`platform.${requiredPlatformRole.toLowerCase()}`]),
  };
}

/**
 * Authorizes an incoming Request for operational tenant API access.
 * Enforces fail-closed multi-tenant boundary:
 * 1. Super Admin / Developer via proxy header -> AUTHORIZED.
 * 2. Regular user -> Evaluates getEffectivePermissions(userId, tenantId).
 *    Denies if user lifecycle or tenant membership is not ACTIVE.
 */
export async function authorizeOperationalApi(
  request: Request,
  tenantId: string,
  dbInstance = db
): Promise<{ authorized: boolean; status?: number; error?: string; message?: string }> {
  const isSuperAdmin = request.headers.get('x-is-super-admin') === 'true';
  if (isSuperAdmin) {
    return { authorized: true };
  }

  const userId = request.headers.get('x-user-id');
  if (!userId || userId.trim() === '') {
    return {
      authorized: false,
      status: 401,
      error: 'Unauthorized',
      message: 'Autentikasi diperlukan untuk mengakses resource ini',
    };
  }

  const result = await getEffectivePermissions(userId, tenantId, dbInstance);
  if (!result.authorized) {
    const isUncompleted =
      result.decision === 'DENIED_USER_LIFECYCLE_INACTIVE' ||
      result.decision === 'DENIED_TENANT_MEMBERSHIP_INACTIVE';

    return {
      authorized: false,
      status: 403,
      error: isUncompleted ? 'UserOnboardingIncomplete' : 'Forbidden',
      message: result.reason || 'Akses ditolak untuk tenant ini',
    };
  }

  return { authorized: true };
}

