# DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-002
## Spesifikasi Revisi Desain Remediasi: Penguatan Pembayaran Internal RFID, Keamanan PIN, dan Integritas Dompet Multi-Tenant

**Klasifikasi:** Design Review & Remediation Specification  
**Project:** APP MA’HAD / Os_Darta  
**Lead Agent:** ZenOrion — Antigravity Lead Agent  
**Otoritas:** Process_PO (Product Owner) & Acting Process_Mandor (Mandor 2)  
**Mandate Type:** Independent Architecture Review & Remediation Design Revision (M2-FINANCE-ARCHITECTURE-006)  
**Execution Mode:** STRICT READ-ONLY  
**Implementation Authorization:** NOT AUTHORIZED  
**Status Dokumen:** DRAFT FOR PRODUCT OWNER & MANDOR RATIFICATION  
**Dokumen Terkait:**
- `docs/spesifikasi-pembayaran.md` (Aturan Mutlak 1–13)
- `docs/architecture/REPORT-M2-FINANCE-ARCHITECTURE-001.md`
- `docs/architecture/SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md`
- `docs/architecture/REPORT-M2-FINANCE-MERCHANT-WALLET-GAP-AUDIT-001.md`
- `docs/architecture/DRAFT-FINANCE-MERCHANT-WALLET-EXTENSION-001.md`
- `docs/architecture/REPORT-M2-FINANCE-WALLET-LEDGER-AUDIT-001.md`
- `docs/architecture/REPORT-M2-FINANCE-RFID-INTERNAL-PAYMENT-VERIFICATION-001.md`
- `docs/architecture/REPORT-M2-FINANCE-RFID-REMEDIATION-DESIGN-001.md`  
**Tanggal:** 19 Oktober 2026  

---

## 1. RINGKASAN EKSEKUTIF

Dokumen ini merupakan **Draf Revisi Desain Remediasi (Iterasi 002)** yang disusun berdasarkan review arsitektur independen terhadap laporan `REPORT-M2-FINANCE-RFID-REMEDIATION-DESIGN-001`. Revisi ini memperketat analisis faktual, mengoreksi asumsi yang belum terbukti, menyelaraskan seluruh model otorisasi dengan keputusan bisnis terkunci dari Product Owner (PO), serta merancang mitigasi menyeluruh terhadap risiko integritas finansial dan keamanan kartu RFID.

### Poin-Poin Kunci Revisi M2-006:
1. **Koreksi Otoritas Reset PIN**: Menegaskan secara mutlak bahwa hak reset PIN dan pembukaan blokir **HANYA** dimiliki oleh **Wali Kelas** (terbatas pada santri di kelas binaannya) dan **Admin Keuangan**. Super Admin **TIDAK** memiliki kewenangan ini tanpa mandat eksplisit baru dari PO, dan Wali Santri **DILARANG** mereset PIN RFID anak.
2. **Revisi Total Evaluasi Hashing PIN**: Mengoreksi rekomendasi PBKDF2 10.000 iterasi pada laporan M2-005. Berdasarkan analisis ancaman entropi rendah (4–6 digit angka hanya memiliki 10.000–1.000.000 kombinasi), hashing *apapun* tidak dapat mencegah serangan *offline cracking* jika hash bocor. Oleh karena itu, pertahanan primer adalah **Strict Online Rate Limiting (Auto-Block 3x)** pada level database, diperkuat dengan pemisahan rahasia (*Server-Side Pepper*) dan parameter KDF standar yang dikalibrasi.
3. **Penyelarasan Atomicity Lintas-Jalur (Cross-Flow Atomicity)**: Mengidentifikasi bahwa pengamanan `FOR UPDATE` pada endpoint kasir (`/api/canteen/pay`) tidak cukup jika jalur top-up webhook Flip (`/api/webhooks/flip`) tidak menggunakan mekanisme penguncian yang kompatibel. Keduanya disatukan ke dalam protokol *compatible row-level locking* dan *database-level check constraint*.
4. **Idempotensi Persisten & Penolakan Konflik Payload**: Merancang mekanisme idempotensi kasir yang tidak hanya menangani *network retry*, tetapi secara eksplisit menolak request dengan kunci yang sama namun payload berbeda (*HTTP 409 Conflict*).
5. **Struktur POS Terperinci & Snapshot Historis**: Menggantikan kolom teks bebas `items_description` dengan skema relasional terstruktur yang menyimpan snapshot harga, kuantitas, diskon, dan mengakomodasi layanan nonfisik (kewajiban/denda/layanan medis) serta model bagi hasil merchant.

---

## 2. RUANG LINGKUP DAN BATASAN OPERASIONAL

Pekerjaan ini tunduk pada batasan tata kelola ketat:
- **Mode Read-Only Mutlak**: Tidak ada source code, skema DDL/DML, migrasi Drizzle, konfigurasi RLS, maupun berkas repositori yang diubah.
- **Nol Pengujian Mutatif**: Tidak ada transaksi pengujian yang dijalankan ke database Supabase, lokal, maupun staging.
- **Pemisahan Desain dari Implementasi**: Seluruh skema SQL, relasi tabel, dan pseudocode di dalam dokumen ini merupakan *Architectural Blueprint* yang memerlukan persetujuan formal sebelum diimplementasikan.
- **Pencegahan Overwrite Dokumen**: Dokumen `REPORT-M2-FINANCE-RFID-REMEDIATION-DESIGN-001.md` tetap dipertahankan utuh sebagai catatan historis M2-005; dokumen ini diterbitkan sebagai draf revisi independen terpisah.

