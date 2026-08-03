'use client';

import { Printer, X, Award, CheckCircle } from 'lucide-react';
import { FormattedTranscriptData } from '@/lib/presenters/transcript-presenter';

interface PrintReportCardPDFProps {
  data: FormattedTranscriptData;
  onClose: () => void;
}

export function PrintReportCardPDF({ data, onClose }: PrintReportCardPDFProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/90 backdrop-blur-md flex flex-col items-center p-4 sm:p-8">
      {/* Top Floating Control Bar */}
      <div className="w-full max-w-4xl bg-stone-800 text-white rounded-2xl p-4 mb-6 flex items-center justify-between shadow-2xl border border-stone-700 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Preview Cetak Rapor Santri (A4 Format)</h4>
            <p className="text-xs text-stone-400">
              Pratinjau sebelum mencetak atau menyimpan sebagai file PDF.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Cetak / Simpan PDF
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet A4 Container */}
      <div
        id="printable-report-card"
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-stone-900 p-8 sm:p-12 shadow-2xl rounded-none sm:rounded-lg border border-stone-300 print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Kop Surat Header Pesantren */}
        <div className="border-b-4 border-double border-stone-900 pb-4 mb-6 text-center space-y-1">
          <h2 className="text-2xl font-black tracking-wide uppercase text-stone-900">
            {data.tenantName}
          </h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            Lembaga Pendidikan & Pengasuhan Santri Terpadu
          </p>
          <p className="text-[11px] text-stone-500 italic">
            Jl. Raya Ma'had Terpadu, Kompleks Pesantren SaaS Enterprise
          </p>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold uppercase tracking-wider text-stone-900 underline underline-offset-4">
            Laporan Hasil Belajar Santri (Rapor)
          </h3>
          <p className="text-xs font-medium text-stone-600 mt-1">
            {data.academicYearName} — {data.academicTermName}
          </p>
        </div>

        {/* Student Metadata Table */}
        <div className="mb-6 grid grid-cols-2 gap-4 text-xs font-semibold text-stone-800 border p-4 rounded-lg bg-stone-50/50">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-28 text-stone-500">Nama Santri</span>
              <span className="font-bold text-stone-900">: {data.santriName}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-stone-500">Nomor Induk (NIS)</span>
              <span>: {data.nis}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-28 text-stone-500">Kelas / Halaqah</span>
              <span>: {data.kelas}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-stone-500">Tanggal Cetak</span>
              <span>: {data.formattedDate}</span>
            </div>
          </div>
        </div>

        {/* Academic Ledger Score Table */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-2">
            I. Capaian Nilai Akademik & Evaluasi KBM
          </h4>
          <table className="w-full text-xs text-left border-collapse border border-stone-300">
            <thead>
              <tr className="bg-stone-100 text-stone-900 border-b border-stone-300 font-bold">
                <th className="py-2.5 px-3 border-r border-stone-300 text-center w-12">No</th>
                <th className="py-2.5 px-3 border-r border-stone-300">Kelompok Penilaian</th>
                <th className="py-2.5 px-3 border-r border-stone-300 text-center w-28">Nilai Mentah</th>
                <th className="py-2.5 px-3 text-center w-32">Nilai Terbobot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-300">
              {data.records.map((rec, idx) => (
                <tr key={idx} className="hover:bg-stone-50">
                  <td className="py-2 px-3 border-r border-stone-300 text-center font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 border-r border-stone-300 font-medium">
                    {rec.sourceGroupLabel}
                  </td>
                  <td className="py-2 px-3 border-r border-stone-300 text-center font-semibold">
                    {rec.formattedRawScore}
                  </td>
                  <td className="py-2 px-3 text-center font-bold text-stone-900">
                    {rec.formattedWeightedScore}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Final Score Summary Box */}
        <div className="mb-8 border border-stone-300 rounded-lg p-4 bg-stone-50 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
              Nilai Akhir Rapor & Predikat Total
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-2xl font-black text-stone-900">
                {data.formattedFinalScore}
              </span>
              <span className="text-sm font-extrabold px-3 py-0.5 rounded border border-stone-400 bg-white text-stone-900 uppercase">
                {data.predicate}
              </span>
            </div>
          </div>
          <div className="text-right text-[11px] text-stone-500 italic max-w-xs">
            * Predikat dihitung secara otomatis berdasarkan skema bobot semester yang telah disetujui Pengasuh.
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-12 pt-4 border-t border-stone-200 grid grid-cols-3 gap-4 text-center text-xs font-semibold text-stone-800">
          <div>
            <p className="mb-16">Orang Tua / Wali Santri</p>
            <p className="font-bold underline">( ........................................ )</p>
          </div>
          <div>
            <p className="mb-16">Musyrif / Wali Kelas</p>
            <p className="font-bold underline">( Ustadz Pembimbing )</p>
          </div>
          <div>
            <p className="mb-16">Pengasuh / Mudir Ma'had</p>
            <p className="font-bold underline">( KH. Director Academic )</p>
          </div>
        </div>

        {/* Footer Audit Note */}
        <div className="mt-12 text-center text-[10px] text-stone-400 border-t border-dashed border-stone-200 pt-3">
          Dokumen ini dicetak secara otomatis dari EEOS App Ma'had Enterprise System. Hak Cipta dilindungi.
        </div>
      </div>

      {/* Global CSS for Print Media Override */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          #printable-report-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
