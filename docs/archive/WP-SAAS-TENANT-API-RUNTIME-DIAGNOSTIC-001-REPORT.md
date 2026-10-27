# WP-SAAS-TENANT-API-RUNTIME-DIAGNOSTIC-001 REPORT
# Runtime Forensic Audit: /api/saas/tenants & public.tenants
# Mode: READ-ONLY RUNTIME FORENSIC AUDIT (No Code Change, No DB Mutation, No Tenant Creation)

**Authoritative Baseline**: `docs/architecture/EEOS-PROJECT-JOURNEY-MAP.md`  
**Deployment SHA**: `bf045e14b82790529b3684081cb0b7c3cadf8a7e` (Short: `bf045e1`)  
**Deployment URL**: `https://os-darta-bqj3aqba0-serzen-dev.vercel.app`  
**Date**: 2026-09-22  

---

## 1. Executive Summary

Forensic audit runtime telah dilakukan secara *read-only* terhadap endpoint `/api/saas/tenants` dan halaman `/dashboard/saas/tenants/` pada deployment Vercel Preview terkini (`bf045e1`).

Akar penyebab (*root cause*) terbukti secara definitif melalui **live Vercel serverless runtime error logs**:
Pesan error di UI (`"Gagal mengambil data tenant dari database."`) berasal dari HTTP 500 `InternalServerError` di `src/app/api/saas/tenants/route.ts:92`. Error ini dilempar karena konfigurasi environment variable `DATABASE_URL` pada dashboard Vercel Preview mengarah ke hostname direct Supabase yang sudah tidak memiliki record DNS IPv4 (`db.vyinupvzqzfrveuxculh.supabase.co`), menghasilkan exception level kernel Node.js:
`getaddrinfo ENOTFOUND db.vyinupvzqzfrveuxculh.supabase.co`.

Sebaliknya, pengujian koneksi read-only menggunakan string koneksi **Supabase Connection Pooler** (`aws-0-ap-southeast-1.pooler.supabase.com:6543`, seperti yang tercantum di `.env.local`) berhasil 100% dan membuktikan bahwa **seluruh 6 data tenant di `public.tenants` tersedia lengkap dan sehat secara relasional**.

---

## 2. Audit 1 — Frontend (`src/app/dashboard/saas/tenants/page.tsx`)

- **Fetch Invocation**:
  ```typescript
  const res = await fetch('/api/saas/tenants');
  const json = await res.json();
  ```
- **HTTP Method**: GET (default browser fetch).
- **Headers**: Same-origin credentials / cookie session Supabase diteruskan secara otomatis oleh browser.
- **Handling**:
  - Jika `json.success === true`: `setTenants(json.data.tenants)`.
  - Jika `json.success === false && json.message`: `setFetchError(json.message)`.
- **UI Error Banner**:
  Baris 359-373 menampilkan banner alert berwarna merah muda (*rose*) jika `fetchError` terisi:
  ```tsx
  {fetchError && (
    <div className="mb-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>{fetchError}</span>
      </div>
      <button type="button" onClick={fetchTenants}>Coba Lagi</button>
    </div>
  )}
  ```
- **Temuan**: Teks yang dilihat pengguna (`"Gagal mengambil data tenant dari database."`) persis merupakan nilai `json.message` yang dikirimkan oleh backend API.

---

## 3. Audit 2 — API (`src/app/api/saas/tenants/route.ts`)

- **Authentication & Role Gate (Lines 58-74)**:
  ```typescript
  const userId = request.headers.get('x-user-id');
  const isSuperAdminHeader = request.headers.get('x-is-super-admin') === 'true';
  const userRole = (request.headers.get('x-user-role') || '').toUpperCase().replace(/\s+/g, '_');
  const isSuperAdmin = isSuperAdminHeader || userRole === 'SUPER_ADMIN' || userRole === 'DEVELOPER';

  if (!userId || !isSuperAdmin) {
    return NextResponse.json({
      success: false,
      error: 'Forbidden',
      message: 'Akses ditolak. Hanya Super Admin / Developer yang dapat melihat daftar tenant platform.',
    }, { status: 403 });
  }
  ```
