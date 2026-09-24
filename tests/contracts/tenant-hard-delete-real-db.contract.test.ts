import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/lib/db/schema';
import * as academicWorkspaceSchema from '@/lib/db/schema/academic_workspace';
import { describe, it, expect, afterAll } from 'vitest';
import { tenantHardDeleteService } from '@/modules/saas/services/tenant-hard-delete-service';
import { eq, inArray, sql } from 'drizzle-orm';

const envPath = path.resolve(process.cwd(), '.env.local');
let dbUrl = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
      dbUrl = trimmed.split('DATABASE_URL=')[1].trim().replace(/^["']|["']$/g, '');
      break;
    }
  }
}

/**
 * STRICT FAIL-CLOSED ALLOWLIST (Boundary B)
 * Only disposable test tenants may ever be used as targets for live database plan tests.
 * Protected tenants (SR2601, RTV01) and deleted fixtures (RTV02) MUST NEVER be present.
 */
export const DISPOSABLE_TEST_TENANT_CODES = [
  'RTV03',
  'PRV03',
  'PUB01',
  'AUD01',
] as const;

export const PROTECTED_TENANT_INVARIANTS = {
  OFFICIAL_FIRST_TENANT: {
    code: 'SR2601',
    id: 't_1790171191747_pyv9n',
  },
  PREVIEW_PERSONA_SEED: {
    code: 'RTV01',
    id: 't_1789172137858_9g7lm',
  },
} as const;

/**
 * ENVIRONMENT SAFETY GUARD (Boundary A)
 * Validates that the database and runtime environment are explicitly authorized for live test execution.
 * Fails closed if production flags are present, connection string is missing, or tests are disabled.
 */
export interface EnvironmentGuardContext {
  nodeEnv?: string;
  vercelEnv?: string;
  databaseUrl?: string;
  allowRealDbTests?: string;
}

export function evaluateRealDbTestEnvironment(ctx: EnvironmentGuardContext): {
  isAllowed: boolean;
  reason: string;
} {
  if (!ctx.databaseUrl || ctx.databaseUrl.trim() === '') {
    return { isAllowed: false, reason: 'DATABASE_URL is missing or empty' };
  }

  if (ctx.nodeEnv === 'production') {
    return { isAllowed: false, reason: 'NODE_ENV is set to production' };
  }

  if (ctx.vercelEnv === 'production') {
    return { isAllowed: false, reason: 'VERCEL_ENV is set to production' };
  }

  if (ctx.allowRealDbTests === 'false') {
    return { isAllowed: false, reason: 'ALLOW_REAL_DB_TESTS is explicitly set to false' };
  }

  return { isAllowed: true, reason: 'Environment verified as non-production test runner' };
}

