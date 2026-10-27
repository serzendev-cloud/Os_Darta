# MATRIX-M2-FINANCE-ARCHITECTURE-010-TRACEABILITY
## Matriks Ketertelusuran Persyaratan & Integritas Arsitektur (End-to-End Traceability Matrix)

**Work Package:** M2-FINANCE-ARCHITECTURE-010  
**Sistem:** APP MA’HAD — Finance, Internal RFID Payment, Wallet, POS & Tenant Merchant Architecture  
**Otoritas:** Product Owner (`Process_PO`) & Acting Process_Mandor (`Mandor 2`)  
**Mode Operasi:** STRICT READ-ONLY  
**Dokumen Desain Acuan:** `DRAFT-M2-FINANCE-ARCHITECTURE-010-CONSOLIDATED-DESIGN.md`  
**Tanggal:** 19 Oktober 2026  

---

## 1. FORMULA KETERTELUSURAN END-TO-END

Setiap kebutuhan bisnis dan teknis dipetakan secara deterministik mengikuti formula:
$$\mathbf{Requirement\ ID \longrightarrow Decision\ ID \longrightarrow Design\ Section \longrightarrow Source\ Evidence \longrightarrow Invariant \longrightarrow Test\ ID \longrightarrow Acceptance\ Gate \longrightarrow Status}$$

---

## 2. MATRIKS KETERTELUSURAN LENGKAP

