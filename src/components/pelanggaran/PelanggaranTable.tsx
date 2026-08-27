'use client';

import { Search, Eye } from 'lucide-react';
import {
  SEVERITY_COLORS,
  STATUS_COLORS,
  STATUS_LABEL,
  HUKUMAN_COLORS,
} from './constants';
import type { Pelanggaran, PelanggaranSeverity } from '@/types';
import {
  ResponsiveDataGrid,
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardContent,
  MobileCardFooter,
  ResponsiveFilterBar,
  MobileRowActions,
} from '@/components/ui/responsive-data';

export type StatusFilter = 'all' | 'confirmed';
export type SeverityFilter = 'all' | PelanggaranSeverity;

interface PelanggaranTableProps {
  data: Pelanggaran[];
  search: string;
  filterStatus: StatusFilter;
  filterSeverity: SeverityFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onSeverityChange: (value: SeverityFilter) => void;
  onDetail?: (item: Pelanggaran) => void;
}

export function PelanggaranTable({
  data,
  search,
  filterStatus,
  filterSeverity,
  onSearchChange,
  onStatusChange,
  onSeverityChange,
  onDetail,
}: PelanggaranTableProps) {
  const activeFilterCount = (filterStatus !== 'all' ? 1 : 0) + (filterSeverity !== 'all' ? 1 : 0);

  return (
    <>
      {/* Filters */}
      <ResponsiveFilterBar
        searchValue={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Cari nama santri atau jenis pelanggaran..."
        activeFilterCount={activeFilterCount}
        onResetFilters={() => {
          onStatusChange('all');
          onSeverityChange('all');
        }}
        filterContent={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <label htmlFor="filter-status" className="sr-only">
              Filter status pelanggaran
            </label>
            <select
              id="filter-status"
              value={filterStatus}
              onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="confirmed">Dikonfirmasi</option>
            </select>

            <label htmlFor="filter-severity" className="sr-only">
              Filter tingkat pelanggaran
            </label>
            <select
              id="filter-severity"
              value={filterSeverity}
              onChange={(e) => onSeverityChange(e.target.value as SeverityFilter)}
              className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none"
            >
              <option value="all">Semua Tingkat</option>
              <option value="ringan">Ringan</option>
              <option value="sedang">Sedang</option>
              <option value="berat">Berat</option>
              <option value="sangat_berat">Sangat Berat</option>
            </select>
          </div>
        }
      />

      {/* Responsive Presentation Adapter (Desktop Table vs Mobile Cards) */}
      <ResponsiveDataGrid
        data={data}
        keyExtractor={(p) => p.id}
        renderDesktop={() => (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Santri</th>
                  <th className="text-left px-4 py-3 font-medium">Pelanggaran</th>
                  <th className="text-left px-4 py-3 font-medium">Tingkat</th>
                  <th className="text-left px-4 py-3 font-medium">Poin</th>
                  <th className="text-left px-4 py-3 font-medium">Tanggal</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Hukuman</th>
                  {onDetail && <th className="text-left px-4 py-3 font-medium">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          aria-hidden="true"
                          className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0"
                        >
                          {p.santriName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="font-medium">{p.santriName}</p>
                          <p className="text-xs text-muted-foreground">oleh {p.reportedBy}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.pelanggaranName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${SEVERITY_COLORS[p.severity]}`}>
                        {p.severity.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-red-600 dark:text-red-400">-{p.points}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.date}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] || STATUS_COLORS.confirmed}`}>
                        {STATUS_LABEL[p.status] || 'Dikonfirmasi'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${HUKUMAN_COLORS[p.statusHukuman]}`}>
                        {p.statusHukuman}
                      </span>
                    </td>
                    {onDetail && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onDetail(p)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Lihat detail"
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        renderMobile={(p) => (
          <MobileCard key={p.id}>
            <MobileCardHeader>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {p.santriName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="truncate">
                  <MobileCardTitle>{p.santriName}</MobileCardTitle>
                  <p className="text-[10px] text-muted-foreground">oleh {p.reportedBy}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold capitalize ${SEVERITY_COLORS[p.severity]}`}>
                {p.severity.replace('_', ' ')}
              </span>
            </MobileCardHeader>
            <MobileCardContent>
              <div className="space-y-1 pt-1 text-xs">
                <p className="font-semibold text-foreground">{p.pelanggaranName}</p>
                <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
                  <span className="text-[11px]">Poin Disiplin: <strong className="text-red-600 dark:text-red-400">-{p.points}</strong></span>
                  <span className="text-[10px]">{p.date}</span>
                </div>
              </div>
            </MobileCardContent>
            <MobileCardFooter>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${HUKUMAN_COLORS[p.statusHukuman]}`}>
                {p.statusHukuman}
              </span>
              {onDetail && (
                <MobileRowActions
                  primaryAction={{
                    key: 'detail',
                    label: 'Detail',
                    icon: Eye,
                    onClick: () => onDetail(p),
                  }}
                />
              )}
            </MobileCardFooter>
          </MobileCard>
        )}
      />
    </>
  );
}

