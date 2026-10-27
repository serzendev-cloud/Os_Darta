# EEOS ARCHITECTURAL DECISION ANALYSIS GATE

```text
WORK PACKAGE:
WP-PSB-ALUMNI-SCHEMA-001

SUB-WORK PACKAGE:
WP-PSB-ALUMNI-GATE-9-ARCHITECTURAL-DECISION-ANALYSIS-001

CURRENT GATE:
GATE 9 — ARCHITECTURAL DECISION ANALYSIS

PURPOSE:
ANALYZE OPTIONS — DO NOT SELECT OPTION

MODE:
READ-ONLY / STATIC ARCHITECTURAL ANALYSIS

DATABASE:
NO MUTATION

MIGRATION:
NOT AUTHORIZED

DDL:
LOCKED / READ-ONLY

APPLICATION CODE:
LOCKED / READ-ONLY

DRIZZLE:
LOCKED / READ-ONLY

GIT:
NO MUTATION

PRODUCT OWNER DECISION:
NOT YET PROVIDED
```

---

## 1. Governance Header

* **Document Identifier**: `WP-PSB-ALUMNI-GATE-9-ARCHITECTURAL-DECISION-ANALYSIS-001`
* **Parent Work Package**: `WP-PSB-ALUMNI-SCHEMA-001`
* **Current Gate**: Gate 9 — Architectural Decision Analysis
* **Mode**: Static Architectural Analysis / Read-Only
* **Auditor / Analyst Role**: Principal Systems Architect, Principal PostgreSQL Architect, Multi-Tenant Architecture Analyst, Database Security Architect, Identity Architecture Analyst, Migration Safety Architect, EEOS Governance Auditor
* **Database State**: PostgreSQL 17.6 (Supabase Managed Pooler), Zero Mutations Authorized, Read-Only / Untouched
* **Decision Status**: **NO DIRECTION SELECTED — PENDING PRODUCT OWNER / LEAD ARCHITECT DETERMINATION**

---

## 2. Purpose

The purpose of this document is to provide a comprehensive, neutral, and rigorous architectural decision analysis evaluating the technical, security, data integrity, and migration consequences of the two primary structural paths for the `WP-PSB-ALUMNI-SCHEMA-001` ecosystem following the abort and verified rollback of Gate 9:

* **Direction 1**: Tenant-Scoped Santri (Composite Relational Multi-Tenancy)
* **Direction 2**: Global Santri Identity / Non-Composite Santri Reference (Single-Column Relational Key with Decoupled Tenant Scoping)

This analysis adheres strictly to the EEOS Principle:
```text
FACT → ANALYSIS → TRADE-OFF → DECISION INPUT → STOP
```
This document does **not** make a recommendation, select a winner, assign a score, or formulate an implementation plan. Decision authority rests solely with the Product Owner and Lead Architect.

---

## 3. Source Evidence

This analysis is established directly upon verified forensic evidence and historical artifacts:

1. **`docs/architecture/WP-PSB-ALUMNI-GATE-9-FAILURE-RECONCILIATION-001.md`**:
   Forensic reconciliation of execution abort, baseline schema probes, and catalog definitions.
2. **`docs/architecture/WP-PSB-ALUMNI-GATE-9-FAILURE-ANALYSIS-001.md`**:
   Root cause analysis of execution failure during Phase 1.2.
3. **`docs/architecture/WP-PSB-ALUMNI-MIGRATION-EXECUTION-LOG-001.md`**:
   Chronological execution trace capturing the exact PostgreSQL error on Phase 1.2.
4. **`docs/architecture/WP-PSB-ALUMNI-MIGRATION-EXECUTION-REPORT-001.md`**:
   Post-abort verification confirming 100% clean rollback state.
5. **`docs/architecture/WP-PSB-ALUMNI-DDL-DRAFT-001.sql` (SHA-256: `cf41e81d...`)**:
   Candidate DDL defining constraints, foreign keys, and ledger structures.
