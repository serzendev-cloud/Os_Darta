import { createTenantService } from './create-tenant-service';
import type { Kelas } from '@/types/academic';

export const kelasService = createTenantService<Kelas>('kelas');
