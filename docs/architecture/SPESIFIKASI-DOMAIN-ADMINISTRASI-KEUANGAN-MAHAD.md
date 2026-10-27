# DOKUMEN ARSITEKTUR KEUANGAN TERPADU & SPESIFIKASI DOMAIN PENDAMPING
## APP MA’HAD — Modul Administrasi Keuangan, Tagihan Santri & Unified Checkout
**Status:** DRAFT PROPOSAL ARSITEKTUR — PRE-RATIFICATION  
**Author:** Antigravity Lead Agent — ZenOrion  
**Otoritas Mandat:** Acting Process_Mandor — Mandor 2 & Process_PO  
**Dasar Kontrak Keuangan:** `docs/spesifikasi-pembayaran.md` (Spesifikasi Agent Modul Pembayaran Multi-Tenant Flip Proxy)  
**Dokumen Induk:** `REPORT-M2-FINANCE-ARCHITECTURE-001`  
**Tanggal:** 19 Oktober 2026  

---

## 1. PENDAHULUAN & PENDEKATAN DOKUMEN

Berdasarkan Mandat **M2-FINANCE-ARCHITECTURE-001**, dokumen ini disusun menggunakan **Opsi B (Spesifikasi Domain Pendamping)**.

### Prinsip Pemisahan Batas (Separation of Concerns)
1. **Spesifikasi Inti (`docs/spesifikasi-pembayaran.md`)**: Tetap menjadi **sumber kebenaran tunggal (Single Source of Truth)** untuk *Financial Core Platform*:
   - Aturan Mutlak 1–13 (Integer BIGINT, Append-only Ledger, Balans Debit-Kredit, Zero Balance Column, Isolasi Tenant, Snapshot Aturan Biaya, Kerahasiaan Kunci Flip & Margin SaaS).
   - Engine Akuntansi Double-Entry Platform (`GATEWAY_CLEARING`, `TENANT_PAYABLE`, `PLATFORM_REVENUE`, `GATEWAY_FEE_EXPENSE`, `PAYOUT_PENDING`, `PLATFORM_BANK`).
   - Pure Function `calculateFees()`.
   - Adapter resmi Flip for Business (Bill, Inquiry Rekening, Disbursement, Webhook Signature Token).
   - Penarikan Dana Tenant (OTP Confirmation, Single Active Account, Rekonsiliasi, Stuck Detection, Failure Locator).
2. **Spesifikasi Pendamping (`SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md`)**: Mengatur **Domain Administrasi Keuangan Pesantren (Education ERP Financial Administration)** yang menghubungkan dunia santri/wali dengan financial core platform:
   - Tagihan rutin bulanan (SPP, Asrama, Katering).
   - Tagihan kegiatan (Rihlah, Ujian, Ekstrakurikuler, Pembangunan).
   - **Unified Checkout & Multi-Allocation Engine** (Penggabungan SPP + Top-Up Uang Saku + Kegiatan dalam 1 link bayar).
   - Integrasi Dompet Digital Santri (`wallets`, `wallet_pockets`, RFID POS Kantin, Wallet Freeze).
   - Reminder pembayaran otomatis (Email Resend & WhatsApp Gateway).
   - Hak akses per peran (Superadmin, Admin Tenant, Admin Keuangan/Bendahara, Wali Santri, Santri).

---

## 2. TAKSONOMI ENTITAS & DATA MODEL

Untuk menyelesaikan konflik fundamental antara model 1 Transaksi = 1 Tagihan pada spesifikasi awal dengan kebutuhan bisnis **Unified Checkout**, arsitektur menetapkan hirarki 4 lapis yang decoupled:

```
[ WALI SANTRI CHECKOUT ]
         │
         ▼
 1. payment_orders (Order Intent & Snapshot Checkout)
         │
         ├── 2. payment_allocations (Rincian Alokasi Dana)
         │       ├── Alokasi 1: Tagihan Rutin (SPP Santri A) ───────► billing_invoices (Routine)
         │       ├── Alokasi 2: Top-Up Uang Saku (Santri A) ────────► wallets (balance_uang_saku)
         │       └── Alokasi 3: Tagihan Kegiatan (Rihlah Santri B) ─► billing_invoices (Activity)
         │
         ▼
 3. transactions (Payment Gateway Transaction — Flip Proxy Core)
         │  (amount_base = total_allocations, admin_fee = order_level_fee, flip_bill_id)
         │
         ▼ (Webhook Paid)
 4. ledger_entries (Double-Entry Posting Core Engine)
         ├── Debit:  GATEWAY_CLEARING
         ├── Kredit: TENANT_PAYABLE:{tenant_id} (Hanya untuk pos pendapatan Tenant: SPP & Rihlah)
         ├── Kredit: CUSTODIAL_WALLET_LIABILITY:{tenant_id} (Khusus Uang Saku Santri)
         ├── Kredit: PLATFORM_REVENUE (Biaya Admin SaaS)
         └── Beban:  GATEWAY_FEE_EXPENSE (Biaya Flip Gateway)
```

