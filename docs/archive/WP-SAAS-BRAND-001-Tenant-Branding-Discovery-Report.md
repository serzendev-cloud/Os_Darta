# WP-SAAS-BRAND-001 — Tenant Branding System Discovery Report

> **MODE:** READ-ONLY FORENSIC DISCOVERY  
> **DATE:** 2026-09-01  
> **STATUS:** DISCOVERY COMPLETE  
> **AUTHORIZATION:** DISCOVERY ONLY — NO IMPLEMENTATION

---

## 1. Executive Summary

This report documents a comprehensive forensic audit of the existing Tenant Branding architecture in the Ma'had Manager (Madev) SaaS platform. The audit covers all branding-related fields, surfaces, theme systems, SEO metadata, tenant isolation, security, and future compatibility with custom domains, subscriptions, and add-ons.

**Key Findings:**
- **Branding architecture is CANONICAL and SOUND.** The single `tenantSettings` table is the correct and sole source for all branding fields.
- **7 branding-related fields** currently exist in `tenant_settings`.
- **6 portal components + 2 public pages** currently consume branding fields.
- **Dashboard sidebar and topbar do NOT consume tenant branding** — they use platform-level hardcoded identity.
- **No duplicate branding engine exists.** `DUPLICATE BRANDING ENGINE = 0`.
- **Tenant isolation is PARTIAL** — server-side `getTenantContext()` resolves correctly, but application-level Supabase RLS for `tenant_settings` is **not yet configured**.
- **Portal content is mixed with branding** in the same `tenantSettings` table — however, portal content is mostly **hardcoded in JSX**, not stored in the database.
- **SEO metadata exists** for `/` and `/login` pages via `generateMetadata()`, but is minimal (no favicon, no OG image, no canonical URL, no Twitter card).
- **Theme system uses `next-themes`** for light/dark mode only — `primaryColor` is applied via inline `style={{ backgroundColor }}` and does NOT participate in the CSS variable / design token system.
- **No security vulnerabilities found** at critical severity, but `customLogoUrl` accepts arbitrary external URLs without validation.

---

## 2. Existing Branding Architecture

### Canonical Data Flow (CONFIRMED)

```
tenants (identity)
    ↓
tenantSettings (branding + integration credentials)
    ↓
getTenantContext() (server-side resolution)
    ↓
Tenant Portal / Login / Dashboard (consumption)
```

### Canonical Tenant Resolution (CONFIRMED)

| Layer | File | Function |
|-------|------|----------|
| Proxy/Middleware | `src/proxy.ts` | `extractTenantSlug()` → sets `x-tenant-slug` header |
| Server Context | `src/lib/tenant/context.ts` | `getTenantContext()` → reads `x-tenant-slug`, queries `tenants` + `tenantSettings` |

### Canonical Tenant Identity (CONFIRMED)

| Field | Table | Source |
|-------|-------|--------|
| `id` | `tenants` | Primary Key |
| `name` | `tenants` | Pesantren name |
| `slug` | `tenants` | Subdomain identifier (unique) |
| `domain` | `tenants` | Custom domain (nullable, future) |
| `status` | `tenants` | `active` / `suspended` / `trial` |

---

## 3. tenantSettings Field Inventory

### Database Schema: `src/lib/db/schema.ts` (Lines 14-33)

| # | Column | DB Column | Type | Default | Category |
|---|--------|-----------|------|---------|----------|
| 1 | `id` | `id` | `text` PK | — | System |
| 2 | `tenantId` | `tenant_id` | `text` NOT NULL UNIQUE | — | System |
| 3 | `gdriveServiceAccountJson` | `gdrive_service_account_json` | `text` | null | Integration |
| 4 | `flipSecretKey` | `flip_secret_key` | `text` | null | Integration |
| 5 | `flipValidationToken` | `flip_validation_token` | `text` | null | Integration |
| 6 | `waGatewayApiKey` | `wa_gateway_api_key` | `text` | null | Integration |
| 7 | `customLogoUrl` | `custom_logo_url` | `text` | null | **Branding** |
| 8 | `customBgUrl` | `custom_bg_url` | `text` | null | **Branding** |
| 9 | `primaryColor` | `primary_color` | `text` | `#0F766E` | **Branding** |
| 10 | `tagline` | `tagline` | `text` | `Sistem Informasi Pesantren Terpadu` | **Branding** |
| 11 | `loginTitle` | `login_title` | `text` | null | **Branding** |
| 12 | `loginSubtitle` | `login_subtitle` | `text` | null | **Branding** |
| 13 | `loginDescription` | `login_description` | `text` | null | **Branding** |
| 14 | `createdAt` | `created_at` | `timestamp` | `now()` | System |
| 15 | `updatedAt` | `updated_at` | `timestamp` | `now()` | System |

