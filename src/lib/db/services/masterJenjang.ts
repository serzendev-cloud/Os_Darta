import { createTenantService } from './create-tenant-service';
import type { MasterJenjang } from '@/types';

export const masterJenjangService = createTenantService<MasterJenjang>('masterJenjang');
