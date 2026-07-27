import { createTenantService } from './create-tenant-service';
import type { MasterTingkat } from '@/types';

export const masterTingkatService = createTenantService<MasterTingkat>('masterTingkat');
