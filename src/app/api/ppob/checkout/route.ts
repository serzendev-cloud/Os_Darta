import { NextResponse } from 'next/server';
import { digiflazzClient } from '@/lib/ppob/digiflazz';
import { saasPaymentClient } from '@/lib/ppob/saas-payment';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      tenantId = 'default',
      waliId = 'wali-001',
      waliName = 'Wali Santri Utama',
      waliPhone = '081234567890',
      santriId = 'santri-001',
      categoryCode,
      buyerSkuCode,
      productName,
      customerNo,
      customerName,
      amountBase,
      feeSaas = 1500,
      totalAmount,
      paymentMethod = 'QRIS_SAAS', // 'QRIS_SAAS' | 'SALDO_PPOB'
      walletBalanceCurrent = 0,
    } = body;

    if (!buyerSkuCode || !customerNo || !totalAmount) {
      return NextResponse.json(
        { success: false, message: 'Data checkout PPOB tidak lengkap' },
        { status: 400 }
      );
    }

    const txId = `PPOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // ── CASE A: Pembayaran Menggunakan Saldo Dompet PPOB Wali ─────────────────
    if (paymentMethod === 'SALDO_PPOB') {
      if (walletBalanceCurrent < totalAmount) {
        return NextResponse.json(
          {
            success: false,
            message: `Saldo Dompet PPOB tidak mencukupi (Saldo: Rp ${walletBalanceCurrent.toLocaleString('id-ID')}, Tagihan: Rp ${totalAmount.toLocaleString('id-ID')})`,
          },
          { status: 400 }
        );
      }

      // Potong Saldo PPOB & Eksekusi Pembelian ke Digiflazz
      const digiRes = await digiflazzClient.createTransaction(txId, buyerSkuCode, customerNo);

      if (digiRes.success && digiRes.status === 'SUCCESS') {
        const newBalance = walletBalanceCurrent - totalAmount;
        return NextResponse.json({
          success: true,
          status: 'SUCCESS',
          transactionId: txId,
          paymentMethod: 'SALDO_PPOB',
          sn: digiRes.sn,
          newBalance,
          message: 'Pembelian PPOB via Saldo PPOB berhasil!',
        });
      } else {
        // Jika Digiflazz Gagal saat bayar via Saldo PPOB, saldo TIDAK dipotong / Otomatis kembali
        return NextResponse.json({
          success: false,
          status: 'FAILED_REFUNDED',
          transactionId: txId,
          paymentMethod: 'SALDO_PPOB',
          newBalance: walletBalanceCurrent, // Balance utuh
          message: `Pembelian ke Digiflazz gagal (${digiRes.message || 'Stok habis'}). Saldo Dompet PPOB Anda utuh.`,
        });
      }
    }

    // ── CASE B: Pembayaran Menggunakan Dynamic QRIS (Payment Gateway SaaS) ───
    const saasPgRes = await saasPaymentClient.createInvoice({
      transactionId: txId,
      amount: totalAmount,
      productName,
      customerName: waliName,
      customerPhone: waliPhone,
    });

    if (!saasPgRes.success) {
      return NextResponse.json(
        { success: false, message: 'Gagal membuat QRIS Pembayaran SaaS PG' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: 'PENDING_PAYMENT',
      transactionId: txId,
      paymentMethod: 'QRIS_SAAS',
      qrCodeUrl: saasPgRes.qrCodeUrl,
      paymentUrl: saasPgRes.paymentUrl,
      expiresAt: saasPgRes.expiresAt,
      totalAmount,
      productName,
      customerNo,
      customerName,
      message: 'QRIS Pembayaran berhasil dibuat, silakan scan untuk menyelesaikan transaksi.',
    });
  } catch (err: any) {
    console.error('API PPOB Checkout Error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memproses checkout PPOB' },
      { status: 500 }
    );
  }
}