### TenantContext Interface: `src/lib/tenant/context.ts` (Lines 10-28)

All 7 branding fields + 4 integration credential fields are exposed via `TenantContext.settings`.

### Branding Fields Summary

| Field | Exists in Schema | Exists in Context | Currently Consumed |
|-------|:---:|:---:|:---:|
| `customLogoUrl` | ✅ | ✅ | ✅ (Portal, Login) |
| `customBgUrl` | ✅ | ✅ | ❌ NOT CONSUMED |
| `primaryColor` | ✅ | ✅ | ✅ (Portal only) |
| `tagline` | ✅ | ✅ | ✅ (Portal, Login metadata) |
| `loginTitle` | ✅ | ✅ | ✅ (Login) |
| `loginSubtitle` | ✅ | ✅ | ✅ (Login, Portal Hero) |
| `loginDescription` | ✅ | ✅ | ✅ (Login, Portal Profile, metadata) |

> **WARNING:** `customBgUrl` is defined in schema and exposed in context but is **never consumed** anywhere in the UI. This is a dead field.

---

## 4. Branding Surface Matrix

| # | Surface | File | Current Source | Fields Consumed | Canonical? | Tenant-Aware? | Missing |
|---|---------|------|---------------|-----------------|:---:|:---:|---------|
| 1 | **Public Portal Hero** | `TenantPortalHero.tsx` | `tenant.settings` | `primaryColor`, `customLogoUrl`, `loginSubtitle`, `tagline` | ✅ | ✅ | — |
| 2 | **Public Portal Header** | `TenantPortalHeader.tsx` | `tenant.settings` | `primaryColor`, `customLogoUrl`, `tagline` | ✅ | ✅ | — |
| 3 | **Public Portal Profile** | `TenantPortalProfile.tsx` | `tenant.settings` | `primaryColor`, `tagline`, `loginDescription` | ✅ | ✅ | Profile content is hardcoded |
| 4 | **Public Portal Programs** | `TenantPortalPrograms.tsx` | `tenant.settings` | `primaryColor` | ✅ | ✅ | Programs are hardcoded |
| 5 | **Public Portal Achievements** | `TenantPortalAchievements.tsx` | `tenant.settings` | `primaryColor` | ✅ | ✅ | Achievements are hardcoded |
| 6 | **Public Portal Info/News** | `TenantPortalInfoNews.tsx` | `tenant.settings` | `primaryColor` | ✅ | ✅ | News content is hardcoded |
| 7 | **Public Portal Footer** | `TenantPortalContactFooter.tsx` | `tenant.settings` | `primaryColor`, `customLogoUrl`, `loginSubtitle`, `tagline` | ✅ | ✅ | Contact info uses fallbacks/placeholders |
| 8 | **Login Page (Server)** | `login/page.tsx` | `tenant.settings` | `loginTitle`, `loginSubtitle`, `loginDescription`, `customLogoUrl` | ✅ | ✅ | `primaryColor` NOT applied to login |
| 9 | **Login Page (Client)** | `client-page.tsx` | Props from server | `loginTitle`, `loginSubtitle`, `loginDescription`, `customLogoUrl` | ✅ | ✅ | Colors hardcoded to emerald |
| 10 | **Root Page Metadata** | `page.tsx` | `tenant.settings` | `tagline`, `loginDescription`, `tenant.name` | ✅ | ✅ | No OG image, no favicon, no canonical |
| 11 | **Login Page Metadata** | `login/page.tsx` | `tenant.settings` | `loginTitle`, `loginDescription` | ✅ | ✅ | No OG, no favicon |
| 12 | **Root Layout** | `layout.tsx` | Static | `metadata.title = "Ma'had Manager"` | ❌ | ❌ | Static, NOT tenant-aware |
| 13 | **Dashboard Sidebar** | `sidebar.tsx` | Hardcoded | None from `tenantSettings` | ❌ | ❌ | Logo, name are platform-hardcoded |
| 14 | **Dashboard Topbar** | `topbar.tsx` | Hardcoded | None from `tenantSettings` | ❌ | ❌ | No tenant branding in topbar |
| 15 | **Favicon** | Static `/public/` | Static file | None | ❌ | ❌ | Not tenant-dynamic |
| 16 | **Tampilan Login Settings** | `tampilan-login/page.tsx` | Mock state | `title`, `subtitle`, `description` | ⚠️ | ❌ | Mock-only, no API save |

---

## 5. Tenant Identity vs Branding vs Portal Content

### Current Architecture Classification

