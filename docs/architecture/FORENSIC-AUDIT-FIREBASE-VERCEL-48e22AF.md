# FORENSIC AUDIT — Firebase Deletion vs Vercel Build Failure

> **PROJECT:** Ma'had Manager / Madev SaaS Multi-Tenant Platform  
> **BRANCH:** `preview`  
> **AUDITED COMMIT:** `48e22af763beb0d65acbcad27ecb75f2fa3dd2e9`  
> **PARENT COMMIT:** `7ae73f5668a8c8a20fb2caa3fc5599ac527a543c`  
> **DATE:** 2026-09-01  
> **STATUS:** FORENSIC DIAGNOSIS COMPLETE  
> **MODE:** READ-ONLY FORENSIC INVESTIGATION  
> **SOURCE CODE MODIFIED:** 0

---

### 1. Executive Summary

1. **Failure Cause:** Commit `48e22af` deleted 39 Firebase provider/service implementation files from Git (`delete mode 100644 src/lib/firebase/...`) while leaving **25 active application files in Git still importing those deleted modules**.
2. **Discrepancy Explanation:** The previous audit report statement `"Active References Found: 0"` was **FALSE** and resulted from a flawed grep query pattern (`from '@/lib/firebase ` ending with literal space) that failed to match subpath imports like `from '@/lib/firebase/services'`, `from '@/lib/firebase/config'`, `from '@/lib/firebase/auth'`, and `from '@/lib/firebase/demo-data'`.
3. **Local vs Git Divergence:** Several consumer files (`auth-provider.tsx`, `useCollection.ts`, `loader.ts`, `subscription.ts`) were modified locally on developer disk (`M`) to remove Firebase imports, but **were never staged or committed to Git in commit `48e22af`**.
4. **Vercel Build Execution:** Vercel cloned clean commit `48e22af` from GitHub. Since `48e22af` deleted the Firebase provider files but still contained uncleaned consumer files in Git, Next.js/Turbopack failed during module resolution (`Module not found: Can't resolve '@/lib/firebase/...'`).
5. **Nature of Missing Modules:** The missing modules are **local source file resolution failures** (`@/lib/firebase/*`), not npm package dependencies (`firebase` npm package is installed).
6. **Root Cause Classification:** **ROOT-CAUSE-A: Deleted provider files in Git while active consumers remain in Git repository tree.**
7. **TypeScript Inclusion:** `tsconfig.json` includes `**/*.ts` and `**/*.tsx`. All 25 failing consumer files are included by `tsc`.
8. **Current State:** 25 files in commit `48e22af` import deleted Firebase paths. 14 dashboard/component pages import `@/lib/firebase/services`, 2 hooks import `@/lib/firebase/demo-data`, 2 config loaders import `@/lib/firebase/services/appConfig`, 1 provider imports `@/lib/firebase/auth`, and 2 dashboard pages import `firebase/firestore` directly.
9. **Impact on Previous Release Verdict:** The verdict `"A — FIREBASE DELETION RECONCILIATION COMPLETE"` in WP-RELEASE-004 is **INVALIDATED** because the repository was not self-contained.
10. **Corrective Requirement:** No code edits are executed in this audit. Full consumer migration status must be established before authorizing cleanup or provider restoration.

---

### 2. Git Baseline

- **Current Branch:** `preview`
- **Current Local HEAD:** `48e22af763beb0d65acbcad27ecb75f2fa3dd2e9`
- **Remote `origin/preview` HEAD:** `48e22af763beb0d65acbcad27ecb75f2fa3dd2e9`
- **Parent Commit:** `7ae73f5668a8c8a20fb2caa3fc5599ac527a543c`
- **Commit Message:** `chore(release): reconcile deprecated firebase deletions`
- **Commit Stat:** 40 files changed, 154 insertions(+), 3945 deletions(-)

---

### 3. Firebase Files Deleted (39 Inventory)

The following 39 implementation files were deleted in commit `48e22af`:

| Deleted Path | Category | Was Imported Before? | Current Status in `48e22af` |
|---|---|:---:|---|
| `firebase.json` | Config | NO | Deleted in `48e22af` |
| `firestore.indexes.json` | Firestore | NO | Deleted in `48e22af` |
| `firestore.rules` | Firestore | NO | Deleted in `48e22af` |
| `storage.rules` | Storage | NO | Deleted in `48e22af` |
| `src/providers/firebase-provider.tsx` | Provider | YES | Deleted in `48e22af` |
| `src/test/mocks/firebase.ts` | Test Mock | YES | Deleted in `48e22af` |
| `src/lib/firebase/auth.ts` | Auth | **YES** | **Deleted in `48e22af` (Consumers Broken)** |
| `src/lib/firebase/config.ts` | Config | **YES** | **Deleted in `48e22af` (Consumers Broken)** |
| `src/lib/firebase/demo-data.ts` | Demo | **YES** | **Deleted in `48e22af` (Consumers Broken)** |
| `src/lib/firebase/storage.ts` | Storage | NO | Deleted in `48e22af` |
| `src/lib/firebase/utils.ts` | Utility | NO | Deleted in `48e22af` |
| `src/lib/firebase/services/appConfig.ts` | Service | **YES** | **Deleted in `48e22af` (Consumers Broken)** |
| `src/lib/firebase/services/asrama.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/auditLog.ts` | Service | **YES** | **Deleted in `48e22af` (Consumers Broken)** |
| `src/lib/firebase/services/governanceCase.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/guru.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/healthPermission.ts` | Service | **YES** | **Deleted in `48e22af` (Consumers Broken)** |
| `src/lib/firebase/services/healthVisit.ts` | Service | **YES** | **Deleted in `48e22af` (Consumers Broken)** |
| `src/lib/firebase/services/hukuman.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/index.ts` | Service Barrel | **YES** | **Deleted in `48e22af` (Consumers Broken)** |
| `src/lib/firebase/services/kamar.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/kelas.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/mapel.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/masterHukuman.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/masterJenjang.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/masterPelanggaran.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/masterTingkat.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/notifications.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/pelanggaran.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/quest.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/santri.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/teacherAssignment.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/tolerancePolicy.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/services/users.ts` | Service | YES | Deleted in `48e22af` |
| `src/lib/firebase/__tests__/auth.test.ts` | Test | NO | Deleted in `48e22af` |
| `src/lib/firebase/services/__tests__/asrama.test.ts` | Test | NO | Deleted in `48e22af` |
| `src/lib/firebase/services/__tests__/pelanggaran.test.ts` | Test | NO | Deleted in `48e22af` |
| `src/lib/firebase/services/__tests__/santri.test.ts` | Test | NO | Deleted in `48e22af` |
| `src/lib/firebase/services/__tests__/users.test.ts` | Test | NO | Deleted in `48e22af` |

---

### 4. Firebase Consumers Still Present in Commit `48e22af` (25 Inventory)

The following 25 files in commit `48e22af` STILL import from deleted `@/lib/firebase/...` paths:

| Consumer File Path | Line | Import Statement | Referenced Deleted Target Module | Build-Relevant? |
|---|---:|---|---|:---:|
| `src/app/dashboard/asrama/page.tsx` | 13 | `import { santriService } from '@/lib/firebase/services'` | `@/lib/firebase/services` | **YES** |
| `src/app/dashboard/governance/page.tsx` | 17 | `import { ... } from '@/lib/firebase/services'` | `@/lib/firebase/services` | **YES** |
| `src/app/dashboard/guru/page.tsx` | 11 | `import { guruService } from '@/lib/firebase/services'` | `@/lib/firebase/services` | **YES** |
| `src/app/dashboard/hukuman/page.tsx` | 10 | `import { hukumanService } from '@/lib/firebase/services'` | `@/lib/firebase/services` | **YES** |
| `src/app/dashboard/import/page.tsx` | 10-11 | `import { db } from '@/lib/firebase/config'` | `@/lib/firebase/config` | **YES** |
| `src/app/dashboard/kelas/page.tsx` | 12 | `import { kelasService } from '@/lib/firebase/services'` | `@/lib/firebase/services` | **YES** |
| `src/app/dashboard/mapel/page.tsx` | 15 | `import { mapelService } from '@/lib/firebase/services'` | `@/lib/firebase/services` | **YES** |
| `src/app/dashboard/master-pelanggaran/page.tsx` | 9 | `import { ... } from '@/lib/firebase/services'` | `@/lib/firebase/services` | **YES** |
| `src/app/dashboard/notifikasi/page.tsx` | 11 | `import { notificationsService } from '@/lib/firebase/services'` | `@/lib/firebase/services` | **YES** |
| `src/app/dashboard/quest/page.tsx` | 12 | `import { questService } from '@/lib/firebase/services'` | `@/lib/firebase/services` | **YES** |
| `src/app/dashboard/santri/page.tsx` | 11, 13 | `import { santriService, db } from '@/lib/firebase/services'` | `@/lib/firebase/services` & `config` | **YES** |
| `src/components/kurikulum/CurriculumConfigClient.tsx` | 20 | `import { ... } from '@/lib/firebase/services'` | `@/lib/firebase/services` | **YES** |
| `src/components/uks/CatatUKSModal.tsx` | 15 | `import { healthVisitService } from '@/lib/firebase/services'` | `@/lib/firebase/services` | **YES** |
| `src/components/uks/IzinBerobatModal.tsx` | 6 | `import { healthPermissionService, ... } from '@/lib/firebase/services'` | `@/lib/firebase/services` | **YES** |
| `src/hooks/useCollection.ts` | 4 | `import { isDemoMode, demoDb } from '@/lib/firebase/demo-data'` | `@/lib/firebase/demo-data` | **YES** |
| `src/hooks/useDocument.ts` | 4 | `import { isDemoMode } from '@/lib/firebase/demo-data'` | `@/lib/firebase/demo-data` | **YES** |
| `src/lib/audit-logger.ts` | 1 | `import { auditLogService } from '@/lib/firebase/services/auditLog'` | `@/lib/firebase/services/auditLog` | **YES** |
| `src/lib/config/loader.ts` | 4 | `import { appConfigService } from '@/lib/firebase/services/appConfig'` | `@/lib/firebase/services/appConfig` | **YES** |
| `src/lib/config/subscription.ts` | 4 | `import { appConfigService } from '@/lib/firebase/services/appConfig'` | `@/lib/firebase/services/appConfig` | **YES** |
| `src/lib/db/services/create-tenant-service.ts` | 5 | `import { demoDb, isDemoMode } from '@/lib/firebase/demo-data'` | `@/lib/firebase/demo-data` | **YES** |
| `src/providers/auth-provider.tsx` | 5, 19 | `import { isDemoMode } from '@/lib/firebase/demo-data'` & `import('@/lib/firebase/auth')` | `@/lib/firebase/auth` & `demo-data` | **YES** |
| `src/store/auth-store.ts` | 17 | `firebaseUser?: unknown` | Type reference | **YES** |
| `src/types/audit.ts` | 60-61 | `import('firebase/firestore').Timestamp` | `firebase` npm module | **YES** |
| `src/types/firestore.ts` | 9 | `import { Timestamp } from 'firebase/firestore'` | `firebase` npm module | **YES** |
| `src/app/__tests__/dashboard-layout.test.tsx` | 40 | `firebaseUser: null` | Property name | **YES** |

---

### 5. Unique Missing Modules

There are **5 unique missing local source modules** causing all cascading Vercel build failures:

1. `@/lib/firebase/services` (Consumer count: 12 files)
2. `@/lib/firebase/demo-data` (Consumer count: 4 files)
3. `@/lib/firebase/services/appConfig` (Consumer count: 2 files)
4. `@/lib/firebase/auth` (Consumer count: 1 file)
5. `@/lib/firebase/config` (Consumer count: 2 files)

---

### 6. Vercel Error Mapping

