# POST-MORTEM & LESSONS LEARNED REGISTER
## Registri Pembelajaran Kegagalan Rekayasa dan Tindak Lanjut Pencegahan

**Dokumen ID:** `MEMORY-POST-MORTEM-v1.0`  
**Otoritas:** Product Owner (PO) APP MA'HAD  
**Status:** ACTIVE INCIDENT & AUDIT POST-MORTEM REGISTER  
**Metodologi:** 8-Question Root Cause Analysis per `ZENORION-EVOLUTION-001`

---

## POST-MORTEM 001: DETEKSI DAN REMEDIASI FALLBACK HEADER ROLE PADA SEMBILAN RUTE KEUANGAN

### 1. Deskripsi Kejadian
Pada audit suplemen `APP-MAHAD-FINANCE-BILLING-001` (21-22 Oktober 2026), ditemukan bahwa rute ekspor keuangan dan 7 rute finansial lainnya memiliki pola otorisasi ganda yang mempercayai header `x-user-role === 'admin_keuangan'` apabila sesi server database gagal.

### 2. Evaluasi 8 Pertanyaan Kunci

1. **Apa yang berhasil?**  
   Audit independen ICQA berhasil menemukan celah ini sebelum rilis ke Production, dan Product Owner secara tegas menolak penanganan parsial berbasis `NODE_ENV === 'test'` sementara, mengarahkan pada solusi arsitektural sejati (Opsi A: Auth Mocking).
2. **Kesalahan apa yang ditemukan?**  
   Adanya kode fallback otorisasi berbasis header klien yang memungkinkan bypass pengecekan izin database (*permission service bypass*) dan potensi kebocoran lintas tenant (*IDOR*).
3. **Mengapa kesalahan tersebut terjadi?**  
   Implementer membutuhkan cara agar pengujian unit (Vitest) dapat memicu handler API tanpa koneksi Supabase langsung, dan memilih solusi cepat dengan menyisipkan fallback di rute produksi alih-alih menyiapkan mock test harness.
4. **Dari mana sumber kesalahan?**  
   Kombinasi antara **desain pengujian (Test Harness Deficiency)** dan **kecerobohan implementasi (Hardening Compromise)**.
5. **Apakah masalah serupa pernah terjadi?**  
   Ya, pola serupa ditemukan berulang di 9 rute keuangan dan 2 rute wali santri karena implementer menyalin pola (*copy-paste*) antar-file rute.
6. **Bagaimana mencegah pengulangan?**  
   - Menghapus seluruh fallback dari rute produksi.
   - Memasukkan pola ini ke dalam `engineering-anti-patterns.md`.
   - Menjadikan verifikasi *Zero-Header-Role-Trust* sebagai item wajib pada Gate B dan Gate D.
7. **Standar apa yang perlu diperbaiki?**  
   - Menetapkan aturan `RULES-MULTI-TENANT-SECURITY` yang melarang fallback peran berbasis header.
   - Menyiapkan modul helper pengujian unit terstandar (`test-auth-helper.ts`) agar pengujian tidak memerlukan trik header.
8. **Bagaimana membuktikan perbaikan efektif?**  
   Eksekusi Matriks Pengujian Negatif (SEC-TEST-01 s/d SEC-TEST-05) yang membuktikan bahwa pengiriman header `x-user-role` tanpa sesi database yang sah selalu ditolak dengan status 401/403.

---

## POST-MORTEM 002: KETERBATASAN FONT HELVETICA PADA DOKUMEN PDF MULTI-HALAMAN

### 1. Deskripsi Kejadian
Pustaka `pdf-lib` menggunakan font standar Helvetica (WinAnsi encoding) yang tidak dapat merender karakter non-Latin (seperti aksara Arab murni atau tulisan Pegon pada nama santri/keterangan tagihan).

### 2. Tindakan Pencegahan & Mitigasi
Dicatat sebagai batasan teknis berstatus `INFORMATIONAL` pada dokumen arsitektur. Pada iterasi masa depan (v2), sistem akan mengintegrasikan font TrueType kustom (Amiri / Noto Naskh) yang disematkan secara lokal jika institusi pesantren mewajibkan penulisan aksara Arab.
