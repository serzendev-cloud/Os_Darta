'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { CheckCircle2, LayoutTemplate, Type, Image as ImageIcon } from 'lucide-react';

export default function TampilanLoginPage() {
  const [toastMsg, setToastMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock initial state for preview
  const [title, setTitle] = useState("Ponpes Daruttahuid");
  const [subtitle, setSubtitle] = useState("Malang");
  const [description, setDescription] = useState("Platform tata kelola santri, pemantauan pelanggaran, pembinaan karakter, dan manajemen asrama — terintegrasi dalam satu sistem.");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call to save settings
    await new Promise(res => setTimeout(res, 1000));
    
    setIsSubmitting(false);
    showToast("Pengaturan Tampilan Login Berhasil Disimpan!");
  };

  return (
    <div className="space-y-6">
      <PageCard
        title="Pengaturan Tampilan Login (CMS)"
        description="Sesuaikan teks banner dan deskripsi pada halaman login utama khusus untuk pesantren Anda."
      >
        {toastMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            {toastMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Settings */}
          <div>
            <form onSubmit={handleSave} className="space-y-5 bg-muted/20 p-6 rounded-2xl border border-border/60">
              <div className="flex items-center gap-2 mb-4">
                <LayoutTemplate className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-foreground">Konten Banner Login</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5 flex items-center gap-2">
                  <Type className="w-4 h-4 text-stone-500" /> Nama Pesantren (Title)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Ponpes Daruttahuid"
                  className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5 flex items-center gap-2">
                  <Type className="w-4 h-4 text-stone-500" /> Sub-judul (Subtitle)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Contoh: Malang"
                  className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5 flex items-center gap-2">
                  <Type className="w-4 h-4 text-stone-500" /> Deskripsi Singkat
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan deskripsi singkat aplikasi untuk pesantren Anda..."
                  rows={4}
                  className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-none"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg py-2.5 px-4 text-sm transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview */}
          <div>
            <div className="sticky top-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" /> Live Preview
              </h3>
              <div className="rounded-2xl overflow-hidden border border-border/60 shadow-lg shadow-emerald-900/5 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 relative p-6 md:p-8 flex flex-col justify-between min-h-[300px] text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_60%)]" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-emerald-600/20 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3" />
                
                <div className="relative z-10 space-y-4">
                  {/* Company Badge Preview */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-100 text-[10px] font-medium">
                      <span className="font-semibold text-white">Serene Zeith Corp</span>
                      <span className="text-white/40">•</span>
                      <span className="text-emerald-200">serzen_dev</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                      Madev
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <div className="w-4 h-4 bg-emerald-300 rounded-sm" />
                    </div>
                    <div>
                      <h1 className="text-sm font-bold text-white tracking-tight">{title || 'Nama Pesantren'}</h1>
                      <p className="text-emerald-200 text-[10px]">{subtitle || 'Subtitle'}</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                      Madev — <span className="text-emerald-300">Ma&apos;had Manager</span>
                    </h2>
                    <p className="text-emerald-100/80 text-xs mt-1.5 leading-relaxed max-w-[90%]">
                      {description || 'Deskripsi aplikasi akan tampil di sini.'}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/10 text-[10px] text-emerald-300/80 flex items-center justify-between">
                  <span>Company: Serene Zeith Corp</span>
                  <span>Produk: Madev</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
