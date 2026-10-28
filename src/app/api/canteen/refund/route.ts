// ==============================================================================
// Canteen Refund API Route (List & Request)
// Work Package: WP-SEC-CANTEEN-001 (Hardened Auth & Strict Tenancy)
// Compliance: Fail-Closed Server Auth (401), Tenant Scoping (400), Canonical RBAC (403)
// ==============================================================================

import { NextResponse } from 'next/server';
import { refundService } from '@/lib/finance/refund';
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
    const authz = await requirePermission(user.id, tenant.id, Permission.VIEW_CANTEEN_REFUND);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk melihat data refund kantin',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const canteenId = searchParams.get('canteenId') || undefined;

    const data = await refundService.listRefunds({ tenantId: tenant.id, status, canteenId });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error('[API /api/canteen/refund GET] Internal error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal mengambil data refund kantin' },
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
    const authz = await requirePermission(user.id, tenant.id, Permission.REQUEST_CANTEEN_REFUND);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Akses Ditolak: Anda tidak memiliki wewenang untuk mengajukan refund transaksi kantin',
        },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const transactionId = typeof body.transactionId === 'string' ? body.transactionId : undefined;
    const reason = typeof body.reason === 'string' ? body.reason : undefined;
    const refundAmountRaw = body.refundAmount;

    if (!transactionId || !reason) {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'ID transaksi dan alasan refund wajib diisi' },
        { status: 400 }
      );
    }

    const serverUserName =
      (user.user_metadata?.full_name as string) || user.email || 'Staf Pemohon';

    const result = await refundService.requestRefund({
      tenantId: tenant.id,
      transactionId,
      refundAmount: refundAmountRaw !== undefined && refundAmountRaw !== null ? Number(refundAmountRaw) : undefined,
      reason,
      requestedBy: user.id,
      requestedByName: serverUserName,
      requestedByRole: 'staff',
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error('[API /api/canteen/refund POST] Internal error:', error);
    const rawMsg = error instanceof Error ? String(error) : '';
    const isClientErr =
      rawMsg.startsWith('TRANSACTION_NOT_FOUND') ||
      rawMsg.startsWith('INVALID_TRANSACTION_STATUS') ||
      rawMsg.startsWith('ALREADY_FULLY_REFUNDED') ||
      rawMsg.startsWith('EXCEEDS_REFUNDABLE_AMOUNT') ||
      rawMsg.includes('wajib diisi') ||
      rawMsg.includes('positif');

    const message = isClientErr
      ? rawMsg.includes(': ')
        ? rawMsg.split(': ')[1]
        : rawMsg
      : 'Gagal mengajukan refund kantin';

    return NextResponse.json(
      { success: false, code: rawMsg.split(':')[0] || 'ERROR', message },
      { status: isClientErr ? 400 : 500 }
    );
  }
}
