# EEOS — CORE SANTRI TENANTIZATION & NIS REMEDIATION
# WP-02 AMENDED DDL PRODUCT OWNER RATIFICATION RECORD

```text
WORK PACKAGE:           WP-02-AMENDED-DDL-PRODUCT-OWNER-RATIFICATION-001
GOVERNANCE GATE:        EEOS PRODUCT OWNER RATIFICATION GATE (WP-02 DDL CONTRACT REMEDIATION)
OPERATING MODE:         READ-ONLY / RATIFICATION / DECISION RECORDING ONLY (ZERO MUTATION)
DATABASE ENVIRONMENT:   LIVE TARGET DATABASE (PostgreSQL 17.6 / Supabase) — UNTOUCHED
APPLICATION CODE:       UNTOUCHED (ZERO MUTATION)
GIT STATUS:             ZERO COMMIT / ZERO PUSH
DATE:                   2026-09-21
EEOS AUDITORS:          Principal Database Architect, PostgreSQL Security Architect, Multi-Tenant Specialist
RATIFICATION STATUS:    AMENDED DDL CONTRACT OFFICIALLY RATIFIED
FINAL GOVERNANCE STATE: READY TO RETURN TO IMPLEMENTATION AUTHORIZATION GATE
```

---

## 1. GOVERNANCE HEADER & OBJECTIVE

