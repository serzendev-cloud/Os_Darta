# IDENTITY FEDERATION — TECHNICAL DECISION PACKAGE

```text
══════════════════════════════════════════════════════════════════════════════════
WORK PACKAGE: WP-PSB-ALUMNI-SCHEMA-001
DOCUMENT: docs/architecture/WP-PSB-ALUMNI-IDENTITY-FEDERATION-DECISION.md
TITLE: Identity Federation & Credential Transition Architecture Decision
REVIEW STATUS: COMPLETED — FINAL TECHNICAL EVALUATION
GOVERNANCE GATE: TECHNICAL DECISION GATE (PRE-DDL AUTHORIZATION)
MODE: ARCHITECTURAL EVALUATION & ADVERSARIAL THREAT MODELING (DESIGN ONLY)
CANDIDATE ARCHITECTURES:
  • OPTION A: Synthetic Supabase Auth Credential ({nis}@{tenant}.mahad.internal)
  • OPTION B: Custom Next.js Auth Bridge (Application-Managed Credentials)
IMPLEMENTATION / DDL / MIGRATION STATUS: STRICTLY FORBIDDEN / NOT AUTHORIZED
══════════════════════════════════════════════════════════════════════════════════
```

---

## 1. EXECUTIVE SUMMARY

This technical decision package provides an exhaustive, evidence-based architectural evaluation of the two competing identity federation patterns for **APP MA'HAD**:
1. **Option A**: Synthetic Supabase Auth Credential (Native Supabase Auth with structured synthetic internal emails for active students).
2. **Option B**: Custom Next.js Auth Bridge (Decoupled application-managed credential store and token engine).

The scope encompasses the full student-to-alumnus journey, parent (Wali) relationships, dual personas (*Wali who is also an Alumnus*), credential transitions (NIS $\rightarrow$ verified email), integration with `users` and `auth.users`, Row-Level Security (RLS) enforcement, and long-term multi-tenant enterprise sustainability across 100+ Pesantren over a 10-year horizon.

### Key Investigation Takeaways:
- **Option A** is **deeply aligned** with APP MA'HAD's existing architecture (`src/proxy.ts`, `@supabase/ssr`, and PostgreSQL RLS session model). However, the initial naive assumption that *"a student's email can simply be updated via `supabase.auth.updateUserById()` during transition"* breaks down when linking with an existing Wali account due to Supabase Auth's global unique email constraint on `auth.users` (TIR-009). When hardened with an explicit **Identity Consolidation Orchestration**, Option A preserves *One Person = One Identity* without bypassing native security controls.
- **Option B** avoids synthetic email artifacts in `auth.users`, but introduces severe architectural regressions: it severs native Supabase client SDK integration, breaks PostgreSQL RLS predicates relying on `auth.uid()`, forces the application team to implement custom cryptographic token issuance, session refresh, CSRF defense, and mailer infrastructure, and creates an acute risk of `service_role` security boundary degradation.
- **Technical Recommendation**: **OPTION A (SYNTHETIC SUPABASE AUTH CREDENTIAL WITH ORCHESTRATED IDENTITY CONSOLIDATION)** is recommended with a score of **58/65 (89.2%)** versus **38/65 (58.5%)** for Option B.

> [!IMPORTANT]
> **Governance Directive**: This document serves as technical decision evidence for the Product Owner. In compliance with governance rules, **Antigravity does not possess authority to lock the final decision**. Implementation, DDL generation, and migration remain **NOT AUTHORIZED** until the Product Owner formally selects the preferred option.

---

## 2. EXISTING IDENTITY ARCHITECTURE AUDIT

An adversarial code-level audit of the APP MA'HAD repository confirms the following production foundations:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                               EXISTING IDENTITY STACK                                    │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. EDGE PROXY / SSR BOUNDARY (src/proxy.ts, Next.js 16)                                  │
│    • Intercepts all incoming requests via createProxyClient (using @supabase/ssr).      │
│    • Executes const { data } = await supabase.auth.getUser() to validate session.        │
│    • Enforces fail-closed access: unauthenticated requests to protected paths redirect  │
│      to /login or return 401.                                                            │
│    • Injects verified server claims into downstream headers:                             │
│      - x-tenant-id (resolved from hostname/subdomain/path, client header ignored)       │
│      - x-tenant-slug                                                                     │
│      - x-user-id (maps strictly to supabaseAuthUser.id === public.users.id)              │
│      - x-user-role (normalized role from app_metadata / user_metadata)                   │
│      - x-is-super-admin ('true' | 'false')                                               │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. CANONICAL SYSTEM OF RECORD (src/lib/db/schema/identity.ts)                            │
│    • public.users.id: Primary key, 1:1 mapping with auth.users.id.                      │
│    • public.users.email: text, UNIQUE, NOT NULL. Platform-wide unique person identifier. │
│    • public.users.phone: text, UNIQUE, NULLABLE. Primary login ID for Wali.              │
│    • public.users.status: 'ACTIVE' | 'MUST_CHANGE_PASSWORD' | 'SUSPENDED' | 'DISABLED'.   │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. MULTI-TENANT RBAC & PERSONAS (src/lib/db/schema/identity.ts)                          │
│    • user_tenant_memberships: (user_id, tenant_id, primary_role_id)                      │
│      - Unique index on (user_id, tenant_id). Anchors a user to a Pesantren.             │
│    • tenant_roles: Tenant-scoped roles ('ADMIN', 'GURU', 'MUSYRIF', 'BENDAHARA', etc.)    │
│    • wali_santri_relationships: (tenant_id, wali_user_id, santri_id)                     │
│      - Supports 1 Wali to N Santri multi-child relationships.                            │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. RLS CONTEXT ENFORCEMENT (src/lib/db/tenant-transaction.ts, drizzle/0002_*.sql)        │
│    • withTenantTransaction(): Wraps queries in an isolated SQL transaction.              │
│    • Executes: SET LOCAL app.current_tenant_id = safeTenantId;                           │
│      and: SET LOCAL app.is_super_admin = booleanString;                                  │
│    • PostgreSQL RLS Policies enforce:                                                    │
│      USING (current_setting('app.current_tenant_id', true) = tenant_id                   │
│             OR tenant_id = (auth.jwt() ->> 'tenant_id'))                                 │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ 5. CLIENT AUTH STATE (src/store/auth-store.ts)                                           │
│    • Zustand store wraps native createClient() from @supabase/ssr.                       │
│    • Directly delegates authentication to supabase.auth.signInWithPassword().            │
│    • Directly delegates termination to supabase.auth.signOut().                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Structural Invariants:
1. `public.users.id` **is identical to** `auth.users.id`. There is no separate identity proxy table in the existing schema.
2. The entire client and server authentication pipeline relies on **Supabase Auth issued JWTs and session cookies managed via `@supabase/ssr`**.
3. RLS policies across 30+ tables explicitly inspect `auth.jwt()` claims alongside transaction-level `current_setting('app.current_tenant_id', true)`.

