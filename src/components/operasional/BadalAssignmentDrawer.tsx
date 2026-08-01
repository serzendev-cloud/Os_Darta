'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  BookOpen,
  School
} from 'lucide-react';
import { 
  getRecommendedBadalTeachers, 
  assignBadalGuru, 
  BadalRecommendation,
  TeachingSession 
} from '@/lib/store/academic-operation-store';
import { cn } from '@/lib/utils';

interface BadalAssignmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session: TeachingSession | null;
  programId?: string;
  onAssigned?: () => void;
}

export function BadalAssignmentDrawer({
  isOpen,
  onClose,
  session,
  programId = 'prog-madin',
  onAssigned,
}: BadalAssignmentDrawerProps) {
  const [recommendations, setRecommendations] = useState<BadalRecommendation[]>([]);
  const [selectedGuru, setSelectedGuru] = useState<BadalRecommendation | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (session) {
      const recs = getRecommendedBadalTeachers(session.periodIndex, [], programId);
      setRecommendations(recs);
      if (recs.length > 0) {
        setSelectedGuru(recs[0]);
      }
    }
  }, [session, programId]);

  if (!isOpen || !session) return null;

  const handleConfirmAssign = () => {
    if (!selectedGuru) return;
    setIsAssigning(true);
    setTimeout(() => {
      assignBadalGuru(session.id, selectedGuru.guruId, selectedGuru.guruName, programId);
      setIsAssigning(false);
      onAssigned?.();
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-all">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 h-full shadow-2xl flex flex-col justify-between border-l border-stone-200 dark:border-stone-800 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Penetapan Guru Badal (Pengganti)</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 text-stone-300 hover:text-white hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-black text-white">
              Sesi Jam Ke-{session.periodIndex} ({session.periodTime})
            </h2>
            <p className="text-stone-300 text-xs flex items-center gap-2">
              <School className="w-3.5 h-3.5 text-amber-400" /> {session.kelasName} &bull; <BookOpen className="w-3.5 h-3.5 text-amber-400" /> {session.mapelName}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Guru Berhalangan (Izin/Sakit):</span>
            </div>
            <p className="font-extrabold text-white text-sm">
              {session.primaryGuruName}
            </p>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Rekomendasi Guru Pengganti</span>
            </h3>
            <span className="text-[10px] font-bold text-stone-400">
              {recommendations.length} Ust. Available
            </span>
          </div>

          <div className="space-y-2.5">
            {recommendations.map((rec, index) => {
              const isSelected = selectedGuru?.guruId === rec.guruId;

              return (
                <button
                  key={rec.guruId}
                  type="button"
                  onClick={() => setSelectedGuru(rec)}
                  className={cn(
                    'w-full p-4 rounded-2xl border text-left transition-all duration-200 space-y-2 relative overflow-hidden',
                    isSelected
                      ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                      : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <h4 className="text-xs font-black text-stone-900 dark:text-white">
                        {rec.guruName}
                      </h4>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {rec.matchReasons.map((reason, rIdx) => (
                      <span
                        key={rIdx}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 text-[10px] font-bold border border-stone-200 dark:border-stone-700"
                      >
                        {reason}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Action Bar */}
        <div className="p-6 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 space-y-3">
          <button
            type="button"
            disabled={!selectedGuru || isAssigning}
            onClick={handleConfirmAssign}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isAssigning ? 'Menugaskan Guru Badal...' : `Tugaskan ${selectedGuru?.guruName || 'Guru Badal'}`}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-center text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors"
          >
            Batal / Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
