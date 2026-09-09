# APP MA'HAD MASTER UI/UX GOVERNANCE BASELINE v1.1
## Mobile-First + Responsive + Role-Aware Architecture

**Dokumen Tata Kelola Kanonikal Desain Antarmuka & Pengalaman Pengguna Enterprise SaaS**  
**Governance ID:** `WP-UI-001`  
**Version:** `v1.1`  
**Status:** `UI/UX BASELINE LOCKED — CANONICAL`  
**Approved by:** `Product Owner`  
**Approval:** `FINAL`  
**Effective Date:** `Effective immediately`  

---

## 📋 CHANGELOG v1.0 → v1.1

Berikut adalah rincian klarifikasi dan penyelarasan tata kelola minor yang telah disetujui secara resmi oleh Product Owner:

1. **Section 17 (Responsive Breakpoints)**:
   - Ditegaskan bahwa breakpoint (`<640px`, `640–1023px`, `≥1024px`) adalah ambang batas responsif awal (*baseline responsive thresholds*), bukan aturan klasifikasi perangkat yang kaku (*not absolute device classification rules*).
   - Mengizinkan *content-driven breakpoints* pada komponen tertentu sesuai densitas informasi dan keterbacaan data.
2. **Section 2 & 6 (Interaction Path)**:
   - Menyesuaikan aturan "2–3 taps" menjadi target optimasi UX (*UX optimization target*): *"Frequent operational actions SHOULD target a 2–3 tap completion path where practical"*, bukan batasan mutlak universal (*not a universal hard invariant*). Alur administratif multi-tahap tetap diizinkan memiliki tahapan lebih panjang.
3. **Section 12 (Mobile Dialog / Sheet)**:
   - Menyesuaikan klausul Bottom Sheet menjadi pola default (*default mobile interaction pattern*) untuk form dan aksi kontekstual.
   - Mengizinkan pengecualian resmi (*destructive confirmation, simple alert, system confirmation, full-screen workflow, dedicated page*) berbasis konteks tugas (*task context*).
4. **Section 13 (Primary CTA)**:
   - Menyesuaikan aturan tombol primer menjadi *"Prefer one dominant Primary CTA per interaction context"*. Mengizinkan multi-primary action hanya jika mewakili alur prioritas tinggi yang terpisah secara tegas dan hierarkinya tetap jelas.
5. **Section 4 (Role-Based Terminology)**:
   - Mengklarifikasi bahwa contoh adaptasi nama menu (*Wali Santri → Anak Saya*, dsb.) adalah contoh ilustratif. Terminologi kontekstual dapat disesuaikan menurut peran, modul, konfigurasi tenant, atau ketetapan resmi Product Owner.
6. **Section 9 (Navigation Source of Truth)**:
   - Menegaskan prinsip kanonikal: *"There MUST be exactly one authoritative navigation configuration source"*.
   - Mendokumentasikan `@/config/navigation.ts` sebagai sumber konfigurasi navigasi kanonikal terverifikasi pada repositori saat ini.

---

> ### 🏛️ PERNYATAAN KANONIKAL MASTER (THE MASTER RULE)
> **"APP MA'HAD uses a Mobile-First, Responsive, Role-Aware UI system. Mobile is the primary experience for the majority of users, while desktop remains a fully supported experience for administrative and information-dense workflows."**
> 
> *APP MA'HAD mengadopsi sistem UI Mobile-First, Responsif, dan Sadar-Peran (Role-Aware). Perangkat seluler (mobile) adalah pengalaman utama bagi mayoritas pengguna operasional, sementara desktop tetap menjadi pengalaman yang didukung penuh untuk alur kerja administratif dan kebutuhan data dengan densitas tinggi.*

---

## 1. PRODUCT UI/UX PHILOSOPHY

Sistem ERP Pendidikan Pesantren Multi-Tenant **APP MA'HAD** dirancang dengan arsitektur berakar tunggal yang memisahkan secara tegas antara domain bisnis, otoritas data, dan lapisan presentasi visual:

```
                  ┌─────────────────────────────────────────┐
                  │          ONE APPLICATION (CORE)         │
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────▼────────────────────┐
                  │       ONE CANONICAL BUSINESS LOGIC      │
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────▼────────────────────┐
                  │          ONE BACKEND / API LAYER        │
                  │       (Supabase PostgreSQL + Drizzle)   │
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────▼────────────────────┐
                  │             ONE RBAC MODEL              │
                  │   (Centralized Permissions & Roles)     │
                  └────────────────────┬────────────────────┘
                                       │
                  ┌────────────────────▼────────────────────┐
                  │         ROLE-AWARE PRESENTATION         │
                  │   (Capability Derived from Permission)  │
                  └────────────────────┬────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
  📱 MOBILE (Primary)           📟 TABLET (Hybrid)           💻 DESKTOP (Full)
  Quick, Touch-First,           Split-Pane, Dual Column,     Dense Data Grid,
  Card Stacks, Thumb-Zone       Adaptive Flow                Multi-Column, Dossier
```

### Prinsip Inti Filosofi Produk:
1. **Pemisahan Presentasi & Logika Domain (*Decoupled Presentation*)**: Lapisan UI/UX tidak boleh memuat atau mengubah aturan bisnis (*business rules/invariants*). UI bertindak sebagai media input kontekstual dan visualisasi data yang patuh pada backend policy engine.
2. **Kesesuaian Realitas Lapangan Pesantren (*Operational Reality-First*)**: Pengguna lapangan (Musyrif asrama, Guru piket, Satpam gerbang, Pengurus tahfidz) beroperasi dalam lingkungan dinamis dengan mobilitas tinggi menggunakan smartphone. UI harus meminimalkan friksi input dan kelelahan kognitif (*cognitive fatigue*).
3. **Kekuatan Administratif Tanpa Kompromi (*Uncompromised Desktop Power*)**: Pengelola kantor, Admin Kesiswaan, dan Super Admin membutuhkan densitas informasi tinggi, manipulasi data batch, keyboard navigation, dan visualisasi agregat yang tidak boleh dibatasi oleh pola mobile.
4. **Identitas Estetika Islami Modern (*Royal Emerald & Amber Gold Aesthetics*)**: Mempertahankan karakter visual pesantren yang elegan, bersih, dan berwibawa melalui palet warna OKLCH Emerald & Gold, tipografi hierarkis, serta ornamen mihrab/geometris yang subtil.

