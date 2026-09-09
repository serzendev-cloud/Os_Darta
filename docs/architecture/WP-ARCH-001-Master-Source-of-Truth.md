# WP-ARCH-001 — Master Source-of-Truth & Project Planning Inventory

> **WORK PACKAGE:** WP-ARCH-001  
> **TITLE:** MASTER SOURCE-OF-TRUTH & PROJECT PLANNING INVENTORY  
> **PROJECT:** Ma'had Manager / Madev SaaS Multi-Tenant Platform  
> **BRANCH:** `preview`  
> **DATE:** 2026-09-01  
> **STATUS:** COMPLETED — MASTER SOURCE-OF-TRUTH ESTABLISHED WITH UNRESOLVED DECISIONS  
> **MODE:** AUDIT ONLY (NO CODE/DATABASE MODIFICATION)

---

## 1. Executive Summary

This document establishes the canonical **Master Source-of-Truth Map** for the Ma'had Manager (Madev) SaaS platform. It reconciles Product Vision, Architectural ADRs, Security Policies, Database Schemas, UI/UX Standards, and Work Package lifecycles across **130+ documentation artifacts** in the repository.

### Core Governance Principles Established:
1. **Product Vision:** 10-Year Enterprise Multi-Tenant SaaS designed for 100+ Pesantren (`AGENTS.md`, Level S0).
2. **Canonical Tenant Isolation:** Multi-tenant architecture resolves identity strictly from `hostname` / `extractTenantSlug()`, binding all business data to `tenants.id` and PostgreSQL Row-Level Security (`withTenantTransaction()`, Level S1/S3).
3. **Zero-Trust Header Policy:** Client-supplied headers (`x-tenant-id`, `x-tenant-slug`, `x-user-id`, `x-user-role`, `x-is-super-admin`) are **never trusted** and are explicitly overwritten by middleware (`src/proxy.ts`, Level S3).
4. **Database-Level Isolation:** 52 tenant-scoped tables are hardened via PostgreSQL RLS policies in Migration `0002_tenant_rls_hardening.sql` and certified via 18 E2E security tests in `WP-SAAS-SEC-003` (`tests/security/tenant-rls.e2e.security.test.ts`, Level S3/S4).
5. **No Blind Refactoring / Scope Creep:** All future engineering MUST proceed under explicitly authorized work packages.

---

## 2. Source-of-Truth Hierarchy

| Level | Authority Classification | Description & Criteria | Current Dominant Documents |
|---|---|---|---|
| **Level S0** | Product Owner Explicit Decision | Explicit PO instructions, locked directives in `AGENTS.md` | `AGENTS.md` |
| **Level S1** | Locked Architectural Decision | Approved ADRs, EARS Enterprise Specifications, System Architecture Contracts | `EARS-Part-1` to `Part-6`, `Sprint-1-Domain-Architecture.md` |
| **Level S2** | Approved Work Package Specification | Explicitly authorized Work Package task prompts | WP Specification Prompts |
| **Level S3** | Certified Implementation | Execution reports confirming validated implementation | `WP-SAAS-SEC-003-Execution-Report.md`, `WP-SAAS-PORTAL-003-Execution-Report.md` |
| **Level S4** | Test & Audit Evidence | Automated test suites and execution logs | `tests/security/tenant-rls.e2e.security.test.ts`, `vitest` logs |
| **Level S5** | General Design & Proposals | Draft roadmaps, preliminary gap audits, backlog items | `WP-UI-002`, `Sprint-1-Product-Backlog.md` |
| **Level S6** | Legacy / Historical | Deprecated Firebase implementation docs, abandoned single-tenant schemas | `src/lib/firebase/` (legacy references) |

---

## 3. Authoritative Domain Mapping Matrix

