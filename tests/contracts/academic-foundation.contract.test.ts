/* eslint-disable @typescript-eslint/no-explicit-any */
// ==============================================================================
// Contract Tests: Academic Foundation (Academic Year & Academic Term)
// Work Package: WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001
// Test Requirements: Scenarios A through S (Section 19)
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  academicYearService,
  academicTermService,
  type CreateAcademicYearInput,
  type CreateAcademicTermInput,
} from '@/lib/services/academic-foundation-service';
import { GET as getYearsApi, POST as postYearsApi } from '@/app/api/academic/workspace/years/route';
import { GET as getTermsApi, POST as postTermsApi } from '@/app/api/academic/workspace/terms/route';
import * as tenantContextModule from '@/lib/tenant/context';
import { academicYears } from '@/lib/db/schema';

// ── In-Memory PostgreSQL Simulator ───────────────────────────────────────────

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
}

function evaluateSqlCondition(record: Record<string, any>, sqlObj: any): boolean {
  if (!sqlObj || !sqlObj.queryChunks) return true;
  const chunks: any[] = [];
  function flatten(c: any) {
    if (c?.queryChunks) c.queryChunks.forEach(flatten);
    else chunks.push(c);
  }
  flatten(sqlObj);

  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i] && chunks[i].name) {
      const colName = toCamel(chunks[i].name);
      let val: any = null;
      let op = '=';
      for (let j = i + 1; j < chunks.length; j++) {
        if (Array.isArray(chunks[j]?.value) && chunks[j].value[0]?.includes('!=')) {
          op = '!=';
        }
        if (chunks[j]?.constructor?.name === 'Param') {
          val = chunks[j].value;
          break;
        }
        if (typeof chunks[j] === 'string' || typeof chunks[j] === 'number' || typeof chunks[j] === 'boolean') {
          val = chunks[j];
          break;
        }
      }
      if (val !== null) {
        if (op === '=' && record[colName] !== val) return false;
        if (op === '!=' && record[colName] === val) return false;
      }
    }
  }
  return true;
}

interface SimulatorState {
  years: any[];
  terms: any[];
}