- **Analisis Gate**:
  - Jika user belum login atau bukan Super Admin, API mengembalikan HTTP 403 dengan pesan `"Akses ditolak. Hanya Super Admin / Developer yang dapat melihat daftar tenant platform."`.
  - Karena pesan yang diterima UI adalah `"Gagal mengambil data tenant dari database."`, **Authorization Gate terbukti LULUS (PASS)**.
- **Database Invocation & Catch Block (Lines 76-96)**:
  ```typescript
  try {
    const tenantsList = await tenantProvisioningService.listActiveTenants();
    return NextResponse.json({ success: true, data: { tenants: tenantsList, total: tenantsList.length } });
  } catch (error: unknown) {
    console.error('[API /api/saas/tenants GET] Internal error:', error);
    return NextResponse.json({
      success: false,
      error: 'InternalServerError',
      message: 'Gagal mengambil data tenant dari database.',
    }, { status: 500 });
  }
  ```
- **Temuan**: Exception terjadi di dalam pemanggilan `tenantProvisioningService.listActiveTenants()`, memicu blok `catch` yang menghasilkan HTTP 500.

---

## 4. Audit 3 — Database Query Dependency & Schema Analysis

Fungsi `listActiveTenants` di `src/modules/saas/services/tenant-provisioning-service.ts:655-732` mengeksekusi runtutan query:
1. **Query Utama (`tenants`)**:
   `SELECT id, name, slug, code, domain, status, created_at FROM public.tenants ORDER BY created_at DESC;`
2. **Subquery 1 (`tenant_settings`)**:
   `SELECT login_subtitle FROM public.tenant_settings WHERE tenant_id = ? LIMIT 1;`
3. **Subquery 2 (`user_tenant_memberships` JOIN `users` JOIN `tenant_roles`)**:
   ```sql
   SELECT u.name, u.email, u.phone, u.status
   FROM public.user_tenant_memberships utm
   INNER JOIN public.users u ON utm.user_id = u.id
   INNER JOIN public.tenant_roles tr ON utm.primary_role_id = tr.id
   WHERE utm.tenant_id = ? AND tr.role_code = 'ADMIN'
   LIMIT 1;
   ```
- **Audit Skema Live Database (Supabase)**:
  - Tabel `public.tenants`: ADA (6 baris: `AUD01`, `PUB01`, `PRV03`, `RTV03`, `RTV02`, `RTV01`).
  - Tabel `public.tenant_settings`: ADA (5 baris konfigurasi institusi).
  - Tabel `public.user_tenant_memberships`: ADA (5 baris relasi admin tenant).
  - Tabel `public.tenant_roles`: ADA (5 baris role `ADMIN`).
  - Tabel `public.users`: ADA (13 baris identitas, termasuk akun Super Admin).
- **Temuan Query**: Seluruh tabel, kolom, relasi, dan tipe data di database Supabase Production 100% valid dan cocok dengan Drizzle ORM schema.

---

## 5. Audit 4 — Live Vercel Runtime Error Log (Bukti Kunci)

Inspeksi runtime logs terhadap deployment `https://os-darta-bqj3aqba0-serzen-dev.vercel.app` (commit `bf045e1`) via Vercel CLI menghasilkan log exception berikut:

```text
20:53:27.10  os-darta-bqj3aqba0-serzen-dev.vercel.app  error  λ GET /api/saas/tenants/
[API /api/saas/tenants GET] Internal error: Error: Failed query: select "id", "name", "slug", "code", "domain", "status", "created_at" from "tenants" order by "tenants"."created_at" desc params: 
    at eI.queryWithCache (.next/server/chunks/_01b.47w._.js:28:40619)
    at async (.next/server/chunks/_01b.47w._.js:28:43281)
    at async Object.listActiveTenants (.next/server/chunks/_04wdq7a._.js:87:9222)
    at async R (.next/server/chunks/[root-of-the-server]__0mviy2l._.js:1:6134)
    at async d (.next/server/chunks/[root-of-the-server]__0mviy2l._.js:1:12565)
    at async o (.next/server/chunks/[root-of-the-server]__0mviy2l._.js:1:13606) {
  query: 'select "id", "name", "slug", "code", "domain", "status", "created_at" from "tenants" order by "tenants"."created_at" desc',
  params: [],
  [cause]: Error: getaddrinfo ENOTFOUND db.vyinupvzqzfrveuxculh.supabase.co
      at ignore-listed frames {
    errno: -3007,
    code: 'ENOTFOUND',
    syscall: 'getaddrinfo',
    hostname: 'db.vyinupvzqzfrveuxculh.supabase.co'
  }
}
```

