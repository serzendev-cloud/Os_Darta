# Sprint 1 Canonical Domain Invariants Catalog
**APP MA'HAD Enterprise SaaS ERP — Architecture Invariants & Validation Specification**

---

## 1. Executive Summary

This document establishes the canonical **Domain Invariants Catalog** for **APP MA'HAD Enterprise SaaS ERP**. Invariants are business rules that must ALWAYS hold true throughout the execution lifecycle of the platform. Violation of an invariant represents an invalid system state and MUST be prevented by automated enforcement layers.

---

## 2. Master Domain Invariants Catalog

### 2.1 Category 1: Multi-Tenant Data Isolation Invariants

| Invariant ID | Rule Description | Owner Context | Enforcement Layer | Severity | Validation Strategy |
|---|---|---|---|---|---|
| **INV-TENANT-001** | Every tenant-owned database table record MUST possess a non-null `tenant_id` foreign key. | Identity & Access | Database Schema & Supabase RLS | **CRITICAL (P0)** | Drizzle column definition (`notNull()`) + PostgreSQL RLS policy. |
| **INV-TENANT-002** | All database read/write queries executed via Drizzle ORM MUST include a strict `.where(eq(table.tenantId, tenantId))` clause. | Identity & Access | Custom AST Linter | **CRITICAL (P0)** | Static AST analysis via `npm run lint:ast` during CI pipeline. |
| **INV-TENANT-003** | Cross-tenant data access or cross-tenant transaction processing is strictly forbidden. | Identity & Access | Middleware & Service Layer | **CRITICAL (P0)** | Tenant header extractor middleware (`x-tenant-id`) + unit test assertions. |
| **INV-TENANT-004** | A tenant `slug` MUST be globally unique across the SaaS platform. | Identity & Access | Database Constraint | **HIGH (P1)** | Unique index on `tenants.slug`. |

---

### 2.2 Category 2: Academic Domain Invariants

| Invariant ID | Rule Description | Owner Context | Enforcement Layer | Severity | Validation Strategy |
|---|---|---|---|---|---|
| **INV-ACAD-001** | Exactly ONE `TahunAjaran` record can be marked `ACTIVE` per tenant at any given point in time. | Academic Context | Domain Model & Service Layer | **HIGH (P1)** | Transactional service guard before status activation. |
| **INV-ACAD-002** | Exactly ONE `Semester` record can be marked `ACTIVE` per tenant within the currently active `TahunAjaran`. | Academic Context | Domain Model & Service Layer | **HIGH (P1)** | Atomic update transaction clearing prior active term. |
| **INV-ACAD-003** | A `Tingkat` progression index MUST belong exclusively to its parent `Jenjang`. | Academic Context | Service API | **MEDIUM (P2)** | Foreign key validation on `masterTingkat.jenjangId`. |
| **INV-ACAD-004** | A `Kelas` cannot have a negative student count ($\text{studentCount} \ge 0$). | Academic Context | Database Check Constraint | **MEDIUM (P2)** | Check constraint `CHECK (student_count >= 0)`. |

---

### 2.3 Category 3: Santri Core Lifecycle Invariants

| Invariant ID | Rule Description | Owner Context | Enforcement Layer | Severity | Validation Strategy |
|---|---|---|---|---|---|
| **INV-SANTRI-001** | Santri `nis` MUST be unique within a tenant organization. | Santri Core | Database Index & Service Layer | **CRITICAL (P0)** | Composite unique constraint `UNIQUE(tenant_id, nis)`. |
| **INV-SANTRI-002** | Santri lifecycle state transitions MUST strictly follow the `SantriStateMachine` legal transition matrix. Illegal transitions (e.g. `CALON_SANTRI` $\to$ `GRADUATED`) MUST throw `InvalidStateTransitionException`. | Santri Core | Domain Engine (`SantriStateMachine`) | **CRITICAL (P0)** | Unit test suite `state-machine.test.ts`. |
| **INV-SANTRI-003** | Every Santri state transition MUST produce an immutable `StatusChangeRecord` in `StatusLedger` containing actor ID, effective date, and reason. | Santri Core | Domain Engine & DB Service | **CRITICAL (P0)** | Atomic DB transaction creating entity update + status ledger record. |
| **INV-SANTRI-004** | A Santri CANNOT be assigned to a `Kelas` or `Kamar` unless their status is `ACTIVE`. | Santri Core | Service API Layer | **HIGH (P1)** | Status verification guard in assignment handlers. |

