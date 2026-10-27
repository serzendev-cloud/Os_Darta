// ==============================================================================
// Finance SPP Installments Review Route (Admin Keuangan Approval & Rejection)
// Work Package: WP-FINANCE-AUTH-HARDENING-002 (Wave 2)
// Directives: PO-EXEC-FINANCE-AUTH-HARDENING-WAVE-2-001
// Compliance: Fail-Closed Server Auth (401), Anti-SuperAdmin Bypass (Dir 15), Anti-SelfApproval (403)
// ==============================================================================

import { NextResponse } from 'next/server';
import { sppService } from '@/lib/finance/spp-service';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  authorizePlatformRole,
  getEffectivePermissions,
} from '@/lib/authz/authorization-service';
import { db } from '@/lib/db';
import { sppInstallmentPlans } from '@/lib/db/schema/finance';
import { eq, and } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: planId } = await context.params;
    const headerTenantId = request.headers.get('x-tenant-id');
    const body = await request.json();
    const {
      decision, // 'APPROVE' | 'REJECT'
      reviewNotes,
      customSchedules,
    } = body;

    const tenantId = (headerTenantId || body.tenantId || 'default').trim();

    if (!planId || !decision) {
      return NextResponse.json(
        { success: false, message: 'ID pengajuan cicilan dan keputusan (APPROVE/REJECT) wajib diisi' },
        { status: 400 }
      );
    }

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      return NextResponse.json(
        { success: false, message: 'Keputusan harus berupa APPROVE atau REJECT' },
        { status: 400 }
      );
    }

    if (decision === 'REJECT' && (!reviewNotes || !reviewNotes.trim())) {
      return NextResponse.json(
        { success: false, message: 'Alasan penolakan cicilan wajib diisi' },
        { status: 400 }
      );
    }

    // ── Zero-Trust Server-Side Role Binding & Enforcement ─────────────────────
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

    // 2. RULE 15: Super Admin without tenant Admin Keuangan assignment is REJECTED
    try {
      const platformCheck = await authorizePlatformRole(serverUserId, 'SUPER_ADMIN');
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

    // 3. Resolve Tenant Primary Role & Permissions in DB (Fail-Closed, Zero Header Fallback)
    let isAuthorized = false;
    try {
      const permResult = await getEffectivePermissions(serverUserId, tenantId);
      if (
        permResult.authorized &&
        (permResult.primaryRoleCode === 'ADMIN_KEUANGAN' ||
          permResult.primaryRoleCode === 'BENDAHARA' ||
          permResult.effectivePermissions.has('finance:review'))
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
          message:
            'Akses Ditolak: Hanya identitas terverifikasi dengan role Admin Keuangan pada tenant ini yang berwenang menyetujui atau menolak cicilan SPP',
        },
        { status: 403 }
      );
    }

    const serverUserRole = 'admin_keuangan' as const;

    // 4. Anti-Self-Approval Gate & Cross-Tenant Check
    const planRows = await db
      .select()
      .from(sppInstallmentPlans)
      .where(
        and(
          eq(sppInstallmentPlans.tenantId, tenantId),
          eq(sppInstallmentPlans.id, planId)
        )
      )
      .limit(1);

    const existingPlan = planRows[0];
    if (!existingPlan) {
      return NextResponse.json(
        { success: false, message: 'Pengajuan cicilan tidak ditemukan pada tenant ini' },
        { status: 404 }
      );
    }

    // Wali cannot approve their own application
    if (existingPlan.waliId === serverUserId) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_SELF_APPROVAL',
          message: 'Akses Ditolak: Wali santri dilarang menyetujui pengajuan cicilannya sendiri',
        },
        { status: 403 }
      );
    }

    // 5. Execute Review via SppService
    const result = await sppService.reviewInstallmentPlan({
      tenantId,
      planId,
      decision,
      reviewedBy: serverUserId,
      reviewedByName: serverUserName,
      reviewedByRole: serverUserRole,
      reviewNotes,
      customSchedules,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal memproses review cicilan SPP';
    const isForbidden = msg.startsWith('UNAUTHORIZED_ROLE');
    const isNotFound = msg.startsWith('PLAN_NOT_FOUND') || msg.startsWith('BILL_NOT_FOUND');
    const isConflict =
      msg.startsWith('INVALID_PLAN_STATUS') ||
      msg.startsWith('SCHEDULE_SUM_MISMATCH');
    const isBadInput =
      msg.startsWith('INVALID_DECISION') ||
      msg.startsWith('REJECTION_REASON_REQUIRED');

    const status = isForbidden ? 403 : isNotFound ? 404 : isConflict ? 409 : isBadInput ? 400 : 500;
    return NextResponse.json({ success: false, message: msg }, { status });
  }
}

