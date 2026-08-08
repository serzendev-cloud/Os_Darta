# Sprint 1 Product Backlog & Work Package Catalog
**APP MA'HAD Enterprise SaaS ERP — Epics & Detailed Work Packages**

---

## 1. Epic Overview

| Epic ID | Epic Title | Primary Objective | Target Work Package | Business Priority |
|---|---|---|---|---|
| **EPIC-01** | Identity & Access Management | Multi-tenant auth session binding, tenant context middleware, and role RBAC. | `WP-101` | **P0 (Critical)** |
| **EPIC-02** | Academic Master Data | Drizzle schemas & APIs for *Tahun Ajaran*, *Semester*, *Jenjang*, *Tingkat*, *Kelas*, *Mapel*. | `WP-102` | **P0 (Critical)** |
| **EPIC-03** | Santri Core & Lifecycle | Santri domain entity, enrollment state machine (Calon -> Aktif -> Lulus/Alumni), Wali mapping. | `WP-103` | **P0 (Critical)** |
| **EPIC-04** | Asrama & Kamar Management | Dormitory building allocation, room capacity tracking, and student bed assignments. | `WP-104` | **P1 (High)** |
| **EPIC-05** | Financial Core & Ledger Engine | Multi-tenant general ledger, student tuition billing (`Tagihan`), PPOB, and canteen NFC payments. | `WP-105` | **P0 (Critical)** |
| **EPIC-06** | Executive Monitoring Dashboard | Multi-tenant metrics summary, operational KPIs, financial ledger summaries, audit logging UI. | `WP-106` | **P1 (High)** |

---

## 2. Work Package Catalog

### 2.1 WP-101: Identity, Tenant Session & Access Management
- **Objective**: Implement zero-trust tenant session extraction (`tenant_id`) and role-based access control (RBAC) across Next.js 16 middleware and API routes.
- **Scope**: Tenant header parser middleware, session context store, user role guards (`developer`, `super_admin`, `admin`, `musyrif`, `guru`, `wali`, `santri`).
- **Out of Scope**: Third-party OAuth provider integrations.
- **Dependencies**: None (Foundation).
- **Acceptance Criteria**:
  1. Middleware extracts `x-tenant-id` header or subdomain and injects into request context.
  2. Unauthenticated requests to protected `/api/` or `/dashboard/` endpoints receive `401 Unauthorized` or redirect to login.
  3. AST linter verifies `tenantId` in session queries.
- **Deliverables**: `src/middleware.ts`, `src/lib/tenant/context.ts`, `src/app/api/auth/` routes.
- **Definition of Done**: Typecheck clean, unit tests pass, contract tests pass, CI green.
- **Complexity**: Medium | **Risk**: Medium

---

### 2.2 WP-102: Academic Master Data Architecture & Services
- **Objective**: Build Drizzle ORM schemas, REST API endpoints, and management services for Pesantren academic structures.
- **Scope**: *Tahun Ajaran* (Academic Year), *Semester* (Term), *Jenjang* (Madrasah/SMP/SMA), *Tingkat* (Grade Level), *Kelas* (Classroom), *Mata Pelajaran* (Curriculum Subjects).
- **Out of Scope**: E-learning video streaming or online exams.
- **Dependencies**: `WP-101`.
- **Acceptance Criteria**:
  1. Database schemas enforce `tenant_id` foreign key index and unique constraint per tenant.
  2. API routes under `/api/academic/workspace/` support full CRUD with tenant filtering.
  3. API response payload validated via contract test suite.
- **Deliverables**: Drizzle schemas in `src/lib/db/schema/academic.ts`, service handlers in `src/lib/db/services/academic.ts`.
- **Definition of Done**: Clean `tsc --noEmit`, AST linter clean, contract tests passing.
- **Complexity**: Medium | **Risk**: Low

---

