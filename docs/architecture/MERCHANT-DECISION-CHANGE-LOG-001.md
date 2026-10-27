# CATATAN PERUBAHAN KEPUTUSAN BISNIS (DECISION CHANGE LOG)
## Log Penelusuran Keputusan Bisnis & Rekomendasi Arsitektur Merchant APP MA’HAD
**Dokumen Referensi:** WP-M2-MERCHANT-BUSINESS-DECISIONS-001 (direvisi WP-002, WP-004, WP-005, WP-007, WP-009, WP-011, WP-013, WP-014 & WP-015)  
**Konsolidator:** ZenOrion (Lead Orchestrator & Senior Systems Architect)  
**Tanggal Rilis Log:** 20 Oktober 2026 (Revisi WP-015: 21 Oktober 2026)  
**Status Ratifikasi Formal:** `[BELUM DIVERIFIKASI]` (Dokumen berstatus *CONSOLIDATED DRAFT*)  

---

## 1. TUJUAN CHANGE LOG

Catatan perubahan ini mendokumentasikan evolusi keputusan bisnis merchant dari fase eksplorasi awal, perancangan arsitektur, hingga penyusunan konsolidasi draf SOT saat ini.

Tujuan utama change log ini adalah:
1. **Membedakan secara transparan** mana keputusan bisnis yang berasal langsung dari Product Owner (PO) dan mana rekomendasi teknis yang diajukan oleh agent.
2. **Mencegah regresi:** Memastikan keputusan bisnis yang telah disepakati PO tidak tertimpa tanpa jejak audit.
3. **Menyediakan riwayat justifikasi:** Menjelaskan alasan mengapa suatu aturan diubah, diperjelas, atau dipisahkan.
4. **Kepatuhan Governance (F-03):** Menghindari klaim bahwa dokumen telah diratifikasi secara formal tanpa adanya artefak ratifikasi resmi yang dapat diverifikasi di repository.

---

## 2. RIWAYAT PERUBAHAN KEPUTUSAN (CHRONOLOGICAL CHANGE LOG)

### Siklus 3: Konsolidasi Mandat WP-M2-MERCHANT-BUSINESS-DECISIONS-001 (20 Oktober 2026)
*(Catatan verifikasi F-04: status sebelumnya pada CHG-001 s/d CHG-012 bersumber dari percakapan transkrip agent dan draf proposal, bukan file independen di repository).*

| ID Perubahan | Topik / Entitas | Status Sebelumnya *(tidak diverifikasi independen)* | Status Konsolidasi SOT | Klasifikasi Otoritas | Sumber & Alasan Perubahan |
|---|---|---|---|:---:|---|
| **CHG-001** | Masa Berlaku Undangan | Belum ada batas durasi eksplisit pada skema DDL | Ditetapkan tepat **1 × 24 jam (24 jam)** sejak dikirim | `KEPUTUSAN PO` | Mandat PO Bagian 3.4: Memberikan batasan keamanan agar link undangan tidak menggantung tanpa batas. |
| **CHG-002** | Pengiriman Ulang Undangan | Belum dirinci di arsitektur | PIC berwenang mengirim ulang; pengiriman ulang memulai 24 jam baru | `KEPUTUSAN PO` | Mandat PO Bagian 3.4: Memberikan fleksibilitas operasional bagi staf yang lupa membuka email. |
| **CHG-003** | Identitas Staf Eksternal | Disarankan menggunakan login nomor WhatsApp | Ditetapkan menggunakan **Email dan Password** | `KEPUTUSAN PO` | Mandat PO Bagian 3.2: Menstandarkan autentikasi staf rekanan luar tanpa mewajibkan akun institusi santri/guru. |
| **CHG-004** | Status Staf saat PIC Nonaktif | Diasumsikan staf tersuspensi bersama PIC | **Penugasan staf yang sah tidak otomatis dibatalkan/dicabut; Admin Takeover tersedia** *(F-10: tidak menjamin transaksi kasir selalu boleh berlangsung)* | `KEPUTUSAN PO` | Mandat PO Bagian 3.6 & Keputusan PO 2: Menjamin status penugasan staf yang sah tidak gugur otomatis. |
| **CHG-005** | Kuota Merchant per Staf | Diusulkan batasan maksimal 2 merchant per kasir | **Tidak ada batasan kuota merchant**; multi-merchant diizinkan penuh untuk internal | `KEPUTUSAN PO` | Mandat PO Bagian 3.1 & Keputusan PO 3: Memberikan fleksibilitas penugasan staf serbaguna di pesantren. |
| **CHG-006** | Penunjukan PIC Pertama | Diusulkan Admin Pesantren umum | Hak penunjukan dan pergantian PIC adalah **Super Admin Tenant** | `KEPUTUSAN PO` | Mandat PO Bagian 3.3 & 3.6: Menegaskan hierarki otorisasi tertinggi di dalam tenant. |
| **CHG-007** | Siklus Hidup Akun Eksternal Pasca Revokasi | Akun tetap aktif umum | Akun dinonaktifkan jika tidak punya tugas aktif lain di tenant; aktif kembali via undangan sah baru | `KEPUTUSAN PO` | Mandat PO Bagian 3.7 & 3.8: Menjaga prinsip Zero-Trust atas pengguna luar yang tidak memiliki tugas aktif. |
| **CHG-008** | Alur Settlement Vendor | Diusulkan otomatisasi periodik via Flip | **Fase awal wajib verifikasi & approval Admin Keuangan secara manual** | `KEPUTUSAN PO` | Mandat PO Bagian 3.9: Mencegah risiko salah transfer sebelum rekonsiliasi dan SOP keuangan matang. |
| **CHG-009** | Tiga Model Bisnis Sah | Belum dipisahkan secara formal | Ditetapkan 3 model: (1) Bagi Hasil, (2) Pendapatan Pondok, (3) Pendapatan Operator | `KEPUTUSAN PO` | Mandat PO Bagian 3.11: Menetapkan koridor kemitraan resmi tanpa model keempat tanpa izin PO. |
| **CHG-010** | Partial Unique Index Penugasan | Constraint UNIQUE biasa `(tenant, merchant, user, duty)` | Diganti **Partial Index `WHERE status IN ('ACTIVE', 'SUSPENDED')`** | `REKOMENDASI AGENT` | Mencegah database error saat kasir yang pernah dicabut (`REVOKED`) ditugaskan kembali di kemudian hari. |
| **CHG-011** | Constraint Tepat Satu PIC Aktif | Tidak dilindungi index fisik | Ditambahkan **Partial Index `WHERE duty = 'PIC' AND status = 'ACTIVE'`** | `REKOMENDASI AGENT` | Mencegah kondisi balapan (race condition) pengangkatan 2 PIC aktif bersamaan pada 1 merchant. |
| **CHG-012** | Perlindungan Foreign Key Cascade | Sebagian relasi memakai `CASCADE` | Diusulkan menjadi **`ON DELETE RESTRICT`** pada seluruh entitas finansial | `REKOMENDASI AGENT` | Menjamin riwayat transaksi dan audit kasir tidak musnah jika akun pengguna atau merchant dihapus. |

---

## 3. PEMISAHAN DEFINITIF KEPUTUSAN PO VS. REKOMENDASI AGENT