---

## 3. FROZEN BUSINESS RULES

The following business rules are permanently locked and cannot be relaxed by either architecture:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                FROZEN BUSINESS RULES                                     │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ RULE 1: ONE PERSON = ONE IDENTITY                                                        │
│ 1 physical human being = exactly 1 users.id = exactly 1 auth.users.id.                   │
│ A person holding multiple roles (e.g. Wali of an active student AND Alumnus of the       │
│ pesantren) must operate under a single central users record. No duplicate accounts.      │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ RULE 2: EMAIL COLLISION != SAME PERSON                                                   │
│ An identical email address is NEVER automatic proof of identical human identity.         │
│ Zero auto-merge, zero auto-attach, zero automatic credential re-assignment.              │
│ Explicit identity ownership verification and re-authentication challenge are mandatory.  │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ RULE 3: PSB -> SANTRI LIFECYCLE CONTINUITY                                               │
│ Applicant -> Calon Santri -> Selection -> SAT Lulus -> Santri -> NIS Generated.          │
│ Transitioning through admission milestones must never generate orphan or duplicate       │
│ identities.                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ RULE 4: SANTRI -> ALUMNI LIFECYCLE CONTINUITY                                            │
│ When a student graduates and is conferred Alumni status by SAT:                          │
│ Santri Identity -> Alumni Persona attached.                                              │
│ Never delete the Santri user to create a new Alumni user. Historical transcripts remain  │
│ permanently bound to the original student identity.                                      │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ RULE 5: CREDENTIAL LIFECYCLE & ANTI-LOCKOUT SAFETY                                       │
│ Santri authenticate using NIS + PIN/Password. Transitioning to Alumni requires email     │
│ verification. The NIS credential must remain active and valid until the email is         │
│ verified and transition is 100% completed. Zero window of user lockout.                  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. OPTION A ARCHITECTURE — SYNTHETIC SUPABASE AUTH CREDENTIAL

### 4.1 High-Level Concept
Option A utilizes Supabase Auth (`auth.users`) as the universal identity engine for all actors in the ecosystem, including active Santri. 

Because active Santri do not typically own personal email addresses upon initial admission, Option A assigns each enrolled student a **deterministic, tenant-scoped synthetic email credential**:
$$\text{Synthetic Email} = \texttt{\{nis\}@\{tenant\_slug\}.mahad.internal}$$

```
                                  OPTION A: LOGICAL ARCHITECTURE

  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                                 SUPABASE AUTH ENGINE                                │
  │                                                                                     │
  │   auth.users                                                                        │
  │   ├── Parent (Wali):      ahmad@gmail.com           (Real Email)                    │
  │   ├── Staff / Admin:      musyrif@pesantren.id      (Real Email)                    │
  │   └── Active Santri:      2401001@al-falah.internal (Synthetic Internal Email)      │
  │                                                                                     │
  │   Issues: Native Supabase Auth JWT (sub: auth.users.id, aud: 'authenticated')      │
  └──────────────────────────────────────────┬──────────────────────────────────────────┘
                                             │
                                             ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                         NEXT.JS 16 PROXY (src/proxy.ts)                             │
  │                                                                                     │
  │   • Validates session natively via supabase.auth.getUser()                          │
  │   • Resolves x-user-id = authUser.id                                                │
  │   • Injects claims into downstream request headers                                  │
  └──────────────────────────────────────────┬──────────────────────────────────────────┘
                                             │
                                             ▼
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                       POSTGRESQL & DRIZZLE (APP MA'HAD DB)                          │
  │                                                                                     │
  │   • public.users.id === auth.users.id                                               │
  │   • RLS: auth.uid() and auth.jwt() work natively out-of-the-box                     │
  │   • withTenantTransaction sets transaction context                                  │
  └─────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Lifecycle Mechanics
1. **Student Provisioning**:
   - When SAT registers a new Santri and generates an official NIS (e.g. `2401001`), the provisioning service calls Supabase Admin API:
     ```typescript
     supabaseAdmin.auth.admin.createUser({
       email: `${nis}@${tenantSlug}.mahad.internal`,
       password: initialTemporaryPassword,
       email_confirm: true, // Internal domain pre-confirmed
       user_metadata: { role: 'SANTRI', nis, tenant_id: tenantId }
     });
     ```
   - A corresponding record is inserted into `public.users` (`id = authUser.id`, `email = syntheticEmail`, `status = 'MUST_CHANGE_PASSWORD'`) and `public.santri` (`user_id = authUser.id`).
2. **Student Login**:
   - The student portal presents a login form requesting **NIS** and **Password**.
   - The client application formats the username: `${nis}@${currentTenantSlug}.mahad.internal` and invokes native `supabase.auth.signInWithPassword()`.
   - Native Supabase Auth issues an access token and refresh token stored securely in HTTP-only cookies via `@supabase/ssr`.
3. **Alumni Transition & Email Binding**:
   - When the student transitions to Alumni, the portal prompts: *"Masukkan Email Pribadi Aktif Anda"*.
   - The student inputs `alumni.personal@gmail.com`.
   - **Case 1: Email does not exist in `users`**:
     - System calls `supabase.auth.updateUser({ email: 'alumni.personal@gmail.com' })`.
     - Supabase dispatches a confirmation email.
     - The synthetic email remains active until the verification link is clicked.
     - Upon confirmation, `auth.users.email` and `public.users.email` update to the verified email. NIS login is retired or retained as an alias.
   - **Case 2: Email already exists in `users` (e.g. registered Wali account)**:
     - Directly updating email in Supabase Auth will fail with HTTP 422 (Unique Email Violation) because the Wali already holds that email in `auth.users`.
     - **Hardened Resolution (TIR-009 Orchestration)**: See Section 7.

### 4.3 Strengths of Option A
- **100% Native Compatibility**: Zero changes required to `src/proxy.ts`, `@supabase/ssr`, `useAuthStore`, or PostgreSQL RLS policies.
- **Unified Security Boundary**: Password hashing (bcrypt), brute-force rate-limiting, session revocation, token rotation, and MFA are managed entirely by Supabase's hardened Go-based auth daemon (GoTrue).
- **Native Direct Queries**: Client-side components or mobile apps can directly query Supabase endpoints with RLS automatically verified via `auth.uid()`.

### 4.4 Vulnerabilities & Hidden Traps of Option A
- **Synthetic Email Pollution**: `auth.users` contains non-routable dummy emails. If email notifications are triggered without filtering `.internal` domains, outbound SMTP workers log bounces.
- **TIR-009 Collision Barrier**: Supabase Auth enforces global email uniqueness at the PostgreSQL engine level in `auth.users`. You cannot simply update a synthetic user's email to match an existing user's email.

---

## 5. OPTION B ARCHITECTURE — CUSTOM NEXT.JS AUTH BRIDGE

### 5.1 High-Level Concept
Option B decouples student and non-email credentials from Supabase Auth entirely. Supabase Auth is reserved strictly for users with real, unique emails, while student and transitional authentication is handled by a custom auth bridge in Next.js.

```
                                  OPTION B: LOGICAL ARCHITECTURE

  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │                         CUSTOM NEXT.JS AUTH BRIDGE                                  │
  │                                                                                     │
  │   POST /api/auth/student-login                                                      │
  │   • Validates NIS + Password against public.user_credentials (custom argon2/bcrypt) │
  │   • Issues custom application session (Iron-Session or custom JWT cookie)          │
  │                                                                                     │
  │   Session Bridge Problem:                                                           │
  │   How does this session communicate with Supabase Auth and PostgreSQL RLS?         │
  └──────────────────────────────────────────┬──────────────────────────────────────────┘
                                             │
                         ┌───────────────────┴───────────────────┐
                         ▼                                       ▼
             Sub-Option B1: Custom JWT Signer       Sub-Option B2: Service Role Bypass
             • Next.js signs JWT with Supabase      • Next.js executes queries using
               JWT secret.                            service_role key.
             • Passes custom JWT to Supabase.       • RLS IS COMPLETELY BYPASSED!
             • High secret exposure risk.           • Catastrophic security regression.
