# WP-PSB-ALUMNI — DDL DESIGN REPORT (REMEDIATED)

```text
══════════════════════════════════════════════════════════════════════════════════
WORK PACKAGE: WP-PSB-ALUMNI-SCHEMA-001
DOCUMENT: docs/architecture/WP-PSB-ALUMNI-DDL-DESIGN-001.md
TITLE: Authoritative DDL Design & Technical Schema Specification (Gate 8B Remediated)
GATE: GATE 8B REMEDIATION — DESIGN ARTIFACT CORRECTION
STATUS: REMEDIATION COMPLETED — READY FOR GATE 8B RE-AUDIT
AUTHORIZATION STATUS:
  • IMPLEMENTATION: ❌ NOT AUTHORIZED
  • DDL EXECUTION: ❌ NOT AUTHORIZED
  • MIGRATION EXECUTION: ❌ NOT AUTHORIZED
  • DATABASE MUTATION: ❌ FORBIDDEN (DATABASE UNTOUCHED)
  • FRONTEND DEVELOPMENT: ❌ NOT AUTHORIZED
PRINCIPLE: ARCHITECTURE LOCKED -> DDL TRANSLATION ONLY (ZERO REWRITE)
══════════════════════════════════════════════════════════════════════════════════
```

---

## 1. EXECUTIVE SUMMARY

This document provides the **authoritative, remediated DDL Design Specification** for Work Package `WP-PSB-ALUMNI-SCHEMA-001`.

Following the forensic findings of the Gate 8B Adversarial Audit ([WP-PSB-ALUMNI-GATE-8B-DDL-MIGRATION-REVIEW.md](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-GATE-8B-DDL-MIGRATION-REVIEW.md)), this design specification has been fully remediated:
1. **Object Count Normalized (18 Tables)**: Fully integrates `psb_test_scores` into the PSB admission workflow (closing F-01).
2. **Relational Tenant Keys on `public.santri` (F-02)**: Introduces additive `uq_santri_tenant_id UNIQUE (tenant_id, id)` on `public.santri`, upgrading child FKs in `alumni_academic_snapshots`, `identity_consolidation_ledgers`, and `psb_placement_distributions` to composite foreign keys.
3. **Complete RLS Coverage (F-03 & F-05)**: Establishes explicit, intentional RLS policies with matching `USING` and `WITH CHECK` clauses across all 18 new tables.
4. **Peer Privacy & Impersonation Prevention (F-04)**: Hardens `salam_interactions` to participant-only access (`auth.uid()`) and restricts `user_discovery_locations` mutation strictly to row owners.
5. **Applicant-Period Trigger Integrity (F-06)**: Extends `fn_enforce_placement_hierarchy` to assert that applicants belong strictly to the placement's PSB period.
6. **Saga Guard & Concurrency (F-07 & F-08)**: Adds self-consolidation check constraint and expands partial unique index coverage over `MANUAL_ATTENTION_REQUIRED`.
7. **Rollback & Downtime Reclassification (F-10 & F-11)**: Segregates Pre-Data Rollbacks from Post-Data Disaster Recovery, and reclassifies zero-downtime to a controlled target.

---

## 2. LOCKED BASELINES

This DDL design strictly operationalizes:
1. **PRD — APP MA'HAD: PSB & Alumni Ecosystem**: One PSB per tenant, wave count strictly 1 or 2, SAT exclusive acceptance and alumni conferral, Madrasah sovereignty, ephemeral discovery with 6-hour TTL.
2. **WP-PSB-ALUMNI-SCHEMA-001-DESIGN-V3.md**: Target relational entity catalog.
3. **Option A Decision Lock**: Universal Supabase Auth with synthetic internal credentials (`{nis}@{tenant}.mahad.internal`).
4. **TIR-009 Saga Hardening**: DB-Atomic Phase A followed by external GoTrue Phase B reconciliation.
5. **Contract Gap Closures (CG-001 through CG-008)**: Additive `santri.user_id`, `users.status = 'MERGED'`, `user_tenant_personas`, outbox ledger, audit repository adapter, SAT lifecycle gate, `santri.kelas` sync, and placement hierarchy trigger.
6. **Gate 8B Audit Remediation Directives**: Findings F-01 through F-11.

---

## 3. EXISTING SCHEMA EVIDENCE

Empirical audit of the active repository confirms the following foundations:
- **`src/lib/db/schema.ts`**:
  - `tenants`: `id text PRIMARY KEY`, `slug text UNIQUE`.
  - `santri`: `id text PRIMARY KEY`, `nis text UNIQUE`, `kelas text NOT NULL`, `status text DEFAULT 'Aktif'`. Receives additive `user_id` and `uq_santri_tenant_id`.
  - `audit_logs`: `id text PRIMARY KEY`, `details text` (JSON string).
- **`src/lib/db/schema/identity.ts`**:
  - `users`: `id text PRIMARY KEY` (maps to `auth.users.id`), `email text UNIQUE`, `status text DEFAULT 'ACTIVE'`. Receives additive `merged_into_user_id` and check constraint.
  - `user_tenant_memberships`: Unique on `(user_id, tenant_id)`, single `primary_role_id`. Preserved without rewrite.
- **`src/lib/db/schema/academic_structure.ts`**:
  - Frozen Level-4: `madrasah`, `jenjang`, `tingkat`, `rombel`. Composite keys present on all tables.
- **`src/lib/db/schema/academic_workspace.ts`**:
  - `academic_years`: `id text PRIMARY KEY`, `uq_academic_years_tenant_id UNIQUE (tenant_id, id)`.

---

