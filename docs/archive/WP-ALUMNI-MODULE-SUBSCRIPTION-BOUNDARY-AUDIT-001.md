# WP-ALUMNI-MODULE-SUBSCRIPTION-BOUNDARY-AUDIT-001
# ALUMNI MODULE: OPTIONAL SUBSCRIPTION & DOMAIN BOUNDARY AUDIT REPORT
## Architectural Specification for Decoupling Alumni Persona Identity from Tenant Commercial Entitlements

```text
══════════════════════════════════════════════════════════════════════════════════
WORK PACKAGE: WP-ALUMNI-MODULE-SUBSCRIPTION-001 / WP-PSB-ALUMNI-SCHEMA-001
DOCUMENT: docs/architecture/WP-ALUMNI-MODULE-SUBSCRIPTION-BOUNDARY-AUDIT-001.md
CLASSIFICATION: ARCHITECTURAL AUDIT & DECISION PROPOSAL (ADR-ALUMNI-MODULE-001)
POSTURE: READ-ONLY ARCHITECTURAL AUDIT — ZERO DATABASE OR CODE MUTATION
AUTHORIZATION STATUS:
  • DDL EXECUTION: ❌ NOT AUTHORIZED
  • MIGRATION EXECUTION: ❌ NOT AUTHORIZED
  • DATABASE MUTATION: ❌ FORBIDDEN (DATABASE UNTOUCHED)
  • APPLICATION CODE MUTATION: ❌ FORBIDDEN (CODEBASE UNCHANGED)
  • GIT COMMIT / PUSH: ❌ FORBIDDEN
PRINCIPLE: INTEGRATE / EXTEND EXISTING APP MA'HAD — ZERO REWRITE
══════════════════════════════════════════════════════════════════════════════════
```

---

## 1. AUDIT IDENTITY

- **Work Package Identifier**: `WP-ALUMNI-MODULE-SUBSCRIPTION-001` (Boundary Evaluation for `WP-PSB-ALUMNI-SCHEMA-001`)
- **Document Identifier**: `WP-ALUMNI-MODULE-SUBSCRIPTION-BOUNDARY-AUDIT-001`
- **Architecture Decision Record**: `ADR-ALUMNI-MODULE-001` (*Alumni as an Optional SaaS Subscription Module*)
- **Auditor Role**: Principal Solution Architect, SaaS Modular Architecture Auditor, Multi-Tenant Architecture Engineer, Subscription & Entitlement Architect, EEOS Architecture Governance Agent.
- **Audit Mandate**: Perform an authoritative architectural audit to evaluate and formalize the proposition that **Portal Alumni and Alumni Organization features constitute an optional, subscription-controlled module** within APP MA'HAD, while ensuring that the **Alumni Persona and Identity Lifecycle remain independent of commercial tenancy states**.

---

## 2. OBJECTIVE

The primary objectives of this architecture audit are:
1. **Establish the Modular Boundary**: Formalize that the Alumni Module (Portal, Organization, Discovery, Salam, Events, and Donations) is an **optional capability** activated or deactivated dynamically per tenant based on commercial subscription entitlements.
2. **Enforce the Core Identity Invariant**: Architecturally isolate the **Alumni Persona / Identity** from the **Tenant Alumni Module Subscription**. A student who graduates and is conferred alumni status by the Sidang Akhir Kelulusan (SAT) remains an alumnus permanently; tenant subscription lapses affect only module feature availability, never identity or historical truth.
3. **Verify Existing Subscription Baselines**: Forensically audit the APP MA'HAD codebase to discover existing subscription, billing, package, and entitlement artifacts, strictly adhering to the principle: **AUDIT → REUSE → EXTEND (ZERO REWRITE)**.
4. **Define Module State Machine & Lifecycle**: Formulate system behavior across all lifecycle states (`ACTIVE`, `TRIAL`, `PAST_DUE`, `GRACE_PERIOD`, `EXPIRED`, `SUSPENDED`) for UI navigation, Next.js route guards, API/service handlers, background workers, and persistent data retention.
5. **Analyze the 8 Alumni Schema Tables**: Categorize each of the 8 tables introduced in `WP-PSB-ALUMNI-SCHEMA-001` as either **Core Institutional Lifecycle Archive** or **Operational Alumni Module** entities.
6. **Provide a Canonical Decision Proposal**: Deliver `ADR-ALUMNI-MODULE-001` to lock the modular boundary without disrupting ongoing Gate 8B remediation work.

---

## 3. EXISTING SUBSCRIPTION ARCHITECTURE EVIDENCE

A forensic inspection of the active codebase and architectural repository revealed the following authoritative evidence regarding the SaaS subscription and billing foundation:

```text
┌─────────────────────────────────┬───────────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ Artifact / Layer                │ File / Location                                                   │ Verified Repository Baseline                                           │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ Architecture Specification      │ docs/architecture/WP-SAAS-SUBSCRIPTION-                          │ Formally approved 1,229-line architecture specification establishing   │
│                                 │ ENTITLEMENT-ARCHITECTURE-001-REPORT.md                            │ normalized catalogs: platform_packages, platform_addons, platform_     │
│                                 │                                                                   │ capabilities, tenant_subscriptions, and two-tier access resolution.    │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ Pricing & Billing Contract      │ docs/architecture/WP-SAAS-PRICING-                                │ Formally defines commercial tiers: STARTER (Free/Trial), PRO SAAS      │
│                                 │ CONFIGURATION-ARCHITECTURE-001-REPORT.md                          │ (IDR 500k/mo), ENTERPRISE (Custom), with snapshotted trial engine.     │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ Database Catalog Discovery      │ docs/architecture/WP-SAAS-SCHEMA-                                 │ Confirmed that commercial subscription tables are fully specified but  │
│                                 │ CATALOG-001-REPORT.md                                             │ not yet migrated into physical PostgreSQL DDL (pending Gate 9).        │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ Existing Tenant Status Column   │ src/lib/db/schema.ts (Line 9)                                     │ public.tenants.status natively supports:                               │
│                                 │                                                                   │ status: text('status').default('active').notNull() ('active'|'trial'|  │
│                                 │                                                                   │ 'suspended').                                                          │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ Mock UI Billing Page            │ src/app/dashboard/saas/paket-billing/page.tsx                     │ Client-side visual representation of Starter, Pro, and Enterprise      │
│                                 │                                                                   │ packages. Logs commercial plan string to audit JSON metadata.          │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ Mock UI Feature Toggles         │ src/app/dashboard/saas/modul-fitur/page.tsx                      │ Interactive client-state toggle for 9 operational modules (Kesantrian, │
│                                 │                                                                   │ Akademik, Auto SPP, Tatib, RFID, POS, UKS, Tahfidz, Perpustakaan).     │
├─────────────────────────────────┼───────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ Edge Proxy Auth Boundary        │ src/proxy.ts (Lines 91-174)                                       │ Server-side edge proxy resolving verified tenant context (x-tenant-id) │
│                                 │                                                                   │ and user session claims. Delegates entitlement checks downstream.      │
└─────────────────────────────────┴───────────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

**Key Architectural Conclusion**: APP MA'HAD already possesses an approved, world-class SaaS subscription and entitlement specification (`WP-SAAS-SUBSCRIPTION-ENTITLEMENT-ARCHITECTURE-001`). There is **zero need to invent a second subscription system**. The Alumni Module must plug directly into this existing specification as a first-class modular capability.

---

## 4. EXISTING MODULE / ENTITLEMENT EVIDENCE

In `WP-SAAS-SUBSCRIPTION-ENTITLEMENT-ARCHITECTURE-001-REPORT.md` (Section 14), the canonical capability registry follows a standardized taxonomy:
$$\text{Namespace Pattern: } \langle\text{domain}\rangle.\langle\text{resource\_or\_feature}\rangle$$

The existing registry includes 16 baseline capabilities:
- `core.santri_management`, `core.asatidz_management`, `core.classes_curriculum`
- `academic.gradebook`, `academic.attendance`, `academic.workspace`
- `finance.tuition_spp`, `finance.cashflow`, `finance.pos_kantin`
- `hardware.rfid_gate`
- `education.lms` (Moodle LMS Add-on)
- `website.cms_builder`, `website.news_articles`, `website.custom_domain`
- `notification.whatsapp`, `notification.push_mobile`

**Finding**: The Alumni domain is currently **not present** in the 16-capability registry. Its inclusion is an additive extension to the existing catalog rather than an architectural redesign.

---

## 5. EXISTING TENANT ARCHITECTURE

APP MA'HAD enforces strict tenant isolation at multiple layers:
1. **Database Layer**: Every tenant-owned row is partitioned by `tenant_id text NOT NULL REFERENCES public.tenants(id)`.
2. **Row-Level Security (RLS)**: Enforces `USING (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = (auth.jwt() ->> 'tenant_id'))`.
3. **Edge Proxy Layer (`src/proxy.ts`)**: Resolves tenant slug from the hostname subdomain or path `/t/:slug`, discards unverified client-supplied headers, and injects server-verified `x-tenant-id`.
4. **Relational Composite Foreign Keys**: Enforces `(tenant_id, id)` across parent-child hierarchies (e.g. `academic_years`, `santri`, `madrasah`, `rombel`).

Any module entitlement model **must operate strictly within this established tenant boundary**. A tenant can never inherit, view, or mutate another tenant's module configuration.

---

## 6. CURRENT ALUMNI ARCHITECTURE

Under `WP-PSB-ALUMNI-SCHEMA-001` (V3 Design and DDL Draft), the Alumni ecosystem is defined by 8 dedicated relational tables:
1. `alumni_exit_reasons`: Canonical reasons for institutional departure.
2. `alumni_academic_snapshots`: Immutable historical records of a student's final academic transcript and Quranic hifzh achievements.
3. `alumni_korwils`: Regional alumni chapters (Koordinator Wilayah).
4. `tenant_korwil_settings`: Governance rules and quorum thresholds for regional chapters.
5. `alumni_profiles`: Extended networking profiles (profession, industry, university, bio, domicile).
6. `user_discovery_locations`: Ephemeral coarse geolocation cache for proximity discovery.
7. `salam_interactions`: Ephemeral peer greeting cooldown ledger.
8. `alumni_donations`: Crowdfunding, waqf, and endowment donation ledger.

In the current Gate 8B artifacts, these 8 tables are bundled into a single relational migration package alongside Core Identity and PSB admission tables.

---

## 7. PROPOSED ALUMNI MODULE BOUNDARY

The target modular decomposition of APP MA'HAD is structured as follows:

```text
APP MA'HAD ENTERPRISE ARCHITECTURE
│
├── CORE PLATFORM (Non-Subscription / Mandatory Foundation)
│   ├── Multi-Tenancy & Tenant Governance
│   ├── Identity Federation (Option A Synthetic Supabase Auth)
│   ├── Users, Personas & RBAC Permissions (52 Core Perms)
│   ├── Master Data Santri & Wali Relationships
│   ├── Level-4 Academic Structure (Madrasah, Jenjang, Tingkat, Rombel)
│   └── Institutional Historical Archives (Exit Reasons & Final Snapshots)
│
├── PSB MODULE (Admission Cycle Module)
│   ├── Periods & Registration Waves
│   ├── Panitia Selection & Intake Notes
│   ├── Online Applications & Test Scores
│   ├── Infaq Verification Gateway
│   └── SAT Matriculation & Academic Placement Distributions
│
└── ALUMNI MODULE (OPTIONAL / COMMERCIAL SUBSCRIPTION CONTROLLED)
    └── Capability Code: "alumni.portal" (or Granular Feature Suite)
        │
        ├── Portal Alumni Web Interface
        ├── Public Directory & Networking Profiles
        ├── Regional Chapter Governance (Korwil Pusat & Wilayah)
        ├── Proximity Discovery ("Alumni Terdekat" with Ephemeral Coordinates)
        ├── Salam Silaturrahmi (Peer Greeting Cooldown Ledger)
        ├── Community Events & Reunions
        └── Alumni Endowment & Crowdfunding Donations
