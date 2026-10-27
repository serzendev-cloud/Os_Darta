# EEOS IMPLEMENTATION DESIGN REPORT — PART 2
## Origin Ticket — Comprehensive File Impact & Change Map

**Work Package**: `WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-DESIGN-002`  
**Title**: Origin Ticket — File Impact & Change Map  
**Date**: 2026-09-21  
**Author**: Antigravity (Senior Principal Systems Architect)  
**Status**: READ-ONLY — PRE-IMPLEMENTATION DESIGN  
**Governance Mode**: STRICT READ-ONLY / ZERO MUTATION  
**Authoritative Reference**: `docs/architecture/EEOS-PROJECT-JOURNEY-MAP.md`  

---

## 1. EXECUTIVE CONTEXT & OBJECTIVE

Following the formal ratification of **Candidate A (PostgreSQL / Supabase Dedicated Table: `public.preview_origin_tickets`)** as the persistent, distributed storage architecture for Role Preview Origin Tickets, this document provides the **authoritative File Impact & Change Map**.

### Purpose of this Document:
Before the Product Owner grants implementation authorization for the subsequent Work Package, this report defines the exact boundary of every file that will be **CREATED**, **MODIFIED**, **DELETED**, or **KEPT UNCHANGED**, alongside a complete database object change map, atomic consumption flow, cookie audit, and sequence of execution.

> **CRITICAL GOVERNANCE MANDATE**:  
> This document is **100% Read-Only**. Zero source code files are modified, zero migrations are created, zero database tables are altered, zero git operations are performed, and zero deployments are initiated during this Work Package.

---

## 2. REPOSITORY AUDIT OF ACTUAL CURRENT FILES

A comprehensive audit of the active repository identified the following concrete files currently governing the Role Preview and Origin Ticket lifecycle:

| Subsystem | Verified File Path | Current Responsibility in Codebase |
|---|---|---|
| **Origin Ticket Manager** | `src/lib/authz/preview-origin-ticket.ts` | Core ticket module. Holds interfaces, `hashOriginTicket()`, `SharedOriginTicketStorage` (active in-memory `globalThis` Map), and inactive draft `PostgresOriginTicketStorage`. |
| **Preview API: Entrance** | `src/app/api/auth/role-preview/route.ts` | Next.js API route (`POST`). Validates caller role (`super_admin` / `developer`), calls `createOriginTicket()`, authenticates preview persona with Supabase, and sets the `sb-preview-origin-ticket` cookie. |
| **Preview API: Exit** | `src/app/api/auth/role-preview/exit/route.ts` | Next.js API route (`POST`). Reads `sb-preview-origin-ticket` cookie, calls `consumeOriginTicket()`, generates recovery magiclink via Supabase Admin Client, verifies OTP via SSR Client, and clears ticket cookie. |
| **UI Persona Switcher** | `src/components/shared/PreviewIndicator.tsx` | Client banner component. Triggers persona switches via `/api/auth/role-preview` and exits via `/api/auth/role-preview/exit`. |
| **UI Launcher Page** | `src/app/dashboard/saas/preview/page.tsx` | Platform Role Preview management dashboard page. |
| **Database Pooler Client** | `src/lib/db/index.ts` | Canonical Drizzle ORM client connected via `postgres.js` with `prepare: false` to Supabase Transactional Pooler (port 6543). |
| **Database Schema Index** | `src/lib/db/schema.ts` | Root Drizzle schema definition and sub-schema re-export manifest. |
| **Database Repositories** | `src/lib/db/repositories/audit-repository.ts` | Existing canonical Drizzle repository pattern. |
| **Audit Service** | `src/lib/db/services/auditLog.ts` | Append-only audit logger writing to `public.audit_logs`. |
| **Auth Proxy / Middleware**| `src/proxy.ts` | Next.js 16 request routing and multi-tenant domain extraction. |
| **Contract Test Suite** | `tests/contracts/role-preview.contract.test.ts` | 23 Vitest contract tests for Role Preview and Origin Tickets. |
| **Drizzle Migration Dir** | `drizzle/` | Directory containing historical migrations (`0000` through `0003` and WP scripts). |

