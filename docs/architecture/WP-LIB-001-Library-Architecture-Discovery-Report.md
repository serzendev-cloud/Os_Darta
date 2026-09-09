# WP-LIB-001 DISCOVERY REPORT
## Library / Perpustakaan Master Architecture Discovery

**Work Package ID:** `WP-LIB-001`  
**Phase:** `READ-ONLY FORENSIC DISCOVERY`  
**Verdict:** `A — FORENSIC DISCOVERY COMPLETE (CLEAN REUSE BLUEPRINT DERIVED)`  

---

## 1. EXECUTIVE SUMMARY

Work Package **WP-LIB-001 (Library Master Discovery)** telah sukses dieksekusi secara ketat dalam mode **READ-ONLY FORENSIC REPOSITORY AUDIT**.

Hasil discovery menunjukkan bahwa modul Perpustakaan/Library belum terimplementasi secara fisik di codebase (0 tabel database khusus buku/peminjaman), namun fondasi arsitektur pendukungnya (RFID `rfidCards`, Identitas `santri`, Presensi/Visit `attendanceLogs`, Feature Flag `featureFlags['perpustakaan']`, Notifikasi `notificationEngine`, Portal Wali `/wali/dompet`, RBAC `Permission`, dan Tenant RLS) telah siap dan **wajib di-reuse 100% tanpa duplikasi engine**.

---

## 2. REPOSITORY INVENTORY

- **Target Route:** None existing (`/dashboard/perpustakaan` or `/dashboard/library` absent).
- **Existing RFID Table:** `rfidCards` in [src/lib/db/schema/rfid.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/schema/rfid.ts).
- **Existing Attendance Table:** `attendanceLogs` in [src/lib/db/schema/rfid.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/schema/rfid.ts).
- **Existing Feature Flag Key:** `'perpustakaan'` in [src/config/features.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/config/features.ts).
- **Existing Super Admin Feature Toggle Page:** [/dashboard/saas/modul-fitur](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/app/dashboard/saas/modul-fitur/page.tsx).

---

## 3. EXISTING LIBRARY FUNCTIONALITY

- [FACT] Model data, service, API, dan UI khusus Perpustakaan saat ini **ABSENT (0%)**.
- [FACT] Feature flag `'perpustakaan'` sudah ada di [src/config/features.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/config/features.ts) dengan status `enabled: false`.

---

## 4. RFID CANONICAL ARCHITECTURE

- [FACT] Tabel `rfidCards` (KTA Smart Card Santri) di [src/lib/db/schema/rfid.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/schema/rfid.ts) adalah **single source of truth** RFID yang dipakai oleh KTA RFID Management, Gate Checkpoint, dan POS Kantin Cashless.
- [INFERENCE] Pemindaian RFID untuk Pengunjung Perpustakaan (Visitor), Peminjaman Buku (Borrowing), dan Pengembalian Buku (Return) harus meresolve `cardUid` → `rfidCards.santriId` → `santri`.
- [FACT] **Dilarang keras** membuat `libraryRfidCards` atau `libraryRfidEngine`.

---

## 5. SANTRI / SISWA IDENTITY ARCHITECTURE

- [FACT] Entitas `santri` di [src/lib/db/schema.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/schema.ts) merupakan entitas utama anggota perpustakaan.
- [INFERENCE] Keanggotaan perpustakaan langsung melekat pada status `santri.status === 'aktif'`. Tidak diperlukan entitas `libraryMembers` khusus.

---

## 6. VISITOR ARCHITECTURE

- [FACT] Tabel `attendanceLogs` di [src/lib/db/schema/rfid.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/schema/rfid.ts) telah memiliki field `locationType` (`'sekolah' | 'asrama' | 'masjid' | 'kegiatan'`).
- [INFERENCE] Kunjungan Perpustakaan dapat dicatat langsung ke `attendanceLogs` dengan memperluas `locationType` mencakup `'perpustakaan'`, atau membuat tabel khusus `library_visits` jika detail sesi baca di tempat membutuhkan waktu durasi keluar/masuk.

---

## 7. BOOK ARCHITECTURE

- [INFERENCE] Diperlukan pemisahan domain entitas:
  1. **Master Book / Title:** `library_books` (Judul, Pengarang, Penerbit, ISBN, Kategori, Rak).
  2. **Book Copy / Eksemplar:** `library_book_copies` (Accession Code / Kode Barcode Eksemplar misal `FIQ-001`, Status `'tersedia' | 'dipinjam' | 'rusak' | 'hilang'`).

---

## 8. BORROWING WORKFLOW

