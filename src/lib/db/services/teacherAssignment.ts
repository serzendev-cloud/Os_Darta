import { createTenantService } from './create-tenant-service';
import type { TeacherAssignment } from '@/types';

export const teacherAssignmentService = createTenantService<TeacherAssignment>('teacherAssignments');
