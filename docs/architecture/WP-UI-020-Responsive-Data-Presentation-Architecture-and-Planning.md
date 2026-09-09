# WP-UI-020 — RESPONSIVE DATA PRESENTATION ARCHITECTURE & PLANNING AUDIT

**Work Package ID:** `WP-UI-020`  
**Document Status:** `PLANNING COMPLETE — AWAITING PRODUCT OWNER REVIEW`  
**Execution Status:** `READ-ONLY ARCHITECTURE PLANNING ONLY — NO CODE EXECUTION`  
**Authoritative Governance:** WP-UI-001 v1.1, WP-UI-002, WP-UI-003 v1.1, WP-UI-010 Final Certification Gate  

---

## 1. EXECUTIVE SUMMARY

Dokumen ini menyajikan rencana arsitektur komprehensif **WP-UI-020 (Responsive Data Presentation Architecture & Planning)** untuk sistem Ma'had Manager Enterprise Education ERP.

Setelah keberhasilan pembentukan fondasi responsif primitif pada **WP-UI-010** (Density, Overlays, Button, Input, Select, dan App Shell), fokus utama **WP-UI-020** adalah memodernisasi cara data berukuran besar (*data-heavy UI*) dipresentasikan secara adaptif di seluruh perangkat:
- **Mobile (< 640px):** Task-optimized Data Presentation (Mobile Card Stack, Compact List, Contextual Filter Bottom Sheet).
- **Tablet (640px - 1024px):** Adaptive Hybrid Presentation (Responsive Column Reduction, Split View).
- **Desktop (≥ 1024px):** Enterprise Data Table dengan kepadatan informasi tinggi (*Enterprise-Dense*).

### Prinsip Utama WP-UI-020:
1. **Mobile-First ≠ Mobile-Only:** Tampilan mobile harus dioptimalkan untuk produktivitas smartphone tanpa mengorbankan kepadatan informasi enterprise di desktop.
2. **Responsive ≠ Sekadar Mengecilkan Tabel:** Tidak semua tabel desktop dipaksa menjadi tabel sempit dengan horizontal scroll horizontal di mobile, dan tidak semua data mobile dipaksa menjadi kartu (card). Pola ditentukan oleh konteks tugas (*user task*), peran (*user role*), dan densitas data.
3. **Zero Business Logic & Zero Database Changes:** Seluruh transformasi murni berada pada layer presentasi UI/UX.

---

## 2. SCOPE OF AUDIT & PLANNING

### In Scope:
- Audit forensik terhadap seluruh 38 modul dashboard admin/operator/guru/musyrif dan 2 portal wali santri.
- Pemetaan pola presentasi data: `Responsive Data Table`, `Mobile Card Stack`, `Compact List`, dan `Hybrid / Adaptive View`.
- Perancangan primitif bersama (*Shared Responsive Data Primitives*): `ResponsiveDataGrid`, `MobileCardStack`, `DataViewToggle`, `ResponsiveFilterBar`, `MobileFilterSheet`, `ResponsivePagination`, dan `MobileRowActions`.
- Penyelarasan dengan sistem density terpusat WP-UI-010A (`mahad-ui-density`).
- Penyelarasan dengan guardrail target sentuh 44px WP-UI-010C-1.
- Pembagian sub-paket eksekusi terstruktur (`WP-UI-020A` s.d `WP-UI-020E`).

### Out of Scope:
- Modifikasi kode runtime aplikasi, komponen UI, CSS, atau route halaman pada fase ini.
- Instalasi dependensi npm baru atau library animasi GSAP.
- Modifikasi skema database (PostgreSQL/Supabase/Drizzle), API routes, atau logic RBAC.

---

## 3. CANONICAL GOVERNANCE REFERENCES

Seluruh perencanaan WP-UI-020 tunduk secara mutlak pada dokumen kanonikal berikut:
1. **WP-UI-001 v1.1 (UI/UX Governance Baseline):** Standardisasi palet warna, tipografi, whitespace, dan aksesibilitas.
2. **WP-UI-002 (UI/UX Implementation Roadmap):** Urutan prioritas rilis sistem antarmuka.
3. **WP-UI-003 v1.1 (Motion & Animation Architecture):** Pembatasan Motion Budget, reduced-motion, dan pengisolasian GSAP.
4. **WP-UI-010 Final Certification Gate:** Fondasi responsif primitif, overlay modal/sheet, dan app shell dengan unit `dvh` serta safe-area insets.

