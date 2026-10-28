// ==============================================================================
// Financial Reconciliation API Route
// Work Package: WP-SEC-CANTEEN-001 (Hardened Auth & Strict Tenancy)
// Compliance: Fail-Closed Server Auth (401), Tenant Scoping (400), Canonical RBAC (403)
// ==============================================================================

import { NextResponse } from 'next/server';
import { reconciliationEngine } from '@/lib/finance/reconciliation';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/authz/authorization-service';
import { getTenantContext, DEFAULT_TENANT } from '@/lib/tenant/context';
import { Permission } from '@/config/permissions';

export async function GET(request: Request) {
  try {
    // 1. Autentikasi Pengguna Sesi Server (Fail-Closed)
    let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) {
        user = data.user;
      }
    } catch {
      user = null;
    }

    if (!user?.id) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'Autentikasi diperlukan: Sesi pengguna tidak ditemukan atau kedaluwarsa',
        },
        { status: 401 }
      );
    }

    // 2. Resolusi Konteks Tenant Resmi (Fail-Closed)
    let tenant: { id: string };
    try {
      const tenantCtx = await getTenantContext();
      if (!tenantCtx?.id || tenantCtx.id.trim() === '' || tenantCtx.id === DEFAULT_TENANT.id) {
        return NextResponse.json(
          { success: false, code: 'TENANT_NOT_FOUND', message: 'Konteks tenant valid diperlukan' },
          { status: 400 }
        );
      }
      tenant = tenantCtx;
    } catch {
      return NextResponse.json(
        { success: false, code: 'TENANT_NOT_FOUND', message: 'Konteks tenant valid diperlukan' },
        { status: 400 }
      );
    }

    // 3. Validasi Otorisasi Berbasis Database (Canonical Permission)
    const authz = await requirePermission(user.id, tenant.id, Permission.VIEW_FINANCE_RECONCILIATION);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk melihat data rekonsiliasi keuangan',
        },
        { status: 403 }
      );
    }

    const data = await reconciliationEngine.getDashboardData(tenant.id);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('[API /api/finance/reconciliation GET] Internal error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal mengambil data rekonsiliasi keuangan' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Autentikasi Pengguna Sesi Server (Fail-Closed)
    let user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) {
        user = data.user;
      }
    } catch {
      user = null;
    }

    if (!user?.id) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'Autentikasi diperlukan: Sesi pengguna tidak ditemukan atau kedaluwarsa',
        },
        { status: 401 }
      );
    }

    // 2. Resolusi Konteks Tenant Resmi (Fail-Closed)
    let tenant: { id: string };
    try {
      const tenantCtx = await getTenantContext();
      if (!tenantCtx?.id || tenantCtx.id.trim() === '' || tenantCtx.id === DEFAULT_TENANT.id) {
        return NextResponse.json(
          { success: false, code: 'TENANT_NOT_FOUND', message: 'Konteks tenant valid diperlukan' },
          { status: 400 }
        );
      }
      tenant = tenantCtx;
    } catch {
      return NextResponse.json(
        { success: false, code: 'TENANT_NOT_FOUND', message: 'Konteks tenant valid diperlukan' },
        { status: 400 }
      );
    }

    // 3. Validasi Otorisasi Berbasis Database (Canonical Permission)
    const authz = await requirePermission(user.id, tenant.id, Permission.MANAGE_FINANCE_RECONCILIATION);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk mengelola atau menjalankan rekonsiliasi keuangan',
        },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action === 'resolve' ? 'resolve' : 'run';
    const anomalyId = typeof body.anomalyId === 'string' ? body.anomalyId : undefined;
    const resolutionNotes = typeof body.resolutionNotes === 'string' ? body.resolutionNotes : undefined;
    const runType = body.runType === 'AUTOMATED' ? 'AUTOMATED' : 'MANUAL';
    const status = body.status === 'FALSE_POSITIVE' ? 'FALSE_POSITIVE' : 'RESOLVED';

    if (action === 'resolve') {
      if (!anomalyId || !resolutionNotes) {
        return NextResponse.json(
          { success: false, code: 'BAD_REQUEST', message: 'anomalyId dan resolutionNotes wajib diisi' },
          { status: 400 }
        );
      }

      const result = await reconciliationEngine.resolveAnomaly({
        tenantId: tenant.id,
        anomalyId,
        resolvedBy: user.id,
        resolutionNotes,
        status,
      });

      return NextResponse.json(result, { status: 200 });
    }

    // Default action: run reconciliation
    const result = await reconciliationEngine.runReconciliation({
      tenantId: tenant.id,
      triggeredBy: user.id,
      runType,
    });

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error: unknown) {
    console.error('[API /api/finance/reconciliation POST] Internal error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal menjalankan rekonsiliasi keuangan' },
      { status: 500 }
    );
  }
}
