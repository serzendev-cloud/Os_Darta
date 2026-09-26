# WP-DOMAIN-TENANT-PROXY-FAIL-CLOSED-002 REPORT
## Hardening Tenant Hostname Resolution to Strict Fail-Closed Boundary

**Date**: September 26, 2026  
**Status**: **PROXY FAIL-CLOSED READY FOR COMMIT**  
**Role**: Senior Principal Systems Architect  
**Safety Compliance**: Zero Database Mutations, Zero Auth Mutations, Zero DNS Mutations, Zero Vercel Mutations, Zero Commits/Pushes.

---

## 1. Root Cause
Sebelum remediasi ini, `src/proxy.ts` memiliki fallback generik:
```typescript
if (hostname.includes('.')) {
  const parts = hostname.split('.');
  if (parts.length > 2) {
    const candidateSlug = parts[0].toLowerCase().trim();
    if (!RESERVED_HOSTNAMES.has(candidateSlug)) {
      return candidateSlug;
    }
  }
}
```
Cacat arsitektur pada fallback tersebut:
1. **Open Domain Resolution**: Hostname eksternal/asing (seperti `foo.example.com` atau `malicious.attacker.org`) secara keliru diekstrak menjadi tenant slug `'foo'` atau `'malicious'`, memicu query database downstream untuk mencari tenant slug yang tidak sah.
2. **Insecure Boundary**: Hostname resolution tidak mengunci otorisasi ke root domain terdaftar (`NEXT_PUBLIC_TENANT_ROOT_DOMAIN="serzen-dev.my.id"`), melainkan mengasumsikan sembarang domain 3 tingkatan sebagai tenant.

---

## 2. Generic Fallback Removed / Restricted
Blok fallback generik di `src/proxy.ts` telah **dihapus sepenuhnya**.

Implementasi final `extractTenantSlug()` sekarang bersifat **murni fail-closed**:
```typescript
export function extractTenantSlug(request: NextRequest): string {
  const url = request.nextUrl;
  const rawHost = request.headers.get('host') || '';
  const hostname = rawHost.split(':')[0].toLowerCase().trim();

  // 1. Check path route /t/:slug
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

  // 4. Fail-closed: Vercel preview domains and all foreign/unauthorized hostnames default to platform
  return 'default';
}
```

---

## 3. Expected Hostname Behavior Matrix (Verified)

| No | Incoming Host | Path | Resolved Tenant Slug | Context | Status |
|---|---|---|---|---|---|
| 1 | `serzen-dev.my.id` | `/` | `'default'` | Platform Apex | **PASS** |
| 2 | `www.serzen-dev.my.id` | `/dashboard` | `'default'` | Platform WWW | **PASS** |
| 3 | `pp-darululum.serzen-dev.my.id` | `/login` | `'pp-darululum'` | Tenant Subdomain | **PASS** |
| 4 | `pp-darunnajah.serzen-dev.my.id` | `/dashboard` | `'pp-darunnajah'` | Tenant Subdomain | **PASS** |
| 5 | `pp-darululum.serzen-dev.my.id:3000` | `/login` | `'pp-darululum'` | Port Stripped Subdomain | **PASS** |
| 6 | `foo.example.com` | `/login` | `'default'` | Foreign Host (Fail-Closed) | **PASS** |
| 7 | `malicious.example.com` | `/dashboard` | `'default'` | Untrusted Host (Fail-Closed) | **PASS** |
| 8 | `random.subdomain.other-domain.com` | `/` | `'default'` | Multi-level Foreign (Fail-Closed) | **PASS** |
| 9 | `localhost:3000` | `/login` | `'default'` | Local Development | **PASS** |
| 10 | `127.0.0.1:3000` | `/login` | `'default'` | Loopback IP | **PASS** |
| 11 | `localhost:3000` | `/t/pp-darululum/login` | `'pp-darululum'` | Explicit Path Routing | **PASS** |
| 12 | `preview-branch-123.vercel.app` | `/dashboard` | `'default'` | Vercel Preview Host | **PASS** |

---

## 4. Security Boundary
- **Authorized Domain Barrier**: Hanya request yang berakhiran `.${getTenantRootDomain()}` (misal `.serzen-dev.my.id`) atau path eksplisit `/t/:slug` yang diizinkan menghasilkan tenant slug.
- **Zero-Trust Header Overwrite**: Proxy menimpa header `x-tenant-id` dan `x-tenant-slug` dengan hasil resolusi server yang terverifikasi, mengabaikan header kiriman client.
- **Fail-Closed Principle**: Seluruh domain yang tidak cocok secara langsung jatuh ke `'default'`, mencegah DNS spoofing atau host pollution mengakses context tenant lain.

---

## 5. Test Changes & Alignments
1. **[tests/contracts/tenant-domain-root.contract.test.ts](file:///e:/Projects/Os_Darta/tests/contracts/tenant-domain-root.contract.test.ts)**:
   - Ditambahkan Test 12 yang menguji sekumpulan foreign hostnames (`foo.example.com`, `malicious.example.com`, `random.subdomain.other-domain.com`, `evil-phishing.org`, dll.) terbukti menghasilkan `'default'`.
2. **[tests/contracts/auth-proxy.security.test.ts](file:///e:/Projects/Os_Darta/tests/contracts/auth-proxy.security.test.ts)**:
   - Fixture diupdate dari `daruttauhid.mahad-app.com` dan `alfatih.mahad-app.com` menjadi `daruttauhid.serzen-dev.my.id` dan `alfatih.serzen-dev.my.id`.
3. **[tests/contracts/tenant-rls-isolation.security.test.ts](file:///e:/Projects/Os_Darta/tests/contracts/tenant-rls-isolation.security.test.ts)**:
   - Fixture diupdate dari `alfatih.madev.id` menjadi `alfatih.serzen-dev.my.id`.
4. **[tests/security/tenant-rls.e2e.security.test.ts](file:///e:/Projects/Os_Darta/tests/security/tenant-rls.e2e.security.test.ts)**:
   - Fixture diupdate dari `alfatih.madev.id` menjadi `alfatih.serzen-dev.my.id`.

---

## 6. Validation Results

- **Focused Security Contracts**:
  - `tenant-domain-root.contract.test.ts`: **13/13 PASSED**
  - `auth-proxy.security.test.ts`: **11/11 PASSED**
  - `tenant-rls-isolation.security.test.ts`: **15/15 PASSED**
  - `tenant-rls.e2e.security.test.ts`: **18/18 PASSED**
- **Full Vitest Suite**: **43 test files, 416 tests PASSED** (100% clean)
- **TypeScript Check (`npx tsc --noEmit`)**: **0 errors** (Exit code: 0)
- **Production Build (`npm run build`)**: **88/88 static routes generated** (Exit code: 0)

---

## 7. Explicit Safety Checks

```text
Database mutations       : 0 (Live DB untouched)
Supabase Auth mutations  : 0
DNS mutations            : 0
Vercel mutations         : 0
Git commits / pushes     : 0
Role Preview identities  : Untouched (Internal identities preserved)
Existing Tenants (SR2601): Untouched (Transitional DB domain preserved)
```

---

## 8. Remaining Work
1. Product Owner authorization untuk commit perubahan domain & proxy fail-closed.
2. Wildcard DNS & Vercel domain provisioning untuk `*.serzen-dev.my.id`.
3. E2E live preview testing pada `pp-darululum.serzen-dev.my.id`.
4. Backfill data kolom `tenants.domain` pada existing tenants di database.

---

## 9. Final Status
**`PROXY FAIL-CLOSED READY FOR COMMIT`**
