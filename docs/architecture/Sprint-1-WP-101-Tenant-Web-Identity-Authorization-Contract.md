# EEOS Sprint 1 — WP-101 Phase 1B.1 Tenant Web Identity & Authorization Context Hardening
## APP MA'HAD ENTERPRISE SaaS ERP
### Document Status: ARCHITECTURE CORRECTION PATCH & RECONCILED CONTRACT — LOCKED
### Authority: Senior Principal Systems Architect & Chief Engineering Architect Specification
### Date: August 17, 2026

---

> [!IMPORTANT]
> **GOVERNANCE DIRECTIVE — ABSOLUTELY NO IMPLEMENTATION**:
> Dokumen ini merupakan **DESIGN / CONTRACT / HARDENING AUDIT ONLY**.
> - **Runtime Code Modified**: 0 files
> - **Database Schema / Migration**: 0 created
> - **API Endpoints / Server Actions**: 0 created
> - **Authentication Engine / Password Hash Columns**: 0 created
> - **UI Components / Middleware**: 0 modified
> - **Git Commits / Pushes / PRs**: 0 executed
> 
> Seluruh aktivitas coding tetap ditahan (**HARD STOP**) hingga persetujuan formal diajukan untuk memulai **WP-101 Phase 1C**.

---

## 1. GROUND-TRUTH FORENSIC AUDIT OF EXISTING REPOSITORY

Sesuai **Rule 1 (Ground-Truth Rule)** dan **Rule 22 (Required Ground-Truth Audit)**, berikut adalah temuan audit fisik codebase per 17 Agustus 2026:

| Component / Domain | Evidence Physical Codebase | Status Classification | Forensic Findings & Refactoring Direction |
| :--- | :--- | :--- | :--- |
| **User Identity Schema** | `src/lib/db/schema.ts:36-46` (`users` table) | **CONFIRMED** | `id`, `tenantId`, `name`, `email`, `role`, `childSantriId` ada. Belum ada kolom `phone_number` di `users`. |
| **Santri & Wali Data** | `src/lib/db/schema.ts:49-75` (`santri` table) | **CONFIRMED** | `nis` (unique), `waliName`, `waliPhone` ada pada `santri` table. Belum ada tabel `wali_santri_relationships`. |
| **Guardian Relationship** | `santri.waliPhone` & `santri.waliId` di Drizzle schema | **PARTIALLY CONFIRMED** | Data HP Wali tersimpan di record santri, tetapi tabel relasi n-to-n multi-anak belum ada di DB. |
| **Subdomain Extraction** | `src/proxy.ts:13-26` | **CONFIRMED** | Micro-proxy mengekstrak host; sanitasi untrusted client header (`x-tenant-id`) belum di-apply. |
| **Supabase Auth Integration** | `src/lib/firebase/auth.ts` (Legacy) & Drizzle schema mock | **PARTIALLY CONFIRMED** | Supabase Auth menjadi target kanonis; DB `users` belum memiliki FK ke `auth.users.id`. |
| **Device Biometric / Passkey**| Tidak ada SDK WebAuthn / Passkey di `src/` | **FUTURE AUTHENTICATION IMPLEMENTATION** | Biometric/Passkey UX berada pada phase autentikasi mendatang. |
| **Multi-Child Relationship Schema**| Belum ada tabel `wali_santri_relationships` di `src/lib/db/schema.ts` | **ARCHITECTURE GAP** | Didefinisikan dalam dokumen kontrak ini untuk pembuatan skema pada Phase 1C. |

---

## 2. CRITICAL CORRECTION & CONTRACT REVOCATION

> [!CAUTION]
> **CRITICAL ARCHITECTURE CORRECTION**:
> Kontrak lama yang menyatakan:
> - $\text{Initial Login ID} = \text{NIS Santri}$
> - $\text{Initial Password} = \text{anaksolehku123}$
> 
> **RESMI DICABUT TOTAL**. Penggunaan NIS sebagai login ID Wali dan `anaksolehku123` sebagai password universal **DILARANG KERAS** dijadikan arsitektur kanonis.

