# REPORT-M2-FINANCE-RFID-DESIGN-CORRECTION-001
## Laporan Hasil Verifikasi & Penerapan Koreksi Desain Remediasi Transaksi RFID

**Project:** APP MA’HAD / Os_Darta  
**Lead Agent:** ZenOrion — Antigravity Lead Agent  
**Otoritas:** Process_PO (Product Owner) & Acting Process_Mandor (Mandor 2)  
**Mandate Type:** Design Correction & Verification (M2-FINANCE-ARCHITECTURE-008)  
**Mode Operasi:** STRICT READ-ONLY  
**Target Utama:** `docs/architecture/DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-002.md`  
**Laporan Acuan:** `docs/architecture/REPORT-M2-FINANCE-RFID-INDEPENDENT-DESIGN-REVIEW-001.md`  
**Hasil Konsolidasi:** `docs/architecture/DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-003.md`  
**Status Desain:** DESIGN RATIFICATION PENDING PO REVIEW  
**Otorisasi Implementasi:** NOT AUTHORIZED  
**Tanggal:** 19 Oktober 2026  

---

## 1. STATUS EVALUASI TIGA KONDISI WAJIB

Berdasarkan pemeriksaan komparatif independen, seluruh tiga kondisi wajib yang diamanatkan dalam laporan independent review telah ditindaklanjuti secara penuh ke dalam dokumen konsolidasi **`DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-003.md`**:

| ID Kondisi | Area Perbaikan | Status Kepatuhan | Bagian / Heading Dokumen Pendukung |
|---|---|---|---|
| **Koreksi A** | Idempotency & Penanganan PostgreSQL Error `23505 unique_violation` | **`RESOLVED IN DRAFT`** | `DRAFT-003`: Bab 8.2 & Bab 8.3 ("Penanganan Benturan Konkurensi (23505 unique_violation)") |
| **Koreksi B** | Sinkronisasi Skema `response_payload jsonb` | **`RESOLVED IN DRAFT`** | `DRAFT-003`: Bab 8.4 ("Struktur response_payload") & Bab 9.1 ("Relasi Tabel POS Transaksi yang Diselaraskan") |
| **Koreksi C** | Penafian Benchmark & Penyelarasan Kriptografi KDF | **`RESOLVED IN DRAFT`** | `DRAFT-003`: Bab 6.1 & Bab 6.2 ("Penafian Benchmark (Benchmark Disclaimer)") |

---

## 2. DETAIL PERUBAHAN TEKSTUAL DAN TEKNIS YANG DITERAPKAN

### 2.1 Koreksi A: Idempotensi dan Penanganan Error PostgreSQL `23505`
- **Kelemahan Awal pada Draf 002**:
  Draf 002 hanya membahas skenario di mana request kedua tiba *setelah* transaksi pertama commit. Draf 002 belum mengantisipasi jika Request 1 dan Request 2 tiba bersamaan dalam milidetik yang sama, di mana Request 2 terlepas dari antrean lock `wallets` lalu menabrak constraint unik `canteen_transactions_tenant_id_idempotency_key_unique` dan melempar error `23505`.
- **Perubahan yang Diterapkan pada Draf 003 (Bab 8.3)**:
  1. Spesifikasi menambahkan mekanisme *Catch-and-Recover* khusus untuk error code `23505` yang spesifik berasal dari constraint `canteen_transactions_tenant_id_idempotency_key_unique`.
  2. Error `23505` dari constraint lain (seperti Primary Key ID atau Santri ID) tidak diabaikan melainkan dilempar kembali (*re-throw*).
  3. Saat `23505` tertangkap, aplikasi mengeksekusi *recovery query* untuk mengambil baris transaksi yang baru saja dicommit oleh request konkuren.
  4. Jika `request_hash` cocok dan status transaksi `'SUCCESS'`, sistem langsung mengembalikan `response_payload` dengan status **HTTP 200** dan header `X-Idempotent-Replay: true`.
  5. Jika `request_hash` berbeda, sistem menolak transaksi dengan **HTTP 409 Conflict**.
  6. Jika query pemulihan gagal akibat gangguan koneksi database transien, sistem mengembalikan **HTTP 503 Service Unavailable** yang menginstruksikan client kasir untuk mencoba kembali secara aman tanpa mendebit ulang saldo.

### 2.2 Koreksi B: Sinkronisasi Kolom `response_payload jsonb`
- **Kelemahan Awal pada Draf 002**:
  Kolom `response_payload` disebut dalam narasi Bab 8.1, namun hilang dari diagram relasi tabel Bab 9.1.
- **Perubahan yang Diterapkan pada Draf 003 (Bab 8.4 & Bab 9.1)**:
  1. Kolom `response_payload: jsonb NOT NULL` ditambahkan secara eksplisit ke dalam definisi tabel `canteen_transactions`.
  2. Ditegaskan bahwa `response_payload` ditulis di dalam transaksi database ACID yang sama dengan debit saldo, sehingga tidak ada kondisi saldo terpotong tanpa payload respon tersimpan.
  3. Ditetapkan aturan keamanan bahwa `response_payload` **TIDAK MEMUAT DATA SENSITIF** (tanpa PIN, tanpa salt, tanpa server pepper, tanpa token rahasia).

