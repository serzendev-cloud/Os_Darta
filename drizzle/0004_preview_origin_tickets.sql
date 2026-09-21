-- =============================================================================
-- EEOS Migration: 0004_preview_origin_tickets.sql
-- Work Package: WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-001
-- Description: Creates persistent, distributed storage for Platform Role Preview Origin Tickets
-- Security: Server-side only (RLS Enabled with Zero Public Policies)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.preview_origin_tickets (
    id TEXT PRIMARY KEY,
    ticket_hash VARCHAR(64) NOT NULL,
    origin_user_id TEXT NOT NULL,
    origin_user_email VARCHAR(255) NOT NULL,
    origin_role VARCHAR(50) NOT NULL,
    preview_persona VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ DEFAULT NULL,
    consumed_by_ip VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,

    CONSTRAINT uq_preview_origin_tickets_hash UNIQUE (ticket_hash),
    CONSTRAINT chk_preview_origin_tickets_expiry CHECK (expires_at > created_at),
    CONSTRAINT chk_preview_origin_tickets_hash_len CHECK (length(ticket_hash) = 64)
);

-- Backing Unique Index for instantaneous hash lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_preview_origin_tickets_hash 
ON public.preview_origin_tickets (ticket_hash);

-- Partial B-tree Index for active unconsumed tickets (only static NULL predicate)
CREATE INDEX IF NOT EXISTS idx_preview_origin_tickets_active 
ON public.preview_origin_tickets (ticket_hash, expires_at) 
WHERE consumed_at IS NULL;

-- Composite B-tree Index for background cleanup and expiry ordering
CREATE INDEX IF NOT EXISTS idx_preview_origin_tickets_cleanup 
ON public.preview_origin_tickets (expires_at, consumed_at);

-- Enable Row-Level Security (Strict Server-Side Isolation)
ALTER TABLE public.preview_origin_tickets ENABLE ROW LEVEL SECURITY;

-- Zero public policies: anonymous and standard authenticated roles cannot query this table
-- Direct PostgREST client queries receive 404 / empty results
-- Backend service-role connection bypasses RLS for administrative access
