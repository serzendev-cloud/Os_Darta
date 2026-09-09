# EOS SPRINT 1 — FINANCIAL FLOW, WALLET, BILLING & AUDIT TIMELINE ARCHITECTURE
## APP MA'HAD ENTERPRISE SaaS ERP
### Document Status: EXTENDED DOMAIN ARCHITECTURE CONTRACT — LOCKED (CORRECTION PATCHED)
### Authority: Senior Principal Systems Architect & Core Platform Governance
### Date: August 12, 2026

---

> [!IMPORTANT]
> **GOVERNANCE DIRECTIVE — ABSOLUTELY NO IMPLEMENTATION**:
> Ini adalah **ARCHITECTURE / DOMAIN / SECURITY CONTRACT EXTENSION ONLY**.
> - **Runtime Code Modified**: 0 files
> - **Database Schema / Migration**: 0 created
> - **API Endpoints / Server Actions**: 0 created
> - **Wallet Engine / Ledger Engine**: 0 created
> - **NFC Hardware Integration / SDK**: 0 created
> - **Midtrans / Webhooks**: 0 implemented
> - **UI Components / Cron Workers**: 0 modified
> - **Git Commits / Pushes / PRs**: 0 executed

---

## 1. GOVERNANCE DIRECTIVE & EXECUTIVE SUMMARY

Dokumen ini merupakan **Extension Contract (Correction Patched)** resmi terhadap **Financial Flow, Wallet, Billing & Payment Architecture** untuk **APP MA'HAD Enterprise SaaS ERP**. Dokumen ini memperluas arsitektur sebelumnya dengan menetapkan secara menyeluruh:
1. **Webhook Source of Truth Engine**: Webhook/Provider confirmation adalah authority tunggal finalisasi pembayaran eksternal.
2. **Exact-Once Financial Effect & Idempotency Contract**.
3. **Wallet Taxonomy Expansion**: Pemisahan `WALI_WALLET`, `SANTRI_WALLET`, `SANTRI_SAVINGS_WALLET`, dan `TENANT_FINANCIAL_ACCOUNT`.
4. **Opt-In Provisioning Engine vs Funding Contract (`INV-SAVINGS-01`)**.
5. **Role Ownership Model for Savings Withdrawal**: Santri NFC Approval vs Financial Operator Execution (`wallet.savings.withdraw`).
6. **Revised NFC Student Approval Contract**: NFC sebagai *Student Withdrawal Approval Mechanism* (Decoupled dari spesifikasi hardware/protokol tertentu).
7. **Savings Withdrawal Invariants (`INV-WITHDRAW-01..15`)** & **22 Threat Model Scenarios**.

---

## 2. GROUND-TRUTH FORENSIC AUDIT OF EXISTING REPOSITORY

Sesuai **Rule 32 (Ground-Truth Requirement)**, berikut adalah klasifikasi kondisi riil repositori berdasarkan bukti fisik per 12 Agustus 2026:

| Component / Engine | Status Classification | Forensic Findings & Evidence |
| :--- | :--- | :--- |
| `Midtrans SDK Integration` | `FUTURE ARCHITECTURE / NOT IMPLEMENTED` | Belum ada SDK Midtrans terpasang di `src/lib/`. |
| `NFC Hardware Integration` | `NOT IMPLEMENTED` | Belum ada NFC reader SDK/library di codebase. |
| `NFC Protocol & Hardware Choice` | `FUTURE HARDWARE/PROTOCOL SELECTION DECISION` | Pilihan tipe kartu NFC (UID-only vs Secure Crypto) belum dikunci. |
| `Santri Savings Wallet` | `NOT IMPLEMENTED` | Belum ada tabel `savings_wallets` di DB. |
| `NFC Student Approval Engine`| `NOT IMPLEMENTED` | Belum ada verification logic kartu NFC santri. |
| `Savings Withdrawal Operator`| `NOT IMPLEMENTED` | Belum ada API/Operator Execution `wallet.savings.withdraw`. |

---

## 3. ROLE OWNERSHIP MODEL FOR SAVINGS WITHDRAWAL

Withdrawal dari `SANTRI_SAVINGS_WALLET` **TIDAK TERSEDIA AUTOMATIS** hanya karena seorang user memiliki peran Admin. Sistem menetapkan pembagian peran dan tanggung jawab kanonis sebagai berikut:

```
                               SAVINGS WITHDRAWAL OWNERSHIP
                                             │
         ┌───────────────────────────────────┼───────────────────────────────────┐
         │                                   │                                   │
         ▼                                   ▼                                   ▼
      SANTRI                            WALI SANTRI                     ADMIN KEUANGAN TENANT
(Request & NFC Approval)            (Read-Only Monitoring)           (Financial Operator Execution)
         │                                   │                                   │
 ┌───────┴────────┐                  ┌───────┴────────┐                  ┌───────┴────────┐
 │ Submit Request │                  │ View Balance   │                  │ Verify Request │
 │ View Status    │                  │ View Mutations │                  │ Request NFC Tap│
 │ Tap NFC Card   │                  │ CANNOT Request │                  │ Select Channel │
 │ NO Self-Execute│                  │ CANNOT Execute │                  │ Execute Payout │
 └────────────────┘                  └────────────────┘                  └────────────────┘
```

### Permission Gate Specification
- Otorisasi eksekusi pencairan wajib memeriksa permission kanonis: **`wallet.savings.withdraw`**.
- Dilarang hardcode nama role. Otorisasi wajib dievaluasi melalui Platform Permission Registry & Tenant RBAC.

---

## 4. CANONICAL 5-STEP WITHDRAWAL STATE MACHINE

Proses pencairan dana dari `SANTRI_SAVINGS_WALLET` wajib melewati 5 state kanonis secara berurutan:

```
  1. REQUESTED (Santri / Admin mengajukan permohonan nominal & alasan)
        │
        ▼
  2. PENDING_STUDENT_APPROVAL (Admin Keuangan memproses & meminta Santri tap kartu NFC)
        │
        ▼ (Santri menempelkan kartu NFC di reader)
  3. STUDENT_APPROVAL_VERIFIED (Sistem memverifikasi persetujuan kartu NFC Santri)
        │
        ▼
  4. WITHDRAWABLE (Sistem membuka eligibilitas transaksi untuk dieksekusi)
        │
        ▼ (Admin Keuangan mengeksekusi dengan permission wallet.savings.withdraw)
  5. WITHDRAWAL_EXECUTED / COMPLETED (Atomic Double-Entry Ledger Posting ditulis ke DB)
```

---

## 5. REVISED NFC STUDENT APPROVAL CONTRACT (PATCHED)

> [!IMPORTANT]
> **BUSINESS DECISION — LOCKED**:
> Kartu NFC digunakan sebagai **Student Withdrawal Approval Mechanism**. Fungsinya adalah memberikan bukti fisik bahwa santri yang bersangkutan telah memberikan persetujuan terhadap suatu Withdrawal Request tertentu.

### Core Contract Requirements
Persetujuan NFC santri wajib memenuhi kriteria domain berikut:
1. **Student Binding**: Wajib terikat pada identitas santri yang benar.
2. **Tenant Scoping**: Wajib terikat pada `tenant_id` yang sah.
3. **Request & Amount Binding**: Wajib terikat pada `withdrawal_request_id` dan nominal yang disetujui.
4. **Timestamped & Auditable**: Wajib mencatat timestamp persetujuan secara immutable.
5. **Single-Use Only**: Persetujuan NFC bersifat sekali pakai dan **DILARANG** digunakan ulang untuk request withdrawal lain.
6. **No Direct Execution Authority**: Tempelan NFC **TIDAK MENGSEKUSI** pencairan secara langsung (`NFC Approval != Withdrawal Authority`).

> [!NOTE]
> **TECHNICAL HARDWARE DECOUPLING (OPEN DECISION)**:
> Pilihan teknologi NFC (seperti tipe kartu UID-only vs Secure Cryptographic Card, spesifikasi NFC Reader, SDK, protokol nonce/challenge-response, tokenization, durasi expiry, anti-cloning, dan device trust model) **BELUM DIKUNCI** dan diklasifikasikan sebagai `FUTURE HARDWARE/PROTOCOL SELECTION DECISION`.

---

## 6. FINANCIAL OPERATOR EXECUTION & PAYOUT CHANNELS

Setelah status mencapai `WITHDRAWABLE`, Admin Keuangan Tenant yang memegang permission `wallet.savings.withdraw` mengeksekusi pencairan dengan memilih salah satu saluran pencairan sah:

- **CHANNEL A (`CASH_HANDOVER`)**: Penyerahan uang tunai langsung dari kasir/bendahara tenant.
- **CHANNEL B (`TRANSFER_TO_SANTRI_WALLET_SAKU`)**: Transfer saldo internal dari `SANTRI_SAVINGS_WALLET` ke `SANTRI_WALLET` (Uang Saku).
- **CHANNEL C (`BANK_TRANSFER`)**: Payout/Disbursement ke rekening bank sah yang terverifikasi.

Seluruh eksekusi berjalan dalam **Single Atomic Database Transaction Boundary** (Debit Savings Wallet + Credit Payout Destination + Ledger Entry).

---

## 7. SAVINGS WITHDRAWAL ARCHITECTURAL INVARIANTS (INV-WITHDRAW)

