# WP-LIVE-PREVIEW-TENANT-DOMAIN-EDGE-RECHECK-004 REPORT
# READ-ONLY EDGE PROPAGATION RECHECK

**Status**: COMPLETED / BLOCKED (EDGE EFFECT NOT OBSERVED)  
**Execution Timestamp**: 2026-09-28T21:39:40+07:00 (14:39:40 UTC)  
**Mode**: READ-ONLY / AUDIT-ONLY (100% Zero Mutation)  
**Branch**: `preview`  
**Git Baseline Commit**: `d5a3a53`  

---

## 1 Objective
Perform a strict read-only edge re-check across two measurement rounds against the live Vercel Anycast Edge for `https://pp-darunnajah.serzen-dev.my.id/` (Tenant SR2601) to verify whether the explicit Deployment Protection Exception configured in the Vercel Dashboard has become active at the edge, or if requests remain intercepted by Vercel SSO Protection (`302 Found -> vercel.com/sso-api`).

---

## 2 Previous State (WP-003 Baseline)
- **Vercel Dashboard State**: Domain `pp-darunnajah.serzen-dev.my.id` is explicitly registered to Git Branch `preview`, and configured with an explicit Deployment Protection Exception (`Type: Bypass`).
- **WP-003 Live HTTP State**:
  - Target Root (`/`): `302 Found` -> `Location: https://vercel.com/sso-api?...`
  - Target Login (`/login`): `302 Found` -> `Location: https://vercel.com/sso-api?...`
  - Target Dashboard (`/dashboard`): `302 Found` -> `Location: https://vercel.com/sso-api?...`
  - Protected API (`/api/saas/tenants`): `302 Found` -> `Location: https://vercel.com/sso-api?...`

---

## 3 Measurement Round 1
**Timestamp**: 2026-09-28T14:39:40.341Z UTC (21:39:40 local)  
**Method**: Anonymous HTTP GET (`fetch` with `redirect: 'manual'`, zero cookies/custom auth headers)

| Endpoint | HTTP Status | Location Header | Server | x-vercel-id | x-tenant-id | Edge Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `https://pp-darunnajah.serzen-dev.my.id/` | `302` | `https://vercel.com/sso-api?url=...` | `Vercel` | `sin1::tqtp8-1790606379428-c5261cd6992b` | `null` | **BLOCKED (SSO)** |
| `https://pp-darunnajah.serzen-dev.my.id/login` | `302` | `https://vercel.com/sso-api?url=...` | `Vercel` | `sin1::t4spm-1790606379591-16fb1c6a4465` | `null` | **BLOCKED (SSO)** |
| `https://pp-darunnajah.serzen-dev.my.id/dashboard` | `302` | `https://vercel.com/sso-api?url=...` | `Vercel` | `sin1::kx4r7-1790606379632-48b01ddc06db` | `null` | **BLOCKED (SSO)** |
| `https://pp-darunnajah.serzen-dev.my.id/api/saas/tenants` | `302` | `https://vercel.com/sso-api?url=...` | `Vercel` | `sin1::bfbqq-1790606379680-2de75c3526b2` | `null` | **BLOCKED (SSO)** |
| `https://pp-darululum.serzen-dev.my.id/` (Wildcard) | `302` | `https://vercel.com/sso-api?url=...` | `Vercel` | `sin1::kwkn6-1790606379838-3bd4e875888f` | `null` | **PROTECTED (SSO)** |
| `https://www.serzen-dev.my.id/` (Prod WWW) | `200` | `null` | `Vercel` | `sin1::iad1::wm9mn-1790606379948-7e1b6df9517b` | `default-tenant` | **PASS (PROD)** |
| `https://serzen-dev.my.id/` (Prod Apex) | `308` | `https://www.serzen-dev.my.id/` | `Vercel` | `sin1::2zwp6-1790606380448-1e28da769b99` | `null` | **PASS (PROD)** |

---

## 4 Measurement Round 2
**Timestamp**: 2026-09-28T14:39:46.561Z UTC (21:39:46 local)  
**Method**: Anonymous HTTP GET (`fetch` with `redirect: 'manual'`) after delay interval.

| Endpoint | HTTP Status | Location Header | Server | x-vercel-id | x-tenant-id | Edge Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `https://pp-darunnajah.serzen-dev.my.id/` | `302` | `https://vercel.com/sso-api?url=...` | `Vercel` | `sin1::4m7b5-1790606385613-7d8a058206dc` | `null` | **BLOCKED (SSO)** |
| `https://pp-darunnajah.serzen-dev.my.id/login` | `302` | `https://vercel.com/sso-api?url=...` | `Vercel` | `sin1::zcfv6-1790606385718-2cb557cab25f` | `null` | **BLOCKED (SSO)** |
| `https://pp-darunnajah.serzen-dev.my.id/dashboard` | `302` | `https://vercel.com/sso-api?url=...` | `Vercel` | `sin1::hzcvz-1790606385755-22b89b40c43d` | `null` | **BLOCKED (SSO)** |
| `https://pp-darunnajah.serzen-dev.my.id/api/saas/tenants` | `302` | `https://vercel.com/sso-api?url=...` | `Vercel` | `sin1::jtql6-1790606385788-baecbfb1bf3c` | `null` | **BLOCKED (SSO)** |
| `https://pp-darululum.serzen-dev.my.id/` (Wildcard) | `302` | `https://vercel.com/sso-api?url=...` | `Vercel` | `sin1::ng7tl-1790606385896-8a3425a02b3f` | `null` | **PROTECTED (SSO)** |
| `https://www.serzen-dev.my.id/` (Prod WWW) | `200` | `null` | `Vercel` | `sin1::iad1::w72xg-1790606386014-556c864d7a8a` | `default-tenant` | **PASS (PROD)** |
| `https://serzen-dev.my.id/` (Prod Apex) | `308` | `https://www.serzen-dev.my.id/` | `Vercel` | `sin1::8pdwd-1790606386402-8811d8ece000` | `null` | **PASS (PROD)** |

