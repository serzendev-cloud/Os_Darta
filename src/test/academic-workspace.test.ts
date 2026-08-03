import { describe, it, expect } from 'vitest';
import { academicYearService, academicTermService } from '@/lib/db/services/academic-workspace';

describe('Academic Workspace Service', () => {
  it('should create and retrieve an academic year correctly', async () => {
    const yearData = {
      name: '2026/2027 Test Year',
      startDate: '2026-07-01',
      endDate: '2027-06-30',
      status: 'active' as const,
    };

    const id = await academicYearService.create(yearData);
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');

    const fetched = await academicYearService.get(id);
    expect(fetched).not.toBeNull();
    if (fetched) {
      expect(fetched.name).toBe('2026/2027 Test Year');
      expect(fetched.status).toBe('active');
    }
  });

  it('should create and retrieve an academic term correctly', async () => {
    const termData = {
      academicYearId: 'ay_test_123',
      name: 'Semester Ganjil Test',
      startDate: '2026-07-01',
      endDate: '2026-12-31',
      isCurrent: true,
      status: 'active' as const,
    };

    const id = await academicTermService.create(termData);
    expect(id).toBeDefined();

    const fetched = await academicTermService.get(id);
    expect(fetched).not.toBeNull();
    if (fetched) {
      expect(fetched.name).toBe('Semester Ganjil Test');
      expect(fetched.isCurrent).toBe(true);
    }
  });
});
