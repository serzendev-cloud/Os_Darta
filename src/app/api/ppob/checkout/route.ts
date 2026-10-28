// ========================================
// PPOB Digital Products Checkout API Route
// Work Package: WP-SEC-FAILCLOSED-001
// Fail-Closed Policy: Zero Client Trust & Strict Session Auth
// ========================================

import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getTenantContext, DEFAULT_TENANT } from '@/lib/tenant/context';
import { requirePermission, authorizeWaliSantriAccess } from '@/lib/authz/authorization-service';
import { Permission } from '@/config/permissions';

export async function POST(req: Request) {
  try {
    // 1. Autentikasi Pengguna Sesi Server (Fail-Closed)
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
          message: 'Autentikasi diperlukan: Sesi pengguna tidak ditemukan atau kedaluwarsa',
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
          {
            success: false,
            code: 'TENANT_NOT_FOUND',
            message: 'Konteks tenant valid diperlukan',
          },
          { status: 400 }
        );
      }
      tenant = tenantCtx;
    } catch {
      return NextResponse.json(
        {
          success: false,
          code: 'TENANT_NOT_FOUND',
          message: 'Konteks tenant valid diperlukan',
        },
        { status: 400 }
      );
    }

    // 3. Validasi Otorisasi Izin Kanonikal Berbasis Database
    const authz = await requirePermission(user.id, tenant.id, Permission.PROCESS_PPOB_CHECKOUT);
    if (!authz.authorized) {
      return NextResponse.json(
        {
          success: false,
          code: 'FORBIDDEN',
          message: 'Izin ditolak: Anda tidak memiliki wewenang untuk melakukan checkout PPOB',
        },
        { status: 403 }
      );
    }

    // 4. Parse & Sanitasi Request Body (Abaikan parameter tenant, akun wali, dan saldo dari klien)
    const body = await req.json().catch(() => ({}));
    const { santriId, buyerSkuCode, customerNo, totalAmount } = (body || {}) as {
      santriId?: string;
      buyerSkuCode?: string;
      customerNo?: string;
      totalAmount?: number;
    };

    if (!buyerSkuCode || !customerNo || !totalAmount) {
      return NextResponse.json(
        { success: false, code: 'BAD_REQUEST', message: 'Data checkout PPOB tidak lengkap' },
        { status: 400 }
      );
    }

    // 5. Verifikasi Relasi Wali-Santri via Database jika santriId dilampirkan
    if (santriId && typeof santriId === 'string' && santriId.trim() !== '') {
      const relCheck = await authorizeWaliSantriAccess(user.id, tenant.id, santriId.trim());
      if (!relCheck.authorized) {
        return NextResponse.json(
          {
            success: false,
            code: 'FORBIDDEN_WALI_RELATION',
            message: 'Akses ditolak: Anda tidak memiliki hak asuh yang terverifikasi untuk santri ini',
          },
          { status: 403 }
        );
      }
    }

    // 6. Fail-Closed Service Gate:
    // TODO: Jalur transaksi checkout PPOB dinonaktifkan (Fail-Closed HTTP 503) sampai skema
    // tabel ledger saldo dompet PPOB wali dan mekanisme debit/refund atomik terintegrasi dengan DB.
    // Provider eksternal (Digiflazz/SaaS PG) TIDAK dipanggil karena saldo sumber belum terverifikasi.
    return NextResponse.json(
      {
        success: false,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Layanan checkout PPOB saat ini belum tersedia',
      },
      { status: 503 }
    );
  } catch (error: unknown) {
    console.error('[API /api/ppob/checkout POST] Internal error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_SERVER_ERROR', message: 'Gagal memproses checkout PPOB' },
      { status: 500 }
    );
  }
}