### A. Telah Berstatus KEPUTUSAN PO (Disepakati PO dalam Mandat/Percakapan Resmi):
1. Pemisahan empat konsep: Role Utama, Second Role, Penugasan Merchant, Permission Scope.
2. Penunjukan & pergantian PIC ditentukan Super Admin Tenant.
3. Undangan berlaku 1x24 jam; pengiriman ulang memulai 24 jam baru.
4. PIC berwenang mengundang dan menyetujui staf merchant tanggung jawabnya.
5. Penugasan staf yang sah tidak otomatis dibatalkan saat PIC nonaktif/berganti.
6. Super Admin Tenant dapat mengambil alih operasional sementara (*Admin Takeover*).
7. Pengguna internal penugasan dicabut: akun utama tetap aktif.
8. Pengguna eksternal penugasan dicabut: akun dinonaktifkan jika tidak ada tugas aktif lain di tenant; aktif kembali via undangan sah baru menggunakan akun lama.
9. Settlement tahap awal wajib rekonsiliasi dan persetujuan Admin Keuangan secara manual.
10. Data rekening vendor dipisahkan dari profil operasional dan akses dibatasi pihak keuangan.
11. Tiga model bisnis sah: Bagi Hasil, Pendapatan Pondok, Pendapatan Operator. Persentase bagi hasil tidak boleh di-hardcode; ditentukan saat merchant dibuat mengikuti kontrak; HPP, harga jual, profit, dan porsi para pihak dicatat; contoh 50% adalah ilustrasi (WP-013).
12. **Hak Operasional Kasir Calon Staf (Opsi A, 20 Oktober 2026):** Calon staf berstatus `PENDING_ACCEPTANCE` dilarang transaksi kasir; penerimaan undangan tidak otomatis mengaktifkan penugasan kasir; hak operasional kasir baru aktif setelah undangan diterima dan penugasan berstatus aktif.
13. **Kepemilikan Dana Transaksi & Batas Tanggung Jawab Aplikasi (MBD-001, 20 Oktober 2026):** Memilih Opsi A — Unified Central Escrow sebagai arah prinsip bisnis. Seluruh hasil transaksi merchant dicatat sebagai dana titipan terpusat sampai settlement. Pembagian riil hasil transaksi dilakukan di luar aplikasi; aplikasi mencatat transaksi, data rekonsiliasi, dan keuntungan bersih (bukan menentukan atau mengeksekusi pembagian riil).
14. **Fitur Input HPP & Biaya Langsung Tahap 1 (DEC-008-A, 20 Oktober 2026):** Aplikasi wajib menyediakan fitur input HPP dan biaya langsung sejak tahap pertama untuk mencatat komponen yang diperlukan dalam menghitung keuntungan bersih merchant.
15. **Basis Bagi Hasil Kontraktual Model 1 (DEC-008-B, 20 Oktober 2026):** Perhitungan pembagian bagi hasil mengikuti ketentuan kontrak masing-masing merchant (bukan basis universal tunggal); aplikasi menyajikan data relevan sesuai klausul kontrak.
16. **Penagihan Biaya Utilitas/Sewa di Luar Aplikasi (DEC-008-C / MBD-033, 20 Oktober 2026):** Pada tahap awal, biaya sewa, listrik, air, dan kebersihan dicatat atau ditagihkan secara terpisah di luar aplikasi dan tidak otomatis memotong hak merchant dalam perhitungan aplikasi.
17. **Kontribusi Operator Model 3 Mengikuti Kontrak (DEC-028-A, 20 Oktober 2026):** Kontribusi operator kepada pondok mengikuti kontrak masing-masing merchant (bisa berbayar atau tanpa sewa); penagihan di luar aplikasi tanpa biaya default atau pemotongan otomatis.
18. **Kepemilikan Reader RFID Skema Hibrida (DEC-028-B, 20 Oktober 2026):** Reader RFID dapat dimiliki oleh pesantren atau operator sesuai ketentuan kontrak merchant; tanggung jawab pengadaan dan perawatan mengikuti kontrak.
19. **Batas Pencatatan Perangkat dalam Aplikasi (DEC-028-C / MBD-028, 20 Oktober 2026):** Aplikasi mencatat status kepemilikan perangkat (Pesantren/Operator), ID/nomor seri reader, periode kontrak, dan memo kewajiban; modul depresiasi aset tidak termasuk.
20. **Penerapan Prospektif Amandemen Kontrak (MBD-004 / WP-013, 20 Oktober 2026):** Perubahan aturan atau persentase kontrak merchant hanya berlaku prospektif (untuk transaksi mendatang) dan tidak boleh diam-diam mengubah perhitungan transaksi historis. Aturan kontrak saat transaksi terjadi harus dapat diaudit kembali.
21. **Sekuens Resmi Pergantian PIC & Pengakhiran Mandat Atomik (MBD-008, MBD-009 / WP-013, 20 Oktober 2026):** Pergantian PIC mengikuti sekuens resmi 7 tahap (Super Admin pilih calon -> konfirmasi kesediaan calon -> Super Admin klik tindakan eksplisit "Ganti PIC"). Mandat PIC lama berakhir dan dicabut secara atomik saat pergantian resmi berhasil. Sistem dilarang mengaktifkan 2 PIC aktif bersamaan, dan jika proses gagal, PIC lama wajib dipertahankan aktif.
22. **Pembayaran Santri Internal Tanpa Payment Gateway (MBD-036 / WP-013, 20 Oktober 2026):** Seluruh transaksi pembayaran belanja santri di kasir merchant adalah transaksi internal APP MA’HAD non-gateway (bebas tagihan invoice Flip, webhook, atau biaya gateway di kasir). Saldo uang saku terpotong seketika dan hak dana berpindah secara internal ke rekap merchant/pesantren.
23. **Buku Pembantu Hak Dana Merchant & 4 Status Saldo Dashboard (MBD-037 / WP-013, 20 Oktober 2026):** Dashboard Admin Keuangan menyajikan ringkasan total hak dana gabungan seluruh merchant dan grid card per merchant. Pembukuan hak dana terisolasi per merchant tanpa wajib rekening fisik terpisah. Sistem wajib membedakan secara tegas 4 status dana: Total Hak Dana, Dana yang Sudah Dicairkan, Dana yang Dicadangkan, dan Dana yang Tersedia untuk Penarikan Baru. Hak unit usaha pesantren (Model 3) tidak dihitung sebagai hak merchant eksternal.
24. **Alur Otorisasi Penarikan Dana (Withdrawal) & Invariant Proteksi (MBD-038 / WP-013, 20 Oktober 2026):** Penarikan dapat diajukan oleh PIC atau staf berwenang yang memiliki izin auditabel. Alur resmi 5 tahap: Pengajuan -> Validasi ketersediaan dana -> Konfirmasi approval Admin Keuangan -> Proses pencairan -> Pencatatan konfirmasi pembayaran riil. Dilarang menyamakan status requested, approved, dan completed. Penarikan dilarang menyebabkan saldo negatif (zero overdraft) dan dilarang mengurangi hak pihak lain.
25. **Multi-Rekening Bank Aktif Merchant (MBD-018 / WP-014, 21 Oktober 2026):** Satu merchant diperbolehkan memiliki beberapa rekening bank aktif sekaligus. Merchant memilih rekening tujuan per pengajuan pencairan dana. Rekening terikat snapshot pada pengajuan dan dilarang diubah secara diam-diam.
26. **Wewenang Verifikasi Rekening oleh Admin Keuangan (MBD-017 & MBD-019 / WP-014, 21 Oktober 2026):** Admin Keuangan bertanggung jawab memverifikasi dan menyetujui rekening baru atau perubahan rekening sebelum dapat digunakan. Rekening belum diverifikasi dilarang menjadi tujuan pencairan. Perubahan rekening berlaku prospektif untuk pengajuan berikutnya tanpa mengubah pengajuan yang sedang berjalan/disetujui.
27. **Batas Minimum Penarikan Dana Rp1.000.000 Gross (MBD-039 / WP-014, 21 Oktober 2026):** Batas minimum pengajuan penarikan dana merchant adalah Rp1.000.000 per pengajuan kotor sebelum pemotongan biaya admin. Dilarang menafsirkan sebagai nominal bersih.
28. **Model Flat Biaya Admin & Wewenang Super Admin SaaS (MBD-040 / WP-014, 21 Oktober 2026):** Pencairan mandiri via payment gateway dikenakan biaya admin model nominal tetap (flat), bukan persentase. Besaran tarif dikonfigurasi eksklusif oleh Super Admin SaaS pada platform SaaS (bukan tenant/merchant). UI menampilkan label "Biaya Admin" tanpa menampilkan penerima. Biaya dipotong dari nominal pengajuan (`Nominal Bersih = Nominal Pengajuan - Biaya Admin`). Besaran tarif rupiah belum diputuskan dan menjadi keputusan platform SaaS tersendiri.
29. **Pengecualian Biaya Admin untuk Pencairan oleh Admin Keuangan (MBD-040 / WP-014, 21 Oktober 2026):** Jika pencairan dieksekusi oleh Admin Keuangan, merchant bebas biaya admin (`Nominal Bersih = Nominal Pengajuan`).
30. **Kebijakan Penolakan Pengajuan Penarikan (WD-01 / WP-015, 21 Oktober 2026):** Jika penarikan ditolak Admin Keuangan, dana cadangan dilepas kembali seketika menjadi dana tersedia, merchant boleh mengajukan penarikan baru, alasan penolakan tercatat auditabel, dan dilarang dicatat sebagai pencairan sukses. Pelepasan dana dilarang memicu saldo negatif.
31. **Kebijakan Pembatalan Mandiri Sebelum Approval (WD-02 / WP-015, 21 Oktober 2026):** Merchant hanya berhak membatalkan pengajuan secara mandiri sebelum persetujuan Admin Keuangan. Pembatalan melepaskan dana cadangan tepat satu kali (idempotent). Pasca-approval, hak pembatalan mandiri tertutup. Larangan ini tidak membatasi tindakan darurat penghentian transfer yang belum dikirim ke perbankan sesuai aturan operasional lain.
32. **Kebijakan Hasil Transfer Belum Pasti (WD-03 / WP-015, 21 Oktober 2026):** Jika hasil transfer belum dapat dipastikan di perbankan/gateway, dana WAJIB TETAP DICADANGKAN menunggu bukti hasil rekonsiliasi. Dilarang menganggap sukses atau otomatis gagal, dan dilarang melepaskan dana cadangan hanya karena batas waktu timeout terlampaui.
33. **Kebijakan Pencairan Dipastikan Gagal (WD-04 / WP-015, 21 Oktober 2026):** Jika transfer dipastikan gagal berdasarkan bukti yang memadai, merchant BEBAS BIAYA ADMIN (Rp0). Dana cadangan dipulihkan secara terkendali ke dana tersedia tanpa pengembalian ganda atau saldo negatif. Dilarang mencatat sukses, dan dilarang membebankan biaya gateway provider ke merchant tanpa persetujuan PO yang sah.

