# QUALITY GATES OPERATIONAL SPECIFICATION (GATE A — GATE E)
## Standar Operasional Penjaminan Mutu Rekayasa Perangkat Lunak APP MA'HAD

**Dokumen ID:** `RULES-QUALITY-GATES-v1.0`  
**Otoritas:** Product Owner (PO) APP MA'HAD  
**Status:** RATIFIED OPERATIONAL SPECIFICATION  
**Referensi Induk:** `docs/eeos-o/EEOS-O-MASTER-SYSTEM-SPECIFICATION-v1.1.md` | `EEOS-O-TASK-CONTRACT-ARCHITECTURE-AND-CONTRACT.md`

---

## 1. TUJUAN & PRINSIP DASAR

Setiap perubahan kode (*work package*, perbaikan *bug*, maupun fitur baru) wajib melewati lima gerbang mutu (*Five Quality Gates*) secara berurutan. Tidak ada perubahan yang dapat dipromosikan ke tahap berikutnya sebelum gerbang sebelumnya berstatus **LULUS (PASSED)**.

Prinsip Utama:
1. **Kepercayaan Berbasis Bukti:** Status lulus hanya sah jika didukung oleh bukti empiris yang dapat direproduksi (*reproducible evidence*).
2. **Kemandirian Review:** Penilaian mutu pada Gate D dilakukan secara independen oleh ICQA (*Independent Code Quality Assurance*).
3. **Pemisahan Kualitas dari Rilis:** Kelulusan Gate D menyatakan kesiapan teknis, namun wewenang rilis dan deployment ke Production mutlak berada di tangan Product Owner (Gate E).

---

## 2. SPESIFIKASI LIMA QUALITY GATES

```text
[Requirement] ──► Gate A ──► [Implementation] ──► Gate B ──► [Auto Tests] ──► Gate C 
              ──► Gate D (ICQA) ──► Gate E (PO Authorization) ──► [Production]
```

### GATE A — REQUIREMENT & ARCHITECTURE COMPLIANCE
- **Penanggung Jawab:** ZenOrion (Lead Orchestrator).
- **Tujuan:** Mengunci ruang lingkup pekerjaan, mencegah *scope creep*, dan memastikan kepatuhan terhadap arsitektur multi-tenant 10 tahun.
- **Kriteria Kelulusan (Pass Criteria):**
  1. Terdapat dokumen Work Package resmi berstatus `RATIFIED` dari PO.
  2. Batasan mutasi berkas (`allowedPaths`) dideklarasikan secara eksplisit.
  3. Desain mematuhi isolasi ketat `tenant_id`, Supabase RLS, dan terminologi asli pesantren (*Madrasah*, *Jenjang*, *Santri*, *Wali*, *Musyrif*).
- **Kriteria Kegagalan (Fail Criteria):**
  - Modifikasi kode di luar cakupan yang disahkan.
  - Skema data tidak menyertakan kolom `tenant_id`.
  - Penggunaan istilah administratif generik yang bertentangan dengan domain pesantren.
- **Bukti Minimum:** Dokumen Work Package / Directive resmi ber-ID unik.

---

### GATE B — IMPLEMENTATION & CODE QUALITY
- **Penanggung Jawab:** Specialist Implementer Agent.
- **Tujuan:** Menjamin kebersihan kode, modularitas, keamanan input, dan penanganan kesalahan *fail-closed*.
- **Kriteria Kelulusan (Pass Criteria):**
  1. Seluruh perubahan kode berada di dalam batasan `allowedPaths`.
  2. Penanganan error bersifat *fail-closed* tanpa membocorkan *stack trace*, kredensial, atau rahasia server ke respon HTTP.
  3. Sanitasi aktif terhadap input pengguna (Formula Injection, SQL/NoSQL Injection, XSS).
  4. Nol penggunaan tipe `any` tanpa dokumentasi justifikasi teknis yang disetujui.
  5. Tidak menyisipkan *backdoor* otorisasi atau *bypass header* di dalam kode rute produksi.
- **Kriteria Kegagalan (Fail Criteria):**
  - Mutasi pada berkas di luar `allowedPaths` (Scope Breach).
  - Terdapat *fallback header* yang mempercayai peran/identitas dari header klien tanpa verifikasi database server.
  - Pelanggaran linting atau standar tipe.
- **Bukti Minimum:** Output `git status` dan ringkasan diff (`git diff --stat`).

