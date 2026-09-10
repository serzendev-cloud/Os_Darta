# WP-SAAS-COMPANY-CONTACT-EXECUTION-001 REPORT
## Platform Company Profile & Contact Settings Implementation

STATUS: COMPLETE & AUTHORIZED FOR PO REVIEW
WORK PACKAGE: WP-SAAS-COMPANY-CONTACT-EXECUTION-001
DATE: 2026-09-10
BRANCH: preview

---

# Executive Summary

Work Package **WP-SAAS-COMPANY-CONTACT-EXECUTION-001** has been successfully executed under Option B (Super Admin DB Driven Platform Persistence).

Key Highlights:
1. **LOCKED Parent Brand:** `companyName` is hard-locked to `"SERZEN DEV"` across database, API DTO, service layer, and UI. It is non-configurable by any tenant or user.
2. **Database Driven Platform Persistence:** Created a dedicated single-row table `platform_settings` in PostgreSQL (`src/lib/db/schema.ts`) and integrated with in-memory `mock-store` (`src/lib/mock-store.ts`).
3. **Data Access Layer:** Created `platformSettingsService` (`src/lib/db/services/platformSettings.ts`) providing unified `get()` and `update()` operations.
4. **API Endpoint & Security:** Implemented `/api/saas/company-contact/route.ts`:
   - `GET`: Public-safe DTO exposing only `companyName`, `companyEmail`, `companyPhone`, `companyWhatsApp`, and `companyWebsite`.
   - `POST`: State-changing mutation protected by Super Admin Auth (`x-is-super-admin === 'true'`), CSRF/Origin validation, server-side Zod-like input validation/sanitization, and audit log generation (`auditLogService.log`).
5. **Super Admin UI:** Integrated "Profil & Informasi Perusahaan (Platform SaaS)" card inside `/dashboard/saas/pengaturan-global` with locked `SERZEN DEV` display and editable contact fields.
6. **Landing Page Integration:** Updated `SaasLandingPage.tsx` and `src/config/product.ts` to strip hardcoded fake/placeholder contacts (`contact@serzendev.cloud`, `+62 812-3456-7890`, `wa.me/6281234567890`) and handle empty/null contact states gracefully without rendering broken links or fake numbers.
7. **Security Test Suite:** Created `tests/contracts/company-contact.security.test.ts` with 13 comprehensive contract tests covering authorization, CSRF, input sanitization, and tenant boundary enforcement.
8. **Quality Gates:** 100% PASS across ESLint baseline check, `tsc --noEmit`, test suite (192/192 tests pass), and `npm run build`.

---

# Files Changed

1. `src/lib/db/schema.ts` — Added `platformSettings` Drizzle PostgreSQL table.
2. `src/lib/mock-store.ts` — Added `platformSettings` collection to demo store.
3. `src/lib/db/services/platformSettings.ts` — [NEW] Domain service for platform company settings.
4. `src/lib/db/services/index.ts` — Exported `platformSettingsService`.
5. `src/app/api/saas/company-contact/route.ts` — [NEW] Public GET & Super Admin POST API endpoint with auth, CSRF, sanitization, and audit logging.
6. `src/app/dashboard/saas/pengaturan-global/page.tsx` — Added Super Admin UI section for Platform Company Profile & Contact Settings.
7. `src/config/product.ts` — Removed hardcoded placeholder contacts (`contactEmail`, `contactPhone`, `contactWhatsApp`).
8. `src/components/landing/SaasLandingPage.tsx` — Updated to fetch dynamic public contact data and handle empty states safely.
9. `tests/contracts/company-contact.security.test.ts` — [NEW] 13 security and contract tests.

---

# Database Changes

Canonical PostgreSQL Table Schema:

```sql
CREATE TABLE platform_settings (
  id TEXT PRIMARY KEY, -- 'default'
  company_name TEXT NOT NULL DEFAULT 'SERZEN DEV',
  company_email TEXT,
  company_phone TEXT,
  company_whatsapp TEXT,
  company_website TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- **Isolasi Table:** Fully separated from `tenants`, `tenant_settings`, and `appConfig`.
- **Non-destructive:** Migration ready, no reset or data loss.

---

# API / Server Actions

| Endpoint | Method | Auth Level | CSRF Protected | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/saas/company-contact` | `GET` | Public | No (Read-Only) | Returns public safe platform contact DTO |
| `/api/saas/company-contact` | `POST` | Super Admin Only | **Yes (Origin Mismatch Check)** | Updates platform contact info, logs audit trail |

