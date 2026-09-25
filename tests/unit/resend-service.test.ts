import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveSenderEmail, sendTenantInvitationEmail, _resetResendInstanceForTesting } from '@/lib/email/resend-service';
import { Resend } from 'resend';

const mockSend = vi.fn();

vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(function (this: any) {
      this.emails = {
        send: mockSend,
      };
      return this;
    }),
  };
});

describe('WP-RESEND-SENDER-DOMAIN-MIGRATION-001 — Resend Sender & Service Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    _resetResendInstanceForTesting();
    process.env = { ...originalEnv };
    delete process.env.RESEND_FROM_EMAIL;
    delete process.env.RESEND_SENDER_EMAIL;
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
    _resetResendInstanceForTesting();
  });

  describe('resolveSenderEmail()', () => {
    it('resolves to verified production domain by default: Ma\'had Manager <noreply@serzen-dev.my.id>', () => {
      const sender = resolveSenderEmail();
      expect(sender).toBe("Ma'had Manager <noreply@serzen-dev.my.id>");
    });

    it('formats bare email from RESEND_FROM_EMAIL with default display name', () => {
      process.env.RESEND_FROM_EMAIL = 'admin@serzen-dev.my.id';
      const sender = resolveSenderEmail();
      expect(sender).toBe("Ma'had Manager <admin@serzen-dev.my.id>");
    });

    it('preserves full formatted sender if already containing display name and brackets', () => {
      process.env.RESEND_FROM_EMAIL = "Ma'had Manager Official <invitations@serzen-dev.my.id>";
      const sender = resolveSenderEmail();
      expect(sender).toBe("Ma'had Manager Official <invitations@serzen-dev.my.id>");
    });

    it('strictly rejects any resend.dev testing domain', () => {
      process.env.RESEND_FROM_EMAIL = 'onboarding@resend.dev';
      expect(() => resolveSenderEmail()).toThrow(/PROHIBITED_SENDER_DOMAIN.*resend\.dev/i);

      process.env.RESEND_FROM_EMAIL = "Ma'had Manager <test@resend.dev>";
      expect(() => resolveSenderEmail()).toThrow(/PROHIBITED_SENDER_DOMAIN.*resend\.dev/i);
    });

    it('strictly rejects Gmail addresses as sender FROM address', () => {
      process.env.RESEND_FROM_EMAIL = 'myadmin@gmail.com';
      expect(() => resolveSenderEmail()).toThrow(/PROHIBITED_SENDER_DOMAIN.*gmail\.com/i);
    });
  });

  describe('sendTenantInvitationEmail()', () => {
    const mockEmailProps = {
      adminName: 'Ustadz Ahmad',
      tenantName: 'Pesantren Al-Hikmah',
      tenantCode: 'AH2601',
      subdomain: 'alhikmah.madev.id',
      activationUrl: 'https://preview.domain/auth/callback?token_hash=xyz&type=invite',
    };

    it('returns RESEND_API_KEY_MISSING when RESEND_API_KEY is not configured', async () => {
      delete process.env.RESEND_API_KEY;
      const result = await sendTenantInvitationEmail('admin@alhikmah.id', mockEmailProps);
      expect(result.success).toBe(false);
      expect(result.error).toBe('RESEND_API_KEY_MISSING');
    });

    it('dispatches email with verified sender domain when configured', async () => {
      process.env.RESEND_API_KEY = 're_test_valid_key';
      process.env.RESEND_FROM_EMAIL = 'noreply@serzen-dev.my.id';

      mockSend.mockResolvedValueOnce({
        data: { id: 'msg_test_123' },
        error: null,
      });

      const result = await sendTenantInvitationEmail('admin@alhikmah.id', mockEmailProps);

      expect(result.success).toBe(true);
      expect(result.messageId).toBe('msg_test_123');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "Ma'had Manager <noreply@serzen-dev.my.id>",
          to: 'admin@alhikmah.id',
          subject: 'Undangan Aktivasi Akun Administrator - Pesantren Al-Hikmah (AH2601)',
        })
      );
    });

    it('handles Resend API error cleanly without crashing', async () => {
      process.env.RESEND_API_KEY = 're_test_valid_key';

      mockSend.mockResolvedValueOnce({
        data: null,
        error: { name: 'validation_error', message: 'Domain not verified' },
      });

      const result = await sendTenantInvitationEmail('admin@alhikmah.id', mockEmailProps);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Domain not verified');
    });

    it('handles prohibited sender domain cleanly with error return', async () => {
      process.env.RESEND_API_KEY = 're_test_valid_key';
      process.env.RESEND_FROM_EMAIL = 'onboarding@resend.dev';

      const result = await sendTenantInvitationEmail('admin@alhikmah.id', mockEmailProps);

      expect(result.success).toBe(false);
      expect(result.error).toContain('PROHIBITED_SENDER_DOMAIN');
    });
  });
});