```
TENANT IDENTITY (tenants table)
├── id, name, slug, domain, status
│
TENANT SETTINGS (tenantSettings table — MIXED)
├── BRANDING FIELDS
│   ├── customLogoUrl
│   ├── customBgUrl (unused)
│   ├── primaryColor
│   ├── tagline
│   ├── loginTitle
│   ├── loginSubtitle
│   └── loginDescription
│
├── INTEGRATION CREDENTIALS
│   ├── flipSecretKey
│   ├── flipValidationToken
│   ├── waGatewayApiKey
│   └── gdriveServiceAccountJson
│
PORTAL CONTENT (HARDCODED IN JSX — NOT in database)
├── Profile features → hardcoded in TenantPortalProfile.tsx
├── Programs list → hardcoded in TenantPortalPrograms.tsx
├── Achievements → hardcoded in TenantPortalAchievements.tsx
├── News/Info → hardcoded in TenantPortalInfoNews.tsx
└── Contact details → hardcoded placeholder in TenantPortalContactFooter.tsx
```

**MIXING FINDING:** The `tenantSettings` table currently mixes **branding** with **integration credentials**. However, portal content is NOT stored in the database at all — it is hardcoded in JSX components. This means:
- Branding + Integration Credentials → **mixed in one table** (manageable, both are tenant config)
- Portal Content → **hardcoded, not configurable per-tenant** (significant gap)

**RECOMMENDATION:** Future separation is RECOMMENDED but NOT urgent. The current `tenantSettings` table can accommodate additional branding fields without creating a new table. Portal content (programs, achievements, news) should eventually be stored in a separate `tenant_portal_content` or similar normalized structure, but this is a **WP-SAAS-BRAND-003** concern.

---

## 6. Existing Theme Architecture

### Theme Provider

| Component | File | Technology | Tenant-Aware? |
|-----------|------|------------|:---:|
| `ThemeProvider` | `src/components/providers/theme-provider.tsx` | `next-themes` | ❌ |
| Root Layout | `src/app/layout.tsx` | `attribute="class"`, `defaultTheme="system"` | ❌ |
| Theme Config | `src/config/theme.ts` | Role labels + role badge colors | ❌ |
| Dark Mode Toggle | `src/components/layout/topbar.tsx` | `useTheme()` from `next-themes` | ❌ |

### CSS Variables / Design Tokens

File: `src/app/globals.css`

The application uses shadcn/ui design tokens with oklch colors. Key observations:

- `--primary` is set to `oklch(0.42 0.12 165)` (Royal Deep Emerald) — **hardcoded, NOT tenant-dynamic**
- Sidebar, card, accent, muted, border tokens all exist as CSS variables
- Dark mode is supported via `.dark` class variant

### How `primaryColor` is Currently Applied

`primaryColor` from `tenantSettings` is used **exclusively via inline `style={{ backgroundColor: primaryColor }}`** in portal components. It does **NOT** feed into CSS variables or the design token system.

**GAP:** `tenantSettings.primaryColor` does NOT participate in the CSS variable / design token system. If tenant branding were to affect the dashboard, the current inline style approach would not scale. A future tenant theme injection mechanism (CSS custom properties via `style` attribute on `<html>` or `<body>`) would be needed.

**CAN IT SAFELY PARTICIPATE?** Yes — `primaryColor` could be injected as `--tenant-primary` CSS custom property at the layout level without conflicting with the existing design system. The platform tokens (`--primary`) would remain as the default, and tenant tokens would override approved surfaces only.

---

## 7. Existing SEO Architecture

### Current `generateMetadata()` Implementations

| Page | File | Title | Description | OG | Favicon | Canonical | Twitter |
|------|------|-------|-------------|:---:|:---:|:---:|:---:|
| `/` (Portal) | `src/app/page.tsx` | ✅ Tenant-aware | ✅ Tenant-aware | ⚠️ Partial (title+desc only, no image) | ❌ | ❌ | ❌ |
| `/login` | `src/app/login/page.tsx` | ✅ Tenant-aware | ✅ Tenant-aware | ❌ | ❌ | ❌ | ❌ |
| Root Layout | `src/app/layout.tsx` | ❌ Static "Ma'had Manager" | ❌ Static | ❌ | ❌ | ❌ | ❌ |

### SEO Gaps

1. **No tenant-aware favicon** — static favicon in `/public/`
2. **No OpenGraph image** — no `og:image` configured
3. **No canonical URL** — critical for subdomain SEO
4. **No Twitter/social cards** — no `twitter:card`, `twitter:image`
5. **Root layout metadata is static** — not tenant-aware, may be overridden by page-level metadata but base is incorrect
6. **No `siteName` on login page** OG metadata

---

## 8. Existing Tenant Settings Architecture

### Super Admin / Developer SaaS Console

The SaaS Console at `/dashboard/saas/tenants` provides:
- Tenant listing with mock data
- Module toggle management per tenant
- Trial request management
- **BUT: No branding management UI** — Super Admin cannot view or modify tenant branding fields

### Tenant Admin Settings

