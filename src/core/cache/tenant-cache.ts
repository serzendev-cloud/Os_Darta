// ========================================
// Multi-Tenant Redis Cache Manager Wrapper
// Traceability: CIP-WP-006 | ADR-WP006-001 | ADR-WP006-002
// ========================================

export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, expirySeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  sadd(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
}

export class TenantAwareCacheManager {
  private client: CacheClient;

  constructor(client: CacheClient) {
    this.client = client;
  }

  /**
   * Derives a tenant-isolated cache key namespace.
   */
  private getTenantKey(tenantId: string, key: string): string {
    return `tenant:${tenantId}:${key}`;
  }

  /**
   * Derives a tenant-isolated tag tracking set namespace.
   */
  private getTagKey(tenantId: string, tag: string): string {
    return `tenant:${tenantId}:tags:${tag}`;
  }

  /**
   * Gets a cached item by tenant and key.
   */
  public async get(tenantId: string, key: string): Promise<string | null> {
    const tenantKey = this.getTenantKey(tenantId, key);
    return await this.client.get(tenantKey);
  }

  /**
   * Sets a cached item by tenant and key, with optional tag set tracking and expiration.
   */
  public async set(
    tenantId: string,
    key: string,
    value: string,
    tags?: string[],
    expirySeconds?: number
  ): Promise<void> {
    const tenantKey = this.getTenantKey(tenantId, key);
    await this.client.set(tenantKey, value, expirySeconds);

    if (tags && tags.length > 0) {
      for (const tag of tags) {
        const tagKey = this.getTagKey(tenantId, tag);
        await this.client.sadd(tagKey, tenantKey);
      }
    }
  }

  /**
   * Deletes a cache key.
   */
  public async del(tenantId: string, key: string): Promise<void> {
    const tenantKey = this.getTenantKey(tenantId, key);
    await this.client.del(tenantKey);
  }

  /**
   * Invalidates all cached items associated with the given tag for the specific tenant.
   */
  public async invalidateByTag(tenantId: string, tag: string): Promise<void> {
    const tagKey = this.getTagKey(tenantId, tag);
    const keysToInvalidate = await this.client.smembers(tagKey);

    if (keysToInvalidate && keysToInvalidate.length > 0) {
      for (const k of keysToInvalidate) {
        await this.client.del(k);
      }
    }

    // Delete the tag tracking set itself
    await this.client.del(tagKey);
  }
}