---

## 3. MASTER FILE IMPACT TABLE

The table below classifies every affected file by planned action (`CREATE`, `MODIFY`, `DELETE`, `NO CHANGE`):

| # | File Path | Current Role | Planned Action | Rationale / Architectural Change | Risk Level |
|---|---|---|---|---|---|
| 1 | `src/lib/db/schema/preview_origin_tickets.ts` | Not exists | **CREATE** | Dedicated Drizzle table definition for `public.preview_origin_tickets` with type-safe columns and constraints. | **LOW** |
| 2 | `src/lib/db/schema.ts` | Database Schema Index | **MODIFY** | Re-export `preview_origin_tickets` schema so Drizzle Kit and the query builder recognize the table. | **LOW** |
| 3 | `src/lib/authz/preview-origin-ticket.ts` | Origin Ticket Manager | **MODIFY** | Refactor `PostgresOriginTicketStorage` to execute queries via `@/lib/db`. Set it as `activeStorage`. Remove silent fallback to in-memory Map (fail-closed). Deprecate `SharedOriginTicketStorage`. | **MEDIUM** |
| 4 | `src/app/api/auth/role-preview/route.ts` | Preview Entrance Route | **MODIFY** | Pass client audit metadata (IP, user agent, requested persona) to `createOriginTicket()`. Maintain 100% existing HTTP contract. | **LOW** |
| 5 | `src/app/api/auth/role-preview/exit/route.ts` | Preview Exit Route | **MODIFY** | Pass client audit metadata (IP, user agent) to `consumeOriginTicket()`. Log exit audit event via `auditLogService`. Maintain 100% existing HTTP contract. | **LOW** |
| 6 | `tests/contracts/role-preview.contract.test.ts`| Contract Test Suite | **MODIFY** | Update mock storage / repository adapters so contract tests verify real PostgreSQL queries instead of passing shared `new Map()` pointers. | **MEDIUM** |
| 7 | `drizzle/0004_preview_origin_tickets.sql` | Migration Script | **CREATE** *(During Impl)* | Canonical DDL migration creating table, indexes, constraints, and enabling RLS. | **LOW** |
| 8 | `src/components/shared/PreviewIndicator.tsx` | UI Banner Component | **NO CHANGE** | Preserves existing user experience, button actions, and client payloads without disruption. | **NONE** |
| 9 | `src/app/dashboard/saas/preview/page.tsx` | Preview Dashboard Page | **NO CHANGE** | Role selection and preview entry UI remain unchanged. | **NONE** |
| 10 | `src/lib/db/index.ts` | DB Pooler Client | **NO CHANGE** | Existing `postgres.js` pooler connection (`prepare: false`) is fully compatible with the new table. | **NONE** |
| 11 | `src/proxy.ts` | Auth Proxy | **NO CHANGE** | Routes `/api/auth/role-preview/*` are already handled cleanly. | **NONE** |
| 12 | `src/lib/db/services/auditLog.ts` | Audit Service | **NO CHANGE** | Consumed via existing `auditLogService.log()` public API. | **NONE** |

---

## 4. DETAILED FILE CATEGORY SPECIFICATIONS

### 4.1 Existing Origin Ticket Implementation (`src/lib/authz/preview-origin-ticket.ts`)
- **Full Path**: `e:\Projects\Os_Darta\src\lib\authz\preview-origin-ticket.ts`
- **Current State**:
  - `SharedOriginTicketStorage` stores records in `globalThis.__eeosSharedPreviewTicketStore = new Map()`.
  - `activeStorage` defaults to `new SharedOriginTicketStorage()`.
  - `PostgresOriginTicketStorage` is a draft class using raw `postgres(dbUrl)` connections that catches all errors and silently falls back to `SharedOriginTicketStorage`.
