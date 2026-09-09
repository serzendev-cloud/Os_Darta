# WP-UI-003 — MOTION & ANIMATION ARCHITECTURE PLANNING v1.1
## Canonical Motion Governance & GSAP Orchestration Blueprint for Enterprise SaaS

**Work Package ID:** `WP-UI-003`  
**Version:** `v1.1`  
**Status:** `LOCKED — CANONICAL`  
**Approved By:** `Product Owner`  
**Approval:** `FINAL`  
**Motion Engine:** `GSAP + Tailwind CSS Transitions`  
**Governance Role:** `Canonical Motion & Animation Architecture`  
**Parent Governance Baselines:**  
- [WP-UI-001 v1.1 — Master UI/UX Governance Baseline (LOCKED CANONICAL)](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/architecture/WP-UI-001-Master-UI-UX-Governance-Baseline.md)  
- [WP-UI-002 — UI/UX Implementation Roadmap & Prioritization Audit (APPROVED CANONICAL ROADMAP)](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/architecture/WP-UI-002-UI-UX-Implementation-Roadmap-and-Prioritization-Audit.md)  
- [WP-303 v2.2 — Central Student Affairs Domain Architecture (LOCKED CANONICAL)](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/docs/architecture/Appendix-A-Enterprise-Architecture-Standards.md)  
**Execution Safety:** `GOVERNANCE ONLY — ZERO IMPLEMENTATION (0 RUNTIME/PACKAGE/DATABASE MODIFICATIONS)`  

---

## 📋 WP-UI-003 v1.1 CHANGELOG

Berikut adalah rincian 5 poin penyelarasan arsitektur gerak (*Motion Architecture Hardening*) yang disahkan dalam revisi v1.1:

1. **Compositor-Friendly Animation Hardening (Section 13)**:
   - Diperhalus dari pembatasan absolut kaku menjadi prinsip performa: *"Prefer compositor-friendly properties such as transform and opacity for performance-sensitive motion"*.
   - Properti yang memicu layout recalculation browser (*width, height, top, left, margin, padding, border-width*) berstatus **AVOID BY DEFAULT**, namun dapat digunakan jika memiliki justifikasi UX/interaksi yang sah dan sadar performa.
   - Mengizinkan teknik lanjutan yang relevan secara teknis (*SVG animation, clip-path, CSS custom properties*).
2. **Context-Scoped ScrollTrigger & GSAP Cleanup (Section 5)**:
   - Mengganti aturan pembersihan global (`ScrollTrigger.getAll().kill()`) menjadi isolasi lokal berbasis konteks: *"Every motion component/hook MUST clean up only the GSAP and ScrollTrigger instances created within its own execution context"*.
   - Menegakkan prinsip: `LOCAL CREATION → LOCAL OWNERSHIP → LOCAL CLEANUP` tanpa interferensi lintas komponen.
3. **Pemisahan Hard Requirements vs Performance Targets (Section 20)**:
   - Mengubah metrik numerik mutlak (60 FPS & 50ms latency) menjadi **Target Performa Terukur (*Measurable Performance Targets*)**: *"Target smooth approximately 60 FPS on representative mid-tier mobile devices under normal conditions"* dan *"Touch interactions must feel immediate without animation delay"*.
   - Memisahkan secara tegas antara **Hard Requirements** (keamanan fungsional, reduced-motion, zero leak, tanpa kontaminasi logika bisnis) dan **Performance Targets**.
4. **Introduksi Konsep Kanonikal "Motion Budget" (Section 14)**:
   - Menambahkan konsep tata kelola **Motion Budget** sebagai pembatas intensitas, simultanitas, durasi, dan visual noise animasi berdasarkan konteks tugas (A: Operational Mobile Screen, B: Dense Data Screen, C: Dashboard Screen, D: Showcase/Onboarding).
5. **Mobile Motion Duration Flexibility (Section 10)**:
   - Mengganti aturan numerik statis "20–30% lebih cepat" menjadi panduan adaptif berbasis konteks: *"Mobile motion SHOULD generally be shorter, lighter, and less intrusive than equivalent desktop motion when appropriate"*, ditentukan oleh kebutuhan tugas, konten, dan performa riil.

