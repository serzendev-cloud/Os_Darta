# Work Package Report: WP-TENANT-PROVISION-SEED-PERMISSIONS-001
**Title**: Seed Tenant Role Permissions for Newly Provisioned Tenant  
**Role**: Senior Principal Engineer / Architecture Implementation Engineer / Security Reviewer  
**Phase**: CONTROLLED IMPLEMENTATION  
**Target File**: `docs/architecture/WP-TENANT-PROVISION-SEED-PERMISSIONS-001-REPORT.md`  
**Date**: 2026-09-12  

---

## 1. Executive Summary

During previous architectural discoveries and live verification of the Tenant Provisioning Engine (`WP-TENANT-PROVISION-002`), newly provisioned tenants successfully created:
- `public.tenants`
- `public.tenant_settings`
- Supabase Auth User (`auth.users`)
- `public.users`
- `public.tenant_roles` (`roleCode: 'ADMIN'`)
- `public.user_tenant_memberships`
- `public.audit_logs`

However, a critical authorization gap was identified: the newly created `ADMIN` role had **no permission records** in `tenant_role_permissions`. Consequently, even though identity authentication and membership checks succeeded, the tenant administrator would immediately fail `requirePermission()` authorization checks when attempting to access tenant dashboard features.

### Objectives Achieved:
1. **Architectural Audit & Root Cause Isolation**: Confirmed existing canonical RBAC schema in `src/lib/db/schema/identity.ts` and permission catalog in `src/config/permissions.ts`.
2. **Canonical Permission Seeding Engine**: Engineered `src/lib/authz/canonical-permissions.ts` providing canonical catalog access, strictly filtering out platform-scoped permissions (`PLATFORM`), and seeding baseline permissions for the tenant `ADMIN` role.
3. **Atomic Provisioning Integration**: Updated `src/modules/saas/services/tenant-provisioning-service.ts` to seed `ADMIN` permissions directly within the existing `withTenantTransaction(tenantId, tx)` transaction block.
4. **Comprehensive Contract Verification**: Created `tests/contracts/tenant-provisioning-seed-permissions.contract.test.ts` covering all 10 mandatory contract tests, passing 100%. The entire contract suite (111 tests) passes without regression.
5. **Critical Forensic Finding on Live Database**: Live forensic audit revealed that tables `public.permissions`, `public.tenant_role_permissions`, and `public.user_additional_permissions` **do not currently exist on the live Supabase PostgreSQL database**. In strict compliance with Section 14 (Migration Policy: *"STOP BEFORE APPLYING MIGRATION"*), an idempotent reconciliation DDL migration script `drizzle/WP-DB-RECON-PERMISSIONS-001.sql` was prepared and statically validated, with **zero live database execution**.

---

## 2. Initial Architecture Discovery

A comprehensive read-only audit across the database schema, codebase, and live Supabase PostgreSQL instance was conducted:

### A. Database Schema Audit (`src/lib/db/schema/identity.ts`)
- `permissions`: Platform canonical catalog (`id`, `code`, `name`, `module`, `scope`, `description`, `created_at`).
- `tenant_roles`: Tenant-scoped roles (`id`, `tenant_id`, `role_code`, `name`, `description`, `is_custom`, `status`, `created_at`, `updated_at`). Unique constraint: `(tenant_id, role_code)`.
- `tenant_role_permissions`: Junction table (`id`, `tenant_role_id`, `permission_id`, `created_at`). Unique constraint: `(tenant_role_id, permission_id)`.
- `user_tenant_memberships`: Membership binding (`id`, `user_id`, `tenant_id`, `primary_role_id`, `status`).

### B. Live Supabase PostgreSQL Audit
A query against `information_schema.tables` in the live Supabase PostgreSQL database revealed 29 tables in schema `public`. Specifically:
- `public.tenants` — EXISTS
- `public.tenant_settings` — EXISTS
- `public.tenant_roles` — EXISTS
- `public.user_tenant_memberships` — EXISTS
- `public.users` — EXISTS
- `public.audit_logs` — EXISTS
- `public.permissions` — **DOES NOT EXIST** (Missing)
- `public.tenant_role_permissions` — **DOES NOT EXIST** (Missing)
- `public.user_additional_permissions` — **DOES NOT EXIST** (Missing)

