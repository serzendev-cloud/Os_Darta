-- ==============================================================================
-- WP-PSB-ALUMNI-DDL-DRAFT-001.sql
-- WORK PACKAGE: WP-PSB-ALUMNI-SCHEMA-001
-- TITLE: Draft DDL Specification for PSB & Alumni Ecosystem (Gate 8B Remediation Cycle 8 — F-19 Exact Array-Literal Structural Hardening)
-- GATE: GATE 8B REMEDIATION CYCLE 8 — F-19 EXACT ARRAY-LITERAL STRUCTURAL HARDENING
-- STATUS: DRAFT — NOT AUTHORIZED FOR EXECUTION
-- PRINCIPLE: INTEGRATE / EXTEND EXISTING APP MA'HAD (ZERO REWRITE)
-- ==============================================================================
-- ⚠️ IMPORTANT NOTICE:
-- THIS SCRIPT IS A STATIC ARCHITECTURAL DESIGN SPECIFICATION.
-- DO NOT EXECUTE AGAINST ANY APPLICATION DATABASE WITHOUT GATE 9 AUTHORIZATION.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- SECTION 0: PHASE 1 PRECONDITION ASSERTIONS & TRUE STRUCTURAL FINGERPRINT GATE
-- ==============================================================================
-- Enforces F-09-A, F-12, F-13, F-15, F-16, F-17, F-18, F-19 (True Structural Contract Fingerprint / Fail-Closed)
-- F-15: Literal-safe predicate canonicalization (no lower(), preserves string literal case, calibration-pending)
-- F-16: Exact sorted value-set equality via IS DISTINCT FROM
-- F-18: Identity-level standalone unique index validation + count parity
-- F-19 Cycle 8: Exact Structural Boolean & Whitelist Array-Grammar Contract for Enum CHECKs:
--   - Anchored shape regex: ^CHECK ((<col> = ANY (ARRAY[...])))
--   - Column identity, comparison operator (=), array operator (ANY) assertions
--   - Whitelist Array-Body Grammar Parser:
--     * list := element (comma + element)*
--     * element := ws* single_quoted_literal ws* cast ws*
--     * cast := '::text' (exact canonical representation)
--     * Strictly rejects: nested arrays, array concatenation (||), CASE, COALESCE, NULL, functions,
--       column references, subqueries, operators (+, -, *, /), arbitrary casts, empty elements, trailing commas
--   - Extracts ONLY structurally validated literal values
--   - Rejects duplicate elements in array body
--   - Case-insensitive logical weakening guard (\mOR\M / \mAND\M via ~*)
-- Evaluates Three-State Model for every object:
--   State A: Object ABSENT -> Creation allowed to proceed
--   State B: Object EXISTS + EXACTLY COMPATIBLE -> Continue safely (idempotent re-run)
--   State C: Object EXISTS + STRUCTURAL DRIFT -> RAISE EXCEPTION + fail-closed abort
-- ==============================================================================

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


-- ==============================================================================
-- SECTION 1: EXTENSIONS TO EXISTING TABLES (ADDITIVE MODIFICATIONS)
-- ==============================================================================

