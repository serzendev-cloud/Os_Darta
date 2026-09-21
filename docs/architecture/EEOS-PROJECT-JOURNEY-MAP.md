# EEOS — PROJECT JOURNEY MAP & CURRENT STATE BASELINE

> **AUTHORITATIVE DIRECTIVE FOR ALL AGENTS**:  
> This document is the single source of truth for the current project state, active phase, active work package, locked architectural decisions, and closed gates.  
> **NEVER** infer the current project state, next steps, or authorization status from historical Work Package documents, audit trails, or conversational memory.

---

# CURRENT PROJECT POSITION

```text
Current Phase:
ROLE PREVIEW PLATFORM HARDENING

Current Work Package:
WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-001

Status:
IMPLEMENTED (PERSISTENT POSTGRESQL ORIGIN TICKET COMPLETED & VERIFIED)

Blocker:
Awaiting Independent Distributed Security Verification.

Next Gate:
Independent Distributed Security Verification Gate

Database Mutation:
COMPLETED (Migration 0004_preview_origin_tickets applied)

Code Mutation:
COMPLETED (Authorized scope: schema, preview-origin-ticket, routes, contract tests)

Git Mutation:
COMMIT AUTHORIZED (PUSH STRICTLY FORBIDDEN)
```

---

# AGENT STARTUP CONTRACT

Before starting any Work Package or responding to architectural/development tasks, every Agent **MUST** read:

```text
docs/architecture/EEOS-PROJECT-JOURNEY-MAP.md
```

This document is the authoritative navigation map for the current project state.

### Mandatory Agent Checklist on Startup:
Agent **MUST** identify and align with:
1. **Current Phase**: `ROLE PREVIEW PLATFORM HARDENING`
2. **Current Work Package**: `WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-DESIGN-002`
3. **Current Status**: `PRE-IMPLEMENTATION DESIGN REVIEW (FILE IMPACT COMPLETE)`
4. **Closed Gates**: Clean-Slate Reset, MB-01, MB-02, MB-03, MB-04, MB-06, WP-02
5. **Locked Decisions**: HIST-1, GURU-2, RLS-2, MB-06 Ratified Tenant Resolution & Identity Model, Storage Candidate A (PostgreSQL)
6. **Last Verified Commits**:
   - `7c41141` (`feat(db): tenantize santri and scope nis per tenant`)
   - `a49bd4d` (`feat(auth): implement hardened platform role preview with origin tickets and contract verification`)
   - `e79f389` (`docs(audit): add role preview platform git push execution report`)
7. **Current Blockers**: Awaiting Product Owner Implementation Authorization.
8. **Next Gate**: Product Owner Implementation Authorization Gate

> **CRITICAL INSTRUCTION ON HISTORICAL DOCUMENTS**:  
> Historical Work Package documents in `docs/architecture/` (e.g. `WP-CLEAN-SLATE-DUMMY-DATA-AUDIT-001`, `WP-CORE-SANTRI-TENANTIZATION-PRE-IMPLEMENTATION-GATE`, `WP-02-*`, `WP-GATE03-*`, `WP-GATE04-*`, `WP-MB06-*`) represent frozen historical snapshots at their time of creation.  
> They **MUST NOT** be used to infer the current project position.  
> If an older document contains strings such as:
> - `AWAITING AUTHORIZATION`
> - `READY FOR RESET`
> - `READY FOR WP-02`
> - `PENDING MB-02`
> - `PENDING MB-03`
> - `PENDING MB-04`
> - `NEXT ACTION`
>
> The Agent **MUST** treat those statements strictly as historical audit records that were subsequently resolved, ratified, implemented, and closed.

---

# CONTRADICTION RULE

If an Agent encounters an apparent discrepancy where:

```text
Project Journey Map
        ≠
Git / Database / Work Package evidence
```

The Agent is **STRICTLY FORBIDDEN** from guessing, resolving discrepancies autonomously, or initiating mutations.

The Agent **MUST**:
1. **STOP** all actions immediately.
2. **REPORT THE CONTRADICTION** explicitly and transparently with exact diffs/references.
3. **WAIT FOR THE PRODUCT OWNER** to provide explicit clarification or ratification.

---

# CLOSED — DO NOT REOPEN

The following milestones, architecture decisions, and implementation packages are officially **CLOSED** and ratified by the Product Owner. Historical documents detailing their discovery and planning remain in `docs/architecture/` solely as an audit trail:

| Item | Title / Scope | Final Decision & Ratification State | Status |
|---|---|---|---|
| **MB-01** | Legacy Dummy Data Clean-Slate | **HIST-1 CLEAN SLATE**: Existing Santri & Guru dummy data does not require historical data migration or mapping. Fresh start baseline adopted. | **CLOSED** |
| **MB-02** | Login Experience & Tenant Scoping | **RATIFIED**: Native app, One login surface, Tenant Code as login context for NIS, NIS strictly tenant-scoped, Email login using active tenant membership, Persistent session. | **CLOSED / RATIFIED** |
| **MB-03** | Guru Tenant Boundary | **GURU-2 DEFERRED**: Guru tenantization is explicitly decoupled and excluded from WP-02. | **CLOSED** |
| **MB-04** | Database RLS Role Pattern | **RLS-2 DEDICATED APPLICATION DB ROLE**: Dedicated application database role pattern ratified. | **CLOSED** |
| **MB-06** | Tenant Resolution & Code Specification | **RATIFIED**: Tenant Code formatted as `VARCHAR(10)`, matching regex `^[A-Z0-9]{2,10}$`, strictly immutable. Santri schema contains `tenant_id` and `user_id`. | **CLOSED / RATIFIED** |
| **WP-02** | Core Santri Tenantization | **IMPLEMENTED & VERIFIED** in commit `7c41141`. DDL executed and verified. | **CLOSED** |
| **Clean-Slate Reset** | Database baseline reset | Database reset and schema foundation aligned. | **CLOSED** |

---

# DETAILED AUDIT BASELINE

## 1. Milestone & Decision Register

### MB-01: Legacy Dummy Data Strategy
- **Status**: `CLOSED`
- **Decision**: `HIST-1 CLEAN SLATE`
- **Rationale**: Existing Santri and Guru dummy data in development environments did not reflect production schemas and required no complex historical backfill or mapping. Clean-slate strategy was ratified and executed.

### MB-02: Native Multi-Tenant Authentication & Session Architecture
- **Status**: `CLOSED / RATIFIED`
- **Architectural Tenets**:
  1. **Native App**: Single unified application surface.
  2. **One Login Surface**: Seamless entry for both email-based and NIS-based actors.
  3. **Tenant Code Context**: Tenant Code (`tenants.code`) serves as the explicit resolution context for NIS credentials.
  4. **Tenant-Scoped NIS**: NIS is unique only within the boundary of a specific tenant (`UNIQUE (tenant_id, nis)`).
  5. **Email Login Membership**: Direct email credentials authenticate against active tenant memberships.
  6. **Persistent Session**: Secure, persistent session handling across tenant contexts.

### MB-03: Guru Tenant Boundary
- **Status**: `CLOSED`
- **Decision**: `GURU-2 DEFERRED`
- **Rationale**: Guru domain tenantization was isolated from the critical path of WP-02 to minimize blast radius and ensure zero-regression on Santri core invariants.

### MB-04: Database Security & RLS Model
- **Status**: `CLOSED`
- **Decision**: `RLS-2 DEDICATED APPLICATION DB ROLE`
- **Rationale**: Direct application queries execute under a dedicated application DB role enforcing tenant context variables and RLS boundary policies.

### MB-06: Tenant Resolution & Santri Schema Specifications
- **Status**: `CLOSED / RATIFIED`
- **Invariants**:
  - `tenants.code`: Defined as `VARCHAR(10)`, constrained by regex `^[A-Z0-9]{2,10}$`, and immutable once generated.
  - `santri`: Explicitly enforces multi-tenant identity via:
    - Foreign key: `tenant_id` referencing `tenants(id)`.
    - Association: `user_id` referencing `users(id)`.
    - Multi-tenant unique constraint: `UNIQUE (tenant_id, nis)`.
    - Composite unique constraint: `UNIQUE (tenant_id, id)`.
    - Partial unique constraint: `UNIQUE (tenant_id, user_id)` where `user_id IS NOT NULL`.

---

## 2. WP-02: Core Santri Tenantization

```text
WORK PACKAGE:
WP-02-CORE-SANTRI-TENANTIZATION-001

STATUS:
IMPLEMENTED / VERIFIED

COMMIT:
7c411417b120c151fbce1cfbb42c54bc117aee29 (Short: 7c41141)
```

### Core Deliverables Verified in Commit `7c41141`:
- Schema column additions: `tenants.code`, `santri.tenant_id`, `santri.user_id`.
- Relational integrity constraints:
  - `UNIQUE (tenant_id, nis)`
  - `UNIQUE (tenant_id, id)`
  - Partial `UNIQUE (tenant_id, user_id)`
- Immutability trigger/rules for `tenants.code`.

> **STRICT DIRECTIVE ON WP-02**:  
> **WP-02 IS COMPLETELY IMPLEMENTED AND MERGED.**  
> Under NO circumstances should any Agent document or suggest:
> - `READY FOR DDL`
> - `AWAITING WP-02 AUTHORIZATION`
> - `NEXT: ALTER TABLE santri`  
> WP-02 is finalized history.

---

## 3. Platform Role Preview System

```text
STATUS:
IMPLEMENTED

COMMIT:
a49bd4d4054a9ead76de6636d57a60582f3b05af (Short: a49bd4d)
```

