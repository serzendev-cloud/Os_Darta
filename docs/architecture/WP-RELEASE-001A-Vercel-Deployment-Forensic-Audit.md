# WP-RELEASE-001A — Vercel Deployment Failure Forensic Audit

> **WORK PACKAGE:** WP-RELEASE-001A  
> **TITLE:** VERCEL DEPLOYMENT FAILURE FORENSIC AUDIT  
> **PROJECT:** Ma'had Manager / Madev SaaS Multi-Tenant Platform  
> **BRANCH:** `preview`  
> **AUDITED COMMIT:** `2873af8ea32dc3144db79d41f3dfa94048a7f44f`  
> **DATE:** 2026-09-01  
> **MODE:** READ-ONLY FORENSIC DIAGNOSIS ONLY  
> **SOURCE CODE MODIFIED:** 0

---

## 1. Executive Summary

This forensic audit investigates why the production build on Vercel failed for released commit `2873af8` despite passing all local quality gates (`npx tsc --noEmit`, `vitest`, `npm run build`).

### Key Forensic Conclusion:
The failure on Vercel is **NOT caused by architecture defects in WP-SAAS-BRAND-002**, nor is it caused by case-sensitivity or Next.js build configuration.

The build failure is conclusively proven to be **ROOT-CAUSE-B: Untracked / Missing Files in Git Commit History & Uncommitted Barrel Export Changes**.

When PostgreSQL Drizzle services and security proxies were implemented locally in prior work packages, the source files were created on the local filesystem as **UNTRACKED files (`??`)** and `src/lib/db/services/index.ts` was modified locally (`M`). When commit `2873af8` was staged and committed, these essential files were omitted from Git. Consequently:
1. Local builds succeeded because the untracked files existed on the developer's local disk.
2. Vercel builds failed because Vercel cloned a clean Git tree from `origin/preview`, which lacked these untracked files.

---

## 2. Exact Vercel Error Log Analysis

The 7 reported primary module resolution errors map to specific untracked/uncommitted files:

| # | Vercel Error Message | Affected Consumer File | Missing / Uncommitted Target File |
|---|---|---|---|
| 1 | `Can't resolve '@/lib/authz/authorization-service'` | `src/app/api/db/query/route.ts` | `src/lib/authz/authorization-service.ts` (`??` Untracked) |
| 2 | `Can't resolve '@/lib/authz/authorization-service'` | `src/app/api/tenant/branding/route.ts` | `src/lib/authz/authorization-service.ts` (`??` Untracked) |
| 3 | `Can't resolve '@/lib/db/services/auditLog'` | `src/lib/services/wallet-freeze-service.ts` | `src/lib/db/services/auditLog.ts` (`??` Untracked) |
| 4 | `Can't resolve '@/lib/supabase/proxy'` | `src/proxy.ts` | `src/lib/supabase/proxy.ts` (`??` Untracked) |
| 5 | `Export appConfigService doesn't exist in '@/lib/db/services'` | `src/app/dashboard/pengaturan/_components/SystemTab.tsx` | `src/lib/db/services/appConfig.ts` (`??` Untracked) & `index.ts` (`M` Uncommitted) |
| 6 | `Export healthPermissionService doesn't exist in '@/lib/db/services'` | `src/app/dashboard/uks/izin-berobat/page.tsx` | `src/lib/db/services/healthPermission.ts` (`??` Untracked) & `index.ts` (`M` Uncommitted) |
| 7 | `Export healthVisitService doesn't exist in '@/lib/db/services'` | `src/app/dashboard/uks/page.tsx` | `src/lib/db/services/healthVisit.ts` (`??` Untracked) & `index.ts` (`M` Uncommitted) |

---

## 3. Repository State & Git Tree Verification

### A. Git Status Inspection (`git status -s`):
`git status -s` reveals the following untracked (`??`) and uncommitted (`M`) files present on the local developer environment:
- `?? src/lib/authz/` (Contains `authorization-service.ts` & `index.ts`)
- `?? src/lib/supabase/proxy.ts`
- `?? src/lib/db/services/auditLog.ts`
- `?? src/lib/db/services/appConfig.ts`
- `?? src/lib/db/services/healthPermission.ts`
- `?? src/lib/db/services/healthVisit.ts`
- `?? src/lib/db/services/tolerancePolicy.ts`
- `?? src/lib/db/services/alumni.ts`
- `M src/lib/db/services/index.ts`

### B. Git Tracked Files Inspection (`git ls-files`):
Executing `git ls-files` against commit `2873af8` confirms:
- `git ls-files src/lib/authz/` -> **0 files tracked**
- `git ls-files src/lib/supabase/proxy.ts` -> **0 files tracked**
- `git ls-files src/lib/db/services/auditLog.ts` -> **0 files tracked**
- `git ls-files src/lib/db/services/appConfig.ts` -> **0 files tracked**

---

## 4. Commit `2873af8` Verification

Executing `git show --stat 2873af8` shows that commit `2873af8` contained only 8 files:
1. `docs/architecture/WP-SAAS-BRAND-002-Governance-Baseline.md`
2. `docs/architecture/WP-SAAS-BRAND-002-Implementation-Report.md`
3. `docs/architecture/WP-SAAS-BRAND-002-Regression-Report.md`
4. `docs/architecture/WP-SAAS-BRAND-002-Security-Report.md`
5. `src/app/api/db/query/route.ts`
6. `src/app/api/tenant/branding/route.ts`
7. `src/app/dashboard/pengaturan/tampilan-login/page.tsx`
8. `tests/security/tenant-branding.security.test.ts`

