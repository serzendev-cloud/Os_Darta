# EEOS — CORE SANTRI TENANTIZATION & NIS REMEDIATION
# WP-02 FINAL DDL CONTRACT INTEGRITY CHECK REPORT

```text
WORK PACKAGE:           WP-02-FINAL-DDL-CONTRACT-INTEGRITY-CHECK-001
GOVERNANCE GATE:        EEOS FINAL CONTRACT INTEGRITY CHECK BEFORE WP-02 AUTHORIZATION
OPERATING MODE:         READ-ONLY / FORENSIC / CONTRACT VERIFICATION (ZERO MUTATION)
DATABASE ENVIRONMENT:   LIVE TARGET DATABASE (PostgreSQL 17.6 / Supabase) — UNTOUCHED
APPLICATION CODE:       UNTOUCHED (ZERO MUTATION)
GIT STATUS:             ZERO COMMIT / ZERO PUSH
DATE:                   2026-09-20
EEOS AUDITORS:          Principal Database Architect, PostgreSQL Security Architect, Multi-Tenant Specialist
CONTRACT AUDIT VERDICT: BLOCKED (2 DISCREPANCIES DETECTED IN DDL SPECIFICATION)
AUTHORIZATION STATUS:   PRODUCT OWNER AUTHORIZATION NOT PERMITTED UNTIL REMEDIATED
```

---

## 1. OBJECTIVE & BACKGROUND

Pemeriksaan integritas kontrak DDL final (*final DDL contract integrity check*) ini dilakukan sebelum Product Owner memberikan otorisasi eksekusi `AUTHORIZE WP-02 IMPLEMENTATION`.

Prinsip dasar tata kelola arsitektur EEOS menetapkan:
```text
ARCHITECTURAL INVARIANT (MB-06, Gate 3, Gate 4)
                      =
DATABASE RELATIONAL CONTRACT (PostgreSQL Engine Enforcement)
                      =
DDL IMPLEMENTATION ARTIFACT (Actual Migration Script)
```
Tidak boleh ada toleransi, celah fallback liar, atau asumsi konseptual yang membedakan ketiganya. Jika DDL aktual belum sepenuhnya menegakkan kontrak arsitektur di tingkat mesin basis data (*Fail-Closed Database Enforcement*), gerbang otorisasi implementasi **WAJIB DIBLOKIR (*BLOCKED*)**.

---

## 2. ABSOLUTE NO-MUTATION COMPLIANCE

