# EEOS GATE 9 — AUTHORIZATION & EXECUTION PLAN
## WORK PACKAGE: WP-PSB-ALUMNI-SCHEMA-001
### PSB (PENERIMAAN SANTRI BARU) & ALUMNI ECOSYSTEM SCHEMA MIGRATION

```text
══════════════════════════════════════════════════════════════════════════════════
WORK PACKAGE        : WP-PSB-ALUMNI-SCHEMA-001
DOCUMENT            : docs/architecture/WP-PSB-ALUMNI-GATE-9-AUTHORIZATION-AND-EXECUTION-PLAN-001.md
GATE                : GATE 9 — AUTHORIZATION & EXECUTION PLANNING
ROLES               : Principal PostgreSQL Architect + Database Migration Engineer +
                      Database Security Engineer + Release Safety Controller
AUTHORITY BASELINE  : Gate 8B Independent Re-Audit Cycle 8 (VERDICT: PASS)
MODE                : PLANNING ONLY — ZERO DATABASE EXECUTION
CURRENT STATUS      : READY FOR EXECUTION AUTHORIZATION
EXECUTION PERMIT    : ❌ NOT GRANTED (REQUIRES EXPLICIT PRODUCT OWNER AUTHORIZATION)
══════════════════════════════════════════════════════════════════════════════════
```

---

## 1. EXECUTIVE SUMMARY

Work Package `WP-PSB-ALUMNI-SCHEMA-001` provides the complete architectural and database schema specification for integrating the **PSB (Penerimaan Santri Baru)** and **Alumni Ecosystem** into the production App Ma'had multi-tenant platform.

Having definitively passed **Gate 8B Independent Re-Audit Cycle 8** with all 19 findings (F-01 through F-19) resolved, the project enters **Gate 9: Authorization & Execution Planning**.

### 1.1 Core Mandate of Gate 9
Gate 9 is an **operational safety, sequencing, and risk-mitigation planning gate**. 

**GATE 8B PASS DOES NOT CONSTITUTE PERMISSION TO RUN DDL.**
Gate 9 establishes a hardened, deterministic, fail-closed execution runbook. **NO DDL IS EXECUTED, NO DATABASE CONNECTION IS ESTABLISHED, AND NO DATA IS MUTATED DURING THIS GATE.**

### 1.2 Target Architectural Scope
The planned migration introduces:
* **2 Existing Table Extensions**: Additive columns on `public.users` (`merged_into_user_id`) and `public.santri` (`user_id`, composite unique key `uq_santri_tenant_id`, partial unique index `uq_santri_tenant_active_user`).
* **18 New Multi-Tenant Tables**:
  * 2 Core Identity & Consolidation Tables (`user_tenant_personas`, `identity_consolidation_ledgers`).
  * 8 PSB Domain Tables (`psb_periods`, `psb_waves`, `psb_committees`, `psb_applicants`, `psb_test_scores`, `psb_infaq_verifications`, `psb_acceptance_ledgers`, `psb_placement_distributions`).
  * 8 Alumni Domain Tables (`alumni_exit_reasons`, `alumni_academic_snapshots`, `alumni_korwils`, `tenant_korwil_settings`, `alumni_profiles`, `user_discovery_locations`, `salam_interactions`, `alumni_donations`).
* **180 Total Declared Columns**.
* **18 Single-Column UUID Primary Keys** (`id`).
* **31 Table-Level Unique Constraints**.
* **1 Standalone Unique Index** (`uq_active_consolidation_santri` on `identity_consolidation_ledgers`).
* **32 Total Unique Structural Fingerprints**.
* **46 Foreign Keys** (16 `CASCADE`, 25 `RESTRICT`, 5 `SET NULL` — 100% tenant-isolated).
* **23 CHECK Constraints** (13 exact whitelist enum/status contracts, 10 mathematical/relational gates).
* **2 Database Procedural Triggers** (`fn_enforce_placement_hierarchy`, `fn_sync_santri_kelas_from_rombel`).
* **20 PostgreSQL Row-Level Security Policies** covering 100% of the 18 new tables.

---

## 2. CURRENT GOVERNANCE STATE

The repository and target database remain under strict governance lock:

```text
DATABASE CONNECTION      : ❌ NOT ESTABLISHED (DATABASE 100% UNTOUCHED)
LIVE SQL EXECUTIONS      : 0
DDL EXECUTION            : ❌ FORBIDDEN / NOT PERFORMED
MIGRATION EXECUTION      : ❌ FORBIDDEN / NOT PERFORMED
PRODUCTION / DEV MUTATION: ❌ NONE
APPLICATION CODE (src/)  : ❌ UNCHANGED
TEST CODE (tests/)       : ❌ UNCHANGED
DRIZZLE SCHEMA / MIGS    : ❌ UNCHANGED
GIT TREE                 : ❌ UNCOMMITTED / UNPUSHED
GATE 9 EXECUTION STATUS  : ❌ NOT AUTHORIZED (LOCKED AT PLANNING STAGE)
```

---

## 3. GATE 8B AUDIT EVIDENCE

The Gate 8B baseline is authoritatively documented in the project repository:
1. **Remediation Cycle 8 Report**: [WP-PSB-ALUMNI-GATE-8B-REMEDIATION-CYCLE-8-REPORT.md](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-GATE-8B-REMEDIATION-CYCLE-8-REPORT.md)
   * Closed F-19 via character-by-character whitelist array-body grammar parsing (`list := element (comma + element)*`, `element := single_quoted_literal + cast`).
   * 56 / 56 adversarial scenarios passed in the Cycle 8 test suite.
