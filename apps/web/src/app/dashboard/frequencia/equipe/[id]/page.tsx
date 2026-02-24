import { getConsolidadoEquipe } from '@/lib/actions/turno-realizado/getConsolidadoEquipe';
import FrequenciaEquipePageClient from '@/ui/pages/dashboard/frequencia/FrequenciaEquipePageClient';
import { redirect } from 'next/navigation';

interface FrequenciaEquipePageProps {
  params: Promise<{ id: string }>;
}

export default async function FrequenciaEquipePage({
  params,
}: FrequenciaEquipePageProps) {
  const { id } = await params;
  const equipeId = Number(id);

  if (!Number.isFinite(equipeId) || equipeId <= 0) {
    redirect('/dashboard/frequencia');
  }

  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const fimMes = new Date(
    agora.getFullYear(),
    agora.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const result = await getConsolidadoEquipe({
    equipeId,
    dataInicio: inicioMes.toISOString(),
    dataFim: fimMes.toISOString(),
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  return (
    <FrequenciaEquipePageClient
      equipeId={equipeId}
      initialData={result.success ? result.data : undefined}
      initialDataInicioIso={inicioMes.toISOString()}
      initialDataFimIso={fimMes.toISOString()}
    />
  );
}
