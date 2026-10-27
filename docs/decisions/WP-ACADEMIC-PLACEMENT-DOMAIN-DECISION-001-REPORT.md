# WP-ACADEMIC-PLACEMENT-DOMAIN-DECISION-001-REPORT

**Work Package ID**: `WP-ACADEMIC-PLACEMENT-DOMAIN-DECISION-001`  
**Mode**: DOMAIN DISCOVERY / BUSINESS RULE DISCOVERY / ARCHITECTURE DECISION  
**Domain**: Academic Placement Ledger (Level-5 Foundation)  
**Date**: 2026-09-15  
**Execution Environment**: Local Workspace (Architecture & Domain Analysis Only)  
**Authority**: Product Owner Authorization for Domain Discovery Only  

---

## 1. Executive Summary

Following the formal closure and architecture freeze of **Level-4 Academic Structure** (`madrasah`, `jenjang`, `tingkat`, `rombel` via `WP-ACADEMIC-STRUCTURE-CLOSURE-001`), this document establishes the authoritative domain model, business rules, lifecycle transitions, and architectural invariants for **Level-5 Academic Placement**.

Academic Placement represents the historical and operational ledger that binds a Student (*Santri*) to a specific educational context (*Rombel* under a *Tingkat*, *Jenjang*, and *Madrasah*) for a specific *Academic Year*.

### Fundamental Domain Formulation:
$$\mathbf{Santri} + \mathbf{Academic\ Year} + \mathbf{Rombel} \Longrightarrow \mathbf{Academic\ Placement\ Record}$$

### Key Discoveries & Decisions:
1. **Separation of Structure vs. Ledger**: Academic Structure (L4) defines the slow-moving educational scaffolding. Academic Placement (L5) is a dynamic, event-driven ledger capturing annual student assignments, progression, transfers, and retentions over time.
2. **Multi-Madrasah Dual Enrollment**: In Islamic boarding schools (*Pesantren*), santri frequently participate in both formal schooling (e.g., MTs/MA) and religious/tahfizh programs (e.g., Madrasah Diniyah/Tahfizh) simultaneously. The placement identity permits dual enrollment across distinct Madrasahs while enforcing a strict single-active-placement rule within any single Madrasah per Academic Year.
3. **Immutability of Historical Placements**: When an academic year closes or a student transitions, historical placement records are permanently sealed. Kenaikan tingkat (*promotion*) and tinggal kelas (*retention*) never mutate past placement rows; they always generate distinct, new placement records in the target Academic Year.
4. **Decoupling of Progression from Sectioning**: Promotion is governed strictly by the monotonic sequence rule ($\text{sequence} + 1$) within a Madrasah. Rombel distribution is a secondary sectioning concern that occurs under the determined target Tingkat.

---

## 2. Authoritative Level-4 (L4) Prerequisite Confirmation

This domain discovery rests upon the immutable, frozen Level-4 Academic Structure foundation:

```
+-------------------------------------------------------------------------+
|                          TENANT (Pesantren)                             |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                              MADRASAH                                   |
| Configurable educational unit (e.g., MTs, MA, Diniyah, Tahfizh)         |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                              JENJANG                                    |
| Educational stage within Madrasah (e.g., Wustha, Ulya)                  |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                              TINGKAT                                    |
| Monotonic progression sequence + independent display ui_label           |
| Promotion invariant: next_sequence = current_sequence + 1               |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                              ROMBEL                                     |
| Year-scoped section under a Tingkat; NO authority over promotion        |
+-------------------------------------------------------------------------+
```

### Locked Constraints Preserved:
- **Rombel is Year-Scoped**: Every Rombel belongs to an `academic_year_id`.
- **Rombel has Zero Promotion Authority**: Students do not retain their Rombel when progressing. Moving from `5A` to `6B` is standard and expected.
- **"Kelas" is Pure Presentation**: The word "Kelas" is a display string formed by `Tingkat.ui_label + ' ' + Rombel.name` (e.g., "Kelas 7" + "A" = "Kelas 7A").
- **Zero Modification to L4**: No changes to `madrasah`, `jenjang`, `tingkat`, or `rombel` tables are permitted or required.

---

## 3. Placement Domain Definition

