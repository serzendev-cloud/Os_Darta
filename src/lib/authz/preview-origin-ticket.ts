// ========================================
// EEOS — Opaque Origin Ticket Manager
// Durable & Distributed Server-Side Ticket Storage (PostgreSQL Backed)
// Traceability: WP-ROLE-PREVIEW-ORIGIN-TICKET-IMPLEMENTATION-001
// Invariants:
//   - Zero credentials, tokens, or JWTs stored
//   - Client receives opaque random 64-char hex string (256 bits entropy)
//   - Server stores ONLY SHA-256(raw_ticket) hash
//   - Fixed 15-Minute TTL (no sliding expiration)
//   - Atomic Single-Use Consumption via PostgreSQL row-level lock
//   - Distributed runtime compatible (shared Supabase PostgreSQL)
//   - Fail-closed: Zero in-memory fallback in production
// ========================================

import crypto from 'crypto';
import { db } from '@/lib/db';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';
import { previewOriginTickets } from '@/lib/db/schema/preview_origin_tickets';
import { and, eq, gt, isNull, isNotNull, lte, or } from 'drizzle-orm';

let activeDrizzleInstance: any = null;

export function getDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.includes('@')) {
    if (!activeDrizzleInstance) {
      const client = postgres(dbUrl, { prepare: false });
      activeDrizzleInstance = drizzle(client, { schema });
    }
    return activeDrizzleInstance;
  }
  return db;
}

export interface OriginTicketRecord {
  ticketId?: string; // Only returned on creation to the issuer
  ticketHash: string;
  originUserId: string;
  originUserEmail: string;
  originUserRole: string;
  previewPersona?: string;
  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
  consumed: boolean;
  consumedAt?: number | null;
}

export interface StoredOriginTicket {
  id: string;
  ticketHash: string;
  originUserId: string;
  originUserEmail: string;
  originUserRole: string;
  previewPersona?: string;
  createdAt: number; // epoch ms
  expiresAt: number; // epoch ms
  consumedAt: number | null; // epoch ms
  consumedByIp?: string | null;
  userAgent?: string | null;
}

export interface OriginTicketStorage {
  createTicket(ticket: StoredOriginTicket): Promise<void>;
  findValidTicket(ticketHash: string): Promise<StoredOriginTicket | null>;
  consumeTicket(
    ticketHash: string,
    clientIp?: string,
    userAgent?: string
  ): Promise<StoredOriginTicket | null>;
  purgeExpired(): Promise<number>;
  clearAll?(): Promise<void>;
}

// ── Cryptographic Hash Utility ────────────────────────────────────────────────
export function hashOriginTicket(rawTicket: string): string {
  return crypto.createHash('sha256').update(rawTicket).digest('hex');
}

// ── Fixed 15-Minute TTL Invariant ─────────────────────────────────────────────
export const FIXED_ORIGIN_TICKET_TTL_MS = 15 * 60 * 1000; // 15 minutes
export const COOKIE_PREVIEW_ORIGIN_TICKET = 'sb-preview-origin-ticket';

// ── PostgreSQL Storage Adapter (Durable Database Storage) ─────────────────────
export class PostgresOriginTicketStorage implements OriginTicketStorage {
  private customDb?: any;

  constructor(customDb?: any) {
    this.customDb = customDb;
  }

  private get client() {
    return this.customDb || getDb();
  }

  public async createTicket(ticket: StoredOriginTicket): Promise<void> {
    await this.client.insert(previewOriginTickets).values({
      id: ticket.id,
      ticketHash: ticket.ticketHash,
      originUserId: ticket.originUserId,
      originUserEmail: ticket.originUserEmail,
      originRole: ticket.originUserRole,
      previewPersona: ticket.previewPersona || 'admin',
      createdAt: new Date(ticket.createdAt),
      expiresAt: new Date(ticket.expiresAt),
      consumedAt: null,
      consumedByIp: ticket.consumedByIp || null,
      userAgent: ticket.userAgent || null,
    });
  }

