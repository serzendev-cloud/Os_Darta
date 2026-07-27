import { createTenantService } from './create-tenant-service';
import type { User } from '@/types';

export const usersService = createTenantService<User>('users');
