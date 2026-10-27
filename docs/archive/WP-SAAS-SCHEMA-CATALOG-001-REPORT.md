# WP-SAAS-SCHEMA-CATALOG-001
# READ-ONLY DISCOVERY & SCHEMA ARCHITECTURE REPORT
## SaaS Commercial Foundation, Normalized Catalog, Subscription History, Referral Ledger & Lifecycle Schema for MA'HAD MANAGER

**Document Identifier**: `WP-SAAS-SCHEMA-CATALOG-001-REPORT`  
**Work Package ID**: `WP-SAAS-SCHEMA-CATALOG-001`  
**Phase**: AUDIT → ANALYSIS → PROPOSAL → VALIDATION → STOP  
**Author**: Senior SaaS Database Architect / Multi-Tenant Reviewer / Subscription & Billing Domain Architect  
**Classification**: READ-ONLY DISCOVERY & SCHEMA ARCHITECTURE SPECIFICATION  
**Date**: 2026-09-14  
**Status**: COMPLETE (READY FOR PRODUCT OWNER AUTHORIZATION)  
**Target Initial Scale**: ±10 Pesantren / Tenants (Engineered for 50–100 tenants without microservices)  

---

## 1. Executive Summary

This report establishes the complete, production-grade **Database and Catalog Architecture** for the commercial SaaS foundation of MA'HAD MANAGER.

Executing the strict discovery and schema design directives of `WP-SAAS-SCHEMA-CATALOG-001`, this audit confirms that **zero persistent subscription, catalog, pricing, referral, or entitlement tables currently exist** in the live PostgreSQL database or Drizzle ORM schema. 

To bridge this foundational gap, this specification proposes a normalized, immutable, versioned, and multi-tenant isolated schema model encompassing:
1. **Platform-Owned Commercial Catalogs**: Packages, decoupled versioned prices, capabilities, add-ons, and add-on pricing.
2. **Tenant-Owned Subscription Ledgers**: Multi-row subscription history per tenant with PostgreSQL partial unique indexing guaranteeing at most one active commercial agreement.
3. **Point-in-Time Price & Period Snapshotting**: Complete historical protection of agreed prices on subscriptions and immutable JSON line-item snapshots on invoices.
4. **Automated Billing Lifecycle Parameters**: Database-driven configuration for 14-day trials, 3-day past-due windows, 5-day grace periods, non-destructive suspension, and 3-day existing tenant courtesy duration.
5. **Referral Program Ledger**: Structured relationship tracking, monthly billing credit ledgers (Rp 50.000/mo), and qualification contingent on active subscriber status.
6. **Existing Tenant Transition Support**: Flexible, non-disruptive schema accommodating Courtesy, Trial Reset, and Manual Contract assignments without data loss.

---

## 2. Scope

### In-Scope (Forensically Audited & Designed)
- Empirical audit of all current schema files in `src/lib/db/schema/` and migrations in `drizzle/`.
- Forensic search across `src/`, `tests/`, and `docs/` for hardcoded commercial values (pricing, trial duration, grace periods, referral rewards).
- Complete entity catalog definition with types, PKs, FKs, unique constraints, partial indexes, nullability, ownership, and idempotency keys.
- Mathematical mapping of Package $\rightarrow$ Price $\rightarrow$ Subscription $\rightarrow$ Price Snapshot $\rightarrow$ Entitlement $\rightarrow$ Capability $\rightarrow$ Feature.
- Comprehensive Gap Matrix mapping existing vs target state across 21 critical functional areas.

### Out-of-Scope (Strictly Enforced Read-Only Rules)
- **Zero source code modifications** performed.
- **Zero database migrations** generated or executed.
- **Zero database mutations** (no `INSERT`, `UPDATE`, `DELETE`, `ALTER TABLE`, or `CREATE TABLE`).
- **Zero package dependencies** added.
- **Zero git commits, pushes, or deployments**.

---

## 3. Business Decisions Used (Locked Baseline)

This architectural proposal adheres strictly to the locked business rules established by the Product Owner:

| Parameter | Locked Business Value | Technical Enforcement in Schema |
| :--- | :--- | :--- |
| **Trial Duration** | **14 Hari** | Stored in `platform_settings.trial_duration_days`. Evaluated once and snapshotted into `tenant_subscriptions.trial_ends_at`. Non-retroactive. |
| **Past Due Window** | **3 Hari** | Stored in `platform_settings.past_due_duration_days`. Active capabilities retained during payment retry window. |
| **Grace Period Window**| **5 Hari** | Stored in `platform_settings.grace_period_duration_days`. Warning window before operational freeze. |
| **Post-Grace Action** | **SUSPEND** | Non-destructive commercial freeze. Database rows, files, and users 100% preserved. |
| **Existing Tenant Treatment** | **Courtesy / Trial Reset / Manual Contract** | Three distinct pathways supported in schema via parameterized migration and contract records. |
| **Courtesy Duration** | **3 Hari** | Stored in `platform_settings.courtesy_duration_days`. Default courtesy window if Courtesy option selected. |
| **Price Snapshotting** | **LOCKED** | `tenant_subscriptions` snapshots `locked_price_amount` and `price_id`. `saas_invoices` stores immutable `line_items_snapshot`. |
| **Renewal Price Policy**| **Configurable (`LOCKED_PRICE` default)** | Stored on `tenant_subscriptions.renewal_policy` (`LOCKED_PRICE`, `CURRENT_CATALOG_PRICE`, `MANUAL_CONTRACT`). |
| **Referral Reward** | **Rp 50.000 / Bulan** | Stored in `platform_settings.referral_reward_monthly`. Configurable nominal. |
| **Referral Reward Type**| **Billing Credit** | Applied as invoice deduction line item in `tenant_referral_credits`. No cash payouts. |
| **Referral Qualification**| **Active Subscription Contingency** | Referral credits generated only while referred tenant status $\in \{\text{'active'}, \text{'trial'}\}$. |
| **Referral Frequency** | **Monthly** | Evaluated and credited once per monthly billing cycle. |
| **Annual Pricing** | **Distinct Catalog Record** | Separate rows in `platform_package_prices` with `billing_interval = 'yearly'`. Never hardcoded `monthly * 12`. |
| **Moodle LMS** | **Optional Add-on** | Modeled as `platform_addons` (`addon.moodle_lms`) granting `education.lms`. Not bundled into core packages. |

---

## 4. Current Architecture Evidence

Inspection of `src/lib/db/schema.ts`, `src/lib/db/schema/identity.ts`, and `drizzle/` establishes the current structural baseline:

```
[Current Core Identity & Settings Architecture]
+----------------------+       +-------------------------+
|   public.tenants     |       | public.tenant_settings  |
|----------------------|       |-------------------------|
| id (PK)              | <---> | id (PK)                 |
| name                 |       | tenant_id (FK, Unique)  |
| slug (Unique)        |       | gdriveServiceAccountJson|
| domain               |       | flipSecretKey           |
| status ('active',    |       | customLogoUrl, etc.     |
|   'suspended',       |       +-------------------------+
|   'trial')           |
+----------------------+
           ^
           | 1:N
           v
+-----------------------------+       +-------------------------+
| public.user_tenant_         |       | public.tenant_roles     |
| memberships                 | <---> |-------------------------|
|-----------------------------|       | id (PK)                 |
| id (PK)                     |       | tenant_id (FK)          |
| user_id (FK -> users.id)    |       | role_code ('ADMIN',etc) |
| tenant_id (FK -> tenants.id)|       +-------------------------+
| primary_role_id (FK)        |                    ^
| status ('ACTIVE', etc.)     |                    | 1:N
+-----------------------------+                    v
                                      +-------------------------+
+-----------------------------+       | public.tenant_role_     |
| public.permissions          | <---> | permissions             |
|-----------------------------|       |-------------------------|
| id (PK, e.g. 'santri.read') |       | tenant_role_id (FK)     |
| code (Unique)               |       | permission_id (FK)      |
| module, scope ('TENANT')    |       +-------------------------+
+-----------------------------+
```

### Key Verified Facts
1. **Identity & RBAC Hardened**: 52 canonical permissions exist in `public.permissions` and are assigned to tenant `ADMIN` roles via `public.tenant_role_permissions`.
2. **Platform Settings Minimal**: `public.platform_settings` contains only company profile contact details (`company_name`, `company_email`, `company_phone`, `company_whatsapp`, `company_website`).
3. **Audit Logging Active**: `public.audit_logs` persists security, provisioning, and administrative events with actor attribution.

---

## 5. Existing Commercial Model

The existing codebase contains **no formal commercial domain model**:
- **Package Selection**: Handled as an unvalidated text string (e.g. `'Pro SaaS'`) in `src/app/api/saas/register/route.ts` line 200, which is passed into `tenantProvisioningService.provisionTenant()`.
- **Database Discard**: `tenantProvisioningService` explicitly comments in line 504: `plan: undefined, // Plan persistence is deferred to WP-SAAS-SUB-001 (no canonical schema column)`.
- **UI Mockery**: Packages are rendered as static JSX pricing cards in `src/app/dashboard/saas/paket-billing/page.tsx` and static HTML select options in `src/app/dashboard/saas/tenants/page.tsx`.
- **Module Flags**: Managed in volatile React component state (`tenantsMap`) in `src/app/dashboard/saas/modul-fitur/page.tsx` with zero backend persistence or enforcement.

---

## 6. Hardcoded Commercial Forensic

A forensic search across the entire codebase reveals the following hardcoded commercial artifacts:

| Location | Line | Value | Classification | Architectural Impact |
| :--- | :---: | :--- | :--- | :--- |
| `src/app/api/saas/register/route.ts` | 200 | `plan: 'Pro SaaS'` | **A. Genuine Business Hardcode** | Bypasses database catalog; must resolve active default package from database. |
| `src/app/dashboard/saas/paket-billing/page.tsx` | 84 | `Rp 1.000.000 /bulan` (Starter) | **B. UI Placeholder** | Static presentation; must bind to `platform_package_prices`. |
| `src/app/dashboard/saas/paket-billing/page.tsx` | 103 | `Rp 2.000.000 /bulan` (Pro) | **B. UI Placeholder** | Static presentation; must bind to `platform_package_prices`. |
| `src/app/dashboard/saas/paket-billing/page.tsx` | 120 | `Rp 3.500.000 /bulan` (Enterprise)| **B. UI Placeholder** | Static presentation; must bind to `platform_package_prices`. |
| `src/app/dashboard/saas/tenants/page.tsx` | 794–797 | `<option value="Starter SaaS">...` | **B. UI Placeholder** | Hardcoded select dropdown in admin tenant creation modal. |
| `src/app/dashboard/saas/tenants/page.tsx` | 551 | `🟡 TRIAL (14 Hari)` | **B. UI Placeholder** | Hardcoded badge; conflates subscription status with duration. |
| `src/modules/saas/services/tenant-provisioning-service.ts` | 60 | `plan?: string` | **D. Legacy/Deferred Contract** | Parameter logged to audit metadata but unpersisted in database. |
| `src/lib/db/schema/finance.ts` | 11 | `dailyLimit: 20000` (Rp 20.000) | **E. Production Operational Logic**| Belongs to Tenant Operational Finance (canteen daily limit), not SaaS platform billing. |
| `src/app/wali/ppob/page.tsx` | 32–37 | `Telkomsel Rp 10.000`, etc. | **E. Production Operational Logic**| PPOB digital goods catalog markup pricing, independent of SaaS platform subscriptions. |

---

## 7. Current Database State

Empirical query of the live Supabase PostgreSQL database (`information_schema.tables`) confirms the exact table inventory:

| Entity Check | Table Name | Status | Evidence |
| :--- | :--- | :---: | :--- |
| 1. Packages | `platform_packages` | **MISSING** | 0 tables matching in `information_schema.tables`. |
| 2. Package Prices | `platform_package_prices` | **MISSING** | 0 tables matching. |
| 3. Subscriptions | `tenant_subscriptions` | **MISSING** | 0 tables matching. |
| 4. Invoices | `saas_invoices` | **MISSING** | 0 tables matching. Only tenant-level SPP invoices exist. |
| 5. Payments | `saas_payments` | **MISSING** | 0 tables matching. Only tenant-level Flip payments exist. |
| 6. Trial State | `tenant_subscriptions.trial_*` | **MISSING** | Only `tenants.status = 'trial'` exists (crude string). |
| 7. Add-ons | `platform_addons` | **MISSING** | 0 tables matching. |
| 8. Entitlements | `tenant_entitlements` | **MISSING** | 0 tables matching. |
| 9. Capabilities | `platform_capabilities` | **MISSING** | 0 tables matching. Only RBAC `permissions` table exists. |
| 10. Module Catalog | `platform_modules` | **MISSING** | 0 tables matching. |
| 11. Referrals | `tenant_referrals` | **MISSING** | 0 tables matching. |
| 12. Subscription History | `tenant_subscriptions` (history)| **MISSING** | 0 tables matching. |
| 13. Price Snapshot | `subscription_price_snapshots` | **MISSING** | 0 tables matching. |
| 14. Renewal Policy | `tenant_subscriptions.renewal_*`| **MISSING** | 0 tables matching. |
| 15. Billing Configuration | `platform_settings.billing_*` | **MISSING** | `platform_settings` has only company contact columns. |

---

## 8. Current Subscription/Billing State

1. **Subscriptions**: Entirely absent. There is no concept of a billing period start date, billing period end date, renewal frequency, or active tier.
2. **Platform Billing**: Zero B2B platform invoicing exists. All existing payment integration is strictly tenant-scoped (B2C Wali Santri tuition payments to the pesantren via Flip credentials stored in `tenant_settings`).

---

## 9. Current Add-on/Entitlement State

