'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ClipboardCheck,
  Award,
  BookOpen,
  Save,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Users,
  Sparkles,
  BarChart3,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import {
  ResponsiveDataGrid,
  MobileCardStack,
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardContent,
  MobileCardFooter,
  ResponsiveFilterBar,
  MobileRowActions,
} from '@/components/ui/responsive-data';
import {
  AssessmentTemplate,
  AssessmentComponent,
  StudentAssessmentScore,
  getAssessmentTemplates,
  computeStudentFinalScore,
  calculateAssessmentSummary,
} from '@/lib/store/assessment-store';
import { getStoredTeachingSessions, TeachingSession } from '@/lib/store/academic-operation-store';
import { useCollection } from '@/hooks';
import type { Santri } from '@/types';
import { cn } from '@/lib/utils';

// Helper initials
const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('');

const PREDICATE_COLORS: Record<string, string> = {
  Mumtaz: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'Jayyid Jiddan': 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  Jayyid: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  Maqbul: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  Rasib: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
};

export default function PenilaianPage() {
  const [programId] = useState('prog-madin');
  const [sessions, setSessions] = useState<TeachingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [components, setComponents] = useState<AssessmentComponent[]>([]);
  const [studentScores, setStudentScores] = useState<StudentAssessmentScore[]>([]);
  const [search, setSearch] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: santriList } = useCollection<Santri>('santri');

  // Load available teaching sessions & assessment templates
  useEffect(() => {
    const sess = getStoredTeachingSessions(programId);
    setSessions(sess);
    if (sess.length > 0) {
      setSelectedSessionId(sess[0].id);
    }

    const tmpls = getAssessmentTemplates(programId);
    setTemplates(tmpls);
    if (tmpls.length > 0) {
      setSelectedTemplateId(tmpls[0].id);
      setComponents(tmpls[0].components);
    }
  }, [programId]);

  // Initialize or update student list when session or template changes
  useEffect(() => {
    if (santriList.length > 0 && components.length > 0) {
      const initialScores: StudentAssessmentScore[] = santriList.slice(0, 15).map((s) => {
        // Pre-fill initial scores for smooth demonstration
        const defaultScores: Record<string, number> = {};
        components.forEach((c, idx) => {
          defaultScores[c.id] = 75 + (idx * 5);
        });
        const computed = computeStudentFinalScore(defaultScores, components);
        return {
          santriId: s.id,
          santriName: s.name,
          scores: defaultScores,
          finalScore: computed.finalScore,
          predicate: computed.predicate,
        };
      });
      setStudentScores(initialScores);
    }
  }, [santriList, components]);

  // Handle template switch
  const handleSelectTemplate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl) {
      setComponents(tmpl.components);
      setStudentScores((prev) =>
        prev.map((s) => {
          const computed = computeStudentFinalScore(s.scores, tmpl.components);
          return { ...s, finalScore: computed.finalScore, predicate: computed.predicate };
        })
      );
    }
  };

  // Score update handler
  const handleScoreChange = (santriId: string, componentId: string, valueStr: string) => {
    const val = valueStr === '' ? 0 : Math.min(Math.max(Number(valueStr), 0), 100);
    setStudentScores((prev) =>
      prev.map((s) => {
        if (s.santriId !== santriId) return s;
        const updatedScores = { ...s.scores, [componentId]: val };
        const computed = computeStudentFinalScore(updatedScores, components);
        return {
          ...s,
          scores: updatedScores,
          finalScore: computed.finalScore,
          predicate: computed.predicate,
        };
      })
    );
    setIsSaved(false);
  };

  // Filtered student list
  const filteredStudents = useMemo(() => {
    return studentScores.filter((s) =>
      s.santriName.toLowerCase().includes(search.toLowerCase())
    );
  }, [studentScores, search]);

  // Assessment Summary Metrics
  const summary = useMemo(() => {
    return calculateAssessmentSummary(studentScores, components);
  }, [studentScores, components]);

  const currentSession = sessions.find((s) => s.id === selectedSessionId);

  const handleSaveAssessment = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
    }, 600);
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Toast Confirmation */}
      {isSaved && (
        <div className="p-4 rounded-2xl bg-emerald-700 text-white font-medium text-xs flex items-center justify-between shadow-xl animate-bounce sticky top-4 z-50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>Penilaian Akademik Berhasil Disimpan & Dihitung Otomatis!</span>
          </div>
          <button onClick={() => setIsSaved(false)} className="text-white/80 hover:text-white font-bold">&times;</button>
        </div>
      )}

      <PageCard
        title="Penilaian & Evaluasi Akademik Santri"
        description="Input nilai harian, ujian, praktik amaliyah, dan evaluasi hafalan santri dengan penghitungan predikat otomatis."
      >
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-500" /> Total Santri
            </span>
            <div className="text-lg font-black text-foreground">{summary.evaluatedCount} / {summary.totalSantri}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <BarChart3 className="w-3.5 h-3.5 text-amber-500" /> Rata-Rata Nilai
            </span>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">{summary.averageScore}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-500" /> Nilai Tertinggi
            </span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{summary.highestScore}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Distribusi Mumtaz
            </span>
            <div className="text-lg font-black text-purple-600 dark:text-purple-400">{summary.gradeDistribution.mumtaz} Santri</div>
          </div>
        </div>

        {/* Toolbar & Filter Bar */}
        <ResponsiveFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari nama santri..."
          filterContent={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Sesi KBM Selector */}
              {sessions.length > 0 && (
                <div className="flex flex-col">
                  <label htmlFor="select-session" className="sr-only">Pilih Sesi Kelas</label>
                  <select
                    id="select-session"
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="text-xs border border-border rounded-xl px-3 py-2 bg-background font-semibold min-h-[44px] sm:min-h-0"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.kelasName} — {s.mapelName} ({s.primaryGuruName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Templat Penilaian Selector */}
              {templates.length > 0 && (
                <div className="flex flex-col">
                  <label htmlFor="select-template" className="sr-only">Pilih Templat Penilaian</label>
                  <select
                    id="select-template"
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="text-xs border border-border rounded-xl px-3 py-2 bg-background font-semibold min-h-[44px] sm:min-h-0"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          }
        />

        {/* Assessment Component Weight Breakdown */}
        {components.length > 0 && (
          <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold">
              <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Komponen Bobot Templat:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {components.map((c) => (
                <span key={c.id} className="px-2 py-0.5 rounded-lg bg-background border border-amber-500/30 text-[11px] font-bold text-foreground">
                  {c.name} ({c.weight}%)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Responsive Presentation Adapter (Desktop Table vs Mobile Cards) */}
        <ResponsiveDataGrid
          data={filteredStudents}
          keyExtractor={(s) => s.santriId}
          renderDesktop={() => (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Santri</th>
                    {components.map((c) => (
                      <th key={c.id} className="text-center px-3 py-3 font-medium min-w-[120px]">
                        {c.name} ({c.weight}%)
                      </th>
                    ))}
                    <th className="text-center px-4 py-3 font-medium w-[100px]">Nilai Akhir</th>
                    <th className="text-center px-4 py-3 font-medium w-[120px]">Predikat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((s) => (
                    <tr key={s.santriId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {getInitials(s.santriName)}
                          </div>
                          <span className="font-bold text-foreground">{s.santriName}</span>
                        </div>
                      </td>
                      {components.map((c) => (
                        <td key={c.id} className="px-3 py-2 text-center">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={s.scores[c.id] ?? ''}
                            onChange={(e) => handleScoreChange(s.santriId, c.id, e.target.value)}
                            className="w-20 text-center font-bold text-sm h-9 mx-auto"
                          />
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center font-extrabold text-base text-foreground">
                        {s.finalScore ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.predicate && (
                          <span className={cn('px-2.5 py-1 rounded-full text-xs font-extrabold border', PREDICATE_COLORS[s.predicate] ?? 'bg-muted text-foreground')}>
                            {s.predicate}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          renderMobile={(s, index) => (
            <MobileCard key={s.santriId}>
              <MobileCardHeader>
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {getInitials(s.santriName)}
                  </div>
                  <div className="truncate">
                    <MobileCardTitle>{s.santriName}</MobileCardTitle>
                    <p className="text-[10px] text-muted-foreground">Santri #{index + 1}</p>
                  </div>
                </div>
                {s.predicate && (
                  <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border', PREDICATE_COLORS[s.predicate] ?? 'bg-muted text-foreground')}>
                    {s.predicate}
                  </span>
                )}
              </MobileCardHeader>

              <MobileCardContent>
                <div className="space-y-3 pt-1">
                  {components.map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-3 bg-muted/30 p-2.5 rounded-xl border border-border/40">
                      <div className="space-y-0.5 flex-1">
                        <span className="text-xs font-bold text-foreground block">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground block">Bobot: {c.weight}%</span>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={s.scores[c.id] ?? ''}
                          onChange={(e) => handleScoreChange(s.santriId, c.id, e.target.value)}
                          className="w-full text-center font-black text-base h-11 border-amber-500/40 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </MobileCardContent>

              <MobileCardFooter className="bg-muted/20">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Nilai Akhir:</span>
                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">{s.finalScore ?? '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const el = document.getElementById(`santri-card-${index - 1}`);
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="h-10 px-2.5 text-xs font-semibold"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    )}
                    {index < filteredStudents.length - 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const el = document.getElementById(`santri-card-${index + 1}`);
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="h-10 px-2.5 text-xs font-semibold gap-1"
                      >
                        <span>Lanjut</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </MobileCardFooter>
            </MobileCard>
          )}
        />

        {/* Sticky Action Footer */}
        <div className="mt-6 p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md sticky bottom-4 z-40">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            <span className="font-bold text-foreground">{summary.evaluatedCount} / {summary.totalSantri} Santri</span> telah dinilai. Penghitungan predikat berjalan otomatis.
          </div>
          <Button
            type="button"
            onClick={handleSaveAssessment}
            disabled={isSaving}
            className="w-full sm:w-auto h-11 px-6 text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-lg"
          >
            {isSaving ? (
              <span className="animate-spin text-sm">⏳</span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>SIMPAN NILAI AKADEMIK</span>
          </Button>
        </div>
      </PageCard>
    </div>
  );
}
