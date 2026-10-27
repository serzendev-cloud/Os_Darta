# WP-AUDIT-PERSISTENCE-REMEDIATION-001

## 1. Objective
The objective of this Work Package is to eliminate the server-side in-memory `demoDb` fallback for audit logging and establish a canonical, hardened persistence path from `auditLogService` to PostgreSQL `public.audit_logs` using the project's Drizzle ORM architecture. This addresses the forensic finding from `WP-TENANT-PROVISION-002-RUNTIME-FORENSIC-001` where audit logs during tenant provisioning failed to reach PostgreSQL.

## 2. Pre-Implementation Architecture
Prior to this remediation, audit logging was structured as:
```
auditLogService.log()
       ↓
createTenantService('auditLogs')
       ↓
create-tenant-service.ts
       ↓
if (isDemoMode() || typeof window === 'undefined')
       ↓
demoDb.create('auditLogs', payload)
       ↓
Node.js Process Memory (Discarded on restart / No PostgreSQL persistence)
```
Whenever server-side components (such as `tenantProvisioningService` or API route handlers) invoked `auditLogService.log()`, `typeof window === 'undefined'` evaluated to `true`, instantly and silently diverting production audit records away from the PostgreSQL database into the ephemeral in-memory `demoDb`.

## 3. Root Cause Confirmed
1. **Factory Inheritance Flaw**: `auditLogService` inherited from `createTenantService('auditLogs')`.
2. **Server-Side Fallback Misdirection**: In `src/lib/db/services/create-tenant-service.ts` line 36:
   ```ts
   if (isDemoMode() || typeof window === 'undefined') {
     return demoDb.create(collectionName, payload);
   }
   ```
   The condition `typeof window === 'undefined'` was designed as a prototype fallback for server-side rendering, but when executed in production server environments (Node.js/Next.js API routes), it completely bypassed PostgreSQL and redirected all writes to `demoDb`.
3. **Absence of Canonical Drizzle Audit Repository**: There was no dedicated Drizzle repository interface for `public.audit_logs`.