---

## 1. EXECUTIVE SUMMARY

Dokumen **WP-UI-003 v1.1** menetapkan arsitektur dan tata kelola kanonikal untuk gerakan, transisi, dan animasi (*motion & animation architecture*) pada sistem ERP Pendidikan Pesantren Multi-Tenant **APP MA'HAD**.

Sistem antarmuka APP MA'HAD dirancang tidak hanya fungsional dan responsif, tetapi juga menghadirkan pengalaman visual yang **Elegan, Tenang, Halus, Premium, dan Bertujuan (*Purposeful*)**. Gerakan (*motion*) diposisikan sebagai **lapisan peningkatan presentasi (*presentation enhancement layer*)**, bukan pengganti arsitektur komponen, CSS standar, aksesibilitas, atau logika bisnis.

Peta jalan ini mengadopsi **GSAP (GreenSock Animation Platform)** sebagai *motion engine* utama untuk orkestrasi timeline multi-elemen, transisi konten terkoordinasi, dan visualisasi data, sembari mempertahankan CSS transitions untuk interaksi mikro sederhana.

---

## 2. EXISTING MOTION FORENSIC AUDIT

Audit mendalam berbasis kode riil (*ground-truth inspection*) terhadap seluruh repositori menghasilkan temuan status gerak saat ini:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FORENSIC AUDIT: EXISTING MOTION STATE                    │
├──────────────────────────┬──────────────────┬───────────────────────────────┤
│ DIMENSI AUDIT            │ STATUS AKTUAL    │ TEMUAN & RISIKO ARSITEKTURAL  │
├──────────────────────────┼──────────────────┼───────────────────────────────┤
│ GSAP Installation        │ NOT INSTALLED    │ Belum ada paket GSAP / @gsap  │
│ Existing Motion Engines  │ CSS Utilities    │ tw-animate-css + Tailwind CSS │
│ Motion Consistency       │ AD-HOC           │ Kelas animate-* tersebar liar │
│ Motion Tokens            │ NONE             │ Durasi & easing di-hardcode   │
│ Accessibility Safeguard  │ PARTIAL / ABSENT │ Belum ada prefers-reduced hook│
│ Lifecycle & Cleanup      │ RISK-FREE (CSS)  │ Bebas memory leak JS saat ini │
└──────────────────────────┴──────────────────┴───────────────────────────────┘
```

### Rincian Temuan Forensik:
1. **Paket Animasi Saat Ini**: Repositori saat ini mengandalkan `tw-animate-css` (`@import "tw-animate-css";` di `src/app/globals.css`) dan kelas utilitas bawaan Tailwind (`animate-spin`, `animate-pulse`, `animate-bounce`, `animate-in`, `fade-in`, `zoom-in-95`).
2. **Inkonsistensi Nilai Transisi**: Ditemukan deklarasi durasi dan easing ad-hoc yang bervariasi (`duration-100`, `duration-150`, `duration-200`, `duration-300`) tanpa token terpusat.
3. **Pola Animasi Mengganggu (*Visual Noise Anti-Pattern*)**: Terdapat penggunaan `animate-bounce` pada banner notifikasi (`CurriculumConfigClient.tsx`, `operasional/page.tsx`) dan ikon penghargaan (`AssessmentSummaryModal.tsx`) yang berpotensi memicu kelelahan visual (*visual fatigue*).
4. **Ketiadaan Proteksi Aksesibilitas Gerak**: Belum tersedia wrapper global untuk menangani preferensi pengguna OS `prefers-reduced-motion`.

---

## 3. CURRENT GSAP USAGE

- **Status Instalasi**: `GSAP is NOT installed in package.json`.
- **Status Penggunaan**: `0 instances` (Tidak ada GSAP timeline, tween, hook, atau context di kode aktif).
- **Kesiapan Arsitektur**: Membuka peluang perancangan arsitektur GSAP yang bersih dari awal (*greenfield motion architecture*) tanpa beban *technical debt* atau kode warisan.

---

## 4. EXISTING ANIMATION LIBRARIES

- **Framer Motion / Motion One**: `NOT INSTALLED` (0 instances).
- **tw-animate-css**: `INSTALLED` (`^1.4.0`) — Memberikan kelas dasar CSS keyframe untuk enter/exit dialog Radix.
- **Kebijakan Masa Depan**: Mengonsolidasi seluruh kebutuhan orkestrasi timeline dan transisi tingkat lanjut ke dalam satu engine resmi: **GSAP**. Dilarang menginstal library animasi pihak ketiga lainnya (misal: Framer Motion) untuk mencegah duplikasi runtime bundle.

---

## 5. MOTION ARCHITECTURE RECOMMENDATION

APP MA'HAD mengadopsi arsitektur gerak berlapis yang terisolasi rapi (*layered decoupled motion architecture*):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       CANONICAL MOTION ARCHITECTURE                     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                 ┌───────────────────▼───────────────────┐
                 │          UI REACT COMPONENT           │
                 │   (Server Shell / Client Island)      │
                 └───────────────────┬───────────────────┘
                                     │
                 ┌───────────────────▼───────────────────┐
                 │     MOTION PRIMITIVE / CUSTOM HOOK    │
                 │   (useGSAPContext, MotionCard,        │
                 │    FadeInStagger, PageTransition)     │
                 └───────────────────┬───────────────────┘
                                     │
                 ┌───────────────────▼───────────────────┐
                 │         CENTRAL MOTION TOKENS         │
                 │  (Duration, Ease, Stagger, Reduced)   │
                 └───────────────────┬───────────────────┘
                                     │
                 ┌───────────────────▼───────────────────┐
                 │         GSAP / CSS ENGINE CORE        │
                 │   (gsap.context, gsap.timeline)       │
                 └───────────────────┬───────────────────┘
                                     │
                 ┌───────────────────▼───────────────────┐
                 │             BROWSER DOM               │
                 │       (GPU Layer: transform/opacity)  │
                 └───────────────────────────────────────┘
```

