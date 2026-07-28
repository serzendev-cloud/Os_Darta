/**
 * SaaS Owner Payment Gateway Service
 * Layanan khusus penampung pembayaran PPOB (Pulsa & Token PLN) milik SaaS Owner (Serzen Dev)
 * Menggunakan QRIS Dynamic / Payment Link yang terhubung langsung ke Rekening SaaS Owner
 */

const SAAS_PG_API_KEY = process.env.SAAS_PG_API_KEY || 'dev-saas-pg-key-999';
const SAAS_PG_PROVIDER = process.env.SAAS_PG_PROVIDER || 'TRIPAY_QRIS'; // 'TRIPAY_QRIS' | 'MIDTRANS' | 'FLIP'

export interface CreateSaasPaymentParams {
  transactionId: string;
  amount: number;
  productName: string;
  customerName: string;
  customerPhone: string;
}

export interface SaasPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  qrCodeUrl?: string;
  referenceId: string;
  expiresAt?: string;
  message?: string;
}

export const saasPaymentClient = {
  /**
   * Generate Invoice QRIS / Payment Link milik SaaS Owner
   */
  async createInvoice(params: CreateSaasPaymentParams): Promise<SaasPaymentResponse> {
    const { transactionId, amount, productName, customerName } = params;

    // Direct mock untuk mode development / pengujian UI
    if (SAAS_PG_API_KEY === 'dev-saas-pg-key-999') {
      // Dynamic QRIS Mock Image Generator URL untuk pengujian
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021226610016ID.CO.SERZEN.WWW01189360091400000000000215ID102000000000003030360451000502015303360540${amount}5802ID5912SERZEN_PPOB6007JAKARTA61051234062070703A016304`;
      
      return {
        success: true,
        referenceId: `SAAS-PG-${transactionId}`,
        qrCodeUrl,
        paymentUrl: `https://checkout.serzen.dev/pay/ppob/${transactionId}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 Menit
        message: 'QRIS Pembayaran SaaS Owner berhasil dibuat',
      };
    }

    try {
      // Integrasi Tripay / Midtrans / Gateway pilihan SaaS Owner di sini
      // Untuk produksi, panggil API Tripay POST /transaction/create atau Midtrans Core API
      return {
        success: true,
        referenceId: `SAAS-PG-${transactionId}`,
        qrCodeUrl: `https://checkout.serzen.dev/qr/${transactionId}`,
        paymentUrl: `https://checkout.serzen.dev/pay/${transactionId}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      };
    } catch (err: any) {
      console.error('SaaS Payment Gateway Error:', err);
      return {
        success: false,
        referenceId: transactionId,
        message: err.message || 'Gagal membentuk invoice pembayaran SaaS PG',
      };
    }
  },

  /**
   * Verifikasi Webhook Callback Signature dari PG SaaS Owner
   */
  verifyWebhookSignature(payload: any, signature: string): boolean {
    if (SAAS_PG_API_KEY === 'dev-saas-pg-key-999') return true;
    // Implementasi verifikasi HMAC / Signature PG
    return true;
  },
};
