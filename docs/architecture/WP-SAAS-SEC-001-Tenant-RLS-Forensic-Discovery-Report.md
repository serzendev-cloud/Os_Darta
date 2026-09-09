# WP-SAAS-SEC-001 — Tenant RLS & Database Isolation Forensic Discovery Report

> **TITLE:** TENANT RLS & DATABASE ISOLATION FORENSIC DISCOVERY  
> **MODE:** STRICT READ-ONLY FORENSIC DISCOVERY  
> **DATE:** 2026-09-01  
> **STATUS:** DISCOVERY COMPLETE  
> **AUTHORIZATION:** DISCOVERY ONLY — NO IMPLEMENTATION

---

## 1. Executive Summary

This report delivers a rigorous forensic security audit evaluating whether tenant data isolation is adequately protected at the **DATABASE LEVEL** (PostgreSQL / Supabase Row-Level Security) versus the **APPLICATION LEVEL** (Proxy, middleware, `getTenantContext()`, and Drizzle queries).

### Key Architectural Findings:
1. **Database-Level RLS is ABSENT for `tenants` and `tenant_settings`:**
   - In Migration `0000_neat_machine_man.sql`, **zero (0) RLS policies** or `ENABLE ROW LEVEL SECURITY` statements exist for `tenants`, `tenant_settings`, and 52 other core tables.
   - In Migration `0001_kesiswaan_master_tables.sql`, RLS was enabled **only for 3 new master tables** (`master_institutions`, `violation_severity_levels`, `violation_categories`).