An **Academic Placement** is an authoritative ledger record establishing that a verified Santri is assigned to study within a specific Rombel during an Academic Year.

### 3.1 Conceptual Entity Responsibilities
- **Santri**: The student identity being educated.
- **Academic Year**: The temporal bounding box (e.g., 2026/2027).
- **Rombel**: The specific cohort section where daily academic activities, attendance, and grading take place.
- **Placement Record**: The historical contract connecting the student to the educational structure at that point in time.

### 3.2 What Placement Is NOT
- It is **not** an admission application (PMB/PSB record).
- It is **not** a student demographic profile.
- It is **not** a grading sheet or assessment ledger.
- It is **not** a dormitory/room assignment (*Kamar/Asrama* is an independent non-academic living assignment).

---

## 4. Section 1 — Placement Identity & Uniqueness Rules

### 4.1 Uniqueness Formulation
A critical domain question is: *What constitutes a duplicate placement?*

In a multi-tenant Islamic boarding school:
1. **Single Madrasah Invariant**: A student can only belong to **at most ONE active Rombel per Madrasah** in any given Academic Year.
2. **Multi-Madrasah Dual Enrollment**: A student **CAN** simultaneously belong to Rombel A in Madrasah Formal (MTs) and Rombel B in Madrasah Tahfizh during the same Academic Year.
3. **Mid-Year Historical Lineage**: If a student transfers from Rombel A to Rombel B mid-year, the historical record for Rombel A is closed (`TRANSFERRED`), and a new record for Rombel B becomes `ACTIVE`. Therefore, an unconditional database unique constraint on `(santri_id, academic_year_id, madrasah_id)` would prevent legitimate mid-year transfers.

### 4.2 Authoritative Identity Rule:
$$\text{Unique Active Rule: } \mathbf{UNIQUE(tenant\_id,\ santri\_id,\ academic\_year\_id,\ madrasah\_id)} \quad \text{WHERE } status = \text{'ACTIVE'}$$

- **Status**: **LOCKED DECISION**.
- **Rationale**: Guarantees that no student is double-counted in two active classes within the same educational unit, while naturally supporting both multi-madrasah dual enrollment and historical mid-year class transfers.

---

## 5. Section 2 — Placement Lifecycle & State Machine

A placement record progresses through a formal, deterministic lifecycle:

```
                 [Initial Assignment / PPDB]
                              │
                              ▼
                        ┌───────────┐
                        │   DRAFT   │
                        └─────┬─────┘
                              │
                    (Confirm / Year Start)
                              │
                              ▼
         ┌─────────────────────────────────────────┐
         │                 ACTIVE                  │
         └────┬───────────────┬───────────────┬────┘
              │               │               │
    (Year End Passed)  (Year End Retained) (Mid-Year Move)
              │               │               │
              ▼               ▼               ▼
        ┌───────────┐   ┌───────────┐   ┌───────────┐
        │ PROMOTED  │   │ RETAINED  │   │TRANSFERRED│
        └───────────┘   └───────────┘   └───────────┘
              │
      (Highest Tingkat)
              │
              ▼
        ┌───────────┐
        │ GRADUATED │
        └───────────┘
```

### 5.1 Formal States
| State | Type | Description |
| :--- | :--- | :--- |
| **`DRAFT`** | Initial / Staging | Placement assigned during planning or admissions, pending confirmation or academic year activation. |
| **`ACTIVE`** | Operational | Student is actively participating in this Rombel. Attendance, gradebooks, and daily operations bind to this record. |
| **`PROMOTED`** | Terminal (Historical) | Academic year completed; student met progression criteria and was promoted to the next Tingkat. |
| **`RETAINED`** | Terminal (Historical) | Academic year completed; student did not meet progression criteria and remains in the same Tingkat. |
| **`GRADUATED`** | Terminal (Historical) | Academic year completed at the highest Tingkat of the Madrasah; student graduated. |
| **`TRANSFERRED`** | Terminal (Historical) | Student moved to a different Rombel, different Madrasah, or exited mid-year. |
| **`CANCELLED`** | Voided | Erroneous draft placement cancelled prior to activation. |

