import { describe, it, expect } from 'vitest';
import {
  formatSourceGroupLabel,
  getPredicateBadgeClass,
  getStatusBadgeClass,
  buildTranscriptPresenter,
} from '@/lib/presenters/transcript-presenter';
import type { AcademicTranscript, AcademicLedgerRecord } from '@/lib/db/services/academic-ledger';

describe('Transcript & Report Card Presenter Engine', () => {
  describe('formatSourceGroupLabel Helper', () => {
    it('should format source group keys into human-readable Indonesian labels', () => {
      expect(formatSourceGroupLabel('office_exam')).toBe('Ujian Resmi / Semester');
      expect(formatSourceGroupLabel('daily_assessment')).toBe('Penilaian Harian & Setoran');
      expect(formatSourceGroupLabel('teacher_assessment')).toBe('Penilaian Pengajar / Musyrif');
      expect(formatSourceGroupLabel('custom_group')).toBe('custom_group');
    });
  });

  describe('getPredicateBadgeClass Helper', () => {
    it('should return matching Tailwind CSS classes for Islamic Pesantren predicates', () => {
      expect(getPredicateBadgeClass('Mumtaz')).toContain('emerald');
      expect(getPredicateBadgeClass('Jayyid Jiddan')).toContain('blue');
      expect(getPredicateBadgeClass('Jayyid')).toContain('indigo');
      expect(getPredicateBadgeClass('Maqbul')).toContain('amber');
      expect(getPredicateBadgeClass('Rasib')).toContain('rose');
    });
  });

  describe('getStatusBadgeClass Helper', () => {
    it('should return matching badge classes for Transcript statuses', () => {
      expect(getStatusBadgeClass('Locked')).toContain('emerald');
      expect(getStatusBadgeClass('Published')).toContain('sky');
      expect(getStatusBadgeClass('Draft')).toContain('amber');
    });
  });

  describe('buildTranscriptPresenter (Single Source of Truth Enforcement)', () => {
    it('should present AcademicTranscript and AcademicLedgerRecord without mutating score or predicate', () => {
      const mockTranscript: AcademicTranscript = {
        id: 'tr_test_1',
        santriId: 'santri_123',
        academicTermId: 'term_ganjil_2026',
        finalScore: 92.4,
        predicate: 'Mumtaz',
        isLocked: true,
        lockedAt: '2026-08-04T00:00:00Z',
      };

      const mockRecords: AcademicLedgerRecord[] = [
        {
          id: 'rec_1',
          santriId: 'santri_123',
          academicTermId: 'term_ganjil_2026',
          mapelId: 'mapel_tahfidz',
          sourceGroup: 'office_exam',
          rawScore: 95,
          weightedScore: 38,
        },
        {
          id: 'rec_2',
          santriId: 'santri_123',
          academicTermId: 'term_ganjil_2026',
          mapelId: 'mapel_tahfidz',
          sourceGroup: 'daily_assessment',
          rawScore: 90,
          weightedScore: 54,
        },
      ];

      const presenter = buildTranscriptPresenter(mockTranscript, mockRecords, {
        santriName: 'Muhammad Rizky',
        nis: '2026.01.099',
        kelas: 'Kelas X Tahfidz A',
        academicTermName: 'Semester Ganjil',
        academicYearName: '2026/2027',
        tenantName: 'Pesantren Al-Fatih',
      });

      // Single Source of Truth Verification
      expect(presenter.finalScore).toBe(92.4);
      expect(presenter.formattedFinalScore).toBe('92.4');
      expect(presenter.predicate).toBe('Mumtaz');
      expect(presenter.status).toBe('Locked');
      expect(presenter.isLocked).toBe(true);

      // Records Presenter Verification
      expect(presenter.records).toHaveLength(2);
      expect(presenter.records[0].sourceGroupLabel).toBe('Ujian Resmi / Semester');
      expect(presenter.records[0].formattedRawScore).toBe('95.0');
      expect(presenter.records[0].formattedWeightedScore).toBe('38.0');
    });
  });
});