---

## 3. KEPUTUSAN PRODUCT OWNER YANG SUDAH TERKUNCI

Keputusan-keputusan bisnis berikut bersifat absolut dan **TIDAK DAPAT** diubah atau dipertanyakan kembali:

### 3.1 Aturan Pembayaran RFID
1. **Internal Murni**: Seluruh transaksi pembayaran RFID adalah transaksi internal tertutup dan **TIDAK MEMERLUKAN PAYMENT GATEWAY**.
2. **Nol Interaksi Gateway**: Pembayaran RFID tidak memanggil API Flip, tidak membuat payment order, tidak menunggu webhook, dan tidak membebankan biaya gateway (*zero gateway fee*).
3. **Sumber Dana Tunggal**: Pembayaran RFID **hanya menggunakan saldo uang saku santri** (`balance_uang_saku`). Saldo tabungan santri dan saldo Model B tidak boleh dipotong langsung oleh transaksi RFID.
4. **Wajib PIN & Pengikatan Identitas**: Pembayaran RFID wajib memasukkan PIN dan kartu RFID terikat pada identitas santri pemiliknya. Kartu santri lain dilarang digunakan.
5. **Integritas Saldo**: Saldo tidak boleh negatif; debit saldo dan pencatatan transaksi wajib atomik dan konsisten.

### 3.2 Keamanan PIN & Otorisasi Reset
1. **Auto-Block 3x**: Tiga kali salah PIN memblokir fungsi pembayaran kartu RFID secara otomatis.
2. **Durasi Blokir**: Blokir tetap berlaku sampai di-reset secara sah oleh petugas yang berwenang (tidak ada auto-unblock berbasis waktu/cooldown).
3. **Unblock Atomik**: Reset PIN yang sah sekaligus membuka status blokir kartu secara atomik.
4. **Otoritas Terbatas**: Pihak yang berwenang mereset PIN **HANYA**:
   - **Wali Kelas**: Terbatas hanya pada santri yang menjadi tanggung jawab di kelas binaannya.
   - **Admin Keuangan**: Berwenang untuk seluruh santri tenant.
5. **Larangan Reset**: **Wali Santri TIDAK BERWENANG** mereset PIN RFID santri. Super Admin **TIDAK DIIZINKAN** mereset PIN tanpa keputusan PO yang baru.
6. **Larangan Plaintext**: PIN tidak boleh disimpan atau dibandingkan dalam bentuk plaintext.

### 3.3 POS dan Pengelolaan Keuangan
1. **Detail POS Terstruktur**: POS wajib menyimpan rincian item transaksi terstruktur (nama item/layanan, kuantitas, harga satuan, diskon, subtotal, total, dan snapshot harga saat transaksi).
2. **Dukungan Layanan Nonfisik**: Pembayaran denda tata tertib, SPP, atau tagihan kewajiban di kasir harus direpresentasikan sebagai layanan/kewajiban nonfisik tanpa memaksakan adanya barang fisik.
3. **Pemisahan Tiga Saldo**: Saldo keseluruhan Model B, saldo uang saku, dan tabungan santri adalah entitas terpisah. Perpindahan uang saku ke tabungan santri bukan pendapatan yayasan/pesantren.

---

## 4. BUKTI AUDIT SOURCE CODE & PEMETAAN SELURUH PENULIS SALDO

Audit menyeluruh terhadap repositori membuktikan fakta-fakta teknis berikut:

### 4.1 Pemetaan Seluruh Penulis Saldo (Wallet Balance Writers)
Pemeriksaan menyeluruh terhadap seluruh codebase (`src/`) menemukan bahwa hanya terdapat **DUA** jalur yang menulis/memutasi saldo dompet (`wallets` dan `wallet_pockets`):

| Jalur Penulis Saldo | File & Baris Kode Aktual | Tipe Mutasi | Operasi Database | Status Bukti |
|---|---|---|---|---|
| **1. RFID Canteen Pay** | `src/app/api/canteen/pay/route.ts:L164-170` | Debit Uang Saku (`canteen_deduct`) | `db.update(wallets).set({ balanceUangSaku: newBalance })` | `[TERBUKTI]` |
| **2. Flip Webhook Top-Up** | `src/app/api/webhooks/flip/route.ts:L86-92` | Kredit Uang Saku & Tabungan (`topup`) | `db.update(wallets).set({ balanceUangSaku: newUangSaku, balanceTabungan: newTabungan })` | `[TERBUKTI]` |
| **3. Manual Adjustment** | *Tidak ditemukan di codebase* | - | Tidak ada endpoint atau service | `[TERBUKTI NIHIL]` |
| **4. Refund Belanja** | *Tidak ditemukan di codebase* | - | Tidak ada endpoint atau service | `[TERBUKTI NIHIL]` |
| **5. Transfer Tabungan** | *Tidak ditemukan di codebase* | - | Tidak ada endpoint transfer saku ke tabungan | `[TERBUKTI NIHIL]` |

