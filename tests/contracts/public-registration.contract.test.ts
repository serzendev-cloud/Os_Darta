/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../../src/app/api/saas/register/route';
import { tenantProvisioningService } from '../../src/modules/saas/services/tenant-provisioning-service';
import type { ProvisionTenantResult } from '../../src/modules/saas/services/tenant-provisioning-service';

describe('WP-SAAS-REGISTRATION-IMPLEMENTATION-001 — Public Registration API Contracts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const validPayload = {
    name: 'Pesantren Darul Ulum',
    slug: 'darul-ulum',
    location: 'Jombang, Jawa Timur',
    ownerName: 'KH. Ahmad Dahlan',
    ownerEmail: 'admin@darululum.id',
    ownerPhone: '081234567890',
  };

  const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost:3000/api/saas/register', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
        ...headers,
      },
      body: JSON.stringify(body),
    });
  };

  // ── 1. Successful Public Registration ─────────────────────────────────────
  it('1. Successfully provisions tenant via canonical engine and returns safe 201 DTO', async () => {
    const mockProvisionResult: ProvisionTenantResult = {
      success: true,
      status: 'PROVISIONED',
      tenant: {
        id: 't_mock_123',
        name: validPayload.name,
        slug: validPayload.slug,
        code: 'SR2601',
        domain: `${validPayload.slug}.madev.id`,
        location: validPayload.location,
        plan: 'Pro SaaS',
        status: 'aktif',
        createdAt: new Date().toISOString(),
      },
      admin: {
        userId: 'auth_user_mock_123',
        name: validPayload.ownerName,
        email: validPayload.ownerEmail,
        phone: validPayload.ownerPhone,
        invitationStatus: 'SENT',
        loginUrl: `https://${validPayload.slug}.madev.id/login`,
      },
    };

    vi.spyOn(tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });
    const provisionSpy = vi.spyOn(tenantProvisioningService, 'provisionTenant').mockResolvedValue(mockProvisionResult);

    const req = createMockRequest(validPayload);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.message).toContain('Pesantren Darul Ulum');
    expect(json.data.tenantName).toBe('Pesantren Darul Ulum');
    expect(json.data.tenantSlug).toBe('darul-ulum');
    expect(json.data.domain).toBe('darul-ulum.madev.id');
    expect(json.data.ownerEmail).toBe('admin@darululum.id');
    expect(json.data.nextStep).toBe('ONBOARDING');

    // Zero-Secret Policy: temporaryPassword and sensitive auth data MUST NOT leak
    expect(json.data.temporaryPassword).toBeUndefined();
    expect(json.data.admin).toBeUndefined();
    expect(json.data.token).toBeUndefined();
    expect(json.data.secret).toBeUndefined();
    expect(json.data.serviceRole).toBeUndefined();

    // Verify canonical engine was invoked with unprivileged public actor
    expect(provisionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validPayload.name,
        slug: validPayload.slug,
        ownerEmail: validPayload.ownerEmail,
      }),
      expect.objectContaining({
        userId: 'system:public-registration',
        role: 'public_guest',
      })
    );
  });

  // ── 2. Client Trust Rejection (Zero-Trust) ────────────────────────────────
  it('2. Discards and ignores client-supplied tenantId, role, isSuperAdmin, or initialPassword', async () => {
    vi.spyOn(tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });
    const provisionSpy = vi.spyOn(tenantProvisioningService, 'provisionTenant').mockResolvedValue({
      success: true,
      status: 'PROVISIONED',
      tenant: {
        id: 't_canonical_123',
        name: validPayload.name,
        slug: validPayload.slug,
        code: 'SR2601',
        domain: 'darul-ulum.madev.id',
        location: validPayload.location,
        plan: 'Pro SaaS',
        status: 'aktif',
        createdAt: new Date().toISOString(),
      },
      admin: {
        userId: 'uid_canonical',
        name: validPayload.ownerName,
        email: validPayload.ownerEmail,
        phone: null,
        invitationStatus: 'SENT',
        loginUrl: '',
      },
    });

    const maliciousPayload = {
      ...validPayload,
      tenantId: 'hacked_tenant_id',
      role: 'super_admin',
      isSuperAdmin: true,
      initialPassword: 'AttackerInjectedPassword123!',
      modules: { paymentGateway: true },
    };

    const req = createMockRequest(maliciousPayload);
    const res = await POST(req);
    expect(res.status).toBe(201);

    // Verify injected fields were not forwarded to canonical provisionTenant
    expect(provisionSpy).toHaveBeenCalledWith(
      expect.not.objectContaining({
        tenantId: 'hacked_tenant_id',
        role: 'super_admin',
        isSuperAdmin: true,
        initialPassword: 'AttackerInjectedPassword123!',
      }),
      expect.anything()
    );
  });

  // ── 3. Input Validations ──────────────────────────────────────────────────
  it('3. Rejects missing or invalid institution name (< 3 chars)', async () => {
    const req = createMockRequest({ ...validPayload, name: 'AB' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.field).toBe('name');
  });

  it('4. Rejects invalid slug syntax (uppercase, special characters, spaces)', async () => {
    const req = createMockRequest({ ...validPayload, slug: 'Darul Ulum!' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.field).toBe('slug');
  });

  it('5. Rejects reserved platform hostnames/slugs (e.g. www, admin, api, saas)', async () => {
    const reservedSlugs = ['www', 'admin', 'api', 'saas', 'dashboard', 'mail'];
    for (const slug of reservedSlugs) {
      const req = createMockRequest({ ...validPayload, slug });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.message).toContain('dicadangkan');
      expect(json.field).toBe('slug');
    }
  });

  it('6. Rejects invalid email syntax', async () => {
    const req = createMockRequest({ ...validPayload, ownerEmail: 'invalid-email-format' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.field).toBe('ownerEmail');
  });

  it('7. Rejects missing ownerName', async () => {
    const req = createMockRequest({ ...validPayload, ownerName: ' ' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.field).toBe('ownerName');
  });

  // ── 4. Duplicate Conflicts (409) ──────────────────────────────────────────
  it('8. Returns HTTP 409 Conflict when slug is already taken', async () => {
    vi.spyOn(tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({
      available: false,
      conflictField: 'slug',
      message: "Subdomain / Slug 'darul-ulum' sudah digunakan oleh pesantren lain.",
    });

    const req = createMockRequest(validPayload);
    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Conflict');
    expect(json.field).toBe('slug');
    expect(json.message).toContain('sudah digunakan');
  });

  it('9. Returns HTTP 409 Conflict when email is already registered', async () => {
    vi.spyOn(tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({
      available: false,
      conflictField: 'email',
      message: "Email 'admin@darululum.id' sudah terdaftar sebagai pengguna di platform.",
    });

    const req = createMockRequest(validPayload);
    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Conflict');
    expect(json.field).toBe('email');
    expect(json.message).toContain('sudah terdaftar');
  });

  // ── 5. Safe Error Sanitization ────────────────────────────────────────────
  it('10. Sanitizes internal system failures and hides SQL/stack trace (HTTP 500)', async () => {
    vi.spyOn(tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });
    vi.spyOn(tenantProvisioningService, 'provisionTenant').mockRejectedValue(
      new Error('relation "tenants" violates unique constraint on internal_pg_idx (SQL 23505)')
    );

    const req = createMockRequest(validPayload);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('InternalServerError');
    expect(json.message).not.toContain('SQL');
    expect(json.message).not.toContain('23505');
    expect(json.message).not.toContain('internal_pg_idx');
    expect(json.message).toContain('kendala sistem');
  });

  // ── 6. Actor Attribution Security (WP-SAAS-REGISTRATION-AUDIT-ACTOR-REMEDIATION-001) ──
  it('11. Discards client-injected role, user_role, actorRole, or isSuperAdmin and strictly passes public_guest', async () => {
    vi.spyOn(tenantProvisioningService, 'checkTenantAvailability').mockResolvedValue({ available: true });
    const provisionSpy = vi.spyOn(tenantProvisioningService, 'provisionTenant').mockResolvedValue({
      success: true,
      status: 'PROVISIONED',
      tenant: {
        id: 't_mock_sec',
        name: validPayload.name,
        slug: validPayload.slug,
        code: 'SR2601',
        domain: 'darul-ulum.madev.id',
        location: validPayload.location,
        plan: 'Pro SaaS',
        status: 'aktif',
        createdAt: new Date().toISOString(),
      },
      admin: {
        userId: 'uid_sec',
        name: validPayload.ownerName,
        email: validPayload.ownerEmail,
        phone: null,
        invitationStatus: 'SENT',
        loginUrl: '',
      },
    });

    const maliciousActorPayload = {
      ...validPayload,
      role: 'SUPER_ADMIN',
      user_role: 'SUPER_ADMIN',
      isSuperAdmin: true,
      actorRole: 'SUPER_ADMIN',
      actor: { role: 'SUPER_ADMIN', user_role: 'SUPER_ADMIN' },
    };

    const req = createMockRequest(maliciousActorPayload);
    const res = await POST(req);
    expect(res.status).toBe(201);

    // Assert that the actor context sent to provisionTenant is strictly the unprivileged public actor
    expect(provisionSpy).toHaveBeenCalledWith(
      expect.anything(),
      {
        userId: 'system:public-registration',
        name: 'Public Self-Registration',
        role: 'public_guest',
      }
    );
  });
});
