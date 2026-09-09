# WP-UI-020C TECHNICAL IMPLEMENTATION PLAN
## Academic & Teaching Data Screens Transformation

**Work Package ID:** `WP-UI-020C`  
**Document Status:** `PLANNING COMPLETE — AWAITING PRODUCT OWNER REVIEW`  
**Execution Status:** `READ-ONLY ARCHITECTURE PLANNING ONLY — NO CODE EXECUTION`  
**Certification Verdict:** `B — READY WITH GUARDRAILS`  
**Authoritative Governance:** WP-UI-001 v1.1, WP-UI-002, WP-UI-003 v1.1, WP-UI-010 Final Gate, WP-UI-020A, WP-UI-020B  

---

## 1. EXECUTIVE SUMMARY

Dokumen ini menyajikan rencana arsitektur teknis **WP-UI-020C (Academic & Teaching Data Screens Transformation)** untuk modul Akademik dan Pengajaran Ma'had Manager Enterprise ERP.

Tujuan utama **WP-UI-020C** adalah memodernisasi cara antarmuka akademis berukuran besar (*academic & teaching data-heavy UI*) dipresentasikan secara adaptif di seluruh perangkat:
- **Desktop (≥ 1024px):** Enterprise Academic Matrix Data Grid (Matriks Mapel × Kelas 2D, Spreadsheet Raport, Tabel Penilaian).
- **Tablet (640px - 1024px):** Adaptive Hybrid View (Grid dengan freeze column / scroll yang terisolidasi).
- **Mobile (< 640px):** Task-Optimized Academic Input & Summary (Student-First Input Row List, Subject Accordion List, Report Summary Cards).

### Prinsip Utama WP-UI-020C:
1. **0 Business Logic Modifications:** Seluruh formula nilai, bobot evaluasi, konversi predikat (A/B/C/D), alokasi guru, dan skema database akademis bersifat **IMMUTABLE (TIDAK BOLEH DIUBAH)**.
2. **Mobile-First Data Entry:** Penginputan nilai atau penugasan guru di HP harus dapat dilakukan dengan satu tangan (*one-hand operation*) dengan tombol/field sentuh minimal **44px × 44px**.
3. **No Horizontal Page Clipping:** Antarmuka akademis di HP tidak boleh memicu scroll horizontal global pada `body`.

---

## 2. REPOSITORY ARCHITECTURE & ROUTE MAP AUDIT

Hasil audit forensik repository terhadap 3 target layar utama akademis:

| Route Halaman | Existing Component Path | Data Source & Services | Tipe Layout Desktop Existing | Rencana Transformasi Mobile (< 640px) |
| :--- | :--- | :--- | :--- | :--- |
| **`/dashboard/penilaian`** | `src/app/dashboard/penilaian/page.tsx`<br>`src/components/operasional/SessionAssessmentModal.tsx` | `assessment-store.ts`<br>`academic-ledger.ts` | Placeholder / Matrix Modal | **Adaptive Student-First Input Cards** (Kartu per santri dengan numeric input 44px) |
| **`/dashboard/raport`** | `src/app/dashboard/raport/page.tsx`<br>`src/components/akademik/TranscriptViewModal.tsx` | `transcript-presenter.ts`<br>`academic-ledger.ts` | Placeholder / PDF Preview Modal | **Report Summary Cards** (Kartu ringkasan IPK/Nilai per Mapel dengan filter Semester) |
| **`/dashboard/distribusi-guru`** | `src/app/dashboard/distribusi-guru/page.tsx`<br>`src/components/distribusi/DistribusiMatrix.tsx` | `teacherAssignmentService`<br>`academic-structure.ts` | 2D HTML Table Matrix (Mapel vs Kelas) | **Adaptive Accordion List** (Daftar dikelompokkan per Mapel dengan dropdown guru 44px) |

---

## 3. BUSINESS LOGIC IMMUTABILITY BOUNDARY

Seluruh fungsi dan file berikut diklasifikasikan sebagai **CORE ACADEMIC BUSINESS LOGIC** yang **TIDAK BOLEH DITULIS ULANG / DIVERIFIKASI HANYA SEBAGAI CONSUMER**:

1. **Formula & Konversi Nilai:**
   - File: [src/lib/db/services/academic-ledger.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/services/academic-ledger.ts)
   - Function: `calculateFinalGrade()`, `convertScoreToPredicate()`.
