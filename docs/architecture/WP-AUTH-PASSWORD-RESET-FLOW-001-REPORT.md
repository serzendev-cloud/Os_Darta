# WP-AUTH-PASSWORD-RESET-FLOW-001 REPORT
## Implementation — Secure Forgot Password / Password Recovery Flow

**Date**: September 30, 2026
**Status**: **READY FOR PREVIEW E2E** (Source & Preview Layer Complete; Production Unchanged)
**Role**: Senior Principal Systems Architect & Pair Programmer
**Safety Compliance**: 0 Database Migrations, 0 Production Mutations, 0 Unsolicited Emails to Real Tenants, 0 Unrelated Files Changed.

---

## 1. Objective
Menyediakan fitur pemulihan kata sandi (*Forgot Password / Password Recovery*) yang aman, terlindungi dari *email enumeration*, peka terhadap konteks multi-tenant (*tenant-aware*), terintegrasi dengan arsitektur Supabase Auth SSR dan Resend domain terverifikasi (`noreply@serzen-dev.my.id`), serta terisolasi secara tegas dari alur *tenant invitation onboarding* (`/auth/set-password`).

---

## 2. Current Authentication Architecture Inspected
Arsitektur autentikasi proyek yang telah diaudit dan menjadi fondasi:
1. **Next.js 16 Edge Proxy (`src/proxy.ts`)**: Bertindak sebagai batas zero-trust (*fail-closed*). Mengisolasi tenant berdasarkan subdomain terverifikasi (`<slug>.serzen-dev.my.id`), menyuntikkan header `x-tenant-id` & `x-tenant-slug`, serta memvalidasi sesi SSR Supabase (`supabase.auth.getUser()`).
2. **Supabase Auth & Admin API (`src/lib/supabase/`)**:
   - `createProxyClient()` untuk validasi cookie di layer middleware/proxy.
   - `createServerClient()` untuk route handler dan SSR.
   - `createAdminClient()` (Service Role) strictly di server-side untuk operasi administratif seperti pembuatan link OTP (`generateLink`).
   - `createClient()` pada browser client untuk interaksi user autentikasi (`updateUser`, `signOut`).
3. **Identity System of Record (`public.users`)**: Memetakan 1 identitas person ↔ 1 `auth.users` row. Mendukung lifecycle status: `ACTIVE`, `INVITED`, `INVITATION_FAILED`, `MUST_CHANGE_PASSWORD`, `SUSPENDED`, `DISABLED`, dan boundary terminal `MERGED`.
4. **Resend Email Service (`src/lib/email/resend-service.ts`)**: Mesin pengiriman email transaksional sisi server dengan domain terverifikasi (`serzen-dev.my.id`), secara ketat menolak domain testing `resend.dev` dan `@gmail.com`.

---

## 3. Existing Invitation/Onboarding Flow Preserved
Alur undangan awal tenant administrator (`INVITED` $\rightarrow$ set initial password $\rightarrow$ `complete-onboarding` $\rightarrow$ `ACTIVE`) **tetap utuh dan terisolasi**:
- `/auth/set-password` **TIDAK** digabungkan atau dikompromikan dengan alur pemulihan kata sandi. Halaman ini tetap eksklusif untuk aktivasi onboarding awal akun baru.
- `/auth/callback` mendeteksi parameter `type`:
  - `type=invite`: Mengarahkan secara ketat (*strictly enforced*) ke `/auth/set-password`.
  - `type=recovery`: Mengarahkan secara ketat (*strictly enforced*) ke `/auth/reset-password`.
- Pengguna dengan status `INVITED` yang mencoba melakukan *forgot password* ditahan di server dan diarahkan untuk menyelesaikan onboarding undangan awal mereka, tanpa membocorkan status akun ke publik.

---

## 4. Password Recovery Design