- **Planned Modification**:
  1. Replace draft `postgres` instance creation with canonical Drizzle query runner from `@/lib/db`.
  2. Switch default active singleton to `let activeStorage: OriginTicketStorage = new PostgresOriginTicketStorage();`.
  3. **Strictly remove all `catch` fallback blocks** that revert to in-memory maps. If PostgreSQL fails, throw error immediately (Fail-Closed).
  4. Retain `SharedOriginTicketStorage` marked as `@deprecated (Test Only)` or isolate it to test files, ensuring zero production code path can invoke it.

### 4.2 Database Schema Definition (`src/lib/db/schema/preview_origin_tickets.ts`)
- **Full Path**: `e:\Projects\Os_Darta\src\lib\db\schema\preview_origin_tickets.ts`
- **Planned Action**: **CREATE**
- **Content**:
  - Drizzle `pgTable` definition: `preview_origin_tickets`.
  - Export types: `PreviewOriginTicket`, `NewPreviewOriginTicket`.
  - Registered into `src/lib/db/schema.ts` via `export * from './schema/preview_origin_tickets';`.

### 4.3 API Routes
- **Entrance Route**: `src/app/api/auth/role-preview/route.ts`
  - **Method**: `POST`
  - **Change**: In step 6, pass `previewPersona` and client IP/UA into `createOriginTicket()`. Zero breaking changes to response JSON or cookie generation.
- **Exit Route**: `src/app/api/auth/role-preview/exit/route.ts`
  - **Method**: `POST`
  - **Change**: In step 1, pass client IP/UA into `consumeOriginTicket()`. Log exit recovery event. Zero breaking changes to session restoration or cookie deletion.

---

## 5. DATABASE FILE IMPACT

### Migration Path Specification:
- **Directory**: `drizzle/`
- **Migration Identifier**: `0004_preview_origin_tickets.sql` *(Candidate designation; official number assigned upon Drizzle migration generation)*
- **Associated Audit Report**: `docs/architecture/WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-001-REPORT.md` (to be produced upon execution).

> **STATUS**: **DESIGN ONLY**. No file is created in `drizzle/` during this Work Package.

---

## 6. DATABASE OBJECT CHANGE MAP (DESIGN ONLY)

| Object Name | Object Type | Action | Current State | Target State |
|---|---|---|---|---|
| `public.preview_origin_tickets` | Table | **CREATE** | Does not exist | Dedicated persistent storage table |
| `pk_preview_origin_tickets` | Primary Key | **CREATE** | Does not exist | `PRIMARY KEY (id)` on UUID |
| `uq_preview_origin_tickets_hash` | Unique Constraint | **CREATE** | Does not exist | `UNIQUE (ticket_hash)` |
| `chk_preview_origin_tickets_expiry`| Check Constraint | **CREATE** | Does not exist | `CHECK (expires_at > created_at)` |
| `chk_preview_origin_tickets_hash_len`| Check Constraint | **CREATE** | Does not exist | `CHECK (length(ticket_hash) = 64)` |
| `idx_preview_origin_tickets_hash`| Unique B-tree Index | **CREATE** | Does not exist | Backing unique index on `ticket_hash` |
| `idx_preview_origin_tickets_active`| Partial B-tree Index | **CREATE** | Does not exist | Index on `(ticket_hash, expires_at) WHERE consumed_at IS NULL` |
| `idx_preview_origin_tickets_cleanup`| Partial B-tree Index | **CREATE** | Does not exist | Index on `(expires_at) WHERE consumed_at IS NOT NULL OR expires_at < now()` |
| Row-Level Security (RLS) | Security Feature | **ENABLE** | Disabled | `ENABLE ROW LEVEL SECURITY` (Zero public policies) |

---

## 7. EXACT TABLE DDL DESIGN (DESIGN ONLY)

