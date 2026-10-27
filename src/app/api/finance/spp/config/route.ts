// ==============================================================================
// SPP Configuration API Route (Admin Keuangan)
// Work Package: WP-FINANCE-AUTH-HARDENING-002 (Wave 1)
// Directives: DEC-02, PO-EXEC-FINANCE-AUTH-HARDENING-WAVE-1-001
// Compliance: Fail-Closed Server Auth (401), Tenancy & Role Validation (403)
// ==============================================================================

import { NextResponse } from 'next/server';
import { sppBillingService } from '@/lib/finance/spp-billing-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getEffectivePermissions } from '@/lib/authz/authorization-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const headerTenantId = request.headers.get('x-tenant-id');
    const tenantId = (searchParams.get('tenantId') || headerTenantId || 'default').trim();

    // 1. Resolve Server Session (Fail-Closed)
    let user = null;
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

    // 2. Resolve Database-Backed Effective Permissions (Fail-Closed)
    let isAuthorized = false;
    try {
      const permResult = await getEffectivePermissions(user.id, tenantId);
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
          message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang melihat konfigurasi SPP',
        },
        { status: 403 }
      );
    }

    const config = await sppBillingService.getSppConfiguration(tenantId);
    return NextResponse.json({ success: true, data: config }, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memuat konfigurasi SPP';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const headerTenantId = request.headers.get('x-tenant-id');
    const body = await request.json();
    const {
      name,
      amount,
      billingDay = 1,
      dueDay = 10,
      academicYear,
      effectiveFrom,
      effectiveTo,
    } = body;

    const tenantId = (headerTenantId || body.tenantId || 'default').trim();

    // 1. Resolve Server Session (Fail-Closed)
    let user = null;
    let serverUserId: string | null = null;
    let serverUserName: string = 'Admin Keuangan';

    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) {
        user = data.user;
        serverUserId = user.id;
        serverUserName = user.user_metadata?.full_name || user.email || 'Admin Keuangan';
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
          message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang mengubah konfigurasi SPP',
        },
        { status: 403 }
      );
    }

    const result = await sppBillingService.saveSppConfiguration({
      tenantId,
      name: name || 'Tarif SPP Standar',
      amount,
      billingDay,
      dueDay,
      academicYear,
      effectiveFrom: effectiveFrom || new Date(),
      effectiveTo,
      actorId: serverUserId,
      actorName: serverUserName,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal menyimpan konfigurasi SPP';
    const isBadInput = msg.startsWith('INVALID_AMOUNT');
    return NextResponse.json({ success: false, message: msg }, { status: isBadInput ? 400 : 500 });
  }
}

