# EEOS — ROLE PREVIEW TEST MATRIX & SECURITY VALIDATION
# WP-LOGIN-INSTANT-ROLE-PREVIEW-001

```text
WORK PACKAGE:           WP-LOGIN-INSTANT-ROLE-PREVIEW-001
DOCUMENT:               ROLE PREVIEW VERIFICATION & ADVERSARIAL TEST MATRIX
TEST SCOPE:             6 Functional Roles + 7 Negative Security Scenarios + Regression
INTEGRITY:              Fail-Closed Security Verification
```

---

## 1. FUNCTIONAL ROLE PREVIEW TEST MATRIX

Setiap role preview wajib diuji secara fungsional untuk membuktikan otentikasi session nyata dan kesesuaian tampilan dashboard:

```text
┌────┬──────────────────────┬─────────────────────────────┬──────────────────────────┬─────────────────────────────┬────────┐
│ #  │ Target Role          │ Server Identity             │ Context / Claims         │ Target URL & View           │ Status │
├────┼──────────────────────┼─────────────────────────────┼──────────────────────────┼─────────────────────────────┼────────┤
│ 01 │ Developer / Owner    │ preview.developer@madev.id  │ Platform (DEVELOPER)     │ /dashboard (Developer View) │ PASS   │
│ 02 │ Super Admin Platform │ preview.superadmin@madev.id │ Platform (SUPER_ADMIN)   │ /dashboard (Helicopter/SaaS)│ PASS   │
│ 03 │ Admin Pesantren      │ preview.admin@madev.id      │ Tenant t_..._9g7lm       │ /dashboard (Admin View)     │ PASS   │
│ 04 │ Musyrif Asrama       │ preview.musyrif@madev.id    │ Tenant t_..._9g7lm       │ /dashboard (Musyrif View)   │ PASS   │
│ 05 │ Wali Santri          │ preview.wali@madev.id       │ Tenant + Child Santri    │ /dashboard (Wali View)      │ PASS   │
│ 06 │ Santri               │ preview.santri@madev.id     │ Tenant + Santri Persona  │ /dashboard (Santri View)    │ PASS   │
└────┴──────────────────────┴─────────────────────────────┴──────────────────────────┴─────────────────────────────┴────────┘
```

---

## 2. NEGATIVE SECURITY TEST MATRIX (ADVERSARIAL ATTACK RESISTANCE)

Pemeriksaan keamanan adversial untuk memastikan tidak ada celah eksploitasi:

```text
┌────┬────────────────────────────────────┬───────────────────────────────────────┬──────────────────────┬────────┐
│ #  │ Skenario Pengujian                 │ Vektor Serangan / Percobaan           │ Ekspektasi Keamanan  │ Status │
├────┼────────────────────────────────────┼───────────────────────────────────────┼──────────────────────┼────────┤
│ 01 │ Production Mode Guard              │ NODE_ENV=production -> Call API       │ HTTP 403 FORBIDDEN   │ PASS   │
│ 02 │ Feature Flag Disabled              │ ROLE_PREVIEW_ENABLED=false -> Call API│ HTTP 403 FORBIDDEN   │ PASS   │
│ 03 │ Invalid / Unknown Role             │ POST /api/auth/role-preview { role: X }│ HTTP 400 BAD REQUEST │ PASS   │
│ 04 │ Tenant ID Injection                │ Header/body disuntik x-tenant-id palsu│ Diabaikan oleh server│ PASS   │
│ 05 │ Role Privilege Escalation          │ Mengubah role di localStorage browser │ Server menolak claim │ PASS   │
│ 06 │ Non-Preview Production Impersonation│ Mencoba login akun riil via preview  │ Ditolak (Allowlist)  │ PASS   │
│ 07 │ Secret Exfiltration in Client      │ Periksa bundle browser untuk password │ NOL secret bocor     │ PASS   │
└────┴────────────────────────────────────┴───────────────────────────────────────┴──────────────────────┴────────┘
```

---

## 3. REGRESSION TEST MATRIX (CORE PRODUCTION AUTHENTICATION)

Memastikan jalur masuk normal tidak terganggu oleh keberadaan sistem Role Preview:

```text
┌────┬────────────────────────────────────┬───────────────────────────────────────┬──────────────────────┬────────┐
│ #  │ Fitur Produksi                     │ Verifikasi                            │ Ekspektasi           │ Status │
├────┼────────────────────────────────────┼───────────────────────────────────────┼──────────────────────┼────────┤
│ 01 │ Normal Form Login                  │ Form email + password normal          │ Berfungsi normal     │ PASS   │
│ 02 │ Supabase Auth signInWithPassword   │ Autentikasi akun normal               │ Berfungsi normal     │ PASS   │
│ 03 │ Remember Me Checkbox               │ Simpan email di localStorage          │ Berfungsi normal     │ PASS   │
│ 04 │ Edge Proxy Header Decoration       │ Validasi session & injeksi header     │ Berfungsi normal     │ PASS   │
│ 05 │ WP-02 Database Constraints         │ Integritas tenant_id santri & NIS     │ Berfungsi normal     │ PASS   │
└────┴────────────────────────────────────┴───────────────────────────────────────┴──────────────────────┴────────┘
```
