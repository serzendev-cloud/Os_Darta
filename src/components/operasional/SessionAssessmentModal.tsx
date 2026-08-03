'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  X,
  Award,
  BookOpen,
  School,
  Save,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Lock,
  Layers,
  BarChart3,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import {
  TeachingSession,
  getStudentAttendanceForSession,
  updateTeachingSessionAssessmentStatus,
} from '@/lib/store/academic-operation-store';
import {
  AssessmentEvent,
  AssessmentComponent,
  AssessmentTemplate,
  StudentAssessmentScore,
  AssessmentSource,
  getAssessmentTemplates,
  getAssessmentEventForSession,
  saveAssessmentEvent,
  computeStudentFinalScore,
  calculateAssessmentSummary,
  getBadalAssessmentPolicy,
} from '@/lib/store/assessment-store';
import { cn } from '@/lib/utils';

interface SessionAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TeachingSession | null;
  programId?: string;
  onSaved?: () => void;
}

export function SessionAssessmentModal({
  isOpen,
  onClose,
  session,
  programId = 'prog-madin',
  onSaved,
}: SessionAssessmentModalProps) {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventSource, setEventSource] = useState<AssessmentSource>('daily_assessment');
  const [components, setComponents] = useState<AssessmentComponent[]>([]);
  const [studentScores, setStudentScores] = useState<StudentAssessmentScore[]>([]);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'input' | 'summary'>('input');

  const badalPolicy = useMemo(() => getBadalAssessmentPolicy(), []);
  const isBadalGuru = Boolean(session?.badalGuruId);
  const isInputRestrictedForBadal = isBadalGuru && !badalPolicy.allowBadalInputResult;

  useEffect(() => {
    if (session) {
      const tmpls = getAssessmentTemplates(programId);
      setTemplates(tmpls);

      const existingEvent = getAssessmentEventForSession(session.id);
      if (existingEvent) {
        setEventTitle(existingEvent.title);
        setEventSource(existingEvent.source);
        setComponents(existingEvent.components);
        setStudentScores(existingEvent.studentScores);
        setIsLocked(existingEvent.status === 'locked');
        if (existingEvent.templateId) setSelectedTemplateId(existingEvent.templateId);
      } else {
        // Initialize default from attendance santri list
        const attendanceList = getStudentAttendanceForSession(session.id);
        const defaultTmpl = tmpls[0];
        const defaultComponents: AssessmentComponent[] = defaultTmpl ? defaultTmpl.components : [
          { id: 'c1', name: 'Nilai Harian / Tugas', weight: 50, gradingType: 'numeric', maxScore: 100, minScore: 0 },
          { id: 'c2', name: 'Keaktifan & Praktik', weight: 50, gradingType: 'numeric', maxScore: 100, minScore: 0 },
        ];

        setEventTitle(`Penilaian Sesi ${session.mapelName}`);
        setEventSource(defaultTmpl ? defaultTmpl.source : 'daily_assessment');
        setComponents(defaultComponents);
        setSelectedTemplateId(defaultTmpl ? defaultTmpl.id : '');
        setIsLocked(false);

        const initialScores: StudentAssessmentScore[] = attendanceList.map((att) => ({
          santriId: att.santriId,
          santriName: att.santriName,
          scores: {},
        }));
        setStudentScores(initialScores);
      }
    }
  }, [session, programId]);

  if (!isOpen || !session) return null;

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setEventTitle(`${tmpl.title} - ${session.kelasName}`);
      setEventSource(tmpl.source);
      setComponents(tmpl.components);

      // Recalculate scores with new components
      setStudentScores((prev) =>
        prev.map((s) => {
          const res = computeStudentFinalScore(s.scores, tmpl.components);
          return { ...s, finalScore: res.finalScore, predicate: res.predicate };
        })
      );
    }
  };

  const handleScoreChange = (santriId: string, componentId: string, valueStr: string) => {
    if (isLocked || isInputRestrictedForBadal) return;
    const numVal = valueStr === '' ? NaN : Math.max(0, Math.min(100, Number(valueStr)));

    setStudentScores((prev) =>
      prev.map((s) => {
        if (s.santriId === santriId) {
          const newScores = { ...s.scores };
          if (isNaN(numVal)) {
            delete newScores[componentId];
          } else {
            newScores[componentId] = numVal;
          }
          const res = computeStudentFinalScore(newScores, components);
          return {
            ...s,
            scores: newScores,
            finalScore: res.finalScore,
            predicate: res.predicate,
          };
        }
        return s;
      })
    );
  };

  const handleNotesChange = (santriId: string, notes: string) => {
    if (isLocked || isInputRestrictedForBadal) return;
    setStudentScores((prev) =>
      prev.map((s) => (s.santriId === santriId ? { ...s, notes } : s))
    );
  };

  const handleBatchSetScore = (presetValue: number) => {
    if (isLocked || isInputRestrictedForBadal) return;
    setStudentScores((prev) =>
      prev.map((s) => {
        const newScores: Record<string, number> = {};
        components.forEach((c) => {
          newScores[c.id] = presetValue;
        });
        const res = computeStudentFinalScore(newScores, components);
        return {
          ...s,
          scores: newScores,
          finalScore: res.finalScore,
          predicate: res.predicate,
        };
      })
    );
  };

  const summary = calculateAssessmentSummary(studentScores, components);

  const handleSave = (shouldLock = false) => {
    if (isInputRestrictedForBadal) return;
    setIsSaving(true);

    setTimeout(() => {
      const eventPayload: AssessmentEvent = {
        id: `evt-${session.id}`,
        sessionId: session.id,
        academicDayId: session.academicDayId,
        programId,
        templateId: selectedTemplateId || undefined,
        title: eventTitle || `Penilaian ${session.mapelName}`,
        source: eventSource,
        components,
        status: shouldLock ? 'locked' : 'completed',
        filledAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        filledBy: session.badalGuruName || session.primaryGuruName,
        isBadal: isBadalGuru,
        studentScores,
      };

      saveAssessmentEvent(eventPayload, programId);
      updateTeachingSessionAssessmentStatus(
        session.id,
        eventPayload.id,
        summary.averageScore,
        true,
        programId
      );

      setIsSaving(false);
      onSaved?.();
      onClose();
    }, 300);
  };

  const sourceLabels: Record<AssessmentSource, string> = {
    office_exam: 'Ujian Resmi Kantor',
    teacher_assessment: 'Penilaian Pengajar',
    daily_assessment: 'Penilaian Harian',
    practice: 'Penilaian Praktik',
    memorization: 'Setoran Hafalan',
    assignment: 'Tugas Mandiri',
    behaviour: 'Observasi Karakter',
    custom: 'Penilaian Custom',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Assessment Engine &bull; TeachingSession</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 text-stone-300 hover:text-white hover:bg-white/20 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>{session.kelasName} &bull; {session.mapelName}</span>
              {isLocked && (
                <span className="px-2.5 py-0.5 rounded-full bg-stone-700 text-stone-200 border border-stone-600 text-[10px] font-mono flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-400" /> LOCKED
                </span>
              )}
            </h2>
            <p className="text-stone-300 text-xs flex items-center gap-2">
              <School className="w-3.5 h-3.5 text-amber-400" /> Jam Ke-{session.periodIndex} ({session.periodTime}) &bull; Pengajar: {session.badalGuruName || session.primaryGuruName} {session.badalGuruName && '(Guru Badal)'}
            </p>
          </div>

          {/* Sub-Header Navigation Tabs & Counter Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-2 bg-stone-800/80 p-1 rounded-xl border border-stone-700">
              <button
                type="button"
                onClick={() => setActiveTab('input')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  activeTab === 'input'
                    ? 'bg-amber-500 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                )}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Input Nilai Santri</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  activeTab === 'summary'
                    ? 'bg-amber-500 text-white shadow'
                    : 'text-stone-400 hover:text-white'
                )}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Ringkasan & Distribusi</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Terisi: {summary.evaluatedCount}/{summary.totalSantri} Santri
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Rata-rata: {summary.averageScore}
              </span>
            </div>
          </div>
        </div>

        {/* Badal Guru Policy Warning Banner */}
        {isInputRestrictedForBadal && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 px-6 flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
            <span>
              Kebijakan Pesantren: Guru Badal hanya diizinkan membaca penilaian. Pengisian nilai dibatasi untuk Guru Utama.
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Template & Event Selector Bar */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                  Templat Penilaian (Assessment Template)
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleSelectTemplate(e.target.value)}
                  disabled={isLocked || isInputRestrictedForBadal}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Gunakan Komponen Custom --</option>
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.title} ({sourceLabels[tmpl.source]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                  Nama Agenda / Assessment Event
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  disabled={isLocked || isInputRestrictedForBadal}
                  placeholder="Nama agenda penilaian..."
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Active Components Pill Badges */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                Komponen Aktif ({components.length} Komponen):
              </span>
              <div className="flex flex-wrap gap-2">
                {components.map((comp) => (
                  <span
                    key={comp.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs font-bold"
                  >
                    <Layers className="w-3 h-3 text-amber-500" />
                    <span>{comp.name}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-amber-200 dark:bg-amber-900 text-[10px]">
                      {comp.weight}%
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* TAB 1: INPUT NILAI SANTRI */}
          {activeTab === 'input' && (
            <div className="space-y-4">
              {/* Batch Autofill Toolbar */}
              {!isLocked && !isInputRestrictedForBadal && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Autofill Cepat (Quick Presets):</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleBatchSetScore(90)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-all shadow-sm"
                    >
                      Set All 90 (Mumtaz)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchSetScore(85)}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] transition-all shadow-sm"
                    >
                      Set All 85 (Jayyid Jiddan)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBatchSetScore(75)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] transition-all shadow-sm"
                    >
                      Set All 75 (Jayyid)
                    </button>
                  </div>
                </div>
              )}

              {/* Santri Score Input Grid Table */}
              <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">No</th>
                      <th className="p-3.5">Nama Santri</th>
                      {components.map((c) => (
                        <th key={c.id} className="p-3.5 text-center min-w-[110px]">
                          {c.name} ({c.weight}%)
                        </th>
                      ))}
                      <th className="p-3.5 text-center min-w-[100px]">Nilai Akhir</th>
                      <th className="p-3.5 text-center min-w-[130px]">Predikat</th>
                      <th className="p-3.5 min-w-[150px]">Catatan Musyrif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800 font-medium text-stone-900 dark:text-white">
                    {studentScores.map((student, idx) => (
                      <tr key={student.santriId} className="hover:bg-stone-50 dark:hover:bg-stone-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-stone-500">{idx + 1}</td>
                        <td className="p-3.5 font-black">{student.santriName}</td>
                        {components.map((c) => {
                          const val = student.scores[c.id] !== undefined ? student.scores[c.id] : '';
                          return (
                            <td key={c.id} className="p-2 text-center">
                              <input
                                type="number"
                                min={c.minScore}
                                max={c.maxScore}
                                value={val}
                                onChange={(e) => handleScoreChange(student.santriId, c.id, e.target.value)}
                                disabled={isLocked || isInputRestrictedForBadal}
                                placeholder="0-100"
                                className="w-20 px-2.5 py-1.5 text-center rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-black text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                              />
                            </td>
                          );
                        })}
                        <td className="p-3.5 text-center font-mono font-black text-sm">
                          {student.finalScore !== undefined ? (
                            <span className={cn(
                              'px-2.5 py-1 rounded-lg text-xs font-black border',
                              student.finalScore >= 80
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                : student.finalScore >= 70
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            )}>
                              {student.finalScore}
                            </span>
                          ) : (
                            <span className="text-stone-400 font-normal">-</span>
                          )}
                        </td>
                        <td className="p-3.5 text-center text-[11px] font-bold">
                          {student.predicate ? (
                            <span className="text-amber-800 dark:text-amber-300">{student.predicate}</span>
                          ) : (
                            <span className="text-stone-400 font-normal">Belum Evaluasi</span>
                          )}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={student.notes || ''}
                            onChange={(e) => handleNotesChange(student.santriId, e.target.value)}
                            disabled={isLocked || isInputRestrictedForBadal}
                            placeholder="Catatan..."
                            className="w-full px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: RINGKASAN & ANALITIK DISTRIBUSI */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Summary Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Total Santri Evaluasi</span>
                  <span className="text-2xl font-black">{summary.evaluatedCount} / {summary.totalSantri}</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Rata-rata Sesi Kelas</span>
                  <span className="text-2xl font-black">{summary.averageScore}</span>
                </div>

                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Nilai Tertinggi</span>
                  <span className="text-2xl font-black">{summary.highestScore}</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider block">Nilai Terendah</span>
                  <span className="text-2xl font-black">{summary.lowestScore}</span>
                </div>
              </div>

              {/* Grade Distribution Badges & Histogram */}
              <div className="p-6 rounded-3xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-4">
                <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  <span>Distribusi Predikat Nilai Sesi</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-900 dark:text-emerald-300 text-center">
                    <span className="text-[10px] font-bold uppercase block">Mumtaz (90-100)</span>
                    <span className="text-xl font-black">{summary.gradeDistribution.mumtaz} Santri</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-900 dark:text-blue-300 text-center">
                    <span className="text-[10px] font-bold uppercase block">Jayyid Jiddan (80-89)</span>
                    <span className="text-xl font-black">{summary.gradeDistribution.jayyidJiddan} Santri</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-900 dark:text-amber-300 text-center">
                    <span className="text-[10px] font-bold uppercase block">Jayyid (70-79)</span>
                    <span className="text-xl font-black">{summary.gradeDistribution.jayyid} Santri</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-900 dark:text-orange-300 text-center">
                    <span className="text-[10px] font-bold uppercase block">Maqbul (60-69)</span>
                    <span className="text-xl font-black">{summary.gradeDistribution.maqbul} Santri</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-900 dark:text-rose-300 text-center">
                    <span className="text-[10px] font-bold uppercase block">Rasib (&lt;60)</span>
                    <span className="text-xl font-black">{summary.gradeDistribution.rasib} Santri</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 bg-stone-50 dark:bg-stone-900/90 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-extrabold text-xs hover:bg-stone-300 dark:hover:bg-stone-700 transition-all"
          >
            Tutup
          </button>

          {!isLocked && !isInputRestrictedForBadal && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-2xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-black text-xs hover:bg-stone-800 transition-all shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Draft Penilaian'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs transition-all shadow-lg flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Simpan & Kunci Penilaian (Lock)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