### Rekomendasi Struktur Direktori & Utilitas (Future Standard):
```
src/
├── lib/
│   └── motion/
│       ├── tokens.ts          # Central motion tokens (duration, easing, distance)
│       ├── config.ts          # GSAP global registration & default config
│       ├── hooks/
│       │   ├── useMotion.ts       # Hook GSAP context dengan auto-cleanup on unmount
│       │   └── usePrefersReduced.ts # Hook deteksi aksesibilitas prefers-reduced-motion
│       ├── transitions/
│       │   ├── pageTransitions.ts # Preset transisi antar halaman/tab
│       │   ├── listStaggers.ts    # Preset stagger kartu & daftar data
│       │   └── drawerMotions.ts   # Preset slide-up sheet mobile
│       └── components/
│           ├── MotionContainer.tsx# Wrapper deklaratif animasi
│           └── FadeInView.tsx     # Viewport intersection animation primitive
```

### Aturan Lifecycle & Scoped Cleanup (v1.1 Hardening):
- **Isolasi Kepemilikan Gerak (*Local Scope Ownership*)**: Setiap komponen atau hook motion **hanya boleh membersihkan instance GSAP dan ScrollTrigger yang dibuat dalam konteks eksekusinya sendiri**. Dilarang menggunakan pembersihan global destruktif lintas komponen.
- **Mekanisme Utama**:
  - Wajib membungkus inisialisasi animasi dalam `gsap.context()` atau hook terisolasi `useGSAP`.
  - Pembersihan memori dilakukan secara otomatis pada siklus `ctx.revert()` saat komponen React di-unmount.
  - ScrollTrigger lokal di-attach langsung ke konteks GSAP sehingga ter-revert secara otomatis tanpa mengganggu ScrollTrigger pada halaman lain.

---

## 6. MOTION DESIGN LANGUAGE (IDENTITAS VISUAL GERAK)

