# WP-TENANT-PERMISSIONS-BACKFILL-001
## Read-Only Forensic Audit & Tenant Permission Backfill Plan

**Status:** COMPLETE (READ-ONLY FORENSIC AUDIT)  
**Execution Phase:** DISCOVERY / AUDIT / PLAN ONLY  
**Database Mutation:** NONE (STRICT READ-ONLY ENFORCED)  
**Source Mutation:** NONE  
**Canonical Role:** Senior Principal Systems Architect & PostgreSQL/RBAC Security Engineer  
**Target Repository:** `MA'HAD MANAGER / SaaS Pesantren`  
**Timestamp:** 2026-09-12T21:35:00+07:00  

---

## 1. Executive Summary

Following the successful execution of **WP-DB-RECON-PERMISSIONS-001-EXECUTE**, the canonical RBAC catalog table `public.permissions` (55 rows: 52 TENANT, 3 PLATFORM) and the junction tables `public.tenant_role_permissions` and `public.user_additional_permissions` were established in the live Supabase PostgreSQL database. As mandated by the migration safety gate, the previous migration intentionally did **NOT** perform any data backfill on existing tenant roles.

This forensic audit investigates the exact database baseline and source code architecture to formulate a zero-risk, non-destructive, and idempotent backfill plan for existing tenant `ADMIN` roles.

### Key Forensic Findings
1. **Existing Active Tenants:** Exactly two (2) tenants exist in the live database:
   - `runtime-verify-001` (`id: t_1789172137858_9g7lm`, status: `ACTIVE`)
   - `runtime-verify-002` (`id: t_1789178874071_8vsju`, status: `ACTIVE`)
2. **Existing ADMIN Roles:** Exactly two (2) `ADMIN` roles exist, exactly one per tenant:
   - `role_admin_t_1789172137858_9g7lm` (belongs to `runtime-verify-001`)
   - `role_admin_t_1789178874071_8vsju` (belongs to `runtime-verify-002`)
3. **Current Assignment State:** `public.tenant_role_permissions` currently contains **0 rows**.
4. **Current Authorization Impact:** In live runtime queries, both tenant administrators fail closed (`DENIED_PERMISSION_MISSING` / 0 effective permissions) for any operation guarded by `requirePermission()`.
5. **Future Tenant Provisioning Status:** Clean. Newly provisioned tenants via `tenantProvisioningService.ts` already execute `seedTenantAdminPermissions` inside their provisioning transaction (Step D2). Hence, this backfill is strictly required only for historical/existing pre-reconciliation tenants.
6. **Mathematical Backfill Target:** Exactly **2 roles × 52 TENANT permissions = 104 rows** to be inserted into `public.tenant_role_permissions`.
7. **Platform Permissions Excluded:** Zero (0) rows of the 3 `PLATFORM` permissions will be assigned to tenant roles.

---

## 2. Current Database State

Live read-only forensic queries were executed against Supabase PostgreSQL (PostgreSQL 15.8) on 2026-09-12:

| Metric / Table | Live Count | Description / Scope |
| :--- | :---: | :--- |
| `public.tenants` | **2** | All active institutions created via verified provisioning |
| `public.tenant_settings` | **2** | 1:1 settings record for each tenant |
| `public.users` | **3** | 1 Super Admin + 2 Tenant Admin owner users |
| `public.tenant_roles` | **2** | Both are system `ADMIN` roles (`status = 'ACTIVE'`) |
| `public.user_tenant_memberships` | **2** | Active memberships binding tenant admins to their `ADMIN` role |
| `public.permissions` (Total) | **55** | Canonical catalog seeded in reconciliation migration |
| `public.permissions` (`scope = 'TENANT'`) | **52** | Modular domain permissions (Santri, Tahfidz, Finance, etc.) |
| `public.permissions` (`scope = 'PLATFORM'`) | **3** | Global platform governance permissions |
| `public.tenant_role_permissions` | **0** | Empty; awaiting controlled backfill execution |
| `public.user_additional_permissions`| **0** | Empty; reserved for per-user individual overrides |
| `public.audit_logs` | **4** | Historical audit trail from live runtime verifications |

---

## 3. Existing Tenant Inventory

A complete inventory of all rows in `public.tenants` confirmed:

| Tenant ID | Slug | Name | Status | Tier | Created At |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `t_1789172137858_9g7lm` | `runtime-verify-001` | Pesantren Darul Verification | `ACTIVE` | `standard` | 2026-09-11 17:15:37 UTC |
| `t_1789178874071_8vsju` | `runtime-verify-002` | Pesantren Al-Hikmah Verification 2 | `ACTIVE` | `standard` | 2026-09-11 19:07:54 UTC |

