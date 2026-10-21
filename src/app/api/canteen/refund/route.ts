// ==============================================================================
// Canteen Refund API Route (List & Request)
// Work Package: WP-M2-FINANCIAL-AUDIT-TRAIL-AND-DIGITAL-CCTV-001
// Compliance: PO Decisions 7, 8
// ==============================================================================

import { NextResponse } from 'next/server';
import { refundService } from '@/lib/finance/refund';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = request.headers.get('x-tenant-id') || searchParams.get('tenantId') || 'default';
    const status = searchParams.get('status') || undefined;
    const canteenId = searchParams.get('canteenId') || undefined;

    const data = await refundService.listRefunds({ tenantId, status, canteenId });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengambil data refund';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const headerTenantId = request.headers.get('x-tenant-id');
    const body = await request.json();
    const {
      tenantId: bodyTenantId,
      transactionId,
      refundAmount,
      reason,
      requestedBy = 'pic_kantin_1',
      requestedByName = 'PIC Kantin',
      requestedByRole = 'pic_kantin',
    } = body;

    const tenantId = (headerTenantId || bodyTenantId || 'default').trim();

    if (!transactionId || !reason) {
      return NextResponse.json(
        { success: false, message: 'ID transaksi dan alasan refund wajib diisi' },
        { status: 400 }
      );
    }

    const result = await refundService.requestRefund({
      tenantId,
      transactionId,
      refundAmount: refundAmount ? Number(refundAmount) : undefined,
      reason,
      requestedBy,
      requestedByName,
      requestedByRole,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal mengajukan refund';
    const isClientErr =
      msg.startsWith('TRANSACTION_NOT_FOUND') ||
      msg.startsWith('INVALID_TRANSACTION_STATUS') ||
      msg.startsWith('ALREADY_FULLY_REFUNDED') ||
      msg.startsWith('EXCEEDS_REFUNDABLE_AMOUNT') ||
      msg.includes('wajib diisi') ||
      msg.includes('positif');

    return NextResponse.json(
      { success: false, message: msg },
      { status: isClientErr ? 400 : 500 }
    );
  }
}