Gerakan dalam APP MA'HAD harus merefleksikan karakter institusi pendidikan Islam modern:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     THE 6 PILLARS OF MA'HAD MOTION                          │
├─────────────────┬───────────────────────────────────────────────────────────┤
│ 1. ELEGANT      │ Halus, anggun, dengan kurva perlambatan alami (smooth decel)│
│ 2. CALM         │ Tidak tergesa-gesa, tidak memantul liar (no cartoon bounce) │
│ 3. REFINED      │ Presisi tinggi, durasi ringkas (150ms–350ms), tanpa jeda  │
│ 4. PREMIUM      │ Menggunakan kurva bezier mewah (cubic-bezier / power2.out) │
│ 5. SUBTLE       │ Perubahan mikro yang terasa nyaman tanpa menarik perhatian│
│ 6. PURPOSEFUL   │ Setiap animasi wajib memiliki fungsi orientasi / hierarki  │
└─────────────────┴───────────────────────────────────────────────────────────┘
```

> **PRINSIP EMAS:** *"Good UI first, motion second."* Animasi tidak boleh digunakan untuk menutupi kelemahan tata letak, hierarki teks yang buruk, atau kontras yang lemah.

---

## 7. MOTION HIERARCHY (HIERARKI TINGKAT GERAK)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         5-LEVEL MOTION HIERARCHY                            │
├─────────┬───────────────────┬──────────────────┬────────────────────────────┤
│ LEVEL   │ KATEGORI          │ ENGINE TERBAIK   │ CONTOH PENERAPAN           │
├─────────┼───────────────────┼──────────────────┼────────────────────────────┤
│ LEVEL 0 │ Static (No Motion)│ None             │ Tabel data massal, audit   │
│ LEVEL 1 │ Micro-Interaction │ CSS Transition   │ Hover tombol, focus ring   │
│ LEVEL 2 │ Component State   │ CSS / Radix      │ Dropdown open, Accordion   │
│ LEVEL 3 │ Content Stagger   │ GSAP Timeline    │ Stagger kartu dashboard    │
│ LEVEL 4 │ Sheet / Drawer    │ GSAP / CSS       │ Mobile bottom sheet slide  │
│ LEVEL 5 │ Showcase / Splash │ GSAP Timeline    │ Onboarding, KPI milestones │
└─────────┴───────────────────┴──────────────────┴────────────────────────────┘
```

---

## 8. GSAP VS CSS RULES (BATASAN TEKNOLOGI)

| Skenario Interaksi Antarmuka | Pilihan Engine | Alasan Teknis & Arsitektural |
| :--- | :--- | :--- |
| **Hover Tombol / Card Hover Elevation** | **CSS Transition** | Ringan, ditangani native oleh compositor thread browser. |
| **Focus State / Active Ring** | **CSS Transition** | Aksesibilitas instan tanpa overhead eksekusi JavaScript. |
| **Buka/Tutup Accordion & Dropdown** | **CSS / Base-UI** | Cukup menggunakan transisi CSS height/opacity bawaan Radix. |
| **Stagger Kartu Metrik Dashboard** | **GSAP Timeline** | Membutuhkan delay berurutan yang terorkestrasi rapi. |
| **Slide-Up Bottom Sheet Mobile** | **GSAP / Radix** | Gesture handling, spring easing, dan koordinasi backdrop. |
| **Dossier Santri 360 Expand** | **GSAP Timeline** | Transformasi multi-komponen simultan (avatar + chart + info). |
| **Live Poin Pelanggaran Progress Bar**| **GSAP Tween** | Interpolasi nilai numerik dinamis dan animasi fill bar. |
| **Interactive Chart Entry** | **GSAP / Recharts**| Koordinasi pemunculan grafik agregat pada pelaporan. |

---

## 9. MOTION TOKENS (SISTEM TOKEN GERAK TERPUSAT)

