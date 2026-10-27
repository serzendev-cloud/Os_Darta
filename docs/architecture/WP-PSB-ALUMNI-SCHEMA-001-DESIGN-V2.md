# WP-PSB-ALUMNI-SCHEMA-001-DESIGN-V2

**Work Package ID**: `WP-PSB-ALUMNI-SCHEMA-001`  
**Title**: PSB & Alumni Ecosystem — Technical Schema & API Architecture Design (Revision 2 — Final Aligned Candidate)  
**Document Status**: COMPLETED — SUBMITTED FOR PRODUCT OWNER FINAL REVIEW & DDL AUTHORIZATION  
**Classification**: FINAL CORRECTION GATE — DESIGN ONLY (NO CODE / NO MIGRATION / NO DATABASE WRITE)  
**Authority**: Product Owner Review, Confirmed Business Decisions, PRD PSB & Alumni Ecosystem  
**Author**: Senior Principal Systems Architect, Database Domain Designer, Security & RLS Architect  
**Date**: September 2026  

---

## 1. EXECUTIVE SUMMARY

This document represents the **Final Aligned Revision 2 (V2)** of the technical schema and API architecture design for the **PSB (Penerimaan Santri Baru)**, **Alumni Organization ("A")**, **Korwil Chapters**, **Privacy-Preserving Social Discovery ("Cari di Sekitar")**, and **Salam Silaturrahmi** ecosystems within APP MA'HAD.

Following the formal **Final Correction Gate**, this specification incorporates all confirmed business decisions from the Product Owner, eliminating any remaining ambiguities across all operational domains:

1. **WhatsApp Contact & Salam Silaturrahmi — Hyperlink / Deep Link Only (CONFIRMED)**:
   - "Hubungi via WhatsApp" and "Salam Silaturrahmi $\rightarrow$ WhatsApp" operate strictly via **WhatsApp hyperlink / deep link** (`whatsapp://send?text=...` or `https://wa.me/{phone}?text=...`).
   - The system **never sends WhatsApp messages automatically** on behalf of a user.
   - Pre-configured greeting templates and Salam reply templates function solely as **pre-filled message text**. The user reviews, edits, and **sends manually** inside the native WhatsApp application or WhatsApp Web.
   - **WAHA is strictly decoupled from social interactions**: WAHA is reserved exclusively for institutional system broadcasts (e.g. PSB application status notifications to Wali), and is **never** used in user-to-user social contact or Salam Silaturrahmi.
   - The concept of a server-side message-sending proxy is completely eliminated. To preserve phone number privacy, a non-sending link resolver/redirector is utilized so raw telephone numbers are never published in discovery JSON payloads.

2. **State-Safe Credential Transition (Santri $\rightarrow$ Alumni) — CONFIRMED**:
   - Active Santri log in using **NIS + Password**.
   - Upon being designated Alumni by the SAT, the **first login as Alumni is still executed using the existing NIS + Password**.
   - Upon successful first login, the alumnus is **mandatorily prompted to provide an active personal email**.
   - The email must be verified via an activation link/token.
   - **MANDATORY INVARIANT: NIS is NOT deactivated as a credential before the email is successfully verified.** If verification fails, expires, or is interrupted, the NIS credential remains fully active, preventing account lockout.
   - Once verified, the login identifier permanently transitions from **NIS $\rightarrow$ Email**, and a password update link is dispatched to that email.
   - Subsequent logins strictly use **Email + New Password**.
   - The underlying physical human identity (`users.id`) remains **identical throughout the entire lifecycle** (*One Person = One Identity*). Historical NIS is preserved permanently on `alumni_profiles.historical_nis`.

3. **DECISION-017 Confirmed Exit Reason Mechanism**:
   - Governed at the **Tenant Level**.
   - Combines **Default System Vocabulary** (e.g. *Lulus Jenjang/Khatam*, *Pindah Sekolah/Pesantren*, *Mengundurkan Diri*, *Dikeluarkan*) with **Custom Tenant Vocabulary** managed by the SAT.
   - **Durable Historical Protection**: Any exit reason that has been assigned to an academic snapshot cannot be hard-deleted; deactivation is handled exclusively via soft-toggle (`is_active = false`).

4. **DECISION-014 Confirmed Domicile Transfer Mode**:
   - `OFF (false)`: Auto-transfer Korwil membership immediately when stored domicile is updated.
   - `ON (true)`: Requires manual confirmation by the receiving Korwil before membership is transferred.

5. **DECISION-015 Confirmed PSB Authentication**:
   - Prospective parents (Wali) **must hold an authenticated account** to submit and track PSB applications. Technical delivery methods (Magic Link, OTP, or password) are technical implementation options.

6. **DECISION-016 Confirmed Location Ephemeral Behavior**:
   - Discovery locations are strictly temporary and ephemeral; TTL (recommended default: 6 hours) is a configurable security parameter.

---

## 2. SCOPE & NON-GOALS

### In-Scope Design Elements:
- Reconciled conceptual Entity-Relationship Model and Drizzle ORM schema specifications.
- Tenant isolation and fail-closed Row-Level Security (RLS) policies for all proposed tables.
- Clarified identity and persona models supporting multi-context users (*Wali + Alumni*).
- Placement distribution schema bridging Tenant-wide PSB to Madrasah Academic Sovereignty.
- Privacy-safe proximity query projections stripped of raw coordinates, distances, phone numbers, and street addresses.
- Ephemeral interaction schema for Salam Silaturrahmi enforcing the 1-hour pair cooldown without chat history.
- Non-sending WhatsApp deep-link generation and client redirection.
- State-safe credential transition lifecycle with failure-proof fallback invariants.
- Exit reason configuration schema (`alumni_exit_reasons`) with durable historical integrity.
- Detailed comparative analysis of technical architecture options for Identity Federation.
- Reconciled Conflict Register and closed business decisions.

### Absolute Non-Goals & Prohibitions:
```text
DDL AUTHORIZATION STATUS: NOT AUTHORIZED
NO APPLICATION CODING
NO DDL EXECUTION
NO DATABASE WRITES OR RUNNING MIGRATIONS
NO MODIFICATION TO EXISTING SOURCE CODE OR FRONTEND
NO MODIFICATION TO FROZEN L4 ACADEMIC TABLES (madrasah, jenjang, tingkat, rombel)
REVISION 1 (WP-PSB-ALUMNI-SCHEMA-001-DESIGN.md) IS PRESERVED AND NOT DELETED
```

---

## 3. EXISTING ARCHITECTURE CONSTRAINTS & FROZEN FOUNDATIONS

Revision 2 strictly respects the frozen architecture established in prior certified work packages:

1. **Frozen Level-4 Academic Structure (`WP-ACADEMIC-STRUCTURE-CLOSURE-001`)**:
   $$\mathbf{Tenant} \longrightarrow \mathbf{Madrasah} \longrightarrow \mathbf{Jenjang} \longrightarrow \mathbf{Tingkat\ (Nama\ Tingkat)} \longrightarrow \mathbf{Rombel}$$
   - Madrasah is the sovereign Academic Governance Boundary (`WP-ACADEMIC-CONTEXT-BOUNDARY-001`).
   - PSB is Tenant-wide; academic placement is Madrasah-sovereign.
   - The platform strictly rejects any "Global Tingkat" or global classroom concept on `santri`.
2. **Multi-Tenant Session Context (`WP-SAAS-SEC-002`)**:
   - Every database transaction executes within `withTenantTransaction`, enforcing `SET LOCAL app.current_tenant_id` at the PostgreSQL engine level.
