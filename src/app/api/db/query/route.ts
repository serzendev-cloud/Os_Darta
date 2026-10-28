// ========================================
// Universal Multi-Tenant Database Query API
// Traceability: WP-101 Phase 1F Authorization Integration
// Hardening: WP-SEC-QUERY-API-001 (Fail-Closed Tenant Isolation & Secret Masking)
// ========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTenantContext } from '@/lib/tenant/context';
import { requirePermission } from '@/lib/authz/authorization-service';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

interface AuthResolution {
  userId: string | null;
  isSuperAdmin: boolean;
}

/**
 * Resolves the authenticated user identity with fail-closed security.
 * In production, identity MUST originate from a cryptographically verified Supabase
 * server session (cookies). Raw client-supplied headers are strictly untrusted standalone.
 * In automated test suites (Vitest), verified mock test headers are accepted.
 */
async function resolveAuthUser(request: NextRequest): Promise<AuthResolution> {
  // 1. Primary Authority: Cryptographic server-side Supabase session
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user?.id) {
      const user = data.user;
      const appRole = (user.app_metadata?.role || '') as string;
      const normalizedRole = appRole.toUpperCase().replace(/\s+/g, '_');
      const isSuper = normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'DEVELOPER';
      return { userId: user.id, isSuperAdmin: isSuper };
    }
  } catch {
    // Session resolution unavailable in current context (e.g. test harness)
  }

  return { userId: null, isSuperAdmin: false };
}

/**
 * Maps database collection names to required read permission codes
 */
const COLLECTION_READ_PERMISSIONS: Record<string, string> = {
  santri: 'view_santri',
  guru: 'view_guru',
  kelas: 'view_kelas',
  mapel: 'view_mapel',
  teacherAssignments: 'view_distribusi_guru',
  asrama: 'view_asrama',
  kamar: 'view_asrama',
  masterJenjang: 'view_struktur_akademik',
  masterTingkat: 'view_struktur_akademik',
  masterPelanggaran: 'view_master_pelanggaran',
  pelanggaran: 'view_pelanggaran',
  masterHukuman: 'view_hukuman',
  hukuman: 'view_hukuman',
  governanceCases: 'view_governance',
  healthVisits: 'view_uks',
  healthPermissions: 'view_izin_berobat',
  quests: 'view_quest',
  tolerancePolicies: 'view_pengaturan',
  notifications: 'view_notifikasi',
  auditLogs: 'view_pengaturan',
  gdriveDocuments: 'view_pengaturan',
  tenantSettings: 'view_pengaturan',
  users: 'view_pengaturan',
};

/**
 * Maps database collection names to required write permission codes
 */
const COLLECTION_WRITE_PERMISSIONS: Record<string, string> = {
  santri: 'manage_santri',
  guru: 'manage_guru',
  kelas: 'manage_kelas',
  mapel: 'manage_mapel',
  teacherAssignments: 'manage_distribusi_guru',
  asrama: 'manage_asrama',
  kamar: 'manage_asrama',
  masterJenjang: 'manage_struktur_akademik',
  masterTingkat: 'manage_struktur_akademik',
  masterPelanggaran: 'manage_master_pelanggaran',
  pelanggaran: 'manage_pelanggaran',
  masterHukuman: 'manage_hukuman',
  hukuman: 'manage_hukuman',
  governanceCases: 'manage_governance',
  healthVisits: 'manage_uks',
  healthPermissions: 'manage_izin_berobat',
  quests: 'manage_quest',
  tolerancePolicies: 'manage_pengaturan',
  notifications: 'manage_notifikasi',
  tenantSettings: 'manage_pengaturan',
};

/**
 * Strict column whitelists per collection for create and update operations (WP-SEC-QUERY-API-001)
 * Strips primary key `id` and partition key `tenantId` from client-supplied mutation payloads.
 */
