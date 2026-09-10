# WP-SAAS-LANDING-001 — SaaS Landing Page Architecture & Product Positioning Specification

## 1. Executive Summary

- **Work Package:** `WP-SAAS-LANDING-001`
- **Branch:** `preview`
- **Mode:** READ-ONLY PLANNING / ARCHITECTURE / PRODUCT SPECIFICATION
- **Purpose:** Establish the authoritative architectural boundary, product positioning, and information architecture for the **Ma'had Manager SaaS Product Landing Page**, resolving the current architectural ambiguity where the root URL (`/`) presents a single-tenant public portal identity instead of a multi-tenant technology platform identity.

---

## 2. Current Root Behavior Analysis

Forensic discovery of `src/app/page.tsx`, `src/proxy.ts`, `src/lib/tenant/context.ts`, and `src/components/portal/` yields the following baseline findings:

| Question | Empirical Finding from Source Code |
| :--- | :--- |
| **1. Hostname = SaaS/Platform (`localhost`, `www`, `app`, `madev`)** | `src/proxy.ts` resolves `tenantSlug = 'default'`. `getTenantContext()` returns `DEFAULT_TENANT` (`name: "Ma'had Management Platform"`, `tagline: "Sistem Informasi Pesantren Terpadu"`). `src/app/page.tsx` renders `<TenantPortalClient tenant={tenant} />`. <br>**Result:** Renders the *Tenant Public Website component* populated with generic fallback data, giving the impression of a single pesantren website rather than a SaaS technology platform. |
| **2. Hostname = Tenant Subdomain (`[slug].domain.com` or `/t/:slug`)** | `src/proxy.ts` extracts `tenantSlug`. `getTenantContext()` queries `tenants` and `tenant_settings` tables in PostgreSQL. `src/app/page.tsx` renders `<TenantPortalClient tenant={tenant} />` with the tenant's specific branding, logo, colors, tagline, profile, programs, achievements, and news. |
| **3. Unknown Subdomain** | `getTenantContext()` fails to find the tenant record in database (`if (!tenantDoc) return DEFAULT_TENANT;`) and falls back to `DEFAULT_TENANT`, rendering `TenantPortalClient` with fallback values. |
| **4. Current Root `/` Classification** | Currently hard-wired to `TenantPublicPortalPage` rendering `TenantPortalClient`. It functions as a **Tenant Public Portal**, acting as a generic fallback tenant website when accessed from the SaaS platform root. |
| **5. Data Source for Root Page** | `getTenantContext()` in `src/lib/tenant/context.ts`, which reads the `x-tenant-slug` header (injected by `src/proxy.ts`), queries `tenants` and `tenant_settings` via Drizzle ORM, or defaults to `DEFAULT_TENANT`. |
| **6. Tenant-Aware Status** | **Yes**, `src/app/page.tsx` executes `await getTenantContext()` and passes context downstream. |
| **7. Hardcoded Elements** | Hardcoded default fallback strings exist in `DEFAULT_TENANT` (`src/lib/tenant/context.ts`) and metadata fallbacks (`title = tenant.name \|\| 'Ponpes Daruttahuid'`). |
| **8. Uses Tenant Branding** | **Yes**, when a valid tenant slug is detected. On root without slug, it uses `DEFAULT_TENANT.settings`. |
| **9. Separate Tenant Public Portal Components** | **Yes**, fully modularized in `src/components/portal/` (`TenantPortalHeader`, `TenantPortalHero`, `TenantPortalProfile`, `TenantPortalPrograms`, `TenantPortalAchievements`, `TenantPortalInfoNews`, `TenantPortalContactFooter`). |
| **10. Routing Architecture Capability** | `src/proxy.ts` already distinguishes `'default'` vs actual tenant slug. However, `src/app/page.tsx` lacks branching logic — it renders `TenantPortalClient` unconditionally regardless of whether `tenant.slug === 'default'` or a real tenant slug. |

---

## 3. Current Architecture Evidence