### System Architecture:
```text
Super Admin SaaS
       │
       ▼
Preview Platform (/dashboard/saas/preview)
       │
       ▼
Permanent Preview Personas
```

### Permanent Preview Personas:
1. **Developer**: System engineering & introspection.
2. **Super Admin**: SaaS platform-level operations.
3. **Admin Pesantren**: Single-tenant administrative management.
4. **Musyrif**: Boarding supervisor & student counselor.
5. **Wali**: Guardian / Parent persona.
6. **Santri**: Student learning & evaluation persona.

### Core Modules:
- Platform UI: `src/app/dashboard/saas/preview/page.tsx`
- Banner & Controls: `src/components/shared/PreviewIndicator.tsx`
- Entrance Handler: `src/app/api/auth/role-preview/route.ts`
- Exit Handler: `src/app/api/auth/role-preview/exit/route.ts`

---

## 4. Origin Ticket System & Hardening

```text
STATUS:
IMPLEMENTED / HARDENED (Contract Tests Verified)
DISTRIBUTED PERSISTENT STATE: REQUIRES INDEPENDENT AUDIT (CURRENT BLOCKER)
```

### Technical Specification:
- **Module**: `src/lib/authz/preview-origin-ticket.ts`
- **Security Primitives**:
  - Opaque cryptographically random ticket structure.
  - HMAC-SHA256 signature verification with timing-safe comparison (`crypto.timingSafeEqual`).
  - Unique token identifier (`jti`) for replay detection.
  - Bounded TTL expiration (short-lived ephemeral lifecycle).
  - Single-use consumption pattern.
  - Original session restoration upon exit.
  - Server-side authorization check before token generation.

### Verification Baseline:
- **Contract Tests**: 23/23 passing in `tests/contracts/role-preview.contract.test.ts`.
- **Full Test Suite**: 295/295 tests passing locally during pre-commit.

### Outstanding Audit Requirement:
```text
DISTRIBUTED PERSISTENT STATE
= STILL REQUIRES INDEPENDENT AUDIT
```
> **Current Blocker / Next Audit**:  
> In-memory or localized replay stores do not guarantee atomic single-use semantics across multi-instance, serverless, or distributed environments. Independent audit `WP-ROLE-PREVIEW-ORIGIN-TICKET-DISTRIBUTED-AUDIT-001` must formally verify runtime persistence and cross-instance invalidation before production release.

---

## 5. Git Governance Record & Deviation Registry

### Key Release Commits:
- **WP-02 Execution**: `7c41141` (`feat(db): tenantize santri and scope nis per tenant`)
- **Role Preview Platform**: `a49bd4d` (`feat(auth): implement hardened platform role preview with origin tickets and contract verification`)
- **Push Execution Report**: `e79f389` (`docs(audit): add role preview platform git push execution report`)

### Recorded Governance Deviation:
```text
Commit Authorization:
GRANTED (Properly authorized)

Push Authorization:
NOT GRANTED (Unauthorized premature push to remote)

Actual Push:
OCCURRED (Pushed to origin/preview)

Status:
GOVERNANCE DEVIATION RECORDED
```

> **ACTION RULE**:  
> **DO NOT** execute Git revert, force push, branch deletion, or corrective Git commands.  
> The deviation has been documented for transparency, and current work remains read-only pending Product Owner authorization.

---

# PERMISSIBLE VS FORBIDDEN OPERATIONS

For the current project position:

### ALLOWED
- `READ` (inspect repository files, architecture docs, git history)
- `AUDIT` (read-only verification of contracts, runtime state assumptions)
- `COMPARE` (diff analysis between requirements and code)
- `DOCUMENT` (updating this Journey Map or generating read-only audit reports)

### FORBIDDEN
- `DATABASE CHANGE` (no DDL, DML, or schema alterations)
- `MIGRATION` (no running Drizzle or Supabase migration scripts)
- `SOURCE CODE CHANGE` (no modifying application or test source files)
- `GIT COMMIT` (no staging or committing code)
- `GIT PUSH` (no network pushes to any remote)
- `DEPLOYMENT` (no deploying to Vercel, Supabase, or external targets)
- `ENVIRONMENT CHANGE` (no editing production or staging env vars)
- `RESET` (no database resets, no seed resets, no table purges)

---

# DOCUMENT REVISION HISTORY

| Date | Revision | Author / Agent | Changes Summary |
|---|---|---|---|
| 2026-09-21 | 1.0.0 | Antigravity (AI System Architect) | Initial creation of authoritative Project Journey Map, locking closed gates (MB-01..MB-06, WP-02), recording Git governance deviation, and anchoring current position to `WP-ROLE-PREVIEW-ORIGIN-TICKET-DISTRIBUTED-AUDIT-001`. |