```text
[LOGIN PAGE] (/login)
      │
      ▼ (Klik "Lupa Password?")
[/auth/forgot-password] (UI)
      │ (Ketik Email & Submit)
      ▼
[POST /api/auth/forgot-password]
      ├─ 1. Format Validation (400 if invalid email)
      ├─ 2. Query public.users (DB Read-Only)
      │     ├─ Nonexistent -> Return Neutral 200 (Enumeration Defense)
      │     ├─ Status MERGED/DISABLED/SUSPENDED -> Block, Return Neutral 200
      │     └─ Status INVITED -> Block, Return Neutral 200
      ├─ 3. Resolve Tenant Context (subdomain / membership)
      ├─ 4. Call supabaseAdmin.auth.admin.generateLink({ type: 'recovery' })
      ├─ 5. Dispatch email via Resend (noreply@serzen-dev.my.id)
      └─ 6. Return Neutral 200
            │
            ▼ (User menerima email dan mengklik tautan)
[/auth/callback?token_hash=...&type=recovery&next=/auth/reset-password]
      │
      ├─ Supabase verifyOtp({ token_hash, type: 'recovery' })
      ├─ Sesi pemulihan terverifikasi disimpan di cookie
      └─ Redirect ke /auth/reset-password
            │
            ▼
[/auth/reset-password] (UI)
      ├─ 1. Client checkSession (supabase.auth.getUser())
      │     └─ If unauthenticated -> Redirect to /auth/forgot-password?error=session_required
      ├─ 2. Form: Password Baru & Konfirmasi (min. 8 karakter)
      ├─ 3. supabase.auth.updateUser({ password })
      ├─ 4. supabase.auth.signOut() (Invalidasi sesi recovery sementara)
      └─ 5. Tampilkan Success State & Link ke /login
```

---

## 5. Routes Added / Modified

| No | File Path | Type | Role & Description |
|---|---|---|---|
| 1 | `src/app/client-page.tsx` | Modified | Menambahkan Link `"Lupa Password?"` di samping checkbox *"Simpan & ingat akun di perangkat ini"*. |
| 2 | `src/app/auth/forgot-password/page.tsx` | Added | Server component metadata & Suspense container untuk halaman permohonan pemulihan kata sandi. |
| 3 | `src/app/auth/forgot-password/forgot-password-client.tsx` | Added | Client component form email, loading state, error banner, dan status sukses kebal enumerasi. |
| 4 | `src/app/api/auth/forgot-password/route.ts` | Added | Endpoint API server-side: verifikasi identitas, proteksi status MERGED, pembuatan OTP recovery via Supabase Admin, dan dispatch email via Resend. |
| 5 | `src/app/auth/callback/route.ts` | Modified | Mendukung `type='recovery'` yang secara deterministik mengarahkan ke `/auth/reset-password`, serta menangani fallback error recovery. |
| 6 | `src/app/auth/reset-password/page.tsx` | Added | Client component verifikasi sesi recovery, form password baru & konfirmasi (min 8 karakter), pembaruan password, dan invalidasi sesi. |
| 7 | `src/lib/email/templates/password-reset.tsx` | Added | Template HTML email responsif pemulihan kata sandi dengan branding Ma'had Manager / tenant context. |
| 8 | `src/lib/email/resend-service.ts` | Modified | Menambahkan fungsi `sendPasswordResetEmail()` dengan penegakan domain pengirim terverifikasi. |
| 9 | `src/proxy.ts` | Modified | Menyempitkan rute publik auth (`/auth/callback`, `/auth/set-password`, `/auth/forgot-password`, `/auth/reset-password`, `/api/auth/forgot-password`) alih-alih wildcard `/auth/*`. |
| 10 | `tests/contracts/auth-password-reset.contract.test.ts` | Added | 15 contract & security tests komprehensif menguji seluruh alur pemulihan kata sandi. |
| 11 | `tests/unit/resend-service.test.ts` | Modified | Menambahkan 3 unit tests untuk `sendPasswordResetEmail()`. |

---

