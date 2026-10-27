# MERCHANT BUSINESS DECISIONS — CONSOLIDATED (SOT)
## Repositori Resmi Keputusan Bisnis Domain Merchant & Canteen APP MA’HAD
**Dokumen Referensi:** WP-M2-MERCHANT-BUSINESS-DECISIONS-001 (direvisi WP-002, WP-004, WP-005, WP-007, WP-009, WP-011, WP-013, WP-014 & WP-015)  
**Status Dokumentasi:** CONSOLIDATED DRAFT — BUSINESS BASELINE (MENUNGGU REVIEW PO)  
**Status Ratifikasi Formal:** `[BELUM DIVERIFIKASI]` — tidak ditemukan bukti ratifikasi formal di repository. Tiga status dipisahkan secara tegas:
1. *PO Business Decision:* keputusan yang disampaikan/disetujui PO secara eksplisit dalam mandat/percakapan resmi.
2. *Document Consolidation:* konsolidasi dokumentasi teknis dan bisnis dalam dokumen ini.
3. *Formal Ratification:* proses ratifikasi formal governance yang belum terbukti (`GOV-001`).  
**Otorisasi Implementasi:** NOT GRANTED (Dokumentasi & Arsitektur Saja)  
**Pemilik Keputusan:** Product Owner APP MA’HAD  
**Konsolidator:** ZenOrion (Lead Orchestrator & Senior Systems Architect)  
**Tanggal Konsolidasi:** 21 Oktober 2026 (Revisi WP-015: 21 Oktober 2026)  

---

## 1. PENDAHULUAN & PRINSIP TATA KELOLA

Dokumen ini berfungsi sebagai draf konsolidasi kanonis atas seluruh keputusan bisnis yang telah disepakati oleh Product Owner (PO) APP MA’HAD terkait pengelolaan merchant, kantin, koperasi, dan unit usaha pesantren.

### Prinsip Tata Kelola Wajib:
1. **Pemisahan Peran:** PO adalah pemilik keputusan bisnis dan kebijakan akhir. ZenOrion bertindak sebagai analis dan arsitek teknis. Rekomendasi teknis agent tidak boleh dianggap sebagai keputusan bisnis PO sebelum disetujui secara eksplisit.
2. **Keterlacakan (Traceability):** Keputusan di bawah ini bersumber dari mandat PO dan catatan arahan PO dalam percakapan resmi. Dokumen `WP-M2-MERCHANT-ROLE-ASSIGNMENT-DESIGN-001` dan `-002` **tidak ditemukan sebagai file independen** di repository (hanya terekam dalam transkrip percakapan); rujukan ke keduanya berstatus `[BELUM DIVERIFIKASI SEBAGAI FILE]`.
3. **Nol Mutasi Kode:** Dokumen ini menetapkan baseline bisnis dokumentasi dan **bukan merupakan izin implementasi kode, DDL, maupun DML**.
4. **Pemisahan Rincian Teknis vs Keputusan PO (F-05):** Setiap terminologi teknis, status sistem, atau inferensi operasional yang belum diputuskan secara eksplisit oleh PO ditandai sebagai `[INFERENSI/REKOMENDASI AGENT]` atau `[BELUM DIPUTUSKAN PO]`.

---

## 2. KONSOLIDASI KEPUTUSAN BISNIS YANG TELAH DISEPAKATI PO

### 2.1. Model Identitas dan Kewenangan Pengguna (Empat Konsep Ortogonal)
Sistem secara mutlak memisahkan empat konsep kewenangan:
1. **Role Utama (Primary Role):** Identitas atau status institusional primer pengguna di dalam tenant pesantren (contoh: `GURU`, `SANTRI`, `MUSYRIF`, `STAFF`, `WALI`, `ADMIN`). *(Catatan implementasi: skema `identity.ts` mendefinisikan tabel `user_tenant_memberships` dengan kolom `primary_role_id` [TERBUKTI DI REPO], namun pemetaan logis lengkap Role Utama domain ini tetap berstatus [INFERENSI ARSITEKTUR]).*
2. **Second Role:** Kewenangan institusional tambahan yang dapat diberikan dan dicabut oleh yayasan/pesantren (contoh: `PENGURUS_KOPERASI`, `PEMBINA_ASRAMA`). *(Rincian bahwa Second Role "berbatas waktu" dicatat sebagai [INFERENSI AGENT], karena PO menetapkan bahwa kewenangan tersebut dapat diberikan, dinonaktifkan, berakhir, atau dicabut tanpa kewajiban batas waktu mutlak).*
3. **Penugasan Operasional Merchant (Operational Assignment):** Penugasan fungsional harian yang terikat ke satu merchant tertentu (contoh: PIC, kasir, petugas stok, pengelola produk, pelaporan).
4. **Permission Scope:** Batasan akses teknis berdasarkan kombinasi tenant, merchant target, fungsi, dan resource yang diizinkan.

**Aturan Bisnis Turunan:**
- Role Utama tidak boleh disamakan dengan jabatan merchant. Pencabutan tugas merchant tidak memengaruhi atau menghapus identitas institusional utama pengguna.
- Pengguna internal dapat memegang banyak penugasan operasional di beberapa merchant sekaligus sesuai kebutuhan riil pesantren. Tidak ada batasan kuota jumlah merchant buatan per staf.
- Penunjukan sebagai PIC atau kasir **TIDAK otomatis menjadikan pengguna sebagai pemilik merchant, pemilik pendapatan, atau pemegang hak pencairan dana**.

---

### 2.2. Identitas Pengguna Internal vs. Eksternal

Ketika merchant dibuat atau dikelola, sistem mendukung penetapan personil dari dua kategori:

#### A. Pengguna Internal Tenant (Asatidz, Karyawan, Santri)
- Menggunakan akun pengguna yang telah terdaftar di dalam tenant.
- Dipilih berdasarkan ID user (`userId`) yang valid; sistem dilarang membuat akun duplikat untuk pengguna yang sama.
- Role Utama pengguna tetap mengikuti status resminya (misal guru atau staf).
- Hak akses operasional merchant diberikan secara terpisah melalui Second Role dan/atau penugasan operasional yang sah.

#### B. Pengguna Eksternal (Vendor Rekanan, Karyawan Luar)
- Disediakan alur pembuatan akun baru jika calon staf belum memiliki akun di sistem.
- Menggunakan email dan password untuk proses autentikasi (login).
- Pengguna eksternal **tidak diwajibkan memiliki identitas institusional internal** (tidak perlu menjadi santri/guru).
- Hak akses diberikan secara eksklusif melalui alur: Undangan resmi -> Persetujuan -> Penugasan yang sah.
- Identitas akun pengguna dibedakan secara fisik/logis dari status penugasan operasional merchant.

---

### 2.3. Tata Kelola Penunjukan PIC Pertama

1. **Otoritas Penunjukan:** **Super Admin Tenant** (administrator tertinggi di tingkat tenant) menentukan calon PIC pertama ketika merchant baru didaftarkan atau dikonfigurasi.
2. **Pengiriman Undangan:** Sistem mengirimkan tautan undangan resmi kepada calon PIC melalui email.
3. **Konfirmasi Calon Internal:** Jika calon PIC adalah pengguna internal tenant, sistem mengaitkan undangan ke ID user yang sudah ada, dan calon PIC mengonfirmasi undangan via email.
4. **Registrasi Calon Eksternal:** Jika calon PIC adalah pengguna eksternal, calon PIC membuat akun dengan email dan kata sandi jika belum memiliki akun, lalu menyelesaikan konfirmasi.
5. **Kondisi Aktivasi:** Penugasan PIC berstatus aktif **hanya setelah** proses penerimaan undangan dan validasi yang berlaku terpenuhi.

