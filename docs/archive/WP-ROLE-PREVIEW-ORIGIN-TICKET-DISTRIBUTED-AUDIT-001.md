# EEOS — DISTRIBUTED ORIGIN TICKET SECURITY AUDIT
## Comprehensive Read-Only Forensic Architecture & Security Report

**Work Package**: `WP-ROLE-PREVIEW-ORIGIN-TICKET-DISTRIBUTED-AUDIT-001`  
**Execution Date**: 2026-09-21  
**Auditor**: Antigravity (Senior Principal Systems Architect)  
**Governance Mode**: STRICT READ-ONLY / ZERO MUTATION  
**Target Reference**: `docs/architecture/EEOS-PROJECT-JOURNEY-MAP.md`  

---

## 1. EXECUTIVE SUMMARY

An exhaustive, zero-mutation forensic security audit was conducted on the **Role Preview Platform** and its **Origin Ticket System** (`src/lib/authz/preview-origin-ticket.ts`, `src/app/api/auth/role-preview/route.ts`, `src/app/api/auth/role-preview/exit/route.ts`, `src/components/shared/PreviewIndicator.tsx`, and `tests/contracts/role-preview.contract.test.ts`).

### Key Audit Findings:
1. **Actual Storage is Process-Local In-Memory (`FAIL`)**:  
   In runtime execution, `activeStorage` in `preview-origin-ticket.ts` defaults to `SharedOriginTicketStorage`, which instantiates a local JavaScript `Map` via `globalThis.__eeosSharedPreviewTicketStore = new Map()`.
2. **Distributed Persistence is False / Not Implemented (`FAIL`)**:  
   The system does NOT use Redis, Upstash, Vercel KV, or PostgreSQL in runtime. State is held in the heap memory of a single Node.js process. In a serverless (e.g. Vercel) or multi-container environment, separate instances have completely isolated memory. An Origin Ticket minted on Instance A cannot be validated or consumed on Instance B.
3. **Restart Survival is False (`FAIL`)**:  
   Upon Node.js process termination or cold-start container spin-up, `globalThis` is destroyed. All active origin tickets vanish immediately.
4. **PostgreSQL Adapter is Dead Code with Silent Fallback**:  
   `PostgresOriginTicketStorage` is implemented in `preview-origin-ticket.ts`, but it is **never instantiated or configured as `activeStorage`** anywhere in the application runtime. Furthermore, the referenced table `public.preview_origin_tickets` does not exist in Drizzle schemas or migrations. Its internal `catch` blocks silently fall back to `SharedOriginTicketStorage` (the in-memory `Map`).
5. **HMAC-SHA256 Claim Discrepancy**:  
   Previous documentation asserted that origin tickets utilize HMAC-SHA256, `jti`, and `crypto.timingSafeEqual`. Forensic analysis reveals that the implementation actually uses plain unkeyed SHA-256 (`crypto.createHash('sha256')`) to index an in-memory `Map`. No HMAC secret is used, no `jti` claim exists, and lookup is a standard JavaScript Map key retrieval rather than constant-time comparison.
6. **Contract Tests Relied on False Mock Simulations**:  
   Test assertions for "distributed cross-instance" and "restart survival" passed in Vitest because the test passed the exact same in-memory JavaScript `Map` reference between two wrapper objects within the same Node process. This simulated shared memory rather than testing distributed runtime realities.
7. **Positive Security Controls Verified**:  
   - Zero raw credentials/JWTs are stored in the origin ticket.
   - The client receives an opaque 64-character random hex string (256 bits entropy).
   - Fixed 15-minute TTL without sliding window is properly enforced.
   - Strict server-side caller authorization enforces 403 on Anonymous, Santri, Wali, Musyrif, and Admin Pesantren.
   - Cookies are configured with `HttpOnly`, `SameSite=Lax`, and `Secure` in production.

**OVERALL AUDIT VERDICT**: **`FAIL`**  
Due to process-local state, lack of distributed persistence, vulnerability to multi-instance desynchronization, and reliance on deceptive in-memory mock tests for distributed claims.

---

## 2. PROJECT JOURNEY MAP VERIFICATION

Before commencing audit execution, `docs/architecture/EEOS-PROJECT-JOURNEY-MAP.md` was read and verified as the authoritative navigation baseline:

- **Current Phase**: `ROLE PREVIEW PLATFORM HARDENING`
- **Current Work Package**: `WP-ROLE-PREVIEW-ORIGIN-TICKET-DISTRIBUTED-AUDIT-001`
- **Current Blocker**: `Distributed Origin Ticket State has not yet been independently proven.`
- **Next Gate**: `Production Deployment / Environment Gate`
- **Closed Milestones**: MB-01, MB-02, MB-03, MB-04, MB-06, WP-02, Clean-Slate Reset (All verified as CLOSED; zero attempts to reopen or mutate historical packages).

---

## 3. CURRENT WORK PACKAGE VERIFICATION

- **Work Package**: `WP-ROLE-PREVIEW-ORIGIN-TICKET-DISTRIBUTED-AUDIT-001`
- **Objective**: Independently audit and prove whether Origin Ticket state is truly persistent, distributed, and shared across runtime instances.
- **Rules of Engagement**: 100% Read-Only, Zero Source Mutation, Zero Database Mutation, Zero Git Mutation, Zero Deployment.

---

## 4. FILES AUDITED

| File Path | Role / Content |
|---|---|
| `src/lib/authz/preview-origin-ticket.ts` | Core ticket creation, hash hashing, storage adapters (`SharedOriginTicketStorage`, `PostgresOriginTicketStorage`), active singleton. |
| `src/app/api/auth/role-preview/route.ts` | Role preview entrance endpoint, caller authorization, preview user sign-in, ticket creation & cookie issue. |
| `src/app/api/auth/role-preview/exit/route.ts` | Role preview exit endpoint, ticket consumption, magiclink restoration of original Super Admin session. |
| `src/components/shared/PreviewIndicator.tsx` | Client banner, persona switcher modal, exit preview trigger. |
| `tests/contracts/role-preview.contract.test.ts` | 23 contract tests verifying invariants, authorization, concurrency, and mock lifecycle. |
| `docs/architecture/WP-ROLE-PREVIEW-GIT-PUSH-EXECUTION-REPORT-001.md` | Commit and push execution report for `a49bd4d`. |
| `docs/architecture/EEOS-PROJECT-JOURNEY-MAP.md` | Project Journey Map navigation baseline. |

---

## 5. ARCHITECTURE TRACE

```text
[Browser / Client]
       │
       │ 1. POST /api/auth/role-preview { role: "admin" }
       ▼
[src/app/api/auth/role-preview/route.ts]
       │
       │ 2. Server-Side Authorization:
       │    - Check ROLE_PREVIEW_ENABLED
       │    - Caller session: supabase.auth.getUser()
       │    - Role check: super_admin / developer
       │
       │ 3. createOriginTicket(userId, userEmail, userRole)
       ▼
[src/lib/authz/preview-origin-ticket.ts]
       │
       │ 4. Generate rawTicket (crypto.randomBytes(32).toString('hex')) [256 bits]
       │    Compute ticketHash = crypto.createHash('sha256').update(rawTicket).digest('hex')
       │    activeStorage.createTicket(stored)
       ▼
[activeStorage: SharedOriginTicketStorage]
       │
       │ 5. Writes to: globalThis.__eeosSharedPreviewTicketStore.set(ticketHash, record)
       │    >>> STORAGE IS IN-MEMORY MAP INSIDE NODE PROCESS HEAP <<<
       ▼
[Client Response]
       │
       │ 6. Sets Cookie: sb-preview-origin-ticket = rawTicket (64 chars)
       │    Sets Supabase session cookies for preview persona
       ▼
[Preview Mode Active]
       │
       │ 7. POST /api/auth/role-preview/exit
       ▼
[src/app/api/auth/role-preview/exit/route.ts]
       │
       │ 8. Reads cookie: sb-preview-origin-ticket
       │    Calls consumeOriginTicket(rawTicket)
       ▼
[src/lib/authz/preview-origin-ticket.ts]
       │
       │ 9. activeStorage.consumeTicket(ticketHash)
       │    Checks record in globalThis.__eeosSharedPreviewTicketStore
       │    Sets record.consumedAt = Date.now()
       ▼
[Session Restoration]
       │
       │ 10. Calls supabase.auth.admin.generateLink({ type: 'magiclink', email })
       │     Calls ssrClient.auth.verifyOtp({ token_hash })
       │     Clears sb-preview-origin-ticket cookie
       ▼
[Super Admin Session Restored]
```

---

## 6. ACTUAL TICKET STORAGE

