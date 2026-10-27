-- ==============================================================================
-- DATABASE RECONCILIATION MIGRATION: WP-ACADEMIC-STRUCTURE-IMPLEMENTATION-001.sql
-- Work Package: WP-ACADEMIC-STRUCTURE-IMPLEMENTATION-001
-- Title: Academic Structure — Canonical Schema Implementation & Controlled Migration
-- Target Database: PostgreSQL / Supabase (Schema: public)
-- Traceability: WP-ACADEMIC-STRUCTURE-SCHEMA-001
-- Mode: IDEMPOTENT & ADDITIVE (NO DATA MUTATION, NO UNRELATED DESTRUCTIVE DDL)
-- ==============================================================================

-- ── 1. Table: public.madrasah ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.madrasah (
    id text PRIMARY KEY NOT NULL,
    tenant_id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'active' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_madrasah_status CHECK (status IN ('active', 'inactive')),
    CONSTRAINT uq_madrasah_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_madrasah_tenant_code UNIQUE (tenant_id, code)
);

-- Foreign Key to tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_madrasah_tenant'
    ) THEN
        ALTER TABLE public.madrasah
            ADD CONSTRAINT fk_madrasah_tenant
            FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- Status lookup index
CREATE INDEX IF NOT EXISTS idx_madrasah_tenant_status
    ON public.madrasah (tenant_id, status);

-- Row-Level Security: madrasah
ALTER TABLE public.madrasah ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'madrasah' AND policyname = 'madrasah_tenant_isolation'
    ) THEN
        CREATE POLICY "madrasah_tenant_isolation" ON public.madrasah
            FOR ALL
            USING (
                tenant_id = current_setting('app.current_tenant_id', true)
                OR tenant_id = (auth.jwt() ->> 'tenant_id')
                OR current_setting('app.is_super_admin', true) = 'true'
            );
    END IF;
END $$;


-- ── 2. Table: public.jenjang ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jenjang (
    id text PRIMARY KEY NOT NULL,
    tenant_id text NOT NULL,
    madrasah_id text NOT NULL,
    name text NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'active' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_jenjang_status CHECK (status IN ('active', 'inactive')),
    CONSTRAINT uq_jenjang_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_jenjang_tenant_madrasah_id UNIQUE (tenant_id, madrasah_id, id),
    CONSTRAINT uq_jenjang_tenant_madrasah_name UNIQUE (tenant_id, madrasah_id, name)
);

-- Foreign Key to tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_jenjang_tenant'
    ) THEN
        ALTER TABLE public.jenjang
            ADD CONSTRAINT fk_jenjang_tenant
            FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- Composite Foreign Key: Guarantees jenjang belongs to the SAME tenant's madrasah
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_jenjang_tenant_madrasah'
    ) THEN
        ALTER TABLE public.jenjang
            ADD CONSTRAINT fk_jenjang_tenant_madrasah
            FOREIGN KEY (tenant_id, madrasah_id)
            REFERENCES public.madrasah(tenant_id, id)
            ON DELETE RESTRICT;
    END IF;
END $$;

-- Order and retrieval index
CREATE INDEX IF NOT EXISTS idx_jenjang_tenant_madrasah
    ON public.jenjang (tenant_id, madrasah_id, order_index);

-- Row-Level Security: jenjang
ALTER TABLE public.jenjang ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'jenjang' AND policyname = 'jenjang_tenant_isolation'
    ) THEN
        CREATE POLICY "jenjang_tenant_isolation" ON public.jenjang
            FOR ALL
            USING (
                tenant_id = current_setting('app.current_tenant_id', true)
                OR tenant_id = (auth.jwt() ->> 'tenant_id')
                OR current_setting('app.is_super_admin', true) = 'true'
            );
    END IF;
END $$;


-- ── 3. Table: public.tingkat ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tingkat (
    id text PRIMARY KEY NOT NULL,
    tenant_id text NOT NULL,
    madrasah_id text NOT NULL,
    jenjang_id text NOT NULL,
    sequence integer NOT NULL,
    ui_label text NOT NULL,
    status text DEFAULT 'active' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_tingkat_sequence_positive CHECK (sequence > 0),
    CONSTRAINT chk_tingkat_status CHECK (status IN ('active', 'inactive')),
    CONSTRAINT uq_tingkat_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_tingkat_tenant_madrasah_sequence UNIQUE (tenant_id, madrasah_id, sequence)
);

