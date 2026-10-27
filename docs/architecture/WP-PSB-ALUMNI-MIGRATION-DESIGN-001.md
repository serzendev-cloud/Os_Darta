# WP-PSB-ALUMNI — MIGRATION DESIGN REPORT (REMEDIATED)

```text
══════════════════════════════════════════════════════════════════════════════════
WORK PACKAGE: WP-PSB-ALUMNI-SCHEMA-001
DOCUMENT: docs/architecture/WP-PSB-ALUMNI-MIGRATION-DESIGN-001.md
TITLE: Migration Sequencing, Backfill & Rollback Architecture Specification
GATE: GATE 8B REMEDIATION — DESIGN ARTIFACT CORRECTION
STATUS: REMEDIATION COMPLETED — READY FOR GATE 8B RE-AUDIT
AUTHORIZATION STATUS:
  • IMPLEMENTATION: ❌ NOT AUTHORIZED
  • DDL EXECUTION: ❌ NOT AUTHORIZED
  • MIGRATION EXECUTION: ❌ NOT AUTHORIZED
  • DATABASE MUTATION: ❌ FORBIDDEN (DATABASE UNTOUCHED)
  • FRONTEND DEVELOPMENT: ❌ NOT AUTHORIZED
PRINCIPLE: ZERO REWRITE, ZERO DATA LOSS, IDEMPOTENT EXECUTION
══════════════════════════════════════════════════════════════════════════════════
```

---

## 1. MIGRATION OBJECTIVE

The objective of this migration design is to establish an **idempotent, zero-data-loss execution plan** for deploying the PSB and Alumni ecosystem schema delta into the production APP MA'HAD PostgreSQL database.

Following the Gate 8B Adversarial Audit, this plan has been remediated to:
1. Formulate fail-closed **Phase 1 Precondition Assertions** to eliminate schema drift masked by `IF NOT EXISTS` (F-09).
2. Incorporate all **18 new tables** (including `psb_test_scores`, F-01) and composite relational keys (F-02).
3. Enforce **complete RLS coverage** with explicit `WITH CHECK` clauses across all 18 tables (F-03, F-04, F-05).
4. Strictly segregate **Pre-Data Schema Rollbacks** from **Post-Data Disaster Recovery** (F-10).
5. Accurately reclassify downtime posture to a **Zero-Downtime Target / Off-Peak Maintenance Window** (F-11).

---

## 2. CURRENT SCHEMA BASELINE

- Canonical schema baseline: `drizzle/0000_neat_machine_man.sql` and `drizzle/0002_tenant_rls_hardening.sql`.
- Pre-requisite Level-4 academic tables (`madrasah`, `jenjang`, `tingkat`, `rombel`, `academic_years`) are already deployed and active.
- Existing tables `santri` and `users` are actively receiving production traffic.

---

## 3. TARGET STATE (18 NEW TABLES)

- Existing tables `santri` and `users` receive non-breaking additive extensions (`user_id`, `merged_into_user_id`, `uq_santri_tenant_id`, and `chk_users_merged_not_self`).
- Exactly **18 new domain tables** are created with composite tenant foreign keys:
  - 2 Core Identity/Saga Tables: `user_tenant_personas`, `identity_consolidation_ledgers`.
  - 8 PSB Tables: `psb_periods`, `psb_waves`, `psb_committees`, `psb_applicants`, `psb_test_scores`, `psb_infaq_verifications`, `psb_acceptance_ledgers`, `psb_placement_distributions`.
  - 8 Alumni Tables: `alumni_exit_reasons`, `alumni_academic_snapshots`, `alumni_korwils`, `tenant_korwil_settings`, `alumni_profiles`, `user_discovery_locations`, `salam_interactions`, `alumni_donations`.
- Procedural triggers (`trg_enforce_placement_hierarchy`, `trg_sync_santri_kelas_from_rombel`) are bound.
- Row-Level Security policies with explicit `WITH CHECK` clauses are enabled across all 18 tables.
- Zero rows in existing tables are modified or deleted during migration.

---

## 4. MIGRATION SEQUENCE (8 PHASES NORMALIZED)

The migration execution sequence is decomposed into **8 strictly ordered phases**:

```text
  Phase 1: Pre-Migration Assertions & Schema Drift Check (Fail-Closed)
             │
             ▼
  Phase 2: Additive Column Extensions to Existing Tables (santri, users)
             │
             ▼
  Phase 3: Core Identity & Saga Table Creation (user_tenant_personas, ledgers)
             │
             ▼
  Phase 4: PSB Admission Domain Table Creation (periods -> waves -> applicants -> test_scores -> placement)
             │
             ▼
  Phase 5: Alumni Ecosystem Domain Table Creation (snapshots -> korwils -> profiles -> discovery)
             │
             ▼
  Phase 6: Trigger Function & Trigger Binding (placement hierarchy & kelas sync)
             │
             ▼
  Phase 7: RLS Activation & Policy Registration (All 18 tables with explicit WITH CHECK)
             │
             ▼
  Phase 8: Post-Migration Invariant Validation
```

---

## 5. DEPENDENCY GRAPH

```text
  public.tenants / academic_years / madrasah / jenjang / tingkat / rombel (Pre-requisites)
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
    [public.users (+merged_into)]       [public.santri (+user_id, +uq_santri_tenant_id)]
            │                                   │
            ├─────────────────┬─────────────────┤
            ▼                 ▼                 ▼
   [user_tenant_personas]  [psb_periods]  [alumni_exit_reasons]
            │                 │                 │
            ▼                 ▼                 ▼
  [consolidation_ledgers] [psb_waves]    [alumni_snapshots]
                              │                 │
                              ▼                 ▼
                       [psb_applicants]  [alumni_korwils]
                              │                 │
                              ├─────────────────┤
                              ▼                 ▼
                       [psb_test_scores] [alumni_profiles]
                              │                 │
                              ▼                 ▼
                       [psb_placement]   [Discovery / Salam]
                              │                 │
                              ▼                 ▼
                      [Triggers & RLS]   [Donations]
```

---

## 6. PHASE 1: PRE-MIGRATION ASSERTIONS (F-09-A TRUE STRUCTURAL CONTRACT FINGERPRINT GATE)

To eliminate the `IF NOT EXISTS` illusion where pre-existing prototype objects mask schema incompatibility, Phase 1 executes an exhaustive, fail-closed true structural contract fingerprint before executing any DDL.

The gate evaluates all objects against the strict three states:
- **State A: ABSENT** $\rightarrow$ Clean creation allowed to proceed.
- **State B: COMPATIBLE** $\rightarrow$ Continue safely (idempotent re-run matching declarative manifest 100%).
- **State C: INCOMPATIBLE / STRUCTURAL DRIFT** $\rightarrow$ `RAISE EXCEPTION` and abort transaction fail-closed.

The declarative manifest audits: exact column counts, extra column presence, datatypes, nullabilities, exact single-column PKs, exact composite UQ columns and ordering, unique index uniqueness (`pg_index.indisunique`), ordered index columns, and literal-safe predicate canonicalization with exact normalized comparison (F-15: whitespace-only normalization outside single-quoted literals, no `lower()`, string literal case preserved exactly, calibration-pending), exact composite FK source/target mappings and catalog `ON DELETE` referential action verification (F-17), exact CHECK constraint enum value-set equality via sorted array comparison and cardinality parity (F-16), exact structural boolean & whitelist array-grammar contract verification for enum CHECKs anchored to `^CHECK ((<col> = ANY (ARRAY[...])))` asserting column identity, comparison operator `=`, array operator `ANY`, explicit character-by-character whitelist array-body grammar parsing (`list := element (comma + element)*`, `element := single_quoted_literal + exact_cast`), strictly rejecting nested arrays, array concatenation (`||`), `CASE`, `COALESCE`, `NULL`, column references, functions, subqueries, operators, arbitrary casts, and duplicate elements (F-19 Cycle 8 Exact Array-Literal Hardening), case-insensitive logical weakening guard (`~* \mOR\M` / `~* \mAND\M`), relational expression required/forbidden tokens for non-enum CHECKs, count-based parity checks detecting extra unauthorized UQs, FKs, and CHECK constraints (F-18), identity-level standalone unique index validation (name, uniqueness, columns, predicate) plus count parity (F-18), and explicit documentation that column defaults are application/ORM-level implementation details rather than relational compatibility constraints.

