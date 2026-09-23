// ==============================================================================
// Academic Workspace: Academic Years API Route
// Work Package: WP-ACADEMIC-FOUNDATION-IMPLEMENTATION-001
// Security: Server-derived Tenant Context via getTenantContext()
// ==============================================================================

import { NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant/context';
import { academicYearService } from '@/lib/services/academic-foundation-service';
import { authorizeOperationalApi } from '@/lib/authz/authorization-service';
import { z } from 'zod';

const createAcademicYearSchema = z.object({
  name: z.string().min(1, 'Nama tahun ajaran wajib diisi'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal mulai harus YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal selesai harus YYYY-MM-DD'),
  status: z.enum(['planned', 'active']).optional().default('planned'),
});

const actionAcademicYearSchema = z.object({
  action: z.enum(['activate', 'archive']),
  yearId: z.string().min(1, 'ID tahun ajaran wajib diisi'),
});

export async function GET(request: Request) {
  try {
    const tenant = await getTenantContext();
    const authz = await authorizeOperationalApi(request, tenant.id);
    if (!authz.authorized) {
      return NextResponse.json(
        { success: false, error: authz.error, message: authz.message },
        { status: authz.status || 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const data = await academicYearService.getAcademicYears(tenant.id, { status });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Gagal mengambil data tahun ajaran';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const tenant = await getTenantContext();
    const authz = await authorizeOperationalApi(request, tenant.id);
    if (!authz.authorized) {
      return NextResponse.json(
        { success: false, error: authz.error, message: authz.message },
        { status: authz.status || 403 }
      );
    }

    const body = await request.json();

    // Check if this is a lifecycle action
    if (body && typeof body === 'object' && 'action' in body) {
      const { action, yearId } = actionAcademicYearSchema.parse(body);
      if (action === 'activate') {
        const updated = await academicYearService.activateAcademicYear(tenant.id, yearId);
        return NextResponse.json({ success: true, data: updated }, { status: 200 });
      } else if (action === 'archive') {
        const updated = await academicYearService.archiveAcademicYear(tenant.id, yearId);
        return NextResponse.json({ success: true, data: updated }, { status: 200 });
      }
    }

    // Otherwise it's a creation request
    const validatedData = createAcademicYearSchema.parse(body);
    const created = await academicYearService.createAcademicYear(tenant.id, validatedData);

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validasi gagal', errors: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : 'Gagal memproses tahun ajaran';
    return NextResponse.json(
      { success: false, message },
      { status: 400 }
    );
  }
}