Dokumen ini merupakan catatan ratifikasi resmi (*official ratification record*) atas penyelesaian dua diskrepansi kontrak arsitektural yang diidentifikasi pada laporan review keselamatan dan integritas sebelumnya ([`docs/architecture/WP-02-FINAL-DDL-CONTRACT-INTEGRITY-CHECK-001.md`](file:///e:/Projects/Os_Darta/docs/architecture/WP-02-FINAL-DDL-CONTRACT-INTEGRITY-CHECK-001.md)):

```text
1. DEFECT-01: Keberadaan klausul fallback liar ELSE pada statement backfill Tenant Code.
2. DEFECT-02: Ketiadaan penegakan format regex di level mesin basis data (missing CHECK constraint).
```

Melalui gerbang ini, Product Owner secara formal dan mengikat meratifikasi **Amended DDL Contract Specification** sebagai cetak biru tunggal yang sah bagi migrasi basis data WP-02, menghapus secara mutlak celah fallback liar, dan menegakkan pertahanan berlapis di tingkat mesin PostgreSQL (*Fail-Closed Database Enforcement*).

---

## 2. ABSOLUTE NO-MUTATION COMPLIANCE

Sesuai aturan tata kelola mutlak EEOS (*Governance Rule Section 2*):
- **DATABASE = UNTOUCHED**: Nol modifikasi basis data, nol eksekusi DDL, nol penambahan constraint, nol pembuatan trigger.
- **CODE = UNTOUCHED**: Nol perubahan kode aplikasi, nol pembuatan file migrasi fisik.
- **GIT = UNTOUCHED**: Nol commit, nol push, nol deployment.
- Seluruh verifikasi dilaksanakan secara murni dalam mode *read-only* untuk pencatatan keputusan dan audit konsistensi.

---

## 3. PRODUCT OWNER DECISION RECORD

### DECISION A — REMOVAL OF WILD FALLBACK (FAIL-CLOSED ENFORCEMENT)
Product Owner secara resmi meratifikasi bahwa pengisian awal (*backfill*) kolom `public.tenants.code` wajib menggunakan pemetaan eksplisit murni:
```sql
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
```
* **Klausul Terlarang**: Dilarang mencantumkan klausul `ELSE` dalam bentuk apapun (misal `ELSE UPPER(SUBSTRING(...))`).
* **Prinsip**: *Explicit Mapping + Zero Guessing + Fail Closed*. Jika terdapat tenant di luar 6 ID manifest, nilai `code` akan tetap `NULL` dan seketika digagalkan oleh constraint `NOT NULL`, memicu *Auto-Rollback* transaksi tanpa kompromi.

### DECISION B — DATABASE-LEVEL FORMAT CHECK ENFORCEMENT
Product Owner secara resmi meratifikasi penegakan validasi format Tenant Code di tingkat mesin basis data:
```sql
ALTER TABLE public.tenants
ADD CONSTRAINT chk_tenants_code_format
CHECK (code ~ '^[A-Z0-9]{2,10}$');
```
* **Kontrak Validasi**:
  - Panjang minimal: 2 karakter
  - Panjang maksimal: 10 karakter
  - Karakter diizinkan: Huruf kapital (`A-Z`) dan angka (`0-9`) murni
  - Karakter terlarang: Spasi, tanda hubung (`-`), garis bawah (`_`), simbol, dan huruf kecil
* **Dampak**: Menutup total celah input format tidak sah pada level data plane, independen dari lapisan aplikasi.

---

## 4. OFFICIAL RATIFIED TENANT CODE MANIFEST

Manifest berikut ditetapkan sebagai satu-satunya pemetaan resmi yang sah bagi seluruh 6 tenant eksisting di basis data target:

```text
┌───┬─────────────────────────┬─────────────────────────┬───────────────┬────────────────────────────┐
│ # │ Tenant ID               │ Current Slug            │ Ratified Code │ Status Integritas          │
├───┼─────────────────────────┼─────────────────────────┼───────────────┼────────────────────────────┤
│ 1 │ t_1789172137858_9g7lm   │ runtime-verify-001      │ RTV01         │ 100% Lolos Regex / Unik    │
│ 2 │ t_1789178874071_8vsju   │ runtime-verify-002      │ RTV02         │ 100% Lolos Regex / Unik    │
│ 3 │ t_1789228497649_qbldr   │ runtime-verify-003      │ RTV03         │ 100% Lolos Regex / Unik    │
│ 4 │ t_1789229560359_78feo   │ prov-003                │ PRV03         │ 100% Lolos Regex / Unik    │
│ 5 │ t_1789231192101_v5qjz   │ runtime-public-001      │ PUB01         │ 100% Lolos Regex / Unik    │
│ 6 │ t_1789252184367_rx9ze   │ runtime-audit-actor-001 │ AUD01         │ 100% Lolos Regex / Unik    │
└───┴─────────────────────────┴─────────────────────────┴───────────────┴────────────────────────────┘
```

---

## 5. RATIFIED AMENDED DDL CONTRACT SPECIFICATION

Spesifikasi DDL berikut disahkan sebagai **cetak biru kontrak arsitektural (*contract blueprint*)** resmi bagi siklus implementasi WP-02:

```sql
-- =============================================================================
-- EEOS WP-02 AMENDED DDL CONTRACT BLUEPRINT (OFFICIALLY RATIFIED)
-- =============================================================================

BEGIN;

-- 1. Tambahkan kolom code sebagai NULLable
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- 2. Backfill EKSPLISIT MURNI (ZERO FALLBACK / ZERO GUESSING)
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

-- 3. Penegakan Format Regex di Level Engine Basis Data
ALTER TABLE public.tenants
ADD CONSTRAINT chk_tenants_code_format
CHECK (code ~ '^[A-Z0-9]{2,10}$');

-- 4. Penegakan Kelengkapan (Fail-Closed jika ada baris tidak cocok di Langkah 2)
ALTER TABLE public.tenants
ALTER COLUMN code SET NOT NULL;

-- 5. Penegakan Keunikan Global
CREATE UNIQUE INDEX IF NOT EXISTS
uq_tenants_code_upper
ON public.tenants (UPPER(code));

-- 6. Penegakan Kekekalan Basis Data (IMM-1 Trigger)
CREATE OR REPLACE FUNCTION
public.fn_enforce_tenant_code_immutable()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.code IS NOT NULL
       AND NEW.code IS DISTINCT FROM OLD.code THEN

        RAISE EXCEPTION
        'EEOS-SECURITY: tenants.code is immutable and cannot be modified once set (Old: %, New: %)',
        OLD.code,
        NEW.code
        USING ERRCODE = '55000';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS
trg_tenants_code_immutable
ON public.tenants;

CREATE TRIGGER
trg_tenants_code_immutable
BEFORE UPDATE OF code
ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION
public.fn_enforce_tenant_code_immutable();

-- 7. Santri Tenantization & Relasi Identitas
ALTER TABLE public.santri
ADD COLUMN IF NOT EXISTS tenant_id
TEXT NOT NULL
REFERENCES public.tenants(id)
ON DELETE RESTRICT;

ALTER TABLE public.santri
ADD COLUMN IF NOT EXISTS user_id
TEXT NULL
REFERENCES public.users(id)
ON DELETE RESTRICT;

-- 8. Transisi Constraint NIS (Global -> Tenant-Scoped)
ALTER TABLE public.santri
DROP CONSTRAINT IF EXISTS santri_nis_unique;

ALTER TABLE public.santri
ADD CONSTRAINT uq_santri_tenant_nis
UNIQUE (tenant_id, nis);

-- 9. Jangkar Kunci Komposit untuk Child Tables
ALTER TABLE public.santri
ADD CONSTRAINT uq_santri_tenant_id
UNIQUE (tenant_id, id);

-- 10. Indeks Parsial Identitas Akun Santri per Tenant
CREATE UNIQUE INDEX IF NOT EXISTS
uq_santri_tenant_user_id
ON public.santri (tenant_id, user_id)
WHERE user_id IS NOT NULL;

COMMIT;
```

---

## 6. AUDIT KONSISTENSI & VERIFIKASI PRA-RATIFIKASI

Pemeriksaan menyeluruh terhadap spesifikasi DDL yang diamandemen memastikan kepatuhan 100%:

```text
[x] ELSE fallback removed (Terbukti: tidak ada klausa ELSE pada statement backfill)
[x] Explicit 6-tenant mapping retained (Terbukti: 6 ID terdaftar secara presisi)
[x] Zero guessing (Terbukti: tidak ada derivasi otomatis dari string slug)
[x] CHECK regex added (Terbukti: constraint chk_tenants_code_format terpasang)
[x] NOT NULL retained (Terbukti: kolom code dan santri.tenant_id disetel NOT NULL)
[x] Global uniqueness retained (Terbukti: indeks unik UPPER(code) terpasang)
[x] Immutability retained (Terbukti: trigger fn_enforce_tenant_code_immutable terpasang)
[x] First assignment remains possible (Terbukti: OLD.code IS NULL diizinkan)
[x] Santri tenant_id retained (Terbukti: FOREIGN KEY ke tenants(id) ON DELETE RESTRICT)
[x] Santri user_id retained (Terbukti: Nullable FOREIGN KEY ke users(id))
[x] Tenant-scoped NIS retained (Terbukti: UNIQUE (tenant_id, nis))
[x] WP-02 scope unchanged (Terbukti: Guru dan RLS tetap diisolasi di luar WP-02)
```

---

## 7. KESELARASAN LINTAS DOMAIN TERKUNCI (CROSS-DOMAIN ALIGNMENT)

Ratifikasi DDL yang diamandemen ini mempertahankan keselarasan penuh terhadap seluruh keputusan arsitektural sebelumnya:
1. **MB-06 Native Resolution**: Format `VARCHAR(10)`, regex `^[A-Z0-9]{2,10}$`, dan sifat kekal (*immutable*) tetap ditegakkan secara sempurna.
2. **Gate 3 Guru Boundary**: Entitas Guru dan penugasan guru tetap berstatus **`GURU-2 DEFERRED`** dan tidak tercampur dalam DDL ini.
3. **Gate 4 Database RLS**: Skema `RLS-2 (eeos_app_role)` tetap dipertahankan; WP-02 hanya menyediakan jangkar relasional `tenant_id NOT NULL` tanpa mengaktifkan kebijakan RLS prematur.
4. **Clean Slate Status**: Tetap terverifikasi bersih (`santri = 0 baris`); DDL berjalan secara instan tanpa risiko table lock contention.

---

## 8. FINAL GOVERNANCE VERDICT

```text
================================================================================
EEOS — WP-02 AMENDED DDL PRODUCT OWNER RATIFICATION
================================================================================

VERDICT:
  AMENDED DDL CONTRACT OFFICIALLY RATIFIED

DEFECT-01:
  WILD ELSE FALLBACK
  -> RESOLVED BY EXPLICIT FAIL-CLOSED MAPPING

DEFECT-02:
  MISSING DATABASE FORMAT CHECK
  -> RESOLVED BY chk_tenants_code_format CONSTRAINT

TENANT CODE:
  VARCHAR(10)
  FORMAT: ^[A-Z0-9]{2,10}$
  GLOBAL UNIQUE
  IMMUTABLE (TRIGGER ENFORCED)

BACKFILL:
  EXPLICIT (6 TENANT MANIFEST)
  ZERO FALLBACK
  ZERO GUESSING

SANTRI CONTRACT:
  tenant_id = REQUIRED (NOT NULL FK)
  user_id   = NULLABLE (FK users)
  nis       = TENANT-SCOPED (UNIQUE tenant_id, nis)

MUTATION STATUS:
  DATABASE MUTATION:        0 (TIDAK ADA PERUBAHAN BASIS DATA)
  CODE MUTATION:            0 (TIDAK ADA KODE APLIKASI DIUBAH)
  GIT MUTATION:             0 (TIDAK ADA COMMIT / PUSH)

WP-02 STATUS:
  READY TO RETURN TO IMPLEMENTATION AUTHORIZATION GATE

================================================================================
ABSOLUTE STOP
================================================================================
```

---

## 9. CRITICAL DISTINCTION & NEXT STEP

> [!IMPORTANT]
> **PENEGASAN BATASAN TATA KELOLA:**  
> ```text
> RATIFIED ≠ IMPLEMENTED
> RATIFIED ≠ AUTHORIZED
> ```
> Ratifikasi dokumen ini **BUKAN** otorisasi untuk memulai eksekusi migrasi.  
> Status WP-02 kini telah bersih dari seluruh diskrepansi dan resmi dikembalikan ke **Implementation Authorization Gate**.  
> Eksekusi implementasi migrasi fisik hanya dapat dijalankan setelah Product Owner memberikan perintah otorisasi eksplisit:  
> **`AUTHORIZE WP-02 IMPLEMENTATION`**.

---

## 10. ABSOLUTE STOP CONDITION & SIGN-OFF

Sesuai aturan tata kelola mutlak EEOS (*Governance Rule Section 12*):
- [x] Amended DDL specification telah ditinjau dan diratifikasi secara resmi.
- [x] Seluruh kriteria verifikasi konsistensi terbukti lolos (100% PASS).
- [x] **NOL mutasi basis data, NOL eksekusi migrasi, NOL perubahan kode, NOL git commit/push.**

**PROSES DIHENTIKAN SECARA MUTLAK (ABSOLUTE STOP).**  
Sistem menghentikan seluruh aktivitas dan menunggu instruksi otorisasi eksekusi final dari Product Owner:  
**`AUTHORIZE WP-02 IMPLEMENTATION`**.