`/dashboard/pengaturan` provides:
- Account settings (personal preferences, notifications, dark mode)
- Governance settings (placeholder)
- Feature settings (placeholder)
- System settings (maintenance toggle)

Sub-pages:
- `/dashboard/pengaturan/tampilan-login` — **Login appearance CMS** with title, subtitle, description editing + live preview, BUT:
  - Uses local React state (mock only)
  - Does NOT read from `tenantSettings` database
  - Does NOT persist changes via API
  - Does NOT include logo upload or color picker
  - **This is a UI prototype, not a functional branding management tool**

- `/dashboard/pengaturan/tenant-integrasi` — Integration credentials management (Flip, WA, GDrive) — **functional pattern but uses mock data**

---

## 9. Tenant Isolation Audit

### Server-Side Tenant Resolution: ✅ PASS

| Check | Status | Evidence |
|-------|:---:|---------|
| Proxy extracts tenant from hostname | ✅ | `extractTenantSlug()` in `proxy.ts` |
| `x-tenant-slug` header is set server-side | ✅ | `proxy.ts:140-141` |
| Client `x-tenant-id` header is overwritten | ✅ | Zero-Trust: `proxy.ts:138-139` |
| `getTenantContext()` queries by slug | ✅ | `context.ts:53-56` |
| `tenantSettings` queried by `tenantId` | ✅ | `context.ts:61-64` |

### Database-Level Isolation (RLS): ⚠️ GAP

| Check | Status | Evidence |
|-------|:---:|---------|
| Supabase RLS enabled on `tenant_settings` | ❌ | No `row_level_security` policies found in SQL migrations |
| Supabase RLS enabled on `tenants` | ❌ | No RLS policies found |
| Application-level tenant filtering | ✅ | `create-tenant-service.ts:108` filters by `tenantId` |

**GAP:** Database-level RLS (Row-Level Security) is NOT configured for `tenant_settings` or `tenants` tables. Tenant isolation currently relies on **application-level filtering** in `getTenantContext()` and `createTenantService()`. While this prevents casual data leaks, it does NOT provide defense-in-depth at the database level. This is a pre-existing architectural gap and is NOT specific to branding.

### Client-Side Tenant ID: ⚠️ ADVISORY

`tenant-service.ts` uses `localStorage.getItem('mahad_active_tenant_id')` as the client-side tenant identifier. This is used by `createTenantService` for write operations. While the proxy overwrites upstream headers, the client-side tenant ID in localStorage is **not verified against the server-side session**.

---

## 10. Subdomain Compatibility

### PASS ✅

The existing subdomain architecture from WP-SAAS-PORTAL-003 is fully compatible:

```
tenant-subdomain (e.g., alfatih.madev.id)
    ↓
extractTenantSlug() → "alfatih"
    ↓
tenant = SELECT * FROM tenants WHERE slug = 'alfatih'
    ↓
getTenantContext() → tenantSettings WHERE tenant_id = tenant.id
    ↓
branding available on all public pages
```

No second hostname-to-branding resolver exists. The architecture is canonical.

---

## 11. Future Custom Domain Compatibility

### PASS with NOTE ✅

The current architecture resolves branding from `tenant.id` (via `tenantSettings.tenantId`), NOT from hostname string. This means:

```
subdomain: alfatih.madev.id → tenant.id = "t-alfatih"
future custom: pesantren-alfatih.com → same tenant.id = "t-alfatih"
```

**Branding resolves correctly from `tenant.id` regardless of hostname.**

However, the `extractTenantSlug()` function currently only supports:
1. Path route `/t/:slug`
2. Subdomain extraction

Custom domain resolution would require adding a third resolution path (DB lookup by `tenants.domain`). The `domain` column already exists on the `tenants` table and is nullable — ready for future use.

---

## 12. Subscription Compatibility

### PASS with NOTE ✅

No subscription system exists yet. Branding fields are currently unconditionally available to all tenants. Future subscription entitlement can gate specific branding features (e.g., custom color, custom logo) without modifying the `tenantSettings` schema — entitlement checks would be applied at the UI/API layer.

The `tenantSettings` table does NOT contain any subscription/package fields, which is correct. Subscription should be a separate concern.

---

## 13. Add-on Compatibility

### PASS ✅

The architecture supports the future add-on model:

```
Base Package (included branding: name, tagline)
    +
Branding Add-on (custom logo, custom colors, custom SEO)
```

The `tenantSettings` fields exist regardless of package level. Entitlement gating would control which fields the tenant admin can edit, not which fields exist in the schema. This is the correct approach.

---

## 14. Super Admin Authority