### 5.2 State Transition Matrix
| From State | To State | Trigger Event | Authorized Actor | Preconditions |
| :--- | :--- | :--- | :--- | :--- |
| `DRAFT` | `ACTIVE` | Academic Year activation or manual confirmation | Academic Admin | Rombel active; Student active; Year active/planned |
| `DRAFT` | `CANCELLED` | Admission cancellation or correction | Academic Admin | Reason provided |
| `ACTIVE` | `PROMOTED` | End-of-year promotion approval | Kepala Madrasah / Pleno | Academic Year ending; Passing criteria met |
| `ACTIVE` | `RETAINED` | End-of-year retention approval | Kepala Madrasah / Pleno | Academic Year ending; Retention criteria met; Reason mandatory |
| `ACTIVE` | `GRADUATED` | End-of-year graduation approval | Kepala Madrasah / Pleno | Current Tingkat is terminal sequence of Madrasah |
| `ACTIVE` | `TRANSFERRED` | Mid-year class or school transfer | Academic Admin | Target Rombel identified; Effective date set; Reason mandatory |

- **Status**: **LOCKED DECISION**.

---

## 6. Section 3 — Academic Year Boundary Rules

1. **Active Window Enforcement**:
   - A placement is strictly operational (`ACTIVE`) only when its associated `academic_years.status = 'active'`.
   - When an Academic Year transitions to `'archived'`, all remaining `ACTIVE` placements for that year must be formally concluded (`PROMOTED`, `RETAINED`, `GRADUATED`, or `TRANSFERRED`). No active placements may linger in an archived year.
2. **Advance Staging (`DRAFT`)**:
   - Placements for an upcoming Academic Year whose status is `'planned'` may be created in advance under the `DRAFT` state.
   - Teachers and students cannot record operational attendance or assessments against `DRAFT` placements until the academic year is activated.
3. **Current vs. Historical Placement Query Rule**:
   - **Current Placement**:
     $$\text{Query: } santri\_id = X \land status = \text{'ACTIVE'} \land academic\_year.status = \text{'active'}$$
   - **Historical Placements**:
     $$\text{Query: } santri\_id = X \land status \in \{\text{'PROMOTED'}, \text{'RETAINED'}, \text{'GRADUATED'}, \text{'TRANSFERRED'}\} \quad \text{ORDER BY } academic\_year.start\_date \text{ ASC}$$

- **Status**: **LOCKED DECISION**.

---

## 7. Section 4 — Initial Placement (Santri Baru / PPDB)

For a newly enrolled student entering a tenant institution:
1. **Prerequisites**:
   - The student master record (`santri`) must exist with valid identity data and `status = 'ACTIVE'` (or `'REGISTERED'`).
   - The target `academic_years` record must exist.
   - The target `madrasah`, `jenjang`, `tingkat`, and `rombel` must exist.
2. **Entry Sequence**:
   - Admissions committee or Academic Admin assigns the student to an entry-level Tingkat (e.g., Sequence 1 for primary/tamhidi, or Sequence 7 for MTs).
   - Student is assigned to a specific Rombel (e.g., "7A").
   - Record is authored as `DRAFT` during registration season, or directly activated as `ACTIVE` upon official school start date.
3. **Batch Intake**:
   - Bulk CSV import of new santri must resolve target `(academic_year_id, tingkat_id, rombel_name)` and create corresponding initial placement rows.

- **Status**: **LOCKED DECISION**.

---

## 8. Section 5 — Promotion (Kenaikan Tingkat) Rules

Promotion adheres strictly to the frozen Level-4 monotonic progression model:

$$\mathbf{Next\ Tingkat\ Sequence} = \mathbf{Current\ Tingkat.sequence} + \mathbf{1} \quad (\text{within same Madrasah})$$

```
Academic Year N                                   Academic Year N+1
┌───────────────────────────┐                     ┌───────────────────────────┐
│ Placement (Year N)        │                     │ Placement (Year N+1)      │
│ Tingkat: 7 (Sequence: 7)  │ ── Promotion ───►   │ Tingkat: 8 (Sequence: 8)  │
│ Rombel: 7-A               │    Decision         │ Rombel: 8-B (Re-assigned) │
│ Status: PROMOTED (Sealed) │                     │ Status: ACTIVE            │
└───────────────────────────┘                     └───────────────────────────┘
```

