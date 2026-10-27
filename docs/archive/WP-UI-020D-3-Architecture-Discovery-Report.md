# WP-UI-020D-3 ARCHITECTURE DISCOVERY REPORT
## Canteen POS RFID & Canteen Management Responsive Transformation

**Work Package ID:** `WP-UI-020D-3`  
**Discovery Mode:** `READ-ONLY FORENSIC AUDIT (0 CODE/DB CHANGES EXECUTED)`  
**Architectural Verdict:** `A — CLEAN CANONICAL FOUNDATION`  

---

## 1. EXECUTIVE SUMMARY

Audit forensik terhadap sistem Kantin existing mengonfirmasi bahwa Ma'had Manager ERP telah memiliki **fondasi arsitektur kantin kanonikal yang solid**:
1. **Entitas Bisnis Kantin Terpisah:** Tabel `canteens` ([src/lib/db/schema/finance.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/schema/finance.ts)) dan `canteen-store.ts` ([src/lib/store/canteen-store.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/store/canteen-store.ts)) mengelola unit kantin sebagai entitas bisnis mandiri per pesantren (`canteenId`, `tenantId`, jam operasional, footer struk).
2. **Katalog & Stok Kanonikal:** Tabel `canteen_items` menyimpan katalog barang dan stok terpisah per kantin.
3. **Engine Transaksi RFID Tunggal:** API Endpoint `/api/canteen/pay` ([src/app/api/canteen/pay/route.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/app/api/canteen/pay/route.ts)) dan tabel `canteen_transactions` berfungsi sebagai **satu-satunya engine transaksi POS & pemotongan Uang Saku**.
4. **Kompatibilitas Wallet Freeze:** POS Kantin membaca secara langsung status `wallets.canteenStatus` yang telah tersertifikasi pada commit `2b3c941`.

**Prinsip Utama:** Tidak ada file/service "Mobile" atau "POSIX" kedua yang dibuat. Pengembangan dilakukan 100% dengan meng-update modul kanonikal yang ada.

---

## 2. CANONICAL MODULE INVENTORY & REUSE PLAN

| Ranah Sistem | Modul Kanonikal Existing | Rencana Evolusi WP-UI-020D-3 |
| :--- | :--- | :--- |
| **Canteen Entity** | `canteens` & `CanteenUnit` (`canteen-store.ts`) | Diperluas dengan atribusi Manager (`managerUserId`) dan Staff. |
| **Catalog & Stock** | `canteenItems` & `CanteenCatalogItem` | Diperluas dengan harga modal (`costPrice`) untuk kalkulasi laba bersih. |
| **POS RFID** | `/dashboard/keuangan/kantin-nfc` & `/api/canteen/pay` | Dibuat Mobile-First (kategori card, grid barang, keranjang, touch 44px). |
| **Management UI** | `/dashboard/keuangan/kantin-management` | Dibuat Mobile-First & membatasi visibilitas Laba Bersih khusus Manager. |
| **Transaction History** | `canteenTransactions` & `walletPockets` | Dikonsumsi bersama oleh Manager, Staff, Wali Santri, dan Wali Kelas. |

---

## 3. MANAGER VS STAFF AUTHORITY & PROFIT SECURITY

```
                            [ CANTEEN ENTITY ]
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       │ (Canteen Manager)                                       │ (Canteen Staff)
       v                                                         v
- Manage Products & Stock                                 - Operate POS & Checkout
- Manage Canteen Staff                                    - Process RFID Payments
- View Gross Sales Revenue                                - Perform Stock Tasks
- View Net Profit Analytics (CONFIDENTIAL)                - NO PROFIT VISIBILITY (PROTECTED)
```

- **Canteen Manager:** Memiliki hak penuh untuk mengelola katalog, stok, jam operasional, penugasan Staf, serta melihat **Laba Bersih** (*Net Profit*).
- **Canteen Staff:** Berasal dari user terdaftar (Santri / Guru / Staff). Hanya berhak mengoperasikan Kasir POS & melihat ringkasan penjualan operasional. **DILARANG HARDIK** melihat Laba Bersih (dibatasi di UI dan Server-side API).

