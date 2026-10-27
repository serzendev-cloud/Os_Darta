# EEOS — ROLE PREVIEW SETUP RUNBOOK
# WP-LOGIN-INSTANT-ROLE-PREVIEW-001

```text
RUNBOOK ID:             RB-ROLE-PREVIEW-SETUP-001
PURPOSE:                Automated Setup & Provisioning of Isolated Role Preview Engine
TARGET ENVIRONMENT:     Development / Staging / Preview
EXECUTION MODE:         Idempotent & Isolated (Zero Production Mutation)
```

---

## 1. PREREQUISITES

Pastikan dependensi dan konfigurasi lokal telah terpenuhi:
1. `.env.local` memuat:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ROLE_PREVIEW_ENABLED=true`
2. Layanan PostgreSQL dan Supabase Auth aktif dan dapat diakses.

---

## 2. AUTOMATED PROVISIONING SCRIPT

Untuk menyiapkan seluruh akun dan entitas data preview terisolasi, jalankan skrip provisioning:

```bash
node scripts/setup-role-preview.mjs
```

### Urutan Operasi Idempotent:
1. **Verifikasi Target Tenant**: Memeriksa keberadaan tenant aktif `t_1789172137858_9g7lm` (`runtime-verify-001`).
2. **Setup Tenant Roles**: Memastikan role `ADMIN`, `MUSYRIF`, `WALI`, dan `SANTRI` tersedia pada tenant tersebut.
3. **Penyediaan Identitas Supabase Auth (6 Akun)**:
   - Menggunakan `supabaseAdmin.auth.admin.createUser` dengan email terisolasi:
     - `preview.developer@madev.id`
     - `preview.superadmin@madev.id`
     - `preview.admin@madev.id`
     - `preview.musyrif@madev.id`
     - `preview.wali@madev.id`
     - `preview.santri@madev.id`
   - Menandai email sebagai terkonfirmasi (`email_confirm: true`).
4. **Penyediaan Profil `public.users`**:
   - Mendaftarkan entitas pengguna pada tabel `public.users` dengan status `ACTIVE`.
5. **Penyediaan Role Binding**:
   - `public.user_platform_roles` untuk Developer dan Super Admin.
   - `public.user_tenant_memberships` untuk Admin, Musyrif, Wali, dan Santri.
6. **Penyediaan Data Domain Preview Minimal**:
   - 1 Asrama Preview: `asrama_preview_001` ("Asrama Preview Al-Fatih").
   - 1 Santri Preview: `santri_preview_001` ("Santri Preview Al-Fatih", NIS `PREV001`, `tenant_id: t_1789172137858_9g7lm`).
   - 1 Hubungan Wali-Santri: `wsr_preview_001` (menghubungkan Wali Preview ke Santri Preview).

---

## 3. VERIFIKASI POST-SETUP

Jalankan test suite untuk memvalidasi:

```bash
npx vitest run tests/contracts/role-preview.contract.test.ts
```
