# WP-SAAS-SUBSCRIPTION-ENTITLEMENT-DISCOVERY-001
# SUBSCRIPTION, PACKAGE, ADD-ON & ENTITLEMENT ARCHITECTURE DISCOVERY REPORT
## Comprehensive Forensic Audit & Capability Foundation for MA'HAD MANAGER

**Document Identifier**: `WP-SAAS-SUBSCRIPTION-ENTITLEMENT-DISCOVERY-001-REPORT`  
**Work Package ID**: `WP-SAAS-SUBSCRIPTION-ENTITLEMENT-DISCOVERY-001`  
**Author**: Senior Software Architect / SaaS Subscription Architect / Security Reviewer  
**Classification**: READ-ONLY ARCHITECTURAL DISCOVERY & FORENSIC AUDIT  
**Date**: 2026-09-13  
**Target Initial Scale**: ±10 Pesantren / Tenants (Scalable to 50–100)  
**Status**: DISCOVERY COMPLETE (READY FOR ARCHITECTURE REVIEW)  

---

## 1. Executive Summary

This report establishes the empirical, forensic discovery baseline for the **Subscription, Package, Add-on, and Entitlement Architecture** of MA'HAD MANAGER.

### Primary Forensic Conclusion
The current repository contains **ZERO persistent subscription, package, add-on, capability, or entitlement models** in either the database schema or backend domain services:
1. **Packages**: Represented only as static visual mock cards in `src/app/dashboard/saas/paket-billing/page.tsx` and an unstructured string (`'Pro SaaS'`) written into audit log JSON metadata during tenant provisioning.
2. **Subscriptions**: Entirely absent from the database. There is no `subscriptions` table, no billing cycle tracking, no renewal dates, and no grace period logic.
3. **Add-ons**: An interface `TenantModulesConfig` exists in `tenant-provisioning-service.ts`, but line 510 explicitly documents that modules are unpersisted and deferred due to lack of a database column.
4. **Module Toggles**: `src/app/dashboard/saas/modul-fitur/page.tsx` manages toggles exclusively in volatile client React state (`tenantsMap`). Toggling a module has **zero backend enforcement** on any API route or service.
5. **Billing**: Flip webhook integration exists for student tuition (SPP) and Digiflazz for PPOB, but **zero billing infrastructure exists for SaaS tenant subscriptions**.

### Strategic Significance
This clean-slate reality is an **immense architectural advantage**. There is no legacy billing debt, no convoluted schema migrations, and no entrenched multi-tier pricing hacks. The project can design a hardened, unified, and normalized Subscription & Entitlement engine clean-slate, establishing the authoritative server-side gate before Tenant Website CMS, Moodle LMS, and Native Mobile clients are built.

---

## 2. Scope

### In-Scope (Forensically Audited)
- Inspection of all source files, schemas, and routes referencing packages, plans, subscriptions, add-ons, modules, feature flags, and billing.
- Empirical query of the live Supabase PostgreSQL database to inventory active tables and columns.
- Evaluation of tenant lifecycle states (`active`, `suspended`, `trial`) against authorization services.
- Mapping of the critical separation between Tenant Entitlements (commercial licensing) and User RBAC (operational permissions).
- Assessment of integration readiness for Website CMS, Moodle LMS, and Native Mobile clients.
- Definition of candidate data models, entitlement resolution algorithms, data ownership matrices, and risk registers.

### Out-of-Scope (Strictly Enforced Safety Boundaries)
- **ZERO source code modifications** performed.
- **ZERO database migrations** executed or generated.
- **ZERO schema mutations** or table creations.
- **ZERO database data alterations** (read-only queries strictly used).
- **ZERO dependency additions** in `package.json`.
- **ZERO git commits, pushes, or deployments**.

---

## 3. Strategic Baseline

