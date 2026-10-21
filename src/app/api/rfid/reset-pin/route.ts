import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rfidCards, santri } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { deriveNewPinCredential, validatePinFormat } from '@/lib/security/pinCrypto';

/**
 * POST /api/rfid/reset-pin
 * 
 * Strict RBAC Otorisasi Reset PIN (PO-LOCK-05 & PO-LOCK-06):
 * - Wali Kelas: Hanya dapat mereset PIN santri di kelas binaannya.
 * - Admin Keuangan: Berwenang mereset PIN seluruh santri di tenant yang sama.
 * - Wali Santri: Ditolak mutlak (HTTP 403).
 * - Super Admin: Ditolak (HTTP 403) tanpa mandat PO terpisah.
 * 
 * Atomisitas Unblock:
 * - Reset PIN otomatis mengosongkan pin_failed_attempts = 0 dan status = 'active'.
 */
export async function POST(request: Request) {
  try {
    const headerTenantId = request.headers.get('x-tenant-id');
    const headerRole = request.headers.get('x-user-role');
    const headerUserId = request.headers.get('x-user-id');

    const body = await request.json();
    const {
      cardUid,
      santriId,
      newPin,
      tenantId: bodyTenantId,
      operatorRole: bodyRole, // 'wali_kelas' | 'admin_keuangan' | 'wali_santri' | 'super_admin'
      operatorUserId: bodyUserId,
      operatorKelasBinaan, // misal 'X-A' jika operatorRole === 'wali_kelas'
    } = body;

    const tenantId = (headerTenantId || bodyTenantId || 'default').trim();
    const operatorRole = (headerRole || bodyRole || '').toLowerCase().trim();
    const operatorUserId = headerUserId || bodyUserId || 'SYSTEM_OPERATOR';

    // 1. Validasi Input Dasar
    if ((!cardUid && !santriId) || !newPin) {
      return NextResponse.json(
        { success: false, message: 'Card UID atau Santri ID serta PIN baru 6-digit wajib diisi' },
        { status: 400 }
      );
    }

    if (!validatePinFormat(newPin)) {
      return NextResponse.json(
        { success: false, message: 'Format PIN tidak valid: PIN harus tepat 6 digit numerik' },
        { status: 400 }
      );
    }

    // 2. Evaluasi Otorisasi Peran (PO-LOCK-05)
    if (operatorRole === 'wali_santri') {
      return NextResponse.json(
        { 
          success: false, 
          code: 'FORBIDDEN_WALI_SANTRI',
          message: 'Wali Santri dilarang keras mereset PIN fisik RFID santri (Aturan PO-LOCK-05)' 
        },
        { status: 403 }
      );
    }

    if (operatorRole === 'super_admin') {
      return NextResponse.json(
        { 
          success: false, 
          code: 'FORBIDDEN_SUPER_ADMIN',
          message: 'Super Admin tidak berwenang mereset PIN santri tanpa mandat khusus PO (Aturan PO-LOCK-05)' 
        },
        { status: 403 }
      );
    }

    if (operatorRole !== 'wali_kelas' && operatorRole !== 'admin_keuangan') {
      return NextResponse.json(
        { 
          success: false, 
          code: 'UNAUTHORIZED_ROLE',
          message: 'Hanya Wali Kelas binaan atau Admin Keuangan yang berwenang mereset PIN santri' 
        },
        { status: 403 }
      );
    }

    // 3. Lookup Kartu RFID
    let whereClause = eq(rfidCards.tenantId, tenantId);
    if (cardUid) {
      whereClause = and(whereClause, eq(rfidCards.cardUid, cardUid)) as any;
    } else if (santriId) {
      whereClause = and(whereClause, eq(rfidCards.santriId, santriId)) as any;
    }

    const cardResult = await db.select().from(rfidCards).where(whereClause);
    const card = cardResult[0];

    if (!card) {
      return NextResponse.json(
        { success: false, message: 'Kartu RFID santri tidak ditemukan' },
        { status: 404 }
      );
    }

    // 4. Lookup Profil Santri untuk Verifikasi Kelas Binaan
    const santriResult = await db
      .select()
      .from(santri)
      .where(and(eq(santri.tenantId, tenantId), eq(santri.id, card.santriId)));
    
    const santriObj = santriResult[0];
    if (!santriObj) {
      return NextResponse.json(
        { success: false, message: 'Data santri terkait tidak ditemukan' },
        { status: 404 }
      );
    }

    // Jika operator adalah Wali Kelas, verifikasi bahwa santri berada di kelas binaannya
    if (operatorRole === 'wali_kelas') {
      if (!operatorKelasBinaan || santriObj.kelas !== operatorKelasBinaan) {
        return NextResponse.json(
          {
            success: false,
            code: 'FORBIDDEN_NOT_YOUR_CLASS',
            message: `Wali Kelas hanya berwenang mereset PIN santri di kelas binaannya sendiri (Santri di kelas ${santriObj.kelas || 'belum terdaftar'}, operator membina ${operatorKelasBinaan || 'tidak ada'})`,
          },
          { status: 403 }
        );
      }
    }

    // 5. Derivasi Kredensial KDF Baru
    const credential = deriveNewPinCredential(newPin);

    // 6. Eksekusi Reset PIN & Unblock Atomik (PO-LOCK-06)
    // Update hashed_pin dan status menjadi active
    await db
      .update(rfidCards)
      .set({
        hashedPin: credential.hashedPin,
        salt: credential.salt,
        kdfVersion: credential.kdfVersion,
        pepperVersion: credential.pepperVersion,
        iterations: credential.iterations,
        pinFailedAttempts: 0,
        status: 'active',
        lockedUntil: null,
        lastPinResetAt: new Date(),
        lastPinResetBy: operatorUserId || operatorRole,
        updatedAt: new Date(),
      })
      .where(eq(rfidCards.id, card.id));

    return NextResponse.json({
      success: true,
      code: 'PIN_RESET_SUCCESS',
      message: 'PIN Kartu RFID Santri Berhasil Direset dan Status Kartu Otomatis Aktif',
      data: {
        cardUid: card.cardUid,
        santriId: card.santriId,
        santriName: santriObj.name,
        kelas: santriObj.kelas,
        status: 'active',
        kdfVersion: credential.kdfVersion,
        pepperVersion: credential.pepperVersion,
        resetBy: operatorUserId || operatorRole,
        resetAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal mereset PIN kartu RFID' },
      { status: 500 }
    );
  }
}
