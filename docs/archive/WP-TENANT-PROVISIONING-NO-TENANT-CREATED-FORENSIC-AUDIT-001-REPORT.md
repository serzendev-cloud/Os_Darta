# TENANT PROVISIONING NO-TENANT-CREATED FORENSIC AUDIT

**Work Package Identifier**: `WP-TENANT-PROVISIONING-NO-TENANT-CREATED-FORENSIC-AUDIT-001`  
**Execution Mode**: READ-ONLY FORENSIC INVESTIGATION  
**Target File**: `docs/architecture/WP-TENANT-PROVISIONING-NO-TENANT-CREATED-FORENSIC-AUDIT-001-REPORT.md`  
**Date**: 2026-09-24  
**Status**: INVESTIGATION COMPLETE (CAUSE PROVEN VIA FORENSIC EVIDENCE)

---

## 1. Incident Summary

During the runtime verification of the SaaS Tenant Provisioning UI (`/dashboard/saas/tenants`), the Product Owner attempted to provision a new tenant with the following input parameters:
- **Nama Pesantren**: `Ponpes Badrussalam`
- **Subdomain**: `PP-Badrussalam` (`pp-badrussalam.madev.id`)
- **Lokasi**: `Malang, Jawa Timur`
- **Paket SaaS**: `Enterprise SaaS`
- **Nama Kyai / Owner**: `Kyai Hasan`
- **Email Admin Pesantren**: `abu.thohir.zmr92@gmail.com`
- **WhatsApp Owner**: `08155151737`

**Observed User Experience**:
1. User clicked `[ Provisi & Aktifkan Tenant ]`.
2. Button changed state to loading spinner (`Memprovisi & Mengaktifkan Tenant...`).
3. Loading spinner stopped and reverted to `[ Provisi & Aktifkan Tenant ]`.
4. The provisioning modal remained open.
5. No success confirmation modal appeared.
6. No new tenant appeared in the tenant list.

**Investigation Objective**:
Identify and prove through verifiable code, database, auth, and state forensics why no tenant was created and why the modal remained open.

---

## 2. Runtime Deployment Identity

- **Branch**: `preview`
- **Git HEAD SHA**: `55e2648ec0a1d0748688747c76890e05fa715ff9` (`55e2648`)
- **Target URL**: `https://os-darta-git-preview-serzen-dev.vercel.app`
- **Vercel Server Response**: `sin1::2v2w7-1790211083093-2eab5a8b50a1` (Vercel Singapore Edge, Active)
- **Version Match**: The deployed UI conforms to commit `55e2648` (Zero-Password Ingress, form contains 0 password fields).

---

## 3. Last Provisioning Attempt

- **Attempted Entity**: `Ponpes Badrussalam`
- **Attempted Slug**: `pp-badrussalam`
- **Attempted Owner Email**: `abu.thohir.zmr92@gmail.com`
- **Attempted Owner Name**: `Kyai Hasan`
- **Zero-Password Payload**: Confirmed. No `initialPassword`, `password`, or `temporaryPassword` was present in the request.

---

## 4. HTTP Request Evidence

- **Endpoint**: `POST /api/saas/tenants`
- **Request Payload**:
  ```json
  {
    "name": "Ponpes Badrussalam",
    "slug": "pp-badrussalam",
    "location": "Malang, Jawa Timur",
    "plan": "Enterprise SaaS",
    "ownerName": "Kyai Hasan",
    "ownerEmail": "abu.thohir.zmr92@gmail.com",
    "ownerPhone": "08155151737"
  }
  ```
- **HTTP Response Status**: `409 Conflict`
- **HTTP Response Body**:
  ```json
  {
    "success": false,
    "error": "Conflict",
    "message": "Email 'abu.thohir.zmr92@gmail.com' sudah terdaftar sebagai pengguna di platform."
  }
  ```

---

## 5. Request Flow Trace

