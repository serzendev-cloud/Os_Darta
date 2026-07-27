import { createTenantService } from './create-tenant-service';
import type { Mapel } from '@/types/academic';

export const mapelService = createTenantService<Mapel & { id: string }>('mapel');