-- 1.1 Add 'MERGED' status tracking pointer to public.users (CG-002 & F-07)
-- Retains physical row for referential integrity while barring authentication.
DO $$
BEGIN
    -- Add tracking column for consolidation pointer
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'merged_into_user_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN merged_into_user_id text NULL;
        ALTER TABLE public.users ADD CONSTRAINT fk_users_merged_into 
            FOREIGN KEY (merged_into_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;
    END IF;

    -- Add self-reference guard constraint (F-07)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_users_merged_not_self' AND table_name = 'users'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT chk_users_merged_not_self 
            CHECK (merged_into_user_id IS NULL OR merged_into_user_id <> id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_merged_into ON public.users (merged_into_user_id);

-- 1.2 Add user_id and composite unique key to public.santri (CG-001 & F-02)
-- Binds physical student record to public.users.id (Option A synthetic credential).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'santri' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.santri ADD COLUMN user_id text NULL;
        ALTER TABLE public.santri ADD CONSTRAINT fk_santri_user_id 
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE RESTRICT;
    END IF;

    -- Add composite unique constraint for tenant-safe child FK references (F-02)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uq_santri_tenant_id' AND table_name = 'santri'
    ) THEN
        ALTER TABLE public.santri ADD CONSTRAINT uq_santri_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_santri_tenant_user_id ON public.santri (tenant_id, user_id);

-- Partial unique index: At most one active student record per user within a tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_santri_tenant_active_user 
    ON public.santri (tenant_id, user_id) 
    WHERE status = 'Aktif' AND user_id IS NOT NULL;


-- ==============================================================================
-- SECTION 2: CORE IDENTITY & MULTI-PERSONA TABLES (2 TABLES)
-- ==============================================================================

-- 2.1 Multi-Persona Table (CG-003)
-- Allows a single human identity (users.id) to hold multiple personas: WALI, SANTRI, ALUMNI.
CREATE TABLE IF NOT EXISTS public.user_tenant_personas (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    user_id text NOT NULL,
    persona_type text NOT NULL,
    status text DEFAULT 'ACTIVE' NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_utp_persona_type CHECK (persona_type IN ('WALI', 'SANTRI', 'ALUMNI')),
    CONSTRAINT chk_utp_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')),
    CONSTRAINT uq_user_tenant_persona UNIQUE (tenant_id, user_id, persona_type),
    CONSTRAINT fk_utp_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_utp_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_utp_tenant_user ON public.user_tenant_personas (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_utp_tenant_persona ON public.user_tenant_personas (tenant_id, persona_type, status);

-- 2.2 Identity Consolidation Ledger (CG-004, TIR-009, F-02, F-07, F-08)
-- Outbox Saga ledger tracking asynchronous credential retirement in Supabase GoTrue.
CREATE TABLE IF NOT EXISTS public.identity_consolidation_ledgers (
    id text PRIMARY KEY,
    operation_id text NOT NULL,
    tenant_id text NOT NULL,
    santri_id text NOT NULL,
    source_student_uid text NOT NULL,
    target_wali_uid text NOT NULL,
    target_email_hash text NOT NULL,
    status text DEFAULT 'DB_COMMITTED_AUTH_PENDING' NOT NULL,
    attempt_count integer DEFAULT 0 NOT NULL,
    last_error text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    completed_at timestamp NULL,
    CONSTRAINT chk_icl_status CHECK (status IN (
        'DB_COMMITTED_AUTH_PENDING',
        'RECONCILIATION_REQUIRED',
        'CONSOLIDATION_COMPLETED',
        'MANUAL_ATTENTION_REQUIRED'
    )),
    CONSTRAINT chk_icl_distinct_users CHECK (source_student_uid <> target_wali_uid), -- F-07
    CONSTRAINT chk_icl_attempts CHECK (attempt_count >= 0),
    CONSTRAINT uq_icl_operation_id UNIQUE (operation_id),
    CONSTRAINT fk_icl_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_icl_source_user FOREIGN KEY (source_student_uid) REFERENCES public.users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_icl_target_user FOREIGN KEY (target_wali_uid) REFERENCES public.users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_icl_santri FOREIGN KEY (tenant_id, santri_id) 
        REFERENCES public.santri(tenant_id, id) ON DELETE RESTRICT -- F-02
);

-- Partial unique index to guarantee single active or unresolved consolidation per santri (F-08)
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_consolidation_santri 
    ON public.identity_consolidation_ledgers (santri_id) 
    WHERE status IN ('DB_COMMITTED_AUTH_PENDING', 'RECONCILIATION_REQUIRED', 'MANUAL_ATTENTION_REQUIRED');

CREATE INDEX IF NOT EXISTS idx_icl_worker_queue 
    ON public.identity_consolidation_ledgers (status, created_at)
    WHERE status IN ('DB_COMMITTED_AUTH_PENDING', 'RECONCILIATION_REQUIRED', 'MANUAL_ATTENTION_REQUIRED');


-- ==============================================================================
-- SECTION 3: PSB (PENERIMAAN SANTRI BARU) DOMAIN TABLES (8 TABLES)
-- ==============================================================================

-- 3.1 PSB Admission Periods (Tenant-wide admission lifecycle)
CREATE TABLE IF NOT EXISTS public.psb_periods (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    academic_year_id text NOT NULL,
    name text NOT NULL,
    wave_count integer DEFAULT 1 NOT NULL,
    status text DEFAULT 'DRAFT' NOT NULL,
    start_date timestamp NOT NULL,
    end_date timestamp NOT NULL,
    quotas jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_psb_periods_wave_count CHECK (wave_count IN (1, 2)),
    CONSTRAINT chk_psb_periods_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'OPEN', 'CLOSED', 'ARCHIVED')),
    CONSTRAINT chk_psb_periods_dates CHECK (end_date > start_date),
    CONSTRAINT uq_psb_periods_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT fk_psb_periods_tenant FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_psb_periods_academic_year 
        FOREIGN KEY (tenant_id, academic_year_id) 
        REFERENCES public.academic_years(tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_psb_periods_tenant_status ON public.psb_periods (tenant_id, status);

-- 3.2 PSB Waves (Sub-cycles within a Period, strictly 1 or 2 waves)
CREATE TABLE IF NOT EXISTS public.psb_waves (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    psb_period_id text NOT NULL,
    wave_number integer NOT NULL,
    name text NOT NULL,
    start_date timestamp NOT NULL,
    end_date timestamp NOT NULL,
    infaq_amount integer DEFAULT 0 NOT NULL,
    status text DEFAULT 'UPCOMING' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_psb_waves_number CHECK (wave_number IN (1, 2)),
    CONSTRAINT chk_psb_waves_status CHECK (status IN ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_psb_waves_dates CHECK (end_date > start_date),
    CONSTRAINT uq_psb_waves_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_psb_waves_period_number UNIQUE (tenant_id, psb_period_id, wave_number),
    CONSTRAINT fk_psb_waves_period 
        FOREIGN KEY (tenant_id, psb_period_id) 
        REFERENCES public.psb_periods(tenant_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_psb_waves_lookup ON public.psb_waves (tenant_id, psb_period_id, status);

-- 3.3 PSB Admission Committee
CREATE TABLE IF NOT EXISTS public.psb_committees (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    psb_period_id text NOT NULL,
    user_id text NOT NULL,
    role text NOT NULL, -- 'KETUA', 'BENDAHARA', 'PENGUJI', 'VERIFIKATOR'
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT uq_psb_committees_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_psb_committees_user UNIQUE (tenant_id, psb_period_id, user_id),
    CONSTRAINT fk_psb_committees_period 
        FOREIGN KEY (tenant_id, psb_period_id) 
        REFERENCES public.psb_periods(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_psb_committees_user 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE
);

-- 3.4 PSB Applicants (Prospective Students)
CREATE TABLE IF NOT EXISTS public.psb_applicants (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    psb_period_id text NOT NULL,
    wave_id text NOT NULL,
    registration_number text NOT NULL,
    applicant_name text NOT NULL,
    gender text NOT NULL,
    birth_date text NOT NULL,
    parent_name text NOT NULL,
    parent_phone text NOT NULL,
    target_madrasahs jsonb DEFAULT '[]'::jsonb NOT NULL, -- Internal Panitia intake assessment / target units
    status text DEFAULT 'REGISTERED' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_psb_applicants_gender CHECK (gender IN ('L', 'P')),
    CONSTRAINT chk_psb_applicants_status CHECK (status IN (
        'REGISTERED', 'TESTING', 'SELECTION', 'ACCEPTED', 'REJECTED', 'MATRICULATED', 'CANCELLED'
    )),
    CONSTRAINT uq_psb_applicants_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_psb_applicants_reg_num UNIQUE (tenant_id, registration_number),
    CONSTRAINT uq_psb_applicants_tenant_period UNIQUE (tenant_id, psb_period_id, id), -- Required for placement period validation
    CONSTRAINT fk_psb_applicants_period 
        FOREIGN KEY (tenant_id, psb_period_id) 
        REFERENCES public.psb_periods(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_psb_applicants_wave 
        FOREIGN KEY (tenant_id, wave_id) 
        REFERENCES public.psb_waves(tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_psb_applicants_lookup ON public.psb_applicants (tenant_id, psb_period_id, status);

-- 3.5 PSB Test Scores (Restored Table — F-01)
CREATE TABLE IF NOT EXISTS public.psb_test_scores (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    applicant_id text NOT NULL,
    test_type text NOT NULL, -- 'BACA_QURAN', 'HIFZH', 'AKADEMIK', 'WAWANCARA'
    score numeric(5, 2) NOT NULL,
    notes text,
    tested_by_user_id text,
    created_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_pts_score CHECK (score >= 0 AND score <= 100),
    CONSTRAINT uq_psb_test_scores_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_psb_test_applicant_type UNIQUE (tenant_id, applicant_id, test_type),
    CONSTRAINT fk_psb_test_applicant 
        FOREIGN KEY (tenant_id, applicant_id) 
        REFERENCES public.psb_applicants(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_psb_test_user 
        FOREIGN KEY (tested_by_user_id) 
        REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_psb_test_applicant ON public.psb_test_scores (tenant_id, applicant_id);

-- 3.6 PSB Infaq Verifications
CREATE TABLE IF NOT EXISTS public.psb_infaq_verifications (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    applicant_id text NOT NULL,
    amount integer NOT NULL,
    proof_url text,
    status text DEFAULT 'PENDING' NOT NULL,
    verified_by_user_id text,
    verified_at timestamp NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_piv_status CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    CONSTRAINT chk_piv_amount CHECK (amount >= 0),
    CONSTRAINT uq_psb_infaq_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_psb_infaq_applicant UNIQUE (tenant_id, applicant_id),
    CONSTRAINT fk_psb_infaq_applicant 
        FOREIGN KEY (tenant_id, applicant_id) 
        REFERENCES public.psb_applicants(tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_psb_infaq_user 
        FOREIGN KEY (verified_by_user_id) 
        REFERENCES public.users(id) ON DELETE SET NULL
);

-- 3.7 PSB Acceptance Ledgers (Exclusive SAT Matriculation Ledger)
-- Database stores audit anchor (sat_user_id); SAT authorization enforced at application layer.
CREATE TABLE IF NOT EXISTS public.psb_acceptance_ledgers (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    applicant_id text NOT NULL,
    sat_user_id text NOT NULL,
    official_nis text NOT NULL,
    acceptance_status text DEFAULT 'DITERIMA' NOT NULL,
    matriculated_at timestamp DEFAULT now() NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_pal_status CHECK (acceptance_status IN ('DITERIMA', 'DITOLAK', 'CADANGAN')),
    CONSTRAINT uq_psb_acceptance_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_psb_acceptance_applicant UNIQUE (tenant_id, applicant_id),
    CONSTRAINT uq_psb_acceptance_nis UNIQUE (tenant_id, official_nis),
    CONSTRAINT fk_psb_acceptance_applicant 
        FOREIGN KEY (tenant_id, applicant_id) 
        REFERENCES public.psb_applicants(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_psb_acceptance_sat_user 
        FOREIGN KEY (sat_user_id) 
        REFERENCES public.users(id) ON DELETE RESTRICT
);

-- 3.8 PSB Placement Distributions (Bridges PSB to Level-4 Academic Structure, F-02 & F-06)
CREATE TABLE IF NOT EXISTS public.psb_placement_distributions (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    psb_period_id text NOT NULL,
    applicant_id text NOT NULL,
    santri_id text NOT NULL,
    madrasah_id text NOT NULL,
    jenjang_id text NOT NULL,
    tingkat_id text NOT NULL,
    rombel_id text NOT NULL,
    status text DEFAULT 'PENDING' NOT NULL,
    confirmed_by_user_id text,
    confirmed_at timestamp NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_ppd_status CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED')),
    CONSTRAINT uq_psb_dist_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_psb_dist_placement UNIQUE (tenant_id, psb_period_id, applicant_id, madrasah_id),
    CONSTRAINT fk_psb_dist_period 
        FOREIGN KEY (tenant_id, psb_period_id) 
        REFERENCES public.psb_periods(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_psb_dist_applicant 
        FOREIGN KEY (tenant_id, psb_period_id, applicant_id) 
        REFERENCES public.psb_applicants(tenant_id, psb_period_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_psb_dist_santri 
        FOREIGN KEY (tenant_id, santri_id) 
        REFERENCES public.santri(tenant_id, id) ON DELETE RESTRICT, -- F-02
    CONSTRAINT fk_psb_dist_madrasah 
        FOREIGN KEY (tenant_id, madrasah_id) 
        REFERENCES public.madrasah(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_psb_dist_jenjang 
        FOREIGN KEY (tenant_id, madrasah_id, jenjang_id) 
        REFERENCES public.jenjang(tenant_id, madrasah_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_psb_dist_tingkat 
        FOREIGN KEY (tenant_id, tingkat_id) 
        REFERENCES public.tingkat(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_psb_dist_rombel 
        FOREIGN KEY (tenant_id, rombel_id) 
        REFERENCES public.rombel(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_psb_dist_confirmed_user 
        FOREIGN KEY (confirmed_by_user_id) 
        REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_psb_dist_lookup 
    ON public.psb_placement_distributions (tenant_id, madrasah_id, rombel_id);


-- ==============================================================================
-- SECTION 4: ALUMNI ECOSYSTEM DOMAIN TABLES (8 TABLES)
-- ==============================================================================

-- 4.1 Alumni Exit Reasons Catalog
CREATE TABLE IF NOT EXISTS public.alumni_exit_reasons (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    code text NOT NULL,
    label text NOT NULL,
    is_final_exit boolean DEFAULT true NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT uq_alumni_exit_reasons_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_alumni_exit_reasons_code UNIQUE (tenant_id, code),
    CONSTRAINT fk_alumni_exit_reasons_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- 4.2 Alumni Academic Snapshots (Immutable per-Madrasah graduation transcripts, F-02)
CREATE TABLE IF NOT EXISTS public.alumni_academic_snapshots (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    santri_id text NOT NULL,
    user_id text NOT NULL,
    madrasah_id text NOT NULL,
    last_jenjang_id text NOT NULL,
    last_tingkat_id text NOT NULL,
    exit_reason_id text NOT NULL,
    is_final_alumni_snapshot boolean DEFAULT false NOT NULL,
    transcript_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    graduation_date text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT uq_alumni_snapshots_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_alumni_snapshots_record UNIQUE (tenant_id, santri_id, madrasah_id),
    CONSTRAINT fk_alumni_snap_user 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_alumni_snap_santri 
        FOREIGN KEY (tenant_id, santri_id) 
        REFERENCES public.santri(tenant_id, id) ON DELETE RESTRICT, -- F-02
    CONSTRAINT fk_alumni_snap_madrasah 
        FOREIGN KEY (tenant_id, madrasah_id) 
        REFERENCES public.madrasah(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_alumni_snap_jenjang 
        FOREIGN KEY (tenant_id, madrasah_id, last_jenjang_id) 
        REFERENCES public.jenjang(tenant_id, madrasah_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_alumni_snap_tingkat 
        FOREIGN KEY (tenant_id, last_tingkat_id) 
        REFERENCES public.tingkat(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_alumni_snap_exit_reason 
        FOREIGN KEY (tenant_id, exit_reason_id) 
        REFERENCES public.alumni_exit_reasons(tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_alumni_snap_lookup 
    ON public.alumni_academic_snapshots (tenant_id, user_id, is_final_alumni_snapshot);

-- 4.3 Alumni Regional Chapters (Korwil)
CREATE TABLE IF NOT EXISTS public.alumni_korwils (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    province text NOT NULL,
    regencies jsonb NOT NULL, -- Array of regency names under chapter jurisdiction
    status text DEFAULT 'ACTIVE' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_korwil_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT uq_alumni_korwils_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_alumni_korwils_code UNIQUE (tenant_id, code),
    CONSTRAINT fk_alumni_korwils_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES public.tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alumni_korwils_tenant_status 
    ON public.alumni_korwils (tenant_id, status);

-- 4.4 Tenant Korwil Administrative Settings
CREATE TABLE IF NOT EXISTS public.tenant_korwil_settings (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    auto_transfer_enabled boolean DEFAULT true NOT NULL,
    require_admin_approval boolean DEFAULT false NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT uq_tenant_korwil_settings_tenant_id UNIQUE (tenant_id),
    CONSTRAINT fk_tenant_korwil_settings_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES public.tenants(id) ON DELETE CASCADE
);

-- 4.5 Alumni Directory Profiles
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    user_id text NOT NULL,
    korwil_id text NOT NULL,
    current_activity text, -- 'KULIAH', 'KERJA', 'WIRAUSAHA', 'PENGABDIAN'
    profession text,
    workplace text,
    domicile_province text NOT NULL,
    domicile_regency text NOT NULL,
    domicile_address text, -- INTERNAL PROFILE DATA — RESTRICTED TO OWNER & TENANT ADMIN
    bio text,
    is_public boolean DEFAULT true NOT NULL,
    hide_profile boolean DEFAULT false NOT NULL,
    phone text,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT uq_alumni_profiles_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_alumni_profiles_user UNIQUE (tenant_id, user_id),
    CONSTRAINT fk_alumni_profiles_user 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_alumni_profiles_korwil 
        FOREIGN KEY (tenant_id, korwil_id) 
        REFERENCES public.alumni_korwils(tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_alumni_profiles_directory 
    ON public.alumni_profiles (tenant_id, korwil_id, is_public, hide_profile);

-- 4.6 User Ephemeral Discovery Locations (Transient Presence Cache)
CREATE TABLE IF NOT EXISTS public.user_discovery_locations (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    user_id text NOT NULL,
    origin_korwil_id text NOT NULL,
    current_korwil_id text NOT NULL,
    lat_coarse numeric(8, 4) NOT NULL,
    lng_coarse numeric(8, 4) NOT NULL,
    is_dhoif boolean DEFAULT false NOT NULL,
    expires_at timestamp NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT uq_discovery_locations_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT uq_discovery_locations_user UNIQUE (tenant_id, user_id),
    CONSTRAINT fk_discovery_user 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_discovery_origin_korwil 
        FOREIGN KEY (tenant_id, origin_korwil_id) 
        REFERENCES public.alumni_korwils(tenant_id, id) ON DELETE RESTRICT,
    CONSTRAINT fk_discovery_current_korwil 
        FOREIGN KEY (tenant_id, current_korwil_id) 
        REFERENCES public.alumni_korwils(tenant_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_discovery_expiry 
    ON public.user_discovery_locations (expires_at);
CREATE INDEX IF NOT EXISTS idx_discovery_spatial 
    ON public.user_discovery_locations (tenant_id, current_korwil_id, is_dhoif);

-- 4.7 Ephemeral Salam Interactions (Peer Greeting Cooldown Ledger, F-04)
CREATE TABLE IF NOT EXISTS public.salam_interactions (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    sender_user_id text NOT NULL,
    recipient_user_id text NOT NULL,
    status text DEFAULT 'DELIVERED' NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    expires_at timestamp NOT NULL,
    CONSTRAINT chk_salam_peers CHECK (sender_user_id <> recipient_user_id),
    CONSTRAINT chk_salam_status CHECK (status IN ('DELIVERED', 'READ', 'EXPIRED')),
    CONSTRAINT fk_salam_tenant 
        FOREIGN KEY (tenant_id) 
        REFERENCES public.tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_salam_sender 
        FOREIGN KEY (sender_user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_salam_recipient 
        FOREIGN KEY (recipient_user_id) 
        REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_salam_cooldown 
    ON public.salam_interactions (tenant_id, sender_user_id, recipient_user_id, expires_at);

-- 4.8 Alumni Endowment Donations
CREATE TABLE IF NOT EXISTS public.alumni_donations (
    id text PRIMARY KEY,
    tenant_id text NOT NULL,
    donor_user_id text,
    donor_origin_korwil_id text,
    campaign_id text NOT NULL,
    amount integer NOT NULL,
    status text DEFAULT 'PENDING' NOT NULL,
    is_anonymous boolean DEFAULT false NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chk_alumni_donations_status CHECK (status IN ('PENDING', 'PAID', 'EXPIRED', 'FAILED')),
    CONSTRAINT chk_alumni_donations_amount CHECK (amount > 0),
    CONSTRAINT uq_alumni_donations_tenant_id UNIQUE (tenant_id, id),
    CONSTRAINT fk_donations_donor 
        FOREIGN KEY (donor_user_id) 
        REFERENCES public.users(id) ON DELETE SET NULL,
    CONSTRAINT fk_alumni_donations_korwil 
        FOREIGN KEY (tenant_id, donor_origin_korwil_id) 
        REFERENCES public.alumni_korwils(tenant_id, id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_alumni_donations_campaign 
    ON public.alumni_donations (tenant_id, campaign_id, status);


-- ==============================================================================
-- SECTION 5: DATABASE ENGINE PROCEDURAL TRIGGERS
-- ==============================================================================

-- 5.1 Placement Hierarchy Integrity Trigger (CG-008, TIR-001, TIR-007, TIR-008, F-06)
CREATE OR REPLACE FUNCTION public.fn_enforce_placement_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    v_tingkat_madrasah text;
    v_tingkat_jenjang text;
    v_rombel_tingkat text;
    v_rombel_year text;
    v_period_year text;
    v_santri_tenant text;
    v_applicant_period text;
BEGIN
    -- 1. Check Tingkat -> Madrasah and Jenjang integrity
    SELECT madrasah_id, jenjang_id INTO v_tingkat_madrasah, v_tingkat_jenjang
    FROM public.tingkat 
    WHERE tenant_id = NEW.tenant_id AND id = NEW.tingkat_id;

    IF (v_tingkat_madrasah IS NULL OR v_tingkat_madrasah <> NEW.madrasah_id OR v_tingkat_jenjang <> NEW.jenjang_id) THEN
        RAISE EXCEPTION 'PLACEMENT_HIERARCHY_VIOLATION: Tingkat % does not belong to Madrasah % and Jenjang %',
            NEW.tingkat_id, NEW.madrasah_id, NEW.jenjang_id;
    END IF;

    -- 2. Check Rombel -> Tingkat integrity
    SELECT tingkat_id, academic_year_id INTO v_rombel_tingkat, v_rombel_year
    FROM public.rombel 
    WHERE tenant_id = NEW.tenant_id AND id = NEW.rombel_id;

    IF (v_rombel_tingkat IS NULL OR v_rombel_tingkat <> NEW.tingkat_id) THEN
        RAISE EXCEPTION 'PLACEMENT_HIERARCHY_VIOLATION: Rombel % does not belong to Tingkat %',
            NEW.rombel_id, NEW.tingkat_id;
    END IF;

    -- 3. Check Academic Year Alignment between Rombel and PSB Period (TIR-007)
    SELECT academic_year_id INTO v_period_year
    FROM public.psb_periods 
    WHERE tenant_id = NEW.tenant_id AND id = NEW.psb_period_id;

    IF (v_rombel_year <> v_period_year) THEN
        RAISE EXCEPTION 'PLACEMENT_YEAR_MISMATCH: Rombel Academic Year % does not match PSB Period Academic Year %',
            v_rombel_year, v_period_year;
    END IF;

    -- 4. Check Santri Tenant Isolation (TIR-008)
    SELECT tenant_id INTO v_santri_tenant
    FROM public.santri 
    WHERE id = NEW.santri_id;

    IF (v_santri_tenant IS NULL OR v_santri_tenant <> NEW.tenant_id) THEN
        RAISE EXCEPTION 'PLACEMENT_CROSS_TENANT_PROHIBITED: Santri % belongs to Tenant %, but placement is in Tenant %',
            NEW.santri_id, v_santri_tenant, NEW.tenant_id;
    END IF;

    -- 5. Check Applicant -> PSB Period Integrity (F-06)
    SELECT psb_period_id INTO v_applicant_period 
    FROM public.psb_applicants 
    WHERE tenant_id = NEW.tenant_id AND id = NEW.applicant_id;

    IF (v_applicant_period IS NULL OR v_applicant_period <> NEW.psb_period_id) THEN
        RAISE EXCEPTION 'PLACEMENT_PERIOD_MISMATCH: Applicant % belongs to Period %, but placement is under Period %',
            NEW.applicant_id, v_applicant_period, NEW.psb_period_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_placement_hierarchy ON public.psb_placement_distributions;
CREATE TRIGGER trg_enforce_placement_hierarchy
    BEFORE INSERT OR UPDATE ON public.psb_placement_distributions
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_enforce_placement_hierarchy();

-- 5.2 Legacy Kelas Backward-Compatibility Sync Trigger (CG-007 & NBO-001)
-- Synchronizes santri.kelas = rombel.name when placement is confirmed (Last-Write-Wins projection)
CREATE OR REPLACE FUNCTION public.fn_sync_santri_kelas_from_rombel()
RETURNS TRIGGER AS $$
DECLARE
    v_rombel_name text;
BEGIN
    IF (NEW.status = 'CONFIRMED' AND (OLD.status IS NULL OR OLD.status <> 'CONFIRMED')) THEN
        SELECT name INTO v_rombel_name 
        FROM public.rombel 
        WHERE tenant_id = NEW.tenant_id AND id = NEW.rombel_id;

        IF (v_rombel_name IS NOT NULL) THEN
            UPDATE public.santri 
            SET kelas = v_rombel_name, updated_at = now() 
            WHERE id = NEW.santri_id AND tenant_id = NEW.tenant_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_santri_kelas_from_rombel ON public.psb_placement_distributions;
CREATE TRIGGER trg_sync_santri_kelas_from_rombel
    AFTER INSERT OR UPDATE ON public.psb_placement_distributions
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_sync_santri_kelas_from_rombel();


-- ==============================================================================
-- SECTION 6: POSTGRESQL ROW-LEVEL SECURITY (RLS) POLICIES (ALL 18 TABLES)
-- ==============================================================================

-- 6.0 Enable RLS across all 18 new tables (F-01, F-03)
ALTER TABLE public.user_tenant_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_consolidation_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psb_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psb_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psb_committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psb_applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psb_test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psb_infaq_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psb_acceptance_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psb_placement_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_exit_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_academic_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_korwils ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_korwil_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_discovery_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salam_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_donations ENABLE ROW LEVEL SECURITY;

-- 6.1 Core Identity & Multi-Persona Policies (F-05 & F-09-B Idempotent Registration)
DROP POLICY IF EXISTS "utp_tenant_isolation" ON public.user_tenant_personas;
CREATE POLICY "utp_tenant_isolation" ON public.user_tenant_personas
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

-- 6.2 Sealed Server-Only Outbox Ledger (Client access completely denied)
DROP POLICY IF EXISTS "icl_server_only" ON public.identity_consolidation_ledgers;
CREATE POLICY "icl_server_only" ON public.identity_consolidation_ledgers
    FOR ALL USING (false) WITH CHECK (false);

-- 6.3 PSB Domain Policies (8 Tables, F-03, F-05 & F-09-B)
DROP POLICY IF EXISTS "psb_periods_isolation" ON public.psb_periods;
CREATE POLICY "psb_periods_isolation" ON public.psb_periods
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

DROP POLICY IF EXISTS "psb_waves_isolation" ON public.psb_waves;
CREATE POLICY "psb_waves_isolation" ON public.psb_waves
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

DROP POLICY IF EXISTS "psb_committees_isolation" ON public.psb_committees;
CREATE POLICY "psb_committees_isolation" ON public.psb_committees
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

DROP POLICY IF EXISTS "psb_applicants_isolation" ON public.psb_applicants;
CREATE POLICY "psb_applicants_isolation" ON public.psb_applicants
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

DROP POLICY IF EXISTS "psb_test_scores_isolation" ON public.psb_test_scores;
CREATE POLICY "psb_test_scores_isolation" ON public.psb_test_scores
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

DROP POLICY IF EXISTS "psb_infaq_isolation" ON public.psb_infaq_verifications;
CREATE POLICY "psb_infaq_isolation" ON public.psb_infaq_verifications
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

DROP POLICY IF EXISTS "psb_acceptance_isolation" ON public.psb_acceptance_ledgers;
CREATE POLICY "psb_acceptance_isolation" ON public.psb_acceptance_ledgers
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

DROP POLICY IF EXISTS "psb_placement_isolation" ON public.psb_placement_distributions;
CREATE POLICY "psb_placement_isolation" ON public.psb_placement_distributions
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

-- 6.4 Alumni Domain Policies (8 Tables, F-03, F-04, F-05 & F-09-B)
DROP POLICY IF EXISTS "alumni_exit_reasons_isolation" ON public.alumni_exit_reasons;
CREATE POLICY "alumni_exit_reasons_isolation" ON public.alumni_exit_reasons
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

DROP POLICY IF EXISTS "alumni_snapshots_isolation" ON public.alumni_academic_snapshots;
CREATE POLICY "alumni_snapshots_isolation" ON public.alumni_academic_snapshots
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

DROP POLICY IF EXISTS "alumni_korwils_isolation" ON public.alumni_korwils;
CREATE POLICY "alumni_korwils_isolation" ON public.alumni_korwils
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

DROP POLICY IF EXISTS "tenant_korwil_settings_isolation" ON public.tenant_korwil_settings;
CREATE POLICY "tenant_korwil_settings_isolation" ON public.tenant_korwil_settings
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

-- Alumni Profiles: Public within tenant if is_public = true, full edit strictly owned by user
DROP POLICY IF EXISTS "alumni_profiles_read" ON public.alumni_profiles;
CREATE POLICY "alumni_profiles_read" ON public.alumni_profiles
    FOR SELECT USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR (
            (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = (auth.jwt() ->> 'tenant_id'))
            AND (
                (is_public = true AND hide_profile = false)
                OR user_id = auth.uid()::text
            )
        )
    );

DROP POLICY IF EXISTS "alumni_profiles_write" ON public.alumni_profiles;
CREATE POLICY "alumni_profiles_write" ON public.alumni_profiles
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR (
            (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = (auth.jwt() ->> 'tenant_id'))
            AND user_id = auth.uid()::text
        )
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR (
            (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = (auth.jwt() ->> 'tenant_id'))
            AND user_id = auth.uid()::text
        )
    );

-- Discovery Locations: Active unexpired coordinates readable in tenant, write strictly owned by user
DROP POLICY IF EXISTS "discovery_locations_read" ON public.user_discovery_locations;
CREATE POLICY "discovery_locations_read" ON public.user_discovery_locations
    FOR SELECT USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR (
            (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = (auth.jwt() ->> 'tenant_id'))
            AND expires_at > now()
        )
    );

DROP POLICY IF EXISTS "discovery_locations_write" ON public.user_discovery_locations;
CREATE POLICY "discovery_locations_write" ON public.user_discovery_locations
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR (
            (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = (auth.jwt() ->> 'tenant_id'))
            AND user_id = auth.uid()::text
        )
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR (
            (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = (auth.jwt() ->> 'tenant_id'))
            AND user_id = auth.uid()::text
        )
    );

-- Salam Interactions: Strictly restricted to sender and recipient (F-04)
DROP POLICY IF EXISTS "salam_interactions_participant" ON public.salam_interactions;
CREATE POLICY "salam_interactions_participant" ON public.salam_interactions
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR (
            (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = (auth.jwt() ->> 'tenant_id'))
            AND (sender_user_id = auth.uid()::text OR recipient_user_id = auth.uid()::text)
        )
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR (
            (tenant_id = current_setting('app.current_tenant_id', true) OR tenant_id = (auth.jwt() ->> 'tenant_id'))
            AND sender_user_id = auth.uid()::text
        )
    );

DROP POLICY IF EXISTS "alumni_donations_isolation" ON public.alumni_donations;
CREATE POLICY "alumni_donations_isolation" ON public.alumni_donations
    FOR ALL USING (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    )
    WITH CHECK (
        current_setting('app.is_super_admin', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id', true)
        OR tenant_id = (auth.jwt() ->> 'tenant_id')
    );

COMMIT;
-- ==============================================================================
-- END OF DRAFT DDL SPECIFICATION (GATE 8B REMEDIATION CYCLE 8)
-- STATUS: DRAFT — NOT AUTHORIZED FOR EXECUTION
-- ==============================================================================
