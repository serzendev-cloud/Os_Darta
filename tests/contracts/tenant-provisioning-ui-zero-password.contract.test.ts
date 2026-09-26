import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { POST as postSaasTenants } from '@/app/api/saas/tenants/route';
import { tenantProvisioningService } from '@/modules/saas/services/tenant-provisioning-service';

describe('WP-TENANT-PROVISIONING-UI-ZERO-PASSWORD-INGRESS-001 — Zero Password Ingress Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── TEST 1: UI File Static Verification ──────────────────────────────────
  it('1. Tenant Creation UI component strictly contains zero initial password fields or controls', () => {
    const pagePath = path.resolve(process.cwd(), 'src/app/dashboard/saas/tenants/page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    // Negative assertions: MUST NOT exist in the form UI
    expect(content).not.toMatch(/Kata Sandi Awal/i);
    expect(content).not.toMatch(/Generate Password Acak/i);
    expect(content).not.toMatch(/initialPassword/i);
    expect(content).not.toMatch(/temporaryPassword/i);
    expect(content).not.toMatch(/type=["']password["']/i);
    expect(content).not.toMatch(/Generate Password/i);
    expect(content).not.toMatch(/password sementara/i);
    expect(content).not.toMatch(/password awal admin/i);

    // Positive assertions: Form contains all 7 required business fields
    expect(content).toContain('Nama Pesantren');
    expect(content).toContain('Subdomain Target');
    expect(content).toContain('getTenantRootDomain()');
    expect(content).toContain('Lokasi (Kota/Prov)');
    expect(content).toContain('Paket SaaS');
    expect(content).toContain('Nama Kyai / Owner Pesantren');
    expect(content).toContain('Email Admin Pesantren');
    expect(content).toContain('No WhatsApp Owner');
    expect(content).toContain('Provisi & Aktifkan Tenant');
  });

  // ── TEST 2: API Rejection of initialPassword ──────────────────────────────
  it('2. Backend POST /api/saas/tenants rejects initialPassword ingress with HTTP 400', async () => {
    const request = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'usr-superadmin',
        'x-is-super-admin': 'true',
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Ponpes Darul Hijrah',
        slug: 'darulhijrah',
        ownerEmail: 'admin@darulhijrah.sch.id',
        ownerName: 'Kyai Ahmad',
        initialPassword: 'UnauthorizedInitialPassword123!',
      }),
    });

    const response = await postSaasTenants(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('BadRequest');
    expect(json.message).toContain('Penyediaan kata sandi awal tidak diperbolehkan');
  });

  // ── TEST 3: API Rejection of password ─────────────────────────────────────
  it('3. Backend POST /api/saas/tenants rejects password ingress with HTTP 400', async () => {
    const request = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'usr-superadmin',
        'x-is-super-admin': 'true',
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Ponpes Darul Hijrah',
        slug: 'darulhijrah',
        ownerEmail: 'admin@darulhijrah.sch.id',
        ownerName: 'Kyai Ahmad',
        password: 'DirectPasswordPayload123!',
      }),
    });

    const response = await postSaasTenants(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('BadRequest');
    expect(json.message).toContain('Penyediaan kata sandi awal tidak diperbolehkan');
  });

  // ── TEST 4: API Rejection of temporaryPassword ────────────────────────────
  it('4. Backend POST /api/saas/tenants rejects temporaryPassword ingress with HTTP 400', async () => {
    const request = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'usr-superadmin',
        'x-is-super-admin': 'true',
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Ponpes Darul Hijrah',
        slug: 'darulhijrah',
        ownerEmail: 'admin@darulhijrah.sch.id',
        ownerName: 'Kyai Ahmad',
        temporaryPassword: 'TempPassword123!',
      }),
    });

    const response = await postSaasTenants(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('BadRequest');
    expect(json.message).toContain('Penyediaan kata sandi awal tidak diperbolehkan');
  });

  // ── TEST 5: Canonical Zero-Password Provisioning Flow ─────────────────────
  it('5. Valid zero-password payload succeeds and returns only public tenant details without password leakage', async () => {
    const provisionSpy = vi.spyOn(tenantProvisioningService, 'provisionTenant').mockResolvedValue({
      success: true,
      status: 'PROVISIONED',
      tenant: {
        id: 't-test-1',
        name: 'Ponpes Darul Hijrah',
        slug: 'darulhijrah',
        code: 'SR2602',
        domain: 'darulhijrah.madev.id',
        location: 'Martapura',
        plan: 'Pro SaaS',
        status: 'aktif',
        createdAt: new Date().toISOString(),
      },
      admin: {
        userId: 'usr-admin-1',
        name: 'Kyai Ahmad',
        email: 'admin@darulhijrah.sch.id',
        phone: '081234567890',
        invitationStatus: 'SENT',
        loginUrl: 'https://darulhijrah.madev.id/login',
      },
    });

    const request = new NextRequest('http://localhost:3000/api/saas/tenants', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'usr-superadmin',
        'x-is-super-admin': 'true',
        host: 'localhost:3000',
        origin: 'http://localhost:3000',
      },
      body: JSON.stringify({
        name: 'Ponpes Darul Hijrah',
        slug: 'darulhijrah',
        location: 'Martapura',
        plan: 'Pro SaaS',
        ownerName: 'Kyai Ahmad',
        ownerEmail: 'admin@darulhijrah.sch.id',
        ownerPhone: '081234567890',
      }),
    });

    const response = await postSaasTenants(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.success).toBe(true);
    expect(provisionSpy).toHaveBeenCalledTimes(1);

    // Verify service payload does NOT have password fields
    const passedInput = provisionSpy.mock.calls[0][0];
    expect((passedInput as any).initialPassword).toBeUndefined();
    expect((passedInput as any).password).toBeUndefined();
    expect((passedInput as any).temporaryPassword).toBeUndefined();

    // Verify response does not leak credentials
    expect((json.data.admin as any).password).toBeUndefined();
    expect((json.data.admin as any).temporaryPassword).toBeUndefined();
    expect((json.data.admin as any).initialPassword).toBeUndefined();
  });

  // ── TEST 6: Onboarding Target Route Integrity ────────────────────────────
  it('6. Onboarding target page /auth/set-password is preserved for self-service password establishment', () => {
    const setPasswordPagePath = path.resolve(process.cwd(), 'src/app/auth/set-password/page.tsx');
    expect(fs.existsSync(setPasswordPagePath)).toBe(true);

    const content = fs.readFileSync(setPasswordPagePath, 'utf8');
    expect(content).toContain('Aktivasi Akun Administrator');
    expect(content).toContain('Kata Sandi Baru');
    expect(content).toContain('/api/auth/complete-onboarding');
  });
});