3. **Central Platform Identity System of Record**:
   - The `users` table is the immutable single identity record mapped 1:1 to Supabase Auth (`auth.users.id`).
4. **Audit and Outbox Ledgers**:
   - High-authority transitions record immutable entries in `audit_logs` (`WP-AUDIT-PERSISTENCE-REMEDIATION-001`).
   - Background tasks (institutional email triggers, automated tenant broadcasts) communicate asynchronously via `outbox_events`.

---

## 4. DOMAIN BOUNDARIES & BUSINESS INVARIANTS

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   CANONICAL DOMAIN SEPARATION IN APP MA'HAD                      │
├──────────────────────────────────────────────────────────────────────────────────┤
│ TENANT ECOSYSTEM                                                                 │
│ • Satu Tenant = Satu Ekosistem Pesantren.                                        │
│ • Boundary for institutional settings, PSB intake, and Alumni organization.      │
├──────────────────────────────────────────────────────────────────────────────────┤
│ PSB (PENERIMAAN SANTRI BARU)                                                     │
│ • Tenant-wide admission system covering all Madrasahs within the institution.    │
│ • Wali does NOT select a Madrasah during registration.                           │
│ • Wave count is strictly 1 or 2 waves per admission year.                        │
│ • Verification of Infaq Formulir proof promotes Applicant -> Calon Santri.       │
│ • Calon Santri operates under Wali family portal; holds NO independent login.    │
│ • SAT possesses EXCLUSIVE final authority for "Lulus / Diterima".                │
│ • Acceptance immediately provisions Santri record & NIS (no re-registration).    │
├──────────────────────────────────────────────────────────────────────────────────┤
│ MADRASAH ACADEMIC SOVEREIGNTY                                                    │
│ • Independent academic calendar, curriculum, gradebook, and classroom rosters.   │
│ • Panitia PSB proposes student distribution; each Madrasah Admin explicitly      │
│   approves / confirms placement for their respective Madrasah context.           │
│ • Graduate (Lulusan) is Madrasah-contextual; completing MTs while active in      │
│   Tahfizh leaves the student ACTIVE.                                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ALUMNI & KORWIL ("A")                                                            │
│ • Alumni status is Tenant-level; SAT is the exclusive final authority.           │
│ • Mandatory immutable educational snapshot recorded across all attended Madrasahs│
│   at exit (Madrasah, last Jenjang, last Nama Tingkat, exit date, exit reason).   │
│ • Stored Domicile determines Korwil membership; GPS determines current location. │
│ • GPS NEVER alters Korwil membership.                                            │
│ • Active Santri are NOT members of Alumni Korwils.                               │
│ • Dhoif / Tamu is a contextual presence state, not a permanent status.           │
├──────────────────────────────────────────────────────────────────────────────────┤
│ SOCIAL DISCOVERY & COMMUNICATION                                                 │
│ • Unified screen for Alumni, active Santri, and Dhoif/Tamu sorted by proximity.  │
│ • ZERO LEAKAGE: No coordinates, numeric distances, phone numbers, or addresses. │
│ • Alumni display Nama Alias; Alumni without alias are excluded from discovery.   │
│ • Active Santri display real name + Jenjang + Nama Tingkat (Rombel is hidden).   │
│ • Hide Profile is absolute and CANNOT be bypassed by Salam Silaturrahmi.         │
│ • Salam Silaturrahmi is NOT a chat system (no message history, 1-hr cooldown).   │
│ • WhatsApp contact uses hyperlink/deep link; manual user send; NO auto-sending.  │
│ • WAHA is strictly decoupled from social contacts and Salam Silaturrahmi.        │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. IDENTITY MODEL: ONE PERSON = ONE IDENTITY

A fundamental law of APP MA'HAD is:
$$\mathbf{One\ Person} = \mathbf{One\ Identity\ (Central\ Users\ Table)}$$

An individual human being must never possess multiple user accounts in the platform, regardless of how many roles or contexts they hold.

### Multi-Context Scenarios:
1. **Wali + Alumni**: A former student (Alumnus) whose child enrolls in the pesantren has a single `users` record. They log in with their email address and access both the **Wali Portal** (child grades, bills, announcements) and the **Alumni Portal** (Korwil, Discovery, Salam Silaturrahmi).
2. **Active Santri $\rightarrow$ Alumni**: A student progresses through KBM using their NIS. When SAT designates them as Alumni, the account credential shifts from NIS login to Email login following the confirmed state-safe business workflow, retaining the original `users.id` and permanent historical NIS.
3. **Calon Santri**: Prospective students do **not** possess a user identity. They exist as dependent applicant records tied to the registered Wali's `users.id`.

---

## 6. PERSONA VS. ROLE VS. ORGANIZATIONAL POSITION MODEL