1. **Add-ons**: Purely client-side mock switches. Toggling WhatsApp Gateway or RFID Gate in `/dashboard/saas/modul-fitur` changes a boolean in React `useState` (`tenantsMap`) and does not send any network request.
2. **Entitlements**: Non-existent. Route authorization and API guards evaluate only User RBAC permissions via `authorization-service.ts`. If a user has permission `santri.view`, access is granted regardless of what package the tenant has purchased.

---

## 10. Current Referral State

1. **Referral Tracking**: Zero code or database structures exist for tenant referrals.
2. **Billing Credits**: The concept of applying a Rp 50.000 monthly credit to a tenant's SaaS invoice is completely unrepresented in schema and code.

---

## 11. Proposed Domain Model

The proposed commercial architecture organizes 12 normalized entities into four logical domains:

```
+-----------------------------------------------------------------------------------+
|                           1. PLATFORM COMMERCIAL CATALOG                          |
|                                (Platform-Owned)                                   |
+-----------------------------------------------------------------------------------+
|  [platform_packages] (1) <--- (N) [platform_package_prices]                       |
|         |                                                                         |
|         v (N)                                                                     |
|  [package_capabilities] (N) ---> (1) [platform_capabilities]                      |
|                                             ^                                     |
|  [platform_addons] (1) <--- (N) [platform_addon_prices]                           |
|         |                                   |                                     |
|         v (N)                               | (N)                                 |
|  [addon_capabilities] (N) ------------------+                                     |
+-----------------------------------------------------------------------------------+
                                          |
                                          | Referenced by Agreement
                                          v
+-----------------------------------------------------------------------------------+
|                       2. TENANT SUBSCRIPTION & LEDGER                             |
|                                 (Tenant-Owned)                                    |
+-----------------------------------------------------------------------------------+
|  [tenant_subscriptions] (1) <--- (N) [tenant_subscription_addons]                 |
|  - Multi-row historical ledger                                                    |
|  - Partial Unique Index: WHERE status IN ('trial', 'active', 'past_due', 'grace') |
|  - Price Snapshot: locked_price_amount, price_id                                  |
|  - Period Dates: current_period_start, current_period_end, trial_ends_at          |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                           3. SAAS BILLING & INVOICING                             |
|                                 (Tenant-Owned)                                    |
+-----------------------------------------------------------------------------------+
|  [saas_invoices] (1) <--- (N) [saas_payments] (Idempotent by provider_payment_id) |
|  - Frozen JSON line_items_snapshot                                                |
|  - Subtotal, Discount, Referral Credit, Tax, Total                                |
+-----------------------------------------------------------------------------------+
                                          ^
                                          | Applies Credit
+-----------------------------------------------------------------------------------+
|                           4. REFERRAL PROGRAM LEDGER                              |
|                          (Platform & Tenant Cross-Link)                           |
+-----------------------------------------------------------------------------------+
|  [tenant_referrals] (1) <--- (N) [tenant_referral_credits]                        |
|  - Referrer Tenant ID                 - Applied to specific saas_invoices.id      |
|  - Referred Tenant ID (Unique)        - Monthly Rp 50.000 credit ledger           |
|  - Qualification: Active Sub Only     - Unique on (referral_id, billing_month)    |
+-----------------------------------------------------------------------------------+
```

---

## 12. Proposed Entity Catalog

Each proposed entity is specified below following the mandatory catalog format:

### Entity 1: `platform_capabilities`
- **Purpose**: Master registry of all functional, domain, and commercial capabilities that can be licensed to tenants.
- **Ownership**: PLATFORM-OWNED.
- **Primary Key**: `id` (`text`, e.g. `'education.lms'`, `'website.cms_builder'`).
- **Foreign Keys**: None.
- **Unique Constraints**: `code` (`text`, unique).
- **Indexes**: `btree (code)`, `btree (module_group)`.
- **Important Fields**: `id`, `code`, `name`, `module_group` (`'core' | 'academic' | 'finance' | 'hardware' | 'lms' | 'cms' | 'notification'`), `description`, `created_at`.
- **Lifecycle**: Seeded during migration; expanded as new features are engineered; immutable by tenants.
- **Audit Requirement**: Changes to capability definitions logged to `audit_logs`.
- **Idempotency**: Seed operations use `ON CONFLICT (id) DO UPDATE`.
- **Source of Truth**: Database table `public.platform_capabilities`.
- **Status**: PROPOSED (NEW).

### Entity 2: `platform_packages`
- **Purpose**: Commercial package/tier definitions (Starter, Pro, Enterprise) defining baseline capability bundles and scalar quotas.
- **Ownership**: PLATFORM-OWNED.
- **Primary Key**: `id` (`text`, e.g. `'pkg_starter'`, `'pkg_pro'`, `'pkg_enterprise'`).
- **Foreign Keys**: None.
- **Unique Constraints**: `code` (`text`, unique).
- **Indexes**: `btree (code)`, `btree (is_active)`.
- **Important Fields**: `id`, `code`, `name`, `description`, `is_active`, `is_public`, `sort_order`, `quota_limits` (`jsonb`: `maxSantri`, `maxAdminUsers`, `maxBranches`, `storageQuotaMb`), `created_at`, `updated_at`.
- **Lifecycle**: Managed by Super Admin via `/dashboard/saas/pengaturan-global`.
- **Audit Requirement**: All CRUD operations require Super Admin audit trail with before/after delta.
- **Idempotency**: Unique constraint on `code`.
- **Source of Truth**: Database table `public.platform_packages`.
- **Status**: PROPOSED (NEW).

### Entity 3: `platform_package_prices`
- **Purpose**: Decoupled, versioned price points for packages supporting multiple billing intervals (monthly, yearly) and immutable history.
- **Ownership**: PLATFORM-OWNED.
- **Primary Key**: `id` (`text`, `'prc_'` + nanoid).
- **Foreign Keys**: `package_id` $\rightarrow$ `platform_packages.id` (ON DELETE CASCADE).
- **Unique Constraints**: Partial unique index on `(package_id, billing_interval)` WHERE `is_active = true`.
- **Indexes**: `btree (package_id, billing_interval)`, `btree (is_active)`.
- **Important Fields**: `id`, `package_id`, `billing_interval` (`'monthly' | 'yearly'`), `amount` (integer IDR), `currency` (default `'IDR'`), `is_active`, `version` (integer), `effective_from`, `effective_to`, `created_by`, `created_at`, `updated_at`.
- **Lifecycle**: Creating a new price deactivates the previous version (`is_active = false`, `effective_to = NOW()`) and inserts a new version row. Records are never deleted.
- **Audit Requirement**: Audited with actor attribution and mandatory reason text.
- **Idempotency**: Enforced by partial unique index on active prices.
- **Source of Truth**: Database table `public.platform_package_prices`.
- **Status**: PROPOSED (NEW).

### Entity 4: `package_capabilities`
- **Purpose**: Many-to-many junction mapping which capabilities are included in each package tier.
- **Ownership**: PLATFORM-OWNED.
- **Primary Key**: `id` (`text`, nanoid).
- **Foreign Keys**: 
  - `package_id` $\rightarrow$ `platform_packages.id` (ON DELETE CASCADE)
  - `capability_id` $\rightarrow$ `platform_capabilities.id` (ON DELETE CASCADE)
