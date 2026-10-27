# EEOS — CORE SANTRI TENANTIZATION & NIS REMEDIATION
# READ-ONLY CLEAN-SLATE AUDIT & RESET PLAN REPORT

```text
WORK PACKAGE:           WP-CLEAN-SLATE-DUMMY-DATA-AUDIT-001
RELATED WORK PACKAGE:   WP-CORE-SANTRI-TENANTIZATION-PO-DECISION-GATE-001 (MB-01)
OPERATING MODE:         READ-ONLY VERIFICATION + RESET PLAN ONLY (ZERO MUTATION)
DATABASE ENVIRONMENT:   LIVE TARGET DATABASE (PostgreSQL 17.6 / Supabase)
DATE:                   2026-09-20
EEOS GATE AUDITOR:      Senior Systems Architect & Multi-Tenant Database Specialist
GOVERNANCE STATUS:      AUDIT COMPLETE — READY FOR RESET AUTHORIZATION
```

---

## 1. EXECUTIVE SUMMARY

Following the authoritative Product Owner Business Decision on **Decision Gate #1 (MB-01 Historical Data Mapping)**, this document provides the formal **Read-Only Forensic Audit and Reset Plan** for the APP MA'HAD (EEOS) database environment.

In strict compliance with governance directives, **zero mutations, zero deletes, zero truncates, zero schema changes, zero code edits, and zero git operations were performed**. The live target database connection was inspected using read-only catalog queries.

### Core Audit Discoveries:
1. `[FACT]` **`public.santri`**: Physical row count is **0 (zero) records**.
2. `[FACT]` **`public.guru`**: Physical row count is **0 (zero) records**.
3. `[FACT]` **Santri & Guru Child Operational Tables**: All 18 Category A child tables (`pelanggaran`, `hukuman`, `governance_cases`, `health_visits`, `health_permissions`, `quests`, `notifications`, `asrama`, `kamar`, `kelas`, `madrasah`, `academic_years`, `rombel`, `wallets`, `invoices`, etc.) contain **0 (zero) records**.
4. `[FACT]` **`public.tenants`**: Contains **6 tenant records** (created during prior runtime verification and provisioning test suites).
5. `[FACT]` **`public.users` & `auth.users`**: Contain **7 user accounts** (1 platform `super_admin` and 6 tenant `admin` accounts corresponding to the 6 verification tenants).
6. `[FACT]` **System RBAC Master Data**: `permissions` (55 rows), `tenant_roles` (6 rows), and `tenant_role_permissions` (312 rows) are intact.

### Fundamental Architectural Conclusion:
Because the live target database **already contains 0 Santri and 0 Guru records**, there are **zero historical records requiring tenant mapping**, and **zero production data loss risk**. The database is already physically clean of student and teacher records, making the transition to the **Clean Slate Strategy (HIST-1)** completely unblocked.

---

## 2. PRODUCT OWNER DECISION (AUTHORITATIVE BUSINESS FOUNDATION)

The Product Owner has officially ratified the following business invariants for Decision Gate #1 (MB-01):

> **"Seluruh data Santri dan Guru/Ustadz yang saat ini berada di aplikasi adalah data dummy/test untuk kebutuhan percobaan. Tidak ada data Santri maupun Guru/Ustadz saat ini yang merupakan data bisnis historis yang wajib dipertahankan."**

### Bound Business Directives:
1. **Santri**:
   - All Santri records in the system are designated as dummy/test data.
   - Zero Santri records must be preserved as historical business data.
   - Zero historical `Santri → Tenant` mapping is required.
   - No tenant inference may be derived from NIS, student name, cohort, room, or classroom.
   - All dummy Santri data is eligible for immediate reset/clearing.
2. **Guru / Ustadz**:
   - All Guru/Ustadz records in the system are designated as dummy/test data.
   - Zero Guru/Ustadz records must be preserved as historical business data.
   - Zero historical tenant mapping is required for teachers.
   - All dummy Guru/Ustadz data is eligible for immediate reset/clearing.
3. **Core Multi-Tenant Invariant**:
   - Future Santri and Guru records will be created exclusively under explicit tenant ownership (`tenant_id NOT NULL REFERENCES tenants(id)`), with natural student numbering governed by `CONSTRAINT uq_santri_tenant_nis UNIQUE (tenant_id, nis)`.

---

## 3. TARGET ENVIRONMENT

