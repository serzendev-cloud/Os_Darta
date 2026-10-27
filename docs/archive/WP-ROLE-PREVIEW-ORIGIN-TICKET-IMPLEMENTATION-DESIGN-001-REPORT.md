# EEOS IMPLEMENTATION DESIGN REPORT
## Dedicated PostgreSQL Storage for Distributed Role Preview Origin Tickets

**Work Package**: `WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-DESIGN-001`  
**Date**: 2026-09-21  
**Author**: Antigravity (Senior Principal Systems Architect)  
**Status**: IMPLEMENTATION DESIGN REVIEW — PENDING PRODUCT OWNER RATIFICATION  
**Governance Mode**: STRICT READ-ONLY / ZERO MUTATION  
**Authoritative Reference**: `docs/architecture/EEOS-PROJECT-JOURNEY-MAP.md`  

---

## 1. EXECUTIVE SUMMARY

Following the ratification of `WP-ROLE-PREVIEW-ORIGIN-TICKET-STORAGE-ARCHITECTURE-DECISION-001`, this document establishes the comprehensive, hardened **Implementation Design** for migrating the ephemeral, process-local in-memory Origin Ticket store (`globalThis.__eeosSharedPreviewTicketStore = new Map()`) to a durable, multi-instance, distributed PostgreSQL table:

```text
public.preview_origin_tickets
```

### Architectural Highlights of the Design:
1. **Zero Raw Token Storage**: The client receives a 256-bit cryptographically random 64-character hex ticket. The database stores strictly its SHA-256 digest (`ticket_hash`). Zero Supabase access tokens, refresh tokens, or passwords enter storage.
2. **Deterministic Atomic Single-Use**: Consumption is executed via a single atomic SQL statement:  
   `UPDATE public.preview_origin_tickets SET consumed_at = now() WHERE ticket_hash = $1 AND consumed_at IS NULL AND expires_at > now() RETURNING ...`  
   This leverages PostgreSQL MVCC row-level write locks to guarantee race-condition proof single-use execution across concurrent requests and separate serverless instances.
3. **Session Restoration without Credential Exposure**: Restoration relies on server-side invocation of Supabase GoTrue Admin API (`adminClient.auth.admin.generateLink({ type: 'magiclink', email })`) and immediate OTP verification (`ssrClient.auth.verifyOtp({ token_hash })`). The database only persists minimal non-sensitive metadata (`origin_user_id`, `origin_user_email`, `origin_role`).
4. **Defense-in-Depth RLS Model**: As a platform-level authentication infrastructure table, `preview_origin_tickets` is strictly isolated from browser/client access. RLS is enabled with zero public policies. Access is granted exclusively through the server-side application database client.
5. **Zero Mutation Compliance**: This document produces purely architectural specifications. **Zero DDL, zero migrations, zero source changes, zero git mutations, and zero deployments** are executed under this Work Package.

---

## 2. CURRENT IMPLEMENTATION AUDIT

A thorough forensic audit of the existing codebase was conducted to trace all components involved in the Role Preview and Origin Ticket lifecycle:

| Component / Artifact | File Path | Audit Finding & Current Mechanism |
|---|---|---|
| **Core Ticket Manager** | `src/lib/authz/preview-origin-ticket.ts` | Implements `SharedOriginTicketStorage` (active) and draft `PostgresOriginTicketStorage` (inactive dead code). Currently defaults to `globalThis.__eeosSharedPreviewTicketStore = new Map()`. |
| **Entrance API Route** | `src/app/api/auth/role-preview/route.ts` | Next.js Node.js route handler. Enforces server-side caller authorization (`super_admin` / `developer`), calls `createOriginTicket()`, authenticates preview persona, and stamps HttpOnly cookie `sb-preview-origin-ticket`. |
| **Exit API Route** | `src/app/api/auth/role-preview/exit/route.ts` | Next.js Node.js route handler. Reads `sb-preview-origin-ticket`, calls `consumeOriginTicket()`, generates Supabase magiclink via admin client, verifies OTP via SSR client, clears ticket cookie (`maxAge: 0`), and restores Super Admin session. |
| **UI Banner & Switcher** | `src/components/shared/PreviewIndicator.tsx` | React client component. Detects `preview.*` email, renders persistent warning banner, provides persona switching modal, and invokes exit endpoint. |
| **Database Client** | `src/lib/db/index.ts` | Configured with `postgres.js` and `drizzle-orm`. Uses `prepare: false` for serverless compatibility with Supabase Transactional Pooler (PgBouncer port 6543). |
| **Tenant Transaction** | `src/lib/db/tenant-transaction.ts` | Sets `SET LOCAL app.current_tenant_id` and `app.is_super_admin` inside transaction blocks for RLS context. |
| **Audit Service** | `src/lib/db/services/auditLog.ts` | Append-only audit logger writing to `public.audit_logs` via `auditRepository`. |
| **Contract Test Suite** | `tests/contracts/role-preview.contract.test.ts` | 23 Vitest contract tests. Verified that multi-instance tests previously passed only due to shared `new Map()` pointer mocks. |

