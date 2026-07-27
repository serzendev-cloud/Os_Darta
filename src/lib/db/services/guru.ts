import { createTenantService } from './create-tenant-service';
import type { Guru } from '@/types';

export const guruService = createTenantService<Guru>('guru');
