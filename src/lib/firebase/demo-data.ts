// ========================================
// Demo Mode Data Provider — Clean State Engine
// Default disabled unless NEXT_PUBLIC_DEMO_MODE=true
// ========================================

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

// ========================================
// In-Memory Demo Store — Clean Empty State
// ========================================

let _nextId = 1000;

function nextId(): string {
  return String(++_nextId);
}

const store: Record<string, unknown[]> = {};
let initialized = false;

function initStore() {
  if (initialized) return;
  initialized = true;
  store['santri'] = [];
  store['alumni'] = [];
  store['asrama'] = [];
  store['kamar'] = [];
  store['kelas'] = [];
  store['mapel'] = [];
  store['masterPelanggaran'] = [];
  store['pelanggaran'] = [];
  store['hukuman'] = [];
  store['quest'] = [];
  store['notifications'] = [];
  store['tolerancePolicies'] = [];
  store['teacherAssignments'] = [];
  store['masterHukuman'] = [];
  store['masterTingkat'] = [];
  store['masterJenjang'] = [];
  store['guru'] = [];
  store['governanceCase'] = [];
  store['academic_years'] = [];
  store['academic_terms'] = [];
  store['academic_ledger_records'] = [];
  store['academic_transcripts'] = [];
}

export function getDemoCollection<T>(collectionName: string): T[] {
  initStore();
  return (store[collectionName] as T[]) || [];
}

export const demoDb = {
  get<T>(collectionName: string, id: string): T | null {
    initStore();
    const items = (store[collectionName] as (T & { id: string })[]) || [];
    return items.find((item) => item.id === id) || null;
  },

  list<T>(collectionName: string, field?: string, value?: unknown): T[] {
    initStore();
    const items = (store[collectionName] as T[]) || [];
    if (!field || value === undefined) return [...items];
    return items.filter((item) => (item as Record<string, unknown>)[field] === value);
  },

  create<T>(collectionName: string, data: Record<string, unknown>): string {
    initStore();
    if (!store[collectionName]) store[collectionName] = [];
    const id = (data.id as string) || nextId();
    const newItem = { ...data, id };
    store[collectionName].push(newItem);
    notifySubscribers(collectionName);
    return id;
  },

  update<T>(collectionName: string, id: string, data: Record<string, unknown>): void {
    initStore();
    const items = (store[collectionName] as (T & { id: string })[]) || [];
    const index = items.findIndex((item) => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...data, id };
      notifySubscribers(collectionName);
    }
  },

  delete(collectionName: string, id: string): void {
    initStore();
    if (!store[collectionName]) return;
    store[collectionName] = (store[collectionName] as { id: string }[]).filter((item) => item.id !== id);
    notifySubscribers(collectionName);
  },

  subscribe(callback: (collectionName?: string) => void): () => void {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  },
};

const subscribers = new Set<(collectionName?: string) => void>();

function notifySubscribers(collectionName?: string) {
  subscribers.forEach((cb) => cb(collectionName));
}