### B. Berstatus REKOMENDASI AGENT (Usulan Teknis Menunggu Evaluasi PO):
1. **Rekomendasi Lanjutan HPP & Kontrak:** Usulan metode alokasi HPP (FIFO/rata-rata), perlakuan refund terhadap HPP, dan format data snapshot komisi per baris transaksi.
2. **Rekomendasi MBD-002:** Persentase komisi bagi hasil dikunci (*snapshot*) pada setiap baris transaksi penjualan saat checkout.
3. **Rekomendasi MBD-005:** Prosedur teknis cut-off dan settlement interim saat amandemen kontrak di tengah periode berjalan.
4. **Rekomendasi MBD-006:** Status Admin Takeover otomatis berakhir seketika PIC baru resmi menerima penugasan.
5. **Rekomendasi MBD-007:** Evaluasi batas durasi takeover setiap 14 hari dengan eskalasi.
6. **Rekomendasi MBD-010:** Pengiriman ulang undangan otomatis membatalkan (*revoke*) token undangan lama.
7. **Rekomendasi MBD-011:** Batas pengiriman ulang undangan maksimal 3 kali per email per 24 jam.
8. **Rekomendasi MBD-014:** Jadwal siklus settlement vendor mingguan (cut-off Ahad, pembayaran Rabu).
9. **Rekomendasi MBD-015:** Pencairan dana vendor menerapkan Four-Eyes Principle (verifikator staf keuangan + approval Admin Keuangan).
10. **Rekomendasi Teknis Verifikasi Rekening (MBD-017):** Usulan teknis metode pembuktian kepemilikan rekening (buku tabungan, e-statement, atau micro-deposit) dan SOP rekening yang ditolak. *(Prinsip wewenang verifikasi Admin Keuangan telah diputuskan PO; metode teknis tetap rekomendasi).*
11. *(Catatan MBD-018: Rekomendasi lama 1 rekening aktif telah DIGUGURKAN oleh Keputusan PO WP-014 yang mengizinkan multi-rekening aktif).*
12. **Rekomendasi MBD-023:** Disediakan tombol darurat pencabutan akses (*Emergency Kill Switch*) yang langsung memutuskan sesi kasir seketika.
13. **Rekomendasi MBD-035:** Opsi pembuatan skema tabel terpisah (misalnya nama kerja `merchant_payout_profiles`) untuk memisahkan data rekening vendor. *(Nama tabel dan desain skema ini murni rekomendasi teknis agent, belum diputuskan PO).*

---

## 4. SIKLUS 4: KOREKSI WP-M2-MERCHANT-BUSINESS-DECISIONS-002 (20 Oktober 2026)

