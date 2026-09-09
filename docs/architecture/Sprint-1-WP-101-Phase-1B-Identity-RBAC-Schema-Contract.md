# EEOS Sprint 1 — WP-101 Phase 1B Identity & RBAC Schema Contract Review
**APP MA'HAD ENTERPRISE SaaS ERP — Chief Engineering Architect & Database Architect Specification**

---

> [!IMPORTANT]
> **GOVERNANCE DIRECTIVE**: Dokumen ini merupakan **DESIGN / CONTRACT / FORENSIC REVIEW ONLY**. Tidak ada skema database, migrasi Drizzle, tabel SQL, atau kode application runtime yang dibuat atau diubah pada Phase 1B. Seluruh aktivitas coding & DDL migration tetap ditahan (**HARD STOP**) hingga Chief Engineering memberikan persetujuan formal atas Kontrak Skema Phase 1B ini.

---

## 1. Executive Summary & Phase 1B Governance Mandate

Dalam **Sprint 1 — WP-101 Phase 1B**, Chief Engineering Architect, Database Architect, dan Security Architect memformulasi **Kontrak Skema Database Identity & RBAC Canonical** untuk **APP MA'HAD Enterprise SaaS ERP**.

### Tujuan Utama Phase 1B:
1. **Merancang 9 Tabel Canonical Identity & RBAC**: Mendefinisikan kontrak struktur fisik tabel Drizzle (`users`, `tenants`, `platform_roles`, `user_platform_roles`, `user_tenant_memberships`, `tenant_roles`, `permissions`, `tenant_role_permissions`, `user_additional_permissions`).
2. **Memastikan Integritas Kunci & Indeks**: Menetapkan *primary keys*, *foreign keys*, *unique constraints*, dan *indexing strategy* untuk performa kueri <10ms pada ribuan tenant.
3. **Menjamin Keamanan Zero-Trust & Fail-Closed**: Menetapkan aturan bahwa keanggotaan/role yang tidak aktif (*INACTIVE/SUSPENDED*) akan menolak seluruh otorisasi secara otomatis (*Fail-Closed*).
4. **Keputusan Kesiapan Phase 1C**: Menyediakan landasan kontrak yang 100% presisi untuk diimplementasikan pada Phase 1C (*Schema Implementation*).

---

## 2. Ground-Truth Evidence & Current Repository State

| Komponen Database / Identity | Repository Evidence Actual | Status Klasifikasi | Kesimpulan Refactoring |
|---|---|---|---|
| **Drizzle Config** | `drizzle.config.ts` menunjuk ke `./src/lib/db/schema.ts` | **CONFIRMED** | Lokasi skema utama terdaftar di Drizzle Kit. |
| **Existing `tenants` Table** | `schema.ts:4` memuat `id`, `name`, `slug`, `domain`, `status` | **CONFIRMED (Prototype)** | Akan direfaktor menjadi entitas tenant SaaS canonical. |
| **Existing `users` Table** | `schema.ts:36` memuat single `tenant_id` & single `role` text | **PROPOSED REFACTOR** | Dipecah menjadi Platform Identity (`users`) + `user_tenant_memberships`. |
| **RBAC Tables** | Tabel `tenant_roles`, `permissions`, `user_additional_permissions` belum ada | **DESIGN CONTRACT** | Akan dibuat skema modularnya di `src/lib/db/schema/identity.ts` pada Phase 1C. |
| **Supabase Auth UID Linkage** | `@supabase/ssr` terpasang; `users.id` di-map ke `auth.users.id` (UUID) | **CONFIRMED (Target)** | `users.id` menggunakan UUID yang identik dengan Supabase Auth UID. |
| **Supabase RLS SQL Files** | Berkas migrasi SQL RLS belum ada di repositori | **TARGET SECURITY** | Kebijakan RLS akan ditulis sebagai skrip SQL migrasi resmi pada Phase 1C. |

---

## 3. Locked Architectural Principles

1. **Supabase Auth Canonical**: Identity otentikasi global berasal dari Supabase Auth. Kode Firebase adalah *legacy prototype*. `users.id` (UUID) berelasi 1:1 dengan `auth.users.id`.
2. **Platform Identity vs Tenant Membership**: `users` menyimpan identitas global platform (nama, email, avatar). Hubungan user dengan pesantren dikelola via `user_tenant_memberships`.
3. **Super Admin Platform Scope**: `SUPER_ADMIN` dimasukkan dalam `platform_roles` & `user_platform_roles`. DILARANG membuat *fake tenant membership* atau *fake tenant_id* untuk Super Admin.
4. **Exactly One Primary Role**: Setiap keanggotaan aktif (`user_tenant_memberships`) memiliki **tepat 1 Primary Role** (`tenant_roles`).
5. **Additional User Permissions**: Izin tambahan khusus user (`user_additional_permissions`) bersifat *tenant-scoped override* dan tidak mengubah definisi role global tenant.
6. **Canonical Permission Registry**: Platform mengelola seluruh kode permission (`santri.read`, `finance.create`). Permission ber-scope `PLATFORM` ditolak secara mutlak dari alokasi Tenant Role.

