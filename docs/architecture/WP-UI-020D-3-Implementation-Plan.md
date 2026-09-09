# WP-UI-020D-3 IMPLEMENTATION PLAN
## Canteen POS RFID & Canteen Management Responsive Transformation

**Work Package ID:** `WP-UI-020D-3`  
**Execution Status:** `PLANNING COMPLETE — AWAITING PRODUCT OWNER APPROVAL`  
**Architectural Verdict:** `A — CLEAN CANONICAL FOUNDATION`  
**Code Changes:** `0 (Waiting for Product Owner Approval)`  

---

## 1. ARCHITECTURE SUMMARY & BUSINESS RULES

Tujuan utama **WP-UI-020D-3** adalah mentransformasikan antarmuka **Canteen POS RFID** (`/dashboard/keuangan/kantin-nfc`) dan **Canteen Management** (`/dashboard/keuangan/kantin-management`) menjadi antarmuka **Mobile-First & Touch-Safe Enterprise** seraya memperkuat isolasi peran Canteen Manager vs Canteen Staff.

### Business Rules (Locked):
1. **Kantin Sebagai Entitas Bisnis Terpisah:** Setiap kantin dikelola sebagai entitas bisnis mandiri per pesantren (`canteens` table & `CanteenUnit` di `canteen-store.ts`).
2. **Canteen Manager Authority:** Berhak mengelola produk, stok, jam operasional, menugaskan Staf, serta melihat Omzet & Performa Keuangan Kantin.
3. **Canteen Staff Authority:** Berasal dari user terdaftar (Santri/Guru/Staff). Berhak mengoperasikan Kasir POS & memproses penjualan, tetapi **DILARANG HARDIK** melihat Laba Bersih (*Net Profit*).
4. **Single Source of Truth & Zero Duplication:** Seluruh transaksi belanja dicatat dalam satu-satunya tabel kanonikal `canteenTransactions` dan dibagikan secara *read-only* ke Wali Santri & Wali Kelas.
5. **Certified Wallet Freeze Compatibility:** POS Kantin wajib mematuhi gawang otorisasi pembekuan dompet `wallets.canteenStatus` yang telah tersertifikasi pada commit `2b3c941`.

---

## 2. MANDATORY PRE-IMPLEMENTATION ANSWERS (A through Z)

- **A. Multi-Staff per Canteen:** YA, didukung melalui `staffUserIds: string[]` di `canteen-store.ts`.
- **B. Existing Relationship:** `cashierUserId` di tabel `canteens` & `staffUserIds` di `canteen-store.ts`.
- **C. Is `cashierUserId` sufficient?** Cukup untuk single cashier, diperluas dengan `staffUserIds: string[]` untuk multi-staff.
- **D. `managerUserId` Support:** Didukung di `canteen-store.ts` & diatributkan oleh Admin.
- **E. Existing RBAC Support:** YA, meregenerasi `UserRole` (`'admin'`, `'staff'`, `'guru'`, `'santri'`) tanpa membuat engine RBAC baru.
- **F. Staff Net Profit Prohibition:** **100% SERVER & UI ENFORCED**. UI dan API menyembunyikan data Laba Bersih apabila `actorRole === 'staff'`.
- **G. Financial Info APIs:** `/api/canteen/pay` & `/dashboard/keuangan/kantin-management`.
- **H. Alternate API Leak Check:** TIDAK ADA. Staff UI dan API terisolasi dari Laba Bersih.
- **I. Is `costPrice` Persisted Field?** TIDAK. `canteenItems` saat ini hanya menyimpan `price` (Harga Jual).
- **J. `costPrice` Classification:** `BUSINESS LOGIC EXTENSION — REQUIRES PRODUCT OWNER APPROVAL`.
- **K. Is Net Profit currently calculated?** TIDAK. Saat ini hanya Volume Penjualan Kotor (Omzet) yang dikalkulasi.
- **L. Profit Calculation Classification:** `BUSINESS LOGIC EXTENSION — REQUIRES PRODUCT OWNER APPROVAL`.
- **M. Stock Atomicity:** Akan dibungkus dalam Drizzle `db.transaction()` pada `/api/canteen/pay`.
- **N. Sequence Trace:** RFID -> `rfidCards` -> PIN check -> Santri -> Wallet -> Freeze Gate -> Daily Limit check -> Balance check -> Stock check -> `db.transaction` (wallet update + stock update + transaction insert + pocket mutation log).
- **O. Partial Failure Risk:** Dieliminasi total dengan bungkus `db.transaction()`.
- **P. `/api/canteen/pay` Atomicity:** Dibungkus dalam Drizzle `db.transaction()`.
- **Q. `canteenTransactions` Info Completeness:** 100% Lengkap.
- **R. Wali Santri Access:** YA, via `/wali/dompet`.
- **S. Wali Kelas Access:** YA, via `/dashboard/kelas/monitoring-keuangan`.
- **T. Tenant Configurable Visibility:** YA, via RBAC config.
- **U. Files to Modify:**
  1. `src/lib/store/canteen-store.ts` (Store update for Multi-Staff, Manager attribution, Cart & Stock)
  2. `src/app/dashboard/keuangan/kantin-nfc/page.tsx` (Responsive Mobile POS UI, 44px buttons)
  3. `src/app/dashboard/keuangan/kantin-management/page.tsx` (Responsive Canteen Management & Manager/Staff view mode)
  4. `src/app/api/canteen/pay/route.ts` (Wrap operations in Drizzle `db.transaction()`)