| ID | Dokumen / Bagian | Sebelum → Sesudah | Alasan | Sumber | Jenis |
|---|---|---|---|---|:---:|
| **CHG-013** | SOT, header Status | "SOT RATIFIED" → "CONSOLIDATED DRAFT"; ratifikasi formal `[BELUM DIVERIFIKASI]` | Tidak ada bukti ratifikasi formal di repository | Mandat WP-002 §3; pencarian repo | M |
| **CHG-014** | SOT 2.11 Model 3 | "Sewa Tetap / Konsesi Penuh", operator bayar sewa → "seluruh hasil hak operator sesuai kontrak"; sewa/konsesi ke MBD-028 | Sewa tetap tidak punya bukti keputusan PO | Mandat WP-002 §4; PO 3.11 | M |
| **CHG-015** | SOT 2.11 Model 1 | Contoh 90/10 ditandai ilustrasi agent | Angka bukan keputusan PO | PO 3.11 | E |
| **CHG-016** | SOT 2.4, 2.5 | "berwenang" PIC → kewenangan terbatas merchant/fungsi/resource; batas PIC dieksplisitkan | Hindari tafsir kewenangan tanpa batas | Mandat WP-002 §5; PO 3.5 | M |
| **CHG-017** | SOT 2.6 | Hapus "cuti/berhalangan" dan cakupan "staf dan katalog" takeover; klaim "pelayanan tetap normal" dilunakkan | Tambahan agent; transaksi tanpa PIC tidak boleh disimpulkan selalu boleh | Mandat WP-002 §6.3, 6.5 | M |
| **CHG-018** | SOT 1 & 2.9 & 3 | Sumber DESIGN-001/002 ditandai tidak ditemukan; istilah "Admin Keuangan" ditegaskan | Verifikasi file: tidak ada; peran dipisahkan | Pencarian repo; Mandat §3 | M |
| **CHG-019** | Register MBD-001 | `OPEN` → `NEEDS_CLARIFICATION` | Tiga model sudah diputuskan; status dana sebelum settlement belum | PO 3.11 | K |
| **CHG-020** | Register MBD-009 | `OPEN` → `NEEDS_CLARIFICATION`; asumsi persetujuan Bendahara dicabut | Tidak ada keputusan PO soal Bendahara pada penunjukan PIC | PO 3.3, 3.6; Mandat §6.1 | K+M |
| **CHG-021** | Register MBD-013 | `OPEN` → `NEEDS_CLARIFICATION` | Akun lama dipakai kembali sudah diputuskan; salah email/lintas konteks belum | PO 3.2, 3.8 | K |
| **CHG-022** | Register MBD-015 | `OPEN` → `NEEDS_CLARIFICATION` | Persetujuan Admin Keuangan sudah diputuskan; pembagian peran belum | PO 3.9 | K |
| **CHG-023** | Register MBD-020 | Tetap `NEEDS_CLARIFICATION`; dicatat indikasi PO 3.7 | Pembedaan hak diundang kembali vs penugasan aktif bersamaan | Mandat §6.4 | E |
| **CHG-024** | Register MBD-006, 008, 024, 025 | Tetap `NEEDS_CLARIFICATION`; prinsip PO dipisah dari detail terbuka | Prinsip disepakati, detail operasional belum | Mandat §6.2, 6.3, 6.5 | K+E |
| **CHG-025** | Register MBD-021 | Dicatat potensi konflik rekomendasi `PENDING_ACCEPTANCE` dengan PO 3.3/3.7 | Rekomendasi bisa memberi akses sebelum penerimaan | PO 3.3, 3.7 | M |
| **CHG-026** | Register MBD-002 | Sitasi DRAFT-EXT-001 dikoreksi | Pencarian komisi pada draf tidak menemukan definisi snapshot | Temuan F-01 | M |
| **CHG-027** | Register MBD-026..031 | ID baru MBD-026 s/d MBD-031 ditambahkan | Pertanyaan mandat §4.x belum punya ID tersendiri | Mandat §4, §6 | K |
| **CHG-028** | Register GOV-001/002 | Item governance dicatat terpisah | Pisahkan governance dari keputusan bisnis | Mandat §3 | E |
| **CHG-029** | Change log CHG-003..005 | Catatan sumber tidak ditemukan | Tidak dapat diverifikasi independen | Pencarian repo | E |

---

## 5. SIKLUS 5: KOREKSI TARGETED WP-M2-MERCHANT-BUSINESS-DECISIONS-004 (20 Oktober 2026)

| ID | Dokumen / Bagian | Uraian Koreksi / Temuan yang Ditangani | Alasan & Bukti Validasi | Jenis |
|---|---|---|---|:---:|
| **CHG-030** | Register Catatan Sumber & MBD-002 | **Koreksi F-01:** Memperbaiki narasi pencarian sumber DRAFT-EXT-001. Mencatat fakta aktual: L86-87 memuat `managementModel`, L129 memuat snapshot `merchantName`, tetapi snapshot persentase komisi tidak ada di file tersebut (`[BELUM DIVERIFIKASI]`). | Menghilangkan klaim pencarian salah yang memicu false negative pada laporan sebelumnya. | M |
| **CHG-031** | SOT Bagian 3, Register MBD-035 | **Koreksi F-02:** Mendokumentasikan secara eksplisit 4 konflik desain material antara `DRAFT-FINANCE-MERCHANT-WALLET-EXTENSION-001.md` dan Keputusan PO (2 model vs 3 model; rekening di tabel operasional vs terpisah; `CASCADE` vs `RESTRICT`; unique kasir 1:1 vs multi-fungsi) dengan status `DESIGN CONFLICT — UNRESOLVED`. Menambahkan MBD-035. | Mengakui konflik desain keuangan secara transparan tanpa merombak file draf keuangan secara sepihak. | M |
| **CHG-032** | Changelog Bagian 1 & 3.A | **Koreksi F-03:** Menghapus seluruh frasa "telah diratifikasi", "ratifikasi konsolidasi", dan "Disahkan & Tidak Boleh Diubah Agent" dari changelog. Menegaskan status dokumen sebagai *CONSOLIDATED DRAFT*. | Menghindari klaim ratifikasi formal tanpa bukti artefak governance resmi. | E |
| **CHG-033** | SOT Bagian 2 (2.1 s/d 2.10) | **Koreksi F-05:** Memberi label eksplisit `[INFERENSI AGENT]` atau `[BELUM DIPUTUSKAN PO]` pada rincian teknis yang sebelumnya tercantum di bawah bagian "SUDAH DISEPAKATI PO" (status `EXPIRED`, istilah `Suspended`, audit log "permanen", identitas pengubah "dan alasan", penyimpanan "terpisah fisik", syarat otomatisasi retur matang, Second Role "berbatas waktu"). | Memisahkan keputusan murni PO dari inferensi arsitektural agent secara ketat. | M |
| **CHG-034** | SOT Bagian 5 | **Koreksi F-06:** Menyusun Matriks Tahapan Akses & Lifecycle (6 tahapan) yang membedakan secara tegas antara undangan dikirim, undangan diterima, akun aktif, penugasan aktif, hak dashboard, dan hak transaksi POS kasir. | Mengatasi ketiadaan batas tahapan siklus hidup akses eksternal. | M |
| **CHG-035** | SOT 2.7.B, Register MBD-034 | **Koreksi F-07:** Mengoreksi pernyataan penonaktifan akun eksternal. PO hanya menyatakan penonaktifan jika tidak ada tugas aktif di tenant. Menambahkan pertanyaan terbuka MBD-034 untuk cakupan multi-tenant (per-tenant vs platform global). | Mencegah asumsi penonaktifan akun secara global platform tanpa keputusan PO. | M |
| **CHG-036** | Register MBD-009 | **Koreksi F-08:** Menghilangkan kontradiksi pada MBD-009. Memisahkan kewenangan Super Admin Tenant dalam menunjuk PIC pengganti dari pertanyaan apakah alur aktivasi mengikuti alur email PIC pertama atau memerlukan langkah tambahan. | Menyelaraskan teks keputusan PO dengan pertanyaan bisnis yang diajukan. | M |
| **CHG-037** | Register MBD-003, MBD-032, MBD-033 | **Koreksi F-09:** Memecah MBD-003 yang sebelumnya menggabungkan 4 isu menjadi 3 MBD terpisah: MBD-003 (selisih kas fisik vs sistem), MBD-032 (retur/refund dan pembatalan belanja santri), dan MBD-033 (pembebanan biaya operasional merchant). | Memenuhi aturan mandat agar pertanyaan bisnis tidak digabungkan secara majemuk. | K |
| **CHG-038** | Changelog CHG-004 & Bagian 3.A | **Koreksi F-10:** Mengoreksi bahasa CHG-004 dari menjamin pelayanan kasir tetap berjalan menjadi "penugasan staf yang sah tidak otomatis dibatalkan saat PIC nonaktif". Menyelaraskan dengan MBD-029. | Menghindari klaim kepastian operasional yang melampaui keputusan PO. | E |
| **CHG-039** | SOT Bagian 4 | **Koreksi F-11:** Menegaskan bahwa tabel evaluasi invariant Tahap 2 adalah keselarasan konseptual tingkat desain dokumen, bukan hasil verifikasi empiris implementasi aktual (`[BELUM DIVERIFIKASI SECARA IMPLEMENTATIF]`). | Menghindari klaim pengujian sistem yang belum diverifikasi. | E |
| **CHG-040** | SOT, Register, Changelog | **Koreksi F-12:** Menyeragamkan penggunaan istilah resmi PO yaitu "Admin Keuangan". Mencatat padanan "Bendahara" pada GOV-002 sebagai terminologi yang memerlukan pemetaan role teknis. | Mencegah kerancuan antara sebutan kultural dan nama role sistem. | E |
| **CHG-041** | Register Bagian 2 | **Koreksi F-14:** Memastikan kolom Keputusan PO pada Register hanya memuat label `[KEPUTUSAN PO]` dan `[BELUM DIPUTUSKAN PO]`. Memindahkan seluruh analisis risiko/rekomendasi ke kolom Rekomendasi Agent. | Menjaga kepatuhan pelabelan register keputusan. | E |

