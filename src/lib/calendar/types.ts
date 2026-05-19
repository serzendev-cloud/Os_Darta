// ========================================
// UNIFIED CALENDAR FOUNDATION TYPES
// Source types aggregate from 6 domains into one calendar engine.
// Types only — no engine, no scheduler, no Firestore binding yet.
// ========================================

import type { UserRole } from '@/types';

/** Domain source — where an event originates */
export type CalendarSourceType =
  | 'akademik'
  | 'administrasi'
  | 'kesiswaan'
  | 'asrama'
  | 'kesehatan'
  | 'movement';

/** Who participates in this event */
export type ParticipantType =
  | 'santri'
  | 'guru'
  | 'musyrif'
  | 'staff'
  | 'wali'
  | 'all';

/** Agenda category for grouping and filtering */
export type AgendaCategory =
  | 'akademik'
  | 'ibadah'
  | 'kegiatan'
  | 'ujian'
  | 'rapat'
  | 'kesehatan'
  | 'lainnya';

/** Reminder configuration — future notification scheduler integration */
export interface ReminderConfig {
  enabled: boolean;
  beforeMinutes: number;
  channels: ('push' | 'email' | 'whatsapp')[];
}

/** Visibility scope — controls who can see this event */
export interface CalendarVisibilityScope {
  targetRoles?: UserRole[];
  targetAsramaId?: string;
  targetKelasId?: string;
  targetAngkatan?: number;
  isPublic: boolean;
}

/** Unified calendar event shape — placeholder for future Firestore collection */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  sourceType: CalendarSourceType;
  category: AgendaCategory;
  participants: ParticipantType[];
  reminder?: ReminderConfig;
  visibility: CalendarVisibilityScope;
  createdBy: string;
  createdAt: string;
}
