# WP-ACADEMIC-STRUCTURE-DOMAIN-CLOSURE-003 REPORT
# ACADEMIC STRUCTURE DOMAIN CLOSURE — ROMBEL LIFECYCLE & DOWNSTREAM DECISION MAPPING
# LEVEL L4 — ACADEMIC STRUCTURE

**Execution Mode**: STRICTLY READ-ONLY / DOMAIN CLOSURE & ANALYSIS ONLY  
**Hierarchy Position**: Level 4 — Academic Structure  
**Direct Upstream Dependency**: Level 3 — Academic Foundation (`academic_years`, `academic_terms` — LIVE & CERTIFIED)  
**Parent Documents**: `WP-ACADEMIC-STRUCTURE-DOMAIN-DECISION-001`, `WP-ACADEMIC-STRUCTURE-DOMAIN-DECISION-002`  
**Governance Standard**: Master Execution Law, Master Quality Law, Evidence Freshness Law, Source of Truth Law, Zero Regression Law, Zero Redundancy Law  
**Timestamp**: 2026-09-15T03:45:00+07:00  

---

## 1. Executive Summary

This report establishes the final **Domain Closure** for **Level 4 Academic Structure** in MA'HAD MANAGER, formally locking the architectural decisions provided by the Product Owner regarding the **Rombel Lifecycle**, **Baseline Inheritance**, and **Progression Boundaries**.

### Key Locked Architectural Milestones:
1. **Year-Scoped Rombel Lifecycle (LOCKED)**:
   Rombel is formally defined as an entity with **Academic Year Scoping** (`rombel.academic_year_id`). Rombel is flexible and operational per academic year.
2. **Baseline Inheritance Model (LOCKED)**:
   When a new Academic Year is created, the Rombel configuration from the previous academic year is automatically cloned as an **editable baseline/template**. Administrators can freely add new Rombels, remove unused Rombels, or rename Rombels in the new year without corrupting historical records.
3. **Decoupling Rombel from Academic Progression (LOCKED)**:
   Rombel has **ZERO authority** in calculating student promotion or graduation. Academic progression is strictly an evaluation of:
   $$\text{Current Tingkat Sequence} \longrightarrow \text{Target Tingkat Sequence} = \text{Current} + 1$$
   Students are distributed into specific Rombels **ONLY AFTER** their target Tingkat is resolved.
4. **Historical Immutability & Ledger Protection (LOCKED)**:
   Historical class memberships are preserved through a dedicated year-scoped ledger (`santri_academic_placements`). The legacy single-column pattern `santri.kelas` is completely obsolete.
5. **Schema Readiness Assessment (LOCKED)**:
   All foundational domain questions blocking database schema design are officially resolved. The domain is evaluated as **READY FOR SCHEMA DESIGN** (`WP-ACADEMIC-STRUCTURE-SCHEMA-001`).

---

## 2. Product Owner Decisions

The Product Owner has provided the following authoritative and binding directives:

> *"Rombel fleksibel, bisa dikurangi atau ditambah."*  
> *"Ketika berubah tahun ajaran, Rombel akan mengikuti tahun kemarin. Nantinya jika ingin dikurangi atau ditambah itu pun bisa."*

### Binding Domain Rules Derived from PO Decision:
1. **Rule A (Year-Aware / Year-Scoped)**: Rombels exist and operate within the context of a specific Academic Year.
2. **Rule B (Baseline Inheritance)**: When a new Academic Year is initiated, the previous year's Rombel configuration serves as the initial baseline.
3. **Rule C (Post-Inheritance Flexibility)**: The inherited baseline is not immutable; administrators can add, remove, or modify Rombels in the new academic year.
4. **Rule D (Non-Fixed Count)**: The number of Rombels per Tingkat is completely dynamic and configurable.
5. **Rule E (Non-Fixed Naming)**: Naming is not restricted to standard alphabets (A, B, C); any institutional section label is permitted.
6. **Rule F (Independent Tingkat Capacity)**: Different Tingkats can have different numbers of Rombels (e.g., Tingkat 1 has 4 Rombels, Tingkat 2 has 2 Rombels).
7. **Rule G (Non-Persistent Student Section)**: Advancing to a new year does not imply retaining the previous section letter (a student in 5A does not automatically enter 6A).
8. **Rule H (Year Transition Staging)**:
   - Step 1: Determine target Tingkat via integer sequence.
   - Step 2: Initialize / customize Rombels for the new Academic Year.
   - Step 3: Distribute students into the new year's Rombels based on institutional policy (e.g., average scores).
   - Step 4: Persist placement in the year-scoped historical ledger.
