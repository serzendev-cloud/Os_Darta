# WP-UI-010 — Responsive Foundation & Touch Primitives
# Technical Implementation Plan v1.2

**Work Package ID:** `WP-UI-010`  
**Governance Baselines:**  
- [WP-UI-001 v1.1 — Master UI/UX Governance Baseline (LOCKED CANONICAL)](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/architecture/WP-UI-001-Master-UI-UX-Governance-Baseline.md)  
- [WP-UI-003 v1.1 — Motion & Animation Architecture (LOCKED CANONICAL)](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/architecture/WP-UI-003-Motion-and-Animation-Architecture-Planning.md)  
- [WP-UI-004 — Current UI Foundation & Implementation Readiness Audit (APPROVED)](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/architecture/WP-UI-004-Current-UI-Foundation-and-Implementation-Readiness-Audit.md)  
**Parent Roadmap:** [WP-UI-002 — UI/UX Implementation Roadmap & Prioritization Audit (APPROVED CANONICAL ROADMAP)](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/architecture/WP-UI-002-UI-UX-Implementation-Roadmap-and-Prioritization-Audit.md)  
**Status:** `PLANNING HARDENING COMPLETE — READY FOR FINAL PRODUCT OWNER APPROVAL`  
**Execution Safety:** `PLANNING ONLY — ZERO RUNTIME/DATABASE MODIFICATIONS`  

---

## v1.1 → v1.2 REVISION CHANGELOG

Berikut adalah ringkasan perubahan arsitektur dari versi 1.1 ke versi 1.2:
1. **Redesain Arsitektur Hit Area (Correction 01):** Menggeser ketergantungan utama pseudo-element ke **Interactive Wrapper/Container** fisik untuk tombol ikon/aksi kecil. Pseudo-element hanya dipertahankan sebagai fallback aman yang terisolasi.
2. **Penyelarasan Acceptance Criteria (Correction 02):** Mengubah klausul pengujian target sentuh mobile secara tegas menjadi minimal **44px × 44px** area interaksi tanpa mengharuskan tinggi visual komponen sama dengan 44px.
3. **Penyelarasan Precedence Model (Correction 03):** Merevisi hierarki penentu gaya visual menjadi: `System Accessibility → Device/Viewport Constraints → Context Constraints → User Density Preference → Tenant Default`.
4. **Pembatasan Database Schema (Correction 04):** Memindahkan preferensi persisten tersinkronisasi Supabase ke paket kerja masa depan. WP-UI-010 dibatasi menggunakan **Local-Only (Client-Side Local Storage)** guna mencegah utang arsitektur.
5. **Standardisasi Density Layer (Correction 05):** Mendefinisikan lapisan semantik data kepadatan (`data-density="comfortable|standard|compact"`) secara terpusat untuk dikonsumsi secara modular oleh seluruh komponen.

---

## 1. EXECUTIVE SUMMARY

Dokumen **WP-UI-010 Technical Implementation Plan v1.2** memetakan rancangan rekayasa final untuk memperkuat primitif antarmuka bersama (*shared UI primitives*) dan token responsif pada **APP MA'HAD**. 

Rencana ini menetapkan sistem interaksi mobile-first yang kokoh dengan area sentuh aman minimal **44px × 44px**, sembari memperkenalkan preferensi kepadatan tampilan (**User Display Preferences**) dengan mode *Comfortable, Standard, dan Compact*. Rencana ini menjamin keselarasan visual di desktop admin dan aksesibilitas mutlak di mobile tanpa memodifikasi skema data backend Supabase/Drizzle ORM.

---

## 2. CURRENT FOUNDATION DEPENDENCY MAP

Pemetaan ketergantungan file primitif bersama di bawah folder `src/components/ui/` terhadap komponen-komponen aktif:

```
                       ┌──────────────────────┐
                       │     globals.css      │  (Theme Variables & data-density)
                       └──────────┬───────────┘
                                  │
                       ┌──────────▼───────────┐
                       │      button.tsx      │  (Imports cn helper & base-ui button)
                       └────┬──────────────┬──┘
                            │              │
         ┌──────────────────▼───┐      ┌───▼──────────────────┐
         │      select.tsx      │      │      dialog.tsx      │  (Overlay Primitives)
         └──────────────────────┘      └───────────┬──────────┘
                                                   │
                                       ┌───────────▼──────────┐
                                       │      sheet.tsx       │  (Slide-over / Drawers)
                                       └──────────────────────┘
```

Setiap perubahan di tingkat primitif `button.tsx`, `input.tsx`, `select.tsx`, dan `dialog.tsx` akan memengaruhi seluruh 38 modul dashboard di `src/app/dashboard/*`. Blast radius dinilai **GLOBAL (Kritis)**, sehingga modifikasi token responsif wajib dilakukan menggunakan kelas CSS dinamis tanpa pemecahan markup JSX konsumen.

---

## 3. MOBILE-FIRST ARCHITECTURE

Strategi rekayasa antarmuka responsif wajib mengikuti prinsip **Mobile-First** secara konsisten:
- **Baseline CSS:** Ditulis secara bawaan untuk layar ponsel (viewport 320px–430px) dengan ukuran kontrol sentuh yang longgar, spacing horizontal minimal, dan pencegahan auto-zoom input teks.
- **Responsive Layer:** Layout desktop (`md:` ke atas) memperluas lebar kisi secara responsif dan merapatkan visual whitespace tanpa mengubah struktur dokumen HTML/DOM dasar.
- **Strict Rule:** Dilarang merancang versi desktop terlebih dahulu kemudian menyusutkan layout secara paksa dengan menyembunyikan kontainer melalui CSS overrides.

---

## 4. RESPONSIVE ARCHITECTURE

Landasan responsif dirancang menggunakan satu sistem terpadu (**One Responsive System**) yang adaptif terhadap context input (sentuhan vs pointer mouse).
- Spacing, margin, dan padding didefinisikan menggunakan unit proporsional (Tailwind `rem`/`px` scales).
- Lebar container memanfaatkan grid fluid yang secara dinamis melipat kolom data ke bawah saat lebar layar berkurang di bawah **640px** (`sm`), mencegah elemen bertumpuk secara visual.

---

## 5. TOUCH TARGET ARCHITECTURE

Aksesibilitas sentuh mobile wajib menyediakan **Interaction Target ≥ 44px × 44px**. Kita membedakan konsep **Visual Size**, **Interactive Hit Area**, dan **Layout Box**:

### Standar Tombol Ikon (Row Actions / Close Buttons)
Untuk tombol berikon visual kecil (misal: 20px / 24px) seperti pada baris aksi tabel `SantriTable.tsx`:
1. **Interactive Wrapper:** Tombol dibungkus secara fisik menggunakan container interaktif dengan dimensi minimal 44px × 44px. 
2. **Visual Styling:** Background visual atau border tombol dapat dibuat tetap berukuran kecil (misal: `size-8`/32px), namun padding fisik transparan di dalam tombol diatur sedemikian rupa agar area interaksi terluar tombol (layout box) mencapai minimal 44px.
3. **Pseudo-Element Fallback:** Pseudo-element (`after:absolute after:min-w-44`) hanya digunakan sebagai fallback pada elemen legacy yang tidak dapat dibungkus container, guna menghindari risiko tumpang tindih area klik (*hit target overlap*) atau tabrakan baris aksi tabel (*row action collisions*).

---

## 6. VISUAL DENSITY ARCHITECTURE