---

### 2.4. Masa Berlaku dan Pengiriman Ulang Undangan (Invitation Lifecycle)

1. **Masa Berlaku Mutlak:** Undangan bagi calon PIC maupun calon staf berlaku tepat **1 × 24 jam (24 jam) sejak dikirimkan**.
2. **Kewenangan Pengelolaan Staf:** PIC Merchant yang aktif dapat mengelola pengguna merchant dan undangan staf pada merchant yang menjadi tanggung jawabnya.
3. **Pengiriman Ulang (Resend):** Jika calon staf belum/lupa mengonfirmasi, PIC dapat mengirim ulang undangan. Pengiriman ulang memulai masa berlaku baru selama 24 jam.
4. **Undangan Kedaluwarsa:** Undangan yang melewati 24 jam tanpa konfirmasi otomatis kedaluwarsa *(istilah teknis `EXPIRED`: [INFERENSI AGENT])* dan **tidak memberikan hak akses secara otomatis**. Detail pembatalan token lama dan batas resend belum diputuskan PO (lihat MBD-010 & MBD-011).

---

### 2.5. Perekrutan dan Persetujuan Staf Merchant

1. **Kewenangan PIC (Terbatas):** PIC Merchant berwenang mengundang dan menyetujui staf untuk merchant yang menjadi tanggung jawabnya. Hak akses dibatasi oleh tenant, merchant, dan tugas yang diberikan.
2. **Kategori Staf:**
   - Staf internal dipilih dari akun tenant yang sudah ada.
   - Staf eksternal membuat akun dengan email dan password jika belum memiliki akun.
3. **Aktivasi:** Aktivasi penugasan dilakukan setelah persyaratan undangan dan persetujuan terpenuhi. Penerimaan undangan oleh calon staf tidak otomatis mengaktifkan penugasan jika proses aktivasi penugasan belum selesai (Keputusan PO Opsi A, 20 Oktober 2026).
4. **Batas Akses:** Hak akses staf terbatas pada merchant dan tugas yang diberikan (misal kasir di Kantin A).
5. **Pembatasan Kewenangan PIC:** PIC tidak otomatis dapat mengubah atau menunjuk PIC lain dan dilarang mengambil alih kewenangan Super Admin Tenant.

---

### 2.6. Penunjukan, Pergantian, dan Pengambilalihan PIC (PO Decision WP-013)

1. **Otoritas Tunggal:** **Super Admin Tenant** adalah satu-satunya pihak yang berwenang menunjuk dan mengganti PIC merchant. PIC yang sedang menjabat tidak dapat menunjuk atau mengganti PIC atas kewenangannya sendiri.
2. **Keberlangsungan PIC Lama:** PIC lama harus tetap aktif melayani operasional sampai mekanisme pergantian resmi berhasil dieksekusi secara sah.
3. **Sekuens Resmi Pergantian PIC (Alur 7 Tahap):**
   1. Super Admin Tenant memilih calon PIC pengganti di sistem.
   2. Calon PIC menerima undangan/mandat dan melakukan konfirmasi kesediaan.
   3. Konfirmasi mandat **hanya menunjukkan kesediaan calon**; konfirmasi TIDAK otomatis mengaktifkannya sebagai PIC.
   4. Selama PIC lama masih aktif, calon tetap berstatus belum menjadi PIC resmi.
   5. Super Admin Tenant membuka pengaturan merchant dan menekan tindakan eksplisit **"Ganti PIC"**.
   6. Pada saat pergantian resmi berhasil, mandat PIC lama berakhir dan calon seketika menjadi PIC baru yang aktif secara atomik.
   7. Sistem mencatat riwayat pergantian secara lengkap: identitas pelaksana (Super Admin), PIC lama, PIC baru, serta stempel waktu kejadian (*timestamp*).
4. **Aturan Perlindungan Kegagalan (Fail-Safe Invariants):**
   - **Prasyarat Konfirmasi:** Dilarang keras menonaktifkan PIC lama sebelum calon pengganti memenuhi prasyarat konfirmasi mandat.
   - **Pencegahan PIC Ganda:** Dilarang keras mengaktifkan dua PIC utama sekaligus untuk merchant yang sama akibat kondisi balapan (*race condition*) atau proses pergantian yang tidak atomik.
   - **Penolakan Mandat:** Jika calon menolak atau tidak mengonfirmasi mandat, sistem dilarang mengeksekusi pergantian.
   - **Pemulihan Kegagalan:** Jika proses pergantian gagal di tengah jalan, sistem wajib mempertahankan PIC lama sebagai PIC aktif.
   - **Status Akses Calon Pra-Aktivasi:** Status hak akses dashboard calon sebelum aktivasi resmi berstatus `[BELUM DIPUTUSKAN PO]`.
5. **Pengambilalihan Sementara (Admin Takeover):** Super Admin Tenant dapat mengambil alih pengelolaan sementara ketika PIC tidak aktif atau saat menunggu penunjukan PIC pengganti definitif. Detail durasi, evaluasi berkala, dan mekanisme pengakhiran formal takeover berstatus `[BELUM DIPUTUSKAN PO]` (MBD-006 & MBD-007).
6. **Keberlangsungan Penugasan Staf:** Pergantian PIC atau penonaktifan PIC **tidak otomatis membatalkan/mencabut penugasan staf yang masih aktif**. Penugasan staf yang sah tetap berlanjut.

---

### 2.7. Pencabutan Peran dan Penugasan (Revocation & Account Lifecycle)

#### A. Dampak pada Pengguna Internal
- Ketika peran atau penugasan merchant dicabut, akses terhadap merchant dan tugas tersebut seketika dihentikan.
- Akun utama tidak ditutup atau diblokir hanya karena pencabutan penugasan merchant. Pengguna tetap dapat login sesuai Role Utama dan hak akses lain yang masih berlaku.

#### B. Dampak pada Pengguna Eksternal
- Ketika penugasan merchant dicabut, akses operasional ke merchant tersebut langsung dihentikan.
- **Kondisi Tanpa Penugasan Aktif Lain:** Jika tidak ada penugasan aktif lain yang menjadi dasar akses di tenant, akun eksternal dinonaktifkan *(istilah status `Suspended`: [INFERENSI AGENT])* sehingga tidak dapat login. *(Cakupan apakah penonaktifan berlaku per-tenant atau global multi-tenant berstatus [BELUM DIPUTUSKAN PO], lihat MBD-034).*
- **Kondisi Multi-Penugasan:** Jika masih ada penugasan aktif yang sah di merchant lain, akun tetap aktif dengan akses terbatas pada penugasan yang masih berlaku.
- **Perlindungan Riwayat:** Riwayat transaksi dan audit tidak dihapus ketika akun dinonaktifkan.

---

### 2.8. Aktivasi Kembali Akun Eksternal

1. **Re-aktivasi Sah:** Akun eksternal yang sudah dinonaktifkan boleh diaktifkan kembali melalui undangan baru yang sah.
2. **Pencegahan Akun Duplikat:** PIC merchant yang sama maupun PIC merchant lain dapat mengundang kembali pengguna tersebut sesuai kewenangannya. Sistem menggunakan akun lama berdasarkan identitas akun yang sudah terdaftar, bukan membuat akun duplikat.
3. **Isolasi Tugas Lama:** Penugasan lama tidak otomatis aktif kembali. Akses hanya diberikan sesuai penugasan baru yang telah memenuhi persyaratan.
4. **Pencatatan Audit:** Semua perubahan status dan penugasan dicatat dalam audit log.

---

### 2.9. Penyelesaian Uang Merchant (Settlement Model)

