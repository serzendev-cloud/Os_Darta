# WORK PACKAGE FORENSIC REPORT
# HARD DELETE PLAN FAILURE ON ASRAMA DEPENDENCY QUERY

**Work Package Identifier**: `WP-TENANT-HARD-DELETE-RUNTIME-PLAN-FAILURE-FORENSIC-001`  
**Title**: Forensic Audit — Hard Delete Plan Failure on Asrama Dependency Query  
**Mode**: READ-ONLY RUNTIME / CODE / DATABASE FORENSIC AUDIT  
**Date**: 2026-09-24  
**Author**: Senior SaaS Architect, Database Forensic Auditor & Lifecycle Security Specialist  
**Status**: AUDIT COMPLETE (ROOT CAUSE IDENTIFIED — ZERO MUTATIONS)

---

## A. Incident Summary

During manual testing by the Product Owner on `/dashboard/saas/tenants` against disposable verification tenant **`RTV02`** (`Runtime Verification Tenant 002`, ID: `t_1789178874071_8vsju`), clicking the **"Hard Delete"** button failed at the initial **Plan / Impact Analysis** phase prior to confirmation input and prior to any database mutation.

The UI displayed:
```text
Terjadi Kesalahan:
Failed query: select count(*) from "asrama" where "asrama"."tenant_id" = $1
params: t_1789178874071_8vsju
```

---

## B. Runtime Environment

- **Target Tenant**: `RTV02` (`t_1789178874071_8vsju`, Slug: `rtv02`)
- **Vercel Preview Commit**: `b32af7f8ee3017a5bebb0897e97f0694e968df77` (`b32af7f`)
- **Database**: Remote Supabase PostgreSQL Database (Production/Preview pooler)

---

## C. Exact Failing Query

```sql
SELECT count(*) 
FROM "asrama" 
WHERE "asrama"."tenant_id" = 't_1789178874071_8vsju';
```

---

## D. Full PostgreSQL Server Error

Executing the exact query directly on the live database yields:
```text
DrizzleQueryError: Failed query: SELECT count(*) FROM "asrama" WHERE "asrama"."tenant_id" = 't_1789178874071_8vsju'
Cause: column asrama.tenant_id does not exist
```

---

## E. Code Trace

