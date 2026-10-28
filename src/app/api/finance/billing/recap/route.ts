// ==============================================================================
// Billing Recap API Route (Admin Keuangan)
// Work Package: WP-SEC-FINANCE-001 (Hardened Auth & Strict Tenancy)
// ==============================================================================

import { NextResponse } from 'next/server';
import { recapExportService } from '@/lib/finance/recap-export-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/authz/authorization-service';
import { getTenantContext, DEFAULT_TENANT } from '@/lib/tenant/context';
import { Permission } from '@/config/permissions';

export async function GET(request: Request) {
  try {
    // 1. Autentikasi Pengguna Sesi Server (Fail-Closed)
    let user: any = null;
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

    // 3. Validasi Otorisasi Berbasis Database
    const authz = await requirePermission(user.id, tenant.id, Permission.VIEW_FINANCE_RECAP);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang mengakses rekapitulasi pembayaran',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') || undefined;
    const category = searchParams.get('category') || undefined;
    const periodMonthYear = searchParams.get('periodMonthYear') || undefined;
    const kelas = searchParams.get('kelas') || undefined;
    const statusFilter = (searchParams.get('status') as any) || 'ALL';
    const searchQuery = searchParams.get('q') || undefined;

    const recap = await recapExportService.getBillingRecap({
      tenantId: tenant.id,
      campaignId,
      category,
      periodMonthYear,
      kelas,
      statusFilter,
      searchQuery,
    });

    return NextResponse.json({ success: true, data: recap }, { status: 200 });
  } catch (error: unknown) {
    console.error('[API /api/finance/billing/recap GET] Internal error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memuat rekapitulasi pembayaran' },
      { status: 500 }
    );
  }
}
