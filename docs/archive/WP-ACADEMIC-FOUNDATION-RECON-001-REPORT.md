# WP-ACADEMIC-FOUNDATION-RECON-001
# ACADEMIC FOUNDATION DATABASE RECONCILIATION & DEPENDENCY AUDIT
## Authoritative Forensic Audit, Dependency Graph & Implementation Roadmap for MA'HAD MANAGER

**Document Identifier**: `WP-ACADEMIC-FOUNDATION-RECON-001-REPORT`  
**Work Package ID**: `WP-ACADEMIC-FOUNDATION-RECON-001`  
**Phase**: FORENSIC → RECONCILIATION PLAN → DEPENDENCY VALIDATION → RISK REVIEW → STOP  
**Author**: Senior PostgreSQL Database Architect / Drizzle ORM Architect / Academic Domain Architect / Multi-Tenant SaaS Architect / Migration Safety Reviewer  
**Classification**: FORENSIC AUDIT & RECONCILIATION BLUEPRINT (READ-ONLY)  
**Date**: 2026-09-14  
**Target Horizon**: 10-Year Enterprise Lifecycle (100+ Pesantren / Tenants)  
**Status**: AUDIT COMPLETE — RECONCILIATION PLAN SPECIFIED (NO MUTATIONS PERFORMED)  

---

## 1. Executive Summary

This report delivers the authoritative forensic audit, dependency analysis, and reconciliation plan for the **Academic Foundation** of **MA'HAD MANAGER**.

Following the completion of `WP-ACADEMIC-HIFZH-JOURNAL-SCHEMA-001`, the domain architecture for the **Jurnal Hafalan Al-Qur'an (`hifzh_journal_entries`)** was fully designed. However, forensic verification revealed that the core temporal anchors of the academic domain:
1. **`academic_years`** (Tahun Ajaran)
2. **`academic_terms`** (Semester / Periode Akademik)

**do NOT exist in the live PostgreSQL database**. They exist solely as preliminary TypeScript definitions in `src/lib/db/schema/academic_workspace.ts` without corresponding migrations, database constraints, indexes, or Row-Level Security (RLS) policies.

Furthermore, upstream and downstream dependencies reveal critical architectural gaps:
- **Migration Ledger Gap**: There is **no `drizzle.__drizzle_migrations` table** in the live database. Drizzle migration tracking has never been initialized on the remote instance.
- **RLS Inactivity**: Row-Level Security is currently **DISABLED on all 32 public tables** in PostgreSQL, with 0 active policies.
- **Teacher Assignment Incomplete Normalization**: `teacher_assignments` stores `guru_name: text` instead of `guru_id: text` and lacks an `academic_year_id` temporal context.
- **Enrollment Denormalization**: Santri enrollment currently relies on a flat string `santri.kelas`, lacking a formal temporal junction `(santri_id, kelas_id, academic_year_id)` required for multi-year historical tracking.

Because `academic_years` and `academic_terms` are the foundational root for:
- **Jurnal Hafalan Al-Qur'an** (`hifzh_journal_entries.academic_year_id`, `academic_term_id`)
- **Penilaian & Asesmen** (`assessment_events.academic_term_id`)
- **Academic Ledger** (`academic_ledger_records.academic_term_id`)
- **Transkrip & Rapor** (`academic_transcripts.academic_term_id`)
- **Jadwal & Sesi Pengajaran** (`teaching_sessions.academic_day_id`)

this Work Package establishes the precise **Academic Foundation Reconciliation Plan** to rectify the foundational schema before implementing the Hifzh Journal.

---

## 2. Objective

1. Perform a forensic audit of the live Supabase PostgreSQL database, Drizzle ORM schemas, migration history, and migration ledgers.
2. Formally audit the domain design, constraints, and lifecycle of `academic_years` and `academic_terms`.
3. Map the comprehensive Academic Dependency Graph across all consumers (Hifzh Journal, Assessment, Academic Ledger, Transcripts, Teacher Assignments, and Student Enrollments).
4. Identify all multi-tenant isolation and cross-tenant leakage risks.
5. Formulate a risk-managed, phased reconciliation sequence prior to Hifzh Journal implementation.
6. Enforce strict read-only execution with zero code, database, migration, or environment mutations.

---

## 3. Locked Architecture

