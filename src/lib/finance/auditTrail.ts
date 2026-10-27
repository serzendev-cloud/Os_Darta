// ==============================================================================
// Financial Audit Trail Engine (Append-Only, Zero-Credential Leakage)
// Work Package: WP-M2-FINANCIAL-AUDIT-TRAIL-AND-DIGITAL-CCTV-001
// Compliance: PO Decisions 3, 4, 6, 8
// ==============================================================================

import crypto from 'crypto';
import { db } from '@/lib/db';
import { financialAuditLogs } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Keys that MUST NEVER be stored in audit logs or metadata
const SENSITIVE_KEY_PATTERNS = [
  /pin/i,
  /password/i,
  /secret/i,
  /salt/i,
  /pepper/i,
  /token/i,
  /authorization/i,
  /credential/i,
  /cookie/i,
];

/**
 * Deeply sanitizes any payload to ensure no sensitive credentials leak into logs.
 */
export function sanitizeFinancialAuditPayload<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeFinancialAuditPayload(item)) as unknown as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      sanitized[key] = '[REDACTED_SENSITIVE_CREDENTIAL]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeFinancialAuditPayload(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

export type FinancialActorRole =
  | 'admin_keuangan'
  | 'pic_kantin'
  | 'kasir'
  | 'wali_kelas'
  | 'santri'
  | 'wali'
  | 'system';

export type FinancialAction =
  | 'CANTEEN_PAYMENT'
  | 'REFUND_REQUEST'
  | 'REFUND_APPROVED'
  | 'REFUND_REJECTED'
  | 'ADJUSTMENT'
  | 'RECONCILIATION_RUN'
  | 'ANOMALY_FLAGGED'
  | 'ANOMALY_RESOLVED'
  | 'SPP_INSTALLMENT_APPLIED'
  | 'SPP_INSTALLMENT_APPROVED'
  | 'SPP_INSTALLMENT_REJECTED'
  | 'SPP_INSTALLMENT_PAYMENT'
  | 'SPP_DIRECT_PAYMENT'
  | 'SPP_CONFIG_CREATED'
  | 'SPP_CONFIG_UPDATED'
  | 'BATCH_BILLING_GENERATED'
  | 'ADDITIONAL_BILL_PUBLISHED'
  | 'BILL_CANCELLED'
  | 'REPORT_EXPORTED';

export type FinancialTargetEntity =
  | 'canteen_transaction'
  | 'wallet'
  | 'merchant'
  | 'canteen_refund'
  | 'reconciliation'
  | 'spp_bill'
  | 'spp_installment_plan'
  | 'spp_installment_schedule'
  | 'spp_configuration'
  | 'billing_campaign';

export interface CreateFinancialAuditLogInput {
  tenantId: string;
  correlationId?: string;
  actorId: string;
  actorName: string;
  actorRole: FinancialActorRole;
  action: FinancialAction;
  targetEntity: FinancialTargetEntity;
  targetId: string;
  amount?: number;
  stateBefore?: Record<string, unknown> | null;
  stateAfter?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: 'SUCCESS' | 'FAILED' | 'REVERTED';
  metadata?: Record<string, unknown> | null;
}

export class FinancialAuditService {
  /**
   * Appends an immutable audit log entry.
   * Can accept either a top-level DB client or a transactional client.
   */
  async log(
    input: CreateFinancialAuditLogInput,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    txClient?: any
  ): Promise<string> {
    const client = txClient || db;
    const logId = `fa_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const correlationId = input.correlationId || `corr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    // Strictly sanitize states and metadata
    const sanitizedBefore = input.stateBefore ? sanitizeFinancialAuditPayload(input.stateBefore) : null;
    const sanitizedAfter = input.stateAfter ? sanitizeFinancialAuditPayload(input.stateAfter) : null;
    const sanitizedMetadata = input.metadata ? sanitizeFinancialAuditPayload(input.metadata) : null;

    await client.insert(financialAuditLogs).values({
      id: logId,
      tenantId: input.tenantId,
      correlationId,
      actorId: input.actorId,
      actorName: input.actorName,
      actorRole: input.actorRole,
      action: input.action,
      targetEntity: input.targetEntity,
      targetId: input.targetId,
      amount: input.amount || 0,
      stateBefore: sanitizedBefore,
      stateAfter: sanitizedAfter,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
      status: input.status || 'SUCCESS',
      metadata: sanitizedMetadata,
      createdAt: new Date(),
    });

    return logId;
  }

  /**
   * Retrieves financial audit logs for a tenant with optional filtering.
   */
  async queryLogs({
    tenantId,
    correlationId,
    actorId,
    action,
    limit = 50,
  }: {
    tenantId: string;
    correlationId?: string;
    actorId?: string;
    action?: FinancialAction;
    limit?: number;
  }) {
    const extraConditions = [];
    if (correlationId) extraConditions.push(eq(financialAuditLogs.correlationId, correlationId));
    if (actorId) extraConditions.push(eq(financialAuditLogs.actorId, actorId));
    if (action) extraConditions.push(eq(financialAuditLogs.action, action));

    return await db
      .select()
      .from(financialAuditLogs)
      .where(and(eq(financialAuditLogs.tenantId, tenantId), ...extraConditions))
      .orderBy(desc(financialAuditLogs.createdAt))
      .limit(limit);
  }
}

export const financialAuditService = new FinancialAuditService();
