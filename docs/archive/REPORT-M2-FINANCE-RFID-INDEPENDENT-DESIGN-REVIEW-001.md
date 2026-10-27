# REPORT-M2-FINANCE-RFID-INDEPENDENT-DESIGN-REVIEW-001
## Laporan Review Desain Independen: Evaluasi Kritis Draf 002 Remediasi Transaksi RFID & Integritas Finansial

**Project:** APP MA’HAD / Os_Darta  
**Reviewer:** ZenOrion — Antigravity Lead Agent / Independent Architecture Reviewer  
**Otoritas:** Product Owner (Process_PO) & Acting Process_Mandor (Mandor 2)  
**Mandate Type:** Independent Architecture Review (M2-FINANCE-ARCHITECTURE-007)  
**Target Evaluasi:** `docs/architecture/DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-002.md`  
**Execution Mode:** STRICT READ-ONLY  
**Implementation Authorization:** NOT AUTHORIZED  
**Tanggal Evaluasi:** 19 Oktober 2026  

---

## 1. EXECUTIVE SUMMARY & HASIL REVIEW

Berdasarkan penugasan **MANDATE M2-FINANCE-ARCHITECTURE-007**, telah dilakukan penelaahan kritis dan verifikasi independen terhadap dokumen `DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-002.md`. 

Evaluasi difokuskan pada lima pilar utama:
1. Konsistensi seluruh jalur penulis saldo dompet (`wallets`).
2. Atomisitas transaksi, konkurensi, penanganan idempotensi, retry jaringan, dan rollback.
3. Keamanan PIN, ancaman brute-force pada rahasia berentropi rendah, mekanisme 3x lockout, salt, pepper, dan evaluasi KDF.
4. Integritas pencatatan rincian transaksi POS dan model akuntansi merchant.
5. Kepatuhan mutlak terhadap seluruh keputusan bisnis Product Owner (PO) yang telah dikunci.

### KESIMPULAN REVIEW KELAYAKAN:
$$\mathbf{HASIL:\ PASS\ WITH\ CONDITIONS}$$

**Dasar Keputusan:**
- **Aspek Bisnis & Tata Kelola**: **LULUS PENUH (PASS)**. Desain mematuhi 100% keputusan PO yang terkunci (transaksi internal murni, zero gateway fee, hak reset PIN terbatas hanya pada Wali Kelas binaan dan Admin Keuangan, pelarangan reset oleh Wali Santri, dan status terbuka untuk refund Model B).
- **Aspek Kriptografi PIN**: **LULUS (PASS)**. Analisis entropi rendah pada 4–6 digit PIN numerik diakui secara ilmiah akurat bahwa KDF offline tidak mampu menahan serangan brute-force tanpa *Strict Online Lockout (3x)* dan *Server-Side Pepper*.
- **Kondisi yang Wajib Diperbaiki Sebelum Ratifikasi (Conditions to Fix)**:
  1. *Penanganan Concurrency pada Idempotency Key*: Desain belum merinci penanganan error PostgreSQL `23505 unique_violation` saat dua request identik tiba bersamaan dan salah satunya menabrak indeks unik.
  2. *Sinkronisasi Skema `canteen_transactions`*: Kolom `response_payload jsonb` disebut pada narasi teks bab 8.1, namun tertinggal pada definisi skema tabel bab 9.1.
  3. *Kualifikasi Data Latensi KDF*: Klaim angka latensi (15–30 ms untuk PBKDF2 dan 40–80 ms untuk Argon2id) harus ditegaskan sebagai **estimasi teoritis**, bukan hasil benchmark runtime resmi pada server produksi/preview.

---

## 2. REVIEW ASPEK 1: KONSISTENSI SELURUH JALUR PENULIS SALDO

### 2.1 Pemetaan Faktual Penulis Saldo
Audit kode sumber memvalidasi bahwa hanya terdapat **dua titik mutasi** terhadap tabel `wallets`:
1. `src/app/api/canteen/pay/route.ts:L164-170` (Debit internal belanja uang saku).
2. `src/app/api/webhooks/flip/route.ts:L86-92` (Kredit eksternal top-up uang saku dan tabungan).

### 2.2 Penilaian Desain Penyelarasan Lintas-Jalur
- **Kekuatan Desain**:
  - Draf 002 berhasil mengidentifikasi bahwa memasang `FOR UPDATE` hanya pada endpoint kasir kantin adalah sia-sia jika webhook Flip melakukan update saldo secara non-locking.
  - Desain mewajibkan kedua endpoint memulai transaksi database dengan mengunci baris dompet santri yang sama:
    `SELECT * FROM wallets WHERE tenant_id = :tenant AND santri_id = :santriId FOR UPDATE;`
  - Desain mengusulkan penambahan `UNIQUE (tenant_id, santri_id)` pada tabel `wallets`. Ini mencegah kondisi balapan (*race condition*) pada saat dompet baru dibuat otomatis oleh webhook Flip (`route.ts:L65-79`).
