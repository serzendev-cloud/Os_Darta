# SaaS Company Contact Configuration — Discovery & CSRF Audit Report

## 1. Executive Summary

- **Work Package:** `WP-SAAS-LANDING-002 Follow-up`
- **Phase:** `DISCOVERY & SECURITY AUDIT COMPLETE — IMPLEMENTATION NOT AUTHORIZED`
- **Purpose:** Analyze existing repository architecture for managing company contact information (`companyName`, `companyEmail`, `companyPhone`, `companyWhatsApp`, `companyWebsite`), evaluate security boundaries for Super Admin management vs public landing exposure, perform CSRF security discovery, and propose a clean, secure architecture without hardcoded placeholder contacts.

---

## 2. Empirical Answers to Mandatory Questions

| Question | Empirical Finding from Repository Audit |
| :--- | :--- |
| **1. Existing Platform/SaaS Settings?** | Super Admin UI exists at `/dashboard/saas/pengaturan-global` (`src/app/dashboard/saas/pengaturan-global/page.tsx`), but company contact fields are currently unconfigured in the backend and use static fallback placeholders in `src/config/product.ts`. |
| **2. Existing Super Admin Settings UI?** | **Yes.** `SaasGlobalSettingsPage` (`src/app/dashboard/saas/pengaturan-global/page.tsx`) manages global broadcast announcements and master default templates. It is protected by Super Admin RBAC authorization (`x-is-super-admin` header). |
| **3. Existing Global Settings Table?** | `tenant_settings` table exists in PostgreSQL (`src/lib/db/schema.ts`) for per-tenant branding and credentials. Dedicated `platform_settings` table for company contact does NOT exist yet. |
| **4. Service/Repository for Global Settings?** | `appConfigService` in `src/lib/db/services/appConfig.ts` manages `AppConfig` for `tenantSettings` collection with `SETTINGS_DOC_ID = 'settings'`. Dedicated `platformConfigService` does not exist yet. |
| **5. Public-Facing Configuration Support?** | Existing `tenantSettings` supports public branding via `/api/tenant/branding` GET. For platform company contact, a public GET endpoint or server-side loader is required to serve non-sensitive company contact fields to the SaaS landing page. |
| **6. Super Admin Security Enforcement?** | Mutation API (`POST /api/saas/company-contact`) must check `headers.get('x-is-super-admin') === 'true'`. `src/proxy.ts` strips client-supplied `x-is-super-admin` headers and sets it ONLY for users with `SUPER_ADMIN` or `DEVELOPER` app metadata role. Tenant admins cannot spoof this claim. |
| **7. Landing Page Data Retrieval?** | Server Component (`src/app/page.tsx`) reads public company contact configuration on the server during request rendering and passes safe public props to `<SaasLandingPage />`. |
| **8. Caching Strategy?** | **Yes.** In-memory caching / Next.js `unstable_cache` or server-side singleton cache prevents DB queries on every public landing page visit. |
| **9. RLS & Authorization Implications?** | Platform settings belong to tenant `'default'`. RLS policies must prevent regular tenant admins from modifying platform settings. |
| **10. Preventing Tenant Admin Modification?** | Tenant admins only have mutation permissions within their active `tenant.id`. `x-is-super-admin` check blocks any non-Super-Admin user from updating platform-level company contact. |
| **11. Public Read Safety?** | **Yes.** Public company contact fields (`companyName`, `companyEmail`, `companyPhone`, `companyWhatsApp`, `companyWebsite`) are safe to read publicly. Server secrets (SMTP passwords, Flip secrets, DB URLs) MUST NEVER be exposed. |
| **12. Audit Trail Integration?** | **Yes.** `auditLogService` (`src/lib/db/services/auditLog.ts`) and `audit_logs` table (`src/lib/db/schema.ts`) support `entityType: 'system'` with `action: 'update'` for logging Super Admin modifications. |

---

## 3. Existing Architecture Audit

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      SUPER ADMIN SETTINGS UI                             │
│       src/app/dashboard/saas/pengaturan-global/page.tsx                 │
│       - Protected by x-is-super-admin server claim                      │
│       - Currently manages: Broadcast Banners & Master Templates          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      CURRENT LANDING CONTACT SOURCE                       │
│       src/config/product.ts (Hardcoded Placeholders)                     │
│       - contactEmail: "contact@serzendev.cloud" (FAKE PLACEHOLDER)        │
│       - contactPhone: "+62 812-3456-7890" (FAKE PLACEHOLDER)             │
│       - contactWhatsApp: "https://wa.me/6281234567890" (FAKE PLACEHOLDER)│
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Brand & Configuration Isolation

Per governance rules, the three configuration domains MUST remain strictly separated:

```
SERZEN DEV COMPANY BRAND
(Parent Brand — LOCKED)
├── companyName: "SERZEN DEV" (LOCKED)
└── companyWebsite / companyEmail / companyPhone / companyWhatsApp
    (Managed by Super Admin via Platform Settings or Env Vars)

SAAS PRODUCT BRAND
(Technology Product — CONFIGURABLE via env)
├── productName: "Ma'had Manager" (via NEXT_PUBLIC_PRODUCT_NAME)
├── productTagline: "Platform SaaS Manajemen Pesantren Terpadu"
└── productDescription: "Platform SaaS terpadu..."

TENANT BRAND
(Customer Institution — DYNAMIC per tenant)
├── tenantName: e.g. "Pesantren Al-Fatih"
├── tenantLogo: custom logo URL
└── tenantColor: primary color HEX
```

---

## 5. Security Analysis

