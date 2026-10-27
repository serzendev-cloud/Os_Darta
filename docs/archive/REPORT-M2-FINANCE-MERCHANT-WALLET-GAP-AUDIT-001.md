# REPORT-M2-FINANCE-MERCHANT-WALLET-GAP-AUDIT-001
## Audit Menyeluruh & Gap Analysis: Wallet Orang Tua, Tabungan Santri, Multi-Merchant, Collection Merchant, RFID Fine Payment & Financial Monitoring

**Otoritas:** Acting Process_Mandor — Mandor 2  
**Product Owner:** Process_PO  
**Pelaksana:** Antigravity Lead Agent — ZenOrion  
**Mode Operasi:** Controlled Architecture Review — Strict Read-Only  
**Status Dokumen:** AUDIT ONLY — NO IMPLEMENTATION  
**Dasar Kontrak Keuangan:**
- `docs/spesifikasi-pembayaran.md` (Aturan Mutlak 1–13 Flip Proxy Core)
- `docs/architecture/REPORT-M2-FINANCE-ARCHITECTURE-001.md`
- `docs/architecture/SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md`
- `docs/architecture/Sprint-1-Financial-Flow-Wallet-Payment-Architecture.md` (Contract Extension Locked)
- `docs/architecture/Sprint-1-Payment-Architecture-Contract.md`
**Dokumen Pelengkap Terkait:** `docs/architecture/DRAFT-FINANCE-MERCHANT-WALLET-EXTENSION-001.md`  
**Tanggal:** 19 Oktober 2026  

---

## 1. RINGKASAN EKSEKUTIF

Audit arsitektur komprehensif telah dilaksanakan terhadap seluruh repositori APP MA’HAD, dokumen arsitektur yang telah diratifikasi, Drizzle schema, service layer, route handlers, tipe TypeScript, serta antarmuka UI.

### Temuan Kunci Audit (Ground-Truth Reality):
1. **Pemisahan 3 Kantong Keuangan (Parent, Savings, Uang Saku)**:
   - **Saldo Uang Saku Santri** `[TERBUKTI / TERPENUHI SEBAGIAN]`: Kolom `balance_uang_saku` dan mutasi `wallet_pockets` sudah ada di `src/lib/db/schema/finance.ts`, serta terintegrasi dengan endpoint `/api/canteen/pay` dan Wallet Freeze F-WF-01/02. Namun, belum terhubung ke double-entry ledger platform (`CUSTODIAL_WALLET_LIABILITY`).
   - **Saldo Tabungan Santri** `[TERBUKTI / ARSITEKTUR TERKUNCI / KODE PARSIAL]`: Kolom `balance_tabungan` ada di database, dan kontrak tata kelola pencairan tabungan santri 5-step state machine dengan NFC Approval santri telah terkunci di `Sprint-1-Financial-Flow-Wallet-Payment-Architecture.md`. Namun, antarmuka operasional admin tabungan, rekonsiliasi buku tabungan fisik, dan audit trail penarikan belum diimplementasikan di kode backend.
   - **Saldo Orang Tua (Wali Wallet)** `[TERBUKTI / BELUM TERSEDIA DI KODE]`: Konsep `WALI_WALLET` telah tercantum di taksonomi Sprint 1, tetapi di skema database Drizzle dan API saat ini belum ada tabel `wali_wallets`. Pembayaran tagihan internal dari Saldo Orang Tua tanpa biaya gateway belum tersedia.
2. **Multi-Merchant Generic vs Monolitik Kantin** `[TERBUKTI / TERPENUHI SEBAGIAN]`:
   - Saat ini tabel database bernama kaku: `canteens`, `canteen_items`, dan `canteen_transactions`.
   - Di sisi UI prototype (`src/lib/store/canteen-store.ts`), unit usaha seperti `Koperasi Pesantren` (menjual kitab, sarung, alat tulis) dipaksakan masuk ke dalam entitas kantin. Belum ada model generik `merchants` yang membedakan jenis usaha, lokasi, dan operator konsesi.
3. **Collection Merchant & Pembayaran Denda (Punishment)** `[TERBUKTI / BELUM TERSEDIA]`:
   - Domain pelanggaran santri (`pelanggaran`, `master_hukuman`, `hukuman`, `governance_cases`) di `src/lib/db/schema.ts` **sama sekali belum memiliki atribut finansial (denda/nominal)**.
   - Belum ada konsep `Collection Merchant` (titik penerimaan non-penjualan barang) untuk menerima denda atau biaya ganti rugi fasilitas.
   - **Invariant Penting**: Alur penerimaan denda via RFID belum ada di kode. Diperlukan penegakan arsitektur mutlak bahwa penerbitan denda **TIDAK BOLEH** memotong saldo uang saku santri secara otomatis.
4. **Laporan Merchant & Riwayat untuk Wali** `[TERBUKTI / BELUM TERSEDIA]`:
   - Tabel `canteen_transactions` dan `wallet_pockets` hanya menjadi target penulisan (`insert`) saat belanja. Tidak ada satupun API endpoint atau antarmuka dashboard wali yang menampilkan riwayat mutasi belanja, nama merchant, atau rincian item belanja anak.

---