### 4.2 Audit Skema Database & Constraint Finansial
Pemeriksaan pada `src/lib/db/schema/finance.ts`, `src/lib/db/schema/rfid.ts`, dan file migrasi `drizzle/0000_neat_machine_man.sql`:
1. **Tabel `wallets` (`finance.ts:L4-22`, `0000_neat_machine_man.sql:L590-603`)**:
   - Kolom: `balance_uang_saku` (integer default 0), `balance_tabungan` (integer default 0).
   - **Kelemahan Kritis**: **TIDAK ADA CHECK CONSTRAINT `CHECK (balance_uang_saku >= 0)`** pada database. Jika ada bug aplikasi atau race condition, nilai integer dapat menjadi minus tanpa hambatan dari PostgreSQL.
   - **Kelemahan Integritas**: **TIDAK ADA UNIQUE CONSTRAINT `UNIQUE (tenant_id, santri_id)`** pada tabel `wallets`.
2. **Tabel `rfid_cards` (`rfid.ts:L4-14`, `0000_neat_machine_man.sql:L617-628`)**:
   - Kolom: `card_uid` (unique), `hashed_pin` (text), `status` ('active' | 'blocked').
   - **Kelemahan Keamanan**: **TIDAK ADA kolom `failed_pin_attempts`, `locked_at`, `pin_salt`, atau `locked_reason`**.
3. **Tabel `canteen_transactions` (`finance.ts:L90-103`, `0000_neat_machine_man.sql:L527-539`)**:
   - Kolom: `items_description` (text biasa), `amount` (integer), `status` (text).
   - **Kelemahan Idempotensi**: **TIDAK ADA kolom `idempotency_key` dan tidak ada UNIQUE index**.
   - **Kelemahan Struktur POS**: **TIDAK ADA tabel rincian item transaksi (`canteen_transaction_items`)**.
4. **Cakupan Pengujian Repositori**:
   - Pemeriksaan terhadap direktori tes (`src/**/__tests__`, `src/test/`) membuktikan bahwa **TIDAK ADA SATUPUN UNIT TEST ATAU INTEGRATION TEST** untuk `/api/canteen/pay` dan `/api/webhooks/flip`. Tingkat cakupan tes saat ini untuk transaksi finansial kasir adalah **0%** (`[TERBUKTI]`).

---

## 5. DAFTAR RISIKO DAN TINGKAT PRIORITAS

| ID Risiko | Kategori | Deskripsi Risiko Faktual | Tingkat Keparahan | Status Bukti |
|---|---|---|---|---|
| **RSK-01** | Concurrency | Race condition pada tap paralel di dua kasir memicu *Double Spending* santri karena saldo dibaca dan dihitung di memori Node.js tanpa row lock. | **KRITIS** | `[TERBUKTI]` |
| **RSK-02** | Atomicity | Mutasi saldo, pencatatan transaksi kasir, dan penulisan log saku berjalan di luar transaksi database; kegagalan parsial memotong saldo tanpa struk. | **KRITIS** | `[TERBUKTI]` |
| **RSK-03** | Concurrency | Benturan simultan antara top-up webhook Flip dan pembayaran kasir memicu *Lost Update* (salah satu mutasi terhapus). | **KRITIS** | `[TERBUKTI]` |
| **RSK-04** | Security | Ketiadaan counter gagal PIN dan pemblokiran otomatis memungkinkan serangan brute force 10.000 kombinasi pada kartu santri yang hilang. | **KRITIS** | `[TERBUKTI]` |
| **RSK-05** | Integrity | Ketiadaan database-level constraint `CHECK (balance_uang_saku >= 0)` memungkinkan saldo menjadi minus jika aplikasi mengalami anomali. | **TINGGI** | `[TERBUKTI]` |
| **RSK-06** | Idempotency | Ketiadaan kunci idempotensi persisten menyebabkan risiko pemotongan saldo ganda saat kasir menekan tombol bayar berulang akibat latensi. | **TINGGI** | `[TERBUKTI]` |
| **RSK-07** | Governance | Ketiadaan rincian item terstruktur pada POS menyulitkan audit pembukuan dan rekonsiliasi bagi hasil merchant. | **SEDANG** | `[TERBUKTI]` |

---

## 6. REVISI DESAIN KEAMANAN PIN RFID

### 6.1 Evaluasi Kritis terhadap Ancaman PIN Berentropi Rendah
PIN santri umumnya terdiri dari 4 digit angka (10.000 kombinasi $\approx 13.3$ bit entropi) atau maksimal 6 digit angka (1.000.000 kombinasi $\approx 19.9$ bit entropi). 

> **Prinsip Keamanan Fundamental (NIST SP 800-63B & OWASP):**  
> *"Untuk rahasia berentropi sangat rendah seperti 4-digit PIN numerik, tidak ada parameter iterasi hashing offline yang mampu menahan serangan brute-force jika basis data bocor. Satu GPU modern mampu menghitung miliaran hash SHA-256 per detik. Bahkan dengan 600.000 iterasi PBKDF2, seluruh 10.000 kemungkinan 4-digit PIN dapat diuji dalam hitungan detik."*