6. **`scratch/section0_c8.sql` (SHA-256: `e403e69c...`)**:
   Preflight validation script executed prior to Phase 1.

---

## 4. Known Verified Facts

The following facts have been empirically verified against the live database catalog:

* **BCF-01 (Baseline Contract Failure 01)**:
  `public.santri` exists as a legacy table containing 24 columns, a single-column primary key on `id` (`text`), a unique constraint on `nis` (`text`), exactly 0 foreign keys, and RLS disabled (`rowsecurity = false`). `public.santri` **physically does not contain a `tenant_id` column**.
* **BCF-02 (Baseline Contract Failure 02)**:
  `public.users.id` is physically of data type `text` (storing 36-character UUID string representations). `public.santri.id` is physically of data type `text`. In contrast, Candidate DDL Section 1.1 declared `users.merged_into_user_id` as data type `uuid REFERENCES public.users(id)`. This constitutes a physical data type mismatch (`uuid` vs `text`), which PostgreSQL strictly rejects on foreign key constraint creation.
* **BCF-03 (Baseline Contract Failure 03)**:
  The Section 0 preflight verification script checked table existence for `public.santri` and asserted that its primary key was `(id)`. It did not verify the physical presence of the column `tenant_id` on `public.santri`. Consequently, the preflight returned `PREFLIGHT STATUS: PASS` despite a missing prerequisite structural dependency.
* **Live Sandbox Record Baseline**:
  * `public.tenants`: exactly 6 rows
  * `public.users`: exactly 7 rows
  * `public.santri`: exactly 0 rows
  * `public.academic_years`: exactly 0 rows
* **Clean Rollback State**:
  The Gate 9 migration was executed within a single transaction block (`BEGIN` ... `ROLLBACK`). Upon encountering the missing `tenant_id` column on Phase 1.2 (`42703: column "tenant_id" named in key does not exist`), the transaction was rolled back. Post-rollback catalog audit verified 0 residual tables, 0 residual columns, 0 residual types, and 0 residual constraints.

---

## 5. Known Unknowns

The following parameters cannot be determined from the current sandbox database or repository artifacts:

1. **Authoritative Tenant Ownership for Historical Santri**:
   Because `public.santri` has 0 foreign keys and 0 rows in the sandbox database, there is no verified empirical source of truth mapping a `santri` record to a specific `tenant_id`. It is unknown whether production or external staging systems possess an authoritative mapping key (such as through user accounts, admission records, or external import metadata).
2. **Production Database Record Population**:
   The verified sandbox database contains 0 santri records. It is unknown whether production databases contain non-zero historical santri records, whether those records contain orphaned identifiers, or whether historical records span multiple institutions.
3. **Identity Datatype Target Architecture**:
   It is unknown whether the wider system architecture intends for `users.id` to remain `text` permanently or whether a planned migration exists to convert all user identifiers to native PostgreSQL `uuid`.

---

## 6. BCF-01 Analysis: Legacy `public.santri` Missing `tenant_id`

### 1. Architectural Anatomy
The candidate DDL in Phase 1.2 attempted the following operation:
* Declare a unique constraint combining `tenant_id` and `id` on `public.santri`.
* Subsequently reference `(tenant_id, santri_id)` as a composite foreign key target from `identity_consolidation_ledgers`, `psb_acceptance_ledgers`, and `alumni_academic_snapshots`.

### 2. Disconnect Mechanism
The Candidate DDL was authored under the implicit assumption that `public.santri` was already tenant-scoped and possessed a `tenant_id` column. However, `public.santri` originated from an earlier baseline where multi-tenancy had not been applied to core student entities.

### 3. Immediate Consequence
PostgreSQL syntax mandates that every column specified in a unique constraint key must physically exist in the target table at the moment of constraint creation. Because `tenant_id` was absent, the execution failed immediately with error `42703` and triggered an immediate transaction rollback.

---

## 7. BCF-02 Analysis: Identity Datatype Contract Mismatch

