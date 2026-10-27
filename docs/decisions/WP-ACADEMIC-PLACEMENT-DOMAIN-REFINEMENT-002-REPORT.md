# WP-ACADEMIC-PLACEMENT-DOMAIN-REFINEMENT-002-REPORT

**Work Package ID**: `WP-ACADEMIC-PLACEMENT-DOMAIN-REFINEMENT-002`  
**Document Title**: Academic Placement Domain Refinement — Scoped Transit Pool & Cross-Cohort Distribution  
**Mode**: DOMAIN REFINEMENT / BUSINESS RULE ANALYSIS / ARCHITECTURE DECISION  
**Domain**: Level-5 Academic Placement  
**Date**: 2026-09-15  
**Prerequisite Foundation**: `WP-ACADEMIC-STRUCTURE-CLOSURE-001` (L4 Locked & Frozen)  
**Parent Document**: `WP-ACADEMIC-PLACEMENT-DOMAIN-DECISION-001-REPORT.md`  
**Authority**: Product Owner Explicit Task Authorization  

---

## 1. Context

In `WP-ACADEMIC-PLACEMENT-DOMAIN-DECISION-001-REPORT.md`, the platform established the fundamental ledger formulation:
$$\mathbf{Santri} + \mathbf{Academic\ Year} + \mathbf{Rombel} \Longrightarrow \mathbf{Academic\ Placement\ Record}$$

Following formal Product Owner review, an essential operational reality of school and pesantren management was identified:
> **During academic year rollover, students who are promoted do NOT leap directly into target class sections (*Rombel*).**  
> Promoting a cohort to a higher grade level is a separate administrative milestone from assigning individual students to specific classrooms. A controlled intermediate staging mechanism—the **Placement Transit Pool**—is required to bridge progression decisions and final section distribution.

This document formally refines the Level-5 Academic Placement domain model to codify the **Placement Transit Pool**, enforce **strict academic scoping**, establish **cross-cohort academic ranking rules**, guarantee **capacity awareness**, and define **mobile-first distribution workflows**.

---

## 2. Problem Statement

### 2.1 The Direct-Placement Anti-Pattern
Previous prototype thinking assumed an atomic jump:
$$\text{Student in 1-A (Year 2026/2027)} \xrightarrow{\text{Promotion}} \text{Student in 2-A (Year 2027/2028)}$$

This direct-placement assumption breaks down in real pesantren operations for four critical reasons:
1. **Rombel Reconfiguration**: Year $N+1$ Rombels are completely fresh records. Tingkat 2 might have 3 sections (`2-A`, `2-B`, `2-C`) while Tingkat 1 previously had only 2 (`1-A`, `1-B`). Direct mapping is mathematically undefined.
2. **Cohort Regrouping & Deshuffling**: Pesantren administrators intentionally regroup students across sections each year to prevent cliquishness, balance gender or dorm distributions, and distribute academic strengths evenly.
3. **Premature Finality**: Marking a student as "placed in 2-A" before the principal or academic committee reviews classroom balance leads to constant, messy rollbacks of live placement records.
4. **Visibility Vacuum**: Without a formal buffer, administrators cannot track how many promoted students remain **unassigned** versus how many seats remain vacant across target classrooms.

### 2.2 Core Architectural Principle:
$$\mathbf{\text{“Sudah Naik Tingkat”}} \quad \neq \quad \mathbf{\text{“Sudah Selesai Ditempatkan”}}$$
- **Sudah Naik Tingkat** (*Academic Progression*): The student has earned the right to study at Tingkat $K+1$ for Academic Year $Y$.
- **Sudah Selesai Ditempatkan** (*Rombel Assignment*): The student has been formally scheduled into Rombel $R$ under Tingkat $K+1$.

---

## 3. Revised Domain Model

The canonical placement pipeline is refined into a two-phase, phased-gate architecture:

