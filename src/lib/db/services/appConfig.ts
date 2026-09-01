import { createTenantService } from './create-tenant-service';
import type { AppConfig } from '@/lib/config/types';

const baseService = createTenantService<AppConfig & { id: string }>('tenantSettings');
const SETTINGS_DOC_ID = 'settings';

export const appConfigService = {
  ...baseService,

  async get(): Promise<AppConfig | null> {
    const data = await baseService.get(SETTINGS_DOC_ID);
    return data || null;
  },

  async update(data: Partial<AppConfig>): Promise<void> {
    const existing = await baseService.get(SETTINGS_DOC_ID);
    if (existing) {
      await baseService.update(SETTINGS_DOC_ID, data);
    } else {
      await baseService.create({
        id: SETTINGS_DOC_ID,
        ...data,
      } as any);
    }
  },

  subscribe(callback: (config: AppConfig | null) => void): () => void {
    return baseService.subscribe(SETTINGS_DOC_ID, (data) => {
      callback(data || null);
    });
  },
};