---

## 3. SKEMA DATABASE DRIZZLE (PROPOSAL SPESIFIKASI PENDAMPING)

Semua nominal uang menggunakan `bigint({ mode: 'number' })` untuk mematuhi **Aturan Mutlak 1** (Integer Rupiah).

### 3.1. Template Tagihan Rutin (`billing_templates`)
```typescript
export const billingTemplates = pgTable('billing_templates', {
  id: text('id').primaryKey(), // 'btpl_...'
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(), // e.g. "SPP Bulanan Jenjang Wustha"
  code: text('code').notNull(), // e.g. "SPP-WST-2026"
  category: text('category').notNull().default('spp'), // 'spp' | 'dormitory' | 'catering' | 'laundry'
  amount: bigint('amount', { mode: 'number' }).notNull(), // Rp integer
  billingCycle: text('billing_cycle').notNull().default('monthly'), // 'monthly' | 'term' | 'yearly'
  dueDay: integer('due_day').notNull().default(10), // Jatuh tempo tiap tgl 10
  targetType: text('target_type').notNull(), // 'all' | 'jenjang' | 'tingkat' | 'rombel' | 'custom'
  targetCriteria: text('target_criteria'), // JSON string: { jenjangId, tingkatId, rombelId }
  isActive: boolean('is_active').notNull().default(true),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('btpl_tenant_idx').on(table.tenantId),
  tenantCodeUnique: unique('btpl_tenant_code_idx').on(table.tenantId, table.code),
}));
```

### 3.2. Tagihan Kegiatan Santri (`activity_bills`)
```typescript
export const activityBills = pgTable('activity_bills', {
  id: text('id').primaryKey(), // 'actb_...'
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  title: text('title').notNull(), // e.g. "Rihlah Ilmiah Tarbiyyah 2026"
  code: text('code').notNull(), // e.g. "ACT-RIHLAH-2026"
  description: text('description'),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  registrationDeadline: timestamp('registration_deadline').notNull(),
  dueDate: timestamp('due_date').notNull(),
  targetCriteria: text('target_criteria'), // JSON target santri / kelas
  status: text('status').notNull().default('OPEN'), // 'OPEN' | 'CLOSED' | 'CANCELLED'
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('actb_tenant_idx').on(table.tenantId),
  tenantCodeUnique: unique('actb_tenant_code_idx').on(table.tenantId, table.code),
}));
```

### 3.3. Faktur Tagihan Terpadu (`billing_invoices`)
*Catatan: Menggantikan struktur prototype `invoices` yang lama secara terstruktur.*
```typescript
export const billingInvoices = pgTable('billing_invoices', {
  id: text('id').primaryKey(), // 'binv_...'
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull().unique(), // e.g. "INV/2026/10/DN-0001"
  santriId: text('santri_id').notNull().references(() => santri.id, { onDelete: 'cascade' }),
  waliUserId: text('wali_user_id').references(() => users.id, { onDelete: 'set null' }),
  
  billType: text('bill_type').notNull(), // 'routine' | 'activity'
  sourceTemplateId: text('source_template_id').references(() => billingTemplates.id),
  sourceActivityId: text('source_activity_id').references(() => activityBills.id),
  
  title: text('title').notNull(), // "SPP Bulan Oktober 2026 - Ahmad"
  periodMonth: text('period_month'), // "2026-10"
  amountOriginal: bigint('amount_original', { mode: 'number' }).notNull(),
  amountDiscount: bigint('amount_discount', { mode: 'number' }).notNull().default(0),
  amountFinal: bigint('amount_final', { mode: 'number' }).notNull(), // amountOriginal - amountDiscount
  
  dueDate: timestamp('due_date').notNull(),
  status: text('status').notNull().default('UNPAID'), // 'UNPAID' | 'IN_CHECKOUT' | 'PAID' | 'WAIVED' | 'CANCELLED'
  
  waivedReason: text('waived_reason'),
  waivedBy: text('waived_by'),
  waivedAt: timestamp('waived_at'),
  
  paidAt: timestamp('paid_at'),
  paymentOrderId: text('payment_order_id'), // Link ke payment order yang melunasi
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('binv_tenant_idx').on(table.tenantId),
  santriIdx: index('binv_santri_idx').on(table.santriId),
  waliIdx: index('binv_wali_idx').on(table.waliUserId),
  statusIdx: index('binv_status_idx').on(table.status),
  // Mencegah duplikasi penerbitan invoice rutin untuk santri dan periode yang sama
  uniqueRoutinePeriod: unique('binv_santri_template_period_idx').on(
    table.tenantId, table.santriId, table.sourceTemplateId, table.periodMonth
  ),
}));
```

