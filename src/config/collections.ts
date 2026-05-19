// Centralized Firestore collection name constants.
// Every service MUST reference these — no hardcoded strings in service files.

export const COLLECTIONS = {
  // Core entities
  SANTRI: 'santri',
  ALUMNI: 'alumni',
  GURU: 'guru',
  USERS: 'users',

  // Facilities
  ASRAMA: 'asrama',
  KAMAR: 'kamar',
  KELAS: 'kelas',

  // Academic
  MAPEL: 'mapel',
  MASTER_TINGKAT: 'masterTingkat',
  MASTER_JENJANG: 'masterJenjang',
  TEACHER_ASSIGNMENTS: 'teacherAssignments',

  // Discipline & Governance
  PELANGGARAN: 'pelanggaran',
  HUKUMAN: 'hukuman',
  MASTER_PELANGGARAN: 'masterPelanggaran',
  MASTER_HUKUMAN: 'masterHukuman',
  GOVERNANCE_CASES: 'governanceCases',
  TOLERANCE_POLICIES: 'tolerancePolicies',

  // Character & Reward
  QUEST: 'quest',
  NOTIFICATIONS: 'notifications',

  // Health
  HEALTH_VISITS: 'healthVisits',
  HEALTH_PERMISSIONS: 'healthPermissions',

  // System
  AUDIT_LOG: 'auditLog',
  APP_CONFIG: 'appConfig',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
