-- ==============================================================================
-- DATABASE RECONCILIATION MIGRATION: WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001.sql
-- Work Package: WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001
-- Title: Academic Foundation Implementation — Academic Year & Academic Term
-- Target Database: PostgreSQL / Supabase (Schema: public)
-- Status: PREPARED ONLY — PENDING EXPLICIT PRODUCT OWNER LIVE EXECUTION AUTHORIZATION
-- Traceability: WP-ACADEMIC-FOUNDATION-RECON-001
-- Mode: IDEMPOTENT & ADDITIVE (NO DATA MUTATION, NO DESTRUCTIVE DDL)
-- ==============================================================================

-- ── 1. Table: public.academic_years ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academic_years (
    id text PRIMARY KEY NOT NULL,
    tenant_id text NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status text DEFAULT 'planned' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_academic_years_status CHECK (status IN ('planned', 'active', 'archived')),
    CONSTRAINT chk_academic_years_date_range CHECK (start_date <= end_date),
    CONSTRAINT uq_academic_years_tenant_name UNIQUE (tenant_id, name),
    CONSTRAINT uq_academic_years_tenant_id UNIQUE (tenant_id, id)
);

-- Foreign Key to tenants (Idempotent check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_academic_years_tenant'
    ) THEN
        ALTER TABLE public.academic_years
            ADD CONSTRAINT fk_academic_years_tenant
            FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- Partial unique index: At most ONE active academic year per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_academic_years_tenant_active
    ON public.academic_years (tenant_id)
    WHERE status = 'active';

-- Status lookup index
CREATE INDEX IF NOT EXISTS idx_academic_years_tenant_status
    ON public.academic_years (tenant_id, status);

-- ── 2. Table: public.academic_terms ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.academic_terms (
    id text PRIMARY KEY NOT NULL,
    tenant_id text NOT NULL,
    academic_year_id text NOT NULL,
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_current boolean DEFAULT false NOT NULL,
    status text DEFAULT 'planned' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_academic_terms_status CHECK (status IN ('planned', 'active', 'closed')),
    CONSTRAINT chk_academic_terms_date_range CHECK (start_date <= end_date),
    CONSTRAINT uq_academic_terms_year_name UNIQUE (tenant_id, academic_year_id, name)
);

-- Foreign Key to tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_academic_terms_tenant'
    ) THEN
        ALTER TABLE public.academic_terms
            ADD CONSTRAINT fk_academic_terms_tenant
            FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
            ON DELETE CASCADE;
    END IF;
END $$;

-- Foreign Key to academic_years (RESTRICT on delete to preserve historical integrity)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_academic_terms_year'
    ) THEN
        ALTER TABLE public.academic_terms
            ADD CONSTRAINT fk_academic_terms_year
            FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
            ON DELETE RESTRICT;
    END IF;
END $$;

-- Composite Foreign Key: Guarantees academic_terms belongs to the SAME tenant's academic_year
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_academic_terms_tenant_year'
    ) THEN
        ALTER TABLE public.academic_terms
            ADD CONSTRAINT fk_academic_terms_tenant_year
            FOREIGN KEY (tenant_id, academic_year_id)
            REFERENCES public.academic_years(tenant_id, id)
            ON DELETE RESTRICT;
    END IF;
END $$;

-- Partial unique index: At most ONE current term per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_academic_terms_tenant_current
    ON public.academic_terms (tenant_id)
    WHERE is_current = true;

-- Partial unique index: At most ONE active term per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_academic_terms_tenant_active
    ON public.academic_terms (tenant_id)
    WHERE status = 'active';

-- Indexes for querying terms by academic year and status
CREATE INDEX IF NOT EXISTS idx_academic_terms_tenant_year
    ON public.academic_terms (tenant_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_academic_terms_tenant_status
    ON public.academic_terms (tenant_id, status);

-- ── 3. Row-Level Security (RLS) Posture ────────────────────────────────────────
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'academic_years' AND policyname = 'academic_years_tenant_isolation'
    ) THEN
        CREATE POLICY "academic_years_tenant_isolation" ON public.academic_years
            FOR ALL
            USING (
                tenant_id = current_setting('app.current_tenant_id', true)
                OR tenant_id = (auth.jwt() ->> 'tenant_id')
                OR current_setting('app.is_super_admin', true) = 'true'
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'academic_terms' AND policyname = 'academic_terms_tenant_isolation'
    ) THEN
        CREATE POLICY "academic_terms_tenant_isolation" ON public.academic_terms
            FOR ALL
            USING (
                tenant_id = current_setting('app.current_tenant_id', true)
                OR tenant_id = (auth.jwt() ->> 'tenant_id')
                OR current_setting('app.is_super_admin', true) = 'true'
            );
    END IF;
END $$;
