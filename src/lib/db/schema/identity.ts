import { pgTable, text, boolean, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { tenants, santri } from '../schema';

// ── 1. Global Users Table (Platform Identity System of Record) ───────────────
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Supabase Auth UID mapping (auth.users.id)
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').unique(), // Registered Wali / User Phone Number (Initial Login ID)
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'MUST_CHANGE_PASSWORD' | 'SUSPENDED' | 'DISABLED'
  avatar: text('avatar'),
  // Legacy compatibility fields (Preserved for backwards compatibility, @deprecated)
  tenantId: text('tenant_id').default('default').notNull(),
  role: text('role').default('orang_tua'), // Legacy role string
  childSantriId: text('child_santri_id'), // Legacy single child link
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  phoneIdx: index('users_phone_idx').on(table.phone),
  statusIdx: index('users_status_idx').on(table.status),
}));

// ── 2. Global Platform Roles Table (SUPER_ADMIN, DEVELOPER) ──────────────────
export const platformRoles = pgTable('platform_roles', {
  id: text('id').primaryKey(), // e.g. 'SUPER_ADMIN' | 'DEVELOPER'
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── 3. User Platform Roles Binding Table ─────────────────────────────────────
export const userPlatformRoles = pgTable('user_platform_roles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platformRoleId: text('platform_role_id').notNull().references(() => platformRoles.id, { onDelete: 'cascade' }),
  grantedBy: text('granted_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userRoleUnique: unique('user_platform_roles_user_role_idx').on(table.userId, table.platformRoleId),
  userIdx: index('upr_user_idx').on(table.userId),
}));

// ── 4. Tenant Roles Table (Tenant-Configurable Roles) ────────────────────────
export const tenantRoles = pgTable('tenant_roles', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  roleCode: text('role_code').notNull(), // 'ADMIN' | 'GURU' | 'MUSYRIF' | 'BENDAHARA' | 'STAFF' | 'WALI'
  name: text('name').notNull(),
  description: text('description'),
  isCustom: boolean('is_custom').default(false).notNull(),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE' | 'INACTIVE'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantRoleUnique: unique('tenant_roles_tenant_code_idx').on(table.tenantId, table.roleCode),
  tenantIdx: index('tenant_roles_tenant_idx').on(table.tenantId),
}));

// ── 5. User Tenant Memberships Table (Single Active Primary Role per Tenant) ──
export const userTenantMemberships = pgTable('user_tenant_memberships', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  primaryRoleId: text('primary_role_id').notNull().references(() => tenantRoles.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userTenantUnique: unique('user_tenant_memberships_user_tenant_idx').on(table.userId, table.tenantId),
  userIdx: index('utm_user_idx').on(table.userId),
  tenantIdx: index('utm_tenant_idx').on(table.tenantId),
  roleIdx: index('utm_role_idx').on(table.primaryRoleId),
}));

// ── 6. Permissions Registry Table (Platform-Owned Canonical Registry) ─────────
export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(), // e.g. 'santri.read', 'academic.create'
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  module: text('module').notNull(), // e.g. 'santri' | 'academic' | 'finance' | 'wallet'
  scope: text('scope').notNull().default('TENANT'), // 'PLATFORM' | 'TENANT'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── 7. Tenant Role Permissions Junction Table ────────────────────────────────
export const tenantRolePermissions = pgTable('tenant_role_permissions', {
  id: text('id').primaryKey(),
  tenantRoleId: text('tenant_role_id').notNull().references(() => tenantRoles.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  rolePermUnique: unique('trp_role_perm_idx').on(table.tenantRoleId, table.permissionId),
  roleIdx: index('trp_role_idx').on(table.tenantRoleId),
  permIdx: index('trp_perm_idx').on(table.permissionId),
}));

// ── 8. User Additional Permissions Table (Per-Membership Granted Permissions) ──
export const userAdditionalPermissions = pgTable('user_additional_permissions', {
  id: text('id').primaryKey(),
  membershipId: text('membership_id').notNull().references(() => userTenantMemberships.id, { onDelete: 'cascade' }),
  permissionId: text('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  grantedBy: text('granted_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  memberPermUnique: unique('uap_member_perm_idx').on(table.membershipId, table.permissionId),
  memberIdx: index('uap_member_idx').on(table.membershipId),
  permIdx: index('uap_perm_idx').on(table.permissionId),
}));

// ── 9. Multi-Child Guardian Relationship Table (1 Wali -> N Santri) ───────────
export const waliSantriRelationships = pgTable('wali_santri_relationships', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  waliUserId: text('wali_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  santriId: text('santri_id').notNull().references(() => santri.id, { onDelete: 'cascade' }),
  relationshipType: text('relationship_type').notNull().default('AYAH'), // 'AYAH' | 'IBU' | 'WALI'
  isPrimary: boolean('is_primary').default(true).notNull(),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  waliSantriUnique: unique('wsr_tenant_wali_santri_idx').on(table.tenantId, table.waliUserId, table.santriId),
  waliIdx: index('wsr_wali_idx').on(table.waliUserId),
  santriIdx: index('wsr_santri_idx').on(table.santriId),
  tenantIdx: index('wsr_tenant_idx').on(table.tenantId),
}));