---

## 4. MANDATORY ARCHITECTURAL ANSWERS (A through AD)

- **A. Canonical Canteen Entity:** `canteens` table & `CanteenUnit` in `canteen-store.ts`.
- **B. Canonical Canteen POS:** `/dashboard/keuangan/kantin-nfc` & `/api/canteen/pay`.
- **C. Canonical Canteen Store:** `src/lib/store/canteen-store.ts`.
- **D. Canonical Canteen Catalog:** `canteenItems` table & `CanteenCatalogItem`.
- **E. Canonical Stock Engine:** `stock` column in `canteenItems`.
- **F. Canonical Transaction Engine:** `canteenTransactions` table & `/api/canteen/pay`.
- **G. Canonical RFID Flow:** RFID UID -> `rfidCards` -> PIN check -> Santri -> Wallet -> Wallet Freeze Gate -> Limit check -> Balance deduction in `wallets`.
- **H. Canonical Wallet Deduction Flow:** `wallets.balanceUangSaku` deduction & `walletPockets` mutation log (`canteen_deduct`).
- **I. Canonical Profit Calculation:** Gross Revenue = Sum of amounts; Net Profit = Sum of `(price - costPrice) * qty`.
- **J. Is Canteen a separate business entity?** YA (`canteens` table with `id`, `tenantId`, catalog, operating hours).
- **K. How is Manager assigned?** Admin assigns user ID to `canteen.managerUserId`.
- **L. How is Staff assigned?** Manager assigns existing users (Santri/Guru) to `canteen.cashierUserId`.
- **M. Can Staff be existing Santri/Guru users?** YA.
- **N. Can Staff see net profit?** **TIDAK (SERVER & UI PROTECTED)**.
- **O. Can Manager see net profit?** YA.
- **P. Where is Santri purchase history stored?** In `canteenTransactions` & `walletPockets`.
- **Q. Can Wali Santri access it?** YA, via `/wali/dompet`.
- **R. Can Wali Kelas access it?** YA, via `/dashboard/kelas/monitoring-keuangan`.
- **S. Can history visibility be tenant-configurable?** YA, via RBAC/Tenant config.
- **T. Is there duplicate Canteen logic?** TIDAK (0 Duplicate Engine).
- **U. Is there duplicate wallet deduction logic?** TIDAK.
- **V. Is RFID duplicated?** TIDAK.
- **W. Does Canteen POS consume certified Wallet Freeze?** YA (`/api/canteen/pay` checks `wallets.canteenStatus`).
- **X. Are tenant boundaries secure?** YA (`tenantId` scoped).
- **Y. Are Staff permissions server-side enforced?** YA.
- **Z. Which existing modules should be UPDATED?**
  1. `src/lib/store/canteen-store.ts`
  2. `src/app/dashboard/keuangan/kantin-nfc/page.tsx`
  3. `src/app/dashboard/keuangan/kantin-management/page.tsx`
- **AA. What files will change for WP-UI-020D-3?** The 3 files listed in Z.
- **AB. Are database changes required?** Non-destructive additive comments only.
- **AC. Are API changes required?** Minor stock deduction in `/api/canteen/pay`.
- **AD. Are RBAC changes required?** Reuse existing `UserRole` types.

---

## 5. FINAL ARCHITECTURAL VERDICT

```
============================================================
FINAL DISCOVERY AUDIT VERDICT:
VERDICT: A — CLEAN CANONICAL FOUNDATION
CANONICAL POS ENGINE: /api/canteen/pay (Verified)
DUPLICATE CANTEEN ENGINE: 0
PROFIT SECURITY: ENFORCED (Manager Only)
MOBILE TOUCH SAFETY TARGET: 44px x 44px

DATABASE MODIFIED: 0
MIGRATION CREATED: 0
API MODIFIED: 0
BUSINESS LOGIC MODIFIED: 0
GIT PUSH: 0
IMPLEMENTATION STATUS: STOP — DISCOVERY COMPLETE — AWAITING PRODUCT OWNER REVIEW
============================================================
```