---

## 4. REPOSITORY FORENSIC FINDINGS

Berdasarkan audit ripgrep dan struktur direktori repository:
- Terdapat **34 komponen tabel dan list data** utama yang tersebar di modul Kesiswaan, Akademik, Keuangan, UKS, Governance, dan SaaS Administration.
- Sebagian besar komponen tabel saat ini (`SantriTable.tsx`, `PelanggaranTable.tsx`, `AlumniTable.tsx`, `DistribusiMatrix.tsx`) menggunakan tag HTML `<table>` statis yang menyebabkan pergeseran horizontal (*horizontal overflow*) dan pemotongan kolom pada layar ponsel di bawah 640px.
- Komponen aksi baris (*row actions*) pada tabel saat ini umumnya menempatkan 3 s.d 5 tombol ikon sejajar dengan gap rapat (< 6px), yang berisiko memicu kesalahan klik (*pointer collision*) di mobile.

---

## 5. COMPLETE DATA PRESENTATION INVENTORY

Berikut adalah inventarisasi lengkap seluruh layar presentasi data utama di dalam repository:

| ID | Nama Layar / Komponen | File Path Utama | Tipe Presentasi Eksisting | Masalah Layout Mobile Current |
| :--- | :--- | :--- | :--- | :--- |
| **DS-01** | Direktori Santri | `src/components/santri/SantriTable.tsx` | HTML Table (8+ kolom) | Horizontal overflow, tombol aksi rapat |
| **DS-02** | Pelanggaran Santri | `src/components/pelanggaran/PelanggaranTable.tsx` | HTML Table (7 kolom) | Teks terpotong, filter bar memakan ruang |
| **DS-03** | Presensi Operasional | `src/app/dashboard/operasional/page.tsx` | HTML Rows | Tidak ramah sentuhan satu tangan |
| **DS-04** | UKS & Izin Berobat | `src/app/dashboard/uks/page.tsx` | HTML Table / List | Kartu rapat, tombol aksi bertumpuk |
| **DS-05** | Penilaian & Raport | `src/app/dashboard/penilaian/page.tsx` | Matrix Table | Grid angka terlalu lebar di mobile |
| **DS-06** | Distribusi Guru & Mapel | `src/components/distribusi/DistribusiMatrix.tsx` | Matrix Table | Sel matriks sempit di ponsel |
| **DS-07** | Master Pelanggaran & Hukuman | `src/components/master-pelanggaran/*` | Tabbed HTML Table | Tab overflow & baris data rapat |
| **DS-08** | Manajemen User & Role | `src/app/dashboard/pengaturan/manajemen-user-role` | HTML Table | Badge role menumpuk di mobile |
| **DS-09** | Portal Wali PPOB & Tagihan | `src/app/wali/ppob/page.tsx` | Card Grid | Padding terlalu besar di layar 320px |
| **DS-10** | SaaS Tenants & Billing | `src/app/dashboard/saas/tenants/page.tsx` | HTML Table | Tabel lebar tanpa penyesuaian mobile |

---

## 6. ROLE → PAGE → DEVICE MATRIX

| Peran Pengguna (*User Role*) | Layar Utama yang Dipergunakan | Perangkat Utama | Frekuensi Mobile | Ekspektasi UX Presentasi Data |
| :--- | :--- | :--- | :--- | :--- |
| **Wali Santri** | Portal Tagihan, PPOB, Notifikasi | Smartphone (iOS/Android) | **100% Mobile** | Card Stack ringkas, tombol bayar besar (≥44px), tanpa tabel rumit. |
| **Musyrif / Pengasuh** | Presensi Operasional, Catat Pelanggaran, UKS | Smartphone | **90% Mobile** | Quick Action Cards, input cepat satu tangan, filter bottom-sheet. |
| **Guru / Wali Kelas** | Penilaian, Raport, Presensi Kelas | Tablet / Laptop / Mobile | **60% Mobile** | Hybrid Grid: Card di mobile untuk absensi, Table di tablet/desktop untuk nilai. |
| **Operator / Kesiswaan** | Data Santri, Master Pelanggaran, Hukuman | Laptop / Desktop | **30% Mobile** | Enterprise Data Table dengan pencarian cepat & penyesuaian kolom mobile. |
| **Super Admin / SaaS Dev** | Console Tenants, Log Audit, System Config | Desktop / Laptop | **10% Mobile** | Enterprise Dense Data Table dengan filter multi-kolom dan pagination cepat. |

