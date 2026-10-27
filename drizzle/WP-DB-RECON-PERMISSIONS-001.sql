-- ==============================================================================
-- DATABASE RECONCILIATION MIGRATION: WP-DB-RECON-PERMISSIONS-001
-- Title: Reconcile Permissions & RBAC Junction Tables
-- Target Environment: PostgreSQL / Supabase (public schema)
-- Status: PREPARED ONLY — PENDING PRODUCT OWNER LIVE EXECUTION AUTHORIZATION
-- Traceability: WP-TENANT-PROVISION-SEED-PERMISSIONS-001
-- Canonical Schema: src/lib/db/schema/identity.ts
-- ==============================================================================

-- 1. Table: public.permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id text PRIMARY KEY NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    module text NOT NULL,
    scope text DEFAULT 'TENANT' NOT NULL,
    description text,
    created_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT permissions_code_unique UNIQUE (code)
);

-- 2. Table: public.tenant_role_permissions
CREATE TABLE IF NOT EXISTS public.tenant_role_permissions (
    id text PRIMARY KEY NOT NULL,
    tenant_role_id text NOT NULL,
    permission_id text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT trp_role_perm_idx UNIQUE (tenant_role_id, permission_id)
);

-- 3. Table: public.user_additional_permissions
CREATE TABLE IF NOT EXISTS public.user_additional_permissions (
    id text PRIMARY KEY NOT NULL,
    membership_id text NOT NULL,
    permission_id text NOT NULL,
    granted_by text,
    created_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT uap_member_perm_idx UNIQUE (membership_id, permission_id)
);

-- 4. Foreign Keys (Idempotent creation via pg_constraint checks)
DO $$
BEGIN
    -- tenant_role_permissions -> tenant_roles
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenant_role_permissions_tenant_role_id_tenant_roles_id_fk'
    ) THEN
        ALTER TABLE public.tenant_role_permissions 
            ADD CONSTRAINT tenant_role_permissions_tenant_role_id_tenant_roles_id_fk 
            FOREIGN KEY (tenant_role_id) REFERENCES public.tenant_roles(id) 
            ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    -- tenant_role_permissions -> permissions
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tenant_role_permissions_permission_id_permissions_id_fk'
    ) THEN
        ALTER TABLE public.tenant_role_permissions 
            ADD CONSTRAINT tenant_role_permissions_permission_id_permissions_id_fk 
            FOREIGN KEY (permission_id) REFERENCES public.permissions(id) 
            ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    -- user_additional_permissions -> user_tenant_memberships
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_additional_permissions_membership_id_user_tenant_memberships_id_fk'
    ) THEN
        ALTER TABLE public.user_additional_permissions 
            ADD CONSTRAINT user_additional_permissions_membership_id_user_tenant_memberships_id_fk 
            FOREIGN KEY (membership_id) REFERENCES public.user_tenant_memberships(id) 
            ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;

    -- user_additional_permissions -> permissions
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_additional_permissions_permission_id_permissions_id_fk'
    ) THEN
        ALTER TABLE public.user_additional_permissions 
            ADD CONSTRAINT user_additional_permissions_permission_id_permissions_id_fk 
            FOREIGN KEY (permission_id) REFERENCES public.permissions(id) 
            ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS trp_role_idx ON public.tenant_role_permissions USING btree (tenant_role_id);
CREATE INDEX IF NOT EXISTS trp_perm_idx ON public.tenant_role_permissions USING btree (permission_id);
CREATE INDEX IF NOT EXISTS uap_member_idx ON public.user_additional_permissions USING btree (membership_id);
CREATE INDEX IF NOT EXISTS uap_perm_idx ON public.user_additional_permissions USING btree (permission_id);