### New Canonical Contract (Locked)
1. **INITIAL WALI LOGIN IDENTIFIER**: **NOMOR HP WALI YANG TERDAFTAR** (*Registered Wali Phone Number*).
2. **INITIAL PASSWORD**: **TEMPORARY CREDENTIAL UNIK PER AKUN** (*Unique Temporary Password per account*).
3. **NIS SANTRI**: **SANTRI IDENTIFIER ONLY** (Hanya identitas kesiswaan santri, BUKAN kredensial login Wali).

---

## 3. CANONICAL WALI IDENTITY MODEL

Arsitektur menetapkan model identitas satu Wali untuk banyak anak sebagai berikut:

```
                    WALI USER
                        │
                        ▼
               ONE USER ACCOUNT
           (users.id / auth.users.id)
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
      Santri A       Santri B       Santri C
       NIS 001        NIS 002        NIS 003
  (Relasi Wali #1) (Relasi Wali #2) (Relasi Wali #3)
```

- **Satu Wali = Satu Platform User Account**: Satu Wali Santri hanya memiliki **SATU** akun platform Supabase Auth (`users.id`).
- **Pendaftaran Anak Baru**: Menambahkan anak baru (misal Santri B di Tahun ke-3) **TIDAK MEMBUAT** akun user Supabase Auth baru. Penambahan anak baru **HANYA MEMBUAT** entitas `Wali ↔ Santri Relationship` baru pada akun Wali yang sudah ada.

---

## 4. CANONICAL 5-WAY IDENTITY SEPARATION

Sistem membedakan 5 entitas identitas terpisah yang terikat secara hirarkis:

$$\text{Supabase Auth UID} \neq \text{Application User ID (users.id)} \neq \text{Wali Phone Number} \neq \text{Santri NIS} \neq \text{Santri ID}$$

```text
Supabase Auth UID (auth.users.id)
       │
       ▼
Application User ID (public.users.id)
       │
       ▼
Wali User Account (Login Key: Phone Number)
       │
       ▼
Wali-Santri Relationship Entity
       │
       ▼
Santri Entity (public.santri.id)
       │
       ▼
NIS (Nomor Induk Santri)
```

---

## 5. INITIAL ACCOUNT PROVISIONING & TEMPORARY CREDENTIAL SECURITY

### A. Initial Provisioning Workflow
Saat santri pertama kali didaftarkan di pesantren:
1. System melakukan lookup `wali_phone` pada database tenant.
2. Jika Nomor HP Wali **belum memiliki akun**: System menerbitkan akun Supabase Auth baru dengan Login ID = Nomor HP Wali & Password = **Temporary Credential Unik**.
3. Jika Nomor HP Wali **sudah memiliki akun**: System **TIDAK** membuat akun baru, melainkan langsung mengaitkan entitas `Wali ↔ Santri Relationship` baru ke akun Wali tersebut.

### B. Temporary Password Security Policy
- **Unik Per Akun**: Temporary password **WAJIB BERBEDA** antar setiap akun yang diprovadasi.
- **DILARANG HARDIK**:
  - Menggunakan password universal (e.g. `anaksolehku123`).
  - Menggunakan password berdasarkan nama, NIS, atau Nomor HP user.
  - Menyimpan temporary password plaintext di database aplikasi.
- **Privacy Constraint**: Temporary password **DILARANG KERAS** diekspos melalui API response setelah provisi, client state, browser storage, log, audit log, DB plaintext, tenant API, atau Super Admin API.

---

## 6. FIRST LOGIN STATE MACHINE & ACCOUNT STATUS TAXONOMY

```text
 Wali Input Phone Number + Unique Temp Password
                       │
                       ▼
           Supabase Auth Verification
                       │
                       ▼
            Authentication Success
                       │
                       ▼
          account.status == MUST_CHANGE_PASSWORD?
          ┌────────────┴────────────┐
          │ (YES)                   │ (NO)
          ▼                         ▼
Force Password Reset Gate     Normal Access Granted (ACTIVE)
 (Access Restricted to Reset)
```

