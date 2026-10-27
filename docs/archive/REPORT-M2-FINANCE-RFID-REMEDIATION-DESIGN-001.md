# REPORT-M2-FINANCE-RFID-REMEDIATION-DESIGN-001
## Rancangan Remediasi Arsitektur: Penguatan Transaksi RFID, Atomicity, Idempotensi, dan Integritas Finansial

**Project:** APP MA’HAD / Os_Darta  
**Lead Agent:** ZenOrion — Antigravity Lead Agent  
**Otoritas:** Process_PO (Product Owner) & Acting Process_Mandor (Mandor 2)  
**Mandate Type:** Independent Architecture Review & Remediation Design  
**Execution Mode:** STRICT READ-ONLY  
**Implementation Authorization:** NOT AUTHORIZED  
**Dokumen Acuan:**
- `docs/spesifikasi-pembayaran.md` (Aturan Mutlak 1–13)
- `docs/architecture/REPORT-M2-FINANCE-ARCHITECTURE-001.md`
- `docs/architecture/SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md`
- `docs/architecture/REPORT-M2-FINANCE-MERCHANT-WALLET-GAP-AUDIT-001.md`
- `docs/architecture/DRAFT-FINANCE-MERCHANT-WALLET-EXTENSION-001.md`
- `docs/architecture/REPORT-M2-FINANCE-WALLET-LEDGER-AUDIT-001.md`
- `docs/architecture/REPORT-M2-FINANCE-RFID-INTERNAL-PAYMENT-VERIFICATION-001.md`  
**Tanggal:** 19 Oktober 2026  

---

## 1. EXECUTIVE SUMMARY

Berdasarkan penugasan **MANDATE M2-FINANCE-ARCHITECTURE-005**, telah disusun cetak biru arsitektur remediasi (*Remediation Design*) untuk menangani kelemahan finansial, konkurensi, atomisitas, idempotensi, dan keamanan PIN pada sistem pembayaran internal RFID santri di APP MA'HAD.

Rancangan ini berpijak pada temuan empiris `REPORT-M2-FINANCE-RFID-INTERNAL-PAYMENT-VERIFICATION-001` serta kode sumber aktual repositori (`src/app/api/canteen/pay/route.ts`, `src/lib/db/schema/finance.ts`, `src/lib/db/schema/rfid.ts`, dan `src/app/api/webhooks/flip/route.ts`).

### Ikhtisar Validasi Risiko dan Solusi Remediasi:
1. **Risiko Konkurensi & Double Spending** `[TERBUKTI]`:
   - Operasi pengecekan saldo dan pengurangan saldo pada `/api/canteen/pay` berlangsung di memori Node.js tanpa penguncian baris database (`FOR UPDATE` atau conditional atomic decrement).
   - Dua transaksi yang dieksekusi bersamaan dalam milidetik yang sama dapat membaca saldo awal yang sama, memicu *race condition* yang memungkinkan santri membelanjakan saldo melampaui sisa riilnya (*double spending*).
   - Solusi Remediasi: Membungkus seluruh alur dalam blok `db.transaction()` dengan penguncian baris eksplisit (`SELECT ... FOR UPDATE`) atau *conditional atomic decrement* (`balance = balance - :amount WHERE balance >= :amount`).
2. **Risiko Inkonsistensi Parsial (Atomicity Gap)** `[TERBUKTI]`:
   - Update saldo `wallets`, pencatatan `canteen_transactions`, dan penulisan log `wallet_pockets` saat ini berupa 3 query terpisah tanpa transaksi ACID.
   - Solusi Remediasi: Mengikat ketiga penulisan ke dalam unit transaksi atomik PostgreSQL; kegagalan pada langkah apapun akan memicu *automatic rollback*.
3. **Risiko Duplikasi Kasir & Ketiadaan Idempotensi** `[TERBUKTI]`:
   - Tidak ada pemeriksaan idempotensi persisten; double-click tombol kasir atau retry akibat timeout jaringan menghasilkan dua kali pemotongan saldo.
   - Solusi Remediasi: Menerapkan mekanisme idempotensi berbasis token persisten di tingkat database dengan *unique constraint* `(tenant_id, idempotency_key)`.
4. **Kelemahan Keamanan PIN & Ketiadaan Auto-Block 3x** `[TERBUKTI]`:
   - PIN saat ini diverifikasi secara teks polos (`card.hashedPin !== pin && card.hashedPin !== 'pin_' + pin`).
   - Tidak ada penghitung kesalahan PIN pada tabel `rfid_cards` sehingga kartu rentan terhadap serangan *brute force* 10.000 kombinasi PIN.
   - Solusi Remediasi: Mengadopsi hashing ber-salt unik per kartu (evaluasi PBKDF2-HMAC-SHA256), counter kegagalan terpusat, penguncian kartu otomatis pada kegagalan ke-3 (`status = 'blocked'`), serta alur reset PIN khusus untuk peran **Wali Kelas** dan **Admin Keuangan** (Wali Santri tidak diizinkan sesuai keputusan PO).
