-- ==============================================================================
-- WORK PACKAGE: WP-MAHAD-FINANCE-BILLING-001
-- DOMAIN: APP MA'HAD Tuition Configuration, Automated Billing, Additional Bill Campaigns, & Recaps
-- TARGET ENGINE: PostgreSQL 17+ (Supabase Managed Cloud Instance)
-- MODE: Idempotent & Hardened Multi-Tenant DDL
-- NOTE: Do NOT execute on Production without explicit Product Owner approval.
-- ==============================================================================

-- ── 1. EXTEND SPP BILLS (SUPPORT ADDITIONAL BILLS & CAMPAIGNS) ────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'spp_bills' AND column_name = 'title'
  ) THEN
    ALTER TABLE "spp_bills" ADD COLUMN "title" text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'spp_bills' AND column_name = 'campaign_id'
  ) THEN
    ALTER TABLE "spp_bills" ADD COLUMN "campaign_id" text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'spp_bills' AND column_name = 'category'
  ) THEN
    ALTER TABLE "spp_bills" ADD COLUMN "category" text DEFAULT 'SPP' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'spp_bills' AND column_name = 'allow_installments'
  ) THEN
    ALTER TABLE "spp_bills" ADD COLUMN "allow_installments" boolean DEFAULT true NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_spp_bills_campaign" ON "spp_bills" ("tenant_id", "campaign_id");
CREATE INDEX IF NOT EXISTS "idx_spp_bills_category_period" ON "spp_bills" ("tenant_id", "category", "period_month_year");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_spp_bills_unique_monthly_spp"
  ON "spp_bills" ("tenant_id", "santri_id", "period_month_year")
  WHERE ("category" = 'SPP');

-- ── 2. SPP CONFIGURATIONS (TARIF & ATURAN PENERBITAN SPP RUTIN) ───────────────
CREATE TABLE IF NOT EXISTS "spp_configurations" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "academic_year" text NOT NULL,
  "monthly_amount" integer NOT NULL,
  "effective_from" timestamp with time zone NOT NULL,
  "effective_to" timestamp with time zone,
  "billing_day_of_month" integer DEFAULT 1 NOT NULL,
  "due_day_of_month" integer DEFAULT 10 NOT NULL,
  "target_scope" text DEFAULT 'ALL_ACTIVE' NOT NULL,
  "target_class" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_spp_config_tenant_active" ON "spp_configurations" ("tenant_id", "is_active");

-- ── 3. BILLING CAMPAIGNS (TAGIHAN TAMBAHAN NON-SPP) ───────────────────────────
CREATE TABLE IF NOT EXISTS "billing_campaigns" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "title" text NOT NULL,
  "category" text NOT NULL,
  "description" text,
  "academic_year" text,
  "amount_per_student" integer NOT NULL,
  "total_target_santri" integer DEFAULT 0 NOT NULL,
  "total_amount" integer DEFAULT 0 NOT NULL,
  "publish_date" timestamp with time zone NOT NULL,
  "due_date" timestamp with time zone NOT NULL,
  "target_scope" text DEFAULT 'ALL' NOT NULL,
  "target_class" text,
  "allow_installments" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'PUBLISHED' NOT NULL,
  "created_by" text NOT NULL,
  "created_by_name" text NOT NULL,
  "idempotency_key" text UNIQUE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_billing_campaigns_tenant" ON "billing_campaigns" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_billing_campaigns_category" ON "billing_campaigns" ("tenant_id", "category");

-- ── 4. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────
ALTER TABLE "spp_configurations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing_campaigns" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'spp_configurations' AND policyname = 'spp_configurations_tenant_isolation'
  ) THEN
    CREATE POLICY "spp_configurations_tenant_isolation" ON "spp_configurations"
      FOR ALL
      USING (
        tenant_id = current_setting('app.current_tenant_id', true)
        OR current_setting('app.is_super_admin', true) = 'true'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'billing_campaigns' AND policyname = 'billing_campaigns_tenant_isolation'
  ) THEN
    CREATE POLICY "billing_campaigns_tenant_isolation" ON "billing_campaigns"
      FOR ALL
      USING (
        tenant_id = current_setting('app.current_tenant_id', true)
        OR current_setting('app.is_super_admin', true) = 'true'
      );
  END IF;
END $$;
