'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  School, 
  Save, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { 
  getKbmJournalForSession, 
  saveKbmJournal, 
  TeachingSession 
} from '@/lib/store/academic-operation-store';

interface SessionJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TeachingSession | null;
  programId?: string;
  onSaved?: () => void;
}

export function SessionJournalModal({
  isOpen,
  onClose,
  session,
  programId = 'prog-madin',
  onSaved,
}: SessionJournalModalProps) {
  const [materiBab, setMateriBab] = useState('');
  const [catatanKbm, setCatatanKbm] = useState('');
  const [catatanSantri, setCatatanSantri] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session) {
      const journal = getKbmJournalForSession(session.id);
      if (journal) {
        setMateriBab(journal.materiBab);
        setCatatanKbm(journal.catatanKbm || '');
        setCatatanSantri(journal.catatanSantri || '');
      } else {
        setMateriBab('');
        setCatatanKbm('');
        setCatatanSantri('');
      }
    }
  }, [session]);

  if (!isOpen || !session) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiBab.trim()) return;

    setIsSaving(true);
    setTimeout(() => {
      saveKbmJournal(
        session.id,
        {
          materiBab,
          catatanKbm,
          catatanSantri,
          filledBy: session.badalGuruName || session.primaryGuruName,
          isBadal: Boolean(session.badalGuruId),
        },
        programId
      );
      setIsSaving(false);
      onSaved?.();
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200 flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Jurnal Pembelajaran KBM</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 text-stone-300 hover:text-white hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">
              {session.kelasName} &bull; {session.mapelName}
            </h2>
            <p className="text-stone-300 text-xs flex items-center gap-2">
              <School className="w-3.5 h-3.5 text-amber-400" /> Jam Ke-{session.periodIndex} ({session.periodTime}) &bull; Pengajar: {session.badalGuruName || session.primaryGuruName}
            </p>
          </div>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Field 1: Materi & Bab (Mandatory) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
              Materi & Bab Pembelajaran <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Bab Thoharoh - Pasal Syarat & Rukun Wudhu"
              value={materiBab}
              onChange={(e) => setMateriBab(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Field 2: Catatan KBM (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
              Catatan KBM & Progres Kelas (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder="Catatan mengenai kondisi suasana kelas atau materi yang perlu diulang..."
              value={catatanKbm}
              onChange={(e) => setCatatanKbm(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all resize-none"
            />
          </div>

          {/* Field 3: Catatan Khusus Santri (Optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
              Catatan Khusus Santri (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Santri A perlu bimbingan hafalan tambahan"
              value={catatanSantri}
              onChange={(e) => setCatatanSantri(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Modal Footer Bar */}
          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSaving || !materiBab.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Jurnal KBM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
