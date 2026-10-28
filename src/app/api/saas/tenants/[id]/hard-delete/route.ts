// =============================================================================
// SaaS Tenant Hard-Delete Lifecycle API Route
// Traceability: WP-TENANT-HARD-DELETE-LIFECYCLE-ENGINE-001
// Canonical Authority: Server-Side Decommissioning & Orphan Purge Engine
// =============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authorizeCurrentPlatformRoles } from '@/lib/authz/authorization-service';
import { tenantHardDeleteService } from '@/modules/saas/services/tenant-hard-delete-service';

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const targetHeader = origin || referer;
  if (!targetHeader) {
    return false;
  }

  try {
    const targetUrl = new URL(targetHeader);
    if (host && targetUrl.host === host) return true;
    if (appUrl) {
      const allowedUrl = new URL(appUrl);
      if (targetUrl.host === allowedUrl.host) return true;
    }
    if (targetUrl.hostname === 'localhost' || targetUrl.hostname === '127.0.0.1') return true;
  } catch {
    return false;
  }
  return false;
}

/**
 * GET /api/saas/tenants/:id/hard-delete
 * Super Admin endpoint to preview and plan a tenant hard-delete (Read-Only).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  void request;
  try {
    const authorization = await authorizeCurrentPlatformRoles(['SUPER_ADMIN', 'DEVELOPER']);
    if (!authorization.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: authorization.status === 401 ? 'Unauthorized' : authorization.status === 503 ? 'AuthorizationUnavailable' : 'Forbidden',
          message: 'Akses platform memerlukan sesi valid dan role platform yang sah.',
        },
        { status: authorization.status }
      );
    }

    const { userId, role } = authorization;

    const { id } = await context.params;
    const plan = await tenantHardDeleteService.planHardDelete(id, {
      userId,
      role,
      isSuperAdmin: true,
    });

    return NextResponse.json({
      success: true,
      data: plan,
    });
  } catch (error: unknown) {
    console.error('[API /api/saas/tenants/:id/hard-delete GET] Error:', error);
    const errText = error instanceof Error ? error.message : '';
    const isNotFound = errText.includes('tidak ditemukan');
    return NextResponse.json(
      {
        success: false,
        code: isNotFound ? 'NOT_FOUND' : 'BAD_REQUEST',
        error: isNotFound ? 'NotFound' : 'BadRequest',
        message: isNotFound ? 'Tenant tidak ditemukan.' : 'Gagal merencanakan hard-delete tenant.',
      },
      { status: isNotFound ? 404 : 400 }
    );
  }
}

/**
 * POST /api/saas/tenants/:id/hard-delete
 * Super Admin endpoint to atomically execute tenant hard-delete and orphan identity purge.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authorization = await authorizeCurrentPlatformRoles(['SUPER_ADMIN', 'DEVELOPER']);
    if (!authorization.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: authorization.status === 401 ? 'Unauthorized' : authorization.status === 503 ? 'AuthorizationUnavailable' : 'Forbidden',
          message: 'Akses platform memerlukan sesi valid dan role platform yang sah.',
        },
        { status: authorization.status }
      );
    }

    const { userId, role } = authorization;

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

    const { id } = await context.params;

    let body: Record<string, unknown> = {};
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

    const confirmationCode = String(body.confirmationCode || '').trim();
    if (!confirmationCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'BadRequest',
          message: 'Kode konfirmasi wajib diisi untuk mengeksekusi penghapusan permanen.',
        },
        { status: 400 }
      );
    }

    const purgeOrphanedIdentities = body.purgeOrphanedIdentities !== false;

    // 3. Execute Hard-Delete Engine
    const result = await tenantHardDeleteService.executeHardDelete(
      {
        targetTenantId: id,
        confirmationCode,
        purgeOrphanedIdentities,
      },
      {
        userId,
        name: 'Super Admin',
        role,
        isSuperAdmin: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Tenant "${result.tenantName}" (${result.tenantCode}) dan data terkait berhasil dihapus secara permanen.`,
      data: result,
    });
  } catch (error: unknown) {
    console.error('[API /api/saas/tenants/:id/hard-delete POST] Error:', error);
    const errText = error instanceof Error ? error.message : '';
    const isProtected = errText.includes('dilindungi secara permanen') || errText.includes('Operasi dibatalkan');
    const isInvalidCode = errText.includes('Kode konfirmasi tidak valid');
    const isNotFound = errText.includes('tidak ditemukan');

    let status = 400;
    let safeMessage = 'Gagal mengeksekusi hard-delete tenant.';
    let errorCode = 'BAD_REQUEST';
    let errorName = 'BadRequest';

    if (isProtected) {
      status = 403;
      safeMessage = 'Tenant dilindungi secara permanen dari penghapusan.';
      errorCode = 'PROTECTED_TENANT';
      errorName = 'Forbidden';
    } else if (isNotFound) {
      status = 404;
      safeMessage = 'Tenant tidak ditemukan.';
      errorCode = 'NOT_FOUND';
      errorName = 'NotFound';
    } else if (isInvalidCode) {
      status = 422;
      safeMessage = 'Kode konfirmasi tidak valid.';
      errorCode = 'INVALID_CONFIRMATION_CODE';
      errorName = 'UnprocessableEntity';
    }

    return NextResponse.json(
      {
        success: false,
        code: errorCode,
        error: errorName,
        message: safeMessage,
      },
      { status }
    );
  }
}
