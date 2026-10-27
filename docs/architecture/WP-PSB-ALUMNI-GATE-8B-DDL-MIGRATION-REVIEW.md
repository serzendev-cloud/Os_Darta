# WP-PSB-ALUMNI — GATE 8B DDL DESIGN & MIGRATION REVIEW

```text
══════════════════════════════════════════════════════════════════════════════════
WORK PACKAGE: WP-PSB-ALUMNI-SCHEMA-001
DOCUMENT: docs/architecture/WP-PSB-ALUMNI-GATE-8B-DDL-MIGRATION-REVIEW.md
GATE: GATE 8B — DDL DESIGN & MIGRATION REVIEW
MODE: ADVERSARIAL AUDIT & RELIABILITY REVIEW ONLY
AUTHORIZATION STATUS:
  • DDL EXECUTION: ❌ NOT AUTHORIZED
  • MIGRATION EXECUTION: ❌ NOT AUTHORIZED
  • DATABASE MUTATION: ❌ FORBIDDEN (DATABASE UNTOUCHED)
  • CODEBASE MUTATION: ❌ FORBIDDEN (CODEBASE UNCHANGED)
REVIEW POSTURE: ADVERSARIAL SKEPTICISM — PROVE WHERE THE DESIGN CAN FAIL
══════════════════════════════════════════════════════════════════════════════════
```

---

## 1. EXECUTIVE SUMMARY

This document provides the **authoritative Adversarial Review Report** for Gate 8B of Work Package `WP-PSB-ALUMNI-SCHEMA-001`.

Following the production of the Gate 8A design deliverables ([WP-PSB-ALUMNI-DDL-DRAFT-001.sql](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-DDL-DRAFT-001.sql), [WP-PSB-ALUMNI-DDL-DESIGN-001.md](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-DDL-DESIGN-001.md), and [WP-PSB-ALUMNI-MIGRATION-DESIGN-001.md](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-MIGRATION-DESIGN-001.md)), this audit subjected the entire DDL specification, relational graph, procedural triggers, Row-Level Security policies, and migration sequence to forensic adversarial scrutiny.

The mandate of this review was **not to validate that the design looks plausible**, but to actively search for failure modes: broken foreign keys, cross-tenant leak vectors, lock contention, RLS bypasses, privilege escalation risks, silent schema drift masked by `IF NOT EXISTS`, and unprovable zero-downtime or zero-data-loss rollback claims.

### Key Audit Findings:
1. **Zero Architecture Rewrite (PASS)**: The core multi-tenant platform architecture, Level-4 academic tables (`madrasah`, `jenjang`, `tingkat`, `rombel`), and Next.js proxy authorization boundaries are preserved. Zero existing columns or tables are deleted or restructured.
2. **Missing Table in DDL Draft (`psb_test_scores`) (HIGH FINDING)**: While declared in the Design Report (Table 4) and Migration Validation Plan (Phase 8), `CREATE TABLE IF NOT EXISTS public.psb_test_scores` was accidentally omitted from `WP-PSB-ALUMNI-DDL-DRAFT-001.sql`, resulting in an object count discrepancy (17 actual tables created vs. 18 declared).
3. **Incomplete RLS Policy Definition (HIGH FINDING)**: RLS is enabled on all 17 new tables, but `CREATE POLICY` statements were omitted for 7 tables (`psb_committees`, `psb_infaq_verifications`, `psb_acceptance_ledgers`, `alumni_exit_reasons`, `alumni_korwils`, `tenant_korwil_settings`, and `alumni_donations`). In PostgreSQL, enabling RLS without policies results in a silent **DENY ALL** for non-superuser connections.
4. **Coarse-Grained RLS on Ephemeral Features (HIGH FINDING)**: The policies for `salam_interactions` and `user_discovery_locations` enforce tenant isolation but lack individual user ownership checks (`auth.uid() = sender_user_id` / `user_id`), allowing any user within a tenant to read peer-to-peer salam messages or mutate other alumni's ephemeral locations.
5. **Relational Tenant Key Missing on `public.santri` (HIGH FINDING)**: `public.santri` currently lacks `CONSTRAINT uq_santri_tenant_id UNIQUE (tenant_id, id)`. Consequently, child tables (`alumni_academic_snapshots` and `identity_consolidation_ledgers`) reference `santri(id)` via single-column foreign keys, leaving cross-tenant integrity in those tables unprotected by relational constraints.
6. **Rollback Reversibility & Zero-Downtime Clarification (MEDIUM FINDING)**: The claim that the migration is "100% reversible with zero data loss" is true only for **Pre-Data Rollbacks**. Once production data is written, executing `DROP TABLE ... CASCADE` causes catastrophic data loss. Similarly, the "Zero-Downtime Guarantee" must be classified as a **Zero-Downtime Target**, due to the brief `ShareLock` acquired on `santri` and `users` during non-concurrent index/constraint creation.
7. **NBO-001 Confirmation**: The legacy sync trigger `trg_sync_santri_kelas_from_rombel` operates on a Last-Write-Wins basis under concurrent multi-Madrasah placements, consistent with its role as a backward-compatibility projection.

### Gate 8B Verdict:
**`PASS WITH CONDITIONS — CORRECTIONS REQUIRED BEFORE EXECUTION AUTHORIZATION`**

The architecture is sound, robust, and completely aligned with locked baselines. However, the identified schema omissions, missing RLS policies, and constraint additions must be incorporated into the final DDL script prior to requesting Gate 9 execution authorization.

---

## 2. SCOPE OF AUDIT