Semua parameter gerak distandardisasi ke dalam token konstan agar tidak ada nilai acak yang tersebar di komponen:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CENTRAL MOTION TOKEN MATRIX                           │
├────────────┬────────────────────┬───────────────────────────────────────────┤
│ KATEGORI   │ TOKEN              │ NILAI KANONIKAL & PENGGUNAAN              │
├────────────┼────────────────────┼───────────────────────────────────────────┤
│ Durasi     │ `duration.instant` │ 100ms (Micro hover, active feedback)      │
│            │ `duration.fast`    │ 180ms (Dropdown, tooltip, chip toggle)    │
│            │ `duration.normal`  │ 260ms (Dialog, bottom sheet, tab switch)  │
│            │ `duration.smooth`  │ 350ms (Page stagger, complex card reveal) │
│            │ `duration.hero`    │ 500ms (Showcase, splash, KPI celebration) │
├────────────┼────────────────────┼───────────────────────────────────────────┤
│ Easing     │ `ease.standard`    │ `cubic-bezier(0.2, 0.0, 0.0, 1.0)` / p2.out│
│            │ `ease.enter`       │ `cubic-bezier(0.0, 0.0, 0.2, 1.0)` (Decel)│
│            │ `ease.exit`        │ `cubic-bezier(0.4, 0.0, 1.0, 1.0)` (Accel)│
│            │ `ease.gentle`      │ `power1.out` (Subtle UI opacity shifts)   │
├────────────┼────────────────────┼───────────────────────────────────────────┤
│ Jarak (Y)  │ `distance.subtle`  │ 4px (Micro hover lift)                    │
│            │ `distance.sm`      │ 8px (Dropdown / tooltip slide)            │
│            │ `distance.md`      │ 16px (Card stagger entry)                 │
│            │ `distance.lg`      │ 32px (Section reveal)                     │
├────────────┼────────────────────┼───────────────────────────────────────────┤
│ Stagger    │ `stagger.fast`     │ 0.03s per item (Max 8 items = ~240ms)     │
│            │ `stagger.normal`   │ 0.05s per item (Max 5 items = ~250ms)     │
└────────────┴────────────────────┴───────────────────────────────────────────┘
```

---

## 10. MOBILE-FIRST MOTION RULES (v1.1 REFINED)

1. **Prinsip Durasi Ringkas & Tidak Mengganggu (*Shorter & Lighter Guidance*)**:
   - Gerakan di perangkat seluler **sebaiknya lebih ringkas, ringan, dan tidak mengganggu alur kerja (*should generally be shorter, lighter, and less intrusive*)** dibanding versi desktop.
   - Durasi bersifat adaptif (*task-driven, content-driven, and performance-driven*). Animasi tertentu diizinkan memakai durasi identik jika konsistensi visual lintas perangkat lebih diutamakan.
2. **Sentuhan Instan (*Instant Touch Response*)**:
   - Feedback sentuhan tombol dan kartu harus merespons secara instan pada event `touchstart` / `active:scale-[0.98]` tanpa lag.
3. **Swipe-Driven Bottom Sheet**:
   - Transisi sheet mobile harus terikat dengan kecepatan gesture sapuan jari (*velocity-aware swipe dismissal*).
4. **No Horizontal Parallax on Mobile**:
   - Dilarang keras menggunakan efek parallax horizontal pada mobile yang dapat memicu ketidaksengajaan trigger gesture back browser.

---

## 11. DESKTOP MOTION RULES

1. **Subtle Hover Elevation**:
   - Kartu interaktif dan baris tabel dapat menggunakan transisi elevasi halus (`hover:-translate-y-[2px] hover:shadow-md duration-200`).
2. **Coordinated Multi-Column Reveal**:
   - Saat membuka dashboard atau panel Student 360, panel samping dan grafik tengah muncul secara terkoordinasi (*orchestrated stagger*).
3. **Tooltip & Action Bar Smoothing**:
   - Tooltip keyboard shortcuts dan toolbar mengambang muncul dengan transisi halus tanpa flicker.

---

## 12. ACCESSIBILITY & REDUCED MOTION

> **ATURAN MANDATORI (HARD REQUIREMENT):** Seluruh animasi yang menggunakan GSAP atau CSS wajib menghormati preferensi sistem operasi `@media (prefers-reduced-motion: reduce)`.

```typescript
// Konsep Pola Aksesibilitas:
export function useMotionConfig() {
  const prefersReduced = usePrefersReducedMotion();
  return {
    duration: prefersReduced ? 0 : defaultDuration,
    stagger: prefersReduced ? 0 : defaultStagger,
    animate: !prefersReduced,
  };
}
```

### Ketentuan Wajib:
- Jika `prefers-reduced-motion` aktif, seluruh transisi perpindahan jarak (*movement/translate*) dinonaktifkan (`distance = 0`), elemen langsung tampil pada posisi final dengan transisi opasitas murni atau instan.
- Konten dan informasi **tidak boleh bergantung pada selesainya animasi untuk dapat dibaca atau diakses**.

---

## 13. PERFORMANCE RULES & COMPOSITOR PREFERENCE (v1.1 HARDENED)

### Prinsip Utama: *Performance by Default, Not Artificial Restriction*
1. **Preferensi Properti Compositor-Friendly**:
   - Utamakan properti yang diproses pada thread GPU Compositor: **`transform` (`x`, `y`, `scale`)** dan **`opacity`** untuk seluruh animasi performa tinggi.
2. **Status Properti Pemicu Layout (*Avoid by Default*)**:
   - Properti yang memicu *layout recalculation* (`width`, `height`, `top`, `left`, `margin`, `padding`, `border-width`) **dihindari secara default (*avoid by default*)**, namun diizinkan bila terdapat kebutuhan UX yang sah (misal: transisi accordion dinamis) dengan implementasi yang terukur.
3. **Dukungan Teknik Lanjutan Berdasar Kebutuhan**:
   - Diizinkan menggunakan animasi SVG, `clip-path`, dan manipulasi CSS Custom Properties untuk kebutuhan visualisasi ornamen dan data yang tervalidasi ringan.

---

## 14. MOTION BUDGET (CANONICAL GOVERNANCE CONCEPT)

> **DEFINISI KANONIKAL:**  
> **"Motion Budget is a UX constraint that limits the amount, simultaneity, duration, and visual intensity of animation within a given interaction context."**  
> *Motion Budget adalah batasan UX yang membatasi jumlah, simultanitas, durasi, dan intensitas visual animasi dalam konteks interaksi tertentu agar antarmuka tetap bersih, tenang, dan fokus pada tugas.*

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MOTION BUDGET BY INTERACTION CONTEXT                     │
├────────────────────────────────┬────────────────────────────────────────────┤
│ KONTEKS TUGAS / LAYAR          │ ALOKASI BUDGET GERAK & ATURAN              │
├────────────────────────────────┼────────────────────────────────────────────┤
│ A. Operational Mobile Screen   │ • BUDGET SANGAT MINIMAL                    │
│    (Catat Pelanggaran, UKS,    │ • 1 primary transition / feedback sentuh   │
│     Presensi Gerbang Satpam)   │ • Dilarang simultaneous card staggers      │
│                                │ • Fokus 100% pada kecepatan input data     │
├────────────────────────────────┼────────────────────────────────────────────┤
│ B. Dense Data / Admin Screen   │ • BUDGET SANGAT TERBATAS                   │
│    (Tabel Santri, Ledger SPP,  │ • State transition & modal reveal halus    │
│     Audit Log, Master Data)    │ • Dilarang animasi dekoratif pada dataset  │
├────────────────────────────────┼────────────────────────────────────────────┤
│ C. Dashboard / Executive Screen│ • BUDGET SEDANG (KOORDINASI ELEGAN)        │
│    (Helicopter View, KPI,      │ • Stagger kartu metrik terkoordinasi       │
│     Student 360 Dossier)       │ • Entry transisi chart & rekap visual      │
├────────────────────────────────┼────────────────────────────────────────────┤
│ D. Showcase / Onboarding       │ • BUDGET TERBESAR                          │
│    (Login Welcome, Onboarding, │ • GSAP orchestrated visual storytelling    │
│     Pencapaian Prestasi Santri)│ • Tetap wajib patuh reduced-motion & a11y  │
└────────────────────────────────┴────────────────────────────────────────────┘
```

