import { getConsolidadoEletricista } from '@/lib/actions/turno-realizado/getConsolidadoEletricista';
import FrequenciaEletricistaPageClient from '@/ui/pages/dashboard/frequencia/FrequenciaEletricistaPageClient';
import { redirect } from 'next/navigation';

interface FrequenciaEletricistaPageProps {
  params: Promise<{ id: string }>;
}

export default async function FrequenciaEletricistaPage({
  params,
}: FrequenciaEletricistaPageProps) {
  const { id } = await params;
  const eletricistaId = Number(id);

  if (!Number.isFinite(eletricistaId) || eletricistaId <= 0) {
    redirect('/dashboard/frequencia');
  }

  const result = await getConsolidadoEletricista({
    eletricistaId,
    periodo: 'mes',
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  return (
    <FrequenciaEletricistaPageClient
      eletricistaId={eletricistaId}
      initialData={result.success ? result.data : undefined}
    />
  );
}