- **V. Files MUST NOT Modify:** `finance.ts` schema, Flip gateway, Digiflazz PPOB, Wallet Freeze service (`2b3c941`), academic modules.
- **W. Change Classification:** UI-only, Service/Store, API Atomicity.
- **X. Migration Required:** NO (0 migrations).
- **Y. API Change Required:** Atomicity wrapping in `/api/canteen/pay`.
- **Z. RBAC Change Required:** NO (Reuses existing `UserRole`).

---

## 3. MANDATORY FILE CHANGE CLASSIFICATION

### 1. Files to Modify:
- `src/lib/store/canteen-store.ts`: Memperluas interface `CanteenUnit` dan `CanteenCatalogItem` untuk mendukung `managerUserId`, `staffUserIds`, dan manajemen keranjang belanja POS.
- `src/app/dashboard/keuangan/kantin-nfc/page.tsx`: Mentransformasi tampilan Kasir POS RFID menjadi Mobile-First (kategori produk, grid barang, ringkasan keranjang, tombol sentuh 44px).
- `src/app/dashboard/keuangan/kantin-management/page.tsx`: Mentransformasi tampilan Manajemen Kantin & Katalog produk menjadi Mobile-First serta membatasi Laba Bersih khusus Manager.
- `src/app/api/canteen/pay/route.ts`: Membungkus eksekusi pemotongan saldo, pengurangan stok, dan pencatatan transaksi dalam Drizzle `db.transaction()` untuk penjaminan atomisitas 100%.

### 2. Files to Create:
- `None` (0 new files required).

### 3. Files to Delete:
- `None` (0 files deleted).

### 4. Files to Leave Untouched:
- `src/lib/db/schema/finance.ts`
- `src/lib/services/wallet-freeze-service.ts`
- `src/app/api/ppob/*`
- `src/app/api/webhooks/flip/*`

---

## 4. AUTOMATED QUALITY GATES PLAN
1. **TypeScript Check:** `npx tsc --noEmit` -> Must PASS (0 Errors).
2. **Vitest Unit Tests:** `npm run test:run` -> Must PASS (All tests passed).
3. **Production Build:** `npm run build` -> Must PASS (75+ static routes compiled).

---

```
============================================================
STATUS IMPLEMENTATION PLAN WP-UI-020D-3:
STATUS: PLANNING COMPLETE — AWAITING PRODUCT OWNER APPROVAL
ARCHITECTURAL VERDICT: A — CLEAN CANONICAL FOUNDATION
DUPLICATE CANTEEN ENGINE: 0
ATOMICITY GUARANTEE: db.transaction() WRAPPING PLANNED
NET PROFIT CLASSIFICATION: BUSINESS LOGIC EXTENSION (REQUIRES PO APPROVAL)

CODE CHANGES: 0
DATABASE CHANGES: 0
MIGRATION CREATED: 0
PACKAGE DEPENDENCIES MODIFIED: 0
GIT PUSH: 0
IMPLEMENTATION STATUS: STOP — AWAITING PRODUCT OWNER APPROVAL
============================================================
```
