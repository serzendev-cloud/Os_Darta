import { createTenantService } from './create-tenant-service';

export interface AcademicYear {
  id: string;
  tenantId?: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicTerm {
  id: string;
  tenantId?: string;
  academicYearId: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'planned' | 'active' | 'closed';
  createdAt?: string;
  updatedAt?: string;
}

export const academicYearService = createTenantService<AcademicYear>('academic_years');
export const academicTermService = createTenantService<AcademicTerm>('academic_terms');
