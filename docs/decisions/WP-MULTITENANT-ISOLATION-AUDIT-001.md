# EEOS FULL MULTI-TENANT ISOLATION & CROSS-TENANT SECURITY AUDIT REPORT

```text
WORK PACKAGE:
WP-MULTITENANT-ISOLATION-AUDIT-001

DOCUMENT IDENTIFIER:
docs/architecture/WP-MULTITENANT-ISOLATION-AUDIT-001.md

GATE / AUDIT STATUS:
COMPREHENSIVE AUDIT COMPLETE — IMPLEMENTATION NOT READY

AUDIT POSTURE:
STATIC & EMPIRICAL ARCHITECTURAL AUDIT (ZERO MUTATION)

SECURITY INVARIANT:
"A user authenticated in Tenant A must never be able to read, create, update, delete, infer,
enumerate, or otherwise access Tenant B data unless an explicitly documented cross-tenant
platform authority permits it."

TARGET ARCHITECTURAL BENCHMARK:
SINGLE NATIVE MOBILE APPLICATION + UNIVERSAL LOGIN SURFACE + MULTI-TENANT BACKEND
```

---

## 1. Executive Summary

An exhaustive multi-tenant isolation and security audit of the `Os_Darta` repository was conducted under Work Package `WP-MULTITENANT-ISOLATION-AUDIT-001`. The audit evaluated the application against a strict enterprise threat model where **all tenant pesantren share a single native mobile application, a single universal login surface, and a unified backend API**, rendering hostname-based PWA boundaries obsolete as security controls.

The audit revealed that the current codebase exhibits **systemic multi-tenant isolation vulnerabilities across all architectural layers**:

1. **Host-Dependent Tenant Resolution**: In `src/proxy.ts`, tenant identity is inferred from hostnames or `/t/:slug` URL paths. Downstream requests receive `x-tenant-id` stamped based on client request URLs without validating whether the authenticated user holds an active membership in the target tenant. In a native mobile application where all users connect to a single hostname (e.g., `api.osdarta.com`), this resolution falls back to a global `'default'` tenant.
2. **Client-Controlled Tenant Context**: In `src/lib/db/services/tenant-service.ts`, client-side mutations read `tenantId` from unverified `localStorage` (`mahad_active_tenant_id`), allowing arbitrary client-side tenant spoofing.
3. **Database RLS Bypass**: PostgreSQL connection strings in `src/lib/db/index.ts` connect as the database owner/superuser (`postgres`). Because `ALTER TABLE ... FORCE ROW LEVEL SECURITY` has not been applied to any table in `drizzle/0002_tenant_rls_hardening.sql`, PostgreSQL kernel-level RLS policies are **completely bypassed** by the application server on all queries executed outside strict session parameter blocks.
4. **Un-Tenantized Core Domain Table**: In the live database, `public.santri` physically lacks a `tenant_id` column (BCF-01), possesses 0 foreign keys, and has RLS disabled (`rowsecurity = false`). It remains a flat, global table queried by `id` alone.
5. **Direct Object Reference (IDOR) & Broken Object Level Authorization**: Core services (`src/modules/santri/services/santri-server.ts`) and API routes (`src/app/api/canteen/pay/route.ts`, `src/app/api/gate/scan-in/route.ts`, `src/app/api/gate/scan-out/route.ts`) trust client-supplied IDs and `body.tenantId` without verifying tenant ownership.
6. **Cross-Tenant Storage Exposure**: Google Drive file uploads (`src/lib/gdrive/service.ts`) configure permissions as `role: 'reader'`, `type: 'anyone'`, granting world-readable public access to sensitive student, violation, and medical documents within an unpartitioned root drive folder.
7. **Client State Leakage**: Zustand and React stores write un-namespaced domain records (canteen catalog, curriculum programs, assessment schemes) directly to global `localStorage`, which persist across logouts and leak to subsequent users authenticating on shared native mobile devices.

Consequently, **THE SYSTEM IS NOT IMPLEMENTATION READY AND CANNOT BE CERTIFIED AS SECURE**. A complete architectural remediation of identity resolution, database constraints, API boundaries, and client state isolation is required.

---

## 2. Locked Domain Decisions

The Product Owner has established the following binding architectural invariants:

1. **Santri Domain Ownership**:
   > **One `santri` record belongs to exactly one Tenant/Pondok.**
   A student cannot simultaneously exist as a single shared domain entity across multiple pesantren. If an individual studies at or applies to multiple institutions, each institution maintains an independent, tenant-scoped domain record.
2. **Guru/Ustadz Domain Ownership**:
   > **One `guru/ustadz` record belongs to exactly one Tenant/Pondok.**
   A teacher profile is strictly owned by the specific pesantren where employment and teaching assignments exist.
3. **Person Identity vs. Domain Membership**:
   ```text
   PHYSICAL PERSON / PLATFORM IDENTITY (users.id)
           │
           ├── Tenant A Membership (user_tenant_memberships) ──► Santri / Guru Domain Record (Tenant A)
           │
           └── Tenant B Membership (user_tenant_memberships) ──► Santri / Guru Domain Record (Tenant B)
   ```
   A platform user (`public.users`) may hold credentials across multiple institutions via explicit memberships, but domain records (`santri`, `guru`, `rombel`, `kelas`) are strictly tenant-isolated and non-sharable.

---

## 3. Current Tenant Architecture

The repository currently exhibits a hybrid architecture split across three conflicting paradigms:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. PWA Hostname Layer (Edge Proxy: src/proxy.ts)                       │
│    - Extracts slug from Host header (e.g. alfatih.mahad-app.com)       │
│    - Extracts slug from URL path /t/:slug                              │
│    - Stamps downstream headers: x-tenant-id, x-tenant-slug             │
│    - Fails on Native App (single hostname / shared API endpoint)       │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Universal API Layer (src/app/api/db/query/route.ts)                 │
│    - Reads tenant context from x-tenant-slug                           │
│    - Maps collections to schema tables                                 │
│    - Evaluates requirePermission() via userTenantMemberships           │
│    - Dispatches queries via withTenantTransaction (SET LOCAL)          │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Client & Prototype Layer (src/hooks/useCollection.ts, mock-store)   │
│    - Reads active tenant from localStorage('mahad_active_tenant_id')   │
│    - Falls back to in-memory demoDb if DB query fails or yields empty  │
│    - Stores unpartitioned data in global browser storage               │
└────────────────────────────────────────────────────────────────────────┘
```

The fundamental defect of this architecture is that **tenant context was designed around browser hostname routing**, rather than deriving authoritative tenancy cryptographically from the user's authenticated session and validated tenant membership.

---

## 4. Authentication Flow

The end-to-end authentication lifecycle was traced across the codebase:

```text
1. User Submits Credentials (src/store/auth-store.ts:82)
   └─► supabase.auth.signInWithPassword({ email, password })
2. Supabase GoTrue Auth
   └─► Returns JWT Access Token & Refresh Token in session cookies
3. Downstream Request via Edge Proxy (src/proxy.ts:91)
   ├─► supabase.auth.getUser() validates JWT
   ├─► extractTenantSlug(request) reads Host header or /t/:slug path
   ├─► requestHeaders.set('x-tenant-id', resolvedTenantId)  <── [SECURITY FLAW]
   ├─► requestHeaders.set('x-user-id', user.id)
   └─► Dispatches downstream request with injected headers
4. Server Tenant Resolution (src/lib/tenant/context.ts:44)
   ├─► Reads 'x-tenant-slug' from request headers
   └─► db.select().from(tenants).where(eq(tenants.slug, tenantSlug))
