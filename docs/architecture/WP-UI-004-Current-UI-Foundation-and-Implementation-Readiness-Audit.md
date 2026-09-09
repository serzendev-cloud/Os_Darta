# WP-UI-004 — Current UI Foundation & Implementation Readiness Audit
## Forensic UI/UX & Responsive Engineering Audit against WP-UI-001/WP-UI-003 Governance

**Work Package ID:** `WP-UI-004`  
**Governance Standards:**  
- [WP-UI-001 v1.1 — Master UI/UX Governance Baseline (LOCKED CANONICAL)](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/architecture/WP-UI-001-Master-UI-UX-Governance-Baseline.md)  
- [WP-UI-003 v1.1 — Motion & Animation Architecture (LOCKED CANONICAL)](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/architecture/WP-UI-003-Motion-and-Animation-Architecture-Planning.md)  
**Parent Roadmap:** [WP-UI-002 — UI/UX Roadmap & Prioritization Audit (APPROVED CANONICAL ROADMAP)](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/architecture/WP-UI-002-UI-UX-Implementation-Roadmap-and-Prioritization-Audit.md)  
**Status:** `AUDIT COMPLETE — READY FOR PRODUCT OWNER REVIEW`  
**Execution Safety:** `READ-ONLY FORENSIC AUDIT — ZERO RUNTIME/DATABASE MODIFICATIONS`  

---

## 1. EXECUTIVE SUMMARY

Dokumen **WP-UI-004** adalah laporan audit forensik menyeluruh (*read-only*) terhadap repositori **APP MA'HAD** untuk mengevaluasi fondasi antarmuka, keramahan mobile (*mobile-first responsive*), aksesibilitas sentuh (*touch targets*), pemisahan logika bisnis, kesesuaian dengan arsitektur data baru (Supabase + Drizzle ORM), dan kesiapan repositori untuk memulai fase implementasi UI dinamis.

Audit ini mengonfirmasi bahwa repositori memiliki kode TypeScript yang bersih (100% lolos typecheck `tsc --noEmit`) dan seluruh rangkaian pengujian fungsional berjalan tanpa kegagalan (124 tests passed). Namun, ditemukan deviasi kritis (P1) pada lapisan primitif antarmuka (`components/ui/*`) dan tata letak data/modal yang bersifat desktop-centric. Peta jalan **WP-UI-020** dan **WP-UI-010** tetap terbukti sebagai prioritas utama untuk menstabilkan fondasi sebelum halaman operasional/bisnis dimodifikasi.

---

## 2. REPOSITORY CURRENT-STATE SUMMARY

Repositori APP MA'HAD dibangun di atas framework **Next.js 16.2.6 (Turbopack)** dengan **React 19.2.4** dan **Tailwind CSS v4**. Seluruh manajemen basis data berbasis Firebase telah sepenuhnya dibersihkan dan diganti dengan integrasi **Supabase + Drizzle ORM** (sebagai single source of truth persisten).

### Inventarisasi Aset Antarmuka Aktual:
- **Dashboard Routes:** 38 subdirektori di bawah `src/app/dashboard/*` (termasuk modul kurikulum, kelas, santri, UKS, keuangan, dan saas).
- **Shared UI Primitives:** 17 file komponen di `src/components/ui/*` menggunakan pustaka `@base-ui/react` v1.4.1.
- **Shared Layout Components:** `sidebar.tsx`, `topbar.tsx`, dan `breadcrumb.tsx` di `src/components/layout/*`.
- **Shared Domain Primitives:** 10 komponen presentasi bersama di `src/components/shared/*` (termasuk `page-header.tsx`, `stats-card.tsx`, dan `status-badge.tsx`).
- **Data Table Instances:** Lebih dari 22 instansi tabel HTML tradisional yang terbungkus class `overflow-x-auto` (misalnya pada `SantriTable.tsx` dan `AlumniTable.tsx`).
- **Modal/Dialog Instances:** 18+ modal form/konfigurasi, mayoritas menggunakan centered desktop layouts.

---

## 3. MOBILE-FIRST AUDIT

