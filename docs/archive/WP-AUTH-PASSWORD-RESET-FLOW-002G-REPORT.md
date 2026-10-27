# WP-AUTH-PASSWORD-RESET-FLOW-002G REPORT
## Deep Preview Resend Credential & Runtime Verification Audit

**Date**: October 01, 2026  
**Status**: **PREVIEW DEPLOYMENT FRESH BUT RESEND RUNTIME CREDENTIAL NOT PROVABLE (READY FOR ONE CONTROLLED REAL E2E TEST)**  
**Role**: Senior Architectural Partner & Verification Agent  
**Safety Compliance**: Strictly Read-Only Diagnostic, 0 Mutations to Code, 0 Database Mutations, 0 Auth Mutations, 0 Emails Sent, 0 Vercel Environment Mutations, Production Baseline Preserved (`a4a7e1a`), Customer Admin Untouched (`abu.thohir.zmr92@gmail.com`).

---

## 1. Executive Summary

Work Package **WP-AUTH-PASSWORD-RESET-FLOW-002G** melakukan audit forensik baca-saja (*deep read-only forensic audit*) terhadap lingkungan Vercel Preview proyek `os-darta`. Audit ini membedah status deployment aktif, metadata environment variables di Vercel, timeline pembaruan secret vs pembuatan deployment, korelasi log runtime, serta isolasi keamanan produksi untuk memastikan kesiapan sistem sebelum pengujian E2E pemulihan kata sandi nyata.

### Temuan Forensik Kunci:
1. **Deployment Aktif Saat Ini Adalah Deployment Baru (Fresh)**:
   - Deployment aktif yang mengikat alias wildcard `*.serzen-dev.my.id` dan `os-darta-git-preview-serzen-dev.vercel.app` adalah **`dpl_EWY7sZhtXSyNgdVC5BAH3GBKvaPu`** (`os-darta-1ucgdnghn-serzen-dev.vercel.app`).
   - Deployment ini berstatus **`● Ready`**, dibangun dari commit `13db025` (branch `preview`).
2. **Timeline Terbukti Valid (T4 > T3)**:
   - Pembaruan `RESEND_API_KEY` di Vercel Project Secrets selesai pada **11:33:42 WIB**.
   - Deployment `dpl_EWY7sZhtXSyNgdVC5BAH3GBKvaPu` dipicu pada **11:34:06 WIB** dan selesai (*Ready*) pada **11:35:45 WIB**.
   - Ini membuktikan deployment aktif saat ini dibangun **SETELAH** secret diperbarui di Vercel.
3. **Analisis Error Sebelumnya Terisolasi pada Deployment Lama**:
   - Error `[ResendService] Password reset dispatch failed with error name: validation_error` terjadi pada **11:26:07 WIB** pada deployment **SEBELUMNYA** (`dpl_EZNx8A3jKsVwhPyfsX5ZNVP7HF28`).
   - Pada deployment baru (`dpl_EWY7sZhtXSyNgdVC5BAH3GBKvaPu`), tercatat **0 error log** dan **0 pemanggilan API** karena belum ada request baru yang disubmit sejak deployment ini aktif.
4. **Isolasi Produksi & SR2601 100% Terjaga**:
   - Production branch `main` (`a4a7e1a`), domain `https://pp-darunnajah.serzen-dev.my.id` (HTTP 200), dan admin `abu.thohir.zmr92@gmail.com` tidak pernah tersentuh.

---

## 2. Git & Source Baseline Evidence

| Parameter | Authoritative Value | Verifikasi |
| :--- | :--- | :---: |
| **Git Current Branch** | `preview` | ✅ Terverifikasi |
| **Git HEAD SHA** | `13db025cba4cd3ed10180cffa755335849cd7b74` | ✅ Terverifikasi |
| **Git Origin Preview** | `13db025cba4cd3ed10180cffa755335849cd7b74` | ✅ Identik dengan lokal |
| **Git Production Main** | `a4a7e1a8feca0942688bfdbb10361076b1fb3110` | ✅ Terkunci & Utuh |
| **Working Tree** | Bersih dari modifikasi file terlacak (`git status --short`) | ✅ Bersih |
| **Fitur Pemulihan** | Diimplementasikan pada `3e9b2e1`, termuat di `13db025` | ✅ Terkonfirmasi |

---

## 3. Preview Deployment Forensic Evidence

Berdasarkan inspeksi Vercel CLI (`npx vercel inspect` dan `npx vercel alias ls`):

