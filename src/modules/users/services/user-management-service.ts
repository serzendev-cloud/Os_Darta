import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, tenantRoles, userTenantMemberships } from '@/lib/db/schema';
import { requirePermission } from '@/lib/authz/authorization-service';

export interface CreateUserInput {
  name: string;
  email: string;
  phone?: string;
  roleCode: string;
}

export async function createTenantUser(
  tenantId: string,
  input: CreateUserInput,
  creatorUserId: string,
  dbInstance = db
) {
  // 1. Enforce RBAC Permission Check
  const authz = await requirePermission(creatorUserId, tenantId, 'manage_pengaturan', dbInstance);
  if (!authz.authorized) {
    throw new Error(`Permission denied: ${authz.reason}`);
  }

  // 2. Find target tenant role
  let role = (
    await dbInstance
      .select({ id: tenantRoles.id })
      .from(tenantRoles)
      .where(and(eq(tenantRoles.tenantId, tenantId), eq(tenantRoles.roleCode, input.roleCode)))
      .limit(1)
  )[0];

  if (!role) {
    const newRoleId = `role_${input.roleCode.toLowerCase()}_${tenantId}`;
    await dbInstance.insert(tenantRoles).values({
      id: newRoleId,
      tenantId,
      roleCode: input.roleCode,
      name: input.roleCode,
      isCustom: false,
      status: 'ACTIVE',
    });
    role = { id: newRoleId };
  }

  // 3. Create User & Tenant Membership
  const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await dbInstance.insert(users).values({
    id: newUserId,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    status: 'MUST_CHANGE_PASSWORD',
    tenantId,
    role: input.roleCode.toLowerCase(),
  });

  const membershipId = `utm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await dbInstance.insert(userTenantMemberships).values({
    id: membershipId,
    userId: newUserId,
    tenantId,
    primaryRoleId: role.id,
    status: 'ACTIVE',
  });

  return { userId: newUserId, membershipId };
}

export async function updateUserStatus(
  tenantId: string,
  targetUserId: string,
  newStatus: 'ACTIVE' | 'SUSPENDED' | 'DISABLED',
  modifierUserId: string,
  dbInstance = db
) {
  const authz = await requirePermission(modifierUserId, tenantId, 'manage_pengaturan', dbInstance);
  if (!authz.authorized) {
    throw new Error(`Permission denied: ${authz.reason}`);
  }

  await dbInstance
    .update(userTenantMemberships)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(
      and(
        eq(userTenantMemberships.userId, targetUserId),
        eq(userTenantMemberships.tenantId, tenantId)
      )
    );

  await dbInstance
    .update(users)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(users.id, targetUserId));

  return { success: true };
}
