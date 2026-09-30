// =============================================================================
// EEOS Password Recovery Request API
// Server-Only Enumeration-Resistant Password Reset Dispatcher
// Traceability: WP-AUTH-PASSWORD-RESET-FLOW-001
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, userTenantMemberships, tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createAdminClient } from '@/lib/supabase/admin';
import { resendService } from '@/lib/email/resend-service';
import { extractTenantSlug } from '@/proxy';
import { getTenantDomain } from '@/config/tenant';

export const runtime = 'nodejs';

/**
 * Standard neutral response strictly preserved across all branches
 * to prevent email enumeration or tenant existence leakage.
 */
const NEUTRAL_RESPONSE = {
  success: true,
  message: 'Jika email tersebut terdaftar, instruksi pemulihan password telah dikirim. Silakan periksa email Anda.',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const rawEmail = body?.email;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanEmail = rawEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: 'Format email tidak valid.' },
        { status: 400 }
      );
    }

    // 1. Look up user in database (Zero-leakage check)
    const userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        status: users.status,
      })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    const user = userRows[0];

    // Enumeration Defense: If user doesn't exist, return neutral response immediately
    if (!user) {
      return NextResponse.json(NEUTRAL_RESPONSE, { status: 200 });
    }

    // Security Gate: Protect MERGED, DISABLED, and SUSPENDED identities
    const normalizedStatus = (user.status || '').toUpperCase();
    if (
      normalizedStatus === 'MERGED' ||
      normalizedStatus === 'DISABLED' ||
      normalizedStatus === 'SUSPENDED'
    ) {
      console.warn(
        `[ForgotPassword] Password recovery barred for user ${user.id} with non-authenticating status: ${normalizedStatus}`
      );
      return NextResponse.json(NEUTRAL_RESPONSE, { status: 200 });
    }

    // Security Gate: INVITED users must complete onboarding invitation first
    if (normalizedStatus === 'INVITED') {
      console.warn(
        `[ForgotPassword] Password recovery requested for INVITED user ${user.id}; must complete onboarding first`
      );
      return NextResponse.json(NEUTRAL_RESPONSE, { status: 200 });
    }

    // 2. Resolve Tenant Context & Target Base URL
    const incomingSlug = extractTenantSlug(request);
    let targetDomain: string | null = null;
    let tenantName: string = "Ma'had Manager Platform";

    if (incomingSlug && incomingSlug !== 'default') {
      // Caller is on a tenant subdomain: e.g. pp-darunnajah.serzen-dev.my.id
      targetDomain = getTenantDomain(incomingSlug);
      const tenantRow = await db
        .select({ name: tenants.name })
        .from(tenants)
        .where(eq(tenants.slug, incomingSlug))
        .limit(1);

      if (tenantRow[0]?.name) {
        tenantName = tenantRow[0].name;
      }
    } else {
      // Check user's primary tenant membership
      const membershipRows = await db
        .select({
          tenantSlug: tenants.slug,
          tenantName: tenants.name,
        })
        .from(userTenantMemberships)
        .innerJoin(tenants, eq(userTenantMemberships.tenantId, tenants.id))
        .where(eq(userTenantMemberships.userId, user.id))
        .limit(1);

      if (membershipRows[0]) {
        targetDomain = getTenantDomain(membershipRows[0].tenantSlug);
        tenantName = membershipRows[0].tenantName;
      }
    }

    // Resolve base application URL for reset link
    const host = request.headers.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    let baseUrl: string;

    if (isLocal) {
      const proto = request.headers.get('x-forwarded-proto') || 'http';
      baseUrl = `${proto}://${host}`;
    } else if (targetDomain) {
      baseUrl = `https://${targetDomain}`;
    } else {
      baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.serzen-dev.my.id';
    }

    // 3. Generate Secure Recovery Link via Supabase Auth Admin API
    const supabaseAdmin = createAdminClient();
    const redirectTo = `${baseUrl}/auth/callback?type=recovery&next=/auth/reset-password`;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: {
        redirectTo,
      },
    });

    if (linkError) {
      console.error('[ForgotPassword] Failed to generate recovery link:', linkError.message);
      return NextResponse.json(NEUTRAL_RESPONSE, { status: 200 });
    }

    const hashedToken = linkData?.properties?.hashed_token;
    if (!hashedToken) {
      console.error('[ForgotPassword] Missing hashed_token in generateLink response');
      return NextResponse.json(NEUTRAL_RESPONSE, { status: 200 });
    }

    const resetUrl = `${baseUrl}/auth/callback?token_hash=${hashedToken}&type=recovery&next=/auth/reset-password`;

    // 4. Dispatch Email via Verified Resend Domain Service
    await resendService.sendPasswordResetEmail(cleanEmail, {
      userName: user.name || 'Pengguna',
      resetUrl,
      tenantName,
      appUrl: baseUrl,
    });

    return NextResponse.json(NEUTRAL_RESPONSE, { status: 200 });
  } catch (error) {
    console.error('[ForgotPassword] Unhandled exception:', error);
    return NextResponse.json(NEUTRAL_RESPONSE, { status: 200 });
  }
}
