-- ==============================================================================
-- SUPABASE MIGRATION: 20261020000001_finance_wallet_and_rfid_baseline.sql
-- WORK PACKAGE: WP-M2-FINANCE-WALLET-RFID-BASELINE-001
-- DOMAIN: APP MA'HAD Finance / Santri Pocket Money, RFID Cards & Canteen POS
-- GOVERNANCE: M2-WALLET-MASTER-001-R4.8
-- TARGET ENGINE: PostgreSQL 17+ (Supabase Managed Cloud Instance)
-- MODE: Canonical Base DDL & Hardening Synthesis (Self-Contained & Idempotent)
-- ==============================================================================

-- ── 1. RFID CARDS TABLE (SMART CARD SANTRI & PIN CREDENTIAL ENGINE) ───────────
CREATE TABLE IF NOT EXISTS "rfid_cards" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "santri_id" text NOT NULL REFERENCES "santri"("id") ON DELETE CASCADE,
  "card_uid" text NOT NULL,
  "hashed_pin" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "paired_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  -- M2-WALLET-MASTER-001 Hardening Fields
  "salt" text,
  "pin_failed_attempts" integer DEFAULT 0 NOT NULL,
  "locked_until" timestamp,
  "last_pin_reset_at" timestamp,
  "last_pin_reset_by" text,
  "kdf_version" text DEFAULT 'pbkdf2-v1' NOT NULL,
  "pepper_version" text DEFAULT 'pep-2026-v1' NOT NULL,
  "iterations" integer DEFAULT 100000 NOT NULL,
  CONSTRAINT "rfid_cards_card_uid_unique" UNIQUE("card_uid")
);

CREATE INDEX IF NOT EXISTS "idx_rfid_cards_tenant_santri" 
  ON "rfid_cards" ("tenant_id", "santri_id");

ALTER TABLE "rfid_cards" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'rfid_cards' AND policyname = 'rfid_cards_isolation'
  ) THEN
    CREATE POLICY "rfid_cards_isolation" ON "rfid_cards"
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


-- ── 2. WALLETS TABLE (VIRTUAL LEDGER FOR WALI & SANTRI) ───────────────────────
CREATE TABLE IF NOT EXISTS "wallets" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "wali_id" text NOT NULL,
  "santri_id" text NOT NULL REFERENCES "santri"("id") ON DELETE CASCADE,
  "balance_uang_saku" integer DEFAULT 0 NOT NULL,
  "balance_tabungan" integer DEFAULT 0 NOT NULL,
  "daily_limit" integer DEFAULT 20000 NOT NULL,
  "canteen_status" text DEFAULT 'active' NOT NULL,
  "suspended_reason" text,
  "suspended_by" text,
  "freeze_requested_by" text,
  "freeze_requested_at" timestamp,
  "freeze_reason" text,
  "freeze_duration" text,
  "freeze_expires_at" timestamp,
  -- M2-WALLET-MASTER-001 Business Identifier
  "wallet_code" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  -- DEC-08: Zero Overdraft Enforcement
  CONSTRAINT "wallets_balance_uang_saku_non_negative" CHECK ("balance_uang_saku" >= 0),
  CONSTRAINT "wallets_balance_tabungan_non_negative" CHECK ("balance_tabungan" >= 0)
);

-- Partial Unique Index on wallet_code per tenant
CREATE UNIQUE INDEX IF NOT EXISTS "idx_wallets_tenant_wallet_code" 
  ON "wallets" ("tenant_id", "wallet_code") 
  WHERE "wallet_code" IS NOT NULL;

-- DEC-09: Single Active Wallet per Santri per Tenant
CREATE UNIQUE INDEX IF NOT EXISTS "idx_wallets_tenant_santri_unique" 
  ON "wallets" ("tenant_id", "santri_id");

ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'wallets_isolation'
  ) THEN
    CREATE POLICY "wallets_isolation" ON "wallets"
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


-- ── 3. WALLET POCKETS TABLE (AUDIT LEDGER MUTATION LOG) ───────────────────────
CREATE TABLE IF NOT EXISTS "wallet_pockets" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "wallet_id" text NOT NULL REFERENCES "wallets"("id") ON DELETE CASCADE,
  "pocket_type" text NOT NULL, -- 'uang_saku' | 'tabungan'
  "mutation_type" text NOT NULL, -- 'topup' | 'canteen_deduct' | 'transfer' | 'spp_deduct'
  "amount" integer NOT NULL,
  "balance_before" integer NOT NULL,
  "balance_after" integer NOT NULL,
  "description" text NOT NULL,
  "reference_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_wallet_pockets_tenant_wallet" 
  ON "wallet_pockets" ("tenant_id", "wallet_id");

