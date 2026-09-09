# EOS SPRINT 1 — PAYMENT & PLATFORM REVENUE ARCHITECTURE CONTRACT
## APP MA'HAD ENTERPRISE SaaS ERP
### Document Status: ARCHITECTURE DECISION GATE — LOCKED & EXTENDED
### Authority: Senior Principal Systems Architect & Core Platform Governance
### Date: August 12, 2026

---

> [!IMPORTANT]
> **GOVERNANCE DIRECTIVE — WAJIB**:
> Ini adalah **ARCHITECTURE / DESIGN / CONTRACT REVIEW ONLY**.
> - **Runtime Code Modified**: 0 files
> - **Database Schema / Migration**: 0 created
> - **API Endpoints**: 0 created
> - **Midtrans SDK / Webhooks**: 0 implemented
> - **UI Components**: 0 modified
> - **Git Commits / Pushes / PRs**: 0 executed

---

## 1. GOVERNANCE DIRECTIVE & EXECUTIVE SUMMARY

Dokumen ini memuat **Payment & Platform Revenue Architecture Contract** untuk **APP MA'HAD Enterprise SaaS ERP**. Dokumen ini telah diperluas untuk menetapkan secara menyeluruh:
1. **Payment Ownership Boundary Model** (`SAAS_PLATFORM_PAYMENT` vs `TENANT_CUSTOMER_PAYMENT`).
2. **Webhook Source of Truth Principle**: Webhook/Provider Confirmation adalah **satu-satunya otoritas sah** untuk penyelesaian pembayaran eksternal.
3. **External Payment State Machine**: Alur state kanonis dari `CREATED` hingga `COMPLETED` dan penanganan cabang kegagalan (`FAILED`, `INVALID_SIGNATURE`, `POSTING_FAILED`).
4. **Service Fee Policy & Commercial Snapshot Invariants** (`INV-PAY-01` s/d `INV-PAY-10`).
5. **Super Admin Dual-Layer Observability**: Tracing terpisah antara Provider Layer vs Application Layer.

---

## 2. GROUND-TRUTH FORENSIC AUDIT OF EXISTING REPOSITORY

Sesuai **Rule 29 (Ground-Truth Rule)** dan **Rule 32 (Ground-Truth Requirement)**, berikut adalah klasifikasi kondisi riil repositori berdasarkan bukti fisik per 12 Agustus 2026:

| Artifact / Module | Classification | Forensic Findings & Evidence |
| :--- | :--- | :--- |
| `Midtrans SDK Client` | `FUTURE ARCHITECTURE / NOT IMPLEMENTED` | Tidak ditemukan SDK Midtrans atau API wrapper resmi di `src/lib/`. |
| `Platform PG Webhook Route` | `MOCK / REFACTOR REQUIRED` | `src/app/api/webhooks/platform-pg/route.ts` hanya menangani callback PPOB Digiflazz secara mock. Belum ada verifikasi signature Midtrans HMAC SHA512, DB idempotency check, maupun mapping tenant internal. |
| `Payment & Financial Ledger Schema` | `NOT IMPLEMENTED` | Skema database Drizzle di `src/lib/db/schema/` belum memiliki tabel transaksi payment multi-tenant, snapshot policy, ledger entry, maupun settlement record. |
| `Tenant vs Platform Revenue Boundary` | `PROPOSED ARCHITECTURE` | Dikunci melalui dokumen kontrak ini sebelum implementasi database dan API. |

---

## 3. PAYMENT OWNERSHIP BOUNDARY MODEL (LOCKED)

Arsitektur sistem pembayaran APP MA'HAD membagi transaksi menjadi dua domain ownership yang sepenuhnya terisolasi:

```
                          PAYMENT OWNERSHIP BOUNDARY
                                      │
         ┌────────────────────────────┴────────────────────────────┐
         │                                                         │
         ▼                                                         ▼
SAAS_PLATFORM_PAYMENT                                    TENANT_CUSTOMER_PAYMENT
(Pendapatan SaaS Platform)                              (Pembayaran Tagihan Tenant)
         │                                                         │
 ┌───────┴───────┐                                         ┌───────┴───────┐
 │ Subskripsi    │                                         │ Tagihan SPP   │
 │ Upgrade Paket │                                         │ Uang Gedung   │
 │ Custom Domain │                                         │ Registrasi    │
 │ Add-on Layanan│                                         │ Asrama / DORM │
 └───────────────┘                                         └───────────────┘
```

---

## 4. WEBHOOK SOURCE OF TRUTH PRINCIPLE (LOCKED)

> [!CAUTION]
> **CRITICAL FINANCIAL RULE**:
> Aplikasi **DILARANG HARDIK** menganggap pembayaran eksternal berhasil hanya karena:
> - User mengklaim telah membayar.
> - Frontend redirect ke URL `/payment/success`.
> - Response API `createPayment()` mengembalikan status HTTP 200 OK / PENDING.
> 
> **HANYA** konfirmasi resmi provider yang diterima via Webhook terverifikasi yang menjadi **SOURCE OF TRUTH UNTUK FINALISASI HASIL FINANSIAL**.

```
    FRONTEND SUCCESS PAGE      ≠ PAYMENT SUCCESS
    PAYMENT CREATION RESPONSE  ≠ PAYMENT SUCCESS
    USER CLAIM                 ≠ PAYMENT SUCCESS
    VERIFIED PROVIDER WEBHOOK  = SOURCE OF TRUTH FOR FINALIZATION
```

---

## 5. EXTERNAL PAYMENT STATE MACHINE

Arsitektur menetapkan state machine pembayaran eksternal kanonis sebagai berikut:

```
                  ┌─────────────┐
                  │   CREATED   │
                  └──────┬──────┘
                         │
                         ▼
                  ┌─────────────┐
                  │   PENDING   │
                  └──────┬──────┘
                         │ (Incoming Provider Notification)
                         ▼
                  ┌─────────────┐
                  │WEBHOOK_RCVD │
                  └──────┬──────┘
                         │ (HMAC Signature Check)
         ┌───────────────┴───────────────┐
         │ (Valid Signature)             │ (Invalid Signature)
         ▼                               ▼
  ┌─────────────┐                 ┌─────────────┐
  │WEBHOOK_VERIF│                 │  REJECTED   │
  └──────┬──────┘                 └─────────────┘
         │ (Business & Nominal Check)
         ▼
  ┌─────────────┐
  │PROVIDER_CONF│
  └──────┬──────┘
         │ (Atomic Ledger Posting)
         ▼
  ┌─────────────┐
  │FINANCIAL_PST│ ─── (Failure) ───► ┌─────────────┐
  └──────┬──────┘                    │POSTING_FAILED│
         │ (Success)                 └─────────────┘
         ▼
  ┌─────────────┐
  │  COMPLETED  │
  └─────────────┘
```

---

## 6. PAYMENT CREATION VS PAYMENT COMPLETION

Pemanggilan fungsi `createPayment()` hanya menghasilkan **Payment Intent / Payment Attempt** dengan status `PENDING`.

```
                  createPayment()
                        │
                        ▼
       Status: PENDING (Amount: Rp500.000)
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
Wallet Credit: NONE               Invoice Status: UNPAID
Fund Collection: 0                Available Balance: UNCHANGED
```

Saldo wallet **TIDAK BOLEH** bertambah, invoice **TIDAK BOLEH** berubah menjadi `PAID`, dan dana **TIDAK BOLEH** dimasukkan ke *Available Fund* sampai provider webhook terverifikasi diproses secara komplit.

---

## 7. PROVIDER ABSTRACTION FOR WEBHOOK & PAYOUT

Domain bisnis pembayaran APP MA'HAD **TIDAK BOLEH DEPENDENT LANGSUNG** pada SDK/API Midtrans.

```
       Core Financial Domain Engine
                    │
                    ▼
      ┌───────────────────────────┐
      │   IPaymentProvider        │
      │   IWebhookVerifier        │
      │   IPayoutProvider         │
      └─────────────┬─────────────┘
                    │
   ┌────────────────┴────────────────┐
   ▼                                 ▼
[MidtransAdapter]           [FutureProviderAdapter]
(Implementation Detail)     (e.g., Xendit / Bank Direct)
```

Adapter provider bertanggung jawab melakukan verifikasi signature (HMAC SHA512) dan memetakan payload mentah provider ke dalam internal event terstruktur.

---

## 8. STRICT TENANT INFORMATION BOUNDARY

Tenant **TIDAK BOLEH** memiliki akses atau visibilitas terhadap data margin internal platform SaaS (`provider_fee_actual`, `platform_service_fee`, `platform_margin`, `saas_net_revenue`, `settlement_cost`). Data disaring pada server-side DTO serializer.

---

## 9. SERVICE FEE POLICY ENGINE & COMMERCIAL SNAPSHOTS

Biaya penanganan platform (*Customer Service Fee*) wajib terkelola via `ServiceFeePolicy` dan di-snapshot pada detik invoice dibuat. Perubahan fee di masa depan tidak mempengaruhi transaksi historis.

---

## 10. NET SAAS REVENUE FORMULA

$$\text{Net SaaS Revenue} = \text{SaaS Subscription Revenue} + (\text{Customer Service Fees} - \text{Actual Provider Costs}) + \text{Other Platform Revenues}$$

---

## 11. SUPER ADMIN DUAL-LAYER OBSERVABILITY MODEL

Super Admin memiliki kemampuan melakukan tracing data keuangan dalam dua layer yang terhubung secara end-to-end:

```
┌────────────────────────────────────────────────────────────────────────┐
│                             PROVIDER LAYER                             │
│   Midtrans Tx ID | Settlement Status | Provider Fee | Provider Time    │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ (Internal Reference Mapping)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                            │
│   Tenant | User | Purpose | Invoice | Fund | Wallet | Ledger | Payout  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 12. REQUIRED ARCHITECTURAL INVARIANTS (INV-PAY)

- **INV-PAY-01**: Historical payment values and snapshot parameters are immutable.
- **INV-PAY-02**: Future pricing changes never mutate historical transactions.
- **INV-PAY-03**: Tenant customer payment base amount is not SaaS revenue.
- **INV-PAY-04**: Tenant users cannot access platform financial metadata under any condition.
- **INV-PAY-05**: Platform financial metadata is strictly platform-scoped.
- **INV-PAY-06**: Provider fee actual is recorded separately from customer policy service fee.
- **INV-PAY-07**: Net SaaS revenue is calculated from actual provider cost.
- **INV-PAY-08**: Webhook tenant resolution must use trusted internal payment mapping only.
- **INV-PAY-09**: Webhook processing must be idempotent.
- **INV-PAY-10**: Payment records must retain an auditable financial history without physical deletes.

---

## 13. FINAL DECISION GATE REPORT

### Status Summary
- **Architecture Status**: **READY & EXTENDED WITH CONDITIONS**
- **Runtime Code Modified**: 0
- **Database Modified**: 0
- **Migration Created**: 0
- **API Created**: 0
- **Midtrans Implemented**: 0
- **Webhook Implemented**: 0
- **UI Modified**: 0
- **Git Commit**: 0
- **Git Push**: 0
- **PR**: 0
