# DRAFT-FINANCE-MERCHANT-WALLET-EXTENSION-001
## Spesifikasi Ekstensi Arsitektur: Wallet Orang Tua, Tabungan Santri, Multi-Merchant Generik, Collection Point & Pembayaran Denda RFID

**Status:** PROPOSAL DRAFT ARSITEKTUR — PRE-RATIFICATION  
**Author:** Antigravity Lead Agent — ZenOrion  
**Otoritas Mandat:** Acting Process_Mandor — Mandor 2 & Process_PO  
**Dasar Kontrak:**
- `docs/spesifikasi-pembayaran.md` (Financial Core Flip Proxy)
- `docs/architecture/SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md` (Companion Specification Domain 001)
- `docs/architecture/REPORT-M2-FINANCE-MERCHANT-WALLET-GAP-AUDIT-001.md` (Laporan Gap Audit 002)
**Tanggal:** 19 Oktober 2026  

---

## 1. PENDAHULUAN & TUJUAN DOKUMEN

Dokumen ini disusun sebagai pelengkap arsitektural (*architectural extension*) untuk menutup celah (*gaps*) yang diidentifikasi dalam Mandat **M2-FINANCE-ARCHITECTURE-002**.

Dokumen ini mendefinisikan rancangan teknis, model data Drizzle, alur transaksi, antarmuka kontrak, dan jurnal pembukuan double-entry untuk 5 kapabilitas utama:
1. **Kantong 1: Saldo Orang Tua (`WALI_WALLET`)** — Deposit internal keluarga untuk pembayaran tagihan santri dan alokasi uang saku bebas biaya payment gateway.
2. **Kantong 2: Tabungan Santri (`SANTRI_SAVINGS_WALLET`)** — Pengelolaan simpanan fidusia santri di pondok dengan perlindungan 5-Step Approval & NFC Tap.
3. **Multi-Merchant Generik Pesantren (`tenant_merchants`)** — Mengabstraksi kantin, koperasi, toko kitab, laundry, dan unit usaha ke dalam model merchant terpadu dengan 2 opsi model pengelolaan (Internal Pondok vs Konsesi Operator Rekanan).
4. **Collection Merchant & Pembayaran Denda via RFID** — Titik penerimaan non-ritel untuk pelunasan denda tata tertib atau ganti rugi fasilitas menggunakan kartu RFID santri dengan konfirmasi PIN, **tanpa pemotongan uang saku otomatis**.
5. **Dashboard Wali & Pelaporan Merchant** — Antarmuka pemantauan 3 kantong saldo dan audit trail pengeluaran anak di setiap merchant.

---

## 2. PROPOSAL SKEMA DATABASE DRIZZLE (EXTENSION DDL)

Semua nominal uang disimpan sebagai integer Rupiah (`bigint({ mode: 'number' })`) sesuai **Aturan Mutlak 1**.

### 2.1. Skema Saldo Orang Tua (`wali_wallets`)
```typescript
import { pgTable, text, bigint, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { tenants, users } from './identity';

export const waliWallets = pgTable('wali_wallets', {
  id: text('id').primaryKey(), // 'wwal_...'
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  waliUserId: text('wali_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  balance: bigint('balance', { mode: 'number' }).notNull().default(0), // Saldo internal orang tua (Rp)
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'FROZEN'
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantWaliUnique: unique('uq_tenant_wali_wallet').on(table.tenantId, table.waliUserId),
  tenantIdx: index('idx_wali_wallets_tenant').on(table.tenantId),
}));

export const waliWalletMutations = pgTable('wali_wallet_mutations', {
  id: text('id').primaryKey(), // 'wwmut_...'
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  walletId: text('wallet_id').notNull().references(() => waliWallets.id, { onDelete: 'cascade' }),
  
  mutationType: text('mutation_type').notNull(), // 'TOPUP_EXTERNAL' | 'TRANSFER_TO_STUDENT_SAKU' | 'PAY_BILL_INTERNAL' | 'REFUND'
  amount: bigint('amount', { mode: 'number' }).notNull(),
  balanceBefore: bigint('balance_before', { mode: 'number' }).notNull(),
  balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(),
  
  referenceType: text('reference_type').notNull(), // 'PAYMENT_ORDER' | 'STUDENT_WALLET' | 'INVOICE'
  referenceId: text('reference_id').notNull(),
  description: text('description').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  walletIdx: index('idx_wwmut_wallet').on(table.walletId),
  tenantIdx: index('idx_wwmut_tenant').on(table.tenantId),
}));
```

