# DECISION-BRIEF-M2-FINANCE-ARCHITECTURE-011-FOR-PO
## Ringkasan Eksekutif Keputusan Product Owner (Decision Brief for PO)

**Work Package:** M2-FINANCE-ARCHITECTURE-011  
**Sistem:** APP MA’HAD — Finance, Internal RFID Payment, Wallet, POS & Tenant Merchant Architecture  
**Penerima:** Product Owner (`Process_PO`) & Acting Process_Mandor (`Mandor 2`)  
**Penyusun:** ZenOrion — Antigravity Lead Agent / Independent Principal Systems Architect  
**Tujuan Dokumen:** Menyajikan keputusan bisnis & teknis esensial yang siap diputuskan langsung oleh PO tanpa harus membaca seluruh riwayat audit teknis.  
**Tanggal:** 19 Oktober 2026  

---

## 1. KEPUTUSAN TINGKAT 1 (CRITICAL BLOCKERS SEBELUM IMPLEMENTASI / CODING)

Keputusan berikut **WAJIB DISETUJUI** agar pekerjaan pengkodean (Work Package implementasi) dapat dimulai secara aman:

### DEC-01: Algoritma Hashing PIN Kartu RFID Santri
- **Pertanyaan Keputusan:** Algoritma apa yang digunakan untuk mengenkripsi/menghash PIN santri di database?
- **Pilihan:**
  - **Opsi A (Rekomendasi Arsitek):** **PBKDF2-HMAC-SHA256 (100.000 iterasi) + Salt + Server-Side Pepper**. Menggunakan modul bawaan `node:crypto`, nol instalasi biner C++, sangat stabil pada runtime serverless Next.js Vercel, latensi kilat ~15–30 ms (antrean kasir lancar).
  - **Opsi B:** **Argon2id (`m=19MiB, t=2, p=1`)**. Standar memori OWASP, tetapi memerlukan dependensi native binary C++ (`@node-rs/argon2`) yang berisiko kendala build di runtime serverless.
- **Risiko Jika Ditunda:** Menghambat pembuatan skema migrasi tabel `rfid_cards` dan penulisan handler verifikasi PIN.
- **Rekomendasi:** **PILIH OPSI A**.

---

### DEC-08 & DEC-09: Kebijakan Penanganan Anomali Data Warisan (Preflight Saldo Minus & Duplikat Dompet)
- **Pertanyaan Keputusan:** Bagaimana sikap sistem jika saat pemeriksaan awal database pra-migrasi ditemukan saldo santri minus atau akun dompet duplikat?
- **Pilihan:**
  - **Opsi A (Rekomendasi Arsitek):** **Kebijakan Fail-Closed (Eskalasi Manual)**. Migrasi otomatis dibatalkan, sistem dilarang mereset saldo atau menghapus data secara otomatis. Data anomali dilaporkan ke Admin Keuangan pesantren untuk direkonsiliasi manual.
  - **Opsi B:** **Otomatisasi Sistem**. Reset saldo minus menjadi Rp 0 dan hapus baris duplikat secara otomatis.
- **Risiko Jika Ditunda:** DDL constraint integritas (`CHECK balance >= 0` dan `UNIQUE santri`) tidak dapat diterapkan ke database.
- **Rekomendasi:** **PILIH OPSI A** (Menjaga keutuhan dana santri dan kepatuhan audit fidusia).

---

## 2. KEPUTUSAN TINGKAT 2 (PRE-STAGING REQUIREMENTS / DETAIL OPERASIONAL)

Keputusan ini tidak menghambat coding awal, tetapi wajib diputuskan sebelum sistem diuji coba di lingkungan staging:

### DEC-10: Batas Kewenangan Kasir Melakukan Pembatalan / Refund Transaksi
- **Pertanyaan Keputusan:** Apakah kasir kantin diizinkan membatalkan transaksi salah input secara mandiri?
- **Pilihan:**
  - **Opsi A (Rekomendasi Arsitek):** **Jendela Waktu 5 Menit**. Kasir dapat membatalkan transaksi mandiri hanya dalam 5 menit pertama di terminal yang sama (misal salah pencet barang). Melebihi 5 menit, pembatalan wajib disetujui Admin Keuangan.
  - **Opsi B:** Kasir dilarang refund sama sekali (seluruh refund harus ke kantor Admin Keuangan).
- **Rekomendasi:** **PILIH OPSI A** (Menjaga kelancaran antrean makan santri tanpa membuka celah fraud kasir).

---

### DEC-04: Retensi Penyimpanan Kunci Idempotensi
- **Pertanyaan Keputusan:** Berapa lama kunci idempotensi kasir disimpan untuk mencegah transaksi ganda?
- **Pilihan:**
  - **Opsi A (Rekomendasi Arsitek):** Disimpan permanen langsung pada baris header transaksi kasir (`canteen_transactions`). Sederhana, tanpa beban cron pembersihan berkala, kebal replay selamanya.
  - **Opsi B:** Tabel terpisah dengan penghapusan otomatis setelah 30 hari.
- **Rekomendasi:** **PILIH OPSI A**.

---

## 3. KEPUTUSAN TINGKAT 3 (KEBIJAKAN BISNIS NON-BLOCKING SEBELUM GO-LIVE)

Dapat diputuskan seiring proses rekayasa berlangsung:

### DEC-11: Kebijakan Pengembalian Saldo Terpadu Model B
- Kebijakan saat santri lulus atau pindah pondok: sisa saldo dikembalikan via transfer rekening bank wali atau dialihkan sebagai donasi/infaq pondok atas persetujuan tertulis wali santri.

### DEC-12: Jadwal Settlement Merchant Rekanan (Model 1 & Model 3)
- Siklus penarikan dana bagi hasil operator kantin disepakati mingguan atau bulanan melalui menu rekapitulasi merchant.

---

## 4. LEMBAR PERNYATAAN RATIFIKASI PRODUCT OWNER

Dengan ini Product Owner:
1. **Menyetujui & Meratifikasi Desain Konsolidasi M2-010**: `[ YA / DENGAN CATATAN ]`
2. **Memilih Opsi Algoritma PIN (DEC-01)**: `[ OPSI A (PBKDF2) / OPSI B (ARGON2ID) ]`
3. **Memilih Kebijakan Preflight Data (DEC-08 & DEC-09)**: `[ OPSI A (FAIL-CLOSED) / OPSI B ]`
4. **Memilih Kebijakan Refund Kasir (DEC-10)**: `[ OPSI A (5 MENIT) / OPSI B ]`
5. **Menerbitkan Mandat Implementasi Rekayasa**: `[ BELUM / DITERBITKAN SEBAGAI WP-M2-012 ]`

---
*Dokumen ini diserahkan untuk proses penandatanganan dan ratifikasi resmi oleh Product Owner.*
