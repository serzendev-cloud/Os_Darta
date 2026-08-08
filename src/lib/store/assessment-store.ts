// ============================================================================
// EEOS Assessment Store & Engine (Sprint 4)
// Architecture v1.0 LOCKED + Approved Assessment Domain Refinement
// ============================================================================

export type AssessmentSource =
  | 'office_exam'
  | 'teacher_assessment'
  | 'daily_assessment'
  | 'practice'
  | 'memorization'
  | 'assignment'
  | 'behaviour'
  | 'custom';

export type GradingType = 'numeric' | 'letter' | 'predicate' | 'pass_fail';

export type AssessmentLifecycle = 'draft' | 'in_progress' | 'completed' | 'locked';

export interface AssessmentComponent {
  id: string;
  name: string;
  weight: number; // e.g. 30 = 30%
  gradingType: GradingType;
  maxScore: number;
  minScore: number;
  passingGrade?: number;
}

export interface AssessmentTemplate {
  id: string;
  title: string;
  source: AssessmentSource;
  programId: string;
  mapelId?: string; // 'all' or specific mapel
  description?: string;
  components: AssessmentComponent[];
  createdBy: string;
  role: 'admin' | 'kurikulum' | 'guru';
  isActive: boolean;
}

export interface StudentAssessmentScore {
  santriId: string;
  santriName: string;
  scores: Record<string, number>; // componentId -> numeric score (0-100 scale)
  finalScore?: number;
  predicate?: string;
  notes?: string;
}

export interface AssessmentEvent {
  id: string;
  sessionId: string;
  academicDayId?: string;
  programId: string;
  templateId?: string;
  title: string;
  source: AssessmentSource;
  components: AssessmentComponent[];
  status: AssessmentLifecycle;
  filledAt?: string;
  filledBy?: string;
  isBadal: boolean;
  studentScores: StudentAssessmentScore[];
  summary?: AssessmentSummary;
}

export interface AssessmentSummary {
  totalSantri: number;
  evaluatedCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  gradeDistribution: {
    mumtaz: number; // >= 90
    jayyidJiddan: number; // 80 - 89
    jayyid: number; // 70 - 79
    maqbul: number; // 60 - 69
    rasib: number; // < 60
  };
}

export interface SemesterCalculationRule {
  sourceGroup: AssessmentSource;
  aggregation: 'AVERAGE' | 'DIRECT' | 'SUM';
  weight: number;
}

export interface SemesterCalculationScheme {
  id: string;
  programId: string;
  schemeName: string;
  rules: SemesterCalculationRule[];
  passingGrade: number;
  roundStrategy: 'HALF_UP' | 'FLOOR' | 'CEIL';
}

export interface BadalAssessmentPolicy {
  allowBadalCreateEvent: boolean; // default: false
  allowBadalInputResult: boolean; // default: true (if enabled by admin)
}

// ── Event Constants & Storage Keys ──────────────────────────────────────────

export const ASSESSMENT_EVENT_UPDATED = 'mahad_assessment_updated';

const STORAGE_KEYS = {
  TEMPLATES: 'mahad_assessment_templates_v1',
  EVENTS: 'mahad_assessment_events_v1',
  SCHEMES: 'mahad_semester_schemes_v1',
  POLICY: 'mahad_badal_assessment_policy_v1',
};

// ── Default Mock Templates & Data ───────────────────────────────────────────