```
+-------------------------------------------------------------------------+
|                       PHASE 1: ACADEMIC PROGRESSION                     |
|                  (Rapat Pleno Dewan Asatidz / Kelulusan)                |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
                      [Current Placement (Year N)]
                                    │
                       (Evaluation / Passing Rule)
                                    │
                                    ▼
                      [Progression Decision Event]
                      - Promoted   → Tingkat = Seq + 1
                      - Retained   → Tingkat = Seq (Same)
                      - Graduated  → Alumni
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                  TARGET ACADEMIC LEVEL (Resolved Context)               |
|      Target Academic Year + Madrasah + Jenjang + Target Tingkat          |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                       PHASE 2: PLACEMENT TRANSIT POOL                   |
|                        (Operational Staging Buffer)                     |
|                                                                         |
|  * Strictly Scoped to: [Year N+1] + [Madrasah] + [Jenjang] + [Tingkat]  |
|  * Merges ALL incoming sources (Promoted, Retained, New Admissions)     |
|  * Displays Cross-Cohort Academic Ranking (Highest → Lowest)           |
|  * Real-time Metric: Total Eligible - Total Assigned = UNASSIGNED       |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                       PHASE 3: ROMBEL DISTRIBUTION                      |
|                  (Admin Review & Section Assignment)                    |
|                                                                         |
|  * Admin Decision Workspace (Ranking is Decision Support, not Auto-Bot) |
|  * Restricted Strictly to COMPATIBLE Rombels within Pool Scope          |
|  * Live Capacity Monitoring (Current / Max Capacity per Section)        |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                         FINAL ROMBEL ASSIGNMENT                         |
|                                                                         |
|  * Immutable Placement Record Created: [Santri + Year N+1 + Rombel]     |
|  * Student Leaves Transit Pool                                          |
|  * Goal: UNASSIGNED = 0 (STATUS: PLACEMENT COMPLETE)                    |
+-------------------------------------------------------------------------+
```

---

## 4. Transit Pool Formal Definition

### 4.1 Decision & Justification
**Formal Classification**:  
The **Placement Transit Pool** is formally defined as an **Academic-Scoped Operational Queue & Decision Workspace (Projection)**.

It is **NOT**:
- A standalone global table.
- A hardcoded foreign key destination.
- A permanent historical entity.

**Architectural Rationale**:
1. **Zero Database Pollution**: If the Transit Pool were modeled as a nullable `rombel_id` on the permanent placement ledger table (`santri_academic_placements`), every student in transit would represent an incomplete, nullable row that violates composite relational foreign keys (`fk_placement_tenant_rombel`).
2. **Deterministic Derivation**: At any given moment, the membership of a Transit Pool is a pure, mathematical projection:
   $$\mathbf{TransitPool}(Y, M, J, T) = \left\{ s \in \mathbf{EligibleStudents}(Y, M, J, T) \;\middle|\; \neg\exists p \in \mathbf{Placements}(Y, M) \text{ s.t. } p.santri = s \land p.status \in \{\text{'ACTIVE'}, \text{'DRAFT'}\} \right\}$$
3. **Operational State vs. Historical Fact**: The transit pool represents *work-in-progress* for administrative staff. Once all students are assigned to a Rombel, the pool naturally empties ($\text{Count} = 0$).

---

## 5. Strict Academic Scope (Anti-Global Rule)

### 5.1 The Anti-Global Constraint
A Transit Pool **MUST NEVER BE GLOBAL** across a tenant or academic year. It is strictly localized to four hierarchical coordinates:

$$\mathbf{Transit\ Pool\ Scope} = \left\langle \mathbf{Academic\ Year},\; \mathbf{Madrasah},\; \mathbf{Jenjang},\; \mathbf{Tingkat} \right\rangle$$