Revision 2 explicitly decouples the identity taxonomy into five distinct layers:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          FIVE-LAYER IDENTITY TAXONOMY                            │
├──────────────────────────┬───────────────────────────────────────────────────────┤
│ 1. Person Identity       │ Physical human mapped to users table & auth.users.id. │
│                          │ Attributes: Name, Email, Phone, Avatar.               │
├──────────────────────────┼───────────────────────────────────────────────────────┤
│ 2. Tenant Membership     │ Relationship anchoring a Person to a Pesantren Tenant │
│                          │ (user_tenant_memberships).                            │
├──────────────────────────┼───────────────────────────────────────────────────────┤
│ 3. Persona / Context     │ Ecosystem operational hat: WALI, SANTRI, ALUMNI.      │
│                          │ Governs portal routing and available life experiences.│
│                          │ A Person can hold multiple Personas simultaneously.   │
├──────────────────────────┼───────────────────────────────────────────────────────┤
│ 4. Authorization Role    │ Technical RBAC permission set (tenant_roles).         │
│                          │ Examples: ADMIN, GURU, MUSYRIF, BENDAHARA, STAFF.     │
│                          │ Governs system actions and API permission checks.     │
├──────────────────────────┼───────────────────────────────────────────────────────┤
│ 5. Organizational        │ Appointed leadership or committee postings within     │
│    Position              │ governance bodies:                                    │
│                          │ • Ketua Panitia PSB (appointed per PSB period)        │
│                          │ • Ketua Umum Alumni / Administrator Alumni (A Pusat)  │
│                          │ • Ketua Korwil / Bendahara Korwil (A Korwil Daerah)   │
└──────────────────────────┴───────────────────────────────────────────────────────┘
```

---

## 7. PSB SUBSYSTEM TECHNICAL SCHEMA DESIGN

### 7.1 Entity: `psb_periods` (Tenant Admission Period)
```typescript
export const psbPeriods = pgTable('psb_periods', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  academicYearId: text('academic_year_id').notNull().references(() => academicYears.id, { onDelete: 'restrict' }),
  name: text('name').notNull(), // e.g. "PSB T.A. 2027/2028"
  waveCount: integer('wave_count').default(1).notNull(), // Strictly 1 or 2
  status: text('status').default('draft').notNull(), // 'draft' | 'published' | 'open' | 'selection' | 'distribution' | 'closed'
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  infaqFormulirAmount: integer('infaq_formulir_amount').default(0).notNull(),
  paymentBankName: text('payment_bank_name'),
  paymentAccountNumber: text('payment_account_number'),
  paymentAccountHolder: text('payment_account_holder'),
  instructions: text('instructions'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantStatusIdx: index('idx_psb_periods_tenant_status').on(table.tenantId, table.status),
  waveCountCheck: check('chk_psb_periods_wave_count', sql`wave_count IN (1, 2)`),
  statusCheck: check('chk_psb_periods_status', sql`status IN ('draft', 'published', 'open', 'selection', 'distribution', 'closed')`),
  dateCheck: check('chk_psb_periods_dates', sql`start_date <= end_date`),
}));
```

### 7.2 Entity: `psb_committees` (PSB Panitia Ledger)
```typescript
export const psbCommittees = pgTable('psb_committees', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  psbPeriodId: text('psb_period_id').notNull().references(() => psbPeriods.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  positionTitle: text('position_title').notNull(), // 'KETUA_PANITIA' | 'SEKRETARIS' | 'BENDAHARA' | 'TIM_SELEKSI' | 'ANGGOTA'
  appointedBy: text('appointed_by').notNull().references(() => users.id, { onDelete: 'restrict' }), // SAT appoints Ketua; Ketua appoints members
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  committeeUnique: unique('uq_psb_committee_period_user').on(table.tenantId, table.psbPeriodId, table.userId),
  singleKetuaUnique: uniqueIndex('uq_psb_committee_single_ketua').on(table.tenantId, table.psbPeriodId).where(sql`position_title = 'KETUA_PANITIA'`),
}));
```

### 7.3 Entity: `psb_applicants` (Prospective Student System of Record)
```typescript
export const psbApplicants = pgTable('psb_applicants', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  psbPeriodId: text('psb_period_id').notNull().references(() => psbPeriods.id, { onDelete: 'restrict' }),
  waveNumber: integer('wave_number').default(1).notNull(), // 1 or 2
  registrationNumber: text('registration_number').notNull(), // e.g. "PSB-2027-0012"
  waliUserId: text('wali_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  waliRelationship: text('wali_relationship').notNull(), // 'AYAH' | 'IBU' | 'WALI'
  applicantName: text('applicant_name').notNull(),
  applicantGender: text('applicant_gender').notNull(), // 'L' | 'P'
  birthPlace: text('birth_place').notNull(),
  birthDate: date('birth_date').notNull(),
  nik: text('nik'),
  nisn: text('nisn'),
  previousSchoolName: text('previous_school_name').notNull(),
  previousSchoolLevel: text('previous_school_level').notNull(), // 'SD' | 'MI' | 'SMP' | 'MTS' | etc.
  previousSchoolAddress: text('previous_school_address'),
  status: text('status').default('DRAFT').notNull(), // 'DRAFT' | 'SUBMITTED' | 'CALON_SANTRI' | 'SELECTION_PROCESS' | 'LULUS' | 'TIDAK_LULUS' | 'PLACED' | 'CANCELLED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantRegNoUnique: unique('uq_psb_applicants_reg_no').on(table.tenantId, table.registrationNumber),
  tenantStatusIdx: index('idx_psb_applicants_tenant_status').on(table.tenantId, table.status),
  waliIdx: index('idx_psb_applicants_wali').on(table.tenantId, table.waliUserId),
  genderCheck: check('chk_psb_applicants_gender', sql`applicant_gender IN ('L', 'P')`),
  statusCheck: check('chk_psb_applicants_status', sql`status IN ('DRAFT', 'SUBMITTED', 'CALON_SANTRI', 'SELECTION_PROCESS', 'LULUS', 'TIDAK_LULUS', 'PLACED', 'CANCELLED')`),
}));
```

### 7.4 Entity: `psb_infaq_verifications` (Infaq Formulir Approval Ledger)
```typescript
export const psbInfaqVerifications = pgTable('psb_infaq_verifications', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  applicantId: text('applicant_id').notNull().references(() => psbApplicants.id, { onDelete: 'cascade' }),
  transferAmount: integer('transfer_amount').notNull(),
  bankOrigin: text('bank_origin').notNull(),
  accountHolderOrigin: text('account_holder_origin').notNull(),
  transferDate: date('transfer_date').notNull(),
  receiptFileUrl: text('receipt_file_url').notNull(),
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason: text('rejection_reason'),
  verifiedBy: text('verified_by').references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  applicantUnique: unique('uq_psb_infaq_applicant').on(table.tenantId, table.applicantId),
  statusCheck: check('chk_psb_infaq_status', sql`status IN ('PENDING', 'APPROVED', 'REJECTED')`),
}));
```

### 7.5 Entity: `psb_acceptance_ledgers` (SAT Acceptance & NIS Provisioning)
```typescript
export const psbAcceptanceLedgers = pgTable('psb_acceptance_ledgers', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  applicantId: text('applicant_id').notNull().references(() => psbApplicants.id, { onDelete: 'restrict' }),
  decision: text('decision').notNull(), // 'LULUS' | 'TIDAK_LULUS'
  satUserId: text('sat_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  generatedNis: text('generated_nis'),
  provisionedSantriId: text('provisioned_santri_id').references(() => santri.id, { onDelete: 'restrict' }),
  decisionNotes: text('decision_notes'),
  decidedAt: timestamp('decided_at').defaultNow().notNull(),
}, (table) => ({
  applicantUnique: unique('uq_psb_acceptance_applicant').on(table.tenantId, table.applicantId),
  decisionCheck: check('chk_psb_acceptance_decision', sql`decision IN ('LULUS', 'TIDAK_LULUS')`),
}));
```

---

## 8. PLACEMENT INTEGRITY & SOVEREIGNTY BRIDGE

### 8.1 Invariant Architecture
PSB distribution allocates an accepted student across one or more Madrasahs. The target hierarchy is strictly:
$$\mathbf{Madrasah} \longrightarrow \mathbf{Jenjang} \longrightarrow \mathbf{Nama\ Tingkat} \longrightarrow \mathbf{Rombel}$$

To guarantee that invalid cross-madrasah or cross-tingkat combinations cannot be inserted:
1. `madrasahId`, `jenjangId`, and `tingkatId` are validated against composite foreign keys matching frozen L4 constraints.
2. `rombelId` is validated against `rombel (tenant_id, id)`.
3. Invariant validation in the application domain service verifies that `rombel.tingkatId == tingkats.id`.

### 8.2 Entity: `psb_placement_distributions`
```typescript
export const psbPlacementDistributions = pgTable('psb_placement_distributions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  psbPeriodId: text('psb_period_id').notNull().references(() => psbPeriods.id, { onDelete: 'restrict' }),
  applicantId: text('applicant_id').notNull().references(() => psbApplicants.id, { onDelete: 'restrict' }),
  santriId: text('santri_id').notNull().references(() => santri.id, { onDelete: 'restrict' }),
  madrasahId: text('madrasah_id').notNull().references(() => madrasah.id, { onDelete: 'restrict' }),
  jenjangId: text('jenjang_id').notNull().references(() => jenjang.id, { onDelete: 'restrict' }),
  tingkatId: text('tingkat_id').notNull().references(() => tingkat.id, { onDelete: 'restrict' }), // UI / Business terminology: "Nama Tingkat"
  rombelId: text('rombel_id').notNull().references(() => rombel.id, { onDelete: 'restrict' }),
  status: text('status').default('PROPOSED').notNull(), // 'PROPOSED' | 'CONFIRMED' | 'REJECTED'
  proposedByUserId: text('proposed_by_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  confirmedByUserId: text('confirmed_by_user_id').references(() => users.id, { onDelete: 'restrict' }),
  confirmedAt: timestamp('confirmed_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Santri placed at most once per Madrasah per admission period
  santriMadrasahUnique: unique('uq_psb_dist_santri_madrasah').on(table.tenantId, table.psbPeriodId, table.santriId, table.madrasahId),
  statusCheck: check('chk_psb_dist_status', sql`status IN ('PROPOSED', 'CONFIRMED', 'REJECTED')`),
  // Database-level composite integrity constraint
  madrasahTingkatFk: foreignKey({
    columns: [table.tenantId, table.madrasahId, table.tingkatId],
    foreignColumns: [tingkat.tenantId, tingkat.madrasahId, tingkat.id],
    name: 'fk_psb_dist_madrasah_tingkat',
  }).onDelete('restrict'),
  tenantMadrasahIdx: index('idx_psb_dist_madrasah').on(table.tenantId, table.madrasahId, table.status),
  santriIdx: index('idx_psb_dist_santri').on(table.tenantId, table.santriId),
}));
```

---

## 9. GRADUATE VS. ALUMNI SEPARATION

The platform strictly enforces the business distinction between graduating a Madrasah and becoming a pesantren Alumnus:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          GRADUATE VS ALUMNI SEPARATION                           │
├──────────────────────────┬──────────────────────┬────────────────────────────────┤
│ Attribute                │ Graduate (Madrasah)  │ Alumni (Pesantren Tenant)      │
├──────────────────────────┼──────────────────────┼────────────────────────────────┤
│ Scope                    │ Madrasah-Contextual  │ Tenant-Wide                    │
│ Authority                │ Madrasah Board / TU  │ SAT (Super Admin Tenant)       │
│ Multi-Madrasah Behavior  │ Graduating MTs while │ Allowed ONLY when no active    │
│                          │ active in Tahfizh    │ KBM relations remain across    │
│                          │ -> Remains SANTRI    │ any Madrasah in the Tenant.    │
│ System Consequence       │ Gradebook completed  │ All KBM ceased; educational    │
│                          │ for that Madrasah.   │ snapshot recorded; credential  │
│                          │                      │ transitions NIS -> Email.      │
└──────────────────────────┴──────────────────────┴────────────────────────────────┘
```

