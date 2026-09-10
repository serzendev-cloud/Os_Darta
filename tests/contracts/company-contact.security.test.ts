/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../../src/app/api/saas/company-contact/route';
import { platformSettingsService } from '../../src/lib/db/services/platformSettings';
import { auditLogService } from '../../src/lib/db/services/auditLog';

describe('WP-SAAS-COMPANY-CONTACT-EXECUTION-001 — Security & Boundary Contracts', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    // Reset platform settings to empty default
    await platformSettingsService.update({
      companyEmail: null,
      companyPhone: null,
      companyWhatsApp: null,
      companyWebsite: null,
    });
  });

  // 1. Valid Super Admin update
  it('1. Allows valid Super Admin to update platform company contact settings', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/company-contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        companyEmail: 'official@serzendev.cloud',
        companyPhone: '+6281200000000',
        companyWhatsApp: 'https://wa.me/6281200000000',
        companyWebsite: 'https://serzendev.cloud',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.companyName).toBe('SERZEN DEV');
    expect(json.data.companyEmail).toBe('official@serzendev.cloud');
  });

  // 2. Unauthenticated user denied
  it('2. Denies unauthenticated user (missing x-user-id)', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/company-contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        companyEmail: 'hacker@malicious.com',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  // 3. Tenant Admin denied
  it('3. Denies Tenant Admin (x-is-super-admin is missing/false)', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/company-contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'tenant_admin_99',
        'x-tenant-id': 'pesantren_alfatih',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        companyEmail: 'admin@pesantren-alfatih.com',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  // 4. Tenant User denied
  it('4. Denies Tenant User', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/company-contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'tenant_user_123',
        'x-user-role': 'USER',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        companyEmail: 'user@pesantren.com',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  // 5. Missing CSRF / Origin Header rejected
  it('5. Rejects mutation with untrusted origin or CSRF mismatch', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/company-contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://attacker-evil-domain.com',
      },
      body: JSON.stringify({
        companyEmail: 'evil@attacker.com',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('CSRF/Origin Mismatch');
  });

  // 6. Invalid Origin rejected
  it('6. Rejects explicit malicious cross-origin mutation', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/company-contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'app.mahad-app.com',
        'origin': 'https://evil-phishing-site.org',
      },
      body: JSON.stringify({
        companyEmail: 'hacked@evil.org',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  // 7. Invalid email format rejected
  it('7. Rejects malformed email address', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/company-contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        companyEmail: 'not-an-email-address',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Format email perusahaan tidak valid');
  });

  // 8. Invalid website URL format rejected
  it('8. Rejects malformed website URL', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/company-contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        companyWebsite: 'httpp://invalid-domain',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('URL Website harus diawali');
  });

  // 9. Dangerous URL protocol rejected
  it('9. Rejects dangerous URL protocol (javascript: injection)', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/company-contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        companyWebsite: 'javascript:alert(document.cookie)',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('tidak aman');
  });

  // 10. Enforces locked company name SERZEN DEV
  it('10. Enforces companyName = SERZEN DEV regardless of client attempts to override', async () => {
    const req = new NextRequest('http://localhost:3000/api/saas/company-contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_001',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        companyName: 'FAKE BRAND INC',
        companyEmail: 'valid@serzendev.cloud',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify stored service record
    const settings = await platformSettingsService.get();
    expect(settings.companyName).toBe('SERZEN DEV');
  });

  // 11. Public GET returns only safe public fields
  it('11. Public GET exposes only public-safe contact fields', async () => {
    // Populate settings first
    await platformSettingsService.update({
      companyEmail: 'contact@serzendev.cloud',
      companyPhone: '+628123456789',
      companyWhatsApp: 'https://wa.me/628123456789',
      companyWebsite: 'https://serzendev.cloud',
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({
      companyName: 'SERZEN DEV',
      companyEmail: 'contact@serzendev.cloud',
      companyPhone: '+628123456789',
      companyWhatsApp: 'https://wa.me/628123456789',
      companyWebsite: 'https://serzendev.cloud',
    });
    // Ensure no internal DB fields like id, created_at, or secrets exist
    expect(json.data.id).toBeUndefined();
    expect(json.data.createdAt).toBeUndefined();
  });

  // 12. Empty state safe return
  it('12. Handles empty/null contact state safely without error', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.companyName).toBe('SERZEN DEV');
    expect(json.data.companyEmail).toBeNull();
    expect(json.data.companyPhone).toBeNull();
    expect(json.data.companyWhatsApp).toBeNull();
    expect(json.data.companyWebsite).toBeNull();
  });

  // 13. Audit log is created upon successful mutation
  it('13. Creates an audit log entry on successful platform settings update', async () => {
    const spyAudit = vi.spyOn(auditLogService, 'log');

    const req = new NextRequest('http://localhost:3000/api/saas/company-contact', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-id': 'super_admin_007',
        'x-is-super-admin': 'true',
        'host': 'localhost:3000',
        'origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        companyEmail: 'audit@serzendev.cloud',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(spyAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'super_admin_007',
        entityType: 'system',
        entityId: 'platform_settings',
        action: 'update',
      })
    );
  });
});
