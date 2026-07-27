import { createTenantService } from './create-tenant-service';

export interface Kamar {
  id: string;
  asramaId: string;
  name: string;
  capacity: number;
  filled?: number;
}

export const kamarService = createTenantService<Kamar>('kamar');
