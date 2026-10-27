import { pgTable, text, integer, boolean, timestamp, jsonb, varchar } from 'drizzle-orm/pg-core';

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
  walletCode: text('wallet_code'),
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
  idempotencyKey: text('idempotency_key'),
  requestHash: varchar('request_hash', { length: 64 }),
  responsePayload: jsonb('response_payload'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Canteen Transaction Items (POS Structured Snapshot) ──────────────────────
export const canteenTransactionItems = pgTable('canteen_transaction_items', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  transactionId: text('transaction_id').notNull(),
  itemId: text('item_id'),
  itemName: text('item_name').notNull(),
  unitPrice: integer('unit_price').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  discount: integer('discount').default(0).notNull(),
  subtotal: integer('subtotal').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Financial Audit Logs (Append-Only Immutable Ledger) ───────────────────────
export const financialAuditLogs = pgTable('financial_audit_logs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  correlationId: text('correlation_id').notNull(),
  actorId: text('actor_id').notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(), // 'admin_keuangan' | 'pic_kantin' | 'kasir' | 'wali_kelas' | 'santri' | 'system'
  action: text('action').notNull(), // 'CANTEEN_PAYMENT' | 'REFUND_REQUEST' | 'REFUND_APPROVED' | 'REFUND_REJECTED' | 'ADJUSTMENT' | 'RECONCILIATION_RUN' | 'ANOMALY_FLAGGED'
  targetEntity: text('target_entity').notNull(), // 'canteen_transaction' | 'wallet' | 'merchant' | 'canteen_refund' | 'reconciliation'
  targetId: text('target_id').notNull(),
  amount: integer('amount').default(0).notNull(),
  stateBefore: jsonb('state_before'),
  stateAfter: jsonb('state_after'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  status: text('status').default('SUCCESS').notNull(), // 'SUCCESS' | 'FAILED' | 'REVERTED'
  metadata: jsonb('metadata'), // Strictly sanitized: never contains PIN, password, or secrets
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Merchant Ledger (Hak Pendapatan Merchant & Central Escrow) ───────────────
export const merchantLedger = pgTable('merchant_ledger', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  canteenId: text('canteen_id').notNull(),
  entryType: text('entry_type').notNull(), // 'CREDIT_SALE' | 'DEBIT_REFUND' | 'DEBIT_WITHDRAWAL' | 'ADJUSTMENT'
  amount: integer('amount').notNull(),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  referenceType: text('reference_type').notNull(), // 'canteen_transaction' | 'canteen_refund' | 'merchant_payout' | 'adjustment'
  referenceId: text('reference_id').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Canteen Refunds (Phase 1 Admin Approval Workflow) ────────────────────────
export const canteenRefunds = pgTable('canteen_refunds', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  transactionId: text('transaction_id').notNull(),
  canteenId: text('canteen_id').notNull(),
  santriId: text('santri_id').notNull(),
  originalAmount: integer('original_amount').notNull(),
  refundAmount: integer('refund_amount').notNull(),
  reason: text('reason').notNull(),
  status: text('status').default('PENDING_APPROVAL').notNull(), // 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  requestedBy: text('requested_by').notNull(), // PIC / Staf Kantin userId
  requestedByName: text('requested_by_name').notNull(),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  reviewedBy: text('reviewed_by'), // Admin Keuangan userId
  reviewedByName: text('reviewed_by_name'),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  processedTransactionId: text('processed_transaction_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Financial Reconciliation Runs ────────────────────────────────────────────
export const financialReconciliationRuns = pgTable('financial_reconciliation_runs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  runType: text('run_type').default('AUTOMATED').notNull(), // 'AUTOMATED' | 'MANUAL'
  triggeredBy: text('triggered_by').notNull(),
  status: text('status').default('COMPLETED').notNull(), // 'COMPLETED' | 'DISCREPANCY_DETECTED' | 'FAILED'
  totalTransactionsChecked: integer('total_transactions_checked').default(0).notNull(),
  totalAmountChecked: integer('total_amount_checked').default(0).notNull(),
  discrepanciesCount: integer('discrepancies_count').default(0).notNull(),
  summary: jsonb('summary'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// ── Financial Anomalies & Investigation Cases ────────────────────────────────
export const financialAnomalies = pgTable('financial_anomalies', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  reconciliationRunId: text('reconciliation_run_id'),
  anomalyType: text('anomaly_type').notNull(), // 'WALLET_TRANSACTION_MISMATCH' | 'DUPLICATE_SUSPICION' | 'NEGATIVE_BALANCE_ATTEMPT' | 'UNAUTHORIZED_REFUND_ATTEMPT' | 'ORPHAN_MERCHANT_CREDIT' | 'MERCHANT_HAK_MISMATCH'
  severity: text('severity').default('HIGH').notNull(), // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  status: text('status').default('OPEN').notNull(), // 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'FALSE_POSITIVE'
  relatedEntityType: text('related_entity_type').notNull(),
  relatedEntityId: text('related_entity_id').notNull(),
  discrepancyAmount: integer('discrepancy_amount').default(0).notNull(),
  description: text('description').notNull(),
  resolutionNotes: text('resolution_notes'),
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── SPP Bills (Tagihan Pokok SPP Santri) ──────────────────────────────────────
export const sppBills = pgTable('spp_bills', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  santriId: text('santri_id').notNull(),
  santriName: text('santri_name').notNull(),
  waliId: text('wali_id').notNull(),
  billNumber: text('bill_number').notNull().unique(),
  title: text('title'), // Optional custom title e.g. "Ujian Akhir Semester Ganjil 2026/2027"
  campaignId: text('campaign_id'), // Link to billingCampaigns.id if batch/additional bill
  category: text('category').default('SPP').notNull(), // 'SPP' | 'UJIAN' | 'KEGIATAN' | 'SERAGAM' | 'DAFTAR_ULANG' | 'LAINNYA'
  allowInstallments: boolean('allow_installments').default(true).notNull(),
  periodMonthYear: text('period_month_year').notNull(), // e.g. "Juli 2026"
  billType: text('bill_type').default('SPP_BULANAN').notNull(),
  totalAmount: integer('total_amount').notNull(),
  paidAmount: integer('paid_amount').default(0).notNull(),
  remainingAmount: integer('remaining_amount').notNull(),
  dueDate: timestamp('due_date').notNull(),
  status: text('status').default('UNPAID').notNull(), // 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED'
  activePlanId: text('active_plan_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── SPP Installment Plans (Pengajuan Rencana Cicilan) ─────────────────────────
export const sppInstallmentPlans = pgTable('spp_installment_plans', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  billId: text('bill_id').notNull(),
  santriId: text('santri_id').notNull(),
  waliId: text('wali_id').notNull(),
  requestedInstallmentsCount: integer('requested_installments_count').notNull(),
  requestedAmountPerInstallment: integer('requested_amount_per_installment').notNull(),
  reason: text('reason'),
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  reviewedBy: text('reviewed_by'),
  reviewedByName: text('reviewed_by_name'),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── SPP Installment Schedules (Butir Jadwal Cicilan yang Disetujui) ───────────
export const sppInstallmentSchedules = pgTable('spp_installment_schedules', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  planId: text('plan_id').notNull(),
  billId: text('bill_id').notNull(),
  installmentNumber: integer('installment_number').notNull(),
  dueDate: timestamp('due_date').notNull(),
  amountDue: integer('amount_due').notNull(),
  amountPaid: integer('amount_paid').default(0).notNull(),
  status: text('status').default('PENDING').notNull(), // 'PENDING' | 'PAID' | 'OVERDUE'
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── SPP Payments (Pencatatan Pembayaran Riil Append-Only) ─────────────────────
export const sppPayments = pgTable('spp_payments', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  billId: text('bill_id').notNull(),
  scheduleId: text('schedule_id'),
  paymentNumber: text('payment_number').notNull().unique(),
  amount: integer('amount').notNull(),
  paymentMethod: text('payment_method').default('TRANSFER_MANUAL').notNull(), // 'TRANSFER_MANUAL' | 'KASIR_TUNAI' | 'PAYMENT_GATEWAY'
  verifiedBy: text('verified_by').notNull(),
  verifiedByName: text('verified_by_name').notNull(),
  verifiedAt: timestamp('verified_at').defaultNow().notNull(),
  idempotencyKey: text('idempotency_key').unique(),
  status: text('status').default('SUCCESS').notNull(), // 'SUCCESS' | 'REVERTED'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── SPP Configurations (Konfigurasi Tarif & Aturan SPP Bulanan) ──────────────
export const sppConfigurations = pgTable('spp_configurations', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  name: text('name').notNull(), // e.g. "Tarif SPP Standar 2026/2027"
  amount: integer('amount').notNull(), // e.g. 1000000
  billingDay: integer('billing_day').default(1).notNull(), // Tanggal 1 setiap bulan
  dueDay: integer('due_day').default(10).notNull(), // Tanggal 10 setiap bulan
  academicYear: text('academic_year'), // e.g. "2026/2027"
  targetScope: text('target_scope').default('ALL_ACTIVE').notNull(), // 'ALL_ACTIVE' | 'JENJANG' | 'TINGKAT' | 'ROMBEL'
  targetScopeId: text('target_scope_id'),
  effectiveFrom: timestamp('effective_from').notNull(),
  effectiveTo: timestamp('effective_to'),
  status: text('status').default('ACTIVE').notNull(), // 'ACTIVE' | 'INACTIVE'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Billing Campaigns (Master Penerbitan Tagihan Tambahan / Non-SPP) ─────────
export const billingCampaigns = pgTable('billing_campaigns', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  title: text('title').notNull(), // e.g. "Biaya Ujian Akhir Semester Ganjil"
  category: text('category').notNull(), // 'UJIAN' | 'KEGIATAN' | 'SERAGAM' | 'DAFTAR_ULANG' | 'LAINNYA'
  description: text('description'),
  academicYear: text('academic_year'),
  amountPerStudent: integer('amount_per_student').notNull(),
  publishDate: timestamp('publish_date').notNull(),
  dueDate: timestamp('due_date').notNull(),
  targetType: text('target_type').default('ALL_ACTIVE').notNull(), // 'ALL_ACTIVE' | 'KELAS' | 'CUSTOM_SANTRI'
  targetFilter: text('target_filter'), // JSON string kelas atau array santriId
  allowInstallments: boolean('allow_installments').default(false).notNull(),
  totalTargetSantri: integer('total_target_santri').default(0).notNull(),
  totalAmount: integer('total_amount').default(0).notNull(),
  status: text('status').default('PUBLISHED').notNull(), // 'DRAFT' | 'PUBLISHED' | 'CANCELLED'
  publishedBy: text('published_by').notNull(),
  publishedByName: text('published_by_name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