### 8.1 Core Promotion Rules:
1. **Non-Mutating Progression**:
   Promotion **NEVER** overwrites the student's existing placement row. The existing row is transitioned to `status = 'PROMOTED'` and permanently sealed. A brand-new placement row is created for the new academic year.
2. **Approval-Based Pleno**:
   Promotion is an authorized, deliberative administrative action (Rapat Pleno Kenaikan Kelas). It is not an unverified automatic database trigger.
3. **Jenjang Boundary Crossing**:
   When a student completes the final Tingkat of a Jenjang (e.g., Tingkat 9 in Jenjang MTs Wustha), and the next sequence (Tingkat 10) belongs to Jenjang MA Ulya under the same Madrasah, promotion crosses the jenjang boundary naturally without manual exception handling.
4. **Terminal Sequence (Graduation)**:
   If no higher sequence exists within the Madrasah:
   - The student cannot be promoted to `sequence + 1`.
   - The placement concludes with `status = 'GRADUATED'`.
   - The student master record may subsequently transition to `'ALUMNI'`.

- **Status**: **LOCKED DECISION**.

---

## 9. Section 6 — Retention (Tinggal Kelas / Tidak Naik) Rules

When a student fails to satisfy academic or disciplinary criteria for progression:

```
Academic Year N                                   Academic Year N+1
┌───────────────────────────┐                     ┌───────────────────────────┐
│ Placement (Year N)        │                     │ Placement (Year N+1)      │
│ Tingkat: 7 (Sequence: 7)  │ ── Retention ───►   │ Tingkat: 7 (Sequence: 7)  │
│ Rombel: 7-A               │    Decision         │ Rombel: 7-B (Re-assigned) │
│ Status: RETAINED (Sealed) │                     │ Status: ACTIVE            │
└───────────────────────────┘                     └───────────────────────────┘
```

### 9.1 Core Retention Rules:
1. **New Record Generation**:
   Retention generates a **NEW** placement record in the subsequent Academic Year.
2. **Same Tingkat, Fresh Year-Scoped Rombel**:
   The new placement assigns the student to the **same Tingkat** (`sequence` unchanged), but under a Rombel belonging to the **new Academic Year**.
   - Example: Year 2026/2027 Rombel 7-A $\rightarrow$ Year 2027/2028 Rombel 7-B.
3. **Mandatory Documentation**:
   Retention requires an explicit administrative reason and approval metadata recorded in the ledger.
4. **Subsequent Eligibility**:
   In the following academic year, the retained student is fully eligible for normal promotion evaluation upon completing the repeat year.

- **Status**: **LOCKED DECISION**.

---

## 10. Section 7 — Rombel Distribution Domain Boundary

A strict architectural boundary is established between **Promotion Determination** and **Rombel Distribution**:

```
+-------------------------------------------------------------------------+
|                  STEP 1: PROMOTION DETERMINATION                        |
| - Evaluates academic performance and passing thresholds                 |
| - Resolves target Tingkat: sequence + 1 (or same sequence if retained)   |
| - Domain Layer: L5 Academic Placement Governance                       |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                  STEP 2: ROMBEL SECTIONING & DISTRIBUTION               |
| - Takes cohort of approved students for target Tingkat                  |
| - Distributes students across available year-scoped Rombels (A, B, C)   |
| - Considers capacity constraints, gender separation, dorm balancing     |
| - Domain Layer: L5/L6 Downstream Operational Service                    |
+-------------------------------------------------------------------------+
```

### Architectural Classification:
- **Promotion Determination**: **CORE L5 PLACEMENT DOMAIN**.
- **Distribution Algorithms (Random, Gender-based, Balanced, Manual Drag-and-Drop)**: **DOWNSTREAM OPERATIONAL SERVICE (DEFERRED)**.
- Rombel capacity (`rombel.capacity`) acts as a hard boundary check during distribution.

- **Status**: **LOCKED DECISION**.

---

## 11. Section 8 — Mid-Year Transfer Rules

Mid-year movement occurs in four distinct scenarios:

### 8.1 Scenario Matrix
| Transfer Type | Movement | Handling |
| :--- | :--- | :--- |
| **Type A: Intra-Madrasah Class Transfer** | Rombel 7-A $\rightarrow$ Rombel 7-B (same Tingkat & Madrasah) | Close current placement (`TRANSFERRED`, `ended_at = now()`, `reason`); Create new placement (`ACTIVE`, `effective_at = now()`, target Rombel). |
| **Type B: Intra-Tenant Madrasah Transfer** | Madrasah Formal $\rightarrow$ Madrasah Tahfizh Khusus | Close old Madrasah placement (`TRANSFERRED`); Create new placement in target Madrasah Tingkat/Rombel. |
| **Type C: Student Withdrawal / Exit** | Active in Rombel $\rightarrow$ Leaves Pesantren | Close current placement (`TRANSFERRED` or `WITHDRAWN`); Update Santri master status to `MUTASI` or `KELUAR`. |
| **Type D: External Student Admission Mid-Year** | External school $\rightarrow$ Enters mid-year | Create direct `ACTIVE` placement with `effective_at = admission_date`. |

### 8.2 Audit & Invariance:
- All mid-year transfers require an explicit `effective_date`, `transfer_reason`, and `authorized_by`.
- Historical placement is never deleted; attendance and marks recorded in the original Rombel remain permanently tethered to that historical placement interval.

- **Status**: **LOCKED DECISION**.

---

## 12. Section 9 — Multi-Madrasah Dual Placement Rules

Islamic boarding schools operate complex multi-curriculum systems. A single student may simultaneously pursue:
1. **Madrasah Formal** (Kemenag/Kemdikbud curriculum, e.g., MTs / SMP).
2. **Madrasah Diniyah / Salafiyah** (Kitab Kuning / Pesantren internal curriculum).
3. **Madrasah Tahfizh** (Hifzh Al-Quran halaqah system).

```
                              SANTRI: Ahmad (NIS: 1024)
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
     PLACEMENT 1 (Formal)                            PLACEMENT 2 (Tahfizh)
     Tenant: Pesantren Darussalam                    Tenant: Pesantren Darussalam
     Madrasah: MTs Darussalam                        Madrasah: Tahfizh Al-Quran
     Jenjang: Wustha                                 Jenjang: Marhalah 1
     Tingkat: Kelas 7 (Seq 7)                        Tingkat: Juz 1-5 (Seq 1)
     Rombel: 7-A                                     Rombel: Halaqah Al-Jazari
     Year: 2026/2027                                 Year: 2026/2027
     Status: ACTIVE                                  Status: ACTIVE
```

### Authoritative Business Constraints:
1. **Permitted**: Multiple concurrent `ACTIVE` placements across **DIFFERENT** Madrasahs within the same tenant and academic year.
2. **Forbidden**: Multiple concurrent `ACTIVE` placements within the **SAME** Madrasah.
3. **Independence of Progression**: Promotion in Madrasah Formal does not dictate or depend on promotion in Madrasah Tahfizh. Each Madrasah evaluates progression independently according to its own Tingkat sequence.

- **Status**: **LOCKED DECISION**.

---

## 13. Section 10 — Historical Immutability Guarantee

Historical placement data is subject to absolute immutability:
1. **Zero Retroactive Mutation**: Once an Academic Year is archived, no placement record belonging to that year may be updated, re-assigned, or deleted.
2. **Master Renaming Immunity**:
   - If Tingkat `sequence = 7` was labeled `"Kelas 7"` in 2024 and renamed to `"Kelas 7 Unggulan"` in 2027, the 2024 placement continues to represent the historical Tingkat at sequence 7.
   - If a Rombel is renamed or deactivated in a future year, historical placements pointing to past Rombel IDs remain completely unaffected.
3. **Hard Deletion Forbidden**: Placement ledger records must never be subjected to SQL `DELETE`. Voided or erroneous drafts must use `status = 'CANCELLED'`.

- **Status**: **LOCKED DECISION**.

---

## 14. Section 11 — Stored Facts vs. Derived Facts

To guarantee high relational integrity while avoiding redundant desynchronization:

| Fact / Field | Classification | Derivation / Storage Rationale |
| :--- | :--- | :--- |
| **`id`** | **STORED** | Immutable surrogate primary key. |
| **`tenant_id`** | **STORED** | Mandatory for SaaS tenant isolation and RLS scoping. |
| **`santri_id`** | **STORED** | Foreign key to student identity. |
| **`academic_year_id`** | **STORED** | Temporal bounding box for query performance & composite keys. |
| **`rombel_id`** | **STORED** | The authoritative structural assignment node. |
| **`status`** | **STORED** | Placement lifecycle state (`DRAFT`, `ACTIVE`, etc.). |
| **`effective_date`** | **STORED** | Date placement became active. |
| **`ended_date`** | **STORED** | Date placement concluded (or null if currently active). |
| **`outcome_reason`** | **STORED** | Audit explanation for promotion, retention, or transfer. |
| **`tingkat_id`** | **DERIVED** | Derived directly via `rombel.tingkat_id`. *(See Schema Note below)*. |
| **`jenjang_id`** | **DERIVED** | Derived via `tingkat.jenjang_id`. |
| **`madrasah_id`** | **DERIVED** | Derived via `tingkat.madrasah_id`. |
| **`kelas_display`** | **DERIVED** | Dynamically computed string: `tingkat.ui_label + ' ' + rombel.name`. |

> **Architectural Schema Note (For Future Schema WP)**:  
> While `madrasah_id` and `tingkat_id` are derived from `rombel`, storing `madrasah_id` as a denormalized composite foreign key `(tenant_id, madrasah_id)` may be evaluated during schema design solely to support the partial unique index:  
> `UNIQUE(tenant_id, santri_id, academic_year_id, madrasah_id) WHERE status = 'ACTIVE'`.  
> If not stored, uniqueness must be enforced via custom database constraint triggers or subqueries. This decision is reserved for `WP-ACADEMIC-PLACEMENT-SCHEMA-001`.

- **Status**: **LOCKED DECISION**.

---

## 15. Section 12 — Relationship to Legacy `santri.kelas`

The existing column `santri.kelas` (string) in `src/lib/db/schema.ts`:
- **Current State**: Contains flat, static string labels (e.g., `"7-A"`, `"1-B"`).
- **Architectural Status**: **LEGACY / PROTOTYPE / REQUIRES FUTURE MIGRATION**.
- **Target Replacement Model**:
  1. During active Level-5 operation, the canonical placement ledger `santri_academic_placements` becomes the sole source of truth for where a student is placed.
  2. For backward compatibility with legacy views, `santri.kelas` can be populated dynamically via a database view or maintained as a synchronized read-cache.
  3. When all downstream modules (attendance, finance, raport) are refactored to read from the placement ledger, `santri.kelas` will be formally deprecated and dropped.
- **Immediate Directive**: Do **NOT** remove, alter, or migrate `santri.kelas` in this work package.

- **Status**: **LOCKED DECISION**.

---

## 16. Section 13 — Audit & Provenance Requirements

Every placement lifecycle event must preserve immutable provenance:
1. **Creation Provenance**: `created_at` (timestamp), `created_by` (user ID / system actor).
2. **Transition Provenance**: `status_changed_at` (timestamp), `status_changed_by` (user ID).
3. **Change Justification**: `reason` (text, mandatory for retention and transfers).
4. **Effective Span**: `effective_date` (date), `ended_date` (date, nullable).
5. **System Integration**: Placements trigger an entry in the centralized audit log repository (`audit-repository.ts`).

- **Status**: **LOCKED DECISION**.

---

## 17. Section 14 — Edge Cases & Domain Invariant Matrix