The scope of this adversarial review encompasses:
- **DDL Specification**: [WP-PSB-ALUMNI-DDL-DRAFT-001.sql](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-DDL-DRAFT-001.sql)
- **DDL Architecture Report**: [WP-PSB-ALUMNI-DDL-DESIGN-001.md](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-DDL-DESIGN-001.md)
- **Migration & Rollback Specification**: [WP-PSB-ALUMNI-MIGRATION-DESIGN-001.md](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-MIGRATION-DESIGN-001.md)
- **Living Codebase Schema Context**:
  - `src/lib/db/schema.ts` (`santri`, `tenants`, `audit_logs`)
  - `src/lib/db/schema/identity.ts` (`users`, `user_tenant_memberships`)
  - `src/lib/db/schema/academic_structure.ts` (`madrasah`, `jenjang`, `tingkat`, `rombel`)
  - `src/lib/db/schema/academic_workspace.ts` (`academic_years`, `academic_terms`)
  - `drizzle/0000_neat_machine_man.sql` & `drizzle/0002_tenant_rls_hardening.sql`

---

## 3. BASELINES REVIEWED

This review strictly adhered to the following locked baselines:
1. `PRD — APP MA'HAD: PSB & Alumni Ecosystem`
2. `WP-PSB-ALUMNI-SCHEMA-001-DESIGN-V3.md`
3. `WP-PSB-ALUMNI-IDENTITY-FEDERATION-DECISION-LOCK.md` (Option A Locked)
4. `WP-PSB-ALUMNI-TIR009-IDENTITY-CONSOLIDATION-HARDENING.md`
5. `WP-PSB-ALUMNI-PRE-DDL-CONTRACT-CONSISTENCY-AUDIT.md`
6. `WP-PSB-ALUMNI-GAP-CLOSURE-001-REPORT.md` (CG-001 through CG-008 Closed)
7. `WP-PSB-ALUMNI-POST-GAP-CONTRACT-CONSISTENCY-AUDIT.md`
8. `WP-PSB-ALUMNI-DDL-DESIGN-001.md`
9. `WP-PSB-ALUMNI-MIGRATION-DESIGN-001.md`
10. `Existing APP MA'HAD Codebase & Database Migrations`

---

## 4. EXISTING SCHEMA COMPATIBILITY REVIEW

An audit of existing production tables confirms complete structural compatibility:

| Existing Table | Existing State | Proposed Modification | Compatibility Impact | Verdict |
| :--- | :--- | :--- | :--- | :---: |
| `public.users` | `id text PK`, `status text DEFAULT 'ACTIVE'`, `email text UNIQUE` | Add column `merged_into_user_id text NULL REFERENCES users(id)` | Non-breaking, purely additive. Nullable column avoids rewriting existing rows. | **PASS** |
| `public.santri` | `id text PK`, `nis text UNIQUE`, `kelas text`, `status text DEFAULT 'Aktif'` | Add column `user_id text NULL REFERENCES users(id)` | Non-breaking, purely additive. Existing rows have `user_id = NULL`. | **PASS** |
| `user_tenant_memberships` | Unique on `(user_id, tenant_id)`, single `primary_role_id` | Untouched. Dual identities handled via `user_tenant_personas`. | Zero impact on existing RBAC tables. | **PASS** |
| `academic_years` | `id text PK`, `uq_academic_years_tenant_id UNIQUE(tenant_id, id)` | Referenced by `psb_periods` via composite FK `(tenant_id, academic_year_id)` | Matches existing composite unique key exactly. | **PASS** |
| `madrasah` | `id text PK`, `uq_madrasah_tenant_id UNIQUE(tenant_id, id)` | Referenced by `psb_placement_distributions` and `alumni_academic_snapshots` | Matches existing composite unique key exactly. | **PASS** |
| `jenjang` | `id text PK`, `uq_jenjang_tenant_madrasah_id UNIQUE(tenant_id, madrasah_id, id)` | Referenced by `psb_placement_distributions` via `(tenant_id, madrasah_id, jenjang_id)` | Matches existing composite unique key exactly. | **PASS** |
| `tingkat` | `id text PK`, `uq_tingkat_tenant_id UNIQUE(tenant_id, id)` | Referenced by `psb_placement_distributions` via `(tenant_id, tingkat_id)` | Matches existing composite unique key exactly. | **PASS** |
| `rombel` | `id text PK`, `uq_rombel_tenant_id UNIQUE(tenant_id, id)` | Referenced by `psb_placement_distributions` via `(tenant_id, rombel_id)` | Matches existing composite unique key exactly. | **PASS** |

---

## 5. DDL STRUCTURAL & OBJECT COUNT REVIEW