- **Analisis Potensi Deadlock**:
  - Jalur Canteen mengunci `rfid_cards` lalu `wallets`.
  - Jalur Webhook Flip mengunci `invoices` lalu `wallets`.
  - Karena `rfid_cards` dan `invoices` adalah dua tabel independen tanpa relasi siklis (*no cyclic dependency graph*), deadlock antar-jalur pada dua tabel pendukung tersebut tidak akan terjadi.
- **Rekomendasi Tambahan**:
  - Pembaruan saldo di database sebaiknya menggunakan ekspresi SQL atomik di samping penguncian baris:
    `balance_uang_saku = balance_uang_saku - :amount` (untuk kasir) dan
    `balance_uang_saku = balance_uang_saku + :topUpAmount` (untuk webhook).

---

## 3. REVIEW ASPEK 2: ATOMICITY, CONCURRENCY, IDEMPOTENCY, & ROLLBACK

### 3.1 Transaksi ACID & Penegakan Constraint Saldo Non-Negatif
- **Evaluasi**:
  Draf 002 merancang penggabungan mutasi `wallets`, pencatatan `canteen_transactions`, dan penulisan log `wallet_pockets` dalam satu blok `db.transaction()`.
- **Constraint Kernel PostgreSQL**:
  Draf 002 merekomendasikan penambahan constraint:
  `ALTER TABLE wallets ADD CONSTRAINT wallets_balance_uang_saku_non_negative CHECK (balance_uang_saku >= 0);`
  Ini adalah rancangan pertahanan lapis ganda (*defense-in-depth*) yang sangat kokoh. Sekalipun terjadi kegagalan logika pada aplikasi Node.js, PostgreSQL secara deterministik menolak transaksi yang menyebabkan saldo minus dengan melempar error code `23514 check_violation`.

### 3.2 Penanganan Idempotency Key & Celah Concurrency yang Ditemukan
Draf 002 menyusun alur penanganan idempotensi berbasis `(tenant_id, idempotency_key)` dan pengecekan sidik jari payload (`request_hash`).

> **TEMUAN KEKURANGAN DESAIN (DEFICIENCY 1):**  
> Draf 002 belum menjelaskan penanganan benturan konkurensi di mana Request 1 dan Request 2 dikirimkan oleh kasir pada milidetik yang sama dengan `Idempotency-Key` yang identik.

**Analisis Skenario Konkurensi Idempotensi:**
1. Request 1 dan Request 2 masuk bersamaan.
2. Request 1 berhasil memperoleh lock pada baris `wallets` dan memproses transaksi.
3. Request 2 tertahan menunggu lock pada baris `wallets`.
4. Request 1 menyelesaikan pemotongan saldo, melakukan `INSERT INTO canteen_transactions (idempotency_key = 'k-1', status = 'SUCCESS', ...)`, dan melakukan `COMMIT`.
5. Request 2 terlepas dari antrean lock `wallets`, membaca saldo yang sudah berkurang, lalu mencoba melakukan `INSERT INTO canteen_transactions (idempotency_key = 'k-1', ...)`.
6. PostgreSQL akan langsung melempar error **`23505 unique_violation`** karena `idempotency_key` sudah di-commit oleh Request 1.
7. **Kekurangan**: Jika kode tidak memiliki blok `catch` khusus untuk error `23505`, transaksi Request 2 akan melempar unhandled exception dan mengembalikan **HTTP 500 Internal Server Error** ke kasir, membingungkan operator.

**Solusi Perbaikan (Wajib Diadopsi Sebelum Ratifikasi):**
Blok transaksi kasir wajib memiliki *catch-and-recover handler*:
```typescript
try {
  // Eksekusi transaksi debit dan insert canteen_transactions
} catch (error: any) {
  if (error.code === '23505' && error.constraint?.includes('idempotency_key')) {
    // Request paralel mendeteksi kunci yang baru saja dicommit oleh request pertama
    const committedTx = await db.query.canteenTransactions.findFirst({
      where: and(eq(canteenTransactions.tenantId, tenantId), eq(canteenTransactions.idempotencyKey, idempotencyKey))
    });
    if (committedTx && committedTx.requestHash === requestHash) {
      return NextResponse.json({ success: true, message: 'Transaksi Berhasil (Concurrent Replay)', data: committedTx.responsePayload });
    }
    return NextResponse.json({ success: false, message: 'Konflik Idempotensi' }, { status: 409 });
  }
  throw error;
}
```