Forensic inspection of `src/lib/authz/preview-origin-ticket.ts` reveals the exact runtime storage topology:

```typescript
// Line 303:
let activeStorage: OriginTicketStorage = new SharedOriginTicketStorage();

// Lines 58-73:
export class SharedOriginTicketStorage implements OriginTicketStorage {
  private store: Map<string, StoredOriginTicket>;

  constructor(sharedMap?: Map<string, StoredOriginTicket>) {
    if (sharedMap) {
      this.store = sharedMap;
    } else {
      const globalRef = globalThis as unknown as {
        __eeosSharedPreviewTicketStore?: Map<string, StoredOriginTicket>;
      };
      if (!globalRef.__eeosSharedPreviewTicketStore) {
        globalRef.__eeosSharedPreviewTicketStore = new Map();
      }
      this.store = globalRef.__eeosSharedPreviewTicketStore;
    }
  }
```

### Storage Audit Parameters:
- **Actual Storage**: `globalThis.__eeosSharedPreviewTicketStore` (`JavaScript Map`)
- **Storage Type**: In-Memory (Node.js Heap)
- **Persistence**: **`NO`** (Wiped when process terminates)
- **Shared Across Instances**: **`NO`** (Strictly process-local)
- **Process Local**: **`YES`**
- **Atomic Consumption**: Local event-loop synchronous update only; not distributed
- **TTL**: Fixed 15 Minutes enforced in memory
- **Restart Survival**: **`NO`** (Cold start destroys all tickets)

### Analysis of `PostgresOriginTicketStorage`:
`preview-origin-ticket.ts` defines a `PostgresOriginTicketStorage` class (lines 129–300), but:
1. `activeStorage` is **never set** to an instance of `PostgresOriginTicketStorage` in the production codebase.
2. The only place calling `setOriginTicketStorage` is the unit test file `tests/contracts/role-preview.contract.test.ts`.
3. The SQL table `public.preview_origin_tickets` does not exist in any database migration or schema definition.
4. `PostgresOriginTicketStorage` includes a silent `catch` block that reverts to `this.fallbackStore` (`SharedOriginTicketStorage`) on any SQL error or if `DATABASE_URL` is unset or during tests.

---

## 7. HMAC ANALYSIS

Prior documentation and release claims stated that origin tickets used "HMAC-SHA256 with jti and timingSafeEqual". Forensic code audit reveals:

```typescript
// Lines 48-50 in src/lib/authz/preview-origin-ticket.ts:
export function hashOriginTicket(rawTicket: string): string {
  return crypto.createHash('sha256').update(rawTicket).digest('hex');
}
```

### Forensic Findings on HMAC:
- **Algorithm**: Plain SHA-256 (`crypto.createHash('sha256')`).
- **HMAC Usage**: **`NONE`**. `crypto.createHmac` is not used.
- **Secret Key**: No cryptographic secret is used to sign or hash the origin ticket.
- **`jti`**: There is no standard JWT `jti` claim. The ticket record contains a generated `id: crypto.randomUUID()`, but it is indexed solely by `ticketHash`.
- **Timing-Safe Comparison**: Not used for ticket verification. Retrieval is done via `Map.prototype.get(ticketHash)`. (Note: Because tickets are indexed by SHA-256 hash lookup rather than compared against a secret signature, timing attacks on lookup are mitigated by hash collision difficulty, but the claim of `crypto.timingSafeEqual` is technically false).
- **Entropy**: 256 bits of cryptographically secure entropy (`crypto.randomBytes(32).toString('hex')`).
- **Cryptographic Property**: Plain SHA-256 provides preimage resistance and prevents raw ticket leakage in storage, but it is **not an HMAC signature**.

> **Architectural Note**: Hashing proves that storage does not retain raw tokens, but hashing is completely decoupled from distributed persistence.

---

## 8. MULTI-INSTANCE VERIFICATION

### Scenario Analysis:
```text
INSTANCE A (Serverless Lambda 1 / Pod 1)
       │
       │ mint ticket (ticketId: 'a1b2c3...')
       ▼
   Memory Map A [hash('a1b2c3...')]
────────────────────────────────────────
INSTANCE B (Serverless Lambda 2 / Pod 2)
       │
       │ consume ticket (ticketId: 'a1b2c3...')
       ▼
   Memory Map B [] -> TICKET NOT FOUND
       │
       ▼
   RESULT: HTTP 403 INVALID_ORIGIN_TICKET (RESTORE FAILED)
```

