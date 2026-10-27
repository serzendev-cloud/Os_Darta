# WP-SAAS-LANDING-002 — Discovery Report

## 1. Executive Summary

- **Work Package:** `WP-SAAS-LANDING-002`
- **Phase:** `PHASE 1 — DISCOVERY COMPLETE`
- **Implementation Status:** **NOT AUTHORIZED IN THIS PHASE**
- **Branch:** `preview`
- **Purpose:** Perform comprehensive read-only forensic discovery of current root page rendering, hostname resolution, product identity configuration, company brand attribution, and tenant branding boundaries, and formulate the minimal architecture plan for the **SaaS Product Landing Page**.

---

## 2. Current Root Architecture

Discovery of `src/app/page.tsx` reveals:
- `src/app/page.tsx` executes `const tenant = await getTenantContext();` and directly renders `<TenantPortalClient tenant={tenant} />`.
- When accessed from the SaaS platform root hostname (where `tenant.slug === 'default'`), `getTenantContext()` returns `DEFAULT_TENANT` (`name: "Ma'had Management Platform"`, `tagline: "Sistem Informasi Pesantren Terpadu"`).
- Consequently, root `/` currently renders a **Tenant Public Website component** (`TenantPortalClient`) populated with fallback values, giving the appearance of a single pesantren portal rather than a multi-tenant SaaS technology platform.

---

## 3. Current Hostname Resolution

Inspection of `src/proxy.ts` (`extractTenantSlug` function):
1. **Path Check (`/t/:slug`):** Extracts `:slug` if not in `RESERVED_HOSTNAMES`.
2. **Subdomain Check (`[slug].domain.com`):** Extracts `parts[0]` if not `localhost`/IP and not in `RESERVED_HOSTNAMES` (`www`, `madev`, `app`, `saas`, `admin`, `api`, `dashboard`, `platform`, etc.).
3. **Fallback:** Returns `'default'` if on root or reserved hostname.

---

## 4. Current Tenant Rendering Flow

```
                      [ USER ACCESSES ROOT '/' ]
                                  │
                                  ▼
                        src/proxy.ts (Proxy)
             extractTenantSlug() returns 'default'
                                  │
                                  ▼
                     src/lib/tenant/context.ts
             getTenantContext() returns DEFAULT_TENANT
                                  │
                                  ▼
                          src/app/page.tsx
           Renders <TenantPortalClient tenant={tenant} />
                                  │
                                  ▼
      [ ROOT RENDERS TENANT PUBLIC PORTAL WITH FALLBACK DATA ]
```

---

## 5. Current Product Identity Architecture

- No dedicated `productConfig` or `siteConfig` file currently exists in `src/config/`.
- Product title `"Ma'had Manager"` is hardcoded in `src/app/layout.tsx` (lines 8-9).
- Fallback name `"Ma'had Management Platform"` is hardcoded in `src/lib/tenant/context.ts` (lines 30-39).
- **Phase 2 Architecture Target:** Create `src/config/product.ts` as the **Single Source of Truth** for product brand identity:
  ```ts
  export const SAAS_PRODUCT_CONFIG = {
    name: process.env.NEXT_PUBLIC_PRODUCT_NAME || "Ma'had Manager",
    tagline: "Platform SaaS Manajemen Pesantren Terpadu",
    description: "Platform SaaS terpadu untuk tata kelola kesantrian, akademik formal & diniyah, kesehatan (UKS), kedisiplinan (E-Tatib), keuangan SPP otomatis, dan website publik pesantren.",
    company: "SERZEN DEV", // LOCKED Parent / Company Brand
    companyUrl: "https://serzendev.cloud",
  };
  ```

---

## 6. Current SERZEN DEV Company Identity

- `SERZEN DEV` is the **LOCKED / FINAL** parent company brand identity.
- Per WP-SAAS-LANDING-002 governance rules:
  - `SERZEN DEV` must be rendered directly in company attribution sections (footer, copyright, "Built by SERZEN DEV", "A product by SERZEN DEV").
  - `SERZEN DEV` is **NOT configurable** via product settings.
  - `SERZEN DEV` must NOT be replaced by tenant names or `DEFAULT_TENANT`.

---

## 7. Tenant Branding Isolation

