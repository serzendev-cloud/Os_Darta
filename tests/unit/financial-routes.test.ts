// ==============================================================================
// Financial & Canteen API Routes Contract Tests
// Compliance: PO Decisions 1, 2, 7, 8 (Server-Side Auth & Payload Validation)
// ==============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as payHandler } from '@/app/api/canteen/pay/route';
import { POST as refundRequestHandler } from '@/app/api/canteen/refund/route';
import { POST as refundReviewHandler } from '@/app/api/canteen/refund/review/route';
import { mockFinanceAuthSession } from '../helpers/test-auth-helper';
import * as authzModule from '@/lib/authz/authorization-service';

describe('Financial Routes & Security Contract Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authzModule, 'authorizePlatformRole').mockResolvedValue({ authorized: false } as any);
    mockFinanceAuthSession({ tenantId: 'tenant_test' });
  });

  // ── 1. Canteen Pay Route Contracts ──────────────────────────────────────────
  describe('POST /api/canteen/pay', () => {
    it('returns 400 when cardUid, pin, or amount is missing', async () => {
      const req = new Request('http://localhost:3000/api/canteen/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 15000 }),
      });

      const res = await payHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toContain('wajib diisi');
    });

    it('returns 400 when amount is not a positive integer', async () => {
      const req = new Request('http://localhost:3000/api/canteen/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardUid: 'CARD-100',
          pin: '1234',
          amount: -5000,
        }),
      });

      const res = await payHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toContain('Nominal transaksi harus berupa integer rupiah lebih dari 0');
    });
  });

  // ── 2. Canteen Refund Request Route Contracts ───────────────────────────────
  describe('POST /api/canteen/refund', () => {
    it('returns 400 when transactionId or reason is missing', async () => {
      const req = new Request('http://localhost:3000/api/canteen/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: 'tx_123' }), // missing reason
      });

      const res = await refundRequestHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toContain('wajib diisi');
    });
  });

  // ── 3. Canteen Refund Review Route Contracts (Blocker 2) ───────────────────
  describe('POST /api/canteen/refund/review', () => {
    it('REGRESSION: rejects client-forged body role and returns 403 when authenticated user has no refund permission', async () => {
      mockFinanceAuthSession({
        userId: 'santri_user_1',
        roleCode: 'santri',
        permissions: ['view_own_data'],
      });

      const req = new Request('http://localhost:3000/api/canteen/refund/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refundId: 'ref_123',
          decision: 'APPROVE',
          reviewedByRole: 'admin_keuangan', // Client-forged role in body
        }),
      });

      const res = await refundReviewHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHORIZED_REFUND_ROLE');
    });

    it('REGRESSION: rejects Super Admin caller with 403 Forbidden in Phase 1 (Strictly Admin Keuangan ONLY)', async () => {
      mockFinanceAuthSession({
        userId: 'superadmin_1',
        roleCode: 'SUPER_ADMIN',
      });
      vi.spyOn(authzModule, 'authorizePlatformRole').mockResolvedValue({ authorized: true } as any);

      const req = new Request('http://localhost:3000/api/canteen/refund/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refundId: 'ref_123',
          decision: 'APPROVE',
        }),
      });

      const res = await refundReviewHandler(req);
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.success).toBe(false);
      expect(json.code).toBe('UNAUTHORIZED_REFUND_ROLE');
    });

    it('returns 400 when refundId or decision is missing for authorized server caller', async () => {
      const req = new Request('http://localhost:3000/api/canteen/refund/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          decision: 'APPROVE', // missing refundId
        }),
      });

      const res = await refundReviewHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
    });

    it('returns 400 when decision is invalid (neither APPROVE nor REJECT) for authorized server caller', async () => {
      const req = new Request('http://localhost:3000/api/canteen/refund/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refundId: 'ref_123',
          decision: 'MAYBE', // Invalid
        }),
      });

      const res = await refundReviewHandler(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.message).toContain('APPROVE atau REJECT');
    });
  });
});
