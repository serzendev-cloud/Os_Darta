/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { auditLogService } from '../../src/lib/db/services/auditLog';
import { auditRepository, sanitizeAuditData } from '../../src/lib/db/repositories/audit-repository';
import { db } from '../../src/lib/db';
import { auditLogs } from '../../src/lib/db/schema';
import { demoDb } from '../../src/lib/mock-store';

describe('WP-AUDIT-PERSISTENCE-REMEDIATION-001 — Audit Persistence Contracts', () => {
  const originalEnv = process.env.NEXT_PUBLIC_DEMO_MODE;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = originalEnv;
    vi.restoreAllMocks();
  });

  // ── 1. Production Mode Canonical Persistence ──────────────────────────────
  describe('1. Production Persistence (Canonical Drizzle / PostgreSQL)', () => {
    it('persists audit log to PostgreSQL Drizzle repository and NEVER calls demoDb in production', async () => {
      const demoDbSpy = vi.spyOn(demoDb, 'create');
      const insertMock = vi.fn().mockResolvedValue([{ id: 'audit_test_1' }]);
      const valuesMock = vi.fn().mockReturnValue({ returning: insertMock });
      vi.spyOn(db, 'insert').mockReturnValue({ values: valuesMock } as any);

      const recordId = await auditLogService.log({
        actorId: 'superadmin_1',
        actorName: 'Super Administrator',
        actorRole: 'super_admin' as any,
        action: 'provision',
        entityType: 'tenant',
        entityId: 'tenant_al_hikmah_999',
        entityLabel: 'Pesantren Al-Hikmah',
        metadata: {
          tenantSlug: 'al-hikmah',
          plan: 'ENTERPRISE',
        },
      });

      // 1. Must NOT call demoDb
      expect(demoDbSpy).not.toHaveBeenCalled();

      // 2. Must call Drizzle insert on db with auditLogs table
      expect(db.insert).toHaveBeenCalledWith(auditLogs);
      expect(valuesMock).toHaveBeenCalledTimes(1);

      const insertPayload = valuesMock.mock.calls[0][0];
      expect(insertPayload.action).toBe('provision');
      expect(insertPayload.targetEntity).toBe('tenant');
      expect(insertPayload.targetId).toBe('tenant_al_hikmah_999');
      expect(insertPayload.tenantId).toBe('tenant_al_hikmah_999');
      expect(insertPayload.user).toBe('Super Administrator');
      expect(insertPayload.userId).toBe('superadmin_1');
      expect(insertPayload.userRole).toBe('super_admin');
      expect(recordId).toMatch(/^audit_\d+_/);
    });

    it('preserves tenantId from metadata or options', async () => {
      const valuesMock = vi.fn().mockReturnValue({ returning: vi.fn() });
      vi.spyOn(db, 'insert').mockReturnValue({ values: valuesMock } as any);

      await auditLogService.log(
        {
          actorId: 'user_1',
          actorName: 'Admin',
          actorRole: 'admin' as any,
          action: 'create',
          entityType: 'santri',
          entityId: 'santri_123',
        },
        { tenantId: 'tenant_custom_456' }
      );

      const insertPayload = valuesMock.mock.calls[0][0];
      expect(insertPayload.tenantId).toBe('tenant_custom_456');
    });
  });

  // ── 2. Demo Mode Fallback ──────────────────────────────────────────────────
  describe('2. Demo Mode Fallback', () => {
    it('calls demoDb when NEXT_PUBLIC_DEMO_MODE is true', async () => {
      process.env.NEXT_PUBLIC_DEMO_MODE = 'true';

      const demoDbSpy = vi.spyOn(demoDb, 'create').mockReturnValue('mock_demo_id_123');
      const dbInsertSpy = vi.spyOn(db, 'insert');

      const res = await auditLogService.log({
        actorId: 'demo_user',
        actorName: 'Demo User',
        actorRole: 'super_admin' as any,
        action: 'provision',
        entityType: 'tenant',
        entityId: 'tenant_demo_1',
      });

      expect(demoDbSpy).toHaveBeenCalledWith('auditLogs', expect.objectContaining({
        action: 'provision',
        entityType: 'tenant',
        entityId: 'tenant_demo_1',
      }));
      expect(dbInsertSpy).not.toHaveBeenCalled();
      expect(res).toBe('mock_demo_id_123');
    });
  });

  // ── 3. Zero Secret Policy (Sanitization) ───────────────────────────────────
  describe('3. Secret Sanitization Policy', () => {
    it('redacts sensitive fields like passwords, tokens, API keys, secrets in sanitizeAuditData', () => {
      const sensitiveInput = {
        tenantName: 'Pesantren Amanah',
        password: 'SuperSecretPassword123!',
        temporaryPassword: 'temp_secret_pass',
        accessToken: 'eyJhbGciOi...',
        refreshToken: 'refresh_token_abc',
        apiKey: 're_123456789',
        secret: 'system_secret',
        serviceRoleKey: 'eyJh...',
        databaseUrl: 'postgresql://postgres:secret@host:5432/db',
        cookie: 'sb-auth-token=xyz',
        nested: {
          userPassword: 'nested_secret',
          safeField: 'safeValue',
        },
      };

      const sanitized = sanitizeAuditData(sensitiveInput) as Record<string, any>;

      expect(sanitized.tenantName).toBe('Pesantren Amanah');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.temporaryPassword).toBe('[REDACTED]');
      expect(sanitized.accessToken).toBe('[REDACTED]');
      expect(sanitized.refreshToken).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.secret).toBe('[REDACTED]');
      expect(sanitized.serviceRoleKey).toBe('[REDACTED]');
      expect(sanitized.databaseUrl).toBe('[REDACTED]');
      expect(sanitized.cookie).toBe('[REDACTED]');
      expect(sanitized.nested.userPassword).toBe('[REDACTED]');
      expect(sanitized.nested.safeField).toBe('safeValue');
    });

    it('ensures auditRepository automatically redacts credentials before insert', async () => {
      const valuesMock = vi.fn().mockReturnValue({ returning: vi.fn() });
      vi.spyOn(db, 'insert').mockReturnValue({ values: valuesMock } as any);

      await auditRepository.create({
        action: 'provision',
        entityType: 'tenant',
        entityId: 'tenant_leak_test',
        actorId: 'admin_1',
        metadata: {
          ownerEmail: 'admin@pesantren.id',
          password: 'inadvertently_passed_password',
          serviceRoleKey: 'supabase_service_role_key',
        },
      });

      const insertPayload = valuesMock.mock.calls[0][0];
      const parsedDetails = JSON.parse(insertPayload.details);

      expect(parsedDetails.metadata.ownerEmail).toBe('admin@pesantren.id');
      expect(parsedDetails.metadata.password).toBe('[REDACTED]');
      expect(parsedDetails.metadata.serviceRoleKey).toBe('[REDACTED]');
    });
  });

  // ── 4. Transaction Awareness ───────────────────────────────────────────────
  describe('4. Transaction Propagation', () => {
    it('uses provided transaction client (tx) instead of default db connection when provided', async () => {
      const txValuesMock = vi.fn().mockReturnValue({ returning: vi.fn() });
      const mockTx = {
        insert: vi.fn().mockReturnValue({ values: txValuesMock }),
      };
      const dbInsertSpy = vi.spyOn(db, 'insert');

      await auditLogService.log(
        {
          action: 'provision',
          entityType: 'tenant',
          entityId: 'tenant_tx_1',
          actorId: 'super_admin',
          actorName: 'Super Admin',
          actorRole: 'super_admin' as any,
        },
        { tx: mockTx }
      );

      expect(mockTx.insert).toHaveBeenCalledWith(auditLogs);
      expect(dbInsertSpy).not.toHaveBeenCalled();
    });
  });

  // ── 5. Immutability & Safety ───────────────────────────────────────────────
  describe('5. Production Immutability & Audit Safety', () => {
    it('rejects updates to audit logs in production', async () => {
      await expect(auditLogService.update('audit_1', { action: 'delete' as any })).rejects.toThrow(
        /immutable/
      );
    });

    it('rejects deletion of audit logs in production', async () => {
      await expect(auditLogService.delete('audit_1')).rejects.toThrow(/append-only/);
    });
  });
});