2. **Independent Re-Audit Cycle 8**: [WP-PSB-ALUMNI-GATE-8B-INDEPENDENT-RE-AUDIT-CYCLE-8.md](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-GATE-8B-INDEPENDENT-RE-AUDIT-CYCLE-8.md)
   * Executed 43 independent adversarial attack scenarios. All 27 structural injection attacks (nested arrays, concatenation `||`, CASE, function calls, column references, NULLs, subqueries, arbitrary casts, operators `+ - * /`) **FAILED CLOSED**.
   * Confirmed zero regressions on F-01 through F-18.
   * **Verdict: GATE 8B INDEPENDENT RE-AUDIT — PASS**.
3. **Residual Observations (Non-Blocking)**:
   * **F-15**: Predicate whitespace normalizer is deterministic and literal-safe, correctly classified as `CALIBRATION-PENDING (PRE-GATE 9)`.
   * **F-20**: Redundant defense-in-depth keyword guard (`~* '\mOR\M'`) inspects raw SQL. Does not affect any production enum in this schema. Non-blocking.

---

## 4. ARTIFACT INVENTORY

The following implementation, design, and verification artifacts constitute the Gate 9 audit baseline:

| Artifact Path | Size | Lines | Role & Description | Status |
| :--- | :---: | :---: | :--- | :---: |
| `docs/architecture/WP-PSB-ALUMNI-DDL-DRAFT-001.sql` | 144,918 B | 4,053 | Candidate DDL specification containing Section 0 preflight through Section 6 RLS | **CANDIDATE SOURCE** |
| `scratch/manifest_c8.json` | 45,958 B | 2,249 | Authoritative declarative structural manifest (18 tables) | **LOCKED CONTRACT** |
| `scratch/section0_c8.sql` | 98,843 B | 3,051 | Standalone Section 0 preflight PL/pgSQL block | **LOCKED PREFLIGHT** |
| `scratch/gen_section0_c8.mjs` | 42,907 B | 797 | Deterministic generator script producing Section 0 from manifest | **VERIFIED GENERATOR** |
| `docs/architecture/WP-PSB-ALUMNI-DDL-DESIGN-001.md` | 77,447 B | 1,096 | Detailed architectural design document | **LOCKED DESIGN** |
| `docs/architecture/WP-PSB-ALUMNI-MIGRATION-DESIGN-001.md` | 123,818 B | 3,424 | Detailed migration strategy and operational guide | **LOCKED DESIGN** |
| `scratch/run_adversarial_validation_c8.mjs` | 32,451 B | 954 | 56-scenario test harness | **TEST SUITE** |
| `scratch/adversarial_results_c8.json` | 17,219 B | 565 | Test execution evidence (100% pass) | **EVIDENCE** |

---

## 5. ARTIFACT VERSION LOCK

To guarantee absolute reproducibility, the execution candidate source is locked as follows:

```text
================================================================================
                         ARTIFACT VERSION LOCK
================================================================================
EXECUTION CANDIDATE DDL : docs/architecture/WP-PSB-ALUMNI-DDL-DRAFT-001.sql
DDL SPECIFICATION CYCLE : GATE 8B REMEDIATION CYCLE 8
DDL CANDIDATE SHA-256   : cf41e81d9828bb55f3b7840bdbcbde5e5aebdc6cbac271ec034ae71a1e521f45
SECTION 0 PREFLIGHT HASH : SHA-256 (scratch/section0_c8.sql) = 
                          e403e69c8349d811c896d8fd7c6e94bf196915b704628662dbbbc5c193e1cead
MANIFEST CONTRACT HASH   : SHA-256 (scratch/manifest_c8.json) = 
                          5eec6b0c49c9066388ba027afbb3342f559d5a066475d2a215014f16d328081c
================================================================================
```

**Rule**: No ad-hoc modifications to SQL, manifests, or preflight assertions may be made during execution. If any script is modified, it invalidates this lock and requires re-audit.

---

## 6. BASELINE DATABASE REQUIREMENTS

Before any migration command is run, the target PostgreSQL environment must satisfy the prerequisite catalog state audited in Section 0.1 and Section 0.2:

| Baseline Object | Category | Required Structure | Verification Query / Mechanism | Blocking? |
| :--- | :--- | :--- | :--- | :---: |
| `public.tenants` | Table | Table existence, `id` PK | `information_schema.tables` | **YES** |
| `public.users` | Table | Table existence, single-column PK on `(id)` | `pg_constraint` (`contype = 'p'`) | **YES** |
| `public.santri` | Table | Table existence, single-column PK on `(id)` | `pg_constraint` (`contype = 'p'`) | **YES** |
| `public.academic_years` | Target Key | Composite unique/PK on `(tenant_id, id)` | `pg_constraint` (`contype IN ('u','p')`) | **YES** |
| `public.madrasah` | Target Key | Composite unique/PK on `(tenant_id, id)` | `pg_constraint` (`contype IN ('u','p')`) | **YES** |
| `public.jenjang` | Target Key | Composite unique/PK on `(tenant_id, id)` | `pg_constraint` (`contype IN ('u','p')`) | **YES** |
| `public.jenjang` | Target Key | Composite unique/PK on `(tenant_id, madrasah_id, id)` | `pg_constraint` (`contype IN ('u','p')`) | **YES** |
| `public.tingkat` | Target Key | Composite unique/PK on `(tenant_id, id)` | `pg_constraint` (`contype IN ('u','p')`) | **YES** |
| `public.rombel` | Target Key | Composite unique/PK on `(tenant_id, id)` | `pg_constraint` (`contype IN ('u','p')`) | **YES** |
| `public.santri` (ext) | Integrity | If `user_id` column pre-exists, must have `UNIQUE (tenant_id, id)` | `information_schema.columns` + `pg_constraint` | **YES** |