| Capability | Current Status |
|-----------|:---:|
| Can Super Admin see tenant list? | ✅ (SaaS Console `/dashboard/saas/tenants`) |
| Can Super Admin see tenant branding? | ❌ No UI exists |
| Can Super Admin modify tenant branding? | ❌ No UI exists |
| Can Super Admin toggle tenant modules? | ✅ (mock toggles in tenant management UI) |
| Can Super Admin manage integration credentials? | ✅ (mock, via `tenant-integrasi` page) |

Super Admin currently has **no visibility into tenant branding configuration**. There is no audit view or override capability for branding fields. This is a gap that should be addressed in WP-SAAS-BRAND-002.

---

## 15. Tenant Admin Authority

| Capability | Current Status |
|-----------|:---:|
| Can tenant admin access settings? | ✅ (`/dashboard/pengaturan`) |
| Can tenant admin edit login appearance? | ⚠️ UI exists but is MOCK ONLY (no persistence) |
| Can tenant admin upload logo? | ❌ No upload UI |
| Can tenant admin change primary color? | ❌ No color picker UI |
| Can tenant admin edit portal content? | ❌ Hardcoded in JSX |
| Can tenant admin manage integration credentials? | ⚠️ UI exists but uses mock data |

---

## 16. Security Findings

| # | Severity | Finding | Location |
|---|----------|---------|----------|
| S-1 | **MEDIUM** | `customLogoUrl` accepts arbitrary external URLs — no validation, no allowlisting, no CSP restriction. Could be used for tracking pixels or phishing if tenant admin is compromised. | `schema.ts:23`, `TenantPortalHero.tsx:93` |
| S-2 | **MEDIUM** | `customBgUrl` same issue as S-1 — accepts arbitrary URLs though currently unused. | `schema.ts:24` |
| S-3 | **LOW** | `primaryColor` accepts arbitrary CSS color string — could theoretically contain CSS injection via `style={{ backgroundColor: primaryColor }}`. React's style handling mitigates most XSS, but no validation exists. | All portal components |
| S-4 | **LOW** | `loginTitle`, `loginSubtitle`, `loginDescription` accept arbitrary text — rendered as text content (not `dangerouslySetInnerHTML`), so XSS risk is low. However, no character length or content validation exists. | Login page, portal components |
| S-5 | **MEDIUM** | No Supabase RLS on `tenant_settings` — application-level filtering is the only isolation mechanism. | Migration SQL files |

No CRITICAL security vulnerabilities found. All findings are MEDIUM or LOW severity and can be addressed in WP-SAAS-BRAND-002 implementation.

---

## 17. Duplicate Engine Audit

| Check | Count | Evidence |
|-------|:---:|---------|
| Branding service/store/hook | **0** | No `useBranding()`, `brandingStore`, or `brandingService` found |
| Tenant theme provider | **0** | Only `next-themes` ThemeProvider exists (light/dark, not tenant-aware) |
| Tenant settings repository | **1** (canonical) | `appConfigService` wraps `createTenantService('tenantSettings')` — legitimate canonical service |
| Tenant profile engine | **0** | No separate profile engine |
| Tenant portal configuration engine | **0** | No CMS engine for portal content |
| Duplicate branding table | **0** | Only `tenant_settings` exists |

**DUPLICATE BRANDING ENGINE = 0** ✅

`appConfigService` in `src/lib/db/services/appConfig.ts` uses `createTenantService('tenantSettings')` — this is the canonical client-side service for reading/writing tenant settings. It is **not** a duplicate; it is the legitimate service layer for `tenantSettings`. However, it is primarily used for `AppConfig` (maintenance, feature flags, governance), NOT for branding fields. Branding is currently read server-side via direct Drizzle queries in `getTenantContext()`.

---

## 18. Missing Capabilities

### A. CORE IDENTITY

| Field | Status | Priority |
|-------|:---:|---------|
| Tenant name | ✅ `tenants.name` | — |
| Logo | ✅ `customLogoUrl` | — |
| Favicon | ❌ MISSING | HIGH |
| Tagline | ✅ `tagline` | — |
| Short description | ⚠️ Repurposed `loginDescription` | MEDIUM |

### B. VISUAL IDENTITY

| Field | Status | Priority |
|-------|:---:|---------|
| Primary color | ✅ `primaryColor` | — |
| Secondary color | ❌ MISSING | LOW |
| Accent color | ❌ MISSING | LOW |
| Background | ✅ `customBgUrl` (unused) | LOW |
| Text contrast | ❌ MISSING | MEDIUM |
| Theme mode | ❌ (system-level only) | LOW |
| Typography | ❌ MISSING | LOW |

### C. PUBLIC PORTAL IDENTITY

| Field | Status | Priority |
|-------|:---:|---------|
| Institution name | ✅ `tenants.name` | — |
| Hero content | ❌ Hardcoded | MEDIUM |
| Profile description | ⚠️ Uses `loginDescription` as fallback | MEDIUM |
| Programs | ❌ Hardcoded | HIGH |
| Achievements | ❌ Hardcoded | HIGH |
| Contact info | ❌ Hardcoded placeholder | HIGH |
| Marketing content | ❌ Not implemented | LOW |

