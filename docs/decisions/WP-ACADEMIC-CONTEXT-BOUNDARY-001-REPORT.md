# WP-ACADEMIC-CONTEXT-BOUNDARY-001-REPORT

**Work Package ID**: `WP-ACADEMIC-CONTEXT-BOUNDARY-001`  
**Title**: Academic Context & Madrasah Boundary — Domain Architecture Refinement  
**Mode**: DOMAIN ARCHITECTURE REFINEMENT ONLY  
**Authority**: Product Owner / Business Owner  
**Date**: 2026-09-15  
**Execution Environment**: Local Workspace (Architecture Analysis & Domain Refinement Only)  
**Parent Foundation**: `WP-ACADEMIC-STRUCTURE-CLOSURE-001`, `WP-ACADEMIC-PLACEMENT-DOMAIN-DECISION-001`, `WP-ACADEMIC-PLACEMENT-DOMAIN-REFINEMENT-002`  

---

## 1. Executive Summary

This domain refinement formally validates, codifies, and locks the fundamental architectural law of the APP MA'HAD SaaS platform:
> **Madrasah merupakan Batas Kedaulatan Akademik (Academic Governance Boundary).**

In an Islamic boarding school (*Pondok Pesantren*), a **Tenant** represents the organizational, legal, and financial container (the boarding school foundation). However, the **Madrasah** is the sovereign academic authority. A single tenant frequently operates multiple distinct educational units simultaneously (e.g., Madrasah Tsanawiyah, Madrasah Aliyah, Madrasah Diniyah Salafiyah, and Madrasah Tahfizh Al-Qur'an).

Each Madrasah possesses its own educational identity, regulatory framework, curriculum, grading standards, and—most crucially—**its own independent Academic Calendar and Academic Year lifecycle**.

### Core Architectural Theorem:
$$\mathbf{Tenant} \xrightarrow{\quad\text{Contains}\quad} \mathbf{Madrasah\ (Academic\ Governance\ Boundary)} \xrightarrow{\quad\text{Owns}\quad} \mathbf{Academic\ Calendar} \xrightarrow{\quad\text{Defines}\quad} \mathbf{Academic\ Year} \xrightarrow{\quad\text{Schedules}\quad} \mathbf{Academic\ Period}$$

### Key Architectural Shifts Established:
1. **Rejection of the Single Global Calendar Anti-Pattern**: The platform formally rejects the assumption that $1\ \text{Tenant} = 1\ \text{Academic Calendar}$. Forcing multiple madrasahs to share identical calendar start/end dates, exam periods, and rollover events causes operational failure in real pesantren.
2. **Tripartite User Modeling (Identity $\neq$ Academic Membership $\neq$ Teaching Assignment)**: Users (teachers and students) have a single identity across the tenant, but hold distinct, independent academic memberships and assignments within each Madrasah.
3. **Multi-Madrasah Student & Teacher Sovereignty**: A student may concurrently study in Madrasah A (Tingkat 2) and Madrasah B (Tingkat 1) without their progression, marks, ranking, or report cards ever contaminating each other. A teacher may teach in Madrasah A and Madrasah B under different roles and assignments.
4. **Zero Cross-Madrasah Contamination**: All academic ledgers, gradebooks, assessments, exams, transcripts, rankings, and placement transit pools are strictly bounded by the Madrasah context.

---

## 2. Business Rules (Established by Product Owner)

The following statements represent immutable business facts established by the Product Owner for all current and downstream system architecture:

### Rule 2.1 — Multi-Madrasah Tenant
A Tenant/Pondok can operate multiple educational institutions:
- Madrasah A (e.g., MTs Formal)
- Madrasah B (e.g., MA Formal)
- Madrasah C (e.g., Madrasah Tahfizh)
- Madrasah D (e.g., Madrasah Diniyah Salafiyah / Takhasus)

The presence of multiple madrasahs within one tenant does **not** imply that they share the same curriculum, academic calendar, or grading lifecycle.

### Rule 2.2 — Madrasah is an Academic Governance Boundary, Not a Physical Label
Madrasah is **never** to be modeled as a mere building, physical branch, campus room, or organizational tag. A Madrasah is an **autonomous academic governing body** possessing legal and pedagogical authority over its students, teachers, curricula, and evaluative credentials.

### Rule 2.3 — Sovereign Academic Calendar per Madrasah
**Every Madrasah has its own Academic Calendar.**  
Specifically, each Madrasah possesses:
- Its own Academic Calendar schedule.
- Its own Academic Year lifecycle (which may start/end on different dates, or follow Hijri vs. Gregorian cycles).
- Its own Academic Periods (Semesters, Caturwulan, or Marhalah).
- Its own distinct start and end dates.
- Its own academic events, lesson periods, exam schedules, remedial blocks, and report card distribution dates (*pembagian rapor*).
- Its own academic holiday schedules.

The platform must never force all madrasahs of a tenant into an identical calendar matrix.

---

## 3. Madrasah as Academic Governance Boundary

To ensure rigorous multi-tenant enterprise isolation, the platform establishes a two-tiered governance model:

```
+─────────────────────────────────────────────────────────────────────────+
|                      TIER 1: TENANT GOVERNANCE                          |
|             (Organization, Identity, Finance, Housing, Core)           |
+─────────────────────────────────────────────────────────────────────────+
| • Multi-Tenant Subscriptions & Billing                                  |
| • Global User Identity & Authentication (Supabase Auth / Users)          |
| • Student Master Demographics & Family Registry (Santri, Wali)          |
| • Dormitory & Room Residential Management (Asrama, Kamar)               |
| • Campus Gate & Security Checkpoints (Gate RFID, Perizinan Keluar)      |
| • Campus Health Clinic & UKS (Kunjungan, Izin Berobat)                  |
| • Non-Academic Platform Settings, Payment Gateways, WA Gateways          |
+─────────────────────────────────────────────────────────────────────────+
                                    │
                                    ▼
+─────────────────────────────────────────────────────────────────────────+
|                  TIER 2: MADRASAH ACADEMIC GOVERNANCE                   |
|                   (Sovereign Academic Boundary)                         |
+─────────────────────────────────────────────────────────────────────────+
| • Academic Calendar & Event Scheduling                                  |
| • Academic Year Lifecycle & Term/Semester Definitions                   |
| • Educational Stages & Levels (Jenjang, Tingkat Sequence & Labels)      |
| • Course Catalog & Subject Definitions (Mata Pelajaran, Kurikulum)      |
| • Class Sections & Study Cohorts (Rombel)                               |
| • Student Academic Placement & History (Placements, Transit Pools)       |
| • Teacher Academic Memberships & Teaching Assignments                   |
| • Daily Lessons, Attendance, & Student Journaling                       |
| • Assessment Events, Exams, Scoring Schemes, Gradebooks                 |
| • Academic Transcripts, Report Cards (Rapor), Class Rank                |
| • Promotion Pleno Decisions, Retention Rules, Graduation                |
+─────────────────────────────────────────────────────────────────────────+
```

---

## 4. Academic Sovereignty per Madrasah

Academic Sovereignty dictates that **data and events within one Madrasah have zero operational impact, leakage, or authority over another Madrasah**:

1. **Isolation of Grading and Transcripts**:
   Grades earned in Madrasah A (e.g., MTs) can never be aggregated, factored into, or referenced by Madrasah B (e.g., Tahfizh) unless an explicit cross-madrasah composite report is authorized by the Product Owner.
2. **Isolation of Promotion Lifecycle**:
   A student failing a grade level in Madrasah Tahfizh (retained in Tingkat 1) does **not** hold back their promotion in Madrasah MTs (promoted to Tingkat 2). Each academic progression engine runs strictly within its Madrasah boundary.
3. **Temporal Sovereignty**:
   Madrasah A closing its first semester in December has zero effect on Madrasah B, which may run on an Islamic Hijri calendar closing in Sya'ban. Neither calendar triggers cascade locks on the other.

---

## 5. Academic Context Model

To execute any query, service, or user action within the academic domain, the application runtime must assemble a fully qualified **Academic Context**:

$$\mathbf{AcademicContext} = \left\langle \mathbf{TenantID},\; \mathbf{MadrasahID},\; \mathbf{AcademicYearID},\; \mathbf{AcademicPeriodID} \right\rangle$$

### Hierarchical Scoping Matrix across Domains:
| Domain Entity / Aggregate | Required Context Boundary | Inherited / Derived Context |
| :--- | :--- | :--- |
| **User Identity** (`users`, `santri`, `guru`) | `TenantID` | None (Global within Tenant) |
| **Dormitory Lodging** (`asrama`, `kamar`) | `TenantID` | None (Residential, Non-Academic) |
| **Madrasah Institution** (`madrasah`) | `TenantID` + `MadrasahID` | Root of Academic Boundary |
| **Academic Calendar** | `TenantID` + `MadrasahID` | Root of Academic Timing |
| **Academic Year** | `TenantID` + `MadrasahID` + `AcademicYearID` | Bound to Madrasah Calendar |
| **Academic Period / Term** | `TenantID` + `MadrasahID` + `AcademicYearID` + `PeriodID` | Bound to Academic Year |
| **Jenjang & Tingkat** | `TenantID` + `MadrasahID` | Bound to Madrasah Structure |
| **Rombel (Class Section)** | `TenantID` + `MadrasahID` + `AcademicYearID` + `TingkatID` | Bound to Tingkat & Year |
| **Student Placement** | `TenantID` + `MadrasahID` + `AcademicYearID` + `RombelID` | Bound to Student, Year, Rombel |
| **Transit Pool** | `TenantID` + `MadrasahID` + `AcademicYearID` + `TingkatID` | Staging Queue per Tingkat |
| **Curriculum & Mapel** | `TenantID` + `MadrasahID` | Course Catalog per Madrasah |
| **Teaching Assignment** | `TenantID` + `MadrasahID` + `AcademicPeriodID` + `RombelID` | Teacher + Mapel + Class |
| **Assessment & Exams** | `TenantID` + `MadrasahID` + `AcademicPeriodID` + `RombelID` | Gradebook per Section & Term |
| **Report Card & Transcript** | `TenantID` + `MadrasahID` + `AcademicPeriodID` + `SantriID` | Evaluative Outcome per Term |

---

## 6. Academic Calendar Domain

### 6.1 Calendar Ownership
The Academic Calendar is owned strictly by the **Madrasah**:
- Tenant-level calendars do **not** exist as operational entities.
- A Tenant is an administrative container holding $N$ Madrasahs, each of which holds its own Academic Calendar.

### 6.2 Calendar Hierarchy:
```
MADRASAH
   └── ACADEMIC CALENDAR
          └── ACADEMIC YEARS (e.g., 2026/2027)
                 ├── ACADEMIC PERIODS / TERMS (e.g., Semester 1, Semester 2)
                 └── ACADEMIC EVENTS (Events, Exams, Holidays, Deadlines)
```

### 6.3 Academic Event Classification
Every event in the calendar carries an operational type that governs system behavior:
1. **Lifecycle Markers**:
   - `ACADEMIC_YEAR_START`, `ACADEMIC_YEAR_END`
   - `TERM_START`, `TERM_END`
2. **Instructional Boundaries**:
   - `INSTRUCTIONAL_DAYS_START`, `INSTRUCTIONAL_DAYS_END` (Enforces attendance tracking window)
3. **Assessment & Grading Windows**:
   - `MID_TERM_EXAM_WINDOW` (Activates mid-term scoring workflows)
   - `FINAL_EXAM_WINDOW` (Activates final exam gradebook entry)
   - `GRADE_SUBMISSION_DEADLINE` (Locks teacher grade inputs)
   - `REPORT_CARD_DISTRIBUTION` (*Hari Pembagian Rapor*)
4. **Institutional Pauses**:
   - `ACADEMIC_RECESS` (Holidays / Libur Semester)
   - `RELIGIOUS_OBSERVANCE` (Ramadhan break, Libur Idul Fitri)

---

## 7. Academic Year & Academic Period

### 7.1 Gap Analysis with Current Codebase
A forensic inspection of `src/lib/db/schema/academic_workspace.ts` reveals a critical architectural gap:

```text
CURRENT IMPLEMENTATION:
Table: academic_years
Columns: id, tenant_id, name, start_date, end_date, status
Constraint: uniqueIndex('uq_academic_years_tenant_active').on(table.tenantId).where(sql`status = 'active'`)

DOMAIN RULE:
Each Madrasah has its own Academic Calendar and Academic Year context. A tenant can have multiple madrasahs running concurrently.

GAP:
academic_years is scoped only by tenant_id. The partial unique index uq_academic_years_tenant_active permits only ONE active academic year for the entire tenant globally.

RISK:
If Tenant X activates Academic Year 2026/2027 for Madrasah MTs, activating 2026/2027 for Madrasah Tahfizh crashes with a PostgreSQL unique constraint collision!

RECOMMENDED FUTURE ACTION:
academic_years must be refactored to include madrasah_id, and the unique constraint must become:
UNIQUE (tenant_id, madrasah_id) WHERE status = 'active'.
(Documented as a Schema Consequence for a dedicated future work package).
```

### 7.2 Independent Year Lifecycles (Scenario A Validation)
- **Madrasah A (MTs Formal)**:
  - Academic Year: `2026/2027`
  - Start Date: `2026-07-15`, End Date: `2027-06-25`
  - Terms: Semester Ganjil (`2026-07-15` to `2026-12-20`), Semester Genap (`2027-01-05` to `2027-06-25`)
- **Madrasah B (Tahfizh / Diniyah)**:
  - Academic Year: `1447/1448 H` (or `2026/2027`)
  - Start Date: `2026-08-01`, End Date: `2027-05-15`
  - Terms: Caturwulan 1, Caturwulan 2, Caturwulan 3
- **Architectural Validation**: Both lifecycles run side-by-side in the same database without shared state or conflicting date checks.

---

## 8. Identity vs. Academic Membership vs. Academic Assignment

The platform establishes an absolute separation between the human being, their institutional affiliation, and their operational duties:

```
+─────────────────────────────────────────────────────────────────────────+
|                        LAYER 1: USER IDENTITY                           |
|       (Who the human is — Global across Tenant, Single Source)          |
|                                                                         |
|  * Table / Entity: users, santri, guru                                  |
|  * Attributes: ID, NIS/NIP, Name, Gender, Auth Credentials, Contacts    |
+─────────────────────────────────────────────────────────────────────────+
                                    │
                                    ▼
+─────────────────────────────────────────────────────────────────────────+
|                     LAYER 2: ACADEMIC MEMBERSHIP                        |
|       (Where the user belongs — Affiliation to a specific Madrasah)     |
|                                                                         |
|  * Entity: Madrasah Membership / Enrollment                             |
|  * Attributes: TenantID, MadrasahID, UserID, Role, Status, JoinDate     |
|  * Multiplicity: One Identity can have MANY Academic Memberships       |
+─────────────────────────────────────────────────────────────────────────+
                                    │
                                    ▼
+─────────────────────────────────────────────────────────────────────────+
|                     LAYER 3: ACADEMIC ASSIGNMENT                        |
|   (What the user does — Specific operational duties in a Rombel/Year)   |
|                                                                         |
|  * Student Assignment: santri_academic_placements (Rombel, Tingkat)     |
|  * Teacher Assignment: teacher_assignments (Mapel, Rombel, Term)        |
+─────────────────────────────────────────────────────────────────────────+
```

---

## 9. Teacher Multi-Madrasah (Scenario C Validation)

### 9.1 The Multi-Institution Teacher Scenario
Ustaz Abdullah:
- **Identity**: `user_id = "usr_abdullah_01"`, `guru_id = "guru_01"`
- **Academic Memberships**:
  - Member of `Madrasah MTs` (Role: Guru Pengajar)
  - Member of `Madrasah MA` (Role: Guru Pengajar & Wali Kelas)
- **Teaching Assignments**:
  - In `Madrasah MTs`: Teaches *Bahasa Arab* in Rombel `8-A` and `8-B`.
  - In `Madrasah MA`: Teaches *Ushul Fiqh* in Rombel `11-IPA` and serves as *Wali Kelas 11-IPA*.

### 9.2 Tracing Gap in Legacy Code:
```text
CURRENT IMPLEMENTATION:
Table: guru
Column: ranahInstansi text('ranah_instansi')
Result: Forces a teacher to belong to a single static string ('Formal' or 'Pesantren').

DOMAIN RULE:
Teachers hold one Identity with multiple Academic Memberships and Teaching Assignments across madrasahs.

GAP:
A flat string on the guru table blocks multi-madrasah assignment.

RECOMMENDED FUTURE ACTION:
Replace ranahInstansi with an explicit many-to-many relationship (madrasah_teachers / teacher_assignments scoped by madrasah_id).
```

---

## 10. Santri Multi-Madrasah (Scenario B Validation)

### 10.1 The Dual-Curriculum Student Scenario
Santri Muhammad Farhan:
- **Identity**: `santri_id = "san_farhan_01"`, `nis = "102456"`
- **Academic Context 1 (Madrasah MTs)**:
  - Jenjang: *Wustha*
  - Tingkat: *Tingkat 2 (Kelas 8)*
  - Rombel: `8-A`
  - Kurikulum: *Kurikulum Nasional MTs*
  - Nilai: Rata-rata $88.50$
  - Rapor: *Buku Laporan Hasil Belajar MTs Semester 1*
- **Academic Context 2 (Madrasah Tahfizh)**:
  - Jenjang: *Tahfizh Dasar*
  - Tingkat: *Tingkat 1 (Marhalah Ula)*
  - Rombel: `Halaqah Al-Jazari`
  - Kurikulum: *Kurikulum Tahfizh 30 Juz*
  - Nilai: *Mumtaz (95.00)*
  - Rapor: *Buku Prestasi Hifzhil Qur'an*

### 10.2 Architectural Guarantees:
1. **Tingkat is NOT Global**: `tingkat` belongs to a Madrasah. Farhan is simultaneously at Tingkat 2 in MTs and Tingkat 1 in Tahfizh. The legacy column `santri.kelas` must never be used to store a global grade level.
2. **Zero Score Interference**: MTs mathematics grades are never factored into Tahfizh memorization transcripts.
3. **Dual Report Cards**: Farhan's parents receive two distinct, authentic report cards each semester.

---

## 11. Cross-Domain Impact Analysis

### 11.1 Placement & Transit Pool Impact
- The Placement Ledger (`santri_academic_placements`) and Transit Pool are strictly scoped by:
  $$\langle \mathbf{TenantID},\; \mathbf{MadrasahID},\; \mathbf{AcademicYearID},\; \mathbf{TingkatID} \rangle$$
- An admin managing the MTs Tingkat 2 Transit Pool sees **only** MTs students eligible for Tingkat 2. Tahfizh students never appear in this pool.
- Rombel selection is physically restricted to compatible rombels belonging to `MadrasahID` and `AcademicYearID`.

### 11.2 Curriculum & Learning Impact
- Mata Pelajaran (Course Catalog) is owned by the Madrasah.
- MTs has subjects like *Fisika*, *Biologi*, *Bahasa Inggris*.
- Tahfizh has subjects like *Tahsin*, *Makharijul Huruf*, *Simaan*.
- Lesson schedules (*Jadwal Pelajaran*) bind a Madrasah's teacher, subject, and rombel within that Madrasah's academic period.

### 11.3 Assessment, Examination, & Grading Impact
- Grade calculation schemes (weighting between daily assessments, mid-terms, and finals) are configured independently per Madrasah.
- Exams scheduled in Madrasah A follow Madrasah A's exam event window.

### 11.4 Report Card, Transcript, & Ranking Impact
- **Ranking Isolation**: Transit Pool ranking and semester class ranks are computed **exclusively** among students in the same Madrasah, Tingkat, and Year.
- Transcripts display the official name, logo, accreditation, and signatures of the specific Madrasah and its Kepala Madrasah.

---

## 12. Access Context & Context Switching

In the user interface, users operating across multiple madrasahs must experience clear, leak-proof context switching:

```
[ Navbar: Context Header ]
┌─────────────────────────────────────────────────────────────────────────┐
│ Pondok Pesantren Darussalam  |  MADRASAH TSANAWIYAH (MTs) [ Switch ▼ ]  │
│ Tahun Ajaran: 2026/2027 (Semester Ganjil)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                      (User clicks Switch Madrasah)
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Pilih Konteks Akademik:                                                 │
│ • Madrasah Tsanawiyah (MTs)     - TA 2026/2027 [Aktif]                  │
│ • Madrasah Aliyah (MA)          - TA 2026/2027 [Aktif]                  │
│ • Madrasah Tahfizh Al-Qur'an    - TA 1447/1448 H [Aktif]                │
└─────────────────────────────────────────────────────────────────────────┘
```

### Context Switching Invariants:
1. **Deterministic Session Scoping**: When a user selects a Madrasah, the application session stores `activeMadrasahId`.
2. **Downward Cascade Filtering**: All subsequent queries automatically attach `.where(eq(table.madrasahId, activeMadrasahId))`.
3. **Zero Cross-Context Leakage**: Navigating from MTs to Tahfizh immediately wipes client-side gradebook and roster states, re-fetching only Tahfizh data.

---

## 13. Ten Architectural Anti-Patterns (FORMALLY REJECTED)

The following 10 anti-patterns are officially declared **illegal** in the system architecture:

| # | Anti-Pattern | Description & Risk | Architectural Remedy |
| :--- | :--- | :--- | :--- |
| **AP-1** | **Global Tenant Calendar** | One calendar forced on all madrasahs in a tenant. Breaks when units have different term dates or holiday schedules. | Calendar is owned by Madrasah. Each Madrasah defines its own events. |
| **AP-2** | **Global Academic Year** | `academic_years` scoped only to `tenant_id`. Crashes when multiple madrasahs run concurrent active years. | `academic_years` scoped by `madrasah_id` with per-madrasah active uniqueness. |
| **AP-3** | **Global Student Tingkat** | Storing `tingkat` as a single column on `santri`. Fails when a santri is in MTs Tingkat 2 and Tahfizh Tingkat 1. | Tingkat is resolved strictly through the active placement in each Madrasah. |
| **AP-4** | **Single-Institution Teacher** | Modeling teachers with a single `ranah_instansi` string. Blocks teachers from teaching in both MTs and MA. | Separate Teacher Identity (`guru`) from Academic Memberships and Assignments. |
| **AP-5** | **Cross-Madrasah Ranking** | Aggregating scores across different madrasahs into a combined ranking. Pedagogically invalid. | Ranking is mathematically constrained to $\langle \text{Madrasah}, \text{Tingkat}, \text{Year} \rangle$. |
| **AP-6** | **Context-Free Report Card** | Generating report cards without a definitive Madrasah header. Violates government and pesanten reporting standards. | Every report card binds strictly to a Madrasah's accredited identity. |
| **AP-7** | **Unscoped Score Queries** | Querying student grades by `santri_id` without filtering by `madrasah_id`. Causes foreign subjects to appear on transcripts. | All assessment queries require `madrasah_id` in predicate. |
| **AP-8** | **Identity / Membership Conflation** | Treating user registration as an academic enrollment. Creates duplicate user accounts when someone teaches in two units. | Strict 3-layer model: Identity $\rightarrow$ Membership $\rightarrow$ Assignment. |
| **AP-9** | **Cross-Madrasah Rombel Placement** | Placing a student into a Rombel belonging to a different Madrasah. Breaks curriculum and reporting. | Composite foreign keys enforce that Rombel and Placement share identical `madrasah_id`. |
| **AP-10** | **Cascade Calendar Interference** | Madrasah A closing its academic year automatically closing or locking Madrasah B. Paralyzes operations. | Year closing routines are strictly isolated to the target Madrasah. |

---

## 14. Domain Entity Classification: The `madrasah_id` Audit

To prepare for technical schema design, all entities across the academic landscape are classified by their relationship to `madrasah_id`:

### Category A: Wajib Memiliki Konteks `madrasah_id` Secara Eksplisit
*Must store `madrasah_id` directly for query performance, direct scoping, and native database-level isolation:*
1. **`academic_calendars`** (Root of academic schedule)
2. **`academic_years`** (Operational cycle of the Madrasah)
3. **`jenjang`** (Educational stages within the Madrasah)
4. **`tingkat`** (Progression levels within the Madrasah)
5. **`mapel`** (Course catalog of the Madrasah)
6. **`madrasah_teachers` / `teacher_memberships`** (Affiliation of teacher to Madrasah)
7. **`santri_academic_placements`** (Placement ledger — enables native partial unique index per Madrasah)

### Category B: Mewarisi Konteks Madrasah dari Parent Entity (Inherited / Derived)
*Does not require standalone `madrasah_id` if strictly derived via composite foreign keys, though may be denormalized if justified:*
1. **`academic_terms`** (Inherited from `academic_years`)
2. **`academic_events`** (Inherited from `academic_calendars` or `academic_years`)
3. **`rombel`** (Inherited from `tingkat.madrasah_id`)
4. **`teacher_assignments`** (Inherited from `rombel` and `mapel`)
5. **`assessment_events`** (Inherited from `teacher_assignments` / `rombel`)
6. **`academic_ledger_records`** (Inherited from `academic_terms` and `mapel`)

### Category C: Dilarang Memiliki `madrasah_id` Secara Langsung (Global Tenant Entities)
*Must remain purely tenant-scoped, completely neutral of any specific Madrasah:*
1. **`tenants`** (The multi-tenant root)
2. **`users`** (Human user accounts and authentication credentials)
3. **`santri`** (Student demographic profile, NIS, family relations)
4. **`guru`** (Teacher personal profile, NIP, bio)
5. **`asrama` & `kamar`** (Residential boarding facilities)
6. **`health_visits` & `health_permissions`** (Campus clinic and UKS records)
7. **`gate_logs` & `gate_checkpoints`** (Campus physical security)
8. **`tenant_subscriptions` & `billing`** (SaaS billing and payment gateways)

---

## 15. Cross-Domain Impact Matrix

| Domain Area | Impact of Madrasah Boundary | Primary Governance Actor |
| :--- | :--- | :--- |
| **Admissions (PPDB)** | Applications are targeted to a specific Madrasah (e.g., Daftar MTs vs. Daftar Tahfizh). | Panitia PSB Madrasah |
| **Placement & Transit** | Transit pools and rombel distributions are isolated per Madrasah. | Tata Usaha / Kurikulum Madrasah |
| **Classroom Sectioning** | Rombels belong to a Madrasah's Tingkat and Academic Year. | Kepala Madrasah |
| **Attendance & Journal** | Teachers record attendance within their Madrasah's active term dates. | Guru Pengajar / Musyrif |
| **Curriculum Planning** | Subject syllabus and passing thresholds (KKM) set per Madrasah. | Tim Kurikulum Madrasah |
| **Grading & Assessments** | Grade calculation schemes and weightings configured per Madrasah. | Guru & Kurikulum |
| **Examinations** | Exam windows and card generation follow Madrasah calendar events. | Panitia Ujian Madrasah |
| **Rapor & Buku Prestasi** | Output is customized to the regulatory format of that Madrasah. | Wali Kelas & Kepala Madrasah |
| **Promotion Pleno** | Progression decisions evaluate Tingkat sequence within that Madrasah. | Dewan Asatidz Pleno |
| **Alumni & Graduation** | Students graduate upon completing terminal sequence of that Madrasah. | Pimpinan Pondok / Kepala Madrasah |

---

## 16. Open Decisions (Submitted for Product Owner Approval)

The following architectural trade-offs require formal business direction:

### `OPEN-DECISION-005`: Granularity of Academic Calendar Model
- **Context**: Every Madrasah needs its own calendar. But in some pesantren, Madrasah A (MTs) and Madrasah B (MA) share major holiday dates (e.g., Libur Idul Fitri) while having different exam dates.
- **Option A (Completely Independent Calendars — Recommended)**: Each Madrasah manages its own Academic Calendar with 100% independence. Zero coupling. If they share a holiday, both record the event in their own calendar (or copy from a template).
- **Option B (Tenant Template with Madrasah Overrides)**: The Tenant defines a "Master Campus Calendar", and each Madrasah inherits and selectively overrides dates.
- **Architect Recommendation**: **Option A**. Template inheritance introduces complex cascade override logic, partial synchronization bugs, and merge conflicts. Complete independence provides rock-solid isolation.
- **Status**: **OPEN DECISION — PRODUCT OWNER REQUIRED**.

### `OPEN-DECISION-006`: Unified Campus Transcript vs. Strict Academic Isolation
- **Context**: In pesantren, when a santri graduates, parents often ask: "Bisa minta rapor gabungan yang memuat nilai MTs dan nilai Tahfizh sekaligus?"
- **Option A (Strict Isolation — Recommended as Baseline)**: System issues two separate official documents: *Rapor MTs* and *Syahadah Tahfizh*. No automatic merging.
- **Option B (Composite Transcripts as Downstream Add-on)**: Standard reports remain strictly isolated, but a specialized "Composite Pesantren Portfolio" view can be queried by Tenant Administrators on-demand.
- **Architect Recommendation**: **Option B as a deferred Level-6 feature; Option A as immutable Level-5 baseline**.
- **Status**: **OPEN DECISION — PRODUCT OWNER REQUIRED**.

### `OPEN-DECISION-007`: Schema Evolution Path for `academic_years`
- **Context**: Live table `academic_years` in `src/lib/db/schema/academic_workspace.ts` currently has `tenant_id` and unique index `uq_academic_years_tenant_active`.
- **Option A (Direct Refactoring of `academic_years`)**: Add `madrasah_id` column to `academic_years`, drop `uq_academic_years_tenant_active`, add `unique(tenant_id, madrasah_id) WHERE status = 'active'`.
- **Option B (Introduce `academic_calendars` Table)**: Create `academic_calendars` table owned by `madrasah_id`, and point `academic_years` to `academic_calendar_id`.
- **Architect Recommendation**: **Option A** for simplicity, direct relational indexing, and zero unnecessary join depth.
- **Status**: **OPEN DECISION — PRODUCT OWNER REQUIRED**.

---

## 17. Architecture Consequences (For Future Schema & Implementation WPs)

When authorization for schema and code implementation is granted in future work packages:
1. **Migration Requirement**: A controlled database migration will be required to add `madrasah_id` to `academic_years` and update composite unique constraints.
2. **Repository Refactoring**: `academicYearService` and `academicTermService` in `src/lib/services/` must accept `madrasahId` as a mandatory scoping parameter.
3. **Proxy / Middleware Context**: The request context pipeline (`src/proxy.ts` / `src/lib/tenant/context.ts`) will support header propagation of `x-madrasah-id` for academic route handlers.
4. **Clean UI State**: Frontend Zustand stores must isolate their caches by `activeMadrasahId`.

---

## 18. Final Domain Verdict

The principle that **Madrasah is the Academic Governance Boundary** is formally confirmed as the sound, scalable, and immutable foundational law for APP MA'HAD. It resolves multi-curriculum pesantren operations, prevents cross-institution data contamination, and enables true multi-madrasah enterprise scalability for decades to come.

---

```text
================================================================================
DOMAIN ARCHITECTURE REFINEMENT STATUS:

[ ] INCOMPLETE
[ ] BLOCKED — OPEN DECISIONS
[x] READY FOR PRODUCT OWNER REVIEW
[ ] DOMAIN ARCHITECTURE LOCKED

SCHEMA STATUS:
NOT STARTED

MIGRATION STATUS:
NOT STARTED

CODING STATUS:
NOT AUTHORIZED

NEXT AUTHORITY:
PRODUCT OWNER
================================================================================
```