Visual Density mengontrol kerapatan informasi, whitespace, jarak antar-komponen, dan tinggi baris, terlepas dari ukuran layar fisik perangkat.
- **Pemisahan Konsep:** Kepadatan visual (whitespace lebih sempit) diperbolehkan atas permintaan pengguna, namun sistem **tidak akan pernah** mengecilkan area tap fisik (hit area) di bawah **44px** pada mobile. Pada layout padat desktop, area sentuh dipertahankan pada 32px/36px karena interaksi menggunakan kursor mouse berpresisi tinggi.

---

## 7. USER DISPLAY PREFERENCE ARCHITECTURE

Sistem kepadatan tampilan menggunakan model semantik terpusat:

```
 User Preference (Comfortable / Standard / Compact)
        ↓
   Density State (Root data-density attribute)
        ↓
 Semantic Design Tokens (--spacing-control, --row-height)
        ↓
    UI Primitives (button.tsx, input.tsx, select.tsx)
        ↓
 Feature Components (SantriTable, UKSModal, Dashboard)
```

Variabel CSS semantik didaftarkan secara terpusat di `src/app/globals.css`:
- `Comfortable` (Longgar): Whitespace maksimal untuk penggunaan lapangan.
- `Standard` (Default): Keseimbangan ideal.
- `Compact` (Padat): Whitespace minimal untuk desktop administrative, namun di mobile **tidak boleh** menyusutkan target interaksi di bawah batas aman 44px.

---

## 8. PREFERENCE PERSISTENCE BOUNDARY

Berdasarkan audit forensik, tabel `users` di `src/lib/db/schema/identity.ts` saat ini tidak memiliki kolom untuk metadata preferensi tampilan. 

### Keputusan Strategis:
- **WP-UI-010 tidak boleh mengubah schema database** atau melakukan migrasi data Supabase.
- Pengaturan preferensi visual di dalam WP-UI-010 diimplementasikan secara **Local-Only (Local Storage Client-Side)**.
- Sinkronisasi server-side lintas perangkat ditunda (**DEFERRED**) dan dipindahkan ke paket kerja pengembangan database/profile masa depan.

---

## 9. PREFERENCE PRECEDENCE MODEL

Urutan prioritas pengkondisian gaya visual antarmuka:

1. **SYSTEM ACCESSIBILITY CONSTRAINT:** (Prefers-reduced-motion, system text size) -> Tidak boleh ditindih oleh lapisan di bawahnya.
2. **DEVICE / VIEWPORT CONSTRAINTS:** (Mobile viewport < 640px memaksa minimal hit area 44px).
3. **CONTEXT CONSTRAINTS:** (Spesifikasi UI khusus, e.g., sticky action bar, modal layout).
4. **USER DENSITY PREFERENCE:** (Comfortable / Standard / Compact).
5. **TENANT DEFAULT:** (Default visual baseline per-pesantren).

*Contoh Kasus:* Jika user memilih mode `Compact` pada perangkat seluler, **Device Constraint** akan memveto dan mempertahankan hit area di angka 44px, hanya memperbolehkan penyusutan pada whitespace eksternal/padding non-interaktif.

---

## 10. BUTTON STRATEGY

Penyelarasan komponen `src/components/ui/button.tsx`:
- **Tinggi Visual Adaptif:**
  - *Standard Mobile:* Tinggi visual `h-10` s.d `h-11` (40px–44px).
  - *Standard Desktop:* Menggunakan modifier `md:h-8` (32px).
- **Icon Button:** Tombol ikon kecil menggunakan wrapper padding minimal `p-2` untuk menjamin total layout box interaksi mencapai minimal `size-11` (44px) di mobile, dan menyusut ke `md:size-8` (32px) di desktop.

---

## 11. INPUT STRATEGY

Penyelarasan `src/components/ui/input.tsx`:
- Tinggi visual input diselaraskan: `h-11 md:h-8` (Comfortable), `h-10 md:h-8` (Standard/Compact).
- `text-base` dipertahankan di mobile untuk memblokir auto-zoom browser safari iOS pada input fokus, dikombinasikan dengan padding responsif.

---

## 12. SELECT STRATEGY

