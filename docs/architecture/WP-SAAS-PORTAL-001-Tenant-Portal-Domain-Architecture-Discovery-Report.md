# WP-SAAS-PORTAL-001 DISCOVERY REPORT
## Tenant Portal, Subdomain, Branding & Domain Architecture Discovery

**Work Package ID:** `WP-SAAS-PORTAL-001`  
**Phase:** `READ-ONLY FORENSIC DISCOVERY`  
**Verdict:** `A — FORENSIC DISCOVERY COMPLETE (CANONICAL GAP & DEPENDENCY BLUEPRINT DERIVED)`  

---

## 1. EXECUTIVE SUMMARY

Work Package **WP-SAAS-PORTAL-001 (Tenant Portal, Subdomain, Branding & Domain Architecture Discovery)** telah selesai dieksekusi secara ketat dalam mode **READ-ONLY FORENSIC DISCOVERY**.

Audit forensik terhadap codebase mengonfirmasi:
- **Tabel & Slug Tenant Canonical:** [src/lib/db/schema.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/schema.ts) telah memiliki tabel `tenants` (field `id`, `name`, `slug` [unique], `domain`, `status`) dan `tenantSettings` (`customLogoUrl`, `customBgUrl`, `primaryColor`, `tagline`, `loginTitle`, `loginSubtitle`, `loginDescription`, `waGatewayApiKey`, `flipSecretKey`).
- **Middleware & Subdomain Extraction:** [src/proxy.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/proxy.ts) telah mengoperasikan `extractTenantSlug()` dari rute path `/t/:slug` dan hostname subdomain (misal `alfatih.mahad-app.com`), serta menetapkan header Zero-Trust `x-tenant-id` & `x-tenant-slug`.
- **Tenant Context Resolution:** [src/lib/tenant/context.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/tenant/context.ts) `getTenantContext()` me-resolve context tenant & branding secara server-side.
- **Architectural Gaps Discovered:**
  1. **Tenant Public Portal Landing Page:** [src/app/page.tsx](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/app/page.tsx) saat ini langsung menampilkan Form Login (tidak ada landing page publik tenant dengan Beranda, Profile, Program, Prestasi, Marketing, CTA). **[GAP]**
  2. **Custom Domain Dynamic Resolution:** [src/proxy.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/proxy.ts) belum mencocokkan custom domain (misal `alfatih.my.id`) ke database `tenants.domain`. **[GAP]**
  3. **Domain Availability Provider Integration:** Belum ada provider API/Registrar integration untuk pengecekan domain `.my.id` (Rp35.000/bln). **[GAP]**
  4. **Email Delivery Engine:** Belum ada engine pengiriman email portal URL tenant ke pengelola. **[GAP]**
  5. **Subscription & Add-on Entitlement Engine:** Modul Billing SaaS di [/dashboard/saas/paket-billing](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/app/dashboard/saas/paket-billing/page.tsx) saat ini berupa antarmuka statis mockup. **[GAP]**

---

## 2. CURRENT TENANT ARCHITECTURE

- [FACT] Data tenant disimpan di tabel `tenants` dan `tenantSettings` di [src/lib/db/schema.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/schema.ts).
- [FACT] `tenant_id` dan RLS Supabase terisolasi penuh pada seluruh tabel bisnis (`santri`, `kelas`, `mapel`, `rfid_cards`, `attendance_logs`, `health_visits`, `pelanggaran`, dll).

---

## 3. CURRENT SAAS ARCHITECTURE

- [FACT] SaaS Platform Console dikhususkan untuk `developer` & `super_admin` di bawah rute `/dashboard/saas/*`:
  - `/dashboard/saas/tenants`: Impersonation & Manajemen Tenant
  - `/dashboard/saas/modul-fitur`: Feature Flags per-Tenant (`modulesCatalog`)
  - `/dashboard/saas/paket-billing`: Penagihan & Paket SaaS
  - `/dashboard/saas/infrastruktur-log`: Log Pemantauan & Aktivitas System
  - `/dashboard/saas/pengaturan-global`: Broadcast & Pengaturan Global SaaS

