import { describe, it, expect } from 'vitest';
import {
  roundScore,
  determinePredicate,
  calculateSingleStudentTranscript,
  academicTranscriptService,
} from '@/lib/db/services/academic-ledger';
import type { AssessmentEvent, SemesterCalculationScheme } from '@/lib/store/assessment-store';

describe('Academic Ledger Engine', () => {
  describe('roundScore Helper', () => {
    it('should round scores correctly based on strategy', () => {
      expect(roundScore(85.5, 'HALF_UP')).toBe(86);
      expect(roundScore(85.4, 'HALF_UP')).toBe(85);
      expect(roundScore(85.9, 'FLOOR')).toBe(85);
      expect(roundScore(85.1, 'CEIL')).toBe(86);
    });
  });

  describe('determinePredicate Helper', () => {
    it('should assign Islamic pesantren predicate correctly based on score', () => {
      expect(determinePredicate(95)).toBe('Mumtaz');
      expect(determinePredicate(85)).toBe('Jayyid Jiddan');
      expect(determinePredicate(75)).toBe('Jayyid');
      expect(determinePredicate(65)).toBe('Maqbul');
      expect(determinePredicate(50)).toBe('Rasib');
    });
  });

  describe('calculateSingleStudentTranscript Engine', () => {
    it('should aggregate event scores and apply semester scheme weights correctly', () => {
      const mockEvents: AssessmentEvent[] = [
        {
          id: 'ev_1',
          sessionId: 'sess_1',
          programId: 'prog_tahfidz',
          title: 'Ujian Mid Semester Tahfidz',
          source: 'office_exam',
          components: [],
          status: 'completed',
          isBadal: false,
          studentScores: [
            { santriId: 'santri_001', santriName: 'Ahmad', scores: {}, finalScore: 90 },
          ],
        },
        {
          id: 'ev_2',
          sessionId: 'sess_2',
          programId: 'prog_tahfidz',
          title: 'Hafalan Harian 1',
          source: 'daily_assessment',
          components: [],
          status: 'completed',
          isBadal: false,
          studentScores: [
            { santriId: 'santri_001', santriName: 'Ahmad', scores: {}, finalScore: 80 },
          ],
        },
        {
          id: 'ev_3',
          sessionId: 'sess_3',
          programId: 'prog_tahfidz',
          title: 'Hafalan Harian 2',
          source: 'daily_assessment',
          components: [],
          status: 'completed',
          isBadal: false,
          studentScores: [
            { santriId: 'santri_001', santriName: 'Ahmad', scores: {}, finalScore: 100 },
          ],
        },
      ];

      const mockScheme: SemesterCalculationScheme = {
        id: 'sch_1',
        programId: 'prog_tahfidz',
        schemeName: 'Skema Tahfidz Standard',
        passingGrade: 70,
        roundStrategy: 'HALF_UP',
        rules: [
          { sourceGroup: 'office_exam', aggregation: 'DIRECT', weight: 40 }, // 90 * 0.4 = 36
          { sourceGroup: 'daily_assessment', aggregation: 'AVERAGE', weight: 60 }, // avg(80,100)=90 * 0.6 = 54
        ],
      };

      const result = calculateSingleStudentTranscript('santri_001', 'term_2026_1', mockEvents, mockScheme);

      // Expected final score = 36 + 54 = 90
      expect(result.finalScore).toBe(90);
      expect(result.predicate).toBe('Mumtaz');
      expect(result.records).toHaveLength(2);
      expect(result.records[0].weightedScore).toBe(36);
      expect(result.records[1].weightedScore).toBe(54);
    });
  });

  describe('Academic Transcript Service', () => {
    it('should create and retrieve transcript correctly via service', async () => {
      const payload = {
        santriId: 'santri_test_123',
        academicTermId: 'term_test_123',
        finalScore: 88,
        predicate: 'Jayyid Jiddan' as const,
        isLocked: false,
      };

      const id = await academicTranscriptService.create(payload);
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');

      const fetched = await academicTranscriptService.get(id);
      expect(fetched).not.toBeNull();
      if (fetched) {
        expect(fetched.finalScore).toBe(88);
        expect(fetched.predicate).toBe('Jayyid Jiddan');
      }
    });
  });
});