Penyelarasan `src/components/ui/select.tsx`:
- Trigger select menggunakan tinggi responsif `h-10 md:h-8` / `h-11 md:h-8`.
- Dropdown popup item menggunakan layout yang peka terhadap kepadatan: mode Comfortable memperlebar padding item menjadi `py-2.5`, sedangkan mode Compact merapatkannya menjadi `py-1.5` dengan total clickable target per-item terjamin 44px via container height.

---

## 13. DIALOG / SHEET CONTEXT STRATEGY

Penyajian overlay responsif disesuaikan berdasarkan tipe konten interaksi:

### 1. **A. Confirmation & B. Alert (e.g., Delete Warning)**
- *Mobile Layout:* Tetap menggunakan **Centered Dialog** dengan tombol tindakan vertikal lebar penuh (`w-full`) agar mudah diketuk jempol.
- *Desktop Layout:* Centered Dialog (`max-w-sm`).

### 2. **C. Short Action Menu (e.g., Row Action Popover)**
- *Mobile Layout:* **Bottom Sheet** (`Sheet` dengan `side="bottom"`).
- *Desktop Layout:* Popover kecil di koordinat pointer.

### 3. **D. Small Form (e.g., Edit Status Santri)**
- *Mobile Layout:* **Bottom Sheet** dengan tinggi maksimal `70dvh`.
- *Desktop Layout:* Centered Dialog (`max-w-md`).

### 4. **E. Long Operational Form & F. Complex Workflows (e.g., AddSantriModal)**
- *Mobile Layout:* **Full-Height Sheet / Drawer** (`w-full h-full` atau bottom-sheet `h-[90dvh]` dengan header/footer sticky).
- *Desktop Layout:* Centered Dialog (`max-w-2xl` s.d `max-w-4xl`).

---

## 14. KEYBOARD / VIEWPORT SAFETY

- **dvh Units:** Menghindari properti tinggi modal berbasis `vh`. Kontainer modal luar menggunakan unit viewport dinamis `dvh` (e.g. `max-h-[85dvh]`).
- **Sticky Footers:** Tombol submit/batal diposisikan secara `sticky bottom-0` di atas area scroll kontainer form untuk menjamin tombol tidak terpotong oleh naiknya keyboard virtual.
- **Scroll Lock:** Mengaktifkan scroll lock body secara ketat saat overlay aktif untuk mencegah overflow scroll ganda (double scrollbar).

---

## 15. RESPONSIVE DATA DENSITY STRATEGY

- **Row Heights:** Kepadatan visual memengaruhi tinggi baris tabel data sekunder (`--row-height-table` berubah dari `2.75rem` di Compact menjadi `3.75rem` di Comfortable).
- **WP-UI-010 Boundary:** Komponen tabel baru tidak ditulis di WP-UI-010. Pekerjaan ini hanya menyediakan variabel token spacing dinamis di CSS. Implementasi transformasi tabel dipusatkan di **WP-UI-020**.

---

## 16. RESPONSIVE CONTAINER STRATEGY

- Penyelarasan layout container utama dashboard: `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8`.
- Layar data SaaS Platform Console dibebaskan dari batasan lebar (`max-w-none`) untuk menjaga efisiensi pembacaan data.

---

## 17. BREAKPOINT STRATEGY

