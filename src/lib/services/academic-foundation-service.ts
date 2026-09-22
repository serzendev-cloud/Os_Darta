/* eslint-disable @typescript-eslint/no-explicit-any */
// ==============================================================================
// Academic Foundation Domain Service
// Work Package: WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001
// Entities: academic_years & academic_terms
// Source of Truth: WP-ACADEMIC-FOUNDATION-RECON-001
// ==============================================================================

import crypto from 'crypto';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  academicYears,
  academicTerms,
  type AcademicYear,
  type AcademicTerm,
  type NewAcademicYear,
  type NewAcademicTerm,
} from '@/lib/db/schema';

// ── Types & DTOs ─────────────────────────────────────────────────────────────

export interface CreateAcademicYearInput {
  name: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  status?: 'planned' | 'active';
}

export interface UpdateAcademicYearInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: 'planned' | 'active' | 'archived';
}

export interface CreateAcademicTermInput {
  academicYearId: string;
  name: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  status?: 'planned' | 'active';
  isCurrent?: boolean;
}

export interface UpdateAcademicTermInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: 'planned' | 'active' | 'closed';
  isCurrent?: boolean;
}

// ── Validation Helpers ───────────────────────────────────────────────────────

function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

function assertDateRange(startDate: string, endDate: string, entityLabel: string): void {
  if (!isValidIsoDate(startDate)) {
    throw new Error(`Format tanggal mulai ${entityLabel} tidak valid (harus YYYY-MM-DD)`);
  }
  if (!isValidIsoDate(endDate)) {
    throw new Error(`Format tanggal selesai ${entityLabel} tidak valid (harus YYYY-MM-DD)`);
  }
  if (startDate > endDate) {
    throw new Error(`Tanggal mulai ${entityLabel} (${startDate}) tidak boleh melewati tanggal selesai (${endDate})`);
  }
}

// ── Safe Query Execution Helpers ──────────────────────────────────────────────

async function runTx<T>(client: any, fn: (tx: any) => Promise<T>): Promise<T> {
  if (typeof client.transaction === 'function') {
    return await client.transaction(fn);
  }
  return await fn(client);
}

async function runSelect<T>(query: any, limitCount?: number, orderExpr?: any): Promise<T[]> {
  let q = query;
  if (orderExpr && typeof q?.orderBy === 'function') {
    q = q.orderBy(orderExpr);
  }
  if (limitCount !== undefined && typeof q?.limit === 'function') {
    q = q.limit(limitCount);
  }
  const result = await q;
  return Array.isArray(result) ? result : [];
}

async function runInsert<T>(client: any, table: any, values: any): Promise<T> {
  const q = client.insert(table).values(values);
  if (typeof q?.returning === 'function') {
    const rows = await q.returning();
    if (Array.isArray(rows) && rows.length > 0) return rows[0];
  } else {
    await q;
  }
  return values as T;
}

async function runUpdate<T>(client: any, table: any, values: any, whereClause: any): Promise<T[]> {
  const q = client.update(table).set(values).where(whereClause);
  if (typeof q?.returning === 'function') {
    const rows = await q.returning();
    return Array.isArray(rows) ? rows : [];
  } else {
    await q;
  }
  return [values as T];
}

// ── Academic Year Service ────────────────────────────────────────────────────

