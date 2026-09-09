# Sprint 1 WP-101 Definition of Ready (DoR) Specification
**APP MA'HAD Enterprise SaaS ERP — Architecture Governance**

---

## 1. Executive Summary & Sign-Off Status

- **Work Package ID**: `WP-101`
- **Work Package Title**: Identity, Tenant Session Context & RBAC Foundation
- **Owner Bounded Context**: `CTX-IDENTITY`
- **Chief Engineering Status**: **`READY FOR IMPLEMENTATION`**

This document establishes the formal **Definition of Ready (DoR)** and execution scope boundary for `WP-101`. All architectural prerequisites, security threat vectors, and data model contracts have been audited and signed off by the Chief Architecture Reviewer in **Phase 0.3**.

---

## 2. Work Package Readiness Criteria Checklist

| # | Readiness Criterion | Status | Verification Reference |
|---|---|---|---|
| 1 | **Canonical Authentication Provider** | **VERIFIED** | Supabase Auth (`@supabase/ssr`) locked via `ADR-002`. |
| 2 | **Platform User Identity Model** | **VERIFIED** | Global `User` identity model locked via `ADR-003`. |
| 3 | **Super Admin Platform Scope** | **VERIFIED** | `SUPER_ADMIN` platform role isolation locked via `ADR-003`. |
| 4 | **Tenant Membership & Role Model** | **VERIFIED** | `UserTenantMembership` & `TenantRole` model locked via `ADR-003` & `ADR-011`. |
| 5 | **Permission Registry Taxonomy** | **VERIFIED** | Canonical Permission Registry (`PLATFORM` vs `TENANT` scopes) locked via `ADR-011`. |
| 6 | **Effective Permission Calculation** | **VERIFIED** | `Effective = PrimaryRolePermissions + AdditionalPermissions` algorithm locked via Phase 0.2A. |
| 7 | **Zero-Trust Tenant Context Extraction** | **VERIFIED** | Next.js Edge Middleware JWT/hostname extraction locked via `ADR-004`. |
| 8 | **Standard Tenant Subdomain Contract** | **VERIFIED** | `<tenant-slug>.<platform-domain>` web identity contract locked via `ADR-005`. |
| 9 | **Drizzle Tenant Isolation Protection** | **VERIFIED** | Mandatory `tenant_id` query filtering enforced by AST linter (`tools/eslint-rules/enforce-tenant-id-param.js`). |
| 10| **Reconciled ADR Catalog** | **VERIFIED** | `ADR-001` through `ADR-011` fully reconciled without duplicates or gaps. |

---

## 3. Mandatory In-Scope Deliverables for WP-101

1. **Identity & Access Drizzle Schema Definitions**:
   - `schema/identity.ts`: `users`, `tenants`, `user_tenant_memberships`, `platform_roles`, `tenant_roles`, `permissions`, `tenant_role_permissions`, `user_additional_permissions`.
2. **Supabase Auth Helpers**:
   - Client and Server Supabase authentication clients (`src/lib/supabase/client.ts`, `server.ts`).
3. **Zero-Trust Edge Middleware Skeleton**:
   - Next.js Edge Middleware (`src/middleware.ts`) extracting verified `tenant_id` and `user_id` from JWT session claims or validated hostname.
4. **Base Tenant Repository Interface**:
   - Type-safe repository abstraction enforcing `tenant_id` parameters on all Drizzle query chains.
5. **Contract & Unit Tests**:
   - Automated Vitest contract tests validating multi-tenant RLS boundaries and permission calculation logic (`tests/contracts/identity/`).

---

## 4. Strict Out-of-Scope Boundaries (Prohibited in WP-101)

- ❌ Public website rendering or landing page CMS.
- ❌ Google Drive API integration or file upload UI.
- ❌ Custom domain DNS automation or provider API integration.
- ❌ Full tenant registration / onboarding web UI.
- ❌ Financial ledger, double-entry journal posting, or canteen POS logic.
- ❌ Academic master data, classes, or curriculum structures (belongs to `WP-102`).
- ❌ Santri state machine lifecycle or dormitory bed assignments (belongs to `WP-103`/`WP-104`).

---

## 5. Execution Directives for Engineering Team

1. **No Code Fallbacks**: Do not use silent dummy fallbacks if authentication fails; fail closed with HTTP 401/403.
2. **AST Build Checks**: Execute `npm run lint:ci` before committing to verify zero new lint regressions.
3. **Clean Git Commits**: Follow conventional commits naming rules (e.g. `feat(identity): implement WP-101 core schemas`).