| Domain # | Domain Name | Authoritative Source Document | Authority Level | Current Domain Status |
|---|---|---|:---:|:---:|
| 1 | **Product Vision** | `AGENTS.md` | Level S0 | **LOCKED** |
| 2 | **Product Scope** | `AGENTS.md` & `EARS-Part-1-Enterprise-Foundation.md` | Level S1 | **LOCKED** |
| 3 | **Multi-Tenant Architecture** | `Sprint-1-WP-101-Tenant-Web-Identity-Authorization-Contract.md` | Level S1 | **LOCKED** |
| 4 | **Tenant Resolution** | `WP-SAAS-PORTAL-003-Execution-Report.md` & `src/proxy.ts` | Level S3 | **CERTIFIED** |
| 5 | **Authentication** | `src/proxy.ts` & `src/lib/supabase/proxy.ts` (Supabase Auth SSR) | Level S3 | **CERTIFIED** |
| 6 | **Authorization / RBAC** | `src/lib/authz/authorization-service.ts` & `schema/identity.ts` | Level S3 | **CERTIFIED** |
| 7 | **Database Architecture** | `src/lib/db/schema.ts` & Drizzle Migrations (`0000`, `0001`, `0002`) | Level S3 | **CERTIFIED** |
| 8 | **RLS / Security** | `WP-SAAS-SEC-003-Execution-Report.md` & `0002_tenant_rls_hardening.sql` | Level S3 | **CERTIFIED** |
| 9 | **Tenant Context** | `src/lib/tenant/context.ts` & `src/lib/db/tenant-transaction.ts` | Level S3 | **CERTIFIED** |
| 10 | **Super Admin Privilege** | `src/proxy.ts` & `WP-SAAS-SEC-003-RLS-E2E-Audit.md` | Level S3 | **CERTIFIED** |
| 11 | **Academic / Kesiswaan** | `src/lib/db/schema/kesiswaan_masters.ts` & `0001` migration | Level S3 | **CERTIFIED** |
| 12 | **Santri Core** | `src/modules/santri/` & `EMBS-Appendix-B` | Level S3 | **CERTIFIED** |
| 13 | **Guru** | `src/lib/db/schema.ts` (`guru` table) | Level S3 | **IMPLEMENTED** |
| 14 | **Kelas** | `src/lib/db/schema.ts` (`kelas` table) | Level S3 | **IMPLEMENTED** |
| 15 | **Attendance / Presensi**| `src/lib/db/schema/rfid.ts` (`attendance_logs`) | Level S3 | **IMPLEMENTED** |
| 16 | **Finance & Invoicing** | `src/lib/db/schema/finance.ts` (`invoices`) | Level S3 | **IMPLEMENTED** |
| 17 | **Wallet & Wallets** | `src/lib/db/schema/finance.ts` & `wallet-freeze-service.ts` | Level S3 | **CERTIFIED** |
| 18 | **Canteen / POS** | `src/lib/db/schema/finance.ts` (`canteens`, `canteen_items`) | Level S3 | **IMPLEMENTED** |
| 19 | **PPOB Services** | `src/lib/db/schema/ppob.ts` | Level S3 | **IMPLEMENTED** |
| 20 | **RFID Security** | `src/lib/db/schema/rfid.ts` (`rfid_cards`) | Level S3 | **IMPLEMENTED** |
| 21 | **Notifications** | `src/lib/notification-engine.ts` & `notifications` table | Level S3 | **IMPLEMENTED** |
| 22 | **Audit Logs** | `src/lib/audit-logger.ts` & `audit_logs` table | Level S3 | **IMPLEMENTED** |
| 23 | **Google Drive Storage** | `src/lib/db/schema.ts` (`gdrive_documents`) | Level S3 | **IMPLEMENTED** |
| 24 | **Tenant Branding** | `WP-SAAS-BRAND-001-Tenant-Branding-Discovery-Report.md` | Level S1 | **DISCOVERY COMPLETE** |
| 25 | **Tenant Portal** | `WP-SAAS-PORTAL-003-Execution-Report.md` | Level S3 | **CERTIFIED** |
| 26 | **Custom Domain** | `WP-SAAS-DOMAIN-001` (Planned Specification) | Level S5 | **PAUSED** |
| 27 | **Subscription Billing** | `WP-SAAS-SUB-001` (Planned Specification) | Level S5 | **PAUSED** |
| 28 | **Add-on Engine** | `WP-SAAS-ADDON-001` (Planned Specification) | Level S5 | **PAUSED** |
| 29 | **Library Module** | `WP-LIB-001A-Execution-Report.md` | Level S3 | **PAUSED AFTER 001A** |
| 30 | **Buku Tugas** | `WP-TASK-001` (Planned Specification) | Level S5 | **PLANNED** |
| 31 | **Qism / OSIM** | `WP-OSIM-001` (Planned Specification) | Level S5 | **COMING SOON** |
| 32 | **Deployment Target** | Vercel Serverless + Supabase Postgres | Level S1 | **LOCKED** |
| 33 | **Testing & QA Policy** | `EESS-Appendix-E-Testing-Standard.md` & Vitest | Level S1 | **LOCKED** |
| 34 | **Engineering Governance**| `AGENTS.md` & `Engineering-Quality-Policy.md` | Level S0/S1 | **LOCKED** |
| 35 | **Work Package Governance**| `WP-ARCH-001` (Current Work Package) | Level S0 | **LOCKED** |