```
                                TENANT
                                  │
                           ACADEMIC YEAR
                            (2027/2028)
                                  │
                               MADRASAH
                             (MTs Formal)
                                  │
                               JENJANG
                              (Wustha)
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
  TRANSIT POOL              TRANSIT POOL              TRANSIT POOL
   Tingkat 1                 Tingkat 2                 Tingkat 3
(Angkatan Baru &          (Naik dari T1 &           (Naik dari T2 &
  Retained T1)              Retained T2)              Retained T3)
```

### 5.2 Business Rule — Compatible Rombels Only
Santri residing in Transit Pool $\langle Y, M, J, T \rangle$ may **ONLY** be distributed into Rombels that strictly match that identical academic scope:

$$\mathbf{CompatibleRombels} = \left\{ r \in \mathbf{Rombel} \;\middle|\; r.academic\_year\_id = Y \land r.tingkat\_id = T \right\}$$

#### Enforcement Matrix:
| Pool Scope | Allowed Target Rombels | Strictly Forbidden Target Rombels |
| :--- | :--- | :--- |
| **`2027/2028 + MTs + Tingkat 2`** | `2-A`, `2-B`, `2-C` (Year 2027/2028) | • `1-A`, `1-B` (Wrong Tingkat)<br>• `3-A`, `3-B` (Wrong Tingkat)<br>• `Tahfizh-2` (Wrong Madrasah)<br>• `2-A 2026/2027` (Wrong Academic Year) |

> **Backend Enforcement Directive**:  
> During technical schema and API implementation, any distribution mutation attempting to assign a student to a `rombel_id` whose `tingkat_id` or `academic_year_id` does not match the student's authorized target scope must be rejected with a `422 Unprocessable Entity / Scope Mismatch Violation`.

---

## 6. Eligibility Rules (Entering the Transit Pool)

A student enters a specific Transit Pool $\langle Y, M, J, T \rangle$ via one of four authorized entry paths:

```
[Promoted from Tingkat T-1 (Year N)] ──┐
[Retained in Tingkat T (Year N)]     ──┼──►  TRANSIT POOL: <Year N+1, Madrasah M, Tingkat T>
[Newly Enrolled Student (PPDB)]      ──┤
[External Mid-Year Transfer In]      ──┘
```

### 6.1 Entry Path Criteria
1. **Path 1: Academic Promotion (Kenaikan Kelas)**
   - **Prerequisite**: Student had an `ACTIVE` placement in Year $N$ at Tingkat with `sequence = S - 1` under Madrasah $M$.
   - **Trigger**: Progression Pleno records decision: `PROMOTED`.
   - **Target**: Enters Transit Pool for Tingkat with `sequence = S` in Year $N+1$.
2. **Path 2: Academic Retention (Tinggal Kelas)**
   - **Prerequisite**: Student had an `ACTIVE` placement in Year $N$ at Tingkat with `sequence = S` under Madrasah $M$.
   - **Trigger**: Progression Pleno records decision: `RETAINED`.
   - **Target**: Enters Transit Pool for Tingkat with `sequence = S` (same sequence) in Year $N+1$.
3. **Path 3: Initial Enrollment (Santri Baru / PPDB)**
   - **Prerequisite**: Student master record created with `status = 'ACTIVE'`.
   - **Trigger**: Admissions committee confirms intake level (e.g., Tingkat 1 MTs or Tingkat 10 MA).
   - **Target**: Enters initial entry Tingkat Transit Pool for target Year $N+1$.
4. **Path 4: External Transfer In (Santri Pindahan)**
   - **Prerequisite**: Matriculation assessment validates equivalence to Tingkat $T$.
   - **Trigger**: Transfer intake approved by Kepala Madrasah.
   - **Target**: Enters target Tingkat Transit Pool for current Academic Year.

---

## 7. Exit Conditions (Leaving the Transit Pool)

A student leaves the Transit Pool under the following distinct conditions:

| Exit Trigger | Resulting Placement State | Architectural Effect |
| :--- | :--- | :--- |
| **Rombel Assignment Success** | **`ACTIVE`** (or `DRAFT`) | **Normal Exit**: Immutable placement row created: `(santri_id, academic_year_id, rombel_id)`. Unassigned count decrements by 1. |
| **Promotion Correction / Reversal** | **Re-routed** | Administrative reversal of promotion decision moves student out of Tingkat $T$ pool back to Tingkat $T-1$ pool or retention. |
| **Student Withdrawal (Keluar / DO)** | **`WITHDRAWN`** | Student leaves the institution prior to class assignment. Master status updated to `KELUAR`. Removed from all pools. |
| **Mid-Year Transfer Out** | **`TRANSFERRED`** | Student departs to an external institution. Removed from transit pool. |
| **Academic Year Transition / Archive** | **Closed** | If an unassigned student lingers until the year is archived, they are marked unresolved and require manual remediation. |

---

## 8. Academic Progression vs. Rombel Assignment

A core requirement of this refinement is to rigidly separate the two administrative responsibilities:

| Dimension | Academic Progression | Rombel Assignment |
| :--- | :--- | :--- |
| **Core Question** | *"Pada tahun ajaran berikutnya, santri ini berhak berada di tingkat berapa?"* | *"Santri ini akhirnya belajar di ruangan/kelas rombel mana?"* |
| **Authority** | Rapat Pleno Dewan Asatidz / Kepala Madrasah | Kepala Tata Usaha / Kurikulum / Academic Admin |
| **Timing** | Akhir Tahun Ajaran (Bulan Juni/Juli) | Awal Tahun Ajaran Baru (Menjelang Hari Pertama Masuk) |
| **Basis of Decision** | Standar Kriteria Ketuntasan Minimal (KKM), Nilai Rapor Kumulatif, Kehadiran, Akhlak | Kapasitas Ruangan, Keseimbangan Gender, Pemerataan Akademik, Pembagian Asrama |
| **Resulting Entity** | Target Level Event $\rightarrow$ Menempatkan ke **Transit Pool** | Placement Record $\rightarrow$ Menempatkan ke **Rombel Definitif** |
| **Mutability** | Formal, berkekuatan hukum madrasah; jarang diubah | Fleksibel selama masa penataan awal (*workspace*) |

---

## 9. Cross-Cohort Academic Ranking Rules

Within each Scoped Transit Pool $\langle Y, M, J, T \rangle$, the system must automatically present an ordered view of students based on their academic performance.

### 9.1 Default Ranking Order
$$\mathbf{Ordering}: \quad \text{Average Score } (\mathbf{Nilai\ Rata\text{-}rata}) \quad \mathbf{DESCENDING} \quad (99.99 \longrightarrow 0.00)$$

```
=============================================================================
MADRASAH: MTs Darussalam  |  TAHUN: 2027/2028  |  TINGKAT: Kelas 8 (Seq: 8)
TRANSIT POOL ROSTER (Sorted by Prior Year Academic Average)
=============================================================================
Rank | Nama Santri         | Rata-rata | Rombel Asal (Ref) | Status Distribusi
-----+---------------------+-----------+-------------------+------------------
 1   | Ahmad Fathoni       |   95.20   | 7-A (2026/2027)   | Belum Ditempatkan
 2   | Hasan Basri         |   94.85   | 7-A (2026/2027)   | Belum Ditempatkan
 3   | Muhammad Umar       |   91.00   | 7-B (2026/2027)   | Belum Ditempatkan
 4   | Fajar Sidiq         |   89.50   | 7-B (2026/2027)   | Belum Ditempatkan
 5   | Ali Zainal          |   88.75   | 7-A (2026/2027)   | Belum Ditempatkan
 6   | Zaid bin Tsabit     |   88.00   | 7-C (2026/2027)   | Belum Ditempatkan
 7   | Yusuf Mansur        |   86.50   | Santri Baru (P)   | Belum Ditempatkan
=============================================================================
```

