# EEOS — PROJECT JOURNEY MAP & CURRENT STATE BASELINE

> **AUTHORITATIVE DIRECTIVE FOR ALL AGENTS**:  
> This document is the single source of truth for the current project state, active phase, active work package, locked architectural decisions, and closed gates.  
> **NEVER** infer the current project state, next steps, or authorization status from historical Work Package documents, audit trails, or conversational memory.

---

# CURRENT PROJECT POSITION

```text
Current Phase:
TENANT INFRASTRUCTURE, DOMAIN BOUNDARIES & PRE-PRODUCTION VERIFICATION

Current Work Package:
WP-LIVE-PREVIEW-TENANT-DOMAIN-E2E-VERIFICATION-001

Status:
DNS AUTHORITY TRANSITIONED; WILDCARD SSL GENERATING; AWAITING LIVE PREVIEW E2E

Blocker:
WILDCARD SSL / LIVE DNS PROPAGATION

Migration Identifier:
NONE (0 active pending migrations)

Database Mutation:
NONE (Zero database modifications)

Test Status:
- 403/403 Full Workspace Vitest Suite PASS (Contract, Security, Unit, SSR)
- Next.js 16 Production Build PASS (88/88 routes compiled)
- TypeScript Typecheck PASS (0 errors, clean worktree verified)

Next Gate:
LIVE PREVIEW TENANT DOMAIN E2E VERIFICATION

Last Verified Commit:
d5a3a53 (fix(domain): enforce tenant hostname root boundary)
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
1. **Current Phase**: `TENANT INFRASTRUCTURE, DOMAIN BOUNDARIES & PRE-PRODUCTION VERIFICATION`
2. **Current Work Package**: `WP-LIVE-PREVIEW-TENANT-DOMAIN-E2E-VERIFICATION-001`
3. **Current Status**: `DNS AUTHORITY TRANSITIONED; WILDCARD SSL GENERATING; AWAITING LIVE PREVIEW E2E`
4. **Closed Gates**: Clean-Slate Reset, MB-01, MB-02, MB-03, MB-04, MB-06, WP-02, Role Preview Platform Hardening, Origin Ticket PostgreSQL Storage, Module Feature Flags, Tenant Provisioning & Zero-Password Flow, Tenant Hard Delete Lifecycle Engine, Resend Verified Domain Dispatch, Tenant Onboarding Session Refresh, Tenant Root Domain & Fail-Closed Proxy Boundary
5. **Locked Decisions**: HIST-1, GURU-2, RLS-2, MB-06 Ratified Tenant Resolution & Identity Model, Storage Candidate A (PostgreSQL), PROD-MOBILE-01 White-Label Mobile Add-on
6. **Last Verified Commits**:
   - `7c41141` (`feat(db): tenantize santri and scope nis per tenant`)
   - `a49bd4d` (`feat(auth): implement hardened platform role preview with origin tickets and contract verification`)
   - `e79f389` (`docs(audit): add role preview platform git push execution report`)
   - `77c4c45` (`feat(auth): implement postgresql persistent origin ticket storage`)
   - `2bf3ada` (`feat(saas): implement automated SRYYNN tenant code counter and invitation onboarding flow`)
   - `be15b94` (`fix(saas): harden module feature tenant rendering`)
   - `843247c` (`fix(auth): close tenant invitation lifecycle bypass`)
   - `55e2648` (`fix(saas): remove initial tenant password flow`)
   - `591789b` (`fix(saas): align hard delete with tenant schema`)
   - `d6483cf` (`feat(email): migrate resend sender to verified domain`)
   - `9b5f57f` (`fix(auth): refresh onboarding session before dashboard`)
   - `d5a3a53` (`fix(domain): enforce tenant hostname root boundary`)
7. **Current Blockers**: `WILDCARD SSL / LIVE DNS PROPAGATION`
8. **Next Gate**: `LIVE PREVIEW TENANT DOMAIN E2E VERIFICATION`

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
| **Origin Ticket PostgreSQL Persistence** | Role Preview Origin Ticket Persistent Storage | **IMPLEMENTED & VERIFIED** in commit `77c4c45`. PostgreSQL persistent storage table, timing-safe validation, single-use ticket lifecycle. | **CLOSED / IMPLEMENTED & VERIFIED** |
| **Module Feature Flags** | Module Feature Flags Remediation | **IMPLEMENTED & VERIFIED** in commit `be15b94`. Safe navigation and fallback boundaries for tenant modules. | **CLOSED / IMPLEMENTED & VERIFIED** |
| **Tenant Provisioning & Zero-Password Flow** | SRYYNN Automated Counter & Zero-Password Provisioning UI | **IMPLEMENTED & VERIFIED** in commits `2bf3ada` and `55e2648`. Automated tenant code counter, invite links, zero-password UI. | **CLOSED / IMPLEMENTED & VERIFIED** |
| **Tenant Invitation Lifecycle** | Strict Invitation Lifecycle Gates | **IMPLEMENTED & VERIFIED** in commit `843247c`. Strict INVITED status gate enforcement, invite bypass eliminated. | **CLOSED / IMPLEMENTED & VERIFIED** |
| **Tenant Hard-Delete Engine & UI** | Tenant Hard-Delete Lifecycle Engine & UI | **IMPLEMENTED & VERIFIED** in commits `27480a2`, `b32af7f`, and `591789b`. Hard-delete lifecycle engine, schema alignment, fail-closed safety guard. | **CLOSED / IMPLEMENTED & VERIFIED** |
| **Resend Verified Domain Dispatch** | Resend Email Sender Domain Migration | **IMPLEMENTED & VERIFIED** in commit `d6483cf`. Verified domain sender `no-reply@serzen-dev.my.id`. | **CLOSED / IMPLEMENTED & VERIFIED** |
| **Tenant Onboarding Session Refresh** | Strict ACTIVE app_metadata Token Refresh | **IMPLEMENTED & VERIFIED** in commit `9b5f57f`. Strict `ACTIVE` status validation before dashboard routing. | **CLOSED / IMPLEMENTED & VERIFIED** |
| **Tenant Root Domain & Proxy Boundary** | Tenant Root Domain & Fail-Closed Proxy Boundary | **IMPLEMENTED & VERIFIED** in commit `d5a3a53`. Root domain `serzen-dev.my.id`, strict tenant slug matching, fail-closed resolution. | **CLOSED / IMPLEMENTED & VERIFIED** |
| **PROD-MOBILE-01** | White-Label Native Mobile App as Tenant Add-on | **APPROVED / ROADMAP LOCKED**: Paid add-on per tenant producing a white-labeled native mobile app with tenant-specific branding while sharing the exact same Tenant, identity, backend, and data without tenant duplication. | **LOCKED (FUTURE ROADMAP — NOT CURRENT SPRINT)** |

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
IMPLEMENTED / HARDENED / VERIFIED

COMMIT:
a49bd4d (Core Engine) & 77c4c45 (PostgreSQL Persistent Storage)

DISTRIBUTED PERSISTENT STATE:
POSTGRESQL PERSISTENT STORAGE IMPLEMENTED AND VERIFIED
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
  - PostgreSQL persistent storage engine for cross-instance / serverless atomicity.

### Verification Baseline:
- **Contract Tests**: 23/23 passing in `tests/contracts/role-preview.contract.test.ts`.
- **Full Test Suite**: 403/403 tests passing locally and in pre-commit verification.

### Historical Audit Closure:
```text
DISTRIBUTED PERSISTENT STATE RESOLUTION:
RESOLVED & VERIFIED IN COMMIT 77c4c45
```
> **Audit Resolution Summary**:
> PostgreSQL persistent origin-ticket storage was ratified under Storage Candidate A and implemented via commit `77c4c45`. Independent distributed security verification (`WP-ROLE-PREVIEW-ORIGIN-TICKET-INDEPENDENT-DISTRIBUTED-SECURITY-VERIFICATION-001`) and live smoke verification confirmed atomic single-use invalidation across serverless instances. Historical blocker is formally resolved.

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

## 6. Product Roadmap Decision: White-Label Native Mobile App as Tenant Add-on

```text
PRODUCT DECISION:
WHITE-LABEL NATIVE MOBILE APP AS TENANT ADD-ON

