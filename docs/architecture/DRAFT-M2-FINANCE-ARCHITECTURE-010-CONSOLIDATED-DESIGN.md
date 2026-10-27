# DRAFT-M2-FINANCE-ARCHITECTURE-010-CONSOLIDATED-DESIGN
## Spesifikasi Arsitektur Konsolidasi Tingkat Akhir: Pembayaran Internal RFID, Ketahanan Idempotensi PostgreSQL, Keamanan Kredensial, dan POS Multi-Merchant

**Work Package:** M2-FINANCE-ARCHITECTURE-010  
**Sistem:** APP MA’HAD — Finance, Internal RFID Payment, Wallet, POS & Tenant Merchant Architecture  
**Lead Architect:** ZenOrion — Antigravity Lead Agent / Independent Systems Architect  
**Otoritas:** Product Owner (`Process_PO`) & Acting Process_Mandor (`Mandor 2`)  
**Mode Operasi:** STRICT READ-ONLY / ARCHITECTURAL BLUEPRINT  
**Status Otorisasi Implementasi:** NOT AUTHORIZED  
**Status Desain:** CONSOLIDATED PROPOSAL AWAITING PRODUCT OWNER RATIFICATION  
**Tanggal:** 19 Oktober 2026  

---

## 1. TRANSACTION LIFECYCLE & TWO-STEP DECOUPLED ARCHITECTURE `[PROPOSED FUTURE BEHAVIOR]`

Untuk mencegah cacat desain kritis di mana rollback transaksi belanja kasir membatalkan pencatatan gagal PIN (*PIN failure counter*), sistem mengadopsi **Arsitektur Dua Langkah Terpisah (Two-Step Decoupled Transaction)**:

```
[ KASIR KANTIN / POS TERMINAL ]
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ LANGKAH 1: VERIFIKASI KREDENSIAL & ATTEMPT TRACKING (ISOLATED)│
│ File: POST /api/canteen/pay (Sub-alur Autentikasi Kartu)     │
├─────────────────────────────────────────────────────────────┤
│ 1. Kunci baris kartu di database:                           │
│    SELECT * FROM rfid_cards WHERE card_uid = :uid FOR UPDATE;│
│ 2. Jika status == 'blocked' -> STOP, Return HTTP 403.       │
│ 3. Verifikasi PIN dengan Constant-Time Comparison.          │
│ 4. JIKA PIN SALAH:                                          │
│    - failed_pin_attempts += 1;                              │
│    - Jika failed_pin_attempts >= 3 -> status = 'blocked';   │
│    - COMMIT rfid_cards UPDATE LANGSUNG KE DATABASE.         │
│    - STOP, Return HTTP 401 / 403.                           │
│ 5. JIKA PIN BENAR:                                          │
│    - Jika failed_pin_attempts > 0 -> failed_pin_attempts = 0;│
│    - COMMIT rfid_cards UPDATE.                              │
│    - LANJUT KE LANGKAH 2.                                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Hanya jika PIN Benar)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ LANGKAH 2: EKSEKUSI TRANSAKSI FINANSIAL ATOMIK (ACID TX)    │
│ File: POST /api/canteen/pay (Sub-alur Debit & POS Logging)   │
├─────────────────────────────────────────────────────────────┤
│ BEGIN TRANSACTION (db.transaction);                         │
│ 1. Kunci baris dompet santri:                               │
│    SELECT * FROM wallets WHERE santri_id = :sId FOR UPDATE; │
│ 2. Cek status dompet (Wallet Freeze) & limit harian.        │
│ 3. Cek kecukupan saldo (balance_uang_saku >= amount).       │
│ 4. Debit saldo uang saku di database:                       │
│    UPDATE wallets SET balance_uang_saku -= amount ...       │
│ 5. Catat transaksi kasir (dengan idempotency_key & struk):  │
│    INSERT INTO canteen_transactions (..., response_payload); │
│ 6. Catat rincian item barang terstruktur:                   │
│    INSERT INTO canteen_transaction_items (...);              │
│ 7. Catat log mutasi saku santri:                            │
│    INSERT INTO wallet_pockets (...);                         │
│ COMMIT;                                                     │
└─────────────────────────────────────────────────────────────┘
```