---

## 7. MOBILE USAGE PRIORITY MATRIX

Halaman diklasifikasikan berdasarkan prioritas kebutuhan optimasi mobile:

```
+-----------------------------------------------------------------------+
| P0 — CRITICAL MOBILE OPERATIONAL (Harus Sangat Ramah Smartphone)     |
| 1. Presensi Operasional Santri (/dashboard/operasional)               |
| 2. Pencatatan Pelanggaran (/dashboard/pelanggaran)                    |
| 3. Portal Wali Santri & Tagihan (/wali/*)                            |
| 4. UKS & Izin Berobat (/dashboard/uks)                                |
+-----------------------------------------------------------------------+
| P1 — HIGH MOBILE USAGE (Penting untuk Akses Ponsel & Tablet)          |
| 5. Direktori Santri (/dashboard/santri)                               |
| 6. Notifikasi & Pengumuman (/dashboard/notifikasi)                    |
| 7. Kalender Kegiatan & Akademik (/dashboard/kalender-akademik)        |
+-----------------------------------------------------------------------+
| P2 — IMPORTANT ADMINISTRATIVE (Akses Seimbang Mobile & Desktop)       |
| 8. Penilaian & Raport (/dashboard/penilaian, /dashboard/raport)       |
| 9. Master Pelanggaran & Hukuman (/dashboard/master-pelanggaran)       |
| 10. Distribusi Guru & Mapel (/dashboard/distribusi-guru)              |
+-----------------------------------------------------------------------+
| P3 — DESKTOP-HEAVY / SAAS ADMIN (Prioritas Kepadatan Desktop)          |
| 11. Manajemen User & Role (/dashboard/pengaturan/manajemen-user-role) |
| 12. SaaS Tenant Console & Billing (/dashboard/saas/*)                 |
| 13. Audit Log & System Config (/dashboard/audit-log)                  |
+-----------------------------------------------------------------------+
```

---

## 8. TABLE AUDIT & STRATEGY

### Masalah Utama Tabel Saat Ini:
1. **Column Overcrowding:** Tabel seperti `SantriTable` menampilkan 8 kolom sekaligus (NIS, Nama, Gender, Asrama, Kelas, Status, Action, KTA) pada layar 360px, memicu scroll horizontal yang tidak nyaman.
2. **Fixed Padding:** Padding sel tabel bersifat statis sehingga membuang whitespace di mobile atau terlalu rapat di desktop.

### Rekomendasi Strategi Tabel Mobile:

| Komponen Tabel | Strategi Mobile (< 640px) | Strategi Desktop (≥ 1024px) | Rationale |
| :--- | :--- | :--- | :--- |
| `SantriTable.tsx` | **Mobile Card Stack** (Entity Card dengan foto, NIS, kelas, dan status badge) | **Enterprise Data Table** (Semua kolom aktif dengan sorting & multi-select) | Pengguna mobile mencari santri berdasarkan nama/kelas, bukan membandingkan matriks kolom. |
| `PelanggaranTable.tsx` | **Compact Item List** (Nama santri, poin pelanggaran, tanggal, dan tombol aksi "Detail") | **Enterprise Data Table** (Tabel lengkap dengan nama pelanggar, pasal, & poin) | Musyrif di lapangan membutuhkan proses pencatatan yang cepat dan ringkas. |
| `DistribusiMatrix.tsx` | **Adaptive Accordion List** (Daftar mata pelajaran yang dikelompokkan per guru) | **2D Matrix Grid** (Matriks guru vs jam pelajaran) | Matriks 2D tidak mungkin muat di layar 390px tanpa merusak keterbacaan. |
| `UserRoleTable.tsx` | **Responsive Column Reduction** (Tampilkan Nama & Badge Role utama; sembunyikan Email/Created) | **Enterprise Data Table** (Tabel lengkap) | Admin tetap mendapatkan gambaran umum user di mobile tanpa scroll horizontal. |