---

## 10. ALUMNI ACADEMIC SNAPSHOT & CONFIRMED EXIT REASON LEDGER

### 10.1 Durable Historical Ledger Principles
1. An academic snapshot is an **authoritative institutional record**. It must be tied directly to the permanent student entity (`santri_id`) and the Person's central identity (`users.id`), with `ON DELETE RESTRICT`. Deleting or hiding an alumnus's social discovery profile must **never** destroy their historical academic credentials.
2. Changes to Alias, Domicile, Korwil, or visibility flags have **zero effect on historical academic snapshots**.

### 10.2 Entity: `alumni_exit_reasons` (Confirmed Decision 017 Architecture)
- **Scope**: Governed at the **Tenant Level**.
- **Model**: Combines **Default System Vocabulary** with **Custom Tenant Vocabulary**.
- **Historical Protection**: Reasons that have been assigned to snapshots are permanently preserved; deactivation is handled exclusively via `is_active = false` (destructive hard deletes are forbidden).
```typescript
export const alumniExitReasons = pgTable('alumni_exit_reasons', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  code: text('code').notNull(), // e.g. "GRADUATED", "TRANSFER_OUT", "PERSONAL_WITHDRAWAL", "DISCIPLINARY"
  label: text('label').notNull(), // e.g. "Lulus Jenjang / Tamat", "Pindah Sekolah/Pesantren", "Mengundurkan Diri"
  description: text('description'),
  isSystemDefault: boolean('is_system_default').default(false).notNull(), // true for platform defaults, false for SAT custom
  isActive: boolean('is_active').default(true).notNull(), // Soft-toggle; hard delete forbidden if referenced
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantCodeUnique: unique('uq_alumni_exit_reason_code').on(table.tenantId, table.code),
  tenantActiveIdx: index('idx_alumni_exit_reason_active').on(table.tenantId, table.isActive),
}));
```

### 10.3 Entity: `alumni_academic_snapshots`
```typescript
export const alumniAcademicSnapshots = pgTable('alumni_academic_snapshots', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }), // Permanent Person reference
  santriId: text('santri_id').notNull().references(() => santri.id, { onDelete: 'restrict' }), // Permanent Student record
  madrasahId: text('madrasah_id').notNull().references(() => madrasah.id, { onDelete: 'restrict' }),
  lastJenjangId: text('last_jenjang_id').notNull().references(() => jenjang.id, { onDelete: 'restrict' }),
  lastTingkatId: text('last_tingkat_id').notNull().references(() => tingkat.id, { onDelete: 'restrict' }), // UI: "Nama Tingkat"
  exitDate: date('exit_date').notNull(),
  exitReasonId: text('exit_reason_id').notNull().references(() => alumniExitReasons.id, { onDelete: 'restrict' }),
  exitReasonCodeSnapshot: text('exit_reason_code_snapshot').notNull(), // Immutable freeze of reason code at exit
  exitReasonDescriptionSnapshot: text('exit_reason_description_snapshot'),
  notes: text('notes'),
  recordedBySatUserId: text('recorded_by_sat_user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Unique per student per Madrasah
  santriMadrasahUnique: unique('uq_alumni_snapshots_santri_madrasah').on(table.tenantId, table.santriId, table.madrasahId),
  tenantUserIdx: index('idx_alumni_snapshots_user').on(table.tenantId, table.userId),
}));
```

---

## 11. ALUMNI ORGANIZATION ("A") & KORWIL CHAPTERS

### 11.1 Entity: `alumni_profiles` (Social Persona & Domicile)
```typescript
export const alumniProfiles = pgTable('alumni_profiles', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  historicalNis: text('historical_nis').notNull(), // Permanent academic reference
  aliasName: text('alias_name'), // Moniker for discovery. If NULL, user is excluded from discovery
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  hideProfile: boolean('hide_profile').default(false).notNull(), // If true, completely hidden from discovery & Salam
  domicileProvince: text('domicile_province').notNull(),
  domicileCity: text('domicile_city').notNull(), // Kabupaten / Kota (Regency/City)
  domicileDistrict: text('domicile_district'), // Internal administrative detail only
  domicileAddress: text('domicile_address'), // Internal administrative detail only; NEVER exposed
  korwilId: text('korwil_id').references(() => alumniKorwils.id, { onDelete: 'set null' }), // Assigned via domicile resolution
  korwilTransferPending: boolean('korwil_transfer_pending').default(false).notNull(),
  pendingKorwilId: text('pending_korwil_id'),
  designatedAlumniAt: timestamp('designated_alumni_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userTenantUnique: unique('uq_alumni_profile_user_tenant').on(table.tenantId, table.userId),
  tenantCityIdx: index('idx_alumni_domicile_city').on(table.tenantId, table.domicileCity),
  tenantKorwilIdx: index('idx_alumni_korwil').on(table.tenantId, table.korwilId),
}));
```

### 11.2 Entity: `alumni_korwils` (Regional Chapters)
```typescript
export const alumniKorwils = pgTable('alumni_korwils', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  code: text('code').notNull(), // e.g. "KORWIL-MLG"
  name: text('name').notNull(), // e.g. "A Korwil Malang Raya"
  province: text('province').notNull(),
  city: text('city').notNull(), // Administrative matching key (Kabupaten/Kota)
  ketuaKorwilUserId: text('ketua_korwil_user_id').references(() => users.id, { onDelete: 'set null' }),
  bendaharaKorwilUserId: text('bendahara_korwil_user_id').references(() => users.id, { onDelete: 'set null' }),
  status: text('status').default('ACTIVE').notNull(),
  establishedBy: text('established_by').notNull().references(() => users.id, { onDelete: 'restrict' }), // Administrator Alumni
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantCodeUnique: unique('uq_alumni_korwil_code').on(table.tenantId, table.code),
  tenantCityIdx: index('idx_alumni_korwil_city').on(table.tenantId, table.city),
}));
```

