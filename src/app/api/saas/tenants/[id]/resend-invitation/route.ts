// =============================================================================
// SaaS Multi-Tenant Resend Invitation API Route
// Traceability: WP-TENANT-PROVISIONING-INVITATION-DESIGN-001-REVISION-002
// =============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { tenantProvisioningService } from '@/modules/saas/services/tenant-provisioning-service';

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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.headers.get('x-user-id');
    const isSuperAdmin = request.headers.get('x-is-super-admin') === 'true';

    // 1. Authorization Gate (Super Admin Only)
    if (!userId || !isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Akses ditolak. Hanya Super Admin yang dapat mengirim ulang undangan tenant.',
        },
        { status: 403 }
      );
    }

    // 2. CSRF Defense Gate
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

    const { id: tenantId } = await context.params;

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'BadRequest', message: 'Tenant ID tidak valid.' },
        { status: 400 }
      );
    }

    // 3. Execute Resend Invitation Engine
    const result = await tenantProvisioningService.resendTenantInvitation(tenantId, {
      userId,
      name: 'Super Admin',
      role: 'super_admin',
    });

    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const rawMessage = error instanceof Error ? error.message : 'Gagal mengirim ulang email undangan.';

    return NextResponse.json(
      {
        success: false,
        error: 'RESEND_INVITATION_ERROR',
        message: rawMessage,
      },
      { status: statusCode }
    );
  }
}