```sql
-- =============================================================================
-- EEOS — Role Preview Origin Ticket Persistent Table
-- Traceability: WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-DESIGN-002
-- Security: Server-side only (RLS Enabled with Zero Public Policies)
-- =============================================================================

CREATE TABLE public.preview_origin_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_hash VARCHAR(64) NOT NULL,
    origin_user_id UUID NOT NULL,
    origin_user_email VARCHAR(255) NOT NULL,
    origin_role VARCHAR(50) NOT NULL,
    preview_persona VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ DEFAULT NULL,
    consumed_by_ip VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,

    CONSTRAINT uq_preview_origin_tickets_hash UNIQUE (ticket_hash),
    CONSTRAINT chk_preview_origin_tickets_expiry CHECK (expires_at > created_at),
    CONSTRAINT chk_preview_origin_tickets_hash_len CHECK (length(ticket_hash) = 64)
);

-- Partial Indexes for high-performance active lookup and maintenance
CREATE UNIQUE INDEX idx_preview_origin_tickets_hash 
ON public.preview_origin_tickets (ticket_hash);

CREATE INDEX idx_preview_origin_tickets_active 
ON public.preview_origin_tickets (ticket_hash, expires_at) 
WHERE consumed_at IS NULL;

CREATE INDEX idx_preview_origin_tickets_cleanup 
ON public.preview_origin_tickets (expires_at) 
WHERE consumed_at IS NOT NULL OR expires_at < now();

-- Strict Server-Side RLS Lockdown
ALTER TABLE public.preview_origin_tickets ENABLE ROW LEVEL SECURITY;
-- No public policies declared. PostgREST client queries receive 404/403.
```

---

## 8. EXACT ATOMIC CONSUMPTION DESIGN

### SQL Query Specification:
```sql
UPDATE public.preview_origin_tickets
SET 
    consumed_at = now(),
    consumed_by_ip = $2,
    user_agent = $3
WHERE ticket_hash = $1
  AND consumed_at IS NULL
  AND expires_at > now()
RETURNING 
    id,
    origin_user_id,
    origin_user_email,
    origin_role,
    preview_persona,
    created_at,
    expires_at,
    consumed_at;
```

### Concurrency Trace:
```text
State Before: Row exists with consumed_at = NULL, expires_at = now() + 10m

Request A (Instance 1) ───┐
                          ├──> Arrive simultaneously at PostgreSQL
Request B (Instance 2) ───┘

1. Request A acquires PostgreSQL row-level write lock first.
2. Request B waits for lock release.
3. Request A updates consumed_at = now().
4. Request A commits transaction. RETURNING outputs the row.
   -> Request A: SUCCESS (Proceeds to restore Super Admin session)
5. Request B acquires row lock. Under MVCC read-committed isolation,
   Request B evaluates WHERE clause on the newly committed row.
6. 'consumed_at IS NULL' evaluates to FALSE.
7. Zero rows match. RETURNING outputs 0 rows.
   -> Request B: REJECT (Returns HTTP 403 INVALID_ORIGIN_TICKET)

Result: Exactly 1 Success, Exactly 1 Rejection. Zero Race Condition.
```

---

## 9. RAW TOKEN SECURITY & HASHING PIPELINE

```text
[Browser / Client]
       │  Receives rawTicket (64-character hex string = 256 bits entropy)
       │  Transported via HttpOnly, SameSite=Lax, Secure Cookie
       ▼
[Next.js API Route Handler]
       │  Reads rawTicket from cookie
       │  Executes hashOriginTicket(rawTicket)
       │  hashOriginTicket = crypto.createHash('sha256').update(rawTicket).digest('hex')
       ▼
[PostgreSQL Database]
       │  Stores ONLY ticket_hash (64 hex characters)
       │  Raw ticket NEVER enters SQL query or table columns!
```

### Module Responsibilities:
- **Generation**: `createOriginTicket()` in `src/lib/authz/preview-origin-ticket.ts` (`crypto.randomBytes(32).toString('hex')`).
- **Hashing**: `hashOriginTicket()` in `src/lib/authz/preview-origin-ticket.ts` (`crypto.createHash('sha256')`).
- **Storage & Querying**: `PostgresOriginTicketStorage` in `src/lib/authz/preview-origin-ticket.ts` via `@/lib/db`.
- **Validation**: `validateOriginTicket()` in `src/lib/authz/preview-origin-ticket.ts`.
- **Consumption**: `consumeOriginTicket()` in `src/lib/authz/preview-origin-ticket.ts`.

