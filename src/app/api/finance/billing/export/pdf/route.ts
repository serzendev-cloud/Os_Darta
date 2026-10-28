// ==============================================================================
// Billing Export to PDF API Route (Direct Binary PDF Download)
// Work Package: WP-SEC-FINANCE-001 (Hardened Auth & Strict Tenancy)
// Compliance: Direct PDF Download, Multi-Page, Kop Pesantren, Tenant Scoped
// ==============================================================================

import { NextResponse } from 'next/server';
import { recapExportService } from '@/lib/finance/recap-export-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/authz/authorization-service';
import { financialAuditService } from '@/lib/finance/auditTrail';
import { getTenantContext, DEFAULT_TENANT } from '@/lib/tenant/context';
import { Permission } from '@/config/permissions';

export async function GET(request: Request) {
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
    const authz = await requirePermission(user.id, tenant.id, Permission.EXPORT_FINANCE_RECAP);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Akses Ditolak: Hanya Admin Keuangan yang berwenang mengekspor laporan keuangan',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') || undefined;
    const category = searchParams.get('category') || undefined;
    const periodMonthYear = searchParams.get('periodMonthYear') || undefined;
    const kelas = searchParams.get('kelas') || undefined;
    const statusFilter = (searchParams.get('status') as any) || 'ALL';
    const searchQuery = searchParams.get('q') || undefined;

    const serverUserName = user.user_metadata?.full_name || user.email || 'Admin Keuangan';

    // 4. Ambil data rekapitulasi & branding tenant
    const recap = await recapExportService.getBillingRecap({
      tenantId: tenant.id,
      campaignId,
      category,
      periodMonthYear,
      kelas,
      statusFilter,
      searchQuery,
    });

    const branding = await recapExportService.getTenantBranding(tenant.id);
    const pdfBuffer = await recapExportService.generatePdfDocument(
      recap,
      branding.name,
      branding.tagline
    );

    // 5. Catat Log Audit Finansial
    await financialAuditService.log({
      tenantId: tenant.id,
      actorId: user.id,
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
    console.error('[API /api/finance/billing/export/pdf GET] Internal error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal mengekspor laporan PDF' },
      { status: 500 }
    );
  }
}