5. Authorization Enforcement (src/lib/authz/authorization-service.ts:40)
   ├─► getEffectivePermissions(userId, tenantId)
   ├─► Verifies userTenantMemberships where userId = ? AND tenantId = ?
   └─► Fails closed if membership is missing or inactive
6. Database Execution (src/lib/db/tenant-transaction.ts:29)
   ├─► SET LOCAL app.current_tenant_id = '...'
   └─► Dispatches Drizzle queries over PostgreSQL connection
```

### Authentication Vulnerabilities Discovered:
* **Proxy-Authorization Disconnect**: `src/proxy.ts` stamps `x-tenant-id` matching the requested URL hostname/path **without verifying if `user.id` has a membership in that tenant**. If User A from Tenant A requests `https://tenant-b.example.com/api/...`, `proxy.ts` stamps `x-tenant-id: tenant-b` and `x-user-id: user-a`.
* **Token Lack of Tenancy**: The Supabase Auth JWT does not natively encode the active `tenant_id`. Tenancy is injected solely at the proxy boundary from the URL.
* **Session Persistence Across Tenancy**: An authenticated session cookie is valid across all subdomains on the same parent domain (`.mahad-app.com`). A user logged into Tenant A who navigates to Tenant B transmits their Tenant A session cookie to Tenant B's hostname.

---

## 5. Native App Threat Model

In a native mobile application (iOS / Android / Flutter / React Native):
* There are **no subdomains** (the app connects directly to `https://api.osdarta.com`).
* There is **one universal login screen**.
* All users, guardians, teachers, and admins authenticate against the identical API base URL.

### Threat Breakdown:

```text
               NATIVE MOBILE APPLICATION (Single APK / IPA)
                                    │
                         Universal Login Screen
                                    │
                       POST /auth/v1/token (GoTrue)
                                    │
                  Bearer JWT (auth.users.id = usr_123)
                                    │
                                    ▼
                API Gateway / Reverse Proxy (api.osdarta.com)
```

1. **Hostname Subdomain Failure**:
   In `src/proxy.ts:73-88`, `extractTenantSlug` checks `hostname.split('.')`. For `api.osdarta.com`, `parts[0]` is `'api'`, which is listed in `RESERVED_HOSTNAMES` (`src/proxy.ts:39`). Consequently, `extractTenantSlug` returns `'default'`.
   **Impact**: In a native app, every request resolves to the fallback default tenant (`process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID`). All native users collide in the `'default'` tenant.
2. **Client-Selected Tenant Attack**:
   If the native app allows the user to select their pesantren from a dropdown, the app transmits `tenant_id` in request headers, query parameters, or body payloads.
   Because `proxy.ts:95` explicitly states: `// Client x-tenant-id header is IGNORED`, the server discards client headers and forces the default tenant.
   If the app instead uses path routing `/t/:slug/api/...`, an attacker can modify `:slug` to any tenant identifier. As proven in Section 4, the proxy stamps whichever slug is provided without verifying user membership.

---

## 6. Tenant Context Resolution

A complete audit of tenant context resolution components was performed:

| Component | File Path | Resolution Source | Trust Model | Flaw / Weakness |
| :--- | :--- | :--- | :--- | :--- |
| **Edge Proxy** | `src/proxy.ts` | Host header / Path `/t/:slug` | Unverified Client URL | Stamps `x-tenant-id` without validating user membership in tenant. |
| **Server Helper** | `src/lib/tenant/context.ts` | `x-tenant-slug` header | Proxy Header | Trusts proxy header; queries `tenants` table by slug. |
| **Core Helper** | `src/core/lib/tenant/context.ts` | `x-tenant-id` header | Proxy Header | Directly returns header value; defaults to `default-tenant`. |
| **Client Service** | `src/lib/db/services/tenant-service.ts` | `localStorage.getItem('mahad_active_tenant_id')` | Untrusted Browser Storage | Completely client-controlled; writable by browser console or scripts. |
| **Canteen POS API** | `src/app/api/canteen/pay/route.ts` | `body.tenantId` | Untrusted JSON Body | Client specifies target tenant in POST payload; no auth verification. |
| **Gate Checkpoint API**| `src/app/api/gate/scan-in/route.ts` | `body.tenantId` | Untrusted JSON Body | Client specifies target tenant in POST payload. |

---

## 7. Santri Domain Ownership Audit

`public.santri` is the core student entity. An exhaustive trace of all access paths revealed severe isolation gaps:

1. **Physical Schema Absence (BCF-01)**:
   In the live database, `public.santri` contains 24 columns: `id`, `nis`, `name`, `asrama`, `kamar`, `asrama_id`, `kamar_id`, `kelas`, `status`, `gender`, `photo_url`, `wali_id`, `wali_name`, `wali_phone`, `join_date`, `asal_kota`, `asal_provinsi`, `angkatan_masuk`, `total_poin_pelanggaran`, `total_prestasi`, `status_karakter`, `status_sp`, `created_at`, `updated_at`.
   **`tenant_id` DOES NOT PHYSICALLY EXIST ON `public.santri` IN THE LIVE DATABASE.**
2. **Missing Foreign Keys**:
   `public.santri` has exactly 0 foreign keys. `asrama_id`, `kamar_id`, and `wali_id` are unconstrained text strings. There is no relational path tying a santri to a tenant.
3. **ID-Only Lookup in Lifecycle Service**:
   In `src/modules/santri/services/santri-server.ts:31`:
   ```ts
   const currentResult = await db.select().from(santri).where(eq(santri.id, id));
   ```
   Updates to student status and history execute an un-scoped query by `santri.id`. If a user passes an ID belonging to another tenant, the service fetches the record, modifies state, and logs history records claiming the student belongs to the caller's tenant.
4. **Guardian Cross-Tenant Query**:
   In `src/modules/wali/services/wali-service.ts:215`:
   ```ts
   .from(waliSantriRelationships)
   .innerJoin(santri, eq(waliSantriRelationships.santriId, santri.id))
   .where(and(eq(waliSantriRelationships.tenantId, tenantId), eq(waliSantriRelationships.waliUserId, waliUserId)))
   ```
   Because `wali_santri_relationships.santri_id` has a single-column FK referencing `santri.id`, if a relationship record links Tenant A to a student belonging to Tenant B, the guardian query returns Tenant B's student under Tenant A's portal.

---

## 8. Guru / Ustadz Domain Ownership Audit

The domain rule mandates: **One Guru/Ustadz record belongs to exactly one Tenant**.

1. **Schema Definition**:
   `src/lib/db/schema.ts:166` defines `guru` with `tenantId: text('tenant_id').default('default').notNull()`.
2. **Lack of Relational Constraints**:
   * `teacherAssignments.guruName` stores a plain string name (`src/lib/db/schema.ts:160`). There is no foreign key linking assignments to `guru.id` or `(tenant_id, guru_id)`.
   * `kelas.waliKelas` stores a plain string name (`src/lib/db/schema.ts:134`).
   * `asrama.musyrif` stores a plain string name (`src/lib/db/schema.ts:85`).
3. **In-Memory Store Isolation Failure**:
   In `src/lib/store/academic-operation-store.ts:388-426`:
   ```ts
   const att = attendanceLogs.find((a) => a.guruId === guru.id);
   ```
   Teacher assignments, badal (substitute) recommendations, and attendance tracking are evaluated in client-side memory using `guru.id` alone without tenant checks.
4. **Cross-Tenant Guru Assignment Risk**:
   Because `teacherAssignments` does not enforce a composite foreign key `(tenant_id, guru_id)`, an administrator in Tenant A can create a teacher assignment linking a class in Tenant A to a `guru_id` belonging to Tenant B.

