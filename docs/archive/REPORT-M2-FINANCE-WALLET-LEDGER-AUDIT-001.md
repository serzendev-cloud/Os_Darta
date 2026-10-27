# REPORT-M2-FINANCE-WALLET-LEDGER-AUDIT-001
## Laporan Audit Arsitektur Keuangan, Wallet, Ledger, Merchant & Otorisasi RFID
### Berdasarkan Keputusan Resmi Product Owner (MANDATE M2-FINANCE-ARCHITECTURE-003)

**Project:** APP MA’HAD / Os_Darta  
**Role:** Antigravity Lead Agent / Finance Architecture Auditor (ZenOrion)  
**Authority:** Product Owner (Process_PO) & Acting Process_Mandor (Mandor 2)  
**Mandate Type:** Evidence-Based, Read-Only Architecture Audit  
**Execution Status:** AUDIT ONLY — NO IMPLEMENTATION AUTHORIZED  
**Date of Audit:** 19 Oktober 2026  

---

## 1. EXECUTIVE SUMMARY

Sesuai dengan **MANDATE M2-FINANCE-ARCHITECTURE-003**, telah dilakukan audit forensik mendalam (*read-only forensic audit*) terhadap seluruh arsitektur keuangan, saldo orang tua, struktur wallet, mutasi saldo, ledger, sistem merchant, otorisasi RFID/PIN, dan integrasi pembayaran di repositori APP MA’HAD (`Os_Darta`).

### Kesimpulan Temuan Kunci:
1. **Model B (Saldo Keseluruhan/Internal Terpadu)**:
   - `[TERBUKTI / BELUM TERSEDIA DI KODE]`: Konsep saldo internal orang tua untuk pembayaran tagihan dan uang saku santri secara bebas biaya payment gateway belum memiliki tabel khusus di skema Drizzle aktif. Ditemukan tabel terisolasi `ppob_wali_balances` di `ppob.ts`, namun tabel tersebut murni untuk transaksi PPOB Digiflazz milik SaaS owner tanpa `tenant_id` dan tidak terhubung ke administrasi pesantren.
2. **Tabungan Santri & Alur Setoran PO**:
   - `[TERBUKTI / ARSITEKTUR TERCATAT / KODE PARSIAL]`: Kolom `balance_tabungan` telah ada di tabel `wallets` (`finance.ts:L10`). Namun, alur bisnis resmi yang ditetapkan PO (santri meminta setoran ke admin keuangan, admin membuka tabungan, memindahkan dana dari uang saku ke tabungan melalui tap RFID + PIN santri) **belum diimplementasikan** di service layer maupun API.
3. **Keamanan RFID dan PIN**:
   - `[TERBUKTI / TERPENUHI SEBAGIAN]`: Verifikasi PIN santri saat belanja RFID sudah berjalan di `/api/canteen/pay` (`finance.ts` & `rfid.ts`). Namun, persyaratan keamanan kritis PO berupa **pemblokiran otomatis setelah 3x PIN salah**, **kolom counter percobaan gagal**, dan **fitur reset PIN oleh Wali Kelas / Admin Keuangan** belum tersedia di skema database maupun endpoint.
4. **Multi-Merchant & Rincian Item POS**:
   - `[TERBUKTI / TERPENUHI SEBAGIAN]`: Database saat ini masih menggunakan model monolitik `canteens`, `canteen_items`, dan `canteen_transactions`. Transaksi POS saat ini hanya menyimpan teks bebas `itemsDescription` tanpa tabel terstruktur `transaction_items` (kuantitas, harga satuan, subtotal). Tiga model merchant yang ditetapkan PO (Bagi Hasil, 100% Pondok, 100% Operator) belum dimodelkan.
5. **Integritas Ledger & Zero Balance Column Invariant**:
   - `[TERBUKTI / ARSITEKTUR BERTENTANGAN]`: Di kode aktif saat ini, saldo `balance_uang_saku` dan `balance_tabungan` dimutasi secara langsung (*in-place UPDATE*) pada baris tabel `wallets`, sementara Aturan Mutlak 4 dalam spesifikasi pembayaran menetapkan bahwa saldo tidak boleh disimpan sebagai kolom yang di-update melainkan diturunkan dari jurnal ledger append-only.

---

## 2. EXECUTION BOUNDARY & BUKTI READ-ONLY

Audit ini dijalankan secara ketat dalam batas kewenangan *Controlled Architecture Review*:
- **File Source Code Diubah**: **0 file**
- **Skema Database / Migrasi Dibuat**: **0 file**
- **DDL / DML Database Dijalankan**: **0 query**
- **Git Commit / Push / Branch Mutated**: **0 operasi**
- **Nilai Rahasia (.env / API Keys)**: **Tidak dibaca / tidak ditampilkan**
- **Transaksi Uji Nyata**: **0 transaksi dijalankan**