### Account Status State Machine Taxonomy
1. **`ACTIVE`**: Akun aktif dengan password kustom yang sah. Akses aplikasi normal diberikan.
2. **`MUST_CHANGE_PASSWORD`**: User berhasil autentikasi awal tetapi **WAJIB** mengganti password sebelum mendapatkan akses ke fitur lain. Akses dibatasi **HANYA** untuk flow ganti password. Bypass via Direct URL / client state manipulation **STRICTLY BLOCKED** (Fail Closed).
3. **`SUSPENDED`**: Akses ditolak sementara oleh admin tenant.
4. **`DISABLED`**: Akses ditolak secara permanen.

---

## 7. ADD CHILD FLOW & CHILD CONTEXT SWITCHING

### A. Add Child Workflow (Existing Wali)
```text
Settings Menu ──► Tambah Anak ──► Input NIS Santri ──► Verify Wali Relationship ──► Create Relationship Link ──► Child Available in Switcher
```
Pendaftaran anak kedua/ketiga **DILARANG** membuat akun Supabase Auth baru atau kreden login baru.

### B. Child Context Switching Security
Wali dengan banyak anak dapat berpindah tampilan anak (*Switch Active Child*) di dalam aplikasi:
- **No Session Duplication**: Switching child **TIDAK MENGUBAH** `user_id` dan **TIDAK MEMBUAT** sesi autentikasi baru. User ID tetap milik Wali (`user_id = WALI_USER_001`).
- **Active Context Only**: Yang berubah hanya `active_child_context` di server-side.

---

## 8. SECURITY ACCEPTANCE & AUTHORIZATION CHAIN

Akses data Wali dievaluasi secara ketat melalui **Authorization Chain**:

```text
Authenticated User (Wali)
       │
       ▼
UserTenantMembership Check (tenant_id)
       │
       ▼
WALI Role Check
       │
       ▼
Permission Verification
       │
       ▼
Active Wali-Santri Relationship Check (Server-Side Verified)
       │
       ▼
Target Santri Data Access (GRANTED / DENIED)
```

> [!WARNING]
> **NO AUTOMATIC ADMINISTRATIVE PERMISSIONS**:
> Login Wali **HANYA** memberikan `WALI Role` + `ACTIVE Wali-Santri Relationship`. Wali **TIDAK AUTOMATIS** mendapatkan permission `SUPER_ADMIN`, `DEVELOPER`, `TENANT ADMIN`, `FINANCE ADMIN`, `SAVINGS WITHDRAW`, atau `TENANT WITHDRAWAL`.
> Client-supplied `child_id`, `nis`, atau `tenant_id` **BUKAN BUKTI OTORISASI**. Server wajib memverifikasi relasi secara independen.

---

## 9. DEVICE BIOMETRIC & RECOVERY BOUNDARIES

### A. Biometric & Passkey Security Boundary
- Raw biometric data (*fingerprint image*, *face scan*, *template*) **DILARANG KERAS** dikirim atau disimpan di database server.
- Menggunakan *Platform Authenticator* yang menggenerasi *WebAuthn / Passkey Assertion* yang diverifikasi di server.
- Klasifikasi: **`FUTURE AUTHENTICATION IMPLEMENTATION`**.

### B. Local Pattern Security
- Keamanan Pola (*Pattern Unlock*) adalah fitur kunci perangkat lokal saja (*Local Device Unlock*). Pattern dilarang dikirim sebagai plaintext ke server.
- Klasifikasi: **`FUTURE TECHNICAL DECISION`**.

### C. Secure Account Recovery
- Password authentication & password recovery via Supabase Auth tetap aktif sebagai mekanisme pemulihan utama meskipun Passkey/Biometrik nantinya dikonfigurasi.

---

## 10. PHONE NUMBER POLICY & OPEN ARCHITECTURE DECISIONS