- **Active Preview Deployment ID**: `dpl_EWY7sZhtXSyNgdVC5BAH3GBKvaPu`
- **Deployment URL**: `https://os-darta-1ucgdnghn-serzen-dev.vercel.app`
- **Target Environment**: `preview`
- **Branch**: `preview`
- **Commit SHA**: `13db025`
- **Created Timestamp**: `Thu Oct 01 2026 11:34:06 GMT+0700` (`04:34:06 UTC`)
- **Ready Timestamp**: `Thu Oct 01 2026 11:35:45 GMT+0700` (`04:35:45 UTC`)
- **Status**: **`● Ready`**
- **Durasi Build**: `1m 36s`
- **Domain Aliases Aktif Terikat**:
  - `https://*.serzen-dev.my.id` $\rightarrow$ mengarah langsung ke `os-darta-1ucgdnghn-serzen-dev.vercel.app`
  - `https://os-darta-git-preview-serzen-dev.vercel.app` $\rightarrow$ mengarah langsung ke `os-darta-1ucgdnghn-serzen-dev.vercel.app`

---

## 4. Vercel Environment Variable Metadata Forensics

Inspeksi metadata variabel lingkungan via `npx vercel env ls` pada proyek `serzen-dev/os-darta`:

```text
 name               value     type      environments                        created
 RESEND_FROM_EMAIL  Hidden    Secret    Preview                             6d ago
 RESEND_API_KEY     Hidden    Secret    Production, Preview, Development    9d ago (Overridden)
```

### Catatan Forensik Secret:
- Variabel `RESEND_API_KEY` berstatus `Secret` dengan cakupan mencakup `Preview`, `Production`, dan `Development`.
- Operasi override kredensial dieksekusi sebelum pemicuan build `dpl_EWY7sZhtXSyNgdVC5BAH3GBKvaPu`.
- Nilai secret tidak pernah diekspos dalam log ataupun terminal.

---

## 5. Deployment vs Secret Update Timeline

```text
[11:26:07 WIB] T0: Request #2 submit di browser -> GAGAL pada deployment lama (dpl_EZNx8A3j...)
                   (Log mencatat: error name: validation_error)
[11:32:52 WIB] T1: Kunci baru disinkronkan ke .env.local
[11:32:58 WIB] T2: Validasi baca-saja SDK lokal terhadap GET /domains -> PASS (serzen-dev.my.id)
[11:33:42 WIB] T3: Kunci baru di-override ke Vercel Project Secrets (Production, Preview, Dev)
[11:34:06 WIB] T4: Deployment Preview baru dpl_EWY7sZhtXSyNgdVC5BAH3GBKvaPu dibuat
[11:35:45 WIB] T5: Deployment dpl_EWY7sZhtXSyNgdVC5BAH3GBKvaPu berstatus ● Ready & Wildcard Terikat
[11:36:00+ WIB] T6: Aktivitas Resend pada deployment dpl_EWY7sZhtXSyNgdVC5BAH3GBKvaPu: 0 request
```

**Evaluasi Kausalitas**:
- **T4 (`11:34:06`) > T3 (`11:33:42`)**: Terbukti secara definitif bahwa deployment yang aktif saat ini dibangun setelah pembaruan variabel lingkungan di Vercel.
- Seluruh insiden kegagalan pengiriman sebelumnya berada pada rentang waktu `11:26 WIB` (deployment lama `dpl_EZNx8A3j...`).

---

## 6. Runtime Log Forensics (Deployment Aktif)

Pemeriksaan log runtime resmi untuk deployment aktif `dpl_EWY7sZhtXSyNgdVC5BAH3GBKvaPu` (`npx vercel logs dpl_EWY7sZhtXSyNgdVC5BAH3GBKvaPu -n 100`):

```text
Resolving deployment "dpl_EWY7sZhtXSyNgdVC5BAH3GBKvaPu"
Fetching project "prj_fdARhHk53BT2w84tZBUVq23mqEQJ"
Fetching logs...
No logs found for serzen-dev/os-darta
```

### Hasil Forensik Log:
- **Zero Errors**: Tidak ada error `validation_error`, `401`, `403`, ataupun kegagalan runtime pada deployment ini.
- **Zero Requests**: Belum ada request Forgot Password yang dieksekusi terhadap deployment ini sejak aktif pada `11:35:45 WIB`.
- Timestamp Supabase Auth pengguna `budgetinbyserzen@gmail.com` tetap berada pada `2026-10-01T04:26:09.973602Z` (terakhir diproses saat insiden deployment lama).

---

## 7. Resend Credential & Sender Evidence

1. **Safe Non-Send Validation**:
   Skrip diagnostik baca-saja `scratch/safe_resend_validation.ts` memanggil `resend.domains.list()`:
   ```json
   {
     "status": "VALID",
     "domainCount": 1,
     "domains": ["serzen-dev.my.id"]
   }
   ```
   Terkonfirmasi domain `serzen-dev.my.id` aktif dan terhubung dengan kunci baru.
2. **Sender Address Resolution**:
   Fungsi `resolveSenderEmail()` mengonfigurasi `Ma'had Manager <noreply@serzen-dev.my.id>`. Domain pengirim terbukti lolos dari guard `PROHIBITED_SENDER_DOMAIN`.

