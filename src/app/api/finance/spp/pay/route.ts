// ==============================================================================
// Finance SPP Payment API Route (Direct Full or Installment Payment)
// Work Package: WP-SEC-FINANCE-001 (Hardened Auth & Strict Tenancy)
// ==============================================================================

import { NextResponse } from 'next/server';
import { sppService } from '@/lib/finance/spp-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/authz/authorization-service';
import { getTenantContext, DEFAULT_TENANT } from '@/lib/tenant/context';
import { Permission } from '@/config/permissions';

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
    const authz = await requirePermission(user.id, tenant.id, Permission.RECORD_SPP_PAYMENT);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang memverifikasi dan mencatat pembayaran SPP',
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      billId,
      scheduleId,
      amount,
      paymentMethod = 'TRANSFER_MANUAL',
      idempotencyKey,
      notes,
    } = body as Record<string, any>;

    if (!billId || amount === undefined || amount === null) {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'ID tagihan dan nominal pembayaran wajib diisi' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, code: 'INVALID_AMOUNT', message: 'Nominal pembayaran harus berupa integer lebih dari 0' },
        { status: 400 }
      );
    }

    const serverUserName = user.user_metadata?.full_name || user.email || 'Admin Keuangan';

    // 4. Catat Pembayaran via SppService
    const result = await sppService.recordSppPayment({
      tenantId: tenant.id,
      billId,
      scheduleId,
      amount,
      paymentMethod,
      verifiedBy: user.id,
      verifiedByName: serverUserName,
      idempotencyKey,
      notes,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[API /api/finance/spp/pay POST] Internal error:', error);
    const rawMsg = error instanceof Error ? String(error) : '';
    const isNotFound = rawMsg.includes('BILL_NOT_FOUND') || rawMsg.includes('SCHEDULE_NOT_FOUND');
    const isConflict =
      rawMsg.includes('BILL_ALREADY_PAID') ||
      rawMsg.includes('EXCEEDS_REMAINING_AMOUNT');
    const isBadInput = rawMsg.includes('INVALID_AMOUNT');

    const status = isNotFound ? 404 : isConflict ? 409 : isBadInput ? 400 : 500;
    const message = isNotFound
      ? 'Tagihan atau jadwal cicilan tidak ditemukan'
      : isConflict
      ? 'Tagihan sudah lunas atau pembayaran melebihi sisa tagihan'
      : isBadInput
      ? 'Nominal pembayaran tidak valid'
      : 'Gagal mencatat pembayaran SPP';

    return NextResponse.json({ success: false, code: rawMsg.split(':')[0] || 'ERROR', message }, { status });
  }
}
