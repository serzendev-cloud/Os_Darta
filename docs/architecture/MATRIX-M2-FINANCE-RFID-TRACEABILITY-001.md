# MATRIX-M2-FINANCE-RFID-TRACEABILITY-001
## Matriks Ketertelusuran Persyaratan & Integritas Arsitektur (Traceability Matrix)

**Project:** APP MA’HAD / Os_Darta  
**Workstream:** Keuangan, Dompet Digital Santri, Pembayaran Internal RFID, POS Multi-Merchant  
**Authority:** Product Owner (`Process_PO`) & Acting Process_Mandor (`Mandor 2`)  
**Mandate Reference:** MANDATE M2-FINANCE-ARCHITECTURE-009  
**Execution Mode:** STRICT READ-ONLY  
**Dokumen Terkait:** `DRAFT-M2-FINANCE-RFID-REMEDIATION-DESIGN-004.md`  
**Tanggal:** 19 Oktober 2026  

---

## 1. IKHTISAR MATRIKS KETERTELUSURAN

Matriks ini menghubungkan setiap aturan bisnis Product Owner, bab spesifikasi desain Draf 004, berkas kode sumber terkait, dependensi skema database, skenario pengujian, status pembuktian, dan gerbang implementasi masa depan (*Implementation Gate*).

---

## 2. TABEL KETERTELUSURAN PERSYARATAN UTAMA