From the authoritative Architecture Rebaseline (`WP-PLATFORM-ARCHITECTURE-REBASELINE-001`):
1. **Web Platform Supremacy**: Web is the primary and comprehensive administration platform.
2. **Desktop Native Dropped**: Desktop operates via web browser; no native desktop binaries.
3. **Tenant Website CMS is Web-Only**: Administered on Web, rendered responsively on public subdomains.
4. **Moodle LMS is External**: Connected via OIDC SSO; never merged into the core codebase.
5. **Native Mobile (Android & iOS)**: Deferred high-mobility client for Asatidz, Wali, and Santri.
6. **Entitlement is the Mandatory Prerequisite**: Must be implemented before CMS, Moodle, and Mobile.
7. **Zero Client Authority**: UI toggles are aesthetic controls; server-side entitlement is the sole authority.
8. **Modular Add-ons**: Add-ons can be purchased independently to grant capabilities (e.g., `Basic Plan + LMS Add-on = education.lms ENABLED`).
9. **Target Scale**: Initial launch is ±10 pesantren. Avoid premature microservices or multi-cluster orchestration.

---

## 4. Repository Evidence

| Area | File Inspected | Line Number / Evidence | Reality Classification |
|---|---|---|---|
| **Package Mock UI** | `src/app/dashboard/saas/paket-billing/page.tsx` | Lines 78–130: Hardcoded cards for Starter, Pro, Enterprise; empty `mockInvoicesList` | **MOCK ONLY** |
| **Tenant Provisioning Plan** | `src/modules/saas/services/tenant-provisioning-service.ts` | Line 190: `cleanPlan = input.plan \|\| 'Pro SaaS'`; Line 367: written only to `audit_logs.details.metadata.plan` | **PARTIAL / LOG ONLY** |
| **Plan Column Omission** | `src/modules/saas/services/tenant-provisioning-service.ts` | Line 504: `plan: undefined, // Plan persistence is deferred to WP-SAAS-SUB-001 (no canonical schema column)` | **MISSING** |
| **Module Flags Omission** | `src/modules/saas/services/tenant-provisioning-service.ts` | Line 510: `modules: undefined, // Module/feature flags are deferred to WP-SAAS-ADDON-001 (no canonical schema column)` | **MISSING** |
| **Module Toggle Mock UI** | `src/app/dashboard/saas/modul-fitur/page.tsx` | Lines 30–40: `modulesCatalog` (`m1`–`m9`); Lines 45–76: `tenantsMap` stored in React `useState` | **MOCK ONLY** |
| **Public Registration Plan** | `src/app/api/saas/register/route.ts` | Line 200: Hardcoded `plan: 'Pro SaaS'` passed to provisioning service | **MOCK / HARDCODED** |
| **Legacy Subscription Utility** | `src/lib/config/subscription.ts` | Lines 13–41: Firestore document event listener for `appConfigService`; zero SaaS billing logic | **LEGACY (IRRELEVANT)** |
| **SPP Tuition Billing** | `src/app/api/webhooks/flip/route.ts` | Lines 27–49: Processes Flip callbacks for student tuition `invoices`; not SaaS tenant billing | **EXISTING (TENANT ONLY)** |
| **PPOB Digital Billing** | `src/app/api/webhooks/platform-pg/route.ts` | Lines 20–60: Processes Digiflazz callbacks for electricity/pulsa; not SaaS tenant billing | **EXISTING (PPOB ONLY)** |
| **Database Schema** | `src/lib/db/schema.ts` | Lines 4–12: `tenants` table has only 7 columns (`id`, `name`, `slug`, `domain`, `status`, `created_at`, `updated_at`) | **EXISTING (NO SUB/PLAN)** |
| **Live PostgreSQL Audit** | Live Supabase Database Query | 32 total tables in `public` schema. Zero tables for packages, plans, subscriptions, addons, or entitlements | **EMPIRICAL PROOF (MISSING)** |

---

## 5. Package Audit (Audit Area A)

### Status: **MOCK / UNPERSISTED**

### Evaluation of Specific Audit Questions:
1. **Is package persistent?**  
   **NO**. There is no `packages` or `plans` table in PostgreSQL.
2. **Does package have pricing?**  
   **NO**. Pricing exists only as static UI text strings in `paket-billing/page.tsx` (e.g., `Rp 1.000.000 /bulan`).
3. **Does package have billing periods?**  
   **NO**. Hardcoded as `/bulan` in UI text.
4. **Does package have capabilities?**  
   **NO**. There is no link between package names and capability tokens.
5. **Does package have modules?**  
   **NO**. Modules in `paket-billing/page.tsx` are unlinked bullet points in JSX.
