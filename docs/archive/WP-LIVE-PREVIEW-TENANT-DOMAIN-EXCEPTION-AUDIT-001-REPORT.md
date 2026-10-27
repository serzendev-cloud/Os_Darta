# WP-LIVE-PREVIEW-TENANT-DOMAIN-EXCEPTION-AUDIT-001-REPORT
**Document ID**: WP-LIVE-PREVIEW-TENANT-DOMAIN-EXCEPTION-AUDIT-001-REPORT  
**Phase**: TENANT INFRASTRUCTURE, DOMAIN BOUNDARIES & PRE-PRODUCTION VERIFICATION  
**Author**: Antigravity (AI System Architect)  
**Date**: 2026-09-28  
**Mode**: AUDIT-ONLY / READ-ONLY  

---

# 1. Executive Summary

This forensic audit evaluates whether **Vercel Deployment Protection Exceptions** can safely and effectively allow anonymous end-to-end (E2E) testing on custom preview tenant domains (such as `https://pp-darunnajah.serzen-dev.my.id`) without exposing protected application routes or compromising Production security.

### Core Findings:
1. **Deployment Protection Exceptions Exist**: Vercel provides a native "Deployment Protection Exceptions" configuration surface under Project Settings > Deployment Protection to allow public access to specific custom Preview domains.
2. **Wildcard Scope**: Vercel Deployment Protection Exceptions do **not** support glob/wildcard patterns (e.g. `*.serzen-dev.my.id`). Instead, exceptions must specify exact fully qualified domain names (FQDNs), such as `pp-darunnajah.serzen-dev.my.id`.
3. **Environment Isolation**: Deployment Protection Exceptions apply **strictly to Preview deployments**. Production deployments are managed independently and remain untouched and unaffected.
4. **Application Security Intact**: Bypassing Vercel Edge protection only permits traffic to reach the Next.js runtime. Application-layer security (`src/proxy.ts`, Supabase session guards, role authorization, and tenant isolation) remains 100% active, protecting `/dashboard/*`, `/wali/*`, `/santri/*`, and `/api/*`.

---

# 2. Scope

| Item | In Scope | Out of Scope |
|---|---|---|
| **Target Architecture** | `<tenant-slug>.serzen-dev.my.id` on Vercel Preview | Modifying Vercel project settings |
| **Specific Tenant** | `pp-darunnajah.serzen-dev.my.id` (Ponpes Darunnajah / SR2601) | Modifying DNS or nameservers |
| **Vercel Project** | `os-darta` (Team: `Serzen_Dev`, Branch: `preview`) | Database / Supabase Auth mutations |
| **Application Layer** | `src/proxy.ts`, authentication & authorization boundaries | Code refactoring or deployment |

---

# 3. Current Verified State

* **Vercel Project**: `os-darta`
* **Team**: `Serzen_Dev`
* **Branch**: `preview`
* **Commit**: `d5a3a53` (`fix(domain): enforce tenant hostname root boundary`)
* **DNS Wildcard**: `*.serzen-dev.my.id` resolves to Vercel Anycast IPs (`64.29.17.65`, `216.198.79.65`) with valid TLS certificates.
* **Edge Behavior**: Anonymous requests to `https://pp-darunnajah.serzen-dev.my.id` receive `302 Found` from Vercel Edge to `https://vercel.com/sso-api` -> `https://vercel.com/login`.
* **Team Authenticated Access**: Fully renders the Ponpes Darunnajah tenant landing page without errors.

---

# 4. Vercel Deployment Protection Configuration

In Vercel Team projects, **Vercel Authentication** is enabled by default for all **Preview Deployments** to protect pre-production work.

* **Production Behavior**: Deployment Protection is disabled. Requests directly reach the application (`200 OK` on `www.serzen-dev.my.id` and `os-darta-kohl.vercel.app`).
* **Preview Behavior**: Deployment Protection is active across all generated preview URLs and custom domains assigned to the `preview` branch (`*.serzen-dev.my.id`).
* **Protection Mechanism**: Edge-level JWT verification (`_vercel_jwt`). If missing or invalid, Vercel initiates the SSO challenge.

---

# 5. Deployment Protection Exception Availability

* **Feature Availability**: Available in Vercel Project Settings > Deployment Protection > Deployment Protection Exceptions.
* **Functionality**: Explicitly permits designated preview domains to bypass Edge-level Vercel Authentication, Password Protection, or Trusted IP restrictions.
* **Effect**: Designated domains respond directly with application content rather than redirecting to `vercel.com/sso-api`.

---

# 6. Wildcard Exception Capability

* **Status**: **NOT SUPPORTED FOR WILDCARDS**
* **Technical Constraint**: Vercel's Deployment Protection Exception validator accepts specific hostnames / FQDNs. Entering `*.serzen-dev.my.id` is not supported as an exception pattern.
* **Architectural Consequence**: One single wildcard exception cannot globally unprotect all arbitrary future subdomains under `*.serzen-dev.my.id`.

---

# 7. Individual Tenant Domain Exception Capability

* **Status**: **SUPPORTED**
* **Technical Capability**: Explicit tenant subdomains (e.g. `pp-darunnajah.serzen-dev.my.id` or `pp-darululum.serzen-dev.my.id`) can be individually registered in the Deployment Protection Exceptions list.
* **Result**: `https://pp-darunnajah.serzen-dev.my.id` becomes accessible to anonymous browsers without triggering Vercel login.