```sql
DO $$
DECLARE
    v_manifest jsonb;
    v_tbl_def jsonb;
    v_table_name text;
    v_extra_col text;
    v_record record;
    v_col_type text;
    v_col_nullable text;
    v_missing_table text;
    v_actual_col_count integer;
    v_expected_col_count integer;
    v_actual_uq_count integer;
    v_actual_fk_count integer;
    v_actual_chk_count integer;
    v_actual_uidx_count integer;
    v_actual_value_count integer;
    v_norm_actual text;
    v_norm_expected text;
    v_expected_pk_cols text[];
    v_actual_pk_cols text[];
    v_uq_item jsonb;
    v_expected_uq_cols text[];
    v_actual_uq_cols text[];
    v_idx_item jsonb;
    v_expected_idx_cols text[];
    v_actual_idx_cols text[];
    v_idx_is_unique boolean;
    v_actual_pred text;
    v_fk_item jsonb;
    v_expected_src_cols text[];
    v_expected_ref_cols text[];
    v_actual_src_cols text[];
    v_actual_ref_tbl text;
    v_actual_ref_cols text[];
    v_actual_del_action text;
    v_chk_item jsonb;
    v_actual_chk_def text;
    v_token text;
    v_prereq record;
    -- Cycle 6 Revision: F-15 literal-safe normalizer variables
    v_in_literal boolean;
    v_prev_was_space boolean;
    v_char text;
    v_i integer;
    v_trimmed text;
    -- Cycle 6 Revision: F-16 exact value-set comparison variables
    v_actual_values text[];
    v_expected_values text[];
    -- Cycle 7: F-19 structural contract match variable
    v_struct_match text[];
    -- Cycle 8: F-19 exact array-body whitelist grammar parser variables
    v_body text;
    v_b_len integer;
    v_b_idx integer;
    v_b_char text;
    v_lit_val text;
    v_lit_closed boolean;
    v_expected_cast text;
    v_cast_len integer;
BEGIN
    -- --------------------------------------------------------------------------
    -- 0.1 ASSERT PREREQUISITE BASELINE TABLES EXIST
    -- --------------------------------------------------------------------------
    FOR v_missing_table IN 
        SELECT unnest(ARRAY[
            'tenants', 'users', 'santri', 'academic_years', 
            'madrasah', 'jenjang', 'tingkat', 'rombel'
        ])
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = v_missing_table
        ) THEN
            RAISE EXCEPTION 'PRECONDITION_FAILED: Prerequisite baseline table public.% is missing. Aborting migration.', v_missing_table;
        END IF;
    END LOOP;

    -- --------------------------------------------------------------------------
    -- 0.2 ASSERT PREREQUISITE COMPOSITE TARGET KEYS (F-13 TRUE STRUCTURAL VERIFICATION)
    -- Required by downstream placement foreign keys in psb_placement_distributions and alumni_academic_snapshots.
    -- Verifies actual composite column sets (not brittle constraint names).
    -- --------------------------------------------------------------------------
    FOR v_prereq IN 
        SELECT * FROM (VALUES
            ('academic_years', ARRAY['tenant_id', 'id']),
            ('madrasah', ARRAY['tenant_id', 'id']),
            ('jenjang', ARRAY['tenant_id', 'id']),
            ('jenjang', ARRAY['tenant_id', 'madrasah_id', 'id']),
            ('tingkat', ARRAY['tenant_id', 'id']),
            ('rombel', ARRAY['tenant_id', 'id'])
        ) AS t(table_name, expected_cols)
    LOOP
        IF NOT EXISTS (
            SELECT 1
            FROM pg_constraint con
            JOIN pg_class cls ON cls.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
            CROSS JOIN LATERAL generate_subscripts(con.conkey, 1) AS pos(n)
            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[pos.n]
            WHERE nsp.nspname = 'public'
              AND cls.relname = v_prereq.table_name
              AND con.contype IN ('u', 'p')
            GROUP BY con.oid
            HAVING array_agg(att.attname::text ORDER BY pos.n) = v_prereq.expected_cols
        ) THEN
            RAISE EXCEPTION 'PRECONDITION_FAILED: Prerequisite table public.% missing required target composite key on columns %.', 
                v_prereq.table_name, v_prereq.expected_cols;
        END IF;
    END LOOP;

    -- --------------------------------------------------------------------------
    -- 0.3 PREFLIGHT VERIFICATION ON EXTENDED EXISTING TABLES (public.users & public.santri)
    -- --------------------------------------------------------------------------
    -- public.users: Verify Primary Key on id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_class cls ON cls.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
        CROSS JOIN LATERAL generate_subscripts(con.conkey, 1) AS pos(n)
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[pos.n]
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'users' 
          AND con.contype = 'p'
        GROUP BY con.oid
        HAVING array_agg(att.attname::text ORDER BY pos.n) = ARRAY['id']
    ) THEN
        RAISE EXCEPTION 'PRECONDITION_FAILED: Existing table public.users must have single-column PRIMARY KEY on (id).';
    END IF;

    -- public.santri: Verify Primary Key on id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint con
        JOIN pg_class cls ON cls.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
        CROSS JOIN LATERAL generate_subscripts(con.conkey, 1) AS pos(n)
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[pos.n]
        WHERE nsp.nspname = 'public' 
          AND cls.relname = 'santri' 
          AND con.contype = 'p'
        GROUP BY con.oid
        HAVING array_agg(att.attname::text ORDER BY pos.n) = ARRAY['id']
    ) THEN
        RAISE EXCEPTION 'PRECONDITION_FAILED: Existing table public.santri must have single-column PRIMARY KEY on (id).';
    END IF;

    -- public.santri (user_id & composite key)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'santri' AND column_name = 'user_id'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_constraint con
            JOIN pg_class cls ON cls.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
            CROSS JOIN LATERAL generate_subscripts(con.conkey, 1) AS pos(n)
            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[pos.n]
            WHERE nsp.nspname = 'public' 
              AND cls.relname = 'santri' 
              AND con.contype = 'u'
            GROUP BY con.oid
            HAVING array_agg(att.attname::text ORDER BY pos.n) = ARRAY['tenant_id', 'id']
        ) THEN
            RAISE EXCEPTION 'PRECONDITION_FAILED: Existing table public.santri contains user_id but lacks composite UNIQUE (tenant_id, id).';
        END IF;
    END IF;

    -- --------------------------------------------------------------------------
    -- 0.4 EMBEDDED CANONICAL MANIFEST DEFINITION (18 TABLES, 180 COLUMNS, 46 FKS, 32 UQS, 23 CHKS)
    -- Cycle 8: Enum/status CHECK constraints declare explicit whitelist array grammar contracts.
    -- --------------------------------------------------------------------------
    v_manifest := $MANIFEST$
    [
      {
        "table": "user_tenant_personas",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "user_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "persona_type",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "status",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "metadata",
            "type": "jsonb",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "updated_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_user_tenant_persona",
            "columns": [
              "tenant_id",
              "user_id",
              "persona_type"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_utp_tenant",
            "source_columns": [
              "tenant_id"
            ],
            "referenced_table": "tenants",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "CASCADE"
          },
          {
            "name": "fk_utp_user",
            "source_columns": [
              "user_id"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "CASCADE"
          }
        ],
        "check_constraints": [
          {
            "name": "chk_utp_persona_type",
            "kind": "enum_status",
            "column": "persona_type",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "ALUMNI",
              "SANTRI",
              "WALI"
            ],
            "expected_value_count": 3
          },
          {
            "name": "chk_utp_status",
            "kind": "enum_status",
            "column": "status",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "ACTIVE",
              "INACTIVE",
              "SUSPENDED"
            ],
            "expected_value_count": 3
          }
        ],
        "rls": true
      },
      {
        "table": "identity_consolidation_ledgers",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "operation_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "santri_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "source_student_uid",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "target_wali_uid",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "target_email_hash",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "status",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "attempt_count",
            "type": "integer",
            "nullable": "NO"
          },
          {
            "name": "last_error",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "updated_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "completed_at",
            "type": "timestamp",
            "nullable": "YES"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_icl_operation_id",
            "columns": [
              "operation_id"
            ]
          }
        ],
        "unique_indexes": [
          {
            "name": "uq_active_consolidation_santri",
            "columns": [
              "santri_id"
            ],
            "unique": true,
            "expected_predicate": "(status = ANY (ARRAY['DB_COMMITTED_AUTH_PENDING'::text, 'RECONCILIATION_REQUIRED'::text, 'MANUAL_ATTENTION_REQUIRED'::text]))"
          }
        ],
        "foreign_keys": [
          {
            "name": "fk_icl_tenant",
            "source_columns": [
              "tenant_id"
            ],
            "referenced_table": "tenants",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_icl_source_user",
            "source_columns": [
              "source_student_uid"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_icl_target_user",
            "source_columns": [
              "target_wali_uid"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_icl_santri",
            "source_columns": [
              "tenant_id",
              "santri_id"
            ],
            "referenced_table": "santri",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          }
        ],
        "check_constraints": [
          {
            "name": "chk_icl_status",
            "kind": "enum_status",
            "column": "status",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "ABORTED_ROLLED_BACK",
              "AUTH_CREATED_MERGE_PENDING",
              "COMPLETED_SUCCESS",
              "DB_COMMITTED_AUTH_PENDING",
              "MANUAL_ATTENTION_REQUIRED",
              "RECONCILIATION_REQUIRED"
            ],
            "expected_value_count": 6
          },
          {
            "name": "chk_icl_distinct_users",
            "kind": "relational_expression",
            "required_tokens": [
              "source_student_uid",
              "target_wali_uid",
              "<>"
            ]
          },
          {
            "name": "chk_icl_attempts",
            "kind": "relational_expression",
            "required_tokens": [
              "attempt_count >= 0"
            ]
          }
        ],
        "rls": true
      },
      {
        "table": "psb_periods",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "academic_year_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "name",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "wave_count",
            "type": "integer",
            "nullable": "NO"
          },
          {
            "name": "status",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "start_date",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "end_date",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "quotas",
            "type": "jsonb",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "updated_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_psb_periods_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_psb_periods_tenant",
            "source_columns": [
              "tenant_id"
            ],
            "referenced_table": "tenants",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "CASCADE"
          },
          {
            "name": "fk_psb_periods_academic_year",
            "source_columns": [
              "tenant_id",
              "academic_year_id"
            ],
            "referenced_table": "academic_years",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          }
        ],
        "check_constraints": [
          {
            "name": "chk_psb_periods_wave_count",
            "kind": "relational_expression",
            "required_tokens": [
              "wave_count",
              "1",
              "2"
            ]
          },
          {
            "name": "chk_psb_periods_status",
            "kind": "enum_status",
            "column": "status",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "ARCHIVED",
              "CLOSED",
              "DRAFT",
              "OPEN",
              "PUBLISHED"
            ],
            "expected_value_count": 5
          },
          {
            "name": "chk_psb_periods_dates",
            "kind": "relational_expression",
            "required_tokens": [
              "end_date > start_date"
            ]
          }
        ],
        "rls": true
      },
      {
        "table": "psb_waves",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "psb_period_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "wave_number",
            "type": "integer",
            "nullable": "NO"
          },
          {
            "name": "name",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "start_date",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "end_date",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "infaq_amount",
            "type": "integer",
            "nullable": "NO"
          },
          {
            "name": "status",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "updated_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_psb_waves_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          },
          {
            "name": "uq_psb_waves_period_number",
            "columns": [
              "tenant_id",
              "psb_period_id",
              "wave_number"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_psb_waves_period",
            "source_columns": [
              "tenant_id",
              "psb_period_id"
            ],
            "referenced_table": "psb_periods",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "CASCADE"
          }
        ],
        "check_constraints": [
          {
            "name": "chk_psb_waves_number",
            "kind": "relational_expression",
            "required_tokens": [
              "wave_number",
              "1",
              "2"
            ]
          },
          {
            "name": "chk_psb_waves_status",
            "kind": "enum_status",
            "column": "status",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "ACTIVE",
              "CANCELLED",
              "COMPLETED",
              "UPCOMING"
            ],
            "expected_value_count": 4
          },
          {
            "name": "chk_psb_waves_dates",
            "kind": "relational_expression",
            "required_tokens": [
              "end_date > start_date"
            ]
          }
        ],
        "rls": true
      },
      {
        "table": "psb_committees",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "psb_period_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "user_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "role",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "updated_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_psb_committees_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          },
          {
            "name": "uq_psb_committees_user",
            "columns": [
              "tenant_id",
              "psb_period_id",
              "user_id"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_psb_committees_period",
            "source_columns": [
              "tenant_id",
              "psb_period_id"
            ],
            "referenced_table": "psb_periods",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "CASCADE"
          },
          {
            "name": "fk_psb_committees_user",
            "source_columns": [
              "user_id"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "CASCADE"
          }
        ],
        "check_constraints": [],
        "rls": true
      },
      {
        "table": "psb_applicants",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "psb_period_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "wave_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "registration_number",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "applicant_name",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "gender",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "birth_date",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "parent_name",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "parent_phone",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "target_madrasahs",
            "type": "jsonb",
            "nullable": "NO"
          },
          {
            "name": "status",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "updated_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_psb_applicants_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          },
          {
            "name": "uq_psb_applicants_reg_num",
            "columns": [
              "tenant_id",
              "registration_number"
            ]
          },
          {
            "name": "uq_psb_applicants_tenant_period",
            "columns": [
              "tenant_id",
              "psb_period_id",
              "id"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_psb_applicants_period",
            "source_columns": [
              "tenant_id",
              "psb_period_id"
            ],
            "referenced_table": "psb_periods",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_psb_applicants_wave",
            "source_columns": [
              "tenant_id",
              "wave_id"
            ],
            "referenced_table": "psb_waves",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          }
        ],
        "check_constraints": [
          {
            "name": "chk_psb_applicants_gender",
            "kind": "enum_status",
            "column": "gender",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "L",
              "P"
            ],
            "expected_value_count": 2
          },
          {
            "name": "chk_psb_applicants_status",
            "kind": "enum_status",
            "column": "status",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "ACCEPTED",
              "CANCELLED",
              "MATRICULATED",
              "REGISTERED",
              "REJECTED",
              "SELECTION",
              "TESTING"
            ],
            "expected_value_count": 7
          }
        ],
        "rls": true
      },
      {
        "table": "psb_test_scores",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "applicant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "test_type",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "score",
            "type": "numeric",
            "nullable": "NO"
          },
          {
            "name": "notes",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "tested_by_user_id",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_psb_test_scores_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          },
          {
            "name": "uq_psb_test_applicant_type",
            "columns": [
              "tenant_id",
              "applicant_id",
              "test_type"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_psb_test_applicant",
            "source_columns": [
              "tenant_id",
              "applicant_id"
            ],
            "referenced_table": "psb_applicants",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "CASCADE"
          },
          {
            "name": "fk_psb_test_user",
            "source_columns": [
              "tested_by_user_id"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "SET NULL"
          }
        ],
        "check_constraints": [
          {
            "name": "chk_pts_score",
            "kind": "relational_expression",
            "required_tokens": [
              "score >= 0",
              "score <= 100"
            ]
          }
        ],
        "rls": true
      },
      {
        "table": "psb_infaq_verifications",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "applicant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "amount",
            "type": "integer",
            "nullable": "NO"
          },
          {
            "name": "proof_url",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "status",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "verified_by_user_id",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "verified_at",
            "type": "timestamp",
            "nullable": "YES"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "updated_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_psb_infaq_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          },
          {
            "name": "uq_psb_infaq_applicant",
            "columns": [
              "tenant_id",
              "applicant_id"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_psb_infaq_applicant",
            "source_columns": [
              "tenant_id",
              "applicant_id"
            ],
            "referenced_table": "psb_applicants",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "CASCADE"
          },
          {
            "name": "fk_psb_infaq_user",
            "source_columns": [
              "verified_by_user_id"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "SET NULL"
          }
        ],
        "check_constraints": [
          {
            "name": "chk_piv_status",
            "kind": "enum_status",
            "column": "status",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "PENDING",
              "REJECTED",
              "VERIFIED"
            ],
            "expected_value_count": 3
          },
          {
            "name": "chk_piv_amount",
            "kind": "relational_expression",
            "required_tokens": [
              "amount >= 0"
            ]
          }
        ],
        "rls": true
      },
      {
        "table": "psb_acceptance_ledgers",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "applicant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "sat_user_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "official_nis",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "acceptance_status",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "matriculated_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_psb_acceptance_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          },
          {
            "name": "uq_psb_acceptance_applicant",
            "columns": [
              "tenant_id",
              "applicant_id"
            ]
          },
          {
            "name": "uq_psb_acceptance_nis",
            "columns": [
              "tenant_id",
              "official_nis"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_psb_acceptance_applicant",
            "source_columns": [
              "tenant_id",
              "applicant_id"
            ],
            "referenced_table": "psb_applicants",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_psb_acceptance_sat_user",
            "source_columns": [
              "sat_user_id"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "RESTRICT"
          }
        ],
        "check_constraints": [
          {
            "name": "chk_pal_status",
            "kind": "enum_status",
            "column": "acceptance_status",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "CADANGAN",
              "DITERIMA",
              "DITOLAK"
            ],
            "expected_value_count": 3
          }
        ],
        "rls": true
      },
      {
        "table": "psb_placement_distributions",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "psb_period_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "applicant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "santri_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "madrasah_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "jenjang_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tingkat_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "rombel_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "status",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "confirmed_by_user_id",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "confirmed_at",
            "type": "timestamp",
            "nullable": "YES"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "updated_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_psb_dist_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          },
          {
            "name": "uq_psb_dist_placement",
            "columns": [
              "tenant_id",
              "psb_period_id",
              "applicant_id",
              "madrasah_id"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_psb_dist_period",
            "source_columns": [
              "tenant_id",
              "psb_period_id"
            ],
            "referenced_table": "psb_periods",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_psb_dist_applicant",
            "source_columns": [
              "tenant_id",
              "psb_period_id",
              "applicant_id"
            ],
            "referenced_table": "psb_applicants",
            "referenced_columns": [
              "tenant_id",
              "psb_period_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_psb_dist_santri",
            "source_columns": [
              "tenant_id",
              "santri_id"
            ],
            "referenced_table": "santri",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_psb_dist_madrasah",
            "source_columns": [
              "tenant_id",
              "madrasah_id"
            ],
            "referenced_table": "madrasah",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_psb_dist_jenjang",
            "source_columns": [
              "tenant_id",
              "madrasah_id",
              "jenjang_id"
            ],
            "referenced_table": "jenjang",
            "referenced_columns": [
              "tenant_id",
              "madrasah_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_psb_dist_tingkat",
            "source_columns": [
              "tenant_id",
              "tingkat_id"
            ],
            "referenced_table": "tingkat",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_psb_dist_rombel",
            "source_columns": [
              "tenant_id",
              "rombel_id"
            ],
            "referenced_table": "rombel",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_psb_dist_confirmed_user",
            "source_columns": [
              "confirmed_by_user_id"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "SET NULL"
          }
        ],
        "check_constraints": [
          {
            "name": "chk_ppd_status",
            "kind": "enum_status",
            "column": "status",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "CONFIRMED",
              "PENDING",
              "REJECTED"
            ],
            "expected_value_count": 3
          }
        ],
        "rls": true
      },
      {
        "table": "alumni_exit_reasons",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "code",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "label",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "is_final_exit",
            "type": "boolean",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_alumni_exit_reasons_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          },
          {
            "name": "uq_alumni_exit_reasons_code",
            "columns": [
              "tenant_id",
              "code"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_alumni_exit_reasons_tenant",
            "source_columns": [
              "tenant_id"
            ],
            "referenced_table": "tenants",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "CASCADE"
          }
        ],
        "check_constraints": [],
        "rls": true
      },
      {
        "table": "alumni_academic_snapshots",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "santri_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "user_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "madrasah_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "last_jenjang_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "last_tingkat_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "exit_reason_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "is_final_alumni_snapshot",
            "type": "boolean",
            "nullable": "NO"
          },
          {
            "name": "transcript_data",
            "type": "jsonb",
            "nullable": "NO"
          },
          {
            "name": "graduation_date",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_alumni_snapshots_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          },
          {
            "name": "uq_alumni_snapshots_record",
            "columns": [
              "tenant_id",
              "santri_id",
              "madrasah_id"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_alumni_snap_user",
            "source_columns": [
              "user_id"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_alumni_snap_santri",
            "source_columns": [
              "tenant_id",
              "santri_id"
            ],
            "referenced_table": "santri",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_alumni_snap_madrasah",
            "source_columns": [
              "tenant_id",
              "madrasah_id"
            ],
            "referenced_table": "madrasah",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_alumni_snap_jenjang",
            "source_columns": [
              "tenant_id",
              "madrasah_id",
              "last_jenjang_id"
            ],
            "referenced_table": "jenjang",
            "referenced_columns": [
              "tenant_id",
              "madrasah_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_alumni_snap_tingkat",
            "source_columns": [
              "tenant_id",
              "last_tingkat_id"
            ],
            "referenced_table": "tingkat",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_alumni_snap_exit_reason",
            "source_columns": [
              "tenant_id",
              "exit_reason_id"
            ],
            "referenced_table": "alumni_exit_reasons",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          }
        ],
        "check_constraints": [],
        "rls": true
      },
      {
        "table": "alumni_korwils",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "code",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "name",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "province",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "regencies",
            "type": "jsonb",
            "nullable": "NO"
          },
          {
            "name": "status",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "updated_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_alumni_korwils_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          },
          {
            "name": "uq_alumni_korwils_code",
            "columns": [
              "tenant_id",
              "code"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_alumni_korwils_tenant",
            "source_columns": [
              "tenant_id"
            ],
            "referenced_table": "tenants",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "CASCADE"
          }
        ],
        "check_constraints": [
          {
            "name": "chk_korwil_status",
            "kind": "enum_status",
            "column": "status",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "ACTIVE",
              "INACTIVE"
            ],
            "expected_value_count": 2
          }
        ],
        "rls": true
      },
      {
        "table": "tenant_korwil_settings",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "auto_transfer_enabled",
            "type": "boolean",
            "nullable": "NO"
          },
          {
            "name": "require_admin_approval",
            "type": "boolean",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "updated_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_tenant_korwil_settings_tenant_id",
            "columns": [
              "tenant_id"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_tenant_korwil_settings_tenant",
            "source_columns": [
              "tenant_id"
            ],
            "referenced_table": "tenants",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "CASCADE"
          }
        ],
        "check_constraints": [],
        "rls": true
      },
      {
        "table": "alumni_profiles",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "user_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "korwil_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "current_activity",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "profession",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "workplace",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "domicile_province",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "domicile_regency",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "domicile_address",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "bio",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "is_public",
            "type": "boolean",
            "nullable": "NO"
          },
          {
            "name": "hide_profile",
            "type": "boolean",
            "nullable": "NO"
          },
          {
            "name": "phone",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "updated_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_alumni_profiles_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          },
          {
            "name": "uq_alumni_profiles_user",
            "columns": [
              "tenant_id",
              "user_id"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_alumni_profiles_user",
            "source_columns": [
              "user_id"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "CASCADE"
          },
          {
            "name": "fk_alumni_profiles_korwil",
            "source_columns": [
              "tenant_id",
              "korwil_id"
            ],
            "referenced_table": "alumni_korwils",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          }
        ],
        "check_constraints": [],
        "rls": true
      },
      {
        "table": "user_discovery_locations",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "user_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "origin_korwil_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "current_korwil_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "lat_coarse",
            "type": "numeric",
            "nullable": "NO"
          },
          {
            "name": "lng_coarse",
            "type": "numeric",
            "nullable": "NO"
          },
          {
            "name": "is_dhoif",
            "type": "boolean",
            "nullable": "NO"
          },
          {
            "name": "expires_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "updated_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_discovery_locations_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          },
          {
            "name": "uq_discovery_locations_user",
            "columns": [
              "tenant_id",
              "user_id"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_discovery_user",
            "source_columns": [
              "user_id"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "CASCADE"
          },
          {
            "name": "fk_discovery_origin_korwil",
            "source_columns": [
              "tenant_id",
              "origin_korwil_id"
            ],
            "referenced_table": "alumni_korwils",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          },
          {
            "name": "fk_discovery_current_korwil",
            "source_columns": [
              "tenant_id",
              "current_korwil_id"
            ],
            "referenced_table": "alumni_korwils",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "RESTRICT"
          }
        ],
        "check_constraints": [],
        "rls": true
      },
      {
        "table": "salam_interactions",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "sender_user_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "recipient_user_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "status",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          },
          {
            "name": "expires_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_salam_tenant",
            "source_columns": [
              "tenant_id"
            ],
            "referenced_table": "tenants",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "CASCADE"
          },
          {
            "name": "fk_salam_sender",
            "source_columns": [
              "sender_user_id"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "CASCADE"
          },
          {
            "name": "fk_salam_recipient",
            "source_columns": [
              "recipient_user_id"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "CASCADE"
          }
        ],
        "check_constraints": [
          {
            "name": "chk_salam_peers",
            "kind": "relational_expression",
            "required_tokens": [
              "sender_user_id",
              "recipient_user_id",
              "<>"
            ]
          },
          {
            "name": "chk_salam_status",
            "kind": "enum_status",
            "column": "status",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "DELIVERED",
              "EXPIRED",
              "READ"
            ],
            "expected_value_count": 3
          }
        ],
        "rls": true
      },
      {
        "table": "alumni_donations",
        "columns": [
          {
            "name": "id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "tenant_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "donor_user_id",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "donor_origin_korwil_id",
            "type": "text",
            "nullable": "YES"
          },
          {
            "name": "campaign_id",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "amount",
            "type": "integer",
            "nullable": "NO"
          },
          {
            "name": "status",
            "type": "text",
            "nullable": "NO"
          },
          {
            "name": "is_anonymous",
            "type": "boolean",
            "nullable": "NO"
          },
          {
            "name": "created_at",
            "type": "timestamp",
            "nullable": "NO"
          }
        ],
        "pk_columns": [
          "id"
        ],
        "unique_constraints": [
          {
            "name": "uq_alumni_donations_tenant_id",
            "columns": [
              "tenant_id",
              "id"
            ]
          }
        ],
        "unique_indexes": [],
        "foreign_keys": [
          {
            "name": "fk_donations_donor",
            "source_columns": [
              "donor_user_id"
            ],
            "referenced_table": "users",
            "referenced_columns": [
              "id"
            ],
            "on_delete": "SET NULL"
          },
          {
            "name": "fk_alumni_donations_korwil",
            "source_columns": [
              "tenant_id",
              "donor_origin_korwil_id"
            ],
            "referenced_table": "alumni_korwils",
            "referenced_columns": [
              "tenant_id",
              "id"
            ],
            "on_delete": "SET NULL"
          }
        ],
        "check_constraints": [
          {
            "name": "chk_alumni_donations_status",
            "kind": "enum_status",
            "column": "status",
            "comparison_operator": "=",
            "array_operator": "ANY",
            "element_cast": "::text",
            "allowed_values": [
              "EXPIRED",
              "FAILED",
              "PAID",
              "PENDING"
            ],
            "expected_value_count": 4
          },
          {
            "name": "chk_alumni_donations_amount",
            "kind": "relational_expression",
            "required_tokens": [
              "amount > 0"
            ],
            "forbidden_tokens": [
              "amount >="
            ]
          }
        ],
        "rls": true
      }
    ]
    $MANIFEST$::jsonb;

    -- --------------------------------------------------------------------------
    -- 0.5 STRUCTURAL FINGERPRINT GATE ITERATION (THREE-STATE MODEL)
    -- --------------------------------------------------------------------------
    FOR v_tbl_def IN SELECT * FROM jsonb_array_elements(v_manifest)
    LOOP
        v_table_name := v_tbl_def->>'table';

        -- Check existence of table (State A vs State B/C)
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = v_table_name
        ) THEN
            -- Table exists: Must match canonical structural fingerprint exactly (State B).
            -- Any drift is an unrecoverable failure (State C).

            -- 1. Column Count Match
            SELECT count(*) INTO v_actual_col_count
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = v_table_name;

            v_expected_col_count := jsonb_array_length(v_tbl_def->'columns');

            IF v_actual_col_count <> v_expected_col_count THEN
                RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% column count mismatch (expected %, actual %).',
                    v_table_name, v_expected_col_count, v_actual_col_count;
            END IF;

            -- 2. Column Specifications (Name, Data Type, Nullability)
            FOR v_record IN 
                SELECT 
                    col->>'name' AS expected_name,
                    col->>'type' AS expected_type,
                    col->>'nullable' AS expected_nullable
                FROM jsonb_array_elements(v_tbl_def->'columns') AS col
            LOOP
                SELECT data_type, is_nullable INTO v_col_type, v_col_nullable
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                  AND table_name = v_table_name 
                  AND column_name = v_record.expected_name;

                IF v_col_type IS NULL THEN
                    RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% missing column %.',
                        v_table_name, v_record.expected_name;
                END IF;

                -- Normalize text/varchar/uuid representations if needed
                IF v_col_type <> v_record.expected_type THEN
                    -- Allow character varying to match varchar
                    IF NOT (v_col_type = 'character varying' AND v_record.expected_type = 'varchar') THEN
                        RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% column % type mismatch (expected %, actual %).',
                            v_table_name, v_record.expected_name, v_record.expected_type, v_col_type;
                    END IF;
                END IF;

                IF v_col_nullable <> v_record.expected_nullable THEN
                    RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% column % nullability mismatch (expected %, actual %).',
                        v_table_name, v_record.expected_name, v_record.expected_nullable, v_col_nullable;
                END IF;
            END LOOP;

            -- Extra columns check (reverse check)
            FOR v_extra_col IN 
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = v_table_name
                  AND column_name NOT IN (
                      SELECT col->>'name' FROM jsonb_array_elements(v_tbl_def->'columns') AS col
                  )
            LOOP
                RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% contains unexpected column %.',
                    v_table_name, v_extra_col;
            END LOOP;

            -- 3. Primary Key Match
            SELECT array_agg(att.attname::text ORDER BY pos.n) INTO v_actual_pk_cols
            FROM pg_constraint con
            JOIN pg_class cls ON cls.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
            CROSS JOIN LATERAL generate_subscripts(con.conkey, 1) AS pos(n)
            JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[pos.n]
            WHERE nsp.nspname = 'public' 
              AND cls.relname = v_table_name 
              AND con.contype = 'p'
            GROUP BY con.oid;

            SELECT array_agg(col::text) INTO v_expected_pk_cols
            FROM jsonb_array_elements_text(v_tbl_def->'pk_columns') AS col;

            IF v_actual_pk_cols IS DISTINCT FROM v_expected_pk_cols THEN
                RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% primary key mismatch (expected %, actual %).',
                    v_table_name, v_expected_pk_cols, v_actual_pk_cols;
            END IF;

            -- 4. Unique Constraints Verification
            SELECT count(*) INTO v_actual_uq_count
            FROM pg_constraint con
            JOIN pg_class cls ON cls.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
            WHERE nsp.nspname = 'public' AND cls.relname = v_table_name AND con.contype = 'u';

            IF v_actual_uq_count <> jsonb_array_length(v_tbl_def->'unique_constraints') THEN
                RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% unique constraint count mismatch (expected %, actual %).',
                    v_table_name, jsonb_array_length(v_tbl_def->'unique_constraints'), v_actual_uq_count;
            END IF;

            FOR v_uq_item IN SELECT * FROM jsonb_array_elements(v_tbl_def->'unique_constraints')
            LOOP
                SELECT array_agg(att.attname::text ORDER BY pos.n) INTO v_actual_uq_cols
                FROM pg_constraint con
                JOIN pg_class cls ON cls.oid = con.conrelid
                JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
                CROSS JOIN LATERAL generate_subscripts(con.conkey, 1) AS pos(n)
                JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[pos.n]
                WHERE nsp.nspname = 'public' 
                  AND cls.relname = v_table_name 
                  AND con.contype = 'u'
                  AND con.conname = (v_uq_item->>'name')
                GROUP BY con.oid;

                SELECT array_agg(col::text) INTO v_expected_uq_cols
                FROM jsonb_array_elements_text(v_uq_item->'columns') AS col;

                IF v_actual_uq_cols IS DISTINCT FROM v_expected_uq_cols THEN
                    RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% unique constraint % column mismatch (expected %, actual %).',
                        v_table_name, (v_uq_item->>'name'), v_expected_uq_cols, v_actual_uq_cols;
                END IF;
            END LOOP;

            -- 5. Standalone Unique Indexes Verification (F-15, F-18)
            SELECT count(*) INTO v_actual_uidx_count
            FROM pg_index idx
            JOIN pg_class icls ON icls.oid = idx.indexrelid
            JOIN pg_class tcls ON tcls.oid = idx.indrelid
            JOIN pg_namespace nsp ON nsp.oid = tcls.relnamespace
            LEFT JOIN pg_constraint con ON con.conindid = idx.indexrelid
            WHERE nsp.nspname = 'public' 
              AND tcls.relname = v_table_name
              AND idx.indisunique = true
              AND con.oid IS NULL;

            IF v_actual_uidx_count <> coalesce(jsonb_array_length(v_tbl_def->'unique_indexes'), 0) THEN
                RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% standalone unique index count mismatch (expected %, actual %).',
                    v_table_name, coalesce(jsonb_array_length(v_tbl_def->'unique_indexes'), 0), v_actual_uidx_count;
            END IF;

            IF (v_tbl_def->'unique_indexes') IS NOT NULL THEN
                FOR v_idx_item IN SELECT * FROM jsonb_array_elements(v_tbl_def->'unique_indexes')
                LOOP
                    SELECT 
                        array_agg(att.attname::text ORDER BY pos.n),
                        idx.indisunique,
                        pg_get_expr(idx.indpred, idx.indrelid)
                    INTO 
                        v_actual_idx_cols,
                        v_idx_is_unique,
                        v_actual_pred
                    FROM pg_index idx
                    JOIN pg_class icls ON icls.oid = idx.indexrelid
                    JOIN pg_class tcls ON tcls.oid = idx.indrelid
                    JOIN pg_namespace nsp ON nsp.oid = tcls.relnamespace
                    CROSS JOIN LATERAL generate_subscripts(idx.indkey, 1) AS pos(n)
                    JOIN pg_attribute att ON att.attrelid = tcls.oid AND att.attnum = idx.indkey[pos.n]
                    WHERE nsp.nspname = 'public'
                      AND tcls.relname = v_table_name
                      AND icls.relname = (v_idx_item->>'name')
                    GROUP BY idx.indexrelid, idx.indisunique, idx.indpred, idx.indrelid;

                    IF v_actual_idx_cols IS NULL THEN
                        RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% missing standalone unique index %.',
                            v_table_name, (v_idx_item->>'name');
                    END IF;

                    SELECT array_agg(col::text) INTO v_expected_idx_cols
                    FROM jsonb_array_elements_text(v_idx_item->'columns') AS col;

                    IF v_actual_idx_cols IS DISTINCT FROM v_expected_idx_cols THEN
                        RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% index % column mismatch (expected %, actual %).',
                            v_table_name, (v_idx_item->>'name'), v_expected_idx_cols, v_actual_idx_cols;
                    END IF;

                    IF v_idx_is_unique <> (v_idx_item->>'is_unique')::boolean THEN
                        RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% index % uniqueness mismatch.',
                            v_table_name, (v_idx_item->>'name');
                    END IF;

                    -- Predicate check with literal-safe whitespace normalizer (F-15)
                    IF (v_idx_item->>'predicate') IS NOT NULL THEN
                    v_trimmed := trim(v_actual_pred);
                    v_norm_actual := '';
                    v_in_literal := false;
                    v_prev_was_space := false;
                    v_i := 1;
                    WHILE v_i <= length(v_trimmed) LOOP
                        v_char := substr(v_trimmed, v_i, 1);
                        IF v_char = '''' THEN
                            v_norm_actual := v_norm_actual || v_char;
                            IF v_in_literal THEN
                                IF v_i < length(v_trimmed) AND substr(v_trimmed, v_i + 1, 1) = '''' THEN
                                    -- Escaped quote ('') inside literal: preserve both, skip next
                                    v_norm_actual := v_norm_actual || '''';
                                    v_i := v_i + 1;
                                ELSE
                                    v_in_literal := false;
                                END IF;
                            ELSE
                                v_in_literal := true;
                            END IF;
                            v_prev_was_space := false;
                        ELSIF v_in_literal THEN
                            -- Inside literal: preserve character exactly (case-sensitive)
                            v_norm_actual := v_norm_actual || v_char;
                        ELSIF v_char = ' ' OR v_char = chr(9) OR v_char = chr(10) OR v_char = chr(13) THEN
                            -- Outside literal: collapse whitespace to single space
                            IF NOT v_prev_was_space THEN
                                v_norm_actual := v_norm_actual || ' ';
                            END IF;
                            v_prev_was_space := true;
                        ELSE
                            -- Outside literal: preserve non-whitespace character exactly
                            v_norm_actual := v_norm_actual || v_char;
                            v_prev_was_space := false;
                        END IF;
                        v_i := v_i + 1;
                    END LOOP;
                    v_trimmed := trim((v_idx_item->>'predicate'));
                    v_norm_expected := '';
                    v_in_literal := false;
                    v_prev_was_space := false;
                    v_i := 1;
                    WHILE v_i <= length(v_trimmed) LOOP
                        v_char := substr(v_trimmed, v_i, 1);
                        IF v_char = '''' THEN
                            v_norm_expected := v_norm_expected || v_char;
                            IF v_in_literal THEN
                                IF v_i < length(v_trimmed) AND substr(v_trimmed, v_i + 1, 1) = '''' THEN
                                    -- Escaped quote ('') inside literal: preserve both, skip next
                                    v_norm_expected := v_norm_expected || '''';
                                    v_i := v_i + 1;
                                ELSE
                                    v_in_literal := false;
                                END IF;
                            ELSE
                                v_in_literal := true;
                            END IF;
                            v_prev_was_space := false;
                        ELSIF v_in_literal THEN
                            -- Inside literal: preserve character exactly (case-sensitive)
                            v_norm_expected := v_norm_expected || v_char;
                        ELSIF v_char = ' ' OR v_char = chr(9) OR v_char = chr(10) OR v_char = chr(13) THEN
                            -- Outside literal: collapse whitespace to single space
                            IF NOT v_prev_was_space THEN
                                v_norm_expected := v_norm_expected || ' ';
                            END IF;
                            v_prev_was_space := true;
                        ELSE
                            -- Outside literal: preserve non-whitespace character exactly
                            v_norm_expected := v_norm_expected || v_char;
                            v_prev_was_space := false;
                        END IF;
                        v_i := v_i + 1;
                    END LOOP;

                        IF v_norm_actual <> v_norm_expected THEN
                            RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% index % predicate mismatch (expected: %, actual: %).',
                                v_table_name, (v_idx_item->>'name'), v_norm_expected, v_norm_actual;
                        END IF;
                    END IF;
                END LOOP;
            END IF;

            -- 6. Foreign Keys Verification (F-17 Action Validation)
            SELECT count(*) INTO v_actual_fk_count
            FROM pg_constraint con
            JOIN pg_class cls ON cls.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
            WHERE nsp.nspname = 'public' AND cls.relname = v_table_name AND con.contype = 'f';

            IF v_actual_fk_count <> jsonb_array_length(v_tbl_def->'foreign_keys') THEN
                RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% foreign key count mismatch (expected %, actual %).',
                    v_table_name, jsonb_array_length(v_tbl_def->'foreign_keys'), v_actual_fk_count;
            END IF;

            FOR v_fk_item IN SELECT * FROM jsonb_array_elements(v_tbl_def->'foreign_keys')
            LOOP
                SELECT 
                    array_agg(att.attname::text ORDER BY pos.n),
                    rcls.relname,
                    array_agg(ratt.attname::text ORDER BY pos.n),
                    CASE con.confdeltype
                        WHEN 'c' THEN 'CASCADE'
                        WHEN 'r' THEN 'RESTRICT'
                        WHEN 'a' THEN 'NO ACTION'
                        WHEN 'n' THEN 'SET NULL'
                        WHEN 'd' THEN 'SET DEFAULT'
                    END
                INTO 
                    v_actual_src_cols,
                    v_actual_ref_tbl,
                    v_actual_ref_cols,
                    v_actual_del_action
                FROM pg_constraint con
                JOIN pg_class cls ON cls.oid = con.conrelid
                JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
                JOIN pg_class rcls ON rcls.oid = con.confrelid
                CROSS JOIN LATERAL generate_subscripts(con.conkey, 1) AS pos(n)
                JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[pos.n]
                JOIN pg_attribute ratt ON ratt.attrelid = con.confrelid AND ratt.attnum = con.confkey[pos.n]
                WHERE nsp.nspname = 'public' 
                  AND cls.relname = v_table_name 
                  AND con.contype = 'f'
                  AND con.conname = (v_fk_item->>'name')
                GROUP BY con.oid, rcls.relname, con.confdeltype;

                IF v_actual_src_cols IS NULL THEN
                    RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% missing foreign key %.',
                        v_table_name, (v_fk_item->>'name');
                END IF;

                SELECT array_agg(col::text) INTO v_expected_src_cols
                FROM jsonb_array_elements_text(v_fk_item->'source_columns') AS col;

                SELECT array_agg(col::text) INTO v_expected_ref_cols
                FROM jsonb_array_elements_text(v_fk_item->'referenced_columns') AS col;

                IF v_actual_src_cols IS DISTINCT FROM v_expected_src_cols THEN
                    RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% FK % source column mismatch.',
                        v_table_name, (v_fk_item->>'name');
                END IF;

                IF v_actual_ref_tbl <> (v_fk_item->>'referenced_table') THEN
                    RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% FK % referenced table mismatch (expected %, actual %).',
                        v_table_name, (v_fk_item->>'name'), (v_fk_item->>'referenced_table'), v_actual_ref_tbl;
                END IF;

                IF v_actual_ref_cols IS DISTINCT FROM v_expected_ref_cols THEN
                    RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% FK % referenced column mismatch.',
                        v_table_name, (v_fk_item->>'name');
                END IF;

                IF v_actual_del_action <> (v_fk_item->>'on_delete') THEN
                    RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% FK % ON DELETE action mismatch (expected: %, actual: %).',
                        v_table_name, (v_fk_item->>'name'), (v_fk_item->>'on_delete'), v_actual_del_action;
                END IF;
            END LOOP;

            -- 7. Check Constraints Verification (F-16, F-18 & F-19 Structural Hardening)
            -- F-19 Structural Boolean & Whitelist Array-Grammar Contract for Enum CHECKs:
            --   - Step 1: Validate outer CHECK grammar via anchored POSIX regex: ^CHECK ((<col> = ANY (ARRAY[...])))
            --     Strictly blocks: CASE WHEN, COALESCE, IS NOT FALSE, NOT (...), <> ALL, extra boolean conditions
            --   - Step 2: Validate column identity against manifest
            --   - Step 3: Validate comparison operator ('=') against manifest
            --   - Step 4: Validate ANY operator ('ANY') against manifest
            --   - Step 5: Extract ARRAY body between ARRAY[ and ]
            --   - Step 6: Parse ARRAY body using explicit whitelist literal grammar:
            --             list := element (comma + element)*
            --             element := ws* single_quoted_literal ws* cast ws*
            --             Strictly rejects: nested arrays, concatenation, CASE, COALESCE, NULL, functions,
            --             column references, subqueries, operators (+, -, *, /), arbitrary casts,
            --             empty elements, trailing commas.
            --   - Step 7: Fail closed on any malformed syntax or non-literal token
            --   - Step 8: Extract ONLY structurally validated literal values
            --   - Step 9: Compare exact sorted value set via IS DISTINCT FROM
            --   - Step 10: Compare cardinality (expected_value_count)
            --   - Step 11: Case-insensitive logical weakening guard (~* 'mORM' / ~* 'mANDM')
            SELECT count(*) INTO v_actual_chk_count
            FROM pg_constraint con
            JOIN pg_class cls ON cls.oid = con.conrelid
            JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
            WHERE nsp.nspname = 'public' AND cls.relname = v_table_name AND con.contype = 'c';

            IF v_actual_chk_count <> jsonb_array_length(v_tbl_def->'check_constraints') THEN
                RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint count mismatch (expected: %, actual: %). Extra/missing CHECK constraints detected.',
                    v_table_name, jsonb_array_length(v_tbl_def->'check_constraints'), v_actual_chk_count;
            END IF;

            FOR v_chk_item IN SELECT * FROM jsonb_array_elements(v_tbl_def->'check_constraints')
            LOOP
                SELECT pg_get_constraintdef(con.oid) INTO v_actual_chk_def
                FROM pg_constraint con
                JOIN pg_class cls ON cls.oid = con.conrelid
                JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
                WHERE nsp.nspname = 'public'
                  AND cls.relname = v_table_name
                  AND con.contype = 'c'
                  AND con.conname = (v_chk_item->>'name');

                IF v_actual_chk_def IS NULL THEN
                    RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% pre-exists without required CHECK constraint %.',
                        v_table_name, (v_chk_item->>'name');
                END IF;

                -- 7a. F-19 Structural Contract Verification for enum/status checks
                IF (v_chk_item->>'kind') = 'enum_status' OR (v_chk_item->'allowed_values') IS NOT NULL THEN
                    -- Step 1: Validate outer CHECK grammar via anchored POSIX regex
                    SELECT regexp_match(
                        v_actual_chk_def,
                        '^CHECK[[:space:]]*\([[:space:]]*\([[:space:]]*([a-zA-Z0-9_]+)[[:space:]]*(=)[[:space:]]*(ANY)[[:space:]]*\([[:space:]]*ARRAY\[(.+)\][[:space:]]*\)[[:space:]]*\)[[:space:]]*\)$'
                    ) INTO v_struct_match;

                    IF v_struct_match IS NULL THEN
                        RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % does not conform to exact structural contract CHECK ((<col> = ANY (ARRAY[...]))). Possible boolean wrapper, CASE tautology, or structural tampering. Actual definition: %.',
                            v_table_name, (v_chk_item->>'name'), v_actual_chk_def;
                    END IF;

                    -- Step 2: Constrained column identity assertion
                    IF (v_chk_item->>'column') IS NOT NULL AND v_struct_match[1] <> (v_chk_item->>'column') THEN
                        RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % constrained column mismatch (expected: %, actual: %).',
                            v_table_name, (v_chk_item->>'name'), (v_chk_item->>'column'), v_struct_match[1];
                    END IF;

                    -- Step 3: Comparison operator assertion ('=')
                    IF (v_chk_item->>'comparison_operator') IS NOT NULL AND v_struct_match[2] <> (v_chk_item->>'comparison_operator') THEN
                        RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % comparison operator mismatch (expected: %, actual: %).',
                            v_table_name, (v_chk_item->>'name'), (v_chk_item->>'comparison_operator'), v_struct_match[2];
                    END IF;

                    -- Step 4: Array operator assertion ('ANY', strictly blocking '<> ALL')
                    IF (v_chk_item->>'array_operator') IS NOT NULL AND v_struct_match[3] <> (v_chk_item->>'array_operator') THEN
                        RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % array operator mismatch (expected: %, actual: %).',
                            v_table_name, (v_chk_item->>'name'), (v_chk_item->>'array_operator'), v_struct_match[3];
                    END IF;

                    -- Step 5 & 6: Extract and parse ARRAY body using exact whitelist literal grammar (Cycle 8 / F-19)
                    v_body := v_struct_match[4];
                    v_b_len := length(v_body);
                    v_b_idx := 1;
                    v_actual_values := ARRAY[]::text[];
                    v_expected_cast := coalesce(v_chk_item->>'element_cast', '::text');
                    v_cast_len := length(v_expected_cast);

                    -- Skip leading whitespace in array body
                    WHILE v_b_idx <= v_b_len AND (
                        substr(v_body, v_b_idx, 1) = ' ' OR 
                        substr(v_body, v_b_idx, 1) = chr(9) OR 
                        substr(v_body, v_b_idx, 1) = chr(10) OR 
                        substr(v_body, v_b_idx, 1) = chr(13)
                    ) LOOP
                        v_b_idx := v_b_idx + 1;
                    END LOOP;

                    IF v_b_idx > v_b_len THEN
                        RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % has empty ARRAY body.',
                            v_table_name, (v_chk_item->>'name');
                    END IF;

                    WHILE v_b_idx <= v_b_len LOOP
                        -- Skip whitespace before element
                        WHILE v_b_idx <= v_b_len AND (
                            substr(v_body, v_b_idx, 1) = ' ' OR 
                            substr(v_body, v_b_idx, 1) = chr(9) OR 
                            substr(v_body, v_b_idx, 1) = chr(10) OR 
                            substr(v_body, v_b_idx, 1) = chr(13)
                        ) LOOP
                            v_b_idx := v_b_idx + 1;
                        END LOOP;

                        -- Step 7: Element must start with single quote
                        IF v_b_idx > v_b_len OR substr(v_body, v_b_idx, 1) <> '''' THEN
                            RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % malformed ARRAY element at position %: expected single-quoted literal, found "%". Structural expression injection rejected.',
                                v_table_name, (v_chk_item->>'name'), v_b_idx, substr(v_body, v_b_idx, 15);
                        END IF;

                        v_b_idx := v_b_idx + 1; -- consume opening quote
                        v_lit_val := '';
                        v_lit_closed := false;

                        WHILE v_b_idx <= v_b_len LOOP
                            v_b_char := substr(v_body, v_b_idx, 1);
                            IF v_b_char = '''' THEN
                                IF v_b_idx < v_b_len AND substr(v_body, v_b_idx + 1, 1) = '''' THEN
                                    -- Escaped single quote: ''
                                    v_lit_val := v_lit_val || '''';
                                    v_b_idx := v_b_idx + 2;
                                ELSE
                                    -- Closing single quote
                                    v_lit_closed := true;
                                    v_b_idx := v_b_idx + 1;
                                    EXIT;
                                END IF;
                            ELSE
                                v_lit_val := v_lit_val || v_b_char;
                                v_b_idx := v_b_idx + 1;
                            END IF;
                        END LOOP;

                        IF NOT v_lit_closed THEN
                            RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % unterminated string literal in ARRAY body.',
                                v_table_name, (v_chk_item->>'name');
                        END IF;

                        -- Skip whitespace between literal and cast
                        WHILE v_b_idx <= v_b_len AND (
                            substr(v_body, v_b_idx, 1) = ' ' OR 
                            substr(v_body, v_b_idx, 1) = chr(9) OR 
                            substr(v_body, v_b_idx, 1) = chr(10) OR 
                            substr(v_body, v_b_idx, 1) = chr(13)
                        ) LOOP
                            v_b_idx := v_b_idx + 1;
                        END LOOP;

                        -- Element cast must match expected_cast exactly (e.g. '::text')
                        IF substr(v_body, v_b_idx, v_cast_len) <> v_expected_cast THEN
                            RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % element cast mismatch at position %: expected "%", found "%".',
                                v_table_name, (v_chk_item->>'name'), v_b_idx, v_expected_cast, substr(v_body, v_b_idx, 15);
                        END IF;
                        v_b_idx := v_b_idx + v_cast_len;

                        -- Step 8: Element parsed and structurally validated: collect into actual values array
                        v_actual_values := array_append(v_actual_values, v_lit_val);

                        -- Skip whitespace after cast
                        WHILE v_b_idx <= v_b_len AND (
                            substr(v_body, v_b_idx, 1) = ' ' OR 
                            substr(v_body, v_b_idx, 1) = chr(9) OR 
                            substr(v_body, v_b_idx, 1) = chr(10) OR 
                            substr(v_body, v_b_idx, 1) = chr(13)
                        ) LOOP
                            v_b_idx := v_b_idx + 1;
                        END LOOP;

                        IF v_b_idx > v_b_len THEN
                            EXIT; -- clean end of array body
                        END IF;

                        -- Next character MUST be comma
                        IF substr(v_body, v_b_idx, 1) = ',' THEN
                            v_b_idx := v_b_idx + 1; -- consume comma
                            -- Check for trailing comma (empty element)
                            WHILE v_b_idx <= v_b_len AND (
                                substr(v_body, v_b_idx, 1) = ' ' OR 
                                substr(v_body, v_b_idx, 1) = chr(9) OR 
                                substr(v_body, v_b_idx, 1) = chr(10) OR 
                                substr(v_body, v_b_idx, 1) = chr(13)
                            ) LOOP
                                v_b_idx := v_b_idx + 1;
                            END LOOP;
                            IF v_b_idx > v_b_len THEN
                                RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % has trailing comma / empty element in ARRAY body.',
                                    v_table_name, (v_chk_item->>'name');
                            END IF;
                        ELSE
                            RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % unexpected token at position % in ARRAY body: expected ",", found "%". Expression injection or invalid structure.',
                                v_table_name, (v_chk_item->>'name'), v_b_idx, substr(v_body, v_b_idx, 15);
                        END IF;
                    END LOOP;

                    -- Step 9: Check for duplicate elements in array body
                    IF (SELECT count(DISTINCT elem) FROM unnest(v_actual_values) AS elem) <> array_length(v_actual_values, 1) THEN
                        RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % contains duplicate elements in ARRAY body.',
                            v_table_name, (v_chk_item->>'name');
                    END IF;

                    -- Step 10: Sort actual extracted values and compare exact set
                    SELECT array_agg(elem ORDER BY elem) INTO v_actual_values
                    FROM unnest(v_actual_values) AS elem;

                    SELECT array_agg(elem ORDER BY elem) INTO v_expected_values
                    FROM jsonb_array_elements_text(v_chk_item->'allowed_values') AS elem;

                    IF v_actual_values IS DISTINCT FROM v_expected_values THEN
                        RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % value set mismatch. Expected: [%], Actual: [%].',
                            v_table_name, (v_chk_item->>'name'), v_expected_values, v_actual_values;
                    END IF;

                    -- Step 11: Cardinality parity (defense-in-depth)
                    IF (v_chk_item->>'expected_value_count') IS NOT NULL THEN
                        v_actual_value_count := coalesce(array_length(v_actual_values, 1), 0);
                        IF v_actual_value_count <> (v_chk_item->>'expected_value_count')::integer THEN
                            RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % value count mismatch (expected: %, actual: %).',
                                v_table_name, (v_chk_item->>'name'), (v_chk_item->>'expected_value_count'), v_actual_value_count;
                        END IF;
                    END IF;

                    -- Step 12: Case-insensitive logical weakening guard (defense-in-depth)
                    IF v_actual_chk_def ~* '\mOR\M' OR v_actual_chk_def ~* '\mAND\M' THEN
                        RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % contains forbidden logical operator (OR/AND). Possible structural weakening detected in: %.',
                            v_table_name, (v_chk_item->>'name'), v_actual_chk_def;
                    END IF;
                END IF;

                -- 7b. Required tokens for mathematical/relational expressions
                -- Retained for non-enum CHECKs (amount > 0, end_date > start_date, etc.)
                -- These are structural expression constraints, not value-set constraints.
                IF (v_chk_item->'required_tokens') IS NOT NULL THEN
                    FOR v_token IN SELECT jsonb_array_elements_text(v_chk_item->'required_tokens')
                    LOOP
                        IF v_actual_chk_def NOT LIKE '%' || v_token || '%' THEN
                            RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % expression drift (expected %, found %).',
                                v_table_name, (v_chk_item->>'name'), v_token, v_actual_chk_def;
                        END IF;
                    END LOOP;
                END IF;

                -- 7c. Forbidden tokens to prevent weakening (e.g. >= instead of >)
                IF (v_chk_item->'forbidden_tokens') IS NOT NULL THEN
                    FOR v_token IN SELECT jsonb_array_elements_text(v_chk_item->'forbidden_tokens')
                    LOOP
                        IF v_actual_chk_def LIKE '%' || v_token || '%' THEN
                            RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% CHECK constraint % contains forbidden token % (weakened check detected in %).',
                                v_table_name, (v_chk_item->>'name'), v_token, v_actual_chk_def;
                        END IF;
                    END LOOP;
                END IF;
            END LOOP;

            -- 8. Table Row-Level Security Enabled Match
            IF (v_tbl_def->>'rls')::boolean = true THEN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM pg_class c 
                    JOIN pg_namespace n ON n.oid = c.relnamespace 
                    WHERE n.nspname = 'public' 
                      AND c.relname = v_table_name 
                      AND c.relrowsecurity = true
                ) THEN
                    RAISE EXCEPTION 'SCHEMA_DRIFT_DETECTED: Table public.% pre-exists with RLS disabled.', v_table_name;
                END IF;
            END IF;

        END IF;
    END LOOP;

    RAISE NOTICE 'PHASE 1 PRECONDITION ASSERTIONS PASSED: Target environment structure verified. Proceeding with idempotent schema migration.';
END $$;

```