**Keunggulan Arsitektur**:
- Jika Langkah 2 mengalami kegagalan database (misal saldo tidak cukup atau disk error), rollback transaksi Langkah 2 **TIDAK AKAN PERNAH** menghapus atau membatalkan catatan gagal PIN yang telah di-commit di Langkah 1.
- Penyerang tidak dapat mengeksploitasi kegagalan belanja kasir untuk mencoba PIN tanpa batas.

---

## 2. STATE MACHINE VERIFIKASI & PEMBLOKIRAN PIN `[PROPOSED FUTURE BEHAVIOR]`

### 2.1 Pilihan Algoritma Hashing PIN `[PO DECISION REQUIRED]`
- **Opsi A (Rekomendasi Arsitek)**: **PBKDF2-HMAC-SHA256 (100.000 iterasi) + 16-byte Cryptographic Salt + Server-Side Pepper**. Nol dependensi native binary, kompatibel penuh dengan runtime serverless Next.js, latensi terukur ~15–30 ms.
- **Opsi B**: **Argon2id (`m=19456, t=2, p=1`)**. Standar memori OWASP, namun memerlukan instalasi dependensi native binary C++ (`@node-rs/argon2`).

> [!IMPORTANT]
> **PENAFIAN BENCHMARK:** Parameter iterasi KDF adalah proyeksi teoritis literatur dan wajib divalidasi dengan benchmark empiris pada staging sandbox sebelum dikunci permanen.

### 2.2 Transisi State PIN:
- `STATE 0` (`failed_pin_attempts = 0`, `status = 'active'`): Kondisi normal.
- `STATE 1` (Salah PIN 1x): `failed_pin_attempts = 1`, kartu tetap aktif, HTTP 401.
- `STATE 2` (Salah PIN 2x): `failed_pin_attempts = 2`, kartu tetap aktif, HTTP 401.
- `STATE 3` (Salah PIN 3x): `failed_pin_attempts = 3`, `status = 'blocked'`, `locked_at = NOW()`, HTTP 403 Forbidden.
- `STATE 4` (Kartu Terblokir): Percobaan berikutnya langsung ditolak HTTP 403 tanpa memverifikasi hash PIN.
- `STATE RESET`: Reset PIN sah oleh Wali Kelas / Admin Keuangan mengembalikan state kartu langsung ke `STATE 0` secara atomik.

---

## 3. IDEMPOTENSI, KANONIKALISASI, & PENANGANAN POSTGRESQL `23505` `[PROPOSED FUTURE BEHAVIOR]`

### 3.1 Konstruksi Hash Permintaan Kanonis (Canonical Request Hash)
```typescript
function buildCanonicalRequestHash(tenantId: string, cardUid: string, canteenId: string, totalAmount: number, items: any[]): string {
  // 1. Urutkan item secara deterministik
  const sortedItems = [...items].sort((a, b) => (a.itemId || a.name).localeCompare(b.itemId || b.name));

  // 2. Susun representasi string kanonis
  const canonicalString = [
    `tenant:${tenantId.trim()}`,
    `card:${cardUid.trim().toUpperCase()}`,
    `canteen:${canteenId.trim()}`,
    `total:${Math.round(totalAmount)}`,
    `items:${sortedItems.map(i => `${i.itemId || 'custom'}|${i.name.trim()}|${i.qty}|${Math.round(i.unitPrice)}`).join(';')}`
  ].join('##');

  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}
```
*Aturan Keamanan*: PIN santri **TIDAK PERNAH** dimasukkan ke dalam hash kanonis.

