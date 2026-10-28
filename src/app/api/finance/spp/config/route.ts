// ==============================================================================
// SPP Configuration API Route (Admin Keuangan)
// Work Package: WP-SEC-FINANCE-001 (Hardened Auth & Strict Tenancy)
// ==============================================================================

import { NextResponse } from 'next/server';
import { sppBillingService } from '@/lib/finance/spp-billing-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/authz/authorization-service';
import { getTenantContext, DEFAULT_TENANT } from '@/lib/tenant/context';
import { Permission } from '@/config/permissions';

export async function GET() {
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
    const authz = await requirePermission(user.id, tenant.id, Permission.VIEW_SPP_CONFIG);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang melihat konfigurasi SPP',
        },
        { status: 403 }
      );
    }

    const config = await sppBillingService.getSppConfiguration(tenant.id);
    return NextResponse.json({ success: true, data: config }, { status: 200 });
  } catch (error: unknown) {
    console.error('[API /api/finance/spp/config GET] Internal error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memuat konfigurasi SPP' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const authz = await requirePermission(user.id, tenant.id, Permission.MANAGE_SPP_CONFIG);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang mengubah konfigurasi SPP',
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      name,
      amount,
      billingDay = 1,
      dueDay = 10,
      academicYear,
      effectiveFrom,
      effectiveTo,
    } = body as Record<string, any>;

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return NextResponse.json(
        { success: false, code: 'INVALID_AMOUNT', message: 'Nominal tarif SPP harus lebih besar dari 0 (INVALID_AMOUNT)' },
        { status: 400 }
      );
    }

    const serverUserName = user.user_metadata?.full_name || user.email || 'Admin Keuangan';

    const result = await sppBillingService.saveSppConfiguration({
      tenantId: tenant.id,
      name: name || 'Tarif SPP Standar',
      amount,
      billingDay,
      dueDay,
      academicYear,
      effectiveFrom: effectiveFrom || new Date(),
      effectiveTo,
      actorId: user.id,
      actorName: serverUserName,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[API /api/finance/spp/config POST] Internal error:', error);
    const rawMsg = error instanceof Error ? String(error) : '';
    const isBadInput = rawMsg.includes('INVALID_AMOUNT');
    return NextResponse.json(
      {
        success: false,
        code: isBadInput ? 'INVALID_AMOUNT' : 'INTERNAL_SERVER_ERROR',
        message: isBadInput ? 'Nominal tarif SPP tidak valid' : 'Gagal menyimpan konfigurasi SPP',
      },
      { status: isBadInput ? 400 : 500 }
    );
  }
}