2. **Presenter Raport & Transkrip:**
   - File: [src/lib/presenters/transcript-presenter.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/presenters/transcript-presenter.ts)
   - Function: `buildTranscriptPresenter()`.
3. **Logika Penugasan Guru & Mapel:**
   - File: [src/lib/db/services/index.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/services/index.ts)
   - Service: `teacherAssignmentService.create()`, `teacherAssignmentService.delete()`.
4. **Struktur & Tingkat Akademik:**
   - File: [src/lib/academic-structure.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/academic-structure.ts), [src/lib/progression-label.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/progression-label.ts)
   - Function: `getJenjangByInstansi()`, `buildTingkatLabelMap()`.

---

## 4. PENILAIAN MOBILE ARCHITECTURE

### Desktop View (≥ 1024px):
Tampilan matriks nilai tabel spreadsheet tempat guru memasukkan nilai santri secara massal dalam 1 tabel.

### Mobile View (< 640px):
1. **Student-First Input Card List:** Menggunakan `MobileCardStack`. Setiap kartu mewakili 1 santri.
2. **Touch-Safe Input Field:** Digunakan `Input` dengan `type="number"`, font `text-base` (16px untuk mencegah iOS Safari auto-zoom), dan tinggi fisik `min-h-[44px]`.
3. **Keyboard Navigation:** Tombol navigasi "Santri Selanjutnya" & "Santri Sebelumnya" berukuran 44px di bagian bawah kartu untuk mempercepat pengisian satu tangan.

---

## 5. RAPORT MOBILE ARCHITECTURE

### Desktop View (≥ 1024px):
Prinjau PDF Raport 2 kolom dengan tabel transkrip mata pelajaran, nilai harian, nilai akhir, dan IPK.

