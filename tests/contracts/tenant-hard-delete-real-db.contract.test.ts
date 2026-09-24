import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/lib/db/schema';
import * as academicWorkspaceSchema from '@/lib/db/schema/academic_workspace';
import { describe, it, expect, afterAll } from 'vitest';
import { tenantHardDeleteService } from '@/modules/saas/services/tenant-hard-delete-service';
import { eq, sql } from 'drizzle-orm';

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

describe('Real PostgreSQL Generated SQL & Schema Integration Verification', () => {
  const targetId = 't_1789178874071_8vsju'; // RTV02
  const client = postgres(dbUrl, { prepare: false });
  const liveDb = drizzle(client, { schema: { ...schema, ...academicWorkspaceSchema } });

  afterAll(async () => {
    await client.end({ timeout: 5 });
  });

  it('verifies planHardDelete executes flawlessly on actual PostgreSQL without schema drift errors', async () => {
    // 1. Pre-check target tenant RTV02
    const tenantBefore = await liveDb.select().from(schema.tenants).where(eq(schema.tenants.id, targetId));
    expect(tenantBefore.length).toBe(1);
    expect(tenantBefore[0].code).toBe('RTV02');

    // 2. Execute planHardDelete on live PostgreSQL database
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

    // 3. Assert plan correctness
    expect(plan.tenantId).toBe(targetId);
    expect(plan.tenantCode).toBe('RTV02');
    expect(plan.isEligible).toBe(true);
    expect(plan.isProtected).toBe(false);
    expect(plan.confirmationCode).toBe(`DELETE-RTV02-${tenantBefore[0].slug.toLowerCase()}`);

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

    // 4. Safety invariants: ensure RTV02, SR2601, RTV01 are intact
    const tenantAfter = await liveDb.select().from(schema.tenants).where(eq(schema.tenants.id, targetId));
    expect(tenantAfter.length).toBe(1);
    expect(tenantAfter[0].status).toBe(tenantBefore[0].status);

    const sr2601 = await liveDb.select().from(schema.tenants).where(eq(schema.tenants.code, 'SR2601'));
    expect(sr2601.length).toBe(1);

    const rtv01 = await liveDb.select().from(schema.tenants).where(eq(schema.tenants.code, 'RTV01'));
    expect(rtv01.length).toBe(1);

    const counterRes = await liveDb.execute<{ year: number; last_sequence: number }>(
      sql`SELECT year, last_sequence FROM tenant_code_counters WHERE year = 2026;`
    );
    expect(Number((counterRes as any)[0].last_sequence)).toBe(1);
  }, 30000);
});
