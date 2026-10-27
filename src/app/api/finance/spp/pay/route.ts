// ==============================================================================
// Finance SPP Payment API Route (Direct Full or Installment Payment)
// Work Package: WP-FINANCE-AUTH-HARDENING-002 (Wave 2)
// Directives: PO-EXEC-FINANCE-AUTH-HARDENING-WAVE-2-001
// Compliance: Fail-Closed Server Auth (401), Tenancy & Role Validation (403), Idempotency
// ==============================================================================

import { NextResponse } from 'next/server';
import { sppService } from '@/lib/finance/spp-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getEffectivePermissions } from '@/lib/authz/authorization-service';

export async function POST(request: Request) {
  try {
    const headerTenantId = request.headers.get('x-tenant-id');
    const body = await request.json();
    const {
      billId,
      scheduleId,
      amount,
      paymentMethod = 'TRANSFER_MANUAL',
      idempotencyKey,
      notes,
    } = body;

    const tenantId = (headerTenantId || body.tenantId || 'default').trim();

    if (!billId || !amount) {
      return NextResponse.json(
        { success: false, message: 'ID tagihan dan nominal pembayaran wajib diisi' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Nominal pembayaran harus berupa integer lebih dari 0' },
        { status: 400 }
      );
    }

    // ── Zero-Trust Role & Identity Verification ─────────────────────────────
    let user = null;
    let serverUserId: string | null = null;
    let serverUserName: string = 'Admin Keuangan';

    // 1. Resolve Server Session (Fail-Closed)
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) {
        user = data.user;
        serverUserId = user.id;
        serverUserName =
          user.user_metadata?.full_name || user.email || 'Admin Keuangan';
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
          permResult.effectivePermissions.has('finance:pay'))
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
          message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang memverifikasi dan mencatat pembayaran SPP',
        },
        { status: 403 }
      );
    }

    // 3. Record Payment via SppService
    const result = await sppService.recordSppPayment({
      tenantId,
      billId,
      scheduleId,
      amount,
      paymentMethod,
      verifiedBy: serverUserId,
      verifiedByName: serverUserName,
      idempotencyKey,
      notes,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mencatat pembayaran SPP';
    const isNotFound = msg.startsWith('BILL_NOT_FOUND') || msg.startsWith('SCHEDULE_NOT_FOUND');
    const isConflict =
      msg.startsWith('BILL_ALREADY_PAID') ||
      msg.startsWith('EXCEEDS_REMAINING_AMOUNT');
    const isBadInput = msg.startsWith('INVALID_AMOUNT');

    const status = isNotFound ? 404 : isConflict ? 409 : isBadInput ? 400 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

