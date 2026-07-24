// ========================================
// Flip for Business Webhook Listener Route
// ========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices, wallets, walletPockets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { flipClient } from '@/lib/payment/flip';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    // Payload structure from Flip Payment Received Callback
    // { data: { id, bill_link_id, status: "SUCCESS", amount: 1500000, ... } }
    const paymentData = payload.data || payload;
    const billId = paymentData.bill_link_id || paymentData.link_id || paymentData.id;
    const status = paymentData.status;

    if (status !== 'SUCCESS') {
      return NextResponse.json({ status: 'ignored', message: 'Payment status not SUCCESS' });
    }

    // Find invoice by flipBillId or invoiceNumber
    const invoiceResult = await db
      .select()
      .from(invoices)
      .where(eq(invoices.flipBillId, String(billId)));

    const invoice = invoiceResult[0];
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
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error?.message || 'Server error' }, { status: 500 });
  }
}
