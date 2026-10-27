# WP-ACADEMIC-HIFZH-JOURNAL-DISCOVERY-001
# READ-ONLY DISCOVERY & DOMAIN ARCHITECTURE REPORT
## Jurnal Hafalan Al-Qur'an (Academic Hifzh Journal) for MA'HAD MANAGER

**Document Identifier**: `WP-ACADEMIC-HIFZH-JOURNAL-DISCOVERY-001-REPORT`  
**Work Package ID**: `WP-ACADEMIC-HIFZH-JOURNAL-DISCOVERY-001`  
**Phase**: AUDIT → ANALYSIS → PROPOSAL → VALIDATION → STOP  
**Author**: Senior Academic Domain Architect / Quran & Hifzh Domain Architect / Academic Journal Architect  
**Classification**: READ-ONLY DISCOVERY & DOMAIN ARCHITECTURE SPECIFICATION  
**Date**: 2026-09-14  
**Status**: COMPLETE (READY FOR PRODUCT OWNER AUTHORIZATION)  
**Target Initial Scale**: ±10 Pesantren / Tenants (Engineered for 50–100 tenants without microservices)  

---

## 1. Executive Summary

This report establishes the authoritative, forensic discovery baseline and formal domain architecture for the **Jurnal Hafalan Al-Qur'an (Academic Hifzh Journal)** within MA'HAD MANAGER.

