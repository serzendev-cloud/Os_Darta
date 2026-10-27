# WP-SAAS-PRICING-CONFIGURATION-ARCHITECTURE-001
# SAAS PRICING & COMMERCIAL CONFIGURATION ARCHITECTURE SPECIFICATION
## Comprehensive Architecture for Database-Driven Packages, Dynamic Pricing, Add-ons, Trial Management & Billing Policy

**Document Identifier**: `WP-SAAS-PRICING-CONFIGURATION-ARCHITECTURE-001-REPORT`  
**Work Package ID**: `WP-SAAS-PRICING-CONFIGURATION-ARCHITECTURE-001`  
**Author**: Senior SaaS Architect / Billing Architect / Product Configuration Architect  
**Classification**: ARCHITECTURAL SPECIFICATION & BUSINESS CONFIGURATION DISCOVERY  
**Date**: 2026-09-13  
**Status**: READY FOR BUSINESS DECISION LOCK  
**Target Initial Scale**: ±10 Pesantren / Tenants (Engineered for 50–100 tenants without microservices)  

---

## 1. Executive Summary

This specification establishes the authoritative, production-grade architectural blueprint for the **Commercial Pricing and Configuration Engine** of MA'HAD MANAGER.

### Core Architectural Mandate
1. **Zero Hardcoded Commercial Nominals**: No package price, add-on price, trial duration, or billing penalty window may be hardcoded in application source code, React components, server actions, API routes, or Zustand stores.
2. **Database as Single Source of Truth**: All commercial parameters (packages, prices, add-ons, trial durations, and billing policies) are persisted in PostgreSQL and managed by Super Admin via the Portal at `/dashboard/saas/pengaturan-global`.
3. **Zero-Deployment Agility**: Super Admin can introduce price changes, promotional tiers, add-ons, or trial adjustments instantly at runtime without code changes or application redeployments.
4. **Point-in-Time Historical Price Protection (Snapshotting)**: Subscription agreements and issued invoices store immutable snapshots of agreed prices, ensuring price changes never retroactively distort historical transactions or active contracts.
5. **Multi-Subscription Historical Ledger**: Tenants can accumulate multiple historical subscriptions over time (`trial` $\rightarrow$ `active` $\rightarrow$ `expired` $\rightarrow$ `renewed`) while maintaining at most one active commercial agreement enforced via PostgreSQL partial unique indexing.

---

## 2. Current State

A comprehensive forensic audit of the repository reveals the following baseline:

| Subsystem | Current State | Empirical Evidence |
| :--- | :--- | :--- |
| **Package Catalog** | **MOCK ONLY** | Hardcoded JSX cards in `src/app/dashboard/saas/paket-billing/page.tsx`. Selection options hardcoded in `src/app/dashboard/saas/tenants/page.tsx`. |
| **Pricing Storage** | **NONE IN DB** | Zero database tables for package prices or add-on prices. Prices exist only as visual text strings (`Rp 1.000.000 /bulan`, etc.). |
| **Add-on Model** | **MOCK ONLY** | Deferred interface in `tenant-provisioning-service.ts` line 510 (`modules: undefined // no canonical schema column`). |
| **Subscription Ledger** | **MISSING** | 0 tables in PostgreSQL. Tenant status (`tenants.status`) is used as a crude operational proxy. |
| **Trial Configuration** | **HARDCODED STRING** | Displayed statically as `"Trial 14 Hari"` in modal dropdowns. No configurable setting in database. |
| **Billing Policy** | **MISSING** | No configuration for past-due retry duration, grace periods, or post-grace suspension rules. |
| **Platform Settings** | **PARTIAL** | Table `platform_settings` exists but currently stores only company contact details (`company_name`, `company_email`, etc.). |

---

## 3. Existing Pricing Hardcodes (Forensic Inventory)

Every reference to pricing, plans, trial durations, and grace periods across the codebase has been identified and classified:

| File Location | Line(s) | Hardcoded Element | Classification | Impact & Remediation Plan |
| :--- | :--- | :--- | :--- | :--- |
| `src/app/api/saas/register/route.ts` | 200 | `plan: 'Pro SaaS'` | **A. Genuine Business Hardcode** | Bypasses package selection; must be refactored to resolve active default package from database. |
| `src/app/dashboard/saas/paket-billing/page.tsx` | 84 | `Rp 1.000.000 /bulan` (Starter) | **D. UI Placeholder** | Static JSX mock; must be replaced with dynamic fetch from `platform_package_prices`. |
| `src/app/dashboard/saas/paket-billing/page.tsx` | 103 | `Rp 2.000.000 /bulan` (Pro) | **D. UI Placeholder** | Static JSX mock; must be replaced with dynamic fetch from `platform_package_prices`. |
| `src/app/dashboard/saas/paket-billing/page.tsx` | 120 | `Rp 3.500.000 /bulan` (Enterprise)| **D. UI Placeholder** | Static JSX mock; must be replaced with dynamic fetch from `platform_package_prices`. |
| `src/app/dashboard/saas/tenants/page.tsx` | 794–797 | `<option value="Starter SaaS">`, `Pro SaaS`, `Enterprise SaaS`, `Trial 14 Hari` | **D. UI Placeholder** | Form dropdown options hardcoded; must populate from `platform_packages` query. |
| `src/app/dashboard/saas/tenants/page.tsx` | 551 | `🟡 TRIAL (14 Hari)` | **D. UI Placeholder** | Conflates package with trial duration; must bind to tenant's active subscription status. |
| `src/modules/saas/services/tenant-provisioning-service.ts`| 60, 504 | `plan?: string` | **D. Unpersisted Contract** | Passed to audit log metadata; must bind to `package_id` in `tenant_subscriptions`. |
| `src/lib/db/schema/finance.ts` | 11 | `dailyLimit: default(20000)` (Rp 20.000) | **E. Seed / Default Data** | Belongs to Tenant Operational Finance (B2C Canteen limit), not SaaS platform billing. |
| `src/app/wali/tagihan/checkout/page.tsx` | 59, 103 | `Rp {sppAmount.toLocaleString()}` | **F. Database-Driven (Operational)** | Tenant Student SPP tuition checkout (B2C), correctly calculated from student invoice data. |
| `src/app/dashboard/saas/ppob/page.tsx` | 65–66 | `digiflazzBalance = 4850000`, `adminFeeConfig = 1500` | **D. UI Placeholder** | Platform digital goods demo state, independent of SaaS subscription pricing. |
| `docs/architecture/*-REPORT.md` | Various | Rp 450k, Rp 950k, Rp 2.25M, 14 days, 3 days past due, 7 days grace | **C. Documentation Example Only** | Candidate figures explicitly designated as non-binding architecture examples. |

---

## 4. Current Package Architecture

In the current codebase, packages do not exist as relational entities:
- In `src/app/dashboard/saas/paket-billing/page.tsx`, packages are represented solely as visual cards displaying "Starter Plan", "Pro Plan", and "Enterprise Plan".
- In `src/app/dashboard/saas/tenants/page.tsx`, modal dropdowns allow selecting `"Starter SaaS"`, `"Pro SaaS"`, `"Enterprise SaaS"`, and `"Trial 14 Hari"`.
- **Critical Flaw**: `"Trial 14 Hari"` is erroneously listed in the dropdown as a product package rather than a subscription lifecycle state.
- **Missing Elements**: No package UUID/code, no active/inactive flag, no versioning, and zero relational binding to platform capabilities or quotas.

---

## 5. Current Add-on Architecture

- Add-ons are currently defined only as an unpersisted TypeScript interface `TenantModulesConfig` in `tenant-provisioning-service.ts` (lines 63–71), covering `paymentGateway`, `waGateway`, `rfidGate`, `posKantin`, `uksKesehatan`, `gdriveStorage`, and `questKarakter`.
- Line 510 of `tenant-provisioning-service.ts` explicitly documents that modules are deferred because no database column exists.
- In `src/app/dashboard/saas/modul-fitur/page.tsx`, module switches mutate volatile React `useState` (`tenantsMap`) without sending API requests or affecting authorization.
- Moodle LMS is completely absent from existing UI and schema.

---

## 6. Current Subscription Architecture

