# DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-004
## Spesifikasi Arsitektur Remediasi Final: Transaksi Internal RFID, Keamanan Kriptografi Kredensial, dan Integritas Finansial Multi-Tenant

**Klasifikasi:** Master Remediation Architecture Specification (Pre-Implementation Baseline)  
**Project:** APP MA’HAD / Os_Darta  
**Workstream:** Keuangan, Dompet Digital Santri, Pembayaran Internal RFID, POS Multi-Merchant  
**Lead Agent:** ZenOrion — Antigravity Lead Agent  
**Otoritas:** Product Owner (`Process_PO`) & Acting Process_Mandor (`Mandor 2`)  
**Mandate Reference:** MANDATE M2-FINANCE-ARCHITECTURE-009  
**Execution Mode:** STRICT READ-ONLY  
**Implementation Authorization:** NOT AUTHORIZED  
**Status Dokumen:** CONSOLIDATED PROPOSAL AWAITING PRODUCT OWNER RATIFICATION  
**Tanggal:** 19 Oktober 2026  

---

## 1. REQUEST ENTRY & VALIDASI TRUSTED CONTEXT `[PROPOSED FUTURE BEHAVIOR]`

### 1.1 Titik Masuk Permintaan Kasir POS
Request belanja kasir dikirimkan ke endpoint server:
`POST /api/canteen/pay`

### 1.2 Header Wajib:
- `Authorization`: Bearer session token kasir terautentikasi (NextAuth / Supabase JWT).
- `Idempotency-Key`: UUID v4 unik yang dihasilkan terminal kasir per transaksi tap (`uuidv4()`).
- `X-Tenant-Id`: Slug/ID tenant aktif (di-cross-check dengan JWT).

### 1.3 Payload Permintaan (Client Request Body):
```json
{
  "cardUid": "A1B2C3D4",
  "pin": "1234",
  "canteenId": "cnt_utama_01",
  "items": [
    { "itemId": "item_mkn_01", "name": "Nasi Goreng", "qty": 1, "unitPrice": 12000 },
    { "itemId": "item_mnm_02", "name": "Es Teh Manis", "qty": 1, "unitPrice": 4000 }
  ],
  "totalAmount": 16000,
  "posCashierId": "POS-KASIR-01"
}
```

### 1.4 Validasi Keamanan Konteks Server (Zero Client Trust):
- Server **TIDAK PERNAH** mempercayai parameter `tenantId`, `santriId`, status kartu, atau saldo yang dikirimkan oleh client.
- `tenantId` diekstraksi secara otoritatif dari session server kasir yang telah terverifikasi.
- Kasir wajib memiliki permission `canteen:pos_checkout` pada tenant tersebut.

---

## 2. VALIDASI KEPEMILIKAN KARTU & STATUS RFID `[VERIFIED EXISTING BEHAVIOR] & [PROPOSED FUTURE BEHAVIOR]`

### 2.1 Resolusi Kartu RFID ke Pemilik Santri:
- Server mengeksekusi query ke tabel `rfid_cards`:
  ```sql
  SELECT id, tenant_id, santri_id, card_uid, hashed_pin, pin_salt, status, failed_pin_attempts 
  FROM rfid_cards 
  WHERE tenant_id = :tenantId AND card_uid = :cardUid 
  FOR UPDATE; -- Mengunci baris kartu secara serial
  ```
- **Kondisi Rejeki**:
  - Jika kartu tidak ditemukan: Kembalikan **HTTP 404 Not Found** ("Kartu RFID tidak terdaftar").
  - Jika `status === 'blocked'`: Kembalikan **HTTP 403 Forbidden** ("Transaksi Ditolak: Kartu Diblokir/Dilaporkan Hilang").

### 2.2 Pengikatan Identitas Santri (Ownership Binding):
- Kartu RFID terikat mutlak pada kolom `santri_id`. Kartu santri lain dilarang digunakan untuk memotong saldo santri yang berbeda.
- Server memverifikasi profil santri aktif dari tabel `santri`:
  - Jika status santri tidak aktif (alumni, mutasi, atau keluar): Kembalikan **HTTP 403 Forbidden**.

---

## 3. VERIFIKASI KEAMANAN PIN & PROTOKOL AUTO-BLOCK `[PROPOSED FUTURE BEHAVIOR]`