### 3.2 Penanganan Error PostgreSQL `23505 unique_violation` di Luar Aborted Transaction
Ketika Request 1 dan Request 2 dikirimkan oleh kasir pada milidetik yang sama dengan `Idempotency-Key` identik:
1. Request 1 memegang lock `wallets`, mendebit saldo, menulis transaksi, dan commit.
2. Request 2 terlepas dari lock, mencoba insert baris transaksi dengan `idempotency_key` yang sama, dan menabrak constraint unik `canteen_transactions_tenant_id_idempotency_key_unique`.
3. PostgreSQL melempar error code `23505` dan menandai transaksi Request 2 sebagai *aborted*.
4. **Logika Catch-and-Recover di Luar Transaksi**:
   ```typescript
   try {
     // Eksekusi Langkah 2 dalam db.transaction
   } catch (error: any) {
     // Transaksi Langkah 2 otomatis di-rollback oleh Drizzle/PostgreSQL
     if (
       error.code === '23505' &&
       (error.constraint === 'canteen_transactions_tenant_id_idempotency_key_unique' ||
        error.message?.includes('canteen_transactions_tenant_id_idempotency_key_unique'))
     ) {
       // Jalankan Recovery Query di luar transaksi yang telah teraborsi
       const committedTx = await db.query.canteenTransactions.findFirst({
         where: and(
           eq(canteenTransactions.tenantId, tenantId),
           eq(canteenTransactions.idempotencyKey, idempotencyKey)
         ),
       });

       if (!committedTx) {
         return NextResponse.json({ success: false, message: 'Gangguan transien basis data. Silakan coba kembali.' }, { status: 503 });
       }

       if (committedTx.requestHash !== requestHash) {
         return NextResponse.json({ success: false, message: 'Kunci idempotensi telah digunakan untuk transaksi berbeda' }, { status: 409 });
       }

       if (committedTx.status === 'SUCCESS' && committedTx.responsePayload) {
         return NextResponse.json(committedTx.responsePayload, {
           status: 200,
           headers: { 'X-Idempotent-Replay': 'true' },
         });
       }

       return NextResponse.json({ success: false, message: 'Transaksi paralel sedang diproses' }, { status: 409 });
     }
     throw error;
   }
   ```

---

## 4. STRUKTUR POS TERPERINCI & TIGA MODEL BISNIS MERCHANT `[PROPOSED FUTURE BEHAVIOR]`

### 4.1 Skema Relasional POS Kasir:
```sql
-- Tabel Header Transaksi Kasir
CREATE TABLE "canteen_transactions" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "canteen_id" text NOT NULL,
  "santri_id" text NOT NULL,
  "card_uid" text NOT NULL,
  "idempotency_key" text NOT NULL,
  "request_hash" text NOT NULL,
  "total_amount" integer NOT NULL,
  "merchant_share_amount" integer NOT NULL DEFAULT 0,
  "tenant_share_amount" integer NOT NULL DEFAULT 0,
  "response_payload" jsonb NOT NULL,
  "status" text NOT NULL DEFAULT 'SUCCESS',
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "canteen_transactions_tenant_id_idempotency_key_unique" UNIQUE("tenant_id", "idempotency_key")
);

-- Tabel Detail Item / Layanan Terstruktur
CREATE TABLE "canteen_transaction_items" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "transaction_id" text NOT NULL REFERENCES "canteen_transactions"("id"),
  "item_type" text NOT NULL, -- 'physical_goods' | 'service' | 'obligation_payment'
  "item_id" text, -- Nullable jika custom item atau denda
  "item_name_snapshot" text NOT NULL,
  "quantity" numeric(10,2) NOT NULL DEFAULT 1,
  "unit_price_snapshot" integer NOT NULL,
  "discount_amount" integer NOT NULL DEFAULT 0,
  "line_total" integer NOT NULL,
  "metadata" jsonb, -- Menyimpan ID denda atau rincian layanan
  "created_at" timestamp DEFAULT now() NOT NULL
);
```