| No | Aturan Bisnis PO / Persyaratan | Bab Desain (Draf 004) | Berkas Kode Terkait | Dependensi Skema DB | ID Pengujian (Test Case) | Status Bukti Repositori | Kesenjangan Tersisa | Gerbang Implementasi |
|---|---|---|---|---|---|---|---|---|
| 1 | **Transaksi RFID 100% Internal (Zero Gateway)** | Bab 1 & Bab 8 | `src/app/api/canteen/pay/route.ts` | `canteen_transactions` | `TC-ISO-01` | `[TERBUKTI DI KODE]` | Tidak ada (sudah internal) | Gate 1 (Review Accepted) |
| 2 | **Hanya Mendebit Saldo Uang Saku** | Bab 8.4 | `src/app/api/canteen/pay/route.ts:L162` | `wallets.balance_uang_saku` | `TC-FIN-01` | `[TERBUKTI DI KODE]` | Tabungan tidak disentuh | Gate 1 & Gate 2 |
| 3 | **Pencegahan Double Spending via Row Lock** | Bab 8.1 & Bab 9 | `/api/canteen/pay` & `/api/webhooks/flip` | `wallets` (FOR UPDATE) | `TC-CON-01` | `[TERBUKTI RENTAN SAAT INI]` | Perlu refaktor `FOR UPDATE` | Gate 3 (Core Refactor) |
| 4 | **Pencegahan Lost Update Transaksi vs Top-up** | Bab 7.1 & Bab 9 | `src/app/api/webhooks/flip/route.ts` | `wallets` (FOR UPDATE) | `TC-CON-02` | `[TERBUKTI RENTAN SAAT INI]` | Perlu refaktor webhook Flip | Gate 3 (Core Refactor) |
| 5 | **Constraint Saldo Non-Negatif di DB** | Bab 7.1 | `drizzle/0000_neat_machine_man.sql` | `CHECK (balance >= 0)` | `TC-CHK-01` | `[TERBUKTI BELUM ADA CONSTRAINT]` | Butuh migrasi DDL | Gate 2 (Schema Migration) |
| 6 | **Unique Constraint Dompet per Santri** | Bab 7.1 | `src/lib/db/schema/finance.ts` | `UNIQUE (tenant_id, santri_id)` | `TC-MIG-03` | `[TERBUKTI BELUM ADA CONSTRAINT]` | Butuh migrasi DDL | Gate 2 (Schema Migration) |
| 7 | **Kewajiban PIN & Hashing KDF Ber-Salt** | Bab 3.1 & Bab 3.2 | `src/app/api/canteen/pay/route.ts:L65` | `rfid_cards.hashed_pin, pin_salt` | `TC-PIN-01` | `[TERBUKTI PLAIN TEXT SAAT INI]` | Butuh migrasi salt & PBKDF2 | Gate 2 & Gate 4 |
| 8 | **Auto-Block Setelah 3x Salah PIN** | Bab 3.2 | `src/app/api/canteen/pay/route.ts:L68` | `rfid_cards.failed_pin_attempts` | `TC-PIN-03` | `[TERBUKTI BELUM ADA COUNTER]` | Butuh kolom counter & auto-block | Gate 2 & Gate 4 |
| 9 | **Kartu Diblokir Menolak Transaksi** | Bab 2.1 | `src/app/api/canteen/pay/route.ts:L57` | `rfid_cards.status = 'blocked'` | `TC-PIN-04` | `[TERBUKTI DI KODE]` | Logika blokir dasar sudah ada | Gate 4 (PIN Flow) |
| 10 | **Reset PIN Hanya oleh Wali Kelas Binaan** | Bab 3.3 | `POST /api/rfid/reset-pin` (baru) | `rfid_cards`, `rombel` | `TC-RST-01`, `TC-RST-02` | `[TERBUKTI ENDPOINT BELUM ADA]` | Butuh endpoint reset PIN baru | Gate 4 (PIN Flow) |
| 11 | **Reset PIN oleh Admin Keuangan Tenant** | Bab 3.3 | `POST /api/rfid/reset-pin` (baru) | `rfid_cards`, `user_roles` | `TC-RST-03` | `[TERBUKTI ENDPOINT BELUM ADA]` | Butuh endpoint reset PIN baru | Gate 4 (PIN Flow) |
| 12 | **Penolakan Reset PIN oleh Wali Santri** | Bab 3.3 | `POST /api/rfid/reset-pin` (baru) | RBAC Permission Server | `TC-RST-04` | `[TERBUKTI ENDPOINT BELUM ADA]` | Guard middleware server-side | Gate 4 (PIN Flow) |
| 13 | **Idempotency Key & Replay HTTP 200** | Bab 7.1 & Bab 11 | `src/app/api/canteen/pay/route.ts` | `canteen_transactions.idempotency_key` | `TC-IDM-01` | `[TERBUKTI BELUM ADA IDEMPOTENCY]` | Butuh kolom & logika replay | Gate 2 & Gate 3 |
| 14 | **Penolakan Kunci Sama Beda Payload (409)** | Bab 7.1 | `src/app/api/canteen/pay/route.ts` | `canteen_transactions.request_hash` | `TC-IDM-02` | `[TERBUKTI BELUM ADA IDEMPOTENCY]` | Butuh hash payload verification | Gate 3 (Core Refactor) |
| 15 | **Penanganan Error Konkuren PostgreSQL 23505** | Bab 7.2 | `src/app/api/canteen/pay/route.ts` | Indeks Unik Idempotensi | `TC-IDM-03` | `[TERBUKTI BELUM ADA INDEKS]` | Butuh catch recovery query | Gate 3 (Core Refactor) |
| 16 | **Penyimpanan Atomik `response_payload jsonb`** | Bab 11 | `src/lib/db/schema/finance.ts` | `canteen_transactions.response_payload` | `TC-IDM-01` | `[TERBUKTI BELUM ADA KOLOM]` | Butuh penambahan kolom jsonb | Gate 2 & Gate 3 |
| 17 | **Detail POS Item Terstruktur & Snapshot** | Bab 5 & Bab 9 | Skema baru `canteen_transaction_items` | `canteen_transaction_items` (tabel baru)| `TC-POS-01` | `[TERBUKTI HANYA TEKS STRING]` | Butuh pembuatan tabel baru | Gate 2 & Gate 3 |
| 18 | **Dukungan Layanan/Kewajiban Nonfisik** | Bab 5.2 | Header & metadata transaksi POS | `canteen_transaction_items.metadata` | `TC-POS-02` | `[TERBUKTI HANYA TEKS STRING]` | Butuh dukungan metadata JSONB | Gate 3 (Core Refactor) |
| 19 | **Pemisahan Bagi Hasil Merchant** | Bab 4.2 | `src/lib/db/schema/finance.ts` | `canteen_transactions.merchant_share` | `TC-POS-03` | `[TERBUKTI HANYA 1 KOLOM AMOUNT]` | Butuh split porsi bagi hasil | Gate 2 & Gate 3 |
| 20 | **Isolasi Fail-Closed Server Pepper** | Bab 15 | Runtime Environment Variables | `process.env.RFID_PIN_PEPPER` | `TC-SEC-03` | `[TERBUKTI BELUM ADA PEPPER]` | Butuh setup env serverless | Gate 5 (Staging Deploy) |

---

**FINAL STATUS MATRIKS:**  
`DESIGN TRACEABILITY COMPLETE — IMPLEMENTATION GATED.`