### 3.1 Pilihan Algoritma Hashing (Menunggu Ratifikasi PO) `[OPEN DECISION]`
- **Opsi A (Rekomendasi Arsitek)**: **PBKDF2-HMAC-SHA256 (100.000 iterasi) + 16-byte random salt + Server-Side Pepper**. Nol dependensi eksternal, ramah serverless Next.js.
- **Opsi B**: **Argon2id (`m=19456, t=2, p=1`)**. Memory-hard standar OWASP, membutuhkan penambahan paket native binary `@node-rs/argon2`.

> [!IMPORTANT]
> **PENAFIAN BENCHMARK:** Parameter iterasi 100.000 adalah rekomendasi teknis yang memerlukan validasi benchmark empiris pada staging sebelum dikunci.

### 3.2 State Machine Verifikasi PIN:
1. Hitung hash dari input PIN yang digabungkan dengan salt kartu dan secret pepper:
   $$\text{computed\_hash} = \text{KDF}(\text{pin},\ \text{card.pin\_salt} \parallel \text{SERVER\_PEPPER})$$
2. Bandingkan `computed_hash` dengan `card.hashed_pin` menggunakan *timing-safe comparison* (`crypto.timingSafeEqual`).
3. **Jika PIN Salah**:
   - Tambah `failed_pin_attempts = failed_pin_attempts + 1`.
   - Jika `failed_pin_attempts >= 3`: Set `status = 'blocked'`, `locked_at = NOW()`, `locked_reason = 'Otomatis: 3x salah PIN'`. Kembalikan **HTTP 403 Forbidden**.
   - Jika `failed_pin_attempts < 3`: Kembalikan **HTTP 401 Unauthorized** ("PIN Salah. Sisa kesempatan: $3 - \text{attempts}$").
4. **Jika PIN Benar**:
   - Jika sebelumnya `failed_pin_attempts > 0`: Reset `failed_pin_attempts = 0`.

### 3.3 Otoritas Reset PIN & Pembukaan Blokir (Aturan PO Terkunci):
- **Wali Kelas**: Berwenang mereset PIN santri di kelas binaannya (`POST /api/rfid/reset-pin`).
- **Admin Keuangan**: Berwenang mereset PIN santri di tenant yang sama.
- **Wali Santri**: **DILARANG MERESET PIN** (HTTP 403 Forbidden).
- **Super Admin**: **TIDAK DIIZINKAN** tanpa otorisasi eksplisit baru dari PO.
- Reset yang sah otomatis mengosongkan `failed_pin_attempts = 0`, mengatur `status = 'active'`, dan menghapus `locked_at` serta mencatat audit trail di `audit_logs`.

---

## 4. OTORISASI MERCHANT KASIR & MODEL BISNIS `[PROPOSED FUTURE BEHAVIOR]`

### 4.1 Validasi Merchant:
- Memeriksa tabel `canteens` berdasarkan `canteenId` dan `tenantId`.
- Memastikan `canteens.status === 'active'`. Jika merchant nonaktif, tolak **HTTP 403 Forbidden**.

### 4.2 Model Pembagian Pendapatan (Revenue Sharing Model):
- Mendukung 3 model kontrak merchant santri:
  1. `100_percent_pondok`: Seluruh hasil penjualan menjadi pendapatan pesantren (`tenant_share_amount = total`).
  2. `100_percent_operator`: Seluruh hasil menjadi hak pengelola kantin rekanan (`merchant_share_amount = total`).
  3. `profit_sharing`: Bagi hasil persentase (misal 15% pondok, 85% pengelola).

---

## 5. VALIDASI ITEM TERSTRUKTUR & LAYANAN NONFISIK `[PROPOSED FUTURE BEHAVIOR]`

### 5.1 Penolakan Manipulasi Harga Klien:
- Jika `itemId` merujuk katalog `canteen_items`: Server mengambil harga satuan resmi dari database (`canteen_items.price`).
- Nilai `unitPrice` yang dikirim client wajib cocok dengan master katalog; jika terjadi selisih, server menolak transaksi **HTTP 400 Bad Request** ("Inkonsistensi Harga Barang").