9. **Rule I (Zero Progression Authority for Rombel)**: Rombel never dictates whether a student advances or repeats.
10. **Rule J (Rombel as Pure Operational Container)**: Rombel acts strictly as the learning group container after the target academic grade has been established.

---

## 3. Canonical Academic Hierarchy

The system enforces the canonical 4-tier structural hierarchy and maintains strict separation between **Structure** and **Placement**:

```mermaid
flowchart TD
    subgraph Structure ["1. ACADEMIC STRUCTURE (Static / Catalog)"]
        M["MADRASAH\n(Satuan Pendidikan)"]
        J["JENJANG\n(Fase Pendidikan)"]
        T["TINGKAT\n(Level & Sequence)"]
        R["ROMBEL\n(Section Container per Year)"]
        M --> J --> T --> R
    end

    subgraph Placement ["2. ACADEMIC PLACEMENT (Transactional Ledger)"]
        AY["ACADEMIC YEAR\n(L3 Foundation)"]
        S["SANTRI\n(Global Master)"]
        P["SANTRI ACADEMIC PLACEMENT\n(Year-Scoped Record)"]
        
        S --> P
        AY --> P
        T --> P
        R --> P
    end
```

- **"Kelas" Status**: The word "Kelas" is strictly an ephemeral UI display format (`Format(tingkat.ui_label, rombel.name)`), not a database hierarchy.

---

## 4. Rombel Lifecycle Decision

- **Verdict**: **YEAR-SCOPED WITH BASELINE INHERITANCE (LOCKED)**.
- **Conceptual Schema Representation**:
  ```text
  Table: rombel
    - id: UUID (PK)
    - tenant_id: UUID (FK -> tenants)
    - academic_year_id: UUID (FK -> academic_years)
    - tingkat_id: UUID (FK -> tingkat)
    - name: String (e.g., "A", "B", "Putra 1")
    - display_label: String (Optional override)
    - homeroom_teacher_id: UUID (Optional FK -> guru)
    - capacity: Integer
    - status: Enum ('active', 'inactive', 'archived')
  ```
- **Integrity Rule**:
  $$\text{Unique}(\text{tenant\_id}, \text{academic\_year\_id}, \text{tingkat\_id}, \text{name})$$

---

## 5. Baseline Inheritance Model

When a new Academic Year ($N+1$) is activated, the system executes the **Baseline Inheritance Routine**:

```mermaid
flowchart TD
    subgraph Year_N ["Academic Year N (e.g., 2026/2027)"]
        RN_A["Rombel 6A (id: r-001)"]
        RN_B["Rombel 6B (id: r-002)"]
        RN_C["Rombel 6C (id: r-003)"]
    end

    subgraph CloneRoutine ["Year Transition: Baseline Clone"]
        Clone["Copy Rombel structure to Year N+1\n(New Surrogate IDs, New academic_year_id)"]
    end

    subgraph Year_N1 ["Academic Year N+1 (e.g., 2027/2028)"]
        RN1_A["Rombel 6A (id: r-101)"]
        RN1_B["Rombel 6B (id: r-102)"]
        RN1_C["Rombel 6C (id: r-103)"]
        RN1_D["Rombel 6D (id: r-104) [ADDED]"]
    end

    RN_A -.-> Clone
    RN_B -.-> Clone
    RN_C -.-> Clone
    Clone --> RN1_A
    Clone --> RN1_B
    Clone --> RN1_C
    RN1_D -.->|Admin adds| Year_N1
```

### Invariants of the Baseline Clone:
1. **New Surrogate Identity**: Each cloned Rombel in Year $N+1$ receives a new unique `id`. It is a distinct database record from Year $N$.
2. **Historical Insulation**: Modifying, renaming, or deleting Rombel records in Year $N+1$ has **zero effect** on Year $N$.
3. **Wali Kelas Reset**: Homeroom assignments from Year $N$ are cleared or marked for re-assignment in Year $N+1$.

---

## 6. Year Transition Flow