The Master Data and Storage Architecture established in `WP-STORAGE-ARCHITECTURE-LOCK-001` is strictly preserved:

```
========================================================================================
                          LOCKED ARCHITECTURAL INVARIANTS
========================================================================================
APPLICATION DATABASE (Source of Truth)  =  SUPABASE POSTGRESQL
DATABASE ACCESS LAYER & ORM             =  DRIZZLE ORM
AUTHENTICATION & IDENTITY               =  SUPABASE AUTH (auth.users -> public.users)
PHYSICAL FILE / BINARY STORAGE          =  TENANT-SPECIFIC GOOGLE DRIVE
DOCUMENT METADATA                       =  SUPABASE POSTGRESQL
ACTUAL DOCUMENT BINARIES                =  TENANT'S PRIVATE GOOGLE DRIVE
ACADEMIC STRUCTURED DATA                =  SUPABASE POSTGRESQL (NO GOOGLE DRIVE)
========================================================================================
```

> [!IMPORTANT]
> **Zero File Storage in Academic Foundation**: The Academic Foundation (`academic_years`, `academic_terms`, `kelas`, `mapel`, `teacher_assignments`, and `hifzh_journal_entries`) consists exclusively of structured relational data. It does **NOT** use, require, or integrate with Google Drive or Document Service. Google Drive is strictly reserved for physical files (e.g. Kartu Keluarga, Ijazah, Akta Kelahiran).

---

## 4. Live Database Evidence

A live query against `information_schema.tables`, `pg_class`, and `pg_policies` on the live PostgreSQL instance yields the following ground truth:

```
========================================================================================
LIVE DATABASE FORENSIC AUDIT SUMMARY (Schema: public)
========================================================================================
Total Tables in public: 32
Total Active RLS Policies: 0
Drizzle Migration Ledger: NOT FOUND (__drizzle_migrations does not exist)
========================================================================================
```

### Table Inventory & Status Verification

| Table Name | Live PostgreSQL Status | Row Count | RLS Status | Tenant Column | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `academic_years` | **MISSING** | 0 | N/A | N/A | **DOES NOT EXIST IN DATABASE** |
| `academic_terms` | **MISSING** | 0 | N/A | N/A | **DOES NOT EXIST IN DATABASE** |
| `academic_ledger_records`| **MISSING** | 0 | N/A | N/A | **DOES NOT EXIST IN DATABASE** |
| `academic_transcripts` | **MISSING** | 0 | N/A | N/A | **DOES NOT EXIST IN DATABASE** |
| `hifzh_journal_entries`| **MISSING** | 0 | N/A | N/A | **DOES NOT EXIST IN DATABASE** |
| `tenants` | **EXISTS** | 6 | DISABLED | PK `id` | Core tenant table |
| `tenant_settings` | **EXISTS** | 6 | DISABLED | `tenant_id` | Reconciled in WP-DB-RECON-CORE-001 |
| `platform_settings` | **EXISTS** | 0 | DISABLED | N/A | Global settings |
| `users` | **EXISTS** | 7 | DISABLED | `tenant_id` (legacy) | Global identity mapping |
| `platform_roles` | **EXISTS** | 2 | DISABLED | N/A | SUPER_ADMIN, DEVELOPER |
| `user_platform_roles` | **EXISTS** | 1 | DISABLED | N/A | Junction |
| `tenant_roles` | **EXISTS** | 6 | DISABLED | `tenant_id` | Role catalog |
| `user_tenant_memberships`| **EXISTS** | 6 | DISABLED | `tenant_id` | Primary tenant binding |
| `permissions` | **EXISTS** | 55 | DISABLED | N/A | Reconciled in WP-DB-RECON-PERM-001 |
| `tenant_role_permissions`| **EXISTS** | 312 | DISABLED | N/A | Reconciled in WP-DB-RECON-PERM-001 |
| `user_additional_permissions`|**EXISTS**| 0 | DISABLED | N/A | Reconciled in WP-DB-RECON-PERM-001 |
| `audit_logs` | **EXISTS** | 8 | DISABLED | `tenant_id` | Reconciled in WP-DB-RECON-CORE-001 |
| `santri` | **EXISTS** | 0 | DISABLED | *None in live DB* | Lacks tenant_id in live DB |
| `guru` | **EXISTS** | 0 | DISABLED | *None in live DB* | Lacks tenant_id in live DB |
| `kelas` | **EXISTS** | 0 | DISABLED | *None in live DB* | Lacks tenant_id in live DB |
| `mapel` | **EXISTS** | 0 | DISABLED | *None in live DB* | Lacks tenant_id in live DB |
| `teacher_assignments` | **EXISTS** | 0 | DISABLED | *None in live DB* | Has guru_name, lacks guru_id |
| `master_jenjang` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `master_tingkat` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `master_pelanggaran` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `pelanggaran` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `master_hukuman` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `hukuman` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `governance_cases` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `health_visits` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `health_permissions` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `quests` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `tolerance_policies` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `notifications` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `gdrive_documents` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `asrama` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |
| `kamar` | **EXISTS** | 0 | DISABLED | *None in live DB* | Legacy initial migration |