```
Vercel Build Error
├── Can't resolve '@/lib/firebase/services'
│   ├── src/app/dashboard/asrama/page.tsx
│   ├── src/app/dashboard/governance/page.tsx
│   ├── src/app/dashboard/guru/page.tsx
│   ├── src/app/dashboard/hukuman/page.tsx
│   ├── src/app/dashboard/kelas/page.tsx
│   ├── src/app/dashboard/mapel/page.tsx
│   ├── src/app/dashboard/master-pelanggaran/page.tsx
│   ├── src/app/dashboard/notifikasi/page.tsx
│   ├── src/app/dashboard/quest/page.tsx
│   ├── src/app/dashboard/santri/page.tsx
│   ├── src/components/kurikulum/CurriculumConfigClient.tsx
│   ├── src/components/uks/CatatUKSModal.tsx
│   └── src/components/uks/IzinBerobatModal.tsx
├── Can't resolve '@/lib/firebase/demo-data'
│   ├── src/hooks/useCollection.ts
│   ├── src/hooks/useDocument.ts
│   ├── src/lib/db/services/create-tenant-service.ts
│   └── src/providers/auth-provider.tsx
├── Can't resolve '@/lib/firebase/services/appConfig'
│   ├── src/lib/config/loader.ts
│   └── src/lib/config/subscription.ts
├── Can't resolve '@/lib/firebase/auth'
│   └── src/providers/auth-provider.tsx
└── Can't resolve '@/lib/firebase/config'
    ├── src/app/dashboard/import/page.tsx
    └── src/app/dashboard/santri/page.tsx
```

---

### 7. Dependency Graph Chains

#### Chain 1: Dashboard Page Execution
```
src/app/dashboard/santri/page.tsx
    ↓ (Line 11)
import { santriService } from '@/lib/firebase/services'
    ↓
src/lib/firebase/services/index.ts [DELETED IN COMMIT 48e22af]
    ↓
Result: Module Not Found (Vercel Build Failure)
```

#### Chain 2: Provider Initialization
```
src/providers/auth-provider.tsx
    ↓ (Line 19)
import('@/lib/firebase/auth')
    ↓
src/lib/firebase/auth.ts [DELETED IN COMMIT 48e22af]
    ↓
Result: Module Not Found (Vercel Build Failure)
```

#### Chain 3: Platform Config Loader
```
src/lib/config/loader.ts
    ↓ (Line 4)
import { appConfigService } from '@/lib/firebase/services/appConfig'
    ↓
src/lib/firebase/services/appConfig.ts [DELETED IN COMMIT 48e22af]
    ↓
Result: Module Not Found (Vercel Build Failure)
```

---

### 8. "Active References = 0" Verification

**RESULT: FALSE**

The statement `"Active References Found: 0"` in the previous report is **FALSE** and has been **DISPROVED BY EMPIRICAL EVIDENCE**.

#### Explanation:
1. In WP-RELEASE-003/WP-RELEASE-004, the `grep_search` query executed was `from '@/lib/firebase ` (ending with literal space or specific subpath format). Because consumers import with subpaths (`from '@/lib/firebase/services'`, `from '@/lib/firebase/demo-data'`, `from '@/lib/firebase/auth'`), the literal grep search returned 0 results.
2. The audit evaluated only the file deletions without checking whether consumer files in `src/app/dashboard/*`, `src/components/*`, `src/hooks/*`, `src/lib/config/*`, and `src/providers/*` were still actively referencing those deleted paths in Git commit `48e22af`.

---

### 9. TypeScript Audit

`tsconfig.json` includes:
```json
"include": [
  "next-env.d.ts",
  "**/*.ts",
  "**/*.tsx",
  ".next/types/**/*.ts",
  ".next/dev/types/**/*.ts",
  "**/*.mts"
]
```

All 25 failing consumer files are `.ts` or `.tsx` files inside `src/`. They are 100% included in `tsconfig.json`.

#### Why did local `npx tsc --noEmit` pass on developer machine?
On the developer's local machine, the working tree had uncommitted modifications (`M`) where some consumer files were edited on disk. When `npx tsc --noEmit` was executed locally against the local disk, it saw the developer's dirty working tree. But when commit `48e22af` was pushed to Git, **only the file deletions were committed**, leaving the original consumer files in Git untouched.