---

## 6. SIKLUS 6: INKORPORASI KEPUTUSAN PO & VALIDASI TERARAH WP-M2-MERCHANT-BUSINESS-DECISIONS-005 (20 Oktober 2026)

Sumber koreksi: Mandat PO WP-005 dan Persetujuan Eksplisit PO atas Opsi A (Percakapan 20 Oktober 2026).

| ID | Dokumen / Bagian | Uraian Perubahan / Inkorporasi | Alasan & Bukti Validasi | Jenis |
|---|---|---|---|:---:|
| **CHG-042** | SOT 2.12 & Register MBD-021 | **Inkorporasi Keputusan PO Opsi A:** Mencatat keputusan PO resmi bahwa calon staf dengan undangan berstatus `PENDING_ACCEPTANCE` dilarang transaksi kasir; penerimaan undangan tidak otomatis mengaktifkan penugasan kasir; hak operasional kasir baru diberikan setelah penugasan aktif. Status MBD-021 berubah dari `OPEN` ke `NEEDS_CLARIFICATION`. | Persetujuan eksplisit PO dalam percakapan 20 Oktober 2026. | K+M |
| **CHG-043** | SOT Bagian 5 | **Validasi Matriks Akses:** Menyelaraskan matriks 6 tahapan akses: transaksi kasir ditolak keras sebelum penugasan aktif; hak akses dashboard atau hak baca dicatat secara akurat sebagai `[BELUM DIPUTUSKAN PO]` (tidak otomatis dilarang secara sepihak). | Kepatuhan mandat WP-005 Bagian 4: hak dashboard tidak boleh diputuskan sepihak. | M |
| **CHG-044** | Register MBD-035 & SOT Bagian 3 | **Validasi MBD-035 (Rekening Payout):** Menegaskan bahwa keputusan PO memisahkan rekening dari profil operasional TIDAK otomatis menyetujui nama tabel `merchant_payout_profiles` atau DDL skema tertentu. Nama tabel tersebut dicatat murni sebagai rekomendasi teknis agent. Konflik tetap berstatus `DESIGN CONFLICT — UNRESOLVED`. | Kepatuhan mandat WP-005 Bagian 5. | M |
| **CHG-045** | Register & Executive Summary | **Penyelarasan Rekapitulasi Status:** Memutakhirkan rekapitulasi status register: Total 35 item (0 `DECIDED`, 14 `NEEDS_CLARIFICATION`, 20 `OPEN`, 1 `DEFERRED`). | Menjaga konsistensi silang antar dokumen. | E |

---

## 7. SIKLUS 7: INKORPORASI KEPUTUSAN PO MBD-001 WP-M2-MERCHANT-BUSINESS-DECISIONS-007 (20 Oktober 2026)

Sumber koreksi: Mandat PO WP-007 dan Persetujuan Eksplisit PO atas MBD-001 (Opsi A — Unified Central Escrow & Pembagian Riil di Luar Aplikasi).

| ID | Dokumen / Bagian | Uraian Perubahan / Inkorporasi | Alasan & Bukti Validasi | Jenis |
|---|---|---|---|:---:|
| **CHG-046** | SOT 2.13 & Register MBD-001 | **Inkorporasi Keputusan PO MBD-001:** Mencatat arah prinsip bisnis Unified Central Escrow (Opsi A): seluruh transaksi merchant dicatat sebagai dana titipan terpusat sampai settlement. Menegaskan pembagian riil hasil transaksi dilakukan di luar aplikasi; aplikasi bertugas mencatat transaksi, data rekonsiliasi, dan keuntungan bersih (bukan menentukan atau mengeksekusi pembagian riil). Status MBD-001 berubah menjadi `DECIDED`. | Keputusan eksplisit PO pada WP-007 (20 Oktober 2026). | K+M |
| **CHG-047** | SOT 2.13 & Register MBD-001 | **Pemisahan Detail Hukum & Akuntansi:** Menetapkan bahwa detail hukum perbankan/syariah, kepatuhan pajak, perlakuan akuntansi, dan definisi operasional keuntungan bersih tetap berstatus `[BELUM DIPUTUSKAN PO]` sebagai tindak lanjut sebelum implementasi teknis. | Kepatuhan batasan mandat WP-007: tidak mengarang klausul hukum/akuntansi tanpa PO. | M |
| **CHG-048** | Register & Executive Summary | **Penyelarasan Rekapitulasi Status:** Memutakhirkan rekapitulasi status register: Total 35 item (1 `DECIDED`, 13 `NEEDS_CLARIFICATION`, 20 `OPEN`, 1 `DEFERRED`). | Menjaga konsistensi silang antar dokumen pasca-penetapan MBD-001. | E |

---

## 8. SIKLUS 8: INKORPORASI KEPUTUSAN PO WP-M2-MERCHANT-BUSINESS-DECISIONS-009 (20 Oktober 2026)

Sumber koreksi: Mandat PO WP-009 dan Keputusan Eksplisit PO DEC-008-A, DEC-008-B, DEC-008-C.