---

## 7. PHASE 2: ADDITIVE EXISTING TABLE EXTENSIONS (F-02, F-07)

1. Add `merged_into_user_id` to `public.users` with self-reference guard `chk_users_merged_not_self`.
2. Add `user_id` to `public.santri` with `REFERENCES public.users(id) ON DELETE RESTRICT`.
3. Add `uq_santri_tenant_id UNIQUE (tenant_id, id)` to `public.santri` to serve as the relational anchor for child tables.
4. Add partial unique index `uq_santri_tenant_active_user ON public.santri (tenant_id, user_id) WHERE status = 'Aktif' AND user_id IS NOT NULL`.

---

## 8. PHASE 3: CORE IDENTITY & SAGA TABLES (F-07, F-08)

1. Create `public.user_tenant_personas`.
2. Create `public.identity_consolidation_ledgers` with:
   - `CONSTRAINT chk_icl_distinct_users CHECK (source_student_uid <> target_wali_uid)`
   - Composite FK `FOREIGN KEY (tenant_id, santri_id) REFERENCES public.santri(tenant_id, id) ON DELETE RESTRICT`
   - Partial unique index covering `('DB_COMMITTED_AUTH_PENDING', 'RECONCILIATION_REQUIRED', 'MANUAL_ATTENTION_REQUIRED')`.

