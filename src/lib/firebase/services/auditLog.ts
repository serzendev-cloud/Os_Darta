import {
  collection, addDoc, getDocs, query, orderBy, limit,
  where, Timestamp, type QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/config/collections';
import { isDemoMode, demoDb } from '@/lib/firebase/demo-data';
import type { AuditLog, FirestoreAuditLog } from '@/types/audit';

function toApp(fs: FirestoreAuditLog, id: string): AuditLog {
  return {
    id,
    action: fs.action,
    entityType: fs.entityType,
    entityId: fs.entityId,
    entityLabel: fs.entityLabel,
    actorId: fs.actorId,
    actorName: fs.actorName,
    actorRole: fs.actorRole,
    changes: fs.changes,
    metadata: fs.metadata,
    timestamp: fs.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  };
}

export const auditLogService = {
  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string> {
    if (isDemoMode()) {
      const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await demoDb.create(COLLECTIONS.AUDIT_LOG, { ...entry, id, createdAt: new Date().toISOString() });
      return id;
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.AUDIT_LOG), {
      ...entry,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  async list(entityType?: string, entityId?: string, maxResults = 50): Promise<AuditLog[]> {
    if (isDemoMode()) {
      const all = await demoDb.list(COLLECTIONS.AUDIT_LOG) as AuditLog[];
      let filtered = all;
      if (entityType) filtered = filtered.filter((e) => e.entityType === entityType);
      if (entityId) filtered = filtered.filter((e) => e.entityId === entityId);
      return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, maxResults);
    }

    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(maxResults)];
    if (entityType) constraints.unshift(where('entityType', '==', entityType));
    if (entityId) constraints.unshift(where('entityId', '==', entityId));

    const snapshot = await getDocs(query(collection(db, COLLECTIONS.AUDIT_LOG), ...constraints));
    return snapshot.docs.map((doc) => toApp(doc.data() as FirestoreAuditLog, doc.id));
  },

  async getByActor(actorId: string, maxResults = 30): Promise<AuditLog[]> {
    if (isDemoMode()) {
      const all = await demoDb.list(COLLECTIONS.AUDIT_LOG) as AuditLog[];
      return all
        .filter((e) => e.actorId === actorId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxResults);
    }

    const snapshot = await getDocs(query(
      collection(db, COLLECTIONS.AUDIT_LOG),
      where('actorId', '==', actorId),
      orderBy('createdAt', 'desc'),
      limit(maxResults),
    ));
    return snapshot.docs.map((doc) => toApp(doc.data() as FirestoreAuditLog, doc.id));
  },
};