- **Log Serupa pada `/api/db/query`**:
  ```text
  [API /api/db/query] Error executing query: Error: Failed query: select "id", "status" from "users" where "users"."id" = $1 limit $2
  [cause]: Error: getaddrinfo ENOTFOUND db.vyinupvzqzfrveuxculh.supabase.co
  ```

---

## 6. Audit 5 — Role & Authorization State

- **Super Admin Runtime Role**:
  - Pada `auth.users`, user `preview.superadmin@madev.id` memiliki `app_metadata.role = 'super_admin'`.
  - Normalisasi di `src/proxy.ts:173`: `.toUpperCase().replace(/\s+/g, '_')` menghasilkan `'SUPER_ADMIN'`.
  - Header `x-is-super-admin: true` dan `x-user-role: super_admin` berhasil diinjeksi ke downstream handler.
  - API endpoint membaca header tersebut dan mengizinkan eksekusi berlanjut ke tahap pembacaan database.
- **Hasil Audit Role**: **PASS**.

---

## 7. Audit 6 — Database Connection & DNS Verification

Uji resolusi DNS langsung via Node.js:
1. `dns.lookup('db.vyinupvzqzfrveuxculh.supabase.co')` ➔ **`ENOTFOUND`** (Host direct tidak memiliki IPv4 address).
2. `dns.lookup('aws-0-ap-southeast-1.pooler.supabase.com')` ➔ **`52.77.146.31` (RESOLVED)**.

- **Status Koneksi Database**:
  - Database Identity: **PASS** (`vyinupvzqzfrveuxculh` di AWS ap-southeast-1).
  - Public.tenants Query via Pooler: **PASS** (6 records).
  - Row Count: **PASS** (6 records).
  - Vercel Preview `DATABASE_URL` Setting: **FAIL** (Menggunakan direct host `db.vyinupvzqzfrveuxculh.supabase.co` alih-alih pooler URL `aws-0-ap-southeast-1.pooler.supabase.com:6543`).

---

## 8. Audit 7 — Response Contract & Serialization

- Pemetaan DTO dan serialisasi data diuji secara lokal menggunakan hasil query pooler.
- Seluruh 6 baris tenant berhasil dipetakan ke interface `ActiveTenantDto` tanpa error:
  - `Runtime Audit Actor Verification` (`AUD01`)
  - `Runtime Public Registration 001` (`PUB01`)
  - `Pondok Duplikat` (`PRV03`)
  - `Runtime Verification Tenant 003` (`RTV03`)
  - `Runtime Verification Tenant 002` (`RTV02`)
  - `Runtime Verification Tenant` (`RTV01`)
- **Hasil Response Contract**: **PASS**.

---

## 9. Root Cause Summary

Kegagalan `/api/saas/tenants` pada deployment Vercel `bf045e1` **bukan kerusakan kode aplikasi, bukan permission failure, dan bukan database kosong**.

**Akar Penyebab Tunggal**:
Variabel lingkungan `DATABASE_URL` pada dashboard Vercel untuk environment Preview/Production dikonfigurasi menggunakan direct database hostname Supabase (`db.vyinupvzqzfrveuxculh.supabase.co:5432`), bukan **Supabase Connection Pooler** (`aws-0-ap-southeast-1.pooler.supabase.com:6543`). Di lingkungan cloud Vercel Serverless (yang beroperasi pada jaringan IPv4), direct host tersebut tidak dapat di-resolve oleh DNS resolver (`getaddrinfo ENOTFOUND`), sehingga seluruh query Drizzle gagal dan ditangkap oleh blok `catch` API menjadi HTTP 500 `"Gagal mengambil data tenant dari database."`.