---

## 5. Drizzle Evidence

Inspection of `src/lib/db/schema.ts` and `src/lib/db/schema/` reveals:

### 5.1 `src/lib/db/schema/academic_workspace.ts`
```typescript
import { pgTable, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const academicYears = pgTable('academic_years', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').default('default').notNull(),
  name: text('name').notNull(), // e.g. "2026/2027"
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').default('planned').notNull(), // 'planned' | 'active' | 'archived'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const academicTerms = pgTable('academic_terms', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').default('default').notNull(),
  academicYearId: text('academic_year_id').notNull(),
  name: text('name').notNull(), // e.g. "Semester Ganjil", "Semester Genap"
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isCurrent: boolean('is_current').default(false).notNull(),
  status: text('status').default('planned').notNull(), // 'planned' | 'active' | 'closed'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Forensic Deficiencies in Current Drizzle Definitions
1. **Missing Foreign Keys**:
   - `academicYears.tenantId` lacks `.references(() => tenants.id)`.
   - `academicTerms.academicYearId` lacks `.references(() => academicYears.id)`.
   - `academicTerms.tenantId` lacks `.references(() => tenants.id)`.
2. **Missing Unique Constraints**:
   - No `UNIQUE(tenant_id, name)` on `academic_years`. A tenant could accidentally create duplicate "2026/2027" years.
   - No `UNIQUE(academic_year_id, name)` on `academic_terms`. Duplicate "Semester Ganjil" can be inserted under the same year.
3. **No Uniqueness Protection on `is_current`**:
   - There is no partial unique index `WHERE is_current = true`. A tenant could have multiple terms simultaneously marked as "current", causing non-deterministic report card and journal queries.
4. **Data Type Drift (Date vs Text)**:
   - `startDate` and `endDate` are typed as `text('start_date')` instead of PostgreSQL `date` types, preventing date arithmetic and index optimizations.
5. **No Status Check Constraints**:
   - Statuses are plain text columns with TypeScript comments instead of database-enforced `CHECK` constraints.

---

## 6. Migration Forensic

### 6.1 Audit of `drizzle/` Directory
- `0000_neat_machine_man.sql`: Contains initial table creations. Does **not** include `academic_years`, `academic_terms`, `academic_ledger_records`, or `academic_transcripts`.
- `0001_kesiswaan_master_tables.sql`: Contains `master_institutions`, `violation_severity_levels`, `violation_categories`. **Unapplied** to live DB.
- `0002_tenant_rls_hardening.sql`: Contains RLS script. **Unapplied** to live DB.
- `WP-DB-RECON-CORE-001.sql`: Successfully executed in previous WP (`tenant_settings`, `platform_settings`, `audit_logs.tenant_id`).
- `WP-DB-RECON-PERMISSIONS-001.sql`: Successfully executed in previous WP (`permissions`, `tenant_role_permissions`, `user_additional_permissions`).

### 6.2 The Migration Ledger Gap
- Query against PostgreSQL catalogs confirms: **`drizzle.__drizzle_migrations` does NOT exist**.
- Previous migrations were executed via direct SQL reconciliation scripts (`postgres` connection) rather than `drizzle-kit migrate`.
- **Verdict**: Replaying standard Drizzle migrations via CLI without reconciliation will fail or conflict with existing live tables. Any migration for Academic Foundation must be written as an **idempotent, declarative SQL reconciliation script** (`CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN ... END $$` for constraints).

---

## 7. Academic Year Domain Audit

### Conceptual Lifecycle
```
[Academic Year Domain Lifecycle]
+-------------+      Activation       +------------+       Term End       +--------------+
|   PLANNED   | --------------------> |   ACTIVE   | -------------------> |   ARCHIVED   |
| (Setup KBM) |                       |  (Current) |                      | (Immutable)  |
+-------------+                       +------------+                      +--------------+
```

### Forensic Analysis & Proposed Refinement
- **Tenant Scope**: Must be owned by `tenant_id`.
- **Active Year Uniqueness**: At most **one** active academic year per tenant at any given moment:
  ```sql
  CREATE UNIQUE INDEX uq_academic_years_tenant_active 
    ON public.academic_years (tenant_id) 
    WHERE status = 'active';
  ```
- **Year Identity Uniqueness**:
  ```sql
  CONSTRAINT uq_academic_years_tenant_name UNIQUE (tenant_id, name);
  ```
- **Status Check Constraint**:
  ```sql
  CHECK (status IN ('planned', 'active', 'archived'));
  ```

---

## 8. Academic Term Domain Audit

### Conceptual Lifecycle
```
[Academic Term Domain Lifecycle]
+-------------+      Term Start       +------------+       Grading End    +------------+
|   PLANNED   | --------------------> |   ACTIVE   | -------------------> |   CLOSED   |
| (Curriculum)|                       | (Running)  |                      |  (Rapor)   |
+-------------+                       +------------+                      +------------+
```

### Forensic Analysis & Proposed Refinement
- **Parent Relationship**: `academic_year_id` NOT NULL REFERENCES `academic_years(id) ON DELETE RESTRICT`.
- **Tenant Inheritance & Defense-in-Depth**: Storing `tenant_id` directly on `academic_terms` enables direct index scans without joining `academic_years`.
- **Active Term Uniqueness (Single Active Term per Tenant)**:
  ```sql
  CREATE UNIQUE INDEX uq_academic_terms_tenant_current 
    ON public.academic_terms (tenant_id) 
    WHERE is_current = true;
  ```
- **Term Identity Uniqueness per Year**:
  ```sql
  CONSTRAINT uq_academic_terms_year_name UNIQUE (academic_year_id, name);
  ```
- **Status Check Constraint**:
  ```sql
  CHECK (status IN ('planned', 'active', 'closed'));
  ```

---

## 9. Tenant Isolation Audit

### Forensic Classification: APPLICATION-LEVEL ONLY (CRITICAL FINDING)
- **Live Reality**: RLS is **DISABLED** on all 32 public tables in live PostgreSQL.
- **Enforcement**: Tenant isolation currently relies **100% on application-layer `WHERE tenant_id = ...` clauses** in Drizzle repositories and services.
- **Target Standard**: To fulfill the 10-year enterprise mandate (100+ Pesantren), tenant isolation must achieve **DEFENSE-IN-DEPTH**:
  1. **Level 1 (Application)**: Server-derived `tenant_id` injected from session JWT.
  2. **Level 2 (Database Schema)**: `tenant_id NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`.
  3. **Level 3 (Database Engine)**: PostgreSQL Row-Level Security (`ENABLE ROW LEVEL SECURITY`) with policy `tenant_id = current_setting('app.current_tenant_id', true)`.

---

## 10. Cross-Tenant Integrity

### The Cross-Tenant Reference Vulnerability
In a multi-tenant system with simple foreign keys:
```
Table A: academic_years (id, tenant_id)
Table B: academic_terms (id, tenant_id, academic_year_id)
Table C: hifzh_journal_entries (id, tenant_id, academic_year_id, academic_term_id)
```
If Table B only enforces `FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)`, a compromised client or buggy service could associate `tenant_id = 'tenant_b'` with `academic_year_id` belonging to `'tenant_a'`.

### Mitigation: Composite Foreign Keys
To guarantee database-level isolation:
```sql
-- 1. Unique composite key on academic_years
ALTER TABLE public.academic_years 
  ADD CONSTRAINT uq_academic_years_tenant_id UNIQUE (tenant_id, id);