## 4. TARGET SCHEMA DELTA (EXACTLY 18 NEW TABLES)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       TARGET SCHEMA DELTA                                              │
├────────────────────────────┬──────────────────────┬────────────────────────────────────────────────────┤
│ Target Entity              │ Modification Type    │ Key Columns / Constraints                          │
├────────────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ public.users               │ ADDITIVE EXTENSION   │ + merged_into_user_id, chk_users_merged_not_self   │
│ public.santri              │ ADDITIVE EXTENSION   │ + user_id, uq_santri_tenant_id (tenant_id, id)     │
│ user_tenant_personas       │ NEW CORE TABLE (1)   │ (tenant_id, user_id, persona_type) UNIQUE         │
│ identity_consolidation_l.  │ NEW SAGA TABLE (2)   │ (santri_id) PARTIAL UNIQUE, chk_icl_distinct_users │
│ psb_periods                │ NEW PSB TABLE (3)    │ wave_count CHECK (1, 2), composite FK to year      │
│ psb_waves                  │ NEW PSB TABLE (4)    │ wave_number CHECK (1, 2), composite FK to period   │
│ psb_committees             │ NEW PSB TABLE (5)    │ (tenant_id, psb_period_id, user_id) UNIQUE         │
│ psb_applicants             │ NEW PSB TABLE (6)    │ registration_number UNIQUE, intake target_madrasahs│
│ psb_test_scores            │ NEW PSB TABLE (7)    │ (tenant, applicant, test_type) UNIQUE, 0-100 check │
│ psb_infaq_verifications    │ NEW PSB TABLE (8)    │ (tenant_id, applicant_id) UNIQUE, verified status  │
│ psb_acceptance_ledgers     │ NEW PSB TABLE (9)    │ sat_user_id FK, official_nis UNIQUE per tenant     │
│ psb_placement_distribut.   │ NEW PSB TABLE (10)   │ (applicant_id, madrasah_id) UNIQUE per period      │
│ alumni_exit_reasons        │ NEW ALUMNI TABLE (11)│ code UNIQUE per tenant, is_final_exit              │
│ alumni_academic_snapshots  │ NEW ALUMNI TABLE (12)│ (tenant, santri, madrasah) UNIQUE, composite FKs   │
│ alumni_korwils             │ NEW ALUMNI TABLE (13)│ code UNIQUE per tenant, regencies JSONB            │
│ tenant_korwil_settings     │ NEW ALUMNI TABLE (14)│ tenant_id UNIQUE, auto_transfer_enabled            │
│ alumni_profiles            │ NEW ALUMNI TABLE (15)│ user_id UNIQUE, domicile_address (internal only)   │
│ user_discovery_locations   │ NEW ALUMNI TABLE (16)│ user_id UNIQUE per tenant, 6-hour TTL cache        │
│ salam_interactions         │ NEW ALUMNI TABLE (17)│ sender <> recipient, participant-only RLS          │
│ alumni_donations           │ NEW ALUMNI TABLE (18)│ campaign_id, amount > 0, status lifecycle          │
└────────────────────────────┴──────────────────────┴────────────────────────────────────────────────────┘
Total Additions: 18 New Domain/Core Tables + 2 Existing Table Additive Extensions
```

---

## 5. TABLE-BY-TABLE DESIGN

Authoritative SQL implementation is maintained in [WP-PSB-ALUMNI-DDL-DRAFT-001.sql](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-DDL-DRAFT-001.sql).

### 5.1 `public.users` (Additive Modification)
- `merged_into_user_id`: `text NULL REFERENCES public.users(id) ON DELETE RESTRICT`. Tracks the surviving canonical UID when a synthetic account is consolidated.
- `chk_users_merged_not_self`: `CHECK (merged_into_user_id IS NULL OR merged_into_user_id <> id)`. Eliminates self-reference loops.
- `status`: Supports terminal status `'MERGED'`.

### 5.2 `public.santri` (Additive Modification)
- `user_id`: `text NULL REFERENCES public.users(id) ON DELETE RESTRICT`. Populated upon SAT matriculation.
- `uq_santri_tenant_id`: `UNIQUE (tenant_id, id)`. Relational anchor enabling tenant-safe composite foreign keys in child tables.
- `uq_santri_tenant_active_user`: Partial unique index on `(tenant_id, user_id) WHERE status = 'Aktif' AND user_id IS NOT NULL`.

### 5.3 `public.user_tenant_personas` (Core Table 1)
- Models lifestyle portal capabilities: `WALI`, `SANTRI`, `ALUMNI`.
- Primary Key: `id text`. Composite Unique: `(tenant_id, user_id, persona_type)`.

### 5.4 `public.identity_consolidation_ledgers` (Core Table 2 - Saga Outbox)
- Tracks TIR-009 Saga state: `DB_COMMITTED_AUTH_PENDING`, `RECONCILIATION_REQUIRED`, `CONSOLIDATION_COMPLETED`, `MANUAL_ATTENTION_REQUIRED`.
- Composite FK to santri: `FOREIGN KEY (tenant_id, santri_id) REFERENCES public.santri(tenant_id, id) ON DELETE RESTRICT`.
- Invariant: `CHECK (source_student_uid <> target_wali_uid)`.
- Sealed by RLS `FOR ALL USING (false) WITH CHECK (false)`.

### 5.5 PSB Entities (Tables 3 to 10)
- `psb_periods`: Academic year bridge with strict `wave_count IN (1, 2)`.
- `psb_waves`: Sub-cycles with `wave_number IN (1, 2)` and composite FK to period.
- `psb_committees`: Committee membership scoped to tenant and period.
- `psb_applicants`: Prospective students. `target_madrasahs` is an internal Panitia intake assessment notes field (`DEFAULT '[]'::jsonb NOT NULL`), NOT a parent selection field.
- `psb_test_scores` (Restored - F-01): Scores per test type (`0 <= score <= 100`) linked via composite FK to `psb_applicants`.
- `psb_infaq_verifications`: Transfer proofs and verified status.
- `psb_acceptance_ledgers`: Exclusive SAT matriculation record storing `sat_user_id` and official NIS.
- `psb_placement_distributions`: Academic distribution to Madrasah/Rombel. Validated by composite FKs and trigger `trg_enforce_placement_hierarchy`.

### 5.6 Alumni Entities (Tables 11 to 18)
- `alumni_exit_reasons`: Catalog of exit codes (`is_final_exit boolean`).
- `alumni_academic_snapshots`: Immutable graduation transcripts per Madrasah. Composite FK `(tenant_id, santri_id)` to `santri`.
- `alumni_korwils`: Regional chapter jurisdictions (`regencies jsonb`).
- `tenant_korwil_settings`: Auto-transfer and approval toggles per tenant.
- `alumni_profiles`: Directory profile. `domicile_address` is strictly internal profile data (not exposed in public discovery).
- `user_discovery_locations`: Ephemeral coarse location cache with 6-hour TTL (`expires_at`).
- `salam_interactions`: Peer greetings with cooldown, participant-only privacy.
- `alumni_donations`: Campaign endowment donations.

---

## 6. PRIMARY KEYS SPECIFICATION

- All tables utilize deterministic text primary keys generated by the application layer using high-entropy prefixes (e.g. `psb_per_...`, `alumni_snap_...`, UUIDv7).
- Guarantees database engine portability and eliminates auto-increment sequence race conditions during distributed seeding.

---

## 7. FOREIGN KEYS SPECIFICATION

All foreign keys are explicitly defined with fail-safe referential action rules:
- **`ON DELETE RESTRICT`**: Applied to all permanent institutional records (`santri_id`, `users.id`, `madrasah_id`, `psb_period_id`) to prevent accidental cascade deletion of audit trails.
- **`ON DELETE CASCADE`**: Restricted strictly to owned child sub-entities (e.g. `psb_waves` cascading on `psb_periods`, `user_discovery_locations` cascading on `users`).
- **`ON DELETE SET NULL`**: Applied to non-critical administrative audit associations (`verified_by_user_id`, `confirmed_by_user_id`, `donor_user_id`, `tested_by_user_id`).

---

## 8. COMPOSITE FOREIGN KEYS (TENANT ISOLATION)

To ensure that tenant boundaries cannot be breached via foreign keys, all child-to-parent associations utilize **relational composite foreign keys**:
- `public.psb_periods`:
  - `(tenant_id, academic_year_id) REFERENCES academic_years(tenant_id, id)`
- `public.psb_waves`:
  - `(tenant_id, psb_period_id) REFERENCES psb_periods(tenant_id, id)`
- `public.psb_committees`:
  - `(tenant_id, psb_period_id) REFERENCES psb_periods(tenant_id, id)`
- `public.psb_applicants`:
  - `(tenant_id, psb_period_id) REFERENCES psb_periods(tenant_id, id)`
  - `(tenant_id, wave_id) REFERENCES psb_waves(tenant_id, id)`
- `public.psb_test_scores`:
  - `(tenant_id, applicant_id) REFERENCES psb_applicants(tenant_id, id)`
- `public.psb_infaq_verifications`:
  - `(tenant_id, applicant_id) REFERENCES psb_applicants(tenant_id, id)`
- `public.psb_acceptance_ledgers`:
  - `(tenant_id, applicant_id) REFERENCES psb_applicants(tenant_id, id)`
- `public.psb_placement_distributions`:
  - `(tenant_id, psb_period_id) REFERENCES psb_periods(tenant_id, id)`
  - `(tenant_id, psb_period_id, applicant_id) REFERENCES psb_applicants(tenant_id, psb_period_id, id)`
  - `(tenant_id, santri_id) REFERENCES santri(tenant_id, id)` (F-02)
  - `(tenant_id, madrasah_id) REFERENCES madrasah(tenant_id, id)`
  - `(tenant_id, madrasah_id, jenjang_id) REFERENCES jenjang(tenant_id, madrasah_id, id)`
  - `(tenant_id, tingkat_id) REFERENCES tingkat(tenant_id, id)`
  - `(tenant_id, rombel_id) REFERENCES rombel(tenant_id, id)`
- `public.alumni_academic_snapshots`:
  - `(tenant_id, santri_id) REFERENCES santri(tenant_id, id)` (F-02)
  - `(tenant_id, madrasah_id) REFERENCES madrasah(tenant_id, id)`
  - `(tenant_id, madrasah_id, last_jenjang_id) REFERENCES jenjang(tenant_id, madrasah_id, id)`
  - `(tenant_id, last_tingkat_id) REFERENCES tingkat(tenant_id, id)`
  - `(tenant_id, exit_reason_id) REFERENCES alumni_exit_reasons(tenant_id, id)`
- `public.identity_consolidation_ledgers`:
  - `(tenant_id, santri_id) REFERENCES santri(tenant_id, id)` (F-02)
- `public.alumni_profiles`:
  - `(tenant_id, korwil_id) REFERENCES alumni_korwils(tenant_id, id)`
- `public.user_discovery_locations`:
  - `(tenant_id, origin_korwil_id) REFERENCES alumni_korwils(tenant_id, id)`
  - `(tenant_id, current_korwil_id) REFERENCES alumni_korwils(tenant_id, id)`
- `public.alumni_donations`:
  - `(tenant_id, donor_origin_korwil_id) REFERENCES alumni_korwils(tenant_id, id)`

---

## 9. UNIQUE CONSTRAINTS

- `uq_santri_tenant_id`: `UNIQUE (tenant_id, id)` on `public.santri` (F-02)
- `uq_psb_periods_tenant_id`: `UNIQUE (tenant_id, id)`
- `uq_psb_waves_period_number`: `UNIQUE (tenant_id, psb_period_id, wave_number)`
- `uq_psb_applicants_reg_num`: `UNIQUE (tenant_id, registration_number)`
- `uq_psb_applicants_tenant_period`: `UNIQUE (tenant_id, psb_period_id, id)`
- `uq_psb_test_applicant_type`: `UNIQUE (tenant_id, applicant_id, test_type)` (F-01)
- `uq_psb_acceptance_nis`: `UNIQUE (tenant_id, official_nis)`
- `uq_psb_dist_placement`: `UNIQUE (tenant_id, psb_period_id, applicant_id, madrasah_id)`
- `uq_alumni_snapshots_record`: `UNIQUE (tenant_id, santri_id, madrasah_id)`
- `uq_user_tenant_persona`: `UNIQUE (tenant_id, user_id, persona_type)`
- `uq_active_consolidation_santri`: `PARTIAL UNIQUE ON (santri_id) WHERE status IN ('DB_COMMITTED_AUTH_PENDING', 'RECONCILIATION_REQUIRED', 'MANUAL_ATTENTION_REQUIRED')` (F-08)

---

## 10. CHECK CONSTRAINTS

- `chk_users_merged_not_self`: `CHECK (merged_into_user_id IS NULL OR merged_into_user_id <> id)` on `public.users` (F-07)
- `chk_icl_distinct_users`: `CHECK (source_student_uid <> target_wali_uid)` on `identity_consolidation_ledgers` (F-07)
- `chk_icl_attempts`: `CHECK (attempt_count >= 0)`
- `chk_pts_score`: `CHECK (score >= 0 AND score <= 100)` on `psb_test_scores` (F-01)
- `chk_psb_periods_wave_count`: `CHECK (wave_count IN (1, 2))`
- `chk_psb_waves_number`: `CHECK (wave_number IN (1, 2))`
- `chk_psb_applicants_gender`: `CHECK (gender IN ('L', 'P'))`
- `chk_salam_peers`: `CHECK (sender_user_id <> recipient_user_id)`
- `chk_salam_status`: `CHECK (status IN ('DELIVERED', 'READ', 'EXPIRED'))`
- `chk_alumni_donations_amount`: `CHECK (amount > 0)`

---

## 11. INDEXES DESIGN

Performance indexes are placed on foreign keys, lookup combinations, and worker queues:
- `idx_santri_tenant_user_id`: `(tenant_id, user_id)`
- `idx_utp_tenant_persona`: `(tenant_id, persona_type, status)`
- `idx_icl_worker_queue`: Partial index on pending/unresolved ledgers `(status, created_at)`
- `idx_psb_test_applicant`: `(tenant_id, applicant_id)`
- `idx_alumni_profiles_directory`: `(tenant_id, korwil_id, is_public, hide_profile)`
- `idx_discovery_expiry`: `(expires_at)` for background TTL purge
- `idx_salam_cooldown`: `(tenant_id, sender_user_id, recipient_user_id, expires_at)`

---

## 12. TRIGGER DESIGN

Two procedural triggers are defined in `WP-PSB-ALUMNI-DDL-DRAFT-001.sql`:

### 12.1 Placement Hierarchy Integrity Trigger (`trg_enforce_placement_hierarchy`)
- **Table**: `psb_placement_distributions`
- **Timing**: `BEFORE INSERT OR UPDATE`
- **Checks Enforced**:
  1. `tingkat.madrasah_id == NEW.madrasah_id` AND `tingkat.jenjang_id == NEW.jenjang_id`
  2. `rombel.tingkat_id == NEW.tingkat_id`
  3. `rombel.academic_year_id == psb_periods.academic_year_id` (TIR-007)
  4. `santri.tenant_id == NEW.tenant_id` (TIR-008)
  5. `applicant.psb_period_id == NEW.psb_period_id` (F-06)
- **Failure**: `RAISE EXCEPTION` aborts transaction fail-closed.

### 12.2 Legacy Kelas Sync Trigger (`trg_sync_santri_kelas_from_rombel`)
- **Table**: `psb_placement_distributions`
- **Timing**: `AFTER INSERT OR UPDATE`
- **Behavior**: When `NEW.status = 'CONFIRMED'`, executes `UPDATE public.santri SET kelas = rombel.name` for the associated student.
- **NBO-001 Assessment**: Operates on a Last-Write-Wins basis under concurrent multi-Madrasah placements. Retained strictly for legacy backward compatibility. Modern queries consume `psb_placement_distributions` and `rombel` directly.

---

## 13. ROW-LEVEL SECURITY (RLS) DESIGN (ALL 18 TABLES)

- Every new domain table has `ENABLE ROW LEVEL SECURITY`.
- Intentional, explicit policies defined across all 18 tables with matching `USING` and `WITH CHECK` clauses:
  1. `identity_consolidation_ledgers`: `FOR ALL USING (false) WITH CHECK (false)`. Sealed server-only outbox table.
  2. `salam_interactions`: Strictly restricted to participants:
     - `USING ((sender_user_id = auth.uid()::text OR recipient_user_id = auth.uid()::text) AND tenant_id = ...)`
     - `WITH CHECK (sender_user_id = auth.uid()::text AND tenant_id = ...)`
  3. `user_discovery_locations`:
     - `SELECT`: active unexpired locations within tenant.
     - `INSERT / UPDATE / DELETE`: strictly row owner `user_id = auth.uid()::text`.
  4. `alumni_profiles`:
     - `SELECT`: public profiles within tenant OR self (`user_id = auth.uid()::text`).
     - `WRITE`: strictly row owner `user_id = auth.uid()::text`.
  5. Standard Tenant Isolation Policies for remaining 14 tables with explicit `WITH CHECK`.

### 13.0 POLICY IDEMPOTENCY SPECIFICATION (F-09-B)

Because PostgreSQL lacks `CREATE POLICY IF NOT EXISTS`, all 20 explicit policies are preceded by:
```sql
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
CREATE POLICY "policy_name" ON public.table_name ...
```
This guarantees deterministic, crash-free re-runs under Case B (compatible schema) while preserving all tenant isolation, row ownership, peer privacy in `salam_interactions`, and sealed ledger invariants.

### 13.1 RLS IS NOT BUSINESS AUTHORIZATION (TWO-LAYER DEFENSE ARCHITECTURE)

A fundamental architectural principle of APP MA'HAD is the strict separation between database tenant isolation and domain authorization:

> **RLS tenant isolation MUST NOT be interpreted as proof of business authorization.**

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             TWO-LAYER SECURITY & AUTHORIZATION MODEL                             │
├──────────────────────────┬─────────────────────────────────────┬─────────────────────────────────┤
│ Security Dimension       │ Layer 1: Database RLS Isolation     │ Layer 2: Application / RBAC     │
├──────────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│ Execution Environment    │ PostgreSQL Kernel (Row-Level)       │ Next.js Proxy / Server Action   │
│ Identity Context         │ current_tenant_id, auth.uid()       │ user_tenant_memberships, roles  │
│ Primary Objective        │ Prevent cross-tenant data leakage   │ Enforce business role authority │
│ Scope of Guarantee       │ Row belongs to tenant & row owner   │ Actor is permitted this action  │
│ Bypass Consequence       │ Catastrophic multi-tenant breach    │ Unauthorized domain mutation    │
└──────────────────────────┴─────────────────────────────────────┴─────────────────────────────────┘
```

