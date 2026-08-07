# CIP-WP-002 Implementation Plan

**APP MA'HAD Enterprise ERP — Execution Sprint 0**

| Metadata | Value |
|----------|-------|
| **Document** | CIP-WP-002 Implementation Plan |
| **Official Title** | Multi-Tenant Foundation & Session Context |
| **Work Package ID** | CIP-WP-002 |
| **Architect Note** | AN-002 (Multi-Tenant RLS & Session Context Hardening) |
| **RAR Finding** | RAR-SEC-004 (Inconsistent Multi-Tenant RLS Claims) |
| **ETP Task** | ETP-T1.2 (RLS & Middleware Claims Hardening) |
| **ESP0 Work Package** | ESP0-WP-002 (Security & Isolation Baseline) |
| **Version** | 1.0 |
| **Status** | OFFICIAL — PLANNING COMPLETE |
| **Classification** | SPRINT 0 ENGINEERING SPECIFICATION |
| **Target Branch** | `sprint-0/wp-002` |
| **Date** | 2026-08-07 |

---

## Executive Summary

This document specifies the exact, non-negotiable engineering plan for **CIP-WP-002 (Multi-Tenant Foundation & Session Context)**. 

It establishes the multi-tenant session context extraction pipeline, Supabase server/client factory context injection, and Row-Level Security (RLS) claim propagation infrastructure. It enforces strict scope boundaries prohibiting feature development, UI changes, or database migrations during this work package.

---

# SECTION 1: Purpose & Scope Boundaries

### 1.1. Purpose
Establish a hardened, multi-tenant session context resolution pipeline in `src/core/lib/tenant/` and `src/core/lib/supabase/`, ensuring every database query automatically dereferences `tenant_id` from validated JWT claims or middleware request headers.

### 1.2. Scope Boundary Matrix

| Category | Included in CIP-WP-002 Scope | Explicitly Out of Scope |
|----------|------------------------------|--------------------------|
| **Tenant Infrastructure** | `TenantContext` interface, `getTenantContext()` helper, `x-tenant-id` header resolution | Multi-cluster router, tenant database sharding scripts |
| **Security & Auth** | Supabase client RLS claims session setter, Next.js middleware JWT extraction | OAuth provider integration, custom auth UI forms |
| **Core Libraries** | `src/core/lib/supabase/server.ts`, `src/core/lib/supabase/client.ts`, `src/middleware.ts` | Business domain services, Santri/Academic/Finance modules |
| **Database & SQL** | RLS policy parameter specification (`auth.jwt() ->> 'tenant_id'`) | DDL migrations, table alterations, seed data |
| **Testing & Quality** | Vitest unit tests for tenant context resolver & middleware header injection | End-to-end Playwright UI tests |

---

# SECTION 2: Repository Impact Matrix

| Target File / Path | Action | Description & Architectural Purpose |
|-------------------|--------|--------------------------------------|
| `src/core/lib/tenant/context.ts` | **CREATE** | Defines `TenantContext` interface (`tenantId`, `userId`, `role`, `pesantrenName`) and server-side reader. |
| `src/core/lib/supabase/server.ts` | **CREATE** | Server-side Supabase client factory automatically injecting `x-tenant-id` header/claims into RLS context. |
| `src/core/lib/supabase/client.ts` | **CREATE** | Client-side Supabase client singleton with tenant context headers. |
| `src/middleware.ts` | **CREATE** | Next.js Edge middleware inspecting JWT/headers and decorating request headers with validated tenant context. |
| `src/core/lib/tenant/__tests__/context.test.ts` | **CREATE** | Unit tests verifying tenant context extraction and invalid request rejection. |

---

# SECTION 3: Dependency Matrix

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CIP-WP-002 DEPENDENCY CHAIN                         │
├─────────────────────────────────────────────────────────────────────────┤
│ PREREQUISITE (Completed):                                               │
│   • CIP-WP-001: Clean Directory Realignment (src/core/lib/ established) │
│                                                                         │
│ CURRENT DEPENDENCY (CIP-WP-002 Scope):                                  │
│   • Next.js middleware request headers → TenantContext Reader           │
│   • TenantContext Reader → Supabase Server Client Factory               │
│                                                                         │
│ DOWNSTREAM DEPENDENTS (Blocked until CIP-WP-002 Complete):              │
│   • CIP-WP-003: Santri State Machine (Requires tenant context)          │
│   • CIP-WP-005: Outbox Event Bus (Requires tenant_id in outbox events)  │
│   • CIP-WP-006: Redis Multi-Tenant Cache (Requires tenant key prefix)   │
│   • CIP-WP-008: Custom AST Linter (Validates tenant_id params)           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

# SECTION 4: Engineering Decision Log

### Decision DEC-WP002-001: Header-Based Tenant Context Injection in Middleware
- **Decision**: Next.js Edge Middleware (`src/middleware.ts`) extracts `tenant_id` from session JWT claims (or `x-tenant-id` request header during internal API calls) and forwards it via mutated request headers `x-tenant-id` to Server Components and Server Actions.
- **Reason**: Decouples domain logic from authentication token parsing; provides sub-millisecond tenant resolution across server render paths.
- **Evidence**: EARS Part 3 §4.2 Multi-Tenant Core Platform Architecture; Supabase RLS Claims Standard.
- **Alternatives Considered**: Direct cookie parsing inside individual repository functions (Rejected — causes code duplication and security bypass risk).
- **Impact**: Guarantees all downstream server components receive verified tenant context.

---

