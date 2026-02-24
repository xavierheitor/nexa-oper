import TipoEscalaDetailPageClient from '@/ui/pages/dashboard/cadastro/TipoEscalaDetailPageClient';

interface TipoEscalaDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function TipoEscalaDetailPage({
  params,
}: TipoEscalaDetailPageProps) {
  const { id } = await params;

  return <TipoEscalaDetailPageClient id={id} />;
}
