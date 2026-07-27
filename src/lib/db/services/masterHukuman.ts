import { createTenantService } from './create-tenant-service';

export interface MasterHukuman {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  severityScope?: string[];
  minimumTingkat: number;
  description?: string;
}

export const masterHukumanService = createTenantService<MasterHukuman>('masterHukuman');
