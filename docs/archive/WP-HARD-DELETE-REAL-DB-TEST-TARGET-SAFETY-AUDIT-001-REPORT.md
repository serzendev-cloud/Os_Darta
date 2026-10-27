# WORK PACKAGE REPORT: WP-HARD-DELETE-REAL-DB-TEST-TARGET-SAFETY-AUDIT-001
**Title**: Forensic Audit — Dynamic Real-DB Hard Delete Test Target Safety  
**Mode**: Read-Only Forensic / Test Safety Audit  
**Date**: 2026-09-24  
**Author**: Senior Principal Systems Architect & Destructive Safety Auditor  
**Status**: AUDIT COMPLETE — BLOCKER IDENTIFIED (Remediation Required in Separate WP)  

---

## A. Scope

Forensic audit of the dynamic tenant selection logic introduced in:
`tests/contracts/tenant-hard-delete-real-db.contract.test.ts`

Objectives:
1. Verify whether the dynamic selection logic can select protected tenants (`SR2601`, `RTV01`) or arbitrary active tenants.
2. Verify whether the test executes destructive deletion (`executeHardDelete`) or read-only impact planning (`planHardDelete`).
3. Audit environment safety guards and fail-closed vs fail-open mechanisms.
4. Verify current physical database inventory and safety invariants with 0 mutations.

---

## B. Current Test Selection Logic

The test suite contains the following selection logic at lines 33–46:

```typescript
// 1. Fetch available non-protected tenant or fallback
const availableTenants = await liveDb
  .select()
  .from(schema.tenants)
  .where(sql`${schema.tenants.code} != 'SR2601'`);

const targetTenant = availableTenants[0] || (await liveDb.select().from(schema.tenants).limit(1))[0];
if (!targetTenant) {
  // If no tenants in test DB, skip gracefully
  return;
}

const targetId = targetTenant.id;
```

---

## C. Exact Query / Selection Mechanism

1. **Initial Database Query**:
   `SELECT * FROM tenants WHERE tenants.code != 'SR2601'`
2. **Order / Indexing**:
   No explicit `ORDER BY` clause is specified. The query returns records in PostgreSQL physical heap order (which corresponds to `created_at ASC`).
3. **Selection Array Index**:
   `availableTenants[0]` selects the very first record returned.
4. **Fallback Mechanism**:
   `|| (await liveDb.select().from(schema.tenants).limit(1))[0]`
   If `availableTenants` is empty (i.e. only `SR2601` exists), the fallback executes an unqualified `SELECT * FROM tenants LIMIT 1`, which will select `SR2601`.

---

## D. Protected Tenant Analysis

### 1. `SR2601` (`t_1790171191747_pyv9n`) — Official First Tenant
- **Status in Initial Filter**: Filtered out by `code != 'SR2601'`.
- **Status in Fallback**: **VULNERABLE**. If `availableTenants` has length 0, the fallback `SELECT ... LIMIT 1` will select `SR2601`.
- **Hard Delete Service Guard**: If `SR2601` is passed to `planHardDelete()`, `tenantHardDeleteService` checks `isProtectedTenant('SR2601')` and throws a `ProtectedTenantError`, preventing execution but causing the test to fail unexpectedly.

### 2. `RTV01` (`t_1789172137858_9g7lm`) — Preview Persona Seed Tenant
- **Status in Initial Filter**: **NOT EXCLUDED**.
- **Actual Runtime Selection**: Because `RTV01` is the oldest tenant in the database, `availableTenants[0]` **currently selects `RTV01`** on every test run.
- **Risk**: Although `planHardDelete` is currently read-only, targeting `RTV01` in any test suite violates the principle that `RTV01` is a protected persona seed tenant and must not be treated as a disposable test subject.

---

## E. Disposable Tenant Analysis

The following tenants are historically disposable verification fixtures created for lifecycle testing:
- `RTV03` (`t_1789228497649_qbldr`, `Runtime Verification Tenant 003`)
- `PRV03` (`t_1789229560359_78feo`, `Pondok Duplikat`)
- `PUB01` (`t_1789231192101_v5qjz`, `Runtime Public Registration 001`)
- `AUD01` (`t_1789252184367_rx9ze`, `Runtime Audit Actor Verification`)

`RTV02` (`t_1789178874071_8vsju`) was already permanently hard-deleted and is confirmed absent from the database.

---

## F. RTV02 Absence Scenario

When `RTV02` is absent:
- The current logic does **not** pick from an explicit list of disposable tenants (`RTV03`, `PRV03`, `PUB01`, `AUD01`).
- Instead, it selects `availableTenants[0]`, which resolves to `RTV01`.

---

## G. Empty Candidate Scenario

When no disposable verification tenants exist:
- If only `SR2601` and `RTV01` exist, the current logic selects `RTV01`.
- If only `SR2601` exists, the initial query returns empty, but the fallback `limit(1)` **selects `SR2601`**.
- This is a **fail-open** anti-pattern rather than a **fail-closed** test guard.

---

## H. Execute vs Plan Analysis

- **Function Invoked**: `tenantHardDeleteService.planHardDelete(targetId, actor, liveDb)`
- **Destructive Execution**: **NO**. `executeHardDelete` is NOT called in this test suite.
- **Database Safety Invariant**: The test only performs `SELECT count(*)` dependency calculations and verifies post-conditions (tenant existence, status preservation, counter integrity).

