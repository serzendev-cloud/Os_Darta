import React from 'react';

export interface TenantInvitationEmailProps {
  adminName: string;
  tenantName: string;
  tenantCode: string;
  subdomain: string;
  activationUrl: string;
  appUrl?: string;
}

/**
 * HTML Generator for Tenant Administrator Onboarding & Activation Email.
 * Islamic professional branding, mobile-responsive, clear CTA button.
 */
export function renderTenantInvitationHtml(props: TenantInvitationEmailProps): string {
  const { adminName, tenantName, tenantCode, subdomain, activationUrl } = props;

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Undangan Aktivasi Akun Administrator - ${tenantName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0F766E 0%, #115E59 100%); padding: 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px; }
    .greeting { font-size: 15px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .body-text { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .info-card { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 28px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-label { color: #64748b; font-weight: 500; }
    .info-value { color: #0f172a; font-weight: 700; }
    .badge-code { background-color: #0F766E; color: #ffffff; padding: 2px 8px; border-radius: 6px; font-family: monospace; font-size: 13px; letter-spacing: 0.05em; }
    .cta-container { text-align: center; margin: 32px 0; }
    .cta-button { display: inline-block; background-color: #0F766E; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 10px rgba(15, 118, 110, 0.25); }
    .cta-button:hover { background-color: #115E59; }
    .security-note { font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 28px; }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ma'had Manager Platform</h1>
      <p>Sistem Informasi & Tata Kelola Pesantren Terpadu</p>
    </div>
    <div class="content">
      <div class="greeting">Assalamu'alaikum Warahmatullahi Wabarakatuh,</div>
      <div class="body-text">
        Yth. <strong>${adminName}</strong>,<br><br>
        Lembaga pesantren <strong>${tenantName}</strong> telah berhasil didaftarkan pada platform Ma'had Manager. Anda ditunjuk sebagai Administrator Utama untuk mengelola sistem pesantren ini.
      </div>

      <div class="info-card">
        <div style="margin-bottom: 10px;">
          <span style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Detail Lembaga:</span>
        </div>
        <div style="font-size: 13px; line-height: 1.8;">
          <div>• <strong>Pesantren:</strong> ${tenantName}</div>
          <div>• <strong>Kode Resmi Tenant:</strong> <span class="badge-code">${tenantCode}</span></div>
          <div>• <strong>Domain Akses:</strong> https://${subdomain}</div>
        </div>
      </div>

      <div class="body-text">
        Untuk mengamankan akun dan mengaktifkan akses Anda, silakan klik tombol aktivasi di bawah ini untuk membuat kata sandi Anda sendiri:
      </div>

      <div class="cta-container">
        <a href="${activationUrl}" class="cta-button" target="_blank">Aktivasi Akun &amp; Buat Kata Sandi</a>
      </div>

      <div class="security-note">
        <strong>Catatan Keamanan:</strong><br>
        • Tautan undangan ini bersifat rahasia dan satu kali pakai.<br>
        • Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut di peramban Anda:<br>
        <span style="word-break: break-all; color: #0F766E;">${activationUrl}</span><br><br>
        <em>Jika Anda tidak merasa mendaftarkan pesantren ini, mohon abaikan email ini.</em>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Ma'had Manager ERP Platform. Seluruh hak cipta dilindungi.
    </div>
  </div>
</body>
</html>
  `.trim();
}

export const TenantInvitationEmail: React.FC<TenantInvitationEmailProps> = (props) => {
  return <div dangerouslySetInnerHTML={{ __html: renderTenantInvitationHtml(props) }} />;
};

export default TenantInvitationEmail;