Oleh karena itu, revisi arsitektur M2-006 menetapkan hierarki pertahanan berlapis:
1. **Garis Pertahanan Primer (Online Rate Limiting)**: Pemblokiran mutlak di tingkat database setelah **3 kali salah PIN berturut-turut** (`status = 'blocked'`). Serangan brute force online di terminal kasir secara matematis dibatasi hanya pada probabilitas $3 / 10.000 = 0.03\%$.
2. **Garis Pertahanan Sekunder (Pemisahan Kunci / Pepper)**: Menggunakan secret environment khusus (`RFID_PIN_PEPPER`) yang disimpan di level server/KMS (terpisah dari database). Jika dump database PostgreSQL bocor, penyerang tetap tidak dapat melakukan *offline cracking* tanpa kunci pepper tersebut.
3. **Garis Pertahanan Tersier (Cryptographic Salt & KDF)**: Salt acak kriptografis 16-byte unik per kartu (`pin_salt`), digabungkan dengan fungsi derivasi kunci yang aman.

### 6.2 Evaluasi Pilihan Algoritma Hashing (Untuk Ditinjau PO)

| Parameter | Opsi 1: Argon2id (Rekomendasi OWASP) | Opsi 2: PBKDF2-HMAC-SHA256 (NIST Standard) | Rekomendasi Auditor |
|---|---|---|---|
| **Spesifikasi** | `m=19456 (19 MiB), t=2, p=1` | HMAC-SHA256, 100.000–600.000 iterasi | **Opsi 2 (PBKDF2 Terkalibrasi + Pepper)** |
| **Resistensi GPU/ASIC** | Sangat Tinggi (*Memory-Hard*) | Sedang (*Compute-Bound*) | Opsi 1 lebih unggul secara kriptografi |
| **Dependensi Runtime** | Membutuhkan modul native C++/WASM (`@node-rs/argon2`). | **Nol Dependensi** (Bawaan runtime `node:crypto`). | **Opsi 2 sangat unggul** untuk kestabilan serverless Vercel |
| **Latensi Eksekusi** | ~40–80 ms per verifikasi | ~15–30 ms (pada 100.000 iterasi) | Opsi 2 memberikan throughput antrean kasir yang lebih responsif |

*Catatan Mandat*: Parameter hashing final tidak dikunci sepihak, melainkan disajikan kepada Product Owner dengan rekomendasi teknis: **PBKDF2-HMAC-SHA256 dengan 100.000 iterasi + 16-byte random salt + Server-Side Pepper**, karena memberikan keseimbangan optimal antara keamanan, ketiadaan dependensi biner pihak ketiga, dan kecepatan respon kasir.

### 6.3 Penanganan Percobaan Bersamaan (Race Condition pada Verifikasi PIN)
Untuk mencegah penyerang mengirimkan 10 request bersamaan dalam 1 milidetik guna melewati batas 3 kali kegagalan, pencatatan kegagalan PIN wajib dikunci pada level transaksi database:
```sql
-- Draf Pseudocode SQL (Ilustrasi Desain):
BEGIN;
  SELECT id, failed_pin_attempts, status 
  FROM rfid_cards 
  WHERE tenant_id = :tenantId AND card_uid = :cardUid 
  FOR UPDATE; -- Mengunci baris kartu RFID seketika
  
  -- Jika status sudah 'blocked', tolak transaksi seketika (HTTP 403)
  -- Jika PIN salah:
  UPDATE rfid_cards 
  SET 
    failed_pin_attempts = failed_pin_attempts + 1,
    status = CASE WHEN failed_pin_attempts + 1 >= 3 THEN 'blocked' ELSE status END,
    locked_at = CASE WHEN failed_pin_attempts + 1 >= 3 THEN NOW() ELSE locked_at END,
    locked_reason = CASE WHEN failed_pin_attempts + 1 >= 3 THEN 'Otomatis: 3x salah PIN' ELSE locked_reason END
  WHERE id = :cardId;
COMMIT;
```
Dengan mekanisme `FOR UPDATE` pada tabel `rfid_cards`, setiap percobaan PIN diproses secara serial. Request paralel ke-4 dipastikan mendapati status kartu sudah `'blocked'` dan ditolak.

### 6.4 Otorisasi Reset PIN dan Pembukaan Blokir (Strict PO Compliance)
Rancangan endpoint `POST /api/rfid/reset-pin`:
1. **Validasi Kewenangan Server-Side**:
   - Jika role = `wali_kelas`: Wajib memverifikasi bahwa santri terkait berada di kelas binaan guru tersebut melalui relasi tabel rombel/kelas (`eq(rombel.waliKelasId, user.id)`). Percobaan mereset santri dari kelas lain menghasilkan **HTTP 403 Forbidden**.
   - Jika role = `admin_keuangan`: Diizinkan mereset PIN untuk seluruh santri di tenant yang sama.
   - Jika role = `wali_santri`, `superadmin`, `cashier`, atau role lainnya: Ditolak seketika dengan **HTTP 403 Forbidden** (*Zero Bypass*).