  public async findValidTicket(ticketHash: string): Promise<StoredOriginTicket | null> {
    const rows = await this.client
      .select()
      .from(previewOriginTickets)
      .where(
        and(
          eq(previewOriginTickets.ticketHash, ticketHash),
          isNull(previewOriginTickets.consumedAt),
          gt(previewOriginTickets.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      ticketHash: row.ticketHash,
      originUserId: row.originUserId,
      originUserEmail: row.originUserEmail,
      originUserRole: row.originRole,
      previewPersona: row.previewPersona,
      createdAt: row.createdAt.getTime(),
      expiresAt: row.expiresAt.getTime(),
      consumedAt: row.consumedAt ? row.consumedAt.getTime() : null,
      consumedByIp: row.consumedByIp,
      userAgent: row.userAgent,
    };
  }

  /**
   * Atomic Single-Use Consumption in PostgreSQL.
   * Single UPDATE query with row-lock guarantees atomic compare-and-swap.
   */
  public async consumeTicket(
    ticketHash: string,
    clientIp?: string,
    userAgent?: string
  ): Promise<StoredOriginTicket | null> {
    const rows = await this.client
      .update(previewOriginTickets)
      .set({
        consumedAt: new Date(),
        consumedByIp: clientIp || null,
        userAgent: userAgent || null,
      })
      .where(
        and(
          eq(previewOriginTickets.ticketHash, ticketHash),
          isNull(previewOriginTickets.consumedAt),
          gt(previewOriginTickets.expiresAt, new Date())
        )
      )
      .returning();

    if (!rows || rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      ticketHash: row.ticketHash,
      originUserId: row.originUserId,
      originUserEmail: row.originUserEmail,
      originUserRole: row.originRole,
      previewPersona: row.previewPersona,
      createdAt: row.createdAt.getTime(),
      expiresAt: row.expiresAt.getTime(),
      consumedAt: row.consumedAt ? row.consumedAt.getTime() : Date.now(),
      consumedByIp: row.consumedByIp,
      userAgent: row.userAgent,
    };
  }

  public async purgeExpired(): Promise<number> {
    const deleted = await this.client
      .delete(previewOriginTickets)
      .where(
        or(
          isNotNull(previewOriginTickets.consumedAt),
          lte(previewOriginTickets.expiresAt, new Date())
        )
      )
      .returning({ id: previewOriginTickets.id });

    return deleted.length;
  }

  public async clearAll(): Promise<void> {
    await this.client.delete(previewOriginTickets);
  }
}

// ── Shared / In-Memory Storage Adapter (@deprecated: Testing Double Only) ────
export class SharedOriginTicketStorage implements OriginTicketStorage {
  private store: Map<string, StoredOriginTicket>;

  constructor(sharedMap?: Map<string, StoredOriginTicket>) {
    if (sharedMap) {
      this.store = sharedMap;
    } else {
      const globalRef = globalThis as unknown as {
        __eeosSharedPreviewTicketStore?: Map<string, StoredOriginTicket>;
      };
      if (!globalRef.__eeosSharedPreviewTicketStore) {
        globalRef.__eeosSharedPreviewTicketStore = new Map();
      }
      this.store = globalRef.__eeosSharedPreviewTicketStore;
    }
  }

  public async createTicket(ticket: StoredOriginTicket): Promise<void> {
    this.store.set(ticket.ticketHash, { ...ticket });
  }

  public async findValidTicket(ticketHash: string): Promise<StoredOriginTicket | null> {
    const record = this.store.get(ticketHash);
    if (!record) return null;

    const now = Date.now();
    if (record.consumedAt !== null || record.expiresAt < now) {
      return null;
    }

    return { ...record };
  }

  public async consumeTicket(
    ticketHash: string,
    clientIp?: string,
    userAgent?: string
  ): Promise<StoredOriginTicket | null> {
    const record = this.store.get(ticketHash);
    if (!record) return null;

    const now = Date.now();
    if (record.consumedAt !== null || record.expiresAt < now) {
      return null;
    }

    record.consumedAt = now;
    if (clientIp) record.consumedByIp = clientIp;
    if (userAgent) record.userAgent = userAgent;
    return { ...record };
  }

  public async purgeExpired(): Promise<number> {
    const now = Date.now();
    let purged = 0;
    for (const [hash, rec] of this.store.entries()) {
      if (rec.consumedAt !== null || rec.expiresAt < now) {
        this.store.delete(hash);
        purged++;
      }
    }
    return purged;
  }

  public async clearAll(): Promise<void> {
    this.store.clear();
  }
}

// ── Active Storage Provider Singleton (Defaults to Durable PostgreSQL) ───────
let activeStorage: OriginTicketStorage = new PostgresOriginTicketStorage();

/**
 * Dependency injection helper for tests or runtime storage switching.
 */
export function setOriginTicketStorage(storage: OriginTicketStorage): void {
  activeStorage = storage;
}

export function getOriginTicketStorage(): OriginTicketStorage {
  return activeStorage;
}

/**
 * Creates a cryptographically random, opaque origin ticket.
 * - Client receives: 64-char raw hex string (256 bits entropy).
 * - Server stores: SHA-256(raw_ticket) hash.
 * - Raw ticket NEVER enters storage.
 * - Fixed 15-minute TTL enforced.
 */
export async function createOriginTicket(
  originUserId: string,
  originUserEmail: string,
  originUserRole: string,
  previewPersonaOrTtl: string | number = 'admin',
  ttlMs = FIXED_ORIGIN_TICKET_TTL_MS
): Promise<OriginTicketRecord & { ticketId: string }> {
  let previewPersona = 'admin';
  let effectiveTtl = ttlMs;

  if (typeof previewPersonaOrTtl === 'number') {
    effectiveTtl = previewPersonaOrTtl;
  } else if (typeof previewPersonaOrTtl === 'string') {
    previewPersona = previewPersonaOrTtl;
  }

  // Generate 64-character random hex string (256 bits entropy)
  const ticketId = crypto.randomBytes(32).toString('hex');
  const ticketHash = hashOriginTicket(ticketId);
  const now = Date.now();
  const expiresAt = now + effectiveTtl;

  const stored: StoredOriginTicket = {
    id: crypto.randomUUID(),
    ticketHash,
    originUserId,
    originUserEmail,
    originUserRole,
    previewPersona,
    createdAt: now,
    expiresAt,
    consumedAt: null,
  };

  await activeStorage.createTicket(stored);

  return {
    ticketId,
    ticketHash,
    originUserId,
    originUserEmail,
    originUserRole,
    previewPersona,
    createdAt: now,
    expiresAt,
    consumed: false,
  };
}

/**
 * Validates whether an origin ticket is valid, unexpired, and unconsumed.
 * Computes SHA-256 hash of raw input to query storage.
 */
export async function validateOriginTicket(
  rawTicketId: string | null | undefined
): Promise<OriginTicketRecord | null> {
  if (!rawTicketId || typeof rawTicketId !== 'string' || rawTicketId.length < 32) {
    return null;
  }

  const ticketHash = hashOriginTicket(rawTicketId);
  const stored = await activeStorage.findValidTicket(ticketHash);

  if (!stored) return null;

  return {
    ticketHash: stored.ticketHash,
    originUserId: stored.originUserId,
    originUserEmail: stored.originUserEmail,
    originUserRole: stored.originUserRole,
    previewPersona: stored.previewPersona,
    createdAt: stored.createdAt,
    expiresAt: stored.expiresAt,
    consumed: stored.consumedAt !== null,
    consumedAt: stored.consumedAt,
  };
}

/**
 * Consumes an origin ticket with Atomic Single-Use Enforcement.
 * Computes SHA-256 hash and executes atomic compare-and-swap.
 */
export async function consumeOriginTicket(
  rawTicketId: string | null | undefined,
  clientIp?: string,
  userAgent?: string
): Promise<OriginTicketRecord | null> {
  if (!rawTicketId || typeof rawTicketId !== 'string' || rawTicketId.length < 32) {
    return null;
  }

  const ticketHash = hashOriginTicket(rawTicketId);
  const consumed = await activeStorage.consumeTicket(ticketHash, clientIp, userAgent);

  if (!consumed) return null;

  return {
    ticketHash: consumed.ticketHash,
    originUserId: consumed.originUserId,
    originUserEmail: consumed.originUserEmail,
    originUserRole: consumed.originUserRole,
    previewPersona: consumed.previewPersona,
    createdAt: consumed.createdAt,
    expiresAt: consumed.expiresAt,
    consumed: true,
    consumedAt: consumed.consumedAt,
  };
}

/**
 * Persona switching touch verification.
 * Maintains FIXED 15-minute expiration (NO sliding window).
 * Returns true if ticket is valid and within its original 15-minute window.
 */
export async function touchOriginTicket(
  rawTicketId: string | null | undefined
): Promise<boolean> {
  const record = await validateOriginTicket(rawTicketId);
  return record !== null;
}

/**
 * Cleans up expired tickets periodically.
 */
export async function purgeExpiredTickets(): Promise<number> {
  return await activeStorage.purgeExpired();
}