### 1. Architectural Anatomy
In Candidate DDL Section 1.1:
* The column `users.merged_into_user_id` was defined with data type `uuid`.
* A foreign key constraint was declared referencing `public.users(id)`.

### 2. Disconnect Mechanism
The catalog audit established that `public.users.id` was created as `text` (holding string-formatted UUIDs like `0191b2...`). In PostgreSQL, a foreign key constraint requires the referencing column and the referenced column to have strictly compatible data types. PostgreSQL does not permit a `uuid` column to establish a foreign key constraint directly against a `text` column without an explicit domain cast or identical underlying types.

### 3. Immediate Consequence
Had Phase 1.2 not failed on `santri.tenant_id`, the migration would have subsequently failed on Section 1.1 when creating the foreign key for `merged_into_user_id` due to type incompatibility (`uuid` vs `text`).

---

## 8. BCF-03 Analysis: Preflight Verification Gap

### 1. Root Cause of Preflight Pass
The preflight script `scratch/section0_c8.sql` contained structural assertions designed to prevent executing DDL against an unprepared database. However, its check for `public.santri` was limited to:
```text
ASSERT EXISTS (table 'public.santri')
ASSERT primary_key(public.santri) = ('id')
```
The preflight did not inspect `information_schema.columns` to verify that `tenant_id` existed on `public.santri`.

### 2. Class of Failure
This failure falls into the class of **Prerequisite Contract Omission**: the preflight script verified table existence and primary key shape, but failed to assert the presence of all columns that the candidate DDL designated as constraint components.

### 3. Consequence to Migration Safety
The preflight gave a false-positive indicator (`PREFLIGHT STATUS: PASS`), allowing the transaction to proceed to execution rather than halting before any DDL statements were submitted to the engine. While transaction atomicity prevented schema corruption, the failure halted deployment during live execution rather than at the validation boundary.

### 4. Required Conceptual Controls
To prevent similar occurrences, preflight verification must enforce comprehensive structural dependency checks: verifying not merely table existence, but the physical existence, data type, and nullability of every column participating in alterations, composite constraints, and foreign key references.

---

## 9. Direction 1 Analysis: Tenant-Scoped Santri

In Direction 1, `public.santri` is treated as a strictly tenant-scoped entity.

### 1. Schema Implications
* `public.santri` requires the addition of a `tenant_id` column.
* Composite uniqueness on `(tenant_id, id)` is established on `public.santri`.
* Child tables (`identity_consolidation_ledgers`, `psb_acceptance_ledgers`, `alumni_academic_snapshots`) reference `public.santri` using composite foreign keys `(tenant_id, santri_id) REFERENCES public.santri(tenant_id, id)`.
* Database-level Row-Level Security (RLS) can be applied directly to `public.santri` using `tenant_id = current_setting(...)`.

### 2. Existing Data Implications
* **Sandbox Scenario**: With 0 rows currently in the sandbox `public.santri`, adding a non-nullable `tenant_id` column or adding it as nullable and enforcing constraints is trivial and carries zero row backfill risk in the sandbox.
* **Production / Historical Data Scenario**: If production contains historical records, adding a `NOT NULL` column `tenant_id` requires every existing row to be associated with a valid `tenant_id`. If `tenant_id` is initially nullable, a composite unique constraint `UNIQUE (tenant_id, id)` permits multiple rows with `tenant_id IS NULL` under standard SQL rules unless indexed with `NULLS NOT DISTINCT` (PostgreSQL 15+), which alters uniqueness semantics.

### 3. Tenant Mapping
* Direction 1 requires an authoritative data source to determine which tenant owns each historical santri record.
* If an authoritative source is absent, assigning records to tenants requires business decisions, manual data curation, or an explicit holding/default tenant. Until such mapping is defined, automated backfill cannot proceed.