- **Unique Constraints**: `unique (package_id, capability_id)`.
- **Indexes**: `btree (package_id)`, `btree (capability_id)`.
- **Important Fields**: `id`, `package_id`, `capability_id`, `created_at`.
- **Lifecycle**: Configured by Super Admin when editing package contents.
- **Audit Requirement**: Logged on package modification.
- **Idempotency**: Natural unique key on `(package_id, capability_id)`.
- **Source of Truth**: Database table `public.package_capabilities`.
- **Status**: PROPOSED (NEW).

### Entity 5: `platform_addons`
- **Purpose**: Catalog of optional, modular add-on products (Moodle LMS, WhatsApp Gateway, RFID Gate, POS Kantin, Custom Domain).
- **Ownership**: PLATFORM-OWNED.
- **Primary Key**: `id` (`text`, e.g. `'addon_moodle_lms'`).
- **Foreign Keys**: None.
- **Unique Constraints**: `code` (`text`, unique, e.g. `'addon.moodle_lms'`).
- **Indexes**: `btree (code)`, `btree (is_active)`.
- **Important Fields**: `id`, `code`, `name`, `description`, `is_active`, `required_capabilities` (`jsonb` array of prerequisite capability codes), `created_at`, `updated_at`.
- **Lifecycle**: Managed by Super Admin; subscribed independently by tenants.
- **Audit Requirement**: Audited via `audit_logs`.
- **Idempotency**: Unique constraint on `code`.
- **Source of Truth**: Database table `public.platform_addons`.
- **Status**: PROPOSED (NEW).

### Entity 6: `platform_addon_prices`
- **Purpose**: Versioned pricing catalog for add-on modules.
- **Ownership**: PLATFORM-OWNED.
- **Primary Key**: `id` (`text`, `'prc_add_'` + nanoid).
- **Foreign Keys**: `addon_id` $\rightarrow$ `platform_addons.id` (ON DELETE CASCADE).
- **Unique Constraints**: Partial unique index on `(addon_id, billing_interval)` WHERE `is_active = true`.
- **Indexes**: `btree (addon_id, billing_interval)`.
- **Important Fields**: `id`, `addon_id`, `billing_interval` (`'monthly' | 'yearly'`), `amount`, `currency`, `is_active`, `version`, `effective_from`, `effective_to`, `created_by`, `created_at`, `updated_at`.
- **Lifecycle**: Versioned append-only pricing.
- **Audit Requirement**: Audited via `audit_logs`.
- **Idempotency**: Enforced by partial unique index on active prices.
- **Source of Truth**: Database table `public.platform_addon_prices`.
- **Status**: PROPOSED (NEW).

### Entity 7: `addon_capabilities`
- **Purpose**: Many-to-many junction mapping which capabilities are unlocked by purchasing an add-on.
- **Ownership**: PLATFORM-OWNED.
- **Primary Key**: `id` (`text`, nanoid).
- **Foreign Keys**: 
  - `addon_id` $\rightarrow$ `platform_addons.id` (ON DELETE CASCADE)
  - `capability_id` $\rightarrow$ `platform_capabilities.id` (ON DELETE CASCADE)
- **Unique Constraints**: `unique (addon_id, capability_id)`.
- **Indexes**: `btree (addon_id)`, `btree (capability_id)`.
- **Important Fields**: `id`, `addon_id`, `capability_id`, `created_at`.
- **Lifecycle**: Managed by Super Admin; immutable by tenants.
- **Audit Requirement**: Logged on add-on definition updates.
- **Idempotency**: Unique key on `(addon_id, capability_id)`.
- **Source of Truth**: Database table `public.addon_capabilities`.
- **Status**: PROPOSED (NEW).

### Entity 8: `tenant_subscriptions`
- **Purpose**: The canonical commercial agreement between a tenant and the platform. Supports multi-row historical ledger per tenant while guaranteeing single active agreement.
- **Ownership**: TENANT-OWNED (`tenant_id` is mandatory and foreign-keyed).
- **Primary Key**: `id` (`text`, `'sub_'` + nanoid).
- **Foreign Keys**: 
  - `tenant_id` $\rightarrow$ `tenants.id` (ON DELETE CASCADE)
  - `package_id` $\rightarrow$ `platform_packages.id`
  - `price_id` $\rightarrow$ `platform_package_prices.id`
- **Unique Constraints**: 
  - **PARTIAL UNIQUE INDEX**: `CREATE UNIQUE INDEX tenant_subscriptions_single_active_idx ON tenant_subscriptions (tenant_id) WHERE status IN ('trial', 'active', 'past_due', 'grace_period');`
  - Unconditional `UNIQUE (tenant_id)` is **STRICTLY FORBIDDEN** to preserve historical subscription records.
- **Indexes**: `btree (tenant_id)`, `btree (status)`, `btree (current_period_end)`.
- **Important Fields**: `id`, `tenant_id`, `package_id`, `price_id`, `status` (`'trial' | 'active' | 'past_due' | 'grace_period' | 'suspended' | 'cancelled' | 'expired' | 'superseded'`), `billing_cycle` (`'monthly' | 'yearly'`), `started_at`, `current_period_start`, `current_period_end`, `trial_started_at`, `trial_ends_at`, `locked_price_amount`, `locked_price_currency`, `renewal_policy` (`'LOCKED_PRICE' | 'CURRENT_CATALOG_PRICE' | 'MANUAL_CONTRACT'`), `auto_renew`, `cancelled_at`, `suspended_at`, `created_at`, `updated_at`.
- **Lifecycle**: Transitioned via subscription state machine triggers (checkout, renewal, past due, grace, suspend, cancel).
- **Audit Requirement**: Every state transition emits an audit log event.
- **Idempotency**: Partial unique index prevents duplicate concurrent active subscriptions.
- **Source of Truth**: Database table `public.tenant_subscriptions`.
- **Status**: PROPOSED (NEW).

### Entity 9: `tenant_subscription_addons`
- **Purpose**: Junction recording active modular add-ons purchased under a specific subscription agreement.
- **Ownership**: TENANT-OWNED.
- **Primary Key**: `id` (`text`, `'sub_add_'` + nanoid).
- **Foreign Keys**: 
  - `subscription_id` $\rightarrow$ `tenant_subscriptions.id` (ON DELETE CASCADE)
  - `addon_id` $\rightarrow$ `platform_addons.id`
  - `addon_price_id` $\rightarrow$ `platform_addon_prices.id`
- **Unique Constraints**: `unique (subscription_id, addon_id)`.
- **Indexes**: `btree (subscription_id)`, `btree (addon_id)`.
- **Important Fields**: `id`, `subscription_id`, `addon_id`, `addon_price_id`, `status` (`'active' | 'suspended' | 'cancelled'`), `locked_price_amount`, `locked_price_currency`, `created_at`, `updated_at`.
- **Lifecycle**: Activated on payment; suspended or cancelled in tandem with parent subscription.
- **Audit Requirement**: Add-on purchases and cancellations logged to `audit_logs`.
- **Idempotency**: Unique constraint on `(subscription_id, addon_id)`.
- **Source of Truth**: Database table `public.tenant_subscription_addons`.
- **Status**: PROPOSED (NEW).