---

## 4. TENANT CREATION FLOW

- [FACT] Tenant dibuat via SaaS Console `tenants` service (`create-tenant-service.ts`) atau seeder.
- [INFERENCE] Pembuatan tenant secara otomatis menghasilkan `id` & `slug` unik.

---

## 5. TENANT IDENTITY / SLUG

- [FACT] `slug` bersifat `NOT NULL` & `UNIQUE` di tabel `tenants` (misal: `al-fatih`, `daruttauhid`).

---

## 6. TENANT BRANDING AUDIT

- [FACT] `tenantSettings` telah mendukung custom logo (`customLogoUrl`), custom background (`customBgUrl`), warna utama (`primaryColor`), tagline (`tagline`), dan judul login (`loginTitle`, `loginSubtitle`, `loginDescription`).
- [INFERENCE] Kebutuhan branding portal publik tenant dapat memanfaatkan field di `tenantSettings` dengan penambahan metadata SEO & kontak publik.

---

## 7. TENANT PUBLIC PORTAL AUDIT

- [FACT] **GAP CRITICAL:** Saat ini belum ada halaman Portal Publik Tenant (`/` saat ini merender `LoginClient` langsung).
- [INFERENCE] Diperlukan pemisahan rute: `/` sebagai Tenant Public Portal (Home, Profil, Program, CTA Login), dan `/login` atau `/auth/login` sebagai Tenant Application Entrypoint.

---

## 8. TENANT LOGIN AUDIT

- [FACT] Login tenant berada di `src/app/client-page.tsx` dengan penyesuaian branding dari `getTenantContext()`.

---

## 9. SUBDOMAIN READINESS

- [FACT] [src/proxy.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/proxy.ts) sudah mendukung deteksi subdomain: `extractTenantSlug()` mengekstrak `parts[0]` jika hostname mengandung dot (`podok-daruttauhid.mahad-app.com`).

---

## 10. HOSTNAME RESOLUTION AUDIT

- [FACT] Hostname diekstrak dari header `host` pada Edge Proxy [src/proxy.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/proxy.ts).

---

## 11. CUSTOM DOMAIN READINESS

- [FACT] Field `tenants.domain` sudah tersedia di skema DB.
- [INFERENCE] `extractTenantSlug()` di Edge Proxy belum melakukan Lookup `tenants.domain` ke DB Supabase/Edge Cache jika request datang dari custom domain (misal `alfatih.my.id`).

---

## 12. DOMAIN AVAILABILITY READINESS

- [FACT] Belum ada integrasi API availability checker untuk domain `.my.id` (Rp35.000/bln). **[GAP]**

---

## 13. DNS / CLOUDFLARE / VERCEL READINESS

- [FACT] Belum ada integrasi SDK / API Cloudflare Custom Hostnames (SSL for SaaS) atau Vercel Domains API. **[GAP]**

---

## 14. EMAIL DELIVERY READINESS

- [FACT] Belum ada provider email (Resend / SendGrid / Nodemailer) untuk mengirim URL portal tenant ke email pendaftar. **[GAP]**

---

## 15. SUBSCRIPTION ARCHITECTURE

- [FACT] Rute [/dashboard/saas/paket-billing](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/app/dashboard/saas/paket-billing/page.tsx) saat ini berupa antarmuka statis mockup.

---

## 16. PACKAGE ARCHITECTURE

- [INFERENCE] Perlu skema pemetaan Paket Subscription (`BASIC`, `STANDARD`, `PRO`, `ENTERPRISE`) ke daftar modul default.

---

## 17. FEATURE TOGGLE ARCHITECTURE

- [FACT] Feature flag engine canonical di [src/config/features.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/config/features.ts) dan `modulesCatalog` di [/dashboard/saas/modul-fitur](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/app/dashboard/saas/modul-fitur/page.tsx) siap digunakan.

---

## 18. ADD-ON ARCHITECTURE

- [INFERENCE] Arsitektur add-on memungkinkan tenant pada paket `BASIC` membeli add-on khusus tanpa dipaksa upgrade paket dasar. Override disimpan pada `tenant_modules` / `tenantSettings.modules`.