5. **Pemisahan Sumber Kebenaran Saldo dan Ledger** `[TERBUKTI]`:
   - Sumber kebenaran saat ini adalah balance column `wallets.balance_uang_saku`.
   - Tidak ada double-entry financial ledger di skema database aktif. Disajikan model integrasi *hybrid balance engine* agar saldo transaksi kasir tidak melenceng dari rekonsiliasi akuntansi.

---

## 2. EXECUTION BOUNDARY DAN BUKTI READ-ONLY

Mandat M2-FINANCE-ARCHITECTURE-005 dilaksanakan dengan kepatuhan penuh terhadap prinsip tata kelola **STRICT READ-ONLY**:

- **File repositori dimutasi**: **0 file** (tidak ada perubahan pada `src/`, `drizzle/`, konfigurasi, maupun permission).
- **Operasi Database**: **0 DDL / 0 DML / 0 Seeding**. Tidak ada tabel, kolom, indeks, atau constraint baru yang diterbitkan.
- **Pengujian Mutatif**: **0 transaksi finansial nyata** dan **0 mock transaction** dijalankan ke database lokal maupun remote.
- **Status Otorisasi**: **IMPLEMENTATION NOT AUTHORIZED**. Seluruh kode yang tercantum dalam dokumen ini merupakan *Architectural Blueprint & Pseudocode Design* untuk ditinjau oleh Product Owner dan Acting Process_Mandor.

---

## 3. REPOSITORY, BRANCH, COMMIT, DAN STATUS GIT

Pemeriksaan status lingkungan kerja per 19 Oktober 2026:

| Parameter | Nilai Aktual Repositori | Status Verifikasi |
|---|---|---|
| **Workspace Aktif** | `E:\Projects\Os_Darta` | `[TERBUKTI]` |
| **Active Branch** | `preview` | `[TERBUKTI]` |
| **Commit HEAD** | `e61a237 feat(tenant): harden tenant resolver Phase A and A1 contracts` | `[TERBUKTI]` |
| **Candidate Worktree** | `E:\Projects\Os_Darta-domain-a2.7-candidate` (detached HEAD `e61a237`) | `[TERBUKTI]` |
| **Status Git** | Bersih terhadap file kode produksi (hanya dokumen arsitektur di `docs/architecture/` yang bertambah). | `[TERBUKTI]` |

---

## 4. TEMUAN AKTUAL DAN BUKTI SOURCE CODE

Penelusuran menyeluruh terhadap file-file terkait transaksi RFID dan saldo:

### 4.1 Lokasi Kode Aktual Transaksi RFID
- **File**: `src/app/api/canteen/pay/route.ts`
  - *Baris 13–22*: Ekstraksi parameter request (`cardUid`, `pin`, `amount`, `canteenId`, `itemsDescription`, `posCashierId`, `tenantId`).
  - *Baris 44–48*: Query `rfid_cards` berdasarkan `tenantId` dan `cardUid`.
  - *Baris 57–62*: Pengecekan kartu terblokir (`card.status === 'blocked'`).
  - *Baris 65–70*: Validasi PIN:
    ```typescript
    if (card.hashedPin !== pin && card.hashedPin !== `pin_${pin}`) {
      return NextResponse.json({ success: false, message: 'Kode PIN / Sandi Santri Salah' }, { status: 401 });
    }
    ```
    *Bukti*: Evaluasi teks polos tanpa hashing kriptografis, tanpa update counter kegagalan, dan tanpa auto-block.
  - *Baris 87–91*: Query `wallets` berdasarkan `tenantId` dan `santriId` tanpa klausa penguncian baris (`FOR UPDATE`).
  - *Baris 100–119*: Pengecekan status Wallet Freeze (`suspended_by_walikelas`, `suspended_by_wali`, `blocked`).
  - *Baris 121–149*: Pengecekan limit harian belanja tenant via agregasi `canteen_transactions`.
  - *Baris 151–159*: Pengecekan saldo: `if (wallet.balanceUangSaku < amount)`.
  - *Baris 162–200*: Eksekusi mutasi saldo dan pencatatan transaksi:
    ```typescript
    const newBalance = wallet.balanceUangSaku - amount;
    await db.update(wallets).set({ balanceUangSaku: newBalance, updatedAt: new Date() }).where(eq(wallets.id, wallet.id));
    const txId = `tx_${Date.now()}`;
    await db.insert(canteenTransactions).values({ id: txId, ... });
    await db.insert(walletPockets).values({ id: `mut_${Date.now()}_cnt`, ... });
    ```
    *Bukti*: Tiga penulisan database independen tanpa `db.transaction()` dan ID berbasis milidetik `Date.now()`.

### 4.2 Lokasi Kode Aktual Skema Terkait
- **`src/lib/db/schema/finance.ts`**:
  - Tabel `wallets` (`L4–22`): Kolom `balance_uang_saku` (integer default 0), `canteen_status`, `daily_limit`.
  - Tabel `wallet_pockets` (`L25–37`): Kolom `pocket_type`, `mutation_type`, `amount`, `balance_before`, `balance_after`, `reference_id`.
  - Tabel `canteen_transactions` (`L90–103`): Kolom `items_description` (text biasa), `amount`, `pos_cashier_id`, `status`.
