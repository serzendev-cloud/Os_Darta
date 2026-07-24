// ========================================
// RFID Canteen POS Payment API Endpoint (Multi-Canteen & Catalog Supported)
// ========================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rfidCards, wallets, canteenTransactions, walletPockets, santri, canteens } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      cardUid,
      pin,
      amount,
      canteenId,
      vendorName: customVendorName = 'Kantin Utama',
      itemsDescription,
      posCashierId = 'POS-1',
      tenantId = 'default',
    } = body;

    if (!cardUid || !pin || !amount) {
      return NextResponse.json(
        { success: false, message: 'Card UID, PIN, dan Nominal Belanja wajib diisi' },
        { status: 400 }
      );
    }

    // Lookup Canteen details if canteenId is supplied
    let resolvedVendorName = customVendorName;
    if (canteenId) {
      const canteenResult = await db
        .select()
        .from(canteens)
        .where(and(eq(canteens.tenantId, tenantId), eq(canteens.id, canteenId)));
      if (canteenResult[0]) {
        resolvedVendorName = canteenResult[0].name;
      }
    }

    // 1. Lookup RFID Card
    const cardResult = await db
      .select()
      .from(rfidCards)
      .where(and(eq(rfidCards.tenantId, tenantId), eq(rfidCards.cardUid, cardUid)));

    const card = cardResult[0];
    if (!card) {
      return NextResponse.json(
        { success: false, message: 'Kartu RFID tidak terdaftar dalam sistem' },
        { status: 404 }
      );
    }

    if (card.status === 'blocked') {
      return NextResponse.json(
        { success: false, message: 'Transaksi Ditolak: Kartu Diblokir/Dilaporkan Hilang' },
        { status: 403 }
      );
    }

    // 2. Verify Security PIN
    if (card.hashedPin !== pin && card.hashedPin !== `pin_${pin}`) {
      return NextResponse.json(
        { success: false, message: 'Kode PIN / Sandi Santri Salah' },
        { status: 401 }
      );
    }

    // 3. Lookup Santri Profile
    const santriResult = await db
      .select()
      .from(santri)
      .where(and(eq(santri.tenantId, tenantId), eq(santri.id, card.santriId)));

    const santriObj = santriResult[0];
    if (!santriObj) {
      return NextResponse.json(
        { success: false, message: 'Data Santri tidak ditemukan' },
        { status: 404 }
      );
    }

    // 4. Lookup Wallet & Check Canteen Freeze Status
    const walletResult = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.tenantId, tenantId), eq(wallets.santriId, card.santriId)));

    const wallet = walletResult[0];
    if (!wallet) {
      return NextResponse.json(
        { success: false, message: 'Dompet Digital Santri belum dibuat' },
        { status: 404 }
      );
    }

    if (wallet.canteenStatus === 'suspended_by_walikelas') {
      return NextResponse.json(
        { success: false, message: 'Transaksi Ditolak: Fitur Belanja Kartu Dinonaktifkan Sementara oleh Wali Kelas' },
        { status: 403 }
      );
    }

    if (wallet.canteenStatus === 'suspended_by_wali') {
      return NextResponse.json(
        { success: false, message: 'Transaksi Ditolak: Fitur Belanja Dinonaktifkan oleh Wali Santri' },
        { status: 403 }
      );
    }

    if (wallet.canteenStatus === 'blocked') {
      return NextResponse.json(
        { success: false, message: 'Transaksi Ditolak: Kartu Belanja Diblokir' },
        { status: 403 }
      );
    }

    // 5. Calculate Total Spent Today across ALL canteens in this tenant (Centralized Limit Enforcement)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayTxResult = await db
      .select()
      .from(canteenTransactions)
      .where(
        and(
          eq(canteenTransactions.tenantId, tenantId),
          eq(canteenTransactions.santriId, card.santriId),
          gte(canteenTransactions.createdAt, startOfToday)
        )
      );

    const totalSpentToday = todayTxResult.reduce((sum, tx) => sum + tx.amount, 0);
    const dailyLimit = wallet.dailyLimit || 20000;

    if (totalSpentToday + amount > dailyLimit) {
      const remainingLimit = Math.max(0, dailyLimit - totalSpentToday);
      return NextResponse.json(
        {
          success: false,
          message: `Transaksi Ditolak: Kartu Mencapai Limit Belanja Harian di Seluruh Kantin (Maks Rp ${dailyLimit.toLocaleString('id-ID')}/hari). Sisa limit hari ini: Rp ${remainingLimit.toLocaleString('id-ID')}`,
        },
        { status: 400 }
      );
    }

    // 6. Check Balance Uang Saku
    if (wallet.balanceUangSaku < amount) {
      return NextResponse.json(
        {
          success: false,
          message: `Saldo Uang Saku Tidak Cukup (Saldo: Rp ${wallet.balanceUangSaku.toLocaleString('id-ID')})`,
        },
        { status: 400 }
      );
    }

    // 7. Execute Virtual Ledger Deduction
    const newBalance = wallet.balanceUangSaku - amount;

    await db
      .update(wallets)
      .set({
        balanceUangSaku: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, wallet.id));

    // Log canteen transaction
    const txId = `tx_${Date.now()}`;
    await db.insert(canteenTransactions).values({
      id: txId,
      tenantId,
      canteenId: canteenId || null,
      santriId: card.santriId,
      santriName: santriObj.name,
      cardUid,
      amount,
      itemsDescription: itemsDescription || 'Pembelian Kantin',
      vendorName: resolvedVendorName,
      posCashierId,
      status: 'SUCCESS',
    });

    // Log wallet mutation
    await db.insert(walletPockets).values({
      id: `mut_${Date.now()}_cnt`,
      tenantId,
      walletId: wallet.id,
      pocketType: 'uang_saku',
      mutationType: 'canteen_deduct',
      amount,
      balanceBefore: wallet.balanceUangSaku,
      balanceAfter: newBalance,
      description: `Belanja di ${resolvedVendorName}`,
      referenceId: txId,
    });

    const newSpentToday = totalSpentToday + amount;
    const remainingLimit = Math.max(0, dailyLimit - newSpentToday);

    return NextResponse.json({
      success: true,
      message: 'Pembayaran Kantin Berhasil',
      data: {
        transactionId: txId,
        santriName: santriObj.name,
        photoUrl: santriObj.photoUrl,
        kelas: santriObj.kelas,
        amountDeducted: amount,
        remainingBalanceUangSaku: newBalance,
        totalSpentToday: newSpentToday,
        dailyLimit,
        remainingDailyLimit: remainingLimit,
        vendorName: resolvedVendorName,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memproses pembayaran kantin' },
      { status: 500 }
    );
  }
}
