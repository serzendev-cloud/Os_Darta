# EEOS NIS TENANT-SCOPED ARCHITECTURAL DECISION & IMPACT ANALYSIS

```text
WORK PACKAGE:
WP-NIS-TENANT-SCOPED-ARCHITECTURAL-DECISION-001

RELATED WORK PACKAGES:
- WP-MULTITENANT-ISOLATION-AUDIT-001
- WP-MULTITENANT-ROOT-CAUSE-HARDENING-REVIEW-001
- WP-PSB-ALUMNI-GATE-9-FAILURE-RECONCILIATION-001
- WP-PSB-ALUMNI-GATE-9-ARCHITECTURAL-DECISION-ANALYSIS-001

DOCUMENT IDENTIFIER:
docs/architecture/WP-NIS-TENANT-SCOPED-ARCHITECTURAL-DECISION-001.md

CURRENT GATE:
ARCHITECTURAL DECISION & IMPACT ANALYSIS

POSTURE:
READ-ONLY / ZERO MUTATION / STATIC & FORENSIC ARCHITECTURAL ANALYSIS

LOCKED DOMAIN DECISION:
"NIS IS TENANT-SCOPED, NOT GLOBALLY UNIQUE."

FINAL STATUS:
NIS TENANT-SCOPED DECISION ANALYSIS COMPLETE — READY FOR ARCHITECTURAL REVIEW
```

---

## 1. Executive Summary

This work package executes a rigorous architectural impact analysis for the Product Owner's locked domain decision:

> **NIS (Nomor Induk Santri) is a tenant-scoped business identifier, NOT a globally unique platform identifier.**

Under this decision, identical NIS values may legitimately exist across different pesantren institutions (e.g., Tenant A having NIS `00125` and Tenant B having NIS `00125` is completely valid). However, duplicate NIS values within the same pesantren remain strictly prohibited (`UNIQUE (tenant_id, nis)`).

### Core Forensic Discoveries:
1. **The Core Contract Mismatch**:
   * In application logic (`src/modules/santri/services/santri-core-service.ts:33-42`), the codebase **already attempted to enforce tenant-scoped NIS uniqueness**:
     ```ts
     .where(and(eq(santri.tenantId, tenantId), eq(santri.nis, santriData.nis)))
     ```
   * However, in Drizzle schema (`src/lib/db/schema.ts:55`), NIS was declared as globally unique:
     ```ts
     nis: text('nis').notNull().unique()
     ```
   * And in the live PostgreSQL database catalog, `public.santri` enforces a **global unique constraint** on `nis` (`santri_nis_unique UNIQUE (nis)`) while physically lacking a `tenant_id` column (BCF-01).
   * **Result**: If Tenant A registers NIS `2024001`, and Tenant B subsequently attempts to register NIS `2024001`, PostgreSQL throws a unique constraint violation, blocking Tenant B from using their own numbering sequence.
2. **Synthetic Login Namespacing is Validated**:
   * The Option A authentication architecture (`{nis}@{tenant_slug}.mahad.internal`) natively supports duplicate NIS across tenants in GoTrue (`auth.users`), because the synthetic email incorporates the `{tenant_slug}` sub-component.
   * However, in a **single native mobile application**, NIS alone cannot resolve the synthetic email without an independent tenant resolution step before invoking GoTrue.
3. **PSB Sequence Engine Pre-Configuration**:
   * Architectural specifications (`WP-PSB-ALUMNI-SCHEMA-001-DESIGN.md:393-407`) already designed `tenant_nis_configurations`, generating tenant-scoped sequential numbers (e.g., `{YEAR}.{SEQUENCE:4}` -> `2027.0001`). This engine is inherently incompatible with a global unique constraint on NIS.
4. **Migration Prerequisite Hardening**:
   * The conversion from `UNIQUE (nis)` to `UNIQUE (tenant_id, nis)` is hard-blocked until `public.santri` is tenantized with an authoritative tenant ownership source (`WP-CORE-SANTRI-TENANTIZATION-001`).

---

## 2. Locked Product Owner Decision

The following domain rules are formally locked and non-negotiable:

1. **Tenant-Scoped Uniqueness**: NIS belongs to a specific Tenant/Pondok. It must be unique within that tenant, but may collide safely across different tenants.
2. **Business vs. System Identity**:
   * `santri.id` (UUID/Text) is the immutable, platform-wide internal primary key.
   * `santri.nis` is the human-readable, institution-scoped business identifier.
3. **Preservation of Raw NIS Format**:
   * Tenant isolation **must never modify the visible NIS string**.
   * It is strictly forbidden to prepend tenant slugs (e.g., transforming `00125` into `PONDOK-A-00125`). The NIS string entered and viewed by users remains `00125`.
4. **Authoritative Partitioning**:
   * Tenancy is the backend security partition (`tenant_id`), never an encoded string attribute.

---

## 3. NIS Domain Semantics

In Indonesian Islamic boarding schools (Pesantren/Ma'had), the **Nomor Induk Santri (NIS)** represents the formal matriculation registry number assigned by the local Madrasah/Pondok administration. 

```text
                     PLATFORM MULTI-TENANCY MODEL
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
   PESANTREN AL-FATIH                               PESANTREN DARUSSALAM
   (tenant_id: 'ten_alfatih')                       (tenant_id: 'ten_darussalam')
         │                                                 │
   Student: Muhammad Rizki                          Student: Ahmad Dahlan
   Internal ID: santri_99812                        Internal ID: santri_44120
   Tenant NIS:  "2026.001"                          Tenant NIS:  "2026.001"
         │                                                 │
   [VALID & COEXISTING]                             [VALID & COEXISTING]
```

### Key Semantics:
* **Independence of Autonomous Numbering**: Each pesantren establishes its own numbering convention (e.g., year-based `2026.0001`, sequential numeric `1001`, or Madrasah-prefixed `MTs-001`). The SaaS platform cannot dictate global numbering schemes to independent educational foundations.
* **Non-Global Identity**: A NIS cannot identify a student across the entire SaaS platform without the associated `tenant_id`.
* **Immutability within Lifecycle**: Once assigned by the Admissions Committee / SAT (Sidang Akhir Kelulusan), the NIS remains fixed for that student's operational tenure and historical transcripts.

---

## 4. Current Database State

Forensic catalog probes of the live PostgreSQL database (`aws-0-ap-southeast-1.pooler.supabase.com:5432`) reveal the exact current state of `public.santri`:

* **Table Structure**: 24 columns, exactly 0 foreign keys.
* **Physical Absence of `tenant_id` (BCF-01)**: `public.santri` contains no `tenant_id` column.
* **Row Count**: Sandbox contains 0 rows; production historical baseline is unknown.
* **Row-Level Security**: Disabled (`rowsecurity = false`).

### Current Schema Definition in Drizzle (`src/lib/db/schema.ts:52-78`):
```typescript
export const santri = pgTable('santri', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').default('default').notNull(),
  nis: text('nis').notNull().unique(), // <--- THE DEFECTIVE GLOBAL UNIQUE DECLARATION
  name: text('name').notNull(),
  asrama: text('asrama').notNull(),
  kamar: text('kamar').notNull(),
  asramaId: text('asrama_id'),
  kamarId: text('kamar_id'),
  kelas: text('kelas').notNull(),
  status: text('status').notNull().default('Aktif'),
  gender: text('gender').notNull(),
  photoUrl: text('photo_url'),
  waliId: text('wali_id'),
  waliName: text('wali_name').notNull(),
  waliPhone: text('wali_phone').notNull(),
  joinDate: text('join_date').notNull(),
  asalKota: text('asal_kota').notNull(),
  asalProvinsi: text('asal_provinsi').notNull(),
  angkatanMasuk: integer('angkatan_masuk').notNull(),
  totalPoinPelanggaran: integer('total_poin_pelanggaran').default(0).notNull(),
  totalPrestasi: integer('total_prestasi').default(0).notNull(),
  statusKarakter: text('status_karakter').default('Baik').notNull(),
  statusSP: text('status_sp').default('Tidak Ada').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## 5. Current NIS Constraints

1. **Live PostgreSQL Catalog**:
   * Index: `santri_nis_unique` on `(nis)`.
   * Constraint: `UNIQUE (nis)`.
2. **Candidate DDL Section 1.2 (`WP-PSB-ALUMNI-DDL-DRAFT-001.sql:3141`)**:
   Attempted:
   ```sql
   ALTER TABLE public.santri ADD CONSTRAINT uq_santri_tenant_id UNIQUE (tenant_id, id);
   ```
   * It left the existing `UNIQUE (nis)` untouched.
   * It did **not** drop `santri_nis_unique`.
   * It did **not** add `UNIQUE (tenant_id, nis)`.
3. **Target Corrective Contract**:
   ```sql
   ALTER TABLE public.santri DROP CONSTRAINT IF EXISTS santri_nis_unique;
   ALTER TABLE public.santri ADD CONSTRAINT uq_santri_tenant_nis UNIQUE (tenant_id, nis);
   ```

---

## 6. Current NIS Query Inventory

An exhaustive static analysis was performed across all source files to locate every query and reference involving NIS:

| File & Line | Query / Usage Pattern | Safety Status | Analysis & Risk |
| :--- | :--- | :--- | :--- |
| `src/modules/santri/services/santri-core-service.ts:37` | `where(and(eq(santri.tenantId, tenantId), eq(santri.nis, santriData.nis)))` | **SAFE** | Correctly scopes NIS check by `tenantId`. However, subsequent `insert()` fails at DB layer if NIS exists in another tenant due to `UNIQUE (nis)`. |
| `src/modules/wali/services/wali-service.ts:208` | `select({ ..., nis: santri.nis })` | **SAFE** | Read-only projection of NIS joined on `santri.id`. |
| `src/lib/presenters/transcript-presenter.ts:108` | `metadata.nis \|\| '-'` | **SAFE** | Presentation layer formatting for PDF transcript exports. |
| `src/components/santri/SantriTable.tsx:108` | Client-side filter: `s.nis.includes(q)` | **SAFE** | Filters already tenant-scoped dataset loaded into memory. |
| `src/components/uks/CatatUKSModal.tsx:113` | Client-side filter: `s.nis.includes(q)` | **SAFE** | Operates on active tenant's student collection. |
| `src/components/pelanggaran/CatatPelanggaranModal.tsx:164` | Client-side filter: `s.nis.includes(q)` | **SAFE** | Operates on active tenant's student collection. |
| `src/components/asrama/TarikSantriModal.tsx:29` | Client-side filter: `s.nis.includes(q)` | **SAFE** | Operates on active tenant's student collection. |
| `src/components/santri/AddSantriModal.tsx:168` | Direct user input for NIS | **NEUTRAL** | UI input field; requires backend uniqueness validation. |
| `src/app/dashboard/import/page.tsx:30` | Bulk CSV import mapping | **CONDITIONALLY SAFE** | Uploads raw NIS strings; backend must validate uniqueness per `tenant_id`. |

### Key Query Inventory Finding:
There are **zero raw `WHERE nis = ?` database queries** in the active TypeScript services. The service layer in `santri-core-service.ts` already correctly queried `WHERE tenant_id = ? AND nis = ?`. **The conflict exists entirely between the application service logic and the physical database catalog constraint.**

---

## 7. NIS Login Analysis

In `WP-PSB-ALUMNI-IDENTITY-FEDERATION-DECISION-LOCK.md:101-235`, the system established the **Option A Synthetic Credential Architecture**:
$$\text{Synthetic Email} = \texttt{\{nis\}@\{tenant\_slug\}.mahad.internal}$$

### Scenario Evaluation: Cross-Tenant Duplicate NIS Login

```text
TENANT A: Pondok Al-Fatih (slug: 'alfatih')
Student: NIS 00125
Synthetic Email: 00125@alfatih.mahad.internal
Supabase auth.users.id: usr_aaa111

TENANT B: Pondok Darussalam (slug: 'darussalam')
Student: NIS 00125
Synthetic Email: 00125@darussalam.mahad.internal
Supabase auth.users.id: usr_bbb222
```

1. **GoTrue Identity Collision**:
   * **ZERO COLLISION**. Because `auth.users.email` stores the full synthetic string (`00125@alfatih.mahad.internal` vs `00125@darussalam.mahad.internal`), Supabase Auth enforces uniqueness across synthetic emails without conflict.
2. **PWA Login Flow**:
   * User navigates to `https://alfatih.mahad-app.com/login`.
   * Edge proxy extracts `tenant_slug = 'alfatih'`.
   * Student enters NIS `00125` and password `mypassword`.
   * Client constructs: `00125@alfatih.mahad.internal`.
   * Invokes `supabase.auth.signInWithPassword()`.
   * **Result**: Authenticates successfully into Tenant A.
3. **Native App Login Flow (CRITICAL GAP)**:
   * Native app connects to universal endpoint `https://api.osdarta.com/login`.
   * Student enters NIS `00125` and password `mypassword`.
   * **GAP**: The native app **does not know which tenant slug to append**.
   * If the app appends `00125@default.mahad.internal`, authentication fails.
   * If Tenant A and Tenant B both have NIS `00125`, the native app cannot know whether to authenticate against `alfatih` or `darussalam`.
4. **Architectural Requirement for Native App**:
   * In a native app, a Santri login screen **MUST require the student to specify their institution** (e.g., via school code, dropdown selection, or tenant QR code) **prior to submitting credentials**, allowing the client to construct the correct synthetic email.

---

## 8. NIS Generator Analysis

In `docs/architecture/WP-PSB-ALUMNI-SCHEMA-001-DESIGN.md:393-407`, Entity `tenant_nis_configurations` was designed:
```typescript
export const tenantNisConfigurations = pgTable('tenant_nis_configurations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().unique().references(() => tenants.id, { onDelete: 'cascade' }),
  prefixPattern: text('prefix_pattern').default('{YEAR}.{SEQUENCE:4}').notNull(),
  sequencePadding: integer('sequence_padding').default(4).notNull(),
  currentSequence: integer('current_sequence').default(0).notNull(),
  resetYearly: boolean('reset_yearly').default(true).notNull(),
  lastSequenceYear: integer('last_sequence_year').default(2027).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Analysis of Automated Sequence Generation:
1. **Tenant-Scoped Sequence Counter**:
   * The sequence counter `currentSequence` is explicitly stored on a table keyed by `tenant_id`.
   * When Tenant A admits a student, its sequence increments: `0 -> 1` (`2027.0001`).
   * When Tenant B admits a student, its independent sequence increments: `0 -> 1` (`2027.0001`).
2. **Concurrency & Race Conditions**:
   * To prevent duplicate NIS within the same tenant during concurrent acceptance operations, sequence increments must execute with atomic row locks:
     ```sql
     SELECT current_sequence FROM tenant_nis_configurations 
     WHERE tenant_id = :tenant_id FOR UPDATE;
     ```
3. **Database Uniqueness Validation**:
   * If the database constraint remains `UNIQUE (nis)`, Tenant B's automated acceptance will throw an exception the moment Tenant A generates `2027.0001`.
   * Under `UNIQUE (tenant_id, nis)`, both sequences proceed independently and safely.

---

## 9. PSB (Penerimaan Santri Baru) Impact

```text
                             PSB ACCEPTANCE LIFECYCLE
                                        │
           Applicant Submits Application (psb_applicants)
                                        │
                 Interview & Testing (psb_exam_scores)
                                        │
               SAT Decision: "LULUS" (psb_acceptance_ledgers)
                                        │
                     ┌──────────────────┴──────────────────┐
                     ▼                                     ▼
     Tenant A SAT Generates NIS             Tenant B SAT Generates NIS
         NIS: "2027.0001"                       NIS: "2027.0001"
                     │                                     │
     Creates santri record in Tenant A      Creates santri record in Tenant B
```

### Verification Against PSB Artifacts:
* **`psb_acceptance_ledgers`**:
  * Stores `generated_nis text`.
  * References `provisioned_santri_id REFERENCES public.santri(id)`.
  * The ledger is partitioned by `tenant_id`.
  * Under tenant-scoped NIS, ledgers in Tenant A and Tenant B storing the identical `generated_nis` operate without relational conflict.
* **`psb_placement_distributions`**:
  * Distributes admitted students to classes (`rombel`) and dorms (`kamar`).
  * Binds by `santri_id` (the internal UUID/text ID), never by NIS.
  * Preserves full relational safety.

---

## 10. Alumni Impact

1. **Identity Conferred by SAT**:
   * An alumnus is conferred status by SAT decision upon graduation.
   * In `alumni_academic_snapshots` (`WP-PSB-ALUMNI-DDL-DRAFT-001.sql:3465`), the foreign key targets:
     ```sql
     CONSTRAINT fk_alumni_snap_santri FOREIGN KEY (tenant_id, santri_id)
         REFERENCES public.santri(tenant_id, id) ON DELETE RESTRICT
     ```
2. **NIS Role in Alumni Records**:
   * NIS is **not** a relational primary or foreign key in the alumni ecosystem.
   * It is archived as an immutable display string inside `transcript_data jsonb` (e.g., `{"nis": "2024.001", "gpa": 3.85}`).
3. **Cross-Tenant Alumni Verification**:
   * When an external entity verifies a diploma, verification queries must match:
     ```sql
     WHERE tenant_id = :verifying_tenant_id AND transcript_data->>'nis' = :nis
     ```
   * Querying by NIS alone across the entire platform would yield ambiguous student records if two alumni from different pesantren shared the same historic number.

---

## 11. Identity Consolidation Impact (TIR-009)

The TIR-009 Identity Consolidation process transitions active students (`{nis}@{tenant}.mahad.internal`) into verified guardian accounts (`user_tenant_personas`):

```text
               TIR-009 IDENTITY CONSOLIDATION SAGA
                                │
1. Active Student Authenticated via Synthetic NIS Credential:
   - auth.users.email: 00125@alfatih.mahad.internal
   - public.users.id:  usr_student_123
                                │
2. Challenge Confirmation via Guardian Email / OTP
                                │
3. GoTrue Admin Retires Student Credential
   - public.users.merged_into_user_id = target_wali_uid
                                │
4. Multi-Persona Activation
   - user_tenant_personas: (tenant_id, target_wali_uid, 'ALUMNI' or 'WALI')
```

### Impact of Tenant-Scoped NIS:
* **Zero Cross-Tenant Merging**: Because synthetic emails are explicitly partitioned by `{tenant_slug}`, student credentials from Tenant A and Tenant B are completely isolated in GoTrue.
* **Integrity Guard**: `identity_consolidation_ledgers` references `(tenant_id, santri_id)`. The consolidation worker cannot accidentally merge a Tenant B student sharing NIS `00125` into a Tenant A guardian.

---

## 12. API & Service Layer Impact

1. **`createSantriWithWali` (`src/modules/santri/services/santri-core-service.ts`)**:
   * Line 37 already enforces:
     ```ts
     .where(and(eq(santri.tenantId, tenantId), eq(santri.nis, santriData.nis)))
     ```
   * **Action Required**: Zero code changes required in this query. It already matches the intended contract.
2. **Universal Query API (`src/app/api/db/query/route.ts`)**:
   * When querying collection `santri`, the endpoint enforces:
     ```ts
     .where(eq(targetTable.tenantId, tenant.id))
     ```
   * If a client filters by NIS (`GET /api/db/query?collection=santri&nis=00125`), the query executes within `tenant.id` scope.
3. **Canteen POS API (`/api/canteen/pay`)**:
   * Uses RFID Card UID (`cardUid`) to lookup `rfid_cards.santriId`.
   * Does not use NIS for financial balance lookup.
   * Completely unaffected by NIS tenant scoping.

---

## 13. Repository Impact

If dedicated helper methods are implemented in future repository layers:

### Dangerous Contract (PROHIBITED):
```typescript
// UNSAFE: Violates tenant scoping; ambiguous across tenants
async function findSantriByNis(nis: string): Promise<Santri | null>;
```

### Mandatory Contract:
```typescript
// SAFE: Authoritatively partitions query by verified tenant context
async function findSantriByNis(tenantId: string, nis: string): Promise<Santri | null> {
  const records = await db
    .select()
    .from(santri)
    .where(and(eq(santri.tenantId, tenantId), eq(santri.nis, nis)))
    .limit(1);
  return records[0] || null;
}
```

---

## 14. Security & IDOR Impact

### Threat: Attacker Uses Tenant B NIS in Tenant A Context

```text
ATTACK VECTOR:
Attacker is authenticated in Tenant A.
Attacker knows that Tenant B has a VIP student with NIS "99999".
Attacker invokes: GET /api/santri/by-nis?nis=99999
```

### Security Boundary Evaluation:
1. **Case 1: Query Enforces `WHERE tenant_id = 'tenant_a' AND nis = '99999'`**:
   * Tenant A database partition is queried.
   * If Tenant A does not have a student with NIS `99999`, query returns `404 Not Found`.
   * **Result**: **ATTACK BLOCKED**. No data from Tenant B is exposed.
2. **Case 2: Defective Query Enforces `WHERE nis = '99999'` Alone**:
   * Database scans all students globally.
   * Matches Tenant B's VIP student.
   * Returns Tenant B student profile to Tenant A caller.
   * **Result**: **CRITICAL IDOR DATA LEAKAGE**.

**Architectural Rule**: NIS alone must never be used as a query lookup key on unprotected endpoints.

---

## 15. Information Disclosure Impact

```text
INFORMATION LEAKAGE SCENARIO:
Admin in Tenant A attempts to enroll student with NIS "2024.001".
```

1. **Under Current Database Defect (`UNIQUE (nis)` globally)**:
   * If Tenant B already enrolled `2024.001`, Tenant A receives:
     ```text
     "duplicate key value violates unique constraint 'santri_nis_unique'"
     ```
   * **Information Leaked**: Tenant A learns that another pesantren in the SaaS network has enrolled a student with that exact numbering.
2. **Under Corrective Contract (`UNIQUE (tenant_id, nis)`)**:
   * Tenant A enrolls `2024.001` successfully without error.
   * If Tenant A attempts to enroll `2024.001` a second time within Tenant A, the service returns:
     ```text
     "NIS 2024.001 sudah terdaftar pada lembaga ini."
     ```
   * **Result**: Zero cross-tenant existence leakage.

---

## 16. Migration Impact & Blockers

The execution of the DDL change to establish `UNIQUE (tenant_id, nis)` has strict prerequisite dependencies:

```text
                     MIGRATION DEPENDENCY CHAIN
                                  │
    [BLOCKER 1] Authoritative Historical Santri Tenant Mapping
                                  │
                                  ▼
    [BLOCKER 2] Prerequisite DDL: ALTER TABLE santri ADD COLUMN tenant_id
                                  │
                                  ▼
    [BLOCKER 3] Drop Global Unique Index: DROP INDEX santri_nis_unique
                                  │
                                  ▼
    [STEP 4] Apply Composite Uniqueness: UNIQUE (tenant_id, nis)
                                  │
                                  ▼
    [STEP 5] Apply Composite Foreign Keys on Child Tables
```

### Absolute Migration Rule:
Do **NOT** execute `DROP CONSTRAINT santri_nis_unique` or `ADD CONSTRAINT uq_santri_tenant_nis` in isolation. This alteration must be bundled directly into the core `WP-CORE-SANTRI-TENANTIZATION-001` work package when `tenant_id` is physically added to `public.santri`.

---

## 17. Native App Impact

```text
               NATIVE MOBILE UNIVERSAL LOGIN ARCHITECTURE
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
[GUARDIAN / TEACHER LOGIN]                         [ACTIVE SANTRI LOGIN]
- Authenticates via Email/Phone                    - Authenticates via NIS
- Global platform identity                         - Requires Tenant Selection
- Example: wali@gmail.com                          - Step 1: Select School (e.g. Al-Fatih)
- Server checks memberships                        - Step 2: Enter NIS (e.g. 00125)
                                                   - Formats: 00125@alfatih.mahad.internal
                                                   - Invokes Supabase signInWithPassword()
```

### Native App Contract:
Because NIS is non-unique platform-wide, the mobile user interface cannot authenticate a student by NIS alone. The login interface must capture:
1. `tenant_slug` (or school institution code);
2. `nis`;
3. `password`.

---

## 18. Cross-Tenant Collision Analysis

A formal matrix evaluates behavior when identical NIS values exist across tenants:

| Operation | Tenant A (NIS 00125) | Tenant B (NIS 00125) | Conflict? | Resolution Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Database Storage** | Row in `santri` | Row in `santri` | **No** | Composite constraint `UNIQUE (tenant_id, nis)` passes. |
| **GoTrue Auth Identity** | `00125@ten_a.mahad.internal` | `00125@ten_b.mahad.internal` | **No** | Synthetic email incorporates distinct tenant slug. |
| **RFID Canteen Pay** | Tied to `santri_id_A` | Tied to `santri_id_B` | **No** | RFID cards reference unique `santriId`, not NIS. |
| **Gate Checkpoint** | Tied to `santri_id_A` | Tied to `santri_id_B` | **No** | Gate passes reference unique `santriId`, not NIS. |
| **Academic Ledger** | Tied to `santri_id_A` | Tied to `santri_id_B` | **No** | Ledger records reference unique `santriId`, not NIS. |
| **Alumni Transcripts** | Archived for `santri_id_A` | Archived for `santri_id_B` | **No** | Snapshots bound to `(tenant_id, santri_id)`. |
| **Guardian Child Linking**| Linked to `santri_id_A` | Linked to `santri_id_B` | **No** | Relationships bound to `(tenant_id, wali, santri_id)`. |

---

## 19. Adversarial Scenario Matrix

| Scenario ID | Adversarial Action | Target System | Expected Architectural Response | Analysis Result |
| :--- | :--- | :--- | :--- | :--- |
| **NIS-ATTACK-01** | Tenant A searches for NIS `00125` when Tenant B also holds `00125`. | Search API | Server scopes query to `tenant_id = 'tenant_a'`. Returns only Tenant A student. | **PASS (SAFE)** |
| **NIS-ATTACK-02** | Caller sends `GET /santri?nis=00125` without tenant context. | API Gateway | Proxy / Middleware rejects request or enforces active session tenant context. | **PASS (SAFE)** |
| **NIS-ATTACK-03** | Attacker modifies request body to `tenantId = 'tenant_b', nis = '00125'`. | Mutation API | Server derives `tenantId` from verified session; discards or rejects body tenant. | **PASS (SAFE)** |
| **NIS-ATTACK-04** | Same NIS inserted into Tenant A and Tenant B. | PostgreSQL Catalog | Database allows both rows; `UNIQUE (tenant_id, nis)` evaluates true for both. | **PASS (SAFE)** |
| **NIS-ATTACK-05** | Same NIS inserted twice into Tenant A. | PostgreSQL Catalog | Database aborts second insert with unique constraint violation. | **PASS (SAFE)** |
| **NIS-ATTACK-06** | Guardian in Tenant A attempts linking to `(tenant_a, santri_id_from_tenant_b)`. | `wali-service.ts` | Service checks `santri.tenant_id == tenant_id`; rejects invalid relationship. | **PASS (SAFE)** |
| **NIS-ATTACK-07** | Student submits NIS `00125` on Native App universal login. | Native Login UI | App requires school code selection before generating synthetic email. | **PASS (SAFE)** |
| **NIS-ATTACK-08** | Two students in different tenants have identical NIS. | Supabase GoTrue | Emails are `00125@slug_a.mahad.internal` and `00125@slug_b.mahad.internal`; zero clash. | **PASS (SAFE)** |

---

## 20. Dependency Analysis

The architectural dependencies of the NIS tenant-scoping decision:

```text
1. WP-CORE-SANTRI-TENANTIZATION-001 (Must add santri.tenant_id NOT NULL)
   └── Prerequisite for:
       2. DDL Schema Adjustment: UNIQUE (tenant_id, nis)
          └── Prerequisite for:
              3. PSB SAT Automated Sequence Engine (tenant_nis_configurations)
                 └── Unlocks:
                     4. Full Gate 9 Authorization for WP-PSB-ALUMNI-SCHEMA-001
```

---

## 21. Regression Risk Analysis

| Affected Layer | Nature of Regression Risk | Mitigation Strategy |
| :--- | :--- | :--- |
| **Database Migrations** | Dropping `santri_nis_unique` fails if dependent constraints or indexes exist | Inspect `pg_constraint` and drop only the explicit single-column unique index. |
| **Existing Application Code** | Code assuming NIS is globally unique might omit `tenantId` in queries | Audit confirmed `santri-core-service.ts` already includes `tenantId`. Maintain strict review. |
| **Student Login on Mobile** | Students accustomed to typing only numbers may be confused by school selection | Provide school selector with search, logo branding, or persistent device memory. |
| **Bulk Import** | Uploading duplicate NIS within same tenant in Excel batch crashes whole transaction | Implement pre-validation in memory checking duplicate NIS within uploaded file rows. |

---

## 22. Required Remediation Areas

When implementation is authorized, remediation must be applied strictly to these areas:

1. **Drizzle Schema (`src/lib/db/schema.ts`)**:
   * Change line 55 from:
     ```typescript
     nis: text('nis').notNull().unique(),
     ```
     to:
     ```typescript
     nis: text('nis').notNull(),
     ```
   * Add composite unique constraint in table definition:
     ```typescript
     tenantNisUnique: unique('uq_santri_tenant_nis').on(table.tenantId, table.nis),
     ```
2. **Database Migration Script**:
   ```sql
   ALTER TABLE public.santri DROP CONSTRAINT IF EXISTS santri_nis_key;
   ALTER TABLE public.santri DROP CONSTRAINT IF EXISTS santri_nis_unique;
   ALTER TABLE public.santri ADD CONSTRAINT uq_santri_tenant_nis UNIQUE (tenant_id, nis);
   ```
3. **Native App Authentication Specification**:
   * Document requirement for School Code selection in mobile Santri login screens.

---

## 23. Open Questions for Product Owner

1. **School Code / Slug Selection on Native Mobile**:
   Does the Product Owner prefer students to select their pesantren via a searchable list, a numeric 4-digit institution code, or scanning a Pesantren QR code on their Student Card?
2. **Historical Duplicate NIS Baseline**:
   If production contains historical data, are there currently any duplicate NIS values across different pesantren that would be unlocked by this migration?

---

## 24. Final Architectural Contract

```text
================================================================================
EEOS NIS ARCHITECTURAL CONTRACT
================================================================================

1. NIS is tenant-scoped.
2. NIS is not globally unique across the platform.
3. The same NIS across different Tenants is fully valid and permitted.
4. The same NIS inside the same Tenant is strictly invalid and forbidden.
5. Database uniqueness target:
   UNIQUE (tenant_id, nis)
6. santri.id remains the internal database primary key.
7. NIS is a business identifier, not a platform identity.
8. Tenant context is the backend security partition.
9. NIS must never be used alone to cross or query a protected tenant boundary.
10. Native application authentication must resolve tenant context independently
    prior to submitting synthetic student credentials.
11. No NIS format change (e.g. adding tenant prefixes) is required or permitted.
12. Historical Santri tenant mapping must be authoritative before migration.
================================================================================
```

---

## 25. Governance Status

```text
WORK PACKAGE:
WP-NIS-TENANT-SCOPED-ARCHITECTURAL-DECISION-001

STATUS:
NIS TENANT-SCOPED DECISION ANALYSIS COMPLETE — READY FOR ARCHITECTURAL REVIEW

DATABASE:
100% UNCHANGED (READ-ONLY)

APPLICATION CODE:
100% UNCHANGED (READ-ONLY)

DRIZZLE SCHEMA:
100% UNCHANGED (READ-ONLY)

GIT:
100% UNCHANGED (ZERO COMMITS / ZERO PUSHES)

NEXT STEP:
SUBMIT TO PRODUCT OWNER & LEAD ARCHITECT FOR CONTRACT RATIFICATION
```
