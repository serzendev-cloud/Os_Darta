# WP-TENANT-HARD-DELETE-RUNTIME-PLAN-REMEDIATION-001 REPORT

## A. Root Cause
Pada pengujian runtime hard-delete terhadap tenant `RTV02` (`t_1789178874071_8vsju`), eksekusi `planHardDelete()` mengalami kegagalan fatal dengan error PostgreSQL:
`column asrama.tenant_id does not exist`

Penyelidikan forensik membuktikan adanya *schema drift*:
1. `src/lib/db/schema.ts` mendefinisikan kolom `tenantId: text('tenant_id')` pada tabel legacy `asrama`, `kamar`, `kelas`, dan `mapel`.
2. Pada physical PostgreSQL database, tabel-tabel legacy tersebut tidak memiliki kolom `tenant_id`.
3. `TenantHardDeleteService` dan UI dashboard mengasumsikan keempat entitas tersebut memiliki physical `tenant_id` dan mencoba melakukan query `count(*)` serta `tx.delete()` berbasis `tenantId`.
4. Unit/contract tests sebelumnya menggunakan mock DB yang menyembunyikan ketiadaan kolom fisik tersebut.

---

## B. Changed Files
1. `src/lib/db/schema.ts`:
   - Menghapus kolom `tenantId` pada definisi tabel legacy `asrama`, `kamar`, `kelas`, dan `mapel`.
2. `src/modules/saas/services/tenant-hard-delete-service.ts`:
   - Menghapus import dan query dependency terhadap `asrama`, `kamar`, `kelas`, dan `mapel` pada `planHardDelete()`.
   - Menghapus klausa `tx.delete()` berbasis `tenantId` terhadap tabel legacy pada `executeHardDelete()`.
   - Menyesuaikan interface `DependentRecordsSummary` dan `HardDeleteExecutionResult`.
3. `src/app/dashboard/saas/tenants/page.tsx`:
   - Memperbarui interface `HardDeletePlan` dan `deleteExecutionResult`.
   - Menyelaraskan UI Impact Grid untuk menampilkan entitas verified tenant-scoped: *Santri*, *Struktur Akademik*, *Kalender Akademik*, *Pengaturan & Akses*.
   - Menambahkan status jujur: *Data Legacy Global (Asrama, Kamar, Kelas, Mapel): Excluded / Not tenant-scoped*.
4. `tests/contracts/tenant-hard-delete-lifecycle.contract.test.ts`:
   - Menyesuaikan mock DB call threshold.
   - Menambahkan TEST 9 (verifikasi bahwa legacy tables tidak di-query/di-delete).
   - Menambahkan TEST 10 (verifikasi schema contract bahwa legacy tables tidak memiliki `tenantId`).
   - Menambahkan TEST 11 (verifikasi schema contract bahwa active tenant-scoped tables memiliki `tenantId`).
5. `tests/contracts/tenant-hard-delete-real-db.contract.test.ts`:
   - Menambahkan integration test langsung terhadap PostgreSQL live database untuk membuktikan eksekusi generated SQL `planHardDelete` pada `RTV02` bebas dari runtime schema error.

---

## C. Legacy Tables Removed From Hard Delete
Tabel-tabel berikut telah sepenuhnya dihapus dari query dan eksekusi Hard Delete Engine karena tidak memiliki physical `tenant_id`:
1. `asrama` (Global/legacy)
2. `kamar` (Global/legacy)
3. `kelas` (Global/legacy)
4. `mapel` (Global/legacy)

---

## D. Tenant-Scoped Tables Retained
Tabel-tabel verified yang tetap dipertahankan dan dihitung secara akurat dalam Hard Delete Engine:
1. `santri` (`tenant_id` terbukti ada)
2. `madrasah` (`tenant_id` terbukti ada)
3. `jenjang` (`tenant_id` terbukti ada)
4. `tingkat` (`tenant_id` terbukti ada)
5. `rombel` (`tenant_id` terbukti ada)
6. `academic_years` (`tenant_id` terbukti ada)
7. `academic_terms` (`tenant_id` terbukti ada)
8. `tenant_settings` (`tenant_id` terbukti ada)
9. `tenant_roles` (`tenant_id` terbukti ada)
10. `user_tenant_memberships` (`tenant_id` terbukti ada)
11. `tenants` (Core tenant identity)
12. `users` (Orphan identity purge kandidat yang diverifikasi bebas dari multi-tenant / platform roles)

---

