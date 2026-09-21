# EEOS — WORK PACKAGE REPORT

## WP-LOGIN-PREVIEW-PLATFORM-SECURITY-AMENDMENT-001
### Architecture Redesign & Security Amendment: Super Admin Preview Platform

- **Status**: `COMPLETED & VERIFIED`
- **Security Audit Classification**: `CRITICAL SECURITY HARDENING & ARCHITECTURAL EVOLUTION`
- **Target Repository**: `Os_Darta`
- **Primary Governance Directives**:
  - `Zero Trust Role Transition` (No client-driven role or tenant mutations)
  - `Super Admin Protected Scope` (Preview capability restricted to authenticated Super Admin & Developer)
  - `Opaque Origin Ticket Pattern` (Zero credential exposure, single-use, 15-minute TTL)
  - `Clean Public Login` (No public evaluation bypass buttons on production login)
  - `Seamless Non-Destructive Persona Switching & Restoration` (Instant evaluation without re-login)

---

## 1. EXECUTIVE SUMMARY

The previous convenience feature "Login Instant UI" (WP-LOGIN-INSTANT-ROLE-PREVIEW-001) placed evaluation buttons on the public `/login` page. While effective for rapid local testing, this design introduced serious architectural vulnerabilities:
1. **Unauthenticated Persona Switching**: Anyone who accessed the `/login` route could invoke `/api/auth/role-preview` and assume high-privilege roles without prior authentication.
2. **Session Desynchronization Risk**: Switching into low-privilege personas destroyed the Super Admin's original session, forcing them to re-enter platform credentials or risk losing their administrative context.
3. **Public Exposure**: The presence of development/preview personas on the public-facing entry point degraded production security posture and confused real users.

To permanently resolve these flaws while preserving the vital product evaluation capability, this Work Package executes an **Architectural Evolution**:
- **Public Login is Clean**: `/login` is restored to a standard, pristine authentication form (Email + Password).
- **Preview Platform is a Protected SaaS Console Module**: The capability is moved inside the authenticated Super Admin boundary at `/dashboard/saas/preview`, accessible only to `super_admin` and `developer` accounts.
- **Opaque Origin Ticket Pattern**: Before transitioning to a preview persona, the server mints an in-memory, crypto-random 64-character opaque ticket (`sb-preview-origin-ticket`) that references the Super Admin's identity. No credentials or JWTs are stored in cookies or client storage.
- **Single-Use Replay Protection**: Consuming the ticket to restore the Super Admin session invalidates it immediately (`single-use`), rendering replay attacks completely ineffective.
- **Seamless Persona Switching**: The persistent top `PreviewIndicator` banner allows Super Admins to hop between all 6 personas (`Developer`, `Super Admin`, `Admin Pesantren`, `Musyrif Asrama`, `Wali Santri`, `Santri`) or exit back to the SaaS Console in one click.

---

## 2. THREAT MODELING & SECURITY AMENDMENT

| Threat ID | Threat Description | Pre-Amendment Vulnerability | Mitigated Architecture |
| :--- | :--- | :--- | :--- |
| **THREAT-01** | **Anonymous Privilege Escalation** | Any internet visitor could trigger `POST /api/auth/role-preview` with `{ role: 'admin' }`. | **Server-Side Caller Gate**: The route now checks the active session via Supabase SSR. Anonymous callers and low-privilege users (`wali`, `santri`, `musyrif`, `admin`) receive `403 Forbidden` (`UNAUTHORIZED_CALLER`). |
| **THREAT-02** | **Persona Hijacking & Impersonation** | Malicious users could tamper with preview parameters or claim preview identities. | **Deterministic Identity Binding**: The server strictly controls persona credentials via secure server-side environment configurations. |
| **THREAT-03** | **Tenant Scope Boundary Breach** | Client sending `{ tenantId: 'target_id' }` could attempt cross-tenant escalation. | **Zero-Trust Input Sanitization**: Client-provided `tenantId` is completely ignored. Tenant bindings are derived strictly from server logic (`runtime-verify-001`). |
| **THREAT-04** | **Replay & Credential Theft** | Stored tickets or tokens could be intercepted and reused. | **Opaque Ticket with Single-Use Invalidation**: The cookie contains only a 256-bit cryptographically random hex token without tokens or claims. Upon exit, the ticket is immediately consumed and purged. |
| **THREAT-05** | **Super Admin Session Loss** | Testing a low-privilege persona required logging out and re-authenticating as Super Admin. | **Secure Session Restoration**: The `exit` API validates the origin ticket, re-authenticates the original Super Admin session via server-side OTP, clears the ticket cookie, and redirects seamlessly to the SaaS Console. |

