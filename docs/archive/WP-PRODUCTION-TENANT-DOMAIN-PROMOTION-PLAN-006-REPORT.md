# WP-PRODUCTION-TENANT-DOMAIN-PROMOTION-PLAN-006 REPORT
# CONTROLLED PRODUCTION TENANT DOMAIN IMPLEMENTATION & PROMOTION PLAN

**Document ID**: `WP-PRODUCTION-TENANT-DOMAIN-PROMOTION-PLAN-006-REPORT`  
**Phase**: `TENANT INFRASTRUCTURE, DOMAIN BOUNDARIES & PRE-PRODUCTION VERIFICATION`  
**Mode**: `READ-ONLY PLANNING / PRE-PRODUCTION SAFETY GATE (100% ZERO MUTATION)`  
**Branch**: `preview`  
**Git Baseline Commit**: `d5a3a53` (`fix(domain): enforce tenant hostname root boundary`)  
**Production Commit (`main`)**: `d43aed7`  
**Audit Timestamp**: `2026-09-29T06:22:05+07:00` (`2026-09-28T23:22:05Z` UTC)  

---

## 1. Objective

This Work Package establishes a comprehensive, auditable, and fail-safe **Production Promotion & Tenant Domain Migration Plan** to transition the verified multi-tenant SaaS application from the Vercel Preview environment into the live Vercel Production environment.