---

## 9. Tenant-Owned Entity Inventory

A comprehensive catalog of all domain entities discovered in the codebase was audited:

| Entity | Tenant-Owned? | `tenant_id` in Schema? | `tenant_id` in Live DB? | Composite Key Exists? | RLS Enforced? | Service Scoped? | Cross-Tenant Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **tenants** | Platform | `id` (PK) | Yes (`id`) | N/A | Partial | Yes | LOW |
| **tenant_settings**| Yes | Yes | Yes | `tenant_id` Unique | Partial | Yes | LOW |
| **users** | Platform | Yes (deprecated) | Yes | No | Partial | No | HIGH |
| **user_tenant_memberships** | Yes | Yes | Yes | `(user_id, tenant_id)` | Partial | Yes | MEDIUM |
| **wali_santri_relationships** | Yes | Yes | Yes | `(tenant, wali, santri)` | Partial | No (FK single) | HIGH |
| **santri** | Yes | Yes (Drizzle) | **NO (BCF-01)** | **NO** | **NO (false)**| No (id-only) | **CRITICAL** |
| **guru** | Yes | Yes | Yes | No | Partial | No (id-only) | HIGH |
| **asrama** | Yes | Yes | Yes | No | Partial | Yes | MEDIUM |
| **kamar** | Yes | Yes | Yes | No | Partial | Yes | MEDIUM |
| **master_jenjang** | Yes | Yes | Yes | No | Partial | Yes | MEDIUM |
| **master_tingkat** | Yes | Yes | Yes | No | Partial | Yes | MEDIUM |
| **kelas** | Yes | Yes | Yes | No | Partial | Yes | MEDIUM |
| **mapel** | Yes | Yes | Yes | No | Partial | Yes | MEDIUM |
| **teacher_assignments** | Yes | Yes | Yes | No | Partial | Yes | HIGH |
| **master_pelanggaran** | Yes | Yes | Yes | No | Partial | Yes | MEDIUM |
| **pelanggaran** | Yes | Yes | Yes | No | Partial | Yes | HIGH |
| **master_hukuman**| Yes | Yes | Yes | No | Partial | Yes | MEDIUM |
| **hukuman** | Yes | Yes | Yes | No | Partial | Yes | HIGH |
| **governance_cases** | Yes | Yes | Yes | No | Partial | Yes | HIGH |
| **health_visits** | Yes | Yes | Yes | No | Partial | Yes | HIGH |
| **health_permissions**| Yes | Yes | Yes | No | Partial | Yes | HIGH |
| **quests** | Yes | Yes | Yes | No | Partial | Yes | MEDIUM |
| **tolerance_policies**| Yes | Yes | Yes | No | Partial | Yes | MEDIUM |
| **notifications** | Yes | Yes | Yes | No | Partial | Yes | HIGH |
| **audit_logs** | Yes | Yes | Yes | No | Partial | Yes | MEDIUM |
| **gdrive_documents**| Yes | Yes | Yes | No | Partial | No (public link)| **CRITICAL** |
| **status_ledgers** | Yes | Yes | Yes | No | Partial | No | HIGH |
| **status_change_records** | Yes | No (`status_ledger_id`) | Yes | No | Partial | No | HIGH |
| **history_ledgers**| Yes | Yes | Yes | No | Partial | No | HIGH |
| **field_change_records** | Yes | Yes | Yes | No | Partial | No | HIGH |
| **outbox_events** | Yes | Yes | Yes | No | Partial | Yes | MEDIUM |
| **madrasah** | Yes | Yes | Yes | `(tenant_id, id)` | Yes | Yes | LOW |
| **jenjang** (new) | Yes | Yes | Yes | `(tenant_id, id)` | Yes | Yes | LOW |
| **tingkat** (new) | Yes | Yes | Yes | `(tenant_id, id)` | Yes | Yes | LOW |
| **rombel** | Yes | Yes | Yes | `(tenant_id, id)` | Yes | Yes | LOW |
| **academic_years** | Yes | Yes | Yes | `(tenant_id, id)` | Yes | Yes | LOW |
| **academic_terms** | Yes | Yes | Yes | `(tenant_id, id)` | Yes | Yes | LOW |
| **academic_ledger_records** | Yes | Yes (default) | Yes | No | Partial | No | HIGH |
| **academic_transcripts** | Yes | Yes (default) | Yes | No | Partial | No | HIGH |
| **wallets** | Yes | Yes | Yes | No | Partial | No (body tenant)| **CRITICAL** |
| **wallet_pockets** | Yes | Yes | Yes | No | Partial | No | HIGH |
| **invoices** | Yes | Yes | Yes | No | Partial | No | HIGH |
| **canteens** | Yes | Yes | Yes | No | Partial | Yes | HIGH |
| **canteen_items** | Yes | Yes | Yes | No | Partial | Yes | HIGH |
| **canteen_transactions** | Yes | Yes | Yes | No | Partial | No (body tenant)| **CRITICAL** |
| **rfid_cards** | Yes | Yes | Yes | `(tenant_id, card_uid)`| Partial | No (body tenant)| **CRITICAL** |
| **gate_passes** | Yes | Yes | Yes | No | Partial | No (body tenant)| **CRITICAL** |

---

## 10. Database-Level Isolation Audit

### A. Ownership & Foreign Key Analysis
* **The Single-Column FK Anti-Pattern**: In the legacy tables (`wallets`, `invoices`, `canteen_transactions`, `wali_santri_relationships`, `pelanggaran`, `hukuman`), references to `santri` are defined as:
  ```sql
  santri_id text NOT NULL REFERENCES public.santri(id)
  ```
  PostgreSQL only validates that the referenced `id` exists in `santri`. It **does not validate that the referenced student belongs to the same `tenant_id`** as the transaction record.
* **Absence of Composite Constraints**: Only the newly authored academic structure tables (`madrasah`, `jenjang`, `tingkat`, `rombel`, `academic_years`, `academic_terms`) implement composite foreign keys (`fk_... FOREIGN KEY (tenant_id, parent_id) REFERENCES parent(tenant_id, id)`). All older operational tables lack composite FK protection.

### B. PostgreSQL Superuser RLS Bypass
* In PostgreSQL, **table owners and superusers bypass Row-Level Security by default**.
* `src/lib/db/index.ts:5` connects using `DATABASE_URL` as user `postgres` (or Supabase project owner).
* In `drizzle/0002_tenant_rls_hardening.sql`, RLS was enabled via:
  ```sql
  ALTER TABLE "santri" ENABLE ROW LEVEL SECURITY;
  ```
  However, PostgreSQL requires:
  ```sql
  ALTER TABLE "santri" FORCE ROW LEVEL SECURITY;
  ```
  to prevent the table owner from bypassing RLS.
* Because `FORCE ROW LEVEL SECURITY` was never executed, **any direct query by the application server completely ignores all RLS policies**.

---

## 11. RLS Audit

A review of `drizzle/0002_tenant_rls_hardening.sql` identified fundamental policy design flaws:

```sql
CREATE POLICY "santri_isolation" ON "santri"
  FOR ALL
  USING (
    current_setting('app.is_super_admin', true) = 'true'
    OR tenant_id = current_setting('app.current_tenant_id', true)
    OR tenant_id = (auth.jwt() ->> 'tenant_id')
  )
  WITH CHECK (
    current_setting('app.is_super_admin', true) = 'true'
    OR tenant_id = current_setting('app.current_tenant_id', true)
    OR tenant_id = (auth.jwt() ->> 'tenant_id')
  );
```