DECISION IDENTIFIER:
PROD-MOBILE-01

STATUS:
APPROVED / ROADMAP LOCKED

SCOPE:
Per Tenant

COMMERCIAL MODEL:
Paid SaaS Add-on

IMPLEMENTATION STATUS:
FUTURE ROADMAP — NOT CURRENT SPRINT
```

### Executive Summary:
APP MA'HAD will provide a **White-Label Native Mobile App** as a paid add-on that can be activated for an existing Tenant.

The add-on produces a native mobile application with tenant-specific branding and application identity while continuing to use the exact same Tenant, identity system, authorization model, backend, and tenant data without tenant duplication or database migration.

---

### Product Evolution Model:

```text
APP MA'HAD SaaS
    │
    ├── SaaS Plans
    │
    ├── Modules
    │
    └── Add-ons
          │
          └── White-Label Native Mobile App
```

#### Conceptual Tenant Evolution:

```text
Before Add-on:
Tenant
  └── Web App

After Add-on:
Tenant
  ├── Web App
  └── White-Label Native Mobile App
```

Both channels (Web App and White-Label Native Mobile App) authenticate and operate against the exact same Tenant identity, authorization rules, backend APIs, and tenant database records.

---

### Non-Negotiable Invariants:

1. **One Tenant remains one Tenant**: A tenant activating this add-on maintains a single tenant entity in the system.
2. **No Tenant Duplication**: Activating the White-Label Mobile Add-on **MUST NOT** create a new Tenant record or tenant schema.
3. **Unified Identity**: Existing user identities (Santri, Wali, Guru, Staff, Musyrif, Alumni, Admin) remain unchanged and shared across web and mobile.
4. **Unified Operational Data**: Existing Santri, Wali, Guru, Alumni, PSB (admissions), academic, financial, and all other tenant operational records remain in the same Tenant.
5. **Existing Backend Engine**: The mobile application strictly consumes the existing APP MA'HAD backend services and APIs.
6. **Authoritative Security Boundary**: Existing authorization policies, role definitions, and multi-tenant isolation rules (including Supabase RLS and application-layer tenant filters) remain authoritative.
7. **Client/Channel Expansion**: The mobile app is an additional client/distribution channel, **not** a secondary or divergent backend system.
8. **Tenant-Specific Branding Scope**: Customization applies exclusively to client-level presentation and distribution identities, including:
   - Application Name
   - App Icon
   - Splash Screen
   - Visual Branding & Color Palette / Theme
   - Native Application / Package Identity (`applicationId` / `bundleIdentifier`)
   - Store Listing Identity (Google Play Store & Apple App Store listings)
9. **Shared Mobile Foundation**: A unified, common mobile codebase foundation should be designed to support automated tenant-specific native builds.
10. **Channel Upgrade Semantics**: Upgrading to White-Label Native Mobile is a capability/channel upgrade for the tenant, **not** a tenant data migration.
11. **Technology Selection Deferred**: Mobile architecture and technology selection remain **FUTURE DECISIONS**.
12. **Zero Implementation Technology Lock**: No implementation technology (e.g., Flutter, React Native, Native Kotlin/Android, Native Swift/iOS) is locked by this decision.

---

### Future Architecture Intent:

```text
                    APP MA'HAD CORE
                          │
              ┌───────────┴───────────┐
              │                       │
          Web Client            Mobile Clients
                                      │
                         ┌────────────┼────────────┐
                         │            │            │
                     Tenant A     Tenant B     Tenant C
                    White-Label  White-Label  White-Label