- **Anomalies / Orphaned Records:** None.
- **Archived / Suspended Tenants:** None.
- **Default / Demo Tenants:** None.

---

## 4. ADMIN Role Inventory

Each tenant possesses exactly one canonical `ADMIN` role:

| Role ID | Tenant ID | Tenant Slug | Role Code | Name | Status | Is System |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: |
| `role_admin_t_1789172137858_9g7lm` | `t_1789172137858_9g7lm` | `runtime-verify-001` | `ADMIN` | Administrator | `ACTIVE` | `true` |
| `role_admin_t_1789178874071_8vsju` | `t_1789178874071_8vsju` | `runtime-verify-002` | `ADMIN` | Administrator | `ACTIVE` | `true` |

### Integrity Verifications:
- **Tenants without ADMIN role:** 0.
- **Tenants with duplicate ADMIN roles:** 0.
- **Roles referencing non-existent tenant:** 0.
- **Foreign key integrity:** Both role rows reference valid `public.tenants(id)` with `onDelete: cascade`.

---

## 5. Permission Catalog Verification

The live catalog was verified against `src/config/permissions.ts` and `src/lib/authz/canonical-permissions.ts`:

- **Total Registered Permissions in DB:** 55.
- **Tenant Scoped Permissions:** 52 (`scope = 'TENANT'`).
- **Platform Scoped Permissions:** 3 (`scope = 'PLATFORM'`):
  1. `perm_manage_system_global` (`manage_system_global`)
  2. `perm_manage_tenants` (`manage_tenants`)
  3. `perm_view_saas_analytics` (`view_saas_analytics`)
- **Dotted-Code / Snake_Case Drift:** 0 drift. All codes in DB follow strict `snake_case` (e.g., `view_dashboard`, `manage_tenant_settings`, `view_santri`, `manage_santri`, etc.).
- **Duplicate Codes:** 0.
- **Duplicate IDs:** 0.
- **Matching Parity:** 100% parity between TypeScript AST source constants and PostgreSQL live records.

---

## 6. Existing Permission Assignment State

Read-only inspection of junction tables:
1. `public.tenant_role_permissions`:
   - Rows count: **0**.
   - No partial assignments exist for any tenant.
2. `public.user_additional_permissions`:
   - Rows count: **0**.
   - No user overrides exist.
   - The backfill is strictly isolated to `tenant_role_permissions` and will have zero interaction with or dependencies on `user_additional_permissions`.

---

## 7. `seedTenantAdminPermissions` Trace

We traced the canonical seeding function in `src/lib/authz/canonical-permissions.ts`:

```typescript
export async function seedTenantAdminPermissions(
  adminRoleId: string,
  tenantId: string,
  tx: any
): Promise<{ seededCount: number; assignedPermissionCodes: string[] }>
```

### Architectural Properties:
1. **Scope Filtering:** Explicitly queries `where(eq(permissions.scope, 'TENANT'))`.
2. **Platform Isolation:** PLATFORM permissions are strictly excluded at query level.
3. **Idempotency Safeguard:** Queries existing assignments for `adminRoleId` and only inserts unassigned permissions.
4. **Provisioning Integration:** In `src/modules/saas/services/tenant-provisioning-service.ts` (lines 335-337):
   ```typescript
   // D2. Seed Baseline Canonical Permissions for Role 'ADMIN'
   await seedTenantAdminPermissions(adminRoleId, tenantId, tx);
   ```
   Newly created tenants automatically receive all 52 permissions inside the atomic provisioning transaction.
5. **Backfill Need:** The backfill plan addresses pre-existing tenants (`runtime-verify-001` and `runtime-verify-002`) that were provisioned before the physical schema reconciliation migration occurred.

---

## 8. Authorization Service Trace

We traced the canonical authorization engine in `src/lib/authz/authorization-service.ts`:

```
getEffectivePermissions(userId, tenantId, db)
  │
  ├─► 1. Verify Tenant Status = 'active' (Fail-Closed)
  │
  ├─► 2. Verify User Tenant Membership Status = 'ACTIVE' (Fail-Closed)
  │
  ├─► 3. Verify Primary Role Status = 'ACTIVE' (Fail-Closed)
  │
  ├─► 4. SELECT p.code, p.scope FROM tenant_role_permissions trp
  │      INNER JOIN permissions p ON trp.permission_id = p.id
  │      WHERE trp.tenant_role_id = primaryRole.id
  │
  ├─► 5. SELECT p.code, p.scope FROM user_additional_permissions uap
  │      INNER JOIN permissions p ON uap.permission_id = p.id
  │      WHERE uap.membership_id = membership.id
  │
  └─► 6. Union role + additional permissions (filter scope == 'TENANT')
         => Return Set<PermissionCode>
```

### Live Simulation Results:
Simulating `getEffectivePermissions()` on live data for `runtime.verify001@madev.id` and `runtime.verify002@madev.id`:
- Tenant Status: `active` (PASS)
- Membership: `ACTIVE` (PASS)
- Primary Role: `ADMIN` / `ACTIVE` (PASS)
- Role Permissions: **0 rows returned**
- Additional Permissions: **0 rows returned**
- Effective Permissions: **`Set(0)`**
- Decision: **`DENIED`** for all calls to `requirePermission(userId, tenantId, code)`!

This proves definitively that without the backfill, tenant administrators cannot perform authorized tenant operations.

---

## 9. Tenant Isolation Analysis

### Structural Tenant Isolation Model
In the relational schema:
- `tenant_roles` contains `tenant_id`.
- `tenant_role_permissions` references `tenant_role_id`.
- Every tenant has its own isolated `tenant_roles` record (`role_admin_t_1789172137858_9g7lm` for Tenant 1, `role_admin_t_1789178874071_8vsju` for Tenant 2).

### Prevention of Cross-Tenant Leakage
- Backfill maps `(role_id, permission_id)` where `role_id` is explicitly bound to `tenant_id`.
- A user in Tenant 1 resolves role permissions exclusively through their own membership's `primary_role_id`.
- No shared tenant role exists.
- Platform permissions cannot leak into tenant spaces because the backfill query enforces `WHERE p.scope = 'TENANT'`.

---

## 10. ID Generation Analysis

### Existing Helper Pattern:
`src/lib/authz/canonical-permissions.ts` uses:
```typescript
id: `trp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${safeCode}`
```

### Backfill SQL ID Generation Options:

| Option | Format | Deterministic? | Rollback Friendly? | Audit Provenance? |
| :--- | :--- | :---: | :---: | :---: |
| **Option A (Recommended)** | `'trp_' \|\| tr.id \|\| '_' \|\| p.id` | **YES** | **High** (traceable by prefix/role) | **Superior** |
| **Option B (Randomized)** | `'trp_' \|\| extract(epoch)... \|\| md5(random())...` | NO | Medium | Lower |

### Rationale for Option A:
- Schema definition: `public.tenant_role_permissions.id` is `text PRIMARY KEY`.
- Example ID: `'trp_role_admin_t_1789172137858_9g7lm_perm_view_dashboard'` (57 characters).
- Guarantees 100% determinism: re-running the insert produces identical primary keys, avoiding duplicate key generation.
- Clear forensic provenance: differentiates backfilled rows from dynamically provisioned rows.

---

## 11. Idempotency Analysis

The schema contains a strict unique constraint on `public.tenant_role_permissions`:
```sql
CONSTRAINT trp_role_perm_idx UNIQUE (tenant_role_id, permission_id)
```

To ensure bulletproof idempotency across multiple runs:
1. **Dual Defense Mechanism:**
   - Layer 1 (Query Filtering): `WHERE NOT EXISTS (SELECT 1 FROM public.tenant_role_permissions ...)`
   - Layer 2 (PostgreSQL Conflict Handling): `ON CONFLICT (tenant_role_id, permission_id) DO NOTHING`
2. **Result of Repeated Execution:**
   - 1st Execution: Inserts 104 rows.
   - 2nd Execution: Inserts 0 rows (delta = 0), throws 0 errors.

---

## 12. Eligible Tenant Determination

| Tenant Slug | Tenant ID | Role ID | Eligibility Verdict | Reason |
| :--- | :--- | :--- | :---: | :--- |
| `runtime-verify-001` | `t_1789172137858_9g7lm` | `role_admin_t_1789172137858_9g7lm` | **ELIGIBLE** | Active institution, valid admin role, 0 permissions assigned |
| `runtime-verify-002` | `t_1789178874071_8vsju` | `role_admin_t_1789178874071_8vsju` | **ELIGIBLE** | Active institution, valid admin role, 0 permissions assigned |

---