- **`src/lib/db/schema/rfid.ts`**:
  - Tabel `rfid_cards` (`L4–14`): Kolom `card_uid` (unique), `hashed_pin` (text), `status` ('active' | 'blocked').
  - *Fakta*: Tidak ada kolom `failed_pin_attempts`, `locked_until`, atau `last_failed_at`.

### 4.3 Lokasi Kode Jalur Webhook Top-Up Flip
- **`src/app/api/webhooks/flip/route.ts`**:
  - *Baris 82–92*: Kalkulasi saldo baru di memori Node.js:
    `const newUangSaku = wallet.balanceUangSaku + (invoice.amountUangSaku || 0);`
    lalu `db.update(wallets).set({ balanceUangSaku: newUangSaku })`.
  - *Fakta*: Tidak menggunakan transaksi database dan tidak menggunakan row lock.

---

## 5. AUDIT CONCURRENCY & RACE CONDITIONS

Analisis mendalam mengenai potensi benturan transaksi konkuren:

### 5.1 Skenario Double Spending Antar-Kasir (Intra-Canteen Race)
```
Kasir A (Terminal 1)                   Kasir B (Terminal 2)
      │                                      │
[t=0] Request Belanja Rp 30.000        Request Belanja Rp 30.000
      │                                      │
[t=1] SELECT wallet (Saldo = Rp 40.000)      │
      │                                      │
[t=2]   (Pengecekan: 40k >= 30k -> LOLOS)   SELECT wallet (Saldo = Rp 40.000)
      │                                      │
[t=3]   Hitung: 40k - 30k = 10k                (Pengecekan: 40k >= 30k -> LOLOS)
      │                                      │
[t=4] UPDATE wallet (Saldo = Rp 10.000)       Hitung: 40k - 30k = 10k
      │                                      │
[t=5] Selesai (Dipotong Rp 30.000)            UPDATE wallet (Saldo = Rp 10.000)
                                             │
                                       Selesai (Dipotong Rp 30.000)
```
- **Dampak Finansial**:
  - Total belanja santri riil: **Rp 60.000**.
  - Saldo awal: **Rp 40.000**.
  - Saldo akhir di database: **Rp 10.000**.
  - Kerugian Pesantren / Kasir: **Rp 30.000** (santri belanja melebihi sisa saldo, dan saldo akhir masih tersisa Rp 10.000 akibat overwrite nilai di baris 165).
- **Status Bukti**: `[TERBUKTI]` dari struktur kode `src/app/api/canteen/pay/route.ts:L87-170`.

### 5.2 Skenario Benturan Transaksi Kantin vs Top-Up Webhook (Cross-Flow Race)
- Jika wali santri melakukan top-up melalui Flip dan webhook tiba pada saat yang sama ketika santri sedang melakukan tap kartu di kantin:
  - Canteen API membaca `balance_uang_saku` = Rp 50.000.
  - Flip Webhook membaca `balance_uang_saku` = Rp 50.000 (top-up Rp 100.000).
  - Canteen API menulis `balance_uang_saku` = Rp 30.000 (setelah belanja Rp 20.000).
  - Flip Webhook menulis `balance_uang_saku` = Rp 150.000 (menghitung `50.000 + 100.000`).
  - **Hasil**: Pemotongan belanja kantin sebesar Rp 20.000 hilang terhapus oleh penimpaan nilai webhook (*lost update*).
- **Status Bukti**: `[TERBUKTI]` dari ketiadaan atomisitas bersama di `src/app/api/webhooks/flip/route.ts:L82-92` dan `/api/canteen/pay`.

### 5.3 Skenario Pelanggaran Limit Belanja Harian (Daily Limit Race)
- Baris 125–136 menghitung total belanja hari ini dengan menjumlahkan transaksi di `canteen_transactions`.
- Dua transaksi simultan masing-masing Rp 15.000 (limit Rp 20.000) keduanya membaca `totalSpentToday` = 0.
- Keduanya lolos validasi `0 + 15.000 <= 20.000`.
- Santri berhasil membelanjakan Rp 30.000 dalam sehari, melanggar batas perlindungan yang ditetapkan wali.

---

## 6. AUDIT ATOMICITY & PARTIAL FAILURE

Pemeriksaan baris 164–200 pada `src/app/api/canteen/pay/route.ts` menunjukkan adanya celah atomisitas serius:

```
[LANGKAH 1] UPDATE wallets SET balance_uang_saku = newBalance ...
      │  (Berhasil dieksekusi di database)
      ▼
─── CRASH / SERVERLESS TIMEOUT / DB CONNECTION DROPPED ───
      │
[LANGKAH 2] INSERT INTO canteen_transactions ... (TIDAK PERNAH TEREKSEKUSI)
      │
[LANGKAH 3] INSERT INTO wallet_pockets ...       (TIDAK PERNAH TEREKSEKUSI)
```

### Konsekuensi Partial Failure:
1. **Saldo Santri Terpotong Secara Sepihak**: Saldo di tabel `wallets` berkurang sebesar `amount`.
2. **Ketiadaan Bukti Transaksi di Kasir**: Tabel `canteen_transactions` tidak memiliki baris transaksi tersebut; kasir melihat respon error dan tidak menyerahkan makanan.
3. **Audit Trail Mutasi Rusak**: Tabel `wallet_pockets` tidak mencatat mutasi pemotongan ini.
4. **Rekonsiliasi Mustahil Dilakukan**: Saldo dompet berkurang tanpa ada referensi `txId` maupun alasan mutasi.
- **Status Bukti**: `[TERBUKTI]`. Drizzle ORM pada file ini memanggil `db.update` dan `db.insert` secara serial tanpa pembungkus `await db.transaction(async (tx) => { ... })`.