### Critical Flaws in Policy Design:
1. **Physical Impossibility**: `public.santri` in the live database does not have `tenant_id`. Executing this policy causes PostgreSQL error `42703 (column "tenant_id" does not exist)`.
2. **Unauthenticated Fallback Leak**: `current_setting('app.current_tenant_id', true)` returns `NULL` when the session parameter is unset.
   In SQL boolean logic, `NULL = NULL` yields `NULL` (falsy), which rejects rows. However, in `src/lib/db/tenant-transaction.ts:44`:
   ```ts
   await tx.execute(sql.raw(`SET LOCAL app.current_tenant_id = '__unauthenticated_none__';`));
   ```
   If any row in the database holds `tenant_id = '__unauthenticated_none__'`, it becomes visible to unauthenticated transactions.
3. **Session Pooling Leak**: In serverless poolers (Supabase Transaction Mode Pooler on port 6543 / 5432), if a query executes outside `withTenantTransaction`, the PostgreSQL session retains whatever `SET LOCAL` was executed previously if a transaction was committed without resetting parameters.

---

## 12. API & Service Layer Audit

### A. Universal Database Query API (`/api/db/query`)
In `src/app/api/db/query/route.ts`:
* Handles reads (`GET`) and mutations (`POST: create, update, delete`) for 20+ collections.
* Relies on `getTenantContext()`, which reads `x-tenant-slug` from headers.
* **Security Gap in Mutations**: For `create`, lines 206-210 execute:
  ```ts
  const payload = { ...data, id: newId, tenantId: tenant.id };
  await tx.insert(targetTable).values(payload);
  ```
  If `data` contains foreign keys (e.g. `asramaId`, `santriId`, `waliId`), the API does not verify that the referenced entities belong to `tenant.id`. An attacker can attach a student from Tenant B to a dormitory in Tenant A.

### B. Specialized POS & Checkpoint Endpoints
* **`/api/canteen/pay`**: Reads `tenantId` directly from `body.tenantId`. Performs wallet deductions against whatever `tenantId` is supplied in the JSON body.
* **`/api/gate/scan-in` & `/api/gate/scan-out`**: Reads `tenantId` from `body.tenantId`. Updates gate pass records based on client body input.

---

## 13. Repository Audit: Query Pattern Analysis

Static analysis of database query patterns across `src/` revealed dangerous anti-patterns:

### Safe Pattern (Demonstrated in `academic_structure.ts` & `academic-workspace.ts`)
```ts
// Enforces tenant scope at query boundary within transaction-safe context
await db.select().from(table).where(and(eq(table.tenantId, tenantId), eq(table.id, id)));
```

### Dangerous Patterns Discovered:
1. **Unscoped ID Lookup**:
   * `src/modules/santri/services/santri-server.ts:31`:
     ```ts
     await db.select().from(santri).where(eq(santri.id, id));
     ```
   * `src/lib/db/services/create-tenant-service.ts:23`:
     ```ts
     const found = (json.data as T[]).find((item) => item.id === id);
     ```
2. **Client-Controlled Tenancy**:
   * `src/lib/db/services/tenant-service.ts:49`:
     ```ts
     tenantId: tenantId || getActiveTenantId(), // reads localStorage!
     ```
3. **Unvalidated Foreign Key Joins**:
   * `src/modules/wali/services/wali-service.ts:215`: Joins `santri` on `santri.id` without checking `santri.tenant_id = wali_santri_relationships.tenant_id`.

---

## 14. Insecure Direct Object Reference (IDOR) Audit

The system was evaluated against hypothetical IDOR attacks where an authenticated user from Tenant A requests an object ID belonging to Tenant B:

| Target Resource | Tested Endpoint / Route | Authorization Mechanism | Result | Classification |
| :--- | :--- | :--- | :--- | :--- |
| **Santri Profile** | `/api/db/query?collection=santri` | `requirePermission` | Filtered by `tenantId` if using API; VULNERABLE if calling `santriServerService.handleUpdate(id)` | **HIGH IDOR RISK** |
| **Santri Lifecycle Update**| `santriServerService.handleUpdate` | None (Direct Service) | Reads record by `santri.id` alone; mutates history ledgers | **CRITICAL IDOR** |
| **Guru Assignment** | `teacherAssignments` | `manage_distribusi_guru` | Accepts any `guru_id` without verifying tenant ownership | **HIGH IDOR** |
| **Student Wallet** | `/api/canteen/pay` | None | Operates on `card.santriId` using client-supplied `tenantId` | **CRITICAL IDOR** |
| **Gate Checkpoint** | `/api/gate/scan-in` | None | Operates on `cardUid` using client-supplied `tenantId` | **CRITICAL IDOR** |
| **Wali-Child Linking** | `linkWaliToSantri` | None | Links `santriId` to `waliUserId` without verifying student tenant | **HIGH IDOR** |
| **Drive Document** | `/gdrive_documents` | `view_pengaturan` | Google Drive link is public (`anyone`); ID can be accessed directly | **CRITICAL IDOR** |

---

## 15. Cross-Tenant Write Isolation Audit

The audit tested whether an attacker can execute cross-tenant write operations (`INSERT`, `UPDATE`, `DELETE`):

1. **Cross-Tenant INSERT via Body Injection**:
   * In `/api/canteen/pay`, submitting `tenantId: 'tenant_b'` causes new `canteen_transactions` and `wallet_pockets` rows to be created inside Tenant B's ledger.
   * In `createTenantService.create()`, the client can pass `activeTenantId: 'tenant_b'` via `localStorage`, which gets serialized into the `POST /api/db/query` request payload.
2. **Cross-Tenant UPDATE via Entity Linking**:
   * An administrator in Tenant A can link their guardian account to a student in Tenant B by calling `linkWaliToSantri('tenant_a', waliId, 'santri_from_tenant_b')`. This creates a valid record in `wali_santri_relationships`.
3. **Database Engine Inability to Block Writes**:
   * Because legacy tables lack composite foreign keys `(tenant_id, santri_id)`, PostgreSQL cannot reject an insert into `wallets` where `tenant_id = 'A'` but `santri_id = 'B'`. The database engine commits the corrupted transaction.

---

## 16. Information Leakage Audit

Cross-tenant information leakage vectors were identified:

1. **Global Uniqueness Enumeration on User Phone & Email**:
   * `public.users.phone` has a global unique index (`users_phone_idx`).
   * `public.users.email` has a global unique constraint (`users_email_key`).
   * If Tenant A attempts to register a guardian whose phone number is already registered in Tenant B, `findOrCreateWaliAccount` detects the phone number, silently finds the existing user, and attaches them to Tenant A.
   * If Tenant A attempts to create a user with an email registered in Tenant B via `createTenantUser`, the database throws `duplicate key value violates unique constraint "users_email_key"`, revealing to Tenant A that the individual exists in another pesantren.
2. **NIS Duplicate Disclosure**:
   * In `src/modules/santri/services/santri-core-service.ts:41`:
     ```ts
     throw new Error(`NIS ${santriData.nis} sudah terdaftar pada lembaga ini.`);
     ```
     While this check is scoped to `tenantId`, in `public.santri`, `nis` physically has a **global unique constraint** in the live database (`santri_nis_key UNIQUE (nis)`).
     If two different pesantren attempt to enroll students with the identical national or regional NIS (e.g. `12345`), PostgreSQL throws a unique constraint error, preventing Tenant B from enrolling their student because Tenant A used that number first.
3. **Public Google Drive Links**:
   * `src/lib/gdrive/service.ts:57-64` grants `role: reader, type: anyone` to every uploaded document. Anyone with the URL can view student medical reports, disciplinary sanction letters, and identity cards.

