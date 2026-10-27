# REPORT-M2-FINANCE-ARCHITECTURE-010-INDEPENDENT-REVIEW
## Laporan Evaluasi Independen Tingkat Akhir: Konsistensi Desain Arsitektur, Penguatan Keamanan, Skalabilitas, dan Penilaian Kesiapan Gerbang Implementasi Keuangan & Pembayaran RFID

**Work Package:** M2-FINANCE-ARCHITECTURE-010  
**Sistem:** APP MA’HAD — Finance, Internal RFID Payment, Wallet, POS & Tenant Merchant Architecture  
**Reviewer:** ZenOrion — Antigravity Lead Agent / Independent Principal Systems Architect  
**Otoritas:** Product Owner (`Process_PO`) & Acting Process_Mandor (`Mandor 2`)  
**Mode Operasi:** STRICT READ-ONLY / INDEPENDENT DESIGN-LEVEL AUDIT  
**Status Otorisasi Implementasi:** NOT GRANTED / STRICTLY PROHIBITED  
**Tanggal Evaluasi:** 19 Oktober 2026  

---

## 1. EXECUTIVE SUMMARY & OVERALL REVIEW DISPOSITION

Sesuai dengan mandat **M2-FINANCE-ARCHITECTURE-010**, telah dilaksanakan audit independen menyeluruh terhadap konsistensi desain arsitektur keuangan, dompet digital santri, pembayaran internal kartu RFID, integritas POS multi-merchant, serta model akuntansi platform APP MA'HAD setelah rangkaian pekerjaan M2-001 hingga M2-009.

Audit ini tidak sekadar merangkum laporan terdahulu atau memvalidasi label status administratif, melainkan menguji secara kritis koherensi teknis internal, pemisahan batas transaksi database, keamanan kredensial berentropi rendah, kompatibilitas driver database PostgreSQL, isolasi multi-tenant, dan model kepemilikan dana.

### STATUS GERBANG EVALUASI KESELURUHAN (OVERALL GATE DISPOSITION):
$$\mathbf{OVERALL\ GATE:\ PASS\ WITH\ CONDITIONS}$$

| Kriteria Penilaian Arsitektur | Disposisi Evaluasi | Ringkasan Justifikasi Berbasis Bukti |
|---|---|---|
| **Preservasi Keputusan PO yang Terkunci** | **PASS** | 100% patuh terhadap 12 keputusan mutlak PO: transaksi RFID 100% internal murni (tanpa gateway Flip, tanpa payment order, tanpa fee), hanya mendebit saldo uang saku santri, wajib PIN, auto-block setelah 3x salah, dan hak reset PIN dibatasi ketat hanya pada Wali Kelas binaan dan Admin Keuangan (Wali Santri & Super Admin dilarang). |
| **Keamanan PIN & Entropi Rendah** | **PASS WITH CONDITIONS** | Model ancaman PIN numerik 4–6 digit secara ilmiah valid (offline brute force <1 detik pada hash database tanpa pepper). Mengoreksi cacat desain M2-003/004: **Pencatatan kegagalan PIN dipisahkan dari transaksi finansial agar counter gagal tidak ter-rollback saat pembayaran batal**. Pemilihan KDF final tetap berstatus terbuka menunggu ratifikasi PO. |
| **Integritas Transaksi & Concurrency** | **PASS WITH CONDITIONS** | Penyelarasan row-level locking (`FOR UPDATE`) pada kedua penulis saldo (`/api/canteen/pay` dan `/api/webhooks/flip`) menutup celah *Double Spending* dan *Lost Update*. Penanganan PostgreSQL error `23505 unique_violation` diperbaiki: recovery query dijalankan setelah rollback transaksi yang gagal, bukan di dalam transaksi yang teraborsi (*aborted transaction*). |
| **Idempotensi & Kanonikalisasi Request** | **PASS** | Format hash kanonis SHA-256 terdefinisi deterministik tanpa melibatkan kredensial PIN. Menolak tegas request dengan kunci sama ber-payload beda (*HTTP 409 Conflict*), dan mengembalikan salinan respon struk asli (*HTTP 200*) untuk replay identik. |
| **Struktur POS & 3 Model Merchant PO** | **PASS** | Struktur relasional `canteen_transaction_items` menyimpan snapshot harga historis, mendukung transaksi nonfisik (`obligation_payment`), dan memetakan 3 model merchant PO: Model 1 (Revenue Share), Model 2 (100% Pondok dengan Buku Kas Merchant), dan Model 3 (100% Hak Operator Rekanan). |
| **Pemisahan Domain Ledger & Kepemilikan Dana** | **PASS** | Membedakan secara mutlak 5 domain dana: Pendapatan Pondok, Payable Operator, Liabilitas Uang Saku, Tabungan Santri, dan Saldo Terpadu Model B. Nol percampuran dana titipan menjadi pendapatan. |
| **Kesiapan Migrasi Data Warisan (Preflight Safety)** | **PASS WITH CONDITIONS** | Matriks query read-only preflight dirancang untuk mendeteksi anomali data (saldo minus dan dompet duplikat) sebelum DDL constraint dieksekusi. Kebijakan preflight: *Fail-Closed* tanpa manipulasi data sepihak. |
| **Skalabilitas & Karakteristik Beban Kasir** | **PASS WITH CONDITIONS** | Hot path RFID kasir dioptimalkan dengan meminimalkan durasi lock baris dompet. Penafian benchmark dipertegas; uji beban staging sandbox wajib dijalankan sebelum deployment produksi. |
| **Status Otorisasi Implementasi** | **NOT GRANTED** | Implementasi rekayasa (T1–T26) tetap terkunci. Mandat ini tidak memberikan otorisasi coding, migrasi DDL, atau deployment. |

