# EEOS — ROLE PREVIEW & INSTANT AUTHENTICATION
# IMPLEMENTATION & GOVERNANCE REPORT

```text
WORK PACKAGE:           WP-LOGIN-INSTANT-ROLE-PREVIEW-001
GOVERNANCE GATE:        DEVELOPMENT & PREVIEW AUTHENTICATION GATE
PRIMARY TARGET:         6-Role Instant Preview for Product Owner Exploration
ENVIRONMENT SCOPE:      Development / Staging / Preview (Fail-Closed in Production)
SECURITY STANDARD:      Zero Password Leakage, Real Supabase JWT Sessions, Fail-Closed Gates
WP-02 INTEGRITY:        100% UNCHANGED (Commit 7c41141 Preserved on origin/preview)
DATABASE INTEGRITY:     CONTROLLED PREVIEW-ONLY ISOLATED ENTITIES
AUTOMATED TESTS:        32 / 32 TEST SUITES PASS (282 / 282 TESTS PASS, 100%)
BROWSER TESTING:        NOT EXECUTED (Manual Browser Test Checklist Provided)
GIT STATUS:             ZERO COMMIT / ZERO PUSH
DATE:                   2026-09-21
STATUS:                 PASS — READY FOR PRODUCT OWNER PREVIEW
```

---

## 1. EXECUTIVE SUMMARY

Sesuai arahan Product Owner, telah dibangun dan diverifikasi sistem **Role Preview / Instant Login** yang memungkinkan Product Owner melihat, mengeksplorasi, dan menguji platform APP MA'HAD dari sudut pandang **6 peran berbeda** (Developer, Super Admin, Admin Pesantren, Musyrif Asrama, Wali Santri, dan Santri) hanya dengan satu klik pada halaman login, tanpa perlu menginput kata sandi secara manual.

Sistem ini dirancang dengan prinsip **Temporary by Architecture**:
1. **Zero Secret Leakage**: Tidak ada kata sandi demo, credential, atau service role key yang dimasukkan ke dalam JavaScript bundle client atau browser storage.
2. **Real Authentication Session**: Menggunakan Supabase Auth GoTrue server-side login yang menghasilkan JWT, cookies SSR (`sb-...-auth-token`), dan klausa otorisasi riil sehingga sistem authorization, proxy, dan RBAC berjalan secara autentik.
3. **Fail-Closed Environment Gate**: Otomatis nonaktif dan menolak akses jika berjalan pada lingkungan `production` atau jika `ROLE_PREVIEW_ENABLED=false`.
4. **Complete Reversibility & Clean Teardown**: Seluruh akun dan entitas data ber-namespace `preview_*`, tidak menyentuh satu pun akun produksi (`superadmin@madev.id` tetap utuh), dan dapat dicabut secara bersih melalui satu perintah skrip.

---

## 2. EXISTING ARCHITECTURE AUDIT & ROLE DISCOVERY

Berdasarkan audit forensik pada kode sumber:
* **Halaman Dasbor Dinamis**: `src/app/dashboard/page.tsx` memiliki selektor peran dinamis:
  - `role: 'developer' | 'super_admin'` $\rightarrow$ Menampilkan `DeveloperDashboard` (SaaS Helicopter View, status Flip, WA, Google Drive, dan daftar Tenant).
  - `role: 'admin'` $\rightarrow$ Menampilkan `AdminDashboard` (Ringkasan santri, pelanggaran, asrama, kesiswaan).
  - `role: 'musyrif'` $\rightarrow$ Menampilkan `MusyrifDashboard` (Ringkasan asrama, santri binaan, pelanggaran asrama).
  - `role: 'wali'` $\rightarrow$ Menampilkan `WaliDashboard` (Ringkasan perkembangan anak santri yang terhubung via `childSantriId`).
  - `role: 'santri'` $\rightarrow$ Menampilkan `SantriDashboard` (Ringkasan prestasi, quest, dan profil santri).
* **Sidebar Navigasi**: `src/config/navigation.ts` dan `src/components/layout/sidebar.tsx` menyaring menu secara dinamis menggunakan `getGroupedMenuForRole(user.role)`.
* **Edge Proxy**: `src/proxy.ts` membaca sesi via `getUser()` dan menyuntikkan header `x-user-id`, `x-user-role`, dan `x-is-super-admin`.

---

## 3. ROLE MAPPING & IDENTITY INVENTORY

Enam peran preview dipetakan ke identitas berdedikasi:

```text
┌────┬──────────────────────┬─────────────────────────────┬─────────────┬──────────────────────────┬─────────────────────────────┐
│ #  │ Label Peran          │ Email Preview Terisolasi    │ User Role   │ Lingkup Otorisasi        │ Konteks Tenant / Domain     │
├────┼──────────────────────┼─────────────────────────────┼─────────────┼──────────────────────────┼─────────────────────────────┤
│ 01 │ Developer / Owner    │ preview.developer@madev.id  │ developer   │ Platform (DEVELOPER)     │ Platform Scope (default)    │
│ 02 │ Super Admin Platform │ preview.superadmin@madev.id │ super_admin │ Platform (SUPER_ADMIN)   │ Platform Scope (default)    │
│ 03 │ Admin Pesantren      │ preview.admin@madev.id      │ admin       │ Tenant Role: ADMIN       │ Tenant t_..._9g7lm (RTV01)  │
│ 04 │ Musyrif Asrama       │ preview.musyrif@madev.id    │ musyrif     │ Tenant Role: MUSYRIF     │ Tenant t_..._9g7lm (RTV01)  │
│ 05 │ Wali Santri          │ preview.wali@madev.id       │ wali        │ Tenant Role: WALI        │ Child: santri_preview_001   │
│ 06 │ Santri               │ preview.santri@madev.id     │ santri      │ Tenant Role: SANTRI      │ Santri: santri_preview_001  │
└────┴──────────────────────┴─────────────────────────────┴─────────────┴──────────────────────────┴─────────────────────────────┘
```

---

## 4. AUTHENTICATION FLOW

```text
1. Browser Client
   User mengklik tombol [ 🛡 Super Admin Platform ] pada halaman login.
   
2. Server API Route: POST /api/auth/role-preview
   - Validasi: ROLE_PREVIEW_ENABLED !== 'false' && NODE_ENV !== 'production'.
   - Validasi: role terdaftar dalam ALLOWED_PREVIEW_ROLES.
   - Mengambil password acak server-side khusus preview identity.
   - Memanggil Supabase GoTrue Auth: supabase.auth.signInWithPassword().
   - Mendekorasi Response Cookies dengan sesi SSR (sb-...-auth-token).
   - Mengembalikan { success: true, session, redirectTo: '/dashboard' }.

3. Browser Client Hydration
   - Menyinkronkan sesi ke Supabase Client: supabase.auth.setSession().
   - Menyinkronkan state pengguna ke auth-store: useAuthStore.syncUser().
   - Redirect ke /dashboard.

4. Proxy & Authorization Layer
   - src/proxy.ts memvalidasi JWT cookie via Supabase getUser().
   - Header otentikasi diinjeksikan secara transparan ke request internal.
   - Dasbor merender UI sesuai peran dan menampilkan Banner Mode Preview.
```

---

## 5. TENANT CONTEXT FLOW

* **Platform Roles (`developer`, `super_admin`)**: Beroperasi pada tingkat sistem SaaS lintas tenant.
* **Tenant Roles (`admin`, `musyrif`, `wali`, `santri`)**: Terikat secara resmi pada tenant verifikasi aktif `t_1789172137858_9g7lm` (Kode: `RTV01`, Slug: `runtime-verify-001`) yang memiliki record resmi di `public.tenants` dan `public.tenant_roles`.

---

## 6. PREVIEW DATA INVENTORY (ISOLATED & MINIMAL)

Untuk menghormati keputusan *Clean Slate* tanpa merusak tampilan UI, dibuat data preview minimum ber-prefix `preview_`:
1. **Asrama Preview**: `asrama_preview_001` (*"Asrama Preview Al-Fatih"*, Musyrif: *"Musyrif Asrama Preview"*).
2. **Santri Preview**: `santri_preview_001` (NIS: `PREV001`, *"Santri Preview Al-Fatih"*, terhubung ke `preview.santri@madev.id`).
3. **Hubungan Wali**: Pengguna `preview.wali@madev.id` memiliki atribut `child_santri_id = 'santri_preview_001'`.

---

## 7. FEATURE FLAG & SECURITY CONTROLS

* **Flag**: `ROLE_PREVIEW_ENABLED` (Default: `true` di development/test, `false` di production).
* **Aturan Otorisasi**:
  - Penolakan mutlak (HTTP 403) pada `NODE_ENV === 'production'`.
  - Penolakan mutlak (HTTP 400) pada role di luar daftar allowlist.
  - Pengubahan role via browser (localStorage/body injection) ditolak karena server memvalidasi JWT Supabase.

---

## 8. FILES MODIFIED & CREATED

### File Baru:
1. `src/app/api/auth/role-preview/route.ts`: Server-side authentication handler.
2. `src/components/shared/PreviewIndicator.tsx`: Banner indikator status preview mode.
3. `scripts/setup-role-preview.mjs`: Skrip provisioning akun dan data preview.
4. `scripts/teardown-role-preview.mjs`: Skrip pencabutan bersih data dan akun preview.
5. `tests/contracts/role-preview.contract.test.ts`: Contract & adversarial security test suite.
6. `docs/architecture/ROLE-PREVIEW-ARCHITECTURE-001.md`: Dokumen spesifikasi arsitektur.
7. `docs/architecture/ROLE-PREVIEW-REMOVAL-001.md`: Kontrak penghapusan sebelum rilis produksi.
8. `docs/architecture/ROLE-PREVIEW-TEST-MATRIX-001.md`: Matriks pengujian fungsional dan negatif.
9. `docs/runbooks/ROLE-PREVIEW-SETUP-001.md`: Panduan setup dan provisioning.
10. `docs/runbooks/ROLE-PREVIEW-TEARDOWN-001.md`: Panduan teardown data.

