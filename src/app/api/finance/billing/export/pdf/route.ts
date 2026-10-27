// ==============================================================================
// Billing Export to PDF API Route (Direct Binary PDF Download)
// Work Package: APP-MAHAD-FINANCE-BILLING-001 (Requirement B)
// Compliance: Direct PDF Download, Multi-Page, Kop Pesantren, Tenant Scoped
// ==============================================================================

import { NextResponse } from 'next/server';
import { recapExportService } from '@/lib/finance/recap-export-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getEffectivePermissions } from '@/lib/authz/authorization-service';
import { financialAuditService } from '@/lib/finance/auditTrail';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') || undefined;
    const category = searchParams.get('category') || undefined;
    const periodMonthYear = searchParams.get('periodMonthYear') || undefined;
    const kelas = searchParams.get('kelas') || undefined;
    const statusFilter = (searchParams.get('status') as any) || 'ALL';
    const searchQuery = searchParams.get('q') || undefined;

    const headerTenantId = request.headers.get('x-tenant-id');
    const tenantId = (headerTenantId || searchParams.get('tenantId') || 'default').trim();

    let serverUserId: string | null = null;
    let serverUserName: string = 'Admin Keuangan';
    let isAuthorized = false;

    // 1. Resolve Server Session (Fail-Closed)
    let user = null;
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

    // 2. Resolve Database-Backed Effective Permissions (Fail-Closed, Zero Fallback)
    try {
      const permResult = await getEffectivePermissions(serverUserId, tenantId);
      if (
        permResult.authorized &&
        (permResult.primaryRoleCode === 'ADMIN_KEUANGAN' ||
          permResult.primaryRoleCode === 'BENDAHARA' ||
          permResult.effectivePermissions.has('finance:export'))
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
          message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang mengekspor laporan keuangan',
        },
        { status: 403 }
      );
    }

    // 3. Fetch recap data
    const recap = await recapExportService.getBillingRecap({
      tenantId,
      campaignId,
      category,
      periodMonthYear,
      kelas,
      statusFilter,
      searchQuery,
    });

    const branding = await recapExportService.getTenantBranding(tenantId);
    const pdfBuffer = await recapExportService.generatePdfDocument(
      recap,
      branding.name,
      branding.tagline
    );

    // 4. Log Immutable Audit Trail for PDF Export
    await financialAuditService.log({
      tenantId,
      actorId: serverUserId,
      actorName: serverUserName,
      actorRole: 'admin_keuangan',
      action: 'REPORT_EXPORTED',
      targetEntity: 'spp_bill',
      targetId: campaignId || 'batch_recap',
      amount: recap.summary.totalVerifiedPaid,
      status: 'SUCCESS',
      metadata: {
        format: 'PDF',
        totalRows: recap.items.length,
        filter: { category, periodMonthYear, kelas, statusFilter },
      },
    });

    const categorySlug = (category || recap.campaign?.category || 'spp').toLowerCase();
    const periodSlug = (periodMonthYear || new Date().toISOString().slice(0, 7))
      .replace(/\s+/g, '-')
      .toLowerCase();
    const filename = `rekap-pembayaran-${categorySlug}-${periodSlug}.pdf`;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengekspor laporan PDF';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
