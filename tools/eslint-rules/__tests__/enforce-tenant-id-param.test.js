// ========================================
// Custom ESLint Rule Unit Tests
// Traceability: CIP-WP-008 | Rule SMB-221
// ========================================

import { describe, it, expect } from 'vitest';
import { Linter } from 'eslint';
import enforceTenantIdParam from '../enforce-tenant-id-param.js';

describe('ESLint Rule: enforce-tenant-id-param', () => {
  const linter = new Linter({ configType: 'flat' });

  const verifyCode = (code) => {
    return linter.verify(code, {
      languageOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      plugins: {
        'local-rules': {
          rules: {
            'enforce-tenant-id-param': enforceTenantIdParam,
          },
        },
      },
      rules: {
        'local-rules/enforce-tenant-id-param': 'error',
      },
    });
  };

  it('should flag select queries that omit a tenantId where filter', () => {
    const code = `
      db.select().from(table);
    `;
    const messages = verifyCode(code);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Drizzle query '.select()' is missing a mandatory 'tenantId' check or value.");
  });

  it('should flag insert queries that omit tenantId values', () => {
    const code = `
      db.insert(table).values({ name: 'Pesantren Al-Fatih' });
    `;
    const messages = verifyCode(code);
    expect(messages).toHaveLength(1);
    expect(messages[0].message).toContain("Drizzle query '.insert()' is missing a mandatory 'tenantId' check or value.");
  });

  it('should flag update and delete queries that omit a tenantId where filter', () => {
    const updateCode = `
      db.update(table).set({ name: 'New Name' });
    `;
    const deleteCode = `
      db.delete(table);
    `;
    
    const updateMessages = verifyCode(updateCode);
    expect(updateMessages).toHaveLength(1);
    
    const deleteMessages = verifyCode(deleteCode);
    expect(deleteMessages).toHaveLength(1);
  });

  it('should pass select queries containing a tenantId filter', () => {
    const code = `
      db.select().from(table).where(eq(table.tenantId, tenantId));
    `;
    const messages = verifyCode(code);
    expect(messages).toHaveLength(0);
  });

  it('should pass insert queries containing a tenantId key-value', () => {
    const code = `
      db.insert(table).values({ tenantId: 'pesantren-1', name: 'Al-Fatih' });
    `;
    const messages = verifyCode(code);
    expect(messages).toHaveLength(0);
  });

  it('should pass update queries containing a tenantId where filter', () => {
    const code = `
      db.update(table).set({ name: 'Al-Fatih' }).where(eq(table.tenantId, tenantId));
    `;
    const messages = verifyCode(code);
    expect(messages).toHaveLength(0);
  });

  it('should not flag calls on objects other than db or tx', () => {
    const code = `
      myCustomClient.select().from(table);
    `;
    const messages = verifyCode(code);
    expect(messages).toHaveLength(0);
  });

  it('should pass complex nested conditions containing tenantId checks', () => {
    const code = `
      tx.select().from(table).where(and(eq(table.tenantId, tenantId), eq(table.status, 'active')));
    `;
    const messages = verifyCode(code);
    expect(messages).toHaveLength(0);
  });
});
