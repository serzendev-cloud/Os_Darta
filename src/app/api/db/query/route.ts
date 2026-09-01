// ========================================
// Universal Multi-Tenant Database Query API
// Traceability: WP-101 Phase 1F Authorization Integration
// ========================================

export const dynamic = 'force-static';

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTenantContext } from '@/lib/tenant/context';
import { requirePermission } from '@/lib/authz/authorization-service';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';

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
  healthPermissions: 'view_izins_berobat',
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
  healthPermissions: 'manage_izins_berobat',
  quests: 'manage_quest',
  tolerancePolicies: 'manage_pengaturan',
  notifications: 'manage_notifikasi',
};

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const userId = request.headers.get('x-user-id') || '';
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

    // Enforce RBAC Permission Check if user is present
    const requiredPermission = COLLECTION_READ_PERMISSIONS[collectionName] || 'view_dashboard';
    if (userId) {
      const authz = await requirePermission(userId, tenant.id, requiredPermission);
      if (!authz.authorized) {
        return NextResponse.json(
          { error: 'Forbidden', message: authz.reason || 'Izin ditolak untuk membaca resource ini' },
          { status: 403 }
        );
      }
    }

    // Scoped query by tenant_id within transaction-safe RLS context
    const isSuperAdmin = request.headers.get('x-is-super-admin') === 'true';
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
      { isSuperAdmin, tenantSlug: tenant.slug }
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
    const userId = request.headers.get('x-user-id') || '';
    const isSuperAdmin = request.headers.get('x-is-super-admin') === 'true';
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
    };

    const targetTable = tableMap[collectionName];
    if (!targetTable) {
      return NextResponse.json({ error: `Unknown collection "${collectionName}"` }, { status: 400 });
    }

    // Enforce RBAC Permission Check if user is present
    const requiredPermission = COLLECTION_WRITE_PERMISSIONS[collectionName] || 'manage_pengaturan';
    if (userId) {
      const authz = await requirePermission(userId, tenant.id, requiredPermission);
      if (!authz.authorized) {
        return NextResponse.json(
          { error: 'Forbidden', message: authz.reason || 'Izin ditolak untuk mengubah resource ini' },
          { status: 403 }
        );
      }
    }

    return await withTenantTransaction(
      tenant.id,
      async (tx) => {
        if (action === 'create') {
          const newId = data.id || `${collectionName}_${Date.now()}`;
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
      { isSuperAdmin, tenantSlug: tenant.slug }
    );
  } catch (error) {
    console.error('[API /api/db/query POST] Error:', error);
    return NextResponse.json({ error: 'Operation failed', details: String(error) }, { status: 500 });
  }
}