## 4. Implementation Performed
1. **Created Dedicated Drizzle Audit Repository**:
   Created [`src/lib/db/repositories/audit-repository.ts`](file:///e:/Projects/Os_Darta/src/lib/db/repositories/audit-repository.ts):
   - Persists directly to `public.audit_logs` using Drizzle ORM (`db.insert(auditLogs)`).
   - Supports optional transactional client (`txClient`) propagation.
   - Maps domain parameters cleanly to table columns: `id`, `tenant_id`, `action`, `user`, `user_id`, `user_role`, `details`, `target_entity`, `target_id`, `timestamp`.
   - Includes recursive credential & secret redaction engine (`sanitizeAuditData`).
   - Implements query retrieval methods (`list`, `getByActor`, `getById`).

2. **Decoupled and Refactored `auditLogService`**:
   Updated [`src/lib/db/services/auditLog.ts`](file:///e:/Projects/Os_Darta/src/lib/db/services/auditLog.ts):
   - Completely decoupled from `createTenantService`.
   - In production server runtime, executes canonical persistence via `auditRepository`.
   - Protects Next.js client component bundles by lazy-loading the server Drizzle repository only when not in a browser (`isBrowser` boundary).
   - Preserves offline demo mode compatibility (`isDemoMode()` -> `demoDb`).
   - Enforces audit log immutability and append-only constraints (`update` and `delete` throw in production).
   - Retains backward-compatible interfaces (`log`, `create`, `list`, `getByActor`, `get`, `subscribe`, `isDemo`).

3. **Propagated Transaction and Tenant Context in Tenant Provisioning Service**:
   Updated [`src/modules/saas/services/tenant-provisioning-service.ts`](file:///e:/Projects/Os_Darta/src/modules/saas/services/tenant-provisioning-service.ts):
   - In Step 6 (Audit Logging), passed `{ tx: dbInstance, tenantId }` to ensure caller-injected database clients and tenant identifiers are cleanly forwarded to `auditLogService.log()`.

4. **Created Contract Test Suite**:
   Created [`tests/contracts/audit-persistence.contract.test.ts`](file:///e:/Projects/Os_Darta/tests/contracts/audit-persistence.contract.test.ts) covering production persistence, secret redaction, demo mode fallback, transaction client propagation, and immutability.

## 5. Final Audit Persistence Architecture
```
Server Runtime (Node.js / Next.js Route / Provisioning Service)
       ↓
auditLogService.log(entry, { tx?, tenantId? })
       ↓
sanitizeAuditData(entry) [Zero-Secret Filter]
       ↓
auditRepository.create(cleanEntry, client)
       ↓
Drizzle ORM (schema.auditLogs)
       ↓
PostgreSQL public.audit_logs
```
In browser or demo environments (`NEXT_PUBLIC_DEMO_MODE=true`), calls safely route to `demoDb` without pulling `postgres` into the client browser bundle.

## 6. Transaction Handling
- **Tenant Provisioning Transaction Flow**:
  Tenant provisioning creates core database entities atomically inside `withTenantTransaction(async (tx) => { ... })`.
  In accordance with the current architecture, Step 6 (Audit Logging) executes **after** the core provisioning transaction commits successfully (Option B: post-provisioning audit logging).
- **Reasoning**:
  1. The audit event records the verified success of tenant provisioning. If entity provisioning fails and rolls back, the tenant was never provisioned.
  2. If the audit insert were to fail in an edge case, provisioning has already succeeded and the tenant was created; throwing a transaction rollback at that point would orphan third-party states.
- **Transaction Propagation Support**:
  `auditRepository.create(entry, txClient)` and `auditLogService.log(entry, { tx })` natively accept a transaction client (`txClient`). If a transaction client is provided, `auditRepository` executes on that transaction client rather than opening a standalone connection.

## 7. Credential/Secret Safety
- **Zero-Secret Defense-in-Depth**:
  1. `tenantProvisioningService` explicitly restricts its audit metadata to non-sensitive fields:
     `{ tenantName, tenantSlug, ownerEmail, plan, authUserId, timestamp }`.
  2. In addition, `auditRepository` implements an automated recursive sanitizer (`sanitizeAuditData`) that scans all keys in `changes` and `metadata`.
  3. Any key matching or containing sensitive keywords (`password`, `temporarypassword`, `token`, `secret`, `apikey`, `cookie`, `servicerole`, `databaseurl`) is replaced with `[REDACTED]`.
  4. Tested and verified in `tests/contracts/audit-persistence.contract.test.ts`.

## 8. demoDb Dependency After Remediation
- Production server audit logging now has **ZERO** dependency on `demoDb`.
- All production server audit events persist directly to PostgreSQL `public.audit_logs`.
- `demoDb` is retained strictly for offline development / test fixtures when `NEXT_PUBLIC_DEMO_MODE=true` or in client mock scenarios.

## 9. createTenantService Blast Radius
A comprehensive, read-only inventory of all services using `createTenantService` was conducted:

| # | Service Name | Source File | Usage Classification | Server Fallback Risk |
|---|--------------|-------------|----------------------|----------------------|
| 1 | `academicLedgerRecordService` | `academic-ledger.ts` | **BOTH** (Server `/api/academic/ledger` + Client Store) | YES (on server route) |
| 2 | `academicTranscriptService` | `academic-ledger.ts` | **BOTH** (Server `/api/academic/ledger` + Client Store) | YES (on server route) |
| 3 | `academicYearService` | `academic-workspace.ts` | **UNKNOWN** (Test only) | Unused in prod routes |
| 4 | `academicTermService` | `academic-workspace.ts` | **UNKNOWN** (Test only) | Unused in prod routes |
| 5 | `alumniService` | `alumni.ts` | **CLIENT ONLY** (`santri/page.tsx`) | No |
| 6 | `appConfigService` | `appConfig.ts` | **BOTH** (`loader.ts` + `SystemTab.tsx`) | Potential (if called in SSR) |
| 7 | `asramaService` | `asrama.ts` | **UNKNOWN** (No active caller) | No |
| 8 | `governanceCaseService` | `governanceCase.ts` | **CLIENT ONLY** (`governance/page.tsx`) | No |
| 9 | `guruService` | `guru.ts` | **CLIENT ONLY** (`guru/page.tsx`) | No |
| 10 | `healthPermissionService` | `healthPermission.ts` | **CLIENT ONLY** (`IzinBerobatModal.tsx`, `izin-berobat/page.tsx`) | No |
| 11 | `healthVisitService` | `healthVisit.ts` | **CLIENT ONLY** (`CatatUKSModal.tsx`, `uks/page.tsx`) | No |
| 12 | `hukumanService` | `hukuman.ts` | **CLIENT ONLY** (`hukuman/page.tsx`, `governance/page.tsx`) | No |
| 13 | `kamarService` | `kamar.ts` | **UNKNOWN** (No active caller) | No |
| 14 | `kelasService` | `kelas.ts` | **CLIENT ONLY** (`CurriculumConfigClient.tsx`, `kelas/page.tsx`) | No |
| 15 | `mapelService` | `mapel.ts` | **CLIENT ONLY** (`mapel/page.tsx`) | No |
| 16 | `masterHukumanService` | `masterHukuman.ts` | **CLIENT ONLY** (`master-pelanggaran/page.tsx`, `governance/page.tsx`) | No |
| 17 | `masterJenjangService` | `masterJenjang.ts` | **CLIENT ONLY** (`struktur-akademik/page.tsx`, `CurriculumConfigClient.tsx`) | No |
| 18 | `masterPelanggaranService` | `masterPelanggaran.ts` | **CLIENT ONLY** (`master-pelanggaran/page.tsx`) | No |
| 19 | `masterTingkatService` | `masterTingkat.ts` | **CLIENT ONLY** (`struktur-akademik/page.tsx`, `CurriculumConfigClient.tsx`) | No |
| 20 | `notificationsService` | `notifications.ts` | **CLIENT ONLY** (`topbar.tsx`, `notifikasi/page.tsx`) | No |
| 21 | `pelanggaranService` | `pelanggaran.ts` | **CLIENT ONLY** (`governance/page.tsx`) | No |
| 22 | `questService` | `quest.ts` | **CLIENT ONLY** (`quest/page.tsx`) | No |
| 23 | `santriService` | `santri.ts` | **CLIENT ONLY** (`santri/page.tsx`, `asrama/page.tsx`, `quest/page.tsx`) | No |
| 24 | `teacherAssignmentService` | `teacherAssignment.ts` | **CLIENT ONLY** (`distribusi-guru/page.tsx`) | No |
| 25 | `tolerancePolicyService` | `tolerancePolicy.ts` | **CLIENT ONLY** (`master-pelanggaran/page.tsx`) | No |
| 26 | `usersService` | `users.ts` | **UNKNOWN** (No active caller) | No |

- **TOTAL `createTenantService` consumers**: 26 domain services across 24 files.
- **Potential server-side `demoDb` consumers**: 3 services (`academicLedgerRecordService`, `academicTranscriptService`, `appConfigService`).
- **Audit-related consumers**: 0 (eliminated from `createTenantService`; now canonical Drizzle repository).

## 10. Tests
- Focused Vitest contract tests executed:
  - `tests/contracts/audit-persistence.contract.test.ts`: **8 passed** (100%)
  - `tests/contracts/tenant-provisioning.contract.test.ts`: **12 passed** (100%)
  - `tests/contracts/company-contact.security.test.ts`: **13 passed** (100%)
- Total contract tests passing: **33 / 33 passed**.

## 11. TypeScript
- Executed `npx tsc --noEmit`.
- Result: **0 errors** (Exit Code 0).

## 12. Lint
- Executed `npx eslint` on changed and created files (`audit-repository.ts`, `auditLog.ts`, `tenant-provisioning-service.ts`, `audit-persistence.contract.test.ts`).
- Result: **0 errors, 0 warnings** (Exit Code 0).

## 13. Build
- Executed Next.js 16 Turbopack production build (`npm run build`).
- Result: **Compiled successfully in 7.5s, 80/80 static and dynamic pages generated, Exit Code 0**.

## 14. Files Changed
1. `src/lib/db/repositories/audit-repository.ts` [NEW]
   - Dedicated Drizzle repository for `public.audit_logs`.
2. `src/lib/db/services/auditLog.ts` [MODIFY]
   - Decoupled from `createTenantService`, connected to `auditRepository` for server runtime.
3. `src/modules/saas/services/tenant-provisioning-service.ts` [MODIFY]
   - Propagated `dbInstance` and `tenantId` into `auditLogService.log()`.
4. `tests/contracts/audit-persistence.contract.test.ts` [NEW]
   - Contract test suite proving canonical persistence, secret sanitization, and transaction propagation.

## 15. Database Changes
- **NONE**. No DDL migrations or schema alterations were performed.
- The existing canonical schema and reconciled columns (`tenant_id`, `audit_logs_tenant_idx`) from `WP-DB-RECON-CORE-001` were fully leveraged.

## 16. Security Assessment
- **Zero-Secret Compliance**: Guaranteed. Plaintext passwords, temporary passwords, API keys, tokens, and cookies are blocked by `sanitizeAuditData`.
- **SQL Injection Safety**: Handled exclusively via Drizzle ORM parameterized queries.
- **Client Security Boundary**: Server database connection (`postgres`) is strictly isolated and never bundled into client browser chunks.

## 17. Remaining Deferred Issues
1. **Broader `createTenantService` Server-Side Remediation**:
   As documented in Section 9, 3 services (`academicLedgerRecordService`, `academicTranscriptService`, `appConfigService`) are used in server routes and still use `createTenantService`. They should be refactored to dedicated Drizzle repositories in future domain-specific WPs.
2. **Controlled Live Provisioning Test**:
   The live database tenant provisioning end-to-end verification remains to be executed once authorized.

## 18. Git Governance
- Recorded git status:
  - Branch: `preview`
  - Base commit: `809aae5 feat(saas): implement tenant provisioning`
  - Uncommitted changes: only the 4 files within scope.
  - Zero commits, zero pushes, zero deployments performed.

## 19. Final Verdict
**PASS — AUDIT PERSISTENCE REMEDIATED TO CANONICAL POSTGRESQL DRIZZLE ARCHITECTURE**.
All acceptance criteria met. Ready for Architecture Review.
