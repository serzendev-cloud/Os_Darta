// ==============================================================================
// Financial Reconciliation API Route
// Work Package: WP-M2-FINANCIAL-AUDIT-TRAIL-AND-DIGITAL-CCTV-001
// Compliance: PO Decisions 4, 5, 8
// ==============================================================================

import { NextResponse } from 'next/server';
import { reconciliationEngine } from '@/lib/finance/reconciliation';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = request.headers.get('x-tenant-id') || searchParams.get('tenantId') || 'default';

    const data = await reconciliationEngine.getDashboardData(tenantId);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengambil data rekonsiliasi';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const headerTenantId = request.headers.get('x-tenant-id');
    const body = await request.json();
    const {
      action = 'run', // 'run' | 'resolve'
      tenantId: bodyTenantId,
      triggeredBy = 'admin_keuangan',
      runType = 'MANUAL',
      anomalyId,
      resolvedBy = 'admin_keuangan',
      resolutionNotes,
      status = 'RESOLVED',
    } = body;

    const tenantId = (headerTenantId || bodyTenantId || 'default').trim();

    if (action === 'resolve') {
      if (!anomalyId || !resolutionNotes) {
        return NextResponse.json(
          { success: false, message: 'anomalyId dan resolutionNotes wajib diisi' },
          { status: 400 }
        );
      }

      const result = await reconciliationEngine.resolveAnomaly({
        tenantId,
        anomalyId,
        resolvedBy,
        resolutionNotes,
        status,
      });

      return NextResponse.json(result, { status: 200 });
    }

    // Default action: run reconciliation
    const result = await reconciliationEngine.runReconciliation({
      tenantId,
      triggeredBy,
      runType,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menjalankan rekonsiliasi';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
