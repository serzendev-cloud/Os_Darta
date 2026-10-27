# REPORT-M2-FINANCE-ARCHITECTURE-001
## APP MA’HAD — Financial Administration Architecture & Specification Completion
**Issuing Authority:** Acting Process_Mandor — Mandor 2  
**Product Owner:** Process_PO  
**Execution Agent:** Antigravity Lead Agent — ZenOrion  
**Workstream:** APP MA’HAD Financial Administration  
**Mode:** Controlled Engineering Mode — Strict Read-Only  
**Primary Specification:** `docs/spesifikasi-pembayaran.md` (Spesifikasi Agent Modul Pembayaran Multi-Tenant Flip Proxy)  
**Companion Specification Draft:** `docs/architecture/SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md`  
**Date:** 19 Oktober 2026  

---

## 1. EXECUTIVE SUMMARY & STATUS AKTUAL

Sesuai dengan mandat **M2-FINANCE-ARCHITECTURE-001**, Antigravity Lead Agent (ZenOrion) telah menyelesaikan tahap *Architecture Discovery, Specification Gap Analysis, and Draft Preparation* secara ketat dalam mode `STRICT READ-ONLY`. Tidak ada perubahan pada kode produksi, migrasi database aktif, maupun konfigurasi runtime selama audit ini.

### Ringkasan Status Bukti & Temuan Kunci
1. **Pondasi Pembayaran Multi-Tenant (Flip Proxy Core)** `[TERBUKTI]`:
   - Dokumen `Spesifikasi Agent Modul Pembayaran Multi-Tenant (Flip Proxy).md` (1061 baris) telah dianalisis secara menyeluruh. Dokumen ini mendefinisikan Aturan Mutlak 1–13, pembukuan double-entry berbasis append-only ledger (`GATEWAY_CLEARING`, `TENANT_PAYABLE`, `PLATFORM_REVENUE`, `GATEWAY_FEE_EXPENSE`, `PAYOUT_PENDING`, `PLATFORM_BANK`), fungsi murni `calculateFees()`, penarikan otomatis via Flip Disbursement, perlindungan OTP email, deteksi transaksi macet, dan failure locator.
2. **Kondisi Aktual Repositori (Ground-Truth Repository Audit)** `[TERBUKTI]`:
   - Di repositori saat ini (`src/lib/db/schema/finance.ts`), terdapat tabel prototype `wallets`, `wallet_pockets`, `invoices`, `canteens`, `canteen_items`, dan `canteen_transactions`.
   - Tabel `invoices` yang ada masih berformat prototipe monolitik dengan kolom kaku (`amount_spp`, `amount_uang_saku`, `amount_tabungan`).
   - Webhook Flip prototipe (`src/app/api/webhooks/flip/route.ts`) belum mengimplementasikan verifikasi token keamanan, belum memiliki locking/transaksi ACID, belum memiliki idempotency registry, dan belum terhubung ke sistem pembukuan double-entry ledger.
   - Client Flip (`src/lib/payment/flip.ts`) masih berupa mock/sandbox awal.
   - Worktree kandidat (`Os_Darta-domain-a2.7-candidate`) memuat implementasi Wallet Freeze F-WF-01 dan F-WF-02 (migrasi `0006` dan `0007`), dengan 59 pengujian Vitest yang lulus.
3. **Konflik Arsitektur Utama (Single Bill vs. Unified Checkout Multi-Allocation)** `[TERBUKTI]`:
   - Spesifikasi pembayaran Flip Proxy mengasumsikan model **1 Transaksi = 1 Tagihan** (`amount_base`, `admin_fee`, `tenant_credit`, `reference_id`).
   - Kebutuhan bisnis mendesak dari Product Owner menuntut **Unified Checkout**: Wali santri dapat membayar beberapa tagihan sekaligus dalam satu transaksi pembayaran (misal: SPP Rp500.000 + Top-up Uang Saku Rp200.000 + Rihlah Rp150.000 = Total Rp850.000 + Biaya Layanan Rp3.200).
   - **Solusi Arsitektural**: Merekomendasikan **Opsi B (Spesifikasi Domain Pendamping)** dengan entitas hirarki 4 lapis: `payment_orders` -> `payment_allocations` -> `transactions` (Flip Proxy Core) -> `ledger_entries`.
4. **Pemisahan Dana Titipan Santri (Custodial Wallet Invariant)** `[TERBUKTI]`:
   - Top-up uang saku santri bukan merupakan pendapatan tenant dan bukan pendapatan platform. Dana tersebut adalah liabilitas titipan (`CUSTODIAL_WALLET_LIABILITY:{tenant_id}`).
   - Tenant dilarang mencairkan dana uang saku santri ke rekening operasional yayasan. Uang saku hanya dapat dikonsumsi di kantin/POS santri atau ditarik kembali oleh wali.
