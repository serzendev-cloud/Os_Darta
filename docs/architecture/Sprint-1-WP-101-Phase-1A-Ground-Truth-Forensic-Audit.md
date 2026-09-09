# EEOS Sprint 1 — WP-101 Phase 1A Implementation Preflight Ground-Truth Forensic Audit
**APP MA'HAD ENTERPRISE SaaS ERP — Chief Engineering Reviewer & Forensic Auditor Report**

---

> [!IMPORTANT]
> **GOVERNANCE DIRECTIVE**: Dokumen ini merupakan **IMPLEMENTATION PREFLIGHT FORENSIC AUDIT ONLY**. Tidak ada kode *runtime*, skema database, migrasi, API endpoint, atau komponen UI yang diubah, dihapus, atau dibuat pada Phase 1A. Seluruh aktivitas coding tetap ditahan (**HARD STOP**) hingga Chief Engineering / Product Owner memberikan persetujuan formal atas peta jalan Phase 1B.

---

## 1. Executive Summary & Forensic Mandate

Dalam **Sprint 1 — WP-101 Phase 1A**, Chief Engineering Reviewer & Repository Forensic Auditor melakukan verifikasi fakta empiris (*Ground-Truth Audit*) terhadap seluruh klaim arsitektur yang dibuat pada Phase 0 s/d Phase 0.3 dibandingkan dengan bukti nyata repositori (`src/`, `package.json`, `tools/`, Git Log history).

### Prinsip Utama Verifikasi:
- **Bukti Repositori Mengalahkan Klaim**: Laporan terdahulu yang menyebut *"CONFIRMED"*, *"VERIFIED"*, atau *"READY"* diuji ulang secara ketat terhadap fisik berkas dan *runtime capability*.
- **Historical Crash Tracing**: Ditemukan bukti historis ([HOTFIX-001-Implementation-Report.md](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/engineering/sprint-0/HOTFIX-001-Implementation-Report.md) & Commit `220da5a`) bahwa membuat `src/middleware.ts` ketika `src/proxy.ts` aktif menyebabkan kegagalan build Next.js 16 (*multiple request entry points conflict*).
- **Hasil Kesiapan Final**: **`READY WITH CONDITIONS`**. Eksekusi `WP-101` diizinkan masuk ke Phase 1B dengan syarat wajib mematuhi aturan batas *single entry point* Next.js 16 di `src/proxy.ts`.

---

## 2. Repository Identity & Environment Baseline

