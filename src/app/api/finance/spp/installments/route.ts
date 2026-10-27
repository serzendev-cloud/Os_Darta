// ==============================================================================
// Finance SPP Installments List API Route (Admin Keuangan)
// Work Package: WP-FINANCE-AUTH-HARDENING-002 (Wave 1)
// Directives: PO-EXEC-FINANCE-AUTH-HARDENING-WAVE-1-001
// Compliance: Fail-Closed Server Auth (401), Tenancy & Role Validation (403)
// ==============================================================================

import { NextResponse } from 'next/server';
import { sppService } from '@/lib/finance/spp-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getEffectivePermissions } from '@/lib/authz/authorization-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

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
    let isAuthorizedAdmin = false;
    try {
      const permResult = await getEffectivePermissions(serverUserId, tenantId);
      if (
        permResult.authorized &&
        (permResult.primaryRoleCode === 'ADMIN_KEUANGAN' ||
          permResult.primaryRoleCode === 'BENDAHARA' ||
          permResult.effectivePermissions.has('finance:review'))
      ) {
        isAuthorizedAdmin = true;
      }
    } catch {
      isAuthorizedAdmin = false;
    }

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHORIZED_FINANCE_ROLE',
          message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang mengakses daftar pengajuan cicilan',
        },
        { status: 403 }
      );
    }

    const plans = await sppService.getInstallmentPlansForAdmin(tenantId, status);

    return NextResponse.json(
      {
        success: true,
        data: plans,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengambil daftar pengajuan cicilan';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