### 9.2 The Cross-Cohort Dissolution Rule (Crucial Business Law)
> **Ranking MUST dissolve previous Rombel boundaries.**  
> Students from prior sections `7-A`, `7-B`, `7-C`, plus retained students, plus newly admitted transfer students must be pooled into a single, unified ranking hierarchy.  
> **Prior Rombel is displayed strictly as informative context, NEVER as a sorting or partitioning criterion.**

### 9.3 Source of Truth for Scores
- The ranking average is derived from the **`academic_transcripts`** / **`academic_ledger_records`** of the preceding Academic Year (or admissions entrance examination score for new PPDB students).
- No new grading tables or ad-hoc score caches will be created.

---

## 10. Ranking as Decision Support (Anti-Auto-Bot Law)

### 10.1 The Anti-Automation Invariant
The platform strictly rejects the following anti-pattern:
$$\text{Rank } 1\text{--}30 \longrightarrow \text{Rombel A}; \quad \text{Rank } 31\text{--}60 \longrightarrow \text{Rombel B} \quad (\mathbf{FORBIDDEN\ AUTOMATION})$$

**Why Automatic Sectioning is Forbidden**:
1. **Pemerataan Kemampuan (Heterogeneous Classrooms)**: Many madrasahs intentionally distribute top students evenly across all sections (e.g., zigzag / snake distribution: Rank 1 to A, Rank 2 to B, Rank 3 to C, Rank 4 to C, Rank 5 to B, Rank 6 to A) to prevent "kelas buangan" (dumping classes).
2. **Keseimbangan Gender & Asrama**: Pesantren often partition sections by gender (Rombel Putra vs. Rombel Putri) or by boarding dormitories (*komplek asrama*).
3. **Wali Kelas Discretion**: Homeroom teachers and counseling musyrifs (*BK/Konseling*) provide qualitative input regarding student personality dynamics.

### 10.2 The Decision Flow:
$$\mathbf{Academic\ Score} \longrightarrow \mathbf{Ranking} \longrightarrow \mathbf{Admin\ Review} \longrightarrow \mathbf{Admin\ Decision} \longrightarrow \mathbf{Rombel\ Assignment}$$

---

## 11. Unassigned Student Detection & Completion Gate

The Transit Pool engine maintains an ongoing, real-time census of placement completion:

$$\mathbf{Total\ Eligible\ Students} - \mathbf{Total\ Assigned\ Students} = \mathbf{UNASSIGNED\ STUDENTS}$$

```
+-------------------------------------------------------------------------+
|                  TINGKAT 2 TRANSIT POOL DASHBOARD                       |
+-------------------------------------------------------------------------+
| Total Santri Berhak Masuk Tingkat 2 :  87                              |
| Sudah Ditempatkan di Rombel         :  72                              |
| ─────────────────────────────────────────────────────────────────────── |
| BELUM DITEMPATKAN (UNASSIGNED)      :  15   [⚠️ PLACEMENT IN PROGRESS]  |
+-------------------------------------------------------------------------+
```

### Business Rule — Placement Completion Gate:
A Tingkat's academic placement is formally marked **`COMPLETE`** if and only if:
$$\mathbf{UNASSIGNED\ STUDENTS} = 0$$

- If $\text{Unassigned} > 0$, the platform warns the administrator that placement is incomplete.
- Teachers cannot finalize attendance lists, and semester gradebooks cannot be initialized for incomplete Tingkats.

---

## 12. Capacity Awareness & Real-Time Headroom

The Transit Pool workspace contextually links unassigned students with the capacity metrics of all compatible Rombels:

```
=============================================================================
AVAILABLE SEATS vs. UNASSIGNED POOL (Tingkat 2 — 2027/2028)
Unassigned Students Waiting: 15
=============================================================================
Rombel Name | Assigned | Max Capacity | Remaining Space | Capacity Bar
------------+----------+--------------+-----------------+--------------------
Rombel 2-A  |    25    |      30      |      5 seats    | [████████░░] 83%
Rombel 2-B  |    30    |      30      |      0 seats    | [██████████] FULL
Rombel 2-C  |    17    |      30      |     13 seats    | [█████░░░░░] 57%
------------+----------+--------------+-----------------+--------------------
TOTALS      |    72    |      90      |     18 seats    | (Deficit Risk: NONE)
=============================================================================
```

### Capacity Alert Conditions:
1. **Full Section Warning**: When a section reaches $100\%$ capacity (`assigned == capacity`), the system prevents further assignments to that Rombel unless an override is authorized.
2. **Deficit Capacity Alarm**: If:
   $$\sum \mathbf{Remaining\ Space} < \mathbf{Unassigned\ Students}$$
   The system triggers a high-priority warning: *"Total kapasitas rombel yang tersedia (18 kursi) tidak mencukupi untuk menampung seluruh santri yang belum ditempatkan (25 santri). Silakan tambah Rombel baru atau tingkatkan kapasitas rombel yang ada."*

---

## 13. Mobile-First Conceptual UX Architecture

The platform architecture mandates a strict **Mobile-First Drilldown Flow**. Administrators on smartphones or tablets must not be subjected to horizontal-scrolling desktop spreadsheets.

### 13.1 Drilldown Interaction Hierarchy:
```
1. Screen: SELECT MADRASAH & TINGKAT
   ┌───────────────────────────────────────────────┐
   │ [ Madrasah Tsanawiyah (MTs)                ▼ ]│
   │ [ Tingkat 2 (Kelas 8)                      ▼ ]│
   │ [ Status: 15 Belum Ditempatkan               ]│
   └───────────────────────────────────────────────┘
                          │
                          ▼
2. Screen: TRANSIT POOL ROSTER (Ranked Cards)
   ┌───────────────────────────────────────────────┐
   │ 🔍 Filter / Search Santri...                  │
   │ --------------------------------------------- │
   │ [x] #1 Ahmad Fathoni (95.2) — Asal: 7-A       │
   │ [x] #2 Hasan Basri   (94.8) — Asal: 7-A       │
   │ [ ] #3 Muhammad Umar (91.0) — Asal: 7-B       │
   │ --------------------------------------------- │
   │ 2 Santri Terpilih                             │
   │ [ AKSI PENEMPATAN (ASSIGN)                  ] │
   └───────────────────────────────────────────────┘
                          │
                          ▼
3. Modal/Sheet: CHOOSE COMPATIBLE ROMBEL (Scoped)
   ┌───────────────────────────────────────────────┐
   │ Tempatkan 2 Santri ke Rombel Tingkat 2:       │
   │                                               │
   │ ( ) Rombel 2-A  [Sisa 5 Kursi]                │
   │ ( ) Rombel 2-B  [PENUH - 30/30]  (Disabled)   │
   │ (•) Rombel 2-C  [Sisa 13 Kursi]               │
   │                                               │
   │ [ KONFIRMASI PENEMPATAN                     ] │
   └───────────────────────────────────────────────┘
```

### 13.2 Mobile-First Architectural Invariants:
1. **Scoped Selector**: When the user selects `MTs -> Tingkat 2`, the entire application state immediately binds to `Scope: { madrasahId, tingkatId, academicYearId }`.
2. **Filtered Selection Sheet**: The Rombel selector sheet queries **only** rombels where `tingkat_id = Tingkat 2`. Rombels from Tingkat 1 or 3 never leak into the mobile viewport.
3. **Card-Based Bulk Action**: Admins can tap checkboxes on student cards and batch-assign them to a selected section with two thumb taps.

---

## 14. Detailed Analysis of Explicit Task Questions