### 2.2. Skema Multi-Merchant Generik (`tenant_merchants`)
*Catatan: Menggantikan batasan monolitik tabel `canteens` secara bertahap melalui relasi kompatibilitas.*
```typescript
export const tenantMerchants = pgTable('tenant_merchants', {
  id: text('id').primaryKey(), // 'mrc_...'
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  code: text('code').notNull(), // e.g. "KNT-01", "KOP-01", "LOK-DISIPLIN-01"
  name: text('name').notNull(), // e.g. "Kantin Asrama Putra", "Koperasi Putri", "Loket Tata Tertib"
  
  merchantType: text('merchant_type').notNull().default('RETAIL'), 
  // 'RETAIL' (Kantin, Toko) | 'SERVICE' (Laundry, Cukur) | 'COLLECTION' (Loket Penerimaan Denda / Biaya)
  
  managementModel: text('management_model').notNull().default('INTERNAL_PONDOK'),
  // 'INTERNAL_PONDOK' (Dikelola langsung pondok) | 'THIRD_PARTY_OPERATOR' (Konsesi rekanan/koperasi karyawan)
  
  location: text('location').notNull(), // e.g. "Gedung Utama Lt. 1"
  operatingHours: text('operating_hours').default('06:00 - 21:00').notNull(),
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'INACTIVE'
  
  // Informasi settlement / pencairan untuk rekanan konsesi
  settlementBankCode: text('settlement_bank_code'),
  settlementAccountNumber: text('settlement_account_number'), // Terenkripsi
  settlementAccountHolder: text('settlement_account_holder'),
  
  receiptFooter: text('receipt_footer').default('Terima kasih telah bertransaksi').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantCodeUnique: unique('uq_tenant_merchant_code').on(table.tenantId, table.code),
  tenantIdx: index('idx_tenant_merchants_tenant').on(table.tenantId, table.status),
}));

export const merchantCashiers = pgTable('merchant_cashiers', {
  id: text('id').primaryKey(), // 'mcsh_...'
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  merchantId: text('merchant_id').notNull().references(() => tenantMerchants.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  cashierName: text('cashier_name').notNull(),
  posTerminalCode: text('pos_terminal_code').default('POS-01').notNull(), // Kode terminal kasir
  status: text('status').notNull().default('ACTIVE'), // 'ACTIVE' | 'SUSPENDED'
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  merchantUserUnique: unique('uq_merchant_user_cashier').on(table.merchantId, table.userId),
  merchantIdx: index('idx_mcsh_merchant').on(table.merchantId),
}));
```

