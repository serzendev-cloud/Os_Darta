// ========================================
// Universal Multi-Tenant Database Query API
// Traceability: WP-101 Phase 1F Authorization Integration
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

  // 2. Controlled Test Harness Support (Strictly gated to test environments)
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    const headerUserId = request.headers.get('x-user-id');
    if (headerUserId && headerUserId.trim() !== '') {
      const isSuper = request.headers.get('x-is-super-admin') === 'true';
      return { userId: headerUserId.trim(), isSuperAdmin: isSuper };
    }
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
        if ('tenantId' in targetTable) {
          return await tx
            .select()
            .from(targetTable)
            .where(eq(targetTable.tenantId, tenant.id));
        } else {
          return await tx.select().from(targetTable);
        }
      },
      { isSuperAdmin: auth.isSuperAdmin, tenantSlug: tenant.slug }
    );

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
    };

    const targetTable = tableMap[collectionName];
    if (!targetTable) {
      return NextResponse.json({ error: `Unknown collection "${collectionName}"` }, { status: 400 });
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

    // 3. Scoped mutation within transaction-safe tenant context
    return await withTenantTransaction(
      tenant.id,
      async (tx) => {
        if (action === 'create') {
          const newId = data?.id || `${collectionName}_${Date.now()}`;
          const payload = {
            ...data,
            id: newId,
            tenantId: tenant.id,
          };
          await tx.insert(targetTable).values(payload);
          return NextResponse.json({ success: true, id: newId, tenantId: tenant.id });
        }

        if (action === 'update') {
          if (!id) return NextResponse.json({ error: 'id is required for update' }, { status: 400 });

          if (collectionName === 'santri') {
            const { santriServerService } = await import('@/modules/santri/services/santri-server');
            await santriServerService.handleUpdate(id, data, tenant.id);
          }

          await tx
            .update(targetTable)
            .set({ ...data, updatedAt: new Date() })
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
