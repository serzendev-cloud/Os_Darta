// =============================================================================
// EEOS Complete Onboarding API Route
// Atomically transitions User & Target Tenant Membership from INVITED to ACTIVE
// Traceability: WP-TENANT-INVITATION-LIFECYCLE-REMEDIATION-IMPLEMENTATION-001
// =============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { db } from '@/lib/db';
import { users, userTenantMemberships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // 1. Authenticate the caller session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', message: 'Sesi autentikasi tidak valid atau telah berakhir.' },
        { status: 401 }
      );
    }

    // 2. Derive trusted target tenant ID from authenticated context
    let targetTenantId: string | null =
      (user.app_metadata?.tenant_id as string) ||
      (user.user_metadata?.tenant_id as string) ||
      null;

    // If tenant_id was not in metadata or needs validation, verify against invited memberships
    if (!targetTenantId) {
      const invitedMemberships = await db
        .select({ tenantId: userTenantMemberships.tenantId })
        .from(userTenantMemberships)
        .where(
          and(
            eq(userTenantMemberships.userId, user.id),
            eq(userTenantMemberships.status, 'INVITED')
          )
        )
        .limit(1);

      if (invitedMemberships.length > 0) {
        targetTenantId = invitedMemberships[0].tenantId;
      }
    }

    // 3. Atomically transition public.users and target user_tenant_memberships from INVITED to ACTIVE
    await db.transaction(async (tx) => {
      // Transition global users status to ACTIVE
      await tx
        .update(users)
        .set({
          status: 'ACTIVE',
          updatedAt: new Date(),
        })
        .where(and(eq(users.id, user.id), eq(users.status, 'INVITED')));

      // Transition only the target tenant membership to ACTIVE
      if (targetTenantId) {
        await tx
          .update(userTenantMemberships)
          .set({
            status: 'ACTIVE',
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(userTenantMemberships.userId, user.id),
              eq(userTenantMemberships.tenantId, targetTenantId),
              eq(userTenantMemberships.status, 'INVITED')
            )
          );
      }
    });

    // 4. Update Supabase Auth server-controlled app_metadata so token claims reflect ACTIVE
    try {
      const supabaseAdmin = createAdminClient();
      if (typeof supabaseAdmin.auth?.admin?.updateUserById === 'function') {
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          app_metadata: {
            status: 'ACTIVE',
            ...(targetTenantId ? { tenant_id: targetTenantId } : {}),
          },
        });
      }
    } catch (adminErr) {
      console.warn('[CompleteOnboarding] Server app_metadata sync warning:', adminErr);
    }

    // 5. Update user_metadata for client-side state hydration
    try {
      await supabase.auth.updateUser({
        data: { status: 'ACTIVE' },
      });
    } catch (metaErr) {
      console.warn('[CompleteOnboarding] User metadata sync warning:', metaErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Akun administrator berhasil diaktifkan.',
      tenantId: targetTenantId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyelesaikan proses onboarding.';
    console.error('[CompleteOnboarding] Internal error:', message);
    return NextResponse.json(
      { success: false, error: 'InternalServerError', message },
      { status: 500 }
    );
  }
}