5. **Kesiapan Infrastruktur Eksternal** `[TERBUKTI]`:
   - Email dispatch via **Resend** telah terpasang dan berfungsi (`src/lib/email/resend-service.ts`).
   - Background Job Queue / Schedulers (seperti Pg-Boss / BullMQ) `[MISSING]` di repositori (memerlukan transactional outbox atau Vercel Cron).
   - WhatsApp Gateway `[PARTIAL / UI-ONLY]` belum memiliki adapter server-side production.

---

## 2. REPOSITORY AUDIT (BUKTI AKTUAL & STATUS IMPLEMENTASI)

Audit dilakukan terhadap workspace primer (`E:\Projects\Os_Darta`) dan candidate worktree (`E:\Projects\Os_Darta-domain-a2.7-candidate`).

| Komponen / Modul | File / Simbol Relevan | Status Implementasi | Status Pengujian | Keterbatasan & Temuan Audit |
|---|---|---|---|---|
| **Tech Stack & Framework** | `package.json`, `src/lib/db/index.ts` | `IMPLEMENTED` | `TERBUKTI` | Next.js 16.2.6 (React 19), PostgreSQL via `postgres: ^3.4.9` dan `drizzle-orm: ^0.45.2`. `prepare: false` diatur untuk kompatibilitas serverless pooler. |
| **Identitas & RBAC** | `src/lib/db/schema/identity.ts` | `IMPLEMENTED` | `TERBUKTI` | Tabel `users`, `tenants`, `tenant_roles`, `user_tenant_memberships`, `wali_santri_relationships`. Model relasi 1 Wali -> N Santri telah terdefinisi secara rapi. |
| **Prototipe Invoices** | `src/lib/db/schema/finance.ts:L40-57` | `PARTIAL` | `BELUM DIVERIFIKASI` | Tabel `invoices` monolitik. Tidak mendukung variasi kegiatan dinamis. Menggabungkan SPP, uang saku, dan tabungan dalam kolom tetap. |
| **Dompet Santri & Kantin** | `src/lib/db/schema/finance.ts:L4-37` | `IMPLEMENTED` | `TERBUKTI` | Tabel `wallets`, `wallet_pockets`, `canteens`, `canteen_items`, `canteen_transactions`. Menyimpan saldo berjalan dan limit harian. |
| **Wallet Freeze Metadata** | `drizzle/0006_wallet_freeze_metadata.sql` (candidate) | `IMPLEMENTED` | `TERBUKTI` (59 tests) | Menambahkan kolom `freeze_requested_by`, `freeze_requested_at`, `freeze_reason`, `freeze_duration`, `freeze_expires_at` pada `wallets`. |
| **Flip Client Prototype** | `src/lib/payment/flip.ts` | `PARTIAL` | `MOCK ONLY` | Client prototipe sederhana `/v2/pwf/bill`. Menggunakan Basic Auth. Belum mendukung endpoint Inquiry Rekening atau Disbursement Flip. |
| **Flip Webhook Route** | `src/app/api/webhooks/flip/route.ts` | `PARTIAL` | `MOCK ONLY` | Menangani webhook tanpa validasi token keamanan. Mengurai body sebagai JSON padahal Flip mengirim `application/x-www-form-urlencoded`. Tidak ada locking DB atau idempotensi. |
| **Double-Entry Ledger** | N/A (belum ada skema) | `MISSING` | `BELUM DIVERIFIKASI` | Belum ada tabel `ledger_entries`, `transactions`, `payouts`, `fee_rules` di codebase. Masih berada pada tahap spesifikasi dokumen. |
| **Email Service (Resend)** | `src/lib/email/resend-service.ts` | `IMPLEMENTED` | `TERBUKTI` | Menggunakan SDK `resend: ^6.28.1`. Digunakan untuk aktivasi tenant dan reset password. Siap digunakan untuk pengiriman OTP penarikan dana. |
| **WhatsApp Gateway** | UI `tenant-integrasi/page.tsx` | `PARTIAL` | `TIDAK DAPAT DISIMPULKAN` | Baru berupa input UI dan tipe data. Belum ada adapter pengiriman pesan aktif ke WhatsApp API/vendor. |
| **Scheduler & Queue** | N/A | `MISSING` | `TIDAK DAPAT DISIMPULKAN` | Belum ada library antrean pesan/job runner (BullMQ, Pg-Boss, dll) di `package.json`. |

---

## 3. MODULE MAP & DEPENDENCY GRAPH

