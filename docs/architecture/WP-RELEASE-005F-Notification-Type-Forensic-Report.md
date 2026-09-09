# WP-RELEASE-005F — Firestore Notification Type Forensic Report

> **WORK PACKAGE:** WP-RELEASE-005F  
> **TITLE:** FIRESTORE NOTIFICATION TYPE FORENSIC & POST-RECONCILIATION TYPE RECONCILIATION DISCOVERY  
> **PROJECT:** Ma'had Manager / Madev SaaS Multi-Tenant Platform  
> **BRANCH:** `preview`  
> **CURRENT HEAD:** `80b274ac3287ba9d62138bb9560fbc051abb5b8c`  
> **REMOTE ORIGIN/PREVIEW HEAD:** `80b274ac3287ba9d62138bb9560fbc051abb5b8c`  
> **DATE:** 2026-09-02  
> **STATUS:** FORENSIC COMPLETE  
> **MODE:** READ-ONLY FORENSIC DISCOVERY  
> **SOURCE CODE MODIFIED:** 0

---

## 1. Executive Summary

This forensic investigation establishes the exact technical root cause for the Vercel TypeScript build error on commit `80b274a`:

```
./src/lib/notification-engine.ts:12:15
Type error: Module "@/types/firestore" has no exported member "FirestoreNotification".
```

### Forensic Conclusion:
The failure is **100% caused by Uncommitted Local Type Migration (`src/lib/notification-engine.ts`)**.

1. **Local State:** `src/lib/notification-engine.ts` has ALREADY been updated on local developer disk (`M src/lib/notification-engine.ts`) to import canonical `Notification` from `@/types` instead of legacy `FirestoreNotification` from `@/types/firestore`.
2. **Git Repository State (`origin/preview`):** In commit `80b274a`, `src/lib/notification-engine.ts` STILL contains the legacy import `import type { FirestoreNotification } from '@/types/firestore'`.
3. **The Discrepancy:** In a previous commit, `@/types/firestore.ts` removed all deprecated `Firestore*` interfaces as part of PostgreSQL migration. Because `notification-engine.ts` was updated locally on disk, local `npx tsc --noEmit` passed. But because the updated `notification-engine.ts` was not committed to Git, Vercel clean clone from GitHub evaluated the old `notification-engine.ts` from Git against modern `@/types/firestore.ts`, triggering the TypeScript export error.

---

## 2. Canonical PostgreSQL Notification Type Verification

The canonical PostgreSQL database-neutral notification interface exists in `src/types/index.ts` (lines 312-324):

```typescript
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
  targetRole?: UserRole;
  targetSantriId?: string;
  targetAsramaId?: string;
  targetKelas?: string;
  targetAngkatan?: number;
}
```

On local disk, `src/lib/notification-engine.ts` diff shows:

```diff
-import type { FirestoreNotification } from '@/types/firestore';
-import type { UserRole } from '@/types';
+import type { Notification, UserRole } from '@/types';

 dispatchFromEvent(
   event: GovernanceEvent,
-): Omit<FirestoreNotification, 'createdAt'> | null {
+): Omit<Notification, 'id' | 'createdAt'> | null {
```

---

## 3. Mandatory Final Status Block

```
============================================================
WP-RELEASE-005F FORENSIC STATUS
============================================================

STATUS:
FORENSIC COMPLETE

CURRENT HEAD:
80b274ac3287ba9d62138bb9560fbc051abb5b8c

REMOTE HEAD:
80b274ac3287ba9d62138bb9560fbc051abb5b8c

HEAD == ORIGIN/PREVIEW:
YES

VERCEL FAILURE:
TypeScript type check (`FirestoreNotification` missing export)

FAILING FILE:
src/lib/notification-engine.ts

FAILING SYMBOL:
FirestoreNotification

FAILING MODULE:
@/types/firestore

FirestoreNotification REFERENCES IN LOCAL CODE:
0 (Already migrated to canonical `Notification` locally)

PRODUCTION-REACHABLE REFERENCES:
1 (In Git commit 80b274a `notification-engine.ts`)

FirestoreNotification CLASSIFICATION:
Legacy Firebase/Firestore residue & Uncommitted type migration

FIRESTORE TYPE FILE STATUS:
Active PostgreSQL Drizzle type definitions (`Firestore*` legacy types removed)

CANONICAL POSTGRESQL NOTIFICATION TYPE FOUND:
YES

CANONICAL REPLACEMENT:
`export interface Notification` in `src/types/index.ts`

NOTIFICATION ENGINE STATUS:
Fully migrated on local disk (`M`), uncommitted in Git `80b274a`

ROOT CAUSE:
Uncommitted Local Type Migration. `notification-engine.ts` was updated locally on disk to use canonical `Notification` from `@/types`, but was not committed to Git in commit 80b274a.

LOCAL VS VERCEL DISCREPANCY:
Local `tsc` evaluated local disk (where `notification-engine.ts` uses `Notification`). Vercel evaluated Git commit 80b274a (where `notification-engine.ts` imports `FirestoreNotification`).

TENANT ISOLATION IMPACT:
NONE (Canonical `Notification` preserves tenant targeting parameters)

DATABASE MODIFIED:
0

MIGRATIONS EXECUTED:
0

SOURCE FILES MODIFIED:
0

COMMIT CREATED:
NO

PUSH:
0

FIREBASE REINTRODUCED:
NO

SCOPE CREEP:
NO
============================================================
```

---

## 4. Recommended Remediation Plan (For WP-RELEASE-005G)

1. **Exact File to Stage:** `src/lib/notification-engine.ts`.
2. **Why Necessary:** Replaces legacy `FirestoreNotification` with canonical `Notification` from `@/types`, eliminating the Vercel TypeScript build error.
3. **Architecture Impact:** Zero architecture change (removes legacy Firebase residue, aligns with PostgreSQL types).
4. **Business Logic Impact:** None.
5. **Firebase Reintroduction:** NO (Firebase residue is 100% removed).
6. **Tenant Isolation / Database Impact:** None.
7. **Execution Plan:** Stage `src/lib/notification-engine.ts`, commit as `chore(release): reconcile notification-engine to canonical notification type`, and push to `origin/preview`.