---

## 3. RATIFIED ARCHITECTURE BASELINE

- **Substrate**: Dedicated PostgreSQL table inside the existing Supabase instance.
- **Access Path**: Server-side pooled connection pooler via `src/lib/db`.
- **Target Role**: Dedicated backend application database connection (`postgres` / `service_role`).
- **Isolation Scope**: Platform-level security boundary (not tenant-scoped).

---

## 4. PROPOSED DATABASE TABLE MODEL

The conceptual DDL design for `public.preview_origin_tickets`:

```sql
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
    user_agent TEXT DEFAULT NULL
);
```

---

## 5. FIELD-BY-FIELD DESIGN & JUSTIFICATION

| Column Name | Data Type | Nullable | Default | Architectural Purpose & Rationale |
|---|---|---|---|---|
| `id` | `UUID` | `NOT NULL` | `gen_random_uuid()` | Internal unique primary key for row identification, indexing, and log correlation. |
| `ticket_hash` | `VARCHAR(64)` | `NOT NULL` | None | SHA-256 hex digest of the raw 64-character hex ticket. Lookup key for all validation and consumption queries. Raw ticket is never stored. |
| `origin_user_id` | `UUID` | `NOT NULL` | None | UUID of the Super Admin or Developer who initiated the preview session (`callerUser.id`). |
| `origin_user_email` | `VARCHAR(255)` | `NOT NULL` | None | Verified email of the original caller. Essential parameter passed to `adminClient.auth.admin.generateLink({ email })` during session restoration. |
| `origin_role` | `VARCHAR(50)` | `NOT NULL` | None | Original role (`super_admin` or `developer`). Preserved for audit verification upon exit. |
| `preview_persona` | `VARCHAR(50)` | `NOT NULL` | None | Active preview persona target (`admin`, `musyrif`, `santri`, etc.). Enables audit traceability of which persona was exercised. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `now()` | Exact creation timestamp. Used for lifetime calculation, forensic auditing, and cleanup ordering. |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | None | Immutable expiration deadline. Computed strictly as `created_at + INTERVAL '15 minutes'`. |
| `consumed_at` | `TIMESTAMPTZ` | `NULLABLE` | `NULL` | Timestamp when ticket was consumed during exit. `NULL` indicates unconsumed; non-null indicates consumed. |
| `consumed_by_ip` | `VARCHAR(45)` | `NULLABLE` | `NULL` | Client IP address at the time of consumption (supports IPv4/IPv6). Forensic audit metadata. |
| `user_agent` | `TEXT` | `NULLABLE` | `NULL` | Truncated client user-agent string during exit for anomaly detection. |

---

## 6. CONSTRAINT DESIGN

### 6.1 Primary Key
- `PRIMARY KEY (id)`: Guarantees unique entity identification in database pages.

### 6.2 Unique Natural Key (Lookup Invariant)
- `CONSTRAINT uq_preview_origin_tickets_hash UNIQUE (ticket_hash)`:
  - Ensures mathematical impossibility of hash collisions in storage.
  - Generates a backing unique B-tree index, making lookup by `ticket_hash` an instantaneous $O(\log N)$ operation.

