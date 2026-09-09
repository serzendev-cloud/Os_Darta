# WP-ARCH-FIX-001 — Governance Baseline & Environment State

> **WORK PACKAGE:** WP-ARCH-FIX-001  
> **TITLE:** CONFORMANCE GAP TRIAGE & CORRECTIVE ENGINEERING BASELINE  
> **PROJECT:** Ma'had Manager / Madev SaaS Multi-Tenant Platform  
> **BRANCH:** `preview`  
> **DATE:** 2026-09-01  
> **MODE:** CONTROLLED TRIAGE & CORRECTIVE ENGINEERING

---

## 1. Environment & Repository State

- **Current Git Branch:** `preview`
- **Current Commit:** `6d99a92` (`feat(security): implement WP-SAAS-SEC-003 production RLS E2E verification & security hardening`)
- **Working Tree State:** Clean (uncommitted docs from WP-ARCH-001 & WP-ARCH-CONF-001 present)
- **Primary Source-of-Truth:** `docs/architecture/WP-ARCH-001-Master-Source-of-Truth.md` & `AGENTS.md`

---

## 2. Locked Governance Hierarchy

```
AGENTS.md (Level S0)
  ↓
WP-ARCH-001 Master Source-of-Truth (Level S0)
  ↓
WP-ARCH-CONF-001 Conformance Audit (Level S0)
  ↓
Locked ADRs & EARS System Architecture (Level S1)
  ↓
Certified Security Architecture (WP-SAAS-SEC-003, Level S3)
  ↓
Current Database Schema & Migrations (0000, 0001, 0002, Level S3)
  ↓
Current Application Source Code & Tests (Level S3/S4)
```

---

## 3. Scope Boundaries & Forbidden Modifications

1. **NO NEW FEATURE IMPLEMENTATION:** Do NOT implement `WP-SAAS-BRAND-002`, `WP-SAAS-DOMAIN-001`, `WP-SAAS-SUB-001`, `WP-SAAS-ADDON-001`, `WP-LIB-001B+`, `WP-TASK-001`, or `WP-OSIM-001`.
2. **NO BLIND REFACTORING:** Do NOT touch locked security boundaries (`src/proxy.ts`, `src/lib/db/tenant-transaction.ts`, `drizzle/0002_tenant_rls_hardening.sql`).
3. **NO FIREBASE DELETION:** Do NOT delete `src/lib/firebase/` files (deferred to dedicated maintenance WP).
4. **NO DEMO DB REMOVAL:** Retain `demoDb` UI fallback in `create-tenant-service.ts` (verified as client-side UI fallback only).
5. **MINIMAL PATCH MANDATE:** Corrective work is allowed ONLY for verified `TRUE IMPLEMENTATION DEFECTS`.