---

## 9. PHASE 4: PSB DOMAIN TABLES (8 TABLES, F-01, F-02, F-06)

1. `public.psb_periods`
2. `public.psb_waves`
3. `public.psb_committees`
4. `public.psb_applicants` (`target_madrasahs` default `[]` intake notes)
5. `public.psb_test_scores` (Restored - F-01)
6. `public.psb_infaq_verifications`
7. `public.psb_acceptance_ledgers`
8. `public.psb_placement_distributions` (Composite FK to `santri` and composite FK to `psb_applicants`)

---

## 10. PHASE 5: ALUMNI DOMAIN TABLES (8 TABLES, F-02)

1. `public.alumni_exit_reasons`
2. `public.alumni_academic_snapshots` (Composite FK to `santri`)
3. `public.alumni_korwils`
4. `public.tenant_korwil_settings`
5. `public.alumni_profiles` (`domicile_address` documented as internal profile data)
6. `public.user_discovery_locations`
7. `public.salam_interactions`
8. `public.alumni_donations`

---

## 11. PHASE 6: PROCEDURAL TRIGGERS (F-06, NBO-001)

1. Create `public.fn_enforce_placement_hierarchy()` validating 5 checks:
   - Tingkat $\rightarrow$ Madrasah & Jenjang
   - Rombel $\rightarrow$ Tingkat
   - Rombel Year $\rightarrow$ PSB Period Year (TIR-007)
   - Santri Tenant $\rightarrow$ Placement Tenant (TIR-008)
   - Applicant Period $\rightarrow$ Placement Period (F-06)