### 4. Security Implications
* **Tenant Isolation**: High database-level isolation. Cross-tenant references are physically prevented by PostgreSQL composite foreign key checks: a ledger row for Tenant A cannot reference a santri belonging to Tenant B because `(tenant_id, santri_id)` would not match any row in `public.santri`.
* **RLS Integration**: Native alignment with Supabase RLS policies filtered on `tenant_id`.

### 5. PSB / Alumni Dependency
* Seamlessly satisfies the structural design of `WP-PSB-ALUMNI-DDL-DRAFT-001.sql` and the 56 contract test assertions established in Gate 8B.
* Ledger records for acceptance and academic snapshots inherently inherit and enforce tenant boundaries.

### 6. Migration Complexity
* High overall complexity.
* Requires a prerequisite schema modification to alter `public.santri`.
* Requires a historical data migration/backfill step if existing records exist.
* Requires coordinating DDL across legacy tables before the PSB/Alumni package can be applied.

---

## 10. Direction 2 Analysis: Global Santri Identity / Non-Composite Santri Reference

In Direction 2, `public.santri` maintains a global primary key `id`, and relationships do not enforce tenant scoping at the relational constraint layer.

### 1. Schema Implications
* `public.santri` remains structurally unchanged (no `tenant_id` column added to relational keys).
* Foreign keys in PSB and Alumni tables reference `public.santri` via single-column keys: `santri_id REFERENCES public.santri(id)`.
* The composite unique constraint `(tenant_id, id)` on `public.santri` is omitted.
* PSB and Alumni tables still store `tenant_id`, but the foreign key linking them to `public.santri` is non-composite (`santri_id`).

### 2. Security Implications
* **Potential Cross-Tenant Reference**: Relational constraints in PostgreSQL do not prevent a ledger row with `tenant_id = 'TENANT-A'` from storing a `santri_id` that is associated in application logic with `'TENANT-B'`.
* **Enforcement Shift**: Protection against cross-tenant data pollution shifts entirely to application service layers, explicit trigger validations, or multi-table RLS subqueries.
* **RLS Complexity**: RLS policies on `public.santri` cannot rely on a direct `tenant_id` column, requiring joins against enrollment, ledger, or registration tables to deduce tenancy, increasing query planning overhead.

### 3. Multi-Tenant Integrity
* Referential integrity guarantees only that the student exists globally, not that the student belongs to the tenant recording the transaction.
* Additional controls (e.g., custom PostgreSQL constraint triggers or application-level guards) are mandatory if tenant cross-referencing must be prevented.

### 4. PSB / Alumni Impact
* Candidate DDL must be substantially refactored: all composite foreign keys targeting `(tenant_id, santri_id)` must be converted to single-column references.
* All Gate 8B structural tests (including Finding F-02 verification) must be rewritten, invalidating Gate 8B certification and requiring a full re-audit cycle.

### 5. Migration Complexity
* Lower immediate DDL footprint on legacy tables: `public.santri` is untouched.
* Zero data backfill required on `public.santri`.
* High downstream maintenance: security verification cannot rely on PostgreSQL relational foreign key invariants.

---

## 11. Comparative Trade-Off Matrix

