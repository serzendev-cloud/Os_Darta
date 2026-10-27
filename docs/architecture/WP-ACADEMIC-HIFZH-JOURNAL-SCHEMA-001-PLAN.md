# WP-ACADEMIC-HIFZH-JOURNAL-SCHEMA-001
# ACADEMIC HIFZH JOURNAL SCHEMA DESIGN & IMPLEMENTATION PLAN
## Database Schema, Drizzle ORM Specification, and Architectural Blueprint for Jurnal Hafalan Al-Qur'an

**Document Identifier**: `WP-ACADEMIC-HIFZH-JOURNAL-SCHEMA-001-PLAN`  
**Work Package ID**: `WP-ACADEMIC-HIFZH-JOURNAL-SCHEMA-001`  
**Phase**: FORENSIC → SCHEMA DESIGN → INTEGRATION PLAN → VALIDATION → STOP  
**Author**: Senior PostgreSQL Database Architect / Academic Domain Architect / Quran & Hifzh Domain Architect / Multi-Tenant SaaS Architect  
**Classification**: ARCHITECTURE SPECIFICATION & IMPLEMENTATION BLUEPRINT (READ-ONLY)  
**Date**: 2026-09-14  
**Target Initial Scale**: ±10 Pesantren / Tenants (Engineered for 50–100 tenants on Single PostgreSQL Instance)  
**Status**: DESIGN COMPLETE — AWAITING PRODUCT OWNER AUTHORIZATION (NO MUTATIONS PERFORMED)  

---

## 1. Objective

The objective of this Work Package is to produce the authoritative, production-grade database schema design, Drizzle ORM model specification, integrity constraints, indexing strategy, audit bindings, and complete implementation plan for the **Jurnal Hafalan Al-Qur'an (Academic Hifzh Journal)** in MA'HAD MANAGER.

This schema serves as the primary system of record for Asatidz (Teachers/Musyrif) to log daily student recitation sessions (*penyimakan hafalan*) under the formal academic subject **Mata Pelajaran Hafalan Al-Qur'an / Tahfidz**.

---

## 2. Locked Product Decisions

The following architectural and domain decisions have been **EXPLICITLY LOCKED** by the Product Owner and govern this entire specification:

| # | Domain Dimension | Locked Rule | Architectural Implication |
| :- | :--- | :--- | :--- |
| **2.1** | **Journal Purpose** | **Pencatatan + Penyimakan**. The journal records observed recitation submissions by teachers. It is **NOT** a personal hifzh self-study planner or target scheduler. | Single event log model. No algorithmic progression cursors or auto-generated calendars. |
| **2.2** | **Activity Types** | Strictly two primary activity types: **`ZIYADAH`** (Hafalan Baru) and **`MURAJAAH`** (Pengulangan Hafalan). | Enforced via database `CHECK` constraint. No generic "other" or mixed activity values. |
| **2.3** | **Simakan Result** | Qualitative recitation result is strictly: **`LANCAR`**, **`CUKUP`**, or **`PERLU_MENGULANG`**.<br>Separately, **`error_count`** must be recorded as an integer $\ge 0$. | Result rating and error count are two distinct columns. Negative counts strictly forbidden. |
| **2.4** | **Academic Predicate** | Formal predicates (**`MUMTAZ`**, **`JAYYID_JIDDAN`**, **`JAYYID`**, **`MAQBUL`**, **`RASIB`**) are **NOT** part of daily journal entries. They belong solely to formal Assessment / Rapor. | Excluded from `hifzh_journal_entries`. Daily logs remain lightweight and operational. |
| **2.5** | **No Mastery Engine** | The journal does **NOT** automatically certify mastery (*mutqin*). It merely logs the historical recitation event. | No `is_mastered` or auto-progression flags written to student profiles. |
| **2.6** | **Quran Content** | Zero duplication of Quran text, translations, tafsir, audio recordings, or page images in journal tables. | Strictly stores canonical references: Surah number, Ayah range, Juz, and Madinah Page. |
| **2.7** | **Personal Hifzh** | Personal Hifzh is a completely separate module for future student self-directed study. | Zero personal target, routine, streak, or reminder entities in this academic schema. |
| **2.8** | **Academic Ledger** | Daily journal entries do **NOT** automatically generate rows in `academic_ledger_records`. | Ledger entries are reserved for formal exam rollups (Munaqosyah, Ujian Tahfidz). |

---

## 3. Scope

### In-Scope (Forensically Designed & Specified)
1. **Core Normalized Table**: `public.hifzh_journal_entries`.
2. **Activity Model**: Strict dichotomy between `ZIYADAH` and `MURAJAAH`.
3. **Canonical Quran Referencing**: Surah (1–114), Ayah range ($\ge 1$, $\text{end} \ge \text{start}$), Juz (1–30), Madinah Mushaf Page (1–604).
4. **Assessment Capture**: Discrete enum check for `result` and non-negative integer for `error_count`.
5. **Teacher Note**: Free-text pedagogical feedback field for Asatidz.
6. **Academic Context Binding**: Foreign keys to `tenants`, `santri`, `guru`, `mapel`, `kelas`, `academic_years`, and `academic_terms`.
7. **Multi-Tenant Isolation**: Server-derived `tenant_id` on all operations; row-level security policy blueprint.
8. **Integrity & Duplicate Prevention**: Idempotency key pattern, composite indexing, and non-blocking duplicate detection.
9. **Lifecycle & Correction**: State management (`RECORDED` vs `VOIDED`), audit metadata, and immutable history.
10. **Drizzle ORM Definition**: Complete TypeScript schema definition file ready for implementation.
11. **Migration & API Blueprint**: Step-by-step phased execution plan without code mutation in this WP.

---

## 4. Out of Scope

The following capabilities are **STRICTLY EXCLUDED** from this schema design:

```
❌ Personal Hifzh Module               ❌ Loose / Ad-Hoc Muraja'ah Scheduler
❌ Personal Target Hafalan             ❌ Native Mobile Hifzh Binary (Desktop dropped)
❌ Personal Khatam Program             ❌ AI Voice Recitation Assessment
❌ Personal Daily Push Reminders       ❌ Automatic Acoustic Tajwid Detection
❌ Spaced Repetition Algorithms        ❌ Automatic Memorization Progression Cursors
❌ Structured Muraja'ah Planner        ❌ Gamification, Badges, Streaks & Leaderboards
```

---

## 5. Existing Schema Evidence

Forensic inspection of live PostgreSQL database and existing repository Drizzle schemas establishes the following baseline:

```
========================================================================================
LIVE DATABASE FORENSIC AUDIT (PostgreSQL - Schema 'public')
========================================================================================
Total Tables in Live DB: 32
Tahfidz / Hifzh Tables:  0 (MISSING - None currently exist in live database)
========================================================================================
```

### Forensic Status of Academic & Tenant Entities