```

All clients continue to consume the same multi-tenant backend and respect the same tenant isolation and authorization boundaries.

> **IMPORTANT**: This architecture is an intentional target for future roadmaps. It is **NOT** to be implemented in the current sprint.

---

### Intended Future Implementation Sequence:

1. **Stabilize Core SaaS**: Complete platform stabilization, error boundaries, and module feature flags.
2. **Production Readiness**: Complete tenant provisioning, identity verification, domain resolution boundaries, and production readiness checks.
3. **Define Mobile Architecture Decision**: Conduct formal evaluation and publish Architecture Decision Record (ADR) for mobile technology stack.
4. **Build Shared Mobile Foundation**: Establish base mobile client architecture if adopted.
5. **Implement White-Label Mobile Add-on**: Implement tenant add-on activation, configuration, and tenant branding metadata schemas.
6. **Implement Tenant-Specific Mobile Build Pipeline**: Build CI/CD automation for parameter-driven white-label asset injection and compilation.
7. **Support Tenant-Specific Native Application Distribution**: Establish store publishing and release workflows per tenant.

---

## 7. Domain Infrastructure & Pre-Production Verification Roadmap

```text
DOMAIN ARCHITECTURE:
Root Domain: serzen-dev.my.id
Tenant Domain Pattern: <slug>.serzen-dev.my.id
Wildcard Domain: *.serzen-dev.my.id

