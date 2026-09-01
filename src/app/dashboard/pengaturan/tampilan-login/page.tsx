'use client';

import { useState, useEffect } from 'react';
import { PageCard } from '@/components/shared/page-header';
import {
  CheckCircle2,
  AlertCircle,
  LayoutTemplate,
  Type,
  Image as ImageIcon,
  Palette,
  Tag,
  Loader2,
} from 'lucide-react';

export default function TampilanLoginPage() {
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Branding State (7 Canonical Fields)
  const [title, setTitle] = useState('Ponpes Daruttahuid');
  const [subtitle, setSubtitle] = useState('Malang');
  const [description, setDescription] = useState(
    'Platform tata kelola santri, pemantauan pelanggaran, pembinaan karakter, dan manajemen asrama — terintegrasi dalam satu sistem.'
  );
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [customBgUrl, setCustomBgUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0F766E');
  const [tagline, setTagline] = useState('Sistem Informasi Pesantren Terpadu');

  // Load existing branding settings on mount
  useEffect(() => {
    async function loadBranding() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/tenant/branding');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setTitle(json.data.loginTitle || '');
            setSubtitle(json.data.loginSubtitle || '');
            setDescription(json.data.loginDescription || '');
            setCustomLogoUrl(json.data.customLogoUrl || '');
            setCustomBgUrl(json.data.customBgUrl || '');
            setPrimaryColor(json.data.primaryColor || '#0F766E');
            setTagline(json.data.tagline || 'Sistem Informasi Pesantren Terpadu');
          }
        }
      } catch (err) {
        console.error('Gagal memuat pengaturan branding:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadBranding();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/tenant/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginTitle: title,
          loginSubtitle: subtitle,
          loginDescription: description,
          customLogoUrl: customLogoUrl || null,
          customBgUrl: customBgUrl || null,
          primaryColor: primaryColor || '#0F766E',
          tagline: tagline || 'Sistem Informasi Pesantren Terpadu',
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.error || 'Gagal menyimpan perubahan');
        return;
      }

      showToast(json.message || 'Pengaturan Tampilan Branding Berhasil Disimpan!');
    } catch (err) {
      console.error('Error saving branding:', err);
      setErrorMsg('Terjadi kesalahan koneksi saat menyimpan pengaturan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-stone-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        <span className="text-sm font-medium">Memuat Pengaturan Branding Pesantren...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageCard
        title="Pengaturan Tampilan Login & Branding (CMS)"
        description="Sesuaikan identitas visual, logo, warna aksen, dan deskripsi banner halaman login khusus untuk pesantren Anda."
      >
        {toastMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            {toastMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Settings */}
          <div>
            <form onSubmit={handleSave} className="space-y-5 bg-muted/20 p-6 rounded-2xl border border-border/60">
              <div className="flex items-center gap-2 mb-4">
                <LayoutTemplate className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-foreground">Konten & Identitas Pesantren</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5 flex items-center gap-2">
                  <Type className="w-4 h-4 text-stone-500" /> Nama Pesantren (Judul Banner)
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
                  <Type className="w-4 h-4 text-stone-500" /> Sub-judul (Lokasi / Cabang)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Contoh: Malang"
                  className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-stone-500" /> Tagline Sistem
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Contoh: Sistem Informasi Pesantren Terpadu"
                  className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5 flex items-center gap-2">
                  <Type className="w-4 h-4 text-stone-500" /> Deskripsi Singkat Pesantren
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan deskripsi singkat aplikasi untuk pesantren Anda..."
                  rows={3}
                  className="w-full bg-white border border-stone-200 rounded-lg px-4 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-stone-500" /> URL Logo Kustom
                  </label>
                  <input
                    type="url"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-white border border-stone-200 rounded-lg px-3.5 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-stone-500" /> Warna Utama (HEX)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded border border-stone-200 bg-white cursor-pointer"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#0F766E"
                      className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg py-2.5 px-4 text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Database...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan Branding</span>
                  )}
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
              <div
                style={{ backgroundColor: primaryColor }}
                className="rounded-2xl overflow-hidden border border-border/60 shadow-lg shadow-emerald-900/5 relative p-6 md:p-8 flex flex-col justify-between min-h-[340px] text-white transition-colors duration-300"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] translate-x-1/3 translate-y-1/3" />

                <div className="relative z-10 space-y-4">
                  {/* Company Badge Preview */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-100 text-[10px] font-medium">
                      <span className="font-semibold text-white">{tagline}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                      Madev
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    {customLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={customLogoUrl}
                        alt="Logo"
                        className="w-10 h-10 rounded-xl bg-white/20 object-contain p-1 border border-white/20"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <div className="w-4 h-4 bg-white rounded-sm" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-sm font-bold text-white tracking-tight">{title || 'Nama Pesantren'}</h1>
                      <p className="text-white/80 text-[10px]">{subtitle || 'Subtitle'}</p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                      Madev — <span className="text-white/90">Ma&apos;had Manager</span>
                    </h2>
                    <p className="text-white/80 text-xs mt-1.5 leading-relaxed max-w-[90%]">
                      {description || 'Deskripsi aplikasi akan tampil di sini.'}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/10 text-[10px] text-white/70 flex items-center justify-between">
                  <span>Pesantren Multi-Tenant Enterprise</span>
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
