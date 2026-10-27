# DECISION-REGISTER-M2-FINANCE-RFID-001
## Register Keputusan Arsitektur & Kebijakan Produk: Sistem Pembayaran Internal RFID & Integritas Finansial

**Project:** APP MA’HAD / Os_Darta  
**Workstream:** Keuangan, Dompet Digital Santri, Pembayaran Internal RFID, POS Multi-Merchant  
**Authority:** Product Owner (`Process_PO`) & Acting Process_Mandor (`Mandor 2`)  
**Mandate Reference:** MANDATE M2-FINANCE-ARCHITECTURE-009  
**Execution Mode:** STRICT READ-ONLY  
**Tanggal:** 19 Oktober 2026  

---

## 1. IKHTISAR REGISTER KEPUTUSAN

Register ini melacak secara formal seluruh keputusan bisnis dan teknis terkait sistem pembayaran RFID internal santri, membedakan secara tegas antara **Keputusan yang Sudah Dikunci (Locked Decisions)** dan **Keputusan Terbuka yang Memerlukan Ratifikasi PO (Open Decisions)**.

---

## 2. ATURAN BISNIS MUTLAK YANG SUDAH TERKUNCI (LOCKED DECISIONS)

Keputusan-keputusan berikut telah ditetapkan secara mengikat oleh Product Owner dan **TIDAK DAPAT DIUBAH ATAU DINEGOSIASIKAN KEMBALI**:

1. **[PO-LOCK-01] Transaksi Internal Murni Tanpa Gateway**: Seluruh transaksi pembayaran RFID adalah transaksi internal tertutup APP MA'HAD. Nol pemanggilan API Flip, nol payment order, nol dependensi webhook, dan nol gateway fee.
2. **[PO-LOCK-02] Sumber Dana Tunggal Saldo Uang Saku**: Pembayaran RFID hanya menggunakan saldo uang saku santri (`balance_uang_saku`). Saldo tabungan santri dan saldo Model B diisolasi.
3. **[PO-LOCK-03] Kewajiban PIN**: Setiap transaksi pembayaran RFID wajib memasukkan PIN santri.
4. **[PO-LOCK-04] Auto-Block Setelah 3x Salah PIN**: Tiga kali salah memasukkan PIN berturut-turut memblokir fungsi kartu RFID secara permanen sampai di-reset secara sah. Tidak ada auto-unblock berbasis waktu/cooldown.
5. **[PO-LOCK-05] Pembatasan Ketat Hak Reset PIN**:
   - **Wali Kelas**: Berwenang mereset PIN santri hanya untuk santri di kelas binaannya.
   - **Admin Keuangan**: Berwenang mereset PIN santri di tenant yang sama.
   - **Wali Santri**: **DILARANG KERAS** mereset PIN RFID anak.
   - **Super Admin**: **TIDAK DIIZINKAN** mereset PIN tanpa mandat baru dari PO.
6. **[PO-LOCK-06] Reset Sah Otomatis Membuka Blokir**: Tindakan reset PIN yang terotorisasi secara atomik mengosongkan counter gagal dan mengembalikan status kartu menjadi aktif.
7. **[PO-LOCK-07] Rincian Item POS Terstruktur**: POS kasir wajib mencatat rincian item transaksi terstruktur, snapshot harga historis, dan mengakomodasi layanan/kewajiban nonfisik.

---

## 3. REGISTER KEPUTUSAN TEKNIS & KEBIJAKAN TERBUKA (OPEN DECISIONS)

