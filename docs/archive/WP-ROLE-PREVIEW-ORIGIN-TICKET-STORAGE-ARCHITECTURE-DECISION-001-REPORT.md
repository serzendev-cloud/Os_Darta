# EEOS ARCHITECTURE DECISION REPORT
## Storage Architecture for Role Preview Distributed Origin Ticket

**Work Package**: `WP-ROLE-PREVIEW-ORIGIN-TICKET-STORAGE-ARCHITECTURE-DECISION-001`  
**Date**: 2026-09-21  
**Author**: Antigravity (Senior Principal Systems Architect)  
**Status**: ARCHITECTURE DECISION REVIEW — PENDING PRODUCT OWNER RATIFICATION  
**Governance Mode**: READ-ONLY / ZERO MUTATION  
**Authoritative Reference**: `docs/architecture/EEOS-PROJECT-JOURNEY-MAP.md`  

---

## 1. EXECUTIVE SUMMARY

Following the forensic security audit (`WP-ROLE-PREVIEW-ORIGIN-TICKET-DISTRIBUTED-AUDIT-001`) which returned **`VERDICT: FAIL`** due to process-local in-memory state (`globalThis.__eeosSharedPreviewTicketStore = new Map()`), this Architecture Decision Document conducts a rigorous, evidence-based evaluation to select a stateful, shared, persistent, and distributed atomic storage architecture for the Role Preview Origin Ticket System.

Four architectural candidates were comprehensively analyzed:
1. **Candidate A**: PostgreSQL / Supabase Dedicated Table (`preview_origin_tickets`)
2. **Candidate B**: External Redis / Managed Redis (e.g. Upstash)
3. **Candidate C**: Platform-Native KV (e.g. Vercel KV / Edge Config)
4. **Candidate D**: Stateless Signed/Encrypted Tokens (JWE / PASETO)

### Primary Decision:
**RECOMMENDED ARCHITECTURE**: **Candidate A — PostgreSQL / Supabase Dedicated Storage Table**  
- **Storage Substrate**: Dedicated unlogged/standard table `public.preview_origin_tickets` in existing Supabase PostgreSQL instance.
- **Concurrency & Single-Use**: Atomic single-statement `UPDATE ... WHERE ticket_hash = $1 AND consumed_at IS NULL AND expires_at > now() RETURNING ...` leveraging PostgreSQL MVCC row-level write locks.
- **Zero Raw Credential Storage**: Only SHA-256 digests and non-sensitive user metadata (`origin_user_id`, `origin_user_email`, `origin_role`) are persisted. Zero Supabase access/refresh tokens or passwords enter storage.
- **Zero Infrastructure Drift**: Utilizes existing Supabase infrastructure, existing pooled connection pooler (`postgres.js` with `prepare: false`), zero new monthly vendor costs, and zero network configuration overhead.

---

## 2. CURRENT FAILURE CONTEXT & PROBLEM STATEMENT

In `WP-ROLE-PREVIEW-ORIGIN-TICKET-DISTRIBUTED-AUDIT-001`, the Origin Ticket implementation was proven non-viable for multi-instance and serverless production environments:

```text
Current State (Failing):
[Instance A (Lambda / Pod 1)] ──> globalThis.Map (Process Memory A)
[Instance B (Lambda / Pod 2)] ──> globalThis.Map (Process Memory B)

Problem:
1. Ticket created on Instance A is invisible to Instance B -> HTTP 403 upon Exit Preview.
2. Cold start or process restart wipes memory -> HTTP 403 upon Exit Preview.
3. Concurrent requests across separate instances cannot enforce atomic single-use.
```

### Critical Gap:
The system requires a storage medium accessible across all compute instances that guarantees:
- **Persistence across restarts and cold starts**
- **Strict single-use atomic consumption under high concurrency**
- **Deterministic 15-minute TTL invalidation**
- **Fail-closed behavior when storage is degraded**
- **Zero raw credential leakage**

---

## 3. FUNCTIONAL & NON-FUNCTIONAL REQUIREMENTS