---

## 4. Master Work Package Lifecycle Matrix

| WP ID | Title | Status | Branch | Commit Hash | Authority Level | Audit Notes |
|---|---|:---:|:---:|:---:|:---:|---|
| **WP-SAAS-PORTAL-001** | Tenant Portal Architecture Discovery | `CERTIFIED` | `preview` | Discovery | Level S3 | Forensic discovery completed |
| **WP-SAAS-PORTAL-002** | Tenant Public Portal Foundation | `CERTIFIED` | `preview` | `fbed9fd` | Level S3 | Public landing & login portal foundation |
| **WP-SAAS-PORTAL-003** | Tenant Subdomain & Hostname Resolution | `CERTIFIED` | `preview` | `620395e` | Level S3 | Hostname subdomain proxy resolution |
| **WP-NET-001-PREVIEW** | Local Hostname Testing Setup | `IMPLEMENTED` | `preview` | Local | Level S3 | Hosts file & network preview guide |
| **WP-SAAS-BRAND-001** | Tenant Branding Discovery Report | `COMPLETE` | `preview` | Discovery | Level S1 | Audit of 7 branding fields completed |
| **WP-SAAS-BRAND-002** | Core Tenant Branding Configuration | `PAUSED` | `preview` | — | Level S5 | Awaiting explicit PO authorization |
| **WP-SAAS-BRAND-003** | Tenant Portal CMS Content Management | `PAUSED` | `preview` | — | Level S5 | Awaiting explicit PO authorization |
| **WP-SAAS-BRAND-004** | Tenant SEO & Social Metadata Engine | `PAUSED` | `preview` | — | Level S5 | Awaiting explicit PO authorization |
| **WP-SAAS-SEC-001** | Tenant RLS Forensic Discovery | `COMPLETE` | `preview` | Discovery | Level S1 | Forensic audit of 57 database tables |
| **WP-SAAS-SEC-002** | Tenant Database RLS Hardening | `CERTIFIED` | `preview` | `955757e` | Level S3 | Drizzle Migration 0002 & RLS policies |
| **WP-SAAS-SEC-003** | Production RLS E2E Security Hardening | `CERTIFIED` | `preview` | `6d99a92` | Level S3 | 18/18 E2E security tests passed |
| **WP-LIB-001** | Library Architecture Discovery | `COMPLETE` | `preview` | Discovery | Level S1 | Library domain discovery report |
| **WP-LIB-001A** | Library Core Schema Foundation | `CERTIFIED` | `preview` | Executed | Level S3 | Schema foundation implemented |
| **WP-LIB-001B+** | Library Business Modules | `PAUSED` | `preview` | — | Level S5 | Paused after WP-LIB-001A |
| **WP-SAAS-DOMAIN-001**| Custom Domain Request Engine | `PAUSED` | `preview` | — | Level S5 | Future work package |
| **WP-SAAS-SUB-001** | Subscription Billing Engine | `PAUSED` | `preview` | — | Level S5 | Future work package |
| **WP-SAAS-ADDON-001** | Add-on Override Engine | `PAUSED` | `preview` | — | Level S5 | Future work package |
| **WP-TASK-001** | Buku Tugas Module | `PLANNED` | `preview` | — | Level S5 | Future work package |
| **WP-OSIM-001** | Qism / OSIM Module | `COMING SOON` | `preview` | — | Level S5 | Future work package |
| **WP-ARCH-001** | Master Source-of-Truth & Planning Inventory | `CURRENT` | `preview` | Audit | Level S0 | Current governance audit |

---

## 5. Architectural Decision Register (ADR Master)