A query that satisfies an RLS tenant isolation policy proves ONLY that the data row belongs to the caller's tenant. It provides **zero proof** that the caller holds the administrative or institutional authority (e.g. SAT, Panitia, Bendahara, Musyrif, or Pengurus Korwil) required to perform the business transaction!

### 13.2 DOMAIN AUTHORIZATION AUDIT MATRIX (8 SENSITIVE ENTITIES)

```text
┌─────────────────────────────┬───────────────────────────────┬─────────────────────────────────┬───────────────────────────────┬──────────────────────────────┐
│ Sensitive Entity            │ What RLS Guarantees           │ What RLS Does NOT Guarantee     │ Authorized Business Actor     │ Enforcement Layer            │
├─────────────────────────────┼───────────────────────────────┼─────────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ psb_committees              │ Tenant data boundary          │ Caller is Ketua Panitia / Admin │ Ma'had Admin / SAT            │ Service Layer (assertRole)   │
│ psb_infaq_verifications     │ Tenant data boundary          │ Caller is authorized Bendahara  │ Bendahara Panitia             │ Service Layer (assertRole)   │
│ psb_acceptance_ledgers      │ Tenant data boundary          │ sat_user_id is valid SAT actor  │ SAT (Pimpinan Pesantren)      │ Service Layer (assertRole)   │
│ psb_placement_distributions │ Tenant data boundary          │ Caller is Panitia / Madrasah Ad.│ Panitia & Madrasah Admin      │ Service Layer (assertRole)   │
│ alumni_donations            │ Tenant data boundary          │ Chapter destination scoping     │ Donors, Bendahara Korwil/Pusat│ Service Layer (scope filter) │
│ alumni_korwils              │ Tenant data boundary          │ Caller is Pengurus Pusat        │ Pengurus Pusat / Admin Alumni │ Service Layer (assertRole)   │
│ tenant_korwil_settings      │ Tenant data boundary          │ Caller is Super Administrator   │ Tenant Super Administrator    │ Service Layer (assertRole)   │
│ alumni_profiles             │ Tenant boundary & self-edit   │ Public privacy projection       │ Profile Owner & Directory DTO │ Service Layer (DTO sanitize) │
└─────────────────────────────┴───────────────────────────────┴─────────────────────────────────┴───────────────────────────────┴──────────────────────────────┘
```

**Crucial Invariant Regarding `sat_user_id`**:
In `psb_acceptance_ledgers`, `sat_user_id` is defined as a foreign key referencing `public.users(id)`. The database engine does **not** possess relational knowledge of who holds the SAT role. Therefore, `sat_user_id` serves strictly as an **audit and actor attribution anchor**. Proof of SAT authority is exclusively verified by the application service layer prior to transaction dispatch.

### 13.3 ALUMNI DONATION DESTINATION SCOPE ANALYSIS (SCHEMA/DOMAIN GAP)