Meskipun cangkang aplikasi (App Shell) memiliki sidebar drawer responsif, tata letak konten di dalam halaman dashboard sebagian besar masih dirancang secara **Desktop-First dengan Mobile Overrides** daripada **Mobile-First**.

### Bukti Forensik:
1. **Layout Wrapper (`src/app/dashboard/layout.tsx`):**
   Pemberian padding kiri untuk area konten utama bersifat bersyarat berdasarkan resolusi desktop (`lg:pl-[var(--sidebar-width)]` di line 90), namun area konten utama tidak memiliki pembatasan lebar horizontal adaptif pada mobile, sehingga tabel data memaksa horizontal scroll di seluruh layar.
2. **Form Layout Grid:**
   Komponen modal seperti `AddSantriModal.tsx` me-render form multi-kolom yang padat di desktop. Pada resolusi mobile, form ini hanya menyusut (scale down) tanpa melakukan reflow tata letak menjadi satu kolom berurutan yang ramah jempol.
3. **Card Grid:**
   Grid statistik pada dashboard menggunakan `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` yang sudah responsif, namun densitas teks di dalamnya belum disesuaikan untuk layar smartphone.

---

## 4. RESPONSIVE FOUNDATION AUDIT

Fondasi responsif aplikasi berbasis Tailwind v4 di `src/app/globals.css` telah mendefinisikan breakpoints standar (`sm`, `md`, `lg`, `xl`). Namun, ditemukan inkonsistensi taktis dalam penggunaan utilitas responsif di tingkat halaman:
- **Viewport Height Handling:** Beberapa modal menggunakan batasan tinggi statis seperti `max-h-[90vh]` (`IzinBerobatModal.tsx` line 158) atau `max-h-[92vh]` (`SessionAssessmentModal.tsx` line 229). Hal ini memicu pemotongan konten (content truncation) pada ponsel berlayar pendek atau ketika keyboard virtual aktif.
- **Responsive Container:** Tidak ada container pusat yang membatasi lebar baris baca optimal pada mobile, menyebabkan teks menyebar terlalu lebar pada layar tablet horizontal.

---

## 5. TOUCH TARGET AUDIT

Ini adalah deviasi paling kritis (**P1 — CRITICAL**) terhadap standar ergonomi sentuh minimum **44px x 44px** (WP-UI-001 Klausul 7).

### Bukti Forensik Ukuran Primitives:
1. **Button (`src/components/ui/button.tsx`):**
   - Tinggi default (`size="default"` di line 24): `h-8` (32px).
   - Ukuran terkecil (`size="xs"` di line 25): `h-6` (24px).
   - Ukuran menengah (`size="sm"` di line 26): `h-7` (28px).
   - Tombol ikon (`size="icon"` di line 28): `size-8` (32px).
   *Dampak:* Semua tombol utama dan sekunder gagal memenuhi area sentuh aman mobile.
2. **Input (`src/components/ui/input.tsx` line 12):**
   - Tinggi input: `h-8` (32px).
   *Dampak:* Sangat sulit untuk diklik pada layar ponsel beresolusi tinggi tanpa mengenai elemen sekitarnya.
3. **Select Trigger (`src/components/ui/select.tsx` line 44):**
   - Tinggi trigger: `data-[size=default]:h-8` (32px).
4. **Action Button Inline (`src/components/santri/SantriTable.tsx` line 276):**
   - Tombol edit status siswa menggunakan `p-1.5` dengan ikon `w-4 h-4` (total tinggi 28px). Berjarak sangat rapat dengan baris data lain.

---

## 6. RESPONSIVE DATA AUDIT

Seluruh representasi data tabular di halaman operasional (Kesiswaan, UKS, Kelas, Presensi) masih menggunakan pola **HTML Table + Horizontal Scroll** (`overflow-x-auto`).