### 3.4. Payment Orders & Multi-Allocations (Unified Checkout)
```typescript
export const paymentOrders = pgTable('payment_orders', {
  id: text('id').primaryKey(), // 'pord_...'
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  orderNumber: text('order_number').notNull().unique(), // e.g. "ORD-DN-20261019-XXXX"
  payerUserId: text('payer_user_id').notNull().references(() => users.id),
  payerName: text('payer_name').notNull(),
  payerEmail: text('payer_email').notNull(),
  payerPhone: text('payer_phone'),
  
  totalBaseAmount: bigint('total_base_amount', { mode: 'number' }).notNull(), // Jumlah total kewajiban
  adminFee: bigint('admin_fee', { mode: 'number' }).notNull(), // Biaya layanan order
  totalPayer: bigint('total_payer', { mode: 'number' }).notNull(), // totalBaseAmount + adminFee
  
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'
  expiresAt: timestamp('expires_at').notNull(),
  paidAt: timestamp('paid_at'),
  
  transactionId: text('transaction_id'), // Link ke tabel transactions Flip Proxy
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('pord_tenant_idx').on(table.tenantId),
  payerIdx: index('pord_payer_idx').on(table.payerUserId),
  statusIdx: index('pord_status_idx').on(table.status),
}));

export const paymentAllocations = pgTable('payment_allocations', {
  id: text('id').primaryKey(), // 'palo_...'
  orderId: text('order_id').notNull().references(() => paymentOrders.id, { onDelete: 'cascade' }),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  
  allocationType: text('allocation_type').notNull(), // 'INVOICE_ROUTINE' | 'INVOICE_ACTIVITY' | 'WALLET_UANG_SAKU' | 'WALLET_TABUNGAN'
  targetEntityId: text('target_entity_id').notNull(), // invoice_id atau wallet_id
  santriId: text('santri_id').notNull().references(() => santri.id),
  
  amount: bigint('amount', { mode: 'number' }).notNull(),
  title: text('title').notNull(), // Snapshot nama alokasi (e.g. "SPP Oktober 2026 - Ahmad")
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'ALLOCATED' | 'FAILED' | 'REFUNDED'
  
  allocatedAt: timestamp('allocated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  orderIdx: index('palo_order_idx').on(table.orderId),
  tenantIdx: index('palo_tenant_idx').on(table.tenantId),
  targetIdx: index('palo_target_idx').on(table.targetEntityId),
}));
```

### 3.5. Log Reminder Pengingat Pembayaran (`billing_reminder_logs`)
```typescript
export const billingReminderLogs = pgTable('billing_reminder_logs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  invoiceId: text('invoice_id').notNull().references(() => billingInvoices.id, { onDelete: 'cascade' }),
  recipientUserId: text('recipient_user_id').notNull().references(() => users.id),
  recipientChannel: text('recipient_channel').notNull(), // 'email' | 'whatsapp'
  recipientAddress: text('recipient_address').notNull(), // Masked address / phone
  reminderType: text('reminder_type').notNull(), // 'pre_due' | 'due_date' | 'overdue'
  status: text('status').notNull().default('SENT'), // 'SENT' | 'FAILED' | 'SKIPPED'
  failureReason: text('failure_reason'),
  scheduledAt: timestamp('scheduled_at').notNull(),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  invoiceIdx: index('brml_invoice_idx').on(table.invoiceId),
  uniqueInvoiceReminder: unique('brml_inv_type_channel_idx').on(
    table.invoiceId, table.reminderType, table.recipientChannel
  ),
}));
```

---

## 4. KONTRAK ALOKASI DANA & DOUBLE-ENTRY LEDGER

### Aturan Pemisahan Dana (Separation of Funds Invariant)
1. **Hak Tenant (`TENANT_PAYABLE:{tenant_id}`)**:
   - Hanya menerima kredit dari pos pendapatan operasional tenant (`INVOICE_ROUTINE` dan `INVOICE_ACTIVITY`).
   - Tenant berhak menarik saldo ini melalui mekanisme penarikan otomatis (Payouts Flip).
