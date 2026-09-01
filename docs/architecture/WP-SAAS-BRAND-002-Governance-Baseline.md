# WP-SAAS-BRAND-002 — Governance Baseline & Architectural Specification

> **WORK PACKAGE:** WP-SAAS-BRAND-002  
> **TITLE:** CORE TENANT BRANDING CONFIGURATION  
> **PROJECT:** Ma'had Manager / Madev SaaS Multi-Tenant Platform  
> **BRANCH:** `preview`  
> **DATE:** 2026-09-01  
> **STATUS:** IN PROGRESS — GOVERNANCE BASELINE ESTABLISHED

---

## 1. Executive Summary

WP-SAAS-BRAND-002 bridges the gap identified in `WP-ARCH-CONF-001` (`GAP-03`), transforming the mock-bound Tenant Branding UI into a persistent, server-authoritative, tenant-isolated configuration powered by PostgreSQL `tenant_settings`.

---

## 2. Non-Negotiable Architecture & Source-of-Truth

1. **Branding Storage Authority:** Canonical PostgreSQL `tenant_settings` table (`src/lib/db/schema.ts`).
2. **Tenant Context Authority:** Server-resolved `getTenantContext()` derived from middleware `src/proxy.ts`. Client-controlled headers (`x-tenant-id`) or payload inputs are **never trusted**.
3. **Database Scoping Authority:** Transaction-scoped `withTenantTransaction(tenant.id, ...)` executing `SET LOCAL app.current_tenant_id`.
4. **Authorization Authority:** Server-side `requirePermission(userId, tenant.id, 'manage_pengaturan')`.
5. **Firebase Policy:** **STRICTLY NOT USED**. Firebase is deprecated prototype code and MUST NOT be imported or referenced.

---

## 3. Branding Field Contract (7 Canonical Fields)

| Field Name | Database Column | Data Type | Default / Nullable | Purpose / Usage |
|---|---|---|---|---|
| `loginTitle` | `login_title` | `text` | Nullable | Primary pesantren title on login banner |
| `loginSubtitle` | `login_subtitle` | `text` | Nullable | Subtitle/city location on login banner |
| `loginDescription` | `login_description` | `text` | Nullable | Descriptive paragraph on login banner |
| `customLogoUrl` | `custom_logo_url` | `text` | Nullable | Logo image URL for portal & login |
| `customBgUrl` | `custom_bg_url` | `text` | Nullable | Custom background image URL |
| `primaryColor` | `primary_color` | `text` | `#0F766E` | Brand accent color HEX code |
| `tagline` | `tagline` | `text` | `Sistem Informasi Pesantren Terpadu` | System tagline |

---

## 4. Implementation Plan

1. **Server API Endpoint (`src/app/api/tenant/branding/route.ts`):**
   - `GET`: Resolves server tenant context, enforces `view_pengaturan` RBAC authorization, queries `tenantSettings` table inside `withTenantTransaction()`.
   - `POST` / `PUT`: Resolves server tenant context, enforces `manage_pengaturan` RBAC authorization, validates input fields, upserts `tenantSettings` row for `tenant.id` inside `withTenantTransaction()`.
2. **Dashboard UI Integration (`src/app/dashboard/pengaturan/tampilan-login/page.tsx`):**
   - Connects UI to `/api/tenant/branding`.
   - Binds form inputs to all 7 canonical branding fields.
   - Provides live preview, validation, loading indicator, error toast, and success feedback.
3. **Security Test Suite Integration (`tests/security/tenant-branding.security.test.ts`):**
   - Verifies Tenant A read/write, cross-tenant isolation block (Tenant A cannot read/modify Tenant B branding), tenant ID spoofing rejection, and unauthorized access rejection.
