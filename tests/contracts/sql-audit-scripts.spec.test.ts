// ==============================================================================
// Isolated Test Suite: SQL Precondition & Postcondition Audit Scripts (Round 4.1)
// Work Package: WP-SPP-01B.1 (Day-Zero Schema & Canonical Partial Unique Index)
// Mode: STRICT ISOLATED TEST HARNESS (Positive & 33 Negative Divergence Cases)
// Directives: ZERO SUBSTRING LIKE, Fail-Closed on NULL (WF-01, WF-03),
//             Strict Single-Column FK Cardinality IS DISTINCT FROM 1 (WF-02)
// ==============================================================================

import { describe, it, expect } from 'vitest';

export interface MockCatalogContext {
  serverVersion: number;
  tables: Array<{ schema: string; name: string }>;
  columns: Array<{
    table_schema: string;
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>;
  constraints: Array<{
    schema: string;
    table: string;
    name: string;
    type: 'p' | 'c' | 'f' | 'u';
    def?: string;
    validated?: boolean;
    confupdtype?: string;
    confdeltype?: string;
    conkey_names?: string[];
    confkey_names?: string[];
    reftable?: string;
  }>;
  indexes: Array<{
    schema: string;
    table: string;
    name: string;
    am: string;
    is_unique: boolean;
    is_valid: boolean;
    is_ready: boolean;
    is_live: boolean;
    key_columns: string[];
    predicate: string | null;
  }>;
  triggers: Array<{
    schema: string;
    table: string;
    name: string;
    tgtype: number;
    tgenabled: string;
    tgattr_cols: string[];
    function_name: string;
  }>;
  functions: Array<{
    schema: string;
    name: string;
    return_type: string;
    language: string;
    volatile: string;
    secdef: boolean;
    nargs: number;
  }>;
  tableRls: Array<{
    schema: string;
    table: string;
    rowsecurity: boolean;
    forcerowsecurity: boolean;
  }>;
  policies: Array<{
    schema: string;
    table: string;
    name: string;
    cmd: 'r' | 'a' | 'w' | 'd';
    roles: string[];
    qual: string | null;
    with_check: string | null;
  }>;
}

/**
 * Executes the SQL Precondition script logic against the catalog context.
 */
export function executePreconditionAudit(ctx: MockCatalogContext): { passed: boolean; message: string } {
  // 1. Engine Version Verification (PostgreSQL 17+)
  if (ctx.serverVersion < 170000) {
    throw new Error(`PRECONDITION FAILED: Target engine version ${ctx.serverVersion} is below PostgreSQL 17 (170000 required)`);
  }

  // 2. Prerequisite Tables & Dependency Verification
  const requiredTables = ['tenants', 'santri', 'users', 'santri_wali'];
  for (const tbl of requiredTables) {
    const found = ctx.tables.some((t) => t.schema === 'public' && t.name === tbl);
    if (!found) {
      throw new Error(`PRECONDITION FAILED: Prerequisite table public.${tbl} is missing`);
    }
  }

  // 3. Prerequisite Auth Function Signature Verification (auth.jwt() with exactly 0 arguments)
  const authJwt = ctx.functions.find((f) => f.schema === 'auth' && f.name === 'jwt');
  if (!authJwt) {
    throw new Error('PRECONDITION FAILED: Prerequisite authentication function auth.jwt() is missing');
  }
  if (authJwt.nargs !== 0 || authJwt.return_type !== 'jsonb') {
    throw new Error(`PRECONDITION FAILED: Prerequisite authentication function auth.jwt() signature mismatch (Must have 0 arguments and return jsonb, Got nargs=${authJwt.nargs})`);
  }

  // 4. Target Conflict Checks (Clean-Slate Invariant scoped to public schema & spp_bills)
  const targetTableExists = ctx.tables.some((t) => t.schema === 'public' && t.name === 'spp_bills');
  if (targetTableExists) {
    throw new Error('PRECONDITION FAILED: Target table public.spp_bills already exists');
  }

  const procConflict = ctx.functions.some((f) => f.schema === 'public' && f.name === 'fn_spp_bills_validate_santri_tenant');
  if (procConflict) {
    throw new Error('PRECONDITION FAILED: Function public.fn_spp_bills_validate_santri_tenant already exists');
  }

  const triggerConflict = ctx.triggers.some((t) => t.schema === 'public' && t.table === 'spp_bills' && t.name === 'trg_spp_bills_validate_santri_tenant');
  if (triggerConflict) {
    throw new Error('PRECONDITION FAILED: Trigger trg_spp_bills_validate_santri_tenant on table public.spp_bills already exists');
  }

  const canonicalIdxConflict = ctx.indexes.some((i) => i.schema === 'public' && i.name === 'idx_spp_bills_unique_monthly_spp');
  if (canonicalIdxConflict) {
    throw new Error('PRECONDITION FAILED: Canonical index name idx_spp_bills_unique_monthly_spp is already allocated');
  }

  return { passed: true, message: 'PRECONDITION AUDIT PASSED: All structural prerequisites and clean-slate invariants verified' };
}

/**
 * Executes the SQL Postcondition script logic against the catalog context.
 */
export function executePostconditionAudit(ctx: MockCatalogContext): { passed: boolean; message: string } {
  // 1. Column-by-Column Schema Specification Check (Exactly 20 Columns)
  const expectedCols: Record<string, { type: string; nullable: string }> = {
    id: { type: 'uuid', nullable: 'NO' },
    tenant_id: { type: 'character varying', nullable: 'NO' },
    santri_id: { type: 'character varying', nullable: 'NO' },
    bill_number: { type: 'character varying', nullable: 'NO' },
    category: { type: 'character varying', nullable: 'NO' },
    title: { type: 'character varying', nullable: 'NO' },
    description: { type: 'text', nullable: 'YES' },
    amount: { type: 'numeric', nullable: 'NO' },
    paid_amount: { type: 'numeric', nullable: 'NO' },
    remaining_amount: { type: 'numeric', nullable: 'NO' },
    period_month_year: { type: 'character varying', nullable: 'YES' },
    academic_year_id: { type: 'character varying', nullable: 'YES' },
    due_date: { type: 'date', nullable: 'NO' },
    status: { type: 'character varying', nullable: 'NO' },
    is_installment_allowed: { type: 'boolean', nullable: 'NO' },
    installment_plan_id: { type: 'character varying', nullable: 'YES' },
    created_by: { type: 'character varying', nullable: 'NO' },
    created_at: { type: 'timestamp with time zone', nullable: 'NO' },
    updated_at: { type: 'timestamp with time zone', nullable: 'NO' },
    deleted_at: { type: 'timestamp with time zone', nullable: 'YES' },
  };

  const actualCols = ctx.columns.filter((c) => c.table_schema === 'public' && c.table_name === 'spp_bills');
  if (actualCols.length !== 20) {
    throw new Error(`POSTCONDITION FAILED: Column count mismatch on public.spp_bills (Expected 20, Got ${actualCols.length})`);
  }

  for (const [colName, spec] of Object.entries(expectedCols)) {
    const col = actualCols.find((c) => c.column_name === colName);
    if (!col) {
      throw new Error(`POSTCONDITION FAILED: Required column public.spp_bills.${colName} is missing`);
    }
    if (col.data_type !== spec.type) {
      throw new Error(`POSTCONDITION FAILED: Column ${colName} data type mismatch (Expected ${spec.type}, Got ${col.data_type})`);
    }
    if (col.is_nullable !== spec.nullable) {
      throw new Error(`POSTCONDITION FAILED: Column ${colName} nullability mismatch (Expected ${spec.nullable}, Got ${col.is_nullable})`);
    }
  }

  // 2. Primary Key Check
  const pk = ctx.constraints.find((c) => c.table === 'spp_bills' && c.type === 'p');
  if (!pk || pk.name !== 'spp_bills_pkey' || !pk.conkey_names?.includes('id') || pk.conkey_names.length !== 1) {
    throw new Error('POSTCONDITION FAILED: Primary key spp_bills_pkey on column id is missing or invalid');
  }

  // 3. CHECK Constraints: Strict Name & Exact Definition Equivalence (NO SUBSTRING LIKE!)
  const expectedChecks: Record<string, string> = {
    spp_bills_amount_non_negative: '(amount >= (0)::numeric)',
    spp_bills_paid_amount_non_negative: '(paid_amount >= (0)::numeric)',
    spp_bills_remaining_amount_non_negative: '(remaining_amount >= (0)::numeric)',
    spp_bills_paid_lte_amount: '(paid_amount <= amount)',
    spp_bills_remaining_calc_check: '(remaining_amount = (amount - paid_amount))',
    spp_bills_category_check: "category = ANY (ARRAY['SPP'::text, 'DAFTAR_ULANG'::text, 'PENGEMBANGAN'::text, 'SERAGAM'::text, 'KITAB'::text, 'LAINNYA'::text])",
    spp_bills_status_check: "status = ANY (ARRAY['UNPAID'::text, 'PARTIAL'::text, 'PAID'::text, 'CANCELLED'::text])",
    spp_bills_period_format_check: "((category <> 'SPP'::text) OR ((period_month_year IS NOT NULL) AND (period_month_year ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'::text)))",
    spp_bills_installment_plan_consistency: "((installment_plan_id IS NULL) OR (category = 'SPP'::text))",
  };

  const actualChecks = ctx.constraints.filter((c) => c.table === 'spp_bills' && c.type === 'c');
  if (actualChecks.length !== 9) {
    throw new Error(`POSTCONDITION FAILED: CHECK constraints count mismatch (Expected exactly 9, Got ${actualChecks.length})`);
  }

  for (const [chkName, expectedDef] of Object.entries(expectedChecks)) {
    const chk = actualChecks.find((c) => c.name === chkName);
    if (!chk) {
      throw new Error(`POSTCONDITION FAILED: CHECK constraint ${chkName} missing on public.spp_bills`);
    }
    const normActual = chk.def?.replace(/\s+/g, ' ').trim();
    const normExpected = expectedDef.replace(/\s+/g, ' ').trim();
    if (normActual !== normExpected) {
      throw new Error(`POSTCONDITION FAILED: CHECK constraint ${chkName} definition mismatch (Expected "${normExpected}", Got "${normActual}")`);
    }
  }

  // 4. Foreign Keys: Strict Pairing, Rules, Whitelist & Exclusion of Excess FKs (Exactly 3 FKs)
  const actualFks = ctx.constraints.filter((c) => c.table === 'spp_bills' && c.type === 'f');
  if (actualFks.length !== 3) {
    throw new Error(`POSTCONDITION FAILED: Excess unauthorized foreign keys found on public.spp_bills (Expected exactly 3, Got ${actualFks.length})`);
  }

  const expectedFks: Record<string, { src: string; targetTbl: string; targetCol: string; delAction: string; upAction: string }> = {
    fk_spp_bills_tenant: { src: 'tenant_id', targetTbl: 'tenants', targetCol: 'id', delAction: 'r', upAction: 'a' },
    fk_spp_bills_santri: { src: 'santri_id', targetTbl: 'santri', targetCol: 'id', delAction: 'r', upAction: 'a' },
    fk_spp_bills_created_by: { src: 'created_by', targetTbl: 'users', targetCol: 'id', delAction: 'r', upAction: 'a' },
  };

  for (const [fkName, expFk] of Object.entries(expectedFks)) {
    const fk = actualFks.find((c) => c.name === fkName);
    if (!fk) {
      throw new Error(`POSTCONDITION FAILED: Foreign key ${fkName} missing on public.spp_bills`);
    }
    if (fk.reftable !== expFk.targetTbl) {
      throw new Error(`POSTCONDITION FAILED: Foreign key ${fkName} referenced table mismatch (Expected ${expFk.targetTbl}, Got ${fk.reftable})`);
    }
    if (!fk.conkey_names || fk.conkey_names.length !== 1 || !fk.confkey_names || fk.confkey_names.length !== 1) {
      throw new Error(`POSTCONDITION FAILED: Foreign key ${fkName} must be single-column (composite FK forbidden)`);
    }
    if (fk.conkey_names[0] !== expFk.src || fk.confkey_names[0] !== expFk.targetCol) {
      throw new Error(`POSTCONDITION FAILED: Foreign key ${fkName} column pair mismatch (Expected ${expFk.src}->${expFk.targetCol})`);
    }
    if (fk.confdeltype !== expFk.delAction) {
      throw new Error(`POSTCONDITION FAILED: Foreign key ${fkName} confdeltype mismatch (Expected ${expFk.delAction}, Got ${fk.confdeltype})`);
    }
    if (fk.confupdtype !== expFk.upAction) {
      throw new Error(`POSTCONDITION FAILED: Foreign key ${fkName} confupdtype mismatch (Expected ${expFk.upAction}, Got ${fk.confupdtype})`);
    }
    if (fk.validated !== true) {
      throw new Error(`POSTCONDITION FAILED: Foreign key ${fkName} is not validated (convalidated must be true)`);
    }
  }

  // 5. Canonical Partial Unique Index: Zero Substring LIKE, Exact Predicate Equivalence
  const canonicalIdx = ctx.indexes.find(
    (i) => i.schema === 'public' && i.table === 'spp_bills' && i.name === 'idx_spp_bills_unique_monthly_spp'
  );
  if (!canonicalIdx) {
    throw new Error('POSTCONDITION FAILED: Canonical index idx_spp_bills_unique_monthly_spp is missing');
  }

  if (canonicalIdx.am !== 'btree') {
    throw new Error(`POSTCONDITION FAILED: Canonical index access method invalid (Expected btree, Got ${canonicalIdx.am})`);
  }
  if (!canonicalIdx.is_unique || !canonicalIdx.is_valid || !canonicalIdx.is_ready || !canonicalIdx.is_live) {
    throw new Error('POSTCONDITION FAILED: Canonical index status flags invalid (Must be UNIQUE, VALID, READY, LIVE)');
  }
  if (canonicalIdx.key_columns.length !== 3) {
    throw new Error(`POSTCONDITION FAILED: Canonical index must have exactly 3 key columns (Got ${canonicalIdx.key_columns.length})`);
  }

  const expectedKeyOrder = ['tenant_id', 'santri_id', 'period_month_year'];
  if (JSON.stringify(canonicalIdx.key_columns) !== JSON.stringify(expectedKeyOrder)) {
    throw new Error(
      `POSTCONDITION FAILED: Canonical index key columns order mismatch (Expected ${expectedKeyOrder.join(', ')}, Got ${canonicalIdx.key_columns.join(', ')})`
    );
  }

  // Strict predicate equivalence: reject non-partial (NULL), OR logic, equality on CANCELLED, or missing conditions
  // WF-03: Explicit Fail-Closed check on NULL predicate (Reject non-partial index)
  if (canonicalIdx.predicate === null || canonicalIdx.predicate === undefined) {
    throw new Error('POSTCONDITION FAILED: Canonical index idx_spp_bills_unique_monthly_spp must be partial (predicate is NULL)');
  }

  const normPred = canonicalIdx.predicate.replace(/\s+/g, ' ').trim();
  const canonicalExpected = "((category = 'SPP'::text) AND (status <> 'CANCELLED'::text))";
  const canonicalExpectedVarchar = "(((category)::text = 'SPP'::text) AND ((status)::text <> 'CANCELLED'::text))";
  if (normPred !== canonicalExpected && normPred !== canonicalExpectedVarchar) {
    throw new Error(`POSTCONDITION FAILED: Canonical index partial predicate mismatch (Expected "${canonicalExpected}", Got "${normPred}")`);
  }

  // 6. Trigger & Trigger Function Verification
  const trg = ctx.triggers.find((t) => t.table === 'spp_bills' && t.name === 'trg_spp_bills_validate_santri_tenant');
  if (!trg) {
    throw new Error('POSTCONDITION FAILED: Trigger trg_spp_bills_validate_santri_tenant is missing');
  }

  if (trg.tgtype !== 23) {
    throw new Error(`POSTCONDITION FAILED: Trigger tgtype mismatch (Expected 23, Got ${trg.tgtype})`);
  }
  if (trg.tgenabled !== 'O') {
    throw new Error(`POSTCONDITION FAILED: Trigger tgenabled mismatch (Expected 'O', Got ${trg.tgenabled})`);
  }

  const expectedTrgCols = ['tenant_id', 'santri_id'];
  if (JSON.stringify(trg.tgattr_cols) !== JSON.stringify(expectedTrgCols)) {
    throw new Error(
      `POSTCONDITION FAILED: Trigger tgattr must track exactly tenant_id and santri_id (Got ${trg.tgattr_cols.join(', ')})`
    );
  }

  const trgFn = ctx.functions.find(
    (f) => f.schema === 'public' && f.name === trg.function_name
  );
  if (!trgFn) {
    throw new Error(`POSTCONDITION FAILED: Trigger function ${trg.function_name} is missing`);
  }
  if (trgFn.return_type !== 'trigger' || trgFn.language !== 'plpgsql' || trgFn.volatile !== 'v') {
    throw new Error('POSTCONDITION FAILED: Trigger function signature or properties mismatch (Must return trigger, plpgsql, VOLATILE)');
  }
  if (trgFn.secdef !== false) {
    throw new Error('POSTCONDITION FAILED: Trigger function must be SECURITY INVOKER (secdef must be false)');
  }

  // 7. RLS Configuration & 4 Policies Individual Verification (ZERO SUBSTRING LIKE!)
  const rlsConfig = ctx.tableRls.find((r) => r.schema === 'public' && r.table === 'spp_bills');
  if (!rlsConfig || !rlsConfig.rowsecurity || !rlsConfig.forcerowsecurity) {
    throw new Error('POSTCONDITION FAILED: RLS must be both ENABLED and FORCED on public.spp_bills');
  }

  const actualPolicies = ctx.policies.filter((p) => p.table === 'spp_bills');
  if (actualPolicies.length !== 4) {
    throw new Error(`POSTCONDITION FAILED: Policy count mismatch on public.spp_bills (Expected exactly 4, Got ${actualPolicies.length})`);
  }

  const expectedPolicies: Record<
    string,
    {
      cmd: 'r' | 'a' | 'w' | 'd';
      roles: string[];
      expectedQual: string | null;
      expectedWithCheck: string | null;
    }
  > = {
    spp_bills_tenant_and_wali_read: {
      cmd: 'r',
      roles: ['public'],
      expectedQual:
        "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) AND (((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text, 'PIMPINAN'::text, 'BENDAHARA'::text, 'STAF_ADMIN'::text])) OR (((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'WALI_SANTRI'::text) AND (EXISTS (SELECT 1 FROM public.santri_wali sw WHERE sw.tenant_id = spp_bills.tenant_id AND sw.wali_id = (auth.jwt() -> 'app_metadata'::text ->> 'user_id'::text) AND sw.santri_id = spp_bills.santri_id AND sw.status = 'ACTIVE'::text)))))",
      expectedWithCheck: null,
    },
    spp_bills_tenant_staff_insert: {
      cmd: 'a',
      roles: ['public'],
      expectedQual: null,
      expectedWithCheck:
        "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) AND ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text, 'BENDAHARA'::text, 'STAF_ADMIN'::text])))",
    },
    spp_bills_tenant_staff_update: {
      cmd: 'w',
      roles: ['public'],
      expectedQual:
        "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) AND ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text, 'BENDAHARA'::text, 'STAF_ADMIN'::text])))",
      expectedWithCheck:
        "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) AND ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text, 'BENDAHARA'::text, 'STAF_ADMIN'::text])))",
    },
    spp_bills_superadmin_delete: {
      cmd: 'd',
      roles: ['public'],
      expectedQual:
        "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) AND ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text])))",
      expectedWithCheck: null,
    },
  };

  for (const [polName, spec] of Object.entries(expectedPolicies)) {
    const pol = actualPolicies.find((p) => p.name === polName);
    if (!pol) {
      throw new Error(`POSTCONDITION FAILED: RLS policy ${polName} missing on public.spp_bills`);
    }
    if (pol.cmd !== spec.cmd) {
      throw new Error(`POSTCONDITION FAILED: RLS policy ${polName} command mismatch (Expected ${spec.cmd}, Got ${pol.cmd})`);
    }
    if (JSON.stringify(pol.roles) !== JSON.stringify(spec.roles)) {
      throw new Error(`POSTCONDITION FAILED: RLS policy ${polName} roles mismatch (Must be exactly ['public'])`);
    }

    // WF-01: Explicit Fail-Closed check on NULL expression before canonical comparison
    if (spec.cmd === 'r' && (pol.qual === null || pol.qual === undefined)) {
      throw new Error(`POSTCONDITION FAILED: RLS policy ${polName} requires non-NULL USING expression`);
    }
    if (spec.cmd === 'd' && (pol.qual === null || pol.qual === undefined)) {
      throw new Error(`POSTCONDITION FAILED: RLS policy ${polName} requires non-NULL USING expression`);
    }
    if (spec.cmd === 'a' && (pol.with_check === null || pol.with_check === undefined)) {
      throw new Error(`POSTCONDITION FAILED: RLS policy ${polName} requires non-NULL WITH CHECK expression`);
    }
    if (spec.cmd === 'w' && (pol.qual === null || pol.qual === undefined || pol.with_check === null || pol.with_check === undefined)) {
      throw new Error(`POSTCONDITION FAILED: RLS policy ${polName} requires both non-NULL USING and WITH CHECK expressions`);
    }

    // Exact definition matching (no LIKE)
    const normActualQual = pol.qual ? pol.qual.replace(/\s+/g, ' ').trim() : null;
    const normExpQual = spec.expectedQual ? spec.expectedQual.replace(/\s+/g, ' ').trim() : null;
    if (normActualQual !== normExpQual) {
      throw new Error(`POSTCONDITION FAILED: RLS policy ${polName} USING clause definition mismatch (Expected "${normExpQual}", Got "${normActualQual}")`);
    }

    const normActualCheck = pol.with_check ? pol.with_check.replace(/\s+/g, ' ').trim() : null;
    const normExpCheck = spec.expectedWithCheck ? spec.expectedWithCheck.replace(/\s+/g, ' ').trim() : null;
    if (normActualCheck !== normExpCheck) {
      throw new Error(`POSTCONDITION FAILED: RLS policy ${polName} WITH CHECK clause definition mismatch (Expected "${normExpCheck}", Got "${normActualCheck}")`);
    }
  }

  return { passed: true, message: 'POSTCONDITION AUDIT PASSED: All structural, constraint, foreign key, index, trigger, and RLS specifications verified' };
}

// ── TEST HARNESS DATA FIXTURES ───────────────────────────────────────────────
function createValidFixture(): MockCatalogContext {
  return {
    serverVersion: 170002,
    tables: [
      { schema: 'public', name: 'tenants' },
      { schema: 'public', name: 'santri' },
      { schema: 'public', name: 'users' },
      { schema: 'public', name: 'santri_wali' },
      { schema: 'public', name: 'spp_bills' },
    ],
    columns: [
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'id', data_type: 'uuid', is_nullable: 'NO', column_default: 'gen_random_uuid()' },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'tenant_id', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'santri_id', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'bill_number', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'category', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'title', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'description', data_type: 'text', is_nullable: 'YES', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'amount', data_type: 'numeric', is_nullable: 'NO', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'paid_amount', data_type: 'numeric', is_nullable: 'NO', column_default: '0' },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'remaining_amount', data_type: 'numeric', is_nullable: 'NO', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'period_month_year', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'academic_year_id', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'due_date', data_type: 'date', is_nullable: 'NO', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'status', data_type: 'character varying', is_nullable: 'NO', column_default: "'UNPAID'::character varying" },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'is_installment_allowed', data_type: 'boolean', is_nullable: 'NO', column_default: 'false' },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'installment_plan_id', data_type: 'character varying', is_nullable: 'YES', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'created_by', data_type: 'character varying', is_nullable: 'NO', column_default: null },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'created_at', data_type: 'timestamp with time zone', is_nullable: 'NO', column_default: 'now()' },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'updated_at', data_type: 'timestamp with time zone', is_nullable: 'NO', column_default: 'now()' },
      { table_schema: 'public', table_name: 'spp_bills', column_name: 'deleted_at', data_type: 'timestamp with time zone', is_nullable: 'YES', column_default: null },
    ],
    constraints: [
      { schema: 'public', table: 'spp_bills', name: 'spp_bills_pkey', type: 'p', conkey_names: ['id'], validated: true },
      { schema: 'public', table: 'spp_bills', name: 'spp_bills_amount_non_negative', type: 'c', def: '(amount >= (0)::numeric)' },
      { schema: 'public', table: 'spp_bills', name: 'spp_bills_paid_amount_non_negative', type: 'c', def: '(paid_amount >= (0)::numeric)' },
      { schema: 'public', table: 'spp_bills', name: 'spp_bills_remaining_amount_non_negative', type: 'c', def: '(remaining_amount >= (0)::numeric)' },
      { schema: 'public', table: 'spp_bills', name: 'spp_bills_paid_lte_amount', type: 'c', def: '(paid_amount <= amount)' },
      { schema: 'public', table: 'spp_bills', name: 'spp_bills_remaining_calc_check', type: 'c', def: '(remaining_amount = (amount - paid_amount))' },
      { schema: 'public', table: 'spp_bills', name: 'spp_bills_category_check', type: 'c', def: "category = ANY (ARRAY['SPP'::text, 'DAFTAR_ULANG'::text, 'PENGEMBANGAN'::text, 'SERAGAM'::text, 'KITAB'::text, 'LAINNYA'::text])" },
      { schema: 'public', table: 'spp_bills', name: 'spp_bills_status_check', type: 'c', def: "status = ANY (ARRAY['UNPAID'::text, 'PARTIAL'::text, 'PAID'::text, 'CANCELLED'::text])" },
      { schema: 'public', table: 'spp_bills', name: 'spp_bills_period_format_check', type: 'c', def: "((category <> 'SPP'::text) OR ((period_month_year IS NOT NULL) AND (period_month_year ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'::text)))" },
      { schema: 'public', table: 'spp_bills', name: 'spp_bills_installment_plan_consistency', type: 'c', def: "((installment_plan_id IS NULL) OR (category = 'SPP'::text))" },
      { schema: 'public', table: 'spp_bills', name: 'fk_spp_bills_tenant', type: 'f', conkey_names: ['tenant_id'], confkey_names: ['id'], reftable: 'tenants', confupdtype: 'a', confdeltype: 'r', validated: true },
      { schema: 'public', table: 'spp_bills', name: 'fk_spp_bills_santri', type: 'f', conkey_names: ['santri_id'], confkey_names: ['id'], reftable: 'santri', confupdtype: 'a', confdeltype: 'r', validated: true },
      { schema: 'public', table: 'spp_bills', name: 'fk_spp_bills_created_by', type: 'f', conkey_names: ['created_by'], confkey_names: ['id'], reftable: 'users', confupdtype: 'a', confdeltype: 'r', validated: true },
    ],
    indexes: [
      {
        schema: 'public',
        table: 'spp_bills',
        name: 'idx_spp_bills_unique_monthly_spp',
        am: 'btree',
        is_unique: true,
        is_valid: true,
        is_ready: true,
        is_live: true,
        key_columns: ['tenant_id', 'santri_id', 'period_month_year'],
        predicate: "((category = 'SPP'::text) AND (status <> 'CANCELLED'::text))",
      },
    ],
    triggers: [
      {
        schema: 'public',
        table: 'spp_bills',
        name: 'trg_spp_bills_validate_santri_tenant',
        tgtype: 23,
        tgenabled: 'O',
        tgattr_cols: ['tenant_id', 'santri_id'],
        function_name: 'fn_spp_bills_validate_santri_tenant',
      },
    ],
    functions: [
      { schema: 'auth', name: 'jwt', return_type: 'jsonb', language: 'sql', volatile: 's', secdef: false, nargs: 0 },
      { schema: 'public', name: 'fn_spp_bills_validate_santri_tenant', return_type: 'trigger', language: 'plpgsql', volatile: 'v', secdef: false, nargs: 0 },
    ],
    tableRls: [
      { schema: 'public', table: 'spp_bills', rowsecurity: true, forcerowsecurity: true },
    ],
    policies: [
      {
        schema: 'public',
        table: 'spp_bills',
        name: 'spp_bills_tenant_and_wali_read',
        cmd: 'r',
        roles: ['public'],
        qual: "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) AND (((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text, 'PIMPINAN'::text, 'BENDAHARA'::text, 'STAF_ADMIN'::text])) OR (((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'WALI_SANTRI'::text) AND (EXISTS (SELECT 1 FROM public.santri_wali sw WHERE sw.tenant_id = spp_bills.tenant_id AND sw.wali_id = (auth.jwt() -> 'app_metadata'::text ->> 'user_id'::text) AND sw.santri_id = spp_bills.santri_id AND sw.status = 'ACTIVE'::text)))))",
        with_check: null,
      },
      {
        schema: 'public',
        table: 'spp_bills',
        name: 'spp_bills_tenant_staff_insert',
        cmd: 'a',
        roles: ['public'],
        qual: null,
        with_check: "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) AND ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text, 'BENDAHARA'::text, 'STAF_ADMIN'::text])))",
      },
      {
        schema: 'public',
        table: 'spp_bills',
        name: 'spp_bills_tenant_staff_update',
        cmd: 'w',
        roles: ['public'],
        qual: "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) AND ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text, 'BENDAHARA'::text, 'STAF_ADMIN'::text])))",
        with_check: "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) AND ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text, 'BENDAHARA'::text, 'STAF_ADMIN'::text])))",
      },
      {
        schema: 'public',
        table: 'spp_bills',
        name: 'spp_bills_superadmin_delete',
        cmd: 'd',
        roles: ['public'],
        qual: "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) AND ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text])))",
        with_check: null,
      },
    ],
  };
}