### 5.2 Dukungan Transaksi Layanan Nonfisik:
- Jenis item didukung:
  - `'physical_goods'`: Barang konsumsi, alat tulis, seragam.
  - `'service'`: Jasa laundry, fotokopi, potong rambut.
  - `'obligation_payment'`: Pembayaran denda pelanggaran tata tertib santri atau iuran wajib.
- Transaksi nonfisik mencatat metadata ID kewajiban (`violation_id` / `bill_id`) tanpa memaksakan adanya stok fisik.

---

## 6. KANONIKALISASI REQUEST & HASH SIDIK JARI `[PROPOSED FUTURE BEHAVIOR]`

### 6.1 Algoritma Kanonikalisasi Server-Side:
```typescript
function computeCanonicalRequestHash(tenantId: string, cardUid: string, canteenId: string, totalAmount: number, items: any[]): string {
  // Pengurutan deterministik item lines
  const sortedLines = [...items].sort((a, b) => (a.itemId || a.name).localeCompare(b.itemId || b.name));
  
  const canonicalString = [
    `tenant:${tenantId.trim()}`,
    `card:${cardUid.trim().toUpperCase()}`,
    `canteen:${canteenId.trim()}`,
    `total:${Math.round(totalAmount)}`,
    `items:${sortedLines.map(i => `${i.itemId || 'custom'}|${i.name.trim()}|${i.qty}|${Math.round(i.unitPrice)}`).join(';')}`
  ].join('##');

  return crypto.createHash('sha256').update(canonicalString).digest('hex');
}
```
*Aturan Mutlak*: PIN santri **DILARANG** dimasukkan ke dalam hash kanonis.

---

## 7. PROTOKOL IDEMPOTENSI & PENANGANAN POSTGRESQL `23505` `[PROPOSED FUTURE BEHAVIOR]`

### 7.1 Alur Deteksi Idempotensi:
1. Server mencari transaksi dengan `idempotency_key` dan `tenant_id` pada tabel `canteen_transactions`.
2. Jika sudah ada:
   - Jika `request_hash` **berbeda**: Tolak seketika dengan **HTTP 409 Conflict** ("Kunci Idempotensi Digunakan Ulang dengan Payload Berbeda").
   - Jika `request_hash` **identik**:
     - Jika status `'SUCCESS'`: Kembalikan cached `response_payload` asli dengan **HTTP 200 OK** dan header `X-Idempotent-Replay: true` (*Nol pemotongan saldo kedua*).
     - Jika status `'PENDING'`: Kembalikan **HTTP 409 / 425** ("Transaksi sedang diproses").

### 7.2 Penanganan Error Konkurensi `23505 unique_violation`:
- Jika dua request identik tiba serentak, request kedua yang menabrak constraint `canteen_transactions_tenant_id_idempotency_key_unique` ditangkap secara elegan oleh blok catch:
  ```typescript
  if (error.code === '23505' && error.constraint === 'canteen_transactions_tenant_id_idempotency_key_unique') {
    const committedTx = await db.query.canteenTransactions.findFirst({
      where: and(eq(canteenTransactions.tenantId, tenantId), eq(canteenTransactions.idempotencyKey, idempotencyKey))
    });
    if (committedTx && committedTx.requestHash === requestHash && committedTx.status === 'SUCCESS') {
      return NextResponse.json(committedTx.responsePayload, { status: 200, headers: { 'X-Idempotent-Replay': 'true' } });
    }
    return NextResponse.json({ success: false, message: 'Konflik Permintaan Paralel' }, { status: 409 });
  }
  ```

---

## 8. PENGUNCIAN BARIS DOMPET & PENGECEKAN KECUKUPAN DANA `[PROPOSED FUTURE BEHAVIOR]`

### 8.1 Serialisasi Row-Level Locking (`FOR UPDATE`):
Di dalam blok `db.transaction(async (tx) => { ... })`:
```typescript
const [wallet] = await tx
  .select()
  .from(wallets)
  .where(and(eq(wallets.tenantId, tenantId), eq(wallets.santriId, card.santriId)))
  .for('update');
```

### 8.2 Pengecekan Wallet Freeze:
- Tolak transaksi jika `wallet.canteenStatus` bernilai:
  - `'suspended_by_walikelas'` (HTTP 403)
  - `'suspended_by_wali'` (HTTP 403)
  - `'blocked'` (HTTP 403)