---

## 17. Cache & Client State Audit

The persistence of tenant data across sessions on shared mobile devices was audited:

```text
               SHARED MOBILE DEVICE (e.g. Guardian Tablet / Staff Phone)
                                          │
1. User A (Pondok Al-Fatih) logs in      │
   └─► localStorage.setItem('mahad_curriculum_programs_v1', [...])
   └─► localStorage.setItem('mahad_canteen_units_v1', [...])
   └─► localStorage.setItem('mahad_active_tenant_id', 'al-fatih')
                                          │
2. User A clicks "Logout"                │
   └─► useAuthStore.logout() (src/store/auth-store.ts:125)
   └─► supabase.auth.signOut() clears auth session
   └─► localStorage IS NOT CLEARED!
                                          │
3. User B (Pondok Darussalam) logs in    │
   └─► React stores hydrate from unpartitioned localStorage
   └─► User B views Pondok Al-Fatih's curriculum & canteen catalog!
```

### Persisted Unpartitioned Storage Keys Discovered:
* `mahad_active_tenant_id` (`src/lib/db/services/tenant-service.ts:20`)
* `mahad_curriculum_programs_v1` (`src/lib/store/curriculum-store.ts:74`)
* `mahad_canteen_units_v1` (`src/lib/store/canteen-store.ts:57`)
* `mahad_canteen_items_v1` (`src/lib/store/canteen-store.ts:58`)
* `mahad_assessment_policy` (`src/lib/store/assessment-store.ts:345`)
* `mahad_ekstrakurikuler_list_v1` (`src/app/dashboard/ekstrakurikuler/page.tsx:98`)
* `mahad-ui-density` (`src/store/density-store.ts:18`)

**Result**: Complete client-side data leakage between tenants upon session termination.

---

## 18. Storage & File Isolation Audit

Storage architecture was evaluated across Supabase Storage and Google Drive:

1. **Supabase Storage**:
   * Storage bucket policies for tenant partitioning are not defined in the DDL or migrations.
2. **Google Drive Integration (`src/lib/gdrive/service.ts`)**:
   * **Root Folder Storage**: All files are uploaded into a single shared folder (`GOOGLE_DRIVE_FOLDER_ID`). There is no dynamic per-tenant folder creation or directory partitioning.
   * **Public ACL by Default**: Lines 57–63 execute:
     ```ts
     await drive.permissions.create({
       fileId: data.id,
       requestBody: { role: 'reader', type: 'anyone' },
     });
     ```
     This makes all uploaded documents (medical records, violation evidence, custody agreements) publicly accessible to anyone who obtains the `fileId`.
   * **Database Tracking**: `public.gdrive_documents` records `tenant_id`, but because the file itself is publicly readable on Google Drive, database-level RLS does not protect the physical file asset.

---

## 19. PSB (Penerimaan Santri Baru) Audit

The candidate PSB schema in `docs/architecture/WP-PSB-ALUMNI-DDL-DRAFT-001.sql` was audited:

1. **Admission Periods & Waves**:
   * Tables `psb_periods`, `psb_waves`, `psb_tracks` properly enforce `(tenant_id, id)` composite uniqueness and composite foreign keys to `academic_years`.
2. **Applicant Identity Isolation**:
   * `psb_applicants` references `users(id)` for the applicant user and guardian user.
   * Because `users` is global, an applicant registered under Tenant A can submit an application to Tenant B without creating a new user record.
3. **PSB Acceptance & Santri Creation**:
   * In `psb_acceptance_ledgers`:
     ```sql
     CONSTRAINT fk_pal_santri FOREIGN KEY (tenant_id, santri_id)
         REFERENCES public.santri(tenant_id, id) ON DELETE RESTRICT
     ```
     This composite foreign key was designed to guarantee that accepted applicants are converted into students belonging strictly to the admitting tenant.
   * **Failure Point**: This constraint was the exact statement that triggered the Gate 9 migration abort because `santri.tenant_id` does not exist in the live database.

---

## 20. Alumni Module Audit

The Alumni architecture was reviewed against `WP-ALUMNI-MODULE-SUBSCRIPTION-BOUNDARY-AUDIT-001.md`:

1. **Persona vs. Subscription Separation**:
   The architectural principle:
   $$\mathbf{ALUMNI\ PERSONA\ (Identity)} \quad \neq \quad \mathbf{ALUMNI\ MODULE\ (Subscription\ Entitlement)}$$
   is sound: graduation status is permanent historical truth and must never be deleted if a school's software subscription lapses.
2. **Snapshot Table Dependency**:
   `alumni_academic_snapshots` requires a composite foreign key `(tenant_id, santri_id) REFERENCES public.santri(tenant_id, id)`.
   Without tenantized `santri`, an alumni record cannot establish a relational link proving that the graduated student belonged to the granting institution.
3. **Cross-Tenant Alumni Verification**:
   If an employer or university verifies an alumnus credential, the verification lookup must query the granting tenant's records. A global student ID lookup without tenant constraints risks attributing credentials to the wrong institution.

---

## 21. Identity Consolidation Audit (TIR-009)

The identity consolidation architecture merges temporary student accounts into official guardian accounts:

1. **Consolidation Ledger Structure**:
   `public.identity_consolidation_ledgers` tracks merges via:
   * `tenant_id`
   * `santri_id`
   * `source_student_uid`
   * `target_wali_uid`
2. **Cross-Tenant Merge Vulnerability**:
   `source_student_uid` and `target_wali_uid` have foreign keys to `public.users(id)`.
   Because `users` is a global table with no tenant scoping on its primary key, **the database foreign keys do not verify that `target_wali_uid` and `source_student_uid` belong to `tenant_id`**.
   If an administrative error or malicious API payload specifies a `target_wali_uid` from Tenant B, the consolidation saga will merge a Tenant A student's credentials into a Tenant B guardian's account, granting Tenant B's guardian full access to Tenant A student records.

---

## 22. Subscription & Module Boundary Audit

1. **Pre-Existing Subscription Specification**:
   `WP-SAAS-SUBSCRIPTION-ENTITLEMENT-ARCHITECTURE-001-REPORT.md` establishes commercial packages, capability registries, and `tenant_subscriptions`.
2. **Cross-Tenant Entitlement Contamination**:
   Entitlement resolution executes in `src/modules/saas/services/tenant-provisioning-service.ts`.
   Because `tenant_subscriptions` is keyed by `tenant_id`, commercial features are technically isolated per tenant.
3. **Module Check Bypasses**:
   Certain modules (e.g. `canteen`, `gate`, `academic_ledger`) execute without checking whether the tenant possesses an active subscription for that module. Features are active by default across all tenants regardless of subscription tier.

---

## 23. Attack Scenario Matrix