---

## 2. BASELINE VERIFIKASI & CAKUPAN PENELUSURAN KODE

### 2.1 Verifikasi Baseline Git Aktual:
- **Workspace Path**: `E:\Projects\Os_Darta`
- **Active Branch**: `preview`
- **Commit HEAD Terverifikasi**: `e61a2376bd7d089f2de6eb8ffa9e1917b25b39c9` (`feat(tenant): harden tenant resolver Phase A and A1 contracts`)
- **Working Tree**: Bersih terhadap modifikasi kode sumber aplikasi (`src/` dan `drizzle/` bersih).
- **Candidate Worktree**: `E:\Projects\Os_Darta-domain-a2.7-candidate` (detached HEAD `e61a237`).

### 2.2 Sumber Daya yang Benar-Benar Diperiksa (Independently Verified):
1. `src/app/api/canteen/pay/route.ts` (Entry point POS kasir internal RFID).
2. `src/app/api/webhooks/flip/route.ts` (Entry point webhook gateway Flip).
3. `src/lib/payment/flip.ts` (Client API integrasi Flip).
4. `src/lib/db/schema/finance.ts` (Definisi Drizzle tabel finansial).
5. `src/lib/db/schema/rfid.ts` (Definisi Drizzle kartu RFID dan absensi).
6. `src/lib/db/index.ts` (Client PostgreSQL menggunakan driver `postgres` v3.4.9).
7. `drizzle/0000_neat_machine_man.sql` s/d `0005_tenant_code_counters.sql` (Skema DDL migrasi aktif).
8. `package.json` (Dependensi runtime: `@node-rs/argon2` dan `bcrypt` **TIDAK TERPASANG**; `node:crypto` tersedia).
9. Seluruh laporan artefak arsitektur `docs/architecture/` (M2-001 hingga M2-009).

### 2.3 Sumber Daya yang Tidak Dapat Diperiksa / Keterbatasan:
- Database produksi / Supabase runtime live: Tidak diperiksa secara write (mematuhi protokol Strict Read-Only).
- Benchmark performa CPU/RAM serverless Vercel: Dilarang memutasi infrastruktur.
- Hardware fisik pembaca kartu RFID (NFC USB reader): Tergantung integrasi perangkat keras di lapangan.

---

## 3. TEMUAN KRITIS TINGKAT TINGGI (P0 & P1)

### TEMUAN P0 — CRITICAL (Celah Arsitektur Berisiko Tinggi di Repositori Eksisting)