1. **Fase Awal (Rekonsiliasi & Persetujuan Manual):** Pembayaran kepada vendor pada tahap awal menggunakan proses rekonsiliasi dan persetujuan dari **Admin Keuangan** sebelum dana dibayarkan kepada vendor. *(Catatan terminologi: istilah "Admin Keuangan" adalah bahasa resmi PO. Istilah "Bendahara" yang sempat dipakai adalah sinonim kultural dan belum diverifikasi sebagai nama role sistem, lihat GOV-002).*
2. **Fase Lanjutan (Otomatisasi Berkala):** Pembayaran otomatis berkala dapat dipertimbangkan setelah aturan dan kontrol keuangan matang. *(Kriteria matang spesifik seperti penanganan retur dan audit selisih adalah [INFERENSI AGENT], berstatus [BELUM DIPUTUSKAN PO] / [DEFERRED], lihat MBD-016).*
3. **Keterlacakan Finansial:** Settlement harus dapat ditelusuri ke transaksi dan ketentuan kontrak terkait.

---

### 2.10. Data Rekening Pencairan Vendor (PO Decision WP-014)

Menindaklanjuti perumusan tata kelola rekening pencairan vendor (WP-014), Product Owner secara eksplisit menetapkan aturan bisnis berikut:

1. **Multi-Rekening Aktif Disahkan:**
   - **Satu merchant diperbolehkan memiliki beberapa rekening bank aktif sekaligus.** (Ketentuan ini membatalkan rekomendasi teknis lama yang membatasi 1 rekening aktif per merchant).
2. **Pemilihan Rekening per Pengajuan Pencairan:**
   - Merchant memilih salah satu rekening bank aktif yang telah terverifikasi sebagai rekening tujuan untuk setiap pengajuan pencairan dana (*withdrawal*).
   - Rekening yang dipilih untuk suatu pencairan **wajib terikat secara ketat pada pengajuan pencairan bersangkutan**.
3. **Pemisahan dari Profil Operasional:**
   - Data rekening penerima dana wajib disimpan terpisah dari profil operasional merchant.
   - Hak akses pengelolaan data rekening dibatasi secara ketat hanya untuk pihak keuangan berwenang.
4. **Keterlacakan Riwayat Rekening (Auditable):**
   - Seluruh data rekening bank dan riwayat perubahan rekening harus dapat ditelusuri kembali (*full audit trail*).
5. **Kewenangan Verifikasi oleh Admin Keuangan:**
   - **Admin Keuangan bertanggung jawab memverifikasi dan menyetujui rekening baru atau perubahan rekening sebelum rekening tersebut dapat digunakan.**
   - Rekening yang belum diverifikasi dan disetujui **dilarang keras menjadi tujuan pencairan**.
   - Sistem tidak mewajibkan persetujuan pihak kedua selain Admin Keuangan (*single finance authority* untuk verifikasi rekening).
6. **Penguncian Rekening Pengajuan yang Sedang Berjalan (*In-Transit*):**
   - Rekening yang telah dipilih dan disetujui untuk suatu pengajuan pencairan tertentu **tetap menjadi rekening tujuan pengajuan tersebut**.
   - Perubahan rekening baru hanya berlaku untuk pengajuan pencairan berikutnya setelah rekening baru tersebut diverifikasi dan disetujui oleh Admin Keuangan.
   - **Perubahan rekening dilarang mengubah secara diam-diam tujuan pencairan yang telah disetujui.**
7. **Pemisahan Tugas PIC (SoD):**
   - Penunjukan sebagai PIC tidak otomatis memberikan hak pencairan dana atau hak sepihak mengubah rekening tanpa verifikasi Admin Keuangan.
8. **Batas Desain Fisik Database (`[REKOMENDASI AGENT]`):**
   - Penetapan nama tabel fisik, struktur DDL, atau model database fisik (misalnya usulan nama tabel `merchant_payout_profiles`) **tetap murni rekomendasi teknis agent dan belum disetujui PO** (dibahas pada MBD-035).

---

### 2.11. Model Bisnis Merchant (Tiga Model Kemitraan Sah — PO Decision WP-013)

Sistem dirancang secara khusus untuk mendukung tiga model bisnis kemitraan merchant. Sistem dilarang menambahkan model keempat tanpa persetujuan eksplisit PO. Penetapan ketiga model ini **tidak ditentukan oleh apakah PIC atau staf merupakan personil internal atau eksternal**:

#### Model 1 — Merchant Bagi Hasil
- **Penetapan Persentase Kontraktual:** Persentase pembagian hasil **tidak boleh di-hardcode** dalam sistem. Persentase ditentukan ketika merchant dibuat atau dikonfigurasi berdasarkan kontrak kerja sama yang disepakati.
- **Pencatatan Komponen Finansial:** Sistem mencatat secara rinci Harga Pokok Penjualan (HPP), harga jual, keuntungan kotor/bersih yang menjadi dasar pembagian, bagian pemilik merchant, dan bagian pesantren.
- **Kepatuhan Kontrak:** Perhitungan pembagian mengikuti ketentuan kontrak merchant yang berlaku pada saat transaksi terjadi.
- **Keterlacakan Historis (Auditable):** Aturan dan persentase kontrak yang berlaku pada suatu transaksi harus dapat ditelusuri kembali secara akurat.
- **Penerapan Prospektif:** Perubahan klausul kontrak di masa mendatang **tidak boleh diam-diam mengubah perhitungan transaksi historis** yang telah dibukukan sebelumnya.
- **Larangan Default Sepihak:** Sistem dilarang menetapkan persentase default, formula universal baku, atau biaya pengurang keuntungan sepihak yang belum disetujui PO.

#### Model 2 — Seluruh Hasil Usaha Menjadi Hak Pemilik Merchant
- **Tanpa Bagi Hasil Pesantren:** Tidak ada pembagian keuntungan dengan pihak pesantren berdasarkan model bagi hasil.
- **Pencatatan Sistem Lengkap:** Sistem tetap mencatat seluruh penjualan, HPP, dan data keuangan yang relevan untuk kebutuhan rekonsiliasi dan pelaporan kasir.
- **Hak Dana Mengikuti Kepemilikan Barang:** Hak atas dana hasil penjualan harus mengikuti kepemilikan barang dan kesepakatan kontrak.
- **Pemeriksaan Kewajiban:** Sistem dilarang mengasumsikan seluruh harga jual otomatis menjadi keuntungan bersih merchant tanpa memeriksa kewajiban HPP, biaya langsung, dan klausul kontrak yang berlaku.

#### Model 3 — Usaha Milik Pesantren
- **Keuntungan Hak Pesantren:** Keuntungan usaha secara penuh menjadi hak pesantren sebagai pemilik unit usaha.
- **Pencatatan Penjualan & Biaya:** Sistem tetap mencatat penjualan, HPP, dan biaya-biaya yang relevan untuk akuntabilitas internal pondok.
- **Larangan Pembagian Eksternal:** Sistem dilarang membuat hak bagi hasil untuk pihak eksternal tanpa dasar kontrak kemitraan yang sah.

---

### 2.12. Hak Operasional Calon Staf Merchant (Keputusan PO Opsi A, 20 Oktober 2026)

Menindaklanjuti klarifikasi atas siklus hidup penugasan calon staf, Product Owner secara eksplisit menetapkan **Opsi A** dengan substansi hukum dan operasional berikut:

1. **Larangan Transaksi Kasir Sebelum Penugasan Aktif:**
   - Calon staf dengan undangan berstatus `PENDING_ACCEPTANCE` **tidak boleh melakukan transaksi sebagai kasir**.
2. **Penerimaan Undangan Bukan Aktivasi Otomatis:**
   - Setelah undangan diterima oleh calon staf, hak operasional kasir **belum otomatis aktif** jika proses aktivasi penugasan belum selesai.
