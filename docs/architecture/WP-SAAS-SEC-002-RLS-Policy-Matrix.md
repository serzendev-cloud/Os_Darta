# WP-SAAS-SEC-002 — PostgreSQL Row-Level Security (RLS) Policy Matrix

> **WORK PACKAGE:** WP-SAAS-SEC-002  
> **TITLE:** RLS POLICY SPECIFICATION & PERMISSION MATRIX  
> **BRANCH:** `preview`  
> **DATE:** 2026-09-01  
> **STATUS:** SPECIFIED & AUDITED

---

## 1. Overview & Policy Standard

This document details the exact SQL Row-Level Security (RLS) policies implemented for all database tables in the Ma'had Manager SaaS platform.

### Standard RLS Expression Template

```sql
ALTER TABLE "<table_name>" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<table_name>_tenant_isolation" ON "<table_name>"
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
```

---

## 2. Table-by-Table Policy Specification

### Group A: SaaS Core & Identity

#### 1. `tenants`
```sql
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenants_super_admin_all" ON "tenants"
  FOR ALL
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR (auth.jwt() ->> 'role') = 'SUPER_ADMIN'
    OR (auth.jwt() ->> 'role') = 'DEVELOPER'
  );

CREATE POLICY "tenants_self_read" ON "tenants"
  FOR SELECT
  USING (
    id = current_setting('app.current_tenant_id', true)
    OR slug = current_setting('app.current_tenant_slug', true)
    OR id = (auth.jwt() ->> 'tenant_id')
  );
```

#### 2. `tenant_settings`
```sql
ALTER TABLE "tenant_settings" ENABLE ROW LEVEL SECURITY;

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
```

#### 3. `tenant_roles` & `user_tenant_memberships` & `wali_santri_relationships`
Each table enables RLS and binds to `tenant_id`:
```sql
ALTER TABLE "tenant_roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_roles_isolation" ON "tenant_roles" FOR ALL
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
```

---

### Group B: Core Educational & Operational Tables (34 Tables)
Tables: `santri`, `guru`, `kelas`, `mapel`, `teacher_assignments`, `master_jenjang`, `master_tingkat`, `academic_years`, `academic_terms`, `academic_ledger_records`, `academic_transcripts`, `tolerance_policies`, `asrama`, `kamar`, `master_pelanggaran`, `pelanggaran`, `master_hukuman`, `hukuman`, `governance_cases`, `status_ledgers`, `history_ledgers`, `field_change_records`, `health_visits`, `health_permissions`, `quests`, `notifications`, `audit_logs`, `outbox_events`, `gdrive_documents`.

Each table enables RLS with the standard `tenant_isolation` policy matching `tenant_id`.

---

### Group C: Financial, RFID & POS Tables (10 Tables)
Tables: `wallets`, `wallet_pockets`, `invoices`, `canteens`, `canteen_items`, `canteen_transactions`, `ppob_transactions`, `rfid_cards`, `attendance_logs`, `gate_passes`.

Each table enables RLS with the standard `tenant_isolation` policy matching `tenant_id`.

---

### Group D: Platform-Global Tables (Unrestricted)
Tables: `permissions`, `platform_roles`, `user_platform_roles`, `ppob_categories`, `ppob_products`.
- RLS not required as these represent global platform definitions.

---

## 3. Threat Mitigation Summary

| Threat Scenario | Policy Mechanism | Result |
|---|---|:---:|
| Cross-tenant SELECT bypass | `USING (tenant_id = current_setting('app.current_tenant_id', true))` | **BLOCKED (0 rows returned)** |
| Cross-tenant INSERT spoofing | `WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true))` | **BLOCKED (PostgreSQL Exception)** |
| Cross-tenant UPDATE tampering | `USING` + `WITH CHECK` on `tenant_id` | **BLOCKED (0 rows updated)** |
| Cross-tenant DELETE tampering | `USING (tenant_id = current_setting('app.current_tenant_id', true))` | **BLOCKED (0 rows deleted)** |
| Super Admin Tenant Management | `current_setting('app.is_super_admin', true) = 'true'` | **ALLOWED & CONTROLLED** |
| Connection Pool Context Leak | `SET LOCAL` scoped strictly to active transaction | **WIPED ON TRANSACTION END** |
