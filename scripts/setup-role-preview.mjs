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

// Deterministic server-only secret for preview identities (NEVER exposed to client)
const PREVIEW_SECRET = env.ROLE_PREVIEW_SECRET || 'MaDev_RolePreview_2026!Sec#';
const TARGET_TENANT_ID = 't_1789172137858_9g7lm'; // Runtime Verification Tenant (RTV01)

const PREVIEW_IDENTITIES = [
  {
    roleKey: 'developer',
    email: 'preview.developer@madev.id',
    name: 'Developer Preview (Owner)',
    role: 'developer',
    scope: 'platform',
    platformRole: 'DEVELOPER',
  },
  {
    roleKey: 'super_admin',
    email: 'preview.superadmin@madev.id',
    name: 'Super Admin Preview',
    role: 'super_admin',
    scope: 'platform',
    platformRole: 'SUPER_ADMIN',
  },
  {
    roleKey: 'admin',
    email: 'preview.admin@madev.id',
    name: 'Admin Pesantren Preview',
    role: 'admin',
    scope: 'tenant',
    tenantRole: 'ADMIN',
  },
  {
    roleKey: 'musyrif',
    email: 'preview.musyrif@madev.id',
    name: 'Musyrif Asrama Preview',
    role: 'musyrif',
    scope: 'tenant',
    tenantRole: 'MUSYRIF',
  },
  {
    roleKey: 'wali',
    email: 'preview.wali@madev.id',
    name: 'Wali Santri Preview',
    role: 'wali',
    scope: 'tenant',
    tenantRole: 'WALI',
  },
  {
    roleKey: 'santri',
    email: 'preview.santri@madev.id',
    name: 'Santri Preview',
    role: 'santri',
    scope: 'tenant',
    tenantRole: 'SANTRI',
  },
];