## 13. Exclusion / Ambiguity List

- **Excluded Tenants:** None.
- **Ambiguous Tenants:** None.
- **Platform / Root Tenants:** Platform administrators operate via `public.user_platform_roles` and `public.platform_roles`, not via `public.tenant_roles`. No platform tenant exists in `public.tenants`.
- **Archived / Soft-Deleted Tenants:** None.

---

## 14. Recommended Backfill Strategy

We recommend a **Single-Transaction SQL Script** executed via a dedicated execution work package (`WP-TENANT-PERMISSIONS-BACKFILL-001-EXECUTE`).

### Why SQL-First over Application Script?
1. **Atomic Transactionality:** Full ACID boundary (`BEGIN` / `COMMIT` / `ROLLBACK`).
2. **Zero Dependency on Node/TypeScript Runtime:** No path-alias or bundling issues.
3. **Zero Code Changes:** No risk of introducing application regressions or deployment side effects.
4. **Instant Auditability:** Exact rows affected returned via `SELECT count(*)`.

---

## 15. Proposed SQL / Algorithm

> [!CAUTION]
> **PREPARED ONLY — NOT AUTHORIZED FOR EXECUTION IN THIS WORK PACKAGE**  
> The following SQL script is designed for review and subsequent controlled execution.

```sql
-- =============================================================================
-- WORK PACKAGE: WP-TENANT-PERMISSIONS-BACKFILL-001-EXECUTE
-- SCRIPT: drizzle/WP-TENANT-PERMISSIONS-BACKFILL-001.sql
-- PREPARED ONLY — NOT AUTHORIZED FOR EXECUTION
-- =============================================================================

BEGIN;

-- 1. Pre-execution Baseline Assertion
DO $$
DECLARE
    v_admin_role_count int;
    v_tenant_perm_count int;
BEGIN
    SELECT count(*) INTO v_admin_role_count
    FROM public.tenant_roles tr
    JOIN public.tenants t ON tr.tenant_id = t.id
    WHERE tr.role_code = 'ADMIN'
      AND tr.status = 'ACTIVE'
      AND t.status = 'active';

    SELECT count(*) INTO v_tenant_perm_count
    FROM public.permissions
    WHERE scope = 'TENANT';

    IF v_admin_role_count <> 2 THEN
        RAISE EXCEPTION 'Safety assertion failed: expected 2 eligible admin roles, found %', v_admin_role_count;
    END IF;

    IF v_tenant_perm_count <> 52 THEN
        RAISE EXCEPTION 'Safety assertion failed: expected 52 canonical tenant permissions, found %', v_tenant_perm_count;
    END IF;
END $$;

-- 2. Idempotent Backfill Insertion
INSERT INTO public.tenant_role_permissions (
    id,
    tenant_role_id,
    permission_id,
    created_at
)
SELECT
    'trp_' || tr.id || '_' || p.id AS id,
    tr.id AS tenant_role_id,
    p.id AS permission_id,
    now() AS created_at
FROM public.tenant_roles tr
JOIN public.tenants t ON tr.tenant_id = t.id
CROSS JOIN public.permissions p
WHERE tr.role_code = 'ADMIN'
  AND tr.status = 'ACTIVE'
  AND t.status = 'active'
  AND p.scope = 'TENANT'
  AND NOT EXISTS (
      SELECT 1 
      FROM public.tenant_role_permissions existing
      WHERE existing.tenant_role_id = tr.id
        AND existing.permission_id = p.id
  )
ON CONFLICT (tenant_role_id, permission_id) DO NOTHING;

-- 3. Post-execution Verification Assertion
DO $$
DECLARE
    v_total_inserted int;
    v_platform_leaks int;
BEGIN
    SELECT count(*) INTO v_total_inserted
    FROM public.tenant_role_permissions;

    IF v_total_inserted <> 104 THEN
        RAISE EXCEPTION 'Post-execution assertion failed: expected 104 total assignments, found %', v_total_inserted;
    END IF;

    -- Verify zero platform permissions assigned to tenant roles
    SELECT count(*) INTO v_platform_leaks
    FROM public.tenant_role_permissions trp
    JOIN public.permissions p ON trp.permission_id = p.id
    WHERE p.scope <> 'TENANT';

    IF v_platform_leaks > 0 THEN
        RAISE EXCEPTION 'Security breach: % non-tenant permissions found in tenant_role_permissions', v_platform_leaks;
    END IF;
END $$;

COMMIT;
```

---