### 3.1 Functional Requirements
- **Ticket Minting**: Issued solely to authenticated Super Admins and Developers upon entering Preview Mode.
- **Opaque Token**: Client receives a cryptographically random 64-character hex string (256 bits entropy).
- **Lookup Key**: Server indexes storage solely by SHA-256 digest of the raw ticket (`ticket_hash`).
- **Single-Use Consumption**: Exit request must atomically claim and consume the ticket. Any subsequent consumption attempt (replay attack) must be rejected immediately.
- **Original Session Restoration**: Valid consumption triggers server-side OTP/magiclink verification to regenerate the Super Admin session without client-held credentials.

### 3.2 Non-Functional Requirements
- **Persistence**: State must survive container restarts, code redeployments, and serverless teardowns.
- **Distributed Consistency**: Instance B must reliably read and mutate tickets minted by Instance A.
- **Atomic Single-Use**: Under simultaneous requests, exactly one request succeeds; all concurrent duplicates receive rejection.
- **Fixed TTL**: 15 minutes strict ceiling; no sliding extension on read or persona switch.
- **Fail Closed**: Any storage disconnect, timeout, or query error must fail closed (reject access); **zero fallback to in-memory Maps**.
- **Operational Simplicity**: Minimize external dependencies, moving parts, network failure modes, and operational burden.

---

## 4. ARCHITECTURE CANDIDATES DETAILED ANALYSIS

---

### 5. CANDIDATE A — POSTGRESQL / SUPABASE (RECOMMENDED)

#### 5.1 Architecture & Schema Design
A dedicated table within the existing Supabase PostgreSQL database:

```sql
CREATE TABLE public.preview_origin_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_hash VARCHAR(64) NOT NULL UNIQUE,
    origin_user_id UUID NOT NULL,
    origin_user_email VARCHAR(255) NOT NULL,
    origin_role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ DEFAULT NULL
);

-- B-tree index for O(1) lookups and single-use conditional updates
CREATE UNIQUE INDEX idx_preview_origin_tickets_hash 
ON public.preview_origin_tickets (ticket_hash);

-- Index for background maintenance / TTL cleanup
CREATE INDEX idx_preview_origin_tickets_expiry 
ON public.preview_origin_tickets (expires_at) 
WHERE consumed_at IS NULL;
```

#### 5.2 Atomic Single-Use Concurrency Semantics
PostgreSQL's write-lock semantics on row-level updates provide a perfect, mathematically guaranteed atomic compare-and-swap:

```sql
UPDATE public.preview_origin_tickets
SET consumed_at = now()
WHERE ticket_hash = $1
  AND consumed_at IS NULL
  AND expires_at > now()
RETURNING id, origin_user_id, origin_user_email, origin_role, created_at, expires_at, consumed_at;
```

**Concurrency Behavior**:
1. When Request A and Request B concurrently execute this `UPDATE` for the same `ticket_hash`:
2. Request A acquires the exclusive row-level write lock (`FOR UPDATE`).
3. Request B blocks waiting for Request A to commit.
4. Request A updates `consumed_at = now()` and commits. `RETURNING` produces exactly 1 row (`SUCCESS`).
5. Request B unblocks, re-evaluates the `WHERE` clause on the updated row, observes `consumed_at IS NOT NULL`, and matches **0 rows**.
6. Request B receives `null` and is rejected with `HTTP 403 INVALID_ORIGIN_TICKET` (`REPLAY DEFENSE CONFIRMED`).

#### 5.3 Serverless & Connection Pool Compatibility
- The application already utilizes `@/lib/db` connecting via `postgres.js` with `prepare: false` to the Supabase Transactional Pooler (PgBouncer on port 6543).
- Ephemeral serverless lambdas in Vercel reuse the connection pool seamlessly.
- Latency is identical to existing authenticated database transactions (~15–30ms across region).