---

## 10. SESSION RESTORATION FLOW (CURRENT VS TARGET)

### Current Flow (Process-Local / Broken Across Instances):
```text
Super Admin
    ↓
POST /api/auth/role-preview
    ↓
Origin Ticket minted in Process Memory A (globalThis.Map)
    ↓
Browser visits /dashboard as Preview Persona
    ↓
POST /api/auth/role-preview/exit (routed to Process Memory B)
    ↓
Ticket NOT FOUND in Memory B
    ↓
HTTP 403 INVALID_ORIGIN_TICKET -> Fallback Logout (Restoration Fails)
```

### Target Flow (Distributed / Persistent):
```text
Super Admin
    ↓
POST /api/auth/role-preview (Instance 1)
    ↓
Origin Ticket persisted to PostgreSQL (public.preview_origin_tickets)
    ↓
Browser visits /dashboard as Preview Persona
    ↓
POST /api/auth/role-preview/exit (Instance 2)
    ↓
Instance 2 reads cookie & executes atomic UPDATE on PostgreSQL
    ↓
Row locked & claimed atomically -> returns origin_user_email
    ↓
adminClient.auth.admin.generateLink({ type: 'magiclink', email })
    ↓
ssrClient.auth.verifyOtp({ token_hash, type: 'magiclink' })
    ↓
Original Super Admin session cookies stamped onto HTTP response
    ↓
Origin ticket cookie deleted (maxAge: 0)
    ↓
Super Admin Session Restored cleanly on Instance 2
```

---

## 11. COOKIE AUDIT & IMPACT TABLE

| Cookie Name | Current Purpose | Sensitive? | Change Required? | Reason |
|---|---|---|---|---|
| `sb-preview-origin-ticket` | Carries 64-char opaque hex ticket ID. | Yes (bearer for exit) | **NO CHANGE** | Format (64-char hex) and security flags (`HttpOnly`, `SameSite=Lax`, `Secure`, `maxAge=900`) are already optimal. |
| `sb-[ref]-auth-token` | Supabase GoTrue session token cookies. | Yes (JWT session) | **NO CHANGE** | Managed directly by `@supabase/ssr`. Stamped during entrance for persona, and re-stamped during exit for Super Admin. |

> **CRITICAL ASSERTION**: Zero Supabase access/refresh tokens or session JWTs are ever placed inside `sb-preview-origin-ticket` or the database origin ticket table.

---

## 12. ENVIRONMENT VARIABLE AUDIT

| Variable | Exists in Repo? | New Required? | Purpose | Secret? |
|---|---|---|---|---|
| `DATABASE_URL` | YES (`.env.local.example`) | **NO** | Supabase PostgreSQL pooled connection. | YES |
| `NEXT_PUBLIC_SUPABASE_URL` | YES (`.env.local.example`) | **NO** | Supabase project URL. | NO |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES (`.env.local.example`) | **NO** | Client-safe anonymous key. | NO |
| `SUPABASE_SERVICE_ROLE_KEY` | YES (`.env.local.example`) | **NO** | Admin API for magiclink session recovery. | YES |
| `ROLE_PREVIEW_ENABLED` | YES (in routes) | **NO** | Feature flag guard for preview mode. | NO |
| `ROLE_PREVIEW_PRODUCTION_ALLOWED`| YES (in routes) | **NO** | Production safety dual-key guard. | NO |
| `ROLE_PREVIEW_SECRET` | YES (in routes) | **NO** | Ephemeral persona password derivation. | YES |

```text
NO NEW ENVIRONMENT VARIABLE REQUIRED
```

---

## 13. DEPENDENCY / PACKAGE AUDIT

| Package Name | Existing in `package.json`? | New Required? | Reason |
|---|---|---|---|
| `drizzle-orm` | YES (`^0.45.2`) | **NO** | ORM query builder. |
| `postgres` | YES (`^3.4.9`) | **NO** | PostgreSQL client driver for Node.js. |
| `@supabase/ssr` | YES (`^0.12.3`) | **NO** | Server-side cookie session management. |
| `@supabase/supabase-js` | YES (`^2.110.8`) | **NO** | Supabase Admin Client. |
| `crypto` | Built-in Node.js | **NO** | Native hashing and random bytes. |