| # | Edge Case Scenario | Expected Business Behavior | Classification |
| :--- | :--- | :--- | :--- |
| 1 | **Mid-Year Admission** | Creates `ACTIVE` placement with `effective_date = admission_date`. No historical row exists for earlier months. | **LOCKED DECISION** |
| 2 | **Mid-Year Departure** | Closes placement to `TRANSFERRED` or `WITHDRAWN`, sets `ended_date`. Historical attendance preserved. | **LOCKED DECISION** |
| 3 | **Mid-Year Class Swap** | Closes Rombel A (`TRANSFERRED`), opens Rombel B (`ACTIVE`). Both point to same Academic Year & Tingkat. | **LOCKED DECISION** |
| 4 | **Grade Retention** | Next year placement created with same Tingkat sequence. Previous year marked `RETAINED`. | **LOCKED DECISION** |
| 5 | **Jenjang Transition** | Promoted from final sequence of Jenjang A to initial sequence of Jenjang B within same Madrasah. | **LOCKED DECISION** |
| 6 | **Terminal Graduation** | No sequence + 1 exists in Madrasah. Record transitions to `GRADUATED`. Santri becomes Alumni. | **LOCKED DECISION** |
| 7 | **Rombel Disbanded / Reduced** | In new year rollover, students are re-distributed among surviving Rombels. Past Rombel remains in history. | **LOCKED DECISION** |
| 8 | **Rombel Capacity Exceeded** | Placement engine raises a business error / warning if target Rombel active count exceeds `capacity`. | **LOCKED DECISION** |
| 9 | **Academic Year Archived** | All placements in that year become permanently read-only and sealed. | **LOCKED DECISION** |
| 10 | **Multiple Madrasah Placement** | Allowed concurrently across different Madrasahs; forbidden within the same Madrasah. | **LOCKED DECISION** |
| 11 | **Student with Zero Placements** | Valid for newly registered or unassigned students. They appear in "Unassigned / Belum Ditempatkan" queue. | **LOCKED DECISION** |
| 12 | **Conflicting Active Placements** | Blocked at database constraint level by the unique active placement rule. | **LOCKED DECISION** |

---

## 18. Section 15 — Core Domain Invariants

The following invariants are absolute laws of the Academic Placement domain:

1. **The Scaffolding Primacy Invariant**:
   A placement cannot exist without a valid, pre-existing Madrasah, Jenjang, Tingkat, Academic Year, and Rombel.
2. **The Non-Mutating Progression Invariant**:
   Progression (promotion, retention, graduation) across academic years **never** mutates historical placement rows; it strictly appends new rows.
3. **The Single Active Unit Invariant**:
   A student may hold at most **one** `ACTIVE` placement in any given Madrasah during a specific Academic Year.
4. **The Monotonic Promotion Invariant**:
   Standard promotion within a Madrasah strictly moves a student from Tingkat sequence $S$ to sequence $S + 1$.
5. **The Rombel Agnostic Invariant**:
   Rombel identity carries zero authority over whether a student is promoted or retained.
6. **The Tenant Boundary Invariant**:
   A placement record cannot link a Santri of Tenant X to an Academic Structure of Tenant Y. All foreign keys must enforce composite tenant scoping `(tenant_id, ...)`.

---

## 19. Section 16 — Redundancy & Existing Schema Audit

Inspection of current repository entities:
- **`santri.status`** (`src/modules/santri/domain/state-machine.ts`): Represents the general enrollment status of the person (`ACTIVE`, `SUSPENDED`, `ALUMNI`, `TRANSFERRED`). This is **REUSED** as a prerequisite check for placement.
- **`asrama` & `kamar`** (`src/lib/db/schema.ts`): Represents residential lodging. Independent of academic placement. **RETAIN AS SEPARATE DOMAIN**.
- **`santri.kelas`**: Flat string. **DEPRECATE IN FAVOR OF PLACEMENT LEDGER**.
- **`StatusChangeRecord`** (`src/modules/santri/domain/value-objects.ts`): Contains `EntityType = 'PLACEMENT'`. The placement ledger will integrate with this audit trail mechanism.
- **Decision**: **CREATE NEW** table `santri_academic_placements` during the subsequent Schema WP. No existing table can or should be overloaded to serve as the historical placement ledger.

---

## 20. Section 17 — Authoritative Source of Truth Matrix

| Domain Concept | Authoritative Entity / Source of Truth |
| :--- | :--- |
| **Student Identity & Demographics** | `santri` table |
| **Student Enrollment Lifecycle** | `santri.status` & `StatusChangeRecord` |
| **Academic Temporal Boundaries** | `academic_years` & `academic_terms` |
| **Educational Institution Units** | `madrasah` table |
| **Educational Tiers & Stages** | `jenjang` table |
| **Monotonic Progression Levels** | `tingkat` table (`sequence`) |
| **Class Sections / Study Groups** | `rombel` table (`year-scoped`) |
| **Classroom Display String ("Kelas")** | Derived presentation (`tingkat.ui_label` + `rombel.name`) |
| **Student Academic Assignment & History** | **`santri_academic_placements` (Placement Ledger)** |

---

## 21. Section 18 — Open Decisions (Product Owner Review Required)