3. **Syarat Otorisasi Kasir:**
   - Hak operasional kasir **baru diberikan setelah undangan diterima dan penugasan berstatus aktif**.

**Batas Keputusan PO & Rincian Terbuka:**
- Keputusan ini secara spesifik dan ketat menetapkan **larangan transaksi kasir** sebelum penugasan aktif.
- Keputusan ini **tidak otomatis menetapkan hak akses dashboard, akses baca katalog, atau hak baca lain** yang belum dibahas (aspek hak dashboard dan hak baca tetap berstatus `[BELUM DIPUTUSKAN PO]`).
- Keputusan ini **tidak menghilangkan kebutuhan persetujuan PIC** apabila mekanisme persetujuan penugasan tersebut memang diwajibkan oleh ketentuan PO yang berlaku.
- Penerimaan undangan dan aktivasi penugasan merupakan dua peristiwa yang dipisahkan secara tegas.
- **Sumber Keputusan:** Persetujuan eksplisit PO dalam percakapan resmi tanggal 20 Oktober 2026 (pemilihan Opsi A).

---

### 2.13. Kepemilikan Dana Transaksi & Prinsip Escrow Terpusat (Keputusan PO MBD-001, 20 Oktober 2026)

Menindaklanjuti perumusan prinsip kepemilikan dana hasil transaksi merchant sebelum settlement, Product Owner secara eksplisit menetapkan:

1. **Arah Prinsip Bisnis: Unified Central Escrow (Opsi A):**
   - Seluruh hasil transaksi merchant mengikuti arah prinsip bisnis pencatatan **dana titipan terpusat (*unified central escrow*)** sampai proses settlement sesuai kebijakan yang nantinya ditetapkan.
   - Detail hukum, kepatuhan pajak, struktur escrow formal perbankan, dan perlakuan akuntansi tetap perlu diverifikasi secara terpisah sebelum implementasi teknis.
2. **Batas Tanggung Jawab Aplikasi & Pembagian Riil di Luar Aplikasi:**
   - **Pembagian riil hasil transaksi kepada pihak-pihak terkait dilakukan di luar aplikasi.**
   - Aplikasi bertugas melakukan **pencatatan transaksi, data yang diperlukan untuk rekonsiliasi, serta keuntungan bersih** sesuai definisi yang telah disetujui.
   - Aplikasi **tidak menentukan atau mengeksekusi pembagian riil tersebut secara otomatis**, dan tidak melakukan payout otomatis tanpa kebijakan dan otorisasi terpisah.

**Batas Keputusan PO & Rincian Terbuka:**
- Keputusan ini secara spesifik mengesahkan arah prinsip pencatatan dana titipan terpusat dan penegasan bahwa pembagian riil dilakukan di luar aplikasi.
- Detail operasional berikut tetap berstatus `[BELUM DIPUTUSKAN PO]`:
  1. Definisi operasional dan rumus keuntungan bersih (net profit).
  2. Persentase bagi hasil spesifik dan rincian biaya yang dapat dikurangkan.
  3. Perlakuan jurnal akuntansi buku besar (ledger) dan implikasi perpajakan.
  4. Mekanisme teknis akun escrow formal perbankan.
- **Sumber Keputusan:** Persetujuan eksplisit PO pada siklus WP-M2-MERCHANT-BUSINESS-DECISIONS-007 (20 Oktober 2026).

---

### 2.14. Fitur HPP, Basis Bagi Hasil Kontrak, & Pembebanan Biaya Operasional (Keputusan PO DEC-008-A, B, C / 20 Oktober 2026)

Menindaklanjuti perumusan definisi operasional keuntungan bersih dan rekonsiliasi merchant (WP-008 & WP-009), Product Owner secara eksplisit menetapkan tiga keputusan bisnis berikut:

1. **DEC-008-A — Fitur HPP dan Biaya Langsung Sejak Tahap Pertama:**
   - Pada tahap pertama, aplikasi **wajib menyediakan fitur input Harga Pokok Penjualan (HPP) dan biaya langsung**.
   - Aplikasi harus mendukung pencatatan komponen biaya langsung yang diperlukan untuk menghitung dan menyajikan keuntungan bersih merchant pada laporan rekonsiliasi.
2. **DEC-008-B — Basis Perhitungan Bagi Hasil Mengikuti Kontrak (Model 1):**
   - Basis perhitungan pembagian bagi hasil **mengikuti ketentuan kontrak masing-masing merchant**, bukan dipukul rata dengan satu basis universal.
   - Aplikasi bertugas mencatat dan menyajikan angka-angka relevan (baik Penjualan Bersih maupun Keuntungan Bersih) sesuai dengan formula dan klausul kontrak yang disepakati dengan masing-masing merchant.
3. **DEC-008-C — Biaya Sewa, Listrik, dan Kebersihan Ditagih Terpisah di Luar Aplikasi:**
   - Pada tahap awal, biaya sewa fasilitas, listrik, air, dan kebersihan **dicatat atau ditagihkan secara terpisah di luar aplikasi**.
   - Biaya-biaya operasional/utilitas tersebut **tidak otomatis mengurangi hak merchant dalam perhitungan rekonsiliasi aplikasi**, dan sistem dilarang melakukan pemotongan otomatis sepihak.

**Batas Keputusan PO & Rincian Terbuka:**
- Keputusan ini secara spesifik menetapkan ketersediaan fitur input HPP/biaya langsung, fleksibilitas basis kontrak Model 1, serta penagihan utilitas terpisah di luar aplikasi.
- **Status Ilustrasi Contoh PO:** Angka ilustrasi yang sempat disampaikan PO (HPP: Rp35.000, Harga jual: Rp40.000, Keuntungan: Rp5.000; dengan pembagian 50% keuntungan dan HPP Rp35.000 menjadi hak pemilik barang, sehingga hak merchant Rp37.500 dan bagian pesantren Rp2.500) **murni berstatus contoh kasus ilustratif**, dan **BUKAN merupakan persentase default 50% atau rumus universal**. Pembagian riil tetap sepenuhnya mengikuti kontrak masing-masing merchant.
- **Penerapan Prospektif Amandemen Kontrak (MBD-004):** Perubahan aturan atau persentase kontrak di masa mendatang hanya berlaku prospektif (untuk transaksi mendatang) dan tidak boleh diam-diam mengubah perhitungan transaksi historis.
- Rincian berikut tetap berstatus `[BELUM DIPUTUSKAN PO]`:
  1. Metode alokasi HPP spesifik (FIFO, rata-rata tertimbang, atau penyesuaian manual kasir/staf).
  2. Perlakuan refund dan barang retur terhadap nilai HPP tercatat (MBD-032).
  3. Format data kontrak digital dan mekanisme validasi perubahan kontrak (snapshot komisi).
  4. Kemungkinan pencatatan memo atau pemotongan biaya utilitas pada laporan rekonsiliasi pada fase lanjutan sistem.
- **Sumber Keputusan:** Persetujuan eksplisit PO pada siklus WP-M2-MERCHANT-BUSINESS-DECISIONS-009 & WP-013 (20 Oktober 2026).

---

### 2.15. Kewajiban Operator Model 3 & Kepemilikan Reader RFID (Keputusan PO DEC-028-A, B, C / 20 Oktober 2026)

Menindaklanjuti perumusan hak dan kewajiban kontraktual Model 3 serta tata kelola perangkat kasir (WP-010 & WP-011), Product Owner secara eksplisit menetapkan:

1. **DEC-028-A — Kontribusi Operator Mengikuti Kontrak:**
   - Kontribusi operator kepada pondok (seperti sewa fasilitas, listrik, kebersihan, atau kontribusi berkala) **mengikuti kontrak masing-masing merchant**.
   - Kontribusi dapat berbayar atau tanpa sewa (konsesi penuh). Tidak ada kewajiban sewa universal yang dibakukan sistem.
   - Penagihan kontribusi operator dilakukan secara terpisah di luar aplikasi (sesuai DEC-008-C); sistem dilarang membuat biaya default atau pemotongan otomatis.
2. **DEC-028-B — Kepemilikan Reader RFID Skema Hibrida:**
   - Kepemilikan reader RFID menggunakan **skema hibrida**: reader dapat dimiliki oleh pesantren (aset pondok yang dipinjamkan) atau dimiliki mandiri oleh operator sesuai kesepakatan kontrak merchant.
   - Sistem tidak mengunci semua reader sebagai aset pesantren atau semua reader sebagai aset operator.
   - Tanggung jawab pengadaan, instalasi, perawatan, penggantian kerusakan, dan pengembalian perangkat mengikuti ketentuan kontrak terkait.
3. **DEC-028-C — Batas Pencatatan Perangkat dalam Aplikasi:**
   - Aplikasi mencatat informasi perangkat dan kontrak meliputi:
     1. Status kepemilikan perangkat: `PESANTREN` atau `OPERATOR`.
     2. ID perangkat atau nomor seri (*Serial Number*) reader RFID.
     3. Periode kontrak yang relevan (tanggal mulai dan selesai).
     4. Memo kewajiban kontraktual terkait perangkat atau kontribusi operator di luar aplikasi.
   - Modul depresiasi aset, inventarisasi pergudangan kompleks, atau akuntansi aset tidak termasuk dalam ruang lingkup aplikasi kasir.

**Batas Keputusan PO & Rincian Terbuka:**
- Keputusan ini secara spesifik menetapkan fleksibilitas kontribusi Model 3 per kontrak, skema hibrida kepemilikan reader RFID, serta batas pencatatan perangkat di aplikasi.
- Rincian berikut tetap berstatus `[BELUM DIPUTUSKAN PO]`:
  1. Ketentuan rinci tanggung jawab biaya pemeliharaan dan penggantian kerusakan fisik yang belum tertuang eksplisit dalam kontrak standar.
  2. SOP serah terima fisik reader saat terminasi kerja sama.
  3. Standar spesifikasi teknis reader pihak ketiga yang diizinkan terhubung ke jaringan pesantren.
- **Sumber Keputusan:** Persetujuan eksplisit PO pada siklus WP-M2-MERCHANT-BUSINESS-DECISIONS-011 (20 Oktober 2026).

---

### 2.16. Pembayaran Santri Internal Tanpa Payment Gateway (Keputusan PO WP-013)

Menindaklanjuti perumusan mekanisme transaksi belanja santri di merchant (WP-013), Product Owner secara eksplisit menetapkan:

1. **Transaksi Internal Sistem (Non-Gateway):**
   - Seluruh transaksi pembayaran santri kepada merchant apa pun (baik Model 1, Model 2, maupun Model 3) merupakan **transaksi internal di dalam platform APP MA’HAD**.
   - Pembayaran santri di kasir merchant **sama sekali tidak menggunakan payment gateway**.
   - Sistem dilarang menciptakan tagihan invoice payment gateway (misal Flip invoice), webhook gateway, atau mengenakan biaya transaksi gateway (*gateway transaction fee*) pada transaksi belanja santri di kasir.
2. **Mutasi Hak Dana Saldo Uang Saku:**
   - Saldo uang saku santri berkurang seketika sebesar nilai transaksi yang sah pada saat checkout.
   - Sistem mencatat perpindahan hak dana secara akurat dari saldo uang saku santri ke rekap hak dana merchant (untuk Model 1 dan 2) atau unit usaha pesantren (untuk Model 3) sesuai model kemitraan yang berlaku.
3. **Pemisahan dari Alur Top-Up Santri:**
   - Transaksi internal belanja kasir santri ini dibedakan secara tegas dari proses pengisian saldo (*top-up*) uang saku santri oleh wali santri yang memang menggunakan payment gateway.

---

### 2.17. Rekapitulasi Hak Dana Merchant & Dashboard Admin Keuangan (Keputusan PO WP-013)

Menindaklanjuti kebutuhan pemantauan hak dana dan auditabilitas keuangan merchant (WP-013), Product Owner secara eksplisit menetapkan:

1. **Struktur Tampilan Dashboard Admin Keuangan:**
   - **Ringkasan Gabungan (Single Summary):** Dashboard Admin Keuangan wajib menyajikan satu ringkasan total hak dana seluruh merchant yang aktif.
   - **Kartu Merchant Mandiri (Grid Cards):** Setiap merchant memiliki *grid card* tersendiri yang menampilkan total hak dana yang menjadi hak merchant tersebut.
   - **Rincian Finansial Interaktif:** Membuka kartu merchant akan menampilkan rincian keuangan merchant bersangkutan secara komprehensif, mencakup riwayat transaksi, HPP, keuntungan kotor/bersih, riwayat penarikan, dan data rekonsiliasi yang relevan.
2. **Isolasi Pembukuan Hak Dana (Bookkeeping Isolation):**
   - Hak dana setiap merchant harus terpisah secara mutlak dalam pembukuan dari hak dana merchant lain dan dari dana pesantren yang bukan hak merchant.
   - Pemisahan pembukuan ini merupakan pemisahan logis (*bookkeeping separation*) dan **tidak berarti setiap merchant wajib memiliki rekening bank fisik tersendiri**.
   - Total gabungan hak dana pada dashboard wajib dapat direkonsiliasi secara presisi dengan rincian saldo per masing-masing merchant.
3. **Empat Status Dana Wajib Dibedakan:**
   Sistem dan dashboard wajib membedakan secara tegas empat klasifikasi saldo dana merchant:
   1. **Total Hak Dana Merchant:** Akumulasi seluruh hak dana yang telah menjadi hak merchant berdasarkan transaksi sah yang tercatat.
   2. **Dana yang Sudah Dicairkan:** Dana yang telah selesai diproses dan berhasil ditransfer/dibayarkan kepada pihak merchant (*completed withdrawal*).
   3. **Dana yang Dicadangkan (*Reserved Funds*):** Dana yang sedang dialokasikan untuk pengajuan penarikan yang masih berjalan (*pending approval* atau *in-transit payout*).
   4. **Dana yang Tersedia untuk Penarikan Baru (*Available Balance*):** Dana bersih yang bebas dan dapat diajukan untuk penarikan baru (`Dana Tersedia = Total Hak Dana - Dana Dicairkan - Dana Dicadangkan`).
4. **Perlakuan Unit Usaha Milik Pesantren (Model 3):**
   - Untuk merchant milik pesantren, dashboard menampilkan ringkasan usaha dan performa keuangan, tetapi **dilarang menghitung hak pesantren sebagai hak merchant eksternal**.
5. **Integritas Angka:** Angka ilustrasi dalam contoh dokumentasi dilarang dianggap sebagai saldo aktual.

---

### 2.18. Tata Kelola Penarikan Dana (Withdrawal) Merchant, Biaya Admin, & Kebijakan Penanganan Pengajuan (PO Decisions WP-013, WP-014 & WP-015)

Menindaklanjuti perumusan alur operasional pencairan dana merchant, batasan minimum, kebijakan biaya admin, serta kebijakan penanganan penolakan, pembatalan, dan kegagalan transfer (WP-013, WP-014, & WP-015), Product Owner secara eksplisit menetapkan aturan bisnis berikut:

1. **Pihak yang Berwenang Mengajukan Penarikan (Who Can Request):**
   - **PIC Merchant:** PIC yang sah berwenang mengajukan penarikan dana merchant yang menjadi tanggung jawabnya.
   - **Staf Merchant Berwenang:** Staf merchant juga dapat mengajukan penarikan **hanya apabila secara eksplisit diberikan penugasan atau izin (*permission*) penarikan**.
   - Hak pengajuan penarikan bagi staf merupakan *assignment/permission* yang dapat diaudit, dan **bukan merupakan hak otomatis seluruh staf kasir/stok**.
2. **Batas Nominal Minimum Pengajuan Penarikan:**
   - Minimum nominal pengajuan penarikan merchant ditetapkan tepat **Rp1.000.000 per pengajuan**.
   - Batas minimum ini mengacu pada **nominal penarikan kotor yang diajukan sebelum pemotongan biaya admin**.
   - Sistem dilarang menafsirkan batas minimum ini sebagai nominal bersih yang diterima merchant.
3. **Kebijakan Biaya Admin Penarikan Mandiri (Merchant-Initiated):**
   - Pencairan mandiri oleh merchant melalui alur payment gateway dikenakan biaya admin.
   - **Model Tarif:** Nominal tetap (*flat nominal fee*) per pengajuan, bukan persentase dari nilai penarikan.
   - **Otoritas Penetapan:** Biaya admin ditetapkan dan dikonfigurasi secara eksklusif oleh **Super Admin SaaS** melalui platform SaaS.
   - **Larangan Modifikasi Lokal:** Pihak tenant, PIC, dan staf merchant **sama sekali tidak memiliki kewenangan** untuk menetapkan atau mengubah tarif biaya admin tersebut.
   - **Pelabelan Antarmuka Bersih:** Antarmuka merchant hanya menampilkan label **"Biaya Admin"**. Sistem dilarang menampilkan keterangan mengenai pihak yang menerima atau memperoleh biaya tersebut.
   - **Metode Pemotongan:** Biaya admin dipotong langsung dari nominal penarikan yang diajukan.
   - **Pemisahan dari Biaya Provider:** Biaya admin yang ditampilkan kepada merchant harus dibedakan secara tegas dari biaya yang ditagihkan oleh penyedia payment gateway; sistem dilarang mengasumsikan pendapatan biaya admin dan biaya gateway bernilai sama.
   - **Status Tarif Rupiah (`[TERBUKA / PLATFORM SAAS]`):** Besaran tarif rupiah spesifik belum ditentukan dalam keputusan merchant ini dan menjadi keputusan konfigurasi tersendiri pada platform SaaS. Sistem dilarang mengarang tarif rupiah atau tarif default.
4. **Pencairan oleh Admin Keuangan (Bebas Biaya Admin):**
   - Jika pencairan dana dilakukan oleh **Admin Keuangan**, pihak merchant **TIDAK dikenakan biaya admin (Rp0 biaya admin)**.
   - Formula pencairan Admin Keuangan: `Nominal Bersih Diterima = Nominal Pengajuan`.
5. **Rincian Tampilan Transaksi Wajib (Transaction Display):**
   Sebelum pengajuan penarikan dikonfirmasi oleh merchant, antarmuka wajib menyajikan rincian transparan mencakup:
   - Nominal Pengajuan (kotor).
   - Rekening Bank Tujuan (yang dipilih dan telah terverifikasi).
   - Biaya Admin (sesuai konfigurasi SaaS platform untuk pencairan mandiri, atau Rp0 untuk pencairan oleh Admin Keuangan).
   - Nominal Bersih yang Akan Diterima:
     - Untuk pencairan mandiri: `Nominal Bersih Diterima = Nominal Pengajuan − Biaya Admin`
     - Untuk pencairan oleh Admin Keuangan: `Nominal Bersih Diterima = Nominal Pengajuan`
   - Informasi status pengajuan dan persetujuan yang relevan.
6. **Alur Resmi Pengajuan dan Persetujuan (5 Tahap Operasional):**
   1. PIC atau staf berwenang mengajukan nominal penarikan dana melalui sistem (minimal Rp1.000.000).
   2. Sistem melakukan validasi saldo ketersediaan dana (*Dana Tersedia*) dan mencatat pengajuan serta membekukan dana ke status *Dicadangkan*.
   3. **Admin Keuangan melakukan konfirmasi persetujuan (*Approval Confirmation*)**.
   4. Pengajuan yang telah disetujui diteruskan ke proses pencairan (*withdrawal/payout execution*).
   5. Hasil pencairan dicatat secara definitif berdasarkan **konfirmasi pembayaran yang benar-benar telah terjadi/berhasil**.
   - **Larangan Penyatuan Status:** Sistem dilarang keras menyamakan pengajuan (*requested*), persetujuan (*approved*), dan pencairan berhasil (*completed payout*) sebagai satu status tunggal. Dilarang mencatat pencairan berhasil hanya berdasarkan persetujuan.
7. **Prinsip Ketersediaan Dana & Proteksi Invariant:**
   - **Fleksibilitas Pengajuan:** Merchant berhak mengajukan penarikan kapan saja selama saldo *Dana Tersedia* mencukupi dan memenuhi batas minimum Rp1.000.000.
   - **Kunci Dana Dicadangkan:** Dana yang telah dicadangkan untuk pengajuan yang masih berjalan tidak boleh digunakan untuk pengajuan penarikan lain.
   - **Anti Saldo Negatif (Zero Overdraft):** Penarikan tidak boleh menyebabkan saldo hak dana merchant menjadi bernilai negatif.
   - **Larangan Subsidi Silang:** Penarikan dana suatu merchant dilarang keras mengurangi hak dana merchant lain atau mengurangi hak dana pesantren.
   - **Bukan Pembayaran Santri:** Proses pencairan dana ke vendor tidak menggunakan mekanisme pembayaran santri.
8. **Kebijakan Penolakan Pengajuan Penarikan (PO Decision WD-01):**
   Jika pengajuan penarikan ditolak oleh Admin Keuangan:
   - **Pelepasan Dana Cadangan:** Dana yang dicadangkan (*Reserved Funds*) untuk pengajuan tersebut dilepaskan kembali seketika menjadi dana yang tersedia (*Available Balance*) merchant.
   - **Hak Pengajuan Baru:** Merchant diperbolehkan mengajukan penarikan baru setelah penolakan. Sistem dilarang membatasi jumlah pengajuan ulang atau memberlakukan masa tunggu buatan yang belum diputuskan PO.
   - **Larangan Pencatatan Sukses:** Pengajuan yang ditolak dilarang keras dicatat sebagai pencairan berhasil.
   - **Auditabilitas Alasan Penolakan:** Riwayat pengajuan dan alasan penolakan wajib tercatat serta dapat ditelusuri dalam desain jejak audit (*audit trail*).
   - **Proteksi Invariant Saldo:** Pelepasan dana cadangan tidak boleh menghasilkan saldo negatif dan dilarang mengubah hak dana merchant lain maupun kas pesantren.
