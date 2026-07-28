import crypto from 'crypto';

// ── Digiflazz API Configuration ──────────────────────────────────────────────
const DIGIFLAZZ_USERNAME = process.env.DIGIFLAZZ_USERNAME || 'serzen_dev';
const DIGIFLAZZ_API_KEY = process.env.DIGIFLAZZ_API_KEY || 'dev-key-12345';
const DIGIFLAZZ_IS_PRODUCTION = process.env.DIGIFLAZZ_IS_PRODUCTION === 'true';

const DIGIFLAZZ_BASE_URL = DIGIFLAZZ_IS_PRODUCTION
  ? 'https://api.digiflazz.com/v1'
  : 'https://api.digiflazz.com/v1'; // Production & Staging share endpoint with testing parameter

/**
 * Generate Digiflazz MD5 Signature
 * Formula: md5(username + apiKey + ref_id)
 */
export function generateDigiflazzSignature(refId: string): string {
  const rawString = `${DIGIFLAZZ_USERNAME}${DIGIFLAZZ_API_KEY}${refId}`;
  return crypto.createHash('md5').update(rawString).digest('hex');
}

/**
 * Interface untuk Respon Inkuiri PLN Pasca / Token
 */
export interface DigiflazzInquiryResult {
  status: boolean;
  customerNo: string;
  customerName: string;
  skuCode: string;
  meterNo?: string;
  subscriberId?: string;
  segmentPower?: string;
  message?: string;
}

/**
 * Interface untuk Respon Eksekusi Pembelian
 */
export interface DigiflazzTransactionResult {
  success: boolean;
  refId: string;
  status: 'PENDING' | 'PROCESS' | 'SUCCESS' | 'FAILED';
  sn?: string; // Serial Number / Kode Token 20 digit
  message?: string;
  buyerSkuCode: string;
  customerNo: string;
  price: number;
}

export const digiflazzClient = {
  /**
   * Cek Inkuiri Pelanggan (misal Token PLN / Meteran Listrik)
   */
  async inquiryCustomer(customerNo: string, skuCode: string): Promise<DigiflazzInquiryResult> {
    const refId = `inq-${Date.now()}`;
    const sign = generateDigiflazzSignature(refId);

    // Mock response jika dalam mode development / belum ada API Key asli
    if (DIGIFLAZZ_API_KEY === 'dev-key-12345') {
      return {
        status: true,
        customerNo,
        customerName: 'Ahmad Fulan (Demopontren)',
        skuCode,
        meterNo: customerNo,
        subscriberId: customerNo,
        segmentPower: 'R1M / 900 VA',
      };
    }

    try {
      const response = await fetch(`${DIGIFLAZZ_BASE_URL}/inquiry-pasca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: 'inquire-pasca',
          username: DIGIFLAZZ_USERNAME,
          customer_no: customerNo,
          buyer_sku_code: skuCode,
          ref_id: refId,
          sign,
        }),
      });

      const data = await response.json();
      if (data.data && data.data.status === 'Sukses') {
        return {
          status: true,
          customerNo: data.data.customer_no,
          customerName: data.data.customer_name,
          skuCode: data.data.buyer_sku_code,
          segmentPower: data.data.segment_power,
        };
      }
      return {
        status: false,
        customerNo,
        customerName: '-',
        skuCode,
        message: data.data?.message || 'Inkuiri gagal atau ID tidak ditemukan',
      };
    } catch (err: any) {
      console.error('Digiflazz Inquiry Error:', err);
      return {
        status: false,
        customerNo,
        customerName: '-',
        skuCode,
        message: err.message || 'Network error pada provider Digiflazz',
      };
    }
  },

  /**
   * Eksekusi Pembelian Pulsa / Token Listrik ke Digiflazz
   */
  async createTransaction(
    refId: string,
    buyerSkuCode: string,
    customerNo: string
  ): Promise<DigiflazzTransactionResult> {
    const sign = generateDigiflazzSignature(refId);

    // Mock response untuk mode development
    if (DIGIFLAZZ_API_KEY === 'dev-key-12345') {
      const isPln = buyerSkuCode.toLowerCase().includes('pln');
      const mockSn = isPln
        ? '3412-8901-2245-6712-9901' // Kode Token Listrik 20 Digit Dummy
        : 'SN-20260728-9812401'; // Serial Number Pulsa
      return {
        success: true,
        refId,
        status: 'SUCCESS',
        sn: mockSn,
        buyerSkuCode,
        customerNo,
        price: 20000,
        message: 'Pembelian sukses (Dev Mode)',
      };
    }

    try {
      const response = await fetch(`${DIGIFLAZZ_BASE_URL}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: DIGIFLAZZ_USERNAME,
          buyer_sku_code: buyerSkuCode,
          customer_no: customerNo,
          ref_id: refId,
          sign,
          testing: !DIGIFLAZZ_IS_PRODUCTION,
        }),
      });

      const data = await response.json();
      const resData = data.data;

      if (!resData) {
        return {
          success: false,
          refId,
          status: 'FAILED',
          buyerSkuCode,
          customerNo,
          price: 0,
          message: data.message || 'Respon Digiflazz kosong',
        };
      }

      let txStatus: 'PENDING' | 'PROCESS' | 'SUCCESS' | 'FAILED' = 'PENDING';
      if (resData.status === 'Sukses') txStatus = 'SUCCESS';
      else if (resData.status === 'Gagal') txStatus = 'FAILED';
      else txStatus = 'PROCESS';

      return {
        success: txStatus === 'SUCCESS',
        refId,
        status: txStatus,
        sn: resData.sn || undefined,
        buyerSkuCode: resData.buyer_sku_code,
        customerNo: resData.customer_no,
        price: resData.price || 0,
        message: resData.message,
      };
    } catch (err: any) {
      console.error('Digiflazz Transaction Error:', err);
      return {
        success: false,
        refId,
        status: 'FAILED',
        buyerSkuCode,
        customerNo,
        price: 0,
        message: err.message || 'Gagal menghubungi server Digiflazz',
      };
    }
  },
};
