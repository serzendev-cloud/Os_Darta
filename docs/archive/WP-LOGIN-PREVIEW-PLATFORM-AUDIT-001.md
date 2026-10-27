# EEOS — PREVIEW PLATFORM
# ARCHITECTURAL AUDIT & REFACTORING BLUEPRINT

```text
WORK PACKAGE:           WP-LOGIN-PREVIEW-PLATFORM-AUDIT-001
TASK:                   Refactor Login Instant menjadi Preview Control Center di Super Admin SaaS
MODE:                   PRE-IMPLEMENTATION ARCHITECTURAL AUDIT (READ-ONLY)
AUTHORITY:              Product Owner Locked Decisions
PREVIEW LIFECYCLE:      PERMANENT PREVIEW PERSONAS (NOT DELETED POST-LAUNCH)
WP-02 INTEGRITY:        100% UNCHANGED (Commit 7c41141 Preserved)
DATABASE INTEGRITY:     ZERO MUTATION / ZERO DATA LOSS
STATUS:                 AUDIT COMPLETE — AWAITING PRODUCT OWNER APPROVAL
```

---

## 1. EXECUTIVE SUMMARY

Sesuai arahan Product Owner pada work package **`WP-LOGIN-PREVIEW-PLATFORM-001`**, sistem **Login Instant / Role Preview** yang sebelumnya terpasang pada halaman publik `/login` akan direfaktor menjadi:

> **Preview Platform yang dikendalikan secara tersentralisasi dan berotorisasi tinggi dari dalam Super Admin SaaS.**

### Perubahan Paradigma Utama:
1. **Halaman Login Publik (`/login`)**:
   - Disederhanakan kembali menjadi *clean standard login* (Email & Password).
   - Tombol-tombol persona tidak lagi menjadi tampilan publik permanen.
2. **Super Admin SaaS Console (`/dashboard/saas/preview`)**:
   - Menjadi *Control Center* resmi bagi Product Owner / Platform Super Admin untuk memilih dan menjelajahi 6 persona preview.
3. **Sifat Akun Preview**:
   - **PERMANEN**: Ke-6 persona preview (`preview.*@madev.id`) **TIDAK DIHAPUS** setelah peluncuran produksi, melainkan menjadi *permanent tooling* untuk keperluan QA, Product Review, audit, dan demo internal.
4. **Perlindungan Akun Asli Super Admin**:
   - Akun asli Super Admin **tidak dimutasi role-nya**.
   - Sistem menggunakan mekanisme *session context switching* yang dapat berganti persona secara mulus dan kembali (*Exit Preview*) ke Super Admin tanpa harus login ulang dari awal.

---

## 2. AUDIT ARSITEKTUR EKSISTING (ITEM A s/d F)

