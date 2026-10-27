-- ==============================================================================
-- WORK PACKAGE: WP-M2-FINANCIAL-AUDIT-TRAIL-AND-DIGITAL-CCTV-001
-- DOMAIN: APP MA'HAD Financial Audit Trail, Append-Only Ledger, Refunds & Reconciliation
-- DIRECTIVE: PO Implementation Request — Financial Audit Trail & Digital CCTV
-- TARGET ENGINE: PostgreSQL 17+ (Supabase Managed Cloud Instance)
-- MODE: Canonical Base DDL & Hardening Synthesis (Self-Contained & Idempotent)
-- PREREQUISITE: WP-M2-FINANCE-WALLET-RFID-BASELINE-001.sql MUST be executed first
-- ==============================================================================

-- ── PRE-FLIGHT PREREQUISITE ASSERTION ─────────────────────────────────────────
-- Verifies that baseline finance tables ('wallets', 'wallet_pockets', 'canteen_transactions')
-- exist before attaching triggers and creating dependent financial ledger tables.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'wallet_pockets'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'canteen_transactions'
  ) THEN
    RAISE EXCEPTION 'MIGRATION PREREQUISITE FAILED: WP-M2-FINANCE-WALLET-RFID-BASELINE-001.sql must be executed prior to WP-M2-FINANCIAL-AUDIT-TRAIL-AND-DIGITAL-CCTV-001.sql (table "wallet_pockets" or "canteen_transactions" not found).';
  END IF;
END $$;


-- ── 0. DATABASE ENGINE APPEND-ONLY ENFORCEMENT TRIGGER ────────────────────────
-- Hardened: Enforces immutable append-only constraints at the database engine level.
-- ARCHITECTURAL BOUNDARY:
-- 1. Historical Ledger Mutation Tables: 'financial_audit_logs', 'merchant_ledger', 'wallet_pockets'
--    Strictly append-only. UPDATE and DELETE are blocked fail-closed by database triggers.
-- 2. Operational Balance Tables: 'wallets'
--    Remains updatable for legitimate, authorized wallet deductions (RFID payments) and refund credits.
-- 3. Workflow State Tables: 'canteen_refunds', 'financial_anomalies', 'financial_reconciliation_runs'
--    Remains updatable for administrative status transitions (PENDING_APPROVAL -> APPROVED, OPEN -> RESOLVED).
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Financial Ledger is append-only: % operations are strictly forbidden on table %', TG_OP, TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;


-- ── 1. FINANCIAL AUDIT LOGS (APPEND-ONLY IMMUTABLE AUDIT TRAIL) ───────────────
CREATE TABLE IF NOT EXISTS "financial_audit_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "correlation_id" text NOT NULL,
  "actor_id" text NOT NULL,
  "actor_name" text NOT NULL,
  "actor_role" text NOT NULL,
  "action" text NOT NULL,
  "target_entity" text NOT NULL,
  "target_id" text NOT NULL,
  "amount" integer DEFAULT 0 NOT NULL,
  "state_before" jsonb,
  "state_after" jsonb,
  "ip_address" text,
  "user_agent" text,
  "status" text DEFAULT 'SUCCESS' NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_financial_audit_logs_tenant_corr" 
  ON "financial_audit_logs" ("tenant_id", "correlation_id");
CREATE INDEX IF NOT EXISTS "idx_financial_audit_logs_tenant_actor" 
  ON "financial_audit_logs" ("tenant_id", "actor_id");
CREATE INDEX IF NOT EXISTS "idx_financial_audit_logs_tenant_target" 
  ON "financial_audit_logs" ("tenant_id", "target_entity", "target_id");
CREATE INDEX IF NOT EXISTS "idx_financial_audit_logs_tenant_created" 
  ON "financial_audit_logs" ("tenant_id", "created_at" DESC);

-- Attach Append-Only Database Trigger
DROP TRIGGER IF EXISTS trg_financial_audit_logs_append_only ON "financial_audit_logs";
CREATE TRIGGER trg_financial_audit_logs_append_only
  BEFORE UPDATE OR DELETE ON "financial_audit_logs"
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

ALTER TABLE "financial_audit_logs" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Strict RLS: Granular SELECT & INSERT Only (No UPDATE or DELETE granted)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'financial_audit_logs' AND policyname = 'financial_audit_logs_select'
  ) THEN
    CREATE POLICY "financial_audit_logs_select" ON "financial_audit_logs"
      FOR SELECT
      USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'financial_audit_logs' AND policyname = 'financial_audit_logs_insert'
  ) THEN
    CREATE POLICY "financial_audit_logs_insert" ON "financial_audit_logs"
      FOR INSERT
      WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
      );
  END IF;
END $$;


-- ── 2. MERCHANT LEDGER (HAK PENDAPATAN MERCHANT & CENTRAL ESCROW) ─────────────
CREATE TABLE IF NOT EXISTS "merchant_ledger" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "canteen_id" text NOT NULL,
  "entry_type" text NOT NULL,
  "amount" integer NOT NULL,
  "balance_before" integer NOT NULL,
  "balance_after" integer NOT NULL,
  "reference_type" text NOT NULL,
  "reference_id" text NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_merchant_ledger_tenant_canteen" 
  ON "merchant_ledger" ("tenant_id", "canteen_id");
CREATE INDEX IF NOT EXISTS "idx_merchant_ledger_ref" 
  ON "merchant_ledger" ("tenant_id", "reference_type", "reference_id");