```
                          [ INCOMING REQUEST ]
                                    │
                                    ▼
                         src/proxy.ts (Proxy)
            Extracts tenantSlug via extractTenantSlug(request)
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
        tenantSlug === 'default'           tenantSlug === 'al-fatih'
     (SaaS Root / Reserved Host)              (Tenant Subdomain)
                  │                                   │
                  ▼                                   ▼
        getTenantContext()                  getTenantContext()
      Returns DEFAULT_TENANT                Queries DB (tenants + tenant_settings)
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    │
                                    ▼
                             src/app/page.tsx
                    Unconditional Render:
                  <TenantPortalClient tenant={tenant} />
                                    │
                                    ▼
         [ CURRENT PROBLEM: Renders Tenant Public Website for BOTH ]
```

---

## 4. SaaS vs Tenant Boundary Specification

To preserve enterprise multi-tenant integrity, the platform must enforce a strict separation between **Platform Identity** and **Tenant Identity**:

```
                              SERZEN DEV
                                  │
                          MA'HAD MANAGER
                   (SaaS Technology Platform)
                                  │
            ┌─────────────────────┴─────────────────────┐
            ▼                                           ▼
   SaaS Platform Hostname                      Tenant Subdomains
   (mahadmanager.com)                          (*.mahadmanager.com)
            │                                           │
            ▼                                           ▼
  SaaS Product Landing Page                   Tenant Public Website
  - Product Positioning                       - Institution Profile
  - Feature & Module Overview                 - Academic Programs
  - Subscription Tiers                        - Achievements & News
  - Customer Registration CTA                 - Contact & Location
  - Login to SaaS Admin                       - Tenant Portal Login CTA
```

---

## 5. Product Positioning Statement

### Canonical Positioning:
> **Ma'had Manager** adalah **Platform SaaS Manajemen Pesantren Terpadu** yang mengintegrasikan tata kelola santri, akademik formal & diniyah, kesehatan (UKS), ketertiban (E-Tatib), keuangan & SPP otomatis, hingga website publik lembaga dalam satu ekosistem cloud modern yang aman dan terisolasi.

### Key Differentiators (Supported by Repository Capabilities):
1. **Ekosistem Terintegrasi Tunggal:** Mengabaikan sistem terpisah (spreadsheet, aplikasi kasir terpisah, pencatatan manual) demi satu sumber data terpusat (*single source of truth*).
2. **Isolasi Tenant Skala Enterprise:** Setiap pesantren memiliki lingkungan terisolasi dengan skema keamanan Supabase Row-Level Security (RLS) & context-derived transaction boundaries.
3. **Dual Digital Presence:** Setiap pesantren secara otomatis memperoleh **SaaS Management Dashboard** (internal) sekaligus **Website Publik Lembaga** (external) ber-branding sendiri.
4. **Otomatisasi Keuangan & SPP:** Terintegrasi langsung dengan Payment Gateway (Flip for Business) dan E-Wallet Kantin Santri (KTA RFID).

---

## 6. Target Audience Analysis

| Persona / Target Role | Key Pain Points | Platform Solution (Empirically Proven) | Primary CTA |
| :--- | :--- | :--- | :--- |
| **Pimpinan Pesantren / Kyai / Yayasan** | Diffuse reporting, lack of real-time operational visibility, fragmented software systems. | Executive Dashboard with aggregate statistics on santri, financial status, health visits, and governance. | **Mulai Konsultasi / Demo** |
| **Pengelola / Admin Pesantren** | Manual data entry, repetitive administrative burden, complex registration & billing tracking. | Unified Management Portal, automated tenant transaction isolation, and user role management. | **Daftar Pesantren Baru** |
| **Tim Akademik & Pengajar (Guru/Musyrif)** | Double entry for formal & diniyah grades, manual report card (E-Rapor) calculation. | Master Jenjang, Tingkat, Kelas, Mapel, Teacher Assignment, & E-Rapor generator. | **Lihat Modul Akademik** |
| **Tim Kesiswaan & Pengasuhan** | Unrecorded discipline violations, subjective punishment enforcement, manual exit permits. | E-Tatib with Tolerance Policy rules, Governance Case tracking, & Health Permission approval workflow. | **Lihat Modul Kesiswaan** |
| **Pengelola Keuangan & Kantin** | Cash handling risks, unverified SPP transfers, manual canteen receipts. | Auto SPP billing via Payment Gateway (Flip) & Cashless Kantin POS with RFID KTA cards. | **Lihat Modul Keuangan** |

