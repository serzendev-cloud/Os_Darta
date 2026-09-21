// ========================================
// EEOS — Role Preview Exit Endpoint
// Restores Original Super Admin Session via Opaque Origin Ticket
// Traceability: WP-LOGIN-PREVIEW-PLATFORM-001 (Security Amendment)
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import {
  consumeOriginTicket,
  COOKIE_PREVIEW_ORIGIN_TICKET,
} from '@/lib/authz/preview-origin-ticket';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // 1. Retrieve & Consume Origin Ticket (Single-Use Enforcement)
  const ticketId = request.cookies.get(COOKIE_PREVIEW_ORIGIN_TICKET)?.value;
  const originTicket = await consumeOriginTicket(ticketId);

  if (!originTicket) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Tiket sesi asal tidak valid, sudah digunakan, atau telah kedaluwarsa. Silakan login kembali.',
        code: 'INVALID_ORIGIN_TICKET',
      },
      { status: 403 }
    );
  }

  // 2. Initialize Supabase Admin Client to generate a single-use verification link
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseServiceKey) {
    return NextResponse.json(
      { success: false, error: 'Konfigurasi server otorisasi tidak lengkap.' },
      { status: 500 }
    );
  }

  const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: originTicket.originUserEmail,
  });

  if (linkError || !linkData.properties?.hashed_token) {
    return NextResponse.json(
      {
        success: false,
        error: `Gagal menghasilkan tiket pemulihan sesi: ${linkError?.message || 'Token hash tidak tersedia'}`,
        code: 'SESSION_RECOVERY_FAILED',
      },
      { status: 500 }
    );
  }

  // 3. Initialize SSR Client to bind restored session cookies directly to the response
  const pendingCookies: Array<{ name: string; value: string; options?: any }> = [];
  const ssrClient = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          pendingCookies.push({ name, value, options });
        });
      },
    },
  });

  // 4. Verify OTP using the cryptographic token hash to generate a legitimate Supabase Session
  const { error: verifyError } = await ssrClient.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  });

  if (verifyError) {
    return NextResponse.json(
      {
        success: false,
        error: `Gagal memverifikasi pemulihan sesi: ${verifyError.message}`,
        code: 'VERIFY_OTP_FAILED',
      },
      { status: 500 }
    );
  }

  // 5. Build Response, set fresh Super Admin session cookies & clear origin ticket
  const isProduction = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({
    success: true,
    message: `Sesi Super Admin (${originTicket.originUserEmail}) berhasil dipulihkan.`,
    redirectTo: '/dashboard/saas/preview',
  });

  // Apply restored Supabase session cookies
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  // Expire / delete origin ticket cookie
  response.cookies.set(COOKIE_PREVIEW_ORIGIN_TICKET, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 0,
  });

  return response;
}
