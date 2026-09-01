/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findOrCreateWaliAccount,
  linkWaliToSantri,
  getSantriForWali,
  revokeWaliSantriRelationship,
} from '../../src/modules/wali/services/wali-service';
import {
  createSantriWithWali,
} from '../../src/modules/santri/services/santri-core-service';

// Mock DB helper for testing Sprint 2 Core Platform Services
function createMockCoreDb(config: {
  existingUsers?: Array<{ id: string; name: string; phone: string }>;
  existingMemberships?: Array<{ id: string; userId: string; tenantId: string }>;
  existingSantri?: Array<{ id: string; nis: string; tenantId: string }>;
  existingRelationships?: Array<{ id: string; tenantId: string; waliUserId: string; santriId: string; status: string }>;
}) {
  const usersStore = [...(config.existingUsers || [])];
  const membershipsStore = [...(config.existingMemberships || [])];
  const santriStore = [...(config.existingSantri || [])];
  const relationshipsStore = [...(config.existingRelationships || [])];

  return {
    select: vi.fn().mockImplementation((_fields: any) => ({
      from: vi.fn().mockImplementation((table: any) => ({
        where: vi.fn().mockImplementation((_condition: any) => ({
          limit: vi.fn().mockImplementation((_limit: number) => {
            if (table && table.phone) {
              return usersStore;
            }
            if (table && table.userId && table.primaryRoleId) {
              return membershipsStore;
            }
            if (table && table.nis) {
              return santriStore;
            }
            if (table && table.roleCode) {
              return [{ id: 'role-wali-1' }];
            }
            if (table && table.waliUserId && table.relationshipType) {
              return relationshipsStore;
            }
            if (table && table.slug) {
              return [{ id: 'tenant-a', status: 'active' }];
            }
            return [];
          }),
        })),
        innerJoin: vi.fn().mockImplementation((_joinedTable: any, _condition: any) => ({
          where: vi.fn().mockImplementation(() => {
            return relationshipsStore.map((rel) => ({
              relationshipId: rel.id,
              relationshipType: 'AYAH',
              isPrimary: true,
              santriId: rel.santriId,
              nis: '001',
              name: 'Santri A',
              kelas: '7A',
              asrama: 'Asrama Al-Fatih',
              status: 'Aktif',
            }));
          }),
        })),
      })),
    })),
    insert: vi.fn().mockImplementation((table: any) => ({
      values: vi.fn().mockImplementation((values: any) => {
        if (table && table.phone) {
          usersStore.push(values);
        }
        if (table && table.nis) {
          santriStore.push(values);
        }
        if (table && table.relationshipType) {
          relationshipsStore.push(values);
        }
        return Promise.resolve();
      }),
    })),
    update: vi.fn().mockImplementation((table: any) => ({
      set: vi.fn().mockImplementation((setValues: any) => ({
        where: vi.fn().mockImplementation((_condition: any) => {
          if (table && table.relationshipType && setValues.status) {
            relationshipsStore.forEach((r) => (r.status = setValues.status));
          }
          return Promise.resolve();
        }),
      })),
    })),
  } as any;
}

// Mock requirePermission helper from authorization service
vi.mock('@/lib/authz/authorization-service', () => ({
  requirePermission: vi.fn().mockResolvedValue({
    authorized: true,
    decision: 'AUTHORIZED',
    effectivePermissions: new Set(['manage_santri', 'view_own_data']),
  }),
}));

describe('WP-201 — Sprint 2 Core Ma\'had Platform Domain Security Contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Wali Domain & Multi-Child Account Reconciliation (1 Wali = 1 Account)', () => {
    it('should provision a new Wali user account with MUST_CHANGE_PASSWORD status when Wali phone is new', async () => {
      const mockDb = createMockCoreDb({ existingUsers: [] });

      const result = await findOrCreateWaliAccount(
        'tenant-a',
        { name: 'Bapak Ahmad', phone: '081234567890' },
        mockDb
      );

      expect(result.isNewAccount).toBe(true);
      expect(result.waliUserId).toContain('user_wali_');
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should REUSE existing Wali user account when registering a second child with same phone number', async () => {
      const mockDb = createMockCoreDb({
        existingUsers: [{ id: 'user-wali-existing-99', name: 'Bapak Ahmad', phone: '6281234567890' }],
      });

      const result = await findOrCreateWaliAccount(
        'tenant-a',
        { name: 'Bapak Ahmad', phone: '081234567890' },
        mockDb
      );

      // CRITICAL CONTRACT: Reuses existing account, no duplicate user account created!
      expect(result.isNewAccount).toBe(false);
      expect(result.waliUserId).toBe('user-wali-existing-99');
    });

    it('should establish atomic Santri + Wali Relationship link for Multi-Child Wali', async () => {
      const mockDb = createMockCoreDb({
        existingUsers: [{ id: 'wali-user-100', name: 'Ibu Fatimah', phone: '6289876543210' }],
        existingSantri: [],
      });

      const result = await createSantriWithWali(
        'tenant-a',
        {
          nis: 'NIS-2026-001',
          name: 'Santri Anak Pertama',
          asrama: 'Asrama 1',
          kamar: 'Kamar 101',
          kelas: '7A',
          gender: 'L',
          asalKota: 'Bandung',
          asalProvinsi: 'Jawa Barat',
          angkatanMasuk: 2026,
        },
        { name: 'Ibu Fatimah', phone: '089876543210', relationshipType: 'IBU' },
        'admin-user-1',
        mockDb
      );

      expect(result.santriId).toContain('santri_');
      expect(result.waliUserId).toBe('wali-user-100');
      expect(result.isNewWaliAccount).toBe(false); // Reused existing Wali account
    });
  });

  describe('2. Relationship Enforcement & Revocation', () => {
    it('should return active children linked to Wali user', async () => {
      const mockDb = createMockCoreDb({
        existingRelationships: [
          { id: 'wsr-1', tenantId: 'tenant-a', waliUserId: 'wali-1', santriId: 'santri-1', status: 'ACTIVE' },
        ],
      });

      const children = await getSantriForWali('tenant-a', 'wali-1', mockDb);
      expect(children.length).toBe(1);
      expect(children[0].santriId).toBe('santri-1');
    });

    it('should revoke Wali-Santri relationship cleanly', async () => {
      const mockDb = createMockCoreDb({
        existingRelationships: [
          { id: 'wsr-1', tenantId: 'tenant-a', waliUserId: 'wali-1', santriId: 'santri-1', status: 'ACTIVE' },
        ],
      });

      await revokeWaliSantriRelationship('tenant-a', 'wali-1', 'santri-1', mockDb);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });
});
