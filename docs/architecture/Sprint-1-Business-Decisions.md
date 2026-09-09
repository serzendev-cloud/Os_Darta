# Sprint 1 Unresolved Business Decisions Register
**APP MA'HAD Enterprise SaaS ERP — Product Governance**

---

## 1. Executive Summary

This document lists **Unresolved Business Decisions** identified during the **Sprint 1 Domain Architecture Workshop**. These business questions cannot safely be inferred from existing repository code, EARS specifications, or Sprint 1 planning documents, and require formal product/business approval from Pesantren Stakeholders or Product Management.

---

## 2. Business Decisions Register

### 2.1 Decision 001: Dormitory Bed Unit Granularity Model

- **Decision ID**: `BUS-DEC-001`
- **Question**: Should the system model individual bed entities with unique identities (`bed_id`, e.g. "Kamar 101 - Bed A Top"), or is room-level integer bed capacity (`capacity: 8`, `filled: 6`) sufficient for boarding management?
- **Why It Matters**: Modeling explicit bed entities allows tracking specific bed assignments, maintenance status, and bunk locations, but increases schema complexity. Integer capacity is simpler but does not pinpoint exact bed placement.
- **Affected Module**: `CTX-DORMITORY` (`src/lib/db/schema.ts:kamar`).
- **Blocking WP**: `WP-104` (Asrama Management).
- **Suggested Options**:
  - **Option A (Recommended for Sprint 1)**: Keep integer capacity on `kamar` (`capacity`, `filled`) to maintain simplicity during Sprint 1, deferring physical bed entities to future asset releases.
  - **Option B**: Introduce explicit `beds` table owned by `kamar`.

---

### 2.2 Decision 002: Secondary Guardian & Joint Custody Financial Authority

- **Decision ID**: `BUS-DEC-002`
- **Question**: Can a Santri be linked to multiple legal guardians (`Wali`), and if so, which guardian holds financial bill payment authority and wallet top-up rights?
- **Why It Matters**: Current schema (`santri.wali_id`) assumes a 1:1 relationship between Santri and Wali. In cases of divorced parents or legal guardians, secondary contact access and payment authorization rules must be clarified.
- **Affected Module**: `CTX-SANTRI`, `CTX-FINANCIAL`.
- **Blocking WP**: `WP-103`, `WP-105`.
- **Suggested Options**:
  - **Option A (Recommended for Sprint 1)**: Enforce single Primary Wali (`waliId`) on `Santri` for Sprint 1 core billing, supporting secondary emergency contacts as JSON metadata.
  - **Option B**: Build a formal `santri_guardians` junction entity with explicit relationship types (`FATHER`, `MOTHER`, `GUARDIAN`) and payment permission flags.

---

### 2.3 Decision 003: Overdue Tuition Grace Period & Canteen Spend Suspension Policy

- **Decision ID**: `BUS-DEC-003`
- **Question**: Should overdue tuition invoices (`Tagihan SPP`) automatically suspend a Santri's virtual wallet canteen spending allowance (`canteenStatus = 'suspended'`), or does wallet spending operate independently of tuition arrears?
- **Why It Matters**: Linking tuition status to canteen allowance affects student welfare and daily operations. Schema currently has `suspended_by_walikelas` and `suspended_by_wali` flags in `wallets`.
- **Affected Module**: `CTX-FINANCIAL`.
- **Blocking WP**: `WP-105` (Financial Core).
- **Suggested Options**:
  - **Option A**: Tuition status does NOT automatically block canteen food purchases (welfare-first policy).
  - **Option B**: Automated suspension of canteen wallet allowance after 30 days overdue SPP with admin override.

---

### 2.4 Decision 004: Academic Term Rollover & Student Promotion Rules

- **Decision ID**: `BUS-DEC-004`
- **Question**: When a `TahunAjaran` closes, are student classroom promotions (*Kenaikan Kelas*) executed automatically based on grade averages, or through manual administrative batch selection?
- **Why It Matters**: Dictates whether `CTX-ACADEMIC` requires an automated promotion state machine or manual batch assignment APIs.
- **Affected Module**: `CTX-ACADEMIC`, `CTX-SANTRI`.
- **Blocking WP**: `WP-102` (Academic Master Data).
- **Suggested Options**:
  - **Option A (Recommended for Sprint 1)**: Provide batch administrative promotion APIs allowing operators to select and promote santri cohorts manually.
  - **Option B**: Build automated promotion rules engine triggered upon semester report card publishing.