---

## 2. MOBILE-FIRST PRINCIPLE

Prinsip **Mobile-First** menetapkan bahwa setiap alur kerja (*task flow*) dan fitur baru harus dirancang, divalidasi, dan dioptimalkan untuk perangkat layar sentuh kecil terlebih dahulu sebelum diperluas ke layar yang lebih besar.

```
┌─────────────────────────────────────────────────────────────┐
│ ❌ APA YANG BUKAN MOBILE-FIRST                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Mengecilkan layout desktop ke resolusi sempit (shrink). │
│ 2. Memaksa tabel 12 kolom dengan horizontal scrolling liar. │
│ 3. Menyembunyikan form input krusial demi kerapian semata.  │
│ 4. Mengharuskan pengguna mencubit layar untuk zoom.         │
│ 5. Menempatkan tombol aksi utama di sudut kiri atas layar.  │
└─────────────────────────────────────────────────────────────┘
```

### Aturan Wajib Mobile-First:
1. **Search & Filter-First**: Pada daftar data besar, tempatkan bilah pencarian cepat dan filter berbasis chip/drawer di bagian teratas yang langsung dapat diakses.
2. **Progressive Disclosure**: Tampilkan data tingkat tinggi (*high-level summary*) terlebih dahulu, sediakan drawer/sheet atau accordion untuk membuka rincian audit lengkap.
3. **Interaction Path Optimization Target**: Aksi operasional harian yang berkategori frekuensi tinggi (*high-frequency operational actions*) **sebaiknya menargetkan penyelesaian dalam 2–3 ketukan (*should target a 2–3 tap completion path where practical*)**. Ini adalah target optimasi UX, bukan batasan mutlak (*not a hard invariant*); alur administratif multi-tahap tetap dapat berjalan sesuai kebutuhan validasi domain.
4. **Thumb-Zone Optimization**: Tombol aksi dominan harus diletakkan pada area jangkauan jempol (bagian bawah layar atau sticky bottom action bar).
5. **Zero Pinch-to-Zoom**: Seluruh teks, kontrol input, dan diagram harus terbaca dan berinteraksi secara proporsional pada viewport 360px–430px tanpa zoom manual.

---

## 3. RESPONSIVE PRINCIPLE

Responsif dalam APP MA'HAD adalah **transformasi adaptif yang disengaja (*intentional structural transformation*)**, bukan sekadar fluid width.

| Dimensi Perubahan | Transformasi Mobile (< 640px) | Transformasi Tablet (640px - 1023px) | Transformasi Desktop (≥ 1024px) |
| :--- | :--- | :--- | :--- |
| **Tata Letak (Layout)** | Single Column (Vertikal stack) | 2-Kolom Adaptif / Master-Detail | Multi-Kolom / Grid Modular / Dossier 360 |
| **Navigasi** | Sticky Header + Bottom Bar / Slide-Over Sheet | Collapsible Icon Sidebar / Dual-Pane | Persistent Fixed Sidebar (260px / 68px collapsed) |
| **Komponen Data** | Card Stack, Badge Prioritas, Expandable Row | Responsive Grid Cards / Compact Table | Full Data Grid, Pinned Columns, Batch Action Bar |
| **Formulir** | Stepper Bertahap / Single Column Stack | Dual Column Form / Segmented Tab | Multi-Column Grid (2–3 kolom) + Preview Panel |
| **Modal / Dialog** | Default: Bottom Sheet (Slide-Up Drawer) | Centered Adaptive Dialog | Centered Fixed Modal / Side-Over Flyout |
| **Aksi Toolbar** | Floating Action Button (FAB) / Sticky Bottom | Inline Toolbar + Dropdown Menu | Extended Action Bar + Keyboard Shortcuts |
| **Spasi (Spacing)** | Compact (px-3 py-2, gap-3) | Standard (px-4 py-4, gap-4) | Generous (px-6 py-6, gap-6) |

---

## 4. ROLE-AWARE EXPERIENCE