---

## 4. REVIEW ASPEK 3: KEAMANAN PIN, ENTHROPY ANALYSIS, & KDF

### 4.1 Validitas Kriptografi Entropi Rendah (Scientific Soundness)
Evaluasi terhadap analisis ancaman PIN numerik 4–6 digit pada Draf 002:
- Jumlah kemungkinan kombinasi PIN 4 digit: $10^4 = 10.000$ kombinasi ($\approx 13.3$ bit entropi).
- Jumlah kemungkinan kombinasi PIN 6 digit: $10^6 = 1.000.000$ kombinasi ($\approx 19.9$ bit entropi).
- Menurut panduan **NIST SP 800-63B (Section 5.1.1.2)** dan **OWASP Password Storage Cheat Sheet**:
  Fungsi hashing seperti PBKDF2 atau Argon2id dirancang untuk memperlambat serangan brute-force pada password berentropi tinggi (>40 bit). Pada rahasia berentropi sangat rendah (13–20 bit), penyerang yang memiliki dump hash database dapat menguji seluruh 10.000 kombinasi hanya dalam waktu **kurang dari 1 detik** menggunakan perangkat keras komputasi modern.

**Kesimpulan Reviewer**:
Pernyataan Draf 002 bahwa *"Hashing saja tidak dapat menggantikan online rate limiting"* adalah **100% BENAR secara ilmiah**.

### 4.2 Peran Tiga Lapis Pertahanan
Draf 002 menyusun pertahanan dengan tepat:
1. **Lapis 1 (Online Lockout)**: Pembatasan 3x salah langsung memblokir kartu secara serial di database. Probabilitas penyerang menebak PIN di kasir dibatasi hanya $3/10.000 = 0,03\%$.
2. **Lapis 2 (Server-Side Secret Pepper)**: Menggunakan secret environment (`RFID_PIN_PEPPER`) yang disimpan di luar database (KMS/Vault/Vercel Env). Jika penyerang mencuri dump database SQL, penyerang tetap tidak dapat menguji PIN secara offline karena tidak memiliki pepper.
3. **Lapis 3 (Cryptographic Salt & Iterasi KDF)**: Salt acak 16-byte unik per kartu mencegah serangan *precomputed rainbow tables*.

> **TEMUAN KEKURANGAN DESAIN (DEFICIENCY 2):**  
> Draf 002 mencantumkan estimasi latensi (15–30 ms untuk PBKDF2 dan 40–80 ms untuk Argon2id) tanpa menyertakan disclaimer bahwa angka tersebut adalah estimasi literatur, bukan hasil benchmark empiris pada runtime Os_Darta.

**Koreksi yang Diwajibkan:**
Spesifikasi harus menyatakan secara eksplisit:  
*"Angka latensi KDF yang disajikan adalah estimasi teoritis pada hardware server standar. Benchmarking empiris pada runtime production/preview wajib dijalankan pada tahap implementasi sebelum mengunci angka iterasi final."*

---

## 5. REVIEW ASPEK 4: INTEGRITAS RINCIAN POS TRANSAKSI & AKUNTANSI

### 5.1 Evaluasi Skema Rincian Transaksi POS
- Draf 002 merancang pemisahan header transaksi (`canteen_transactions`) dan rincian item (`canteen_transaction_items`).
- Penyimpanan `item_name_snapshot` dan `unit_price_snapshot` menjamin data historis pembukuan kebal terhadap perubahan katalog master barang di kemudian hari.
- Dukungan kolom `item_type` ('physical_goods', 'service', 'obligation_payment') mengakomodasi pembayaran nonfisik seperti denda pelanggaran santri atau biaya laundry tanpa memaksakan adanya item fisik.
- Header transaksi mencatat porsi bagi hasil `tenant_share_amount` dan `merchant_share_amount`.

> **TEMUAN KEKURANGAN DESAIN (DEFICIENCY 3):**  
> Pada Bab 8.1 disebutkan bahwa respon transaksi yang berhasil disimpan ke dalam `canteen_transactions` untuk disajikan kembali saat replay idempotensi. Namun pada Bab 9.1 diagram relasi tabel, kolom `response_payload` belum dicantumkan secara eksplisit.

**Koreksi yang Diwajibkan:**
Tambahkan kolom `response_payload jsonb` pada definisi skema tabel `canteen_transactions` di dokumen final.

---

## 6. REVIEW ASPEK 5: KEPATUHAN TERHADAP KEPUTUSAN PRODUCT OWNER