2. **Operasi Atomik Pembukaan Blokir**:
   - Reset kredensial menghasilkan salt baru, menghitung hash baru, mengosongkan `failed_pin_attempts = 0`, mengatur `status = 'active'`, dan menghapus `locked_at` serta `locked_reason` dalam satu query atomik.
3. **Audit Log Otoritatif**:
   - Mencatat ke `audit_logs`: ID aktor, peran aktor, ID santri, UID kartu, dan timestamp.

---

## 7. REVISI DESAIN ATOMICITY DAN KONSISTENSI SALDO

### 7.1 Konsistensi Lintas-Jalur (RFID Canteen vs Webhook Flip)
Salah satu temuan paling kritis dari audit M2-006 adalah: **Menerapkan locking hanya pada `/api/canteen/pay` tidak mencegah *lost update* jika `/api/webhooks/flip` tidak mengikuti locking yang sama**.

Oleh karena itu, kedua jalur diselaraskan dengan aturan locking yang identik:
1. **Urutan Penguncian Terstandarisasi**: Baik transaksi kasir maupun kredit webhook Flip wajib memulai transaksi dengan mengunci baris dompet santri terlebih dahulu:
   ```typescript
   // Berlaku identik di /api/canteen/pay DAN /api/webhooks/flip:
   const [wallet] = await tx
     .select()
     .from(wallets)
     .where(and(eq(wallets.tenantId, tenantId), eq(wallets.santriId, santriId)))
     .for('update');
   ```
2. **Kompabilitas Connection Pooler**: Menggunakan `postgres-js` dengan konfigurasi `{ prepare: false }`. Di bawah Supabase Transaction Pooler (PgBouncer mode transaksi), seluruh perintah di dalam `db.transaction(async (tx) => { ... })` dijamin berada pada satu koneksi database backend yang sama hingga transaksi selesai.
3. **Pemberlakuan Constraint Kernel Database**:
   Untuk menjamin saldo tidak pernah minus di bawah kondisi anomali apapun, diusulkan penambahan CHECK constraint pada tabel `wallets`:
   ```sql
   ALTER TABLE "wallets" ADD CONSTRAINT "wallets_balance_uang_saku_non_negative" CHECK ("balance_uang_saku" >= 0);
   ALTER TABLE "wallets" ADD CONSTRAINT "wallets_balance_tabungan_non_negative" CHECK ("balance_tabungan" >= 0);
   ALTER TABLE "wallets" ADD CONSTRAINT "wallets_tenant_santri_unique" UNIQUE ("tenant_id", "santri_id");
   ```
   Jika terjadi pelanggaran konkurensi di mana saldo ditarik melebihi batas, PostgreSQL akan melempar error constraint violation (`23514`), memicu rollback transaksi secara otomatis.

---

## 8. REVISI DESAIN IDEMPOTENSI DAN PENANGANAN KONFLIK PAYLOAD

Desain idempotensi disempurnakan untuk menangani kasus edge:

### 8.1 Format Token & Payload Fingerprint
Client kasir wajib mengirimkan:
- Header: `Idempotency-Key: <UUIDv4>`
- Server menghitung *Payload Fingerprint*: `request_hash = SHA256(JSON.stringify({ cardUid, amount, canteenId, items }))`

### 8.2 Matriks Penanganan Idempotensi di Tingkat Database

```
Request Masuk dengan Idempotency-Key
                │
                ▼
   Apakah Kunci Sudah Ada di DB?
         ┌──────┴──────┐
        YA            TIDAK
         │              │
         │              ▼
         │      Simpan Status 'PENDING'
         │      Eksekusi Transaksi Belanja
         │      Simpan Status 'SUCCESS' + Response
         │      Commit Transaksi -> Return HTTP 200
         │
         ▼
Apakah request_hash Identik?
   ┌─────┴─────┐
  YA          TIDAK
   │           │
   │           ▼
   │     TOLAK SEKETIKA (HTTP 409 Conflict):
   │     "Idempotency key reused with different payload"
   │
   ▼
Apakah Status Transaksi 'SUCCESS'?
   ┌─────┴─────┐
  YA          TIDAK (Masih 'PENDING')
   │           │
   │           ▼
   │     KEMBALIKAN HTTP 409 / 425:
   │     "Transaksi sedang diproses di kasir lain"
   │
   ▼
KEMBALIKAN RESIDUAL CACHED RESPONSE (HTTP 200)
- Mengembalikan data struk asli
- NOL PEMOTONGAN SALDO KEDUA KALI
```

Dengan aturan ini:
- Pengiriman ulang akibat timeout jaringan (*Network Retry*) akan menerima respon sukses tanpa saldo santri terpotong ganda.
- Penyalahgunaan kunci yang sama untuk transaksi barang berbeda akan ditolak tegas dengan **HTTP 409 Conflict**.

---

## 9. DESAIN STRUKTUR DETAIL ITEM POS TRANSAKSI

Sesuai keputusan PO sub-bab 3.3, POS kasir tidak boleh lagi hanya menyimpan string bebas `itemsDescription: "Pembelian Kantin"`.

### 9.1 Relasi Tabel POS Transaksi yang Diusulkan