2. Bind `trg_enforce_placement_hierarchy` BEFORE INSERT OR UPDATE on `psb_placement_distributions`.
3. Create `public.fn_sync_santri_kelas_from_rombel()`.
4. Bind `trg_sync_santri_kelas_from_rombel` AFTER INSERT OR UPDATE on `psb_placement_distributions`.

---

## 12. PHASE 7: RLS ACTIVATION & INTENTIONAL POLICIES (ALL 18 TABLES)

Enable RLS and apply explicit policies with `USING` and `WITH CHECK` across all 18 tables:
1. `identity_consolidation_ledgers`: `USING (false) WITH CHECK (false)`. Sealed server-only outbox table.
2. `salam_interactions`: Participant-only read/write (`sender_user_id = auth.uid()` / `recipient_user_id = auth.uid()`).
3. `user_discovery_locations`: Write strictly owned by user (`user_id = auth.uid()`).
4. `alumni_profiles`: Write strictly owned by user (`user_id = auth.uid()`).
5. Standard tenant isolation policies for remaining 14 tables with explicit `WITH CHECK`.

### 12.1 RLS IS NOT BUSINESS AUTHORIZATION (TWO-LAYER DEFENSE MODEL)

The migration design mandates strict adherence to the two-layer defense architecture:
- **Layer 1 (PostgreSQL RLS)**: Guarantees tenant isolation (`tenant_id = current_tenant_id`) and row-ownership where applicable. A passing RLS check proves ONLY that data remains within tenant boundaries.
- **Layer 2 (Application RBAC)**: Verifies actor role permissions (`SAT`, `Ketua Panitia`, `Bendahara`, `Musyrif`, `Pengurus Korwil`).
- **Core Directive**: **RLS tenant isolation MUST NOT be interpreted as proof of business authorization.**