The underlying authorization service (`src/lib/authz/authorization-service.ts`), database service files (`src/lib/db/services/auditLog.ts`, etc.), and updated barrel export (`src/lib/db/services/index.ts`) were **never included in commit `2873af8`**.

---

## 5. Barrel Export Analysis (`src/lib/db/services/index.ts`)

- **Local Working Tree (`d:\bikin app\APP MA'HAD\mahad-app\src\lib\db\services\index.ts`):**  
  Contains lines 23-26:
  ```ts
  export { healthVisitService } from './healthVisit';
  export { healthPermissionService } from './healthPermission';
  export { auditLogService } from './auditLog';
  export { appConfigService } from './appConfig';
  ```
- **Git Commit `2873af8` Tree (`git show 2873af8:src/lib/db/services/index.ts`):**  
  Ends at line 21 (`academicLedgerRecordService, academicTranscriptService`). Lines 22-27 do NOT exist in Git.

---

## 6. Case Sensitivity Analysis

All import paths match filesystem casing exactly:
- Import `@/lib/authz/authorization-service` matches `src/lib/authz/authorization-service.ts` (all lowercase).
- Import `@/lib/db/services/auditLog` matches `src/lib/db/services/auditLog.ts` (camelCase `auditLog`).
- Import `@/lib/supabase/proxy` matches `src/lib/supabase/proxy.ts` (all lowercase).

**Conclusion:** Case sensitivity is 100% ruled out as a cause.

---

## 7. Local vs Remote Build Reproducibility Analysis

- **Why `npm run build` passed locally:**  
  The Node.js/TypeScript compiler running locally evaluated files physically residing on disk in `d:\bikin app\APP MA'HAD\mahad-app\src\...`, regardless of whether Git tracked them.
- **Why Vercel build failed:**  
  Vercel fetches a clean clone of commit `2873af8` from GitHub. Since untracked files are excluded from Git commits, Vercel's clean working directory lacked those files.

---

## 8. Root Cause Classification

**PRIMARY ROOT CAUSE:**
`ROOT-CAUSE-B: Untracked / missing files in Git commit history & uncommitted barrel exports.`

### Evidence Matrix:

| Cause Candidate | Status | Empirical Evidence |
|---|:---:|---|
| **ROOT-CAUSE-A: Remote commit mismatch** | **DISPROVED** | Vercel built exact commit `2873af8ea32dc3144db79d41f3dfa94048a7f44f`. |
| **ROOT-CAUSE-B: Untracked / missing files** | **CONFIRMED** | `git ls-files` proves `src/lib/authz/`, `proxy.ts`, `auditLog.ts` exist on disk but are untracked (`??`) in Git. |
| **ROOT-CAUSE-C: Incorrect barrel exports** | **CONFIRMED** | `src/lib/db/services/index.ts` in Git lacks `appConfigService`, `healthPermissionService`, `healthVisitService` exports. |
| **ROOT-CAUSE-D: Incorrect import paths** | **DISPROVED** | Import paths match local file paths; failure is due to missing files in Git. |
| **ROOT-CAUSE-E: Linux case-sensitivity** | **DISPROVED** | Disk file casing and import string casing match character-for-character. |
| **ROOT-CAUSE-F: Local build state mismatch** | **CONFIRMED** | Local build ran against dirty working tree containing untracked files. |

---

## 9. Corrective Action Recommendation (For Future WP Authorization)

To permanently resolve the Vercel build failure, a dedicated Work Package (**WP-RELEASE-001B**) should be authorized by the Product Owner to perform:
1. Stage all canonical multi-tenant foundation files (`src/lib/authz/`, `src/lib/supabase/proxy.ts`, `src/lib/db/services/auditLog.ts`, `appConfig.ts`, `healthPermission.ts`, `healthVisit.ts`, `tolerancePolicy.ts`, `alumni.ts`, `src/lib/db/services/index.ts`, `src/lib/db/schema/identity.ts`, `src/lib/db/schema/kesiswaan_masters.ts`).
2. Run clean git-tree build verification (`git status` clean check).
3. Commit and push the complete multi-tenant foundation to `origin/preview`.

---

## 10. Governance & Security Impact

- **Security Impact:** 0 (Tenant isolation, PostgreSQL RLS, and RBAC contracts remain hardened and intact).
- **Architecture Drift:** 0 (No architecture drift; untracked files are standard PostgreSQL Drizzle services created during previous sprint migrations).
- **Scope Creep Assessment:** 0 (No unauthorized feature creation).
- **Source Code Modified in Audit:** 0 files modified.

---

## 11. Final Mandatory Report Summary

```
============================================================
WP-RELEASE-001A
VERCEL DEPLOYMENT FAILURE FORENSIC AUDIT
============================================================

AUDIT STATUS:
COMPLETED

PRIMARY ROOT CAUSE:
ROOT-CAUSE-B (Untracked / missing files in Git commit history)

FAILING MODULES AUDITED:
7 / 7 IDENTIFIED & TRACED

LOCAL VS REMOTE DISCREPANCY:
CONFIRMED (Local build evaluated untracked files on disk; Vercel cloned clean Git tree)

CASE-SENSITIVITY ISSUE:
NO

VERCEL COMMIT MISMATCH:
NO (Vercel correctly built commit 2873af8)

FIREBASE RE-INTRODUCTION:
NO (0 Firebase reliance)

SOURCE CODE MODIFIED:
0

DATABASE MODIFIED:
NO

MIGRATIONS:
0

DEPENDENCIES MODIFIED:
0

FINAL VERDICT:
DIAGNOSIS COMPLETE — AWAITING PRODUCT OWNER AUTHORIZATION FOR STAGING & RELEASE

============================================================
```