- Existing tenant branding fields in `tenantSettings` (`customLogoUrl`, `primaryColor`, `tagline`, `loginTitle`, `loginSubtitle`, `loginDescription`) belong strictly to individual tenant institutions.
- Root SaaS Landing Page will use its own SaaS product design tokens (clean slate/emerald palette) and `SAAS_PRODUCT_CONFIG`, completely isolated from tenant branding.

---

## 8. Existing UI Components

Phase 2 will reuse existing verified UI primitives and icons:
- Tailwind CSS styling (`src/app/globals.css`)
- Lucide React icons (`lucide-react`)
- Primitive buttons & cards (`src/components/ui/button.tsx`, `src/components/shared/page-header.tsx`)
- Theme provider (`src/components/providers/theme-provider.tsx`)
- Sonner toast notifications (`sonner`)

---

## 9. Existing Metadata

- Global metadata is defined in `src/app/layout.tsx`.
- Page-level metadata is generated in `src/app/page.tsx` via `generateMetadata()`.
- In Phase 2, `generateMetadata()` will branch:
  - If `tenant.slug === 'default'`: Return SaaS Product metadata using `SAAS_PRODUCT_CONFIG`.
  - If `tenant.slug !== 'default'`: Return Tenant Public Portal metadata using `tenant` context.

---

## 10. Verified SaaS Capabilities (Empirically Proven)

Only currently working, verified features in the repository will be showcased on the landing page:

| Module Category | Verified Capabilities | Primary Route / Service Source |
| :--- | :--- | :--- |
| **Kesantrian & Asrama** | Management data santri, wali, kamar, & status santri. | `santriService`, `asramaService`, `kamarService` |
| **Akademik & E-Rapor** | Master Jenjang, Tingkat, Kelas, Mapel, Guru, & E-Rapor. | `masterJenjangService`, `kelasService`, `mapelService` |
| **Keuangan & Auto SPP** | Invois SPP & Payment Gateway Webhook (Flip for Business). | `/api/webhooks/flip`, `saas-payment.ts` |
| **E-Tatib & Disiplin** | Master Pelanggaran, Hukuman, Tolerance Policy, Governance Cases. | `tolerancePolicyService`, `pelanggaranService` |
| **Kesehatan & Medis** | Health Visits (UKS), Health Permissions (Izin Berobat), Rekam Medis. | `healthVisitService`, `healthPermissionService` |
| **Presensi RFID & Kantin**| Presensi KTA RFID Gerbang & POS Kantin Cashless Santri. | `/api/gate/scan-in`, `/api/canteen/pay` |
| **Website Publik Tenant**| Public Portal with Custom Logo, Color, Tagline, News, & Achievements. | `TenantPortalClient`, `tenantSettings` |
| **Audit & Multi-Tenant** | Row-Level Security (RLS), Audit Trail Logs, Server Tenant Boundaries. | `auditLogService`, `src/proxy.ts` |

---

## 11. Proposed SaaS Landing Architecture

```
                       [ INCOMING REQUEST ROOT '/' ]
                                     │
                                     ▼
                          src/app/page.tsx
                   Check: tenant.slug === 'default'
                                     │
                  ┌──────────────────┴──────────────────┐
                  ▼                                     ▼
                TRUE                                  FALSE
        (SaaS Platform Root)                   (Tenant Subdomain)
                  │                                     │
                  ▼                                     ▼
        <SaasLandingPage />                   <TenantPortalClient />
    - Uses SAAS_PRODUCT_CONFIG             - Uses tenant context &
    - Built by SERZEN DEV                    tenant.settings
    - SaaS Product Positioning             - Tenant Public Website
```

---

## 12. Proposed Brand Architecture

- **Company / Parent Brand:** `SERZEN DEV` (**LOCKED / FINAL**)
- **SaaS Product Brand:** Configurable via `SAAS_PRODUCT_CONFIG` in `src/config/product.ts` (**NOT LOCKED / CONFIGURABLE**)
- **Tenant Brand:** Derived dynamically per tenant from PostgreSQL `tenants` & `tenant_settings` (**TENANT-SPECIFIC**)

---

## 13. Proposed Landing Page Sections