- There is currently **zero persistent subscription model** in PostgreSQL.
- The platform uses `tenants.status` (`'active' | 'suspended' | 'trial'`) as an operational substitute for commercial subscriptions.
- This creates severe architectural limitations:
  1. Cannot track subscription period start/end dates.
  2. Cannot track renewal dates or automated billing cycles.
  3. Cannot preserve historical subscription agreements when a tenant changes tiers.
  4. Cannot record locked pricing terms.

---

## 7. Current Trial Architecture

- Trial duration is currently hardcoded in UI strings as `"14 Hari"`.
- While `tenants.status` permits `'trial'`, `src/lib/authz/authorization-service.ts` line 70 strictly enforces:
  `if (tenantRows[0].status.toLowerCase() !== 'active') return DENIED;`
  This defect actively locks out trial tenants from accessing the platform.
- There is no database field tracking `trial_started_at` or `trial_ends_at`, nor any mechanism for Super Admin to adjust trial lengths.

---

## 8. Current Billing Architecture

- The platform currently has operational billing for student SPP tuition payments via Flip (`src/app/api/webhooks/flip/route.ts`) and digital products via Digiflazz (`src/app/api/webhooks/platform-pg/route.ts`).
- However, **zero infrastructure exists for SaaS platform subscriptions**.
- There are no SaaS invoice generators, no B2B checkout flows, no subscription payment webhooks, and no billing policy engines.

---

## 9. Proposed Configuration Architecture

The proposed architecture introduces a unified, database-driven configuration engine centered in the Super Admin Portal:

```
+-----------------------------------------------------------------------------------+
|                        SUPER ADMIN PORTAL CONFIGURATION                           |
|                      (/dashboard/saas/pengaturan-global)                          |
+-----------------------------------------------------------------------------------+
  |                  |                   |                   |                  |
  v                  v                   v                   v                  v
[Paket SaaS]    [Harga Paket]       [Add-on]           [Trial Config]   [Billing Policy]
  |                  |                   |                   |                  |
  +------------------+-------------------+-------------------+------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                           SAAS CONFIG DOMAIN SERVICE                              |
|                     (src/modules/saas/services/saas-config-service.ts)            |
+-----------------------------------------------------------------------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
        +-----------------------------+     +-----------------------------+
        |   PLATFORM CATALOG TABLES   |     |    PLATFORM SETTINGS TABLE  |
        |-----------------------------|     |-----------------------------|
        | - platform_packages         |     | - platform_settings         |
        | - platform_package_prices   |     |   * trial_enabled           |
        | - platform_addons           |     |   * trial_duration_days     |
        | - platform_addon_prices     |     |   * past_due_days           |
        | - platform_capabilities     |     |   * grace_period_days       |
        | - package_capabilities      |     |   * post_grace_action       |
        | - addon_capabilities        |     +-----------------------------+
        +-----------------------------+
                       |
                       +-----------------------------------+
                                                           |
                                                           v
+-----------------------------------------------------------------------------------+
|                               DOWNSTREAM CONSUMERS                                |
|-----------------------------------------------------------------------------------|
| 1. Public Self-Registration (/register) ---> Fetches active packages & trial days |
| 2. Tenant Provisioning Engine           ---> Assigns package & snapshots trial end |
| 3. Tenant Checkout & Billing            ---> Reads active versioned price by ID   |
| 4. SaaS Invoice Generator               ---> Freezes line items snapshot JSON      |
| 5. Server-Side Entitlement Gate         ---> Resolves package + addon capabilities |
+-----------------------------------------------------------------------------------+
```

---

## 10. Package Model

### 10.1 Separation of Concerns
- **Package**: The commercial product container (`platform_packages`).
- **Price**: The financial cost and interval (`platform_package_prices`).
- **Capability**: The functional permissions licensed (`package_capabilities`).
- **Quota**: Numerical consumption limits (`platform_packages.quota_limits`).