| Parameter Identity | Evidence Aktual Repositori | Status Verifikasi |
|---|---|---|
| **Repository Root** | `d:\bikin app\APP MA'HAD\mahad-app` | **CONFIRMED** |
| **Active Branch** | `preview` (Up to date dengan `origin/preview`) | **CONFIRMED** |
| **Git Working Tree** | Clean runtime code (10 file dokumentasi arsitektur *.md untracked) | **CONFIRMED** |
| **Next.js Version** | `16.2.6` ([package.json:30](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/package.json#L30)) | **CONFIRMED** |
| **React Version** | `19.2.4` ([package.json:34](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/package.json#L34)) | **CONFIRMED** |
| **TypeScript Version** | `^5` ([package.json:60](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/package.json#L60)) | **CONFIRMED** |
| **Active ORM** | `drizzle-orm` ^0.45.2 & `drizzle-kit` ^0.31.10 | **CONFIRMED (Canonical)** |
| **Database Driver** | `postgres` ^3.4.9 ([src/lib/db/index.ts:2](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/index.ts#L2)) | **CONFIRMED** |
| **Auth Provider Active** | `@supabase/ssr` ^0.12.3 + `firebase` ^11.10.0 (Prototype) | **HYBRID / MIGRATION TARGET** |
| **Prisma Status** | Tidak ada di `package.json` (hanya sisa `package-lock.json`) | **UNUSED / LEGACY** |

---

## 3. Claim vs Evidence Reconciliation Table

| Claim pada Laporan Phase 0–0.3 | Physical Repository Evidence Actual | Status Klasifikasi | Kesimpulan Arsitektur |
|---|---|---|---|
| **Supabase Auth canonical** | `package.json` memuat `@supabase/ssr`, namun `src/lib/firebase/auth.ts` aktif | **PARTIALLY CONFIRMED** | Target SaaS = Supabase Auth; Kode Firebase = prototype legacy. |
| **Drizzle ORM canonical** | `drizzle.config.ts`, `src/lib/db/schema.ts`, `src/lib/db/index.ts` aktif | **CONFIRMED** | Drizzle ORM 100% canonical persistence layer. Prisma tidak digunakan. |
| **AST Linter active** | [enforce-tenant-id-param.js](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/tools/eslint-rules/enforce-tenant-id-param.js) & [eslint.config.mjs](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/eslint.config.mjs) aktif | **CONFIRMED** | Aturan linter AST aktif dan diuji oleh unit test vitest. |
| **SUPER_ADMIN platform role** | `src/config/permissions.ts` memuat `super_admin`, namun tabel DB belum ada | **PROPOSED** | Target model memisahkan `platform_roles` dari `tenant_roles` pada WP-101. |
| **Tenant membership model** | Interface `User` di `src/types/index.ts` tidak memiliki `tenant_id` | **PROPOSED** | Tabel `user_tenant_memberships` akan dibuat pada WP-101 Phase 1B. |
| **Middleware.ts active** | `src/middleware.ts` TIDAK ADA; `src/proxy.ts` AKTIF ([proxy.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/proxy.ts)) | **CONTRADICTED / PARTIAL** | Next.js 16 menggunakan `src/proxy.ts` sebagai single entry point (HOTFIX-001). |
| **Subdomain routing implemented** | Parsing hostname dasar di `src/proxy.ts` (lines 13-26); tidak ada custom domain | **PARTIALLY CONFIRMED** | Subdomain parsing dasar ada; custom domain DNS = Future Design. |
| **Google Drive per tenant** | `src/lib/gdrive/client.ts` menggunakan single platform service account | **FUTURE DESIGN** | Single platform service account di kode; per-tenant OAuth = Future. |
| **Supabase RLS active** | Tidak ada file migrasi SQL RLS di repositori | **UNVERIFIED / PROPOSED** | RLS diusulkan di ADR-001, akan diaplikasikan pada PostgreSQL di WP-101. |

---

## 4. Middleware & Proxy Historical Crash Analysis (HOTFIX-001 Evidence)

### A. Temuan Rekaman Git Commit & Report:
- **Commit `220da5a`** (`fix(core): [HOTFIX-001] consolidate middleware into Next.js proxy entry point`) & **Commit `cf199aa`** (PR #2 merge).
- **Laporan Resmi**: [HOTFIX-001-Implementation-Report.md](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/engineering/sprint-0/HOTFIX-001-Implementation-Report.md).
- **Penyebab Utama Crash (*Root Cause*)**: Pada Next.js 16, membuat `src/middleware.ts` secara bersamaan dengan `src/proxy.ts` memicu error build CI/CD: `Next.js detected multiple request entry points`.

### B. Celah Keamanan Cacat pada `src/proxy.ts` Saat Ini:
- Baris 37-45 pada `src/proxy.ts` membaca header `x-tenant-id` langsung dari client request (`request.headers.get('x-tenant-id')`) dan query param `tenant_id`.
- **Bahaya Keamanan**: Ini bersifat **UNSAFE & UNTRUSTED** karena mengizinkan client memalsukan (*spoofing*) tenant ID tanpa verifikasi token JWT Supabase Auth.

### C. Batasan Keamanan Edge Runtime (*Edge Safety Warning*):
- `src/proxy.ts` dieksekusi dalam **Next.js Edge Runtime**.
- `src/lib/db/index.ts` memuat driver Node.js `postgres` (`postgres(connectionString, { prepare: false })`).
- **Peringatan Kritis**: Mengimpor `src/lib/db/index.ts` atau Node-only module (`fs`, `net`, `bcrypt`) ke dalam `src/proxy.ts` akan menyebabkan **runtime crash** di Edge. `src/proxy.ts` HANYA boleh melakukan verifikasi JWT `@supabase/ssr` dan dekorasi header tanpa mengimpor driver DB Node.

---

## 5. Security Threat Matrix & Vulnerability Status

| Vektor Ancaman Keamanan | Status Proteksi Aktual | Bukti Repositori & Rencana Mitigasi |
|---|---|---|
| **Client Spoofing `x-tenant-id` Header** | **UNPROTECTED (Risk P0)** | `src/proxy.ts:37` membaca header raw dari client. **Wajib diperbaiki pada WP-101 Phase 1D**. |
| **Next.js 16 Entry Point Collision** | **PROTECTED (Warning P0)** | Terverifikasi via HOTFIX-001. Seluruh logika Edge request guard wajib berada di `src/proxy.ts`. |
| **Node-only DB Driver Crash di Edge** | **PROTECTED (Warning P0)** | `src/lib/db/index.ts` dipisahkan dari Edge layer. Drizzle DB hanya diakses dari Server Context / Node runtime. |
| **Query Drizzle Tanpa Filter Tenant** | **PROTECTED** | Aturan AST linter `tools/eslint-rules/enforce-tenant-id-param.js` aktif dan teruji vitest. |
| **Eskalasi Permission Tenant ke Platform** | **PROTECTED (Design)** | Scope `PLATFORM` terpisah dari `TENANT` pada ADR-011 & Registry Taxonomy. |

---

## 6. WP-101 Re-Assessed Readiness Decision

### Status Kesiapan Final:
# **`READY WITH CONDITIONS`**

#### Execution Conditions (Syarat Eksekusi Wajib):
1. **Single Entry Point Rule**: Seluruh logika Edge Request Guard, validasi JWT Supabase Auth, dan pembatalan header client *untrusted* wajib dikonsolidasikan di **`src/proxy.ts`** (TIDAK BOLEH membuat file `src/middleware.ts` terpisah untuk menghindari crash Next.js 16).
2. **Zero-Trust Header Sanitization**: `src/proxy.ts` wajib membuang/mengabaikan header `x-tenant-id` buatan client dan menggantinya dengan `tenant_id` terverifikasi dari JWT claim Supabase Auth atau hostname lookup.
3. **Edge Import Isolation**: `src/proxy.ts` dilarang mengimpor `src/lib/db/index.ts` atau modul Node.js (seperti `postgres`, `fs`, `net`).
4. **Scope Boundary Enforcement**: `WP-101` dilarang menyerap CMS publik, integrasi Google Drive, otomasi DNS custom domain, atau engine ledger keuangan.

---

## 7. Recommended Safe Execution Roadmap (Phase 1B s/d Phase 1G)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WP-101 SAFE EXECUTION ROADMAP                        │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
 Phase 1A: Ground-Truth Audit       ▼
 [COMPLETED — Audit forensic & konsolidasi Single Entry Point proxy.ts]
                                     │
 Phase 1B: Identity Drizzle Schemas ▼
 [Buat schema/identity.ts: users, tenants, memberships, roles, permissions]
                                     │
 Phase 1C: Supabase Auth Boundary   ▼
 [Implementasi helper client/server Supabase Auth & verifikasi JWT session]
                                     │
 Phase 1D: Zero-Trust Proxy Guard   ▼
 [Perbarui src/proxy.ts: buang header client raw, injeksi verified claims]
                                     │
 Phase 1E: RBAC & Permission Engine  ▼
 [Implementasi kalkulator Effective Permissions & tenant isolation contracts]
                                     │
 Phase 1F: Security & Isolation Test ▼
 [Jalankan Vitest contract tests & verifikasi AST linter npm run lint:ci]
                                     │
 Phase 1G: Final Quality Gate Sign-Off
 [Verifikasi 100% passing tests & zero regression baseline check]
```

---

## 8. Laporan Audit Tata Kelola (*Governance Audit*)

```text
Runtime code modified : 0 / 0
Database modified     : 0 / 0
Migrations created    : 0 / 0
API endpoints modified: 0 / 0
UI components modified: 0 / 0
Commits executed      : 0 / 0
Push executed         : 0 / 0
PR created            : 0 / 0
```

---

> [!CAUTION]
> **FINAL HARD STOP ENFORCED**: Phase 1A telah **SELESAI**. Seluruh aktivitas coding ditahan sampai Chief Engineering / Product Owner memberikan persetujuan formal untuk memulai eksekusi **Phase 1B**.