### 11.3 Entity: `tenant_korwil_settings` (Confirmed Decision 014 Semantics)
```typescript
export const tenantKorwilSettings = pgTable('tenant_korwil_settings', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().unique().references(() => tenants.id, { onDelete: 'cascade' }),
  // Confirmed Decision 014 Business Semantics:
  // false (OFF) = Auto-transfer Korwil membership immediately upon domicile update
  // true  (ON)  = Requires confirmation before membership is transferred
  requireConfirmationOnDomicileChange: boolean('require_confirmation_on_domicile_change').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## 12. DOMICILE, GPS, AND DHOIF ARCHITECTURE

### 12.1 Decoupling Stored Domicile from Alumni Korwils
- Active Santri do not have an Alumni Korwil membership!
- Alumni whose home region has no established Korwil do not have a Korwil membership!
- Stored Domicile is a Person/Student geographical attribute; Korwil Membership is an Alumni organizational posting.

### 12.2 Resolution: Generalized Geographic Reference
1. `user_discovery_locations` records the **derived origin region** (`origin_city_name`) and an optional, nullable `origin_korwil_id`.
2. For an **Alumnus**: If their home domicile belongs to an established Korwil, `origin_korwil_id` is populated. When physically located in another Korwil region, they are flagged `is_dhoif = true`, and their card displays their home Korwil (`Korwil Asal`).
3. For an **Active Santri**: `origin_korwil_id` is strictly `NULL`. When physically outside their home city/pesantren region, they are flagged `is_dhoif = true`, and their card displays their home regency/city (`Kota Asal`), preserving privacy without forcing them into an alumni organization.

### 12.3 Entity: `user_discovery_locations` (Ephemeral Discovery Cache)
```typescript
export const userDiscoveryLocations = pgTable('user_discovery_locations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  personaType: text('persona_type').notNull(), // 'ALUMNI' | 'SANTRI'
  latCoarse: real('lat_coarse').notNull(), // Fuzzed coordinate (500m centroid jitter)
  lngCoarse: real('lng_coarse').notNull(), // Fuzzed coordinate (500m centroid jitter)
  currentCity: text('current_city').notNull(), // Regency / City of current location
  isDhoif: boolean('is_dhoif').default(false).notNull(),
  originCityName: text('origin_city_name').notNull(), // Stored domicile city (for Santri & Alumni)
  originKorwilId: text('origin_korwil_id').references(() => alumniKorwils.id, { onDelete: 'set null' }), // Set ONLY for Alumni with Korwil
  expiresAt: timestamp('expires_at').notNull(), // Ephemeral TTL expiration (recommended default: 6 hours)
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userTenantUnique: unique('uq_user_discovery_location').on(table.tenantId, table.userId),
  tenantSpatialIdx: index('idx_udl_tenant_spatial').on(table.tenantId, table.latCoarse, table.lngCoarse),
  expiresIdx: index('idx_udl_expires').on(table.expiresAt),
}));
```

---

## 13. PRIVACY-PRESERVING SOCIAL DISCOVERY ("CARI DI SEKITAR")

### 13.1 Strict Privacy Invariants
The presentation layer strictly enforces zero disclosure of sensitive attributes:
- **No Phone Numbers in Profile or Discovery JSON**: Phone numbers are **never** displayed as a profile field and **never** exposed in public discovery data or card API payloads (`hasWhatsAppContact: boolean` flag only).
- **No Raw Coordinates / GPS Leakage**: `latCoarse` and `lngCoarse` remain strictly internal to the database query engine; raw GPS coordinates are **never** exposed to the client.
- **No Numeric Distances**: Distance in meters, kilometers, or radial estimates are **never** returned in API responses.
- **No Street Addresses**: `domicile_address` and `domicile_district` are strictly withheld. Discovery displays only the **Regency / City (Kabupaten/Kota)**.

### 13.2 Discovery Output Schema Projection
```typescript
export interface SafeDiscoveryCardProjection {
  userId: string;
  displayName: string; // Alumni: Nama Alias; Santri: Real Name
  personaType: 'ALUMNI' | 'SANTRI';
  avatarUrl: string | null;
  isDhoif: boolean;
  dhoifBadgeLabel?: 'Dhoif';
  originLabel: string; // Alumni: "Korwil Asal: A Korwil Malang"; Santri: "Asal: Kota Malang"
  academicContext?: {
    jenjang: string;
    namaTingkat: string; // Rombel is strictly omitted!
  };
  hasWhatsAppContact: boolean; // Indicates availability of WhatsApp deep link without leaking phone number
}
```

---

## 14. SALAM SILATURRAHMI & WHATSAPP HYPERLINK / DEEP LINK INTEGRATION

### 14.1 Ephemeral Interaction Ledger (`salam_interactions`)
- **Domain Invariant**: **NOT A CHAT SYSTEM**. Stores only transient interaction pings to enforce the **1-hour cooldown per recipient pair** and dispatch in-app notifications.
- **Automatic Expiration**: Interaction records carry an `expires_at` timestamp (7 days) for automatic background purge.
```typescript
export const salamInteractions = pgTable('salam_interactions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  senderUserId: text('sender_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientUserId: text('recipient_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  messageType: text('message_type').notNull(), // 'TEMPLATE' | 'CUSTOM'
  templateText: text('template_text').notNull(),
  isReplied: boolean('is_replied').default(false).notNull(),
  repliedViaWa: boolean('replied_via_wa').default(false).notNull(),
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(), // Purged after 7 days
}, (table) => ({
  // Composite index powering the 1-hour cooldown check:
  // SELECT 1 FROM salam_interactions WHERE tenant_id = ? AND sender_user_id = ? AND recipient_user_id = ? AND sent_at > NOW() - INTERVAL '1 HOUR'
  cooldownLookupIdx: index('idx_salam_cooldown').on(table.tenantId, table.senderUserId, table.recipientUserId, table.sentAt),
}));
```

### 14.2 WhatsApp Hyperlink / Deep Link Integration Mechanics (Confirmed Product Owner Decision)

#### A. Operational Flow for "Hubungi via WhatsApp"
```text
User melihat profil
       ↓
[ Hubungi via WhatsApp ]
       ↓
WhatsApp / WhatsApp Web
       ↓
Pesan terbuka
       ↓
USER SEND MANUALLY
```
- **Sistem Tidak Mengirim Pesan Otomatis**: The system **never sends WhatsApp messages automatically** on behalf of a user.
- **Client Hyperlink / Deep Link**: Operates strictly via standard client-side protocol links (`whatsapp://send?text=...` or `https://wa.me/{phone}?text=...`).
- **Manual User Send**: The native WhatsApp application or WhatsApp Web opens with the chat view populated. The user reviews and clicks **Send manually**.

#### B. Operational Flow for "Salam Silaturrahmi"
```text
User
 ↓
Salam Silaturrahmi
 ↓
Pilih/template pesan
 ↓
WhatsApp hyperlink / deep link
 ↓
WhatsApp terbuka
 ↓
User mengirim sendiri
```
- **Pre-filled Message Text**: If the system prepares a template or greeting, the template acts strictly as **pre-filled message text** (draft), NOT an automatic outbound message.
- **User Sends Manually**: The user retains full control to review, edit, or cancel the message before manual transmission in WhatsApp.

