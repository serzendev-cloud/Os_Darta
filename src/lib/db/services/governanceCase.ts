import { createTenantService } from './create-tenant-service';
import type { GovernanceCase } from '@/types';

const base = createTenantService<GovernanceCase>('governanceCases');

export const governanceCaseService = {
  ...base,
  async create(data: Partial<GovernanceCase> & Omit<GovernanceCase, 'id' | 'createdAt'>): Promise<string> {
    const payload = {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
    };
    return base.create(payload as any);
  },
  async review(
    id: string,
    arg2: any,
    arg3?: any,
    arg4?: any,
    arg5?: any,
    arg6?: any,
    arg7?: any
  ): Promise<void> {
    if (typeof arg2 === 'object' && arg2 !== null) {
      await base.update(id, {
        ...arg2,
        reviewedAt: new Date().toISOString(),
      });
    } else {
      await base.update(id, {
        reviewStatus: arg2,
        reviewedBy: arg3,
        reviewedByRole: arg4,
        reviewNotes: arg5,
        violationId: arg6,
        reviewedAt: new Date().toISOString(),
      } as any);
    }
  },
};
