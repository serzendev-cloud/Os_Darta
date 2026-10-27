# EEOS GATE 9 — MIGRATION EXECUTION LOG
## WORK PACKAGE: WP-PSB-ALUMNI-SCHEMA-001
### PSB & ALUMNI ECOSYSTEM DATABASE MIGRATION

```text
══════════════════════════════════════════════════════════════════════════════════
WORK PACKAGE        : WP-PSB-ALUMNI-SCHEMA-001
DOCUMENT            : docs/architecture/WP-PSB-ALUMNI-MIGRATION-EXECUTION-LOG-001.md
GATE                : GATE 9 — EXPLICIT DDL EXECUTION
EXECUTION STATUS    : ABORTED (AUTOMATIC TRANSACTION ROLLBACK PERFORMED)
AUTHORIZATION REF   : Product Owner Explicit Execution Authorization
OPERATOR            : EEOS Principal PostgreSQL Architect & Release Safety Controller
══════════════════════════════════════════════════════════════════════════════════
```

---

## 1. EXECUTION METADATA & ENVIRONMENT IDENTIFICATION

* **Execution Authorization Timestamp**: `2026-09-19T01:07:07Z` (`2026-09-19T08:07:07+07:00`)
* **Execution Start Time**: `2026-09-19T01:11:31.027Z` (`2026-09-19T08:11:31+07:00`)
* **Execution Failure / Abort Time**: `2026-09-19T01:11:32.482Z` (`2026-09-19T08:11:32+07:00`)
* **Operator**: EEOS Principal PostgreSQL Architect & Release Safety Controller
* **Target Environment**: Supabase Managed Cloud PostgreSQL
* **Database Host**: `aws-0-ap-southeast-1.pooler.supabase.com:5432` (Session Direct Pooler)
* **Database Name**: `postgres`
* **PostgreSQL Engine Version**: `PostgreSQL 17.6 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 15.2.0, 64-bit`
* **Connected User**: `postgres.vyinupvzqzfrveuxculh`
* **Is In Recovery (Replica)**: `false` (Direct Write Master)

---

## 2. ARTIFACT HASH VERIFICATION (GATE 1)

All three execution candidate artifacts were hashed byte-for-byte using SHA-256 prior to opening the database session:

| Artifact Path | Expected SHA-256 | Actual SHA-256 | Status |
| :--- | :--- | :--- | :---: |
| `docs/architecture/WP-PSB-ALUMNI-DDL-DRAFT-001.sql` | `cf41e81d9828bb55f3b7840bdbcbde5e5aebdc6cbac271ec034ae71a1e521f45` | `cf41e81d9828bb55f3b7840bdbcbde5e5aebdc6cbac271ec034ae71a1e521f45` | **MATCH (PASS)** |
| `scratch/section0_c8.sql` | `e403e69c8349d811c896d8fd7c6e94bf196915b704628662dbbbc5c193e1cead` | `e403e69c8349d811c896d8fd7c6e94bf196915b704628662dbbbc5c193e1cead` | **MATCH (PASS)** |
| `scratch/manifest_c8.json` | `5eec6b0c49c9066388ba027afbb3342f559d5a066475d2a215014f16d328081c` | `5eec6b0c49c9066388ba027afbb3342f559d5a066475d2a215014f16d328081c` | **MATCH (PASS)** |

**Gate 1 Verdict**: **PASS**. Zero code or SQL modifications occurred.

---

## 3. BACKUP & RECOVERY VERIFICATION (GATE 2)

Prior to DDL execution, an authoritative logical snapshot of all 38 existing public tables was taken and verified:

* **Backup Artifact Location**: `scratch/pre_migration_backup_2026-09-19T01-10-03.json`
* **Backup SHA-256**: `03c1e0aa573cde644fbeac2468fda1061b78c28785f366ff29e694328abc96d1`
* **Backup Size**: 114,974 bytes
* **Pre-Migration WAL LSN**: `0/CD0006C0`
* **Pre-Migration DB Timestamp**: `2026-09-19T01:10:03.003Z`
* **Readability Audit**: Verified (JSON structure parsed; 38/38 tables accounted for).
* **Gate 2 Verdict**: **PASS**.

---

## 4. SESSION TIMEOUT CONFIGURATION

The session was configured with locked fail-fast parameters inside the transaction:
```sql
SET statement_timeout = '30000'; -- 30s
SET lock_timeout = '5000';       -- 5s
SET idle_in_transaction_session_timeout = '60000'; -- 60s
```

---

## 5. PREFLIGHT EXECUTION RESULT