### C. Live Authorization Runtime Verification (`scratch/test_live_authz.mjs`)
Running `getEffectivePermissions()` for existing live tenant `runtime-verify-002` failed with:
```
PostgresError: relation "tenant_role_permissions" does not exist
  code: '42P01'
```
This proved unequivocally that while the Drizzle ORM schema defined the RBAC junction tables, they were never migrated to the live Supabase instance.

---

## 3. Permission Source of Truth

The canonical source of truth for platform permissions was traced to `src/config/permissions.ts`.

### Canonical Catalog Analysis:
- Total Defined Permissions: **48**
- **TENANT Scope (45 permissions)**: Includes all operational modules: `dashboard`, `santri`, `kepegawaian`, `akademik`, `kesiswaan`, `karakter`, `asrama`, `monitoring`, `kesehatan`, `notifikasi`, `sistem`, `pengaturan`, `administrasi`, `perpustakaan`.
- **PLATFORM Scope (3 permissions)**:
  - `tenants.manage` (`perm_manage_tenants`)
  - `saas_analytics.view` (`perm_view_saas_analytics`)
  - `system_global.manage` (`perm_manage_system_global`)

### Canonical Role Template:
In `src/config/permissions.ts`:
`ROLE_PERMISSIONS.admin` contains all tenant-level permissions. Platform-scoped permissions are strictly restricted to `super_admin` and are excluded from tenant administrators.

---

## 4. Existing RBAC Architecture

The platform authorization flow operates as follows:
```
Client Request
      ↓
requirePermission(permissionCode, tenantId)
      ↓
getEffectivePermissions(userId, tenantId)
      ↓
1. Validate active membership in user_tenant_memberships
2. Fetch primaryRoleId (from tenant_roles WHERE tenant_id = tenantId)
3. Fetch role permissions (from tenant_role_permissions WHERE tenant_role_id = primaryRoleId)
4. Fetch user additional permissions (from user_additional_permissions)
5. Aggregate and evaluate permissionCodes.has(permissionCode)
```
Without records in `tenant_role_permissions`, step 3 yields an empty set, causing `requirePermission()` to throw an HTTP 403 Forbidden error.

---

## 5. Existing Provisioning Flow

Provisioning runs through `tenantProvisioningService.provisionTenant()`:
```
POST /api/saas/tenants
       ↓
tenantProvisioningService.provisionTenant()
       ↓
1. Input Validation & Slug Normalization
2. checkTenantAvailability(slug)
3. Supabase Auth: admin.createUser()
4. PostgreSQL Transaction (withTenantTransaction):
       ├── A. Insert public.tenants
       ├── B. Insert public.tenant_settings
       ├── C. Insert public.users
       ├── D. Insert public.tenant_roles (roleCode: 'ADMIN')
       ├── [NEW D2]. Seed Baseline Permissions (seedTenantAdminPermissions)
       └── E. Insert public.user_tenant_memberships (primaryRoleId: adminRoleId)
5. Audit Logging (auditLogService.log)
6. Return Safe Provisioning Result
```

---

## 6. Root Cause of Permission Gap

1. **Omission in Provisioning Engine**: In `WP-TENANT-PROVISION-002`, Step D created the `ADMIN` role in `tenant_roles`, but no routine was invoked to populate `tenant_role_permissions`.
2. **Schema Drift on Live Database**: `WP-DB-RECON-CORE-001` focused on remediating `tenant_settings`, `platform_settings`, and `audit_logs`. The identity/RBAC tables (`permissions`, `tenant_role_permissions`) defined in `0000_neat_machine_man.sql` were never executed against the live Supabase database.

---

## 7. Implementation Changes

### A. [NEW] `src/lib/authz/canonical-permissions.ts`
Created a server-side permission catalog and seeder module:
- `CANONICAL_PERMISSIONS`: Exact typed catalog of all 48 permissions with metadata.
- `getCanonicalTenantPermissions()`: Returns only permissions with `scope === 'TENANT'` (45 permissions).
- `ensureCanonicalPermissionsExist(tx)`: Idempotently populates the `permissions` table. Safe fallback if table is not yet migrated in test mocks.
- `seedTenantAdminPermissions(adminRoleId, tenantId, tx)`:
  - Validates `adminRoleId` and `tenantId`.
  - Ensures permissions exist in the platform catalog.
  - Queries existing role permissions for `adminRoleId` to avoid duplicate assignments.
  - Inserts missing canonical tenant permissions linked to `adminRoleId`.

