# WP-TENANT-PROVISION-002-RUNTIME-FORENSIC-001 REPORT

**WORK PACKAGE**: `WP-TENANT-PROVISION-002-RUNTIME-FORENSIC-001`  
**TITLE**: Forensic Audit — Audit Persistence & Tenant Routing  
**PHASE**: READ-ONLY FORENSIC / ARCHITECTURE AUDIT  
**STATUS**: `PASS` (Forensic Investigation Completed)  

---

## 1. Executive Summary

Penyelidikan forensik read-only ini dilakukan untuk membedah akar penyebab (*root cause*) dan radius dampak (*blast radius*) dari dua temuan pada Work Package `WP-TENANT-PROVISION-002-RUNTIME-VERIFY-001`:
1. **Audit Log Persistence Failure**: Event audit provisioning tidak tersimpan di PostgreSQL `public.audit_logs` (`COUNT(*) = 0`).
2. **Tenant Context Resolution Blocker**: Tenant admin tidak dapat mengakses context tenant miliknya via `http://localhost:3000/api/tenant/branding` dan mengembalikan HTTP 403 (`Tenant default is inactive, suspended, or missing`).

### Ringkasan Temuan Kunci:
1. **Audit Persistence Root Cause**: `auditLogService.log()` bergantung pada factory prototype `createTenantService('auditLogs')`. Pada baris ke-36 `src/lib/db/services/create-tenant-service.ts`, terdapat percabangan:
   `if (isDemoMode() || typeof window === 'undefined') return demoDb.create(...)`
   Karena endpoint provisioning dieksekusi di Node.js server (`typeof window === 'undefined'`), pemanggilan audit secara diam-diam (*silently*) diarahkan ke store in-memory `demoDb` dan tidak pernah mengeksekusi Drizzle SQL `INSERT` ke PostgreSQL.
2. **Tenant Routing Root Cause**:
   - **Testing Limitation (Primary)**: Standard Node.js WHATWG `fetch()` secara otomatis mengabaikan (*strips/overrides*) custom header `Host: runtime-verify-001.madev.id` dan memaksanya menjadi `Host: localhost:3000` (otoritas URL). Next.js Proxy hanya menerima header `Host: localhost:3000`.
   - **Proxy Implementation**: `extractTenantSlug()` pada `src/proxy.ts` memiliki aturan `!hostname.includes('localhost')`, sehingga host yang mengandung `'localhost'` tidak pernah diekstraksi subdomainnya dan langsung jatuh ke fallback `'default'`.
   - **Path Routing Gap**: Meskipun `src/proxy.ts` mengekstrak slug dari path `/t/:slug`, Next.js App Router tidak memiliki direktori `src/app/t/` dan tidak memiliki URL rewrites di `next.config.ts`, sehingga routing path `/t/:slug/...` menghasilkan HTTP 404.
   - **Fallback Masking**: Fallback ke `'default'` menyebabkan downstream context mengasumsikan tenant bernama `'default'`, yang tidak ada di database live, memicu HTTP 403 alih-alih HTTP 404 / 400.
3. **Test Script Hygiene**: Skrip pengujian `test_subdomain.mjs` terbukti mengeksekusi mutasi kata sandi administratif di luar alur provisioning resmi menggunakan Supabase Service Role Key.

---

## 2. Scope

- **Objek Audit**:
  - `src/modules/saas/services/tenant-provisioning-service.ts`
  - `src/lib/db/services/auditLog.ts`
  - `src/lib/db/services/create-tenant-service.ts`
  - `src/lib/mock-store.ts`
  - `src/app/api/db/query/route.ts`
  - `src/proxy.ts`
  - `src/lib/tenant/context.ts`
  - `src/lib/authz/authorization-service.ts`
  - `next.config.ts`
  - `.env.local`
  - Scratch test artifacts: `pre_test_baseline.mjs`, `runtime_verify_provisioning.mjs`, `test_routing.mjs`, `test_subdomain.mjs`.