CREATE INDEX IF NOT EXISTS "idx_merchant_ledger_created" 
  ON "merchant_ledger" ("tenant_id", "created_at" DESC);

-- Attach Append-Only Database Trigger
DROP TRIGGER IF EXISTS trg_merchant_ledger_append_only ON "merchant_ledger";
CREATE TRIGGER trg_merchant_ledger_append_only
  BEFORE UPDATE OR DELETE ON "merchant_ledger"
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

ALTER TABLE "merchant_ledger" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Strict RLS: Granular SELECT & INSERT Only (No UPDATE or DELETE granted)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'merchant_ledger' AND policyname = 'merchant_ledger_select'
  ) THEN
    CREATE POLICY "merchant_ledger_select" ON "merchant_ledger"
      FOR SELECT
      USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'merchant_ledger' AND policyname = 'merchant_ledger_insert'
  ) THEN
    CREATE POLICY "merchant_ledger_insert" ON "merchant_ledger"
      FOR INSERT
      WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
      );
  END IF;
END $$;


-- ── 2B. HARDEN WALLET POCKETS LEDGER WITH DATABASE TRIGGER ────────────────────
-- Protect existing wallet_pockets mutation log against unauthorized modification or deletion
DROP TRIGGER IF EXISTS trg_wallet_pockets_append_only ON "wallet_pockets";
CREATE TRIGGER trg_wallet_pockets_append_only
  BEFORE UPDATE OR DELETE ON "wallet_pockets"
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();


-- ── 3. CANTEEN REFUNDS (PHASE 1 ADMIN APPROVAL WORKFLOW) ──────────────────────
CREATE TABLE IF NOT EXISTS "canteen_refunds" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "transaction_id" text NOT NULL,
  "canteen_id" text NOT NULL,
  "santri_id" text NOT NULL,
  "original_amount" integer NOT NULL,
  "refund_amount" integer NOT NULL,
  "reason" text NOT NULL,
  "status" text DEFAULT 'PENDING_APPROVAL' NOT NULL,
  "requested_by" text NOT NULL,
  "requested_by_name" text NOT NULL,
  "requested_at" timestamp DEFAULT now() NOT NULL,
  "reviewed_by" text,
  "reviewed_by_name" text,
  "reviewed_at" timestamp,
  "review_notes" text,
  "processed_transaction_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_canteen_refunds_tenant_tx" 
  ON "canteen_refunds" ("tenant_id", "transaction_id");
CREATE INDEX IF NOT EXISTS "idx_canteen_refunds_tenant_status" 
  ON "canteen_refunds" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "idx_canteen_refunds_tenant_santri" 
  ON "canteen_refunds" ("tenant_id", "santri_id");

ALTER TABLE "canteen_refunds" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'canteen_refunds' AND policyname = 'canteen_refunds_isolation'
  ) THEN
    CREATE POLICY "canteen_refunds_isolation" ON "canteen_refunds"
      FOR ALL
      USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
      )
      WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
      );
  END IF;
END $$;


-- ── 4. FINANCIAL RECONCILIATION RUNS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "financial_reconciliation_runs" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "run_type" text DEFAULT 'AUTOMATED' NOT NULL,
  "triggered_by" text NOT NULL,
  "status" text DEFAULT 'COMPLETED' NOT NULL,
  "total_transactions_checked" integer DEFAULT 0 NOT NULL,
  "total_amount_checked" integer DEFAULT 0 NOT NULL,
  "discrepancies_count" integer DEFAULT 0 NOT NULL,
  "summary" jsonb,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp
);

CREATE INDEX IF NOT EXISTS "idx_financial_recon_runs_tenant_status" 
  ON "financial_reconciliation_runs" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "idx_financial_recon_runs_created" 
  ON "financial_reconciliation_runs" ("tenant_id", "started_at" DESC);

ALTER TABLE "financial_reconciliation_runs" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'financial_reconciliation_runs' AND policyname = 'financial_recon_runs_isolation'
  ) THEN
    CREATE POLICY "financial_recon_runs_isolation" ON "financial_reconciliation_runs"
      FOR ALL
      USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
      )
      WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
      );
  END IF;
END $$;


-- ── 5. FINANCIAL ANOMALIES & INVESTIGATION CASES ───────────────────────────────
CREATE TABLE IF NOT EXISTS "financial_anomalies" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "reconciliation_run_id" text,
  "anomaly_type" text NOT NULL,
  "severity" text DEFAULT 'HIGH' NOT NULL,
  "status" text DEFAULT 'OPEN' NOT NULL,
  "related_entity_type" text NOT NULL,
  "related_entity_id" text NOT NULL,
  "discrepancy_amount" integer DEFAULT 0 NOT NULL,
  "description" text NOT NULL,
  "resolution_notes" text,
  "resolved_by" text,
  "resolved_at" timestamp,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_financial_anomalies_tenant_status" 
  ON "financial_anomalies" ("tenant_id", "status");
CREATE INDEX IF NOT EXISTS "idx_financial_anomalies_tenant_severity" 
  ON "financial_anomalies" ("tenant_id", "severity");
CREATE INDEX IF NOT EXISTS "idx_financial_anomalies_created" 
  ON "financial_anomalies" ("tenant_id", "created_at" DESC);

ALTER TABLE "financial_anomalies" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'financial_anomalies' AND policyname = 'financial_anomalies_isolation'
  ) THEN
    CREATE POLICY "financial_anomalies_isolation" ON "financial_anomalies"
      FOR ALL
      USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
      )
      WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
      );
  END IF;
END $$;
