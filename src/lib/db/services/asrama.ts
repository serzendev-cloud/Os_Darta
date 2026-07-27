import { createTenantService } from './create-tenant-service';
import type { Asrama } from '@/types';

export const asramaService = createTenantService<Asrama>('asrama');
