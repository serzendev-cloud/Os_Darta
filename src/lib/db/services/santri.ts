import { db } from '../index';
import { santri } from '../schema';
import { eq } from 'drizzle-orm';

export async function getSantriList() {
  return await db.select().from(santri);
}

export async function getSantriById(id: string) {
  const results = await db.select().from(santri).where(eq(santri.id, id));
  return results[0] || null;
}

export async function getSantriByNis(nis: string) {
  const results = await db.select().from(santri).where(eq(santri.nis, nis));
  return results[0] || null;
}

export async function createSantri(data: typeof santri.$inferInsert) {
  const inserted = await db.insert(santri).values(data).returning();
  return inserted[0];
}

export async function updateSantri(id: string, data: Partial<typeof santri.$inferInsert>) {
  const updated = await db
    .update(santri)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(santri.id, id))
    .returning();
  return updated[0];
}

export async function deleteSantri(id: string) {
  await db.delete(santri).where(eq(santri.id, id));
  return true;
}