### File yang Diperbarui:
1. `src/app/client-page.tsx`: Penggantian area preset usang dengan tombol *Preview Platform Berdasarkan Role*.
2. `src/app/dashboard/layout.tsx`: Penyisipan `<PreviewIndicator />` di bagian atas dasbor.

---

## 9. DATABASE & SUPABASE AUTH MUTATION REPORT

```text
DATABASE MUTATION: YES (CONTROLLED PREVIEW-ONLY)
- public.tenant_roles: 3 baris baru (MUSYRIF, WALI, SANTRI untuk tenant t_1789172137858_9g7lm)
- public.users: 6 baris baru (email ber-namespace preview.*@madev.id)
- public.user_platform_roles: 2 baris (DEVELOPER, SUPER_ADMIN)
- public.user_tenant_memberships: 4 baris (ADMIN, MUSYRIF, WALI, SANTRI)
- public.asrama: 1 baris (id: asrama_preview_001)
- public.santri: 1 baris (id: santri_preview_001)

SUPABASE AUTH USERS CREATED: 6 Akun
- preview.developer@madev.id
- preview.superadmin@madev.id
- preview.admin@madev.id
- preview.musyrif@madev.id
- preview.wali@madev.id
- preview.santri@madev.id

AKUN PRODUKSI:
- superadmin@madev.id: 100% UNTOUCHED
- 6 Admin Tenant Produksi: 100% UNTOUCHED
```

---

## 10. WP-02 INTEGRITY VERIFICATION

* Migrasi `drizzle/0003_core_santri_tenantization.sql`: **IDENTIK & TIDAK BERUBAH**.
* Kolom `tenant_id` dan `user_id` pada tabel `santri`: **TERJAGA**.
* Unique constraint `uq_santri_tenant_nis` dan `uq_santri_tenant_id`: **TERJAGA**.
* Git commit baseline WP-02 (`7c41141`): **100% TERJAGA**.

---

## 11. AUTOMATED TEST RESULTS

```text
Test Suite: tests/contracts/role-preview.contract.test.ts
- should reject request with 403 when ROLE_PREVIEW_ENABLED is false:       PASS
- should reject request with 403 when running in production environment:   PASS
- should reject unknown or malicious role with 400 Bad Request:            PASS
- should reject empty role payload with 400 Bad Request:                   PASS
- should successfully authenticate role preview for [developer]:           PASS
- should successfully authenticate role preview for [super_admin]:         PASS
- should successfully authenticate role preview for [admin]:               PASS
- should successfully authenticate role preview for [musyrif]:             PASS
- should successfully authenticate role preview for [wali]:                PASS
- should successfully authenticate role preview for [santri]:              PASS

TOTAL SUITES: 32 / 32 PASSED (282 / 282 TESTS PASS, 100%)
```

---

## 12. MANUAL BROWSER TESTING CHECKLIST

Sesuai aturan Bagian 29 (*Testing Limitation*):
```text
CODE TEST:     PASS
BROWSER TEST:  NOT EXECUTED (Menunggu Pengujian Manual oleh Product Owner)
```

Langkah Pengujian Manual bagi Product Owner di Browser:
1. Buka URL: `http://localhost:3000/login`.
2. Perhatikan bagian bawah form bertajuk **"Preview Platform Berdasarkan Role"**.
3. Klik tombol **`[ 👑 Developer ]`** $\rightarrow$ Periksa apakah langsung dialihkan ke `/dashboard` dengan tampilan *Developer Helicopter View* & banner *Mode Preview*.
4. Klik **`[ Keluar Preview ]`** $\rightarrow$ Periksa apakah logout dan kembali ke `/login`.
5. Klik tombol **`[ 🛡 Super Admin ]`** $\rightarrow$ Periksa tampilan *Super Admin Platform*.
6. Klik tombol **`[ 🏫 Admin ]`** $\rightarrow$ Periksa tampilan *Admin Pesantren*.
7. Klik tombol **`[ 🕌 Musyrif ]`** $\rightarrow$ Periksa tampilan *Musyrif Asrama*.
8. Klik tombol **`[ 👨‍👩‍👧 Wali ]`** $\rightarrow$ Periksa tampilan *Wali Santri* (menampilkan santri preview).
9. Klik tombol **`[ 🎓 Santri ]`** $\rightarrow$ Periksa tampilan *Portal Santri*.