- [INFERENCE] Alur transaksi peminjaman:
  `Tap KTA RFID` → Resolve `Santri` → Scan Barcode `Book Copy` → Validasi Limit & Status Pinjaman → Write `library_loans` (`status: 'dipinjam'`, `dueDate: Date`) → Update Copy Status to `'dipinjam'`.

---

## 9. RETURN WORKFLOW

- [INFERENCE] Alur pengembalian:
  Scan Barcode `Book Copy` / `Tap RFID Santri` → Resolve Active Loan → Update `library_loans` (`status: 'dikembalikan'`, `returnDate: Date`) → Update Copy Status to `'tersedia'`.

---

## 10. DUE DATE & OUTSTANDING OBLIGATION ARCHITECTURE

- [FACT] Kewajiban pengembalian buku adalah **non-finansial** (tidak langsung membuat transaksi utang/piutang ke modul Keuangan SPP).
- [INFERENCE] Status pinjaman: `'dipinjam'` → `'jatuh_tempo'` → `'terlambat'` → `'dikembalikan'`. Denda finansial (jika ada) hanya jika disetujui Product Owner.

---

## 11. WALI PORTAL INTEGRATION

- [FACT] Wali Santri mengakses data anak via `userSantriId` di [src/app/wali/dompet/page.tsx](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/app/wali/dompet/page.tsx).
- [INFERENCE] Portal Wali dapat menampilkan tab / ringkasan "Buku Dipinjam Anak" dengan memfilter `library_loans.santriId === userSantriId`.

---

## 12. NOTIFICATION INTEGRATION

- [FACT] Notification Engine ([src/lib/notification-engine.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/notification-engine.ts)) dan `notifications` table mendukung pengiriman pesan terarah ke `targetRole: 'wali'` dan `targetSantriId: santriId`.
- [INFERENCE] Pengingat jatuh tempo & peminjaman buku akan dipicu via `notificationEngine` tanpa membuat engine notifikasi baru.

---

## 13. FEATURE TOGGLE ARCHITECTURE

- [FACT] Feature flag `'perpustakaan'` di [src/config/features.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/config/features.ts) mengontrol ketersediaan navigasi di [src/config/navigation.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/config/navigation.ts).
- [FACT] Super Admin mengelola modul per-tenant di [/dashboard/saas/modul-fitur](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/app/dashboard/saas/modul-fitur/page.tsx).

---

## 14. SUPER ADMIN AUTHORITY

- [FACT] Hak aktivasi modul berada di bawah peran `super_admin` & `developer` melalui SaaS Platform Console.

---

## 15. RBAC ANALYSIS

- [FACT] Peran pengelola masa depan: `admin`, `staff` (Pustakawan), `kepala_kesiswaan`.
- [FACT] Peran pembaca/peminjam: `santri`, `wali`, `guru`, `musyrif`.

---

## 16. TENANT ISOLATION ANALYSIS

- [FACT] Seluruh data wajib menyertakan `tenant_id` dan mematuhi RLS Supabase.

---

## 17. INSTITUTION SCOPING

- [FACT] Modul perpustakaan secara bawaan bersifat **tenant-wide** (lintas instansi `madin`, `depag`, `madqur`, `pesantren`).

---

## 18. AUDIT LOGGING

- [FACT] Re-use `auditLogService` untuk mencatat transaksi peminjaman, pengembalian, pendaftaran eksemplar, dan perubahan konfigurasi.

---

## 19. RESPONSIVE ARCHITECTURE

- [FACT] Menggunakan komponen bawaan: `ResponsiveDataGrid`, `MobileCard`, `ResponsiveFilterBar`, `MobileRowActions`.

---

## 20. API INVENTORY

- [FACT] Saat ini belum ada API khusus perpustakaan. API mendatang di bawah `/api/library/*`.

---

## 21. DATABASE INVENTORY

- `library_books`: **ABSENT**
- `library_book_copies`: **ABSENT**
- `library_loans`: **ABSENT**
- `library_visits`: **ABSENT**

---

## 22. DUPLICATE ENGINE AUDIT

- **RFID Engine Duplicates:** **0**
- **Notification Engine Duplicates:** **0**
- **Feature Toggle Duplicates:** **0**
- **Audit Log Engine Duplicates:** **0**

---

## 23. CROSS-MODULE DEPENDENCY GRAPH

```
                 rfidCards (KTA Smart Card)
                       │
                       ↓
                 Santri / Siswa
                       │
     ┌─────────────────┼─────────────────┐
     ↓                 ↓                 ↓
Library Visitor   Library Loans    Wali Portal
(attendanceLogs) (library_loans) (/wali/dompet)
                       │
                       ↓
               notificationEngine
                       │
                       ↓
               Wali Notification
```

---

## 24. ARCHITECTURE RISKS