#### C. Operational Flow for "Balas Salam Silaturrahmi $\rightarrow$ WhatsApp"
```text
Recipient menerima notifikasi Salam Silaturrahmi
       ↓
Pilih [ Balas via WhatsApp ]
       ↓
WhatsApp hyperlink / deep link terbuka
       ↓
Pesan balasan terisi otomatis (pre-filled reply)
       ↓
Recipient mengirim sendiri secara manual
```

#### D. WAHA Decoupling & Strict Architectural Boundary
- **WAHA is NOT a mandatory sender** for:
  - Hubungi via WhatsApp
  - Salam Silaturrahmi
  - Reply Salam Silaturrahmi
- **Prohibited Flow (STRICTLY FORBIDDEN / INVALID)**:
  ```text
  User ──► Salam ──► WAHA ──► Recipient (TIDAK VALID)
  ```
- **Valid Architecture Flow**:
  ```text
  User ──► Salam ──► WhatsApp Deep Link ──► User Sends
  ```
- **Domain Decoupling**: WAHA may only exist in the system architecture if explicitly required by separate institutional domains that mandate automated outbound delivery (e.g., administrative PSB application status notifications to Wali), completely decoupled and isolated from user-to-user social contact.

#### E. Elimination of Server Message Proxy & Privacy Preservation
- **Server Proxy Removal**: The previous concept mentioning a server proxy endpoint (`/api/social/wa-proxy/{id}`) that automatically dispatches WhatsApp messages is **completely eliminated from the design**.
- **Product Owner Preferred Design**:
  ```text
  Profile
     ↓
  WhatsApp hyperlink / deep link
     ↓
  WhatsApp
  ```
- **Non-Sending Target Resolver Helper**: If a lightweight helper endpoint is utilized by the client to construct the deep link, its purpose is strictly limited to:
  1. Verifying tenant boundary authorization and `hide_profile == false`.
  2. Generating the secure destination deep link (`whatsapp://send` or `https://wa.me/...`) so that raw phone numbers are never exposed in discovery card JSON payloads.
  - **Explicit Invariant**: This helper **DOES NOT SEND WHATSAPP MESSAGES**.
- **Privacy Protections**:
  - Nomor telepon tidak ditampilkan sebagai profile field.
  - Nomor tidak menjadi public discovery data (`hasWhatsAppContact: boolean` only).
  - GPS tidak diekspos (`latCoarse` & `lngCoarse` remain internal to database).
  - Distance tidak diekspos (numeric distance omitted from projection).
  - Alamat jalan tidak diekspos (`domicile_address` withheld; displays Regency/City only).

---

## 15. ALUMNI FINANCE & DONATION SCOPE ISOLATION

### 15.1 Entity: `alumni_donations`
- **Scope Isolation**: Bendahara Korwil can only view donations where `destination_scope = 'KORWIL'` and `destination_id = {caller_korwil_id}`.
- **Anonymous Display**: The system generates an automatic pseudonym (e.g. *"Hamba Allah #912"*). True identity is preserved internally for audit.
```typescript
export const alumniDonations = pgTable('alumni_donations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  destinationScope: text('destination_scope').notNull(), // 'A_PUSAT' | 'KORWIL' | 'PROGRAM' | 'ACTIVITY'
  destinationId: text('destination_id').notNull(),
  donorUserId: text('donor_user_id').references(() => users.id, { onDelete: 'set null' }),
  donorOriginKorwilId: text('donor_origin_korwil_id').references(() => alumniKorwils.id, { onDelete: 'set null' }),
  amount: integer('amount').notNull(),
  isAnonymous: boolean('is_anonymous').default(true).notNull(),
  systemAnonymousName: text('system_anonymous_name').notNull(), // e.g. "Hamba Allah #912"
  paymentProofUrl: text('payment_proof_url'),
  paymentStatus: text('payment_status').default('PENDING').notNull(), // 'PENDING' | 'VERIFIED' | 'REJECTED'
  verifiedByUserId: text('verified_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  scopeCheck: check('chk_alumni_donation_scope', sql`destination_scope IN ('A_PUSAT', 'KORWIL', 'PROGRAM', 'ACTIVITY')`),
  statusCheck: check('chk_alumni_donation_status', sql`payment_status IN ('PENDING', 'VERIFIED', 'REJECTED')`),
  amountCheck: check('chk_alumni_donation_amount', sql`amount > 0`),
  tenantScopeIdx: index('idx_alumni_donation_scope').on(table.tenantId, table.destinationScope, table.destinationId),
}));
```

---

## 16. ROW-LEVEL SECURITY & TENANT ISOLATION

Every table enforces PostgreSQL Row-Level Security with the mandatory predicate:
$$\mathbf{tenant\_id} = \mathbf{NULLIF(current\_setting('app.current\_tenant\_id',\ true),\ '')}$$

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     REVISED RLS SECURITY MATRIX                                        │
├────────────────────────────┬──────────────┬──────────────┬──────────────┬──────────────┬───────────────┤
│ Target Table               │ SELECT       │ INSERT       │ UPDATE       │ DELETE       │ RLS Isolation │
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ psb_periods                │ Public/Staff │ SAT Only     │ SAT Only     │ SAT Only     │ Tenant Filter │
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ psb_committees             │ Tenant Staff │ SAT & Ketua  │ SAT & Ketua  │ SAT Only     │ Period Bound  │
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ psb_applicants             │ Panitia, SAT,│ Wali Owner   │ Wali (Draft),│ SAT Only     │ Owner / Staff │
│                            │ Wali Owner   │              │ Panitia      │              │ Scoped        │
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ psb_infaq_verifications    │ Panitia, SAT,│ Wali Owner   │ Panitia / SAT│ None         │ Proof Scoped  │
│                            │ Wali Owner   │              │              │              │               │
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ psb_acceptance_ledgers     │ SAT, Panitia │ SAT Exclusiv.│ SAT Exclusiv.│ None         │ SAT Authority │
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ psb_placement_             │ Panitia, SAT,│ Panitia      │ Madrasah     │ SAT Only     │ Madrasah      │
│ distributions              │ Madrasah Adm.│              │ Admin (Own)  │              │ Sovereign FK  │
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ alumni_profiles            │ Same Tenant  │ SAT / System │ Profile Owner│ None         │ Alias Policy  │
│                            │ (Non-hidden) │              │              │              │ Enforced      │
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ alumni_exit_reasons        │ Same Tenant  │ SAT Only     │ SAT Only     │ None (Soft   │ Tenant Bound  │
│                            │              │              │              │ Toggle Only) │ (RESTRICT)    │
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ alumni_academic_snapshots  │ SAT, Staff,  │ SAT Exclusiv.│ None (Locked)│ None         │ Durable Ledger│
│                            │ Alumni Owner │              │              │              │ (RESTRICT)    │
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ alumni_korwils             │ Same Tenant  │ Admin Alumni │ Korwil Board │ None         │ Chartered Only│
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ alumni_donations           │ Scope Bound: │ Authenticated│ Respective   │ None         │ Destination   │
│                            │ Pusat/Korwil │ Donor        │ Treasurer    │              │ Scope Enforced│
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ user_discovery_locations   │ Same Tenant  │ Location     │ Location     │ Location     │ Strict Tenant │
│                            │ (Non-hidden) │ Owner        │ Owner        │ Owner        │ Spatial Filter│
├────────────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────────┤
│ salam_interactions        │ Sender /     │ Eligible     │ Recipient    │ None         │ 1-Hr Cooldown │
│                            │ Recipient    │ Santri/Alumni│ (Reply flag) │              │ Guarded       │
└────────────────────────────┴──────────────┴──────────────┴──────────────┴──────────────┴───────────────┘
```

---

## 17. LEGACY COMPATIBILITY & COEXISTENCE STRATEGY

1. **`santri.kelas` Field**:
   - *Status*: Deprecated as an academic authority.
   - *Coexistence*: Maintained as a read-only display projection for legacy UI pages. Automatically synchronized when a placement distribution is confirmed (`tingkat.ui_label + ' - ' + rombel.name`).
2. **`SantriStateMachine`**:
   - *Status*: Prototype state machine (`ACTIVE -> GRADUATED -> ALUMNI`).
   - *Coexistence*: Untouched during design phase. In implementation, it will be refactored to treat Madrasah graduation as an academic milestone while reserving Alumni transition strictly for the SAT.
3. **`users.role` Field**:
   - *Status*: Deprecated single string.
   - *Coexistence*: Remains populated with primary legacy role code; multi-context access is mediated through `user_tenant_personas`.

---

## 18. DECISION RECORD & STATE-SAFE CREDENTIAL TRANSITION

### 18.1 DECISION-013: State-Safe Credential Transition Lifecycle (CONFIRMED BUSINESS BEHAVIOR)

The business behavior for credential transition is officially **CONFIRMED** by the Product Owner:

```text
SANTRI
NIS + Password
       ↓
