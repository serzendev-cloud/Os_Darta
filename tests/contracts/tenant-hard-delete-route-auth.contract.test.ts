import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import * as authorizationService from '../../src/lib/authz/authorization-service';
import { tenantHardDeleteService } from '../../src/modules/saas/services/tenant-hard-delete-service';
import { GET, POST } from '../../src/app/api/saas/tenants/[id]/hard-delete/route';

describe('SaaS hard-delete route platform authorization', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(tenantHardDeleteService, 'planHardDelete').mockResolvedValue(
      {} as unknown as Awaited<ReturnType<typeof tenantHardDeleteService.planHardDelete>>
    );
    vi.spyOn(tenantHardDeleteService, 'executeHardDelete').mockResolvedValue(
      { tenantName: 'Test', tenantCode: 'T01' } as unknown as Awaited<ReturnType<typeof tenantHardDeleteService.executeHardDelete>>
    );
    vi.spyOn(authorizationService, 'authorizeCurrentPlatformRoles').mockResolvedValue({
      authorized: true,
      userId: 'db-authorized-user',
      role: 'SUPER_ADMIN',
    });
  });

  it('ignores forged role headers when the verified session has no platform role', async () => {
    vi.spyOn(authorizationService, 'authorizeCurrentPlatformRoles').mockResolvedValue({ authorized: false, status: 403 });
    const request = new NextRequest('http://localhost/api/saas/tenants/t1/hard-delete', {
      headers: { 'x-user-id': 'attacker', 'x-user-role': 'SUPER_ADMIN', 'x-is-super-admin': 'true' },
    });

    const response = await GET(request, { params: Promise.resolve({ id: 't1' }) });

    expect(response.status).toBe(403);
    expect(tenantHardDeleteService.planHardDelete).not.toHaveBeenCalled();
  });

  it('fails closed on authorization lookup failure before calling hard-delete service', async () => {
    vi.spyOn(authorizationService, 'authorizeCurrentPlatformRoles').mockResolvedValue({ authorized: false, status: 503 });
    const request = new NextRequest('http://localhost/api/saas/tenants/t1/hard-delete', { method: 'POST' });

    const response = await POST(request, { params: Promise.resolve({ id: 't1' }) });

    expect(response.status).toBe(503);
    expect(tenantHardDeleteService.executeHardDelete).not.toHaveBeenCalled();
  });

  it('preserves POST origin and confirmation guards after role authorization', async () => {
    const wrongOrigin = new NextRequest('http://localhost/api/saas/tenants/t1/hard-delete', {
      method: 'POST',
      headers: { origin: 'https://attacker.invalid', 'content-type': 'application/json' },
      body: JSON.stringify({ confirmationCode: 'DELETE-T01-test' }),
    });
    const originResponse = await POST(wrongOrigin, { params: Promise.resolve({ id: 't1' }) });
    expect(originResponse.status).toBe(403);
    expect(tenantHardDeleteService.executeHardDelete).not.toHaveBeenCalled();

    const missingCode = new NextRequest('http://localhost/api/saas/tenants/t1/hard-delete', {
      method: 'POST',
      headers: { origin: 'http://localhost', host: 'localhost', 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const codeResponse = await POST(missingCode, { params: Promise.resolve({ id: 't1' }) });
    expect(codeResponse.status).toBe(400);
    expect(tenantHardDeleteService.executeHardDelete).not.toHaveBeenCalled();
  });

  it('passes the database-authorized identity and role to the existing hard-delete engine', async () => {
    const request = new NextRequest('http://localhost/api/saas/tenants/t1/hard-delete', {
      method: 'POST',
      headers: { origin: 'http://localhost', host: 'localhost', 'content-type': 'application/json' },
      body: JSON.stringify({ confirmationCode: 'CONFIRM-T01' }),
    });

    await POST(request, { params: Promise.resolve({ id: 't1' }) });

    expect(tenantHardDeleteService.executeHardDelete).toHaveBeenCalledWith(
      expect.objectContaining({ targetTenantId: 't1', confirmationCode: 'CONFIRM-T01' }),
      expect.objectContaining({ userId: 'db-authorized-user', role: 'SUPER_ADMIN', isSuperAdmin: true })
    );
  });
});
