# DECISION-REGISTER-M2-FINANCE-ARCHITECTURE-010
## Register Keputusan Arsitektur & Kebijakan Bisnis: Gerbang Ratifikasi Product Owner

**Work Package:** M2-FINANCE-ARCHITECTURE-010  
**Sistem:** APP MA’HAD — Finance, Internal RFID Payment, Wallet, POS & Tenant Merchant Architecture  
**Otoritas:** Product Owner (`Process_PO`) & Acting Process_Mandor (`Mandor 2`)  
**Mode Operasi:** STRICT READ-ONLY  
**Status Register:** AWAITING PRODUCT OWNER FORMAL RATIFICATION  
**Tanggal:** 19 Oktober 2026  

---

## 1. IKHTISAR REGISTER KEPUTUSAN M2-010

Register ini memetakan seluruh keputusan teknis dan kebijakan bisnis yang **WAJIB DIRATIFIKASI** oleh Product Owner sebelum gerbang implementasi rekayasa (Work Package 1 s/d 4) dapat dibuka secara sah.

---

## 2. ATURAN BISNIS MUTLAK YANG SUDAH TERKUNCI (LOCKED DECISIONS)

Aturan-aturan berikut berstatus **TERKUNCI** dan dipertahankan 100% tanpa perubahan:
- **[PO-LOCK-01] Transaksi Internal Murni Tanpa Gateway**: Pembayaran RFID tidak memerlukan gateway, tidak membuat payment order Flip, tidak menunggu webhook gateway, dan bebas biaya admin gateway (*zero gateway fee*).
- **[PO-LOCK-02] Sumber Dana Tunggal Uang Saku**: Pembayaran RFID hanya mendebit saldo uang saku santri (`balance_uang_saku`). Saldo tabungan dan Model B diisolasi.
- **[PO-LOCK-03] Kewajiban PIN**: Seluruh pembayaran RFID wajib menggunakan PIN santri.
- **[PO-LOCK-04] Auto-Block 3x Salah PIN**: Tiga kesalahan PIN berturut-turut langsung memblokir kartu secara permanen; tidak ada auto-unblock berbasis waktu/cooldown.
- **[PO-LOCK-05] Pembatasan Otoritas Reset PIN**: Hanya Wali Kelas (santri binaannya) dan Admin Keuangan yang berwenang mereset PIN. Wali Santri dilarang keras mereset PIN. Super Admin dilarang tanpa mandat PO baru.
- **[PO-LOCK-06] Reset Sah Otomatis Membuka Blokir**: Tindakan reset yang sah secara atomik membuka blokir kartu dan mengosongkan counter gagal.
- **[PO-LOCK-07] Rincian Item POS Terstruktur**: POS wajib menyimpan detail transaksi terstruktur, kuantitas, harga satuan snapshot, dan mendukung layanan nonfisik.
- **[PO-LOCK-08] Isolasi 3 Konsep Saldo**: Saldo Model B, uang saku, dan tabungan santri adalah domain terpisah. Tabungan bukan pendapatan pondok.

---

## 3. REGISTER KEPUTUSAN TERBUKA (OPEN DECISIONS MATRIX)