6. **Can package be modified by Super Admin?**  
   **NO**. Modifying tier details in the UI mutates nothing on the server.
7. **Can package be cloned?**  
   **NO**. No cloning service exists.
8. **Does tenant store chosen package?**  
   **NO**. The `tenants` table has no `plan` or `package_id` column. The plan string is lost after provisioning (retained only in audit log text).
9. **Is package the source of truth?**  
   **NO**. It does not exist as a system of record.

---

## 6. Subscription Audit (Audit Area B)

### Status: **MISSING / NOT IMPLEMENTED**

### Forensic Findings:
- There is **no `tenant_subscriptions` table** in PostgreSQL.
- There is no start date (`current_period_start`), end date (`current_period_end`), trial period, renewal schedule, or price snapshot associated with any tenant.
- The lifecycle states `TRIAL`, `ACTIVE`, `PAST_DUE`, `GRACE_PERIOD`, `SUSPENDED`, and `CANCELLED` do not exist as an evaluated state machine.
- `src/lib/config/subscription.ts` is an observer pattern for Firestore configuration data (`appConfigService.subscribe`), which is legacy code and completely unrelated to SaaS billing subscriptions.

---

## 7. Add-on Audit (Audit Area C)

### Status: **MOCK / CANDIDATE ONLY**

### Forensic Findings:
- The concept of modular Add-ons exists only as a TypeScript interface in `tenant-provisioning-service.ts`:
  ```typescript
  export interface TenantModulesConfig {
    paymentGateway?: boolean;
    waGateway?: boolean;
    rfidGate?: boolean;
    posKantin?: boolean;
    uksKesehatan?: boolean;
    gdriveStorage?: boolean;
    questKarakter?: boolean;
  }
  ```
- Line 510 of `tenant-provisioning-service.ts` explicitly confirms:
  ```typescript
  modules: undefined, // Module/feature flags are deferred to WP-SAAS-ADDON-001 (no canonical schema column)
  ```
- There is no database table for add-ons (`platform_addons`, `tenant_addons`).
- The formula $\text{Package} + \text{Add-on} = \text{Entitlement}$ is currently an architectural candidate, not an executable system.

---

## 8. Module / Feature Toggle Audit (Audit Area D)

### Status: **MOCK / UNENFORCED**

### Evaluation of Specific Audit Questions:
1. **Where is toggle stored?** In volatile React component state (`tenantsMap` in `src/app/dashboard/saas/modul-fitur/page.tsx`).
2. **Is it database?** **NO**.
3. **Is it local state?** **YES**.
4. **Is it configuration?** Static mock array `modulesCatalog` (`m1` to `m9`).
5. **Is it mock?** **YES**.
6. **Is it used by backend?** **NO**.
7. **Is it used by API?** **NO**.
8. **Is it used only by UI?** **YES**.

### CRITICAL ARCHITECTURAL WARNING:
Toggling a module switch in `modul-fitur/page.tsx` renders a visual toast notification ("*Modul BERHASIL DIAKTIFKAN*"), but **sends zero HTTP requests to the backend** and **persists zero changes to PostgreSQL**. Downstream API routes (e.g., `/api/gate/scan-in`, `/api/canteen/pay`) execute without checking any module flag.

---

## 9. Billing Audit (Audit Area E)

### Status: **PARTIAL (TENANT OPERATIONS) / MISSING (SAAS PLATFORM)**

| Billing Subsystem | Provider / Implementation | Scope / Purpose | Reality Classification |
|---|---|---|---|
| **SPP Tuition Fees** | Flip for Business (`src/app/api/webhooks/flip/route.ts`) | Wali Santri pays tuition to the Pesantren | **IMPLEMENTED (TENANT DOMAIN)** |
| **PPOB Digital Goods** | Digiflazz (`src/app/api/webhooks/platform-pg/route.ts`) | Wali Santri buys electricity/pulsa | **IMPLEMENTED (PPOB DOMAIN)** |
| **SaaS Subscription Billing**| None (Zero provider integration) | Pesantren pays Ma'had Manager for SaaS | **MISSING / NOT IMPLEMENTED** |
| **Invoice Generation** | `invoices` table exists for student SPP only | Student billing only; no tenant SaaS billing | **MISSING FOR SAAS PLATFORM** |