---

## 7. Landing Page Information Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ NAVIGATION BAR: Logo | Fitur | Modul | Keunggulan | Paket | FAQ | Login│
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 01: HERO (Value Prop + Dual CTA + Platform Mockup Preview)     │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 02: PROBLEM (Fragmented Data, Manual SPP, Unrecorded Health)   │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 03: SOLUTION (Unified Cloud Ecosystem + Single Source of Truth) │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 04: PLATFORM MODULES (Interactive Category Tabs)               │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 05: DUAL DIGITAL PRESENCE (Dashboard + Public Tenant Website)  │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 06: WHY MA'HAD MANAGER (Architecture & Enterprise Features)    │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 07: HOW IT WORKS (5-Step Onboarding Journey)                   │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 08: SUBSCRIPTION PACKAGES (Starter, Pro, Enterprise Tiers)     │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 09: TRUST, SECURITY & ARCHITECTURE (RLS, Multi-Tenant Cloud)   │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 10: FREQUENTLY ASKED QUESTIONS (Accordion)                   │
├────────────────────────────────────────────────────────────────────────┤
│ SECTION 11: FINAL CTA BANNER (Transformation Prompt)                   │
├────────────────────────────────────────────────────────────────────────┤
│ FOOTER: Product | Company | Resources | Legal | System Status           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Section-by-Section Content Strategy

### Section 01 — Hero
- **Badge:** `✦ Platform SaaS Manajemen Pesantren Skala Enterprise`
- **Heading:** "Kelola Pesantren Lebih Modern, Terstruktur, dan Terintegrasi dalam Satu Platform Cloud"
- **Subheading:** "Ma'had Manager menyatukan data kesantrian, akademik formal & diniyah, keuangan SPP otomatis, kedisiplinan santri, hingga website publik lembaga tanpa kerumitan infrastruktur teknis."
- **Primary CTA:** `[Mulai Sekarang]` (Scroll to Pricing / Open Trial Form)
- **Secondary CTA:** `[Pelajari Modul Fitur]` (Scroll to Section 04)
- **Visual:** Interactive preview mockup showing Admin Dashboard alongside a Tenant Public Website.

### Section 02 — Problem Statement
- **Title:** "Tantangan Utama Pengelolaan Pesantren Modern"
- **Grid Items:**
  1. *Data Santri Tersebar:* File Excel terpisah antar pengasuhan, akademik, dan bendahara.
  2. *Rekap SPP & Pembayaran Manual:* Konfirmasi transfer manual via WhatsApp memicu ketidakcocokan saldo.
  3. *Kedisiplinan & Perizinan Tidak Terdeteksi:* Catatan pelanggaran dan surat izin keluar mudah hilang.
  4. *Website Lembaga Formalitas:* Website pesantren tidak terhubung dengan sistem informasi internal.

### Section 03 — The Integrated Solution
- **Title:** "Satu Ekosistem Terpadu untuk Seluruh Kebutuhan Pesantren"
- **Content:** Demonstrates how Ma'had Manager connects every stakeholder (Pimpinan, Admin, Guru, Wali Santri, Santri) through a single database core.

### Section 04 — Platform Modules (Proven Codebase Feature Matrix)
*(Detailed in Section 9 Matrix below)*

### Section 05 — Dual Digital Presence (Value Highlight)
- **Concept:** "Dapatkan Lebih dari Sekadar Aplikasi Internal"
- **Feature:** Explains that every onboarded tenant automatically receives:
  1. **Private Management Portal:** Secure dashboard for internal operations (`/dashboard/*`).
  2. **Public Tenant Website:** Beautiful public-facing portal for prospective parents and public information (`[slug].mahadmanager.com`).

### Section 06 — Why Ma'had Manager
- **Highlights:** Multi-Tenant Isolation, Configurable Academic Structure, Role-Based Access Control (RBAC), Payment Gateway Webhooks, RFID Hardware Readiness.

### Section 07 — How It Works
1. *Daftar Pesantren:* Isikan profil dasar lembaga dan pilih subdomain.
2. *Pilih Paket:* Tentukan skala kapasitas santri (Starter, Pro, Enterprise).
3. *Konfigurasi Struktur:* Atur Jenjang, Tingkat, Asrama, dan Akses User/Guru.
4. *Impor Data Santri:* Masukkan data santri & wali secara kolektif via Excel.
5. *Go Live:* Platform dan Website Publik Pesantren langsung siap digunaan.