Pengalaman UI diadaptasikan secara dinamis berdasarkan karakteristik peran pengguna (*persona behavior*) tanpa memecah arsitektur aplikasi:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ROLE ARCHETYPE SEGMENTATION                        │
├──────────────────────────┬──────────────────────┬───────────────────────┤
│ 📱 FIELD / MOBILE-FIRST  │ 💻 DESKTOP-HEAVY     │ 🔄 MIXED / HYBRID     │
├──────────────────────────┼──────────────────────┼───────────────────────┤
│ • Musyrif / Pembina      │ • Super Admin (SaaS) │ • Mudir / Pimpinan    │
│ • Guru / Pengajar        │ • Admin Kesiswaan    │ • Kepala Madrasah     │
│ • Wali Kelas             │ • Operator Tata Usaha│ • Koordinator Bidang  │
│ • Wali Santri            │ • Admin Keuangan     │ • Supervisor Asrama   │
│ • Petugas Keamanan/UKS   │ • Tenant Admin       │                       │
│ • Santri                 │                      │                       │
├──────────────────────────┼──────────────────────┼───────────────────────┤
│ Karakteristik:           │ Karakteristik:       │ Karakteristik:        │
│ • Interaksi cepat        │ • Data entry massal  │ • Monitoring eksekutif│
│ • Input tunggal/konteks  │ • Analisis mendalam  │ • Approval cepat      │
│ • Layar smartphone       │ • Konfigurasi sistem │ • Multi-device        │
│ • Jaringan seluler       │ • Keyboard shortcut  │ • Ringkasan visual    │
└──────────────────────────┴──────────────────────┴───────────────────────┘
```

### Mekanisme Eksekusi Sadar-Peran:
1. **Dynamic Context Filtering**: Pengguna hanya disajikan menu, modul, dan tombol aksi yang diizinkan oleh sistem izin kanonikal (`@/config/permissions.ts`).
2. **Contextual Terminology Adaptability (Illustrative Guidelines)**:
   - Judul navigasi dan label modul dapat disesuaikan secara kontekstual menurut peran, modul, konfigurasi tenant, atau ketetapan resmi Product Owner.
   - *Contoh ilustratif penerapan:*
     - *Wali Santri* dapat melihat: **"Anak Saya"** & **"Tagihan SPP Anak"**
     - *Wali Kelas* dapat melihat: **"Santri Kelas Bimbingan"**
     - *Santri* dapat melihat: **"Profil Saya"** & **"Quest & Pemutihan Saya"**
     - *Admin* melihat: **"Master Data Santri"** & **"Matriks Pelanggaran"**
   - *Catatan Tata Kelola*: Contoh di atas adalah panduan ilustratif, bukan terminologi produk yang dikunci mati (*not hardcoded universal product terminology*).
3. **Penyembunyian Opsi Non-Otoritatif**: Jika suatu parameter dikalkulasi otomatis oleh sistem (misal: bobot poin hukuman, nomor SP otomatis, limit belanja harian), field tersebut **tidak ditampilkan sebagai input** bagi peran lapangan, melainkan otomatis diolah oleh backend policy.

---

## 5. SEPARATION: DEVICE VS ROLE (ROLE ≠ DEVICE)

APP MA'HAD menegakkan garis pemisah tegas antara otoritas peran dan presentasi perangkat:

```
╔═════════════════════════════════════════════════════════════════════════╗
║                      THE GOLDEN TRINITY OF UI/UX                        ║
╠═════════════════════════════════════════════════════════════════════════╣
║  1. ROLE (Peran)         ──► Menentukan OTORITAS & KAPABILITAS (RBAC)   ║
║  2. DEVICE (Perangkat)   ──► Menentukan PRESENTASI & TATA LETAK         ║
║  3. TASK CONTEXT (Tugas) ──► Menentukan PRIORITAS INTERAKSI & FORM INPUT║
╚═════════════════════════════════════════════════════════════════════════╝
```

### Skenario Pembuktian:
- **Kasus A: Admin Membuka Smartphone**: Admin yang sedang berada di luar kantor tetap memiliki hak akses administratif penuh, namun UI merender form dalam mode *mobile-stepper* dan tabel dalam mode *card-summary* dengan tombol *drawer filter*.
- **Kasus B: Guru Membuka Laptop di Lab Komputer**: Guru yang membuka laptop di kelas mendapatkan keuntungan layar lebar: rekap nilai tampil dalam *editable spreadsheet grid*, jadwal mingguan tampil dalam *multi-column calendar view*.

---

## 6. MOBILE UX RULES (< 640px)

```
┌─────────────────────────────────────────────────────────┐
│ 📱 MOBILE VIEWPORT ERGONOMIC BLUEPRINT                  │
├─────────────────────────────────────────────────────────┤
│ [Top Bar: Logo + Bismillah + Avatar + Quick Notif]      │
├─────────────────────────────────────────────────────────┤
│ [Search Bar & Quick Filter Chips]                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ [Primary Interactive Cards / Summary Widgets]           │
│   • Clear Status Badge (Emerald/Amber/Red)              │
│   • Tap to Expand / Slide for Actions                   │
│                                                         │
│ [Stacked Data List / Card Items]                        │
│   • High Information Hierarchy                          │
│   • Minimal Secondary Metadata                          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ [Sticky Bottom Action Bar: Primary Action Button (48px)]│
│ [Optional Bottom Navigation Bar: Home / Task / Profile] │
└─────────────────────────────────────────────────────────┘
```

1. **Target Sentuh Minimum (Touch Target Size)**:
   - Semua elemen interaktif (tombol, dropdown, checkbox, tab) wajib memiliki ukuran area sentuh minimal **44 × 44 pt / 48 × 48 px**.
   - Spasi antar elemen interaktif minimal **8 px** untuk mencegah salah tekan (*fat-finger errors*).
2. **Default Bottom Sheet Interaction**:
   - Jadikan **Slide-Up Bottom Sheet** sebagai pola default untuk interaksi formulir kontekstual dan aksi cepat di mobile.
3. **Form Single-Column Flow**:
   - Seluruh input disusun dalam satu kolom vertikal.
   - Input numerik (NIS, No. WA, Nominal Uang) wajib menyematkan atribut keyboard yang tepat (`inputMode="numeric"`, `type="tel"`, dsb).
4. **Sticky Action Bars**:
   - Aksi penyelesaian formulir (*Simpan*, *Kirim Laporan*, *Bayar Sekarang*) dipasang pada bilah bawah melayang (*sticky bottom action bar*) dengan kontras tinggi.
5. **No Nested Scrolling**:
   - Hindari komponen scroll internal kecil di dalam halaman mobile yang memicu konflik gesture scroll viewport.

---

## 7. TABLET UX RULES (640px – 1023px)

1. **Master-Detail Split Layout**:
   - Pada orientasi landscape tablet, manfaatkan layout 2-panel (kiri: daftar santri/pelanggaran 35% lebar; kanan: detail profil & riwayat 65% lebar).
2. **Adaptive Grid Cards**:
   - Kartu metrik dan daftar item ditata dalam grid 2 hingga 3 kolom (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`).
3. **Hybrid Input Support**:
   - Tablet mendukung interaksi sentuh dan stylus/keyboard fisik secara bersamaan. Sediakan target sentuh yang nyaman sekaligus dukungan keyboard shortcut dasar.
