import { NextResponse } from 'next/server';
import { digiflazzClient } from '@/lib/ppob/digiflazz';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerNo, skuCode } = body;

    if (!customerNo || !skuCode) {
      return NextResponse.json(
        { success: false, message: 'Nomor Pelanggan dan Kode SKU Wajib diisi' },
        { status: 400 }
      );
    }

    const result = await digiflazzClient.inquiryCustomer(customerNo, skuCode);
    return NextResponse.json({ success: result.status, data: result });
  } catch (err: any) {
    console.error('API PPOB Inquiry Error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Gagal memproses inkuiri pelanggan' },
      { status: 500 }
    );
  }
}
