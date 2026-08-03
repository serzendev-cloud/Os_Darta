// ========================================
// Academic Operation Store & Engine (Sprint 2 & 3 Extended)
// Aggregate Root: AcademicDay
// Architecture v1.0 LOCKED + Addendums v1.0-A, v1.0-B, & OSV
// ========================================

export type AcademicDayLifecycle = 'Scheduled' | 'Ready' | 'Running' | 'Closing' | 'Closed';
export type TeachingSessionLifecycle = 'pending' | 'running' | 'completed' | 'locked';
export type SlotStatus = 'available' | 'teaching' | 'badal' | 'leave' | 'dinas' | 'not_scanned';
export type StudentAttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpa' | 'izin_pulang';

export interface AcademicDay {
  id: string; // e.g. 'day-2026-08-01-prog-madin'
  programId: string;
  programName: string;
  date: string; // YYYY-MM-DD
  status: AcademicDayLifecycle;
  activatedAt?: string;
  activatedBy?: string;
  closedAt?: string;
  closedBy?: string;
  totalTeachersPresent: number;
  totalTeachersTotal: number;
  totalSessionsTotal: number;
  totalSessionsCompleted: number;
  totalBadalAssigned: number;
}

export interface TeacherAttendanceLog {
  id: string;
  guruId: string;
  guruName: string;
  scanTime: string;
  status: 'present' | 'late' | 'leave' | 'dinas' | 'absent';
  method: 'nfc' | 'manual';
}

export interface StudentAttendanceRecord {
  id: string;
  sessionId: string;
  santriId: string;
  santriName: string;
  status: StudentAttendanceStatus;
  notes?: string;
  lastHafalanPos?: string;
}

export interface KbmJournalEntry {
  id: string;
  sessionId: string;
  materiBab: string;
  catatanKbm?: string;
  catatanSantri?: string;
  filledAt: string;
  filledBy: string;
  isBadal: boolean;
}

export interface TahfidzProgressRecord {
  id: string;
  sessionId: string;
  santriId: string;
  santriName: string;
  surahName: string;
  startAyat: number;
  endAyat: number;
  nilai: 'Mumtaz' | 'Jayyid Jiddan' | 'Jayyid' | 'Maqbul';
  notes?: string;
}

export interface TeachingSession {
  id: string;
  academicDayId: string;
  programId: string;
  kelasId: string;
  kelasName: string;
  mapelId: string;
  mapelName: string;
  periodIndex: number; // 1..6
  periodTime: string; // e.g. '07:30 - 08:15'
  primaryGuruId: string;
  primaryGuruName: string;
  badalGuruId?: string;
  badalGuruName?: string;
  status: TeachingSessionLifecycle;
  journalFilled: boolean;
  studentAttendanceCompleted: boolean;
  studentAttendanceCount: number;
  totalStudents: number;
  assessmentRequired?: boolean;
  assessmentCompleted?: boolean;
  assessmentEventId?: string;
  assessmentAverageScore?: number;
}

// ── Default Mock Data for Store Initialization ─────────────────────────

const DEFAULT_ACADEMIC_DAY: AcademicDay = {
  id: 'day-2026-08-01-prog-madin',
  programId: 'prog-madin',
  programName: 'Akademik Pesantren',
  date: '2026-08-01',
  status: 'Ready',
  totalTeachersPresent: 14,
  totalTeachersTotal: 18,
  totalSessionsTotal: 24,
  totalSessionsCompleted: 0,
  totalBadalAssigned: 1,
};

const DEFAULT_TEACHER_ATTENDANCE: TeacherAttendanceLog[] = [
  { id: 'att-1', guruId: 'g1', guruName: 'Ust. Ahmad Zain', scanTime: '06:45:12', status: 'present', method: 'nfc' },
  { id: 'att-2', guruId: 'g2', guruName: 'Ust. Budi Santoso', scanTime: '-', status: 'leave', method: 'manual' },
  { id: 'att-3', guruId: 'g3', guruName: 'Ust. Ali Riza', scanTime: '06:50:40', status: 'present', method: 'nfc' },
  { id: 'att-4', guruId: 'g4', guruName: 'Ust. Fikri', scanTime: '06:55:00', status: 'present', method: 'nfc' },
  { id: 'att-5', guruId: 'g5', guruName: 'Ust. Hamzah', scanTime: '-', status: 'absent', method: 'manual' },
];