### Empirical Finding:
There is currently **no canonical SaaS payment provider** (e.g., Midtrans, Xendit, or manual bank transfer invoicing) for collecting platform subscription fees from pesantren institutions.

---

## 10. Tenant Lifecycle Audit (Audit Area F)

### Status: **STANDALONE / DISCONNECTED FROM SUBSCRIPTIONS**

1. **Database Representation**:
   In `src/lib/db/schema.ts` line 9, column `tenants.status` is defined as:
   ```typescript
   status: text('status').default('active').notNull(), // 'active' | 'suspended' | 'trial'
   ```
2. **Evaluation in Authorization Service**:
   In `src/lib/authz/authorization-service.ts` lines 70–79:
   ```typescript
   if (tenantRows.length === 0 || tenantRows[0].status.toLowerCase() !== 'active') {
     return {
       authorized: false,
       decision: 'DENIED_TENANT_INACTIVE',
       userId,
       tenantId,
       effectivePermissions: new Set(),
       reason: `Tenant ${tenantId} is inactive, suspended, or missing`,
     };
   }
   ```
3. **Defect / Lifecycle Drift**:
   Notice that `authorization-service.ts` strictly checks `!== 'active'`. If a tenant's status is set to `'trial'`, the system currently returns `DENIED_TENANT_INACTIVE` and denies all user access!
4. **Lifecycle Independence**:
   Tenant status stands completely alone. It is not connected to payment status, invoice settlement, or subscription period dates.

---

## 11. Entitlement Audit (Audit Area G)

### Status: **MISSING**

There is currently **no entitlement checking logic** in any server component, API route, server action, or repository. Once a tenant is `'active'`, every user with the `ADMIN` role can access all 52 tenant permissions regardless of whether the pesantren has paid for the underlying modules.

---

## 12. Capability Audit (Audit Area H)

### Status: **MISSING / CANDIDATE**

The platform has not yet registered canonical capability tokens in code or database. A standardized capability token catalog must be established (e.g., `core.santri`, `education.lms`, `hardware.rfid_gate`, `personal.prayer_time`, `website.cms`).

---

## 13. RBAC vs Entitlement Analysis (Audit Area I)

The platform currently possesses an enterprise-grade, hardened RBAC engine, but lacks an Entitlement layer. The boundary between these two domains must remain strictly decoupled:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TWO-TIER ACCESS CONTROL                         │
│                                                                        │
│   TIER 1: TENANT ENTITLEMENT                   TIER 2: USER RBAC       │
│   (Commercial Licensing Gate)                  (Operational Gate)      │
│                                                                        │
│   "Does Pesantren Al-Fatih                     "Does Ustadz Ahmad      │
│    have the license for                        have permission to      │
│    education.lms?"                             grade assignments?"     │
│                                                                        │
│            │                                           │               │
│            ▼                                           ▼               │
│   [checkTenantEntitlement]                    [requirePermission]      │
│                                                                        │
│            └─────────────────────┬─────────────────────┘               │
│                                  │                                     │
│                                  ▼                                     │
│                           EFFECTIVE ACCESS                             │
│                  (Both conditions must be TRUE)                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Access Decision Truth Table:
| Tenant Entitled for Capability? | User Has RBAC Permission? | Resulting Access | System Behavior |
|---|---|---|---|
| **NO** | **NO** | **DENIED** | `403 Forbidden` (`CAPABILITY_NOT_ENTITLED`) |
| **NO** | **YES** | **DENIED** | `403 Forbidden` (`CAPABILITY_NOT_ENTITLED`) |
| **YES** | **NO** | **DENIED** | `403 Forbidden` (`PERMISSION_DENIED`) |
| **YES** | **YES** | **GRANTED** | Action Executes Successfully |

---

## 14. CMS Integration Readiness (Audit Area J)

1. **Existing Reusable Foundation**:
   - `src/app/api/tenant/branding/route.ts` provides a working GET/PUT API for 7 branding fields (`loginTitle`, `loginSubtitle`, `loginDescription`, `customLogoUrl`, `customBgUrl`, `primaryColor`, `tagline`).
   - `src/components/portal/*` contains 8 production-grade public section components.