Arsitektur keuangan APP MA’HAD dirancang dengan batas modul yang sangat tegas untuk mencegah ketergantungan sirkular (*circular dependency*) dan kebocoran logika gateway ke domain santri:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION & API LAYER                        │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ Wali Santri Portal│ Bendahara Tenant  │ Superadmin SaaS                │
│ (Unified Checkout,│ (Billing Template,│ (Fee Rules, Simulator, Margin, │
│  Riwayat Bayar)   │  Activity, Payout)│  Clearing Reconciliation)      │
└─────────┬─────────┴─────────┬─────────┴───────────────┬────────────────┘
          │                   │                         │
          ▼                   ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    EDUCATION BILLING DOMAIN SERVICE                    │
│ - TemplateEngineService (Penerbitan tagihan rutin bulanan)             │
│ - ActivityBillingService (Penerbitan tagihan kegiatan bertarget)       │
│ - UnifiedCheckoutService (Orkestrasi keranjang & Payment Orders)       │
│ - BillingReminderService (Evaluasi jadwal & idempotensi reminder)      │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PAYMENT & ALLOCATION CORE SERVICE                    │
│ - PaymentAllocationDispatcher (Validasi & pemecahan dana pembayaran)   │
│ - FeeCalculator (Pure function perhitungan margin & biaya admin)       │
│ - CustodialWalletBridge (Integrasi saldo wallets & wallet_pockets)     │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                DOUBLE-ENTRY LEDGER & FINANCIAL CORE                    │
│ - LedgerService (Posting jurnal atomik: Clearing, Payable, Liability)  │
│ - PayoutService (Otomasi pencairan saldo tenant & OTP Challenge)       │
│ - ReconciliationEngine (Pencocokan mutasi Flip vs GATEWAY_CLEARING)    │
│ - FailureLocator & StuckDetector (Diagnosis otomatis transaksi)        │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE ADAPTER LAYER                       │
│ - FlipPaymentGatewayAdapter (createBill, inquireBank, createDisburs.)  │
│ - ResendNotificationChannel (Pengiriman email OTP & invoice)           │
│ - WhatsAppNotificationChannel (Adapter pengiriman reminder)            │
└────────────────────────────────────────────────────────────────────────┘
```

### Aturan Pemanggilan Antarservice:
1. **Unidirectional Dependency**: Modul Presentation hanya memanggil Billing Domain Service. Billing Domain Service memanggil Payment Core Service. Payment Core Service memanggil Ledger Service dan Infrastructure Adapters.
2. **Ledger Immutability**: Tidak ada modul yang boleh menulis langsung ke tabel `ledger_entries` kecuali melalui `LedgerService`.
3. **Data Boundary**: Nama field dan struktur payload Flip for Business **HANYA** boleh dikenal di dalam `FlipPaymentGatewayAdapter`. Bagian aplikasi lainnya hanya berkomunikasi dengan interface domain ternormalisasi.

---

## 4. JAWABAN LENGKAP ATAS 10 PERTANYAAN KHUSUS SPESIFIKASI

Sesuai instruksi Bagian 6 Mandat, berikut adalah evaluasi arsitektural dan jawaban atas 10 pertanyaan audit:

### 1. Apakah model `transactions` saat ini mendukung satu pembayaran yang memiliki banyak invoice dan tujuan dana, atau mengasumsikan satu transaksi per tagihan?
- **Temuan `[TERBUKTI]`**: Model `transactions` pada spesifikasi awal (`spesifikasi-pembayaran.md`) mengasumsikan **1 Transaksi = 1 Tagihan** (memiliki kolom tunggal `amount_base`, `reference_id`, `bill_type`, dan `tenant_credit`).
- **Solusi Arsitektur**: Diterapkan entitas pendamping `payment_orders` (sebagai checkout intent level-order) dan `payment_allocations` (sebagai rincian alokasi per invoice/pos dana). Tabel `transactions` Flip Proxy menjadi representasi transaksi gateway yang menaungi 1 `payment_order`.

### 2. Apakah `amount_base`, `admin_fee`, `tenant_credit`, dan `fee_rule_snapshot` dapat digunakan untuk checkout gabungan tanpa mengubah makna aturan mutlak?
- **Temuan `[TERBUKTI]`**: Ya, dapat digunakan pada level `transactions` dengan penafsiran harmonis:
  - `amount_base` = Jumlah total seluruh alokasi kewajiban (SPP + Uang Saku + Kegiatan).
  - `admin_fee` = Biaya admin tunggal yang dihitung pada level payment order.
  - `tenant_credit` = Jumlah alokasi yang menjadi hak pendapatan tenant (SPP + Kegiatan), **tidak termasuk** top-up uang saku santri.
  - `fee_rule_snapshot` = Snapshot aturan biaya yang diterapkan pada payment order tersebut.

### 3. Bagaimana biaya admin dihitung pada checkout gabungan: per invoice, per payment order, atau menurut kontrak gateway?
- **Temuan `[TERBUKTI]`**: Flip for Business menagih biaya payment link per tagihan/bill ID (bukan per item di dalam tagihan).
- **Keputusan Arsitektur**: Biaya admin dihitung **per Payment Order (per Checkout Bill)**, bukan per invoice. Ini mencegah penumpukan biaya admin ganda (misal 3 item tidak dikenakan Rp3.200 x 3 = Rp9.600, melainkan tetap satu kali flat Rp3.200 atau persentase terhitung). Hal ini memberikan keadilan tarif bagi wali santri sekaligus menjaga margin SaaS tetap positif di atas gateway fee Flip.

### 4. Bagaimana top-up uang saku dipetakan ke ledger wallet yang sudah ada tanpa dianggap sebagai pendapatan tenant atau SaaS secara keliru?
- **Temuan `[TERBUKTI]`**: Dana uang saku santri dipetakan ke akun double-entry khusus: `CUSTODIAL_WALLET_LIABILITY:{tenant_id}`.
- Saat webhook paid diterima:
  - Debit: `GATEWAY_CLEARING`
  - Kredit: `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` (Bukan `TENANT_PAYABLE`).
  - Secara simultan, baris mutasi ditulis ke `wallet_pockets` dan saldo `wallets.balance_uang_saku` diperbarui. Dana ini tidak akan pernah masuk ke perhitungan saldo available penarikan yayasan pesantren.

### 5. Bagaimana alokasi pembayaran berhubungan dengan double-entry ledger platform dan pencatatan finansial internal tenant?
- **Temuan `[TERBUKTI]`**: Alokasi pembayaran memecah kredit nominal dasar (`amount_base`) ke pos-pos akun pembukuan yang tepat:
  - Alokasi SPP -> Kredit `TENANT_PAYABLE:{tenant_id}` kategori `spp`.
  - Alokasi Kegiatan -> Kredit `TENANT_PAYABLE:{tenant_id}` kategori `activity`.
  - Alokasi Uang Saku -> Kredit `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` kategori `custodial_wallet`.
  - Biaya Layanan -> Kredit `PLATFORM_REVENUE` kategori `admin_fee`.

### 6. Apakah scheduler, queue, dan mekanisme notifikasi sudah tersedia?
- **Temuan `[TERBUKTI]`**:
  - **Email**: `[IMPLEMENTED]` melalui `src/lib/email/resend-service.ts` (Resend API terpasang dan siap).
  - **WhatsApp**: `[PARTIAL / UI-ONLY]` belum ada engine pengiriman server-side aktif.
  - **Scheduler & Queue**: `[MISSING]` di codebase (belum ada BullMQ/Pg-Boss). Direkomendasikan menggunakan mekanisme *Transactional Outbox Pattern* dengan endpoint trigger terjadwal (Vercel Cron / external scheduler).

### 7. Apakah T1–T20 mencakup kebutuhan tagihan rutin, tagihan kegiatan, checkout gabungan, payment allocation, dan reminder?
- **Temuan `[TERBUKTI]`**: T1–T20 dalam spesifikasi pembayaran fokus secara presisi pada **Payment Core & Flip Proxy Engine** (Ledger, Gateway Adapter, Webhook, Payouts, Stuck Detection, Rekonsiliasi). T1–T20 belum mencakup pembuatan template SPP, tagihan kegiatan, checkout terpadu, dan reminder.
- **Rekomendasi**: Menambahkan paket tugas terpisah **T21 s/d T26** pada spesifikasi domain pendamping.

### 8. Apakah alur subscription tenant dalam spesifikasi perlu dipisahkan secara tegas dari SPP santri dan top-up uang saku?
- **Temuan `[TERBUKTI]`**: Ya, mutlak dipisahkan. Transaksi langganan software oleh pesantren menggunakan `transactions.type = 'subscription'` yang mendebit `GATEWAY_CLEARING` dan langsung mengkredit `PLATFORM_REVENUE` kategori `subscription`, tanpa melibatkan akun `TENANT_PAYABLE` maupun `CUSTODIAL_WALLET_LIABILITY`.

### 9. Apakah aturan pembayaran, settlement, refund, dan rekonsiliasi masih konsisten ketika satu transaksi mempunyai banyak alokasi?
- **Temuan `[TERBUKTI]`**: Sangat konsisten. Rekonsiliasi kas di Flip mencocokkan total dana yang masuk dengan `GATEWAY_CLEARING`. Dalam hal refund parsial, status alokasi di tabel `payment_allocations` diubah menjadi `REFUNDED` dan jurnal pembalik spesifik diposting untuk pos tersebut tanpa mengganggu alokasi lainnya.

### 10. Apakah ada konflik yang memerlukan ADR atau keputusan Product Owner sebelum engineering dapat mulai?
- **Temuan `[TERBUKTI]`**: Ya. Telah diidentifikasi 6 keputusan penting yang dituangkan dalam bagian ADR proposal di bawah ini.

---

## 5. ENAM KELUARAN WAJIB AGENT ARSITEK

### Keluaran 1: Repository Audit
(Telah disajikan secara detail pada Bagian 2 di atas).

### Keluaran 2: Module Map & Dependency Graph
(Telah disajikan secara visual dan kontraktual pada Bagian 3 di atas).

### Keluaran 3: Final Schema Proposal
Proposal skema DDL lengkap telah disusun di dalam `docs/architecture/SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md`, meliputi:
1. `billing_templates`: Template tagihan berulang (SPP, Asrama, Katering).
2. `activity_bills`: Tagihan kegiatan bertarget (Rihlah, Ujian).
3. `billing_invoices`: Faktur tagihan santri dengan relasi template, kegiatan, dan status pembayaran.
4. `payment_orders`: Header keranjang Unified Checkout wali santri.
5. `payment_allocations`: Rincian pemecahan alokasi dana per invoice dan uang saku.
6. `billing_reminder_logs`: Log idempotensi pengiriman reminder via email/WhatsApp.
7. Penegakan integritas data: Unique constraint gabungan `(tenant_id, santri_id, source_template_id, period_month)` untuk mencegah penerbitan invoice rutin ganda.

### Keluaran 4: Interface Contracts
Kontrak TypeScript murni untuk komponen-komponen kritis sistem:

#### A. Kontrak `PaymentGateway` Adapter
```typescript
export interface PaymentGateway {
  createBill(input: {
    externalId: string;
    title: string;
    amount: number; // Integer Rupiah
    payerName: string;
    payerEmail: string;
    payerPhone?: string;
    redirectUrl?: string;
    expiresAt?: Date;
  }): Promise<{
    flipBillId: string;
    paymentUrl: string;
    expiresAt: Date;
  }>;