- **Batasan**: Penyelidikan 100% read-only; zero mutation terhadap kode, schema, database, credential, atau environment.

---

## 3. Evidence Reviewed

1. Laporan Verifikasi Runtime: [`docs/architecture/WP-TENANT-PROVISION-002-RUNTIME-VERIFY-001-REPORT.md`](file:///e:/Projects/Os_Darta/docs/architecture/WP-TENANT-PROVISION-002-RUNTIME-VERIFY-001-REPORT.md)
2. Skema Live Supabase PostgreSQL (`vyinupvzqzfrveuxculh.supabase.co`):
   - `tenants`: 1 row (`t_1789172137858_9g7lm`, slug `runtime-verify-001`)
   - `tenant_settings`: 1 row (`tenant_id = t_1789172137858_9g7lm`)
   - `users`: 2 rows (`superadmin@madev.id`, `runtime.verify001@madev.id`)
   - `tenant_roles`: 1 row (`role_admin_t_1789172137858_9g7lm`)
   - `user_tenant_memberships`: 1 row (Identity chain valid)
   - `audit_logs`: 0 rows (Persistence gap)
3. Hasil diagnostik transmisi HTTP header:
   - WHATWG `fetch('http://localhost:3999', { headers: { host: 'foo.com' } })` -> Server menerima `Host: localhost:3999`.
   - Node `http.request({ headers: { Host: 'foo.com' } })` -> Server menerima `Host: foo.com`.

---

## 4. Audit Persistence Trace

Berikut adalah jejak eksekusi lengkap dari rute provisioning hingga titik kegagalan persistensi:

```
[HTTP CLIENT] POST /api/saas/tenants
   │
   ▼
[FILE] src/app/api/saas/tenants/route.ts:146
[FUNCTION] POST()
[CALLER] Client request
[CALLEE] tenantProvisioningService.provisionTenant(body, actor)
   │
   ▼
[FILE] src/modules/saas/services/tenant-provisioning-service.ts:350
[FUNCTION] provisionTenant()
[CALLER] POST /api/saas/tenants
[CALLEE] auditLogService.log(entry)
[PAYLOAD] { actorId, actorName, actorRole, entityType: 'tenant', entityId, action: 'provision', metadata: {...} }
   │
   ▼
[FILE] src/lib/db/services/auditLog.ts:9
[FUNCTION] auditLogService.log()
[CALLER] provisionTenant()
[CALLEE] baseService.create()
[DATA SOURCE] baseService = createTenantService<AuditLog>('auditLogs')
   │
   ▼
[FILE] src/lib/db/services/create-tenant-service.ts:32-38
[FUNCTION] create(data)
[CALLER] auditLogService.log()
[CALLEE] demoDb.create('auditLogs', payload)
[BRANCH CONDITION] if (isDemoMode() || typeof window === 'undefined')
   │
   ├─► typeof window === 'undefined' EVALUATES TO TRUE (Node.js Server Runtime)
   │
   ▼
[PERSISTENCE TARGET] src/lib/mock-store.ts:80 -> demoDb.create()
[RESULT] Event audit tersimpan HANYA di memory RAM JavaScript process (demoDb).
         NOL statement SQL INSERT dieksekusi ke PostgreSQL public.audit_logs.
```

---

## 5. Audit Persistence Root Cause

### Penyebab Utama (*Primary Root Cause*):
`createTenantService` adalah artefak prototipe yang awalnya dibuat untuk memfasilitasi pengembangan frontend sebelum integrasi database PostgreSQL live. 
1. Pada `create-tenant-service.ts`:
   - Pada baris 36, fungsi `create()` mengevaluasi `if (isDemoMode() || typeof window === 'undefined')`.
   - Di lingkungan runtime server Next.js (Route Handlers, Server Actions, Background Services), objek `window` tidak pernah ada (`typeof window === 'undefined' === true`).
   - Akibatnya, seluruh pemanggilan `create()` di sisi server dipaksa masuk ke `demoDb.create()`.
2. Selain itu, bahkan jika logika fallback server tersebut diabaikan:
   - Pemanggilan browser mencoba `fetch('/api/db/query')`.
   - Namun di `src/app/api/db/query/route.ts` (baris 164-182), koleksi `'auditLogs'` **tidak terdaftar** pada `tableMap` untuk aksi `POST` (create).
   - Sehingga pemanggilan browser pun akan menghasilkan error `400 Unknown collection "auditLogs"`.
3. Tidak pernah ada repository Drizzle kanonikal mandiri untuk `audit_logs`. `auditLogService` hanya membungkus service factory prototipe `createTenantService('auditLogs')`.

---

## 6. Audit Persistence Blast Radius

Audit terhadap seluruh basis kode untuk memeriksa komponen lain yang terpengaruh oleh arsitektur prototipe ini:

### Layanan yang Terdampak oleh `auditLogService` (Gagal Simpan ke PostgreSQL):
1. `tenantProvisioningService.provisionTenant` (`src/modules/saas/services/tenant-provisioning-service.ts:350`)
2. `saasCompanyContactService` (`src/app/api/saas/company-contact/route.ts:308`)
3. `walletFreezeService` (`src/lib/services/wallet-freeze-service.ts:50, 85, 118, 147, 173`)
4. Global audit helper `logAudit()` (`src/lib/audit-logger.ts:22`)

### Layanan Domain Lain yang Menggunakan `createTenantService`:
Pencarian menemukan 22 service domain di `src/lib/db/services/*` yang menggunakan `createTenantService`:
- `academic-ledger.ts` (`academic_ledger_records`, `academic_transcripts`)
- `academic-workspace.ts` (`academic_years`, `academic_terms`)
- `alumni.ts`
- `asrama.ts`
- `governanceCase.ts`
- `guru.ts`
- `healthPermission.ts`
- `healthVisit.ts`
- `hukuman.ts`
- `kamar.ts`
- `kelas.ts`
- `mapel.ts`
- `masterHukuman.ts`
- `masterJenjang.ts`
- `masterPelanggaran.ts`
- `masterTingkat.ts`
- `notifications.ts`
- `pelanggaran.ts`
- `quest.ts`
- `santri.ts`
- `teacherAssignment.ts`
- `tolerancePolicy.ts`

> [!WARNING]
> Setiap pemanggilan server-side langsung terhadap service-service di atas yang memanggil `.create()`, `.get()`, atau `.list()` tanpa melalui API route akan secara diam-diam beroperasi terhadap in-memory `demoDb`, bukan PostgreSQL.

---

## 7. Audit Security Analysis

Pemeriksaan keamanan muatan data audit pada `tenant-provisioning-service.ts` (baris 350-365):
- **Plaintext Password**: **EXCLUDED** (Tidak ada kolom password di metadata).
- **Temporary Credential**: **EXCLUDED** (`temporaryPassword` tidak dimasukkan).
- **Service Role Key / Tokens**: **EXCLUDED** (Tidak ada token yang disertakan).
- **Muatan yang Disimpan**:
  ```ts
  metadata: {
    tenantName: cleanName,
    tenantSlug: cleanSlug,
    ownerEmail: cleanEmail,
    plan: cleanPlan,
    authUserId,
    timestamp: new Date().toISOString(),
  }
  ```
- **Kesimpulan Keamanan**: Nol kebocoran rahasia (*zero secret leakage*). Muatan audit bersih dan mematuhi standar Zero-Trust.

---

## 8. Tenant Routing Trace

Jejak lengkap resolusi request dari HTTP client hingga penolakan otorisasi:

```
[HTTP CLIENT] GET http://localhost:3000/api/tenant/branding
              Header: Host: runtime-verify-001.madev.id (Dikirim via fetch)
   │
   ▼
[UNDICI / WHATWG FETCH]
   Overwrites Host header dengan request URL authority: "localhost:3000"
   │
   ▼
[NEXT.JS PROXY] src/proxy.ts:56
[FUNCTION] extractTenantSlug(request)
   │
   ├─► url.pathname = "/api/tenant/branding" (Does NOT start with "/t/")
   ├─► hostname = "localhost:3000"
   │     └─► hostname.includes("localhost") === true
   │     └─► Subdomain check (!hostname.includes("localhost")) EVALUATES TO FALSE
   │
   ▼
[RESULT SLUG] extractTenantSlug() returns "default"
   │
   ▼
[NEXT.JS PROXY] src/proxy.ts:139-140
   requestHeaders.set("x-tenant-id", "default-tenant")
   requestHeaders.set("x-tenant-slug", "default")
   │
   ▼
[TENANT CONTEXT] src/lib/tenant/context.ts:44
[FUNCTION] getTenantContext()
   │
   ├─► tenantSlug = "default"
   ├─► if (!tenantSlug || tenantSlug === 'default') return DEFAULT_TENANT
   │
   ▼
[RESULT CONTEXT] Returns DEFAULT_TENANT { id: "default", name: "Ma'had Management Platform", slug: "default" }
   │
   ▼
[DOWNSTREAM API] src/app/api/tenant/branding/route.ts:25
   │
   ├─► tenant.id === "default"
   ├─► requirePermission(userId, "default", "view_pengaturan")
   │
   ▼
[AUTHORIZATION ENGINE] src/lib/authz/authorization-service.ts:64-79
   │
   ├─► SELECT id, status FROM tenants WHERE id = "default"
   ├─► Result: 0 rows (Tenant "default" tidak terdaftar di PostgreSQL)
   │
   ▼
[HTTP RESPONSE] 403 Forbidden
   {"error": "Forbidden", "message": "Tenant default is inactive, suspended, or missing"}
```

---

## 9. Tenant Routing Root Cause

Kegagalan resolusi tenant di environment lokal disebabkan oleh **empat faktor yang saling bertumpuk**:
1. **Node.js Client Spec Behavior**: WHATWG `fetch()` yang digunakan pada test script melarang modifikasi header `Host` (forbidden header name) dan menimpanya dengan `localhost:3000`.
2. **Hardcoded Exclusion of Localhost**: Pada `src/proxy.ts` baris 74:
   `!hostname.includes('localhost')`
   Hal ini sengaja menolak ekstraksi subdomain pada domain lokal (seperti `runtime-verify-001.localhost:3000`).
3. **Ketiadaan DNS / Hosts Mapping**: Pada sistem operasi pengembang, hostname `runtime-verify-001.madev.id` tidak diarahkan ke IP `127.0.0.1` di file `hosts`, sehingga request langsung ke domain tersebut tidak dapat mencapai Next.js dev server lokal.
4. **Ketiadaan App Router Path Rewrites**: Mekanisme alternatif `/t/:slug` hanya diekstrak di Proxy, namun Next.js App Router tidak memiliki rewrites atau rute halaman `/t/[slug]`, sehingga navigasi path menghasilkan 404.

---

## 10. DNS vs Host Header vs Proxy vs Context Classification

| Layer | Status | Peran dalam Kegagalan |
| :--- | :--- | :--- |
| **DNS** | LIMITATION | Hostname `*.madev.id` tidak mengarah ke `127.0.0.1` pada local test environment. |
| **HTTP Client (`fetch`)** | LIMITATION | WHATWG `fetch` menolak custom `Host` header dan mengirim `localhost:3000`. |
| **Host Header Handling** | GAP | Proxy tidak membaca header alternatif seperti `x-forwarded-host` untuk pengujian. |
| **Proxy (`extractTenantSlug`)** | GAP | Menolak seluruh host yang mengandung string `'localhost'`. |
| **Path Routing (`/t/:slug`)** | ARCHITECTURAL GAP | Slug diekstrak di Proxy, tetapi Next.js App Router tidak menyediakan handler/rewrite. |
| **Tenant Context (`getTenantContext`)** | ACCEPTABLE | Bekerja sesuai desain: membaca header yang diinjeksi Proxy dan melakukan query DB. |
| **Authorization (`requirePermission`)** | ACCEPTABLE | Bekerja aman (*fail-closed*): menolak akses ketika tenant ID yang diminta tidak valid. |

---

## 11. Default Tenant Fallback Analysis

- **Asal Definisi**: `src/lib/tenant/context.ts` (baris 30-39) mendefinisikan `DEFAULT_TENANT` dengan `id: 'default'`.
- **Tujuan Awal**: Menyediakan context fallback pada rute platform global publik (misal `/login` atau landing page).
- **Bahaya Masking (*Masking Effect*)**:
  Ketika resolusi hostname gagal, proxy secara diam-diam menetapkan `x-tenant-slug: 'default'`. Ini mengaburkan fakta bahwa request sebenarnya ditujukan ke tenant spesifik.
  Downstream API tidak mengembalikan `404 Tenant Hostname Not Found`, melainkan mencoba mengeksekusi operasi terhadap tenant `id: 'default'` yang berujung pada error `403 Tenant default is inactive, suspended, or missing`.
- **Rekomendasi**: Pada rute API tenant terproteksi (`/api/tenant/*`), kegagalan ekstraksi slug harus mengembalikan error eksplisit `400 Bad Request: Missing Tenant Identification` atau `404 Tenant Not Found`, bukan jatuh ke fallback `'default'`.

---

## 12. JWT Tenant Claim Analysis

- **Kondisi Aktual**:
  Saat user tenant admin login, Supabase Auth mengembalikan JWT dengan claim:
  `user.app_metadata.tenant_id = 't_1789172137858_9g7lm'`
  `user.app_metadata.tenant_slug = 'runtime-verify-001'`
- **Peran dalam Resolusi Saat Ini**:
  `src/proxy.ts` **mengabaikan** claim `tenant_slug` dari JWT saat menentukan routing, demi prinsip Zero-Trust multi-tenancy (mencegah session satu tenant digunakan untuk mengakses rute tenant lain).
- **Potensi Penggunaan Arsitektural**:
  JWT claim **tidak boleh** menjadi otoritas routing utama (routing tetap ditentukan oleh Host/Domain atau Path). Namun, JWT claim dapat digunakan sebagai **cross-check validation**:
  Jika Host adalah `tenant-a.madev.id`, tetapi JWT user berasal dari `tenant-b`, proxy dapat langsung menolak dengan `403 Cross-Tenant Access Forbidden`.
  Pada rute API tanpa host tenant eksplisit, JWT claim dapat digunakan sebagai session fallback terverifikasi.

---

## 13. Path Routing Analysis

- **Status**: **NOT IMPLEMENTED IN APP ROUTER**
- **Detail Implementasi**:
  - `src/proxy.ts` (baris 61): Memiliki regex pendeteksi `/t/:slug`.
  - `src/app/`: **Tidak ada** folder `src/app/t/` atau `src/app/t/[slug]/`.
  - `next.config.ts`: **Tidak ada** konfigurasi `rewrites()`.
- **Hasil Runtime**:
  Setiap pemanggilan ke `/t/runtime-verify-001/dashboard/` diarahkan ke App Router yang tidak memiliki rute tersebut, menghasilkan HTTP 404 Not Found.
- **Kesimpulan**: Dukungan path-based tenant routing saat ini berstatus setengah jadi (*stale prototype logic in proxy*).

---

## 14. Environment Configuration Analysis

Audit terhadap variabel lingkungan di `.env.local`:

| Variable Name | Presence | Catatan Arsitektural |
| :--- | :--- | :--- |
| `DATABASE_URL` | Present | PostgreSQL Pooler Supabase (Berfungsi) |
| `NEXT_PUBLIC_SUPABASE_URL` | Present | Supabase Instance URL (Berfungsi) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Present | Public Anon Key (Berfungsi) |
| `SUPABASE_SERVICE_ROLE_KEY` | Present | Admin Service Key (Berfungsi) |
| `NEXT_PUBLIC_DEMO_MODE` | Present (`false`) | Demo mode dinonaktifkan (Berfungsi) |
| `RESEND_API_KEY` | Present | Kredensial rotasi (Aman) |
| `NEXT_PUBLIC_APP_URL` | **ABSENT** | URL dasar platform tidak didefinisikan |
| `NEXT_PUBLIC_DEFAULT_TENANT_ID` | **ABSENT** | Proxy fallback menggunakan string default `'default-tenant'` |
| `NEXT_PUBLIC_BASE_DOMAIN` | **ABSENT** | Domain dasar multi-tenant tidak didefinisikan (di-hardcode `'madev.id'`) |

---

## 15. Test Script Hygiene

Audit terhadap empat skrip pengujian di direktori scratch:

### 1. `pre_test_baseline.mjs`
- **Operasi**: Read-only SQL queries (`SELECT count(*)...`) + `supabaseAdmin.auth.admin.listUsers()`.
- **Risiko**: **LOW**. Menggunakan service-role key hanya untuk membaca daftar user.

### 2. `runtime_verify_provisioning.mjs`
- **Operasi**: Eksekusi provisioning resmi melalui API `POST /api/saas/tenants` menggunakan session Super Admin (`admin123`).
- **Risiko**: **MEDIUM**. Menyimpan kata sandi pengujian di dalam file skrip; menggunakan service role untuk verifikasi objek Auth.

### 3. `test_subdomain.mjs`
- **Operasi**:
  - Memanggil `supabaseAdmin.auth.admin.updateUserById(tenantAdmin.id, { password: testPw })` pada baris 39.
  - Memiliki hardcoded plaintext password: `testPw = 'TestVerify123!@#'`.
- **Risiko**: **CRITICAL**. Melakukan mutasi state administratif secara sepihak di luar alur pengujian yang diotorisasi, merusak integritas kata sandi sementara yang digenerate oleh provisioning engine.

### 4. `test_routing.mjs`
- **Operasi**:
  - Memanggil `supabaseAdmin.auth.admin.generateLink({ type: 'magiclink', email: ... })` pada baris 29.
- **Risiko**: **HIGH**. Menghasilkan token/link autentikasi administratif di luar alur resmi menggunakan service-role key.

---

## 16. Security Findings

1. **[CRITICAL] Unauthorized Password Mutation in Test Script**: Skrip `test_subdomain.mjs` memodifikasi password tenant admin via Supabase Admin API. Skrip pengujian tidak boleh mengubah state user di luar alur kanonikal.
2. **[HIGH] Service Role Key Exposure in Test Scripts**: Seluruh test script mengimpor `SUPABASE_SERVICE_ROLE_KEY` secara langsung untuk keperluan verifikasi.
3. **[MEDIUM] In-Memory Demo Store Silent Execution**: Operasi server audit logging menulis ke memori process tanpa melempar error, menciptakan ilusi sukses (*silent success*) padahal data tidak tersimpan di database persisten.
4. **[MEDIUM] RBAC Seed Permission Gap on Provisioning**: Provisioning engine membuat tenant role `ADMIN`, namun tidak mengisi relasi permission di `tenant_role_permissions`. Akibatnya, jika routing berhasil, tenant admin tetap akan ditolak dengan `DENIED_PERMISSION_MISSING: User missing required permission: view_pengaturan`.

---

## 17. Remediation Classification

| Issue | Classification | Deskripsi Remediasi |
| :--- | :--- | :--- |
| **Audit Log DB Persistence** | **ARCHITECTURAL GAP** | Mengganti `auditLogService` agar menggunakan Drizzle ORM repository langsung (`db.insert(schema.auditLogs)`). |
| **WHATWG Fetch Host Stripping** | **TESTING LIMITATION** | Skrip pengujian harus menggunakan Node `http.request` jika ingin menguji custom `Host` header ke localhost. |
| **Localhost Subdomain Exclusion** | **BUG / ENVIRONMENT LIMITATION** | `src/proxy.ts` harus mendukung domain lokal (misal `*.localhost` atau base domain dev) untuk testing. |
| **Path Routing `/t/:slug` 404** | **ARCHITECTURAL GAP** | Menambahkan App Router rewrites di `next.config.ts` jika `/t/:slug` ingin dijadikan rute resmi. |
| **Default Tenant Masking** | **LEGACY BEHAVIOR** | Menghilangkan fallback `'default'` pada endpoint API yang mewajibkan tenant terautentikasi. |
| **Tenant Role Permissions Gap** | **ARCHITECTURAL GAP** | Menambahkan seeding default permissions untuk role `ADMIN` saat transaksi tenant provisioning. |

---

## 18. Recommended Next Work Packages

Berikut adalah rekomendasi urutan Work Package perbaikan secara berurutan:

```
WP-AUDIT-PERSISTENCE-REMEDIATION-001
(Membuat Drizzle audit repository & memutus ketergantungan auditLogService pada demoDb)
    │
    ▼
WP-TENANT-PROVISION-SEED-PERMISSIONS-001
(Menambahkan seeding default role permissions untuk tenant admin saat provisioning)
    │
    ▼
WP-TENANT-ROUTING-REMEDIATION-001
(Menyempurnakan proxy extractTenantSlug untuk local development & rewrites /t/:slug)
    │
    ▼
WP-TENANT-PROVISION-002-RUNTIME-VERIFY-002
(Verifikasi ulang end-to-end dengan test harness yang bersih tanpa mutasi password manual)
```

---

## 19. Git Governance

- **Branch**: `preview` (tidak berubah)
- **Status Perubahan**: **NOL** baris kode aplikasi diubah.
- **Database Status**: **NOL** schema DDL atau mutasi database dijalankan selama investigasi ini.
- **Untracked Files Preserved**:
  - `WP-TENANT-PROVISION-002-REVIEW.diff` (Untouched)
  - `docs/architecture/WP-DB-RECON-CORE-001-EXECUTION-REPORT.md` (Untouched)
  - `docs/architecture/WP-TENANT-PROVISION-002-RUNTIME-VERIFY-001-REPORT.md` (Untouched)
  - `drizzle/WP-DB-RECON-CORE-001.sql` (Untouched)
- **Commit / Push**: **NONE**.

---

## 20. Required Specific Answers

### A. Can audit persistence be fixed without database migration?
**YES.** Skema `public.audit_logs` di PostgreSQL sudah lengkap (10 kolom + index) hasil rekonsiliasi `WP-DB-RECON-CORE-001`. Perbaikan hanya membutuhkan perubahan source code TypeScript pada layer service.

### B. Can tenant routing be fixed without changing the tenant source of truth?
**YES.** Otoritas routing tetap berada pada domain / hostname dan path. Perbaikan hanya memerlukan penyesuaian penanganan `localhost` dan URL rewrites di Next.js.

### C. Is the localhost failure actually a routing bug or merely an environment limitation?
**COMBINATION.** Ini adalah kombinasi dari: (1) Testing limitation pada Node WHATWG `fetch` yang menghapus custom Host header, (2) Hardcoded filter `!hostname.includes('localhost')` di `src/proxy.ts`, dan (3) Ketiadaan DNS mapping lokal untuk `*.madev.id`.

### D. Does the current proxy correctly resolve `runtime-verify-001.madev.id` when given as Host?
**YES (in logic).** Logika `extractTenantSlug` secara teoritis benar mengekstrak `runtime-verify-001` dari `runtime-verify-001.madev.id`. Namun pada pengujian lokal, header Host tersebut ditimpa oleh client `fetch` menjadi `localhost:3000`.

### E. Does `/t/runtime-verify-001` provide a valid alternative tenant routing path?
**NO.** Saat ini tidak valid. Proxy mengekstrak slug dari path tersebut, tetapi Next.js App Router mengembalikan HTTP 404 karena tidak ada halaman `src/app/t/` ataupun URL rewrite.

### F. Is "default" fallback masking a real failure?
**YES.** Menetapkan fallback `'default'` menyebabkan request tenant gagal secara membingungkan dengan pesan `Tenant default is inactive, suspended, or missing` (403), alih-alih `Tenant Not Found` (404).

### G. Does any production server-side code unintentionally use demoDb?
**YES.** Seluruh pemanggilan server-side terhadap 22 domain service berbasis `createTenantService` (termasuk `auditLogService`) secara diam-diam mengeksekusi operasi terhadap in-memory `demoDb` akibat percabangan `typeof window === 'undefined'`.

### H. Which issue must be remediated first?
**`WP-AUDIT-PERSISTENCE-REMEDIATION-001`** (Persistensi Audit Log). Isu ini terisolasi, tidak memerlukan perubahan routing atau migrasi DB, dan langsung memenuhi kriteria penerimaan audit trail enterprise.

### I. Which issue can remain deferred?
Path routing `/t/:slug` dan manajemen multi-tenant domain kustom dapat dideferensikan ke work package routing terdedikasi (`WP-TENANT-ROUTING-REMEDIATION-001`).

---

## 21. Final Verdict

Penyelidikan forensik membuktikan bahwa:
1. **Kegagalan Persistensi Audit**: Bukan karena kegagalan skema database, melainkan karena `auditLogService` masih terhubung ke factory prototipe `createTenantService` yang mengalihkan penulisan ke `demoDb` pada runtime server.
2. **Kegagalan Resolusi Tenant di Localhost**: Merupakan batasan environment dan test client (`fetch` menimpa header Host, Proxy memblokir hostname localhost), bukan kegagalan logika provisioning PostgreSQL.
3. **Temuan Lanjutan**: Ditemukan celah otorisasi di mana tenant admin baru belum memiliki relasi permission di `tenant_role_permissions`, yang memerlukan seeding default saat provisioning.
4. **Higienitas Pengujian**: Skrip `test_subdomain.mjs` melakukan mutasi password di luar protokol dan harus dibersihkan pada iterasi pengujian berikutnya.

---

```
================================================================================
FORENSIC WORK PACKAGE RESULT
================================================================================

WP:
WP-TENANT-PROVISION-002-RUNTIME-FORENSIC-001

STATUS:
PASS

AUDIT PERSISTENCE:
NEEDS REMEDIATION (Replace createTenantService with direct Drizzle repository)

TENANT ROUTING:
NEEDS REMEDIATION (Support localhost dev testing & fix /t/ path rewrites)

TEST SCRIPT HYGIENE:
NEEDS REMEDIATION (Eliminate service-role password mutations in test scripts)

ROOT CAUSE:
auditLogService delegates to prototype createTenantService which diverts server-side writes to demoDb, while local tenant resolution fails because Node fetch overrides the Host header and proxy blocks localhost subdomains.

NEXT RECOMMENDED WP:
WP-AUDIT-PERSISTENCE-REMEDIATION-001

SOURCE CHANGES:
NONE

DATABASE CHANGES:
NONE

PASSWORD CHANGES:
NONE

TENANT CREATED:
NONE

COMMIT:
NO

PUSH:
NO

DEPLOY:
NO

================================================================================
MANDATORY STOP
================================================================================

STOP.

DO NOT CONTINUE TO REMEDIATION.

DO NOT IMPLEMENT ANY FIX.

WAIT FOR ARCHITECTURE REVIEW AND PRODUCT OWNER AUTHORIZATION.
================================================================================
```