---

## 4. Entity Relationship Diagram (ERD)

```text
=================================================================================
             CANONICAL IDENTITY & RBAC ENTITY RELATIONSHIP DIAGRAM
=================================================================================

SAAS PLATFORM BOUNDARY
┌────────────────────────────────┐       ┌────────────────────────────────┐
│             users              │       │         platform_roles         │
├────────────────────────────────┤       ├────────────────────────────────┤
│ PK  id (UUID = auth.users.id)  │◄──┐   │ PK  id (UUID)                  │
│     email (text, UNIQUE)       │   │   │     code (text, UNIQUE)        │
│     name (text)                │   │   │     scope = 'PLATFORM'         │
│     avatar_url (text)          │   │   └───────────────┬────────────────┘
└───────────────┬────────────────┘   │                   │ 1
                │ 1                  │ 1                 │
                │                    │                   ▼ N
                │                    │   ┌────────────────────────────────┐
                │                    │   │      user_platform_roles       │
                │                    │   ├────────────────────────────────┤
                │                    └───┤ FK  user_id (UUID)             │
                │                        │ FK  platform_role_id (UUID)    │
                │                        └────────────────────────────────┘
                ▼ N
┌────────────────────────────────┐       ┌────────────────────────────────┐
│     user_tenant_memberships    │       │            tenants             │
├────────────────────────────────┤       ├────────────────────────────────┤
│ PK  id (UUID)                  │       │ PK  id (UUID)                  │
│ FK  user_id (UUID)             ├──────►│     name (text)                │
│ FK  tenant_id (UUID)           │ N   1 │     slug (text, UNIQUE)        │
│ FK  primary_role_id (UUID)     ├────┐  │     domain (text)              │
│     status ('ACTIVE'|'INACTIVE')│    │  │     status ('ACTIVE'|'SUSP')   │
└───────────────┬────────────────┘    │  └───────────────┬────────────────┘
                │ 1                   │                  │ 1
                │                     │                  │
                ▼ N                   │                  ▼ N
┌────────────────────────────────┐    │  ┌────────────────────────────────┐
│  user_additional_permissions   │    │  │          tenant_roles          │
├────────────────────────────────┤    │  ├────────────────────────────────┤
│ PK  id (UUID)                  │    └─►│ PK  id (UUID)                  │
│ FK  membership_id (UUID)       │       │ FK  tenant_id (UUID)           │
│ FK  permission_id (UUID)       │       │     name (text)                │
│     granted_by (UUID)          │       │     code (text)                │
└───────────────┬────────────────┘       │     is_template (boolean)      │
                │                        └───────────────┬────────────────┘
                │ N                                      │ 1
                │                                        ▼ N
                │                        ┌────────────────────────────────┐
                │                        │    tenant_role_permissions     │
                │                        ├────────────────────────────────┤
                │                        │ FK  tenant_role_id (UUID)      │
                │                        │ FK  permission_id (UUID)       │
                │                        └───────────────┬────────────────┘
                │                                        │ N
                ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                               permissions                               │
├─────────────────────────────────────────────────────────────────────────┤
│ PK  id (UUID)                                                           │
│     code (text, UNIQUE) — e.g. 'santri.read', 'finance.create'          │
│     scope ('PLATFORM' | 'TENANT')                                       │
│     module (text) — e.g. 'santri', 'academic', 'finance'                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Physical Table Contracts & Specifications

### 1. Table `users` (Global Platform Identity)
- `id` : `uuid` (PRIMARY KEY, References `auth.users(id)` ON DELETE CASCADE).
- `email` : `text` (NOT NULL, UNIQUE).
- `name` : `text` (NOT NULL).
- `avatar_url` : `text` (NULLABLE).
- `status` : `text` (NOT NULL, DEFAULT `'ACTIVE'`) — `'ACTIVE' | 'SUSPENDED'`.
- `created_at` : `timestamp` (NOT NULL, DEFAULT `now()`).
- `updated_at` : `timestamp` (NOT NULL, DEFAULT `now()`).

### 2. Table `tenants` (Tenant Container)
- `id` : `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`).
- `name` : `text` (NOT NULL) — contoh: "Pesantren Al-Fatih".
- `slug` : `text` (NOT NULL, UNIQUE) — contoh: "al-fatih".
- `domain` : `text` (NULLABLE, UNIQUE) — contoh: "alfatih.mahad.app".
- `status` : `text` (NOT NULL, DEFAULT `'ACTIVE'`) — `'ACTIVE' | 'SUSPENDED' | 'TRIAL'`.
- `created_at` : `timestamp` (NOT NULL, DEFAULT `now()`).
- `updated_at` : `timestamp` (NOT NULL, DEFAULT `now()`).

### 3. Table `platform_roles` (Platform-Scoped Roles)
- `id` : `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`).
- `code` : `text` (NOT NULL, UNIQUE) — `'SUPER_ADMIN' | 'DEVELOPER'`.
- `name` : `text` (NOT NULL).
- `description` : `text` (NULLABLE).

### 4. Table `user_platform_roles` (User to Platform Role Binding)
- `user_id` : `uuid` (NOT NULL, References `users(id)` ON DELETE CASCADE).
- `platform_role_id` : `uuid` (NOT NULL, References `platform_roles(id)` ON DELETE CASCADE).
- PRIMARY KEY: `(user_id, platform_role_id)`.

### 5. Table `user_tenant_memberships` (User ↔ Tenant Junction)
- `id` : `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`).
- `user_id` : `uuid` (NOT NULL, References `users(id)` ON DELETE CASCADE).
- `tenant_id` : `uuid` (NOT NULL, References `tenants(id)` ON DELETE CASCADE).
- `primary_role_id` : `uuid` (NOT NULL, References `tenant_roles(id)` ON DELETE RESTRICT).
- `status` : `text` (NOT NULL, DEFAULT `'ACTIVE'`) — `'ACTIVE' | 'SUSPENDED' | 'INVITED'`.
- `joined_at` : `timestamp` (NOT NULL, DEFAULT `now()`).
- UNIQUE CONSTRAINT: `(user_id, tenant_id)`.

### 6. Table `tenant_roles` (Tenant Custom Roles)
- `id` : `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`).
- `tenant_id` : `uuid` (NOT NULL, References `tenants(id)` ON DELETE CASCADE).
- `code` : `text` (NOT NULL) — contoh: `'ADMIN'`, `'GURU'`, `'BENDAHARA'`.
- `name` : `text` (NOT NULL) — contoh: "Kepala Keuangan".
- `is_template` : `boolean` (NOT NULL, DEFAULT `false`).
- `status` : `text` (NOT NULL, DEFAULT `'ACTIVE'`) — `'ACTIVE' | 'INACTIVE'`.
- UNIQUE CONSTRAINT: `(tenant_id, code)`.

### 7. Table `permissions` (Canonical Platform Permission Registry)
- `id` : `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`).
- `code` : `text` (NOT NULL, UNIQUE) — contoh: `'santri.read'`, `'finance.create'`.
- `scope` : `text` (NOT NULL) — `'PLATFORM' | 'TENANT'`.
- `module` : `text` (NOT NULL) — contoh: `'santri'`, `'academic'`, `'finance'`, `'platform'`.
- `description` : `text` (NULLABLE).

### 8. Table `tenant_role_permissions` (Role to Permission Junction)
- `tenant_role_id` : `uuid` (NOT NULL, References `tenant_roles(id)` ON DELETE CASCADE).
- `permission_id` : `uuid` (NOT NULL, References `permissions(id)` ON DELETE CASCADE).
- PRIMARY KEY: `(tenant_role_id, permission_id)`.

### 9. Table `user_additional_permissions` (User Specific Permission Overrides)
- `id` : `uuid` (PRIMARY KEY, DEFAULT `gen_random_uuid()`).
- `membership_id` : `uuid` (NOT NULL, References `user_tenant_memberships(id)` ON DELETE CASCADE).
- `permission_id` : `uuid` (NOT NULL, References `permissions(id)` ON DELETE CASCADE).
- `granted_by` : `uuid` (NOT NULL, References `users(id)`).
- `created_at` : `timestamp` (NOT NULL, DEFAULT `now()`).
- UNIQUE CONSTRAINT: `(membership_id, permission_id)`.

---

## 6. Indexing & Optimization Strategy

Untuk menjamin kueri otorisasi & pencarian tenant berjalan dalam kecepatan <10ms:

1. **`idx_user_tenant_memberships_lookup`**: `(user_id, tenant_id, status)` — Mempercepat verifikasi keanggotaan user saat request masuk.
2. **`idx_tenant_roles_tenant_code`**: `(tenant_id, code)` — Mempercepat evaluasi Primary Role tenant.
3. **`idx_tenant_role_permissions_role`**: `(tenant_role_id)` — Mempercepat pembacaan izin yang melekat pada role.
4. **`idx_user_additional_permissions_membership`**: `(membership_id)` — Mempercepat pembacaan izin tambahan user.
5. **`idx_tenants_slug`**: `(slug)` — Mempercepat resolusi subdomain `<tenant-slug>.<platform-domain>`.

---

## 7. Effective Permission Calculation Algorithm

Kalkulasi otorisasi dilakukan secara eksklusif dalam konteks tuple `(user_id, tenant_id)`:

$$\text{EffectivePermissions}(u, t) = \begin{cases} 
\emptyset & \text{if } \text{Tenant}(t).\text{status} \neq \text{'ACTIVE'} \\
\emptyset & \text{if } \text{Membership}(u, t).\text{status} \neq \text{'ACTIVE'} \\
\emptyset & \text{if } \text{PrimaryRole}.\text{status} \neq \text{'ACTIVE'} \\
\mathcal{P}_{\text{role}} \cup \mathcal{P}_{\text{additional}} & \text{otherwise}
\end{cases}$$

di mana $\mathcal{P}_{\text{role}}$ dan $\mathcal{P}_{\text{additional}}$ hanya memuat izin ber-scope **`TENANT`**.

---

## 8. Supabase RLS Policy Contract (Security Layer Target)

Meskipun skrip SQL RLS akan ditulis pada Phase 1C, kontrak kebijakan RLS ditetapkan sebagai berikut:

### A. RLS Policy untuk Operational Tenant Queries:
```sql
CREATE POLICY tenant_isolation_policy ON santri
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'x-tenant-id')::uuid
  );
