# EEOS — ROLE PREVIEW & INSTANT AUTHENTICATION ARCHITECTURE
# WP-LOGIN-INSTANT-ROLE-PREVIEW-001

```text
WORK PACKAGE:           WP-LOGIN-INSTANT-ROLE-PREVIEW-001
STATUS:                 APPROVED ARCHITECTURAL SPECIFICATION
PURPOSE:                Development & Staging Role Preview / Instant Evaluation Engine
CORE PRINCIPLE:         TEMPORARY BY ARCHITECTURE & FAIL-CLOSED ISOLATION
TARGET ROLES:           Developer, Super Admin, Admin Pesantren, Musyrif, Wali, Santri
REMOVABILITY:           100% ISOLATED (Zero Production Core Auth Mutation)
AUTHORIZATION:          Server-Side Controller Gate + Live Supabase SSR JWT Session
WP-02 INTEGRITY:        100% UNCHANGED (Commit 7c41141 Preserved)
```

---

## 1. EXECUTIVE SUMMARY & OBJECTIVE

Fitur **Role Preview** dirancang khusus untuk memenuhi kebutuhan evaluasi dan eksplorasi Product Owner sebelum peluncuran (*pre-launch testing*). Fitur ini memungkinkan Product Owner menguji seluruh permukaan platform APP MA'HAD dari sudut pandang 6 persona/role yang berbeda hanya dengan satu klik pada halaman login, tanpa perlu mengingat atau memasukkan kata sandi secara manual.

> **ARAHAN TEGAS PRODUCT OWNER:**  
> Fitur ini **BUKAN** penghapusan kata sandi untuk sistem produksi, melainkan **jalur pintas (*shortcut*) terkontrol untuk evaluasi pengembangan**. Fitur ini dirancang secara modular dan terisolasi (*temporary by architecture*) agar dapat dinonaktifkan via *feature flag* dan dicabut (*teardown*) secara bersih tanpa meninggalkan celah keamanan (*backdoor*) di lingkungan produksi.

---

## 2. ARCHITECTURAL REQUIREMENTS & THREAT MODEL

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             ROLE PREVIEW SECURITY BOUNDARIES                                      │
├───────────────────────────────┬──────────────────────────────────────────────────────────────────┤
│ Constraint                    │ Architectural Enforcement                                         │
├───────────────────────────────┼──────────────────────────────────────────────────────────────────┤
│ Zero Secret Leakage           │ Password dan Service Role Key TIDAK PERNAH masuk ke client bundle│
│ Real Session Integrity        │ Menghasilkan JWT Supabase Auth riil (Bukan mock atau client flag)│
│ Fail-Closed Environment Gate  │ Di-disable secara otomatis di NODE_ENV === 'production'          │
│ Dedicated Identity Namespace  │ Email ber-namespace khusus (preview.*@madev.id)                  │
│ Tenant Context Scoping        │ Role tenant (Admin, Musyrif, Wali, Santri) terikat tenant riil   │
│ Production Data Immunity      │ Data produksi, WP-02, dan akun nyata (superadmin@) tidak diubah  │
│ Deterministic Teardown        │ Semua entitas preview ber-prefix "preview_" untuk pencabutan aman│
└───────────────────────────────┴──────────────────────────────────────────────────────────────────┘
```

---

## 3. COMPONENT ARCHITECTURE & DATA FLOW

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               ROLE PREVIEW END-TO-END FLOW                                       │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘

Browser (Login Page)
  │
  ├─ User clicks [ 🛡 Super Admin Platform ]
  │
  ▼
POST /api/auth/role-preview { role: "super_admin" }
  │
  ├── [1. Server Security Gate]
  │     ├── Check ROLE_PREVIEW_ENABLED !== 'false'
  │     ├── Check NODE_ENV !== 'production'
  │     └── Validate role in ALLOWLIST_ROLES
  │
  ├── [2. Server Credential Vault]
  │     └── Retrieve server-only identity for requested role (preview.superadmin@madev.id)
  │
  ├── [3. Supabase Auth Execution]
  │     ├── createServerClient (from @supabase/ssr)
  │     └── supabase.auth.signInWithPassword({ email, password })
  │
  ├── [4. Cookie Decoration]
  │     └── Set canonical SSR cookie: sb-<project>-auth-token on NextResponse
  │
  ▼
NextResponse JSON { success: true, session, redirectTo: '/dashboard' }
  │
  ▼
Browser (Client Hydration)
  │
  ├── useAuthStore.syncUser(session.user)
  ├── router.push('/dashboard')
  │
  ▼
Proxy / Middleware (src/proxy.ts)
  │
  ├── supabase.auth.getUser() -> VALID JWT!
  ├── Injects headers: x-user-id, x-user-role, x-is-super-admin
  └── Resolves tenant context
  │
  ▼
Dashboard UI (/dashboard)
  ├── Renders DeveloperDashboard / AdminDashboard / MusyrifDashboard / WaliDashboard
  └── Displays top banner: [ 👁 MODE PREVIEW: SUPER ADMIN | Keluar Preview ]
```