In any serverless environment (such as Vercel) or containerized horizontal deployment (Kubernetes / ECS with >1 replica):
1. User enters Role Preview on Instance A. Instance A saves the ticket hash into its own memory heap.
2. User browses around and clicks "Keluar Preview".
3. The browser sends `POST /api/auth/role-preview/exit` to the load balancer, which routes to Instance B.
4. Instance B has an empty or separate `__eeosSharedPreviewTicketStore`.
5. Instance B returns **`403 INVALID_ORIGIN_TICKET`**.
6. The Super Admin cannot restore their session and is forced into fallback logout.

**Verdict**: **`FAIL` — Multi-instance operation is broken in distributed production.**

---

## 9. PROCESS RESTART VERIFICATION

### Scenario Analysis:
```text
Process A (Node.js PID 1001)
       │
       │ createOriginTicket(...)
       ▼
   Heap Map holds ticket record
       │
   Process A terminates / redeploys / restarts
       │
Process B (Node.js PID 1002)
       │
       │ validateOriginTicket(...) / consumeOriginTicket(...)
       ▼
   New Heap Map is EMPTY
       │
       ▼
   RESULT: HTTP 403 INVALID_ORIGIN_TICKET
```

When the Node.js process terminates, is restarted, or a new deployment takes place, all in-memory tickets are lost.

**Verdict**: **`FAIL` — Zero restart survival.**

---

## 10. ATOMIC SINGLE-USE ANALYSIS

In `SharedOriginTicketStorage.consumeTicket`:
```typescript
  public async consumeTicket(ticketHash: string): Promise<StoredOriginTicket | null> {
    const record = this.store.get(ticketHash);
    if (!record) return null;

    const now = Date.now();
    // Atomic test: already consumed or expired
    if (record.consumedAt !== null || record.expiresAt < now) {
      return null;
    }

    // Atomic compare-and-swap
    record.consumedAt = now;
    return { ...record };
  }
```

- **Single-Process Single-Threaded Context**: Because the JavaScript V8 event loop executes synchronous code blocks atomically between `await` boundaries, two concurrent microtasks in the same Node.js thread cannot interleave between `if (!record.consumedAt)` and `record.consumedAt = now`. Test concurrency in Vitest succeeded for this reason.
- **Multi-Process / Distributed Context**: If Instance A and Instance B both receive a replay attack simultaneously, neither knows about the other's state. If tickets were ever replicated asynchronously without CAS (compare-and-swap) or centralized transactional locking, race conditions would be inevitable.
- **SQL Implementation**: In `PostgresOriginTicketStorage`, an atomic `UPDATE ... WHERE consumed_at IS NULL RETURNING ...` was written, but as noted, it is inactive dead code.

**Verdict**: **`NOT PROVEN` for distributed environments; `PASS` only for single-process Node.js event loop.**

---

## 11. TTL ANALYSIS

- **Configured TTL**: `FIXED_ORIGIN_TICKET_TTL_MS = 15 * 60 * 1000` (15 minutes).
- **Enforcement**:
  - `createOriginTicket`: `expiresAt = now + ttlMs`.
  - `validateOriginTicket`: `record.expiresAt < now` -> returns `null`.
  - `consumeOriginTicket`: `record.expiresAt < now` -> returns `null`.
  - `touchOriginTicket`: Calls `validateOriginTicket` without updating `expiresAt` (strictly enforces non-sliding 15-minute ceiling).
  - Cookie: `maxAge: 15 * 60`.
- **Client Manipulation**: Client cannot alter server-side `expiresAt`.

**Verdict**: **`PASS`** (Logic is sound, though bounded by process-local memory).

---

## 12. RAW CREDENTIAL EXPOSURE

- **Stored Data**: The ticket record stores:
  - `originUserId`: UUID of caller.
  - `originUserEmail`: Email of caller.
  - `originUserRole`: Role string of caller.
  - Timestamps (`createdAt`, `expiresAt`, `consumedAt`).
- **Omitted Data**: Zero Supabase access tokens, refresh tokens, passwords, service role keys, or JWTs are stored in the origin ticket.
- **Transport**: Client receives only the 64-character hex string.
- **Channel Isolation**: No ticket IDs appear in URL query strings or browser localStorage.
- **Observation on Preview Persona Passwords**:
  In `src/app/api/auth/role-preview/route.ts`:
  ```typescript
  const previewSecret = process.env.ROLE_PREVIEW_SECRET || 'MaDev_RolePreview_2026!Sec#';
  const previewPassword = `${previewSecret}_${requestedRole}`;
  ```
  While not exposing the Super Admin's password, having a fallback hardcoded secret in source code is an operational observation that should be strictly locked down via environment variables in production.

