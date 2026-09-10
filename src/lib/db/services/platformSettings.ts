/* eslint-disable local-rules/enforce-tenant-id-param */
// ========================================
// Platform SaaS Global Company Settings Domain Service
// Traceability: WP-SAAS-COMPANY-CONTACT-EXECUTION-001
// ========================================

import { demoDb, isDemoMode } from '@/lib/mock-store';

export interface PlatformSettings {
  id: string;
  companyName: string;
  companyEmail: string | null;
  companyPhone: string | null;
  companyWhatsApp: string | null;
  companyWebsite: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface UpdatePlatformSettingsInput {
  companyEmail?: string | null;
  companyPhone?: string | null;
  companyWhatsApp?: string | null;
  companyWebsite?: string | null;
}

const DEFAULT_PLATFORM_SETTINGS_ID = 'default';
const LOCKED_COMPANY_NAME = 'SERZEN DEV';

export const platformSettingsService = {
  /**
   * Retrieves platform settings.
   * Guaranteed to return companyName = "SERZEN DEV".
   */
  async get(): Promise<PlatformSettings> {
    if (isDemoMode() || typeof window !== 'undefined' || process.env.NODE_ENV === 'test') {
      const mockRecord = demoDb.get<PlatformSettings>('platformSettings', DEFAULT_PLATFORM_SETTINGS_ID);
      if (mockRecord) {
        return {
          ...mockRecord,
          companyName: LOCKED_COMPANY_NAME, // Always locked
        };
      }
      return {
        id: DEFAULT_PLATFORM_SETTINGS_ID,
        companyName: LOCKED_COMPANY_NAME,
        companyEmail: null,
        companyPhone: null,
        companyWhatsApp: null,
        companyWebsite: null,
      };
    }

    try {
      const res = await fetch('/api/saas/company-contact');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            id: DEFAULT_PLATFORM_SETTINGS_ID,
            companyName: LOCKED_COMPANY_NAME,
            companyEmail: json.data.companyEmail || null,
            companyPhone: json.data.companyPhone || null,
            companyWhatsApp: json.data.companyWhatsApp || null,
            companyWebsite: json.data.companyWebsite || null,
          };
        }
      }
    } catch (e) {
      console.warn('[platformSettingsService.get] Client fetch failed, using fallback:', e);
    }

    const mockRecord = demoDb.get<PlatformSettings>('platformSettings', DEFAULT_PLATFORM_SETTINGS_ID);
    if (mockRecord) {
      return {
        ...mockRecord,
        companyName: LOCKED_COMPANY_NAME,
      };
    }

    return {
      id: DEFAULT_PLATFORM_SETTINGS_ID,
      companyName: LOCKED_COMPANY_NAME,
      companyEmail: null,
      companyPhone: null,
      companyWhatsApp: null,
      companyWebsite: null,
    };
  },

  /**
   * Updates platform settings for SERZEN DEV.
   * companyName is hard-locked and cannot be altered.
   */
  async update(input: UpdatePlatformSettingsInput): Promise<PlatformSettings> {
    const payload = {
      companyName: LOCKED_COMPANY_NAME,
      companyEmail: input.companyEmail !== undefined ? (input.companyEmail ? input.companyEmail.trim() : null) : null,
      companyPhone: input.companyPhone !== undefined ? (input.companyPhone ? input.companyPhone.trim() : null) : null,
      companyWhatsApp: input.companyWhatsApp !== undefined ? (input.companyWhatsApp ? input.companyWhatsApp.trim() : null) : null,
      companyWebsite: input.companyWebsite !== undefined ? (input.companyWebsite ? input.companyWebsite.trim() : null) : null,
      updatedAt: new Date(),
    };

    // Update demo store for client/offline/test reactivity
    const existing = demoDb.get<PlatformSettings>('platformSettings', DEFAULT_PLATFORM_SETTINGS_ID);
    if (existing) {
      demoDb.update('platformSettings', DEFAULT_PLATFORM_SETTINGS_ID, payload);
    } else {
      demoDb.create('platformSettings', { id: DEFAULT_PLATFORM_SETTINGS_ID, ...payload });
    }

    return await this.get();
  },
};