### 6.3 Lifecycle Integrity Check Constraints
- `CONSTRAINT chk_preview_origin_tickets_expiry CHECK (expires_at > created_at)`:
  - Prevents back-dated tickets or corrupt interval configurations.
- `CONSTRAINT chk_preview_origin_tickets_hash_len CHECK (length(ticket_hash) = 64)`:
  - Enforces strict SHA-256 hex string formatting.

### 6.4 Referential Integrity
- **Decision on Foreign Key to `auth.users(id)`**:
  - `origin_user_id` references `auth.users(id) ON DELETE CASCADE`.
  - If the Super Admin account is deleted from Supabase Auth while a preview ticket exists, the ticket is cascaded and purged immediately.

---

## 7. INDEX DESIGN

To optimize runtime query paths and automated maintenance without index bloat, exactly three indexes are specified:

```sql
-- Index 1: Backing Unique Index for Lookup & Atomic Update (Auto-created by UNIQUE constraint)
CREATE UNIQUE INDEX idx_preview_origin_tickets_hash 
ON public.preview_origin_tickets (ticket_hash);
-- Purpose: Primary lookup for validateOriginTicket and consumeOriginTicket.
-- Query Pattern: WHERE ticket_hash = $1
-- Trade-off: None; required for uniqueness.

-- Index 2: Partial B-tree Index for Active / Unconsumed Validations
CREATE INDEX idx_preview_origin_tickets_active 
ON public.preview_origin_tickets (ticket_hash, expires_at) 
WHERE consumed_at IS NULL;
-- Purpose: Fast index scan during persona touch/validation queries.
-- Query Pattern: WHERE ticket_hash = $1 AND consumed_at IS NULL AND expires_at > now()
-- Trade-off: Partial index footprint is tiny (only includes unconsumed tickets < 15 min old).

-- Index 3: Partial Index for Periodic Maintenance / Purge
CREATE INDEX idx_preview_origin_tickets_cleanup 
ON public.preview_origin_tickets (expires_at) 
WHERE consumed_at IS NOT NULL OR expires_at < now();
-- Purpose: Accelerates background deletion of stale and consumed records.
-- Query Pattern: DELETE FROM preview_origin_tickets WHERE consumed_at IS NOT NULL OR expires_at < now()
-- Trade-off: Minimal write overhead during consumption; maximizes vacuum/delete speed.
```

---

## 8. ROW-LEVEL SECURITY (RLS) DESIGN

### RLS Evaluation Questions & Answers:

| Question | Architectural Determination |
|---|---|
| **1. Is this table tenant-scoped?** | **NO**. Role Preview is a SaaS Super Admin capability. Origin tickets represent platform-level sessions, not single-tenant data. |
| **2. Is this table platform-scoped?** | **YES**. It belongs to the platform control plane. |
| **3. Can regular callers / tenants SELECT?** | **NO**. Tenant users must never see or query origin tickets. |
| **4. Can browsers / clients SELECT?** | **ABSOLUTELY NO**. Exposure through Supabase PostgREST would allow attackers to probe ticket hashes. |
| **5. Can only server-side application layer access?** | **YES**. Strictly through backend API route handlers (`/api/auth/role-preview/*`). |
| **6. Can it be accessed via public Supabase client?** | **NO**. Denied by default. |
| **7. Is `eeos_app_role` required?** | When executed via `drizzle` with service credentials, it operates under the server connection. RLS is enabled with **NO POLICIES**, blocking all anon and authenticated client roles. |
| **8. What is the fail-closed behavior?** | If a query is attempted through client anon/authenticated tokens, PostgreSQL returns empty sets or permission denied. |

### Proposed RLS DDL Specification:
```sql
ALTER TABLE public.preview_origin_tickets ENABLE ROW LEVEL SECURITY;
-- By enabling RLS and declaring ZERO policies for 'anon' or 'authenticated',
-- Supabase PostgREST blocks all direct client HTTP requests with 404/401.
-- Only the PostgreSQL superuser / service_role connection used by the Next.js server can read/write.
```

---

## 9. ATOMIC CONSUME DESIGN (CRITICAL CORE)

### 9.1 Evaluation of Concurrency Options:

| Option | Query Pattern | Race Condition Resilience | Auditability | Recommendation Status |
|---|---|---|---|---|
| **Option A** | `SELECT ...` followed by `DELETE ...` | **VULNERABLE**. Two concurrent requests can both read the row before either deletes it (Time-of-Check to Time-of-Use race). | None (row deleted immediately). | **REJECTED** |
| **Option B** | `UPDATE ... WHERE consumed_at IS NULL AND expires_at > now() RETURNING ...` | **IMMUNE**. Single atomic statement. PostgreSQL MVCC acquires row-level write lock. Exactly one request updates; duplicate matches 0 rows. | High (row preserved with `consumed_at` timestamp). | **RECOMMENDED** |
| **Option C** | `DELETE ... WHERE consumed_at IS NULL AND expires_at > now() RETURNING ...` | **IMMUNE**. Atomic, but loses audit record immediately upon exit. | None. | **REJECTED** |
| **Option D** | Stored Procedure / PL/pgSQL Function | **IMMUNE**, but adds unnecessary database abstraction layer outside TypeScript type checking. | High. | **OVER-ENGINEERED** |

### 9.2 Recommended Atomic SQL Specification:
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

### 9.3 Proof of Atomic Serialization:
1. Concurrently arriving Request 1 and Request 2 both submit identical raw tickets (`ticket_hash = 'e3b0c44...'`).
2. PostgreSQL row-level locking ensures that the first transaction entering the write phase locks the target row.
3. Transaction 1 evaluates `consumed_at IS NULL` (TRUE) and `expires_at > now()` (TRUE).
4. Transaction 1 sets `consumed_at = now()` and commits. `RETURNING` produces 1 row.
5. Transaction 2 gains access to the row. Under PostgreSQL MVCC read-committed isolation, Transaction 2 re-evaluates the `WHERE` clause against the newly committed row state.
6. `consumed_at IS NULL` evaluates to **FALSE**.
7. Zero rows match. Transaction 2 returns empty result set.
8. Application receives `null` and immediately halts exit processing, returning `HTTP 403 INVALID_ORIGIN_TICKET`.
9. **Single-use replay attack is mathematically defeated.**

---

## 10. TTL DESIGN

- **Duration**: Strict 15 minutes (`15 * 60 * 1000` ms).
- **Non-Sliding Guarantee**:
  - `expires_at` is set upon creation: `now() + INTERVAL '15 minutes'`.
  - Persona switching invokes `validateOriginTicket()` which performs a read-only check:  
    `SELECT ... WHERE ticket_hash = $1 AND consumed_at IS NULL AND expires_at > now()`.
  - `expires_at` is never mutated or extended during touch/switch operations.
- **Clock Drift Mitigation**:
  - All timestamp calculations (`now()`, `expires_at`) occur inside PostgreSQL server engine (`TIMESTAMPTZ`), eliminating discrepancies across distributed serverless compute clocks.

---

## 11. CLEANUP STRATEGY

### Evaluation:
- Role Preview is strictly an internal Super Admin / Developer feature. Estimated ticket creation volume: 5–50 rows per week.
- Even without cleanup, 10,000 tickets consume less than 3 MB of database storage.
- However, for operational hygiene:

### Recommended Two-Tier Cleanup Strategy:
1. **Tier 1: Opportunistic / Lazy Cleanup**:
   - During `createOriginTicket()`, execute a lightweight asynchronous non-blocking cleanup query:
     ```sql
     DELETE FROM public.preview_origin_tickets 
     WHERE expires_at < now() - INTERVAL '24 hours';
     ```
2. **Tier 2: Native Supabase `pg_cron` (Optional Operational Hygiene)**:
   - Run daily at midnight:
     ```sql
     SELECT cron.schedule('purge-preview-origin-tickets', '0 0 * * *', 
       $$DELETE FROM public.preview_origin_tickets WHERE expires_at < now() - INTERVAL '7 days'$$
     );
     ```
   - Retaining tickets for 7 days post-expiry provides an audit buffer for security incident investigations.

---

## 12. FAILURE BEHAVIOR & FAIL-CLOSED ENFORCEMENT

