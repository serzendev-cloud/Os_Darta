import { pgTable, text, integer, boolean, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';

// ── Users Table ─────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Match Supabase auth user UUID / custom ID
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(), // 'admin' | 'guru' | 'musyrif' | 'orang_tua' | 'santri'
  avatar: text('avatar'),
  childSantriId: text('child_santri_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Santri Table ────────────────────────────────────────────────────────────
export const santri = pgTable('santri', {
  id: text('id').primaryKey(),
  nis: text('nis').notNull().unique(),
  name: text('name').notNull(),
  asrama: text('asrama').notNull(),
  kamar: text('kamar').notNull(),
  asramaId: text('asrama_id'),
  kamarId: text('kamar_id'),
  kelas: text('kelas').notNull(),
  status: text('status').notNull().default('Aktif'),
  gender: text('gender').notNull(), // 'L' | 'P'
  photoUrl: text('photo_url'),
  waliId: text('wali_id'),
  waliName: text('wali_name').notNull(),
  waliPhone: text('wali_phone').notNull(),
  joinDate: text('join_date').notNull(),
  asalKota: text('asal_kota').notNull(),
  asalProvinsi: text('asal_provinsi').notNull(),
  angkatanMasuk: integer('angkatan_masuk').notNull(),
  totalPoinPelanggaran: integer('total_poin_pelanggaran').default(0).notNull(),
  totalPrestasi: integer('total_prestasi').default(0).notNull(),
  statusKarakter: text('status_karakter').default('Baik').notNull(),
  statusSP: text('status_sp').default('Tidak Ada').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Asrama & Kamar ──────────────────────────────────────────────────────────
export const asrama = pgTable('asrama', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  musyrif: text('musyrif').notNull(),
  capacity: integer('capacity').notNull(),
  filled: integer('filled').default(0).notNull(),
  gender: text('gender').notNull(), // 'L' | 'P'
  status: text('status').default('aktif').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const kamar = pgTable('kamar', {
  id: text('id').primaryKey(),
  asramaId: text('asrama_id').notNull(),
  name: text('name').notNull(),
  capacity: integer('capacity').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Master Akademik & Pengajaran ───────────────────────────────────────────
export const masterJenjang = pgTable('master_jenjang', {
  id: text('id').primaryKey(),
  namaJenjang: text('nama_jenjang').notNull(),
  instansi: text('instansi').notNull(),
  progressionIndexes: jsonb('progression_indexes'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const masterTingkat = pgTable('master_tingkat', {
  id: text('id').primaryKey(),
  instansi: text('instansi').notNull(),
  progressionIndex: integer('progression_index').notNull(),
  tingkatLabel: text('tingkat_label').notNull(),
  jenjangId: text('jenjang_id').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const kelas = pgTable('kelas', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  jenjang: text('jenjang').notNull(),
  tingkat: integer('tingkat').notNull(),
  waliKelas: text('wali_kelas').notNull(),
  studentCount: integer('student_count').default(0).notNull(),
  status: text('status').default('aktif').notNull(),
  academicTab: text('academic_tab').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const mapel = pgTable('mapel', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  jenjang: text('jenjang').notNull(),
  tingkat: integer('tingkat').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const teacherAssignments = pgTable('teacher_assignments', {
  id: text('id').primaryKey(),
  mapelId: text('mapel_id').notNull(),
  kelasId: text('kelas_id').notNull(),
  kelasName: text('kelas_name').notNull(),
  guruName: text('guru_name').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const guru = pgTable('guru', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  nip: text('nip').notNull(),
  ranahInstansi: text('ranah_instansi').notNull(),
  status: text('status').default('aktif').notNull(),
  email: text('email'),
  noWA: text('no_wa'),
  alamat: text('alamat'),
  userId: text('user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Kedisiplinan & Pengasuhan ──────────────────────────────────────────────
export const masterPelanggaran = pgTable('master_pelanggaran', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  ranahInstansi: text('ranah_instansi').notNull(),
  kategori: text('kategori').notNull(),
  name: text('name').notNull(),
  severity: text('severity').notNull(),
  points: integer('points').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const pelanggaran = pgTable('pelanggaran', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull(),
  santriName: text('santri_name').notNull(),
  pelanggaranId: text('pelanggaran_id').notNull(),
  pelanggaranName: text('pelanggaran_name').notNull(),
  severity: text('severity').notNull(),
  points: integer('points').notNull(),
  date: text('date').notNull(),
  reportedBy: text('reported_by').notNull(),
  reportedByUserId: text('reported_by_user_id'),
  reportedByRole: text('reported_by_role'),
  status: text('status').default('confirmed').notNull(),
  statusHukuman: text('status_hukuman').default('belum').notNull(),
  punishmentId: text('punishment_id'),
  punishmentName: text('punishment_name'),
  notes: text('notes'),
  governanceCaseId: text('governance_case_id'),
  gdriveFileId: text('gdrive_file_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const masterHukuman = pgTable('master_hukuman', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').default('active').notNull(),
  severityScope: jsonb('severity_scope'),
  minimumTingkat: integer('minimum_tingkat').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const hukuman = pgTable('hukuman', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull(),
  santriName: text('santri_name').notNull(),
  pelanggaranId: text('pelanggaran_id').notNull(),
  masterHukumanId: text('master_hukuman_id').notNull(),
  type: text('type').notNull(),
  description: text('description').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').default('aktif').notNull(),
  executorId: text('executor_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const governanceCases = pgTable('governance_cases', {
  id: text('id').primaryKey(),
  sourceType: text('source_type').notNull(),
  submittedBy: text('submitted_by').notNull(),
  submittedByRole: text('submitted_by_role'),
  santriId: text('santri_id').notNull(),
  santriName: text('santri_name').notNull(),
  reason: text('reason').notNull(),
  severity: text('severity'),
  points: integer('points'),
  date: text('date').notNull(),
  notes: text('notes'),
  masterPelanggaranId: text('master_pelanggaran_id'),
  masterPelanggaranName: text('master_pelanggaran_name'),
  relatedEntityType: text('related_entity_type'),
  relatedEntityId: text('related_entity_id'),
  reviewStatus: text('review_status').notNull(),
  reviewedBy: text('reviewed_by'),
  reviewedByRole: text('reviewed_by_role'),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  violationId: text('violation_id'),
  warningCount: integer('warning_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Health / UKS ────────────────────────────────────────────────────────────
export const healthVisits = pgTable('health_visits', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull(),
  santriName: text('santri_name').notNull(),
  keluhan: text('keluhan').notNull(),
  diagnosa: text('diagnosa'),
  tindakan: text('tindakan'),
  obat: text('obat'),
  tanggal: text('tanggal').notNull(),
  petugas: text('petugas').notNull(),
  gdriveFileId: text('gdrive_file_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const healthPermissions = pgTable('health_permissions', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull(),
  santriName: text('santri_name').notNull(),
  alasan: text('alasan').notNull(),
  rumahSakit: text('rumah_sakit'),
  tanggalMulai: text('tanggal_mulai').notNull(),
  tanggalSelesai: text('tanggal_selesai').notNull(),
  status: text('status').default('pending').notNull(),
  gdriveFileId: text('gdrive_file_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Quests, Policies & System ──────────────────────────────────────────────
export const quests = pgTable('quests', {
  id: text('id').primaryKey(),
  santriId: text('santri_id').notNull(),
  santriName: text('santri_name').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  pointsReward: integer('points_reward').notNull(),
  status: text('status').notNull(),
  deadline: text('deadline').notNull(),
  progress: integer('progress').default(0),
  createdBy: text('created_by'),
  approvalStatus: text('approval_status'),
  approvedBy: text('approved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tolerancePolicies = pgTable('tolerance_policies', {
  id: text('id').primaryKey(),
  type: text('type').notNull(),
  jenjang: text('jenjang'),
  isActive: boolean('is_active').default(true).notNull(),
  limits: jsonb('limits').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // 'info' | 'warning' | 'success' | 'error'
  read: boolean('read').default(false).notNull(),
  targetRole: text('target_role'),
  targetSantriId: text('target_santri_id'),
  targetAsramaId: text('target_asrama_id'),
  targetKelas: text('target_kelas'),
  targetAngkatan: integer('target_angkatan'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  action: text('action').notNull(),
  user: text('user').notNull(),
  userId: text('user_id'),
  userRole: text('user_role'),
  details: text('details'),
  targetEntity: text('target_entity'),
  targetId: text('target_id'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// ── Google Drive Document Registry (Document Database) ──────────────────────
export const gdriveDocuments = pgTable('gdrive_documents', {
  id: text('id').primaryKey(),
  fileId: text('file_id').notNull().unique(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size'),
  webViewLink: text('web_view_link'),
  downloadUrl: text('download_url'),
  category: text('category').notNull(), // 'santri_doc' | 'uks_perm' | 'bukti_hukuman' | 'official_doc'
  relatedEntity: text('related_entity'),
  relatedId: text('related_id'),
  uploadedBy: text('uploaded_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