- **Domain Rule**: Alumni endowment campaigns may have distinct destination scopes: `A_PUSAT` (central foundation), `KORWIL` (regional chapter), `PROGRAM` (specific educational program), or `ACTIVITY` (event/reunion). A regional chapter treasurer (`Bendahara Korwil`) must only have administrative visibility over donations bound to their specific Korwil.
- **Relational Status**: `public.alumni_donations` contains `campaign_id` and `donor_origin_korwil_id`. It does not store a dedicated `destination_scope` enum column.
- **Classification**: **SCHEMA/DOMAIN AUTHORIZATION GAP**.
- **Architectural Boundary**:
  - **Database RLS**: Enforces overall tenant isolation (all donations belong to Ma'had).
  - **Domain Authorization**: Destination-scope filtering (restricting chapter treasurers from inspecting central foundation donation totals) is enforced at the **application service layer** via query predicates filtering on `campaign_id` and `donor_origin_korwil_id`.

---

## 14. TENANT ISOLATION ANALYSIS

Tenant isolation is guarded by four defense layers:
1. Application layer sets `withTenantTransaction`.
2. PostgreSQL composite foreign keys enforce `(tenant_id, id)` across all relationships (including `public.santri`).
3. Procedural trigger verifies `santri.tenant_id == NEW.tenant_id` and `applicant.psb_period_id == NEW.psb_period_id`.
4. PostgreSQL RLS policies evaluate `app.current_tenant_id` and JWT claims with explicit `WITH CHECK`.

---

## 15. IDENTITY FEDERATION & OPTION A SUPPORT

- Students receive synthetic credentials: `{nis}@{tenant_slug}.mahad.internal`.
- Binds 1:1 with `public.users.id` and `public.santri.user_id`.
- Outbound mail dispatchers suppress `.internal` addresses.

---

## 16. TIR-009 SAGA INTEGRATION SUPPORT

- **Phase A**: Commits `user_tenant_personas`, re-points snapshots, sets student `users.status = 'MERGED'`, and records `identity_consolidation_ledgers`.
- **Phase B**: Deletes GoTrue synthetic credential via Supabase Admin API.
- If Phase B drops, background worker reconciles asynchronously via partial index queue covering `DB_COMMITTED_AUTH_PENDING`, `RECONCILIATION_REQUIRED`, and `MANUAL_ATTENTION_REQUIRED`.

---

## 17. ALUMNI LIFECYCLE SUPPORT

- **Graduate $\neq$ Alumni**: `alumni_academic_snapshots` records `Lulus Jenjang` without altering `santri.status`.
- SAT exclusive authority: Database stores audit anchor `sat_user_id`; application service layer enforces SAT role authorization. Zero automated trigger promotions.

---

## 18. PLACEMENT INTEGRITY SUPPORT

- Protects the complete 5-level hierarchy tree: `Tenant -> Academic Year -> Madrasah -> Jenjang -> Tingkat -> Rombel`.
- Placement distribution is verified fail-closed at the database engine level by `trg_enforce_placement_hierarchy`.

---

## 19. MULTI-MADRASAH COMPATIBILITY

- Applicants receive independent placement distribution rows per Madrasah: `(applicant_id, madrasah_id)`.
- Snapshots record graduation per Madrasah: `(santri_id, madrasah_id)`.

---

## 20. LEGACY COMPATIBILITY

- `santri.kelas`: Retained as `text NOT NULL`; synchronized automatically from `rombel.name` (NBO-001 Last-Write-Wins projection).
- `users.role`: Retained with `@deprecated` tag.
- `user_tenant_memberships`: Retained for administrative RBAC; `user_tenant_personas` adds multi-persona capability.
- `audit_logs`: Reused via `auditRepository.create(entry, txClient)`.

---

## 21. DATA MIGRATION IMPLICATIONS

- `public.santri.user_id`: Added as `NULL` to avoid migration failures on existing rows.
- `public.users.merged_into_user_id`: Added as `NULL`.
- Zero existing rows are mutated during DDL execution.

---

## 22. BACKFILL STRATEGY

- **Historical Santri**: Backfill of `santri.user_id` is **optional and deferred**. Existing Santri continue operating normally. When a student portal is provisioned or an alumnus is conferred, the `user_id` is created and bound on-demand.
- **Legacy Kelas**: Unchanged. Existing strings remain valid.

---

## 23. ROLLBACK STRATEGY (F-10 SEGREGATION & ZERO DATA LOSS TARGET)

- **Post-Data Loss Posture**: **Zero Data Loss Target Under Approved Migration Procedure**.
- **Procedure A: Pre-Data Schema Rollback**:
  - Applicable strictly immediately post-migration during the deployment window before traffic cutover.
  - Reversible via clean reverse-dependency drops: `DROP TABLE ... CASCADE` and `ALTER TABLE DROP COLUMN`.
- **Procedure B: Post-Data Disaster Recovery**:
  - Once live application traffic commences, running `DROP TABLE ... CASCADE` is **STRICTLY FORBIDDEN** (would destroy live student applications, test scores, payments, and alumni records).
  - Post-data incidents must be remediated via **Forward-Fix Migrations** or **Point-in-Time Database Restore (PITR)**. PITR operational prerequisites and transaction log checkpoints must be pre-verified before production cutover.

---

## 24. DEPENDENCY GRAPH

```text
  public.tenants / academic_years / madrasah / jenjang / tingkat / rombel (Pre-requisites)
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
    [public.users (+merged_into)]       [public.santri (+user_id, +uq_santri_tenant_id)]
            │                                   │
            ├─────────────────┬─────────────────┤
            ▼                 ▼                 ▼
   [user_tenant_personas]  [psb_periods]  [alumni_exit_reasons]
            │                 │                 │
            ▼                 ▼                 ▼
  [consolidation_ledgers] [psb_waves]    [alumni_snapshots]
                              │                 │
                              ▼                 ▼
                       [psb_applicants]  [alumni_korwils]
                              │                 │
                              ├─────────────────┤
                              ▼                 ▼
                       [psb_test_scores] [alumni_profiles]
                              │                 │
                              ▼                 ▼
                       [psb_placement]   [Discovery / Salam]
                              │                 │
                              ▼                 ▼
                      [Triggers & RLS]   [Donations]
```

---

## 25. RISK REGISTER

| Risk ID | Risk Description | Severity | Mitigation in Remediated DDL Design | Status |
| :--- | :--- | :---: | :--- | :---: |
| **R-01** | Cross-tenant placement via raw SQL | HIGH | Composite FKs on santri + trigger fail-closed | **MITIGATED** |
| **R-02** | Stale JWT usage post-consolidation | HIGH | Proxy & transaction check `users.status = 'MERGED'` | **MITIGATED** |
| **R-03** | Rombel placed into wrong academic year | HIGH | Trigger checks `rombel.year == period.year` (TIR-007) | **MITIGATED** |
| **R-04** | Outbox ledger client leakage | HIGH | RLS `false` seals table to server-only workers | **MITIGATED** |
| **R-05** | Migration failure on existing santri | HIGH | `santri.user_id` is added as nullable | **MITIGATED** |
| **R-06** | Applicant placed into wrong period | MEDIUM | Trigger asserts `applicant.period == period` (F-06) | **MITIGATED** |
| **R-07** | Peer salam greeting snooping | HIGH | Participant-only RLS policy (F-04) | **MITIGATED** |
| **R-08** | Ephemeral location tampering | HIGH | Row-owner RLS policy `user_id = auth.uid()` (F-04) | **MITIGATED** |

---

## 26. ZERO-DOWNTIME TARGET & LOCKING POSTURE (F-11)

- **Classification**: **Zero-Downtime Target — Controlled Off-Peak Maintenance Window Recommended**.
- **Lock Contention Disclosure**:
  - `ALTER TABLE santri ADD CONSTRAINT fk_santri_user_id` acquires `ShareRowExclusiveLock` on `santri`.
  - `CREATE UNIQUE INDEX uq_santri_tenant_active_user` inside a transactional block acquires `ShareLock` on `santri`.
  - Adding constraints and non-concurrent indexes inside a single PostgreSQL transactional block blocks concurrent write queries (`INSERT`, `UPDATE`, `DELETE`) on active students and users for the duration of constraint validation (typically < 3 seconds).
  - Executing during scheduled off-peak maintenance hours completely avoids lock timeouts and connection pool starvation.

---

## 27. SEMANTIC IDEMPOTENCY CONTRACT (CONDITIONAL IDEMPOTENCY)

The DDL and migration design strictly rejects the unprovable claim of universal idempotency.

Instead, the architecture establishes a **Conditional Semantic Idempotency Contract**:

> **The migration is idempotent only when the target schema is either:**
> 1. **absent** and therefore eligible for creation; or
> 2. **already present and verified structurally compatible** by Phase 1 assertions.
>
> **Any incompatible pre-existing object causes fail-closed abortion.**

PostgreSQL DDL syntax idempotency (`IF NOT EXISTS`) is paired with fail-closed PL/pgSQL assertion checks (Phase 1) to prevent silent schema drift from masking incompatible columns, missing constraints, or damaged RLS policies.

### 27.1 True Structural Contract Fingerprint Gate (Cycle 8 Hardening: F-15, F-16, F-17, F-18, F-19 Exact Array-Literal)
Phase 1 assertions enforce a **True Structural Contract Fingerprint** via an in-memory declarative JSONB manifest (`v_manifest`) evaluated strictly against the PostgreSQL system catalog (`pg_catalog` and `information_schema`).

The fingerprint implements the **Three-State Structural Model**:
- **State A (Absent)**: Target table absent from `information_schema.tables` $\rightarrow$ eligible for creation, fingerprint passes.
- **State B (Present + 100% Compatible)**: Target table present and catalog matches 100% of expected elements in `v_manifest` $\rightarrow$ fingerprint passes idempotently.
- **State C (Present + Structural Drift)**: Target table present but catalog reveals any drift $\rightarrow$ fail-closed abortion via `RAISE EXCEPTION`.

The declarative manifest exhaustively audits:
1. **All 18 Target Domain Tables**: `user_tenant_personas`, `identity_consolidation_ledgers`, `psb_periods`, `psb_waves`, `psb_committees`, `psb_applicants`, `psb_test_scores`, `psb_infaq_verifications`, `psb_acceptance_ledgers`, `psb_placement_distributions`, `alumni_exit_reasons`, `alumni_academic_snapshots`, `alumni_korwils`, `tenant_korwil_settings`, `alumni_profiles`, `user_discovery_locations`, `salam_interactions`, and `alumni_donations`.
2. **All 180 Declared Columns**: Exact column count verification (`v_actual_col_count = v_expected_col_count`), strict extra column detection (`column_name NOT IN (...)`), data type compatibility (including `text`, `integer`, `numeric`, `boolean`, `timestamp`, `jsonb`, `date`), and nullability (`is_nullable = 'NO'`).
3. **All 18 Primary Keys**: Verifies exact single-column `PRIMARY KEY (id)` across every domain table using ordered column arrays from `pg_constraint` and `pg_attribute` (`array_agg(att.attname::text ORDER BY pos.n) = ARRAY['id']`), rejecting composite PKs such as `(id, tenant_id)`.
4. **All 32 Unique Structures (31 UQ Constraints + 1 Partial Unique Index)**:
   - **Unique Constraints**: Validates exact constraint count parity (`v_actual_uq_count = expected`) to prevent unauthorized extra constraints (F-18), and verifies exact column sets and column ordering via `pg_constraint` and `pg_attribute` array equality.
   - **Partial Unique Index Hardening (F-15 Cycle 6 Revision)**: Introspects `pg_index`, `pg_class`, and `pg_attribute` to verify that `uq_active_consolidation_santri` has `indisunique = true`, ordered indexed columns match `ARRAY['santri_id']`, and the predicate decompiled via `pg_get_expr(indpred, indrelid)` is compared using a **literal-safe whitespace normalizer** that collapses whitespace only outside single-quoted string literals while preserving string literal content exactly (case-sensitive). No `lower()` is used. This detects: `OR TRUE` injection, expanded/reduced status sets, structural predicate changes, and changed literal case.
5. **All 46 Foreign Keys (F-17 & F-18 Hardening)**:
   - Validates exact foreign key count parity (`v_actual_fk_count = expected`) detecting unauthorized extra FKs (F-18).
   - Validates exact source column array, referenced table, and referenced column array using positional subscripts over `con.conkey` and `con.confkey` in `pg_constraint`.
   - Validates catalog referential action: Introspects `con.confdeltype` mapped to canonical SQL (`'c' = CASCADE`, `'r' = RESTRICT`, `'a' = NO ACTION`, `'n' = SET NULL`) and asserts exact match against the contractual manifest for every foreign key (F-17).
6. **All 23 Check Constraints (F-16, F-18 & F-19 Structural Boolean Hardening — Cycle 7)**:
   - Validates exact CHECK constraint count parity (`v_actual_chk_count = expected`) detecting unauthorized extra CHECK constraints (F-18).
   - **Enum/Status CHECKs (F-19 Structural Contract Hardening)**: Replaces heuristic guards with a 5-layer exact structural contract:
     a) **Layer 1 — Structural Shape & Anchoring**: Matches definition against anchored POSIX regex `^CHECK[[:space:]]*\(\([[:space:]]*([a-zA-Z0-9_]+)[[:space:]]*(=)[[:space:]]*(ANY)[[:space:]]*\(ARRAY\[(.+)\]\)[[:space:]]*\)\)# WP-PSB-ALUMNI — DDL DESIGN REPORT (REMEDIATED)

```text
══════════════════════════════════════════════════════════════════════════════════
WORK PACKAGE: WP-PSB-ALUMNI-SCHEMA-001
DOCUMENT: docs/architecture/WP-PSB-ALUMNI-DDL-DESIGN-001.md
TITLE: Authoritative DDL Design & Technical Schema Specification (Gate 8B Remediated)
GATE: GATE 8B REMEDIATION — DESIGN ARTIFACT CORRECTION
STATUS: REMEDIATION COMPLETED — READY FOR GATE 8B RE-AUDIT
AUTHORIZATION STATUS:
  • IMPLEMENTATION: ❌ NOT AUTHORIZED
  • DDL EXECUTION: ❌ NOT AUTHORIZED
  • MIGRATION EXECUTION: ❌ NOT AUTHORIZED
  • DATABASE MUTATION: ❌ FORBIDDEN (DATABASE UNTOUCHED)
  • FRONTEND DEVELOPMENT: ❌ NOT AUTHORIZED