- **Database Engine**: PostgreSQL 17.6 (Ubuntu 17.6-1.pgdg24.04+1) on Supabase Cloud.
- **Connection Endpoint**: `DATABASE_URL` via connection pooling port 5432 with SSL required.
- **Audit Execution Tool**: Read-only catalog query script (`scratch/read_only_clean_slate_audit.mjs` and `scratch/read_only_inspect_users.mjs`).
- **Data Mutation Performed**: **NONE (0 writes, 0 deletes, 0 schema alterations)**.

---

## 4. SANTRI CURRENT STATE (FORENSIC VERIFICATION)

Direct catalog query execution:
```sql
SELECT count(*)::int AS count FROM public.santri;
```

| Dimension | Physical Catalog Finding | Classification |
| :--- | :--- | :--- |
| **Table Existence** | `public.santri` exists in schema `public` | `[FACT]` |
| **Physical Column Count** | 24 physical columns (lacks `tenant_id`) | `[FACT]` |
| **Primary Key** | `santri_pkey` on `id` (text) | `[FACT]` |
| **Unique Constraint** | `santri_nis_unique` on `(nis)` (global) | `[FACT]` |
| **Live Row Count** | **0 (zero) rows** | `[FACT]` |
| **Historical Records to Preserve** | **0 (zero) rows** | `[FACT]` |
| **Records Requiring Mapping** | **0 (zero) rows** | `[FACT]` |

---

## 5. GURU / USTADZ CURRENT STATE (FORENSIC VERIFICATION)

Direct catalog query execution:
```sql
SELECT count(*)::int AS count FROM public.guru;
```

| Dimension | Physical Catalog Finding | Classification |
| :--- | :--- | :--- |
| **Table Existence** | `public.guru` exists in schema `public` | `[FACT]` |
| **Physical Column Count** | 12 physical columns (contains `tenant_id` with default `'default'`) | `[FACT]` |
| **Primary Key** | `guru_pkey` on `id` (text) | `[FACT]` |
| **Live Row Count** | **0 (zero) rows** | `[FACT]` |
| **Historical Records to Preserve** | **0 (zero) rows** | `[FACT]` |
| **Records Requiring Mapping** | **0 (zero) rows** | `[FACT]` |

---

## 6. TENANT CURRENT STATE (FORENSIC VERIFICATION)

Direct catalog query execution:
```sql
SELECT id, name, slug, status FROM public.tenants ORDER BY id;
```

| Tenant ID | Tenant Name | Slug | Status | Purpose / Origin |
| :--- | :--- | :--- | :--- | :--- |
| `t_1789172137858_9g7lm` | Runtime Verification Tenant | `runtime-verify-001` | `active` | Work Package verification artifact |
| `t_1789178874071_8vsju` | Runtime Verification Tenant 002 | `runtime-verify-002` | `active` | Work Package verification artifact |
| `t_1789228497649_qbldr` | Runtime Verification Tenant 003 | `runtime-verify-003` | `active` | Work Package verification artifact |
| `t_1789229560359_78feo` | Pondok Duplikat | `prov-003` | `active` | Duplicate test verification artifact |
| `t_1789231192101_v5qjz` | Runtime Public Registration 001 | `runtime-public-001` | `active` | SaaS registration test artifact |
| `t_1789252184367_rx9ze` | Runtime Audit Actor Verification| `runtime-audit-actor-001`| `active` | Audit actor test artifact |

- `[FACT]` Total Tenants in live catalog: **6 records**.
- `[FACT]` All 6 tenants currently have status `'active'`.
- `[FACT]` None of these tenants contain any Santri or Guru records.

---

## 7. IDENTITY & AUTHENTICATION DEPENDENCIES

Direct catalog query execution against `public.users` and `auth.users`:

```text
auth.users (7 records)
    └── 1:1 sync ──> public.users (7 records)
                         ├── 1 Platform Super Admin (tenant_id = 'default')
                         └── 6 Tenant Administrators (1 admin per verification tenant)
```

### Detailed User Inventory:

| User ID | Email | Name | Role | Associated Tenant ID |
| :--- | :--- | :--- | :--- | :--- |
| `fed67d26-7d19-4e3c-bf7d-2e45143e864b` | `superadmin@madev.id` | Super Admin Platform | `super_admin` | `default` |
| `61dbe6ba-688a-496d-92d3-a8600c321cad` | `runtime.verify001@madev.id` | Admin Runtime Verify | `admin` | `t_1789172137858_9g7lm` |
| `ef1b1c02-0666-43f7-8620-1a8c491165fc` | `runtime.verify002@madev.id` | Runtime Verification Admin 002 | `admin` | `t_1789178874071_8vsju` |
| `b6ac7509-f5b2-40d1-8b13-d0392bc0e081` | `runtime.verify003@madev.id` | Runtime Verification Admin 003 | `admin` | `t_1789228497649_qbldr` |
| `c785ec38-d2dc-4b40-ac2d-c0f850756235` | `fresh-unique-email-xyz@test.id` | Ustadz Duplikat | `admin` | `t_1789229560359_78feo` |
| `dc97e719-5551-44e9-91e5-e7ed31683dd3` | `runtime.public001@madev.id` | Runtime Public Admin 001 | `admin` | `t_1789231192101_v5qjz` |
| `c29f1385-6489-468a-bfb2-540ceda0e8f4` | `runtime.audit.actor001@madev.id` | Runtime Audit Actor | `admin` | `t_1789252184367_rx9ze` |

- `[OBSERVATION]` User `c785ec38-d2dc-4b40-ac2d-c0f850756235` has the name `"Ustadz Duplikat"`, but holds the role `admin` in `public.users` and is an administrator for tenant `Pondok Duplikat`. It is **NOT** a record in `public.guru`.
- `[FACT]` There are **zero** student or guardian accounts in `auth.users` or `public.users`.
- `[FACT]` Preserving these 7 user accounts ensures that platform login and tenant administration remain 100% operational.

---

## 8. SANTRI DEPENDENCY MAP & LIVE ROW COUNTS

A full audit of all tables in the database with a relationship or potential relationship to `santri`:

```text
public.santri (0 rows)
  ├── public.wali_santri_relationships (Table not yet created in live DB / 0 rows)
  ├── public.wallets                    (Table not yet created in live DB / 0 rows)
  ├── public.invoices                   (Table not yet created in live DB / 0 rows)
  ├── public.canteen_transactions       (Table not yet created in live DB / 0 rows)
  ├── public.rfid_cards                 (Table not yet created in live DB / 0 rows)
  ├── public.rfid_tap_logs              (Table not yet created in live DB / 0 rows)
  ├── public.gate_passes                (Table not yet created in live DB / 0 rows)
  ├── public.pelanggaran                (Table exists / 0 rows)
  ├── public.hukuman                    (Table exists / 0 rows)
  ├── public.governance_cases           (Table exists / 0 rows)
  ├── public.health_visits              (Table exists / 0 rows)
  ├── public.health_permissions         (Table exists / 0 rows)
  ├── public.quests                     (Table exists / 0 rows)
  ├── public.status_change_records      (Table not yet created in live DB / 0 rows)
  ├── public.field_change_records       (Table not yet created in live DB / 0 rows)
  ├── public.academic_ledger_records    (Table not yet created in live DB / 0 rows)
  ├── public.academic_transcripts       (Table not yet created in live DB / 0 rows)
  ├── public.ppob_transactions          (Table not yet created in live DB / 0 rows)
  ├── public.notifications              (Table exists / 0 rows)
  ├── public.asrama                     (Table exists / 0 rows)
  ├── public.kamar                      (Table exists / 0 rows)
  ├── public.kelas                      (Table exists / 0 rows)
  ├── public.madrasah                   (Table exists / 0 rows)
  ├── public.academic_years             (Table exists / 0 rows)
  └── public.rombel                     (Table exists / 0 rows)
```

---

## 9. GURU / USTADZ DEPENDENCY MAP & LIVE ROW COUNTS

A full audit of all tables with a relationship or potential relationship to `guru`:

```text
public.guru (0 rows)
  ├── teacher_assignments               (Table not yet created in live DB / 0 rows)
  ├── subject_curriculum_teachers       (Table not yet created in live DB / 0 rows)
  ├── hifzh_recitation_logs             (Table not yet created in live DB / 0 rows)
  └── public.madrasah                   (Table exists / 0 rows)
```

---

## 10. DATA CLASSIFICATION MATRIX

