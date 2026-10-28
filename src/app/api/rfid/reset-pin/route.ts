import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rfidCards, santri, auditLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { deriveNewPinCredential, validatePinFormat } from '@/lib/security/pinCrypto';
import { getTenantContext } from '@/lib/tenant/context';
import { requirePermission } from '@/lib/authz/authorization-service';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { Permission } from '@/config/permissions';

interface AuthResolution {
  userId: string | null;
  userEmail: string | null;
  isSuperAdmin: boolean;
}

/**
 * Resolves the authenticated user identity with fail-closed security.
 * In production, identity MUST originate from a cryptographically verified Supabase
 * server session (cookies). Raw client-supplied headers and body are strictly untrusted.
 * In automated test suites (Vitest), verified mock test headers are accepted.
 */
async function resolveAuthUser(request: NextRequest): Promise<AuthResolution> {
  // 1. Primary Authority: Cryptographic server-side Supabase session
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user?.id) {
      const user = data.user;
      const appRole = (user.app_metadata?.role || '') as string;
      const normalizedRole = appRole.toUpperCase().replace(/\s+/g, '_');
      const isSuper = normalizedRole === 'SUPER_ADMIN' || normalizedRole === 'DEVELOPER';
      return {
        userId: user.id,
        userEmail: user.email ?? null,
        isSuperAdmin: isSuper,
      };
    }
  } catch {
    // Session resolution unavailable in current context (e.g. test harness)
  }

  // 2. Controlled Test Harness Support (Strictly gated to test environments)
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    const headerUserId = request.headers.get('x-user-id');
    if (headerUserId && headerUserId.trim() !== '') {
      const isSuper = request.headers.get('x-is-super-admin') === 'true';
      const email = request.headers.get('x-user-email');
      return {
        userId: headerUserId.trim(),
        userEmail: email && email.trim() !== '' ? email.trim() : null,
        isSuperAdmin: isSuper,
      };
    }
  }

  return { userId: null, userEmail: null, isSuperAdmin: false };
}