**Verdict**: **`PASS`** (No raw credentials exposed in origin tickets).

---

## 13. COOKIE SECURITY

Audit of `src/app/api/auth/role-preview/route.ts` (lines 198–206) and `exit/route.ts` (lines 111–119):
```typescript
response.cookies.set(COOKIE_PREVIEW_ORIGIN_TICKET, activeTicketId, {
  httpOnly: true,
  sameSite: 'lax',
  secure: isProduction,
  path: '/',
  maxAge: 15 * 60, // Fixed 15-minute TTL
});
```
- `httpOnly`: `true` (Cannot be accessed by browser JavaScript / XSS).
- `sameSite`: `'lax'` (Protects against CSRF while permitting top-level navigation).
- `secure`: Bound to `isProduction` (`true` in production HTTPS).
- `path`: `'/'`.
- `maxAge`: `900` seconds (15 minutes).
- Deletion on exit: `maxAge: 0`.

**Verdict**: **`PASS`**

---

## 14. AUTHORIZATION MATRIX

Audit of server-side enforcement in `src/app/api/auth/role-preview/route.ts`:

| Caller Persona | Test Assertion | Actual Behavior | Result |
|---|---|---|---|
| **Anonymous** | Rejection expected | Returns `403 UNAUTHORIZED_CALLER` | **ALLOW-DENY CORRECT** |
| **Santri** | Rejection expected | Returns `403 UNAUTHORIZED_CALLER` | **ALLOW-DENY CORRECT** |
| **Wali** | Rejection expected | Returns `403 UNAUTHORIZED_CALLER` | **ALLOW-DENY CORRECT** |
| **Musyrif** | Rejection expected | Returns `403 UNAUTHORIZED_CALLER` | **ALLOW-DENY CORRECT** |
| **Admin Pesantren** | Rejection expected | Returns `403 UNAUTHORIZED_CALLER` | **ALLOW-DENY CORRECT** |
| **Super Admin** | Entrance allowed | Issues Origin Ticket & Persona session | **ALLOW-DENY CORRECT** |
| **Developer** | Entrance allowed | Issues Origin Ticket & Persona session | **ALLOW-DENY CORRECT** |
| **Active Preview** (with valid ticket) | Switching allowed | Updates persona within 15-min window | **ALLOW-DENY CORRECT** |

Audit of server-side enforcement in `src/app/api/auth/role-preview/exit/route.ts`:
- Unauthenticated or missing ticket: Returns `403 INVALID_ORIGIN_TICKET`.
- Tampered ticket: Returns `403 INVALID_ORIGIN_TICKET`.
- Consumed / Replayed ticket: Returns `403 INVALID_ORIGIN_TICKET`.
- Expired ticket: Returns `403 INVALID_ORIGIN_TICKET`.

**Verdict**: **`PASS`**

---

## 15. SESSION RESTORATION

Audit of restoration mechanism in `src/app/api/auth/role-preview/exit/route.ts`:
1. Ticket is validated and consumed via `consumeOriginTicket(ticketId)`.
2. Supabase Admin client executes `adminClient.auth.admin.generateLink({ type: 'magiclink', email: originTicket.originUserEmail })`.
3. The server immediately verifies the single-use token hash via `ssrClient.auth.verifyOtp({ token_hash, type: 'magiclink' })`.
4. Supabase session cookies for the original Super Admin are stamped directly onto the outgoing HTTP response.
5. The origin ticket cookie is zeroed out (`maxAge: 0`).
6. The user is redirected to `/dashboard/saas/preview`.

This restoration flow cleanly eliminates raw token caching on the client.

**Verdict**: **`PASS`** (Flow design is sound; failure is strictly tied to storage persistence across instances).

---

## 16. CROSS-INSTANCE SESSION RESTORATION

- Because the origin ticket storage is process-local (`Map`), if the exit request lands on an instance other than the one that created the ticket, `consumeOriginTicket` returns `null`.
- As a consequence, session restoration fails with `403 INVALID_ORIGIN_TICKET`, and the user is redirected to `/login` via fallback logout.