---

## 3. REPOSITORY, BRANCH, COMMIT, DAN STATUS GIT

Pemeriksaan status lingkungan kerja per 19 Oktober 2026:

| Parameter Lingkungan | Bukti Aktual Repositori | Status Verifikasi |
|---|---|---|
| **Workspace Aktif** | `E:\Projects\Os_Darta` | `[TERBUKTI]` |
| **Active Branch** | `preview` | `[TERBUKTI]` |
| **Commit HEAD** | `e61a237 feat(tenant): harden tenant resolver Phase A and A1 contracts` | `[TERBUKTI]` |
| **Worktree Terdaftar** | 1. `E:/Projects/Os_Darta` (`e61a237 [preview]`)<br>2. `E:/Projects/Os_Darta-domain-a2.7-candidate` (`e61a237 detached HEAD`) | `[TERBUKTI]` |
| **Status File Git** | Tidak ada file source code (`src/` atau `drizzle/`) yang dimodifikasi. Hanya dokumen laporan audit yang disimpan di `docs/architecture/`. | `[TERBUKTI]` |

---

## 4. INVENTORY SELURUH WALLET DAN LEDGER

Hasil penelusuran terhadap seluruh skema database, migrasi, dan service layer:

| ID | Entitas / Tabel | File Referensi & Baris | Pemilik Saldo | Tenant Scoped | Tipe Saldo | Mutasi / Ledger Terkait | Status Implementasi | Status Bukti |
|---|---|---|---|---|---|---|---|---|
| **W-01** | `wallets` | `src/lib/db/schema/finance.ts:L4-22` | Santri & Wali | Ya (`tenant_id`) | `balance_uang_saku` (integer)<br>`balance_tabungan` (integer) | `wallet_pockets` | AKTIF (In-place update) | `[TERBUKTI]` |
| **W-02** | `wallet_pockets` | `src/lib/db/schema/finance.ts:L25-37` | Santri | Ya (`tenant_id`) | Log mutasi nominal (`amount`, `balance_before`, `balance_after`) | Target insert mutasi belanja & top-up | AKTIF (Insert-only log) | `[TERBUKTI]` |
| **W-03** | `ppob_wali_balances` | `src/lib/db/schema/ppob.ts:L33-41` | Wali Santri | **TIDAK** (Platform Global) | `balance` (integer) | `ppob_transactions` | AKTIF (Khusus Digiflazz PPOB) | `[TERBUKTI]` |
| **W-04** | `canteen_transactions`| `src/lib/db/schema/finance.ts:L90-103`| Merchant / Santri | Ya (`tenant_id`) | Nominal belanja (`amount`) | Pengurang uang saku di POS | AKTIF | `[TERBUKTI]` |
| **W-05** | `academic_ledger_records` | `src/lib/db/schema/academic_ledger.ts:L4-16` | Santri | Ya (`tenant_id`) | Skor nilai (`raw_score`, `weighted_score`) | Bukan saldo finansial (Akademik Rapor) | AKTIF | `[TERBUKTI]` |
| **W-06** | `WALI_WALLET` (Model B) | `Sprint-1-Financial-Flow...md:L28` | Wali Santri | Ya | Saldo terpadu keluarga internal | Belum ada tabel fisik di database | PROPOSAL / DRAFT | `[TERBUKTI]` |
| **W-07** | `ledger_entries` | `docs/spesifikasi-pembayaran.md:L54` | Multi-Tenant Platform | Ya | Double-entry debit/kredit | Belum ada tabel fisik di database | SPESIFIKASI KANONIS | `[TERBUKTI]` |

---

## 5. SOURCE OF TRUTH UNTUK SETIAP SALDO

Audit menemukan kesenjangan mendasar antara arsitektur target spesifikasi dengan kode implementasi saat ini:

### Kondisi Aktual di Kode (Ground-Truth Code):
1. **Saldo Uang Saku Santri**:
   - *Source of Truth*: Kolom `wallets.balance_uang_saku` (`finance.ts:L9`).
   - *Mekanisme*: Dimutasi langsung melalui `db.update(wallets).set({ balanceUangSaku: newBalance })` di `/api/canteen/pay:L165-170` dan `/api/webhooks/flip:L86-92`.
   - *Audit Trail*: Baris mutasi dicatat di `wallet_pockets` (`mutation_type = 'canteen_deduct'` atau `'topup'`), namun tabel `wallet_pockets` tidak pernah di-query untuk menghitung ulang saldo.
