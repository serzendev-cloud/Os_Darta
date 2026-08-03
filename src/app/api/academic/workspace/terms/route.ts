import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { academicTerms } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createAcademicTermSchema = z.object({
  academicYearId: z.string().min(1, 'Academic Year ID wajib diisi'),
  name: z.string().min(1, 'Nama semester wajib diisi'),
  startDate: z.string().min(1, 'Tanggal mulai wajib diisi'),
  endDate: z.string().min(1, 'Tanggal selesai wajib diisi'),
  isCurrent: z.boolean().default(false),
  status: z.enum(['planned', 'active', 'closed']).default('planned'),
  tenantId: z.string().default('default'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || 'default';
    const academicYearId = searchParams.get('academicYearId');

    const conditions = [eq(academicTerms.tenantId, tenantId)];
    if (academicYearId) {
      conditions.push(eq(academicTerms.academicYearId, academicYearId));
    }

    const terms = await db
      .select()
      .from(academicTerms)
      .where(and(...conditions));

    return NextResponse.json({ success: true, data: terms });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil data semester' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createAcademicTermSchema.parse(body);

    const id = `term_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newTerm = {
      id,
      tenantId: validatedData.tenantId,
      academicYearId: validatedData.academicYearId,
      name: validatedData.name,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      isCurrent: validatedData.isCurrent,
      status: validatedData.status,
    };

    await db.insert(academicTerms).values(newTerm);

    return NextResponse.json({ success: true, data: newTerm }, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal membuat semester' },
      { status: 500 }
    );
  }
}