2. **Missing Entitlement Controls**:
   - There is no capability gating for CMS features.
   - Future capabilities to control via entitlement:
     - `website.cms_basic` (Default sections, subdomain hosting)
     - `website.custom_domain` (Connecting `pesantren.sch.id`)
     - `website.articles_unlimited` (News and publications)

---

## 15. Moodle Integration Readiness (Audit Area K)

1. **Current Status**: **ZERO IMPLEMENTATION**.
2. **Entitlement Requirement**:
   - Moodle LMS access must be gated by the `education.lms` capability token.
   - When a tenant purchases the Moodle Add-on, the server provisions a dedicated container (`lms-[slug].madev.id`) and enables OIDC SSO.
   - If the subscription lapses into `SUSPENDED`, the container is stopped and OIDC login is blocked at the gateway.

---

## 16. Mobile Integration Readiness (Audit Area L)

1. **Current Status**: **DEFERRED**.
2. **Entitlement Requirement**:
   - The native mobile app (Flutter Android/iOS) must not duplicate entitlement logic.
   - Upon authentication, the mobile client calls `GET /api/me/entitlements` to receive a list of active capabilities for the current tenant.
   - Modules with unentitled capabilities (e.g., `personal.prayer_focus` or `hardware.canteen_pos`) are disabled or hidden gracefully in the mobile UI.

---

## 17. API / Domain Enforcement Readiness (Audit Area M)

### Architectural Decision:
- **DO NOT create a separate API Gateway microservice**.
- The entitlement check must be implemented as a **reusable domain utility** inside Next.js (e.g., `checkTenantEntitlement(tenantId, capability)`), directly callable by:
  1. Route Handlers (`src/app/api/*`)
  2. Server Actions
  3. UI layout server components
  4. Proxy middleware (`src/proxy.ts`)

---

## 18. Database Evidence (Audit Area N)

An empirical read-only query of `information_schema.tables` in the live Supabase PostgreSQL database revealed:
- **Total Tables**: 32.
- **Candidate Tables Checked**:
  - `packages`: **NOT FOUND**
  - `plans`: **NOT FOUND**
  - `subscriptions`: **NOT FOUND**
  - `subscription_items`: **NOT FOUND**
  - `addons` / `add_ons`: **NOT FOUND**
  - `tenant_addons`: **NOT FOUND**
  - `tenant_subscriptions`: **NOT FOUND**
  - `entitlements` / `tenant_entitlements`: **NOT FOUND**
  - `capabilities`: **NOT FOUND**
  - `modules`: **NOT FOUND**
  - `feature_flags`: **NOT FOUND**
- **Existing `tenants` Columns**: `id`, `name`, `slug`, `domain`, `status`, `created_at`, `updated_at`. (Zero plan or module columns).

---

## 19. Data Ownership Matrix (Audit Area O)

| Entity / Concept | Authoritative Owner | Tenant-Scoped? | Source of Truth (SoT) |
|---|---|---|---|
| **Package Catalog** | **PLATFORM** | NO (Global) | `platform_packages` (PostgreSQL) |
| **Capability Catalog** | **PLATFORM** | NO (Global) | `platform_capabilities` (Code / DB) |
| **Add-on Catalog** | **PLATFORM** | NO (Global) | `platform_addons` (PostgreSQL) |
| **Tenant Subscription** | **PLATFORM** | **YES** (`tenant_id`) | `tenant_subscriptions` (PostgreSQL) |
| **Subscription Items / Add-ons**| **PLATFORM** | **YES** (`tenant_id`) | `tenant_subscription_addons` (PostgreSQL) |
| **Tenant Entitlement Overrides**| **PLATFORM** | **YES** (`tenant_id`) | `tenant_entitlement_overrides` (PostgreSQL) |
| **SaaS Invoices** | **PLATFORM** | **YES** (`tenant_id`) | `saas_billing_invoices` (PostgreSQL) |
| **Tenant Operational Settings** | **TENANT** | **YES** (`tenant_id`) | `tenant_settings` (PostgreSQL) |
| **Student SPP Invoices** | **TENANT** | **YES** (`tenant_id`) | `invoices` (PostgreSQL) |
| **Tenant Roles & RBAC** | **TENANT** | **YES** (`tenant_id`) | `tenant_roles`, `tenant_role_permissions` |

