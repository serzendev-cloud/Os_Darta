'use client';

import { useState, useEffect } from 'react';
import { PageCard } from '@/components/shared/page-header';
import {
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CreditCard,
  Search,
} from 'lucide-react';
import Link from 'next/link';

interface CampaignSummary {
  id: string;
  title: string;
  category: string;
  academicYear?: string;
  totalTargetSantri: number;
  totalAmount: number;
  amountPerStudent: number;
  publishDate: string;
  dueDate: string;
}

export default function RekapitulasiIndexPage() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finance/billing/campaigns', {
        headers: { 'x-tenant-id': 'default' },
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setCampaigns(json.data);
      } else {
        // Fallback demo mock
        setCampaigns([
          {
            id: 'camp_spp_juli',
            title: 'SPP Rutin Bulanan — Juli 2026',
            category: 'SPP',
            academicYear: '2026/2027',
            totalTargetSantri: 120,
            amountPerStudent: 1000000,
            totalAmount: 120000000,
            publishDate: '2026-07-01',
            dueDate: '2026-07-10',
          },
          {
            id: 'camp_demo_001',
            title: 'Biaya Ujian Penilaian Akhir Semester (PAS) Ganjil',
            category: 'UJIAN',
            academicYear: '2026/2027',
            totalTargetSantri: 120,
            amountPerStudent: 250000,
            totalAmount: 30000000,
            publishDate: '2026-10-01',
            dueDate: '2026-10-25',
          },
          {
            id: 'camp_demo_002',
            title: 'Seragam Batik & Olahraga Baru Santri',
            category: 'SERAGAM',
            academicYear: '2026/2027',
            totalTargetSantri: 45,
            amountPerStudent: 600000,
            totalAmount: 27000000,
            publishDate: '2026-10-05',
            dueDate: '2026-10-30',
          },
        ]);
      }
    } catch {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const filtered = campaigns.filter((c) => {
    if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
    if (searchQuery.trim() && !c.title.toLowerCase().includes(searchQuery.toLowerCase().trim())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageCard
        title="Rekapitulasi Pembayaran & Piutang Santri"
        description="Pantau tingkat pelunasan per tagihan, santri lunas, pembayaran sebagian, piutang tertunggak, dan ekspor laporan resmi"
      >
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama tagihan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-muted/40 border border-border text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['ALL', 'SPP', 'UJIAN', 'SERAGAM', 'KEGIATAN'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  categoryFilter === cat
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat === 'ALL' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Clock className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm">Memuat daftar rekapitulasi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Layers className="w-12 h-12 text-emerald-600 opacity-40" />
            <p className="font-semibold text-base text-foreground">Tidak Ada Tagihan yang Cocok</p>
            <p className="text-xs">Coba ubah kata kunci pencarian atau kategori filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-border bg-background hover:border-emerald-500/50 transition-all shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">
                      {item.category}
                    </span>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Tempo: {new Date(item.dueDate).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-foreground line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tahun Ajaran: {item.academicYear || '2026/2027'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jumlah Sasaran:</span>
                    <span className="font-semibold text-foreground">{item.totalTargetSantri} Santri</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nominal / Santri:</span>
                    <span className="font-bold text-foreground">
                      Rp {item.amountPerStudent.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/50 pt-1">
                    <span className="text-muted-foreground">Total Ditagih:</span>
                    <span className="font-extrabold text-emerald-600">
                      Rp {item.totalAmount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/dashboard/keuangan/rekap/${item.id}`}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors min-h-[38px]"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Buka Rekapitulasi & Ekspor
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </PageCard>
    </div>
  );
}