2. **Saldo Tabungan Santri**:
   - *Source of Truth*: Kolom `wallets.balance_tabungan` (`finance.ts:L10`).
   - *Mekanisme*: Dimutasi langsung melalui update kolom di webhook Flip (`/api/webhooks/flip:L89`).
3. **Saldo PPOB**:
   - *Source of Truth*: Kolom `ppob_wali_balances.balance` (`ppob.ts:L38`). Murni untuk transaksi pulsa/token PLN.

### Kesenjangan terhadap Aturan Mutlak Spesifikasi:
- **Aturan Mutlak 4 (`spesifikasi-pembayaran.md:L56`)**: *"Saldo tenant tidak disimpan sebagai kolom yang di-update; saldo = jumlah entri ledger pada akun `TENANT_PAYABLE:{tenant_id}`."*
- **Sprint 1 Invariant (`Sprint-1-Financial-Flow...md:L161-164`)**: *"Derived Wallet Balance & Immutable Ledger Principle: Calculated Balance = sum(Credit Entries) - sum(Debit Entries)."*

### Risiko Arsitektur:
Penyimpanan saldo secara langsung pada kolom tabel (`balance_uang_saku`) tanpa transaksi ledger double-entry berisiko mengalami *drift*, kehilangan riwayat koreksi, serta rentan terhadap *race condition* jika santri men-tap kartu di dua kasir kantin secara bersamaan.

---

## 6. AUDIT MODEL PEMBAYARAN PER TENANT (MODEL A VS MODEL B)