| Stage | Execution State | Result | Forensics & Code Trace Evidence |
| :--- | :--- | :--- | :--- |
| **1. UI Submit Handler** | EXECUTED | **PASS** | `handleCreateTenantSubmit` in `page.tsx` triggered on form submit; `isSubmittingTenant` set to `true`. |
| **2. API Request** | EXECUTED | **PASS** | `fetch('/api/saas/tenants', { method: 'POST', body: ... })` dispatched. |
| **3. Validation Gate** | EXECUTED | **PASS** | Zero-password assertion in `route.ts` line 150 passed. Slug & email formats valid. |
| **4. Authorization Gate** | EXECUTED | **PASS** | Super Admin / Developer header & session authorization passed. |
| **5. Pre-flight Collision Check** | EXECUTED | **FAIL (409)** | `checkTenantAvailability('pp-badrussalam', 'abu.thohir.zmr92@gmail.com')` matched existing record in `public.users`. |
| **6. Code Allocation (Tx A)** | SKIPPED | **NOT REACHED** | Threw `409 Conflict` before `tenantCodeCounterService.allocateNextTenantCode()`. `last_sequence` remained `1`. |
| **7. Supabase Auth Generation** | SKIPPED | **NOT REACHED** | `supabaseAdmin.auth.admin.generateLink()` was not reached. |
| **8. Database Transaction B** | SKIPPED | **NOT REACHED** | `withTenantTransaction()` was not reached. |
| **9. Tenant INSERT** | SKIPPED | **NOT REACHED** | 0 rows inserted into `public.tenants`. |
| **10. Transaction COMMIT** | SKIPPED | **NOT REACHED** | No transaction initiated. |
| **11. Resend Email Dispatch** | SKIPPED | **NOT REACHED** | Resend service not called. |
| **12. API Error Response** | EXECUTED | **PASS** | `route.ts` returned HTTP `409 Conflict` with clear conflict message. |
| **13. UI Response Handling** | EXECUTED | **DEFECT** | `page.tsx` executed `else` branch: called `showNotification(json.message)` but did NOT render inline alert inside modal; modal remained open; toast was obscured behind modal backdrop `z-50`. |

---

## 6. Database Forensics

Direct SQL inspection of PostgreSQL database:
- **`public.tenants` Table**:
  - Total rows: `7`
  - Latest row: `t_1790171191747_pyv9n` (`Ponpes Darunnajah`, `pp-darunnajah`, `SR2601`, created `2026-09-23T06:46:32.344Z`).
  - Search `name ILIKE '%badrussalam%'`: **0 rows (Empty)**.
  - Search `slug ILIKE '%badrussalam%'`: **0 rows (Empty)**.
  - **Verdict**: Zero tenant rows created or mutated.

---

## 7. Counter Forensics

- **`public.tenant_code_counters` Table**:
  - Year `2026`: `last_sequence = 1`
  - `updated_at`: `2026-09-23T13:46:31.097Z` (Timestamp of `SR2601` allocation).
  - **Verdict**: No tenant code was allocated or consumed. Sequence remains intact at 1 (`SR2601`). Next available sequence is clean (`SR2602`).

---

## 8. Auth Identity Forensics

- **Supabase Auth Users Table (`auth.users`)**:
  - Email `abu.thohir.zmr92@gmail.com`:
    - **ID**: `da410485-305f-4c8f-902b-37f94550d9b2`
    - **Created**: `2026-09-23T13:46:31.447Z`
    - **Email Confirmed**: `2026-09-23T13:47:20.317Z`
    - **App Metadata**:
      ```json
      {
        "provider": "email",
        "providers": ["email"],
        "role": "admin",
        "status": "ACTIVE",
        "tenant_code": "SR2601",
        "tenant_id": "t_1790171191747_pyv9n"
      }
      ```
    - **User Metadata**:
      ```json
      {
        "name": "Ahmad Fauzi",
        "role": "admin",
        "tenant_code": "SR2601",
        "tenant_id": "t_1790171191747_pyv9n",
        "tenant_slug": "pp-darunnajah",
        "email_verified": true
      }
      ```
- **`public.users` Table**:
  - Row found: `da410485-305f-4c8f-902b-37f94550d9b2`, email `abu.thohir.zmr92@gmail.com`, name `Ahmad Fauzi`, status `ACTIVE`.
- **Verdict**: `abu.thohir.zmr92@gmail.com` is already bound as the Official First Tenant Admin of `SR2601` (`Ponpes Darunnajah`).