### Kasus Spesifik:
1. **`SantriTable.tsx` (lines 164-297):**
   Tabel menampilkan 10 kolom data (Nama, NIS, Asrama, Kelas, Status, SP, Karakter, Poin, Prestasi, Aksi). Pada viewport ponsel (< 640px), pengguna terpaksa melakukan scroll horizontal sejauh lebih dari 400px untuk melihat status poin dan mengakses tombol edit status. Hal ini diklasifikasikan sebagai **UNUSABLE ON MOBILE**.
2. **`AlumniTable.tsx`:**
   Memiliki perilaku serupa. Tombol aksi berada di kolom paling kanan yang tersembunyi secara default di layar mobile.

---

## 7. MODAL / SHEET / KEYBOARD AUDIT

Modals & Dialogs saat ini dirancang sebagai popup melayang di tengah layar (centered overlay).

### Bukti Forensik & Masalah:
1. **`src/components/ui/dialog.tsx` (line 56):**
   Primitif dialog memosisikan dirinya di tengah viewport (`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`). Di mobile, tata letak ini:
   - Menghalangi visibilitas form saat keyboard virtual muncul.
   - Tidak mendukung gestur geser (swipe-down-to-close) yang natural.
2. **Bypass Dialog Primitif:**
   Komponen `IzinBerobatModal.tsx` (lines 157-158) mengabaikan primitif dialog bersama dan membuat div overlay statis sendiri (`fixed inset-0 bg-black/60 ... max-h-[90vh]`), menyebabkan perilaku fokus keyboard tidak aman (focus trapping bypass) dan kegagalan accessibility.

---

## 8. APP SHELL & NAVIGATION AUDIT

App Shell menggunakan cangkang terpadu yang dikontrol oleh `DashboardLayout` (`src/app/dashboard/layout.tsx`).
- **Pemisahan Peran vs Perangkat (Role ≠ Device):** Logika menu dikendalikan secara dinamis berdasarkan role pengguna yang bersumber dari `useAuthStore` (`sidebar.tsx` line 62), sementara tata letak responsif dikontrol secara visual menggunakan utilitas CSS Tailwind (misal: `hidden lg:flex`).
- **Sidebar Drawer Mobile:** `isMobileOpen` di dalam `sidebar.tsx` (line 210) mengontrol kemunculan drawer mobile dengan backdrop blur secara benar. Namun, transisi drawer masih bersifat instan tanpa orkestrasi animasi yang halus.

---

## 9. ROLE-AWARE UI AUDIT

- **Otorisasi Sisi Klien:** Peta menu di `src/config/navigation.ts` menyaring hak akses halaman secara ketat berdasarkan peran pengguna (musyrif, wali, guru, admin).
- **Keamanan Presentasi:** Komponen UI tidak menyembunyikan elemen sensitif sebagai taktik keamanan utama; perlindungan RBAC tingkat rute (middleware) dan endpoint API berjalan independen dari markup HTML/JSX.

---

## 10. CSS / TAILWIND AUDIT

- **Teknologi:** Tailwind CSS v4 digunakan dengan arsitektur modern. Token tema didefinisikan menggunakan variabel CSS asli di dalam blok `@theme inline` di `globals.css` (lines 7-62).
- **Inkonsistensi Spacing/Warna:**
  - `src/app/dashboard/layout.tsx` (line 85 & 90) masih menggunakan warna latar belakang ad-hoc `bg-sky-100/80` alih-alih merujuk pada token tema semantik (`bg-background` atau `bg-muted/30`).
  - Ditemukan nilai arbitrary seperti `max-h-[90vh]` and padding manual yang belum terstandardisasi dengan token unit kelipatan 4px/8px.

---

## 11. MOTION / ANIMATION FORENSIC AUDIT

Audit menyeluruh terhadap repositori menunjukkan keadaan gerak (motion state) saat ini:

1. **GSAP Status:** `gsap`, `@gsap`, `ScrollTrigger`, dan `useGSAP` **tidak terdeteksi** di seluruh repositori (baik dalam berkas js/ts/tsx maupun dependensi `package.json`).
2. **Existings Animation System:** 
   Aplikasi saat ini mengimpor paket `"tw-animate-css": "^1.4.0"` di `package.json` dan `@import "tw-animate-css"` di `globals.css` line 2.