## 6. Email Architecture
- **Verified Sender**: Menggunakan `resolveSenderEmail()` yang secara otomatis mengambil `noreply@serzen-dev.my.id` (atau konfigurasi terverifikasi `RESEND_FROM_EMAIL`).
- **Domain Guard**: Menolak domain testing `resend.dev` dan `@gmail.com`.
- **Security Invariant**: API Key (`RESEND_API_KEY`) dan token hash pemulihan hanya hidup di memori server dan tidak pernah terekspos ke bundle browser client (`NEXT_PUBLIC_` tidak digunakan).
- **Template**: HTML responsif profesional Indonesia/Islam ramah seluler, dengan peringatan kedaluwarsa 1 jam dan instruksi keamanan jika user tidak meminta reset.

---

## 7. Security Controls & Invariants

1. **Email Enumeration Protection**:
   - Respon API `POST /api/auth/forgot-password` mengembalikan pesan identik:
     > *"Jika email tersebut terdaftar, instruksi pemulihan password telah dikirim. Silakan periksa email Anda."*
   - Status HTTP `200 OK` dikembalikan baik email ditemukan, tidak ditemukan, berstatus MERGED, atau berstatus INVITED.
2. **MERGED Identity Boundary**:
   - Akun berstatus `MERGED` (identitas sintetis yang telah dikonsolidasikan) diblokir secara mutlak dari pembuatan token recovery. Tidak ada email yang dikirimkan.
3. **Session Verification on Reset**:
   - Halaman `/auth/reset-password` melakukan pemeriksaan sesi terotentikasi pemulihan (`checkRecoverySession`). Akses tanpa sesi OTP pemulihan langsung ditolak dan dialihkan ke `/auth/forgot-password?error=session_required`.
4. **Password Invariants**:
   - Kata sandi wajib diisi, konfirmasi wajib diisi, dan minimal 8 karakter.
   - Mengubah kata sandi **TIDAK** mengubah `tenant_id`, `tenant_code`, `NIS`, `role`, `persona`, `user_status`, kepemilikan tenant, maupun data akademik.
5. **Session Invalidation Post-Update**:
   - Setelah password baru disimpan melalui Supabase Auth, sesi pemulihan sementara langsung dibersihkan (`supabase.auth.signOut()`) untuk mencegah kebocoran sesi di perangkat publik/bersama.

---

## 8. Tenant Context Handling
- **Subdomain Extraction**: `extractTenantSlug(request)` mendeteksi subdomain tenant asal (misalnya `pp-darunnajah.serzen-dev.my.id`).
- **Target URL Construction**: Tautan recovery email disusun secara dinamis menargetkan domain tenant yang bersangkutan (`https://pp-darunnajah.serzen-dev.my.id/auth/callback?...`), atau fallback ke root platform terdaftar (`https://www.serzen-dev.my.id`) atau host local development.
- **Anti-Hardcoding**: Tidak ada hardcode `madev.id` pada komponen baru.

---

## 9. Tests Added & Results

### Focused Contract Tests (`tests/contracts/auth-password-reset.contract.test.ts`):
1. `TEST 1`: Login page source code exposes Forgot Password link targeting `/auth/forgot-password` (**PASS**).
2. `TEST 2`: Forgot Password and Reset Password route files exist in workspace (**PASS**).
3. `TEST 3 & 4`: Submitting existing vs nonexistent email produces identical neutral response semantics (**PASS**).
4. `TEST 5`: Recovery email sender strictly prohibits `onboarding@resend.dev` (**PASS**).
5. `TEST 6`: Recovery email sender resolves to verified production domain: `noreply@serzen-dev.my.id` (**PASS**).
6. `TEST 7`: Reset password component redirects to forgot-password if recovery session is absent (**PASS**).
7. `TEST 8`: Reset page validates minimum 8 characters and confirmation match (**PASS**).
8. `TEST 9`: Password update uses `supabase.auth.updateUser` and invalidates session after update (**PASS**).
9. `TEST 10 & 11`: Password recovery API performs zero INSERTs and zero metadata updates (**PASS**).
10. `TEST 12`: MERGED identity is barred from password recovery (zero email sent, neutral response preserved) (**PASS**).
11. `TEST 13`: Recovery request on tenant subdomain preserves tenant domain in callback link (**PASS**).
12. `TEST 14`: No hardcoded `madev.id` in new password recovery components (**PASS**).
13. `TEST 15 & 16`: No service-role key or `NEXT_PUBLIC_RESEND_API_KEY` in client bundles (**PASS**).
14. `TEST 17`: Auth callback preserves strict separation between invite and recovery flows (**PASS**).
15. `TEST 18`: Proxy explicitly permits narrow recovery routes while protecting internal routes (**PASS**).