const DEFAULT_TEACHING_SESSIONS: TeachingSession[] = [
  { id: 'ts-1', academicDayId: 'day-2026-08-01-prog-madin', programId: 'prog-madin', kelasId: 'k1', kelasName: '7 Abu Bakar', mapelId: 'm1', mapelName: 'Fiqih Al-Wajiz', periodIndex: 1, periodTime: '07:30 - 08:15', primaryGuruId: 'g1', primaryGuruName: 'Ust. Ahmad Zain', status: 'running', journalFilled: false, studentAttendanceCompleted: false, studentAttendanceCount: 28, totalStudents: 30 },
  { id: 'ts-2', academicDayId: 'day-2026-08-01-prog-madin', programId: 'prog-madin', kelasId: 'k2', kelasName: '7 Umar', mapelId: 'm2', mapelName: 'Nahwu Jurumiyah', periodIndex: 1, periodTime: '07:30 - 08:15', primaryGuruId: 'g2', primaryGuruName: 'Ust. Budi Santoso', badalGuruId: 'g3', badalGuruName: 'Ust. Ali Riza', status: 'running', journalFilled: false, studentAttendanceCompleted: false, studentAttendanceCount: 30, totalStudents: 30 },
  { id: 'ts-3', academicDayId: 'day-2026-08-01-prog-madin', programId: 'prog-madin', kelasId: 'k3', kelasName: '8 Utsman', mapelId: 'm3', mapelName: 'Shorof Amtsilah', periodIndex: 2, periodTime: '08:15 - 09:00', primaryGuruId: 'g3', primaryGuruName: 'Ust. Ali Riza', status: 'pending', journalFilled: false, studentAttendanceCompleted: false, studentAttendanceCount: 0, totalStudents: 29 },
  { id: 'ts-4', academicDayId: 'day-2026-08-01-prog-madin', programId: 'prog-madin', kelasId: 'k4', kelasName: '9 Ali', mapelId: 'm4', mapelName: 'Aqidatul Awam', periodIndex: 2, periodTime: '08:15 - 09:00', primaryGuruId: 'g4', primaryGuruName: 'Ust. Fikri', status: 'pending', journalFilled: false, studentAttendanceCompleted: false, studentAttendanceCount: 0, totalStudents: 31 },
];

const DEFAULT_SANTRI_LIST = [
  { id: 's1', name: 'Abdullah Azzam', lastHafalanPos: "Al-Mulk: 1 - 10" },
  { id: 's2', name: 'Ahmad Raihan', lastHafalanPos: "An-Naba': 1 - 15" },
  { id: 's3', name: 'Fadhil Muhammad', lastHafalanPos: "Al-Mursalat: 1 - 20" },
  { id: 's4', name: 'Habib Abdurrahman', lastHafalanPos: "Al-Waqi'ah: 1 - 25" },
  { id: 's5', name: 'Muhammad Al-Fatih', lastHafalanPos: "Yasin: 1 - 30" },
];

const STORAGE_KEYS = {
  DAY: 'mahad_academic_day_v1',
  ATTENDANCE: 'mahad_teacher_attendance_v1',
  SESSIONS: 'mahad_teaching_sessions_v1',
  STUDENT_ATT: 'mahad_student_attendance_v1',
  JOURNALS: 'mahad_kbm_journals_v1',
  TAHFIDZ: 'mahad_tahfidz_progress_v1',
};

export const ACADEMIC_OPERATION_EVENT = 'mahad_academic_operation_updated';

// ── Store Persistence & Event Helpers ─────────────────────────────────

export function getStoredAcademicDay(programId = 'prog-madin'): AcademicDay {
  if (typeof window === 'undefined') return DEFAULT_ACADEMIC_DAY;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.DAY}_${programId}`);
    if (!raw) return { ...DEFAULT_ACADEMIC_DAY, programId };
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_ACADEMIC_DAY, programId };
  }
}

export function saveStoredAcademicDay(day: AcademicDay): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.DAY}_${day.programId}`, JSON.stringify(day));
    window.dispatchEvent(new Event(ACADEMIC_OPERATION_EVENT));
  } catch (e) {
    console.error('Failed to save academic day store:', e);
  }
}