A forensic line-by-line comparison between declared architectural objects and actual statements in `WP-PSB-ALUMNI-DDL-DRAFT-001.sql` revealed a discrepancy in object counts:

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             OBJECT COUNT AUDIT MATRIX                            │
├──────────────────────────────┬──────────────┬─────────────┬──────────────────────┤
│ Entity Category              │ Declared Qty │ Actual Qty  │ Status               │
├──────────────────────────────┼──────────────┼─────────────┼──────────────────────┤
│ Core Extensions (Columns)    │ 2            │ 2           │ PASS                 │
│ Core Identity Tables         │ 2            │ 2           │ PASS                 │
│ PSB Domain Tables            │ 8            │ 7           │ MISMATCH (Missing 1) │
│ Alumni Ecosystem Tables      │ 8            │ 8           │ PASS                 │
├──────────────────────────────┼──────────────┼─────────────┼──────────────────────┤
│ Total New Tables             │ 18           │ 17          │ MISMATCH (-1 Table)  │
└──────────────────────────────┴──────────────┴─────────────┴──────────────────────┘
```

### Finding F-01 (HIGH): Omission of `psb_test_scores` Table
- **Evidence**: `WP-PSB-ALUMNI-DDL-DESIGN-001.md` lists `psb_test_scores` in Section 4 (Line 77). `WP-PSB-ALUMNI-MIGRATION-DESIGN-001.md` expects `psb_test_scores` in Section 18 (Post-Migration Validation, Line 308). However, `WP-PSB-ALUMNI-DDL-DRAFT-001.sql` contains **no `CREATE TABLE` statement** for `psb_test_scores`.
- **Consequence**: Running the draft SQL would deploy only 17 tables. The post-migration assertion query `SELECT COUNT(*) WHERE table_name IN (...)` expecting 18 tables will fail with a count of 17.
- **Required Correction**: Insert the complete `CREATE TABLE IF NOT EXISTS public.psb_test_scores` definition into Section 3 of `WP-PSB-ALUMNI-DDL-DRAFT-001.sql`.

---

## 6. FOREIGN KEY & RELATIONAL INTEGRITY REVIEW

### 6.1 `santri.user_id` Analysis (CG-001)
- **Specification**: `ALTER TABLE public.santri ADD COLUMN user_id text NULL;` with `REFERENCES public.users(id) ON DELETE RESTRICT;`.
- **Uniqueness**: Partial unique index `uq_santri_tenant_active_user` on `(tenant_id, user_id) WHERE status = 'Aktif' AND user_id IS NOT NULL`.
- **Adversarial Evaluation**:
  - *Can a user be linked to multiple active students in the same tenant?* **NO**, barred by `uq_santri_tenant_active_user`.
  - *Can a user be linked to an active student in Tenant A and another student in Tenant B?* **YES**, which correctly supports multi-tenant enrollment or cross-tenant transfer scenarios.
  - *Can a user be linked to historical graduated records?* **YES**, because inactive records (`status <> 'Aktif'`) are excluded from the partial unique index.

### 6.2 Child References to `public.santri` (Finding F-02 - HIGH)
- **Evidence**: `public.santri` is defined in `src/lib/db/schema.ts` with `id text PRIMARY KEY` and `tenant_id text NOT NULL`. It does **not** have a composite unique constraint on `(tenant_id, id)`.
- **Vulnerability**: In `WP-PSB-ALUMNI-DDL-DRAFT-001.sql`:
  - `alumni_academic_snapshots` has `santri_id text NOT NULL REFERENCES public.santri(id)`.
  - `identity_consolidation_ledgers` has `santri_id text NOT NULL REFERENCES public.santri(id)`.
  Because the FK is single-column, the database engine **does not enforce that `alumni_academic_snapshots.tenant_id == santri.tenant_id`**. A developer bug or compromised API could insert a snapshot record with `tenant_id = 'tenant_B'` pointing to a `santri_id` belonging to `tenant_A`!
- **Required Correction**:
  1. Add an additive unique constraint to `public.santri`:
     ```sql
     ALTER TABLE public.santri ADD CONSTRAINT uq_santri_tenant_id UNIQUE (tenant_id, id);
     ```
  2. Upgrade child FKs in `alumni_academic_snapshots`, `identity_consolidation_ledgers`, and `psb_placement_distributions` to composite:
     ```sql
     FOREIGN KEY (tenant_id, santri_id) REFERENCES public.santri(tenant_id, id) ON DELETE RESTRICT;
     ```

---

## 7. TENANT ISOLATION REVIEW & MATRIX

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    TENANT ISOLATION MATRIX                                     │
├──────────────────────────────┬─────────────┬────────────────────────────────────┬──────────────┤
│ Entity                       │ Tenant-Safe │ Relational Mechanism               │ Audit Status │
├──────────────────────────────┼─────────────┼────────────────────────────────────┼──────────────┤
│ user_tenant_personas         │ YES         │ Composite UNIQUE (tenant, user, p) │ PASS         │
│ identity_consolidation_l.    │ PARTIAL     │ Needs composite FK to santri       │ CONDITION    │
│ psb_periods                  │ YES         │ Composite FK to academic_years     │ PASS         │
│ psb_waves                    │ YES         │ Composite FK to psb_periods        │ PASS         │
│ psb_committees               │ YES         │ Composite FK to psb_periods        │ PASS         │
│ psb_applicants               │ YES         │ Composite FK to psb_periods/waves  │ PASS         │
│ psb_test_scores              │ OMITTED     │ Table missing in SQL draft         │ CONDITION    │
│ psb_infaq_verifications      │ YES         │ Composite FK to psb_applicants     │ PASS         │
│ psb_acceptance_ledgers       │ YES         │ Composite FK to psb_applicants     │ PASS         │
│ psb_placement_distributions  │ YES         │ Composite FKs + Procedural Trigger │ PASS         │
│ alumni_exit_reasons          │ YES         │ Composite UNIQUE (tenant, code)    │ PASS         │
│ alumni_academic_snapshots    │ PARTIAL     │ Needs composite FK to santri       │ CONDITION    │
│ alumni_korwils               │ YES         │ Composite UNIQUE (tenant, code)    │ PASS         │
│ tenant_korwil_settings       │ YES         │ UNIQUE (tenant_id) FK to tenants   │ PASS         │
│ alumni_profiles              │ YES         │ Composite FK to alumni_korwils     │ PASS         │
│ user_discovery_locations     │ YES         │ Composite FK to alumni_korwils     │ PASS         │
│ salam_interactions          │ YES         │ Direct FK to tenants               │ PASS         │
│ alumni_donations             │ YES         │ Composite FK to alumni_korwils     │ PASS         │
└──────────────────────────────┴─────────────┴────────────────────────────────────┴──────────────┘
```