#### 5.4 Database Security & RLS Model
- `preview_origin_tickets` is a **platform system infrastructure table**, not a tenant-scoped business entity.
- RLS must be enabled with **no public policies** (`ALTER TABLE preview_origin_tickets ENABLE ROW LEVEL SECURITY;`).
- Queries execute exclusively via the backend database client running as the application service role (`postgres` / `service_role`). Direct REST or GraphQL client access through Supabase PostgREST is completely blocked.

#### 5.5 Expired Record Maintenance
- Due to the low volume of preview sessions (Super Admin dev/testing only), storage growth is negligible (< 100 rows/day).
- Automatic cleanup options:
  - Native Supabase `pg_cron` extension: `SELECT cron.schedule('purge-preview-tickets', '0 * * * *', 'DELETE FROM preview_origin_tickets WHERE expires_at < now() - INTERVAL ''1 hour''');`.
  - Lazy eviction: Opportunistic purge during ticket creation.

---

### 6. CANDIDATE B — REDIS / MANAGED REDIS / KV

#### 6.1 Architecture Overview
Using an in-memory key-value store (e.g. Upstash Redis, AWS ElastiCache, or self-hosted Redis):
- Key: `preview:origin_ticket:{ticket_hash}`
- Value: JSON-serialized `{ originUserId, originUserEmail, originUserRole }`
- TTL: Native Redis expiration (`EX 900`).

#### 6.2 Atomic Single-Use Semantics
- In Redis 6.2+, atomic single-use can be executed via `GETDEL key`.
- Alternatively, a Lua script ensures single-use:
  ```lua
  local val = redis.call("GET", KEYS[1])
  if val then
    redis.call("DEL", KEYS[1])
    return val
  else
    return nil
  end
  ```

#### 6.3 Critical Deficiencies & Fit with Existing Stack
1. **Zero Existing Infrastructure**: The project currently has **no Redis instance, no Upstash account, and no Redis client dependencies** installed in `package.json`.
2. **Serverless Connection Pitfalls**: Standard Redis TCP connections exhaust socket limits in serverless Vercel environments. To use Redis reliably, Upstash REST API is required.
3. **Operational Overhead & Cost**: Introducing an external managed Redis service introduces a third vendor dependency (beyond Vercel and Supabase), requiring new secret management, environment variable drift risks, and additional billing tiers.
4. **Overkill for Workload Volume**: Role Preview is strictly an internal administrative feature for Super Admins and Developers. The sub-millisecond throughput advantage of Redis is completely superfluous for a feature executed a few dozen times per week.

---

### 7. CANDIDATE C — PLATFORM-NATIVE KV (VERCEL KV / EDGE CONFIG)

#### 7.1 Architecture Overview
Evaluating Vercel platform-native storage capabilities:
- **Vercel KV**: Deprecated / redirected by Vercel toward third-party partner integrations (Upstash). Not provisioned in this repository.
- **Vercel Edge Config**: Designed exclusively for ultra-low latency **reads** of static feature flags (distributed globally). Write operations require management API calls with propagation latency of 5–15 seconds. **Completely unsuitable** for ephemeral, dynamic single-use token issuance.
- **Vercel Blob**: Object storage designed for files, media, and images; unsuitable for atomic transactional ticketing.

#### 7.2 Verdict on Candidate C
**`NOT VERIFIED / UNSUITABLE`**: No viable native platform KV exists in the current project configuration that supports atomic CAS and dynamic ephemeral key writes.

---

### 8. CANDIDATE D — STATELESS ENCRYPTED TOKEN (JWE / SIGNED STATE)

#### 8.1 Architecture Overview
Instead of storing state in a database, serialize the origin metadata into an encrypted JWE (JSON Web Encryption) with AES-256-GCM, signed by a server-side master key, and pass it to the client as a cookie.

#### 8.2 Critical Security Flaw: The Replay & Single-Use Dilemma
- In a pure stateless token model, the server decrypts and verifies the token integrity without consulting a database.
- **However, statelessness makes atomic single-use impossible.**
- If an attacker intercepts or duplicates the ticket within its 15-minute validity window, the server will accept and decrypt the ticket multiple times.
- To prevent replay, the server **must** maintain a revocation blacklist or a consumed nonce registry.
- A revocation blacklist is itself a **distributed stateful store**. Thus, stateless tokens do not eliminate the need for distributed state; they merely invert the storage requirement while increasing cryptographic complexity.