export function getStoredTeachingSessions(programId = 'prog-madin'): TeachingSession[] {
  if (typeof window === 'undefined') return DEFAULT_TEACHING_SESSIONS;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.SESSIONS}_${programId}`);
    if (!raw) return DEFAULT_TEACHING_SESSIONS;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TEACHING_SESSIONS;
  }
}

export function saveStoredTeachingSessions(programId: string, sessions: TeachingSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.SESSIONS}_${programId}`, JSON.stringify(sessions));
    window.dispatchEvent(new Event(ACADEMIC_OPERATION_EVENT));
  } catch (e) {
    console.error('Failed to save teaching sessions store:', e);
  }
}

export function getStoredAttendanceLogs(programId = 'prog-madin'): TeacherAttendanceLog[] {
  if (typeof window === 'undefined') return DEFAULT_TEACHER_ATTENDANCE;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.ATTENDANCE}_${programId}`);
    if (!raw) return DEFAULT_TEACHER_ATTENDANCE;
    return JSON.parse(raw);
  } catch {
    return DEFAULT_TEACHER_ATTENDANCE;
  }
}

// ── Student Attendance Store Operations (Sprint 3) ─────────────────────

export function getStudentAttendanceForSession(sessionId: string): StudentAttendanceRecord[] {
  if (typeof window === 'undefined') {
    return DEFAULT_SANTRI_LIST.map((s) => ({
      id: `sa-${sessionId}-${s.id}`,
      sessionId,
      santriId: s.id,
      santriName: s.name,
      status: 'hadir',
      lastHafalanPos: s.lastHafalanPos,
    }));
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.STUDENT_ATT}_${sessionId}`);
    if (!raw) {
      return DEFAULT_SANTRI_LIST.map((s) => ({
        id: `sa-${sessionId}-${s.id}`,
        sessionId,
        santriId: s.id,
        santriName: s.name,
        status: 'hadir',
        lastHafalanPos: s.lastHafalanPos,
      }));
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SANTRI_LIST.map((s) => ({
      id: `sa-${sessionId}-${s.id}`,
      sessionId,
      santriId: s.id,
      santriName: s.name,
      status: 'hadir',
      lastHafalanPos: s.lastHafalanPos,
    }));
  }
}

