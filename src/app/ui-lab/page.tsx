import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isUiLabAllowed } from '@/lib/ui-lab-guard';
import { UiLabClient } from './UiLabClient';

export const metadata: Metadata = {
  title: 'UI Lab Playground — Pratinjau Desain Layanan Ma\'had',
  description: 'Halaman pratinjau terisolasi non-produksi untuk pengujian token tema dan komponen presentasi.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function UiLabPage() {
  // Strict Server-Side Production Guard
  // If VERCEL_ENV is undefined, empty, or 'production', return HTTP 404 strictly.
  if (!isUiLabAllowed('/ui-lab')) {
    notFound();
  }

  return <UiLabClient />;
}