**Verdict**: **`FAIL` — Cross-instance restoration is not operational.**

---

## 17. FAILURE-CLOSED ANALYSIS

1. If origin ticket is missing -> Returns `403`.
2. If origin ticket is expired -> Returns `403`.
3. If origin ticket is consumed -> Returns `403`.
4. If `ROLE_PREVIEW_ENABLED` is false -> Returns `403`.
5. If `ROLE_PREVIEW_PRODUCTION_ALLOWED` is false in production -> Returns `403`.
6. If `SUPABASE_SERVICE_ROLE_KEY` is missing in exit route -> Returns `500`.
7. If magiclink generation or OTP verification fails -> Returns `500`, origin cookie is not cleared, but session is not granted.

**Verdict**: **`PASS`** (System fails closed under error conditions).

---

## 18. TEST QUALITY REVIEW

Detailed audit of `tests/contracts/role-preview.contract.test.ts` (23 passing tests):

| Test Description | Actual Mechanism in Code | What it PROVES | What it DOES NOT Prove | Quality Verdict |
|---|---|---|---|---|
| **Opaque ticket invariants** | Generates ticket, asserts length 64, checks absence of 'eyJ'. | Ticket is 64 hex characters; no raw JWT is embedded. | Does not prove storage durability. | **VALID** |
| **Stores ONLY SHA-256 hash** | Hashes ticket with SHA-256, queries storage Map with hash vs raw. | Storage key is SHA-256 digest; raw ticket is not key. | Does not prove storage is distributed. | **VALID** |
| **Single-use replay rejection** | Calls `consumeOriginTicket` twice sequentially. | In-memory record flag `consumedAt` is set; 2nd call fails. | Does not prove atomic CAS across separate processes. | **PARTIAL** |
| **15-minute TTL & touch** | Asserts `expiresAt - now` is 15 mins; touches ticket. | Fixed TTL calculation; non-sliding behavior. | Does not prove clock synchronization. | **VALID** |
| **Distributed cross-instance restoration** | `const sharedClusterMemory = new Map();`<br>`const instanceA = new SharedOriginTicketStorage(sharedClusterMemory);`<br>`const instanceB = new SharedOriginTicketStorage(sharedClusterMemory);` | Two instances sharing the **exact same memory pointer** in one Node process can read the same Map. | **DOES NOT PROVE DISTRIBUTED STATE.** False simulation. Separate runtime processes do not share JavaScript heap memory. | **DECEPTIVE / MOCK ILLUSION** |
| **Process restart survival** | `const persistentStore = new Map();`<br>`const pre = new SharedOriginTicketStorage(persistentStore);`<br>`const post = new SharedOriginTicketStorage(persistentStore);` | Re-instantiating a class with the same alive `Map` preserves data. | **DOES NOT PROVE RESTART SURVIVAL.** When a process terminates, heap is destroyed. | **DECEPTIVE / MOCK ILLUSION** |
| **Atomic race concurrency** | `Promise.all` with 10 calls on same `Map`. | Single-thread V8 synchronous execution handles property assignment without interleaving. | Does not prove multi-process, multi-server concurrency safety. | **PARTIAL** |
| **Caller Authorization (Tests 1–7)** | Mocks caller user and executes Next.js route handler. | Route handler correctly evaluates caller role and returns 403 or 200. | Real Supabase session verification (uses mock). | **VALID** |

> **Key Audit Finding on Test Suite**:  
> The 23/23 contract tests passed green because tests 7 and 8 simulated multi-instance and restart behavior using a single in-memory `Map`. They created an illusion of distributed state that does not exist in production code.

---

## 19. GIT GOVERNANCE RECORD

### Read-Only Git Inspection:
- Current Branch: `preview`
- HEAD Commit: `e79f38944f6e081c1b48621d875c3b1df7ab425e`
- Remote Preview Commit: `e79f38944f6e081c1b48621d875c3b1df7ab425e`
- Relevant Key Commits:
  - `7c41141`: `feat(db): tenantize santri and scope nis per tenant`
  - `a49bd4d`: `feat(auth): implement hardened platform role preview with origin tickets and contract verification`
  - `e79f389`: `docs(audit): add role preview platform git push execution report`

### Recorded Governance Deviation:
- Prior commit `a49bd4d` was authorized for **local commit only**.
- A `git push origin preview` was executed prematurely without explicit push authorization.
- **Status**: Recorded as a governance deviation. Under the strict rules of this audit, **no git reverts, no resets, and no force-pushes were performed**.

