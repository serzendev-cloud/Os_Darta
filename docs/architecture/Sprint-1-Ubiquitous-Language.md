# Sprint 1 Ubiquitous Language & Terminology Catalog
**APP MA'HAD Enterprise SaaS ERP — Canonical Business Dictionary**

---

## 1. Executive Summary

This document defines the **Ubiquitous Language** for **APP MA'HAD Enterprise SaaS ERP**. In accordance with Domain-Driven Design (DDD) principles and Pesantren domain specifications, all domain experts, software architects, engineers, UI/UX designers, and automated systems MUST use these canonical terms consistently across codebase identifiers, database schemas, API parameters, and documentation.

---

## 2. Master Terminology Table

| Concept ID | Canonical Term | Indonesian Business Term | English Technical Term | Definition | Synonyms | Forbidden / Ambiguous Terms |
|---|---|---|---|---|---|---|
| **TERM-001** | **Tenant** | Tenant / Pesantren / Lembaga | Tenant Organization | A multi-tenant SaaS organization boundary representing a specific Pesantren entity with isolated data. | Pesantren, Lembaga, Client | *Company, Customer, Site, School (generic)* |
| **TERM-002** | **User** | Pengguna System | User Account | An authenticated principal possessing credentials, assigned roles, and permissions within a specific tenant context. | Akun, Login User | *Member, Account, Person* |
| **TERM-003** | **Santri** | Santri / Peserta Didik | Student Entity | A registered student enrolled in the Pesantren participating in academic, boarding, and character activities. | Murid, Siswa | *Client, Customer, Kid, Student (generic)* |
| **TERM-004** | **Wali** | Wali Santri | Guardian / Parent Entity | The legal guardian or parent responsible for a Santri's administrative approval and financial obligations. | Orang Tua, Orang Tua Santri | *Customer, Payer, Next of Kin* |
| **TERM-005** | **Guru** | Ustadz / Guru Pengajar | Teacher / Educator | An educator responsible for subject teaching (*KBM*) and classroom instruction within a Madrasah unit. | Ustadz, Ustadzah, Pengajar | *Staff, Employee (generic), Instructor* |
| **TERM-006** | **Musyrif** | Musyrif / Pembina Asrama | Dormitory Supervisor | A residential supervisor responsible for dorm management, santri character coaching, and boarding discipline. | Pembina Asrama, Pengasuh | *Warden, Caretaker, Hosteler* |
| **TERM-007** | **Madrasah** | Madrasah / Unit Instansi | Institutional Unit | An official educational unit within the Pesantren (e.g. MTs, MA, SMP, Tahfizh) operating an academic curriculum. | Unit Education, Instansi | *School, Department, Branch* |
| **TERM-008** | **Jenjang** | Jenjang Pendidikan | Education Level | An educational tier classification (e.g. SMP, SMA, MTs, MA, Ulya) defining curriculum standards. | Tingkatan Sekolah, Tier | *Grade (ambiguous), Level (generic)* |
| **TERM-009** | **Tingkat** | Tingkat / Grade | Grade Level | The numeric grade level within a Jenjang (e.g. Grade 7 in MTs, Grade 10 in MA). | Kelas X/Y/Z, Year Level | *Step, Rank, Order* |
| **TERM-010** | **Kelas** | Kelas / Rombongan Belajar (Rombel) | Classroom Cohort | A specific student group assigned to a classroom, physical location, and Wali Kelas for an academic year. | Rombel, Cohort | *Group, Section, Batch* |
| **TERM-011** | **Tahun Ajaran** | Tahun Ajaran | Academic Year | A multi-month operational academic cycle (e.g. 2026/2027) spanning Ganjil and Genap semesters. | Tahun Akademik, Academic Period | *Fiscal Year, Calendar Year* |
| **TERM-012** | **Semester** | Semester / Term | Academic Term | A sub-period of a Tahun Ajaran (Ganjil / Genap) during which courses are taken and grades recorded. | Term, Paruh Tahun | *Quarter, Trimester, Session* |
| **TERM-013** | **Mata Pelajaran** | Mata Pelajaran / Mapel | Subject / Course | A distinct academic course topic (e.g. *Fiqih*, *Nahwu*, *Matematika*) taught by a Guru. | Mapel, Course | *Topic, Lesson, Module* |
| **TERM-014** | **Asrama** | Asrama / Gedung Hunian | Dormitory Building | A residential dormitory building housing male or female santri, managed by Musyrif. | Gedung, Komplek Hunian | *Hostel, Hotel, Barracks* |
| **TERM-015** | **Kamar** | Kamar Asrama | Dormitory Room | A physical room inside an Asrama with a designated bed capacity limit. | Ruang Asrama, Room | *Cell, Unit, Apartment* |
| **TERM-016** | **Tagihan** | Tagihan SPP / Biaya | Tuition Billing / Fee | An administrative bill issued to a Wali for monthly SPP, building fees, or meal plans. | Biaya Pondok, Billing | *Debt, Charge, Cost* |
| **TERM-017** | **Pembayaran** | Pembayaran / Remittance | Payment Receipt | A financial transaction settlement paying an Invoice via Flip gateway, VA, or cash. | Setoran, Payment | *Income, Revenue* |
| **TERM-018** | **Ledger** | Buku Besar / Jurnal Financial | General Ledger | A multi-tenant double-entry accounting ledger recording debits, credits, and financial account balances. | Jurnal Keuangan, Accounting Book | *Database, Log, List* |
| **TERM-019** | **Invoice** | Invoice / Faktur Pembayaran | Invoice Entity | A formal payable document generated for a Wali containing line items for SPP and wallet top-ups. | Faktur, Billing Document | *Bill (ambiguous), Receipt (ambiguous)* |
| **TERM-020** | **Academic Status** | Status Akademik | Student Academic State | The current educational standing of a Santri (`AKTIF`, `CUTI`, `LULUS`, `KELUAR`). | Status Siswa, Enrollment State | *Condition, Situation* |
| **TERM-021** | **Santri Lifecycle** | Siklus Hidup Santri | Lifecycle State Machine | The formal DDD state machine governing status progression from `DRAFT` to `ALUMNI`. | Lifecycle Status, State Workflow | *Pipeline, Flow, Process* |
| **TERM-022** | **Wali Kelas** | Wali Kelas | Classroom Supervisor Teacher | A teacher assigned to supervise and manage a specific `Kelas` cohort and student report cards. | Pembina Kelas, Class Teacher | *Advisor, Tutor, Mentor* |
| **TERM-023** | **Uang Saku** | Uang Saku Santri | Pocket Money Balance | Virtual allowance wallet balance allocated for daily canteen expenditures by a Santri. | Tabungan Daily, Balance Kantin | *Cash, Allowance (generic)* |
| **TERM-024** | **Tabungan** | Tabungan Santri | Savings Pocket Balance | Locked virtual savings balance managed by Wali for long-term expenses. | Simpanan Santri, Deposit | *Investment, Stock* |

---

## 3. Strict Naming Conventions for Codebase

To prevent domain concept duplication and terminology pollution, the following coding standards are enforced:

### 3.1 Database & Schema Conventions
- Use `tenant_id` consistently for multi-tenant scoping.
- Use `santri_id`, `wali_id`, `asrama_id`, `kamar_id`, `kelas_id` for foreign keys.
- Tables MUST use plural lowercase names (`tenants`, `santri`, `asrama`, `kamar`, `kelas`, `mapel`, `invoices`, `wallets`).

### 3.2 Code Variable Conventions
- Prefer domain terms: `santri`, `wali`, `musyrif`, `guru`, `asrama`, `kamar`, `tagihan`, `invoices`.
- Avoid generic terms like `student`, `parent`, `dorm`, `school`, `billing`, `class_group` in business logic unless translating external API contracts.

### 3.3 State Machine Enum Values
- `DRAFT`, `REGISTERED`, `VERIFIED`, `ACTIVE`, `SUSPENDED`, `TRANSFERRED`, `GRADUATED`, `ALUMNI`, `ARCHIVED`.
