import { listAtividadeMedidores } from '@/lib/actions/atividade/listMedidores';
import type { AtividadeMedidorPaginated } from '@/lib/types/atividadeDashboard';
import { getLastMonthDateRange } from '@/lib/utils/dateHelpers';
import AtividadesMedidoresPageClient from '@/ui/pages/dashboard/atividades/AtividadesMedidoresPageClient';
import { redirect } from 'next/navigation';

export default async function AtividadesMedidoresPage() {
  const { inicio, fim } = getLastMonthDateRange();

  const result = await listAtividadeMedidores({
    page: 1,
    pageSize: 10,
    orderBy: 'createdAt',
    orderDir: 'desc',
    dataInicio: inicio,
    dataFim: fim,
  });

  if (result.redirectToLogin) {
    redirect('/login');
  }

  const initialData: AtividadeMedidorPaginated | undefined =
    result.success && result.data
      ? (result.data as AtividadeMedidorPaginated)
      : undefined;

  return <AtividadesMedidoresPageClient initialData={initialData} />;
}
