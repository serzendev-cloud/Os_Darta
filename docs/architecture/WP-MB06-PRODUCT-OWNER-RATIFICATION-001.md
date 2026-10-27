# EEOS — CORE SANTRI TENANTIZATION & NIS REMEDIATION
# PRODUCT OWNER RATIFICATION RECORD (MB-06)

```text
WORK PACKAGE:           WP-MB06-PRODUCT-OWNER-RATIFICATION-001
GOVERNANCE GATE:        EEOS PRODUCT OWNER RATIFICATION GATE (MB-06 CLOSURE)
OPERATING MODE:         RATIFICATION / DECISION RECORDING ONLY (ZERO MUTATION)
DATABASE ENVIRONMENT:   LIVE TARGET DATABASE (PostgreSQL 17.6 / Supabase) — UNTOUCHED
APPLICATION CODE:       UNTOUCHED (ZERO MUTATION)
DATE:                   2026-09-20
EEOS AUDITOR:           Senior Principal Systems Architect, Database Architect, Security Architect
FINAL RATIFICATION:     PRODUCT OWNER OFFICIALLY RATIFIED
GOVERNANCE VERDICT:     MB-06 RATIFIED — ARCHITECTURALLY CLOSED — READY FOR IMPLEMENTATION PLANNING
```

---

## 1. RATIFICATION HEADER

Dokumen ini merupakan catatan resmi (*official ratification record*) atas pengesahan keputusan arsitektural untuk **MB-06 — Native App Tenant Resolution UX, Persistent Login & Blocker Remediation**.

Product Owner, selaku pemegang otoritas keputusan bisnis tertinggi sistem APP MA'HAD (EEOS), telah meninjau hasil rancangan arsitektur dan secara eksplisit menetapkan pilihan pada seluruh gerbang keputusan terbuka (*Decision Gates*).

---

## 2. SOURCE DOCUMENTS

Pemeriksaan konsistensi dan ratifikasi ini bersandar secara ketat pada dokumen fondasi arsitektur berikut:

1. [`docs/architecture/WP-MB06-ARCHITECTURAL-BLOCKER-REMEDIATION-001.md`](file:///e:/Projects/Os_Darta/docs/architecture/WP-MB06-ARCHITECTURAL-BLOCKER-REMEDIATION-001.md) — *Laporan Desain Remediasi 3 Blocker MB-06 (Source of Truth)*
2. [`docs/architecture/WP-MB06-NATIVE-TENANT-RESOLUTION-DECISION-001.md`](file:///e:/Projects/Os_Darta/docs/architecture/WP-MB06-NATIVE-TENANT-RESOLUTION-DECISION-001.md) — *Laporan Konsistensi & Keputusan Bisnis MB-06*
3. [`docs/architecture/WP-CORE-SANTRI-TENANTIZATION-REMEDIATION-BLUEPRINT-001.md`](file:///e:/Projects/Os_Darta/docs/architecture/WP-CORE-SANTRI-TENANTIZATION-REMEDIATION-BLUEPRINT-001.md) — *Blueprint Remediasi Santri Revision 001*
4. [`docs/architecture/WP-CLEAN-SLATE-DUMMY-DATA-AUDIT-001.md`](file:///e:/Projects/Os_Darta/docs/architecture/WP-CLEAN-SLATE-DUMMY-DATA-AUDIT-001.md) — *Laporan Audit Data Dummy & Rencana Reset*
5. [`docs/architecture/WP-PSB-ALUMNI-DDL-DESIGN-001.md`](file:///e:/Projects/Os_Darta/docs/architecture/WP-PSB-ALUMNI-DDL-DESIGN-001.md) — *Desain Skema Identitas & PSB-Alumni (TIR-009)*

---

## 3. LOCKED MB-06 DECISIONS (IMMUTABLE INVARIANTS)

Seluruh parameter bisnis berikut dinyatakan **TETAP TERKUNCI (*LOCKED*)** dan tidak mengalami perubahan:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PARAMETER ARSITEKTURAL TERKUNCI (MB-06)                         │
├────────────────────────────────────────┬───────────────────────────────────────────────┤
│ Model Distribusi Aplikasi              │ Satu Aplikasi Native Global (iOS & Android)   │
│ Antarmuka Login                        │ Satu Login Surface Tunggal (Tab NIS / Email)  │
│ Backend Target                         │ Shared Universal API Gateway (BFF Terpadu)    │
│ NIS Domain Boundary                    │ Pure Domain Identifier (tanpa prefix kode)    │
│ Database Constraint                    │ UNIQUE (tenant_id, nis)                       │
│ Tenant Code Status                     │ Konteks pencarian awal; BUKAN bukti otorisasi │
│ Sesi Login Native                      │ Persisten via SecureStore; App Close ≠ Logout │
│ Hak Otorisasi                          │ Server-validated JWT + Membership Aktif + RLS │
│ Status Penyimpanan Perangkat           │ Zero-Trust Device Cache (Bukan otoritas)      │
└────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 4. BLOCKER 01 RATIFICATION: NATIVE TENANT RESOLUTION & PROXY

Product Owner secara penuh meratifikasi **Opsi C: Server-Validated Context Architecture**:

1. **Penghapusan Kerentanan Fallback**:
   - Menghapus aturan fallback `x-tenant-id = default-tenant` dari seluruh rute terproteksi (`/api/*`).
   - Request unauthenticated atau request tanpa membership yang valid wajib menghasilkan **HTTP 401 Unauthorized** atau **HTTP 403 Forbidden** (*Fail Closed*).
2. **Prinsip Intent vs Authority**:
   - Header klien `X-Tenant-Context` diperlakukan murni sebagai **pernyataan niat (intent)**.
   - Gateway server memverifikasi token JWT (`auth.uid()`), memeriksa keanggotaan aktif pada tabel `user_tenant_memberships`, lalu menimpa (*overwrite*) header hilir dengan `x-tenant-id` yang sah hasil verifikasi basis data.
3. **BFF Endpoint Terisolasi**:
   - Penyediaan endpoint terisolasi `POST /api/auth/login-nis` untuk memproses kombinasi `(Tenant Code, NIS, Password)`.
   - Penyusunan format email sintetis `{nis}@{tenant_slug}.mahad.internal` dieksekusi secara terselubung di sisi server dan tidak pernah diekspos ke klien native.
4. **Tenant Switching**:
   - Pengguna dengan multi-membership dapat berpindah institusi secara instan dengan mengirimkan `X-Tenant-Context` baru yang divalidasi ulang oleh server tanpa perlu mencetak ulang (*re-mint*) token JWT.

---

## 5. BLOCKER 02 RATIFICATION: TENANT CODE SCHEMA REPRESENTATION

Product Owner meratifikasi adopsi kolom kanonikal terdedikasi pada tabel `tenants`:

```text
================================================================================
SPESIFIKASI RESMI TENANT CODE (RATIFIED)
================================================================================
Nama Kolom:              public.tenants.code
Tipe Data:               VARCHAR(10) NOT NULL
Format Validasi:         Regex: ^[A-Z0-9]{2,10}$ (Uppercase Alfanumerik)
Integritas Indeks:       CREATE UNIQUE INDEX uq_tenants_code_upper ON public.tenants (UPPER(code));
Sifat Nilai:             Globally Unique & IMMUTABLE (Tidak berubah setelah ditetapkan)
Normalisasi Server:      TRIM(UPPER(code)) dieksekusi otomatis pada setiap input

Fungsi Resmi:
  - Input kode institusi pada login NIS aplikasi native mobile.
  - Prefix visual nomor kartu santri (Smartcard / RFID).
  - Identifikasi singkat pada gateway notifikasi SMS / WhatsApp.

Larangan Penggunaan:
  - DILARANG digunakan sebagai Primary Key basis data (PK tetap `tenants.id`).
  - DILARANG digunakan sebagai Foreign Key pada child tables (FK tetap ke `tenants.id`).
  - DILARANG digunakan sebagai pengganti `tenants.slug` untuk routing web.
  - DILARANG dijadikan bukti hak otorisasi keamanan tanpa validasi keanggotaan.
================================================================================
```

---

## 6. BLOCKER 03 RATIFICATION: SANTRI USER IDENTITY RELATION

Product Owner meratifikasi perancangan relasi identitas santri bertahap (*lifecycle-aware*):

```text
================================================================================
SPESIFIKASI RELASI IDENTITAS SANTRI (RATIFIED)
================================================================================
Definisi Kolom:          public.santri.user_id TEXT NULL
Foreign Key Constraint:  CONSTRAINT fk_santri_user FOREIGN KEY (user_id) 
                         REFERENCES public.users(id) ON DELETE RESTRICT
Keunikan per Tenant:     CREATE UNIQUE INDEX uq_santri_tenant_user_id 
                         ON public.santri (tenant_id, user_id) 
                         WHERE user_id IS NOT NULL;
Integritas Hapus:        ON DELETE RESTRICT (Mencegah penghapusan akun jika santri aktif)

Aturan Siklus Hidup (Lifecycle Rules):
  1. Fase Pendaftaran / PSB: `santri.user_id` bernilai NULL (Belum diprovisi).
  2. Fase Matrikulasi Massal: `santri.user_id` bernilai NULL (Mendukung batch import).
  3. Fase Aktivasi Akun: Sistem memprovisi `public.users` & `auth.users`, lalu mengaitkan `santri.user_id`.
  4. Fase Operasional Aktif: `santri.user_id` wajib NOT NULL untuk login native.
  5. Fase Kelulusan / Alumni: Relasi identitas dipertahankan; integrasi TIR-009 
     mencatat transisi ke `user_tenant_personas(ALUMNI)` tanpa menduplikasi rekam jejak manusia.
================================================================================
```

---

## 7. DECISION GATE A — TENANT CODE LENGTH

Dua opsi diusulkan pada laporan remediasi:
- **Option A**: Maksimal 6 Karakter (`VARCHAR(6)`, misal `DRT`, `ALF`, `PPM01`).
- **Option B**: Maksimal 10 Karakter (`VARCHAR(10)`, misal `DRT`, `ALF`, `DARUSSALAM`).

---

## 8. DECISION GATE B — DDL STRATEGY

Dua opsi pengorganisasian DDL diusulkan:
- **Option A (Consolidated)**: Menggabungkan `tenants.code` dan `santri.user_id` langsung ke dalam paket **WP-02 (Core Santri DDL)** sebagai satu kesatuan atomik.
- **Option B (Separate)**: Memisahkan penambahan kolom persiapan ke dalam migrasi tersendiri sebelum WP-02.

---

## 9. PRODUCT OWNER DECISIONS (EXPLICIT RECORD)

Berdasarkan formulasi keputusan resmi yang dipilih langsung oleh Product Owner:

```text
================================================================================
RECORD KEPUTUSAN FINAL PRODUCT OWNER
================================================================================
[DECISION GATE A]  TENANT_CODE_MAX_LENGTH = 10
                   Pilihan: OPTION B (MAX 10 CHARACTERS)
                   Spesifikasi: VARCHAR(10), Regex ^[A-Z0-9]{2,10}$
                   Rasional: Memberikan fleksibilitas optimal untuk menampung
                             kode singkat (3-6 karakter seperti DRT, ALF) maupun
                             akronim resmi institusi hingga 10 karakter.

[DECISION GATE B]  DDL_STRATEGY = CONSOLIDATED
                   Pilihan: OPTION A (CONSOLIDATED INTO WP-02)
                   Spesifikasi: Menyatukan DDL penambahan `tenants.code`,
                                `santri.tenant_id`, `santri.user_id`, serta indeks
                                dan constraints terkait ke dalam WP-02.
                   Rasional: Meminimalkan jumlah boundary migrasi, memastikan urutan
                             dependensi terjamin rapi, dan mempermudah audit rilis
                             sebagai satu unit arsitektural terpadu.
================================================================================
```

---

## 10. CROSS-DOMAIN CONSISTENCY CHECK

Pemeriksaan konsistensi komprehensif dilakukan pasca ratifikasi kedua keputusan terhadap seluruh domain sistem:

```text
┌────┬─────────────────────────────┬────────────────────────────────┬──────────────────────────────┬───────────┐
│ No │ Domain Sistem               │ Keputusan Eksisting Terkunci   │ Keputusan Ratifikasi Baru    │ Konflik?  │
├────┼─────────────────────────────┼────────────────────────────────┼──────────────────────────────┼───────────┤
│ 1  │ Tenant Code                 │ Belum ada field di DB          │ VARCHAR(10) UNIQUE UPPERCASE │ **TIDAK** │
│ 2  │ Nomor Induk Santri (NIS)    │ UNIQUE (tenant_id, nis)        │ NIS murni tanpa prefix kode  │ **TIDAK** │
│ 3  │ Kepemilikan Santri          │ 1 Santri = 1 Tenant            │ Terisolasi penuh per tenant  │ **TIDAK** │
│ 4  │ Relasi Identitas Santri     │ santri.user_id direncanakan    │ santri.user_id FK RESTRICT   │ **TIDAK** │
│ 5  │ Native Login Flow           │ Universal Single App           │ BFF /api/auth/login-nis      │ **TIDAK** │
│ 6  │ Tenant Switching            │ Multi-membership persona       │ Server-validated context     │ **TIDAK** │
│ 7  │ Konsolidasi Identitas       │ TIR-009 Ledger & Multi-Persona │ Kompatibel penuh ledger UID  │ **TIDAK** │
│ 8  │ Penerimaan Santri (PSB)     │ psb_applicants & acceptance    │ user_id nullable saat awal   │ **TIDAK** │
│ 9  │ Portal Alumni               │ user_tenant_personas (ALUMNI)  │ user_id awet saat kelulusan  │ **TIDAK** │
│ 10 │ Isolasi Basis Data (RLS)    │ Menunggu Decision Gate 4       │ Siap konsumsi server context │ **TIDAK** │
│ 11 │ Batasan Guru / Ustadz       │ Menunggu Decision Gate 3       │ Tidak membatasi skema guru   │ **TIDAK** │
└────┴─────────────────────────────┴────────────────────────────────┴──────────────────────────────┴───────────┘
```

**Hasil Audit:** **100% KONSISTEN. NOL KONTRADIKSI ARSITEKTURAL.**

---

## 11. REMAINING OPEN GATES (SEPARATELY CONTROLLED)

Ratifikasi MB-06 secara formal menutup seluruh kontradiksi arsitektural pada domain native login dan identitas santri, namun **TIDAK membuka atau mengubah gerbang keputusan lain yang masih terbuka**:

```text
┌─────────────────────────────────┬───────────────────┬──────────────────────────────────────────┐
│ Gerbang Keputusan Lain          │ Status Saat Ini   │ Keterangan Tata Kelola                   │
├─────────────────────────────────┼───────────────────┼──────────────────────────────────────────┤
│ Gate 1: Clean Slate Execution   │ READY TO EXECUTE  │ Runbook telah siap, menunggu eksekusi    │
│ Gate 3: Guru Scope Boundary     │ OPEN (DECISION 3) │ GURU-1 (Concurrent) vs GURU-2 (Deferred) │
│ Gate 4: Database RLS Strategy   │ OPEN (DECISION 4) │ RLS-1 (FORCE RLS) vs RLS-2 (Dedicated)   │
└─────────────────────────────────┴───────────────────┴──────────────────────────────────────────┘
```

---

## 12. FINAL EEOS VERDICT

Dengan terekamnya keputusan eksplisit Product Owner untuk Decision Gate A (`VARCHAR(10)`) dan Decision Gate B (`CONSOLIDATED DDL`), serta terbuktinya konsistensi lintas domain secara menyeluruh:

```text
================================================================================
EEOS GOVERNANCE FINAL VERDICT
================================================================================
STATUS RESMI:
  MB-06 RATIFIED
  ARCHITECTURALLY CLOSED
  READY FOR IMPLEMENTATION PLANNING

STATUS MUTASI:
  DATABASE MUTATION:        0 (TIDAK ADA PERUBAHAN BASIS DATA)
  MIGRATION EXECUTED:       0 (TIDAK ADA MIGRASI DIJALANKAN)
  CODE MODIFICATION:        0 (TIDAK ADA KODE APLIKASI DIUBAH)
  GIT COMMIT / PUSH:        0 (TIDAK ADA REPOSITORY MUTATION)
================================================================================
```

---

## 13. ABSOLUTE STOP CONDITION & SIGN-OFF

Sesuai aturan tata kelola mutlak EEOS (*Governance Rule Section 18*):
- [x] Keputusan Product Owner atas Gate A dan Gate B telah dicatat secara sah.
- [x] Laporan ratifikasi resmi telah diterbitkan.
- [x] Pemeriksaan konsistensi lintas domain telah diverifikasi dengan hasil nol konflik.
- [x] Seluruh proses implementasi, penulisan migrasi, modifikasi kode, dan komit Git **DIBEKUKAN**.

**PROSES DIHENTIKAN SECARA MUTLAK (ABSOLUTE STOP).**  
Sistem menunggu arahan Product Owner untuk membuka tahap otorisasi eksekusi migrasi dan implementasi berikutnya.
