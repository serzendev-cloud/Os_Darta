// ========================================
// PPOB Customer Inquiry API Route
// Work Package: WP-SEC-CLOSEOUT-001 (Hardened Auth & Strict Tenancy)
// ========================================

import { NextResponse } from 'next/server';
import { digiflazzClient } from '@/lib/ppob/digiflazz';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getTenantContext, DEFAULT_TENANT } from '@/lib/tenant/context';
import { requirePermission } from '@/lib/authz/authorization-service';
import { Permission } from '@/config/permissions';

export async function POST(req: Request) {
  try {
    // 1. Autentikasi Pengguna Sesi Server (Fail-Closed)
    let user: { id: string } | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) {
        user = { id: data.user.id };
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
          {
            success: false,
            code: 'TENANT_NOT_FOUND',
            message: 'Konteks tenant valid diperlukan',
          },
          { status: 400 }
        );
      }
      tenant = tenantCtx;
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: 'TENANT_NOT_FOUND',
          message: 'Konteks tenant valid diperlukan',
        },
        { status: 400 }
      );
    }

    // 3. Validasi Otorisasi Izin Kanonikal Berbasis Database
    const authz = await requirePermission(user.id, tenant.id, Permission.PROCESS_PPOB_CHECKOUT);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Izin ditolak: Anda tidak memiliki wewenang untuk melakukan inkuiri PPOB',
        },
        { status: 403 }
      );
    }

    // 4. Validasi Parameter Request Body
    const body = await req.json().catch(() => ({}));
    const { customerNo, skuCode } = (body || {}) as { customerNo?: string; skuCode?: string };

    if (!customerNo || typeof customerNo !== 'string' || customerNo.trim() === '' ||
        !skuCode || typeof skuCode !== 'string' || skuCode.trim() === '') {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'Nomor Pelanggan dan Kode SKU Wajib diisi' },
        { status: 400 }
      );
    }

    // 5. Eksekusi Inkuiri ke Provider
    const result = await digiflazzClient.inquiryCustomer(customerNo.trim(), skuCode.trim());
    return NextResponse.json({
      success: Boolean(result.status),
      code: result.status ? 'INQUIRY_SUCCESS' : 'INQUIRY_FAILED',
      data: result,
    });
  } catch (error: unknown) {
    console.error('[API /api/ppob/inquiry POST] Internal error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memproses inkuiri pelanggan' },
      { status: 500 }
    );
  }
}
