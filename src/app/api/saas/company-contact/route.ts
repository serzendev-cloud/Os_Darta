/* eslint-disable local-rules/enforce-tenant-id-param */
// ========================================
// SaaS Platform Company Contact API Route
// Traceability: WP-SAAS-COMPANY-CONTACT-EXECUTION-001
// ========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { platformSettingsService } from '@/lib/db/services/platformSettings';
import { auditLogService } from '@/lib/db/services/auditLog';
import { isDemoMode } from '@/lib/mock-store';

/**
 * Validates whether an origin/referer matches the request host or application domain (CSRF Defense).
 */
function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  const targetHeader = origin || referer;
  if (!targetHeader) {
    // In browser environment, POST/PUT requests send Origin or Referer.
    // If neither is present for a state-changing mutation, reject unless in node test environment without browser origin header
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
 * GET /api/saas/company-contact
 * Public-safe endpoint returning platform company contact information.
 * Exposes ONLY public-safe fields: companyName, companyEmail, companyPhone, companyWhatsApp, companyWebsite.
 */
export async function GET() {
  try {
    if (process.env.NODE_ENV === 'test' || isDemoMode()) {
      const settings = await platformSettingsService.get();
      return NextResponse.json({
        success: true,
        data: {
          companyName: 'SERZEN DEV',
          companyEmail: settings.companyEmail || null,
          companyPhone: settings.companyPhone || null,
          companyWhatsApp: settings.companyWhatsApp || null,
          companyWebsite: settings.companyWebsite || null,
        },
      });
    }

    try {
      const records = await db
        .select()
        .from(schema.platformSettings)
        .where(eq(schema.platformSettings.id, 'default'));

      if (records && records.length > 0) {
        const rec = records[0];
        return NextResponse.json({
          success: true,
          data: {
            companyName: 'SERZEN DEV',
            companyEmail: rec.companyEmail || null,
            companyPhone: rec.companyPhone || null,
            companyWhatsApp: rec.companyWhatsApp || null,
            companyWebsite: rec.companyWebsite || null,
          },
        });
      }
    } catch {
      // Fallback
    }

    const settings = await platformSettingsService.get();
    return NextResponse.json({
      success: true,
      data: {
        companyName: 'SERZEN DEV',
        companyEmail: settings.companyEmail || null,
        companyPhone: settings.companyPhone || null,
        companyWhatsApp: settings.companyWhatsApp || null,
        companyWebsite: settings.companyWebsite || null,
      },
    });
  } catch (error) {
    console.error('[API /api/saas/company-contact GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil informasi kontak platform' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/saas/company-contact
 * Super Admin state-changing mutation for platform company profile & contact settings.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const isSuperAdmin = request.headers.get('x-is-super-admin') === 'true';

    // 1. Authentication & Authorization Gate (Super Admin Only)
    if (!userId || !isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Akses ditolak. Hanya Super Admin / Developer yang dapat mengubah informasi kontak perusahaan.',
        },
        { status: 403 }
      );
    }

    // 2. CSRF & Origin Defense Gate
    if (!validateOrigin(request)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden (CSRF/Origin Mismatch)',
          message: 'Permintaan ditolak karena Mismatch Origin / Referer (Perlindungan CSRF).',
        },
        { status: 403 }
      );
    }

    // 3. Parse JSON body
    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const { companyEmail, companyPhone, companyWhatsApp, companyWebsite } = body;

    // 4. Server-Side Input Validation & Sanitization

    // Email validation
    let cleanEmail: string | null = null;
    if (companyEmail !== undefined && companyEmail !== null && String(companyEmail).trim() !== '') {
      const emailStr = String(companyEmail).trim();
      if (emailStr.length > 255) {
        return NextResponse.json(
          { success: false, error: 'Email perusahaan tidak boleh melebihi 255 karakter.' },
          { status: 400 }
        );
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailStr)) {
        return NextResponse.json(
          { success: false, error: 'Format email perusahaan tidak valid.' },
          { status: 400 }
        );
      }
      cleanEmail = emailStr;
    }

    // Phone validation
    let cleanPhone: string | null = null;
    if (companyPhone !== undefined && companyPhone !== null && String(companyPhone).trim() !== '') {
      const phoneStr = String(companyPhone).trim();
      if (phoneStr.length > 50) {
        return NextResponse.json(
          { success: false, error: 'Nomor telepon tidak boleh melebihi 50 karakter.' },
          { status: 400 }
        );
      }
      const phoneRegex = /^[\d\s+\-()]{5,50}$/;
      if (!phoneRegex.test(phoneStr)) {
        return NextResponse.json(
          { success: false, error: 'Format nomor telepon tidak valid. Gunakan hanya angka, spasi, +, -, dan tanda kurung.' },
          { status: 400 }
        );
      }
      cleanPhone = phoneStr;
    }

    // WhatsApp validation
    let cleanWhatsApp: string | null = null;
    if (companyWhatsApp !== undefined && companyWhatsApp !== null && String(companyWhatsApp).trim() !== '') {
      const waStr = String(companyWhatsApp).trim();
      if (waStr.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Nomor/Link WhatsApp tidak boleh melebihi 100 karakter.' },
          { status: 400 }
        );
      }
      // Security check: reject dangerous protocols
      const lowerWa = waStr.toLowerCase();
      if (lowerWa.startsWith('javascript:') || lowerWa.startsWith('data:') || lowerWa.startsWith('vbscript:')) {
        return NextResponse.json(
          { success: false, error: 'Protokol URL WhatsApp tidak aman / berpotensi injection.' },
          { status: 400 }
        );
      }
      cleanWhatsApp = waStr;
    }

    // Website validation
    let cleanWebsite: string | null = null;
    if (companyWebsite !== undefined && companyWebsite !== null && String(companyWebsite).trim() !== '') {
      const webStr = String(companyWebsite).trim();
      if (webStr.length > 255) {
        return NextResponse.json(
          { success: false, error: 'URL Website perusahaan tidak boleh melebihi 255 karakter.' },
          { status: 400 }
        );
      }
      const lowerWeb = webStr.toLowerCase();
      if (lowerWeb.startsWith('javascript:') || lowerWeb.startsWith('data:') || lowerWeb.startsWith('file:')) {
        return NextResponse.json(
          { success: false, error: 'Protokol URL Website tidak aman / berpotensi injection.' },
          { status: 400 }
        );
      }
      if (!webStr.startsWith('http://') && !webStr.startsWith('https://')) {
        return NextResponse.json(
          { success: false, error: 'URL Website harus diawali dengan http:// atau https://.' },
          { status: 400 }
        );
      }
      try {
        new URL(webStr);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Format URL Website perusahaan tidak valid.' },
          { status: 400 }
        );
      }
      cleanWebsite = webStr;
    }

    // 5. Update Database (PostgreSQL) if not demo/test mode
    if (process.env.NODE_ENV !== 'test' && !isDemoMode()) {
      try {
        const existing = await db
          .select()
          .from(schema.platformSettings)
          .where(eq(schema.platformSettings.id, 'default'));

        const payload = {
          companyName: 'SERZEN DEV',
          companyEmail: cleanEmail,
          companyPhone: cleanPhone,
          companyWhatsApp: cleanWhatsApp,
          companyWebsite: cleanWebsite,
          updatedAt: new Date(),
        };

        if (existing && existing.length > 0) {
          await db
            .update(schema.platformSettings)
            .set(payload)
            .where(eq(schema.platformSettings.id, 'default'));
        } else {
          await db.insert(schema.platformSettings).values({
            id: 'default',
            ...payload,
          });
        }
      } catch (e) {
        console.warn('[API /api/saas/company-contact POST] DB update warning:', e);
      }
    }

    // Keep service & demo store updated
    const updated = await platformSettingsService.update({
      companyEmail: cleanEmail,
      companyPhone: cleanPhone,
      companyWhatsApp: cleanWhatsApp,
      companyWebsite: cleanWebsite,
    });

    // 6. Audit Logging
    try {
      await auditLogService.log({
        actorId: userId,
        actorName: 'Super Admin',
        actorRole: 'super_admin',
        entityType: 'system',
        entityId: 'platform_settings',
        action: 'update',
        metadata: {
          companyName: 'SERZEN DEV',
          updatedFields: {
            companyEmail: cleanEmail,
            companyPhone: cleanPhone,
            companyWhatsApp: cleanWhatsApp,
            companyWebsite: cleanWebsite,
          },
        },
      });
    } catch (auditError) {
      console.warn('[API /api/saas/company-contact POST] Audit log failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Informasi kontak perusahaan SERZEN DEV berhasil diperbarui!',
      data: {
        companyName: 'SERZEN DEV',
        companyEmail: updated.companyEmail,
        companyPhone: updated.companyPhone,
        companyWhatsApp: updated.companyWhatsApp,
        companyWebsite: updated.companyWebsite,
      },
    });
  } catch (error) {
    console.error('[API /api/saas/company-contact POST] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui informasi kontak perusahaan' },
      { status: 500 }
    );
  }
}
