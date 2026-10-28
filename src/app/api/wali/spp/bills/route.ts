// ==============================================================================
// Wali SPP Bills List API Route
// Work Package: APP-MAHAD-SPP-INSTALLMENT-001
// Compliance: PO Decisions 1, 2, 10, 13 (Server-Side Auth & Tenant Isolation)
// ==============================================================================

import { NextResponse } from 'next/server';
import { sppService } from '@/lib/finance/spp-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { authorizeWaliSantriAccess } from '@/lib/authz/authorization-service';
import { getTenantContext } from '@/lib/tenant/context';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const santriId = searchParams.get('santriId') || undefined;


    // 1. Fail-Closed Server-Side Authentication
    let serverUserId: string | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) {
        serverUserId = data.user.id;
      }
    } catch {
      serverUserId = null;
    }


    if (!serverUserId) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHENTICATED', message: 'Autentikasi diperlukan untuk mengakses tagihan SPP' },
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
      console.error(`[SPP_ROUTE_SECURITY] Failed to resolve tenant context in GET /api/wali/spp/bills (Type: ${errName})`);
      return NextResponse.json(
        {
          success: false,
          code: 'TENANT_NOT_FOUND',
          message: 'Konteks tenant tidak ditemukan atau tidak valid',
        },
        { status: 400 }
      );
    }

    // 3. If santriId is explicitly requested, verify Wali-Santri relationship (Fail-Closed, Zero Bypass)
    if (santriId) {
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
            message: 'Akses ditolak: Anda tidak memiliki akses ke tagihan santri ini',
          },
          { status: 403 }
        );
      }
    }

    const bills = await sppService.getWaliSppBills(serverTenantId, serverUserId, santriId);

    return NextResponse.json(
      {
        success: true,
        data: bills,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const errorType = error instanceof Error ? error.name : 'UnknownError';
    console.error(`[SPP_ROUTE_ERROR] Handled route error in GET /api/wali/spp/bills (Type: ${errorType})`);
    return NextResponse.json({ success: false, message: 'Gagal memproses permintaan tagihan SPP' }, { status: 500 });
  }
}