### 4.2 Pemetaan Tiga Model Merchant PO:
1. **Model 1 (Revenue Share Sesuai Kontrak)**:
   - Nilai penjualan dibagi otomatis: `tenant_share_amount` masuk ke kas pondok, `merchant_share_amount` menjadi hak pengelola rekanan.
2. **Model 2 (100% Hak Pondok dengan Buku Kas Merchant)**:
   - `tenant_share_amount = total_amount`, `merchant_share_amount = 0`. Seluruh dana masuk ke kas pesantren; merchant memiliki pencatatan kas-in/kas-out operasional.
3. **Model 3 (100% Hak Operator Rekanan)**:
   - `tenant_share_amount = 0`, `merchant_share_amount = total_amount`. Dana diakui sebagai kewajiban pesantren kepada operator (*merchant payable*) untuk di-settle secara periodik.

---

## 5. INTEGRASI LEDGER & PEMISAHAN DOMAIN FINANSIAL `[PROPOSED FUTURE BEHAVIOR]`

Platform APP MA'HAD membedakan secara tegas 5 domain dana:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TAKSONOMI DOMAIN FINANSIAL                      │
├───────────────────────────────┬────────────────────────────────────────┤
│ 1. Saldo Uang Saku Santri     │ Liabilitas titipan (Fidusia).          │
│                               │ Sumber eksklusif pembayaran RFID.      │
├───────────────────────────────┼────────────────────────────────────────┤
│ 2. Saldo Tabungan Santri      │ Liabilitas simpanan jangka menengah.   │
│                               │ Dikelola bendahara, bukan kasir RFID.  │
├───────────────────────────────┼────────────────────────────────────────┤
│ 3. Saldo Terpadu Model B      │ Saldo internal keluarga santri.        │
│                               │ Untuk bayar tagihan SPP & top-up anak. │
├───────────────────────────────┼────────────────────────────────────────┤
│ 4. Pendapatan Pondok          │ Hasil Model 1/2, SPP, pendaftaran PSB. │
├───────────────────────────────┼────────────────────────────────────────┤
│ 5. Merchant/Operator Payable  │ Dana pihak ketiga hasil penjualan POS. │
└───────────────────────────────┴────────────────────────────────────────┘
```
*Prinsip Akuntansi Mutlak*: Pemindahan saldo uang saku ke tabungan santri **BUKAN PENDAPATAN BARU PONDOK**, melainkan pergeseran antar-liabilitas (`CUSTODIAL_POCKET_LIABILITY -> SAVINGS_LIABILITY`).

---

## 6. OTORISASI ROLE & ISOLASI MULTI-TENANT `[PROPOSED FUTURE BEHAVIOR]`

### 6.1 Matriks Kewenangan Operasional:

| Role Pengguna | Pembayaran RFID | Reset PIN Kartu | Buka Blokir Kartu | Edit Katalog POS | Akses Ledger Finansial |
|---|---|---|---|---|---|
| **Santri (Pemilik)** | Ya (via Tap + PIN) | Ditolak | Ditolak | Ditolak | Ditolak |
| **Kasir / Merchant** | Memproses Tap | Ditolak | Ditolak | Ya (Kantin sendiri) | Ditolak |
| **Wali Kelas** | Ditolak | **Ya (Santri binaannya)** | **Ya (Otomatis)** | Ditolak | Ditolak |
| **Admin Keuangan** | Ditolak | **Ya (Seluruh tenant)** | **Ya (Otomatis)** | Ditolak | **Ya** |
| **Wali Santri** | Ditolak | **DILARANG KERAS (403)** | **DILARANG (403)** | Ditolak | Ditolak |
| **Super Admin** | Ditolak | **DILARANG (403)** | **DILARANG (403)** | Ditolak | Monitoring Sistem |

### 6.2 Penegakan Isolasi Tenant Server-Side:
- Server mengekstrak `tenant_id` secara eksklusif dari JWT sesi pengguna yang tervalidasi.
- Seluruh query database menyertakan filter `eq(table.tenantId, sessionTenantId)`.
- Percobaan mengakses kartu, dompet, atau merchant milik tenant lain ditolak seketika dengan **HTTP 403 Forbidden**.

---

## 7. KEBIJAKAN PEMBATALAN, REFUND, & TRANSAKSI GAGAL `[PO DECISION REQUIRED]`

### 7.1 Pembatalan Transaksi Kasir (DEC-10):
- Rekomendasi Arsitek: Kasir hanya diberi wewenang membatalkan transaksi salah input dalam batas waktu **5 menit pertama** di terminal yang sama. Melebihi 5 menit, pembatalan wajib melalui persetujuan tertulis Admin Keuangan untuk mencegah kecurangan kasir.

### 7.2 Alur Pembalikan Saldo (Reversal Flow):
- Refund transaksi kasir dieksekusi secara idempoten:
  1. Header transaksi diubah menjadi `status = 'REFUNDED'`.
  2. Saldo uang saku santri dikreditkan kembali secara atomik.
  3. Log mutasi saku dicatat sebagai `mutationType = 'canteen_refund'`.
  4. Jurnal akuntansi membalik pengakuan pendapatan/payable secara seimbang.

---

## 8. PRASYARAT PREFLIGHT & KEAMANAN MIGRASI DATA WARISAN `[IMPLEMENTATION PREREQUISITE]`

### 8.1 Matriks Query Preflight Read-Only:
```sql
-- 1. Deteksi Saldo Uang Saku Minus
SELECT id, tenant_id, santri_id, balance_uang_saku FROM wallets WHERE balance_uang_saku < 0;