-- Foreign Key to tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_tingkat_tenant'
    ) THEN
        ALTER TABLE public.tingkat
            ADD CONSTRAINT fk_tingkat_tenant
            FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- Composite Foreign Key: Guarantees tingkat belongs to the SAME tenant's madrasah
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_tingkat_tenant_madrasah'
    ) THEN
        ALTER TABLE public.tingkat
            ADD CONSTRAINT fk_tingkat_tenant_madrasah
            FOREIGN KEY (tenant_id, madrasah_id)
            REFERENCES public.madrasah(tenant_id, id)
            ON DELETE RESTRICT;
    END IF;
END $$;

-- Composite Foreign Key: Guarantees tingkat.jenjang_id belongs to the SAME tenant and SAME madrasah
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_tingkat_tenant_madrasah_jenjang'
    ) THEN
        ALTER TABLE public.tingkat
            ADD CONSTRAINT fk_tingkat_tenant_madrasah_jenjang
            FOREIGN KEY (tenant_id, madrasah_id, jenjang_id)
            REFERENCES public.jenjang(tenant_id, madrasah_id, id)
            ON DELETE RESTRICT;
    END IF;
END $$;

-- Sequence and hierarchy lookup indexes
CREATE INDEX IF NOT EXISTS idx_tingkat_tenant_madrasah_seq
    ON public.tingkat (tenant_id, madrasah_id, sequence);

CREATE INDEX IF NOT EXISTS idx_tingkat_tenant_jenjang
    ON public.tingkat (tenant_id, jenjang_id);

-- Row-Level Security: tingkat
ALTER TABLE public.tingkat ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'tingkat' AND policyname = 'tingkat_tenant_isolation'
    ) THEN
        CREATE POLICY "tingkat_tenant_isolation" ON public.tingkat
            FOR ALL
            USING (
                tenant_id = current_setting('app.current_tenant_id', true)
                OR tenant_id = (auth.jwt() ->> 'tenant_id')
                OR current_setting('app.is_super_admin', true) = 'true'
            );
    END IF;
END $$;


-- ── 4. Table: public.rombel ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rombel (
    id text PRIMARY KEY NOT NULL,
    tenant_id text NOT NULL,
    academic_year_id text NOT NULL,
    tingkat_id text NOT NULL,
    name text NOT NULL,
    display_label text,
    capacity integer DEFAULT 30 NOT NULL,
    status text DEFAULT 'active' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_rombel_capacity CHECK (capacity > 0),
    CONSTRAINT chk_rombel_status CHECK (status IN ('active', 'inactive')),
    CONSTRAINT uq_rombel_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_rombel_tenant_year_tingkat_name UNIQUE (tenant_id, academic_year_id, tingkat_id, name)
);

-- Foreign Key to tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_rombel_tenant'
    ) THEN
        ALTER TABLE public.rombel
            ADD CONSTRAINT fk_rombel_tenant
            FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- Composite Foreign Key: Guarantees rombel belongs to the SAME tenant's academic_year
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_rombel_tenant_year'
    ) THEN
        ALTER TABLE public.rombel
            ADD CONSTRAINT fk_rombel_tenant_year
            FOREIGN KEY (tenant_id, academic_year_id)
            REFERENCES public.academic_years(tenant_id, id)
            ON DELETE RESTRICT;
    END IF;
END $$;

-- Composite Foreign Key: Guarantees rombel belongs to the SAME tenant's tingkat
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_rombel_tenant_tingkat'
    ) THEN
        ALTER TABLE public.rombel
            ADD CONSTRAINT fk_rombel_tenant_tingkat
            FOREIGN KEY (tenant_id, tingkat_id)
            REFERENCES public.tingkat(tenant_id, id)
            ON DELETE RESTRICT;
    END IF;
END $$;

-- Query indexes
CREATE INDEX IF NOT EXISTS idx_rombel_tenant_year
    ON public.rombel (tenant_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_rombel_tenant_tingkat
    ON public.rombel (tenant_id, tingkat_id);

-- Row-Level Security: rombel
ALTER TABLE public.rombel ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'rombel' AND policyname = 'rombel_tenant_isolation'
    ) THEN
        CREATE POLICY "rombel_tenant_isolation" ON public.rombel
            FOR ALL
            USING (
                tenant_id = current_setting('app.current_tenant_id', true)
                OR tenant_id = (auth.jwt() ->> 'tenant_id')
                OR current_setting('app.is_super_admin', true) = 'true'
            );
    END IF;
END $$;
