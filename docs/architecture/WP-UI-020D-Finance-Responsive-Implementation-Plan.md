# WP-UI-020D MASTER IMPLEMENTATION PLAN
## Finance & Santri Wallet Responsive Data Presentation Architecture

**Work Package ID:** `WP-UI-020D`  
**Package Scope:** `Finance, Wallet, Billing, Invoice, PPOB & Canteen POS Screens Transformation`  
**Architecture Approach:** `REUSE-FIRST • CANONICAL MODULE EVOLUTION • ZERO DUPLICATION`  
**Status:** `MASTER IMPLEMENTATION PLAN — AUTHORIZED FOR SUB-PACKAGE EXECUTION`  

---

## 1. EXECUTIVE OBJECTIVE

Tujuan utama dari **WP-UI-020D** adalah mentransformasikan seluruh halaman operasional keuangan (*Finance & Santri Wallet*) dari tampilan desktop kaku menjadi antarmuka **Mobile-First & Touch-Safe Enterprise**, seraya mengonsumsi **100% canonical domain models, services, stores, dan calculation engines** yang ada tanpa duplikasi modul atau perubahan logika bisnis keuangan.

---

## 2. CANONICAL MODULE INVENTORY & DUPLICATION FORENSICS

| Domain / Route | Modul Komponen Utama | Domain Schema / Store | Persistence & Service | Mobile Criticality | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wali Checkout** (`/wali/tagihan/checkout`) | `WaliBundledCheckoutPage` | `invoices`, `wallets` (`finance.ts`) | Single Payment Invoice API (Flip) | **CRITICAL** | Ready for WP-UI-020D-1 |
| **Wali PPOB** (`/wali/ppob`) | `WaliPpobPage` | `ppobTransactions`, `ppobWaliBalances` (`ppob.ts`) | Digiflazz / SaaS PPOB Proxy API | **CRITICAL** | Ready for WP-UI-020D-1 |
| **Monitoring Keuangan** (`/dashboard/kelas/monitoring-keuangan`) | `MonitoringKeuanganKelasPage` | `wallets` (`finance.ts`), `mockSantri` | Wallet Freeze & Limit Service | **CRITICAL** | Ready for WP-UI-020D-2 |
| **Kantin POS RFID** (`/dashboard/keuangan/kantin-nfc`) | `KantinNfcPage` | `canteen-store.ts`, `canteens` (`finance.ts`) | `canteenTransactions` API | **HIGH** | Ready for WP-UI-020D-3 |
| **Kantin Management** (`/dashboard/keuangan/kantin-management`) | `KantinManagementPage` | `canteen-store.ts`, `canteenItems` (`finance.ts`) | `saveStoredCanteenItems` | **MEDIUM** | Ready for WP-UI-020D-3 |
| **SaaS PPOB Audit** (`/dashboard/saas/ppob`) | `SaasOwnerPpobDashboard` | `ppobTransactions` (`ppob.ts`) | SaaS Global Audit Log | **LOW** | Ready for WP-UI-020D-3 |

### Duplication Forensic Verdict:
- **Duplicate Finance Engines:** **0 (Zero)**
- **Duplicate Wallet Calculators:** **0 (Zero)**
- **Duplicate POS Stores:** **0 (Zero)**
- **Verdict:** **NONE (0 Duplicate Business/Data Logic)**.

---

## 3. CANONICAL DATA FLOW ARCHITECTURE

```
                      CANONICAL FINANCE SERVICES & SCHEMAS
               (invoices / wallets / ppobTransactions / canteen-store)
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
        v                                v                                v
 Wali Checkout & PPOB            Wali Kelas Wallet Monitor              Canteen POS & Catalog
(/wali/tagihan & /wali/ppob)    (/dashboard/kelas/monitoring)      (/dashboard/keuangan/*)
        │                                │                                │
        └────────────────────────────────┼────────────────────────────────┘
                                         │
                                         v
                            SHARED RESPONSIVE PRIMITIVES
                 (ResponsiveDataGrid / MobileCardStack / Select / Sheet)
```

