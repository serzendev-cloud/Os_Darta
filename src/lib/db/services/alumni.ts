import { createTenantService } from './create-tenant-service';
import type { Alumni } from '@/types';

export const alumniService = createTenantService<Alumni>('alumni');
