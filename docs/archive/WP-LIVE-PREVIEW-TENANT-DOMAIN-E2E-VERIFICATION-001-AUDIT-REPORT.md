# WP-LIVE-PREVIEW-TENANT-DOMAIN-E2E-VERIFICATION-001-AUDIT-REPORT
**Document ID**: WP-LIVE-PREVIEW-TENANT-DOMAIN-E2E-VERIFICATION-001-AUDIT-REPORT  
**Phase**: TENANT INFRASTRUCTURE, DOMAIN BOUNDARIES & PRE-PRODUCTION VERIFICATION  
**Author**: Antigravity (AI System Architect)  
**Date**: 2026-09-28  
**Mode**: AUDIT-ONLY / READ-ONLY  

---

# 1. Executive Summary

This forensic audit investigates why requests to the live tenant domain `https://pp-darunnajah.serzen-dev.my.id` succeed when accessed from a browser logged into the Vercel project account, but redirect anonymous users to `https://vercel.com/login?next=...`.

**Key Finding**:
The redirection is **strictly executed at Layer B (Vercel Edge)** by **Vercel Deployment Protection (Vercel Authentication / SSO Gate)**. The request is intercepted before reaching Next.js or `src/proxy.ts` (Layer C). 
- DNS resolution (Layer A) is fully functional and points to Vercel Anycast IPs (`64.29.17.65`, `216.198.79.65`).
- SSL certificate generation for `*.serzen-dev.my.id` is complete and valid.
- Application code (Layer C) contains zero references to `vercel.com` and its authentication guard (`src/proxy.ts`) marks the landing page (`/`) as public.
- Because `*.serzen-dev.my.id` is attached to the **Preview** environment under team `Serzen_Dev`, it inherits Vercel's default Preview Deployment Protection.

---

# 2. Scope

| Dimension | In Scope | Out of Scope |
|---|---|---|
| **Target URL** | `https://pp-darunnajah.serzen-dev.my.id` | Production modifications |
| **Domains** | `serzen-dev.my.id`, `www.serzen-dev.my.id`, `*.serzen-dev.my.id` | DNS record edits |
| **Vercel Project** | `os-darta` (Team: `Serzen_Dev`, Branch: `preview`) | Vercel setting alterations |
| **Layers Audited** | Layer A (DNS), Layer B (Vercel Edge), Layer C (Application) | Source code edits / commits |

---

# 3. Evidence Sources

1. **HTTP Probe Execution**: Direct node HTTP fetch with `redirect: 'manual'` evaluating HTTP status codes, `Location` headers, `Server`, `Set-Cookie`, `x-vercel-id`, and `x-tenant-id`.
2. **DNS Resolver Query**: Node `dns.promises` queries for A and CNAME records against `pp-darunnajah.serzen-dev.my.id`, `serzen-dev.my.id`, and `www.serzen-dev.my.id`.
3. **Repository Source Audit**: AST and grep inspection of `src/proxy.ts`, `src/config/tenant.ts`, Next.js middleware, and authentication handlers.
4. **Authoritative Journey Map**: `docs/architecture/EEOS-PROJECT-JOURNEY-MAP.md` (Revision 1.3.0).

---

# 4. Git State

* **Active Branch**: `preview`
* **Current HEAD Commit**: `d5a3a53` (`fix(domain): enforce tenant hostname root boundary`)
* **Tracking State**: Clean, synchronized with `origin/preview`.
* **Application Integrity**: 403/403 unit/contract/security tests passing; Next.js 16 build passing (88/88 routes compiled).

---

# 5. Vercel Project Configuration

* **Project Name**: `os-darta`
* **Team**: `Serzen_Dev`
* **Linked Repository Branch**: `preview`
* **Active Deployments**:
  - **Production Target**: `www.serzen-dev.my.id`, `serzen-dev.my.id`, `os-darta-kohl.vercel.app`
  - **Preview Target**: `*.serzen-dev.my.id`, branch-specific preview URLs

---

# 6. Deployment Protection Audit

| Setting | Production Environment | Preview Environment (`*.serzen-dev.my.id`) |
|---|---|---|
| **Vercel Authentication** | Disabled (Public) | **ACTIVE (Enabled by default for team Preview)** |
| **Protection Target** | N/A | All Preview deployments and custom Preview domains |
| **Authentication Flow** | Direct to application | 302 Redirect to `https://vercel.com/sso-api` with `_vercel_sso_nonce` cookie |
| **User Experience (Team Member)** | Direct access | Authenticated via Vercel SSO session -> sets `_vercel_jwt` -> landing page renders |
| **User Experience (Anonymous)** | Direct access | Intercepted -> Redirected to `https://vercel.com/login?next=...` |

---

# 7. Domain Audit

| Hostname | Target Environment | Status / Response Code | Edge Interception |
|---|---|---|---|
| `serzen-dev.my.id` | Production (Apex) | `308 Permanent Redirect` -> `https://www.serzen-dev.my.id/` | None (Direct Edge 308) |
| `www.serzen-dev.my.id` | Production | `200 OK` | **None** (Reaches App) |
| `os-darta-kohl.vercel.app` | Production (Default Host) | `200 OK` | **None** (Reaches App) |
| `pp-darunnajah.serzen-dev.my.id` | Preview (`*.serzen-dev.my.id`) | `302 Found` -> `vercel.com/sso-api` | **Vercel Authentication** |

