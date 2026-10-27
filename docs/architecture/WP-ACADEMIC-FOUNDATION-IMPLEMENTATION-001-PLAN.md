# WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001-PLAN
# ACADEMIC FOUNDATION IMPLEMENTATION PLAN
## Comprehensive Implementation Plan for Academic Year & Academic Term Foundation

**Document Identifier**: `WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001-PLAN`  
**Work Package ID**: `WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001`  
**Author**: Senior Software Engineer & Database Architect  
**Classification**: CONTROLLED IMPLEMENTATION PLAN (CODEBASE ONLY)  
**Date**: 2026-09-14  
**Target Horizon**: 10-Year Enterprise Lifecycle (100+ Pesantren / Tenants)  
**Status**: APPROVED FOR CODEBASE IMPLEMENTATION — LIVE MIGRATION EXECUTION DEFERRED  

---

## 1. Executive Summary & Objective

This document establishes the technical execution plan for implementing the **Academic Foundation (`academic_years` and `academic_terms`)** in MA'HAD MANAGER, addressing all findings from `WP-ACADEMIC-FOUNDATION-RECON-001`.

The objective is to establish an immutable, production-grade, multi-tenant temporal foundation for all academic modules (Hifzh Journal, Assessment, Academic Ledger, Transcripts, Teacher Assignments, and Teaching Sessions).

### Core Goals
1. Align the Drizzle ORM schema in `src/lib/db/schema/academic_workspace.ts` with PostgreSQL native `DATE` types, strict foreign keys, composite multi-tenant constraints, and status check constraints.
2. Prepare an idempotent, declarative migration script in `drizzle/WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001.sql` (without executing against live Supabase).
3. Implement a hardened service layer in `src/lib/services/academic-foundation-service.ts` managing:
   - Atomic year activation with automatic archiving of the previously active year.
   - Prevention of casual reactivation of archived years.
   - Cross-tenant parent year validation.
   - Single active/current term enforcement.
   - Date range and boundary validations.
4. Secure existing API endpoints in `src/app/api/academic/workspace/years/route.ts` and `terms/route.ts` by strictly deriving tenant context server-side (`getTenantContext()`), rejecting client-supplied tenant overrides.
5. Provide comprehensive automated contract and unit tests verifying all 19 test conditions specified in the work package.

---

## 2. Locked Architecture & Boundary Invariants

```
========================================================================================
                          LOCKED ARCHITECTURAL INVARIANTS
========================================================================================
APPLICATION DATABASE (Source of Truth)  =  SUPABASE POSTGRESQL
DATABASE ACCESS LAYER & ORM             =  DRIZZLE ORM
AUTHENTICATION & IDENTITY               =  SUPABASE AUTH
PHYSICAL FILE / BINARY STORAGE          =  TENANT-SPECIFIC GOOGLE DRIVE
DOCUMENT METADATA                       =  SUPABASE POSTGRESQL
ACTUAL DOCUMENT BINARIES                =  TENANT'S PRIVATE GOOGLE DRIVE
ACADEMIC STRUCTURED DATA                =  SUPABASE POSTGRESQL (NO GOOGLE DRIVE)
========================================================================================
```

### Strict Scope Demarcation
- **In-Scope**:
  - `academic_years` & `academic_terms` Drizzle schemas and types.
  - Idempotent migration script preparation.
  - Domain service business rules (lifecycle, activation, archiving, date validation).
  - API endpoint tenant security hardening.
  - Automated tests and verification.
- **Explicitly Out-of-Scope**:
  - Live execution of migration against Supabase PostgreSQL (requires separate explicit PO authorization).
  - Hifzh Journal implementation (`hifzh_journal_entries`).
  - Academic Ledger / Transcripts / Rapor calculations.
  - Redesign of student enrollment or teacher assignments.
  - Google Drive or file storage integration.

---

## 3. Data Model & Constraint Design

### 3.1 `academic_years` Entity
- `id`: `text PRIMARY KEY` (Prefixed format: `ay_<uuid>` or `ay_<timestamp>_<random>`)
- `tenant_id`: `text NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE`
- `name`: `text NOT NULL` (e.g. "2026/2027")
- `start_date`: `date NOT NULL` (PostgreSQL `DATE`, e.g. "2026-07-15")
- `end_date`: `date NOT NULL` (PostgreSQL `DATE`, e.g. "2027-06-20")
- `status`: `text DEFAULT 'planned' NOT NULL`
- `created_at`: `timestamp DEFAULT now() NOT NULL`
- `updated_at`: `timestamp DEFAULT now() NOT NULL`

#### Constraints & Indexes
1. `chk_ay_status`: `CHECK (status IN ('planned', 'active', 'archived'))`
2. `chk_ay_date_range`: `CHECK (start_date <= end_date)`
3. `uq_ay_tenant_name`: `UNIQUE (tenant_id, name)`
4. `uq_ay_tenant_composite`: `UNIQUE (tenant_id, id)` (Enables composite foreign key referencing)
5. `idx_ay_tenant_active`: `CREATE UNIQUE INDEX uq_ay_tenant_active ON public.academic_years (tenant_id) WHERE status = 'active'` (Guarantees at most ONE active year per tenant)
6. `idx_ay_tenant_status`: `CREATE INDEX idx_ay_tenant_status ON public.academic_years (tenant_id, status)`

---

### 3.2 `academic_terms` Entity
- `id`: `text PRIMARY KEY` (Prefixed format: `term_<uuid>`)
- `tenant_id`: `text NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE`
- `academic_year_id`: `text NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT`
- `name`: `text NOT NULL` (e.g. "Semester Ganjil", "Semester Genap")
- `start_date`: `date NOT NULL` (PostgreSQL `DATE`)
- `end_date`: `date NOT NULL` (PostgreSQL `DATE`)
- `is_current`: `boolean DEFAULT false NOT NULL`
- `status`: `text DEFAULT 'planned' NOT NULL`
- `created_at`: `timestamp DEFAULT now() NOT NULL`
- `updated_at`: `timestamp DEFAULT now() NOT NULL`

