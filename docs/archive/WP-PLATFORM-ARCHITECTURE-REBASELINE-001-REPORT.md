# WP-PLATFORM-ARCHITECTURE-REBASELINE-001
# PLATFORM ARCHITECTURE REBASELINE & STRATEGIC DISCOVERY REPORT
## Enterprise Multi-Tenant SaaS Architecture for MA'HAD MANAGER

**Document Identifier**: `WP-PLATFORM-ARCHITECTURE-REBASELINE-001-REPORT`  
**Author**: Senior Software Architect & Architecture Auditor  
**Classification**: ARCHITECTURE BASELINE & REVISION RECORD  
**Target Scope**: 10 Pesantren (Initial Scale) $\rightarrow$ 100+ Pesantren (10-Year Vision)  
**Status**: PLANNING & DISCOVERY ONLY (READ-ONLY AUDIT)  

---

## 1. Executive Summary

This Work Package establishes the definitive architectural baseline for **MA'HAD MANAGER**, reconciling past discovery insights with the latest Product Owner strategic decisions. 

MA'HAD MANAGER is an Enterprise Multi-Tenant SaaS platform engineered for Islamic boarding schools (*Pesantren* and *Madrasah*). The platform currently runs on Next.js 16 (Turbopack, App Router, React 19), Supabase Auth, PostgreSQL (Drizzle ORM), and Zustand, with Google Drive handling media/document storage.

### Key Product Owner Strategic Decisions (The Rebaseline)
1. **WEB is the Primary Administration Platform**:
   All administrative, operational, academic, financial, SaaS management, and content management workflows reside on the Web platform.
2. **DESKTOP NATIVE IS NOT REQUIRED**:
   Native desktop applications (Windows/macOS/Linux via Electron or Tauri) are **explicitly dropped**. Desktop users will access the platform exclusively via modern web browsers using the responsive Ma'had Manager Web Application.
3. **TENANT WEBSITE CMS IS A CORE WEB-ONLY CAPABILITY**:
   Every tenant institution receives a dedicated public website (`[slug].madev.id` or custom domain). The CMS must be **Web-only**, visual, block/section-based, and designed specifically for **non-programmer pesantren administrators** (drag-and-drop, template-driven, draft/publish, mobile-responsive, SEO-optimized).
4. **MOODLE is the External Specialized LMS**:
   Moodle is integrated as an external, entitlement-governed LMS service. MA'HAD MANAGER remains the master System of Record (SoT) for Identity, Tenants, Rosters, and Commercial Licensing. Moodle handles learning content, quizzes, and SCORM.
5. **MOBILE NATIVE (Android & iOS) is Reserved for End-User Mobile Experiences**:
   Native mobile apps are planned for Asatidz/Guru, Santri, Wali Santri, and Musyrif (Attendance, QR/NFC, Schedule, Notifications, and Personal Spiritual modules like Prayer Times, Prayer Focus, and offline Quran). Native mobile development is **deferred** and not implemented in this WP.
6. **INITIAL SCALE: 10 PESANTREN**:
   The architecture is optimized for a pragmatic, cost-effective, and robust launch of 10 pilot pesantren (~3,000–10,000 santri total), while ensuring strict multi-tenant isolation so that scaling to 100+ institutions requires no architectural rewrites.

---

## 2. Current Architecture Evidence

A comprehensive forensic audit of the repository reveals the following concrete implementation realities:

| Component / Layer | Implementation in Codebase | Source File Evidence | Maturity Status |
|---|---|---|---|
| **Web Runtime** | Next.js 16.2.6, React 19.2.4, Tailwind CSS v4 | `package.json`, `src/app/` | **PRODUCTION READY** |
| **Identity & Authentication** | Supabase Auth SSR, `public.users` mapping | `src/proxy.ts`, `src/lib/supabase/` | **VERIFIED RUNTIME** |
| **Multi-Tenancy** | Subdomain & path routing (`[slug].madev.id`), Zero-Trust header resolution | `src/proxy.ts`, `src/lib/tenant/context.ts` | **VERIFIED RUNTIME** |
| **Database & ORM** | PostgreSQL (Supabase Cloud), Drizzle ORM v0.45.2 | `src/lib/db/schema.ts`, `schema/identity.ts` | **VERIFIED RUNTIME** |
| **RBAC / Authorization** | 55 Canonical Permissions (52 Tenant, 3 Platform), fail-closed service | `src/lib/authz/authorization-service.ts` | **VERIFIED RUNTIME** |
| **Tenant Website** | Dynamic root page routing to `<TenantPortalClient />` on tenant subdomains | `src/app/page.tsx`, `src/components/portal/` | **STATIC / PROTOTYPE** |
| **Tenant Branding** | CRUD API for 7 branding fields in `tenant_settings` (`primaryColor`, `customLogoUrl`, etc.) | `src/app/api/tenant/branding/route.ts` | **FUNCTIONAL** |
| **File Storage** | Google Drive API with Service Account credentials | `src/lib/gdrive/service.ts`, `gdriveDocuments` | **FUNCTIONAL** |
| **Billing / Subscription** | Hardcoded visual UI tiers, unpersisted mock invoices | `src/app/dashboard/saas/paket-billing/page.tsx` | **MOCK ONLY (MISSING)** |
| **Module Toggles** | In-memory toggle UI without database persistence | `src/app/dashboard/saas/modul-fitur/page.tsx` | **MOCK ONLY (MISSING)** |
| **LMS / Moodle** | Zero references, zero models, zero integrations | Codebase search: 0 occurrences | **NOT IMPLEMENTED** |
| **Native Mobile** | Zero native code (no Flutter, no React Native, no Kotlin/Swift) | Codebase search: 0 occurrences | **DEFERRED** |
| **Legacy Firebase** | Deprecated Firestore observer utility | `src/lib/config/subscription.ts` | **DEPRECATED (DO NOT USE)** |