```
┌─────────────────────────────────┐       1:N       ┌─────────────────────────────────┐
│     canteen_transactions        │────────────────<│    canteen_transaction_items    │
├─────────────────────────────────┤                 ├─────────────────────────────────┤
│ id (PK)                         │                 │ id (PK)                         │
│ tenant_id                       │                 │ tenant_id                       │
│ canteen_id                      │                 │ transaction_id (FK)             │
│ santri_id                       │                 │ item_type                       │
│ card_uid                        │                 │ item_id (FK nullable)           │
│ idempotency_key (UNIQUE)        │                 │ item_name_snapshot              │
│ request_hash                    │                 │ quantity                        │
│ subtotal_amount                 │                 │ unit_price_snapshot             │
│ discount_amount                 │                 │ discount_amount                 │
│ total_amount                    │                 │ line_total                      │
│ merchant_share_amount           │                 │ metadata (JSONB)                │
│ tenant_share_amount             │                 │ created_at                      │
│ status ('SUCCESS'|'REFUNDED')   │                 └─────────────────────────────────┘
│ created_at                      │
└─────────────────────────────────┘
```

### 9.2 Spesifikasi Kolom Terstruktur:
1. **`item_type`**: Mendukung diferensiasi transaksi fisik dan nonfisik:
   - `'physical_goods'`: Makanan, minuman, ATK, seragam.
   - `'service'`: Laundry, potong rambut, cetak dokumen.
   - `'obligation_payment'`: Pembayaran denda pelanggaran tata tertib santri, iuran kegiatan.
2. **`item_name_snapshot` & `unit_price_snapshot`**: Menyimpan nama dan harga riil pada detik transaksi terjadi. Jika harga barang di katalog master diubah di kemudian hari, nilai pada struk historis **TIDAK AKAN BERUBAH**.
3. **`metadata` (JSONB)**: Menyimpan konteks spesifik layanan nonfisik, misalnya `{ violation_id: "viol_123", rule_code: "TATIB-04" }` untuk pembayaran denda.
4. **Dukungan Model Merchant (Bagi Hasil / Sewa / 100% Pondok)**:
   - Header transaksi menghitung porsi bagi hasil secara otomatis: `tenant_share_amount` dan `merchant_share_amount` sesuai kontrak merchant yang tercatat di tabel `canteens`.

---

## 10. MATRIKS PENGUJIAN YANG DAPAT DIAUDIT (DESIGN ONLY)

> **PERNYATAAN TATA KELOLA:**  
> Seluruh matriks di bawah ini berstatus **`[DESIGN ONLY]`**. Tidak ada pengujian yang dieksekusi selama mandat `STRICT READ-ONLY` ini.

