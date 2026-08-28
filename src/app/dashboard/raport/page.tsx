'use client';

import { useState, useMemo } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import {
  FileSpreadsheet,
  Printer,
  Eye,
  Award,
  BookOpen,
  CheckCircle2,
  Lock,
  Sparkles,
  Search,
  Download,
  ShieldCheck,
  FileText,
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
import { useCollection } from '@/hooks';
import type { Santri } from '@/types';
import {
  buildTranscriptPresenter,
  FormattedTranscriptData,
  getPredicateBadgeClass,
  getStatusBadgeClass,
} from '@/lib/presenters/transcript-presenter';
import { TranscriptViewModal } from '@/components/akademik/TranscriptViewModal';
import { PrintReportCardPDF } from '@/components/akademik/PrintReportCardPDF';
import { cn } from '@/lib/utils';

// Helper initials
const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('');

export default function RaportPage() {
  const { data: santriList } = useCollection<Santri>('santri');
  const [search, setSearch] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('Semester Ganjil 2025/2026');
  const [selectedKelas, setSelectedKelas] = useState('all');
  const [viewTranscriptData, setViewTranscriptData] = useState<FormattedTranscriptData | null>(null);
  const [printPdfData, setPrintPdfData] = useState<FormattedTranscriptData | null>(null);

  // Generate canonical formatted transcript presentation list
  const transcriptsList: FormattedTranscriptData[] = useMemo(() => {
    if (santriList.length === 0) {
      // Demo fallback canonical list
      return [
        buildTranscriptPresenter(
          { id: 'tr-1', santriId: 's1', academicTermId: 'term-1', finalScore: 92.5, predicate: 'Mumtaz', rankInClass: 1, isLocked: true },
          [
            { id: 'r1', santriId: 's1', academicTermId: 'term-1', mapelId: 'm1', sourceGroup: 'office_exam', rawScore: 95, weightedScore: 38 },
            { id: 'r2', santriId: 's1', academicTermId: 'term-1', mapelId: 'm1', sourceGroup: 'daily_assessment', rawScore: 90, weightedScore: 27 },
            { id: 'r3', santriId: 's1', academicTermId: 'term-1', mapelId: 'm1', sourceGroup: 'memorization', rawScore: 92, weightedScore: 27.5 },
          ],
          {
            santriName: 'Ahmad Fauzi',
            nis: '2024001',
            kelas: '7 Abu Bakar',
            academicTermName: 'Semester Ganjil',
            academicYearName: '2025/2026',
            tenantName: 'Pesantren Al-Hikmah',
          }
        ),
        buildTranscriptPresenter(
          { id: 'tr-2', santriId: 's2', academicTermId: 'term-1', finalScore: 84.0, predicate: 'Jayyid Jiddan', rankInClass: 2, isLocked: true },
          [
            { id: 'r4', santriId: 's2', academicTermId: 'term-1', mapelId: 'm1', sourceGroup: 'office_exam', rawScore: 85, weightedScore: 34 },
            { id: 'r5', santriId: 's2', academicTermId: 'term-1', mapelId: 'm1', sourceGroup: 'daily_assessment', rawScore: 82, weightedScore: 24.6 },
            { id: 'r6', santriId: 's2', academicTermId: 'term-1', mapelId: 'm1', sourceGroup: 'memorization', rawScore: 85, weightedScore: 25.5 },
          ],
          {
            santriName: 'Muhammad Rizky',
            nis: '2024002',
            kelas: '7 Abu Bakar',
            academicTermName: 'Semester Ganjil',
            academicYearName: '2025/2026',
            tenantName: 'Pesantren Al-Hikmah',
          }
        ),
      ];
    }

    return santriList.slice(0, 10).map((s, idx) => {
      const mockScore = 88 - (idx * 2);
      const predicate = mockScore >= 90 ? 'Mumtaz' : mockScore >= 80 ? 'Jayyid Jiddan' : 'Jayyid';
      return buildTranscriptPresenter(
        {
          id: `tr-${s.id}`,
          santriId: s.id,
          academicTermId: 'term-1',
          finalScore: mockScore,
          predicate,
          rankInClass: idx + 1,
          isLocked: true,
        },
        [
          { id: `r-${s.id}-1`, santriId: s.id, academicTermId: 'term-1', mapelId: 'm1', sourceGroup: 'office_exam', rawScore: mockScore + 2, weightedScore: (mockScore + 2) * 0.4 },
          { id: `r-${s.id}-2`, santriId: s.id, academicTermId: 'term-1', mapelId: 'm1', sourceGroup: 'daily_assessment', rawScore: mockScore - 1, weightedScore: (mockScore - 1) * 0.3 },
          { id: `r-${s.id}-3`, santriId: s.id, academicTermId: 'term-1', mapelId: 'm1', sourceGroup: 'memorization', rawScore: mockScore, weightedScore: mockScore * 0.3 },
        ],
        {
          santriName: s.name,
          nis: s.nis ?? `202400${idx + 1}`,
          kelas: s.kelas ?? '7 Abu Bakar',
          academicTermName: 'Semester Ganjil',
          academicYearName: '2025/2026',
          tenantName: 'Ma\'had Manager Enterprise',
        }
      );
    });
  }, [santriList]);

  // Filtered Transcripts
  const filteredTranscripts = useMemo(() => {
    return transcriptsList.filter((t) => {
      const matchSearch = t.santriName.toLowerCase().includes(search.toLowerCase()) || t.nis.includes(search);
      const matchKelas = selectedKelas === 'all' || t.kelas === selectedKelas;
      return matchSearch && matchKelas;
    });
  }, [transcriptsList, search, selectedKelas]);

  return (
    <div className="space-y-6 font-sans pb-16">
      {/* Transcript View Modal */}
      {viewTranscriptData && (
        <TranscriptViewModal
          isOpen={!!viewTranscriptData}
          onClose={() => setViewTranscriptData(null)}
          data={viewTranscriptData}
        />
      )}

      {/* PDF Print Modal */}
      {printPdfData && (
        <PrintReportCardPDF
          data={printPdfData}
          onClose={() => setPrintPdfData(null)}
        />
      )}

      <PageCard
        title="Laporan Hasil Belajar (Raport Santri)"
        description="Transkrip akademik formal, rekapitulasi nilai per kelompok mata pelajaran, dan cetak rapor PDF resmi."
      >
        {/* Metric Summary Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" /> Total Rapor Terkunci
            </span>
            <div className="text-lg font-black text-foreground">{transcriptsList.length} Santri</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Rata-Rata Angkatan
            </span>
            <div className="text-lg font-black text-amber-600 dark:text-amber-400">86.4</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Predikat Mumtaz
            </span>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {transcriptsList.filter((t) => t.predicate === 'Mumtaz').length} Santri
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" /> Status Pengesahan
            </span>
            <div className="text-lg font-black text-purple-600 dark:text-purple-400">Resmi / Locked</div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <ResponsiveFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari nama santri atau NIS..."
          filterContent={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="flex flex-col">
                <label htmlFor="select-term-raport" className="sr-only">Pilih Semester</label>
                <select
                  id="select-term-raport"
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="text-xs border border-border rounded-xl px-3 py-2 bg-background font-semibold min-h-[44px] sm:min-h-0"
                >
                  <option value="Semester Ganjil 2025/2026">Semester Ganjil 2025/2026</option>
                  <option value="Semester Genap 2024/2025">Semester Genap 2024/2025</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label htmlFor="select-kelas-raport" className="sr-only">Filter Kelas</label>
                <select
                  id="select-kelas-raport"
                  value={selectedKelas}
                  onChange={(e) => setSelectedKelas(e.target.value)}
                  className="text-xs border border-border rounded-xl px-3 py-2 bg-background font-semibold min-h-[44px] sm:min-h-0"
                >
                  <option value="all">Semua Kelas</option>
                  <option value="7 Abu Bakar">7 Abu Bakar</option>
                  <option value="7 Umar">7 Umar</option>
                  <option value="8 Utsman">8 Utsman</option>
                </select>
              </div>
            </div>
          }
        />

        {/* Responsive Presentation Adapter (Desktop Table vs Mobile Cards) */}
        <ResponsiveDataGrid
          data={filteredTranscripts}
          keyExtractor={(t) => t.santriId}
          renderDesktop={() => (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-muted-foreground">
                    <th className="text-left px-4 py-3 font-medium">Santri</th>
                    <th className="text-left px-4 py-3 font-medium">NIS</th>
                    <th className="text-left px-4 py-3 font-medium">Kelas</th>
                    <th className="text-center px-4 py-3 font-medium">Nilai Akhir</th>
                    <th className="text-center px-4 py-3 font-medium">Predikat</th>
                    <th className="text-center px-4 py-3 font-medium">Status Rapor</th>
                    <th className="text-center px-4 py-3 font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTranscripts.map((t) => (
                    <tr key={t.santriId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {getInitials(t.santriName)}
                          </div>
                          <span>{t.santriName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{t.nis}</td>
                      <td className="px-4 py-3 text-muted-foreground">{t.kelas}</td>
                      <td className="px-4 py-3 text-center font-extrabold text-base text-foreground">
                        {t.formattedFinalScore}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-extrabold border', getPredicateBadgeClass(t.predicate))}>
                          {t.predicate}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider', getStatusBadgeClass(t.status))}>
                          {t.isLocked && <Lock className="w-3 h-3 inline mr-1" />}
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setViewTranscriptData(t)}
                            className="h-8 px-2.5 text-xs gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Detail
                          </Button>
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => setPrintPdfData(t)}
                            className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <Printer className="w-3.5 h-3.5" /> PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          renderMobile={(t) => (
            <MobileCard key={t.santriId}>
              <MobileCardHeader>
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                    {getInitials(t.santriName)}
                  </div>
                  <div className="truncate">
                    <MobileCardTitle>{t.santriName}</MobileCardTitle>
                    <p className="text-[10px] text-muted-foreground">NIS: {t.nis} • {t.kelas}</p>
                  </div>
                </div>
                <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border', getPredicateBadgeClass(t.predicate))}>
                  {t.predicate}
                </span>
              </MobileCardHeader>

              <MobileCardContent>
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/40">
                    <span className="text-xs text-muted-foreground font-semibold">Nilai Akhir Rapor:</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{t.formattedFinalScore}</span>
                  </div>

                  {/* Summary Breakdown per Category */}
                  <div className="space-y-1.5 pt-1">
                    {t.records.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs px-1">
                        <span className="text-muted-foreground">{r.sourceGroupLabel}:</span>
                        <span className="font-bold text-foreground">{r.formattedRawScore}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </MobileCardContent>

              <MobileCardFooter>
                <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider', getStatusBadgeClass(t.status))}>
                  {t.isLocked && <Lock className="w-3 h-3 inline mr-1" />}
                  {t.status}
                </span>

                <MobileRowActions
                  primaryAction={{
                    key: 'pdf',
                    label: 'Cetak PDF',
                    icon: Printer,
                    onClick: () => setPrintPdfData(t),
                  }}
                  secondaryActions={[
                    {
                      key: 'detail',
                      label: 'Lihat Transkrip Detail',
                      icon: Eye,
                      onClick: () => setViewTranscriptData(t),
                    },
                  ]}
                />
              </MobileCardFooter>
            </MobileCard>
          )}
        />
      </PageCard>
    </div>
  );
}
