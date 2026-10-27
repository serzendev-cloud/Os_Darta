# REPORT-M2-FINANCE-RFID-INTERNAL-PAYMENT-VERIFICATION-001
## Laporan Verifikasi Independen: Integritas Finansial, Keamanan RFID, dan Pemisahan Pembayaran Internal dari Gateway

**Project:** APP MA’HAD / Os_Darta  
**Agent:** ZenOrion — Antigravity Lead Agent  
**Otoritas:** Product Owner (Process_PO) & Acting Process_Mandor (Mandor 2)  
**Mandate Type:** Independent Evidence-Based Architecture Review  
**Execution Mode:** STRICT READ-ONLY  
**Implementation Authorization:** NOT AUTHORIZED  
**Dokumen Terkait:**
- `docs/spesifikasi-pembayaran.md` (Aturan Mutlak 1–13)
- `docs/architecture/REPORT-M2-FINANCE-ARCHITECTURE-001.md`
- `docs/architecture/SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md`
- `docs/architecture/REPORT-M2-FINANCE-MERCHANT-WALLET-GAP-AUDIT-001.md`
- `docs/architecture/DRAFT-FINANCE-MERCHANT-WALLET-EXTENSION-001.md`
- `docs/architecture/REPORT-M2-FINANCE-WALLET-LEDGER-AUDIT-001.md`
**Tanggal:** 19 Oktober 2026  

---

## 1. EXECUTIVE SUMMARY

Sesuai dengan **MANDATE M2-FINANCE-ARCHITECTURE-004**, telah dilakukan audit dan verifikasi independen terhadap integritas finansial, sistem pembayaran kartu RFID, mekanisme otorisasi PIN, serta pemisahan tegas antara transaksi internal RFID dengan gateway pembayaran eksternal.

### Temuan Kunci Verifikasi Independen:
1. **Verifikasi Aturan Mutlak Pembayaran RFID Internal** `[TERBUKTI]`:
   - Terbukti secara absolut bahwa **seluruh alur pembayaran RFID kantin/POS adalah transaksi internal murni**.
   - Kode aktual pada `src/app/api/canteen/pay/route.ts` **TIDAK PERNAH** memanggil API gateway Flip, tidak membuat payment order eksternal, tidak menunggu webhook, dan tidak membebankan biaya gateway apapun.
   - Kegagalan payment gateway eksternal **tidak berdampak** pada kelangsungan pembayaran RFID di kantin.
2. **Kelemahan Kritis Concurrency & Atomicity** `[TERBUKTI]`:
   - Endpoint `/api/canteen/pay` melakukan operasi mutasi saldo (`wallets.balance_uang_saku`), pencatatan transaksi (`canteen_transactions`), dan mutasi saku (`wallet_pockets`) dalam **3 query terpisah tanpa `db.transaction()`** dan **tanpa row-level locking (`FOR UPDATE`)**.
   - Terdapat risiko **Double Spending** jika kartu di-tap pada dua terminal POS bersamaan dalam milidetik yang sama, serta risiko **Inkonsistensi Parsial** jika server terputus di tengah eksekusi.
3. **Kelemahan Keamanan PIN & Ketiadaan Auto-Block 3x** `[TERBUKTI]`:
   - Penyimpanan PIN pada kartu (`rfid_cards.hashed_pin`) saat ini hanya diverifikasi dengan plain text comparison (`card.hashedPin !== pin && card.hashedPin !== 'pin_' + pin`).
   - Jika PIN salah, sistem hanya mengembalikan HTTP 401 tanpa mencatat jumlah kegagalan. **Belum ada kolom counter salah PIN, belum ada pemblokiran otomatis setelah 3x salah, dan belum ada alur reset PIN oleh Wali Kelas/Admin Keuangan**.
4. **Pemisahan Model Pembayaran (Model A vs Model B vs RFID)** `[TERBUKTI]`:
   - Alur pembayaran eksternal Model A (langsung via Flip) dan Model B (top-up saldo terpadu internal) terbukti secara arsitektur terpisah dari penggunaan saldo harian RFID. Saldo RFID hanya bersumber dari `balance_uang_saku` santri.

---

## 2. REPOSITORY, BRANCH, COMMIT, DAN STATUS GIT