| ADR ID | Decision Summary | Canonical Choice | Authority | Status | Evidence |
|---|---|---|---|:---:|---|
| **ADR-01** | Web Framework | Next.js 16 (App Router + Turbopack) | Product Owner | **LOCKED** | `package.json`, `AGENTS.md` |
| **ADR-02** | Programming Language | TypeScript (Strict Mode) | Product Owner | **LOCKED** | `tsconfig.json` |
| **ADR-03** | Styling System | Vanilla CSS / Tailored CSS Primitives | Product Owner | **LOCKED** | `src/app/globals.css` |
| **ADR-04** | Database Engine | PostgreSQL (Supabase / Pooled Connection) | Product Owner | **LOCKED** | `src/lib/db/index.ts` |
| **ADR-05** | Database ORM | Drizzle ORM (`drizzle-orm/postgres-js`) | Product Owner | **LOCKED** | `src/lib/db/schema.ts` |
| **ADR-06** | Tenant Identity Authority | Hostname Extraction (`extractTenantSlug`) | Product Owner | **LOCKED** | `src/proxy.ts` |
| **ADR-07** | Tenant Database Context | Transaction-Scoped `SET LOCAL app.current_tenant_id` | Product Owner | **LOCKED** | `src/lib/db/tenant-transaction.ts` |
| **ADR-08** | Security Architecture | PostgreSQL Row-Level Security (RLS) + Zero-Trust Proxy | Product Owner | **LOCKED** | `drizzle/0002_tenant_rls_hardening.sql` |
| **ADR-09** | Client Header Trust Policy | Zero-Trust (Client headers overwritten by Proxy) | Product Owner | **LOCKED** | `src/proxy.ts` |
| **ADR-10** | Client Storage Trust Policy| Browser `localStorage` ignored by backend | Product Owner | **LOCKED** | `src/app/api/db/query/route.ts` |
| **ADR-11** | State Management | Zustand (`useAuthStore`) | Team Baseline | **APPROVED** | `src/store/auth-store.ts` |
| **ADR-12** | Test Framework | Vitest | Quality Standard | **LOCKED** | `vitest.config.ts` |

---

## 6. Authoritative Business & Security Rules

### Business Rules (Locked)
1. **Tenant Domain Scope:** All entity records (`santri`, `guru`, `kelas`, `mapel`, `wallets`, `invoices`, etc.) MUST include a non-null `tenant_id` foreign key referencing `tenants.id`.
2. **Multi-Child Guardian Binding:** 1 Wali account can be bound to $N$ Santri across different tenants via `wali_santri_relationships`.
3. **Santri Lifecycle State Machine:** Santri status transitions (`Aktif`, `Lulus`, `Mutasi`, `DO`, `Suspended`) MUST validate domain guards (`StatusTransitionGuard`).

### Security Rules (Locked)
1. **Zero-Trust Header Enforcement:** No request header supplied by a client (`x-tenant-id`, `x-tenant-slug`, `x-user-role`, `x-is-super-admin`) shall ever be trusted. The Proxy MUST sanitize and set downstream headers.
2. **Fail-Closed Context Fallback:** Missing or empty tenant context MUST set `app.current_tenant_id = '__unauthenticated_none__'`, causing all tenant queries to match 0 records.
3. **Super Admin Anti-Elevation:** `app.is_super_admin` can ONLY be set by middleware after server-side Supabase JWT claim verification.

---

## 7. Product Owner Decisions Required

| Issue ID | Topic | Unresolved Context / Conflict | Recommended Resolution |
|---|---|---|---|
| **PO-REQ-01** | Work Package Prioritization | Should engineering proceed to **WP-SAAS-BRAND-002** (Branding Config) or **WP-ARCH-CONF-001** (Code Conformance Audit)? | Recommended: Proceed to **WP-ARCH-CONF-001** first to ensure code compliance before new UI configuration. |
| **PO-REQ-02** | Legacy Firebase Clean-up | `src/lib/firebase/` contains historical prototype files marked deprecated. Should they be deleted in a future maintenance WP? | Recommended: Schedule clean-up work package when convenience permits. |
| **PO-REQ-03** | Custom Domain Architecture | Should custom domain SSL termination run via Vercel Domains API or custom Cloudflare proxy? | Recommended: Finalize in `WP-SAAS-DOMAIN-001`. |

---

## 8. Next Recommended Work Package

### **WP-ARCH-CONF-001: APPLICATION ARCHITECTURE CONFORMANCE AUDIT**
- **Objective:** Perform an automated & static analysis audit comparing application source code implementation against the Master Source-of-Truth established in `WP-ARCH-001`.
- **Status:** **PLANNED / AWAITING PRODUCT OWNER AUTHORIZATION**.