### Entity 10: `tenant_referrals`
- **Purpose**: Tracks referral code relationships between an existing tenant (referrer) and a newly registered tenant (referred).
- **Ownership**: TENANT-OWNED (Cross-tenant reference).
- **Primary Key**: `id` (`text`, `'ref_'` + nanoid).
- **Foreign Keys**: 
  - `referrer_tenant_id` $\rightarrow$ `tenants.id` (Tenant earning credits)
  - `referred_tenant_id` $\rightarrow$ `tenants.id` (Newly onboarded tenant)
- **Unique Constraints**: `referred_tenant_id` is UNIQUE (A tenant can only be referred by one referrer).
- **Indexes**: `btree (referrer_tenant_id)`, `btree (status)`.
- **Important Fields**: `id`, `referrer_tenant_id`, `referred_tenant_id`, `referral_code`, `status` (`'pending' | 'qualified' | 'disqualified' | 'cancelled'`), `qualified_at`, `disqualified_at`, `created_at`, `updated_at`.
- **Lifecycle**: Created as `'pending'` during self-registration; moves to `'qualified'` when referred tenant activates a paid subscription; moves to `'disqualified'` if referred tenant cancels/suspends.
- **Audit Requirement**: Referral binding and qualification events audited.
- **Idempotency**: Unique key on `referred_tenant_id` prevents duplicate referral claims.
- **Source of Truth**: Database table `public.tenant_referrals`.
- **Status**: PROPOSED (NEW).