```

### 5.2 Mechanics of Sub-Options
To allow a user logged in via Option B to access APP MA'HAD, one of two mechanisms must be implemented:

#### Sub-Option B1: Next.js Custom JWT Minting
- Next.js holds the Supabase project's `JWT_SECRET`.
- When a student authenticates via NIS, Next.js verifies the password hash in the database, mints a custom JWT signed with `HS256` and the Supabase secret, containing:
  ```json
  {
    "sub": "user_guid_123",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "synthetic_or_nis",
    "app_metadata": { "role": "santri", "tenant_id": "tenant_abc" }
  }
  ```
- Next.js writes this custom token into the Supabase auth cookie format.
- **Fatal Flaw**: Requires exposing the Supabase JWT signing secret to the Next.js runtime. If the application environment is compromised or a server-side vulnerability leaks process environment variables, an attacker can mint valid `service_role` or `super_admin` tokens at will. Furthermore, Supabase Auth GoTrue session revocation lists do not recognize application-minted tokens, making centralized token revocation impossible.

#### Sub-Option B2: Application Server-Side Proxy (`service_role`)
- Next.js stores session data in an encrypted cookie independent of Supabase.
- All database operations for students and alumni are routed through Next.js Server Actions or API routes using `createClient(url, SERVICE_ROLE_KEY)`.
- **Fatal Flaw**: Disables Row-Level Security (RLS) as a database-level defense. If any API route neglects manual tenant filtering, data leaks across tenants. Directly contradicts APP MA'HAD's frozen Zero-Trust and RLS hardening directives (`WP-SAAS-SEC-002`).

### 5.3 Strengths of Option B
- `auth.users` contains only validated human email addresses; zero synthetic email rows.
- Complete autonomy over password hashing algorithms (e.g. Argon2id), brute-force logic, and credential storage.

### 5.4 Severe Liabilities of Option B
- **Architectural Rewrite**: Breaks `src/proxy.ts` session validation (`supabase.auth.getUser()` returns null for custom bridge sessions).
- **Maintenance Burden**: The application development team becomes responsible for implementing secure password hashing, token expiration, refresh rotation, CSRF defense, password reset email dispatchers, and rate-limiting.
- **Client SDK Incompatibility**: Direct Supabase client queries from web or future mobile apps are completely non-functional because no valid Supabase session exists.

---

## 6. SECURITY THREAT MODEL

The following matrix stress-tests Option A and Option B across 10 critical adversarial threat scenarios:

| Threat ID & Attack Scenario | Option A (Synthetic Supabase Credential) | Option B (Custom Next.js Auth Bridge) | Hardened Mitigation Strategy | Residual Risk Level |
| :--- | :--- | :--- | :--- | :---: |
| **T-001: Email Collision**<br>Student inputs email belonging to another living person (unrelated parent or teacher). | System detects email in `users`. Blocks update. Demands ownership proof. | Custom bridge queries `users`. Halts transition if email matches existing record. | Fail-closed: Never auto-merge. Require re-auth challenge to existing account. | **LOW** (Mitigated by Protocol) |
| **T-002: Account Takeover via Alumni Claim**<br>Malicious actor knows student NIS and attempts to claim Alumni persona under their own email. | Attacker must provide existing student password/PIN. Without it, cannot initiate transition. | Attacker must provide existing student password/PIN. | Rate-limit transition endpoint; enforce temporary lockouts after 5 failed attempts. | **LOW** |
| **T-003: Duplicate Identity Creation**<br>Wali becomes Alumnus; system creates two separate `users.id` rows. | Prevented: Identity consolidation protocol links persona to existing Wali `users.id`. | High risk: Developer oversight in custom bridge easily results in inserting a second `users` row. | Schema check: `users.email` unique constraint + domain service linking protocol. | **VERY LOW** |
| **T-004: Wrong Persona Attachment**<br>Alumni persona accidentally bound to incorrect Wali account due to race condition. | Orchestration executes inside an isolated database transaction with ownership lock. | Application-level linking without transactional locking risks race conditions. | Wrap persona attachment in `withTenantTransaction` with explicit verification token check. | **VERY LOW** |
| **T-005: Credential Transition Interception**<br>Attacker intercepts email verification link to hijack newly graduating account. | High-entropy, time-limited (15 min) cryptographic magic link generated by Supabase Auth. | Custom token generator in Next.js must be audited for CSPRNG entropy and expiration. | Cryptographic tokens with single-use invalidation upon receipt. | **LOW** |
| **T-006: Password Recovery Hijacking**<br>Attacker triggers password reset on NIS credential or unverified email to seize account. | Password reset disabled for `.internal` synthetic domains; enabled only after verified email change. | Custom recovery route must strictly validate verification status before sending reset tokens. | Reject password reset requests targeting unverified or synthetic email domains. | **LOW** |
| **T-007: JWT Confusion / Claim Forgery**<br>Attacker modifies JWT payload to elevate claims (`role: SUPER_ADMIN` or alter `sub`). | Impossible: Supabase Auth signs JWT with asymmetric key (RS256) or hardened HMAC secret. | High Risk if Sub-Option B1 is used: JWT secret stored in app environment; key leak compromises entire DB. | Option A eliminates custom signing; Supabase manages key rotation and verification. | **Option A: VERY LOW**<br>**Option B: HIGH** |
| **T-008: PostgreSQL RLS Bypass**<br>Request accesses database records belonging to another tenant or unauthorized role. | RLS policies inspect `auth.uid()` and `auth.jwt()`. Fully enforced on all connections. | Catastrophic Risk under Sub-Option B2: Using `service_role` bypasses all 30+ RLS policies. | Strictly prohibit `service_role` in standard application routes. Mandate `withTenantTransaction`. | **Option A: VERY LOW**<br>**Option B: CRITICAL** |
| **T-009: Tenant Crossing**<br>Tenant A student or alumnus accesses Tenant B records or claims persona in Tenant B. | `user_tenant_memberships` and composite FKs enforce tenant boundary. | Application must manually check `tenant_id` on every query if RLS is bypassed. | Composite foreign keys `(tenant_id, id)` and trigger hierarchy validation. | **VERY LOW** |
| **T-010: Account Linking Abuse**<br>Attacker initiates linking with target email to flood target's inbox with verification spam. | Rate-limited by Supabase Auth mailer (max 3 emails/hour per target address). | Must manually implement rate-limiting via Redis or Postgres token cache in Next.js. | Apply strict IP and identity-level rate limits on transition requests. | **LOW** |

---

## 7. IDENTITY LINKING ANALYSIS & TIR-009 RESOLUTION

### 7.1 The Fundamental Constraint: `auth.users` Global Email Uniqueness
In Supabase Auth (GoTrue), the `email` column in `auth.users` has a strict unique constraint across the entire database instance:
$$\texttt{auth.users.email UNIQUE}$$

If Student A (holding synthetic UID `stud_123` with email `2401001@al-falah.internal`) enters `ahmad@gmail.com` during transition, and `ahmad@gmail.com` is **already registered to Wali B** (holding UID `wali_456`), executing:
```typescript
await supabaseAdmin.auth.admin.updateUserById('stud_123', { email: 'ahmad@gmail.com' });
```
**will unconditionally fail** with HTTP `422 Unprocessable Entity: Email already registered`.

### 7.2 The Solution: Identity Consolidation Protocol (Option A Hardened)
To honor **One Person = One Identity** and comply with Supabase Auth constraints, the transition protocol must execute **Account Consolidation** rather than in-place email replacement:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                   IDENTITY CONSOLIDATION PROTOCOL (OPTION A HARDENED)                            │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 1: TRANSITION INITIATION & COLLISION DETECTION                                            │
│ 1. Alumnus logs into Alumni Portal using NIS + Student Password (authenticated as stud_123).     │
│ 2. Prompted to enter verified personal email: ahmad@gmail.com.                                  │
│ 3. System checks public.users WHERE email = 'ahmad@gmail.com'.                                 │
│ 4. Result: MATCH FOUND -> wali_456 (Wali Account: "Ahmad Dahlan").                             │
│ 5. SYSTEM STOPS: Zero auto-merge. Synthetic session stud_123 remains ACTIVE.                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 2: EXPLICIT IDENTITY OWNERSHIP CHALLENGE                                                   │
│ 6. System displays: "Email ini terdaftar atas nama Ahmad Dahlan. Apakah Anda orang yang sama?"   │
│ 7. If user clicks "Bukan Saya": Prompt for alternate email. Transition halts. NIS stays valid.  │
│ 8. If user clicks "Ya, Ini Akun Saya": Demand proof of ownership:                               │
│    • Option 8A: Immediate re-authentication using Ahmad Dahlan's existing Wali password, OR      │
│    • Option 8B: Cryptographic Magic Link dispatched to ahmad@gmail.com containing:              │
│      "Konfirmasi Penautan Persona Alumni dengan Akun Wali Anda" (TTL: 15 minutes).               │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 3: ATOMIC PERSONA ATTACHMENT & IDENTITY CONSOLIDATION (withTenantTransaction)             │
│ Upon successful re-authentication or token confirmation:                                         │
│ 9. Open SQL Transaction (SET LOCAL app.current_tenant_id = tenant_id):                          │
│    a. Attach ALUMNI persona to canonical Wali user:                                              │
│       INSERT INTO user_tenant_personas (user_id, tenant_id, persona_type)                       │
│       VALUES ('wali_456', tenant_id, 'ALUMNI');                                                 │
│    b. Update historical academic transcript snapshots to point to canonical user:               │
│       UPDATE alumni_academic_snapshots SET user_id = 'wali_456' WHERE user_id = 'stud_123';    │
│    c. Update santri record link to canonical user:                                              │
│       UPDATE santri SET user_id = 'wali_456' WHERE user_id = 'stud_123';                         │
│    d. Record immutable audit log in audit_logs (actor: wali_456, action: 'IDENTITY_CONSOLIDATE')│
│ 10. COMMIT SQL Transaction.                                                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────────┤
│ PHASE 4: SYNTHETIC CREDENTIAL RETIREMENT & CLEANUP                                               │
│ 11. Call Supabase Admin API:                                                                     │
│     await supabaseAdmin.auth.admin.deleteUser('stud_123');                                       │
│     (Or disable user: ban_duration = 'none', email = 'retired_2401001@internal')               │
│ 12. Terminate student session stud_123.                                                          │
│ 13. Instruct user: "Akun Alumni Anda berhasil ditautkan! Silakan login menggunakan email        │
│     ahmad@gmail.com dan password Wali Anda."                                                     │
│ 14. Single users.id ('wali_456') now holds both WALI and ALUMNI personas.                        │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```
                                SEQUENCE DIAGRAM: IDENTITY CONSOLIDATION

 Alumnus (Client)             Next.js Transition API        Supabase Auth          PostgreSQL DB
       │                               │                          │                      │
       │─── 1. Input ahmad@gmail.com ─>│                          │                      │
       │                               │─── 2. Query users ─────────────────────────────>│
       │                               │<── 3. Found wali_456 ───────────────────────────│
       │<── 4. Prompt: Ownership? ─────│                          │                      │
       │                               │                          │                      │
       │─── 5. Enter Wali Password ───>│                          │                      │
       │                               │─── 6. Verify Credentials │                      │
       │                               │    signInWithPassword ──>│                      │
       │                               │<── 7. Verified (OK) ─────│                      │
       │                               │                                                 │
       │                               │─── 8. BEGIN withTenantTransaction ─────────────>│
       │                               │       a. Attach ALUMNI persona to wali_456      │
       │                               │       b. Re-link snapshot user_id to wali_456   │
       │                               │       c. Audit log record                       │
       │                               │<── 9. COMMIT Transaction ───────────────────────│
       │                               │                                                 │
       │                               │─── 10. deleteUser(stud_123) ────>│              │
       │                               │<── 11. User Deleted ─────────────│              │
       │<── 12. Success (Redirect) ────│                                                 │