In the event of database degradation, connection failure, or query timeout:
1. **Zero In-Memory Fallback**: The silent `catch { return this.fallbackStore }` in `PostgresOriginTicketStorage` must be **completely removed**.
2. **Fail-Closed API Response**:
   - If database is unreachable during entrance (`/api/auth/role-preview`): Return `HTTP 500` with error code `STORAGE_UNAVAILABLE`. Preview session is **NOT** issued.
   - If database is unreachable during exit (`/api/auth/role-preview/exit`): Return `HTTP 500` with error code `RESTORATION_STORAGE_ERROR`. Origin ticket cookie is **NOT** consumed. The user can retry or use fallback standard login.

---

## 13. SERVERLESS & MULTI-INSTANCE LIFECYCLE MODEL

```text
=============================================================================
               SERVERLESS CROSS-INSTANCE LIFECYCLE PROOF
=============================================================================

Instance A (Vercel Lambda - Frankfurt)
  │
  ├── 1. POST /api/auth/role-preview
  │      - Authenticates Super Admin
  │      - Generates rawTicket (256-bit hex)
  │      - Computes ticketHash = SHA-256(rawTicket)
  │      - INSERT INTO preview_origin_tickets (ticket_hash, ...)
  │
  ▼
[PostgreSQL Database (Supabase AWS eu-central-1)]
  │ ── Row persisted with ticket_hash = 'abcd...'
  │
  │ Instance A terminates (Lambda cold shutdown)
  │
  ▲
  │ Instance B spins up (Vercel Lambda - Frankfurt - New Container)
  │
  ├── 2. POST /api/auth/role-preview/exit
  │      - Client carries HttpOnly cookie: sb-preview-origin-ticket = '...'
  │      - Computes ticketHash = SHA-256(cookie)
  │      - Executes atomic UPDATE ... WHERE ticket_hash = 'abcd...' RETURNING
  │      - Obtains original caller email ('superadmin@madev.id')
  │      - Generates Supabase magiclink & verifies OTP
  │      - Sets restored Super Admin session cookies
  │      - Clears ticket cookie
  │
  ▼
Exit successful across instances. Zero state lost.
```

---

## 14. RESTART & DEPLOYMENT BEHAVIOR

1. **Process Restart**: Database records remain durable on disk. Any in-flight preview session can cleanly exit after a local server or container restarts.
2. **Production Deployment**:
   - **Policy**: Existing valid tickets **survive deployments** up to their 15-minute expiration ceiling.
   - **Rationale**: If a Super Admin enters preview mode and a CI/CD deployment completes 2 minutes later, the Super Admin must not be locked out of exiting preview mode. Because the database schema is backwards-compatible, existing tickets remain fully valid and consumable post-deploy.

---

## 15. SECURITY THREAT MODEL

| Threat ID | Threat Description | Architectural Mitigation / Control | Residual Risk |
|---|---|---|---|
| **T-01** | **Ticket Interception (Man-in-the-Middle)** | Cookie configured with `HttpOnly`, `SameSite=Lax`, and `Secure` (in prod). Raw ticket never accessible via JavaScript. | Low (requires total client device compromise). |
| **T-02** | **Ticket Replay Attack** | Atomic `UPDATE ... WHERE consumed_at IS NULL` ensures exactly one exit execution succeeds. | Zero. |
| **T-03** | **Ticket Brute Force** | Raw ticket has 256 bits of entropy ($2^{256}$ search space). Fixed 15-minute TTL invalidates tokens before brute force can make progress. | Zero. |
| **T-04** | **Concurrent Replay Race** | Database row-level write lock serializes execution. Duplicate concurrent requests return 0 rows. | Zero. |
| **T-05** | **Expired Ticket Reuse** | Database query explicitly filters `AND expires_at > now()`. Expired rows are rejected. | Zero. |
| **T-06** | **Cross-User Ticket Theft** | Exit endpoint restores session strictly to `origin_user_email` recorded at minting. An attacker cannot redirect session restoration to an arbitrary account. | Zero. |
| **T-07** | **Database Read Exposure** | Database stores strictly SHA-256 hashes (`ticket_hash`). No raw tickets, passwords, or access tokens exist in storage. | Zero raw credential exposure. |
| **T-08** | **Application Log Leakage** | Raw tickets and cookies are explicitly excluded from application logs. | Zero. |
| **T-09** | **Client Storage Injection** | Client receives opaque cookie; no localStorage or sessionStorage is used. | Zero. |
| **T-10** | **PostgREST Direct Query** | RLS enabled with zero policies. Client anon/authenticated roles cannot query the table. | Zero. |