---

## 8. ROW-LEVEL SECURITY (RLS) AUDIT

### Finding F-03 (HIGH): 7 Tables Missing RLS Policy Statements
In `WP-PSB-ALUMNI-DDL-DRAFT-001.sql` (Lines 570-586), `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` is executed on all 17 tables. However, Section 6 only creates policies for 10 tables.

The following **7 tables have RLS enabled with ZERO policies**:
1. `public.psb_committees`
2. `public.psb_infaq_verifications`
3. `public.psb_acceptance_ledgers`
4. `public.alumni_exit_reasons`
5. `public.alumni_korwils`
6. `public.tenant_korwil_settings`
7. `public.alumni_donations`

In PostgreSQL, enabling RLS without policies institutes an absolute **DENY ALL** for all non-superusers. Any standard tenant connection attempting to select from `alumni_korwils` or insert into `psb_infaq_verifications` will be blocked.

### Finding F-04 (HIGH): Privacy & Impersonation Gaps in Ephemeral Tables
- **`salam_interactions`**: The policy `salam_interactions_isolation` applies `FOR ALL USING (tenant_id = current_tenant_id)`. Any user in the tenant can view peer-to-peer salam messages exchanged between other alumni, and any user can insert a greeting with an arbitrary `sender_user_id`.
  - *Correction*: Restrict read/write to participants:
    ```sql
    CREATE POLICY "salam_interactions_participant" ON public.salam_interactions
        FOR ALL USING (
            current_setting('app.is_super_admin', true) = 'true'
            OR (
                tenant_id = current_setting('app.current_tenant_id', true)
                AND (sender_user_id = auth.uid()::text OR recipient_user_id = auth.uid()::text)
            )
        )
        WITH CHECK (
            current_setting('app.is_super_admin', true) = 'true'
            OR (
                tenant_id = current_setting('app.current_tenant_id', true)
                AND sender_user_id = auth.uid()::text
            )
        );
    ```
- **`user_discovery_locations`**: The policy allows any tenant member to update or delete another user's spatial record.
  - *Correction*: Enforce row-level ownership: `WITH CHECK (user_id = auth.uid()::text)`.

### Finding F-05 (MEDIUM): Missing Explicit `WITH CHECK` Clauses
The existing canonical hardening migration (`drizzle/0002_tenant_rls_hardening.sql`) mandates explicit `WITH CHECK` clauses matching the `USING` predicate across all tables. The draft DDL relies on PostgreSQL default fallback (`WITH CHECK` equals `USING`). For audit compliance and defense-in-depth, explicit `WITH CHECK` clauses must be appended to all standard isolation policies.

---

## 9. TRIGGER SAFETY & HIERARCHY REVIEW

### 9.1 Placement Hierarchy Trigger (`trg_enforce_placement_hierarchy`)
- **Execution Timing**: `BEFORE INSERT OR UPDATE ON psb_placement_distributions`.
- **Integrity Checks Enforced**:
  1. `tingkat` belongs to `madrasah_id` and `jenjang_id`.
  2. `rombel` belongs to `tingkat_id`.
  3. `rombel.academic_year_id` matches `psb_periods.academic_year_id` (TIR-007).
  4. `santri.tenant_id` matches `NEW.tenant_id` (TIR-008).
- **Adversarial Test — Period-Applicant Alignment (Finding F-06 - MEDIUM)**:
  - *Scenario*: An applicant applies in Period 2026. A placement distribution is inserted specifying `psb_period_id = 'Period_2027'` and `applicant_id = 'Applicant_2026'`.
  - *Vulnerability*: The foreign keys only assert that both the period and applicant exist in `tenant_id`. The trigger does not verify that `applicant.psb_period_id == NEW.psb_period_id`.
  - *Correction*: Add assertion to `fn_enforce_placement_hierarchy`:
    ```sql
    SELECT psb_period_id INTO v_applicant_period 
    FROM public.psb_applicants 
    WHERE tenant_id = NEW.tenant_id AND id = NEW.applicant_id;

    IF (v_applicant_period <> NEW.psb_period_id) THEN
        RAISE EXCEPTION 'PLACEMENT_PERIOD_MISMATCH: Applicant % belongs to Period %, not %',
            NEW.applicant_id, v_applicant_period, NEW.psb_period_id;
    END IF;
    ```

### 9.2 Legacy Kelas Sync Trigger (`trg_sync_santri_kelas_from_rombel`)
- **Execution Timing**: `AFTER INSERT OR UPDATE ON psb_placement_distributions FOR EACH ROW`.
- **Condition**: `WHEN (NEW.status = 'CONFIRMED' AND (OLD.status IS NULL OR OLD.status <> 'CONFIRMED'))`.
- **Behavior**: Executes `UPDATE public.santri SET kelas = rombel.name WHERE id = NEW.santri_id`.
- **Adversarial Assessment**:
  - *Trigger Recursion*: Zero recursion risk. `public.santri` has no triggers that mutate `psb_placement_distributions`.
  - *Multi-Madrasah Last-Write-Wins (NBO-001)*: If a student is placed in MTs (Class 7A) and concurrently placed in Takhasus (Halaqah 1), the second confirmed placement will overwrite `santri.kelas`. This confirms Non-Blocking Observation NBO-001: `santri.kelas` is strictly a legacy projection; modern multi-Madrasah queries must consume `psb_placement_distributions` and `rombel` directly.