---

## 7. DEPENDENCY GRAPH & TOPOLOGICAL EXECUTION SEQUENCE

The 18 tables and extensions exhibit strict foreign key dependencies. Execution must follow this topological order:

```
[Prerequisites: tenants, users, santri, academic_years, madrasah, jenjang, tingkat, rombel]
                                │
                                ▼
               PHASE 0: Preflight Fingerprint Gate
                                │
                                ▼
            PHASE 1: Additive Existing Table Extensions
            ├── users.merged_into_user_id
            └── santri.user_id + uq_santri_tenant_id + partial index
                                │
                                ▼
            PHASE 2: Core Identity & Consolidation
            ├── user_tenant_personas
            └── identity_consolidation_ledgers (+ uq_active_consolidation_santri)
                                │
                                ▼
            PHASE 3: PSB Domain Tables (Topological Sub-Graph)
            ├── 3.1 psb_periods
            │    └── 3.2 psb_waves
            │    └── 3.3 psb_committees
            │    └── 3.4 psb_applicants
            │         └── 3.5 psb_test_scores
            │         └── 3.6 psb_infaq_verifications
            │         └── 3.7 psb_acceptance_ledgers
            │              └── 3.8 psb_placement_distributions
                                │
                                ▼
            PHASE 4: Alumni Archival & Core Tables
            ├── 4.1 alumni_exit_reasons
            ├── 4.2 alumni_academic_snapshots
            ├── 4.3 alumni_korwils
            ├── 4.4 tenant_korwil_settings
            └── 4.5 alumni_profiles
                                │
                                ▼
            PHASE 5: Alumni Operational Modules
            ├── 5.1 user_discovery_locations
            ├── 5.2 salam_interactions
            └── 5.3 alumni_donations
                                │
                                ▼
            PHASE 6: Procedural Triggers
            ├── trg_enforce_placement_hierarchy (on psb_placement_distributions)
            └── trg_sync_santri_kelas_from_rombel (on psb_placement_distributions)
                                │
                                ▼
            PHASE 7: Row-Level Security Enablement & Policies
            └── 18 Tables ENABLE + FORCE RLS, 20 Policies Registered
                                │
                                ▼
            PHASE 8: Post-Migration Fingerprint Re-Assertion
```

---

## 8. PREFLIGHT CONTRACT

The migration mandates an uncompromising, fail-closed preflight contract implemented via PostgreSQL procedural logic (`scratch/section0_c8.sql` / Section 0 of candidate DDL).

The preflight contract verifies:
1. **Prerequisite Tables**: `tenants`, `users`, `santri` must exist with single-column primary keys on `(id)`.
2. **Prerequisite Composite Keys**: `academic_years`, `madrasah`, `jenjang`, `tingkat`, and `rombel` must provide composite unique constraints containing `tenant_id`.
3. **Existing Table Nullability & Constraints**: `santri.user_id` (if present) must satisfy nullable foreign key semantics with composite uniqueness on `(tenant_id, id)`.
4. **Target Domain Tables**: All 18 domain tables are comprehensively audited for:
   * Existence
   * Column names, datatypes, and nullability
   * Primary key existence and single-column identity
   * Table unique constraint signatures
   * Standalone unique index definitions and partial predicates
   * Foreign key relational signatures and `ON DELETE` actions (`CASCADE`, `RESTRICT`, `SET NULL`)
   * CHECK constraint expressions and exact enum whitelist grammar
   * Row-Level Security enablement (`relrowsecurity = true`)

---

## 9. STRUCTURAL DRIFT PROTECTION

The migration strictly enforces the **Three-State Deterministic Model**:

$$\begin{aligned}
\text{State A: Object Absent} &\implies \text{CREATE} \\
\text{State B: Object Present \& Exactly Compatible} &\implies \text{SKIP / REUSE (IDEMPOTENT)} \\
\text{State C: Object Present \& Structurally Incompatible} &\implies \text{ABORT IMMEDIATELY (FAIL-CLOSED)}
\end{aligned}$$

### 9.1 Drift Masking Prohibition
The migration strictly prohibits masking drift using unconditional `IF NOT EXISTS` or silent swallows:
* `IF NOT EXISTS` is permitted in Sections 1–4 **ONLY** because Section 0 executes prior deep structural fingerprint validation.
* If a table exists but is missing a column, possesses an incompatible type, has a deviating CHECK constraint, or lacks RLS, the preflight engine raises an unhandled exception:
  ```sql
  RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Target object % violates manifest contract.', v_table_name;
  ```
  This immediately terminates the transaction before any schema mutation occurs.

---

## 10. MIGRATION PHASE PLAN

The operational execution runbook is partitioned into 9 strictly sequenced topological phases:

```text
PHASE 0: Safety Gate & Preflight Assertions (Section 0)
         ├── Audit prerequisites (tenants, users, santri, academic hierarchy)
         └── Audit 18 domain tables against Three-State model

PHASE 1: Existing-Table Additive Extensions (Section 1)
         ├── public.users: ADD COLUMN merged_into_user_id, ADD CONSTRAINT chk_users_merged_not_self, FK
         └── public.santri: ADD COLUMN user_id, ADD CONSTRAINT uq_santri_tenant_id, partial index

PHASE 2: Core Identity & Consolidation Infrastructure (Section 2)
         ├── public.user_tenant_personas
         └── public.identity_consolidation_ledgers (+ uq_active_consolidation_santri)

PHASE 3: PSB Domain Tables (Section 3)
         ├── 3.1 public.psb_periods
         ├── 3.2 public.psb_waves
         ├── 3.3 public.psb_committees
         ├── 3.4 public.psb_applicants
         ├── 3.5 public.psb_test_scores
         ├── 3.6 public.psb_infaq_verifications
         ├── 3.7 public.psb_acceptance_ledgers
         └── 3.8 public.psb_placement_distributions

PHASE 4: Alumni Archival & Core Tables (Section 4)
         ├── 4.1 public.alumni_exit_reasons
         ├── 4.2 public.alumni_academic_snapshots
         ├── 4.3 public.alumni_korwils
         ├── 4.4 public.tenant_korwil_settings
         └── 4.5 public.alumni_profiles

PHASE 5: Alumni Operational Module Tables (Section 4)
         ├── 5.1 public.user_discovery_locations
         ├── 5.2 public.salam_interactions
         └── 5.3 public.alumni_donations

PHASE 6: Foreign Keys & Secondary Constraint Resolution
         └── All composite FKs and unique constraints resolved inline with table creation

PHASE 7: Procedural Triggers & Functions (Section 5)
         ├── fn_enforce_placement_hierarchy() & trg_enforce_placement_hierarchy
         └── fn_sync_santri_kelas_from_rombel() & trg_sync_santri_kelas_from_rombel

PHASE 8: Row-Level Security & Access Policies (Section 6)
         ├── ENABLE + FORCE ROW LEVEL SECURITY on all 18 tables
         └── 20 idempotent security policies registered

PHASE 9: Post-Migration Validation & Commit
         └── Re-assert preflight verification; verify catalog counts; COMMIT
```

---

## 11. TRANSACTION BOUNDARIES

* **Single Transactional Unit**: PostgreSQL supports full DDL transactional atomicity. All migration statements (Sections 0 through 6) are encapsulated inside a single `BEGIN; ... COMMIT;` transaction block.
* **No Non-Transactional DDL**: The migration avoids `CREATE INDEX CONCURRENTLY` (standard `CREATE INDEX IF NOT EXISTS` is utilized within the transaction).
* **Transactional Atomicity of Uncommitted Migration**: PostgreSQL transactional DDL ensures that all uncommitted migration changes are encapsulated within the active transaction. If execution fails before COMMIT, PostgreSQL transaction rollback removes the uncommitted schema changes made within that transaction. Post-commit recovery is governed separately by forward-fix migrations or approved PITR procedures. Transaction rollback does not constitute a universal rollback mechanism for committed or post-data operational states.

---

## 12. LOCK ANALYSIS

Modifying existing shared tables while creating new domain objects involves distinct PostgreSQL lock levels:

| DDL Operation | Target Table | Lock Mode | Expected Hold | Risk Evaluation & Mitigation |
| :--- | :--- | :--- | :---: | :--- |
| `ALTER TABLE users ADD COLUMN` | `public.users` | `ACCESS EXCLUSIVE` | EXPECTED: < 10ms (env-dependent) | Metadata-only lock. Fails fast via `lock_timeout = '5s'`. |
| `ALTER TABLE users ADD CONSTRAINT` | `public.users` | `SHARE ROW EXCLUSIVE` | EXPECTED: < 50ms (env-dependent) | Instant validation of NULL self-referential FK. |
| `ALTER TABLE santri ADD COLUMN` | `public.santri` | `ACCESS EXCLUSIVE` | EXPECTED: < 10ms (env-dependent) | Metadata-only lock. |
| `ALTER TABLE santri ADD CONSTRAINT` | `public.santri` | `SHARE ROW EXCLUSIVE` | EXPECTED: < 100ms (env-dependent) | Verifies existing rows for `uq_santri_tenant_id`. |
| `CREATE INDEX idx_...` | `public.users` / `santri` | `SHARE` | EXPECTED: < 200ms (env-dependent) | Blocks concurrent writes (`INSERT/UPDATE/DELETE`) during index build. |
| `CREATE TABLE` (18 new tables) | New Tables | `ACCESS EXCLUSIVE` | EXPECTED: Instant (env-dependent) | No concurrent traffic exists on non-existent tables; 0 user impact. |

**Lock Duration Variance**: All lock duration values are environment-dependent engineering estimates rather than guaranteed runtimes. Actual lock acquisition and hold duration depend upon table size, existing data volume, concurrent active sessions, blocking transactions, PostgreSQL engine version, database I/O load, and catalog state. The locked execution parameter `SET lock_timeout = '5000'` ensures an immediate, fail-fast abort if locks cannot be acquired within 5 seconds, preventing cascading connection pool exhaustion.

---

## 13. DOWNTIME ANALYSIS

### 13.1 Governance Posture
> **ZERO-DOWNTIME TARGET — CONTROLLED OFF-PEAK MAINTENANCE WINDOW RECOMMENDED**

