import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenants, tenantSettings } from '@/lib/db/schema';

// ── Vitest Mocks ─────────────────────────────────────────────────────────────
const { mockHeadersGet, mockSelect } = vi.hoisted(() => ({
  mockHeadersGet: vi.fn(),
  mockSelect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockImplementation(async () => ({
    get: mockHeadersGet,
  })),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: mockSelect,
  },
}));

import {
  getTenantContext,
  DEFAULT_TENANT,
  TenantNotFoundError,
  TenantUnavailableError,
} from '@/lib/tenant/context';

describe('WP-LIVE-PREVIEW-TENANT-DOMAIN-E2E-VERIFICATION-001 — Phase A: Tenant Context Resolution Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── CONTRACT 1: Explicit 'default' slug ─────────────────────────────────────
  it('should return DEFAULT_TENANT without querying the database when slug is explicit "default"', async () => {
    mockHeadersGet.mockReturnValue('default');

    const result = await getTenantContext();

    expect(result).toEqual(DEFAULT_TENANT);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should throw TenantNotFoundError when slug header is missing (null), never returning DEFAULT_TENANT', async () => {
    mockHeadersGet.mockReturnValue(null);

    let thrownError: any = null;
    try {
      await getTenantContext();
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(TenantNotFoundError);
    expect(thrownError.name).toBe('TenantNotFoundError');
    expect(thrownError).not.toEqual(DEFAULT_TENANT);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('should throw TenantNotFoundError when slug header is empty or whitespace-only, never returning DEFAULT_TENANT', async () => {
    mockHeadersGet.mockReturnValue('   ');

    let thrownError: any = null;
    try {
      await getTenantContext();
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(TenantNotFoundError);
    expect(thrownError.name).toBe('TenantNotFoundError');
    expect(thrownError).not.toEqual(DEFAULT_TENANT);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  // ── CONTRACT 2 & 6: Valid tenant produces canonical DB ID & queries settings with canonical ID ──
  it('should resolve valid tenant with canonical database ID distinct from slug, and query settings with canonical ID', async () => {
    mockHeadersGet.mockReturnValue('pesantren-al-fatih');

    const canonicalTenantId = 'tenant-uuid-canonical-999';
    const mockTenantDoc = {
      id: canonicalTenantId,
      name: 'Pesantren Al-Fatih',
      slug: 'pesantren-al-fatih',
      domain: 'alfatih.mahad.com',
    };

    const mockSettingsDoc = {
      id: 'settings-001',
      tenantId: canonicalTenantId,
      customLogoUrl: 'https://cdn.example.com/logo.png',
      customBgUrl: 'https://cdn.example.com/bg.png',
      primaryColor: '#0F766E',
      tagline: 'Mencetak Generasi Qurani',
      flipSecretKey: 'secret-key-1',
      flipValidationToken: 'val-token-1',
      gdriveServiceAccountJson: '{"type":"service_account"}',
      waGatewayApiKey: 'wa-key-1',
      loginTitle: 'Masuk Al-Fatih',
      loginSubtitle: 'Portal Pesantren',
      loginDescription: 'Silakan login',
    };

    const mockTenantWhere = vi.fn().mockResolvedValue([mockTenantDoc]);
    const mockSettingsWhere = vi.fn().mockResolvedValue([mockSettingsDoc]);

    mockSelect.mockImplementation(() => ({
      from: vi.fn((table: any) => ({
        where: table === tenants ? mockTenantWhere : mockSettingsWhere,
      })),
    }));

    const result = await getTenantContext();

    // Verification: canonical ID from database is returned and distinct from slug
    expect(result.id).toBe(canonicalTenantId);
    expect(result.id).not.toBe(result.slug);
    expect(result.slug).toBe('pesantren-al-fatih');
    expect(result.name).toBe('Pesantren Al-Fatih');
    expect(result.domain).toBe('alfatih.mahad.com');
    expect(result.settings?.primaryColor).toBe('#0F766E');
    expect(result.settings?.tagline).toBe('Mencetak Generasi Qurani');

    // Contract 6: Query settings tenant must use tenantDoc.id (canonical ID)
    expect(mockSettingsWhere).toHaveBeenCalledTimes(1);
    const settingsCondition = mockSettingsWhere.mock.calls[0][0];
    
    // Inspect Drizzle queryChunks to verify param is the canonical ID, not slug
    const paramChunk = settingsCondition.queryChunks?.find(
      (chunk: any) => chunk.value === canonicalTenantId
    );
    expect(paramChunk).toBeDefined();
    expect(paramChunk.value).toBe(canonicalTenantId);

    const slugChunk = settingsCondition.queryChunks?.find(
      (chunk: any) => chunk.value === 'pesantren-al-fatih'
    );
    expect(slugChunk).toBeUndefined();
  });

  it('should fall back to default settings branding if settings row is absent, without throwing', async () => {
    mockHeadersGet.mockReturnValue('al-fatih');

    const canonicalTenantId = 't-uuid-222';
    mockSelect.mockImplementation(() => ({
      from: vi.fn((table: any) => ({
        where: vi.fn(async () => {
          if (table === tenants) {
            return [{ id: canonicalTenantId, name: 'Al Fatih', slug: 'al-fatih', domain: null }];
          }
          if (table === tenantSettings) {
            return []; // No settings row
          }
          return [];
        }),
      })),
    }));

    const result = await getTenantContext();

    expect(result.id).toBe(canonicalTenantId);
    expect(result.settings).toEqual(DEFAULT_TENANT.settings);
  });

  // ── CONTRACT 3 & 5: Unknown slug throws TenantNotFoundError, not DEFAULT_TENANT ──
  it('should throw TenantNotFoundError when slug is not found in database, never returning DEFAULT_TENANT', async () => {
    mockHeadersGet.mockReturnValue('non-existent-tenant');

    mockSelect.mockImplementation(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => []), // Not found in tenants table
      })),
    }));

    let thrownError: any = null;
    try {
      await getTenantContext();
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(TenantNotFoundError);
    expect(thrownError.name).toBe('TenantNotFoundError');
    expect(thrownError.slug).toBe('non-existent-tenant');
    expect(thrownError).not.toEqual(DEFAULT_TENANT);
  });

  // ── CONTRACT 4 & 5: Tenant query throws TenantUnavailableError, not DEFAULT_TENANT ──
  it('should throw TenantUnavailableError when tenant database query throws, never returning DEFAULT_TENANT', async () => {
    mockHeadersGet.mockReturnValue('al-fatih');

    mockSelect.mockImplementation(() => ({
      from: vi.fn((table: any) => ({
        where: vi.fn(async () => {
          if (table === tenants) {
            throw new Error('Postgres connection pool exhausted');
          }
          return [];
        }),
      })),
    }));

    let thrownError: any = null;
    try {
      await getTenantContext();
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(TenantUnavailableError);
    expect(thrownError.name).toBe('TenantUnavailableError');
    expect(thrownError.message).toContain('al-fatih');
    expect(thrownError).not.toEqual(DEFAULT_TENANT);
  });

  // ── CONTRACT 4 & 5: Settings query throws TenantUnavailableError, not DEFAULT_TENANT ──
  it('should throw TenantUnavailableError when tenantSettings database query throws, never returning DEFAULT_TENANT', async () => {
    mockHeadersGet.mockReturnValue('al-fatih');

    const canonicalTenantId = 'tenant-uuid-111';
    mockSelect.mockImplementation(() => ({
      from: vi.fn((table: any) => ({
        where: vi.fn(async () => {
          if (table === tenants) {
            return [{ id: canonicalTenantId, name: 'Al-Fatih', slug: 'al-fatih', domain: null }];
          }
          if (table === tenantSettings) {
            throw new Error('Timeout querying tenant_settings');
          }
          return [];
        }),
      })),
    }));

    let thrownError: any = null;
    try {
      await getTenantContext();
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeDefined();
    expect(thrownError).toBeInstanceOf(TenantUnavailableError);
    expect(thrownError.name).toBe('TenantUnavailableError');
    expect(thrownError.message).toContain(canonicalTenantId);
    expect(thrownError).not.toEqual(DEFAULT_TENANT);
  });
});