| Dimension | Direction 1: Tenant-Scoped Santri | Direction 2: Global Santri Identity |
| :--- | :--- | :--- |
| **Tenant Model** | Explicit relational scoping per tenant. | Global entity model with external or inferred scoping. |
| **Relational Integrity** | Composite FK enforces `(tenant_id, santri_id)` at DB engine level. | Single-column FK enforces student existence only; cannot enforce tenant ownership. |
| **Cross-Tenant Isolation** | Physically enforced by relational engine. | Relational engine permits cross-tenant linking; requires external or trigger controls. |
| **RLS Implications** | Direct, high-performance RLS filtering on `tenant_id`. | Indirect RLS filtering requiring subqueries or joins; higher query overhead. |
| **Existing Data Implications** | Requires backfill and valid tenant assignment for all existing records. | Zero impact on existing records; table remains unchanged. |
| **Tenant Mapping Requirement** | Authoritative tenant mapping source is mandatory prior to `NOT NULL` constraint. | Not required for schema application. |
| **PSB Impact** | Direct alignment with designed acceptance and placement ledgers. | Requires rewriting acceptance ledgers to decouple tenant FK. |
| **Alumni Impact** | Snapshot table inherently validates tenant ownership of graduated student. | Snapshot table requires application logic to ensure student belongs to tenant. |
| **Identity Consolidation** | Ledgers validate that both source and target student records align with tenant rules. | Ledgers cannot verify tenant alignment via foreign keys. |
| **Migration Complexity** | High: Multi-step prerequisite DDL, backfill validation, lock contention. | Low immediate migration: Only creates new tables without mutating legacy keys. |
| **Operational Complexity** | Low long-term operational risk; database rejects corrupt tenant references. | High long-term operational risk; data corruption possible if application code bugs occur. |
| **Future Extensibility** | Consistent with enterprise multi-tenant database patterns. | Potential divergence between tenant-scoped modules and global tables. |
| **Legacy Compatibility** | Low: Modifies legacy `public.santri` table schema and constraints. | High: Leaves legacy `public.santri` table schema completely intact. |
| **Failure Modes** | Migration failure during backfill if unmapped records exist; lock timeouts during `ALTER TABLE`. | Silent logical data leakage; cross-tenant student assignment in application tier. |
| **Additional Controls Required** | Preflight checks for column existence and backfill completeness. | Constraint triggers, application authorization layer tests, subquery RLS policies. |

---

## 12. Security & Tenant Isolation Analysis

### 1. Database-Level Enforcement vs. Application-Level Enforcement
* In **Direction 1**, isolation is declarative and cryptographic within the database relational model. The composite foreign key constraint:
  ```text
  (tenant_id, santri_id) REFERENCES public.santri(tenant_id, id)
  ```
  guarantees that even if a bug in the application layer attempts to attach a student from Tenant B to an admission record in Tenant A, PostgreSQL aborts the statement at the database kernel layer.
* In **Direction 2**, PostgreSQL enforces only:
  ```text
  santri_id REFERENCES public.santri(id)
  ```
  If Tenant A initiates an operation referencing Tenant B's student ID, PostgreSQL evaluates the constraint as satisfied. Consequently, isolation depends entirely on the correctness of application code, API handlers, or service middleware.

### 2. Attack Surface and Blast Radius
* Under Direction 2, any SQL injection, authorization bypass, or administrative misconfiguration at the service layer exposes records across tenant boundaries because the underlying tables do not enforce tenant boundaries on foreign keys.
* Under Direction 1, data corruption is constrained because invalid cross-tenant relational links cannot be committed to disk.

---

## 13. Identity Architecture Analysis (BCF-02)

Forensic probe confirmed that `public.users.id` and `public.santri.id` are stored as `text`. Candidate DDL Section 1.1 attempted to introduce `users.merged_into_user_id` as `uuid`.

Two technical pathways exist to resolve BCF-02, independent of the decision on Direction 1 vs. Direction 2:

### Pathway A: Preserve `text` Identity Representation
* **Mechanism**: Change `users.merged_into_user_id` to data type `text` in Candidate DDL Section 1.1 to match existing `public.users.id`.
* **Consequences**:
  * Foreign key constraint validates immediately against `public.users(id)` without datatype conversion.
  * Zero mutation or type-casting required on existing `public.users` table.
  * Preserves full compatibility with all existing application queries and Drizzle schema definitions referencing `users.id` as `text`.
  * Downstream storage penalty: `text` UUID representations consume 36 bytes plus varlena overhead, compared to 16 bytes for native `uuid`.