---

## 9. CARD & LIST PRESENTATION AUDIT

### Prinsip Desain Mobile Card Stack:
- **Header Card:** Nama Entitas / Judul Utama (font bold `text-sm` / `text-base`) + Status Badge di pojok kanan atas.
- **Body Card:** 2 s.d 4 pasangan *Label: Value* sekunder yang relevan (misal: Asrama, Kelas, Poin).
- **Footer Card:** Tombol Aksi Utama (misal: "Lihat Detail", "Edit") dengan target sentuh minimal **44px × 44px**.

---

## 10. FILTER & SEARCH MOBILE STRATEGY

### Masalah Saat Ini:
Filter bar saat ini menempatkan 3-5 dropdown `Select` dan 1 `Input` pencarian dalam 1 baris horizontal flex, yang pecah dan menumpuk hingga 5 baris di mobile.

### Rekomendasi Strategi WP-UI-020:
- **Desktop (≥ 1024px):** Multi-column Inline Filter Bar (Search + Dropdown Filter sejajar).
- **Mobile (< 640px):** 
  1. Baris Utama: `Input` Pencarian Teks (Full Width) + 1 Tombol Toggle `Filter` (dengan badge angka filter aktif, contoh: "Filter (2)").
  2. Saat tombol `Filter` diklik: Membuka **Mobile Filter Sheet** (Bottom Sheet dari WP-UI-010B) yang berisi seluruh opsi dropdown `Select` dengan tombol "Terapkan Filter" dan "Reset".
  3. Menampilkan **Active Filter Chips** di bawah bar pencarian untuk penghapusan filter cepat.

---

## 11. ROW ACTION STRATEGY & TOUCH TARGET SAFETY

### Klasifikasi Aksi Baris:
1. **Primary Action:** Aksi utama (contoh: "Lihat Detail" / "Edit"). Menjadi tombol utama yang terlihat.
2. **Secondary Actions:** Aksi pendukung (contoh: "Cetak KTA", "Export PDF").
3. **Destructive Action:** Aksi berbahaya (contoh: "Hapus", "Nonaktifkan"). Harus diberi warna merah `destructive` dan konfirmasi dialog modal.

### Aturan Aksi Mobile:
- Jika jumlah aksi baris **> 2**, mobile view wajib menyembunyikan aksi sekunder di dalam **More Action Menu** (`DropdownMenu` / `BottomSheet`).
- Menjamin jarak antar tombol aksi minimal `12px` (`gap-3`) sesuai guardrail WP-UI-010C-1 untuk mencegah *pointer collision*.

---

## 12. BULK ACTION STRATEGY

- **Desktop:** Selection checkbox pada header tabel + Contextual Action Bar di atas tabel saat 1 atau lebih baris dipilih.
- **Mobile:** 
  1. Mode Seleksi diaktifkan melalui tombol toggle "Pilih Beberapa".
  2. Saat aktif: Muncul **Sticky Bottom Action Bar** melayang di atas safe-area inset ponsel yang menampilkan jumlah item terpilih dan tombol aksi masal (contoh: "Hapus Terpilih", "Export Terpilih").

---

## 13. PAGINATION STRATEGY

- **Desktop:** Full Pagination (`Previous`, Nomor Halaman 1 2 3 ... 10, `Next`, Select Rows-Per-Page).
- **Mobile:** Compact Pagination (`Previous` [Icon], `Halaman X dari Y`, `Next` [Icon]) atau `Load More` button untuk daftar kartu.
- Menjaga logika pagination semantik tetap 100% konsisten antara mobile dan desktop.

---

## 14. MASTER-DETAIL VIEW STRATEGY

- **Desktop:** Split-pane View (Daftar di sebelah kiri 35%, Detail di sebelah kanan 65%).
- **Mobile:** Single-pane Navigation (Daftar penuh di mobile -> Mengetuk kartu membuka **Detail Drawer / Full-Height Sheet** dari WP-UI-010B).

---

## 15. RESPONSIVE PATTERN DECISION MATRIX