---

### 2.4 Category 4: Dormitory (Asrama) Capacity & Gender Invariants

| Invariant ID | Rule Description | Owner Context | Enforcement Layer | Severity | Validation Strategy |
|---|---|---|---|---|---|
| **INV-DORM-001** | Total occupied beds (`filled`) in a `Kamar` MUST NOT exceed room `capacity` ($\text{filled} \le \text{capacity}$). | Dormitory Context | Service API Layer & DB Constraint | **HIGH (P1)** | Capacity validation check before inserting room assignment. |
| **INV-DORM-002** | Male Santri (`gender = 'L'`) MUST ONLY be assigned to male Asrama (`gender = 'L'`). Female Santri (`gender = 'P'`) MUST ONLY be assigned to female Asrama (`gender = 'P'`). | Dormitory Context | Domain / Service Guard | **CRITICAL (P0)** | Strict gender equality check `santri.gender === asrama.gender`. |
| **INV-DORM-003** | A Santri CANNOT hold more than ONE active room assignment at any given time. | Dormitory Context | Database Unique Index / Service | **HIGH (P1)** | Partial unique index on active room assignment records. |
| **INV-DORM-004** | Sum of occupied beds across all `Kamar` in an `Asrama` MUST equal `filled` on `Asrama`. | Dormitory Context | Service Aggregator | **MEDIUM (P2)** | Aggregate recalculation query. |

---

### 2.5 Category 5: Financial Ledger & Billing Invariants

| Invariant ID | Rule Description | Owner Context | Enforcement Layer | Severity | Validation Strategy |
|---|---|---|---|---|---|
| **INV-FIN-001** | Double-entry journal postings MUST be strictly balanced ($\sum \text{Debits} = \sum \text{Credits}$). Unbalanced postings MUST be rejected. | Financial Context | Financial Domain Engine | **CRITICAL (P0)** | Pre-commit validation in `LedgerJournal` domain entity. |
| **INV-FIN-002** | Posted financial journal entries and transaction logs are IMMUTABLE. `UPDATE` and `DELETE` SQL operations on posted ledgers are strictly prohibited. Corrections MUST be executed via reversing entry. | Financial Context | Database Triggers / RLS Rules | **CRITICAL (P0)** | PostgreSQL trigger blocking `UPDATE` and `DELETE` on posted rows. |
| **INV-FIN-003** | Virtual wallet spend pockets (`balanceUangSaku`, `balanceTabungan`) MUST NEVER drop below zero ($\text{balance} \ge 0$). Negative wallet balances are prohibited. | Financial Context | Database Check Constraint & Service | **CRITICAL (P0)** | Check constraint `CHECK (balance_uang_saku >= 0 AND balance_tabungan >= 0)`. |
| **INV-FIN-004** | Cumulative daily canteen deductions for a Santri MUST NOT exceed `dailyLimit` set on their `Wallet`. | Financial Context | Service API (POS Handler) | **HIGH (P1)** | Redis daily accumulator check before transaction approval. |
| **INV-FIN-005** | `Invoice.totalAmount` MUST strictly equal the sum of all line item amounts (`amountSpp + amountUangSaku + amountTabungan`). | Financial Context | Domain Entity | **HIGH (P1)** | Entity getter validation. |

---

### 2.6 Category 6: Identity & Access Control Invariants

| Invariant ID | Rule Description | Owner Context | Enforcement Layer | Severity | Validation Strategy |
|---|---|---|---|---|---|
| **INV-ID-001** | User `role` MUST belong to approved system roles (`super_admin`, `admin`, `guru`, `musyrif`, `orang_tua`, `santri`). | Identity & Access | Schema Enum / Zod Validation | **HIGH (P1)** | Enum constraint on `users.role`. |
| **INV-ID-002** | An unauthenticated request to protected API routes (`/api/*`) MUST receive HTTP `401 Unauthorized`. | Identity & Access | Next.js Middleware | **CRITICAL (P0)** | Automated integration contract tests. |
| **INV-ID-003** | A user with role `orang_tua` MUST only access data related to their linked `childSantriId`. | Identity & Access | Service RBAC Guard | **CRITICAL (P0)** | Data scoping assertion check in API handlers. |