- **Initial Login Identifier**: Nomor HP Wali yang terdaftar saat registrasi santri.
- **Normalisasi E.164**: Nomor HP diselaraskan ke format standar internasional (e.g. `+628123456789`).
- **Open Decision Register**:
  - `DEC-ID-01`: Penanganan kasus 1 keluarga / 2 Wali (Ayah & Ibu) berbagi 1 nomor HP yang sama $\rightarrow$ **`OPEN BUSINESS / ARCHITECTURE DECISION`**.
  - `DEC-ID-02`: Mekanisme pembaharuan nomor HP Wali & alur pemulihan akun saat nomor HP hilang/ganti $\rightarrow$ **`ARCHITECTURE GAP`**.

---

## 11. RECONCILIATION OF ARCHITECTURE DOCUMENTS

Berikut adalah matriks rekonsiliasi seluruh referensi lama di dalam dokumentasi arsitektur yang telah diperbarui:

| Term / Rule Lama (Revoked) | Reconciled Canonical Rule (Locked) | Documents Affected |
| :--- | :--- | :--- |
| `Initial Login ID = NIS Santri` | **Initial Login ID = Nomor HP Wali Terdaftar** | `Sprint-1-WP-101-*.md` (Section 2, 6) |
| `Initial Password = anaksolehku123` | **Initial Password = Temporary Credential Unik Per Akun** | `Sprint-1-WP-101-*.md` (Section 2, 5, 6) |
| `NIS sebagai Credential Wali` | **NIS = Student Identifier Only** | `Sprint-1-WP-101-*.md` (Section 4, 9) |
| `Multi-Account per Child` | **1 Wali = 1 Platform User Account (Multi-Child Relationships)** | `Sprint-1-WP-101-*.md` (Section 3, 7) |

---

## 12. REQUIRED ARCHITECTURAL INVARIANTS (INV-ID)

- **`INV-ID-01`**: Parents maintain exactly ONE platform user account across all their enrolled children. Adding a child NEVER spawns a new auth user.
- **`INV-ID-02`**: Initial Wali login identifier MUST be the registered parent phone number. NIS is strictly a student identifier.
- **`INV-ID-03`**: Initial temporary passwords MUST be unique per account and forced to change on first login (`MUST_CHANGE_PASSWORD = TRUE`).
- **`INV-ID-04`**: Application tables MUST NEVER store plaintext passwords, temporary credentials, or custom `password_hash` columns.
- **`INV-ID-05`**: Account status `MUST_CHANGE_PASSWORD` MUST restrict user access solely to the password reset flow.
- **`INV-ID-06`**: Active child context switching MUST NOT alter `user_id` or create new authentication sessions.
- **`INV-ID-07`**: Child data authorization MUST strictly verify the active server-side Wali-Santri relationship.
- **`INV-ID-08`**: Wali accounts MUST NOT automatically receive administrative or financial withdrawal permissions.
- **`INV-ID-09`**: Raw biometric data MUST NEVER be sent to or stored on application servers.
- **`INV-ID-10`**: Supabase Auth UID remains the primary system-of-record user UUID (`users.id`).

---

## 13. PHASE 1B.1 DECISION GATE & GOVERNANCE METRICS

### Execution Governance Metrics Verification
```text
Runtime code modified      : 0 / 0
Database schema modified   : 0 / 0
Migrations created         : 0 / 0
API endpoints modified     : 0 / 0
UI components modified     : 0 / 0
Auth implementation        : 0 / 0
Biometric implementation   : 0 / 0
Commits executed           : 0 / 0
Push executed              : 0 / 0
PR created                 : 0 / 0
```

### Final Decision Gate Evaluation:
# **`PASS — IDENTITY CONTRACT READY FOR WP-101 PHASE 1C`**

Seluruh koreksi arsitektur identitas (pencabutan NIS login & password universal `anaksolehku123`, penetapan Login ID Nomor HP Wali & Temporary Password Unik, serta model Single Wali Account) telah direkonsiliasi secara penuh pada dokumen arsitektur tanpa menyentuh runtime code.