CURRENT VERCEL PREVIEW STATE:
serzen-dev.my.id: Valid Configuration
www.serzen-dev.my.id: Valid Configuration
os-darta-kohl.vercel.app: Valid Configuration
*.serzen-dev.my.id: Attached to Preview (Generating SSL Certificate)
```

### Immediate Pre-Production Verification Sequence:

```text
Current Active Gate:
LIVE PREVIEW TENANT DOMAIN E2E VERIFICATION (WP-LIVE-PREVIEW-TENANT-DOMAIN-E2E-VERIFICATION-001)
```

1. **Confirm Wildcard SSL / DNS Propagation**: Wait for Vercel wildcard SSL generation on `*.serzen-dev.my.id` to transition from *Generating* to *Valid Configuration*.
2. **Execute Live Tenant Domain Probe**: Test live HTTPS/HTTP access on configured tenant subdomains (e.g., `https://pp-darunnajah.serzen-dev.my.id`).
3. **Verify Tenant Hostname Resolution**: Confirm proxy correctly extracts candidate slug under authorized root and rejects out-of-boundary hostnames.
4. **Verify Preview Routing**: Confirm Next.js dynamic routing and middleware route requests accurately to tenant context without infinite redirection.
5. **Verify Multi-Tenant Isolation**: Verify Supabase RLS and application context isolate tenant data strictly.
6. **Verify Authentication & Session Behavior**: Confirm login, invitation onboarding, session persistence, and role preview operate cleanly on live subdomains.
7. **Complete Live Preview E2E**: Formal sign-off on live preview end-to-end milestone.
8. **Conduct Final Release-Readiness Audit**: Complete comprehensive repository integrity and production preflight audit.
9. **Determine Production Readiness**: Product Owner formal evaluation for Production deployment.
10. **Preview → Production Promotion**: Execute authorized promotion to production environment.

> **CRITICAL NOTE**: Do NOT mark any future step as completed until verified by runtime evidence.

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
| 2026-09-22 | 1.1.0 | Antigravity (AI System Architect) | Update status following successful implementation of `WP-TENANT-PROVISIONING-INVITATION-001` (automated SRYYNN counter, Supabase invite links, Resend email dispatch, and first-time password onboarding flow). |
| 2026-09-28 | 1.2.0 | Antigravity (AI System Architect) | Record locked product decision for White-Label Native Mobile App as paid Tenant Add-on (`PROD-MOBILE-01`), documenting product evolution model, 12 non-negotiable invariants, future architecture intent, and 7-stage roadmap sequence. |
| 2026-09-28 | 1.3.0 | Antigravity (AI System Architect) | Reconciled authoritative project current state after tenant infrastructure and domain-boundary milestones; aligned Agent Startup Contract with current Preview verification phase; closed obsolete origin-ticket blocker; recorded completed tenant/domain milestones; and established Live Preview Tenant Domain E2E Verification as the next active gate. |
