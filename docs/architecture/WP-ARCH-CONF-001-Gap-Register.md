# WP-ARCH-CONF-001 — Architecture Gap Register

> **WORK PACKAGE:** WP-ARCH-CONF-001  
> **TITLE:** REPOSITORY ARCHITECTURE GAP REGISTER  
> **BRANCH:** `preview`  
> **DATE:** 2026-09-01  
> **STATUS:** AUDITED & CLASSIFIED

---

## 1. Overview

This register documents all minor, medium, and technical debt gaps identified during the repository-wide architecture conformance audit against `WP-ARCH-001-Master-Source-of-Truth.md`.

---

## 2. Gap Classification Register

| GAP ID | Domain | Severity | Expected Architecture | Actual Implementation | Evidence | Impact | Recommended Remediation | PO Decision Required? |
|---|---|:---:|---|---|---|---|---|:---:|
| **GAP-01** | **Legacy Prototype Code** | **LOW** | Database access should strictly use Drizzle ORM + Supabase PostgreSQL. | `src/lib/firebase/` directory contains deprecated Firebase prototype code. | `src/lib/firebase/` directory | Minor dead code clutter. Code is unreferenced by active Next.js routes. | Schedule a legacy clean-up work package to remove deprecated Firebase files. | **NO** |
| **GAP-02** | **Demo Store Fallback Sync** | **LOW** | Client services should read/write exclusively via server API endpoints. | `src/lib/db/services/create-tenant-service.ts` updates `demoDb` in parallel for instant client UI re-renders. | `create-tenant-service.ts:52` | Harmless client-side UI optimization; backend query execution remains server-verified. | Retain as UI fallback until offline-first capabilities are formally specified in a future WP. | **NO** |
| **GAP-03** | **Tenant Branding Configuration UI** | **MEDIUM** | Tenant administrators should be able to configure logos, colors, and login presentation. | `tenantSettings` database schema exists and RLS is hardened, but persistent branding UI configuration remains mock-bound (`tampilan-login/page.tsx`). | `src/app/dashboard/pengaturan/tampilan-login/page.tsx` | Tenant administrators cannot dynamically persist branding changes to PostgreSQL. | Execute **WP-SAAS-BRAND-002** (Core Tenant Branding Configuration) when authorized by Product Owner. | **YES (PO Authorization Required)** |
| **GAP-04** | **Custom Domain Engine** | **MEDIUM** | Tenants with enterprise subscriptions should be able to request and bind custom domain hostnames. | Custom domain resolution logic is specified in `WP-SAAS-DOMAIN-001` draft, but domain binding engine is not yet implemented. | `tenants.domain` column exists but is unmanaged by UI | Custom domain requests are handled manually via database. | Execute **WP-SAAS-DOMAIN-001** when authorized by Product Owner. | **YES (PO Authorization Required)** |

---

## 3. Severity Distribution Summary

- **CRITICAL GAPS:** 0
- **HIGH GAPS:** 0
- **MEDIUM GAPS:** 2 (`GAP-03` Branding UI persistence, `GAP-04` Custom Domain engine)
- **LOW GAPS / TECHNICAL DEBT:** 2 (`GAP-01` Deprecated Firebase files, `GAP-02` Demo store UI fallback)