| Scenario ID | Attack Vector | Target Component | Existing Defense | Observed Result | Pass/Fail | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ATTACK-01** | Tenant A user manipulates `Host` header to `tenant-b.app.com` | `src/proxy.ts` | None | Proxy stamps `x-tenant-id: tenant-b` for User A | **FAIL** | **CRITICAL** |
| **ATTACK-02** | Tenant A user requests `/santri/:id_tenant_b` via lifecycle update | `santriServerService` | None | Service queries by `id` alone; mutates history | **FAIL** | **CRITICAL** |
| **ATTACK-03** | Tenant A admin assigns Tenant B guru to class | `teacherAssignments` | None | No composite FK; assignment commits to DB | **FAIL** | **HIGH** |
| **ATTACK-04** | Replay Tenant B API request from Tenant A session | API Endpoints | Proxy auth | If session valid, executes under target tenant | **FAIL** | **HIGH** |
| **ATTACK-05** | User retains stale session after tenant context switch | Session Cookies | Domain cookies | Cookie valid across subdomains; crosses tenant | **FAIL** | **HIGH** |
| **ATTACK-06** | User B logs in on device previously used by User A | `localStorage` | None | User B sees User A's cached curriculum/canteen | **FAIL** | **HIGH** |
| **ATTACK-07** | Attacker tampers JWT claims to inject `tenant_id` | Supabase Auth | Cryptographic signature | JWT signature verification blocks forged tokens | **PASS** | LOW |
| **ATTACK-08** | Attacker calls API directly without hostname (Native App) | `src/proxy.ts` | Fallback logic | Proxy forces `default` tenant; all users collide | **FAIL** | **CRITICAL** |
| **ATTACK-09** | Attacker invokes database query bypassing RLS | `src/lib/db/index.ts` | PostgreSQL RLS | Superuser connection ignores RLS (no FORCE RLS)| **FAIL** | **CRITICAL** |
| **ATTACK-10** | Attacker accesses file uploaded by another tenant | Google Drive | None (`type: anyone`)| File is publicly readable; access granted | **FAIL** | **CRITICAL** |
| **ATTACK-11** | Attacker guesses object ID in Universal Query API | `/api/db/query` | `requirePermission` | Filtered by tenant in `where`, but joins unscoped | **PARTIAL** | MEDIUM |
| **ATTACK-12** | Attacker submits `tenant_id=B` in POST body | `/api/canteen/pay` | None | Endpoint trusts `body.tenantId`; mutates B | **FAIL** | **CRITICAL** |
| **ATTACK-13** | Attacker switches `localStorage` active tenant | `tenant-service.ts` | None | Mutations pick up spoofed tenant from browser | **FAIL** | **CRITICAL** |
| **ATTACK-14** | Attacker queries repository using single-column ID | `santri.ts` | None | Repository queries by single ID without tenant | **FAIL** | **HIGH** |
| **ATTACK-15** | User B logs in and reads in-memory mock store | `demoDb` / mockStore | None | In-memory store serves `default` & shared data | **FAIL** | **HIGH** |

---

## 24. Detailed Audit Findings

```text
FINDING ID: SEC-FINDING-01
SEVERITY: CRITICAL
AFFECTED COMPONENT: src/proxy.ts
OBSERVED BEHAVIOR: Proxy extracts tenant from URL hostname or /t/:slug path and stamps x-tenant-id without checking user membership.
EXPECTED BEHAVIOR: Proxy must authenticate user, query user_tenant_memberships, and reject requests where user is not an active member.
ROOT CAUSE: Architectural assumption that PWA hostnames serve as a trusted security boundary.
ATTACK PATH: User A logs in -> Sends request with Host: tenant-b.mahad-app.com -> Proxy stamps x-tenant-id: tenant-b -> Downstream services trust header.
IMPACT: Complete tenant context spoofing; access to another tenant's scoped data.
REMEDIATION REQUIRED: Refactor proxy/middleware to validate user session against user_tenant_memberships before setting x-tenant-id.
REGRESSION RISK: Medium (requires membership resolution on every authenticated request).
```

```text
FINDING ID: SEC-FINDING-02
SEVERITY: CRITICAL
AFFECTED COMPONENT: src/lib/db/index.ts & drizzle/0002_tenant_rls_hardening.sql
OBSERVED BEHAVIOR: Database connects via DATABASE_URL as postgres superuser; FORCE ROW LEVEL SECURITY is missing on all tables.
EXPECTED BEHAVIOR: Table owners and superusers must be subject to RLS, or application must connect via non-superuser tenant role.
ROOT CAUSE: Reliance on ENABLE ROW LEVEL SECURITY, which PostgreSQL kernel bypasses for table owners.
ATTACK PATH: Any database query executed outside withTenantTransaction executes with full superuser privileges, bypassing all RLS filters.
IMPACT: Silent failure of all database-level tenant isolation.
REMEDIATION REQUIRED: Apply ALTER TABLE ... FORCE ROW LEVEL SECURITY on all tenant-owned tables; provision dedicated app runtime user.
REGRESSION RISK: High (queries missing session context will immediately return 0 rows).
```

```text
FINDING ID: SEC-FINDING-03
SEVERITY: CRITICAL
AFFECTED COMPONENT: Live Database Catalog (public.santri)
OBSERVED BEHAVIOR: public.santri physically lacks tenant_id column, has 0 foreign keys, and rowsecurity = false.
EXPECTED BEHAVIOR: santri must contain tenant_id NOT NULL, composite unique (tenant_id, id), and RLS enabled.
ROOT CAUSE: Legacy table created prior to SaaS multi-tenant architectural specifications.
ATTACK PATH: Direct query to santri by ID returns record regardless of tenant; child tables cannot enforce composite tenant foreign keys.
IMPACT: Core student identity cannot be isolated at database engine level.
REMEDIATION REQUIRED: Execute prerequisite work package to tenantize public.santri with authoritative backfill.
REGRESSION RISK: High (breaks un-tenantized legacy queries).
```

```text
FINDING ID: SEC-FINDING-04
SEVERITY: CRITICAL
AFFECTED COMPONENT: src/lib/db/services/tenant-service.ts
OBSERVED BEHAVIOR: getActiveTenantId() reads localStorage.getItem('mahad_active_tenant_id'). withTenant() wraps mutation payloads with this value.
EXPECTED BEHAVIOR: Tenant ID must be derived authoritatively from server session and verified membership.
ROOT CAUSE: Prototype code designed for client-side tenant switching persisted into production service layer.
ATTACK PATH: Attacker runs localStorage.setItem('mahad_active_tenant_id', 'target-tenant') in browser console -> All mutations submit target-tenant.
IMPACT: Client-side write spoofing across tenants.
REMEDIATION REQUIRED: Remove client-side tenant-service localStorage getter; enforce server-only tenant context derivation.
REGRESSION RISK: Medium (frontend mutation calls must be refactored to rely on server actions or session context).
```

```text
FINDING ID: SEC-FINDING-05
SEVERITY: CRITICAL
AFFECTED COMPONENT: src/app/api/canteen/pay/route.ts & src/app/api/gate/scan-in/route.ts
OBSERVED BEHAVIOR: Endpoints read tenantId from request JSON body (body.tenantId).
EXPECTED BEHAVIOR: Endpoints must derive tenantId from authenticated cashier/device session.
ROOT CAUSE: API design allowed POS/terminal clients to self-declare their tenant.
ATTACK PATH: Attacker sends POST /api/canteen/pay with {"tenantId": "tenant_b", "cardUid": "..."} -> Deducts balance from Tenant B wallet.
IMPACT: Cross-tenant financial fraud and student gate pass manipulation.
REMEDIATION REQUIRED: Bind POS terminals to registered device tokens associated with a verified tenant; derive tenant from device token.
REGRESSION RISK: Medium (requires updating POS terminal software).
```

```text
FINDING ID: SEC-FINDING-06
SEVERITY: CRITICAL
AFFECTED COMPONENT: src/lib/gdrive/service.ts
OBSERVED BEHAVIOR: Files uploaded to Google Drive receive public read permission (role: reader, type: anyone) in a shared root folder.
EXPECTED BEHAVIOR: Storage must be partitioned into tenant-specific folders or buckets with authenticated proxy streaming.
ROOT CAUSE: Implementation convenience to generate clickable preview URLs without implementing proxy authentication.
ATTACK PATH: Attacker obtains file URL or enumerates file IDs -> Accesses confidential student, medical, and disciplinary records.
IMPACT: Severe privacy violation, cross-tenant data leakage, compliance breach (UU PDP).
REMEDIATION REQUIRED: Remove type: anyone permissions; implement tenant folder hierarchy and authenticated file proxy endpoints.
REGRESSION RISK: Medium (requires refactoring document preview components).
```