Menggunakan breakpoints bawaan Tailwind CSS v4 untuk konsistensi kompilasi Turbopack:
- `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px).
- Tidak diperkenankan menambah breakpoint kustom baru.

---

## 18. APP SHELL STRATEGY

Topbar dan sidebar menggunakan spacing dinamis merujuk pada token spacing preferensi pengguna (`p-(--spacing-element-gap)`), menjaga konsistensi visual saat mode kepadatan diubah.

---

## 19. ACCESSIBILITY FOUNDATION

Prinsip aksesibilitas wajib untuk rekayasa WP-UI-010:
- Status fokus terlihat kontras (`focus-visible:ring-2`).
- Penutupan dialog menggunakan label screen reader yang jelas.
- Dialog memanfaatkan focus trapping untuk mencegah kebocoran fokus keyboard.

---

## 20. MOTION / GSAP BOUNDARY

- **GSAP:** GSAP tidak diinstal dalam paket kerja ini.
- **CSS Transitions:** Animasi masuk bottom-sheet menggunakan visual slide-up CSS transisi bawaan Tailwind (`transition-transform duration-300 ease-out`).
- **Reduced Motion Safety:** Menyematkan utility global di `globals.css` untuk menonaktifkan seluruh animasi transisi seketika jika pengguna mengaktifkan pengaturan "Reduce Motion" pada sistem operasi mereka.

---

## 21. DESIGN TOKEN STRATEGY

Menerapkan token kepadatan visual dinamis di dalam `src/app/globals.css`:
- Jarak antar tombol kontrol (`--spacing-control-gap`).
- Sudut lengkung tombol (`--radius-control`): Menggunakan unit responsif rem agar estetis pada ukuran Comfortable maupun Compact.
- *Strict Rule:* **Dilarang memodifikasi token warna semantik** yang sudah dikunci oleh WP-UI-003.

---

## 22. REGRESSION / BLAST RADIUS ANALYSIS

Setiap perubahan pada primitif dianalisis risikonya:
- **Tinggi Button responsif:** Risiko visual button tumpah diatasi dengan `md:h-8` desktop lock.
- **Morphing Bottom Sheet:** Risiko form terpotong keyboard diatasi dengan sticky action footer dan pembatas `dvh`.
- **Local Storage Preference:** Risiko kegagalan pemuatan diselesaikan dengan menggunakan default state aman `Standard` jika data local storage kosong.

---

## 23. WP-UI-010 SCOPE BOUNDARY

### IN SCOPE
- Modifikasi primitif bersama di `src/components/ui/button.tsx`, `input.tsx`, `select.tsx`, `dialog.tsx`, `sheet.tsx`.
- Definisi token display preference di `globals.css`.
- Penanganan prefers-reduced-motion global.

### OUT OF SCOPE
- Refactor kode modal bisnis mandiri (misal: `IzinBerobatModal.tsx`).
- Konversi baris tabel menjadi card stack (alokasi ke WP-UI-020).
- Penginstalan library animasi pihak ketiga (GSAP).
- Modifikasi skema database Supabase/Drizzle.

---

## 24. WORK PACKAGE DECOMPOSITION

Pembagian pengerjaan untuk menghindari benturan PR:
1. **`WP-UI-010A` — Primitives Hardening:** Fokus pada komponen input, button, select, dan token kepadatan visual di `globals.css`.
2. **`WP-UI-010B` — Dialog / Sheet Responsive Overlay:** Modifikasi dialog dan sheet agar bertransformasi kontekstual menjadi bottom-sheet di mobile.
3. **`WP-UI-010C` — App Shell Layout Adjustments:** Penyesuaian Topbar, sidebar, dan container padding utama responsif.

---

## 25. IMPLEMENTATION SEQUENCE

Urutan pengerjaan teknis yang direkomendasikan:

```
1. PENETAPAN DESIGN TOKENS (WP-UI-010C)
   (Penambahan variabel data-density dan prefers-reduced-motion di globals.css)
        ↓
2. INTEGRASI TOUCH TARGETS PADA PRIMITIF (WP-UI-010A)
   (Modifikasi button.tsx, input.tsx, select.tsx dengan h-touch-control)
        ↓
3. OVERLAY PRIMITIVES HARDENING (WP-UI-010B)
   (Modifikasi dialog.tsx dan sheet.tsx dengan deteksi context responsif)
        ↓
4. INTEGRASI APP SHELL & VERIFIKASI AKHIR
   (Automated check tsc & vitest run)
