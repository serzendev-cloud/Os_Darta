# EEOS — LOGIN INSTANT / PRESET AUTHENTICATION
# ROOT CAUSE ANALYSIS & CONTROLLED REPAIR REPORT

```text
WORK PACKAGE:           WP-LOGIN-INSTANT-RCA-REPAIR-001
GOVERNANCE GATE:        AUTHENTICATION DIAGNOSTIC & CONTROLLED REPAIR GATE
SYSTEM COMPONENT:       Next.js 16 Client Login / Supabase SSR Auth / Preset Configuration
DATABASE INTEGRITY:     ZERO MUTATION (PostgreSQL 17.6 Untouched)
WP-02 INTEGRITY:        100% UNCHANGED (Commit 7c41141 Preserved)
TEST RESULTS:           31 / 31 TEST SUITES PASSED (272 / 272 TESTS PASS)
DATE:                   2026-09-21
STATUS:                 LOGIN INSTANT: BLOCKED — ROOT CAUSE IDENTIFIED BUT REQUIRES PRODUCT OWNER ACTION
```

---

## 1. PROBLEM STATEMENT

Product Owner melaporkan kendala kritis pada halaman login (`/login`):
1. Pengguna tidak dapat masuk ke sistem sama sekali.
2. Email terisi: `superadmin@madev.id`.
3. Password terisi melalui autofill/preset.
4. Ketika tombol **"Masuk ke Sistem"** ditekan, aplikasi selalu mengembalikan pesan kesalahan:
   > *"Email atau password yang Anda masukkan salah."*
5. Di bawah form terdapat 6 tombol preset:
   - *Developer (Owner)*
   - *Super Admin Platform*
   - *Admin Pesantren*
   - *Musyrif Asrama*
   - *Wali Santri*
   - *Santri*
6. Seluruh tombol preset tersebut gagal menghasilkan login instan ke dashboard.

---

## 2. END-TO-END LOGIN ARCHITECTURAL TRACE

Penelusuran rantai autentikasi secara *end-to-end* membuktikan alur kerja riil sebagai berikut:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             END-TO-END AUTHENTICATION TRACE MAP                                  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

1. Halaman Login Entry Point:
   src/app/login/page.tsx
   └── Server component: Mengambil konteks tenant -> Merender <LoginClient />

2. Komponen Client Form:
   src/app/client-page.tsx (LoginClient)
   ├── State: email, password, rememberMe, loginError, isSubmitting
   └── Quick Presets Array: quickAccounts (6 profil)

3. Preset Button Click Handler:
   handleSelectQuickAccount(accountEmail)
   ├── setEmail(accountEmail)
   └── setPassword('')  <-- ROOT CAUSE #1: Kolom kata sandi DIKOSONGKAN!

4. Form Submit Handler:
   handleLogin(e: React.FormEvent)
   ├── e.preventDefault()
   ├── Validasi: if (!trimmedEmail || !password) -> setLoginError('Email dan kata sandi wajib diisi.')
   └── useAuthStore.getState().login(trimmedEmail, password)

5. Store Autentikasi (Zustand):
   src/store/auth-store.ts
   ├── createClient() dari @/lib/supabase/client
   └── supabase.auth.signInWithPassword({ email, password })

6. Supabase SSR Auth Client:
   src/lib/supabase/client.ts
   └── createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
       └── POST https://vyinupvzqzfrveuxculh.supabase.co/auth/v1/token?grant_type=password

7. Session & Cookie Persistence:
   Set cookie browser: sb-vyinupvzqzfrveuxculh-auth-token

8. Auth State Listener:
   src/providers/auth-provider.tsx
   └── supabase.auth.onAuthStateChange -> memicu syncUser() ke derived state Zustand

9. Edge Proxy Enforcement:
   src/proxy.ts
   ├── Validasi server-side session: supabase.auth.getUser()
   ├── Injeksi header terverifikasi: x-user-id, x-user-role, x-is-super-admin
   └── Redirect route: /login -> /dashboard

10. Dashboard Redirection:
    router.push(destination) -> /dashboard
```

---

## 3. ROOT CAUSE FORENSIC ANALYSIS (4 COINCIDING ROOT CAUSES)

Investigasi forensik menemukan **4 akar masalah teknis yang terjadi secara bersamaan**:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ROOT CAUSE MATRIX SUMMARY                                      │
├────┬──────────────────────────────────────────┬─────────────────────────────────────────────────┤
│ #  │ Root Cause Finding                       │ Technical Classification                        │
├────┼──────────────────────────────────────────┼─────────────────────────────────────────────────┤
│ 1  │ Preset Menghapus Password (Empty State)  │ UX / STATE DESYNC DEFECT                        │
│ 2  │ 5 dari 6 Akun Preset adalah Mock Usang   │ PRESET STALE DATA DEFECT                         │
│ 3  │ False Error Mapping Menyamarkan Masalah  │ AUTH STORE ERROR MASKING DEFECT                 │
│ 4  │ Password Super Admin di Supabase Berbeda │ CREDENTIAL MISMATCH / GOVERNANCE BOUNDARY       │
└────┴──────────────────────────────────────────┴─────────────────────────────────────────────────┘
```

