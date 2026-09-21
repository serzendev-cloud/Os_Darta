// =============================================================================
// EEOS Auth Callback Handler
// Validates cryptographic token_hash from Supabase Auth invitation links
// Traceability: WP-TENANT-PROVISIONING-INVITATION-DESIGN-001-REVISION-002
// =============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as 'invite' | 'recovery' | 'email' | null;
  const rawNext = requestUrl.searchParams.get('next') || '/auth/set-password';

  // Strict anti-open-redirect validation: must begin with single '/', no '//', no '://'
  let safeNext = '/auth/set-password';
  if (
    rawNext.startsWith('/') &&
    !rawNext.startsWith('//') &&
    !rawNext.includes('://')
  ) {
    safeNext = rawNext;
  }

  if (token_hash && type) {
    const response = NextResponse.redirect(new URL(safeNext, request.url));

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

    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (!error) {
      return response;
    }

    console.warn('[AuthCallback] verifyOtp failed with message:', error.message);
  }

  // Fallback if verification fails or token expired
  return NextResponse.redirect(new URL('/login?error=invitation_expired', request.url));
}