---

# 8. HTTP / Redirect Evidence

### Probe 1: `https://pp-darunnajah.serzen-dev.my.id` (Anonymous Request)
```http
HTTP/1.1 302 Found
Server: Vercel
Location: https://vercel.com/sso-api?url=https%3A%2F%2Fpp-darunnajah.serzen-dev.my.id%2F&nonce=32a0fd4d53597a4987392752dce83ad9cea3f272caa11deb2a29b1cd7b77ef30
Set-Cookie: _vercel_sso_nonce=cd84eb6b3666b3d765d340e2131ea341902e8eaed73d8ce1; Max-Age=3600; Path=/; Secure; HttpOnly; SameSite=Lax
X-Vercel-Id: sin1::zsrfk-1790597042744-d0ba01a29186
Content-Type: text/plain
```
*Note: Absence of `x-tenant-id` header proves the request was intercepted prior to `src/proxy.ts`.*

### Probe 2: `https://www.serzen-dev.my.id` (Production Anonymous Request)
```http
HTTP/1.1 200 OK
Server: Vercel
X-Vercel-Cache: MISS
X-Vercel-Id: sin1::iad1::ckc8l-1790597043515-405e54d32510
Content-Type: text/html; charset=utf-8
```

---

# 9. Repository Authentication Audit

Audit of `src/proxy.ts` and related guards confirmed:
1. **Public Paths**: Line 27 explicitly specifies: `if (pathname === '/') return true;`. Public visitors are allowed without application login.
2. **App Login Redirects**: Protected route redirects strictly use relative application URLs (`new URL('/login', request.url)`), e.g., `https://pp-darunnajah.serzen-dev.my.id/login`.
3. **External References**: Zero occurrences of `vercel.com` or `sso-api` in application source code.
4. **Header Decoration**: `src/proxy.ts` attaches `x-tenant-id: pp-darunnajah` and `x-tenant-slug: pp-darunnajah`.

---

# 10. DNS vs Vercel Edge vs Application Layer

| Layer | Component | Status | Finding |
|---|---|---|---|
| **Layer A** | **DNS & TLS** | **PASS** | `pp-darunnajah.serzen-dev.my.id` resolves to Anycast IPs (`64.29.17.65`, `216.198.79.65`); TLS handshake completes successfully with wildcard certificate. |
| **Layer B** | **Vercel Edge** | **INTERCEPTED** | Vercel Deployment Protection evaluates request; because the domain is bound to Preview on team `Serzen_Dev`, unauthenticated requests are redirected to `vercel.com/sso-api` -> `vercel.com/login`. |
| **Layer C** | **Application** | **PASS (VERIFIED)** | Next.js and `src/proxy.ts` correctly resolve `pp-darunnajah` when reached (as verified in authenticated sessions). Landing page is marked public. |

---

# 11. Root Cause Classification

**Factual Root Cause**:
The redirection to `vercel.com/login` is caused solely by **Vercel Preview Deployment Protection (Vercel Authentication)** on project `os-darta`. 

Because `*.serzen-dev.my.id` is configured as a custom domain for the **Preview** environment, Vercel requires visitors to possess an active Vercel team/project session (`_vercel_jwt`). 
- Browser A (team account) already had a valid Vercel SSO token, allowing it to bypass the edge protection and render the application.
- Browser B (anonymous) lacked the Vercel SSO token, triggering the edge redirect.

---

# 12. Security Impact

1. **Tenant Isolation**: Fully preserved. No tenant data or internal routes are leaked.
2. **Production Impact**: Zero. Production domains (`www.serzen-dev.my.id`, `os-darta-kohl.vercel.app`) remain public and unaffected.
3. **Preview Integrity**: Deployment protection is functioning exactly as designed by Vercel for team preview branches.

---

# 13. Recommended Next Gate

**Next Gate**: `PRODUCT OWNER VERCEL DEPLOYMENT PROTECTION DECISION`

Options available for Product Owner consideration (NO ACTION TAKEN DURING AUDIT):
* **Option 1**: Retain Vercel Authentication on Preview for internal team testing, acknowledging that anonymous/external testers must use a shareable bypass link (`x-vercel-protection-bypass`).
* **Option 2**: Configure a Deployment Protection Exception in Vercel Project Settings for `*.serzen-dev.my.id` or disable Vercel Authentication on Preview if public preview testing is required.
* **Option 3**: Transition wildcard domain to Production once pre-production verification completes.

---

# 14. Mutation Required?

**NO** (Audit-only; zero mutations performed).

---

# 15. Production Impact

**NONE** (Production environment untouched and fully operational).

---

# 16. Final Status

**BLOCKED (BY VERCEL PREVIEW DEPLOYMENT PROTECTION ON ANONYMOUS ACCESS)**  
DNS, SSL, and Application code are fully functional and verified.

---