---

## 15. BUSINESS LOGIC SEPARATION

Motion **hanya dan selalu merupakan lapisan presentasi visual**.

```
[ Domain Policy / Backend Engine ]
              ↓
  (Hitung Poin, Status SP, Validasi Kuota)
              ↓
[ React State Management ]
              ↓
[ UI Presentation Component ]
              ↓
[ Motion Enhancement Layer ] ──► Hanya memvisualisasikan perubahan state!
```

> **ATURAN MUTLAK:** GSAP dilarang memuat logika percabangan bisnis, penentuan sanksi hukuman, kalkulasi poin pelanggaran, atau verifikasi RBAC.

---

## 16. ROLE-AWARE MOTION

- **Prinsip**: Peran menentukan *otoritas*, perangkat menentukan *presentasi*, gerak menyempurnakan *umpan balik*.
- **Contoh Kontekstual**:
  - *Musyrif di Lapangan*: Memerlukan animasi konfirmasi super-cepat (150ms checkmark ripple) saat mencatat presensi asrama.
  - *Pimpinan di Dashboard Eksekutif*: Menerima transisi grafik agregat yang tenang dan berwibawa (300ms smooth reveal).

---

## 17. CANDIDATE MOTION AUDIT (INVENTARISASI AREA KANDIDAT)

