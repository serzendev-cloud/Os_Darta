import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';

const env = dotenv.parse(fs.readFileSync('.env.local'));
const u = new URL(env.DATABASE_URL);
u.port = '5432';
const sql = postgres(u.toString(), { prepare: false, ssl: 'require' });

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PREVIEW_EMAILS = [
  'preview.developer@madev.id',
  'preview.superadmin@madev.id',
  'preview.admin@madev.id',
  'preview.musyrif@madev.id',
  'preview.wali@madev.id',
  'preview.santri@madev.id',
];

async function teardown() {
  console.log('=== STARTING ROLE PREVIEW TEARDOWN ===');

  // Safety preflight check: ensure no production accounts are in list
  for (const email of PREVIEW_EMAILS) {
    if (!email.startsWith('preview.') || !email.endsWith('@madev.id')) {
      throw new Error(`CRITICAL ABORT: Unsafe email in preview list: ${email}`);
    }
  }

  // 1. Delete isolated preview relationships and domain data
  const delSantri = await sql`DELETE FROM public.santri WHERE id = 'santri_preview_001' RETURNING id;`;
  console.log(`Deleted santri: ${delSantri.length} rows`);

  const delAsrama = await sql`DELETE FROM public.asrama WHERE id = 'asrama_preview_001' RETURNING id;`;
  console.log(`Deleted asrama: ${delAsrama.length} rows`);

  // 2. Query preview user IDs
  const previewUsers = await sql`
    SELECT id, email FROM public.users 
    WHERE email = ANY(${PREVIEW_EMAILS})
  `;
  const previewUserIds = previewUsers.map(u => u.id);
  console.log(`Identified ${previewUserIds.length} preview users in public.users`);

  if (previewUserIds.length > 0) {
    // 3. Delete memberships & platform roles
    const delUtm = await sql`
      DELETE FROM public.user_tenant_memberships 
      WHERE user_id = ANY(${previewUserIds})
      RETURNING id;
    `;
    console.log(`Deleted user_tenant_memberships: ${delUtm.length} rows`);

    const delUpr = await sql`
      DELETE FROM public.user_platform_roles 
      WHERE user_id = ANY(${previewUserIds})
      RETURNING id;
    `;
    console.log(`Deleted user_platform_roles: ${delUpr.length} rows`);

    // 4. Delete public.users
    const delPub = await sql`
      DELETE FROM public.users 
      WHERE id = ANY(${previewUserIds})
      RETURNING id;
    `;
    console.log(`Deleted public.users: ${delPub.length} rows`);
  }

  // 5. Delete Supabase Auth users
  const authList = await supabaseAdmin.auth.admin.listUsers();
  for (const authUser of authList.data.users) {
    if (PREVIEW_EMAILS.includes(authUser.email)) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.id);
      console.log(`Deleted Supabase Auth user: ${authUser.email} (${authUser.id})`);
    }
  }

  // 6. Delete preview tenant roles
  const delRoles = await sql`
    DELETE FROM public.tenant_roles 
    WHERE id LIKE 'role_%_t_1789172137858_9g7lm' AND role_code IN ('MUSYRIF', 'WALI', 'SANTRI')
    RETURNING id;
  `;
  console.log(`Deleted preview tenant roles: ${delRoles.length} rows`);

  // 7. Verification check
  const remainingPreview = await sql`
    SELECT count(*) FROM public.users WHERE email = ANY(${PREVIEW_EMAILS})
  `;
  console.log(`Remaining preview users in public.users: ${remainingPreview[0].count}`);

  const prodSuperAdmin = await sql`
    SELECT id, email, status FROM public.users WHERE email = 'superadmin@madev.id'
  `;
  console.log(`Production superadmin status: ${prodSuperAdmin[0]?.email} (${prodSuperAdmin[0]?.status})`);

  await sql.end();
  console.log('=== ROLE PREVIEW TEARDOWN COMPLETED CLEANLY ===');
}

teardown().catch(err => {
  console.error('Teardown failed:', err);
  process.exit(1);
});
