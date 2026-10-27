import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreateClient } = vi.hoisted(() => ({ mockCreateClient: vi.fn() }));

vi.mock('@/lib/supabase/server', () => ({ createClient: mockCreateClient }));

import { authorizeCurrentPlatformRoles } from '../../src/lib/authz/authorization-service';

function mockDatabase(options: { userStatus?: string | null; platformRole?: string | null; fail?: boolean } = {}) {
  return {
    select: vi.fn(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn(() => {
          if (options.fail) throw new Error('database unavailable');
          const columns = table as { email?: unknown; phone?: unknown };
          if (columns.email && columns.phone) {
            return {
              limit: vi.fn().mockResolvedValue(
                options.userStatus === null
                  ? []
                  : [{ id: 'verified-user', status: options.userStatus ?? 'ACTIVE' }]
              ),
            };
          }
          return {
            limit: vi.fn(),
          };
        }),
        innerJoin: vi.fn(() => ({
          where: vi.fn().mockResolvedValue(
            options.platformRole ? [{ roleName: options.platformRole }] : []
          ),
        })),
      })),
    })),
  } as unknown as NonNullable<Parameters<typeof authorizeCurrentPlatformRoles>[1]>;
}

describe('Current platform authorization security contracts', () => {
  beforeEach(() => vi.resetAllMocks());

  it('authorizes a valid session only when a matching database platform-role binding exists', async () => {
    mockCreateClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'verified-user' } }, error: null }) } });

    const result = await authorizeCurrentPlatformRoles(['SUPER_ADMIN', 'DEVELOPER'], mockDatabase({ platformRole: 'DEVELOPER' }));

    expect(result).toEqual({ authorized: true, userId: 'verified-user', role: 'DEVELOPER' });
  });

  it('does not grant SUPER_ADMIN from user_metadata when the database has no platform binding', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'verified-user', user_metadata: { role: 'SUPER_ADMIN' } } },
          error: null,
        }),
      },
    });

    const result = await authorizeCurrentPlatformRoles(['SUPER_ADMIN', 'DEVELOPER'], mockDatabase());

    expect(result).toEqual({ authorized: false, status: 403 });
  });

  it('rejects an anonymous or invalid session before looking up a role', async () => {
    mockCreateClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('invalid session') }) } });
    const database = mockDatabase({ platformRole: 'SUPER_ADMIN' });

    const result = await authorizeCurrentPlatformRoles(['SUPER_ADMIN'], database);

    expect(result).toEqual({ authorized: false, status: 401 });
    expect(database.select).not.toHaveBeenCalled();
  });

  it('rejects users without an allowed role and inactive application users', async () => {
    mockCreateClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'verified-user' } }, error: null }) } });

    await expect(authorizeCurrentPlatformRoles(['SUPER_ADMIN'], mockDatabase({ platformRole: 'DEVELOPER' })))
      .resolves.toEqual({ authorized: false, status: 403 });
    await expect(authorizeCurrentPlatformRoles(['SUPER_ADMIN'], mockDatabase({ userStatus: 'SUSPENDED', platformRole: 'SUPER_ADMIN' })))
      .resolves.toEqual({ authorized: false, status: 403 });
  });

  it('fails closed when the role lookup database is unavailable', async () => {
    mockCreateClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'verified-user' } }, error: null }) } });

    const result = await authorizeCurrentPlatformRoles(['SUPER_ADMIN'], mockDatabase({ fail: true }));

    expect(result).toEqual({ authorized: false, status: 503 });
  });
});