---

## 3. CORE ARCHITECTURAL COMPONENTS IMPLEMENTED

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   AUTHENTICATED SUPER ADMIN CONSOLE                                 │
│                                      (/dashboard/saas/preview)                                     │
└───────────────────────────────────┬───────────────────────────────────▲────────────────────────────┘
                                    │ 1. Pilih Persona                  │ 4. POST /api/.../exit
                                    │    POST /api/auth/role-preview    │    Validate & Consume
                                    ▼                                   │    Opaque Ticket
┌───────────────────────────────────────────────────────────────────────┴────────────────────────────┐
│                                 SERVER-SIDE SECURITY CONTROLLER ENGINE                              │
│                                                                                                    │
│  [Caller Authorization Check]  ──► Caller is Super Admin / Developer? ──► NO ──► 403 FORBIDDEN     │
│                                         │ YES                                                      │
│                                         ▼                                                          │
│  [Opaque Ticket Issuance]      ──► Mints random 64-char ticket in memory (15-min TTL)             │
│                                ──► Sets HttpOnly, SameSite=Lax, Path=/ cookie                     │
│                                         │                                                          │
│  [Deterministic Authentication]──► Signs in to target preview persona with server-managed secrets  │
└───────────────────────────────────┬────────────────────────────────────────────────────────────────┘
                                    │ 2. Redirect to Dashboard
                                    ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                      ACTIVE PREVIEW SESSION                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🧪 Mode Preview: Melihat sebagai Admin Pesantren | Daruttauhid (RTV01)                       │  │