---

## 7. AUDIT IDEMPOTENSI TRANSAKSI KASIR

### 7.1 Kelemahan Implementasi Kasir Saat Ini
- **Ketiadaan Idempotency Key**: Request body pada `/api/canteen/pay` tidak menyertakan parameter `idempotencyKey` atau header `Idempotency-Key`.
- **Pembuatan ID Transaksi yang Lemah**:
  `const txId = 'tx_' + Date.now();` (`L173`)
  `id: 'mut_' + Date.now() + '_cnt'` (`L190`)
  Jika kasir menekan tombol "Bayar" dua kali dengan jeda 100 milidetik, sistem akan memperlakukan klik kedua sebagai transaksi pembelian kedua yang sah dan memotong saldo santri dua kali lipat.
- **Masalah Network Retry**:
  Jika POS terminal mengalami *read timeout* setelah mengirim request (padahal server sudah memotong saldo), kasir yang menekan tombol "Coba Lagi" akan memotong saldo santri untuk kedua kalinya.

### 7.2 Mengapa Header Saja Tidak Cukup?
- Penerapan header `Idempotency-Key` di level middleware tanpa persistensi database relasional (*transactional idempotency state*) tidak menjamin isolasi pada arsitektur serverless (seperti Vercel / Next.js API Routes). Beberapa instance kontainer yang berjalan paralel tidak dapat berbagi *in-memory cache*.
- Solusi idempotensi wajib berakar pada **Database Unique Constraint** di dalam tenant yang sama.

---

## 8. AUDIT SUMBER KEBENARAN SALDO DAN KONSISTENSI LEDGER

Evaluasi terhadap pertanyaan kritis mandat mengenai arsitektur saldo:

### 8.1 Apa Sumber Kebenaran Saldo Saat Ini?
- **Fakta**: Sumber kebenaran operasional (*runtime source of truth*) adalah **kolom saldo fisik** `wallets.balance_uang_saku` dan `wallets.balance_tabungan` (`src/lib/db/schema/finance.ts:L9-10`).
- Sistem membaca langsung nilai dari kolom ini saat memvalidasi pembayaran dan menolak transaksi jika kolom ini bernilai lebih kecil dari `amount`.

### 8.2 Apakah Saldo Berasal dari Ledger atau Balance Column?
- Saldo **TIDAK** dihitung (*derived*) dari ledger.
- Tabel `wallet_pockets` bertindak sebagai log mutasi searah (*write-only audit log*). Sistem tidak memiliki mekanisme penghitungan saldo on-the-fly (`SELECT SUM(amount) FROM wallet_pockets`).

### 8.3 Apakah Mutasi Dapat Direkonsiliasi dengan Saldo?
- Secara teoritis dapat direkonsiliasi karena `wallet_pockets` menyimpan `balance_before` dan `balance_after`.
- Namun, karena pembaruan saldo di `wallets` dan penulisan di `wallet_pockets` tidak berada dalam transaksi ACID, jika terjadi *partial failure*, mutasi di `wallet_pockets` akan tertinggal dan menyebabkan selisih tak terdokumentasi (*ledger drift*).

### 8.4 Apakah Ada Double-Entry Ledger di Skema Database Aktif?
- **Fakta**: Belum ada tabel double-entry general ledger (`ledger_entries`) pada skema database PostgreSQL aktif.
- Spesifikasi `docs/spesifikasi-pembayaran.md` (Aturan Mutlak 1–13) mengamanatkan pencatatan akuntansi yang ketat, dan cetak biru `DRAFT-FINANCE-MERCHANT-WALLET-EXTENSION-001.md` telah merancang bagan akun, namun implementasi DDL-nya belum diratifikasi.
- **Risiko Ledger Ganda**: Jika pengembang langsung membuat sistem ledger baru tanpa menghubungkan mutasi uang saku ke jurnal liabilitas (`CUSTODIAL_WALLET_LIABILITY`), akan terjadi dualitas kebenaran antara saldo kas fisik dan saldo virtual santri.

---

## 9. RANCANGAN REMEDIASI TRANSAKSI RFID

Cetak biru arsitektur untuk menjamin **Atomicity, Concurrency Protection, dan Idempotensi** pada pembayaran RFID:

### 9.1 Pola Transaksi Terpadu (Unified ACID Transaction Block)
Seluruh operasi pemotongan saldo, validasi limit, pencatatan transaksi kasir, dan penulisan log mutasi disatukan ke dalam satu transaksi PostgreSQL melalui Drizzle ORM:

```
BEGIN TRANSACTION;
  1. Resolusi Tenant & Canteen
  2. Kunci Baris Kartu RFID & Verifikasi PIN:
     SELECT * FROM rfid_cards WHERE tenant_id = :tenant AND card_uid = :uid FOR UPDATE;
  3. Kunci Baris Dompet Santri:
     SELECT * FROM wallets WHERE tenant_id = :tenant AND santri_id = :santriId FOR UPDATE;
  4. Periksa Idempotency Key pada Tabel Transaksi:
     SELECT * FROM canteen_transactions WHERE tenant_id = :tenant AND idempotency_key = :key;
     -> Jika sudah ada, ROLLBACK & kembalikan respon transaksi lama (HTTP 200).
  5. Validasi Aturan Bisnis:
     - Kartu 'active'? (Jika gagal -> increment counter gagal PIN -> COMMIT -> HTTP 401/403)
     - Wallet 'active'? (Tidak tersuspensi oleh wali/wali kelas)
     - Limit Belanja Harian mencukupi?
     - Saldo Uang Saku >= Amount?
  6. Eksekusi Debit Saldo:
     UPDATE wallets SET balance_uang_saku = balance_uang_saku - :amount, updated_at = NOW() WHERE id = :walletId;
  7. Catat Transaksi POS Kasir:
     INSERT INTO canteen_transactions (..., idempotency_key, status) VALUES (..., :key, 'SUCCESS');
  8. Catat Mutasi Saku:
     INSERT INTO wallet_pockets (..., mutation_type = 'canteen_deduct', ...);
COMMIT;
```

### 9.2 Perbandingan Mekanisme Penguncian Concurrency

| Kriteria Evaluasi | Opsi 1: Row-Level Locking (`FOR UPDATE`) | Opsi 2: Conditional Atomic Decrement | Rekomendasi Terpilih |
|---|---|---|---|
| **Cara Kerja** | Mengunci baris `wallets` sejak awal transaksi `tx.select().for('update')`. | `UPDATE wallets SET balance = balance - :amt WHERE id = :id AND balance >= :amt RETURNING balance`. | **Opsi 1 (FOR UPDATE)** |
| **Pencegahan Double Spending** | Mutlak (transaksi paralel harus menunggu antrean gilir baris). | Mutlak (baris hanya terpotong jika saldo memenuhi syarat). | Keduanya efektif. |
| **Kebutuhan Baca Data Lain** | Membaca status `canteen_status`, `daily_limit`, dan nama santri secara konsisten. | Sulit membaca status lain dalam satu statement update tanpa query terpisah. | **Opsi 1 lebih unggul**. |
| **Kompatibilitas Supabase Pooler** | Berfungsi sempurna di dalam blok transaksi (`postgres-js` transaction mode). | Berfungsi sempurna. | Keduanya kompatibel. |

*Rekomendasi Arsitektur*: Gunakan **Opsi 1 (`FOR UPDATE`)** di dalam `db.transaction()` karena alur transaksi kantin membutuhkan pembacaan komprehensif atas status Wallet Freeze (`suspended_by_wali`, `suspended_by_walikelas`) dan limit harian sebelum saldo diputuskan untuk dipotong.

### 9.3 Rincian Desain Idempotensi Persisten
1. **Struktur Kunci Idempotensi**:
   Setiap terminal kasir wajib menghasilkan token transaksi unik format UUID v4 sebelum mengirim payload:
   `Idempotency-Key: pos-<canteenId>-<posCashierId>-<uuidv4>`
2. **Constraint Database yang Diusulkan**:
   Pada tabel `canteen_transactions`, ditambahkan kolom:
   - `idempotency_key: text('idempotency_key')`
   - Indeks unik: `UNIQUE (tenant_id, idempotency_key)`
3. **Penanganan Kasus Edge (Edge Case Handling)**:
   - **Skenario Timeout Jaringan**: Kasir mengirim `idempotency_key = "abc-123"`. Server berhasil memotong saldo dan mencatat transaksi, tetapi koneksi ke kasir terputus sebelum kasir menerima respon. Kasir menekan tombol "Bayar Lagi" dengan kunci `"abc-123"`.
   - **Perilaku Database**: Query tahap 4 mendeteksi bahwa `"abc-123"` sudah ada dan berstatus `'SUCCESS'`. Transaksi tidak dipotong ulang, melainkan langsung mengembalikan salinan respon sukses beserta rincian transaksi yang telah tersimpan.
   - **Skenario Permintaan Bersamaan (Simultaneous Duplicate Tap)**: Jika dua request dengan kunci identik tiba bersamaan, request pertama memegang lock transaksi; request kedua tertahan, dan begitu request pertama commit, request kedua mendeteksi baris tersebut melalui unique constraint dan mengembalikan status transaksi tanpa pemotongan ganda.

---

## 10. RANCANGAN KEAMANAN PIN RFID

Audit menunjukkan perlunya penguatan radikal pada penyimpanan dan validasi PIN tanpa melanggar batas keputusan Product Owner yang sudah terkunci.

### 10.1 Evaluasi & Perbandingan Algoritma Hashing PIN

Sesuai arahan PO, keputusan algoritma hashing masih terbuka. Berikut analisis perbandingan teknis:

| Algoritma | Kelebihan Teknis | Kelemahan / Trade-off | Kebutuhan Dependensi | Rekomendasi Auditor |
|---|---|---|---|---|
| **PBKDF2-HMAC-SHA256** (Salt Unik + 10.000 iterasi) | - Standar industri NIST.<br>- Sangat aman untuk PIN 4–6 digit.<br>- Waktu verifikasi terukur (~5–15 ms). | Membutuhkan penyimpanan salt unik per kartu di database. | **Nol Dependensi** (Bawaan `node:crypto`). | **SANGAT DIREKOMENDASIKAN** |
| **bcrypt / Argon2id** | - Perlindungan memory-hard tertinggi terhadap GPU cracking. | - Kompilasi binary native (risiko kompatibilitas deployment Vercel/Serverless).<br>- Konsumsi CPU tinggi pada lonjakan ratusan antrean kantin. | Modul C++ / WASM eksternal (`bcrypt` atau `argon2`). | Alternatif sekunder. |
| **HMAC-SHA256 dengan Server Pepper** | - Sangat cepat (<1 ms).<br>- Perlindungan tinggi jika DB bocor tanpa server secret. | Jika server secret bocor atau tidak dirotasi dengan benar, proteksi melemah. | Bawaan `node:crypto`. | Tidak disarankan untuk PIN santri tanpa KDF. |

*Rekomendasi Teknis untuk Ditinjau PO*: **PBKDF2-HMAC-SHA256** dengan 10.000 iterasi, menggunakan salt unik acak 16-byte yang disimpan pada kartu RFID (`rfid_cards.pin_salt`).

### 10.2 Mekanisme Penghitung Kegagalan & Auto-Block 3x
1. **Penambahan Kolom Skema `rfid_cards` (Rancangan)**:
   - `failed_pin_attempts: integer('failed_pin_attempts').default(0).notNull()`
   - `locked_at: timestamp('locked_at')`
   - `locked_reason: text('locked_reason')`
   - `pin_salt: text('pin_salt')`
2. **Logika Eksekusi Validasi PIN di Server**:
   ```typescript
   // Ilustrasi Pseudocode Remediasi (Belum Diimplementasikan):
   const isPinValid = verifyPin(pin, card.hashedPin, card.pinSalt);
   
   if (!isPinValid) {
     const newAttempts = card.failedPinAttempts + 1;
     const isNowBlocked = newAttempts >= 3;
     
     await tx.update(rfidCards).set({
       failedPinAttempts: newAttempts,
       status: isNowBlocked ? 'blocked' : card.status,
       lockedAt: isNowBlocked ? new Date() : card.lockedAt,
       lockedReason: isNowBlocked ? 'Otomatis: 3x salah memasukkan PIN' : card.lockedReason,
     }).where(eq(rfidCards.id, card.id));
     
     if (isNowBlocked) {
       return NextResponse.json({
         success: false,
         code: 'CARD_BLOCKED_PIN_LIMIT',
         message: 'Kartu diblokir otomatis karena 3x salah memasukkan PIN. Silakan hubungi Wali Kelas atau Admin Keuangan.',
       }, { status: 403 });
     }
     
     const remaining = 3 - newAttempts;
     return NextResponse.json({
       success: false,
       code: 'INVALID_PIN',
       message: `Kode PIN Salah. Sisa kesempatan: ${remaining} kali sebelum kartu diblokir.`,
     }, { status: 401 });
   }
   
   // Jika PIN Benar: Reset counter jika sebelumnya pernah ada kegagalan
   if (card.failedPinAttempts > 0) {
     await tx.update(rfidCards).set({ failedPinAttempts: 0 }).where(eq(rfidCards.id, card.id));
   }
   ```

### 10.3 Alur Otorisasi Reset PIN dan Pembukaan Blokir
Sesuai **Keputusan PO Terkunci (Sub-bab 3.2)**:
- **Hanya Wali Kelas dan Admin Keuangan yang berwenang mereset PIN dan membuka blokir**.
- **Wali Santri TIDAK memiliki kewenangan reset PIN**.
- **Reset PIN yang sah sekaligus membuka status blokir kartu**.

*Desain Alur API Reset PIN (`POST /api/rfid/reset-pin`)*:
1. **Otorisasi Server-Side**:
   - Memeriksa session JWT pengguna.
   - Memastikan role pengguna adalah `WALI_KELAS` (hanya untuk santri di kelas binaannya) atau `ADMIN_KEUANGAN` / `SUPERADMIN`.
   - Menolak dengan HTTP 403 jika dipanggil oleh `WALI_SANTRI` atau `CASHIER`.
2. **Operasi Database Atomik**:
   - Menghasilkan salt baru secara acak.
   - Menghitung hash PBKDF2 dari PIN baru (4–6 digit angka).
   - Memperbarui `rfid_cards`:
     * `hashed_pin = newHashedPin`
     * `pin_salt = newSalt`
     * `failed_pin_attempts = 0`
     * `status = 'active'` (Membuka blokir otomatis)
     * `locked_at = null`
     * `locked_reason = null`
     * `updated_at = NOW()`
3. **Pencatatan Audit Log Wajib**:
   - Menulis catatan ke `audit_logs`:
     * `actor_id`, `actor_role` ('wali_kelas' | 'admin_keuangan')
     * `action` = 'RESET_RFID_PIN_AND_UNBLOCK'
     * `target_santri_id`, `card_uid`
     * `timestamp`