| Requirement ID | Decision ID | Design Section (Draf 010) | Source Evidence | Database Invariant | Test ID | Acceptance Gate | Status Verifikasi |
|---|---|---|---|---|---|---|---|
| **REQ-RFID-01** (Zero Gateway) | PO-LOCK-01 | Bab 1.1 & Bab 1.2 | `src/app/api/canteen/pay/route.ts:L1-229` | Nol kolom invoice/Flip di transaksi POS | `TC-ISO-01` | GATE-01 | `SOURCE VERIFIED` |
| **REQ-RFID-02** (Uang Saku Saja) | PO-LOCK-02 | Bab 1.2 & Bab 5 | `src/app/api/canteen/pay/route.ts:L162` | `wallets.balance_uang_saku` | `TC-FIN-01` | GATE-01 | `SOURCE VERIFIED` |
| **REQ-RFID-03** (Row Lock Concurrency)| PO-LOCK-01 | Bab 1.2 & Bab 8 | `/api/canteen/pay:L87` & `/api/webhooks/flip:L86` | Serialisasi baris dompet santri | `TC-CON-01` | GATE-04 | `DESIGN VERIFIED` |
| **REQ-RFID-04** (Lost Update Webhook) | PO-LOCK-01 | Bab 1.2 & Bab 8 | `src/app/api/webhooks/flip/route.ts:L86-92` | Protokol lock kompatibel di kedua penulis | `TC-CON-02` | GATE-04 | `DESIGN VERIFIED` |
| **REQ-RFID-05** (Saldo Non-Negatif) | DEC-08 | Bab 8.1 & Bab 8.2 | `drizzle/0000_neat_machine_man.sql:L595` | `CHECK (balance_uang_saku >= 0)` | `TC-CHK-01` | GATE-07 | `PO DECISION REQUIRED` |
| **REQ-RFID-06** (Unique Dompet) | DEC-09 | Bab 8.1 & Bab 8.2 | `src/lib/db/schema/finance.ts:L4-22` | `UNIQUE (tenant_id, santri_id)` | `TC-MIG-03` | GATE-07 | `PO DECISION REQUIRED` |
| **REQ-PIN-01** (Wajib PIN & Hashing) | DEC-01 | Bab 2.1 | `src/app/api/canteen/pay/route.ts:L65` | `rfid_cards.hashed_pin, pin_salt` | `TC-PIN-01` | GATE-06 | `PO DECISION REQUIRED` |
| **REQ-PIN-02** (Decoupled Attempt) | PO-LOCK-04 | Bab 1.1 | `src/lib/db/schema/rfid.ts:L4-14` | Counter gagal tidak ter-rollback | `TC-PIN-02` | GATE-06 | `DESIGN VERIFIED` |
| **REQ-PIN-03** (Auto-Block 3x) | PO-LOCK-04 | Bab 2.2 | `src/app/api/canteen/pay/route.ts:L68` | `failed_pin_attempts >= 3 -> blocked` | `TC-PIN-03` | GATE-06 | `DESIGN VERIFIED` |
| **REQ-PIN-04** (Kartu Terblokir) | PO-LOCK-04 | Bab 1.1 & Bab 2.2 | `src/app/api/canteen/pay/route.ts:L57` | `rfid_cards.status = 'blocked'` | `TC-PIN-04` | GATE-06 | `SOURCE VERIFIED` |
| **REQ-RST-01** (Reset Wali Kelas) | PO-LOCK-05 | Bab 6.1 | `POST /api/rfid/reset-pin` (rencana) | Otorisasi terikat rombel kelas santri | `TC-RST-01` | GATE-01 | `DESIGN VERIFIED` |
| **REQ-RST-02** (Tolak Wali Kelas Luar) | PO-LOCK-05 | Bab 6.1 | `POST /api/rfid/reset-pin` (rencana) | Guard kelas santri beda -> 403 | `TC-RST-02` | GATE-01 | `DESIGN VERIFIED` |
| **REQ-RST-03** (Reset Admin Keuangan) | PO-LOCK-05 | Bab 6.1 | `POST /api/rfid/reset-pin` (rencana) | Otorisasi role admin tenant | `TC-RST-03` | GATE-01 | `DESIGN VERIFIED` |
| **REQ-RST-04** (Tolak Wali Santri) | PO-LOCK-05 | Bab 6.1 | `POST /api/rfid/reset-pin` (rencana) | Role wali santri ditolak tegas (403) | `TC-RST-04` | GATE-01 | `DESIGN VERIFIED` |
| **REQ-IDM-01** (Idempotency Replay) | DEC-04 | Bab 3.2 | `src/app/api/canteen/pay/route.ts` | `UNIQUE(tenant_id, idempotency_key)` | `TC-IDM-01` | GATE-05 | `DESIGN VERIFIED` |
| **REQ-IDM-02** (Konflik Payload) | DEC-07 | Bab 3.1 & Bab 3.2 | `canteen_transactions.request_hash` | Hash SHA-256 beda -> 409 Conflict | `TC-IDM-02` | GATE-05 | `DESIGN VERIFIED` |
| **REQ-IDM-03** (Recovery Error 23505) | DEC-05 | Bab 3.2 | Route handler catch block di luar TX | Query recovery di luar aborted TX | `TC-IDM-03` | GATE-05 | `DESIGN VERIFIED` |
| **REQ-IDM-04** (Payload Respon Struk) | DEC-06 | Bab 3.2 & Bab 4.1 | `canteen_transactions.response_payload` | `jsonb NOT NULL` berisi data struk asli | `TC-IDM-01` | GATE-05 | `DESIGN VERIFIED` |
| **REQ-POS-01** (Detail Item POS) | PO-LOCK-07 | Bab 4.1 | Tabel baru `canteen_transaction_items` | Snapshot nama & harga per baris | `TC-POS-01` | GATE-01 | `DESIGN VERIFIED` |
| **REQ-POS-02** (Transaksi Nonfisik) | PO-LOCK-07 | Bab 4.1 | `item_type = 'obligation_payment'` | Metadata ID denda / kewajiban | `TC-POS-02` | GATE-01 | `DESIGN VERIFIED` |
| **REQ-POS-03** (3 Model Merchant PO) | DEC-12 | Bab 4.2 | `canteens.revenue_sharing_model` | Split porsi bagi hasil per model bisnis | `TC-POS-03` | GATE-01 | `PO DECISION REQUIRED` |
| **REQ-SEC-01** (Isolasi Fail-Closed) | DEC-02 | Bab 15 Draf 004 | Environment `RFID_PIN_PEPPER` | Aplikasi boot exception jika kosong | `TC-SEC-03` | GATE-06 | `PO DECISION REQUIRED` |

---

**FINAL STATUS MATRIKS:**  
`TRACEABILITY VERIFIED COMPLETE — ZERO ORPHANED REQUIREMENTS.`