### Section 08 — Subscription Packages
*(Detailed in Section 11 Strategy below)*

### Section 09 — Trust, Security & Architecture
- **Messaging:** Server-Derived Tenant Boundaries, Supabase Row-Level Security (RLS), Audit Trail Logging, Real-Time Outbox Events.

### Section 10 — FAQ
*(Detailed in Section 14 Strategy below)*

---

## 9. Feature/Module Matrix

| Domain Category | Module Name | Core Capabilities | Availability Status |
| :--- | :--- | :--- | :--- |
| **Kesantrian & Asrama** | Core Operational | Data santri, wali santri, kamar asrama, status aktif/cuti/skors/lulus/keluar. | `AVAILABLE` |
| **Akademik & E-Rapor** | Core Academic | Master Jenjang, Tingkat, Kelas, Mapel, Teacher Assignments, & E-Rapor. | `AVAILABLE` |
| **Keuangan & SPP** | Finance Gateway | Tagihan SPP, Payment Gateway Webhook (Flip for Business), & Rekapitulasi. | `AVAILABLE` |
| **E-Tatib & Disiplin** | Governance | Master Pelanggaran, Hukuman, Tolerance Policy, & Governance Case Tracking. | `AVAILABLE` |
| **Kesehatan & Medis** | Health & Care | Health Visits (UKS), Health Permissions (Izin Berobat), & Rekam Medis. | `AVAILABLE` |
| **IoT & Kantin Cashless** | Hardware / IoT | Presensi KTA RFID, Gate Checkpoint, POS Kantin Digital, & Limit Saldo. | `AVAILABLE` |
| **Website Publik Tenant** | Tenant Presence | Custom Logo, Primary Color, Custom Tagline, News, Achievements, & Profile. | `AVAILABLE` |
| **Audit & Governance** | Security / Audit | Audit Logs untuk setiap tindakan create/update/delete/approve/reject. | `AVAILABLE` |
| **Tahfidz & Ziyadah** | Special Feature | Monitoring hafalan Quran, ziyadah, murojaah, & setoran harian. | `ROADMAP` (Beta) |
| **Perpustakaan RFID** | Academic & Care | Katalog buku, sirkulasi peminjaman/pengembalian RFID. | `ROADMAP` (Planned) |
| **Self-Registration** | Onboarding Flow | Form pendaftaran mandiri calon tenant secara publik di landing page. | `ROADMAP` (Planned) |

---

## 10. Available vs Roadmap Classification