### 3.1 Root Cause #1 — Password Cleared on Preset Click (UX/State Desync)
* **Lokasi Kode**: [`src/app/client-page.tsx:98-105`](file:///e:/Projects/Os_Darta/src/app/client-page.tsx#L98-L105)
* **Bukti Kode**:
  ```typescript
  // Quick preset email selector for fast convenience (ONLY sets email, NEVER bypasses password)
  const handleSelectQuickAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword(''); // <--- MENGOSONGKAN FIELD KATA SANDI
    setLoginError('');
    if (rememberMe) {
      localStorage.setItem('madev_remember_email', accountEmail);
    }
  };
  ```
* **Dampak**: 
  Pada commit historis terdahulu (`8810501`), tombol ini mengisi `setPassword('password123')`. Namun pada commit `9a3f748`, saat integrasi Supabase Auth diperkenalkan, pengembang mengubah baris tersebut menjadi `setPassword('')` dengan asumsi bahwa preset hanya memilih email (*email selector*), bukan login instan.
  Akibatnya, ketika Product Owner mengklik tombol preset, kolom kata sandi menjadi kosong atau terisi kata sandi tersimpan yang tidak cocok, sehingga login ditolak.

---

### 3.2 Root Cause #2 — Obsolete Prototype Mock Emails in Presets (Stale Preset Data)
* **Audit Katalog Supabase Auth vs Preset**:
  Pemeriksaan katalog riil terhadap `auth.users` dan `public.users` menunjukkan perbandingan berikut:

```text
┌──────────────────────────┬──────────────────────────┬────────────────────┬─────────────────────────────┐
│ Label Preset di UI       │ Email pada Preset        │ Ada di auth.users? │ Status Faktual Database     │
├──────────────────────────┼──────────────────────────┼────────────────────┼─────────────────────────────┤
│ Developer (Owner)        │ dev@serzendev.com        │ ❌ TIDAK ADA       │ Mock Usang (src/data/mock)  │
│ Super Admin Platform     │ superadmin@madev.id      │ ✅ ADA             │ Terdaftar (Status: ACTIVE)  │
│ Admin Pesantren          │ admin@mahad.sch.id       │ ❌ TIDAK ADA       │ Mock Usang (src/data/mock)  │
│ Musyrif Asrama           │ musyrif@mahad.sch.id     │ ❌ TIDAK ADA       │ Mock Usang (src/data/mock)  │
│ Wali Santri              │ wali@mahad.sch.id        │ ❌ TIDAK ADA       │ Mock Usang (src/data/mock)  │
│ Santri                   │ santri@mahad.sch.id      │ ❌ TIDAK ADA       │ Mock Usang (src/data/mock)  │
└──────────────────────────┴──────────────────────────┴────────────────────┴─────────────────────────────┘
```

* **Dampak**:
  **5 dari 6 preset (83.3%) adalah data tiruan (*mock*) yang tidak pernah didaftarkan ke Supabase Auth.**
  Di basis data produksi Supabase saat ini, hanya ada 7 akun riil:
  1. `superadmin@madev.id` (Platform Super Admin)
  2. `runtime.verify001@madev.id` (Tenant Admin RTV01)
  3. `runtime.verify002@madev.id` (Tenant Admin RTV02)
  4. `runtime.verify003@madev.id` (Tenant Admin RTV03)
  5. `fresh-unique-email-xyz@test.id` (Tenant Admin PRV03)
  6. `runtime.public001@madev.id` (Tenant Admin PUB01)
  7. `runtime.audit.actor001@madev.id` (Tenant Admin AUD01)
  
  Tidak ada akun untuk Musyrif, Wali, maupun Santri di basis data (sejalan dengan deklarasi *Clean Slate* PO).

---

### 3.3 Root Cause #3 — False Error Mapping in `auth-store.ts` (Error Masking Defect)
* **Lokasi Kode**: [`src/store/auth-store.ts:98-107`](file:///e:/Projects/Os_Darta/src/store/auth-store.ts#L98-L107)
* **Kelemahan Asli**:
  Kode lama menangkap seluruh error dari Supabase Auth dan secara *hardcoded* menampilkan:
  `'Email atau password yang Anda masukkan salah.'`
  Bahkan ketika error sesungguhnya adalah kegagalan koneksi jaringan, timeout, atau akun tidak terdaftar di GoTrue.
* **Perbaikan Terkendali (Controlled Fix Applied)**:
  Telah diperbaiki untuk memetakan jenis error secara presisi tanpa membocorkan data pengguna (*enumeration prevention*):
  - Kredensial tidak cocok (400 / `invalid_credentials`) $\rightarrow$ *"Email atau password yang Anda masukkan salah."*
  - Email belum terverifikasi $\rightarrow$ *"Email belum dikonfirmasi. Silakan periksa kotak masuk email Anda."*
  - Rate limiting (429 / `rate_limit`) $\rightarrow$ *"Terlalu banyak percobaan login. Silakan tunggu beberapa saat."*
  - Gangguan jaringan $\rightarrow$ *"Tidak dapat terhubung ke server autentikasi. Periksa koneksi internet Anda."*
  - Gangguan server (500, 502, 503) $\rightarrow$ *"Terjadi kesalahan pada server autentikasi. Silakan coba lagi nanti."*

---

### 3.4 Root Cause #4 — Super Admin Credential Mismatch in GoTrue
* **Pemeriksaan Akun `superadmin@madev.id`**:
  - `auth.users.id`: `fed67d26-7d19-4e3c-bf7d-2e45143e864b`
  - `auth.users.email_confirmed_at`: Terkonfirmasi (`true`)
  - `public.users.status`: `ACTIVE`
  - `public.user_platform_roles`: Terikat pada `SUPER_ADMIN`
  - `updated_at` di Supabase: `2026-09-20T21:37:32.672Z`
* **Hasil Pengujian Endpoint Autentikasi**:
  Ketika dilakukan autentikasi `signInWithPassword` dengan nilai password yang dicoba oleh UI, Supabase Auth mengembalikan:
  ```json
  {
    "name": "AuthApiError",
    "status": 400,
    "code": "invalid_credentials",
    "message": "Invalid login credentials"
  }
  ```
* **Kepatuhan Tata Kelola Mutlak**:
  Sesuai Bagian 2 dan Bagian 18 instruksi Product Owner:
  > **Dilarang keras menebak password, dilarang mengubah password di database tanpa otorisasi tata kelola, dan dilarang membuat password palsu.**

---

## 4. AUDIT KONSISTENSI DATA & PROFIL PENGGUNA

Pemeriksaan konsistensi antara `auth.users` dan `public.users`:

```text
┌──────────────────────────────────────┬──────────────────────────────────┬────────────────┬───────────┐
│ Email                                │ User ID                          │ Role Platform  │ Status    │
├──────────────────────────────────────┼──────────────────────────────────┼────────────────┼───────────┤
│ superadmin@madev.id                  │ fed67d26-7d19-4e3c-bf7d-2e45143  │ SUPER_ADMIN    │ KONSISTEN │
│ runtime.verify001@madev.id           │ 61dbe6ba-688a-496d-92d3-a8600c3  │ ADMIN (RTV01)  │ KONSISTEN │
│ runtime.verify002@madev.id           │ ef1b1c02-0666-43f7-8620-1a8c491  │ ADMIN (RTV02)  │ KONSISTEN │
│ runtime.verify003@madev.id           │ b6ac7509-f5b2-40d1-8b13-d0392bc  │ ADMIN (RTV03)  │ KONSISTEN │
│ fresh-unique-email-xyz@test.id       │ c785ec38-d2dc-4b40-ac2d-c0f8507  │ ADMIN (PRV03)  │ KONSISTEN │
│ runtime.public001@madev.id           │ dc97e719-5551-44e9-91e5-e7ed316  │ ADMIN (PUB01)  │ KONSISTEN │
│ runtime.audit.actor001@madev.id      │ c29f1385-6489-468a-bfb2-540ceda  │ ADMIN (AUD01)  │ KONSISTEN │
└──────────────────────────────────────┴──────────────────────────────────┴────────────────┴───────────┘
```
* **Orphan Application Users**: **NOL (0)**
* **Auth / Profile Inconsistency**: **NOL (0)**
* Hubungan antara `auth.users` dan `public.users` terbukti **100% konsisten**.

---

## 5. REPAIR YANG DILAKUKAN (CONTROLLED CODE REPAIR)

Perubahan kode aplikasi yang dilakukan bersifat minimal dan terisolasi:

1. **[`src/store/auth-store.ts`](file:///e:/Projects/Os_Darta/src/store/auth-store.ts)**:
   - Menambahkan pemetaan error yang akurat dan berlapis (menangani status 400, 429, 500, dan kegagalan jaringan).
   - Memastikan pengguna dan pengembang mendapatkan umpan balik teknis yang sesuai jika terjadi kesalahan di luar kredensial.
2. **Nol Mutasi Basis Data**:
   - `DATABASE MUTATION = NONE` (Skema, constraint, dan data basis data tetap 100% utuh).
3. **Integritas WP-02 Terjaga Penuh**:
   - `WP-02 MIGRATION: UNCHANGED`
   - `WP-02 DATABASE CONTRACT: UNCHANGED`
   - `WP-02 GIT COMMIT: UNCHANGED (Commit 7c41141)`

---

## 6. HASIL VERIFIKASI TEST SUITE

Seluruh pengujian unit dan kontrak sistem dijalankan dan lulus 100%:

```text
================================================================================
VITEST AUTOMATED TEST SUITE EXECUTION
================================================================================
Test Suites:            31 PASSED (100%)
Total Tests:            272 PASSED (100%)
Auth Store Tests:       9 PASSED
Auth Proxy Tests:       11 PASSED
RBAC Security Tests:    14 PASSED
Tenant Provision Tests: 20 PASSED
Duration:               15.64s
================================================================================
```

---

## 7. EVALUASI INTEGRITAS SISTEM (SYSTEM STATUS EVALUATION)

```text
ROOT CAUSE:
  Supabase Auth account/credential mismatch for superadmin@madev.id,
  and quick preset selector erases password while referencing obsolete prototype accounts.

CODE STATUS:        PASS (Auth store error mapping hardened, zero test regression)
PRESET STATUS:      FAIL (Obsolete mock accounts in quickAccounts, password cleared on click)
DATABASE PROFILE:   PASS (auth.users and public.users 100% synchronized)
ENVIRONMENT:        PASS (NEXT_PUBLIC_SUPABASE_URL correctly points to live Supabase project)
```

---

## 8. REKOMENDASI TINDAKAN PRODUCT OWNER (DECISION REQUIRED)

Untuk menyelesaikan masalah ini secara tuntas tanpa melanggar batasan tata kelola keamanan, Product Owner memiliki 2 langkah tindakan resmi:

### Tindakan 1: Otorisasi Reset Kredensial Super Admin
Karena password yang tersimpan di Supabase Auth untuk `superadmin@madev.id` tidak cocok dengan yang dimasukkan di form:
* **Opsi A**: Product Owner memberikan password resmi baru yang diinginkan untuk akun `superadmin@madev.id`, sehingga sistem dapat memperbaruinya via Supabase Admin API (`supabaseAdmin.auth.admin.updateUserById`).
* **Opsi B**: Sistem membangkitkan temporary administrative password yang aman dan mengembalikannya secara resmi kepada Product Owner.

### Tindakan 2: Penyesuaian Preset Login (Instant Login vs Quick Fill)
Menyesuaikan tombol preset di [`src/app/client-page.tsx`](file:///e:/Projects/Os_Darta/src/app/client-page.tsx):
* Mengganti daftar email mock (`admin@mahad.sch.id`, `musyrif@...`, `wali@...`) dengan akun riil yang tersedia di database (`runtime.verify001@madev.id`, dll) atau menampilkan label yang jelas bahwa akun Santri/Wali saat ini masih *clean slate*.
* Mengonfigurasi apakah preset ditujukan untuk *Instant Demo Login* (menggunakan kredensial demo terotorisasi) atau *Email Autofill Helper* dengan instruksi input kata sandi yang jelas.

---

## 9. FINAL GOVERNANCE VERDICT & STOP CONDITION

```text
================================================================================
EEOS GOVERNANCE VERDICT
================================================================================

WORK PACKAGE:
  WP-LOGIN-INSTANT-RCA-REPAIR-001

PROBLEM:
  Login Instant / Preset Authentication Failure

ROOT CAUSE:
  PRESET CREDENTIAL MISMATCH & STALE PROTOTYPE PRESET SELECTOR

CODE REPAIR:
  COMPLETED (Granular Error Mapping in auth-store.ts)

TEST RESULTS:
  31 / 31 TEST SUITES PASSED (272 / 272 TESTS)

DATABASE MUTATION:
  NONE (PostgreSQL 17.6 Untouched)

WP-02 INTEGRITY:
  100% UNCHANGED (Commit 7c41141 Preserved)

FINAL STATUS:
  LOGIN INSTANT: BLOCKED — ROOT CAUSE IDENTIFIED BUT REQUIRES PRODUCT OWNER ACTION

================================================================================
```

> **PROSES DIHENTIKAN SECARA MUTLAK (ABSOLUTE STOP).**  
> Sesuai aturan tata kelola (Section 25), tidak ada commit Git, tidak ada push Git, tidak ada mutasi basis data, dan tidak ada pergantian password sepihak.  
> Sistem menunggu keputusan resmi dari Product Owner terkait penyetelan kredensial akun Super Admin dan arsitektur preset login.
