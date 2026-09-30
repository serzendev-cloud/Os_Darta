import React from 'react';

export interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  tenantName?: string;
  appUrl?: string;
}

/**
 * HTML Generator for Password Reset / Recovery Email.
 * Mobile-responsive, clear CTA button, verified sender compatible.
 */
export function renderPasswordResetHtml(props: PasswordResetEmailProps): string {
  const { userName, resetUrl, tenantName } = props;
  const brandTitle = tenantName || "Ma'had Manager Platform";

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pemulihan Kata Sandi - ${brandTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #0F766E 0%, #115E59 100%); padding: 32px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.025em; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px; }
    .greeting { font-size: 15px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
    .body-text { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
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
      <h1>${brandTitle}</h1>
      <p>Sistem Informasi &amp; Tata Kelola Pesantren Terpadu</p>
    </div>
    <div class="content">
      <div class="greeting">Assalamu'alaikum Warahmatullahi Wabarakatuh,</div>
      <div class="body-text">
        Yth. <strong>${userName}</strong>,<br><br>
        Kami menerima permintaan untuk mengatur ulang kata sandi akun Anda pada sistem <strong>${brandTitle}</strong>.
      </div>

      <div class="body-text">
        Silakan klik tombol di bawah ini untuk membuat kata sandi baru Anda:
      </div>

      <div class="cta-container">
        <a href="${resetUrl}" class="cta-button" target="_blank">Atur Ulang Kata Sandi</a>
      </div>

      <div class="security-note">
        <strong>Informasi Keamanan:</strong><br>
        • Tautan pemulihan ini bersifat rahasia, berlaku untuk jangka waktu terbatas (1 jam), dan hanya dapat digunakan satu kali.<br>
        • Jika Anda tidak meminta pengaturan ulang kata sandi ini, silakan abaikan email ini. Akun Anda tetap aman.<br>
        • Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut di peramban Anda:<br>
        <span style="word-break: break-all; color: #0F766E;">${resetUrl}</span>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} ${brandTitle}. Seluruh hak cipta dilindungi.
    </div>
  </div>
</body>
</html>
  `.trim();
}

export const PasswordResetEmail: React.FC<PasswordResetEmailProps> = (props) => {
  return <div dangerouslySetInnerHTML={{ __html: renderPasswordResetHtml(props) }} />;
};
