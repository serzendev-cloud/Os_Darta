import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { academicYears } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createAcademicYearSchema = z.object({
  name: z.string().min(1, 'Nama tahun ajaran wajib diisi'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
  status: z.enum(['planned', 'active', 'archived']).default('planned'),
  tenantId: z.string().default('default'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default';

    const years = await db
      .select()
      .from(academicYears)
      .where(eq(academicYears.tenantId, tenantId));

    return NextResponse.json({ success: true, data: years });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil data tahun ajaran' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createAcademicYearSchema.parse(body);

    const id = `ay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newYear = {
      id,
      tenantId: validatedData.tenantId,
      name: validatedData.name,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      status: validatedData.status,
    };

    await db.insert(academicYears).values(newYear);

    return NextResponse.json({ success: true, data: newYear }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal membuat tahun ajaran' },
      { status: 500 }
    );
  }
}
