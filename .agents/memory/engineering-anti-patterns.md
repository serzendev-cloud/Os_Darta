# ENGINEERING ANTI-PATTERNS REGISTER
## Registri Pola Kegagalan Arsitektur, Celah Keamanan, dan Solusi Baku

**Dokumen ID:** `MEMORY-ANTI-PATTERNS-v1.0`  
**Otoritas:** Product Owner (PO) APP MA'HAD  
**Status:** ACTIVE KNOWLEDGE BASE  
**Tujuan:** Mencegah kesalahan berulang pada siklus rekayasa perangkat lunak mandiri.

---

## ANTI-PATTERN 01: FALLBACK HEADER ROLE PADA RUTE PRODUKSI
- **Alias:** *Header-Based Authorization Backdoor / Test Bypass Leakage*
- **Kategori:** Application Security / Broken Access Control (CWE-285)
- **Keparahan:** **CRITICAL**

### Pola Buruk (Anti-Pattern):
```typescript
// Di dalam rute produksi: src/app/api/.../route.ts
const headerRole = request.headers.get('x-user-role');

// 1. Coba session database...
// 2. Gateway / Test Harness Fallback:
if (!isAuthorized && headerRole === 'admin_keuangan') {
  isAuthorized = true; // BAHAYA FATAL: Mempercayai klaim klien
}
```

### Mengapa Pola Ini Terjadi?
Implementer membutuhkan cara agar pengujian unit (Vitest) dapat menjalankan handler rute tanpa harus menyiapkan cookie sesi browser atau koneksi database Supabase langsung. Demi membuat pengujian unit lulus (*green test*), disisipkan jalan pintas berbasis header.

### Mengapa Ini Berbahaya?
1. **Kebocoran Lintas Tenant (IDOR):** Jika pengguna memiliki peran `admin_keuangan` di Tenant A, dan meminta data Tenant B, kueri database menolak izinnya. Namun, fallback header membatalkan penolakan tersebut dan memberikan akses ke data Tenant B!
2. **Bypass Middleware:** Jika fungsi rute dipanggil langsung atau jika konfigurasi proxy mengalami kegagalan, penyerang dapat mengirim header `x-user-role: admin_keuangan` dan langsung menguasai endpoint.

### Solusi Baku (The Right Way — Opsi A):
1. **Hapus total** blok fallback dari kode handler rute produksi.
2. Di dalam file test Vitest, lakukan mocking terhadap Supabase Server Client dan service otorisasi:
   ```typescript
   vi.spyOn(authService, 'getEffectivePermissions').mockResolvedValueOnce({
     authorized: true,
     primaryRoleCode: 'ADMIN_KEUANGAN',
     effectivePermissions: new Set(['finance:export']),
   });
   ```

---

## ANTI-PATTERN 02: VALIDASI FILE BERBASIS MAGIC BYTES SAJA
- **Alias:** *Shallow Magic Byte Verification*
- **Kategori:** Test Quality / False Sense of Security
- **Keparahan:** **MEDIUM**

### Pola Buruk (Anti-Pattern):
```typescript
// Hanya memeriksa 4 byte pertama file:
const isXlsx = buffer.slice(0, 4).toString('hex') === '504b0304'; // PK..
const isPdf = buffer.slice(0, 5).toString() === '%PDF-';
expect(isXlsx).toBe(true);
```

### Mengapa Pola Ini Berbahaya?
Format file seperti XLSX adalah arsip ZIP Open XML yang kompleks. Suatu file teks kosong yang hanya diberi prefix `PK\x03\x04` akan lulus uji magic bytes, tetapi akan *corrupt* saat dibuka oleh pengguna di Microsoft Excel. Begitu juga PDF yang rusak strukturnya akan gagal dibuka pembaca dokumen meskipun memiliki header `%PDF-`.

### Solusi Baku (The Right Way):
Uji muat dan parse struktur biner sebenarnya menggunakan library resmi secara *in-memory*:
```typescript
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(buffer);
expect(workbook.worksheets.length).toBeGreaterThan(0);

const pdfDoc = await PDFDocument.load(pdfBytes);
expect(pdfDoc.getPageCount()).toBeGreaterThan(0);
```

---

## ANTI-PATTERN 03: UNSCOPED URL PARAMETER TENANCY
- **Alias:** *Client-Dictated Tenant Context*
- **Kategori:** Multi-Tenant Architecture Breach
- **Keparahan:** **HIGH**

### Pola Buruk (Anti-Pattern):
```typescript
// Mempercayai tenantId dari parameter URL tanpa validasi:
const tenantId = searchParams.get('tenantId') || 'default';
const bills = await db.select().from(sppBills).where(eq(sppBills.tenantId, tenantId));
```

### Mengapa Pola Ini Berbahaya?
Penyerang yang terautentikasi dapat mengganti `tenantId` pada URL menjadi ID milik pesantren lain dan membaca seluruh data sensitif tagihan santri pesantren tersebut.

### Solusi Baku (The Right Way):
Selalu gunakan `tenantId` yang telah divalidasi oleh reverse proxy/middleware tepercaya dari hostname (`x-tenant-id`). Jika parameter URL disediakan, rekonsiliasi secara ketat dan tolak jika tidak cocok:
```typescript
const verifiedTenantId = request.headers.get('x-tenant-id');
if (paramTenantId && paramTenantId !== verifiedTenantId) {
  return NextResponse.json({ error: 'Akses lintas tenant ditolak' }, { status: 403 });
}
```

---

## ANTI-PATTERN 04: PENGUJIAN TAUTOLOGIS (TAUTOLOGICAL MOCK TESTING)
- **Alias:** *Self-Fulfilling Test Mocking*
- **Kategori:** Automated Testing Quality
- **Keparahan:** **MEDIUM**

### Pola Buruk (Anti-Pattern):
Menulis test yang hanya mem-mock seluruh fungsi logika bisnis lalu memverifikasi bahwa mock tersebut terpanggil, tanpa pernah menguji komputasi matematika, batasan angka, atau skenario gagal:
```typescript
vi.spyOn(service, 'calculate').mockReturnValue(100);
expect(service.calculate()).toBe(100); // Tidak menguji kalkulasi asli sama sekali
```

### Solusi Baku (The Right Way):
Mock hanya lapisan I/O eksternal (network, database driver, external payment gateway). Biarkan logika bisnis, fungsi agregasi, rumus matematika, dan sanitasi dieksekusi oleh kode asli.
