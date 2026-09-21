// ========================================
// EEOS — Role Preview Authentication Endpoint
// Super Admin SaaS Controlled Capability — Fail-Closed Boundary
// Traceability: WP-LOGIN-PREVIEW-PLATFORM-001 (Security Amendment)
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  createOriginTicket,
  validateOriginTicket,
  touchOriginTicket,
  COOKIE_PREVIEW_ORIGIN_TICKET,
} from '@/lib/authz/preview-origin-ticket';

export const runtime = 'nodejs';

// Allowlisted preview roles
const ALLOWED_PREVIEW_ROLES = new Set([
  'developer',
  'super_admin',
  'admin',
  'musyrif',
  'wali',
  'santri',
]);

const PREVIEW_ROLE_IDENTITIES: Record<string, { email: string; name: string }> = {
  developer: { email: 'preview.developer@madev.id', name: 'Developer Preview (Owner)' },
  super_admin: { email: 'preview.superadmin@madev.id', name: 'Super Admin Preview' },
  admin: { email: 'preview.admin@madev.id', name: 'Admin Pesantren Preview' },
  musyrif: { email: 'preview.musyrif@madev.id', name: 'Musyrif Asrama Preview' },
  wali: { email: 'preview.wali@madev.id', name: 'Wali Santri Preview' },
  santri: { email: 'preview.santri@madev.id', name: 'Santri Preview' },
};

export async function POST(request: NextRequest) {
  // 1. Strict Dual-Key Environment & Feature Flag Guard (Fail-Closed)
  const isPreviewEnabled = process.env.ROLE_PREVIEW_ENABLED === 'true';
  const isProduction = process.env.NODE_ENV === 'production';
  const isProductionPreviewAllowed = process.env.ROLE_PREVIEW_PRODUCTION_ALLOWED === 'true';

  if (!isPreviewEnabled || (isProduction && !isProductionPreviewAllowed)) {
    return NextResponse.json(
      { 
        success: false, 
        error: isProduction 
          ? 'Fitur Role Preview dinonaktifkan pada lingkungan produksi. Memerlukan otorisasi ganda (ROLE_PREVIEW_ENABLED=true & ROLE_PREVIEW_PRODUCTION_ALLOWED=true).'
          : 'Fitur Role Preview dinonaktifkan pada lingkungan ini (ROLE_PREVIEW_ENABLED !== true).'
      },
      { status: 403 }
    );
  }

  // 2. Initialize Edge-safe SSR Supabase Client to inspect caller session
  const pendingCookies: Array<{ name: string; value: string; options?: any }> = [];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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

  // 3. Server-Side Caller Authorization Boundary (Zero-Trust)
  let callerUser = null;
  try {
    const { data } = await supabase.auth.getUser();
    callerUser = data?.user ?? null;
  } catch {
    callerUser = null;
  }

  const existingTicketId = request.cookies.get(COOKIE_PREVIEW_ORIGIN_TICKET)?.value;
  const validatedOriginTicket = await validateOriginTicket(existingTicketId);

  // Determine if caller is authorized:
  // Allowed IF:
  // A) Caller is an authenticated Super Admin or Developer (initiating preview mode)
  // B) Caller is in an active preview session with a valid, unexpired, unconsumed origin ticket (switching persona)
  const callerRole = (
    callerUser?.app_metadata?.role ||
    callerUser?.user_metadata?.role ||
    ''
  ).toLowerCase();

  const isOriginSuperAdmin =
    callerUser &&
    (callerRole === 'super_admin' ||
      callerRole === 'developer' ||
      callerUser.email === 'superadmin@madev.id');

  const isSwitchingWithTicket =
    callerUser &&
    callerUser.email?.startsWith('preview.') &&
    validatedOriginTicket !== null;

  if (!isOriginSuperAdmin && !isSwitchingWithTicket) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Akses ditolak. Fitur Preview Platform hanya dapat diakses oleh Super Admin / Developer terautentikasi atau sesi preview aktif.',
        code: 'UNAUTHORIZED_CALLER',
      },
      { status: 403 }
    );
  }

  // 4. Parse & Validate Payload
  let body: { role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Format permintaan tidak valid.' },
      { status: 400 }
    );
  }

  const requestedRole = (body.role || '').toLowerCase().trim();
  if (!requestedRole || !ALLOWED_PREVIEW_ROLES.has(requestedRole)) {
    return NextResponse.json(
      {
        success: false,
        error: `Role preview "${requestedRole}" tidak dikenali atau tidak diizinkan.`,
      },
      { status: 400 }
    );
  }

  // 5. Resolve Dedicated Preview Identity
  const identity = PREVIEW_ROLE_IDENTITIES[requestedRole];
  if (!identity) {
    return NextResponse.json(
      { success: false, error: 'Konfigurasi identitas role preview tidak ditemukan.' },
      { status: 400 }
    );
  }

  // 6. Manage Opaque Origin Ticket (Zero Raw Token Storage)
  let activeTicketId = existingTicketId;
  if (!isSwitchingWithTicket && isOriginSuperAdmin) {
    // Brand new preview entry: issue a fresh opaque origin ticket
    const ticketRecord = await createOriginTicket(
      callerUser!.id,
      callerUser!.email!,
      callerRole || 'super_admin',
      requestedRole
    );
    activeTicketId = ticketRecord.ticketId;
  } else if (isSwitchingWithTicket && activeTicketId) {
    // Persona switch: touch / verify the active ticket within fixed 15-min TTL
    await touchOriginTicket(activeTicketId);
  }

  const previewSecret = process.env.ROLE_PREVIEW_SECRET || 'MaDev_RolePreview_2026!Sec#';
  const previewPassword = `${previewSecret}_${requestedRole}`;

  // 7. Authenticate Preview User via Supabase GoTrue Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email: identity.email,
    password: previewPassword,
  });

  if (error || !data.session) {
    return NextResponse.json(
      {
        success: false,
        error: `Gagal mengautentikasi identitas preview: ${error?.message || 'Sesi tidak terbentuk'}`,
        code: 'PREVIEW_AUTH_FAILED',
      },
      { status: 401 }
    );
  }

  // 8. Build HTTP Response
  const response = NextResponse.json({
    success: true,
    message: `Sesi Role Preview untuk ${identity.name} berhasil dibuat.`,
    redirectTo: '/dashboard',
    persona: requestedRole,
  });

  // Apply Supabase session cookies
  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  // Stamp Opaque Origin Ticket Cookie (HttpOnly, SameSite=Lax, Secure in production)
  if (activeTicketId) {
    response.cookies.set(COOKIE_PREVIEW_ORIGIN_TICKET, activeTicketId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: 15 * 60, // Fixed 15-minute TTL
    });
  }

  return response;
}
