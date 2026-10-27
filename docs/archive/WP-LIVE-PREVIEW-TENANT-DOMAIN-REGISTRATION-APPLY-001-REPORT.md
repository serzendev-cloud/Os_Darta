# WP-LIVE-PREVIEW-TENANT-DOMAIN-REGISTRATION-APPLY-001-REPORT
**Document ID**: WP-LIVE-PREVIEW-TENANT-DOMAIN-REGISTRATION-APPLY-001-REPORT  
**Phase**: TENANT INFRASTRUCTURE, DOMAIN BOUNDARIES & PRE-PRODUCTION VERIFICATION  
**Author**: Antigravity (AI System Architect)  
**Date**: 2026-09-28  
**Mode**: CONTROLLED MUTATION & VERIFICATION  

---

# 1. Objective

The objective of this Work Package is to execute and verify the single controlled configuration change:
Registering the explicit individual tenant domain `pp-darunnajah.serzen-dev.my.id` under Vercel project `os-darta` (Team: `Serzen_Dev`) assigned to `Environment: Preview` and `Git Branch: preview`, while strictly preserving the existing wildcard `*.serzen-dev.my.id`, without adding Deployment Protection Exceptions, without modifying DNS, without touching Production, and with zero application code or database mutations.

---

# 2. Pre-Mutation State

* **Vercel Project**: `os-darta` (Team: `Serzen_Dev`)
* **Branch**: `preview`
* **Baseline Commit**: `d5a3a53` (`fix(domain): enforce tenant hostname root boundary`)
* **Existing Domains**:
  - `serzen-dev.my.id` (Production, `main`)
  - `www.serzen-dev.my.id` (Production, `main`)
  - `os-darta-kohl.vercel.app` (Production, `main`)
  - `*.serzen-dev.my.id` (Preview, `preview`)
* **Pre-Mutation Condition**: `pp-darunnajah.serzen-dev.my.id` was resolved solely via wildcard and did not exist as a registered domain entity in the project registry.

---

# 3. Exact Mutation

* **Action**: Register Custom Project Domain
* **Domain Name**: `pp-darunnajah.serzen-dev.my.id`
* **Target Environment**: `Preview`
* **Target Git Branch**: `preview`
* **Deployment Protection Exception Added**: **NO (0)** (Strictly deferred to next WP)

---

# 4. Post-Mutation Domain State

| Hostname | Domain Type | Target Environment | Target Branch | Status |
|---|---|---|---|---|
| `serzen-dev.my.id` | Apex Domain | Production | `main` | Valid Configuration |
| `www.serzen-dev.my.id` | Custom Subdomain | Production | `main` | Valid Configuration |
| `os-darta-kohl.vercel.app` | Default Deployment Domain | Production | `main` | Valid Configuration |
| `*.serzen-dev.my.id` | Wildcard Domain | Preview | `preview` | Valid Configuration (**PRESERVED**) |
| `pp-darunnajah.serzen-dev.my.id` | Explicit Custom Domain | Preview | `preview` | Valid Configuration (**REGISTERED**) |

---

# 5. Preview / Branch Verification

* **Environment**: `Preview`
* **Branch Mapping**: `preview`
* **Deployment Target**: Automatically routes incoming requests to active deployments built from the `preview` branch.

---

# 6. Wildcard Preservation

* **Wildcard Domain (`*.serzen-dev.my.id`)**: Fully preserved in `Project Settings > Domains`.
* **Coexistence**: The explicit domain `pp-darunnajah.serzen-dev.my.id` takes routing precedence for the official tenant, while `*.serzen-dev.my.id` continues to handle all other tenant hostnames.

---

# 7. Production Safety

* **Production Domains**: `serzen-dev.my.id`, `www.serzen-dev.my.id`, `os-darta-kohl.vercel.app` remain attached to `main` branch.
* **Production Status**: `200 OK` on `https://www.serzen-dev.my.id/`.
* **Production Impact**: **ZERO (100% UNTOUCHED)**.

---

# 8. DNS Safety

* **Nameservers**: `ns1.vercel-dns.com`, `ns2.vercel-dns.com` (Untouched).
* **Manual DNS Mutations**: `0`.
* **Wildcard DNS**: Fully preserved.

---

# 9. Database / Auth Safety

* **Database Mutations**: `0` (Zero DDL/DML executed).
* **Supabase Auth Mutations**: `0`.
* **Tenant SR2601 State**: Preserved without modification.

---

# 10. Git Safety

* **Active Branch**: `preview`
* **HEAD Commit**: `d5a3a53` (`fix(domain): enforce tenant hostname root boundary`)
* **Source Code Modifications**: `0` (Clean working tree).

---

# 11. HTTP Verification

Live HTTP response check on domain endpoints:

| URL | Status | Redirect Location / Response | Finding |
|---|---|---|---|
| `https://pp-darunnajah.serzen-dev.my.id/` | `302 Found` | `https://vercel.com/sso-api?...` | Normal (Deployment Protection active, exception not yet added) |
| `https://www.serzen-dev.my.id/` | `200 OK` | Direct App (`x-tenant-id: default-tenant`) | Production fully active |
| `https://serzen-dev.my.id/` | `308 Permanent Redirect` | `https://www.serzen-dev.my.id/` | Production redirect active |

---

# 12. Evidence

```http
=== https://pp-darunnajah.serzen-dev.my.id ===
HTTP/1.1 302 Found
Server: Vercel
Location: https://vercel.com/sso-api?url=https%3A%2F%2Fpp-darunnajah.serzen-dev.my.id%2F...
x-vercel-id: sin1::zsrfk-1790604612292-fe98030eb37f

=== https://www.serzen-dev.my.id ===
HTTP/1.1 200 OK
Server: Vercel
x-vercel-id: sin1::iad1::hbhn4-1790604612522-c5945c6b694f
```

---

# 13. Final Status

```text
DOMAIN REGISTRATION:
APPLIED (Registered in Project Settings > Domains)

EXACT DOMAIN:
pp-darunnajah.serzen-dev.my.id

ENVIRONMENT:
Preview

BRANCH:
preview

WILDCARD:
PRESERVED

PROTECTION EXCEPTION:
NOT TOUCHED (Deferred to next authorized WP)

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
UNCHANGED (Baseline d5a3a53 on preview)
```

---

# 14. Next Gate

**NEXT WORK PACKAGE**:  
Add `pp-darunnajah.serzen-dev.my.id` to **Deployment Protection Exceptions** (now that the domain is recognized in project `os-darta`) and execute the live anonymous E2E verification.

---