## 2. DAFTAR SUMBER YANG DIAUDIT

Audit forensik memeriksa bukti aktual pada:
- **Dokumentasi Arsitektur**:
  - `docs/spesifikasi-pembayaran.md` (Spesifikasi Inti Flip Proxy Core, Aturan Mutlak 1–13)
  - `docs/architecture/REPORT-M2-FINANCE-ARCHITECTURE-001.md` (Audit Mandat 001)
  - `docs/architecture/SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md` (Spesifikasi Billing & Unified Checkout)
  - `docs/architecture/Sprint-1-Financial-Flow-Wallet-Payment-Architecture.md` (Kontrak Tabungan & NFC Approval)
  - `docs/architecture/Sprint-1-Payment-Architecture-Contract.md` (Ownership Boundary & Webhook Source of Truth)
  - `docs/architecture/Sprint-1-Domain-Architecture.md` (Definisi Entity `CanteenOutlet`)
- **Skema Database & Migrasi**:
  - `src/lib/db/schema/finance.ts` (`wallets`, `wallet_pockets`, `invoices`, `canteens`, `canteen_items`, `canteen_transactions`)
  - `src/lib/db/schema/rfid.ts` (`rfid_cards`, `attendance_logs`)
  - `src/lib/db/schema/identity.ts` (`users`, `tenants`, `tenant_roles`, `user_tenant_memberships`, `wali_santri_relationships`)
  - `src/lib/db/schema.ts` (`pelanggaran`, `master_hukuman`, `hukuman`, `governance_cases`)
  - `drizzle/0000_neat_machine_man.sql`
  - `drizzle/0006_wallet_freeze_metadata.sql` (Candidate Worktree)
- **Implementasi Service, Route & Store**:
  - `src/app/api/canteen/pay/route.ts` (API RFID Payment Kantin POS)
  - `src/app/api/webhooks/flip/route.ts` (Webhook Flip Prototype)
  - `src/lib/store/canteen-store.ts` (Mock LocalStorage Canteen & Catalog Items)
  - `src/config/permissions.ts` (Canonical Permission Map)
  - `src/types/index.ts` (Tipe Data Pelanggaran, Hukuman, UserRole)
- **Antarmuka UI**:
  - `src/app/wali/dompet/page.tsx` (Portal Kontrol Wallet Freeze Wali)
  - `src/app/wali/tagihan/checkout/page.tsx` (Prototipe Checkout SPP & Top-Up)
  - `src/app/dashboard/keuangan/kantin-nfc/page.tsx` (UI POS Kasir Kantin RFID)
  - `src/app/dashboard/keuangan/kantin-management/page.tsx` (UI Pengelolaan Unit Kantin & Menu)
  - `src/app/dashboard/kelas/monitoring-keuangan/page.tsx` (Monitoring Keuangan Santri oleh Wali Kelas)

---

## 3. MATRIKS STATUS PEMENUHAN KEBUTUHAN (A s/d H)