---

## 4. IMMUTABLE BUSINESS LOGIC BOUNDARY

Dalam eksekusi WP-UI-020D, area berikut **DIJAMIN 100% TIDAK BERUBAH (UNTOUCHED)**:
1. `wallets` & `wallet_pockets` calculation logic (`balanceUangSaku`, `balanceTabungan`, `dailyLimit`).
2. `invoices` single-transfer calculation (`amountSpp + amountUangSaku + amountTabungan = totalAmount`).
3. `ppobTransactions` & Digiflazz markup fee calculation (`priceBase + marginFeeSaas = priceSelling`).
4. Database Schema (Drizzle ORM / Supabase RLS).
5. API Routes & Webhook Handlers (`/api/canteen/pay`, `/api/ppob/*`, `/api/webhooks/*`).
6. Tenant isolation & RBAC contracts.

---

## 5. SUB-PACKAGE IMPLEMENTATION ROADMAP

```
                    WP-UI-020D MASTER PLAN (APPROVED)
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         v                         v                         v
   WP-UI-020D-1              WP-UI-020D-2              WP-UI-020D-3
  Wali Tagihan Checkout      Wali Kelas Wallet       Canteen POS RFID &
      & Wali PPOB             Control & Limit         Canteen Catalog Mgmt
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                                   v
                             WP-UI-020D-4
                     Final Integration & Certification
```

### Sub-Package Details:
- **`WP-UI-020D-1`:** Wali Finance & Payment Portal (`/wali/tagihan/checkout` & `/wali/ppob`).
- **`WP-UI-020D-2`:** Wali Kelas Wallet Control & Spend Limit Monitoring (`/dashboard/kelas/monitoring-keuangan`).
- **`WP-UI-020D-3`:** Canteen POS RFID & Management (`/dashboard/keuangan/kantin-nfc` & `/dashboard/keuangan/kantin-management`).
- **`WP-UI-020D-4`:** Final Cross-Module Integration & Regression Certification Gate (`WP-UI-020D`).

---

## 6. QUALITY GATES & ACCESSIBILITY GUARDRAILS

- **Touch Targets:** Minimal `44px × 44px` untuk seluruh input nominal, tombol aksi, dan pemicu modal/sheet.
- **Font Scale:** Input nominal keuangan menggunakan font `text-sm` / `text-base` untuk mencegah auto-zoom iOS Safari.
- **No Global Overflow:** Garansi 0 horizontal scrollbar pada lebar 320px, 360px, 390px, dan 430px.
- **Desktop Preservation:** Pengalaman enterprise data grid pada layar ≥ 1024px dipertahankan 100%.
- **Validation Commands:**
  - `npx tsc --noEmit`
  - `npm run test:run`
  - `npm run build`

---

```
============================================================
STATUS AKHIR PERENCANAAN MASTER WP-UI-020D:
STATUS: MASTER IMPLEMENTATION PLAN COMPLETE — APPROVED
WP-UI-010: CERTIFIED
WP-UI-020A: APPROVED / VALIDATED
WP-UI-020B: APPROVED / VALIDATED
WP-UI-020C: CERTIFIED (COMMIT: 2e115fa)
WP-UI-020D-PLAN: COMPLETE / READY FOR WP-UI-020D-1
WP-UI-020D-1: AUTHORIZED FOR EXECUTION
WP-UI-020D-2: NOT EXECUTED / AWAITING AUTHORIZATION
WP-UI-020D-3: NOT EXECUTED / AWAITING AUTHORIZATION
WP-UI-020D-4: NOT EXECUTED / AWAITING AUTHORIZATION

RUNTIME BUSINESS LOGIC MODIFIED: 0
DATABASE MODIFIED: 0
MIGRATION CREATED: 0
PACKAGE DEPENDENCIES MODIFIED: 0
GIT PUSH: 0
IMPLEMENTATION STATUS: READY FOR WP-UI-020D-1 EXECUTION
============================================================
```