#### [P0-01] Double Spending Akibat Ketiadaan Row-Level Locking pada Endpoint Kasir
- **Status Bukti**: `[TERBUKTI DI KODE]` (`src/app/api/canteen/pay/route.ts:L87-91, L162-170`).
- **Akar Masalah**: Pengecekan saldo uang saku dilakukan dengan `SELECT` polos tanpa klausa `FOR UPDATE`. Pengurangan saldo dihitung di memori Node.js (`wallet.balanceUangSaku - amount`) sebelum di-update kembali.
- **Skenario Pemicu**: Santri memiliki saldo Rp 30.000. Kartu di-tap pada dua kasir berbeda dalam milidetik yang sama untuk belanja masing-masing Rp 20.000. Kedua kasir membaca saldo awal Rp 30.000, keduanya menganggap saldo cukup, dan keduanya menulis saldo akhir Rp 10.000.
- **Dampak Finansial**: Barang senilai Rp 40.000 keluar, saldo hanya terpotong Rp 20.000. Santri overspend Rp 10.000 tanpa terdeteksi (*Direct Financial Loss*).
- **Mitigasi Arsitektur**: Penguncian baris `SELECT ... FROM wallets WHERE tenant_id = :tenant AND santri_id = :santriId FOR UPDATE` di dalam unit transaksi atomik.

#### [P0-02] Lost Update Konkurensi antara Belanja Kasir dan Webhook Top-Up Flip
- **Status Bukti**: `[TERBUKTI DI KODE]` (`src/app/api/webhooks/flip/route.ts:L86-92` dan `/api/canteen/pay`).
- **Akar Masalah**: Webhook Flip membaca saldo dompet, menjumlahkan top-up di memori, dan meng-update `wallets` tanpa penguncian baris dompet.
- **Skenario Pemicu**: Webhook Flip (top-up Rp 100.000) tiba pada milidetik yang sama saat santri sedang belanja di kasir (debit Rp 20.000) dari saldo awal Rp 50.000. Jika webhook membaca saldo sebelum kasir commit, webhook akan menimpa saldo akhir menjadi Rp 150.000 (`50.000 + 100.000`), menghapus mutasi belanja kantin sebesar Rp 20.000 (*Lost Update*).
- **Mitigasi Arsitektur**: Webhook Flip wajib menggunakan protokol row lock `wallets FOR UPDATE` yang identik dengan endpoint kasir.

### TEMUAN P1 — HIGH (Integritas, Pemulihan, & Keamanan Kredensial)

#### [P1-01] Cacat Desain Rollback Transaksi terhadap Counter Gagal PIN (Critical Design Flaw Resolution)
- **Status Bukti**: `[KONFLIK DESAIN TERSELESAIKAN]` (Koreksi terhadap Draf 003/004).
- **Akar Masalah**: Pada Draf 003/004, validasi PIN diletakkan di dalam transaksi database yang sama dengan mutasi belanja. Jika pembayaran gagal atau terjadi exception, seluruh transaksi di-rollback.
- **Skenario Pemicu**: Jika PIN salah dimasukkan dan transaksi di-rollback, maka kenaikan `failed_pin_attempts` ikut ter-rollback ke nilai semula di database. Akibatnya, penyerang dapat mencoba PIN berkali-kali tanpa pernah mencapai counter 3x (*Unlimited Brute Force Bypass*).
- **Mitigasi Arsitektur**: **Pemisahan Dua Batas Transaksi (Two-Step Decoupled Architecture)**:
  - *Langkah 1 (Credential Verification & Attempt Tracking)*: Operasi atomik mandiri pada tabel `rfid_cards`. Jika PIN salah, `failed_pin_attempts` dinaikkan dan di-COMMIT seketika (mengunci kartu jika $\ge 3$). Jika PIN salah, eksekusi berhenti dan mengembalikan HTTP 401/403.
  - *Langkah 2 (Financial Debit & POS Logging)*: Hanya dieksekusi jika Langkah 1 sukses. Transaksi ACID kedua mengunci `wallets FOR UPDATE`, memeriksa limit, memotong saldo, mencatat transaksi POS, dan menulis log saku.

#### [P1-02] Perilaku Driver PostgreSQL terhadap Error `23505` di dalam Aborted Transaction
- **Status Bukti**: `[KONFLIK DESAIN TERSELESAIKAN]`.
- **Akar Masalah**: Dalam PostgreSQL, ketika sebuah query di dalam blok transaksi melempar error `23505 unique_violation`, PostgreSQL menandai seluruh transaksi sebagai *aborted*. Query recovery lanjutan tidak dapat dieksekusi di dalam transaksi yang sama.
- **Mitigasi Arsitektur**: Penanganan error `23505` pada route handler kasir wajib membiarkan transaksi pertama me-rollback secara penuh terlebih dahulu, kemudian menjalankan *recovery query* di luar transaksi yang teraborsi untuk mengambil data `response_payload` yang telah di-commit oleh request pemenang.