│  │                                            [ 🔄 Ganti Persona ▼ ]  [ ↩ Keluar Preview ]       │  │
│  └──────────────────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                                    │
│  • Sandboxed evaluating role-specific UI, navigation, and tenant data                               │
│  • Rapid switching to any other persona without leaving preview state                              │
│  • 1-Click "Keluar Preview" restores Super Admin identity instantly                                │
└────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Component Inventory:
1. **Opaque Origin Ticket Store**: [`src/lib/authz/preview-origin-ticket.ts`](file:///e:/Projects/Os_Darta/src/lib/authz/preview-origin-ticket.ts)
   - Cryptographic random token generation (`crypto.randomBytes(32).toString('hex')`).
   - In-memory thread-safe registry with 15-minute sliding TTL.
   - Atomic consumption semantics (`consumeOriginTicket`) preventing replay attacks.
   - Automatic periodic pruning of stale tickets.

2. **Role Preview Initiation Endpoint**: [`src/app/api/auth/role-preview/route.ts`](file:///e:/Projects/Os_Darta/src/app/api/auth/role-preview/route.ts)
   - Verifies caller via Supabase SSR (`caller.role in ['super_admin', 'developer']` or active origin ticket).
   - Rejects unauthorized callers with `403 Forbidden` (`code: UNAUTHORIZED_CALLER`).
   - Ignores client `tenantId` (zero-trust).
   - Sets `sb-preview-origin-ticket` HttpOnly cookie.

3. **Role Preview Exit & Restoration Endpoint**: [`src/app/api/auth/role-preview/exit/route.ts`](file:///e:/Projects/Os_Darta/src/app/api/auth/role-preview/exit/route.ts)
   - Reads `sb-preview-origin-ticket` cookie.
   - Validates existence and atomically consumes ticket.
   - Re-authenticates original Super Admin via server-managed magic OTP link/credentials.
   - Clears cookie and redirects to `/dashboard/saas/preview`.

4. **SaaS Console Preview Platform Page**: [`src/app/dashboard/saas/preview/page.tsx`](file:///e:/Projects/Os_Darta/src/app/dashboard/saas/preview/page.tsx)
   - Enterprise Super Admin interface showcasing all 6 personas.
   - Shows role details, scope boundary, permissions, and security warning.
   - Allows instant launching of preview sessions.

5. **Enhanced Preview Indicator & Persona Switcher**: [`src/components/shared/PreviewIndicator.tsx`](file:///e:/Projects/Os_Darta/src/components/shared/PreviewIndicator.tsx)
   - Visible on all dashboard pages when running under `preview.*` email.
   - Displays current role badge, scope name, and action buttons.
   - **Ganti Persona**: Modal popover allowing Super Admin to pivot directly to another persona without logging out.
   - **Keluar Preview**: One-click restoration back to Super Admin SaaS Console.

6. **Clean Public Login**: [`src/app/client-page.tsx`](file:///e:/Projects/Os_Darta/src/app/client-page.tsx)
   - Restored to pristine Email + Password login.
   - Evaluation preview buttons are removed from default UI (`isPreviewUiEnabled` defaults to `false`).

---

## 4. VERIFICATION & AUTOMATED SECURITY TESTS

### Contract Test Suite: [`tests/contracts/role-preview.contract.test.ts`](file:///e:/Projects/Os_Darta/tests/contracts/role-preview.contract.test.ts)

All 14 mandatory security tests specified in the engineering directive were implemented and verified using Vitest:

| Test ID | Scenario | Expected Behavior | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Test 1** | Anonymous Caller $\rightarrow$ `POST /api/auth/role-preview` | `403 Forbidden` (`UNAUTHORIZED_CALLER`) | `HTTP 403` | ✅ PASS |
| **Test 2** | Wali Caller $\rightarrow$ `POST /api/auth/role-preview` | `403 Forbidden` (`UNAUTHORIZED_CALLER`) | `HTTP 403` | ✅ PASS |
| **Test 3** | Santri Caller $\rightarrow$ `POST /api/auth/role-preview` | `403 Forbidden` (`UNAUTHORIZED_CALLER`) | `HTTP 403` | ✅ PASS |
| **Test 4** | Musyrif Caller $\rightarrow$ `POST /api/auth/role-preview` | `403 Forbidden` (`UNAUTHORIZED_CALLER`) | `HTTP 403` | ✅ PASS |
| **Test 5** | Admin Pesantren Caller $\rightarrow$ `POST /api/auth/role-preview` | `403 Forbidden` (`UNAUTHORIZED_CALLER`) | `HTTP 403` | ✅ PASS |
| **Test 6** | Super Admin Caller $\rightarrow$ `POST /api/auth/role-preview` | `200 OK` + Sets Opaque Ticket Cookie | `HTTP 200` + 64-char Cookie | ✅ PASS |
| **Test 7** | Developer Caller $\rightarrow$ `POST /api/auth/role-preview` | `200 OK` + Sets Opaque Ticket Cookie | `HTTP 200` | ✅ PASS |
| **Test 8** | Exit Preview with Valid Ticket | `200 OK` + Restores Super Admin Session | `HTTP 200` + MaxAge=0 Cookie | ✅ PASS |
| **Test 9** | Replay Origin Ticket to Exit Preview | `403 Forbidden` (`INVALID_ORIGIN_TICKET`) | `HTTP 403` | ✅ PASS |
| **Test 10**| Expired Origin Ticket to Exit Preview | `403 Forbidden` (`INVALID_ORIGIN_TICKET`) | `HTTP 403` | ✅ PASS |
| **Test 11**| Tampered Origin Ticket to Exit Preview | `403 Forbidden` (`INVALID_ORIGIN_TICKET`) | `HTTP 403` | ✅ PASS |
| **Test 12**| Client Injects `tenantId` into Payload | Ignored; Server determines tenant scope | Tenant maintained by server | ✅ PASS |
| **Test 13**| Client Injects Malicious `role` Payload | `400 Bad Request` | `HTTP 400` | ✅ PASS |
| **Test 14**| Identity Integrity after Exit Preview | Super Admin original identity preserved | Identity verified | ✅ PASS |

### Test Execution Summary:
- **Contract Tests**: `18 passed (18)` in `tests/contracts/role-preview.contract.test.ts`.
- **Full Test Suite**: `32 passed (32)` test files, `290 passed (290)` tests across entire repository. Zero regressions.
- **TypeScript Static Verification**: `npx tsc --noEmit` passed with `0` errors.

---

## 5. RECONCILIATION SUMMARY

| Work Item | Target Path | Status |
| :--- | :--- | :--- |
| **Phase 1: Opaque Ticket Store** | `src/lib/authz/preview-origin-ticket.ts` | Complete |
| **Phase 2: SaaS Console Nav** | `src/config/navigation.ts` | Complete |
| **Phase 3: SaaS Console Preview Hub** | `src/app/dashboard/saas/preview/page.tsx` | Complete |
| **Phase 4: Caller Auth Gate in API** | `src/app/api/auth/role-preview/route.ts` | Complete |
| **Phase 5: Exit Preview Endpoint** | `src/app/api/auth/role-preview/exit/route.ts` | Complete |
| **Phase 6: Banner & Persona Switcher** | `src/components/shared/PreviewIndicator.tsx` | Complete |
| **Phase 7: Public Login Cleanup** | `src/app/client-page.tsx` | Complete |
| **Phase 8: Contract & Security Tests** | `tests/contracts/role-preview.contract.test.ts` | Complete (18/18 PASS) |
