# WP-DOMAIN-TENANT-ROOT-REMEDIATION-001 REPORT
## Remediation of Centralized Tenant Root Domain & Subdomain Resolution Engine

**Date**: September 26, 2026  
**Status**: **DOMAIN REMEDIATION CODE READY FOR PREVIEW**  
**Role**: Senior Principal Systems Architect  
**Safety Compliance**: Zero Database Mutations, Zero Auth Mutations, Zero DNS Mutations, Zero Vercel Mutations, Zero Commits/Pushes.

---

## 1. Objective
Remediasi implementasi runtime tenant domain agar tidak lagi hardcoded ke `*.madev.id`, melainkan menggunakan konfigurasi terpusat berbasis root domain resmi:
- **Root Domain**: `serzen-dev.my.id` (via `NEXT_PUBLIC_TENANT_ROOT_DOMAIN="serzen-dev.my.id"`)
- **Tenant Domain Pattern**: `<tenant-slug>.serzen-dev.my.id` (contoh: `pp-darululum.serzen-dev.my.id`, `pp-darunnajah.serzen-dev.my.id`)
- **Wildcard Scope**: `*.serzen-dev.my.id`

---

## 2. Architectural Decision
1. **Single Source of Truth**: Dibuat utility terpusat `src/config/tenant.ts` yang menyediakan fungsi client/server-safe `getTenantRootDomain()` dan `getTenantDomain(slug)`.
2. **Deterministic Proxy Subdomain Extraction**: Menggantikan logika split generik di `src/proxy.ts` dengan suffix matching deterministik terhadap `getTenantRootDomain()`, mencegah collision pada domain berformat ccTLD (`.my.id` memiliki 3 tingkatan: `[serzen-dev, my, id]`).
3. **Transitional DB State**: Data kolom `tenants.domain` pada existing tenants (`SR2601`, `SR2602`, dll.) di database dibiarkan apa adanya (tetap `<slug>.madev.id`) tanpa mutasi, karena resolusi request di middleware/proxy dan context rely pada `slug` (`pp-darunnajah`, `pp-darululum`), bukan kolom `domain`. Backfill akan dilakukan pada task terpisah setelah Preview DNS siap.
4. **Preserved Role Preview Identities**: Identitas sintetis internal preview (`preview.*@madev.id` dan `superadmin@madev.id`) dipertahankan sepenuhnya dan tidak disentuh.

---

## 3. Files Changed
| File | Deskripsi Perubahan |
|---|---|
| `src/config/tenant.ts` *(NEW)* | Utility konfigurasi root domain & generator FQDN tenant |
| `src/config/index.ts` | Re-export `tenant.ts` |
| `src/proxy.ts` | Resolusi subdomain deterministik terhadap root domain & perlindungan ccTLD apex |
| `src/modules/saas/services/tenant-provisioning-service.ts` | Penggunaan `getTenantDomain(cleanSlug)` saat insert tenant & fallback listing |
| `src/app/register/RegisterForm.tsx` | Tampilan visual dynamic `.{getTenantRootDomain()}` pada form pendaftaran |
| `src/app/dashboard/saas/tenants/page.tsx` | Tampilan label/addon & normalisasi slug modal create tenant |
| `src/app/dashboard/saas/modul-fitur/page.tsx` | Fallback subdomain display menggunakan `getTenantDomain` |
| `src/app/dashboard/pengaturan/tenant-integrasi/page.tsx` | Fallback subdomain display menggunakan `getTenantDomain` |
| `.env.local.example` | Dokumentasi variabel `NEXT_PUBLIC_TENANT_ROOT_DOMAIN="serzen-dev.my.id"` |
| `tests/contracts/tenant-domain-root.contract.test.ts` *(NEW)* | 13 test contracts lengkap memverifikasi domain & proxy parsing |
| `tests/contracts/tenant-provisioning-ui-zero-password.contract.test.ts` | Penyesuaian assertion `Subdomain Target` dengan dynamic root domain |
| `tests/contracts/public-registration-ui.contract.test.tsx` | Penyesuaian assertion URL live preview ke `serzen-dev.my.id` |