4. **Collapsible Navigation Drawer**:
   - Sidebar navigasi beralih menjadi mode *compact icon-rail* (68px) atau drawer slide-over yang dapat disembunyikan untuk memaksimalkan ruang kerja.

---

## 8. DESKTOP UX RULES (≥ 1024px)

1. **High-Density Information Architecture**:
   - Memaksimalkan layar 1080p / 2K / 4K dengan visualisasi data lengkap, tabel multi-kolom, dan panel dossier 360 derajat.
2. **Advanced Data Grid Capabilities**:
   - Tabel desktop wajib mendukung pengurutan (*multi-column sort*), filter kolom tersemat, *column visibility toggle*, dan *bulk selection checkbox*.
3. **Multi-Column Grouped Forms**:
   - Formulir ditata dalam 2–3 kolom terstruktur secara logis menggunakan grup fieldset dan kartu pembagi (*PageCard*).
4. **Side-by-Side Comparison & Split Views**:
   - Mengizinkan pembandingan data (misalnya: kurikulum formal vs pesantren, atau performa santri antar-semester) secara berdampingan.
5. **Full Keyboard Accessibility & Shortcuts**:
   - Mendukung navigasi tabel via tombol panah, pembukaan dialog pencarian global (`Ctrl+K` / `Cmd+K`), dan konfirmasi aksi via `Enter` / pembatalan via `Esc`.

---

## 9. NAVIGATION RULES

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RESPONSIVE NAVIGATION MAP                       │
├──────────────────────────┬─────────────────────────────────────────────┤
│ 💻 DESKTOP (≥ 1024px)    │ Persistent Fixed Sidebar:                   │
│                          │ • Full Width (260px) / Collapsed (68px)     │
│                          │ • Multi-level Accordion Menu                │
│                          │ • Topbar: Bismillah + Role Badge + User Menu│
├──────────────────────────┼─────────────────────────────────────────────┤
│ 📟 TABLET (640px-1023px) │ Collapsible Icon Sidebar (68px)             │
│                          │ • Hover Tooltips & Overlay Submenu          │
│                          │ • Hamburger Toggle to Full Drawer           │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 📱 MOBILE (< 640px)      │ Hybrid Mobile Header & Drawer:              │
│                          │ • Topbar: Hamburger + Compact Brand + Notif │
│                          │ • Full-height Slide-over Navigation Sheet   │
│                          │ • Role-specific Contextual Action Bar       │
└──────────────────────────┴─────────────────────────────────────────────┘
```

### Aturan Tata Kelola Navigasi:
1. **Authoritative Navigation Source of Truth**:
   - **Prinsip Mutlak**: Wajib terdapat tepat satu sumber konfigurasi navigasi yang otoritatif (*There MUST be exactly one authoritative navigation configuration source*).
   - **Implementasi Terverifikasi**: Repositori menetapkan `@/config/navigation.ts` sebagai sumber kanonikal tunggal untuk hierarki menu, routing, RBAC requirements, dan metadata navigasi. Dilarang membuat link atau struktur navigasi terpisah yang tidak bersumber dari berkas ini.
2. **Strict Platform Console Isolation**:
   - Menu *SaaS Platform Console* (Tenants, Billing, Infrastructure) hanya boleh muncul untuk peran `developer` dan `super_admin`. Peran tenant (Admin, Guru, Wali) dilarang melihat jejak modul SaaS.
3. **Breadcrumb Otomatis**:
   - Setiap halaman desktop/tablet wajib menampilkan rekam jejak navigasi (`@/components/layout/breadcrumb.tsx`) untuk memudahkan orientasi hierarki.

---

## 10. TABLE RULES (DATA PRESENTATION TRANSFORMATION)

> **ATURAN MUTLAK:** Dilarang membungkus tabel mentah dengan `overflow-x-auto` pada mobile tanpa transformasi kartu, kecuali jika data tersebut merupakan matriks angka murni yang mustahil dipecah (misalnya: ledger nilai raport kementerian).

```
DESKTOP TABLE (10 Kolom)             MOBILE TRANSFORMATION (Stacked Card)
┌──────────────────────────────┐     ┌──────────────────────────────────┐
│ Santri | NIS | Kelas | Aksi  │ ──► │ [Avatar] Ahmad Fauzi (NIS: 1021) │
│ Ahmad  | 1021| 10-A  | [Edit]│     │ Kelas: 10-A • Asrama: Umar A-04  │
│ Budi   | 1022| 10-B  | [Edit]│     │ Status: Aktif [SP: Tidak Ada]    │
└──────────────────────────────┘     │ Poin: [====  ] 12 Pts            │
                                     │ [Tombol Rincian] [Tombol Aksi]   │
                                     └──────────────────────────────────┘
