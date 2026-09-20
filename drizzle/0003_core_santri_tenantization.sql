-- =============================================================================
-- EEOS WP-02: CORE SANTRI TENANTIZATION & NIS REMEDIATION
-- DDL MIGRATION 0003 (OFFICIALLY RATIFIED CONTRACT)
-- Target: tenants.code, santri.tenant_id, santri.user_id, NIS Scoping
-- =============================================================================

-- 1. Tambahkan kolom code sebagai NULLable pada public.tenants
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS code VARCHAR(10);

-- 2. Backfill EKSPLISIT MURNI (ZERO FALLBACK / ZERO GUESSING)
-- Catatan: Tanpa klausa ELSE. Baris tak terdaftar akan bernilai NULL dan digagalkan oleh NOT NULL.
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
