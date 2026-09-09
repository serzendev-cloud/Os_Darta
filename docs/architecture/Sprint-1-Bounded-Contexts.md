# Sprint 1 Bounded Context Definitions & Boundaries
**APP MA'HAD Enterprise SaaS ERP — Architecture Blueprint**

---

## 1. Context Overview

In accordance with Domain-Driven Design (DDD), **APP MA'HAD Enterprise SaaS ERP** is decomposed into eight (8) primary **Bounded Contexts**. Each bounded context represents an explicit boundary within which a domain model applies, defining data ownership, internal invariants, public contracts, and external dependencies.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            APP MA'HAD PLATFORM                              │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│ Identity & Access    │ Academic Context     │ Santri Core Context           │
│ (Tenant, User, Auth) │ (Madrasah, Kelas)    │ (Lifecycle State Machine)     │
├──────────────────────┼──────────────────────┼───────────────────────────────┤
│ Dormitory Context    │ Financial Context    │ Governance & Administration   │
│ (Asrama, Kamar)      │ (Ledger, Invoices)   │ (Violations, UKS, Docs)       │
├──────────────────────┴──────────────────────┴───────────────────────────────┤
│ Monitoring & Dashboard Context        │ Notification Platform Context        │
│ (KPIs, Audit Logs, Aggregates)        │ (WhatsApp, Push, Email Alerts)        │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

---

## 2. Detailed Bounded Context Catalog

### 2.1 Context 1: Identity & Access Context (`CTX-IDENTITY`)

- **Purpose**: Authenticate users, manage multi-tenant organization boundaries, enforce tenant data isolation, and authorize role-based access control (RBAC).
- **Responsibility**:
  - Provision and configure multi-tenant organizations (`Tenants`).
  - Manage tenant customization and integration settings (`TenantSettings`).
  - Provision user identities (`Users`) with role bindings (`super_admin`, `admin`, `guru`, `musyrif`, `orang_tua`, `santri`).
  - Extract tenant context from request headers/subdomains and inject into session scope.
- **Owned Concepts**: `Tenant`, `TenantSettings`, `User`, `Role`, `TenantContextScope`, `Session`.
- **External Concepts Used**: None (Foundation layer).
- **Dependencies**: None.
- **Public Boundary**:
  - Middleware API: `extractTenantContext(req)`, `requireRole(role)`.
  - HTTP Endpoints: `/api/auth/*`, `/api/tenant/*`.
  - Context Interfaces: `TenantSessionContext`.

---

### 2.2 Context 2: Academic Context (`CTX-ACADEMIC`)

- **Purpose**: Manage the institutional education structure, curriculum frameworks, classroom allocations, academic year cycles, and teacher assignments.
- **Responsibility**:
  - Manage master data for educational levels (`Jenjang`, `Tingkat`).
  - Manage course subjects (`MataPelajaran`) and curriculum rules.
  - Define classroom cohorts (`Kelas`) and assign `WaliKelas` teachers.
  - Manage global academic temporal periods (`TahunAjaran`, `Semester`).
  - Assign subject teachers (`TeacherAssignment`) to classrooms.
- **Owned Concepts**: `TahunAjaran`, `Semester`, `MasterJenjang`, `MasterTingkat`, `Kelas`, `MataPelajaran`, `TeacherAssignment`.
- **External Concepts Used**: `User` (as `Guru` / `WaliKelas`), `Santri` (for student classroom enrollment).
- **Dependencies**: `CTX-IDENTITY`.
- **Public Boundary**:
  - HTTP Endpoints: `/api/academic/workspace/*`, `/api/academic/master/*`.
  - Domain Events Published: `SemesterOpenedEvent`, `SemesterClosedEvent`, `KelasAssignedEvent`.

---

### 2.3 Context 3: Santri Core Context (`CTX-SANTRI`)

- **Purpose**: Manage student identity, personal profiles, guardian relations, registration workflows, and official enrollment status state transitions.
- **Responsibility**:
  - Register new applicants (`Calon Santri`) and generate unique national/internal student identifiers (`NISN`/`NIS`).
  - Execute the DDD lifecycle state machine (`SantriStateMachine`) across status transitions (`DRAFT` → `REGISTERED` → `VERIFIED` → `ACTIVE` → `SUSPENDED` / `TRANSFERRED` / `GRADUATED` → `ALUMNI` → `ARCHIVED`).
  - Record audit trail entries in `StatusLedger` for every status modification.
  - Maintain student profile records and legal guardian mappings (`Wali`).
- **Owned Concepts**: `Santri`, `StatusLedger`, `StatusChangeRecord`, `WaliRelation`.
- **External Concepts Used**: `User` (as `Wali` / `Santri` user account), `Kelas` (ref), `Kamar` (ref).
- **Dependencies**: `CTX-IDENTITY`.
- **Public Boundary**:
  - Service API: `SantriStateMachine.transitionTo()`, `SantriService`.
  - HTTP Endpoints: `/api/santri/*`.
  - Domain Events Published: `SantriRegisteredEvent`, `IdentityVerifiedEvent`, `SantriActivatedEvent`, `SantriSuspendedEvent`, `SantriTransferredEvent`, `SantriGraduatedEvent`, `AlumniFinalizedEvent`.

---