### Pathway B: Standardize Identity to Native `uuid`
* **Mechanism**: Execute a system-wide migration altering `public.users.id` (and all foreign keys referencing it across all tables) from `text` to `uuid`.
* **Consequences**:
  * Requires comprehensive schema migration altering primary keys, foreign keys, indexes, and views across the entire database.
  * Requires rewriting application code, Drizzle schemas, API contracts, and test suites that expect string/text types.
  * High operational blast radius and significant downtime/locking risk during conversion of large tables.
  * Long-term storage optimization and native UUID indexing efficiency.

---

## 14. PSB / Alumni Dependency Analysis

The functional contracts of the PSB and Alumni ecosystem interact with `public.santri` at critical lifecycle boundaries:

1. **PSB Acceptance (`psb_acceptance_ledgers`)**:
   When an applicant is accepted, the system records an immutable acceptance ledger entry and links or creates a record in `public.santri`.
   * *Direction 1*: The ledger guarantees the accepted student is bound to the exact tenant operating the PSB period.
   * *Direction 2*: The ledger records acceptance under a tenant, but the linked student record has no relational tie to that tenant.
2. **Identity Consolidation (`identity_consolidation_ledgers`)**:
   Consolidates duplicate student profiles or merges user accounts.
   * *Direction 1*: Consolidation ledgers prevent merging students across different tenants via composite key checks.
   * *Direction 2*: Consolidation logic must independently verify tenant ownership; database keys cannot enforce isolation.
3. **Alumni Academic Snapshots (`alumni_academic_snapshots`)**:
   Captures final GPA, graduation status, and transcript metadata upon student completion.
   * *Direction 1*: Historical snapshot is permanently tied to the tenant institution issuing the credential.
   * *Direction 2*: Historical snapshot references a global student ID; institutional credential verification depends on external tables.

---

## 15. Existing Data / Production Scenario Analysis

### Context A: Current Verified Sandbox
* Physical count: `santri = 0`.
* In this environment, applying Direction 1 schema changes presents zero data conversion risk, zero orphan records, and zero backfill lock contention.

### Context B: Unknown / Production Data Scenario
* **PRODUCTION DATA IMPACT CANNOT BE EMPIRICALLY VERIFIED FROM CURRENT SANDBOX**.
* If production contains historical `santri` records:
  1. Adding `tenant_id NOT NULL` will fail immediately unless an authoritative backfill is performed prior to or during the migration.
  2. Adding `tenant_id NULL` permits existing rows to remain untracked, but creates ambiguity in composite foreign keys and null-handling within uniqueness constraints.
  3. **Authoritative Mapping Rule**: There is currently no database evidence indicating whether `asrama`, `kamar`, `kelas`, `angkatan`, or `nis` can reliably determine tenant ownership. Therefore, authoritative mapping is designated:
     ```text
     AUTHORITATIVE MAPPING UNKNOWN
     ```

---

## 16. Migration Risk Analysis

```text
RISK TAXONOMY:
- DIRECTION 1: HIGH PRE-MIGRATION COMPLEXITY / LOW POST-MIGRATION RUNTIME RISK
- DIRECTION 2: LOW PRE-MIGRATION COMPLEXITY / HIGH POST-MIGRATION ARCHITECTURAL RISK
```

### Direction 1 Migration Risks
1. **Prerequisite Failure Risk**: Modifying legacy `public.santri` requires a dedicated migration package preceding PSB/Alumni. If that package encounters unmapped data or locking contention, deployment fails.
2. **DDL Lock Contention**: Adding columns and unique constraints to `public.santri` requires an `ACCESS EXCLUSIVE` lock on PostgreSQL, which will queue behind active queries on high-traffic production systems.
3. **Rollback Complexity**: If a rollback occurs after tenantizing `public.santri`, restoring the un-tenantized state requires careful schema reversal.

### Direction 2 Migration Risks
1. **Certification Invalidation Risk**: Bypassing composite foreign keys invalidates the entire Gate 8B audit and all 56 contract verification test cases. A complete re-audit cycle is required.
2. **Data Corruption / Integrity Risk**: Absence of database-level composite foreign keys introduces the risk of cross-tenant references accumulating silently over time due to edge-case bugs in application services.
3. **Architectural Technical Debt**: Reversing this decision later (migrating from global keys to composite tenant keys after PSB and Alumni data is populated) will require complex data cleansing and foreign key restructuring across multiple live ledgers.

