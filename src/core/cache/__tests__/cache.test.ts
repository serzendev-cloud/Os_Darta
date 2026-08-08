/* eslint-disable @typescript-eslint/no-unused-vars */
// ========================================
// Multi-Tenant Redis Cache Wrapper Unit Tests
// Traceability: CIP-WP-006 | Rule SMB-221
// ========================================

import { describe, it, expect, beforeEach } from 'vitest';
import { TenantAwareCacheManager, CacheClient } from '../tenant-cache';

class MockCacheClient implements CacheClient {
  public store = new Map<string, string>();
  public sets = new Map<string, Set<string>>();

  public async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  public async set(key: string, value: string, _expirySeconds?: number): Promise<void> {
    this.store.set(key, value);
  }

  public async del(key: string): Promise<void> {
    this.store.delete(key);
    // Also clean up any references to this key from tag sets to simulate Redis behavior
    for (const [tagKey, members] of this.sets.entries()) {
      if (members.has(key)) {
        members.delete(key);
        if (members.size === 0) {
          this.sets.delete(tagKey);
        }
      }
    }
  }

  public async sadd(key: string, member: string): Promise<void> {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    this.sets.get(key)!.add(member);
  }

  public async smembers(key: string): Promise<string[]> {
    const s = this.sets.get(key);
    return s ? Array.from(s) : [];
  }
}

describe('Multi-Tenant Cache Manager', () => {
  let mockClient: MockCacheClient;
  let manager: TenantAwareCacheManager;

  beforeEach(() => {
    mockClient = new MockCacheClient();
    manager = new TenantAwareCacheManager(mockClient);
  });

  it('should automatically namespace keys with the active tenant ID', async () => {
    await manager.set('pesantren-a', 'config', 'value-a');

    // Verify key in raw store is prefixed
    const rawVal = await mockClient.get('tenant:pesantren-a:config');
    expect(rawVal).toBe('value-a');

    // Retrieve via manager
    const managerVal = await manager.get('pesantren-a', 'config');
    expect(managerVal).toBe('value-a');
  });

  it('should prevent cross-tenant key reads (isolation check)', async () => {
    await manager.set('pesantren-a', 'profile', 'profile-details-a');
    await manager.set('pesantren-b', 'profile', 'profile-details-b');

    // Tenant B must not be able to read Tenant A's cached key
    const valAForB = await manager.get('pesantren-b', 'tenant:pesantren-a:profile');
    expect(valAForB).toBeNull(); // Because the manager enforces B's prefix to A's input

    // Confirm direct lookups resolve correct values
    expect(await manager.get('pesantren-a', 'profile')).toBe('profile-details-a');
    expect(await manager.get('pesantren-b', 'profile')).toBe('profile-details-b');
  });

  it('should track key associations using tenant-isolated sets', async () => {
    await manager.set('pesantren-a', 'santri:1', 'ahmad', ['santri_profile', 'academic']);
    await manager.set('pesantren-a', 'santri:2', 'fatimah', ['santri_profile']);

    // Check tag set membership inside mock client
    const santriTagKeys = await mockClient.smembers('tenant:pesantren-a:tags:santri_profile');
    expect(santriTagKeys).toContain('tenant:pesantren-a:santri:1');
    expect(santriTagKeys).toContain('tenant:pesantren-a:santri:2');

    const academicTagKeys = await mockClient.smembers('tenant:pesantren-a:tags:academic');
    expect(academicTagKeys).toContain('tenant:pesantren-a:santri:1');
    expect(academicTagKeys).not.toContain('tenant:pesantren-a:santri:2');
  });

  it('should isolate tag invalidation boundaries between different tenants', async () => {
    // Write same tag name under different tenants
    await manager.set('pesantren-a', 'data-1', 'value-a-1', ['shared_tag']);
    await manager.set('pesantren-b', 'data-1', 'value-b-1', ['shared_tag']);

    // Invalidate the tag under Tenant A only
    await manager.invalidateByTag('pesantren-a', 'shared_tag');

    // Tenant A's cached item must be deleted
    expect(await manager.get('pesantren-a', 'data-1')).toBeNull();

    // Tenant B's cached item must remain untouched
    expect(await manager.get('pesantren-b', 'data-1')).toBe('value-b-1');
  });

  it('should prevent cache collisions across multiple simulated concurrent tenant threads', async () => {
    const threadCount = 10;
    const operations: Promise<void>[] = [];

    for (let i = 1; i <= threadCount; i++) {
      const tenantId = `tenant-${i}`;
      operations.push(
        (async () => {
          await manager.set(tenantId, 'key', `value-for-${tenantId}`, [`tag-${tenantId}`]);
          const value = await manager.get(tenantId, 'key');
          expect(value).toBe(`value-for-${tenantId}`);
        })()
      );
    }

    await Promise.all(operations);

    // Verify all keys remain isolated in the raw store
    expect(mockClient.store.size).toBe(threadCount);
  });
});