1. **API Endpoint**: [`/api/saas/tenants/[id]/hard-delete/route.ts`](file:///e:/Projects/Os_Darta/src/app/api/saas/tenants/%5Bid%5D/hard-delete/route.ts) lines 66–70 invokes:
   `await tenantHardDeleteService.planHardDelete(id, ...)`
2. **Service Engine**: [`src/modules/saas/services/tenant-hard-delete-service.ts`](file:///e:/Projects/Os_Darta/src/modules/saas/services/tenant-hard-delete-service.ts#L244) lines 240–255 executes:
   ```typescript
   const [
     membershipCountRes,
     rolesCountRes,
     santriCountRes,
     asramaCountRes, // <--- FAILS HERE: asrama.tenant_id does not exist in DB
     kamarCountRes,  // <--- WOULD ALSO FAIL: kamar.tenant_id does not exist in DB
     kelasCountRes,  // <--- WOULD ALSO FAIL: kelas.tenant_id does not exist in DB
     mapelCountRes,  // <--- WOULD ALSO FAIL: mapel.tenant_id does not exist in DB
     ...
   ] = await Promise.all([...]);
   ```
3. **Execution Block**: Lines 429–440 in `executeHardDelete` would also fail during transactional execution:
   ```typescript
   await tx.delete(asrama).where(eq(asrama.tenantId, cleanTenantId));
   await tx.delete(kamar).where(eq(kamar.tenantId, cleanTenantId));
   await tx.delete(kelas).where(eq(kelas.tenantId, cleanTenantId));
   await tx.delete(mapel).where(eq(mapel.tenantId, cleanTenantId));
   ```

---

## F. Database Evidence & Table Column Matrix

A complete live inspection of all 40 public tables on the remote PostgreSQL database revealed the following state:

| Table Name | Defined in `schema.ts` | Exists in Live PostgreSQL | Physical `tenant_id` in DB | Query `tenant_id = $1` Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`tenants`** | YES | **YES** | NO (`id` is PK) | N/A | Core tenant table (`code = VARCHAR(10)`) |
| **`tenant_settings`** | YES | **YES** | **YES** (`text`) | **SUCCESS** | Configured per tenant |
| **`tenant_roles`** | YES | **YES** | **YES** (`text`) | **SUCCESS** | Roles per tenant |
| **`user_tenant_memberships`** | YES | **YES** | **YES** (`text`) | **SUCCESS** | Memberships per tenant |
| **`users`** | YES | **YES** | **YES** (`text`) | **SUCCESS** | Primary user identity table |
| **`santri`** | YES | **YES** | **YES** (`text`) | **SUCCESS** | Tenantized in `0003_core_santri_tenantization.sql` |
| **`academic_years`** | YES | **YES** | **YES** (`text`) | **SUCCESS** | Tenantized in `academic_workspace.ts` |
| **`academic_terms`** | YES | **YES** | **YES** (`text`) | **SUCCESS** | Tenantized in `academic_workspace.ts` |
| **`madrasah`** | YES | **YES** | **YES** (`text`) | **SUCCESS** | Tenantized in `academic_structure.ts` |
| **`jenjang`** | YES | **YES** | **YES** (`text`) | **SUCCESS** | Tenantized in `academic_structure.ts` |
| **`tingkat`** | YES | **YES** | **YES** (`text`) | **SUCCESS** | Tenantized in `academic_structure.ts` |
| **`rombel`** | YES | **YES** | **YES** (`text`) | **SUCCESS** | Tenantized in `academic_structure.ts` |
| **`audit_logs`** | YES | **YES** | **YES** (`text`) | **SUCCESS** | Persisted audit table |
| **`asrama`** | **YES** (with `tenant_id`) | **YES** | ❌ **NO** | 💥 **FAILED (Missing Column)** | Legacy prototype table — Never tenantized via DDL |
| **`kamar`** | **YES** (with `tenant_id`) | **YES** | ❌ **NO** | 💥 **FAILED (Missing Column)** | Legacy prototype table — Never tenantized via DDL |
| **`kelas`** | **YES** (with `tenant_id`) | **YES** | ❌ **NO** | 💥 **FAILED (Missing Column)** | Legacy prototype table — Superseded by `academic_structure` |
| **`mapel`** | **YES** (with `tenant_id`) | **YES** | ❌ **NO** | 💥 **FAILED (Missing Column)** | Legacy prototype table — Never tenantized via DDL |

---

## G. Migration & Historical Schema Analysis

1. In early development, `asrama`, `kamar`, `kelas`, and `mapel` were created in PostgreSQL without `tenant_id`.
2. When multi-tenant isolation was established:
   - **`WP-02`** (`0003_core_santri_tenantization.sql`) tenantized `santri` (`santri.tenant_id`).
   - Academic modules were modernized with native multi-tenant tables: `madrasah`, `jenjang`, `tingkat`, `rombel`, `academic_years`, `academic_terms`.
3. In `src/lib/db/schema.ts`, `tenantId: text('tenant_id').default('default').notNull()` was added to TypeScript types for `asrama`, `kamar`, `kelas`, `mapel`, **but no database migration was ever generated or applied to add physical `tenant_id` columns to those tables in PostgreSQL**.
4. Contract tests in `tenant-hard-delete-lifecycle.contract.test.ts` passed because they executed against a Vitest mock object (`createMockDb`), which masked the missing physical columns.

---

## H. Root Cause

### **CLASSIFICATION: BLOCKER — Schema Drift & Engine Assumption**

The Hard-Delete Lifecycle Engine attempted to query and delete from `asrama`, `kamar`, `kelas`, and `mapel` using a `tenant_id` column that exists **only in Drizzle TypeScript definitions**, but **does not exist physically in the live PostgreSQL database**.

---

## I. Impact & Safety Status

- **Database Mutations**: **`0`**
- **Auth User Mutations**: **`0`**
- **Tenant Deletions**: **`0`**
- **`RTV02` State**: **100% INTACT & ACTIVE** (`t_1789178874071_8vsju`, 1 membership, 0 santri).
- **`SR2601` State**: **100% UNTOUCHED** (`Ponpes Darunnajah`).
- **`RTV01` State**: **100% UNTOUCHED** (`t_1789172137858_9g7lm`).
- **`tenant_code_counters`**: **100% UNTOUCHED** (`last_sequence = 1`).

---

## J. Answers to Explicit Audit Questions

1. **Mengapa Plan RTV02 gagal?**  
   Karena query `SELECT count(*) FROM asrama WHERE tenant_id = $1` gagal di PostgreSQL dengan error `column asrama.tenant_id does not exist`.
2. **Apakah table `asrama` ada?**  
   **Ya**, tabel fisik `public.asrama` ada di PostgreSQL.
3. **Apakah `tenant_id` ada?**  
   **Tidak**, kolom `tenant_id` tidak ada pada tabel `asrama`, `kamar`, `kelas`, dan `mapel`.
4. **Apakah query-nya valid?**  
   Valid secara Drizzle TypeScript, tetapi **tidak valid secara DDL PostgreSQL**.
5. **Apakah migration/schema drift?**  
   **Ya**. TypeScript schema (`schema.ts`) tidak selaras dengan DDL fisik di database live.
6. **Apakah RLS/permission?**  
   **Bukan**. Error bukan karena hak akses atau RLS, melainkan ketiadaan kolom fisik.
7. **Apakah bug pada hard-delete engine?**  
   **Ya**. Engine mereferensikan kolom yang belum ada di database fisik, dan unit tests sebelumnya menggunakan mock in-memory.
8. **Apakah RTV02 masih aman?**  
   **Ya, 100% aman dan utuh**. Gagal pada tahap awal read-only planning sebelum transaksi dimulai.
9. **Apa fix yang diperlukan?**  
   Menyelaraskan `TenantHardDeleteService` dan `schema.ts` dengan schema fisik yang benar-benar aktif dan tenantized di database (menghapus dependensi count/delete pada `asrama`, `kamar`, `kelas`, `mapel` yang belum ditenantisasi, atau menambahkan migration resmi jika tabel tersebut akan dipertahankan).
10. **Apakah Product Owner BOLEH mencoba Hard Delete lagi saat ini?**  
    **Belum boleh**, sampai remediation WP diterapkan untuk memperbaiki query dependency.

---

## K. Recommended Remediation Strategy (For Next WP)

In the upcoming remediation work package:
1. Update `TenantHardDeleteService.ts` to query only the genuine, verified tenant-scoped tables:
   - `santri`
   - `madrasah`, `jenjang`, `tingkat`, `rombel`
   - `academic_years`, `academic_terms`
   - `tenant_settings`
   - `tenant_roles`
   - `user_tenant_memberships`
2. Remove non-existent `asrama`, `kamar`, `kelas`, `mapel` `tenant_id` references from `planHardDelete()` and `executeHardDelete()`.
3. Update `src/lib/db/schema.ts` to reflect the true physical state of legacy tables.
4. Run live integration test against `RTV02` plan endpoint.
