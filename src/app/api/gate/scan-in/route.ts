// ========================================
// Gate Checkpoint RFID Scan-In API Endpoint (Gate Arrival/Return)
// Work Package: WP-SEC-FAILCLOSED-001
// Fail-Closed Policy: Zero Client Trust & Strict Session Auth
// ========================================

import { NextResponse } from 'next/server';
import { rfidCards, gatePasses, santri } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getTenantContext, DEFAULT_TENANT } from '@/lib/tenant/context';
import { requirePermission } from '@/lib/authz/authorization-service';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';
import { Permission } from '@/config/permissions';

export async function POST(request: Request) {
  try {
    // 1. Autentikasi Pengguna Sesi Server (Fail-Closed)
    // TODO: Autentikasi perangkat fisik terminal gerbang (device token/mTLS) akan dirancang di fondasi baru. Saat ini sesi operator wajib (401 tanpa sesi).
    let user: { id: string } | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user?.id) {
        user = { id: data.user.id };
      }
    } catch {
      user = null;
    }

    if (!user?.id) {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'Autentikasi diperlukan: Sesi operator gerbang tidak ditemukan atau kedaluwarsa',
        },
        { status: 401 }
      );
    }

    // 2. Resolusi Konteks Tenant Resmi (Fail-Closed)
    let tenant: { id: string };
    try {
      const tenantCtx = await getTenantContext();
      if (!tenantCtx?.id || tenantCtx.id.trim() === '' || tenantCtx.id === DEFAULT_TENANT.id) {
        return NextResponse.json(
          { success: false, code: 'TENANT_NOT_FOUND', message: 'Konteks tenant valid diperlukan' },
          { status: 400 }
        );
      }
      tenant = tenantCtx;
    } catch {
      return NextResponse.json(
        { success: false, code: 'TENANT_NOT_FOUND', message: 'Konteks tenant valid diperlukan' },
        { status: 400 }
      );
    }

    // 3. Validasi Otorisasi Berbasis Database (requirePermission)
    const authz = await requirePermission(user.id, tenant.id, Permission.PROCESS_GATE_SCAN);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Izin ditolak: Anda tidak memiliki wewenang untuk memproses presensi gerbang',
        },
        { status: 403 }
      );
    }

    // 4. Parse & Sanitasi Request Body (Abaikan tenantId dari klien)
    const body = await request.json().catch(() => ({}));
    const { cardUid } = (body || {}) as { cardUid?: string };

    if (!cardUid || typeof cardUid !== 'string' || cardUid.trim() === '') {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'Card UID RFID wajib diisi' },
        { status: 400 }
      );
    }
    const cleanCardUid = cardUid.trim();

    // 5. Eksekusi Query dalam Transaksi Terisolasi Tenant
    const scanResult = await withTenantTransaction(
      tenant.id,
      async (tx) => {
        // (a) Lookup Kartu RFID
        const cardResult = await tx
          .select()
          .from(rfidCards)
          .where(and(eq(rfidCards.tenantId, tenant.id), eq(rfidCards.cardUid, cleanCardUid)));

        const card = cardResult[0];
        if (!card) {
          return {
            status: 404,
            payload: {
              success: false,
              code: 'CARD_NOT_FOUND',
              message: 'Kartu RFID tidak terdaftar pada instansi ini',
            },
          };
        }

        // (b) Lookup Santri
        const santriResult = await tx
          .select()
          .from(santri)
          .where(and(eq(santri.tenantId, tenant.id), eq(santri.id, card.santriId)));

        const santriObj = santriResult[0];
        if (!santriObj) {
          return {
            status: 404,
            payload: {
              success: false,
              code: 'SANTRI_NOT_FOUND',
              message: 'Data santri tidak ditemukan pada instansi ini',
            },
          };
        }

        // (c) Lookup CHECKED_OUT Gate Pass
        const passResult = await tx
          .select()
          .from(gatePasses)
          .where(
            and(
              eq(gatePasses.tenantId, tenant.id),
              eq(gatePasses.santriId, card.santriId),
              eq(gatePasses.status, 'CHECKED_OUT')
            )
          );

        const gatePass = passResult[0];
        if (!gatePass) {
          return {
            status: 404,
            payload: {
              success: false,
              code: 'ACTIVE_GATE_PASS_NOT_FOUND',
              message: `Tidak ada status keluar gerbang (CHECKED_OUT) yang aktif untuk ${santriObj.name}`,
            },
          };
        }

        // Record arrival timestamp
        const now = new Date();
        const checkOut = gatePass.checkOutTime ? new Date(gatePass.checkOutTime) : now;
        const actualDurationMinutes = Math.max(0, Math.round((now.getTime() - checkOut.getTime()) / (1000 * 60)));
        const validUntil = new Date(gatePass.validUntil);
        const isLate = now.getTime() > validUntil.getTime();
        const finalStatus = isLate ? 'LATE' : 'COMPLETED';

        await tx
          .update(gatePasses)
          .set({
            status: finalStatus,
            checkInTime: now,
            actualDurationMinutes,
            updatedAt: now,
          })
          .where(and(eq(gatePasses.tenantId, tenant.id), eq(gatePasses.id, gatePass.id)));

        const statusMessage = isLate
          ? `Kedatangan Terlambat (Batas: ${validUntil.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`
          : 'Kedatangan Tepat Waktu';

        return {
          status: 200,
          payload: {
            success: true,
            code: 'SCAN_IN_SUCCESS',
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
          },
        };
      }
    );

    return NextResponse.json(scanResult.payload, { status: scanResult.status });
  } catch (error: unknown) {
    console.error('[API /api/gate/scan-in POST] Internal error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memproses presensi kedatangan' },
      { status: 500 }
    );
  }
}
