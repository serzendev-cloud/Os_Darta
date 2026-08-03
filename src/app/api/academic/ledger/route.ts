import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  academicLedgerRecordService,
  academicTranscriptService,
  calculateSingleStudentTranscript,
} from '@/lib/db/services/academic-ledger';

const calculateLedgerSchema = z.object({
  academicTermId: z.string().min(1, 'Academic Term ID required'),
  santriList: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    })
  ),
  events: z.array(z.any()),
  scheme: z.object({
    id: z.string(),
    programId: z.string(),
    schemeName: z.string(),
    rules: z.array(
      z.object({
        sourceGroup: z.string(),
        aggregation: z.enum(['AVERAGE', 'DIRECT', 'SUM']),
        weight: z.number(),
      })
    ),
    passingGrade: z.number(),
    roundStrategy: z.enum(['HALF_UP', 'FLOOR', 'CEIL']),
  }),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const academicTermId = searchParams.get('academicTermId');

    if (!academicTermId) {
      return NextResponse.json(
        { success: false, message: 'Parameter academicTermId wajib diisi' },
        { status: 400 }
      );
    }

    const transcripts = await academicTranscriptService.get('all');
    return NextResponse.json({ success: true, data: transcripts }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal mengambil data ledger' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = calculateLedgerSchema.parse(body);

    const results = [];

    for (const santri of validatedData.santriList) {
      const computed = calculateSingleStudentTranscript(
        santri.id,
        validatedData.academicTermId,
        validatedData.events as any,
        validatedData.scheme as any
      );

      for (const record of computed.records) {
        await academicLedgerRecordService.create(record);
      }

      const transcriptId = await academicTranscriptService.create({
        santriId: santri.id,
        academicTermId: validatedData.academicTermId,
        finalScore: computed.finalScore,
        predicate: computed.predicate,
        isLocked: false,
      });

      results.push({
        santriId: santri.id,
        transcriptId,
        finalScore: computed.finalScore,
        predicate: computed.predicate,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Kalkulasi Academic Ledger & Transkrip Rapor berhasil',
        data: results,
      },
      { status: 200 }
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validasi payload gagal', errors: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message || 'Gagal memproses kalkulasi ledger' },
      { status: 500 }
    );
  }
}