### 2.3. Skema Transaksi Merchant & Rincian Item (`merchant_transactions`)
```typescript
export const merchantTransactions = pgTable('merchant_transactions', {
  id: text('id').primaryKey(), // 'mtx_...'
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  merchantId: text('merchant_id').notNull().references(() => tenantMerchants.id),
  merchantName: text('merchant_name').notNull(), // Snapshot
  merchantType: text('merchant_type').notNull(), // 'RETAIL' | 'COLLECTION'
  
  santriId: text('santri_id').notNull(), // Santri yang bertransaksi / dikenai denda
  santriName: text('santri_name').notNull(),
  cardUid: text('card_uid').notNull(), // RFID chip UID
  
  totalAmount: bigint('total_amount', { mode: 'number' }).notNull(), // Nominal transaksi (Rp)
  paymentMethod: text('payment_method').notNull().default('RFID_UANG_SAKU'), 
  // 'RFID_UANG_SAKU' | 'CASH' | 'WALI_WALLET'
  
  cashierId: text('cashier_id').notNull(), // Petugas kasir
  cashierName: text('cashier_name').notNull(),
  
  status: text('status').notNull().default('SUCCESS'), // 'SUCCESS' | 'REFUNDED' | 'CANCELLED'
  itemsSummary: text('items_summary').notNull(), // e.g. "Nasi Goreng (x1), Teh (x1)" atau "Denda Terlambat"
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_mtx_tenant').on(table.tenantId),
  merchantIdx: index('idx_mtx_merchant').on(table.merchantId),
  santriIdx: index('idx_mtx_santri').on(table.santriId),
  createdIdx: index('idx_mtx_created').on(table.createdAt),
}));

export const merchantTransactionItems = pgTable('merchant_transaction_items', {
  id: text('id').primaryKey(), // 'mti_...'
  transactionId: text('transaction_id').notNull().references(() => merchantTransactions.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  itemId: text('item_id'), // Nullable jika Collection/Denda
  itemName: text('item_name').notNull(),
  category: text('category').notNull(), // 'makanan' | 'minuman' | 'kitab' | 'alat_tulis' | 'denda'
  quantity: bigint('quantity', { mode: 'number' }).notNull().default(1),
  unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
  subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
}, (table) => ({
  txIdx: index('idx_mti_tx').on(table.transactionId),
}));
```

### 2.4. Skema Denda Finansial Santri (`student_fines`)
```typescript
export const studentFines = pgTable('student_fines', {
  id: text('id').primaryKey(), // 'fine_...'
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  santriId: text('santri_id').notNull(),
  santriName: text('santri_name').notNull(),
  
  pelanggaranId: text('pelanggaran_id').notNull(), // Relasi ke tabel pelanggaran kesiswaan
  violationTitle: text('violation_title').notNull(), // e.g. "Terlambat Sholat Berjamaah"
  violationDate: timestamp('violation_date', { withTimezone: true }).notNull(),
  
  fineAmount: bigint('fine_amount', { mode: 'number' }).notNull(), // Nominal denda (Rp)
  dueDate: timestamp('due_date', { withTimezone: true }),
  
  status: text('status').notNull().default('UNPAID'), // 'UNPAID' | 'PAID' | 'WAIVED'
  
  paidAt: timestamp('paid_at', { withTimezone: true }),
  paymentMethod: text('payment_method'), // 'RFID_UANG_SAKU' | 'CASH' | 'WALI_WALLET' | 'ONLINE_FLIP'
  collectedByMerchantId: text('collected_by_merchant_id').references(() => tenantMerchants.id),
  collectedByCashierId: text('collected_by_cashier_id').references(() => users.id),
  merchantTransactionId: text('merchant_transaction_id').references(() => merchantTransactions.id),
  
  waivedByUserId: text('waived_by_user_id').references(() => users.id),
  waivedReason: text('waived_reason'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantSantriIdx: index('idx_fines_tenant_santri').on(table.tenantId, table.santriId),
  statusIdx: index('idx_fines_status').on(table.status),
  pelanggaranIdx: index('idx_fines_pelanggaran').on(table.pelanggaranId),
}));
```

---

## 3. PROTOKOL PEMBAYARAN DENDA RFID DI COLLECTION POINT

### Invariant Penegakan Disiplin (INV-FINE)
1. **INV-FINE-01 (No Auto-Deduction)**: Penerbitan catatan denda di `student_fines` **DILARANG KERAS** memicu pemotongan saldo uang saku santri secara otomatis.
2. **INV-FINE-02 (Separation of Roles)**: Petugas yang menetapkan pelanggaran (Guru/Musyrif) tidak boleh mengeksekusi penerimaan uang jika bukan kasir resmi Collection Point.
3. **INV-FINE-03 (Student Consent & PIN Verification)**: Pembayaran denda menggunakan saldo uang saku di loket RFID wajib memverifikasi PIN kartu santri (mencegah penyalahgunaan kartu oleh santri lain).
4. **INV-FINE-04 (Savings Prohibition)**: Saldo tabungan santri (`balance_tabungan`) **DILARANG** digunakan untuk melunasi denda di Collection Point.
5. **INV-FINE-05 (Single Settlement)**: Satu record denda hanya dapat dilunasi tepat satu kali (atomic status update 'UNPAID' -> 'PAID').

