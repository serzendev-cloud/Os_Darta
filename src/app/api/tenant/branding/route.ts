// ========================================
// Tenant Branding API Route
// Traceability: WP-SAAS-BRAND-002 Core Tenant Branding Configuration
// Hardened: WP-SEC-FINAL-001 (Fail-Closed Auth & Zero Header Bypass)
// ========================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as schema from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getTenantContext } from '@/lib/tenant/context';
import { requirePermission, authorizePlatformRole } from '@/lib/authz/authorization-service';
import { withTenantTransaction } from '@/lib/db/tenant-transaction';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { Permission } from '@/config/permissions';

/**
 * GET /api/tenant/branding
 * Retrieves server-verified tenant branding configuration from PostgreSQL tenant_settings table.
 * Fail-Closed: Sesi server wajib, otorisasi diperiksa via TENANT_BRANDING_READ atau peran platform DB.
 */
export async function GET(request: NextRequest) {
  void request;
  try {
    // 1. Fail-closed session check
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHENTICATED', message: 'Sesi autentikasi diperlukan untuk mengakses pengaturan branding' },
        { status: 401 }
      );
    }

    // 2. Tenant Context resolution
    let tenant;
    try {
      tenant = await getTenantContext();
      if (!tenant || !tenant.id) {
        return NextResponse.json(
          { success: false, code: 'INVALID_TENANT_CONTEXT', message: 'Konteks tenant tidak valid' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, code: 'INVALID_TENANT_CONTEXT', message: 'Konteks tenant tidak valid' },
        { status: 400 }
      );
    }

    // 3. Authorization: DB Platform Role or TENANT_BRANDING_READ permission
    const superCheck = await authorizePlatformRole(user.id, 'SUPER_ADMIN');
    const devCheck = await authorizePlatformRole(user.id, 'DEVELOPER');
    const isSuperAdmin = superCheck.authorized || devCheck.authorized;

    if (!isSuperAdmin) {
      const authz = await requirePermission(user.id, tenant.id, Permission.TENANT_BRANDING_READ);
      if (!authz.authorized) {
        return NextResponse.json(
          { success: false, code: 'FORBIDDEN', message: authz.reason || 'Izin ditolak untuk membaca pengaturan branding' },
          { status: 403 }
        );
      }
    }

    // 4. Execute query inside canonical tenant transaction context
    const settingsRecords = await withTenantTransaction(
      tenant.id,
      async (tx) => {
        return await tx
          .select()
          .from(schema.tenantSettings)
          .where(eq(schema.tenantSettings.tenantId, tenant.id));
      },
      { isSuperAdmin, tenantSlug: tenant.slug }
    );

    const record = settingsRecords[0];

    const brandingData = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      tenantSlug: tenant.slug,
      loginTitle: record?.loginTitle || tenant.name || 'Ponpes Daruttahuid',
      loginSubtitle: record?.loginSubtitle || 'Malang',
      loginDescription:
        record?.loginDescription ||
        'Platform tata kelola santri, pemantauan pelanggaran, pembinaan karakter, dan manajemen asrama — terintegrasi dalam satu sistem.',
      customLogoUrl: record?.customLogoUrl || null,
      customBgUrl: record?.customBgUrl || null,
      primaryColor: record?.primaryColor || '#0F766E',
      tagline: record?.tagline || 'Sistem Informasi Pesantren Terpadu',
    };

    return NextResponse.json({ success: true, data: brandingData });
  } catch (error) {
    console.error('[API /api/tenant/branding GET] Error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: 'Gagal memproses permintaan branding' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tenant/branding
 * Updates or creates tenant branding configuration in PostgreSQL tenant_settings table.
 * Fail-Closed: Sesi server wajib, otorisasi diperiksa via TENANT_BRANDING_MANAGE atau peran platform DB.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Fail-closed session check
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHENTICATED', message: 'Sesi autentikasi diperlukan untuk mengubah pengaturan branding' },
        { status: 401 }
      );
    }

    // 2. Tenant Context resolution
    let tenant;
    try {
      tenant = await getTenantContext();
      if (!tenant || !tenant.id) {
        return NextResponse.json(
          { success: false, code: 'INVALID_TENANT_CONTEXT', message: 'Konteks tenant tidak valid' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, code: 'INVALID_TENANT_CONTEXT', message: 'Konteks tenant tidak valid' },
        { status: 400 }
      );
    }

    // 3. Authorization: DB Platform Role or TENANT_BRANDING_MANAGE permission
    const superCheck = await authorizePlatformRole(user.id, 'SUPER_ADMIN');
    const devCheck = await authorizePlatformRole(user.id, 'DEVELOPER');
    const isSuperAdmin = superCheck.authorized || devCheck.authorized;

    if (!isSuperAdmin) {
      const authz = await requirePermission(user.id, tenant.id, Permission.TENANT_BRANDING_MANAGE);
      if (!authz.authorized) {
        return NextResponse.json(
          { success: false, code: 'FORBIDDEN', message: authz.reason || 'Izin ditolak untuk mengedit pengaturan branding' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const {
      loginTitle,
      loginSubtitle,
      loginDescription,
      customLogoUrl,
      customBgUrl,
      primaryColor,
      tagline,
    } = body;

    // Server-side Input Validation
    if (primaryColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(primaryColor)) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', error: 'Format warna utama tidak valid. Gunakan format HEX (contoh: #0F766E).' },
        { status: 400 }
      );
    }

    if (loginTitle && loginTitle.length > 150) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', error: 'Judul login tidak boleh melebihi 150 karakter.' },
        { status: 400 }
      );
    }

    if (loginSubtitle && loginSubtitle.length > 150) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', error: 'Sub-judul login tidak boleh melebihi 150 karakter.' },
        { status: 400 }
      );
    }

    if (loginDescription && loginDescription.length > 1000) {
      return NextResponse.json(
        { success: false, code: 'VALIDATION_ERROR', error: 'Deskripsi login tidak boleh melebihi 1000 karakter.' },
        { status: 400 }
      );
    }

    // Execute upsert inside canonical tenant transaction context
    await withTenantTransaction(
      tenant.id,
      async (tx) => {
        const existingRecords = await tx
          .select()
          .from(schema.tenantSettings)
          .where(eq(schema.tenantSettings.tenantId, tenant.id));

        const existingDoc = existingRecords[0];

        const payload = {
          loginTitle: loginTitle ?? existingDoc?.loginTitle ?? tenant.name,
          loginSubtitle: loginSubtitle ?? existingDoc?.loginSubtitle ?? 'Malang',
          loginDescription: loginDescription ?? existingDoc?.loginDescription ?? '',
          customLogoUrl: customLogoUrl ?? existingDoc?.customLogoUrl ?? null,
          customBgUrl: customBgUrl ?? existingDoc?.customBgUrl ?? null,
          primaryColor: primaryColor ?? existingDoc?.primaryColor ?? '#0F766E',
          tagline: tagline ?? existingDoc?.tagline ?? 'Sistem Informasi Pesantren Terpadu',
          updatedAt: new Date(),
        };

        if (existingDoc) {
          await tx
            .update(schema.tenantSettings)
            .set(payload)
            .where(
              and(
                eq(schema.tenantSettings.tenantId, tenant.id),
                eq(schema.tenantSettings.id, existingDoc.id)
              )
            );
        } else {
          await tx.insert(schema.tenantSettings).values({
            id: `ts_${tenant.id}`,
            tenantId: tenant.id,
            ...payload,
          });
        }
      },
      { isSuperAdmin, tenantSlug: tenant.slug }
    );

    return NextResponse.json({
      success: true,
      message: 'Pengaturan Tampilan Branding Pesantren Berhasil Disimpan!',
    });
  } catch (error) {
    console.error('[API /api/tenant/branding POST] Error:', error);
    return NextResponse.json(
      { success: false, code: 'INTERNAL_ERROR', message: 'Gagal menyimpan pengaturan branding' },
      { status: 500 }
    );
  }
}
