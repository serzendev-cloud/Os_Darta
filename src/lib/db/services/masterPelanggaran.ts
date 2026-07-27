import { createTenantService } from './create-tenant-service';
import type { MasterPelanggaran } from '@/types';

export const masterPelanggaranService = createTenantService<MasterPelanggaran>('masterPelanggaran');