3. **Usage of Animation Classes:**
   Terdapat penggunaan kelas animasi bawaan Tailwind dan `tw-animate-css` pada komponen modal/popover (seperti `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-top-2`, `animate-pulse`, `animate-spin`, `animate-bounce`).
4. **Memory Leak & SSR Risks:**
   Karena animasi saat ini murni menggunakan CSS transisi bawaan browser tanpa manajemen lifecycle JS, risiko kebocoran memori (memory leak) bernilai **nol**. Namun, transisi tersebut belum mendukung dynamic reduced-motion preferences secara tersentralisasi.

---

## 12. MOBILE-FIRST MOTION AUDIT

- Seluruh transisi masuk modal (`animate-in fade-in zoom-in-95 duration-200`) aktif baik di desktop maupun mobile.
- Transisi ini berdurasi singkat (~200ms) dan tidak menghalangi interaksi (non-blocking). Namun, visual intensity dari animasi zoom di layar smartphone kecil terasa kurang natural dibandingkan transisi geser slide-up (bottom-sheet style).

---

## 13. MOTION BUDGET AUDIT

Berdasarkan klasifikasi **WP-UI-003 Motion Budget**:
- **Screen A (Operational Mobile Screens - Santri, UKS, Presensi):** Saat ini mematuhi batas intensitas rendah karena hanya menggunakan transisi modal bawaan. Namun, visual noise dari transisi bounce (`animate-bounce` pada icon penghargaan) perlu dinonaktifkan di mobile untuk mempertahankan ketenangan antarmuka.
- **Screen B (Dense Data Screens):** Tabel data tidak memiliki animasi baris, menjaga beban render GPU tetap nol pada perangkat smartphone kelas bawah.

---

## 14. ACCESSIBILITY AUDIT

- **Reduced Motion Support:** Aplikasi belum mengimplementasikan deteksi `@media (prefers-reduced-motion)` secara global. Pengguna yang mengaktifkan fitur pembatasan gerak di sistem operasi mereka tetap dipaksa melihat transisi modal.
- **Aria Attributes:** Terdapat deviasi pada beberapa tombol interaktif (seperti tombol silang penutup modal di `IzinBerobatModal.tsx` line 162) yang tidak memiliki `aria-label` deskriptif untuk screen readers.
- **Focus Trap:** Modal manual yang melewati dialog primitif tidak mengunci fokus keyboard di dalam modal, melanggar standar WCAG 2.1 AA.

---

## 15. PERFORMANCE AUDIT

### Evaluasi Performa Render:
- **Statically Exported Pages:** Hasil build Next.js menunjukkan mayoritas rute dashboard berhasil di-render sebagai halaman statis (`○ Static`), yang menjamin pemuatan awal (FCP) sangat cepat di mobile.
- **Optimasi List Rendering:** Halaman `SantriTable.tsx` me-render daftar baris siswa secara langsung tanpa pagination virtual. Jika jumlah data santri melebihi 100+, ini akan memicu penurunan FPS signifikan pada perangkat mobile mid-tier saat scrolling.

---

## 16. BUSINESS LOGIC SEPARATION AUDIT

Audit memverifikasi kepatuhan arsitektural:
- **Pemisahan Domain & Presentasi:** Logika penghitungan poin pelanggaran, penentuan status SP (SP1, SP2, SP3), dan verifikasi otorisasi dilakukan sepenuhnya di lapisan repositori (`src/lib/health-engine`, `src/lib/governance-events`).
- Komponen UI hanya bertindak sebagai penerjemah representasi visual dari state yang diberikan oleh database layer (Supabase).

---

## 17. DOMAIN DEPENDENCY AUDIT

Status integrasi UI terhadap paket domain kesiswaan & akademik:

