# CANONICAL SOURCE OF TRUTH & KEPUTUSAN AKTIF

Dokumen ini menetapkan **Dokumen Sumber Kebenaran Utama (Canonical Source of Truth)** dan **Keputusan Arsitektur Aktif (Active Architecture Decisions)** untuk arsitektur, domain bisnis, tata kelola data, dan antarmuka sistem SaaS Multi-Tenant. Setiap keputusan teknis dan implementasi kode wajib merujuk pada hierarki dan kontrak dokumen-dokumen ini.

---

## 1. Dokumen Sumber Kebenaran Kanonikal

| No | Dokumen Acuan | Tingkat Otoritas | Cakupan Domain & Spesifikasi |
| :-: | :--- | :---: | :--- |
| 1 | [AGENTS.md](file:///e:/Projects/Os_Darta/AGENTS.md) | **Level S0** | Visi Produk 10 Tahun, Kemitraan Arsitektural, Layanan Pesantren & Sekolah Umum, serta Konfigurabilitas Terminologi Per Tenant. |
| 2 | [EARS-Part-1-Enterprise-Foundation.md](file:///e:/Projects/Os_Darta/docs/architecture/EARS-Part-1-Enterprise-Foundation.md) | **Level S1** | Fondasi Arsitektur Enterprise, Prinsip Desain Multi-Tenant Skala Besar, dan Tata Kelola Invarian Sistem. |
| 3 | [EARS-Part-3-Core-Platform-Architecture.md](file:///e:/Projects/Os_Darta/docs/architecture/EARS-Part-3-Core-Platform-Architecture.md) | **Level S1** | Arsitektur Inti Platform SaaS, Boundary Isolasi Tenant, Resolusi Domain/Host, dan Mekanisme Multi-Tenancy. |
| 4 | [EARS-Part-5-Enterprise-Data-Architecture.md](file:///e:/Projects/Os_Darta/docs/architecture/EARS-Part-5-Enterprise-Data-Architecture.md) | **Level S1** | Desain Arsitektur Data, Relational Schema Guidelines, Standar Drizzle ORM, dan Penegakan PostgreSQL Row-Level Security (RLS). |
| 5 | [Sprint-1-WP-101-Phase-1B-Identity-RBAC-Schema-Contract.md](file:///e:/Projects/Os_Darta/docs/architecture/Sprint-1-WP-101-Phase-1B-Identity-RBAC-Schema-Contract.md) | **Level S1** | Kontrak Skema Identitas Pengguna, Role Platform, Role Tenant, Keanggotaan Tenant (`user_tenant_memberships`), dan Otorisasi Hak Akses. |
| 6 | [SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md](file:///e:/Projects/Os_Darta/docs/architecture/SPESIFIKASI-DOMAIN-ADMINISTRASI-KEUANGAN-MAHAD.md) | **Level S1** | Spesifikasi Finansial Lengkap: Billing SPP, Rencana & Jadwal Cicilan, Cashless POS/Kantin, Wallet RFID, dan Audit CCTV Digital. |
| 7 | [WP-UI-001-Master-UI-UX-Governance-Baseline.md](file:///e:/Projects/Os_Darta/docs/architecture/WP-UI-001-Master-UI-UX-Governance-Baseline.md) | **Level S1** | Standar Desain Sistem, Responsivitas Mobile/Tablet/Desktop, Komponen UI, Touch Target Primitives, dan Pedoman Interaksi Pengguna. |

*(Catatan: Dokumen konseptual lama seperti `Sprint-1-Domain-Architecture.md` telah diarsipkan ke `docs/archive/` karena masih mengandalkan skema legacy `masterJenjang` / `masterTingkat`).*

---

## 2. Keputusan Aktif (`docs/decisions/`)

Berikut adalah daftar dokumen keputusan arsitektur aktif yang mengikat spesifikasi teknis platform:

1. [WP-ACADEMIC-PLACEMENT-DOMAIN-DECISION-001-REPORT.md](file:///e:/Projects/Os_Darta/docs/decisions/WP-ACADEMIC-PLACEMENT-DOMAIN-DECISION-001-REPORT.md)  
   *Tujuan:* Menetapkan model penempatan santri berbasis *placement ledger* per madrasah tanpa memutasi atau merusak riwayat penempatan lampau.
2. [WP-ACADEMIC-PLACEMENT-DOMAIN-REFINEMENT-002-REPORT.md](file:///e:/Projects/Os_Darta/docs/decisions/WP-ACADEMIC-PLACEMENT-DOMAIN-REFINEMENT-002-REPORT.md)  
   *Tujuan:* Menyempurnakan tata kelola *transit pool* santri dan mencegah *database pollution* pada transisi kenaikan tingkat/rombel.
3. [WP-ACADEMIC-CONTEXT-BOUNDARY-001-REPORT.md](file:///e:/Projects/Os_Darta/docs/decisions/WP-ACADEMIC-CONTEXT-BOUNDARY-001-REPORT.md)  
   *Tujuan:* Menetapkan batas konteks (*bounded context*) formal antara Struktur Akademik, Master Kesiswaan, dan Transaksi Penempatan.
4. [WP-ACADEMIC-STRUCTURE-SCHEMA-001-REPORT.md](file:///e:/Projects/Os_Darta/docs/decisions/WP-ACADEMIC-STRUCTURE-SCHEMA-001-REPORT.md)  
   *Tujuan:* Menetapkan spesifikasi skema normalisasi database Drizzle untuk hirarki `madrasah`, `jenjang`, `tingkat`, dan `rombel` beserta *composite foreign keys*.
5. [WP-ACADEMIC-STRUCTURE-CLOSURE-001-REPORT.md](file:///e:/Projects/Os_Darta/docs/decisions/WP-ACADEMIC-STRUCTURE-CLOSURE-001-REPORT.md)  
   *Tujuan:* Mengesahkan penutupan perancangan struktur akademik modular dan rencana transisi dari kolom legasi `santri.kelas`.
6. [WP-ACADEMIC-STRUCTURE-DOMAIN-CLOSURE-003-REPORT.md](file:///e:/Projects/Os_Darta/docs/decisions/WP-ACADEMIC-STRUCTURE-DOMAIN-CLOSURE-003-REPORT.md)  
   *Tujuan:* Menutup konsolidasi domain struktur akademik multi-institusi serta memisahkan siklus tahun ajaran dari katalog struktur permanen.
7. [WP-ACADEMIC-STRUCTURE-RLS-APPLICATION-CONTEXT-VERIFICATION-001-REPORT.md](file:///e:/Projects/Os_Darta/docs/decisions/WP-ACADEMIC-STRUCTURE-RLS-APPLICATION-CONTEXT-VERIFICATION-001-REPORT.md)  
   *Tujuan:* Memverifikasi kepatuhan dan integritas isolasi multi-tenant Row-Level Security (RLS) pada tabel-tabel hirarki struktur akademik.
8. [WP-MULTITENANT-ISOLATION-AUDIT-001.md](file:///e:/Projects/Os_Darta/docs/decisions/WP-MULTITENANT-ISOLATION-AUDIT-001.md)  
   *Tujuan:* Menetapkan audit forensik dan standar penegakan isolasi data multi-tenant tanpa toleransi kebocoran lintas institusi.
9. [WP-SAAS-SUBSCRIPTION-ENTITLEMENT-ARCHITECTURE-001-REPORT.md](file:///e:/Projects/Os_Darta/docs/decisions/WP-SAAS-SUBSCRIPTION-ENTITLEMENT-ARCHITECTURE-001-REPORT.md)  
   *Tujuan:* Mengatur arsitektur pembatasan fitur, modul berlangganan (*entitlement*), dan kuota santri per tenant SaaS.
10. [WP-GATE03-GURU-TENANT-BOUNDARY-DECISION-001.md](file:///e:/Projects/Os_Darta/docs/decisions/WP-GATE03-GURU-TENANT-BOUNDARY-DECISION-001.md)  
    *Tujuan:* Menetapkan batasan tenant yang ketat bagi data guru/pengajar serta mekanisme penugasan kelas per institusi.
11. [WP-GATE04-DATABASE-RLS-ARCHITECTURE-DECISION-001.md](file:///e:/Projects/Os_Darta/docs/decisions/WP-GATE04-DATABASE-RLS-ARCHITECTURE-DECISION-001.md)  
    *Tujuan:* Menetapkan strategi arsitektur isolasi basis data menggunakan PostgreSQL Row-Level Security (RLS) untuk menangkal celah IDOR.
12. [WP-NIS-TENANT-SCOPED-ARCHITECTURAL-DECISION-001.md](file:///e:/Projects/Os_Darta/docs/decisions/WP-NIS-TENANT-SCOPED-ARCHITECTURAL-DECISION-001.md)  
    *Tujuan:* Mengubah cakupan keunikan Nomor Induk Santri (NIS) menjadi *tenant-scoped* `(tenant_id, nis)` menggantikan batasan unik global.

---

## 3. Aturan Presedensi & Governance

1. **Supremasi AGENTS.md:**  
   Bila terdapat ketidaksesuaian atau pertentangan antara isi dokumen keputusan arsitektur mana pun (termasuk dokumen di `docs/decisions/` atau Level S1) dengan [AGENTS.md](file:///e:/Projects/Os_Darta/AGENTS.md), maka **[AGENTS.md](file:///e:/Projects/Os_Darta/AGENTS.md) yang secara mutlak berlaku**.
2. **Hierarki Keputusan Arsitektural:**  
   - Dokumen Keputusan Aktif di `docs/decisions/` mengikat detail implementasi teknis selama tidak melanggar prinsip dasar Level S0 ([AGENTS.md](file:///e:/Projects/Os_Darta/AGENTS.md)).
   - Dokumen di `docs/archive/` berstatus historis / *read-only audit trail* dan tidak dapat dijadikan dasar implementasi fitur baru.
3. **Fleksibilitas Terminologi Multi-Institusi:**  
   - Seluruh istilah institusional pada dokumen keputusan aktif (seperti kata *santri*, *madrasah*, *musyrif*) harus diinterpretasikan secara fleksibel mengikuti konfigurasi per tenant sesuai mandat Bagian 3 [AGENTS.md](file:///e:/Projects/Os_Darta/AGENTS.md).