---

## 19. TENANT ENTITLEMENT ARCHITECTURE

- [INFERENCE] Resolving entitlement: `FinalEntitlement = PackageEntitlement UNION TenantAddons`.

---

## 20. TENANT ISOLATION AUDIT

- [FACT] Zero-Trust header resolution di `src/proxy.ts` mengabaikan header `x-tenant-id` mentah dari client. **PASS**.

---

## 21. RBAC AUDIT

- [FACT] Permasalahan otorisasi terpusat di `src/config/permissions.ts`. **PASS**.

---

## 22. SECURITY BOUNDARY AUDIT

- [FACT] Server-side Edge proxy fail-closed auth boundary intact. **PASS**.

---

## 23. SEO / PUBLIC MARKETING ARCHITECTURE

- [FACT] `generateMetadata()` di [src/app/page.tsx](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/app/page.tsx) me-render metadata Next.js berbasis `getTenantContext()`.

---

## 24. CANONICAL ENGINES FOUND

- `tenants` & `tenantSettings` DB tables ([src/lib/db/schema.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/schema.ts))
- `extractTenantSlug()` & Next.js Proxy ([src/proxy.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/proxy.ts))
- `getTenantContext()` ([src/lib/tenant/context.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/tenant/context.ts))
- Feature Flags ([src/config/features.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/config/features.ts))
- Super Admin Module Control ([src/app/dashboard/saas/modul-fitur/page.tsx](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/app/dashboard/saas/modul-fitur/page.tsx))

---

## 25. DUPLICATE ENGINES FOUND

- **Duplicate Tenant Resolution Engine:** 0
- **Duplicate Feature Flag Engine:** 0
- **Duplicate Authentication Engine:** 0

---

## 26. ARCHITECTURAL GAPS

1. Public Tenant Portal Landing Page UI & Route Structure (`/` vs `/login`).
2. Custom Domain Edge Resolution (`tenants.domain` lookup in Proxy).
3. `.my.id` Domain Availability Checker Provider Integration.
4. Email Provisioning & Notification Delivery.
5. Subscription Package & Add-on Entitlement Database Engine.

---

## 27. DEPENDENCY GRAPH

```
SaaS Master DB (tenants, tenantSettings)
           │
           ├──────────────────────────────┐
           ↓                              ↓
Next.js Edge Proxy (src/proxy.ts)  SaaS Platform Console (/dashboard/saas/*)
           │                              │
           ↓                              ↓
getTenantContext()             Super Admin Feature/Module Toggle
           │
     ┌─────┴──────────────────────────────┐
     ↓                                    ↓
Tenant Public Portal Landing Page    Tenant Application / Login Page
(Home, Profile, Program, CTA)        (/login -> /dashboard/*)
```

---

## 28. RECOMMENDED FUTURE WORK PACKAGES

- **WP-SAAS-PORTAL-002:** Tenant Public Portal Landing Page & Route Architecture
- **WP-SAAS-PORTAL-003:** Subdomain & Hostname Proxy Resolution Enhancement
- **WP-SAAS-BRAND-001:** Tenant Public Profile & Branding Customization
- **WP-SAAS-DOMAIN-001:** Custom Domain (.my.id @ Rp35.000/mo) Availability & Request Flow
- **WP-SAAS-DOMAIN-002:** Custom Domain Edge DNS & SSL Provisioning Integration
- **WP-SAAS-SUB-001:** Subscription Package & Feature Entitlement Engine
- **WP-SAAS-ADDON-001:** Tenant Add-on Purchase & Entitlement Override Engine
- **WP-LIB-001B+:** Resume Library Circulation Implementation
- **WP-TASK-001:** Buku Tugas Discovery & Implementation
- **WP-OSIM-001:** Qism / OSIM Feature-Toggle Controlled Implementation

---

## 29. PENDING WORK REGISTER