### 2.4 Context 4: Dormitory (Asrama) Context (`CTX-DORMITORY`)

- **Purpose**: Manage boarding facilities, building capacities, room allocations, supervisor assignments, and student residential placements.
- **Responsibility**:
  - Manage dormitory building structures (`Asrama`) and supervisor mappings (`Musyrif`).
  - Manage room inventory (`Kamar`) and bed capacity limits.
  - Execute student room placements and transfers.
  - Track residential occupancy metrics.
- **Owned Concepts**: `Asrama`, `Kamar`, `RoomAssignmentHistory`.
- **External Concepts Used**: `Santri` (as resident reference), `User` (as `Musyrif` reference).
- **Dependencies**: `CTX-IDENTITY`, `CTX-SANTRI`.
- **Public Boundary**:
  - HTTP Endpoints: `/api/asrama/*`.
  - Domain Events Published: `RoomAssignedEvent`, `RoomTransferredEvent`.

---

### 2.5 Context 5: Financial Context (`CTX-FINANCIAL`)

- **Purpose**: Manage multi-tenant financial transactions, student tuition billing (`Tagihan SPP`), virtual parent/student wallet balances, POS canteen checkouts, and double-entry accounting ledgers.
- **Responsibility**:
  - Generate bundled tuition invoices (`Invoices`).
  - Process Flip payment gateway webhooks and update billing status.
  - Manage student virtual wallets (`Wallets`) and spend sub-pockets (`Uang Saku`, `Tabungan`).
  - Process canteen POS sales transactions (`CanteenTransactions`) and enforce daily allowance limits.
  - Maintain balanced double-entry accounting ledgers (`LedgerJournals`) with strict immutability.
- **Owned Concepts**: `Invoice`, `InvoiceLineItem`, `Wallet`, `WalletPocket`, `LedgerJournal`, `LedgerAccount`, `CanteenOutlet`, `CanteenItem`, `CanteenTransaction`, `PPOBTransaction`.
- **External Concepts Used**: `Santri` (billee reference), `User` (as `Wali` payer reference).
- **Dependencies**: `CTX-IDENTITY`, `CTX-SANTRI`.
- **Public Boundary**:
  - Webhook Handlers: `/api/webhooks/flip`.
  - HTTP Endpoints: `/api/finance/*`, `/api/canteen/*`, `/api/ppob/*`.
  - Domain Events Published: `InvoiceIssuedEvent`, `PaymentReceivedEvent`, `WalletTopupCompletedEvent`, `LedgerPostedEvent`.

---

### 2.6 Context 6: Governance & Administration Context (`CTX-GOVERNANCE`)

- **Purpose**: Manage student behavior discipline, rewards, health clinic visits, and official documentation attachments.
- **Responsibility**:
  - Track student disciplinary violations (`Pelanggaran`) and penalties (`Hukuman`).
  - Manage governance case reviews (`GovernanceCases`) for severe infractions.
  - Record UKS medical clinic visits (`HealthVisits`) and medical leave permissions (`HealthPermissions`).
  - Manage document storage metadata (`GDriveDocuments`).
- **Owned Concepts**: `Pelanggaran`, `Hukuman`, `GovernanceCase`, `HealthVisit`, `HealthPermission`, `Quest`, `GDriveDocument`.
- **External Concepts Used**: `Santri` (student ref), `User` (reporting staff ref).
- **Dependencies**: `CTX-IDENTITY`, `CTX-SANTRI`.
- **Public Boundary**:
  - HTTP Endpoints: `/api/governance/*`, `/api/health/*`.
  - Domain Events Published: `ViolationReportedEvent`, `DisciplinaryActionTakenEvent`.

---

### 2.7 Context 7: Monitoring & Dashboard Context (`CTX-MONITORING`)

- **Purpose**: Aggregate multi-tenant operational KPIs, executive metric summaries, and system audit logs for administrative oversight.
- **Responsibility**:
  - Compute active santri counts, dormitory occupancy rates, and tuition collection rates.
  - Record and render system-wide audit logs (`AuditLogs`) capturing all mutations.
  - Expose operational health check endpoints.
- **Owned Concepts**: `AuditLog`, `ExecutiveMetricsSummary`.
- **External Concepts Used**: Consumes aggregate read views from ALL contexts.
- **Dependencies**: `CTX-IDENTITY`, all operational contexts.
- **Public Boundary**:
  - HTTP Endpoints: `/api/health`, `/dashboard/monitoring`, `/dashboard/audit-log`.

---

### 2.8 Context 8: Notification Context (`CTX-NOTIFICATION`)

- **Purpose**: Deliver async communications (WhatsApp gateway messages, email, push notifications) to parents, staff, and administrators.
- **Responsibility**:
  - Format and enqueue notification dispatches based on domain events.
  - Manage notification read state and target role delivery (`Notifications`).
- **Owned Concepts**: `Notification`, `NotificationTemplate`, `DispatchLog`.
- **External Concepts Used**: Consumes domain events from `CTX-SANTRI`, `CTX-FINANCIAL`, `CTX-GOVERNANCE`.
- **Dependencies**: `CTX-IDENTITY`.
- **Public Boundary**:
  - Service API: `NotificationEngine.sendNotification()`.
  - Event Handlers: Consumes domain event bus.