const DEFAULT_TEMPLATES: AssessmentTemplate[] = [
  {
    id: 'tmpl-imtihan-tahriri',
    title: 'Imtihan Tahriri (Ujian Tulis Kantor)',
    source: 'office_exam',
    programId: 'prog-madin',
    description: 'Ujian tulis resmi madrasah/pesantren dengan komponen Pemahaman, Analisis, dan Penulisan.',
    components: [
      { id: 'c1', name: 'Pemahaman Matan & Syarah', weight: 40, gradingType: 'numeric', maxScore: 100, minScore: 0, passingGrade: 70 },
      { id: 'c2', name: 'Tahlil / Analisis Hukum', weight: 40, gradingType: 'numeric', maxScore: 100, minScore: 0, passingGrade: 70 },
      { id: 'c3', name: 'Kerapihan & Kaidah Kitabah', weight: 20, gradingType: 'numeric', maxScore: 100, minScore: 0, passingGrade: 70 },
    ],
    createdBy: 'Admin Kurikulum',
    role: 'kurikulum',
    isActive: true,
  },
  {
    id: 'tmpl-penilaian-harian',
    title: 'Penilaian KBM Harian Guru',
    source: 'daily_assessment',
    programId: 'prog-madin',
    description: 'Evaluasi pembelajaran harian kelas mencakup Pemahaman Materi dan Tugas Mandiri.',
    components: [
      { id: 'c10', name: 'Pemahaman Materi Kelas', weight: 50, gradingType: 'numeric', maxScore: 100, minScore: 0, passingGrade: 70 },
      { id: 'c11', name: 'Tugas & Lat. Mandiri', weight: 50, gradingType: 'numeric', maxScore: 100, minScore: 0, passingGrade: 70 },
    ],
    createdBy: 'Admin Kurikulum',
    role: 'kurikulum',
    isActive: true,
  },
  {
    id: 'tmpl-setoran-hafalan',
    title: 'Penilaian Setoran Hafalan & Musyafahah',
    source: 'memorization',
    programId: 'prog-madqur',
    description: 'Penilaian kelancaran, tajwid, dan makhraj setoran hafalan Al-Qur\'an / Nazham Kitab.',
    components: [
      { id: 'c20', name: 'Kelancaran Hafalan (Fashohah)', weight: 40, gradingType: 'predicate', maxScore: 100, minScore: 0, passingGrade: 70 },
      { id: 'c21', name: 'Kaidah Tajwid & Makhraj', weight: 40, gradingType: 'predicate', maxScore: 100, minScore: 0, passingGrade: 70 },
      { id: 'c22', name: 'Adab & Tartil', weight: 20, gradingType: 'predicate', maxScore: 100, minScore: 0, passingGrade: 70 },
    ],
    createdBy: 'Ust. Pengasuh Tahfidz',
    role: 'guru',
    isActive: true,
  },
  {
    id: 'tmpl-praktik-ibadah',
    title: 'Penilaian Praktik Amaliyah Ibadah',
    source: 'practice',
    programId: 'prog-madin',
    description: 'Evaluasi praktik ibadah, wudhu, shalat, dan khutbah secara tatap muka.',
    components: [
      { id: 'c30', name: 'Gerakan & Syarat Rukun', weight: 50, gradingType: 'numeric', maxScore: 100, minScore: 0, passingGrade: 75 },
      { id: 'c31', name: 'Bacaan & Khusyu\'', weight: 50, gradingType: 'numeric', maxScore: 100, minScore: 0, passingGrade: 75 },
    ],
    createdBy: 'Admin Kurikulum',
    role: 'kurikulum',
    isActive: true,
  },
];

const DEFAULT_CALCULATION_SCHEME: SemesterCalculationScheme = {
  id: 'scheme-madin-default',
  programId: 'prog-madin',
  schemeName: 'Formula Rapor Madin Standard',
  rules: [
    { sourceGroup: 'daily_assessment', aggregation: 'AVERAGE', weight: 30 },
    { sourceGroup: 'practice', aggregation: 'AVERAGE', weight: 30 },
    { sourceGroup: 'office_exam', aggregation: 'DIRECT', weight: 40 },
  ],
  passingGrade: 70,
  roundStrategy: 'HALF_UP',
};

const DEFAULT_BADAL_POLICY: BadalAssessmentPolicy = {
  allowBadalCreateEvent: false,
  allowBadalInputResult: true,
};

// ── Store Helper Functions ──────────────────────────────────────────────────