| ID Keputusan | Topik / Area Keputusan | Status Saat Ini | Opsi yang Dipertimbangkan | Rekomendasi Arsitek | Pemilik Keputusan | Status Ratifikasi |
|---|---|---|---|---|---|---|
| **DEC-01** | Algoritma Final Hashing PIN Santri | Terbuka | **Opsi A**: PBKDF2-HMAC-SHA256 (100k iterasi) + Salt + Pepper.<br>**Opsi B**: Argon2id (`m=19MiB, t=2, p=1`). | **Opsi A**: Nol dependensi pihak ketiga, ramah runtime serverless Next.js. | Product Owner | `PENDING PO APPROVAL` |
| **DEC-02** | Pengelolaan & Siklus Hidup Pepper | Terbuka | **Opsi A**: Runtime Env Variable (`process.env.RFID_PIN_PEPPER`).<br>**Opsi B**: Cloud KMS / HashiCorp Vault. | **Opsi A**: Cukup memadai untuk skala awal, wajib fail-closed jika kosong. | Product Owner / DevOps | `PENDING PO APPROVAL` |
| **DEC-03** | Strategi Migrasi Hash PIN Eksisting | Terbuka | **Opsi A**: Force Reset PIN massal saat kartu dibagikan.<br>**Opsi B**: Lazy Migration (rehash saat santri memasukkan PIN lama). | **Opsi A**: Lebih bersih karena PIN lama di DB tersimpan teks polos ber-prefix `'pin_'`. | Product Owner | `PENDING PO APPROVAL` |
| **DEC-04** | Kebijakan Retensi Kunci Idempotensi | Terbuka | **Opsi A**: Disimpan permanen di `canteen_transactions`.<br>**Opsi B**: Tabel terpisah dengan TTL / retention 30 hari. | **Opsi A**: Sederhana, menyatu dengan bukti transaksi historis POS. | Product Owner | `PENDING PO APPROVAL` |
| **DEC-05** | Model Status Transaksi Kasir | Terbuka | **Opsi A**: Status `SUCCESS` ditulis atomik, gagal langsung rollback.<br>**Opsi B**: Status `PENDING` ditulis sebelum debit. | **Opsi A**: Mencegah baris yatim (*orphaned rows*) jika serverless crash. | Product Owner | `PENDING PO APPROVAL` |
| **DEC-06** | Nullability & Persistensi `response_payload` | Terbuka | **Opsi A**: `jsonb NOT NULL` diisi data struk saat `SUCCESS`.<br>**Opsi B**: `jsonb NULLABLE` dapat bernilai null saat in-flight. | **Opsi A**: Karena transaksi atomik di-commit bersamaan dengan pembuatan respon. | Product Owner | `PENDING PO APPROVAL` |
| **DEC-07** | Definisi Kanonikalisasi Hash Request | Terbuka | **Opsi A**: Format string SHA-256 terurut berdasarkan item ID.<br>**Opsi B**: JSON stringify terstandarisasi. | **Opsi A**: Deterministik dan kebal terhadap perbedaan serialization JSON. | Product Owner | `PENDING PO APPROVAL` |
| **DEC-08** | Penanganan Migrasi Saldo Minus Warisan | Terbuka | **Opsi A**: Eskalasi ke Admin Keuangan sebelum migrasi DDL.<br>**Opsi B**: Reset otomatis saldo minus ke Rp 0. | **Opsi A**: Nol manipulasi data sepihak; saldo minus wajib diaudit manual. | Product Owner | `PENDING PO APPROVAL` |
| **DEC-09** | Penanganan Migrasi Duplikasi Dompet | Terbuka | **Opsi A**: Konsolidasi saldo manual oleh Admin Keuangan.<br>**Opsi B**: Hapus baris duplikat dengan saldo terendah. | **Opsi A**: Menjaga hak santri dan integritas akuntansi yayasan. | Product Owner | `PENDING PO APPROVAL` |
| **DEC-10** | Kebijakan Pembatalan / Refund Transaksi Kasir | Terbuka | **Opsi A**: Kasir dapat refund mandiri dalam 5 menit pertama.<br>**Opsi B**: Seluruh refund wajib approval Admin Keuangan. | **Opsi B**: Mengurangi risiko fraud kasir kantin di lapangan. | Product Owner | `PENDING PO APPROVAL` |
| **DEC-11** | Kebijakan Pengembalian Saldo Model B | Terbuka | **Opsi A**: Refund via transfer bank saat santri lulus/keluar.<br>**Opsi B**: Dialihkan menjadi infaq/donasi yayasan. | Dipertahankan terbuka sesuai arahan mandat PO. | Product Owner | `PENDING PO APPROVAL` |
| **DEC-12** | Pembagian Hasil Merchant Non-Kantin | Terbuka | **Opsi A**: Model revenue sharing persentase per transaksi.<br>**Opsi B**: Biaya sewa tempat tetap (*fixed monthly fee*). | Disediakan fleksibilitas skema `canteens.revenue_sharing_model`. | Product Owner | `PENDING PO APPROVAL` |

---

## 4. KONSEKUENSI PENUNDAAN KEPUTUSAN (CONSEQUENCE OF DEFERRAL)

1. **Penundaan DEC-01 (KDF PIN)**: Menghambat implementasi Work Package 3 (migrasi skema kredensial PIN dan endpoint reset).
2. **Penundaan DEC-08 & DEC-09 (Migrasi Saldo)**: Menghambat eksekusi migrasi penambahan constraint `CHECK (balance >= 0)` dan `UNIQUE (tenant_id, santri_id)`.
3. **Penundaan DEC-10 (Refund Kasir)**: Fitur pembatalan barang salah input di kasir belum dapat dirilis ke petugas kantin.

---

**FINAL STATUS REGISTER:**  
`DESIGN RATIFICATION: PENDING PRODUCT OWNER REVIEW`  
`IMPLEMENTATION STATUS: NOT AUTHORIZED`