Berdasarkan audit repositori nyata, berikut adalah klasifikasi kelayakan penerapan gerak:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MOTION CANDIDATE FEASIBILITY MATRIX                      │
├──────────────────────────┬──────────────┬───────────────────────────────────┤
│ AREA / KOMPONEN REPOSTORI│ KELAYAKAN    │ JUSTIFIKASI & REKOMENDASI POLA    │
├──────────────────────────┼──────────────┼───────────────────────────────────┤
│ Dashboard Stats Stagger  │ HIGH VALUE   │ Stagger halus 3 kartu metrik awal │
│ Bottom Sheet Slide Mobile│ HIGH VALUE   │ Transisi buka/tutup lembar sentuh │
│ Student 360 Dossier Card │ HIGH VALUE   │ Transisi ekspansi profil santri   │
│ Live Point Bar Update    │ HIGH VALUE   │ Interpolasi progress pelanggaran  │
│ Gate RFID Scan Feedback  │ HIGH VALUE   │ Ripple indikator hijau/merah      │
│ Modal Dialog Enter/Exit  │ MEDIUM VALUE │ Fade-in zoom-in 95 halus          │
│ Tab Switch Content       │ MEDIUM VALUE │ Transisi slide/fade horizontal    │
│ Table Multi-Row Stagger  │ DO NOT ANIM  │ Memperlambat render data massal   │
│ Form Input Typing        │ DO NOT ANIM  │ Mengganggu kecepatan pengetikan   │
│ Static Banner Bounce     │ DO NOT ANIM  │ Hapus animate-bounce yang ada     │
└──────────────────────────┴──────────────┴───────────────────────────────────┘
```

---

## 18. MOTION ANTI-PATTERNS POLICY

Berikut adalah hal-hal yang **DILARANG SECARA ARSITEKTURAL**:
1. Mengubah aplikasi bisnis menjadi pameran efek visual (*animation showcase*).
2. Menambahkan efek partikel, kilau berlebihan, atau gelombang 3D berat yang menguras baterai smartphone santri/wali/guru.
3. Memberikan delay visual (> 100ms) sebelum data hasil pencarian muncul ke layar.

---

## 19. WP-UI-002 INTEGRATION MAP

Peta integrasi motion ke dalam Work Packages roadmap kanonikal:

```
WP-UI-010 (Responsive Foundation)
   └── Integrasikan Motion Tokens & CSS transition standard

WP-UI-020 (Data Presentation Primitives)
   └── Integrasikan card entry transition & layout expand

WP-UI-030 (Mobile Critical Operations)
   └── Integrasikan mobile bottom sheet physics & instant touch feedback

