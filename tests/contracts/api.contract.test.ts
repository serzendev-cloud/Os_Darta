/* eslint-disable @typescript-eslint/no-explicit-any */
// ========================================
// Automated API Contract Tests
// Traceability: CIP-WP-007 | Rule SMB-221
// ========================================

import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';

// Mock Drizzle module with mock data for endpoints under test
vi.mock('@/lib/db', () => {
  const mockDb = {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation((table) => {
        let data: any[] = [];
        const symbols = Object.getOwnPropertySymbols(table || {});
        const nameSymbol = symbols.find(s => s.toString().includes('drizzle:Name'));
        const tableName = nameSymbol ? (table as any)[nameSymbol] : '';
        
        if (tableName === 'canteens') {
          data = [{ id: 'cant-1', name: 'Kantin Utama', tenantId: 'default' }];
        } else if (tableName === 'rfid_cards') {
          data = [{ id: 'card-1', cardUid: 'card-123', hashedPin: '123456', santriId: 'santri-1', status: 'active', tenantId: 'default' }];
        } else if (tableName === 'santri') {
          data = [{ id: 'santri-1', name: 'Zaid', photoUrl: 'img.jpg', kelas: '7A', tenantId: 'default' }];
        } else if (tableName === 'wallets') {
          data = [{ id: 'wallet-1', santriId: 'santri-1', balanceUangSaku: 50000, dailyLimit: 20000, canteenStatus: 'active', tenantId: 'default' }];
        } else if (tableName === 'academic_years') {
          data = [{ id: 'ay-1', name: 'Tahun Ajaran 2026/2027', startDate: '2026-08-01', endDate: '2027-06-30', status: 'planned', tenantId: 'default' }];
        }
        
        return {
          where: vi.fn().mockResolvedValue(data)
        };
      })
    })),
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockResolvedValue({})
    })),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockResolvedValue({})
      }))
    }))
  };

  return { db: mockDb };
});

// Import route handlers
import { GET as getYears, POST as postYears } from '@/app/api/academic/workspace/years/route';
import { POST as postPay } from '@/app/api/canteen/pay/route';

// ── Contract Schema Definitions ──────────────────────────────────────────────

const academicYearResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string(),
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['planned', 'active', 'archived']),
    tenantId: z.string(),
  })
});

const listAcademicYearsResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      status: z.enum(['planned', 'active', 'archived']),
      tenantId: z.string(),
    })
  )
});

const canteenPayResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    transactionId: z.string(),
    santriName: z.string(),
    photoUrl: z.string().nullable().optional(),
    kelas: z.string().nullable().optional(),
    amountDeducted: z.number(),
    remainingBalanceUangSaku: z.number(),
    totalSpentToday: z.number(),
    dailyLimit: z.number(),
    remainingDailyLimit: z.number(),
    vendorName: z.string(),
    timestamp: z.string(),
  })
});

// ── Contract Test Cases ──────────────────────────────────────────────────────

describe('API Contract validation', () => {
  
  describe('Academic Years API Contracts', () => {
    it('should validate GET list response schema contract', async () => {
      const request = new Request('http://localhost/api/academic/workspace/years?tenantId=default');
      const response = await getYears(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      const parseResult = listAcademicYearsResponseSchema.safeParse(json);
      expect(parseResult.success).toBe(true);
    });

    it('should validate POST creation response schema contract', async () => {
      const request = new Request('http://localhost/api/academic/workspace/years', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Tahun Ajaran 2026/2027',
          startDate: '2026-08-01',
          endDate: '2027-06-30',
          status: 'planned',
          tenantId: 'default'
        })
      });
      const response = await postYears(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      const parseResult = academicYearResponseSchema.safeParse(json);
      expect(parseResult.success).toBe(true);
    });

    it('should return bad request (400) on invalid payload input structures', async () => {
      const request = new Request('http://localhost/api/academic/workspace/years', {
        method: 'POST',
        body: JSON.stringify({
          name: '', // Invalid empty name
          startDate: '2026-08-01',
          endDate: '2027-06-30'
        })
      });
      const response = await postYears(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.message).toBe('Validasi gagal');
    });
  });

  describe('Canteen Payment POS API Contracts', () => {
    it('should validate successful payment response schema contract', async () => {
      const request = new Request('http://localhost/api/canteen/pay', {
        method: 'POST',
        body: JSON.stringify({
          cardUid: 'card-123',
          pin: '123456',
          amount: 5000,
          canteenId: 'cant-1',
          tenantId: 'default'
        })
      });
      const response = await postPay(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      const parseResult = canteenPayResponseSchema.safeParse(json);
      expect(parseResult.success).toBe(true);
    });

    it('should validate bad request response on missing required fields', async () => {
      const request = new Request('http://localhost/api/canteen/pay', {
        method: 'POST',
        body: JSON.stringify({
          cardUid: '',
          pin: '123456',
          amount: 5000
        })
      });
      const response = await postPay(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.message).toBe('Card UID, PIN, dan Nominal Belanja wajib diisi');
    });
  });
});
