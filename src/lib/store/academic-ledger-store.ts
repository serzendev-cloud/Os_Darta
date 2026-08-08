import { create } from 'zustand';
import {
  AcademicLedgerRecord,
  AcademicTranscript,
  academicLedgerRecordService,
  academicTranscriptService,
  calculateSingleStudentTranscript,
} from '@/lib/db/services/academic-ledger';
import type { AssessmentEvent, SemesterCalculationScheme } from '@/lib/store/assessment-store';

interface AcademicLedgerStoreState {
  transcripts: AcademicTranscript[];
  ledgerRecords: AcademicLedgerRecord[];
  activeTermId: string;
  activeKelasId: string;
  isLoading: boolean;
  isCalculating: boolean;

  // Actions
  setActiveTermId: (termId: string) => void;
  setActiveKelasId: (kelasId: string) => void;
  fetchTranscripts: (termId: string) => Promise<void>;
  calculateClassTranscripts: (params: {
    termId: string;
    santriList: Array<{ id: string; name: string }>;
    events: AssessmentEvent[];
    scheme: SemesterCalculationScheme;
  }) => Promise<void>;
  lockTranscript: (transcriptId: string) => Promise<void>;
}

export const useAcademicLedgerStore = create<AcademicLedgerStoreState>((set, get) => ({
  transcripts: [],
  ledgerRecords: [],
  activeTermId: '',
  activeKelasId: '',
  isLoading: false,
  isCalculating: false,

  setActiveTermId: (termId: string) => set({ activeTermId: termId }),
  setActiveKelasId: (kelasId: string) => set({ activeKelasId: kelasId }),

  fetchTranscripts: async (termId: string) => {
    set({ isLoading: true });
    try {
      // In demo / client mode, demoDb holds state
      const allTranscripts = await academicTranscriptService.get('all') as any;
      if (Array.isArray(allTranscripts)) {
        const filtered = allTranscripts.filter((t: AcademicTranscript) => t.academicTermId === termId);
        set({ transcripts: filtered });
      }
    } catch (e) {
      console.warn('[AcademicLedgerStore] fetchTranscripts error:', e);
    } finally {
      set({ isLoading: false });
    }
  },

  calculateClassTranscripts: async ({ termId, santriList, events, scheme }) => {
    set({ isCalculating: true });
    try {
      const newTranscripts: AcademicTranscript[] = [];

      for (const santri of santriList) {
        const result = calculateSingleStudentTranscript(santri.id, termId, events, scheme);

        // Save ledger records
        for (const rec of result.records) {
          await academicLedgerRecordService.create(rec);
        }

        // Save or update transcript
        const transcriptPayload: Omit<AcademicTranscript, 'id'> = {
          santriId: santri.id,
          academicTermId: termId,
          finalScore: result.finalScore,
          predicate: result.predicate,
          isLocked: false,
          createdAt: new Date().toISOString(),
        };

        const transcriptId = await academicTranscriptService.create(transcriptPayload);
        newTranscripts.push({ ...transcriptPayload, id: transcriptId });
      }

      set({ transcripts: newTranscripts });
    } catch (e) {
      console.error('[AcademicLedgerStore] calculateClassTranscripts error:', e);
    } finally {
      set({ isCalculating: false });
    }
  },

  lockTranscript: async (transcriptId: string) => {
    try {
      await academicTranscriptService.update(transcriptId, {
        isLocked: true,
        lockedAt: new Date().toISOString(),
      });

      set((state) => ({
        transcripts: state.transcripts.map((t) =>
          t.id === transcriptId ? { ...t, isLocked: true, lockedAt: new Date().toISOString() } : t
        ),
      }));
    } catch (e) {
      console.error('[AcademicLedgerStore] lockTranscript error:', e);
    }
  },
}));
