// ==============================================================================
// Wali SPP Installment Application API Route
// Work Package: APP-MAHAD-SPP-INSTALLMENT-001
// Compliance: PO Decisions 1, 2, 3, 10, 13 (Server-Side Auth & Relationship Verification)
// ==============================================================================

import { NextResponse } from 'next/server';
import { sppService } from '@/lib/finance/spp-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { authorizeWaliSantriAccess } from '@/lib/authz/authorization-service';
import { getTenantContext } from '@/lib/tenant/context';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      billId,
      santriId,
      requestedInstallmentsCount,
      requestedAmountPerInstallment,
      reason,
    } = body;

    // 1. Fail-Closed Server-Side Authentication
    let serverUserId: string | null = null;
    let serverUserName: string = 'Wali Santri';
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) {
        serverUserId = data.user.id;
        serverUserName = data.user.user_metadata?.full_name || data.user.email || 'Wali Santri';
      }
    } catch {
      serverUserId = null;
    }


    if (!serverUserId) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHENTICATED', message: 'Autentikasi diperlukan untuk mengajukan cicilan' },
        { status: 401 }
      );
    }

    // 2. Resolve Verified Tenant Context (Fail-Closed, Zero Client Header Spoofing)
    let serverTenantId: string;
    try {
      const tenantContext = await getTenantContext();
      if (!tenantContext || !tenantContext.id) {
        return NextResponse.json(
          { success: false, code: 'INVALID_TENANT_CONTEXT', message: 'Konteks tenant tidak valid' },
          { status: 400 }
        );
      }
      serverTenantId = tenantContext.id;
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : 'UnknownError';
      console.error(`[SPP_ROUTE_SECURITY] Failed to resolve tenant context in POST /api/wali/spp/installments/apply (Type: ${errName})`);
      return NextResponse.json(
        {
          success: false,
          code: 'TENANT_NOT_FOUND',
          message: 'Konteks tenant tidak ditemukan atau tidak valid',
        },
        { status: 400 }
      );
    }

    // 3. Validation
    if (!billId || !santriId) {
      return NextResponse.json(
        { success: false, message: 'ID tagihan dan ID santri wajib disertakan' },
        { status: 400 }
      );
    }

    if (!requestedInstallmentsCount || requestedInstallmentsCount < 2) {
      return NextResponse.json(
        { success: false, message: 'Jumlah cicilan yang diajukan minimal 2 kali angsuran' },
        { status: 400 }
      );
    }

    // 4. Verify Wali-Santri relationship (Fail-Closed, Zero Bypass)
    const authResult = await authorizeWaliSantriAccess(
      serverUserId,
      serverTenantId,
      santriId
    );

    if (!authResult.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: authResult.decision,
          message: 'Akses ditolak: Anda tidak berwenang mengajukan cicilan untuk santri ini',
        },
        { status: 403 }
      );
    }

    // 5. Submit installment plan via service
    const result = await sppService.applyInstallmentPlan({
      tenantId: serverTenantId,
      billId,
      waliId: serverUserId,
      santriId,
      requestedInstallmentsCount,
      requestedAmountPerInstallment,
      reason,
      actorId: serverUserId,
      actorName: serverUserName,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[SPP_ROUTE_ERROR] Handled route error in POST /api/wali/spp/installments/apply (Type: ${errorType})`);

    const rawMsg = error instanceof Error ? error.message : '';
    let status = 500;
    let publicMessage = 'Gagal memproses pengajuan cicilan SPP';

    if (rawMsg.startsWith('BILL_NOT_FOUND')) {
      status = 404;
      publicMessage = 'Tagihan SPP tidak ditemukan atau tidak aktif';
    } else if (rawMsg.startsWith('INSTALLMENTS_NOT_ALLOWED')) {
      status = 403;
      publicMessage = 'Pengajuan cicilan tidak diperkenankan untuk jenis tagihan ini';
    } else if (
      rawMsg.startsWith('PENDING_PLAN_EXISTS') ||
      rawMsg.startsWith('ACTIVE_PLAN_EXISTS') ||
      rawMsg.startsWith('BILL_ALREADY_PAID')
    ) {
      status = 409;
      publicMessage = 'Pengajuan cicilan tidak dapat diproses karena proposal atau tagihan sudah berstatus aktif/lunas';
    } else if (
      rawMsg.startsWith('INVALID_INSTALLMENTS_COUNT') ||
      rawMsg.startsWith('INVALID_INSTALLMENT_AMOUNT')
    ) {
      status = 400;
      publicMessage = 'Parameter pengajuan cicilan tidak memenuhi ketentuan nominal atau jumlah angsuran';
    }

    return NextResponse.json({ success: false, message: publicMessage }, { status });
  }
}