```
┌──────────────────────────────────────────────────────────────────────────┐
│                       AVAILABLE IN REPOSITORY                             │
├──────────────────────────────────────────────────────────────────────────┤
│ ✓ Multi-Tenant Context Engine (src/lib/tenant/context.ts)                 │
│ ✓ Supabase RLS & Server-Derived Tenant Headers (src/proxy.ts)           │
│ ✓ Core Santri, Asrama, & Wali Management (src/lib/db/services/santri.ts) │
│ ✓ Academic Workspace & Ledger (src/lib/db/services/academic-*.ts)       │
│ ✓ Governance, E-Tatib, & Tolerance Policies (tolerancePolicy.ts)         │
│ ✓ Health Visits & Permission Workflow (healthVisit.ts, healthPermission.ts)│
│ ✓ Payment Gateway Webhooks for Flip (src/app/api/webhooks/flip/route.ts)  │
│ ✓ RFID Gate & Kantin POS Services (src/app/api/gate/*, /api/canteen/*)   │
│ ✓ Tenant Public Portal Components (src/components/portal/*)              │
│ ✓ Audit Trail Logging System (src/lib/db/services/auditLog.ts)          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          ROADMAP / PLANNED                               │
├──────────────────────────────────────────────────────────────────────────┤
│ ⏳ Public Self-Service Tenant Registration Form                          │
│ ⏳ Automated CNAME Custom Domain DNS Provisioning                         │
│ ⏳ Modul Tahfidz & Ziyadah Quran (Catalog Beta)                           │
│ ⏳ Modul Perpustakaan & Sirkulasi Buku RFID                               │
│ ⏳ Automated Monthly Invoice Generation Cron Engine                      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Package & Add-on Strategy

Based on empirical implementation in `src/app/dashboard/saas/paket-billing/page.tsx` and `src/app/dashboard/saas/modul-fitur/page.tsx`:

### Subscription Tiers:

| Plan Name | Indicative Price | Max Santri Capacity | Included Features | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Starter Plan** | Rp 1.000.000 / bln | Max 100 Santri | Modul Kesantrian & Asrama, Modul Akademik Formal, Website Publik Tenant. | `PO DECISION REQUIRED` (Pricing Approval) |
| **Pro Plan** *(Popular)* | Rp 2.000.000 / bln | Max 500 Santri | Semua Modul Starter, Payment Gateway Auto SPP (Flip), WA Gateway Notification. | `PO DECISION REQUIRED` (Pricing Approval) |
| **Enterprise Plan** | Rp 3.500.000 / bln | Unlimited Santri | Semua Modul Pro, Modul POS Kantin RFID, Absensi RFID & Gate Checkpoint, Dedicated Support. | `PO DECISION REQUIRED` (Pricing Approval) |

---

## 12. CTA Strategy

| Location | Primary CTA Text | Action / Target | Audience |
| :--- | :--- | :--- | :--- |
| **Header Right** | `[Masuk Portal]` | `/login` | Existing Users / Santri / Guru |
| **Hero Section** | `[Mulai Sekarang]` | Scroll to Pricing / Open Registration Form | Prospective Tenant Admins |
| **Hero Secondary** | `[Pelajari Modul]` | Scroll to Modules Section | Prospective Buyers |
| **Module Section** | `[Konsultasi Kebutuhan]` | Open Contact Modal / WhatsApp Sales | Pimpinan Pesantren |
| **Pricing Section** | `[Pilih Paket]` | Initiate Tenant Sign-Up Flow | Admin / Decision Maker |
| **Footer CTA Banner** | `[Transformasi Pesantren Anda]` | Scroll to Registration | All Visitors |

---

## 13. Trust, Security & Architecture Messaging

- **Zero Data Leakage:** "Arsitektur multi-tenant hardened dengan Supabase Row-Level Security (RLS) menjamin data antar-pesantren terpisah secara mutlak."
- **Server-Derived Context:** "Konteks tenant diproses secara ketat di sisi server (Server-Derived Tenant Boundaries) tanpa bergantung pada header mentah dari client."
- **Audit Trail Complete:** "Setiap tindakan perubahan data penting (create, update, delete, approve, reject) dicatat secara permanen dalam sistem Audit Trail."
- **High Availability Cloud:** "Terbangun di atas infrastruktur cloud modern berbasis Next.js App Router & PostgreSQL."

---

## 14. FAQ Strategy

| Question | Answer Strategy | Status |
| :--- | :--- | :--- |
| **Apa itu Ma'had Manager?** | Platform SaaS manajemen pesantren terpadu yang mengelola kesantrian, akademik, keuangan, dan website publik dalam satu sistem. | `AVAILABLE` |
| **Apakah data pesantren kami aman dan terpisah dari pesantren lain?** | Ya, sistem menggunakan arsitektur multi-tenant dengan isolasi data ketat berbasis Row-Level Security (RLS). | `AVAILABLE` |
| **Apakah pesantren mendapatkan website publik sendiri?** | Ya, setiap pesantren secara otomatis mendapatkan website publik dengan branding, logo, dan warna utama sendiri. | `AVAILABLE` |
| **Bagaimana pembayaran SPP santri diproses?** | Terintegrasi otomatis dengan Payment Gateway (Flip for Business) melalui transfer bank & e-wallet dengan notifikasi otomatis. | `AVAILABLE` |
| **Berapa biaya langganan Ma'had Manager?** | Tersedia dalam paket Starter, Pro, dan Enterprise sesuai skala jumlah santri. Hubungi tim kami untuk konsultasi penawaran. | `PO DECISION REQUIRED` |

---

## 15. Footer Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│ MA'HAD MANAGER                                                         │
│ Platform SaaS Manajemen Pesantren Terpadu & Ekosistem Digital Cloud.   │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ PRODUK            │ PERUSAHAAN        │ SUMBER DOKUMEN                 │
│ • Fitur Kesantrian│ • Tentang Kami    │ • Dokumentasi API (Planned)    │
│ • Akademik & Rapor│ • Kontak & Demo   │ • FAQ                          │
│ • Auto SPP (Flip) │ • Kebijakan SaaS  │ • Panduan Pengguna             │
│ • POS Kantin RFID │ • Status Sistem   │ • Syarat & Ketentuan           │
├───────────────────┴───────────────────┴────────────────────────────────┤
│ © 2026 Ma'had Manager by Serzen Dev. All rights reserved.              │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 16. Visual & UX Direction

- **Tone & Aesthetic:** Modern, clean, trustworthy, SaaS technology aesthetic. Deep slate/stone dark theme with emerald green accents (`#0F766E`).
- **Typography:** Professional sans-serif typography (`Inter` / `Outfit` / `Plus Jakarta Sans`).
- **Forbidden Elements:**
  - Avoid presenting hardcoded single-pondok credentials on the root SaaS landing page.
  - Avoid cluttered dashboard overloads in the hero section.
  - Avoid unverified absolute claims like "100% tanpa celah".