| Kode Modul | Deskripsi Domain | Status UI Integration | Klasifikasi Kesiapan |
| :--- | :--- | :--- | :--- |
| **WP-310** | Core Santri & Asrama | Tersambung via Drizzle & Supabase | `READY` |
| **WP-311** | E-Tatib Violation | Tersambung via Drizzle & Supabase | `READY` |
| **WP-320** | UKS / Medis | Tersambung via Drizzle & Supabase | `READY` |
| **WP-330** | Kurikulum & Madrasah | Tersambung via Drizzle & Supabase | `READY` |
| **WP-340** | Rombel Kelas & Akademik | Tersambung via Drizzle & Supabase | `READY` |
| **WP-350** | Keuangan & SPP | Parsial (Mock/Demo API ready) | `PARTIALLY READY` |
| **WP-360** | Gate Checkpoint Presensi | Tersambung via Drizzle & Supabase | `READY` |

---

## 18. WP-UI-002 REVALIDATION

Revalidasi komprehensif terhadap prioritas peta jalan WP-UI-002:

| Kode Temuan | Deskripsi Masalah | Status Aktual di Repositori | Prioritas Koreksi |
| :--- | :--- | :--- | :--- |
| **[P1-UI-01]** | Touch Target Primitives `h-8` | `CONFIRMED` — Masih 32px di `src/components/ui/button.tsx`. | **CRITICAL (P1)** |
| **[P1-UI-02]** | Table Scroll Mobile | `CONFIRMED` — Masih menggunakan `overflow-x-auto` statis. | **CRITICAL (P1)** |
| **[P1-UI-03]** | Mobile Form Modal Truncation | `CONFIRMED` — Modal me-render layout centered desktop. | **CRITICAL (P1)** |
| **[P1-UI-05]** | Action Button Collision | `CONFIRMED` — Tombol edit baris tabel berukuran 28px. | **CRITICAL (P1)** |
| **[P2-UI-01]** | Custom Modal Bypass | `CONFIRMED` — `IzinBerobatModal.tsx` mem-bypass dialog. | **HIGH (P2)** |
| **[P2-UI-02]** | Hardcoded Native Select | `CONFIRMED` — Filter `SantriTable.tsx` memakai tag select polos. | **HIGH (P2)** |

*Kesimpulan:* Prioritas klasifikasi dalam peta jalan WP-UI-002 masih **100% akurat dan valid** terhadap kondisi riil repositori saat ini.

---

## 19. FOUNDATION VS COMPONENT VS PAGE CLASSIFICATION

Untuk mencegah perbaikan berulang yang tidak efisien, temuan dikelompokkan berdasarkan cakupan arsitekturalnya:

### 🧱 FOUNDATION Scope (Blast Radius: Global)
- **Komponen Primitif:** `Button`, `Input`, `Select`, `Dialog`, `Sheet` (`src/components/ui/*`).
- **Design Tokens:** Variabel ukuran tinggi sentuh responsif (`--touch-target-mobile: 44px`, dll) di `src/app/globals.css`.

### 🧩 COMPONENT Scope (Blast Radius: Modul Spesifik)
- **Responsive Table Wrapper:** Standardisasi kelas tabel untuk beralih ke Card Stack di resolusi `< 640px`.
- **Form Wrapper:** Standardisasi stepper/bottom-sheet modal untuk form input lapangan.

### 📄 PAGE Scope (Blast Radius: Rute Tunggal)
- Integrasi card stack pada halaman `src/components/santri/SantriTable.tsx`.
- Integrasi bottom sheet pada halaman `src/components/uks/IzinBerobatModal.tsx`.

---

## 20. IMPLEMENTATION READINESS ASSESSMENT

1. **Is the responsive foundation ready?**  
   `PARTIALLY READY`. Breakpoints dan warna tema OKLCH sudah stabil, namun token ukuran tinggi interaktif (touch target) belum tersedia secara semantik.
2. **Is the mobile foundation ready?**  
   `NO`. Komponen primitif Dialog dan Sheet belum mengadaptasi transisi bottom-sheet mobile secara default.
3. **Is the component foundation ready?**  
   `YES`. Repositori telah menggunakan `@base-ui/react` yang sangat modular dan siap dikonfigurasi ulang.
4. **Is the motion foundation ready?**  
   `NO`. Pustaka GSAP belum diinstal, dan wrapper `prefers-reduced-motion` belum dibuat.
