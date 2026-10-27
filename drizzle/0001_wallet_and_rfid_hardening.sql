-- ==============================================================================
-- Migration: 0001_wallet_and_rfid_hardening.sql (SUPERSEDED / INFORMATIVE ONLY)
-- Domain: APP MA'HAD Finance / Santri Pocket Money & RFID Integrity
-- Governance: M2-WALLET-MASTER-001 (Approved Baseline DEC-01, 03, 08, 09, PO-WLT, LOCK)
-- NOTE: SUPERSEDED BY CANONICAL BASELINE WORK PACKAGE DDL:
--       drizzle/WP-M2-FINANCE-WALLET-RFID-BASELINE-001.sql
--       (Consolidates CREATE TABLE + Hardening + RLS to prevent 42P01 error on fresh DB)
-- ==============================================================================

-- 1. HARDENING RFID_CARDS CREDENTIALS
ALTER TABLE "rfid_cards"
  ADD COLUMN IF NOT EXISTS "salt" text,
  ADD COLUMN IF NOT EXISTS "pin_failed_attempts" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "locked_until" timestamp,
  ADD COLUMN IF NOT EXISTS "last_pin_reset_at" timestamp,
  ADD COLUMN IF NOT EXISTS "last_pin_reset_by" text,
  ADD COLUMN IF NOT EXISTS "kdf_version" text DEFAULT 'pbkdf2-v1' NOT NULL,
  ADD COLUMN IF NOT EXISTS "pepper_version" text DEFAULT 'pep-2026-v1' NOT NULL,
  ADD COLUMN IF NOT EXISTS "iterations" integer DEFAULT 100000 NOT NULL;

-- 2. HARDENING WALLETS & BUSINESS IDENTIFIER (wallet_code)
ALTER TABLE "wallets"
  ADD COLUMN IF NOT EXISTS "wallet_code" text;

-- Constraint Check: Balance non-negative (DEC-08: Zero Overdraft Enforcement)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallets_balance_uang_saku_non_negative'
  ) THEN
    ALTER TABLE "wallets" 
      ADD CONSTRAINT "wallets_balance_uang_saku_non_negative" 
      CHECK ("balance_uang_saku" >= 0);
  END IF;
END $$;

-- Partial Unique Index for wallet_code (enforces uniqueness per tenant)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_wallets_tenant_wallet_code" 
  ON "wallets" ("tenant_id", "wallet_code") 
  WHERE "wallet_code" IS NOT NULL;

-- Enforce Single Active Pocket-Money Wallet per Santri per Tenant (DEC-09)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_wallets_tenant_santri_unique" 
  ON "wallets" ("tenant_id", "santri_id");

-- 3. HARDENING CANTEEN_TRANSACTIONS & IDEMPOTENCY
ALTER TABLE "canteen_transactions"
  ADD COLUMN IF NOT EXISTS "idempotency_key" text,
  ADD COLUMN IF NOT EXISTS "request_hash" varchar(64),
  ADD COLUMN IF NOT EXISTS "response_payload" jsonb;

-- Partial Unique Index on Idempotency Key per Tenant (Prevents duplicate charges & cross-tenant collision)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_canteen_tx_tenant_idempotency" 
  ON "canteen_transactions" ("tenant_id", "idempotency_key") 
  WHERE "idempotency_key" IS NOT NULL;

-- 4. NEW RELATIONAL TABLE: CANTEEN_TRANSACTION_ITEMS (Structured Snapshot POS)
CREATE TABLE IF NOT EXISTS "canteen_transaction_items" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "transaction_id" text NOT NULL,
  "item_id" text,
  "item_name" text NOT NULL,
  "unit_price" integer NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "discount" integer DEFAULT 0 NOT NULL,
  "subtotal" integer NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_canteen_tx_items_tx_id" 
  ON "canteen_transaction_items" ("tenant_id", "transaction_id");

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS (FOR STAGE 3 DISASTER RECOVERY ONLY):
-- DROP TABLE IF EXISTS "canteen_transaction_items";
-- DROP INDEX IF EXISTS "idx_canteen_tx_tenant_idempotency";
-- DROP INDEX IF EXISTS "idx_wallets_tenant_santri_unique";
-- DROP INDEX IF EXISTS "idx_wallets_tenant_wallet_code";
-- ALTER TABLE "wallets" DROP CONSTRAINT IF EXISTS "wallets_balance_uang_saku_non_negative";
-- ALTER TABLE "wallets" DROP COLUMN IF EXISTS "wallet_code";
-- ALTER TABLE "canteen_transactions" DROP COLUMN IF EXISTS "idempotency_key", DROP COLUMN IF EXISTS "request_hash", DROP COLUMN IF EXISTS "response_payload";
-- ALTER TABLE "rfid_cards" DROP COLUMN IF EXISTS "salt", DROP COLUMN IF EXISTS "pin_failed_attempts", DROP COLUMN IF EXISTS "locked_until", DROP COLUMN IF EXISTS "last_pin_reset_at", DROP COLUMN IF EXISTS "last_pin_reset_by", DROP COLUMN IF EXISTS "kdf_version", DROP COLUMN IF EXISTS "pepper_version", DROP COLUMN IF EXISTS "iterations";
-- ==============================================================================