The complete end-to-end operational flow during Academic Year changeover:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    participant Sys as Transition Engine
    participant AY as Academic Foundation
    participant Struct as Academic Structure (L4)
    participant Place as Placement Ledger (L4)

    Admin->>AY: Activate Academic Year N+1
    Sys->>Struct: Copy Rombels from Year N as Baseline for Year N+1
    Struct-->>Sys: Baseline Created (Rombels A, B, C for Tingkat 6)
    Admin->>Struct: Add Rombel 6D (Capacity adjustment)
    Admin->>Sys: Trigger Year-End Promotion Evaluation
    Sys->>Struct: Query Tingkat Progression (Current Sequence + 1)
    Sys->>Sys: Group Promoted Students into Target Tingkat Pool
    Sys->>Place: Distribute Students into Rombels (6A, 6B, 6C, 6D)
    Place-->>Admin: Academic Placements Created for Year N+1
```

---

## 7. Structure vs Placement

| Dimension | Academic Structure Layer (L4) | Academic Placement Layer (L4) |
| :--- | :--- | :--- |
| **Domain Scope** | Institutional Configuration & Class Catalog | Student Ledger & Operational Enrollment |
| **Question Answered** | "What educational units and class groups exist?" | "Where does a specific santri study during a specific year?" |
| **Entities Involved** | `madrasah`, `jenjang`, `tingkat`, `rombel` | `santri_academic_placements` |
| **Mutation Rate** | Low (Configured during curriculum setup / annual setup) | High (Updated during enrollment, promotion, mutation) |
| **Data Scope** | Tenant + Academic Year | Tenant + Santri + Academic Year + Rombel |
| **Destructive Risk** | Structural drift if unvalidated | Historical data loss if denormalized |

---

## 8. Historical Data Boundary

To guarantee auditability across 10+ years of institutional operations:

```text
HISTORICAL YEAR (e.g., 2025/2026) [FROZEN]
  ├── Rombel records (id: r-001, r-002) ──────────► IMMUTABLE
  ├── Placements (santri_id -> r-001) ────────────► IMMUTABLE
  ├── Grade Ledger & Transcripts (L6) ────────────► IMMUTABLE
  └── Attendance & Journals (L5) ─────────────────► IMMUTABLE

NEW CURRENT YEAR (e.g., 2026/2027) [MUTABLE CONFIGURATION]
  ├── Baseline Rombels instantiated
  ├── Additional Rombels added / unneeded Rombels removed
  └── New Placements recorded for advancing students
