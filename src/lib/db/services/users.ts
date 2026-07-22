import { db } from '../index';
import { users } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

export async function createUser(data: typeof users.$inferInsert) {
  const inserted = await db.insert(users).values(data).returning();
  return inserted[0];
}

export async function updateUser(id: string, data: Partial<typeof users.$inferInsert>) {
  const updated = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return updated[0];
}