-- 2. Deteksi Saldo Tabungan Minus
SELECT id, tenant_id, santri_id, balance_tabungan FROM wallets WHERE balance_tabungan < 0;

-- 3. Deteksi Duplikasi Dompet per Santri
SELECT tenant_id, santri_id, COUNT(*) FROM wallets GROUP BY tenant_id, santri_id HAVING COUNT(*) > 1;

-- 4. Deteksi Dompet Yatim (Tanpa Santri Aktif)
SELECT w.id FROM wallets w LEFT JOIN santri s ON w.santri_id = s.id WHERE s.id IS NULL;
```

### 8.2 Prosedur Kegagalan Preflight (Fail-Closed Policy):
Jika salah satu query di atas menghasilkan baris data anomali ($\text{count} > 0$), **MIGRASI DDL WAJIB DIBATALKAN**. Seluruh data anomali dilaporkan ke Admin Keuangan untuk diaudit manual. Sistem dilarang mereset saldo atau menghapus baris secara otomatis.

---

## 9. OBSERVABILITAS, METRIK, & ALERTING `[PROPOSED FUTURE BEHAVIOR]`

Sistem mengimplementasikan pemantauan terpusat:
- **Alerting Kritis**:
  - Error PostgreSQL `23514 check_violation` (Percobaan transaksi yang menyebabkan saldo minus berhasil dicegah di kernel DB).
  - Lonjakan penolakan `HTTP 409 Conflict` (Deteksi kasir mengirim request berulang atau payload berbeda).
  - Percobaan reset PIN oleh role tidak sah (indikasi eskalasi privilege).
- **Log Audit Terproteksi**: Audit log mencatat ID aktor, peran aktor, ID santri, dan jenis aksi tanpa pernah mencatat PIN, hash PIN, atau kunci server pepper.

---

**STATUS DOKUMEN ARSITEKTUR:**  
`DESIGN RATIFICATION: PENDING PRODUCT OWNER REVIEW`  
`IMPLEMENTATION STATUS: NOT AUTHORIZED`