Pemeriksaan status lingkungan kerja per 19 Oktober 2026:

| Parameter Lingkungan | Bukti Aktual Repositori | Status Verifikasi |
|---|---|---|
| **Workspace Aktif** | `E:\Projects\Os_Darta` | `[TERBUKTI]` |
| **Active Branch** | `preview` | `[TERBUKTI]` |
| **Commit HEAD** | `e61a237 feat(tenant): harden tenant resolver Phase A and A1 contracts` | `[TERBUKTI]` |
| **Candidate Worktree** | `E:\Projects\Os_Darta-domain-a2.7-candidate` (detached HEAD `e61a237`) | `[TERBUKTI]` |
| **Status File Git** | Bersih terhadap source code produksi (`src/` dan `drizzle/` tidak ada mutasi). | `[TERBUKTI]` |

---

## 3. BUKTI PELAKSANAAN READ-ONLY

Audit ini mematuhi protokol read-only secara penuh:
- **Kode Produksi Diubah**: **0 baris**
- **Skema Database / Migrasi Diterbitkan**: **0 file**
- **Operasi Database DML / DDL Dieksekusi**: **0 query**
- **Transaksi Finansial Nyata / Panggilan API Flip Nyata**: **0 panggilan**
- **Git State Mutated**: **0 perubahan**

---

## 4. TRACE END-TO-END TRANSAKSI RFID KANTIN/POS

Penelusuran alur eksekusi aktual dari antarmuka kasir hingga pembaruan database:

```
[ KASIR KANTIN / POS TERMINAL ]
File: src/app/dashboard/keuangan/kantin-nfc/page.tsx:L74-99
- Kasir memilih barang atau memasukkan custom nominal.
- Santri menempelkan kartu (menghasilkan `cardUid`) dan memasukkan PIN (4 digit).
- Frontend mengirimkan HTTP POST ke `/api/canteen/pay`.
       │
       ▼
[ API ENDPOINT & VALIDASI INPUT ]
File: src/app/api/canteen/pay/route.ts:L10-29
- Memeriksa kelengkapan body: `cardUid`, `pin`, `amount`.
       │
       ▼
[ RESOLUSI UNIT USAHA & RFID CARD LOOKUP ]
File: src/app/api/canteen/pay/route.ts:L31-62
- Query `canteens` untuk nama merchant (`L34-41`).
- Query `rfid_cards` berdasarkan `cardUid` dan `tenantId` (`L44-48`).
- Validasi status kartu: Jika `card.status === 'blocked'`, tolak HTTP 403 (`L57-62`).
       │
       ▼
[ VERIFIKASI KEAMANAN PIN SANTRI ]
File: src/app/api/canteen/pay/route.ts:L64-70
- Memeriksa kecocokan PIN: `card.hashedPin !== pin && card.hashedPin !== 'pin_' + pin`.
- Jika salah: Balas HTTP 401 ("Kode PIN / Sandi Santri Salah").
- [TEMUAN]: TIDAK ada counter kegagalan, TIDAK ada pemblokiran otomatis.
       │
       ▼
[ LOOKUP SANTRI & CEK WALLET FREEZE ]
File: src/app/api/canteen/pay/route.ts:L72-119
- Query profil santri dari tabel `santri` (`L73-77`).
- Query dompet digital dari tabel `wallets` (`L87-91`).
- Pengecekan Wallet Freeze:
  * `suspended_by_walikelas`: Tolak HTTP 403 (`L100-105`).
  * `suspended_by_wali`: Tolak HTTP 403 (`L107-112`).
  * `blocked`: Tolak HTTP 403 (`L114-119`).
       │
       ▼
[ SENTRALISASI LIMIT BELANJA HARIAN ]
File: src/app/api/canteen/pay/route.ts:L121-149
- Menghitung total belanja hari ini di seluruh kantin tenant via `canteen_transactions` (`L126-136`).
- Jika `totalSpentToday + amount > dailyLimit` (default Rp 20.000): Tolak HTTP 400 (`L139-148`).
       │
       ▼
[ PENGECEKAN KECUKUPAN SALDO UANG SAKU ]
File: src/app/api/canteen/pay/route.ts:L151-159
- Memeriksa: `wallet.balanceUangSaku < amount`.
- Jika kurang: Tolak HTTP 400 ("Saldo Uang Saku Tidak Cukup").
- Saldo tabungan TIDAK PERNAH diperiksa atau disentuh.
       │
       ▼
[ MUTASI SALDO & PENCATATAN TRANSAKSI (NON-ATOMIC) ]
File: src/app/api/canteen/pay/route.ts:L161-200
- Langkah 1: `db.update(wallets).set({ balanceUangSaku: newBalance })` (`L164-170`).
- Langkah 2: `db.insert(canteenTransactions).values({ ... })` (`L173-186`).
- Langkah 3: `db.insert(walletPockets).values({ mutationType: 'canteen_deduct', ... })` (`L189-200`).
       │
       ▼
[ RESPON STATUS KE TERMINAL KASIR ]
File: src/app/api/canteen/pay/route.ts:L205-221
- Mengembalikan JSON sukses: sisa saldo uang saku, sisa limit belanja, dan data santri.
```