| ID | Dokumen / Bagian | Uraian Perubahan / Inkorporasi | Alasan & Bukti Validasi | Jenis |
|---|---|---|---|:---:|
| **CHG-049** | SOT 2.14 & Register MBD-001 | **Inkorporasi DEC-008-A (Fitur HPP & Biaya Langsung):** Menetapkan bahwa aplikasi wajib menyediakan fitur input HPP dan biaya langsung sejak tahap pertama untuk mencatat komponen yang diperlukan dalam menghitung keuntungan bersih merchant. Detail metode alokasi HPP tetap berstatus `[BELUM DIPUTUSKAN PO]`. | Keputusan eksplisit PO DEC-008-A pada WP-009 (20 Oktober 2026). | K+M |
| **CHG-050** | SOT 2.14 & Register MBD-002 | **Inkorporasi DEC-008-B (Basis Bagi Hasil Model 1):** Menetapkan bahwa dasar perhitungan bagi hasil mengikuti kontrak masing-masing merchant (bukan satu basis universal); aplikasi bertugas mencatat dan menyajikan angka sesuai kontrak. MBD-002 diperbarui. | Keputusan eksplisit PO DEC-008-B pada WP-009 (20 Oktober 2026). | K+M |
| **CHG-051** | SOT 2.14 & Register MBD-033 | **Inkorporasi DEC-008-C (Biaya Utilitas & Sewa):** Menetapkan bahwa biaya sewa, listrik, air, dan kebersihan pada tahap awal dicatat/ditagih secara terpisah di luar aplikasi dan tidak otomatis memotong hak merchant di aplikasi. Status MBD-033 berubah menjadi `DECIDED`. | Keputusan eksplisit PO DEC-008-C pada WP-009 (20 Oktober 2026). | K+M |
| **CHG-052** | Register & Executive Summary | **Penyelarasan Rekapitulasi Status:** Memutakhirkan rekapitulasi status register: Total 35 item (2 `DECIDED`, 13 `NEEDS_CLARIFICATION`, 19 `OPEN`, 1 `DEFERRED`). | Menjaga konsistensi silang antar dokumen pasca-penetapan DEC-008. | E |

---

## 9. SIKLUS 9: INKORPORASI KEPUTUSAN PO WP-M2-MERCHANT-BUSINESS-DECISIONS-011 (20 Oktober 2026)

Sumber koreksi: Mandat PO WP-011 dan Keputusan Eksplisit PO DEC-028-A, DEC-028-B, DEC-028-C (20 Oktober 2026).

| ID | Dokumen / Bagian | Uraian Perubahan / Inkorporasi | Alasan & Bukti Validasi | Jenis |
|---|---|---|---|:---:|
| **CHG-053** | SOT 2.15 & Register MBD-028 | **Inkorporasi DEC-028-A (Kontribusi Operator Model 3):** Menetapkan bahwa kontribusi operator kepada pondok mengikuti kesepakatan kontrak masing-masing merchant (dapat berbayar atau tanpa sewa); penagihan di luar aplikasi tanpa pemotongan otomatis. | Keputusan eksplisit PO DEC-028-A pada WP-011 (20 Oktober 2026). | K+M |
| **CHG-054** | SOT 2.15 & Register MBD-028 | **Inkorporasi DEC-028-B (Kepemilikan Reader RFID Hibrida):** Menetapkan skema hibrida kepemilikan reader RFID (dapat dimiliki pesantren atau operator sesuai kontrak); tanggung jawab perangkat mengikuti kontrak. Status MBD-028 berubah menjadi `DECIDED`. | Keputusan eksplisit PO DEC-028-B pada WP-011 (20 Oktober 2026). | K+M |
| **CHG-055** | SOT 2.15 & Register MBD-028 | **Inkorporasi DEC-028-C (Batas Pencatatan Perangkat):** Menetapkan batasan informasi perangkat yang dicatat aplikasi (status kepemilikan, ID/SN reader, periode kontrak, memo kewajiban); modul depresiasi aset tidak termasuk. | Keputusan eksplisit PO DEC-028-C pada WP-011 (20 Oktober 2026). | K+M |
---

## 10. SIKLUS 10: INKORPORASI KEPUTUSAN PO WP-MERCHANT-BUSINESS-DECISIONS-013 (20 Oktober 2026)

Sumber koreksi: Mandat PO WP-013 dan Keputusan Eksplisit PO terkait Tiga Model Merchant, HPP & Biaya Langsung, Pembayaran Santri Internal, Rekapitulasi Hak Dana Dashboard Admin Keuangan, Alur Operasional Penarikan Dana (Withdrawal), serta Sekuens Resmi Pergantian PIC.

| ID | Dokumen / Bagian | Uraian Perubahan / Inkorporasi | Alasan & Bukti Validasi | Jenis |
|---|---|---|---|:---:|
| **CHG-057** | SOT 2.11 & Register MBD-002 | **Inkorporasi 3 Model Merchant & Larangan Hardcode:** Mengonsolidasi aturan PO bahwa persentase pembagian hasil tidak boleh di-hardcode (ditentukan saat pembuatan merchant per kontrak); sistem mencatat HPP, harga jual, keuntungan, porsi pemilik, porsi pesantren; Model 2 tanpa bagi hasil; Model 3 keuntungan hak pondok. Ketiga model tidak ditentukan oleh status internal/eksternal personil. | Keputusan eksplisit PO WP-013 Bagian 4 (20 Oktober 2026). | K+M |
| **CHG-058** | SOT 2.14 & Executive Summary | **Penetapan Contoh Ilustrasi Non-Universal:** Menegaskan bahwa angka contoh PO (HPP 35rb, jual 40rb, untung 5rb, 50% split) murni contoh kasus ilustratif, bukan rumus default 50% universal. Pembagian riil tetap mengikuti kontrak masing-masing merchant. | Keputusan eksplisit PO WP-013 Bagian 5 (20 Oktober 2026). | M |
| **CHG-059** | SOT 2.11, SOT 2.14, & Register MBD-004 | **Inkorporasi Keputusan PO MBD-004 (Penerapan Prospektif):** Menetapkan bahwa perubahan kontrak merchant hanya berlaku prospektif dan dilarang diam-diam mengubah perhitungan transaksi historis. Aturan kontrak saat transaksi harus dapat diaudit kembali. Status MBD-004 naik menjadi `DECIDED`. | Keputusan eksplisit PO WP-013 Bagian 4 (20 Oktober 2026). | K+M |
| **CHG-060** | SOT 2.6 & Register MBD-008 | **Inkorporasi Keputusan PO MBD-008 (Pengakhiran Mandat PIC Lama):** Menetapkan bahwa mandat PIC lama berakhir dan dicabut secara atomik saat Super Admin Tenant mengeksekusi tindakan resmi "Ganti PIC". Mencegah 2 PIC aktif bersamaan dan mempertahankan PIC lama jika proses gagal. Status MBD-008 naik menjadi `DECIDED`. | Keputusan eksplisit PO WP-013 Bagian 9 (20 Oktober 2026). | K+M |
| **CHG-061** | SOT 2.6 & Register MBD-009 | **Inkorporasi Keputusan PO MBD-009 (Alur 7 Tahap Aktivasi PIC Pengganti):** Menetapkan sekuens resmi pergantian PIC (Super Admin pilih calon -> konfirmasi kesediaan calon -> Super Admin klik "Ganti PIC" -> pengesahan atomik). Konfirmasi mandat hanya tanda kesediaan, bukan aktivasi otomatis. Status MBD-009 naik menjadi `DECIDED`. | Keputusan eksplisit PO WP-013 Bagian 9 (20 Oktober 2026). | K+M |
| **CHG-062** | SOT 2.16 & Register MBD-036 | **Inkorporasi Keputusan PO MBD-036 (Pembayaran Santri Non-Gateway):** Menetapkan bahwa pembayaran santri ke merchant adalah transaksi internal APP MA’HAD tanpa payment gateway (bebas invoice Flip, webhook, atau biaya gateway di kasir). Saldo uang saku terpotong seketika dan hak dana berpindah secara internal. Penambahan ID MBD-036 dengan status `DECIDED`. | Keputusan eksplisit PO WP-013 Bagian 6 (20 Oktober 2026). | K+M |
| **CHG-063** | SOT 2.17 & Register MBD-037 | **Inkorporasi Keputusan PO MBD-037 (Buku Pembantu & 4 Status Saldo Dashboard):** Menetapkan struktur dashboard Admin Keuangan (ringkasan total gabungan + grid card per merchant), isolasi pembukuan logis per merchant, dan pemisahan 4 status saldo: Total Hak Dana, Sudah Dicairkan, Dicadangkan, dan Dana Tersedia. Penambahan ID MBD-037 dengan status `DECIDED`. | Keputusan eksplisit PO WP-013 Bagian 7 (20 Oktober 2026). | K+M |
| **CHG-064** | SOT 2.18 & Register MBD-038 | **Inkorporasi Keputusan PO MBD-038 (Alur 5 Tahap Withdrawal & Invariant Proteksi):** Menetapkan alur resmi penarikan dana merchant (Pengajuan -> Cek dana tersedia -> Approval Admin Keuangan -> Eksekusi pencairan -> Konfirmasi riil), hak pengaju PIC/staf berwenang auditabel, larangan penyatuan status, serta proteksi zero-overdraft dan non-subsidi silang. Penambahan ID MBD-038 dengan status `DECIDED`. | Keputusan eksplisit PO WP-013 Bagian 8 (20 Oktober 2026). | K+M |
| **CHG-065** | SOT Bagian 3, Register MBD-014, 015, 017, 018, 035 | **Penegasan Detail Terbuka & Konflik F-02:** Menegaskan bahwa rincian jadwal settlement, pembagian peran verifikator, SOP verifikasi rekening, dan batas jumlah rekening tetap terbuka. Menegaskan kembali status `DESIGN CONFLICT — UNRESOLVED` pada draf proposal finansial, dan usulan nama tabel `merchant_payout_profiles` murni rekomendasi teknis agent. | Kepatuhan batasan mandat WP-013 Bagian 2, 8.4, 10, dan 11. | M |
| **CHG-066** | Register & Executive Summary | **Penyelarasan Rekapitulasi Status Register (Total 38 Item):** Memutakhirkan rekapitulasi status register: Total 38 item (9 `DECIDED`, 11 `NEEDS_CLARIFICATION`, 17 `OPEN`, 1 `DEFERRED`). | Menjaga konsistensi silang antar dokumen pasca-konsolidasi WP-013. | E |