Sesuai tata kelola mutlak EEOS:
- **ZERO MUTATION**: Nol modifikasi basis data, nol eksekusi DDL, nol perubahan file migrasi, nol perubahan kode aplikasi, nol git commit/push.
- Seluruh verifikasi dilaksanakan secara forensik *read-only* terhadap katalog PostgreSQL 17.6 dan artefak spesifikasi DDL yang dirumuskan pada dokumen sebelumnya ([`docs/architecture/WP-02-FINAL-DDL-SAFETY-REVIEW-001.md:130-170`](file:///e:/Projects/Os_Darta/docs/architecture/WP-02-FINAL-DDL-SAFETY-REVIEW-001.md#L130-L170)).

---

## 3. LOCKED TENANT CODE CONTRACT (INVARIANTS)

Parameter yang telah diratifikasi pada MB-06 dan Safety Review:
- **Kolom Kanonikal**: `public.tenants.code`
- **Tipe Data**: `VARCHAR(10)`
- **Nullability**: `NOT NULL`
- **Format Validasi**: `^[A-Z0-9]{2,10}$` (Uppercase Alfanumerik murni, panjang 2–10 karakter)
- **Keunikan**: Global Uniqueness di tingkat platform
- **Sifat Nilai**: **IMMUTABLE** (*Write-Once, Read-Many*)
- **Siklus Hidup**: Tetap dicadangkan (*reserved*) setelah tenant dinonaktifkan/diarsipkan
- **Kemandirian NIS**: `santri.nis` tetap berupa angka murni (`00125`) dan **TIDAK DIGABUNGKAN** dengan Tenant Code (`DRT00125`).

---

## 4. CRITICAL CHECK #1: EXPLICIT BACKFILL ONLY

Audit terhadap pemetaan 6 tenant eksisting pada DDL Section 8 membuktikan penggunaan klausa eksplisit `CASE id`:
```sql
CASE id
  WHEN 't_1789172137858_9g7lm' THEN 'RTV01'
  WHEN 't_1789178874071_8vsju' THEN 'RTV02'
  WHEN 't_1789228497649_qbldr' THEN 'RTV03'
  WHEN 't_1789229560359_78feo' THEN 'PRV03'
  WHEN 't_1789231192101_v5qjz' THEN 'PUB01'
  WHEN 't_1789252184367_rx9ze' THEN 'AUD01'
  ...
```
- Pemetaan menggunakan Primary Key unik (`tenants.id`), bukan slug yang rentan berubah.
- Keenam Tenant ID terdaftar secara presisi dan sesuai dengan manifest resmi Product Owner.

---

## 5. CRITICAL CHECK #2: NO FALLBACK / NO GUESSING (FINDING-01: DEFECT DETECTED)

> [!CAUTION]
> **TEMUAN DISKREPANSI ARSITEKTURAL KRITIS (DEFECT FINDING-01):**  
> Pada DDL Section 8 baris 143 di dokumen [`WP-02-FINAL-DDL-SAFETY-REVIEW-001.md`](file:///e:/Projects/Os_Darta/docs/architecture/WP-02-FINAL-DDL-SAFETY-REVIEW-001.md#L143), ditemukan klausa:
> ```sql
> ELSE UPPER(SUBSTRING(REPLACE(slug, '-', '') FROM 1 FOR 10))
> ```
> **Evaluasi Kontrak**:
> 1. Klausul `ELSE` ini merupakan **Fallback Liar (*Wild Fallback / Auto-Guessing*)** yang secara terang-terangan melanggar prinsip *Fail-Closed*.
> 2. Keputusan Product Owner menetapkan **EXPLICIT CLEAN ALPHANUMERIC MAPPING ONLY**.
> 3. Jika suatu saat terdapat tenant baru atau tenant yang tidak terdaftar dalam manifest pada saat migrasi berjalan, klausul `ELSE` ini akan secara diam-diam menebak (*silently guess*) kode dari slug tanpa persetujuan manusia.
> 4. **Prinsip Sejati EEOS**: Jika ada tenant yang tidak cocok dalam manifest, migrasi harus **FAIL CLOSED (menghasilkan NULL atau melempar error)** sehingga abort/rollback terjadi seketika saat verifikasi `NOT NULL`.

---

## 6. MAPPING COMPLETENESS TEST (6 = 6 = 6)

Verifikasi keselarasan 1:1 antara baris di basis data target dengan manifest ratifikasi:

```text
┌───┬─────────────────────────┬─────────────────────────┬───────────────┬────────┬───────────┐
│ # │ Tenant ID               │ Current Slug            │ Manifest Code │ Match? │ Status    │
├───┼─────────────────────────┼─────────────────────────┼───────────────┼────────┼───────────┤
│ 1 │ t_1789172137858_9g7lm   │ runtime-verify-001      │ RTV01         │ YES    │ **PASS**  │
│ 2 │ t_1789178874071_8vsju   │ runtime-verify-002      │ RTV02         │ YES    │ **PASS**  │
│ 3 │ t_1789228497649_qbldr   │ runtime-verify-003      │ RTV03         │ YES    │ **PASS**  │
│ 4 │ t_1789229560359_78feo   │ prov-003                │ PRV03         │ YES    │ **PASS**  │
│ 5 │ t_1789231192101_v5qjz   │ runtime-public-001      │ PUB01         │ YES    │ **PASS**  │
│ 6 │ t_1789252184367_rx9ze   │ runtime-audit-actor-001 │ AUD01         │ YES    │ **PASS**  │
└───┴─────────────────────────┴─────────────────────────┴───────────────┴────────┴───────────┘
```
- `COUNT(existing tenants) = 6`
- `COUNT(manifest mappings) = 6`
- `COUNT(successfully matched tenants) = 6`
- **Tingkat Kelengkapan**: 100% lengkap tanpa sisa baris yatim.

---

## 7. CRITICAL CHECK #3: DATABASE FORMAT ENFORCEMENT (FINDING-02: DEFECT DETECTED)

> [!CAUTION]
> **TEMUAN DISKREPANSI ARSITEKTURAL KRITIS (DEFECT FINDING-02):**  
> Pada DDL Section 8 di dokumen [`WP-02-FINAL-DDL-SAFETY-REVIEW-001.md`](file:///e:/Projects/Os_Darta/docs/architecture/WP-02-FINAL-DDL-SAFETY-REVIEW-001.md), penegakan format regex:
> ```sql
> ALTER TABLE public.tenants ADD CONSTRAINT chk_tenants_code_format 
> CHECK (code ~ '^[A-Z0-9]{2,10}$');
> ```
> **BELUM DITULISKAN SECARA EKSPLISIT DALAM SKRIP DDL MIGRATION!**
> 
> DDL saat ini hanya memuat:
> ```sql
> ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS code VARCHAR(10);
> ALTER TABLE public.tenants ALTER COLUMN code SET NOT NULL;
> CREATE UNIQUE INDEX IF NOT EXISTS uq_tenants_code_upper ON public.tenants (UPPER(code));
> ```
> **Evaluasi Kontrak**:
> - Tipe data `VARCHAR(10)` **HANYA** membatasi panjang maksimal 10 karakter.
> - `VARCHAR(10)` **TIDAK MENCEGAH** masuknya huruf kecil (`abc`), spasi (`ABC 01`), tanda hubung (`ABC-01`), simbol (`ABC@`), atau string 1 karakter (`A`).
> - Mengandalkan aplikasi atau indeks unik tanpa `CHECK (code ~ '^[A-Z0-9]{2,10}$')` adalah celah arsitektur (*missing database-level format enforcement*).

---

## 8. FORMAT ATTACK MATRIX (DATABASE-LEVEL VERIFICATION)

Evaluasi perilaku engine PostgreSQL terhadap 10 kandidat input jika constraint `CHECK (code ~ '^[A-Z0-9]{2,10}$')` dipasang vs jika tidak dipasang:

```text
┌────┬──────────────┬──────────┬──────────────────────┬──────────────────────┬────────────────────────────┐
│ No │ Candidate    │ Expected │ Status Tanpa CHECK   │ Status Dengan CHECK  │ Kesenjangan Kontrak        │
├────┼──────────────┼──────────┼──────────────────────┼──────────────────────┼────────────────────────────┤
│ 1  │ AB           │ ACCEPT   │ ACCEPT (VARCHAR)     │ ACCEPT (Regex Match) │ Sesuai Kontrak             │
│ 2  │ RTV01        │ ACCEPT   │ ACCEPT (VARCHAR)     │ ACCEPT (Regex Match) │ Sesuai Kontrak             │
│ 3  │ ABC1234567   │ ACCEPT   │ ACCEPT (VARCHAR)     │ ACCEPT (Regex Match) │ Sesuai Kontrak (10 Kar.)   │
│ 4  │ A            │ REJECT   │ LOLOS (BAHAYA!)      │ DITOLAK (FAIL-CLOSED)│ DDL Saat Ini Rawan Lolos   │
│ 5  │ ABC-01       │ REJECT   │ LOLOS (BAHAYA!)      │ DITOLAK (FAIL-CLOSED)│ DDL Saat Ini Rawan Lolos   │
│ 6  │ ABC_01       │ REJECT   │ LOLOS (BAHAYA!)      │ DITOLAK (FAIL-CLOSED)│ DDL Saat Ini Rawan Lolos   │
│ 7  │ abc01        │ REJECT   │ LOLOS (BAHAYA!)      │ DITOLAK (FAIL-CLOSED)│ DDL Saat Ini Rawan Lolos   │
│ 8  │ ABC 01       │ REJECT   │ LOLOS (BAHAYA!)      │ DITOLAK (FAIL-CLOSED)│ DDL Saat Ini Rawan Lolos   │
│ 9  │ ABC@01       │ REJECT   │ LOLOS (BAHAYA!)      │ DITOLAK (FAIL-CLOSED)│ DDL Saat Ini Rawan Lolos   │
│ 10 │ 12345678901  │ REJECT   │ DITOLAK (VARCHAR 10) │ DITOLAK (VARCHAR 10) │ Sesuai Kontrak (11 Kar.)   │
└────┴──────────────┴──────────┴──────────────────────┴──────────────────────┴────────────────────────────┘
```

> **KESIMPULAN MATRIX:**  
> Tanpa penambahan constraint `CHECK (code ~ '^[A-Z0-9]{2,10}$')`, 6 dari 10 skenario serangan/kesalahan data (60%) **AKAN LOLOS MASUK KE BASIS DATA**.  
> Penambahan klausul `CHECK` adalah **MANDATORI / PRASYARAT MUTLAK**.

---

## 9. CRITICAL CHECK #4: IMMUTABILITY TRIGGER INTEGRITY

Audit logika fungsi trigger `fn_enforce_tenant_code_immutable`:
```sql
CREATE OR REPLACE FUNCTION public.fn_enforce_tenant_code_immutable()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.code IS NOT NULL AND NEW.code IS DISTINCT FROM OLD.code THEN
    RAISE EXCEPTION 'EEOS-SECURITY: tenants.code is immutable and cannot be modified once set (Old: %, New: %)', OLD.code, NEW.code
      USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Evaluasi Kasus Transisi Siklus Hidup:
1. **Transisi First Assignment (Backfill Migration)**:
   - `OLD.code = NULL`, `NEW.code = 'RTV01'`
   - Evaluasi: `OLD.code IS NOT NULL` menghasilkan `FALSE`.
   - **Hasil**: **DIIZINKAN (ALLOWED)**. Trigger tidak memblokir proses pengisian awal migrasi.
2. **Transisi Idempoten (No-Op Update)**:
   - `OLD.code = 'RTV01'`, `NEW.code = 'RTV01'`
   - Evaluasi: `NEW.code IS DISTINCT FROM OLD.code` menghasilkan `FALSE`.
   - **Hasil**: **DIIZINKAN (ALLOWED)**. Operasi update kolom lain (misal nama/status) tidak terganggu.
3. **Transisi Mutasi Terlarang (Code Modification)**:
   - `OLD.code = 'RTV01'`, `NEW.code = 'RTV02'`
   - Evaluasi: `OLD.code IS NOT NULL (TRUE)` AND `IS DISTINCT (TRUE)`.
   - **Hasil**: **DITOLAK (REJECTED / RAISE EXCEPTION)**. Basis data menggagalkan mutasi seketika.
4. **Transisi Pengosongan Terlarang (Nullification)**:
   - `OLD.code = 'RTV01'`, `NEW.code = NULL`
   - Evaluasi: `OLD.code IS NOT NULL (TRUE)` AND `IS DISTINCT (TRUE)`.
   - **Hasil**: **DITOLAK (REJECTED / RAISE EXCEPTION)**. Nilai tidak dapat dihapus.

---

## 10. CRITICAL CHECK #5 & #6: INSERT & UPDATE SAFETY

Kombinasi 4 lapis pertahanan basis data (*Four-Pillar Defense*) pada tabel `tenants`:
1. **`NOT NULL`**: Menjamin tidak ada tenant yang dapat dibuat tanpa Tenant Code.
2. **`CHECK (code ~ '^[A-Z0-9]{2,10}$')`**: Menjamin format alfanumerik kapital murni (panjang 2–10).
3. **`UNIQUE INDEX uq_tenants_code_upper`**: Menjamin keunikan global di tingkat sistem.
4. **`TRIGGER trg_tenants_code_immutable`**: Menjamin nilai tidak dapat diubah setelah ditetapkan.

---

## 11. CRITICAL CHECK #7: DDL ORDER AUDIT

Urutan dependensi eksekusi yang aman (*Dependency-Safe Execution Order*):
1. `ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS code VARCHAR(10);` (Nullable)
2. `UPDATE public.tenants SET code = CASE id ... END WHERE code IS NULL;` (Explicit Backfill)
3. `ALTER TABLE public.tenants ADD CONSTRAINT chk_tenants_code_format CHECK (code ~ '^[A-Z0-9]{2,10}$');` (Format Gate)
4. `ALTER TABLE public.tenants ALTER COLUMN code SET NOT NULL;` (Completeness Gate)
5. `CREATE UNIQUE INDEX IF NOT EXISTS uq_tenants_code_upper ON public.tenants (UPPER(code));` (Uniqueness Gate)
6. Pasang fungsi dan trigger kekekalan `trg_tenants_code_immutable` (Immutability Gate)
7. `ALTER TABLE public.santri ADD COLUMN tenant_id TEXT NOT NULL REFERENCES tenants(id);`
8. `ALTER TABLE public.santri ADD COLUMN user_id TEXT NULL REFERENCES users(id);`
9. `ALTER TABLE public.santri DROP CONSTRAINT IF EXISTS santri_nis_unique;`
10. `ALTER TABLE public.santri ADD CONSTRAINT uq_santri_tenant_nis UNIQUE (tenant_id, nis);`
11. `ALTER TABLE public.santri ADD CONSTRAINT uq_santri_tenant_id UNIQUE (tenant_id, id);`
12. `CREATE UNIQUE INDEX IF NOT EXISTS uq_santri_tenant_user_id ON public.santri (tenant_id, user_id) WHERE user_id IS NOT NULL;`

---

## 12. FULL CONTRACT MATRIX

Perbandingan antara Kebutuhan Arsitektur vs Kondisi DDL Saat Ini:

```text
┌────┬─────────────────────────────────┬───────────────────┬──────────────────────┬────────┬──────────────┐
│ No │ Parameter Kontrak               │ Mandat Arsitektur │ Status DDL Saat Ini  │ Match? │ Status       │
├────┼─────────────────────────────────┼───────────────────┼──────────────────────┼────────┼──────────────┤
│ 1  │ tenants.code VARCHAR(10)        │ Mandatori         │ Tercantum di DDL     │ YES    │ **PASS**     │
│ 2  │ tenants.code NOT NULL           │ Mandatori         │ Tercantum di DDL     │ YES    │ **PASS**     │
│ 3  │ Regex Format CHECK Constraint   │ Mandatori         │ **TIDAK TERCANTUM**  │ **NO** │ **FAIL (D1)**│
│ 4  │ Global Uniqueness (Index)       │ Mandatori         │ Tercantum di DDL     │ YES    │ **PASS**     │
│ 5  │ Immutability Trigger (IMM-1)    │ Mandatori         │ Tercantum di DDL     │ YES    │ **PASS**     │
│ 6  │ Explicit Mapping (6 Tenant ID)  │ Mandatori         │ Tercantum di DDL     │ YES    │ **PASS**     │
│ 7  │ Zero Fallback / Fail-Closed     │ Mandatori         │ **MEMILIKI ELSE**    │ **NO** │ **FAIL (D2)**│
│ 8  │ santri.tenant_id NOT NULL FK    │ Mandatori         │ Tercantum di DDL     │ YES    │ **PASS**     │
│ 9  │ santri.user_id NULL FK          │ Mandatori         │ Tercantum di DDL     │ YES    │ **PASS**     │
│ 10 │ Constraint uq_santri_tenant_nis │ Mandatori         │ Tercantum di DDL     │ YES    │ **PASS**     │
│ 11 │ Constraint uq_santri_tenant_id  │ Mandatori         │ Tercantum di DDL     │ YES    │ **PASS**     │
│ 12 │ Partial Index user_id per tenant│ Mandatori         │ Tercantum di DDL     │ YES    │ **PASS**     │
└────┴─────────────────────────────────┴───────────────────┴──────────────────────┴────────┴──────────────┘
```

---

## 13. PASS CRITERIA EVALUATION CHECKLIST

```text
[x] Explicit mapping complete (6 dari 6 tenant ID terpetakan)
[ ] Zero fallback (GAGAL: DDL masih memiliki klausul ELSE liar)
[ ] Zero guessing (GAGAL: Klausul ELSE menebak kode dari slug)
[x] Six tenant IDs match manifest (RTV01 s/d AUD01 terverifikasi 1:1)
[x] All codes valid regex (RTV01 s/d AUD01 memenuhi ^[A-Z0-9]{2,10}$)
[x] Zero collision (6 kode berbeda murni, 0 duplikasi)
[x] code NOT NULL (Tercantum pada DDL)
[ ] Database CHECK enforces regex (GAGAL: Constraint CHECK belum ditulis di DDL)
[x] First assignment allowed (Trigger mengizinkan transisi NULL -> Code)
[x] Subsequent code changes rejected (Trigger memblokir OLD.code != NEW.code)
[x] Global uniqueness enforced (UNIQUE INDEX UPPER(code) tercantum)
[x] No hidden normalization (Tidak ada trigger perubah string diam-diam)
[x] DDL dependency order valid (Urutan tabel & kolom konsisten)
[x] Santri tenant_id order valid (Ditambahkan sebelum composite constraint)
[x] Santri user_id valid (Nullable, FK ke public.users)
[x] NIS tenant-scoped (UNIQUE tenant_id, nis)
[x] WP-02 scope clean (Guru dan RLS diisolasi ketat di luar DDL)
[ ] No critical findings (GAGAL: Ditemukan 2 diskrepansi kontrak)
```

---

## 14. BLOCKER ANALYSIS & REQUIRED REMEDIATIONS

Berdasarkan aturan tata kelola (*Governance Rule Section 27 & 28*):

### Diskrepansi 1: Keberadaan Fallback Liar `ELSE` pada Backfill DDL
- **Lokasi**: Dokumen `WP-02-FINAL-DDL-SAFETY-REVIEW-001.md`, baris 143.
- **Klausul Bermasalah**: `ELSE UPPER(SUBSTRING(REPLACE(slug, '-', '') FROM 1 FOR 10))`
- **Dampak**: Jika terdapat tenant di luar 6 ID manifest, sistem akan secara diam-diam menebak kode tanpa otorisasi.
- **Remediasi Wajib**: Hapus klausul `ELSE` sepenuhnya. Gunakan `CASE id ... END` tanpa `ELSE` (sehingga baris yang tidak cocok menghasilkan `NULL` dan seketika menggagalkan constraint `NOT NULL`, memicu abort/rollback otomatis).

### Diskrepansi 2: Ketiadaan Constraint `CHECK` Format di Level Basis Data
- **Lokasi**: Dokumen `WP-02-FINAL-DDL-SAFETY-REVIEW-001.md`, DDL Section 8.
- **Dampak**: Tipe data `VARCHAR(10)` mengizinkan masuknya karakter huruf kecil, spasi, tanda hubung, atau kode 1 karakter pada operasi `INSERT` tenant masa depan.
- **Remediasi Wajib**: Tambahkan constraint eksplisit:
  ```sql
  ALTER TABLE public.tenants 
  ADD CONSTRAINT chk_tenants_code_format 
  CHECK (code ~ '^[A-Z0-9]{2,10}$');
  ```

---

## 15. DDL AMENDMENT SPECIFICATION (FOR IMPLEMENTATION FILE)

Spesifikasi perbaikan DDL yang telah dibersihkan dari seluruh diskrepansi (siap digunakan sebagai cetak biru migrasi `0003_core_santri_tenantization.sql`):

```sql
-- =============================================================================
-- EEOS WP-02 FULLY-ENFORCED RELATIONAL CONTRACT SPECIFICATION (CORRECTED)
-- =============================================================================

BEGIN;

-- 1. Tambahkan kolom code sebagai NULLable
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- 2. Backfill EKSPLISIT MURNI (ZERO FALLBACK / ZERO GUESSING)
-- Catatan: Tanpa klausa ELSE. Baris tak terdaftar akan bernilai NULL.
UPDATE public.tenants
SET code = CASE id
  WHEN 't_1789172137858_9g7lm' THEN 'RTV01'
  WHEN 't_1789178874071_8vsju' THEN 'RTV02'
  WHEN 't_1789228497649_qbldr' THEN 'RTV03'
  WHEN 't_1789229560359_78feo' THEN 'PRV03'
  WHEN 't_1789231192101_v5qjz' THEN 'PUB01'
  WHEN 't_1789252184367_rx9ze' THEN 'AUD01'
END
WHERE code IS NULL;

-- 3. Penegakan Format Regex di Level Engine Database
ALTER TABLE public.tenants 
ADD CONSTRAINT chk_tenants_code_format 
CHECK (code ~ '^[A-Z0-9]{2,10}$');

-- 4. Penegakan Kelengkapan (Fail-Closed jika ada baris tidak cocok di Langkah 2)
ALTER TABLE public.tenants ALTER COLUMN code SET NOT NULL;

-- 5. Penegakan Keunikan Global
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenants_code_upper ON public.tenants (UPPER(code));

-- 6. Penegakan Kekekalan Basis Data (IMM-1 Trigger)
CREATE OR REPLACE FUNCTION public.fn_enforce_tenant_code_immutable()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.code IS NOT NULL AND NEW.code IS DISTINCT FROM OLD.code THEN
    RAISE EXCEPTION 'EEOS-SECURITY: tenants.code is immutable and cannot be modified once set (Old: %, New: %)', OLD.code, NEW.code
      USING ERRCODE = '55000';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenants_code_immutable ON public.tenants;
CREATE TRIGGER trg_tenants_code_immutable
BEFORE UPDATE OF code ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_tenant_code_immutable();

-- 7. Santri Tenantization & Relasi Identitas
ALTER TABLE public.santri ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT;
ALTER TABLE public.santri ADD COLUMN IF NOT EXISTS user_id TEXT NULL REFERENCES public.users(id) ON DELETE RESTRICT;

-- 8. Transisi Constraint NIS (Global -> Tenant-Scoped)
ALTER TABLE public.santri DROP CONSTRAINT IF EXISTS santri_nis_unique;
ALTER TABLE public.santri ADD CONSTRAINT uq_santri_tenant_nis UNIQUE (tenant_id, nis);

-- 9. Jangkar Kunci Komposit untuk Child Tables
ALTER TABLE public.santri ADD CONSTRAINT uq_santri_tenant_id UNIQUE (tenant_id, id);

-- 10. Indeks Parsial Identitas Akun Santri per Tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_santri_tenant_user_id ON public.santri (tenant_id, user_id) WHERE user_id IS NOT NULL;

COMMIT;
```

---

## 16. FINAL GOVERNANCE VERDICT

Sesuai aturan tata kelola Section 27, 30, dan 31:  
Karena DDL pada artefak review sebelumnya masih memuat klausul fallback `ELSE` liar dan belum memuat penegakan format `CHECK (code ~ '^[A-Z0-9]{2,10}$')`, maka status pre-otorisasi adalah:

```text
================================================================================
WP-02 FINAL DDL CONTRACT INTEGRITY CHECK: FINAL VERDICT
================================================================================

STATUS:
  BLOCKED (2 CONTRACT DISCREPANCIES IDENTIFIED)

FINDINGS:
  1. DEFECT FINDING-01: Wild ELSE fallback present in tenant code backfill statement.
  2. DEFECT FINDING-02: Missing database-level regex format CHECK constraint.

CONTRACTS VIOLATED:
  - ZERO-FALLBACK / FAIL-CLOSED INVARIANT
  - DATABASE-ENFORCED FORMAT INVARIANT

REQUIRED ACTION:
  Product Owner dan Tim Arsitektur meratifikasi spesifikasi DDL yang telah
  diperbaiki (Section 15) untuk menghapus ELSE fallback dan memasang CHECK constraint.

DATABASE MUTATION:        0 (TIDAK ADA PERUBAHAN BASIS DATA)
CODE MUTATION:            0 (TIDAK ADA KODE APLIKASI DIUBAH)
GIT MUTATION:             0 (TIDAK ADA COMMIT / PUSH)

PRODUCT OWNER AUTHORIZATION:
  NOT PERMITTED UNTIL AMENDED DDL IS RATIFIED

================================================================================
ABSOLUTE STOP
================================================================================
```

---

## 17. ABSOLUTE STOP CONDITION & SIGN-OFF

Sesuai aturan tata kelola mutlak EEOS (*Governance Rule Section 31*):
- [x] Pemeriksaan keselarasan kontrak DDL terhadap mandat arsitektur selesai 100% read-only.
- [x] Dua celah arsitektural (wild ELSE fallback & missing regex CHECK) berhasil diidentifikasi secara presisi.
- [x] Solusi perbaikan spesifikasi DDL telah dirumuskan secara terstruktur (Section 15) tanpa melakukan auto-repair liar.
- [x] **NOL mutasi basis data, NOL eksekusi migrasi, NOL perubahan kode, NOL git commit/push.**

**PROSES DIHENTIKAN SECARA MUTLAK (ABSOLUTE STOP).**  
Sistem menghentikan seluruh proses dan menunggu Product Owner mengonfirmasi ratifikasi spesifikasi DDL yang telah diamandemen sebelum otorisasi implementasi WP-02 dapat dibuka kembali.