1. **Reality of PostgreSQL Locks**: Although lock durations on metadata alterations are sub-second (< 100ms), an unmanaged `ACCESS EXCLUSIVE` lock can block concurrent HTTP requests in a high-traffic environment, creating a lock queue pileup.
2. **Maintenance Window Protocol**:
   * Migration MUST be executed during an approved low-traffic maintenance window (e.g. 01:00–03:00 WIB).
   * Session timeouts MUST be configured prior to opening the transaction:
     ```sql
     SET statement_timeout = '30000'; -- 30s max
     SET lock_timeout = '5000';       -- 5s max lock wait
     SET idle_in_transaction_session_timeout = '60000';
     ```
   * If any table lock cannot be acquired within 5 seconds, the session aborts cleanly without blocking operational web traffic.

---

## 14. BACKUP & PITR REQUIREMENTS

### 14.1 Governance Posture
> **ZERO DATA LOSS TARGET UNDER APPROVED MIGRATION PROCEDURE**

Prior to execution against any staging or production environment:
1. **Logical Snapshot**: Full backup dump taken within 30 minutes of migration execution:
   ```bash
   pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -Fc -f pre_psb_alumni_migration_$(date +%Y%m%d_%H%M%S).dump
   ```
2. **Point-In-Time Recovery (PITR) LSN Baseline**: Continuous WAL archiving must be active. Record the pre-migration Log Sequence Number and timestamp:
   ```sql
   SELECT pg_current_wal_lsn(), now();
   ```
3. **Restoration Verification**: Verify backup dump readability (`pg_restore --list`) before initiating DDL.
4. **Recovery Objectives**:
   * **RTO Target**: < 15 minutes, subject to validated restoration procedures, infrastructure readiness, and operational conditions.
   * **RPO Target**: Defined by the approved backup/PITR and disaster-recovery policy under the 'ZERO DATA LOSS TARGET UNDER APPROVED MIGRATION PROCEDURE' governance posture. Transaction rollback protects uncommitted migration changes, but does not by itself define the database-wide RPO.

---

## 15. ROLLBACK STRATEGY

Rollback procedures are strictly separated into pre-data and post-data operational scenarios:

### 15.1 Condition A: Pre-Data / Transaction Failure Rollback
If the migration fails during execution:
* **Mechanism**: Automatic transaction abort (`ROLLBACK`).
* **Operator Action**: Zero manual cleanup required. PostgreSQL automatically discards uncommitted catalog modifications.

### 15.2 Condition B: Post-Commit / Pre-Operational Rollback
If migration commits, but pre-launch sanity checks fail before business transactions are written:
* **Mechanism**: Clean, deterministic additive schema reversal executed in reverse topological order:
  ```sql
  BEGIN;
  DROP TABLE IF EXISTS public.alumni_donations RESTRICT;
  DROP TABLE IF EXISTS public.salam_interactions RESTRICT;
  DROP TABLE IF EXISTS public.user_discovery_locations RESTRICT;
  DROP TABLE IF EXISTS public.alumni_profiles RESTRICT;
  DROP TABLE IF EXISTS public.tenant_korwil_settings RESTRICT;
  DROP TABLE IF EXISTS public.alumni_korwils RESTRICT;
  DROP TABLE IF EXISTS public.alumni_academic_snapshots RESTRICT;
  DROP TABLE IF EXISTS public.alumni_exit_reasons RESTRICT;
  DROP TABLE IF EXISTS public.psb_placement_distributions RESTRICT;
  DROP TABLE IF EXISTS public.psb_acceptance_ledgers RESTRICT;
  DROP TABLE IF EXISTS public.psb_infaq_verifications RESTRICT;
  DROP TABLE IF EXISTS public.psb_test_scores RESTRICT;
  DROP TABLE IF EXISTS public.psb_applicants RESTRICT;
  DROP TABLE IF EXISTS public.psb_committees RESTRICT;
  DROP TABLE IF EXISTS public.psb_waves RESTRICT;
  DROP TABLE IF EXISTS public.psb_periods RESTRICT;
  DROP TABLE IF EXISTS public.identity_consolidation_ledgers RESTRICT;
  DROP TABLE IF EXISTS public.user_tenant_personas RESTRICT;
  
  DROP TRIGGER IF EXISTS trg_sync_santri_kelas_from_rombel ON public.psb_placement_distributions;
  DROP FUNCTION IF EXISTS public.fn_sync_santri_kelas_from_rombel();
  DROP TRIGGER IF EXISTS trg_enforce_placement_hierarchy ON public.psb_placement_distributions;
  DROP FUNCTION IF EXISTS public.fn_enforce_placement_hierarchy();
  
  DROP INDEX IF EXISTS public.uq_santri_tenant_active_user;
  DROP INDEX IF EXISTS public.idx_santri_tenant_user_id;
  ALTER TABLE public.santri DROP CONSTRAINT IF EXISTS uq_santri_tenant_id;
  ALTER TABLE public.santri DROP CONSTRAINT IF EXISTS fk_santri_user_id;
  ALTER TABLE public.santri DROP COLUMN IF EXISTS user_id;
  
  DROP INDEX IF EXISTS public.idx_users_merged_into;
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_users_merged_not_self;
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS fk_users_merged_into;
  ALTER TABLE public.users DROP COLUMN IF EXISTS merged_into_user_id;
  COMMIT;
  ```