### Alur Antarmuka Endpoint: `POST /api/collection/fines/pay`
```typescript
export interface PayStudentFineInput {
  tenantId: string;
  merchantId: string; // ID Collection Merchant (e.g. Loket Tata Tertib)
  cashierUserId: string;
  fineId: string; // ID student_fines
  cardUid: string; // RFID Santri
  pin?: string; // Wajib jika paymentMethod = 'RFID_UANG_SAKU'
  paymentMethod: 'RFID_UANG_SAKU' | 'CASH' | 'WALI_WALLET';
}
```

**Langkah Eksekusi di Server**:
1. Verifikasi permission kasir: Pengguna memiliki hak kasir di `merchant_cashiers`.
2. Verifikasi status denda: `student_fines.status === 'UNPAID'`.
3. Validasi identitas RFID: Kartu terdaftar dan terikat ke `santri_id` yang sama dengan pemilik denda.
4. Jika `paymentMethod === 'RFID_UANG_SAKU'`:
   - Verifikasi PIN kartu: `rfidCards.hashedPin === pin`.
   - Cek kecukupan saldo: `wallets.balanceUangSaku >= fine.fineAmount`.
   - Cek status freeze: Kartu tidak berstatus `blocked`.
   - Eksekusi transaksi database ACID:
     * Potong saldo `wallets.balanceUangSaku`.
     * Tulis mutasi di `wallet_pockets` (`pocket_type: 'uang_saku'`, `mutation_type: 'fine_deduct'`).
     * Tulis baris di `merchant_transactions` dan `merchant_transaction_items`.
     * Update `student_fines` -> status `PAID`.
     * Posting jurnal Double-Entry:
       - Debit: `CUSTODIAL_WALLET_LIABILITY:{tenant_id}`
       - Kredit: `TENANT_DISCIPLINE_REVENUE:{tenant_id}`
5. Balas response struk digital dan picu notifikasi ke portal wali santri.

---

## 4. ATURAN JURNAL DOUBLE-ENTRY UNTUK MULTI-MERCHANT & SALDO ORANG TUA

Semua transaksi merchant dan dompet internal diintegrasikan ke sistem ledger platform tanpa melanggar **Aturan Mutlak 1–13**:

### Jurnal 1: Top-Up Saldo Orang Tua (Via Gateway Flip)
*Wali mengisi deposit keluarga Rp 1.000.000 via QRIS (biaya admin Rp 3.200 dibayar wali, gateway fee Rp 4.000).*

| Akun | Debit (Rp) | Kredit (Rp) |
|---|---|---|
| `GATEWAY_CLEARING` | 1.003.200 | 0 |
| `WALI_WALLET_LIABILITY:{tenant_id}:{wali_id}` | 0 | 1.000.000 |
| `PLATFORM_REVENUE` (kategori `admin_fee`) | 0 | 3.200 |
| `GATEWAY_FEE_EXPENSE` | 4.000 | 0 |
| `GATEWAY_CLEARING` | 0 | 4.000 |
| **Total** | **1.007.200** | **1.007.200** |

### Jurnal 2: Alokasi Internal dari Saldo Orang Tua ke Uang Saku Anak
*Wali memindahkan Rp 200.000 dari Saldo Orang Tua ke Uang Saku Santri A (Internal, Bebas Biaya Gateway).*

| Akun | Debit (Rp) | Kredit (Rp) |
|---|---|---|
| `WALI_WALLET_LIABILITY:{tenant_id}:{wali_id}` | 200.000 | 0 |
| `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | 0 | 200.000 |
| **Total** | **200.000** | **200.000** |

*Catatan: Zero Gateway Fee. Tidak ada panggilan ke Flip API.*

### Jurnal 3: Belanja Santri di Kantin Internal Pondok
*Santri jajan Rp 15.000 di Kantin Asrama (Unit Usaha Milik Pondok).*

| Akun | Debit (Rp) | Kredit (Rp) |
|---|---|---|
| `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | 15.000 | 0 |
| `TENANT_INCOME_CANTEEN:{tenant_id}` | 0 | 15.000 |
| **Total** | **15.000** | **15.000** |