---

## 20. Business Rules (Audit Area P)

| Business Rule | Classification | Description & Policy Constraint |
|---|---|---|
| **Mandatory Package** | **CANDIDATE** | Every tenant must have an active subscription record; new tenants receive a default Trial package. |
| **Trial Duration** | **OPEN DECISION**| Recommended: 14 days or 30 days trial from self-registration date. |
| **Subscription Grace Period**| **CANDIDATE** | Recommended: 14 days past due where web portal shows payment warning banner before access is restricted. |
| **Suspension Policy** | **CANDIDATE** | Expired subscriptions place tenant into read-only mode; data is **never destroyed**. |
| **Add-on Coupling** | **LOCKED** | Add-ons can only be active if the base tenant subscription is in `ACTIVE` or `TRIAL` status. |
| **Super Admin Override** | **CANDIDATE** | Super Admin can grant a manual capability override to a tenant without altering their commercial package. |

---

## 21. Security Analysis (Audit Area Q)

| Security Aspect | Current Codebase Reality | Target Hardened State | Risk Level |
|---|---|---|---|
| **Client Parameter Spoofing** | Public registration accepts `plan: 'Pro SaaS'` from client (sanitized server-side) | Server sets default Trial plan; client payload cannot specify active package | **LOW (Current) $\rightarrow$ HARDENED** |
| **UI Toggle Bypass** | Module toggles in `modul-fitur/page.tsx` are unpersisted client state | API route checks `checkTenantEntitlement` server-side; client toggles cannot bypass | **CRITICAL (Current) $\rightarrow$ HARDENED** |
| **Cross-Tenant Entitlement Leak** | No entitlement checks exist | Entitlements strictly scoped to `tenant_id` via server-derived context | **HIGH (Current) $\rightarrow$ HARDENED** |
| **Direct Database Mutation** | Supabase Service Role key guarded on server | Row-Level Security (RLS) policies prevent cross-tenant writes | **HARDENED** |

---

## 22. Architecture Drift Analysis (Audit Area S)

| Area | Stated Architecture / Documentation | Actual Codebase Implementation | Drift Classification | Impact / Recommendation |
|---|---|---|---|---|
| **Pricing Plans** | Documented as active billing tiers | Hardcoded visual UI mock in `paket-billing` | **MAJOR DRIFT** | Build canonical `platform_packages` table |
| **Feature Flags / Modules** | Documented as per-tenant module engine | Unpersisted React state in `modul-fitur` | **MAJOR DRIFT** | Build canonical `platform_capabilities` catalog |
| **Tenant Plan Storage** | Implied stored on tenant record | Discarded after provisioning; written to audit log | **MAJOR DRIFT** | Create `tenant_subscriptions` foreign key |
| **Tenant Trial Status** | `tenants.status = 'trial'` supported | `authorization-service.ts` treats `'trial'` as inactive | **MINOR DRIFT** | Update `authorization-service.ts` to allow `'trial'` |
| **Subscription Config** | `src/lib/config/subscription.ts` exists | Legacy Firestore observer, not SaaS billing | **MINOR DRIFT** | Deprecate and isolate legacy file |

---

## 23. Candidate Data Model (Audit Area T)

