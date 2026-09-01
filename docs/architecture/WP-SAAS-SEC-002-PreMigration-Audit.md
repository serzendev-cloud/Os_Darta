# WP-SAAS-SEC-002 — Pre-Migration Forensic Audit & RLS Hardening Blueprint

> **WORK PACKAGE:** WP-SAAS-SEC-002  
> **TITLE:** TENANT DATABASE RLS HARDENING  
> **STATUS:** PRE-MIGRATION CHECKPOINT COMPLETE  
> **BRANCH:** `preview`  
> **DATE:** 2026-09-01  
> **AUTHORIZATION:** GRANTED BY PRODUCT OWNER FOR WP-SAAS-SEC-002 ONLY

---

## 1. Executive Summary & Objective

Following the findings of **WP-SAAS-SEC-001**, this pre-migration audit formalizes the database-level Row-Level Security (RLS) hardening blueprint for the Ma'had Manager (Madev) multi-tenant SaaS platform. 

The primary objective is to implement true **Defense-in-Depth**:
- **Application Level:** Proxy Zero-Trust Hostname Extraction → `getTenantContext()` → RBAC Authorization (`requirePermission`) → Query Scoping.
- **Database Level:** PostgreSQL Row Level Security (RLS) with transaction-scoped session parameters (`app.current_tenant_id` and `app.is_super_admin`) ensuring that even if an application query accidentally omits a `WHERE tenant_id = $1` clause, cross-tenant data exposure or mutation is blocked at the database engine level.

---

## 2. Table Classification Matrix (57 Database Tables)

| # | Table Name | Scope Category | `tenant_id` Column | Nullable? | Default Value | RLS Status Before | RLS Target Strategy |
|---|---|---|:---:|:---:|:---:|:---:|---|
| 1 | `tenants` | Core Platform | PK (`id`) | No | None | ABSENT | Tenant self-read / Super Admin bypass |
| 2 | `tenant_settings` | Core Config | `tenant_id` (UNIQUE) | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 3 | `platform_roles` | Platform Global | None | — | — | GLOBAL | Platform-wide read; Admin write |
| 4 | `user_platform_roles` | Platform Global | None | — | — | GLOBAL | User self-read; Admin write |
| 5 | `permissions` | Platform Global | None | — | — | GLOBAL | Read-all; Platform Admin write |
| 6 | `tenant_roles` | RBAC & Identity | `tenant_id` (FK) | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 7 | `tenant_role_permissions` | RBAC & Identity | Via `tenant_role_id` | No | None | ABSENT | FK Joined to `tenant_roles` |
| 8 | `user_tenant_memberships` | RBAC & Identity | `tenant_id` (FK) | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 9 | `user_additional_permissions`| RBAC & Identity | Via `membership_id`| No | None | ABSENT | FK Joined to `user_tenant_memberships` |
| 10 | `users` | Platform Identity | `tenant_id` (Legacy)| No | 'default' | ABSENT | User self / Tenant members read |
| 11 | `wali_santri_relationships` | RBAC & Identity | `tenant_id` (FK) | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 12 | `santri` | Core Education | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 13 | `guru` | Core Education | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 14 | `kelas` | Core Education | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 15 | `mapel` | Core Education | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 16 | `teacher_assignments` | Core Education | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 17 | `master_jenjang` | Core Education | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 18 | `master_tingkat` | Core Education | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 19 | `academic_years` | Core Education | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 20 | `academic_terms` | Core Education | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 21 | `academic_ledger_records` | Core Education | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 22 | `academic_transcripts` | Core Education | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 23 | `tolerance_policies` | Core Education | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 24 | `asrama` | Asrama & Housing | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 25 | `kamar` | Asrama & Housing | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 26 | `master_pelanggaran` | Governance | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 27 | `pelanggaran` | Governance | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 28 | `master_hukuman` | Governance | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 29 | `hukuman` | Governance | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 30 | `governance_cases` | Governance | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 31 | `status_ledgers` | Santri Lifecycle | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 32 | `status_change_records` | Santri Lifecycle | Via `status_ledger_id`| No | None | ABSENT | FK Joined to `status_ledgers` |
| 33 | `history_ledgers` | Audit & History | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 34 | `field_change_records` | Audit & History | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 35 | `health_visits` | UKS Kesehatan | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 36 | `health_permissions` | UKS Kesehatan | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 37 | `quests` | Character/Gamif. | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 38 | `wallets` | Finance & Wallets | `tenant_id` | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 39 | `wallet_pockets` | Finance & Wallets | `tenant_id` | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 40 | `invoices` | Finance & SPP | `tenant_id` | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 41 | `canteens` | POS Kantin | `tenant_id` | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 42 | `canteen_items` | POS Kantin | `tenant_id` | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 43 | `canteen_transactions` | POS Kantin | `tenant_id` | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 44 | `ppob_transactions` | PPOB Services | `tenant_id` | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 45 | `ppob_categories` | PPOB Global | None | — | — | GLOBAL | Global catalog |
| 46 | `ppob_products` | PPOB Global | None | — | — | GLOBAL | Global catalog |
| 47 | `ppob_wali_balances` | PPOB Wali | None (`wali_id`) | No | None | USER SCOPED| Scoped to `wali_id` |
| 48 | `rfid_cards` | RFID Subsystem | `tenant_id` | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 49 | `attendance_logs` | RFID Subsystem | `tenant_id` | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 50 | `gate_passes` | Security & Gate | `tenant_id` | No | None | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 51 | `notifications` | Notification | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 52 | `audit_logs` | Security Audit | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 53 | `outbox_events` | Event Outbox | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 54 | `gdrive_documents` | Cloud Storage | `tenant_id` | No | 'default' | ABSENT | Strict `tenant_id = app.current_tenant_id` |
| 55 | `master_institutions` | Kesiswaan (0001) | `tenant_id` | No | None | **ENABLED** | `tenant_id = current_setting(...)` |
| 56 | `violation_severity_levels` | Kesiswaan (0001) | `tenant_id` | No | None | **ENABLED** | `tenant_id = current_setting(...)` |
| 57 | `violation_categories` | Kesiswaan (0001) | `tenant_id` | No | None | **ENABLED** | `tenant_id = current_setting(...)` |