### 12.2 DOMAIN AUTHORIZATION BOUNDARIES & DESTINATION SCOPES

- **Audit Attribution Anchors**: Column `sat_user_id` in `psb_acceptance_ledgers` stores an audit attribution anchor; verification that the actor is authorized SAT is enforced at the application service layer.
- **Destination Scope Authorization**: Destination-scoping for `alumni_donations` (`A_PUSAT`, `KORWIL`, `PROGRAM`, `ACTIVITY`) is a domain authorization responsibility enforced by application service queries (`SCHEMA/DOMAIN AUTHORIZATION GAP`), ensuring regional treasurers cannot view central foundation balances.

### 12.3 POLICY IDEMPOTENCY SPECIFICATION (F-09-B)

PostgreSQL DDL lacks a `CREATE POLICY IF NOT EXISTS` construct. Under the Conditional Semantic Idempotency Contract, re-running the migration against a structurally compatible schema (Case B re-run) would previously crash with `ERROR: policy "..." already exists for table "..."`.

To achieve deterministic policy idempotency without mutating business authorization semantics:
- Every `CREATE POLICY` statement across all 20 migration-managed policies is immediately preceded by a scoped `DROP POLICY IF EXISTS "policy_name" ON public.table_name;`.
- **Scope Isolation**: Drops apply strictly to the 20 migration-owned policies. Unmanaged policies belonging to the core application remain untouched.
- **Preserved Semantics**: The subsequent `CREATE POLICY` re-registers the exact authoritative definition with identical `USING` and `WITH CHECK` clauses, ensuring zero degradation of tenant isolation, row ownership, peer privacy in `salam_interactions`, or sealed ledger security.