To establish a hardened, normalized, and scalable foundation for 10 $\rightarrow$ 100+ tenants:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CANDIDATE SCHEMA MODEL                          │
│                                                                        │
│   ┌────────────────────────┐              ┌────────────────────────┐   │
│   │   platform_packages    │              │    platform_addons     │   │
│   ├────────────────────────┤              ├────────────────────────┤   │
│   │ id (PK)                │              │ id (PK)                │   │
│   │ code (UNIQUE)          │              │ code (UNIQUE)          │   │
│   │ name                   │              │ name                   │   │
│   │ price_monthly          │              │ price_monthly          │   │
│   │ max_santri_quota       │              │ is_active              │   │
│   └───────────┬────────────┘              └───────────┬────────────┘   │
│               │                                       │                │
│               │ 1:N                                   │ 1:N            │
│               ▼                                       ▼                │
│   ┌────────────────────────┐              ┌────────────────────────┐   │
│   │  package_capabilities  │              │   addon_capabilities   │   │
│   ├────────────────────────┤              ├────────────────────────┤   │
│   │ package_id (FK)        │              │ addon_id (FK)          │   │
│   │ capability_code (FK)   │              │ capability_code (FK)   │   │
│   └───────────┬────────────┘              └───────────┬────────────┘   │
│               │                                       │                │
│               └───────────────────┬───────────────────┘                │
│                                   ▼                                    │
│                       ┌────────────────────────┐                       │
│                       │ platform_capabilities  │                       │
│                       ├────────────────────────┤                       │
│                       │ code (PK)              │                       │
│                       │ name                   │                       │
│                       │ module_group           │                       │
│                       │ description            │                       │
│                       └────────────────────────┘                       │
│                                   ▲                                    │
│                                   │                                    │
│               ┌───────────────────┴───────────────────┐                │
│               │                                       │                │
│   ┌───────────┴────────────┐              ┌───────────┴────────────┐   │
│   │  tenant_subscriptions  │              │tenant_subscription_    │   │
│   │                        │              │        addons          │   │
│   ├────────────────────────┤              ├────────────────────────┤   │
│   │ id (PK)                │ 1:N          │ id (PK)                │   │
│   │ tenant_id (FK)         │─────────────▶│ subscription_id (FK)   │   │
│   │ package_id (FK)        │              │ addon_id (FK)          │   │
│   │ status (ENUM)          │              │ is_active              │   │
│   │ current_period_start   │              └────────────────────────┘   │
│   │ current_period_end     │                                           │
│   │ trial_end_at           │                                           │
│   └────────────────────────┘                                           │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Entities:
1. `platform_capabilities`: Master dictionary of system capabilities (`core.santri`, `education.lms`, `website.cms`).
2. `platform_packages`: Commercial product tiers (`starter`, `pro`, `enterprise`).
3. `platform_addons`: Modular add-ons (`addon_moodle_lms`, `addon_wa_gateway`).
4. `tenant_subscriptions`: The active commercial contract binding a `tenant_id` to a `package_id`.
5. `tenant_subscription_addons`: Active add-ons associated with the tenant's subscription.
6. `tenant_entitlement_overrides`: (Optional) Manual platform-granted capability overrides.

---

## 24. Candidate Entitlement Resolution Model

### Deterministic Calculation Algorithm:
$$\text{Effective Capabilities}(tenantId) = \begin{cases} 
\emptyset & \text{if subscription is MISSING or SUSPENDED} \\
(Caps_{package} \cup Caps_{active\_addons} \cup Caps_{overrides}) & \text{if subscription is ACTIVE, TRIAL, or GRACE\_PERIOD}
\end{cases}$$

### Caching Strategy:
- Compute effective capabilities on demand and cache in memory (Redis or Next.js React cache/memory) keyed by `tenant_id`.
- Invalidate cache when:
  1. Subscription status changes (renewal, expiry, payment).
  2. Add-on is purchased or cancelled.
  3. Super Admin modifies entitlement overrides.

---

## 25. Integration Dependency Map

```text
                     TENANT PROVISIONING
                              │ (Creates default Trial subscription)
                              ▼
                     TENANT SUBSCRIPTION
                              │ (Resolves active capabilities)
                              ▼
                    EFFECTIVE ENTITLEMENTS
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
     WEBSITE CMS          MOODLE LMS          NATIVE MOBILE
  (Enables Custom      (Provisions Moodle   (Exposes Entitled
   Domains / SEO)       Container & SSO)     Modules on App)
```

---

## 26. Risks

| Risk ID | Description | Severity | Likelihood | Mitigation Strategy |
|---|---|---|---|---|
| **RSK-SUB-001** | **Premature Billing Integration**: Trying to integrate recurring credit card billing before packaging is stabilized. | High | High | Support manual transfer invoicing for initial 10 pilot pesantren. |
| **RSK-SUB-002** | **Accidental Lockout of Trial Tenants**: `authorization-service.ts` rejecting tenants marked as `'trial'`. | Medium | High | Update tenant status validation to allow `'active'` and `'trial'`. |
| **RSK-SUB-003** | **Performance Bottleneck from Dynamic Checks**: Re-evaluating capabilities on every SQL query. | Medium | Medium | Cache computed capabilities in memory with tenant-level invalidation. |
| **RSK-SUB-004** | **Unentitled Module Leakage**: Client displaying unentitled routes or navigation links. | Low | Medium | Implement `<EntitlementGate>` component on Web navigation. |

