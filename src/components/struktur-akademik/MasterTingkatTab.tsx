'use client';

import { useState, useMemo } from 'react';
import { Search, Layers, Edit2, Trash2, Plus } from 'lucide-react';
import type { MasterTingkat, MasterJenjang, Instansi } from '@/types';
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
  data: MasterTingkat[];
  jenjangList: MasterJenjang[];
  programName?: string;
  onCreate: (d: Partial<MasterTingkat>) => void;
  onUpdate: (id: string, d: Partial<MasterTingkat>) => void;
  onDelete: (id: string) => void;
}

export function MasterTingkatTab({ data, jenjangList, programName, onCreate, onUpdate, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [filterInstansi, setFilterInstansi] = useState<'all' | Instansi>('all');
  const [filterJenjangId, setFilterJenjangId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const [showAdd, setShowAdd] = useState(false);
  const [editData, setEditData] = useState<MasterTingkat | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formProgIndex, setFormProgIndex] = useState<number>(1);
  const [formLabel, setFormLabel] = useState('');
  const [formInstansi, setFormInstansi] = useState<Instansi>('madin');
  const [formJenjangId, setFormJenjangId] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const jenjangForFilter = useMemo(() => {
    if (filterInstansi === 'all') return jenjangList.filter((j) => j.status === 'active');
    return jenjangList.filter((j) => j.instansi === filterInstansi && j.status === 'active');
  }, [jenjangList, filterInstansi]);

  const jenjangNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const j of jenjangList) map[j.id] = j.namaJenjang;
    return map;
  }, [jenjangList]);

  const openAddModal = () => {
    setFormProgIndex(1);
    setFormLabel('');
    setFormInstansi('madin');
    setFormJenjangId(jenjangList[0]?.id || '');
    setFormStatus('active');
    setShowAdd(true);
  };

  const openEditModal = (t: MasterTingkat) => {
    setEditData(t);
    setFormProgIndex(t.progressionIndex);
    setFormLabel(t.tingkatLabel);
    setFormInstansi(t.instansi);
    setFormJenjangId(t.jenjangId);
    setFormStatus(t.status);
  };

  const handleSaveAdd = () => {
    onCreate({
      progressionIndex: formProgIndex,
      tingkatLabel: formLabel,
      instansi: formInstansi,
      jenjangId: formJenjangId,
      status: formStatus,
    });
    setShowAdd(false);
  };

  const handleSaveEdit = () => {
    if (!editData) return;
    onUpdate(editData.id, {
      progressionIndex: formProgIndex,
      tingkatLabel: formLabel,
      instansi: formInstansi,
      jenjangId: formJenjangId,
      status: formStatus,
    });
    setEditData(null);
  };

  const filtered = data.filter((t) => {
    const matchSearch =
      t.tingkatLabel.toLowerCase().includes(search.toLowerCase()) ||
      String(t.progressionIndex).includes(search);
    const matchInstansi = filterInstansi === 'all' || t.instansi === filterInstansi;
    const matchJenjang = filterJenjangId === 'all' || t.jenjangId === filterJenjangId;
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchInstansi && matchJenjang && matchStatus;
  });

  const activeCount = data.filter((t) => t.status === 'active').length;
  const inactiveCount = data.filter((t) => t.status === 'inactive').length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/30 border border-border rounded-2xl p-3.5 text-center">
          <div className="text-xl sm:text-2xl font-extrabold text-foreground">{data.length}</div>
          <div className="text-xs text-muted-foreground font-medium">Total Tingkat</div>
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari tingkat atau label…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-border rounded-xl bg-background focus:outline-none min-h-[44px]"
            />
          </div>
          <select
            value={filterInstansi}
            onChange={(e) => {
              setFilterInstansi(e.target.value as typeof filterInstansi);
              setFilterJenjangId('all');
            }}
            className="text-xs border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none min-h-[44px]"
          >
            <option value="all">Semua Madrasah</option>
            {INSTANSI_ORDER.map((i) => (
              <option key={i} value={i}>{INSTANSI_LABEL[i]}</option>
            ))}
          </select>
          <select
            value={filterJenjangId}
            onChange={(e) => setFilterJenjangId(e.target.value)}
            className="text-xs border border-border rounded-xl px-3 py-2.5 bg-background focus:outline-none min-h-[44px]"
          >
            <option value="all">Semua Jenjang</option>
            {jenjangForFilter.map((j) => (
              <option key={j.id} value={j.id}>{j.namaJenjang}</option>
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
          <span>Tambah Tingkat</span>
        </button>
      </div>

      {/* Grid Table */}
      <ResponsiveDataGrid
        data={filtered}
        keyExtractor={(t) => t.id}
        renderDesktop={() => (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="text-center px-4 py-3.5 font-bold text-xs uppercase tracking-wider w-20">Prog. Index</th>
                  <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Label Tingkat</th>
                  <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Program Kurikulum</th>
                  <th className="text-left px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Jenjang</th>
                  <th className="text-center px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3.5 font-bold text-xs uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-primary">{t.progressionIndex}</td>
                    <td className="px-4 py-3.5 font-bold text-foreground">{t.tingkatLabel}</td>
                    <td className="px-4 py-3.5">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border',
                        t.instansi === 'madin'
                          ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-300'
                          : t.instansi === 'madqur'
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-300'
                            : 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-300',
                      )}>
                        {programName || INSTANSI_LABEL[t.instansi]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground font-semibold">
                      {jenjangNameMap[t.jenjangId] || '-'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge
                        status={t.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        variant={t.status === 'active' ? 'success' : 'neutral'}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(t)}
                          className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-all min-h-[44px] min-w-[44px] flex items-center justify-center border border-border"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(t.id)}
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
        renderMobile={(t) => (
          <MobileCard key={t.id}>
            <MobileCardHeader>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <MobileCardTitle>{t.tingkatLabel}</MobileCardTitle>
              </div>
              <StatusBadge
                status={t.status === 'active' ? 'Aktif' : 'Nonaktif'}
                variant={t.status === 'active' ? 'success' : 'neutral'}
              />
            </MobileCardHeader>
            <MobileCardContent>
              <div className="space-y-2 text-xs pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Prog. Index:</span>
                  <span className="font-mono font-extrabold text-primary">{t.progressionIndex}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Madrasah:</span>
                  <span className="font-bold text-foreground">{programName || INSTANSI_LABEL[t.instansi]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">Jenjang:</span>
                  <span className="font-bold text-foreground">{jenjangNameMap[t.jenjangId] || '-'}</span>
                </div>
              </div>
            </MobileCardContent>
            <MobileCardFooter>
              <MobileRowActions
                primaryAction={{
                  key: 'edit',
                  label: 'Edit',
                  icon: Edit2,
                  onClick: () => openEditModal(t),
                }}
                secondaryActions={[
                  {
                    key: 'delete',
                    label: 'Hapus',
                    icon: Trash2,
                    onClick: () => setDeleteId(t.id),
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
            <h3 className="text-base font-extrabold text-foreground">Tambah Tingkat Baru</h3>
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase">Progression Index *</label>
                <input
                  type="number"
                  placeholder="1"
                  value={formProgIndex}
                  onChange={(e) => setFormProgIndex(parseInt(e.target.value, 10) || 1)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase">Label Tingkat *</label>
                <input
                  type="text"
                  placeholder="e.g. Tingkat 1 / Kelas X"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
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
                <label className="block font-bold text-foreground uppercase">Jenjang Induk *</label>
                <select
                  value={formJenjangId}
                  onChange={(e) => setFormJenjangId(e.target.value)}
                  className={inputCls}
                >
                  {jenjangList.map((j) => (
                    <option key={j.id} value={j.id}>{j.namaJenjang}</option>
                  ))}
                </select>
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
                Simpan Tingkat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-3xl p-6 border border-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <h3 className="text-base font-extrabold text-foreground">Edit Tingkat</h3>
            <div className="space-y-3.5 text-xs">
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase">Progression Index *</label>
                <input
                  type="number"
                  value={formProgIndex}
                  onChange={(e) => setFormProgIndex(parseInt(e.target.value, 10) || 1)}
                  className={inputCls}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-bold text-foreground uppercase">Label Tingkat *</label>
                <input
                  type="text"
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
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
                <label className="block font-bold text-foreground uppercase">Jenjang Induk *</label>
                <select
                  value={formJenjangId}
                  onChange={(e) => setFormJenjangId(e.target.value)}
                  className={inputCls}
                >
                  {jenjangList.map((j) => (
                    <option key={j.id} value={j.id}>{j.namaJenjang}</option>
                  ))}
                </select>
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
                Perbarui Tingkat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 border border-border shadow-2xl space-y-4 animate-in fade-in zoom-in-95 text-center">
            <h3 className="text-base font-extrabold text-foreground">Hapus Tingkat?</h3>
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
