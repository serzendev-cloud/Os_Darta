# Sprint 1 Architecture Decision Record (ADR) Candidates
**APP MA'HAD Enterprise SaaS ERP — Architecture Governance**

---

## 1. Executive Summary

This document cataloging **Architecture Decision Candidates** identifies key technical and architectural decisions requiring formal approval and documentation prior to or during the execution of Sprint 1 Work Packages (`WP-101` through `WP-106`).

---

## 2. ADR Candidates Catalog

### 2.1 ADR Candidate 001: Zero-Trust Tenant Header Extraction vs Subdomain Middleware Policy

- **ADR Candidate ID**: `ADR-CAND-001`
- **Title / Proposed Decision**: Standardize Next.js 16 Edge Middleware to extract tenant context via `x-tenant-id` request header with fallback to custom subdomains (`{slug}.mahad-app.com`).
- **Why It Matters**: Multi-tenant data isolation (`tenant_id`) is the paramount security guarantee of APP MA'HAD. Standardizing the extraction mechanism prevents header spoofing and ensures consistent session context propagation across API routes.
- **Affected Contexts**: `CTX-IDENTITY` (All contexts downstream).
- **Risk Level**: **High** (Security & Tenant Isolation).
- **Required Before**: `WP-101`.

---

### 2.2 ADR Candidate 002: Modular Drizzle Schema Splitting Strategy

- **ADR Candidate ID**: `ADR-CAND-002`
- **Title / Proposed Decision**: Transition from monolithic `src/lib/db/schema.ts` to domain-scoped schema files (`schema/identity.ts`, `schema/academic.ts`, `schema/santri.ts`, `schema/asrama.ts`, `schema/finance.ts`) re-exported via index.
- **Why It Matters**: As domain schemas grow during Sprint 1, a single 500+ line `schema.ts` file increases merge conflicts, obscures domain aggregate ownership, and violates domain boundary encapsulation.
- **Affected Contexts**: All Bounded Contexts.
- **Risk Level**: **Medium** (Refactoring churn).
- **Required Before**: `WP-102`.

---

### 2.3 ADR Candidate 003: Double-Entry General Ledger Immutability & Reversing Entry Policy

- **ADR Candidate ID**: `ADR-CAND-003`
- **Title / Proposed Decision**: Enforce strict double-entry ledger immutability in `CTX-FINANCIAL` using PostgreSQL database triggers blocking `UPDATE` and `DELETE` on posted journals. Corrections must be recorded via explicit reversing journal entries.
- **Why It Matters**: Financial audit compliance requires an immutable transaction history. Soft deletes or mutable ledger updates destroy auditability and create compliance liabilities.
- **Affected Contexts**: `CTX-FINANCIAL`.
- **Risk Level**: **High** (Financial Integrity).
- **Required Before**: `WP-105`.

---

### 2.4 ADR Candidate 004: Santri Lifecycle Event Dispatch Mechanism (Outbox Pattern vs Synchronous Dispatch)

- **ADR Candidate ID**: `ADR-CAND-004`
- **Title / Proposed Decision**: Adopt an in-memory synchronous event emitter for Sprint 1 domain event dispatching, persisting event payloads into `outbox_events` table for asynchronous background consumption in post-Sprint 1 releases.
- **Why It Matters**: Decouples status transition logic in `SantriStateMachine` from external notification dispatches without requiring complex background queue infrastructure in Sprint 1.
- **Affected Contexts**: `CTX-SANTRI`, `CTX-NOTIFICATION`, `CTX-FINANCIAL`.
- **Risk Level**: **Low** (Implementation Complexity).
- **Required Before**: `WP-103`.

---

### 2.5 ADR Candidate 005: Student Wallet Spend Limit Accumulator Strategy

- **ADR Candidate ID**: `ADR-CAND-005`
- **Title / Proposed Decision**: Utilize Redis key-value store with 24-hour expiration (`tenant:{tenantId}:wallet:{santriId}:daily_spend`) to enforce `dailyLimit` checks at canteen POS checkouts, backed by SQL `walletPockets` audit log.
- **Why It Matters**: High-frequency canteen POS purchases require sub-50ms latency validation. Querying historical SQL tables for daily sum per transaction introduces database bottlenecks during mealtime spikes.
- **Affected Contexts**: `CTX-FINANCIAL` (Kantin POS).
- **Risk Level**: **Medium** (Performance & Caching Consistency).
- **Required Before**: `WP-105`.