### D. LOGIN IDENTITY

| Feature | Status | Priority |
|---------|:---:|---------|
| Login title | ✅ | — |
| Login subtitle | ✅ | — |
| Login description | ✅ | — |
| Logo on login | ✅ | — |
| `primaryColor` on login | ❌ Hardcoded emerald | MEDIUM |
| Background customization | ❌ `customBgUrl` unused | LOW |

### E. SEO IDENTITY

| Field | Status | Priority |
|-------|:---:|---------|
| Page title | ✅ Partial | — |
| Description | ✅ Partial | — |
| Favicon | ❌ MISSING | HIGH |
| OG image | ❌ MISSING | HIGH |
| Canonical URL | ❌ MISSING | HIGH |
| Social preview (Twitter) | ❌ MISSING | MEDIUM |

### F. CONTACT / INSTITUTION PROFILE

| Field | Status | Priority |
|-------|:---:|---------|
| Address | ❌ MISSING | HIGH |
| Phone | ❌ MISSING | HIGH |
| Email | ❌ MISSING | HIGH |
| WhatsApp | ❌ MISSING | MEDIUM |
| Website | ❌ MISSING | LOW |
| Social media | ❌ MISSING | LOW |
| Maps/location | ❌ MISSING | LOW |

### G. DASHBOARD BRANDING

| Feature | Status | Priority |
|---------|:---:|---------|
| Sidebar logo | ❌ Platform-hardcoded | HIGH |
| Institution name in sidebar | ❌ Platform-hardcoded | HIGH |
| Primary color in dashboard | ❌ Not connected | MEDIUM |
| Application identity | ❌ Hardcoded "Ma'had Manager" | LOW |

### H. BRANDING MANAGEMENT UI

| Feature | Status |
|---------|:---:|
| Logo upload component | ❌ No upload primitive exists in `/components/ui/` |
| Color picker component | ❌ Not found |
| Branding preview | ⚠️ Login preview exists but mock-only |
| Save/persist branding API | ❌ Not implemented |
| Super Admin branding audit | ❌ Not implemented |

### I. RESPONSIVE PRIMITIVES INVENTORY

| Primitive | Status |
|-----------|:---:|
| `ResponsiveDataGrid` | ✅ EXISTS — `src/components/ui/responsive-data/` |
| `MobileCard` / `MobileCardStack` | ✅ EXISTS — `src/components/ui/responsive-data/` |
| `ResponsiveFilterBar` | ❌ NOT FOUND |
| Modal primitives (`Dialog`, `Sheet`) | ✅ EXISTS — `src/components/ui/dialog.tsx`, `sheet.tsx` |
| Form primitives (`Input`, `Select`, `Textarea`, `Switch`) | ✅ EXISTS — `src/components/ui/` |
| Color picker | ❌ NOT FOUND |
| Upload component | ❌ NOT FOUND |

---

## 19. Recommended Future Architecture

### Branding Token Hierarchy (Recommended)

```
Platform Design System (globals.css)
    ↓ fallback
Tenant Branding Tokens (injected via CSS custom properties)
    ↓ applied to
Tenant Portal / Login / Dashboard (approved surfaces only)
```

### Recommended Schema Evolution (NOT to be implemented now)

```sql
-- OPTION A: Extend existing tenantSettings (RECOMMENDED)
-- Add columns to tenant_settings:
--   favicon_url, secondary_color, accent_color,
--   og_image_url, institution_address, phone, email,
--   whatsapp, website_url, social_links (jsonb)

-- OPTION B: Normalize into separate table (NOT recommended yet)
-- tenant_branding (id, tenant_id, ...)
-- Only if tenantSettings exceeds 25+ columns
```

**RECOMMENDATION:** Extend `tenantSettings` with additional branding columns rather than creating a new `tenantBranding` table. The current table has only 15 columns — well within manageable limits. A separate table is unnecessary until the column count justifies normalization (>25 columns) or when portal content management requires its own entity.

### Recommended Conceptual Separation

```
Tenant Identity → tenants table (EXISTING, keep as-is)
    ↓
Tenant Configuration → tenantSettings table (EXISTING, extend for branding)
    ↓
Tenant Portal Content → NEW table or CMS (FUTURE, WP-SAAS-BRAND-003)
    ↓
Hostname / Domain → tenants.slug + tenants.domain (EXISTING)
    ↓
Subscription → NEW table (FUTURE, WP-SAAS-SUB-001)
```

### Feature Flag Recommendation

**Branding should be a CORE PLATFORM CAPABILITY, not an optional module.**