```

---

## 8. WALI + ALUMNI DUAL-PERSONA SCENARIO SIMULATION

Below is the detailed technical simulation of 8 edge scenarios under both architectures:

### Skenario A: Verified Email & Ownership Confirmed
- **Context**: A parent (Wali) with existing account `budi@gmail.com` completes an evening tahfizh program or is an alumnus graduating from higher level.
- **Expected**: Single `users.id` holds both `WALI` and `ALUMNI` personas. Portal selector allows switching between Wali and Alumni dashboards.
- **Option A**: Verified via password or magic link; persona attached to `budi@gmail.com`; synthetic student credential retired. **Clean, native session.**
- **Option B**: Application attaches persona in DB. Must issue new custom session tokens.

### Skenario B: Matching Email, but User Declares "Bukan Saya"
- **Context**: Student mistakenly enters their sibling's or parent's email, but realizes they are different individuals.
- **Expected**: Transition aborts. Email is NOT attached. Student NIS remains fully active. No changes to Wali account.
- **Option A**: Transition state is cancelled. Client remains authenticated via NIS. No DB writes occur. **Zero risk.**
- **Option B**: Transition state cancelled. Application remains on NIS view.

### Skenario C: Email Entered, Verification Link Pending
- **Context**: Candidate inputs `alumni@gmail.com`, but has not yet clicked the email verification link.
- **Expected**: Anti-lockout rule applies. Student can still log in using NIS and password.
- **Option A**: Supabase Auth retains synthetic email as active credential until email change confirmation token is consumed. Student logs in via NIS without interruption. **Zero lockout.**
- **Option B**: Custom token record in DB remains in `PENDING` state. NIS credentials remain valid.

### Skenario D: Wali Forgot Password During Challenge
- **Context**: Candidate claims to be the Wali, but cannot remember the Wali account password.
- **Expected**: System blocks immediate linking. Offers standard "Lupa Password" flow via registered email or magic link fallback.
- **Option A**: System sends native Supabase password reset link to registered email. Once reset, candidate completes linking challenge.
- **Option B**: Must implement custom password reset flow in Next.js.

### Skenario E: Adversarial Linking Attempt
- **Context**: A rogue student types the email of the Foundation Chairman (`ketua@yayasan.org`) attempting to hijack administrative rights.
- **Expected**: System demands ownership proof. Attacker cannot provide password or access Chairman's email.
- **Option A**: Re-auth fails immediately. Failed attempt logged in `audit_logs`. After 5 attempts, IP/UID is throttled. **Target account untouched.**
- **Option B**: Same, provided application-level rate limiting is correctly implemented.

### Skenario F: Linking Process Fails Mid-Way (Network Drop)
- **Context**: Transaction succeeds in PostgreSQL, but Supabase Admin API call to delete synthetic user times out.
- **Expected**: No half-linked state. Account remains usable.
- **Option A**: Canonical data is committed in PostgreSQL. Synthetic user in `auth.users` remains orphaned but deactivated. Reconciliation worker cleans orphaned synthetic user asynchronously. **User logs in cleanly via Wali account.**
- **Option B**: Transaction rollback in PostgreSQL cleans up all changes cleanly.

### Skenario G: User Changes Verified Email Post-Linking
- **Context**: The dual-persona user updates their personal email from `budi.old@gmail.com` to `budi.new@gmail.com`.
- **Expected**: Both Wali and Alumni portals reflect the new email. Identity remains unified.
- **Option A**: Standard `supabase.auth.updateUser({ email })` updates `auth.users` and triggers update on `public.users`. Both personas remain intact under the same UID.
- **Option B**: Application must update custom credential table and re-issue session tokens.

### Skenario H: Account Recovery Post-Linking
- **Context**: Dual-persona user forgets password 6 months later.
- **Expected**: Single password reset email resets password for the entire unified identity.
- **Option A**: Native Supabase Auth password recovery works seamlessly.
- **Option B**: Custom Next.js password reset mailer handles recovery.

---

## 9. SANTRI → ALUMNI LIFECYCLE PROGRESSION

```
                                LIFECYCLE PROGRESSION TIMELINE

  ┌───────────────────────────────────────────────────────────────────────────────────────┐
  │ 1. ADMISSION (PSB)                                                                    │
  │    • Prospective student registers via Panitia PSB.                                   │
  │    • Applicant record created in psb_applicants.                                      │
  │    • Calon Santri evaluated; test scores and infaq recorded.                          │
  └──────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                             ▼
  ┌───────────────────────────────────────────────────────────────────────────────────────┐
  │ 2. ACCEPTANCE & MATRICULATION (SAT LULUS)                                             │
  │    • SAT verifies acceptance and generates official NIS.                              │
  │    • Provisioning service creates auth.users record: {nis}@{tenant}.mahad.internal    │
  │    • Record inserted into public.users and public.santri.                             │
  │    • Placed into Madrasah / Tingkat / Rombel via psb_placement_distributions.         │
  └──────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                             ▼
  ┌───────────────────────────────────────────────────────────────────────────────────────┐
  │ 3. ACTIVE SANTRI YEARS                                                                │
  │    • Authenticates via NIS + Password.                                                │
  │    • Accesses Santri Portal (tahfizh records, academic grades, violations, permissions│
  │    • Participates in multiple Madrasahs (e.g. MTs + Tahfizh) simultaneously.          │
  └──────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                             ▼
  ┌───────────────────────────────────────────────────────────────────────────────────────┐
  │ 4. MADRASAH GRADUATION != TENANT ALUMNI                                               │
  │    • Student completes MTs/Jenjang: status recorded as "Lulus Jenjang".               │
  │    • Snapshot recorded in alumni_academic_snapshots (is_final_alumni_snapshot = false)│
  │    • Student continues to MA or remains active: Identity remains SANTRI.              │
  └──────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                             ▼
  ┌───────────────────────────────────────────────────────────────────────────────────────┐
  │ 5. FORMAL ALUMNI CONFERRAL (EXCLUSIVE SAT AUTHORITY)                                  │
  │    • SAT executes formal exit: status changed to "Lulus Akhir / Alumni".             │
  │    • Final snapshot locked in alumni_academic_snapshots.                              │
  │    • Profile created in alumni_profiles.                                              │
  │    • Transition prompt activated upon next portal login.                              │
  └──────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                             ▼
  ┌───────────────────────────────────────────────────────────────────────────────────────┐
  │ 6. CREDENTIAL TRANSITION GATE                                                         │
  │    • Alumnus enters verified personal email.                                          │
  │    • Ownership verified (New Email vs. Existing Wali Re-Auth Challenge).              │
  │    • Real email bound to identity; NIS credential retired from primary login.         │
  │    • User accesses Alumni Portal (networking, Korwil, donations, discovery).          │
  └───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. SUPABASE AUTH COMPATIBILITY EVALUATION

An architectural compatibility audit against APP MA'HAD's active codebase reveals the following constraints:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE AUTH COMPATIBILITY MATRIX                            │
├──────────────────────────────────────┬─────────────────────────┬─────────────────────────┤
│ Architectural Component              │ Option A: Synthetic     │ Option B: Custom        │
│                                      │ Supabase Credential     │ Next.js Auth Bridge     │
├──────────────────────────────────────┼─────────────────────────┼─────────────────────────┤
│ src/proxy.ts (Next.js 16 Proxy)      │ 100% Compatible         │ INCOMPATIBLE            │
│ (Calls supabase.auth.getUser())      │ Works without changes   │ Returns null; requires  │
│                                      │                         │ custom proxy rewrite.   │
├──────────────────────────────────────┼─────────────────────────┼─────────────────────────┤
│ @supabase/ssr Cookie Management      │ 100% Compatible         │ BROKEN                  │
│ (Session refresh & cookie rotation)  │ Managed automatically   │ Must implement custom   │
│                                      │                         │ cookie mechanics.       │
├──────────────────────────────────────┼─────────────────────────┼─────────────────────────┤
│ PostgreSQL auth.uid() in RLS         │ 100% Compatible         │ BROKEN (unless custom   │
│ (drizzle/0002_tenant_rls_hardening)  │ Translates to users.id  │ JWT signed with secret) │
├──────────────────────────────────────┼─────────────────────────┼─────────────────────────┤
│ public.users.id Foreign Keys         │ 100% Compatible         │ Requires manual UUID    │
│ (1:1 with auth.users.id)             │ Preserved               │ generation and sync.    │
├──────────────────────────────────────┼─────────────────────────┼─────────────────────────┤
│ Direct Supabase Client SDK           │ 100% Compatible         │ INCOMPATIBLE            │
│ (Client components & mobile apps)    │ Fully functional        │ Cannot authenticate     │
│                                      │                         │ against Supabase API.   │
├──────────────────────────────────────┼─────────────────────────┼─────────────────────────┤
│ Centralized Session Invalidation     │ 100% Compatible         │ Fragmented              │
│ (Revoking user tokens on breach)     │ Native GoTrue RPC       │ Custom revocation table │
└──────────────────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## 11. JWT & ROW-LEVEL SECURITY (RLS) ANALYSIS

### 11.1 How `auth.uid()` Translates to `users.id`
In APP MA'HAD, every RLS policy relies on PostgreSQL session functions:
- `auth.uid()` returns the UUID stored in the JWT `sub` claim.
- Because `public.users.id` is explicitly defined as:
  ```typescript
  export const users = pgTable('users', {
    id: text('id').primaryKey(), // Supabase Auth UID mapping (auth.users.id)
    ...
  });
  ```
  any policy evaluating `users.id = auth.uid()` or checking memberships via `user_id = auth.uid()` executes with zero translation layer.

### 11.2 The Catastrophic `service_role` Temptation in Option B
When implementing Option B, developers frequently realize that custom sessions cannot invoke Supabase PostgreSQL queries without failing RLS policies. The standard shortcut is to instantiate the Supabase client using the `SUPABASE_SERVICE_ROLE_KEY`:
```typescript
// DANGEROUS SHORTCUT IN OPTION B
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const data = await supabaseAdmin.from('santri').select('*'); // RLS COMPLETELY BYPASSED!
```
> [!CAUTION]
> **CRITICAL ARCHITECTURAL WARNING**: Bypassing RLS via `service_role` transfers the entire burden of multi-tenant data isolation to application-level `WHERE` clauses. A single forgotten `WHERE tenant_id = x` in any API route or Server Action will leak student data across pesantren tenants. Option A preserves RLS as an unbreakable database-level defense.

---

## 12. FAILURE & ROLLBACK ANALYSIS

### 12.1 The "Half-Linked Identity" Failure Mode
What occurs if a linking transaction fails after modifying the database but before updating Supabase Auth, or vice versa?

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            HALF-LINKED FAILURE ANALYSIS                                  │
├───────────────────────────────────┬──────────────────────────────────────────────────────┤
│ Failure Point                     │ Architectural Consequence & Recovery Protocol        │
├───────────────────────────────────┼──────────────────────────────────────────────────────┤
│ Failure at Step 1:                │ Consequence: Re-auth rejected; zero database writes. │
│ Re-authentication fails.          │ Recovery: Candidate informed; NIS remains active.    │
├───────────────────────────────────┼──────────────────────────────────────────────────────┤
│ Failure at Step 2:                │ Consequence: PostgreSQL transaction aborts via       │
│ SQL transaction fails during      │ automatic ROLLBACK.                                  │
│ persona attachment or audit log.  │ Recovery: Database state is pristine; student        │
│                                   │ remains authenticated via NIS.                       │
├───────────────────────────────────┼──────────────────────────────────────────────────────┤
│ Failure at Step 3:                │ Consequence: Persona is attached in PostgreSQL, but  │
│ SQL commits, but Supabase Admin   │ synthetic user stud_123 was not deleted in           │
│ deleteUser API call times out.    │ auth.users.                                          │
│                                   │ Recovery: Non-fatal! Canonical identity in           │
│                                   │ PostgreSQL already points to wali_456. The user can  │
│                                   │ immediately log in via Wali account. An idempotent   │
│                                   │ background reconciliation cron purges the orphaned   │
│                                   │ synthetic record in auth.users.                      │
└───────────────────────────────────┴──────────────────────────────────────────────────────┘
```

### 12.2 Two-Phase Orchestration Guarantee
To eliminate any window of corruption, the transition service must follow an **Atomic Database First, Idempotent Cleanup Second** pattern:
1. Validate ownership challenge.
2. Execute PostgreSQL database mutations inside a single `withTenantTransaction`.
3. Commit SQL transaction.
4. Retire/delete synthetic user in Supabase Auth.
If step 4 fails, it can be retried safely without rolling back the valid database state.

---

## 13. MIGRATION IMPACT COMPARISON

| Architectural Area | Option A: Synthetic Supabase Credential | Option B: Custom Next.js Auth Bridge |
| :--- | :--- | :--- |
| **Existing Users Table** | **ZERO SCHEMA CHANGES**. `users.id` retains 1:1 mapping with `auth.users.id`. | **BREAKING**. Requires decoupling `users.id` from `auth.users.id` or adding custom credential columns. |
| **Supabase Auth Engine** | **EXTENDED ADDITIVELY**. Generates synthetic internal users for active students. | **BYPASSED**. Student authentication moved out of Supabase Auth entirely. |
| **Active Santri Migration** | Bulk script creates synthetic auth users in `auth.users` for existing Santri with initial NIS passwords. | Bulk script hashes NIS passwords into new custom credentials table in PostgreSQL. |
| **Existing Wali Accounts** | **ZERO MIGRATION**. Existing Wali accounts remain completely untouched. | Requires maintaining two separate auth engines (Supabase for Wali, Custom for Students). |
| **Alumni Personas** | Managed via new `user_tenant_personas` and `alumni_profiles` tables. | Managed via new tables, but requires custom session bridge for portal access. |
| **PostgreSQL RLS Policies** | **ZERO POLICY MUTATIONS**. Existing `0002_tenant_rls_hardening.sql` policies work out of the box. | **MASSIVE REFACTOR**. Policies relying on `auth.uid()` must be rewritten or bridged. |
| **Next.js Edge Proxy** | **ZERO CHANGES**. `src/proxy.ts` continues using `supabase.auth.getUser()`. | **COMPLETE REWRITE**. Proxy must parse custom session cookies and route dual auth paths. |
| **Password Recovery** | Native Supabase password reset emails. | Custom token generator, custom database table, custom email dispatcher. |
| **Rollback Safety** | High: Synthetic users can be purged via standard Supabase Admin API. | Low: Rolling back custom auth requires migrating database credential hashes back to Supabase. |
| **Operational Migration Burden** | **LOW (Estimated 1 engineering sprint)** | **HIGH (Estimated 3-4 engineering sprints)** |

---

## 14. OPERATIONAL COMPLEXITY & DAY-2 MAINTENANCE

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            OPERATIONAL COMPLEXITY COMPARISON                             │
├──────────────────────────┬─────────────────────────────┬─────────────────────────────────┤
│ Dimension                │ Option A: Synthetic Supabase│ Option B: Custom Next.js Bridge │
├──────────────────────────┼─────────────────────────────┼─────────────────────────────────┤
│ Incident Debugging       │ Unified Supabase Auth logs  │ Fragmented logs (Next.js server │
│                          │ correlate directly with DB. │ logs + application DB tables).  │
├──────────────────────────┼─────────────────────────────┼─────────────────────────────────┤
│ Customer Support Tools   │ Standard Supabase dashboard │ Must build custom admin UI for  │
│ (Password Reset)         │ can trigger password reset. │ credential management/unlocking.│
├──────────────────────────┼─────────────────────────────┼─────────────────────────────────┤
│ Token Expiration / MFA   │ Handled automatically by    │ Must be engineered, tested, and │
│                          │ Supabase Auth engine.       │ maintained in Next.js code.     │
├──────────────────────────┼─────────────────────────────┼─────────────────────────────────┤
│ Security Patching        │ Handled by upstream Supabase│ Application engineers must      │
│                          │ security releases.          │ patch crypto & session bugs.    │
├──────────────────────────┼─────────────────────────────┼─────────────────────────────────┤
│ Developer Onboarding     │ Standard Supabase patterns; │ Custom proprietary auth flow    │
│                          │ zero proprietary learning.  │ requiring bespoke documentation.│
└──────────────────────────┴─────────────────────────────┴─────────────────────────────────┘
```

---

## 15. LONG-TERM ARCHITECTURE (3–5 YEAR HORIZON)

Evaluating the two options against a multi-tenant scale of **100+ Pesantren, 100,000+ active students and alumni**:

### 1. Multi-Tenant Scalability
- **Option A**: Supabase Auth handles millions of identities with built-in indexing, connection pooling, and horizontal read scaling. Synthetic email strings add negligible storage overhead (~50 bytes per student).
- **Option B**: Increases load on Next.js server instances, which must execute CPU-intensive password hashing (bcrypt/argon2) rather than offloading it to the Supabase auth cluster.

### 2. Future Mobile Application (React Native / Flutter)
- **Option A**: Native Supabase Client SDK (`@supabase/supabase-js`, `supabase-flutter`) works directly on mobile devices. Students and alumni authenticate natively and query Postgres with RLS.
- **Option B**: Mobile applications cannot use the official Supabase SDK. Developers must build and maintain a complete custom REST API gateway in Next.js for mobile authentication.

### 3. Future SSO & Platform Integrations
- **Option A**: Compatible with Google Workspace, Kemag (Kementerian Agama) SSO, and SAML integrations through Supabase Auth Enterprise SSO.
- **Option B**: Bespoke SSO bridges must be engineered manually for every identity provider.

---

## 16. TECHNICAL DECISION MATRIX

Each dimension is scored on a strict 1–5 scale:
- **1**: Weak / Dangerous / Non-viable
- **2**: Limited / Significant architectural friction
- **3**: Acceptable / Meets minimum requirements
- **4**: Strong / Well-architected with manageable trade-offs
- **5**: Very Strong / Optimal industry best practice

| Evaluation Dimension | Option A: Synthetic Supabase | Option B: Custom Auth Bridge | Technical Evidence & Architectural Rationale |
| :--- | :---: | :---: | :--- |
| **1. Identity Integrity** | **5** | **3** | Option A preserves central `users.id` 1:1 mapping with `auth.users.id`. Option B creates split identity domains. |
| **2. Account Linking Safety** | **4** | **3** | Option A utilizes explicit re-auth challenge + atomic DB transaction. Option B relies entirely on app code. |
| **3. Email Collision Handling** | **4** | **3** | Option A protocol (TIR-009) halts auto-merge and consolidates personas cleanly under existing UID. |
| **4. Supabase Compatibility** | **5** | **1** | Option A is 100% native with `@supabase/ssr` and `src/proxy.ts`. Option B breaks existing proxy validation. |
| **5. JWT & RLS Compatibility** | **5** | **1** | Option A keeps PostgreSQL `auth.uid()` active everywhere. Option B risks catastrophic `service_role` bypass. |
| **6. Credential Lifecycle** | **4** | **4** | Both options can keep NIS active during email verification; Option A leverages Supabase confirmation states. |
| **7. Recovery Safety** | **5** | **2** | Option A uses hardened Supabase password recovery. Option B forces custom mailer/token development. |
| **8. Security Complexity** | **5** | **2** | Option A delegates crypto and session security to GoTrue. Option B requires high maintenance from app team. |
| **9. Migration Complexity** | **4** | **2** | Option A requires zero schema rewrites on existing tables. Option B requires extensive architectural refactoring. |
| **10. Operational Complexity** | **4** | **2** | Option A centralizes auth logs in Supabase. Option B fragments logs and debugging across layers. |
| **11. Maintainability** | **5** | **2** | Option A uses standard industry SDKs. Option B leaves high technical debt and bespoke code to maintain. |
| **12. Future Extensibility** | **5** | **3** | Option A allows direct mobile SDK and SSO integration. Option B requires custom API proxy for mobile apps. |
| **13. Rollback Safety** | **3** | **3** | Both require cleanup scripts if half-linked; Option A is well-bounded via Supabase Admin API. |
| **TOTAL SCORE** | **58 / 65**<br>**(89.2%)** | **31 / 65**<br>**(47.7%)** | **Option A holds a decisive +27 point advantage.** |

---

## 17. TECHNICAL RECOMMENDATION

```text
══════════════════════════════════════════════════════════════════════════════════
TECHNICAL RECOMMENDATION:
RECOMMENDED OPTION: OPTION A (SYNTHETIC SUPABASE AUTH CREDENTIAL WITH
                              ORCHESTRATED IDENTITY CONSOLIDATION)
══════════════════════════════════════════════════════════════════════════════════
```

### Primary Reasons:
1. **Preservation of Row-Level Security (RLS)**: Option A keeps PostgreSQL `auth.uid()` and `@supabase/ssr` operating as an impenetrable database-level defense boundary across all 30+ tables. Option B creates an unacceptable temptation to fall back to `service_role` database access.
2. **Zero Architecture Rewrite**: Option A fits seamlessly into APP MA'HAD's existing `src/proxy.ts`, `identity.ts`, and `tenant-transaction.ts`. Option B would require rewriting the Next.js proxy and bifurcating authentication into two parallel systems.
3. **Enterprise Security & Maintenance**: Delegating password hashing, brute-force throttling, session revocation, token rotation, and password recovery to Supabase Auth eliminates an enormous surface area of custom application vulnerability.

### Critical Trade-offs:
1. **Synthetic Email Management**: `auth.users` will store internal dummy emails (`{nis}@{tenant}.mahad.internal`). Outbound notification triggers must filter these addresses to prevent SMTP bounce accumulation.
2. **Identity Consolidation Orchestration (TIR-009)**: Linking a candidate Alumnus to an existing Wali account cannot simply update the email field in `auth.users`. It requires orchestrating persona attachment to the existing Wali UID and retiring the synthetic record.

### Known Risks & Concrete Mitigations:
1. **Risk**: Supabase Auth SMTP bounce on synthetic emails.
   - **Mitigation**: Synthetic student users are provisioned with `email_confirm: true` and notification workers explicitly suppress emails to `.internal` domains.
2. **Risk**: Race condition during identity consolidation.
   - **Mitigation**: All database updates execute inside `withTenantTransaction` with an explicit ownership verification token check.
3. **Risk**: Student lock-out during credential transition.
   - **Mitigation**: Synthetic email and NIS credentials remain 100% active until personal email verification and password establishment succeed.

---

## 18. OPEN QUESTIONS FOR PRODUCT OWNER REVIEW

Before formal DDL authorization, the Product Owner is requested to confirm the following operational preferences:

1. **Synthetic Email Domain Naming**:
   - Recommendation: `{nis}@{tenant_slug}.mahad.internal`
   - Alternative: `{tenant_slug}_{nis}@platform.local`
   - *Question for PO*: Does the Product Owner approve the `.mahad.internal` suffix convention?
2. **Dual-Persona Portal Switching Experience**:
   - When a user possesses both `WALI` and `ALUMNI` personas, should the UI display a persistent **Persona Switcher** in the top navigation bar, or require re-selecting the portal from a unified landing screen upon login?
3. **Student Initial PIN / Password Distribution**:
   - Should initial student passwords be auto-generated by the system and printed on the PSB Acceptance Letter / Student Card, or set by default to a secure formula (e.g. combination of Birth Date + Registration Code) requiring mandatory password change upon first login (`MUST_CHANGE_PASSWORD`)?

---

## 19. PRODUCT OWNER DECISION GATE

```text
══════════════════════════════════════════════════════════════════════════════════
GOVERNANCE DECISION GATE
══════════════════════════════════════════════════════════════════════════════════

Document Status:
COMPLETED — FINAL TECHNICAL DECISION PACKAGE

Antigravity Authority:
TECHNICAL EVALUATION & RECOMMENDATION ONLY

Product Owner Authority:
FORMAL ARCHITECTURAL DECISION & DDL AUTHORIZATION

Current Decision Status:
PENDING PRODUCT OWNER DECISION

Formal DDL Authorization:
NOT AUTHORIZED

Action Required:
Product Owner reviews this package and formally selects:
  [ ] OPTION A: Synthetic Supabase Auth Credential
  [ ] OPTION B: Custom Next.js Auth Bridge

Upon explicit PO decision recording, the next gate (Formal DDL Authorization)
can be unlocked to produce production migration scripts.
══════════════════════════════════════════════════════════════════════════════════
```