---

## 27. Open Decisions

1. **Initial Packaging Matrix**: Exactly which capabilities belong to Starter, Pro, and Enterprise?
2. **Trial Policy**: How many days of free trial are granted to newly provisioned self-registration tenants? (Recommended: 14 days).
3. **Payment Collection for Initial 10 Tenants**: Manual bank transfer invoice vs automated Payment Gateway (Flip / Xendit)?
4. **Moodle Add-on Pricing**: Is Moodle LMS bundled into the Enterprise tier or sold strictly as a standalone monthly add-on?

---

## 28. Recommended Next Work Package

### Verdict: **READY TO PROCEED TO ARCHITECTURE SPECIFICATION**

The project is fully prepared to enter the architectural design and schema specification phase:
- **Recommended Next Work Package**:  
  **`WP-SAAS-SUBSCRIPTION-ENTITLEMENT-ARCHITECTURE-001`**
- **Objective**: Formulate the formal Drizzle ORM schema definitions, migration script, and `checkTenantEntitlement()` domain service design without implementing external payment gateways.

---

## 29. Final Verdict

The forensic discovery conclusively proves that **MA'HAD MANAGER currently has zero backend subscription, package, add-on, or entitlement architecture**. Existing billing and module pages are purely visual client-side mocks.

Because the underlying RBAC engine (52 permissions) and tenant isolation proxy are already rock-solid and verified at runtime, the platform is in an ideal, debt-free position to build a clean, hardened Subscription and Entitlement foundation.

---

## STATUS

WP:  
**WP-SAAS-SUBSCRIPTION-ENTITLEMENT-DISCOVERY-001**

MODE:  
**READ-ONLY DISCOVERY**

STATUS:  
**PASS**

SOURCE CHANGES:  
**NONE**

DATABASE CHANGES:  
**NONE**

MIGRATION:  
**NONE**

DEPENDENCIES:  
**NONE**

COMMIT:  
**NONE**

PUSH:  
**NONE**

DEPLOY:  
**NONE**

REPORT:  
`docs/architecture/WP-SAAS-SUBSCRIPTION-ENTITLEMENT-DISCOVERY-001-REPORT.md`

ARCHITECTURE READINESS:  
**READY FOR ARCHITECTURE REVIEW**

TOP 5 FINDINGS:  
1. Zero persistent subscription, package, add-on, or entitlement tables exist in PostgreSQL (empirically verified: 32 active tables, 0 billing/subscription tables).
2. Existing billing tier page (`paket-billing/page.tsx`) and module toggle page (`modul-fitur/page.tsx`) are purely unpersisted visual UI mocks.
3. Tenant provisioning receives a `plan` string and `modules` config, but discards them without storing them in database columns (recorded only in audit logs).
4. `authorization-service.ts` strictly rejects any tenant whose status is not `'active'`, currently preventing trial tenant access.
5. Tuition billing (SPP via Flip) and PPOB digital goods (via Digiflazz) exist for student operations, but zero billing infrastructure exists for SaaS tenant subscriptions.

TOP 5 OPEN DECISIONS:  
1. Capability Matrix: Define the exact capabilities assigned to Starter, Pro, and Enterprise packages.
2. Trial Duration: Confirm whether self-registered tenants receive a 14-day or 30-day trial period.
3. SaaS Payment Flow: Determine whether the initial 10 pilot pesantren use manual invoice transfers or automated payment gateway.
4. Moodle Monetization: Confirm whether Moodle LMS is an exclusive Add-on or bundled into the Enterprise tier.
5. Invalidation Pattern: Confirm memory caching vs database query pattern for `checkTenantEntitlement()`.

RECOMMENDED NEXT WP:  
**`WP-SAAS-SUBSCRIPTION-ENTITLEMENT-ARCHITECTURE-001`**

STOP.