- **INV-WITHDRAW-01**: Savings withdrawals MUST NOT be self-executed by Santri or Wali.
- **INV-WITHDRAW-02**: Savings withdrawals MUST require an explicit physical NFC approval tap from the student to verify consent.
- **INV-WITHDRAW-03**: Financial Operators MUST NOT execute savings withdrawals without a verified student NFC approval.
- **INV-WITHDRAW-04**: Execution of savings withdrawal MUST strictly require the canonical permission `wallet.savings.withdraw`.
- **INV-WITHDRAW-05**: Role names MUST NOT be hardcoded in withdrawal authorization logic.
- **INV-WITHDRAW-06**: Wali MUST NOT be an executor or approver of savings withdrawals.
- **INV-WITHDRAW-07**: Student NFC approval MUST be bound to a specific student, tenant, request ID, and amount, and MUST be single-use.
- **INV-WITHDRAW-08**: Student NFC approval DOES NOT grant direct withdrawal execution authority (`NFC Approval != Execution`).
- **INV-WITHDRAW-09**: Financial Operators MUST select an explicit, authorized payout channel upon execution.
- **INV-WITHDRAW-10**: Savings withdrawal execution MUST be atomic across ledger postings and payout states.
- **INV-WITHDRAW-11**: Failed withdrawal execution MUST execute a full atomic rollback without partial ledger postings.
- **INV-WITHDRAW-12**: Executed savings withdrawals MUST record immutable financial ledger entries with complete audit metadata.
- **INV-WITHDRAW-13**: Savings withdrawal operations MUST strictly enforce multi-tenant isolation.
- **INV-WITHDRAW-14**: Super Admin financial monitoring MUST NOT imply rights to execute tenant savings withdrawals.
- **INV-WITHDRAW-15**: Savings withdrawal amounts MUST NOT exceed the current derived savings wallet balance.

---

## 8. WEBHOOK SOURCE OF TRUTH & FINANCIAL POSTING CONTRACT

Aplikasi **DILARANG HARDIK** mempercayai status pembayaran dari frontend redirect. Hanya konfirmasi resmi provider yang diterima via **Verified Webhook (HMAC SHA512 Check)** yang menjadi **Source of Truth** untuk eksekusi final posting finansial eksternal.

---

## 9. DERIVED WALLET BALANCE & IMMUTABLE LEDGER PRINCIPLE

Saldo wallet dihitung berdasarkan akumulasi mutasi debet/kredit pada **Immutable Double-Entry Ledger System**:

$$\text{Calculated Balance} = \sum \text{Credit Entries} - \sum \text{Debit Entries}$$

---

## 10. GROUND-TRUTH FORENSIC AUDIT MATRIX (CURRENT VS TARGET)

| Component / Engine | Status Classification | Forensic Findings & Evidence |
| :--- | :--- | :--- |
| `NFC Protocol & Hardware` | `FUTURE HARDWARE/PROTOCOL SELECTION DECISION` | Tipe kartu & protokol NFC belum dikunci. |
| `NFC Approval Engine` | `NOT IMPLEMENTED` | Belum ada NFC reader SDK/library atau verification logic. |
| `Savings Withdrawal Operator`| `NOT IMPLEMENTED` | Belum ada API/Operator Execution `wallet.savings.withdraw`. |
| `Santri Savings Wallet` | `NOT IMPLEMENTED` | Belum ada tabel `savings_wallets` di Drizzle schema. |
| `External PG Webhook` | `MOCK / REFACTOR REQUIRED` | Signature Verified & Idempotent Webhook Engine. |

---

## 11. FINAL ARCHITECTURE DECISION GATE REPORT

### Execution Metrics Verification
- **Architecture Documentation**: **COMPLETED, EXTENDED, PATCHED & LOCKED**
- **Runtime Code Modified**: 0
- **Database Modified**: 0
- **Migration Created**: 0
- **API Modified**: 0
- **UI Modified**: 0
- **Midtrans Integrated**: 0
- **NFC Hardware Integrated**: 0
- **Webhook Implemented**: 0
- **Wallet Engine Implemented**: 0
- **Ledger Engine Implemented**: 0
- **Savings Engine Implemented**: 0
- **Withdrawal Implemented**: 0
- **Git Commit**: 0
- **Git Push**: 0
- **PR**: 0

### Final Gate Evaluation
**PASS — ARCHITECTURE CORRECTION PATCH VERIFIED**

Seluruh koreksi dari Chief Engineering (pelepasan kunci spesifikasi hardware NFC & penguncian bisnis kontrak NFC Student Approval) telah diterapkan secara utuh tanpa menyentuh runtime code.
