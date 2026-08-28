'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageHeader, PageCard } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { 
  Calendar, Plus, CheckCircle2, Clock, Archive, Loader2, 
  Search, BookOpen, Layers
} from 'lucide-react';
import type { AcademicYear, AcademicTerm } from '@/lib/db/services/academic-workspace';
import {
  ResponsiveDataGrid,
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardContent,
  MobileCardFooter,
  ResponsiveFilterBar,
} from '@/components/ui/responsive-data';

// Semantic status mapping
const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  planned: 'warning',
  archived: 'neutral',
};

export default function TahunAjaranPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form State
  const [newYearName, setNewYearName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'planned' | 'active' | 'archived'>('active');

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      const [resYears, resTerms] = await Promise.all([
        fetch('/api/academic/workspace/years'),
        fetch('/api/academic/workspace/terms'),
      ]);

      const dataYears = await resYears.json();
      const dataTerms = await resTerms.json();

      if (dataYears.success) setYears(dataYears.data || []);
      if (dataTerms.success) setTerms(dataTerms.data || []);
    } catch (error) {
      console.error('Failed to fetch academic workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  const handleCreateYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearName || !startDate || !endDate) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/academic/workspace/years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newYearName,
          startDate,
          endDate,
          status,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setNewYearName('');
        setStartDate('');
        setEndDate('');
        fetchWorkspaceData();
      } else {
        alert(json.message || 'Gagal menyimpan tahun ajaran');
      }
    } catch (err) {
      console.error('Failed to create academic year:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Client-side filtering
  const filteredYears = useMemo(() => {
    return years.filter((y) => {
      const matchSearch =
        y.name.toLowerCase().includes(search.toLowerCase()) ||
        y.startDate.includes(search) ||
        y.endDate.includes(search);
      const matchStatus = filterStatus === 'all' || y.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [years, search, filterStatus]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-10">
      {/* Header */}
      <PageHeader
        title="Tahun Ajaran & Semester"
        description="Pengelolaan periode akademik aktif, pembagian semester ganjil/genap, & jangkar temporal santri"
        action={
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tahun Ajaran</span>
          </button>
        }
      />

      <PageCard
        title="Daftar Tahun Ajaran Terdaftar"
        description={`${filteredYears.length} periode akademik ditemukan`}
      >
        <ResponsiveFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari tahun ajaran (e.g. 2026/2027)..."
          activeFilterCount={filterStatus !== 'all' ? 1 : 0}
          onResetFilters={() => setFilterStatus('all')}
          filterContent={
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none min-h-[44px]"
            >
              <option value="all">Semua Status Periode</option>
              <option value="active">Active (Aktif)</option>
              <option value="planned">Planned (Rencana)</option>
              <option value="archived">Archived (Arsip)</option>
            </select>
          }
        />

        {loading ? (
          <div className="flex justify-center items-center py-12 text-muted-foreground text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Memuat data tahun ajaran dari database...</span>
          </div>
        ) : filteredYears.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border border-dashed border-border rounded-2xl">
            <Calendar className="w-10 h-10 text-muted-foreground/60" />
            <div className="text-xs text-muted-foreground">Belum ada tahun ajaran yang sesuai pencarian. Klik tombol di atas untuk menambah.</div>
          </div>
        ) : (
          <ResponsiveDataGrid
            data={filteredYears}
            keyExtractor={(y) => y.id}
            renderDesktop={() => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredYears.map((y) => {
                  const yearTerms = terms.filter((t) => t.academicYearId === y.id);
                  return (
                    <div
                      key={y.id}
                      className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3 relative overflow-hidden hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-extrabold text-base text-foreground">
                          {y.name}
                        </div>
                        <StatusBadge
                          status={y.status.toUpperCase()}
                          variant={STATUS_VARIANT[y.status] ?? 'neutral'}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1.5 pt-1 border-t border-border/50">
                        <p className="font-medium text-foreground">Periode: {y.startDate} s.d. {y.endDate}</p>
                        {yearTerms.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{yearTerms.length} Semester Terdaftar</span>
                          </div>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 font-mono">ID: {y.id}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            renderMobile={(y) => {
              const yearTerms = terms.filter((t) => t.academicYearId === y.id);
              return (
                <MobileCard key={y.id}>
                  <MobileCardHeader>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0 border border-primary/20">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <MobileCardTitle>{y.name}</MobileCardTitle>
                    </div>
                    <StatusBadge
                      status={y.status.toUpperCase()}
                      variant={STATUS_VARIANT[y.status] ?? 'neutral'}
                    />
                  </MobileCardHeader>
                  <MobileCardContent>
                    <div className="space-y-1.5 text-xs pt-1">
                      <p className="font-semibold text-foreground">Tanggal: {y.startDate} - {y.endDate}</p>
                      {yearTerms.length > 0 ? (
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>{yearTerms.length} Semester Aktif Terdaftar</span>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-[11px]">Belum ada semester khusus</p>
                      )}
                      <p className="text-[10px] text-muted-foreground font-mono">Ref ID: {y.id.slice(0, 12)}</p>
                    </div>
                  </MobileCardContent>
                </MobileCard>
              );
            }}
          />
        )}
      </PageCard>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground">
              Tambah Tahun Ajaran Baru
            </h3>
            <form onSubmit={handleCreateYear} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase tracking-wider">Nama Tahun Ajaran *</label>
                <input
                  type="text"
                  placeholder="e.g. 2026/2027"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-foreground uppercase tracking-wider">Tanggal Mulai *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs min-h-[44px]"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-bold text-foreground uppercase tracking-wider">Tanggal Selesai *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs min-h-[44px]"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase tracking-wider">Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold min-h-[44px]"
                >
                  <option value="active">Active (Aktif)</option>
                  <option value="planned">Planned (Rencana)</option>
                  <option value="archived">Archived (Arsip)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-muted-foreground hover:bg-muted rounded-xl font-bold min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-extrabold inline-flex items-center gap-2 min-h-[44px] shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Simpan ke Database</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