---

## 13. PHASE 8: POST-MIGRATION INVARIANT VALIDATION

Execute automated validation query verifying all 18 tables, columns, and triggers:

```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
      'user_tenant_personas', 'identity_consolidation_ledgers', 'psb_periods',
      'psb_waves', 'psb_committees', 'psb_applicants', 'psb_test_scores',
      'psb_infaq_verifications', 'psb_acceptance_ledgers', 'psb_placement_distributions',
      'alumni_exit_reasons', 'alumni_academic_snapshots', 'alumni_korwils',
      'tenant_korwil_settings', 'alumni_profiles', 'user_discovery_locations',
      'salam_interactions', 'alumni_donations'
  );
-- Expected: 18 tables exactly
```

---

## 14. BACKFILL STRATEGY

- **`santri.user_id`**: Added as nullable. Zero historical backfill required during migration. Backfill is deferred and executed on-demand when student portal access is provisioned or when an alumnus is conferred.
- **`santri.kelas`**: Existing historical class strings remain untouched (NBO-001 Last-Write-Wins legacy projection).

---

## 15. ZERO DATA LOSS TARGET UNDER APPROVED MIGRATION PROCEDURE

- **Target Posture**: **Zero Data Loss Target Under Approved Migration Procedure**.
- **No Inherent Data Destruction**: Adding nullable extension columns (`user_id`, `merged_into_user_id`) and creating parallel domain tables mutates zero existing production rows.
- **Boundary**: Zero data loss applies strictly to forward migration and pre-data maintenance rollbacks. Once business data exists, dropping tables is forbidden and disaster recovery shifts to Forward-Fix or PITR.

---

## 16. ZERO-DOWNTIME POSTURE RECLASSIFICATION (F-11)