## 16. Safety Analysis

1. **Non-Destructive:** Uses only `INSERT ... ON CONFLICT DO NOTHING`. Zero `DELETE`, `UPDATE`, `DROP`, or `TRUNCATE`.
2. **Table Locks:** Single-row insertion does not lock table reads. Concurrent portal access remains uninterrupted.
3. **Transaction Isolated:** The entire operation is wrapped in `BEGIN ... COMMIT`. If any assertion fails, the entire backfill rolls back automatically.
4. **Scope Enforced:** `WHERE p.scope = 'TENANT'` strictly prevents assigning any of the 3 platform permissions.

---

## 17. Rollback / Recovery Strategy

In the unlikely event that a rollback is required post-execution:
Because backfilled rows use the deterministic ID prefix `'trp_role_admin_'`:
```sql
BEGIN;

DELETE FROM public.tenant_role_permissions
WHERE id LIKE 'trp_role_admin_%';

COMMIT;
```
- **Recovery Invariant:** Targets strictly the rows created during this backfill without affecting any dynamically provisioned rows created thereafter.

---

## 18. Verification Plan

Upon authorization and execution of the follow-up execution WP:

| Step | Verification Check | Expected Result |
| :---: | :--- | :---: |
| 1 | Row count in `public.tenant_role_permissions` | Exactly **104** |
| 2 | Rows per tenant ADMIN role (`runtime-verify-001`) | Exactly **52** |
| 3 | Rows per tenant ADMIN role (`runtime-verify-002`) | Exactly **52** |
| 4 | Platform permissions in `tenant_role_permissions` | Exactly **0** |
| 5 | Idempotency re-run test | Delta = **0** rows inserted |
| 6 | Authorization Service `getEffectivePermissions()` simulation | `decision = 'AUTHORIZED'`, count = **52** |
| 7 | Representative check: `requirePermission(..., 'view_dashboard')` | `authorized: true` |

---

## 19. Source Code Change Assessment

- **Is source code change required?** **NO**.
- `tenant-provisioning-service.ts` already calls `seedTenantAdminPermissions(adminRoleId, tenantId, tx)`.
- `authorization-service.ts` already resolves `tenant_role_permissions` joins correctly.
- `src/lib/db/schema/identity.ts` already matches the database schema.
- **Verdict:** Zero application code changes required. The backfill is strictly a data state reconciliation.

---

## 20. Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation Strategy |
| :--- | :---: | :---: | :--- |
| Over-granting platform permissions | High | Zero | Filter `scope = 'TENANT'` with post-execution assertion `v_platform_leaks = 0` |
| Duplicate permission assignments | Medium | Zero | Enforced by `trp_role_perm_idx UNIQUE` and `ON CONFLICT DO NOTHING` |
| Downtime / Transaction Lock | Low | Low | Light insert of 104 rows takes < 10ms |

---

## 21. Open Questions Requiring Product Owner Decision

All technical, structural, and relational parameters are verified. The only pending action is:
- **Decision:** Does the Product Owner authorize the creation of `drizzle/WP-TENANT-PERMISSIONS-BACKFILL-001.sql` and its controlled live execution under `WP-TENANT-PERMISSIONS-BACKFILL-001-EXECUTE`?

---

## 22. Exact Next-Step Recommendation

1. Transition to **WP-TENANT-PERMISSIONS-BACKFILL-001-EXECUTE**.
2. Save proposed SQL to `drizzle/WP-TENANT-PERMISSIONS-BACKFILL-001.sql`.
3. Execute the SQL within a single transaction against live Supabase PostgreSQL.
4. Run live verification queries confirming 104 rows and effective authorization.

---

========================================  
## WP STATUS  
========================================  

**WP:**  
WP-TENANT-PERMISSIONS-BACKFILL-001  

**Phase:**  
READ-ONLY FORENSIC AUDIT  

**Database Mutation:**  
NO  

**Source Mutation:**  
NO  

**Permission Backfill:**  
NOT EXECUTED  

**Tenant Mutation:**  
NO  

**User Mutation:**  
NO  

**Auth Mutation:**  
NO  

**Migration:**  
NO  

**Commit:**  
NO  

**Push:**  
NO  

**Deploy:**  
NO  

**Merge:**  
NO  

**Report:**  
PASS  

**Recommended Next Step:**  
WP-TENANT-PERMISSIONS-BACKFILL-001-EXECUTE  

========================================  
## FINAL VERDICT  
========================================  

**PASS**  

========================================  