### 14.1 Question A: Apa Definisi Formal Transit Pool?
- **Decision**: Transit Pool adalah **Logical Grouping / Operational Queue (Projection)**.
- **Reasoning**: It represents the dynamic delta between students with an approved target Tingkat and students with an existing placement row. Modeling it as a projection preserves database integrity, avoids nullable foreign key columns, and prevents orphaned temporary records.

### 14.2 Question B: Apa yang Membuat Seorang Santri Masuk Transit Pool?
- **Eligibility Criteria**:
  1. Santri berstatus aktif (`santri.status = 'ACTIVE'`).
  2. Memiliki keputusan kenaikan tingkat (*Promoted* ke Tingkat $T$) ATAU keputusan tinggal kelas (*Retained* di Tingkat $T$) ATAU penerimaan santri baru (*PPDB* di Tingkat $T$) ATAU mutasi masuk (*Transfer In* ke Tingkat $T$).
  3. Belum memiliki baris penempatan aktif di Rombel manapun pada Madrasah $M$ untuk Tahun Ajaran target $Y$.

### 14.3 Question C: Kapan Santri Keluar dari Transit Pool?
- **Exit Conditions**:
  1. **Sukses Ditempatkan**: Admin menugaskan santri ke Rombel kompatibel $\rightarrow$ baris penempatan diterbitkan.
  2. **Koreksi Keputusan Kenaikan**: Admin/Pleno membatalkan atau merevisi kenaikan tingkat santri.
  3. **Pengunduran Diri / Mutasi Keluar**: Santri mengundurkan diri atau pindah sekolah $\rightarrow$ status santri berubah menjadi `MUTASI` atau `KELUAR`.
  4. **Tahun Ajaran Ditutup/Diarsipkan**: Penempatan yang tidak tuntas disegel saat tahun ajaran berganti.

### 14.4 Question D: Bagaimana Sistem Menentukan Target Tingkat?
- **Decision**: Target Tingkat ditentukan murni oleh **Academic Progression / Promotion Rules** (`current_tingkat.sequence + 1` dalam Madrasah yang sama untuk santri naik kelas; atau `current_tingkat.sequence` untuk santri tinggal kelas; atau level penetapan PPDB untuk santri baru).
- **Invariant**: Distribusi Rombel sama sekali tidak memiliki otoritas menentukan Tingkat. Tingkat sudah terkunci sebelum santri masuk ke Transit Pool.

### 14.5 Question E: Apa Sumber Nilai yang Digunakan untuk Ranking?
- **Decision**: Sumber nilai resmi adalah **`academic_transcripts`** (dari modul `academic-ledger`) pada Academic Term terakhir / tahun ajaran sebelumnya.
- **Traceability**: Sesuai `src/lib/db/services/academic-ledger.ts` yang menghitung skor akhir terbobot (`finalScore`).

### 14.6 Question F: Bagaimana Tie/Ranking yang Sama Ditangani?
- **Decision**: Diformulasikan sebagai **`OPEN-DECISION-003`** (lihat Bagian 15).
- Secara teknis, sistem tidak boleh memilih secara acak. Harus ada aturan tie-breaker deterministik yang disetujui Product Owner.

---

## 15. Open Decisions (Submitted for Product Owner Approval)

### `OPEN-DECISION-003`: Tie-Breaker Rule for Identical Academic Averages
- **Problem**: Jika dua atau lebih santri memiliki nilai rata-rata yang persis sama (misal: Ahmad = 92.50, Hasan = 92.50), bagaimana urutan tampilan ranking ditentukan?
- **Opsi yang Tersedia**:
  - **Opsi A (Mata Pelajaran Kunci / Prioritas)**: Peringkat ditentukan oleh nilai pada mata pelajaran tertentu (misal: Nilai Tahfizh atau Bahasa Arab tertinggi).
  - **Opsi B (Catatan Disiplin / Poin Pelanggaran)**: Santri dengan poin pelanggaran (`total_poin_pelanggaran`) lebih rendah menempati ranking lebih tinggi.
  - **Opsi C (Presensi / Tingkat Kehadiran)**: Santri dengan persentase kehadiran lebih tinggi diutamakan.
  - **Opsi D (Deterministik Standar — Rekomendasi Arsitek)**: Nilai rata-rata sama diberi ranking setara (*equal rank*, misal rank 3 bersama), dengan urutan tampilan sekunder berdasar Nama Alfabetis atau NIS.
