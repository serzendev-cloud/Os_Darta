import { createTenantService } from './create-tenant-service';
import type { AssessmentEvent, AssessmentSource, SemesterCalculationScheme } from '@/lib/store/assessment-store';

export interface AcademicLedgerRecord {
  id: string;
  tenantId?: string;
  santriId: string;
  academicTermId: string;
  mapelId: string;
  sourceGroup: AssessmentSource;
  rawScore: number;
  weightedScore: number;
  calculatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicTranscript {
  id: string;
  tenantId?: string;
  santriId: string;
  academicTermId: string;
  finalScore: number;
  predicate: 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul' | 'Rasib';
  rankInClass?: number;
  isLocked: boolean;
  lockedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ── Pure Calculation Helper Utilities ───────────────────────────────────────

export function roundScore(value: number, strategy: 'HALF_UP' | 'FLOOR' | 'CEIL' = 'HALF_UP'): number {
  if (isNaN(value)) return 0;
  switch (strategy) {
    case 'FLOOR':
      return Math.floor(value);
    case 'CEIL':
      return Math.ceil(value);
    case 'HALF_UP':
    default:
      return Math.round(value);
  }
}

export function determinePredicate(score: number): 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul' | 'Rasib' {
  if (score >= 90) return 'Mumtaz';
  if (score >= 80) return 'Jayyid Jiddan';
  if (score >= 70) return 'Jayyid';
  if (score >= 60) return 'Maqbul';
  return 'Rasib';
}

export function calculateSingleStudentTranscript(
  santriId: string,
  academicTermId: string,
  events: AssessmentEvent[],
  scheme: SemesterCalculationScheme
): {
  finalScore: number;
  predicate: 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul' | 'Rasib';
  records: Omit<AcademicLedgerRecord, 'id'>[];
} {
  const records: Omit<AcademicLedgerRecord, 'id'>[] = [];
  let totalWeightedScore = 0;

  for (const rule of scheme.rules) {
    // Filter events matching rule's source group
    const matchingEvents = events.filter((e) => e.source === rule.sourceGroup && e.status === 'completed');
    
    // Extract scores for this specific student
    const studentRawScores: number[] = [];
    for (const event of matchingEvents) {
      const studentScoreObj = event.studentScores.find((s) => s.santriId === santriId);
      if (studentScoreObj && studentScoreObj.finalScore !== undefined) {
        studentRawScores.push(studentScoreObj.finalScore);
      }
    }

    let aggregatedRaw = 0;
    if (studentRawScores.length > 0) {
      if (rule.aggregation === 'AVERAGE') {
        const sum = studentRawScores.reduce((acc, curr) => acc + curr, 0);
        aggregatedRaw = sum / studentRawScores.length;
      } else if (rule.aggregation === 'SUM') {
        aggregatedRaw = studentRawScores.reduce((acc, curr) => acc + curr, 0);
      } else if (rule.aggregation === 'DIRECT') {
        aggregatedRaw = studentRawScores[studentRawScores.length - 1]; // latest
      }
    }

    const weightFraction = rule.weight / 100;
    const weighted = aggregatedRaw * weightFraction;

    records.push({
      santriId,
      academicTermId,
      mapelId: 'all',
      sourceGroup: rule.sourceGroup,
      rawScore: roundScore(aggregatedRaw, scheme.roundStrategy),
      weightedScore: roundScore(weighted, scheme.roundStrategy),
      calculatedAt: new Date().toISOString(),
    });

    totalWeightedScore += weighted;
  }

  const finalScoreRounded = roundScore(totalWeightedScore, scheme.roundStrategy);
  const predicate = determinePredicate(finalScoreRounded);

  return {
    finalScore: finalScoreRounded,
    predicate,
    records,
  };
}

// ── Multi-Tenant Domain Service Factory Export ──────────────────────────────
export const academicLedgerRecordService = createTenantService<AcademicLedgerRecord>('academic_ledger_records');
export const academicTranscriptService = createTenantService<AcademicTranscript>('academic_transcripts');
