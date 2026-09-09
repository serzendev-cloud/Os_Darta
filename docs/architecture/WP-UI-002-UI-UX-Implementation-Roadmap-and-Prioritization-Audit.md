# WP-UI-002 — UI/UX IMPLEMENTATION ROADMAP & PRIORITIZATION AUDIT
## Dependency-Aware Engineering Roadmap for WP-UI-001 Governance Baseline

**Work Package ID:** `WP-UI-002`  
**Governance Standard:** [WP-UI-001 v1.1 — LOCKED CANONICAL](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/architecture/WP-UI-001-Master-UI-UX-Governance-Baseline.md)  
**Status:** `PLANNING COMPLETE — IMPLEMENTATION NOT STARTED`  
**Target Enterprise Horizon:** Multi-Tenant 100+ Pesantren SaaS (10-Year Scalability)  
**Execution Safety:** `DOCUMENTATION ONLY — 0 RUNTIME/DATABASE MODIFICATIONS`  

---

## 1. EXECUTIVE SUMMARY

Dokumen **WP-UI-002** mengonversi seluruh ketetapan kanonikal **WP-UI-001 v1.1** dan temuan forensik antarmuka ke dalam peta jalan implementasi (*implementation roadmap*) bertahap, sadar-ketergantungan (*dependency-aware*), dan terukur risikonya.

Peta jalan ini dirancang dengan prinsip **Foundation-First & Mobile-First**:
1. **Fondasi Terlebih Dahulu (*Foundation-First*)**: Perbaikan tidak boleh dilakukan secara sporadis pada halaman individual sebelum komponen primitif bersama (*shared UI primitives*), layout shell, dan pola responsif distabilkan.
2. **Prioritas Operasional Mobile (*Mobile Critical Operations First*)**: Fitur lapangan frekuensi tinggi bagi Musyrif, Guru, Satpam, dan Wali Santri diprioritaskan sebelum fitur administratif desktop berkepadatan tinggi.
3. **Isolasi Domain (*No Domain Migration Leaks*)**: Ketergantungan terhadap arsitektur domain Kesiswaan yang sedang berjalan (WP-303, WP-310, WP-311, WP-315, WP-316, WP-320, WP-321) ditandai secara eksplisit (*Blocked by Domain Dependency*) agar tidak diselesaikan melalui *hack* pada lapisan UI.

---

## 2. REPOSITORY UI FORENSIC AUDIT