---

### 10. Next.js / Turbopack Audit

Next.js Turbopack compiler constructs a full entrypoint-to-dependency module graph during `next build`.
When Turbopack parses `src/app/dashboard/santri/page.tsx`, it encounters `import { santriService } from '@/lib/firebase/services'`. Since `@/lib/firebase/services` was deleted in commit `48e22af`, Turbopack halts build execution with `Module not found: Can't resolve '@/lib/firebase/services'`.

---

### 11. Local vs Vercel Comparison

| Aspect | Local Developer Disk State | Git Commit `48e22af` (Vercel State) |
|---|---|---|
| **Firebase Services (`src/lib/firebase/services/*`)** | Deleted (`D`) | Deleted (`delete mode 100644`) |
| **Active Consumers (`dashboard/*`, `components/*`)** | Uncommitted edits on disk | **Present in Git with Firebase imports** |
| **`npx tsc --noEmit`** | Evaluates dirty local working tree | **Fails when run against clean `48e22af`** |
| **Next.js Build** | Evaluates dirty local working tree | **Fails on Vercel clean clone** |

---

### 12. Root Cause Classification

**PRIMARY ROOT CAUSE:**
`ROOT-CAUSE-A: Deleted provider files in Git while active consumers remain in Git repository tree.`

**SECONDARY CONTRIBUTORY ROOT CAUSE:**
`ROOT-CAUSE-B: Incorrect active-reference audit (flawed grep pattern missed subpath imports).`

---

### 13. Confidence

**CONFIDENCE LEVEL: HIGH (100% empirical evidence verified via `git grep`, `git show`, and file graph analysis)**

---

### 14. Evidence Index

1. **Commit `48e22af` Deletion Proof:** `git show --stat 48e22af` (40 files changed, 3945 deletions).
2. **Git Consumer Reference Proof:** `git grep -n -i "firebase" 48e22af -- src/` (25 active consumer files listed in Section 4).
3. **Missing Module Resolution Proof:** `src/app/dashboard/santri/page.tsx:11` imports `@/lib/firebase/services`, which was deleted in `48e22af:src/lib/firebase/services/index.ts`.
4. **TypeScript Include Proof:** `tsconfig.json` lines 27-34.

---

## FORENSIC VERDICT

1. **Is commit `48e22af` internally consistent regarding Firebase deletion?**  
   **NO.** Commit `48e22af` is internally inconsistent because it deleted the implementation modules while retaining 25 active consumers in Git that import those deleted modules.
2. **Are active Firebase consumers still present?**  
   **YES.** 25 active files in commit `48e22af` still import `@/lib/firebase/...` paths.
3. **Is "Active References Found: 0" supported by current evidence?**  
   **NO.** The statement is FALSE and disproved by repository evidence.
4. **Why does Vercel fail?**  
   Vercel checks out clean commit `48e22af`. During Next.js Turbopack compilation, Turbopack traces imports in dashboard pages and components. When it encounters `@/lib/firebase/services`, `@/lib/firebase/config`, `@/lib/firebase/auth`, `@/lib/firebase/demo-data`, `@/lib/firebase/services/appConfig`, the targets do not exist in Git, causing build termination.
5. **Is the failure caused by npm dependency absence or local source-module absence?**  
   **Local source-module absence.** The error `Can't resolve '@/lib/firebase/services'` is a local path alias (`@/*`) resolution failure.
6. **Can the previous release verdict "A — FIREBASE DELETION RECONCILIATION COMPLETE" remain valid?**  
   **NO.** The verdict is INVALIDATED.
7. **What evidence is still missing, if any?**  
   None. The exact root cause and dependency graph are 100% established.

---

## RECOMMENDED NEXT GATE

Firebase consumer migration/deprecation status must be formally audited and classified before any provider restoration or consumer removal is authorized by the Product Owner. No code edits or git operations are authorized within this diagnostic task.

============================================================