#### [P1-03] Ketiadaan Constraint Saldo Non-Negatif pada Kernel PostgreSQL
- **Status Bukti**: `[TERBUKTI DI KODE]` (`drizzle/0000_neat_machine_man.sql:L595-596`).
- **Akar Masalah**: Tabel `wallets` mendefinisikan `balance_uang_saku integer DEFAULT 0 NOT NULL` tanpa `CHECK (balance_uang_saku >= 0)`.
- **Mitigasi Arsitektur**: Penambahan constraint `CHECK (balance_uang_saku >= 0)` dan `UNIQUE (tenant_id, santri_id)` melalui migrasi DDL bertahap setelah melalui tahapan preflight data warisan.

---

## 4. INVENTARISASI PENULIS SALDO REPOSITORI (EXHAUSTIVE BALANCE WRITERS AUDIT)

Pencarian mendalam di seluruh basis kode aplikasi menghasilkan inventarisasi komprehensif berikut:

| No | Domain Saldo | Berkas / Endpoint Aktual | Tipe Operasi | Mekanisme Konkurensi Saat Ini | Kesenjangan Integritas | Status Bukti |
|---|---|---|---|---|---|---|
| 1 | `balance_uang_saku` | `src/app/api/canteen/pay/route.ts:L165` | Debit Belanja Kantin | Non-locking update di memori | Rawan double spending & lost update | `[TERBUKTI]` |
| 2 | `balance_uang_saku` | `src/app/api/webhooks/flip/route.ts:L86` | Kredit Top-Up Flip | Non-locking update di memori | Rawan lost update saat benturan belanja | `[TERBUKTI]` |
| 3 | `balance_tabungan` | `src/app/api/webhooks/flip/route.ts:L89` | Kredit Top-Up Flip | Non-locking update di memori | Belum ada row-level lock | `[TERBUKTI]` |
| 4 | Saldo Model B | *Belum ada di kode sumber* | Saldo Terpadu Keluarga | Belum diimplementasikan | Masih berupa rancangan arsitektur | `[TERBUKTI NIHIL]` |
| 5 | Refund Belanja | *Belum ada di kode sumber* | Kredit Pembalikan Saldo | Belum diimplementasikan | Memerlukan alur resmi PO | `[TERBUKTI NIHIL]` |
| 6 | Penyesuaian Saldo | *Belum ada di kode sumber* | Koreksi Manual Admin | Belum diimplementasikan | Memerlukan alur audit khusus | `[TERBUKTI NIHIL]` |

---

## 5. AUDIT ASPEK ARSITEKTUR MENDALAM

### 5.1 GAP A — Kriptografi PIN, Entropi, dan State Machine Decoupled
1. **Analisis Entropi PIN Santri**:
   - 4-digit angka: $10^4 = 10.000$ kombinasi ($\approx 13.29$ bit).
   - 6-digit angka: $10^6 = 1.000.000$ kombinasi ($\approx 19.93$ bit).
   - Menurut **NIST SP 800-63B**, rahasia berentropi rendah tidak dapat dilindungi dari offline brute force hanya dengan KDF hashing jika dump database bocor. Satu GPU modern dapat menembus seluruh 10.000 kombinasi dalam waktu 0,1 detik.
   - **Garis Pertahanan Primer**: Pembatasan percobaan online (**Auto-Block 3x**) pada tingkat database.
   - **Garis Pertahanan Sekunder**: **Server-Side Secret Pepper** yang disimpan di luar database (KMS / Environment Server).
2. **Perbandingan Opsi KDF untuk Ratifikasi PO**:
   - **Opsi A (Rekomendasi Arsitek)**: **PBKDF2-HMAC-SHA256 (100.000 iterasi) + 16-byte Salt + Server Pepper**. Nol dependensi eksternal (bawaan `node:crypto`), stabil pada runtime serverless Next.js, latensi ~15–30 ms.
   - **Opsi B**: **Argon2id (`m=19456, t=2, p=1`)**. Standar OWASP, resistensi ASIC/GPU tertinggi, namun memerlukan dependensi native binary `@node-rs/argon2`.