```

---

## 8. IDENTITY VS. ALUMNI MODULE (CRITICAL INVARIANT)

To prevent architectural corruption where institutional reality is subjugated to SaaS licensing, the system establishes a strict axiom:

$$\mathbf{ALUMNI\ PERSONA\ (Identity)} \quad \neq \quad \mathbf{ALUMNI\ MODULE\ (Subscription\ Entitlement)}$$

```text
┌──────────────────────────────────────────────────┐        ┌──────────────────────────────────────────────────┐
│           IDENTITY DOMAIN (IMMUTABLE)            │        │           COMMERCIAL DOMAIN (VOLATILE)           │
├──────────────────────────────────────────────────┤        ├──────────────────────────────────────────────────┤
│ - Entity: public.user_tenant_personas            │        │ - Entity: public.tenant_subscriptions            │
│ - Value: persona_type = 'ALUMNI'                 │        │ - Value: status = 'ACTIVE' | 'EXPIRED'           │
│ - Source of Truth: SAT Matriculation / Graduation│        │ - Source of Truth: SaaS Commercial Agreement     │
│ - Scope: The individual human person             │        │ - Scope: The tenant institution                  │
│ - Invariant: Once an alumnus, ALWAYS an alumnus. │        │ - Invariant: Licenses expire, renew, and change. │
│   Canceling a software subscription NEVER        │        │   Lapsed payment disables feature access,        │
│   revokes historical graduation.                 │        │   NEVER mutates personal identity.               │
└──────────────────────────────────────────────────┘        └──────────────────────────────────────────────────┘
```

### Architectural Enforcement:
1. When a tenant's Alumni Module subscription expires or is suspended:
   - `user_tenant_personas` records with `persona_type = 'ALUMNI'` **REMAIN 100% INTACT**.
   - The user remains attributed as an alumnus in historical ledgers and institutional archives.
   - Only the software endpoints, UI navigation, and interactive features of the Alumni Module are blocked.

---

## 9. SUBSCRIPTION VS. ENTITLEMENT

Reusing the formal definitions from `WP-SAAS-SUBSCRIPTION-ENTITLEMENT-ARCHITECTURE-001`:

1. **Subscription (`tenant_subscriptions`)**: The commercial agreement between Serzen Dev (SaaS Vendor) and the Tenant Institution, specifying billing cycle, payment status, and bound package.
2. **Entitlement (`checkTenantEntitlement`)**: The runtime mathematical resolution determining whether a tenant is permitted to execute operations under a specific capability code:

$$\text{AlumniEntitled}(T) = \Big( \text{CapabilityInPackage}(P_T, \text{'alumni.portal'}) \lor \text{'addon.alumni'} \in \text{ActiveAddons}(T) \lor \text{OverrideActive}(T) \Big) \land S_T \notin \{\text{'suspended'}, \text{'expired'}, \text{'cancelled'}\}$$

---

## 10. MODULE "ON" BEHAVIOR

When a tenant possesses an active entitlement (`AlumniEntitled(T) === TRUE`):

1. **UI Navigation**:
   - Sidebar renders top-level navigation: **Alumni**.
   - Sub-menus expand: *Portal Alumni*, *Direktori Anggota*, *Korwil & Organisasi*, *Alumni Terdekat (Discovery)*, *Donasi & Wakaf*.
2. **Route Authorization**:
   - Route guard permits traversal into `/dashboard/alumni/*` and `/portal/alumni/*`.
3. **API & Service Endpoints**:
   - Endpoints under `/api/alumni/*` resolve entitlement successfully and proceed to Layer 3 (RBAC).
4. **Interactive Features**:
   - Alumni can update public profiles, broadcast ephemeral discovery coordinates, send daily Salam greetings, and contribute to donation campaigns.
5. **Background Workers**:
   - Scheduled TTL cleanup for expired discovery locations (`user_discovery_locations`) and cooldown purges (`salam_interactions`) execute normally.

---

## 11. MODULE "OFF" BEHAVIOR

When a tenant does NOT possess an active entitlement (`AlumniEntitled(T) === FALSE` due to package exclusion, non-purchase, trial expiration, or subscription suspension):

1. **UI Navigation**:
   - Menu items for **Alumni** are **completely omitted** from standard navigation bars for normal users and alumni.
   - For Tenant Admins (Mudir/SAT), an optional non-intrusive badge or settings item (*"Aktifkan Modul Alumni"*) may be displayed, linking to SaaS commercial upgrades.
2. **Route Guard Enforcement**:
   - Direct browser URL navigation to `/dashboard/alumni/*` or `/portal/alumni/*` is intercepted by the route guard.
   - Behavior: Redirects to `/dashboard` with an informational toast (*"Modul Alumni tidak aktif pada paket langganan Anda"*), or renders a dedicated `403 Module Not Entitled` upsell page for tenant administrators.
3. **API & Service Enforcement (Fail-Closed)**:
   - Every request to `/api/alumni/*` is rejected before executing domain business logic:
     ```json
     {
       "success": false,
       "error": "CAPABILITY_NOT_ENTITLED",
       "message": "Tenant tidak memiliki lisensi aktif untuk Modul Alumni",
       "capability": "alumni.portal"
     }
     ```
   - HTTP Status: `403 Forbidden`.
4. **Zero Client Authority**:
   - Client-side feature toggles or local storage manipulation cannot bypass server-side entitlement checks.
5. **Background Workers**:
   - Automated workers skip inactive tenants when dispatching notification digests or proximity recalculations.
6. **Data Preservation**:
   - **NO DATA IS DELETED**. Existing profiles, chapter structures, and past donations remain stored.

---

## 12. DATA RETENTION & REACTIVATION LIFECYCLE

```text
┌────────────────────────┐
│  ACTIVE SUBSCRIPTION   │ ──► Full access to Portal, Profiles, Chapters, Donations
└───────────┬────────────┘
            │ Expiration / Non-Renewal
            ▼
┌────────────────────────┐
│  MODULE OFF / SUSPEND  │ ──► Features blocked; ZERO data deleted; Personas untouched
└───────────┬────────────┘
            │
            ├──────────────────────────────────────────┐
            │ Reactivation Payment                     │ Retention Period Lapsed (e.g. 1 Year)
            ▼                                          ▼
┌────────────────────────┐                   ┌────────────────────────┐
│   RESTORED / ACTIVE    │                   │   COLD ARCHIVE / TAPE  │
│ All historical records │                   │ Retained per statutory │
│ immediately available! │                   │ institutional policy   │
└────────────────────────┘                   └────────────────────────┘
```

### Invariants:
- **Zero Accidental Destruction**: Turning off a module NEVER executes `DROP TABLE`, `TRUNCATE`, or `DELETE FROM alumni_*`.
- **Seamless Reactivation**: When a tenant upgrades or renews their subscription, setting `AlumniEntitled = TRUE` instantly restores full access to all historical records, Korwil structures, and profile data without requiring data restoration from backups.

---

## 13. THREE-TIER AUTHORIZATION RESOLUTION HIERARCHY

To ensure absolute separation of concerns, every request interacting with the Alumni ecosystem must pass through three distinct, non-overlapping authorization tiers:

```text
Incoming Client Request (e.g. POST /api/alumni/korwils/update or GET /portal/alumni/directory)
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 1: IDENTITY & AUTHENTICATION ("Who are you?")                                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ - Validates Supabase JWT (`auth.uid()`).                                               │
│ - Verifies user exists in `public.users` and is `ACTIVE`.                              │
│ - Resolves user's verified tenant membership via `public.user_tenant_memberships`.     │
│ - Failure: HTTP 401 Unauthorized.                                                      │
└─────────────────────────────────────┬──────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 2: TENANT MODULE ENTITLEMENT ("Is this Tenant licensed for Alumni?")               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ - Executes `checkTenantEntitlement(tenantId, 'alumni.portal')`.                        │
│ - Verifies tenant subscription status $\notin$ {'expired', 'suspended', 'cancelled'}.  │
│ - Verifies capability is included in Tenant's active package or add-ons.               │
│ - Failure: HTTP 403 Forbidden (Code: `CAPABILITY_NOT_ENTITLED`).                       │
└─────────────────────────────────────┬──────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TIER 3: BUSINESS AUTHORIZATION & RBAC ("What are you allowed to do inside Alumni?")    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ - Verifies user has appropriate Role or Persona:                                       │
│   • Ordinary Alumnus: Can update personal profile, view directory, send Salam.         │
│   • Ketua Korwil: Can update Korwil regional information, approve members.             │
│   • Admin Alumni / SAT: Can configure Korwil settings, manage donation campaigns.      │
│ - Failure: HTTP 403 Forbidden (Code: `PERMISSION_DENIED`).                             │
└─────────────────────────────────────┬──────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ DATABASE EXECUTION (Protected by Layer 1 RLS Tenant Isolation)                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. ROW-LEVEL SECURITY (RLS) IMPACT AUDIT

### Audit Question:
*Should database RLS policies query subscription tables to enforce module deactivation?*

### Architectural Evaluation:
- **Anti-Pattern (RLS Commercial Coupling)**: Embedding `checkTenantEntitlement()` inside PostgreSQL RLS policies requires every table scan to join `tenant_subscriptions`, `platform_package_capabilities`, and `platform_settings`.
- **Consequences**:
  1. **Severe Performance Degradation**: Adds 3 to 5 relational joins to every single row evaluation, multiplying query latency by 4x–10x.
  2. **Tenancy Context Pollution**: Increases complexity and risks leaking cross-tenant package information into tenant-scoped RLS policies.
  3. **Architectural Confusion**: Violates the fundamental boundary:
     - **PostgreSQL RLS** exists to guarantee **Hard Multi-Tenant Data Isolation and Row Ownership**.
     - **Application Services / Route Guards** exist to enforce **Commercial Entitlements and Business RBAC**.

### Formal Decision:
**RLS policies remain 100% focused on Tenant Isolation and Row Ownership.** Module entitlement is strictly enforced at Tier 2 (Application Service / Route Guard layer). If a tenant is not entitled, queries to alumni tables are never dispatched by the server.

---

## 15. ROUTE & API GUARD IMPACT

To guarantee zero-client-authority security, route and API guards must be implemented at the Next.js server boundary:

1. **Next.js Edge Proxy (`src/proxy.ts`)**:
   - Continues resolving server-verified `x-tenant-id` and session context.
   - For high-traffic optimization, edge proxy can inspect a signed session cookie containing active capability claims (`capabilities: ['core', 'academic', 'alumni']`), performing instant 0ms edge redirection if `/dashboard/alumni` is requested by an unentitled tenant.
2. **API Route Middleware / Service Gate**:
   - Canonical gate function in domain services:
     ```typescript
     await assertTenantEntitled(tenantId, 'alumni.portal');
     ```
   - Invoked at the entry point of all `/api/alumni/*` handlers and Server Actions before data access repositories are called.

---

## 16. BACKGROUND JOB & WORKER IMPACT

The Alumni ecosystem contains background tasks:
1. `user_discovery_locations` TTL cleanup (purging coordinates older than `expires_at`).
2. `salam_interactions` cooldown expiry.
3. Donation payment reconciliation webhooks.

### Audit Invariants:
- **Maintenance / Garbage Collection Jobs**: Non-destructive cleanup of expired ephemeral records should continue running globally across all tenants. This is hygiene maintenance and does not leak features.
- **Tenant-Initiated Interactive Jobs** (e.g. push notifications for alumni reunions, mass emails): Must check `checkTenantEntitlement(tenantId, 'alumni.portal')` before executing. If the tenant is inactive, outbound job execution is skipped.

---

## 17. RELATIONSHIP WITH PSB (ADMISSION MODULE)

- **Decoupled Symmetry**: Both PSB and Alumni represent satellite domain modules anchored to the Core Institutional Platform.
- **Independence Invariant**:
  $$\text{PSB Module} \quad \neq \quad \text{Alumni Module}$$
- A tenant can subscribe to PSB without Alumni (common for newly established pesantren without graduates).
- A tenant can subscribe to Alumni without PSB (using manual historical student imports).
- Both modules share common foreign key anchors to `public.tenants`, `public.users`, `public.santri`, and `public.academic_years`.

---

## 18. RELATIONSHIP WITH SANTRI LIFECYCLE

The existing `SantriStateMachine` defines canonical lifecycle states:
$$\text{REGISTERED} \longrightarrow \text{VERIFIED} \longrightarrow \text{ACTIVE} \longrightarrow \text{GRADUATED} \longrightarrow \text{ALUMNI}$$

### Invariant:
- Transitioning a student from `ACTIVE` to `GRADUATED` occurs when academic studies terminate.
- Transitioning from `GRADUATED` to `ALUMNI` occurs exclusively via SAT confirmation (`psb_acceptance_ledgers` / graduation senate).
- **This lifecycle progression is 100% independent of the Alumni Module subscription.**
- Even if a tenant has never subscribed to the Alumni Module, the school can graduate students, store historical transcripts, and mark them as alumni in core institutional records.

---

## 19. RELATIONSHIP WITH IDENTITY FEDERATION (OPTION A & TIR-009)

The locked Identity Federation model (**Option A: Synthetic Supabase Auth Credential with Orchestrated Consolidation**) is preserved completely:
1. A single person has one identity in `public.users`.
2. A person holds multiple personas in `public.user_tenant_personas` (`WALI`, `SANTRI`, `ALUMNI`).
3. **Module Entitlement does NOT create identities**: Activating or deactivating the Alumni Module never creates, deletes, merges, or splits user accounts.
4. When a student transitions to an alumnus in an unentitled tenant, their `ALUMNI` persona row is still created in `user_tenant_personas` to maintain identity integrity, but their access to the Alumni Portal web application remains gated by Tier 2 commercial entitlement.

---

## 20. AUDIT OF THE 8 ALUMNI SCHEMA TABLES (OWNERSHIP CLASSIFICATION)

Forensic evaluation of the 8 tables defined in `WP-PSB-ALUMNI-SCHEMA-001` reveals a critical architectural distinction: **Not all 8 tables belong exclusively to the optional commercial module.**

```text
┌────┬───────────────────────────────┬───────────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ No │ Table Name                    │ Architectural Ownership       │ Rationale & Lifecycle Classification                                   │
├────┼───────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 1  │ alumni_exit_reasons           │ CORE INSTITUTIONAL ARCHIVE    │ Shared Master Data. Pesantren must record reasons for student depar-   │
│    │                               │ (Shared Lifecycle)            │ ture (Graduated, Transferred, Dropped Out) even without Alumni Module. │
├────┼───────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 2  │ alumni_academic_snapshots     │ CORE INSTITUTIONAL ARCHIVE    │ Immutable Academic Ledger. Preserves historical transcripts, final     │
│    │                               │ (Shared Lifecycle)            │ grades, and Quranic hifzh achievements permanently upon graduation.     │
├────┼───────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 3  │ alumni_korwils                │ OPTIONAL ALUMNI MODULE        │ Regional chapter governance. Operational social organization feature.  │
├────┼───────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 4  │ tenant_korwil_settings        │ OPTIONAL ALUMNI MODULE        │ Chapter operational thresholds and quorum configuration.               │
├────┼───────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 5  │ alumni_profiles               │ OPTIONAL ALUMNI MODULE        │ Networking directory profiles (job, industry, social links, bio).      │
├────┼───────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 6  │ user_discovery_locations      │ OPTIONAL ALUMNI MODULE        │ Ephemeral geolocation cache for nearby alumni discovery.               │
├────┼───────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 7  │ salam_interactions            │ OPTIONAL ALUMNI MODULE        │ Ephemeral peer greeting cooldown ledger.                               │
├────┼───────────────────────────────┼───────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ 8  │ alumni_donations              │ OPTIONAL ALUMNI MODULE        │ Crowdfunding, waqf, and alumni endowment fundraising campaigns.        │
└────┴───────────────────────────────┴───────────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

### Architectural Finding:
- Tables 1 & 2 (`alumni_exit_reasons`, `alumni_academic_snapshots`) belong to the **Core Academic Archive**. They remain functional regardless of subscription status.
- Tables 3–8 (`alumni_korwils`, `tenant_korwil_settings`, `alumni_profiles`, `user_discovery_locations`, `salam_interactions`, `alumni_donations`) belong to the **Optional Alumni Module** and are gated by Tier 2 commercial entitlement.

---

## 21. SUPER ADMIN SaaS AUTHORITY

- **Authority Boundary**: Platform Commercial Authority.
- **Capabilities**:
  - Super Admin SaaS defines global packages (`platform_packages`), pricing tiers, and commercial add-ons (`platform_addons`).
  - Super Admin SaaS can provision trial extensions or manual capability overrides (`tenant_capability_overrides`) for pilot pesantren.
  - Super Admin SaaS controls billing gateways and global platform parameters (`platform_settings`).
- **Limitation**: Super Admin SaaS does **NOT** administer internal alumni chapters, approve alumni members, or disburse alumni donations within a tenant.

---

## 22. SAT TENANT AUTHORITY

- **Authority Boundary**: Tenant Institutional Business Administration.
- **Capabilities**:
  - Administers admission decisions, academic promotions, and graduation senates.
  - Manages internal operational alumni features (approving Korwil leadership, configuring donation campaigns).
- **Limitation**: SAT Tenant **CANNOT** bypass SaaS billing, grant free platform capability overrides, or enable the Alumni Module without an entitled commercial subscription.

---

## 23. UI NAVIGATION IMPACT

```text
┌──────────────────────────────────────────────────┐        ┌──────────────────────────────────────────────────┐
│        TENANT WITH ALUMNI MODULE (ACTIVE)        │        │       TENANT WITHOUT ALUMNI MODULE (INACTIVE)    │
├──────────────────────────────────────────────────┤        ├──────────────────────────────────────────────────┤
│ 🕌 MA'HAD APP                                    │        │ 🕌 MA'HAD APP                                    │
│ ├── Dashboard                                    │        │ ├── Dashboard                                    │
│ ├── Kesantrian & Asrama                          │        │ ├── Kesantrian & Asrama                          │
│ ├── Akademik & E-Rapor                           │        │ ├── Akademik & E-Rapor                           │
│ ├── Keuangan (SPP)                               │        │ ├── Keuangan (SPP)                               │
│ ├── PSB (Penerimaan Santri Baru)                 │        │ ├── PSB (Penerimaan Santri Baru)                 │
│ └── 🎓 Alumni [ACTIVE]                           │        │ └── ⚙️ Pengaturan Tenant                         │
│     ├── Portal & Direktori Alumni                │        │     (Modul Alumni is omitted from navigation;    │
│     ├── Korwil & Organisasi                      │        │      Admin sees optional upgrade card in billing)│
│     ├── Alumni Terdekat (Discovery)              │        │                                                  │
│     └── Donasi & Wakaf Alumni                    │        │                                                  │
└──────────────────────────────────────────────────┘        └──────────────────────────────────────────────────┘
```

---

## 24. EXISTING ARCHITECTURE REUSE ANALYSIS

In accordance with the directive: **INTEGRATE / EXTEND EXISTING APP MA'HAD — ZERO REWRITE**:

1. **Reusing Subscription Engine**: Directly reuse `WP-SAAS-SUBSCRIPTION-ENTITLEMENT-ARCHITECTURE-001`. The Alumni Module is modeled as capability code `alumni.portal` (or add-on `addon.alumni`).
2. **Reusing Tenant State**: Directly reuse `public.tenants.status` (`'active'`, `'trial'`, `'suspended'`).
3. **Reusing Edge Proxy**: Directly reuse `src/proxy.ts` for tenant header injection and session verification.
4. **Reusing Identity & Roles**: Directly reuse `public.user_tenant_personas`, `public.tenant_roles`, and `public.permissions`.
5. **Reusing Database Tables**: The DDL structure developed in `WP-PSB-ALUMNI-DDL-DRAFT-001.sql` remains 100% valid; no tables need to be deleted or restructured.

---

## 25. SCHEMA & MIGRATION IMPACT

### Audit Question:
*Does decoupling Alumni as an optional module require altering the database schema or DDL draft?*

### Forensic Answer:
**NO.**
- In a multi-tenant PostgreSQL database, tables for all platform features are created in the shared schema.
- Whether a tenant utilizes a table depends on **application-level entitlement gating**, not physical table existence.
- Creating the 8 alumni tables during the initial migration is completely standard and optimal:
  1. It prevents complex, error-prone runtime DDL executions when tenants upgrade.
  2. It ensures relational foreign key integrity across Core Santri and Academic snapshots is established once and immutably locked.
  3. Tables remain empty with zero performance penalty until an entitled tenant activates and populates them.
- Therefore, **the physical DDL Draft does NOT need to be split into separate migration files**. It simply requires domain reclassification in the documentation.

---

## 26. IMPACT ON GATE 8B WORK PACKAGE

### Governance Boundary Rule:
This architectural audit **does NOT alter or bypass the Gate 8B Re-Audit status**:
- Gate 8B Re-Audit concluded with **FAIL — RETURN TO REMEDIATION** due to:
  1. `Finding F-09-A (HIGH)`: Incomplete Phase 1 schema drift gate in SQL draft.
  2. `Finding F-09-B (MEDIUM)`: Policy collision during re-execution in Phase 7.
- Remediating F-09-A and F-09-B remains a mandatory technical requirement for `WP-PSB-ALUMNI-SCHEMA-001`.
- The Alumni Module boundary audit formalizes the conceptual framework for product packaging, providing clarity that the Alumni Module is an optional application layer capability.

---

## 27. ARCHITECTURE DECISION RECORD (ADR-ALUMNI-MODULE-001)

```text
══════════════════════════════════════════════════════════════════════════════════
ARCHITECTURE DECISION RECORD: ADR-ALUMNI-MODULE-001
TITLE: Alumni as an Optional Subscription Module in APP MA'HAD
STATUS: PROPOSED & ARCHITECTURALLY CONSISTENT (Awaiting Product Owner Lock)
DATE: 2026-09-18
══════════════════════════════════════════════════════════════════════════════════

1. CONTEXT:
APP MA'HAD serves diverse Islamic boarding schools (Pesantren). Many nascent
or specialized pesantren have zero graduating classes and do not require alumni
organization features. Treating Alumni as a mandatory core feature bloats the
user experience and complicates commercial packaging.

2. DECISION:
It is formally established that:
a. Portal Alumni, Regional Chapter Governance (Korwil), Proximity Discovery,
   Salam Interactions, and Alumni Donations constitute an OPTIONAL MODULE.
b. The Alumni Module is dynamically enabled/disabled per tenant via the SaaS
   Entitlement Engine (capability: "alumni.portal" / "addon.alumni").
c. The Alumni Persona (public.user_tenant_personas) is an IMMUTABLE IDENTITY
   concept completely decoupled from tenant commercial subscriptions.
d. Institutional historical records (alumni_exit_reasons and alumni_academic_
   snapshots) belong to Core Institutional Archives and remain functional
   regardless of subscription status.
e. When the Alumni Module is inactive, access is blocked at the Route Guard and
   API Service layers (HTTP 403 CAPABILITY_NOT_ENTITLED). Persistent data is
   NEVER deleted, and reactivation is 100% seamless.
f. Database RLS policies enforce hard tenant isolation only; commercial entitle-
   ments are evaluated at the application service tier.

3. CONSEQUENCES:
- Positive: Clean separation of concerns; elegant commercial tiering; zero
  identity corruption upon subscription expiration; zero data destruction.
- Trade-offs: Requires application route guards and API gates to query the
  entitlement resolver before processing alumni requests.
══════════════════════════════════════════════════════════════════════════════════
```

---

## 28. OPEN QUESTIONS & BUSINESS DECISIONS REQUIRED

The following non-blocking commercial packaging questions are submitted for Product Owner review:

1. **Packaging Option (Section 19 Comparison)**:
   - **Option A (Single Module Entitlement)**: A single boolean capability `alumni.portal` unlocks all alumni features (Portal, Korwil, Discovery, Salam, Donations). *Simpler billing, zero configuration overhead.*
   - **Option B (Granular Feature Entitlements)**: Base `alumni.portal` includes directory, while `alumni.discovery` (GPS) and `alumni.donation` (Fundraising) are sold as separate commercial add-ons. *Higher monetization granularity, increased authorization complexity.*
   - **Status**: `BUSINESS DECISION REQUIRED`.
2. **Commercial Tier Bundling**:
   - Is `alumni.portal` bundled for free in the `ENTERPRISE` package and sold as an add-on for `PRO SAAS`, or available across all paid packages?
   - **Status**: `BUSINESS DECISION REQUIRED`.

---

## 29. REQUIRED NEXT GATE

```text
GATE 8B REMEDIATION CYCLE 2
  • Fix F-09-A (Phase 1 Schema Drift Gate)
  • Fix F-09-B (Policy Collision DROP POLICY IF EXISTS)
             │
             ▼
GATE 8B RE-AUDIT 2 ──► PASS
             │
             ▼
PRODUCT OWNER GOVERNANCE GATE
  • Formal Decision Lock on ADR-ALUMNI-MODULE-001
  • Packaging Option Lock (Option A vs Option B)
             │
             ▼
GATE 9: FORMAL DDL & MIGRATION EXECUTION AUTHORIZATION
```

---

## 30. MANDATORY SAFETY STATEMENT

```text
DATABASE:
UNTOUCHED

DDL:
NOT EXECUTED

MIGRATION:
NOT EXECUTED

FRONTEND:
NOT MODIFIED

BACKEND:
NOT MODIFIED

APPLICATION CODE:
UNCHANGED

DEPLOYMENT:
NOT PERFORMED

GIT COMMIT:
NOT PERFORMED

GIT PUSH:
NOT PERFORMED

GATE 9:
NOT AUTHORIZED
```

---

## 31. FINAL VERDICT

In accordance with Section 33 of the governance mandate:

```text
══════════════════════════════════════════════════════════════════════════════════
FINAL VERDICT:
ALUMNI MODULE BOUNDARY — ARCHITECTURALLY CONSISTENT
══════════════════════════════════════════════════════════════════════════════════
```

The proposed architecture cleanly integrates with existing SaaS subscription specifications, preserves the immutable identity of Alumni personas, safeguards all persistent data, and enforces fail-closed authorization without compromising database performance or ongoing Gate 8B remediation work.

---
*Report compiled by Principal Solution Architect, SaaS Modular Architecture Auditor, Multi-Tenant Architecture Engineer, Subscription & Entitlement Architect, EEOS Architecture Governance Agent.*
