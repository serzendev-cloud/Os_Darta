import type { AcademicTranscript, AcademicLedgerRecord } from '@/lib/db/services/academic-ledger';

export interface FormattedLedgerRecord {
  sourceGroup: string;
  sourceGroupLabel: string;
  rawScore: number;
  weightedScore: number;
  formattedRawScore: string;
  formattedWeightedScore: string;
}

export interface FormattedTranscriptData {
  santriId: string;
  santriName: string;
  nis: string;
  kelas: string;
  academicTermName: string;
  academicYearName: string;
  tenantName: string;
  finalScore: number;
  formattedFinalScore: string;
  predicate: string;
  predicateBadgeClass: string;
  status: 'Draft' | 'Locked' | 'Published';
  statusBadgeClass: string;
  isLocked: boolean;
  records: FormattedLedgerRecord[];
  formattedDate: string;
}

export function formatSourceGroupLabel(group: string): string {
  switch (group) {
    case 'office_exam':
      return 'Ujian Resmi / Semester';
    case 'teacher_assessment':
      return 'Penilaian Pengajar / Musyrif';
    case 'daily_assessment':
      return 'Penilaian Harian & Setoran';
    case 'memorization':
      return 'Setoran Hafalan / Tahfidz';
    case 'behaviour':
      return 'Penilaian Adab & Akhlaq';
    case 'practice':
      return 'Praktik & Amaliah';
    case 'assignment':
      return 'Tugas & Portofolio';
    default:
      return group;
  }
}

export function getPredicateBadgeClass(predicate: string): string {
  switch (predicate) {
    case 'Mumtaz':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
    case 'Jayyid Jiddan':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30';
    case 'Jayyid':
      return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30';
    case 'Maqbul':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30';
    case 'Rasib':
    default:
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30';
  }
}

export function getStatusBadgeClass(status: 'Draft' | 'Locked' | 'Published'): string {
  switch (status) {
    case 'Locked':
      return 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40';
    case 'Published':
      return 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/40';
    case 'Draft':
    default:
      return 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40';
  }
}

export function buildTranscriptPresenter(
  transcript: AcademicTranscript,
  records: AcademicLedgerRecord[],
  metadata: {
    santriName?: string;
    nis?: string;
    kelas?: string;
    academicTermName?: string;
    academicYearName?: string;
    tenantName?: string;
  }
): FormattedTranscriptData {
  const status: 'Draft' | 'Locked' | 'Published' = transcript.isLocked
    ? 'Locked'
    : 'Draft';

  const formattedRecords: FormattedLedgerRecord[] = records.map((r) => ({
    sourceGroup: r.sourceGroup,
    sourceGroupLabel: formatSourceGroupLabel(r.sourceGroup),
    rawScore: r.rawScore,
    weightedScore: r.weightedScore,
    formattedRawScore: r.rawScore.toFixed(1),
    formattedWeightedScore: r.weightedScore.toFixed(1),
  }));

  return {
    santriId: transcript.santriId,
    santriName: metadata.santriName || 'Santri Mahad',
    nis: metadata.nis || '-',
    kelas: metadata.kelas || 'Kelas Default',
    academicTermName: metadata.academicTermName || 'Semester Aktif',
    academicYearName: metadata.academicYearName || '2026/2027',
    tenantName: metadata.tenantName || 'Pesantren Terpadu',
    finalScore: transcript.finalScore,
    formattedFinalScore: transcript.finalScore.toFixed(1),
    predicate: transcript.predicate,
    predicateBadgeClass: getPredicateBadgeClass(transcript.predicate),
    status,
    statusBadgeClass: getStatusBadgeClass(status),
    isLocked: transcript.isLocked,
    records: formattedRecords,
    formattedDate: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
}