### Jurnal 4: Belanja Santri di Koperasi / Merchant Rekanan Konsesi
*Santri membeli kitab Rp 25.000 di Toko Kitab (Dikelola Rekanan Pihak Ketiga).*

| Akun | Debit (Rp) | Kredit (Rp) |
|---|---|---|
| `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | 25.000 | 0 |
| `MERCHANT_PAYABLE:{tenant_id}:{merchant_id}` | 0 | 25.000 |
| **Total** | **25.000** | **25.000** |

*Catatan: Dana menjadi kewajiban hutang tenant kepada vendor rekanan, dapat ditarik saat rekonsiliasi periodik.*

### Jurnal 5: Pembayaran Denda Santri via Uang Saku RFID
*Santri melunasi denda keterlambatan Rp 10.000 di loket Collection Point.*

| Akun | Debit (Rp) | Kredit (Rp) |
|---|---|---|
| `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | 10.000 | 0 |
| `TENANT_DISCIPLINE_REVENUE:{tenant_id}` | 0 | 10.000 |
| **Total** | **10.000** | **10.000** |

---

## 5. KONTRAK ANTARMUKA SERVICE & DTO

### 5.1. `ParentWalletService`
```typescript
export interface ParentWalletService {
  getBalance(tenantId: string, waliUserId: string): Promise<number>;
  
  allocateToStudentWallet(params: {
    tenantId: string;
    waliUserId: string;
    santriId: string;
    amount: number;
    description?: string;
  }): Promise<{ mutationId: string; newBalance: number }>;

  payBillInternal(params: {
    tenantId: string;
    waliUserId: string;
    invoiceId: string;
  }): Promise<{ transactionId: string; newBalance: number }>;
}
```

### 5.2. `MerchantTransactionService`
```typescript
export interface MerchantTransactionService {
  processRetailPayment(input: {
    tenantId: string;
    merchantId: string;
    cashierUserId: string;
    cardUid: string;
    pin: string;
    amount: number;
    items: Array<{ itemId?: string; name: string; category: string; qty: number; unitPrice: number }>;
  }): Promise<{ transactionId: string; remainingLimit: number; remainingBalance: number }>;

  getMerchantDailyReport(params: {
    tenantId: string;
    merchantId: string;
    date: Date;
  }): Promise<{
    merchantName: string;
    totalTransactions: number;
    totalAmount: number;
    breakdownByCashier: Array<{ cashierName: string; count: number; total: number }>;
    transactions: Array<any>;
  }>;
}
```

### 5.3. `WaliSpendingMonitoringService`
```typescript
export interface WaliSpendingMonitoringService {
  getStudentSpendingFeed(params: {
    tenantId: string;
    waliUserId: string;
    santriId: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    santriName: string;
    totalSpentPeriod: number;
    transactions: Array<{
      id: string;
      merchantName: string;
      merchantType: string;
      amount: number;
      itemsSummary: string;
      paymentMethod: string;
      timestamp: Date;
    }>;
  }>;
}
```

---

## 6. PENUTUP & KESIMPULAN DRAFT EKSTENSI

Dengan adopsi spesifikasi ekstensi ini:
- **Tiga Kantong Keuangan** memiliki batas kepemilikan dan peruntukan yang jelas tanpa risiko tercampur.
- **Multi-Merchant** dapat dikembangkan fleksibel untuk seluruh unit bisnis pesantren (ritel maupun layanan) dengan pemisahan pendapatan yayasan vs hutang rekanan konsesi.
- **Collection Point & Denda RFID** terlindungi oleh invariant keamanan: tidak ada pemotongan uang saku sepihak dan dana tabungan tetap steril dari potongan denda.
- **Dashboard Wali** mendapatkan visibilitas penuh terhadap mutasi dan pengeluaran harian santri secara transparan dan aman.