### Primary Architectural Outcome
The Academic Hifzh Journal is designed as an **instructional, teacher-operated pedagogical logbook** integrated directly into the academic subject framework (**Mata Pelajaran Hafalan Al-Qur'an / Tahfidz**). It provides Asatidz and Teachers with a streamlined, mobile-first mechanism to:
1. Record daily recitation submissions (*penyimakan hafalan*).
2. Explicitly distinguish between new memorization (**Ziyadah / Hafalan Baru**) and repetitive reinforcement (**Muraja'ah**).
3. Record canonical Quranic material references (Surah, Ayah range, Juz, Page) without duplicating canonical Quran text.
4. Record qualitative simakan assessments (*kelancaran*, *tajwid*, *syariah predicate*).
5. Capture pedagogical notes (*catatan guru / musyrif*) for student improvement.
6. Maintain an immutable, searchable academic history of each santri's memorization journey.

### Strategic Demarcation
The Academic Hifzh Journal is **NOT** a student personal memorization planner, nor is it an automated scheduling engine. It serves strictly as an academic record of observed recitations conducted under teacher supervision within a formal Islamic educational curriculum.

---

## 2. Scope

### In-Scope (Forensically Audited & Designed)
- Discovery of existing academic schemas (`academic_years`, `academic_terms`, `mapel`, `kelas`, `santri`, `guru`, `academic_ledger_records`, `academic_transcripts`).
- Analysis of existing academic domain constants (`AcademicDomain = 'formal' | 'pesantren' | 'quran'`).
- Domain model formulation for Journal Entries, activity type taxonomy (`ZIYADAH` vs `MURAJAAH`), canonical Quran material referencing, and qualitative simakan result scales.
- Integration mapping between daily journal entries and the formal **Academic Ledger** and **Rapor Tahfidz**.
- Multi-tenant data isolation, RBAC permissions, auditability, and duplicate prevention strategies.

### Out-of-Scope (Strictly Enforced Read-Only Rules)
- **Zero source code modifications** performed.
- **Zero database migrations** generated or executed.
- **Zero database mutations** (no `INSERT`, `UPDATE`, `DELETE`, `ALTER TABLE`, or `CREATE TABLE`).
- **Zero package dependencies** added.
- **Zero git commits, pushes, or deployments**.

---

## 3. Explicit Out-of-Scope

To protect the platform from premature complexity, cognitive overload, and over-engineering, the following capabilities are **STRICTLY EXCLUDED** from this work package:

| Excluded Subsystem | Reason for Exclusion | Target Future Disposition |
| :--- | :--- | :--- |
| **Personal Hifzh Module** | Dedicated student-facing self-study tool; distinct from teacher academic records. | Deferred to future Student Portal WP. |
| **Personal Target Hafalan** | Individual student goal setting (e.g. "Hatam 30 Juz in 2 years"). | Deferred to Personal Hifzh WP. |
| **Personal Khatam Program** | Personal khatam tracking and celebration milestones. | Deferred to Personal Hifzh WP. |
| **Personal Daily Reminders** | Client-side notification timers for individual review. | Deferred to Mobile Client WP. |
| **Structured Continuous Muraja'ah Planner**| Algorithmic schedule generator (e.g. 1/4 juz daily progression). | Deferred to Advanced Tahfidz Planner. |
| **Loose / Ad-Hoc Muraja'ah Scheduler** | Dynamic calendar slot assigner. | Deferred to Advanced Tahfidz Planner. |
| **Push Notification Engine** | Background mobile push infrastructure. | Deferred to Native Mobile Platform WP. |
| **Native Mobile Hifzh Binary** | Standalone native app binary (Desktop native is dropped). | Mobile web responsive first. |
| **AI Voice Recitation Assessment** | Automated voice analysis / audio speech-to-text. | Explicitly rejected (over-engineering). |
| **Automatic Hafalan Detection** | Machine-learning acoustic verse matching. | Explicitly rejected (over-engineering). |
| **Automatic Tajwid Scoring** | Automated acoustic makhraj/ghunnah analysis. | Explicitly rejected (over-engineering). |

---

## 4. Existing Academic Architecture

Inspection of `src/lib/db/schema.ts`, `src/lib/db/schema/academic_workspace.ts`, and `src/lib/db/schema/academic_ledger.ts` reveals a well-structured multi-tenant academic foundation:

```
[Current Core Academic Architecture in PostgreSQL]
+-------------------------+       +-------------------------+
|   public.academic_years |       |  public.academic_terms  |
|-------------------------|       |-------------------------|
| id (PK)                 | <---> | id (PK)                 |
| tenant_id               |       | academic_year_id (FK)   |
| name (e.g. "2026/2027") |       | name ("Semester Ganjil")|
| status ('active', etc.) |       | is_current (boolean)    |
+-------------------------+       +-------------------------+
                                               ^
                                               |
+-------------------------+       +-------------------------+
|      public.kelas       |       |       public.mapel      |
|-------------------------|       |-------------------------|
| id (PK)                 |       | id (PK)                 |
| tenant_id               |       | tenant_id               |
| name ("Halaqah Utsman") |       | name ("Tahfidz Juz 30") |
| tingkat, jenjang        |       | code ("THZ-30")         |
| academic_tab ('quran')  |       | jenjang, tingkat        |
+-------------------------+       +-------------------------+
           |                                   |
           +-----------------+-----------------+
                             |
                             v
              +-------------------------------+
              |   public.teacher_assignments  |
              |-------------------------------|
              | id (PK), tenant_id            |
              | mapel_id (FK), kelas_id (FK)  |
              | guru_name, status             |
              +-------------------------------+
```

### Key Verified Facts
1. **Academic Context Active**: `academic_years` and `academic_terms` model terms and semesters.
2. **Subjects & Classes Supported**: `mapel` and `kelas` support religious education streams via `academic_tab = 'quran'` or `academicDomain = 'quran'`.
3. **Teacher Bindings Verified**: `teacher_assignments` maps teachers (`guru`) to specific classes (`kelas`) and subjects (`mapel`).
4. **Ledger Infrastructure Present**: `academic_ledger_records` and `academic_transcripts` store term grades and traditional Islamic predicates (`Mumtaz`, `Jayyid Jiddan`, `Jayyid`, `Maqbul`, `Rasib`).

---

## 5. Existing Quran Architecture

Forensic search across `src/` and `docs/` reveals:
1. **No Canonical Quran Engine in Database**: There are currently **zero tables** storing Quranic text, surah catalogs, ayah counts, or page boundaries in PostgreSQL.
2. **Mock References in Stores**:
   - `src/lib/store/academic-operation-store.ts` line 64 contains a mock interface `TahfidzProgressRecord` referencing `surahName: string`, `startAyat: number`, `endAyat: number`.
   - `academic-operation-store.ts` lines 127–131 record mock strings such as `lastHafalanPos: "Al-Mulk: 1 - 10"`, `lastHafalanPos: "An-Naba': 1 - 15"`.
3. **Enterprise Blueprint Contract**:
   - `docs/engineering/EMBS-Appendix-A-Module-Master-Blueprint.md` rule `MBD-036` defines the canonical standard:
     *Tahfidz memorization tracking MUST support granularity at three levels: Juz (1/30 of Quran), Surah (114 chapters), and Ayat (individual verses, 6236 total).*

---

## 6. Existing Hifzh/Memorization Architecture

| Component | Status | Evidence in Codebase |
| :--- | :---: | :--- |
| **Hifzh Journal Database Table** | **MISSING** | Zero tables matching `hifzh_*`, `journal_*`, or `tahfidz_*` in PostgreSQL. |
| **Navigation Link** | **PARTIAL / ORPHAN** | `src/config/navigation.ts` lines 301–306 defines route `/dashboard/setoran-quran`, but the page does not exist in `src/app/dashboard/`. |
| **Curriculum Config** | **EXISTING (MOCK)** | `src/components/kurikulum/CurriculumConfigClient.tsx` line 661 defines `<option value="pdf_tahfidz">📖 Template Raport Tahfidz (Hafalan, Murojaah & Tajwid)</option>`. |
| **Assessment Template** | **EXISTING (STORE)**| `src/lib/store/assessment-store.ts` line 148 defines template `tmpl-setoran-hafalan` ("Penilaian Setoran Hafalan & Musyafahah"). |
| **SaaS Module Toggle** | **MOCK ONLY** | `src/app/dashboard/saas/modul-fitur/page.tsx` line 38 lists `m8: Modul Tahfidz & Ziyadah (Beta)` as a local React state toggle. |

---

## 7. Subject Integration (Mata Pelajaran Hafalan Al-Qur'an)

### 7.1 The Subject-First Architectural Principle
Hafalan Al-Qur'an is an official academic course (**Mata Pelajaran**), not an isolated, detached side-system.
- It is instantiated as a row in `public.mapel` (e.g. `name = 'Tahfidz Al-Qur\'an'`, `code = 'THZ-01'`, `jenjang = 'Tahfidz'`).
- It operates within an assigned **Kelas / Halaqah** (`public.kelas`, e.g. `name = 'Halaqah Utsman'`).
- It is taught by an assigned teacher (`public.teacher_assignments` linking `guru` to `mapel` and `kelas`).
- Students are enrolled via standard student class rosters (`public.santri.kelas_id`).

### 7.2 Why No Separate "Hifzh Subject" Entity?
Creating parallel entities (`hifzh_subjects`, `hifzh_classes`, `hifzh_teachers`) violates the unified academic architecture. The existing `mapel`, `kelas`, `guru`, and `santri` entities are 100% sufficient and preserve relational integrity across transcripts and reports.

---

## 8. Journal Domain Model

```
+-----------------------------------------------------------------------------------+
|                        CORE ACADEMIC HIFZH JOURNAL MODEL                          |
+-----------------------------------------------------------------------------------+

               [ Mata Pelajaran: Hafalan Al-Qur'an (public.mapel) ]
                                       |
                                       v
                     [ Kelas / Halaqah (public.kelas) ]
                                       |
                                       v
                    [ Santri Murid (public.santri) ]
                                       |
                                       v
             +---------------------------------------------------+
             |            ACADEMIC HIFZH JOURNAL ENTRY           |
             |           (public.hifzh_journal_entries)          |
             +---------------------------------------------------+
                                       |
                       +---------------+---------------+
                       |                               |
                       v                               v
             [ 1. ACTIVITY TYPE ]            [ 2. QURAN MATERIAL ]
             - ZIYADAH (Hafalan Baru)        - Surah Number & Name
             - MURAJAAH (Pengulangan)        - Ayah Start & End
                                             - Juz & Page (Derived/Ref)
                       |                               |
                       +---------------+---------------+
                                       |
                                       v
             +---------------------------------------------------+
             |               3. SIMAKAN ASSESSMENT               |
             |  - Result Status: LANCAR | CUKUP | PERLU_MENGULANG |
             |  - Tajwid Quality / Predicate (Mumtaz, Jayyid...) |
             +---------------------------------------------------+
                                       |
                                       v
             +---------------------------------------------------+
             |               4. PEDAGOGICAL NOTES                |
             |  - Teacher Feedback: Specific Makhraj/Ayah Notes  |
             |  - Recorded By: Guru / Badal ID & Timestamp       |
             +---------------------------------------------------+
```

---

## 9. Ziyadah Model (Hafalan Baru)

### 9.1 Definition & Business Meaning
**Ziyadah** is the formal recitation session where a santri presents **brand-new memorization** that has not previously been tested and accepted into the santri's verified memory record.

### 9.2 Functional Characteristics
- **Granularity**: Typically ranges from a few verses (3–10 ayahs) to 1–2 pages per session.
- **Prerequisite**: Santri is expected to have performed self-study or *talaqqi* prior to simakan.
- **Evaluation Priority**: Strict adherence to *makharijul huruf*, *ahkamul tajwid*, and fluent verse continuation without prompting.
- **Progression Marker**: Successful Ziyadah marks the frontier of the student's active memorization boundary.

---

## 10. Muraja'ah Model (Pengulangan Hafalan)

### 10.1 Definition & Business Meaning
**Muraja'ah** is the formal recitation session where a santri recites **previously memorized verses** to maintain retentive fluency (*hifzh mutqin*) and prevent verses from being forgotten.

### 10.2 Functional Characteristics
- **Granularity**: Typically larger spans than Ziyadah (e.g. 1/4 juz, 1/2 juz, 1 full juz, or entire surahs like Yasin, Al-Mulk, Al-Waqi'ah).
- **Categories of Muraja'ah (Contextual Reference)**:
  - *Muraja'ah Sughro (Dekat)*: Reviewing verses memorized in the past 1–2 weeks.
  - *Muraja'ah Kubro (Jauh)*: Reviewing older juz (e.g. reviewing Juz 30 while currently memorizing Juz 1).
- **Evaluation Priority**: Speed, endurance, stamina, and seamless verse transitions with minimal stumbles.

---

## 11. Quran Material Reference

### 11.1 The Reference-Only Invariant
The Hifzh Journal **MUST NEVER** store duplicate Arabic Quranic text, Latin transliteration, Indonesian translation, audio clips, or tafsir text in the database.
- Storing sacred text creates data bloat, font encoding corruption risks, and translation versioning discrepancies.
- The journal stores **strictly canonical relational pointers**.

### 11.2 Canonical Quran Reference Attributes
```typescript
export interface QuranMaterialReference {
  surahNumber: number;      // 1 to 114 (e.g. 78 for An-Naba')
  surahName: string;        // Canonical standard: 'An-Naba\''
  ayahStart: number;        // e.g. 1
  ayahEnd: number;          // e.g. 10
  juzNumber?: number;       // 1 to 30 (e.g. 30)
  pageStart?: number;       // 1 to 604 (standard Madinah Mushaf)
  pageEnd?: number;         // 1 to 604
  totalAyahCount: number;   // Calculated: (ayahEnd - ayahStart + 1)
}
```

---

## 12. Simakan Assessment & Qualitative Results

### 12.1 Evaluation Levels
To serve both traditional pesantren environments and structured formal madrasahs, the simakan result supports qualitative Islamic predicates:

| Result Code | Indonesian Label | Traditional Syariah Predicate | Meaning & Evaluation Criteria |
| :--- | :--- | :--- | :--- |
| `LANCAR` | **Lancar / Mutqin** | *Mumtaz / Jayyid Jiddan* | Flawless recitation; zero or negligible stumbles; tajwid correct. |
| `CUKUP` | **Cukup Lancar** | *Jayyid / Maqbul* | Fluent with 1–3 minor prompts; rhythm maintained; slight tajwid notes. |
| `PERLU_MENGULANG`| **Perlu Mengulang (I'adah)**| *Rasib / Da'if* | > 3 major stumbles or memory breaks; student must repeat simakan. |

### 12.2 Simakan vs Mastery Distinction (Critical Domain Rule)
A successful journal entry (*Lancar*) certifies that **the student recited the passage fluently during that specific session**. It does **NOT** automatically certify permanent lifetime mastery (*mutqin*) of that entire surah or juz. Permanent certification is the domain of formal examinations (*Ujian Munaqosyah / Khotmil*).

---

## 13. Teacher Note (Catatan Guru)

Pedagogical feedback is an indispensable component of Quranic teaching:
- **Scope**: Private academic record visible to the teacher, student, and guardian (wali).
- **Typical Use Cases**:
  - *"Perbaiki makhraj huruf ض pada ayat 7."*
  - *"Hati-hati tertukar antara ayat 8 dan ayat 12."*
  - *"Alhamdulillah makhraj dan ghunnah sangat baik. Lanjut ayat berikutnya."*
- **Privacy & Security**: Stored as plain text with XSS sanitization; never published to public landing pages or community boards.

---

## 14. Journal History

Teachers, santri, and wali santri must be able to audit the student's historical trajectory chronologically:

```
[ Chronological Student Memorization History Card ]
Santri: Ahmad Fauzi (NIS: 202601004) | Halaqah: Utsman bin Affan
-----------------------------------------------------------------------------
Tanggal     | Aktivitas  | Materi                 | Hasil   | Catatan Guru
-----------------------------------------------------------------------------
14 Sep 2026 | ZIYADAH    | QS. An-Naba' 11 - 20   | Lancar  | Dengung ikhfa diperjelas.
13 Sep 2026 | ZIYADAH    | QS. An-Naba' 1 - 10    | Lancar  | Alhamdulillah mutqin.
12 Sep 2026 | MURAJAAH   | QS. An-Nazi'at 1 - 25  | Cukup   | Ayat 15-16 sempat ragu.
11 Sep 2026 | MURAJAAH   | QS. 'Abasa 1 - 42      | Lancar  | Lancar dan fasih.
```

The database model must support fast indexing on `(tenant_id, santri_id, entry_date DESC)`.

---

## 15. Academic Ledger Integration

### 15.1 The Ledger Separation Question
*Should every daily simakan entry automatically write to `public.academic_ledger_records`?*
- **Architectural Answer: NO.**
- Writing 3–5 daily recitation entries per student across 500 students into the formal Academic Ledger creates severe database row inflation (over 100,000 rows/semester) and destroys ledger query performance.
- **The Decoupled Pattern**:
  1. Daily journal entries reside in `public.hifzh_journal_entries` as granular instructional logs.
  2. Periodic formal evaluations (e.g. Setoran Pekanan, Ujian Tengah Semester Tahfidz, Ujian Munaqosyah) roll up into `public.academic_ledger_records` with `source_group = 'daily_assessment'` or `'office_exam'`.

---

## 16. Rapor Integration (Report Card)

### 16.1 Rapor Tahfidz Compatibility
The existing curriculum architecture in `src/components/kurikulum/CurriculumConfigClient.tsx` line 70 and 661 already establishes the template format:
- `formatRaport = 'pdf_tahfidz'` (Template Raport Tahfidz: Hafalan, Murojaah & Tajwid).
- `skalaPenilaian = 'predikat_syariah'` (Mumtaz, Jayyid Jiddan, Jayyid, Maqbul, Rasib).

### 16.2 Rapor Data Aggregation
At term end, the transcript generator aggregates:
- **Total Ziyadah Completed** (e.g. 2 Juz, 4 Surah, 120 Ayat).
- **Total Muraja'ah Completed** (e.g. 5 Juz cumulative).
- **Average Fluency & Tajwid Predicate** (e.g. *Jayyid Jiddan*).
- **Teacher Qualitative Assessment** (Overall descriptive comment).

---

## 17. RBAC Integration

Access to the Academic Hifzh Journal maps seamlessly to existing roles:

| Persona | Permitted Journal Actions | Enforcement Boundary |
| :--- | :--- | :--- |
| **Guru / Asatidz** | View, Create, Edit own entries for assigned halaqah classes. | `teacher_assignments` + tenant isolation |
| **Admin Akademik** | View all halaqah journals, generate reports, audit entries. | `Permission.VIEW_STRUKTUR_AKADEMIK` / `MANAGE_STRUKTUR_AKADEMIK` |
| **Santri** | Read-only view of own personal hafalan history. | `user_tenant_memberships` (own `santri_id`) |
| **Wali Santri** | Read-only view of linked child's hafalan history. | `wali_santri_relationships` (child `santri_id`) |

---

## 18. Audit Integration

All state modifications must be persisted to `public.audit_logs` using the established zero-secret audit repository:
- `hifzh.entry_created`: When teacher submits recitation entry.
- `hifzh.entry_updated`: When teacher corrects an entry (stores old vs new material/result).
- `hifzh.entry_voided`: When an entry is voided due to teacher error.

---

## 19. Duplicate Prevention

### 19.1 Realities of Daily Recitation
In pesantren halaqah schedules:
- A student may recite **Ziyadah** in the early morning (*Ba'da Subuh*).
- The same student may recite **Muraja'ah** in the evening (*Ba'da Maghrib*).
- The same student may repeat a recitation session on the same afternoon if the morning session was *Perlu Mengulang*.

### 19.2 Anti-Duplicate Engineering
- Enforcing `UNIQUE (santri_id, entry_date)` is **STRICTLY INVALID** and will break legitimate dual-session teaching.
- **Recommended Strategy**:
  1. Each entry receives a cryptographically random UUID primary key.
  2. UI sends an idempotent client submission token.
  3. Warning prompt triggered if an entry matches `(santri_id, entry_date, activity_type, surah_number, ayah_start, ayah_end)` within a 1-hour window.

---

## 20. Edit & Correction Policy

Because the journal forms part of the student's legal academic record:
1. **Teacher Grace Window**: The creating teacher may edit verse numbers, results, or notes within **24 hours** of creation.
2. **Post-24-Hour Edit Restriction**: After 24 hours, entries are locked. Corrections require an administrative override or must be entered as an append-only correction note with audit logging.
3. **Non-Destructive Voiding**: Entries are never hard-deleted (`DELETE FROM ...`); they are marked with `is_voided = true` and `voided_reason`.

---

## 21. Multi-Tenant Isolation

1. **Mandatory Tenant Scoping**: Every journal record contains a non-nullable `tenant_id` foreign-keyed to `public.tenants.id`.
2. **Row-Level Security (RLS)**: Enforced via Supabase RLS policy:
   `tenant_id = (auth.jwt() ->> 'tenant_id')` or service-role backend query.
3. **No Cross-Tenant Leaks**: A teacher or student in Tenant A cannot query or observe recitation logs belonging to Tenant B.

---

## 22. Personal Hifzh Boundary

```
+-----------------------------------------------------------------------------+
|                     SYSTEM BOUNDARY SEPARATION                              |
+-----------------------------------------------------------------------------+

 [ CONTEXT A: ACADEMIC HIFZH JOURNAL ]        [ CONTEXT B: PERSONAL HIFZH ]
   (IN-SCOPE FOR THIS WP & ACADEMIC)            (STRICTLY OUT-OF-SCOPE)
---------------------------------------      ----------------------------------
 - Actor: Guru / Asatidz                      - Actor: Santri (Self-Study)
 - Scope: Mata Pelajaran Tahfidz              - Scope: Personal Spiritual Journey
 - Purpose: Academic simakan record           - Purpose: Habit formation & target
 - Data: Date, Verses, Result, Notes         - Data: Target juz, daily reminder
 - Output: Academic history & Rapor           - Output: Personal streaks & charts
 - Nature: Verified teacher observation       - Nature: Unverified personal log
```

**Rule of Disconnection**: There is **zero automatic synchronization** between Academic Journal records and Personal Hifzh trackers. A teacher grading a student *Lancar* does not alter personal apps, nor do personal targets alter academic rosters.

---

## 23. Mobile-First Consideration

In operational pesantren reality, Asatidz sit on the floor of the mosque (*halaqah*) holding a smartphone or small tablet while listening to the student recite:
1. **Target Tap Target**: Touch targets must be $\ge 44\text{px}$.
2. **One-Handed Input Optimization**: Rapid dropdowns for Surah selection, numeric stepper for Ayahs, and 3 big touch cards for Result (*Lancar*, *Cukup*, *Perlu Mengulang*).
3. **Fast Handoff**: Saving an entry takes $\le 3$ taps so the teacher can immediately listen to the next student in the circle.

---

## 24. Candidate Entity Catalog

### Proposed Entity: `hifzh_journal_entries`

- **Entity**: `hifzh_journal_entries`
- **Purpose**: Canonical transactional record of a teacher listening to and evaluating a student's Quran recitation (Ziyadah or Muraja'ah).
- **Ownership**: TENANT-OWNED (`tenant_id` is mandatory and foreign-keyed).
- **Primary Key**: `id` (`text`, `'hjf_'` + nanoid or UUID).
- **Foreign Keys**:
  - `tenant_id` $\rightarrow$ `public.tenants.id` (ON DELETE CASCADE)
  - `santri_id` $\rightarrow$ `public.santri.id` (ON DELETE CASCADE)
  - `guru_id` $\rightarrow$ `public.guru.id` (or `users.id`)
  - `mapel_id` $\rightarrow$ `public.mapel.id` (Subject: Tahfidz Al-Qur'an)
  - `kelas_id` $\rightarrow$ `public.kelas.id` (Halaqah class)
  - `academic_term_id` $\rightarrow$ `public.academic_terms.id`
- **Unique Constraints**: None (to allow legitimate multiple daily submissions). Protected by client idempotency keys.
- **Indexes**:
  - `btree (tenant_id, santri_id, entry_date DESC)` (Student history query)
  - `btree (tenant_id, kelas_id, entry_date DESC)` (Class journal overview)
  - `btree (tenant_id, guru_id, entry_date DESC)` (Teacher activity log)
  - `btree (tenant_id, mapel_id)`
- **Important Fields**:
  - `id`: Primary key
  - `tenant_id`: Tenant boundary
  - `santri_id`: Reciting student
  - `guru_id`: Listening teacher
  - `mapel_id`: Academic course
  - `kelas_id`: Class / halaqah
  - `academic_term_id`: Academic semester
  - `entry_date`: Date of recitation (`text` YYYY-MM-DD or `date`)
  - `session_time`: Optional period/time indicator (`'subuh' | 'pagi' | 'ashar' | 'maghrib' | 'isya'`)
  - `activity_type`: `'ZIYADAH' | 'MURAJAAH'`
  - `surah_number`: Integer (1 to 114)
  - `surah_name`: Text (e.g. `'An-Naba\''`)
  - `ayah_start`: Integer
  - `ayah_end`: Integer
  - `juz_number`: Integer (1 to 30, optional)
  - `page_start`: Integer (1 to 604, optional)
  - `page_end`: Integer (1 to 604, optional)
  - `result`: `'LANCAR' | 'CUKUP' | 'PERLU_MENGULANG'`
  - `syariah_predicate`: `'MUMTAZ' | 'JAYYID_JIDDAN' | 'JAYYID' | 'MAQBUL' | 'RASIB'` (optional qualitative tag)
  - `teacher_note`: Text (pedagogical corrections)
  - `is_badal`: Boolean (default `false`, true if substitute teacher)
  - `is_voided`: Boolean (default `false`)
  - `voided_reason`: Text (nullable)
  - `created_at`: Timestamp with timezone
  - `updated_at`: Timestamp with timezone
- **Lifecycle**: Created during recitation session; editable within 24 hours; permanently archived for academic history.
- **Audit Requirement**: Creation, edits, and voiding logged to `public.audit_logs`.
- **Source of Truth**: Database table `public.hifzh_journal_entries`.
- **Status**: PROPOSED (NEW).

---

## 25. Current vs Target Gap Matrix

| Area | Current Repository State | Target Architectural State | Gap Description | Technical Risk | Future WP Scope |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Subject** | Mock mapel in `quran.ts` | Row in `public.mapel` (`academic_tab='quran'`) | Mapel exists in schema; no tahfidz link | LOW | `WP-ACADEMIC-HIFZH-001` |
| **Journal Table** | None | `public.hifzh_journal_entries` | 0 database tables for journal | HIGH | `WP-ACADEMIC-HIFZH-001` |
| **Ziyadah** | Mock string in store | Enum `'ZIYADAH'` in journal entry | Not distinct from Muraja'ah | HIGH | `WP-ACADEMIC-HIFZH-001` |
| **Muraja'ah** | Mock string in store | Enum `'MURAJAAH'` in journal entry | Not distinct from Ziyadah | HIGH | `WP-ACADEMIC-HIFZH-001` |
| **Quran Reference** | Ad-hoc text (`"Al-Mulk: 1-10"`) | Structured canonical numbers | Unstructured text strings | MEDIUM | `WP-ACADEMIC-HIFZH-001` |
| **Simakan Result** | Store interface only | Standardized qualitative scale | No persistent assessment result | HIGH | `WP-ACADEMIC-HIFZH-001` |
| **Teacher Note** | Modal text in memory | Column `teacher_note` in PostgreSQL | Lost on page refresh | MEDIUM | `WP-ACADEMIC-HIFZH-001` |
| **History** | None | Chronological index query | Cannot track student trajectory | HIGH | `WP-ACADEMIC-HIFZH-001` |
| **Assessment** | Store templates | Periodic aggregation to ledger | Disconnected from gradebook | MEDIUM | `WP-ACADEMIC-HIFZH-001` |
| **Academic Ledger** | Table exists | Aggregated exams roll up | No journal rollup logic | LOW | `WP-ACADEMIC-HIFZH-001` |
| **Rapor** | Template option in UI | PDF Tahfidz generator | Generator logic unlinked to journal | MEDIUM | `WP-RAPOR-TAHFIDZ-001` |
| **RBAC** | Permissions exist | Scoped Guru/Admin permissions | Need explicit permission codes | LOW | `WP-ACADEMIC-HIFZH-001` |
| **Audit** | `audit_logs` table active | Commercial & academic events | Add `hifzh.*` audit actions | LOW | `WP-ACADEMIC-HIFZH-001` |
| **Duplicate Check** | None | Client idempotency + warning | Double-submission risk | MEDIUM | `WP-ACADEMIC-HIFZH-001` |
| **Personal Hifzh** | None | Formally decoupled | Clear boundary established | NONE | Explicitly Out-of-Scope |

---

## 26. Locked / Candidate / Deferred / Open Decisions

```
+-----------------------------------------------------------------------------+
|                        DECISION CLASSIFICATION MAP                          |
+-----------------------------------------------------------------------------+
  |
  +---> LOCKED (Authority: Product Owner Directive)
  |     - Academic Hifzh Journal is part of Mata Pelajaran Hafalan Al-Qur'an
  |     - Used primarily by Guru to record student recitations
  |     - Strict separation of ZIYADAH (Hafalan Baru) vs MURAJA'AH
  |     - Quran material stored as CANONICAL REFERENCES (no text duplication)
  |     - Personal Hifzh is strictly OUT-OF-SCOPE
  |     - Multi-tenant tenant-owned academic data
  |
  +---> CANDIDATE (Architecturally Sound; Awaiting Confirmation)
  |     - Entity name: public.hifzh_journal_entries
  |     - Qualitative result scale: LANCAR, CUKUP, PERLU_MENGULANG
  |     - Session time slot tag: subuh, pagi, ashar, maghrib, isya
  |     - 24-hour teacher edit grace window with non-destructive voiding
  |
  +---> OPEN / PRODUCT OWNER DECISION REQUIRED
  |     - Exact list of simakan result values (Lancar/Cukup/Perlu Mengulang vs Mumtaz/Jayyid/Maqbul)
  |     - Permission strategy: Reuse existing Permission.MANAGE_PENILAIAN vs introduce Permission.MANAGE_HIFZH_JOURNAL
  |     - Whether Rapor Tahfidz uses numerical score (0-100) or qualitative Syariah predicates
  |
  +---> DEFERRED (Future Work Packages)
        - Personal Hifzh tracker for Santri
        - Automated Rapor Tahfidz PDF compilation engine
        - Student/Wali portal read-only hafalan trajectory views
```

---

## 27. Risks & Mitigations

1. **Sacred Text Corruption**: Attempting to store Arabic Quran text in transactional journal tables leads to font encoding bugs and massive database bloat. *Mitigation: Store strictly numeric canonical references (`surahNumber`, `ayahStart`, `ayahEnd`).*
2. **False Mastery Claims**: A single fluent recitation being interpreted as permanent memorization mastery. *Mitigation: Journal explicitly documents "observed simakan event", leaving mastery certification to formal examinations.*
3. **Legitimate Dual-Session Rejection**: Santri reciting Ziyadah in morning and Muraja'ah in evening being blocked by naive date uniqueness. *Mitigation: Prohibit rigid `UNIQUE(santri_id, date)` constraints.*
4. **Teacher Friction in Mobile Halaqah**: Clunky desktop-heavy UI causing teachers to abandon the app and return to paper books. *Mitigation: Mobile-first touch interface with $\ge 44\text{px}$ touch targets and 3-tap rapid entry.*

---

## 28. Recommended Future Work Packages

```
[ WP-ACADEMIC-HIFZH-JOURNAL-DISCOVERY-001 ] (Current: Complete)
                     |
                     v
[ WP-ACADEMIC-HIFZH-SCHEMA-001 ]
- Implement Drizzle ORM schema for public.hifzh_journal_entries
- Generate and execute migration SQL (0004_academic_hifzh_journal.sql)
- Configure database indexes for student history and halaqah rosters
                     |
                     v
[ WP-ACADEMIC-HIFZH-SERVICE-API-001 ]
- Implement Hifzh Journal domain service and API route handlers
- Implement duplicate warning check and 24-hour edit grace policy
- Bind audit logging for all journal mutations
                     |
                     v
[ WP-ACADEMIC-HIFZH-MOBILE-UI-001 ]
- Build mobile-first teacher recitation recording UI at /dashboard/setoran-quran
- Implement student hafalan history timeline card
- Wire into existing navigation under AcademicDomain = 'quran'
```

---

## 29. STOP / Product Owner Decision Required

The discovery and domain architecture specification are **100% complete and validated**.

### Product Owner Decisions Required Prior to Schema Implementation:
1. **Simakan Qualitative Result Scale**: Should the result values be standardized as Indonesian labels (`LANCAR`, `CUKUP`, `PERLU_MENGULANG`) or Arabic Syariah predicates (`MUMTAZ`, `JAYYID_JIDDAN`, `JAYYID`, `MAQBUL`, `RASIB`)?
2. **RBAC Permission Granularity**: Should the journal reuse `Permission.VIEW_PENILAIAN` / `MANAGE_PENILAIAN`, or should dedicated canonical permissions be introduced (`perm_view_hifzh_journal`, `perm_manage_hifzh_journal`)?

---

## STATUS SUMMARY

============================================================  
WP STATUS  
============================================================  

STATUS:  
**PASS**  

ACADEMIC DISCOVERY:  
**PASS**  

QURAN INTEGRATION DISCOVERY:  
**PASS**  

DOMAIN DESIGN:  
**PASS**  

IMPLEMENTATION:  
**NOT STARTED**  

DATABASE MUTATION:  
**NOT PERFORMED**  

SOURCE CODE MUTATION:  
**NOT PERFORMED**  

MIGRATION:  
**NOT CREATED**  

COMMIT:  
**NOT CREATED**  

PUSH:  
**NOT PERFORMED**  

DEPLOY:  
**NOT PERFORMED**  

PRODUCT OWNER DECISION REQUIRED:  
1. Standardization of Simakan result scale (`Lancar/Cukup/Perlu Mengulang` vs `Mumtaz/Jayyid/Maqbul`).  
2. Authorization permission granularity (reuse `MANAGE_PENILAIAN` vs new `MANAGE_HIFZH_JOURNAL`).  

NEXT RECOMMENDED WP:  
**WP-ACADEMIC-HIFZH-SCHEMA-001**  

============================================================  
STOP.