describe('ISOLATED AUDIT: SQL Precondition & Postcondition Scripts Verification (Round 4.1)', () => {
  // ── POSITIVE PATH ─────────────────────────────────────────────────────────
  it('POS-01: Skrip Precondition sukses saat semua prasyarat dan dependensi terpenuhi', () => {
    const fixture = createValidFixture();
    fixture.tables = fixture.tables.filter((t) => t.name !== 'spp_bills');
    fixture.indexes = [];
    fixture.triggers = [];
    fixture.functions = fixture.functions.filter((f) => f.name !== 'fn_spp_bills_validate_santri_tenant');

    const result = executePreconditionAudit(fixture);
    expect(result.passed).toBe(true);
    expect(result.message).toContain('PRECONDITION AUDIT PASSED');
  });

  it('POS-02: Skrip Postcondition sukses saat seluruh 20 kolom, 9 CHECK, 3 FK, indeks kanonis, trigger, dan 4 RLS valid', () => {
    const fixture = createValidFixture();
    const result = executePostconditionAudit(fixture);
    expect(result.passed).toBe(true);
    expect(result.message).toContain('POSTCONDITION AUDIT PASSED');
  });

  // ── NEGATIVE PATH: PRECONDITION ───────────────────────────────────────────
  it('NEG-01: Precondition gagal jika target engine PostgreSQL < 17', () => {
    const fixture = createValidFixture();
    fixture.serverVersion = 160004;
    expect(() => executePreconditionAudit(fixture)).toThrow('below PostgreSQL 17');
  });

  it('NEG-02: Precondition gagal jika tabel prasyarat santri_wali belum ada', () => {
    const fixture = createValidFixture();
    fixture.tables = fixture.tables.filter((t) => t.name !== 'santri_wali');
    expect(() => executePreconditionAudit(fixture)).toThrow('Prerequisite table public.santri_wali is missing');
  });

  it('NEG-03: Precondition gagal jika fungsi auth.jwt() belum tersedia', () => {
    const fixture = createValidFixture();
    fixture.functions = fixture.functions.filter((f) => f.name !== 'jwt');
    expect(() => executePreconditionAudit(fixture)).toThrow('auth.jwt() is missing');
  });

  it('NEG-04: Precondition gagal jika fungsi auth.jwt() memiliki argumen (nargs > 0)', () => {
    const fixture = createValidFixture();
    const jwtFn = fixture.functions.find((f) => f.name === 'jwt')!;
    jwtFn.nargs = 1;
    expect(() => executePreconditionAudit(fixture)).toThrow('auth.jwt() signature mismatch (Must have 0 arguments');
  });

  it('NEG-05: Precondition gagal jika nama indeks kanonis sudah terpakai (anti-masking)', () => {
    const fixture = createValidFixture();
    fixture.tables = fixture.tables.filter((t) => t.name !== 'spp_bills');
    fixture.functions = fixture.functions.filter((f) => f.name !== 'fn_spp_bills_validate_santri_tenant');
    fixture.triggers = [];
    expect(() => executePreconditionAudit(fixture)).toThrow('Canonical index name idx_spp_bills_unique_monthly_spp is already allocated');
  });

  it('NEG-06: Precondition gagal jika trigger pada spp_bills sudah ada sebelumnya', () => {
    const fixture = createValidFixture();
    fixture.tables = fixture.tables.filter((t) => t.name !== 'spp_bills');
    fixture.functions = fixture.functions.filter((f) => f.name !== 'fn_spp_bills_validate_santri_tenant');
    fixture.triggers = [{
      schema: 'public',
      table: 'spp_bills',
      name: 'trg_spp_bills_validate_santri_tenant',
      tgtype: 23,
      tgenabled: 'O',
      tgattr_cols: ['tenant_id', 'santri_id'],
      function_name: 'fn_spp_bills_validate_santri_tenant',
    }];
    expect(() => executePreconditionAudit(fixture)).toThrow('Trigger trg_spp_bills_validate_santri_tenant on table public.spp_bills already exists');
  });

  // ── NEGATIVE PATH: INDEKS KANONIS (PREDICATE RIGOR) ────────────────────────
  it('NEG-07: Postcondition gagal jika predikat indeks menggunakan OR alih-alih AND meskipun memuat kata SPP dan CANCELLED', () => {
    const fixture = createValidFixture();
    const idx = fixture.indexes.find((i) => i.name === 'idx_spp_bills_unique_monthly_spp')!;
    idx.predicate = "((category = 'SPP'::text) OR (status <> 'CANCELLED'::text))";
    expect(() => executePostconditionAudit(fixture)).toThrow('Canonical index partial predicate mismatch');
  });

  it('NEG-08: Postcondition gagal jika predikat indeks menyaring status = CANCELLED alih-alih <>', () => {
    const fixture = createValidFixture();
    const idx = fixture.indexes.find((i) => i.name === 'idx_spp_bills_unique_monthly_spp')!;
    idx.predicate = "((category = 'SPP'::text) AND (status = 'CANCELLED'::text))";
    expect(() => executePostconditionAudit(fixture)).toThrow('Canonical index partial predicate mismatch');
  });

  it('NEG-09: Postcondition gagal jika urutan kolom indeks kanonis terbalik', () => {
    const fixture = createValidFixture();
    const idx = fixture.indexes.find((i) => i.name === 'idx_spp_bills_unique_monthly_spp')!;
    idx.key_columns = ['santri_id', 'tenant_id', 'period_month_year'];
    expect(() => executePostconditionAudit(fixture)).toThrow('Canonical index key columns order mismatch');
  });

  it('NEG-09B: Postcondition gagal jika indeks kanonis adalah non-parsial (predicate IS NULL)', () => {
    const fixture = createValidFixture();
    const idx = fixture.indexes.find((i) => i.name === 'idx_spp_bills_unique_monthly_spp')!;
    idx.predicate = null;
    expect(() => executePostconditionAudit(fixture)).toThrow('Canonical index idx_spp_bills_unique_monthly_spp must be partial (predicate is NULL)');
  });

  // ── NEGATIVE PATH: CHECK CONSTRAINTS (EXACT DEFINITION RIGOR) ──────────────
  it('NEG-10: Postcondition gagal jika definisi CHECK constraint berbeda meski namanya benar (amount > 0 vs >= 0)', () => {
    const fixture = createValidFixture();
    const chk = fixture.constraints.find((c) => c.name === 'spp_bills_amount_non_negative')!;
    chk.def = '(amount > (0)::numeric)';
    expect(() => executePostconditionAudit(fixture)).toThrow('CHECK constraint spp_bills_amount_non_negative definition mismatch');
  });

  it('NEG-11: Postcondition gagal jika definisi CHECK constraint dinegasikan NOT (amount >= 0)', () => {
    const fixture = createValidFixture();
    const chk = fixture.constraints.find((c) => c.name === 'spp_bills_amount_non_negative')!;
    chk.def = 'NOT (amount >= (0)::numeric)';
    expect(() => executePostconditionAudit(fixture)).toThrow('CHECK constraint spp_bills_amount_non_negative definition mismatch');
  });

  it('NEG-12: Postcondition gagal jika definisi status_check kehilangan status CANCELLED', () => {
    const fixture = createValidFixture();
    const chk = fixture.constraints.find((c) => c.name === 'spp_bills_status_check')!;
    chk.def = "status = ANY (ARRAY['UNPAID'::text, 'PARTIAL'::text, 'PAID'::text])";
    expect(() => executePostconditionAudit(fixture)).toThrow('CHECK constraint spp_bills_status_check definition mismatch');
  });

  it('NEG-13: Postcondition gagal jika definisi category_check memuat kata SPP tapi kehilangan SERAGAM', () => {
    const fixture = createValidFixture();
    const chk = fixture.constraints.find((c) => c.name === 'spp_bills_category_check')!;
    chk.def = "category = ANY (ARRAY['SPP'::text, 'DAFTAR_ULANG'::text, 'PENGEMBANGAN'::text, 'KITAB'::text, 'LAINNYA'::text])";
    expect(() => executePostconditionAudit(fixture)).toThrow('CHECK constraint spp_bills_category_check definition mismatch');
  });

  // ── NEGATIVE PATH: FOREIGN KEYS (RULES & WHITELIST RIGOR) ──────────────────
  it('NEG-14: Postcondition gagal jika Foreign Key delete action bukan RESTRICT (misal CASCADE)', () => {
    const fixture = createValidFixture();
    const fkTenant = fixture.constraints.find((c) => c.name === 'fk_spp_bills_tenant')!;
    fkTenant.confdeltype = 'c';
    expect(() => executePostconditionAudit(fixture)).toThrow('Foreign key fk_spp_bills_tenant confdeltype mismatch (Expected r, Got c)');
  });

  it('NEG-15: Postcondition gagal jika Foreign Key update action bukan NO ACTION (misal CASCADE)', () => {
    const fixture = createValidFixture();
    const fkTenant = fixture.constraints.find((c) => c.name === 'fk_spp_bills_tenant')!;
    fkTenant.confupdtype = 'c';
    expect(() => executePostconditionAudit(fixture)).toThrow('Foreign key fk_spp_bills_tenant confupdtype mismatch (Expected a, Got c)');
  });

  it('NEG-16: Postcondition gagal jika terdapat Foreign Key tambahan yang tidak diizinkan', () => {
    const fixture = createValidFixture();
    fixture.constraints.push({
      schema: 'public',
      table: 'spp_bills',
      name: 'fk_spp_bills_unauthorized_extra',
      type: 'f',
      conkey_names: ['academic_year_id'],
      confkey_names: ['id'],
      reftable: 'academic_years',
      confupdtype: 'a',
      confdeltype: 'r',
      validated: true,
    });
    expect(() => executePostconditionAudit(fixture)).toThrow('Excess unauthorized foreign keys found on public.spp_bills (Expected exactly 3, Got 4)');
  });

  it('NEG-16B: Postcondition gagal jika Foreign Key fk_spp_bills_tenant adalah composite FK meskipun kolom pertamanya tenant_id', () => {
    const fixture = createValidFixture();
    const fkTenant = fixture.constraints.find((c) => c.name === 'fk_spp_bills_tenant')!;
    fkTenant.conkey_names = ['tenant_id', 'santri_id'];
    fkTenant.confkey_names = ['id', 'tenant_id'];
    expect(() => executePostconditionAudit(fixture)).toThrow('Foreign key fk_spp_bills_tenant must be single-column (composite FK forbidden)');
  });

  it('NEG-16C: Postcondition gagal jika Foreign Key fk_spp_bills_santri adalah composite FK', () => {
    const fixture = createValidFixture();
    const fkSantri = fixture.constraints.find((c) => c.name === 'fk_spp_bills_santri')!;
    fkSantri.conkey_names = ['santri_id', 'created_by'];
    fkSantri.confkey_names = ['id', 'user_id'];
    expect(() => executePostconditionAudit(fixture)).toThrow('Foreign key fk_spp_bills_santri must be single-column (composite FK forbidden)');
  });

  it('NEG-16D: Postcondition gagal jika kardinalitas sumber Foreign Key adalah NULL / undefined', () => {
    const fixture = createValidFixture();
    const fkTenant = fixture.constraints.find((c) => c.name === 'fk_spp_bills_tenant')!;
    delete (fkTenant as any).conkey_names;
    expect(() => executePostconditionAudit(fixture)).toThrow('Foreign key fk_spp_bills_tenant must be single-column (composite FK forbidden)');
  });

  it('NEG-16E: Postcondition gagal jika kardinalitas tujuan Foreign Key adalah NULL / undefined', () => {
    const fixture = createValidFixture();
    const fkTenant = fixture.constraints.find((c) => c.name === 'fk_spp_bills_tenant')!;
    delete (fkTenant as any).confkey_names;
    expect(() => executePostconditionAudit(fixture)).toThrow('Foreign key fk_spp_bills_tenant must be single-column (composite FK forbidden)');
  });

  it('NEG-17: Postcondition gagal jika Foreign Key belum divalidasi (convalidated = false)', () => {
    const fixture = createValidFixture();
    const fkSantri = fixture.constraints.find((c) => c.name === 'fk_spp_bills_santri')!;
    fkSantri.validated = false;
    expect(() => executePostconditionAudit(fixture)).toThrow('Foreign key fk_spp_bills_santri is not validated');
  });

  // ── NEGATIVE PATH: RLS POLICIES (INDIVIDUAL RIGOR & LEAK PREVENTION) ───────
  it('NEG-18: Postcondition gagal jika command RLS policy DELETE salah (misal SELECT bukan DELETE)', () => {
    const fixture = createValidFixture();
    const delPolicy = fixture.policies.find((p) => p.name === 'spp_bills_superadmin_delete')!;
    delPolicy.cmd = 'r';
    expect(() => executePostconditionAudit(fixture)).toThrow('RLS policy spp_bills_superadmin_delete command mismatch (Expected d, Got r)');
  });

  it('NEG-19: Postcondition gagal jika role RLS policy bukan public', () => {
    const fixture = createValidFixture();
    const insPolicy = fixture.policies.find((p) => p.name === 'spp_bills_tenant_staff_insert')!;
    insPolicy.roles = ['authenticated'];
    expect(() => executePostconditionAudit(fixture)).toThrow("RLS policy spp_bills_tenant_staff_insert roles mismatch (Must be exactly ['public'])");
  });

  it('NEG-20: Postcondition gagal jika RLS policy UPDATE tidak memiliki klausul WITH CHECK (with_check IS NULL)', () => {
    const fixture = createValidFixture();
    const updatePolicy = fixture.policies.find((p) => p.name === 'spp_bills_tenant_staff_update')!;
    updatePolicy.with_check = null;
    expect(() => executePostconditionAudit(fixture)).toThrow('RLS policy spp_bills_tenant_staff_update requires both non-NULL USING and WITH CHECK expressions');
  });

  it('NEG-20B: Postcondition gagal jika RLS policy UPDATE tidak memiliki klausul USING (qual IS NULL)', () => {
    const fixture = createValidFixture();
    const updatePolicy = fixture.policies.find((p) => p.name === 'spp_bills_tenant_staff_update')!;
    updatePolicy.qual = null;
    expect(() => executePostconditionAudit(fixture)).toThrow('RLS policy spp_bills_tenant_staff_update requires both non-NULL USING and WITH CHECK expressions');
  });

  it('NEG-20C: Postcondition gagal jika RLS policy SELECT memiliki klausul USING bernilai NULL', () => {
    const fixture = createValidFixture();
    const selPolicy = fixture.policies.find((p) => p.name === 'spp_bills_tenant_and_wali_read')!;
    selPolicy.qual = null;
    expect(() => executePostconditionAudit(fixture)).toThrow('RLS policy spp_bills_tenant_and_wali_read requires non-NULL USING expression');
  });

  it('NEG-20D: Postcondition gagal jika RLS policy DELETE memiliki klausul USING bernilai NULL', () => {
    const fixture = createValidFixture();
    const delPolicy = fixture.policies.find((p) => p.name === 'spp_bills_superadmin_delete')!;
    delPolicy.qual = null;
    expect(() => executePostconditionAudit(fixture)).toThrow('RLS policy spp_bills_superadmin_delete requires non-NULL USING expression');
  });

  it('NEG-20E: Postcondition gagal jika RLS policy INSERT memiliki klausul WITH CHECK bernilai NULL', () => {
    const fixture = createValidFixture();
    const insPolicy = fixture.policies.find((p) => p.name === 'spp_bills_tenant_staff_insert')!;
    insPolicy.with_check = null;
    expect(() => executePostconditionAudit(fixture)).toThrow('RLS policy spp_bills_tenant_staff_insert requires non-NULL WITH CHECK expression');
  });

  it('NEG-21: Postcondition gagal jika RLS policy DELETE mengizinkan peran non-superadmin (misal BENDAHARA)', () => {
    const fixture = createValidFixture();
    const delPolicy = fixture.policies.find((p) => p.name === 'spp_bills_superadmin_delete')!;
    delPolicy.qual = "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) AND ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text, 'BENDAHARA'::text])))";
    expect(() => executePostconditionAudit(fixture)).toThrow('RLS policy spp_bills_superadmin_delete USING clause definition mismatch');
  });

  it('NEG-22: Postcondition gagal jika RLS policy SELECT kehilangan binding isolasi tenant', () => {
    const fixture = createValidFixture();
    const selPolicy = fixture.policies.find((p) => p.name === 'spp_bills_tenant_and_wali_read')!;
    selPolicy.qual = "(((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text])))";
    expect(() => executePostconditionAudit(fixture)).toThrow('RLS policy spp_bills_tenant_and_wali_read USING clause definition mismatch');
  });

  it('NEG-23: Postcondition gagal jika RLS policy SELECT memiliki klausul OR yang salah membocorkan akses lintas-tenant', () => {
    const fixture = createValidFixture();
    const selPolicy = fixture.policies.find((p) => p.name === 'spp_bills_tenant_and_wali_read')!;
    selPolicy.qual = "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) OR ((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'SUPER_ADMIN'::text))";
    expect(() => executePostconditionAudit(fixture)).toThrow('RLS policy spp_bills_tenant_and_wali_read USING clause definition mismatch');
  });

  it('NEG-24: Postcondition gagal jika RLS policy SELECT kehilangan kondisi status relasi aktif santri_wali', () => {
    const fixture = createValidFixture();
    const selPolicy = fixture.policies.find((p) => p.name === 'spp_bills_tenant_and_wali_read')!;
    selPolicy.qual = "((tenant_id = (auth.jwt() -> 'app_metadata'::text ->> 'tenant_id'::text)) AND (((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = ANY (ARRAY['SUPER_ADMIN'::text, 'DEVELOPER'::text, 'PIMPINAN'::text, 'BENDAHARA'::text, 'STAF_ADMIN'::text])) OR (((auth.jwt() -> 'app_metadata'::text ->> 'role'::text) = 'WALI_SANTRI'::text) AND (EXISTS (SELECT 1 FROM public.santri_wali sw WHERE sw.tenant_id = spp_bills.tenant_id AND sw.wali_id = (auth.jwt() -> 'app_metadata'::text ->> 'user_id'::text) AND sw.santri_id = spp_bills.santri_id)))))"; // missing sw.status = 'ACTIVE'
    expect(() => executePostconditionAudit(fixture)).toThrow('RLS policy spp_bills_tenant_and_wali_read USING clause definition mismatch');
  });
});
