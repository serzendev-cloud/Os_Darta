// ==============================================================================
// Finance SPP Installments List API Route (Admin Keuangan)
// Work Package: WP-SEC-FINANCE-001 (Hardened Auth & Strict Tenancy)
// ==============================================================================

import { NextResponse } from 'next/server';
import { sppService } from '@/lib/finance/spp-service';
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
    const authz = await requirePermission(user.id, tenant.id, Permission.VIEW_SPP_INSTALLMENTS);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang mengakses daftar pengajuan cicilan',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const plans = await sppService.getInstallmentPlansForAdmin(tenant.id, status);

    return NextResponse.json(
      {
        success: true,
        data: plans,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('[API /api/finance/spp/installments GET] Internal error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal mengambil daftar pengajuan cicilan' },
      { status: 500 }
    );
  }
}