---

## 5. AUDIT SELURUH KEMUNGKINAN INTERAKSI PAYMENT GATEWAY

Pemeriksaan menyeluruh dilakukan terhadap seluruh call graph, dependency import, dan library pada jalur pembayaran RFID untuk membuktikan ada/tidaknya keterlibatan payment gateway:

### Tabel Bukti Interaksi Gateway pada Pembayaran RFID:

| Pertanyaan Kritis | Bukti Kode Aktual | Hasil Verifikasi | Evidence Tag |
|---|---|---|---|
| **Apakah RFID memanggil API gateway?** | `src/app/api/canteen/pay/route.ts:L1-229` | **TIDAK**. Tidak ada pemanggilan fetch/HTTP ke Flip (`bigflip.id`) atau gateway apapun. | `[TERBUKTI]` |
| **Apakah RFID mengimpor client gateway?** | `src/app/api/canteen/pay/route.ts:L5-8` | **TIDAK**. Hanya mengimpor `drizzle-orm`, `db`, dan schema lokal. Tidak mengimpor `flipClient`. | `[TERBUKTI]` |
| **Apakah RFID membuat payment order?** | `src/app/api/canteen/pay/route.ts:L172-186` | **TIDAK**. Hanya menulis ke tabel internal `canteen_transactions`. Tidak menyentuh `invoices` atau `payment_orders`. | `[TERBUKTI]` |
| **Apakah RFID menunggu webhook gateway?** | `src/app/api/canteen/pay/route.ts:L205-221` | **TIDAK**. Transaksi diselesaikan synchronous dalam satu request-response cycle lokal. | `[TERBUKTI]` |
| **Apakah RFID membebankan gateway fee?** | `src/app/api/canteen/pay/route.ts:L162` | **TIDAK**. `newBalance = wallet.balanceUangSaku - amount`. Tidak ada potongan biaya admin gateway. | `[TERBUKTI]` |
| **Apakah kegagalan gateway memengaruhi RFID?** | Arsitektur mandiri di `src/app/api/canteen/pay` | **TIDAK**. Jika Flip down 100%, sistem pembayaran RFID kantin tetap berfungsi normal selama database aktif. | `[TERBUKTI]` |

---

## 6. HASIL VERIFIKASI ATURAN RFID INTERNAL-ONLY

Kepatuhan kode terhadap keputusan mutlak Product Owner:

1. **Penggunaan Saldo Uang Saku Murni**: `[TERBUKTI]`. Baris 162 dan 167 hanya memotong `balanceUangSaku`. Saldo tabungan santri aman dari pemotongan belanja.
2. **Kewajiban PIN**: `[TERBUKTI]`. Baris 24 menolak request tanpa PIN, baris 65 memverifikasi PIN.
3. **Pengikatan Kartu ke Pemilik**: `[TERBUKTI]`. Baris 47 mencocokkan `cardUid` dan `tenantId`. Baris 76 mencocokkan `card.santriId` ke tabel `santri`.
4. **Saldo Dikelola Sistem (Bukan di Kartu Fisik)**: `[TERBUKTI]`. Kartu RFID hanya bertindak sebagai *identifier token* (`cardUid`). Saldo seutuhnya tersimpan di database PostgreSQL.
5. **Zero External Gateway Dependency**: `[TERBUKTI]`. Jalur RFID adalah transaksi internal tertutup (*closed-loop internal debit*).