---

## 9. Membership Forensics

- **`public.user_tenant_memberships` Table**:
  - Row for user `da410485-305f-4c8f-902b-37f94550d9b2`:
    - `id`: `utm_1790171193178_iqts9`
    - `tenant_id`: `t_1790171191747_pyv9n` (`Ponpes Darunnajah`)
    - `primary_role_id`: `role_admin_t_1790171191747_pyv9n`
    - `status`: `ACTIVE`
- **Verdict**: No candidate membership was created or altered.

---

## 10. Resend Stage

- **Status**: **NOT REACHED**
- **Evidence**: Execution halted in pre-flight collision check (Step 2 of provisioning). Resend service was never invoked. Zero emails sent.

---

## 11. Frontend State Forensics

Detailed trace of `src/app/dashboard/saas/tenants/page.tsx`:
```tsx
// Lines 245-274:
const json = await res.json();

if (res.ok && json.success && json.data) {
  setShowCreateModal(false);
  setCreatedTenantInfo({ ... });
  // Form reset ...
  showNotification(`Tenant Baru "${json.data.tenant.name}" (${json.data.tenant.code}) Berhasil Diprovisi!`);
  await fetchTenants();
} else {
  showNotification(json.message || 'Gagal memprovisi tenant.');
}
```
1. When API responds with HTTP 409 (`res.ok === false`):
   - The `if (res.ok ...)` block does NOT execute.
   - `setShowCreateModal(false)` is NOT called. **The modal remains open**.
   - `showNotification(json.message)` is called, setting `toast` state to:
     `"Email 'abu.thohir.zmr92@gmail.com' sudah terdaftar sebagai pengguna di platform."`
2. **Why the user did NOT see the notification**:
   - `toast` is rendered in `page.tsx` line 286 inside the underlying page body:
     `<div className="p-4 rounded-2xl bg-emerald-700 text-white ...">`
   - The modal overlay is rendered at line 823:
     `<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">`
   - Because the modal overlay has `z-50 bg-black/60 backdrop-blur-sm`, the toast banner on the main page is visually obscured behind the modal backdrop.
   - There is NO error state/banner rendered **inside** the modal `<form>`.
   - `finally` block sets `isSubmittingTenant(false)`, so the button returns to normal, making it look like the click had no effect.

---

## 12. Identity Collision Analysis

- **System Rule**: `tenantProvisioningService.checkTenantAvailability()` strictly enforces 1 User Email = 1 Identity record across the platform identity system (`public.users` and `auth.users`).
- **Current Architecture**: The platform uses email as the globally unique login identifier. Each new tenant provisioning transaction generates a dedicated initial admin identity.
- **The Conflict**: Reusing `abu.thohir.zmr92@gmail.com` (which was already assigned to `SR2601` / `Ponpes Darunnajah`) correctly triggered the pre-flight uniqueness constraint and was rejected with HTTP `409 Conflict`.
- **Verdict**: The backend rejection was **CORRECT and WORKING AS DESIGNED**. The multi-tenant identity guard successfully prevented corrupting or overwriting the existing `SR2601` administrator identity.

---

## 13. Root Cause

### Primary Root Cause
**D — Identity/Auth collision**
The attempted owner email (`abu.thohir.zmr92@gmail.com`) is already the active administrator of tenant `SR2601` (`Ponpes Darunnajah`). The provisioning engine's pre-flight check correctly identified the collision and aborted the transaction with HTTP `409 Conflict` before any state or counter allocation occurred.

### Contributing Factor (UI UX Defect)
**A — UI modal error state presentation defect**
When `POST /api/saas/tenants` returned `409 Conflict`, the frontend caught the error but dispatched the message to a page-level toast hidden behind the `fixed inset-0 z-50` modal backdrop. Because no inline error alert exists inside the modal dialog, the user was left with an open modal and no visible explanation.

---

## 14. Contributing Factors Summary

