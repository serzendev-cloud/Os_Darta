'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  Layers,
  Award,
  AlertCircle,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import {
  AssessmentTemplate,
  AssessmentComponent,
  AssessmentSource,
  GradingType,
  getAssessmentTemplates,
  saveAssessmentTemplate,
  deleteAssessmentTemplate,
} from '@/lib/store/assessment-store';
import { cn } from '@/lib/utils';

interface AssessmentTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId?: string;
  onSaved?: () => void;
}

export function AssessmentTemplateModal({
  isOpen,
  onClose,
  programId = 'prog-madin',
  onSaved,
}: AssessmentTemplateModalProps) {
  const [templates, setTemplates] = useState<AssessmentTemplate[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<AssessmentSource>('daily_assessment');
  const [description, setDescription] = useState('');
  const [components, setComponents] = useState<AssessmentComponent[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = () => {
    const list = getAssessmentTemplates(programId);
    setTemplates(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      handleResetForm();
    }
  }, [isOpen, programId]);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setEditingTemplateId(null);
    setTitle('');
    setSource('daily_assessment');
    setDescription('');
    setComponents([
      { id: 'c-1', name: 'Komponen 1', weight: 50, gradingType: 'numeric', maxScore: 100, minScore: 0, passingGrade: 70 },
      { id: 'c-2', name: 'Komponen 2', weight: 50, gradingType: 'numeric', maxScore: 100, minScore: 0, passingGrade: 70 },
    ]);
  };

  const handleEditTemplate = (tmpl: AssessmentTemplate) => {
    setEditingTemplateId(tmpl.id);
    setTitle(tmpl.title);
    setSource(tmpl.source);
    setDescription(tmpl.description || '');
    setComponents(tmpl.components);
  };

  const handleAddComponent = () => {
    const newComp: AssessmentComponent = {
      id: `c-${Date.now()}`,
      name: `Komponen ${components.length + 1}`,
      weight: 20,
      gradingType: 'numeric',
      maxScore: 100,
      minScore: 0,
      passingGrade: 70,
    };
    setComponents([...components, newComp]);
  };

  const handleRemoveComponent = (id: string) => {
    if (components.length <= 1) return;
    setComponents(components.filter((c) => c.id !== id));
  };

  const handleComponentChange = (id: string, field: keyof AssessmentComponent, value: any) => {
    setComponents(
      components.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const totalWeight = components.reduce((acc, curr) => acc + (Number(curr.weight) || 0), 0);
  const isWeightValid = totalWeight === 100;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !isWeightValid) return;

    setIsSaving(true);
    setTimeout(() => {
      const payload: AssessmentTemplate = {
        id: editingTemplateId || `tmpl-${Date.now()}`,
        title,
        source,
        programId,
        description,
        components,
        createdBy: 'Admin Kurikulum',
        role: 'kurikulum',
        isActive: true,
      };

      saveAssessmentTemplate(payload);
      setIsSaving(false);
      loadData();
      handleResetForm();
      onSaved?.();
    }, 300);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus templat penilaian ini?')) {
      deleteAssessmentTemplate(id, programId);
      loadData();
      if (editingTemplateId === id) handleResetForm();
    }
  };

  const sourceLabels: Record<AssessmentSource, string> = {
    office_exam: 'Ujian Resmi Kantor',
    teacher_assessment: 'Penilaian Pengajar',
    daily_assessment: 'Penilaian Harian',
    practice: 'Penilaian Praktik',
    memorization: 'Setoran Hafalan',
    assignment: 'Tugas Mandiri',
    behaviour: 'Observasi Karakter',
    custom: 'Penilaian Custom',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-amber-950 to-stone-900 text-white flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Assessment Engine &bull; Management</span>
            </div>
            <h2 className="text-xl font-black text-white">
              Manajemen Templat & Komponen Penilaian
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 text-stone-300 hover:text-white hover:bg-white/20 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split View (Left: Existing Templates, Right: Form Editor) */}
        <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Template List */}
          <div className="md:col-span-4 space-y-3 border-r border-stone-200 dark:border-stone-800 pr-0 md:pr-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <span className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider">
                Daftar Templat ({templates.length})
              </span>
              <button
                type="button"
                onClick={handleResetForm}
                className="px-2 py-1 rounded-lg bg-amber-500 text-white font-bold text-[10px] hover:bg-amber-600 transition-all"
              >
                + Buat Baru
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleEditTemplate(tmpl)}
                  className={cn(
                    'p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5',
                    editingTemplateId === tmpl.id
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md'
                      : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 hover:border-amber-400'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-900 dark:text-white">
                      {tmpl.title}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(tmpl.id);
                      }}
                      className="text-stone-400 hover:text-rose-500 p-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                      {sourceLabels[tmpl.source]}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      {tmpl.components.length} Komponen
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Template Form Builder */}
          <form onSubmit={handleSave} className="md:col-span-8 space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-stone-900 dark:text-white">
                {editingTemplateId ? 'Edit Templat Penilaian' : 'Buat Templat Penilaian Baru'}
              </h3>
              <p className="text-xs text-stone-500">
                Tentukan komponen, pembobotan %, dan skala penilaian untuk digunakan pengajar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                  Judul Templat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Ujian Tahriri Bulanan"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                  Kategori Source Ledger <span className="text-rose-500">*</span>
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as AssessmentSource)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="daily_assessment">Penilaian Harian (Daily)</option>
                  <option value="office_exam">Ujian Resmi Kantor (Office Exam)</option>
                  <option value="teacher_assessment">Penilaian Pengajar (Teacher)</option>
                  <option value="practice">Penilaian Praktik (Practice)</option>
                  <option value="memorization">Setoran Hafalan (Memorization)</option>
                  <option value="assignment">Tugas Mandiri (Assignment)</option>
                  <option value="behaviour">Observasi Karakter (Behaviour)</option>
                  <option value="custom">Penilaian Custom</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                Deskripsi / Petunjuk Pengajar (Opsional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Petunjuk teknis pengisian untuk guru..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-medium text-stone-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Dynamic Components Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>Komponen Penilaian & Pembobotan</span>
                </span>

                <div className="flex items-center gap-3">
                  <span className={cn(
                    'text-xs font-black px-2.5 py-0.5 rounded-md border',
                    isWeightValid
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
                  )}>
                    Total Bobot: {totalWeight}% {isWeightValid ? '✓' : '(Wajib 100%)'}
                  </span>

                  <button
                    type="button"
                    onClick={handleAddComponent}
                    className="px-3 py-1 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Komponen</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {components.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        value={comp.name}
                        onChange={(e) => handleComponentChange(comp.id, 'name', e.target.value)}
                        placeholder="Nama Komponen..."
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-900 dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-1">
                      <span className="text-[11px] font-bold text-stone-500">Bobot:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={comp.weight}
                        onChange={(e) => handleComponentChange(comp.id, 'weight', Number(e.target.value))}
                        className="w-16 px-2 py-1.5 text-center rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-black"
                      />
                      <span className="text-xs font-bold">%</span>
                    </div>

                    <div className="sm:col-span-3">
                      <select
                        value={comp.gradingType}
                        onChange={(e) => handleComponentChange(comp.id, 'gradingType', e.target.value as GradingType)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-xs font-bold"
                      >
                        <option value="numeric">Angka (0-100)</option>
                        <option value="predicate">Predikat (Mumtaz)</option>
                        <option value="letter">Huruf (A/B/C/D)</option>
                        <option value="pass_fail">Pass / Fail</option>
                      </select>
                    </div>

                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(comp.id)}
                        className="text-stone-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={!isWeightValid || isSaving}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Templat Penilaian'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
