# EEOS — ROLE PREVIEW TEARDOWN RUNBOOK
# WP-LOGIN-INSTANT-ROLE-PREVIEW-001

```text
RUNBOOK ID:             RB-ROLE-PREVIEW-TEARDOWN-001
PURPOSE:                Clean Teardown of All Role Preview Data & Identities
SAFETY GUARANTEE:       Fail-Closed Guard (Immunity for Production Users & Data)
```

---

## 1. OBJECTIVE

Menghapus seluruh entitas data, akun pengguna, role membership, dan akun Supabase Auth yang dibuat khusus untuk fitur Role Preview, mengembalikan basis data ke status bersih (*clean slate*) tanpa menyentuh data produksi.

---

## 2. AUTOMATED TEARDOWN EXECUTION

Jalankan perintah berikut di terminal:

```bash
node scripts/teardown-role-preview.mjs
```

### Safety Filters yang Ditegakkan:
1. **Explicit Identity Filtering**:
   Hanya menghapus user dengan email `preview.%@madev.id`.
2. **Explicit ID Filtering**:
   Hanya menghapus relasi, santri, dan asrama dengan id `preview_%` atau `wsr_preview_%`.
3. **Strict Immunity**:
   Akun `superadmin@madev.id` dan seluruh admin tenant non-preview secara mutlak kebal dari operasi penghapusan.

---

## 3. MANUAL SQL VERIFICATION

Setelah eksekusi skrip selesai, jalankan query berikut untuk memverifikasi kebersihan sistem:

```sql
-- 1. Pastikan seluruh akun auth preview telah terhapus
SELECT count(*) FROM auth.users WHERE email LIKE 'preview.%@madev.id'; -- Ekspektasi: 0

-- 2. Pastikan seluruh profil public.users preview telah terhapus
SELECT count(*) FROM public.users WHERE email LIKE 'preview.%@madev.id'; -- Ekspektasi: 0

-- 3. Pastikan santri preview telah terhapus
SELECT count(*) FROM public.santri WHERE id LIKE 'preview_%'; -- Ekspektasi: 0

-- 4. Pastikan asrama preview telah terhapus
SELECT count(*) FROM public.asrama WHERE id LIKE 'preview_%'; -- Ekspektasi: 0

-- 5. Pastikan akun produksi superadmin tetap utuh
SELECT email, role, status FROM public.users WHERE email = 'superadmin@madev.id'; -- Ekspektasi: 1 row
```