| Halaman Dashboard | Pattern Mobile (< 640px) | Pattern Tablet (640-1024px) | Pattern Desktop (≥ 1024px) | Rationale UX |
| :--- | :--- | :--- | :--- | :--- |
| `/dashboard/santri` | Mobile Card Stack | Adaptive Table | Enterprise Data Table | Profil santri butuh visual ringkas di mobile |
| `/dashboard/pelanggaran` | Compact Item List | Compact Table | Enterprise Data Table | Kecepatan pencatatan di lapangan |
| `/dashboard/operasional` | Mobile Action Cards | Adaptive Grid | Enterprise Data Grid | Kemudahan centang absensi di ponsel |
| `/dashboard/uks` | Mobile Card Stack | Compact Table | Enterprise Data Table | Informasi pasien santri jelas & fokus |
| `/dashboard/penilaian` | Adaptive Row List | Matrix Table | Full Matrix Data Grid | Penginputan nilai memerlukan kerapatan sel |
| `/dashboard/saas/tenants` | Responsive Table (Column Reduced) | Enterprise Table | Enterprise Data Table | Penggunaan mayoritas oleh admin di desktop |

---

## 16. PROPOSED SHARED PRIMITIVES ARCHITECTURE

Untuk menghindari duplikasi kode pada fase implementasi mendatang, direncanakan 6 primitif responsif terisolasi di `src/components/ui/responsive-data/`:

1. **`ResponsiveDataGrid.tsx`:** Container serbaguna yang me-render Data Table di desktop dan otomatis berpindah ke Card Stack di mobile berdasarkan prop `renderCard`.
2. **`MobileCardStack.tsx`:** Component pembungkus kartu mobile dengan styling border, shadow, dan gesture hover yang konsisten.
3. **`DataViewToggle.tsx`:** Switcher visual bagi pengguna untuk memilih mode tampilan secara manual (Table vs Card vs List).
4. **`ResponsiveFilterBar.tsx`:** Filter bar pintar yang menampilkan inline filters di desktop dan memindahkannya ke Filter Bottom Sheet di mobile.
5. **`MobileRowActions.tsx`:** Component pengelola aksi baris yang otomatis mengubah 3+ tombol ikon menjadi dropdown overflow menu di mobile.
6. **`ResponsivePagination.tsx`:** Pagination bar yang menyesuaikan tombol navigasi secara ringkas pada layar kecil.

---

## 17. DENSITY SYSTEM INTEGRATION

Sistem presentasi data WP-UI-020 akan mengonsumsi **Zustand Density Store** (`mahad-ui-density`) dari WP-UI-010A:
- **Comfortable Mode:** Padding sel tabel/kartu diperluas (`py-3.5`), ukuran font `text-sm`, cocok untuk layar tablet atau pengguna yang menyukai ruang visual lapang.
- **Standard Mode (Default):** Padding sel `py-2.5`, ukuran font `text-xs md:text-sm`.
- **Compact Mode:** 
  - *Desktop:* Padding sel menyusut rapat (`py-1.5`), font `text-xs`, memaksimalkan jumlah baris data yang terlihat dalam satu layar tanpa scroll.
  - *Mobile:* Kepadatan visual disesuaikan tetapi **TIDAK PERNAH** mengurangi tinggi target sentuh tombol/input di bawah batas aman (40px/44px).

---

## 18. TOUCH TARGET & ACCESSIBILITY GUARDRAILS

- Seluruh tombol aksi dalam `MobileRowActions` mematuhi batas aman 44px × 44px.
- Menghindari visual animation berlebihan yang mengganggu *screen reader* (menggunakan ARIA labels `aria-label`, `aria-expanded`, dan `aria-haspopup`).
- Mempertahankan aturan **WP-UI-003 v1.1** (Reduced-motion CSS `motion-reduce:transition-none`).

---

## 19. PERFORMANCE RISKS & MITIGATION

- **Risiko Virtualization:** Tabel/List dengan > 100 baris data dapat memicu lag rendering di browser HP hemat daya.
- **Mitigasi:** Menerapkan pagination semantik default (10/20 item per halaman) atau me-render daftar kartu secara bertahap (*lazy rendering*).

---

## 20. GSAP BOUNDARY

