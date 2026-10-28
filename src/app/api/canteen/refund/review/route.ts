// ==============================================================================
// Canteen Refund Review API Route (Admin Keuangan Server-Side Role Enforcement)
// Work Package: WP-SEC-CANTEEN-001 (Hardened Auth & Strict Tenancy)
// Compliance: Fail-Closed Server Auth (401), Anti-SuperAdmin Bypass (Dir 15), Anti-SelfApproval (403)
// ==============================================================================

import { NextResponse } from 'next/server';
import { refundService } from '@/lib/finance/refund';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  authorizePlatformRole,
  requirePermission,
} from '@/lib/authz/authorization-service';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';
import { canteenRefunds } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTenantContext, DEFAULT_TENANT } from '@/lib/tenant/context';
import { Permission } from '@/config/permissions';

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

    // 3. Directive 15: Super Admin Platform Ditolak dari Review Operasional Refund
    try {
      const platformCheck = await authorizePlatformRole(user.id, 'SUPER_ADMIN');
      if (platformCheck.authorized) {
        return NextResponse.json(
          {
            success: false,
            code: 'UNAUTHORIZED_REFUND_ROLE',
            message:
              'Akses Ditolak: Hanya Admin Keuangan yang berhak memproses refund pada Tahap 1. Super Admin platform tidak memiliki wewenang operasional kasir.',
          },
          { status: 403 }
        );
      }
    } catch {
      // Platform check failure defaults to strict evaluation below
    }

    // 4. Validasi Otorisasi Berbasis Database (Canonical Permission)
    const authz = await requirePermission(user.id, tenant.id, Permission.REVIEW_CANTEEN_REFUND);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHORIZED_REFUND_ROLE',
          message:
            'Akses Ditolak: Hanya identitas terverifikasi dengan izin tinjau refund yang berwenang memproses persetujuan/penolakan refund',
        },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const refundId = typeof body.refundId === 'string' ? body.refundId : undefined;
    const decision = typeof body.decision === 'string' ? body.decision : undefined;
    const reviewNotes = typeof body.reviewNotes === 'string' ? body.reviewNotes : undefined;

    if (!refundId || !decision) {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'ID refund dan keputusan (APPROVE/REJECT) wajib diisi' },
        { status: 400 }
      );
    }

    if (decision !== 'APPROVE' && decision !== 'REJECT') {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'Keputusan harus berupa APPROVE atau REJECT' },
        { status: 400 }
      );
    }

    // 5. Anti-Self-Approval Gate & Cross-Tenant Check via withTenantTransaction
    const refundRows = await withTenantTransaction(tenant.id, async (tx) => {
      return tx
        .select()
        .from(canteenRefunds)
        .where(
          and(
            eq(canteenRefunds.tenantId, tenant.id),
            eq(canteenRefunds.id, refundId)
          )
        )
        .limit(1);
    });

    const existingRefund = refundRows[0];
    if (!existingRefund) {
      return NextResponse.json(
        {
          success: false,
          code: 'REFUND_NOT_FOUND',
          message: 'Data pengajuan refund tidak ditemukan pada tenant ini',
        },
        { status: 404 }
      );
    }

    // Pengaju refund dilarang menyetujui pengajuannya sendiri
    if (existingRefund.requestedBy === user.id) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_SELF_APPROVAL',
          message: 'Akses Ditolak: Pengaju refund dilarang menyetujui atau menolak permohonan refund miliknya sendiri',
        },
        { status: 403 }
      );
    }

    const serverUserName =
      (user.user_metadata?.full_name as string) || user.email || 'Admin Keuangan';

    const result = await refundService.reviewRefund({
      tenantId: tenant.id,
      refundId,
      decision,
      reviewedBy: user.id,
      reviewedByName: serverUserName,
      reviewedByRole: 'admin_keuangan',
      reviewNotes,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[API /api/canteen/refund/review POST] Internal error:', error);
    const rawMsg = error instanceof Error ? String(error) : '';
    const isForbidden = rawMsg.startsWith('UNAUTHORIZED_ROLE');
    const isNotFound = rawMsg.startsWith('REFUND_NOT_FOUND') || rawMsg.startsWith('TRANSACTION_NOT_FOUND');
    const isConflict =
      rawMsg.startsWith('INVALID_REFUND_STATUS') ||
      rawMsg.startsWith('CUMULATIVE_LIMIT_EXCEEDED');

    const status = isForbidden ? 403 : isNotFound ? 404 : isConflict ? 409 : 500;
    const message = isForbidden
      ? 'Akses Ditolak: Hanya Admin Keuangan yang berwenang memproses persetujuan refund'
      : isNotFound
      ? 'Data pengajuan refund atau transaksi tidak ditemukan'
      : isConflict
      ? 'Status pengajuan refund tidak valid atau limit pengembalian terlampaui'
      : 'Gagal memproses review refund';

    return NextResponse.json(
      { success: false, code: rawMsg.split(':')[0] || 'ERROR', message },
      { status }
    );
  }
}