### 2.3 WP-103: Santri Domain Core Engine & Lifecycle State Machine
- **Objective**: Implement the domain entity, Drizzle schema, and lifecycle state machine for Santri management.
- **Scope**: Santri registration, status transitions (`CALON_SANTRI` $\rightarrow$ `AKTIF` $\rightarrow$ `CUTI` $\rightarrow$ `LULUS` $\rightarrow$ `ALUMNI`), Wali Santri relationship mapping, NISN/NIS generation.
- **Out of Scope**: Physical KTA RFID printing hardware driver integration.
- **Dependencies**: `WP-101`, `WP-102`.
- **Acceptance Criteria**:
  1. State machine validates allowed status transitions and blocks invalid skips (e.g. `CALON_SANTRI` cannot jump to `LULUS`).
  2. Santri search and listing endpoints enforce tenant context filtering.
  3. Unit test suite `src/modules/santri/domain/__tests__/state-machine.test.ts` passes 100%.
- **Deliverables**: `src/modules/santri/domain/state-machine.ts`, `src/app/api/santri/route.ts`.
- **Definition of Done**: 100% test pass rate, typecheck clean, production build green.
- **Complexity**: High | **Risk**: Medium

---

### 2.4 WP-104: Asrama & Kamar Management System
- **Objective**: Deliver dormitory building allocation, room capacity tracking, and student bed assignment services.
- **Scope**: *Asrama* (Dormitory Building), *Kamar* (Room), bed capacity limits, Musyrif supervisor assignment, Santri room history.
- **Out of Scope**: Physical IoT smart lock door hardware controllers.
- **Dependencies**: `WP-101`, `WP-103`.
- **Acceptance Criteria**:
  1. Cannot assign Santri to a Kamar that has reached maximum bed capacity.
  2. Dormitory list queries strictly enforce `tenant_id`.
  3. Musyrif dashboard view correctly displays assigned dormitory rooms.
- **Deliverables**: Drizzle schemas in `src/lib/db/schema/asrama.ts`, services in `src/lib/db/services/asrama.ts`.
- **Definition of Done**: AST linter verified, unit tests passing.
- **Complexity**: Medium | **Risk**: Low

---

### 2.5 WP-105: Multi-Tenant Financial Core & General Ledger Engine
- **Objective**: Implement multi-tenant financial transaction ledgers, student tuition billing (`Tagihan SPP`), PPOB digital checkout, and canteen NFC wallet services.
- **Scope**: Double-entry ledger journals, invoice generation, payment webhook listeners (`/api/webhooks/flip`), wallet balances.
- **Out of Scope**: Direct bank core host-to-host gateway integration.
- **Dependencies**: `WP-101`, `WP-103`.
- **Acceptance Criteria**:
  1. General ledger entries enforce credit/debit balance constraint.
  2. Payment webhooks verify signature header and tenant context before updating ledger status.
  3. Contract test suite validates financial API response contracts.
- **Deliverables**: Drizzle schema `src/lib/db/schema/finance.ts`, API handlers in `src/app/api/canteen/` and `src/app/api/ppob/`.
- **Definition of Done**: AST linter clean, contract tests green, production build success.
- **Complexity**: High | **Risk**: High

---

### 2.6 WP-106: Executive Monitoring Dashboard & Audit Logging
- **Objective**: Deliver executive monitoring views, system health status, operational KPIs, and audit log tracking UI.
- **Scope**: Executive summary widgets (Active Santri count, SPP collection rate, Dormitory occupancy), audit logging service, health check API.
- **Out of Scope**: External Prometheus / Grafana custom plugin authoring.
- **Dependencies**: `WP-101` through `WP-105`.
- **Acceptance Criteria**:
  1. Executive dashboard dynamically aggregates tenant metrics strictly scoped to user tenant.
  2. Audit log records all mutations (`INSERT`, `UPDATE`, `DELETE`) with actor ID, timestamp, and tenant ID.
  3. Production Next.js build packages all dashboard routes cleanly.
- **Deliverables**: `src/app/dashboard/monitoring/page.tsx`, `src/app/dashboard/audit-log/page.tsx`.
- **Definition of Done**: CI green, 0 lint regressions, 100% build pass.
- **Complexity**: Medium | **Risk**: Low