---

## 3. Current Platform Boundary

```
                                  MA'HAD MANAGER SAAS
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
             ROOT DOMAIN                                   TENANT SUBDOMAIN
           (e.g., madev.id)                           (e.g., darul-ulum.madev.id)
                    │                                             │
         ┌──────────┴──────────┐                       ┌──────────┴──────────┐
         ▼                     ▼                       ▼                     ▼
  Public Landing        Super Admin           Public Tenant Website     Tenant Portals
   (SaaS Marketing)      Dashboard             (Currently Static)      (Admin, Guru, Wali)
   • Features / Plans    • Tenant Management   • Hero / Profile         • Dashboard
   • Public Registration • Global Settings     • Programs / Prestasi    • Kesantrian / Rombel
   • Documentation       • Infrastructure      • News / Contact         • Keuangan / E-Tatib
```

---

## 4. Web Architecture

Web is the **canonical and exclusive administrative platform**. It serves two distinct audiences:
1. **Platform Operator (Super Admin / Developer)**:
   - SaaS-wide metrics and tenant provisioning (`/dashboard/saas/tenants`).
   - Global package configuration and module catalogs.
   - Platform infrastructure logs and database maintenance.
2. **Tenant Institution Staff & Stakeholders**:
   - **Pimpinan Pesantren / Admin**: Full operational control, user accounts, roles, academic curricula, finance, and **Tenant Website CMS**.
   - **Asatidz / Dewan Guru**: Class gradebooks (*E-Rapor*), lesson plans, attendance.
   - **Musyrif / Pembina Asrama**: Dormitory inspections, disciplinary cases (*E-Tatib*), health visits (*UKS*).
   - **Wali Santri**: Student progress monitoring, tuition payment (*Flip* integration), gate passes.

---

## 5. Mobile Native Future Architecture

Mobile Native (Android & iOS) is reserved strictly for end-user mobility where mobile hardware capabilities provide clear superiority over a web browser:

### Target Use Cases for Mobile Native:
- **Wali Santri**: Push notifications for student arrival/departure (*RFID Gate Checkpoint*), disciplinary notices, SPP payment confirmations, and direct communication.
- **Dewan Asatidz & Musyrif**: Rapid NFC/QR scanning for class attendance, dormitory curfew checks, and on-the-go violation reporting.
- **Santri**: Personal digital ID card (KTA), daily class agenda, prayer schedule, and digital Quran.
- **Personal Spiritual Modules**:
  - **Jadwal Shalat**: On-device astronomical calculation based on device GPS with an explicit Location Gate (no pondok fallback, zero location tracking sent to backend).
  - **Prayer Focus**: App blocking during prayer times on Android via `AccessibilityService` (scoped realistically without universal iOS blocking).
  - **Al-Qur'an**: Local SQLite Mushaf Standar Indonesia (LPMQ) with offline translation, tafsir, and lightweight multi-device bookmark sync.

*Architectural Boundary*: The native mobile app will act purely as an API client to the shared Next.js backend, authenticating via OAuth 2.0 / PKCE (Supabase Auth Bearer JWT). **Zero business logic will be duplicated on mobile.**

---

## 6. Desktop Decision

### Verdict: **DESKTOP NATIVE IS NOT REQUIRED**

- **Historical Context**: Previous discovery explored Flutter Desktop and Tauri as candidate native desktop shells for high-speed hardware integration (thermal printers, USB RFID readers).
- **Product Owner Decision**: Desktop Native is **officially removed from the product roadmap**.
- **Rationale & Benefits**:
  1. **Zero Multi-Platform Packaging Overhead**: Eliminates building, signing, distributing, and auto-updating `.msi`, `.exe`, or `.dmg` binaries.
  2. **Browser Native Capabilities**: Modern web browsers (Chrome, Edge) support WebHID, WebUSB, and Web Serial APIs, allowing direct communication with USB RFID scanners and thermal receipt printers directly from web pages when required.
  3. **Instant Feature Delivery**: Updates deployed to the web application are immediately available to desktop users without waiting for app store or client-side updates.
  4. **Cost Efficiency**: Minimizes development, QA, and maintenance costs for the initial 10 pesantren.