export const academicYearService = {
  /**
   * List all academic years for a tenant.
   */
  async getAcademicYears(
    tenantId: string,
    options?: { status?: string; dbClient?: typeof db }
  ): Promise<AcademicYear[]> {
    const client = options?.dbClient || db;
    const safeTenantId = (tenantId || '').trim();
    if (!safeTenantId) throw new Error('Tenant ID wajib disertakan');

    const conditions = [eq(academicYears.tenantId, safeTenantId)];
    if (options?.status && options.status !== 'all') {
      conditions.push(eq(academicYears.status, options.status));
    }

    const query = client
      .select()
      .from(academicYears)
      .where(and(...conditions));

    return await runSelect<AcademicYear>(query, undefined, desc(academicYears.startDate));
  },

  /**
   * Get single academic year by ID, strictly scoped to tenant.
   */
  async getAcademicYearById(
    tenantId: string,
    yearId: string,
    options?: { dbClient?: typeof db }
  ): Promise<AcademicYear | null> {
    const client = options?.dbClient || db;
    const safeTenantId = (tenantId || '').trim();
    if (!safeTenantId) throw new Error('Tenant ID wajib disertakan');

    const query = client
      .select()
      .from(academicYears)
      .where(and(eq(academicYears.id, yearId), eq(academicYears.tenantId, safeTenantId)));

    const rows = await runSelect<AcademicYear>(query, 1);
    return rows[0] || null;
  },

  /**
   * Get currently active academic year for a tenant.
   */
  async getActiveAcademicYear(
    tenantId: string,
    options?: { dbClient?: typeof db }
  ): Promise<AcademicYear | null> {
    const client = options?.dbClient || db;
    const safeTenantId = (tenantId || '').trim();
    if (!safeTenantId) throw new Error('Tenant ID wajib disertakan');

    const query = client
      .select()
      .from(academicYears)
      .where(and(eq(academicYears.tenantId, safeTenantId), eq(academicYears.status, 'active')));

    const rows = await runSelect<AcademicYear>(query, 1);
    return rows[0] || null;
  },

  /**
   * Create a new Academic Year.
   * If status is 'active', atomically archives any previously active year for the tenant.
   * Duplicate names within tenant are rejected by database unique constraint / duplicate check.
   */
  async createAcademicYear(
    tenantId: string,
    input: CreateAcademicYearInput,
    options?: { dbClient?: typeof db }
  ): Promise<AcademicYear> {
    const client = options?.dbClient || db;
    const safeTenantId = (tenantId || '').trim();
    if (!safeTenantId) throw new Error('Tenant ID wajib disertakan');

    const trimmedName = (input.name || '').trim();
    if (!trimmedName) throw new Error('Nama tahun ajaran wajib diisi');

    assertDateRange(input.startDate, input.endDate, 'tahun ajaran');

    const targetStatus = input.status === 'active' ? 'active' : 'planned';

    try {
      return await runTx(client, async (tx) => {
        // 1. If activating: archive any currently active year
        if (targetStatus === 'active') {
          await runUpdate(
            tx,
            academicYears,
            { status: 'archived', updatedAt: new Date() },
            and(eq(academicYears.tenantId, safeTenantId), eq(academicYears.status, 'active'))
          );
        }

        // 2. Insert new year
        const id = `ay_${crypto.randomUUID()}`;
        const newRecord: NewAcademicYear = {
          id,
          tenantId: safeTenantId,
          name: trimmedName,
          startDate: input.startDate,
          endDate: input.endDate,
          status: targetStatus,
        };

        const inserted = await runInsert<AcademicYear>(tx, academicYears, newRecord);
        return inserted;
      });
    } catch (err: any) {
      if (
        err?.code === '23505' ||
        err?.message?.includes('uq_academic_years_tenant_name') ||
        err?.message?.includes('duplicate key') ||
        err?.message?.includes('unique constraint')
      ) {
        throw new Error(`Tahun ajaran dengan nama "${trimmedName}" sudah terdaftar pada instansi ini`);
      }
      throw err;
    }
  },

  /**
   * Activate an academic year.
   * Automatically archives the previously active academic year for the tenant.
   * Rejects reactivation of archived years.
   */
  async activateAcademicYear(
    tenantId: string,
    yearId: string,
    options?: { dbClient?: typeof db }
  ): Promise<AcademicYear> {
    const client = options?.dbClient || db;
    const safeTenantId = (tenantId || '').trim();
    if (!safeTenantId) throw new Error('Tenant ID wajib disertakan');

    return await runTx(client, async (tx) => {
      // 1. Locate target year
      const query = tx
        .select()
        .from(academicYears)
        .where(and(eq(academicYears.id, yearId), eq(academicYears.tenantId, safeTenantId)));

      const rows = await runSelect<AcademicYear>(query, 1);
      const target = rows[0];
      if (!target) {
        throw new Error(`Tahun ajaran dengan ID "${yearId}" tidak ditemukan`);
      }

      // 2. Enforce lifecycle rule: Archived years cannot be reactivated casually
      if (target.status === 'archived') {
        throw new Error('Tahun ajaran yang telah diarsipkan tidak dapat diaktifkan kembali secara sembarangan');
      }

      // 3. If already active, return early (idempotent)
      if (target.status === 'active') {
        return target;
      }

      // 4. Archive any currently active year for this tenant
      await runUpdate(
        tx,
        academicYears,
        { status: 'archived', updatedAt: new Date() },
        and(
          eq(academicYears.tenantId, safeTenantId),
          eq(academicYears.status, 'active'),
          sql`${academicYears.id} != ${yearId}`
        )
      );

      // 5. Set target to active
      const updated = await runUpdate<AcademicYear>(
        tx,
        academicYears,
        { status: 'active', updatedAt: new Date() },
        and(eq(academicYears.id, yearId), eq(academicYears.tenantId, safeTenantId))
      );

      return updated[0];
    });
  },

  /**
   * Archive an academic year.
   */
  async archiveAcademicYear(
    tenantId: string,
    yearId: string,
    options?: { dbClient?: typeof db }
  ): Promise<AcademicYear> {
    const client = options?.dbClient || db;
    const safeTenantId = (tenantId || '').trim();
    if (!safeTenantId) throw new Error('Tenant ID wajib disertakan');

    const updated = await runUpdate<AcademicYear>(
      client,
      academicYears,
      { status: 'archived', updatedAt: new Date() },
      and(eq(academicYears.id, yearId), eq(academicYears.tenantId, safeTenantId))
    );

    if (updated.length === 0) {
      throw new Error(`Tahun ajaran dengan ID "${yearId}" tidak ditemukan`);
    }

    return updated[0];
  },
};