-- 2. Composite foreign key on academic_terms
ALTER TABLE public.academic_terms
  ADD CONSTRAINT fk_academic_terms_tenant_year
  FOREIGN KEY (tenant_id, academic_year_id) 
  REFERENCES public.academic_years (tenant_id, id)
  ON DELETE RESTRICT;
```
This mathematically guarantees that an `academic_term` can **never** reference an `academic_year` from another tenant.

---

## 11. Historical Integrity

### Anti-Cascade Rule
Academic records are immutable historical legal assets.
- If a tenant administrator attempts to delete an archived `academic_year` or `academic_term`, the database engine must **BLOCK** the deletion.
- **Rule**: All foreign keys pointing to `academic_years` and `academic_terms` from downstream tables (`kelas`, `academic_ledger_records`, `academic_transcripts`, `hifzh_journal_entries`) must use:
  ```sql
  ON DELETE RESTRICT
  ```
- Hard deletes of academic years with existing terms, classes, or journal entries are strictly forbidden.

---

## 12. Enrollment Dependency

### Forensic Gap
- In live PostgreSQL, `santri` contains a single string column `kelas: text`.
- There is **no `academic_year_id` on santri**, and **no `student_enrollments` junction table**.
- **Impact**: When student Ahmad moves from Class 7A (2025/2026) to Class 8A (2026/2027), updating `santri.kelas` overwrites his past class history!
- **Hifzh Journal Resilience**: Because `hifzh_journal_entries` stores both `kelas_id` and `academic_year_id` directly in the journal entry snapshot, the recitation log remains historically intact even if master enrollment has not yet been normalized into an enrollment ledger.

---

## 13. Teacher Assignment Dependency

### Forensic Gap
- Live table `teacher_assignments` contains:
  `id`, `mapel_id`, `kelas_id`, `kelas_name`, `guru_name`, `status`, `created_at`, `updated_at`.
- **Defect 1**: Stores `guru_name: text` instead of `guru_id: text`. Cannot enforce RBAC authorization against `users.id` / `guru.id`.
- **Defect 2**: Lacks `academic_year_id`. A teacher assignment has no temporal boundary.
- **Recommendation**: In the Academic Foundation Implementation WP, normalize `teacher_assignments` by adding `guru_id` and `academic_year_id`.

---

## 14. Assessment Dependency

- Tables `academic_ledger_records` and `academic_transcripts` (defined in `src/lib/db/schema/academic_ledger.ts`) depend directly on `academic_terms(id)`.
- Reconciling `academic_years` and `academic_terms` unblocks the Assessment and Grading engine.

---

## 15. Academic Ledger Boundary

```
+-------------------------------------------------------------+
|                      DAILY OPERATIONAL                      |
|                                                             |
|   hifzh_journal_entries                                     |
|   - Frequency: Daily recitation logs (1-2x per santri)      |
|   - Bounded to: academic_year_id, academic_term_id          |
|   - Status: Pedagogical log (NOT a ledger entry)            |
+-------------------------------------------------------------+
                              |
                              | (Formal Exam Aggregation)
                              v
