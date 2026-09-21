-- =============================================================================
-- EEOS Migration: 0005_tenant_code_counters.sql
-- Work Package: WP-TENANT-PROVISIONING-INVITATION-001
-- Description: Dedicated persistent counter table for atomic SRYYNN tenant code generation
-- Security: Server-side only (RLS Enabled with Zero Public Policies)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tenant_code_counters (
    year SMALLINT PRIMARY KEY,
    last_sequence INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_tenant_code_counter_year CHECK (year >= 2026 AND year <= 2099),
    CONSTRAINT chk_tenant_code_counter_seq CHECK (last_sequence >= 0)
);

-- Enable Row-Level Security (Strict Server-Side Isolation)
ALTER TABLE public.tenant_code_counters ENABLE ROW LEVEL SECURITY;

-- Seed baseline for year 2026 (last_sequence = 0 -> First SRYYNN tenant is SR2601)
-- Zero backfill: Legacy tenant codes (RTV01..AUD01) are preserved as legacy codes.
INSERT INTO public.tenant_code_counters (year, last_sequence, created_at, updated_at)
VALUES (2026, 0, now(), now())
ON CONFLICT (year) DO NOTHING;