const COLLECTION_ALLOWED_COLUMNS: Record<string, string[]> = {
  santri: [
    'nis', 'name', 'status', 'kelas', 'kamar', 'gender', 'waliName', 'waliPhone',
    'address', 'saldo', 'photoUrl', 'metadata'
  ],
  guru: [
    'nip', 'nama', 'email', 'phone', 'specialization', 'status'
  ],
  masterJenjang: [
    'namaJenjang', 'instansi', 'progressionIndexes', 'status'
  ],
  masterTingkat: [
    'instansi', 'progressionIndex', 'tingkatLabel', 'jenjangId', 'status'
  ],
  teacherAssignments: [
    'mapelId', 'kelasId', 'kelasName', 'guruName', 'status'
  ],
  masterPelanggaran: [
    'namaPelanggaran', 'kategori', 'poin', 'sanksiDefault'
  ],
  pelanggaran: [
    'santriId', 'santriName', 'masterPelanggaranId', 'namaPelanggaran', 'kategori',
    'poin', 'pelaporName', 'pelaporId', 'sanksi', 'status', 'tanggalKejadian', 'catatan'
  ],
  masterHukuman: [
    'namaHukuman', 'kategori', 'deskripsi'
  ],
  hukuman: [
    'pelanggaranId', 'santriId', 'santriName', 'masterHukumanId', 'namaHukuman',
    'status', 'eksekutorName', 'eksekutorId', 'tanggalMulai', 'tanggalSelesai', 'catatan'
  ],
  governanceCases: [
    'title', 'description', 'reporterId', 'status', 'assignedTo', 'notes'
  ],
  quests: [
    'title', 'description', 'pointsReward', 'status', 'deadline', 'progress',
    'createdBy', 'approvalStatus', 'approvedBy', 'category', 'targetRole'
  ],
  tolerancePolicies: [
    'type', 'jenjang', 'isActive', 'limits'
  ],
  notifications: [
    'title', 'message', 'type', 'read', 'targetRole', 'targetSantriId',
    'targetAsramaId', 'targetKelas', 'targetAngkatan'
  ],
  tenantSettings: [
    'customLogoUrl', 'customBgUrl', 'primaryColor', 'tagline',
    'loginTitle', 'loginSubtitle', 'loginDescription',
    'flipSecretKey', 'flipValidationToken', 'waGatewayApiKey', 'gdriveServiceAccountJson'
  ],
  healthVisits: [
    'santriId', 'santriName', 'keluhan', 'diagnosa', 'tindakan', 'obat',
    'tanggal', 'petugas', 'gdriveFileId'
  ],
  healthPermissions: [
    'santriId', 'santriName', 'alasan', 'rumahSakit', 'tanggalMulai',
    'tanggalSelesai', 'status', 'gdriveFileId'
  ],
  gdriveDocuments: [
    'fileId', 'fileName', 'mimeType', 'size', 'webViewLink', 'downloadUrl',
    'category', 'relatedEntity', 'relatedId', 'uploadedBy'
  ],
  auditLogs: [
    'action', 'user', 'userId', 'userRole', 'details', 'targetEntity', 'targetId'
  ]
};

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();

    // 1. Enforce Fail-Closed Server Authentication
    const auth = await resolveAuthUser(request);
    if (!auth.userId || auth.userId.trim() === '') {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          code: 'UNAUTHENTICATED',
          message: 'Autentikasi diperlukan: Sesi pengguna tidak ditemukan atau kedaluwarsa',
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get('collection');

    if (!collectionName) {
      return NextResponse.json({ error: 'Collection parameter is required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableMap: Record<string, any> = {
      tenants: schema.tenants,
      tenantSettings: schema.tenantSettings,
      users: schema.users,
      santri: schema.santri,
      asrama: schema.asrama,
      kamar: schema.kamar,
      masterJenjang: schema.masterJenjang,
      masterTingkat: schema.masterTingkat,
      kelas: schema.kelas,
      mapel: schema.mapel,
      teacherAssignments: schema.teacherAssignments,
      guru: schema.guru,
      masterPelanggaran: schema.masterPelanggaran,
      pelanggaran: schema.pelanggaran,
      masterHukuman: schema.masterHukuman,
      hukuman: schema.hukuman,
      governanceCases: schema.governanceCases,
      healthVisits: schema.healthVisits,
      healthPermissions: schema.healthPermissions,
      quests: schema.quests,
      tolerancePolicies: schema.tolerancePolicies,
      notifications: schema.notifications,
      auditLogs: schema.auditLogs,
      gdriveDocuments: schema.gdriveDocuments,
    };

    const targetTable = tableMap[collectionName];
    if (!targetTable) {
      return NextResponse.json({ error: `Unknown collection "${collectionName}"` }, { status: 400 });
    }

    // (a) Tolak (400) koleksi yang tabelnya tidak punya tenantId (WP-SEC-QUERY-API-001)
    if (!('tenantId' in targetTable)) {
      return NextResponse.json(
        {
          error: 'BadRequest',
          code: 'TABLE_NOT_TENANT_SCOPED',
          message: `Koleksi "${collectionName}" tidak memiliki kolom isolasi tenantId dan dilarang diakses melalui query API`,
        },
        { status: 400 }
      );
    }

    // 2. Mandatory RBAC Permission Check (Zero-Trust)
    const requiredPermission = COLLECTION_READ_PERMISSIONS[collectionName] || 'view_dashboard';
    const authz = await requirePermission(auth.userId, tenant.id, requiredPermission);
    if (!authz.authorized) {
      return NextResponse.json(
        { error: 'Forbidden', message: authz.reason || 'Izin ditolak untuk membaca resource ini' },
        { status: 403 }
      );
    }

    // 3. Scoped query by tenant_id within transaction-safe RLS context
    const records = await withTenantTransaction(
      tenant.id,
      async (tx) => {
        return await tx
          .select()
          .from(targetTable)
          .where(eq(targetTable.tenantId, tenant.id));
      },
      { isSuperAdmin: auth.isSuperAdmin, tenantSlug: tenant.slug }
    );

    // (b) GET tenantSettings: jangan kembalikan kolom rahasia; ganti penanda boolean (WP-SEC-QUERY-API-001)
    if (collectionName === 'tenantSettings') {
      const sanitized = records.map((record: Record<string, unknown>) => {
        const {
          flipSecretKey,
          flipValidationToken,
          waGatewayApiKey,
          gdriveServiceAccountJson,
          ...safeFields
        } = record;

        return {
          ...safeFields,
          flipSecretKeyConfigured: Boolean(flipSecretKey && String(flipSecretKey).trim() !== ''),
          flipValidationTokenConfigured: Boolean(flipValidationToken && String(flipValidationToken).trim() !== ''),
          waGatewayApiKeyConfigured: Boolean(waGatewayApiKey && String(waGatewayApiKey).trim() !== ''),
          gdriveServiceAccountJsonConfigured: Boolean(gdriveServiceAccountJson && String(gdriveServiceAccountJson).trim() !== ''),
        };
      });

      return NextResponse.json({ data: sanitized, tenantId: tenant.id });
    }

    return NextResponse.json({ data: records, tenantId: tenant.id });
  } catch (error) {
    console.error('[API /api/db/query] Error executing query:', error);
    return NextResponse.json(
      { error: 'Failed to query database', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();

    // 1. Enforce Fail-Closed Server Authentication
    const auth = await resolveAuthUser(request);
    if (!auth.userId || auth.userId.trim() === '') {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          code: 'UNAUTHENTICATED',
          message: 'Autentikasi diperlukan: Sesi pengguna tidak ditemukan atau kedaluwarsa',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { collectionName, action, data, id } = body;

    if (!collectionName || !action) {
      return NextResponse.json({ error: 'collectionName and action are required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableMap: Record<string, any> = {
      santri: schema.santri,
      asrama: schema.asrama,
      kamar: schema.kamar,
      masterJenjang: schema.masterJenjang,
      masterTingkat: schema.masterTingkat,
      kelas: schema.kelas,
      mapel: schema.mapel,
      teacherAssignments: schema.teacherAssignments,
      guru: schema.guru,
      masterPelanggaran: schema.masterPelanggaran,
      pelanggaran: schema.pelanggaran,
      masterHukuman: schema.masterHukuman,
      hukuman: schema.hukuman,
      governanceCases: schema.governanceCases,
      quests: schema.quests,
      notifications: schema.notifications,
      tenantSettings: schema.tenantSettings,
      tolerancePolicies: schema.tolerancePolicies,
    };

    const targetTable = tableMap[collectionName];
    if (!targetTable) {
      return NextResponse.json({ error: `Unknown collection "${collectionName}"` }, { status: 400 });
    }

    // (a) Tolak (400) koleksi yang tabelnya tidak punya tenantId (WP-SEC-QUERY-API-001)
    if (!('tenantId' in targetTable)) {
      return NextResponse.json(
        {
          error: 'BadRequest',
          code: 'TABLE_NOT_TENANT_SCOPED',
          message: `Koleksi "${collectionName}" tidak memiliki kolom isolasi tenantId dan dilarang diakses melalui query API`,
        },
        { status: 400 }
      );
    }

    // 2. Mandatory RBAC Permission Check (Zero-Trust)
    const requiredPermission = COLLECTION_WRITE_PERMISSIONS[collectionName] || 'manage_pengaturan';
    const authz = await requirePermission(auth.userId, tenant.id, requiredPermission);
    if (!authz.authorized) {
      return NextResponse.json(
        { error: 'Forbidden', message: authz.reason || 'Izin ditolak untuk mengubah resource ini' },
        { status: 403 }
      );
    }

    const allowedColumns = COLLECTION_ALLOWED_COLUMNS[collectionName];
    if (!allowedColumns) {
      return NextResponse.json(
        { error: 'BadRequest', message: `Koleksi "${collectionName}" tidak diizinkan untuk modifikasi data` },
        { status: 400 }
      );
    }

    // Pre-validate and sanitize mutation inputs before transaction
    let sanitizedUpdate: Record<string, unknown> = {};
    if (action === 'update') {
      if (!id) return NextResponse.json({ error: 'id is required for update' }, { status: 400 });

      // (c) Buang id dan tenantId dari data update; whitelist kolom per koleksi
      const { id: _ignoreId, tenantId: _ignoreTenantId, ...restData } = data || {};
      for (const key of Object.keys(restData)) {
        if (allowedColumns.includes(key)) {
          sanitizedUpdate[key] = restData[key];
        }
      }

      if (Object.keys(sanitizedUpdate).length === 0) {
        return NextResponse.json(
          { error: 'BadRequest', message: 'Tidak ada kolom valid yang diizinkan untuk diperbarui' },
          { status: 400 }
        );
      }
    }

    if (action === 'delete' && !id) {
      return NextResponse.json({ error: 'id is required for delete' }, { status: 400 });
    }

    // 3. Scoped mutation within transaction-safe tenant context
    return await withTenantTransaction(
      tenant.id,
      async (tx) => {
        if (action === 'create') {
          const newId = data?.id || `${collectionName}_${Date.now()}`;
          // Whitelist allowed columns only, enforce tenantId and id
          const sanitizedCreate: Record<string, unknown> = {};
          for (const key of Object.keys(data || {})) {
            if (allowedColumns.includes(key)) {
              sanitizedCreate[key] = data[key];
            }
          }

          const payload = {
            ...sanitizedCreate,
            id: newId,
            tenantId: tenant.id,
          };
          await tx.insert(targetTable).values(payload);
          return NextResponse.json({ success: true, id: newId, tenantId: tenant.id });
        }

        if (action === 'update') {
          if (collectionName === 'santri') {
            const { santriServerService } = await import('@/modules/santri/services/santri-server');
            await santriServerService.handleUpdate(id, sanitizedUpdate, tenant.id);
          }

          if ('updatedAt' in targetTable) {
            sanitizedUpdate.updatedAt = new Date();
          }

          await tx
            .update(targetTable)
            .set(sanitizedUpdate)
            .where(and(eq(targetTable.id, id), eq(targetTable.tenantId, tenant.id)));
          return NextResponse.json({ success: true });
        }

        if (action === 'delete') {
          if (!id) return NextResponse.json({ error: 'id is required for delete' }, { status: 400 });
          await tx
            .delete(targetTable)
            .where(and(eq(targetTable.id, id), eq(targetTable.tenantId, tenant.id)));
          return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: `Unsupported action "${action}"` }, { status: 400 });
      },
      { isSuperAdmin: auth.isSuperAdmin, tenantSlug: tenant.slug }
    );
  } catch (error) {
    console.error('[API /api/db/query POST] Error:', error);
    return NextResponse.json({ error: 'Operation failed', details: String(error) }, { status: 500 });
  }
}