---

## 4. Domain Configuration Implementation
File: `src/config/tenant.ts`
```typescript
export const DEFAULT_TENANT_ROOT_DOMAIN = 'serzen-dev.my.id';

export function getTenantRootDomain(): string {
  const envDomain = process.env.NEXT_PUBLIC_TENANT_ROOT_DOMAIN;
  if (envDomain && envDomain.trim() !== '' && envDomain !== 'undefined') {
    return envDomain.trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  }
  return DEFAULT_TENANT_ROOT_DOMAIN;
}

export function getTenantDomain(slug: string): string {
  const cleanSlug = slug.toLowerCase().trim().replace(/^\.+|\.+$/g, '');
  const rootDomain = getTenantRootDomain();
  return `${cleanSlug}.${rootDomain}`;
}
```

---

## 5. Proxy Parsing Changes
File: `src/proxy.ts`
```typescript
export function extractTenantSlug(request: NextRequest): string {
  const url = request.nextUrl;
  const rawHost = request.headers.get('host') || '';
  const hostname = rawHost.split(':')[0].toLowerCase().trim();

  // 1. Path route /t/:slug
  if (url.pathname.startsWith('/t/')) {
    const pathParts = url.pathname.split('/');
    if (pathParts[2] && pathParts[2].trim() !== '') {
      const candidatePathSlug = pathParts[2].toLowerCase().trim();
      if (!RESERVED_HOSTNAMES.has(candidatePathSlug)) {
        return candidatePathSlug;
      }
    }
  }

  // 2. Ignore local dev / loopback
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
    return 'default';
  }

  // 3. Deterministic resolution against configured Tenant Root Domain
  const rootDomain = getTenantRootDomain();

  // Apex platform root or www -> platform default
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return 'default';
  }

  // Subdomain of configured root domain: e.g. <slug>.serzen-dev.my.id
  if (hostname.endsWith(`.${rootDomain}`)) {
    const prefix = hostname.slice(0, -(rootDomain.length + 1));
    const subParts = prefix.split('.');
    const candidateSlug = subParts[0].toLowerCase().trim();
    if (candidateSlug && !RESERVED_HOSTNAMES.has(candidateSlug)) {
      return candidateSlug;
    }
    return 'default';
  }

  // 4. Ignore Vercel preview domain subdomains
  if (hostname.endsWith('.vercel.app')) {
    return 'default';
  }

  // 5. Fallback for auxiliary / test fixture domains
  if (hostname.includes('.')) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const candidateSlug = parts[0].toLowerCase().trim();
      if (!RESERVED_HOSTNAMES.has(candidateSlug)) {
        return candidateSlug;
      }
    }
  }

  return 'default';
}
```

---

## 6. Tenant Provisioning Changes
Pada `src/modules/saas/services/tenant-provisioning-service.ts`:
- Candidate domain saat insert record `tenants`:
  ```typescript
  const candidateDomain = getTenantDomain(cleanSlug);
  ```
- Resend invitation payload subdomain:
  ```typescript
  subdomain: tenantRow.domain || getTenantDomain(tenantRow.slug),
  ```
- SaaS list tenants API fallback:
  ```typescript
  subdomain: t.domain || getTenantDomain(t.slug),
  ```

---

## 7. Frontend Changes
- **`RegisterForm.tsx`**: Addon input menampilkan `.{getTenantRootDomain()}` dan live preview `https://{slug}.{getTenantRootDomain()}`.
- **`saas/tenants/page.tsx`**: Label modal menampilkan `Subdomain Target (.{getTenantRootDomain()})` dan normalisasi input menghapus suffix `getTenantRootDomain()`.
- **`saas/modul-fitur/page.tsx` & `tenant-integrasi/page.tsx`**: Menggunakan fallback `getTenantDomain` untuk tampilan subdomain tenant.

---