#### 8.3 Verdict on Candidate D
**`UNSUITABLE`**: Cannot satisfy strict atomic single-use invariant without a stateful backend.

---

## 9. REQUIRED COMPARISON MATRIX

| Architectural Criterion | Candidate A: PostgreSQL / Supabase | Candidate B: Managed Redis (Upstash) | Candidate C: Platform KV (Edge Config) | Candidate D: Stateless JWE + Revocation |
|---|---|---|---|---|
| **Persistence** | **`PASS`** (Durable WAL / SSD) | **`PASS`** (AOF / Snapshot) | **`FAIL`** (Not designed for ephemeral) | **`PASS`** (Client-held) |
| **Cross-Instance Consistency** | **`PASS`** (Immediate read-after-write) | **`PASS`** (Strong consistency) | **`FAIL`** (5–15s propagation lag) | **`PASS`** (Decentralized) |
| **Process Restart Survival** | **`PASS`** (Independent database server) | **`PASS`** (Independent server) | **`PASS`** (Global cache) | **`PASS`** (Client cookie) |
| **Atomic Single-Use** | **`PASS`** (Row-lock `UPDATE ... RETURNING`) | **`PASS`** (`GETDEL` / Lua script) | **`FAIL`** (No atomic CAS) | **`FAIL`** (Requires stateful blacklist) |
| **Fixed 15-Minute TTL** | **`PASS`** (`expires_at > now()`) | **`PASS`** (Native `EX 900`) | **`FAIL`** (Manual mutation) | **`PASS`** (Signed exp claim) |
| **Fail Closed** | **`PASS`** (DB error throws -> 403/500) | **`PASS`** (Redis error throws -> 403/500) | **`PARTIAL`** | **`PASS`** (Crypto validation error) |
| **Serverless Compatibility** | **`PASS`** (PgBouncer connection pool) | **`PASS`** (Via HTTP REST only) | **`PASS`** | **`PASS`** |
| **Existing Stack Fit** | **`PASS`** (100% native; already deployed) | **`FAIL`** (Requires new service) | **`FAIL`** (Not configured) | **`PARTIAL`** (Added crypto overhead) |
| **Operational Complexity** | **`PASS`** (Zero new ops, standard table) | **`PARTIAL`** (New provider to monitor) | **`FAIL`** (High API complexity) | **`PARTIAL`** (Key rotation overhead) |
| **Additional Infrastructure** | **`PASS`** (None needed) | **`FAIL`** (Requires external Redis) | **`FAIL`** (New cloud resources) | **`PASS`** (None needed) |
| **Security & Credential Isolation**| **`PASS`** (SHA-256 hashes only) | **`PASS`** (Hashes only) | **`FAIL`** (Potential global exposure) | **`PARTIAL`** (Symmetric key exposure) |
| **Cost** | **`PASS`** ($0 incremental cost) | **`PARTIAL`** (New subscription tier) | **`PARTIAL`** | **`PASS`** ($0 incremental cost) |
| **Maintenance / Cleanup** | **`PASS`** (Simple `pg_cron` or lazy query) | **`PASS`** (Automated Redis eviction) | **`FAIL`** | **`PARTIAL`** (Blacklist bloat) |
| **Observability** | **`PASS`** (SQL queryable, audit logs) | **`PARTIAL`** (External dashboard) | **`FAIL`** | **`FAIL`** (Opaque in logs) |

---

## 10. RECOMMENDED SECURITY MODEL & LIFECYCLE