**Focused Test Result**: `15 passed (15)` in 2.82s.

---

## 10. Full Test Suite Result
- Command: `npm run test:run`
- Test Files: **44 passed (44)**
- Tests: **434 passed (434)**
- Duration: 19.20s

---

## 11. TypeScript Check Result
- Command: `npx tsc --noEmit`
- Result: **0 errors** (Clean compilation).

---

## 12. Production Build Result
- Command: `npm run build`
- Result: **PASS** (Next.js 16.2.6 Turbopack)
- Route compilation: **91/91 routes successfully generated**
  - `ƒ /api/auth/forgot-password` (Dynamic)
  - `ƒ /auth/forgot-password` (Dynamic)
  - `○ /auth/reset-password` (Static prerender)
  - `ƒ /auth/callback` (Dynamic)
  - `○ /auth/set-password` (Static prerender)
  - `ƒ /login` (Dynamic)

---

## 13. Git Status & Safety Verification
- Working Tree:
  - Modified tracked files: `src/app/auth/callback/route.ts`, `src/app/client-page.tsx`, `src/lib/email/resend-service.ts`, `src/proxy.ts`, `tests/unit/resend-service.test.ts`.
  - Added untracked files: `src/app/api/auth/forgot-password/`, `src/app/auth/forgot-password/`, `src/app/auth/reset-password/`, `src/lib/email/templates/password-reset.tsx`, `tests/contracts/auth-password-reset.contract.test.ts`.
- `git diff --check`: **0 whitespace/formatting errors**.
- Commits made: **0** (menunggu otorisasi Product Owner).
- Pushes made: **0**.

---

## 14. Database / Auth / Production Mutation Count
- **Database Schema Migrations**: `0`
- **Database DDL / DML Alterations**: `0`
- **Production DNS / Domain Modifications**: `0`
- **Production Environment Mutations**: `0`
- **Real Tenant Emails Sent**: `0` (Tidak ada email dikirim ke `abu.thohir.zmr92@gmail.com` atau pengguna rill lainnya).

---

## 15. Known Limitations
1. Pada lingkungan lokal tanpa konfigurasi `RESEND_API_KEY`, pengiriman email akan diskip secara aman dengan log peringatan server (`RESEND_API_KEY_MISSING`).
2. Sesi pemulihan Supabase bergantung pada masa berlaku token OTP Supabase (default 1 jam).

---

## 16. Final Readiness Verdict & Recommended Next Gate

```text
STATUS: READY FOR PREVIEW E2E
```

Implementasi fitur pemulihan kata sandi telah selesai, lulus seluruh kontrak keamanan, tervalidasi typecheck, dan sukses dikompilasi pada production build tanpa menyentuh lingkungan Production atau memutasi basis data.

### Recommended Next Gate:
1. **Product Owner Review**: Verifikasi hasil audit dan menyetujui staging/commit kode sumber.
2. **Preview Deployment & Live E2E Verification**: Pengujian interaktif alur Forgot Password pada lingkungan Preview (`https://os-darta-kohl.vercel.app` atau preview tenant subdomain).
3. **Pilot Production Promotion**: Setelah diverifikasi pada Preview, fitur dapat dipromosikan bersamaan dengan evaluasi gate produksi berikutnya.