// ── Academic Term Service ────────────────────────────────────────────────────

export const academicTermService = {
  /**
   * List terms for a tenant, optionally filtered by academic year.
   */
  async getAcademicTerms(
    tenantId: string,
    options?: { academicYearId?: string; status?: string; dbClient?: typeof db }
  ): Promise<AcademicTerm[]> {
    const client = options?.dbClient || db;
    const safeTenantId = (tenantId || '').trim();
    if (!safeTenantId) throw new Error('Tenant ID wajib disertakan');

    const conditions = [eq(academicTerms.tenantId, safeTenantId)];
    if (options?.academicYearId) {
      conditions.push(eq(academicTerms.academicYearId, options.academicYearId));
    }
    if (options?.status && options.status !== 'all') {
      conditions.push(eq(academicTerms.status, options.status));
    }

    const query = client
      .select()
      .from(academicTerms)
      .where(and(...conditions));

    return await runSelect<AcademicTerm>(query, undefined, asc(academicTerms.startDate));
  },

  /**
   * Get single term by ID, strictly scoped to tenant.
   */
  async getAcademicTermById(
    tenantId: string,
    termId: string,
    options?: { dbClient?: typeof db }
  ): Promise<AcademicTerm | null> {
    const client = options?.dbClient || db;
    const safeTenantId = (tenantId || '').trim();
    if (!safeTenantId) throw new Error('Tenant ID wajib disertakan');

    const query = client
      .select()
      .from(academicTerms)
      .where(and(eq(academicTerms.id, termId), eq(academicTerms.tenantId, safeTenantId)));

    const rows = await runSelect<AcademicTerm>(query, 1);
    return rows[0] || null;
  },

  /**
   * Get currently active / current term for a tenant.
   */
  async getCurrentAcademicTerm(
    tenantId: string,
    options?: { dbClient?: typeof db }
  ): Promise<AcademicTerm | null> {
    const client = options?.dbClient || db;
    const safeTenantId = (tenantId || '').trim();
    if (!safeTenantId) throw new Error('Tenant ID wajib disertakan');

    const query = client
      .select()
      .from(academicTerms)
      .where(and(eq(academicTerms.tenantId, safeTenantId), eq(academicTerms.isCurrent, true)));

    const rows = await runSelect<AcademicTerm>(query, 1);
    return rows[0] || null;
  },

  /**
   * Create a new Academic Term.
   * Enforces cross-tenant check: academicYearId MUST belong to the SAME tenant.
   * Enforces date containment: term dates must fall within the academic year dates.
   */
  async createAcademicTerm(
    tenantId: string,
    input: CreateAcademicTermInput,
    options?: { dbClient?: typeof db }
  ): Promise<AcademicTerm> {
    const client = options?.dbClient || db;
    const safeTenantId = (tenantId || '').trim();
    if (!safeTenantId) throw new Error('Tenant ID wajib disertakan');

    const trimmedName = (input.name || '').trim();
    if (!trimmedName) throw new Error('Nama semester wajib diisi');

    assertDateRange(input.startDate, input.endDate, 'semester');

    const targetStatus = input.status === 'active' ? 'active' : 'planned';
    const makeCurrent = input.isCurrent === true || targetStatus === 'active';

    try {
      return await runTx(client, async (tx) => {
        // 1. Verify that parent Academic Year exists AND belongs to the SAME tenant
        const query = tx
          .select()
          .from(academicYears)
          .where(and(eq(academicYears.id, input.academicYearId), eq(academicYears.tenantId, safeTenantId)));

        const parentYear = await runSelect<AcademicYear>(query, 1);

        if (parentYear.length === 0) {
          throw new Error('Tahun ajaran tidak ditemukan atau tidak berada dalam instansi yang sama (Cross-tenant rejected)');
        }

        const year = parentYear[0];

        // 2. Date containment validation
        if (input.startDate < year.startDate || input.endDate > year.endDate) {
          throw new Error(
            `Tanggal semester (${input.startDate} s.d. ${input.endDate}) harus berada dalam rentang tahun ajaran (${year.startDate} s.d. ${year.endDate})`
          );
        }

        // 3. If making current or active: update any existing active/current terms for this tenant
        if (makeCurrent) {
          await runUpdate(
            tx,
            academicTerms,
            { isCurrent: false, status: 'closed', updatedAt: new Date() },
            and(eq(academicTerms.tenantId, safeTenantId), eq(academicTerms.isCurrent, true))
          );

          if (targetStatus === 'active') {
            await runUpdate(
              tx,
              academicTerms,
              { status: 'closed', isCurrent: false, updatedAt: new Date() },
              and(eq(academicTerms.tenantId, safeTenantId), eq(academicTerms.status, 'active'))
            );
          }
        }

        // 4. Insert new term
        const id = `term_${crypto.randomUUID()}`;
        const newRecord: NewAcademicTerm = {
          id,
          tenantId: safeTenantId,
          academicYearId: input.academicYearId,
          name: trimmedName,
          startDate: input.startDate,
          endDate: input.endDate,
          isCurrent: makeCurrent,
          status: targetStatus,
        };

        const inserted = await runInsert<AcademicTerm>(tx, academicTerms, newRecord);
        return inserted;
      });
    } catch (err: any) {
      if (
        err?.code === '23505' ||
        err?.message?.includes('uq_academic_terms_tenant_year_name') ||
        err?.message?.includes('duplicate key') ||
        err?.message?.includes('unique constraint')
      ) {
        throw new Error(`Semester dengan nama "${trimmedName}" sudah ada pada tahun ajaran ini`);
      }
      throw err;
    }
  },

  /**
   * Activate an academic term and mark it current.
   */
  async activateAcademicTerm(
    tenantId: string,
    termId: string,
    options?: { dbClient?: typeof db }
  ): Promise<AcademicTerm> {
    const client = options?.dbClient || db;
    const safeTenantId = (tenantId || '').trim();
    if (!safeTenantId) throw new Error('Tenant ID wajib disertakan');

    return await runTx(client, async (tx) => {
      // 1. Locate target term
      const query = tx
        .select()
        .from(academicTerms)
        .where(and(eq(academicTerms.id, termId), eq(academicTerms.tenantId, safeTenantId)));

      const rows = await runSelect<AcademicTerm>(query, 1);
      const target = rows[0];
      if (!target) {
        throw new Error(`Semester dengan ID "${termId}" tidak ditemukan`);
      }

      // 2. Check parent year status
      const yearQuery = tx
        .select()
        .from(academicYears)
        .where(and(eq(academicYears.id, target.academicYearId), eq(academicYears.tenantId, safeTenantId)));

      const parentYearRows = await runSelect<AcademicYear>(yearQuery, 1);

      if (parentYearRows[0]?.status === 'archived') {
        throw new Error('Tidak dapat mengaktifkan semester pada tahun ajaran yang telah diarsipkan');
      }

      // 3. Clear current & active on all other terms for this tenant
      await runUpdate(
        tx,
        academicTerms,
        { isCurrent: false, status: 'closed', updatedAt: new Date() },
        and(
          eq(academicTerms.tenantId, safeTenantId),
          sql`${academicTerms.id} != ${termId}`,
          sql`(${academicTerms.isCurrent} = true OR ${academicTerms.status} = 'active')`
        )
      );

      // 4. Activate target term
      const updated = await runUpdate<AcademicTerm>(
        tx,
        academicTerms,
        { status: 'active', isCurrent: true, updatedAt: new Date() },
        and(eq(academicTerms.id, termId), eq(academicTerms.tenantId, safeTenantId))
      );

      return updated[0];
    });
  },

  /**
   * Close an academic term.
   */
  async closeAcademicTerm(
    tenantId: string,
    termId: string,
    options?: { dbClient?: typeof db }
  ): Promise<AcademicTerm> {
    const client = options?.dbClient || db;
    const safeTenantId = (tenantId || '').trim();
    if (!safeTenantId) throw new Error('Tenant ID wajib disertakan');

    const updated = await runUpdate<AcademicTerm>(
      client,
      academicTerms,
      { status: 'closed', isCurrent: false, updatedAt: new Date() },
      and(eq(academicTerms.id, termId), eq(academicTerms.tenantId, safeTenantId))
    );

    if (updated.length === 0) {
      throw new Error(`Semester dengan ID "${termId}" tidak ditemukan`);
    }

    return updated[0];
  },
};