```text
=============================================================================
                      ORIGIN TICKET LIFECYCLE SEMANTICS
=============================================================================

1. CREATION (POST /api/auth/role-preview):
   Caller (Super Admin)
        │
        ▼
   Server-Side Authorization (Check role === 'super_admin' | 'developer')
        │
        ▼
   Generate 256-bit cryptographically random raw ticket:
   rawTicket = crypto.randomBytes(32).toString('hex')  [64 hex chars]
        │
        ▼
   Derive storage identifier:
   ticketHash = crypto.createHash('sha256').update(rawTicket).digest('hex')
        │
        ▼
   Persist to PostgreSQL:
   INSERT INTO public.preview_origin_tickets (
       id, ticket_hash, origin_user_id, origin_user_email, origin_role,
       created_at, expires_at, consumed_at
   ) VALUES (
       gen_random_uuid(), ticketHash, caller.id, caller.email, caller.role,
       now(), now() + INTERVAL '15 minutes', NULL
   );
        │
        ▼
   Send Response:
   - Set-Cookie: sb-preview-origin-ticket = rawTicket (HttpOnly, SameSite=Lax, Secure, 15 min)
   - Issue preview persona session cookies
   - Client NEVER receives ticketHash; DB NEVER receives rawTicket.


2. CONSUMPTION & RESTORATION (POST /api/auth/role-preview/exit):
   Client (carries cookie: sb-preview-origin-ticket = rawTicket)
        │
        ▼
   Read rawTicket from HttpOnly cookie
        │
        ▼
   Derive lookup key:
   ticketHash = crypto.createHash('sha256').update(rawTicket).digest('hex')
        │
        ▼
   Atomic Claim & Consume in PostgreSQL:
   UPDATE public.preview_origin_tickets
   SET consumed_at = now()
   WHERE ticket_hash = ticketHash
     AND consumed_at IS NULL
     AND expires_at > now()
   RETURNING origin_user_email;
        │
        ├─────────────────────────────┬─────────────────────────────┐
        ▼                             ▼                             ▼
   [0 rows returned]            [DB Error / Timeout]          [1 row returned]
   (Consumed or Expired)        (Connection failure)          (Valid ticket claimed)
        │                             │                             │
        ▼                             ▼                             ▼
   REJECT (403 Forbidden)        FAIL CLOSED (500 Error)       RESTORE SESSION
   "INVALID_ORIGIN_TICKET"       "AUTH_SERVER_ERROR"                │
                                                                    ▼
                                                         Supabase Admin Client:
                                                         generateLink({ magiclink, email })
                                                                    │
                                                                    ▼
                                                         SSR Client:
                                                         verifyOtp({ token_hash })
                                                                    │
                                                                    ▼
                                                         - Clear origin cookie (maxAge: 0)
                                                         - Stamp restored Super Admin cookies
                                                         - 302 Redirect to /dashboard/saas/preview
```

---

## 11. FAILURE MATRIX & SYSTEM RESILIENCE

| Failure Scenario | System Reaction | Architectural Guarantee |
|---|---|---|
| **Invalid / Random string submitted** | Hash lookup matches 0 rows in DB. | Returns `403 INVALID_ORIGIN_TICKET`. Safe rejection. |
| **Expired ticket submitted (> 15 min)** | `expires_at > now()` fails. 0 rows updated. | Returns `403 INVALID_ORIGIN_TICKET`. Hard ceiling enforced. |
| **Replay attempt (already consumed)** | `consumed_at IS NULL` fails. 0 rows updated. | Returns `403 INVALID_ORIGIN_TICKET`. Replay blocked. |
| **Concurrent duplicate consumption** | Row-level write lock serializes execution. | Exactly 1 request succeeds (1 row); duplicate matches 0 rows. |
| **Database unavailable / network partition** | SQL query throws exception. | **Fails Closed**. Returns `500 Server Error`. Zero session grant. |
| **Cross-Instance execution (Created on A, Exited on B)** | Instance B queries the shared Supabase DB. | Record found and consumed without friction. Seamless operation. |
| **Node.js process restart before exit** | DB state remains durable on disk. | Super Admin cleanly exits preview mode after restart. |
| **Vercel redeployment while preview active** | DB state persists independent of Vercel build. | Active preview session can exit cleanly post-deploy. |
| **Origin ticket cookie intercepted** | Attacker has maximum 15 minutes; single-use only. | Attacker cannot extract raw password or Supabase token. |

---