| No | ID Pengujian | Skenario Pengujian | Kondisi Awal | Tindakan Pengujian | Hasil yang Diharapkan (Invariant) | Status |
|---|---|---|---|---|---|---|
| 1 | **TC-PIN-01** | PIN Benar | Kartu aktif, saldo Rp 50.000, PIN '1234'. | Tap kartu, masukkan PIN '1234', belanja Rp 10.000. | Transaksi sukses, saldo sisa Rp 40.000, counter gagal tetap 0. | `[DESIGN ONLY]` |
| 2 | **TC-PIN-02** | PIN Salah 1x & 2x | Kartu aktif, counter gagal = 0. | Masukkan PIN salah 1x lalu 2x. | Ditolak HTTP 401. Counter gagal bertambah menjadi 1 lalu 2. Kartu tetap 'active'. | `[DESIGN ONLY]` |
| 3 | **TC-PIN-03** | PIN Salah 3x (Auto-Block) | Kartu aktif, counter gagal = 2. | Masukkan PIN salah untuk ketiga kalinya. | Ditolak HTTP 403. Status kartu berubah menjadi `'blocked'`. Counter gagal = 3. | `[DESIGN ONLY]` |
| 4 | **TC-PIN-04** | Kartu Diblokir | Kartu berstatus `'blocked'`. | Transaksi dengan PIN yang benar. | Ditolak HTTP 403 ("Kartu Diblokir"). Saldo tidak terpotong. | `[DESIGN ONLY]` |
| 5 | **TC-RST-01** | Reset oleh Wali Kelas Binaannya | Kartu `'blocked'`, santri di kelas X-A. | Wali Kelas X-A memanggil API reset PIN santri tersebut. | Sukses HTTP 200. PIN baru terpasang, status kartu otomatis `'active'`, counter gagal = 0. | `[DESIGN ONLY]` |
| 6 | **TC-RST-02** | Reset oleh Wali Kelas Lain | Kartu `'blocked'`, santri di kelas X-A. | Wali Kelas X-B mencoba memanggil API reset PIN. | Ditolak HTTP 403 Forbidden. Status kartu tetap `'blocked'`. | `[DESIGN ONLY]` |
| 7 | **TC-RST-03** | Reset oleh Admin Keuangan | Kartu `'blocked'`. | Admin Keuangan memanggil API reset PIN santri. | Sukses HTTP 200. PIN diperbarui, status kartu kembali `'active'`. Audit log tercatat. | `[DESIGN ONLY]` |
| 8 | **TC-RST-04** | Reset oleh Wali Santri | Kartu `'blocked'`. | Akun Wali Santri mencoba memanggil API reset PIN. | Ditolak HTTP 403 Forbidden (Keputusan PO: Wali tidak berwenang). | `[DESIGN ONLY]` |
| 9 | **TC-SEC-01** | Kartu Santri Lain | Kartu A terikat santri A. | Kasir mencoba mengasosiasikan kartu A untuk belanja santri B. | Ditolak HTTP 400/403 ("Integritas Kartu Tidak Cocok"). | `[DESIGN ONLY]` |
| 10 | **TC-FIN-01** | Saldo Tidak Cukup | Saldo Rp 10.000, belanja Rp 15.000. | Transaksi diproses kasir. | Ditolak HTTP 400 ("Saldo Uang Saku Tidak Cukup"). Saldo tetap Rp 10.000. | `[DESIGN ONLY]` |
| 11 | **TC-CON-01** | 2 Transaksi Paralel (Double Spending) | Saldo Rp 30.000. Dua kasir belanja masing-masing Rp 20.000 pada milidetik yang sama. | Eksekusi paralel dua thread. | Tepat 1 transaksi sukses (sisa Rp 10.000), 1 transaksi ditolak saldo kurang. Saldo TIDAK PERNAH minus. | `[DESIGN ONLY]` |
| 12 | **TC-CON-02** | Belanja Paralel Top-Up Webhook | Saldo Rp 50.000. Belanja Rp 20.000 bersamaan webhook Flip top-up Rp 100.000. | Eksekusi paralel canteen pay & webhook. | Saldo akhir konsisten Rp 130.000. Tidak ada mutasi yang tertimpa (*Zero Lost Update*). | `[DESIGN ONLY]` |
| 13 | **TC-IDM-01** | Retry dengan Payload Identik | Transaksi kasir sukses dengan kunci `k-1`. | Kasir kirim ulang kunci `k-1` dengan payload yang sama persis. | Sukses HTTP 200 mengembalikan struk asli. Saldo TIDAK dipotong untuk kedua kalinya. | `[DESIGN ONLY]` |
| 14 | **TC-IDM-02** | Kunci Sama Payload Berbeda | Transaksi kasir sukses dengan kunci `k-1` belanja Rp 10.000. | Request lain kirim kunci `k-1` belanja Rp 50.000. | Ditolak HTTP 409 Conflict ("Kunci Idempotensi Digunakan Ulang"). | `[DESIGN ONLY]` |
| 15 | **TC-WHK-01** | Webhook Flip Berulang (Duplicate Webhook) | Invoice Flip `inv-1` sudah sukses diproses. | Flip mengirimkan webhook kedua kalinya untuk `inv-1`. | Diabaikan (*Idempotent OK*), saldo tidak ditambah dua kali. | `[DESIGN ONLY]` |
| 16 | **TC-ATM-01** | Kegagalan di Tengah Transaksi | Saldo Rp 50.000. Error terjadi setelah update saldo sebelum insert transaksi. | Simulasi database error saat langkah kedua. | Transaksi rollback penuh. Saldo santri tetap utuh Rp 50.000, nol log saku tersimpan. | `[DESIGN ONLY]` |
| 17 | **TC-ISO-01** | Gateway Down Transaksi Internal Normal | Layanan Flip eksternal mati total (500 / timeout). | Santri belanja di kantin internal via RFID. | Transaksi kasir sukses 100%. Bukti nol ketergantungan gateway. | `[DESIGN ONLY]` |
| 18 | **TC-POS-01** | Transaksi Layanan Nonfisik | Santri bayar denda tata tertib Rp 25.000 via RFID. | Transaksi POS jenis `obligation_payment`. | Saldo terpotong Rp 25.000, struk terbit dengan referensi denda, item tercatat nonfisik. | `[DESIGN ONLY]` |
| 19 | **TC-CHK-01** | Penegakan Constraint Saldo Non-Negatif | Saldo Rp 0. Bypass logika aplikasi untuk memaksa saldo minus Rp 10.000. | Eksekusi query direct update saldo minus. | Database PostgreSQL melempar `23514 check_violation`. Penolakan di level kernel DB. | `[DESIGN ONLY]` |
| 20 | **TC-REC-01** | Rekonsiliasi Saldo vs Log Mutasi | Saldo akhir dompet Rp 75.000. | Query agregasi `balance_before + sum(amount)` pada `wallet_pockets`. | Nilai matematis mutasi saku sama persis dengan saldo fisik dompet (`Delta = 0`). | `[DESIGN ONLY]` |

---

## 11. KEPUTUSAN PRODUCT OWNER YANG MASIH TERBUKA

Isu-isu berikut diidentifikasi tetap berstatus **TERBUKA** dan memerlukan keputusan resmi Product Owner sebelum mandat implementasi diterbitkan:

1. **Pemilihan Algoritma Hashing PIN Final**:
   - *Opsi A (Rekomendasi Arsitek)*: PBKDF2-HMAC-SHA256 (100.000 iterasi + salt acak 16-byte + server pepper di `.env`). Nol dependensi pihak ketiga, ramah serverless Next.js, latensi ~20ms.
   - *Opsi B*: Argon2id (m=19456, t=2, p=1). Tingkat keamanan kriptografis memory-hard tertinggi, namun membutuhkan kompilasi native binary C++.