+-------------------------------------------------------------+
|                     FORMAL EVALUATION                       |
|                                                             |
|   academic_ledger_records                                   |
|   - Frequency: Midterm / Final Semester Exams               |
|   - Bounded to: academic_term_id, mapel_id, santri_id       |
|   - Produces: rawScore, weightedScore                       |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                     FORMAL REPORT CARD                      |
|                                                             |
|   academic_transcripts                                      |
|   - Produces: finalScore, predicate ('Mumtaz'...)           |
+-------------------------------------------------------------+
```

---

## 16. Hifzh Journal Dependency

The Hifzh Journal schema proposed in `WP-ACADEMIC-HIFZH-JOURNAL-SCHEMA-001` relies on the following foreign key relationships:

```
public.hifzh_journal_entries
  ├── tenant_id          ──> public.tenants(id)          [EXISTS in Live DB]
  ├── santri_id          ──> public.santri(id)           [EXISTS in Live DB]
  ├── guru_id            ──> public.guru(id)             [EXISTS in Live DB]
  ├── mapel_id           ──> public.mapel(id)            [EXISTS in Live DB]
  ├── kelas_id           ──> public.kelas(id)            [EXISTS in Live DB]
  ├── academic_year_id   ──> public.academic_years(id)   [MISSING in Live DB]
  └── academic_term_id   ──> public.academic_terms(id)   [MISSING in Live DB]