```

### Matriks Transformasi Data Grid:
1. **Tingkat Prioritas Kolom (*Field Prioritization*)**:
   - **Primary (Wajib di Mobile Card)**: Identitas utama (Nama Santri/Guru), Indikator Status (Badge Warna), Aksi Primer.
   - **Secondary (Tampil di Sub-baris Card)**: NIS, Kelas, Asrama, Nilai Metrik Kunci.
   - **Tertiary (Disembunyikan di balik Expand/Modal)**: Tanggal pembuatan, Metadata sistem, Catatan kaki, No. Referensi internal.
2. **Expandable Card Pattern**: Pengguna mobile dapat mengetuk kartu untuk membuka rincian sekunder tanpa harus berpindah halaman.
3. **Responsive Action Trigger**: Tombol aksi tabular pada desktop (Ikon Edit, Hapus, Detail) dikonsolidasikan menjadi menu dropdown tiga titik (*kebab menu `...`*) atau tombol aksi kartu yang jelas pada mobile.

---

## 11. FORM RULES (INPUT & DATA COLLECTION)

1. **Transformasi Grid ke Stack**:
   - Desktop: `grid grid-cols-2 lg:grid-cols-3 gap-6`.
   - Mobile: `flex flex-col space-y-4`.
2. **Segmentasi Bertahap (Progressive Steppers)**:
   - Formulir pendaftaran/input kompleks dengan > 6 field wajib dipecah menjadi tahapan logis (misal: *Langkah 1: Identitas*, *Langkah 2: Akademik*, *Langkah 3: Orang Tua*).
3. **Inline Validation & Floating Error Summary**:
   - Pesan validasi harus muncul tepat di bawah input terkait dengan warna teks jelas (`--destructive`).
   - Pada saat submit gagal di mobile, viewport wajib otomatis melakukan *smooth scroll* ke field error pertama yang belum terisi.
4. **Prevent Input Obscurity**:
   - Pastikan keyboard virtual mobile tidak menutupi tombol submit atau field yang sedang aktif (`scroll-margin-bottom: 80px`).

---

## 12. MODAL, DIALOG & SHEET RULES

```
┌─────────────────────────────────────────────────────────────┐
│ 💻 DESKTOP DIALOG PATTERN                                   │
│   • Width bounded: max-w-lg / max-w-2xl / max-w-4xl         │
│   • Centered overlay with backdrop blur                     │
│   • Header with title + description + close (X)             │
│   • Footer with Cancel (Ghost) & Confirm (Primary)          │
├─────────────────────────────────────────────────────────────┤
│ 📱 MOBILE PRESENTATION PATTERNS                             │
│   • DEFAULT: Bottom Sheet Drawer (Slide-Up, Swipe Dismiss)  │
│   • EXCEPTIONS BASED ON TASK CONTEXT:                       │
│     - Simple Alerts & Destructive Confirm: Compact Modal    │
│     - Complex Multi-step Forms: Full-screen Overlay / Page  │
└─────────────────────────────────────────────────────────────┘
```

1. **Pola Interaksi Default vs Pengecualian Sah**:
   - **Default Mobile Pattern**: **Bottom Sheet** (`@/components/ui/sheet.tsx`) adalah pola default untuk formulir kontekstual, filter data, dan aksi cepat di perangkat mobile.
   - **Pengecualian Berbasis Konteks Tugas (*Permitted Contextual Exceptions*)**:
     - *Destructive Confirmation / Simple Alert*: Boleh menggunakan *Centered Alert Dialog* ringkas untuk memastikan fokus pengguna terhadap konsekuensi aksi.
     - *Complex Workflows / Steppers*: Boleh bertransformasi menjadi *Full-screen Modal Overlay* atau *Dedicated Route Page* bila membutuhkan ruang kerja penuh.
2. **Desktop Dialog Pattern**: Gunakan `@/components/ui/dialog.tsx` dengan batas lebar proporsional (`max-w-lg` s/d `max-w-4xl`) dan backdrop blur.
3. **Fokus Trap & Keyboard Escape**: Semua dialog/sheet wajib mengunci fokus (*focus trap*) di dalam modal saat aktif dan dapat ditutup menggunakan tombol `Esc` pada perangkat dengan keyboard.

---

## 13. ACTION PRIORITY & CTA RULES

1. **Offloading Rule Enforcement to Domain Engine**:
   - Petugas lapangan (Musyrif/Guru) hanya memilih fakta lapangan (Siapa santri, apa jenis pelanggaran/prestasi, waktu kejadian).
   - Besaran poin, tingkat SP otomatis, jenis hukuman yang memenuhi syarat, dan eskalasi sidang ditentukan sepenuhnya oleh backend policy engine.
2. **Hierarki Tombol (CTA Hierarchy)**:
   - **Prinsip Utama**: **Utamakan satu Primary CTA dominan per konteks interaksi (*Prefer one dominant Primary CTA per interaction context*)**.
   - **Multi-Primary Exception**: Dua tombol primer hanya diizinkan berdampingan jika mewakili alur prioritas tinggi yang terpisah secara tegas (misal: *Setujui Laporan* [Emerald] vs *Tolak & Eskalasi* [Amber/Destructive]) dan hierarki visualnya tetap jelas.
   - **Secondary & Destructive Actions**: Tombol pendukung menggunakan varian `outline` atau `ghost`. Aksi destruktif wajib memiliki batas visual terpisah dan dialog konfirmasi.
3. **Floating Action Bar di Mobile**:
   - Aksi tunggal paling sering dipakai (misal: *+ Catat Pelanggaran*, *+ Tambah Santri*) disajikan via Floating Action Button (FAB) atau sticky bottom toolbar.

---

## 14. DESIGN SYSTEM & TOKEN ARCHITECTURE

Sistem antarmuka APP MA'HAD berlandaskan token CSS modern berbasis **OKLCH Color Space** yang dikonfigurasi dalam `@theme inline` di `src/app/globals.css`:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CANONICAL DESIGN TOKEN PALETTE                       │
├──────────────────────────┬──────────────────────────────────────────────┤
│ 🟢 Primary (Emerald)     │ Light: oklch(0.42 0.12 165)                  │
│                          │ Dark:  oklch(0.75 0.16 75) (Amber Accent)    │
├──────────────────────────┼──────────────────────────────────────────────┤
│ 🟡 Accent (Amber Gold)   │ Light: oklch(0.93 0.03 85)                   │
│                          │ Dark:  oklch(0.24 0.03 165)                  │
├──────────────────────────┼──────────────────────────────────────────────┤
│ 🛡️ Status Palette        │ • Success: oklch(0.596 0.145 164.3) (Hijau) │
│                          │ • Warning: oklch(0.70 0.18 73)    (Kuning)   │
│                          │ • Error:   oklch(0.577 0.245 27.3) (Merah)   │
│                          │ • Info:    oklch(0.54 0.20 264)   (Biru)     │
│                          │ • Purple:  oklch(0.50 0.18 300)   (Ungu)     │
├──────────────────────────┼──────────────────────────────────────────────┤
│ 📐 Radius Scale          │ --radius: 0.75rem (12px)                     │
│                          │ sm: 7.2px, md: 9.6px, lg: 12px, xl: 16.8px   │
├──────────────────────────┼──────────────────────────────────────────────┤
│ 🔤 Typography Stack      │ Sans: Geist Sans / Inter                     │
│                          │ Mono: Geist Mono                             │
│                          │ Serif: Arabic Calligraphic Ornamental Serif  │
└──────────────────────────┴──────────────────────────────────────────────┘
```