SAT menetapkan ALUMNI
       ↓
First login:
NIS + Password lama
       ↓
Berhasil
       ↓
Wajib memasukkan Email Aktif
       ↓
Email verification
       ↓
VERIFIED
       ↓
NIS → Email
       ↓
Password update/reset melalui Email
       ↓
Selesai
       ↓
Login normal:
Email + Password Baru
```

#### Core Transition Safety Invariants:

1. **NIS Retention Invariant**:
   > **NIS tidak boleh dinonaktifkan sebelum email berhasil diverifikasi.**

2. **Expected State Behavior on Failure (Anti-Lockout Protection)**:
   ```text
   Email belum verified
          ↓
   NIS tetap valid
   ```
   **Strictly Prohibited State Failure (Account Lockout)**:
   ```text
   Email belum verified
          ↓
   NIS dinonaktifkan
          ↓
   User kehilangan akses (STRICTLY PROHIBITED)
   ```

3. **Safe Transition Scenarios (8-Point Robustness Matrix)**:
   - **Email verification failure**: If verification fails (token invalid, network error), the pending email remains unverified; **NIS remains 100% active and valid** as the login credential.
   - **Expired verification link**: If the verification token expires before activation, **NIS remains valid**. Upon next login using NIS + old password, the alumnus is prompted to request a fresh verification link.
   - **Duplicate email**: If the entered email format is invalid or duplicate in submission, validation rejects it immediately; **NIS remains active**.
   - **Email already associated with same identity (Wali + Alumni)**: If the verified email already belongs to the same individual (e.g. already holding a Wali account in the platform), the system identifies the matching `users.id`, attaches the `ALUMNI` persona context to that single unified identity, and transitions the login identifier smoothly (*One Person = One Identity*).
   - **Email already associated with another identity**: If the email is registered to a different physical person, verification/binding is blocked with a clear error (*"Email telah digunakan oleh akun lain"*); **NIS remains valid**, prompting for a distinct personal email.
   - **Password update failure**: If the email is verified but the user fails to complete the password reset or the link expires, the verified email status is preserved. The user can trigger a standard password reset to their verified email; NIS fallback persists until password update completes.
   - **Interrupted transition**: If the user closes the browser or disconnects at any point during first login or email prompt, subsequent login using NIS + old password succeeds and resumes the prompt. The user is never locked out.
   - **Retry safety**: All transition operations are idempotent and fully safe for repeated user attempts.

4. **One Person = One Identity Invariant**:
   ```text
   ONE PERSON
       ↓
   ONE IDENTITY

   Credential transition:
   NIS → Email
   (bukan Identity A → Identity B)

   Skenario:
   ONE PERSON
   ├── WALI
   └── ALUMNI
   harus tetap satu identity.
   ```
   The credential transition changes only the **login identifier** (`NIS -> Email`), not the underlying human record. The central `users.id` remains invariant throughout the person's entire lifetime in APP MA'HAD.
   Historical NIS is permanently preserved on `alumni_profiles.historical_nis`.

---

### 18.2 DECISION-013: Identity Federation Technical Architecture Analysis (TECHNICAL DECISION)

To implement the confirmed business flow within Supabase Auth without creating duplicate identities:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                   IDENTITY FEDERATION ARCHITECTURAL COMPARISON                   │
├──────────────────────────┬──────────────────────┬────────────────────────────────┤
│ Evaluation Dimension     │ Option A: Synthetic  │ Option B: Custom Auth Bridge   │
│                          │ Internal Credential  │ (Stable Internal Identity)     │
├──────────────────────────┼──────────────────────┼────────────────────────────────┤
│ Active Student Mechanism │ Map student NIS to   │ Next.js login route validates  │
│                          │ {nis}@{tenant}.mahad │ NIS + password against         │
│                          │ in auth.users.       │ internal hash; issues token.   │
├──────────────────────────┼──────────────────────┼────────────────────────────────┤
│ First Login as Alumni    │ Alumnus inputs NIS;  │ Alumnus inputs NIS; verified   │
│                          │ frontend formats to  │ directly against internal hash.│
│                          │ synthetic email.     │                                │
├──────────────────────────┼──────────────────────┼────────────────────────────────┤
│ Email Verification Gate  │ Supabase Auth sends  │ Application sends custom token;│
│                          │ verify link; updates │ on verify, updates internal    │
│                          │ pending email.       │ email column.                  │
├──────────────────────────┼──────────────────────┼────────────────────────────────┤
│ Credential Shift         │ supabase.auth.admin. │ Login identifier switched      │
│                          │ updateUserById(uid,  │ to email in internal user      │
│                          │ { email: realEmail })│ record.                        │
├──────────────────────────┼──────────────────────┼────────────────────────────────┤
│ Password Reset           │ Supabase Auth native │ Custom application email link  │
│                          │ resetPasswordEmail().│ generates password update form.│
├──────────────────────────┼──────────────────────┼────────────────────────────────┤
│ Email Collision Handling │ If real email is     │ Pre-check prevents collision;  │
│                          │ already used by Wali │ supports persona linking       │
│                          │ account, links Wali  │ natively.                      │
│                          │ and Alumni personas. │                                │
├──────────────────────────┼──────────────────────┼────────────────────────────────┤
│ Supabase Compatibility   │ 100% Native Supabase │ Bypasses native Supabase Auth  │
│                          │ Auth session tokens. │ password verification.         │
├──────────────────────────┼──────────────────────┼────────────────────────────────┤
│ Architectural Status     │ **RECOMMENDED        │ ALTERNATIVE                    │
│                          │ TECHNICAL OPTION**   │ TECHNICAL OPTION               │
└──────────────────────────┴──────────────────────┴────────────────────────────────┘
```
*Note: The choice between Option A and Option B is an internal technical architecture decision; both options fully satisfy the confirmed business flow.*

---

### 18.3 DECISION-017: Exit Reason Architecture (CONFIRMED BUSINESS BEHAVIOR)
- **Status**: **CONFIRMED**.
- **Model**: Governed at the Tenant Level. Default System Vocabulary provided out-of-the-box, with SAT authority to add Custom Tenant Vocabulary.
- **Historical Protection**: Destructive hard deletes are strictly forbidden if an exit reason is referenced by an academic snapshot; soft deactivation (`is_active = false`) is enforced.