### Mobile View (< 640px):
1. **Report Summary Header Card:** Menampilkan Nama Santri, NIS, Kelas, Semester, dan IPK/Predikat Utama.
2. **Subject Accordion List:** Mengelompokkan nilai berdasarkan kategori (Kelompok Fiqih, Al-Qur'an, Bahasa Arab) yang dapat dibuka/tutup.
3. **PDF Download Action:** Tombol "Unduh Raport PDF" berukuran `min-h-[44px]` yang mencetak dokumen via `PrintReportCardPDF.tsx`.

---

## 6. DISTRIBUSI GURU MOBILE ARCHITECTURE

### Desktop View (≥ 1024px):
Matriks 2D `DistribusiMatrix.tsx` (Baris = Mapel, Kolom = Kelas). Setiap sel berisi pencarian guru.

### Mobile View (< 640px):
1. **Mapel Accordion Stack:** Setiap kartu mewakili 1 Mata Pelajaran.
2. **Kelas Assignment Rows:** Di dalam kartu mapel, tampil daftar kelas (contoh: 7 Abu Bakar, 7 Umar) beserta dropdown pilih guru.
3. **Touch-Safe Select:** Dropdown penugasan guru menggunakan `SelectTrigger` dengan safe area touch target `min-h-[44px]`.
4. **Save Action:** Tombol "Simpan Distribusi" melayang di bagian bawah layar (*Sticky Bottom Action Bar*) dengan safe-area inset.

---

## 7. SHARED PRIMITIVE REUSE PLAN

Seluruh antarmuka akademis WP-UI-020C wajib mengonsumsi primitif terverifikasi:
- `ResponsiveDataGrid` (`ResponsiveDataGrid.tsx`)
- `MobileCardStack` & `MobileCard` (`MobileCardStack.tsx`)
- `ResponsiveFilterBar` & `MobileFilterSheet` (`ResponsiveFilterBar.tsx`)
- `MobileRowActions` (`MobileRowActions.tsx`)
- `ResponsivePagination` (`ResponsivePagination.tsx`)
- `Button` (44px target), `Input` (16px text), `Select` (44px trigger), `Sheet`, `Dialog`.

---

## 8. DENSITY SYSTEM INTEGRATION

- **Canonical Density Store:** Mengonsumsi `mahad-ui-density`.
- **Desktop Density:** Mode Compact menyusutkan sel tabel matriks menjadi `py-1.5` untuk memaksimalkan jumlah baris akademis dalam satu layar.
- **Mobile Density:** Kepadatan visual menyesuaikan tetapi **TIDAK BOLEH** mengurangi tinggi target sentuh tombol/input di bawah 44px.

---

## 9. TOUCH TARGET & ACCESSIBILITY GUARDRAILS

- **Input Angka Nilai:** Minimun height `44px`.
- **Tombol Navigasi Matriks:** Minimun height `44px`.
- **Jarak Antar-Tombol:** Minimal `12px` (`gap-3`).
- **Keyboard Traversal:** Mendukung navigasi tombol `Tab` dan input enter untuk berpindah antar-santri secara cepat.

---

## 10. PROPOSED SUB-PACKAGE IMPLEMENTATION SEQUENCE

```
WP-UI-020C-1: Penilaian & Assessment Entry Presentation Architecture
    │
    ├── WP-UI-020C-2: Raport & Transcript Presentation Architecture
    │
    ├── WP-UI-020C-3: Distribusi Guru & Mapel Matrix Transformation
    │
    └── WP-UI-020C-4: Final Integration, Accessibility & Quality Gates Certification
```

---

## 11. FILE-LEVEL CHANGE PLAN (PROPOSED)

| File Path | Peran Saat Ini | Rencana Perubahan UI | Dampak Logic Bisnis |
| :--- | :--- | :--- | :--- |
| `src/app/dashboard/penilaian/page.tsx` | Placeholder Page | Implementasi UI Penilaian Responsif | **0 (Zero)** |
| `src/app/dashboard/raport/page.tsx` | Placeholder Page | Implementasi UI Raport Responsif | **0 (Zero)** |
| `src/app/dashboard/distribusi-guru/page.tsx` | Matriks Page Wrapper | Integrasi `ResponsiveDataGrid` | **0 (Zero)** |
| `src/components/distribusi/DistribusiMatrix.tsx` | 2D Table Matrix | Integrasi Mobile Accordion List | **0 (Zero)** |

---

## 12. RISK REGISTER & MITIGATION

| ID | Deskripsi Risiko | Severity | Strategi Mitigasi |
| :--- | :--- | :--- | :--- |
| **R-01** | Perubahan tidak sengaja pada formula nilai IPK / Raport | **P0 (Critical)** | Isolasi total layer presentasi. Gunakan unit test `academic-ledger.test.ts` untuk memverifikasi immutability. |
| **R-02** | Keyboard HP menutupi input nilai pada layar kecil | **P1 (High)** | Gunakan `dvh` dan auto-scroll ke input aktif saat mendapat fokus. |
| **R-03** | Matriks Distribusi Guru terpotong di HP 320px | **P1 (High)** | Gunakan Accordion per Mapel menggantikan tabel 2D di mobile. |

---

## 13. ACCEPTANCE CRITERIA FOR FUTURE EXECUTION

1. `npx tsc --noEmit` -> 0 Errors.
2. `npm run test:run` -> 100% Passed.
3. `npm run build` -> 74 Static Routes Compiled.
4. Seluruh kontrol input nilai di mobile memiliki area sentuh minimal **44px × 44px**.
5. Zero perubahan pada skema database, API route, atau logika perhitungan nilai.

---

## 14. CERTIFICATION VERDICT & READINESS

### VERDICT: B — READY WITH GUARDRAILS

Perencanaan arsitektur **WP-UI-020C** disertifikasi **SIAP UNTUK DIEKSEKUSI (READY WITH GUARDRAILS)**. Eksekusi runtime sub-paket `WP-UI-020C-1` dapat dimulai setelah mendapat otorisasi terpisah dari Product Owner.

---

```
============================================================
STATUS AKHIR PLAN WP-UI-020C:
WP-UI-010: CERTIFIED
WP-UI-020A: APPROVED
WP-UI-020B: APPROVED
WP-UI-020C: PLANNING COMPLETE — AWAITING PRODUCT OWNER REVIEW
WP-UI-020D: NOT EXECUTED
WP-UI-020E: NOT EXECUTED

RUNTIME CODE MODIFIED: 0
DATABASE MODIFIED: 0
MIGRATION CREATED: 0
PACKAGE DEPENDENCIES MODIFIED: 0
GIT COMMIT: 0
GIT PUSH: 0

IMPLEMENTATION STATUS: STOP — AWAITING PRODUCT OWNER REVIEW
============================================================
```