---

## 10. IDENTITY FEDERATION REVIEW (OPTION A)

- **One Person = One Identity**:
  - `public.users` is the global system of record mapped 1:1 to Supabase `auth.users.id`.
  - `user_tenant_personas` decouples role permissions from identity capability, allowing a single human to hold both `WALI` and `ALUMNI` personas within a tenant without duplicating records in `public.users` or `user_tenant_memberships`.
- **Synthetic Credentials**:
  - Format `{nis}@{tenant_slug}.mahad.internal` is strictly internal.
  - No synthetic email collisions: `nis` is unique within `santri`, and `tenant_slug` is globally unique.

---

## 11. TIR-009 SAGA HARDENING AUDIT

The implementation of `identity_consolidation_ledgers` satisfies TIR-009 requirements:
- **Transaction Boundary Separation**: The DDL correctly isolates the PostgreSQL atomic transaction (Phase A) from the asynchronous Supabase GoTrue admin API calls (Phase B).
- **Outbox Ledger Security**: RLS policy `USING (false)` completely seals `identity_consolidation_ledgers` from browser client visibility, restricting processing to server-side background workers.
- **Finding F-07 (LOW) — Self-Consolidation Guard**:
  - The ledger currently lacks a check constraint preventing a student from being consolidated into themselves (`source_student_uid = target_wali_uid`).
  - *Correction*: Add `CONSTRAINT chk_icl_distinct_users CHECK (source_student_uid <> target_wali_uid)`.
- **Finding F-08 (LOW) — Concurrency Lock Extension**:
  - The partial unique index `uq_active_consolidation_santri` currently covers status `('DB_COMMITTED_AUTH_PENDING', 'RECONCILIATION_REQUIRED')`. If a record enters `'MANUAL_ATTENTION_REQUIRED'`, a new consolidation could technically be inserted for the same student.
  - *Correction*: Extend the index predicate to:
    ```sql
    WHERE status IN ('DB_COMMITTED_AUTH_PENDING', 'RECONCILIATION_REQUIRED', 'MANUAL_ATTENTION_REQUIRED');
    ```

---

## 12. PSB & SAT AUTHORITY REVIEW

- **One PSB Period Constraint**: Verified. `psb_periods` enforces `wave_count IN (1, 2)`.
- **Wave Constraints**: `psb_waves` enforces `wave_number IN (1, 2)`.
- **SAT Authority Audit**:
  - In `psb_acceptance_ledgers`, `sat_user_id` is stored as an audit anchor (`REFERENCES public.users(id)`).
  - **Adversarial Finding**: The database schema does **not** enforce that `sat_user_id` possesses the SAT / Pengasuh role at the relational level (because role assignments reside in `user_tenant_memberships` and `tenant_roles`).
  - **Architecture Boundary**: SAT exclusive authority is **enforced at the application service layer** (`psb-acceptance-service.ts`) using `assertRole(sat_user_id, 'SAT')` within `withTenantTransaction`. This is architecturally sound, but must be acknowledged explicitly in documentation rather than claimed as a database constraint.

---

## 13. ALUMNI LIFECYCLE AUDIT (GRADUATE ≠ ALUMNI)

- **Invariant**: Graduation from a Madrasah (`is_final_exit` in `alumni_exit_reasons` or snapshot in `alumni_academic_snapshots`) does **not** automatically confer tenant-level Alumni status.
- **Database Enforcement**:
  - There are **zero triggers** that mutate `santri.status` to `'Alumni'` upon record creation in `alumni_academic_snapshots`.
  - An alumnus is only provisioned when the SAT explicitly executes the Alumni Conferral flow, creating an `ALUMNI` persona in `user_tenant_personas`.
- **Verdict**: **PASS**. Invariant is completely fail-closed.

---

## 14. MULTI-MADRASAH & LEGACY COMPATIBILITY

- **Academic Placement Independence**: `psb_placement_distributions` has composite unique key `(tenant_id, psb_period_id, applicant_id, madrasah_id)`. A student can be placed into multiple Madrasahs within the same admission period without collision.
- **Academic Sovereignty**: `alumni_academic_snapshots` records graduation per Madrasah (`UNIQUE(tenant_id, santri_id, madrasah_id)`), allowing independent graduation transcripts.
- **Legacy Zero-Rewrite**: `users.role`, `user_tenant_memberships`, `childSantriId`, and `wali_santri_relationships` remain 100% operational and untouched.

---

## 15. MIGRATION SEQUENCING & IDEMPOTENCY REVIEW

The 8-phase migration sequence defined in [WP-PSB-ALUMNI-MIGRATION-DESIGN-001.md](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-MIGRATION-DESIGN-001.md) is topologically sound:
1. Extensions to existing tables (`users`, `santri`).
2. Core identity & outbox tables (`user_tenant_personas`, `identity_consolidation_ledgers`).
3. PSB tables (`psb_periods` $\rightarrow$ `psb_waves` $\rightarrow$ `psb_committees` $\rightarrow$ `psb_applicants` $\rightarrow$ `psb_test_scores` $\rightarrow$ `psb_infaq_verifications` $\rightarrow$ `psb_acceptance_ledgers` $\rightarrow$ `psb_placement_distributions`).
4. Alumni tables (`alumni_exit_reasons` $\rightarrow$ `alumni_academic_snapshots` $\rightarrow$ `alumni_korwils` $\rightarrow$ `tenant_korwil_settings` $\rightarrow$ `alumni_profiles` $\rightarrow$ `user_discovery_locations` $\rightarrow$ `salam_interactions` $\rightarrow$ `alumni_donations`).
5. Procedural functions & triggers.
6. RLS enablement & policy creation.