---

## 11. SIKLUS 11: INKORPORASI KEPUTUSAN PO WP-MERCHANT-BUSINESS-DECISIONS-014 (21 Oktober 2026)

Sumber koreksi: Mandat PO WP-014 dan Keputusan Eksplisit PO terkait Multi-Rekening Payout Merchant, Verifikasi & Approval Rekening oleh Admin Keuangan, Batas Minimum Penarikan Dana Rp1.000.000 Gross, Model Flat Biaya Admin Penarikan Mandiri oleh Super Admin SaaS, serta Pengecualian Biaya Admin pada Pencairan oleh Admin Keuangan.

| ID | Dokumen / Bagian | Uraian Perubahan / Inkorporasi | Alasan & Bukti Validasi | Jenis |
|---|---|---|---|:---:|
| **CHG-067** | SOT 2.10 & Register MBD-018 | **Inkorporasi Keputusan PO MBD-018 (Multi-Rekening Aktif):** Menggugurkan rekomendasi teknis lama (1 rekening aktif per merchant). Menetapkan bahwa satu merchant boleh memiliki beberapa rekening bank aktif sekaligus dan merchant memilih rekening tujuan untuk setiap pengajuan pencairan dana. Status MBD-018 naik menjadi `DECIDED`. | Keputusan eksplisit PO WP-014 Bagian 4 (21 Oktober 2026). | K+M |
| **CHG-068** | SOT 2.10 & Register MBD-017 | **Inkorporasi Keputusan PO MBD-017 (Wewenang Verifikasi Rekening Admin Keuangan):** Menetapkan bahwa Admin Keuangan bertanggung jawab memverifikasi dan menyetujui rekening baru atau perubahan rekening sebelum dapat digunakan. Rekening belum diverifikasi dilarang menjadi tujuan pencairan. Status MBD-017 naik menjadi `DECIDED`. Detail teknis metode validasi/bukti tetap terbuka. | Keputusan eksplisit PO WP-014 Bagian 5 (21 Oktober 2026). | K+M |
| **CHG-069** | SOT 2.10 & Register MBD-019 | **Inkorporasi Keputusan PO MBD-019 (Penerapan Prospektif & Snapshot Lock Rekening):** Menetapkan bahwa rekening yang telah dipilih dan disetujui terikat permanen pada pengajuan pencairan bersangkutan. Perubahan rekening berlaku prospektif untuk pengajuan berikutnya dan dilarang mengubah tujuan pencairan berjalan secara diam-diam. Status MBD-019 naik menjadi `DECIDED`. | Keputusan eksplisit PO WP-014 Bagian 4 & 5 (21 Oktober 2026). | K+M |
| **CHG-070** | SOT 2.18 & Register MBD-039 | **Inkorporasi Keputusan PO MBD-039 (Minimum Penarikan Rp1.000.000 Gross):** Menetapkan bahwa batas minimum pengajuan penarikan dana merchant adalah Rp1.000.000 per pengajuan kotor sebelum pemotongan biaya admin. Dilarang menafsirkan sebagai nominal bersih. Penambahan ID MBD-039 dengan status `DECIDED`. | Keputusan eksplisit PO WP-014 Bagian 6 (21 Oktober 2026). | K+M |
| **CHG-071** | SOT 2.18 & Register MBD-040 | **Inkorporasi Keputusan PO MBD-040 (Model Flat Fee & Wewenang Super Admin SaaS):** Menetapkan bahwa pencairan mandiri via gateway dikenakan biaya admin model nominal tetap (flat) per pengajuan (bukan persentase). Wewenang konfigurasi ada pada Super Admin SaaS di platform SaaS (tenant/merchant dilarang ubah). Penambahan ID MBD-040 dengan status `DECIDED`. | Keputusan eksplisit PO WP-014 Bagian 7 (21 Oktober 2026). | K+M |
| **CHG-072** | SOT 2.18 & Register MBD-040 | **Penetapan Status Terbuka Tarif Rupiah Platform SaaS:** Menegaskan bahwa besaran nominal tarif rupiah biaya admin belum diputuskan dalam register merchant ini dan merupakan keputusan konfigurasi tersendiri pada platform SaaS. Dilarang mengarang tarif rupiah default atau mengasumsikan sama dengan fee vendor gateway. | Keputusan eksplisit PO WP-014 Bagian 7 (21 Oktober 2026). | M |
| **CHG-073** | SOT 2.18 & Register MBD-040 | **Inkorporasi Keputusan PO MBD-040 (Pencairan via Admin Keuangan Bebas Biaya Admin):** Menetapkan bahwa jika pencairan dilakukan/dieksekusi oleh Admin Keuangan, merchant tidak dikenakan biaya admin (`Nominal Bersih = Nominal Pengajuan`). | Keputusan eksplisit PO WP-014 Bagian 8 (21 Oktober 2026). | K+M |
| **CHG-074** | SOT 2.18 & Dokumen Terkait | **Standarisasi Tampilan Transaksi & Formula Netto:** Menstandarkan formula `Nominal Bersih = Nominal Pengajuan - Biaya Admin` untuk pencairan mandiri via gateway dan formula `Nominal Bersih = Nominal Pengajuan` untuk pencairan via Admin Keuangan. Label antarmuka hanya menampilkan "Biaya Admin" tanpa membocorkan pihak penerima biaya. | Keputusan eksplisit PO WP-014 Bagian 7 & 9 (21 Oktober 2026). | M |
| **CHG-075** | SOT Bagian 3 & Dokumen Terkait | **Penegasan Status Rekomendasi Teknis F-02 & DDL:** Menegaskan kembali bahwa usulan nama tabel seperti `merchant_payout_profiles` murni rekomendasi teknis agent dan belum disahkan PO sebagai model fisik/DDL. Status F-02 tetap `DESIGN CONFLICT — UNRESOLVED`. | Mandat PO WP-014 Bagian 4 & 5 (21 Oktober 2026). | M |
| **CHG-076** | Register, Changelog, & Executive Summary | **Penyelarasan Rekapitulasi Status Register (Total 40 Item):** Memutakhirkan rekapitulasi status register: Total 40 item (14 `DECIDED`, 10 `NEEDS_CLARIFICATION`, 15 `OPEN`, 1 `DEFERRED`). | Menjaga konsistensi silang antar dokumen pasca-konsolidasi WP-014. | E |

