// ==============================================================================
// Digital CCTV & Financial Audit Timeline API Route
// Work Package: WP-M2-FINANCIAL-AUDIT-TRAIL-AND-DIGITAL-CCTV-001
// Hardening: PO-LIMITED-SECURITY-REMEDIATION-001 (Workstream B)
// Compliance: Fail-Closed Server Auth (401), Tenant Scoping & RBAC (403)
// ==============================================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canteenTransactions, santri, financialAuditLogs } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { merchantLedgerService } from '@/lib/finance/merchantLedger';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getTenantContext } from '@/lib/tenant/context';
import {
  authorizePlatformRole,
  getEffectivePermissions,
} from '@/lib/authz/authorization-service';

export async function GET(request: Request) {
  try {
    // ── 1. Fail-Closed Server-Side Authentication ────────────────────────────
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

    // Controlled test harness support
    if (!serverUserId && (process.env.NODE_ENV === 'test' || process.env.VITEST)) {
      const headerUserId = request.headers.get('x-user-id');
      if (headerUserId && headerUserId.trim() !== '') {
        serverUserId = headerUserId.trim();
      }
    }

    if (!serverUserId) {
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
    let tenantId: string;
    try {
      const tenantContext = await getTenantContext();
      tenantId = tenantContext.id;
    } catch {
      // In test harness or direct API context
      const headerTenantId = request.headers.get('x-tenant-id');
      if (headerTenantId && headerTenantId.trim() !== '') {
        tenantId = headerTenantId.trim();
      } else {
        return NextResponse.json(
          {
            success: false,
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant context tidak valid atau tidak ditemukan',
          },
          { status: 400 }
        );
      }
    }

    // ── 3. Database-Backed Role & Permission Gate (Zero-Trust) ───────────────
    let isAuthorized = false;
    let authReason = 'Akses Ditolak: Anda tidak memiliki wewenang untuk melihat rekaman audit finansial dan CCTV';

    try {
      // Check platform-level privileges first
      const platformSuper = await authorizePlatformRole(serverUserId, 'SUPER_ADMIN');
      const platformDev = await authorizePlatformRole(serverUserId, 'DEVELOPER');

      if (platformSuper.authorized || platformDev.authorized) {
        isAuthorized = true;
      } else {
        const permResult = await getEffectivePermissions(serverUserId, tenantId);
        if (permResult.authorized) {
          const roleCode = permResult.primaryRoleCode?.toUpperCase();
          // Explicitly allowed roles and permissions for financial audit / CCTV timeline
          if (
            roleCode === 'ADMIN_KEUANGAN' ||
            roleCode === 'BENDAHARA' ||
            roleCode === 'ADMIN' ||
            permResult.effectivePermissions.has('view_monitoring') ||
            permResult.effectivePermissions.has('view_governance') ||
            permResult.effectivePermissions.has('finance:review')
          ) {
            isAuthorized = true;
          } else {
            authReason = `Peran "${permResult.primaryRoleCode}" tidak memiliki wewenang untuk mengakses rekaman CCTV dan data transaksi santri.`;
          }
        } else {
          authReason = permResult.reason || authReason;
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

    // Fetch recent transactions
    const txList = await db
      .select({
        tx: canteenTransactions,
        santriPhoto: santri.photoUrl,
        santriClass: santri.kelas,
        santriNis: santri.nis,
      })
      .from(canteenTransactions)
      .leftJoin(santri, and(eq(santri.id, canteenTransactions.santriId), eq(santri.tenantId, tenantId)))
      .where(eq(canteenTransactions.tenantId, tenantId))
      .orderBy(desc(canteenTransactions.createdAt))
      .limit(limit);

    // Fetch merchant rights summary
    const merchantSummary = await merchantLedgerService.getSummary(tenantId);

    // Fetch latest financial audit logs
    const recentAuditLogs = await db
      .select()
      .from(financialAuditLogs)
      .where(eq(financialAuditLogs.tenantId, tenantId))
      .orderBy(desc(financialAuditLogs.createdAt))
      .limit(20);

    // Map transactions into Digital CCTV event timeline
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
        hasIdempotencyKey: !!tx.idempotencyKey,
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
    const msg = error instanceof Error ? error.message : 'Gagal memuat timeline audit';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