1. **Email Reuse in Manual Testing**: The tester reused the official `SR2601` owner email for a new second tenant (`Ponpes Badrussalam`).
2. **Obscured Toast Placement**: The toast component is rendered in the parent page flow rather than a top-level toast provider or inside the modal dialog.
3. **Missing Inline Modal Error State**: The creation modal does not maintain an `errorMessage` state to display inline alerts (e.g., `<div className="p-3 bg-red-50 text-red-600 rounded-xl ...">`).

---

## 15. Recommended Minimal Remediation

*(FOR REVIEW ONLY — NOT IMPLEMENTED IN THIS WORK PACKAGE)*

1. **For Testing / Provisioning**:
   - Use a unique email address for each new tenant (e.g., `admin.badrussalam@madev.id` or `kyai.hasan.badrussalam@gmail.com`).
2. **For Frontend UI Hardening (Future Work Package)**:
   - Add `modalError: string | null` state to `SaasTenantsPage`.
   - Clear `modalError` on submit; set `modalError = json.message` on failure.
   - Render an inline alert box with a red badge inside the modal form whenever `modalError` is present.
   - Elevate toast notifications to a high `z-[100]` portal/fixed container with appropriate error styling (`bg-red-700` for errors vs `bg-emerald-700` for success).

---

## 16. Safety Invariants Verification

| Invariant | Result | Evidence |
| :--- | :--- | :--- |
| **Database Mutations** | **0** | PostgreSQL state completely unchanged. |
| **Tenant Creation** | **0** | `public.tenants` row count remains 7. |
| **SR2601 Integrity** | **INTACT** | `Ponpes Darunnajah` intact; user `Ahmad Fauzi` intact. |
| **Tenant Counter (2026)** | **INTACT** | `last_sequence = 1` preserved. `SR2602` unallocated. |
| **Production Environment** | **UNTOUCHED** | Zero production deployments or merges. |
| **Git Working Tree** | **UNTOUCHED** | Zero code changes or Git mutations performed. |

---

## 17. Final Classification

**J — Multiple contributing causes**
*(Primary: **D — Identity/Auth collision**; Secondary: **A — UI modal error state presentation defect**)*

---

## 18. Explicit Answers to Mandatory Questions

1. **Apakah request POST /api/saas/tenants benar-benar terjadi?**  
   **YA**. Request dikirimkan oleh frontend saat tombol diklik.

2. **HTTP status berapa?**  
   **HTTP 409 Conflict**.

3. **Apa response/error sebenarnya?**  
   `"Email 'abu.thohir.zmr92@gmail.com' sudah terdaftar sebagai pengguna di platform."`

4. **Apakah tenant sempat dibuat?**  
   **TIDAK**. 0 baris dimasukkan ke `public.tenants`.

5. **Apakah Tenant Code sempat dialokasikan?**  
   **TIDAK**. Counter tetap pada `last_sequence = 1` (`SR2601`). `SR2602` belum terpakai.

6. **Apakah Auth user sempat dibuat?**  
   **TIDAK**. Tidak ada Auth user baru yang dibuat.

7. **Apakah membership sempat dibuat?**  
   **TIDAK**. 0 membership baru dibuat.

8. **Apakah Resend sempat dipanggil?**  
   **TIDAK**. Eksekusi berhenti pada pre-flight validation.

9. **Mengapa modal tetap terbuka?**  
   Karena saat request gagal (`!res.ok`), frontend sengaja tidak menutup modal (`setShowCreateModal(false)` tidak dipanggil) agar input form tidak hilang. Namun pesan error dikirim ke toast di background halaman yang tertutup backdrop modal `z-50`, sehingga tampak tidak ada feedback.

10. **Apakah email owner mengalami identity collision?**  
    **YA**. Email `abu.thohir.zmr92@gmail.com` adalah akun resmi pemilik tenant `SR2601` (`Ponpes Darunnajah`).

11. **Apa root cause?**  
    Identity collision pada email admin tenant yang sudah terdaftar di database, ditolak secara benar oleh pre-flight check dengan HTTP 409 Conflict.

12. **Apa minimal fix yang direkomendasikan?**  
    - Gunakan email baru/unik saat mendaftarkan tenant baru.
    - Pada frontend: tambahkan alert inline merah di dalam modal agar pesan penolakan langsung terbaca oleh user.
