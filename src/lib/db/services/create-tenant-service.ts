// ========================================
// Universal Multi-Tenant Domain Service Factory
// ========================================

import { demoDb, isDemoMode } from '@/lib/mock-store';
import { getActiveTenantId, withTenant } from './tenant-service';

export interface BaseEntity {
  id: string;
  tenantId?: string;
}

export function createTenantService<T extends BaseEntity>(collectionName: string) {
  return {
    async get(id: string): Promise<T | null> {
      if (isDemoMode() || typeof window === 'undefined') {
        return demoDb.get<T>(collectionName, id);
      }
      try {
        const res = await fetch(`/api/db/query?collection=${encodeURIComponent(collectionName)}`);
        if (res.ok) {
          const json = await res.json();
          const found = (json.data as T[]).find((item) => item.id === id);
          if (found) return found;
        }
      } catch (e) {
        console.warn(`[TenantService:${collectionName}] get failed, using demoDb fallback:`, e);
      }
      return demoDb.get<T>(collectionName, id);
    },

    async create(data: Omit<T, 'id'>): Promise<string> {
      const activeTenantId = getActiveTenantId();
      const payload = withTenant(data as Record<string, any>, activeTenantId);

      if (isDemoMode() || typeof window === 'undefined') {
        return demoDb.create(collectionName, payload);
      }
      try {
        const res = await fetch('/api/db/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            collectionName,
            action: 'create',
            data: payload,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          // Keep demoDb in sync for instant UI re-renders
          demoDb.create(collectionName, { ...payload, id: json.id });
          return json.id;
        }
      } catch (e) {
        console.warn(`[TenantService:${collectionName}] create API failed, using demoDb fallback:`, e);
      }
      return demoDb.create(collectionName, payload);
    },

    async update(id: string, data: Partial<T>): Promise<void> {
      const activeTenantId = getActiveTenantId();
      demoDb.update(collectionName, id, { ...data, tenantId: activeTenantId } as Record<string, unknown>);

      if (!isDemoMode() && typeof window !== 'undefined') {
        try {
          await fetch('/api/db/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              collectionName,
              action: 'update',
              id,
              data: { ...data, tenantId: activeTenantId },
            }),
          });
        } catch (e) {
          console.warn(`[TenantService:${collectionName}] update API failed:`, e);
        }
      }
    },

    async delete(id: string): Promise<void> {
      demoDb.delete(collectionName, id);

      if (!isDemoMode() && typeof window !== 'undefined') {
        try {
          await fetch('/api/db/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              collectionName,
              action: 'delete',
              id,
            }),
          });
        } catch (e) {
          console.warn(`[TenantService:${collectionName}] delete API failed:`, e);
        }
      }
    },

    async list(field?: string, value?: unknown): Promise<T[]> {
      const activeTenantId = getActiveTenantId();

      if (isDemoMode() || typeof window === 'undefined') {
        const items = demoDb.list<T>(collectionName, field, value);
        return items.filter((item: any) => !item.tenantId || item.tenantId === activeTenantId || item.tenantId === 'default');
      }

      try {
        const res = await fetch(`/api/db/query?collection=${encodeURIComponent(collectionName)}`);
        if (res.ok) {
          const json = await res.json();
          let items = json.data as T[];
          if (field !== undefined && value !== undefined) {
            items = items.filter((item: any) => item[field] === value);
          }
          return items;
        }
      } catch (e) {
        console.warn(`[TenantService:${collectionName}] list API failed, falling back to demoDb:`, e);
      }

      const items = demoDb.list<T>(collectionName, field, value);
      return items.filter((item: any) => !item.tenantId || item.tenantId === activeTenantId || item.tenantId === 'default');
    },

    subscribe(id: string, cb: (data: T | null) => void): () => void {
      cb(demoDb.get<T>(collectionName, id));
      const unsub = demoDb.subscribe((changed) => {
        if (changed === collectionName) {
          cb(demoDb.get<T>(collectionName, id));
        }
      });
      return unsub;
    },
  };
}
