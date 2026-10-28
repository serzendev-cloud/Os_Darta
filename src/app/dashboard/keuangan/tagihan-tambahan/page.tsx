'use client';

import { useState, useEffect, useTransition } from 'react';
import { PageCard } from '@/components/shared/page-header';
import {
  PlusCircle,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Users,
  AlertCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

interface CampaignItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  academicYear?: string;
  amountPerStudent: number;
  publishDate: string;
  dueDate: string;
  targetType: string;
  totalTargetSantri: number;
  totalAmount: number;
  allowInstallments: boolean;
  status: string;
  publishedByName: string;
}

export default function TagihanTambahanPage() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'UJIAN' | 'KEGIATAN' | 'SERAGAM' | 'DAFTAR_ULANG' | 'LAINNYA'>('UJIAN');
  const [description, setDescription] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [amountPerStudent, setAmountPerStudent] = useState<number>(250000);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [targetType, setTargetType] = useState<'ALL_ACTIVE' | 'KELAS'>('ALL_ACTIVE');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['7A', '7B']);
  const [allowInstallments, setAllowInstallments] = useState(false);

  const availableClasses = ['7A', '7B', '8A', '8B', '9A', '9B', '10A', '10B', '11A', '11B', '12A', '12B'];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance/billing/campaigns', {
        headers: {
          'x-tenant-id': 'default',
        },
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setCampaigns(json.data);
      } else {
        // Fallback demo mock
        setCampaigns([
          {
            id: 'camp_demo_001',
            title: 'Biaya Ujian Penilaian Akhir Semester (PAS) Ganjil',
            category: 'UJIAN',
            description: 'Biaya cetak naskah soal dan administrasi pengawas ujian',
            academicYear: '2026/2027',
            amountPerStudent: 250000,
            publishDate: new Date().toISOString(),
            dueDate: new Date(Date.now() + 20 * 86400000).toISOString(),
            targetType: 'ALL_ACTIVE',
            totalTargetSantri: 120,
            totalAmount: 30000000,
            allowInstallments: false,
            status: 'PUBLISHED',
            publishedByName: 'Ustadz Bendahara Keuangan',
          },
          {
            id: 'camp_demo_002',
            title: 'Seragam Batik & Olahraga Baru Santri',
            category: 'SERAGAM',
            description: 'Pengadaan 2 stel pakaian seragam pondok',
            academicYear: '2026/2027',
            amountPerStudent: 600000,
            publishDate: new Date(Date.now() - 5 * 86400000).toISOString(),
            dueDate: new Date(Date.now() + 25 * 86400000).toISOString(),
            targetType: 'KELAS',
            totalTargetSantri: 45,
            totalAmount: 27000000,
            allowInstallments: true,
            status: 'PUBLISHED',
            publishedByName: 'Ustadz Bendahara Keuangan',
          },
        ]);
      }
    } catch {
      // Fallback display
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleToggleClass = (cls: string) => {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const res = await fetch('/api/finance/billing/campaigns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': 'admin_keuangan_001',
            'x-user-name': 'Ustadz Bendahara Keuangan',
            'x-tenant-id': 'default',
          },
          body: JSON.stringify({
            title,
            category,
            description,
            academicYear,
            amountPerStudent,
            dueDate,
            targetType,
            targetClasses: targetType === 'KELAS' ? selectedClasses : [],
            allowInstallments,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Gagal menerbitkan tagihan tambahan');
        }

        setShowCreateModal(false);
        showToast(data.message || 'Tagihan tambahan berhasil diterbitkan!');
        fetchCampaigns();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Penerbitan tagihan gagal';
        alert(msg);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageCard
        title="Penerbitan & Administrasi Tagihan Tambahan"
        description="Kelola tagihan non-SPP (Ujian, Kegiatan, Seragam, Daftar Ulang) dengan sasaran rombel/kelas, pencegahan duplikasi, dan integrasi portal wali santri"
      >
        {toastMsg && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div>
            <h3 className="font-bold text-base text-foreground">Daftar Tagihan Tambahan Diterbitkan</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Setiap tagihan otomatis tampil pada portal wali santri yang bersangkutan
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors min-h-[40px]"
          >
            <PlusCircle className="w-4 h-4" />
            Terbitkan Tagihan Baru
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Clock className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm">Memuat daftar tagihan tambahan...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Layers className="w-12 h-12 text-emerald-600 opacity-40" />
            <p className="font-semibold text-base text-foreground">Belum Ada Tagihan Tambahan</p>
            <p className="text-xs">Klik tombol &quot;Terbitkan Tagihan Baru&quot; untuk membuat tagihan ujian atau kegiatan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-5 rounded-2xl border border-border bg-background hover:border-emerald-500/50 transition-all shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                      {camp.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Tempo: {new Date(camp.dueDate).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-foreground mt-2">{camp.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {camp.description || 'Tidak ada deskripsi'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nominal per Santri:</span>
                    <span className="font-extrabold text-foreground">
                      Rp {camp.amountPerStudent.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sasaran Santri:</span>
                    <span className="font-semibold">{camp.totalTargetSantri} Santri ({camp.targetType})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Nilai Tagihan:</span>
                    <span className="font-bold text-emerald-600">
                      Rp {camp.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <span className="text-[11px] text-muted-foreground">
                    Oleh: {camp.publishedByName}
                  </span>

                  <Link
                    href={`/dashboard/keuangan/rekap/${camp.id}`}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-600/20 transition-colors flex items-center gap-1.5"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Lihat Rekapitulasi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageCard>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-background border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base text-foreground">Terbitkan Tagihan Tambahan Baru</h3>
                <p className="text-xs text-muted-foreground">Otomatis didistribusikan ke tagihan santri sasaran</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublish} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Nama / Judul Tagihan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Biaya Ujian Akhir Semester Ganjil"
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Kategori</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="UJIAN">Ujian</option>
                    <option value="KEGIATAN">Kegiatan</option>
                    <option value="SERAGAM">Seragam</option>
                    <option value="DAFTAR_ULANG">Daftar Ulang</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Amount & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Nominal per Santri (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1000}
                    value={amountPerStudent}
                    onChange={(e) => setAmountPerStudent(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-xs font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Tanggal Jatuh Tempo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Keterangan / Rincian Tagihan</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan untuk wali santri..."
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Target Type */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Sasaran Penerima Tagihan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType('ALL_ACTIVE')}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      targetType === 'ALL_ACTIVE'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-border text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    Seluruh Santri Aktif
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('KELAS')}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      targetType === 'KELAS'
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                        : 'border-border text-muted-foreground hover:bg-muted/30'
                    }`}
                  >
                    Berdasarkan Rombel / Kelas
                  </button>
                </div>
              </div>

              {/* Class Selection if targetType === 'KELAS' */}
              {targetType === 'KELAS' && (
                <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                  <label className="block text-xs font-bold text-foreground mb-2">Pilih Kelas Sasaran:</label>
                  <div className="flex flex-wrap gap-2">
                    {availableClasses.map((cls) => {
                      const isSelected = selectedClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => handleToggleClass(cls)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-background border border-border text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {cls}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Allow Installments Toggle */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground">Izinkan Pengajuan Cicilan</span>
                  <p className="text-[11px] text-muted-foreground">Wali santri dapat mengajukan angsuran dengan approval pondok</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowInstallments}
                  onChange={(e) => setAllowInstallments(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending || !title.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isPending ? 'Menerbitkan...' : 'Konfirmasi & Terbitkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
