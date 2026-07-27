import { CurriculumConfigClient } from '@/components/kurikulum/CurriculumConfigClient';

export function generateStaticParams() {
  return [
    { id: 'prog-formal' },
    { id: 'prog-madin' },
    { id: 'prog-madqur' },
  ];
}

export default function DedicatedCurriculumConfigPage() {
  return <CurriculumConfigClient />;
}