| Kode | Kebutuhan Bisnis | Status Pemenuhan | Status Bukti | Rujukan Bukti Utama |
|---|---|---|---|---|
| **A1** | **Saldo Orang Tua (Wali Wallet)**<br>• Saldo internal wali<br>• Top-up eksternal via gateway<br>• Bayar tagihan/top-up anak tanpa fee gateway<br>• Pemindahan saldo atomik | `BELUM TERSEDIA` | `[TERBUKTI]` | Konsep ada di `Sprint-1-Financial-Flow-Wallet-Payment-Architecture.md:L28`, namun **tidak ada** tabel `wali_wallets` di `src/lib/db/schema/finance.ts` atau `identity.ts`. |
| **A2** | **Saldo Tabungan Santri**<br>• Simpanan per santri dikelola pondok<br>• Bukan rekening bank perorangan<br>• Kelola oleh admin keuangan berwenang<br>• Riwayat setoran/penarikan dapat diaudit<br>• Tidak bisa belanja di kantin<br>• Terpisah dari uang saku | `TERPENUHI SEBAGIAN` | `[TERBUKTI]` | Kolom `balance_tabungan` ada di `wallets` (`finance.ts:L10`). Kontrak tata kelola penarikan 5 langkah & NFC ada di `Sprint-1-Financial-Flow...md`. Namun service penarikan tunai, pencatatan mutasi setoran, dan buku tabungan fisik **belum diimplementasikan di kode backend**. |
| **A3** | **Saldo Uang Saku Santri**<br>• Kebutuhan harian santri<br>• Pembayaran kantin/merchant via RFID POS<br>• Riwayat pengeluaran & top-up<br>• Terpisah dari tabungan | `TERPENUHI SEBAGIAN` | `[TERBUKTI]` | Tabel `wallets.balance_uang_saku` dan `wallet_pockets` ada di `finance.ts:L9,25`. Endpoint potong saldo via RFID ada di `/api/canteen/pay`. Wallet Freeze ada di `0006_wallet_freeze_metadata.sql`. Namun belum terintegrasi ke double-entry ledger platform (`CUSTODIAL_WALLET_LIABILITY`). |
| **A-Sem**| **Semantik & Total Saldo Dashboard**<br>• Tidak menggabungkan dana titipan menjadi pendapatan pondok | `BELUM TERSEDIA` | `[TERBUKTI]` | Di UI `src/app/wali/dompet/page.tsx`, ringkasan saldo belum ditampilkan (baru kontrol freeze). Di `monitoring-keuangan/page.tsx`, saldo uang saku dan tabungan sudah dipisahkan kolomnya. |
| **B** | **Dashboard Wali & Pemantauan Pengeluaran**<br>• 3 kantong terpisah<br>• Riwayat transaksi belanja anak<br>• Nama merchant, tanggal, nominal, status<br>• Rincian barang POS (jika tersedia)<br>• Top-up & refund<br>• Hak akses khusus anak sendiri | `BELUM TERSEDIA` | `[TERBUKTI]` | Tabel `canteen_transactions` menyimpan `vendorName`, `itemsDescription`, `amount`, `createdAt` (`finance.ts:L90`). Namun **tidak ada endpoint baca (GET)** atau halaman riwayat pengeluaran di `src/app/wali/`. |
| **C** | **Multi-Merchant yang Fleksibel**<br>• Generik (Kantin, Koperasi, Toko Kitab, Laundry, dll)<br>• Kelola aktivasi merchant<br>• Multi-kasir & operator via permission<br>• Hubungan unit usaha & lokasi<br>• Laporan per merchant & konsolidasi<br>• Histori bertahan saat nonaktif | `TERPENUHI SEBAGIAN` | `[TERBUKTI]` | Skema `canteens` di `finance.ts:L60` baru mencakup unit kantin. Di `canteen-store.ts:L28` koperasi dimasukkan ke kantin. Model generik `merchants` dengan klasifikasi tipe unit dan multi-kasir belum tersedia di skema resmi. |
| **D** | **Dua Model Pengelolaan Merchant**<br>• Model 1: Dikelola langsung pondok<br>• Model 2: Dikelola unit usaha/rekanan konsesi | `BELUM TERSEDIA` | `[TERBUKTI]` | Belum ada pembedaan atribut `operator_type` ('INTERNAL' vs 'CONCESSION') atau akun hutang vendor (`MERCHANT_PAYABLE`) di skema database. |
| **E** | **Collection Merchant (Penerimaan)**<br>• Titik penerimaan non-jual barang<br>• Denda tata tertib, ganti rugi fasilitas, kegiatan<br>• Pemisahan titik terima vs tagihan vs ledger | `BELUM TERSEDIA` | `[TERBUKTI]` | Konsep Collection Merchant belum pernah dimodelkan. Tabel `canteen_transactions` hanya memproses `itemsDescription` belanja makanan/minuman. |
| **F** | **Pembayaran Denda via RFID (Aturan Khusus)**<br>• Penetapan oleh otoritas tata tertib<br>• Santri tap RFID untuk identifikasi kewajiban denda<br>• Verifikasi denda & pembayaran sah<br>• Update status denda<br>• Masuk laporan Collection Merchant<br>• **DILARANG**: Auto-potong uang saku saat denda terbit<br>• **DILARANG**: Tabungan santri untuk denda tanpa izin | `BELUM TERSEDIA` | `[TERBUKTI]` | Skema `pelanggaran` dan `hukuman` di `src/lib/db/schema.ts:L196-247` **sama sekali tidak memiliki kolom nominal denda**. Tidak ada alur integrasi RFID ke pembayaran denda. |
| **G** | **Laporan per Merchant**<br>• Payer, santri/wali, kewajiban/barang, nominal, kasir, waktu, status<br>• Total penerimaan per periode<br>• Rekonsiliasi dengan ledger<br>• Tidak otomatis dianggap laba yayasan | `BELUM TERSEDIA` | `[TERBUKTI]` | Tidak ditemukan API laporan transaksi merchant di seluruh repositori (`canteen_transactions` hanya di-insert di `/api/canteen/pay`). |
| **H** | **Integrasi Payment Core & Ledger**<br>• Pembedaan gateway vs internal parent wallet vs uang saku POS vs tabungan<br>• Zero gateway fee pada transfer internal<br>• Tidak ada double counting<br>• Uang saku & tabungan aman dari auto-denda | `TERPENUHI SEBAGIAN` | `[TERBUKTI]` | Dokumen `REPORT-M2-FINANCE-ARCHITECTURE-001.md` dan `SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md` sudah merancang jurnal `CUSTODIAL_WALLET_LIABILITY`. Namun integrasi parent wallet internal, pembayaran denda, dan merchant payable belum tercakup. |

---

## 4. DAFTAR FITUR YANG SUDAH TERSEDIA DAN HARUS DIPERTAHANKAN (REUSE BEFORE REBUILD)

Sesuai prinsip *Reuse before Rebuild*, fitur-fitur berikut telah terbukti ada di repositori dan **WAJIB DIPERTAHANKAN**:

1. **Smart Card RFID & Pairing KTA Santri** (`src/lib/db/schema/rfid.ts:L4-14`):
   - Tabel `rfid_cards` mengikat `cardUid` (chip UID) dengan `santriId` dan `hashedPin`.
   - Mekanisme verifikasi PIN 4–6 digit santri di `/api/canteen/pay` (`card.hashedPin !== pin`).
