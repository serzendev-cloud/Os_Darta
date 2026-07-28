import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';

// ── PPOB Product Categories (Token PLN, Pulsa, Paket Data, e-Money) ──────────
export const ppobCategories = pgTable('ppob_categories', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(), // e.g. 'pln_token', 'pulsa', 'paket_data', 'emoney'
  name: text('name').notNull(), // e.g. 'Token Listrik PLN', 'Pulsa HP', 'Paket Data Internet'
  iconName: text('icon_name').default('Zap').notNull(),
  status: text('status').default('active').notNull(), // 'active' | 'inactive'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── PPOB Products Catalog (Digiflazz Product List & Markup Pricing) ───────────
export const ppobProducts = pgTable('ppob_products', {
  id: text('id').primaryKey(),
  categoryCode: text('category_code').notNull(), // Link to ppobCategories.code
  buyerSkuCode: text('buyer_sku_code').notNull().unique(), // Digiflazz SKU Code e.g. 'pln20', 'tlkomsel50'
  productName: text('product_name').notNull(), // e.g. 'PLN Token Rp 20.000', 'Telkomsel Rp 50.000'
  brand: text('brand').notNull(), // e.g. 'PLN', 'TELKOMSEL', 'INDOSAT', 'XL'
  type: text('type').default('prabayar').notNull(), // 'prabayar' | 'pascabayar'
  priceBase: integer('price_base').notNull(), // Harga modal Digiflazz (Rp)
  marginFeeSaas: integer('margin_fee_saas').default(1500).notNull(), // Admin Fee Keuntungan SaaS Owner (Rp)
  priceSelling: integer('price_selling').notNull(), // Total Harga Jual Ke Wali (priceBase + marginFeeSaas)
  status: text('status').default('active').notNull(), // 'active' | 'out_of_stock' | 'disabled'
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── PPOB Wali SaaS Balances (Dompet PPOB Wali Khusus Platform SaaS Owner) ────
// Uang di dalam wallet ini murni milik SaaS Owner (dari refund gagal PPOB / deposit PPOB)
export const ppobWaliBalances = pgTable('ppob_wali_balances', {
  id: text('id').primaryKey(),
  waliId: text('wali_id').notNull().unique(),
  waliName: text('wali_name').notNull(),
  waliPhone: text('wali_phone').notNull(),
  balance: integer('balance').default(0).notNull(), // Saldo PPOB (Rp)
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── PPOB Transactions Log (Beli Token & Pulsa) ───────────────────────────────
export const ppobTransactions = pgTable('ppob_transactions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(), // ID Pesantren / Tenant
  waliId: text('wali_id').notNull(),
  santriId: text('santri_id'),
  categoryCode: text('category_code').notNull(),
  buyerSkuCode: text('buyer_sku_code').notNull(),
  productName: text('product_name').notNull(),
  customerNo: text('customer_no').notNull(), // ID Meteran PLN / Nomor HP Tujuan
  customerName: text('customer_name'), // Nama Pelanggan (untuk PLN / Pasca)
  amountBase: integer('amount_base').notNull(), // Harga Modal Digiflazz
  feeSaas: integer('fee_saas').notNull(), // Keuntungan SaaS Owner
  totalAmount: integer('total_amount').notNull(), // Total yang Dibayar Wali
  paymentMethod: text('payment_method').notNull(), // 'QRIS_SAAS' | 'SALDO_PPOB' | 'VA_SAAS'
  status: text('status').default('PENDING_PAYMENT').notNull(), 
  // 'PENDING_PAYMENT' | 'PAID_WAITING_PROVIDER' | 'SUCCESS' | 'FAILED_REFUNDED' | 'EXPIRED'
  sn: text('sn'), // Serial Number / Kode Token Listrik 20 Digit dari Digiflazz
  digiflazzRefId: text('digiflazz_ref_id'),
  saasPgRefId: text('saas_pg_ref_id'),
  qrUrl: text('qr_url'),
  failureReason: text('failure_reason'),
  refundedToBalanceAt: timestamp('refunded_to_balance_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
