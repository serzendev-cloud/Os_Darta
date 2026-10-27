// ==============================================================================
// Billing Recap API Route (Admin Keuangan)
// Work Package: WP-FINANCE-AUTH-HARDENING-002 (Wave 1)
// Directives: PO-EXEC-FINANCE-AUTH-HARDENING-WAVE-1-001
// Compliance: Fail-Closed Server Auth (401), Tenancy & Role Validation (403)
// ==============================================================================

import { NextResponse } from 'next/server';
import { recapExportService } from '@/lib/finance/recap-export-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getEffectivePermissions } from '@/lib/authz/authorization-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') || undefined;
    const category = searchParams.get('category') || undefined;
    const periodMonthYear = searchParams.get('periodMonthYear') || undefined;
    const kelas = searchParams.get('kelas') || undefined;
    const statusFilter = (searchParams.get('status') as any) || 'ALL';
    const searchQuery = searchParams.get('q') || undefined;

    const headerTenantId = request.headers.get('x-tenant-id');
    const tenantId = (searchParams.get('tenantId') || headerTenantId || 'default').trim();

    // 1. Resolve Server Session (Fail-Closed)
    let user = null;
    let serverUserId: string | null = null;

    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) {
        user = data.user;
        serverUserId = user.id;
      }
    } catch {
      user = null;
    }

    if (!user || !serverUserId) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'Autentikasi diperlukan: Sesi pengguna tidak ditemukan atau kedaluwarsa',
        },
        { status: 401 }
      );
    }

    // 2. Resolve Database-Backed Effective Permissions (Fail-Closed, Zero Header Fallback)
    let isAuthorized = false;
    try {
      const permResult = await getEffectivePermissions(serverUserId, tenantId);
      if (
        permResult.authorized &&
        (permResult.primaryRoleCode === 'ADMIN_KEUANGAN' ||
          permResult.primaryRoleCode === 'BENDAHARA' ||
          permResult.effectivePermissions.has('finance:review'))
      ) {
        isAuthorized = true;
      }
    } catch {
      isAuthorized = false;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHORIZED_FINANCE_ROLE',
          message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang mengakses rekapitulasi pembayaran',
        },
        { status: 403 }
      );
    }

    const recap = await recapExportService.getBillingRecap({
      tenantId,
      campaignId,
      category,
      periodMonthYear,
      kelas,
      statusFilter,
      searchQuery,
    });

    return NextResponse.json({ success: true, data: recap }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat rekapitulasi pembayaran';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

