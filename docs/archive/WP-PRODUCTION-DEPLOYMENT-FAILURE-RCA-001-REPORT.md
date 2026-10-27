# EEOS ROOT CAUSE ANALYSIS REPORT

## WP-PRODUCTION-DEPLOYMENT-FAILURE-RCA-001

### TITLE
Vercel Production Build Failure — Read-Only Root Cause Analysis

### STATUS
ROOT CAUSE IDENTIFIED — READ-ONLY RCA COMPLETED

### GOVERNANCE
EEOS / Production Quality & Failure Forensic Gate

---

## 1. Executive Summary
Following the authorized push of commit `77c4c45` to `origin/preview` under `WP-PRODUCTION-DEPLOYMENT-AUTHORIZATION-001`, the automated production build on Vercel failed during compilation with the following error:
```text
./src/lib/db/schema.ts:449:1
Module not found: Can't resolve './schema/academic_structure'
```
A forensic, read-only investigation was conducted to determine why the build succeeded locally (`npm run build` passing 85/85 routes) but failed on Vercel.

**Root Cause**: Commit `77c4c45` committed `src/lib/db/schema.ts` containing the line `export * from './schema/academic_structure';`, but the target file `src/lib/db/schema/academic_structure.ts` remained an **untracked local file** (`??`) in the developer's working tree and was **never committed to Git**. When Vercel performed a clean clone of commit `77c4c45` from GitHub, the target file was missing from the repository, causing Turbopack module resolution to fail.

---

## 2. Git Revision Verification
- **Local Branch**: `preview`
- **Local HEAD**: `77c4c45023d99c2e65b20996393bf4e3a0366675`
- **Remote Branch (`origin/preview`)**: `77c4c45023d99c2e65b20996393bf4e3a0366675`
- **Parity**: Local HEAD and `origin/preview` are identical (0 commits ahead, 0 commits behind).
- **Vercel Target Commit**: `77c4c45023d99c2e65b20996393bf4e3a0366675` (Verified exact match).

---

## 3. Investigation of the Missing Module
- **Failing Import Location**: `src/lib/db/schema.ts` line 449:
  ```typescript
  export * from './schema/academic_structure';
  ```
- **Target File Physical Existence**:
  - Exists Locally on Disk: **YES** (`e:\Projects\Os_Darta\src\lib\db\schema\academic_structure.ts`)
  - File Size: 7,674 bytes (149 lines defining `madrasah`, `jenjang`, `tingkat`, `rombel`)
- **Git Tracking Status**:
  - `git ls-files src/lib/db/schema/academic_structure.ts`: **0 files returned (UNTRACKED)**
  - `git status --short`: Shows `?? src/lib/db/schema/academic_structure.ts`
  - In Git Commit `77c4c45`: **NO (ABSENT from Git Tree)**

---

## 4. Case-Sensitivity Audit
- Import string: `./schema/academic_structure`
- On-disk filename: `academic_structure.ts` in directory `src/lib/db/schema/`
- Case comparison: Exact match (`academic_structure` in lower snake_case).
- **Finding**: The build failure is **NOT** caused by Windows vs Linux filesystem case-sensitivity. The file does not exist in Vercel's cloned repository under any casing.

---

## 5. Git Tree Audit
Inspection of the commit object via `git ls-tree -r --name-only 77c4c45`:
- `src/lib/db/schema.ts` -> **PRESENT IN COMMIT**
- `src/lib/db/schema/preview_origin_tickets.ts` -> **PRESENT IN COMMIT**
- `src/lib/db/schema/academic_structure.ts` -> **ABSENT FROM COMMIT**

---

## 6. Working Tree vs Committed Tree
- `LOCAL-ONLY FILE`: **YES** (`src/lib/db/schema/academic_structure.ts` exists only on local disk)
- `UNTRACKED FILE`: **YES** (`git status` flags it as `??`)
- `IGNORED FILE`: **NO** (`git check-ignore` confirms it is not ignored by `.gitignore`)
- `COMMITTED FILE`: **NO**

---

## 7. `.gitignore` Audit
- Checked `.gitignore` rules against `src/lib/db/schema/academic_structure.ts`.
- Result: The file is **not ignored**. It is simply an untracked file that was never staged with `git add`.

---

