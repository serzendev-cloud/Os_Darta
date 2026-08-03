'use client';

import { useState, useEffect } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { Calendar, Plus, CheckCircle2, Clock, Archive, Loader2 } from 'lucide-react';
import type { AcademicYear, AcademicTerm } from '@/lib/db/services/academic-workspace';

export default function TahunAjaranPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

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

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-amber-500/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Temporal Academic Hierarchy</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Manajemen Tahun Ajaran & Semester
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-3xl leading-relaxed">
            Pengelolaan periode akademik aktif, pembagian semester ganjil/genap, dan registrasi jangkar temporal transaksi santri.
          </p>
        </div>
      </div>

      <PageCard
        title="Daftar Tahun Ajaran"
        description="Periode akademik terdaftar pada database Drizzle PostgreSQL"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="text-xs text-stone-500">
            Total Periode: <strong>{years.length}</strong>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-xl transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tahun Ajaran</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12 text-stone-500 text-xs gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            <span>Memuat data tahun ajaran dari PostgreSQL...</span>
          </div>
        ) : years.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center border border-dashed border-stone-300 dark:border-stone-800 rounded-2xl">
            <Calendar className="w-10 h-10 text-stone-400" />
            <div className="text-xs text-stone-500">Belum ada tahun ajaran yang dibuat. Klik tombol di atas untuk menambah.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {years.map((y) => (
              <div
                key={y.id}
                className="p-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm space-y-3 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-base text-stone-900 dark:text-white">
                    {y.name}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      y.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : y.status === 'planned'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border border-stone-500/20'
                    }`}
                  >
                    {y.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                    {y.status === 'planned' && <Clock className="w-3 h-3" />}
                    {y.status === 'archived' && <Archive className="w-3 h-3" />}
                    <span className="capitalize">{y.status}</span>
                  </span>
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400 space-y-1">
                  <div>Periode: {y.startDate} s.d. {y.endDate}</div>
                  <div className="text-[11px] text-stone-400">ID: {y.id}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageCard>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-md w-full border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-extrabold text-stone-900 dark:text-white">
              Tambah Tahun Ajaran Baru
            </h3>
            <form onSubmit={handleCreateYear} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">Nama Tahun Ajaran</label>
                <input
                  type="text"
                  placeholder="e.g. 2026/2027"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-stone-700 dark:text-stone-300">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="active">Active (Aktif)</option>
                  <option value="planned">Planned (Rencana)</option>
                  <option value="archived">Archived (Arsip)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium inline-flex items-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