---

## 7. AUDIT SALDO DAN SUMBER KEBENARAN (SOURCE OF TRUTH)

Hasil audit mendalam terhadap penyimpanan dan perhitungan saldo:

### 7.1 Kondisi Aktual Penyimpanan Saldo
- **Kolom Saldo Fisik**: Saldo uang saku disimpan pada kolom `balance_uang_saku` (integer) di tabel `wallets` (`src/lib/db/schema/finance.ts:L9`).
- **Log Mutasi**: Mutasi dicatat pada tabel `wallet_pockets` (`src/lib/db/schema/finance.ts:L25-37`).
- **Keterbatasan Audit**:
  - Kolom saldo di-update langsung (*in-place mutation*).
  - Tabel `wallet_pockets` bertindak sebagai *write-only audit log*; aplikasi tidak memiliki fungsi derived recalculation untuk merekonstruksi saldo dari riwayat mutasi.

### 7.2 Analisis Kepatuhan Akuntansi Double-Entry
- Di kode saat ini, transaksi kantin **belum menulis jurnal akuntansi** ke tabel double-entry platform (`ledger_entries`).
- Saldo kantin saat ini baru berupa *virtual stored-value counter*, belum terintegrasi ke pembukuan hutang/pendapatan yayasan (`CUSTODIAL_WALLET_LIABILITY` -> `TENANT_INCOME_CANTEEN`).

---

## 8. AUDIT CONCURRENCY, ATOMICITY, DAN RISIKO DOUBLE SPENDING

Pemeriksaan baris 161–200 pada `src/app/api/canteen/pay/route.ts` mengungkap dua kerentanan konkurensi serius:

### 8.1 Kerentanan Double Spending (Race Condition)
- **Bukti Kode**:
  ```typescript
  // Baris 87-91: Read saldo tanpa lock
  const walletResult = await db.select().from(wallets).where(and(...));
  const wallet = walletResult[0];
  ...
  // Baris 162-170: Kalkulasi di memori Node.js dan update terpisah
  const newBalance = wallet.balanceUangSaku - amount;
  await db.update(wallets).set({ balanceUangSaku: newBalance }).where(...);
  ```
- **Skenario Eksploitasi Concurrency**:
  1. Santri memiliki saldo Rp 50.000.
  2. Dua transaksi belanja masing-masing Rp 30.000 dikirimkan bersamaan (misal tap cepat di dua kasir atau double-tap karena latensi jaringan).
  3. Thread A membaca saldo Rp 50.000 (lolos validasi saldo cukup).
  4. Thread B membaca saldo Rp 50.000 (lolos validasi saldo cukup).
  5. Thread A menghitung `50.000 - 30.000 = 20.000` dan meng-update saldo menjadi Rp 20.000.
  6. Thread B menghitung `50.000 - 30.000 = 20.000` dan menimpa saldo menjadi Rp 20.000.
  7. **Dampak**: Barang senilai Rp 60.000 berhasil dibeli, tetapi saldo santri hanya terpotong Rp 30.000. Santri mendapatkan saldo ekstra Rp 30.000 secara tidak sah (*Double Spending*).

### 8.2 Kerentanan Atomicity (Partial Failure)
- **Bukti Kode**:
  Tiga statement mutasi dieksekusi secara terpisah tanpa blok transaksi database:
  1. `await db.update(wallets)...` (Baris 164)
  2. `await db.insert(canteenTransactions)...` (Baris 174)
  3. `await db.insert(walletPockets)...` (Baris 189)
- **Dampak**:
  Jika terjadi kegagalan database (misal connection reset, out-of-memory, atau crash serverless) setelah langkah 1 berhasil:
  - Saldo uang saku santri **sudah terpotong**.
  - Catatan transaksi kantin **TIDAK TERCATAT**.
  - Kasir tidak menerima struk sukses dan menganggap pembayaran gagal, memicu perdebatan atau pemotongan saldo santri tanpa barang.

### 8.3 Ketiadaan Idempotency Key
- Endpoint `/api/canteen/pay` tidak menerima header atau payload `idempotency_key`. Double-click pada tombol kasir akan memproses dua transaksi terpisah jika saldo mencukupi.

