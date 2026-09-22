// ==============================================================================
// Academic Workspace: Academic Terms API Route
// Work Package: WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001
// Security: Server-derived Tenant Context via getTenantContext()
// ==============================================================================

import { NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant/context';
import { academicTermService } from '@/lib/services/academic-foundation-service';
import { z } from 'zod';

const createAcademicTermSchema = z.object({
  academicYearId: z.string().min(1, 'Academic Year ID wajib diisi'),
  name: z.string().min(1, 'Nama semester wajib diisi'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal mulai harus YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal selesai harus YYYY-MM-DD'),
  status: z.enum(['planned', 'active']).optional().default('planned'),
  isCurrent: z.boolean().optional(),
});

const actionAcademicTermSchema = z.object({
  action: z.enum(['activate', 'close']),
  termId: z.string().min(1, 'ID semester wajib diisi'),
});

export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId') || undefined;
    const status = searchParams.get('status') || undefined;

    const data = await academicTermService.getAcademicTerms(tenant.id, {
      academicYearId,
      status,
    });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil data semester';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    const body = await request.json();

    // Check if this is a lifecycle action
    if (body && typeof body === 'object' && 'action' in body) {
      const { action, termId } = actionAcademicTermSchema.parse(body);
      if (action === 'activate') {
        const updated = await academicTermService.activateAcademicTerm(tenant.id, termId);
        return NextResponse.json({ success: true, data: updated }, { status: 200 });
      } else if (action === 'close') {
        const updated = await academicTermService.closeAcademicTerm(tenant.id, termId);
        return NextResponse.json({ success: true, data: updated }, { status: 200 });
      }
    }

    // Otherwise it's a creation request
    const validatedData = createAcademicTermSchema.parse(body);
    const created = await academicTermService.createAcademicTerm(tenant.id, validatedData);

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Gagal memproses semester';
    return NextResponse.json(
      { success: false, message },
      { status: 400 }
    );
  }
}