Current feature flags in `src/config/features.ts` control business modules (akademik, keuangan, perpustakaan, etc.). Branding is infrastructure-level configuration, not a toggleable business feature. Every tenant needs a name, logo, and colors to function — therefore branding should NOT be gated by a feature flag.

However, **advanced branding features** (custom color palette, custom typography, custom favicon) could be gated by subscription entitlement in the future.

---

## 20. Recommended Work Package Breakdown

Based on repository evidence, the following work packages are recommended:

### WP-SAAS-BRAND-002 — Core Tenant Branding Configuration
**STATUS: PLANNED**

Scope:
- Functional branding management UI for tenant admin
- Logo upload capability (needs upload component primitive first)
- Color picker for `primaryColor`
- Login branding editor (upgrade existing mock `tampilan-login` page)
- Persist branding via API to `tenantSettings`
- Super Admin branding audit view
- Connect `primaryColor` to login page (currently hardcoded emerald)
- Consume `customBgUrl` or remove dead field
- URL validation for `customLogoUrl` / `customBgUrl`
- Dashboard sidebar tenant branding (logo + name)

### WP-SAAS-BRAND-003 — Tenant Portal Content Management (CMS)
**STATUS: PLANNED**

Scope:
- Replace hardcoded portal content with tenant-specific data
- Institution profile (description, features, stats)
- Programs list (per tenant)
- Achievements (per tenant)
- News/announcements (per tenant)
- Contact information (address, phone, email, WhatsApp, social)
- Requires new database structure (jsonb fields on `tenantSettings` or separate table)

### WP-SAAS-BRAND-004 — Tenant SEO & Social Metadata
**STATUS: PLANNED**

Scope:
- Tenant-aware favicon (dynamic per subdomain)
- OpenGraph image support (`og:image`)
- Canonical URL generation
- Twitter/social card metadata
- Structured data (JSON-LD for educational institution)
- Tenant-aware root layout metadata

---

## 21. Pending Work Register

### COMPLETED

| WP | Title | Status | Commit |
|----|-------|--------|--------|
| WP-SAAS-PORTAL-001 | Tenant Portal Architecture Discovery | ✅ COMPLETED / CERTIFIED | — |
| WP-SAAS-PORTAL-002 | Tenant Public Portal Foundation | ✅ COMPLETED / CERTIFIED | `fbed9fd` |
| WP-SAAS-PORTAL-003 | Tenant Subdomain & Hostname Resolution | ✅ COMPLETED / CERTIFIED | `620395e` |

### CURRENT

| WP | Title | Status |
|----|-------|--------|
| **WP-SAAS-BRAND-001** | **Tenant Branding System Discovery** | **CURRENT — DISCOVERY COMPLETE** |

### FUTURE — BRANDING

| WP | Title | Status |
|----|-------|--------|
| WP-SAAS-BRAND-002 | Tenant Branding Management UI & Configuration | PLANNED / PAUSED — DO NOT IMPLEMENT |
| WP-SAAS-BRAND-003 | Tenant Portal Content Management (CMS) | PLANNED / PAUSED — DO NOT IMPLEMENT |
| WP-SAAS-BRAND-004 | Tenant SEO & Social Metadata | PLANNED / PAUSED — DO NOT IMPLEMENT |

### FUTURE — DOMAIN

| WP | Title | Status | Notes |
|----|-------|--------|-------|
| WP-SAAS-DOMAIN-001 | Custom Domain Request & Availability | PAUSED / FUTURE | Customer price: Rp35.000/month, min 12 months (Rp420.000) |
| WP-SAAS-DOMAIN-002 | Custom Domain Provisioning / DNS / SSL | PAUSED / FUTURE | — |

### FUTURE — SUBSCRIPTION

| WP | Title | Status | Notes |
|----|-------|--------|-------|
| WP-SAAS-SUB-001 | Subscription Package & Entitlement Engine | PAUSED / FUTURE | Packages: Basic, Standard, Professional, Enterprise |

### FUTURE — ADD-ON

| WP | Title | Status | Notes |
|----|-------|--------|-------|
| WP-SAAS-ADDON-001 | Tenant Add-on Override Engine | PAUSED / FUTURE | Base Package + Optional Add-ons principle |

### FUTURE — LIBRARY

| WP | Title | Status | Notes |
|----|-------|--------|-------|
| WP-LIB-001 | Library Master Discovery | ✅ COMPLETED / CERTIFIED | — |
| WP-LIB-001A | Library Feature Flag & Permission Foundation | ✅ COMPLETED / CERTIFIED | Commit: `140567d` |
| WP-LIB-001B+ | Library Business Module | PAUSED | Resume later |

### FUTURE — OTHER

| WP | Title | Status |
|----|-------|--------|
| WP-TASK-001 | Buku Tugas | PLANNED — DO NOT IMPLEMENT |
| WP-OSIM-001 | Qism / OSIM | COMING SOON — DO NOT IMPLEMENT |