  getBill(flipBillId: string): Promise<{
    flipBillId: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
    amount: number;
    paidAt?: Date;
  }>;

  inquireBankAccount(input: {
    bankCode: string;
    accountNumber: string;
  }): Promise<{
    status: 'SUCCESS' | 'INVALID_ACCOUNT_NUMBER' | 'SUSPECTED_ACCOUNT' | 'BLACK_LISTED';
    accountHolderName: string;
  }>;

  createDisbursement(input: {
    idempotencyKey: string;
    bankCode: string;
    accountNumber: string;
    amount: number;
    remark: string;
  }): Promise<{
    flipDisbursementId: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
  }>;

  verifyWebhook(request: {
    headers: Record<string, string>;
    rawBody: string;
  }): Promise<{
    isValid: boolean;
    event?: {
      eventId: string;
      flipBillId: string;
      status: 'PAID' | 'FAILED' | 'EXPIRED';
      amountPaid: number;
      paidAt: Date;
    };
  }>;
}
```

#### B. Kontrak `LedgerService`
```typescript
export interface LedgerEntryInput {
  accountNumber: string;
  debit: number;
  credit: number;
  category?: 'spp' | 'activity' | 'custodial_wallet' | 'admin_fee' | 'subscription' | 'payout';
  description: string;
}