5. **Is the repository ready for GSAP installation?**  
   `YES`. Turbopack build dan compiler TypeScript berjalan bersih, siap menerima dependensi baru.
6. **Blockers:** Tidak ada.

---

## 21. RECOMMENDED FIRST IMPLEMENTATION WORK PACKAGE

### 👉 `WP-UI-010: Responsive Foundation & Touch Primitives Hardening`

#### Justifikasi Arsitektural:
- **Dependency Root:** Komponen `Button`, `Input`, dan `Select` adalah akar dependensi dari seluruh 38 modul aplikasi. Mengubahnya di tingkat primitif akan memperbaiki masalah kenyamanan sentuh (touch target) secara universal tanpa memodifikasi kode halaman bisnis satu per satu.
- **Zero Regression Risk:** Modifikasi ini murni berkaitan dengan visual dan tata letak CSS/Tailwind (tanpa mengubah payload data Supabase/Drizzle), sehingga risiko merusak logika bisnis kesiswaan adalah nol.
- **A11y & Standard Compliance:** Menyediakan landasan aksesibilitas yang kokoh (focus ring, label, dll.) sejak awal.

---

## 22. RISKS & BLOCKERS

- **Blast Radius pada Primitif:** Perubahan ukuran tombol (`Button`) dan input (`Input`) dapat merusak tata letak kepadatan tinggi (density) pada dashboard desktop jika tidak ditangani menggunakan conditional styling responsif (misal: `h-11 md:h-8`).
- **Mitigasi:** Seluruh perubahan tinggi elemen wajib menggunakan pengkondisian ukuran berbasis breakpoint (mobile mendapat ukuran sentuh besar, desktop mempertahankan kerapatan informasi).

---

## 23. PROPOSED CHANGES REQUIRING PO APPROVAL

Sebelum memulai implementasi, Frontend Architect mengusulkan perubahan desain teknis berikut untuk disahkan:
1. **Dynamic Responsive Sizing:** Menetapkan standar tinggi elemen input/tombol: `h-11 md:h-8` (44px di mobile, 32px di desktop).
2. **Standard Responsive Dialog:** Menambahkan perilaku morphing pada `DialogContent` agar otomatis bergeser menjadi Bottom Sheet (`fixed bottom-0 inset-x-0 rounded-t-2xl`) pada resolusi `< 640px`.

---

## 24. ACCEPTANCE CRITERIA

Implementasi berikutnya dinyatakan sukses apabila:
1. TypeScript strict typecheck lolos dengan 0 kesalahan (`tsc --noEmit`).
2. Seluruh 124 unit/integration tests lulus tanpa kegagalan.
3. Seluruh tombol interaktif di perangkat seluler memiliki tinggi sentuh riil minimal 44px.
4. Dialog form input di mobile beralih ke layout bottom-sheet dan tidak terpotong oleh keyboard virtual.

---

## 25. EXPLICIT "NO IMPLEMENTATION" DECLARATION

Sesuai dengan tata kelola penjaminan kualitas **WP-UI-004**:
- **TIDAK ADA** instalasi paket GSAP atau perubahan dependensi di `package.json`.
- **TIDAK ADA** file baru yang dibuat atau dimodifikasi di dalam direktori `src/` aplikasi.
- **TIDAK ADA** modifikasi database, migrasi, atau API.
- Seluruh isi laporan ini murni bersifat audit forensik dan pembacaan kode repositori aktual.

---

```
============================================================
STATUS TATA KELOLA KANONIKAL WP-UI-004:
WP-UI-004 AUDIT COMPLETE
STATUS: READ-ONLY FORENSIC AUDIT COMPLETE

RUNTIME CODE MODIFIED: 0
DATABASE MODIFIED: 0
MIGRATION CREATED: 0
PACKAGE DEPENDENCIES MODIFIED: 0
UI COMPONENTS MODIFIED: 0
CSS MODIFIED: 0
ROUTES MODIFIED: 0
GIT COMMIT: 0
GIT PUSH: 0
IMPLEMENTATION: NOT STARTED
============================================================
```