---

## 22. Quality Gate Results

Quality gates were not executed in this discovery session as they require running `npx tsc --noEmit`, `npm run test:run`, and `npm run build`. These are read-only verification commands and can be executed on request.

- **TYPESCRIPT:** Not verified (can be run on request)
- **VITEST:** Not verified (can be run on request)
- **PRODUCTION BUILD:** Not verified (can be run on request)

---

## 23. Final Verdict

The existing tenant branding architecture is **sound, canonical, and extensible**. The `tenantSettings` table is the correct and sole source for branding fields. No duplicate branding engines exist. The data flow from `proxy.ts → getTenantContext() → components` is clean and well-structured.

The primary gaps are:
1. **Missing branding fields** (favicon, secondary color, contact info, SEO metadata)
2. **Missing branding management UI** (the `tampilan-login` page is mock-only)
3. **Portal content is hardcoded** (not configurable per tenant)
4. **Dashboard does not consume tenant branding** (sidebar/topbar are platform-hardcoded)
5. **`primaryColor` does not participate in the design token system** (inline styles only)
6. **No database-level RLS** on `tenant_settings` (pre-existing gap, not branding-specific)

All gaps can be addressed by extending the existing architecture — **no new branding engine is required**.

---

## Final Status Block

```
============================================================

WP-SAAS-BRAND-001

TENANT BRANDING SYSTEM

DISCOVERY MODE:         READ-ONLY

STATUS:                 DISCOVERY COMPLETE

CANONICAL TENANT ENGINE:        tenants + tenantSettings + getTenantContext()

CANONICAL TENANT ID:            tenants.id (PK)

CANONICAL BRANDING SOURCE:     tenantSettings (via tenantId FK)

TENANT SETTINGS:                15 columns (7 branding + 4 integration + 4 system)

CORE BRANDING FIELDS:          customLogoUrl, customBgUrl, primaryColor, tagline

PORTAL BRANDING:               loginTitle, loginSubtitle, loginDescription + hardcoded JSX

LOGIN BRANDING:                loginTitle, loginSubtitle, loginDescription, customLogoUrl
                                primaryColor NOT applied (hardcoded emerald)

DASHBOARD BRANDING:            NOT IMPLEMENTED — platform-hardcoded identity

SEO BRANDING:                  PARTIAL — title + description only, no OG image/favicon/canonical

THEME SYSTEM:                  next-themes (light/dark only), NOT tenant-aware
                                primaryColor via inline style, NOT CSS variables

TENANT ISOLATION:              PARTIAL
                                Server-side resolution: PASS
                                Application-level filtering: PASS
                                Database RLS: NOT CONFIGURED (pre-existing gap)

SUBDOMAIN COMPATIBILITY:       PASS

CUSTOM DOMAIN READINESS:       PASS — tenants.domain column exists, branding resolves from tenant.id

SUBSCRIPTION COMPATIBILITY:    PASS — no subscription system exists, branding can be gated later

ADD-ON COMPATIBILITY:           PASS — field-level entitlement gating is architecturally viable

SUPER ADMIN CONTROL:           PARTIAL — can see tenants, CANNOT see/modify branding

TENANT ADMIN CONTROL:          PARTIAL — mock login settings UI exists, no persistence

SECURITY:                      MEDIUM FINDINGS (see Section 16)

DUPLICATE BRANDING ENGINE:     0

DUPLICATE THEME ENGINE:        0

DUPLICATE TENANT SETTINGS ENGINE: 0

DATABASE MODIFIED:             0

MIGRATION CREATED:             0

API MODIFIED:                  0

SOURCE FILES MODIFIED:         0

BUSINESS LOGIC MODIFIED:       0

PACKAGE DEPENDENCIES MODIFIED: 0

TYPESCRIPT:                    NOT VERIFIED

VITEST:                        NOT VERIFIED

PRODUCTION BUILD:              NOT VERIFIED

CRITICAL FINDINGS:             0

HIGH FINDINGS:                 0

MEDIUM FINDINGS:               3 (S-1 arbitrary logo URL, S-2 arbitrary bg URL, S-5 no RLS)

LOW FINDINGS:                  2 (S-3 color validation, S-4 text length validation)

GIT COMMIT:                    0

GIT PUSH:                      0

DISCOVERY VERDICT:             A — Architecture is sound, extensible, no redesign required

RECOMMENDED NEXT WORK PACKAGE: WP-SAAS-BRAND-002 (Core Tenant Branding Configuration)

============================================================
```

**STOP.**

**DO NOT IMPLEMENT WP-SAAS-BRAND-002 OR ANY OTHER WORK PACKAGE.**

**WAIT FOR PRODUCT OWNER REVIEW AND EXPLICIT AUTHORIZATION.**