| ID | Topik & Isu Keputusan | Opsi yang Dipertimbangkan | Rekomendasi Arsitek & Alasan | Dampak Keamanan & Operasional | Kriteria Penerimaan (Acceptance Criteria) | Dampak pada Gerbang Implementasi |
|---|---|---|---|---|---|---|
| **DEC-01** | **Pemilihan Algoritma KDF PIN Final** | **Opsi A**: PBKDF2-HMAC-SHA256 (100k iterasi) + Salt + Pepper.<br>**Opsi B**: Argon2id (`m=19MiB, t=2, p=1`). | **Opsi A**. Menggunakan modul bawaan `node:crypto`, nol dependensi binary C++, ramah serverless Vercel, latensi ~15–30 ms. | Menahan offline cracking saat DB bocor (dengan pepper); ringan pada antrean kasir. | Lolos benchmark latensi $\le 30$ ms di staging. | **BLOCKING WP-3** (Migrasi Skema PIN) |
| **DEC-02** | **Penyimpanan & Siklus Hidup Pepper** | **Opsi A**: Server Runtime Environment (`RFID_PIN_PEPPER`).<br>**Opsi B**: Cloud KMS / HashiCorp Vault. | **Opsi A**. Cukup memadai untuk tahap awal, wajib fail-closed jika tidak terkonfigurasi. | Mencegah kebocoran rahasia di Git/DB; sistem menolak transaksi jika pepper hilang. | Aplikasi melempar exception boot jika pepper kosong. | **BLOCKING WP-3** |
| **DEC-03** | **Strategi Migrasi PIN Eksisting** | **Opsi A**: Force Reset PIN massal saat kartu fisik dibagikan.<br>**Opsi B**: Lazy Migration saat santri memasukkan PIN lama. | **Opsi A**. Karena PIN lama di DB tersimpan teks polos/prefix `'pin_'`. Reset massal menjamin nol plaintext. | Menghilangkan seluruh jejak kredensial teks polos warisan di database. | Seluruh baris `rfid_cards` memiliki salt & hash KDF valid. | **BLOCKING WP-3** |
| **DEC-04** | **Kebijakan Retensi Idempotency Key** | **Opsi A**: Disimpan permanen di `canteen_transactions`.<br>**Opsi B**: Tabel terpisah dengan retensi TTL 30 hari. | **Opsi A**. Sederhana, menyatu dengan bukti transaksi historis POS santri. | Mencegah replay transaksi selamanya dalam ruang lingkup tenant yang sama. | Query duplicate key mendeteksi replay historis. | **BLOCKING WP-2** (Core Handler) |
| **DEC-05** | **Model Status Transaksi Kasir** | **Opsi A**: Status `SUCCESS` ditulis atomik, gagal rollback.<br>**Opsi B**: Status `PENDING` ditulis sebelum debit. | **Opsi A**. Mencegah baris yatim (*orphaned rows*) jika serverless container crash. | Menjamin nol baris menggantung jika terjadi serverless termination. | Setiap transaksi berstatus `SUCCESS` memiliki mutasi saku. | **BLOCKING WP-2** |
| **DEC-06** | **Nullability `response_payload`** | **Opsi A**: `jsonb NOT NULL` diisi data struk saat commit.<br>**Opsi B**: `jsonb NULLABLE` saat in-flight. | **Opsi A**. Karena transaksi atomik di-commit bersamaan dengan pembuatan respon. | Menyajikan respon struk instan saat retry jaringan tanpa query ulang. | Replay idempotensi menyajikan payload yang sama persis. | **BLOCKING WP-1 & WP-2** |
| **DEC-07** | **Kanonikalisasi Hash Request** | **Opsi A**: String SHA-256 terurut berdasarkan item ID.<br>**Opsi B**: JSON stringify langsung. | **Opsi A**. Deterministik dan kebal terhadap perbedaan urutan properti JSON. | Mencegah serangan key reuse dengan mengubah urutan barang belanja. | Dua payload dengan urutan item berbeda menghasilkan hash identik. | **BLOCKING WP-2** |
| **DEC-08** | **Penanganan Saldo Minus Warisan** | **Opsi A**: Eskalasi ke Admin Keuangan sebelum migrasi DDL.<br>**Opsi B**: Reset otomatis saldo minus ke Rp 0. | **Opsi A**. Nol manipulasi sepihak; saldo minus wajib diaudit dan direkonsiliasi manual. | Menjaga akuntabilitas pembukuan yayasan terhadap dana santri. | Hasil query preflight saldo minus = 0 sebelum DDL CHECK. | **BLOCKING WP-1** (Migrasi DDL) |
| **DEC-09** | **Penanganan Duplikasi Dompet Santri** | **Opsi A**: Konsolidasi saldo manual oleh Admin Keuangan.<br>**Opsi B**: Hapus baris duplikat secara otomatis. | **Opsi A**. Menjamin tidak ada saldo santri yang hilang akibat penghapusan data sepihak. | Menjamin hak kepemilikan dana santri tetap utuh. | Hasil query preflight duplikasi dompet = 0 sebelum UNIQUE DDL. | **BLOCKING WP-1** |
| **DEC-10** | **Otoritas Pembatalan / Refund Kasir** | **Opsi A**: Kasir dapat refund mandiri dalam batas 5 menit.<br>**Opsi B**: Seluruh refund wajib approval Admin Keuangan. | **Opsi A untuk batas 5 menit**, selebihnya Opsi B. Mencegah antrean macet jika kasir salah pencet. | Meminimalkan fraud kasir sambil menjaga kelancaran antrean kantin. | Audit log mencatat ID kasir dan timestamp pembatalan. | **NON-BLOCKING WP-1 s/d 3** |
| **DEC-11** | **Kebijakan Refund Saldo Model B** | **Opsi A**: Transfer bank ke rekening wali saat santri lulus.<br>**Opsi B**: Dialihkan menjadi infaq/donasi yayasan. | Dipertahankan berstatus terbuka sesuai arahan PO. | Memisahkan saldo internal dari penutupan rekening operasional. | Regulasi penutupan rekening santri disahkan yayasan. | **NON-BLOCKING** |
| **DEC-12** | **Model Settlement Merchant POS** | **Opsi A**: Settlement otomatis harian/mingguan.<br>**Opsi B**: Klaim invoice periodik oleh pengelola kantin. | Fleksibel mendukung 3 model bisnis PO (Bagi Hasil, 100% Pondok, 100% Operator). | Memastikan hak bagi hasil pihak ketiga dibayarkan transparan. | Laporan rekapitulasi bagi hasil per merchant tersedia akurat. | **NON-BLOCKING WP-1 s/d 3** |

---

**STATUS RATIFIKASI:**  
`AWAITING PRODUCT OWNER FORMAL RATIFICATION`  
`IMPLEMENTATION STATUS: NOT AUTHORIZED`