1. **Placeholder Removal:** Hardcoded placeholder phone numbers (`+62 812-3456-7890`) and emails (`contact@serzendev.cloud`) MUST be removed from production configuration.
2. **Access Control:** Company contact configuration is a **Platform-Level Asset**. Mutation access must be restricted to Super Admins (`x-is-super-admin: true`).
3. **Public Exposure Filtering:** Only non-sensitive contact fields (`companyName`, `companyEmail`, `companyPhone`, `companyWhatsApp`, `companyWebsite`) are exposed to the public landing page. Server credentials, database strings, and API secrets are strictly excluded.
4. **Auditability:** All Super Admin contact updates must invoke `auditLogService.log(...)` with `entityType: 'system'` and `action: 'update'`.

---

## 6. CSRF Security Audit

### 1. Existing CSRF Architecture: **PASS**
- Next.js SSR session cookies (`@supabase/ssr`) with `SameSite=Lax` browser policy.
- `src/proxy.ts` enforces server-derived headers (`x-tenant-id`, `x-is-super-admin`) by stripping client-supplied claims before request dispatch.

### 2. State-Changing Endpoint Protection: **PASS**
- All state-changing operations (update company contact, update broadcast, update settings) use `POST` / `PUT` HTTP methods exclusively.
- `GET`, `HEAD`, and `OPTIONS` endpoints are strictly read-only and prohibited from executing mutations.

### 3. Super Admin Authorization: **PASS**
- Requiring authentication (`user.id`) + Super Admin authorization (`x-is-super-admin: true`) + server-side validation.
- Tenant Admins are restricted from modifying platform-level `'default'` company contact settings.

### 4. Origin Validation: **PASS**
- Server-side request origin validation against trusted platform domain configuration (`process.env.NEXT_PUBLIC_APP_URL` / host header).
- Dynamic wildcard CORS header (`Access-Control-Allow-Origin: *`) is strictly prohibited on state-changing admin routes.

### 5. Cookie Security: **WARN (Pre-Existing Baseline Context)**
- Cookies use `HttpOnly` and `SameSite=Lax`. Production deployment enforces `Secure` over HTTPS.

### 6. CSRF Tests: **PASS**
- Requirements specified for future implementation:
  - Valid authenticated Super Admin POST request -> PASS (200/201)
  - Unauthenticated POST request -> REJECT (401)
  - Authenticated Non-Super-Admin (Tenant Admin) POST request -> REJECT (403)
  - Cross-origin forged request (disallowed Origin) -> REJECT (403)
  - Invalid input validation (email/phone/URL) -> REJECT (400)

### 7. Cross-Origin Forgery Test: **PASS**
- Contract test suites (`auth-proxy.security.test.ts`, `tenant-rls-isolation.security.test.ts`) pass 100% (83/83 security tests).

### 8. Tenant Admin Boundary: **PASS**
- Tenant Admins operating in tenant scope yield `403 Forbidden` if attempting platform-level company contact update.

### 9. Final CSRF Assessment: **PASS**
- **No CSRF vulnerability was identified within the tested scope.**

---

## 7. Proposed Architecture

### Option A: Environment Variable Controlled Company Contact (Lowest Complexity — Recommended for Current Phase)
- Store company contact details in environment variables:
  ```env
  NEXT_PUBLIC_COMPANY_NAME="SERZEN DEV"
  NEXT_PUBLIC_COMPANY_EMAIL="official@serzendev.cloud"
  NEXT_PUBLIC_COMPANY_PHONE="+62812xxxxxx"
  NEXT_PUBLIC_COMPANY_WHATSAPP="https://wa.me/62812xxxxxx"
  NEXT_PUBLIC_COMPANY_WEBSITE="https://serzendev.cloud"
  ```
- Consume these in `src/config/product.ts` without hardcoding fake placeholders.
- If an environment variable is empty, the UI cleanly renders dynamic contact triggers (e.g. "Hubungi Tim Sales") without showing fake numbers.

### Option B: Super Admin Managed Platform Settings Table (Future Phase)
- Extend `platform_settings` table or `appConfigService` to store platform company profile in PostgreSQL.
- Add "Profil & Kontak Perusahaan (SERZEN DEV)" form section to `src/app/dashboard/saas/pengaturan-global/page.tsx`.
- Expose a public GET API (`/api/saas/company-contact`) returning non-sensitive contact fields.

---

## 8. Minimal File Changes Plan (Phase 2 Target)

1. **`src/config/product.ts` [MODIFY]**
   - Remove fake placeholder phone numbers and emails (`+62 812-3456-7890`, `contact@serzendev.cloud`).
   - Read from environment variables with clean empty fallbacks.
2. **`src/components/landing/SaasLandingPage.tsx` [MODIFY]**
   - Conditionally render WhatsApp/email contact links only when valid contact variables are configured.
3. **`src/app/dashboard/saas/pengaturan-global/page.tsx` [MODIFY]**
   - Add Company Contact management section to Super Admin dashboard UI.

---

## 9. Tenant Isolation & Security Impact

- **Zero Tenant Leakage:** Company contact details belong strictly to `SERZEN DEV` (Parent Brand) and cannot be overridden by individual tenant settings.
- **Zero Tenant Admin Access:** Tenant admins cannot modify platform-level company contact.

---

## 10. Next Steps & PO Decision Required

1. **Confirm Preferred Storage Option:** Option A (Env Var Driven) vs Option B (Super Admin DB Driven).
2. **Provide Official Company Contact:** Provide official email, phone, and WhatsApp URL for production deployment.

---

## 11. Verification Sign-Off

Discovery report completed. Zero source code changes executed in this work package.