---

# 8. Preview vs Production Scope

* **Preview Scope**: The exception applies exclusively to the Preview environment where the custom domain is mapped.
* **Production Scope**: **ZERO IMPACT**. Production domains (`serzen-dev.my.id`, `www.serzen-dev.my.id`, `os-darta-kohl.vercel.app`) operate under the Production environment configuration and are unaffected by Preview exception rules.

---

# 9. Application Authentication Boundary

Bypassing Vercel Edge protection does **not** make private application data public. When traffic reaches Next.js (`src/proxy.ts`):

```text
Incoming Request -> src/proxy.ts
  │
  ├── Is pathname '/' ? ───────────────────────────> PASS (Public Tenant Landing Page)
  ├── Is pathname in PUBLIC_PATHS (/login, /auth)? ─> PASS (Public Auth Pages)
  └── Is pathname Protected (/dashboard, /api)? ───> Server-side Supabase Session Validation
        ├── Valid Session? ─────────────────────────> PASS (Decorated with x-tenant-id)
        └── No Session? ────────────────────────────> 307 Redirect to /login (or 401 JSON)
```

* **Protected Routes**:
  - `/dashboard/*`: Redirects unauthenticated users to `/login?redirect=...`.
  - `/api/*`: Returns `401 Unauthorized` with JSON error payload.
  - `/wali/*`, `/santri/*`: Protected by session and role guards.
* **Tenant Isolation**: `x-tenant-id` and `x-tenant-slug` are derived securely by server-side proxy (`pp-darunnajah`), enforcing PostgreSQL RLS tenant boundaries.

---

# 10. Potential Public Exposure

If an individual exception is configured for `pp-darunnajah.serzen-dev.my.id`:

| Route / Asset Category | Exposure Status | Security Control |
|---|---|---|
| **Tenant Landing Page (`/`)** | Public (Expected) | Displays tenant public profile, branding, and programs |
| **Login / Auth Pages (`/login`, `/auth/*`)** | Public (Expected) | Application login forms |
| **Static Assets (`/_next/*`, `/favicon.ico`)** | Public (Expected) | Bundled frontend assets |
| **Dashboard (`/dashboard/*`)** | **PROTECTED** | Requires valid Supabase auth session; redirect to `/login` |
| **Internal APIs (`/api/saas/*`, etc.)** | **PROTECTED** | Requires valid Supabase auth session; returns `401 JSON` |
| **Tenant Data / Relational Schema** | **PROTECTED** | Enforced by Supabase RLS and server-side tenant scoping |

---

# 11. Alternative Vercel Access Mechanisms

| Mechanism | Description | Anonymous Browser Support | Wildcard Support | Production Impact | Operational Overhead |
|---|---|---|---|---|---|
| **A. Deployment Protection Exception (Individual Domain)** | Add `pp-darunnajah.serzen-dev.my.id` to Project Exceptions list | **YES** | **NO** (Per-domain) | **NONE** | Must add each tenant domain undergoing public Preview E2E |
| **B. Disable Vercel Auth for Preview** | Toggle Vercel Authentication off in Preview settings | **YES** | **YES** (All preview domains) | **NONE** | Entire preview branch becomes publicly accessible |
| **C. Protection Bypass for Automation (Secret Header/Query)** | Use `x-vercel-protection-bypass` secret token | **NO** (Requires header/param) | **YES** | **NONE** | Suitable for Playwright/curl; not natural for casual browser testing |
| **D. Password Protection** | Single shared password for preview | **PARTIAL** (Requires password) | **YES** | **NONE** | Users must enter preview password once |

---

# 12. Evidence Summary

1. **HTTP Probe**: Anonymous requests to `https://pp-darunnajah.serzen-dev.my.id` return `302 Found` with `Location: https://vercel.com/sso-api?...` directly from `server: Vercel`.
2. **Code Verification**: `src/proxy.ts` line 27 explicitly marks `/` as public, confirming application code does not generate external login redirects.
3. **DNS Verification**: Anycast IP resolution confirms DNS and SSL are completely configured.

---

# 13. Security Assessment

Configuring an individual Deployment Protection Exception for `pp-darunnajah.serzen-dev.my.id`:
- **Threat Level**: LOW.
- **Tenant Integrity**: Uncompromised.
- **Data Protection**: Full multi-tenant isolation and session enforcement remain active at Layer C (Application).

---

# 14. Product Owner Decision Required

The Product Owner must select the preferred mechanism for live preview validation:

* **Choice 1**: Register specific preview tenant domain (`pp-darunnajah.serzen-dev.my.id`) in Vercel **Deployment Protection Exceptions**.
* **Choice 2**: Disable **Vercel Authentication** for Preview deployments during pre-production verification.
* **Choice 3**: Utilize **Protection Bypass for Automation** tokens for automated E2E test suites without altering domain-level protection.

*(No configuration has been changed. Awaiting explicit Product Owner authorization.)*

---

# 15. Mutation Status

* **Vercel Configuration Mutations**: 0
* **DNS / Nameserver Mutations**: 0
* **Database / Supabase Mutations**: 0
* **Application Source Code Mutations**: 0
* **Git Mutations**: 0 (No commit / No push)

---

# 16. Final Gate Status

**GATE: AWAITING PRODUCT OWNER VERCEL PROTECTION CONFIGURATION DECISION**  
Audit completed cleanly with zero side-effects.

---