### 2.3 Koreksi C: Penafian Benchmark dan Evaluasi KDF
- **Kelemahan Awal pada Draf 002**:
  Mencantumkan angka latensi (15–30 ms untuk PBKDF2 dan 40–80 ms untuk Argon2id) tanpa penafian eksplisit bahwa angka tersebut bukan hasil benchmark proyek.
- **Perubahan yang Diterapkan pada Draf 003 (Bab 6.2)**:
  1. Menambahkan kotak peringatan resmi (*Callout Alert*): `PENAFIAN BENCHMARK (BENCHMARK DISCLAIMER)` yang menyatakan bahwa angka latensi adalah proyeksi teoritis literatur pada hardware komoditas, dan benchmark empiris wajib dilaksanakan pada sandbox staging proyek Os_Darta sebelum parameter iterasi dikunci.
  2. Memperdalam analisis NIST SP 800-63B mengenai ancaman rahasia berentropi rendah (10.000–1.000.000 kombinasi) yang menegaskan bahwa *online 3x lockout* dan *server-side pepper* adalah pilar pertahanan primer, bukan jumlah iterasi KDF semata.
  3. Mempertahankan status algoritma final sebagai keputusan terbuka untuk ratifikasi PO.

---

## 3. KETIDAKKONSISTENAN YANG TERSISA
- **Status Inkonsistensi Teknis Antar-Dokumen**: **NIHIL (0 Inkonsistensi)**.
  - Seluruh bagian Draf 003 (narasi, diagram relasi tabel, penanganan error, dan matriks pengujian) telah diselaraskan 100%.
  - Matriks pengujian Bab 10 menyertakan `TC-IDM-03` khusus untuk memverifikasi penanganan error PostgreSQL `23505`.

---

## 4. KEPUTUSAN PRODUCT OWNER YANG MASIH MENUNGGU RATIFIKASI

Product Owner diharapkan menetapkan keputusan final atas:
1. **Pemilihan Algoritma Hashing PIN**:
   - *Opsi A (Rekomendasi Arsitek)*: **PBKDF2-HMAC-SHA256 (100.000 iterasi) + salt acak 16-byte + Server-Side Pepper**. Nol dependensi eksternal, ramah serverless Next.js.
   - *Opsi B*: **Argon2id (m=19456, t=2, p=1)**. Memory-hard standar OWASP, membutuhkan kompilasi native binary C++.
2. **Kebijakan Pembatalan / Refund Transaksi Kasir**:
   - Menetapkan otorisasi kasir dalam membatalkan transaksi salah input dalam batas waktu tertentu (misal 5 menit pertama) vs wajib persetujuan Admin Keuangan.
3. **Ratifikasi Formal Dokumen**:
   - Mengesahkan `DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-003.md` menjadi cetak biru spesifikasi resmi arsitektur APP MA'HAD.

---

## 5. DAFTAR FILE YANG DIBACA DAN DIBUAT

### Berkas yang Dibaca (Read-Only):
1. `src/app/api/canteen/pay/route.ts`
2. `src/app/api/webhooks/flip/route.ts`
3. `src/lib/db/schema/finance.ts`
4. `src/lib/db/schema/rfid.ts`
5. `drizzle/0000_neat_machine_man.sql`
6. `docs/spesifikasi-pembayaran.md`
7. `docs/architecture/DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-002.md`
8. `docs/architecture/REPORT-M2-FINANCE-RFID-INDEPENDENT-DESIGN-REVIEW-001.md`

### Berkas Laporan yang Dibuat (Architectural Documentation):
1. [`docs/architecture/DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-003.md`](file:///E:/Projects/Os_Darta/docs/architecture/DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-003.md) (Dokumen konsolidasi revisi)
2. [`docs/architecture/REPORT-M2-FINANCE-RFID-DESIGN-CORRECTION-001.md`](file:///E:/Projects/Os_Darta/docs/architecture/REPORT-M2-FINANCE-RFID-DESIGN-CORRECTION-001.md) (Laporan verifikasi koreksi)

---

## 6. PERNYATAAN KEPATUHAN READ-ONLY & STOP DECLARATION

- **Nol Kode Produksi Diubah**: Tidak ada baris kode pada `src/` atau skema database pada `drizzle/` yang dimutasi.
- **Nol Query Mutatif**: Tidak ada query DDL/DML, seeding, atau transaksi finansial nyata yang dieksekusi ke database.
- **Integritas Dokumen**: Dokumen `DRAFT-002` dan laporan review `REVIEW-001` tidak ditimpa dan tetap utuh.

---

**FINAL STATUS REVIEW ARSITEKTUR:**  
`DESIGN RATIFICATION: PENDING PO REVIEW`  
`IMPLEMENTATION: NOT AUTHORIZED`  

*Laporan verifikasi koreksi ini diserahkan kepada Product Owner (`Process_PO`) dan Acting Process_Mandor (`Mandor 2`). Lead Agent berhenti (STOP CONDITION).*