#### Constraints & Indexes
1. `chk_term_status`: `CHECK (status IN ('planned', 'active', 'closed'))`
2. `chk_term_date_range`: `CHECK (start_date <= end_date)`
3. `uq_term_year_name`: `UNIQUE (tenant_id, academic_year_id, name)`
4. `fk_term_composite_tenant_year`: `FOREIGN KEY (tenant_id, academic_year_id) REFERENCES public.academic_years (tenant_id, id) ON DELETE RESTRICT`
5. `idx_term_tenant_current`: `CREATE UNIQUE INDEX uq_term_tenant_current ON public.academic_terms (tenant_id) WHERE is_current = true` (Guarantees at most ONE current term per tenant)
6. `idx_term_tenant_active`: `CREATE UNIQUE INDEX uq_term_tenant_active ON public.academic_terms (tenant_id) WHERE status = 'active'` (Guarantees at most ONE active term per tenant)
7. `idx_term_tenant_year`: `CREATE INDEX idx_term_tenant_year ON public.academic_terms (tenant_id, academic_year_id)`

---

## 4. Lifecycle & Business Rule Matrix

### 4.1 Academic Year Lifecycle (`PLANNED` -> `ACTIVE` -> `ARCHIVED`)
- **Creation**: Academic years are created with status `'planned'`.
- **Activation (`activateAcademicYear`)**:
  - Executed inside an atomic transaction.
  - Automatically transitions any existing `'active'` year for the same tenant to `'archived'`.
  - Sets target year status to `'active'`.
  - Updates `updated_at`.
- **Archiving (`archiveAcademicYear`)**:
  - Manually or automatically transitioned to `'archived'`.
  - Immutable: Historical records linked to archived years cannot be deleted.
- **Reactivation Protection**:
  - An `'archived'` academic year cannot be casually reactivated via standard API calls.

### 4.2 Academic Term Lifecycle (`PLANNED` -> `ACTIVE` -> `CLOSED`)
- **Parent Year Binding**: Every term must belong to an academic year of the *same* tenant.
- **Cross-Tenant Blocking**: Attempting to link a term to another tenant's academic year is blocked both at the service layer and database composite FK level.
- **Activation (`activateAcademicTerm`)**:
  - Executed inside an atomic transaction.
  - Clears `is_current = false` for all terms of that tenant.
  - Sets target term status to `'active'` and `is_current = true`.
- **Closure (`closeAcademicTerm`)**:
  - Sets status to `'closed'` and `is_current = false`.

### 4.3 Date Range Containment Rule
- `start_date <= end_date` is enforced at the database check constraint level for both entities.
- The service layer performs date containment checks: a term's start and end dates should fall within the bounds of its parent academic year. If dates overflow, the service rejects creation with a detailed validation message.

---

## 5. Implementation Phases

```
[Phase Breakdown]

Phase 1: Drizzle Schema Alignment
- File: src/lib/db/schema/academic_workspace.ts
- Use date() columns, strict foreign keys, composite unique constraints, indexes

Phase 2: Migration SQL Preparation
- File: drizzle/WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001.sql
- Idempotent DDL, constraints, indexes, RLS enablement, tenant isolation policy
- Static SQL audit (zero DROP/TRUNCATE/DELETE)

Phase 3: Service Layer Implementation
- File: src/lib/services/academic-foundation-service.ts
- Export academicYearService and academicTermService
- Enforce transactional lifecycle, single-active rule, date containment, tenant isolation

Phase 4: API Layer Hardening
- Files: src/app/api/academic/workspace/years/route.ts & terms/route.ts
- Integrate getTenantContext() (server-derived tenant, reject client tenant override)
- Wire into domain service

Phase 5: Automated Testing Suite
- File: tests/contracts/academic-foundation.contract.test.ts
- 19 automated test cases covering creation, activation, archiving, cross-tenant rejection, etc.

Phase 6: Quality Gates & Verification
- Run Vitest contracts, TypeScript check (tsc --noEmit), ESLint baseline, Next.js build
```

---

## 6. Testing & Verification Matrix

The test suite will validate:
1. Academic Year creation with valid dates and planned status.
2. Tenant isolation (queries scoped strictly to tenant).
3. Rejection of duplicate Academic Year names within the same tenant.
4. Acceptance of identical Academic Year names across different tenants.
5. Rejection of invalid date range (`start_date > end_date`).
6. Activation workflow: transitions planned year to active.
7. Auto-archive rule: activating a new year archives the previous active year.
8. Single active year invariant: cannot have two active years for one tenant.
9. Academic Term creation with valid parent year.
10. Term correctly bound to parent Academic Year.
11. Cross-tenant rejection: cannot create a term pointing to another tenant's year.
12. Rejection of duplicate Term names within the same Academic Year.
13. Acceptance of identical Term names under different Academic Years.
14. Rejection of invalid Term date range.
15. Term lifecycle: transitions from active to closed.
16. Anti-cascade protection: historical records preserved.
17. Client tenant spoofing rejection: client request body `tenantId` is ignored in favor of server context.
18. Safe API error handling without exposing database internals.
19. Transactional concurrency safety.

---

## 7. Migration Safety & Live Database Policy

- **No live DDL execution**: The migration SQL file is created in the repository for review only.
- **Separate PO Authorization**: Execution against live Supabase PostgreSQL is deferred to a subsequent execution work package.
- **No Commit / No Push**: All changes remain in the local working tree.
