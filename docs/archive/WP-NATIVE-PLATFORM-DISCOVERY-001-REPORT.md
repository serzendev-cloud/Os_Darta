# WP-NATIVE-PLATFORM-DISCOVERY-001
# NATIVE MOBILE + DESKTOP + MOODLE LMS + SUBSCRIPTION ENTITLEMENT ARCHITECTURE DISCOVERY

**Document Identifier**: `WP-NATIVE-PLATFORM-DISCOVERY-001-REPORT`  
**Author**: Senior Principal Systems Architect & Architecture Reviewer  
**Classification**: READ-ONLY ARCHITECTURAL DISCOVERY & STRATEGY  
**Date**: 2026-09-13  
**Status**: COMPLETE (READY FOR PRODUCT OWNER REVIEW)  

---

## 1. Executive Summary

MA'HAD MANAGER is currently a web-first multi-tenant SaaS application designed for Islamic boarding schools (Pesantren). Built on Next.js 16 (Turbopack, App Router), React 19, Supabase Auth, PostgreSQL, and Drizzle ORM, the platform has successfully implemented core operational workflows: tenant self-registration, fail-closed multi-tenant RBAC (52 tenant permissions), student records (*Santri*), academics, violations (*Pelanggaran*), and financial ledgers.

As the platform scales toward its **10-year enterprise multi-tenant vision (supporting 100+ Pesantren)**, the product roadmap demands expansion across multiple client surfaces:
1. **Web Portal** (Existing canonical administrative and operational interface).
2. **Native Mobile Applications** (Android & iOS for Santri, Wali Santri, Musyrif, and Asatidz).
3. **Native Desktop Application** (Windows initially for high-throughput school administration, cashier, and gate control).
4. **External Learning Management System** (Moodle LMS integrated as an entitlement-governed external service).
5. **Personal Spiritual & Productivity Modules** (Prayer Time, Prayer Focus, Al-Qur'an, and Hijri Calendar).

### Critical Strategic Takeaway
A multi-client expansion must **never** duplicate backend logic, database models, or security boundaries across platforms. Furthermore, **client-side UI toggles must never be treated as the source of truth for feature access**. Access must be governed by an authoritative server-side hierarchy:
```text
SUBSCRIPTION (Contractual Period & Status)
    ↓
ENTITLEMENT (Tenant Licensing: Package Features + Active Add-ons)
    ↓
CAPABILITY (Canonical Functional Boundary: e.g., education.lms, personal.quran)
    ↓
MODULE / FEATURE (Coarse & Fine-Grained Software Interfaces)
    ↓
CLIENT EXPERIENCE (Web, Mobile, Desktop, API, Moodle SSO)
```

This report provides an exhaustive, read-only architectural analysis covering current codebase realities, gaps, technical feasibility, security boundaries, and recommended work packages without modifying any source code, schemas, or deployment environments.

---

## 2. Current Architecture Snapshot

| Architectural Layer | Current Technology / Implementation | Evaluation / Operational Reality |
|---|---|---|
| **Web Runtime** | Next.js 16.2.6 (Turbopack, App Router, React 19.2.4) | Canonical production runtime; server-rendered and client components. |
| **API Architecture** | Next.js App Router Route Handlers (`src/app/api/*`) & Server Actions | Hybrid HTTP endpoints; cookie-dependent proxy authentication. |
| **Database** | PostgreSQL on Supabase Cloud (AWS ap-southeast-1, SSL pooler) | Relational multi-tenant schema with `tenant_id` columns and RLS foundation. |
| **ORM / Data Access** | Drizzle ORM v0.45.2 + `postgres` v3.4.9 driver | Type-safe query builder, schema definitions in `src/lib/db/schema.ts`. |
| **Identity & Auth** | Supabase Auth SSR (`@supabase/ssr` v0.12.3) | Global `auth.users` linked 1:1 with `public.users` via UUID. |
| **Multi-Tenancy** | Subdomain & Path routing via `src/proxy.ts` | Hostname subdomain (`[slug].madev.id`) or `/t/:slug` mapped to `x-tenant-id`. |
| **RBAC / Authz** | Canonical Database RBAC (`src/lib/authz/authorization-service.ts`) | 55 Canonical Permissions (52 Tenant, 3 Platform), `tenant_role_permissions`. |
| **State Management** | Zustand v5.0.13 | Client-side reactive stores (curriculum, assessments, UI state). |
| **Legacy Architecture** | Firebase / Firestore (`src/lib/config/subscription.ts`, `appConfigService`) | **DEPRECATED/LEGACY**. Actively replaced by Supabase PostgreSQL. |
| **Mobile / Desktop** | None | No native code, capacitor, flutter, or desktop wrappers exist. |
| **LMS / Moodle** | None | Zero Moodle or external LMS integration exists in codebase. |

---

## 3. Current Codebase Findings

A comprehensive forensic audit of the codebase yielded the following factual findings:

### 3.1. Modules and Features
- **Database Schema**: There is **no database table** for modules or feature flags.
- **Admin UI**: `src/app/dashboard/saas/modul-fitur/page.tsx` exists as a visual mock. It defines an in-memory array `modulesCatalog` (`m1` to `m9`: Kesantrian, Akademik, Keuangan/Flip, E-Tatib, RFID Gate, POS Kantin, UKS, Tahfidz Quran Beta, Perpustakaan) and manages toggles strictly in local React state (`tenantsMap`).
- **Server Enforcement**: Toggling a module in `modul-fitur/page.tsx` has **zero server-side persistence** and **zero authorization enforcement** on downstream API routes.

### 3.2. Billing and Subscription
- **Database Schema**: The `tenants` table (`src/lib/db/schema.ts` line 4) contains only `id`, `name`, `slug`, `domain`, `status`, `createdAt`, `updatedAt`. It has **no `plan` or `subscription_id` column**.
- **Tenant Provisioning**: When a tenant is provisioned (`tenant-provisioning-service.ts`), the plan string (e.g., `'Pro SaaS'`) is merely written into the unstructured metadata of the provisioning audit log row (`audit_logs.details.metadata.plan`).
- **Billing UI**: `src/app/dashboard/saas/paket-billing/page.tsx` contains static marketing tiers (`Starter Plan`, `Pro Plan`, `Enterprise Plan`) and an empty `mockInvoicesList`. No invoices or subscriptions are stored in PostgreSQL.
- **Existing "Subscription" File**: `src/lib/config/subscription.ts` is an event-observer utility for Firestore config syncing; it has **no connection to SaaS commercial subscriptions**.

### 3.3. LMS and Moodle
- Zero references to "Moodle" exist anywhere in `src/`.
- The string "lms" only appears in `dispatcher.ts` as part of `intervalMs`.
- There is no LMS data model, course table, or API adapter.

### 3.4. Personal Modules (Prayer, Quran, Calendar)
- **Prayer Time & Prayer Focus**: Completely absent from codebase. Zero lines of code or assets exist.
- **Quran**: The term "Quran" exists strictly as an academic classification (`typeCategory: 'quran'` / `madqur` in `curriculum-store.ts`, `mock-mapel/quran.ts`, and `master_jenjang`). There is **no Mushaf reader, no Ayah database, and no personal bookmarking module**.
- **Calendar**: `src/app/dashboard/kalender-akademik/page.tsx` and `kalender-kegiatan/page.tsx` are static placeholders displaying `"Modul Kalender — Coming Soon"`. There is no Hijri calendar engine or Kemenag synchronization.

### 3.5. Notifications
- `src/lib/notification-engine.ts` converts internal governance events (violations, punishments) into in-app notifications in the `public.notifications` table.
- There is **no push notification infrastructure** (zero FCM, APNs, or Web Push code).

---

## 4. Subscription Architecture Findings

### 4.1. The Critical Gap
Currently, the codebase conflates tenant existence with feature access. If a tenant's status is `active`, any user belonging to that tenant with the `ADMIN` role can access all 52 tenant permissions. There is no mechanism to verify:
1. Whether the tenant has an active commercial subscription.
2. Whether the subscription is in a trial, active, past-due, or grace period.
3. Which specific package tier the tenant has purchased.
4. Which add-ons are enabled for the tenant.

### 4.2. Failure Mode of Naive Implementations
If the platform naively adds an `is_lms_enabled` boolean column to the `tenants` table:
- It creates tight coupling between business packaging and database schema.
- It fails to track subscription lifecycle (start date, expiration, grace period, invoice status).
- It prevents granular add-on management and billing reconciliation.
- It cannot support multi-client enforcement without scattered `if (tenant.is_lms_enabled)` checks across every route handler.

---

## 5. Package / Add-on / Entitlement Model

To build a hardened, enterprise-grade architecture for 100+ Pesantren over 10+ years, the platform must adopt a normalized, decoupled domain model.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          COMMERCIAL LAYER                              │
│                                                                        │
│   ┌──────────────┐     bundled with     ┌──────────────────────────┐   │
│   │   PACKAGE    │─────────────────────▶│     PACKAGE_CAPABILITY   │   │
│   │ (Basic, Pro) │                      │     (Baseline Grants)    │   │
│   └──────────────┘                      └──────────────────────────┘   │
│          │                                           │                 │
│          │ subscribed by                             │                 │
│          ▼                                           ▼                 │
│   ┌──────────────┐   purchased add-ons  ┌──────────────────────────┐   │
│   │ SUBSCRIPTION │─────────────────────▶│    SUBSCRIPTION_ADDON    │   │
│   │ (Dates, Svc) │                      │     (Modular Grants)     │   │
│   └──────────────┘                      └──────────────────────────┘   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        AUTHORIZATION LAYER                             │
│                                                                        │
│                      EFFECTIVE ENTITLEMENTS                            │
│           (Computed Server-Side at API Gateway / Proxy)                │
│                                  │                                     │
│         ┌────────────────────────┴────────────────────────┐            │
│         ▼                                                 ▼            │
│  TENANT CAPABILITY                             USER RBAC PERMISSION    │
│  "Is this Pesantren licensed                   "Does this specific     │
│   for education.lms?"                           user have edit rights  │
│                                                 inside the LMS?"       │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.1. Entity Definitions (Conceptual)
1. **Capability (`capabilities`)**:
   The atomic unit of system functionality. Immutable, platform-defined strings following dot-notation:
   - `core.santri`
   - `academic.formal`
   - `academic.madin`
   - `finance.billing_flip`
   - `hardware.rfid_gate`
   - `hardware.canteen_pos`
   - `education.lms` (Moodle integration)
   - `personal.prayer_time`
   - `personal.prayer_focus`
   - `personal.quran`
   - `personal.calendar`
2. **Package (`packages`)**:
   Commercial product tier (e.g., `Starter`, `Standard`, `Enterprise`). Has quotas (max santri, max storage) and links to a set of default capabilities.
3. **Add-on (`addons`)**:
   Independently purchasable capability extensions (e.g., `Moodle LMS Add-on`, `Cashless Canteen POS Add-on`, `WhatsApp Gateway Pro`).
4. **Subscription (`tenant_subscriptions`)**:
   The active contract binding a `tenant_id` to a `package_id`. Tracks `status` (`TRIAL`, `ACTIVE`, `PAST_DUE`, `GRACE_PERIOD`, `SUSPENDED`, `CANCELLED`), `current_period_start`, and `current_period_end`.
5. **Tenant Entitlement (`effective_entitlements`)**:
   A deterministic, server-evaluated view of what a tenant can execute:
   $$\text{Effective Capabilities} = (\text{Package Capabilities} \cup \text{Active Addon Capabilities} \cup \text{Tenant Overrides}) \setminus \text{Suspended Capabilities}$$
   *Only evaluated if `tenant_subscription.status` $\in \{ \text{TRIAL}, \text{ACTIVE}, \text{GRACE\_PERIOD} \}$.*

---

## 6. Module Toggle Architecture

### 6.1. UI Toggle vs Server Truth
Super Admin module toggles in `src/app/dashboard/saas/modul-fitur/page.tsx` must **never** write arbitrary client state. The UI toggle must be an administrative client calling an authoritative mutation endpoint:
```text
Admin toggles [✓] LMS on Tenant A
    ↓
POST /api/saas/tenants/{tenantId}/entitlements
    ↓
Server checks Super Admin permission (MANAGE_SYSTEM_GLOBAL)
    ↓
Server writes to tenant_entitlement_overrides (or assigns Add-on)
    ↓
Audit log persisted with actorId and timestamp
    ↓
Tenant A's Effective Entitlements cache invalidated
```

### 6.2. Two Levels of Module Toggles
1. **Commercial Entitlement Toggle** (Platform Super Admin):
   Controls whether Tenant A is licensed to use a module.
2. **Operational Activation Toggle** (Tenant Admin):
   A tenant may be licensed for `hardware.rfid_gate`, but chooses to disable it temporarily while hardware is installed. This is a tenant setting, **not** an entitlement grant. A tenant cannot activate a module they are not commercially entitled to.

---

## 7. Moodle Architectural Boundary

Moodle is an external, highly specialized Learning Management System with over two decades of engineering behind its assessment engines, lesson flows, forum hierarchies, and SCORM compliance.

### 7.1. Boundary Matrix: What Stays in MA'HAD MANAGER vs Moodle

```
┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
│            MA'HAD MANAGER              │       │               MOODLE                   │
│         (System of Record)             │       │         (Learning Engine)              │
├────────────────────────────────────────┤       ├────────────────────────────────────────┤
│ • Tenant Lifecycle & Licensing         │       │ • Course Lesson Content & SCORM        │
│ • User Identity & Master Credentials   │ OIDC  │ • Interactive Quizzes & Question Banks │
│ • Student / Teacher Roster Records     │──────▶│ • Assignment Submissions & Rubrics     │
│ • Madrasah Rombel & Subject Master     │ Sync  │ • Student Learning Progress Logs       │
│ • Tuition & SPP Financials             │       │ • Interactive Discussion Forums        │
│ • Disciplinary Points (E-Tatib)        │◀──────│ • Detailed Quiz Attempt History        │
│ • Consolidated E-Rapor Final Grades    │ Grade │ • SCORM Tracking Data                  │
└────────────────────────────────────────┘ Pull  └────────────────────────────────────────┘
```

### 7.2. Critical Anti-Patterns to Avoid
- **Anti-Pattern 1**: Re-implementing quiz engines, question banks, or assignment grading inside MA'HAD MANAGER.
- **Anti-Pattern 2**: Letting Moodle maintain its own user passwords or independent authentication screen.
- **Anti-Pattern 3**: Exposing Moodle global site administration to tenant administrators.

---

## 8. Moodle Multi-Tenancy Analysis

We evaluated three potential deployment architectures for Moodle integration:

| Evaluation Criteria | Option A: Single Moodle Instance (Category/Cohort Separation) | Option B: Multi-Tenant Dedicated Containers (Pod / Container per Tenant) | Option C: Shared Multi-Database Moodle Architecture |
|---|---|---|---|
| **Tenant Isolation** | **WEAK**. Shared database; high risk of cross-tenant data leaks via search, plugins, or misconfigured permissions. | **MAXIMUM**. Complete database, file system, and runtime isolation per pesantren. | **MODERATE**. Separate databases, shared PHP codebase/runtime. |
| **Data Leakage Risk** | High. A single SQL injection or plugin flaw exposes all pesantren. | Minimal. Tenant database credentials isolated at network level. | Low to Moderate. |
| **Customization & Domain** | Very difficult to provide custom subdomains (`lms.pesantren-a.id`) and custom branding cleanly. | Trivial. Dedicated reverse proxy routes directly to container with custom domain/SSL. | Possible, but complex web server routing rules required. |
| **Operational Cost** | Lowest server resource usage. | Higher baseline memory (~150MB RAM idle per active tenant container). | Balanced memory usage. |
| **Upgrade / Maintenance** | Single failure takes down all pesantren simultaneously. Plugin conflicts affect everyone. | Independent upgrades, rolling restarts, failure of one tenant does not impact others. | Upgrades still risk cross-tenant schema issues. |
| **Backup & Deletion** | Complex selective row export for a departing tenant. | Clean: dump single tenant DB and delete storage volume. | Clean: drop tenant database. |

### Architectural Recommendation: **Option B (Dedicated Containerized Moodle Instance on Demand)**
For enterprise scalability, security, and strict tenant isolation, each tenant that activates the `education.lms` entitlement is provisioned with a containerized Moodle instance (e.g., via Docker / Kubernetes with a standardized lightweight image). When a tenant's subscription lapses, the container is stopped without destroying persistent volume data.

---

## 9. Moodle Identity & SSO Analysis

### 9.1. Who Owns Identity?
- **MA'HAD MANAGER owns Identity**. Credentials (passwords, sessions) reside exclusively in Supabase Auth.
- Moodle **NEVER** holds passwords. The standard Moodle internal login page is disabled.

### 9.2. SSO Protocol: OpenID Connect (OIDC) / OAuth 2.0
- MA'HAD MANAGER acts as the **OpenID Connect Provider (IdP)** (or bridges Supabase Auth OIDC).
- Moodle uses standard, community-hardened plugins (`auth_oidc` or core `auth_oauth2`).
- Flow:
  ```text
  User clicks "Buka LMS" in MA'HAD MANAGER Portal / Mobile App
      ↓
  Browser / WebView navigates to https://lms-[slug].madev.id/auth/oauth2/login.php
      ↓
  Redirects to MA'HAD MANAGER Authorization Endpoint with OIDC request
      ↓
  Server verifies active session & verifies tenant has 'education.lms' entitlement
      ↓
  Generates short-lived Authorization Code with claims:
  { sub: "user-uuid", tenant_id: "t_123", email: "...", role: "GURU" }
      ↓
  Moodle exchanges Code for ID Token & Access Token via backend channel
      ↓
  Moodle maps 'sub' to existing account or auto-provisions account via JIT (Just-In-Time)
      ↓
  User lands directly inside Moodle dashboard with zero secondary login prompt
  ```

### 9.3. Tenant Context Isolation in SSO
To prevent a user belonging to Tenant A from ever accessing Tenant B's Moodle:
1. The OIDC authorization endpoint checks that the incoming client redirect URL matches the tenant's registered Moodle instance (`lms-[tenantSlug].madev.id`).
2. The user's active membership in `user_tenant_memberships` must match the target Moodle's `tenant_id`.
3. If a user has memberships in multiple pesantren, SSO enforces the currently selected tenant workspace.

---

## 10. Moodle Role Mapping

Moodle permissions must follow the Principle of Least Privilege. Under no circumstances should platform or tenant administrators be mapped to Moodle Site Administrator.

| MA'HAD MANAGER Role | Target Moodle Role | Scope / Context in Moodle | Permissions & Capabilities |
|---|---|---|---|
| `SUPER_ADMIN` (Platform) | *None / Dedicated Auditor* | Read-only CLI / Support | No interactive Moodle account, or emergency system admin via private backend network. |
| `ADMIN` (Tenant Admin) | **Manager** (`manager`) | Tenant Category Context | Can create courses, assign teachers, view all reports; **cannot** install PHP plugins or alter core Moodle system settings. |
| `GURU` (Teacher) | **Teacher / Editing Teacher** (`editingteacher`) | Assigned Course Context Only | Can upload materials, create quizzes, grade assignments; cannot view courses outside their assigned subjects. |
| `SANTRI` (Student) | **Student** (`student`) | Enrolled Course Context Only | Can view lessons, submit assignments, take quizzes, view own gradebook. |
| `WALI` (Parent) | **Parent / Mentor** (`parent` role) | Linked Student Context Only | Read-only observation of child's learning activity and completion; no course participation. |
| `MUSYRIF` (Dormitory) | *None* | N/A | Character and dorm management remains in MA'HAD MANAGER E-Tatib. |

---

## 11. Moodle Data Ownership Matrix

| Data Domain | Source of Truth (SoT) | Read Path | Write Path | Sync Mechanism | Retention Policy |
|---|---|---|---|---|---|
| **Tenant Account & Licensing** | MA'HAD MANAGER | Moodle reads via SSO | MA'HAD MANAGER Admin | Real-time at SSO handshake | Retained in MA'HAD MANAGER |
| **User Profile & Identity** | MA'HAD MANAGER | Moodle reads via OIDC | MA'HAD MANAGER Profile | Just-In-Time (JIT) via OIDC | MA'HAD MANAGER SoT |
| **Academic Master (Mapel & Rombel)** | MA'HAD MANAGER | Moodle | MA'HAD MANAGER Kurikulum | Event-driven Outbox Push | MA'HAD MANAGER SoT |
| **Teacher Course Assignment** | MA'HAD MANAGER | Moodle | MA'HAD MANAGER Kurikulum | Event-driven Outbox Push | MA'HAD MANAGER SoT |
| **Student Enrollment in Course** | MA'HAD MANAGER | Moodle | MA'HAD MANAGER Rombel | Event-driven Outbox Push | MA'HAD MANAGER SoT |
| **Course Content & SCORM** | **Moodle** | Web / Mobile WebView | Teacher in Moodle | None (Resides in Moodle) | Moodle Persistent Storage |
| **Quiz Attempts & Submissions** | **Moodle** | Teacher / Student | Student in Moodle | None (Resides in Moodle) | Moodle Persistent Storage |
| **Final Subject Grade / Aggregates** | **Moodle** | MA'HAD MANAGER E-Rapor | Teacher in Moodle | Scheduled Batch / Pull API | Synced to `academic_ledger` |

---

## 12. Moodle Synchronization Architecture

Synchronization must be **unidirectional for master data** (MA'HAD MANAGER $\rightarrow$ Moodle) and **selective/event-driven for results** (Moodle $\rightarrow$ MA'HAD MANAGER).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SYNCHRONIZATION PIPELINE                        │
│                                                                        │
│   [MA'HAD MANAGER EVENT]                                               │
│   (e.g., student assigned to class)                                    │
│             │                                                          │
│             ▼                                                          │
│   [outbox_events table] ──▶ [Background Dispatcher]                    │
│                                      │                                 │
│                                      ▼                                 │
│                         [Moodle REST API Client]                       │
│                         (core_enrol_manual_enrol_users)                │
│                                      │                                 │
│                                      ▼                                 │
│                            [Target Tenant Moodle]                      │
│                                                                        │
│   [GRADE SYNC (Pull)]                                                  │
│   [MA'HAD MANAGER Cron] ──▶ [Query Moodle Gradebook API]               │
│                                      │                                 │
│                                      ▼                                 │
│                            [Update academic_ledger]                    │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Idempotency & Resilience**:
   - Outbox pattern utilizes the existing `outbox_events` table (`src/lib/db/schema.ts` line 429).
   - Events are tagged with `tenant_id`, `event_type` (`ROSTER_ENROLLED`, `COURSE_CREATED`), and unique idempotency keys.
   - Failures retry with exponential backoff; Moodle downtime never blocks MA'HAD MANAGER web transactions.
2. **Conflict Avoidance**:
   - Because master data is strictly owned by MA'HAD MANAGER, Moodle roster data is read-only from the student's perspective. There is zero bidirectional data conflict.

---

## 13. Web Architecture

- **Role**: Primary comprehensive administrative portal for school leadership, administrators, teachers, and Super Admins.
- **Technology**: Current Next.js 16 + React 19 codebase remains canonical.
- **Enhancement Required**:
  - Integrate server-side entitlement checks into `src/proxy.ts` or layout server components.
  - Implement a dynamic feature-gate wrapper (`<EntitlementGate capability="education.lms">`) to gracefully hide or display licensed modules.
  - Expose clean REST endpoints for mobile/desktop consumption without relying on cookie authentication.

---

## 14. Mobile Architecture (Android & iOS)

### 14.1. Framework Recommendation: **Flutter (Dart)**
While React Native / Expo allows JavaScript code reuse, **Flutter is architecturally superior** for MA'HAD MANAGER's multi-platform roadmap for the following reasons:
1. **Quranic Text Rendering**: The Holy Qur'an requires intricate Harakat ligatures, Tajweed colorings, and custom font glyphs (LPMQ Misbah / Uthmanic). Flutter's Skia/Impeller rendering engine renders complex typography identically across all Android and iOS devices without native platform font rasterization quirks.
2. **True Native Desktop Convergence**: Flutter compiles directly to native machine code on Windows, macOS, and Linux from the same codebase, ensuring that the future desktop application shares UI and state seamlessly with mobile.
3. **Background Services**: Precise prayer time calculation and background alarm managers run reliably in Dart isolate workers.
4. **Offline Database**: Native SQLite integration (via `sqflite` or `drift`) allows bundling the 6,236 ayah Quran database with zero serialization overhead.

### 14.2. Mobile Experience Scope
- **Wali Santri**: Student attendance, health reports, SPP payments (Flip SDK/WebView), gate checkout notifications, and spiritual personal modules.
- **Santri / Musyrif**: Dorm room checks, violations log, prayer times, personal Quran.
- **Moodle Access on Mobile**: Moodle courses can be accessed seamlessly via authenticated In-App WebView (with session cookie injected via SSO) or via Moodle Mobile App deep linking.

---

## 15. Desktop Architecture (Windows initially, macOS/Linux later)

### 15.1. Framework Evaluation
- **Option 1: Flutter Desktop**: Best if Flutter is selected for Mobile (100% shared business logic, UI widgets, and API client).
- **Option 2: Tauri (Rust + Web Frontend)**: Best if the existing Next.js / React web interface is packaged as a local desktop client. Tauri uses Microsoft Edge WebView2 on Windows, resulting in a tiny ~15MB binary and ~40MB RAM usage (compared to Electron's 200MB+).

### 15.2. Desktop Specific Capabilities
- **High-Speed Hardware Interfaces**: Direct USB communication with RFID Card Readers (tap KTA at entrance gate or canteen cashier).
- **Hardware Receipt Printing**: Direct ESC/POS thermal printer communication for cash canteen transactions or payment proofs without browser print dialog popups.
- **Offline Administrative Cache**: Ability to buffer gate scans during internet dropouts and sync transaction batches when connectivity resumes.

---

## 16. Prayer Time Architecture

### 16.1. Core Principles
- **Location follows user/device**: The device's GPS provides coordinates.
- **No Pondok Fallback**: If location permission is denied or coordinates are unavailable, the application displays a **Location Gate** explaining why coordinates are required.
- **Strict Privacy**: Location coordinates are processed **exclusively on-device**. No user location telemetry is streamed or stored on the backend server.

### 16.2. Calculation & Caching Pipeline
```
[Device GPS] ──▶ [Verify Accuracy] ──▶ [On-Device Astronomical Calculator]
                                                    │
                      (Kemenag Criteria: Subuh 20°, Isya 18°)
                                                    │
                                                    ▼
                                       [Compute Monthly Schedule]
                                                    │
                                                    ▼
                                         [Local SQLite / Hive Cache]
                                                    │
                                                    ▼
                                        [Schedule OS Alarm Reminders]
```
- Computation runs locally using standard astronomical formulas (MABIMS / Kemenag standard).
- Once coordinates are acquired, the entire month's prayer times are computed and stored in local cache, enabling 100% offline functionality.

---

## 17. Prayer Focus Feasibility (Native App Blocking)

The proposed "Prayer Focus" feature aims to freeze or block distracting apps on the user's phone during prayer times, requiring an explicit confirmation ("Apakah Anda sudah shalat?") to unlock.

### 17.1. Android Technical Analysis: **FEASIBLE WITH POLICY CAVEATS**
- **Mechanism**: Implemented via `UsageStatsManager` (to detect the active foreground application package) and `AccessibilityService` or `SYSTEM_ALERT_WINDOW` (to render a persistent, full-screen blocking overlay over blocked apps).
- **Feasibility**: High. This is the exact mechanism used by digital wellbeing and app-locker applications on Android.
- **Store Policy Risk**: Google Play strictly scrutinizes `AccessibilityService`. The app must declare itself under the "Digital Wellbeing" category and include a prominent in-app disclosure explaining that Accessibility is used solely for blocking distracting apps during prayer times.
- **Battery Optimization**: The app must request exemption from Doze mode (`REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`) to wake the device reliably.

### 17.2. iOS Technical Analysis: **STRICTLY CONSTRAINED (NO UNIVERSAL BLOCKING)**
- **Sandbox Limitation**: iOS does **not** allow arbitrary background processes to inspect running apps or draw overlays over other applications.
- **Apple Screen Time API (`FamilyControls` & `ManagedSettings`)**:
  - Apple provides `ManagedSettingsStore` which can shield applications.
  - **CRITICAL CAVEAT**: Using `FamilyControls` requires a **special entitlement granted directly by Apple** upon request. Apple routinely rejects apps that are not parental control tools or approved wellbeing apps.
- **Alternative for iOS**:
  - Focus Mode integration via iOS Shortcuts / Focus Filter APIs.
  - Local push notifications with sound/haptics reminding the user to pray.
- **Strategic Recommendation**: **Do not promise cross-platform universal app blocking**. Clearly communicate that Prayer Focus full app blocking is an Android-exclusive capability, while iOS provides Focus Mode guidance and high-priority alarms.

---

## 18. Quran Architecture

### 18.1. Data Sourcing & Text Integrity
- **Canonical Text**: Standard Indonesian Standard Mushaf (Mushaf Standar Indonesia - MSI) published by Lajnah Pentashihan Mushaf Al-Qur'an (LPMQ) Kementerian Agama RI.
- **Aya Data**: 6,236 Ayat across 114 Surahs, bundled in a local compressed SQLite database (~25MB).
- **Harakat & Glyph Rendering**: Requires bundling the official `LPMQ Misbah` or `KFGQPC Uthmanic Script HAFS` TrueType/OpenType font to prevent broken ligatures on Android/iOS/Desktop.

### 18.2. Translation & Tafsir Licensing
- **Translation**: Kemenag RI 2019 Revised Translation (publicly available for Islamic educational use with attribution).
- **Tafsir**: Tafsir Tahlili and Tafsir Ringkas Kemenag RI. Third-party classical tafsir (e.g., Jalalain, Ibnu Katsir, As-Sa'di) require licensing verification or public domain verification.

### 18.3. Multi-Device Synchronization
- The Quran text and tafsir reside **100% locally on the client**.
- The backend only synchronizes lightweight user telemetry:
  ```json
  {
    "userId": "c29f1385-6489-468a-bfb2-540ceda0e8f4",
    "lastRead": {
      "surah": 18,
      "ayah": 27,
      "page": 296,
      "updatedAt": "2026-09-13T07:30:00Z"
    },
    "bookmarks": [
      { "id": "bm_1", "surah": 2, "ayah": 255, "label": "Ayat Kursi", "color": "emerald" }
    ]
  }
  ```

---

## 19. Calendar Architecture (Gregorian & Official Kemenag Hijri)

### 19.1. The Hijri Calendar Problem
The Islamic Hijri calendar is lunar and depends on moon sighting (*Rukyatul Hilal*) and astronomical calculations (*Hisab*). In Indonesia, official Hijri dates are decreed by the Ministry of Religious Affairs (Kemenag RI) following MABIMS criteria (elongation 6.4°, altitude 3°). Algorithmic Umm al-Qura calculations frequently deviate by 1-2 days from official Indonesian decrees.

### 19.2. Automated Background Ingestion Pipeline
To keep calendars synchronized without human error or manual Super Admin intervention:

```
[Kemenag API / Verified Source]
             │
             ▼ (Automated Scheduled Cron Worker)
[Staging Table: hijri_calendar_staging]
             │
             ▼ (Integrity & Anomaly Validator)
   ┌─────────────────────┐
   │ Check 1: 12 months? │
   │ Check 2: 29-30 days?│
   │ Check 3: Gaps = 0?  │
   └─────────────────────┘
             │
      VALID? ├─── NO ───▶ [Discard & Alert Admin] ──▶ [KEEP ACTIVE VERSION]
             │
            YES
             │
             ▼
[Publish to hijri_calendar_active] (Atomic Version Swap)
             │
             ▼
[Clients cache active version offline]
```

- **Fail-Closed Principle**: If Kemenag sources are unreachable, return malformed JSON, or show date anomalies, the system **freezes the current active calendar**. It never publishes unverified dates.

---

## 20. Notification Architecture

### 20.1. Unified Notification Dispatcher
The platform requires a centralized notification routing service on the backend:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      CENTRAL NOTIFICATION DISPATCHER                  │
│                                                                        │
│                      Incoming Event / Trigger                          │
│                                  │                                     │
│         ┌────────────────────────┼────────────────────────┐            │
│         ▼                        ▼                        ▼            │
│   [Push Service]         [WhatsApp Gateway]        [In-App Store]      │
│   (Firebase / APNs)      (Existing WA Key)       (PostgreSQL Table)    │
│         │                        │                        │            │
│         ▼                        ▼                        ▼            │
│  Mobile & Desktop          Wali Santri Phone         Web Dashboard     │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Push Notifications (FCM / APNs)**:
   - Device tokens stored in `user_device_tokens` (`user_id`, `tenant_id`, `platform`, `token`, `last_used_at`).
   - Clean tenant isolation: Notification payloads are tagged with `tenant_id` to prevent cross-tenant notification leaks.
2. **Transactional Messaging (WhatsApp & Email)**:
   - WhatsApp via existing `waGatewayApiKey` in `tenant_settings` for SPP bills and urgent gate exits.
   - Email via Resend for user password setups and platform announcements.

---

## 21. Offline Architecture

### 21.1. Tiered Offline Strategy

| Priority | Data / Feature | Offline Mechanism | Sync Behavior | Conflict Resolution |
|---|---|---|---|---|
| **P0** | **Quran Mushaf & Tafsir** | Bundled local SQLite database (~25MB) | Never needs internet for reading. | N/A (Static read-only) |
| **P0** | **Prayer Times Schedule** | Pre-computed monthly cache in local SQLite | Refresh coordinates on demand. | Device calculation is authoritative |
| **P1** | **Hijri & Gregorian Calendar** | Local SQLite table | Background fetch when online. | Server version is authoritative |
| **P1** | **Personal Bookmarks & Notes** | Local-first SQLite store | Bidirectional sync on reconnect. | Last-Write-Wins based on ISO UTC timestamp |
| **P2** | **Cached Dashboard Summary** | Memory / Secure Cache (Encrypted) | Read-only view when offline; warns user data may be stale. | Stale-While-Revalidate |
| **P3** | **Administrative Mutations** | **Blocked Offline**. Financial payments, roster edits, and grades require real-time server authorization. | No offline queuing of financial edits. | Server is authoritative |

---

## 22. Security Boundary

```
Web Client (Browser)          Native Mobile / Desktop              External Moodle
┌───────────────────┐        ┌─────────────────────────┐        ┌───────────────────┐
│ • HTTPS Cookies   │        │ • OAuth 2.0 PKCE        │        │ • OpenID Connect  │
│ • SameSite=Lax    │        │ • Secure KeyStore /     │        │ • Shared Secret / │
│ • CSRF Protection │        │   Keychain Storage      │        │   Private Key     │
└─────────┬─────────┘        └────────────┬────────────┘        └─────────┬─────────┘
          │                               │                               │
          ▼                               ▼                               ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                    MA'HAD MANAGER API GATEWAY & PROXY                             │
│                                                                                   │
│  1. Server-Derived Tenant Context (Never trusts client x-tenant-id header)        │
│  2. Fail-Closed Authentication (Validates Supabase Auth Session / JWT)            │
│  3. Subscription Entitlement Check (Is tenant licensed for requested capability?)│
│  4. RBAC Authorization (getEffectivePermissions / requirePermission)             │
│  5. Input Sanitization & Zero Secret Exposure Policy                              │
└───────────────────────────────────────────────────────────────────────────────────┘
```

1. **Zero-Trust Tenant Derivation**:
   - The server **never** trusts `x-tenant-id` supplied in incoming client request headers.
   - On Web: Derived from verified hostname subdomain or authenticated session claims.
   - On Mobile/Desktop API: Extracted from cryptographically signed Supabase JWT claims verified by server.
2. **Defense-in-Depth for Entitlements**:
   - Client hiding a button is purely aesthetic.
   - Backend API endpoints evaluate `checkTenantEntitlement(tenantId, capability)` **before** processing any request. If entitlement is missing or suspended, returns `403 Forbidden` (`CAPABILITY_NOT_ENTITLED`).

---

## 23. API Contract Architecture

To serve Web, Mobile, Desktop, and Moodle harmoniously:
1. **Move away from Cookie-only APIs**:
   Currently, `src/proxy.ts` expects Supabase session cookies. For native clients, API routes must support standard `Authorization: Bearer <supabase_jwt>` headers.
2. **Typed DTOs via Shared Contracts**:
   All API payloads and responses must be defined using Zod schemas and TypeScript types exported from a single system of record.
3. **Canonical Error Response Format**:
   ```json
   {
     "success": false,
     "error": "Forbidden",
     "code": "ENTITLEMENT_REQUIRED",
     "capability": "education.lms",
     "message": "Fitur LMS Moodle belum aktif pada paket langganan pesantren Anda."
   }
   ```

---

## 24. Repository Strategy

### 24.1. Evaluation of Options
- **Monorepo (Turborepo / Nx)**: Houses Web, Mobile, Desktop, and shared packages in one git repository.
  - *Risk*: Modifying shared configurations risks breaking the existing web application build and production CI/CD.
- **Multi-Repo (Polyrepo)**: Separate git repositories for Web, Mobile, Desktop, and Moodle infrastructure.
  - *Benefit*: **Maximum stability for existing web app**. Mobile or Moodle development cannot accidentally destabilize web deployments or test suites.

### 24.2. Recommended Strategy: **Polyrepo with Shared Contract Package**
1. **`mahad-web`** (Current Repository: `Os_Darta`): Canonical web dashboard, SaaS management, API routes, database migrations, and Supabase client.
2. **`mahad-contracts`** (Shared Git Submodule or Private NPM Package): Contains shared TypeScript types, Zod schemas, permission strings, and capability constants.
3. **`mahad-mobile`** (New Repository): Flutter project for Android & iOS.
4. **`mahad-moodle`** (New Repository): Dockerized Moodle deployment templates, Helm charts, and custom Moodle OIDC auth plugins.

---

## 25. System Boundary Diagram

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │                     CLIENT SURFACES                    │
                                    │                                                        │
                                    │   ┌──────────────┐   ┌──────────────┐   ┌──────────┐   │
                                    │   │     WEB      │   │    MOBILE    │   │ DESKTOP  │   │
                                    │   │ (Next.js 16) │   │ (iOS/Android)│   │(Windows) │   │
                                    │   └───────┬──────┘   └──────┬───────┘   └────┬─────┘   │
                                    └───────────┼─────────────────┼────────────────┼─────────┘
                                                │                 │                │
                                                ▼                 ▼                ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MA'HAD MANAGER BACKEND                                     │
│                                                                                            │
│   ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                               EDGE / PROXY GATEWAY                                 │   │
│   │   • Hostname / Subdomain Router       • Fail-Closed Auth Verifier                  │   │
│   │   • Zero-Trust Tenant Resolver        • Rate Limiting & CSRF Shield                │   │
│   └─────────────────────────────────────────┬──────────────────────────────────────────┘   │
│                                             │                                              │
│                                             ▼                                              │
│   ┌────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                       CANONICAL AUTHORIZATION PIPELINE                             │   │
│   │                                                                                    │   │
│   │       [Tenant Subscription Engine] ──▶ [Effective Entitlements Evaluator]          │   │
│   │                                                       │                            │   │
│   │                                                       ▼                            │   │
│   │                                           [RBAC Permission Engine]                 │   │
│   │                                          (requirePermission - 52 perms)            │   │
│   └─────────────────────────────────────────┬──────────────────────────────────────────┘   │
│                                             │                                              │
│                        ┌────────────────────┴───────────────────┐                          │
│                        ▼                                        ▼                          │
│   ┌──────────────────────────────────────────┐    ┌────────────────────────────────────┐   │
│   │             DATABASE LAYER               │    │       INTEGRATION & EVENTS         │   │
│   │  • Supabase Auth (Global Identity)       │    │  • Outbox Dispatcher (Postgres)    │   │
│   │  • PostgreSQL (Multi-Tenant Schemas)     │    │  • Unified Notification Dispatcher │   │
│   │  • Drizzle ORM System of Record          │    │  • WhatsApp / Resend Email Engine  │   │
│   └──────────────────────────────────────────┘    └─────────────────┬──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┼──────────────────────┘
                                                                      │
                                        OIDC SSO & Event Sync         ▼
                                                ┌─────────────────────────────┐
                                                │    EXTERNAL MOODLE LMS      │
                                                │   (Dedicated Containers)    │
                                                │  • Course Lesson Content    │
                                                │  • Quizzes & Gradebook      │
                                                │  • Student SCORM Learning   │
                                                └─────────────────────────────┘
```

---

## 26. Entitlement Enforcement Matrix

| Capability Token | Web UI Visible | Web API Authorized | Mobile App Visible | Desktop App Visible | Moodle Accessible | Server Enforcement Point |
|---|---|---|---|---|---|---|
| `core.santri` | Yes (If Entitled) | Yes | Yes (If Entitled) | Yes (If Entitled) | N/A | `requirePermission('view_santri')` + Tenant Entitlement |
| `academic.formal` | Yes (If Entitled) | Yes | Yes (If Entitled) | Yes (If Entitled) | N/A | `requirePermission('view_struktur_akademik')` + Tenant Entitlement |
| `education.lms` | Yes (If Entitled) | Yes | Yes (WebView) | Yes (WebView) | **YES** (OIDC SSO) | Gateway OIDC Auth Endpoint + `checkEntitlement('education.lms')` |
| `personal.prayer_time` | Optional Widget | N/A (Client Calc) | **YES** (Native) | Optional Widget | N/A | Client Location + Offline Astronomical Engine |
| `personal.prayer_focus` | N/A (Web cannot block) | N/A | **YES** (Android OS) | N/A | N/A | Android `AccessibilityService` Local Policy |
| `personal.quran` | Optional Reader | Yes (Sync API) | **YES** (Offline) | Optional Reader | N/A | Local SQLite Mushaf; Sync endpoint checks `personal.quran` |
| `personal.calendar` | Yes (Portal) | Yes (Sync API) | **YES** (Hijri) | Yes | N/A | Ingestion Cron checks Kemenag integrity; client caches locally |

---

## 27. Subscription Lifecycle Matrix

| Event | Subscription Status | Tenant Web Access | Moodle Container State | Moodle Data Retention | Student Roster Data |
|---|---|---|---|---|---|
| **Package Purchased** | `ACTIVE` | All package modules active | Running & Accessible | Active read/write | Active |
| **Add-on Purchased (LMS)**| `ACTIVE` | LMS module badge visible | Container Provisioned | Active read/write | Enrolled |
| **Payment Overdue (Day 1-7)**| `PAST_DUE` | Active with banner notice | Running with banner | Active read/write | Active |
| **Grace Period (Day 8-30)**| `GRACE_PERIOD`| Restricted admin view | Container Running; Student login disabled | Active read-only for admin | Frozen |
| **Subscription Expired** | `SUSPENDED` | Read-only archive mode | Container Stopped (Hibernated) | **Retained safely (No deletion)**| Read-only |
| **Reactivation** | `ACTIVE` | Fully restored | Container Restarted | Instantly accessible | Fully restored |
| **Definitive Termination**| `CANCELLED` | Export data option only | Container Backed up to cold archive | Cold storage archive (90 days) | Exportable |

---

## 28. Data Ownership Matrix

| Data Entity | Authoritative Master (SoT) | Replica / Consumer | Sync Trigger | Conflict Resolution |
|---|---|---|---|---|
| **Institution / Tenant Profile** | MA'HAD MANAGER | Moodle | On Update | MA'HAD MANAGER wins |
| **User Identity & Password** | Supabase Auth (MA'HAD MANAGER) | None (Moodle uses OIDC) | Instantaneous | Supabase Auth wins |
| **Madrasah Classes & Mapel** | MA'HAD MANAGER | Moodle Course Shells | Outbox Event | MA'HAD MANAGER wins |
| **Class Enrollments** | MA'HAD MANAGER | Moodle Cohorts/Enrolments | Outbox Event | MA'HAD MANAGER wins |
| **LMS Assignments & Quizzes** | **Moodle** | None | Real-time in LMS | Moodle wins |
| **Student Submissions & Answers**| **Moodle** | None | Real-time in LMS | Moodle wins |
| **Final Term Subject Grades** | **Moodle** | MA'HAD MANAGER `academic_ledger`| End-of-Term Pull | Moodle gradebook authoritative for LMS portion |
| **Personal Quran Bookmarks** | Client Device | MA'HAD MANAGER Backend | Reconnect Sync | Last-Write-Wins (UTC Timestamp) |
| **Official Kemenag Hijri Dates**| Kemenag RI Source | MA'HAD MANAGER Staging | Nightly Ingestion | Validated Kemenag decree wins |

---

## 29. Risk Register

| Risk ID | Risk Description | Severity | Likelihood | Mitigation Strategy |
|---|---|---|---|---|
| **RSK-001** | **Apple App Store Rejection for App Blocking**: Apple rejects Prayer Focus app blocking due to `FamilyControls` entitlement policy. | High | High | Scope app blocking as Android-first; provide Focus Mode integration and high-priority alarms for iOS. |
| **RSK-002** | **Cross-Tenant Moodle Data Leak**: Misconfigured shared Moodle instance allows Pesantren A teacher to view Pesantren B students. | Critical | Low | Adopt Dedicated Containerized Moodle instances (Option B) with network-isolated databases. |
| **RSK-003** | **Hijri Date Misalignment**: Algorithmic calendar displays Eid or Ramadan on the wrong day compared to government decree. | High | Medium | Implement automated Kemenag ingestion pipeline with fail-closed validation and atomic version swaps. |
| **RSK-004** | **API Session Incompatibility on Native**: Next.js cookie proxy fails to authenticate native mobile requests. | High | High | Refactor API Gateway to support dual-mode authentication (Cookies for Web, Bearer JWT for Mobile/Desktop). |
| **RSK-005** | **Quranic Typography Corruption**: Broken Arabic Harakat on low-end Android devices leading to community backlash. | High | Medium | Bundle standardized TrueType font (`LPMQ Misbah`) with Flutter engine; avoid system font fallback. |

---

## 30. Open Business Decisions

1. **Packaging & Pricing Structure**:
   - What are the exact baseline limits for Starter, Pro, and Enterprise (e.g., santri count, storage quota)?
   - Is Moodle LMS bundled into the Enterprise tier or sold exclusively as an add-on?
2. **Moodle Infrastructure Billing**:
   - Does Pesantren pay for their Moodle server resources directly, or is it covered in a flat monthly subscription fee?
3. **Grace Period Duration**:
   - How many days of grace period are allowed before a non-paying tenant's Moodle container is stopped? (Recommended: 14 days notice, 30 days hibernation).

---

## 31. Open Technical Decisions

1. **Mobile Engine Selection**:
   - Finalize decision between **Flutter** (recommended for cross-platform desktop/mobile convergence and Quran rendering) vs **React Native / Expo** (TypeScript team familiarity).
2. **OIDC Provider Architecture**:
   - Determine whether MA'HAD MANAGER will implement an RFC 6749 OAuth 2.0 / OIDC provider layer directly on Next.js, or leverage Supabase Auth's native third-party OAuth provider capabilities.
3. **Moodle Container Orchestration**:
   - Decide between Docker Compose with Traefik reverse proxy (for initial 10-25 tenants) vs Kubernetes with Helm (for 100+ enterprise scale).

---

## 32. Recommended Architecture

1. **Multi-Tenant System of Record**:
   Retain current Next.js 16 + Supabase Auth + PostgreSQL + Drizzle ORM architecture as the canonical web platform and API backend.
2. **Entitlement-Driven Gateway**:
   Implement normalized `packages`, `addons`, `tenant_subscriptions`, and `effective_entitlements` tables in PostgreSQL. Enforce capabilities at the API Gateway level before any business logic executes.
3. **External Moodle Pod Architecture**:
   Deploy containerized Moodle instances on demand. Connect via OpenID Connect SSO. Never store passwords in Moodle.
4. **Flutter Client for Mobile & Desktop**:
   Develop a single unified Flutter codebase targeting Android, iOS, and Windows. Bundle the official Kemenag Quran database and offline astronomical prayer calculator.
5. **Polyrepo Strategy**:
   Keep `mahad-web` repository isolated to ensure continuous production stability. Publish shared contracts to coordinate between mobile, web, and Moodle teams.

---

## 33. Recommended Future Work Packages (WPs)

To implement this vision without scope creep or architectural regression, the following work packages are proposed:

1. **`WP-SUBSCRIPTION-ENTITLEMENT-DISCOVERY`**:
   Formal database schema design and migration plan for Packages, Add-ons, Subscriptions, and Capabilities.
2. **`WP-SHARED-API-CONTRACT-DISCOVERY`**:
   Specification of dual-mode authentication (Cookies + Bearer JWT) and REST API contracts for native clients.
3. **`WP-MOODLE-SSO-OIDC-DISCOVERY`**:
   Detailed specification of the OpenID Connect IdP handshake, token claims, and JIT provisioning in Moodle.
4. **`WP-NATIVE-MOBILE-DISCOVERY`**:
   UI/UX prototyping, Flutter architectural skeleton, and state management design for Android & iOS.
5. **`WP-PERSONAL-MODULE-SPIRITUAL-DISCOVERY`**:
   Detailed technical design for Kemenag Quran SQLite packaging, Harakat font licensing, and offline prayer calculation.
6. **`WP-CALENDAR-KEMENAG-INGEST-DISCOVERY`**:
   Specification for the automated Kemenag Hijri scraping/API ingestion worker and staging validation rules.

---

## 34. Implementation Order

```text
Phase 1: Foundation (SaaS Core)
  WP-SUBSCRIPTION-ENTITLEMENT-DISCOVERY
      ↓
  Implementation of Subscription & Capability Schema
      ↓
  Refactoring Authorization Gateway (Dual-mode Auth & Entitlement Checks)

Phase 2: Integration (External LMS)
  WP-MOODLE-SSO-OIDC-DISCOVERY
      ↓
  Containerized Moodle Orchestration & Outbox Synchronization

Phase 3: Multi-Client Expansion
  WP-SHARED-API-CONTRACT-DISCOVERY
      ↓
  WP-NATIVE-MOBILE-DISCOVERY & WP-PERSONAL-MODULE-SPIRITUAL-DISCOVERY
      ↓
  Flutter Android & iOS Implementation (Mobile-first Wali/Santri Portal)

Phase 4: Desktop & Specialized Hardware
  Windows Desktop Client (Thermal printing, RFID Gate, Offline Cashier)
```

---

## 35. Explicit Non-Goals

The following items are **explicitly out-of-scope** for this discovery and future implementation:
1. Re-writing or replicating Moodle's quiz, grading, or SCORM engine inside Next.js.
2. Re-introducing Firebase or Firestore as an active architectural component.
3. Creating universal app blocking on iOS (technically restricted by Apple sandbox).
4. Performing big-bang repository migrations or monorepo rewrites.
5. Modifying any active database schema, migration files, or production source code during discovery.

---

## 36. Final Verdict

The proposed evolution of MA'HAD MANAGER into a multi-client, entitlement-governed platform is **ARCHITECTURALLY SOUND AND HIGHLY FEASIBLE**, provided that:
1. Commercial entitlements and RBAC permissions remain strictly separated.
2. Moodle is integrated as a federated OIDC consumer rather than an internal monolith.
3. Native mobile and personal spiritual modules are built local-first to guarantee offline resilience.
4. The existing web platform continues to serve as the hardened, stable System of Record.

---

## STATUS

WP:
WP-NATIVE-PLATFORM-DISCOVERY-001

MODE:
READ-ONLY DISCOVERY

SCOPE:
Native Mobile + Native Desktop + Moodle LMS + Subscription + Package + Add-on + Entitlement + Module Toggle + Personal Modules + Shared Backend + Security + API + Repository Architecture

SOURCE CHANGES:
NONE

DATABASE CHANGES:
NONE

DEPENDENCY CHANGES:
NONE

MOODLE CHANGES:
NONE

NATIVE PROJECT CHANGES:
NONE

COMMIT:
NONE

PUSH:
NONE

DEPLOY:
NONE

ARCHITECTURE REVIEW:
READY FOR PRODUCT OWNER REVIEW

NEXT ACTION:
STOP AND WAIT FOR PRODUCT OWNER ARCHITECTURE REVIEW