1. **Header Navigation:** Product Logo, Fitur, Keunggulan, Modul, FAQ, CTA Login (`/login`).
2. **Hero Section:** Value proposition, supporting description, Primary CTA (`[Daftar / Demo]`), Secondary CTA (`[Lihat Fitur]`).
3. **Problem Statement:** Operational challenges in traditional pesantren management.
4. **Unified Solution:** Single ecosystem connecting Kesantrian, Akademik, Keuangan, & Health.
5. **Interactive Modules Showcase:** Tabs displaying proven modules (Kesantrian, Akademik, SPP Flip, E-Tatib, UKS, Kantin RFID).
6. **Dual Digital Presence Highlight:** Internal Management Dashboard + Public Tenant Website.
7. **Why Choose Us:** Enterprise Multi-Tenant Isolation, RLS Security, Configurable Structure, Audit Trail.
8. **How It Works:** 5-step onboarding journey (Register, Configure, Import, Launch).
9. **Security & Architecture Trust:** Server-derived tenant context & audit logging.
10. **FAQ Accordion:** Frequently asked questions.
11. **CTA Banner:** Transformation prompt for institution leaders.
12. **Footer:** Product Navigation, Company Attribution (`Built by SERZEN DEV`), Legal.

---

## 14. Proposed Minimal File Changes (Phase 2 Target)

Only 3 files will be created/modified in Phase 2:

1. **`src/config/product.ts` [NEW]**
   - Single source of truth for SaaS product configuration (`SAAS_PRODUCT_CONFIG`) & company brand attribution (`SERZEN DEV`).
2. **`src/components/landing/SaasLandingPage.tsx` [NEW]**
   - Dedicated SaaS product landing page component consuming `SAAS_PRODUCT_CONFIG`.
3. **`src/app/page.tsx` [MODIFY]**
   - Architectural branching in `RootPage()` and `generateMetadata()`:
     ```tsx
     if (!tenant.slug || tenant.slug === 'default') {
       return <SaasLandingPage />;
     }
     return <TenantPortalClient tenant={tenant} />;
     ```

---

## 15. Routing Impact

- **SaaS Root (`/` on default host):** Renders `<SaasLandingPage />`.
- **Tenant Subdomain (`[slug].domain.com` or `/t/:slug`):** Renders `<TenantPortalClient tenant={tenant} />`.
- **Tenant Login (`/login`):** Unchanged (`<LoginPage />`).
- **Protected App (`/dashboard/*`):** Unchanged (`<DashboardLayout />`).
- **Zero Breaking Changes to Existing Tenant Routes.**

---

## 16. Security / Tenant Isolation Impact

- **Zero Risk.** `src/proxy.ts` and `getTenantContext()` remain 100% untouched.
- Server-derived tenant context headers (`x-tenant-id`, `x-tenant-slug`) continue to enforce security boundaries.

---

## 17. Dependency Impact

- **Zero New Dependencies.** Uses existing React, Next.js 16, Lucide React icons, and Tailwind CSS.

---

## 18. Risks

- **Low Risk:** Landing page UI is purely presentation-layer and depends only on existing static config and client interactions.

---

## 19. Out-of-Scope Findings

1. **Unknown Tenant Subdomain Handling:** Currently, unknown subdomains fall back to `DEFAULT_TENANT` in `getTenantContext()`. A future work package may refine proxy handling for unprovisioned subdomains.
2. **Public Self-Registration API:** Self-registration backend API is not yet built (tenants are created via super-admin dashboard `/dashboard/saas/tenants`). Primary landing page CTA will launch a contact/demo request modal or direct users to `/login`.

---

## 20. Phase 2 Implementation Plan

Upon Product Owner authorization:
1. Create `src/config/product.ts`.
2. Create `src/components/landing/SaasLandingPage.tsx`.
3. Update `src/app/page.tsx` with clean conditional rendering.
4. Execute Quality Gates.

---

## 21. Validation Plan (Phase 2 Quality Gates)

1. `npm run lint:ci` (Lint check)
2. `npx tsc --noEmit` (Typecheck check)
3. `npm run test:run` (Unit & Security tests pass: 179/179)
4. `npm run build` (Next.js production build pass)
5. **Functional Checks:**
   - Access `localhost:3000` -> Renders `SaasLandingPage` (with "Built by SERZEN DEV" attribution).
   - Access `/t/al-fatih` -> Renders `TenantPortalClient` for Al-Fatih tenant.
   - Access `/login` -> Renders Login page.
   - Access `/dashboard` -> Renders Dashboard.