### 15.3 Condition C: Post-Data Production Rollback
**CRITICAL GOVERNANCE DIRECTIVE**:
> **DO NOT USE `DROP CASCADE` AS AN AUTOMATIC ROLLBACK METHOD ONCE PRODUCTION DATA EXISTS.**

Once production data (applicants, scores, alumni profiles) has been inserted:
1. Executing `DROP CASCADE` would destroy legally binding academic and financial records.
2. The operator must perform:
   * **Forward-Fix Migration**: Deploying targeted, additive migrations to rectify schema bugs without data loss.
   * **PITR Disaster Recovery**: If catastrophic corruption occurs, restore to the pre-migration LSN under approved CAB protocol.

---

## 16. RLS ACTIVATION PLAN

### 16.1 Defense-in-Depth RLS Architecture
All 18 domain tables require 100% RLS enforcement:
* `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`
* `ALTER TABLE <table_name> FORCE ROW LEVEL SECURITY;` (ensures table owners and privileged roles do not bypass tenant isolation in multi-tenant contexts).

### 16.2 Architectural Separation of Authorization Concerns
* **RLS**: Enforces structural tenant isolation (`tenant_id`) and row ownership (`user_id = auth.uid()::text`).
* **Business Authorization & RBAC**: Evaluated in application services based on user roles and permissions.
* **Subscription Entitlement**: Evaluated at the application/API gateway layer (`alumni.portal`), not embedded into database row filters.
* **Server-Only Outbox Table**: `identity_consolidation_ledgers` enforces `FOR ALL USING (false) WITH CHECK (false)`. Direct PostgREST access is permanently sealed; privileged saga workers operate via `SECURITY DEFINER` service functions.

### 16.3 Declarative Structural RLS Policy Matrix (20 Policies Across 18 Tables)

| # | Policy Name | Target Table | Cmd | Role | USING Expression | WITH CHECK Expression | Security Purpose |
| :-: | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| 1 | `utp_tenant_isolation` | `user_tenant_personas` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for user personas |
| 2 | `icl_server_only` | `identity_consolidation_ledgers` | ALL | PUBLIC | `false` | `false` | Sealed outbox; denies PostgREST client direct access; backend uses service role |
| 3 | `psb_periods_isolation` | `psb_periods` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for PSB periods |
| 4 | `psb_waves_isolation` | `psb_waves` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for PSB registration waves |
| 5 | `psb_committees_isolation` | `psb_committees` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for committee members |
| 6 | `psb_applicants_isolation` | `psb_applicants` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for student applications |
| 7 | `psb_test_scores_isolation` | `psb_test_scores` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for applicant test scores |
| 8 | `psb_infaq_isolation` | `psb_infaq_verifications` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for infaq/financial verification |
| 9 | `psb_acceptance_isolation` | `psb_acceptance_ledgers` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for final SAT acceptance decisions |
| 10 | `psb_placement_isolation` | `psb_placement_distributions` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for academic unit placements |
| 11 | `alumni_exit_reasons_isolation` | `alumni_exit_reasons` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for student exit reference data |
| 12 | `alumni_snapshots_isolation` | `alumni_academic_snapshots` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for historical graduation snapshots |
| 13 | `alumni_korwils_isolation` | `alumni_korwils` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for regional alumni chapters |
| 14 | `tenant_korwil_settings_isolation` | `tenant_korwil_settings` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for korwil configuration |
| 15 | `alumni_profiles_read` | `alumni_profiles` | SELECT | PUBLIC | `is_super_admin OR (tenant_match AND ((is_public AND !hide_profile) OR user_id = auth.uid()))` | N/A | Public discovery within tenant or personal profile read |
| 16 | `alumni_profiles_write` | `alumni_profiles` | ALL | PUBLIC | `is_super_admin OR (tenant_match AND user_id = auth.uid())` | Same as USING | Strict self-ownership write boundary |
| 17 | `discovery_locations_read` | `user_discovery_locations` | SELECT | PUBLIC | `is_super_admin OR (tenant_match AND expires_at > now())` | N/A | Ephemeral opt-in geospatial discovery |
| 18 | `discovery_locations_write` | `user_discovery_locations` | ALL | PUBLIC | `is_super_admin OR (tenant_match AND user_id = auth.uid())` | Same as USING | Self-ownership write on user discovery check-ins |
| 19 | `salam_interactions_participant` | `salam_interactions` | ALL | PUBLIC | `is_super_admin OR (tenant_match AND (sender = auth.uid() OR recipient = auth.uid()))` | `is_super_admin OR (tenant_match AND sender = auth.uid())` | Participant read access; sender-only write creation |
| 20 | `alumni_donations_isolation` | `alumni_donations` | ALL | PUBLIC | `is_super_admin OR tenant_id = app.tenant OR tenant_id = jwt.tenant` | Same as USING | Tenant isolation for alumni donations ledger |

---

## 17. TRIGGER ACTIVATION PLAN

The schema activates two deterministic procedural triggers on `public.psb_placement_distributions`:

1. **Trigger 1: `trg_enforce_placement_hierarchy`**
   * **Function**: `public.fn_enforce_placement_hierarchy()`
   * **Execution**: `BEFORE INSERT OR UPDATE`
   * **Purpose**: Validates that `(tenant_id, madrasah_id, academic_year_id, jenjang_id, tingkat_id, rombel_id)` forms a strictly valid, unified academic hierarchy. Rejects mismatched cross-tenant or cross-madrasah placements fail-closed.