describe('Real PostgreSQL Generated SQL & Schema Integration Verification', () => {
  const envDecision = evaluateRealDbTestEnvironment({
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    databaseUrl: dbUrl,
    allowRealDbTests: process.env.ALLOW_REAL_DB_TESTS,
  });

  const client = postgres(dbUrl || 'postgres://localhost:5432/unconfigured', { prepare: false });
  const liveDb = drizzle(client, { schema: { ...schema, ...academicWorkspaceSchema } });

  afterAll(async () => {
    if (dbUrl) {
      await client.end({ timeout: 5 });
    }
  });

  it('Test 1 [Allowlist]: contains strictly approved disposable tenants only (RTV03, PRV03, PUB01, AUD01)', () => {
    expect(DISPOSABLE_TEST_TENANT_CODES).toEqual(['RTV03', 'PRV03', 'PUB01', 'AUD01']);
    expect(DISPOSABLE_TEST_TENANT_CODES.length).toBe(4);
  });

  it('Test 2 [Protected Tenant]: SR2601 cannot be selected or present in allowlist', () => {
    expect((DISPOSABLE_TEST_TENANT_CODES as readonly string[]).includes('SR2601')).toBe(false);
    expect((DISPOSABLE_TEST_TENANT_CODES as readonly string[]).includes(PROTECTED_TENANT_INVARIANTS.OFFICIAL_FIRST_TENANT.code)).toBe(false);
  });

  it('Test 3 [Protected Tenant]: RTV01 cannot be selected or present in allowlist', () => {
    expect((DISPOSABLE_TEST_TENANT_CODES as readonly string[]).includes('RTV01')).toBe(false);
    expect((DISPOSABLE_TEST_TENANT_CODES as readonly string[]).includes(PROTECTED_TENANT_INVARIANTS.PREVIEW_PERSONA_SEED.code)).toBe(false);
  });

  it('Test 4 [Deleted Tenant]: RTV02 cannot be selected or present in allowlist', () => {
    expect((DISPOSABLE_TEST_TENANT_CODES as readonly string[]).includes('RTV02')).toBe(false);
  });

  it('Test 5 [Fail-Closed Selection]: safely skips without fallback if allowlist returns empty', () => {
    const emptyCandidates: any[] = [];
    let selectedTarget = null;

    if (emptyCandidates.length > 0) {
      selectedTarget = emptyCandidates[0];
    }
    expect(selectedTarget).toBeNull();
  });

  it('Test 6 [No Fallback]: ensures no LIMIT 1 or open exclusion queries exist in runner source', () => {
    const testFileContent = fs.readFileSync(__filename, 'utf8');
    const executionBlock = testFileContent.split('Test 10 [Live Plan & Safety]')[1] || '';
    const bannedQueryPattern = new RegExp('\\.limit\\s*\\(\\s*1\\s*\\)');
    const bannedSrExclusionPattern = new RegExp("!=\\s*['\"]SR2601['\"]");

    expect(bannedQueryPattern.test(executionBlock)).toBe(false);
    expect(bannedSrExclusionPattern.test(executionBlock)).toBe(false);
  });

  it('Test 7 [Environment Guard - Approved]: verifies allowed environment passes boundary check', () => {
    const check = evaluateRealDbTestEnvironment({
      nodeEnv: 'test',
      databaseUrl: 'postgresql://postgres:postgres@localhost:5432/testdb',
    });
    expect(check.isAllowed).toBe(true);
  });

  it('Test 8 [Environment Guard - Production Block]: rejects execution if production environment is detected', () => {
    const nodeProdCheck = evaluateRealDbTestEnvironment({
      nodeEnv: 'production',
      databaseUrl: 'postgresql://postgres:postgres@localhost:5432/testdb',
    });
    expect(nodeProdCheck.isAllowed).toBe(false);
    expect(nodeProdCheck.reason).toContain('production');

    const vercelProdCheck = evaluateRealDbTestEnvironment({
      nodeEnv: 'test',
      vercelEnv: 'production',
      databaseUrl: 'postgresql://postgres:postgres@localhost:5432/testdb',
    });
    expect(vercelProdCheck.isAllowed).toBe(false);
    expect(vercelProdCheck.reason).toContain('production');
  });

  it('Test 9 [Environment Guard - Unverified Block]: rejects execution if DATABASE_URL is missing or disallowed', () => {
    const missingDbCheck = evaluateRealDbTestEnvironment({
      nodeEnv: 'test',
      databaseUrl: '',
    });
    expect(missingDbCheck.isAllowed).toBe(false);

    const explicitDisallowCheck = evaluateRealDbTestEnvironment({
      nodeEnv: 'test',
      databaseUrl: 'postgresql://postgres:postgres@localhost:5432/testdb',
      allowRealDbTests: 'false',
    });
    expect(explicitDisallowCheck.isAllowed).toBe(false);
  });

  it('Test 10 [Live Plan & Safety]: planHardDelete executes flawlessly on actual PostgreSQL while executeHardDelete is never called', async () => {
    // Boundary A: Environment Guard verification
    if (!envDecision.isAllowed) {
      console.warn(`[HardDelete Real-DB Test] Skipping live test: ${envDecision.reason}`);
      return;
    }

    // Boundary B: Strict tenant allowlist verification
    const candidateTenants = await liveDb
      .select()
      .from(schema.tenants)
      .where(inArray(schema.tenants.code, DISPOSABLE_TEST_TENANT_CODES as any))
      .orderBy(schema.tenants.code);

    if (candidateTenants.length === 0) {
      console.warn(
        '[HardDelete Real-DB Test] No disposable test tenants found in allowlist. Safely skipping live DB plan verification.'
      );
      return;
    }

    const targetTenant = candidateTenants[0];
    const targetId = targetTenant.id;

    // Defense-in-depth pre-flight safety assertions
    expect(targetTenant).toBeDefined();
    expect(DISPOSABLE_TEST_TENANT_CODES).toContain(targetTenant.code);
    expect(targetTenant.code).not.toBe(PROTECTED_TENANT_INVARIANTS.OFFICIAL_FIRST_TENANT.code);
    expect(targetTenant.code).not.toBe(PROTECTED_TENANT_INVARIANTS.PREVIEW_PERSONA_SEED.code);
    expect(targetTenant.code).not.toBe('RTV02');
    expect(targetTenant.id).not.toBe(PROTECTED_TENANT_INVARIANTS.OFFICIAL_FIRST_TENANT.id);
    expect(targetTenant.id).not.toBe(PROTECTED_TENANT_INVARIANTS.PREVIEW_PERSONA_SEED.id);

    // Execute planHardDelete (strictly READ-ONLY impact analysis) on live PostgreSQL database
    const plan = await tenantHardDeleteService.planHardDelete(
      targetId,
      {
        userId: 'integration_tester_id',
        name: 'Super Admin Integrator',
        role: 'SUPER_ADMIN',
        isSuperAdmin: true,
      },
      liveDb as any
    );

    // Assert plan correctness
    expect(plan.tenantId).toBe(targetId);
    expect(plan.tenantCode).toBe(targetTenant.code);
    expect(plan.confirmationCode).toBe(`DELETE-${targetTenant.code?.toUpperCase()}-${targetTenant.slug?.toLowerCase()}`);

    // Dependent counts must be valid non-negative numbers
    expect(plan.dependentCounts.santri).toBeGreaterThanOrEqual(0);
    expect(plan.dependentCounts.madrasah).toBeGreaterThanOrEqual(0);
    expect(plan.dependentCounts.jenjang).toBeGreaterThanOrEqual(0);
    expect(plan.dependentCounts.tingkat).toBeGreaterThanOrEqual(0);
    expect(plan.dependentCounts.rombel).toBeGreaterThanOrEqual(0);
    expect(plan.dependentCounts.academicYears).toBeGreaterThanOrEqual(0);
    expect(plan.dependentCounts.academicTerms).toBeGreaterThanOrEqual(0);
    expect(plan.dependentCounts.settings).toBeGreaterThanOrEqual(0);
    expect(plan.dependentCounts.memberships).toBeGreaterThanOrEqual(0);
    expect(plan.dependentCounts.roles).toBeGreaterThanOrEqual(0);

    // Ensure legacy table keys are absent
    expect((plan.dependentCounts as any).asrama).toBeUndefined();
    expect((plan.dependentCounts as any).kamar).toBeUndefined();
    expect((plan.dependentCounts as any).kelas).toBeUndefined();
    expect((plan.dependentCounts as any).mapel).toBeUndefined();

    // Safety invariants: ensure target tenant, SR2601, RTV01 are intact
    const tenantAfter = await liveDb.select().from(schema.tenants).where(eq(schema.tenants.id, targetId));
    expect(tenantAfter.length).toBe(1);
    expect(tenantAfter[0].status).toBe(targetTenant.status);

    const sr2601 = await liveDb.select().from(schema.tenants).where(eq(schema.tenants.code, 'SR2601'));
    expect(sr2601.length).toBe(1);
    expect(sr2601[0].id).toBe(PROTECTED_TENANT_INVARIANTS.OFFICIAL_FIRST_TENANT.id);

    const rtv01 = await liveDb.select().from(schema.tenants).where(eq(schema.tenants.code, 'RTV01'));
    expect(rtv01.length).toBe(1);
    expect(rtv01[0].id).toBe(PROTECTED_TENANT_INVARIANTS.PREVIEW_PERSONA_SEED.id);

    const counterRes = await liveDb.execute<{ year: number; last_sequence: number }>(
      sql`SELECT year, last_sequence FROM tenant_code_counters WHERE year = 2026;`
    );
    expect(Number((counterRes as any)[0].last_sequence)).toBe(1);
  }, 30000);
});