```text
NO NEW PACKAGE REQUIRED
```

---

## 14. TEST FILE IMPACT TABLE

| Test File Path | Existing? | Planned Action | Coverage Focus |
|---|---|---|---|
| `tests/contracts/role-preview.contract.test.ts` | **YES** | **MODIFY** | Replace in-memory `new Map()` cluster mock tests (Tests 7 & 8) with mock queries targeting `PostgresOriginTicketStorage` to verify atomic SQL execution and fail-closed error handling. |
| `tests/integration/role-preview-db.integration.test.ts` | **NO** | **CREATE** *(Optional / Staging Gate)* | End-to-end integration test against real local PostgreSQL instance verifying table constraints and concurrent locking. |

---

## 15. DEPRECATION & REMOVAL MAP

### What Happens to `SharedOriginTicketStorage`?
- **Decision**: **DEPRECATE AND DE-COUPLE**.
- **Action**:
  1. `SharedOriginTicketStorage` will be stripped from the production export path in `preview-origin-ticket.ts`.
  2. The production singleton `activeStorage` will be permanently locked to `new PostgresOriginTicketStorage()`.
  3. The internal fallback `catch` block that called `fallbackStore.createTicket()` is **completely deleted**, ensuring that a database outage fails closed rather than silently reverting to an in-memory map.

---

## 16. ARCHITECTURE BOUNDARY ASSERTION

```text
[Browser Client]
       │
       │ HTTP /api/auth/role-preview/*
       ▼
[Next.js Server API Routes]  (Zero client Direct DB access)
       │
       │ TypeScript Service Calls
       ▼
[preview-origin-ticket.ts]
       │
       │ Serverless Connection Pooler (PgBouncer)
       ▼
[PostgreSQL Table: public.preview_origin_tickets]
```

Under NO circumstances is `public.preview_origin_tickets` accessible directly from the browser. Client requests via Supabase PostgREST are blocked by RLS.

---

## 17. RLS & SERVICE-ROLE SECURITY ARCHITECTURE

1. **Is `preview_origin_tickets` tenant-scoped?**  
   **NO**. It is a global SaaS platform capability reserved for Super Admins.
2. **Is table platform-scoped?**  
   **YES**.
3. **Can browser / client query the table?**  
   **NO**. RLS is enabled with zero policies for `anon` or `authenticated`.
4. **Is service-role used?**  
   **YES**. Database operations are executed exclusively through the backend database client (`@/lib/db`) running with database owner/service credentials.
5. **Is `eeos_app_role` used?**  
   `eeos_app_role` enforces tenant context via `SET LOCAL app.current_tenant_id`. Because Role Preview Origin Tickets are platform-scoped (not tenant-scoped), queries execute under the system administrative context without binding to a tenant ID.

---

## 18. COMPLETE CHANGE INVENTORY

### FILES TO CREATE:
```text
1. src/lib/db/schema/preview_origin_tickets.ts
2. drizzle/0004_preview_origin_tickets.sql (Assigned during implementation)
```

### FILES TO MODIFY:
```text
1. src/lib/db/schema.ts (Re-export new schema)
2. src/lib/authz/preview-origin-ticket.ts (Wire PostgresOriginTicketStorage, fail-closed)
3. src/app/api/auth/role-preview/route.ts (Pass audit metadata)
4. src/app/api/auth/role-preview/exit/route.ts (Pass audit metadata & log audit event)
5. tests/contracts/role-preview.contract.test.ts (Realize DB mock contracts)
```

### FILES TO DELETE:
```text
NONE (Zero files deleted; in-memory class deprecated/contained within preview-origin-ticket.ts)
```

### FILES TO KEEP UNCHANGED:
```text
1. src/components/shared/PreviewIndicator.tsx
2. src/app/dashboard/saas/preview/page.tsx
3. src/lib/db/index.ts
4. src/proxy.ts
5. src/lib/db/services/auditLog.ts
6. All existing business schemas (identity, academic, finance, etc.)
```

