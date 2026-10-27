-- ============================================================
-- MIGRATION: WP-DB-RECON-CORE-001.sql
-- WORK PACKAGE: WP-DB-RECON-CORE-001
-- PHASE: Phase 1 — Core Multi-Tenant SaaS Reconciliation
-- TRACEABILITY: CIP-WP-002 | WP-TENANT-PROVISION-002 | WP-DB-SCHEMA-SYNC-001
-- MODE: IDEMPOTENT & ADDITIVE (NO DATA MUTATION, NO DESTRUCTIVE DDL)
-- ============================================================

-- ── 1. OBJECT #1: public.tenant_settings ─────────────────────
-- Canonical Authority: src/lib/db/schema.ts (lines 14-33)
-- Purpose: Multi-tenant branding, credentials, and portal config

CREATE TABLE IF NOT EXISTS "tenant_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"gdrive_service_account_json" text,
	"flip_secret_key" text,
	"flip_validation_token" text,
	"wa_gateway_api_key" text,
	"custom_logo_url" text,
	"custom_bg_url" text,
	"primary_color" text DEFAULT '#0F766E',
	"tagline" text DEFAULT 'Sistem Informasi Pesantren Terpadu',
	"login_title" text,
	"login_subtitle" text,
	"login_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_settings_tenant_id_unique" UNIQUE("tenant_id")
);

--> statement-breakpoint

-- ── 2. OBJECT #2: public.platform_settings ───────────────────
-- Canonical Authority: src/lib/db/schema.ts (lines 36-45), commit b2a0974
-- Purpose: Global platform company profile & contact info for SERZEN DEV

CREATE TABLE IF NOT EXISTS "platform_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text DEFAULT 'SERZEN DEV' NOT NULL,
	"company_email" text,
	"company_phone" text,
	"company_whatsapp" text,
	"company_website" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- ── 3. OBJECT #3: public.audit_logs (tenant_id column & index) ──
-- Canonical Authority: src/lib/db/schema.ts (line 356)
-- Purpose: Align audit_logs with multi-tenant partitioning requirement

ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "tenant_id" text DEFAULT 'default' NOT NULL;

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "audit_logs_tenant_idx" ON "audit_logs" USING btree ("tenant_id");