## E. schema.ts Changes
Pada `src/lib/db/schema.ts`, kolom `tenantId` dihapus dari 4 tabel:
- `asrama`: definisi dikembalikan ke physical PostgreSQL schema (kolom: `id`, `nama`, `kapasitas`, `penanggungJawab`, `gender`, `keterangan`, `createdAt`, `updatedAt`).
- `kamar`: definisi dikembalikan ke physical PostgreSQL schema (kolom: `id`, `asramaId`, `nomorKamar`, `kapasitas`, `terisi`, `status`, `createdAt`, `updatedAt`).
- `kelas`: definisi dikembalikan ke physical PostgreSQL schema (kolom: `id`, `nama`, `tingkat`, `jurusan`, `waliKelasId`, `kapasitas`, `terisi`, `tahunAjaran`, `createdAt`, `updatedAt`).
- `mapel`: definisi dikembalikan ke physical PostgreSQL schema (kolom: `id`, `kode`, `nama`, `kategori`, `tingkat`, `jurusan`, `kkm`, `createdAt`, `updatedAt`).

---

## F. Repository Reference Audit
Pemeriksaan referensi di seluruh repository membuktikan:
- Tidak ada modul aplikasi aktif (`src/app`, `src/modules`, `src/lib/db/services`) yang mengandalkan `.tenantId` pada `asrama`, `kamar`, `kelas`, atau `mapel`.
- Satu-satunya referensi sebelum remediation hanya terdapat pada `TenantHardDeleteService` dan `schema.ts`.
- Zero broken references setelah remediation.

---

## G. Tests
- **Contract Test Suite**: `tests/contracts/tenant-hard-delete-lifecycle.contract.test.ts` (11/11 tests PASS).
- **Live Database Integration Test**: `tests/contracts/tenant-hard-delete-real-db.contract.test.ts` (1/1 test PASS, generated SQL terbukti valid terhadap PostgreSQL).
- **Full Test Suite**: 39 test files, 365 tests PASS (0 failures).
- **TypeScript Static Verification**: `npx tsc --noEmit` PASS (0 errors).
- **Next.js Production Build**: `npm run build` PASS (88/88 routes generated).

---

## H. Runtime Plan Verification
Eksekusi read-only `planHardDelete()` terhadap target tenant:
- **Tenant ID**: `t_1789178874071_8vsju`
- **Tenant Code**: `RTV02`
- **Tenant Name**: `Runtime Verification Tenant 002`
- **Status**: SUCCESS (200 OK)
- **Confirmation Code**: `DELETE-RTV02-rtv02-test`
- **Generated Plan Dependent Counts**:
  - Santri: 0
  - Madrasah: 0
  - Jenjang: 0
  - Tingkat: 0
  - Rombel: 0
  - Academic Years: 0
  - Academic Terms: 0
  - Settings: 1
  - Memberships: 1
  - Roles: 0
- **Affected Users**: 1 user (`rtv02.owner@test.id`), 1 purge candidate.
- **PostgreSQL Errors**: 0 (Error `column asrama.tenant_id does not exist` tereliminasi sepenuhnya).

---

## I. RTV02 Safety Verification
- **Existence**: `t_1789178874071_8vsju` masih utuh di database.
- **Status**: `aktif` (unchanged).
- **Memberships**: 1 membership utuh.
- **User Account**: `rtv02.owner@test.id` utuh.

---

## J. SR2601 Safety Verification
- **Existence**: `SR2601` (`t_1790171191747_pyv9n`) intact.
- **Status**: `aktif` (unchanged).
- **Protection**: Hardcoded protection fail-closed intact.

---

## K. Counter Verification
- **Table**: `tenant_code_counters`
- **Year**: `2026`
- **last_sequence**: `1` (UNCHANGED).

---

## L. Database Mutation Count
**0** (Tidak ada operasi INSERT, UPDATE, DELETE, ALTER TABLE, DROP TABLE, ataupun migration database).

---

## M. Auth Mutation Count
**0** (Tidak ada pemanggilan `supabaseAdminClient.auth.admin.deleteUser` atau mutasi Supabase Auth).

---

## N. Git Status
- Working tree clean & modified files verified.
- **NO COMMIT**, **NO PUSH** (Menunggu review dan otorisasi Product Owner).

---

## O. Remaining Risks
- Data pada tabel legacy (`asrama`, `kamar`, `kelas`, `mapel`) saat ini tidak memiliki batasan tenant (`tenant_id`). Data tersebut bersifat global dan tidak akan dimusnahkan saat tenant dihapus. Jika institusi di masa depan membutuhkan partisi per-tenant untuk asrama/kamar/kelas/mapel, hal tersebut harus dirancang melalui WP terpisah dengan skema migrasi dan relasi yang jelas.
- Operasi hard-delete destruktif terhadap database saat ini tetap ditahan (fail-closed) hingga otorisasi PO diberikan.