---

## 16. LOGGING & AUDIT TRAIL DESIGN

### 16.1 Logging Rules:
- **STRICTLY FORBIDDEN FROM LOGS**:
  - `rawTicket` (64-character hex string)
  - `sb-preview-origin-ticket` cookie value
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `hashed_token` from magiclink recovery
- **PERMITTED SAFE LOG ATTRIBUTES**:
  - `ticketId` (UUID)
  - `ticketHashPrefix`: `ticketHash.slice(0, 8) + '...'`
  - `callerUserId` (UUID)
  - `callerRole`
  - `previewPersona`
  - `event`: `PREVIEW_TICKET_CREATED`, `PREVIEW_TICKET_CONSUMED`, `PREVIEW_TICKET_REPLAY_REJECTED`, `PREVIEW_TICKET_EXPIRED`

### 16.2 Integration with Existing `auditLogService`:
Upon ticket creation and consumption, record events into `public.audit_logs`:

```typescript
await auditLogService.log({
  action: 'CREATE', // or 'EXECUTE' for consume
  entityType: 'AUTH',
  entityId: ticketRecord.id,
  entityLabel: `Role Preview: ${requestedRole}`,
  actorId: callerUser.id,
  actorName: callerUser.email,
  actorRole: callerRole,
  metadata: {
    previewPersona: requestedRole,
    ticketHashPrefix: ticketHash.slice(0, 8),
    expiresAt: new Date(expiresAt).toISOString(),
  },
});
```

---

## 17. DATA RETENTION POLICY

- **Active Window**: 15 minutes from creation.
- **Audit Retention Window**: 7 days post-consumption.
- **Purge Execution**: Records older than 7 days are purged by scheduled maintenance (`pg_cron`) or opportunistic batch deletes.

---

## 18. MIGRATION DESIGN (CONCEPTUAL)

```text
=============================================================================
                  CONCEPTUAL MIGRATION EXECUTION SEQUENCE
=============================================================================

Step 1: DDL Migration File Creation (drizzle/xxxx_preview_origin_tickets.sql)
        - Define CREATE TABLE public.preview_origin_tickets
        - Define UNIQUE constraint on ticket_hash
        - Define CHECK constraints for expiry and hash length
        - Define partial indexes for active lookups and cleanup
        - Execute ALTER TABLE public.preview_origin_tickets ENABLE ROW LEVEL SECURITY

Step 2: Drizzle Schema Registration
        - Add pgTable definition in src/lib/db/schema/preview_origin_tickets.ts
        - Export in src/lib/db/schema/index.ts

Step 3: Storage Adapter Implementation
        - Update PostgresOriginTicketStorage in src/lib/authz/preview-origin-ticket.ts
        - Wire activeStorage = new PostgresOriginTicketStorage()
        - Remove in-memory fallback catch blocks (fail-closed enforcement)

Step 4: Contract Test Suite Update
        - Update tests/contracts/role-preview.contract.test.ts to test against
          PostgreSQL storage adapter with mock client or database test container.

Step 5: Verification & Audit
        - Run contract tests (23/23 target)
        - Run type checks (npx tsc --noEmit)
        - Execute verification report
```

---

## 19. ROLLOUT & CUTOVER STRATEGY

Because Role Preview is an ephemeral session utility and existing in-memory tickets have a maximum 15-minute lifetime:
1. **Zero Dual-Write Complexity**: Dual-write introduces split-brain risks and ambiguous security semantics.
2. **Instant Clean Cutover**:
   - Deploy migration applying the table DDL.
   - Switch application `activeStorage` to `PostgresOriginTicketStorage`.
   - Any in-flight in-memory preview session simply logs out and re-authenticates via the standard login surface if caught during the cutover minute.
   - Zero historical backfill required (consistent with `HIST-1 Clean Slate`).