---

## 11. TEST MATRIX DAN ACCEPTANCE CRITERIA (RANCANGAN)

Matriks pengujian terperinci ini disiapkan untuk memvalidasi kepatuhan sistem ketika mandat implementasi diizinkan pada masa mendatang:

> **PERINGATAN TATA KELOLA:**  
> Seluruh skenario pengujian di bawah ini adalah **RANCANGAN PENGUJIAN KONSEPTUAL** dan **BELUM DIJALANKAN** untuk mematuhi batas `STRICT READ-ONLY`.

| ID Test | Kategori Pengujian | Kondisi Awal (Pre-condition) | Aksi Pengujian | Hasil yang Diharapkan (Acceptance Criteria) | Evidence Tag Verifikasi Masa Depan |
|---|---|---|---|---|---|
| **TC-NRM-01** | Transaksi Normal | Kartu aktif, saldo Rp 50.000, limit Rp 20.000, PIN benar ('1234'). | Request belanja Rp 10.000 dengan PIN '1234'. | HTTP 200 Sukses. Saldo uang saku berkurang tepat Rp 10.000 (sisa Rp 40.000). Transaksi kasir dan mutasi saku tercatat konsisten. Nol fee gateway. | `[DESIGN ONLY]` |
| **TC-NRM-02** | Saldo Kurang | Saldo Rp 5.000, kartu aktif, PIN benar. | Request belanja Rp 15.000. | HTTP 400 Ditolak ("Saldo Uang Saku Tidak Cukup"). Saldo tetap Rp 5.000. Tidak ada mutasi atau transaksi tercatat. | `[DESIGN ONLY]` |
| **TC-NRM-03** | Limit Harian | Saldo Rp 50.000, belanja hari ini sudah Rp 15.000 (limit Rp 20.000). | Request belanja Rp 10.000. | HTTP 400 Ditolak ("Mencapai Limit Belanja Harian"). Saldo tetap Rp 50.000. | `[DESIGN ONLY]` |
| **TC-SEC-01** | PIN Salah 1x & 2x | Kartu aktif, counter gagal = 0. | Masukkan PIN salah 1 kali. | HTTP 401 Ditolak ("Kode PIN Salah"). Counter `failed_pin_attempts` naik menjadi 1. Kartu tetap 'active'. Sisa kesempatan dilaporkan. | `[DESIGN ONLY]` |
| **TC-SEC-02** | Auto-Block 3x Salah | Kartu aktif, counter gagal = 2. | Masukkan PIN salah untuk ketiga kalinya. | HTTP 403 Ditolak ("Kartu Diblokir Otomatis"). Counter `failed_pin_attempts` = 3, `status` kartu berubah menjadi `'blocked'`. | `[DESIGN ONLY]` |
| **TC-SEC-03** | Kartu Terblokir | Kartu berstatus `'blocked'`. | Request belanja meskipun dengan PIN yang benar. | HTTP 403 Ditolak ("Transaksi Ditolak: Kartu Diblokir"). Nol mutasi saldo. | `[DESIGN ONLY]` |
| **TC-SEC-04** | Reset PIN Sah | Kartu berstatus `'blocked'`, counter = 3. | Admin Keuangan / Wali Kelas memanggil endpoint reset PIN dengan PIN baru. | HTTP 200 Sukses. PIN diperbarui dengan salt baru. Counter di-reset ke 0, status kartu otomatis kembali `'active'`. Audit log tercatat. | `[DESIGN ONLY]` |
| **TC-SEC-05** | Reset PIN Tak Sah | Kartu `'blocked'`. | Wali Santri atau Kasir mencoba memanggil endpoint reset PIN. | HTTP 403 Forbidden. Akses ditolak server-side. Kartu tetap `'blocked'`. | `[DESIGN ONLY]` |
| **TC-CON-01** | Concurrency Race (Double Spending) | Saldo Rp 30.000. Dua terminal mengirim request bersamaan masing-masing Rp 20.000 dalam 1 ms. | Eksekusi konkuren paralel di dua thread database. | Tepat 1 transaksi berhasil memotong saldo (sisa Rp 10.000), dan 1 transaksi lainnya ditolak dengan pesan saldo tidak cukup. Saldo tidak pernah menjadi negatif. | `[DESIGN ONLY]` |
| **TC-CON-02** | Cross-Flow Race (Top-Up vs Canteen) | Saldo Rp 50.000. Canteen debit Rp 20.000 bersamaan dengan Webhook Top-Up Rp 100.000. | Eksekusi paralel canteen pay dan webhook. | Saldo akhir tepat Rp 130.000 (`50k - 20k + 100k`). Tidak ada transaksi yang tertimpa (*zero lost update*). | `[DESIGN ONLY]` |
| **TC-IDM-01** | Idempotency Replay | Kasir mengirim request belanja dengan `Idempotency-Key: idemp-001`. | Request pertama sukses. Kasir mengirim kembali request identik dengan `Idempotency-Key: idemp-001`. | Request kedua mengembalikan HTTP 200 dengan payload respon transaksi pertama. Saldo santri **TIDAK dipotong dua kali**. | `[DESIGN ONLY]` |
| **TC-ATM-01** | Partial Failure Rollback | Saldo Rp 50.000. Simulasikan database crash / error saat penulisan `canteen_transactions`. | Eksekusi transaksi dengan inject error pada langkah kedua. | Seluruh transaksi di-rollback secara otomatis. Saldo uang saku santri tetap utuh Rp 50.000. Nol mutasi saku tercatat. | `[DESIGN ONLY]` |