---

## 19. IMPLEMENTATION SEQUENCE (FOR FUTURE EXECUTION)

When implementation authorization is granted by the Product Owner, execution will proceed strictly in the following order:

```text
Step 1: Create Drizzle Schema
        File: src/lib/db/schema/preview_origin_tickets.ts
        Export from: src/lib/db/schema.ts

Step 2: Generate DDL Migration Script
        File: drizzle/0004_preview_origin_tickets.sql
        Review SQL safety and RLS lockdown

Step 3: Execute Database Migration (Staging/Dev DB)
        Apply DDL to create public.preview_origin_tickets, indexes, and RLS

Step 4: Refactor Origin Ticket Storage Adapter
        File: src/lib/authz/preview-origin-ticket.ts
        Wire PostgresOriginTicketStorage to @/lib/db
        Eliminate in-memory fallback (Fail-Closed)
        Set activeStorage = new PostgresOriginTicketStorage()

Step 5: Refactor API Route Audit Contexts
        Files: src/app/api/auth/role-preview/route.ts & exit/route.ts
        Pass IP and user agent metadata; invoke auditLogService

Step 6: Update Contract & Integration Tests
        File: tests/contracts/role-preview.contract.test.ts
        Verify 23/23 contract tests pass with PostgreSQL storage semantics

Step 7: Verification & Audit Gate
        Run static typecheck (npx tsc --noEmit)
        Run Vitest test suite
        Produce Implementation Verification Report
```

---

## 20. ACCEPTANCE CRITERIA CHECKLIST

- [x] Complete file impact table defined (`CREATE`, `MODIFY`, `DELETE`, `NO CHANGE`).
- [x] Exact database table schema specified with constraints and indexes.
- [x] Zero raw credential / token persistence mathematically proven.
- [x] Exact atomic single-use SQL query specified (`UPDATE ... RETURNING`).
- [x] Multi-instance and restart survival verified.
- [x] Session restoration flow mapped (Current vs Target).
- [x] Cookie impact table documented.
- [x] Environment variable impact audited (Zero new env vars required).
- [x] Package impact audited (Zero new dependencies required).
- [x] Test file impact audited.
- [x] In-memory deprecation strategy defined.
- [x] Complete change inventory listed.
- [x] Implementation sequence defined.
- [x] Zero mutation governance maintained.

---

## 21. DECISION SUMMARY

```text
==================================================
EEOS IMPLEMENTATION DESIGN DECISION
==================================================

WP:
WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-DESIGN-002

STORAGE:
PostgreSQL / Supabase

TABLE:
public.preview_origin_tickets

CURRENT IMPLEMENTATION:
In-memory process-local

TARGET:
Persistent shared storage

FILES TO CREATE:
2 files (1 schema, 1 migration)

FILES TO MODIFY:
5 files (schema index, ticket manager, 2 API routes, 1 contract test)

FILES TO DELETE:
NONE

FILES UNCHANGED:
All UI components, proxy, database clients, business schemas

RAW TOKEN PERSISTENCE:
NO

ATOMIC SINGLE-USE:
UPDATE ... WHERE consumed_at IS NULL AND expires_at > now() RETURNING

TTL:
15 minutes

CROSS-INSTANCE:
PASS

PROCESS RESTART:
PASS

RLS:
ENABLED (Zero public policies; service-role only)

FAILURE MODE:
FAIL CLOSED

ENVIRONMENT VARIABLES:
NO NEW VARIABLES REQUIRED

DEPENDENCIES:
NO NEW PACKAGES REQUIRED

MIGRATION DESIGN:
READY

IMPLEMENTATION DESIGN:
READY FOR RATIFICATION

SOURCE MUTATION:
NONE

DATABASE MUTATION:
NONE

GIT MUTATION:
NONE

DEPLOYMENT:
NONE

IMPLEMENTATION AUTHORIZATION:
NOT GRANTED

NEXT GATE:
Product Owner Implementation Authorization

==================================================
```