Section 0 Preflight was evaluated against the live database:
```text
NOTICE: PHASE 1 PRECONDITION ASSERTIONS PASSED: Target environment structure verified. Proceeding with idempotent schema migration.
```
* Target domain tables: 18 / 18 absent (`State A: CREATE`).
* Baseline prerequisite tables: `tenants`, `users`, `santri`, `academic_years`, `madrasah`, `jenjang`, `tingkat`, `rombel` all confirmed present with single-column primary keys.

---

## 6. TRANSACTION TIMELINE & FAILURE EVENT

```text
[2026-09-19T01:11:31.027Z] BEGIN TRANSACTION
[2026-09-19T01:11:31.050Z] SET statement_timeout = '30000', lock_timeout = '5000'
[2026-09-19T01:11:31.080Z] Section 0 Preflight: PASSED
[2026-09-19T01:11:31.600Z] Section 1.1: ALTER TABLE public.users ADD COLUMN IF NOT EXISTS merged_into_user_id uuid -> OK
[2026-09-19T01:11:31.820Z] Section 1.2: ALTER TABLE public.santri ADD COLUMN IF NOT EXISTS user_id uuid -> OK
[2026-09-19T01:11:32.482Z] Section 1.2: ALTER TABLE public.santri ADD CONSTRAINT uq_santri_tenant_id UNIQUE (tenant_id, id) -> ERROR:
                           "column 'tenant_id' named in key does not exist"
[2026-09-19T01:11:32.485Z] AUTOMATIC POSTGRESQL TRANSACTION ROLLBACK TRIGGERED
[2026-09-19T01:11:32.490Z] COMMIT: NOT PERFORMED (BLOCKED)
```

---

## 7. ROOT CAUSE FORENSIC ANALYSIS

* **Failure Classification**: `CONSTRAINT_FAILURE` / `SCHEMA_DRIFT`.
* **Root Cause**:
  In the candidate DDL script (`WP-PSB-ALUMNI-DDL-DRAFT-001.sql` lines 3097–3107):
  ```sql
  ALTER TABLE public.santri
      ADD CONSTRAINT uq_santri_tenant_id UNIQUE (tenant_id, id);
  ```
  This statement assumes that `public.santri` already possesses a `tenant_id` column.
  Direct column inspection on the live database reveals:
  ```json
  [
    "id", "nis", "name", "asrama", "kamar", "asrama_id", "kamar_id", "kelas",
    "status", "gender", "photo_url", "wali_id", "wali_name", "wali_phone",
    "join_date", "asal_kota", "asal_provinsi", "angkatan_masuk",
    "total_poin_pelanggaran", "total_prestasi", "status_karakter", "status_sp",
    "created_at", "updated_at"
  ]
  ```
  The legacy `public.santri` table in this database environment does **NOT** have a `tenant_id` column.
* **Why Section 0 Did Not Pre-Catch This**:
  Section 0.1 verified the existence of `public.santri` and its primary key on `(id)`, and verified `user_id` conditional nullability, but did not assert `column_name = 'tenant_id'` in its prerequisite baseline contract.
* **Governance Principle Enforced**:
  Per Prompt Rule 34 ("Do not modify the locked migration, do not manually repair drift, do not rerun partial fragments"), the engine strictly **aborted the migration** and allowed PostgreSQL to execute full transactional rollback.

---

## 8. POST-ROLLBACK DATABASE VERIFICATION

Immediately following the rollback, independent read-only queries were executed against the database:

| Object / Column Checked | Expected Post-Rollback State | Actual Database State | Verification |
| :--- | :--- | :--- | :---: |
| `public.users.merged_into_user_id` | Does NOT exist | `false` | **PASS (Clean Rollback)** |
| `public.santri.user_id` | Does NOT exist | `false` | **PASS (Clean Rollback)** |
| `public.santri.uq_santri_tenant_id` | Does NOT exist | `false` | **PASS (Clean Rollback)** |
| `public.psb_periods` (domain table) | Does NOT exist | `false` | **PASS (Clean Rollback)** |
| `public.tenants` (row count) | Unmodified (12 rows) | 12 rows | **PASS (Clean Rollback)** |
| `public.academic_years` (row count) | Unmodified (10 rows) | 10 rows | **PASS (Clean Rollback)** |
| `public.users` (row count) | Unmodified (41 rows) | 41 rows | **PASS (Clean Rollback)** |
| `public.santri` (row count) | Unmodified (12 rows) | 12 rows | **PASS (Clean Rollback)** |

**Conclusion**: The database is 100% clean, uncorrupted, and identical to its pre-migration baseline.

---

## 9. FINAL EXECUTION STATUS

```text
STATUS:
MIGRATION ABORTED — NO COMMIT
```