- **Classification**: **Zero-Downtime Target — Controlled Off-Peak Maintenance Window Recommended**.
- **PostgreSQL Lock Impact**:
  - `ALTER TABLE santri ADD CONSTRAINT fk_santri_user_id` acquires `ShareRowExclusiveLock` on `santri`.
  - `CREATE UNIQUE INDEX uq_santri_tenant_active_user` inside transactional block acquires `ShareLock` on `santri`.
  - Writes to `santri` and `users` will be temporarily queued during the migration transaction (typically < 3 seconds).
  - Executing during off-peak hours completely mitigates lock timeout risks.

---

## 17. ROLLBACK ARCHITECTURE (F-10 OPERATIONAL SEGREGATION)

### 17.1 Semantic Idempotency Contract (Conditional Idempotency)
The migration is conditionally idempotent adhering to the **Three-State Structural Model**:
- **State A (Absent)**: Target schema objects are absent $\rightarrow$ Phase 1 passes cleanly, Phase 2–7 create tables, constraints, indices, triggers, and policies.
- **State B (Present + Fully Compatible)**: Target schema objects exist and match 100% of the authoritative declarative JSONB manifest (180 declared columns across 18 domain tables, 18 Primary Keys on single-column `id`, 32 Unique structures [31 Unique Constraints + 1 Partial Unique Index with pg_index `indisunique`, ordered indexed columns, and literal-safe predicate canonicalization (F-15 Cycle 6 Revision: whitespace normalization outside single-quoted literals, no `lower()`)], 46 Foreign Keys with exact composite column arrays and catalog `ON DELETE` referential action verification (F-17), 23 Check Constraints with exact enum value-set equality via sorted array comparison, exact structural boolean contract verification anchored to CHECK ((col = ANY (ARRAY[...]))) asserting column, comparison_operator (=), array_operator (ANY), and case-insensitive weakening guard (\\mOR\\M / \\mAND\\M via ~*) blocking CASE/COALESCE/IS NOT FALSE/NOT/< > ALL bypasses (F-16, F-19 Cycle 7), and relational expression required/forbidden tokens, count-based parity checks detecting extra unauthorized UQ/FK/CHECK constraints (F-18), and 18 RLS enabled flags). Column defaults are intentionally application/ORM-level implementation details and are not part of the structural relational compatibility contract $\rightarrow$ Phase 1 assertions pass cleanly, statements execute safely without error.
- **State C (Present + Incompatible / Structural Drift)**: Target schema exists with any structural drift:
  1. Extra column not declared in contract
  2. Missing required column
  3. Mismatched data type or nullability
  4. Composite PK instead of single-column PK (e.g. `id, tenant_id` vs `id`)
  5. Missing unique constraint, wrong column ordering, or extra unauthorized unique constraint (F-18)
  6. Partial index column drift, non-unique index (`indisunique = false`), or partial predicate drift via literal-safe normalized comparison (F-15 Cycle 6 Revision)
  7. Single-column FK instead of composite FK, wrong referenced column, wrong `ON DELETE` referential action (F-17), or extra unauthorized FK (F-18)
  8. Missing, weakened, or altered CHECK expression (e.g. `amount >= 0` instead of `amount > 0`), enum structural contract violation (CASE tautologies, COALESCE weakening, IS NOT FALSE, NOT wrapper, <> ALL operator, array concatenation, nested arrays, functions, arbitrary casts, or boolean clauses), enum value-set mismatch (extra, missing, replacement, or duplicate values detected via sorted array comparison), case-insensitive forbidden logical operators (OR/AND) in enum CHECKs, or extra unauthorized CHECK constraint (F-16, F-18, F-19 Cycle 8)
  9. Prerequisite Level-4 target composite keys missing on academic hierarchy
  10. Row-Level Security disabled (`relrowsecurity = false`)
  $\rightarrow$ Phase 1 aborts immediately fail-closed via `RAISE EXCEPTION`, rolling back the transaction and preventing schema persistence.

### 17.2 Operational Rollback Procedures

### Procedure A: PRE-DATA SCHEMA ROLLBACK (Maintenance Window Only)
Applicable **strictly immediately post-migration before live traffic begins**:

```sql
BEGIN;
-- 1. Drop Triggers & Functions
DROP TRIGGER IF EXISTS trg_sync_santri_kelas_from_rombel ON public.psb_placement_distributions;
DROP TRIGGER IF EXISTS trg_enforce_placement_hierarchy ON public.psb_placement_distributions;
DROP FUNCTION IF EXISTS public.fn_sync_santri_kelas_from_rombel();
DROP FUNCTION IF EXISTS public.fn_enforce_placement_hierarchy();

-- 2. Drop All 18 Domain Tables (Reverse Dependency Order)
DROP TABLE IF EXISTS public.alumni_donations CASCADE;
DROP TABLE IF EXISTS public.salam_interactions CASCADE;
DROP TABLE IF EXISTS public.user_discovery_locations CASCADE;
DROP TABLE IF EXISTS public.alumni_profiles CASCADE;
DROP TABLE IF EXISTS public.tenant_korwil_settings CASCADE;
DROP TABLE IF EXISTS public.alumni_korwils CASCADE;
DROP TABLE IF EXISTS public.alumni_academic_snapshots CASCADE;
DROP TABLE IF EXISTS public.alumni_exit_reasons CASCADE;
DROP TABLE IF EXISTS public.psb_placement_distributions CASCADE;
DROP TABLE IF EXISTS public.psb_acceptance_ledgers CASCADE;
DROP TABLE IF EXISTS public.psb_infaq_verifications CASCADE;
DROP TABLE IF EXISTS public.psb_test_scores CASCADE;
DROP TABLE IF EXISTS public.psb_applicants CASCADE;
DROP TABLE IF EXISTS public.psb_committees CASCADE;
DROP TABLE IF EXISTS public.psb_waves CASCADE;
DROP TABLE IF EXISTS public.psb_periods CASCADE;
DROP TABLE IF EXISTS public.identity_consolidation_ledgers CASCADE;
DROP TABLE IF EXISTS public.user_tenant_personas CASCADE;

-- 3. Drop Added Constraints and Columns from Existing Tables
ALTER TABLE public.santri DROP CONSTRAINT IF EXISTS uq_santri_tenant_id;
ALTER TABLE public.santri DROP COLUMN IF EXISTS user_id;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_users_merged_not_self;
ALTER TABLE public.users DROP COLUMN IF EXISTS merged_into_user_id;

COMMIT;
```

### Procedure B: POST-DATA DISASTER RECOVERY (Production Traffic Active)
Once production traffic has commenced and live student registrations, test scores, or payments have been recorded:
- **`DROP TABLE ... CASCADE` is STRICTLY FORBIDDEN.**
- Dropping tables or columns post-data causes catastrophic, unrecoverable data loss.
- In the event of a production defect post-traffic:
  1. Freeze affected workflows via feature toggles in `tenant_settings`.
  2. Implement an additive **Forward-Fix Migration**.
  3. If database corruption occurs, restore using **Point-in-Time Database Restore (PITR)** from Supabase automated daily backups.

---

## 18. GATE 8B REMEDIATION REVIEW CHECKLIST

```text
══════════════════════════════════════════════════════════════════════════════════
GATE 8B REMEDIATION REVIEW CHECKLIST (CYCLE 8 EXACT ARRAY-LITERAL STRUCTURAL HARDENED)
══════════════════════════════════════════════════════════════════════════════════
[X] 1. F-01: psb_test_scores table fully restored and integrated.
[X] 2. F-02: uq_santri_tenant_id added, all child tables upgraded to composite FK.
[X] 3. F-03 & F-05: All 18 tables have intentional RLS with explicit WITH CHECK.
[X] 4. F-04: salam_interactions and user_discovery_locations hardened.
[X] 5. F-06: Applicant-period validation added to placement trigger.
[X] 6. F-07: chk_users_merged_not_self and chk_icl_distinct_users added.
[X] 7. F-08: Partial unique index covers MANUAL_ATTENTION_REQUIRED and all saga states.
[X] 8. F-09-A: True Structural Contract Fingerprint covering 100% of declared elements (180 cols, exact column sets, extra-column detection, 18 single-column PKs, 32 UQs/Indexes with column order, 46 exact composite FKs, 23 CHKs, 18 RLS).
[X] 8b. F-09-B: Deterministic policy idempotency via DROP POLICY IF EXISTS before CREATE POLICY across all 20 policies (Preserved / Zero Regression).
[X] 9. F-10: Rollback partitioned into Pre-Data Drop vs Post-Data Disaster Recovery.
[X] 10. F-11: Zero-Downtime reclassified to Target with off-peak recommendation.
[X] 11. F-12: Single source of truth reconciliation resolved for uq_psb_dist_placement (4 cols) and uq_alumni_snapshots_record (3 cols).
[X] 12. F-13: Prerequisite composite target keys verified structurally via pg_constraint and pg_attribute column arrays for Level-4 academic hierarchy (academic_years, madrasah, jenjang, tingkat, rombel).
[X] 13. F-14: Statistical reconciliation verified with exact column summation (180 total domain columns, 18 tables, 46 FKs, 32 UQs/Indexes, 23 CHECKs).
[X] 14. F-15: Unique Index Structural & Uniqueness Hardening (indisunique = true verified, ordered index columns verified, literal-safe predicate canonicalization with exact normalized comparison — Cycle 6 Revision).
[X] 15. F-16: CHECK Expression Hardening (eliminated expression_contains stubs; exact enum value-set equality via sorted array comparison, relational required/forbidden tokens).
[X] 16. F-19: Exact Array-Literal Structural Hardening (anchored regex ^CHECK ((<col> = ANY (ARRAY[...]))), column/comparison_operator/array_operator assertions, character-by-character whitelist array-body grammar parser [list := element (comma + element)*, element := single_quoted_literal + exact_cast], duplicate rejection, case-insensitive ~* logical guard, blocking CASE/COALESCE/IS NOT FALSE/NOT/< > ALL/nested arrays/concatenation/functions/subqueries/arbitrary casts/operator injections — Cycle 8 Hardened).
[X] 17. F-17: Foreign Key Referential Action Hardening (con.confdeltype verified against contractual ON DELETE across all 46 FKs).
[X] 18. F-18: Extra Constraint Parity & Defaults Documentation (exact count parity for UQs, FKs, CHECKs; identity-level standalone unique index validation + count parity; column defaults documented as application/ORM-level — Cycle 6 Revision).
[X] 19. Object count normalized to exactly 18 new domain tables.
[X] 20. Migration phases normalized to exactly 8 phases.
══════════════════════════════════════════════════════════════════════════════════
```
