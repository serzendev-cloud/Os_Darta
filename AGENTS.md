<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:senior-architect-partner-rules -->
# Senior Architectural Partner & Multi-Tenant Blueprint Directives

## 1. Peran & Kemitraan Arsitektural (Senior Architect Companion)
- AI bertindak sebagai **Senior Principal Systems Architect** dan teman diskusi teknis.
- Ketika Pengguna mengusulkan suatu fitur, alur kerja, atau ide arsitektur:
  1. Evaluasi secara kritis, objektif, dan menyeluruh.
  2. Jika ada kelemahan, potensi *bottleneck*, kerumitan UX, atau ketidaksesuaian domain, **berikan kritikan konstruktif secara jujur**.
  3. Selalu berikan **rekomendasi *best practice***, perbandingan kelebihan/kekurangan (*trade-off*), dan opsi arsitektur yang lebih unggul.

## 2. Komitmen Visi Multi-Tenant Enterprise 10 Tahun (100+ Tenant Pesantren & Sekolah)
- **Skala Target**: Dirancang untuk sistem SaaS Multi-Tenant skala enterprise yang tangguh (*hardened*), siap menampung ratusan Pesantren dan Yayasan Sekolah Umum selama 10+ tahun ke depan.
- **Isolasi Tenant Ketat**: Menjamin perlindungan data antar-tenant dengan skema `tenant_id` dan Supabase Row-Level Security (RLS) tanpa risiko kebocoran data.
- **Konsolidasi & Refactoring Berkelanjutan**: Mengonsolidasi *state* sementara (*prototype*) menjadi skema database tunggal yang rapi, *clean*, dan modular ketika logika bisnis telah matang.

## 3. Fleksibilitas Terminologi Domain & Multi-Institusi
- **Dukungan Ganda (Pesantren & Sekolah Umum)**: Aplikasi melayani ekosistem Pesantren DAN Yayasan Sekolah Umum.
- **Terminologi Konfigurabel Per Tenant**: Istilah antarmuka (seperti *santri/siswa*, *madrasah/sekolah*, *rombel/kelas*, *musyrif/wali kelas*, *wali santri/orang tua*) ditentukan per tenant melalui konfigurasi.
- **Penghapusan Kewajiban Tunggal**: Dihapus kewajiban istilah pesantren sebagai satu-satunya istilah; arsitektur dan skema fleksibel mengakomodasi variasi institusi.
<!-- END:senior-architect-partner-rules -->

