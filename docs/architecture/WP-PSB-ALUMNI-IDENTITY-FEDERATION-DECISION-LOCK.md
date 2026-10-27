# WP-PSB-ALUMNI-IDENTITY-FEDERATION — PRODUCT OWNER DECISION LOCK

```text
══════════════════════════════════════════════════════════════════════════════════
WORK PACKAGE: WP-PSB-ALUMNI-SCHEMA-001
DOCUMENT: docs/architecture/WP-PSB-ALUMNI-IDENTITY-FEDERATION-DECISION-LOCK.md
TITLE: Formal Product Owner Decision Lock — Identity Federation Architecture
DECISION GATE: PRODUCT OWNER TECHNICAL DECISION (GATE 4)
SELECTED ARCHITECTURE: OPTION A — SYNTHETIC SUPABASE AUTH CREDENTIAL
                                   WITH ORCHESTRATED IDENTITY CONSOLIDATION
STATUS: FORMALLY SELECTED & ARCHITECTURALLY LOCKED
ALTERNATIVE STATUS: OPTION B (CUSTOM NEXT.JS AUTH BRIDGE) — NOT SELECTED
AUTHORIZATION STATUS:
  • IMPLEMENTATION: ❌ NOT AUTHORIZED
  • DDL GENERATION: ❌ NOT AUTHORIZED
  • MIGRATION EXECUTION: ❌ NOT AUTHORIZED
  • DATABASE MUTATION: ❌ FORBIDDEN
  • FRONTEND DEVELOPMENT: ❌ NOT AUTHORIZED
══════════════════════════════════════════════════════════════════════════════════
```

---

## 1. FORMAL PRODUCT OWNER DECISION RECORD

In accordance with the Technical Decision Package presented in `docs/architecture/WP-PSB-ALUMNI-IDENTITY-FEDERATION-DECISION.md`, the **Product Owner has formally and conclusively selected**:

```text
══════════════════════════════════════════════════════════════════════════════════
FORMAL PRODUCT OWNER DECISION
══════════════════════════════════════════════════════════════════════════════════

Identity Federation Architecture:
OPTION A — Synthetic Supabase Auth Credential
           with Orchestrated Identity Consolidation

Alternative (Option B — Custom Next.js Auth Bridge):
NOT SELECTED / REJECTED FOR THIS ARCHITECTURE

Decision Owner:
PRODUCT OWNER

Decision Status:
LOCKED & BINDING

Existing Architecture Strategy:
INTEGRATE / EXTEND (Zero Rewrite of Existing APP MA'HAD Foundation)

Implementation Status:
NOT AUTHORIZED

DDL Authorization Status:
NOT AUTHORIZED

Migration Authorization Status:
NOT AUTHORIZED

Database Mutation Status:
FORBIDDEN / UNCHANGED
══════════════════════════════════════════════════════════════════════════════════
```

### Critical Architectural Clarifications:
1. **Selection $\neq$ Implementation**: Selection of Option A establishes the **target architecture baseline**. It does not constitute authorization to generate code, create database records, or mutate configuration.
2. **Selection $\neq$ DDL Authorization**: Formal DDL generation and database schema scripts remain strictly **NOT AUTHORIZED** until the next governance gate is explicitly opened by the Product Owner.
3. **Status of Option B**: Option B is not deemed universally invalid; it is formally rejected for APP MA'HAD because its architectural trade-offs (bypassing native `@supabase/ssr`, breaking `auth.uid()` in RLS, custom token signing risks, and `service_role` security boundary degradation) directly conflict with APP MA'HAD's frozen Zero-Trust and multi-tenant security foundations.

---

## 2. TECHNICAL JUSTIFICATION FOR SELECTION OF OPTION A

The selection of Option A is grounded in 4 non-negotiable architectural pillars verified during code-level audit:

### 2.1 Native Supabase Auth & SSR Compatibility
Option A preserves the established authentication pipeline of APP MA'HAD:
$$\text{Supabase Auth} \longrightarrow \text{@supabase/ssr} \longrightarrow \text{Next.js Proxy (src/proxy.ts)} \longrightarrow \text{JWT} \longrightarrow \texttt{auth.uid()} \longrightarrow \text{PostgreSQL RLS}$$
- `src/proxy.ts` performs server-side session validation natively via `supabase.auth.getUser()`.
- Session cookies, token rotation, and refresh cycles continue to be managed automatically by `@supabase/ssr`.
- Zero parallel auth engine or custom cookie parsing is introduced into the application edge layer.