## 8. Import Graph & History Audit
1. **Origin of `academic_structure.ts`**:
   Authored during `WP-ACADEMIC-STRUCTURE-IMPLEMENTATION-001` (dated 2026-09-15) as the canonical Drizzle schema for Level 4 Academic Structure (`madrasah`, `jenjang`, `tingkat`, `rombel`). Under the strict governance prohibitions of that work package, no Git commit or push was executed, leaving the file untracked on disk.
2. **Introduction of the Export in `schema.ts`**:
   During `WP-ACADEMIC-STRUCTURE-IMPLEMENTATION-001`, `export * from './schema/academic_structure';` was appended to `src/lib/db/schema.ts` on disk.
3. **Introduction to Git in Commit `77c4c45`**:
   During `WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-001`, `src/lib/db/schema.ts` was an authorized file to modify (to add `export * from './schema/preview_origin_tickets';`). Staging `schema.ts` inadvertently staged the pre-existing uncommitted line 449 (`export * from './schema/academic_structure';`). However, because `academic_structure.ts` was not in the authorized scope of WP-001, it was correctly excluded from `git add`.
4. **Resulting Divergence**:
   Commit `77c4c45` contained a reference to a module that was never committed to the Git tree.

---

## 9. Vercel vs Local Build Discrepancy
- **Local Environment (`npm run build`)**:
  - Next.js Turbopack executed against the local Windows working directory.
  - Turbopack successfully resolved `./schema/academic_structure` because `src/lib/db/schema/academic_structure.ts` was physically present on the local filesystem.
  - Build passed 85/85 routes.
- **Vercel Remote Environment**:
  - Vercel performed a fresh `git clone` of commit `77c4c45` from GitHub.
  - The clean clone contained `schema.ts` with line 449, but lacked `src/lib/db/schema/academic_structure.ts`.
  - Turbopack halted compilation with: `Module not found: Can't resolve './schema/academic_structure'`.

---

## 10. Vercel Commit Verification
- **Target Project**: Os_Darta on Vercel
- **Target Branch**: `preview`
- **Target Commit**: `77c4c45023d99c2e65b20996393bf4e3a0366675`
- **Error Line**: `schema.ts:449:1` matches exact committed source.

---

## 11. Database & Security State
- **Database Status**: **UNCHANGED** (Zero DDL, DML, or schema alterations executed).
- **Role Preview Activation**: **DISABLED / FAIL-CLOSED** (Dual-key flags `ROLE_PREVIEW_ENABLED` and `ROLE_PREVIEW_PRODUCTION_ALLOWED` remain unprovisioned).

---

## 12. Classification of Root Cause

### PRIMARY ROOT CAUSE:
**A. FILE MISSING FROM COMMIT**

### SECONDARY CONTRIBUTING FACTORS:
**C. UNTRACKED LOCAL FILE** (The target schema module was left uncommitted from a prior work package and resolved locally on disk during build preflight).

---

## 13. Recommended Remediation Strategy (For Next Authorized WP)
A dedicated remediation work package should be authorized to:
1. Stage and commit `src/lib/db/schema/academic_structure.ts` (along with any associated certified academic structure artifacts), OR remove the dangling export from `src/lib/db/schema.ts` if academic structure is to remain out-of-tree.
2. Verify clean build against an isolated clean Git worktree / index (`git archive` or fresh clone simulation).
3. Push the remediation commit to `origin/preview`.

---

```text
==================================================
EEOS PRODUCTION DEPLOYMENT FAILURE RCA
==================================================

WP:
WP-PRODUCTION-DEPLOYMENT-FAILURE-RCA-001

DEPLOYMENT COMMIT:
77c4c45

VERCEL BUILD:
FAIL

ERROR:
Module not found: Can't resolve './schema/academic_structure'

LOCAL FILE EXISTS:
YES

FILE TRACKED BY GIT:
NO

FILE PRESENT IN 77c4c45:
NO

CASE-SENSITIVITY:
PASS

GITIGNORE:
PASS

LOCAL VS COMMITTED TREE:
DIFFERENT

VERCEL REVISION:
MATCH

PRIMARY ROOT CAUSE:
A. FILE MISSING FROM COMMIT

SECONDARY CAUSES:
C. UNTRACKED LOCAL FILE

DATABASE:
UNCHANGED

ROLE PREVIEW:
DISABLED / FAIL-CLOSED

SOURCE MUTATION:
NONE

DATABASE MUTATION:
NONE

GIT MUTATION:
NONE

GIT PUSH:
NONE

VERDICT:
ROOT CAUSE IDENTIFIED

NEXT GATE:
PRODUCTION DEPLOYMENT REMEDIATION
==================================================
```