### 8.3 Pengecekan Limit Belanja Harian Terpusat:
- Agregasi belanja hari ini dari `canteen_transactions` ditambah `amount`.
- Jika melebihi `wallet.dailyLimit` (default Rp 20.000): Tolak **HTTP 400 Bad Request** ("Mencapai Limit Belanja Harian").

### 8.4 Pengecekan Saldo Uang Saku:
- Jika `wallet.balanceUangSaku < amount`: Tolak **HTTP 400 Bad Request** ("Saldo Uang Saku Tidak Cukup").
- Saldo tabungan santri **TIDAK PERNAH DIPERIKSA ATAU DISENTUH**.

---

## 9. OPERASI FINANSIAL ATOMIK (ATOMIC DATABASE MUTATIONS) `[PROPOSED FUTURE BEHAVIOR]`

Seluruh langkah mutasi disatukan ke dalam satu batas transaksi ACID database:

```
BEGIN TRANSACTION;
  1. UPDATE wallets 
     SET balance_uang_saku = balance_uang_saku - :amount, updated_at = NOW() 
     WHERE id = :walletId;

  2. INSERT INTO canteen_transactions (
       id, tenant_id, canteen_id, santri_id, card_uid, idempotency_key, 
       request_hash, total_amount, merchant_share_amount, tenant_share_amount, 
       response_payload, status
     ) VALUES ( ... );

  3. INSERT INTO canteen_transaction_items (
       id, tenant_id, transaction_id, item_type, item_id, item_name_snapshot, 
       quantity, unit_price_snapshot, discount_amount, line_total, metadata
     ) VALUES ( ... );

  4. INSERT INTO wallet_pockets (
       id, tenant_id, wallet_id, pocket_type, mutation_type, amount, 
       balance_before, balance_after, description, reference_id
     ) VALUES ( ... );
COMMIT;
```
Jika terjadi kegagalan pada langkah mana pun, PostgreSQL me-rollback seluruh transaksi tanpa meninggalkan saldo terpotong sepihak.

---

## 10. MODEL STATUS TRANSAKSI (TRANSACTION STATE MODEL) `[PROPOSED FUTURE BEHAVIOR]`

Status transaksi diklasifikasikan tegas:
- **`SUCCESS`**: Transaksi berhasil mendebit saldo, tercatat di POS dan log saku.
- **`FAILED_BUSINESS_RULE`**: Ditolak sebelum transaksi ditulis (saldo kurang, PIN salah, limit habis). Nol efek finansial.
- **`REFUNDED`**: Transaksi dibatalkan secara sah melalui alur pembatalan yang diotorisasi.

---

## 11. PERSISTENSI RESPONSE PAYLOAD & DATA STRUK `[PROPOSED FUTURE BEHAVIOR]`

Format data yang disimpan pada kolom `response_payload jsonb`:
```json
{
  "success": true,
  "message": "Pembayaran Kantin Berhasil",
  "data": {
    "transactionId": "ctx_123456789",
    "santriName": "Ahmad Fauzi",
    "kelas": "X-A",
    "amountDeducted": 16000,
    "remainingBalanceUangSaku": 34000,
    "totalSpentToday": 16000,
    "dailyLimit": 20000,
    "remainingDailyLimit": 4000,
    "vendorName": "Kantin Utama",
    "items": [
      { "name": "Nasi Goreng", "qty": 1, "price": 12000, "subtotal": 12000 },
      { "name": "Es Teh Manis", "qty": 1, "price": 4000, "subtotal": 4000 }
    ],
    "timestamp": "2026-10-19T22:30:00.000Z"
  }
}
```
*Larangan Privasi*: Dilarang menyimpan PIN, hash PIN, atau token internal kasir.

---

## 12. PENCATATAN AUDIT TRAIL `[PROPOSED FUTURE BEHAVIOR]`