Pemeriksaan silang terhadap Aturan Mutlak PO:

| Keputusan Bisnis PO | Evaluasi Kepatuhan pada Draf 002 | Status Kepatuhan |
|---|---|---|
| **Pembayaran RFID adalah Transaksi Internal Murni** | Nol panggilan ke Flip, nol payment order, nol webhook dependency. | **PATUH 100%** |
| **Hanya Menggunakan Saldo Uang Saku** | Memotong eksklusif `balance_uang_saku`. Tabungan dan Model B diisolasi. | **PATUH 100%** |
| **Wajib Menggunakan PIN** | Request ditolak jika tanpa PIN. | **PATUH 100%** |
| **Auto-Block Setelah 3x Salah PIN** | Counter gagal dicatat di DB, blokir permanen pada kegagalan ke-3. | **PATUH 100%** |
| **Reset PIN Hanya oleh Wali Kelas Binaan & Admin Keuangan** | Hak reset dibatasi ketat pada 2 peran tersebut. Super Admin dicabut haknya. | **PATUH 100%** |
| **Wali Santri Dilarang Reset PIN** | Akses wali santri ditolak tegas dengan HTTP 403 Forbidden. | **PATUH 100%** |
| **POS Wajib Menyimpan Item Terstruktur** | Dirancang tabel `canteen_transaction_items` dengan snapshot harga. | **PATUH 100%** |
| **Refund Model B Tetap Terbuka** | Status refund Model B dipertahankan sebagai keputusan terbuka. | **PATUH 100%** |

---

## 7. DAFTAR KEKURANGAN DESAIN YANG WAJIB DIPERBAIKI SEBELUM RATIFIKASI

Sebelum dokumen diratifikasi secara resmi oleh Product Owner, 3 perbaikan redaksional dan teknis berikut wajib diselesaikan:

1. **Tambahkan Penanganan Concurrency Unique Violation (`23505`) pada Idempotensi Kasir**:
   - Menjelaskan bahwa jika request konkuren menabrak constraint unik saat insert transaksi, aplikasi secara elegan menangkap error `23505`, melakukan query ulang terhadap transaksi yang baru saja dicommit, dan mengembalikan respon transaksi sukses asli (*HTTP 200*) alih-alih melempar exception 500.
2. **Sinkronkan Kolom `response_payload` pada Skema Database**:
   - Menambahkan kolom `response_payload jsonb` pada skema `canteen_transactions` di Bab 9.1 agar konsisten dengan mekanisme pengembalian respon cache pada Bab 8.2.
3. **Klarifikasi Status Benchmark KDF**:
   - Menegaskan bahwa angka latensi KDF (15–30 ms) adalah proyeksi teoritis literatur dan benchmarking terkalibrasi wajib dilakukan di sandbox staging sebelum angka iterasi dikunci permanen.

---

## 8. KEPUTUSAN PRODUCT OWNER YANG MASIH DIPERLUKAN

1. **Pilihan Final Algoritma KDF**:
   - Opsi A (Rekomendasi Arsitek): **PBKDF2-HMAC-SHA256 (100.000 iterasi) + 16-byte Salt + Server Pepper**. Nol dependensi eksternal, kompatibilitas 100% runtime serverless.
   - Opsi B: **Argon2id (m=19456, t=2, p=1)**. Keamanan memory-hard standar OWASP, membutuhkan dependensi native binary.
2. **Kebijakan Pembatalan / Refund Transaksi Kasir**:
   - Menetapkan apakah kasir diberi wewenang membatalkan transaksi salah input dalam batas waktu tertentu (misal 5 menit pertama) atau seluruh pembatalan harus melalui Admin Keuangan.
3. **Pengesahan Status Draf 002 Menjadi Spesifikasi Resmi**:
   - PO memberikan persetujuan ratifikasi terhadap dokumen arsitektur setelah 3 kondisi perbaikan diselesaikan.

---

## 9. STATUS VERIFIKASI & STOP DECLARATION

- **Pelaksanaan Mandat**: Mandat dilaksanakan secara penuh dalam mode **STRICT READ-ONLY**.
- **Mutasi Repositori**: Nol file kode aplikasi atau skema basis data yang diubah.
- **Status Dokumen Draf**: Dokumen `DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-002.md` tetap utuh sebagai dokumen yang ditinjau.

---

**FINAL STATUS REVIEW ARSITEKTUR:**  
`DESIGN RATIFICATION: PENDING PO REVIEW`  
`IMPLEMENTATION: NOT AUTHORIZED`  

*Laporan review independen ini diserahkan secara resmi kepada Product Owner (`Process_PO`) dan Acting Process_Mandor (`Mandor 2`).*