PRINCIPLE: ARCHITECTURE LOCKED -> DDL TRANSLATION ONLY (ZERO REWRITE)
══════════════════════════════════════════════════════════════════════════════════
```

---

## 1. EXECUTIVE SUMMARY

This document provides the **authoritative, remediated DDL Design Specification** for Work Package `WP-PSB-ALUMNI-SCHEMA-001`.

Following the forensic findings of the Gate 8B Adversarial Audit ([WP-PSB-ALUMNI-GATE-8B-DDL-MIGRATION-REVIEW.md](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-GATE-8B-DDL-MIGRATION-REVIEW.md)), this design specification has been fully remediated:
1. **Object Count Normalized (18 Tables)**: Fully integrates `psb_test_scores` into the PSB admission workflow (closing F-01).
2. **Relational Tenant Keys on `public.santri` (F-02)**: Introduces additive `uq_santri_tenant_id UNIQUE (tenant_id, id)` on `public.santri`, upgrading child FKs in `alumni_academic_snapshots`, `identity_consolidation_ledgers`, and `psb_placement_distributions` to composite foreign keys.
3. **Complete RLS Coverage (F-03 & F-05)**: Establishes explicit, intentional RLS policies with matching `USING` and `WITH CHECK` clauses across all 18 new tables.
4. **Peer Privacy & Impersonation Prevention (F-04)**: Hardens `salam_interactions` to participant-only access (`auth.uid()`) and restricts `user_discovery_locations` mutation strictly to row owners.
5. **Applicant-Period Trigger Integrity (F-06)**: Extends `fn_enforce_placement_hierarchy` to assert that applicants belong strictly to the placement's PSB period.
6. **Saga Guard & Concurrency (F-07 & F-08)**: Adds self-consolidation check constraint and expands partial unique index coverage over `MANUAL_ATTENTION_REQUIRED`.
7. **Rollback & Downtime Reclassification (F-10 & F-11)**: Segregates Pre-Data Rollbacks from Post-Data Disaster Recovery, and reclassifies zero-downtime to a controlled target.

---

## 2. LOCKED BASELINES

This DDL design strictly operationalizes:
1. **PRD — APP MA'HAD: PSB & Alumni Ecosystem**: One PSB per tenant, wave count strictly 1 or 2, SAT exclusive acceptance and alumni conferral, Madrasah sovereignty, ephemeral discovery with 6-hour TTL.
2. **WP-PSB-ALUMNI-SCHEMA-001-DESIGN-V3.md**: Target relational entity catalog.
3. **Option A Decision Lock**: Universal Supabase Auth with synthetic internal credentials (`{nis}@{tenant}.mahad.internal`).
4. **TIR-009 Saga Hardening**: DB-Atomic Phase A followed by external GoTrue Phase B reconciliation.
5. **Contract Gap Closures (CG-001 through CG-008)**: Additive `santri.user_id`, `users.status = 'MERGED'`, `user_tenant_personas`, outbox ledger, audit repository adapter, SAT lifecycle gate, `santri.kelas` sync, and placement hierarchy trigger.
6. **Gate 8B Audit Remediation Directives**: Findings F-01 through F-11.

---

## 3. EXISTING SCHEMA EVIDENCE

Empirical audit of the active repository confirms the following foundations:
- **`src/lib/db/schema.ts`**:
  - `tenants`: `id text PRIMARY KEY`, `slug text UNIQUE`.
  - `santri`: `id text PRIMARY KEY`, `nis text UNIQUE`, `kelas text NOT NULL`, `status text DEFAULT 'Aktif'`. Receives additive `user_id` and `uq_santri_tenant_id`.
  - `audit_logs`: `id text PRIMARY KEY`, `details text` (JSON string).
- **`src/lib/db/schema/identity.ts`**:
  - `users`: `id text PRIMARY KEY` (maps to `auth.users.id`), `email text UNIQUE`, `status text DEFAULT 'ACTIVE'`. Receives additive `merged_into_user_id` and check constraint.
  - `user_tenant_memberships`: Unique on `(user_id, tenant_id)`, single `primary_role_id`. Preserved without rewrite.
- **`src/lib/db/schema/academic_structure.ts`**:
  - Frozen Level-4: `madrasah`, `jenjang`, `tingkat`, `rombel`. Composite keys present on all tables.
- **`src/lib/db/schema/academic_workspace.ts`**:
  - `academic_years`: `id text PRIMARY KEY`, `uq_academic_years_tenant_id UNIQUE (tenant_id, id)`.

---

## 4. TARGET SCHEMA DELTA (EXACTLY 18 NEW TABLES)

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       TARGET SCHEMA DELTA                                              │
├────────────────────────────┬──────────────────────┬────────────────────────────────────────────────────┤
│ Target Entity              │ Modification Type    │ Key Columns / Constraints                          │
├────────────────────────────┼──────────────────────┼────────────────────────────────────────────────────┤
│ public.users               │ ADDITIVE EXTENSION   │ + merged_into_user_id, chk_users_merged_not_self   │
│ public.santri              │ ADDITIVE EXTENSION   │ + user_id, uq_santri_tenant_id (tenant_id, id)     │
│ user_tenant_personas       │ NEW CORE TABLE (1)   │ (tenant_id, user_id, persona_type) UNIQUE         │
│ identity_consolidation_l.  │ NEW SAGA TABLE (2)   │ (santri_id) PARTIAL UNIQUE, chk_icl_distinct_users │
│ psb_periods                │ NEW PSB TABLE (3)    │ wave_count CHECK (1, 2), composite FK to year      │
│ psb_waves                  │ NEW PSB TABLE (4)    │ wave_number CHECK (1, 2), composite FK to period   │
│ psb_committees             │ NEW PSB TABLE (5)    │ (tenant_id, psb_period_id, user_id) UNIQUE         │
│ psb_applicants             │ NEW PSB TABLE (6)    │ registration_number UNIQUE, intake target_madrasahs│
│ psb_test_scores            │ NEW PSB TABLE (7)    │ (tenant, applicant, test_type) UNIQUE, 0-100 check │
│ psb_infaq_verifications    │ NEW PSB TABLE (8)    │ (tenant_id, applicant_id) UNIQUE, verified status  │
│ psb_acceptance_ledgers     │ NEW PSB TABLE (9)    │ sat_user_id FK, official_nis UNIQUE per tenant     │
│ psb_placement_distribut.   │ NEW PSB TABLE (10)   │ (applicant_id, madrasah_id) UNIQUE per period      │
│ alumni_exit_reasons        │ NEW ALUMNI TABLE (11)│ code UNIQUE per tenant, is_final_exit              │
│ alumni_academic_snapshots  │ NEW ALUMNI TABLE (12)│ (tenant, santri, madrasah) UNIQUE, composite FKs   │
│ alumni_korwils             │ NEW ALUMNI TABLE (13)│ code UNIQUE per tenant, regencies JSONB            │
│ tenant_korwil_settings     │ NEW ALUMNI TABLE (14)│ tenant_id UNIQUE, auto_transfer_enabled            │
│ alumni_profiles            │ NEW ALUMNI TABLE (15)│ user_id UNIQUE, domicile_address (internal only)   │
│ user_discovery_locations   │ NEW ALUMNI TABLE (16)│ user_id UNIQUE per tenant, 6-hour TTL cache        │
│ salam_interactions         │ NEW ALUMNI TABLE (17)│ sender <> recipient, participant-only RLS          │
│ alumni_donations           │ NEW ALUMNI TABLE (18)│ campaign_id, amount > 0, status lifecycle          │
└────────────────────────────┴──────────────────────┴────────────────────────────────────────────────────┘
Total Additions: 18 New Domain/Core Tables + 2 Existing Table Additive Extensions
```

---

## 5. TABLE-BY-TABLE DESIGN

Authoritative SQL implementation is maintained in [WP-PSB-ALUMNI-DDL-DRAFT-001.sql](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-DDL-DRAFT-001.sql).

### 5.1 `public.users` (Additive Modification)
- `merged_into_user_id`: `text NULL REFERENCES public.users(id) ON DELETE RESTRICT`. Tracks the surviving canonical UID when a synthetic account is consolidated.
- `chk_users_merged_not_self`: `CHECK (merged_into_user_id IS NULL OR merged_into_user_id <> id)`. Eliminates self-reference loops.
- `status`: Supports terminal status `'MERGED'`.

### 5.2 `public.santri` (Additive Modification)
- `user_id`: `text NULL REFERENCES public.users(id) ON DELETE RESTRICT`. Populated upon SAT matriculation.
- `uq_santri_tenant_id`: `UNIQUE (tenant_id, id)`. Relational anchor enabling tenant-safe composite foreign keys in child tables.
- `uq_santri_tenant_active_user`: Partial unique index on `(tenant_id, user_id) WHERE status = 'Aktif' AND user_id IS NOT NULL`.

### 5.3 `public.user_tenant_personas` (Core Table 1)
- Models lifestyle portal capabilities: `WALI`, `SANTRI`, `ALUMNI`.
- Primary Key: `id text`. Composite Unique: `(tenant_id, user_id, persona_type)`.

### 5.4 `public.identity_consolidation_ledgers` (Core Table 2 - Saga Outbox)
- Tracks TIR-009 Saga state: `DB_COMMITTED_AUTH_PENDING`, `RECONCILIATION_REQUIRED`, `CONSOLIDATION_COMPLETED`, `MANUAL_ATTENTION_REQUIRED`.
- Composite FK to santri: `FOREIGN KEY (tenant_id, santri_id) REFERENCES public.santri(tenant_id, id) ON DELETE RESTRICT`.
- Invariant: `CHECK (source_student_uid <> target_wali_uid)`.
- Sealed by RLS `FOR ALL USING (false) WITH CHECK (false)`.

### 5.5 PSB Entities (Tables 3 to 10)
- `psb_periods`: Academic year bridge with strict `wave_count IN (1, 2)`.
- `psb_waves`: Sub-cycles with `wave_number IN (1, 2)` and composite FK to period.
- `psb_committees`: Committee membership scoped to tenant and period.
- `psb_applicants`: Prospective students. `target_madrasahs` is an internal Panitia intake assessment notes field (`DEFAULT '[]'::jsonb NOT NULL`), NOT a parent selection field.
- `psb_test_scores` (Restored - F-01): Scores per test type (`0 <= score <= 100`) linked via composite FK to `psb_applicants`.
- `psb_infaq_verifications`: Transfer proofs and verified status.
- `psb_acceptance_ledgers`: Exclusive SAT matriculation record storing `sat_user_id` and official NIS.
- `psb_placement_distributions`: Academic distribution to Madrasah/Rombel. Validated by composite FKs and trigger `trg_enforce_placement_hierarchy`.

### 5.6 Alumni Entities (Tables 11 to 18)
- `alumni_exit_reasons`: Catalog of exit codes (`is_final_exit boolean`).
- `alumni_academic_snapshots`: Immutable graduation transcripts per Madrasah. Composite FK `(tenant_id, santri_id)` to `santri`.
- `alumni_korwils`: Regional chapter jurisdictions (`regencies jsonb`).
- `tenant_korwil_settings`: Auto-transfer and approval toggles per tenant.
- `alumni_profiles`: Directory profile. `domicile_address` is strictly internal profile data (not exposed in public discovery).
- `user_discovery_locations`: Ephemeral coarse location cache with 6-hour TTL (`expires_at`).
- `salam_interactions`: Peer greetings with cooldown, participant-only privacy.
- `alumni_donations`: Campaign endowment donations.

---

## 6. PRIMARY KEYS SPECIFICATION

- All tables utilize deterministic text primary keys generated by the application layer using high-entropy prefixes (e.g. `psb_per_...`, `alumni_snap_...`, UUIDv7).
- Guarantees database engine portability and eliminates auto-increment sequence race conditions during distributed seeding.