```

---

## 26. VALIDATION STRATEGY

Uji validasi manual visual dilakukan pada resolusi terwakili:
- Ponsel Potret: 320px (iPhone SE), 390px (iPhone 13), 430px (iPhone Pro Max).
- Tablet: 768px (iPad portrait), 1024px (iPad landscape).
- Desktop: 1280px (Standard laptop), 1920px (FHD Monitor).

Setiap pengujian wajib memverifikasi tata letak pada ketiga mode preferensi (`Comfortable`, `Standard`, `Compact`).

---

## 27. AUTOMATED VALIDATION

Sebelum kode disatukan ke branch utama, wajib meloloskan uji otomatis:
- `npx tsc --noEmit` (0 kesalahan tipe TypeScript).
- `npm run test:run` (124 tes vitest sukses).
- `npm run build` (Next.js Turbopack build sukses).

---

## 28. ACCEPTANCE CRITERIA

1. Setiap kontrol interaktif mobile **WAJIB** menyediakan target interaksi minimal **44px × 44px** (visual komponen diperbolehkan lebih kecil jika dibungkus container/wrapper interaktif minimal 44px).
2. Mode Compact tidak mengecilkan area klik fisik di bawah 44px pada layar mobile.
3. Mode Compact di desktop (≥ 1024px) menyajikan tata letak informasi padat tanpa elemen bertumpuk.
4. Dialog pendek (konfirmasi) tetap me-render centered dialog di mobile.
5. Dialog formulir panjang bertransformasi menjadi bottom-sheet atau full-screen sheet di mobile.
6. Input form di mobile tidak terpotong oleh virtual keyboard (menggunakan scrollable container dan dvh units).
7. Tidak ada regresi visual pada dashboard desktop administrator eksisting.
8. TypeScript typecheck, vitest tests, dan Next.js production build lulus 100%.

---

## 29. ROLLBACK STRATEGY

Setiap sub-paket (WP-UI-010A/B/C) di-commit secara terpisah. Jika terjadi kegagalan rendering pasca-merge, commit spesifik dapat di-revert (`git revert <commit_hash>`) untuk mengembalikan komponen primitif ke kondisi baseline cadangan tanpa mengganggu file bisnis.

---

## 30. PRODUCT OWNER DECISIONS

Rincian keputusan yang disahkan oleh Product Owner dalam revisi v1.2 ini:
1. **User Display Preference:** Pengesahan penerapan sistem preferensi kepadatan tampilan bersama tiga mode (`Comfortable`, `Standard`, `Compact`) yang dikendalikan oleh variabel CSS di tingkat root HTML.
2. **Context-Aware Overlays:** Pengesahan model dialog responsif kontekstual (tidak semua dialog otomatis beralih menjadi bottom-sheet di mobile).

---

## 31. IMPLEMENTATION READINESS VERDICT

### VERDICT: READY

Dokumen perencanaan teknis **WP-UI-010 v1.2** dinyatakan matang dan siap diimplementasikan setelah menerima otorisasi formal dari Product Owner. Tidak ada dependensi domain bisnis yang memblokir pengerjaan ini.

---

## 32. EXPLICIT "NO IMPLEMENTATION" DECLARATION

Sesuai dengan tata kelola penjaminan kualitas **WP-UI-010 v1.2**:
- **TIDAK ADA** file aplikasi runtime yang dimodifikasi.
- **TIDAK ADA** dependencies baru yang diinstal di `package.json`.
- **TIDAK ADA** database schema, Drizzle migration, atau Supabase API route yang disentuh.
- Dokumen ini murni merupakan rancangan perencanaan teknis (*technical planning*) yang menunggu persetujuan formal dari Product Owner.

---

```
============================================================
STATUS TATA KELOLA KANONIKAL WP-UI-010 v1.2:
WP-UI-010 v1.2 TECHNICAL PLAN REVISION COMPLETE
STATUS: PLANNING ONLY

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