### 2.2 Preservation of Existing Architecture ("No Rewrite" Invariant)
Option A operates purely as an **additive architecture extension**:
- `public.users.id` retains its strict 1:1 foreign key binding to `auth.users.id`.
- The multi-tenant transaction boundary ([src/lib/db/tenant-transaction.ts](file:///e:/Projects/Os_Darta/src/lib/db/tenant-transaction.ts)) continues to set `SET LOCAL app.current_tenant_id` without requiring mock user context.
- Existing parent (`WALI`), staff (`STAFF`, `MUSYRIF`, `GURU`), and administrator accounts remain 100% untouched.

### 2.3 Row-Level Security (RLS) Defense-in-Depth
In APP MA'HAD, 30+ tables enforce multi-tenant isolation using policies combining session settings and JWT claims:
$$\text{USING}\ (\texttt{current\_setting('app.current\_tenant\_id', true) = tenant\_id}\ \text{OR}\ \texttt{tenant\_id = (auth.jwt() ->> 'tenant\_id')})$$
Option A ensures that every request—whether initiated by a staff member, a parent, an active student, or an alumnus—carries a cryptographically signed Supabase Auth JWT. PostgreSQL evaluates `auth.uid()` directly against database primary keys with zero translation overhead and zero risk of `service_role` bypass creep.

### 2.4 Strict Enforcement of One Person = One Identity
By coupling Option A with **Orchestrated Identity Consolidation (TIR-009)**, the platform guarantees that physical humans holding multiple operational roles (e.g. an active parent who is also an alumnus) are permanently represented by **exactly one record in `public.users`**.

---

## 3. SYNTHETIC CREDENTIAL ARCHITECTURAL BOUNDARY

The synthetic credential specification is locked as follows:

$$\mathbf{Format}: \quad \texttt{\{nis\}@\{tenant\_slug\}.mahad.internal}$$

### Invariant Rules Governing Synthetic Credentials:
1. **Internal Lifecycle Token Only**: The synthetic email is strictly an internal username proxy designed to satisfy Supabase Auth's relational requirements in `auth.users`.
2. **Not a Business Email**: It is **never** used for email communications, notifications, or external correspondence.
3. **Not a Human Identity**: The synthetic string does not represent a new person; it is a temporary credential handle pointing to `users.id`.
4. **Suppression of Outbound Mail**: All outbound email dispatch workers (transactional mailers, notification engines) must implement a fail-safe filter suppressing any dispatch to `.internal` domains.
5. **Initial Pre-Confirmation**: When created via the Supabase Admin API during SAT matriculation, synthetic accounts are provisioned with `email_confirm: true` to prevent unconfirmed-email login lockouts.

---

## 4. CRITICAL IDENTITY RULE: NO SECOND HUMAN IDENTITY

The core identity principle remains inviolable across all portals:

```
                          CANONICAL IDENTITY TAXONOMY

                              ┌─────────────────┐
                              │  Physical Human │
                              └────────┬────────┘
                                       │ 1:1
                                       ▼
                              ┌─────────────────┐
                              │ public.users.id │  <─── System of Record
                              └────────┬────────┘
                                       │ 1:1
                                       ▼
                              ┌─────────────────┐
                              │  auth.users.id  │  <─── Supabase Auth UID
                              └────────┬────────┘
                                       │
                ┌──────────────────────┼──────────────────────┐
                │ 1:N                  │ 1:N                  │ 1:N
                ▼                      ▼                      ▼
      ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
      │   WALI Persona    │  │  SANTRI Persona   │  │  ALUMNI Persona   │
      │ (Parental Portal) │  │  (Student Portal) │  │  (Alumni Portal)  │
      └───────────────────┘  └───────────────────┘  └───────────────────┘
```

> [!IMPORTANT]
> Under no circumstances may a student graduating into an alumnus, or a parent enrolling in an alumni program, be allocated a second row in `public.users` or a second human UID in `auth.users`. Personas, roles, and portals branch off the single immutable `users.id`.

---

## 5. EMAIL COLLISION & LINKING INVARIANTS

### 5.1 The Iron Invariant
$$\mathbf{Matching\ Email} \quad \neq \quad \mathbf{Same\ Human\ Being}$$

### 5.2 Mandatory Behavioral Constraints:
When an alumnus enters an email address during the credential transition gate, and that email address already exists within `public.users`:
- ❌ **NO AUTO-MERGE**: The system must never automatically merge records based solely on string matching.
- ❌ **NO AUTO-ATTACH**: The system must never attach the `ALUMNI` persona to the existing account without proof.
- ❌ **NO REASSIGNMENT**: The system must never transfer existing parent financial records or sibling relationships to the candidate.
- ❌ **NO DELETION**: The existing account must never be overwritten, suspended, or deleted.

### 5.3 Proof of Ownership Mandate:
Identity consolidation is strictly permitted only after:
1. **Explicit Identity Affirmation**: Candidate explicitly confirms: *"Ya, saya adalah pemilik akun [Nama Terdaftar]"*.
2. **Cryptographic / Credential Challenge**:
   - **Method A**: Immediate re-authentication with the existing account's password; **OR**
   - **Method B**: Verification of a high-entropy, time-limited (15-minute) Magic Link dispatched to that registered email explicitly titled *"Konfirmasi Penautan Persona Alumni"*.
3. If the user clicks *"Bukan Saya"* or the challenge fails, the transition aborts, the candidate is prompted for a different email, and their **NIS credential remains fully active**.

---

## 6. TIR-009 FINAL RECONCILIATION (CONSOLIDATION SEMANTICS)

Under Option A, the native Supabase Admin method `supabaseAdmin.auth.admin.updateUserById(studentUid, { email: existingEmail })` **cannot be used** when linking with an existing account because `auth.users.email` enforces a database-level unique constraint.

### Locked Architectural Semantics for Identity Consolidation:
Instead of updating the synthetic user's email to the colliding address, the platform executes **Transactional Account Consolidation**:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                   TIR-009: TRANSACTIONAL ACCOUNT CONSOLIDATION STEPS                             │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Step 1: Candidate proves ownership of existing account (Wali UID: wali_user_id).                 │
│ Step 2: In a single atomic database transaction (withTenantTransaction):                         │
│         a. Attach ALUMNI persona to wali_user_id in user_tenant_personas.                        │
│         b. Re-link historical academic snapshots (alumni_academic_snapshots) to wali_user_id.    │
│         c. Update public.santri record to reference wali_user_id as user_id.                     │
│         d. Record immutable consolidation audit event in audit_logs.                             │
│ Step 3: Call Supabase Admin API to retire the temporary synthetic user:                         │
│         await supabaseAdmin.auth.admin.deleteUser(synthetic_student_uid);                        │
│ Step 4: Terminate synthetic session; prompt user to authenticate using their verified Wali       │
│         email and password.                                                                      │
│ Step 5: Post-login session carries wali_user_id; Unified Portal presents Persona Switcher       │
│         (Wali Dashboard vs. Alumni Portal).                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```
*Note: No implementation code or DDL is executed in this step.*

---

## 7. CREDENTIAL TRANSITION LIFECYCLE & ANTI-LOCKOUT SAFETY

The complete state progression from active student to verified alumnus is mapped below:

```
                                CREDENTIAL TRANSITION LIFECYCLE

  State 1: ACTIVE SANTRI
  ├── Login Credential:   NIS + Student Password
  ├── auth.users email:   {nis}@{tenant}.mahad.internal
  └── Portal Access:      Santri Academic Portal
            │
            │ SAT declares "Lulus Akhir / Alumni"
            ▼
  State 2: PENDING CREDENTIAL TRANSITION
  ├── Login Credential:   NIS + Student Password (STILL ACTIVE)
  ├── auth.users email:   {nis}@{tenant}.mahad.internal
  ├── Portal Gate:        Prompt: "Masukkan Email Pribadi Aktif Anda"
  └── Anti-Lockout Rule:  NIS remains 100% valid; zero interruption to daily access
            │
            ├─────────────────────────────────────────┬─────────────────────────────────────────┐
            ▼                                         ▼                                         ▼
  Branch A: New Personal Email              Branch B: Existing Wali Email             Branch C: Failed / Cancelled
  ├── Dispatch verification email           ├── Trigger explicit re-auth challenge    ├── User clicks "Bukan Saya"
  ├── NIS remains ACTIVE until confirmed    ├── NIS remains ACTIVE during challenge   ├── Challenge expires / fails
  ├── User clicks verification link         ├── Ownership proven via password/magic   └── State reverts to State 2;
  ├── auth.users.email -> Real Email        ├── Execute TIR-009 Consolidation             NIS remains ACTIVE;
  └── Login: Real Email + New Password      ├── Retire synthetic user                     zero lockout
                                            └── Login: Wali Email + Wali Password
```

---

## 8. TENANT ISOLATION GUARANTEES UNDER OPTION A

Option A strictly preserves tenant isolation across all layers:

1. **Synthetic Credential Tenant Namespacing**: Because the synthetic email includes the `{tenant_slug}` sub-component (`{nis}@{tenant_slug}.mahad.internal`), students across different pesantren sharing the same numeric NIS (e.g. `2401001`) never collide in `auth.users`.
2. **Tenant Membership Anchor**: Every user's tenant access is mediated by `user_tenant_memberships` (`user_id`, `tenant_id`). Holding a persona in Tenant A grants zero access to Tenant B.
3. **Database RLS Boundary**: All database queries executed via `withTenantTransaction` set `SET LOCAL app.current_tenant_id = tenant_id`. PostgreSQL RLS policies fail-closed if a query attempts to access records belonging to another tenant.
4. **Cross-Tenant Linking Prohibition**: Identity consolidation cannot bind personas across different tenants unless explicitly authorized by multi-tenant membership rules.

---

## 9. RECOVERY & FAILURE RESILIENCE MATRIX

| Scenario | Operational Condition | Failure Mode Prevented | Recovery Protocol |
| :--- | :--- | :--- | :--- |
| **Rec-01: Active Student Lost Password** | Student forgets NIS password during school term. | Account lockout / academic disruption. | Madrasah Admin / SAT resets password via internal admin action; status set to `MUST_CHANGE_PASSWORD`. |
| **Rec-02: Alumni Email Unverified** | Candidate starts transition but verification email bounces or is ignored. | Lockout from Alumni portal. | Anti-lockout rule: NIS credential remains fully active. Student can re-login via NIS and resend or update email. |
| **Rec-03: Consolidated Account Recovery** | Dual-persona user (*Wali + Alumni*) forgets unified password. | Split credential confusion. | Standard Supabase password recovery dispatches reset link to verified real email; resets single `users.id` credential. |
| **Rec-04: Mid-Transition Crash** | Database commits persona attachment, but network drops before Supabase deletes synthetic user. | Half-linked account / orphan record. | Non-fatal: PostgreSQL system of record holds canonical identity (`wali_user_id`). Background reconciliation purges orphaned synthetic record idempotently. |
| **Rec-05: Adversarial Re-Auth Attempt** | Malicious student attempts to guess Wali password during ownership challenge. | Unauthorized account takeover. | Throttled after 5 failed attempts; security alert logged in `audit_logs`; target account untouched. |
| **Rec-06: Verified Email Mutation** | Dual-persona user updates email 1 year later. | Identity divergence across portals. | Standard Supabase `updateUser({ email })` triggers verified update across `auth.users` and `public.users`. Both portals update synchronously. |

---

## 10. ARCHITECTURE IMPACT RECONCILIATION

The following table evaluates the precise impact of selecting Option A across all existing APP MA'HAD components:

| Existing Component | Architectural Impact of Option A | Change Required? | Change Classification | Risk Level | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Supabase Auth (`GoTrue`)** | Utilized as universal auth engine for all roles including students. | NO | Unchanged Platform Core | Very Low | **COMPATIBLE** |
| **`auth.users` Table** | Stores synthetic emails (`.internal`) for active students alongside real emails. | NO (Schema)<br>YES (Data Rows) | Architecture Extension | Low | **COMPATIBLE** |
| **`public.users` Table** | Retains strict 1:1 primary key mapping to `auth.users.id`. | NO | Unchanged System of Record | Very Low | **COMPATIBLE** |
| **Next.js Edge Proxy (`src/proxy.ts`)** | Validates sessions natively via `supabase.auth.getUser()`. | NO | Zero Code Changes Required | Very Low | **COMPATIBLE** |
| **`@supabase/ssr`** | Manages session cookies and token refresh across Edge and Node runtimes. | NO | Zero Code Changes Required | Very Low | **COMPATIBLE** |
| **PostgreSQL RLS Policies** | Evaluates `auth.uid()` and `auth.jwt()` directly against primary keys. | NO | Zero Policy Rewrites | Very Low | **COMPATIBLE** |
| **Santri Domain** | Active students authenticate via NIS proxy; bound to `users.id`. | NO (Core)<br>YES (Auth Adapter) | Architecture Extension | Low | **COMPATIBLE** |
| **Wali Domain** | Existing parent accounts, credentials, and sibling links untouched. | NO | Zero Regression | Very Low | **COMPATIBLE** |
| **Alumni Domain** | New domain attaches `ALUMNI` persona to existing or transitioned `users.id`. | YES | Architecture Extension | Low | **COMPATIBLE** |
| **Tenant Domain** | Multi-tenant isolation enforced via `tenant_id` and composite keys. | NO | Unchanged Multi-Tenant Core | Very Low | **COMPATIBLE** |
| **PSB Domain** | SAT matriculation provisions synthetic credential upon admission. | YES | Architecture Extension | Low | **COMPATIBLE** |

> [!NOTE]
> **Audit Conclusion**: **100% of required changes are classified as Architecture Extensions.** There are **ZERO Architecture Replacements**. Existing APP MA'HAD code remains intact without destructive refactoring.

---

## 11. LOCKED SECURITY INVARIANTS (SI-001 THROUGH SI-012)

The implementation phase must enforce the following twelve security invariants without exception:

- **SI-001 (One Person = One Identity)**: Exactly one `public.users.id` per physical human being across all life stages and personas.
- **SI-002 (Matching Email $\neq$ Same Person)**: String equality on email is never proof of ownership.
- **SI-003 (No Auto-Merge)**: System never automatically merges distinct identity records upon email collision.
- **SI-004 (No Auto-Attach)**: System never automatically binds personas to existing accounts without an ownership challenge.
- **SI-005 (No Duplicate Human Identity)**: No user may be issued multiple `users.id` records to hold multiple roles.
- **SI-006 (Tenant Isolation)**: Identity tokens, synthetic credentials, and persona bindings must enforce tenant isolation at the database RLS level.
- **SI-007 (JWT Identity Canonical Mapping)**: Every JWT `sub` claim must map directly to a canonical row in `public.users`.
- **SI-008 (Anti-Lockout Credential Continuity)**: Student NIS credentials must remain active and functional until personal email verification and password establishment are 100% complete.
- **SI-009 (Ownership Verification Gate)**: Identity consolidation requires cryptographic proof (password re-auth or high-entropy magic link confirmation).
- **SI-010 (Graduate $\neq$ Alumni)**: Madrasah graduation (`Lulus Jenjang`) is a decentralized academic milestone that never triggers automated Alumni persona creation.
- **SI-011 (Exclusive SAT Alumni Authority)**: Alumni status is an exclusive tenant-level milestone conferred solely by the Staff Ahli Tingkat (SAT).
- **SI-012 (Synthetic Credential Invariant)**: Synthetic credentials (`.internal`) are internal protocol tokens only, never exposed as user business emails or used for outbound mail.

---

## 12. BUSINESS RULE FREEZE VERIFICATION

A comprehensive verification confirms that locking Option A introduces **zero conflicts or modifications** to previously frozen business domains:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               BUSINESS RULE FREEZE AUDIT                                         │
├──────────────────────────────┬─────────────────────────────────────────────────┬─────────────────┤
│ Business Domain              │ Frozen Business Rule                            │ Option A Status │
├──────────────────────────────┼─────────────────────────────────────────────────┼─────────────────┤
│ PSB Admission Flow           │ Tenant-wide periods; wave count strictly 1 or 2 │ UNCHANGED       │
│ SAT Authority                │ Exclusive acceptance & NIS generation authority │ UNCHANGED       │
│ Madrasah Sovereignty         │ Independent rosters, levels, and curricula     │ UNCHANGED       │
│ Multi-Madrasah Enrollment    │ Student can enroll in multiple Madrasahs        │ UNCHANGED       │
│ Graduate vs. Alumni          │ Madrasah graduate != Tenant alumnus             │ UNCHANGED       │
│ Alumni Snapshot Immutability │ Academic history locked per Madrasah on exit    │ UNCHANGED       │
│ Korwil Chapter Assignment    │ Domicile governs Korwil; GPS does not mutate it │ UNCHANGED       │
│ Ephemeral GPS Discovery      │ Transient spatial presence with 6-hour purge    │ UNCHANGED       │
│ Privacy Protection           │ Zero GPS/phone/address leakage in card payloads │ UNCHANGED       │
│ Salam Silaturrahmi           │ 1-hour pair cooldown; deep link WhatsApp only   │ UNCHANGED       │
│ Unified Portal Architecture  │ Persona switching under single login identity   │ UNCHANGED       │
└──────────────────────────────┴─────────────────────────────────────────────────┴─────────────────┘
```
**Conflict Count**: **0 (Zero Conflicts Detected)**.

---

## 13. AUDIT OF SPECIFICATION V3 (`WP-PSB-ALUMNI-SCHEMA-001-DESIGN-V3.md`)

- **Finding**: Document `docs/architecture/WP-PSB-ALUMNI-SCHEMA-001-DESIGN-V3.md` was inspected to determine whether the formal selection of Option A requires altering its schema specifications.
- **Audit Result**: V3 Section 5.4 already established Option A as the primary recommended architecture, and Section 5.3 outlined the exact explicit identity verification protocol required.
- **Action**: In accordance with Mandate Section 22 ("DO NOT ALTER V3"), `WP-PSB-ALUMNI-SCHEMA-001-DESIGN-V3.md` **is preserved intact without alteration**.

---

## 14. ARCHITECTURE BASELINE FOR NEXT GATE

With the formal lock of Option A, the architecture baseline for **WP-PSB-ALUMNI-SCHEMA-001** is finalized:

```
                                  ARCHITECTURE BASELINE

  ┌──────────────────────────────────────────────────────────────────────────────────────┐
  │ 1. Relational Schema Foundation:                                                     │
  │    • WP-PSB-ALUMNI-SCHEMA-001-DESIGN-V3.md                                           │
  │    • 18 proposed entities with composite tenant foreign keys                         │
  │    • Three-tier placement hierarchy defense (Composite FK + Trigger + Service)       │
  │    • Mandatory trigger hardening: TIR-007 (Academic Year) & TIR-008 (Santri Tenant) │
  ├──────────────────────────────────────────────────────────────────────────────────────┤
  │ 2. Identity Federation Foundation:                                                   │
  │    • WP-PSB-ALUMNI-IDENTITY-FEDERATION-DECISION-LOCK.md                              │
  │    • Option A: Synthetic Supabase Auth Credential ({nis}@{tenant}.mahad.internal)    │
  │    • TIR-009: Orchestrated Identity Consolidation (No naive updateUserById)          │
  │    • Security Invariants: SI-001 through SI-012 locked                               │
  ├──────────────────────────────────────────────────────────────────────────────────────┤
  │ 3. Next Governance Milestone:                                                        │
  │    • FORMAL DDL AUTHORIZATION GATE                                                   │
  │    • Generation of production DDL migration scripts adhering strictly to baseline   │
  └──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 15. FINAL GOVERNANCE HANDOVER

```text
════════════════════════════════════
WP-PSB-ALUMNI-IDENTITY-FEDERATION
PRODUCT OWNER DECISION LOCK
════════════════════════════════════

Selected Architecture:
OPTION A
Synthetic Supabase Auth Credential
with Orchestrated Identity Consolidation

Decision Status:
FORMALLY SELECTED

Option B:
NOT SELECTED

Business Rules:
UNCHANGED

Existing Architecture:
PRESERVED

Implementation:
NONE

DDL:
NONE

Migration:
NONE

Database:
UNCHANGED

Frontend:
NONE

Auth Implementation:
NONE

Architecture Impact Review:
COMPLETED (100% Architecture Extension, 0% Architecture Replacement)

Identity Invariants:
LOCKED (SI-001 through SI-012)

DDL Authorization:
NOT AUTHORIZED

Next Gate:
FORMAL DDL AUTHORIZATION
════════════════════════════════════
```