2. **Trigger 2: `trg_sync_santri_kelas_from_rombel`**
   * **Function**: `public.fn_sync_santri_kelas_from_rombel()`
   * **Execution**: `AFTER INSERT OR UPDATE`
   * **Purpose**: Synchronizes `santri.kelas = rombel.name` when a placement distribution reaches `status = 'CONFIRMED'`.

---

## 18. PSB SAFETY REVIEW

The execution plan guarantees all core domain decisions:
* **Tenant-Owned Ecosystem**: Exactly one PSB configuration per tenant covering all Madrasahs.
* **No Direct Madrasah Selection by Wali**: Parents register to the Pesantren; Madrasah selection is not exposed during initial application.
* **Centralized Distribution**: Centralized panitia distributes applicants across Madrasahs based on capacity and assessment.
* **SAT Final Acceptance Authority**: Selection committee holds exclusive final authority for acceptance ledgers.
* **NIS Generation Boundary**: Student identification numbers (`santri.nis`) are generated only upon formal acceptance confirmation.
* **Period Consistency**: Applicant period strictly matches placement period via relational constraints and trigger checks.

---

## 19. ALUMNI SAFETY REVIEW

The execution plan strictly preserves the three-tier boundary:
$$\text{ALUMNI PERSONA} \ne \text{ALUMNI MODULE} \ne \text{ALUMNI SUBSCRIPTION}$$

* **Target Entitlement**: `alumni.portal`.
* **Behavior When Subscription Inactive**:
  * Application navigation is hidden; API routes return `403 Forbidden`.
  * Interactive background jobs are suspended.
  * **Zero Database Deletion**: No alumni records, profiles, or academic snapshots are deleted or altered.
  * **Persona Preservation**: `user_tenant_personas` rows (`persona_type = 'ALUMNI'`) remain archived and intact.
  * Module reactivation instantly restores historical data without manual recovery.

---

## 20. IDENTITY CONSOLIDATION SAFETY REVIEW

Enforces the hardened **TIR-009 DB-Atomic + Externally Reconciled Saga Pattern**:
* **No Automatic Merging**: Identity consolidation requires explicit multi-factor verification.
* **Physical Row Preservation**: Merged student records retain their physical `users` row with `status = 'MERGED'` and `merged_into_user_id = target_wali_uid`, maintaining relational integrity across historical academic tables.
* **Authentication Barred**: Merged accounts are barred from authenticating.
* **Self-Consolidation Guard**: CHECK constraint `chk_icl_distinct_users` (`source_student_uid <> target_wali_uid`) prevents circular self-merges.

---

## 21. MULTI-MADRASAH SAFETY REVIEW

The schema preserves the multi-unit hierarchy:
$$\text{Tenant} \to \text{Madrasah} \to \text{Academic Year} \to \text{Jenjang} \to \text{Tingkat} \to \text{Rombel}$$

* **Multi-Madrasah Placements**: A single Santri can legitimately hold distinct concurrent placements across multiple Madrasahs under the same Academic Year.
* **No Global Hierarchy Drift**: Tingkat and Rombel remain strictly bound to their parent Madrasah and Jenjang.

---

## 22. LEGACY PROJECTION REVIEW (`santri.kelas`)

* **Architectural Status**: `santri.kelas` is a **Last-Write-Wins legacy denormalized projection**.
* **Operational Rule**: `santri.kelas` is maintained solely for backward compatibility with legacy single-unit UI components.
* **Authoritative Source**: All enterprise multi-unit reporting and placements must read from `psb_placement_distributions` and `alumni_academic_snapshots`, never treating `santri.kelas` as the multi-Madrasah source of truth.

---

## 23. POST-MIGRATION VALIDATION

Immediately following DDL execution and before opening traffic:
1. **Re-Execute Section 0 Preflight**: Execute preflight verification block. Must return:
   `NOTICE: PHASE 1 PRECONDITION ASSERTIONS PASSED: Target environment structure verified.`
2. **Mechanical Object Count Query**:
   ```sql
   SELECT 
       (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (
           'user_tenant_personas', 'identity_consolidation_ledgers', 'psb_periods', 'psb_waves',
           'psb_committees', 'psb_applicants', 'psb_test_scores', 'psb_infaq_verifications',
           'psb_acceptance_ledgers', 'psb_placement_distributions', 'alumni_exit_reasons',
           'alumni_academic_snapshots', 'alumni_korwils', 'tenant_korwil_settings',
           'alumni_profiles', 'user_discovery_locations', 'salam_interactions', 'alumni_donations'
       )) AS table_count,
       (SELECT count(*) FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid WHERE c.relname IN (
           'user_tenant_personas', 'identity_consolidation_ledgers', 'psb_periods', 'psb_waves',
           'psb_committees', 'psb_applicants', 'psb_test_scores', 'psb_infaq_verifications',
           'psb_acceptance_ledgers', 'psb_placement_distributions', 'alumni_exit_reasons',
           'alumni_academic_snapshots', 'alumni_korwils', 'tenant_korwil_settings',
           'alumni_profiles', 'user_discovery_locations', 'salam_interactions', 'alumni_donations'
       ) AND con.contype = 'c') AS chk_count,
       (SELECT count(*) FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid WHERE c.relname IN (
           'user_tenant_personas', 'identity_consolidation_ledgers', 'psb_periods', 'psb_waves',
           'psb_committees', 'psb_applicants', 'psb_test_scores', 'psb_infaq_verifications',
           'psb_acceptance_ledgers', 'psb_placement_distributions', 'alumni_exit_reasons',
           'alumni_academic_snapshots', 'alumni_korwils', 'tenant_korwil_settings',
           'alumni_profiles', 'user_discovery_locations', 'salam_interactions', 'alumni_donations'
       ) AND con.contype = 'f') AS fk_count,
       (SELECT count(*) FROM pg_constraint con JOIN pg_class c ON c.oid = con.conrelid WHERE c.relname IN (
           'user_tenant_personas', 'identity_consolidation_ledgers', 'psb_periods', 'psb_waves',
           'psb_committees', 'psb_applicants', 'psb_test_scores', 'psb_infaq_verifications',
           'psb_acceptance_ledgers', 'psb_placement_distributions', 'alumni_exit_reasons',
           'alumni_academic_snapshots', 'alumni_korwils', 'tenant_korwil_settings',
           'alumni_profiles', 'user_discovery_locations', 'salam_interactions', 'alumni_donations'
       ) AND con.contype = 'u') AS uq_count;
   ```
   **Expected Result**: `table_count = 18`, `chk_count = 23`, `fk_count = 46`, `uq_count = 31`.
