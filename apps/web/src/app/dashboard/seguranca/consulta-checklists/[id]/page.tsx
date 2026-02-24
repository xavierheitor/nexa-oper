import ChecklistDetalhesPageClient from '@/ui/pages/dashboard/seguranca/ChecklistDetalhesPageClient';

interface ChecklistDetalhesPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChecklistDetalhesPage({
  params,
}: ChecklistDetalhesPageProps) {
  const { id } = await params;

  return <ChecklistDetalhesPageClient id={id} />;
}