export function saveStudentAttendance(
  sessionId: string,
  records: StudentAttendanceRecord[],
  programId = 'prog-madin'
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEYS.STUDENT_ATT}_${sessionId}`, JSON.stringify(records));

    // Update TeachingSession status
    const sessions = getStoredTeachingSessions(programId);
    const presentCount = records.filter((r) => r.status === 'hadir').length;

    const updatedSessions = sessions.map((s) => {
      if (s.id === sessionId) {
        const isJournalDone = s.journalFilled;
        return {
          ...s,
          studentAttendanceCompleted: true,
          studentAttendanceCount: presentCount,
          status: isJournalDone ? ('completed' as const) : s.status,
        };
      }
      return s;
    });

    saveStoredTeachingSessions(programId, updatedSessions);

    // Update AcademicDay total completed sessions if any
    const day = getStoredAcademicDay(programId);
    const completedCount = updatedSessions.filter((s) => s.status === 'completed').length;
    saveStoredAcademicDay({
      ...day,
      totalSessionsCompleted: completedCount,
    });
  } catch (e) {
    console.error('Failed to save student attendance:', e);
  }
}

// ── KBM Journal Store Operations (Sprint 3) ────────────────────────────

export function getKbmJournalForSession(sessionId: string): KbmJournalEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.JOURNALS}_${sessionId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveKbmJournal(
  sessionId: string,
  entry: Omit<KbmJournalEntry, 'id' | 'sessionId' | 'filledAt'>,
  programId = 'prog-madin'
): void {
  if (typeof window === 'undefined') return;
  try {
    const fullEntry: KbmJournalEntry = {
      ...entry,
      id: `jrn-${sessionId}`,
      sessionId,
      filledAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    localStorage.setItem(`${STORAGE_KEYS.JOURNALS}_${sessionId}`, JSON.stringify(fullEntry));

    // Update TeachingSession status
    const sessions = getStoredTeachingSessions(programId);
    const updatedSessions = sessions.map((s) => {
      if (s.id === sessionId) {
        const isAttendanceDone = s.studentAttendanceCompleted;
        return {
          ...s,
          journalFilled: true,
          status: isAttendanceDone ? ('completed' as const) : ('running' as const),
        };
      }
      return s;
    });

    saveStoredTeachingSessions(programId, updatedSessions);

    // Update AcademicDay total completed sessions if any
    const day = getStoredAcademicDay(programId);
    const completedCount = updatedSessions.filter((s) => s.status === 'completed').length;
    saveStoredAcademicDay({
      ...day,
      totalSessionsCompleted: completedCount,
    });
  } catch (e) {
    console.error('Failed to save KBM journal entry:', e);
  }
}

// ── KBM Activation Action ──────────────────────────────────────────────

export function activateKbmToday(programId: string, adminName = 'Admin Akademik'): AcademicDay {
  const currentDay = getStoredAcademicDay(programId);
  const updatedDay: AcademicDay = {
    ...currentDay,
    status: 'Running',
    activatedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    activatedBy: adminName,
  };
  saveStoredAcademicDay(updatedDay);

  // Transition all pending sessions to running
  const sessions = getStoredTeachingSessions(programId);
  const updatedSessions = sessions.map((s) => ({
    ...s,
    status: s.status === 'pending' ? ('running' as const) : s.status,
  }));
  saveStoredTeachingSessions(programId, updatedSessions);

  return updatedDay;
}

// ── Badal Guru Recommendation Algorithm ────────────────────────────────

export interface BadalRecommendation {
  guruId: string;
  guruName: string;
  attendanceStatus: string;
  scanTime?: string;
  dailyLoadCount: number;
  matchScore: number;
  matchReasons: string[];
}

export function getRecommendedBadalTeachers(
  targetPeriodIndex: number,
  allTeachers: { id: string; name: string }[] = [],
  programId = 'prog-madin'
): BadalRecommendation[] {
  const attendanceLogs = getStoredAttendanceLogs(programId);
  const sessions = getStoredTeachingSessions(programId);

  const mockList = allTeachers.length > 0 ? allTeachers : [
    { id: 'g1', name: 'Ust. Ahmad Zain' },
    { id: 'g3', name: 'Ust. Ali Riza' },
    { id: 'g4', name: 'Ust. Fikri' },
    { id: 'g6', name: 'Ust. Khalid Basalamah' },
    { id: 'g7', name: 'Ust. Zulkifli' },
  ];

  return mockList
    .map((guru) => {
      const att = attendanceLogs.find((a) => a.guruId === guru.id);
      const isPresent = att?.status === 'present';
      const scanTime = att?.scanTime;

      // Check if teacher is busy teaching at this period
      const isBusyAtPeriod = sessions.some(
        (s) => (s.primaryGuruId === guru.id || s.badalGuruId === guru.id) && s.periodIndex === targetPeriodIndex
      );

      // Count daily load
      const dailyLoadCount = sessions.filter(
        (s) => s.primaryGuruId === guru.id || s.badalGuruId === guru.id
      ).length;

      const matchReasons: string[] = [];
      let matchScore = 0;

      if (isPresent) {
        matchScore += 50;
        matchReasons.push('🟢 Hadir Scan NFC Pagi');
      } else {
        matchReasons.push('⚪ Belum Scan / Belum Hadir');
      }

      if (!isBusyAtPeriod) {
        matchScore += 40;
        matchReasons.push(`🟢 Kosong di Jam Ke-${targetPeriodIndex}`);
      } else {
        matchReasons.push(`🔴 Sedang Mengajar di Jam Ke-${targetPeriodIndex}`);
      }

      if (dailyLoadCount <= 2) {
        matchScore += 10;
        matchReasons.push(`📊 Beban Rendah (${dailyLoadCount} Jam)`);
      }

      return {
        guruId: guru.id,
        guruName: guru.name,
        attendanceStatus: isPresent ? 'Hadir' : 'Belum Scan',
        scanTime,
        dailyLoadCount,
        matchScore,
        matchReasons,
      };
    })
    .filter((r) => r.matchScore >= 40) // Must not be busy at period
    .sort((a, b) => b.matchScore - a.matchScore || a.dailyLoadCount - b.dailyLoadCount);
}

// ── Badal Assignment Action ────────────────────────────────────────────

export function assignBadalGuru(
  sessionId: string,
  badalGuruId: string,
  badalGuruName: string,
  programId = 'prog-madin'
): void {
  const sessions = getStoredTeachingSessions(programId);
  const updated = sessions.map((s) => {
    if (s.id === sessionId) {
      return {
        ...s,
        badalGuruId,
        badalGuruName,
        status: 'running' as const,
      };
    }
    return s;
  });
  saveStoredTeachingSessions(programId, updated);

  // Update academic day badal counter
  const currentDay = getStoredAcademicDay(programId);
  saveStoredAcademicDay({
    ...currentDay,
    totalBadalAssigned: currentDay.totalBadalAssigned + 1,
  });
}

// ── Daily Closing Engine ───────────────────────────────────────────────

export interface ClosingValidation {
  canClose: boolean;
  checks: {
    label: string;
    passed: boolean;
    detail: string;
  }[];
}

export function updateTeachingSessionAssessmentStatus(
  sessionId: string,
  eventId: string,
  averageScore: number,
  isCompleted = true,
  programId = 'prog-madin'
): void {
  if (typeof window === 'undefined') return;
  try {
    const sessions = getStoredTeachingSessions(programId);
    const updatedSessions = sessions.map((s) => {
      if (s.id === sessionId) {
        const isJournalDone = s.journalFilled;
        const isAttendanceDone = s.studentAttendanceCompleted;
        const fullyCompleted = isJournalDone && isAttendanceDone && isCompleted;

        return {
          ...s,
          assessmentCompleted: isCompleted,
          assessmentEventId: eventId,
          assessmentAverageScore: averageScore,
          status: fullyCompleted ? ('completed' as const) : s.status,
        };
      }
      return s;
    });

    saveStoredTeachingSessions(programId, updatedSessions);

    const day = getStoredAcademicDay(programId);
    const completedCount = updatedSessions.filter((s) => s.status === 'completed').length;
    saveStoredAcademicDay({
      ...day,
      totalSessionsCompleted: completedCount,
    });
  } catch (e) {
    console.error('Failed to update teaching session assessment status:', e);
  }
}

export function validateDailyClosing(programId = 'prog-madin'): ClosingValidation {
  const sessions = getStoredTeachingSessions(programId);
  const day = getStoredAcademicDay(programId);

  const pendingCount = sessions.filter((s) => s.status === 'pending').length;
  const uncompletedJournalCount = sessions.filter((s) => !s.journalFilled && s.status === 'running').length;
  const uncompletedAttendanceCount = sessions.filter((s) => !s.studentAttendanceCompleted && s.status === 'running').length;
  const uncompletedAssessmentCount = sessions.filter((s) => s.assessmentRequired && !s.assessmentCompleted && s.status === 'running').length;

  const checks = [
    {
      label: 'Kehadiran Pengajar (Teacher Attendance)',
      passed: day.totalTeachersPresent > 0,
      detail: `${day.totalTeachersPresent} dari ${day.totalTeachersTotal} Guru Hadir`,
    },
    {
      label: 'Absensi Santri per-Kelas',
      passed: uncompletedAttendanceCount === 0,
      detail: uncompletedAttendanceCount === 0 ? 'Lengkap (Semua Sesi Terisi)' : `${uncompletedAttendanceCount} Sesi belum absensi santri`,
    },
    {
      label: 'Jurnal KBM Pengajar',
      passed: uncompletedJournalCount === 0,
      detail: uncompletedJournalCount === 0 ? 'Lengkap (Semua Jurnal Terisi)' : `${uncompletedJournalCount} Jurnal belum diisi pengajar`,
    },
    {
      label: 'Assessment Penilaian Sesi (Jadwal Terdaftar)',
      passed: uncompletedAssessmentCount === 0,
      detail: uncompletedAssessmentCount === 0 ? 'Lengkap (Seluruh Penilaian Terisi/Opsional)' : `${uncompletedAssessmentCount} Penilaian Sesi Belum Selesai`,
    },
    {
      label: 'Penugasan Guru Badal (Badal Resolution)',
      passed: true,
      detail: `${day.totalBadalAssigned} Sesi Badal Terkonfirmasi`,
    },
  ];

  const canClose = checks.every((c) => c.passed);

  return { canClose, checks };
}

export function closeAcademicDay(programId = 'prog-madin', adminName = 'Admin Akademik'): AcademicDay {
  const currentDay = getStoredAcademicDay(programId);
  const updatedDay: AcademicDay = {
    ...currentDay,
    status: 'Closed',
    closedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    closedBy: adminName,
  };
  saveStoredAcademicDay(updatedDay);

  // Lock all sessions
  const sessions = getStoredTeachingSessions(programId);
  const updatedSessions = sessions.map((s) => ({
    ...s,
    status: 'locked' as const,
  }));
  saveStoredTeachingSessions(programId, updatedSessions);

  return updatedDay;
}
