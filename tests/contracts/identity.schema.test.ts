import { describe, it, expect } from 'vitest';
import {
  users,
  platformRoles,
  userPlatformRoles,
  tenantRoles,
  userTenantMemberships,
  permissions,
  tenantRolePermissions,
  userAdditionalPermissions,
  waliSantriRelationships,
} from '../../src/lib/db/schema';
import { getTableColumns } from 'drizzle-orm';

describe('WP-101 Phase 1C Identity & RBAC Schema Contracts', () => {
  it('should export all 9 core identity & RBAC Drizzle tables from schema', () => {
    expect(users).toBeDefined();
    expect(platformRoles).toBeDefined();
    expect(userPlatformRoles).toBeDefined();
    expect(tenantRoles).toBeDefined();
    expect(userTenantMemberships).toBeDefined();
    expect(permissions).toBeDefined();
    expect(tenantRolePermissions).toBeDefined();
    expect(userAdditionalPermissions).toBeDefined();
    expect(waliSantriRelationships).toBeDefined();
  });

  it('should verify users table columns (hardened global platform identity)', () => {
    const cols = getTableColumns(users);
    expect(cols.id).toBeDefined();
    expect(cols.name).toBeDefined();
    expect(cols.email).toBeDefined();
    expect(cols.phone).toBeDefined();
    expect(cols.status).toBeDefined();
    // Legacy compatibility fields
    expect(cols.tenantId).toBeDefined();
    expect(cols.role).toBeDefined();
    expect(cols.childSantriId).toBeDefined();
  });

  it('should verify platformRoles & userPlatformRoles schema columns', () => {
    const pCols = getTableColumns(platformRoles);
    expect(pCols.id).toBeDefined();
    expect(pCols.name).toBeDefined();

    const uprCols = getTableColumns(userPlatformRoles);
    expect(uprCols.id).toBeDefined();
    expect(uprCols.userId).toBeDefined();
    expect(uprCols.platformRoleId).toBeDefined();
  });

  it('should verify tenantRoles & userTenantMemberships schema columns', () => {
    const trCols = getTableColumns(tenantRoles);
    expect(trCols.id).toBeDefined();
    expect(trCols.tenantId).toBeDefined();
    expect(trCols.roleCode).toBeDefined();

    const utmCols = getTableColumns(userTenantMemberships);
    expect(utmCols.id).toBeDefined();
    expect(utmCols.userId).toBeDefined();
    expect(utmCols.tenantId).toBeDefined();
    expect(utmCols.primaryRoleId).toBeDefined();
    expect(utmCols.status).toBeDefined();
  });

  it('should verify permissions, tenantRolePermissions & userAdditionalPermissions schema columns', () => {
    const permCols = getTableColumns(permissions);
    expect(permCols.id).toBeDefined();
    expect(permCols.code).toBeDefined();
    expect(permCols.module).toBeDefined();
    expect(permCols.scope).toBeDefined();

    const trpCols = getTableColumns(tenantRolePermissions);
    expect(trpCols.id).toBeDefined();
    expect(trpCols.tenantRoleId).toBeDefined();
    expect(trpCols.permissionId).toBeDefined();

    const uapCols = getTableColumns(userAdditionalPermissions);
    expect(uapCols.id).toBeDefined();
    expect(uapCols.membershipId).toBeDefined();
    expect(uapCols.permissionId).toBeDefined();
  });

  it('should verify waliSantriRelationships schema columns for multi-child model', () => {
    const wsrCols = getTableColumns(waliSantriRelationships);
    expect(wsrCols.id).toBeDefined();
    expect(wsrCols.tenantId).toBeDefined();
    expect(wsrCols.waliUserId).toBeDefined();
    expect(wsrCols.santriId).toBeDefined();
    expect(wsrCols.relationshipType).toBeDefined();
    expect(wsrCols.isPrimary).toBeDefined();
    expect(wsrCols.status).toBeDefined();
  });
});
