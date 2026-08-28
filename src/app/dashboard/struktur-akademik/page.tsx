'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { MasterJenjangTab, MasterTingkatTab } from '@/components/struktur-akademik';
import { useCollection } from '@/hooks';
import { masterJenjangService, masterTingkatService } from '@/lib/db/services';
import type { MasterJenjang, MasterTingkat } from '@/types';
import { cn } from '@/lib/utils';
import { 
  CurriculumProgram, 
  getStoredCurriculums, 
  CURRICULUM_STORE_CHANGE_EVENT 
} from '@/lib/store/curriculum-store';
import Link from 'next/link';
import { Building2, GraduationCap, Layers, Sparkles, Settings } from 'lucide-react';

const SECONDARY_TABS = [
  { id: 'jenjang' as const, label: 'Master Jenjang', icon: GraduationCap },
  { id: 'tingkat' as const, label: 'Master Tingkat', icon: Layers },
];

export default function StrukturAkademikPage() {
  const searchParams = useSearchParams();
  const progParam = searchParams.get('prog');
  const typeParam = searchParams.get('type');
  const instansiParam = searchParams.get('instansi');

  const {
    data: jenjangList,
    loading: jenjangLoading,
    error: jenjangError,
  } = useCollection<MasterJenjang>('masterJenjang', [], { realtime: true });

  const {
    data: tingkatList,
    loading: tingkatLoading,
    error: tingkatError,
  } = useCollection<MasterTingkat>('masterTingkat', [], { realtime: true });

  // ── Dynamic Madrasah Store State ──────────────────────────────────────────
  const [madrasahPrograms, setMadrasahPrograms] = useState<CurriculumProgram[]>([]);
  const [selectedMadrasahId, setSelectedMadrasahId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'jenjang' | 'tingkat'>('jenjang');

  useEffect(() => {
    const syncMadrasahs = () => {
      const active = getStoredCurriculums().filter(p => p.status === 'active');
      setMadrasahPrograms(active);
    };
    syncMadrasahs();
    window.addEventListener(CURRICULUM_STORE_CHANGE_EVENT, syncMadrasahs);
    return () => window.removeEventListener(CURRICULUM_STORE_CHANGE_EVENT, syncMadrasahs);
  }, []);

  const scopedProgramId = useMemo(() => {
    if (!madrasahPrograms.length) return null;
    if (progParam) {
      const found = madrasahPrograms.find(p => p.id === progParam);
      if (found) return found.id;
    }
    if (typeParam || instansiParam) {
      const target = (typeParam || instansiParam || '').toLowerCase();
      if (target === 'madin' || target === 'pesantren') {
        const found = madrasahPrograms.find(p => p.id === 'prog-madin' || p.typeCategory === 'pesantren');
        if (found) return found.id;
      }
      if (target === 'formal' || target === 'depag') {
        const found = madrasahPrograms.find(p => p.id === 'prog-formal' || p.typeCategory === 'formal');
        if (found) return found.id;
      }
      if (target === 'quran' || target === 'madqur') {
        const found = madrasahPrograms.find(p => p.id === 'prog-madqur' || p.typeCategory === 'quran');
        if (found) return found.id;
      }
    }
    return null;
  }, [progParam, typeParam, instansiParam, madrasahPrograms]);

  useEffect(() => {
    if (scopedProgramId) {
      setSelectedMadrasahId(scopedProgramId);
    }
  }, [scopedProgramId]);

  const loading = jenjangLoading || tingkatLoading;
  const error = jenjangError || tingkatError;

  // Filtered Jenjang & Tingkat based on selected Madrasah
  const filteredJenjangList = useMemo(() => {
    if (selectedMadrasahId === 'all') return jenjangList;
    const prog = madrasahPrograms.find(p => p.id === selectedMadrasahId);
    if (!prog) return jenjangList;

    // Match by instansi category mapping
    let instansiTarget = 'madin';
    if (prog.typeCategory === 'quran' || prog.code.includes('QUR')) instansiTarget = 'madqur';
    else if (prog.typeCategory === 'formal' || prog.code.includes('FORMAL')) instansiTarget = 'depag';

    return jenjangList.filter(j => j.instansi === instansiTarget);
  }, [jenjangList, selectedMadrasahId, madrasahPrograms]);

  const filteredTingkatList = useMemo(() => {
    if (selectedMadrasahId === 'all') return tingkatList;
    const prog = madrasahPrograms.find(p => p.id === selectedMadrasahId);
    if (!prog) return tingkatList;

    let instansiTarget = 'madin';
    if (prog.typeCategory === 'quran' || prog.code.includes('QUR')) instansiTarget = 'madqur';
    else if (prog.typeCategory === 'formal' || prog.code.includes('FORMAL')) instansiTarget = 'depag';

    return tingkatList.filter(t => t.instansi === instansiTarget);
  }, [tingkatList, selectedMadrasahId, madrasahPrograms]);

  // ── CRUD: Jenjang ──────────────────────────────────────────────────────
  const handleCreateJenjang = useCallback(
    async (data: Partial<MasterJenjang>) => {
      try {
        const newId = await masterJenjangService.create({
          namaJenjang: data.namaJenjang ?? '',
          instansi: data.instansi ?? 'madin',
          progressionIndexes: data.progressionIndexes ?? [],
          status: data.status ?? 'active',
        });
        toast.success(`Jenjang "${data.namaJenjang}" berhasil dibuat.`);
      } catch (err) {
        console.error('[handleCreateJenjang] Error:', err);
        toast.error('Gagal membuat jenjang. Silakan coba lagi.');
      }
    },
    [],
  );

  const handleUpdateJenjang = useCallback(
    async (id: string, data: Partial<MasterJenjang>) => {
      try {
        await masterJenjangService.update(id, data);
        toast.success(`Jenjang "${data.namaJenjang}" berhasil diperbarui.`);
      } catch (err) {
        console.error('Gagal memperbarui jenjang:', err);
        toast.error('Gagal memperbarui jenjang. Silakan coba lagi.');
      }
    },
    [],
  );

  const handleDeleteJenjang = useCallback(
    async (id: string) => {
      try {
        await masterJenjangService.delete(id);
        toast.success('Jenjang berhasil dihapus.');
      } catch (err) {
        console.error('Gagal menghapus jenjang:', err);
        toast.error('Gagal menghapus jenjang. Silakan coba lagi.');
      }
    },
    [],
  );

  // ── CRUD: Tingkat ──────────────────────────────────────────────────────
  const handleCreateTingkat = useCallback(
    async (data: Partial<MasterTingkat>) => {
      try {
        await masterTingkatService.create({
          instansi: data.instansi ?? 'madin',
          progressionIndex: data.progressionIndex ?? 0,
          tingkatLabel: data.tingkatLabel ?? '',
          jenjangId: data.jenjangId ?? '',
          status: data.status ?? 'active',
        });
        toast.success(`Tingkat "${data.tingkatLabel}" berhasil dibuat.`);
      } catch (err) {
        console.error('Gagal membuat tingkat:', err);
        toast.error('Gagal membuat tingkat. Silakan coba lagi.');
      }
    },
    [],
  );

  const handleUpdateTingkat = useCallback(
    async (id: string, data: Partial<MasterTingkat>) => {
      try {
        await masterTingkatService.update(id, data);
        toast.success(`Tingkat "${data.tingkatLabel}" berhasil diperbarui.`);
      } catch (err) {
        console.error('Gagal memperbarui tingkat:', err);
        toast.error('Gagal memperbarui tingkat. Silakan coba lagi.');
      }
    },
    [],
  );

  const handleDeleteTingkat = useCallback(
    async (id: string) => {
      try {
        await masterTingkatService.delete(id);
        toast.success('Tingkat berhasil dihapus.');
      } catch (err) {
        console.error('Gagal menghapus tingkat:', err);
        toast.error('Gagal menghapus tingkat. Silakan coba lagi.');
      }
    },
    [],
  );

  if (loading) return <LoadingState type="card" count={6} />;
  if (error) return <ErrorState message="Gagal memuat data struktur akademik." onRetry={() => window.location.reload()} />;

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Master Struktur Akademik (Jenjang & Tingkat Overview)"
        description="Pusat matriks overview hirarki jenjang dan tingkat seluruh Program Madrasah"
      />

      {/* Helper Banner for Isolated Program Management */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-stone-800 dark:text-stone-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
          <span>
            <strong>Pengelolaan Terisolasi Per-Program:</strong> Struktur Jenjang & Tingkat kini dapat dikelola langsung secara spesifik dari Halaman Konfigurasi Setiap Program Madrasah.
          </span>
        </div>
        {selectedMadrasahId !== 'all' && (
          <Link
            href={`/dashboard/kurikulum/master/${selectedMadrasahId}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 transition-all shadow-sm"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Buka Konfigurasi Program Ini</span>
          </Link>
        )}
      </div>

      {/* ── 1. PRIMARY LEVEL TABS: DYNAMIC MADRASAH PROGRAM TABS ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider">
          <Building2 className="w-3.5 h-3.5 text-amber-500" />
          <span>Pilih Program Madrasah:</span>
        </div>

        <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border shadow-inner">
          {!scopedProgramId && (
            <button
              type="button"
              onClick={() => setSelectedMadrasahId('all')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 min-h-[44px]',
                selectedMadrasahId === 'all'
                  ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                  : 'text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Semua Program Madrasah</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-md text-[10px] bg-background text-foreground border border-border">
                {jenjangList.length}
              </span>
            </button>
          )}

          {(scopedProgramId ? madrasahPrograms.filter(p => p.id === scopedProgramId) : madrasahPrograms).map((prog) => {
            const isSelected = selectedMadrasahId === prog.id;
            return (
              <button
                key={prog.id}
                type="button"
                onClick={() => setSelectedMadrasahId(prog.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 min-h-[44px]',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                    : 'text-foreground bg-card hover:bg-muted/60 border border-border'
                )}
              >
                <Building2 className={cn('w-3.5 h-3.5', isSelected ? 'text-primary-foreground' : 'text-primary')} />
                <span>{prog.name}</span>
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono',
                  isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  {prog.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. SECONDARY LEVEL TABS: MASTER JENJANG & MASTER TINGKAT ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="flex gap-2 bg-muted p-1 rounded-2xl border border-border">
          {SECONDARY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 min-h-[44px]',
                  isActive
                    ? 'bg-card text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <span className="text-xs font-medium text-stone-500 hidden sm:inline">
          Menampilkan hirarki untuk: <strong className="text-stone-900 dark:text-white">
            {selectedMadrasahId === 'all' ? 'Semua Madrasah' : madrasahPrograms.find(p => p.id === selectedMadrasahId)?.name}
          </strong>
        </span>
      </div>

      {/* ── 3. CONTENT TAB TABLES ── */}
      {activeTab === 'jenjang' ? (
        <MasterJenjangTab
          data={filteredJenjangList}
          onCreate={handleCreateJenjang}
          onUpdate={handleUpdateJenjang}
          onDelete={handleDeleteJenjang}
        />
      ) : (
        <MasterTingkatTab
          data={filteredTingkatList}
          jenjangList={jenjangList}
          onCreate={handleCreateTingkat}
          onUpdate={handleUpdateTingkat}
          onDelete={handleDeleteTingkat}
        />
      )}
    </div>
  );
}
