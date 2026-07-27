import { createTenantService } from './create-tenant-service';
import type { Santri } from '@/types';

export const santriService = createTenantService<Santri>('santri');