2. **Limit Belanja Harian Terpusat** (`src/app/api/canteen/pay/route.ts:L121-148`):
   - Perhitungan total belanja harian santri lintas seluruh unit usaha (`totalSpentToday + amount > dailyLimit`).
   - Mencegah santri menghabiskan uang saku melebihi batas yang ditetapkan orang tua/wali kelas.
3. **Wallet Freeze State Engine (F-WF-01 & F-WF-02)**:
   - Terbukti lulus 59 tes Vitest di candidate worktree (`0006_wallet_freeze_metadata.sql`).
   - Aturan pembekuan kartu: `suspended_by_walikelas`, `suspended_by_wali`, `blocked`.
   - **Keputusan Terkunci**: Status freeze hanya memblokir belanja kantin/POS, **TIDAK memblokir top-up** dari wali santri.
4. **Relasi Hak Akses 1 Wali -> N Santri** (`src/lib/db/schema/identity.ts:L116-131`):
   - Tabel `wali_santri_relationships` memastikan orang tua hanya dapat melihat dan mengelola dompet santri yang sah sebagai anak asuhnya.
5. **Katalog Barang & Multi-Unit Kantin Awal** (`src/lib/db/schema/finance.ts:L60-87`):
   - Tabel `canteens` dan `canteen_items` sudah mendukung multi-lokasi dan harga jual per barang. Dapat dievolusikan menjadi skema generik `merchants`.
6. **Alur Governance Pelanggaran Santri** (`src/lib/db/schema.ts:L196-265`):
   - Tabel `pelanggaran`, `master_hukuman`, `hukuman`, dan `governance_cases`.
   - Alur penetapan hukuman sudah ada secara kesiswaan, sehingga penambahan denda finansial dapat dipasang sebagai ekstensi (*plug-in*) tanpa merombak mesin tata tertib.

---

## 5. DAFTAR KEKURANGAN & KONFLIK ARSITEKTUR

### Kekurangan Kritis (Gaps):
1. **Tidak Adanya Saldo Internal Orang Tua (`WALI_WALLET`)**:
   - Wali saat ini harus selalu memicu transaksi eksternal Flip untuk setiap pembayaran atau top-up. Tidak ada fasilitas deposit internal keluarga yang bebas biaya gateway saat membagikan uang saku ke anak-anaknya.
2. **Tidak Adanya Entitas Denda Finansial pada Pelanggaran**:
   - Di `master_hukuman` dan `hukuman`, sanksi hanya berupa teks deskripsi (misal: "Hafalan Tambahan", "Piket", "Skorsing"). Tidak ada field `is_fine`, `fine_amount`, atau status pelunasan denda.
3. **Penyempitan Konsep "Canteen" vs "Merchant"**:
   - Penggunaan nama tabel `canteens` membatasi pengembangan untuk unit usaha pesantren lain (Koperasi, Toko Kitab, Laundry, Percetakan).
4. **Ketiadaan Konsep Collection Point (Collection Merchant)**:
   - Sistem POS saat ini hanya dirancang untuk *retail shopping* (keranjang belanja item produk). Tidak ada alur untuk *obligation settlement* (petugas men-tap kartu RFID santri untuk menampilkan dan melunasi kewajiban denda/biaya).
5. **Ketiadaan API Riwayat Mutasi Dompet untuk Wali**:
   - Walaupun mutasi tercatat di `wallet_pockets`, wali santri tidak memiliki akses melihat mutasi tersebut di UI maupun API.

### Potensi Konflik & Pelanggaran Invariant:
1. **Risiko Auto-Deduction Denda**:
   - Jika denda pelanggaran langsung memotong saldo uang saku saat hukuman diterbitkan, ini melanggar hak santri dan wali, memicu saldo negatif, dan merusak transparansi. Audit ini mengunci bahwa pemotongan denda **TIDAK BOLEH OTOMATIS**.
2. **Pencampuran Kas Merchant dengan Laba Yayasan**:
   - Penerimaan merchant konsesi/koperasi pihak ketiga tidak boleh langsung dibukukan sebagai pendapatan bersih yayasan pondok, melainkan hutang vendor (`MERCHANT_PAYABLE`).

---

## 6. DIAGRAM ALUR SALDO & PUSAT INTEGRASI FINANSIAL

Arsitektur keuangan APP MA’HAD memisahkan secara tegas 3 kantong saldo internal dan 2 jenis transaksi merchant:

```
                               ┌────────────────────────────────────────────────┐
                               │             DANA EKSTERNAL WALI                │
                               │           (Bank Transfer / QRIS)               │
                               └───────────────────────┬────────────────────────┘
                                                       │ (Via Flip Gateway)
                                                       ▼
                               ┌────────────────────────────────────────────────┐
                               │        GATEWAY_CLEARING (Flip Proxy)           │
                               └───────┬────────────────────────────────┬───────┘
                                       │                                │
                       Top-Up Saldo    │                                │ Top-Up Langsung
                       Orang Tua       │                                │ Uang Saku / SPP
                                       ▼                                ▼
┌──────────────────────────────────────────────┐    Internal    ┌──────────────────────────────────────────────┐
│             KANTONG 1: SALDO ORANG TUA       │   Allocation   │          KANTONG 3: UANG SAKU SANTRI         │
│          (WALI_WALLET / Virtual Deposit)     ├───────────────►│        (wallets.balance_uang_saku)           │
│  - Bebas biaya admin saat alokasi internal   │  (Zero Gateway │  - Digunakan jajan harian santri di merchant │
│  - Bisa bayar SPP atau top-up uang saku      │      Fee)      │  - Terikat kartu RFID & limit belanja        │
└──────────────────────────────────────────────┘                └──────────────────────┬───────────────────────┘
                                                                                       │
┌──────────────────────────────────────────────┐                                       │ Belanja POS
│           KANTONG 2: TABUNGAN SANTRI         │                                       │ (Tap RFID + PIN)
│          (wallets.balance_tabungan)          │                                       ▼
│  - Simpanan santri dikelola pondok (Fidusia) │                        ┌──────────────────────────────┐
│  - Penarikan via 5-Step Approval + NFC Tap   │                        │      RETAIL MERCHANTS        │
│  - DILARANG untuk belanja kantin/denda       │                        │ (Kantin, Koperasi, Laundry)  │
└──────────────────────────────────────────────┘                        └──────────────┬───────────────┘
                                                                                       │
                                                                                       ▼
┌──────────────────────────────────────────────┐  Konfirmasi Bayar      ┌──────────────────────────────┐
│             KEWAJIBAN DENDA / GANTI RUGI     │  (Tap RFID + PIN       │     COLLECTION MERCHANTS     │
│        (Disciplinary Fines / Obligations)    │   atau Bayar Tunai)    │ (Pos Keamanan / Kesiswaan /  │
│  - Diterbitkan otoritas tata tertib          ├───────────────────────►│  Loket Pembayaran Denda)    │
│  - TIDAK memotong uang saku otomatis         │                        └──────────────┬───────────────┘
└──────────────────────────────────────────────┘                                       │
                                                                                       ▼
                                                                        ┌──────────────────────────────┐
                                                                        │     DOUBLE-ENTRY LEDGER      │
                                                                        │ - TENANT_DISCIPLINE_REVENUE  │
                                                                        │ - MERCHANT_PAYABLE (Rekanan) │
                                                                        │ - TENANT_INCOME (Unit Pondok)│
                                                                        └──────────────────────────────┘
```

---

## 7. MODEL RELASI TENANT, UNIT USAHA, OPERATOR, MERCHANT, DAN PETUGAS

Untuk mendukung Multi-Merchant yang fleksibel dan dua model pengelolaan, entitas dimodelkan secara terstruktur:

```
[ tenants ] (Pesantren)
    │
    ├── 1:N ── [ business_units ] (e.g. "Yayasan Pondok", "Koperasi Karyawan", "Unit Usaha Putri")
    │               │
    │               ├── 1:N ── [ tenant_merchants ]
    │                               │  - code, name, merchant_type ('RETAIL' | 'SERVICE' | 'COLLECTION')
    │                               │  - management_model ('INTERNAL_PONDOK' | 'THIRD_PARTY_OPERATOR')
    │                               │  - status ('ACTIVE' | 'INACTIVE')
    │                               │  - location, settlement_account_info
    │                               │
    │                               ├── 1:N ── [ merchant_operators ] (Operator / Pengelola Vendor)
    │                               │               └── references [ users.id ]
    │                               │
    │                               ├── 1:N ── [ merchant_cashiers ] (Petugas Kasir / Teller Koleksi)
    │                               │               └── references [ users.id ] via PIN/Permission
    │                               │
    │                               └── 1:N ── [ merchant_items ] (Katalog Barang - Khusus RETAIL)
```

---

## 8. ALUR PEMBAYARAN DENDA MELALUI RFID (TANPA AUTO-DEDUCTION)

Arsitektur menetapkan **8 Langkah Kanonis Penerimaan Denda Santri**:

```
[ Langkah 1: Penetapan ]
Otoritas Tata Tertib (Kepala Kesiswaan/Musyrif) mencatat pelanggaran santri.
Jika terdapat sanksi finansial, sistem menerbitkan record `student_fines` berstatus 'UNPAID'.
(TIDAK ADA PEMOTONGAN SALDO APAPUN PADA TAHAP INI).
       │
       ▼
[ Langkah 2: Kedatangan Santri ]
Santri mendatangi loket penegakan disiplin / Collection Merchant.
       │
       ▼
[ Langkah 3: Identifikasi RFID ]
Petugas Collection Merchant men-tap kartu RFID santri pada reader.
       │
       ▼
[ Langkah 4: Penyajian Kewajiban ]
Sistem memvalidasi `cardUid`, mencocokkan `santriId`, dan menampilkan daftar
denda berstatus 'UNPAID' yang melekat pada santri tersebut (Nominal, Pasal Pelanggaran, Tanggal).
       │
       ▼
[ Langkah 5: Pemilihan Metode Pembayaran ]
Santri / Petugas memilih metode pelunasan yang diizinkan oleh kebijakan tenant:
  - Opsi A: Potong Uang Saku Santri (Wajib memasukkan PIN Kartu Santri di reader)
  - Opsi B: Bayar Tunai di Tempat (Petugas menerima cash)
  - Opsi C: Ditagihkan ke Portal Wali (Wali melunasi via Saldo Orang Tua / Flip)
       │
       ▼
[ Langkah 6: Validasi Finansial ]
Jika memilih Opsi A (Uang Saku):
  - Sistem memeriksa kecukupan saldo `wallets.balance_uang_saku >= fine_amount`.
  - Sistem memeriksa bahwa status kartu bukan 'blocked'.
       │
       ▼
[ Langkah 7: Eksekusi Atomik ]
Dalam 1 transaksi database:
  - Potong saldo `wallets.balance_uang_saku` (atau catat kas tunai diterima).
  - Tulis mutasi di `wallet_pockets` (mutation_type: 'fine_deduct').
  - Ubah status `student_fines` menjadi 'PAID' (mencatat `paid_at`, `collected_by_cashier_id`).
  - Tulis baris di `merchant_transactions` pada Collection Merchant terkait.
  - Posting jurnal Double-Entry:
    * Debit: `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` (Rp X)
    * Kredit: `TENANT_DISCIPLINE_REVENUE:{tenant_id}` (Rp X)
       │
       ▼
[ Langkah 8: Bukti Transaksi ]
Struk / bukti pembayaran denda terbit; notifikasi terkirim ke portal wali santri.
```