9. **Kebijakan Pembatalan Pengajuan oleh Merchant (PO Decision WD-02):**
   Merchant hanya diperbolehkan membatalkan pengajuan penarikan **sebelum Admin Keuangan memberikan persetujuan (*Approval*)**:
   - **Hak Pembatalan Mandiri:** Sebelum persetujuan Admin Keuangan, merchant berhak membatalkan pengajuan penarikan secara mandiri.
   - **Pelepasan Dana Cadangan:** Pembatalan yang berhasil melepaskan dana yang dicadangkan kembali menjadi dana tersedia merchant.
   - **Larangan Pembatalan Mandiri Pasca-Approval:** Setelah Admin Keuangan menyetujui pengajuan, merchant **tidak memiliki hak pembatalan mandiri**.
   - **Batas Interpretasi Pembatalan:** Larangan pembatalan mandiri setelah persetujuan tidak boleh diartikan sebagai larangan mutlak bagi sistem/pesantren untuk menghentikan transaksi yang belum dikirim ke perbankan. Penanganan khusus oleh Admin Keuangan dan payment gateway (jika diperlukan untuk mencegah kesalahan fatal) tetap tunduk pada aturan operasional lain yang belum diputuskan.
   - **Jaminan Pelepasan Tunggal (*Idempotent Release*):** Pembatalan wajib tercatat dalam sistem audit dan dilarang melepaskan dana cadangan lebih dari satu kali (*single release guarantee*). Sistem dilarang menambahkan alasan pembatalan wajib, batas waktu sepihak, atau persetujuan tambahan yang belum disetujui PO.
10. **Kebijakan Hasil Transfer Belum Pasti (PO Decision WD-03):**
    Jika hasil transfer perbankan/gateway belum dapat dipastikan (*Outcome Uncertain*):
    - **Dana Wajib Tetap Dicadangkan:** Dana **harus tetap dicadangkan** selama hasil transaksi belum terverifikasi secara definitif.
    - **Larangan Anggapan Status Sepihak:** Status yang belum pasti **dilarang diperlakukan sebagai berhasil** dan **dilarang otomatis diperlakukan sebagai gagal**.
    - **Larangan Pelepasan Akibat Timeout:** Dana cadangan dilarang dilepaskan hanya karena batas waktu tertentu (*timeout*) terlampaui tanpa konfirmasi perbankan.
    - **Kewajiban Bukti Rekonsiliasi:** Proses rekonsiliasi harus memperoleh bukti yang memadai untuk memastikan apakah transfer benar-benar berhasil atau gagal.
    - **Tindak Lanjut Hasil Terverifikasi:**
      - Jika hasil akhir terkonfirmasi berhasil: pengajuan diselesaikan sebagai pencairan berhasil (*Completed*).
      - Jika hasil akhir terkonfirmasi gagal: pengajuan diproses mengikuti kebijakan WD-04.
    - **Auditabilitas Status:** Seluruh perubahan status dan pergerakan/pelepasan dana wajib dapat ditelusuri. Rincian SLA rekonsiliasi, batas waktu timeout provider, atau mekanisme polling otomatis tetap berstatus terbuka.
11. **Kebijakan Pencairan Dipastikan Gagal (PO Decision WD-04):**
    Jika pencairan dana dipastikan gagal (*Confirmed Failure*):
    - **Bukti Kegagalan Memadai:** Kegagalan pencairan wajib dikonfirmasi melalui bukti yang memadai, bukan sekadar timeout jaringan atau respons API yang ambigu.
    - **Pembebasan Biaya Admin Penarikan:** Jika pencairan dipastikan gagal, **merchant TIDAK DIKENAKAN BIAYA ADMIN PENARIKAN (biaya admin dibebaskan / Rp0)**. Biaya admin penarikan dilarang keras dipotong atau dibebankan kepada merchant atas transaksi pencairan yang gagal.
    - **Pemulihan Dana Terkendali:** Dana yang dicadangkan harus dipulihkan secara terkendali menjadi dana tersedia merchant. Pemulihan dana dilarang menghasilkan pengembalian ganda (*double refund*) atau memicu saldo negatif.
    - **Larangan Pencatatan Sukses:** Pengajuan yang gagal dilarang dicatat sebagai pencairan berhasil.
    - **Auditabilitas Koreksi Finansial:** Riwayat kegagalan dan penyesuaian/koreksi buku besar pembantu wajib dapat ditelusuri secara lengkap.
    - **Pembedaan Biaya Merchant vs Biaya Provider SaaS:** Biaya admin penarikan merchant (yang dibebaskan) dibedakan secara tegas dari biaya transaksi yang mungkin ditagihkan oleh provider payment gateway kepada platform SaaS. Kebijakan ini tidak secara otomatis menentukan pihak yang menanggung biaya provider saat transaksi gagal, dan **dilarang membebankan biaya provider tersebut kepada merchant tanpa keputusan PO yang sah**.
12. **Status Konseptual Mesin Penarikan & Pembedaan Akuntansi:**
    - **Klasifikasi Status Konseptual:**
      - `REQUESTED`: Pengajuan penarikan dana telah dibuat oleh PIC/staf berwenang dan dana dicadangkan.
      - `APPROVED`: Admin Keuangan telah menyetujui pengajuan penarikan.
      - `CANCELLED`: Pengajuan penarikan dibatalkan secara sah oleh merchant sebelum persetujuan Admin Keuangan (WD-02).
      - `REJECTED`: Admin Keuangan menolak pengajuan penarikan dana (WD-01).
      - `PROCESSING`: Proses pencairan/transfer dana sedang berlangsung di payment gateway atau perbankan.
      - `OUTCOME_UNKNOWN`: Hasil transfer perbankan belum dapat dipastikan; dana tetap dicadangkan menunggu bukti rekonsiliasi (WD-03).
      - `FAILED`: Kegagalan pencairan telah dikonfirmasi dengan bukti memadai; dana cadangan dipulihkan ke dana tersedia dan merchant bebas biaya admin (WD-04).
      - `COMPLETED`: Pencairan telah dikonfirmasi berhasil dan dana riil telah terkirim ke rekening tujuan.
      *(Catatan: Nama status di atas merupakan nomenklatur konseptual arsitektur dokumentasi, bukan pengesahan enum database atau model fisik).*
    - **Pembedaan Mutlak Entitas Finansial:**
      Sistem dan pembukuan wajib membedakan secara tegas:
      1. *Hak Dana Merchant:* Hak total akumulasi pendapatan/profit milik merchant.
      2. *Dana yang Dicadangkan:* Dana yang dikunci sementara saat pengajuan berstatus aktif/berjalan.
      3. *Dana Tersedia:* Dana bersih yang siap ditarik (`Hak Dana - Dicairkan - Dicadangkan`).
      4. *Nominal Pengajuan:* Nilai kotor penarikan yang diminta merchant.
      5. *Biaya Admin:* Biaya tetap platform SaaS (atau Rp0 bila via Admin Keuangan / transfer gagal).
      6. *Nominal Bersih yang Diterima:* Nilai riil yang diterima merchant di rekening bank.
      7. *Status Pembayaran Aktual:* Status realisasi transfer dana perbankan.
      - **Prinsip Invariant Pembukuan:** Pelepasan atau pemulihan dana cadangan (baik akibat reject, cancel, atau fail) merupakan pengembalian alokasi likuiditas internal dan **DILARANG DIPERLAKUKAN SEBAGAI PENDAPATAN BARU, OMZET BARU, ATAU TRANSAKSI PENJUALAN BARU**.
13. **Rincian Operasional & Teknis yang Tetap Terbuka (`[BELUM DIPUTUSKAN PO]`):**
    - SLA waktu pelaksanaan rekonsiliasi hasil transfer yang belum pasti.
    - Standar bukti minimum untuk memastikan kegagalan transfer perbankan/gateway.
    - Kebijakan penanggungan beban biaya provider payment gateway saat transfer gagal antara penyedia platform SaaS dan pihak terkait.
    - Prosedur teknis penghentian transfer oleh Admin Keuangan setelah status disetujui tetapi sebelum dana dikirim ke jaringan perbankan.
    - Prosedur penanganan teknis kasus transfer ganda (*duplicate transfer*) atau status provider yang saling bertentangan (*conflicting provider callbacks*).
    - Desain fisik DDL, tabel, kolom, dan enum database.

---