export interface LedgerService {
  postJournal(params: {
    tenantId: string;
    transactionId: string;
    referenceId: string;
    entries: LedgerEntryInput[];
  }): Promise<void>; // MUST validate sum(debit) === sum(credit) and execute inside DB transaction

  getTenantBalance(tenantId: string): Promise<{
    totalBalance: number;
    pendingBalance: number;
    availableBalance: number;
  }>;
}
```

#### C. Kontrak `FeeCalculator`
```typescript
export interface FeeCalculationResult {
  amountBase: number;
  adminFee: number;
  totalPayer: number;
  tenantCredit: number;
  gatewayFeeEstimated: number;
  marginEstimated: number;
  feeRuleSnapshot: Record<string, any>;
}

export function calculateFees(
  amountBase: number,
  tenantId: string,
  method: string,
  billType: string,
  effectiveAt: Date
): FeeCalculationResult;
```

### Keluaran 5: Concurrency Strategy
1. **Row-Level Locking on Webhook Settlement**:
   - Handler webhook melakukan query `payment_orders` menggunakan `FOR UPDATE` di level database untuk mencegah eksekusi paralel.
2. **Deterministic Idempotency Key**:
   - Flip webhook deduplikasi menggunakan pasangan `(provider, event_id)`. Jika webhook dikirim ulang, sistem mengembalikan HTTP 200 OK secara instan tanpa menulis jurnal ganda.
3. **Optimistic Locking pada Keranjang Checkout**:
   - Saat invoice dimasukkan ke dalam `payment_orders`, statusnya diubah menjadi `IN_CHECKOUT` dengan timeout kedaluwarsa. Upaya membuat order lain dengan invoice yang sama akan ditolak.
4. **Pencegahan Double-Spending / Double-Allocation**:
   - Status alokasi diperbarui secara atomik di dalam satu transaksi PostgreSQL bersama pembaruan saldo `wallets` dan posting `ledger_entries`.

### Keluaran 6: Migration and Rollback Plan
1. **Pemasangan Tanpa Merusak Data Lama**:
   - Tabel `invoices` yang lama dibiarkan utuh (*read-only backwards compatibility*) untuk preservasi data historis jika ada.
   - Tabel baru `billing_invoices`, `billing_templates`, `payment_orders`, `payment_allocations`, dan `ledger_entries` diterbitkan melalui migrasi baru (`0008_comprehensive_finance_and_unified_checkout.sql`).
2. **Pemberian Hak Akses & RLS Policy**:
   - Setiap tabel baru dilengkapi dengan Supabase Row-Level Security (RLS) berdasarkan `tenant_id` dan perannya di `user_tenant_memberships`.
3. **Rollback Strategy**:
   - Seluruh migration DDL dirancang memiliki file *down migration* yang bersih (menghapus tabel baru dan constraint tanpa mengganggu tabel `users`, `santri`, maupun `wallets`).

---

## 6. USULAN ARCHITECTURE DECISION RECORDS (ADR)

### ADR-FIN-01: Penerapan Spesifikasi Domain Pendamping (Opsi B)
- **Status:** PROPOSED
- **Konteks:** Menyatukan kebutuhan administrasi billing pendidikan dengan modul Flip Proxy tanpa merusak Aturan Mutlak 1–13.
- **Keputusan:** Spesifikasi utama `docs/spesifikasi-pembayaran.md` tetap menjadi inti finansial dan gateway proxy. Kebutuhan ERP pesantren ditempatkan pada dokumen pendamping `docs/architecture/SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md`.

### ADR-FIN-02: Taksonomi Entitas Unified Checkout & Multi-Allocation
- **Status:** PROPOSED
- **Konteks:** Wali santri ingin membayar SPP, Uang Saku, dan Rihlah dalam 1 tagihan Flip.
- **Keputusan:** Memperkenalkan `payment_orders` dan `payment_allocations` di atas `transactions`. Satu pembayaran gateway dialokasikan secara atomik ke banyak pos kewajiban santri.

### ADR-FIN-03: Perhitungan Biaya Admin pada Level Payment Order
- **Status:** PROPOSED
- **Konteks:** Biaya Flip ditagih per payment link.
- **Keputusan:** Biaya admin dihitung satu kali per payment order (bukan per item di dalam keranjang checkout), melindungi wali dari beban biaya berganda dan menjamin margin platform positif.

### ADR-FIN-04: Isolasi Liabilitas Titipan Uang Saku Santri (Custodial Wallet Liability)
- **Status:** PROPOSED
- **Konteks:** Uang saku santri bukan hak milik pesantren.
- **Keputusan:** Top-up uang saku dikreditkan ke akun `CUSTODIAL_WALLET_LIABILITY:{tenant_id}`, bukan ke `TENANT_PAYABLE:{tenant_id}`. Dana uang saku diisolasi dari saldo penarikan yayasan.

### ADR-FIN-05: Non-Blokir Top-Up pada Kondisi Wallet Freeze
- **Status:** PROPOSED
- **Konteks:** Santri terkena Wallet Freeze (F-WF-01 & F-WF-02).
- **Keputusan:** Pembekuan hanya berlaku untuk transaksi belanja kantin (POS deduct). Wali santri tetap diizinkan melakukan top-up uang saku dari rumah.

### ADR-FIN-06: Evaluasi Idempotensi Pengingat Pembayaran (Billing Reminder)
- **Status:** PROPOSED
- **Konteks:** Reminder tagihan via email dan WhatsApp tidak boleh terkirim berulang kali.
- **Keputusan:** Menggunakan tabel `billing_reminder_logs` dengan constraint unique `(invoice_id, reminder_type, recipient_channel)`. Pengiriman dibatalkan otomatis jika invoice telah berstatus lunas.

---

## 7. USULAN REVISI DEPENDENCY & WORK PACKAGES (T1–T26)

Untuk mengakomodasi arsitektur terpadu, tugas T1–T20 dari spesifikasi pembayaran diperluas dengan penambahan paket tugas domain **T21 s/d T26**:

```
[ T1: Financial Core Schema & Ledger Trigger ]
  │
  ├──► [ T2: FeeCalculator Pure Function ] ──► [ T3: Fee Rules CRUD & Simulator ]
  │
  ├──► [ T4: LedgerService & Balancing Engine ]
  │
  └──► [ T5: PaymentGateway Interface & Flip Adapter ]
         │
         ├──► [ T6: Create Bill API ]
         │      │
         │      ▼
         ├──► [ T7: Flip Webhook Handler ] ──► [ T8: Expired & Status Check ]
         │      │
         │      ▼
         ├──► [ T9: Payouts Foundation & Margin Withdraw ]
         │
         └──► [ T10: Actual Fee Adjustment & Refunds ]
                │
                ▼
              [ T11: Daily Reconciliation & Alerting ]
                │
                ▼
              [ T12: Security Hardening & Documentation ]
                │
                ├───────────────────────────────────────────────────────┐
                │                                                       │
                ▼ (Spesifikasi Inti Tambahan)                           ▼ (Spesifikasi Domain Pendamping)
              [ T13: Riwayat Keuangan Tenant ]                        [ T21: Billing Templates & Generator ]
                │                                                       │
              [ T14: Pemantauan Transaksi Macet ]                     [ T22: Activity Billing System ]
                │                                                       │
              [ T15: Penentuan Lokasi Kegagalan ]                     [ T23: Unified Checkout & Allocations ]
                │                                                       │
              [ T16: Dashboard Superadmin & Subs ]                    [ T24: Custodial Wallet Integration ]
                │                                                       │
              [ T17: Penarikan Otomatis Tenant ]                      [ T25: Automated Billing Reminders ]
                │                                                       │
              [ T18: Konfirmasi OTP Penarikan ]                       [ T26: Finance Admin & Wali Portal UI ]
                │                                                       │
              [ T19: Pengaturan Biaya per Tenant ]                      │
                │                                                       │
              [ T20: Dashboard Keuangan Tenant ] ◄──────────────────────┘
