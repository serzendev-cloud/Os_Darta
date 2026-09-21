# EEOS — ROLE PREVIEW REMOVAL CONTRACT
# WP-LOGIN-INSTANT-ROLE-PREVIEW-001

```text
WORK PACKAGE:           WP-LOGIN-INSTANT-ROLE-PREVIEW-001
DOCUMENT:               ROLE PREVIEW REMOVAL & PRODUCTION CLEANUP RUNBOOK
PURPOSE:                Zero-Risk Teardown Protocol Prior to Production Launch
STATUS:                 OFFICIAL REMOVAL CONTRACT
TARGET:                 Complete eradication of preview code, identities, endpoints, and data
```

---

## 1. PURPOSE & GUARANTEE

Kontrak ini menetapkan prosedur resmi untuk mencabut seluruh artefak **Role Preview** sebelum sistem diluncurkan ke tahap *Production*. Prosedur ini menjamin bahwa seluruh komponen Role Preview dapat dieliminasi secara tuntas tanpa menyentuh satu baris pun dari inti autentikasi produksi (*production authentication core*).

---

## 2. INVENTORY OF PREVIEW ARTIFACTS TO REMOVE

Sebelum rilis produksi, 10 kategori artefak berikut harus dihilangkan:

### 2.1 File Route & Server Endpoints yang Harus Dihapus
* ❌ `src/app/api/auth/role-preview/route.ts` (API endpoint preview login)
* ❌ `src/modules/preview/` (jika ada modul service server-side khusus preview)

### 2.2 File UI yang Harus Dihapus / Dikembalikan
* 🔄 `src/app/client-page.tsx`: Hapus blok UI section *"Preview Platform Berdasarkan Role"* dan handler `handleRolePreview()`.
* 🔄 `src/app/dashboard/layout.tsx`: Hapus komponen banner `<PreviewIndicator />`.
* ❌ `src/components/shared/PreviewIndicator.tsx` (jika dibuat sebagai komponen terpisah).

### 2.3 Konfigurasi & Feature Flags yang Harus Dihapus
* ❌ Variabel lingkungan `ROLE_PREVIEW_ENABLED` pada `.env`, `.env.local`, `.env.production`.
* 🔄 `src/config/features.ts`: Hapus deklarasi flag `ROLE_PREVIEW`.

### 2.4 Identitas Preview di Supabase Auth yang Harus Dihapus
Eksekusi penghapusan akun melalui Supabase Admin Auth API terhadap 6 email terisolasi:
1. `preview.developer@madev.id`
2. `preview.superadmin@madev.id`
3. `preview.admin@madev.id`
4. `preview.musyrif@madev.id`
5. `preview.wali@madev.id`
6. `preview.santri@madev.id`

### 2.5 Record Data Preview di Basis Data yang Harus Dihapus
Penghapusan record pada tabel database publik yang memiliki identifier `preview_*`:
* `public.user_platform_roles` (untuk user developer/superadmin preview)
* `public.user_tenant_memberships` (untuk user admin, musyrif, wali, santri preview)
* `public.wali_santri_relationships` (`id = 'wsr_preview_001'`)
* `public.santri` (`id = 'santri_preview_001'`)
* `public.asrama` (`id = 'asrama_preview_001'`)
* `public.tenant_roles` (`id LIKE 'role_%_preview'`)
* `public.users` (`email LIKE 'preview.%@madev.id'`)

### 2.6 Test Khusus Preview yang Harus Dihapus / Dinonaktifkan
* ❌ `tests/contracts/role-preview.contract.test.ts`

### 2.7 Skrip Setup & Teardown yang Harus Dihapus / Diarsipkan
* ❌ `scripts/setup-role-preview.mjs`
* ❌ `scripts/teardown-role-preview.mjs`

### 2.8 Migrasi Basis Data
* **TIDAK ADA MIGRASI KHUSUS PREVIEW**. Tidak ada file migrasi DDL yang dibuat untuk preview, sehingga tidak ada DDL rollback yang diperlukan.

### 2.9 Cron / Background Jobs
* **NOL (0)**. Role Preview tidak menginisiasi background cron.

---

## 3. EKSEKUSI PENCABUTAN SATU LANGKAH (ONE-STEP TEARDOWN)

Sebelum memodifikasi kode git, jalankan skrip pembersihan database dan Supabase Auth:

```bash
node scripts/teardown-role-preview.mjs
```

### Logika Pemeriksaan Keamanan (*Safety Preflight*):
1. Memeriksa keberadaan string `preview` pada setiap ID atau email sebelum melakukan delete.
2. Memastikan akun `superadmin@madev.id` dan 6 akun admin asli TIDAK PERNAH masuk dalam query delete (`WHERE email NOT IN ('superadmin@madev.id', ...)`).
3. Melaporkan jumlah baris yang dihapus secara transparan.

---

## 4. POST-REMOVAL VERIFICATION RUNBOOK

Setelah pencabutan selesai, lakukan verifikasi:

1. **Uji Penolakan Endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/role-preview
   # Harus mengembalikan 404 Not Found
   ```
2. **Uji Keutuhan Login Produksi**:
   - Buka `/login`.
   - Pastikan hanya form email dan kata sandi normal yang tampil.
   - Uji login normal dengan akun produksi.
3. **Pemeriksaan Basis Data**:
   ```sql
   SELECT count(*) FROM public.users WHERE email LIKE 'preview.%'; -- Harus 0
   SELECT count(*) FROM auth.users WHERE email LIKE 'preview.%';   -- Harus 0
   SELECT count(*) FROM public.santri WHERE id LIKE 'preview_%';   -- Harus 0
   ```
4. **Automated Test Suite**:
   ```bash
   npm run test:run
   # Seluruh contract test produksi harus 100% PASS
   ```

---

## 5. ROLLBACK STRATEGY

Jika terjadi kesalahan saat penghapusan:
* Mengingat fitur dirancang *temporary by architecture*, pemulihan (*rollback*) cukup dilakukan dengan `git revert` pada commit pencabutan dan menjalankan kembali skrip `setup-role-preview.mjs`.
* Tidak ada risiko korupsi pada data bisnis utama institusi pesantren.