---

### GATE C — AUTOMATED VERIFICATION INTEGRITY
- **Penanggung Jawab:** Specialist Implementer Agent.
- **Tujuan:** Memvalidasi integritas tipe, build, dan fungsionalitas melalui pengujian otomatis lokal yang nyata.
- **Kriteria Kelulusan (Pass Criteria):**
  1. `npx tsc --noEmit` menghasilkan exit code 0 (nol error, nol warning).
  2. `git diff --check` menghasilkan exit code 0 (bersih dari whitespace error dan konflik).
  3. 100% automated test yang relevan lulus pada eksekusi terminal lokal (`npx vitest run ...`).
  4. Pengujian mencakup skenario negatif, batas (*edge cases*), dan penolakan akses.
- **Kriteria Kegagalan (Fail Criteria):**
  - Adanya test yang gagal (*failed*) atau sengaja di-skip (`test.skip`) demi meluluskan gerbang.
  - Adanya kesalahan kompilasi TypeScript.
  - Pengujian bersifat tautologis (hanya menguji mock buatan sendiri tanpa memvalidasi logika bisnis).
- **Bukti Minimum:** Log terminal aktual dengan exit code 0 dan durasi eksekusi.

---

### GATE D — INDEPENDENT QUALITY ASSURANCE (ICQA)
- **Penanggung Jawab:** Independent Code Quality Assurance Agent (ICQA).
- **Tujuan:** Audit skeptis dan independen terhadap seluruh artefak, pembuktian isolasi data multi-tenant, verifikasi integritas biner, dan analisis celah pengujian.
- **Kriteria Kelulusan (Pass Criteria):**
  1. ICQA menerbitkan vonis **`PASS`** atau **`PASS WITH CONDITIONS`**.
  2. Nol temuan berkategori `CRITICAL` atau `HIGH`.
  3. Verifikasi empiris penolakan akses lintas-tenant (IDOR).
  4. Uji integritas biner/struktur data pada berkas yang dihasilkan (XLSX/PDF parseable).
  5. Seluruh kondisi pada `PASS WITH CONDITIONS` terdokumentasi dengan mitigasi terukur dan tidak memblokir fungsi utama.
- **Kriteria Kegagalan (Fail Criteria):**
  - Ditemukan kerentanan keamanan (kebocoran tenant, otorisasi tembus, bypass).
  - Ditemukan cacat integritas kalkulasi keuangan (sisa saldo/piutang salah).
  - ICQA menerbitkan vonis **`FAIL`** (Hak Veto Kualitas).
- **Bukti Minimum:** Dokumen *Independent Quality Dossier* lengkap dengan daftar temuan terstruktur.

---

### GATE E — RELEASE READINESS & PO AUTHORIZATION
- **Penanggung Jawab:** Product Owner (PO).
- **Tujuan:** Pengambilan keputusan rilis resmi ke lingkungan Produksi.
- **Kriteria Kelulusan (Pass Criteria):**
  1. Gate A sampai Gate D berstatus Lulus.
  2. Rencana migrasi database, dampak deployment, dan skrip rollback (jika ada) terverifikasi aman.
  3. Product Owner menerbitkan otorisasi tertulis resmi (*PO Release Authorization Statement*).
- **Kriteria Kegagalan (Fail Criteria):**
  - Tidak adanya otorisasi eksplisit dari PO.
  - Terdapat risiko bisnis atau regulasi yang belum diterima oleh PO.
- **Bukti Minimum:** Dokumen *PO Release Authorization Statement* yang meratifikasi commit/hash rilis.

---

## 3. PROTOKOL VETO, REWORK, DAN PENGECEKAUAN

1. **Hak Veto Kualitas ICQA:**
   - Vonis `FAIL` dari ICQA pada Gate D mengikat secara hukum sistem dan membekukan promosi perubahan.
   - Lead Orchestrator wajib menerbitkan *Rework Directive* kepada Implementer untuk memperbaiki temuan sebelum Gate D dapat diuji ulang.
2. **Pengecualian Risiko (*Risk Waiver*):**
   - Hanya Product Owner yang memiliki kedaulatan untuk menerima risiko teknis non-kritis melalui *Risk Waiver Register*.
   - Setiap pengecualian wajib mencantumkan alasan bisnis, batasan masa berlaku (*Time-to-Live*), dan tiket remediasi masa depan.
