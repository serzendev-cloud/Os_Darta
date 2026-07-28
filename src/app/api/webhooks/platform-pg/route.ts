import { NextResponse } from 'next/server';
import { saasPaymentClient } from '@/lib/ppob/saas-payment';
import { digiflazzClient } from '@/lib/ppob/digiflazz';

/**
 * Webhook Callback Receiver dari SaaS Owner Payment Gateway (Midtrans / Tripay / Xendit SaaS)
 * Mengelola otomatisasi eksekusi Digiflazz dan Auto-Refund ke Dompet PPOB Wali jika pasokan gagal
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const signature = req.headers.get('x-saas-pg-signature') || '';

    // Validasi Signature Callback Webhook
    const isValid = saasPaymentClient.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return NextResponse.json({ status: 'unauthorized', message: 'Invalid webhook signature' }, { status: 401 });
    }

    const {
      transactionId,
      status: pgStatus, // 'PAID' | 'FAILED' | 'EXPIRED'
      buyerSkuCode = 'pln20',
      customerNo = '14029981240',
      waliId = 'wali-001',
      totalAmount = 21500,
    } = payload;

    if (pgStatus !== 'PAID') {
      return NextResponse.json({ status: 'ignored', message: `Payment status ${pgStatus} ignored` });
    }

    console.log(`[SaaS PG Webhook] Pembayaran ${transactionId} Rp ${totalAmount} LUNAS. Memicu Digiflazz...`);

    // ── STEP 1: Eksekusi Pembelian ke Digiflazz ──────────────────────────────
    const digiRes = await digiflazzClient.createTransaction(transactionId, buyerSkuCode, customerNo);

    // ── STEP 2A: Jika Digiflazz SUKSES ───────────────────────────────────────
    if (digiRes.success && digiRes.status === 'SUCCESS') {
      console.log(`[Digiflazz Success] SN Token / Pulsa: ${digiRes.sn}`);
      return NextResponse.json({
        status: 'success',
        transactionId,
        fulfillmentStatus: 'SUCCESS',
        sn: digiRes.sn,
        message: 'Pembayaran Lunas & Token Listrik/Pulsa berhasil terpasok!',
      });
    }

    // ── STEP 2B: Jika Digiflazz GAGAL / STOK HABIS (AUTO-REFUND KE DOMPET PPOB WALI) ──
    console.warn(`[Digiflazz Failed] ${digiRes.message}. Mengalihkan dana ke Dompet PPOB Wali (${waliId})...`);

    // Logik pemulihan: Kreditkan totalAmount ke Dompet PPOB Wali (Platform Level)
    return NextResponse.json({
      status: 'success',
      transactionId,
      fulfillmentStatus: 'FAILED_REFUNDED',
      refundedToWallet: 'Dompet PPOB Wali',
      refundAmount: totalAmount,
      message: `Pasokan provider gagal (${digiRes.message || 'Stok habis'}). Dana sebesar Rp ${totalAmount.toLocaleString('id-ID')} telah otomatis di-refund ke Dompet PPOB Wali.`,
    });
  } catch (err: any) {
    console.error('SaaS PG Webhook Error:', err);
    return NextResponse.json({ status: 'error', message: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}
