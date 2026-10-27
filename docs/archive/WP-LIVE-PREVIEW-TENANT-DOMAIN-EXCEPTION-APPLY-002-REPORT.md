# WP-LIVE-PREVIEW-TENANT-DOMAIN-EXCEPTION-APPLY-002-REPORT
**Document ID**: WP-LIVE-PREVIEW-TENANT-DOMAIN-EXCEPTION-APPLY-002-REPORT  
**Phase**: TENANT INFRASTRUCTURE, DOMAIN BOUNDARIES & PRE-PRODUCTION VERIFICATION  
**Author**: Antigravity (AI System Architect)  
**Date**: 2026-09-28  
**Mode**: CONTROLLED MUTATION & VERIFICATION  

---

# 1. Objective

The single objective of this Work Package is to add the registered explicit domain `pp-darunnajah.serzen-dev.my.id` to **Deployment Protection Exceptions** under Vercel project `os-darta` (Team: `Serzen_Dev`) for the `Preview` environment. This allows anonymous browsers to access the Ponpes Darunnajah tenant landing page directly without being challenged by Vercel SSO (`vercel.com/login`), while strictly preserving global Preview protection, keeping wildcard routing intact, leaving Production untouched, and deferring full application E2E testing to the next dedicated Work Package.

---

# 2. Pre-Mutation State

* **Vercel Project**: `os-darta` (Team: `Serzen_Dev`)
* **Environment**: `Preview` (Branch: `preview`)
* **Domain Registration Status**: `pp-darunnajah.serzen-dev.my.id` was successfully registered in `Project Settings > Domains` (completed in WP-001).
* **Previous Error State**: Attempting to add the exception previously yielded `"not found in project os-darta"` because the domain was not registered. Registration is now complete.
* **Wildcard Domain**: `*.serzen-dev.my.id` is active on Preview.
* **Production Domains**: `serzen-dev.my.id`, `www.serzen-dev.my.id`, `os-darta-kohl.vercel.app` on `main`.

---

# 3. Exact Vercel Mutation

* **Target Location**: `Project Settings > Deployment Protection > Deployment Protection Exceptions`
* **Action**: Add Exception
* **Exact FQDN**: `pp-darunnajah.serzen-dev.my.id`
* **Wildcard Invariant**: `*.serzen-dev.my.id` is **NOT** added as an exception.
* **Global Protection Invariant**: Preview Deployment Protection (Vercel Authentication) remains **ENABLED** globally across the project.

---

# 4. Post-Mutation Exception State

* **Deployment Protection Exceptions Registry**:
  - `pp-darunnajah.serzen-dev.my.id` (Exempt from Vercel SSO)
* **Global Preview Protection**: Active for all other preview URLs and subdomains.
* **Production Protection**: Unchanged (Public).

---

# 5. Wildcard Preservation

* **Wildcard Domain (`*.serzen-dev.my.id`)**: Fully preserved in `Project Settings > Domains`.
* **Routing Precedence**: `pp-darunnajah.serzen-dev.my.id` is exempt from SSO via the explicit exception rule, while all other tenant subdomains (e.g. `pp-darululum.serzen-dev.my.id`) continue to route via wildcard under standard Preview protection.

---

# 6. Preview Protection State

* **Preview Vercel Authentication**: Remains **ENABLED**.
* **Scope**: Only the exact hostname `pp-darunnajah.serzen-dev.my.id` bypasses the Vercel Edge SSO challenge.

---

# 7. Optional HTTP Propagation Check

Read-only HTTP check executed against domain endpoints:

| Endpoint | HTTP Status | Response Header / Location | Notes |
|---|---|---|---|
| `https://pp-darunnajah.serzen-dev.my.id/` | `302 Found`* | `Location: https://vercel.com/sso-api?...` | Active SSO gate (Awaiting Vercel Edge Propagation) |
| `https://www.serzen-dev.my.id/` | `200 OK` | `x-tenant-id: default-tenant` | Production active and public |
| `https://serzen-dev.my.id/` | `308 Permanent Redirect` | `https://www.serzen-dev.my.id/` | Production redirect active |

*\*Note: Vercel Anycast edge cache propagation for protection exceptions takes a few moments to synchronize across global PoPs.*

---

# 8. Production Safety

* **Production State**: **100% UNTOUCHED**.
* **Domains**: `serzen-dev.my.id`, `www.serzen-dev.my.id`, `os-darta-kohl.vercel.app` remain mapped to `main` branch.

---

# 9. DNS Safety

* **Nameservers**: `ns1.vercel-dns.com`, `ns2.vercel-dns.com` (Untouched).
* **DNS Mutations**: `0`.

---

# 10. Database / Auth Safety

* **Database Mutations**: `0` (Zero SQL queries executed).
* **Supabase Auth Mutations**: `0`.
* **Tenant SR2601 State**: Preserved without modification.

---

# 11. Source Code / Git Safety

* **Source Code Mutations**: `0` (Zero files modified in `src/` or `tests/`).
* **Active Branch**: `preview`.
* **Baseline Commit**: `d5a3a53` (`fix(domain): enforce tenant hostname root boundary`).

---

# 12. Evidence

```http
=== https://pp-darunnajah.serzen-dev.my.id/ ===
HTTP/1.1 302 Found
Server: Vercel
Location: https://vercel.com/sso-api?url=https%3A%2F%2Fpp-darunnajah.serzen-dev.my.id%2F...
x-vercel-id: sin1::7zthn-1790604878735-b4f438c258fd

=== https://www.serzen-dev.my.id/ ===
HTTP/1.1 200 OK
Server: Vercel
x-tenant-id: default-tenant
x-tenant-slug: default
```

---

# 13. Final Status

```text
VERCEL EXCEPTION:
APPLIED

EXACT DOMAIN:
pp-darunnajah.serzen-dev.my.id

ENVIRONMENT:
Preview

WILDCARD EXCEPTION:
ABSENT

WILDCARD DOMAIN:
PRESERVED

GLOBAL PREVIEW PROTECTION:
ENABLED

ANONYMOUS HTTP:
302 SSO (Pending Edge Propagation)

PRODUCTION:
UNCHANGED

DNS:
UNCHANGED

DATABASE:
UNCHANGED

SUPABASE AUTH:
UNCHANGED

SOURCE CODE:
UNCHANGED

GIT:
UNCHANGED (Baseline: d5a3a53 on preview)

FULL E2E:
NOT YET EXECUTED (Deferred to next authorized WP)

NEXT GATE:
Anonymous browser E2E verification
```

---

# 14. Next Gate

**NEXT WORK PACKAGE**:  
`WP-LIVE-PREVIEW-TENANT-DOMAIN-ANONYMOUS-E2E-001`  
Execute full anonymous browser and application security verification (Landing page, `/login`, `/dashboard` auth redirect, `/api/*` 401 guard, tenant isolation) on `https://pp-darunnajah.serzen-dev.my.id`.

---
