'use client';

import { useState } from 'react';
import { Search, BookOpen, Edit2, Trash2, Plus, GraduationCap } from 'lucide-react';
import type { MasterJenjang, Instansi } from '@/types';
import { INSTANSI_ORDER, INSTANSI_LABEL } from '@/types';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/status-badge';
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

const inputCls = cn(
  'w-full rounded-xl border px-3.5 py-2.5 text-sm text-foreground min-h-[44px]',
  'bg-background border-border',
  'placeholder:text-muted-foreground/40',
  'focus:outline-none focus:ring-2 focus:ring-primary/40',
  'transition-all duration-200',
);

interface Props {
  data: MasterJenjang[];
  programName?: string;
  onCreate: (d: Partial<MasterJenjang>) => void;
  onUpdate: (id: string, d: Partial<MasterJenjang>) => void;
  onDelete: (id: string) => void;
}

export function MasterJenjangTab({ data, programName, onCreate, onUpdate, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [filterInstansi, setFilterInstansi] = useState<'all' | Instansi>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [showAdd, setShowAdd] = useState(false);
  const [editData, setEditData] = useState<MasterJenjang | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form states
  const [formNama, setFormNama] = useState('');
  const [formInstansi, setFormInstansi] = useState<Instansi>('madin');
  const [formIndexes, setFormIndexes] = useState<string>('1, 2, 3');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const openAddModal = () => {
    setFormNama('');
    setFormInstansi('madin');
    setFormIndexes('1, 2, 3');
    setFormStatus('active');
    setShowAdd(true);
  };

  const openEditModal = (j: MasterJenjang) => {
    setEditData(j);
    setFormNama(j.namaJenjang);
    setFormInstansi(j.instansi);
    setFormIndexes(j.progressionIndexes.join(', '));
    setFormStatus(j.status);
  };

  const handleSaveAdd = () => {
    const indexes = formIndexes
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    onCreate({
      namaJenjang: formNama,
      instansi: formInstansi,
      progressionIndexes: indexes,
      status: formStatus,
    });
    setShowAdd(false);
  };

  const handleSaveEdit = () => {
    if (!editData) return;
    const indexes = formIndexes
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    onUpdate(editData.id, {
      namaJenjang: formNama,
      instansi: formInstansi,
      progressionIndexes: indexes,
      status: formStatus,
    });
    setEditData(null);
  };

  const filtered = data.filter((j) => {
    const matchSearch = j.namaJenjang.toLowerCase().includes(search.toLowerCase());
    const matchInstansi = filterInstansi === 'all' || j.instansi === filterInstansi;
    const matchStatus = filterStatus === 'all' || j.status === filterStatus;
    return matchSearch && matchInstansi && matchStatus;
  });

  const activeCount = data.filter((j) => j.status === 'active').length;
  const inactiveCount = data.filter((j) => j.status === 'inactive').length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/30 border border-border rounded-2xl p-3.5 text-center">
          <div className="text-xl sm:text-2xl font-extrabold text-foreground">{data.length}</div>
          <div className="text-xs text-muted-foreground font-medium">Total Jenjang</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 text-center">
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          <div className="text-xs text-muted-foreground font-medium">Aktif</div>
        </div>
        <div className="bg-muted/50 border border-border rounded-2xl p-3.5 text-center">
          <div className="text-xl sm:text-2xl font-extrabold text-muted-foreground">{inactiveCount}</div>
          <div className="text-xs text-muted-foreground font-medium">Nonaktif</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari nama jenjang…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-border rounded-xl bg-background focus:outline-none min-h-[44px]"
            />
          </div>
          <select
            value={filterInstansi}
            onChange={(e) => setFilterInstansi(e.target.value as typeof filterInstansi)}
            className="text-xs border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none min-h-[44px]"
          >
            <option value="all">Semua Madrasah</option>
            {INSTANSI_ORDER.map((i) => (
              <option key={i} value={i}>{INSTANSI_LABEL[i]}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="text-xs border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none min-h-[44px]"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 shrink-0 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm active:scale-95 min-h-[44px]"
        >
          <Plus aria-hidden="true" className="w-4 h-4" />
          <span>Tambah Jenjang</span>
        </button>
      </div>

      {/* Grid Table */}
      <ResponsiveDataGrid
        data={filtered}
        keyExtractor={(j) => j.id}
        renderDesktop={() => (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Nama Jenjang</th>
                  <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Program Kurikulum</th>
                  <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Progression Indexes</th>
                  <th className="text-center px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((j) => (
                  <tr key={j.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3.5 font-bold text-foreground">{j.namaJenjang}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border',
                        j.instansi === 'madin'
                          ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300'
                          : j.instansi === 'madqur'
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300'
                            : 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300',
                      )}>
                        {programName || INSTANSI_LABEL[j.instansi]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {j.progressionIndexes.map((idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-lg bg-muted text-[11px] font-mono font-bold border border-border">
                            {idx}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge
                        status={j.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        variant={j.status === 'active' ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(j)}
                          className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-all min-h-[44px] min-w-[44px] flex items-center justify-center border border-border"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(j.id)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center border border-red-500/20"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        renderMobile={(j) => (
          <MobileCard key={j.id}>
            <MobileCardHeader>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <MobileCardTitle>{j.namaJenjang}</MobileCardTitle>
              </div>
              <StatusBadge
                status={j.status === 'active' ? 'Aktif' : 'Nonaktif'}
                variant={j.status === 'active' ? 'success' : 'neutral'}
              />
            </MobileCardHeader>
            <MobileCardContent>
              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Madrasah:</span>
                  <span className="font-bold text-foreground">{programName || INSTANSI_LABEL[j.instansi]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Tingkat Index:</span>
                  <span className="font-mono font-bold text-foreground">{j.progressionIndexes.join(', ')}</span>
                </div>
              </div>
            </MobileCardContent>
            <MobileCardFooter>
              <MobileRowActions
                primaryAction={{
                  key: 'edit',
                  label: 'Edit',
                  icon: Edit2,
                  onClick: () => openEditModal(j),
                }}
                secondaryActions={[
                  {
                    key: 'delete',
                    label: 'Hapus',
                    icon: Trash2,
                    onClick: () => setDeleteId(j.id),
                    variant: 'destructive',
                  },
                ]}
              />
            </MobileCardFooter>
          </MobileCard>
        )}
      />

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground">Tambah Jenjang Baru</h3>
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase">Nama Jenjang *</label>
                <input
                  type="text"
                  placeholder="e.g. Ula / Tsanawiyah"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase">Madrasah / Program *</label>
                <select
                  value={formInstansi}
                  onChange={(e) => setFormInstansi(e.target.value as Instansi)}
                  className={inputCls}
                >
                  {INSTANSI_ORDER.map((i) => (
                    <option key={i} value={i}>{INSTANSI_LABEL[i]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase">Progression Indexes (pisah koma) *</label>
                <input
                  type="text"
                  placeholder="e.g. 1, 2, 3"
                  value={formIndexes}
                  onChange={(e) => setFormIndexes(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase">Status *</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                  className={inputCls}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-4 py-2.5 text-muted-foreground hover:bg-muted rounded-xl font-bold min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveAdd}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-extrabold shadow-md transition-all active:scale-95 min-h-[44px]"
              >
                Simpan Jenjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground">Edit Jenjang</h3>
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase">Nama Jenjang *</label>
                <input
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase">Madrasah / Program *</label>
                <select
                  value={formInstansi}
                  onChange={(e) => setFormInstansi(e.target.value as Instansi)}
                  className={inputCls}
                >
                  {INSTANSI_ORDER.map((i) => (
                    <option key={i} value={i}>{INSTANSI_LABEL[i]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase">Progression Indexes *</label>
                <input
                  type="text"
                  value={formIndexes}
                  onChange={(e) => setFormIndexes(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase">Status *</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                  className={inputCls}
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditData(null)}
                className="px-4 py-2.5 text-muted-foreground hover:bg-muted rounded-xl font-bold min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-extrabold shadow-md transition-all active:scale-95 min-h-[44px]"
              >
                Perbarui Jenjang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-center">
            <h3 className="text-base font-extrabold text-foreground">Hapus Jenjang?</h3>
            <p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 text-muted-foreground hover:bg-muted rounded-xl font-bold min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(deleteId);
                  setDeleteId(null);
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold shadow-md transition-all min-h-[44px]"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