---

## 8. Application Flow & Architectural Boundary Audit

Audit kode statis (read-only) terhadap alur pemulihan kata sandi:
- **Server-Only Boundary**: `src/lib/email/resend-service.ts` memuat `import 'server-only';`.
- **Secret Isolation**: `process.env.RESEND_API_KEY` diakses secara strictly server-side. Tidak ada pemanggilan terhadap `NEXT_PUBLIC_RESEND_API_KEY`.
- **Pemisahan Alur Undangan vs Pemulihan**:
  - `type=invite` $\rightarrow$ `/auth/set-password` $\rightarrow$ `/api/auth/complete-onboarding`.
  - `type=recovery` $\rightarrow$ `/auth/reset-password` $\rightarrow$ `supabase.auth.updateUser()` $\rightarrow$ `supabase.auth.signOut()`.
- **Perlindungan Enumerasi**: API `POST /api/auth/forgot-password` mengembalikan payload identik `200 OK` netral.
- **Perlindungan Identitas `MERGED`**: Akun berstatus `MERGED`, `DISABLED`, atau `SUSPENDED` ditolak dari pemulihan.

---

## 9. Security Audit & Secret Hygiene

- **Pemeriksaan Repositori (`src/`, `tests/`)**: Bebas dari nilai kunci API Resend plaintext.
- **Pemeriksaan Dokumen Arsitektur**: String kunci yang sempat terpapar pada draf laporan `WP-002E` telah diredaksi secara permanen.
- **Tracking Git (`.env.local`)**: File `.env.local` tetap diabaikan oleh Git (`git ls-files .env.local` menghasilkan 0 output).
- **Zero Secrets Logged**: Tidak ada password, token autentikasi, ataupun API key yang dicetak dalam laporan ini.

---

## 10. Production Isolation Audit

| Parameter Produksi | Hasil Audit | Status |
| :--- | :--- | :---: |
| **Commit Target** | `a4a7e1a` (Branch `main`) | ✅ Utuh |
| **Production Domain** | `https://pp-darunnajah.serzen-dev.my.id` $\rightarrow$ `HTTP 200` | ✅ Aktif & Normal |
| **Production Deployment ID**| `os-darta-hf66ieqah-serzen-dev.vercel.app` | ✅ Tidak Termutasi |
| **SR2601 Tenant Data** | `t_1790171191747_pyv9n` / `pp-darunnajah` | ✅ Utuh |
| **SR2601 Admin Account**| `abu.thohir.zmr92@gmail.com` | ✅ Tidak Ada Pemulihan |

---

## 11. Known Limitations

Dalam arsitektur *Vercel Serverless Function*, variabel lingkungan di dalam container serverless runtime hanya dieksekusi ketika sebuah fungsi API secara nyata dipanggil oleh request HTTP. Karena aplikasi tidak memiliki endpoint publik baca-saja khusus untuk memeriksa status inisialisasi Resend dari dalam container tanpa mengirim email, maka keabsahan kredensial di dalam container serverless runtime secara definitif baru terbukti 100% saat pemanggilan pertama dilakukan.

---

## 12. Final Classification

Sesuai kriteria Bagian 13 direktif WP-002G, klasifikasi resmi adalah:

👉 **`B. PREVIEW DEPLOYMENT FRESH BUT RESEND RUNTIME CREDENTIAL NOT PROVABLE`**

*Makna Klasifikasi*:
- Deployment Preview aktif (`dpl_EWY7sZhtXSyNgdVC5BAH3GBKvaPu`) terbukti *fresh* dan dibangun setelah pembaruan secret (T4 > T3).
- Metadata variabel lingkungan Vercel dan isolasi kode terverifikasi bersih dan benar.
- Error sebelumnya terbukti hanya milik deployment lama (`dpl_EZNx8A3j...`).
- Namun, eksekusi nyata kredensial di dalam runtime serverless cloud tidak dapat dibuktikan secara independen tanpa melakukan satu pengujian nyata (*real dispatch*).

---

## 13. Hard Stop & Recommended Next Gate

Sesuai protokol **HARD STOP** Bagian 15, agen berhenti di sini dan tidak melakukan mutasi apa pun.

### Rekomendasi Gerbang Selanjutnya (Next Gate):
Sistem kini berada dalam kondisi prima untuk dieksekusi:
👉 **Lakukan 1x Pengujian Nyata (*One Real Controlled Password Recovery E2E Test*)**:
1. Product Owner membuka `https://pp-darululum.serzen-dev.my.id/login` di browser terotentikasi Vercel SSO.
2. Klik **Lupa Password?** $\rightarrow$ masukkan `budgetinbyserzen@gmail.com` $\rightarrow$ Submit **satu kali**.
3. Agen akan membaca Resend API untuk mengonfirmasi kemunculan **New Message ID**.
