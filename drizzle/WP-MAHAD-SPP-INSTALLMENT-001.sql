-- ==============================================================================
-- WORK PACKAGE: WP-MAHAD-SPP-INSTALLMENT-001
-- DOMAIN: APP MA'HAD SPP Tuition Billing, Direct Payment & Installment Plans
-- DIRECTIVE: PO Implementation Request — SPP Direct Payment & Installment Approval
-- TARGET ENGINE: PostgreSQL 17+ (Supabase Managed Cloud Instance)
-- MODE: Idempotent & Hardened Multi-Tenant DDL
-- NOTE: Do NOT execute on Production without explicit Product Owner approval.
-- ==============================================================================

-- ── 1. SPP BILLS (TAGIHAN POKOK SPP SANTRI) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS "spp_bills" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "santri_id" text NOT NULL,
  "santri_name" text NOT NULL,
  "wali_id" text NOT NULL,
  "bill_number" text NOT NULL UNIQUE,
  "period_month_year" text NOT NULL,
  "bill_type" text DEFAULT 'SPP_BULANAN' NOT NULL,
  "total_amount" integer NOT NULL,
  "paid_amount" integer DEFAULT 0 NOT NULL,
  "remaining_amount" integer NOT NULL,
  "due_date" timestamp with time zone NOT NULL,
  "status" text DEFAULT 'UNPAID' NOT NULL,
  "active_plan_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_spp_bills_tenant_wali" ON "spp_bills" ("tenant_id", "wali_id");
CREATE INDEX IF NOT EXISTS "idx_spp_bills_tenant_santri" ON "spp_bills" ("tenant_id", "santri_id");

-- ── 2. SPP INSTALLMENT PLANS (PENGAJUAN RENCANA CICILAN) ─────────────────────
CREATE TABLE IF NOT EXISTS "spp_installment_plans" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "bill_id" text NOT NULL,
  "santri_id" text NOT NULL,
  "wali_id" text NOT NULL,
  "requested_installments_count" integer NOT NULL,
  "requested_amount_per_installment" integer NOT NULL,
  "reason" text,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "reviewed_by" text,
  "reviewed_by_name" text,
  "reviewed_at" timestamp with time zone,
  "review_notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_spp_installment_plans_tenant_bill" ON "spp_installment_plans" ("tenant_id", "bill_id");
CREATE INDEX IF NOT EXISTS "idx_spp_installment_plans_status" ON "spp_installment_plans" ("tenant_id", "status");

-- ── 3. SPP INSTALLMENT SCHEDULES (BUTIR JADWAL ANGSURAN RESMI) ───────────────
CREATE TABLE IF NOT EXISTS "spp_installment_schedules" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "plan_id" text NOT NULL,
  "bill_id" text NOT NULL,
  "installment_number" integer NOT NULL,
  "due_date" timestamp with time zone NOT NULL,
  "amount_due" integer NOT NULL,
  "amount_paid" integer DEFAULT 0 NOT NULL,
  "status" text DEFAULT 'PENDING' NOT NULL,
  "paid_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_spp_installment_schedules_plan" ON "spp_installment_schedules" ("tenant_id", "plan_id");

-- ── 4. SPP PAYMENTS (CATATAN PEMBAYARAN RIIL APPEND-ONLY) ───────────────────
CREATE TABLE IF NOT EXISTS "spp_payments" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "bill_id" text NOT NULL,
  "schedule_id" text,
  "payment_number" text NOT NULL UNIQUE,
  "amount" integer NOT NULL,
  "payment_method" text DEFAULT 'TRANSFER_MANUAL' NOT NULL,
  "verified_by" text NOT NULL,
  "verified_by_name" text NOT NULL,
  "verified_at" timestamp with time zone DEFAULT now() NOT NULL,
  "idempotency_key" text UNIQUE,
  "status" text DEFAULT 'SUCCESS' NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_spp_payments_bill" ON "spp_payments" ("tenant_id", "bill_id");

-- ── 5. ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────
ALTER TABLE "spp_bills" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "spp_installment_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "spp_installment_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "spp_payments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spp_bills_tenant_isolation" ON "spp_bills"
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_super_admin', true) = 'true'
  );

CREATE POLICY "spp_installment_plans_tenant_isolation" ON "spp_installment_plans"
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_super_admin', true) = 'true'
  );

CREATE POLICY "spp_installment_schedules_tenant_isolation" ON "spp_installment_schedules"
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_super_admin', true) = 'true'
  );

CREATE POLICY "spp_payments_tenant_isolation" ON "spp_payments"
  FOR ALL
  USING (
    tenant_id = current_setting('app.current_tenant_id', true)
    OR current_setting('app.is_super_admin', true) = 'true'
  );