---

## 17. Open Questions

The following questions require determination by the Product Owner and Lead Architect:

1. **Strategic Multi-Tenant Model**: Is `santri` defined philosophically as a **tenant-owned resource** (a student belonging strictly to a single pesantren institution) or as a **global individual identity** (a single student who may move between, apply to, or attend multiple independent pesantren institutions)?
2. **Production Historical Baseline**: Does the production database contain existing `santri` records? If so, what authoritative business rule or external data source defines their tenant ownership?
3. **Identity Datatype Strategy**: Should `users.merged_into_user_id` be aligned to `text` to match the existing `users.id` baseline (Pathway A), or should a project-wide initiative be scheduled to convert all user identifiers to native PostgreSQL `uuid` (Pathway B)?
4. **Governance Boundary**: Should `public.santri` tenantization be executed as an independent prerequisite work package (e.g., `WP-CORE-SANTRI-TENANTIZATION-001`), or should the scope of `WP-PSB-ALUMNI-SCHEMA-001` be modified?

---

## 18. Decision Inputs for Product Owner

```text
DECISION INPUT — NO RECOMMENDATION

The following facts and trade-offs are presented for Product Owner
and Lead Architect decision.

FACTS:
1. Live database public.santri does not have a tenant_id column (BCF-01).
2. Live database public.users.id is text; candidate DDL defined merged_into_user_id as uuid, creating a datatype mismatch (BCF-02).
3. Section 0 preflight failed to assert physical presence of santri.tenant_id, permitting an invalid execution attempt (BCF-03).
4. Verified sandbox counts: tenants=6, users=7, santri=0, academic_years=0.
5. Gate 9 migration was aborted with transaction rollback verified clean.

DIRECTION 1:
Key consequences:
- Requires tenantizing public.santri by adding tenant_id and composite uniqueness (tenant_id, id).
- Enforces strict database-level cross-tenant isolation via composite foreign keys in PSB and Alumni ledgers.
- Requires authoritative tenant mapping for historical records before NOT NULL enforcement.
- Retains compatibility with Gate 8B schema designs and contract test suite.
- Requires an upfront migration on legacy public.santri.

DIRECTION 2:
Key consequences:
- Keeps public.santri un-tenantized with single-column primary key.
- Decouples tenant scoping from foreign keys: foreign keys in PSB/Alumni reference santri(id) only.
- Does not enforce cross-tenant reference prevention at the database constraint layer; shifts isolation burden to application code and triggers.
- Invalidation of Gate 8B certification and requires complete refactoring of candidate DDL and contract tests.
- Zero upfront migration or data backfill required on legacy public.santri.

OPEN QUESTIONS:
1. Is a santri fundamentally a tenant-scoped entity or a global identity?
2. What authoritative source determines tenant ownership for existing production santri records?
3. Should identity foreign keys be normalized to text (matching current schema) or should all user IDs be migrated to uuid?
4. Should tenantization of core santri be handled in an independent prerequisite work package?

DECISION:
NOT MADE BY AGENT
```

---

## 19. Governance Stop Point

```text
ARCHITECTURAL DECISION ANALYSIS:
COMPLETE

DIRECTION:
NOT SELECTED

PRODUCT OWNER DECISION:
PENDING

DATABASE:
UNCHANGED

DDL:
UNCHANGED

MIGRATION:
NOT EXECUTED

APPLICATION CODE:
UNCHANGED

DRIZZLE:
UNCHANGED

GIT:
UNCHANGED

GATE 8B:
NO RE-AUDIT REQUESTED

GATE 9 RE-AUTHORIZATION:
NOT AUTHORIZED

NEXT STEP:
PRODUCT OWNER / LEAD ARCHITECT DECISION
```