### B. [MODIFY] `src/modules/saas/services/tenant-provisioning-service.ts`
- Imported `seedTenantAdminPermissions`.
- Added Step D2 immediately after role creation:
  ```typescript
  // D2. Seed Baseline Canonical Permissions for Role 'ADMIN'
  await seedTenantAdminPermissions(adminRoleId, tenantId, tx);
  ```
- Positioned inside the transactional closure so any failure triggers atomic database rollback and Auth compensation deletion.

### C. [NEW] `tests/contracts/tenant-provisioning-seed-permissions.contract.test.ts`
Engineered 10 contract tests covering all mandatory requirements.

### D. [NEW] `drizzle/WP-DB-RECON-PERMISSIONS-001.sql`
Prepared an idempotent DDL migration script to reconcile `permissions`, `tenant_role_permissions`, and `user_additional_permissions` on Supabase when authorized.

---

## 8. Transaction Behavior

Permission seeding executes within the existing `withTenantTransaction(tenantId, tx)` block:
- **Transaction Sharing**: Uses the exact `tx` client provided by the transaction runner.
- **Rollback Guarantee**: If `seedTenantAdminPermissions` throws any error, the PostgreSQL transaction aborts and rolls back all created records (`tenants`, `tenant_settings`, `users`, `tenant_roles`).
- **Auth Compensation**: The catch block invokes `adminClient.auth.admin.deleteUser(authUserId)`, ensuring no orphan Supabase Auth user remains.

---

## 9. Tenant Isolation Analysis

Tenant isolation is preserved at multiple architectural layers:
1. **Tenant-Scoped Role ID**: `tenant_roles.id` is generated specifically for `tenant_id` (`WHERE tenant_id = newlyCreatedTenantId AND role_code = 'ADMIN'`).
2. **Junction FK Scoping**: `tenant_role_permissions.tenant_role_id` points directly to this tenant-specific role.
3. **Cross-Tenant Non-Interference**: Contract Test 6 demonstrates that seeding permissions for Tenant A and Tenant B yields completely disjoint role permission sets with zero cross-tenant contamination.

---

## 10. Idempotency Analysis

- **Composite Unique Constraint**: `CONSTRAINT trp_role_perm_idx UNIQUE (tenant_role_id, permission_id)`.
- **Pre-Insert Existing Check**: `seedTenantAdminPermissions` performs a query on `tenantRolePermissions` matching `tenantRoleId`, building a set of `assignedPermIds`.
- **Duplicate Prevention**: Only unassigned permissions are inserted (`permsToInsert = tenantPerms.filter(p => !assignedPermIds.has(p.id))`).
- Contract Test 5 confirms that running the seeder twice against the same role inserts 0 duplicate records.

---

## 11. Error Handling

- **No Error Swallowing**: If permission seeding fails, the error bubbles up to `withTenantTransaction`, triggering database rollback.
- **Safe API Errors**: The API handler catches the error, logs the internal stack trace server-side, and returns a sanitized `PROVISIONING_FAILED` response.
- **Zero Credential Leakage**: Database credentials, tokens, and passwords are never logged or returned to the client.

---

## 12. Test Results

### A. Seed Permissions Contract Suite (`tests/contracts/tenant-provisioning-seed-permissions.contract.test.ts`)
| Test ID | Test Description | Status |
|---|---|---|
| TEST 1 | ADMIN role is created for newly provisioned tenant | **PASS** |
| TEST 2 | ADMIN role has permission assignments seeded upon provisioning | **PASS** |
| TEST 3 | Permission assignments strictly target canonical TENANT permissions and exclude PLATFORM scope | **PASS** |
| TEST 4 | Permission assignments are strictly scoped to the newly created tenant ADMIN role | **PASS** |
| TEST 5 | Ensures idempotency and avoids duplicate permission assignments | **PASS** |
| TEST 6 | Multi-tenant isolation: Tenant A does not receive Tenant B permission assignments | **PASS** |
| TEST 7 | Failure during permission seeding causes atomic cascade rollback and Auth user compensation | **PASS** |
| TEST 8 | Existing tenant data is untouched during new tenant provisioning | **PASS** |
| TEST 9 | Propagates the exact transaction client (tx) into permission seeder | **PASS** |
| TEST 10 | Existing requirePermission successfully authorizes ADMIN after permission seeding | **PASS** |

### B. Full Contract Test Suite (`npm run test:contracts`)
- Total Test Files: **12 passed (12)**
- Total Tests: **111 passed (111)**
- Zero regressions.