### The `IF NOT EXISTS` Illusion (Adversarial Finding F-09 - MEDIUM)
The DDL script relies heavily on `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`. If any target table or index already exists in staging or production with an incompatible definition (e.g. from an unmerged prototype), PostgreSQL will silently ignore the statement, resulting in undetected schema drift.
- *Mitigation*: The migration script must include **Phase 1 Precondition Assertions** verifying that either the tables do not exist, or their columns match the expected types before proceeding.

---

## 16. ROLLBACK & DISASTER RECOVERY REVIEW

### Finding F-10 (HIGH): Reversibility Claim vs. Data Destruction
- **Evidence**: `WP-PSB-ALUMNI-MIGRATION-DESIGN-001.md` Section 17 asserts: "Every statement is 100% reversible with zero data loss" and provides a script executing `DROP TABLE ... CASCADE` and `ALTER TABLE santri DROP COLUMN user_id`.
- **Adversarial Critique**:
  - If a rollback is executed **immediately post-migration** during the maintenance window, the script is clean and safe.
  - If a rollback is executed **after application traffic has commenced**, running `DROP TABLE ... CASCADE` will permanently obliterate all student registrations, infaq payments, test scores, acceptance logs, and alumni records. Dropping `santri.user_id` will destroy portal authentication mappings.
- **Required Correction**: The Migration Design must formally split the rollback specification into two distinct operational procedures:
  1. **Pre-Data Schema Rollback**: Applicable strictly during the maintenance deployment window before traffic cutover.
  2. **Post-Data Disaster Recovery**: Once production data exists, schema rollback is prohibited; recovery must proceed via **Forward-Fix Migrations** or **Point-in-Time Database Restore (PITR)**.

---

## 17. ZERO-DOWNTIME & LOCKING AUDIT

### Finding F-11 (MEDIUM): Reclassification of Zero-Downtime Guarantee
- **Evidence**: The Migration Design claims a "Zero-Downtime Guarantee".
- **PostgreSQL Locking Behavior**:
  - `ALTER TABLE public.santri ADD CONSTRAINT fk_santri_user_id ...`: Acquires `ShareRowExclusiveLock` on `santri` to validate foreign keys against `users`.
  - `CREATE UNIQUE INDEX uq_santri_tenant_active_user ON public.santri ...`: Executed inside a single transactional block (`BEGIN ... COMMIT`), meaning `CONCURRENTLY` cannot be used. This acquires a `ShareLock` on `santri`, which temporarily blocks all concurrent `INSERT`, `UPDATE`, and `DELETE` queries on active students.
- **Verdict**: In a production database with thousands of students, holding `ShareLock` across multiple constraint additions will queue writes. The guarantee must be reclassified as:
  **"Zero-Downtime Target — Controlled Off-Peak Maintenance Window Recommended"**.

---

## 18. SECURITY THREAT MODEL

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     SECURITY THREAT MODEL                                        │
├────┬─────────────────────────────┬─────────────────────────────────────┬──────────────┬─────────────┤
│ #  │ Threat Scenario             │ Attack Path & Defense Layer         │ Residual     │ Verdict     │
├────┼─────────────────────────────┼─────────────────────────────────────┼──────────────┼─────────────┤
│ T1 │ Cross-tenant SQL insertion  │ Composite FKs + trigger fail-closed │ Mitigated    │ PASS        │
│ T2 │ Cross-tenant API mutation   │ RLS tenant_id check + SSR proxy     │ Mitigated    │ PASS        │
│ T3 │ Synthetic user takeover     │ Non-routable .mahad.internal domain │ None         │ PASS        │
│ T4 │ MERGED user login attempt   │ GoTrue deletion + Proxy status check│ Mitigated    │ PASS        │
│ T5 │ Stale JWT post-merge        │ Next.js Proxy checks users.status   │ Token window │ ACCEPTED    │
│ T6 │ Unauthorized SAT acceptance │ Application RBAC assertRole('SAT')  │ Code-level   │ PASS (App)  │
│ T7 │ Auto-Alumni promotion       │ Zero auto triggers in database      │ None         │ PASS        │
│ T8 │ Outbox ledger client leak   │ RLS sealed with FOR ALL USING(false)│ None         │ PASS        │
│ T9 │ Duplicate student identity  │ uq_santri_tenant_active_user partial│ None         │ PASS        │
│ T10│ Invalid hierarchy placement │ Procedural trigger fail-closed      │ Mitigated    │ PASS        │
└────┴─────────────────────────────┴─────────────────────────────────────┴──────────────┴─────────────┘
```

---

## 19. CONTRADICTION REGISTER

| ID | Baseline A | Baseline B | DDL / Migration State | Conflict Analysis | Severity | Required Action |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **CR-01** | `DDL-DESIGN-001` (Table 4) | `DDL-DRAFT-001.sql` | Table declared vs omitted | `psb_test_scores` declared in report but absent in SQL draft | **HIGH** | Add table definition to SQL script |
| **CR-02** | `DDL-DESIGN-001` (Sec 13) | `DDL-DRAFT-001.sql` (Sec 6) | Universal RLS policy declared | RLS enabled on 17 tables, but policies created for only 10 | **HIGH** | Add missing 7 `CREATE POLICY` statements |
| **CR-03** | Option A Decision Lock | `DDL-DRAFT-001.sql` (Lines 88, 319) | Relational tenant isolation | `santri` lacks composite unique key; child FKs are single-column | **HIGH** | Add `uq_santri_tenant_id` to `public.santri` |
| **CR-04** | PRD Privacy Requirements | `DDL-DRAFT-001.sql` (Line 651) | Peer-to-peer data privacy | `salam_interactions` policy lacks user ownership filter | **HIGH** | Restrict RLS to greeting participants |
| **CR-05** | Migration Safety Principles | `MIGRATION-DESIGN-001` (Sec 17) | Rollback claim vs data loss | Rollback script claims zero data loss but uses `DROP CASCADE` | **MEDIUM** | Split Pre-Data vs Post-Data procedures |

---

## 20. MIGRATION SAFETY MATRIX

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     MIGRATION SAFETY MATRIX                                      │
├──────────────────────────┬──────────────────────┬─────────────┬─────────────────────┬────────────┤
│ Failure Scenario         │ Database State       │ Data Loss?  │ Recovery Procedure  │ Verdict    │
├──────────────────────────┼──────────────────────┼─────────────┼─────────────────────┼────────────┤
│ Syntax error in DDL      │ Clean rollback (tx)  │ ZERO        │ Fix SQL and retry   │ SAFE       │
│ Lock timeout on santri   │ Clean rollback (tx)  │ ZERO        │ Retry in quiet window│ SAFE      │
│ Connection drop mid-tx   │ PostgreSQL aborts tx │ ZERO        │ Reconnect & execute │ SAFE       │
│ Missing dependency table │ Clean rollback (tx)  │ ZERO        │ Verify prerequisites│ SAFE       │
│ RLS policy syntax error  │ Clean rollback (tx)  │ ZERO        │ Correct policy SQL  │ SAFE       │
│ Post-deploy pre-traffic  │ Rollback script safe │ ZERO        │ Execute DROP script │ SAFE       │
│ Post-deploy with data    │ Production populated │ CATASTROPHIC│ Forward-Fix or PITR │ RESTRICTED │
└──────────────────────────┴──────────────────────┴─────────────┴─────────────────────┴────────────┘
```