-- 6. Canonical Permission Seed (55 Canonical Permissions from src/config/permissions.ts)
INSERT INTO public.permissions (id, code, name, module, scope, description, created_at) VALUES
    ('perm_view_dashboard', 'view_dashboard', 'Lihat Dashboard', 'dashboard', 'TENANT', 'Akses melihat ringkasan dashboard dan metrik operasional instansi.', now()),
    ('perm_view_santri', 'view_santri', 'Lihat Data Santri', 'santri', 'TENANT', 'Akses melihat daftar dan biodata seluruh santri.', now()),
    ('perm_manage_santri', 'manage_santri', 'Kelola Data Santri', 'santri', 'TENANT', 'Akses menambah, mengubah, dan menghapus data santri.', now()),
    ('perm_view_own_data', 'view_own_data', 'Lihat Data Sendiri', 'santri', 'TENANT', 'Akses melihat profil dan catatan personal santri/wali sendiri.', now()),
    ('perm_view_guru', 'view_guru', 'Lihat Data Guru', 'kepegawaian', 'TENANT', 'Akses melihat data asatidz, dewan guru, dan pembina.', now()),
    ('perm_manage_guru', 'manage_guru', 'Kelola Data Guru', 'kepegawaian', 'TENANT', 'Akses mengelola data kepegawaian dan akun guru.', now()),
    ('perm_view_kelas', 'view_kelas', 'Lihat Data Kelas', 'akademik', 'TENANT', 'Akses melihat daftar rombel dan pembagian kelas.', now()),
    ('perm_manage_kelas', 'manage_kelas', 'Kelola Data Kelas', 'akademik', 'TENANT', 'Akses membuat dan mengatur rombongan belajar santri.', now()),
    ('perm_view_struktur_akademik', 'view_struktur_akademik', 'Lihat Struktur Akademik', 'akademik', 'TENANT', 'Akses melihat jenjang, tingkat, dan struktur kurikulum.', now()),
    ('perm_manage_struktur_akademik', 'manage_struktur_akademik', 'Kelola Struktur Akademik', 'akademik', 'TENANT', 'Akses mengonfigurasi jenjang dan tingkatan madrasah/pesantren.', now()),
    ('perm_view_mapel', 'view_mapel', 'Lihat Mata Pelajaran', 'akademik', 'TENANT', 'Akses melihat daftar mata pelajaran dan muatan lokal.', now()),
    ('perm_manage_mapel', 'manage_mapel', 'Kelola Mata Pelajaran', 'akademik', 'TENANT', 'Akses membuat dan menyunting kurikulum mata pelajaran.', now()),
    ('perm_view_distribusi_guru', 'view_distribusi_guru', 'Lihat Distribusi Guru', 'akademik', 'TENANT', 'Akses melihat jadwal dan alokasi pengajar per kelas.', now()),
    ('perm_manage_distribusi_guru', 'manage_distribusi_guru', 'Kelola Distribusi Guru', 'akademik', 'TENANT', 'Akses menetapkan penugasan guru dan jadwal pengajaran.', now()),
    ('perm_view_kalender_akademik', 'view_kalender_akademik', 'Lihat Kalender Akademik', 'akademik', 'TENANT', 'Akses melihat kalender pendidikan dan agenda pesantren.', now()),
    ('perm_view_penilaian', 'view_penilaian', 'Lihat Penilaian', 'akademik', 'TENANT', 'Akses melihat lembar penilaian dan skor capaian santri.', now()),
    ('perm_view_raport', 'view_raport', 'Lihat Raport Santri', 'akademik', 'TENANT', 'Akses mencetak dan melihat buku laporan capaian akademik santri.', now()),
    ('perm_view_evaluasi', 'view_evaluasi', 'Lihat Evaluasi Akademik', 'akademik', 'TENANT', 'Akses melihat analisis perkembangan belajar berkala santri.', now()),
    ('perm_view_pelanggaran', 'view_pelanggaran', 'Lihat Catatan Pelanggaran', 'kesiswaan', 'TENANT', 'Akses melihat rekam jejak kedisiplinan dan poin santri.', now()),
    ('perm_report_pelanggaran', 'report_pelanggaran', 'Laporkan Pelanggaran', 'kesiswaan', 'TENANT', 'Akses mencatat dan melaporkan insiden kedisiplinan santri.', now()),
    ('perm_manage_pelanggaran', 'manage_pelanggaran', 'Kelola Pelanggaran', 'kesiswaan', 'TENANT', 'Akses memverifikasi, mengubah, dan membatalkan laporan pelanggaran.', now()),
    ('perm_view_own_pelanggaran', 'view_own_pelanggaran', 'Lihat Pelanggaran Sendiri', 'kesiswaan', 'TENANT', 'Akses santri/wali melihat riwayat poin kedisiplinan pribadi.', now()),
    ('perm_view_governance', 'view_governance', 'Lihat Tata Tertib', 'kesiswaan', 'TENANT', 'Akses melihat qonun dan regulasi pesantren.', now()),
    ('perm_manage_governance', 'manage_governance', 'Kelola Tata Tertib', 'kesiswaan', 'TENANT', 'Akses menyusun aturan disiplin dan matriks sanksi lembaga.', now()),
    ('perm_view_master_pelanggaran', 'view_master_pelanggaran', 'Lihat Master Pelanggaran', 'kesiswaan', 'TENANT', 'Akses melihat katalog jenis dan bobot poin pelanggaran.', now()),
    ('perm_manage_master_pelanggaran', 'manage_master_pelanggaran', 'Kelola Master Pelanggaran', 'kesiswaan', 'TENANT', 'Akses mengatur jenis kategori dan ambang batas poin santri.', now()),
    ('perm_view_hukuman', 'view_hukuman', 'Lihat Catatan Hukuman', 'kesiswaan', 'TENANT', 'Akses melihat riwayat pembinaan dan sanksi santri.', now()),
    ('perm_manage_hukuman', 'manage_hukuman', 'Kelola Hukuman & Pembinaan', 'kesiswaan', 'TENANT', 'Akses menetapkan dan menyelesaikan program pembinaan/sanksi santri.', now()),
    ('perm_view_quest', 'view_quest', 'Lihat Quest Karakter', 'karakter', 'TENANT', 'Akses melihat daftar misi pembinaan akhlak dan adab.', now()),
    ('perm_manage_quest', 'manage_quest', 'Kelola Quest Karakter', 'karakter', 'TENANT', 'Akses merancang dan menugaskan quest karakter santri.', now()),
    ('perm_approve_quest', 'approve_quest', 'Setujui Quest Santri', 'karakter', 'TENANT', 'Akses memverifikasi dan menyetujui penyelesaian quest santri.', now()),
    ('perm_claim_quest', 'claim_quest', 'Klaim Quest Karakter', 'karakter', 'TENANT', 'Akses santri mengajukan bukti penyelesaian misi karakter.', now()),
    ('perm_view_asrama', 'view_asrama', 'Lihat Data Asrama & Kamar', 'asrama', 'TENANT', 'Akses melihat daftar gedung asrama, kapasitas, dan alokasi kamar.', now()),
    ('perm_manage_asrama', 'manage_asrama', 'Kelola Asrama & Kamar', 'asrama', 'TENANT', 'Akses mengatur penempatan asrama dan pergantian kamar santri.', now()),
    ('perm_view_monitoring', 'view_monitoring', 'Lihat Monitoring Harian', 'monitoring', 'TENANT', 'Akses pemantauan ibadah yaumiyah dan rutinitas santri.', now()),
    ('perm_view_uks', 'view_uks', 'Lihat Layanan UKS', 'kesehatan', 'TENANT', 'Akses melihat riwayat kunjungan dan rekam medis santri.', now()),
    ('perm_manage_uks', 'manage_uks', 'Kelola Layanan UKS', 'kesehatan', 'TENANT', 'Akses mencatat tindakan medis, obat, dan rawat inap UKS.', now()),
    ('perm_view_izin_berobat', 'view_izin_berobat', 'Lihat Izin Berobat', 'kesehatan', 'TENANT', 'Akses melihat status surat izin berobat keluar komplek.', now()),
    ('perm_manage_izin_berobat', 'manage_izin_berobat', 'Kelola Izin Berobat', 'kesehatan', 'TENANT', 'Akses menerbitkan dan memvalidasi izin berobat santri.', now()),
    ('perm_view_notifikasi', 'view_notifikasi', 'Lihat Notifikasi', 'notifikasi', 'TENANT', 'Akses menerima dan membaca notifikasi sistem.', now()),
    ('perm_manage_notifikasi', 'manage_notifikasi', 'Kelola Notifikasi', 'notifikasi', 'TENANT', 'Akses mengirim broadcast pengumuman kepada wali dan santri.', now()),
    ('perm_view_import', 'view_import', 'Lihat Fasilitas Import', 'sistem', 'TENANT', 'Akses melihat riwayat dan template import data Excel/CSV.', now()),
    ('perm_manage_import', 'manage_import', 'Eksekusi Import Data', 'sistem', 'TENANT', 'Akses mengunggah dan mengimpor data massal santri dan staf.', now()),
    ('perm_view_pengaturan', 'view_pengaturan', 'Lihat Pengaturan Instansi', 'pengaturan', 'TENANT', 'Akses melihat konfigurasi identitas, logo, dan profil instansi.', now()),
    ('perm_manage_pengaturan', 'manage_pengaturan', 'Kelola Pengaturan Instansi', 'pengaturan', 'TENANT', 'Akses mengubah profil lembaga, branding, integrasi, dan RBAC.', now()),
    ('perm_view_pengumuman', 'view_pengumuman', 'Lihat Pengumuman', 'administrasi', 'TENANT', 'Akses melihat mading digital dan surat edaran pesantren.', now()),
    ('perm_view_surat', 'view_surat', 'Lihat Tata Persuratan', 'administrasi', 'TENANT', 'Akses melihat arsip surat masuk dan surat keluar resmi.', now()),
    ('perm_view_arsip', 'view_arsip', 'Lihat Arsip Dokumen', 'administrasi', 'TENANT', 'Akses melihat dokumen digital dan berkas legalitas instansi.', now()),
    ('perm_view_kalender_kegiatan', 'view_kalender_kegiatan', 'Lihat Kalender Kegiatan', 'administrasi', 'TENANT', 'Akses melihat agenda kegiatan dan acara pesantren.', now()),
    ('perm_view_broadcast', 'view_broadcast', 'Lihat Broadcast Pesantren', 'administrasi', 'TENANT', 'Akses melihat riwayat pengiriman pesan gateway massal.', now()),
    ('perm_view_perpustakaan', 'view_perpustakaan', 'Lihat Perpustakaan', 'perpustakaan', 'TENANT', 'Akses melihat katalog kitab dan buku perpustakaan.', now()),
    ('perm_manage_perpustakaan', 'manage_perpustakaan', 'Kelola Perpustakaan', 'perpustakaan', 'TENANT', 'Akses mengelola sirkulasi peminjaman kitab dan buku.', now()),
    ('perm_manage_tenants', 'manage_tenants', 'Kelola Tenant SaaS', 'platform', 'PLATFORM', 'Hak istimewa Super Admin memprovisi dan mengelola institusi SaaS.', now()),
    ('perm_view_saas_analytics', 'view_saas_analytics', 'Lihat Analitik SaaS', 'platform', 'PLATFORM', 'Hak istimewa Super Admin melihat metrik penggunaan platform.', now()),
    ('perm_manage_system_global', 'manage_system_global', 'Kelola Konfigurasi Global Platform', 'platform', 'PLATFORM', 'Hak istimewa Developer/Super Admin mengonfigurasi platform global.', now())
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- ROLLBACK SCRIPT (FOR REFERENCE / DISASTER RECOVERY ONLY)
-- ==============================================================================
-- DROP TABLE IF EXISTS public.user_additional_permissions CASCADE;
-- DROP TABLE IF EXISTS public.tenant_role_permissions CASCADE;
-- DROP TABLE IF EXISTS public.permissions CASCADE;
-- ==============================================================================