## 3. IDENTIFIKASI KONFLIK DESAIN KEUANGAN MERCHANT (F-02)

Pemeriksaan independen terhadap [DRAFT-FINANCE-MERCHANT-WALLET-EXTENSION-001.md](file:///e:/Projects/Os_Darta/docs/architecture/DRAFT-FINANCE-MERCHANT-WALLET-EXTENSION-001.md) mengidentifikasi 4 konflik desain material antara draf proposal teknis tersebut dan Keputusan Bisnis PO:

> [!WARNING]
> **STATUS: DESIGN CONFLICT — UNRESOLVED**  
> Draf proposal `DRAFT-FINANCE-MERCHANT-WALLET-EXTENSION-001.md` berstatus *PROPOSAL DRAFT ARSITEKTUR — PRE-RATIFICATION* dan bukan merupakan keputusan bisnis PO. Dokumen bisnis PO memegang hierarki kewenangan lebih tinggi. Konflik ini tidak boleh diselesaikan secara sepihak oleh agent. Usulan pembuatan skema terpisah (misalnya diberi nama kerja `merchant_payout_profiles`) merupakan rekomendasi/opsi arsitektur agent dan **belum diputuskan oleh PO** (lihat MBD-035).

| No | Poin Konflik | Isi Aktual pada Draft Finansial | Keputusan Bisnis PO | Status Konflik |
|---|---|---|---|:---:|
| 1 | **Jumlah Model Bisnis** | L22 & L86-87 hanya mendukung 2 model: `INTERNAL_PONDOK` vs `THIRD_PARTY_OPERATOR` (konsesi). | PO menetapkan 3 model bisnis sah: Bagi Hasil, Pendapatan Pondok, Pendapatan Operator. | `DESIGN CONFLICT — UNRESOLVED` |
| 2 | **Penyimpanan Rekening Bank Vendor** | L94-96 menempatkan kolom `settlement_bank_code`, `settlement_account_number`, dan `settlement_account_holder` langsung pada tabel operasional `tenant_merchants`. | PO menetapkan data rekening pencairan dipisahkan dari profil operasional merchant dan aksesnya dibatasi untuk pihak keuangan. *(Desain tabel fisik pemisah belum diputuskan PO).* | `DESIGN CONFLICT — UNRESOLVED` |
| 3 | **Aturan Integritas Relasi (Cascade vs Restrict)** | L39-40, L54-55, L78, L108-110, L127, L156-157 menggunakan `onDelete: 'cascade'` pada relasi kunci termasuk tenant, merchant, dan transaksi. | PO menetapkan riwayat transaksi dan audit tidak boleh dihapus ketika penugasan dicabut atau akun dinonaktifkan. | `DESIGN CONFLICT — UNRESOLVED` |
| 4 | **Batas Multi-Fungsi Kasir** | L118 menerapkan constraint unik `unique('uq_merchant_user_cashier').on(table.merchantId, table.userId)` pada tabel `merchant_cashiers`. | PO mendukung penugasan operasional yang fleksibel dan multi-fungsi (kasir, stok, produk) yang tidak terbatas pada 1 baris per user per merchant. | `DESIGN CONFLICT — UNRESOLVED` |

---

## 4. STATUS KONSISTENSI TERHADAP INVARIANT TAHAP 2 (DESAIN-LEVEL)

> **Catatan Evaluasi:** Tabel di bawah ini menunjukkan keselarasan **konseptual tingkat desain dokumentasi** terhadap Invariant Tahap 2 yang tercatat. Hal ini **bukan bukti pengujian empiris implementasi aktual** (`[BELUM DIVERIFIKASI SECARA IMPLEMENTATIF]`).

| No | Invariant Bisnis Tahap 2 | Status Desain | Bukti Evaluasi Konseptual |
|---|---|:---:|---|
| 1 | Nominal uang integer rupiah | `KONSISTEN` | Seluruh transaksi merchant dirancang menggunakan integer rupiah tanpa floating-point. |
| 2 | Pembayaran RFID dari saldo uang saku | `KONSISTEN` | Transaksi POS kantin/merchant didesain mendebit kantong uang saku santri. |
| 3 | Tidak ada gateway / biaya gateway di POS | `KONSISTEN` | Pembayaran RFID kasir kantin adalah mutasi internal ledger non-gateway. |
| 4 | Saldo tidak boleh negatif (Zero Overdraft) | `KONSISTEN` | Desain transaksi menolak checkout jika saldo tidak mencukupi. |
| 5 | Riwayat finansial abadi (No Cascade Delete) | `KONSISTEN DI BISNIS` | Prinsip bisnis melarang penghapusan riwayat; konflik `CASCADE` pada draf teknis dicatat di Bagian 3. |

---

## 5. DOKUMENTASI MATRIKS STATUS AKSES & LIFECYCLE (F-06 & KEPUTUSAN PO OPSI A)

Untuk mencegah kerancuan antara pembuatan akun, penerimaan undangan, proses aktivasi, dan hak operasional kasir, matriks tahapan akses disusun berdasarkan **Keputusan PO (Opsi A, 20 Oktober 2026)**:

| Tahapan Lifecycle | Status Undangan | Status Akun User | Status Penugasan | Hak Akses Dashboard / Baca | Hak Transaksi Kasir/POS | Dasar Keputusan PO & Batas Validasi |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **1. Undangan Terkirim** | `PENDING` | `INACTIVE` / Belum ada | `PENDING_ACCEPTANCE` | `[BELUM DIPUTUSKAN PO]` *(Rekomendasi: akses terbatas link undangan)* | ❌ **Ditolak Keras** | **Keputusan PO Opsi A:** Calon staf dengan undangan `PENDING_ACCEPTANCE` tidak boleh melakukan transaksi sebagai kasir. |
| **2. Calon Menerima Undangan** | `ACCEPTED` | `ACTIVE` | `PENDING_APPROVAL` / `PENDING_ACTIVATION` | `[BELUM DIPUTUSKAN PO]` *(Rekomendasi: akses profil/status)* | ❌ **Ditolak Keras** | **Keputusan PO Opsi A:** Setelah undangan diterima, hak operasional kasir belum otomatis aktif jika proses aktivasi penugasan belum selesai. |
| **3. Penugasan Aktif Sah** | `COMPLETED` | `ACTIVE` | `ACTIVE` | `[BELUM DIPUTUSKAN PO]` *(Rekomendasi: dashboard merchant aktif)* | ✅ **Diizinkan** | **Keputusan PO Opsi A:** Hak operasional kasir baru diberikan setelah undangan diterima dan penugasan berstatus aktif. |
| **4. PIC Nonaktif (Orphaned Staff)** | `COMPLETED` | `ACTIVE` | `ACTIVE` | `[BELUM DIPUTUSKAN PO]` *(Rekomendasi: dashboard operasional tetap dapat dibuka)* | `[BELUM DIPUTUSKAN PO]` (MBD-029) | PO 3.6: Penugasan staf yang sah tidak otomatis dibatalkan; kondisi apakah kasir boleh transaksi saat PIC kosong dibahas di MBD-029. |
| **5. Penugasan Dicabut (Internal)** | n/a | `ACTIVE` (Primary) | `REVOKED` | ❌ Akses merchant dicabut | ❌ **Ditolak** | PO 3.7: Akses merchant ditutup seketika; akun institusi primer tetap aktif. |
| **6. Penugasan Dicabut (Eksternal, 0 aktif)** | n/a | `SUSPENDED` (Tenant) | `REVOKED` | ❌ Ditolak login | ❌ **Ditolak** | PO 3.7: Jika tanpa penugasan aktif lain di tenant, akun dinonaktifkan. Cakupan platform global dibahas di MBD-034. |
