# EXECUTIVE SUMMARY UNTUK PRODUCT OWNER (PO)
## Konsolidasi Keputusan Bisnis Merchant & Agenda Diskusi Terarah
**Dokumen Referensi:** WP-M2-MERCHANT-BUSINESS-DECISIONS-001 (direvisi WP-002, WP-004, WP-005, WP-007, WP-009, WP-011, WP-013, WP-014 & WP-015)  
**Kepada:** Product Owner APP MA’HAD  
**Dari:** ZenOrion (Lead Orchestrator & Senior Systems Architect)  
**Tanggal:** 20 Oktober 2026 (Revisi WP-015: 21 Oktober 2026)  
**Status Dokumentasi:** CONSOLIDATED DRAFT — MENUNGGU REVIEW PO  
**Status Ratifikasi Formal:** `[BELUM DIVERIFIKASI]` (Memerlukan proses ratifikasi governance tersendiri, GOV-001)  
**Status Implementasi:** STRICT READ-ONLY (Dokumentasi & Arsitektur Saja)  

---

## 1. RINGKASAN PILAR KEPUTUSAN BISNIS YANG SUDAH DISEPAKATI PO

Dokumen [MERCHANT-BUSINESS-DECISIONS-CONSOLIDATED-001.md](file:///e:/Projects/Os_Darta/docs/architecture/MERCHANT-BUSINESS-DECISIONS-CONSOLIDATED-001.md) mengonsolidasikan 29 pilar keputusan bisnis merchant yang telah disepakati bersama PO:

1. **Ortogonalitas Empat Konsep:** Role Utama institusional, Second Role, Penugasan Operasional Merchant, dan Permission Scope dipisahkan secara tegas.
2. **Fleksibilitas Staf Tanpa Kuota:** Pengguna internal dapat memiliki multi-penugasan operasional di beberapa merchant sekaligus tanpa batas kuota sistem buatan.
3. **Akun Eksternal Mandiri:** Personel rekanan dibuatkan akun email+password tanpa perlu identitas institusional guru/santri.
4. **Otoritas PIC Pertama:** Super Admin Tenant adalah satu-satunya otoritas yang menunjuk PIC pertama melalui undangan email resmi.
5. **Masa Berlaku Undangan 1 × 24 Jam:** Undangan berlaku 24 jam; pengiriman ulang memulai 24 jam baru; undangan kedaluwarsa tidak memberikan hak akses otomatis.
6. **Otonomi Staf oleh PIC (Terbatas):** PIC berwenang mengundang dan menyetujui staf hanya untuk merchant tanggung jawabnya; PIC dilarang menunjuk PIC lain atau mengambil wewenang Super Admin Tenant.
7. **Keberlangsungan Penugasan Staf:** Penonaktifan/pergantian PIC tidak otomatis membatalkan penugasan staf yang masih sah; Super Admin Tenant dapat mengaktifkan pengambilalihan sementara (*Admin Takeover*).
8. **Pencabutan Akses Bergradasi:** Pengguna internal penugasan dicabut tetap aktif akun utamanya; akun eksternal dinonaktifkan jika tidak ada penugasan aktif lain di tenant.
9. **Aktivasi Kembali Akun Eksternal:** Akun nonaktif dapat diaktifkan kembali lewat undangan baru yang sah menggunakan identitas akun terdaftar lama (tanpa akun duplikat).
10. **Penyelesaian Uang (Settlement) Manual:** Tahap awal menggunakan rekonsiliasi dan persetujuan Admin Keuangan secara manual sebelum dana dicairkan ke vendor.
11. **Pemisahan Data Rekening Bank & Multi-Rekening Aktif (Keputusan PO MBD-018 & MBD-019 / WP-014, 21 Oktober 2026):** Rekening penerima dana dipisahkan dari profil operasional merchant dan akses dibatasi pihak keuangan. Satu merchant boleh memiliki beberapa rekening bank aktif sekaligus (menggugurkan aturan lama 1 rekening); merchant memilih rekening tujuan untuk setiap pengajuan penarikan; rekening terikat permanen pada snapshot pengajuan bersangkutan dan dilarang diubah diam-diam. Tiga model kemitraan sah (Bagi Hasil, Hak Merchant Penuh, Usaha Milik Pesantren) tetap berlaku dengan persentase bagi hasil ditentukan saat merchant dibuat per kontrak.
12. **Hak Operasional Kasir Calon Staf (Keputusan PO Opsi A, 20 Oktober 2026):** Calon staf berstatus `PENDING_ACCEPTANCE` dilarang transaksi kasir; penerimaan undangan tidak otomatis mengaktifkan penugasan kasir; hak operasional kasir baru aktif setelah undangan diterima dan penugasan berstatus aktif. Hak akses dashboard/baca tetap terbuka (`[BELUM DIPUTUSKAN PO]`).
13. **Kepemilikan Dana Transaksi & Batas Tanggung Jawab Aplikasi (Keputusan PO MBD-001, 20 Oktober 2026):** Memilih Opsi A — Unified Central Escrow sebagai arah prinsip bisnis. Seluruh transaksi merchant dicatat sebagai dana titipan terpusat sampai settlement. Pembagian riil hasil transaksi dilakukan di luar aplikasi; aplikasi mencatat transaksi, data rekonsiliasi, dan keuntungan bersih (bukan menentukan atau mengeksekusi pembagian riil). Detail hukum, pajak, dan akuntansi diverifikasi terpisah sebelum implementasi.
14. **Fitur HPP, Basis Bagi Hasil Kontrak, & Pembebanan Biaya Operasional (Keputusan PO DEC-008-A, B, C / 20 Oktober 2026):** Aplikasi wajib menyediakan fitur input HPP dan biaya langsung sejak tahap pertama untuk mencatat komponen keuntungan bersih (DEC-008-A); dasar pembagian bagi hasil Model 1 mengikuti ketentuan kontrak masing-masing merchant, bukan basis universal tunggal (DEC-008-B); biaya sewa, listrik, air, dan kebersihan pada tahap awal ditagih terpisah di luar aplikasi dan tidak otomatis memotong hak merchant di aplikasi (DEC-008-C / MBD-033). Contoh PO (50% split) ditegaskan murni ilustratif non-universal.
15. **Kewajiban Operator Model 3 & Kepemilikan Reader RFID (Keputusan PO DEC-028-A, B, C / 20 Oktober 2026):** Kontribusi operator kepada pondok mengikuti kesepakatan kontrak masing-masing merchant (bisa berbayar atau tanpa sewa) dan ditagih terpisah di luar aplikasi (DEC-028-A); reader RFID menggunakan skema hibrida yang dapat dimiliki pesantren atau operator sesuai kontrak (DEC-028-B); pencatatan aplikasi dibatasi pada status kepemilikan, nomor seri reader, periode kontrak, dan memo kewajiban tanpa modul depresiasi aset (DEC-028-C / MBD-028).
16. **Penerapan Prospektif Amandemen Kontrak (Keputusan PO MBD-004 / WP-013, 20 Oktober 2026):** Perubahan aturan atau persentase kontrak merchant hanya berlaku prospektif (untuk transaksi mendatang) dan dilarang diam-diam mengubah perhitungan transaksi historis. Seluruh klausul kontrak saat transaksi terjadi harus dapat ditelusuri dan diaudit kembali.
17. **Sekuens Resmi Pergantian PIC & Pengakhiran Mandat Atomik (Keputusan PO MBD-008 & MBD-009 / WP-013, 20 Oktober 2026):** Super Admin Tenant adalah satu-satunya otoritas yang menunjuk/mengganti PIC. Mengikuti alur 7 tahap (pemilihan calon -> konfirmasi kesediaan calon -> tombol "Ganti PIC" dieksekusi Super Admin). Mandat PIC lama berakhir dan dicabut secara atomik; dilarang ada dua PIC aktif bersamaan, dan PIC lama wajib dipertahankan aktif jika proses penggantian gagal.
18. **Pembayaran Santri Internal Tanpa Payment Gateway (Keputusan PO MBD-036 / WP-013, 20 Oktober 2026):** Seluruh transaksi belanja santri kepada merchant apa pun adalah transaksi internal APP MA’HAD non-gateway (bebas tagihan Flip, webhook, dan biaya transaksi gateway di kasir). Saldo uang saku berkurang seketika dan hak dana berpindah ke rekap merchant/pesantren secara internal.
19. **Buku Pembantu Hak Dana Merchant & 4 Status Saldo Dashboard (Keputusan PO MBD-037 / WP-013, 20 Oktober 2026):** Dashboard Admin Keuangan menyajikan ringkasan total gabungan hak dana seluruh merchant dan kartu tersendiri (grid card) per merchant. Pembukuan hak dana terisolasi per merchant tanpa wajib rekening fisik terpisah. Sistem wajib membedakan secara tegas 4 status saldo: Total Hak Dana, Dana yang Sudah Dicairkan, Dana yang Dicadangkan, dan Dana yang Tersedia untuk Penarikan Baru. Hak pesantren pada Model 3 tidak dihitung sebagai hak merchant eksternal.
20. **Alur Otorisasi Penarikan Dana (Withdrawal) & Invariant Proteksi (Keputusan PO MBD-038 / WP-013, 20 Oktober 2026):** Penarikan dapat diajukan oleh PIC atau staf berwenang yang memiliki izin auditabel. Mengikuti alur 5 tahap resmi: Pengajuan -> Validasi dana tersedia -> Konfirmasi approval Admin Keuangan -> Eksekusi pencairan -> Pencatatan konfirmasi pembayaran riil. Dilarang menyamakan status requested, approved, dan completed. Penarikan dilarang menyebabkan saldo negatif (zero overdraft) dan dilarang mengurangi hak dana merchant lain/pesantren.
21. **Wewenang Verifikasi Rekening oleh Admin Keuangan (Keputusan PO MBD-017 & MBD-019 / WP-014, 21 Oktober 2026):** Admin Keuangan bertanggung jawab memverifikasi dan menyetujui rekening baru atau perubahan rekening sebelum rekening dapat digunakan. Rekening belum diverifikasi dilarang menjadi tujuan pencairan. Perubahan rekening berlaku prospektif untuk pengajuan berikutnya tanpa mengubah pengajuan berjalan/disetujui. Tidak ada kewajiban persetujuan pihak kedua tanpa keputusan PO.
22. **Batas Minimum Pengajuan Penarikan Dana Rp1.000.000 Gross (Keputusan PO MBD-039 / WP-014, 21 Oktober 2026):** Batas minimum nominal pengajuan penarikan dana merchant adalah Rp1.000.000 per pengajuan kotor sebelum pemotongan biaya admin. Dilarang menafsirkan minimum sebagai nominal bersih yang diterima merchant.
23. **Model Flat Biaya Admin Penarikan Mandiri & Wewenang Super Admin SaaS (Keputusan PO MBD-040 / WP-014, 21 Oktober 2026):** Pencairan mandiri oleh merchant melalui alur payment gateway dikenakan biaya admin berupa nominal tetap (flat) per pengajuan (bukan persentase). Wewenang penetapan dan konfigurasi tarif berada eksklusif pada Super Admin SaaS di platform SaaS (tenant/merchant dilarang menetapkan/mengubah). Besaran tarif rupiah nominal tetap belum diputuskan dalam register merchant dan menjadi keputusan konfigurasi platform SaaS tersendiri.
24. **Bebas Biaya Admin untuk Pencairan oleh Admin Keuangan (Keputusan PO MBD-040 / WP-014, 21 Oktober 2026):** Jika pencairan dilakukan/dieksekusi oleh Admin Keuangan, merchant tidak dikenakan biaya admin (`Nominal Bersih = Nominal Pengajuan`). Pengajuan, persetujuan, dan realisasi pencairan dicatat sebagai tahapan yang berbeda.
25. **Standarisasi Tampilan Konfirmasi Transaksi & Proteksi Invariant (Keputusan PO WP-014, 21 Oktober 2026):** Rincian sebelum konfirmasi penarikan mandiri wajib memuat nominal pengajuan, rekening tujuan, Biaya Admin, dan nominal bersih (`Nominal Bersih = Nominal Pengajuan - Biaya Admin`). Antarmuka hanya menampilkan label "Biaya Admin" tanpa membocorkan pihak penerima biaya. Saldo dicadangkan terkunci, dilarang saldo negatif (zero overdraft), dan dilarang penggunaan hak dana antar-merchant maupun kas pesantren.
26. **Pelepasan Dana Cadangan saat Penolakan (Keputusan Final PO WD-01 / WP-015, 21 Oktober 2026):** Jika pengajuan penarikan ditolak oleh Admin Keuangan, dana yang dicadangkan (*Reserved Funds*) dilepaskan seketika kembali menjadi dana tersedia (*Available Balance*) merchant. Merchant diperbolehkan mengajukan penarikan baru; penolakan dilarang dicatat sebagai pencairan sukses; alasan penolakan wajib tercatat auditabel; dan pelepasan dana dilarang menyebabkan saldo negatif atau mengubah hak merchant lain.
27. **Batas Pembatalan Mandiri Sebelum Persetujuan (Keputusan Final PO WD-02 / WP-015, 21 Oktober 2026):** Merchant hanya diperbolehkan membatalkan pengajuan penarikan secara mandiri sebelum Admin Keuangan memberikan persetujuan (*approval*). Pembatalan melepaskan dana cadangan tepat satu kali (idempotent). Setelah disetujui, hak pembatalan mandiri tertutup (penghentian darurat sebelum transfer dikirim tunduk aturan operasional lain).
28. **Dana Tetap Dicadangkan saat Hasil Transfer Belum Pasti (Keputusan Final PO WD-03 / WP-015, 21 Oktober 2026):** Jika hasil transfer perbankan/gateway belum pasti, dana WAJIB TETAP DICADANGKAN hingga proses rekonsiliasi membuktikan hasil transaksi riil. Status belum pasti dilarang diperlakukan sepihak sebagai sukses dan dilarang otomatis dianggap gagal; dana tidak boleh dilepas hanya karena batas waktu timeout terlampaui.
29. **Pembebasan Biaya Admin saat Pencairan Dipastikan Gagal (Keputusan Final PO WD-04 / WP-015, 21 Oktober 2026):** Jika pencairan dipastikan gagal melalui bukti yang memadai, merchant BEBAS BIAYA ADMIN PENARIKAN (Rp0). Dana cadangan dipulihkan secara terkendali ke dana tersedia merchant tanpa pengembalian ganda atau saldo negatif. Dilarang mencatat sukses, dan biaya gateway provider SaaS dilarang dibebankan ke merchant tanpa keputusan PO yang sah.

---

## 2. STATUS REGISTER KEPUTUSAN TERBUKA ([register](file:///e:/Projects/Os_Darta/docs/architecture/MERCHANT-OPEN-DECISIONS-REGISTER-001.md))

Hasil rekonsiliasi dan inkorporasi keputusan PO (WP-015) mencakup **41 item keputusan** (MBD-001 s/d MBD-041):

| Status | Jumlah | Daftar Decision ID | Penjelasan Status |
|---|:---:|---|---|
| `DECIDED` | 15 | MBD-001, MBD-004, MBD-008, MBD-009, MBD-017, MBD-018, MBD-019, MBD-028, MBD-033, MBD-036, MBD-037, MBD-038, MBD-039, MBD-040, MBD-041 | Arah Unified Central Escrow (001), kontrak prospektif (004), pergantian PIC atomik (008, 009), verifikasi rekening oleh Admin Keuangan (017), multi-rekening aktif (018), snapshot lock rekening prospektif (019), Model 3 & reader hibrida (028), penagihan utilitas di luar aplikasi (033), pembayaran santri non-gateway (036), buku pembantu & dashboard 4 status saldo (037), alur otorisasi penarikan dana (038), minimum penarikan Rp1.000.000 gross (039), model flat biaya admin gateway & bebas biaya via Admin Keuangan (040), serta kebijakan penanganan penolakan, pembatalan mandiri sebelum approval, dana tetap dicadangkan saat hasil transfer belum pasti, & pembebasan fee saat transfer gagal (041 / WD-01 s/d WD-04) telah disahkan PO. |
| `NEEDS_CLARIFICATION` | 10 | MBD-002, 006, 010, 013, 015, 020, 021, 022, 024, 025 | Prinsip umum disepakati PO, tetapi detail operasional/teknis perlu dipertegas. *(MBD-017 naik status ke DECIDED; MBD-002 diperbarui dengan DEC-008-B & WP-013)*. |
| `OPEN` | 15 | MBD-003, 005, 007, 011, 012, 014, 023, 026, 027, 029, 030, 031, 032, 034, 035 | Pertanyaan bisnis yang belum diputuskan oleh PO. *(MBD-018 dan MBD-019 naik status ke DECIDED; MBD-030 & 038 diperbarui dengan MBD-041)*. |
| `DEFERRED` | 1 | MBD-016 | Evaluasi otomatisasi pembayaran ditunda hingga operasional manual berjalan tertib. |

*Catatan: Besaran nominal tarif rupiah biaya admin belum diputuskan dalam register merchant ini dan merupakan keputusan konfigurasi platform SaaS tersendiri. Rekomendasi teknis lama (1 rekening aktif) telah digugurkan oleh Keputusan PO MBD-018. Usulan pembuatan skema tabel terpisah (misalnya nama kerja `merchant_payout_profiles`) murni berstatus `[REKOMENDASI AGENT]` dan bukan keputusan PO.*

---

## 3. CATATAN KHUSUS: KONFLIK DRAF DESAIN KEUANGAN MERCHANT (F-02 & MBD-035)

Pemeriksaan independen mengidentifikasi 4 konflik desain material antara dokumen keputusan bisnis PO dengan draf proposal teknis [DRAFT-FINANCE-MERCHANT-WALLET-EXTENSION-001.md](file:///e:/Projects/Os_Darta/docs/architecture/DRAFT-FINANCE-MERCHANT-WALLET-EXTENSION-001.md):
1. **Model Bisnis:** Draf proposal hanya merancang 2 model (`INTERNAL_PONDOK` vs `THIRD_PARTY_OPERATOR`), sedangkan PO menetapkan 3 model bisnis sah (Bagi Hasil, Hak Merchant Penuh, Usaha Milik Pesantren).
2. **Penyimpanan Rekening:** Draf proposal meletakkan data rekening bank vendor langsung pada tabel operasional `tenant_merchants`, bertentangan dengan keputusan PO yang mewajibkan rekening dipisah dari profil operasional.
3. **Integritas Relasi:** Draf proposal menggunakan `onDelete: 'cascade'` pada relasi kunci, bertentangan dengan prinsip perlindungan riwayat transaksi abadi.
4. **Batas Kasir:** Draf proposal membatasi 1 user per merchant melalui constraint unik di `merchant_cashiers`, bertentangan dengan keputusan PO yang mendukung multi-fungsi staf.

Konflik ini berstatus **`DESIGN CONFLICT — UNRESOLVED`**. Keputusan PO memegang otoritas tertinggi. Usulan pembuatan skema terpisah (misalnya nama kerja `merchant_payout_profiles`) merupakan **rekomendasi teknis agent dan belum disetujui PO** (dibahas di MBD-035).

---

## 4. LIMA KEPUTUSAN PALING PRIORITAS UNTUK DIBAHAS BERSAMA PO

Dengan disahkannya tata kelola pergantian PIC (MBD-008, 009), pembayaran santri non-gateway (MBD-036), hak dana dashboard (MBD-037), alur withdrawal (MBD-038), multi-rekening aktif & verifikasi rekening (MBD-017, 018, 019), batas minimum penarikan Rp1.000.000 gross (MBD-039), model flat biaya admin (MBD-040), serta kebijakan penolakan, pembatalan, dan kegagalan penarikan WD-01 s/d WD-04 (MBD-041), berikut 5 pertanyaan strategis terbuka yang direkomendasikan untuk disepakati berikutnya:

1. **MBD-035 (Model Skema Pemisahan Rekening Vendor di DDL & Resolusi F-02):**
   - *Pertanyaan PO:* Bagaimana model skema pemisahan data rekening vendor disahkan pada tingkat desain fisik/DDL: apakah menyetujui opsi pembuatan tabel terpisah tersendiri (usulan arsitek) atau pendekatan skema lain untuk menuntaskan `DESIGN CONFLICT — UNRESOLVED` dengan draf proposal finansial?
   - *Alasan:* Menjadi prasyarat perancangan skema database DDL merchant yang aman dari kebocoran data rekening ke personil operasional/kasir.
2. **MBD-003 & MBD-032 (Selisih Kas Fisik & Retur/Refund Belanja Santri):**
   - *Pertanyaan PO:* Siapa pihak yang menanggung selisih kas fisik di kasir vs pencatatan sistem POS, dan bagaimana mekanisme retur barang santri memotong hak tagih settlement vendor berjalan?
   - *Alasan:* Mengunci akurasi penutupan kasir harian (*closing*) dan perlindungan saldo uang saku santri.
3. **MBD-006 & MBD-007 (Mekanisme Pengakhiran & Batas Durasi Admin Takeover):**
   - *Pertanyaan PO:* Bagaimana mekanisme resmi pengakhiran Admin Takeover dan apakah memerlukan batas durasi evaluasi berkala (misal 14 hari)?
   - *Alasan:* Menjamin kepastian tata kelola darurat saat terjadi kekosongan PIC definitif di lapangan.
4. **MBD-014, 015 & 030 (Jadwal Settlement, Bukti Transfer & Level Otorisasi Tambahan):**
   - *Pertanyaan PO:* Berapa frekuensi siklus rekonsiliasi dan pencairan dana vendor (apakah disepakati mingguan), bukti transfer apa yang wajib disimpan, serta apakah diperlukan persetujuan tambahan di luar Admin Keuangan?
   - *Alasan:* Menjadi acuan perancangan modul pelaporan kasir dan antarmuka persetujuan pembayaran Admin Keuangan.
5. **MBD-020, 021 & 034 (Tata Kelola Akun Staf Eksternal Multi-Tenant):**
   - *Pertanyaan PO:* Setelah Opsi A disahkan (kasir dilarang transaksi sebelum aktif), apakah staf yang menunggu undangan pending diberikan hak akses login terbatas untuk konfirmasi atau ditangguhkan penuh, dan apakah penonaktifan akun berlaku di level tenant membership atau suspensi akun platform global?
   - *Alasan:* Menentukan batas isolasi autentikasi pengguna pada arsitektur SaaS multi-tenant.

---

## 5. REKOMENDASI URUTAN AGENDA DISKUSI `[REKOMENDASI AGENT]`

Kami merekomendasikan pembahasan dengan PO dilakukan secara bertahap dalam 3 sesi:

```text
SESI 1: SKEMA DDL REKENING VENDOR, TARIF SAAS & FINANSIAL KASIR
  ├── Skema & Rekening: MBD-035 (skema DDL terpisah), Tarif Flat Rupiah SaaS (MBD-040), MBD-031
  ├── Penanganan Finansial Kasir: MBD-003 (selisih kas fisik), MBD-032 (retur/refund)
  └── Format Kontrak & Komisi: MBD-002 (snapshot transaksi), MBD-005 (cut-off amandemen)

SESI 2: SETTLEMENT, REKONSILIASI & PENUGASAN STAF
  ├── Alur Settlement Lanjutan: MBD-014 (jadwal), MBD-015 (Four-Eyes), MBD-030 (bukti transfer), MBD-016 (otomatisasi)
  ├── Penugasan Staf: MBD-024 (multi-fungsi), MBD-026 (kuota staf), MBD-027 (larangan perangkapan fraud)
  └── Ketersediaan PIC: MBD-025 (kewajiban PIC aktif), MBD-029 (kondisi transaksi kasir tanpa PIC)

SESI 3: TATA KELOLA AKUN EKSTERNAL, UNDANGAN & ADMIN TAKEOVER
  ├── Admin Takeover: MBD-006 (pengakhiran), MBD-007 (evaluasi berkala)
  ├── Siklus Undangan: MBD-010 (token lama), MBD-011 (rate limit), MBD-012 (pembatalan), MBD-013 (email terdaftar)
  └── Akun Eksternal: MBD-020 (multi-merchant), MBD-021 (hak baca/dashboard pending), MBD-022 (reaktivasi), MBD-023 (kill switch), MBD-034 (cakupan suspensi)
```