3. **Decoupled Architecture Verifikasi PIN**:
   Pencatatan gagal PIN dan penguncian kartu (`status = 'blocked'`) dieksekusi dan di-commit pada Langkah 1 independen, menjamin counter tidak pernah terhapus oleh rollback transaksi belanja kasir di Langkah 2.

### 5.2 GAP B — Idempotensi, Kanonikalisasi Request, dan Recovery PostgreSQL `23505`
1. **Kanonikalisasi Deterministik**:
   Hash canonical dibangun dari representasi data yang telah divalidasi server (mengurutkan item lines berdasarkan `itemId/name`, normalisasi integer rupiah). PIN santri **DILARANG** dimasukkan ke dalam hash canonical.
2. **Penanganan Konflik Idempotensi**:
   - Request dengan kunci sama dan payload sama: Mengembalikan respon sukses asli (*HTTP 200*) dengan header `X-Idempotent-Replay: true`.
   - Request dengan kunci sama dan payload berbeda: Ditolak seketika dengan **HTTP 409 Conflict**.
   - Request paralel identik yang menabrak `23505`: Menunggu transaksi pemenang selesai, me-rollback transaksi sendiri yang teraborsi, lalu menjalankan recovery query di luar transaksi untuk menyajikan respon sukses asli.

### 5.3 GAP C — Prasyarat Migrasi & Keamanan Data Warisan (Legacy Preflight)
1. **Prinsip Fail-Closed**:
   Sebelum DDL migrasi penambahan constraint `CHECK (balance_uang_saku >= 0)` dan `UNIQUE (tenant_id, santri_id)` dijalankan di masa mendatang, query preflight read-only wajib dijalankan.
2. **Prosedur Preflight**:
   Jika query menemukan saldo negatif warisan atau duplikasi dompet santri, **MIGRASI DDL WAJIB DIHENTIKAN SEKETIKA**. Data anomali dilaporkan ke Admin Keuangan untuk rekonsiliasi manual; sistem dilarang keras mereset atau menghapus data secara otomatis.

### 5.4 GAP D — Struktur POS Terperinci & Tiga Model Merchant PO
1. **Struktur Item POS**:
   Tabel `canteen_transaction_items` mencatat snapshot nama barang, harga satuan, kuantitas, diskon, dan subtotal, menjamin laporan historis kebal terhadap perubahan katalog master barang di kemudian hari.
2. **Representasi Transaksi Nonfisik**:
   Kolom `item_type = 'obligation_payment'` mendukung pembayaran denda santri atau tagihan kegiatan dengan menyimpan referensi kewajiban pada `metadata jsonb`.
3. **Tiga Model Merchant PO**:
   - **Model 1 (Revenue Share)**: Bagi hasil persentase sesuai kontrak merchant.
   - **Model 2 (100% Hak Pondok)**: Seluruh hasil menjadi pendapatan pondok, dengan pembukuan kas-in/kas-out merchant.
   - **Model 3 (100% Hak Operator)**: Seluruh hasil menjadi hak pengelola rekanan; pondok tidak mengakui sebagai pendapatan sendiri.

### 5.5 GAP E — Manajemen Rahasia Pepper & Isolasi Tenant
1. **Siklus Hidup Pepper**:
   Variabel `RFID_PIN_PEPPER` wajib berstatus *fail-closed*: jika server boot tanpa konfigurasi pepper, seluruh otorisasi pembayaran ditolak.
2. **Rotasi Kunci**:
   Format salt kartu mendukung identifier versi pepper (`salt_hex$v1`), memungkinkan verifikasi bertransisi secara mulus saat pepper dirotasi ke versi baru.
3. **Isolasi Tenant**:
   Seluruh query menyertakan filter `tenant_id` dari session JWT terotentikasi. Percobaan akses kartu, dompet, atau merchant lintas-tenant ditolak tegas. Hak reset PIN dibatasi ketat: Wali Kelas hanya untuk santri kelas binaannya; Wali Santri dilarang keras.

---