---

## 9. AUDIT PIN, PEMBLOKIRAN, DAN RESET OTORISASI

Audit mendalam terhadap implementasi PIN pada kartu RFID (`rfidCards` dan `/api/canteen/pay`):

| Parameter Keamanan | Persyaratan Resmi PO | Kondisi Aktual Kode | Evaluasi & Risiko | Evidence Tag |
|---|---|---|---|---|
| **Kewajiban PIN** | Wajib untuk seluruh pembayaran RFID | Terpasang (`/api/canteen/pay:L24,65`) | **LULUS**: Transaksi ditolak jika PIN tidak dikirim. | `[TERBUKTI]` |
| **Metode Hashing PIN** | Hash aman (rekomendasi PBKDF2/bcrypt) | Plain string / prefix `'pin_'` (`L65`) | **RENTAN TINGGI**: PIN tersimpan polos di DB; rentan kebocoran data internal. | `[TERBUKTI]` |
| **Counter Gagal PIN** | Mencatat setiap percobaan salah berturut-turut | Tidak ada counter di tabel `rfid_cards` | **RENTAN TINGGI**: Percobaan salah tidak dihitung sama sekali. | `[TERBUKTI]` |
| **Auto-Block 3x Salah** | Blokir kartu setelah 3x salah PIN berturut-turut | Tidak ada logika pemblokiran di baris 68 | **RENTAN TINGGI**: Penemu kartu hilang dapat melakukan serangan *brute force* 10.000 kombinasi PIN tanpa pernah diblokir. | `[TERBUKTI]` |
| **Otoritas Reset PIN** | Wali Kelas & Admin Keuangan berwenang reset PIN | Belum ada API/UI reset PIN | **BELUM TERSEDIA**: Tidak ada endpoint untuk mereset PIN santri. | `[TERBUKTI]` |
| **Unblock saat Reset PIN**| Reset PIN yang sah otomatis membuka blokir | Belum ada alur reset PIN | **BELUM TERSEDIA**. | `[TERBUKTI]` |

---

## 10. PEMISAHAN ALUR TRANSAKSI (RFID VS MODEL A VS MODEL B VS TOP-UP)