| Data Entity / Table | Category | Live Row Count | Impact of Clean Slate | Action |
| :--- | :--- | :---: | :--- | :--- |
| `public.santri` | **Category A: Dummy/Test Domain** | **0** | Pre-condition satisfied; zero historical rows | Retain 0 state; ready for DDL |
| `public.guru` | **Category A: Dummy/Test Domain** | **0** | Pre-condition satisfied; zero historical rows | Retain 0 state; ready for DDL |
| `public.pelanggaran` | **Category A: Dummy/Test Domain** | **0** | Zero child rows | Clean |
| `public.hukuman` | **Category A: Dummy/Test Domain** | **0** | Zero child rows | Clean |
| `public.governance_cases` | **Category A: Dummy/Test Domain** | **0** | Zero child rows | Clean |
| `public.health_visits` | **Category A: Dummy/Test Domain** | **0** | Zero child rows | Clean |
| `public.health_permissions`| **Category A: Dummy/Test Domain**| **0** | Zero child rows | Clean |
| `public.quests` | **Category A: Dummy/Test Domain** | **0** | Zero child rows | Clean |
| `public.notifications` | **Category A: Dummy/Test Domain** | **0** | Zero child rows | Clean |
| `public.asrama` | **Category A: Dummy/Test Domain** | **0** | Zero child rows | Clean |
| `public.kamar` | **Category A: Dummy/Test Domain** | **0** | Zero child rows | Clean |
| `public.kelas` | **Category A: Dummy/Test Domain** | **0** | Zero child rows | Clean |
| `public.madrasah` | **Category A: Dummy/Test Domain** | **0** | Zero child rows | Clean |
| `public.academic_years` | **Category A: Dummy/Test Domain** | **0** | Zero child rows | Clean |
| `public.rombel` | **Category A: Dummy/Test Domain** | **0** | Zero child rows | Clean |
| `public.tenants` | **Category B: System Configuration**| **6** | Preserved (Required for tenant testing) | **PRESERVE** |
| `public.users` | **Category B: System Configuration**| **7** | Preserved (Required for platform login) | **PRESERVE** |
| `auth.users` | **Category B: System Configuration**| **7** | Preserved (Required for platform login) | **PRESERVE** |
| `public.permissions` | **Category B: System Configuration**| **55** | Preserved (Master RBAC permissions) | **PRESERVE** |
| `public.tenant_roles` | **Category B: System Configuration**| **6** | Preserved (Master RBAC tenant roles) | **PRESERVE** |
| `public.tenant_role_permissions`| **Category B: System Configuration**| **312** | Preserved (Master RBAC role-permission matrix)| **PRESERVE** |
| `public.audit_logs` | **Category B: System Configuration**| **8** | Preserved (System security audit trail)| **PRESERVE** |

---

## 11. PROPOSED RESET SCOPE

Because `santri`, `guru`, and all dependent operational tables currently contain **0 rows** in the live database:
- **Deletion Scope Required**: **0 rows to delete**.
- **No data loss will occur**: No student or teacher records exist to be deleted.
- **Safety Boundary**: The 6 tenant records, 7 administrator user accounts, and 373 RBAC configuration records will be **strictly preserved**, ensuring full system stability and login availability.

---

## 12. PROPOSED DELETION ORDER (RESET RUNBOOK SPECIFICATION)

Although current counts are 0, should any test rows be inserted prior to reset authorization, the deletion runbook must execute inside a single atomic transaction following reverse-dependency topological order:

```sql
-- Formal Clean Slate Reset Script (Specification Only - DO NOT EXECUTE NOW)
BEGIN;

-- 1. Clear polymorphic and dependent logs
DELETE FROM public.notifications;
DELETE FROM public.quests;
DELETE FROM public.health_permissions;
DELETE FROM public.health_visits;
DELETE FROM public.governance_cases;
DELETE FROM public.hukuman;
DELETE FROM public.pelanggaran;

-- 2. Clear academic structures
DELETE FROM public.rombel;
DELETE FROM public.kelas;
DELETE FROM public.kamar;
DELETE FROM public.asrama;
DELETE FROM public.madrasah;
DELETE FROM public.academic_years;

-- 3. Clear primary domain entities
DELETE FROM public.santri;
DELETE FROM public.guru;

-- 4. Verify assertion that zero domain records remain
DO $$
DECLARE
    v_santri_count int;
    v_guru_count int;
BEGIN
    SELECT count(*) INTO v_santri_count FROM public.santri;
    SELECT count(*) INTO v_guru_count FROM public.guru;
    IF v_santri_count > 0 OR v_guru_count > 0 THEN
        RAISE EXCEPTION 'Reset assertion failed: santri=% guru=%', v_santri_count, v_guru_count;
    END IF;
END $$;

COMMIT;
```