## 6. EVALUASI SKALABILITAS & PERFORMA HOT PATH RFID KASIR

1. **Analisis Beban Puncak (Peak Hour Model)**:
   - Skenario jam istirahat santri: 10 terminal kasir melayani tap kartu serempak.
   - Durasi penahanan row lock (`FOR UPDATE`) pada dompet santri di dalam database dirancang sesingkat mungkin ($\le 15-25$ ms), karena validasi identitas, parsing JSON, dan verifikasi PIN dilakukan sebelum lock dompet diambil.
2. **Indeks Optimal yang Direkomendasikan**:
   - `canteen_transactions (tenant_id, idempotency_key)`: Unique B-Tree Index untuk lookup idempotensi instan ($O(\log N)$).
   - `canteen_transactions (tenant_id, santri_id, created_at)`: B-Tree Index untuk agregasi limit harian belanja secara cepat.
   - `rfid_cards (tenant_id, card_uid)`: Unique Index untuk resolusi kartu kasir.

---

## 7. MATRIKS REGISTER KEPUTUSAN PRODUCT OWNER (DECISION REGISTER SUMMARY)

Register keputusan formal telah dituangkan lengkap pada artefak terpisah `DECISION-REGISTER-M2-FINANCE-ARCHITECTURE-010.md`:
- **DEC-01 (KDF PIN)**: Opsi A (PBKDF2-HMAC-SHA256 100k) vs Opsi B (Argon2id). Status: `PENDING PO APPROVAL`.
- **DEC-02 (Storage Pepper)**: Runtime Env vs Cloud KMS. Status: `PENDING PO APPROVAL`.
- **DEC-03 (Migrasi PIN Legacy)**: Reset PIN Massal saat distribusi kartu fisik. Status: `PENDING PO APPROVAL`.
- **DEC-04 (Retensi Idempotency)**: Disimpan permanen pada header transaksi kasir. Status: `PENDING PO APPROVAL`.
- **DEC-05 & DEC-06 (Status & Payload Transaksi)**: Status atomik `SUCCESS` dengan `response_payload` berisi data struk terfilter. Status: `PENDING PO APPROVAL`.
- **DEC-07 (Hash Kanonis)**: String deterministik terurut tanpa PIN. Status: `PENDING PO APPROVAL`.
- **DEC-08 & DEC-09 (Data Warisan Minus & Duplikat)**: Eskalasi audit manual ke Admin Keuangan (Nol manipulasi otomatis). Status: `PENDING PO APPROVAL`.
- **DEC-10 (Kebijakan Pembatalan Kasir)**: Wewenang kasir refund dalam 5 menit vs wajib approval Admin Keuangan. Status: `PENDING PO APPROVAL`.
- **DEC-11 (Kebijakan Refund Model B)**: Sisa saldo keluarga saat santri lulus/keluar pondok. Status: `PENDING PO APPROVAL`.
- **DEC-12 (Settlement Merchant)**: Fleksibilitas skema bagi hasil 3 model bisnis PO. Status: `PENDING PO APPROVAL`.

---

## 8. KESIMPULAN GERBANG IMPLEMENTASI (IMPLEMENTATION READINESS CONCLUSION)

1. **Kelayakan Desain Konseptual**: **MEMENUHI SYARAT (PASS WITH CONDITIONS)**. Cacat desain pada iterasi sebelumnya (termasuk rollback counter PIN dan penanganan error PostgreSQL 23505) telah diselesaikan secara tuntas dalam Draf Konsolidasi 010.
2. **Kesiapan Rekayasa Implementasi**: **BELUM DIIZINKAN (IMPLEMENTATION NOT AUTHORIZED)**. Tidak ada pekerjaan pengkodean (*coding*), migrasi DDL, atau deployment yang diizinkan sebelum Product Owner meratifikasi register keputusan dan menerbitkan mandat implementasi terpisah.

---

**FINAL AUDIT DISPOSITION:**  
`OVERALL GATE: PASS WITH CONDITIONS`  
`DESIGN RATIFICATION: PENDING PRODUCT OWNER REVIEW`  
`IMPLEMENTATION STATUS: NOT AUTHORIZED`  

*Laporan evaluasi independen ini diserahkan secara resmi kepada Product Owner (`Process_PO`) dan Acting Process_Mandor (`Mandor 2`).*