---

## 20. BACKWARD COMPATIBILITY & USER EXPERIENCE

The public user experience and Super Admin workflow remain **100% identical**:
1. Super Admin visits `/dashboard/saas/preview`.
2. Selects persona (e.g. "Admin Pesantren").
3. Preview banner appears (`PreviewIndicator`).
4. Super Admin inspects system as the target persona.
5. Clicks "Keluar Preview".
6. Original Super Admin session is instantly restored.
7. Redirects to `/dashboard/saas/preview`.

The underlying transition from `Map` to `PostgreSQL` is completely transparent to the user, with the critical upgrade that session exit now succeeds seamlessly across different devices, serverless lambdas, and server restarts.

---

## 21. TEST MATRIX DESIGN (PRE-IMPLEMENTATION)

| Category | Test Case Name | Input / Precondition | Expected Output / Assertion |
|---|---|---|---|
| **Functional** | Ticket Creation | Authenticated Super Admin | Generates 64-char opaque ticket; DB contains 64-char SHA-256 hash. |
| **Functional** | Valid Consumption | Valid unconsumed ticket | Returns original email; marks `consumed_at = now()`. |
| **Functional** | Touch / Persona Switch | Active ticket within 15 min | Returns `true`; `expires_at` is NOT modified (non-sliding). |
| **Security** | Anonymous Caller | Unauthenticated request to `/api/auth/role-preview` | Returns `HTTP 403 UNAUTHORIZED_CALLER`. |
| **Security** | Tenant Role Callers | Caller is `santri`, `wali`, `musyrif`, `admin` | Returns `HTTP 403 UNAUTHORIZED_CALLER`. |
| **Security** | Tampered Ticket | Altered ticket string | Hash mismatch; returns `HTTP 403 INVALID_ORIGIN_TICKET`. |
| **Security** | Single-Use Replay | Ticket consumed twice sequentially | 1st call: 200 OK; 2nd call: `HTTP 403 INVALID_ORIGIN_TICKET`. |
| **Security** | Expired Ticket | Ticket older than 15 minutes | `expires_at > now()` fails; returns `HTTP 403 INVALID_ORIGIN_TICKET`. |
| **Distributed** | Multi-Instance Simulation | Instance A writes, Instance B queries DB | Instance B consumes ticket successfully. |
| **Concurrency** | Concurrent Consume Race | 50 concurrent requests for same ticket | Exactly 1 request succeeds; 49 receive 403 rejection. |
| **Resilience** | Database Disconnect | Database connection severed | Fails closed; returns `HTTP 500`; zero in-memory fallback. |

---

## 22. RISKS & MITIGATIONS

| Risk ID | Risk Description | Severity | Mitigation Strategy |
|---|---|---|---|
| **R-01** | Database pooler connection exhaustion under load | Low | Role Preview is restricted to Super Admins (< 10 concurrent users). Uses Supabase Transactional Pooler (`prepare: false`). |
| **R-02** | Stale tickets accumulating in database | Low | Automated partial index ensures queries ignore expired records; opportunistic lazy purge cleans up daily. |
| **R-03** | Service role key missing in environment | Medium | Exit route checks `SUPABASE_SERVICE_ROLE_KEY` existence and returns 500 fail-closed if unconfigured. |

---

## 23. IMPLEMENTATION PRECONDITIONS

Before implementation can be authorized by the Product Owner:
1. Product Owner formally reviews and ratifies this Implementation Design report.
2. An explicit implementation Work Package (`WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-001`) is commissioned.
3. Zero code changes are made prior to Product Owner authorization.

---

## 24. DECISION SUMMARY

```text
==================================================
EEOS IMPLEMENTATION DESIGN DECISION
==================================================

WP:
WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-DESIGN-001

STORAGE:
PostgreSQL / Supabase

TABLE:
public.preview_origin_tickets

CURRENT IMPLEMENTATION:
In-memory process-local

TARGET:
Persistent shared storage

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
Product Owner Implementation Design Ratification

==================================================
```