### 10.2 Entity Specification (`platform_packages`)
```typescript
export interface PlatformPackage {
  id: string;               // e.g. 'pkg_starter', 'pkg_pro', 'pkg_enterprise'
  code: string;             // unique slug: 'starter', 'pro', 'enterprise'
  name: string;             // 'Starter Tier', 'Pro Tier', 'Enterprise Tier'
  description: string;      // Detailed description
  isActive: boolean;        // Controls whether package is selectable
  isPublic: boolean;        // Visible on public registration/pricing page
  sortOrder: number;        // UI display order
  quotaLimits: {
    maxSantri: number;      // e.g. 150, 600, -1 (unlimited)
    maxAdminUsers: number;  // e.g. 5, 20, -1 (unlimited)
    maxBranches: number;    // e.g. 1, 3, 10
    storageQuotaMb: number; // e.g. 10240 (10GB), 51200 (50GB)
  };
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 11. Price Model

### 11.1 Entity Specification (`platform_package_prices`)
Prices are decoupled from packages to allow multiple billing intervals, multi-currency support, and immutable price versioning:

```typescript
export interface PlatformPackagePrice {
  id: string;               // e.g. 'prc_pkg_pro_monthly_v1'
  packageId: string;        // References platform_packages.id
  billingInterval: 'monthly' | 'yearly' | 'quarterly';
  amount: number;           // Nominal amount in currency unit (e.g. IDR)
  currency: string;         // 'IDR' (ISO 4217, extensible)
  isActive: boolean;        // Exactly ONE active price per package+interval
  version: number;          // Sequential version integer (1, 2, 3...)
  effectiveFrom: Date;      // Timestamp when price becomes active
  effectiveTo: Date | null; // Timestamp when superseded (null if active)
  createdBy: string;        // Super Admin User ID
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 12. Price Versioning

### 12.1 The Immutability Rule
When Super Admin changes a price, the existing price record is **NEVER** updated in place. Overwriting rows destroys historical truth and breaks auditability.

### 12.2 Price Update Algorithm
```
Super Admin updates Pro Tier (Monthly) from Rp 950.000 to Rp 1.100.000
                                  |
                                  v
           BEGIN Transaction in saas-config-service
           +-----------------------------------------------------------------+
           | 1. Find existing active price row:                              |
           |    WHERE package_id = 'pkg_pro'                                 |
           |      AND billing_interval = 'monthly'                           |
           |      AND is_active = true;                                      |
           |                                                                 |
           | 2. UPDATE existing row:                                         |
           |    SET is_active = false,                                       |
           |        effective_to = NOW(),                                    |
           |        updated_at = NOW();                                      |
           |                                                                 |
           | 3. INSERT new row:                                              |
           |    package_id = 'pkg_pro',                                      |
           |    billing_interval = 'monthly',                                |
           |    amount = 1100000,                                            |
           |    currency = 'IDR',                                            |
           |    version = previous_version + 1,                              |
           |    is_active = true,                                            |
           |    effective_from = NOW(),                                      |
           |    created_by = current_super_admin_id;                         |
           |                                                                 |
           | 4. INSERT INTO audit_logs:                                      |
           |    action = 'saas.price_version_created',                       |
           |    old_value = { amount: 950000, version: 1 },                  |
           |    new_value = { amount: 1100000, version: 2 };                 |
           +-----------------------------------------------------------------+
                                  |
                                  v
           COMMIT Transaction (Zero deployment required)
```

---

## 13. Price Snapshot

### 13.1 Subscription Snapshotting
When a tenant subscribes to a package, the exact price is frozen on the subscription agreement:
- `price_id`: Points to the specific `platform_package_prices.id`.
- `locked_amount`: The exact numeric amount agreed upon.
- `locked_currency`: Currency string (`IDR`).
- `locked_billing_interval`: `'monthly'` or `'yearly'`.
- `snapshot_at`: Timestamp when the agreement was locked.

### 13.2 Invoice Line Items Snapshotting
When an invoice is issued, its line items are stored as an immutable JSONB array:
```json
[
  {
    "type": "PACKAGE",
    "packageId": "pkg_pro",
    "priceId": "prc_pkg_pro_monthly_v1",
    "priceVersion": 1,
    "name": "Pro Tier Subscription (Monthly)",
    "unitPrice": 950000,
    "quantity": 1,
    "total": 950000
  }
]
```
Even if the catalog price is subsequently raised, the invoice and existing active subscription remain completely unaffected.

---

## 14. Add-on Model

### 14.1 Entity Specification (`platform_addons` & `platform_addon_prices`)
```typescript
export interface PlatformAddon {
  id: string;               // e.g. 'addon_moodle_lms'
  code: string;             // unique slug: 'addon.moodle_lms'
  name: string;             // 'Moodle LMS Sync & SSO'
  description: string;
  isActive: boolean;
  requiredCapabilities: string[]; // e.g. ['website.cms_builder'] for custom domain
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformAddonPrice {
  id: string;               // e.g. 'prc_addon_moodle_m_v1'
  addonId: string;          // References platform_addons.id
  billingInterval: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  isActive: boolean;
  version: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
}
```

### 14.2 Moodle LMS as Optional Add-on
- Code: `addon.moodle_lms`
- Granted Capability: `education.lms`
- Pre-requisite: Active or Trial Base Subscription.
- Pricing: Managed independently via `platform_addon_prices`.

---

## 15. Trial Configuration

### 15.1 Configuration Storage
Trial policies are stored in `platform_settings` and managed by Super Admin:
- `trial_enabled`: `boolean` (default: `true`). If false, self-registration requires immediate checkout.
- `trial_duration_days`: `integer` (default: `14`, configurable from 1 to 90).
- `trial_max_extensions`: `integer` (default: `1`, maximum manual extensions permitted).
- `trial_extension_days`: `integer` (default: `7`, days added per extension).
- `trial_default_package_id`: `text` (default: `'pkg_starter'`).

### 15.2 Snapshot Guarantee
When a tenant is provisioned, `trial_ends_at` is evaluated once:
$$\text{trial\_ends\_at} = \text{NOW}() + (\text{platform\_settings.trial\_duration\_days} \times 24 \text{ hours})$$
Once written to `tenant_subscriptions`, this date is fixed. Subsequent changes by Super Admin to `platform_settings.trial_duration_days` apply exclusively to newly created subscriptions.

---

## 16. Billing Policy Configuration

### 16.1 Configurable Parameters
Stored in `platform_settings` to allow Super Admin to tune operational policies:
- `past_due_duration_days`: Duration the system retries failed payments while keeping capabilities unlocked (Candidate: 3 days).
- `grace_period_duration_days`: Administrative warning window before suspension (Candidate: 7 days).
- `post_grace_action`: Action taken when grace period expires (`'suspend'` | `'read_only'`, Candidate: `'suspend'`).
- `auto_invoice_lead_days`: Days before period end to generate renewal invoice (Candidate: 7 days).
- `invoice_due_days`: Days allowed for payment after invoice issuance (Candidate: 3 days).

---

## 17. Super Admin UI Architecture

### 17.1 Location & Routing
The configuration interface expands the existing page at:
`src/app/dashboard/saas/pengaturan-global/page.tsx`

### 17.2 Structured Tabbed Interface
```
+-----------------------------------------------------------------------------+
|              PENGATURAN GLOBAL & PUSAT KONFIGURASI SAAS                     |
+-----------------------------------------------------------------------------+
| [Paket SaaS] | [Harga Paket] | [Add-on] | [Trial] | [Billing] | [Profil]    |
+-----------------------------------------------------------------------------+

Tab 1: Paket SaaS
- Table: Code, Name, Santri Quota, Admin Quota, Branches, Storage, Active Toggle.
- Action: "Tambah Paket Baru", "Edit Batas Kuota", "Atur Fitur/Capabilities".

Tab 2: Harga Paket
- Matrix: Paket vs Interval (Bulanan, Tahunan), Current Active Price, Version.
- Action: "Ubah Harga" -> Opens modal with "Nominal Baru", "Tanggal Berlaku",
  and "Alasan Perubahan (Audit Log)". Shows historical price versions table.

Tab 3: Add-on & Fitur Opsional
- Table: Add-on Code, Name, Target Capability, Status (Active/Inactive).
- Action: "Tambah Add-on", "Atur Ketergantungan (Prerequisites)".

Tab 4: Harga Add-on
- Matrix: Add-on vs Billing Interval, Current Active Price, Version History.

Tab 5: Konfigurasi Trial
- Form: Enable/Disable Trial Toggle, Default Trial Duration (Hari),
  Maksimum Perpanjangan Trial (Kali), Durasi Tambahan Perpanjangan (Hari).

Tab 6: Kebijakan Billing (Billing Policy)
- Form: Durasi Past Due (Hari), Durasi Grace Period (Hari),
  Tindakan Pasca Grace Period (Suspend/Read-only), Lead Time Faktur (Hari).

Tab 7: Profil Perusahaan & Siaran (Existing)
- SERZEN DEV contact details and global broadcast announcement banner.
```

---

## 18. API & Service Boundary

### 18.1 Domain Service (`src/modules/saas/services/saas-config-service.ts`)
```typescript
export interface SaasConfigService {
  // Public Catalog (Anonymous / Registration / Tenant Checkout)
  getPublicCatalog(): Promise<{
    packages: Array<PlatformPackage & { activePrices: PlatformPackagePrice[] }>;
    addons: Array<PlatformAddon & { activePrices: PlatformAddonPrice[] }>;
    trialPolicy: { enabled: boolean; defaultDurationDays: number; defaultPackageId: string };
  }>;

  // Super Admin Management APIs
  getAdminCatalog(): Promise<FullCatalogAdminDTO>;
  createPackage(input: CreatePackageInput, actorId: string): Promise<PlatformPackage>;
  updatePackage(id: string, input: UpdatePackageInput, actorId: string): Promise<PlatformPackage>;
  setPackagePrice(packageId: string, input: SetPriceInput, actorId: string): Promise<PlatformPackagePrice>;
  createAddon(input: CreateAddonInput, actorId: string): Promise<PlatformAddon>;
  setAddonPrice(addonId: string, input: SetPriceInput, actorId: string): Promise<PlatformAddonPrice>;
  updateTrialConfig(input: TrialConfigInput, actorId: string): Promise<void>;
  updateBillingPolicy(input: BillingPolicyInput, actorId: string): Promise<void>;
}
```

### 18.2 API Route Handlers
- `GET /api/saas/config/public`: Public-safe catalog for registration and pricing tables.
- `GET /api/saas/config/admin`: Full catalog with historical versions (`SUPER_ADMIN` only).
- `POST /api/saas/config/packages`: Create new package tier (`SUPER_ADMIN` only).
- `PUT /api/saas/config/packages/[id]`: Update package metadata/quotas (`SUPER_ADMIN` only).
- `POST /api/saas/config/packages/[id]/prices`: Deploy new price version (`SUPER_ADMIN` only).
- `PUT /api/saas/config/trial`: Update trial settings (`SUPER_ADMIN` only).
- `PUT /api/saas/config/billing-policy`: Update billing policy parameters (`SUPER_ADMIN` only).

---

## 19. Authorization Model

### 19.1 Server-Side RBAC Enforcement
- Mutations require authenticated session where `userPlatformRoles` contains `SUPER_ADMIN`.
- Evaluated via `authorization-service.ts` checking `platformRoleId === 'SUPER_ADMIN'`.
- Tenant Admins and public users have **zero permission** to mutate pricing, packages, or policies.

### 19.2 Zero Trust Input Policy
- Clients never submit price values, discounts, or duration numbers during registration or checkout.
- Checkout API accepts only `packageId` and `billingInterval`. The server resolves the active `price_id` and nominal directly from the database.

---

## 20. Audit Model

Every configuration event must be recorded in `public.audit_logs`:
- `action`: e.g. `'saas.price_version_created'`, `'saas.package_updated'`, `'saas.trial_duration_changed'`.
- `actor_id`: Supabase Auth UID of the acting Super Admin.
- `entity_type`: Table name (`platform_package_prices`, `platform_settings`, etc.).
- `entity_id`: Primary key of modified entity.
- `old_values`: JSONB representation of previous state.
- `new_values`: JSONB representation of updated state.
- `reason`: Mandatory text entered by Super Admin justifying the configuration change.

---

## 21. Payment Gateway Boundary

- The Payment Gateway is an **execution adapter**, not a pricing authority.
- The SaaS billing domain resolves the price from `platform_package_prices`, generates the `saas_invoices` record, and passes the exact amount to `PaymentGatewayAdapter.createSubscriptionCheckout()`.
- The payment gateway provider (Flip, Xendit, Midtrans) receives the authoritative amount; it does not determine or validate product pricing.

---

## 22. Existing Tenant Migration Options

Discovery confirmed existing active tenants in the database (`al-fatih`, `al-ikhlas`). When subscription models are implemented, existing tenants must be onboarded without disruption.

### Option Comparison Matrix (OPEN BUSINESS DECISION)
| Strategy | Description | Pros | Cons | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Option 1: Pilot Courtesy Grant** | Assign existing tenants to `pkg_pro` with `locked_amount = 0` for a courtesy period (e.g. 90–180 days). | Zero operational shock; guarantees pilot loyalty; smooth transition. | Defers revenue collection from existing pilot tenants. | **RECOMMENDED** |
| **Option 2: Standard Trial Reset** | Place existing tenants into standard 14-day trial from migration date. | Fast conversion to paid; uniform lifecycle. | High risk of friction/lockout if pilot tenants are not ready to pay. | RISKY |
| **Option 3: Manual Contract Entry** | Super Admin manually inputs negotiated contract terms for each existing tenant via Portal. | Tailored commercial agreements; accurate records. | Requires manual operational effort for each tenant. | ACCEPTABLE |

---

## 23. Subscription History Support

### 23.1 Eliminating the Unique Tenant Constraint Trap
A naive design might enforce `UNIQUE (tenant_id)` on `tenant_subscriptions`. This must be **STRICTLY AVOIDED** because it prevents tenants from retaining historical subscription records.

### 23.2 The Partial Unique Index Solution
To allow infinite historical subscriptions while guaranteeing at most one active commercial agreement:
```sql
-- Allows multiple historical records with status 'expired', 'cancelled', 'superseded'
-- Guarantees exactly ONE active commercial agreement per tenant
CREATE UNIQUE INDEX tenant_subscriptions_single_active_idx 
ON tenant_subscriptions (tenant_id) 
WHERE status IN ('trial', 'active', 'past_due', 'grace_period');
```

---

## 24. Open Business Decisions

The following business items require formal locking by the Product Owner before database migrations can be generated:

1. **Initial Package Price Nominals**:
   - Starter Tier: Monthly IDR amount? Annual IDR amount?
   - Pro Tier: Monthly IDR amount? Annual IDR amount?
   - Enterprise Tier: Monthly IDR amount? Annual IDR amount?
2. **Existing Pilot Tenant Migration Strategy**:
   - Selection among Option 1 (Pilot Courtesy Grant), Option 2 (Standard Trial Reset), or Option 3 (Manual Contract Entry).
   - If Option 1: What is the courtesy duration (e.g. 90, 180 days)?
3. **Billing Penalty Windows**:
   - Past Due Retry Window: Confirmation of 3 days vs 5 days.
   - Grace Period Window: Confirmation of 7 days vs 14 days.
   - Post-Grace Action: Suspension (freeze) vs Read-Only mode.
4. **Add-on Initial Prices**:
   - Moodle LMS Add-on: Monthly IDR price?
   - WhatsApp Gateway Add-on: Monthly IDR price?
   - RFID Gate Add-on: Monthly IDR price?
   - POS Kantin Add-on: Monthly IDR price?
   - Custom Domain Add-on: Monthly IDR price?

---

## 25. Locked Decisions

1. **Web App Supremacy**: Web browser is the sole platform; desktop native is dropped.
2. **Moodle is an Optional Add-on**: External specialized LMS; not bundled into core packages.
3. **Payment Gateway for SaaS Billing**: Automated payment gateway checkout; provider abstracted.
4. **Database-Driven Pricing**: Zero hardcoded prices in application source code.
5. **Super Admin Configuration Portal**: Centralized management at `/dashboard/saas/pengaturan-global`.
6. **Zero-Deployment Price Agility**: Changing prices or trial settings does not require software redeployment.
7. **Point-in-Time Snapshotting**: Subscriptions and invoices store immutable price snapshots.
8. **Subscription History Support**: Multi-row historical ledger per tenant with partial unique active index.
9. **Non-Destructive Suspension**: Suspension never deletes tenant operational data.

---

## 26. Candidate Decisions

1. Package naming: `starter`, `pro`, `enterprise`.
2. Billing intervals: `monthly` and `yearly`.
3. Default trial duration: `14 days`.
4. Past due window: `3 days`.
5. Grace period window: `7 days`.
6. Post-grace action: `'suspend'` (non-destructive commercial freeze).

---

## 27. Deferred Decisions

1. Selection of concrete Payment Gateway provider (Flip vs Xendit vs Midtrans).
2. Automated mid-cycle proration calculation algorithms.
3. Multi-currency international pricing (USD, MYR, SAR).

---

## 28. Migration Considerations

Database migrations must proceed in strict dependency sequence:
1. **Migration 0003_saas_catalog**:
   - Tables: `platform_capabilities`, `platform_packages`, `platform_package_prices`, `package_capabilities`, `platform_addons`, `platform_addon_prices`, `addon_capabilities`.
   - Seed: Canonical capabilities, package shells, add-on shells.
2. **Migration 0004_saas_settings**:
   - Alter `platform_settings`: add `trial_enabled`, `trial_duration_days`, `past_due_duration_days`, `grace_period_duration_days`, `post_grace_action`.
3. **Migration 0005_saas_subscriptions**:
   - Table `tenant_subscriptions` with partial unique active index `tenant_subscriptions_single_active_idx`.
   - Tables `tenant_subscription_addons`, `saas_invoices`, `saas_payments`.
4. **Migration 0006_tenant_backfill**:
   - Execute backfill based on Product Owner's locked migration decision.

---

## 29. Risks & Mitigation

| Identified Risk | Severity | Mitigation Strategy |
| :--- | :---: | :--- |
| **Price Inconsistency in In-Flight Checkouts** | MEDIUM | Checkout sessions lock `price_id` and expire after 24 hours. |
| **Retroactive Billing Shock** | HIGH | Price snapshotting ensures active subscriptions renew at locked price until renegotiation. |
| **Accidental Trial Lockout** | HIGH | Remediate `authorization-service.ts` to accept `status === 'trial'` during valid trial period. |
| **Audit Bypass** | HIGH | Database triggers or mandatory service-layer audit writes for all catalog updates. |
| **History Truncation** | HIGH | Strict prohibition of unconditional `UNIQUE (tenant_id)` on subscriptions table. |

---

## 30. Implementation Dependency Graph

```
[Phase 1: Product Owner Business Decision Lock]
                     |
                     v
[Phase 2: Schema & Catalog Migration (WP-SAAS-SCHEMA-CATALOG-001)]
                     |
                     v
[Phase 3: Super Admin Config UI & Service (WP-SAAS-PRICING-CONFIG-UI-001)]
                     |
                     v
[Phase 4: Entitlement Engine & Tenant Provisioning Integration]
                     |
                     v
[Phase 5: Payment Gateway & Checkout Integration]
```

---

## 31. Recommended Next Work Package

### Work Package Recommendation
**`WP-SAAS-BUSINESS-DECISION-LOCK`**
*Scope: Product Owner formally reviews Section 24 (Open Business Decisions) and locks initial package prices, add-on prices, trial duration, and existing tenant migration strategy.*

Followed immediately by:
**`WP-SAAS-SCHEMA-CATALOG-001`**
*Scope: Drizzle schema implementation for catalogs, price versioning, and migration scripts based on locked business decisions.*

---

## 32. Final Verdict

### Architecture Status: **PASS**
### Architecture Readiness: **READY FOR BUSINESS DECISION LOCK**

The architectural specification provides a complete, robust, and hardened solution that entirely eliminates hardcoded pricing, establishes a versioned database-driven catalog, protects historical financial truth, and empowers Super Admin to manage the commercial platform seamlessly.

---

## STATUS SUMMARY

WP:  
**WP-SAAS-PRICING-CONFIGURATION-ARCHITECTURE-001**

MODE:  
**READ-ONLY ARCHITECTURE / BUSINESS CONFIGURATION DISCOVERY**

STATUS:  
**READY FOR BUSINESS DECISION LOCK**

SOURCE CODE MUTATIONS:  
**NONE**

DATABASE MUTATIONS:  
**NONE**

MIGRATION FILES GENERATED:  
**NONE**

SEED EXECUTED:  
**NONE**

COMMIT / PUSH / DEPLOY:  
**NONE**

REPORT:  
`docs/architecture/WP-SAAS-PRICING-CONFIGURATION-ARCHITECTURE-001-REPORT.md`

STOP.