---

## 20. PRODUCTION STATE

- **Production Deployed Commit (main)**: `d43aed7` (`feat(ppob): implement PLN token & pulsa purchase with dual-ledger SaaS PG and PPOB Wali wallet refund`).
- **Role Preview Code Present in Production (`main`)**: **`NO`**. (The role preview code exists exclusively on the `preview` branch).
- **Production Role Preview Enabled**: **`NO / UNKNOWN`**. In code, `process.env.ROLE_PREVIEW_ENABLED` and `process.env.ROLE_PREVIEW_PRODUCTION_ALLOWED` default to disabled (`false`).

---

## 21. FINDINGS SUMMARY

| # | Finding Description | Severity | Impact |
|---|---|---|---|
| **F-01** | **Process-Local State in Production**: Origin ticket store is `globalThis.__eeosSharedPreviewTicketStore = new Map()`. | **CRITICAL** | Multi-instance setups fail to restore session when exit hits a different instance. |
| **F-02** | **Zero Restart Survival**: Tickets are lost whenever a container, lambda, or Node process restarts. | **HIGH** | In-flight preview sessions cannot cleanly exit after server restart. |
| **F-03** | **PostgreSQL Adapter is Dead Code**: `PostgresOriginTicketStorage` is not wired up and table `preview_origin_tickets` does not exist in database. | **HIGH** | The presumed durable storage path is non-functional and falls back to memory. |
| **F-04** | **Deceptive Contract Tests for Distributed Behavior**: Contract tests 7 & 8 used shared in-memory `Map` references to assert cross-instance and restart behavior. | **HIGH** | Masked architectural gap during previous verification gate. |
| **F-05** | **Documentation vs Code Inaccuracy (HMAC claim)**: Documentation stated HMAC-SHA256, jti, and timingSafeEqual; code implements unkeyed SHA-256 hash table lookup. | **MEDIUM** | Inaccurate security specification in architecture documentation. |
| **F-06** | **Hardcoded Default Secret**: `ROLE_PREVIEW_SECRET` has fallback `'MaDev_RolePreview_2026!Sec#'`. | **MEDIUM** | Weakness if environment variable is omitted in production. |

---

## 22. FINAL VERDICT

In accordance with Section 23 of the Work Package specification:

> **VERDICT RULE**:  
> `PASS` only if persistent shared storage + cross-instance operation + restart survival + atomic single-use + 15-min TTL + opaque ticket + no raw credential exposure + server-side authorization + correct session restoration + fail-closed behavior are proven.  
> `FAIL` if process-local state OR distributed state not proven OR race condition OR raw credential exposure OR authorization bypass OR fail-open behavior is found.

### VERDICT: **`FAIL`**

**Grounds for Verdict**:
1. Origin Ticket state is strictly **process-local** (`globalThis` `Map`).
2. Distributed state across runtime instances is **not implemented and not proven**.
3. State **does not survive process restart**.
4. Previous verification relied on **mock illusions** within a single process heap.

---

## 23. ARCHITECTURAL RECOMMENDATIONS (FOR PRODUCT OWNER DECISION GATE)

When the Product Owner authorizes remediation in a future Work Package, the following architecture should be implemented:

1. **Option A: Durable PostgreSQL Table (Recommended for Supabase ecosystem)**:
   - Create migration for table `preview_origin_tickets` with columns: `id`, `ticket_hash` (indexed, unique), `origin_user_id`, `origin_user_email`, `origin_role`, `created_at`, `expires_at`, `consumed_at`.
   - Wire `PostgresOriginTicketStorage` as `activeStorage` via Drizzle/Postgres connection pool.
   - Enforce atomic consumption via `UPDATE preview_origin_tickets SET consumed_at = now() WHERE ticket_hash = $1 AND consumed_at IS NULL AND expires_at > now() RETURNING *;`.
2. **Option B: Distributed Key-Value Store (Redis / Upstash / Vercel KV)**:
   - Store tickets as `preview:origin_ticket:{ticket_hash}` with automatic Redis 15-minute TTL (`EX 900`).
   - Use atomic `GETDEL` or Lua script for single-use consumption.
3. **Integration Contract Tests**:
   - Write integration tests against actual database or Redis container, not shared in-memory `Map` instances.