---

# UI Changes

- **Super Admin Area (`/dashboard/saas/pengaturan-global`):**
  - Added new Card: "Profil & Informasi Perusahaan (Platform SaaS)".
  - Displays locked badge for `SERZEN DEV` (Parent Brand).
  - Provides editable input fields for Email, Phone, WhatsApp, and Website.
  - Submits payload to `/api/saas/company-contact` with instant toast notification.
- **SaaS Landing Page (`SaasLandingPage.tsx`):**
  - Removed hardcoded placeholder numbers and emails.
  - Fetches platform contact data on load.
  - Handles empty state safely (e.g. renders "Email belum dikonfigurasi", suppresses WhatsApp CTA if empty, avoids broken mailto/href links).

---

# Security & Compliance Verification

| Requirement | Status | Evidence / Implementation |
| :--- | :--- | :--- |
| **Parent Brand Lock** | PASS | `companyName` is locked to `"SERZEN DEV"` across schema, service, API, and UI. |
| **Authentication Gate** | PASS | `POST` rejects requests without `x-user-id`. |
| **Authorization Gate** | PASS | `POST` rejects Tenant Admin / User requests (`x-is-super-admin !== 'true'`). |
| **CSRF / Origin Check** | PASS | Origin & Referer header matched against `Host` / app domain. Malicious origin rejected with HTTP 403. |
| **Input Validation** | PASS | Trimmed inputs, email syntax regex, phone regex, URL protocol sanitization (rejects `javascript:`, `data:`). |
| **XSS Prevention** | PASS | Contacts rendered as plain text or validated `http(s)` URLs. No `dangerouslySetInnerHTML`. |
| **Tenant Isolation** | PASS | Platform settings operate on platform-level persistence without using `tenant_id`. |
| **Audit Logging** | PASS | Invokes `auditLogService.log` with `actorId`, `actorRole: 'super_admin'`, `entityType: 'system'`, `entityId: 'platform_settings'`. |
| **Public DTO Exposure** | PASS | `GET` returns only public-safe fields (no internal DB IDs, no metadata). |
| **Graceful Empty State** | PASS | Landing page renders safely when contact fields are null/empty. |

---

# Quality Gates Verification Summary

1. **ESLint Baseline Audit (`npm run lint:ci`):** PASS (Zero new regressions).
2. **TypeScript Check (`npx tsc --noEmit`):** PASS (Exit code 0).
3. **Unit & Integration Tests (`npm run test:run`):** PASS (192/192 tests pass across 24 test files).
4. **Security Tests (`company-contact.security.test.ts`):** PASS (13/13 tests pass).
5. **Production Build (`npm run build`):** PASS (Exit code 0, 79 static routes rendered).

---

# Final Response Verification Checklist

- [x] Tenant can read platform settings directly from DB? **NO (Server-side controlled GET DTO only)**
- [x] Tenant can update platform settings? **NO (Rejected with HTTP 403)**
- [x] Client can spoof Super Admin identity? **NO (Proxy overwrites header based on server session)**
- [x] Mutation protected by CSRF/Origin? **YES**
- [x] Invalid origin rejected? **YES (Verified in security tests)**
- [x] Input validated server-side? **YES**
- [x] Dangerous URL protocol rejected? **YES**
- [x] Contact data causes XSS? **NO**
- [x] Secrets exposed? **NO**
- [x] Audit log created? **YES**
- [x] Public landing only exposes public-safe fields? **YES**
- [x] Empty contact state safe? **YES**
- [x] Tenant routing intact? **YES**
- [x] SaaS root remains SaaS Landing Page? **YES**

---

# Final Recommendation

**STATUS: PASS — READY FOR PRODUCT OWNER REVIEW.**
No git commit or push has been performed.