---

## 9. MATRIKS ROLE-PERMISSION KEBIJAKAN FINANSIAL

Untuk mencegah penyalahgunaan wewenang dan menegakkan prinsip *Least Privilege*:

| Peran (Role) | Kelola Merchant | Kasir Belanja | Tetapkan Denda | Terima Pembayaran Denda | Penarikan Tabungan | Top-Up Uang Saku | Lihat Riwayat Belanja Anak |
|---|---|---|---|---|---|---|---|
| **Super Admin** | Audit Global | Ditolak | Ditolak | Ditolak | Ditolak | Ditolak | Ditolak |
| **Admin Tenant** | Akses Penuh | Akses Penuh | Monitoring | Monitoring | Monitoring | Monitoring | Monitoring |
| **Admin Keuangan (Bendahara)** | Akses Penuh | Monitoring | Monitoring | Akses Penuh | Eksekusi (T4/T17) | Akses Penuh | Monitoring |
| **Petugas Tata Tertib (Kesiswaan)** | Ditolak | Ditolak | **BISA (Tetapkan)** | Ditolak (Bukan Kasir) | Ditolak | Ditolak | Ditolak |
| **Petugas Collection Merchant** | Ditolak | Ditolak | Ditolak | **BISA (Terima Bayar)**| Ditolak | Ditolak | Ditolak |
| **Kasir Retail Merchant (Kantin)** | Ditolak | **BISA (Kasir)** | Ditolak | Ditolak | Ditolak | Ditolak | Ditolak |
| **Wali Santri** | Ditolak | Ditolak | Ditolak | BISA (via Portal) | Ditolak (Monitoring) | **BISA (Top-up)** | **BISA (Anak Sendiri)** |
| **Santri** | Ditolak | Ditolak | Ditolak | Ditolak | Tap NFC (Approval) | Ditolak | Ditolak |

---

## 10. RANCANGAN LAPORAN MERCHANT & DASHBOARD WALI

### 10.1. Dashboard Wali (Tampilan 3 Kantong & Riwayat Belanja)
- **Kartu Ringkasan 3 Kantong**:
  1. *Saldo Orang Tua*: Rp 450.000 (Tombol: Isi Saldo, Pindahkan ke Uang Saku Anak).
  2. *Uang Saku Santri (Ahmad)*: Rp 35.000 (Status: Aktif Belanja | Limit Harian: Rp 20.000 | Sisa Limit: Rp 12.000).
  3. *Tabungan Santri (Ahmad)*: Rp 1.500.000 (Status: Tersimpan Aman di Pondok).
- **Tabel Riwayat Pengeluaran Uang Saku**:
  - Kolom: Tanggal & Waktu, Nama Merchant/Kantin, Rincian Barang/Keterangan, Kasir, Nominal (Rp), Status.
  - Filter: Pilihan Santri (bagi wali dengan >1 anak), Rentang Tanggal, Pilihan Merchant.
  - Jaminan Keamanan: Data biaya modal, profit margin merchant, atau omset merchant tidak ditampilkan kepada wali.

### 10.2. Laporan Transaksi per Merchant
- **Laporan Retail Merchant (Kantin/Koperasi)**:
  - No Transaksi, Waktu, Card UID, Santri (Nama & Kelas), Item Terjual, Total Nominal, Kasir, Status.
  - Rekap Harian: Total Omset, Total Transaksi, Rekonsiliasi Kasir per Shift.
- **Laporan Collection Merchant (Pos Denda/Penerimaan)**:
  - No Bukti Terima, Waktu, Santri, Jenis Kewajiban (Denda / Ganti Rugi), No Referensi Pelanggaran, Metode Bayar (Uang Saku RFID / Tunai / Transfer Wali), Petugas Penerima, Nominal, Status.
  - Rekap Harian: Total Penerimaan Denda per Kategori Pelanggaran.

---

## 11. DAMPAK PADA DOUBLE-ENTRY LEDGER & FINANCIAL FLOWS

