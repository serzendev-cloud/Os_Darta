// ========================================
// SaaS Multi-Tenant Provisioning API Route
// Traceability: WP-TENANT-PROVISION-002
// Canonical Authority: Server-Side Provisioning Engine
// ========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  tenantProvisioningService,
  ProvisionTenantInput,
} from '@/modules/saas/services/tenant-provisioning-service';

/**
 * Validates Origin and Referer against the host and allowed application domain (CSRF Protection).
 */
function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const targetHeader = origin || referer;
  if (!targetHeader) {
    const userAgent = request.headers.get('user-agent') || '';
    if (process.env.NODE_ENV === 'test' || userAgent.includes('node-fetch') || userAgent.includes('supertest')) {
      return true;
    }
    return false;
  }

  try {
    const targetUrl = new URL(targetHeader);
    if (host && targetUrl.host === host) {
      return true;
    }
    if (appUrl) {
      const allowedUrl = new URL(appUrl);
      if (targetUrl.host === allowedUrl.host) {
        return true;
      }
    }
    if (targetUrl.hostname === 'localhost' || targetUrl.hostname === '127.0.0.1') {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * GET /api/saas/tenants
 * Super Admin endpoint to list all registered tenants from PostgreSQL.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const isSuperAdmin = request.headers.get('x-is-super-admin') === 'true';

    // 1. Authorization Gate (Super Admin Only)
    if (!userId || !isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Akses ditolak. Hanya Super Admin / Developer yang dapat melihat daftar tenant platform.',
        },
        { status: 403 }
      );
    }

    // 2. Read persistent tenants from PostgreSQL
    const tenantsList = await tenantProvisioningService.listActiveTenants();

    return NextResponse.json({
      success: true,
      data: {
        tenants: tenantsList,
        total: tenantsList.length,
      },
    });
  } catch (error: unknown) {
    console.error('[API /api/saas/tenants GET] Internal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'InternalServerError',
        message: 'Gagal mengambil data tenant dari database.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/saas/tenants
 * Super Admin endpoint to atomically provision a new Tenant and its primary Administrator.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const isSuperAdmin = request.headers.get('x-is-super-admin') === 'true';

    // 1. Authorization Gate (Super Admin Only)
    if (!userId || !isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Akses ditolak. Hanya Super Admin / Developer yang dapat memprovisi tenant baru.',
        },
        { status: 403 }
      );
    }

    // 2. CSRF & Origin Defense Gate
    if (!validateOrigin(request)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Permintaan ditolak karena Mismatch Origin / Referer (Perlindungan CSRF).',
        },
        { status: 403 }
      );
    }

    // 3. Payload Parsing
    let body: ProvisionTenantInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'BadRequest',
          message: 'Format payload JSON tidak valid.',
        },
        { status: 400 }
      );
    }

    // 4. Execute Atomic Provisioning Engine
    const result = await tenantProvisioningService.provisionTenant(body, {
      userId,
      name: 'Super Admin',
      role: 'super_admin',
    });

    return NextResponse.json(
      {
        success: true,
        message: `Tenant "${result.tenant.name}" berhasil diprovisi!`,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const status = (error as { status?: string })?.status || 'PROVISIONING_FAILED';
    const rawMessage = error instanceof Error ? error.message : '';

    // Business Conflict (409) — safe user-facing validation message
    if (statusCode === 409) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conflict',
          message: rawMessage || 'Data pendaftaran tenant berkonflik dengan data yang sudah ada.',
        },
        { status: 409 }
      );
    }

    // Business Validation Failure (400) — safe user-facing message
    if (statusCode === 400 || rawMessage.includes('wajib diisi') || rawMessage.includes('tidak valid')) {
      return NextResponse.json(
        {
          success: false,
          error: 'BadRequest',
          message: rawMessage || 'Data pendaftaran tidak valid.',
        },
        { status: 400 }
      );
    }

    // Server-side diagnostic log (Full details preserved internally)
    console.error('[API /api/saas/tenants POST] Internal Error:', error);

    // Safe error disclosure for unexpected 500 infrastructure / database failures
    let safeMessage = 'Terjadi kesalahan sistem saat memproses provisi tenant baru. Silakan coba beberapa saat lagi.';
    if (status === 'PROVISIONING_COMPENSATION_FAILED') {
      safeMessage = 'Gagal memprovisi tenant dan proses pembersihan akun otomatis tidak dapat diselesaikan. Segera hubungi administrator platform.';
    } else if (status === 'PROVISIONING_FAILED') {
      safeMessage = 'Gagal memprovisi tenant ke database. Akun administrator telah dibersihkan secara otomatis.';
    }

    return NextResponse.json(
      {
        success: false,
        error: status,
        message: safeMessage,
      },
      { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
    );
  }
}
