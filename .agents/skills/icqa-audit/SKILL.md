---
name: icqa-audit
description: Prosedur operasional eksekusi audit mutu independen Gate D untuk sistem APP MA'HAD dalam mode STRICT READ-ONLY.
---

# ICQA AUDIT SKILL — PROSEDUR AUDIT GATE D INDEPENDEN

Gunakan skill ini saat menjalankan evaluasi Gate D pada suatu kandidat rilis atau work package.

## ATURAN READ-ONLY MUTLAK
- Jangan mengubah, menambah, atau memformat ulang file kode aplikasi atau test.
- Jangan menginstal dependensi baru atau memodifikasi konfigurasi database/Supabase.
- Jalankan seluruh perintah terminal dengan flags non-destruktif.

---

## WORKFLOW EKSEKUSI AUDIT

### Langkah 1 — Verifikasi Status Working Tree & Scope
1. Jalankan `git status --short` untuk memetakan file yang dimodifikasi dan file baru.
2. Periksa apakah mutasi file mematuhi batasan `allowedPaths` pada Work Package terkait.
3. Jalankan `git diff --check` untuk memverifikasi tidak ada konflik merge atau trailing whitespace errors.

### Langkah 2 — Verifikasi Kompilasi TypeScript
Jalankan kompilasi TypeScript murni tanpa menghasilkan file output:
```powershell
npx tsc --noEmit
```
- **Kriteria Lolos:** Exit code 0 (nol error, nol warning).
- **Jika Gagal:** Catat file, nomor baris, dan kode error (TSxxxx).

### Langkah 3 — Eksekusi Pengujian Otomatis Lokal (Vitest)
Jalankan test suite yang relevan terhadap modul yang diaudit:
```powershell
npx vitest run <path_to_test_files>
```
- Catat: jumlah test file, total test kasus, durasi eksekusi, dan exit code.
- Pastikan tidak ada test yang dilewati (`skipped`) atau disamarkan.

### Langkah 4 — Adversarial Code Review & Security Analysis
Lakukan penelusuran kode terhadap file yang berubah dengan fokus skeptis:
1. **Otorisasi Server:** Apakah rute memanggil `supabase.auth.getUser()` dan `getEffectivePermissions()`?
2. **Anti-Bypass:** Apakah ada fallback berbasis header klien (`headerRole === 'admin_keuangan'`)?
3. **Isolasi Tenant:** Apakah parameter `tenantId` dari URL/body dicocokkan dengan session server?
4. **Error Fail-Closed:** Apakah blok catch menyembunyikan stack trace internal dari respon JSON?

### Langkah 5 — Verifikasi Integritas Biner (Khusus Ekspor XLSX/PDF)
Untuk berkas ekspor:
1. Jalankan skrip verifikasi in-memory (di `scratch/`) untuk memuat buffer ke `ExcelJS.Workbook` atau `pdf-lib PDFDocument.load()`.
2. Buktikan struktur berkas: orientasi halaman, jumlah baris/halaman, tipe cell numerik (bukan string), dan sanitasi formula (`sanitizeExcelFormulaCell`).

### Langkah 6 — Kompilasi Dokumen Independent Quality Dossier
Susun laporan sesuai template: `.agents/templates/audit-dossier-template.md`.
Tentukan vonis mutu akhir:
- **`PASS`**: Jika seluruh kriteria terpenuhi dan nol temuan CRITICAL/HIGH.
- **`PASS WITH CONDITIONS`**: Jika ada temuan non-kritis (MEDIUM/LOW) dengan rencana remediasi jelas.
- **`FAIL`**: Jika ditemukan celah keamanan, cacat data finansial, atau kegagalan kompilasi.