### A. Existing Architecture
Komponen yang saat ini aktif pada sistem:
1. **Public Login Page** ([`src/app/client-page.tsx`](file:///e:/Projects/Os_Darta/src/app/client-page.tsx)):
   - Memiliki form login normal dan blok Role Preview di bagian bawah yang dibatasi oleh flag `isPreviewUiEnabled`.
   - Mengirim request `POST /api/auth/role-preview` dengan payload `{ role }`.
2. **Server-side Preview Endpoint** ([`src/app/api/auth/role-preview/route.ts`](file:///e:/Projects/Os_Darta/src/app/api/auth/role-preview/route.ts)):
   - Memvalidasi dual-key production protection (`ROLE_PREVIEW_ENABLED` & `ROLE_PREVIEW_PRODUCTION_ALLOWED`).
   - Memvalidasi allowlist 6 role (`developer`, `super_admin`, `admin`, `musyrif`, `wali`, `santri`).
   - Melakukan autentikasi resmi via GoTrue Supabase Auth (`signInWithPassword`) dan menerbitkan cookie SSR HTTP.
3. **Session & Middleware/Proxy** ([`src/proxy.ts`](file:///e:/Projects/Os_Darta/src/proxy.ts)):
   - Memvalidasi session Supabase secara fail-closed.
   - Menstempel header `x-user-id`, `x-user-role`, `x-is-super-admin`, dan `x-tenant-id`.
4. **Preview Indicator** ([`src/components/shared/PreviewIndicator.tsx`](file:///e:/Projects/Os_Darta/src/components/shared/PreviewIndicator.tsx)):
   - Terpasang di [`src/app/dashboard/layout.tsx`](file:///e:/Projects/Os_Darta/src/app/dashboard/layout.tsx).
   - Mendeteksi apakah user aktif memiliki email dengan prefiks `preview.`.
   - Tombol "Keluar Preview" saat ini memanggil `logout()` dan meredirect ke `/login`.
5. **Super Admin SaaS Console Navigation** ([`src/config/navigation.ts`](file:///e:/Projects/Os_Darta/src/config/navigation.ts)):
   - Grup `SaaS Platform Console` khusus untuk role `developer` dan `super_admin`.

---

### B. Existing Preview Identities
Berdasarkan audit read-only live database PostgreSQL (`aws-0-ap-southeast-1.pooler.supabase.com:6543`), ke-6 identitas telah aktif dan tervalidasi:

| No | Persona | Email di `auth.users` & `public.users` | Role | Scope & Tenant Context | Domain Fixture Record |
|---|---|---|---|---|---|
| 1 | **Developer / Owner** | `preview.developer@madev.id` | `developer` | Platform (`default`) | Platform Configuration |
| 2 | **Super Admin Platform** | `preview.superadmin@madev.id` | `super_admin` | Platform (`default`) | SaaS Cross-tenant Console |
| 3 | **Admin Pesantren** | `preview.admin@madev.id` | `admin` | Tenant RTV01 (`t_1789172137858_9g7lm`) | Full Tenant Academic & Madrasah |
| 4 | **Musyrif Asrama** | `preview.musyrif@madev.id` | `musyrif` | Tenant RTV01 (`t_1789172137858_9g7lm`) | Asrama Fixture: `asrama_preview_001` |
| 5 | **Wali Santri** | `preview.wali@madev.id` | `wali` | Tenant RTV01 (`t_1789172137858_9g7lm`) | Child Santri: `santri_preview_001` |
| 6 | **Santri** | `preview.santri@madev.id` | `santri` | Tenant RTV01 (`t_1789172137858_9g7lm`) | Santri Fixture: `santri_preview_001` (NIS: `PREV001`) |

---

### C. Existing Endpoint Workflow
Alur `/api/auth/role-preview` saat ini:
```text
Client Request (role: "admin")
      │
      ▼
Dual-Key Env Check (Fail-Closed)
      │
      ▼
Resolve Email & Password Deterministic
      │
      ▼
supabase.auth.signInWithPassword(...)
      │
      ▼
Set SSR Session Cookies (sb-*-auth-token)
      │
      ▼
Redirect ke /dashboard
```

---

### D. Existing Security & Caller Validation
* **Kelemahan Saat Ini**: Endpoint `/api/auth/role-preview` belum memeriksa identitas penelepon (*caller*), karena pada desain awal tombol preview ditaruh di halaman publik `/login` sebelum pengguna login.
* **Target Security**: Endpoint Preview Platform **wajib menuntut otorisasi server-side**. Penelepon harus merupakan user dengan role `super_admin` atau `developer` (atau sedang berada dalam active preview session yang diinisiasi oleh Super Admin). Permintaan dari role publik atau akun biasa wajib ditolak dengan **HTTP 403 Forbidden**.

---

### E. Existing Tenant Context
* Tenant context tidak diambil dari input client (tidak ada `body.tenantId`), melainkan **100% server-derived** dari data relasi identitas di database (`public.users.tenant_id`).
* Ini menjamin isolasi tenant tetap ketat dan tidak dapat dimanipulasi oleh client.

---

### F. Existing Public Login UI
* Bagian bawah form pada `src/app/client-page.tsx` masih merender 6 tombol preview.
* Ini akan dibersihkan dari tampilan produksi normal agar halaman `/login` tetap profesional dan fokus pada autentikasi standar.

---

## 3. REUSE MAP (ITEM G)

Komponen eksisting yang akan di-reuse secara maksimal:
1. **6 Identitas Preview**: Tetap dipertahankan di database sebagai identitas permanen.
2. **Kredensial & Autentikasi GoTrue**: Mekanisme login Supabase SSR tetap digunakan karena menghasilkan token JWT resmi dan cookie SSR yang valid bagi middleware, proxy, RLS, dan authorization service.
3. **Data Fixture Domain**: `santri_preview_001` dan `asrama_preview_001` tetap menjadi referensi relasi yang valid untuk persona Wali, Santri, dan Musyrif.
4. **Proxy & Tenant Context**: Logika penentuan tenant dari session tetap utuh.
5. **Preview Indicator Component**: Diperluas fungsionalitasnya untuk mendukung *Switch Persona* dan *Restore Super Admin Session*.

---

## 4. GAP ANALYSIS (ITEM H)

Terdapat 5 celah (*gaps*) antara sistem saat ini dengan target arsitektur Product Owner:

```text
┌───────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────┐
│ Kondisi Eksisting                                         │ Target Arsitektur Product Owner                           │
├───────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────┤
│ 1. Tombol preview berada di halaman publik /login         │ 1. Preview Platform berada di dalam Super Admin SaaS      │
│ 2. Endpoint /api/auth/role-preview dapat dipanggil publik │ 2. Endpoint mewajibkan otorisasi Super Admin/Developer    │
│ 3. Keluar Preview melakukan total logout ke /login        │ 3. Keluar Preview kembali ke Super Admin tanpa relogin    │
│ 4. Tidak ada UI ganti persona saat sedang dalam preview   │ 4. Terdapat tombol [Ganti Persona] langsung di banner     │
│ 5. Tidak ada halaman konsol Preview di Super Admin        │ 5. Halaman baru: /dashboard/saas/preview                  │
└───────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────┘
```

---

## 5. ANALISIS RISIKO & MITIGASI (ITEM I)

1. **Risiko 1: Eskalasi Hak Akses (Privilege Escalation)**
   - *Ancaman*: Santri atau Wali biasa mengakses `/dashboard/saas/preview` atau memanggil endpoint API preview untuk berganti menjadi Super Admin.
   - *Mitigasi*: Server-side boundary memeriksa session JWT pemanggil. Jika `role !== 'super_admin'` dan `role !== 'developer'` (serta tidak memiliki origin ticket Super Admin yang valid), server langsung merespons **HTTP 403 Forbidden**.
2. **Risiko 2: Mutasi Akun Asli Super Admin**
   - *Ancaman*: Role akun `superadmin@madev.id` di database terubah menjadi `admin` atau `santri`.
   - *Mitigasi*: Record pengguna asli sama sekali **TIDAK DIMUTASI**. Sistem melakukan pertukaran sesi (*session ticket handoff*) ke identitas preview (`preview.*@madev.id`), sementara sesi asli disimpan dalam cookie aman `HttpOnly` bertanda tangan (`sb-origin-superadmin`).
3. **Risiko 3: Pencemaran Data Tenant Produksi**
   - *Ancaman*: Entitas preview bercampur dengan santri pondok nyata.
   - *Mitigasi*: Seluruh data preview terkunci pada tenant sandbox `t_1789172137858_9g7lm` dan ID berawalan `santri_preview_*`.
4. **Risiko 4: Regresi WP-02 (Core Santri Tenantization)**
   - *Ancaman*: Skema `santri.tenant_id` atau constraint unique NIS terganggu.
   - *Mitigasi*: Zero DDL, zero migration, commit `7c41141` tetap utuh 100%.

---

## 6. PROPOSED ARCHITECTURAL CHANGES (ITEM J)

Perubahan dirancang dengan prinsip **refactor minimal dengan dampak maksimal**:

### Komponen 1: Halaman Konsol Preview Super Admin SaaS
* **File Baru**: [`src/app/dashboard/saas/preview/page.tsx`](file:///e:/Projects/Os_Darta/src/app/dashboard/saas/preview/page.tsx)
* **Navigasi**: Menambahkan item pada [`src/config/navigation.ts`](file:///e:/Projects/Os_Darta/src/config/navigation.ts) di bawah grup `SaaS Platform Console`:
  - Judul: `🧪 Preview Platform`
  - URL: `/dashboard/saas/preview`
  - Hak Akses: `['developer', 'super_admin']`
* **Antarmuka**: Grid 6 kartu persona elegan dengan deskripsi peran, cakupan konteks (Platform vs Tenant: RTV01), dan tombol aksi `[Mulai Preview]`.

### Komponen 2: Endpoint Server-Side Berotorisasi & Session Preservation
* **Refactor Endpoint**: [`src/app/api/auth/role-preview/route.ts`](file:///e:/Projects/Os_Darta/src/app/api/auth/role-preview/route.ts)
  - Memverifikasi session pemanggil: Wajib `super_admin` / `developer` ATAU memiliki cookie `sb-origin-superadmin`.
  - Jika Super Admin asli masuk ke preview: Menyimpan token/referensi Super Admin asli ke dalam cookie terenkripsi/HttpOnly `sb-origin-superadmin`.
  - Menerbitkan sesi GoTrue untuk persona yang dipilih.
* **Endpoint Baru**: [`src/app/api/auth/role-preview/exit/route.ts`](file:///e:/Projects/Os_Darta/src/app/api/auth/role-preview/exit/route.ts)
  - Membaca cookie `sb-origin-superadmin`.
  - Memulihkan sesi asli Super Admin ke cookie utama `sb-*-auth-token`.
  - Menghapus cookie origin dan meredirect pengguna langsung ke `/dashboard/saas/preview`.

### Komponen 3: Peningkatan `PreviewIndicator.tsx`
* Menampilkan badge persona aktif dan nama tenant.
* Menambahkan tombol **`[ 🔄 Ganti Persona ]`** $\rightarrow$ Menampilkan modal pemilihan cepat ke persona lain tanpa perlu keluar terlebih dahulu.
* Menambahkan tombol **`[ ↩ Keluar Preview ]`** $\rightarrow$ Memanggil `/api/auth/role-preview/exit` yang mengembalikan pengguna ke Super Admin SaaS secara instan.

### Komponen 4: Pembersihan Halaman Publik `/login`
* Mengubah default `src/app/client-page.tsx` agar tidak lagi menampilkan tombol preview di lingkungan produksi (hanya login standar).

---

## 7. MATRIKS PENGUJIAN KONTRAK (TEST MATRIX)

| Skenario Pengujian | Aktor / Kondisi | Expected Result |
|---|---|---|
| Akses Konsol Preview | Super Admin login $\rightarrow$ buka `/dashboard/saas/preview` | **200 OK — Konsol Tampil** |
| Akses Konsol Unauthorized | Wali/Santri login $\rightarrow$ buka `/dashboard/saas/preview` | **403 Forbidden / Redirect** |
| Mulai Preview Developer | Super Admin klik `Developer / Owner` | **Session Developer (Platform Scope)** |
| Mulai Preview Admin | Super Admin klik `Admin Pesantren` | **Session Admin (Tenant RTV01)** |
| Mulai Preview Musyrif | Super Admin klik `Musyrif Asrama` | **Session Musyrif (Tenant RTV01)** |
| Mulai Preview Wali | Super Admin klik `Wali Santri` | **Session Wali (Child: santri_preview_001)** |
| Mulai Preview Santri | Super Admin klik `Santri` | **Session Santri (NIS: PREV001)** |
| Ganti Persona Langsung | Dalam Mode Preview $\rightarrow$ Switch ke Musyrif | **200 OK — Persona Berubah** |
| Keluar Preview | Dalam Mode Preview $\rightarrow$ Klik `Keluar Preview` | **Kembali ke Super Admin SaaS (Tanpa Relogin)** |
| Akses API Tanpa Otorisasi | Tamu publik memanggil `POST /api/auth/role-preview` | **403 Forbidden** |
| Normal Login Integrity | `superadmin@madev.id` login via form standar | **200 OK — Normal Auth Berjalan** |
| WP-02 Schema Integrity | Verifikasi constraint & tabel santri | **100% UNCHANGED** |

---

## 8. STOP GATE & VERDICT

```text
============================================================
EEOS GOVERNANCE VERDICT — PRE-IMPLEMENTATION AUDIT
============================================================

WORK PACKAGE:
WP-LOGIN-PREVIEW-PLATFORM-AUDIT-001

STATUS:
AUDIT COMPLETE & SPECIFICATION FINALIZED

DATABASE MUTATION:
ZERO (NO MIGRATION, NO DATA LOSS)

PREVIEW ACCOUNTS:
PERMANENT (WILL NOT BE DELETED)

WP-02 INTEGRITY:
PRESERVED (COMMIT 7c41141 INTACT)

NEXT ACTION:
AWAITING PRODUCT OWNER APPROVAL TO PROCEED WITH IMPLEMENTATION

============================================================
ABSOLUTE STOP — MENUNGGU PERSETUJUAN PRODUCT OWNER
============================================================
```