---

## 12. DAFTAR KEPUTUSAN PRODUCT OWNER YANG MASIH TERBUKA

Untuk menyempurnakan spesifikasi sebelum pekerjaan implementasi disahkan, Product Owner diharapkan memberikan keputusan final atas hal-hal berikut:

1. **Pemilihan Standar Algoritma Hashing PIN**:
   - Opsi A (Rekomendasi Arsitek): **PBKDF2-HMAC-SHA256** (10.000 iterasi, salt acak 16-byte unik per kartu, modul bawaan Node.js tanpa dependensi pihak ketiga).
   - Opsi B: **bcrypt** (work factor 10, memerlukan modul binary native).
2. **Kebijakan Pemblokiran Kartu**:
   - Apakah kartu yang terkena 3x salah PIN diblokir secara permanen sampai ada aksi reset manual dari petugas berwenang, ataukah ada batas waktu pembukaan otomatis (*cooldown* misal 2 jam)?
   - *Rekomendasi Arsitek*: Sesuai keputusan PO sub-bab 3.2, kartu harus **tetap diblokir permanen sampai di-reset oleh Wali Kelas atau Admin Keuangan** guna mencegah serangan tebak PIN berselang waktu.
3. **Penyimpanan Rincian Barang Transaksi POS**:
   - Apakah disetujui penerbitan tabel relasional baru `canteen_transaction_items` (mencatat `item_id`, `item_name`, `qty`, `unit_price`, `subtotal`) untuk menggantikan kolom teks bebas `items_description`?

---

## 13. RISIKO YANG BELUM DAPAT DIVERIFIKASI SECARA RUNTIME

Karena mandat ini beroperasi dalam batasan **STRICT READ-ONLY**, verifikasi berikut belum dapat disimpulkan secara empiris di tingkat runtime:

1. **Throughput Supabase Transaction Pooler under High Concurrency**:
   - Kinerja latensi penguncian baris (`FOR UPDATE`) di PostgreSQL ketika 50 kasir melakukan tap kartu serempak pada jam istirahat santri belum dapat diukur tanpa pengujian beban (*load test*) di lingkungan sandbox/staging.
2. **Karakteristik Hardware Kasir (NFC Timeout)**:
   - Durasi batas tunggu (*timeout threshold*) pada terminal kasir fisik terhadap respon API Next.js di lapangan belum terkalibrasi secara empiris.

---

## 14. REKOMENDASI PRIORITAS DAN DEPENDENSI KERJA

Apabila Product Owner dan Acting Process_Mandor memutuskan untuk membuka mandat implementasi, pekerjaan wajib diurutkan berdasarkan dependensi berikut:

```
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 1: MIGRASI SKEMA DATABASE RFID & IDEMPOTENSI                     │
│ - Tambah failed_pin_attempts, locked_at, pin_salt pada rfid_cards      │
│ - Tambah idempotency_key (unique) pada canteen_transactions            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 2: REMEDIASI KODE ENDPOINT /api/canteen/pay                      │
│ - Bungkus dalam db.transaction() dengan SELECT ... FOR UPDATE          │
│ - Pasang verifikasi PBKDF2 PIN dan counter auto-block 3x               │
│ - Pasang deteksi & penanganan Idempotency Key                          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 3: IMPLEMENTASI ALUR RESET PIN & OTORISASI                       │
│ - Bangun endpoint POST /api/rfid/reset-pin (Role: Walikelas & Keuangan)│
│ - Integrasikan audit log pencatatan buka blokir                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TAHAP 4: REMEDIASI ATOMICITY WEBHOOK FLIP TOP-UP                       │
│ - Bungkus /api/webhooks/flip dalam transaksi dengan row-lock wallets   │
│ - Mencegah lost update saat top-up bertabrakan dengan belanja kantin   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 15. STOP DECLARATION & STATUS OTORISASI

Sesuai instruksi penutup **MANDATE M2-FINANCE-ARCHITECTURE-005**:
- Tugas penyusunan rancangan remediasi transaksi RFID, integritas saldo, dan keamanan PIN telah diselesaikan secara komprehensif.
- Seluruh verifikasi dilaksanakan secara murni dalam mode **STRICT READ-ONLY**.
- Nol baris kode produksi yang dimutasi; nol migrasi database yang diterbitkan; nol query DDL/DML yang dieksekusi.
- Status Git branch `preview` bersih terhadap kode produksi.

**FINAL STATUS: REMEDIATION DESIGN COMPLETE.**  
**IMPLEMENTATION STATUS: NOT AUTHORIZED.**  

Antigravity Lead Agent berhenti (*STOP CONDITION*) dan menyerahkan laporan ini kepada **Product Owner (Process_PO)** dan **Acting Process_Mandor (Mandor 2)** untuk evaluasi dan keputusan ratifikasi.