### Standar Penggunaan Komponen Bersama:
- **Card**: Wajib menggunakan `@/components/ui/card.tsx` atau `@/components/shared/page-header.tsx (PageCard)`.
- **Badge**: Wajib menggunakan `@/components/ui/badge.tsx` atau `@/components/shared/status-badge.tsx`.
- **Button**: Wajib menggunakan varian resmi `@/components/ui/button.tsx` (variant: `default | destructive | outline | secondary | ghost | link`).
- **Feedback States**: Wajib menggunakan `@/components/shared/loading-state.tsx`, `@/components/shared/empty-state.tsx`, dan `@/components/shared/error-state.tsx`.

---

## 15. ACCESSIBILITY RULES (A11Y)

1. **Rasio Kontras Warna (WCAG 2.1 AA Compliant)**:
   - Kontras teks normal minimal **4.5:1** terhadap background.
   - Kontras teks besar (≥ 18pt / 14pt bold) dan elemen grafis UI minimal **3.0:1**.
2. **Screen Reader Semantic HTML**:
   - Seluruh icon-only button wajib menyertakan atribut `aria-label` atau elemen pendamping bersubkelas `sr-only`.
   - Gunakan elemen semantik HTML5 murni (`<header>`, `<nav>`, `<main>`, `<aside>`, `<section>`, `<table>`, `<button>`). Dilarang membuat tombol dari elemen `<div onClick={...}>`.