Arsitektur membuktikan pemisahan tegas antara 4 jenis transaksi keuangan:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TAKSONOMI ALUR FINANSIAL                              │
├───────────────────────────────────┬─────────────────────────────────────────────┤
│ 1. ALUR TOP-UP GATEWAY (EKSTERNAL)│ 2. MODEL A: BAYAR LANGSUNG (EKSTERNAL)      │
│ - Wali transfer via Flip          │ - Wali bayar SPP langsung via Flip          │
│ - Masuk ke GATEWAY_CLEARING       │ - Menghasilkan Flip Bill Link & Webhook     │
│ - Webhook Flip memvalidasi bayar  │ - Menghasilkan catatan biaya admin Flip     │
├───────────────────────────────────┼─────────────────────────────────────────────┤
│ 3. MODEL B: ALOKASI INTERNAL      │ 4. PEMBAYARAN RFID KANTIN/POS (INTERNAL)    │
│ - Dari Saldo Terpadu Keluarga     │ - Dari Saldo Uang Saku Santri               │
│ - Pindah ke SPP / Uang Saku Anak  │ - Dipicu oleh Tap Kartu Fisik + PIN Santri  │
│ - Murni Database Transaction      │ - Validasi Freeze, Limit Harian & Saldo     │
│ - ZERO GATEWAY FEE (Tanpa Flip)   │ - ZERO GATEWAY FEE & TIDAK MEMANGGIL FLIP   │
└───────────────────────────────────┴─────────────────────────────────────────────┘
```

**Kesimpulan Kunci**: Pembayaran RFID menempati Kotak 4 — sebuah ekosistem tertutup lokal yang tidak memiliki irisan teknis dengan gateway Flip.

---

## 11. RISIKO AKUNTANSI DAN INTEGRITAS LEDGER

Audit mengidentifikasi 3 risiko akuntansi yang perlu dimitigasi saat mengintegrasikan RFID ke platform ledger:

1. **Pencatatan Saldo Titipan Santri**:
   - Uang saku santri adalah dana titipan (fidusia), bukan pendapatan pesantren.
   - Saat belanja RFID di kantin internal milik pondok, jurnal akuntansi wajib menggeser liabilitas menjadi pendapatan:
     $$\text{Debit } CUSTODIAL\_WALLET\_LIABILITY \longrightarrow \text{Kredit } TENANT\_INCOME\_CANTEEN$$
   - Jika belanja di koperasi/rekanan konsesi pihak ketiga:
     $$\text{Debit } CUSTODIAL\_WALLET\_LIABILITY \longrightarrow \text{Kredit } MERCHANT\_PAYABLE$$
2. **Ketiadaan Snapshot Harga Barang**:
   - Di tabel `canteen_transactions`, tidak ada catatan harga satuan barang saat transaksi terjadi. Jika harga barang di katalog berubah esok hari, riwayat belanja lama tidak dapat diaudit rincian per barisnya secara akurat.
3. **Risiko Selisih Saldo Riil**:
   - Karena saldo di `wallets` saat ini di-update langsung tanpa trigger ledger ganda, selisih antara kas fisik di bendahara pondok dengan saldo virtual santri tidak dapat dideteksi secara otomatis tanpa rekonsiliasi manual.

---

## 12. GAP ANALYSIS TERHADAP KEPUTUSAN PRODUCT OWNER

| Area Kebijakan PO | Keputusan / Persyaratan PO | Fakta Temuan Kode | Status Kepatuhan | Tingkat Risiko |
|---|---|---|---|---|
| **Zero Gateway Fee pada RFID** | Tidak ada biaya gateway pada transaksi RFID | Baris 162 tidak memotong fee | **SUDAH TERPENUHI** | `AMAN` |
| **No Gateway Dependency** | Kegagalan gateway tidak boleh menghambat RFID | Tidak ada panggilan Flip di `/api/canteen/pay` | **SUDAH TERPENUHI** | `AMAN` |
| **Pencegahan Saldo Negatif** | Saldo tidak boleh negatif saat belanja | Baris 151 menolak jika `balance < amount` | **SUDAH TERPENUHI** | `AMAN` |
| **Auto-Block 3x Salah PIN** | 3x salah PIN langsung memblokir kartu RFID | Baris 68 hanya return 401 | **BELUM TERSEDIA** | `KRITIS` |
| **Reset PIN oleh Wali Kelas/Admin** | Otoritas reset PIN & buka blokir | Tidak ada API / permission reset PIN | **BELUM TERSEDIA** | `TINGGI` |
| **Concurrency Protection** | Mencegah double spending kartu konkuren | Tanpa `FOR UPDATE` dan tanpa `db.transaction`| **BELUM TERSEDIA** | `KRITIS` |
| **Rincian Item Terstruktur** | POS menyimpan item, qty, harga satuan terstruktur | Hanya 1 kolom string `itemsDescription` | **BELUM TERSEDIA** | `SEDANG` |
| **Alur Setoran Tabungan via RFID** | Pindah dari saku ke tabungan via RFID+PIN | Alur setoran tabungan belum diimplementasikan | **BELUM TERSEDIA** | `SEDANG` |

---

## 13. TEMUAN YANG TERBUKTI DAN YANG BELUM DIVERIFIKASI

### 13.1 Temuan yang Terbukti (`[TERBUKTI]`):
1. Transaksi RFID di `/api/canteen/pay` 100% internal dan bebas ketergantungan payment gateway.
2. Logika limit belanja harian terpusat (`dailyLimit`) berfungsi di `/api/canteen/pay:L121-148`.
3. Logika Wallet Freeze (suspensi oleh wali kelas/wali santri) berfungsi aktif di `/api/canteen/pay:L100-119`.
4. Endpoint `/api/canteen/pay` tidak menggunakan transaksi database ACID (`db.transaction`) dan tidak menggunakan row-level locking.
5. Tabel `rfid_cards` tidak memiliki kolom penghitung kegagalan PIN salah.

### 13.2 Temuan yang Belum Terverifikasi / Keterbatasan Audit (`[BELUM DIVERIFIKASI]`):
1. **Perilaku Database Pooler Concurrency**: Perilaku riil PostgreSQL di bawah Supabase Transaction Pooler saat puluhan transaksi konkuren menembak bersamaan belum dapat diuji tanpa lingkungan staging aktif (read-only constraint).
2. **Latensi Fisik NFC Reader**: Waktu respon fisik hardware pembaca RFID di lapangan terhadap serverless API Next.js belum dapat diukur tanpa pengujian perangkat keras fisik.

---

## 14. REKOMENDASI ARSITEKTUR DAN URUTAN MITIGASI

Untuk menutup celah tanpa melanggar batas tata kelola, diusulkan 3 paket perbaikan arsitektural saat mandat implementasi diterbitkan kelak:

### Paket Mitigasi 1: Hardening Concurrency & Atomicity (Prioritas Tertinggi)
- Membungkus seluruh eksekusi `/api/canteen/pay` ke dalam `db.transaction(async (tx) => { ... })`.
- Menerapkan query penguncian baris:
  ```typescript
  const [wallet] = await tx
    .select()
    .from(wallets)
    .where(and(eq(wallets.tenantId, tenantId), eq(wallets.santriId, card.santriId)))
    .for('update'); // Mencegah Double Spending secara mutlak
  ```
- Menambahkan header `Idempotency-Key` pada request POS kasir untuk mengabaikan klik ganda.

### Paket Mitigasi 2: Hardening Keamanan PIN & Auto-Block (Prioritas Tinggi)
- Menambahkan kolom pada `rfid_cards`:
  * `failed_pin_attempts: integer().default(0).notNull()`
  * `locked_until: timestamp()`
- Pada `/api/canteen/pay`:
  * Jika PIN salah: `failed_pin_attempts += 1`. Jika `failed_pin_attempts >= 3`, set `status = 'blocked'`.
  * Jika PIN benar: Reset `failed_pin_attempts = 0`.
- Membuat endpoint reset PIN resmi untuk Wali Kelas dan Admin Keuangan (`POST /api/rfid/reset-pin`) yang otomatis mereset counter gagal dan mengembalikan status kartu menjadi `'active'`.

### Paket Mitigasi 3: Normalisasi Item Transaksi POS (Prioritas Sedang)
- Menerbitkan tabel `merchant_transaction_items` (relasi 1:N ke `canteen_transactions`) yang mencatat `item_id`, `item_name`, `quantity`, `unit_price`, dan `subtotal` untuk memenuhi kepatuhan audit trail PO.

---

## 15. DAFTAR KEPUTUSAN PRODUCT OWNER YANG MASIH TERBUKA

Sebelum rekayasa engineering diizinkan pada tahap mendatang, Product Owner diharapkan memberikan keputusan atas:

1. **Durasi Blokir Kartu setelah 3x Salah PIN**:
   - Apakah kartu diblokir permanen sampai di-reset manual oleh petugas yang berwenang, atau ada auto-unblock setelah masa tunggu (cooldown misal 2 jam)?
2. **Kewenangan Reset PIN oleh Wali Santri Sendiri**:
   - Mandat saat ini menetapkan Wali Kelas dan Admin Keuangan berwenang mereset PIN. Apakah orang tua santri (Wali) juga diizinkan mereset PIN anak melalui aplikasi wali dari rumah?
3. **Format Hash Kredensial PIN**:
   - Apakah disetujui pembaruan skema hash PIN menggunakan algoritma HMAC-SHA256 atau PBKDF2 dengan salt `tenant_id + card_uid`?

---

## 16. EXPLICIT STOP DECLARATION — NO IMPLEMENTATION PERFORMED

Sesuai dengan instruksi penutup **MANDATE M2-FINANCE-ARCHITECTURE-004**:
- Seluruh kegiatan verifikasi independen telah diselesaikan secara murni dalam mode **STRICT READ-ONLY**.
- Tidak ada source code, skema database, migrasi Drizzle, konfigurasi permission, atau dokumen kanonis yang dimodifikasi.
- Tidak ada tugas engineering T1–T26 yang dimulai.

**STATUS AKHIR: READ-ONLY VERIFICATION COMPLETE — IMPLEMENTATION STATUS: NOT AUTHORIZED.**  
Antigravity Lead Agent berhenti (*STOP CONDITION*) dan menyerahkan laporan ini kepada **Product Owner (Process_PO)** dan **Acting Process_Mandor (Mandor 2)**.