WP-UI-050 (Form & Modal Standardization)
   └── Integrasikan GSAP context dialog/sheet transitions

WP-UI-070 (Desktop Optimization)
   └── Integrasikan coordinated dashboard stagger & dossier 360

WP-UI-080 (Accessibility & Performance)
   └── Hardening prefers-reduced-motion & GPU memory leak cleanup
```

---

## 20. ACCEPTANCE CRITERIA (HARD REQUIREMENTS VS PERFORMANCE TARGETS)

### 🔴 Hard Requirements (Syarat Mutlak Lolos Rilis):
1. **Zero Unmounted Leaks**: 100% animasi GSAP terisolasi dalam `gsap.context()` dan bersih saat komponen di-unmount.
2. **Reduced Motion Compliance**: Mode `prefers-reduced-motion: reduce` menonaktifkan pergeseran jarak non-esensial 100%.
3. **No Business Contamination**: 0 baris logika bisnis terikat pada callback animasi.
4. **No Blocking Interactions**: Animasi tidak boleh membekukan input atau menunda akses data.
5. **No Accessibility Regression**: Kontras, fokus keyboard, dan keterbacaan screen reader tetap terjaga 100%.

### 🎯 Performance Targets (Target Performa Terukur):
1. **Smooth 60 FPS Target**: Menargetkan performa mendekati 60 FPS pada perangkat smartphone kelas menengah (*representative mid-tier mobile*) dalam kondisi operasional wajar.
2. **Immediate Touch Latency**: Interaksi sentuh terasa instan tanpa penundaan persepsi yang diakibatkan animasi.
3. **Minimal Overhead**: Penggunaan CPU/GPU tambahan berada pada ambang batas efisien.

---

## 21. FUTURE MOTION WORK PACKAGES BREAKDOWN

Jika diotorisasi oleh Product Owner di masa depan, implementasi motion dibagi menjadi 3 sub-paket terisolasi:

1. **`WP-UI-003A` — Motion Foundation & Token System**:
   - Instalasi GSAP resmi, pembuatan `src/lib/motion/tokens.ts`, `useMotion.ts`, dan wrapper `prefers-reduced-motion`.
2. **`WP-UI-003B` — Core Component & Mobile Motion Integration**:
   - Penerapan transisi Bottom Sheet, Dialog, Tab switcher, dan micro-interactions.
3. **`WP-UI-003C` — Dashboard & Student 360 Orchestration**:
   - Penerapan coordinated timeline pada dashboard agregat dan visualisasi dossier santri.

---

## 22. EXPLICIT "NO IMPLEMENTATION" DECLARATION

Sesuai mandat tata kelola perencanaan **WP-UI-003 v1.1**:
- Tidak ada instalasi paket GSAP atau perubahan `package.json`.
- Tidak ada kode aplikasi, komponen UI, atau CSS runtime yang dimodifikasi.
- Tidak ada file animasi baru yang dibuat di dalam direktori `src/`.
- Seluruh isi dokumen ini berstatus rencana arsitektur kanonikal yang menunggu ulasan final Product Owner.

---

## 23. FINAL GOVERNANCE NOTICE

WP-UI-003 v1.1 has been reviewed and formally approved by the Product Owner.

The document is now **LOCKED — CANONICAL** and serves as the authoritative Motion & Animation Architecture for APP MA'HAD.

Any future deviation requires explicit Product Owner approval through UI/UX Change Control.

Locking this document does not constitute implementation authorization.

---

```
============================================================
WP-UI-003 v1.1
FINAL LOCK COMPLETE

STATUS:
LOCKED — CANONICAL

APPROVED BY:
PRODUCT OWNER

APPROVAL:
FINAL

RUNTIME CODE MODIFIED: 0
DATABASE MODIFIED: 0
MIGRATION CREATED: 0
PACKAGE DEPENDENCIES MODIFIED: 0
UI COMPONENTS MODIFIED: 0
CSS MODIFIED: 0
GIT COMMIT: 0
GIT PUSH: 0
IMPLEMENTATION: NOT AUTHORIZED
============================================================
```