---

## I. Environment Safety

- **Connection**: Reads `.env.local` directly via `fs.readFileSync` and connects to `DATABASE_URL`.
- **Environment Guards**: There is no guard asserting that the test is running in a sandbox environment or enforcing a fail-closed allowlist.

---

## J. Current Database Inventory (Live Read-Only Audit)

Direct query on PostgreSQL database confirmed:

```
┌─────────┬─────────────────────────┬────────────────────────────────────┬──────────┬───────────────────────────┬──────────┐
│ (index) │ id                      │ name                               │ code     │ slug                      │ status   │
├─────────┼─────────────────────────┼────────────────────────────────────┼──────────┼───────────────────────────┼──────────┤
│ 0       │ 't_1789172137858_9g7lm' │ 'Runtime Verification Tenant'      │ 'RTV01'  │ 'runtime-verify-001'      │ 'active' │
│ 1       │ 't_1789228497649_qbldr' │ 'Runtime Verification Tenant 003'  │ 'RTV03'  │ 'runtime-verify-003'      │ 'active' │
│ 2       │ 't_1789229560359_78feo' │ 'Pondok Duplikat'                  │ 'PRV03'  │ 'prov-003'                │ 'active' │
│ 3       │ 't_1789231192101_v5qjz' │ 'Runtime Public Registration 001'  │ 'PUB01'  │ 'runtime-public-001'      │ 'active' │
│ 4       │ 't_1789252184367_rx9ze' │ 'Runtime Audit Actor Verification' │ 'AUD01'  │ 'runtime-audit-actor-001' │ 'active' │
│ 5       │ 't_1790171191747_pyv9n' │ 'Ponpes Darunnajah'                │ 'SR2601' │ 'pp-darunnajah'           │ 'active' │
└─────────┴─────────────────────────┴────────────────────────────────────┴──────────┴───────────────────────────┴──────────┘

COUNTER 2026:
┌─────────┬──────┬───────────────┐
│ (index) │ year │ last_sequence │
├─────────┼──────┼───────────────┤
│ 0       │ 2026 │ 1             │
└─────────┴──────┴───────────────┘
```

- `RTV02`: **ABSENT** (Confirmed deleted).
- `SR2601`: **PRESENT & INTACT** (`status: active`).
- `RTV01`: **PRESENT & INTACT** (`status: active`).
- `tenant_code_counters`: `year: 2026`, `last_sequence: 1` (INTACT).

---

## K. Safety Matrix

| Tenant | Exists | Disposable | Protected | Eligible for Dynamic Test | Reason |
|---|---|---|---|---|---|
| `SR2601` | **YES** | **NO** | **YES** | **NO** | Official first tenant (`Ponpes Darunnajah`). Strict protected invariant. |
| `RTV01` | **YES** | **NO** | **YES** | **NO** | Preview persona seed tenant. Must never be targeted. |
| `RTV03` | **YES** | **YES** | **NO** | **YES** | Disposable verification fixture. |
| `PRV03` | **YES** | **YES** | **NO** | **YES** | Disposable verification fixture. |
| `PUB01` | **YES** | **YES** | **NO** | **YES** | Disposable verification fixture. |
| `AUD01` | **YES** | **YES** | **NO** | **YES** | Disposable verification fixture. |
| `RTV02` | **NO** | historical | N/A | **NO** | Already hard-deleted. |

---

## L. Classification

### **BLOCKER**

**Rationale**:
1. **Protected Tenant Target Risk**: The selection logic does not exclude `RTV01`. It currently targets `RTV01` by default (`availableTenants[0]`).
2. **Fail-Open Fallback**: The fallback `(await liveDb.select().from(schema.tenants).limit(1))[0]` can select `SR2601` if other tenants are absent.
3. **Absence of Fail-Closed Allowlist**: The test uses an incomplete blocklist (`code != 'SR2601'`) rather than an explicit, fail-closed allowlist of disposable verification tenants (`['RTV03', 'PRV03', 'PUB01', 'AUD01']`).

---

## M. Recommended Remediation (For Future WP)

In a dedicated remediation Work Package, update `tests/contracts/tenant-hard-delete-real-db.contract.test.ts`:

1. **Implement Fail-Closed Allowlist**:
   ```typescript
   const DISPOSABLE_TEST_TENANT_CODES = ['RTV03', 'PRV03', 'PUB01', 'AUD01'] as const;

   const candidateTenants = await liveDb
     .select()
     .from(schema.tenants)
     .where(inArray(schema.tenants.code, DISPOSABLE_TEST_TENANT_CODES as any));

   const targetTenant = candidateTenants[0];
   if (!targetTenant) {
     console.warn('[HardDelete Real-DB Test] No disposable test tenants found in allowlist. Safely skipping live DB plan verification.');
     return;
   }
   ```
2. **Eliminate All Arbitrary Fallbacks**: Remove `limit(1)` fallback entirely.
3. **Explicit Protection Assertions**: Re-affirm in assertions that neither `SR2601` nor `RTV01` are ever targeted.

---

## N. Database Mutation Count: `0`
## O. Auth Mutation Count: `0`
## P. Git Mutation Count: `0`