---

## 12. SIKLUS 12: INKORPORASI KEPUTUSAN PO WP-MERCHANT-BUSINESS-DECISIONS-015 (21 Oktober 2026)

Sumber koreksi: Mandat PO WP-015 dan Keputusan Final PO terkait Penanganan Penolakan, Pembatalan, Ketidakpastian Hasil Transfer, dan Kegagalan Penarikan Dana Merchant (WD-01 s/d WD-04).

| ID | Dokumen / Bagian | Uraian Perubahan / Inkorporasi | Alasan & Bukti Validasi | Jenis |
|---|---|---|---|:---:|
| **CHG-077** | SOT 2.18 & Register MBD-041 | **Inkorporasi Keputusan Final PO WD-01 (Penolakan oleh Admin Keuangan):** Menetapkan bahwa jika pengajuan penarikan ditolak oleh Admin Keuangan, dana yang dicadangkan dilepaskan seketika menjadi dana tersedia; merchant boleh mengajukan penarikan baru; penolakan dilarang dicatat sebagai pencairan sukses; alasan penolakan wajib tercatat auditabel; dan pelepasan dana dilarang menyebabkan saldo negatif atau mengubah hak merchant lain. | Keputusan final PO WP-015 Bagian 4 (21 Oktober 2026). | K+M |
| **CHG-078** | SOT 2.18 & Register MBD-041 | **Inkorporasi Keputusan Final PO WD-02 (Pembatalan oleh Merchant):** Menetapkan bahwa merchant HANYA boleh membatalkan pengajuan secara mandiri SEBELUM Admin Keuangan memberikan persetujuan (approval); pembatalan melepaskan dana cadangan tepat satu kali (idempotent); pasca-approval hak pembatalan mandiri tertutup (tindakan penghentian teknis sebelum dana terkirim tunduk aturan operasional lain). | Keputusan final PO WP-015 Bagian 5 (21 Oktober 2026). | K+M |
| **CHG-079** | SOT 2.18 & Register MBD-041 | **Inkorporasi Keputusan Final PO WD-03 (Hasil Transfer Belum Pasti):** Menetapkan bahwa jika hasil transfer perbankan/gateway belum pasti, dana WAJIB TETAP DICADANGKAN hingga rekonsiliasi membuktikan hasil riil; dilarang sepihak menganggap sukses atau otomatis gagal; dilarang melepas dana hanya karena timeout; hasil terkonfirmasi diproses sesuai WD-04 (gagal) atau Completed (sukses). | Keputusan final PO WP-015 Bagian 6 (21 Oktober 2026). | K+M |
| **CHG-080** | SOT 2.18 & Register MBD-041 | **Inkorporasi Keputusan Final PO WD-04 (Pencairan Dipastikan Gagal):** Menetapkan bahwa jika pencairan dipastikan gagal melalui bukti memadai, merchant BEBAS BIAYA ADMIN PENARIKAN (Rp0); dana cadangan dipulihkan secara terkendali ke dana tersedia (zero overdraft, no double refund); dilarang mencatat sukses; biaya gateway provider SaaS dilarang dibebankan ke merchant tanpa persetujuan sah. | Keputusan final PO WP-015 Bagian 7 (21 Oktober 2026). | K+M |
| **CHG-081** | Register MBD-041 & Dokumen Terkait | **Penambahan MBD-041 (Kebijakan Penanganan Penarikan WD-01 s/d WD-04):** Mendaftarkan ID baru MBD-041 dengan status `DECIDED` untuk memayungi empat kebijakan penolakan, pembatalan, hasil belum pasti, dan kegagalan penarikan dana merchant. | Mandat PO WP-015 Bagian 10.B (21 Oktober 2026). | K |
| **CHG-082** | Register MBD-030, MBD-038 & SOT 2.18 | **Pemisahan Detail Terbuka & Penyelarasan MBD-030/038:** Memutakhirkan catatan MBD-030 dan MBD-038. Menegaskan bahwa kebijakan bisnis penolakan/kegagalan telah diputuskan PO, sedangkan SLA rekonsiliasi, standar bukti minimum kegagalan, dan prosedur penanganan biaya provider tetap berstatus terbuka (`OPEN`). | Mandat PO WP-015 Bagian 10.B (21 Oktober 2026). | M |
| **CHG-083** | SOT 2.18 & Dokumen Terkait | **Dokumentasi 8 Status Konseptual Mesin Penarikan & Invariant Akuntansi:** Mendokumentasikan 8 status konseptual (`REQUESTED`, `APPROVED`, `CANCELLED`, `REJECTED`, `PROCESSING`, `OUTCOME_UNKNOWN`, `FAILED`, `COMPLETED`) dan 7 entitas finansial. Menegaskan invariant pembukuan: pelepasan dana cadangan bukan pendapatan baru atau transaksi penjualan baru. | Mandat PO WP-015 Bagian 8 (21 Oktober 2026). | M |
| **CHG-084** | Register, Changelog, & Executive Summary | **Penyelarasan Rekapitulasi Status Register (Total 41 Item):** Memutakhirkan rekapitulasi status register: Total 41 item (15 `DECIDED`, 10 `NEEDS_CLARIFICATION`, 15 `OPEN`, 1 `DEFERRED`). | Menjaga konsistensi silang antar dokumen pasca-konsolidasi WP-015. | E |