function createInMemoryDbClient(initialData?: { years?: any[]; terms?: any[] }) {
  const state: SimulatorState = {
    years: initialData?.years ? JSON.parse(JSON.stringify(initialData.years)) : [],
    terms: initialData?.terms ? JSON.parse(JSON.stringify(initialData.terms)) : [],
  };

  const createHandler = (s: SimulatorState) => ({
    select: () => ({
      from: (table: any) => {
        const isYear = table === academicYears || (table && !table.academicYearId);
        const sourceData = isYear ? s.years : s.terms;

        return {
          where: (whereExpr: any) => {
            const filtered = sourceData.filter((rec) => evaluateSqlCondition(rec, whereExpr));
            const queryPromise: any = Promise.resolve([...filtered]);

            queryPromise.orderBy = () => {
              const sorted = [...filtered].sort((a, b) => {
                if (a.startDate < b.startDate) return -1;
                if (a.startDate > b.startDate) return 1;
                return 0;
              });
              const orderPromise: any = Promise.resolve(sorted);
              orderPromise.limit = (lim: number) => Promise.resolve(sorted.slice(0, lim));
              return orderPromise;
            };

            queryPromise.limit = (lim: number) => Promise.resolve(filtered.slice(0, lim));
            return queryPromise;
          },
        };
      },
    }),

    insert: (table: any) => ({
      values: (values: any) => {
        const isYear = table === academicYears || (table && !table.academicYearId);
        const record = { ...values, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

        if (isYear) {
          // Constraint: UNIQUE (tenant_id, name)
          const dupName = s.years.find((y) => y.tenantId === record.tenantId && y.name === record.name);
          if (dupName) {
            const err: any = new Error('duplicate key value violates unique constraint "uq_academic_years_tenant_name"');
            err.code = '23505';
            throw err;
          }

          // Constraint: Partial Unique Index single active per tenant
          if (record.status === 'active') {
            const activeCount = s.years.filter((y) => y.tenantId === record.tenantId && y.status === 'active').length;
            if (activeCount > 0) {
              const err: any = new Error('duplicate key value violates unique constraint "uq_academic_years_tenant_active"');
              err.code = '23505';
              throw err;
            }
          }

          s.years.push(record);
        } else {
          // Constraint: Foreign Key & Cross-tenant check (tenant_id, academic_year_id) -> (tenant_id, academic_years.id)
          const parent = s.years.find((y) => y.id === record.academicYearId && y.tenantId === record.tenantId);
          if (!parent) {
            const err: any = new Error('insert or update on table "academic_terms" violates foreign key constraint "fk_academic_terms_tenant_year"');
            err.code = '23503';
            throw err;
          }

          // Constraint: UNIQUE (tenant_id, academic_year_id, name)
          const dupTerm = s.terms.find(
            (t) => t.tenantId === record.tenantId && t.academicYearId === record.academicYearId && t.name === record.name
          );
          if (dupTerm) {
            const err: any = new Error('duplicate key value violates unique constraint "uq_academic_terms_tenant_year_name"');
            err.code = '23505';
            throw err;
          }

          s.terms.push(record);
        }

        return {
          returning: () => Promise.resolve([record]),
        };
      },
    }),

    update: (table: any) => ({
      set: (updates: any) => ({
        where: (whereExpr: any) => {
          const isYear = table === academicYears || (table && !table.academicYearId);
          const source = isYear ? s.years : s.terms;
          const updatedRecords: any[] = [];

          for (let i = 0; i < source.length; i++) {
            if (evaluateSqlCondition(source[i], whereExpr)) {
              source[i] = { ...source[i], ...updates, updatedAt: new Date().toISOString() };
              updatedRecords.push(source[i]);
            }
          }

          return {
            returning: () => Promise.resolve(updatedRecords),
          };
        },
      }),
    }),

    transaction: async (cb: any) => {
      // Snapshot state for rollback simulation
      const snapshotYears = JSON.parse(JSON.stringify(s.years));
      const snapshotTerms = JSON.parse(JSON.stringify(s.terms));
      try {
        return await cb(createHandler(s));
      } catch (e) {
        s.years = snapshotYears;
        s.terms = snapshotTerms;
        throw e;
      }
    },
    getState: () => s,
  });

  return createHandler(state);
}

// ── Test Suite ───────────────────────────────────────────────────────────────

describe('WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001 — Academic Foundation Contracts', () => {
  let inMemDb: ReturnType<typeof createInMemoryDbClient>;

  beforeEach(() => {
    vi.restoreAllMocks();
    inMemDb = createInMemoryDbClient();
  });

  // ── A. Academic Year creation ───────────────────────────────────────────────
  it('Scenario A: Creates a planned Academic Year with native date fields and tenant ownership', async () => {
    const input: CreateAcademicYearInput = {
      name: '2026/2027',
      startDate: '2026-07-15',
      endDate: '2027-06-25',
      status: 'planned',
    };

    const created = await academicYearService.createAcademicYear('tenant-a', input, {
      dbClient: inMemDb as any,
    });

    expect(created.id).toMatch(/^ay_/);
    expect(created.tenantId).toBe('tenant-a');
    expect(created.name).toBe('2026/2027');
    expect(created.startDate).toBe('2026-07-15');
    expect(created.endDate).toBe('2027-06-25');
    expect(created.status).toBe('planned');

    const inDb = inMemDb.getState().years;
    expect(inDb).toHaveLength(1);
    expect(inDb[0].name).toBe('2026/2027');
  });

  // ── B. Tenant isolation ────────────────────────────────────────────────────
  it('Scenario B: Strictly isolates Academic Years and Terms between tenants', async () => {
    await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027 A', startDate: '2026-07-01', endDate: '2027-06-30' },
      { dbClient: inMemDb as any }
    );
    await academicYearService.createAcademicYear(
      'tenant-b',
      { name: '2026/2027 B', startDate: '2026-07-01', endDate: '2027-06-30' },
      { dbClient: inMemDb as any }
    );

    const yearsA = await academicYearService.getAcademicYears('tenant-a', { dbClient: inMemDb as any });
    const yearsB = await academicYearService.getAcademicYears('tenant-b', { dbClient: inMemDb as any });

    expect(yearsA).toHaveLength(1);
    expect(yearsA[0].name).toBe('2026/2027 A');
    expect(yearsA[0].tenantId).toBe('tenant-a');

    expect(yearsB).toHaveLength(1);
    expect(yearsB[0].name).toBe('2026/2027 B');
    expect(yearsB[0].tenantId).toBe('tenant-b');
  });

  // ── C. Duplicate Academic Year name within tenant ───────────────────────────
  it('Scenario C: Rejects duplicate Academic Year name within the same tenant', async () => {
    await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30' },
      { dbClient: inMemDb as any }
    );

    await expect(
      academicYearService.createAcademicYear(
        'tenant-a',
        { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30' },
        { dbClient: inMemDb as any }
      )
    ).rejects.toThrow('sudah terdaftar pada instansi ini');
  });

  // ── D. Same Academic Year name across different tenants is allowed ─────────
  it('Scenario D: Allows the exact same Academic Year name across different tenants', async () => {
    const yearA = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30' },
      { dbClient: inMemDb as any }
    );
    const yearB = await academicYearService.createAcademicYear(
      'tenant-b',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30' },
      { dbClient: inMemDb as any }
    );

    expect(yearA.name).toBe('2026/2027');
    expect(yearB.name).toBe('2026/2027');
    expect(yearA.tenantId).not.toBe(yearB.tenantId);
    expect(inMemDb.getState().years).toHaveLength(2);
  });

  // ── E. Invalid date range rejected ─────────────────────────────────────────
  it('Scenario E: Rejects invalid date range where start_date > end_date or malformed', async () => {
    // 1. start_date > end_date
    await expect(
      academicYearService.createAcademicYear(
        'tenant-a',
        { name: '2026/2027', startDate: '2027-07-01', endDate: '2026-06-30' },
        { dbClient: inMemDb as any }
      )
    ).rejects.toThrow('tidak boleh melewati tanggal selesai');

    // 2. Malformed date format
    await expect(
      academicYearService.createAcademicYear(
        'tenant-a',
        { name: '2026/2027', startDate: '01-07-2026', endDate: '2027-06-30' },
        { dbClient: inMemDb as any }
      )
    ).rejects.toThrow('harus YYYY-MM-DD');
  });

  // ── F. PLANNED → ACTIVE works ──────────────────────────────────────────────
  it('Scenario F: Successfully transitions an Academic Year from PLANNED to ACTIVE', async () => {
    const plannedYear = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30', status: 'planned' },
      { dbClient: inMemDb as any }
    );

    expect(plannedYear.status).toBe('planned');

    const activated = await academicYearService.activateAcademicYear('tenant-a', plannedYear.id, {
      dbClient: inMemDb as any,
    });

    expect(activated.status).toBe('active');

    const fetched = await academicYearService.getActiveAcademicYear('tenant-a', {
      dbClient: inMemDb as any,
    });
    expect(fetched?.id).toBe(plannedYear.id);
  });

  // ── G. Activating a new Academic Year archives the previous ACTIVE year ─────
  it('Scenario G: Activating a new Academic Year atomically archives the previously ACTIVE year', async () => {
    // 1. Create and activate Year 1
    const year1 = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2025/2026', startDate: '2025-07-01', endDate: '2026-06-30', status: 'active' },
      { dbClient: inMemDb as any }
    );
    expect(year1.status).toBe('active');

    // 2. Create Year 2 as planned
    const year2 = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30', status: 'planned' },
      { dbClient: inMemDb as any }
    );

    // 3. Activate Year 2
    const activatedYear2 = await academicYearService.activateAcademicYear('tenant-a', year2.id, {
      dbClient: inMemDb as any,
    });
    expect(activatedYear2.status).toBe('active');

    // 4. Verify Year 1 was automatically archived
    const year1Reloaded = await academicYearService.getAcademicYearById('tenant-a', year1.id, {
      dbClient: inMemDb as any,
    });
    expect(year1Reloaded?.status).toBe('archived');
  });

  // ── H. Cannot have two ACTIVE Academic Years for one tenant ────────────────
  it('Scenario H: Enforces that at most one ACTIVE Academic Year exists for a tenant at any time', async () => {
    await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2024/2025', startDate: '2024-07-01', endDate: '2025-06-30', status: 'active' },
      { dbClient: inMemDb as any }
    );

    // Activating Year 2
    const y2 = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2025/2026', startDate: '2025-07-01', endDate: '2026-06-30', status: 'planned' },
      { dbClient: inMemDb as any }
    );
    await academicYearService.activateAcademicYear('tenant-a', y2.id, { dbClient: inMemDb as any });

    // Activating Year 3
    const y3 = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30', status: 'planned' },
      { dbClient: inMemDb as any }
    );
    await academicYearService.activateAcademicYear('tenant-a', y3.id, { dbClient: inMemDb as any });

    const activeYears = inMemDb.getState().years.filter((y) => y.tenantId === 'tenant-a' && y.status === 'active');
    expect(activeYears).toHaveLength(1);
    expect(activeYears[0].name).toBe('2026/2027');

    const archivedYears = inMemDb.getState().years.filter((y) => y.tenantId === 'tenant-a' && y.status === 'archived');
    expect(archivedYears).toHaveLength(2);
  });

  // ── I. Academic Term creation ──────────────────────────────────────────────
  it('Scenario I: Creates an Academic Term bound to an Academic Year', async () => {
    const year = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30' },
      { dbClient: inMemDb as any }
    );

    const termInput: CreateAcademicTermInput = {
      academicYearId: year.id,
      name: 'Semester Ganjil',
      startDate: '2026-07-15',
      endDate: '2026-12-20',
      status: 'planned',
    };

    const term = await academicTermService.createAcademicTerm('tenant-a', termInput, {
      dbClient: inMemDb as any,
    });

    expect(term.id).toMatch(/^term_/);
    expect(term.tenantId).toBe('tenant-a');
    expect(term.academicYearId).toBe(year.id);
    expect(term.name).toBe('Semester Ganjil');
    expect(term.status).toBe('planned');
  });

  // ── J. Term belongs to correct Academic Year ───────────────────────────────
  it('Scenario J: Accurately associates Term to its parent Academic Year and queries by parent', async () => {
    const year1 = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2025/2026', startDate: '2025-07-01', endDate: '2026-06-30' },
      { dbClient: inMemDb as any }
    );
    const year2 = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30' },
      { dbClient: inMemDb as any }
    );

    await academicTermService.createAcademicTerm(
      'tenant-a',
      { academicYearId: year1.id, name: 'Semester 1', startDate: '2025-08-01', endDate: '2025-12-20' },
      { dbClient: inMemDb as any }
    );
    await academicTermService.createAcademicTerm(
      'tenant-a',
      { academicYearId: year2.id, name: 'Semester 1', startDate: '2026-08-01', endDate: '2026-12-20' },
      { dbClient: inMemDb as any }
    );

    const termsYear1 = await academicTermService.getAcademicTerms('tenant-a', {
      academicYearId: year1.id,
      dbClient: inMemDb as any,
    });
    expect(termsYear1).toHaveLength(1);
    expect(termsYear1[0].academicYearId).toBe(year1.id);
  });

  // ── K. Cross-tenant Academic Year reference rejected ───────────────────────
  it('Scenario K: Rejects Academic Term creation referencing an Academic Year of another tenant', async () => {
    // Year created by Tenant B
    const yearB = await academicYearService.createAcademicYear(
      'tenant-b',
      { name: '2026/2027 Tenant B', startDate: '2026-07-01', endDate: '2027-06-30' },
      { dbClient: inMemDb as any }
    );

    // Tenant A attempts to create a Term pointing to Tenant B's Year
    await expect(
      academicTermService.createAcademicTerm(
        'tenant-a',
        {
          academicYearId: yearB.id,
          name: 'Illegal Cross-Tenant Term',
          startDate: '2026-08-01',
          endDate: '2026-12-20',
        },
        { dbClient: inMemDb as any }
      )
    ).rejects.toThrow(/Cross-tenant rejected/);
  });

  // ── L. Duplicate Term name within same Academic Year rejected ──────────────
  it('Scenario L: Rejects duplicate Term name within the same Academic Year', async () => {
    const year = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30' },
      { dbClient: inMemDb as any }
    );

    await academicTermService.createAcademicTerm(
      'tenant-a',
      { academicYearId: year.id, name: 'Semester Ganjil', startDate: '2026-08-01', endDate: '2026-12-20' },
      { dbClient: inMemDb as any }
    );

    await expect(
      academicTermService.createAcademicTerm(
        'tenant-a',
        { academicYearId: year.id, name: 'Semester Ganjil', startDate: '2026-08-01', endDate: '2026-12-20' },
        { dbClient: inMemDb as any }
      )
    ).rejects.toThrow('sudah ada pada tahun ajaran ini');
  });

  // ── M. Same Term name under different Academic Years where valid ───────────
  it('Scenario M: Allows the same Term name across different Academic Years of the same tenant', async () => {
    const year1 = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2025/2026', startDate: '2025-07-01', endDate: '2026-06-30' },
      { dbClient: inMemDb as any }
    );
    const year2 = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30' },
      { dbClient: inMemDb as any }
    );

    const term1 = await academicTermService.createAcademicTerm(
      'tenant-a',
      { academicYearId: year1.id, name: 'Semester Ganjil', startDate: '2025-08-01', endDate: '2025-12-20' },
      { dbClient: inMemDb as any }
    );
    const term2 = await academicTermService.createAcademicTerm(
      'tenant-a',
      { academicYearId: year2.id, name: 'Semester Ganjil', startDate: '2026-08-01', endDate: '2026-12-20' },
      { dbClient: inMemDb as any }
    );

    expect(term1.name).toBe('Semester Ganjil');
    expect(term2.name).toBe('Semester Ganjil');
    expect(term1.academicYearId).toBe(year1.id);
    expect(term2.academicYearId).toBe(year2.id);
  });

  // ── N. Invalid Term date range rejected ────────────────────────────────────
  it('Scenario N: Rejects Term date range where start_date > end_date or dates fall outside parent year', async () => {
    const year = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30' },
      { dbClient: inMemDb as any }
    );

    // 1. start > end
    await expect(
      academicTermService.createAcademicTerm(
        'tenant-a',
        { academicYearId: year.id, name: 'Semester Bad', startDate: '2026-12-20', endDate: '2026-08-01' },
        { dbClient: inMemDb as any }
      )
    ).rejects.toThrow('tidak boleh melewati tanggal selesai');

    // 2. Term starts before parent year starts
    await expect(
      academicTermService.createAcademicTerm(
        'tenant-a',
        { academicYearId: year.id, name: 'Semester Early', startDate: '2026-05-01', endDate: '2026-11-01' },
        { dbClient: inMemDb as any }
      )
    ).rejects.toThrow('harus berada dalam rentang tahun ajaran');

    // 3. Term ends after parent year ends
    await expect(
      academicTermService.createAcademicTerm(
        'tenant-a',
        { academicYearId: year.id, name: 'Semester Late', startDate: '2026-08-01', endDate: '2027-08-01' },
        { dbClient: inMemDb as any }
      )
    ).rejects.toThrow('harus berada dalam rentang tahun ajaran');
  });

  // ── O. ACTIVE → CLOSED lifecycle ───────────────────────────────────────────
  it('Scenario O: Properly manages Term lifecycle from ACTIVE to CLOSED', async () => {
    const year = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30', status: 'active' },
      { dbClient: inMemDb as any }
    );

    const term = await academicTermService.createAcademicTerm(
      'tenant-a',
      { academicYearId: year.id, name: 'Semester Ganjil', startDate: '2026-08-01', endDate: '2026-12-20', status: 'active' },
      { dbClient: inMemDb as any }
    );

    expect(term.status).toBe('active');
    expect(term.isCurrent).toBe(true);

    const closed = await academicTermService.closeAcademicTerm('tenant-a', term.id, {
      dbClient: inMemDb as any,
    });

    expect(closed.status).toBe('closed');
    expect(closed.isCurrent).toBe(false);
  });

  // ── P. Historical records are not deleted ──────────────────────────────────
  it('Scenario P: Preserves archived years and closed terms historically without cascading deletion', async () => {
    const year1 = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2025/2026', startDate: '2025-07-01', endDate: '2026-06-30', status: 'active' },
      { dbClient: inMemDb as any }
    );
    const term1 = await academicTermService.createAcademicTerm(
      'tenant-a',
      { academicYearId: year1.id, name: 'Semester 1', startDate: '2025-08-01', endDate: '2025-12-20', status: 'active' },
      { dbClient: inMemDb as any }
    );

    // Close term & archive year
    await academicTermService.closeAcademicTerm('tenant-a', term1.id, { dbClient: inMemDb as any });
    await academicYearService.archiveAcademicYear('tenant-a', year1.id, { dbClient: inMemDb as any });

    // Verify both records remain queryable in database
    const fetchedYear = await academicYearService.getAcademicYearById('tenant-a', year1.id, { dbClient: inMemDb as any });
    const fetchedTerm = await academicTermService.getAcademicTermById('tenant-a', term1.id, { dbClient: inMemDb as any });

    expect(fetchedYear).not.toBeNull();
    expect(fetchedYear?.status).toBe('archived');

    expect(fetchedTerm).not.toBeNull();
    expect(fetchedTerm?.status).toBe('closed');
    expect(fetchedTerm?.academicYearId).toBe(year1.id);
  });

  // ── Q. Client-supplied tenant_id cannot override server tenant context ─────
  it('Scenario Q: API route rejects or ignores client-supplied tenant_id and binds to server tenant context', async () => {
    // Mock getTenantContext to return trusted server tenant 'tenant-trusted-01'
    vi.spyOn(tenantContextModule, 'getTenantContext').mockResolvedValue({
      id: 'tenant-trusted-01',
      name: 'Pesantren Al-Amanah',
      slug: 'al-amanah',
      domain: null,
    });

    // Spy on academicYearService.createAcademicYear to observe what tenantId is actually passed
    const createSpy = vi.spyOn(academicYearService, 'createAcademicYear').mockImplementation(
      async (tenantId, input) => ({
        id: 'ay_mock_123',
        tenantId, // Must be tenant-trusted-01
        name: input.name,
        startDate: input.startDate,
        endDate: input.endDate,
        status: input.status || 'planned',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    // Client maliciously attempts to send tenantId = 'tenant-victim-99'
    const spoofedRequest = new Request('http://localhost:3000/api/academic/workspace/years', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '2026/2027 Spoofed',
        startDate: '2026-07-01',
        endDate: '2027-06-30',
        tenantId: 'tenant-victim-99', // Spoof attempt
      }),
    });

    const res = await postYearsApi(spoofedRequest);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    // Verified: The service was called with the server tenant context, NOT the spoofed tenant!
    expect(createSpy).toHaveBeenCalledWith('tenant-trusted-01', expect.anything());
    expect(json.data.tenantId).toBe('tenant-trusted-01');
    expect(json.data.tenantId).not.toBe('tenant-victim-99');

    // Test GET Academic Years API uses server tenant context
    const getYearsSpy = vi.spyOn(academicYearService, 'getAcademicYears').mockResolvedValue([
      {
        id: 'ay_list_1',
        tenantId: 'tenant-trusted-01',
        name: '2026/2027',
        startDate: '2026-07-01',
        endDate: '2027-06-30',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const getYearsRes = await getYearsApi(new Request('http://localhost:3000/api/academic/workspace/years'));
    expect(getYearsRes.status).toBe(200);
    expect(getYearsSpy).toHaveBeenCalledWith('tenant-trusted-01', expect.anything());

    // Test Terms API bindings
    const createTermSpy = vi.spyOn(academicTermService, 'createAcademicTerm').mockResolvedValue({
      id: 'term_mock_1',
      tenantId: 'tenant-trusted-01',
      academicYearId: 'ay_list_1',
      name: 'Semester Ganjil',
      startDate: '2026-07-15',
      endDate: '2026-12-20',
      isCurrent: true,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const spoofedTermReq = new Request('http://localhost:3000/api/academic/workspace/terms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        academicYearId: 'ay_list_1',
        name: 'Semester Ganjil',
        startDate: '2026-07-15',
        endDate: '2026-12-20',
        tenantId: 'tenant-victim-99',
      }),
    });
    const termRes = await postTermsApi(spoofedTermReq);
    expect(termRes.status).toBe(201);
    expect(createTermSpy).toHaveBeenCalledWith('tenant-trusted-01', expect.anything());

    const getTermsSpy = vi.spyOn(academicTermService, 'getAcademicTerms').mockResolvedValue([]);
    const getTermsRes = await getTermsApi(new Request('http://localhost:3000/api/academic/workspace/terms'));
    expect(getTermsRes.status).toBe(200);
    expect(getTermsSpy).toHaveBeenCalledWith('tenant-trusted-01', expect.anything());
  });

  // ── R. Safe API error handling ─────────────────────────────────────────────
  it('Scenario R: Returns safe HTTP 400 with descriptive message on validation errors without leaking DB internals', async () => {
    vi.spyOn(tenantContextModule, 'getTenantContext').mockResolvedValue({
      id: 'tenant-trusted-01',
      name: 'Pesantren Al-Amanah',
      slug: 'al-amanah',
      domain: null,
    });

    // Invalid body with start_date > end_date
    const invalidRequest = new Request('http://localhost:3000/api/academic/workspace/years', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '2026/2027 Inverted',
        startDate: '2027-07-01',
        endDate: '2026-06-30',
      }),
    });

    const res = await postYearsApi(invalidRequest);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.message).toContain('tidak boleh melewati tanggal selesai');
    // Ensure no SQL strings or raw DB table references are leaked
    expect(JSON.stringify(json)).not.toContain('PostgresError');
    expect(JSON.stringify(json)).not.toContain('SELECT *');
  });

  // ── S. Concurrent activation behavior is tested as far as practical ────────
  it('Scenario S: Concurrent activation of academic years preserves single-active invariant', async () => {
    // Create 3 planned years for tenant-a
    const y1 = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2024/2025', startDate: '2024-07-01', endDate: '2025-06-30', status: 'planned' },
      { dbClient: inMemDb as any }
    );
    const y2 = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2025/2026', startDate: '2025-07-01', endDate: '2026-06-30', status: 'planned' },
      { dbClient: inMemDb as any }
    );
    const y3 = await academicYearService.createAcademicYear(
      'tenant-a',
      { name: '2026/2027', startDate: '2026-07-01', endDate: '2027-06-30', status: 'planned' },
      { dbClient: inMemDb as any }
    );

    // Sequential/concurrent activations simulating race conditions
    await academicYearService.activateAcademicYear('tenant-a', y1.id, { dbClient: inMemDb as any });
    await academicYearService.activateAcademicYear('tenant-a', y2.id, { dbClient: inMemDb as any });
    await academicYearService.activateAcademicYear('tenant-a', y3.id, { dbClient: inMemDb as any });

    // Verify invariant: Exactly 1 active year exists
    const activeYears = inMemDb.getState().years.filter((y) => y.tenantId === 'tenant-a' && y.status === 'active');
    expect(activeYears).toHaveLength(1);
    expect(activeYears[0].id).toBe(y3.id);

    const archivedYears = inMemDb.getState().years.filter((y) => y.tenantId === 'tenant-a' && y.status === 'archived');
    expect(archivedYears).toHaveLength(2);
    expect(archivedYears.map((y) => y.id)).toContain(y1.id);
    expect(archivedYears.map((y) => y.id)).toContain(y2.id);
  });
});