| Entity / Table | Live PostgreSQL | Drizzle Repository Schema | Naming Convention | Forensic Status | Evidence / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `tenants` | **EXISTS** (7 cols) | `src/lib/db/schema.ts` | `id`, `name`, `slug`, `status` | **CANONICAL** | Primary multi-tenant partition entity. |
| `santri` | **EXISTS** (24 cols) | `src/lib/db/schema.ts` | `id`, `nis`, `name`, `kelas`, `status` | **CANONICAL** | Enrolled student core entity. |
| `guru` | **EXISTS** (11 cols) | `src/lib/db/schema.ts` | `id`, `name`, `nip`, `ranah_instansi` | **CANONICAL** | Teacher entity (*Penyimak*). |
| `mapel` | **EXISTS** (7 cols) | `src/lib/db/schema.ts` | `id`, `name`, `code`, `jenjang`, `tingkat` | **CANONICAL** | Academic subject entity. |
| `kelas` | **EXISTS** (10 cols) | `src/lib/db/schema.ts` | `id`, `name`, `jenjang`, `tingkat`, `academic_tab` | **CANONICAL** | Halaqah class entity. |
| `teacher_assignments`| **EXISTS** (7 cols) | `src/lib/db/schema.ts` | `id`, `mapel_id`, `kelas_id`, `guru_name` | **CANONICAL** | Teaching assignment junction. |
| `academic_years` | **PENDING** | `src/lib/db/schema/academic_workspace.ts` | `id`, `tenant_id`, `name`, `status` | **DESIGNED** | Pending migration to live DB. |
| `academic_terms` | **PENDING** | `src/lib/db/schema/academic_workspace.ts` | `id`, `academic_year_id`, `name`, `is_current` | **DESIGNED** | Pending migration to live DB. |
| `academic_ledger_records`| **PENDING**| `src/lib/db/schema/academic_ledger.ts` | `id`, `santri_id`, `source_group`, `raw_score` | **DESIGNED** | Formal gradebook ledger. |
| `academic_transcripts` | **PENDING** | `src/lib/db/schema/academic_ledger.ts` | `id`, `santri_id`, `predicate` ('Mumtaz'...) | **DESIGNED** | Report card transcript. |
| `audit_logs` | **EXISTS** (10 cols) | `src/lib/db/schema.ts` | `id`, `action`, `user`, `target_entity`, `tenant_id`| **CANONICAL** | System audit trail table. |
| `users` | **EXISTS** (11 cols) | `src/lib/db/schema/identity.ts` | `id`, `name`, `email`, `phone`, `status` | **CANONICAL** | Platform user identity. |
| `tenant_roles` | **EXISTS** (8 cols) | `src/lib/db/schema/identity.ts` | `id`, `tenant_id`, `role_code` ('GURU', etc.) | **CANONICAL** | Tenant RBAC role definition. |
| `hifzh_journal_entries`| **NOT FOUND** | **NOT FOUND** | **TARGET PROPOSED CANDIDATE** | **NEW REQUIRED** | Zero tables in DB. |

---

## 6. Existing Academic Integration

The proposed Hifzh Journal integrates directly into the existing academic domain hierarchy without introducing duplicate or parallel entities:

### ASCII Relationship Diagram

```
Tenant (public.tenants)
  │
  ├── Santri (public.santri)
  ├── Guru (public.guru)
  ├── Mapel (public.mapel)
  ├── Kelas (public.kelas)
  ├── Academic Year (public.academic_years)
  └── Hifzh Journal (public.hifzh_journal_entries)
          │
          ├── [FK] Santri (santri_id)
          ├── [FK] Guru (guru_id)
          ├── [FK] Mapel (mapel_id)
          ├── [FK] Kelas (kelas_id)
          ├── [FK] Academic Year (academic_year_id)
          ├── [FK] Academic Term (academic_term_id)
          └── [Value Object] Quran Canonical Reference (surah_number, ayah_start, ayah_end, juz, page)
```

### Key Architectural Invariants
1. **No Parallel Student Model**: Direct foreign key to `public.santri(id)`. Never create `hifzh_student`.
2. **No Parallel Teacher Model**: Direct foreign key to `public.guru(id)` as the domain recitation listener (*Penyimak*). The system actor is logged via `users(id)` in audit logs.
3. **No Parallel Subject Model**: Direct foreign key to `public.mapel(id)`. Hafalan Al-Qur'an is an academic subject (`mapel`) having `academic_tab = 'quran'`.
4. **Halaqah as Class Context**: A halaqah circle is represented canonically as a `kelas` entity (e.g. `Halaqah Utsman`, `jenjang: 'Tahfidz'`). `kelas_id` is stored in the journal as a snapshot of the student's halaqah group at the time of recitation.

---

## 7. Existing Quran Integration

Forensic analysis of the codebase reveals that Quran structures are currently referenced in navigation (`/dashboard/setoran-quran`) and curriculum mocks (`src/data/mock-mapel/quran.ts`), which specify:
- Tingkat 16 (Tahfidz Tahun 1): `THZ-30` (Tahfidz Juz 30), `ZYD-PML` (Setoran Ziyadah Harian), `MRJ-BND` (Murojaah Binnadhar).
- Tingkat 17 (Tahfidz Tahun 2): `THZ-15` (Tahfidz Juz 1-5), `MRJ-KBR` (Murajaah Kubro), `UJN-KTM` (Ujian Khotmil).

