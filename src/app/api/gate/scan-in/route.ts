// ========================================
// Gate Checkpoint RFID Scan-In API Endpoint (Gate Arrival/Return)
// ========================================

export const dynamic = 'force-static';

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rfidCards, gatePasses, santri } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cardUid, tenantId = 'default' } = body;

    if (!cardUid) {
      return NextResponse.json(
        { success: false, message: 'Card UID RFID wajib diisi' },
        { status: 400 }
      );
    }

    // 1. Lookup Card
    const cardResult = await db
      .select()
      .from(rfidCards)
      .where(and(eq(rfidCards.tenantId, tenantId), eq(rfidCards.cardUid, cardUid)));

    const card = cardResult[0];
    if (!card) {
      return NextResponse.json(
        { success: false, message: 'Kartu RFID tidak terdaftar' },
        { status: 404 }
      );
    }

    // 2. Lookup Santri
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

    // 3. Lookup CHECKED_OUT Gate Pass for this Santri
    const passResult = await db
      .select()
      .from(gatePasses)
      .where(
        and(
          eq(gatePasses.tenantId, tenantId),
          eq(gatePasses.santriId, card.santriId),
          eq(gatePasses.status, 'CHECKED_OUT')
        )
      );

    const gatePass = passResult[0];
    if (!gatePass) {
      return NextResponse.json(
        {
          success: false,
          message: `Tidak ada status keluar gerbang (CHECKED_OUT) yang aktif untuk ${santriObj.name}.`,
        },
        { status: 404 }
      );
    }

    // Record exact arrival timestamp
    const now = new Date();
    const checkOut = gatePass.checkOutTime ? new Date(gatePass.checkOutTime) : now;
    
    // Calculate actual duration in minutes
    const actualDurationMinutes = Math.max(0, Math.round((now.getTime() - checkOut.getTime()) / (1000 * 60)));
    
    // Check if return time exceeds validUntil deadline
    const validUntil = new Date(gatePass.validUntil);
    const isLate = now.getTime() > validUntil.getTime();
    const finalStatus = isLate ? 'LATE' : 'COMPLETED';

    await db
      .update(gatePasses)
      .set({
        status: finalStatus,
        checkInTime: now,
        actualDurationMinutes,
        updatedAt: now,
      })
      .where(eq(gatePasses.id, gatePass.id));

    const statusMessage = isLate
      ? `Kedatangan Terlambat (Batas: ${validUntil.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`
      : 'Kedatangan Tepat Waktu';

    return NextResponse.json({
      success: true,
      message: `Presensi Kedatangan Tiba Berhasil — ${santriObj.name} (${statusMessage})`,
      data: {
        passId: gatePass.id,
        santriName: santriObj.name,
        photoUrl: santriObj.photoUrl,
        kelas: santriObj.kelas,
        jenisIzin: gatePass.jenisIzin,
        checkOutTime: checkOut.toISOString(),
        checkInTime: now.toISOString(),
        actualDurationMinutes,
        isLate,
        status: finalStatus,
        notificationSentToWali: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memproses presensi kedatangan' },
      { status: 500 }
    );
  }
}