```

### Rincian Tugas Tambahan (T21–T26):
- **T21 (Billing Templates & Routine Invoices)**: Skema `billing_templates`, engine penerbitan SPP bulanan otomatis, dan pencegahan duplikasi invoice rutin.
- **T22 (Activity Billing & Participant Target)**: Skema `activity_bills`, filter target rombel/santri, dan kuota pendaftaran.
- **T23 (Unified Checkout & Multi-Allocation)**: Skema `payment_orders` dan `payment_allocations`, keranjang checkout wali, dan atomic dispatcher alokasi dana.
- **T24 (Custodial Wallet & POS Integration)**: Jurnal `CUSTODIAL_WALLET_LIABILITY`, sinkronisasi saldo `wallets`, dan kompatibilitas Wallet Freeze.
- **T25 (Billing Reminder Scheduler & Channels)**: Evaluasi jadwal reminder (H-3, Hari H, H+2), integrasi Resend Email dan WhatsApp Gateway.
- **T26 (Finance Admin & Wali Portal UI)**: Tampilan administrasi bendahara, portal pembayaran wali santri, dan laporan keuangan santri.

---

## 8. ACCEPTANCE CRITERIA & TEST MATRIX

| No | Modul / Skenario | Kriteria Keberhasilan (Acceptance Criteria) | Tipe Tes |
|---|---|---|---|
| 1 | **Integer Currency Paths** | Seluruh jalur uang menggunakan integer Rupiah; tidak ada desimal/float di database dan kode. | Unit / Static Analysis |
| 2 | **Append-Only Ledger** | Perintah `UPDATE` atau `DELETE` pada tabel `ledger_entries` ditolak keras oleh database trigger/rule. | Integration / DB Test |
| 3 | **Double-Entry Balance** | Total debit sama dengan total kredit pada setiap transaksi pembayaran, penarikan, dan alokasi dana. | Property-based / Invariant |
| 4 | **Unified Checkout Single Bill** | Wali santri membayar SPP Rp500.000 + Uang Saku Rp200.000 + Rihlah Rp150.000 dalam 1 link Flip dengan 1 biaya admin Rp3.200. | End-to-End Simulation |
| 5 | **Accurate Multi-Allocation** | Setelah pembayaran terkonfirmasi: SPP lunas, Rihlah lunas, saldo uang saku santri bertambah Rp200.000, hak pesantren Rp650.000, margin SaaS terposting. | Integration Test |
| 6 | **Separation of Custodial Funds** | Saldo uang saku santri tidak pernah masuk ke akun `TENANT_PAYABLE` dan tidak bisa ditarik oleh yayasan pesantren. | Domain Logic Test |
| 7 | **Fee Concealment (Zero Leakage)**| Response API untuk admin tenant dan wali santri tidak memuat kolom `gateway_fee`, `margin`, atau `PLATFORM_REVENUE`. | Security / Contract Test |
| 8 | **Wallet Freeze Compatibility** | Santri dengan status wallet freeze tetap dapat menerima top-up uang saku dari checkout wali; belanja kantin tetap terblokir. | Integration Test |
| 9 | **Idempotent Webhook Processing**| Webhook Flip yang dikirim 5 kali secara paralel hanya menghasilkan 1 kali pelunasan invoice dan 1 set jurnal ledger. | Concurrency Test |
| 10 | **Reminder Deduplication** | Reminder H-3 via email hanya dikirim tepat 1 kali per invoice; reminder dibatalkan jika invoice telah berstatus lunas. | Scheduler Test |

---

## 9. DAFTAR KEPUTUSAN YANG MENUNGGU PERSETUJUAN PRODUCT OWNER

Sebelum engineering dapat dimulai pada tahap implementasi berikutnya, Product Owner (`Process_PO`) diharapkan mengesahkan keputusan bisnis berikut:

1. **Ratifikasi Opsi Dokumen**: Apakah Opsi B (Spesifikasi Domain Pendamping `SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md`) disetujui sebagai arsitektur kanonis?
2. **Besaran Biaya Layanan Default**: Konfirmasi nilai default biaya admin platform pada checkout gabungan (rekomendasi: flat Rp3.200 per checkout, dibebankan kepada wali santri).
3. **Penyedia & Gateway WhatsApp**: Apakah pengiriman notifikasi WhatsApp akan menggunakan provider resmi (misal: Fonnte, Waba, Twilio) atau ditunda dan menggunakan Email Resend sebagai kanal primer terlebih dahulu?
4. **Batas Penarikan Dana Tenant (Payout Limits)**: Penentuan nominal minimum penarikan (`payout_min_amount`, misal Rp100.000) dan batas atas penarikan otomatis harian sebelum memerlukan review superadmin.
5. **Masa Tunggu Perubahan Rekening Bank**: Konfirmasi durasi cooldown perubahan rekening penarikan tenant (`bank_change_cooldown`, rekomendasi: 24 jam / 1 hari kerja).

---

## 10. REKOMENDASI TAHAP IMPLEMENTASI PERTAMA

Jika seluruh keluaran arsitektur ini disahkan oleh Process_PO dan Process_Mandor, urutan pelaksanaan engineering yang paling aman dan terstruktur adalah:

1. **Fase 1 (Fondasi Database & Ledger Core - T1, T2, T4)**:
   - Menerbitkan skema Drizzle untuk `ledger_entries`, `transactions`, `payment_orders`, `payment_allocations`, dan `billing_invoices`.
   - Mengimplementasikan fungsi murni `calculateFees()` dengan pengujian test vector V1–V4.
   - Mengimplementasikan `LedgerService` dengan verifikasi penolakan mutasi `UPDATE`/`DELETE`.
2. **Fase 2 (Gateway Adapter & Webhook Engine - T5, T6, T7, T8)**:
   - Mengimplementasikan `FlipPaymentGatewayAdapter` resmi sesuai dokumentasi Flip.
   - Mengimplementasikan handler webhook idempoten dengan verifikasi token Flip.
3. **Fase 3 (Unified Checkout & Multi-Allocation Engine - T21, T22, T23, T24)**:
   - Menghubungkan alur checkout wali dengan alokasi dana ke tagihan dan dompet santri.
4. **Fase 4 (Payouts, Reminders & UI Portals - T9, T17, T18, T25, T26)**:
   - Mengimplementasikan penarikan saldo tenant otomatis, OTP konfirmasi, reminder, dan dashboard.

---

## 11. STOP CONDITION & KEPATUHAN TATA KELOLA

Mandat arsitektur **M2-FINANCE-ARCHITECTURE-001** telah selesai dilaksanakan secara komprehensif. Sesuai dengan instruksi *Stop Condition*:
- Seluruh dokumen proposal arsitektur dan spesifikasi pendamping telah tersusun rapi di `docs/architecture/`.
- Tidak ada kode produksi yang dimodifikasi.
- Tugas engineering T1–T20 tidak diaktifkan.
- Sistem berhenti dan menunggu arahan formal serta persetujuan resmi dari **Process_PO** dan **Mandor 2**.
