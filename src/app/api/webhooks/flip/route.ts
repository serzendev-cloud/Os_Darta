// ========================================
// Flip for Business Webhook Listener Route
// Hardened: WP-SEC-FINAL-001 (Timing-Safe Token Verification & Fail-Closed)
// ========================================

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { invoices, wallets, walletPockets, tenantSettings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Constant-time comparison between received token and expected secret token
 * to prevent timing attacks.
 */
function safeCompareTokens(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    let rawBody: string;
    let payload: any;
    try {
      rawBody = await request.text();
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'Format payload webhook tidak valid' },
        { status: 400 }
      );
    }

    const paymentData = payload?.data || payload || {};
    const billId = paymentData.bill_link_id || paymentData.link_id || paymentData.id;

    // 1. Extract received token from request headers or body
    const receivedToken =
      request.headers.get('x-flip-token') ||
      request.headers.get('token') ||
      request.headers.get('x-validation-token') ||
      (typeof payload?.token === 'string' ? payload.token : null) ||
      (typeof paymentData?.token === 'string' ? paymentData.token : null);

    if (!receivedToken || receivedToken.trim() === '') {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', message: 'Token validasi webhook Flip tidak ditemukan' },
        { status: 401 }
      );
    }

    // 2. Resolve expected verification secret (Platform ENV or Tenant Settings)
    let expectedToken = process.env.FLIP_VALIDATION_TOKEN?.trim() || null;

    let invoice: any = null;
    if (billId) {
      const invoiceResult = await db
        .select()
        .from(invoices)
        .where(eq(invoices.flipBillId, String(billId)));
      invoice = invoiceResult[0] || null;
    }

    if (!expectedToken && invoice?.tenantId) {
      const settingsResult = await db
        .select({ token: tenantSettings.flipValidationToken })
        .from(tenantSettings)
        .where(eq(tenantSettings.tenantId, invoice.tenantId));
      expectedToken = settingsResult[0]?.token?.trim() || null;
    }

    // 3. Fail-Closed: Jika rahasia verifikasi tidak terkonfigurasi, tolak semua permintaan
    if (!expectedToken) {
      console.error('[Flip Webhook] Rahasia verifikasi Flip tidak terkonfigurasi (Fail-Closed)');
      return NextResponse.json(
        { success: false, code: 'SERVICE_UNAVAILABLE', message: 'Layanan webhook belum dikonfigurasi' },
        { status: 503 }
      );
    }

    // 4. Timing-safe constant-time verification
    if (!safeCompareTokens(receivedToken.trim(), expectedToken)) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED', message: 'Token validasi webhook Flip tidak cocok' },
        { status: 401 }
      );
    }

    // 5. Verification passed — Process business mutation
    const status = paymentData.status;
    if (status !== 'SUCCESS') {
      return NextResponse.json({ status: 'ignored', message: 'Payment status not SUCCESS' });
    }

    if (!invoice) {
      return NextResponse.json({ status: 'error', message: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'SUCCESS') {
      return NextResponse.json({ status: 'ok', message: 'Invoice already processed' });
    }

    // Update invoice status to SUCCESS
    await db
      .update(invoices)
      .set({
        status: 'SUCCESS',
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoice.id));

    // Find or create wallet for santri
    const walletResult = await db
      .select()
      .from(wallets)
      .where(
        and(
          eq(wallets.tenantId, invoice.tenantId),
          eq(wallets.santriId, invoice.santriId)
        )
      );

    let wallet = walletResult[0];

    if (!wallet) {
      const inserted = await db
        .insert(wallets)
        .values({
          id: `w_${Date.now()}`,
          tenantId: invoice.tenantId,
          waliId: invoice.waliId,
          santriId: invoice.santriId,
          balanceUangSaku: 0,
          balanceTabungan: 0,
          dailyLimit: 20000,
          canteenStatus: 'active',
        })
        .returning();
      wallet = inserted[0];
    }

    // Update balances
    const newUangSaku = wallet.balanceUangSaku + (invoice.amountUangSaku || 0);
    const newTabungan = wallet.balanceTabungan + (invoice.amountTabungan || 0);

    await db
      .update(wallets)
      .set({
        balanceUangSaku: newUangSaku,
        balanceTabungan: newTabungan,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id));

    // Log mutations in walletPockets
    if (invoice.amountUangSaku > 0) {
      await db.insert(walletPockets).values({
        id: `mut_${Date.now()}_us`,
        tenantId: invoice.tenantId,
        walletId: wallet.id,
        pocketType: 'uang_saku',
        mutationType: 'topup',
        amount: invoice.amountUangSaku,
        balanceBefore: wallet.balanceUangSaku,
        balanceAfter: newUangSaku,
        description: `Top-Up Uang Saku via Flip Invoice #${invoice.invoiceNumber}`,
        referenceId: invoice.id,
      });
    }

    if (invoice.amountTabungan > 0) {
      await db.insert(walletPockets).values({
        id: `mut_${Date.now()}_tb`,
        tenantId: invoice.tenantId,
        walletId: wallet.id,
        pocketType: 'tabungan',
        mutationType: 'topup',
        amount: invoice.amountTabungan,
        balanceBefore: wallet.balanceTabungan,
        balanceAfter: newTabungan,
        description: `Top-Up Tabungan via Flip Invoice #${invoice.invoiceNumber}`,
        referenceId: invoice.id,
      });
    }

    return NextResponse.json({ status: 'success', message: 'Payment processed and wallet updated successfully' });
  } catch (error: unknown) {
    console.error('[Flip Webhook] Error processing payment callback:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: 'Gagal memproses webhook pembayaran' },
      { status: 500 }
    );
  }
}
