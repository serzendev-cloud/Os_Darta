// Firestore service for runtime app configuration.
// Single document: appConfig/settings
// Follows the standard service pattern with demo mode fallback.

import { db } from '@/lib/firebase/config';
import { COLLECTIONS } from '@/config/collections';
import { isDemoMode, demoDb } from '@/lib/firebase/demo-data';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import type { AppConfig } from '@/lib/config/types';

const SETTINGS_DOC_ID = 'settings';

export const appConfigService = {
  async get(): Promise<AppConfig | null> {
    if (isDemoMode()) {
      return demoDb.get<AppConfig>(COLLECTIONS.APP_CONFIG, SETTINGS_DOC_ID);
    }

    const ref = doc(db, COLLECTIONS.APP_CONFIG, SETTINGS_DOC_ID);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as AppConfig) : null;
  },

  async update(data: Partial<AppConfig>): Promise<void> {
    if (isDemoMode()) {
      const existing = demoDb.get<AppConfig>(COLLECTIONS.APP_CONFIG, SETTINGS_DOC_ID);
      if (existing) {
        demoDb.update(COLLECTIONS.APP_CONFIG, SETTINGS_DOC_ID, {
          ...existing,
          ...data,
          updatedAt: new Date().toISOString(),
        } as Record<string, unknown>);
      } else {
        demoDb.create(COLLECTIONS.APP_CONFIG, {
          id: SETTINGS_DOC_ID,
          ...data,
          updatedAt: new Date().toISOString(),
        } as Record<string, unknown>);
      }
      return;
    }

    const ref = doc(db, COLLECTIONS.APP_CONFIG, SETTINGS_DOC_ID);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() } as Record<string, unknown>);
    } else {
      await setDoc(ref, { ...data, updatedAt: serverTimestamp() });
    }
  },

  subscribe(callback: (config: AppConfig | null) => void): () => void {
    if (isDemoMode()) {
      callback(demoDb.get<AppConfig>(COLLECTIONS.APP_CONFIG, SETTINGS_DOC_ID));
      return demoDb.subscribe((collectionName) => {
        if (collectionName === COLLECTIONS.APP_CONFIG) {
          callback(demoDb.get<AppConfig>(COLLECTIONS.APP_CONFIG, SETTINGS_DOC_ID));
        }
      });
    }

    const ref = doc(db, COLLECTIONS.APP_CONFIG, SETTINGS_DOC_ID);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        callback(snap.data() as AppConfig);
      } else {
        callback(null);
      }
    });
  },
};