### Canonical Quran Reference Specification (MBD-036)
To reference holy text accurately without duplication, the journal stores canonical Madinah Mushaf coordinates:
- `surah_number`: Integer 1 to 114 (e.g., 78 for An-Naba', 2 for Al-Baqarah).
- `surah_name`: Standard transliterated name (e.g., "An-Naba'", "Al-Baqarah") for display resilience without secondary joins.
- `ayah_start`: Integer $\ge 1$ (starting verse).
- `ayah_end`: Integer $\ge \text{ayah\_start}$ (ending verse).
- `juz`: Integer 1 to 30 (canonical Juz boundary).
- `page_start`: Integer 1 to 604 (standard King Fahd Complex 15-line Madinah Mushaf page).
- `page_end`: Integer $\ge \text{page\_start}$ and $\le 604$.

---

## 8. Proposed Domain Model

```
[Hifzh Journal Aggregate Model]

+------------------------------------------------------------------------------+
|                         hifzh_journal_entries                                |
+------------------------------------------------------------------------------+
| * id: text (PK, UUID/Prefixed)                                               |
| * tenant_id: text (FK -> tenants.id, Scoped Partition)                       |
| * santri_id: text (FK -> santri.id, Enrolled Student)                        |
| * guru_id: text (FK -> guru.id, Musyrif / Teacher Listener)                  |
| * mapel_id: text (FK -> mapel.id, Quran Academic Subject)                    |
| o kelas_id: text (FK -> kelas.id, Halaqah Group Context)                     |
| o academic_year_id: text (Academic Year Context)                             |
| o academic_term_id: text (Academic Term / Semester Context)                  |
| * entry_date: date (Calendar Date of Recitation)                             |
| * activity_type: text ('ZIYADAH' | 'MURAJAAH')                              |
| * surah_number: integer (1..114)                                             |
| * surah_name: text (Transliterated Surah Name)                               |
| * ayah_start: integer (>= 1)                                                 |
| * ayah_end: integer (>= ayah_start)                                          |
| o juz: integer (1..30)                                                       |
| o page_start: integer (1..604)                                               |
| o page_end: integer (>= page_start <= 604)                                   |
| * result: text ('LANCAR' | 'CUKUP' | 'PERLU_MENGULANG')                      |
| * error_count: integer (DEFAULT 0, >= 0)                                     |
| o teacher_note: text (Pedagogical Guidance)                                  |
| * status: text (DEFAULT 'RECORDED', 'RECORDED' | 'VOIDED')                   |
| o voided_at: timestamp without time zone                                     |
| o voided_by: text (User ID of Voiding Actor)                                 |
| o void_reason: text                                                          |
| o idempotency_key: text (Client-Generated UUID)                              |
| * created_at: timestamp without time zone (DEFAULT now())                    |
| * updated_at: timestamp without time zone (DEFAULT now())                    |
+------------------------------------------------------------------------------+
```

---

## 9. Proposed Table & Entity Specification

### Authoritative Entity Specification
- **Entity**: `hifzh_journal_entries`
- **Purpose**: System of record for daily student Quran recitation sessions (*penyimakan hafalan*) under formal halaqah supervision.
- **Ownership**: Tenant-Owned Academic Record
- **Tenant Scoped**: Yes (`tenant_id NOT NULL`)
- **Primary Key**: `id` (`text`)
- **Foreign Keys**:
  - `tenant_id` $\rightarrow$ `tenants.id` (ON DELETE CASCADE)
  - `santri_id` $\rightarrow$ `santri.id` (ON DELETE RESTRICT)
  - `guru_id` $\rightarrow$ `guru.id` (ON DELETE RESTRICT)
  - `mapel_id` $\rightarrow$ `mapel.id` (ON DELETE RESTRICT)
  - `kelas_id` $\rightarrow$ `kelas.id` (ON DELETE SET NULL)
- **Columns**: 27 defined columns (see Section 10).
- **Nullability**: Core domain attributes are `NOT NULL`; optional context attributes (`kelas_id`, `juz`, `page_range`, `teacher_note`, `void_metadata`) are `NULL`.
- **Default Values**:
  - `error_count`: `0`
  - `status`: `'RECORDED'`
  - `created_at`: `now()`
  - `updated_at`: `now()`
- **Check Constraints**:
  - `chk_hje_activity_type`: `activity_type IN ('ZIYADAH', 'MURAJAAH')`
  - `chk_hje_result`: `result IN ('LANCAR', 'CUKUP', 'PERLU_MENGULANG')`
  - `chk_hje_error_count`: `error_count >= 0`
  - `chk_hje_surah_number`: `surah_number BETWEEN 1 AND 114`
  - `chk_hje_ayah_range`: `ayah_start >= 1 AND ayah_end >= ayah_start`
  - `chk_hje_juz`: `juz IS NULL OR (juz BETWEEN 1 AND 30)`
  - `chk_hje_page_range`: `page_start IS NULL OR (page_start BETWEEN 1 AND 604 AND page_end >= page_start AND page_end <= 604)`
  - `chk_hje_status`: `status IN ('RECORDED', 'VOIDED')`
- **Unique Constraints**:
  - `uq_hje_tenant_idempotency`: `UNIQUE (tenant_id, idempotency_key)` WHERE `idempotency_key IS NOT NULL`
- **Indexes**: 6 B-Tree composite query indexes + 1 partial unique idempotency index.
- **Audit Requirement**: High. Every insert, update, or void mutation emits an immutable log into `public.audit_logs`.
- **Lifecycle**: `RECORDED` $\rightarrow$ `VOIDED` (Non-destructive).
- **Source of Truth**: Database table `public.hifzh_journal_entries`.
- **Status**: PROPOSED (Awaiting Product Owner authorization for implementation).

---

## 10. Column Specification

| Column | Type | Nullable | Default | Constraint | Purpose & Domain Rationale |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `id` | `text` | **NO** | *None* | `PRIMARY KEY` | Canonical unique entry identifier (UUID or `hje_` prefix). |
| `tenant_id` | `text` | **NO** | *None* | `REFERENCES tenants(id) ON DELETE CASCADE` | Strict multi-tenant data partition. Always server-derived. |
| `santri_id` | `text` | **NO** | *None* | `REFERENCES santri(id) ON DELETE RESTRICT` | Student reciting the Quranic material. |
| `guru_id` | `text` | **NO** | *None* | `REFERENCES guru(id) ON DELETE RESTRICT` | Asatidz / Musyrif who listened to and assessed the recitation. |
| `mapel_id` | `text` | **NO** | *None* | `REFERENCES mapel(id) ON DELETE RESTRICT` | Academic subject (e.g. Tahfidz Juz 30, Tahfidz Al-Qur'an). |
| `kelas_id` | `text` | **YES**| `NULL` | `REFERENCES kelas(id) ON DELETE SET NULL` | Halaqah class context at time of recitation. |
| `academic_year_id`| `text` | **YES**| `NULL` | *None (Pending academic_years)* | Academic year context (e.g. "2026/2027"). |
| `academic_term_id`| `text` | **YES**| `NULL` | *None (Pending academic_terms)* | Semester / term context (e.g. "Semester Ganjil"). |
| `entry_date` | `date` | **NO** | *None* | Calendar Date | Historical recitation date. Distinct from `created_at` timestamp. |
| `activity_type` | `text` | **NO** | *None* | `CHECK (activity_type IN ('ZIYADAH', 'MURAJAAH'))` | Categorization: new memorization vs review repetition. |
| `surah_number` | `integer`| **NO** | *None* | `CHECK (surah_number BETWEEN 1 AND 114)` | Canonical Surah order in the Mushaf (1=Fatihah, 114=Nas). |
| `surah_name` | `text` | **NO** | *None* | *None* | Standard display name of Surah (e.g. "An-Naba'"). |
| `ayah_start` | `integer`| **NO** | *None* | `CHECK (ayah_start >= 1)` | Starting verse recited. |
| `ayah_end` | `integer`| **NO** | *None* | `CHECK (ayah_end >= ayah_start)` | Ending verse recited. |
| `juz` | `integer`| **YES**| `NULL` | `CHECK (juz BETWEEN 1 AND 30)` | Canonical Juz partition. |
| `page_start` | `integer`| **YES**| `NULL` | `CHECK (page_start BETWEEN 1 AND 604)` | Starting page in King Fahd Madinah Mushaf. |
| `page_end` | `integer`| **YES**| `NULL` | `CHECK (page_end >= page_start AND page_end <= 604)` | Ending page in King Fahd Madinah Mushaf. |
| `result` | `text` | **NO** | *None* | `CHECK (result IN ('LANCAR', 'CUKUP', 'PERLU_MENGULANG'))` | Qualitative evaluation of fluency, tajwid, and accuracy. |
| `error_count` | `integer`| **NO** | `0` | `CHECK (error_count >= 0)` | Numeric tally of mistakes/hesitations prompted by teacher. |
| `teacher_note` | `text` | **YES**| `NULL` | *None* | Pedagogical feedback and notes for student improvement. |
| `status` | `text` | **NO** | `'RECORDED'`| `CHECK (status IN ('RECORDED', 'VOIDED'))` | Entry lifecycle status. Enables non-destructive voiding. |
| `voided_at` | `timestamp`| **YES**| `NULL` | *None* | Timestamp when an entry was invalidated. |
| `voided_by` | `text` | **YES**| `NULL` | *None* | User ID of the actor who voided the record. |
| `void_reason` | `text` | **YES**| `NULL` | *None* | Mandatory justification when voiding an academic entry. |
| `idempotency_key`| `text` | **YES**| `NULL` | *None* | Client-generated UUID preventing double-submit on network lag. |
| `created_at` | `timestamp`| **NO** | `now()` | System Audit Timestamp | Audit record creation timestamp. |
| `updated_at` | `timestamp`| **NO** | `now()` | System Audit Timestamp | Audit record modification timestamp. |

---

## 11. Foreign Keys

```sql
-- 1. Strict Tenant Boundary
ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT fk_hje_tenant
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
  ON DELETE CASCADE;

-- 2. Student Referential Integrity (RESTRICT protects academic record deletion)
ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT fk_hje_santri
  FOREIGN KEY (santri_id) REFERENCES public.santri(id)
  ON DELETE RESTRICT;

-- 3. Teacher Referential Integrity
ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT fk_hje_guru
  FOREIGN KEY (guru_id) REFERENCES public.guru(id)
  ON DELETE RESTRICT;

-- 4. Academic Subject Referential Integrity
ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT fk_hje_mapel
  FOREIGN KEY (mapel_id) REFERENCES public.mapel(id)
  ON DELETE RESTRICT;

-- 5. Class / Halaqah Context (SET NULL if class is archived or restructured)
ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT fk_hje_kelas
  FOREIGN KEY (kelas_id) REFERENCES public.kelas(id)
  ON DELETE SET NULL;
```

---

## 12. Constraints

```sql
-- Domain Integrity Check Constraints
ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT chk_hje_activity_type
  CHECK (activity_type IN ('ZIYADAH', 'MURAJAAH'));

ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT chk_hje_result
  CHECK (result IN ('LANCAR', 'CUKUP', 'PERLU_MENGULANG'));

ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT chk_hje_error_count
  CHECK (error_count >= 0);

ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT chk_hje_surah_number
  CHECK (surah_number BETWEEN 1 AND 114);

ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT chk_hje_ayah_range
  CHECK (ayah_start >= 1 AND ayah_end >= ayah_start);

ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT chk_hje_juz
  CHECK (juz IS NULL OR (juz BETWEEN 1 AND 30));

ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT chk_hje_page_range
  CHECK (
    (page_start IS NULL AND page_end IS NULL) OR
    (page_start BETWEEN 1 AND 604 AND page_end BETWEEN page_start AND 604)
  );

ALTER TABLE public.hifzh_journal_entries
  ADD CONSTRAINT chk_hje_status
  CHECK (status IN ('RECORDED', 'VOIDED'));

-- Multi-Tenant Idempotency Key Uniqueness (Partial Index)
CREATE UNIQUE INDEX uq_hje_tenant_idempotency
  ON public.hifzh_journal_entries (tenant_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
```

---

## 13. Indexes

Optimized for high-frequency mobile halaqah queries and multi-tenant isolation:

```sql
-- 1. Primary Student Timeline History (Guru inspecting student past submissions)
CREATE INDEX idx_hje_tenant_santri_date
  ON public.hifzh_journal_entries (tenant_id, santri_id, entry_date DESC);

-- 2. Class / Halaqah Session Log (Guru reviewing today's halaqah journal)
CREATE INDEX idx_hje_tenant_kelas_date
  ON public.hifzh_journal_entries (tenant_id, kelas_id, entry_date DESC);

-- 3. Teacher Audit & Workload Log (Asatidz looking at their own submissions)
CREATE INDEX idx_hje_tenant_guru_date
  ON public.hifzh_journal_entries (tenant_id, guru_id, entry_date DESC);

-- 4. Subject Analytics Log (Curriculum supervisor monitoring Tahfidz subject)
CREATE INDEX idx_hje_tenant_mapel_date
  ON public.hifzh_journal_entries (tenant_id, mapel_id, entry_date DESC);

-- 5. Activity Type Filter (Filtering all Ziyadah vs Muraja'ah entries)
CREATE INDEX idx_hje_tenant_activity_date
  ON public.hifzh_journal_entries (tenant_id, activity_type, entry_date DESC);

-- 6. Surah Distribution Query (Checking how many times Surah X was recited)
CREATE INDEX idx_hje_tenant_surah
  ON public.hifzh_journal_entries (tenant_id, surah_number);
```

---

## 14. Quran Reference Model

### Zero-Duplication Principle
The Holy Quran text is immutable and universal. Duplicating sacred Ayah text into transactional journal logs risks transcription errors, database bloat, and encoding drifts.

### Canonical Mapping
```
Journal Entry Form Input:
"Ahmad menyetorkan Surah An-Naba' ayat 1 sampai 10"
          ↓
Stored in hifzh_journal_entries:
- surah_number: 78
- surah_name:   "An-Naba'"
- ayah_start:   1
- ayah_end:     10
- juz:          30
- page_start:   582
- page_end:     582
```
When UI rendering requires Arabic script or translation, the frontend/API resolves the canonical coordinates `(surah: 78, ayah: 1..10)` against the static client-side Quran Engine or cached scripture assets.

---

## 15. Ziyadah Model (Hafalan Baru)

- **Definition**: New memorization committed to memory for the very first time and recited before the teacher.
- **Workflow**: 
  1. Student sits in halaqah and announces the new verses to be recited (e.g. An-Naba' 1–10).
  2. Teacher listens, corrects pronunciation/makhraj, notes mistakes.
  3. Teacher saves entry with `activity_type = 'ZIYADAH'`.
- **Domain Consequence**: A Ziyadah record represents the historical frontier of what the student has submitted. It does **not** assume the student has permanently mastered it.

---

## 16. Muraja'ah Model (Pengulangan Hafalan)

- **Definition**: Recitation of previously memorized verses to reinforce retention, prevent forgetting, and refine tajwid.
- **Workflow**:
  1. Student recites older memorized portions (e.g. An-Naba' 1–40 or Juz 30).
  2. Teacher evaluates fluency under review conditions.
  3. Teacher saves entry with `activity_type = 'MURAJAAH'`.
- **Domain Consequence**: Muraja'ah records establish review frequency and retention stability over time.

---

## 17. Simakan Result

The qualitative assessment is locked to three intuitive, operational ratings:

| Simakan Result | Business Meaning | Typical Operational Criteria |
| :--- | :--- | :--- |
| **`LANCAR`** | Recited fluently with minimal or zero hesitation. | 0 to 2 minor stumbles immediately self-corrected. |
| **`CUKUP`** | Recited with several hesitations requiring teacher prompts. | 3 to 5 teacher prompts; memorization is present but needs polish. |
| **`PERLU_MENGULANG`** | Recitation broke down; unable to continue without constant coaching. | $> 5$ stops, wrong verse transitions, or major gaps. Requires re-submission. |

> [!IMPORTANT]
> Formal report card predicates (`Mumtaz`, `Jayyid Jiddan`, `Jayyid`, `Maqbul`, `Rasib`) are **strictly excluded** from daily journal entries. They are calculated during formal mid-term/final exams in the Academic Ledger.

---

## 18. Error Count

- Column: `error_count integer NOT NULL DEFAULT 0`
- Constraint: `CHECK (error_count >= 0)`
- Purpose: Provides objective quantitative data to complement the qualitative `result`.
- Examples:
  - `result = 'LANCAR'`, `error_count = 0`: Flawless recitation.
  - `result = 'LANCAR'`, `error_count = 2`: Fluent overall, with 2 minor slips on vowel markers.
  - `result = 'PERLU_MENGULANG'`, `error_count = 8`: Severe stumbling.

---

## 19. Teacher Note

- Column: `teacher_note text NULL`
- Nature: Qualitative pedagogical guidance recorded by the listening Asatidz.
- Typical Content:
  - *"Perhatikan mad wajib muttasil pada ayat 5."*
  - *"Makhraj huruf shad (ص) dan dhad (ض) masih tertukar."*
  - *"Alhamdulillah sudah lancar, lanjutkan ayat 11–20 besok insyaAllah."*
- Confidentiality: Stored as internal academic data. Accessible to teachers, academic admins, and visible to parents/wali as read-only academic feedback.

---

## 20. Duplicate Prevention

### The Multiple-Session Reality
In traditional pesantren, santri frequently recite **twice on the same calendar date**:
- **Morning Session (Ba'da Subuh)**: Setoran Ziyadah (Hafalan Baru, 1/2 halaman).
- **Evening Session (Ba'da Maghrib / Isya)**: Setoran Muraja'ah (Pengulangan 1/4 juz).

Therefore, a database constraint like `UNIQUE (santri_id, entry_date)` is **STRICTLY FORBIDDEN**.

### Two-Tier Duplicate Prevention Architecture
1. **Database Tier (Idempotency Key)**:
   - Client generates a UUID `idempotency_key` upon tapping "Simpan".
   - If a network timeout occurs and the mobile app retries the POST request, the database partial unique index `uq_hje_tenant_idempotency` blocks duplicate insertion.
2. **Application Tier (Proximity Warning — Non-Blocking UX)**:
   - When a teacher submits an entry for Student $S$ with identical Surah $X$ and Ayah range within 60 minutes of an existing entry on the same day, the API returns a `409 Duplicate Suspected` with a bypass token (`confirm_duplicate: true`).
   - The UI displays: *"Santri ini sudah memiliki catatan setoran materi yang sama hari ini. Apakah Anda yakin ingin menyimpan lagi?"*
   - If the teacher confirms, the entry is saved.

---

## 21. Idempotency

- Field: `idempotency_key text NULL`
- Format: Client-generated UUIDv4 (e.g. `c73a9821-4f1b-4f9e-a862-58e1c6999b92`).
- Scope: Scoped per tenant (`UNIQUE (tenant_id, idempotency_key)`).
- Behavior:
  - First attempt: Successfully commits row.
  - Retry attempt (e.g. mobile reconnect): DB rejects with unique constraint violation; API catches error and returns the previously created entry with HTTP 200 OK.

---

## 22. Multi-Tenant Isolation

MA'HAD MANAGER mandates strict multi-tenant data isolation:

```
[Tenant Isolation Enforcement]
Client Request: POST /api/v1/hifzh-journal
Headers: Authorization (Bearer JWT)
          ↓
Supabase Auth Context -> Resolves user_id
          ↓
user_tenant_memberships -> Resolves active tenant_id (e.g. 'tenant_al_fatih')
          ↓
Service Layer -> Injects tenant_id = 'tenant_al_fatih' (Client body tenant_id is DISCARDED)
          ↓
INSERT INTO public.hifzh_journal_entries (tenant_id, ...) VALUES ('tenant_al_fatih', ...)
```

### Defense-in-Depth Rules
1. **Never Trust Client Tenant Header**: `tenant_id` must always be derived server-side from session auth.
2. **Foreign Key Cross-Tenant Validation**: Service layer validates that `santri_id`, `guru_id`, and `mapel_id` belong to the same active `tenant_id`.
3. **Row-Level Security (RLS)**: PostgreSQL RLS enabled on `hifzh_journal_entries` with policy `tenant_id = (current_setting('app.current_tenant_id', true))`.

---

## 23. RBAC (Role-Based Access Control)

Mapping against existing canonical permissions in `src/config/permissions.ts` and `src/lib/authz/canonical-permissions.ts`:

| Role | Permitted Actions | Permission Requirement | Data Access Scope |
| :--- | :--- | :--- | :--- |
| **Guru / Musyrif** | View journal, Create journal, Edit own entry ($\le 24\text{h}$) | `Permission.VIEW_STRUKTUR_AKADEMIK` & `Permission.MANAGE_PENILAIAN` | Own assigned halaqah / classes. |
| **Kepala Kesiswaan / Admin** | View all journals, Void erroneous entries, Export logs | `Permission.VIEW_STRUKTUR_AKADEMIK` & `Permission.MANAGE_PENILAIAN` | Entire tenant / all classes. |
| **Santri (Future Portal)** | Read own historical recitation journal | `Permission.VIEW_OWN_DATA` | Strictly own `santri_id`. |
| **Wali Santri (Parent)** | Read child's recitation history and teacher notes | `Permission.VIEW_OWN_DATA` | Strictly linked `child_santri_id`. |
| **Super Admin / Platform** | System telemetry & schema maintenance | `Permission.MANAGE_SYSTEM_GLOBAL` | Platform administration. |

---

## 24. Audit Integration

All mutations on `hifzh_journal_entries` emit structured events to the existing canonical `public.audit_logs` table:

```ts
// Audit Event Structure
{
  tenantId: session.tenantId,
  action: 'HIFZH_JOURNAL_CREATED', // 'HIFZH_JOURNAL_UPDATED' | 'HIFZH_JOURNAL_VOIDED'
  user: session.userName,
  userId: session.userId,
  userRole: session.userRole,
  targetEntity: 'hifzh_journal_entries',
  targetId: entry.id,
  details: JSON.stringify({
    santriId: entry.santriId,
    santriName: santri.name,
    activityType: entry.activityType,
    material: `${entry.surahName} (${entry.ayahStart}-${entry.ayahEnd})`,
    result: entry.result,
    errorCount: entry.errorCount,
  }),
}
```

---

## 25. Edit & Correction Policy

Academic logs are historical records. Arbitrary modification is prohibited:
1. **Teacher Edit Grace Window (Candidate: 24 Hours)**:
   - A teacher can edit `teacher_note`, `error_count`, or `result` on an entry they created within 24 hours of creation.
   - Purpose: Allows fixing immediate typos made in the halaqah circle.
2. **Post-24-Hour Locking**:
   - After 24 hours, entries are locked from in-place teacher edits.
   - Any correction requires an Academic Admin to void the entry with a stated reason and re-enter the corrected record.
3. **Audit Trail**: Every edit triggers an `audit_logs` entry with before/after diffs in `details`.

---

## 26. Delete / Void Policy

### No Hard Deletes
Hard deletion (`DELETE FROM hifzh_journal_entries`) is **strictly forbidden** for normal operational roles to preserve historical auditability.

### Non-Destructive Voiding
- Status column: `status = 'VOIDED'`.
- Void metadata:
  - `voided_at = now()`
  - `voided_by = session.userId`
  - `void_reason = 'Salah memasukkan ayat santri (seharusnya ayat 1-10 An-Nazi'at)'`
- Voided records are excluded from student progress summaries and history views by default (`WHERE status = 'RECORDED'`), but remain permanently accessible in administrative audit logs.

---

## 27. Academic Ledger Boundary

```
+-------------------------------------------------------------+
|                      DAILY OPERATIONAL                      |
|                                                             |
|   Halaqah Recitation Logs (hifzh_journal_entries)           |
|   - Frequency: 1–2 times daily per santri                   |
|   - Scale: ~150,000 – 300,000 entries / tenant / year       |
|   - Purpose: Pedagogical tracking & daily review            |
+-------------------------------------------------------------+
                              |
                              | (Aggregation during Formal Exams)
                              v
+-------------------------------------------------------------+
|                     FORMAL EVALUATION                       |
|                                                             |
|   Academic Ledger (academic_ledger_records)                 |
|   - Frequency: Midterm / Semester Final                     |
|   - Source Group: 'ujian_tahfidz' / 'munaqosyah'            |
|   - Produces: rawScore (0-100), weightedScore               |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                     FORMAL REPORT CARD                      |
|                                                             |
|   Academic Transcripts (academic_transcripts)               |
|   - Produces: finalScore, predicate ('Mumtaz', etc.)        |
+-------------------------------------------------------------+
```

---

## 28. Assessment Boundary

- **Daily Journal Simakan**: Captures immediate micro-performance (`LANCAR`, `CUKUP`, `PERLU_MENGULANG`) and error count for feedback.
- **Subject Assessment Engine**: Formally evaluates syllabus progress through structured assessment events (`public.assessment_events`). If a Pesantren conducts a formal "Tasmi' 1 Juz Sekali Duduk", that formal test is recorded in the Assessment system, not as a mundane daily journal entry.

---

## 29. Drizzle Design (Target Schema File)

Target file to be created during implementation WP:  
`src/lib/db/schema/hifzh_journal.ts`

```typescript
import { pgTable, text, integer, timestamp, date, unique, index } from 'drizzle-orm/pg-core';
import { tenants, santri, guru, mapel, kelas } from '../schema';

export const hifzhJournalEntries = pgTable(
  'hifzh_journal_entries',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    santriId: text('santri_id')
      .notNull()
      .references(() => santri.id, { onDelete: 'restrict' }),
    guruId: text('guru_id')
      .notNull()
      .references(() => guru.id, { onDelete: 'restrict' }),
    mapelId: text('mapel_id')
      .notNull()
      .references(() => mapel.id, { onDelete: 'restrict' }),
    kelasId: text('kelas_id')
      .references(() => kelas.id, { onDelete: 'set null' }),
    academicYearId: text('academic_year_id'),
    academicTermId: text('academic_term_id'),

    // Recitation Date (Distinct from system created_at)
    entryDate: date('entry_date').notNull(),

    // Activity Type: Strictly ZIYADAH vs MURAJAAH
    activityType: text('activity_type').notNull(), // 'ZIYADAH' | 'MURAJAAH'

    // Canonical Quran Reference
    surahNumber: integer('surah_number').notNull(),
    surahName: text('surah_name').notNull(),
    ayahStart: integer('ayah_start').notNull(),
    ayahEnd: integer('ayah_end').notNull(),
    juz: integer('juz'),
    pageStart: integer('page_start'),
    pageEnd: integer('page_end'),

    // Simakan Evaluation
    result: text('result').notNull(), // 'LANCAR' | 'CUKUP' | 'PERLU_MENGULANG'
    errorCount: integer('error_count').default(0).notNull(),
    teacherNote: text('teacher_note'),

    // Record Lifecycle & Voiding
    status: text('status').default('RECORDED').notNull(), // 'RECORDED' | 'VOIDED'
    voidedAt: timestamp('voided_at'),
    voidedBy: text('voided_by'),
    voidReason: text('void_reason'),

    // Idempotency Key (Network retry protection)
    idempotencyKey: text('idempotency_key'),

    // System Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Indexes
    tenantSantriDateIdx: index('idx_hje_tenant_santri_date').on(table.tenantId, table.santriId, table.entryDate),
    tenantKelasDateIdx: index('idx_hje_tenant_kelas_date').on(table.tenantId, table.kelasId, table.entryDate),
    tenantGuruDateIdx: index('idx_hje_tenant_guru_date').on(table.tenantId, table.guruId, table.entryDate),
    tenantMapelDateIdx: index('idx_hje_tenant_mapel_date').on(table.tenantId, table.mapelId, table.entryDate),
    tenantActivityDateIdx: index('idx_hje_tenant_activity_date').on(table.tenantId, table.activityType, table.entryDate),
    tenantSurahIdx: index('idx_hje_tenant_surah').on(table.tenantId, table.surahNumber),
    
    // Unique partial index for idempotency
    idempotencyUnique: unique('uq_hje_tenant_idempotency').on(table.tenantId, table.idempotencyKey),
  })
);

export type HifzhJournalEntry = typeof hifzhJournalEntries.$inferSelect;
export type NewHifzhJournalEntry = typeof hifzhJournalEntries.$inferInsert;
```

---

## 30. Migration Plan

The future migration will be executed via a dedicated Drizzle migration plan:

### Planned File: `drizzle/0004_add_hifzh_journal_entries.sql`
1. `CREATE TABLE public.hifzh_journal_entries (...);`
2. Add check constraints:
   - `chk_hje_activity_type`: `activity_type IN ('ZIYADAH', 'MURAJAAH')`
   - `chk_hje_result`: `result IN ('LANCAR', 'CUKUP', 'PERLU_MENGULANG')`
   - `chk_hje_error_count`: `error_count >= 0`
   - `chk_hje_surah_number`: `surah_number BETWEEN 1 AND 114`
   - `chk_hje_ayah_range`: `ayah_start >= 1 AND ayah_end >= ayah_start`
   - `chk_hje_juz`: `juz IS NULL OR (juz BETWEEN 1 AND 30)`
   - `chk_hje_page_range`: `page_start IS NULL OR (page_start BETWEEN 1 AND 604 AND page_end >= page_start AND page_end <= 604)`
   - `chk_hje_status`: `status IN ('RECORDED', 'VOIDED')`
3. Add foreign key constraints to `tenants`, `santri`, `guru`, `mapel`, `kelas`.
4. Create B-Tree indexes for fast querying.
5. Create partial unique index on `(tenant_id, idempotency_key)`.
6. Enable RLS and apply tenant isolation policy.

---

## 31. API / Service Plan

### Service Boundary: `HifzhJournalService`
Target file: `src/lib/services/hifzh-journal-service.ts`

```typescript
export interface CreateJournalEntryDTO {
  santriId: string;
  guruId: string;
  mapelId: string;
  kelasId?: string;
  academicYearId?: string;
  academicTermId?: string;
  entryDate: string; // 'YYYY-MM-DD'
  activityType: 'ZIYADAH' | 'MURAJAAH';
  surahNumber: number;
  surahName: string;
  ayahStart: number;
  ayahEnd: number;
  juz?: number;
  pageStart?: number;
  pageEnd?: number;
  result: 'LANCAR' | 'CUKUP' | 'PERLU_MENGULANG';
  errorCount: number;
  teacherNote?: string;
  idempotencyKey?: string;
}

export interface HifzhJournalService {
  createEntry(tenantId: string, actorUserId: string, dto: CreateJournalEntryDTO): Promise<HifzhJournalEntry>;
  getStudentHistory(tenantId: string, santriId: string, filters?: { activityType?: string; limit?: number; offset?: number }): Promise<HifzhJournalEntry[]>;
  getHalaqahJournal(tenantId: string, kelasId: string, date: string): Promise<HifzhJournalEntry[]>;
  updateEntry(tenantId: string, entryId: string, actorUserId: string, updates: Partial<CreateJournalEntryDTO>): Promise<HifzhJournalEntry>;
  voidEntry(tenantId: string, entryId: string, actorUserId: string, reason: string): Promise<void>;
}
```

### Route Plan:
- `POST /api/v1/hifzh-journal`: Creates entry with Zod validation and idempotency check.
- `GET  /api/v1/hifzh-journal/student/:santriId`: Retrieves timeline history.
- `GET  /api/v1/hifzh-journal/class/:kelasId`: Retrieves daily halaqah log.
- `PATCH /api/v1/hifzh-journal/:id`: Updates pedagogical note / error count within grace period.
- `POST /api/v1/hifzh-journal/:id/void`: Voids an erroneous record with audit trail.

---

## 32. Query Patterns

### Use Case A: Guru melihat histori hafalan satu santri
```sql
SELECT * FROM public.hifzh_journal_entries
WHERE tenant_id = :tenantId
  AND santri_id = :santriId
  AND status = 'RECORDED'
ORDER BY entry_date DESC, created_at DESC
LIMIT 50;
```
*Index Used*: `idx_hje_tenant_santri_date` (Cost: $\mathcal{O}(\log N)$ B-Tree lookup).

### Use Case B: Guru melihat jurnal halaqah hari ini
```sql
SELECT * FROM public.hifzh_journal_entries
WHERE tenant_id = :tenantId
  AND kelas_id = :kelasId
  AND entry_date = :today
  AND status = 'RECORDED'
ORDER BY created_at ASC;
```
*Index Used*: `idx_hje_tenant_kelas_date`.

### Use Case C: Filter khusus Ziyadah santri
```sql
SELECT * FROM public.hifzh_journal_entries
WHERE tenant_id = :tenantId
  AND santri_id = :santriId
  AND activity_type = 'ZIYADAH'
  AND status = 'RECORDED'
ORDER BY entry_date DESC;
```
*Index Used*: `idx_hje_tenant_santri_date` + bitmap scan on `activity_type`.

### Use Case D: Deteksi potensi duplikasi (Proximity Warning)
```sql
SELECT id, created_at FROM public.hifzh_journal_entries
WHERE tenant_id = :tenantId
  AND santri_id = :santriId
  AND surah_number = :surahNumber
  AND ayah_start = :ayahStart
  AND ayah_end = :ayahEnd
  AND entry_date = :entryDate
  AND status = 'RECORDED'
  AND created_at >= (now() - interval '60 minutes');
```

---

## 33. Performance & Capacity Analysis

- **Scale Projection (Initial 10 Pesantren)**:
  - Average 500 santri per pesantren = 5,000 active reciting santri across the platform.
  - Average 1.5 recitation sessions/day = 7,500 rows inserted daily.
  - Annual volume $\approx 2.7\text{ million}$ rows platform-wide across all 10 tenants.
- **Storage Profile**:
  - Row width $\approx 250$ bytes.
  - $2.7\text{M rows} \approx 675\text{ MB}$ raw data $+ \approx 300\text{ MB}$ indexes $\approx 1\text{ GB/year}$.
- **Verdict**: Fully performant on single PostgreSQL instance without partitioning or sharding required for the first 10–50 tenants.

---

## 34. Risks & Mitigations

| Risk | Impact | Architectural Mitigation |
| :--- | :--- | :--- |
| **Halaqah Network Lag causing double-tap** | High (Duplicate rows created) | Client UUID `idempotency_key` backed by PostgreSQL partial unique index. |
| **Wrong Ayah input by Teacher** | Medium (Inaccurate record) | 24-hour edit grace window for creator + administrative voiding with audit log. |
| **Cross-Tenant Association** | Critical (Security breach) | Tenant ID strictly server-derived; application layer checks all foreign keys match `tenant_id`. |
| **Sacred Quran Text Drift** | Medium (Spelling errors) | Zero Quran text stored. Only canonical Surah and Ayah index integers are persisted. |

---

## 35. Open Decisions (Product Owner Review Required)

The following two operational policy questions remain open for Product Owner confirmation prior to implementation:

1. **Teacher Edit Grace Window Duration**:
   - *Option A (Recommended)*: **24 Hours**. The teacher who created the entry can edit `teacher_note`, `error_count`, and `result` within 24 hours. After 24 hours, entries are permanently locked.
   - *Option B*: **Same-Day Only**. Edits permitted only until 23:59:59 of the `entry_date`.
   - *Option C*: **Strict Append-Only**. Zero in-place edits; any mistake must be voided and re-entered.

2. **Self-Voiding Privileges for Teachers**:
   - *Option A (Recommended)*: Teachers may void an entry they created within **1 hour** of submission (for immediate mistaken taps in halaqah). Thereafter, only Academic Admins can void.
   - *Option B*: Teachers can never void; all void requests must be submitted to Academic Admin.

---

## 36. Future Implementation Roadmap

```
[Future Implementation Sequence - Authorized upon PO Approval]

  PHASE 1: Schema Implementation
  - Create src/lib/db/schema/hifzh_journal.ts
  - Register export in src/lib/db/schema.ts
  - Generate Drizzle migration (0004_add_hifzh_journal_entries.sql)
                  |
                  v
  PHASE 2: Repository & Service Layer
  - Implement HifzhJournalService with Zod validation & idempotency checks
  - Implement audit logging on all journal mutations
                  |
                  v
  PHASE 3: API Endpoints
  - Implement Next.js App Router API handlers (/api/v1/hifzh-journal/...)
  - Enforce server-side tenant extraction and RBAC
                  |
                  v
  PHASE 4: RBAC Integration
  - Verify permission enforcement for Guru, Admin, and Wali
                  |
                  v
  PHASE 5: Mobile-First Teacher UI
  - Build rapid halaqah recording view at /dashboard/setoran-quran
  - Build santri timeline card with Ziyadah/Muraja'ah badges
                  |
                  v
  PHASE 6: Student Read-Only UI (Future Portal)
  - Student / Wali recitation history viewer
                  |
                  v
  PHASE 7: Contract Tests
  - Execute automated contract test suite (16 test cases)
                  |
                  v
  PHASE 8: Runtime Verification
  - Live PostgreSQL runtime execution check
```

---

## 37. Required Test Plan (For Future Implementation)

```
1.  [Contract] Create Ziyadah entry successfully with valid Surah and Ayah range.
2.  [Contract] Create Muraja'ah entry successfully with valid Surah and Ayah range.
3.  [Contract] Accept valid result 'LANCAR'.
4.  [Contract] Accept valid result 'CUKUP'.
5.  [Contract] Accept valid result 'PERLU_MENGULANG'.
6.  [Contract] Accept error_count = 0.
7.  [Contract] Accept error_count > 0.
8.  [Contract] Reject error_count < 0 (DB check constraint violation).
9.  [Contract] Reject invalid surah_number < 1 or > 114.
10. [Contract] Reject ayah_end < ayah_start.
11. [Contract] Prevent cross-tenant association (santri tenant A with guru tenant B).
12. [Contract] Enforce network retry idempotency via idempotency_key.
13. [Contract] Allow multiple legitimate recitation sessions on the same calendar date.
14. [Contract] Verify journal entry creation does NOT insert rows into academic_ledger_records.
15. [Contract] Verify non-destructive voiding (status = 'VOIDED') and audit log generation.
16. [Contract] Verify teacher edit blocked after grace period expiry.
```

---

## 38. Gap Matrix

| Area | Current | Target | Gap | Risk | Future WP |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Journal Table** | 0 tables in PostgreSQL | `public.hifzh_journal_entries` | Missing table & constraints | Medium (Schema missing) | WP-ACADEMIC-HIFZH-SCHEMA-001 |
| **Ziyadah** | Client mock store only | Enforced `activity_type = 'ZIYADAH'` | Database persistence | Low | WP-ACADEMIC-HIFZH-SCHEMA-001 |
| **Muraja'ah** | Client mock store only | Enforced `activity_type = 'MURAJAAH'`| Database persistence | Low | WP-ACADEMIC-HIFZH-SCHEMA-001 |
| **Quran Reference** | Unstructured text fields | Canonical Surah/Ayah/Juz/Page | Missing typed columns | Medium (Data drift) | WP-ACADEMIC-HIFZH-SCHEMA-001 |
| **Result** | Legacy 'Mumtaz' mock enum | 'LANCAR', 'CUKUP', 'PERLU_MENGULANG' | Mismatched domain scale | Low | WP-ACADEMIC-HIFZH-SCHEMA-001 |
| **Error Count** | Not captured | `error_count integer >= 0` | Missing column | Low | WP-ACADEMIC-HIFZH-SCHEMA-001 |
| **Teacher Note** | Optional string in mock | `teacher_note text` | Missing persistent column | Low | WP-ACADEMIC-HIFZH-SCHEMA-001 |
| **Academic Context**| Loose component state | FKs to santri, guru, mapel, kelas | Unenforced relational links | High (Orphaned records)| WP-ACADEMIC-HIFZH-SCHEMA-001 |
| **RBAC** | `Permission.VIEW_STRUKTUR_AKADEMIK`| Bound to `MANAGE_PENILAIAN` | Missing API route guard | Medium (Unauthorized) | WP-ACADEMIC-HIFZH-SERVICE-001 |
| **Audit** | `audit_logs` exists in live DB| Structured journal audit events | Missing service binding | Low | WP-ACADEMIC-HIFZH-SERVICE-001 |
| **Duplicate Prevention**| None | Proximity warning (60 min window) | Double submission on lag | Medium (Duplicate logs)| WP-ACADEMIC-HIFZH-SERVICE-001 |
| **Idempotency** | None | Client UUID + DB partial unique idx | Network timeout retries | High (Duplicate rows) | WP-ACADEMIC-HIFZH-SCHEMA-001 |
| **API** | None | Next.js App Router route handlers | Missing endpoints | Medium | WP-ACADEMIC-HIFZH-SERVICE-001 |
| **Service** | Zustand store only | Server-side domain service | Missing business logic | Medium | WP-ACADEMIC-HIFZH-SERVICE-001 |
| **UI** | Prototype at `/dashboard/tahfidz` | Mobile-first `/dashboard/setoran-quran` | Missing rapid halaqah UI | Low (UX friction) | WP-ACADEMIC-HIFZH-UI-001 |

---

## 39. Decision Classification

| Decision Item | Classification | Rationale & Status |
| :--- | :--- | :--- |
| **Journal Purpose (Pencatatan + Penyimakan)** | **LOCKED** | Set by Product Owner. Journal is an academic recitation log, not a personal planner. |
| **Activity Types (ZIYADAH vs MURAJAAH)** | **LOCKED** | Set by Product Owner. Strictly two primary activity types. |
| **Simakan Result (Lancar/Cukup/Perlu Mengulang)** | **LOCKED** | Set by Product Owner. Formal predicates (Mumtaz, etc.) are excluded from daily journal. |
| **Error Count ($\ge 0$)** | **LOCKED** | Set by Product Owner. Separated from qualitative result. |
| **No Mastery Engine** | **LOCKED** | Set by Product Owner. Daily simakan does not mutate student lifetime mastery status. |
| **Quran Content (Reference Only)** | **LOCKED** | Set by Product Owner. Zero duplicated text/tafsir/audio in database. |
| **Personal Hifzh Module** | **DEFERRED** | Set by Product Owner. Personal self-study module deferred to future Student Portal WP. |
| **Academic Ledger Boundary** | **LOCKED** | Set by Product Owner. Daily simakan does not automatically insert into Academic Ledger. |
| **Multi-Tenant Foundation** | **EXISTING** | Canonical `tenants` and `user_tenant_memberships` tables active in live DB. |
| **Academic Subject (`mapel`) Binding** | **EXISTING** | Canonical `mapel` table active in live DB. |
| **Audit Infrastructure (`audit_logs`)** | **EXISTING** | Canonical `audit_logs` active in live DB. |
| **Table `hifzh_journal_entries`** | **PROPOSED** | Fully designed in this WP. Ready for schema implementation. |
| **Idempotency Key & Partial Unique Index** | **PROPOSED** | Designed in this WP to prevent double submissions. |
| **Hifzh Database Tables in Live DB** | **MISSING** | Confirmed by forensic inspection (0 tables in live PostgreSQL). |
| **Teacher Edit Grace Window (24h vs Same-Day)**| **OPEN DECISION** | Awaiting Product Owner choice between 24 Hours, Same-Day, or Strict Append-Only. |
| **Self-Voiding Privilege for Teachers** | **OPEN DECISION** | Awaiting Product Owner choice between 1-Hour Self-Void vs Admin-Only Void. |

---

## 40. Mandatory Final Review Checklist

```
[Mandatory Architectural Anti-Corruption Checklist]
[x] NO parallel academic entities created (Santri, Guru, Mapel, Kelas reused canonically)
[x] NO parallel Quran content source created (Reference-only coordinates used)
[x] NO Mastery Engine or auto-mutqin flags added
[x] NO Personal Hifzh tables or planners introduced
[x] NO Academic Ledger duplication (Simakan kept separate from Rapor)
[x] NO hardcoded commercial logic in academic tables
[x] NO client-supplied tenant_id trusted (Server-derived tenant context strictly enforced)
[x] NO UNIQUE(santri_id, entry_date) constraint (Multiple daily sessions supported)
[x] NO mixing of simakan result with formal rapor predicates (Mumtaz, etc. kept in Rapor)
```

---

## 41. STOP

All schema design, structural contracts, constraint definitions, and integration plans are **100% complete**.

In strict accordance with Governance:
- **NO SOURCE CODE HAS BEEN MODIFIED**.
- **NO DATABASE MUTATIONS HAVE OCCURRED**.
- **NO MIGRATIONS HAVE BEEN CREATED**.
- **NO DEPLOYMENTS OR COMMITS HAVE BEEN EXECUTED**.

Execution is now stopped pending Product Owner review and authorization.

---

## 42. Final Status Block

============================================================  
WP STATUS  
============================================================  

STATUS:  
**PASS**  

FORENSIC:  
**PASS**  

SCHEMA DESIGN:  
**PASS**  

ACADEMIC INTEGRATION:  
**PASS**  

QURAN INTEGRATION:  
**PASS**  

IMPLEMENTATION:  
**NOT STARTED**  

DATABASE MUTATION:  
**NOT PERFORMED**  

SOURCE CODE MUTATION:  
**NOT PERFORMED**  

MIGRATION:  
**NOT CREATED**  

API:  
**NOT CREATED**  

UI:  
**NOT CREATED**  

COMMIT:  
**NOT CREATED**  

PUSH:  
**NOT PERFORMED**  

DEPLOY:  
**NOT PERFORMED**  

PRODUCT OWNER DECISION REQUIRED:  
1. Teacher Edit Grace Window Duration (24 Hours vs Same-Day vs Strict Append-Only).  
2. Self-Voiding Privilege for Teachers (Allowed within 1 hour vs Admin-Only).  

NEXT RECOMMENDED WP:  
**WP-ACADEMIC-HIFZH-SCHEMA-IMPLEMENTATION-001** (or PO Authorization for Implementation)  

============================================================  
STOP.