3. **RLS Verification**: Confirm all 18 tables exhibit `rowsecurity = true` in `pg_class`.

---

## 24. FAILURE SCENARIOS & MITIGATION RUNBOOK

| Failure Scenario | Detection Mechanism | Immediate Action | Recovery Procedure |
| :--- | :--- | :--- | :--- |
| **Prerequisite Missing** | Section 0.1 / 0.2 raises `PRECONDITION_FAILED` | Transaction auto-aborts | Execute prerequisite baseline migration first. |
| **Lock Wait Timeout** | `57014: statement_timeout` or lock timeout | Script aborts cleanly | Re-schedule to off-peak window; inspect blocking sessions using `pg_stat_activity`. |
| **Schema Drift Detected** | Section 0.5 raises `SCHEMA_DRIFT_DETECTED` | Transaction auto-aborts | Inspect drifted object in target catalog; reconcile with manifest contract. |
| **Syntax / Constraint Error** | PostgreSQL syntax/constraint error | Transaction auto-aborts | Zero partial state persists. Re-verify DDL file hash against version lock. |
| **App Authentication Error** | Smoke test fails post-migration | Assess impact | If code incompatible with `merged_into_user_id`, execute Phase B Rollback. |

---

## 25. OPERATOR PRE-EXECUTION CHECKLIST

Before any operator executes the migration script, every box must be checked:

```text
[ ] 1.  Target database environment verified (Staging confirmed before Production).
[ ] 2.  Direct database connection parameters verified (operator identity logged).
[ ] 3.  Authoritative DDL hash verified against Section 5 Version Lock.
[ ] 4.  Pre-migration physical snapshot / pg_dump completed and verified restorable.
[ ] 5.  PITR WAL archiving confirmed active; pre-migration LSN recorded.
[ ] 6.  Maintenance window officially approved (off-peak schedule confirmed).
[ ] 7.  Section 0 preflight dry-run executed against staging sandbox.
[ ] 8.  Lock timeout parameters configured (`lock_timeout = '5s'`).
[ ] 9.  Topological execution sequence reviewed.
[ ] 10. RLS activation plan and policy definitions verified.
[ ] 11. Trigger activation and legacy projection sync verified.
[ ] 12. Rollback scripts (Phase B) staged and accessible.
[ ] 13. Post-migration validation scripts prepared.
[ ] 14. Monitoring dashboards (PostgreSQL CPU, connections, locks) active.
[ ] 15. Lead Systems Architect & Release Safety Controller signed off.
[ ] 16. EXPLICIT EXECUTION AUTHORIZATION GRANTED BY PRODUCT OWNER.
```

---

## 26. EXPLICIT EXECUTION AUTHORIZATION BOUNDARY

```text
══════════════════════════════════════════════════════════════════════════════════
                     STOP — STRICT GOVERNANCE GATE
══════════════════════════════════════════════════════════════════════════════════
Gate 9 completes all architecture, sequencing, dependency, lock, rollback,
and safety reviews.

THIS DOCUMENT DOES NOT CONSTITUTE AUTHORIZATION TO EXECUTE DDL.

Execution requires a formal, recorded release authorization from the
Lead Architect and Product Owner under authorized change control.
══════════════════════════════════════════════════════════════════════════════════
```

---

## 27. GATE 9 VERDICT

All prerequisite engineering artifacts, topological dependencies, preflight assertions, failure scenarios, and rollback strategies are complete, hardened, and verified.

```text
GATE 9 VERDICT:
READY FOR EXECUTION AUTHORIZATION
```

---

## GOVERNANCE OUTPUT

```text
GATE 8B:
PASS

GATE 9:
READY FOR EXECUTION AUTHORIZATION

DDL EXECUTION:
NOT PERFORMED

MIGRATION EXECUTION:
NOT PERFORMED

DATABASE:
UNTOUCHED

DATA:
UNTOUCHED

APPLICATION CODE:
UNCHANGED

DRIZZLE:
UNCHANGED

GIT:
UNCHANGED

EXECUTION AUTHORIZATION:
NOT GRANTED BY THIS GATE
```