### Entity 11: `tenant_referral_credits`
- **Purpose**: Immutable ledger recording monthly billing credits applied to the referrer's SaaS invoices.
- **Ownership**: TENANT-OWNED (Referrer's financial ledger).
- **Primary Key**: `id` (`text`, `'rcr_'` + nanoid).
- **Foreign Keys**: 
  - `referral_id` $\rightarrow$ `tenant_referrals.id`
  - `referrer_tenant_id` $\rightarrow$ `tenants.id`
  - `referred_tenant_id` $\rightarrow$ `tenants.id`
  - `invoice_id` $\rightarrow$ `saas_invoices.id` (nullable until applied)
- **Unique Constraints**: `unique (referral_id, billing_period_month)` (Guarantees exactly one credit per referred tenant per calendar month).
- **Indexes**: `btree (referrer_tenant_id)`, `btree (billing_period_month)`.
- **Important Fields**: `id`, `referral_id`, `referrer_tenant_id`, `referred_tenant_id`, `invoice_id`, `billing_period_month` (`text`, e.g. `'2026-10'`), `amount` (default: `50000` IDR, LOCKED), `status` (`'pending' | 'applied' | 'voided'`), `applied_at`, `created_at`.
- **Lifecycle**: Evaluated during automated monthly invoice generation.
- **Audit Requirement**: Credit generation and application logged.
- **Idempotency**: Enforced by unique constraint on `(referral_id, billing_period_month)`.
- **Source of Truth**: Database table `public.tenant_referral_credits`.
- **Status**: PROPOSED (NEW).

### Entity 12: `saas_invoices`
- **Purpose**: Legal B2B demand for payment for platform subscriptions, add-ons, and referral credits with frozen line-item snapshots.
- **Ownership**: TENANT-OWNED.
- **Primary Key**: `id` (`text`, `'inv_saas_'` + nanoid).
- **Foreign Keys**: 
  - `tenant_id` $\rightarrow$ `tenants.id`
  - `subscription_id` $\rightarrow$ `tenant_subscriptions.id`
- **Unique Constraints**: `invoice_number` (`text`, unique, e.g. `'INV-SAAS-202609-ALFATIH-001'`).
- **Indexes**: `btree (tenant_id)`, `btree (status)`, `btree (due_date)`.
- **Important Fields**: `id`, `invoice_number`, `tenant_id`, `subscription_id`, `amount_subtotal`, `amount_discount`, `amount_referral_credit`, `amount_tax`, `amount_total`, `status` (`'draft' | 'issued' | 'paid' | 'past_due' | 'void' | 'cancelled'`), `issue_date`, `due_date`, `paid_at`, `line_items_snapshot` (`jsonb`), `created_at`, `updated_at`.
- **Lifecycle**: Generated 7 days before period end; paid via payment gateway webhook; marked past_due if unpaid.
- **Audit Requirement**: Invoice generation, voiding, and payment settlement audited.
- **Idempotency**: Unique constraint on `invoice_number`.
- **Source of Truth**: Database table `public.saas_invoices`.
- **Status**: PROPOSED (NEW).

### Entity 13: `saas_payments`
- **Purpose**: Idempotent ledger of payment transactions received from payment gateways for SaaS invoices.
- **Ownership**: TENANT-OWNED / PLATFORM BOUNDARY.
- **Primary Key**: `id` (`text`, `'pmt_saas_'` + nanoid).
- **Foreign Keys**: `invoice_id` $\rightarrow$ `saas_invoices.id`.
- **Unique Constraints**: `unique (provider, provider_payment_id)`.
- **Indexes**: `btree (invoice_id)`, `btree (status)`.
- **Important Fields**: `id`, `invoice_id`, `provider` (`'xendit' | 'midtrans' | 'flip' | 'mock'`), `provider_payment_id`, `amount`, `status` (`'pending' | 'succeeded' | 'failed' | 'expired'`), `raw_payload` (`jsonb`), `paid_at`, `created_at`.
- **Lifecycle**: Inserted upon webhook ingestion; prevents duplicate webhook processing.
- **Audit Requirement**: Payment events logged with raw provider reference.
- **Idempotency**: Unique key on `(provider, provider_payment_id)` guarantees duplicate webhooks return HTTP 200 without double execution.
- **Source of Truth**: Database table `public.saas_payments`.
- **Status**: PROPOSED (NEW).

---

## 13. Proposed Relationships

```
[platform_packages] (1) <==== (N) [package_capabilities] (N) ====> (1) [platform_capabilities]
       |
       | (1:N)
       v
[platform_package_prices]
       |
       | Snapshotted into (FK)
       v
[tenant_subscriptions] (1) <==== (N) [tenant_subscription_addons] (N) ====> (1) [platform_addons]
       |                                                                             |
       | (1:N)                                                                       | (1:N)
       v                                                                             v
[saas_invoices] (1) <==== (N) [saas_payments]                       [platform_addon_prices]
       ^
       | Applies deduction
       |
[tenant_referral_credits] (N) <==== (1) [tenant_referrals]
                                            |
                                            +---> Referrer: public.tenants (1)
                                            +---> Referred: public.tenants (1, Unique)
```

---

## 14. Platform vs Tenant Ownership

Strict architectural segregation of data ownership guarantees multi-tenant security and row-level security (RLS) integrity:

| Entity | Owner Scope | `tenant_id` Column? | Writable By | Readable By |
| :--- | :---: | :---: | :--- | :--- |
| `platform_capabilities` | **PLATFORM** | NO | `SUPER_ADMIN` | Authenticated Users |
| `platform_packages` | **PLATFORM** | NO | `SUPER_ADMIN` | Public / Authenticated |
| `platform_package_prices`| **PLATFORM** | NO | `SUPER_ADMIN` | Public / Authenticated |
| `package_capabilities` | **PLATFORM** | NO | `SUPER_ADMIN` | Public / Authenticated |
| `platform_addons` | **PLATFORM** | NO | `SUPER_ADMIN` | Public / Authenticated |
| `platform_addon_prices` | **PLATFORM** | NO | `SUPER_ADMIN` | Public / Authenticated |
| `addon_capabilities` | **PLATFORM** | NO | `SUPER_ADMIN` | Public / Authenticated |
| `platform_settings` | **PLATFORM** | NO | `SUPER_ADMIN` | `SUPER_ADMIN` / Service |
| `tenant_subscriptions` | **TENANT** | **YES** | Platform Service / Admin | Tenant Members / Admin |
| `tenant_subscription_addons`| **TENANT**| NO (Uses `sub_id`)| Platform Service / Admin | Tenant Members / Admin |
| `tenant_referrals` | **TENANT** | **YES** (`referrer`, `referred`)| Platform Service | Tenant Admin (Referrer) |
| `tenant_referral_credits` | **TENANT** | **YES** | Platform Service | Tenant Admin (Referrer) |
| `saas_invoices` | **TENANT** | **YES** | Platform Service | Tenant Admin |
| `saas_payments` | **TENANT** | NO (Uses `inv_id`)| Webhook Worker / Service | Tenant Admin |

---

## 15. Package → Subscription → Entitlement Model

The mathematical derivation of runtime access operates via pure server-side resolution:

$$\text{EffectiveCapabilities}(T) = \Big( \text{PackageCaps}(P_T) \cup \bigcup_{A \in \text{ActiveAddons}(T)} \text{AddonCaps}(A) \Big) \setminus \text{Restrictions}(S_T)$$

Where:
- $T$: Tenant
- $P_T$: Package linked to Tenant's active subscription
- $S_T$: Status of Tenant's active subscription

### Operational Truth Table
| Subscription Status ($S_T$) | Package Capabilities | Add-on Capabilities | Operational Access | UI Gating Behavior |
| :--- | :---: | :---: | :---: | :--- |
| **`trial`** | **ENABLED** | **ENABLED** (if trial add-on) | **GRANTED** | Normal trial dashboard; countdown banner. |
| **`active`** | **ENABLED** | **ENABLED** | **GRANTED** | Full normal operational access. |
| **`past_due`** | **ENABLED** | **ENABLED** | **GRANTED** | Warning notice: payment retry active (3 days). |
| **`grace_period`** | **ENABLED** | **ENABLED** | **GRANTED** | Prominent warning modal; settlement required (5 days). |
| **`suspended`** | **DISABLED** | **DISABLED** | **DENIED** | Non-destructive freeze; redirected to `/dashboard/settings/billing`. |
| **`cancelled`** | **DISABLED** | **DISABLED** | **DENIED** | Access terminated at period end. |
| **`expired`** | **DISABLED** | **DISABLED** | **DENIED** | Trial or un-renewed subscription ended. |

---

## 16. Pricing & Price Versioning Model

### 16.1 The Immutability Invariant
When Super Admin modifies a price:
1. The currently active price record in `platform_package_prices` is updated:
   `SET is_active = false, effective_to = NOW(), updated_at = NOW()`
2. A new price record is inserted:
   `INSERT (package_id, billing_interval, amount, version, is_active = true, effective_from = NOW())`
3. Running tenant subscriptions and previously issued invoices retain their foreign keys to the historical price ID, guaranteeing **zero retroactive financial alteration**.

### 16.2 Annual Pricing Separation
Yearly prices are stored with `billing_interval = 'yearly'` and are completely independent from monthly prices. Super Admin controls the exact annual incentive without rigid mathematical formulas in code.

---

## 17. Subscription Lifecycle Model

```
+-----------------------------------------------------------------------------+
|                     CANONICAL SUBSCRIPTION STATE MACHINE                    |
+-----------------------------------------------------------------------------+

             [ Tenant Provisioning / Registration ]
                               |
                               v
                       +---------------+
                       |     TRIAL     | (14 Days Default, Snapshotted)
                       +---------------+
                         |           |
           Checkout Paid |           | Trial Expired Without Payment
                         v           v
                 +------------+ +------------+
                 |   ACTIVE   | |  EXPIRED   |
                 +------------+ +------------+
                   |        ^          |
     Period Ended, |        | Retry    | Checkout Paid
       Unpaid      |        | Succeeded|
                   v        |          v
                 +------------+ +------------+
                 |  PAST_DUE  | |   ACTIVE   |
                 +------------+ +------------+
                   |
            3 Days |
            Unpaid |
                   v
                 +------------+
                 |GRACE_PERIOD| (5 Days Window)
                 +------------+
                   |
            5 Days |
            Unpaid |
                   v
                 +------------+ Voluntary Cancellation +---------------+
                 | SUSPENDED  |----------------------->|   CANCELLED   |
                 +------------+                        +---------------+
                   |
                   | Settled via Billing Recovery
                   v
                 +------------+
                 |   ACTIVE   |
                 +------------+
```

---

## 18. Trial Model

1. **Configurable Baseline**: Stored in `platform_settings.trial_duration_days` (default: 14).
2. **Snapshot Mechanism**: On creation, `tenant_subscriptions.trial_ends_at = NOW() + (trial_duration_days * 24 hours)`.
3. **Non-Retroactive**: Modifying `platform_settings.trial_duration_days` affects only future subscriptions.
4. **Remediation Requirement**: Fix `src/lib/authz/authorization-service.ts` line 70 so that `status === 'trial'` is recognized alongside `status === 'active'` during valid trial windows.

---

## 19. Referral Model

1. **Relation Tracking**: `tenant_referrals` binds `referrer_tenant_id` to `referred_tenant_id` via unique `referral_code`.
2. **Contingent Reward**:
   - Baseline Reward: **Rp 50.000 / month** (LOCKED, stored in `platform_settings.referral_reward_monthly`).
   - Reward Type: **Billing Credit** applied directly to `saas_invoices`.
   - **Active Subscription Contingency Rule**: During monthly invoice generation for Referrer Tenant A, the system evaluates:
     $$\exists R \in \text{tenant\_referrals} \mid R.\text{referred\_tenant\_id} = B \land \text{SubscriptionStatus}(B) = \text{'active'}$$
     If Tenant B is active, a Rp 50.000 credit is inserted into `tenant_referral_credits` and deducted from Tenant A's invoice. If Tenant B is suspended or cancelled, the credit is omitted.
3. **Idempotency**: `UNIQUE (referral_id, billing_period_month)` guarantees no duplicate credits in the same billing cycle.

---

## 20. Existing Tenant Treatment

The schema accommodates all three locked transition pathways for existing pilot tenants (`al-fatih`, `al-ikhlas`):

| Transition Strategy | Database Implementation in Schema | Commercial Effect |
| :--- | :--- | :--- |
| **1. Courtesy Grant** | Insert `tenant_subscriptions` with `status = 'active'`, `locked_price_amount = 0`, `current_period_end = NOW() + INTERVAL '3 days'`. | Default 3-day courtesy grant; zero operational disruption. |
| **2. Trial Reset** | Insert `tenant_subscriptions` with `status = 'trial'`, `trial_started_at = NOW()`, `trial_ends_at = NOW() + INTERVAL '14 days'`. | 14-day standard trial evaluation window. |
| **3. Manual Contract** | Insert `manual_contracts` record with custom terms; bind `tenant_subscriptions.renewal_policy = 'MANUAL_CONTRACT'`. | Custom negotiated contract and pricing terms. |

---

## 21. Auditability

Every commercial state modification writes an immutable record to `public.audit_logs`:

| Commercial Event | Action Code in `audit_logs` | Target Entity | Mandatory Metadata |
| :--- | :--- | :--- | :--- |
| Package Created | `'saas.package_created'` | `platform_packages` | Code, Name, Quota Limits |
| Price Version Deployed | `'saas.price_version_deployed'` | `platform_package_prices` | Package ID, Amount, Version, Reason |
| Subscription Created | `'subscription.created'` | `tenant_subscriptions` | Tenant ID, Package ID, Status, Snapshot |
| Subscription State Shift | `'subscription.state_transition'`| `tenant_subscriptions` | Old Status, New Status, Trigger |
| Trial Extended | `'subscription.trial_extended'` | `tenant_subscriptions` | Old Ends At, New Ends At, Reason |
| Referral Credit Applied | `'referral.credit_applied'` | `tenant_referral_credits` | Referrer ID, Referred ID, Amount, Invoice ID |
| Invoice Issued | `'saas_invoice.issued'` | `saas_invoices` | Invoice Number, Total, Line Items Snapshot |

---

## 22. Idempotency

To prevent financial inconsistencies, race conditions, and duplicate webhook executions:
1. **Active Subscription Invariant**: Partial unique index `tenant_subscriptions_single_active_idx` prevents concurrent active subscriptions for a single tenant.
2. **Referral Single-Claim**: Unique index on `tenant_referrals.referred_tenant_id` prevents a tenant from being referred multiple times.
3. **Monthly Credit Deduping**: Unique index on `tenant_referral_credits (referral_id, billing_period_month)` prevents duplicate credits per cycle.
4. **Webhook Replay Protection**: Unique constraint on `saas_payments (provider, provider_payment_id)` guarantees idempotent webhook processing.
5. **Invoice Numbering**: Unique constraint on `saas_invoices.invoice_number` prevents duplicate invoice creation.

---

## 23. Multi-Tenant Isolation

1. **Platform Catalog Isolation**: Catalog tables (`platform_packages`, `platform_package_prices`, `platform_capabilities`, `platform_addons`, `platform_settings`) have **no `tenant_id` column**. They are readable by all authenticated tenants via Supabase RLS but writable strictly by `SUPER_ADMIN`.
2. **Tenant Agreement Isolation**: All subscription, invoice, payment, and referral records include `tenant_id` (or direct foreign key cascade to an entity with `tenant_id`), secured with Supabase RLS:
   `tenant_id = (auth.jwt() ->> 'tenant_id')` or service role bypass.

---

## 24. Super Admin Configuration Boundary

Super Admin manages all commercial policies through `/dashboard/saas/pengaturan-global` without application redeployment:
- **Packages & Quotas**: Add/edit package names, sort order, santri limits.
- **Price Catalog**: Deploy new price versions for monthly and annual billing.
- **Add-on Catalog**: Add/edit optional modules and pricing.
- **Trial Settings**: Update `trial_duration_days` (default: 14) and toggle trial mode.
- **Billing Policy**: Update `past_due_duration_days` (3), `grace_period_duration_days` (5), and `post_grace_action` (`suspend`).
- **Referral Settings**: Update `referral_reward_monthly` (Rp 50.000).
- **Courtesy Duration**: Update `courtesy_duration_days` (3).

---

## 25. Current vs Target Gap Matrix

| Area | Current Implementation | Target Architectural State | Gap Description | Technical Risk | Future WP Scope |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Package** | Static JSX in `paket-billing` | Normalized `platform_packages` | 0 DB tables; hardcoded UI | HIGH | `WP-SAAS-SCHEMA-CATALOG-001` |
| **Pricing** | Text strings in JSX cards | Versioned `platform_package_prices` | 0 DB tables; no versioning | HIGH | `WP-SAAS-SCHEMA-CATALOG-001` |
| **Annual Pricing** | None | Separate `yearly` price records | No annual pricing capability | MEDIUM | `WP-SAAS-SCHEMA-CATALOG-001` |
| **Add-on** | Deferred TypeScript interface | `platform_addons` & prices | 0 DB tables; unpersisted | HIGH | `WP-SAAS-SCHEMA-CATALOG-001` |
| **Subscription** | None (`tenants.status` proxy) | Multi-row `tenant_subscriptions` | 0 DB tables; no period tracking | CRITICAL | `WP-SAAS-SCHEMA-CATALOG-001` |
| **Subscription History**| None | Multi-row ledger with partial index| Cannot retain past contracts | HIGH | `WP-SAAS-SCHEMA-CATALOG-001` |
| **Price Snapshot** | None | Snapshot fields on sub & invoice | Price changes alter history | HIGH | `WP-SAAS-SCHEMA-CATALOG-001` |
| **Trial** | Hardcoded `"Trial 14 Hari"` string| Configurable DB setting & snapshot | Defect in authz blocks trial | HIGH | `WP-SAAS-SCHEMA-CATALOG-001` |
| **Past Due** | None | Configurable 3-day retry window | No retry policy engine | MEDIUM | `WP-SAAS-CONFIG-SERVICE-001` |
| **Grace Period** | None | Configurable 5-day warning window | Immediate cutoff risk | HIGH | `WP-SAAS-CONFIG-SERVICE-001` |
| **Suspension** | Manual status string change | Non-destructive automated freeze | Potential data loss risk | CRITICAL | `WP-SAAS-CONFIG-SERVICE-001` |
| **Renewal Policy** | None | Configurable renewal policy enum | Uncontrolled renewal pricing | MEDIUM | `WP-SAAS-SCHEMA-CATALOG-001` |
| **Entitlement** | None (pure RBAC) | Two-tier Server-Authoritative Gate| Missing commercial feature gate| HIGH | `WP-SAAS-ENTITLEMENT-ENGINE-001` |
| **Capability** | None (only RBAC permissions) | Canonical `platform_capabilities` | No feature license mapping | HIGH | `WP-SAAS-SCHEMA-CATALOG-001` |
| **Module Toggle** | Volatile client React `useState` | Entitlement-driven UI visibility | Insecure client-side authority | HIGH | `WP-SAAS-ENTITLEMENT-ENGINE-001` |
| **Referral** | None | `tenant_referrals` & credit ledger | Zero referral infrastructure | MEDIUM | `WP-SAAS-SCHEMA-CATALOG-001` |
| **Billing & Invoice** | None for SaaS (SPP only) | B2B `saas_invoices` with snapshots| No platform revenue invoices | HIGH | `WP-SAAS-BILLING-GATEWAY-001` |
| **Payment** | Flip webhook for SPP only | Idempotent `saas_payments` | No SaaS checkout webhook | HIGH | `WP-SAAS-BILLING-GATEWAY-001` |
| **Existing Tenants** | In DB without subscription | Parameterized backfill scripts | Unassigned commercial state | MEDIUM | `WP-SAAS-BACKFILL-001` |
| **Audit** | `audit_logs` for provisioning | Extended commercial audit events | Missing billing audit events | LOW | `WP-SAAS-SCHEMA-CATALOG-001` |
| **Configuration** | Company profile contact only | Super Admin `/pengaturan-global` | Commercial rules unmanaged | HIGH | `WP-SAAS-CONFIG-SERVICE-001` |

---

## 26. Locked / Candidate / Deferred / Open Decisions

```
+-----------------------------------------------------------------------------+
|                        DECISION CLASSIFICATION MAP                          |
+-----------------------------------------------------------------------------+
  |
  +---> LOCKED (Authority: Product Owner - Non-Negotiable)
  |     - Trial duration default: 14 days
  |     - Past Due window: 3 days
  |     - Grace Period window: 5 days
  |     - Post-Grace Action: Non-destructive suspension
  |     - Existing Tenant Options: Courtesy / Trial Reset / Manual Contract
  |     - Courtesy Duration default: 3 days
  |     - Referral Reward: Rp 50.000 / month as Billing Credit
  |     - Referral Qualification: Active subscription contingency
  |     - Referral Frequency: Monthly
  |     - Price Snapshotting: Immutable point-in-time snapshots
  |     - Moodle LMS: Optional Add-on (addon.moodle_lms)
  |     - Multi-Row Subscription Ledger: Partial unique active index
  |
  +---> CANDIDATE (Architecturally Sound; Awaiting Seed Confirmation)
  |     - Initial Package Codes: starter, pro, enterprise
  |     - Initial Add-on Codes: addon.moodle_lms, addon.wa_gateway, addon.rfid_gate,
  |                             addon.pos_kantin, addon.custom_domain
  |     - Quota Limit Fields: maxSantri, maxAdminUsers, maxBranches, storageQuotaMb
  |
  +---> OPEN / TBD (Pending Product Owner Pricing Input)
  |     - Exact initial price nominals for Starter, Pro, Enterprise
  |     - Exact initial price nominals for Add-ons
  |     - Referral Maximum Monthly Credit Cap (null = uncapped)
  |     - Anti-abuse / Self-referral policies
  |
  +---> DEFERRED (Future Work Packages)
        - Payment Gateway Provider selection (Flip vs Xendit vs Midtrans)
        - Mid-cycle proration mathematics
        - Multi-currency international support
```

---

## 27. Risks & Mitigations

1. **Trial Lockout Defect**: `authorization-service.ts` line 70 rejects `status === 'trial'`. *Mitigation: Target remediation scheduled for Entitlement Engine WP.*
2. **Accidental History Truncation**: A naive `UNIQUE(tenant_id)` constraint would erase past contracts. *Mitigation: Strictly enforce PostgreSQL partial unique indexing.*
3. **Duplicate Webhook Debits**: Payment gateway retries could double-activate subscriptions. *Mitigation: Enforce unique constraint on `saas_payments(provider, provider_payment_id)`.*
4. **Retroactive Price Shocks**: Modifying package prices could alter active subscriptions. *Mitigation: Decouple prices into versioned records and snapshot locked prices on subscriptions.*

---

## 28. Recommended Future Implementation Work Packages

```
[ WP-SAAS-SCHEMA-CATALOG-001 ] (Current: Architecture Complete)
                 |
                 v
[ WP-SAAS-SCHEMA-IMPLEMENTATION-001 ]
- Create src/lib/db/schema/saas.ts with all 13 proposed Drizzle tables
- Generate PostgreSQL migrations (0003_saas_commercial_foundation.sql)
- Seed canonical capabilities, package shells, add-on shells, and platform settings
- Configure PostgreSQL partial unique index
                 |
                 v
[ WP-SAAS-CONFIG-SERVICE-UI-001 ]
- Implement saas-config-service.ts domain service
- Build Super Admin configuration UI at /dashboard/saas/pengaturan-global
- Expose public and admin configuration API routes
                 |
                 v
[ WP-SAAS-ENTITLEMENT-ENGINE-001 ]
- Implement checkTenantEntitlement(tenantId, capability) server gate
- Remediate trial lockout defect in authorization-service.ts
- Refactor register/route.ts from hardcoded 'Pro SaaS' to dynamic catalog default
                 |
                 v
[ WP-SAAS-BACKFILL-001 ]
- Execute controlled backfill for existing pilot tenants (Courtesy / Trial / Manual)
```

---

## 29. STOP / Product Owner Decision Required

The architectural design and gap discovery are **100% complete and validated**.

### Decisions Required Before Schema Seed Execution:
1. **Confirmation of Initial Seed Prices**: Does Product Owner wish to seed initial nominal prices for Starter, Pro, and Enterprise tiers, or should catalog seeds initialize with placeholder nominals editable via Super Admin UI?
2. **Referral Monthly Credit Cap**: Should the referral reward cap be uncapped by default (`referral_max_monthly_credit = null`)?

---

## STATUS SUMMARY

============================================================  
WP STATUS  
============================================================  

STATUS:  
**PASS**  

DISCOVERY:  
**PASS**  

SCHEMA DESIGN:  
**PASS**  

BUSINESS RULE MAPPING:  
**PASS**  

IMPLEMENTATION:  
**NOT STARTED**  

DATABASE MUTATION:  
**NOT PERFORMED**  

SOURCE CODE MUTATION:  
**NOT PERFORMED**  

MIGRATION:  
**NOT CREATED**  

COMMIT:  
**NOT CREATED**  

PUSH:  
**NOT PERFORMED**  

DEPLOY:  
**NOT PERFORMED**  

PRODUCT OWNER DECISION REQUIRED:  
1. Initial seed pricing nominals for Starter, Pro, Enterprise (or initialize as editable placeholders in database).  
2. Confirmation of uncapped referral credit ceiling (`referral_max_monthly_credit = null`).  

NEXT RECOMMENDED WP:  
**WP-SAAS-SCHEMA-IMPLEMENTATION-001**  

============================================================  
STOP.