export function getAssessmentTemplates(programId = 'prog-madin'): AssessmentTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.TEMPLATES}_${programId}`);
    if (!raw) return DEFAULT_TEMPLATES;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveAssessmentTemplate(template: AssessmentTemplate): void {
  if (typeof window === 'undefined') return;
  try {
    const templates = getAssessmentTemplates(template.programId);
    const index = templates.findIndex((t) => t.id === template.id);
    let updated: AssessmentTemplate[];
    if (index >= 0) {
      updated = [...templates];
      updated[index] = template;
    } else {
      updated = [...templates, template];
    }
    localStorage.setItem(`${STORAGE_KEYS.TEMPLATES}_${template.programId}`, JSON.stringify(updated));
    window.dispatchEvent(new Event(ASSESSMENT_EVENT_UPDATED));
  } catch (e) {
    console.error('Failed to save assessment template:', e);
  }
}

export function deleteAssessmentTemplate(templateId: string, programId = 'prog-madin'): void {
  if (typeof window === 'undefined') return;
  try {
    const templates = getAssessmentTemplates(programId);
    const updated = templates.filter((t) => t.id !== templateId);
    localStorage.setItem(`${STORAGE_KEYS.TEMPLATES}_${programId}`, JSON.stringify(updated));
    window.dispatchEvent(new Event(ASSESSMENT_EVENT_UPDATED));
  } catch (e) {
    console.error('Failed to delete assessment template:', e);
  }
}

// ── Session Assessment Event Operations ────────────────────────────────────

export function getAssessmentEventForSession(sessionId: string): AssessmentEvent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.EVENTS}_${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function calculateAssessmentSummary(
  studentScores: StudentAssessmentScore[],
  components: AssessmentComponent[]
): AssessmentSummary {
  const totalSantri = studentScores.length;
  const evaluatedScores = studentScores.filter((s) => Object.keys(s.scores).length > 0 && s.finalScore !== undefined);
  const evaluatedCount = evaluatedScores.length;

  if (evaluatedCount === 0) {
    return {
      totalSantri,
      evaluatedCount: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      gradeDistribution: { mumtaz: 0, jayyidJiddan: 0, jayyid: 0, maqbul: 0, rasib: 0 },
    };
  }

  const finalScores = evaluatedScores.map((s) => s.finalScore || 0);
  const sum = finalScores.reduce((acc, curr) => acc + curr, 0);
  const averageScore = Math.round((sum / evaluatedCount) * 10) / 10;
  const highestScore = Math.max(...finalScores);
  const lowestScore = Math.min(...finalScores);

  const gradeDistribution = {
    mumtaz: finalScores.filter((s) => s >= 90).length,
    jayyidJiddan: finalScores.filter((s) => s >= 80 && s < 90).length,
    jayyid: finalScores.filter((s) => s >= 70 && s < 80).length,
    maqbul: finalScores.filter((s) => s >= 60 && s < 70).length,
    rasib: finalScores.filter((s) => s < 60).length,
  };

  return {
    totalSantri,
    evaluatedCount,
    averageScore,
    highestScore,
    lowestScore,
    gradeDistribution,
  };
}

export function computeStudentFinalScore(
  scores: Record<string, number>,
  components: AssessmentComponent[]
): { finalScore: number; predicate: string } {
  if (components.length === 0) return { finalScore: 0, predicate: 'Belum Dinilai' };

  let totalWeightedScore = 0;
  let totalWeight = 0;

  components.forEach((c) => {
    const rawVal = scores[c.id];
    if (rawVal !== undefined && !isNaN(rawVal)) {
      totalWeightedScore += rawVal * (c.weight / 100);
      totalWeight += c.weight / 100;
    }
  });

  const finalScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 10) / 10 : 0;

  let predicate = 'Rasib (Kurang)';
  if (finalScore >= 90) predicate = 'Mumtaz (Sangat Baik)';
  else if (finalScore >= 80) predicate = 'Jayyid Jiddan (Baik Sekali)';
  else if (finalScore >= 70) predicate = 'Jayyid (Baik)';
  else if (finalScore >= 60) predicate = 'Maqbul (Cukup)';

  return { finalScore, predicate };
}

export function saveAssessmentEvent(event: AssessmentEvent, programId = 'prog-madin'): void {
  if (typeof window === 'undefined') return;
  try {
    const summary = calculateAssessmentSummary(event.studentScores, event.components);
    const updatedEvent: AssessmentEvent = {
      ...event,
      summary,
    };

    localStorage.setItem(`${STORAGE_KEYS.EVENTS}_${event.sessionId}`, JSON.stringify(updatedEvent));
    window.dispatchEvent(new Event(ASSESSMENT_EVENT_UPDATED));
  } catch (e) {
    console.error('Failed to save assessment event:', e);
  }
}

// ── Badal Policy & Scheme Store ────────────────────────────────────────────

export function getBadalAssessmentPolicy(): BadalAssessmentPolicy {
  if (typeof window === 'undefined') return DEFAULT_BADAL_POLICY;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.POLICY);
    if (!raw) return DEFAULT_BADAL_POLICY;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_BADAL_POLICY;
  }
}

export function saveBadalAssessmentPolicy(policy: BadalAssessmentPolicy): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.POLICY, JSON.stringify(policy));
    window.dispatchEvent(new Event(ASSESSMENT_EVENT_UPDATED));
  } catch (e) {
    console.error('Failed to save badal assessment policy:', e);
  }
}

export function getSemesterCalculationScheme(programId = 'prog-madin'): SemesterCalculationScheme {
  if (typeof window === 'undefined') return DEFAULT_CALCULATION_SCHEME;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SCHEMES}_${programId}`);
    if (!raw) return DEFAULT_CALCULATION_SCHEME;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CALCULATION_SCHEME;
  }
}
