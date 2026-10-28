// ==============================================================================
// Digital CCTV & Financial Audit Timeline API Route
// Work Package: WP-SEC-CANTEEN-001 (Hardened Auth & Strict Tenancy)
// Compliance: Fail-Closed Server Auth (401), Tenant Scoping (400), Canonical RBAC (403)
// ==============================================================================

import { NextResponse } from 'next/server';
import { canteenTransactions, santri, financialAuditLogs } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { merchantLedgerService } from '@/lib/finance/merchantLedger';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getTenantContext, DEFAULT_TENANT } from '@/lib/tenant/context';
import {
  authorizePlatformRole,
  requirePermission,
} from '@/lib/authz/authorization-service';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';
import { Permission } from '@/config/permissions';

export async function GET(request: Request) {
  try {
    // ── 1. Fail-Closed Server-Side Authentication ────────────────────────────
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

    // ── 2. Verified Tenant Context Resolution ────────────────────────────────
    let tenant: { id: string };
    try {
      const tenantCtx = await getTenantContext();
      if (!tenantCtx?.id || tenantCtx.id.trim() === '' || tenantCtx.id === DEFAULT_TENANT.id) {
        return NextResponse.json(
          {
            success: false,
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant context tidak valid atau tidak ditemukan',
          },
          { status: 400 }
        );
      }
      tenant = tenantCtx;
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: 'TENANT_NOT_FOUND',
          message: 'Tenant context tidak valid atau tidak ditemukan',
        },
        { status: 400 }
      );
    }

    // ── 3. Database-Backed Role & Canonical Permission Gate ──────────────────
    let isAuthorized = false;
    let authReason = 'Akses Ditolak: Anda tidak memiliki wewenang untuk melihat rekaman audit finansial dan CCTV';

    try {
      const platformSuper = await authorizePlatformRole(user.id, 'SUPER_ADMIN');
      const platformDev = await authorizePlatformRole(user.id, 'DEVELOPER');

      if (platformSuper.authorized || platformDev.authorized) {
        isAuthorized = true;
      } else {
        const authz = await requirePermission(user.id, tenant.id, Permission.VIEW_FINANCE_AUDIT_CCTV);
        if (authz.authorized) {
          isAuthorized = true;
        } else {
          authReason = 'Akses Ditolak: Peran Anda tidak memiliki wewenang untuk mengakses rekaman CCTV dan audit finansial';
        }
      }
    } catch {
      isAuthorized = false;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: authReason,
        },
        { status: 403 }
      );
    }

    // ── 4. Scoped Data Retrieval (Restricted to Authorized Tenant) ───────────
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 30, 1), 100);

    const { txList, recentAuditLogs } = await withTenantTransaction(tenant.id, async (tx) => {
      const transactions = await tx
        .select({
          tx: canteenTransactions,
          santriPhoto: santri.photoUrl,
          santriClass: santri.kelas,
          santriNis: santri.nis,
        })
        .from(canteenTransactions)
        .leftJoin(santri, and(eq(santri.id, canteenTransactions.santriId), eq(santri.tenantId, tenant.id)))
        .where(eq(canteenTransactions.tenantId, tenant.id))
        .orderBy(desc(canteenTransactions.createdAt))
        .limit(limit);

      const auditLogs = await tx
        .select()
        .from(financialAuditLogs)
        .where(eq(financialAuditLogs.tenantId, tenant.id))
        .orderBy(desc(financialAuditLogs.createdAt))
        .limit(20);

      return { txList: transactions, recentAuditLogs: auditLogs };
    });

    const merchantSummary = await merchantLedgerService.getSummary(tenant.id);

    const timelineEvents = txList.map(({ tx, santriPhoto, santriClass, santriNis }) => ({
      id: tx.id,
      timestamp: tx.createdAt,
      amount: tx.amount,
      status: tx.status,
      vendorName: tx.vendorName,
      canteenId: tx.canteenId,
      itemsDescription: tx.itemsDescription,
      posCashierId: tx.posCashierId || 'POS-1',
      cardUid: tx.cardUid,
      santri: {
        id: tx.santriId,
        name: tx.santriName,
        nis: santriNis || '-',
        kelas: santriClass || 'Reguler',
        photoUrl: santriPhoto || null,
      },
      audit: {
        correlationId: tx.idempotencyKey || tx.id,
        hasIdempotencyKey: !tx.idempotencyKey,
      },
      cctv: {
        isAvailable: false,
        cameraChannel: 'CAM-POS-01 (Kantin)',
        status: 'STANDBY_OPTIONAL',
        note: 'Integrasi kamera CCTV fisik merupakan fitur opsional per PO Keputusan 10',
      },
    }));

    return NextResponse.json({
      success: true,
      data: {
        timelineEvents,
        merchantSummary,
        recentAuditLogs,
      },
    });
  } catch (error: unknown) {
    console.error('[API /api/finance/audit-cctv/timeline GET] Internal error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memuat timeline audit' },
      { status: 500 }
    );
  }
}