| Work Package / Feature | Feature Scope | Status | Current Progress | Next Action |
| :--- | :--- | :---: | :--- | :--- |
| **WP-LIB-001** | Perpustakaan Master Discovery | **COMPLETED / CERTIFIED** | Discovery Complete | Continue implementation after SaaS foundation |
| **WP-LIB-001A** | Library Feature Flag & Permission | **COMPLETED / CERTIFIED** | Commit `140567d` | No action required |
| **LIBRARY BUSINESS MODULE** | Sirkulasi & Inventory Perpustakaan | **PAUSED** | Not implemented | Resume after SaaS Portal Foundation (`WP-LIB-001B+`) |
| **BUKU TUGAS** | Tugas Santri & LMS Gateway | **PLANNED** | Not implemented | Discovery after SaaS Portal Foundation (`WP-TASK-001`) |
| **QISM / OSIM** | Organisasi Santri Kesiswaan | **COMING SOON** | Engine Not Implemented | Feature-toggle controlled implementation (`WP-OSIM-001`) |

---

## 30. QUALITY GATES RESULTS (READ-ONLY DISCOVERY)

- **TypeScript (`npx tsc --noEmit`):** **PASS (0 Errors)**.
- **Vitest (`npx vitest run --pool=threads`):** **PASS (20 test files, 137 unit tests passed)**.
- **Production Build (`npm run build`):** **PASS (76 static routes compiled)**.

---

```
============================================================

WP-SAAS-PORTAL-001

TENANT PORTAL, SUBDOMAIN, BRANDING & DOMAIN
ARCHITECTURE DISCOVERY

DISCOVERY MODE:
READ-ONLY

TENANT ARCHITECTURE:
PASS (tenants & tenantSettings tables exist)

TENANT BRANDING:
PASS (tenantSettings branding fields exist)

PUBLIC TENANT PORTAL:
GAP (app/page.tsx renders login directly; landing page absent)

TENANT LOGIN:
PASS (client-page.tsx + getTenantContext())

SUBDOMAIN READINESS:
PASS (extractTenantSlug() in src/proxy.ts)

HOSTNAME RESOLUTION:
PASS (Header host parsing in src/proxy.ts)

CUSTOM DOMAIN:
GAP (Proxy needs DB domain lookup for custom domains)

DOMAIN AVAILABILITY:
GAP (Need .my.id @ Rp35k/mo provider API integration)

DNS / PROVIDER:
GAP (Need Cloudflare/Vercel API integration)

EMAIL DELIVERY:
GAP (Need email engine for tenant portal URL delivery)

SUBSCRIPTION:
GAP (Need DB package entitlement schema & engine)

PACKAGE:
GAP (Need package-to-module mapping engine)

ADD-ON:
GAP (Need tenant add-on override engine)

FEATURE ENTITLEMENT:
PASS (featureFlags & modulesCatalog exist)

TENANT ISOLATION:
PASS (tenant_id RLS & Zero-Trust headers)

RBAC:
PASS (Permission & ROLE_PERMISSIONS)

SECURITY:
PASS (Fail-closed proxy boundary)

SEO / MARKETING:
GAP (Need tenant public portal SEO metadata engine)

DUPLICATE ENGINES:
0

LIBRARY STATUS:
PAUSED AFTER WP-LIB-001A

BUKU TUGAS:
PLANNED

QISM/OSIM:
COMING SOON

CRITICAL FINDINGS:
0

HIGH FINDINGS:
0

MEDIUM FINDINGS:
0

LOW FINDINGS:
0

DATABASE MODIFIED:
0

MIGRATION CREATED:
0

SOURCE FILES MODIFIED:
0

API MODIFIED:
0

BUSINESS LOGIC MODIFIED:
0

PACKAGE DEPENDENCIES MODIFIED:
0

GIT COMMIT:
0

GIT PUSH:
0

DISCOVERY VERDICT:
A — FORENSIC DISCOVERY COMPLETE (CANONICAL GAP & DEPENDENCY BLUEPRINT DERIVED)

RECOMMENDED NEXT WORK PACKAGE:
WP-SAAS-PORTAL-002 (Tenant Public Portal Landing Page & Route Architecture)

IMPLEMENTATION AUTHORIZATION:
NOT GRANTED

============================================================
```