Product Owner telah menetapkan dua model pembayaran yang dapat dikonfigurasi per tenant:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   KONFIGURASI PEMBAYARAN PER TENANT                    │
├───────────────────────────────────┬────────────────────────────────────┤
│ MODEL A: Bayar Langsung Gateway   │ MODEL B: Saldo Internal Terpadu    │
│ - Wali bayar via Flip per tagihan │ - Wali top-up saldo deposit 1x     │
│ - Gateway fee per transaksi Flip  │ - Bayar tagihan / saku bebas fee   │
└───────────────────────────────────┴────────────────────────────────────┘
```

### 6.1 Audit Implementasi Model A (Bayar Langsung via Gateway)
- **Status di Kode**: `[TERBUKTI / PROTOTIPE PARSIAL]`
- **Bukti Aktual**:
  - `src/lib/payment/flip.ts:L28-63`: Fungsi `createBill` memanggil Flip for Business `/v2/pwf/bill`.
  - `src/app/wali/tagihan/checkout/page.tsx:L24-29`: Halaman checkout wali membuat invoice Flip.
  - `src/app/api/webhooks/flip/route.ts:L11-50`: Webhook menerima status `SUCCESS` dan mengupdate `invoices.status`.
- **Kekurangan**:
  - Belum ada tabel `payment_orders` dan `payment_allocations` di database.
  - Biaya admin masih di-mock dan belum menggunakan pure function `calculateFees()`.

### 6.2 Audit Implementasi Model B (Saldo Keseluruhan / Internal Terpadu)
- **Status di Kode**: `[TERBUKTI / BELUM TERSEDIA DI KODE]`
- **Analisis Kepatuhan Keputusan PO**:
  - PO melarang penyebutan "saldo wali" jika menyiratkan wallet terpisah yang tidak sesuai keputusan PO. Model B adalah **saldo keseluruhan/internal terpadu** yang dikelola di bawah akun keluarga/wali pada tenant bersangkutan.
  - **Mekanisme Kerja yang Disyaratkan**:
    1. *Top-Up*: Wali mengisi saldo terpadu melalui 1 kali transfer Flip. Dipotong biaya gateway 1 kali.
    2. *Alokasi Bebas Gateway Fee*: Dana di saldo internal dapat dipindahkan ke tagihan SPP anak atau ke saldo uang saku anak secara murni database transaction **tanpa memanggil Flip API dan tanpa biaya gateway**.
    3. *Pencegahan Double Spending*: Alokasi internal memotong saldo terpadu dan mengkredit kewajiban secara atomik dalam satu transaksi PostgreSQL.
- **Kekurangan di Repositori**:
  - Skema database saat ini belum memiliki tabel untuk menampung saldo internal terpadu ini (di luar tabel PPOB yang tidak ber-tenant).
  - Skema `tenant_settings` (`src/lib/db/schema.ts:L15-34`) **belum memiliki kolom konfigurasi model pembayaran** (`payment_model`: `'MODEL_A'` | `'MODEL_B'` | `'BOTH'`).

---

## 7. AUDIT TABUNGAN SANTRI DAN ALUR SETORAN RESMI PO

Product Owner menetapkan 7 aturan bisnis alur tabungan santri:

| No | Aturan Alur Tabungan PO | Status Implementasi | Status Bukti | Fakta Temuan di Kode |
|---|---|---|---|---|
| 1 | Santri meminta ke admin keuangan agar sebagian uang saku disisihkan ke tabungan | `BELUM TERSEDIA` | `[TERBUKTI]` | Tidak ada API / antarmuka permohonan setoran tabungan. |
| 2 | Admin keuangan membuka tabungan jika belum tersedia | `TERPENUHI SEBAGIAN`| `[TERBUKTI]` | Tabel `wallets` otomatis dibuat saat santri dibuat, memiliki `balance_tabungan = 0` (`finance.ts:L10`). |
| 3 | Admin keuangan memasukkan nominal setoran | `BELUM TERSEDIA` | `[TERBUKTI]` | Belum ada form / server action admin keuangan untuk input nominal setoran tabungan. |
| 4 | Santri menempelkan RFID dan memasukkan PIN dalam proses setoran | `BELUM TERSEDIA` | `[TERBUKTI]` | Endpoint verifikasi RFID + PIN saat ini **hanya ada untuk belanja kantin** (`/api/canteen/pay`). Belum ada endpoint verifikasi RFID untuk setoran tabungan. |
| 5 | Setoran tercatat sebagai perpindahan dari uang saku ke tabungan (bukan pendapatan pondok) | `BELUM TERSEDIA` | `[TERBUKTI]` | Belum ada logic mutasi shift saldo (`uang_saku` -> `tabungan`) di kode. Di prototipe lama (`/api/webhooks/flip`), tabungan hanya bertambah dari top-up invoice luar. |
| 6 | Penarikan tabungan dilakukan langsung melalui petugas keuangan | `BELUM TERSEDIA` | `[TERBUKTI]` | Belum ada API pencairan tunai tabungan di kasir bendahara. |
| 7 | Penarikan tabungan tidak dilakukan melalui platform wali santri | `SUDAH TERPENUHI` | `[TERBUKTI]` | Di `src/app/wali/dompet/page.tsx`, wali santri **sama sekali tidak memiliki tombol penarikan tabungan**. |

---

## 8. AUDIT MERCHANT, POS, DAN KELENGKAPAN RINCIAN ITEM

Sesuai Keputusan PO Bagian 4.5:
1. **Tiga Model Pengelolaan Merchant**:
   - Model 1: Bagi hasil berdasarkan kontrak masing-masing merchant.
   - Model 2: Seluruh hasil untuk pondok (pencatatan uang masuk dan keluar).
   - Model 3: Seluruh hasil untuk operator sesuai kontrak.
   - *Status di Kode*: `[BELUM TERSEDIA]`. Tabel `canteens` (`finance.ts:L60`) tidak memiliki field `revenue_model` atau konfigurasi persentase bagi hasil.
2. **Karakteristik Multi-Merchant Non-Kantin**:
   - *Status di Kode*: `[TERPENUHI SEBAGIAN]`. Di UI prototipe (`canteen-store.ts:L28`), unit seperti Koperasi Pesantren dipaksakan menjadi data baris di tabel `canteens`. Belum ada klasifikasi tipe merchant (`RETAIL`, `SERVICE`, `COLLECTION`).
3. **Penyimpanan Rincian Barang POS Secara Terstruktur**:
   - *Status di Kode*: `[BELUM TERSEDIA]`.
   - *Bukti Forensik*:
     Di tabel `canteen_transactions` (`src/lib/db/schema/finance.ts:L98`), data barang hanya disimpan dalam **1 kolom string tunggal**:
     ```typescript
     itemsDescription: text('items_description'),
     ```
     Di `/api/canteen/pay/route.ts:L182`, kasir hanya mengirim string teks biasa (misal `"Nasi Goreng Spesial (x2)"`).
   - *Evaluasi PO*: Ini melanggar mandat PO yang mensyaratkan pencatatan terstruktur: item, kuantitas, harga satuan, diskon jika ada, subtotal, dan total untuk audit trail.

---

## 9. AUDIT RFID, PIN, DAN KEAMANAN OTORISASI (PO 4.1)

Audit forensik terhadap 8 aturan keamanan RFID dan PIN dari Product Owner:

| No | Aturan Keamanan RFID & PIN PO | Status Implementasi | Status Bukti | Bukti Kode Aktual |
|---|---|---|---|---|
| 1 | Semua pembayaran RFID di seluruh merchant wajib melalui PIN | `SUDAH TERPENUHI` | `[TERBUKTI]` | `/api/canteen/pay/route.ts:L24-28` menolak transaksi jika PIN tidak diisi. |
| 2 | RFID hanya menggunakan saldo uang saku santri | `SUDAH TERPENUHI` | `[TERBUKTI]` | `/api/canteen/pay/route.ts:L151-163` hanya memotong `wallet.balanceUangSaku`. Saldo tabungan tidak disentuh. |
| 3 | RFID tidak menyimpan saldo uang secara mandiri (saldo di server) | `SUDAH TERPENUHI` | `[TERBUKTI]` | Kartu RFID hanya menyimpan `cardUid` (`rfid.ts:L8`). Saldo murni berada di database PostgreSQL `wallets`. |
| 4 | Tiga kali PIN salah menyebabkan fungsi pembayaran RFID diblokir | `BELUM TERSEDIA` | `[TERBUKTI]` | `/api/canteen/pay/route.ts:L65-69` hanya mengembalikan HTTP 401 saat PIN salah. **Tidak ada pencatatan counter gagal dan tidak ada auto-block ke status 'blocked'**. |
| 5 | Reset PIN yang sah sekaligus membuka blokir pembayaran | `BELUM TERSEDIA` | `[TERBUKTI]` | Belum ada service atau API reset PIN kartu RFID. |
| 6 | Wali kelas dan admin keuangan berwenang mereset PIN dan mengaktifkan kembali | `BELUM TERSEDIA` | `[TERBUKTI]` | Di `src/config/permissions.ts`, permission `RESET_RFID_PIN` belum didefinisikan untuk role `wali_kelas` maupun `admin`. |
| 7 | Pemakaian kartu santri lain tidak diperbolehkan | `SUDAH TERPENUHI` | `[TERBUKTI]` | `/api/canteen/pay/route.ts:L44-84` mengikat `cardUid` secara unik ke `santriId` dan mencocokkannya ke database. |
| 8 | Pencegahan saldo negatif dan pemotongan ganda saat PIN salah | `SUDAH TERPENUHI` | `[TERBUKTI]` | Verifikasi PIN dilakukan di langkah 2 (baris 65), pengecekan saldo di langkah 6 (baris 151), sebelum pemotongan saldo di langkah 7 (baris 165). |

---

## 10. DIAGRAM ALUR DATA DARI TOP-UP HINGGA PEMBAYARAN

```
[ MODEL A: GATEWAY LANGSUNG ]
Wali Santri ──► Checkout Tagihan ──► Flip Bill Gateway ──► Webhook Paid ──► Pelunasan Invoice
                                                                       └──► Kredit TENANT_PAYABLE