2. **Application-Level Isolation is ROBUST and FAIL-CLOSED:**
   - [`src/proxy.ts`](file:///d:/bikin%20app/APP%20MA'HAD/mahad-app/src/proxy.ts) operates as a Zero-Trust boundary that extracts `tenantSlug` strictly from the hostname/subdomain or validated `/t/:slug` path, **overwriting any incoming client headers** (`x-tenant-id`, `x-tenant-slug`, `x-user-id`, `x-user-role`).
   - [`src/lib/tenant/context.ts`](file:///d:/bikin%20app/APP%20MA'HAD/mahad-app/src/lib/tenant/context.ts) (`getTenantContext()`) queries `tenants` by the verified `x-tenant-slug` and `tenant_settings` by the resulting `tenant.id`.
   - Universal query endpoints ([`src/app/api/db/query/route.ts`](file:///d:/bikin%20app/APP%20MA'HAD/mahad-app/src/app/api/db/query/route.ts)) strictly bind write and read queries with `.where(eq(targetTable.tenantId, tenant.id))` and verify RBAC permissions.
3. **Database Driver Model:**
   - Backend queries run via Node.js using direct connection pooling (`drizzle-orm/postgres-js` with `DATABASE_URL`), connecting as the primary database user.
4. **Prerequisite for WP-SAAS-BRAND-002:**
   - Because application-level isolation strictly derives `tenant_id` from server-side hostname resolution in `getTenantContext()`, **Tenant A cannot read or modify Tenant B's branding via normal API routes**. However, without database-level RLS, defense-in-depth is incomplete.

---

## 2. Audit Scope & Boundaries

The forensic discovery inspected:
- **Migrations:** `drizzle/0000_neat_machine_man.sql`, `drizzle/0001_kesiswaan_master_tables.sql`
- **Schemas:** `src/lib/db/schema.ts`, `src/lib/db/schema/identity.ts`, `src/lib/db/schema/kesiswaan.ts`, `src/lib/db/index.ts`
- **Resolution & Context:** `src/proxy.ts`, `src/lib/tenant/context.ts`, `src/lib/db/services/tenant-service.ts`, `src/lib/db/services/create-tenant-service.ts`
- **Authorization & APIs:** `src/lib/authz/authorization-service.ts`, `src/app/api/db/query/route.ts`
- **Supabase Clients:** `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`, `src/lib/supabase/proxy.ts`

---

## 3. Canonical Tenant Architecture

The canonical multi-tenant model is structured as follows:

```
[ Incoming Request: Hostname / Path ]
                │
                ▼
      [ src/proxy.ts ]
  - extractTenantSlug() from Subdomain / Path
  - Overwrite x-tenant-id & x-tenant-slug headers (Zero-Trust)
  - Validate Session via Supabase Auth (Fail-Closed)
                │
                ▼
  [ src/lib/tenant/context.ts ]
  - Reads x-tenant-slug header
  - SELECT * FROM tenants WHERE slug = $1
  - SELECT * FROM tenant_settings WHERE tenant_id = tenant.id
                │
                ▼
  [ Domain Services / API Route ]
  - Enforce RBAC permission (requirePermission)
  - Scoped Query: WHERE tenant_id = tenant.id
```

---

## 4. `tenants` Table RLS Audit

| Dimension | Forensic Evidence | Assessment |
|---|---|:---:|
| **Table Definition** | `drizzle/0000_neat_machine_man.sql` (Lines 393-402) | Exists (`id` PK, `slug` UNIQUE, `name`, `domain`, `status`) |
| **Row Level Security** | No `ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;` statement | ❌ **ABSENT** |
| **RLS Policies** | 0 policies defined | ❌ **ABSENT** |
| **SELECT Permissions** | Queryable by any server-side database connection without DB-level tenant filtering | Application-Filtered |
| **INSERT / UPDATE / DELETE** | Controlled solely at application level via Super Admin routes / authorization service | Application-Filtered |
| **Super Admin / Developer** | `proxy.ts` assigns `x-is-super-admin` based on verified `app_metadata.role` | Safe at app level |

---

## 5. `tenant_settings` Table RLS Audit

| Dimension | Forensic Evidence | Assessment |
|---|---|:---:|
| **Table Definition** | `drizzle/0000_neat_machine_man.sql` (Lines 374-391) | Exists (`id` PK, `tenant_id` UNIQUE NOT NULL) |
| **Row Level Security** | No `ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;` statement | ❌ **ABSENT** |
| **RLS Policies** | 0 policies defined | ❌ **ABSENT** |
| **Tenant Isolation Mechanism** | `context.ts` Line 64: `.where(eq(tenantSettings.tenantId, tenantDoc.id))` | Application-Level Only |
| **Cross-Tenant Read Risk** | Direct DB query: **Unrestricted**; Via API route: **Protected by app filter** | **MEDIUM** (Missing Defense-in-Depth) |
| **Cross-Tenant Write Risk** | Direct DB query: **Unrestricted**; Via API route: **Protected by app filter** | **MEDIUM** (Missing Defense-in-Depth) |

---

## 6. Tenant-Scoped Table Inventory

Forensic classification of all 57 database tables across the platform:

| Category | Total Tables | RLS Enabled | Tenant ID Column | Application Scoped |
|---|:---:|:---:|:---:|:---:|
| **Core Identity & Settings** (`tenants`, `tenant_settings`, `users`) | 3 | 0 / 3 | `tenant_id` present in `tenant_settings`, legacy in `users` | ✅ Yes |
| **RBAC & Identity Subsystem** (`tenant_roles`, `user_tenant_memberships`, `wali_santri_relationships`, etc.) | 7 | 0 / 7 | `tenant_id` FK to `tenants(id)` with cascade | ✅ Yes |
| **Operational & Domain Data** (`santri`, `guru`, `kelas`, `mapel`, `asrama`, `kamar`, `pelanggaran`, `hukuman`, `quests`, `health_*`, `academic_*`, etc.) | 34 | 0 / 34 | `tenant_id text DEFAULT 'default' NOT NULL` | ✅ Yes |
| **Financial & PPOB Subsystem** (`wallets`, `wallet_pockets`, `invoices`, `canteens`, `canteen_items`, `canteen_transactions`, `ppob_transactions`) | 7 | 0 / 7 | `tenant_id text NOT NULL` | ✅ Yes |
| **RFID & Gate Security** (`rfid_cards`, `attendance_logs`, `gate_passes`) | 3 | 0 / 3 | `tenant_id text NOT NULL` | ✅ Yes |
| **Kesiswaan Master (Migration 0001)** (`master_institutions`, `violation_severity_levels`, `violation_categories`) | 3 | **3 / 3** ✅ | `tenant_id text NOT NULL` | ✅ Yes |
| **Platform-Global Tables** (`permissions`, `platform_roles`, `user_platform_roles`, `ppob_categories`, `ppob_products`) | 5 | 0 / 5 | Platform scope (no tenant_id needed) | ✅ Yes |

**Summary:** 52 out of 55 tenant-scoped tables currently lack database-level RLS.

---

## 7. Application-Level Isolation Audit

### 1. Zero-Trust Header Enforcement
- In [`src/proxy.ts`](file:///d:/bikin%20app/APP%20MA'HAD/mahad-app/src/proxy.ts#L138-L154), incoming headers from the client are explicitly scrubbed and overwritten:
  - `requestHeaders.set('x-tenant-id', resolvedTenantId);`
  - `requestHeaders.set('x-tenant-slug', tenantSlug);`
- Any malicious header supplied by an attacker (e.g. `curl -H "x-tenant-id: victim_tenant"`) is discarded before reaching downstream route handlers or Server Components.

### 2. Client-Side `localStorage` Audit
- In [`src/lib/db/services/tenant-service.ts`](file:///d:/bikin%20app/APP%20MA'HAD/mahad-app/src/lib/db/services/tenant-service.ts#L20), `localStorage.getItem('mahad_active_tenant_id')` is read by client-side demo stores.
- **Security Check:** When a mutation request is made to `/api/db/query`, the server does **NOT** trust the `tenantId` inside the request body. [`/api/db/query/route.ts`](file:///d:/bikin%20app/APP%20MA'HAD/mahad-app/src/app/api/db/query/route.ts#L149-L201) executes `const tenant = await getTenantContext();` and enforces `tenantId: tenant.id` on server insertion and updates.
- **Result:** Manipulating `localStorage` in the browser **cannot bypass server-side tenant isolation**.

---

## 8. Service Role & Database Client Audit

| Client Location | Purpose | Privilege Level | RLS Behavior |
|---|---|---|---|
| [`src/lib/db/index.ts`](file:///d:/bikin%20app/APP%20MA'HAD/mahad-app/src/lib/db/index.ts) | Primary Server Drizzle ORM | Direct Postgres Connection (`DATABASE_URL`) | Operates as DB owner / bypasses RLS unless forced |
| [`src/lib/supabase/server.ts`](file:///d:/bikin%20app/APP%20MA'HAD/mahad-app/src/lib/supabase/server.ts) | Server-Side Auth / SSR | `ANON_KEY` + User Cookies | Subject to RLS when querying Supabase PostgREST |
| [`src/lib/supabase/client.ts`](file:///d:/bikin%20app/APP%20MA'HAD/mahad-app/src/lib/supabase/client.ts) | Browser Client | `ANON_KEY` | Subject to RLS when querying Supabase PostgREST |
| [`src/lib/supabase/proxy.ts`](file:///d:/bikin%20app/APP%20MA'HAD/mahad-app/src/lib/supabase/proxy.ts) | Proxy Auth Verification | `ANON_KEY` + Request Cookies | Session validation only |

> **Finding:** No direct usage of `SUPABASE_SERVICE_ROLE_KEY` in application queries was found. The primary application queries execute via direct PostgreSQL pooling through Drizzle ORM.

---

## 9. Security Threat Scenario Matrix

| Scenario | Attack Description | Layer Involved | Evaluation | Evidence |
|---|---|---|:---:|---|
| **SCENARIO 1** | Tenant A attempts to read Tenant B's `tenant_settings` | Context & API | **PASS** | `getTenantContext()` resolves `tenant.id` from verified hostname; queries filter `WHERE tenant_id = tenant.id`. |
| **SCENARIO 2** | Tenant A attempts to update Tenant B's branding | API Mutation | **PASS** | `/api/db/query` enforces `where(and(eq(id, id), eq(tenantId, tenant.id)))`. |
| **SCENARIO 3** | Tenant A manipulates `tenant_id` in request body | API Mutation | **PASS** | Server overrides payload `tenantId` with verified `tenant.id` from server context (`route.ts:200`). |
| **SCENARIO 4** | Tenant A manipulates `x-tenant-id` HTTP header | Middleware Proxy | **PASS** | `proxy.ts:138` overwrites `x-tenant-id` with server-resolved tenant identity before downstream dispatch. |
| **SCENARIO 5** | Tenant A manipulates `x-tenant-slug` HTTP header | Middleware Proxy | **PASS** | `proxy.ts:140` overwrites `x-tenant-slug` with hostname-extracted slug. |
| **SCENARIO 6** | Tenant A manipulates browser `localStorage` tenant ID | Client Storage | **PASS** | `localStorage` only affects client demo store; server endpoints re-resolve tenant via server context. |
| **SCENARIO 7** | Tenant A calls API route on Tenant B's subdomain | Proxy / Session | **PARTIAL** | If user has no membership in Tenant B, RBAC `requirePermission` denies access (`DENIED_TENANT_MEMBERSHIP_MISSING`). |
| **SCENARIO 8** | Compromised tenant admin session attempts cross-tenant DB read | DB Connection | **FAIL** *(DB Level)* / **PASS** *(App Level)* | If application query lacks explicit `WHERE tenant_id = $1`, database will return data because RLS is not enabled on Postgres table. |
| **SCENARIO 9** | Service-role or Drizzle query accidentally omits `tenant_id` filter | Database Engine | **FAIL** *(DB Level)* | Without DB-level RLS, an unfiltered Drizzle query `db.select().from(santri)` returns all tenants' data. |

---

## 10. Cross-Tenant Leakage Assessment

- **Via Normal Application APIs:** **PROTECTED (LOW RISK)**. The proxy and server context architecture enforces tenant boundaries consistently across current routes.
- **Via Direct Database Layer (Missing Defense-in-Depth):** **ELEVATED RISK (MEDIUM)**. If a developer introduces a new Server Action or API route that accidentally executes `db.select().from(table)` without `.where(eq(table.tenantId, tenant.id))`, PostgreSQL will not prevent cross-tenant data exposure because RLS is absent on 52 tables.

---

## 11. Security Findings Summary

| ID | Severity | Area | Description |
|---|:---:|---|---|
| **SEC-01** | **MEDIUM** | Database RLS | `tenants` and `tenant_settings` do not have PostgreSQL Row-Level Security enabled. |
| **SEC-02** | **MEDIUM** | Database RLS | 52 operational and financial tables in Migration 0000 lack RLS policies and table enforcement. |
| **SEC-03** | **LOW** | Database Migration | Migration 0001 uses `current_setting('app.current_tenant_id', true)` which requires setting session variables prior to transaction execution in direct poolers. |
| **SEC-04** | **INFO** | Zero-Trust Proxy | Server proxy correctly sanitizes and overwrites client-supplied tenant headers. |
| **SEC-05** | **INFO** | RBAC Enforcement | Universal query API enforces `requirePermission` with tenant-scoped membership check. |

---

## 12. Recommended Remediation Architecture (WP-SAAS-SEC-002)

When authorized, **WP-SAAS-SEC-002: Tenant Database RLS Hardening** should implement:
1. Complete Drizzle migration enabling RLS on all tenant-scoped tables:
   ```sql
   ALTER TABLE "tenant_settings" ENABLE ROW LEVEL SECURITY;
   ALTER TABLE "tenant_settings" FORCE ROW LEVEL SECURITY;
   ```
2. Standardized tenant isolation policy compatible with both direct PostgreSQL connections (via session parameter) and Supabase JWT claims:
   ```sql
   CREATE POLICY "tenant_settings_tenant_isolation" ON "tenant_settings"
     FOR ALL USING (
       tenant_id = current_setting('app.current_tenant_id', true)
       OR tenant_id = (auth.jwt() ->> 'tenant_id')
     );
   ```
3. Establish a database session helper for server-side operations that sets `app.current_tenant_id` at the start of pooled transactions.

---

## 13. Pending Work Register

### COMPLETED
- **WP-SAAS-PORTAL-001:** Tenant Portal Architecture Discovery (`CERTIFIED`)
- **WP-SAAS-PORTAL-002:** Tenant Public Portal Foundation (`fbed9fd`)
- **WP-SAAS-PORTAL-003:** Tenant Subdomain & Hostname Resolution (`620395e`)
- **WP-SAAS-BRAND-001:** Tenant Branding System Discovery (`COMPLETE`)
- **WP-SAAS-SEC-001:** Tenant RLS & Database Isolation Discovery (`CURRENT — COMPLETE`)

### FUTURE WORK PACKAGES (PAUSED / AWAITING AUTHORIZATION)
- **WP-SAAS-SEC-002:** Tenant Database RLS Hardening (`PLANNED / PAUSED`)
- **WP-SAAS-BRAND-002:** Core Tenant Branding Configuration (`PLANNED / PAUSED`)
- **WP-SAAS-BRAND-003:** Tenant Portal Content Management (CMS) (`PLANNED / PAUSED`)
- **WP-SAAS-BRAND-004:** Tenant SEO & Social Metadata (`PLANNED / PAUSED`)
- **WP-SAAS-DOMAIN-001:** Custom Domain Request & Availability (`PAUSED`)
- **WP-SAAS-SUB-001:** Subscription Package & Entitlement Engine (`PAUSED`)
- **WP-SAAS-ADDON-001:** Tenant Add-on Override Engine (`PAUSED`)
- **WP-LIB-001B+:** Library Business Modules (`PAUSED`)
- **WP-TASK-001:** Buku Tugas (`PLANNED`)
- **WP-OSIM-001:** Qism / OSIM (`COMING SOON`)

---

## 14. Quality Verification Record

- **Mode:** Read-only forensic analysis & static dependency tracing.
- **TypeScript Verification:** `NOT VERIFIED` (no modifications made)
- **Vitest Suite:** `NOT VERIFIED` (no modifications made)
- **Production Build:** `NOT VERIFIED` (no modifications made)

---

## 15. Explicit Non-Modification Confirmation

- **Database Modified:** 0
- **Migration Created:** 0
- **Migration Executed:** 0
- **Source Files Modified:** 0
- **API Modified:** 0
- **Business Logic Modified:** 0
- **Package Dependencies Modified:** 0
- **Git Commit:** 0
- **Git Push:** 0

---

## Final Status Block

```
============================================================

WP-SAAS-SEC-001

TENANT RLS & DATABASE ISOLATION FORENSIC DISCOVERY

DISCOVERY MODE:
READ-ONLY

STATUS:
DISCOVERY COMPLETE

TENANTS TABLE RLS:
FAIL (Absent in PostgreSQL / Supabase schema)

TENANT_SETTINGS RLS:
FAIL (Absent in PostgreSQL / Supabase schema)

APPLICATION TENANT ISOLATION:
PASS (Proxy Zero-Trust + getTenantContext() + query scoping)

DATABASE TENANT ISOLATION:
FAIL (52 of 55 tenant tables lack RLS policies)

ZERO-TRUST HEADER:
PASS (Proxy overwrites client x-tenant-id / x-tenant-slug)

SERVER TENANT CONTEXT:
PASS (getTenantContext() resolves strictly from verified slug)

CLIENT TENANT ID TRUST:
PASS (Server ignores client body tenant_id / localStorage)

SERVICE ROLE ISOLATION:
NOT APPLICABLE (App queries run via Drizzle direct pooling)

CROSS-TENANT READ RISK:
LOW (at App Layer) / MEDIUM (at Database Layer)

CROSS-TENANT WRITE RISK:
LOW (at App Layer) / MEDIUM (at Database Layer)

CRITICAL FINDINGS:
0

HIGH FINDINGS:
0

MEDIUM FINDINGS:
2 (SEC-01, SEC-02: Missing database-level RLS on 52 tables)

LOW FINDINGS:
1 (SEC-03: Session variable requirement for direct pooler RLS)

INFO FINDINGS:
2 (SEC-04, SEC-05: Robust proxy header & RBAC enforcement)

DATABASE MODIFIED:
0

MIGRATION CREATED:
0

MIGRATION EXECUTED:
0

SOURCE FILES MODIFIED:
0

API MODIFIED:
0

BUSINESS LOGIC MODIFIED:
0

PACKAGE DEPENDENCIES MODIFIED:
0

GIT COMMIT:
0

GIT PUSH:
0

BRANDING MODIFIED:
0

LIBRARY MODIFIED:
0

BUKU TUGAS MODIFIED:
0

QISM/OSIM MODIFIED:
0

DOMAIN MODIFIED:
0

SUBSCRIPTION MODIFIED:
0

ADDON MODIFIED:
0

FINAL VERDICT:
B — Application-level tenant isolation is robust and fail-closed against cross-tenant tampering; database-level RLS is absent on core tables (including tenants and tenant_settings), representing a defense-in-depth gap that should be remediated in WP-SAAS-SEC-002 before multi-tenant production launch.

RECOMMENDED NEXT WORK PACKAGE:
WP-SAAS-SEC-002 (Tenant Database RLS Hardening) OR WP-SAAS-BRAND-002 (Core Tenant Branding Configuration, with application-level isolation verified)

IMPLEMENTATION AUTHORIZATION:
NOT GRANTED

============================================================

STOP.

DO NOT IMPLEMENT ANY RECOMMENDED WORK PACKAGE.

WAIT FOR PRODUCT OWNER REVIEW AND EXPLICIT AUTHORIZATION.

============================================================
```