Audit mendalam berbasis kode riil (*ground-truth inspection*) terhadap repositori menghasilkan inventarisasi menyeluruh pada 20 dimensi antarmuka:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REPOSITORY UI ASSET INVENTORY (FORENSIC)                 │
├──────────────────────────┬───────┬──────────────────────────────────────────┤
│ KATEGORI ASET            │ JUMLAH│ STATUS UMUM & TEMUAN KUNCI               │
├──────────────────────────┼───────┼──────────────────────────────────────────┤
│ Dashboard Routes         │  38   │ Terstruktur di `src/app/dashboard/*`     │
│ Shared UI Primitives     │  17   │ Terpusat di `src/components/ui/*`        │
│ Shared Layout Components │   3   │ Sidebar, Topbar, Breadcrumb              │
│ Shared Domain Primitives │  10   │ PageHeader, PageCard, StatsCard, dsb.    │
│ Data Table Instances     │  22+  │ Mayoritas raw table + `overflow-x-auto`  │
│ Modal / Dialog Instances │  18+  │ Sebagian custom overlay, dialog desktop  │
│ Dedicated Mobile Sheets  │   1   │ Baru diimplementasikan pada sidebar drawer│
└──────────────────────────┴───────┴──────────────────────────────────────────┘
```

### Rincian Temuan Forensik per Area:
- **A. Layout & App Shell (`src/app/dashboard/layout.tsx`)**: Mengatur transisi sidebar collapsed/expanded (`lg:pl-[var(--sidebar-width)]`), namun latar belakang membungkus class statis `bg-sky-100/80 dark:bg-background` yang perlu diselaraskan dengan token tema kanonikal.
- **B. Navigasi & Sidebar (`src/config/navigation.ts`, `src/components/layout/sidebar.tsx`)**: Telah menjadi sumber kebenaran tunggal (*authoritative source of truth*); isolasi SaaS vs Tenant berjalan 100%. Drawer mobile telah didukung.
- **C. Shared UI Primitives (`src/components/ui/*`)**: Memakai Radix/Base-UI. Namun, ukuran default `Button` (h-8/32px), `Input` (h-8/32px), dan `SelectTrigger` (h-8/32px) masih desktop-centric dan belum memenuhi standar ergonomi sentuh mobile 44px/48px.
- **D. Shared Presentation Components (`src/components/shared/*`)**: `PageHeader`, `PageCard`, `StatsCard`, `StatusBadge`, `EmptyState`, `ErrorState`, dan `LoadingState` telah terisolasi rapi, siap menjadi fondasi standar.
- **E. Data Tables (Santri, Alumni, Hukuman, Guru, UKS, dsb.)**: Seluruhnya dibungkus tag HTML `<table>` dalam `div.overflow-x-auto`. Pada mobile (< 640px), pengguna dipaksa menggeser layar secara horizontal tanpa kartu ringkasan (*card stack*).
- **F. Modals & Dialogs (CatatPelanggaran, AddSantri, KelasModal, dsb.)**: Mayoritas me-render modal mengambang di tengah layar (*centered desktop dialog*), beberapa membuat custom modal wrapper mandiri (misal: `AddSantriModal.tsx`) tanpa memakai primitif dialog bersama.

---

## 3. COMPLIANCE MATRIX AGAINST WP-UI-001 v1.1

| Klausul Tata Kelola WP-UI-001 | Status Saat Ini | Tingkat Deviasi | Dampak Arsitektural & Pengguna |
| :--- | :--- | :--- | :--- |
| **1. Mobile-First Approach** | `NON-COMPLIANT` | **Tinggi** | Halaman utama dirancang desktop-first lalu di-wrap overflow. |
| **2. Responsive Transformation** | `PARTIALLY COMPLIANT` | **Sedang** | Layout shell responsif, namun konten data tabel & form belum adaptif. |
| **3. Role-Aware Presentation** | `COMPLIANT` | **Rendah** | Menu dan halaman terfilter ketat oleh RBAC kanonikal. |
| **4. Role ≠ Device Separation** | `COMPLIANT` | **Rendah** | Tidak ada asumsi role mengunci device; otentikasi independen. |
| **5. Table Card Transformation** | `NON-COMPLIANT` | **Tinggi** | Seluruh tabel data operasional masih menggunakan horizontal scroll. |
| **6. Default Mobile Bottom Sheet**| `NON-COMPLIANT` | **Tinggi** | Form input mobile masih berupa centered modal yang terpotong keyboard. |
| **7. Touch Target (≥ 44px/48px)** | `NON-COMPLIANT` | **Kritis** | Input & tombol berukuran h-8 (32px), rawan salah sentuh di mobile. |
| **8. Authoritative Navigation** | `COMPLIANT` | **Nol** | `@/config/navigation.ts` berfungsi sebagai single source of truth. |
| **9. Design Token Architecture** | `COMPLIANT` | **Rendah** | Token OKLCH emerald/amber di `globals.css` telah menjadi acuan. |
| **10. Accessibility (a11y)** | `NEEDS STANDARDIZATION` | **Sedang** | Beberapa button/action baris tabel kekurangan `aria-label` eksplisit. |

---

## 4. P0–P4 PRIORITIZED FINDINGS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PRIORITY CLASSIFICATION MATRIX                        │
├──────────┬──────────────────────────────────────────────────────────────────┤
│ P0 (0)   │ BLOCKER: Tidak ada blocker arsitektur inti / navigasi.           │
│ P1 (5)   │ CRITICAL: Touch target sentuh, Table scroll mobile, Modal mobile │
│ P2 (8)   │ HIGH: Inkonsistensi form multi-step, Custom modal primitives    │
│ P3 (12)  │ MEDIUM: Standarisasi filter `<select>` native, Card layout tablet│
│ P4 (6)   │ LOW: Polish micro-animation, visual density tuning               │
└──────────┴──────────────────────────────────────────────────────────────────┘
```

### Rincian Temuan Prioritas:

#### 🔴 P1 — CRITICAL (Operasional Lapangan & Ergonomi Mobile)
1. **[P1-UI-01] Touch Target Primitives Failure**: `Button`, `Input`, dan `SelectTrigger` di `src/components/ui/*` menggunakan tinggi default `h-8` (32px). Gagal memenuhi standar sentuh 44px/48px WP-UI-001.  
   - *Affected*: Seluruh pengguna mobile (Musyrif, Guru, Wali, Satpam).
2. **[P1-UI-02] Santri & Pelanggaran Table Mobile Lock**: `SantriTable.tsx` dan `PelanggaranTable.tsx` memaksa tabel 10 kolom ke mobile via `overflow-x-auto`. Aksi baris tersembunyi jauh di kanan layar.  
   - *Affected*: Musyrif, Guru, Admin Kesiswaan pada smartphone.
3. **[P1-UI-03] Mobile Form Modal Truncation**: `CatatPelanggaranModal.tsx`, `CatatUKSModal.tsx`, dan `AddSantriModal.tsx` menggunakan modal fixed-center yang terpotong saat keyboard virtual muncul.  
   - *Affected*: Petugas input lapangan (Musyrif, Staff UKS).
4. **[P1-UI-04] Gate Checkpoint & Presensi Touch Spacing**: Tombol aksi scan out/in dan form keypad pada `src/app/dashboard/gate-checkpoint/page.tsx` memiliki padding sentuh di bawah 44px.  
   - *Affected*: Petugas Keamanan / Satpam Pos Gerbang.
5. **[P1-UI-05] Action Button Collision di Baris Tabel**: Tombol aksi inline (Edit, Selesai, Batalkan) pada `HukumanPage.tsx` dan `AlumniTable.tsx` berukuran 28px (`p-1.5`) dan berjarak terlalu rapat (< 8px).  
   - *Affected*: Seluruh pengguna smartphone.

#### 🟠 P2 — HIGH (Konsistensi Komponen & Pola Form)
1. **[P2-UI-01] Custom Modal Primitive Bypass**: `AddSantriModal.tsx` membuat backdrop dan wrapper modal sendiri alih-alih memakai `@/components/ui/dialog.tsx`.
2. **[P2-UI-02] Hardcoded Native `<select>` Filter**: Filter angkatan dan provinsi pada tabel santri/alumni memakai `<select>` HTML polos dengan style manual `SELECT_CLS`.
3. **[P2-UI-03] Formulir Multi-Kolom Desktop Pecah di Mobile**: Form pendaftaran kelas dan kurikulum tidak memiliki segmentasi stepper saat dibuka di resolusi sempit.
4. **[P2-UI-04] Wali Checkout Mobile Ergonomics**: Form pembayaran `WaliBundledCheckoutPage` memiliki checkbox dan tombol aksi yang belum dioptimalkan untuk jempol bawah (*thumb zone*).

#### 🟡 P3 — MEDIUM (Standardisasi & Polish)
1. **[P3-UI-01] Master Jenjang & Tingkat Responsive Table**: Tab struktur akademik belum memiliki tampilan responsif master-detail untuk tablet.
2. **[P3-UI-02] Inkonsistensi Warna Card Shell Layout**: Background app shell di `src/app/dashboard/layout.tsx` menggunakan `bg-sky-100/80` ad-hoc alih-alih token semantik `bg-background` / `bg-muted/30`.

---

## 5. FOUNDATION-FIRST DEPENDENCY GRAPH

Untuk menjamin keamanan eksekusi dan mencegah regresi pada 38 modul, urutan dependensi implementasi diatur secara hierarkis:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FOUNDATION-FIRST DEPENDENCY GRAPH                    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 ┌───────────────────▼───────────────────┐
                 │  LAYER 0: DESIGN TOKENS & UTILITIES   │
                 │  (globals.css, Tailwind Touch Tokens) │
                 └───────────────────┬───────────────────┘
                                     │
                 ┌───────────────────▼───────────────────┐
                 │  LAYER 1: SHARED UI PRIMITIVES        │
                 │  (Button, Input, Select, Sheet,       │
                 │   Dialog, Responsive Table Primitive) │
                 └───────────────────┬───────────────────┘
                                     │
                 ┌───────────────────▼───────────────────┐
                 │  LAYER 2: SHARED DOMAIN PATTERNS      │
                 │  (ResponsiveDataGrid, MobileCardStack,│
                 │   AdaptiveDrawer, StickyActionBar)    │
                 └───────────────────┬───────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐        ┌──────────────────┐
│ LAYER 3A:        │       │ LAYER 3B:        │        │ LAYER 3C:        │
│ MOBILE CRITICAL  │       │ ACADEMIC & ADMIN │        │ FINANCIAL & SAAS │
│ OPERATIONS       │       │ WORKSPACES       │        │ WORKSPACES       │
│ (Santri, E-Tatib,│       │ (Madrasah, Kelas,│        │ (SPP, Kantin POS,│
│  UKS, Gate Pass) │       │  Mapel, Raport)  │        │  SaaS Console)   │
└────────┬─────────┘       └────────┬─────────┘        └────────┬─────────┘
         │                          │                           │
         └──────────────────────────┼───────────────────────────┘
                                    │
                 ┌──────────────────▼───────────────────┐
                 │  LAYER 4: ACCESSIBILITY & AUDIT LOCK │
                 │  (WCAG 2.1 AA, Performance Hardening)│
                 └──────────────────────────────────────┘
```

---

## 6. MOBILE CRITICAL FLOW ANALYSIS

Mengidentifikasi alur kerja berfrekuensi tinggi (*high-frequency operational tasks*) yang menjadi fokus utama transformasi mobile:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MOBILE CRITICAL OPERATIONAL MATRIX                       │
├─────────────────┬──────────────────────────┬────────────────────────────────┤
│ PERAN PENGGUNA  │ ALUR KERJA OPERASIONAL   │ TARGET TRANSFORMASI MOBILE     │
├─────────────────┼──────────────────────────┼────────────────────────────────┤
│ Musyrif/Pembina │ Pencatatan E-Tatib/Poin  │ Bottom Sheet Quick Input       │
│                 │ Presensi Kamar & Asrama  │ Toggle Card Stack              │
│                 │ Approval Quest Santri    │ Single-tap Card Action         │
├─────────────────┼──────────────────────────┼────────────────────────────────┤
│ Guru / Pengajar │ Presensi Kelas Harian    │ Fast Attendance List           │
│                 │ Input Nilai Harian       │ Numeric Keypad Direct Input    │
│                 │ Catat Pelanggaran Kelas  │ 2-Tap Contextual Report        │
├─────────────────┼──────────────────────────┼────────────────────────────────┤
│ Wali Santri     │ Cek Pelanggaran & Poin   │ Visual Progress Card & Alert   │
│                 │ Pembayaran SPP & Top-Up  │ Single-Screen Sticky Checkout  │
│                 │ Izin Kepulangan / Sakit  │ Simple Mobile Request Form     │
├─────────────────┼──────────────────────────┼────────────────────────────────┤
│ Satpam / Gate   │ Scan RFID Masuk/Keluar   │ Big Touch Target Gate Terminal │
│                 │ Validasi Keterlambatan   │ Instant Visual Audio Feedback  │
├─────────────────┼──────────────────────────┼────────────────────────────────┤
│ Petugas UKS     │ Catat Kunjungan Sakit    │ Fast Symptom Picker Sheet      │
│                 │ Terbitkan Izin Berobat   │ Quick Action Dispatcher        │
└─────────────────┴──────────────────────────┴────────────────────────────────┘
```

---

## 7. TABLE TRANSFORMATION ROADMAP

Audit terhadap seluruh tabel data di repositori untuk menentukan strategi representasi data yang tepat:

| Nama Modul / Tabel | Lokasi Berkas | Kategori Transformasi | Strategi Presentasi Mobile (< 640px) |
| :--- | :--- | :--- | :--- |
| **Daftar Santri** | `src/components/santri/SantriTable.tsx` | **Card Transformation** | Kartu Santri: Foto/Inisial, Nama, NIS, Status SP Badge, Bar Poin, Tombol Expand. |
| **Alumni** | `src/components/santri/AlumniTable.tsx` | **Card Transformation** | Kartu Alumni: Nama, Tahun Lulus, Status, Kontak. |
| **Pelanggaran E-Tatib**| `src/components/pelanggaran/PelanggaranTable.tsx` | **Card Transformation** | Kartu Insiden: Badge Severity, Nama Santri, Pasal, Tanggal, Poin Merah. |
| **Hukuman Disiplin** | `src/app/dashboard/hukuman/page.tsx` | **Card Transformation** | Kartu Hukuman: Nama, Jenis Sanksi, Durasi Tanggal, Tombol Selesai (48px). |
| **Daftar Guru** | `src/app/dashboard/guru/page.tsx` | **Card Transformation** | Kartu Guru: Nama, NIP, Ranah Instansi, Kontak WhatsApp. |
| **Kunjungan UKS** | `src/app/dashboard/uks/page.tsx` | **Card Transformation** | Kartu Medis: Nama, Keluhan, Status Observasi, Jam Masuk. |
| **Log Presensi Gate** | `src/app/dashboard/gate-checkpoint/log/page.tsx` | **Card Transformation** | Kartu Log Gerbang: Status Izin, Jam Riil, Keterlambatan Badge. |
| **Distribusi Guru** | `src/components/distribusi/DistribusiMatrix.tsx` | **Responsive Matrix** | Compact Grid dengan Toggle Segmentasi per Tingkat/Kelas. |
| **Raport Ledger** | `src/components/akademik/PrintReportCardPDF.tsx` | **Wide Table Exception** | Matriks Nilai Kementerian: Dipertahankan format lebar terstandarisasi. |
| **SaaS Tenant Console**| `src/app/dashboard/saas/tenants/page.tsx` | **Compact Data Grid** | Desktop-Heavy: Card Stack di Mobile, Full Data Grid di Desktop. |

---

## 8. FORM, MODAL & SHEET ROADMAP

Transformasi formulir dan dialog mengikuti aturan baku **WP-UI-001**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      FORM & MODAL MIGRATION STRATEGY                        │
├──────────────────────────┬────────────────────┬─────────────────────────────┤
│ KOMPONEN FORM / MODAL    │ TIPE PRESENTASI    │ TRANSFORMASI MOBILE         │
├──────────────────────────┼────────────────────┼─────────────────────────────┤
│ Catat Pelanggaran Modal  │ Contextual Form    │ Slide-Up Bottom Sheet (90vh)│
│ Catat Kunjungan UKS      │ Contextual Form    │ Slide-Up Bottom Sheet       │
│ Izin Berobat Modal       │ Contextual Form    │ Slide-Up Bottom Sheet       │
│ Tambah Santri Modal      │ Multi-Step Form    │ Full-Screen Mobile Stepper  │
│ Tambah Kelas / Mapel     │ Compact Form       │ Slide-Up Bottom Sheet       │
│ Konfirmasi Hukuman       │ Destructive Dialog │ Centered Compact Alert Modal│
│ Bundled SPP Checkout     │ Financial Flow     │ Sticky Bottom Action Page   │
└──────────────────────────┴────────────────────┴─────────────────────────────┘
```

---

## 9. ROLE-AWARE UI AUDIT

1. **Pemisahan Otoritas vs Presentasi (*Authority vs Presentation*)**:
   - RBAC (`@/config/permissions.ts`) adalah otoritas mutlak penentu ketersediaan aksi. Lapisan UI dilarang membuat hak akses buatan (*synthetic permissions*) berdasarkan ukuran viewport.
2. **Demo Role-Switcher Sanitation**:
   - Menu `Switch Role (Demo)` pada `src/components/layout/topbar.tsx` diaudit dan dipastikan hanya aktif pada mode pengujian lokal, wajib dinonaktifkan secara otomatis pada mode produksi tenant.
3. **Penyelarasan Label Kontekstual**:
   - Label dinamis (seperti *Anak Saya*, *Santri Bimbingan*, *Profil Saya*) dikelola melalui helper kanonikal `applyDynamicTitle` di navigasi tanpa menduplikasi komponen tampilan.

---

## 10. ACCESSIBILITY & PERFORMANCE AUDIT

### Audit Aksesibilitas (WCAG 2.1 AA):
- **Touch Target Deficit**: Primitif tombol (32px) wajib ditingkatkan ke area sentuh 44px/48px pada perangkat mobile menggunakan utilitas sentuh (`min-h-[44px]` / `touch-manipulation`).
- **Aria Labels on Table Actions**: Icon button aksi di tabel wajib memiliki `aria-label` deskriptif (misal: `aria-label="Tandai Hukuman Ahmad Selesai"`).
- **Focus Ring Standard**: Outline fokus (`focus-visible:ring-2 focus-visible:ring-primary`) wajib konsisten pada seluruh kontrol kustom.

### Audit Performa:
- **Client Component Boundary**: Banyak halaman membungkus seluruh konten dalam `'use client'` karena pemanggilan hook real-time. Perlu pemisahan arsitektur antara Server Shell dan Client Interactive Islands.
- **Dynamic Import Charts**: Visualisasi Recharts pada dashboard (`src/components/shared/charts.tsx`) wajib dimuat secara lazy (*next/dynamic*) pada mobile untuk mereduksi First Input Delay (FID/INP).

---

## 11. DOMAIN DEPENDENCY & BLOCKED ITEMS

Sesuai arahan tata kelola, pengerjaan UI **dilarang mencampuri atau membypass migrasi backend/domain**. Modul UI berikut ditandai sebagai **BLOCKED BY DOMAIN DEPENDENCY**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DOMAIN-BLOCKED UI MODULE REGISTRY                        │
├─────────────────────┬──────────────────┬────────────────────────────────────┤
│ MODUL UI            │ DEPENDENCY DOMAIN│ SYARAT UNBLOCK SEBELUM UI REFACTOR │
├─────────────────────┼──────────────────┼────────────────────────────────────┤
│ Master Pelanggaran  │ WP-310 & WP-311  │ Schema Drizzle & Service Master    │
│ Management UI       │ (Kesiswaan Master│ Kesiswaan (Institusi & Severity    │
│                     │  Architecture)   │ Level) selesai dimigrasi 100%.     │
├─────────────────────┼──────────────────┼────────────────────────────────────┤
│ Sidang Disiplin &   │ WP-320 & WP-321  │ Workflow Event Bus Insiden & Kasus │
│ Eskalasi Kasus UI   │ (Discipline Case │ Governance tersambung stabil ke DB.│
│                     │  Workflow Engine)│                                    │
├─────────────────────┼──────────────────┼────────────────────────────────────┤
│ POS Kantin Cashless │ Core Wallet &    │ Mutasi saldo RFID multi-kantin dan │
│ RFID Terminal UI    │ Ledger Service   │ API settlement offline-first siap. │
└─────────────────────┴──────────────────┴────────────────────────────────────┘
```

---

## 12. RECOMMENDED IMPLEMENTATION ROADMAP

Peta jalan implementasi disusun dalam 9 fase berurutan yang aman dari risiko regresi:

```
PHASE A: Foundation & Shared Primitives Touch Hardening (WP-UI-010)
   ↓
PHASE B: Shared Responsive Data Presentation Components (WP-UI-020)
   ↓
PHASE C: Mobile Critical Operational Workflows (WP-UI-030)
   ↓
PHASE D: Table & Data Presentation Modernization (WP-UI-040)
   ↓
PHASE E: Form, Modal & Bottom Sheet Standardization (WP-UI-050)
   ↓
PHASE F: Role-Aware & Multi-Tenant Workspace Validation (WP-UI-060)
   ↓
PHASE G: Desktop High-Density & Analytics Optimization (WP-UI-070)
   ↓
PHASE H: Accessibility (WCAG 2.1 AA) & Performance Hardening (WP-UI-080)
   ↓
PHASE I: Final WP-UI-001 Compliance Audit & Certification (WP-UI-090)
```

---

## 13. FUTURE UI WORK PACKAGE BREAKDOWN

### 1. `WP-UI-010` — Responsive Foundation & Touch Primitives Hardening
- **Tujuan**: Memperbarui komponen primitif UI agar mendukung ergonomi sentuh mobile 44px/48px tanpa merusak densitas desktop.
- **Berkas Terdampak**: `src/components/ui/button.tsx`, `input.tsx`, `select.tsx`, `dialog.tsx`, `sheet.tsx`, `src/app/globals.css`.
- **Risiko**: `MEDIUM` (Shared primitive blast radius).
- **Backend Prohibited**: ✅ YA (Murni UI/CSS).

### 2. `WP-UI-020` — Shared Responsive Data Presentation Primitives
- **Tujuan**: Membuat komponen pola bersama `ResponsiveDataGrid` dan `MobileCardStack` sebagai standar konversi tabel-ke-kartu.
- **Berkas Terdampak**: `src/components/shared/*`, `src/components/ui/table.tsx`.
- **Risiko**: `LOW` (Penambahan komponen baru tanpa merusak eksisting).
- **Backend Prohibited**: ✅ YA.

### 3. `WP-UI-030` — Mobile Critical Operations (Kesiswaan, UKS, Gate Pass)
- **Tujuan**: Mengonversi alur pencatatan mobile santri, pelanggaran, UKS, dan gate presensi ke pola bottom sheet dan card stack.
- **Berkas Terdampak**: `src/components/santri/*`, `src/components/pelanggaran/*`, `src/components/uks/*`, `src/app/dashboard/gate-checkpoint/*`.
- **Risiko**: `HIGH` (Modul operasional aktif).
- **Backend Prohibited**: ✅ YA (Mengonsumsi service DB eksisting).

### 4. `WP-UI-040` — Enterprise Data Table Modernization
- **Tujuan**: Mengganti raw `overflow-x-auto` pada halaman data sekunder (Alumni, Hukuman, Guru, Log).
- **Berkas Terdampak**: `src/app/dashboard/hukuman/page.tsx`, `guru/page.tsx`, `santri/AlumniTable.tsx`.
- **Risiko**: `MEDIUM`.
- **Backend Prohibited**: ✅ YA.

### 5. `WP-UI-050` — Form & Dialog Standardization
- **Tujuan**: Menstandarkan modal desktop dan drawer mobile pada form konfigurasi kelas, mapel, dan asrama.
- **Berkas Terdampak**: `src/components/kelas/*`, `src/components/mapel/*`, `src/components/asrama/*`.
- **Risiko**: `MEDIUM`.
- **Backend Prohibited**: ✅ YA.

### 6. `WP-UI-060` — Role-Aware Workspace Presentation
- **Tujuan**: Memvalidasi tampilan personalisasi per-role (Wali Santri, Wali Kelas, Guru, Musyrif).
- **Berkas Terdampak**: `src/app/wali/*`, `src/app/dashboard/page.tsx`.
- **Risiko**: `LOW`.
- **Backend Prohibited**: ✅ YA.

### 7. `WP-UI-070` — Desktop High-Density & Analytics Optimization
- **Tujuan**: Mengoptimalkan dashboard desktop, multi-column sorting, dan dossier santri 360.
- **Berkas Terdampak**: `src/app/dashboard/page.tsx`, `src/components/shared/analytics-card.tsx`.
- **Risiko**: `LOW`.
- **Backend Prohibited**: ✅ YA.

### 8. `WP-UI-080` — Accessibility (a11y) & Core Web Vitals Hardening
- **Tujuan**: Penyelarasan aria-attributes, keyboard traps, dan lazy-loading chart bundle.
- **Berkas Terdampak**: Seluruh shared components & bundle dynamic imports.
- **Risiko**: `LOW`.
- **Backend Prohibited**: ✅ YA.

### 9. `WP-UI-090` — Final WP-UI-001 Compliance Certification
- **Tujuan**: Audit komprehensif 100% kepatuhan terhadap seluruh pasal WP-UI-001 v1.1.
- **Berkas Terdampak**: Dokumentasi audit final.
- **Risiko**: `NOL` (Dokumentasi & Verifikasi).

---

## 14. RISK MATRIX

| Work Package | Blast Radius | Kompleksitas UI | Ketergantungan Backend | Tingkat Risiko | Mitigasi Wajib |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WP-UI-010** | **Global** (Seluruh UI) | Sedang | Nol | `MEDIUM` | Uji visual snapshot pada tombol/input di semua halaman |
| **WP-UI-020** | Rendah (Isolated) | Sedang | Nol | `LOW` | Unit test render pada resolusi 360px dan 1280px |
| **WP-UI-030** | Tinggi (Core Kesiswaan)| Tinggi | Read-Only Service | `HIGH` | Verifikasi integrasi data real-time santri/pelanggaran |
| **WP-UI-040** | Sedang | Sedang | Read-Only Service | `MEDIUM` | Pastikan sorting/filtering client-side tetap identik |
| **WP-UI-050** | Sedang | Sedang | Read-Only Service | `MEDIUM` | Validasi scroll form saat keyboard virtual mobile aktif |
| **WP-UI-060** | Rendah | Rendah | Otoritas RBAC | `LOW` | Validasi hak akses menu menggunakan matriks RBAC |
| **WP-UI-070** | Rendah | Sedang | Nol | `LOW` | Verifikasi responsif grid pada layar 1080p dan 2K |
| **WP-UI-080** | Global | Rendah | Nol | `LOW` | Audit otomatis menggunakan Axe/Lighthouse a11y |

---

## 15. ACCEPTANCE GATES (QUALITY GATES)

Setiap implementasi work package di masa depan wajib lolos 10 gerbang kualitas (*Quality Gates*) sebelum di-merge:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MANDATORY UI/UX ACCEPTANCE GATES                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ [ ] 1. TypeScript Strict Verification: 0 type errors (`tsc --noEmit`).      │
│ [ ] 2. Existing Test Suite: 100% pass (`npm run test:run`).                 │
│ [ ] 3. Clean Build Verification: Next.js build sukses (`npm run build`).    │
│ [ ] 4. Zero Business Logic Regression: Skema Drizzle & API utuh.           │
│ [ ] 5. Mobile Usability Verification: Diuji pada viewport 360px–430px.      │
│ [ ] 6. Touch Ergonomics Gate: Target sentuh interaktif ≥ 44px/48px.         │
│ [ ] 7. Desktop Density Gate: Tampilan layar lebar (≥ 1024px) tidak rusak.   │
│ [ ] 8. Role-Aware Verification: Hak akses menu & data patuh RBAC kanonikal. │
│ [ ] 9. Accessibility Check: Kontras warna lolos WCAG 2.1 AA & aria valid.   │
│ [ ] 10. Design Token Purity: 100% memakai token resmi di `globals.css`.     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 16. RECOMMENDED FIRST IMPLEMENTATION WORK PACKAGE

Direkomendasikan secara arsitektural untuk memulai implementasi pada:

### 👉 `WP-UI-010: Responsive Foundation & Touch Primitives Hardening`

**Alasan Arsitektural (*Architectural Rationale*)**:
1. Merupakan akar dependensi (*root dependency*) dari seluruh 38 modul aplikasi.
2. Memperbaiki masalah kritis ergonomi sentuh sentral (P1) pada `Button`, `Input`, dan `Select` tanpa menyentuh halaman bisnis.
3. Memberikan dampak langsung pada kenyamanan pengguna mobile secara menyeluruh sebelum transformasi tabel/form spesifik dimulai.

---

## 17. EXPLICIT "NOT IMPLEMENTED" DECLARATION

Sesuai mandat tata kelola perencanaan **WP-UI-002**:
- Tidak ada baris kode runtime aplikasi yang diubah.
- Tidak ada berkas CSS atau Tailwind yang dimodifikasi.
- Tidak ada schema database, migrasi, atau API yang disentuh.
- Seluruh temuan dan peta jalan berstatus rencana arsitektur yang menunggu persetujuan Product Owner.

---

```
============================================================
STATUS PERENCANAAN WP-UI-002:
WP-UI-002 PLANNING COMPLETE
IMPLEMENTATION NOT STARTED

RUNTIME CODE MODIFIED: 0
DATABASE MODIFIED: 0
MIGRATION CREATED: 0
PACKAGE DEPENDENCIES MODIFIED: 0
GIT COMMIT: 0
GIT PUSH: 0
============================================================
```
