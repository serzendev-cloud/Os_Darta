// ==============================================================================
// Additional Billing Campaigns API Route (Admin Keuangan)
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
        { success: false, code: 'UNAUTHENTICATED', message: 'Autentikasi diperlukan untuk mengakses daftar tagihan' },
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

    // 3. Otorisasi Izin Berbasis Database
    const authz = await requirePermission(user.id, tenant.id, Permission.VIEW_BILLING_CAMPAIGNS);
    if (!authz.authorized) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'Akses Ditolak: Anda tidak memiliki wewenang melihat kampanye tagihan' },
        { status: 403 }
      );
    }

    const campaigns = await sppBillingService.getBillingCampaigns(tenant.id);
    return NextResponse.json({ success: true, data: campaigns }, { status: 200 });
  } catch (error: unknown) {
    console.error('[API /api/finance/billing/campaigns GET] Internal error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memuat daftar tagihan tambahan' },
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
        { success: false, code: 'UNAUTHENTICATED', message: 'Autentikasi diperlukan untuk menerbitkan tagihan' },
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

    // 3. Otorisasi Izin Berbasis Database
    const authz = await requirePermission(user.id, tenant.id, Permission.MANAGE_BILLING_CAMPAIGNS);
    if (!authz.authorized) {
      return NextResponse.json(
        { success: false, code: 'FORBIDDEN', message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang menerbitkan tagihan tambahan' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      title,
      category,
      description,
      academicYear,
      amountPerStudent,
      dueDate,
      targetType = 'ALL_ACTIVE',
      targetClasses = [],
      targetSantriIds = [],
      allowInstallments = false,
    } = body as Record<string, any>;

    if (!title || !category || !amountPerStudent || !dueDate) {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'Judul, kategori, nominal, dan tanggal jatuh tempo wajib diisi' },
        { status: 400 }
      );
    }

    const serverUserName = user.user_metadata?.full_name || user.email || 'Admin Keuangan';

    const result = await sppBillingService.createAdditionalBillCampaign({
      tenantId: tenant.id,
      title,
      category,
      description,
      academicYear,
      amountPerStudent,
      dueDate,
      targetType,
      targetClasses,
      targetSantriIds,
      allowInstallments,
      publishedBy: user.id,
      publishedByName: serverUserName,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('[API /api/finance/billing/campaigns POST] Internal error:', error);
    const rawMsg = error instanceof Error ? error.name + ': ' + String(error) : '';
    const isBadInput =
      rawMsg.startsWith('INVALID_TITLE') ||
      rawMsg.startsWith('INVALID_AMOUNT') ||
      rawMsg.startsWith('NO_TARGET_STUDENTS');

    return NextResponse.json(
      {
        success: false,
        code: isBadInput ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR',
        message: isBadInput
          ? 'Data tagihan tambahan tidak valid'
          : 'Gagal menerbitkan tagihan tambahan',
      },
      { status: isBadInput ? 400 : 500 }
    );
  }
}