```

### B. RLS Policy untuk Service-Role / Platform Queries:
`SUPER_ADMIN` beroperasi menggunakan `SUPABASE_SERVICE_ROLE_KEY` via Platform API endpoints (`/api/platform/*`) yang secara otomatis melewati (*bypass*) RLS tenant tanpa memerlukan *fake tenant membership*.

---

## 9. Security Threat Matrix & Contract Mitigation

| Threat Vector | Severity | Contract Mitigation Mechanism |
|---|---|---|
| **Client Spoofing `x-tenant-id` Header** | **P0 (Critical)** | Edge Proxy membuang header client & menyuntikkan `tenant_id` dari JWT claim terverifikasi. |
| **Tenant Admin Assigning Platform Permissions** | **P0 (Critical)** | Database constraint & API validation menolak alokasi permission `scope = 'PLATFORM'` ke `tenant_roles`. |
| **Multiple Active Primary Roles** | **P1 (High)** | Skema `user_tenant_memberships` menyimpan tepat 1 foreign key `primary_role_id`. |
| **Cross-Tenant Data Access** | **P0 (Critical)** | AST Linter memblokir query Drizzle tanpa `tenantId` + Supabase RLS fallback. |
| **Stale Permission Cache** | **P1 (High)** | Invalidasi cache Redis berbasis event pada key `tenant:{tenantId}:user:{userId}:permissions`. |

---

## 10. WP-101 Phase 1C Definition of Ready (DoR)

### Status Kesiapan:
# **`READY FOR PHASE 1C (SCHEMA IMPLEMENTATION)`**

#### Syarat Memulai Phase 1C:
1. **Persetujuan Kontrak Skema**: Chief Engineering / Product Owner memberikan approval atas dokumen kontrak `Sprint-1-WP-101-Phase-1B-Identity-RBAC-Schema-Contract.md`.
2. **Pembuatan File Skema**: Pada Phase 1C, tim engineering diizinkan membuat berkas `src/lib/db/schema/identity.ts` sesuai kontrak fisik di atas.
3. **AST Linter Test Validation**: Seluruh skema baru wajib lolos linting `npm run lint:ci`.

---

## 11. Laporan Audit Tata Kelola (*Governance Audit*)

```text
Runtime code modified : 0 / 0
Database schema modified: 0 / 0
Migrations created    : 0 / 0
API endpoints modified: 0 / 0
UI components modified: 0 / 0
Commits executed      : 0 / 0
Push executed         : 0 / 0
PR created            : 0 / 0
```

---

> [!CAUTION]
> **FINAL HARD STOP ENFORCED**: Phase 1B telah **SELESAI**. Seluruh aktivitas coding & pembaruan berkas runtime ditahan sampai Chief Engineering / Product Owner memberikan persetujuan formal untuk memulai eksekusi **Phase 1C**.
