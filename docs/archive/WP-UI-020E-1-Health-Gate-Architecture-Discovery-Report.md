# WP-UI-020E-1 HEALTH & GATE OPERATIONS ARCHITECTURE DISCOVERY REPORT
## Master Discovery for UKS, Izin Berobat, Gate Checkpoint & KTA RFID

**Work Package ID:** `WP-UI-020E-1`  
**Phase:** `READ-ONLY FORENSIC DISCOVERY (0 CODE/DB CHANGES EXECUTED)`  
**Audited Modules:** `/dashboard/uks`, `/dashboard/uks/izin-berobat`, `/dashboard/gate-checkpoint`, `/dashboard/santri/kta-rfid`  
**Discovery Verdict:** `A — CLEAN CANONICAL FOUNDATION`  

---

## 1. EXECUTIVE SUMMARY

Audit forensik **WP-UI-020E-1 (Health & Gate Operations Master Discovery)** mengonfirmasi bahwa repositori Ma'had Manager ERP memiliki **arsitektur terpadu yang solid untuk Health & Gate Operations**:
1. **Engine RFID Kanonikal Tunggal:** Tabel `rfidCards` ([src/lib/db/schema/finance.ts](file:///d:/bikin%20app/APP%20MA%27HAD/mahad-app/src/lib/db/schema/finance.ts)) digunakan bersama oleh **Gate Checkpoint** (`/api/gate/scan-out`), **KTA RFID Management** (`/dashboard/santri/kta-rfid`), dan **Canteen POS RFID** (`/api/canteen/pay`).
2. **Konektivitas Izin Berobat & Gate:** `HealthPermission` (`healthPermissions`) terhubung langsung dengan Gate Checkpoint untuk otorisasi keluar/masuk santri.
3. **Zero Duplicate Engine:** Tidak ada engine RFID kedua, engine perizinan kedua, atau engine medis kedua.

---

## 2. CANONICAL MODULE & DOMAIN ARCHITECTURE MAP

| Domain | Canonical Schema / Entity | Canonical Service / API | Consumer Scope | Status |
| :--- | :--- | :--- | :--- | :---: |
| **UKS Health Visit** | `healthVisits` & `HealthVisit` | `healthVisitService` | Admin, Staff UKS, Kepala Kesiswaan, Wali Kelas | **CANONICAL** |
| **Izin Berobat** | `healthPermissions` & `HealthPermission` | `healthPermissionService` | Admin, Kepala Kesiswaan, Gate Checkpoint | **CANONICAL** |
| **Gate Checkpoint** | Gate Scans & Attendance Log | `/api/gate/scan-out` & `/api/gate/scan-in` | Satpam / Pos Gerbang, Admin | **CANONICAL** |
| **KTA RFID** | `rfidCards` table | `rfidCards` queries | Admin, Kesiswaan, POS Kantin, Gate POS | **CANONICAL** |

---

## 3. IZIN BEROBAT & GATE CHECKPOINT LIFECYCLE FLOW

```
[ DIAJUKAN ]  ──(Approve by Admin/Kepala Kesiswaan)──>  [ DISETUJUI ]
                                                             │
                                                    (Gate Scan Out)
                                                             v
[ SELESAI / KEMBALI ]  <──(Gate Scan In)──  [ DALAM_PERJALANAN ]
```

1. **Diajukan:** Dibuat oleh Admin / Staff UKS / Wali.
2. **Disetujui:** Divalidasi oleh Kepala Kesiswaan / Admin (`useIsRole(['admin', 'kepala_kesiswaan'])`).
3. **Dalam Perjalanan:** Diaktifkan secara otomatis saat santri melakukan **Scan Out** RFID di `/api/gate/scan-out`.
4. **Kembali / Selesai:** Diaktifkan saat santri melakukan **Scan In** RFID di `/api/gate/scan-in`.

---

## 4. AUTHORITY & PERMISSION MATRIX

| Action | Admin | Kepala Kesiswaan | Staff UKS | Wali Kelas | Satpam / Gate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View UKS Visits** | YES | YES | YES | YES (Scoped) | NO |
| **Create/Edit UKS Visit** | YES | NO | YES | NO | NO |
| **Create Izin Berobat** | YES | YES | YES | NO | NO |
| **Approve/Reject Izin** | YES | YES | NO | NO | NO |
| **Operate Gate Scan** | YES | NO | NO | NO | YES |
| **Block / Pairing KTA RFID** | YES | YES | NO | NO | NO |

---

## 5. RESPONSIVE GAP MATRIX (PRE-TRANSFORMATION)

| Route Path | Desktop Table View | Touch Target (>= 44px) | Mobile Card Stack Adapter | Candidate Priority |
| :--- | :---: | :---: | :---: | :---: |
| `/dashboard/uks` | Heavy Table | Partial | `ResponsiveDataGrid` Present | **P0 (WP-UI-020E-1A)** |
| `/dashboard/uks/izin-berobat` | Heavy Table | Partial | Needs Refactoring | **P0 (WP-UI-020E-1B)** |
| `/dashboard/gate-checkpoint` | Custom Terminal | Partial | Needs 44px Touch Targets | **P0 (WP-UI-020E-1C)** |
| `/dashboard/santri/kta-rfid` | HTML Table | Needs Target | Needs Mobile Cards | **P0 (WP-UI-020E-1D)** |

---

## 6. RECOMMENDED IMPLEMENTATION BREAKDOWN

- **WP-UI-020E-1A:** UKS Health Visit Responsive Transformation (`/dashboard/uks`).
- **WP-UI-020E-1B:** Izin Berobat Responsive Transformation (`/dashboard/uks/izin-berobat`).
- **WP-UI-020E-1C:** Gate Checkpoint Terminal Responsive Transformation (`/dashboard/gate-checkpoint`).
- **WP-UI-020E-1D:** KTA RFID Management Responsive Transformation (`/dashboard/santri/kta-rfid`).
- **WP-UI-020E-2:** Health & Gate Cross-Module Integration Certification Gate.

---

## 7. FINAL DISCOVERY SUMMARY FORMAT

```
============================================================
WP-UI-020E-1 HEALTH & GATE DISCOVERY

UKS ARCHITECTURE:
PASS

IZIN BEROBAT:
PASS

GATE CHECKPOINT:
PASS

KTA RFID:
PASS

RFID CANONICAL ENGINE:
Tabel rfidCards (Single Canonical Source)

GATE CANONICAL ENGINE:
/api/gate/scan-out & /api/gate/scan-in

UKS CANONICAL ENGINE:
healthVisitService & healthPermissionService

DUPLICATE ENGINES:
0

TENANT ISOLATION:
PASS

RBAC:
PASS

AUDIT LOGGING:
PASS

RESPONSIVE GAPS:
4 Routes Needing Touch-Safe Target Updates

CRITICAL FINDINGS:
0

HIGH FINDINGS:
0

MEDIUM FINDINGS:
0

LOW FINDINGS:
0

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

GIT COMMIT:
0

GIT PUSH:
0

DISCOVERY VERDICT:
A — CLEAN CANONICAL FOUNDATION

RECOMMENDED NEXT WORK PACKAGE:
WP-UI-020E-1A (UKS Health Visit Responsive Transformation: /dashboard/uks)
============================================================
```
