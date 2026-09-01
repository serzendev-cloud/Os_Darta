-- ============================================================
-- MIGRATION: 0002_tenant_rls_hardening.sql
-- WORK PACKAGE: WP-SAAS-SEC-002 (Tenant Database RLS Hardening)
-- TRACEABILITY: CIP-WP-002 | HOTFIX-001 | RAR-SEC-004
-- ============================================================

-- ── 1. CORE PLATFORM & SETTINGS TABLES ──────────────────────

-- 1.1 tenants table
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenants_super_admin_all" ON "tenants"
  FOR ALL
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
    OR (auth.jwt() ->> 'role') = 'DEVELOPER'
  );
--> statement-breakpoint
CREATE POLICY "tenants_self_read" ON "tenants"
  FOR SELECT
  USING (
    id = current_setting('app.current_tenant_id', true)
    OR slug = current_setting('app.current_tenant_slug', true)
    OR id = (auth.jwt() ->> 'tenant_id')
  );
--> statement-breakpoint

-- 1.2 tenant_settings table
ALTER TABLE "tenant_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_settings_isolation" ON "tenant_settings"
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
--> statement-breakpoint

-- ── 2. RBAC & IDENTITY TABLES ───────────────────────────────

ALTER TABLE "tenant_roles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_roles_isolation" ON "tenant_roles"
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
--> statement-breakpoint

ALTER TABLE "user_tenant_memberships" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "user_tenant_memberships_isolation" ON "user_tenant_memberships"
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
--> statement-breakpoint

ALTER TABLE "wali_santri_relationships" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "wali_santri_relationships_isolation" ON "wali_santri_relationships"
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
--> statement-breakpoint

-- ── 3. ACADEMIC & EDUCATION TABLES ──────────────────────────

ALTER TABLE "santri" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "santri_isolation" ON "santri"
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
--> statement-breakpoint

ALTER TABLE "guru" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "guru_isolation" ON "guru"
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
--> statement-breakpoint

ALTER TABLE "kelas" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "kelas_isolation" ON "kelas"
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
--> statement-breakpoint

ALTER TABLE "mapel" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "mapel_isolation" ON "mapel"
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
--> statement-breakpoint

ALTER TABLE "teacher_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "teacher_assignments_isolation" ON "teacher_assignments"
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
--> statement-breakpoint

ALTER TABLE "master_jenjang" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "master_jenjang_isolation" ON "master_jenjang"
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
--> statement-breakpoint

ALTER TABLE "master_tingkat" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "master_tingkat_isolation" ON "master_tingkat"
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
--> statement-breakpoint

ALTER TABLE "academic_years" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "academic_years_isolation" ON "academic_years"
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
--> statement-breakpoint

ALTER TABLE "academic_terms" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "academic_terms_isolation" ON "academic_terms"
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
--> statement-breakpoint

ALTER TABLE "academic_ledger_records" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "academic_ledger_records_isolation" ON "academic_ledger_records"
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
--> statement-breakpoint

ALTER TABLE "academic_transcripts" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "academic_transcripts_isolation" ON "academic_transcripts"
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
--> statement-breakpoint

ALTER TABLE "tolerance_policies" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tolerance_policies_isolation" ON "tolerance_policies"
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
--> statement-breakpoint

-- ── 4. ASRAMA, PELANGGARAN & GOVERNANCE TABLES ──────────────

ALTER TABLE "asrama" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "asrama_isolation" ON "asrama"
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
--> statement-breakpoint

ALTER TABLE "kamar" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "kamar_isolation" ON "kamar"
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
--> statement-breakpoint

ALTER TABLE "master_pelanggaran" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "master_pelanggaran_isolation" ON "master_pelanggaran"
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
--> statement-breakpoint

ALTER TABLE "pelanggaran" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "pelanggaran_isolation" ON "pelanggaran"
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
--> statement-breakpoint

ALTER TABLE "master_hukuman" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "master_hukuman_isolation" ON "master_hukuman"
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
--> statement-breakpoint

ALTER TABLE "hukuman" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "hukuman_isolation" ON "hukuman"
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
--> statement-breakpoint

ALTER TABLE "governance_cases" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "governance_cases_isolation" ON "governance_cases"
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
--> statement-breakpoint

ALTER TABLE "status_ledgers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "status_ledgers_isolation" ON "status_ledgers"
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
--> statement-breakpoint

ALTER TABLE "history_ledgers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "history_ledgers_isolation" ON "history_ledgers"
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
--> statement-breakpoint

ALTER TABLE "field_change_records" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "field_change_records_isolation" ON "field_change_records"
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
--> statement-breakpoint

ALTER TABLE "health_visits" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "health_visits_isolation" ON "health_visits"
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
--> statement-breakpoint

ALTER TABLE "health_permissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "health_permissions_isolation" ON "health_permissions"
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
--> statement-breakpoint

ALTER TABLE "quests" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "quests_isolation" ON "quests"
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
--> statement-breakpoint

-- ── 5. FINANCIAL, RFID, POS & PPOB TABLES ───────────────────

ALTER TABLE "wallets" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
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
--> statement-breakpoint

ALTER TABLE "wallet_pockets" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
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
--> statement-breakpoint

ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "invoices_isolation" ON "invoices"
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
--> statement-breakpoint

ALTER TABLE "canteens" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
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
--> statement-breakpoint

ALTER TABLE "canteen_items" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
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
--> statement-breakpoint

ALTER TABLE "canteen_transactions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
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
--> statement-breakpoint

ALTER TABLE "ppob_transactions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "ppob_transactions_isolation" ON "ppob_transactions"
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
--> statement-breakpoint

ALTER TABLE "rfid_cards" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
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
--> statement-breakpoint

ALTER TABLE "attendance_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "attendance_logs_isolation" ON "attendance_logs"
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
--> statement-breakpoint

ALTER TABLE "gate_passes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "gate_passes_isolation" ON "gate_passes"
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
--> statement-breakpoint

-- ── 6. NOTIFICATION, AUDIT & STORAGE TABLES ─────────────────

ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "notifications_isolation" ON "notifications"
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
--> statement-breakpoint

ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "audit_logs_isolation" ON "audit_logs"
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
--> statement-breakpoint

ALTER TABLE "outbox_events" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "outbox_events_isolation" ON "outbox_events"
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
--> statement-breakpoint

ALTER TABLE "gdrive_documents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "gdrive_documents_isolation" ON "gdrive_documents"
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
