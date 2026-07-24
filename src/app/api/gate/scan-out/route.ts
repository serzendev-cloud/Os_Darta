// ========================================
// Gate Checkpoint RFID Scan-Out API Endpoint (Gate Exit)
// ========================================

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

    // 3. Lookup Approved Gate Pass for this Santri
    const passResult = await db
      .select()
      .from(gatePasses)
      .where(
        and(
          eq(gatePasses.tenantId, tenantId),
          eq(gatePasses.santriId, card.santriId),
          eq(gatePasses.status, 'APPROVED')
        )
      );

    const gatePass = passResult[0];
    if (!gatePass) {
      return NextResponse.json(
        {
          success: false,
          message: `Tidak ada Surat Izin Keluar yang aktif/disetujui untuk ${santriObj.name}. Harap hubungi Musyrif.`,
        },
        { status: 403 }
      );
    }

    // Record exact departure timestamp
    const now = new Date();
    await db
      .update(gatePasses)
      .set({
        status: 'CHECKED_OUT',
        checkOutTime: now,
        updatedAt: now,
      })
      .where(eq(gatePasses.id, gatePass.id));

    return NextResponse.json({
      success: true,
      message: `Presensi Keluar Gerbang Berhasil — ${santriObj.name}`,
      data: {
        passId: gatePass.id,
        santriName: santriObj.name,
        photoUrl: santriObj.photoUrl,
        kelas: santriObj.kelas,
        jenisIzin: gatePass.jenisIzin,
        checkOutTime: now.toISOString(),
        validUntil: gatePass.validUntil,
        notificationSentToWali: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal memproses presensi keluar' },
      { status: 500 }
    );
  }
}