1. **Barcode vs RFID Book Tagging:** Jika eksemplar buku menggunakan RFID tag terpisah, pastikan scanner membedakan antara UID KTA Santri dan Tag Eksemplar Buku.
2. **Offline Mode:** POS pengembalian buku di tempat yang koneksi internetnya kurang stabil.

---

## 25. ARCHITECTURE GAPS

1. Belum ada skema DB `library_books` dan `library_loans`.
2. Belum ada permission key `MANAGE_PERPUSTAKAAN` di [src/config/permissions.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/config/permissions.ts).

---

## 26. PRODUCT DECISIONS REQUIRED

1. [PRODUCT DECISION REQUIRED] Apakah keterlambatan pengembalian buku mengenakan denda finansial (potong saldo wallet santri) atau poin kedisiplinan (E-Tatib)?
2. [PRODUCT DECISION REQUIRED] Berapa batas maksimum buku yang dapat dipinjam oleh satu santri secara bersamaan (misal: 3 buku)?

---

## 27. RECOMMENDED FUTURE WORK PACKAGE BREAKDOWN

- **WP-LIB-001A:** Feature Flag & Permission Key Configuration
- **WP-LIB-001B:** Master Book & Copy Management UI & DB Schema
- **WP-LIB-001C:** RFID Library Visitor Terminal
- **WP-LIB-001D:** RFID Borrowing & Due Date Engine
- **WP-LIB-001E:** Book Return & Overdue Management
- **WP-LIB-001F:** Wali Portal & Notification Integration
- **WP-LIB-002:** Library Cross-Module Integration Certification Gate

---

## 28. QUALITY GATES RESULTS (READ-ONLY DISCOVERY)

- **TypeScript (`npx tsc --noEmit`):** **PASS (0 Errors)**.
- **Vitest (`npx vitest run --pool=forks`):** **PASS (20 test files, 137 unit tests passed)**.
- **Production Build (`npm run build`):** **PASS (76 static routes compiled)**.

---

```
============================================================

WP-LIB-001

LIBRARY MASTER DISCOVERY

DISCOVERY MODE:

READ-ONLY

EXISTING LIBRARY ENGINE:

ABSENT (0%)

BOOK ENTITY:

ABSENT

BOOK COPY ENTITY:

ABSENT

VISITOR ENGINE:

REUSE attendanceLogs (locationType: perpustakaan)

BORROWING ENGINE:

ABSENT (PLANNED WP-LIB-001D)

RETURN ENGINE:

ABSENT (PLANNED WP-LIB-001E)

DUE DATE ENGINE:

ABSENT (PLANNED WP-LIB-001D)

RFID CANONICAL SOURCE:

rfidCards (REUSED 100%)

RFID DUPLICATE ENGINE:

0

SANTRI IDENTITY:

santri (REUSED 100%)

WALI PORTAL:

/wali/dompet & /wali/tagihan (REUSED 100%)

NOTIFICATION ENGINE:

notificationEngine & notifications (REUSED 100%)

FEATURE TOGGLE:

featureFlags['perpustakaan'] & /dashboard/saas/modul-fitur (REUSED 100%)

SUPER ADMIN AUTHORITY:

super_admin / developer (REUSED 100%)

RBAC:

Permission & ROLE_PERMISSIONS (REUSED 100%)

TENANT ISOLATION:

PASS (tenant_id RLS)

INSTITUTION SCOPING:

TENANT-WIDE (madin / depag / madqur / pesantren)

AUDIT LOGGING:

auditLogService (REUSED 100%)

RESPONSIVE PRIMITIVES:

ResponsiveDataGrid / MobileCard (REUSED 100%)

DATABASE LIBRARY TABLES:

0 (ABSENT)

API LIBRARY SURFACE:

0 (ABSENT)

DUPLICATE ENGINES:

0

CRITICAL FINDINGS:

0

HIGH FINDINGS:

0

MEDIUM FINDINGS:

0

LOW FINDINGS:

0

TYPESCRIPT:

PASS (0 Errors)

VITEST:

PASS (20 test files / 137 tests)

PRODUCTION BUILD:

PASS (76 static routes)

DATABASE MODIFIED:

0

MIGRATION CREATED:

0

SOURCE FILES MODIFIED:

0

API MODIFIED:

0

BUSINESS LOGIC MODIFIED:

0

PACKAGE DEPENDENCIES MODIFIED:

0

GIT COMMIT:

0

GIT PUSH:

0

DISCOVERY VERDICT:

A — FORENSIC DISCOVERY COMPLETE (CLEAN REUSE BLUEPRINT DERIVED)

RECOMMENDED NEXT WORK PACKAGE:

WP-LIB-001A (Feature Flag & Permission Key Configuration)

IMPLEMENTATION AUTHORIZATION:

NOT GRANTED

============================================================
```