---

## 17. SaaS vs Tenant Routing Specification & Matrix

| Hostname / Route Context | Resolved `tenantSlug` | Expected Page Component | Branding & Content Source |
| :--- | :--- | :--- | :--- |
| `mahadmanager.com/` | `'default'` | **`<SaasLandingPage />`** *(NEW)* | Ma'had Manager SaaS Brand |
| `[slug].mahadmanager.com/` | `'[slug]'` | **`<TenantPortalClient />`** | Tenant Custom Branding (`tenantSettings`) |
| `/t/[slug]` | `'[slug]'` | **`<TenantPortalClient />`** | Tenant Custom Branding (`tenantSettings`) |
| `[slug].mahadmanager.com/login` | `'[slug]'` | **`<LoginPage />`** | Tenant Customized Login Banner |
| `[slug].mahadmanager.com/dashboard/*` | `'[slug]'` | **`<DashboardLayout />`** | Internal Tenant App (Authenticated) |
| Unknown Subdomain | `'default'` | Fail-closed / Platform Fallback | SaaS Default Context |

---

## 18. Current vs Desired Gap Analysis

```
CURRENT BEHAVIOR (src/app/page.tsx):
   Root '/'  ──────►  TenantPortalClient (Tenant Public Website)
                       (Renders generic fallback data on SaaS root)

DESIRED TARGET ARCHITECTURE:
   Root '/'  ───┐
                ├─ IF tenant.slug === 'default'  ──►  SaasLandingPage (SaaS Product Web)
                │
                └─ IF tenant.slug !== 'default'  ──►  TenantPortalClient (Tenant Website)
```

---

## 19. Product Owner Decisions Required

1. **Production Subscription Pricing Approval:** Confirm whether Starter (Rp 1M), Pro (Rp 2M), and Enterprise (Rp 3.5M) prices are official for public display or require adjustment.
2. **Self-Registration Policy:** Authorize whether prospective tenants can self-register via landing page form or if onboarding must remain sales-assisted.
3. **Official SaaS Domain:** Confirm the official production root domain (`mahadmanager.com` vs `madev.id`).

---

## 20. Implementation Recommendations (For Future Implementation Package)

1. Create a dedicated client component `src/components/landing/SaasLandingPage.tsx`.
2. Update `src/app/page.tsx` with clean architectural branching:
   ```tsx
   export default async function RootPage() {
     const tenant = await getTenantContext();
     if (!tenant.slug || tenant.slug === 'default') {
       return <SaasLandingPage />;
     }
     return <TenantPortalClient tenant={tenant} />;
   }
   ```
3. Preserve all existing `TenantPortalClient` components unchanged for tenant subdomains.

---

## 21. Explicit Out-of-Scope Items

- Modifying `src/app/page.tsx` or any `.ts`/`.tsx` file in this work package.
- Creating UI components or styling in this work package.
- Creating Git commits or executing Git push commands.
- Modifying database schemas or environment variables.
