import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

// ── Wallets Table (Virtual Ledger for Wali & Santri) ─────────────────────────
export const wallets = pgTable('wallets', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  waliId: text('wali_id').notNull(),
  santriId: text('santri_id').notNull(),
  balanceUangSaku: integer('balance_uang_saku').default(0).notNull(),
  balanceTabungan: integer('balance_tabungan').default(0).notNull(),
  dailyLimit: integer('daily_limit').default(20000).notNull(), // Default Rp 20.000 / hari
  canteenStatus: text('canteen_status').default('active').notNull(), // 'active' | 'requested_by_walikelas' | 'suspended_by_walikelas' | 'suspended_by_wali' | 'blocked'
  suspendedReason: text('suspended_reason'),
  suspendedBy: text('suspended_by'),
  freezeRequestedBy: text('freeze_requested_by'),
  freezeRequestedAt: timestamp('freeze_requested_at'),
  freezeReason: text('freeze_reason'),
  freezeDuration: text('freeze_duration'),
  freezeExpiresAt: timestamp('freeze_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Wallet Pockets Mutations Log ─────────────────────────────────────────────
export const walletPockets = pgTable('wallet_pockets', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  walletId: text('wallet_id').notNull(),
  pocketType: text('pocket_type').notNull(), // 'uang_saku' | 'tabungan'
  mutationType: text('mutation_type').notNull(), // 'topup' | 'canteen_deduct' | 'transfer' | 'spp_deduct'
  amount: integer('amount').notNull(),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  description: text('description').notNull(),
  referenceId: text('reference_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Bundled Invoices (SPP + Top-Up Uang Saku & Tabungan) ──────────────────────
export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  waliId: text('wali_id').notNull(),
  santriId: text('santri_id').notNull(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  amountSpp: integer('amount_spp').default(0).notNull(),
  amountUangSaku: integer('amount_uang_saku').default(0).notNull(),
  amountTabungan: integer('amount_tabungan').default(0).notNull(),
  totalAmount: integer('total_amount').notNull(),
  sppMonthPeriod: text('spp_month_period'), // e.g. "Juli 2026"
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'SUCCESS' | 'EXPIRED' | 'CANCELLED'
  flipBillId: text('flip_bill_id'),
  flipPaymentUrl: text('flip_payment_url'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Canteens / Vendors Table (Multi-Kantin per Pesantren) ────────────────────
export const canteens = pgTable('canteens', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(), // e.g. "Kantin Utama", "Kantin Asrama Putra", "Koperasi"
  code: text('code').notNull(), // e.g. "KNT-01"
  location: text('location').notNull(), // e.g. "Gedung Utama Lt. 1"
  cashierUserId: text('cashier_user_id'),
  status: text('status').default('active').notNull(), // 'active' | 'inactive'
  operatingHours: text('operating_hours').default('06:00 - 17:00').notNull(),
  receiptFooter: text('receipt_footer').default('Terima kasih telah berbelanja di Pesantren').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Canteen Item Catalog & Price List per Canteen ────────────────────────────
export const canteenItems = pgTable('canteen_items', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  canteenId: text('canteen_id').notNull(), // Link to specific canteen
  name: text('name').notNull(), // e.g. "Nasi Goreng Spesial"
  code: text('code'), // e.g. "MKN-001"
  category: text('category').default('makanan').notNull(), // 'makanan' | 'minuman' | 'snack' | 'alat_tulis'
  price: integer('price').notNull(), // Harga barang di kantin ini (Rp)
  stock: integer('stock').default(100).notNull(),
  status: text('status').default('active').notNull(), // 'active' | 'out_of_stock'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Canteen Internal Transactions Log ────────────────────────────────────────
export const canteenTransactions = pgTable('canteen_transactions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  canteenId: text('canteen_id'),
  santriId: text('santri_id').notNull(),
  santriName: text('santri_name').notNull(),
  cardUid: text('card_uid').notNull(),
  amount: integer('amount').notNull(),
  itemsDescription: text('items_description'),
  vendorName: text('vendor_name').default('Kantin Utama').notNull(),
  posCashierId: text('pos_cashier_id'),
  status: text('status').default('SUCCESS').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