[ MODEL B: SALDO INTERNAL TERPADU ]
Wali Santri ──► Top-Up Saldo Terpadu ──► Flip Gateway ──► Webhook Paid ──► Kredit Saldo Terpadu Keluarga
                                                                            │ (Bebas Biaya Gateway)
                        ┌───────────────────────────────────────────────────┴───────────────────────┐
                        ▼                                                                           ▼
               Bayar Tagihan Santri                                                Tambah Uang Saku Santri
        (Debet Saldo Terpadu Keluarga)                                      (Debet Saldo Terpadu Keluarga)
        (Kredit TENANT_PAYABLE SPP)                                         (Kredit CUSTODIAL_WALLET_SAKU)

[ TRANSAKSI MERCHANT POS (RFID) ]
Santri Tap RFID di Kasir ──► Input PIN ──► Cek Freeze & Limit ──► Cek Saldo Uang Saku ──► Potong Uang Saku
                                                                                      └──► Catat Transaksi POS
                                                                                      └──► Kredit Kasir/Pondok

[ SETORAN TABUNGAN SANTRI (PO 4.3) ]
Santri Minta Setor ──► Admin Input Nominal ──► Tap RFID & PIN Santri ──► Potong Saldo Uang Saku
                                                                      └──► Tambah Saldo Tabungan Santri
                                                                      └──► Jurnal Perpindahan Fidusia