## 8. Test Changes & New Contract Suite
File: `tests/contracts/tenant-domain-root.contract.test.ts` (13 tests)
- Test 1: `getTenantRootDomain()` returns `serzen-dev.my.id` by default.
- Test 1b: `getTenantRootDomain()` respects `NEXT_PUBLIC_TENANT_ROOT_DOMAIN`.
- Test 2: `getTenantDomain('pp-darululum')` $\rightarrow$ `pp-darululum.serzen-dev.my.id`.
- Test 3: Proxy extracts `pp-darululum` from `pp-darululum.serzen-dev.my.id`.
- Test 3b: Proxy handles host with port `pp-darunnajah.serzen-dev.my.id:3000`.
- Test 4: Apex `serzen-dev.my.id` resolves to `default`.
- Test 5: `www.serzen-dev.my.id` resolves to `default`.
- Test 6: ccTLD apex `'serzen-dev'` is strictly prevented from being treated as tenant slug.
- Test 7: Static analysis confirms provisioning service uses `getTenantDomain`.
- Test 8: `/t/:slug` path routing preserved.
- Test 9: Role preview identities (`preview.*@madev.id`) preserved.
- Test 10: Activation URL continues using `NEXT_PUBLIC_APP_URL`.
- Test 11: Transitional state for existing DB tenant domains documented.

---

## 9. Validation Results

1. **Focused Contract Test (`tenant-domain-root.contract.test.ts`)**:
   - `13 passed (13)` (100% PASS)
2. **Zero Password Contract Test (`tenant-provisioning-ui-zero-password.contract.test.ts`)**:
   - `6 passed (6)` (100% PASS)
3. **Public Registration UI Contract Test (`public-registration-ui.contract.test.tsx`)**:
   - `6 passed (6)` (100% PASS)
4. **Full Workspace Vitest Suite**:
   - `43 test files passed (43)`
   - `416 tests passed (416)` (0 failures, 100% clean)
5. **TypeScript Check (`npx tsc --noEmit`)**:
   - Exit code: 0 (0 errors)
6. **Production Build (`npm run build`)**:
   - Turbopack Next.js 16 build: `Compiled successfully in 9.2s`
   - Static route generation: `88/88 routes generated`

---

## 10. Safety Check Confirmations

| Pemeriksaan Keamanan | Status | Keterangan |
|---|---|---|
| **Database Mutations** | **0** | Tidak ada DDL, DML, UPDATE, ataupun migrasi |
| **Supabase Auth Mutations** | **0** | Tidak ada mutasi user / password |
| **DNS Mutations** | **0** | DNS tidak disentuh |
| **Vercel Mutations** | **0** | Vercel dashboard / environment tidak disentuh |
| **Git Commit / Push** | **0** | Tidak ada commit atau push |
| **Existing Tenant Data Untouched** | **TERJAMIN** | `SR2601` dan `SR2602` tetap utuh di DB |

---

## 11. Remaining Work (Next Phase Roadmap)
1. **DNS Wildcard Configuration**: Memastikan DNS CNAME record wildcard `*.serzen-dev.my.id` diarahkan ke Vercel (`cname.vercel-dns.com`).
2. **Vercel Preview Custom Domain**: Menambahkan wildcard domain `*.serzen-dev.my.id` pada project Vercel.
3. **Real Tenant Subdomain E2E Test**: Menguji navigasi live browser ke `https://pp-darululum.serzen-dev.my.id` dan `https://pp-darunnajah.serzen-dev.my.id`.
4. **Existing Tenants DB Domain Backfill**: Menjalankan skrip database UPDATE terverifikasi untuk memperbarui nilai kolom `tenants.domain` pada 6 tenant existing dari `*.madev.id` ke `*.serzen-dev.my.id`.
5. **Final Release Audit & Production Merge**: Verifikasi menyeluruh sebelum deployment ke Production branch `main`.

---

## 12. Final Verdict
**`DOMAIN REMEDIATION CODE READY FOR PREVIEW`**