---

## 4. ROLE MAPPING & IDENTITY INVENTORY

Setiap role dipetakan ke identitas preview berdedikasi dengan peran otorisasi yang sah:

```text
┌──────────────────┬──────────────────────────────┬───────────────┬──────────────────────┬──────────────────────┐
│ Role Label       │ Email Preview                │ User Role     │ Role Scope           │ Tenant Context       │
├──────────────────┼──────────────────────────────┼───────────────┼──────────────────────┼──────────────────────┤
│ Developer        │ preview.developer@madev.id   │ developer     │ Platform (DEVELOPER) │ default              │
│ Super Admin      │ preview.superadmin@madev.id  │ super_admin   │ Platform (SUPER_ADMIN│ default              │
│ Admin Pesantren  │ preview.admin@madev.id       │ admin         │ Tenant (ADMIN)       │ t_1789172137858_9g7lm│
│ Musyrif Asrama   │ preview.musyrif@madev.id     │ musyrif       │ Tenant (MUSYRIF)     │ t_1789172137858_9g7lm│
│ Wali Santri      │ preview.wali@madev.id        │ wali          │ Tenant (WALI)        │ t_1789172137858_9g7lm│
│ Santri           │ preview.santri@madev.id      │ santri        │ Tenant (SANTRI)      │ t_1789172137858_9g7lm│
└──────────────────┴──────────────────────────────┴───────────────┴──────────────────────┴──────────────────────┘
```

* **Target Tenant**: Menggunakan tenant verifikasi aktif `t_1789172137858_9g7lm` (Kode: `RTV01`, Slug: `runtime-verify-001`).
* **Akun Produksi `superadmin@madev.id`**: Tetap murni sebagai akun produksi dan tidak disentuh.

---

## 5. ISOLATED PREVIEW DATA INVENTORY

Untuk memastikan tampilan *Wali*, *Santri*, dan *Musyrif* menampilkan metrik yang hidup tanpa mencemari data institusi nyata, disiapkan data preview minimal:

1. **Preview Asrama**:
   - `id`: `asrama_preview_001`
   - `name`: `Asrama Preview Al-Fatih`
   - `musyrif`: `Musyrif Preview`
   - `tenant_id`: `t_1789172137858_9g7lm`
2. **Preview Santri**:
   - `id`: `santri_preview_001`
   - `nis`: `PREV001`
   - `name`: `Santri Preview Al-Fatih`
   - `tenant_id`: `t_1789172137858_9g7lm`
   - `user_id`: UID akun `preview.santri@madev.id`
   - `status`: `aktif`
   - `status_karakter`: `Baik`
3. **Preview Wali-Santri Link**:
   - `id`: `wsr_preview_001`
   - `tenant_id`: `t_1789172137858_9g7lm`
   - `wali_user_id`: UID akun `preview.wali@madev.id`
   - `santri_id`: `santri_preview_001`
   - `relationship_type`: `AYAH`
   - `status`: `ACTIVE`

---

## 6. FEATURE FLAG & SERVER-SIDE ENFORCEMENT

* **Environment Variable**: `ROLE_PREVIEW_ENABLED`
  - Default pada mode `development` dan `test`: `true`.
  - Default pada mode `production`: `false`.
* **Enforcement Point**:
  - Di `src/app/api/auth/role-preview/route.ts`:
    ```typescript
    if (process.env.ROLE_PREVIEW_ENABLED === 'false' || process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Fitur Role Preview dinonaktifkan di lingkungan ini.' },
        { status: 403 }
      );
    }
    ```
  - Di halaman login UI: Komponen pemilih preset hanya dirender jika flag aktif.

---

## 7. TEARDOWN & REVERSIBILITY GUARANTEE

Semua identitas dan data preview dapat dihapus dalam satu eksekusi skrip:
* `scripts/teardown-role-preview.mjs`
* Skrip hanya menyaring baris dengan:
  - `email LIKE 'preview.%@madev.id'`
  - `id LIKE 'preview_%'` atau `id LIKE '%preview%'`
* Akun non-preview (seperti `superadmin@madev.id`, 6 tenant admin asli, dll) terproteksi dengan klausa *fail-closed*.

---

## 8. WP-02 INTEGRITY DECLARATION

Sistem Role Preview tidak memodifikasi skema basis data, constraint DDL, atau commit migrasi WP-02:
* `drizzle/0003_core_santri_tenantization.sql`: **100% UNCHANGED**
* Commit `7c41141`: **100% UNCHANGED**
* Constraint `uq_santri_tenant_nis` dan `uq_santri_tenant_id`: **100% TERJAGA**