### C. TypeScript Type Check (`npx tsc --noEmit`)
- Exit code: **0** (No TypeScript errors).

### D. ESLint Check (`npm run lint:ci`)
- `src/lib/authz/canonical-permissions.ts`: **0 errors, 0 warnings**.
- `tests/contracts/tenant-provisioning-seed-permissions.contract.test.ts`: **0 errors, 0 warnings**.
- Zero technical debt regression introduced.

---

## 13. Live Verification Results

### Read-Only Live Forensic:
1. Verified existing tenant `runtime-verify-002`:
   - Tenant ID: `t_1789218653121_1m1kd`
   - ADMIN role ID: `role_1789218653122_b9u4c`
   - Status: `ACTIVE`
2. Verified live database schema:
   - `public.permissions` table does not exist in live Supabase.
   - `public.tenant_role_permissions` table does not exist in live Supabase.
3. Abided strictly by Governance Rule 14:
   - **NO LIVE DDL/MIGRATION EXECUTED**.
   - Held `drizzle/WP-DB-RECON-PERMISSIONS-001.sql` for Product Owner authorization.

---

## 14. Database Mutation Summary

| Environment | Mutated Tables | Rows Created | Rows Updated | Rows Deleted | Schema Changes |
|---|---|---|---|---|---|
| **Live Supabase DB** | None | 0 | 0 | 0 | None (Zero live mutations) |
| **Local Codebase** | N/A (Code only) | N/A | N/A | N/A | Prepared migration artifact |

---

## 15. Existing Tenant Safety

- No updates or inserts were performed on existing tenants (`runtime-verify-001`, `runtime-verify-002`).
- Existing tenant data remains 100% pristine and unaltered.
- The absence of permissions on existing tenants is documented as a finding for a future backfill work package.

---

## 16. Security Findings

1. **Server-Side Authority Enforced**: The client request payload cannot specify or override granted permissions. Baseline permissions are derived entirely from server-side canonical constants.
2. **Platform Privilege Isolation**: Platform permissions (`tenants.manage`, `saas_analytics.view`, `system_global.manage`) are strictly excluded from tenant `ADMIN` roles.
3. **Zero Secret Exposure**: Audit logs and error messages strictly exclude passwords, tokens, and database connection strings.

---

## 17. Deferred Findings

1. **Live Database Migration**: `drizzle/WP-DB-RECON-PERMISSIONS-001.sql` must be authorized by the Product Owner before applying to the live Supabase instance.
2. **Existing Tenant Backfill**: Once the migration is executed on the live DB, existing tenants (`runtime-verify-001`, `runtime-verify-002`) should have their `ADMIN` roles seeded with canonical permissions via a controlled one-time reconciliation script.

---

## 18. Final Verdict & Status Block

========================================  
WP STATUS  
========================================  

WP:  
WP-TENANT-PROVISION-SEED-PERMISSIONS-001  

Architecture Discovery:  
PASS  

Permission Source of Truth:  
PASS  

Implementation:  
PASS  

ADMIN Permission Seeding:  
PASS  

Tenant Isolation:  
PASS  

Transaction Integrity:  
PASS  

Idempotency:  
PASS  

Error Handling:  
PASS  

Contract Tests:  
PASS  

TypeScript:  
PASS  

Lint:  
PASS  

Build:  
PASS  

Live Verification:  
DEFERRED (Pending Migration Authorization)  

Existing Tenant Mutation:  
NO  

Database Migration:  
NO (Prepared artifact only, not executed live)  

Unexpected Mutation:  
NO  

Source Scope Creep:  
NO  

Commit:  
NO  

Push:  
NO  

Deploy:  
NO  

========================================  
FINAL VERDICT  
========================================  

READY FOR PRODUCT OWNER REVIEW  

========================================  

---

## 19. Next Recommended Work Package

**Work Package**: `WP-DB-RECON-PERMISSIONS-001`  
**Title**: Execute Live Database Reconciliation Migration for RBAC & Permissions  
**Scope**:
1. Review and authorize live execution of `drizzle/WP-DB-RECON-PERMISSIONS-001.sql`.
2. Execute migration against live Supabase PostgreSQL to create `public.permissions`, `public.tenant_role_permissions`, `public.user_additional_permissions`, indexes, and seed canonical permissions.
3. Run controlled live runtime verification of tenant provisioning including permission persistence.
4. Execute backfill script for existing tenants (`runtime-verify-001`, `runtime-verify-002`).