---

## 7. FOREIGN KEYS SPECIFICATION

All foreign keys are explicitly defined with fail-safe referential action rules:
- **`ON DELETE RESTRICT`**: Applied to all permanent institutional records (`santri_id`, `users.id`, `madrasah_id`, `psb_period_id`) to prevent accidental cascade deletion of audit trails.
- **`ON DELETE CASCADE`**: Restricted strictly to owned child sub-entities (e.g. `psb_waves` cascading on `psb_periods`, `user_discovery_locations` cascading on `users`).
- **`ON DELETE SET NULL`**: Applied to non-critical administrative audit associations (`verified_by_user_id`, `confirmed_by_user_id`, `donor_user_id`, `tested_by_user_id`).

---

## 8. COMPOSITE FOREIGN KEYS (TENANT ISOLATION)

To ensure that tenant boundaries cannot be breached via foreign keys, all child-to-parent associations utilize **relational composite foreign keys**:
- `public.psb_periods`:
  - `(tenant_id, academic_year_id) REFERENCES academic_years(tenant_id, id)`
- `public.psb_waves`:
  - `(tenant_id, psb_period_id) REFERENCES psb_periods(tenant_id, id)`
- `public.psb_committees`:
  - `(tenant_id, psb_period_id) REFERENCES psb_periods(tenant_id, id)`
- `public.psb_applicants`:
  - `(tenant_id, psb_period_id) REFERENCES psb_periods(tenant_id, id)`
  - `(tenant_id, wave_id) REFERENCES psb_waves(tenant_id, id)`
- `public.psb_test_scores`:
  - `(tenant_id, applicant_id) REFERENCES psb_applicants(tenant_id, id)`
- `public.psb_infaq_verifications`:
  - `(tenant_id, applicant_id) REFERENCES psb_applicants(tenant_id, id)`
- `public.psb_acceptance_ledgers`:
  - `(tenant_id, applicant_id) REFERENCES psb_applicants(tenant_id, id)`
- `public.psb_placement_distributions`:
  - `(tenant_id, psb_period_id) REFERENCES psb_periods(tenant_id, id)`
  - `(tenant_id, psb_period_id, applicant_id) REFERENCES psb_applicants(tenant_id, psb_period_id, id)`
  - `(tenant_id, santri_id) REFERENCES santri(tenant_id, id)` (F-02)
  - `(tenant_id, madrasah_id) REFERENCES madrasah(tenant_id, id)`
  - `(tenant_id, madrasah_id, jenjang_id) REFERENCES jenjang(tenant_id, madrasah_id, id)`
  - `(tenant_id, tingkat_id) REFERENCES tingkat(tenant_id, id)`
  - `(tenant_id, rombel_id) REFERENCES rombel(tenant_id, id)`
- `public.alumni_academic_snapshots`:
  - `(tenant_id, santri_id) REFERENCES santri(tenant_id, id)` (F-02)
  - `(tenant_id, madrasah_id) REFERENCES madrasah(tenant_id, id)`
  - `(tenant_id, madrasah_id, last_jenjang_id) REFERENCES jenjang(tenant_id, madrasah_id, id)`
  - `(tenant_id, last_tingkat_id) REFERENCES tingkat(tenant_id, id)`
  - `(tenant_id, exit_reason_id) REFERENCES alumni_exit_reasons(tenant_id, id)`
- `public.identity_consolidation_ledgers`:
  - `(tenant_id, santri_id) REFERENCES santri(tenant_id, id)` (F-02)
- `public.alumni_profiles`:
  - `(tenant_id, korwil_id) REFERENCES alumni_korwils(tenant_id, id)`
- `public.user_discovery_locations`:
  - `(tenant_id, origin_korwil_id) REFERENCES alumni_korwils(tenant_id, id)`
  - `(tenant_id, current_korwil_id) REFERENCES alumni_korwils(tenant_id, id)`
- `public.alumni_donations`:
  - `(tenant_id, donor_origin_korwil_id) REFERENCES alumni_korwils(tenant_id, id)`

---

## 9. UNIQUE CONSTRAINTS

- `uq_santri_tenant_id`: `UNIQUE (tenant_id, id)` on `public.santri` (F-02)
- `uq_psb_periods_tenant_id`: `UNIQUE (tenant_id, id)`
- `uq_psb_waves_period_number`: `UNIQUE (tenant_id, psb_period_id, wave_number)`
- `uq_psb_applicants_reg_num`: `UNIQUE (tenant_id, registration_number)`
- `uq_psb_applicants_tenant_period`: `UNIQUE (tenant_id, psb_period_id, id)`
- `uq_psb_test_applicant_type`: `UNIQUE (tenant_id, applicant_id, test_type)` (F-01)
- `uq_psb_acceptance_nis`: `UNIQUE (tenant_id, official_nis)`
- `uq_psb_dist_placement`: `UNIQUE (tenant_id, psb_period_id, applicant_id, madrasah_id)`
- `uq_alumni_snapshots_record`: `UNIQUE (tenant_id, santri_id, madrasah_id)`
- `uq_user_tenant_persona`: `UNIQUE (tenant_id, user_id, persona_type)`
- `uq_active_consolidation_santri`: `PARTIAL UNIQUE ON (santri_id) WHERE status IN ('DB_COMMITTED_AUTH_PENDING', 'RECONCILIATION_REQUIRED', 'MANUAL_ATTENTION_REQUIRED')` (F-08)

---

## 10. CHECK CONSTRAINTS

- `chk_users_merged_not_self`: `CHECK (merged_into_user_id IS NULL OR merged_into_user_id <> id)` on `public.users` (F-07)
- `chk_icl_distinct_users`: `CHECK (source_student_uid <> target_wali_uid)` on `identity_consolidation_ledgers` (F-07)
- `chk_icl_attempts`: `CHECK (attempt_count >= 0)`
- `chk_pts_score`: `CHECK (score >= 0 AND score <= 100)` on `psb_test_scores` (F-01)
- `chk_psb_periods_wave_count`: `CHECK (wave_count IN (1, 2))`
- `chk_psb_waves_number`: `CHECK (wave_number IN (1, 2))`
- `chk_psb_applicants_gender`: `CHECK (gender IN ('L', 'P'))`
- `chk_salam_peers`: `CHECK (sender_user_id <> recipient_user_id)`
- `chk_salam_status`: `CHECK (status IN ('DELIVERED', 'READ', 'EXPIRED'))`
- `chk_alumni_donations_amount`: `CHECK (amount > 0)`

---

## 11. INDEXES DESIGN

Performance indexes are placed on foreign keys, lookup combinations, and worker queues:
- `idx_santri_tenant_user_id`: `(tenant_id, user_id)`
- `idx_utp_tenant_persona`: `(tenant_id, persona_type, status)`
- `idx_icl_worker_queue`: Partial index on pending/unresolved ledgers `(status, created_at)`
- `idx_psb_test_applicant`: `(tenant_id, applicant_id)`
- `idx_alumni_profiles_directory`: `(tenant_id, korwil_id, is_public, hide_profile)`
- `idx_discovery_expiry`: `(expires_at)` for background TTL purge
- `idx_salam_cooldown`: `(tenant_id, sender_user_id, recipient_user_id, expires_at)`

---

## 12. TRIGGER DESIGN

Two procedural triggers are defined in `WP-PSB-ALUMNI-DDL-DRAFT-001.sql`:

### 12.1 Placement Hierarchy Integrity Trigger (`trg_enforce_placement_hierarchy`)
- **Table**: `psb_placement_distributions`
- **Timing**: `BEFORE INSERT OR UPDATE`
- **Checks Enforced**:
  1. `tingkat.madrasah_id == NEW.madrasah_id` AND `tingkat.jenjang_id == NEW.jenjang_id`
  2. `rombel.tingkat_id == NEW.tingkat_id`
  3. `rombel.academic_year_id == psb_periods.academic_year_id` (TIR-007)
  4. `santri.tenant_id == NEW.tenant_id` (TIR-008)
  5. `applicant.psb_period_id == NEW.psb_period_id` (F-06)
- **Failure**: `RAISE EXCEPTION` aborts transaction fail-closed.

### 12.2 Legacy Kelas Sync Trigger (`trg_sync_santri_kelas_from_rombel`)
- **Table**: `psb_placement_distributions`
- **Timing**: `AFTER INSERT OR UPDATE`
- **Behavior**: When `NEW.status = 'CONFIRMED'`, executes `UPDATE public.santri SET kelas = rombel.name` for the associated student.
- **NBO-001 Assessment**: Operates on a Last-Write-Wins basis under concurrent multi-Madrasah placements. Retained strictly for legacy backward compatibility. Modern queries consume `psb_placement_distributions` and `rombel` directly.

---

## 13. ROW-LEVEL SECURITY (RLS) DESIGN (ALL 18 TABLES)

- Every new domain table has `ENABLE ROW LEVEL SECURITY`.
- Intentional, explicit policies defined across all 18 tables with matching `USING` and `WITH CHECK` clauses:
  1. `identity_consolidation_ledgers`: `FOR ALL USING (false) WITH CHECK (false)`. Sealed server-only outbox table.
  2. `salam_interactions`: Strictly restricted to participants:
     - `USING ((sender_user_id = auth.uid()::text OR recipient_user_id = auth.uid()::text) AND tenant_id = ...)`
     - `WITH CHECK (sender_user_id = auth.uid()::text AND tenant_id = ...)`
  3. `user_discovery_locations`:
     - `SELECT`: active unexpired locations within tenant.
     - `INSERT / UPDATE / DELETE`: strictly row owner `user_id = auth.uid()::text`.
  4. `alumni_profiles`:
     - `SELECT`: public profiles within tenant OR self (`user_id = auth.uid()::text`).
     - `WRITE`: strictly row owner `user_id = auth.uid()::text`.
  5. Standard Tenant Isolation Policies for remaining 14 tables with explicit `WITH CHECK`.

### 13.0 POLICY IDEMPOTENCY SPECIFICATION (F-09-B)

Because PostgreSQL lacks `CREATE POLICY IF NOT EXISTS`, all 20 explicit policies are preceded by:
```sql
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
CREATE POLICY "policy_name" ON public.table_name ...
```
This guarantees deterministic, crash-free re-runs under Case B (compatible schema) while preserving all tenant isolation, row ownership, peer privacy in `salam_interactions`, and sealed ledger invariants.

### 13.1 RLS IS NOT BUSINESS AUTHORIZATION (TWO-LAYER DEFENSE ARCHITECTURE)

A fundamental architectural principle of APP MA'HAD is the strict separation between database tenant isolation and domain authorization:

> **RLS tenant isolation MUST NOT be interpreted as proof of business authorization.**

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             TWO-LAYER SECURITY & AUTHORIZATION MODEL                             │
├──────────────────────────┬─────────────────────────────────────┬─────────────────────────────────┤
│ Security Dimension       │ Layer 1: Database RLS Isolation     │ Layer 2: Application / RBAC     │
├──────────────────────────┼─────────────────────────────────────┼─────────────────────────────────┤
│ Execution Environment    │ PostgreSQL Kernel (Row-Level)       │ Next.js Proxy / Server Action   │
│ Identity Context         │ current_tenant_id, auth.uid()       │ user_tenant_memberships, roles  │
│ Primary Objective        │ Prevent cross-tenant data leakage   │ Enforce business role authority │
│ Scope of Guarantee       │ Row belongs to tenant & row owner   │ Actor is permitted this action  │
│ Bypass Consequence       │ Catastrophic multi-tenant breach    │ Unauthorized domain mutation    │
└──────────────────────────┴─────────────────────────────────────┴─────────────────────────────────┘
```

A query that satisfies an RLS tenant isolation policy proves ONLY that the data row belongs to the caller's tenant. It provides **zero proof** that the caller holds the administrative or institutional authority (e.g. SAT, Panitia, Bendahara, Musyrif, or Pengurus Korwil) required to perform the business transaction!

### 13.2 DOMAIN AUTHORIZATION AUDIT MATRIX (8 SENSITIVE ENTITIES)

```text
┌─────────────────────────────┬───────────────────────────────┬─────────────────────────────────┬───────────────────────────────┬──────────────────────────────┐
│ Sensitive Entity            │ What RLS Guarantees           │ What RLS Does NOT Guarantee     │ Authorized Business Actor     │ Enforcement Layer            │
├─────────────────────────────┼───────────────────────────────┼─────────────────────────────────┼───────────────────────────────┼──────────────────────────────┤
│ psb_committees              │ Tenant data boundary          │ Caller is Ketua Panitia / Admin │ Ma'had Admin / SAT            │ Service Layer (assertRole)   │
│ psb_infaq_verifications     │ Tenant data boundary          │ Caller is authorized Bendahara  │ Bendahara Panitia             │ Service Layer (assertRole)   │
│ psb_acceptance_ledgers      │ Tenant data boundary          │ sat_user_id is valid SAT actor  │ SAT (Pimpinan Pesantren)      │ Service Layer (assertRole)   │
│ psb_placement_distributions │ Tenant data boundary          │ Caller is Panitia / Madrasah Ad.│ Panitia & Madrasah Admin      │ Service Layer (assertRole)   │
│ alumni_donations            │ Tenant data boundary          │ Chapter destination scoping     │ Donors, Bendahara Korwil/Pusat│ Service Layer (scope filter) │
│ alumni_korwils              │ Tenant data boundary          │ Caller is Pengurus Pusat        │ Pengurus Pusat / Admin Alumni │ Service Layer (assertRole)   │
│ tenant_korwil_settings      │ Tenant data boundary          │ Caller is Super Administrator   │ Tenant Super Administrator    │ Service Layer (assertRole)   │
│ alumni_profiles             │ Tenant boundary & self-edit   │ Public privacy projection       │ Profile Owner & Directory DTO │ Service Layer (DTO sanitize) │
└─────────────────────────────┴───────────────────────────────┴─────────────────────────────────┴───────────────────────────────┴──────────────────────────────┘
```

**Crucial Invariant Regarding `sat_user_id`**:
In `psb_acceptance_ledgers`, `sat_user_id` is defined as a foreign key referencing `public.users(id)`. The database engine does **not** possess relational knowledge of who holds the SAT role. Therefore, `sat_user_id` serves strictly as an **audit and actor attribution anchor**. Proof of SAT authority is exclusively verified by the application service layer prior to transaction dispatch.

### 13.3 ALUMNI DONATION DESTINATION SCOPE ANALYSIS (SCHEMA/DOMAIN GAP)

- **Domain Rule**: Alumni endowment campaigns may have distinct destination scopes: `A_PUSAT` (central foundation), `KORWIL` (regional chapter), `PROGRAM` (specific educational program), or `ACTIVITY` (event/reunion). A regional chapter treasurer (`Bendahara Korwil`) must only have administrative visibility over donations bound to their specific Korwil.
- **Relational Status**: `public.alumni_donations` contains `campaign_id` and `donor_origin_korwil_id`. It does not store a dedicated `destination_scope` enum column.
- **Classification**: **SCHEMA/DOMAIN AUTHORIZATION GAP**.
- **Architectural Boundary**:
  - **Database RLS**: Enforces overall tenant isolation (all donations belong to Ma'had).
  - **Domain Authorization**: Destination-scope filtering (restricting chapter treasurers from inspecting central foundation donation totals) is enforced at the **application service layer** via query predicates filtering on `campaign_id` and `donor_origin_korwil_id`.

---

## 14. TENANT ISOLATION ANALYSIS

Tenant isolation is guarded by four defense layers:
1. Application layer sets `withTenantTransaction`.
2. PostgreSQL composite foreign keys enforce `(tenant_id, id)` across all relationships (including `public.santri`).
3. Procedural trigger verifies `santri.tenant_id == NEW.tenant_id` and `applicant.psb_period_id == NEW.psb_period_id`.
4. PostgreSQL RLS policies evaluate `app.current_tenant_id` and JWT claims with explicit `WITH CHECK`.

---

## 15. IDENTITY FEDERATION & OPTION A SUPPORT

- Students receive synthetic credentials: `{nis}@{tenant_slug}.mahad.internal`.
- Binds 1:1 with `public.users.id` and `public.santri.user_id`.
- Outbound mail dispatchers suppress `.internal` addresses.

---

## 16. TIR-009 SAGA INTEGRATION SUPPORT

- **Phase A**: Commits `user_tenant_personas`, re-points snapshots, sets student `users.status = 'MERGED'`, and records `identity_consolidation_ledgers`.
- **Phase B**: Deletes GoTrue synthetic credential via Supabase Admin API.
- If Phase B drops, background worker reconciles asynchronously via partial index queue covering `DB_COMMITTED_AUTH_PENDING`, `RECONCILIATION_REQUIRED`, and `MANUAL_ATTENTION_REQUIRED`.

---

## 17. ALUMNI LIFECYCLE SUPPORT

- **Graduate $\neq$ Alumni**: `alumni_academic_snapshots` records `Lulus Jenjang` without altering `santri.status`.
- SAT exclusive authority: Database stores audit anchor `sat_user_id`; application service layer enforces SAT role authorization. Zero automated trigger promotions.

---

## 18. PLACEMENT INTEGRITY SUPPORT

- Protects the complete 5-level hierarchy tree: `Tenant -> Academic Year -> Madrasah -> Jenjang -> Tingkat -> Rombel`.
- Placement distribution is verified fail-closed at the database engine level by `trg_enforce_placement_hierarchy`.

---

## 19. MULTI-MADRASAH COMPATIBILITY

- Applicants receive independent placement distribution rows per Madrasah: `(applicant_id, madrasah_id)`.
- Snapshots record graduation per Madrasah: `(santri_id, madrasah_id)`.

---

## 20. LEGACY COMPATIBILITY

- `santri.kelas`: Retained as `text NOT NULL`; synchronized automatically from `rombel.name` (NBO-001 Last-Write-Wins projection).
- `users.role`: Retained with `@deprecated` tag.
- `user_tenant_memberships`: Retained for administrative RBAC; `user_tenant_personas` adds multi-persona capability.
- `audit_logs`: Reused via `auditRepository.create(entry, txClient)`.

---

## 21. DATA MIGRATION IMPLICATIONS

- `public.santri.user_id`: Added as `NULL` to avoid migration failures on existing rows.
- `public.users.merged_into_user_id`: Added as `NULL`.
- Zero existing rows are mutated during DDL execution.

---

## 22. BACKFILL STRATEGY

- **Historical Santri**: Backfill of `santri.user_id` is **optional and deferred**. Existing Santri continue operating normally. When a student portal is provisioned or an alumnus is conferred, the `user_id` is created and bound on-demand.
- **Legacy Kelas**: Unchanged. Existing strings remain valid.

---

## 23. ROLLBACK STRATEGY (F-10 SEGREGATION & ZERO DATA LOSS TARGET)

- **Post-Data Loss Posture**: **Zero Data Loss Target Under Approved Migration Procedure**.
- **Procedure A: Pre-Data Schema Rollback**:
  - Applicable strictly immediately post-migration during the deployment window before traffic cutover.
  - Reversible via clean reverse-dependency drops: `DROP TABLE ... CASCADE` and `ALTER TABLE DROP COLUMN`.
- **Procedure B: Post-Data Disaster Recovery**:
  - Once live application traffic commences, running `DROP TABLE ... CASCADE` is **STRICTLY FORBIDDEN** (would destroy live student applications, test scores, payments, and alumni records).
  - Post-data incidents must be remediated via **Forward-Fix Migrations** or **Point-in-Time Database Restore (PITR)**. PITR operational prerequisites and transaction log checkpoints must be pre-verified before production cutover.

---

## 24. DEPENDENCY GRAPH

```text
  public.tenants / academic_years / madrasah / jenjang / tingkat / rombel (Pre-requisites)
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
    [public.users (+merged_into)]       [public.santri (+user_id, +uq_santri_tenant_id)]
            │                                   │
            ├─────────────────┬─────────────────┤
            ▼                 ▼                 ▼
   [user_tenant_personas]  [psb_periods]  [alumni_exit_reasons]
            │                 │                 │
            ▼                 ▼                 ▼
  [consolidation_ledgers] [psb_waves]    [alumni_snapshots]
                              │                 │
                              ▼                 ▼
                       [psb_applicants]  [alumni_korwils]
                              │                 │
                              ├─────────────────┤
                              ▼                 ▼
                       [psb_test_scores] [alumni_profiles]
                              │                 │
                              ▼                 ▼
                       [psb_placement]   [Discovery / Salam]
                              │                 │
                              ▼                 ▼
                      [Triggers & RLS]   [Donations]