### Core Architectural Goal:
Transition tenant access URLs (e.g. `https://pp-darunnajah.serzen-dev.my.id`) from the protected Vercel Preview environment (where Vercel SSO blocks anonymous public access) to the public **Vercel Production Environment**, guarded by Next.js zero-trust proxy boundaries ([src/proxy.ts](file:///e:/Projects/Os_Darta/src/proxy.ts)), Supabase Auth, and PostgreSQL Row-Level Security (RLS).

---

## 2. Current Production State

- **Branch**: `main`
- **HEAD Commit**: `d43aed7`
- **Active Domains**:
  - `serzen-dev.my.id` (Apex -> Redirects 308 to WWW)
  - `www.serzen-dev.my.id` (Primary Host -> Returns 200 OK, `x-tenant-id: default-tenant`)
  - `os-darta-kohl.vercel.app` (Default Deployment URL)
- **Deployment Protection**: `DISABLED` (Public ingress active).
- **Current Limitation**: The code currently deployed on `main` (`d43aed7`) is historical and **does NOT contain** multi-tenant domain routing, SRYYNN code allocation, zero-password tenant provisioning, or fail-closed proxy boundaries.

---

## 3. Current Preview State

- **Branch**: `preview`
- **HEAD Commit**: `d5a3a53`
- **Active Domains**:
  - `*.serzen-dev.my.id` (Wildcard Domain -> Assigned to Preview)
  - `pp-darunnajah.serzen-dev.my.id` (Explicit Custom Domain -> Assigned to Preview)
- **Deployment Protection**: `ENABLED` (Vercel SSO gatekeeper active, returns 302 to `vercel.com/sso-api`).
- **Readiness State**: Contains 100% of tested, hardened, and verified sprint deliverables (403/403 tests passing, build clean).

---

## 4. Git Branch / Commit Analysis

### Branch Relationship:
- **`main` HEAD**: `d43aed7`
- **`preview` HEAD**: `d5a3a53`
- **Common Merge-Base**: `d43aed7` (`main` is an exact direct ancestor of `preview`)
- **`main`-only commits**: `0`
- **`preview`-only commits**: `86`

`preview` represents a direct, linear evolution ahead of `main`. There are zero divergent commits or merge conflicts between `main` and `preview`.

---

## 5. Preview vs Main Difference Matrix

| System Component | `preview` (`d5a3a53`) | `main` (`d43aed7`) | Production Requirement |
| :--- | :--- | :--- | :--- |
| **Tenant Routing (`src/proxy.ts`)** | Deterministic hostname resolution | Legacy/Single-tenant middleware | **REQUIRED FOR PRODUCTION** |
| **Root Domain (`src/config/tenant.ts`)** | `serzen-dev.my.id` single-source | Hardcoded legacy domains | **REQUIRED FOR PRODUCTION** |
| **Proxy Boundary (Fail-Closed)** | Zero-trust header sanitization | Basic proxy pass-through | **REQUIRED FOR PRODUCTION** |
| **Tenant Provisioning Engine** | SRYYNN atomic counter & services | Legacy/Mock provisioning | **REQUIRED FOR PRODUCTION** |
| **Invitation Lifecycle Engine** | Strict `INVITED` state gatekeeper | Open initial password creation | **REQUIRED FOR PRODUCTION** |
| **Onboarding Session Refresh** | Strict `app_metadata` refresh | Stale session token retention | **REQUIRED FOR PRODUCTION** |
| **Tenant Hard-Delete Engine** | Schema-aligned fail-closed delete | Incomplete foreign-key cascade | **REQUIRED FOR PRODUCTION** |
| **Zero-Password Ingress UI** | Direct invite link activation UI | Password input on registration | **REQUIRED FOR PRODUCTION** |
| **Resend Sender Dispatch** | Verified `noreply@serzen-dev.my.id` | Unverified sandbox sender | **REQUIRED FOR PRODUCTION** |
| **Role Preview Platform** | PostgreSQL persistent origin tickets | Memory-based mock preview | **REQUIRED FOR PRODUCTION** |
| **Santri Multi-Tenant Schema** | Multi-tenant unique constraints | Unscoped legacy schema | **REQUIRED FOR PRODUCTION** |

**Conclusion**: Branch `main` CANNOT serve multi-tenant traffic until it is updated to `preview` (`d5a3a53`).

---

## 6. Production Readiness Assessment

- **Unit, Contract & Security Tests**: 403/403 Vitest suite passing.
- **TypeScript Compilation**: 0 errors, clean worktree.
- **Next.js 16 Production Build**: 88/88 routes compiled successfully.
- **Database Baseline**: PostgreSQL production schema contains all required constraints (`tenants.code`, `santri.tenant_id`, `user_tenant_memberships`, `preview_origin_tickets`).
- **Classification**: **READY FOR PRODUCTION PROMOTION**.

---

## 7. Domain Migration Options

### Option 1: Two-Stage Staged Rollout (Pilot First, then Wildcard) — *RECOMMENDED*
1. **Stage 1 (Pilot)**: Move `pp-darunnajah.serzen-dev.my.id` to Production. Test anonymous public access and end-to-end authentication on the live single tenant.
2. **Stage 2 (Wildcard)**: Move `*.serzen-dev.my.id` to Production, unlocking automatic zero-config routing for all 100+ future tenants.

### Option 2: Direct Wildcard Cutover
Move `*.serzen-dev.my.id` directly to Production in a single step.
- *Trade-off*: Higher blast radius if unexpected edge routing issues occur.

---

## 8. Exact-Domain Pilot Analysis

- **Target**: `pp-darunnajah.serzen-dev.my.id`
- **Tenant Context**: Ponpes Darunnajah (Tenant Code: `SR2601`, Slug: `pp-darunnajah`, ID: `t_1790171191747_pyv9n`).
- **Mechanism**: Reassign `pp-darunnajah.serzen-dev.my.id` domain environment in Vercel Dashboard from `Preview` to `Production` (pointing to `main`).
- **Blast Radius**: Strictly confined to 1 tenant (`SR2601`). The platform apex (`serzen-dev.my.id`), platform www (`www.serzen-dev.my.id`), and all other preview wildcard subdomains remain untouched.

---

## 9. Wildcard Production Analysis

- **Target**: `*.serzen-dev.my.id`
- **Mechanism**: Reassign `*.serzen-dev.my.id` domain environment in Vercel Dashboard from `Preview` to `Production`.
- **Infrastructure Impact**:
  - **DNS / Nameservers**: ZERO changes (already points to `cname.vercel-dns.com`).
  - **SSL Certificate**: ZERO recreation required (Wildcard certificate is already active and valid).
  - **Database / Source Code**: ZERO changes.
- **Precedence**: Exact domain `pp-darunnajah.serzen-dev.my.id` can either coexist or be consolidated into the wildcard once verified.

---

## 10. Vercel Protection Analysis

| Environment | Vercel Authentication | Ingress Rule | Application Auth Boundary |
| :--- | :--- | :--- | :--- |
| **Preview** | `ENABLED` | Intercepted at Vercel Edge (302 SSO) | Not reached by anonymous users |
| **Production** | `DISABLED` | Passes directly to Next.js Application | `src/proxy.ts` enforces authentication |

### Security Invariant:
On Production, disabling Vercel Authentication does NOT make private data public. Next.js middleware ([src/proxy.ts](file:///e:/Projects/Os_Darta/src/proxy.ts)) inspects every incoming request:
- Public routes (`/`, `/login`, `/register`, `/auth/*`): 200 OK.
- Protected routes (`/dashboard/*`, `/wali/*`, `/guru/*`, `/santri/*`): Redirects to `/login?redirect=...`.
- Protected API routes (`/api/*`): Returns `401 Unauthorized` JSON.
- Database queries: Filtered strictly by Supabase RLS and `tenant_id`.

---

## 11. Environment Variable Audit

Read-only inspection of environment configuration:

| Variable | Local / Preview Status | Production Required Status | Classification |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `PRESENT` | `PRESENT` | Identical Connection |
| `NEXT_PUBLIC_SUPABASE_URL` | `PRESENT` | `PRESENT` | Identical Instance |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `PRESENT` | `PRESENT` | Identical Key |
| `SUPABASE_SERVICE_ROLE_KEY` | `PRESENT` | `PRESENT` | Identical Key |
| `RESEND_API_KEY` | `PRESENT` | `PRESENT` | Identical Key |
| `NEXT_PUBLIC_TENANT_ROOT_DOMAIN` | `FALLBACK` (`serzen-dev.my.id`) | `FALLBACK / SET` (`serzen-dev.my.id`) | Canonical Default Valid |
| `RESEND_FROM_EMAIL` | `FALLBACK` (`noreply@serzen-dev.my.id`) | `FALLBACK / SET` (`noreply@serzen-dev.my.id`) | Canonical Verified Domain |
| `ROLE_PREVIEW_ENABLED` | `OPTIONAL` | `OPTIONAL` (Default false in Prod) | Protected Safe Default |

*(Note: Zero secret values are exposed in this report.)*

---

## 12. Authentication Readiness

1. **Email / Password Authentication**: Verified against Supabase Auth.
2. **NIS-Based Authentication**: Verified against tenant-scoped `UNIQUE(tenant_id, nis)`.
3. **Session Refresh & Token Claims**: Verified via `createProxyClient` and `app_metadata` refresh.
4. **Invitation Onboarding Flow**: Tested and confirmed with single-use cryptographic invite links.

---

## 13. Tenant Isolation Readiness

1. **Proxy Boundary**: `x-tenant-id` is extracted strictly from the verified hostname and overwritten on downstream request headers (client-supplied spoofed headers are deleted).
2. **Database RLS**: All tenant queries enforce `tenant_id = current_setting('app.current_tenant_id')`.
3. **Foreign Host Handling**: Unknown hostnames fail-closed to platform default without tenant data leakage.

---

## 14. Resend / Email Dispatch Readiness

1. **Sender Address**: `Ma'had Manager <noreply@serzen-dev.my.id>`.
2. **Domain Status**: Fully verified on Resend with DKIM, SPF, and MX records.
3. **Template**: Responsive HTML with clear institution branding and activation CTA button.

---

## 15. Production E2E Test Plan

Following Production deployment and domain reassignment, the following automated tests MUST be executed:

| Test ID | Target URL | Expected HTTP Status | Expected Response / Header | Verification Goal |
| :--- | :--- | :--- | :--- | :--- |
| **TEST-A** | `https://pp-darunnajah.serzen-dev.my.id/` | `200 OK` | HTML Landing / Tenant Context | Public access without Vercel SSO |
| **TEST-B** | `https://pp-darunnajah.serzen-dev.my.id/login` | `200 OK` | HTML Login Form | Public login page rendering |
| **TEST-C** | `https://pp-darunnajah.serzen-dev.my.id/dashboard` | `302 Found` | `Location: /login?redirect=/dashboard` | Application auth boundary active |
| **TEST-D** | `https://pp-darunnajah.serzen-dev.my.id/api/saas/tenants` | `401 Unauthorized` | JSON `{ success: false, error: 'Unauthorized' }` | API security boundary active |
| **TEST-E** | `https://pp-darunnajah.serzen-dev.my.id/` | `200 OK` | `x-tenant-slug: pp-darunnajah`, `x-tenant-id: pp-darunnajah` | Accurate tenant resolution |
| **TEST-F** | `https://www.serzen-dev.my.id/` | `200 OK` | `x-tenant-id: default-tenant`, `x-tenant-slug: default` | Production root integrity intact |
| **TEST-G** | `https://serzen-dev.my.id/` | `308 Perm Redirect` | `Location: https://www.serzen-dev.my.id/` | Apex domain redirect preserved |
| **TEST-H** | `https://foreign-domain.com/` (Spoof probe) | `200 / 302` | `x-tenant-id: default-tenant` | Fail-closed security |

---

## 16. Rollback Plan

If any critical failure occurs during deployment or verification, the rollback sequence is strictly defined:

| Failure Trigger | Rollback Action | Operator / Owner | DNS Impact | Tenant Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Vercel Production Build Failure** | Redeploy previous production deployment (`d43aed7`) in Vercel Dashboard | Release Engineer | ZERO | Production remains on baseline |
| **Tenant Domain Routing Anomaly** | Reassign `pp-darunnajah.serzen-dev.my.id` back to `Preview` | Release Engineer | ZERO | Tenant returns to preview state |
| **Application Auth Failure** | Revert branch `main` to `d43aed7` via fast git revert | System Architect | ZERO | Reverts application code |
| **Supabase / Database Anomaly** | DB transaction fail-closed guard activates | Automated | ZERO | Zero corrupted state |

---

## 17. Blast Radius Analysis

1. **Stage 1 (Pilot `pp-darunnajah.serzen-dev.my.id`)**:
   - **Scope**: Exactly 1 tenant (`SR2601`).
   - **Platform Impact**: Zero impact on existing production landing page (`www.serzen-dev.my.id`).
2. **Stage 2 (Wildcard `*.serzen-dev.my.id`)**:
   - **Scope**: All dynamic subdomains on `serzen-dev.my.id`.
   - **Platform Impact**: Automatically resolves all future provisioned pesantren.

---

## 18. Recommended Implementation Sequence

```text
┌────────────────────────────────────────────────────────┐
│ PHASE 0: Preflight Verification (Git, Tests, DB)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 1: Promote `preview` (d5a3a53) to `main`         │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 2: Trigger & Verify Vercel Production Build      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 3: Assign Pilot Domain to Production in Vercel   │
│          (pp-darunnajah.serzen-dev.my.id)              │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 4: Execute Live Anonymous & Auth E2E Tests       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 5: Transition Wildcard (*.serzen-dev.my.id)      │
│          to Production (Full Multi-Tenant Scale)       │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ PHASE 6: Final Verification & Journey Map Closure      │
└────────────────────────────────────────────────────────┘
```

### Phase Details:

#### PHASE 0: Preflight
- **Purpose**: Verify worktree clean, 403/403 tests pass, database connection healthy.
- **Mutation**: NONE.
- **STOP Condition**: Any failing test or dirty worktree.

#### PHASE 1: Production Branch Promotion
- **Purpose**: Fast-forward or merge `preview` (`d5a3a53`) into `main` and push to remote `main`.
- **Mutation**: Git commit / push on `main`.
- **Precondition**: Explicit Product Owner Authorization.
- **Validation**: `git rev-parse origin/main` equals `d5a3a53`.

#### PHASE 2: Production Deployment
- **Purpose**: Build and deploy `main` on Vercel Production.
- **Mutation**: Vercel automated production deployment.
- **Validation**: Build succeeds; `https://www.serzen-dev.my.id/` returns 200 OK.

#### PHASE 3: Pilot Domain Reassignment
- **Purpose**: Change environment of `pp-darunnajah.serzen-dev.my.id` to `Production` in Vercel Dashboard.
- **Mutation**: Vercel domain setting update.
- **Validation**: Domain status: `Valid Configuration`.

#### PHASE 4: Live E2E Verification
- **Purpose**: Run automated HTTP probe matrix (Tests A to H).
- **Mutation**: NONE (Read-only HTTP probes).
- **Validation**: 0 requests hit `vercel.com/sso-api`; all application auth boundaries respond accurately.

#### PHASE 5: Wildcard Production Transition
- **Purpose**: Move `*.serzen-dev.my.id` to `Production` in Vercel Dashboard.
- **Mutation**: Vercel wildcard domain environment update.
- **Validation**: All tenant subdomains route to Production.

#### PHASE 6: Closure
- **Purpose**: Update `docs/architecture/EEOS-PROJECT-JOURNEY-MAP.md` to record completion of pre-production domain verification.

---

## 19. Preconditions

Before authorizing execution:
1. Product Owner explicit sign-off on Promotion Strategy.
2. Verified that zero database mutations are required.
3. Verified that zero DNS nameserver mutations are required.
4. Rollback procedures verified and ready.

---

## 20. STOP / Authorization Gate

```text
╔══════════════════════════════════════════════════════════════╗
║           PRODUCTION MUTATION AUTHORIZATION GATE             ║
╚══════════════════════════════════════════════════════════════╝

PLAN ONLY.

NO PRODUCTION MUTATION HAS BEEN AUTHORIZED OR EXECUTED.

ALL ACTIONS REMAIN STRICTLY READ-ONLY.

NEXT ACTION REQUIRES EXPLICIT PRODUCT OWNER WORK PACKAGE APPROVAL:
"WP-PRODUCTION-TENANT-DOMAIN-PROMOTION-EXECUTE-007"
```

---

## 21. Required Final Status Block

```text
WP: WP-PRODUCTION-TENANT-DOMAIN-PROMOTION-PLAN-006

MODE:
READ-ONLY PLANNING

Production Architecture:
VERIFIED

Production Readiness:
READY

Preview vs Main:
PREVIEW AHEAD BY 86 COMMITS (d5a3a53 vs d43aed7)

Required Production Commits:
ALL 86 COMMITS (Clean linear history from d43aed7 to d5a3a53)

Tenant Domain Strategy:
PILOT FIRST (pp-darunnajah) THEN WILDCARD (*.serzen-dev.my.id)

Production Protection:
DISABLED (Public Ingress Active)

Preview Protection:
ENABLED (Vercel SSO Active)

SR2601:
UNCHANGED (Active in DB)

DB:
UNCHANGED

AUTH:
UNCHANGED

RESEND:
UNCHANGED

DNS:
UNCHANGED

VERCEL:
UNCHANGED

GIT:
UNCHANGED (preview at d5a3a53, main at d43aed7)

SOURCE:
UNCHANGED

PRODUCTION MUTATION:
NONE

NEXT GATE:
WP-PRODUCTION-TENANT-DOMAIN-PROMOTION-EXECUTE-007 (Awaiting Product Owner Authorization)

AUTHORIZATION:
REQUIRED
```