---

## 5 Before vs After Comparison
- **WP-003 State**: `302 Found` -> `https://vercel.com/sso-api?...`
- **WP-004 State**: `302 Found` -> `https://vercel.com/sso-api?...`
- **Delta**: `NO OBSERVABLE CHANGE`. The response code, redirect target, and absence of application headers (`x-tenant-id`, `x-tenant-slug`) are identical across WP-003 and WP-004.

---

## 6 Target Domain Result
- **URL**: `https://pp-darunnajah.serzen-dev.my.id/`
- **Result**: `302 Found` redirecting to `https://vercel.com/sso-api?url=https%3A%2F%2Fpp-darunnajah.serzen-dev.my.id%2F...`
- **Status**: Intercepted at Vercel Anycast Edge (Layer A). Application container / Next.js middleware is not reached.

---

## 7 Login Result
- **URL**: `https://pp-darunnajah.serzen-dev.my.id/login`
- **Result**: `302 Found` redirecting to `https://vercel.com/sso-api?...`
- **Status**: Intercepted at Vercel Edge. Login route does not render for anonymous users.

---

## 8 Dashboard Result
- **URL**: `https://pp-darunnajah.serzen-dev.my.id/dashboard`
- **Result**: `302 Found` redirecting to `https://vercel.com/sso-api?...`
- **Status**: Case 1 (Intercepted at Layer A).

---

## 9 API Result
- **URL**: `https://pp-darunnajah.serzen-dev.my.id/api/saas/tenants`
- **Result**: `302 Found` redirecting to `https://vercel.com/sso-api?...`
- **Status**: Intercepted at Layer A before reaching API handlers.

---

## 10 Wildcard Control Result
- **URL**: `https://pp-darululum.serzen-dev.my.id/`
- **Result**: `302 Found` redirecting to `https://vercel.com/sso-api?...`
- **Status**: Preserved and Protected as expected.

---

## 11 Production Control Result
- **Apex Domain (`https://serzen-dev.my.id/`)**: `308 Permanent Redirect` -> `https://www.serzen-dev.my.id/`.
- **WWW Domain (`https://www.serzen-dev.my.id/`)**: `200 OK`, `x-tenant-id: default-tenant`, `x-tenant-slug: default`.
- **Status**: Production completely untouched and 100% operational.

---

## 12 Edge Interpretation
- **Observed Edge Activation**: `NOT OBSERVED`.
- **Propagation Hypothesis vs Redeployment Requirement**:
  - Live Edge nodes (`sin1::...`) continue to evaluate the Deployment Protection rule at Layer A without applying the configured exception from the dashboard.
  - In strict compliance with WP rules: The reason for this state is **NOT PROVEN** as a pure propagation delay versus requiring an active Preview deployment / build trigger. We record only the factual observation: **"No observable edge activation after recheck."**

---

## 13 Evidence
HTTP header logs from node test runner:
```text
=== ROUND 1: 2026-09-28T14:39:40.341Z ===
TARGET ROOT (https://pp-darunnajah.serzen-dev.my.id/):
  Status: 302
  Location: https://vercel.com/sso-api?url=https%3A%2F%2Fpp-darunnajah.serzen-dev.my.id%2F&nonce=80e8e69f1bbe21fef4021ea76f9ad83cfc97c6416e5545b28d52da1c9dde71b8
  Server: Vercel
  x-vercel-id: sin1::tqtp8-1790606379428-c5261cd6992b

=== ROUND 2: 2026-09-28T14:39:46.561Z ===
TARGET ROOT (https://pp-darunnajah.serzen-dev.my.id/):
  Status: 302
  Location: https://vercel.com/sso-api?url=https%3A%2F%2Fpp-darunnajah.serzen-dev.my.id%2F&nonce=ddeac91c0c08bb8327a85a766981298f1ca458316156263fc2ff3f27b09b41eb
  Server: Vercel
  x-vercel-id: sin1::4m7b5-1790606385613-7d8a058206dc
```

---

## 14 Mutation Audit
- **Vercel Settings/Domains**: ZERO mutations.
- **Redeploy / Build**: ZERO mutations.
- **DNS / Nameservers**: ZERO mutations.
- **Database / Supabase Auth**: ZERO mutations.
- **Source Code / Tests / Config**: ZERO mutations.
- **Git State**: Clean on branch `preview` at `d5a3a53`.

---

## 15 Final Status
**BLOCKED (EDGE EFFECT NOT OBSERVED)**  
The configured Deployment Protection Exception has not taken observable effect on live HTTP requests across both measurement rounds.

---

## 16 Next Gate
Awaiting Product Owner decision on whether to:
1. Wait for additional edge propagation, OR
2. Authorize a controlled empty preview redeployment / git push trigger to compile and distribute edge protection rules to active preview deployments.
