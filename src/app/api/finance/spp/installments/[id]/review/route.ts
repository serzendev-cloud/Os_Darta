// ==============================================================================
// Finance SPP Installments Review Route (Admin Keuangan Approval & Rejection)
// Work Package: WP-SEC-FINANCE-001 (Hardened Auth & Strict Tenancy)
// Compliance: Fail-Closed Server Auth (401), Anti-SuperAdmin Bypass (Dir 15), Anti-SelfApproval (403)
// ==============================================================================

import { NextResponse } from 'next/server';
import { sppService } from '@/lib/finance/spp-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  authorizePlatformRole,
  requirePermission,
} from '@/lib/authz/authorization-service';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';
import { sppInstallmentPlans } from '@/lib/db/schema/finance';
import { eq, and } from 'drizzle-orm';
import { getTenantContext, DEFAULT_TENANT } from '@/lib/tenant/context';
import { Permission } from '@/config/permissions';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: planId } = await context.params;

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

    // 3. RULE 15: Super Admin tanpa assignment Admin Keuangan DITOLAK
    try {
      const platformCheck = await authorizePlatformRole(user.id, 'SUPER_ADMIN');
      if (platformCheck.authorized) {
        return NextResponse.json(
          {
            success: false,
            code: 'UNAUTHORIZED_FINANCE_ROLE',
            message:
              'Akses Ditolak: Hanya Admin Keuangan tenant yang berhak memproses cicilan SPP. Super Admin platform tidak memiliki wewenang operasional tenant (Directive 15).',
          },
          { status: 403 }
        );
      }
    } catch {
      // Platform check failure defaults to strict evaluation below
    }

    // 4. Validasi Otorisasi Berbasis Database
    const authz = await requirePermission(user.id, tenant.id, Permission.REVIEW_SPP_INSTALLMENTS);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message:
            'Akses Ditolak: Hanya identitas terverifikasi dengan izin review cicilan pada tenant ini yang berwenang memproses cicilan SPP',
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      decision, // 'APPROVE' | 'REJECT'
      reviewNotes,
      customSchedules,
    } = body as Record<string, any>;

    if (!planId || !decision) {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'ID pengajuan cicilan dan keputusan (APPROVE/REJECT) wajib diisi' },
        { status: 400 }
      );
    }

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'Keputusan harus berupa APPROVE atau REJECT' },
        { status: 400 }
      );
    }

    if (decision === 'REJECT' && (!reviewNotes || !String(reviewNotes).trim())) {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'Alasan penolakan cicilan wajib diisi' },
        { status: 400 }
      );
    }

    const serverUserName = user.user_metadata?.full_name || user.email || 'Admin Keuangan';

    // 5. Anti-Self-Approval Gate & Cross-Tenant Check via withTenantTransaction
    const planRows = await withTenantTransaction(tenant.id, async (tx) => {
      return tx
        .select()
        .from(sppInstallmentPlans)
        .where(
          and(
            eq(sppInstallmentPlans.tenantId, tenant.id),
            eq(sppInstallmentPlans.id, planId)
          )
        )
        .limit(1);
    });

    const existingPlan = planRows[0];
    if (!existingPlan) {
      return NextResponse.json(
        { success: false, code: 'NOT_FOUND', message: 'Pengajuan cicilan tidak ditemukan pada tenant ini' },
        { status: 404 }
      );
    }

    // Wali dilarang menyetujui pengajuan cicilannya sendiri
    if (existingPlan.waliId === user.id) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_SELF_APPROVAL',
          message: 'Akses Ditolak: Wali santri dilarang menyetujui pengajuan cicilannya sendiri',
        },
        { status: 403 }
      );
    }

    // 6. Eksekusi Review via SppService
    const result = await sppService.reviewInstallmentPlan({
      tenantId: tenant.id,
      planId,
      decision,
      reviewedBy: user.id,
      reviewedByName: serverUserName,
      reviewedByRole: 'admin_keuangan',
      reviewNotes,
      customSchedules,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[API /api/finance/spp/installments/[id]/review POST] Internal error:', error);
    const rawMsg = error instanceof Error ? String(error) : '';
    const isForbidden = rawMsg.includes('UNAUTHORIZED_ROLE');
    const isNotFound = rawMsg.includes('PLAN_NOT_FOUND') || rawMsg.includes('BILL_NOT_FOUND');
    const isConflict =
      rawMsg.includes('INVALID_PLAN_STATUS') ||
      rawMsg.includes('SCHEDULE_SUM_MISMATCH');
    const isBadInput =
      rawMsg.includes('INVALID_DECISION') ||
      rawMsg.includes('REJECTION_REASON_REQUIRED');

    const status = isForbidden ? 403 : isNotFound ? 404 : isConflict ? 409 : isBadInput ? 400 : 500;
    const message = isForbidden
      ? 'Akses Ditolak: Peran tidak memiliki wewenang review cicilan'
      : isNotFound
      ? 'Pengajuan cicilan atau tagihan tidak ditemukan'
      : isConflict
      ? 'Status pengajuan cicilan tidak valid atau akumulasi cicilan tidak sesuai'
      : isBadInput
      ? 'Keputusan atau alasan penolakan tidak valid'
      : 'Gagal memproses review cicilan SPP';

    return NextResponse.json({ success: false, code: rawMsg.split(':')[0] || 'ERROR', message }, { status });
  }
}
