// ========================================
// Universal Multi-Tenant Database Query API
// ========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTenantContext } from '@/lib/tenant/context';

export async function GET(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const collectionName = searchParams.get('collection');

    if (!collectionName) {
      return NextResponse.json({ error: 'Collection parameter is required' }, { status: 400 });
    }

    // Map collection names to Drizzle tables
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

    // Scoped query by tenant_id
    let records = [];
    if ('tenantId' in targetTable) {
      records = await db
        .select()
        .from(targetTable)
        .where(eq(targetTable.tenantId, tenant.id));
    } else {
      records = await db.select().from(targetTable);
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
    const body = await request.json();
    const { collectionName, action, data, id } = body;

    if (!collectionName || !action) {
      return NextResponse.json({ error: 'collectionName and action are required' }, { status: 400 });
    }

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

    if (action === 'create') {
      const newId = data.id || `${collectionName}_${Date.now()}`;
      const payload = {
        ...data,
        id: newId,
        tenantId: tenant.id,
      };
      await db.insert(targetTable).values(payload);
      return NextResponse.json({ success: true, id: newId, tenantId: tenant.id });
    }

    if (action === 'update') {
      if (!id) return NextResponse.json({ error: 'id is required for update' }, { status: 400 });
      await db
        .update(targetTable)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(targetTable.id, id), eq(targetTable.tenantId, tenant.id)));
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      if (!id) return NextResponse.json({ error: 'id is required for delete' }, { status: 400 });
      await db
        .delete(targetTable)
        .where(and(eq(targetTable.id, id), eq(targetTable.tenantId, tenant.id)));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unsupported action "${action}"` }, { status: 400 });
  } catch (error) {
    console.error('[API /api/db/query POST] Error:', error);
    return NextResponse.json({ error: 'Operation failed', details: String(error) }, { status: 500 });
  }
}