Setiap peristiwa penting dicatat ke tabel `audit_logs`:
- Peristiwa `PIN_FAILED_ATTEMPT`: Mencatat ID santri, UID kartu, dan nomor percobaan gagal.
- Peristiwa `CARD_AUTO_BLOCKED`: Mencatat pemblokiran otomatis pada kegagalan ke-3.
- Peristiwa `PIN_RESET_AND_UNBLOCKED`: Mencatat ID aktor (Wali Kelas/Admin Keuangan), ID santri, dan pembukaan blokir.

---

## 13. PENANGANAN ERROR & PEMULIHAN AMBIGU `[PROPOSED FUTURE BEHAVIOR]`

- **Timeout Jaringan Kasir**: Jika kasir mengalami timeout setelah saldo terpotong di server, kasir mengirim ulang request dengan `Idempotency-Key` yang sama. Sistem mendeteksi kunci yang sudah berstatus `SUCCESS`, mengembalikan salinan respon struk asli (HTTP 200), dan **tidak memotong saldo untuk kedua kalinya**.
- **Kegagalan Koneksi Database**: Jika recovery query mengalami gangguan koneksi, sistem merespon dengan **HTTP 503 Service Unavailable** menginstruksikan kasir untuk mencoba kembali tanpa risiko korupsi saldo.

---

## 14. PRASYARAT MIGRASI DATABASE (MIGRATION PREREQUISITES) `[IMPLEMENTATION PREREQUISITE]`

Sebelum DDL migrasi dapat dieksekusi di masa mendatang, inspeksi pra-pemeriksaan (*preflight inspection*) wajib dijalankan:
1. Verifikasi saldo uang saku non-negatif: `SELECT count(*) FROM wallets WHERE balance_uang_saku < 0;` (Wajib bernilai 0).
2. Verifikasi saldo tabungan non-negatif: `SELECT count(*) FROM wallets WHERE balance_tabungan < 0;` (Wajib bernilai 0).
3. Verifikasi duplikasi dompet: `SELECT santri_id FROM wallets GROUP BY tenant_id, santri_id HAVING count(*) > 1;` (Wajib bernilai 0).
4. Penerbitan Constraint DDL:
   ```sql
   ALTER TABLE "wallets" ADD CONSTRAINT "wallets_balance_uang_saku_non_negative" CHECK ("balance_uang_saku" >= 0);
   ALTER TABLE "wallets" ADD CONSTRAINT "wallets_balance_tabungan_non_negative" CHECK ("balance_tabungan" >= 0);
   ALTER TABLE "wallets" ADD CONSTRAINT "wallets_tenant_santri_unique" UNIQUE ("tenant_id", "santri_id");
   ALTER TABLE "canteen_transactions" ADD CONSTRAINT "canteen_transactions_tenant_id_idempotency_key_unique" UNIQUE ("tenant_id", "idempotency_key");
   ```

---

## 15. MANAJEMEN RAHASIA SERVER PEPPER `[PROPOSED FUTURE BEHAVIOR]`

- Variabel `RFID_PIN_PEPPER` dikonfigurasikan secara eksklusif pada environment server Next.js (Vercel Project Settings / Docker Secret).
- **Perilaku Fail-Closed**: Jika `process.env.RFID_PIN_PEPPER` tidak terdefinisi, aplikasi melempar exception saat inisialisasi dan menolak seluruh pembayaran RFID untuk mencegah verifikasi tanpa pepper.

---

## 16. PERSYARATAN PENGUJIAN OTOMATIS `[IMPLEMENTATION PREREQUISITE]`

Seluruh suite pengujian mencakup 20 skenario terverifikasi (lihat `MATRIX-M2-FINANCE-RFID-TRACEABILITY-001.md`), wajib lulus 100% pada lingkungan staging terisolasi sebelum kode di-deploy ke produksi.

---

## 17. ROLLOUT & MONITORING OPERASIONAL `[PROPOSED FUTURE BEHAVIOR]`

- **Staged Rollout**: Diuji coba pada satu kantin percontohan (Pilot Merchant) sebelum dibuka ke seluruh tenant.
- **Monitoring Alert**: Peringatan otomatis jika terjadi error `23514 check_violation` (saldo minus dicegah) atau lonjakan penolakan `409 Conflict`.

---

**STATUS DOKUMEN:**  
`DESIGN RATIFICATION: PENDING PRODUCT OWNER REVIEW`  
`IMPLEMENTATION STATUS: NOT AUTHORIZED`