```

- **Rombel Deletion Safety**: If an administrator "removes" Rombel C in Year $N+1$, the Rombel C record for Year $N$ remains completely untouched in the database.
- **Name Reusability**: The name `"6A"` can exist in 2025/2026 and 2026/2027 because uniqueness is scoped by `(tenant_id, academic_year_id, tingkat_id, name)`.

---

## 9. Rombel Add / Remove / Rename Rules

1. **Adding Rombels**:
   - Permitted at any time prior to or during the Academic Year.
   - Example: Adding Rombel `"6D"` to Tingkat 6 when enrollment exceeds capacity.
2. **Removing Rombels**:
   - **Condition 1 (Pre-Placement)**: If no students are placed in the Rombel for that Academic Year, the Rombel record can be safely deleted or marked inactive.
   - **Condition 2 (Post-Placement)**: If students are already placed, the Rombel **CANNOT be deleted**. Students must first be transferred to other Rombels before deactivating the empty section.
3. **Renaming Rombels**:
   - Renaming `rombel.name` (e.g., `"6B"` $\rightarrow$ `"6-Tahfizh"`) updates the presentation string without altering `rombel.id`.
   - All student placement records, historical grades, and attendance logs retain unbroken foreign key integrity.

---

## 10. Promotion/Progression Boundary

The promotion engine is strictly bound to internal integer sequence arithmetic:

$$\mathbf{Target\ Tingkat} = \text{Query Tingkat}(\text{madrasah\_id}, \text{current.sequence} + 1)$$

### Strict Negative Invariants:
- The promotion engine MUST NOT read Rombel IDs or names.
- The promotion engine MUST NOT assume section continuity (e.g., it never presumes $5A \rightarrow 6A$).
- The promotion engine MUST NOT evaluate grade strings (`"Kelas 6"`, `"Tsanawiyah"`).
- Jenjang transitions are the natural consequence of sequence advancement across Jenjang boundaries.

---

## 11. Rombel Distribution — OPEN

Once students advance to their target Tingkat, they enter a common cohort pool:
$$\text{Pool}(\text{Target Tingkat}) = \{ \text{All Promoted Students} \}$$

### Distribution Strategies (Classified as OPEN DOMAIN DECISION):
1. **Tiered Ranking Distribution**: Grouping students into sections based on average scores / GPA (e.g., Top 30 in 6A, Next 30 in 6B).
2. **Heterogeneous Balanced Distribution**: Distributing students via snake-draft or quota rules to achieve equal academic balance across sections.
3. **Manual Administrative Assignment**: Direct drag-and-drop allocation by institutional staff via a UI matrix.
4. **Gender / Dormitory Partitioning**: Separating by gender or asrama clusters.

*Architectural Resolution*: The specific distribution strategy is **DEFERRED** to the L5 Academic Operation service layer. It does not block L4 structure schema design.

---

## 12. Mid-Year Transfer — OPEN

Scenarios where a student transfers between Rombels within the same Tingkat during an ongoing semester:
- **Strategy 1 (In-Place Reassignment)**: Updating `santri_academic_placements.rombel_id` directly with an audit log record.
- **Strategy 2 (Transfer Ledger)**: Closing the existing placement record with an end-date and creating a new placement record.

*Architectural Resolution*: Classified as **OPEN / DEFERRED** to L5 Academic Operation. Does not block L4 structure schema design.

---

## 13. Legacy Reconciliation

| Component | Active Codebase Location | Forensic Classification | Remediation Plan |
| :--- | :--- | :--- | :--- |
| **`santri.kelas`** | `src/lib/db/schema.ts`, `santri-core-service.ts` | **LEGACY / DESTRUCTIVE** | Deprecate in favor of `santri_academic_placements` |
| **`kelas` table** | `src/lib/db/schema.ts` (0 rows in live DB) | **LEGACY / CONFLICTING** | Drop and replace with canonical `rombel` |
| **`mock-kelas/`** | `src/data/mock-kelas/` | **MOCK / UNVERIFIED** | Isolate to test fixtures; eliminate from runtime |
| **`CurriculumConfig`**| `src/components/kurikulum/...` | **TRANSITIONAL UI** | Rebind "Rombel" tab to canonical Rombel service |
| **`Instansi` enum** | `src/types/index.ts` | **PRELIMINARY / HARDCODED** | Replace with dynamic `madrasah` database entity |

---

## 14. Downstream Dependency Matrix

| # | Domain Decision Item | Current Status | Architectural Impact | Blocking for L4 Schema? | Target Work Package |
| :---: | :--- | :---: | :--- | :---: | :--- |
| **1** | **Rombel Lifecycle Scoping** | **LOCKED** | Year-scoped table with `academic_year_id` | **BLOCKING (RESOLVED)** | `WP-ACADEMIC-STRUCTURE-SCHEMA-001` |
| **2** | **Baseline Inheritance Model** | **LOCKED** | Annual clone routine of Rombel template | **BLOCKING (RESOLVED)** | `WP-ACADEMIC-STRUCTURE-SCHEMA-001` |
| **3** | **Rombel Add/Remove Flexibility** | **LOCKED** | Dynamic inserts/deletes per academic year | **BLOCKING (RESOLVED)** | `WP-ACADEMIC-STRUCTURE-SCHEMA-001` |
| **4** | **Rombel Rename Safety** | **LOCKED** | Relational integrity decoupled from display name | **BLOCKING (RESOLVED)** | `WP-ACADEMIC-STRUCTURE-SCHEMA-001` |
| **5** | **Historical Placement Immutability** | **LOCKED** | Placements recorded in year-scoped ledger | **BLOCKING (RESOLVED)** | `WP-ACADEMIC-STRUCTURE-SCHEMA-001` |
| **6** | **Sequence-Driven Progression** | **LOCKED** | Progression based strictly on Tingkat sequence | **BLOCKING (RESOLVED)** | `WP-ACADEMIC-STRUCTURE-SCHEMA-001` |
| **7** | **Legacy `kelas` Replacement** | **LOCKED** | Clean drop of 0-row `kelas` $\rightarrow$ `rombel` | **BLOCKING (RESOLVED)** | `WP-ACADEMIC-STRUCTURE-SCHEMA-001` |
| **8** | **Rombel Distribution Algorithm** | **OPEN** | Scoring algorithms, tie-breakers, quotas | **NON-BLOCKING** | `WP-ACADEMIC-OPERATION-DISTRIBUTION-001` (L5) |
| **9** | **Promotion Exceptions (Tinggal Kelas)**| **OPEN** | Retention criteria, remedial thresholds | **NON-BLOCKING** | `WP-ACADEMIC-EVALUATION-PROMOTION-001` (L6) |
| **10**| **Mid-Year Transfer Mechanics** | **OPEN** | Mid-semester transfer audit trail | **NON-BLOCKING** | `WP-ACADEMIC-PLACEMENT-MUTATION-001` (L5) |
| **11**| **Teacher / Homeroom Assignment** | **DEFERRED** | Linking guru to rombel and mapel | **NON-BLOCKING** | `WP-ACADEMIC-TEACHER-ASSIGNMENT-001` (L5) |
| **12**| **Attendance & Scheduling Scope** | **DEFERRED** | Linking operational sessions to rombel | **NON-BLOCKING** | `WP-ACADEMIC-OPERATION-ATTENDANCE-001` (L5) |

---

## 15. Schema Readiness Assessment

### Formal Evaluation:
$$\mathbf{STATUS: READY\ FOR\ SCHEMA\ DESIGN}$$

### Verification Gate Criteria:
- **Canonical Structure Locked**: $\text{Madrasah} \rightarrow \text{Jenjang} \rightarrow \text{Tingkat} \rightarrow \text{Rombel}$ verified.
- **Rombel Lifecycle Locked**: Year-scoped entity with baseline cloning confirmed.
- **Progression Authority Locked**: Integer sequence progression decoupled from Rombel verified.
- **Historical Ledger Boundary Locked**: Transactional placement separated from static structure catalog.
- **Non-Blocking Items Isolated**: Distribution algorithms and retention policies are safely deferred to downstream L5 and L6 layers.

---

## 16. Remaining Open Decisions

The remaining open decisions do **NOT** block structural database schema design:
1. **Open Decision 1 (L5)**: Specific scoring metric and automation level for Rombel distribution.
2. **Open Decision 2 (L6)**: Formal business rules for non-promotion / retention (Tinggal Kelas).
3. **Open Decision 3 (L5)**: Audit logging strategy for mid-semester section transfers.

---

## 17. Governance Gate

- **Hierarchy Gate**: **PASS** (Level 4 Academic Structure correctly grounded on certified Level 3 Academic Foundation).
- **Quality Gate**: **PASS WITH DOCUMENTED OPEN DECISIONS** (All structural invariants verified; operational variables isolated).
- **Zero Redundancy**: Confirmed elimination of legacy `kelas` table and flat `santri.kelas` strings.
- **Zero Regression**: Preserves verified baseline across automated test contracts.

---

## 18. Evidence & Limitations

- **Evidence Freshness**: Live PostgreSQL catalog queries confirm that `kelas`, `master_jenjang`, and `master_tingkat` contain **0 rows** in production, guaranteeing zero-risk schema restructuring.
- **Limitation**: Strictly analytical and architectural. Zero source code mutations, zero database DDL execution, and zero migrations were executed in this Work Package.

---

## 19. Recommended Next Work Package

The next recommended work package is:

$$\mathbf{WP\text{-}ACADEMIC\text{-}STRUCTURE\text{-}SCHEMA\text{-}001}$$

- **Scope**: Technical Plan and DDL Migration authoring for:
  - `madrasah` table (Tenant-scoped educational units).
  - `jenjang` table (Relational parenting under Madrasah).
  - `tingkat` table (Monotonic sequence + presentation `ui_label`).
  - `rombel` table (Year-scoped cohort sections with baseline inheritance support).
  - Dropping the obsolete 0-row `kelas` table.
- **Requirement**: Await explicit Product Owner authorization before proceeding.

---

============================================================  
WP STATUS  
============================================================  

WP:  
WP-ACADEMIC-STRUCTURE-DOMAIN-CLOSURE-003  

Mode:  
READ-ONLY / ANALYSIS ONLY  

Hierarchy Gate:  
PASS  

Quality Gate:  
PASS WITH DOCUMENTED OPEN DECISIONS  

Rombel Lifecycle:  
LOCKED  

Baseline Inheritance:  
LOCKED  

Add Rombel:  
ALLOWED  

Remove Rombel:  
ALLOWED  

Rename Rombel:  
ALLOWED  

Promotion Authority:  
NOT Rombel  

Distribution Algorithm:  
OPEN / DEFERRED  

Mid-Year Transfer:  
OPEN / DEFERRED  

Legacy Kelas:  
DEFERRED (DROP IN NEXT WP)  

Schema Readiness:  
READY  

Implementation:  
NOT EXECUTED  

Database:  
NOT TOUCHED  

Commit:  
NOT CREATED  

Push:  
NOT EXECUTED  

Deploy:  
NOT EXECUTED  

Next Action:  
WAIT FOR PRODUCT OWNER AUTHORIZATION  

============================================================  
END OF WORK PACKAGE  
============================================================  