async function setup() {
  console.log('=== STARTING ROLE PREVIEW PROVISIONING ===');

  // 1. Verify target tenant
  const tenantRows = await sql`SELECT id, name, slug, code, status FROM public.tenants WHERE id = ${TARGET_TENANT_ID}`;
  if (tenantRows.length === 0) {
    throw new Error(`Target tenant ${TARGET_TENANT_ID} not found!`);
  }
  console.log('Target Tenant Verified:', tenantRows[0]);

  // 2. Ensure tenant_roles exist for MUSYRIF, WALI, SANTRI
  const requiredRoles = [
    { code: 'ADMIN', name: 'Admin Pesantren' },
    { code: 'MUSYRIF', name: 'Musyrif Asrama' },
    { code: 'WALI', name: 'Wali Santri' },
    { code: 'SANTRI', name: 'Santri' },
  ];

  for (const r of requiredRoles) {
    const roleId = `role_${r.code.toLowerCase()}_${TARGET_TENANT_ID}`;
    const existing = await sql`SELECT id FROM public.tenant_roles WHERE tenant_id = ${TARGET_TENANT_ID} AND role_code = ${r.code}`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO public.tenant_roles (id, tenant_id, role_code, name, description, is_custom, status)
        VALUES (${roleId}, ${TARGET_TENANT_ID}, ${r.code}, ${r.name}, ${'Role preview ' + r.name}, false, 'ACTIVE')
      `;
      console.log(`Created tenant_role: ${roleId} (${r.code})`);
    } else {
      console.log(`Tenant role exists: ${existing[0].id} (${r.code})`);
    }
  }

  // 3. Provision Supabase Auth Users & public.users
  const userMap = {};

  for (const ident of PREVIEW_IDENTITIES) {
    const userPassword = `${PREVIEW_SECRET}_${ident.roleKey}`;
    
    // Check if user already exists in auth.users
    const authList = await supabaseAdmin.auth.admin.listUsers();
    let authUser = authList.data.users.find(u => u.email === ident.email);

    if (!authUser) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: ident.email,
        password: userPassword,
        email_confirm: true,
        user_metadata: {
          name: ident.name,
          role: ident.role,
          is_preview: true,
        },
        app_metadata: {
          role: ident.role,
          is_preview: true,
          tenant_id: ident.scope === 'tenant' ? TARGET_TENANT_ID : 'default',
        },
      });

      if (error) {
        throw new Error(`Failed to create auth user ${ident.email}: ${error.message}`);
      }
      authUser = data.user;
      console.log(`Created Supabase Auth user: ${ident.email} (${authUser.id})`);
    } else {
      // Ensure password and metadata are up to date
      await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        password: userPassword,
        email_confirm: true,
        user_metadata: { name: ident.name, role: ident.role, is_preview: true },
        app_metadata: { role: ident.role, is_preview: true, tenant_id: ident.scope === 'tenant' ? TARGET_TENANT_ID : 'default' },
      });
      console.log(`Updated Supabase Auth user: ${ident.email} (${authUser.id})`);
    }

    userMap[ident.roleKey] = authUser.id;

    // Sync into public.users
    const existingPub = await sql`SELECT id FROM public.users WHERE id = ${authUser.id} OR email = ${ident.email}`;
    if (existingPub.length === 0) {
      await sql`
        INSERT INTO public.users (id, name, email, role, status, tenant_id, child_santri_id)
        VALUES (${authUser.id}, ${ident.name}, ${ident.email}, ${ident.role}, 'ACTIVE', ${ident.scope === 'tenant' ? TARGET_TENANT_ID : 'default'}, ${ident.role === 'wali' ? 'santri_preview_001' : null})
      `;
      console.log(`Created public.users row: ${ident.email}`);
    } else {
      await sql`
        UPDATE public.users 
        SET name = ${ident.name}, role = ${ident.role}, status = 'ACTIVE', tenant_id = ${ident.scope === 'tenant' ? TARGET_TENANT_ID : 'default'}, child_santri_id = ${ident.role === 'wali' ? 'santri_preview_001' : null}
        WHERE id = ${authUser.id}
      `;
      console.log(`Updated public.users row: ${ident.email}`);
    }

    // Role Bindings
    if (ident.scope === 'platform') {
      const uprExists = await sql`SELECT id FROM public.user_platform_roles WHERE user_id = ${authUser.id} AND platform_role_id = ${ident.platformRole}`;
      if (uprExists.length === 0) {
        await sql`
          INSERT INTO public.user_platform_roles (id, user_id, platform_role_id, granted_by)
          VALUES (${'upr_' + authUser.id.replace(/-/g, '').slice(0, 12)}, ${authUser.id}, ${ident.platformRole}, 'preview_system')
        `;
        console.log(`Bound platform role ${ident.platformRole} for ${ident.email}`);
      }
    } else {
      const roleRow = await sql`SELECT id FROM public.tenant_roles WHERE tenant_id = ${TARGET_TENANT_ID} AND role_code = ${ident.tenantRole}`;
      if (roleRow.length > 0) {
        const utmExists = await sql`SELECT id FROM public.user_tenant_memberships WHERE user_id = ${authUser.id} AND tenant_id = ${TARGET_TENANT_ID}`;
        if (utmExists.length === 0) {
          await sql`
            INSERT INTO public.user_tenant_memberships (id, user_id, tenant_id, primary_role_id, status)
            VALUES (${'utm_' + authUser.id.replace(/-/g, '').slice(0, 12)}, ${authUser.id}, ${TARGET_TENANT_ID}, ${roleRow[0].id}, 'ACTIVE')
          `;
          console.log(`Bound tenant membership ${ident.tenantRole} for ${ident.email}`);
        }
      }
    }
  }

  // 4. Isolated Preview Asrama (matches live public.asrama schema)
  const asramaRows = await sql`SELECT id FROM public.asrama WHERE id = 'asrama_preview_001'`;
  if (asramaRows.length === 0) {
    await sql`
      INSERT INTO public.asrama (id, name, musyrif, capacity, filled, gender, status)
      VALUES ('asrama_preview_001', 'Asrama Preview Al-Fatih', 'Musyrif Asrama Preview', 30, 1, 'L', 'aktif')
    `;
    console.log('Created isolated asrama: asrama_preview_001');
  }

  // 5. Isolated Preview Santri (matches live public.santri schema)
  const santriRows = await sql`SELECT id FROM public.santri WHERE id = 'santri_preview_001'`;
  if (santriRows.length === 0) {
    await sql`
      INSERT INTO public.santri (
        id, tenant_id, user_id, nis, name, asrama, kamar, asrama_id, kamar_id, kelas,
        status, gender, wali_id, wali_name, wali_phone, join_date, asal_kota, asal_provinsi,
        angkatan_masuk, total_poin_pelanggaran, total_prestasi, status_karakter, status_sp
      ) VALUES (
        'santri_preview_001', ${TARGET_TENANT_ID}, ${userMap['santri']}, 'PREV001', 'Santri Preview Al-Fatih',
        'Asrama Preview Al-Fatih', 'Kamar 101', 'asrama_preview_001', 'kamar_prev_001', '10A',
        'aktif', 'L', ${userMap['wali']}, 'Wali Santri Preview', '081299990001', '2026-07-15',
        'Malang', 'Jawa Timur', 2026, 0, 85, 'Baik', 'Tidak Ada'
      )
    `;
    console.log('Created isolated santri: santri_preview_001');
  }

  await sql.end();
  console.log('=== ROLE PREVIEW PROVISIONING COMPLETED SUCCESSFULLY ===');
}

setup().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