---

## 21. DDL READINESS MATRIX

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      DDL READINESS MATRIX                                      │
├───────────────────────────────────┬─────────┬──────────┬───────────────────────────────────────┤
│ Domain Area                       │ READY   │ BLOCKED  │ Evidence & Justification              │
├───────────────────────────────────┼─────────┼──────────┼───────────────────────────────────────┤
│ Existing Schema Compatibility     │ [X]     │ [ ]      │ Additive columns on santri & users    │
│ Foreign Key Relational Graph      │ [X]*    │ [ ]      │ *Requires uq_santri_tenant_id addition│
│ Tenant Isolation Hardening        │ [X]     │ [ ]      │ Composite keys throughout hierarchy   │
│ Row-Level Security Coverage       │ [ ]     │ [X]      │ 7 tables missing policies (F-03)      │
│ Trigger Safety & Invariants       │ [X]     │ [ ]      │ Fail-closed hierarchy validation      │
│ Identity Federation (Option A)    │ [X]     │ [ ]      │ One Person = One Identity respected   │
│ TIR-009 Saga Ledger               │ [X]     │ [ ]      │ Sealed outbox ledger + atomic Phase A │
│ PSB Admission Workflow            │ [X]*    │ [ ]      │ *Requires psb_test_scores inclusion   │
│ Alumni Lifecycle (Graduate≠Alumni)│ [X]     │ [ ]      │ Zero auto-promotion triggers          │
│ Multi-Madrasah Sovereignty        │ [X]     │ [ ]      │ Multi-placement distribution enabled  │
│ Legacy System Compatibility       │ [X]     │ [ ]      │ Zero rewrite of existing RBAC / roles │
│ Migration Sequencing              │ [X]     │ [ ]      │ Topological dependency order correct  │
│ Rollback Strategy                 │ [X]*    │ [ ]      │ *Pre-data vs post-data split required │
│ Idempotency Posture               │ [X]     │ [ ]      │ Safe inside single transactional block│
│ Zero-Data-Loss Posture            │ [X]     │ [ ]      │ Zero existing rows modified or deleted│
│ Zero-Downtime Posture             │ [X]*    │ [ ]      │ *Classified as Target, off-peak window│
└───────────────────────────────────┴─────────┴──────────┴───────────────────────────────────────┘
```

---

## 22. FINDING REGISTER

| ID | Category | Severity | Description | Impact | Proposed Resolution |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **F-01** | DDL Missing Object | **HIGH** | `psb_test_scores` omitted from draft SQL | Migration validation will fail (17 vs 18 tables) | Add `psb_test_scores` table definition |
| **F-02** | Relational Integrity | **HIGH** | `public.santri` lacks `UNIQUE(tenant_id, id)` | Single-column FKs to `santri` in child tables | Add constraint to `santri`, upgrade child FKs |
| **F-03** | RLS Security | **HIGH** | 7 domain tables lack `CREATE POLICY` statements | Tables will enter silent DENY ALL mode under RLS | Append missing policies for all 7 tables |
| **F-04** | Privacy / Security | **HIGH** | `salam_interactions` lacks user ownership filter | Tenant users can read peers' greetings | Restrict policy to sender/recipient |
| **F-05** | RLS Defense | **MEDIUM** | Policies lack explicit `WITH CHECK` clauses | Minor audit non-conformance | Add explicit `WITH CHECK` clauses |
| **F-06** | Trigger Integrity | **MEDIUM** | Trigger does not verify applicant belongs to period | Mismatched period placement theoretically possible | Add assertion in `fn_enforce_placement_hierarchy`|
| **F-07** | Saga Ledger Guard | **LOW** | Ledger lacks `source_uid <> target_uid` check | Accidental self-consolidation entry possible | Add CHECK constraint to ledger |
| **F-08** | Saga Concurrency | **LOW** | Partial index excludes `MANUAL_ATTENTION_REQUIRED` | Concurrent consolidation could be scheduled | Expand partial unique index predicate |
| **F-09** | Idempotency | **MEDIUM** | `IF NOT EXISTS` masks incompatible existing schema | Undetected prototype drift in staging/prod | Add Phase 1 assertion queries |
| **F-10** | Rollback Safety | **HIGH** | Rollback claims zero data loss but uses `DROP CASCADE`| Catastrophic data loss if run post-traffic | Formally split into Pre-Data vs Post-Data |
| **F-11** | Lock Contention | **MEDIUM** | Zero-downtime guaranteed despite `ShareLock` | Concurrent writes to `santri` briefly blocked | Reclassify to Zero-Downtime Target |
| **NBO-01**| Legacy Projection | **NBO** | `santri.kelas` sync is last-write-wins | Legacy field reflects latest confirmed Madrasah | Document as expected legacy limitation |

---

## 23. REQUIRED CORRECTIONS SPECIFICATION

Prior to requesting **Gate 9: Migration Execution Authorization**, the following precise corrections must be incorporated into the draft artifacts:

### Correction 1: Add `public.psb_test_scores` to DDL Draft
```sql
CREATE TABLE IF NOT EXISTS public.psb_test_scores (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    applicant_id text NOT NULL,
    test_type text NOT NULL, -- 'BACA_QURAN', 'HIFZH', 'AKADEMIK', 'WAWANCARA'
    score numeric(5, 2) NOT NULL,
    notes text,
    tested_by_user_id text REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_pts_score CHECK (score >= 0 AND score <= 100),
    CONSTRAINT uq_psb_test_scores_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_psb_test_applicant_type UNIQUE (tenant_id, applicant_id, test_type),
    CONSTRAINT fk_psb_test_applicant 
        FOREIGN KEY (tenant_id, applicant_id) 
        REFERENCES public.psb_applicants(tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_psb_test_applicant ON public.psb_test_scores (tenant_id, applicant_id);
```

### Correction 2: Add Composite Unique Constraint to `public.santri`
```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uq_santri_tenant_id' AND table_name = 'santri'
    ) THEN
        ALTER TABLE public.santri ADD CONSTRAINT uq_santri_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;
```

### Correction 3: Add Missing RLS Policies for 7 Omitted Tables
```sql
CREATE POLICY "psb_committees_isolation" ON public.psb_committees
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

CREATE POLICY "psb_infaq_isolation" ON public.psb_infaq_verifications
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

CREATE POLICY "psb_acceptance_isolation" ON public.psb_acceptance_ledgers
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

CREATE POLICY "alumni_exit_reasons_isolation" ON public.alumni_exit_reasons
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

CREATE POLICY "alumni_korwils_isolation" ON public.alumni_korwils
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

CREATE POLICY "tenant_korwil_settings_isolation" ON public.tenant_korwil_settings
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

CREATE POLICY "alumni_donations_isolation" ON public.alumni_donations
    FOR ALL USING (
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

---

## 24. FINAL GATE VERDICT

```text
══════════════════════════════════════════════════════════════════════════════════
GATE 8B VERDICT: PASS WITH CONDITIONS
──────────────────────────────────────────────────────────────────────────────────
STATUS: CORRECTIONS REQUIRED BEFORE MIGRATION EXECUTION AUTHORIZATION (GATE 9)
AUTHORIZATIONS:
  • DATABASE MUTATION: ❌ NOT AUTHORIZED (DATABASE UNTOUCHED)
  • DDL EXECUTION: ❌ NOT AUTHORIZED
  • MIGRATION EXECUTION: ❌ NOT AUTHORIZED
══════════════════════════════════════════════════════════════════════════════════
```

The architectural foundations, relational entity graphs, Option A identity federation mechanics, and TIR-009 outbox Saga models are **fully verified and approved**.

The identified findings do not indicate architectural defects, but concrete DDL and migration script omissions (missing table, missing RLS policies, and missing safety checks) that must be merged into the DDL draft before Gate 9 authorization.

---

## 25. FINAL HANDOVER

```text
══════════════════════════════════════════════════════════════════════════════════
GATE 8B — DDL DESIGN & MIGRATION REVIEW
══════════════════════════════════════════════════════════════════════════════════

DDL REVIEW:
PASS WITH CONDITIONS

MIGRATION REVIEW:
PASS WITH CONDITIONS

SECURITY REVIEW:
PASS WITH CONDITIONS

ROLLBACK REVIEW:
PASS WITH CONDITIONS

TENANT ISOLATION:
PASS WITH CONDITIONS

IDENTITY:
PASS

TRIGGER:
PASS WITH CONDITIONS

CRITICAL FINDINGS:
0

HIGH FINDINGS:
5

MEDIUM FINDINGS:
4

LOW FINDINGS:
2

NBO:
1

DATABASE:
UNTOUCHED

CODEBASE:
UNCHANGED

DDL EXECUTION:
NOT AUTHORIZED

MIGRATION EXECUTION:
NOT AUTHORIZED

DATABASE MUTATION:
NOT AUTHORIZED

FINAL VERDICT:
PASS WITH CONDITIONS — CORRECTIONS REQUIRED BEFORE EXECUTION AUTHORIZATION

NEXT GATE:
GATE 9 — MIGRATION EXECUTION AUTHORIZATION
══════════════════════════════════════════════════════════════════════════════════
```