### Decision DEC-WP002-002: Centralized Supabase Client Factory (`src/core/lib/supabase/server.ts`)
- **Decision**: All server-side database access MUST pass through `createTenantServerClient()`, which injects the `tenant_id` session claim into database sessions automatically.
- **Reason**: Prevents developers or AI agents from instantiating raw, non-tenant-isolated Supabase clients.
- **Evidence**: EESS Appendix C Pattern Catalog §2 (Tenant-Aware Repository Pattern).
- **Alternatives Considered**: Manual `eq('tenant_id', id)` filters on every query call (Rejected — error-prone and vulnerable to developer oversight).
- **Impact**: RLS policies enforce multi-tenant isolation at the database kernel level.

---

# SECTION 5: Execution Sequence

```
Step 1: Create src/core/lib/tenant/context.ts
  • Purpose: Define TenantContext contract and server-side reader.
  • Validation: TypeScript compilation without errors.
  • Rollback: Delete file.

Step 2: Create src/core/lib/supabase/server.ts
  • Purpose: Implement server-side Supabase factory with auto-injected claims.
  • Validation: Import check and mock query claim verification.
  • Rollback: Delete file.

Step 3: Create src/core/lib/supabase/client.ts
  • Purpose: Implement browser-side Supabase client singleton.
  • Validation: Client instantiation without error.
  • Rollback: Delete file.

Step 4: Create src/middleware.ts
  • Purpose: Edge middleware for x-tenant-id extraction and request decoration.
  • Validation: Middleware execution test under mock headers.
  • Rollback: Delete file.

Step 5: Create Unit Tests in src/core/lib/tenant/__tests__/context.test.ts
  • Purpose: Automated verification of tenant context resolution and missing tenant handling.
  • Validation: `npx vitest run src/core/lib/tenant/__tests__/context.test.ts`.
  • Rollback: Delete test directory.
```

---

# SECTION 6: Risk Register & Recovery Strategies

| Risk ID | Risk Description | Severity | Likelihood | Mitigation Strategy | Recovery Plan |
|---------|------------------|----------|------------|---------------------|---------------|
| **RSK-WP002-01** | Missing `tenant_id` in request header causes unhandled server crash | High | Medium | Provide fallback `UnauthenticatedTenantException` returning HTTP 401 | Intercept exception in middleware and redirect to tenant login |
| **RSK-WP002-02** | Cookie store read error in Next.js Server Components | Medium | Low | Wrap cookie access in safe `try/catch` block inside `server.ts` | Return default anonymous context if unauthenticated |
| **RSK-WP002-03** | RLS policy bypass via direct Supabase service role key usage | Critical | Low | Restrict `SUPABASE_SERVICE_ROLE_KEY` usage strictly to background workers | Audit client initialization scripts for key exposure |

---

# SECTION 7: Validation Strategy & Quality Gates

### 7.1. 5-Stage Validation Checklist

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   CIP-WP-002 VALIDATION CHECKLIST                       │
├─────────────────────────────────────────────────────────────────────────┤
│ Stage 1: Architecture Validation                                        │
│   [ ] Compliant with EARS Part 3 and EESS Appendix C                    │
│   [ ] Multi-tenant isolation enforced at database client boundary      │
│                                                                         │
│ Stage 2: Code & TypeScript Validation                                   │
│   [ ] Clean `npx tsc --noEmit` execution with 0 errors                  │
│   [ ] Zero relative cross-module import paths                           │
│                                                                         │
│ Stage 3: Security & Isolation Validation                                │
│   [ ] `TenantContext` rejects requests missing valid `tenant_id`        │
│   [ ] Supabase server client sets `x-tenant-id` claim header            │
│                                                                         │
│ Stage 4: Automated Unit Test Suite                                      │
│   [ ] Vitest tenant context test suite passes 100%                      │
│                                                                         │
│ Stage 5: Governance & Freeze Verification                               │
│   [ ] Zero feature or UI code introduced                                │
│   [ ] Zero database DDL schema migrations generated                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2. Quality Gate Definition
- **Definition of Ready (DoR)**: CIP-WP-001 complete, branch `sprint-0/wp-002` active, Planning Plan approved.
- **Definition of Done (DoD)**: All 5 validation stages pass, `npx tsc --noEmit` clean, Vitest tenant test suite 100% pass, implementation report published.

---

# SECTION 8: Final Readiness Assessment & Determination

### Assessment Matrix
1. **Repository Engineering Baseline**: `COMPLETED`
2. **CIP-WP-001 Foundation**: `COMPLETED`
3. **Architecture Freeze Status**: `ACTIVE & ENFORCED`
4. **Planning Completeness**: `100% SPECIFIED`
5. **Scope Boundaries**: `EXPLICITLY DEMARCATED`

```
===========================================================================
               FINAL READINESS DETERMINATION DIRECTIVE
===========================================================================

  READY FOR IMPLEMENTATION : [ YES ]

  JUSTIFICATION:
  The engineering specification for CIP-WP-002 is complete, fully bounded,
  and compliant with EARS Part 3, EESS Appendix C, ACR v1.0, and CIP v1.0.
  All target files, execution steps, and risk recovery procedures are
  unambiguously defined.

===========================================================================
```

---

# SECTION 9: Final Deliverable Status

9.1. **CIP-WP-002 Implementation Plan** is officially published, active, and append-only.

9.2. This document completes the **Engineering Planning Phase** for CIP-WP-002.

```
===========================================================================
                       FINAL STATUS
===========================================================================
  • IMPLEMENTATION PLAN CIP-WP-002 : OFFICIALLY COMPLETE
  • CHIEF ENGINEERING REVIEW       : READY FOR REVIEW
===========================================================================
```