The following architectural trade-offs are submitted for Product Owner decision:

### `OPEN-DECISION-001`: Denormalization of `madrasah_id` on Placement Ledger
- **Context**: `madrasah_id` is mathematically derivable via `rombel $\rightarrow$ tingkat $\rightarrow$ madrasah`.
- **Option A (Pure Normalization)**: Store only `(tenant_id, santri_id, academic_year_id, rombel_id)`. Enforce the single-active-placement-per-madrasah rule via a custom database trigger or application transaction check.
- **Option B (Recommended — Constrained Denormalization)**: Store `madrasah_id` directly on the placement row with a composite foreign key `(tenant_id, madrasah_id)`, enabling a native PostgreSQL partial unique index:
  `CREATE UNIQUE INDEX ON santri_academic_placements (tenant_id, santri_id, academic_year_id, madrasah_id) WHERE status = 'ACTIVE';`
- **Product Owner Choice Required**: Approve Option B for database-level concurrency safety or Option A for zero denormalization.

### `OPEN-DECISION-002`: Minimum Required Duration for Mid-Year Placements
- **Context**: If a student is assigned to Rombel 7-A for 3 days and moved to Rombel 7-B, should the 3-day assignment be preserved as a permanent historical placement or corrected in-place?
- **Option A**: All activated placements create permanent audit history regardless of duration.
- **Option B (Recommended)**: Placements modified within a short grace period (e.g., 7 days of school start) can be edited or cancelled before being sealed into permanent history.
- **Product Owner Choice Required**: Confirm grace period policy.

---

## 22. Section 19 — Locked Decisions Summary

1. Canonical L4 hierarchy (`madrasah` $\rightarrow$ `jenjang` $\rightarrow$ `tingkat` $\rightarrow$ `rombel`) is permanently locked and unchanged.
2. Academic Placement is modeled as an append-only ledger (`santri_academic_placements`).
3. Dual placement across different Madrasahs within the same tenant is officially supported.
4. Concurrency rule: Maximum of ONE active placement per student per Madrasah per Academic Year.
5. Promotion strictly follows `current_tingkat.sequence + 1` within the same Madrasah.
6. Historical placements are immutable; cross-year progression appends new rows.
7. Rombel distribution algorithms are decoupled from structural placement identity.
8. "Kelas" remains a derived display string.

---

## 23. Section 20 — Deferred Decisions (Out of Scope)

The following areas are explicitly deferred to downstream operational work packages:
1. **Rombel Distribution Algorithms**: Optimization logic for student balancing (gender, academic scores, dormitory cohorts).
2. **Batch Rollover Automation**: UI wizard for bulk end-of-year promotion and class copying.
3. **Homeroom Teacher Assignment**: Linking teachers (`guru`) to Rombels (`wali_kelas`).
4. **Historical Legacy Data Migration**: Strategy for migrating legacy `santri.kelas` strings to historical placement rows.
5. **Database Role Hardening**: Unprivileged connection role architecture.

---

## 24. Section 21 — Recommended Next Work Package

Upon Product Owner review and closure of open decisions, the recommended next work package is:

### **`WP-ACADEMIC-PLACEMENT-SCHEMA-001`**
- **Objective**: Design the formal database schema and migration specification for `santri_academic_placements`.
- **Key Deliverables**:
  - DDL specification for table, columns, composite unique keys, and composite foreign keys.
  - Check constraints for lifecycle status (`DRAFT`, `ACTIVE`, `PROMOTED`, `RETAINED`, `GRADUATED`, `TRANSFERRED`, `CANCELLED`).
  - Drizzle ORM schema definition (`src/lib/db/schema/academic_placement.ts`).
  - RLS policies and `FORCE RLS` specification.
  - Zero code/DDL implementation until authorized.

---

## 25. Section 22 — Governance & Safety Verification

- **Codebase Mutations**: ZERO (0) source files modified.
- **Database Alterations**: ZERO (0) DDL or DML statements executed.
- **Git State**: Clean; no `commit`, `push`, `merge`, or `deploy` executed.

---

## FINAL STATUS

```
================================================================================
DOMAIN DECISION COMPLETE
(All core domain areas analyzed; 2 formal Open Decisions submitted for PO review)
================================================================================
```