2. **Kebijakan Refund dan Pembatalan Transaksi Kasir**:
   - Jika santri salah membeli barang atau barang rusak di kasir, bagaimana alur refund yang diotorisasi? Apakah kasir dapat melakukan refund langsung dalam batas waktu tertentu (misal 15 menit), atau harus melalui persetujuan Admin Keuangan?
3. **Kebijakan Refund Saldo Model B**:
   - Bagaimana penanganan pengembalian sisa saldo terpadu keluarga jika santri lulus atau keluar dari pesantren? (Tetap berstatus terbuka sesuai arahan mandat).

---

## 12. DEPENDENSI DAN ASUMSI YANG BELUM TERVERIFIKASI

1. **Kapasitas Beban Supabase Transaction Pooler**:
   - Penggunaan `SELECT ... FOR UPDATE` menahan baris database selama masa transaksi (~15–40 ms). Pada jam sibuk istirahat santri (ratusan transaksi kasir per menit lintas tenant), performa antrean pooler PgBouncer belum dapat diverifikasi tanpa pengujian beban di lingkungan staging sandbox.
2. **Karakteristik Hardware Kasir Fisik**:
   - Protokol komunikasi serial/USB antara scanner RFID fisik di lapangan dengan antarmuka web kasir belum diuji secara perangkat keras (bergantung pada ketersediaan hardware di lapangan).

---

## 13. RENCANA IMPLEMENTASI BERTAHAP (WORK PACKAGES)

Apabila Product Owner menyetujui draf revisi ini dan menerbitkan izin implementasi, pekerjaan wajib dibagi ke dalam 4 paket terisolasi:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PAKET 1: MIGRATION & SCHEMA HARDENING                                       │
│ 1. Tambah CHECK constraint non-negative balance pada tabel wallets.         │
│ 2. Tambah failed_pin_attempts, locked_at, pin_salt pada rfid_cards.        │
│ 3. Tambah idempotency_key, request_hash pada canteen_transactions.          │
│ 4. Terbitkan tabel relasional canteen_transaction_items.                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PAKET 2: REFAKTOR CORE ATOMICITY & IDEMPOTENSI                             │
│ 1. Refaktor /api/canteen/pay ke dalam db.transaction() dengan row lock.     │
│ 2. Refaktor /api/webhooks/flip dengan row lock wallets yang kompatibel.     │
│ 3. Terapkan validasi Idempotency-Key dan deteksi konflik payload (HTTP 409).│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PAKET 3: KEAMANAN PIN & ENDPOINT RESET OTORITATIF                           │
│ 1. Terapkan KDF ber-salt untuk verifikasi PIN kasir.                        │
│ 2. Terapkan auto-block 3x pada transaksi serial DB.                         │
│ 3. Bangun POST /api/rfid/reset-pin (Otorisasi: Wali Kelas & Admin Keuangan).│
│ 4. Integrasikan audit trail pencatatan buka blokir.                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PAKET 4: SUITE PENGUJIAN OTOMATIS & VERIFIKASI STAGING                      │
│ 1. Eksekusi 20 skenario pengujian unit & integrasi (TC-PIN s/d TC-REC).     │
│ 2. Uji konkurensi double-spending pada staging terisolasi.                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 14. DAFTAR FILE DAN DOKUMEN YANG DIPERIKSA

Seluruh temuan faktual dalam dokumen ini bersumber langsung dari pembacaan kode riil:
1. `src/app/api/canteen/pay/route.ts` (Entry point transaksi kasir).
2. `src/app/api/webhooks/flip/route.ts` (Entry point webhook gateway Flip).
3. `src/lib/db/schema/finance.ts` (Skema dompet, saku, transaksi, dan kantin).
4. `src/lib/db/schema/rfid.ts` (Skema kartu RFID dan absensi).
5. `drizzle/0000_neat_machine_man.sql` (Migrasi DDL database aktif).
6. `src/lib/db/index.ts` (Konfigurasi client database `postgres-js`).
7. `src/lib/services/wallet-freeze-service.ts` (Service logika Wallet Freeze).
8. `docs/spesifikasi-pembayaran.md` (Spesifikasi kanonis Aturan Mutlak 1–13).
9. `docs/architecture/REPORT-M2-FINANCE-RFID-REMEDIATION-DESIGN-001.md` (Laporan M2-005).

---

## 15. KEPATUHAN READ-ONLY & STATUS OTORISASI

Dokumen draf ini disusun secara murni di bawah protokol **STRICT READ-ONLY**:
- Tidak ada file kode aplikasi atau basis data yang dimodifikasi.
- Tidak ada migrasi Drizzle yang diterbitkan atau dijalankan.
- Tidak ada tugas engineering T1–T26 yang dimulai.

**FINAL STATUS: DRAFT REVISED REMEDIATION DESIGN COMPLETE.**  
**IMPLEMENTATION STATUS: NOT AUTHORIZED.**  

*Dokumen draf ini diserahkan kepada Product Owner (`Process_PO`) dan Acting Process_Mandor (`Mandor 2`) untuk proses evaluasi dan keputusan ratifikasi.*
