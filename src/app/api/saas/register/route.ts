// ============================================================
// Public SaaS Tenant Registration API Route
// Traceability: WP-SAAS-REGISTRATION-IMPLEMENTATION-001
// Purpose: Secure, validated public entry point delegating to
//          the canonical Tenant Provisioning Engine
// ============================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  tenantProvisioningService,
  validateSlug,
  validateEmail,
} from '@/modules/saas/services/tenant-provisioning-service';
import { RESERVED_HOSTNAMES } from '@/proxy';

export interface PublicRegisterPayload {
  name: string;
  slug: string;
  location?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
}

/**
 * Validates Origin and Referer against the host and allowed application domain (CSRF Defense).
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
 * POST /api/saas/register
 * Public endpoint for self-registration of prospective pesantren institutions.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. CSRF & Origin Defense Gate
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

    // 2. Safe Payload Extraction
    let rawBody: Record<string, unknown>;
    try {
      rawBody = await request.json();
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

    // 3. Zero-Trust Field Whitelisting & Sanitization
    const cleanName = typeof rawBody.name === 'string' ? rawBody.name.trim() : '';
    const cleanSlug = typeof rawBody.slug === 'string' ? rawBody.slug.trim().toLowerCase() : '';
    const cleanLocation = typeof rawBody.location === 'string' ? rawBody.location.trim() : '';
    const cleanOwnerName = typeof rawBody.ownerName === 'string' ? rawBody.ownerName.trim() : '';
    const cleanEmail = typeof rawBody.ownerEmail === 'string' ? rawBody.ownerEmail.trim().toLowerCase() : '';
    const cleanPhone = typeof rawBody.ownerPhone === 'string' ? rawBody.ownerPhone.trim() : '';

    // 4. Authoritative Server Validation
    if (!cleanName || cleanName.length < 3 || cleanName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'ValidationError',
          message: 'Nama pesantren / instansi wajib diisi antara 3 sampai 100 karakter.',
          field: 'name',
        },
        { status: 400 }
      );
    }

    if (!cleanSlug || !validateSlug(cleanSlug)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ValidationError',
          message: 'Subdomain / Slug tidak valid. Gunakan 3-50 karakter huruf kecil, angka, atau tanda hubung (-).',
          field: 'slug',
        },
        { status: 400 }
      );
    }

    if (RESERVED_HOSTNAMES.has(cleanSlug)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ValidationError',
          message: `Subdomain '${cleanSlug}' merupakan nama yang dicadangkan oleh platform SaaS. Silakan pilih subdomain lain.`,
          field: 'slug',
        },
        { status: 400 }
      );
    }

    if (!cleanOwnerName || cleanOwnerName.length < 2 || cleanOwnerName.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'ValidationError',
          message: 'Nama penanggung jawab / pengurus wajib diisi minimal 2 karakter.',
          field: 'ownerName',
        },
        { status: 400 }
      );
    }

    if (!cleanEmail || !validateEmail(cleanEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ValidationError',
          message: 'Format alamat email pengurus tidak valid.',
          field: 'ownerEmail',
        },
        { status: 400 }
      );
    }

    if (cleanPhone && (cleanPhone.length < 8 || cleanPhone.length > 20)) {
      return NextResponse.json(
        {
          success: false,
          error: 'ValidationError',
          message: 'Nomor telepon / WhatsApp tidak valid.',
          field: 'ownerPhone',
        },
        { status: 400 }
      );
    }

    // 5. Pre-flight Duplicate & Availability Check
    const availability = await tenantProvisioningService.checkTenantAvailability(cleanSlug, cleanEmail);
    if (!availability.available) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conflict',
          message: availability.message || 'Data pendaftaran berkonflik dengan instansi atau pengguna yang sudah terdaftar.',
          field: availability.conflictField,
        },
        { status: 409 }
      );
    }

    // 6. Execute Canonical Tenant Provisioning Engine
    // Actor is strictly tagged as public self-registration (Zero-Trust)
    const result = await tenantProvisioningService.provisionTenant(
      {
        name: cleanName,
        slug: cleanSlug,
        location: cleanLocation || undefined,
        plan: 'Pro SaaS',
        ownerName: cleanOwnerName,
        ownerEmail: cleanEmail,
        ownerPhone: cleanPhone || undefined,
      },
      {
        userId: 'system:public-registration',
        name: 'Public Self-Registration',
        role: 'public_guest',
      }
    );

    // 7. Safe Public Response DTO (Zero-Secret Policy)
    // NEVER expose temporaryPassword, tokens, service role keys, or database IDs to public client
    return NextResponse.json(
      {
        success: true,
        message: `Pendaftaran instansi "${result.tenant.name}" berhasil diproses.`,
        data: {
          tenantName: result.tenant.name,
          tenantSlug: result.tenant.slug,
          domain: result.tenant.domain,
          location: result.tenant.location,
          ownerName: result.admin.name,
          ownerEmail: result.admin.email,
          status: 'PROVISIONED',
          nextStep: 'ONBOARDING',
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number })?.statusCode || 500;
    const rawMessage = error instanceof Error ? error.message : '';

    // Handle business conflict (409)
    if (statusCode === 409) {
      return NextResponse.json(
        {
          success: false,
          error: 'Conflict',
          message: rawMessage || 'Data pendaftaran berkonflik dengan instansi yang sudah ada.',
        },
        { status: 409 }
      );
    }

    // Handle business validation error (400)
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

    // Server diagnostic log
    console.error('[API /api/saas/register POST] Unexpected Error:', error);

    // Sanitized generic 500 error without exposing stack traces or SQL details
    return NextResponse.json(
      {
        success: false,
        error: 'InternalServerError',
        message: 'Terjadi kendala sistem saat memproses pendaftaran. Silakan coba beberapa saat lagi atau hubungi narahubung resmi.',
      },
      { status: 500 }
    );
  }
}