```

**Verdict**: The Hifzh Journal **CANNOT** be fully created with strict foreign key referential integrity until `academic_years` and `academic_terms` are reconciled and created in PostgreSQL!

---

## 17. Complete Academic Dependency Graph

```
[Comprehensive Academic Architecture Dependency Graph]

                       +-----------------------------+
                       |       public.tenants        |
                       +-----------------------------+
                                      |
                                      v
                       +-----------------------------+
                       |    public.academic_years    | <=== FOUNDATION ROOT
                       +-----------------------------+
                                      |
                                      v
                       +-----------------------------+
                       |    public.academic_terms    | <=== TEMPORAL ANCHOR
                       +-----------------------------+
                                      |
             +------------------------+------------------------+
             |                                                 |
             v                                                 v
+-----------------------------+               +-----------------------------+
|        public.kelas         |               |        public.mapel         |
|      (Halaqah Rombel)       |               |    (Hafalan Al-Qur'an)      |
+-----------------------------+               +-----------------------------+
             |                                                 |
             +------------------------+------------------------+
                                      |
                                      v
                       +-----------------------------+
                       | public.teacher_assignments  |
                       +-----------------------------+
                                      |
                                      v
                       +-----------------------------+
                       | public.hifzh_journal_entries| <=== HIFZH JOURNAL
                       +-----------------------------+
                                      |
                                      v (Periodic Exam Rollup)
                       +-----------------------------+
                       |public.academic_ledger_records|
                       +-----------------------------+
                                      |
                                      v
                       +-----------------------------+
                       |  public.academic_transcripts | <=== RAPOR TAHFIDZ
                       +-----------------------------+
```

---

## 18. Reconciliation Matrix

| Component | In Drizzle Schema? | In Live DB? | In Migration Files? | Downstream Dependency | Forensic Gap | Risk Level | Reconciliation Recommendation |
| :--- | :---: | :---: | :---: | :--- | :--- | :---: | :--- |
| **`academic_years`** | **YES** (`academic_workspace.ts`) | **NO** | **NO** | `academic_terms`, `hifzh_journal`, `kelas` | Missing table, constraints, and indexes | **HIGH** (Blocker) | Create via idempotent SQL script with composite unique and status check. |
| **`academic_terms`** | **YES** (`academic_workspace.ts`) | **NO** | **NO** | `hifzh_journal`, `academic_ledger`, `transcripts` | Missing table, constraints, and partial unique index | **HIGH** (Blocker) | Create with composite FK to `academic_years(tenant_id, id)` and partial unique `is_current`. |
| **`teacher_assignments`**| **YES** (`schema.ts`) | **YES** | **YES** (0000) | Authorization for Halaqah Journal | Missing `guru_id` (has `guru_name`), missing `academic_year_id` | **MEDIUM** | Add `guru_id` and `academic_year_id` nullable columns in future migration. |
| **`santri`** | **YES** (`schema.ts`) | **YES** | **YES** (0000) | `hifzh_journal_entries`, `academic_ledger` | Lacks `tenant_id` in live DB, flat string `kelas` | **MEDIUM** | Preserve compatibility; enforce `tenant_id` in future recon. |
| **`mapel`** | **YES** (`schema.ts`) | **YES** | **YES** (0000) | `hifzh_journal_entries` | Lacks `tenant_id` in live DB | **LOW** | Validated as functional; ready for journal FK. |
| **`kelas`** | **YES** (`schema.ts`) | **YES** | **YES** (0000) | `hifzh_journal_entries` | Lacks `tenant_id` in live DB | **LOW** | Validated as functional; ready for journal FK. |
| **`academic_ledger_records`**| **YES** (`academic_ledger.ts`) | **NO** | **NO** | Formal gradebook rollup | Missing table | **LOW** (Non-blocker for Journal) | Reconcile in subsequent Assessment WP. |
| **`academic_transcripts`** | **YES** (`academic_ledger.ts`) | **NO** | **NO** | Rapor distribution | Missing table | **LOW** (Non-blocker for Journal) | Reconcile in subsequent Assessment WP. |
| **Migration Ledger** | **NO** | **NO** | **NO** | System DDL tracking | `__drizzle_migrations` table absent | **MEDIUM** | Use idempotent raw SQL reconciliation scripts matching WP-DB-RECON pattern. |

---

## 19. Dependency Matrix

| Dependency | Required By | Exists in Live DB? | Ready for Production? | Blocker for Hifzh Journal? | Target Work Package |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **`tenants`** | All modules | **YES** | **YES** | NO | Existing |
| **`academic_years`** | `academic_terms`, `hifzh_journal_entries` | **NO** | **NO** | **YES** | `WP-ACADEMIC-FOUNDATION-RECON-001` (Plan) $\rightarrow$ Implementation |
| **`academic_terms`** | `hifzh_journal_entries`, `academic_ledger` | **NO** | **NO** | **YES** | `WP-ACADEMIC-FOUNDATION-RECON-001` (Plan) $\rightarrow$ Implementation |
| **`santri`** | `hifzh_journal_entries`, `academic_ledger` | **YES** | **YES** | NO | Existing |
| **`guru`** | `hifzh_journal_entries`, `teacher_assignments` | **YES** | **YES** | NO | Existing |
| **`mapel`** | `hifzh_journal_entries`, `teacher_assignments` | **YES** | **YES** | NO | Existing |
| **`kelas`** | `hifzh_journal_entries`, `teacher_assignments` | **YES** | **YES** | NO | Existing |
| **`audit_logs`** | All mutations | **YES** | **YES** | NO | Existing |
| **`academic_ledger`** | Rapor Tahfidz (Formal rollups) | **NO** | **NO** | NO (Decoupled from Daily Journal) | `WP-ACADEMIC-LEDGER-RECON-001` |

---

## 20. Risk Matrix

| Risk | Severity | Probability | Impact | Architectural Mitigation | Work Package |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **Cross-Tenant Year Association** | **HIGH** | Medium | Critical data contamination | Enforce composite foreign keys `(tenant_id, academic_year_id)` on `academic_terms`. | WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001 |
| **Multiple Active Terms** | **HIGH** | High | Non-deterministic active semester queries | PostgreSQL partial unique index `UNIQUE(tenant_id) WHERE is_current = true`. | WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001 |
| **Accidental Historical Deletion** | **HIGH** | Medium | Loss of legal student records | Enforce `ON DELETE RESTRICT` on all academic year/term foreign keys. | WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001 |
| **Migration Collision** | **MEDIUM** | High | CLI migration failure on live Supabase | Use idempotent SQL script with `IF NOT EXISTS` and `pg_constraint` guards. | WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001 |
| **RLS Inactivity Vulnerability** | **HIGH** | High | Unrestricted cross-tenant queries if service layer fails | Implement RLS policies on `academic_years` and `academic_terms` upon creation. | WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001 |
| **Invalid Date Intervals** | **MEDIUM** | Medium | Terms starting after academic year ends | Database check constraint `CHECK (end_date >= start_date)` + service-level date containment validation. | WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001 |

---

## 21. Proposed Implementation Order

To maintain systemic stability and prevent broken dependencies:

```
[Strict Implementation Sequence]

  PHASE 1: Academic Foundation Implementation
  - Create migration script drizzle/WP-ACADEMIC-FOUNDATION-RECON-001.sql
  - Execute DDL on live Supabase PostgreSQL (academic_years, academic_terms)
  - Apply composite unique constraints, partial unique index, and foreign keys
  - Enable RLS and apply tenant isolation policies
  - Update Drizzle schema in src/lib/db/schema/academic_workspace.ts
                    |
                    v
  PHASE 2: Academic Foundation Runtime Verification
  - Verify tables, columns, indexes, and constraints on live DB
  - Execute contract tests for academic year and term creation
                    |
                    v
  PHASE 3: Academic Hifzh Journal Implementation
  - Create migration script for public.hifzh_journal_entries
  - Execute DDL with strict foreign keys to academic_years and academic_terms
  - Implement HifzhJournalService and API route handlers
                    |
                    v
  PHASE 4: Academic Hifzh Journal Runtime Verification & Mobile UI
  - Verify live PostgreSQL journal entries creation and duplicate prevention
  - Deliver mobile-first halaqah recitation UI at /dashboard/setoran-quran
```

---

## 22. Recommended Future Work Packages

1. **`WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001`**:
   - Authorized execution of `academic_years` and `academic_terms` DDL on live Supabase PostgreSQL.
   - Synchronize `src/lib/db/schema/academic_workspace.ts`.
2. **`WP-ACADEMIC-FOUNDATION-RUNTIME-VERIFY-001`**:
   - Automated contract tests and live verification of academic year/term lifecycle and multi-tenant constraints.
3. **`WP-ACADEMIC-HIFZH-JOURNAL-IMPLEMENTATION-001`**:
   - Implementation of `hifzh_journal_entries` table, Drizzle schema, repository, and service layer.
4. **`WP-ACADEMIC-HIFZH-JOURNAL-RUNTIME-VERIFY-001`**:
   - End-to-end verification of halaqah recitation logging with live PostgreSQL.

---

## 23. Open Decisions for Product Owner

1. **Default Academic Year Status on Creation**:
   - *Option A (Recommended)*: New academic years default to `'planned'`. Super Admin or Academic Admin explicitly activates the year, which automatically transitions the previous year to `'archived'`.
   - *Option B*: Allow manual status toggle without automatic archive transitions.
2. **Date Storage Format**:
   - *Option A (Recommended)*: Native PostgreSQL `date` type (e.g. `'2026-07-15'::date`) in the database migration, mapping to `date('start_date')` in Drizzle.
   - *Option B*: Maintain `text('start_date')` matching the prototype definition in `academic_workspace.ts`.

---

## 24. Architecture Invariants (Certified Re-Confirmation)

```
LOCKED:
DATABASE                    =  SUPABASE POSTGRESQL
ORM                         =  DRIZZLE ORM
AUTH                        =  SUPABASE AUTH
PHYSICAL FILE STORAGE       =  TENANT-SPECIFIC GOOGLE DRIVE
ACADEMIC STRUCTURED DATA    =  SUPABASE POSTGRESQL (Drizzle ORM)
ACADEMIC FILES / DOCUMENTS  =  TENANT'S PRIVATE GOOGLE DRIVE
```

---

## 25. Final Validation Checklist

```
[x] Live DB inspected (32 tables, row counts, RLS status verified)
[x] Drizzle schema inspected (academic_workspace.ts, academic_ledger.ts)
[x] Migrations inspected (0000, 0001, 0002, WP-DB-RECON-CORE, WP-DB-RECON-PERM)
[x] Migration ledger inspected (__drizzle_migrations gap confirmed)
[x] academic_years inspected (missing in DB, defects identified in TS)
[x] academic_terms inspected (missing in DB, defects identified in TS)
[x] Enrollment inspected (flat string gap identified)
[x] Teacher assignments inspected (guru_name vs guru_id gap identified)
[x] Assessment & ledger boundary verified (decoupled from daily journal)
[x] Tenant isolation inspected (RLS currently disabled in live DB)
[x] Cross-tenant integrity inspected (composite FK solution designed)
[x] Historical integrity inspected (ON DELETE RESTRICT mandated)
[x] Hifzh dependency verified (academic_years & terms identified as blocker)
[x] Google Drive boundary preserved (zero file storage in academic foundation)
[x] Absolute no-mutation rule strictly enforced
```

---

## 26. Final Status Block

============================================================  
WP STATUS  
============================================================  

STATUS:  
**PASS**  

FORENSIC:  
**PASS**  

ACADEMIC YEAR:  
**NOT READY** (Defined in TS; Missing in Live PostgreSQL)  

ACADEMIC TERM:  
**NOT READY** (Defined in TS; Missing in Live PostgreSQL)  

TENANT ISOLATION:  
**GAP** (Application-level only; RLS disabled on live DB)  

MIGRATION SAFETY:  
**GAP** (Migration ledger absent; requires idempotent SQL recon script)  

HIFZH DEPENDENCY:  
**BLOCKED** (Requires academic_years & academic_terms creation first)  

GOOGLE DRIVE BOUNDARY:  
**PASS** (Zero file storage dependency in academic foundation)  

SOURCE MUTATION:  
**NONE**  

DATABASE MUTATION:  
**NONE**  

MIGRATION EXECUTION:  
**NONE**  

API:  
**NONE**  

UI:  
**NONE**  

COMMIT:  
**NONE**  

PUSH:  
**NONE**  

DEPLOY:  
**NONE**  

PRODUCT OWNER DECISION REQUIRED:  
1. Date Storage Type: Native PostgreSQL `date` (Recommended) vs ISO string `text`.  
2. Academic Year Lifecycle Transition: Automated previous year archiving upon activation vs manual toggle.  

NEXT RECOMMENDED WP:  
**WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001** (Creation of academic_years and academic_terms on live PostgreSQL)  

============================================================  
STOP.