- **GSAP Status:** **0% (TIDAK DIGUNAKAN)**.
- Seluruh pergerakan kartu dan pembukaan sheet filter menggunakan CSS transition native browser.

---

## 21. BREAKPOINT STRATEGY

Menggunakan Tailwind CSS v4 Breakpoints kanonikal:
- `base` (< 640px): Mobile Portrait
- `sm:` (640px): Mobile Landscape / Tablet Small
- `md:` (768px): Tablet Portrait
- `lg:` (1024px): Tablet Landscape / Laptop Small (Sidebar persisten aktif)
- `xl:` (1280px): Desktop Standard
- `2xl:` (1536px): Desktop Large / Workstation

---

## 22. SUB-PACKAGE IMPLEMENTATION ROADMAP

Direncanakan 5 sub-paket eksekusi bertahap untuk WP-UI-020:

```
WP-UI-020A: Shared Responsive Data Primitives (ResponsiveDataGrid, MobileCardStack, FilterBar)
    │
    ├── WP-UI-020B: Mobile-Critical Operational Screens (Santri, Pelanggaran, Operasional, UKS)
    │
    ├── WP-UI-020C: Academic & Teaching Screens (Penilaian, Raport, Mapel, Distribusi Guru)
    │
    ├── WP-UI-020D: Enterprise Administrative & SaaS Data Tables (User Management, SaaS Tenants, Audit Logs)
    │
    └── WP-UI-020E: Master Integration, Regression Testing & Final Certification Gate
```

---

## 23. RISK REGISTER

| Risiko | Tingkat Dampak | Strategi Mitigasi |
| :--- | :--- | :--- |
| Kinerja rendering tabel besar di mobile | High | Gunakan pagination 10-20 item per page & lazy card loading. |
| Tabrakan klik pada tombol aksi baris rapat | Medium | Gunakan `MobileRowActions` (overflow menu) di mobile view. |
| Filter bar memotong konten halaman di HP kecil | Medium | Pindahkan filter ke `MobileFilterSheet` bottom drawer. |
| Mismatch antara state filter mobile & desktop | Low | Sinkronkan state filter dalam 1 custom hook `useDataTableFilters`. |

---

## 24. ACCEPTANCE CRITERIA FOR FUTURE EXECUTION

1. Tidak ada perubahan logika bisnis, API route, atau skema database.
2. Seluruh layar P0 (Santri, Pelanggaran, Operasional, UKS, Wali) dapat digunakan dengan nyaman di layar 320px, 360px, 390px, dan 430px.
3. Kepadatan informasi enterprise di desktop dipertahankan 100%.
4. Target sentuh tombol dan kontrol aksi di mobile dipertahankan minimal 44px.
5. `npx tsc --noEmit`, `npm run test:run`, dan `npm run build` lulus 100%.

---

## 25. EXPLICIT NON-GOALS

- TIDAK merubah routing Next.js atau struktur URL.
- TIDAK mengganti dependensi UI framework bawaan (`@base-ui/react`).
- TIDAK menambahkan library animasi GSAP.
- TIDAK mengubah skema database Drizzle / Supabase.

---

## 26. PRODUCT OWNER DECISION GATES

Sebelum melanjutkan ke tahap eksekusi runtime, Product Owner diminta untuk meninjau dokumen perencanaan ini dan memberikan otorisasi untuk:
1. Pembagian sub-paket `WP-UI-020A` s.d `WP-UI-020E`.
2. Pembuatan 6 primitif baru di `src/components/ui/responsive-data/`.
3. Transformasi antarmuka tabel `SantriTable` & `PelanggaranTable` menjadi Mobile Card Stack di layar ponsel.

---

```
============================================================
WP-UI-020 PLANNING STATUS:
PLANNING COMPLETE — AWAITING PRODUCT OWNER REVIEW

RUNTIME CODE MODIFIED: 0
DATABASE MODIFIED: 0
MIGRATION CREATED: 0
PACKAGE DEPENDENCIES MODIFIED: 0
UI COMPONENTS MODIFIED: 0
CSS MODIFIED: 0
ROUTES MODIFIED: 0
GIT COMMIT: 0
GIT PUSH: 0

IMPLEMENTATION: NOT AUTHORIZED
============================================================
```