ALTER TABLE "wallet_pockets" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wallet_pockets' AND policyname = 'wallet_pockets_isolation'
  ) THEN
    CREATE POLICY "wallet_pockets_isolation" ON "wallet_pockets"
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


-- ── 4. CANTEENS TABLE (MULTI-VENDOR / CANTEEN OUTLETS) ────────────────────────
CREATE TABLE IF NOT EXISTS "canteens" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "code" text NOT NULL,
  "location" text NOT NULL,
  "cashier_user_id" text,
  "status" text DEFAULT 'active' NOT NULL,
  "operating_hours" text DEFAULT '06:00 - 17:00' NOT NULL,
  "receipt_footer" text DEFAULT 'Terima kasih telah berbelanja di Pesantren' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_canteens_tenant_id" 
  ON "canteens" ("tenant_id");

ALTER TABLE "canteens" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'canteens' AND policyname = 'canteens_isolation'
  ) THEN
    CREATE POLICY "canteens_isolation" ON "canteens"
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


-- ── 5. CANTEEN ITEMS TABLE (CATALOG & SERVER-SIDE PRICE SOURCE) ───────────────
CREATE TABLE IF NOT EXISTS "canteen_items" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "canteen_id" text NOT NULL REFERENCES "canteens"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "code" text,
  "category" text DEFAULT 'makanan' NOT NULL,
  "price" integer NOT NULL,
  "stock" integer DEFAULT 100 NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_canteen_items_tenant_canteen" 
  ON "canteen_items" ("tenant_id", "canteen_id");

ALTER TABLE "canteen_items" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'canteen_items' AND policyname = 'canteen_items_isolation'
  ) THEN
    CREATE POLICY "canteen_items_isolation" ON "canteen_items"
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


-- ── 6. CANTEEN TRANSACTIONS TABLE (POS LOG & IDEMPOTENCY) ─────────────────────
CREATE TABLE IF NOT EXISTS "canteen_transactions" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "canteen_id" text,
  "santri_id" text NOT NULL REFERENCES "santri"("id") ON DELETE CASCADE,
  "santri_name" text NOT NULL,
  "card_uid" text NOT NULL,
  "amount" integer NOT NULL,
  "items_description" text,
  "vendor_name" text DEFAULT 'Kantin Utama' NOT NULL,
  "pos_cashier_id" text,
  "status" text DEFAULT 'SUCCESS' NOT NULL,
  -- M2-WALLET-MASTER-001 Idempotency Guard
  "idempotency_key" text,
  "request_hash" varchar(64),
  "response_payload" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Partial Unique Index on Idempotency Key per Tenant
CREATE UNIQUE INDEX IF NOT EXISTS "idx_canteen_tx_tenant_idempotency" 
  ON "canteen_transactions" ("tenant_id", "idempotency_key") 
  WHERE "idempotency_key" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_canteen_tx_tenant_santri_date" 
  ON "canteen_transactions" ("tenant_id", "santri_id", "created_at");

ALTER TABLE "canteen_transactions" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'canteen_transactions' AND policyname = 'canteen_transactions_isolation'
  ) THEN
    CREATE POLICY "canteen_transactions_isolation" ON "canteen_transactions"
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


-- ── 7. CANTEEN TRANSACTION ITEMS TABLE (POS STRUCTURED ITEM SNAPSHOT) ─────────
CREATE TABLE IF NOT EXISTS "canteen_transaction_items" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "transaction_id" text NOT NULL REFERENCES "canteen_transactions"("id") ON DELETE CASCADE,
  "item_id" text,
  "item_name" text NOT NULL,
  "unit_price" integer NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "discount" integer DEFAULT 0 NOT NULL,
  "subtotal" integer NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_canteen_tx_items_tenant_tx" 
  ON "canteen_transaction_items" ("tenant_id", "transaction_id");

ALTER TABLE "canteen_transaction_items" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'canteen_transaction_items' AND policyname = 'canteen_tx_items_isolation'
  ) THEN
    CREATE POLICY "canteen_tx_items_isolation" ON "canteen_transaction_items"
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


-- ==============================================================================
-- ROLLBACK SCRIPT (FOR DISASTER RECOVERY ONLY — LIFO DROP ORDER):
-- ==============================================================================
-- DROP TABLE IF EXISTS "canteen_transaction_items" CASCADE;
-- DROP TABLE IF EXISTS "canteen_transactions" CASCADE;
-- DROP TABLE IF EXISTS "canteen_items" CASCADE;
-- DROP TABLE IF EXISTS "canteens" CASCADE;
-- DROP TABLE IF EXISTS "wallet_pockets" CASCADE;
-- DROP TABLE IF EXISTS "wallets" CASCADE;
-- DROP TABLE IF EXISTS "rfid_cards" CASCADE;
-- ==============================================================================