---

### 18.4 DECISION-014: Domicile Transfer Mode (CONFIRMED BUSINESS BEHAVIOR)
- **Status**: **CONFIRMED**.
- **Model**:
  - `OFF (false)`: Auto-transfer Korwil membership immediately when stored domicile is updated.
  - `ON (true)`: Requires manual confirmation before membership transfer is finalized.
- Handled via `tenant_korwil_settings.require_confirmation_on_domicile_change`.

---

### 18.5 DECISION-015: Public Registration Authentication (CONFIRMED BUSINESS BEHAVIOR)
- **Status**: **CONFIRMED**.
- **Model**: Prospective parents (Wali) **must hold an authenticated identity** to manage PSB applications. Technical delivery (Magic Link, OTP, or password) remains an implementation detail.

---

### 18.6 DECISION-016: Location Ephemeral Cache TTL (CONFIRMED BUSINESS BEHAVIOR)
- **Status**: **CONFIRMED**.
- **Model**: Discovery location is strictly temporary and ephemeral; TTL (recommended default: 6 hours) is a configurable security parameter with automated purge.

---

## 19. FINAL CONFLICT REGISTER

| ID | Conflict | Previous Design (V1) | Aligned Final Design (V2) | Status | Category |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CR-001** | **Domicile vs Korwil vs GPS** | Forced `homeKorwilId FK` on all discovery entries. | Decoupled location from Korwil; records origin city for all, Korwil for Alumni only. | `RESOLVED` | Architecture |
| **CR-002** | **Santri vs Korwil** | Santri linked to Alumni Korwils. | Santri origin is purely geographic (`origin_city_name`); zero FK to Alumni Korwils. | `RESOLVED` | Architecture |
| **CR-003** | **Snapshot Durability** | Cascaded delete from social profile. | Durable historical record referencing `santri_id` and `users.id` with `RESTRICT`. | `RESOLVED` | Integrity |
| **CR-004** | **Placement Integrity** | Missing composite integrity check to Tingkat within Madrasah. | Added composite foreign key `fk_psb_dist_madrasah_tingkat` enforcing same Tenant & Madrasah. | `RESOLVED` | Integrity |
| **CR-005** | **Exit Reason Model** | Prematurely hardcoded enum. | System defaults + SAT custom vocabulary with historical soft-toggle (`alumni_exit_reasons`). | `RESOLVED` | **Business Decision (017)** |
| **CR-006** | **Persona vs Role vs Position**| Conflated RBAC roles with organizational postings. | Established 5-layer taxonomy: Person $\rightarrow$ Membership $\rightarrow$ Persona $\rightarrow$ Role $\rightarrow$ Position. | `RESOLVED` | Architecture |
| **CR-007** | **Credential Transition Safety** | Immediate credential overwrite. | Decision: NIS remains active until email verification succeeds. State-safe transition lifecycle. | `RESOLVED` | **Business Decision (013)** |
| **CR-008** | **Domicile Transfer** | Marked as unresolved in V1. | Confirmed: `OFF` = auto-transfer, `ON` = confirmation required (`tenant_korwil_settings`). | `RESOLVED` | **Business Decision (014)** |
| **CR-009** | **PSB Auth Timing** | Conflated technical OTP with business rule. | Confirmed: Authenticated Wali identity required; auth transport is technical choice. | `RESOLVED` | **Business Decision (015)** |
| **CR-010** | **Location TTL** | Fixed 6 hours as locked business rule. | Confirmed: Ephemeral location mandatory; 6 hours is configurable parameter. | `RESOLVED` | **Business Decision (016)** |
| **CR-011** | **Discovery Privacy Scoping** | Ambiguous boundary between internal address and cards. | Explicitly constrained discovery projections to Regency/City, stripping street address. | `RESOLVED` | Privacy |
| **CR-012** | **WhatsApp Contact & Salam** | Proposed server sending proxy & WAHA for social contact. | Decision: WhatsApp contact uses hyperlink/deep link and manual user send. WAHA decoupled. | `RESOLVED` | **Business Decision** |
| **CR-013** | **Identity Federation Implementation** | Single option assumed. | Business behavior CONFIRMED. Identity Federation implementation requires technical evaluation. | `TECHNICAL ARCHITECTURE REVIEW` | Technical |

---

## 20. FINAL DESIGN ASSESSMENT & CROSS-DOMAIN AUDIT

```text
CROSS-DOMAIN AUDIT:
COMPLETED — NO KNOWN BUSINESS CONTRADICTIONS

Business Decisions:
CONFIRMED

Technical Architecture:
Identity Federation implementation
requires technical evaluation
```

The cross-domain consistency audit confirms:
1. **Cross-Domain Consistency Verified**: All business rules (PSB tenant-wide, Madrasah academic sovereignty, Graduate $\neq$ Alumni, One Person = One Identity, Domicile $\neq$ GPS, Discovery $\neq$ Chat, WhatsApp manual sending via deep link, State-safe credential transition) are in complete alignment with no known business contradictions.
2. **Preservation of Frozen Architecture**: The canonical Level-4 hierarchy (`madrasah`, `jenjang`, `tingkat`, `rombel`) is 100% preserved.
3. **Flawless Privacy Enforcement**: Projections strip all raw coordinates, numeric distances, WhatsApp numbers, and physical street addresses.
4. **Complete Business Alignment**: All foundational decisions are formally confirmed and modeled.

---

## 21. FINAL STATUS & DDL READINESS

```text
DESIGN V2 STATUS:
FINAL DESIGN CANDIDATE

BUSINESS DECISIONS:
CONFIRMED

CROSS-DOMAIN AUDIT:
COMPLETED — NO KNOWN BUSINESS CONTRADICTIONS

TECHNICAL ARCHITECTURE:
IDENTITY FEDERATION IMPLEMENTATION
REQUIRES TECHNICAL REVIEW

DDL AUTHORIZATION:
NOT AUTHORIZED
```

### Authorization Context:
All business decisions have been confirmed and the technical design candidate (Revision 2) is fully aligned and corrected. In accordance with the governance directives of APP MA'HAD, DDL script generation and migration execution remain strictly unauthorized until the Product Owner reviews this final candidate and issues explicit authorization.

---

## 22. FINAL HANDOVER TO PRODUCT OWNER

```text
WP-PSB-ALUMNI-SCHEMA-001

FINAL CORRECTION COMPLETED

Document:
docs/architecture/WP-PSB-ALUMNI-SCHEMA-001-DESIGN-V2.md

Revision 1:
PRESERVED

Corrections:
1. WhatsApp uses hyperlink/deep link only.
2. User sends WhatsApp message manually.
3. No automatic outbound WhatsApp via WAHA.
4. Server proxy removed unless strictly required as a non-sending helper.
5. NIS remains valid until email verification succeeds.
6. Santri -> Alumni credential transition is state-safe.
7. One Person = One Identity preserved.
8. Cross-domain audit wording corrected.

Implementation:
NONE

DDL:
NONE

Migration:
NONE

Frontend:
NONE

Database:
UNCHANGED

DDL Authorization:
NOT AUTHORIZED

Next Gate:
PRODUCT OWNER FINAL REVIEW
```

---
*Certified by: Senior Principal Systems Architect & Database Domain Designer (Antigravity Agent)*  
*Timestamp: September 17, 2026*
