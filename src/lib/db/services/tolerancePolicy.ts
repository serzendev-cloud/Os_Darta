import { createTenantService } from './create-tenant-service';
import type { TolerancePolicy, GlobalTolerancePolicy, JenjangToleranceOverride, SeverityLimits } from '@/types';

const baseService = createTenantService<TolerancePolicy>('tolerancePolicies');

export const tolerancePolicyService = {
  ...baseService,

  async getGlobal(): Promise<GlobalTolerancePolicy | null> {
    const policy = await baseService.get('global');
    if (policy && policy.type === 'global') return policy as GlobalTolerancePolicy;
    return null;
  },

  async saveGlobal(data: { isActive: boolean; limits: SeverityLimits }): Promise<void> {
    const existing = await baseService.get('global');
    if (existing) {
      await baseService.update('global', { isActive: data.isActive, limits: data.limits });
    } else {
      await baseService.create({ id: 'global', type: 'global', isActive: data.isActive, limits: data.limits } as any);
    }
  },

  async listOverrides(): Promise<JenjangToleranceOverride[]> {
    const all = await baseService.list();
    return all.filter((p) => p.type === 'jenjang') as JenjangToleranceOverride[];
  },

  async createOverride(data: { jenjang: string; isActive: boolean; limits: SeverityLimits }): Promise<string> {
    return await baseService.create({
      type: 'jenjang',
      jenjang: data.jenjang,
      isActive: data.isActive,
      limits: data.limits,
    } as any);
  },

  async updateOverride(id: string, data: Partial<JenjangToleranceOverride>): Promise<void> {
    await baseService.update(id, data);
  },

  async saveOverride(jenjang: string, data: { isActive: boolean; limits: SeverityLimits }): Promise<string> {
    const overrides = await this.listOverrides();
    const existing = overrides.find((o) => o.jenjang === jenjang);
    if (existing) {
      await baseService.update(existing.id, { isActive: data.isActive, limits: data.limits });
      return existing.id;
    }
    return await this.createOverride({ jenjang, isActive: data.isActive, limits: data.limits });
  },

  async deleteOverride(id: string): Promise<void> {
    await baseService.delete(id);
  },
};