---

## 3. Database Driver & Connection Pooling Architecture

Existing application database access uses:
- **Driver:** `postgres` (`postgres-js`) via `drizzle-orm/postgres-js` with direct connection string (`DATABASE_URL`).
- **Connection Model:** Serverless / pooled connections (`prepare: false`).

### Critical Tenant Context Strategy
Because direct PostgreSQL connections do not automatically possess Supabase JWT claims (`auth.jwt()`), the RLS policy must support **Transaction-Scoped Session Settings**:

```sql
-- Within a database transaction:
SET LOCAL app.current_tenant_id = 't_alfatih';
SET LOCAL app.is_super_admin = 'false';
```

**Why `SET LOCAL` is mandatory:**
1. `SET LOCAL` scopes the variable strictly to the duration of the current transaction (`BEGIN ... COMMIT / ROLLBACK`).
2. When the pooled connection is returned to the pool, the session parameter is automatically wiped.
3. It eliminates any risk of Tenant A's tenant context bleeding into Tenant B's subsequent query on the same physical connection.

---

## 4. Policy Architecture & Rules

### Universal Tenant Policy Standard
```sql
CREATE POLICY "tenant_isolation_all" ON "<table_name>"
  FOR ALL
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR tenant_id = current_setting('app.current_tenant_id', true)
    OR tenant_id = (auth.jwt() ->> 'tenant_id')
  )
  WITH CHECK (
    current_setting('app.is_super_admin', true) = 'true'
    OR tenant_id = current_setting('app.current_tenant_id', true)
    OR tenant_id = (auth.jwt() ->> 'tenant_id')
  );
```

### Special Policies:
1. **`tenants` table:**
   - Super Admin: Full SELECT, INSERT, UPDATE, DELETE.
   - Tenant Context: SELECT ONLY where `id = current_setting('app.current_tenant_id', true) OR slug = current_setting('app.current_tenant_slug', true)`. (Prevents tenant enumeration).
2. **`tenant_settings` table:**
   - Strict `tenant_id = current_setting('app.current_tenant_id', true)`. Prevents reading or modifying other tenants' branding/credentials.
3. **`users` table:**
   - Super Admin: All.
   - User self-read: `id = auth.uid()`.
   - Tenant Member: Belongs to same tenant via `user_tenant_memberships`.

---

## 5. Rollback & Staging Plan

- The migration is designed to be cleanly applied via Drizzle migration `drizzle/0002_tenant_rls_hardening.sql`.
- Rollback mechanism: An inverse migration disabling RLS (`ALTER TABLE ... DISABLE ROW LEVEL SECURITY; DROP POLICY ...`) is pre-documented in case of unpredicted runtime conflicts.

---

## 6. Pre-Migration Verification

- Table matrix confirmed: **57 tables audited**.
- 52 tenant-scoped tables queued for RLS enablement.
- 5 global tables preserved without tenant restriction.
- Proceeding to write `WP-SAAS-SEC-002-RLS-Policy-Matrix.md` and implement canonical transaction helper & migration.