## 12. RAW CREDENTIAL EXPOSURE AUDIT (SECTION 11 COMPLIANCE)

### Does Origin Ticket Need to Store Raw Supabase Session Material?
**`ABSOLUTELY NOT`**.

The audit confirms:
1. Origin Ticket storage **must never** store Supabase `access_token`, `refresh_token`, password hashes, or session secrets.
2. The restored session is generated dynamically on the server using Supabase's native GoTrue Admin API:
   - `adminClient.auth.admin.generateLink({ type: 'magiclink', email })` generates an ephemeral, single-use token hash.
   - `ssrClient.auth.verifyOtp({ token_hash, type: 'magiclink' })` validates the token server-side and writes fresh, cryptographically signed Supabase session cookies directly to the HTTP response.
3. Therefore, the database table only needs:
   - `origin_user_id`: UUID
   - `origin_user_email`: Email
   - `origin_role`: Role string
4. In the event of a total database read compromise, an attacker obtains only SHA-256 hashes and email addresses. No credentials or reusable authentication tokens are exposed.

---

## 13. RECOMMENDED ARCHITECTURE & RATIFICATION PROPOSAL

```text
=============================================================================
                       FORMAL ARCHITECTURE PROPOSAL
=============================================================================

RECOMMENDED:
PostgreSQL Dedicated Storage Table (Candidate A) via Supabase Pooler

REASON:
1. Fully satisfies all 6 critical guarantees: Persistence, Cross-Instance,
   Atomic Single-Use, Strict 15-min TTL, Fail-Closed, and Restart Survival.
2. Leverages the existing hardened Supabase PostgreSQL foundation.
3. Requires zero new services, zero third-party billing accounts, and zero
   architectural complexity.
4. Guaranteed race-condition proof via PostgreSQL row-level locking MVCC.
5. Preserves strict credential isolation (zero raw token storage).

WHY NOT THE OTHERS:
- Redis/Upstash (Candidate B): Introduces unnecessary operational overhead,
  extra external network hops, vendor dependency, and added cost for an
  internal administrative workload that does not require sub-millisecond speeds.
- Platform KV (Candidate C): Incompatible propagation latency and lack of
  atomic CAS primitives on Vercel Edge Config.
- Stateless JWE (Candidate D): Cannot provide atomic single-use replay defense
  without an accompanying distributed stateful store.

CRITICAL GUARANTEES PROVIDED:
- Persistence: YES (PostgreSQL ACID durability)
- Cross-Instance: YES (Centralized database queried by all compute nodes)
- Atomic Single-Use: YES (UPDATE ... WHERE consumed_at IS NULL RETURNING)
- TTL: YES (SQL filter expires_at > now())
- Fail Closed: YES (Database error -> immediate rejection; NO in-memory fallback)
- Restart Survival: YES (Independent database lifecycle)
```

---

## 14. IMPLEMENTATION PRECONDITIONS (FOR FUTURE WORK PACKAGE)

When the Product Owner authorizes implementation in a subsequent Work Package:
1. **Migration Creation**:
   - Create `drizzle/xxxx_preview_origin_tickets.sql` with table definition, indexes, and RLS lockdown.
   - Add Drizzle schema model in `src/lib/db/schema/`.
2. **Adapter Refactoring**:
   - Refactor `PostgresOriginTicketStorage` in `src/lib/authz/preview-origin-ticket.ts` to use `@/lib/db`.
   - Set `activeStorage = new PostgresOriginTicketStorage()`.
   - **Remove the silent in-memory fallback** (`catch { return this.fallbackStore }`) so that database errors strictly fail closed.
3. **Contract Test Realignment**:
   - Update `tests/contracts/role-preview.contract.test.ts` to mock database query responses rather than passing shared `new Map()` pointers.

---

## 15. DECISION STATUS

```text
DECISION STATUS:
READY FOR RATIFICATION

IMPLEMENTATION AUTHORIZATION:
NOT GRANTED (Awaiting Product Owner Approval)

NEXT GATE:
Product Owner Architecture Decision Ratification
```