---

## 7. Tenant Website & CMS Architecture

Every tenant pesantren requires a distinguished, professional public website to showcase their institution, announce admissions (*PSB / PPDB*), publish articles, and display achievements.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TENANT PUBLIC WEBSITE CMS                       │
│                                                                        │
│   ADMIN EDIT EXPERIENCE (Web Only)             PUBLIC VISITOR (All)    │
│   • Visual Section Organizer                    • Fast Server-Rendered │
│   • Block Content Editors (Forms)               • Mobile Responsive    │
│   • System Data Selectors                       • SEO Optimized (SSG)  │
│   • Live Mobile/Desktop Preview                 • Clean Typography     │
│   • Draft / Publish Lifecycle                   • Custom Subdomain     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
                      STRUCTURED SECTION DEFINITIONS
                 (JSONB Schema in tenant_website_sections)
```

### 7.1. Public Website Routing Architecture
- In `src/app/page.tsx`, the root router inspects the incoming hostname via `getTenantContext()`.
- If the hostname is a tenant subdomain (`darul-ulum.madev.id`), it serves the public tenant website.
- Current state: Renders hardcoded components in `src/components/portal/`.
- Target state: Renders active, published sections dynamically from PostgreSQL.

---

## 8. CMS Web-Only Boundary

1. **Administration Scope**:
   - The CMS website editor is **100% Web-Only**.
   - No CMS editing capabilities will be developed for Mobile Native. Mobile native users only view published public web pages via browser or WebView if necessary.
2. **Audience Design Constraint**:
   - Designed for **non-programmer pesantren administrators** (Ustadz / Staff Tata Usaha).
   - **Forbidden**: Unrestricted raw HTML, arbitrary JavaScript injection, or free-form CSS editors (which introduce XSS security vulnerabilities, break responsive design, and ruin visual branding).
   - **Mandatory**: Structured Block / Section Builder. The system controls the responsive layout, typography, and color palette; the administrator controls the content, images, ordering, and visibility.

---

## 9. CMS Reuse Inventory

The repository already contains substantial building blocks that can be directly reused for the CMS:

| Existing Asset | Location | Reusability in CMS |
|---|---|---|
| **Branding Schema** | `tenant_settings` table (`src/lib/db/schema.ts`) | **100% Reusable**: `primaryColor`, `customLogoUrl`, `customBgUrl`, `tagline`, `loginTitle`, `loginSubtitle`, `loginDescription`. |
| **Branding API** | `src/app/api/tenant/branding/route.ts` | **100% Reusable**: Full GET/PUT handler with RBAC protection (`view_pengaturan`, `manage_pengaturan`). |
| **Branding Admin UI** | `src/app/dashboard/pengaturan/tampilan-login/page.tsx` | **80% Reusable**: Working form with live preview, color pickers, and upload inputs. |
| **Public Portal Components**| `src/components/portal/*` (8 files) | **90% Reusable**: Ready-made, beautifully styled Tailwind v4 sections (`TenantPortalHero`, `TenantPortalProfile`, `TenantPortalPrograms`, `TenantPortalAchievements`, `TenantPortalInfoNews`, `TenantPortalContactFooter`). |
| **Media Storage Client** | `src/lib/gdrive/service.ts` | **70% Reusable**: Google Drive file upload and public link generation; can serve as the media library backend. |
| **Academic Programs Data** | `master_jenjang`, `kelas`, `mapel` | **Can be pulled dynamically** into the Programs block. |
| **Discipline & Prestasi** | `santri.totalPrestasi` | **Can be aggregated** into the Achievements block. |

---

## 10. CMS Gap Analysis

To transform the current static prototype into a fully functional, user-friendly CMS, the following architectural gaps must be closed:

```
CURRENT PROTOTYPE                              TARGET ENTERPRISE CMS
┌──────────────────────────────┐              ┌──────────────────────────────┐
│ • Hardcoded Section List     │              │ • Dynamic Section Reordering │
│ • Static In-Component Text   │  ─────────▶  │ • Structured JSONB Block Data│
│ • No Publish / Draft State   │              │ • Versioned Draft / Publish  │
│ • No Media Library Picker    │              │ • Visual Media Library       │
│ • No Custom Page Creation    │              │ • Dynamic Multi-Page Router  │
└──────────────────────────────┘              └──────────────────────────────┘
```

1. **Database Persistence Gap**:
   - Need `tenant_website_pages` table (`id`, `tenant_id`, `slug`, `title`, `is_published`, `seo_metadata`).
   - Need `tenant_website_sections` table (`id`, `page_id`, `tenant_id`, `section_type`, `display_order`, `is_visible`, `content_jsonb`).
   - Need `tenant_articles` / `tenant_news` table for blog posts and announcements.
2. **Editor UI Gap**:
   - Section Reorder Manager (Drag-and-drop or Move Up/Down controls).
   - Form-based Block Content Inspector (editing titles, descriptions, buttons, images).
   - Dual-mode Device Preview (Live toggle between Desktop, Tablet, and Mobile viewports).
3. **Draft / Publish Lifecycle Gap**:
   - Administrators must be able to save edits as **Draft** without immediately affecting the live website.
   - A single "Publish" action commits draft section states to the public view.

---

## 11. Subscription / Entitlement Readiness

### 11.1. Current Codebase State
- **Critical Gap**: Commercial packaging is currently detached from backend enforcement.
- `src/app/dashboard/saas/modul-fitur/page.tsx` stores toggles in volatile React state.
- API route handlers and server actions execute without verifying tenant subscription status or capability licenses.

### 11.2. Required Entitlement Hierarchy
```text
PACKAGE (Starter, Pro, Enterprise)
   + ACTIVE ADD-ONS (Moodle LMS, WhatsApp Pro, Cashless RFID)
   = TENANT SUBSCRIPTION (Active, Past_Due, Grace_Period, Suspended)
        ↓
   EFFECTIVE CAPABILITIES (Evaluated Server-Side at API Gateway)
        ↓
   FEATURE ACCESS (Web Navigation, API Routes, Moodle SSO, Mobile Sync)
```

- **Enforcement Principle**:
  UI visibility is aesthetic. Authorization occurs strictly on the server:
  $$\text{Access Granted} = \text{TenantHasCapability}(tenant\_id, capability) \land \text{UserHasPermission}(user\_id, permission)$$
  If a tenant lacks the `website.cms_advanced` or `education.lms` capability, the API immediately returns `403 Forbidden` (`CAPABILITY_NOT_ENTITLED`).

---

## 12. Moodle Boundary

Moodle is an **External Specialized Learning Management System**. It will **not** be rewritten or duplicated inside MA'HAD MANAGER.

```
┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
│            MA'HAD MANAGER              │       │               MOODLE                   │
│         (System of Record)             │       │         (Learning Engine)              │
├────────────────────────────────────────┤       ├────────────────────────────────────────┤
│ • Tenant Lifecycle & Subscription      │       │ • Course Materials & SCORM Modules     │
│ • User Identity & Passwords            │ OIDC  │ • Interactive Quizzes & Question Banks │
│ • Academic Master (Mapel & Classes)    │──────▶│ • Assignment Submissions & Rubrics     │
│ • Student Enrollment & Rosters         │ Sync  │ • Student Course Completion Logs       │
│ • Tuition & Invoices                   │       │ • Discussion Forums                    │
│ • Consolidated E-Rapor Final Grades    │◀──────│ • Detailed Quiz Attempt History        │
└────────────────────────────────────────┘ Grade └────────────────────────────────────────┘
```

---

## 13. Moodle Readiness

1. **Identity & Single Sign-On (SSO)**:
   - Must use **OpenID Connect (OIDC)** or OAuth 2.0.
   - MA'HAD MANAGER acts as the Identity Provider (IdP); Moodle acts as the Relying Party (RP).
   - Moodle uses standard plugins (`auth_oidc` / `auth_oauth2`).
   - **Zero Password Storage in Moodle**: Passwords reside exclusively in Supabase Auth.
2. **Role Mapping (Least Privilege)**:
   - `SUPER_ADMIN` $\rightarrow$ No Moodle account (Audit/CLI only).
   - `Tenant ADMIN` $\rightarrow$ Moodle `Manager` (Category-scoped; cannot touch global PHP/server settings).
   - `GURU` $\rightarrow$ Moodle `Editing Teacher` (in assigned courses only).
   - `SANTRI` $\rightarrow$ Moodle `Student`.
3. **Multi-Tenancy Deployment**:
   - For the initial 10 pesantren, deploy **dedicated containerized Moodle instances on demand** (e.g., Docker container with isolated PostgreSQL schema or database).
   - Guarantees zero cross-tenant data leaks and independent backups.
4. **Subscription Expiry Behavior (Non-Destructive)**:
   - Lapsed subscription blocks Moodle SSO login at the gateway and stops the container.
   - **Data is never destroyed**: Student submissions, lesson materials, and grades are preserved in cold storage for academic archiving.

---

## 14. Shared Backend/API Readiness

To serve Web, future Mobile Native, and Moodle without divergent business logic:

1. **Dual-Mode Authentication**:
   - Current state: `src/proxy.ts` relies exclusively on cookies (`@supabase/ssr`).
   - Target state: `src/proxy.ts` and API routes must support **both** HTTPS Cookies (Web) and `Authorization: Bearer <JWT>` headers (Mobile & Moodle).
2. **Decoupling Domain Logic from Server Actions**:
   - Business operations (enrollment, grading, payments) must reside in reusable domain services (`src/modules/*`), callable by both Server Actions (Web) and REST Route Handlers (Mobile).
3. **API Contract Hygiene**:
   - Use Zod schemas to validate all inputs and define type-safe response DTOs.

---

## 15. Identity Architecture

The platform's identity model is solid and verified:
```text
Supabase Auth (auth.users)
         │ 1:1 (UUID)
         ▼
Public User Profile (public.users)
         │ 1:N
         ▼
Tenant Memberships (user_tenant_memberships)
         │ N:1
         ▼
Tenant Roles (tenant_roles: ADMIN, GURU, WALI, SANTRI, MUSYRIF)
         │ N:M
         ▼
Canonical Permissions (permissions: 52 Tenant, 3 Platform)
```
- **Consistency**: The same Supabase Auth UID will authenticate Web sessions, issue Bearer tokens for Mobile Native, and sign OIDC tokens for Moodle SSO.
- **Zero Duplicate Passwords**: All credentials reside in Supabase Auth.

---

## 16. Tenant Isolation

Tenant isolation is currently enforced across multiple layers:
1. **Server-Derived Context**:
   `src/proxy.ts` derives `x-tenant-id` and `x-tenant-slug` from verified hostname subdomains or session claims. Client-supplied tenant headers are discarded.
2. **Transaction Scoping**:
   `withTenantTransaction(tenantId, ...)` ensures queries execute within tenant context.
3. **RBAC Scope**:
   `authorization-service.ts` verifies that the user's role and permissions belong strictly to the target tenant.
4. **RLS Foundation**:
   PostgreSQL RLS policies are prepared to guarantee database-level isolation.

---

## 17. Data Ownership Matrix

| Data Domain / Entity | Source of Truth (SoT) | Web Platform | Mobile Native | Moodle LMS | Tenant Website CMS |
|---|---|---|---|---|---|
| **Institution / Tenant Profile** | MA'HAD MANAGER DB | Read / Manage | Read | Integration Read | Read / Display |
| **User Identity & Auth** | Supabase Auth | Read / Manage | Authenticate | OIDC Consume | None |
| **Santri / Student Master** | MA'HAD MANAGER DB | Read / Manage | Read (Personal) | Sync Cohorts | None |
| **Dewan Guru / Asatidz** | MA'HAD MANAGER DB | Read / Manage | Read / Action | Sync Teachers | Read / Display (Bio) |
| **Academic Structure (Mapel)** | MA'HAD MANAGER DB | Read / Manage | Read Schedule | Sync Courses | Read / Display (Prog) |
| **SPP & Financial Ledgers** | MA'HAD MANAGER DB | Read / Manage | Pay / History | None | None |
| **Pelanggaran / Disiplin** | MA'HAD MANAGER DB | Read / Manage | Read (Personal) | None | None |
| **Website Structured Sections**| MA'HAD MANAGER DB | Read / Manage | None | None | **Manage / Publish** |
| **Articles & News** | MA'HAD MANAGER DB | Read / Manage | Read if exposed| None | **Manage / Publish** |
| **LMS Lessons & SCORM** | **Moodle** | Link / WebView | Link / WebView | **Authoritative** | None |
| **LMS Quizzes & Submissions** | **Moodle** | Link / Grade Pull| Link / WebView | **Authoritative** | None |
| **Final E-Rapor Grades** | MA'HAD MANAGER DB | **Authoritative** | Read Final | Syncs to Ledger | None |
| **Personal Prayer Times** | Device GPS / Calc | Optional Widget| **Authoritative** | None | None |
| **Personal Quran Bookmarks** | Client Device | Sync Backup | **Authoritative** | None | None |

---

## 18. Client Capability Matrix

| Capability / Feature | Web App (Browser) | Mobile Native (Future) | Desktop (Browser) | Moodle LMS |
|---|---|---|---|---|
| **Platform Super Admin** | **YES** | NO | **YES** | NO |
| **Tenant Operation Admin** | **YES** | NO | **YES** | NO |
| **Website CMS & Builder** | **YES** | NO | **YES** | NO |
| **Curriculum & Grading** | **YES** | NO | **YES** | NO |
| **Finance, SPP & POS Kantin** | **YES** | Limited (Wali Pay)| **YES** | NO |
| **Attendance Scanning** | **YES** (WebUSB/Cam)| **YES** (Native Cam)| **YES** | NO |
| **Dormitory Curfew Check** | **YES** | **YES** | **YES** | NO |
| **Push Notifications** | Web Push (Opt) | **YES** (APNs/FCM) | Web Push (Opt) | Email / In-App |
| **Prayer Time & Alarms** | Static Widget | **YES** (Background)| Static Widget | NO |
| **Prayer Focus (App Blocking)**| NO | **YES** (Android) | NO | NO |
| **Quran Mushaf (Offline)** | Online Reader | **YES** (SQLite) | Online Reader | NO |
| **Interactive Courseware** | Link / SSO | Link / WebView | Link / SSO | **YES** |
| **Quizzes & Assignments** | Grade Overview | Link / WebView | Grade Overview | **YES** |

---

## 19. Native Mobile Readiness Matrix

| Architectural Dimension | Readiness | Existing Foundation | Missing Prerequisite |
|---|---|---|---|
| **Identity & Authentication** | **HIGH** | Supabase Auth supports mobile SDKs | OAuth 2.0 PKCE / Refresh Token session endpoint |
| **Tenant Context Resolution** | **MODERATE**| Header & claim resolution in `proxy.ts` | Mobile client storage of active `tenant_id` claim |
| **API Endpoints** | **MODERATE**| Next.js Route Handlers exist | Dual-mode auth (Bearer JWT support) + Zod DTOs |
| **Database Scoping** | **HIGH** | Strict `tenant_id` database columns | None |
| **Push Notifications** | **LOW** | In-app notification engine only | FCM / APNs integration & device token table |
| **Offline Synchronization** | **LOW** | None | Client SQLite schema & conflict resolution rules |

---

## 20. Moodle Readiness Matrix

| Architectural Dimension | Readiness | Existing Foundation | Missing Prerequisite |
|---|---|---|---|
| **Identity Mapping** | **HIGH** | Unique Supabase Auth UUID per user | OIDC Provider endpoint on MA'HAD MANAGER |
| **Role Mapping** | **HIGH** | Canonical roles (ADMIN, GURU, SANTRI) | Moodle role mapping configuration table |
| **Academic Master Sync** | **MODERATE**| Canonical `mapel`, `kelas`, `santri` tables| Outbox event dispatcher for course creation |
| **Container Orchestration** | **MODERATE**| Docker-ready infrastructure | Automated Moodle container provisioning worker |
| **Entitlement Gating** | **LOW** | None | PostgreSQL `tenant_subscriptions` table |

---

## 21. Initial 10-Tenant Capacity Consideration

### Pragmatic Sizing for 10 Pesantren:
- **Tenant Count**: 10 institutions.
- **Average Scale per Pesantren**: 300 to 1,000 santri, 30 to 80 asatidz.
- **Total Platform Users**: ~5,000–10,000 active identities.
- **Total Concurrent Web Traffic**: ~50–200 concurrent requests during peak hours (morning attendance, evening grade submission).

### Infrastructure Topology Recommendation:
```
┌────────────────────────────────────────────────────────────────────────┐
│                   INITIAL 10-TENANT TOPOLOGY                           │
│                                                                        │
│   [Vercel Serverless / Cloud VPS]                                      │
│   • Next.js 16 Multi-Tenant Web App & API                              │
│   • Handles all 10 Tenant Websites + Admin Dashboards                  │
│                                                                        │
│   [Supabase Managed PostgreSQL (Pro Tier)]                             │
│   • 8 GB RAM, 2 vCPU, Connection Pooler (PgBouncer)                    │
│   • Multi-tenant shared database with tenant_id indexes                │
│                                                                        │
│   [Single Dedicated VPS for Moodle Containers (Optional)]             │
│   • 16 GB RAM, 4 vCPU (Handles 5-10 containerized Moodle instances)    │
│   • Traefik Reverse Proxy routing lms-[slug].madev.id                  │
│                                                                        │
│   [Google Drive / Supabase Storage]                                    │
│   • Document, PDF, and image storage                                   │
└────────────────────────────────────────────────────────────────────────┘
```
- **Architectural Rule**: Avoid Kubernetes, Kafka, or distributed microservice orchestration for the initial 10 tenants. A monolithic Next.js backend with an indexed PostgreSQL database and managed Supabase Auth easily delivers sub-100ms response times at minimal operational cost.

---

## 22. Architecture Decisions

### LOCKED
1. **Desktop Native Dropped**: Desktop is served exclusively via the Web Application in modern browsers.
2. **Web Platform Supremacy**: All administrative, configuration, financial, SaaS, and CMS workflows are Web-only.
3. **Structured Block CMS**: The Tenant Website CMS will be a drag-and-drop, block/section-based visual editor designed for non-programmers. Raw HTML/JS editing is forbidden.
4. **Moodle as External LMS**: Moodle is an external specialized LMS. MA'HAD MANAGER is the authoritative System of Record.
5. **No Firebase**: Firebase is deprecated/legacy; all active data resides in Supabase PostgreSQL.
6. **Zero Client Authority**: Client UI toggles are never authorization sources. All access is validated server-side.

### CANDIDATE
1. **Flutter for Mobile Native**: Recommended framework for future Android & iOS development due to Arabic typography rendering and desktop convergence.
2. **Dedicated Moodle Containers**: Provisioning a lightweight container per entitled tenant rather than a shared database.
3. **Dual-Mode Auth (JWT + Cookies)**: Standardizing API route headers to accept Bearer tokens alongside browser session cookies.

### EXISTING
1. Next.js 16 App Router runtime and proxy middleware (`src/proxy.ts`).
2. Supabase Auth identity chain (`auth.users` $\rightarrow$ `public.users` $\rightarrow$ `user_tenant_memberships`).
3. 55 Canonical RBAC permissions (52 Tenant, 3 Platform).
4. Tenant branding API and settings (`tenant_settings`).
5. Public portal UI components (`src/components/portal/*`).
6. Google Drive document service (`src/lib/gdrive/service.ts`).

### MISSING
1. Database schema for Subscriptions, Packages, Add-ons, and Capabilities.
2. Database schema for CMS Pages, Sections, Articles, and Navigation.
3. CMS Visual Block Editor UI (Drag-and-drop section manager, device preview, publish pipeline).
4. OIDC Provider endpoint for Moodle SSO.
5. Push notification infrastructure (FCM / APNs device token table).

### DEFERRED
1. Native Mobile implementation (Android & iOS).
2. Live Moodle container deployment and plugin development.
3. Real-time offline synchronization for mobile.

### OPEN DECISIONS
1. **CMS Media Storage**: Use Google Drive (existing document backend) or Supabase Storage (better image CDN optimization and public URL transformation)?
2. **Pricing Packaging**: What capabilities are included in Starter vs Pro vs Enterprise packages?
3. **Moodle Hosting Billing**: Is Moodle container hosting bundled into subscription pricing or billed as an infrastructure pass-through?
4. **Mobile Native Tech Stack**: Final sign-off on Flutter vs React Native / Expo.

### RISKS
1. **iOS App Blocking Limitation**: Apple App Store policies prohibit third-party app blocking without `FamilyControls` entitlements. Prayer Focus must be scoped realistically.
2. **Hijri Calendar Anomaly**: Algorithmic calculations deviating from official Indonesian Ministry of Religious Affairs (Kemenag) decrees. Requires fail-closed ingestion.
3. **CMS Layout Breakage**: Administrators entering excessively long text or broken images. Requires strict block schema constraints and automatic truncation rules.

---

## 23. Architectural Gaps

1. **Entitlement Engine Gap**: No database table currently enforces whether a tenant is entitled to specific modules.
2. **CMS Persistence Gap**: Tenant websites currently render hardcoded static strings; no section table exists to store administrator edits.
3. **Dual-Mode Auth Gap**: Next.js middleware currently expects cookies; native clients require Bearer JWT header authentication.

---

## 24. Recommended Dependency Order

Based on repository evidence, the optimal implementation roadmap follows this strict dependency chain:

```text
┌────────────────────────────────────────────────────────────┐
│ 1. SaaS Foundation & Multi-Tenant Core (COMPLETE)          │
│    • Tenant Provisioning, Auth, 52 RBAC Permissions        │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│ 2. Subscription & Entitlement Architecture (NEXT PREREQ)   │
│    • Packages, Add-ons, Subscriptions, Capability Tokens   │
│    • Server-Side Entitlement Gate at API Gateway           │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│ 3. Tenant Website CMS & Visual Builder (CORE IMMEDIATE)    │
│    • Structured Sections Schema, Media Library, Editor UI  │
│    • Live Preview, Draft/Publish Pipeline                  │
└─────────────────────────────┬──────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│ 4. Shared API & Integration Foundation                     │
│    • Dual-Mode Auth (Bearer JWT + Cookie Proxy)            │
│    • Zod DTO Contracts & OpenID Connect (OIDC) Provider    │
└─────────────────────────────┬──────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌──────────────────────────────┐   ┌─────────────────────────┐
│ 5. Moodle LMS Integration    │   │ 6. Native Mobile Apps   │
│    • Container Orchestration │   │    • Flutter Android/iOS│
│    • OIDC SSO & Roster Sync  │   │    • Wali/Santri Portal │
│    • E-Rapor Grade Pull      │   │    • Spiritual Modules  │
└──────────────────────────────┘   └─────────────────────────┘
```

### Rationale:
- **Subscription/Entitlement must precede CMS and Moodle**: Because CMS custom themes/domains and Moodle LMS access are commercial capabilities that must be gated by the subscription engine.
- **CMS provides immediate customer value**: The initial 10 pilot pesantren need their public website up and running before complex LMS and mobile app rollouts.
- **Shared API is the prerequisite for Moodle and Mobile**: Building clean REST endpoints and OIDC before building mobile clients avoids rework.

---

## 25. Recommended Future Work Packages

1. **`WP-SAAS-SUBSCRIPTION-ENTITLEMENT-SCHEMA-001`**:
   - Design and execute migration for `packages`, `addons`, `tenant_subscriptions`, and `capabilities`.
   - Implement `checkTenantEntitlement(tenantId, capability)` middleware.
2. **`WP-TENANT-WEBSITE-CMS-SCHEMA-001`**:
   - Design database tables for `tenant_website_pages`, `tenant_website_sections`, `tenant_articles`, and `tenant_media_assets`.
3. **`WP-TENANT-WEBSITE-CMS-EDITOR-001`**:
   - Build the visual Web-only Section Builder, drag-and-drop ordering, content inspector, and draft/publish workflow.
4. **`WP-TENANT-WEBSITE-PUBLIC-RENDERER-001`**:
   - Update `src/app/page.tsx` and portal components to render dynamic published sections with high-speed caching and SEO.
5. **`WP-SHARED-API-DUAL-AUTH-001`**:
   - Upgrade `src/proxy.ts` and route handlers to accept Bearer JWT tokens for future native mobile and API clients.
6. **`WP-MOODLE-OIDC-SSO-DISCOVERY-001`**:
   - Formal specification of Moodle container templates, OIDC IdP handshake, and outbox roster sync.
7. **`WP-NATIVE-MOBILE-DISCOVERY-001`**:
   - Detailed specification of Flutter project structure, offline Quran database, and prayer time engine.

---

## 26. Things That Must NOT Be Implemented Yet

To prevent scope creep, architectural regression, and premature optimization:
1. **DO NOT build a Desktop Native application** (Electron, Tauri, Flutter Desktop) — Desktop uses Web App.
2. **DO NOT build or install Native Mobile projects** (Flutter, React Native, iOS, Android) — Mobile is deferred.
3. **DO NOT install, containerize, or run Moodle LMS** — Moodle is deferred to its dedicated WP.
4. **DO NOT implement raw HTML/CSS/JS code injection in the CMS** — Must remain structured blocks.
5. **DO NOT deploy Kubernetes or multi-cluster microservices** — Initial scale is 10 pesantren.
6. **DO NOT re-introduce Firebase** — Firebase remains deprecated.
7. **DO NOT modify existing source code or database schemas during discovery**.

---

## 27. Final Architecture Baseline

The updated, authoritative canonical architecture baseline for MA'HAD MANAGER is:

1. **Client Tier**:
   - **Web Application** (Next.js 16 + React 19): Primary administrative platform, operations, and **Web-Only Tenant Website CMS**. Desktop accesses this via browser.
   - **Mobile Native** (Android & iOS, Future): High-mobility client for Asatidz, Wali Santri, and Santri.
   - **External LMS** (Moodle, Future): Specialized learning platform connected via OIDC SSO.
2. **Application & API Tier**:
   - Unified Next.js backend providing Server Actions (for Web) and REST Endpoints (for Mobile/Integrations).
   - Zero-Trust server-derived tenant isolation via `src/proxy.ts`.
   - Dual-gate authorization: **Tenant Entitlement** (Commercial) + **User RBAC** (52 Permissions).
3. **Data Tier**:
   - Supabase PostgreSQL (Single multi-tenant database for initial 10 pesantren).
   - Supabase Auth (Single Identity System of Record).
   - Google Drive / Supabase Storage (Document & Media Library).

---

========================================
## WP STATUS
========================================

Status:
**PASS**

Source Changes:
**NONE**

Database Changes:
**NONE**

Migration:
**NONE**

Dependencies:
**NONE**

Commit:
**NONE**

Push:
**NONE**

Deploy:
**NONE**

Report:
`docs/architecture/WP-PLATFORM-ARCHITECTURE-REBASELINE-001-REPORT.md`

Architecture Readiness:
**READY FOR ARCHITECTURE REVIEW**

Top 5 Findings:
1. Desktop Native is explicitly dropped from roadmap; Desktop will use the responsive Web App via browser.
2. Tenant Website CMS is a Web-Only core requirement designed as a structured block/section builder for non-programmers.
3. Existing codebase already has a functional branding API (`/api/tenant/branding`) and static public portal components (`src/components/portal/*`) ready for CMS reuse.
4. Current billing and module toggles are unpersisted UI mocks; server-side subscription and entitlement schemas must be built before CMS/Moodle gating.
5. Initial scale of 10 pesantren is easily served by a monolithic Next.js app and single Supabase PostgreSQL instance without Kubernetes or microservice overhead.

Top 5 Open Decisions:
1. CMS Media Storage: Retain Google Drive (existing document integration) or adopt Supabase Storage for public image CDN optimization?
2. Packaging Tiers: Define explicit quota limits (santri count, storage) for Starter, Pro, and Enterprise packages.
3. Moodle Hosting: Bundle dedicated Moodle containers into SaaS subscription pricing or bill as an infrastructure pass-through?
4. Mobile Framework: Confirm Flutter as the canonical choice for future mobile development.
5. CMS Page Scope: Should the initial CMS launch support multi-page navigation (About Us, Contact, PSB) or single-page section scrolling?

Recommended Next WP:
**`WP-SAAS-SUBSCRIPTION-ENTITLEMENT-SCHEMA-001`** (or **`WP-TENANT-WEBSITE-CMS-SCHEMA-001`**)

STOP.
========================================
