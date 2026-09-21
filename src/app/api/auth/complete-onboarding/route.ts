// =============================================================================
// EEOS Complete Onboarding API Route
// Transitions User Status from INVITED to ACTIVE upon first password creation
// Traceability: WP-TENANT-PROVISIONING-INVITATION-DESIGN-001-REVISION-002
// =============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
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

    // 2. Atomically transition public.users status from INVITED to ACTIVE
    await db
      .update(users)
      .set({
        status: 'ACTIVE',
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, user.id), eq(users.status, 'INVITED')));

    return NextResponse.json({
      success: true,
      message: 'Akun administrator berhasil diaktifkan.',
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