Setiap alur transaksi memiliki pemetaan jurnal akuntansi yang ketat:

| Jenis Transaksi | Sumber Dana | Akun Debet | Akun Kredit | Dampak Saldo Tenant |
|---|---|---|---|---|
| **Top-Up Saldo Orang Tua** | Bank / QRIS Wali | `GATEWAY_CLEARING` | `WALI_WALLET_LIABILITY:{tenant_id}:{wali_id}` | Tidak ada efek ke kas yayasan (Dana titipan wali) |
| **Transfer Internal Wali -> Uang Saku Anak** | Saldo Orang Tua | `WALI_WALLET_LIABILITY:{tenant_id}:{wali_id}` | `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | Tidak ada biaya gateway; murni pergeseran liabilitas |
| **Belanja Santri di Kantin Internal Pondok** | Uang Saku Santri | `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | `TENANT_INCOME_CANTEEN:{tenant_id}` | Saldo uang saku berkurang, pendapatan kantin pondok bertambah |
| **Belanja Santri di Koperasi / Rekanan Konsesi** | Uang Saku Santri | `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | `MERCHANT_PAYABLE:{tenant_id}:{merchant_id}` | Saldo uang saku berkurang, timbul kewajiban bayar ke operator rekanan |
| **Pembayaran Denda Santri via Uang Saku** | Uang Saku Santri | `CUSTODIAL_WALLET_LIABILITY:{tenant_id}` | `TENANT_DISCIPLINE_REVENUE:{tenant_id}` | Saldo santri berkurang, pendapatan denda tata tertib pondok bertambah |
| **Pembayaran Denda Santri via Tunai di Loket** | Kas Tunai Santri | `TENANT_CASH_ON_HAND:{tenant_id}` | `TENANT_DISCIPLINE_REVENUE:{tenant_id}` | Kas fisik di kasir bertambah, pendapatan denda diakui |
| **Penyetoran Tabungan Santri** | Tunai di Bendahara | `TENANT_BANK_SAVINGS_POOL:{tenant_id}` | `SANTRI_SAVINGS_LIABILITY:{tenant_id}` | Kas fisik bertambah, liabilitas tabungan santri bertambah |
| **Penarikan Tabungan Santri (5-Step + NFC Tap)**| Kas Bendahara | `SANTRI_SAVINGS_LIABILITY:{tenant_id}` | `TENANT_CASH_ON_HAND:{tenant_id}` | Liabilitas tabungan berkurang, kas fisik diserahkan ke santri |

---

## 12. USULAN ARCHITECTURE DECISION RECORDS (ADR)

### ADR-FIN-07: Arsitektur Generic Multi-Merchant & Collection Point
- **Status:** PROPOSED
- **Konteks:** Nama tabel `canteens` terlalu sempit dan tidak dapat menampung Koperasi, Toko Kitab, Laundry, serta Loket Penerimaan Denda (Collection Point).
- **Keputusan:** Merefaktor secara bertahap skema `canteens` menjadi `tenant_merchants` dengan atribut `merchant_type` ('RETAIL' | 'SERVICE' | 'COLLECTION') dan `management_model` ('INTERNAL_PONDOK' | 'THIRD_PARTY_OPERATOR').

### ADR-FIN-08: Kantong Internal Saldo Orang Tua (Wali Wallet)
- **Status:** PROPOSED
- **Konteks:** Wali santri sering melakukan top-up berulang untuk beberapa anak dan membayar aneka tagihan sekolah, sehingga membutuhkan saldo deposit keluarga internal agar terhindar dari biaya payment gateway berulang.
- **Keputusan:** Memperkenalkan entitas `wali_wallets` di bawah `users`. Saldo orang tua bertambah lewat 1 kali transfer gateway Flip, dan dapat dipindahkan secara atomik tanpa biaya admin ke SPP anak atau Uang Saku anak.

### ADR-FIN-09: Protokol Pembayaran Denda Bertingkat via RFID Tanpa Auto-Deduction
- **Status:** PROPOSED
- **Konteks:** Denda tata tertib santri berisiko memicu konflik dan saldo negatif jika dipotong otomatis dari uang saku saat pelanggaran dicatat.
- **Keputusan:** Penetapan denda hanya menerbitkan kewajiban tertunda (`student_fines`). Pelunasan denda wajib melalui proses aktif: santri mendatangi loket Collection Point, petugas men-tap kartu RFID untuk memanggil data denda, dan santri mengonfirmasi pembayaran dengan PIN kartu (jika potong uang saku) atau membayar tunai.

### ADR-FIN-10: Pemisahan Mutlak Saldo Tabungan dari Pembayaran Merchant & Denda
- **Status:** PROPOSED
- **Konteks:** Menjaga amanah dana titipan jangka panjang santri.
- **Keputusan:** Saldo `wallets.balance_tabungan` **DILARANG KERAS** dipotong oleh mesin POS kantin atau loket denda. Pencairan tabungan hanya dapat dilakukan melalui alur 5-langkah yang disahkan oleh Admin Keuangan dengan bukti fisik tap NFC santri.

---

## 13. DAFTAR PERTANYAAN & KEPUTUSAN MENUNGGU PRODUCT OWNER (PROCESS_PO)

Sebelum memasuki tahap perancangan teknis dan implementasi, Product Owner diharapkan memberikan keputusan atas butir-butir berikut:

1. **Model Rekanan Konsesi (Third-Party Operator)**: Apakah pesantren memberlakukan sistem bagi hasil (revenue sharing persentase) dengan pemilik kantin/koperasi rekanan, atau murni titip saldo (100% omset ditarik ke rekening pedagang)?
2. **Batas Maksimal Denda Uang Saku**: Apakah ada batasan maksimal denda yang boleh dipotong dari uang saku santri dalam satu transaksi (misal: denda di atas Rp 50.000 wajib dilunasi oleh wali melalui transfer portal)?
3. **Penyimpanan Detail Item POS**: Apakah sistem POS merchant wajib mencatat setiap baris barang secara terstruktur (`merchant_transaction_items` dengan kuantitas dan harga satuan), atau cukup ringkasan teks seperti saat ini (`items_description`) untuk menghemat beban storage database?
4. **Kebijakan Pengalihan Saldo Tabungan**: Apakah orang tua diizinkan mengajukan pemindahan saldo tabungan ke uang saku anak secara online, atau seluruh mutasi tabungan wajib melalui bendahara pondok secara luring (offline)?

---

## 14. ACCEPTANCE CRITERIA & TEST SCENARIOS MENDATANG

| Area Pengujian | Skenario Uji | Kriteria Hasil yang Diharapkan |
|---|---|---|
| **Parent Wallet Transfer** | Wali memindahkan Rp 100.000 dari Saldo Orang Tua ke Uang Saku Santri A | Saldo orang tua berkurang Rp 100.000, saldo santri bertambah Rp 100.000, **biaya gateway Rp 0**, tercatat mutasi ledger balancing. |
| **Canteen POS Spending** | Santri jajan Rp 15.000 di Kantin Asrama Putra | Uang saku berkurang Rp 15.000, sisa limit harian berkurang Rp 15.000, tercatat di `merchant_transactions`, status transaksi tampil di dashboard wali. |
| **Wallet Freeze Integrity** | Santri berstatus `suspended_by_wali` mencoba jajan di kantin | Transaksi ditolak HTTP 403 ("Fitur Belanja Dinonaktifkan oleh Wali Santri"), saldo tidak berkurang. |
| **RFID Fine Collection** | Santri melunasi denda keterlambatan Rp 10.000 di pos keamanan | Petugas men-tap RFID santri, memilih denda yang terdaftar, santri memasukkan PIN kartu yang benar, status denda menjadi 'PAID', saldo uang saku terpotong Rp 10.000. |
| **No Auto-Deduction** | Petugas kesiswaan menerbitkan hukuman denda Rp 25.000 pada santri | Status denda terbit 'UNPAID', saldo uang saku santri **TIDAK BERKURANG**, saldo tabungan **TIDAK BERKURANG**. |
| **Tabungan Isolation** | Endpoint POS merchant dipanggil dengan mencoba memotong saldo tabungan | Ditolak keras di level domain validation; saldo tabungan tidak tersentuh. |
| **Multi-Merchant Separation** | Kantin A dinonaktifkan oleh admin tenant | Kantin A tidak muncul di terminal POS aktif; seluruh data histori transaksi lampau Kantin A tetap utuh dan dapat diaudit. |

---

## 15. REKOMENDASI URUTAN PEKERJAAN (ROADMAP PASCA PERSETUJUAN)

Jika laporan audit dan draft ekstensi disetujui, urutan paket kerja yang disarankan adalah:

1. **Paket 1: Generalisasi Skema Multi-Merchant & Saldo Orang Tua**:
   - Refaktor tabel `canteens` menjadi `tenant_merchants`.
   - Menerbitkan skema `wali_wallets` dan integrasi transfer internal bebas biaya.
2. **Paket 2: Ekstensi Denda Finansial pada Tata Tertib & Collection Point**:
   - Menambahkan field denda pada `master_hukuman` dan `hukuman`.
   - Mengembangkan API loket Collection Merchant untuk identifikasi denda via RFID.
3. **Paket 3: Integrasi Double-Entry Ledger Merchant & Collection**:
   - Memetakan postingan jurnal akuntansi untuk belanja kantin internal, hutang vendor rekanan, dan penerimaan denda santri.
4. **Paket 4: Dashboard Wali Santri & Laporan Transaksi Merchant**:
   - Menampilkan visualisasi 3 kantong saldo terpisah.
   - Menyajikan feed riwayat transaksi uang saku anak secara transparan dan aman.

---

## 16. STOP CONDITION & KEPATUHAN TATA KELOLA

Mandat audit **M2-FINANCE-ARCHITECTURE-002** telah diselesaikan secara penuh. Sesuai instruksi *Stop Condition*:
- Laporan audit ini dan draft pelengkap telah disimpan di `docs/architecture/`.
- Tidak ada kode produksi yang diubah.
- Tidak ada migrasi database yang dijalankan.
- Tidak ada transaksi atau mutasi finansial yang dieksekusi.
- Sistem berhenti dan menunggu arahan formal serta persetujuan resmi dari **Process_PO** dan **Mandor 2**.