```

---

## 25. RISK REGISTER

| Risk ID | Risk Description | Severity | Mitigation in Remediated DDL Design | Status |
| :--- | :--- | :---: | :--- | :---: |
| **R-01** | Cross-tenant placement via raw SQL | HIGH | Composite FKs on santri + trigger fail-closed | **MITIGATED** |
| **R-02** | Stale JWT usage post-consolidation | HIGH | Proxy & transaction check `users.status = 'MERGED'` | **MITIGATED** |
| **R-03** | Rombel placed into wrong academic year | HIGH | Trigger checks `rombel.year == period.year` (TIR-007) | **MITIGATED** |
| **R-04** | Outbox ledger client leakage | HIGH | RLS `false` seals table to server-only workers | **MITIGATED** |
| **R-05** | Migration failure on existing santri | HIGH | `santri.user_id` is added as nullable | **MITIGATED** |
| **R-06** | Applicant placed into wrong period | MEDIUM | Trigger asserts `applicant.period == period` (F-06) | **MITIGATED** |
| **R-07** | Peer salam greeting snooping | HIGH | Participant-only RLS policy (F-04) | **MITIGATED** |
| **R-08** | Ephemeral location tampering | HIGH | Row-owner RLS policy `user_id = auth.uid()` (F-04) | **MITIGATED** |

---

## 26. ZERO-DOWNTIME TARGET & LOCKING POSTURE (F-11)

- **Classification**: **Zero-Downtime Target — Controlled Off-Peak Maintenance Window Recommended**.
- **Lock Contention Disclosure**:
  - `ALTER TABLE santri ADD CONSTRAINT fk_santri_user_id` acquires `ShareRowExclusiveLock` on `santri`.
  - `CREATE UNIQUE INDEX uq_santri_tenant_active_user` inside a transactional block acquires `ShareLock` on `santri`.
  - Adding constraints and non-concurrent indexes inside a single PostgreSQL transactional block blocks concurrent write queries (`INSERT`, `UPDATE`, `DELETE`) on active students and users for the duration of constraint validation (typically < 3 seconds).
  - Executing during scheduled off-peak maintenance hours completely avoids lock timeouts and connection pool starvation.

---

## 27. SEMANTIC IDEMPOTENCY CONTRACT (CONDITIONAL IDEMPOTENCY)

The DDL and migration design strictly rejects the unprovable claim of universal idempotency.

Instead, the architecture establishes a **Conditional Semantic Idempotency Contract**:

> **The migration is idempotent only when the target schema is either:**
> 1. **absent** and therefore eligible for creation; or
> 2. **already present and verified structurally compatible** by Phase 1 assertions.
>
> **Any incompatible pre-existing object causes fail-closed abortion.**

PostgreSQL DDL syntax idempotency (`IF NOT EXISTS`) is paired with fail-closed PL/pgSQL assertion checks (Phase 1) to prevent silent schema drift from masking incompatible columns, missing constraints, or damaged RLS policies.

### 27.1 True Structural Contract Fingerprint Gate (Cycle 7 Hardening: F-15, F-16, F-17, F-18, F-19)
Phase 1 assertions enforce a **True Structural Contract Fingerprint** via an in-memory declarative JSONB manifest (`v_manifest`) evaluated strictly against the PostgreSQL system catalog (`pg_catalog` and `information_schema`).

The fingerprint implements the **Three-State Structural Model**:
- **State A (Absent)**: Target table absent from `information_schema.tables` $\rightarrow$ eligible for creation, fingerprint passes.
- **State B (Present + 100% Compatible)**: Target table present and catalog matches 100% of expected elements in `v_manifest` $\rightarrow$ fingerprint passes idempotently.
- **State C (Present + Structural Drift)**: Target table present but catalog reveals any drift $\rightarrow$ fail-closed abortion via `RAISE EXCEPTION`.

The declarative manifest exhaustively audits:
1. **All 18 Target Domain Tables**: `user_tenant_personas`, `identity_consolidation_ledgers`, `psb_periods`, `psb_waves`, `psb_committees`, `psb_applicants`, `psb_test_scores`, `psb_infaq_verifications`, `psb_acceptance_ledgers`, `psb_placement_distributions`, `alumni_exit_reasons`, `alumni_academic_snapshots`, `alumni_korwils`, `tenant_korwil_settings`, `alumni_profiles`, `user_discovery_locations`, `salam_interactions`, and `alumni_donations`.
2. **All 180 Declared Columns**: Exact column count verification (`v_actual_col_count = v_expected_col_count`), strict extra column detection (`column_name NOT IN (...)`), data type compatibility (including `text`, `integer`, `numeric`, `boolean`, `timestamp`, `jsonb`, `date`), and nullability (`is_nullable = 'NO'`).
3. **All 18 Primary Keys**: Verifies exact single-column `PRIMARY KEY (id)` across every domain table using ordered column arrays from `pg_constraint` and `pg_attribute` (`array_agg(att.attname::text ORDER BY pos.n) = ARRAY['id']`), rejecting composite PKs such as `(id, tenant_id)`.
4. **All 32 Unique Structures (31 UQ Constraints + 1 Partial Unique Index)**:
   - **Unique Constraints**: Validates exact constraint count parity (`v_actual_uq_count = expected`) to prevent unauthorized extra constraints (F-18), and verifies exact column sets and column ordering via `pg_constraint` and `pg_attribute` array equality.
   - **Partial Unique Index Hardening (F-15 Cycle 6 Revision)**: Introspects `pg_index`, `pg_class`, and `pg_attribute` to verify that `uq_active_consolidation_santri` has `indisunique = true`, ordered indexed columns match `ARRAY['santri_id']`, and the predicate decompiled via `pg_get_expr(indpred, indrelid)` is compared using a **literal-safe whitespace normalizer** that collapses whitespace only outside single-quoted string literals while preserving string literal content exactly (case-sensitive). No `lower()` is used. This detects: `OR TRUE` injection, expanded/reduced status sets, structural predicate changes, and changed literal case.
5. **All 46 Foreign Keys (F-17 & F-18 Hardening)**:
   - Validates exact foreign key count parity (`v_actual_fk_count = expected`) detecting unauthorized extra FKs (F-18).
   - Validates exact source column array, referenced table, and referenced column array using positional subscripts over `con.conkey` and `con.confkey` in `pg_constraint`.
   - Validates catalog referential action: Introspects `con.confdeltype` mapped to canonical SQL (`'c' = CASCADE`, `'r' = RESTRICT`, `'a' = NO ACTION`, `'n' = SET NULL`) and asserts exact match against the contractual manifest for every foreign key (F-17).
. Strictly blocks `CASE WHEN` tautologies, `COALESCE` weakening, `IS NOT FALSE`, `IS TRUE`, `NOT (...)`, `<> ALL`, and additional boolean conditions.
     b) **Layer 1b-1d — Column, Operator & Array Operator Assertions**: Explicitly verifies constrained column matches manifest `column`, comparison operator is `=`, and array operator is `ANY`.
     c) **Layer 2 — Exact Sorted Value-Set Comparison**: Extracts quoted values via regex, sorts lexicographically, and compares against manifest `allowed_values` using `IS DISTINCT FROM`. Catches extra, missing, replacement, and duplicate values.
     d) **Layer 3 — Case-Insensitive Logical Weakening Guard**: Prohibits `OR`/`AND` word-boundary tokens using case-insensitive PostgreSQL regex (`~* \\mOR\\M` and `~* \\mAND\\M`).
     e) **Layer 4 — Cardinality Parity**: Validates array length equals manifest `expected_value_count`.
   - **Relational CHECKs**: Preserves required tokens and forbidden tokens (e.g. for `amount > 0`, verifying `amount` and `>` are present while `>=` is strictly forbidden). Non-enum constraints are not forced into the enum structural parser.
7. **All 18 RLS Enabled Flags**: Explicitly validates `pg_class.relrowsecurity = true` for every domain table.
8. **Column Defaults Architectural Boundary (F-18)**: Column defaults (e.g. `now()`, `false`, `true`, `uuid_generate_v4()`) are intentionally application/ORM-level implementation details and are not part of the structural relational compatibility contract.

### 27.2 Policy Idempotency (F-09-B Preserved)
PostgreSQL DDL lacks `CREATE POLICY IF NOT EXISTS`. All 20 migration-managed policies incorporate `DROP POLICY IF EXISTS` before `CREATE POLICY`, preventing duplicate policy errors on compatible re-runs while maintaining strict boundary containment.

### 27.3 Prerequisite Level-4 Academic Hierarchy Target Keys (F-13 Structural Resolution Preserved)
Section 0.2 of the physical DDL and Phase 1 of the migration design verify that all pre-existing baseline tables required by downstream foreign keys possess the exact target composite key column sets:
- `academic_years`: `ARRAY['tenant_id', 'id']`
- `madrasah`: `ARRAY['tenant_id', 'id']`
- `jenjang`: `ARRAY['tenant_id', 'id']`
- `jenjang`: `ARRAY['tenant_id', 'madrasah_id', 'id']`
- `tingkat`: `ARRAY['tenant_id', 'id']`
- `rombel`: `ARRAY['tenant_id', 'id']`

Verification is executed dynamically against `pg_constraint` joined with `pg_attribute` checking `con.contype IN ('u', 'p')` and comparing the ordered column array, completely eliminating reliance on brittle constraint names. If any target composite key is missing, the migration raises an immediate exception and aborts prior to executing downstream DDL.

---

## 28. GATE 8B REMEDIATION READINESS ASSESSMENT

```text
══════════════════════════════════════════════════════════════════════════════════
GATE 8B READINESS VERDICT: CYCLE 8 REMEDIATION COMPLETE — READY FOR INDEPENDENT GATE 8B RE-AUDIT
══════════════════════════════════════════════════════════════════════════════════
The DDL Design Specification has been rigorously updated to address all
findings F-01 through F-19 with Cycle 7 Structural Boolean Integrity Hardening:
- F-09-A / F-14: True Structural Contract Fingerprint (180 cols, exact column sets, extra-column detection, 18 single-column PKs, 32 UQs/Indexes with column order, 46 exact composite FKs, 23 CHKs, 18 RLS).
- F-09-B: Deterministic policy idempotency preserved across all 20 policies.
- F-12: Complete cross-document synchronization for uq_psb_dist_placement (4 cols) and uq_alumni_snapshots_record (3 cols).
- F-13: Prerequisite composite target keys structurally validated on catalog column arrays for Level-4 academic hierarchy.
- F-15: Unique index structural & uniqueness hardening (indisunique = true, ordered column array, literal-safe predicate canonicalization — Cycle 6 Revision).
- F-16: CHECK expression hardening (exact sorted value-set equality for enum CHECKs, relational required/forbidden tokens).
- F-19: Structural Boolean Contract Hardening (anchored regex ^CHECK ((<col> = ANY (ARRAY[...]))), column/comparison_operator/array_operator assertions, case-insensitive ~* logical guard, blocking CASE/COALESCE/IS NOT FALSE/NOT/< > ALL boolean bypasses — Cycle 7 Hardened).
- F-17: Foreign key referential action hardening (catalog confdeltype verified against contractual ON DELETE across all 46 FKs).
- F-18: Extra constraint parity checks for UQs, FKs, and CHECKs; identity-level standalone unique index validation + count parity; column defaults documented as application/ORM-level implementation details — Cycle 6 Revision.
══════════════════════════════════════════════════════════════════════════════════
```