```

---

## 11. CONTOH JURNAL DOUBLE-ENTRY DENGAN STATUS BUKTI

Berikut adalah pemetaan pembukuan akuntansi double-entry untuk 5 alur transaksi utama:

### 11.1 Top-Up Saldo Internal Terpadu Model B (Rp 1.000.000)
- *Status Bukti*: `[INDIKASI / USULAN ARSITEKTUR]` (Belum ada tabel ledger di DB).

| No | Nama Akun | Debet (Rp) | Kredit (Rp) | Keterangan |
|---|---|---|---|---|
| 1 | `GATEWAY_CLEARING` | 1.003.200 | 0 | Kas masuk Flip SaaS (Termasuk admin fee Rp3.200) |
| 2 | `TENANT_FAMILY_DEPOSIT:{tenant_id}:{wali_id}` | 0 | 1.000.000 | Liabilitas titipan saldo terpadu keluarga |
| 3 | `PLATFORM_REVENUE` (admin_fee) | 0 | 3.200 | Pendapatan SaaS |
| 4 | `GATEWAY_FEE_EXPENSE` | 4.000 | 0 | Beban gateway Flip |
| 5 | `GATEWAY_CLEARING` | 0 | 4.000 | Potongan saldo oleh Flip |

### 11.2 Alokasi Bebas Gateway Fee (Model B -> Uang Saku Santri Rp 200.000)
- *Status Bukti*: `[INDIKASI / USULAN ARSITEKTUR]`.

| No | Nama Akun | Debet (Rp) | Kredit (Rp) | Keterangan |
|---|---|---|---|---|
| 1 | `TENANT_FAMILY_DEPOSIT:{tenant_id}:{wali_id}` | 200.000 | 0 | Pengurangan saldo terpadu keluarga |
| 2 | `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | 0 | 200.000 | Penambahan saldo uang saku santri |

*Catatan: Zero Gateway Fee. Tidak ada uang keluar dari bank.*

### 11.3 Belanja Santri di Kantin Internal Pondok (Rp 15.000)
- *Status Bukti*: `[INDIKASI / USULAN ARSITEKTUR]`.

| No | Nama Akun | Debet (Rp) | Kredit (Rp) | Keterangan |
|---|---|---|---|---|
| 1 | `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | 15.000 | 0 | Saldo uang saku santri berkurang |
| 2 | `TENANT_INCOME_CANTEEN:{tenant_id}` | 0 | 15.000 | Pendapatan unit kantin pondok bertambah |

### 11.4 Belanja Santri di Koperasi Rekanan / Konsesi (Rp 25.000)
- *Status Bukti*: `[INDIKASI / USULAN ARSITEKTUR]`.

| No | Nama Akun | Debet (Rp) | Kredit (Rp) | Keterangan |
|---|---|---|---|---|
| 1 | `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | 25.000 | 0 | Saldo uang saku santri berkurang |
| 2 | `MERCHANT_PAYABLE:{tenant_id}:{merchant_id}` | 0 | 25.000 | Timbul hutang pondok ke operator koperasi |

### 11.5 Setoran Tabungan Santri dari Uang Saku via RFID PIN (Rp 50.000)
- *Status Bukti*: `[INDIKASI / USULAN ARSITEKTUR]`.

