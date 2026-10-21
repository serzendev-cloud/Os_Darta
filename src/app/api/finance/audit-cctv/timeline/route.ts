// ==============================================================================
// Digital CCTV & Financial Audit Timeline API Route
// Work Package: WP-M2-FINANCIAL-AUDIT-TRAIL-AND-DIGITAL-CCTV-001
// Compliance: PO Decisions 4, 6, 8, 9, 10
// ==============================================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canteenTransactions, santri, financialAuditLogs } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { merchantLedgerService } from '@/lib/finance/merchantLedger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = request.headers.get('x-tenant-id') || searchParams.get('tenantId') || 'default';
    const limit = Number(searchParams.get('limit')) || 30;

    // 1. Fetch recent transactions
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

    // 2. Fetch merchant rights summary
    const merchantSummary = await merchantLedgerService.getSummary(tenantId);

    // 3. Fetch latest financial audit logs
    const recentAuditLogs = await db
      .select()
      .from(financialAuditLogs)
      .where(eq(financialAuditLogs.tenantId, tenantId))
      .orderBy(desc(financialAuditLogs.createdAt))
      .limit(20);

    // 4. Map transactions into Digital CCTV event timeline
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
      // Digital CCTV visual capture metadata (Decision 10: optional add-on)
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