3. **Visible Focus Rings**:
   - Seluruh elemen interaktif wajib mempertahankan outline fokus yang jelas saat navigasi keyboard aktif (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`).
4. **Form Error Association**:
   - Setiap elemen form input error wajib terhubung dengan pesan error-nya melalui atribut `aria-describedby="field-error-id"` dan `aria-invalid="true"`.

---

## 16. PERFORMANCE RULES (MOBILE-FIRST PERFORMANCE)

1. **Optimasi Bundle & React Server Components (RSC)**:
   - Gunakan Server Components untuk data fetching dan initial layout rendering. Batasi direktif `'use client'` hanya pada daun komponen interaktif (*leaf components*).
2. **Lazy Loading & Code Splitting**:
   - Komponen berat (Recharts, Sheet/Modal kompleks, Data table parser) wajib dimuat secara dinamis via `next/dynamic` atau Suspense.
3. **Core Web Vitals Thresholds**:
   - **LCP (Largest Contentful Paint)**: < 2.5 detik pada jaringan 4G throttling.
   - **CLS (Cumulative Layout Shift)**: < 0.1 (Gunakan skeleton loader dengan dimensi tetap).
   - **INP (Interaction to Next Paint)**: < 200 milidetik pada perangkat seluler kelas menengah (*mid-tier mobile*).
4. **Optimistic UI Updates**:
   - Aksi interaktif frekuensi tinggi (tandai notifikasi telah dibaca, switch tab, toggle accordion) harus merespons secara optimistik sebelum mutasi server selesai.

---

## 17. RESPONSIVE BREAKPOINT STRATEGY

Mengacu pada konfigurasi kanonikal **Tailwind CSS v4** yang aktif di repositori, breakpoint resmi APP MA'HAD distandardisasi sebagai berikut:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CANONICAL RESPONSIVE BREAKPOINT MATRIX                    │
├────────────┬─────────────┬──────────────────────────────────────────────────┤
│ BREAKPOINT │ VIEWPORT    │ TARGET PERANGKAT & STRATEGI LAYOUT               │
├────────────┼─────────────┼──────────────────────────────────────────────────┤
│ Base / xs  │ < 640px     │ Smartphone Portrait & Landscape (Primary Target) │
│            │             │ • Single Column Stack                            │
│            │             │ • Bottom Sheets & Stacked Cards                  │
│            │             │ • Hidden Desktop Sidebar, Full-screen Drawer     │
├────────────┼─────────────┼──────────────────────────────────────────────────┤
│ sm         │ ≥ 640px     │ Phablet & Small Tablets                          │
│            │             │ • 2-Column Form Fields                           │
│            │             │ • 2-Column Card Grid                             │
├────────────┼─────────────┼──────────────────────────────────────────────────┤
│ md         │ ≥ 768px     │ Tablet Portrait & iPad Mini/Air                  │
│            │             │ • Master-Detail Split Views                      │
│            │             │ • Compact Sidebar Rail Option (68px)             │
├────────────┼─────────────┼──────────────────────────────────────────────────┤
│ lg         │ ≥ 1024px    │ Tablet Landscape & Laptops (Desktop Baseline)    │
│            │             │ • Full Fixed Sidebar (260px)                     │
│            │             │ • Multi-column Data Grids & Tables               │
│            │             │ • Centered Modal Dialogs                         │
├────────────┼─────────────┼──────────────────────────────────────────────────┤
│ xl         │ ≥ 1280px    │ Large Desktop & High-Res Monitors                │
│            │             │ • 3 to 4-Column Metric Grids                     │
│            │             │ • Side-by-side Comparison Panels                 │
├────────────┼─────────────┼──────────────────────────────────────────────────┤
│ 2xl        │ ≥ 1536px    │ Enterprise Workstations & Command Center Displays│
│            │             │ • Bounded Content Shell (max-w-7xl / container)  │
│            │             │ • Multi-dashboard Analytics Grid                 │
└────────────┴─────────────┴──────────────────────────────────────────────────┘
```

### Prinsip Fleksibilitas Breakpoint:
- **Baseline Thresholds, Not Rigid Hardware Boxes**: Breakpoint di atas adalah titik tolak responsif dasar (*starting baseline thresholds*), bukan batasan klasifikasi perangkat mutlak.
- **Content-Driven Breakpoints Permitted**: Komponen individu diizinkan menggunakan adaptasi berbasis konten (*content-driven transformation*) apabila densitas informasi, lebar karakter teks, atau keterbacaan data memerlukan peralihan di luar ambang standar. Dilarang memaksakan setiap komponen berubah pada piksel yang persis sama jika merugikan UX.

---

## 18. COMPONENT REUSE RULES

1. **Larangan Duplikasi Primitif**: Dilarang menginstal library UI eksternal baru atau membuat wrapper tombol/input sendiri secara ad-hoc.
2. **Katalog Komponen Wajib Pakai**:
   - `src/components/ui/*`: Dialog, Sheet, Button, Input, Select, DropdownMenu, Tabs, Table, Badge, Avatar, ScrollArea, Tooltip, Switch.
   - `src/components/shared/*`: `PageHeader`, `PageCard`, `StatsCard`, `StatusBadge`, `AnalyticsCard`, `LoadingState`, `EmptyState`, `ErrorState`, `DashboardShell`.
   - `src/components/layout/*`: `Sidebar`, `Topbar`, `Breadcrumb`.

---

## 19. EXISTING UI AUDIT FINDINGS

Berdasarkan audit mendalam terhadap seluruh berkas UI di dalam `src/components/` dan `src/app/`, berikut adalah klasifikasi tata kelola antarmuka:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUDIT STATUS SUMMARY                              │
├──────────────────────────┬───────┬──────────────────────────────────────────┤
│ KLASIFIKASI              │ JUMLAH│ DESKRIPSI                                │
├──────────────────────────┼───────┼──────────────────────────────────────────┤
│ ALREADY COMPLIANT        │  35%  │ Komponen Layout, Navigasi RBAC, Topbar   │
│ NEEDS STANDARDIZATION    │  45%  │ Form Modal, Shared Data Tables           │
│ CONFLICTS WITH NEW RULE  │  15%  │ Raw `overflow-x-auto` Tables             │
│ LEGACY                   │   5%  │ Mock State Stores, Hardcoded Role Select │
│ UNKNOWN                  │   0%  │ Seluruh komponen telah teridentifikasi   │
└──────────────────────────┴───────┴──────────────────────────────────────────┘
```

### Rincian Temuan Audit per Modul:

| Komponen / Modul | Berkas Terkait | Klasifikasi | Catatan Audit & Temuan Lapangan |
| :--- | :--- | :--- | :--- |
| **Theme & Global CSS** | `src/app/globals.css` | **ALREADY COMPLIANT** | Token OKLCH, varian dark mode, dan ornamen Islami sudah terdefinisi secara kanonikal. |
| **RBAC Navigation** | `src/config/navigation.ts` | **ALREADY COMPLIANT** | Sumber otoritatif tunggal; isolasi tenant vs SaaS console sudah terverifikasi. |
| **Topbar & Header** | `src/components/layout/topbar.tsx` | **ALREADY COMPLIANT** | Responsif, role badge terintegrasi, notifikasi realtime, dan dark mode switch berjalan baik. |
| **Sidebar Layout** | `src/components/layout/sidebar.tsx` | **ALREADY COMPLIANT** | Mendukung mode mobile sheet, collapsed icon rail, dan accordion menu terisolasi. |
| **Santri Data Table** | `src/components/santri/SantriTable.tsx` | **CONFLICTS WITH NEW RULE** | Menggunakan raw `<table className="w-full">` dalam `overflow-x-auto` tanpa alternatif kartu pada mobile. |
| **Alumni Data Table** | `src/components/santri/AlumniTable.tsx` | **CONFLICTS WITH NEW RULE** | Pola desktop table dipaksa horizontal scroll pada layar kecil. |
| **Catat Pelanggaran** | `src/components/pelanggaran/CatatPelanggaranModal.tsx` | **NEEDS STANDARDIZATION** | Menggunakan Dialog desktop standar; perlu standardisasi ke Bottom Sheet saat dibuka di mobile. |
| **Wali Bundled Checkout** | `src/app/wali/tagihan/checkout/page.tsx` | **NEEDS STANDARDIZATION** | Layout 2-kolom responsif, namun touch target checkbox & action button perlu disesuaikan standar 48px. |
| **Dashboard Shell & Cards** | `src/components/shared/*` | **ALREADY COMPLIANT** | `StatsCard`, `PageCard`, dan feedback states sudah modular dan siap pakai di seluruh halaman. |
| **Role Switch Demo** | `src/components/layout/topbar.tsx` | **LEGACY** | Fitur demo role-switcher di topbar adalah utility fase transisi, harus diproteksi pada environment produksi. |

---

## 20. LEGACY UI FINDINGS

1. **Hardcoded HTML `<select>` Primitives**: Pada beberapa tabel (misal: `SantriTable.tsx` filter angkatan/provinsi), filter masih menggunakan tag `<select>` HTML standar dengan class manual `SELECT_CLS`, belum mengonsumsi `@/components/ui/select.tsx`.
2. **In-Memory Store Mock Events**: Penggunaan event kustom `CURRICULUM_STORE_CHANGE_EVENT` pada `sidebar.tsx` merupakan jejak transisi prototipe yang menunggu migrasi penuh ke backend database service.
3. **Hardcoded Inline Heights**: Beberapa dialog memiliki deklarasi tinggi statis (`max-h-[600px]`) yang dapat terpotong pada smartphone dengan resolusi vertikal pendek atau saat keyboard virtual muncul.

---

## 21. CONFLICTING PATTERNS

1. **Table Horizontal Scroll vs Mobile Card Transformation**:
   - *Konflik*: Halaman santri, alumni, dan master kurikulum saat ini mengandalkan pembungkus `overflow-x-auto` yang memaksa pengguna mobile menggeser layar ke kanan-kiri untuk melihat aksi baris.
   - *Solusi Tata Kelola*: Fitur masa depan wajib merender representasi kartu (`Card Stack`) pada viewport `< 640px`.
2. **Desktop Dialog Centering di Layar Mobile**:
   - *Konflik*: Modal pencatatan pelanggaran dan penambahan santri membuka modal di tengah layar, menyebabkan header/footer dialog terpotong pada layar ponsel kecil.
   - *Solusi Tata Kelola*: Modal kontekstual wajib bertransformasi menjadi *Bottom Drawer Sheet* pada mobile secara default.

---

## 22. FUTURE FEATURE DEFINITION OF DONE (DoD)

Setiap fitur antarmuka baru dinyatakan **UI-Complete** dan siap rilis hanya jika telah memenuhi 7 pilar verifikasi berikut:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    7-PILLAR UI DEFINITION OF DONE (DoD)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ [ ] 1. Mobile Usability (< 640px):                                          │
│        • Tata letak 1-kolom, thumb-zone friendly, bottom sheet default.     │
│        • Tanpa horizontal scroll yang tidak disengaja.                      │
│                                                                             │
│ [ ] 2. Tablet Adaptation (640px - 1023px):                                  │
│        • Grid 2-kolom proporsional, master-detail bila relevan.             │
│                                                                             │
│ [ ] 3. Desktop High-Density (≥ 1024px):                                     │
│        • Pemanfaatan ruang lebar, sorting/filtering lengkap, multi-kolom.   │
│                                                                             │
│ [ ] 4. Role-Aware Behavior:                                                 │
│        • Hak akses disinkronkan dengan RBAC (@/config/permissions.ts).      │
│        • Input field disederhanakan untuk peran operasional lapangan.       │
│                                                                             │
│ [ ] 5. Touch & Ergonomics:                                                  │
│        • Seluruh target sentuh interaktif berukuran minimal 44x44 pt / 48px.│
│                                                                             │
│ [ ] 6. Accessibility (a11y):                                                │
│        • Kontras warna lolos WCAG 2.1 AA, keyboard focusable, aria-* valid. │
│                                                                             │
│ [ ] 7. Design System Compliance:                                            │
│        • 100% menggunakan token resmi dan komponen @/components/ui & shared.│
│        • Tanpa arbitrary CSS styling di luar aturan globals.css.            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 23. AGENT UI/UX GOVERNANCE RULES

Bagi seluruh agen AI yang bertugas pada repositori APP MA'HAD di masa mendatang:

1. **Dilarang Mendesain Ulang Berdasarkan Selera Pribadi (*No Subjective Redesign*)**: Agen dilarang mengganti warna tema, font, border radius, atau merombak tata letak yang sudah berjalan tanpa persetujuan eksplisit.
2. **Reuse Existing Design Tokens**: Gunakan selalu token warna semantik (`bg-primary`, `text-muted-foreground`, `border-border`, `bg-card`) dan kelas ornamen Islami (`bg-islamic-pattern`, `islamic-card`).
3. **Preserve Business Logic Integrity**: Dilarang mengubah alur data, validasi schema Drizzle/Zod, atau kontrak API saat melakukan penyesuaian presentasi responsive.
4. **No Shrinking Hacks**: Dilarang menyelesaikan masalah responsive dengan sekadar memperkecil ukuran font menjadi tidak terbaca (misal: `text-[8px]`) untuk memaksakan tabel desktop ke mobile.

---

## 24. PRODUCT OWNER OVERRIDE RULES

Jika dalam implementasi nyata ditemukan kondisi khusus (*edge case*) di mana aturan baseline ini perlu dikecualikan:

1. **Jalur Eskalasi Resmi**: Agen harus **BERHENTI** (*STOP*) dan menyajikan trade-off teknis secara terstruktur kepada Product Owner.
2. **Kriteria Pengecualian Sah**:
   - Matriks nilai raport ledger kementerian yang diwajibkan berformat tabel lebar standar baku.
   - Terminal POS Satpam / POS Kantin RFID dengan monitor layar sentuh beresolusi khusus (*dedicated kiosk hardware*).
3. **Pencatatan Keputusan**: Setiap pengecualian wajib didokumentasikan dalam ADR (*Architecture Decision Record*) resmi di folder `docs/architecture/`.

---

## 25. UI/UX CHANGE CONTROL

```
USULAN PERUBAHAN UI/UX
         │
         ▼
[Evaluasi Dampak: Multi-Tenant, Mobile, Desktop, Role]
         │
         ▼
[Pemeriksaan Token & Komponen Desain Eksisting]
         │
    ┌────┴───────────────────────────┐
    ▼                                ▼
[Sesuai Baseline]           [Menyimpang dari Baseline]
    │                                │
    ▼                                ▼
[Implementasi Mengacu DoD]  [STOP — AJUKAN KE PRODUCT OWNER]
                                     │
                                     ▼
                            [Persetujuan PO Tertulis]
```

---

## 26. FINAL CANONICAL UI/UX RULES

1. **Satu Sistem Terpadu**: APP MA'HAD adalah satu aplikasi multi-tenant yang menyajikan antarmuka adaptif sadar-peran (*single core, adaptive presentation*).
2. **Mobile Adalah Pengalaman Utama**: Desain setiap fitur baru harus berawal dari alur sentuh mobile yang cepat dan intuitif.
3. **Desktop Adalah Pusat Kendali**: Desktop dimaksimalkan untuk produktivitas administratif, analisis data mendalam, dan penanganan data massal.
4. **Domain Menentukan Logika, Presentasi Menyesuaikan Konteks**: Logika bisnis, RBAC, dan integritas data adalah otoritas absolut backend/domain yang tidak boleh dilanggar oleh lapisan presentasi visual.

---

```
============================================================
STATUS TATA KELOLA UI/UX:
UI/UX BASELINE LOCKED — CANONICAL
GOVERNANCE ID: WP-UI-001
VERSION: v1.1
APPROVED BY: Product Owner (FINAL)
============================================================
```