| No | Nama Akun | Debet (Rp) | Kredit (Rp) | Keterangan |
|---|---|---|---|---|
| 1 | `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | 50.000 | 0 | Saldo uang saku berkurang |
| 2 | `SANTRI_SAVINGS_LIABILITY:{tenant_id}` | 0 | 50.000 | Saldo tabungan santri bertambah |

*Catatan Kritis PO: Transaksi ini adalah perpindahan liabilitas fidusia, BUKAN pendapatan baru pondok.*

---

## 12. DUPLICATE LEDGER DAN BALANCE RISKS

Audit menemukan 3 risiko duplikasi saldo dan inkonsistensi pembukuan:

1. **Risiko Koeksistensi Kolom Saldo vs Ledger**:
   - Jika tabel `ledger_entries` diimplementasikan sementara kolom `balance_uang_saku` di tabel `wallets` tetap dipertahankan, akan tercipta **dua sumber kebenaran**. Jika terjadi kegagalan sistem saat menulis mutasi, saldo kolom dan saldo hasil kalkulasi ledger dapat berselisih (*out of sync*).
2. **Risiko Ambiguitas `ppob_wali_balances`**:
   - Tabel `ppob_wali_balances` di `src/lib/db/schema/ppob.ts` dibuat tanpa kolom `tenant_id`. Jika wali santri memiliki anak di dua pesantren berbeda yang menggunakan SaaS ini, saldo PPOB tersebut menjadi global dan dapat menimbulkan konflik hukum kepemilikan dana antar-pesantren.
3. **Risiko Pencatatan Mutasi Ganda di `wallet_pockets`**:
   - `wallet_pockets` saat ini mencatat `balance_before` dan `balance_after` secara denormalisasi. Jika ada rollback parsial pada level aplikasi, nomor urut mutasi dapat terputus.

---

## 13. IDEMPOTENCY, ATOMICITY, CONCURRENCY, DAN TENANT ISOLATION RISKS

### 13.1 Concurrency Risk pada POS Canteen (`/api/canteen/pay/route.ts`)
- **Fakta `[TERBUKTI]`**:
  Pada baris 87–91, handler mengambil data wallet dengan `SELECT`:
  ```typescript
  const walletResult = await db.select().from(wallets).where(...);
  ```
  Kemudian pada baris 165–170 melakukan `UPDATE`:
  ```typescript
  await db.update(wallets).set({ balanceUangSaku: newBalance }).where(...);
  ```
- **Risiko Kritis**:
  Query ini **TIDAK menggunakan row-level lock (`FOR UPDATE`)** dan tidak dibungkus dalam `db.transaction()`.
  Jika santri meminjamkan kartunya atau terjadi request ganda dalam milidetik yang sama pada dua mesin POS berbeda, kedua request akan membaca saldo awal yang sama, menyebabkan kondisi **Double Spending** (saldo berkurang lebih sedikit dari yang seharusnya dibelanjakan).

### 13.2 Webhook Idempotency Risk (`/api/webhooks/flip/route.ts`)
- **Fakta `[TERBUKTI]`**:
  Handler memeriksa status invoice:
  ```typescript
  if (invoice.status === 'SUCCESS') return NextResponse.json(...);
  ```
- **Risiko**:
  Jika Flip mengirimkan webhook duplikat secara paralel, kedua thread dapat membaca status `PENDING` pada saat bersamaan sebelum salah satunya menyelesaikan update, memicu penambahan saldo ganda di `wallets.balanceUangSaku`.

---

## 14. GAP ANALYSIS TERHADAP KEPUTUSAN PRODUCT OWNER

| Area Kebijakan PO | Keputusan / Ketetapan PO | Kondisi Aktual di Repositori | Kesenjangan (Gap) | Tingkat Risiko |
|---|---|---|---|---|
| **PIN Lockout** | 3x salah PIN -> auto block kartu | HTTP 401 tanpa counter gagal | Belum ada counter percobaan salah dan auto-block | **TINGGI** |
| **PIN Reset Auth** | Wali Kelas & Admin Keuangan berwenang reset PIN | Belum ada permission & API | Fitur reset PIN belum tersedia | **SEDANG** |
| **Model B Payment** | Saldo terpadu keluarga, alokasi bebas gateway fee | Baru ada tabel PPOB non-tenant | Belum ada skema saldo terpadu keluarga per tenant | **TINGGI** |
| **Tenant Config** | Model A, Model B, atau Keduanya | Belum ada kolom di `tenantSettings` | Konfigurasi model pembayaran belum ada | **SEDANG** |
| **Setoran Tabungan** | Pindah dari uang saku via RFID + PIN | Tabungan hanya bertambah dari Flip | Alur setoran tabungan via RFID belum ada | **TINGGI** |
| **Penarikan Tabungan**| Fisik di bendahara, dilarang via portal wali | Portal wali bersih dari tombol tarik | Sudah sesuai di UI, backend pencairan belum ada | **RENDAH** |
| **Multi-Merchant** | 3 model hasil (Bagi Hasil, Pondok, Operator) | Tabel monolitik `canteens` | Belum ada model pembagian hasil dan non-kantin | **SEDANG** |
| **Rincian Item POS**| Rincian terstruktur (qty, harga, subtotal) | 1 kolom teks `itemsDescription` | Belum ada tabel item transaksi POS terstruktur | **SEDANG** |

---

## 15. ALTERNATIF ARSITEKTUR DENGAN TRADE-OFF

### Alternatif 1: Penyimpanan Saldo (Balance Column vs Pure Derived Ledger)
- **Opsi A: Pure Derived Ledger (Spesifikasi Pembayaran)**:
  - *Kelebihan*: Auditabilitas 100% mutlak, kebal terhadap manipulasi langsung, tidak ada risiko drift.
  - *Kelemahan*: Query `SUM(credit) - SUM(debit)` pada setiap transaksi POS kantin dapat membebani PostgreSQL serverless saat volume transaksi mencapai ribuan tap per jam istirahat.
- **Opsi B: Hybrid Balance Engine with Strict Atomic Lock (Rekomendasi)**:
  - *Desain*: Mempertahankan kolom `balance_uang_saku` di tabel `wallets` sebagai *read-cache terproteksi*, namun setiap mutasi wajib dijalankan di dalam `db.transaction()` dengan `SELECT ... FOR UPDATE` dan menulis entri jurnal ledger append-only secara simultan. Rekonsiliasi berkala mencocokkan saldo kolom dengan saldo ledger.
  - *Trade-off*: Kecepatan transaksi POS tetap tinggi (< 200 ms) sekaligus memenuhi kepatuhan akuntansi double-entry.

### Alternatif 2: Penempatan Saldo Internal Terpadu Model B
- **Opsi A: Membuat Tabel Baru `family_internal_wallets`**:
  - *Kelebihan*: Pemisahan batas tenant dan hak asuh wali santri sangat bersih.
  - *Kelemahan*: Menambah 1 tabel baru dan relasi Drizzle.
- **Opsi B: Menggunakan Tabel `wallets` yang Ada dengan `pocket_type = 'family_deposit'`**:
  - *Kelebihan*: Memanfaatkan struktur tabel `wallets` dan `wallet_pockets` yang sudah ada.
  - *Kelemahan*: Tabel `wallets` saat ini memiliki `santri_id` yang `notNull()`, padahal saldo terpadu Model B adalah milik akun keluarga (Wali) untuk menaungi beberapa santri sekaligus.
  - *Kesimpulan*: Opsi A lebih unggul secara arsitektural karena mematuhi relasi 1 Wali -> N Santri.

---

## 16. DAFTAR KEPUTUSAN YANG MASIH MEMERLUKAN KEPUTUSAN PRODUCT OWNER

1. **Format Hash dan Algoritma PIN Kartu**:
   - Saat ini kode menggunakan perbandingan plain string `card.hashedPin !== pin && card.hashedPin !== 'pin_' + pin`.
   - *Pertanyaan PO*: Apakah disetujui standardisasi PIN menggunakan algoritma PBKDF2 atau bcrypt dengan salt kartu pada migrasi mendatang?
2. **Durasi Blokir 3x Salah PIN**:
   - Jika PIN salah 3 kali, apakah kartu diblokir permanen sampai di-reset manual oleh Wali Kelas/Admin Keuangan, atau ada auto-unblock setelah masa tunggu (cooldown misal 2 jam)?
3. **Penyimpanan Detail Item POS Layanan / Titik Penagihan**:
   - Untuk Collection Point denda atau laundry kiloan, apakah struktur `merchant_transaction_items` disetujui menggunakan field opsional `obligation_reference_id` menggantikan `item_id`?
4. **Kebijakan Refund Transaksi Model B**:
   - Jika wali membatalkan alokasi dari Saldo Terpadu ke SPP, apakah dana otomatis kembali ke Saldo Terpadu internal tanpa opsi pencairan tunai ke rekening bank luar?

---

## 17. DAFTAR HAL YANG BELUM DAPAT DIVERIFIKASI

Sesuai standar bukti mandat:
1. **Perilaku Fisik Kartu RFID di Lapangan** `[TIDAK DAPAT DISIMPULKAN]`:
   - Jenis chip kartu fisik (Mifare Classic 1K vs Desfire EV1) dan reader hardware yang digunakan di pesantren belum dapat diverifikasi tanpa pengujian fisik.
2. **Kinerja Concurrency Lock pada Supabase Transaction Pooler** `[BELUM DIVERIFIKASI]`:
   - Penggunaan `prepare: false` pada `postgres.js` di lingkungan serverless pooler memerlukan pengujian staging untuk membuktikan perilaku `SELECT ... FOR UPDATE` saat terjadi transaksi konkuren tinggi.

---

## 18. REKOMENDASI LANGKAH SELANJUTNYA

Setelah laporan audit ini ditinjau dan disahkan oleh Product Owner dan Process_Mandor:
1. **Fase Pra-Implementasi**:
   - Menyelaraskan keputusan PO pada butir 16.
   - Mengesahkan rancangan DDL pelengkap di dokumen arsitektur tanpa mengubah kode saat ini.
2. **Fase Hardening Otorisasi & Concurrency (Mandat Baru)**:
   - Menambahkan locking atomik `FOR UPDATE` pada `/api/canteen/pay` dan handler webhook Flip.
   - Menambahkan counter 3x gagal PIN dan mekanisme blokir kartu.
3. **Fase Domain Extension (Mandat Baru)**:
   - Menerbitkan skema Model B dan Multi-Merchant Generik sesuai rekomendasi laporan ini.

---

## 19. EXPLICIT STOP DECLARATION — NO IMPLEMENTATION PERFORMED

Sesuai aturan tata kelola **MANDATE M2-FINANCE-ARCHITECTURE-003**:
- Audit ini telah selesai dilaksanakan seutuhnya dalam mode **STRICT READ-ONLY**.
- Tidak ada baris kode produksi, skema database, migrasi Drizzle, konfigurasi runtime, maupun data Supabase yang dimutasi atau dijalankan.
- Tidak ada task engineering T1–T26 yang dimulai.

**STATUS AKHIR: READ-ONLY AUDIT COMPLETE — IMPLEMENTATION STATUS: NOT AUTHORIZED.**  
Antigravity Lead Agent berhenti dan menyerahkan laporan ini kepada **Product Owner (Process_PO)** dan **Acting Process_Mandor (Mandor 2)**.