/**
 * POST /api/rfid/reset-pin
 * 
 * Strict RBAC Otorisasi Reset PIN (Hardened per WP-SEC-RFID-PIN-001):
 * - Identitas dan otorisasi diverifikasi dari sesi server dan database (bukan header/body).
 * - Semua field identitas/role/tenant dari request body dan header x-user-role diabaikan.
 * - Memerlukan izin 'manage_rfid_pin' yang hanya diberikan ke Admin & Bendahara/Admin Keuangan.
 * - Wali Kelas dinonaktifkan (HTTP 403) sampai ada data kepengurusan (guru <-> rombel) di skema database.
 * - Semua query database dieksekusi di dalam withTenantTransaction(tenant.id, ...).
 * - Atomisitas unblock: reset PIN mengosongkan pinFailedAttempts = 0 dan status = 'active'.
 * - Mencatat audit trail append-only dengan aksi RFID_PIN_RESET (tanpa membocorkan kredensial PIN).
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Resolusi Tenant Resmi (Fail-Closed)
    const tenant = await getTenantContext();
    if (!tenant?.id || tenant.id.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          code: 'TENANT_REQUIRED',
          message: 'Konteks tenant valid diperlukan untuk memproses permintaan',
        },
        { status: 400 }
      );
    }

    // 2. Autentikasi Pengguna dari Sesi Server
    const auth = await resolveAuthUser(request);
    if (!auth.userId || auth.userId.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          code: 'UNAUTHENTICATED',
          message: 'Autentikasi diperlukan: Sesi pengguna tidak ditemukan atau kedaluwarsa',
        },
        { status: 401 }
      );
    }
    const operatorUserId: string = auth.userId.trim();
    const operatorUserLabel: string = (auth.userEmail && auth.userEmail.trim()) || operatorUserId;

    // 3. Validasi Otorisasi Berbasis Database (requirePermission)
    const authz = await requirePermission(operatorUserId, tenant.id, Permission.MANAGE_RFID_PIN);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Izin ditolak: Anda tidak memiliki wewenang untuk mereset PIN kartu RFID',
        },
        { status: 403 }
      );
    }

    // TODO: Jalur wali_kelas dinonaktifkan (HTTP 403) sampai ada data kepengurusan (guru <-> rombel) yang valid di skema database.
    if (authz.primaryRoleCode?.toUpperCase() === 'WALI_KELAS') {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN_WALI_KELAS',
          message: 'Wali Kelas tidak berwenang mereset PIN sampai data kepengurusan tersedia di database',
        },
        { status: 403 }
      );
    }

    // 4. Parse & Sanitasi Request Body (Abaikan field operatorRole, operatorUserId, operatorKelasBinaan, tenantId)
    const body = await request.json().catch(() => ({}));
    const { cardUid, santriId, newPin } = body as {
      cardUid?: string;
      santriId?: string;
      newPin?: string;
    };

    if ((!cardUid && !santriId) || !newPin) {
      return NextResponse.json(
        {
          success: false,
          code: 'BAD_REQUEST',
          message: 'Card UID atau Santri ID serta PIN baru 6-digit wajib diisi',
        },
        { status: 400 }
      );
    }

    if (!validatePinFormat(newPin)) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_PIN_FORMAT',
          message: 'Format PIN tidak valid: PIN harus tepat 6 digit numerik',
        },
        { status: 400 }
      );
    }

    // 5. Eksekusi Reset PIN dalam withTenantTransaction
    const txResult = await withTenantTransaction(
      tenant.id,
      async (tx) => {
        // (a) Lookup Kartu RFID dalam cakupan tenant
        const cardConditions = [eq(rfidCards.tenantId, tenant.id)];
        if (cardUid) {
          cardConditions.push(eq(rfidCards.cardUid, cardUid));
        } else if (santriId) {
          cardConditions.push(eq(rfidCards.santriId, santriId));
        }

        const cardRows = await tx
          .select()
          .from(rfidCards)
          .where(and(...cardConditions));

        const card = cardRows[0];
        if (!card) {
          return { notFoundCard: true };
        }

        // (b) Lookup Profil Santri dalam cakupan tenant
        const santriRows = await tx
          .select()
          .from(santri)
          .where(and(eq(santri.tenantId, tenant.id), eq(santri.id, card.santriId)));

        const santriObj = santriRows[0];
        if (!santriObj) {
          return { notFoundSantri: true };
        }

        // (c) Derivasi Kredensial KDF Baru
        const credential = deriveNewPinCredential(newPin);

        // (d) Update Status Kartu & Reset PIN Atomik
        await tx
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
            lastPinResetBy: operatorUserId,
            updatedAt: new Date(),
          })
          .where(and(eq(rfidCards.id, card.id), eq(rfidCards.tenantId, tenant.id)));

        // (e) Audit Trail Logging (Zero sensitive credentials stored)
        await tx.insert(auditLogs).values({
          id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          tenantId: tenant.id,
          action: 'RFID_PIN_RESET',
          user: operatorUserLabel,
          userId: operatorUserId,
          userRole: authz.primaryRoleCode || 'ADMIN',
          details: `Reset PIN kartu RFID ${card.cardUid} santri ${santriObj.name} (${santriObj.id})`,
          targetEntity: 'rfid_card',
          targetId: card.id,
          timestamp: new Date(),
        });

        return {
          card,
          santriObj,
          credential,
        };
      },
      { isSuperAdmin: auth.isSuperAdmin, tenantSlug: tenant.slug }
    );

    if ('notFoundCard' in txResult) {
      return NextResponse.json(
        {
          success: false,
          code: 'CARD_NOT_FOUND',
          message: 'Kartu RFID santri tidak ditemukan',
        },
        { status: 404 }
      );
    }

    if ('notFoundSantri' in txResult) {
      return NextResponse.json(
        {
          success: false,
          code: 'SANTRI_NOT_FOUND',
          message: 'Data santri terkait tidak ditemukan',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      code: 'PIN_RESET_SUCCESS',
      message: 'PIN Kartu RFID Santri Berhasil Direset dan Status Kartu Otomatis Aktif',
      data: {
        cardUid: txResult.card.cardUid,
        santriId: txResult.card.santriId,
        santriName: txResult.santriObj.name,
        kelas: txResult.santriObj.kelas,
        status: 'active',
        kdfVersion: txResult.credential.kdfVersion,
        pepperVersion: txResult.credential.pepperVersion,
        resetBy: auth.userId,
        resetAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[RFID_RESET_PIN_ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Gagal mereset PIN kartu RFID',
      },
      { status: 500 }
    );
  }
}