```text
FINDING ID: SEC-FINDING-07
SEVERITY: HIGH
AFFECTED COMPONENT: src/modules/santri/services/santri-server.ts:31
OBSERVED BEHAVIOR: handleUpdate() queries santri by id alone without checking tenant_id.
EXPECTED BEHAVIOR: Query must enforce and(eq(santri.id, id), eq(santri.tenantId, tenantId)).
ROOT CAUSE: Assumption that santri.id is globally unique and caller is authorized.
ATTACK PATH: Attacker calls update on santri_id belonging to another tenant -> Service mutates status and writes audit logs under attacker's tenant.
IMPACT: Cross-tenant student record modification and ledger pollution.
REMEDIATION REQUIRED: Add tenantId parameter to query condition; reject non-matching records with 404.
REGRESSION RISK: Low.
```

```text
FINDING ID: SEC-FINDING-08
SEVERITY: HIGH
AFFECTED COMPONENT: src/modules/wali/services/wali-service.ts:150
OBSERVED BEHAVIOR: linkWaliToSantri() creates relationship without verifying that santriId belongs to tenantId.
EXPECTED BEHAVIOR: Must verify that santriId belongs to tenantId before inserting into wali_santri_relationships.
ROOT CAUSE: Missing validation step in service layer; single-column FK on database.
ATTACK PATH: Malicious guardian or staff links a student from another tenant to their user account -> Accesses student records via portal.
IMPACT: Unauthorized access to another tenant's student data via guardian portal.
REMEDIATION REQUIRED: Enforce tenant ownership check on santriId prior to relationship creation; migrate to composite FK.
REGRESSION RISK: Low.
```

```text
FINDING ID: SEC-FINDING-09
SEVERITY: HIGH
AFFECTED COMPONENT: Client Storage (Zustand & localStorage)
OBSERVED BEHAVIOR: Operational data (curriculum, canteen, assessments) stored in global unpartitioned localStorage keys. Logout does not clear storage.
EXPECTED BEHAVIOR: Storage keys must be tenant-prefixed (e.g. mahad_${tenantId}_curriculum); logout must clear all tenant storage.
ROOT CAUSE: Client stores lacked multi-tenant awareness and lifecycle cleanup hooks.
ATTACK PATH: User A logs out on shared device -> User B logs in -> User B sees User A's cached operational records.
IMPACT: Client-side data leakage on shared devices and native mobile apps.
REMEDIATION REQUIRED: Namespace all browser storage keys with active tenant ID; implement comprehensive storage wipe on logout.
REGRESSION RISK: Low.
```

```text
FINDING ID: SEC-FINDING-10
SEVERITY: MEDIUM
AFFECTED COMPONENT: Database Catalog & Application Services (Guru Domain)
OBSERVED BEHAVIOR: guru table and related tables (teacher_assignments, kelas, asrama) lack composite foreign keys (tenant_id, guru_id).
EXPECTED BEHAVIOR: All guru references must enforce composite FKs to prevent assigning teachers across institutions.
ROOT CAUSE: Legacy text fields (guru_name, wali_kelas, musyrif) used instead of normalized composite relations.
ATTACK PATH: Staff in Tenant A selects guru_id from Tenant B in teacher assignment API -> Database commits invalid cross-tenant link.
IMPACT: Inconsistent academic reporting and schedule leakage across pesantren.
REMEDIATION REQUIRED: Add composite unique (tenant_id, id) to guru; convert teacherAssignments to composite foreign keys.
REGRESSION RISK: Medium (requires data schema migration).
```

---

## 25. Root Cause Analysis

The root cause of these pervasive isolation gaps is architectural and evolutionary:

```text
                      EVOLUTIONARY ARCHITECTURE MISMATCH
                                      │
          Phase 1: Single-Pondok Prototype (Legacy Os_Darta)
          - Flat tables (santri, guru, users) without tenancy
          - Plain IDs, single-column keys, direct localStorage caching
                                      │
                                      ▼
          Phase 2: SaaS Multi-Tenant Transition (PWA Focus)
          - Multi-tenancy introduced via Subdomain routing (proxy.ts)
          - Assumed PWA Hostname = Immutable Security Boundary
          - New tables received tenant_id; legacy tables left un-tenantized
                                      │
                                      ▼
          Phase 3: Enterprise & Native Mobile Benchmark (Current)
          - Single native app + shared API invalidates hostname routing
          - Database superuser connections bypass partial RLS
          - Client-side stores leak across logins on shared hardware
```

The system failed to enforce **Zero-Trust Multi-Tenancy**:
1. **Never Trust the Client for Tenancy**: Tenancy must never come from client headers, client bodies, or browser `localStorage`.
2. **Never Trust the Hostname as a Security Boundary**: The network routing layer is distinct from the authorization layer.
3. **Defense in Depth**: Relational composite keys must exist at the database engine level so that even if application logic fails, PostgreSQL kernel constraints physically prevent cross-tenant foreign key linking.

---

## 26. Regression Risks of Remediation

Remediating these findings introduces specific architectural regression risks that must be managed:

1. **Lock Contention & Migration Risk**: Adding `tenant_id NOT NULL` and composite unique constraints to `public.santri` and `public.guru` requires table rewrites and exclusive locks. In production, this can cause downtime if historical records lack authoritative tenant mapping.
2. **Breakage of Legacy API Endpoints**: Enforcing strict `x-tenant-id` derivation and rejecting client body `tenantId` will immediately break POS terminals, RFID readers, and mobile clients relying on current payloads.
3. **Session Parameter Overhead**: Running every query inside `withTenantTransaction` (executing `SET LOCAL app.current_tenant_id`) introduces round-trip transaction overhead on database connection poolers.
4. **False-Positive Authorization Failures**: Users holding roles in multiple pesantren may experience permission denials if the active tenant context is not seamlessly switched and synchronized with Supabase Auth tokens.

---

## 27. Required Remediation Plan

Before any database migrations or new feature packages (including PSB and Alumni) are authorized, the following remediation roadmap must be executed under dedicated work packages:

### Phase 1: Identity & Context Architecture Hardening (`WP-AUTHZ-TENANT-REMEDIATION-001`)
* Refactor `src/proxy.ts` to inspect user session cookies, query `user_tenant_memberships`, and establish `x-tenant-id` **only** if an active membership exists.
* In native mobile / direct API flows, require an explicit tenant selection handshake that issues a cryptographically verified tenant session token.
* Purge all client-side `localStorage` tenant getters in `src/lib/db/services/tenant-service.ts`.

### Phase 2: Database Catalog & RLS Hardening (`WP-CORE-DB-ISOLATION-001`)
* Provision a dedicated non-superuser PostgreSQL role for application queries (`app_runtime_user`).
* Execute `ALTER TABLE ... FORCE ROW LEVEL SECURITY` across all tenant-owned tables.
* Execute a dedicated prerequisite migration to tenantize `public.santri`:
  * Add `tenant_id text NOT NULL REFERENCES tenants(id)`.
  * Add `CONSTRAINT uq_santri_tenant_id UNIQUE (tenant_id, id)`.
  * Enable and force RLS on `public.santri`.
* Repeat composite key hardening on `public.guru` (`UNIQUE (tenant_id, id)`).