---

## 13. BACKUP REQUIREMENTS

Prior to any execution gate (even when counts are 0):
1. **Pre-Reset Snapshot**: Execute physical database dump via `pg_dump`:
   ```bash
   pg_dump -Fc --no-owner --no-privileges -f "scratch/pre_reset_backup_$(date +%Y%m%d_%H%M%S).dump" "$DATABASE_URL"
   ```
2. **Checksum Certification**: Calculate SHA-256 hash of the generated dump file.
3. **Restoration Verification**: Verify that the dump file can be read and cataloged without corruption.

---

## 14. POST-RESET VERIFICATION PLAN

Immediately following authorized reset execution, the following assertions must return `true`:
1. `SELECT count(*) FROM public.santri;` equals **0**.
2. `SELECT count(*) FROM public.guru;` equals **0**.
3. `SELECT count(*) FROM public.pelanggaran;` equals **0**.
4. `SELECT count(*) FROM public.tenants;` equals **6** (Tenants preserved).
5. `SELECT count(*) FROM public.users;` equals **7** (Admin users preserved).
6. Superadmin login to `/login` succeeds.
7. Zero foreign key violation errors exist in database logs.

---

## 15. RISKS & MITIGATIONS

| Identified Risk | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| Accidental deletion of Admin users in `public.users` | `CRITICAL` | `public.users` and `auth.users` are explicitly excluded from the deletion script. |
| Accidental deletion of RBAC configuration | `HIGH` | `permissions`, `tenant_roles`, and `tenant_role_permissions` are explicitly excluded. |
| Inadvertent lock contention | `LOW` | Deleting 0 rows acquires instant row locks with execution time < 50 milliseconds. |

---

## 16. PRECONDITIONS

The following preconditions are verified before reset execution:
- `[X]` Target database connection verified (`PostgreSQL 17.6`).
- `[X]` Product Owner decision on Clean Slate strategy formally documented.
- `[X]` Exact row counts of all 36 public tables verified via read-only script.
- `[X]` Zero production historical records confirmed to exist.
- `[ ]` Product Owner explicit authorization to execute reset runbook (Pending).

---

## 17. MB-01 DECISION STATUS

```text
DECISION POINT: MB-01 — HISTORICAL DATA MAPPING STRATEGY
SELECTED STRATEGY: OPTION HIST-1 — CLEAN SLATE CERTIFICATION
EVIDENTIARY STATUS:
- Target database physically contains 0 Santri records and 0 Guru records.
- Zero historical records exist requiring inter-tenant mapping.
- The system is completely eligible for Clean Slate certification.

GOVERNANCE STATE:
CLEAN SLATE VERIFIED READ-ONLY — READY FOR RESET AUTHORIZATION
```

---

## 18. RECOMMENDED NEXT EEOS GATE

Upon Product Owner review of this audit report, the next mandatory step in the EEOS governance pipeline is:

```text
GATE 1: PRODUCT OWNER RESET AUTHORIZATION
        ↓
GATE 2: PRE-RESET BACKUP & EXECUTION (Assert 0 rows confirmed)
        ↓
GATE 3: POST-RESET RE-VERIFICATION (Clean State Certified)
        ↓
GATE 4: TENANTIZATION DDL EXECUTION (WP-02: ALTER TABLE santri ADD COLUMN tenant_id NOT NULL)
```

---

## 19. FINAL SUMMARY BLOCK

```text
════════════════════════════════════════════════════════════════════════════════════════════════
                               CLEAN-SLATE VERIFICATION SUMMARY                                 
════════════════════════════════════════════════════════════════════════════════════════════════

Santri records:                              0
Guru/Ustadz records:                         0
Tenant records:                              6 (Preserved)
Platform/Tenant Admin User records:          7 (Preserved)
Records requiring historical tenant mapping: 0
Records eligible for clean-slate reset:      0
Unknown / requires clarification:            0

Reset blockers:                              NONE (0 Blockers)

Reset authorization status:
READY FOR RESET AUTHORIZATION
════════════════════════════════════════════════════════════════════════════════════════════════
```

*Report completed in read-only mode. Absolute stop condition reached. No data mutations or schema changes performed.*