- **Status**: **OPEN DECISION — PRODUCT OWNER REQUIRED**.

### `OPEN-DECISION-004`: Kebijakan Transit Pool untuk Santri Baru (PPDB) Tanpa Nilai Asal
- **Problem**: Santri baru dari luar pesantren belum memiliki riwayat `academic_transcripts` di sistem ini.
- **Opsi yang Tersedia**:
  - **Opsi A (Nilai Tes Masuk)**: Menggunakan skor tes seleksi masuk PPDB sebagai basis ranking.
  - **Opsi B (Ditempatkan di Dasar Pool)**: Santri baru diberi nilai default $0.00$ atau label `"N/A"` dan dikelompokkan di bagian bawah daftar transit untuk penempatan manual.
  - **Opsi C (Pool Terpisah untuk Santri Baru)**: Santri baru memiliki tab/filter terpisah dalam transit pool agar tidak bercampur aduk dengan santri lama yang naik tingkat.
- **Status**: **OPEN DECISION — PRODUCT OWNER REQUIRED**.

---

## 16. Architectural & Schema Consequences (For Upcoming WP-001)

Hasil dari domain refinement ini memiliki konsekuensi langsung terhadap desain teknis `WP-ACADEMIC-PLACEMENT-SCHEMA-001`:

1. **Tabel Penempatan Tetap Bersih**:
   `santri_academic_placements` **TIDAK PERLU** memiliki kolom `is_transit_pool: boolean` atau kolom `rombel_id` nullable. Baris penempatan hanya dibuat saat santri **resmi ditempatkan ke rombel**.
2. **Entitas Kenaikan Kelas (Progression Event / Staging)**:
   Diperlukan entitas atau mekanisme status kenaikan kelas (misal: `academic_progression_decisions` atau status pada penempatan tahun sebelumnya) yang menyimpan:
   `santri_id`, `source_academic_year_id`, `target_academic_year_id`, `target_tingkat_id`, `decision: 'PROMOTED' | 'RETAINED' | 'GRADUATED'`.
3. **Database Composite Foreign Key Guard**:
   Pada tabel `santri_academic_placements`, relasi ke Rombel dan Tingkat harus menggunakan composite foreign keys untuk memastikan bahwa siswa hanya bisa masuk ke Rombel yang `tingkat_id`-nya identik dengan target tingkat yang berhak diterimanya.

---

## 17. Final Recommendation & Decision Summary

```
================================================================================
CANONICAL PLACEMENT REFINEMENT LIFECYCLE:

CURRENT ACADEMIC YEAR
        ↓
ACADEMIC PROGRESSION (Promotion / Retention / Graduation)
        ↓
TARGET SCOPE:
ACADEMIC YEAR + MADRASAH + JENJANG + TINGKAT
        ↓
SCOPED TRANSIT POOL (Operational Workspace)
        ↓
CROSS-COHORT ACADEMIC RANKING (Decision Support)
        ↓
ADMIN DISTRIBUTION DECISION (Mobile-First Workspace)
        ↓
COMPATIBLE ROMBEL ONLY (Scope Enforced)
        ↓
FINAL ROMBEL ASSIGNMENT (Immutable Placement Record Created)
        ↓
UNASSIGNED = 0 (Census Complete)
        ↓
PLACEMENT COMPLETE
================================================================================
```

---

## FINAL STATUS

```
================================================================================
DOMAIN REFINEMENT COMPLETE
(All 12 domain requirements codified; 2 new Open Decisions submitted for PO review)
================================================================================
```
