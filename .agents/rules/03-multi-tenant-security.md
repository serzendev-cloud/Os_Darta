# MULTI-TENANT SECURITY & DATA ISOLATION ARCHITECTURE
## Standar Keamanan Aplikasi, Isolasi Tenant, dan Pencegahan Celah Finansial

**Dokumen ID:** `RULES-MULTI-TENANT-SECURITY-v1.0`  
**Otoritas:** Product Owner (PO) APP MA'HAD  
**Status:** MANDATORY SECURITY DIRECTIVE  
**Prinsip Desain:** Zero-Trust Tenancy, Defense-in-Depth, Enterprise 10-Year Hardening

---

## 1. PRINSIP UTAMA ISOLASI TENANT

Sistem APP MA'HAD melayani ratusan institusi pesantren secara mandiri di atas infrastruktur basis data bersama (*shared database multi-tenancy*). Oleh karena itu, kebocoran data antar-pesantren merupakan pelanggaran keamanan tingkat **CRITICAL**.

Prinsip Mutlak:
1. **Tidak Ada Akses Lintas Tenant:** Pengguna dari Pesantren A tidak boleh dapat melihat, mengedit, menghapus, atau mengekspor data milik Pesantren B dalam kondisi apa pun.
2. **Konteks Tenant Berasal dari Sumber Tepercaya:** Identitas `tenant_id` wajib ditentukan oleh server (reverse proxy atau middleware tepercaya), **BUKAN DARI PARAMETER KLIEN**.
3. **Database-Level Row Security (Supabase RLS):** Setiap tabel bisnis wajib memiliki kebijakan RLS berbasis `tenant_id` sebagai lapis pertahanan kedua di bawah validasi rute API.

---

## 2. CHECKLIST KEAMANAN RUTE API MULTI-TENANT

Setiap endpoint API di dalam direktori `src/app/api/` wajib mematuhi aturan berikut:

### A. Autentikasi dan Resolusi Identitas
- [ ] Endpoint memvalidasi sesi server menggunakan `createSupabaseServerClient().auth.getUser()`.
- [ ] Menolak request anonim dengan **`HTTP 401 Unauthorized`** (kecuali rute publik yang terdaftar eksplisit).
- [ ] Menolak request yang tidak memiliki keanggotaan aktif pada tenant terkait dengan **`HTTP 403 Forbidden`**.

### B. Anti-IDOR & Tenancy Parameter Reconciliation
- [ ] Jika URL atau body memuat parameter `tenantId`, nilainya **wajib dicocokkan** dengan `x-tenant-id` yang telah divalidasi oleh reverse proxy tepercaya:
  ```typescript
  if (paramTenantId && paramTenantId !== verifiedTenantId) {
    return NextResponse.json({ error: 'Akses lintas tenant ditolak' }, { status: 403 });
  }
  ```
- [ ] Kueri ORM (Drizzle) wajib menyertakan filter eksplisit: `eq(table.tenantId, verifiedTenantId)`.

### C. Larangan Keras: Header-Based Role Fallback (Anti-Pattern #1)
- [ ] **DILARANG KERAS** mempercayai header `x-user-role`, `x-user-id`, atau `x-is-super-admin` di dalam kode handler rute produksi untuk meloloskan otorisasi:
  ```typescript
  // TERLARANG (VULNERABILITY):
  if (!isAuthorized && headerRole === 'admin_keuangan') {
    isAuthorized = true; // MELANGGAR KEAMANAN ZERO-TRUST
  }
  ```
- [ ] Otorisasi wajib berasal murni dari basis data server melalui `getEffectivePermissions(userId, tenantId)`.
- [ ] Kebutuhan pengujian unit Vitest wajib dipenuhi melalui **Mocking Auth Service pada Test Harness**, bukan dengan meninggalkan pintu belakang (*backdoor*) di kode produksi.

### D. Pertahanan Formula Injection (CSV / Excel Injection)
- [ ] Seluruh data teks pengguna yang diekspor ke berkas Excel (nama santri, NIS, catatan, judul tagihan) wajib disanitasi:
  ```typescript
  export function sanitizeExcelFormulaCell(val: unknown): string {
    if (val === null || val === undefined) return '';
    const str = String(val).trim();
    const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
    if (dangerousPrefixes.some((p) => str.startsWith(p))) {
      return `'${str}`;
    }
    return str;
  }
  ```
- [ ] Nilai nominal uang wajib disimpan dan diekspor sebagai tipe numerik asli (`number`), bukan string berpenampilan angka.

### E. Penanganan Error Fail-Closed
- [ ] Blok `try ... catch` pada handler rute wajib mengembalikan pesan kesalahan generik tanpa membocorkan rincian teknis internal (nama tabel, baris error, stack trace, connection string).
- [ ] Log detail teknis hanya dicatat ke logger internal server (*stdout/console.error*).
