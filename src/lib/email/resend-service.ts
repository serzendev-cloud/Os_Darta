// =============================================================================
// EEOS Resend Email Dispatcher Service
// Server-Only Transactional Email Delivery Engine
// Traceability: WP-TENANT-PROVISIONING-INVITATION-DESIGN-001-REVISION-002
// =============================================================================

import 'server-only';
import { Resend } from 'resend';
import {
  renderTenantInvitationHtml,
  TenantInvitationEmailProps,
} from './templates/tenant-invitation';

export interface SendInvitationEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

let resendInstance: Resend | null = null;

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

/**
 * Dispatches the official Tenant Administrator Onboarding Email via Resend.
 * 
 * SECURITY DIRECTIVES:
 * - API Key is kept strictly server-side.
 * - Raw invitation tokens are NEVER printed to logs.
 * - Only anonymized delivery status is recorded.
 */
export async function sendTenantInvitationEmail(
  toEmail: string,
  emailProps: TenantInvitationEmailProps
): Promise<SendInvitationEmailResult> {
  const resend = getResendClient();

  if (!resend) {
    console.warn('[ResendService] RESEND_API_KEY is not configured in environment. Skipping email dispatch.');
    return {
      success: false,
      error: 'RESEND_API_KEY_MISSING',
    };
  }

  // Sender resolution: Fallback to onboarding@resend.dev if custom sender not configured
  const sender = process.env.RESEND_SENDER_EMAIL || "Ma'had Manager <onboarding@resend.dev>";
  const html = renderTenantInvitationHtml(emailProps);

  try {
    const { data, error } = await resend.emails.send({
      from: sender,
      to: toEmail,
      subject: `Undangan Aktivasi Akun Administrator - ${emailProps.tenantName} (${emailProps.tenantCode})`,
      html,
    });

    if (error) {
      console.error('[ResendService] Dispatch failed with error name:', error.name);
      return {
        success: false,
        error: error.message || 'Resend dispatch failed',
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown email dispatch error';
    console.error('[ResendService] Network/system exception during dispatch:', message);
    return {
      success: false,
      error: message,
    };
  }
}

export const resendService = {
  sendTenantInvitationEmail,
};