2. **Dana Titipan Santri (`CUSTODIAL_WALLET_LIABILITY:{tenant_id}`)**:
   - Top-up uang saku atau tabungan santri **BUKAN pendapatan tenant** dan **BUKAN pendapatan SaaS**.
   - Dana ini adalah liabilitas fidusia (titipan). Saldo masuk ke tabel `wallets.balance_uang_saku` dan mutasi `wallet_pockets`.
   - Tenant dilarang menarik dana uang saku santri ke rekening operasional yayasan.
3. **Pendapatan SaaS (`PLATFORM_REVENUE`)**:
   - Menerima biaya admin transaksi (`admin_fee`) dari checkout gabungan.
   - Menerima biaya langganan software tenant (`transactions.type = 'subscription'`).
4. **Beban Gateway (`GATEWAY_FEE_EXPENSE`)**:
   - Mencatat potongan biaya resmi Flip for Business.

### Jurnal Akuntansi Saat Webhook Paid Diterima (Contoh Kasus Mandat)
**Skenario:** Wali membayar Unified Checkout Rp853.200 (SPP Rp500.000 + Uang Saku Rp200.000 + Rihlah Rp150.000 + Biaya Admin SaaS Rp3.200). Biaya gateway Flip adalah Rp4.000.

| No | Nomor Akun | Debit (Rp) | Kredit (Rp) | Keterangan |
|---|---|---|---|---|
| 1 | `GATEWAY_CLEARING` | 853.200 | 0 | Kas masuk ke rekening Flip SaaS |
| 2 | `TENANT_PAYABLE:{tenant_id}` (Pos SPP) | 0 | 500.000 | Hak Pesantren untuk SPP |
| 3 | `TENANT_PAYABLE:{tenant_id}` (Pos Rihlah) | 0 | 150.000 | Hak Pesantren untuk Kegiatan |
| 4 | `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | 0 | 200.000 | Liabilitas titipan Uang Saku Santri |
| 5 | `PLATFORM_REVENUE` (Kategori `admin_fee`) | 0 | 3.200 | Pendapatan kotor platform SaaS |
| 6 | `GATEWAY_FEE_EXPENSE` | 4.000 | 0 | Beban gateway fee Flip |
| 7 | `GATEWAY_CLEARING` | 0 | 4.000 | Potongan saldo kas Flip oleh gateway |
| **Total** | | **857.200** | **857.200** | **BALANS SEMPURNA** |

---

## 5. STRATEGI UNIFIED CHECKOUT & PENCEGAHAN RACE CONDITION

### 5.1. Alur Pemesanan (Checkout Order Lifecycle)
1. **Pemeriksaan Hak Asuh & Tagihan**:
   - Sistem memvalidasi melalui `wali_santri_relationships` bahwa seluruh `santri_id` dalam keranjang adalah anak asuh sah dari wali yang terotentikasi.
2. **Pengecekan Status & Optimistic Lock**:
   - Seluruh invoice yang dipilih wajib berstatus `UNPAID`.
   - Status invoice sementara diubah menjadi `IN_CHECKOUT` dengan batas waktu kedaluwarsa (misalnya 60 menit) untuk mencegah invoice yang sama dimasukkan ke dua checkout paralel oleh wali lain (misal Ayah dan Ibu bersamaan).
3. **Penerbitan Payment Link Flip**:
   - Dibuat 1 baris di `payment_orders` dan 1 baris di `transactions` (Flip Proxy core).
   - Adapter Flip memanggil `/v2/pwf/bill` dengan judul generik (e.g., `Pembayaran Tagihan Terpadu - Darunnajah`) dan nominal `total_payer`.

### 5.2. Penanganan Perubahan Tagihan Saat Checkout Berjalan
Jika ada invoice yang kedaluwarsa atau dibatalkan oleh admin saat checkout masih aktif:
- Webhook Flip yang tiba setelah pembatalan akan memicu rekonsiliasi otomatis:
  - Dana untuk tagihan yang dibatalkan dialihkan secara otomatis ke deposit `wallets.balance_tabungan` santri bersangkutan disertai audit log, atau diproses refund sesuai kebijakan tenant.
  - Tagihan tidak pernah dilunasi dua kali.

---

## 6. INTEGRASI SISTEM DOMPET & WALLET FREEZE

1. **Top-Up Uang Saku**:
   - Dilakukan secara atomik saat webhook settlement sukses.
   - Mengupdate `wallets.balance_uang_saku` dan menyisipkan baris di `wallet_pockets` dengan `mutation_type = 'topup'` dan `reference_id = payment_order_id`.
2. **Dampak Wallet Freeze**:
   - Status `canteen_status` di tabel `wallets` (seperti `suspended_by_walikelas`, `suspended_by_wali`, atau `blocked`) **HANYA MEMBEKUKAN TRANSAKSI KANTIN (POS DEDUCT)**.
   - **Top-up dari wali tetap diizinkan**. Uang saku yang masuk akan aman tersimpan di saldo dompet santri dan baru bisa dibelanjakan setelah status freeze dicabut oleh pihak berwenang (Wali Kelas / Wali Santri).

---

## 7. SISTEM REMINDER PEMBAYARAN OTOMATIS

### 7.1. Konfigurasi Jadwal (Timezone Asia/Jakarta)
- **H-3 Sebelum Jatuh Tempo**: Pengingat sopan tagihan bulanan.
- **Hari H (Jatuh Tempo)**: Pengingat pembayaran jatuh tempo hari ini.
- **H+2 & H+7 Setelah Jatuh Tempo**: Pengingat tunggakan ramah santri.

### 7.2. Aturan Evaluasi Idempotensi & Kanal
- Job scheduler mengevaluasi tabel `billing_invoices` yang berstatus `UNPAID`.
- Memeriksa tabel `billing_reminder_logs`. Jika pasangan `(invoice_id, reminder_type, channel)` sudah tercatat berstatus `SENT`, reminder tidak dikirim ulang.
- Kanal Primer: **Email via Resend** (menggunakan service `resendService`).
- Kanal Sekunder: **WhatsApp Gateway** (dibatasi oleh ketersediaan integrasi pihak ketiga yang terdaftar di konfigurasi tenant).
- **Auto-Abort**: Jika status invoice telah berubah menjadi `PAID`, `WAIVED`, atau `CANCELLED`, pengiriman reminder otomatis dibatalkan.

---

## 8. MATRIKS HAK AKSES & DTO PERAN (PERAN BERBASIS RBAC)

| Data / Fitur | Superadmin | Admin Tenant / Bendahara | Wali Santri | Santri |
|---|---|---|---|---|
| Konfigurasi `fee_rules` & Simulator | Akses Penuh | Tidak Ada Akses (403) | Tidak Ada Akses | Tidak Ada Akses |
| Gateway Fee & Margin SaaS | Tampil Penuh | Dilarang Tampil (Masked) | Dilarang Tampil | Dilarang Tampil |
| Dashboard Rekonsiliasi & Flip Clearing | Akses Penuh | Dilarang Tampil | Dilarang Tampil | Dilarang Tampil |
| Penarikan Saldo Tenant (Payout) | Monitoring / Audit | Request via OTP Email | Dilarang Tampil | Dilarang Tampil |
| Pembuatan Template & Tagihan Santri | Monitoring Global | Akses Penuh (CRUD) | Tidak Ada Akses | Tidak Ada Akses |
| Pembatalan / Pembebasan Tagihan | Monitoring Global | Akses (dengan Audit Log) | Tidak Ada Akses | Tidak Ada Akses |
| Riwayat Pembayaran Tagihan | Semua Tenant | Khusus Milik Tenant | Khusus Anak Asuhnya | Khusus Milik Sendiri |
| Checkout & Pembayaran Gabungan | Tidak Ada Akses | Tidak Ada Akses | Akses Penuh (Wali) | Tidak Ada Akses |
| Top-Up Uang Saku Santri | Tidak Ada Akses | Input Manual (Cashier) | Akses Penuh via Flip | Tidak Ada Akses |
| Saldo & Mutasi Uang Saku | Monitoring Global | Monitoring Tenant | Monitoring Anak Asuh | Tampil via POS/Kantin |
| Pembekuan Belanja (Wallet Freeze) | Tidak Ada Akses | Override Wali Kelas | Kontrol Wali Santri | Tidak Ada Akses |

---

## 9. PENUTUP & KESIMPULAN DOMAIN PENDAMPING

Dokumen spesifikasi domain pendamping ini memastikan seluruh kebutuhan administrasi billing, checkout gabungan, uang saku santri, dan pengingat tagihan dapat diimplementasikan secara elegan **di atas** fondasi Flip Proxy Core yang kokoh, tanpa mengubah satu pun Aturan Mutlak 1–13 dan tanpa kebocoran data multi-tenant.
