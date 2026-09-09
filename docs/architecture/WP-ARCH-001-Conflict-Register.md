# WP-ARCH-001 — Document & Architecture Conflict Register

> **WORK PACKAGE:** WP-ARCH-001  
> **TITLE:** ARCHITECTURE & PLANNING CONFLICT REGISTER  
> **BRANCH:** `preview`  
> **DATE:** 2026-09-01  
> **STATUS:** AUDITED & AUDIT RECOMMENDATIONS FORMED

---

## 1. Overview

This register lists all identified architectural, specification, and documentary conflicts across the Ma'had Manager SaaS repository. It outlines the nature of each conflict, the impact, the recommended resolution, and whether explicit Product Owner decision is required.

---

## 2. Document & Architecture Conflict Table

| Conflict ID | Domain | Source A | Source B | Description of Conflict | Potential Impact | Suggested Audit Resolution | Product Owner Decision Required? |
|---|---|---|---|---|---|---|:---:|
| **CONF-01** | **Tenant Context** | Early UI Prototype (`localStorage`) | Canonical Backend (`src/proxy.ts`) | Prototype client components read `localStorage.getItem('mahad_active_tenant_id')`, whereas backend relies strictly on server-resolved hostname extraction (`getTenantContext()`). | Confusion for junior developers thinking client `localStorage` controls tenant isolation. | Maintain `src/proxy.ts` as the sole authority. Audit client stores to ensure `localStorage` is used ONLY for UI demo persistence, never for authorization. | **NO** (Locked by `WP-SAAS-SEC-003`) |
| **CONF-02** | **Database Provider** | Legacy Prototype Docs (`src/lib/firebase/`) | Canonical Database (`src/lib/db/schema.ts` + Drizzle) | Repository contains deprecated `src/lib/firebase/` service files left over from initial prototype. | Dead code clutter and potential confusion for future module development. | Mark `src/lib/firebase/` as **Level S6 Legacy**. Schedule clean-up work package when convenience permits. | **NO** (Locked by `AGENTS.md`) |
| **CONF-03** | **Tenant Branding Storage** | Legacy Mock Store (`src/lib/mock-store.ts`) | Canonical Database (`tenantSettings` table) | Mock store contains hardcoded branding state, whereas `tenantSettings` in PostgreSQL is the single source of truth. | Hardcoded branding fallbacks could obscure database branding changes if not synchronized. | `WP-SAAS-BRAND-001` certified `tenantSettings` as sole source of truth. Deprecate mock store branding fields in `WP-SAAS-BRAND-002`. | **NO** (Locked by `WP-SAAS-BRAND-001`) |
| **CONF-04** | **Custom Domain Termination** | Preliminary Proposal (`WP-SAAS-DOMAIN-001` Draft) | Architecture Baseline (`EARS-Part-6`) | Draft proposal suggests Vercel Custom Domains API, whereas EARS Part 6 proposes Cloudflare SSL proxy. | Inconsistency in infrastructure planning for multi-tenant custom domains. | Keep `WP-SAAS-DOMAIN-001` as **PAUSED**. Require explicit PO decision when custom domain work package is authorized. | **YES (PO Decision Required)** |
| **CONF-05** | **Work Package Execution Priority** | Product Backlog (`Sprint-1-Product-Backlog.md`) | Work Package Register (`WP-ARCH-001`) | Backlog lists `WP-SAAS-BRAND-002` next, whereas governance audit recommends `WP-ARCH-CONF-001` (Code Conformance Audit) first. | Risk of implementing new UI branding features on top of potential architectural drift. | Execute `WP-ARCH-CONF-001` prior to authorizing `WP-SAAS-BRAND-002`. | **YES (PO Decision Required)** |

---

## 3. Resolution Protocol

1. **Rule of Supremacy:** Product Owner explicit decisions (`Level S0`) and locked ADRs (`Level S1`) supersede all draft proposals (`Level S5`) or legacy prototypes (`Level S6`).
2. **Non-Silent Resolution:** No conflict shall be silently patched or overridden without logging in this register.
3. **Escalation:** Items marked `YES` under *Product Owner Decision Required* must be presented to the Product Owner for explicit sign-off before implementation.