### Phase 3: API & POS Boundary Hardening (`WP-API-ISOLATION-001`)
* Deprecate `body.tenantId` on `/api/canteen/pay`, `/api/gate/scan-in`, and `/api/gate/scan-out`.
* Implement device authentication (API key / mTLS / signed token) tying hardware terminals to a verified tenant.
* Enforce tenant verification on all domain service methods (`santriServerService`, `wali-service`).

### Phase 4: Storage & Client State Hardening (`WP-STORAGE-STATE-ISOLATION-001`)
* Replace public Google Drive sharing (`role: reader, type: anyone`) with authenticated server proxy streaming or signed, time-limited private URLs.
* Implement tenant subfolder structures within cloud storage.
* Namespace all client-side browser storage keys with active `tenant_id`; hook `useAuthStore.logout()` to execute a complete storage wipe.

---

## 28. Blockers

The following items are **CRITICAL / HIGH SEVERITY BLOCKERS** that strictly prohibit declaring implementation readiness:

1. **BLOCKER-01 (CRITICAL)**: `src/proxy.ts` stamps unverified `x-tenant-id` based on client request URLs without validating user membership in target tenant.
2. **BLOCKER-02 (CRITICAL)**: PostgreSQL application connection connects as database superuser, bypassing Row-Level Security on all tables due to missing `FORCE ROW LEVEL SECURITY`.
3. **BLOCKER-03 (CRITICAL)**: `public.santri` in live database physically lacks `tenant_id`, has 0 foreign keys, and has RLS disabled (`rowsecurity = false`).
4. **BLOCKER-04 (CRITICAL)**: `src/lib/db/services/tenant-service.ts` allows client-controlled tenant spoofing via browser `localStorage`.
5. **BLOCKER-05 (CRITICAL)**: `/api/canteen/pay` and `/api/gate/scan-in` trust client-supplied `tenantId` in request bodies.
6. **BLOCKER-06 (CRITICAL)**: Google Drive file storage makes sensitive student and medical documents publicly readable to anyone with the URL without tenant isolation.
7. **BLOCKER-07 (HIGH)**: `santriServerService.handleUpdate()` queries records by `santri.id` alone without tenant scoping.
8. **BLOCKER-08 (HIGH)**: `linkWaliToSantri()` permits linking guardians to students belonging to another tenant.
9. **BLOCKER-09 (HIGH)**: Client stores persist unpartitioned operational data across user logouts on shared devices.
10. **BLOCKER-10 (HIGH)**: `guru` domain lacks composite unique constraints and composite foreign keys.

---

## 29. Non-Blockers

The following observations are classified as **MEDIUM / LOW / OBSERVATION** and do not block core architecture hardening:

1. **OBS-01 (MEDIUM)**: Identity consolidation saga (`identity_consolidation_ledgers`) does not enforce composite tenant foreign keys on `source_student_uid` and `target_wali_uid`.
2. **OBS-02 (MEDIUM)**: Global unique constraint on `public.users.phone` and `public.santri.nis` allows cross-tenant existence enumeration.
3. **OBS-03 (LOW)**: In-memory `demoDb` fallback in `useCollection.ts` serves prototype data during local development.
4. **OBS-04 (LOW)**: UI density preference in `density-store.ts` is unpartitioned (purely aesthetic preference).

---

## 30. Implementation Readiness Assessment

```text
================================================================================
FINAL IMPLEMENTATION READINESS ASSESSMENT:
NOT IMPLEMENTATION READY
================================================================================

RATIONALE:
The application was architected under the assumption of browser-based PWA hostname
separation. Under the mandatory enterprise benchmark of a Single Native Mobile
Application with a shared login surface, the existing tenant isolation controls
fail at the proxy, service, storage, and database layers.

CRITICAL BLOCKERS REMAINING: 6
HIGH BLOCKERS REMAINING: 4
TOTAL BLOCKERS: 10

CERTIFICATION:
DO NOT DEPLOY TO PRODUCTION.
DO NOT EXECUTE PSB/ALUMNI MIGRATION.
DO NOT PROCEED TO FEATURE IMPLEMENTATION.
```

---

## 31. Evidence / File References

The findings in this audit report are established upon direct inspection of the following repository source files:

1. **`src/proxy.ts`**: Lines 58–89 (`extractTenantSlug`), lines 95–98 (`resolvedTenantId`), lines 140–143 (unverified header decoration).
2. **`src/core/lib/tenant/context.ts`**: Lines 20–35 (`getTenantContext` reading unverified headers).
3. **`src/lib/tenant/context.ts`**: Lines 44–60 (`getTenantContext` reading `x-tenant-slug`).
4. **`src/lib/db/services/tenant-service.ts`**: Lines 17–27 (`getActiveTenantId` reading `localStorage`), lines 46–51 (`withTenant` client wrapper).
5. **`src/lib/db/index.ts`**: Lines 5–8 (PostgreSQL superuser connection string without non-superuser privilege separation).
6. **`drizzle/0002_tenant_rls_hardening.sql`**: Lines 98–112 (RLS policies missing `FORCE ROW LEVEL SECURITY`).
7. **`docs/architecture/WP-PSB-ALUMNI-GATE-9-FAILURE-RECONCILIATION-001.md`**: Section 4 (Empirical proof that `public.santri` physically lacks `tenant_id`).
8. **`src/modules/santri/services/santri-server.ts`**: Line 31 (`db.select().from(santri).where(eq(santri.id, id))` unscoped query).
9. **`src/modules/santri/services/santri-core-service.ts`**: Lines 33–42 (NIS uniqueness check), lines 90–108 (Update profile).
10. **`src/modules/wali/services/wali-service.ts`**: Lines 40–95 (`findOrCreateWaliAccount`), lines 150–190 (`linkWaliToSantri` missing student tenant check).
11. **`src/app/api/db/query/route.ts`**: Lines 68–149 (`GET` collection query), lines 151–246 (`POST` universal mutation).
12. **`src/app/api/canteen/pay/route.ts`**: Lines 21–23 (Client-supplied `body.tenantId` handling).
13. **`src/app/api/gate/scan-in/route.ts`**: Lines 13–14 (Client-supplied `body.tenantId` handling).
14. **`src/lib/gdrive/service.ts`**: Lines 55–66 (`role: reader, type: anyone` public Google Drive permissions).
15. **`src/store/auth-store.ts`**: Lines 125–140 (`logout` failing to clear `localStorage`).
16. **`src/lib/store/curriculum-store.ts`**: Lines 74–92 (Unpartitioned global `localStorage` keys).
17. **`src/lib/store/canteen-store.ts`**: Lines 57–92 (Unpartitioned global `localStorage` keys).
18. **`docs/architecture/WP-PSB-ALUMNI-DDL-DRAFT-001.sql`**: Lines 3141, 3206–3207 (Candidate DDL constraints).

---

## 32. Governance Status

```text
AUDIT WORK PACKAGE:
WP-MULTITENANT-ISOLATION-AUDIT-001

STATUS:
AUDIT COMPLETE / DELIVERABLE FILED

RESULT:
10 ARCHITECTURAL BLOCKERS IDENTIFIED

IMPLEMENTATION READINESS:
NOT READY (HARD LOCK)

DATABASE STATE:
UNCHANGED (READ-ONLY)

APPLICATION CODE:
UNCHANGED (READ-ONLY)

NEXT STEP:
PRODUCT OWNER / LEAD ARCHITECT REVIEW OF AUDIT FINDINGS
AUTHORIZATION OF REMEDIATION WORK PACKAGE (WP-AUTHZ-TENANT-REMEDIATION-001)
```
